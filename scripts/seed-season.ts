import { db } from "../server/db.js";
import { seasons, weeks } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function seedSeason() {
  console.log("Seeding 2026 season and weeks...");

  const [season] = await db.insert(seasons)
    .values({
      year: 2026,
      name: "2026 NFL Season",
      leagueTimezone: "America/Edmonton",
      regularSeasonStartWeek: 1,
      regularSeasonEndWeek: 18,
      droppedWeekCount: 4,
      status: "setup",
    })
    .onConflictDoNothing()
    .returning();

  let targetSeason = season;
  if (!targetSeason) {
    const [existing] = await db.select().from(seasons).where(eq(seasons.year, 2026));
    targetSeason = existing;
  }

  if (!targetSeason) {
    console.error("Could not create or find season");
    process.exit(1);
  }

  console.log(`Season: ${targetSeason.name} (${targetSeason.id})`);

  for (let weekNum = 1; weekNum <= 18; weekNum++) {
    await db.insert(weeks)
      .values({
        seasonId: targetSeason.id,
        phase: "regular",
        weekNumber: weekNum,
        label: `Week ${weekNum}`,
        status: "setup",
      })
      .onConflictDoNothing();
  }

  console.log("Created 18 regular-season weeks.");
  console.log("Done. Run seed-teams.ts first if you haven't already.");
  process.exit(0);
}

seedSeason().catch((err) => {
  console.error(err);
  process.exit(1);
});
