/**
 * seed-schedule.ts
 *
 * Reads from scripts/data/schedule-2026.json and upserts games into the database.
 * Idempotent: re-running upserts on source_game_key without duplicating rows.
 *
 * Usage:
 *   npm run seed:schedule              # seed all weeks in the JSON file
 *   npm run seed:schedule -- --week 1  # seed only a specific week
 */

import { db } from "../server/db.js";
import {
  nflTeams,
  seasons,
  weeks,
  games,
  scheduleImports,
} from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface GameEntry {
  away: string;
  home: string;
  date: string;
  time: string | null;
  neutral?: boolean;
  site?: string;
  broadcast?: string;
  flex?: boolean;
}

interface WeekEntry {
  week: number;
  games: GameEntry[];
}

interface ScheduleFile {
  _note?: string;
  _source?: string;
  weeks: WeekEntry[];
}

// Parse an ET time string + date into a UTC Date.
// time is "HH:MM" in Eastern Time. date is "YYYY-MM-DD" in local/league time.
// NFL games are Eastern Time. We convert ET → UTC manually (ET = UTC-5 standard, UTC-4 daylight).
// September is daylight saving time in the US, so ET = UTC-4.
function parseKickoffUtc(date: string, timeEt: string | null): Date | null {
  if (!timeEt) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = timeEt.split(":").map(Number);
  // September–December games are EDT (UTC-4) through first Sunday of November,
  // then EST (UTC-5). Simple heuristic: Sep/Oct/early-Nov = UTC-4, mid-Nov+ = UTC-5.
  const utcOffsetHours = month <= 10 ? 4 : 5;
  return new Date(Date.UTC(year, month - 1, day, hour + utcOffsetHours, minute));
}

function makeSourceGameKey(week: number, away: string, home: string, neutral: boolean): string {
  const awaySlug = away.toLowerCase();
  const homeSlug = home.toLowerCase();
  return neutral
    ? `2026-regular-week-${String(week).padStart(2, "0")}-${awaySlug}-vs-${homeSlug}-neutral`
    : `2026-regular-week-${String(week).padStart(2, "0")}-${awaySlug}-at-${homeSlug}`;
}

async function main() {
  const args = process.argv.slice(2);
  const weekArg = args.includes("--week") ? Number(args[args.indexOf("--week") + 1]) : null;

  // Load schedule data
  const dataPath = join(__dirname, "data", "schedule-2026.json");
  const scheduleData: ScheduleFile = JSON.parse(readFileSync(dataPath, "utf-8"));

  if (scheduleData._note) {
    console.log(`NOTE: ${scheduleData._note}`);
  }

  // Load the 2026 season
  const [season] = await db.select().from(seasons).where(eq(seasons.year, 2026));
  if (!season) {
    console.error("No 2026 season found. Run npm run seed:season first.");
    process.exit(1);
  }

  // Build team abbreviation → id map
  const allTeams = await db.select({ id: nflTeams.id, abbreviation: nflTeams.abbreviation }).from(nflTeams);
  const teamByAbbr = new Map(allTeams.map((t) => [t.abbreviation, t.id]));

  // Build week number → week id map
  const allWeeks = await db.select({ id: weeks.id, weekNumber: weeks.weekNumber })
    .from(weeks)
    .where(and(eq(weeks.seasonId, season.id), eq(weeks.phase, "regular")));
  const weekById = new Map(allWeeks.map((w) => [w.weekNumber, w.id]));

  // Create a schedule_imports audit row
  const [importRow] = await db.insert(scheduleImports).values({
    seasonId: season.id,
    sourceUrl: scheduleData._source ?? null,
    sourceName: "NFL Football Operations (manual JSON)",
    sourceFetchedAt: new Date(),
    status: "staged",
    notes: scheduleData._note ?? null,
  }).returning();

  console.log(`\nSchedule import audit row: ${importRow.id}`);

  let totalInserted = 0;
  let totalUpdated = 0;
  const errors: string[] = [];

  // Filter to target week(s)
  const weeksToProcess = weekArg
    ? scheduleData.weeks.filter((w) => w.week === weekArg)
    : scheduleData.weeks;

  if (weeksToProcess.length === 0) {
    console.error(weekArg ? `No data found for week ${weekArg} in schedule file.` : "No weeks found in schedule file.");
    process.exit(1);
  }

  for (const weekEntry of weeksToProcess) {
    const weekId = weekById.get(weekEntry.week);
    if (!weekId) {
      console.error(`  Week ${weekEntry.week}: no matching week row in database. Skipping.`);
      errors.push(`Week ${weekEntry.week} not found in DB`);
      continue;
    }

    console.log(`\nWeek ${weekEntry.week}: processing ${weekEntry.games.length} games...`);

    for (const g of weekEntry.games) {
      const awayId = teamByAbbr.get(g.away);
      const homeId = teamByAbbr.get(g.home);

      if (!awayId) { errors.push(`Week ${weekEntry.week}: unknown away team "${g.away}"`); continue; }
      if (!homeId) { errors.push(`Week ${weekEntry.week}: unknown home team "${g.home}"`); continue; }

      const neutral = g.neutral ?? false;
      const kickoffUtc = parseKickoffUtc(g.date, g.time ?? null);
      const sourceGameKey = makeSourceGameKey(weekEntry.week, g.away, g.home, neutral);

      const gameValues = {
        seasonId: season.id,
        weekId,
        sourceGameKey,
        awayTeamId: awayId,
        homeTeamId: homeId,
        kickoffAtUtc: kickoffUtc,
        kickoffStatus: g.time ? ("scheduled" as const) : ("time_tbd" as const),
        pickCutoffAtUtc: kickoffUtc,
        neutralSite: neutral,
        siteName: g.site ?? null,
        broadcast: g.broadcast ?? null,
        isSubjectToChange: g.flex ?? false,
        displayOrder: 0,
      };

      const existing = await db.select({ id: games.id })
        .from(games)
        .where(eq(games.sourceGameKey, sourceGameKey));

      if (existing.length > 0) {
        await db.update(games).set({
          ...gameValues,
          updatedAt: new Date(),
        }).where(eq(games.sourceGameKey, sourceGameKey));
        totalUpdated++;
        console.log(`  updated: ${g.away} @ ${g.home} (${g.date})`);
      } else {
        await db.insert(games).values(gameValues);
        totalInserted++;
        console.log(`  inserted: ${g.away} @ ${g.home} (${g.date})`);
      }
    }
  }

  // Update audit row to imported
  await db.update(scheduleImports)
    .set({ status: errors.length === 0 ? "imported" : "failed" })
    .where(eq(scheduleImports.id, importRow.id));

  console.log(`\n--- Summary ---`);
  console.log(`Inserted: ${totalInserted}  Updated: ${totalUpdated}`);
  if (errors.length > 0) {
    console.error(`Errors (${errors.length}):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log("Done. All games seeded successfully.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
