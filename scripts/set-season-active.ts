import { db } from "../server/db.js";
import { seasons, weeks } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const [s] = await db.select().from(seasons).where(eq(seasons.year, 2026));
  if (!s) { console.error("No 2026 season found."); process.exit(1); }

  await db.update(seasons).set({ status: "active" }).where(eq(seasons.id, s.id));
  console.log("Season set to active:", s.id);

  const [w1] = await db.update(weeks)
    .set({ status: "open" })
    .where(eq(weeks.seasonId, s.id))
    .returning();
  // Only set week 1 open — re-run individually if needed
  const allWeeks = await db.select().from(weeks).where(eq(weeks.seasonId, s.id));
  const week1 = allWeeks.find(w => w.weekNumber === 1);
  if (week1) {
    await db.update(weeks).set({ status: "open" }).where(eq(weeks.id, week1.id));
    console.log("Week 1 set to open:", week1.id);
  }
  // Reset weeks 2-18 back to setup (update above set all to open)
  for (const w of allWeeks.filter(w => w.weekNumber !== 1)) {
    await db.update(weeks).set({ status: "setup" }).where(eq(weeks.id, w.id));
  }
  console.log("Done.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
