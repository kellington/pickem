/**
 * Seed the games table from data/schedule-2026.json (produced by fetch-schedule.ts).
 *
 *   npm run seed:games
 *
 * Idempotent: games are upserted on sourceGameKey, so re-running after a re-fetch
 * applies schedule changes (e.g. flexed kickoff times) without duplicating rows.
 *
 * Requires DATABASE_URL. Outside Replit, put it in a .env file at the repo root.
 * Run seed:teams and seed:season first — this script fails loudly if the season,
 * any week, or any team referenced by the schedule is missing.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../server/db.js";
import { seasons, weeks, nflTeams, games } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

const SEASON_YEAR = 2026;

// ESPN abbreviations that differ from our nfl_teams.abbreviation values.
const ABBR_ALIASES: Record<string, string> = {
  WSH: "WAS", // Washington Commanders
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEDULE_PATH = resolve(__dirname, "../data/schedule-2026.json");

function resolveAbbr(espnAbbr: string): string {
  return ABBR_ALIASES[espnAbbr] ?? espnAbbr;
}

async function seedGames() {
  const file = JSON.parse(readFileSync(SCHEDULE_PATH, "utf8"));
  const scheduleGames: any[] = file.games ?? [];
  console.log(`Loaded ${scheduleGames.length} games from ${SCHEDULE_PATH}`);

  const [season] = await db.select().from(seasons).where(eq(seasons.year, SEASON_YEAR));
  if (!season) {
    throw new Error(`No ${SEASON_YEAR} season found. Run: npm run seed:season`);
  }

  // weekNumber -> week.id (regular-season weeks for this season)
  const weekRows = await db
    .select()
    .from(weeks)
    .where(and(eq(weeks.seasonId, season.id), eq(weeks.phase, "regular")));
  const weekByNumber = new Map<number, string>(weekRows.map((w) => [w.weekNumber, w.id]));

  // abbreviation -> team.id
  const teamRows = await db.select().from(nflTeams);
  const teamByAbbr = new Map<string, string>(teamRows.map((t) => [t.abbreviation, t.id]));

  let inserted = 0;
  let updated = 0;

  for (const g of scheduleGames) {
    const weekId = weekByNumber.get(g.weekNumber);
    if (!weekId) {
      throw new Error(`No regular-season week ${g.weekNumber} for ${SEASON_YEAR}. Run: npm run seed:season`);
    }

    const awayAbbr = resolveAbbr(g.awayAbbr);
    const homeAbbr = resolveAbbr(g.homeAbbr);
    const awayTeamId = teamByAbbr.get(awayAbbr);
    const homeTeamId = teamByAbbr.get(homeAbbr);
    if (!awayTeamId) throw new Error(`Unknown away team "${g.awayAbbr}" (resolved "${awayAbbr}"). Run: npm run seed:teams`);
    if (!homeTeamId) throw new Error(`Unknown home team "${g.homeAbbr}" (resolved "${homeAbbr}"). Run: npm run seed:teams`);

    const kickoff = g.kickoffAtUtc ? new Date(g.kickoffAtUtc) : null;

    const values = {
      seasonId: season.id,
      weekId,
      sourceGameKey: g.sourceGameKey,
      awayTeamId,
      homeTeamId,
      kickoffAtUtc: kickoff,
      kickoffStatus: "scheduled" as const,
      // Default the pick cutoff to kickoff; can be overridden manually later.
      pickCutoffAtUtc: kickoff,
      neutralSite: Boolean(g.neutralSite),
      siteName: g.siteName ?? null,
      siteCity: g.siteCity ?? null,
      siteCountry: g.siteCountry ?? null,
      broadcast: g.broadcast ?? null,
      displayOrder: g.displayOrder ?? 0,
      updatedAt: new Date(),
    };

    const result = await db
      .insert(games)
      .values(values)
      .onConflictDoUpdate({
        target: games.sourceGameKey,
        set: {
          weekId: values.weekId,
          awayTeamId: values.awayTeamId,
          homeTeamId: values.homeTeamId,
          kickoffAtUtc: values.kickoffAtUtc,
          kickoffStatus: values.kickoffStatus,
          pickCutoffAtUtc: values.pickCutoffAtUtc,
          neutralSite: values.neutralSite,
          siteName: values.siteName,
          siteCity: values.siteCity,
          siteCountry: values.siteCountry,
          broadcast: values.broadcast,
          displayOrder: values.displayOrder,
          updatedAt: values.updatedAt,
        },
      })
      .returning({ id: games.id, createdAt: games.createdAt, updatedAt: games.updatedAt });

    // A fresh insert has createdAt === updatedAt (both defaulted at insert time);
    // an update sets updatedAt later. This is a best-effort tally, not load-bearing.
    if (result[0]) {
      const created = result[0].createdAt?.getTime() ?? 0;
      const updatedAt = result[0].updatedAt?.getTime() ?? 0;
      if (Math.abs(updatedAt - created) < 1000) inserted++;
      else updated++;
    }
  }

  console.log(`Seeded games: ${inserted} inserted, ${updated} updated (${scheduleGames.length} total).`);
  process.exit(0);
}

seedGames().catch((err) => {
  console.error(err);
  process.exit(1);
});
