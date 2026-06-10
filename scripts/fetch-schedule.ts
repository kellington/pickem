/**
 * Fetch the 2026 NFL regular-season schedule from ESPN's public scoreboard API
 * and write a normalized, reviewable JSON file to data/schedule-2026.json.
 *
 * This step touches no database. It is the reproducible source of truth for the
 * seed step (scripts/seed-games.ts). If the NFL flexes game times later, re-run
 * this, review the git diff on the JSON, then re-run the seed.
 *
 *   npm run fetch:schedule
 *
 * Source: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
 * (same schedule data as nfl.com/schedules, but machine-readable with UTC times).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SEASON_YEAR = 2026;
const SEASON_TYPE = 2; // 2 = regular season
const FIRST_WEEK = 1;
const LAST_WEEK = 18;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../data/schedule-2026.json");

type NormalizedGame = {
  weekNumber: number;
  sourceGameKey: string; // ESPN event id, stable across re-fetches
  awayAbbr: string;
  homeAbbr: string;
  kickoffAtUtc: string | null; // ISO 8601, UTC
  kickoffStatusHint: string; // ESPN status type name, e.g. "STATUS_SCHEDULED"
  neutralSite: boolean;
  siteName: string | null;
  siteCity: string | null;
  siteCountry: string | null;
  broadcast: string | null;
  displayOrder: number;
};

type ScheduleFile = {
  seasonYear: number;
  source: string;
  fetchedAtUtc: string;
  weekCount: number;
  gameCount: number;
  games: NormalizedGame[];
};

function scoreboardUrl(week: number): string {
  const base = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
  return `${base}?dates=${SEASON_YEAR}&seasontype=${SEASON_TYPE}&week=${week}`;
}

function pickBroadcast(competition: any): string | null {
  // ESPN exposes broadcasts a few ways; prefer the explicit broadcast list.
  const fromBroadcasts = competition?.broadcasts?.[0]?.names?.[0];
  if (fromBroadcasts) return fromBroadcasts;
  const fromGeo = competition?.geoBroadcasts?.[0]?.media?.shortName;
  if (fromGeo) return fromGeo;
  return null;
}

async function fetchWeek(week: number): Promise<NormalizedGame[]> {
  const res = await fetch(scoreboardUrl(week));
  if (!res.ok) {
    throw new Error(`ESPN week ${week} fetch failed: ${res.status} ${res.statusText}`);
  }
  const data: any = await res.json();
  const events: any[] = data?.events ?? [];

  const games: NormalizedGame[] = events.map((event, index) => {
    const competition = event?.competitions?.[0] ?? {};
    const competitors: any[] = competition?.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === "home");
    const away = competitors.find((c) => c.homeAway === "away");
    const venue = competition?.venue ?? {};

    const homeAbbr = home?.team?.abbreviation;
    const awayAbbr = away?.team?.abbreviation;
    if (!homeAbbr || !awayAbbr) {
      throw new Error(`Week ${week} event ${event?.id}: missing home/away team`);
    }

    return {
      weekNumber: week,
      sourceGameKey: `espn:${event.id}`,
      awayAbbr,
      homeAbbr,
      kickoffAtUtc: event?.date ? new Date(event.date).toISOString() : null,
      kickoffStatusHint: competition?.status?.type?.name ?? "UNKNOWN",
      neutralSite: Boolean(competition?.neutralSite),
      siteName: venue?.fullName ?? null,
      siteCity: venue?.address?.city ?? null,
      siteCountry: venue?.address?.country ?? null,
      broadcast: pickBroadcast(competition),
      displayOrder: index,
    };
  });

  // Order each week's games by kickoff so displayOrder is meaningful.
  games.sort((a, b) => {
    const ta = a.kickoffAtUtc ? Date.parse(a.kickoffAtUtc) : Number.MAX_SAFE_INTEGER;
    const tb = b.kickoffAtUtc ? Date.parse(b.kickoffAtUtc) : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
  games.forEach((g, i) => (g.displayOrder = i));

  return games;
}

async function main() {
  console.log(`Fetching ${SEASON_YEAR} NFL regular-season schedule from ESPN...`);
  const all: NormalizedGame[] = [];

  for (let week = FIRST_WEEK; week <= LAST_WEEK; week++) {
    const games = await fetchWeek(week);
    console.log(`  Week ${week}: ${games.length} games`);
    all.push(...games);
  }

  const out: ScheduleFile = {
    seasonYear: SEASON_YEAR,
    source: "ESPN scoreboard API (https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard)",
    fetchedAtUtc: new Date().toISOString(),
    weekCount: LAST_WEEK - FIRST_WEEK + 1,
    gameCount: all.length,
    games: all,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${all.length} games across ${out.weekCount} weeks to ${OUT_PATH}`);
  console.log("Review the JSON, then run: npm run seed:games");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
