/**
 * seed-invites.ts
 *
 * Upserts invited league_members rows from the admin's email/username list.
 * Run this before friends log in for the first time.
 *
 * Usage:
 *   npx tsx scripts/seed-invites.ts
 *
 * How matching works at login:
 *   1. The app tries to match the Replit account email (case-insensitive) against approved_email.
 *   2. If no email match, it falls back to the Replit username against approved_replit_username.
 *   Seed whichever you know. When in doubt, collect the email shown on their Replit profile page.
 *
 * Safe to re-run — uses upsert (does not overwrite active members or duplicate rows).
 */

import { db } from "../server/db.js";
import { leagueMembers } from "../shared/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// EDIT THIS LIST before running.
// email      — the email address on their Replit account (preferred; lowercase)
// username   — their Replit @username (fallback if email unknown)
// role       — "player" for everyone except existing admins
// ---------------------------------------------------------------------------
const INVITES: { email?: string; username?: string; role?: "admin" | "player"; note?: string }[] = [
  // { email: "friend@example.com", username: "replithandle", role: "player", note: "Alice" },
  // { email: "another@example.com", role: "player", note: "Bob" },
  //
  // Add one entry per friend. Collect their Replit-account email from their
  // Replit profile page (not necessarily their usual personal email).
];
// ---------------------------------------------------------------------------

async function main() {
  if (INVITES.length === 0) {
    console.error("INVITES list is empty. Edit scripts/seed-invites.ts and add your friends.");
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;

  for (const invite of INVITES) {
    const email = invite.email?.toLowerCase() ?? null;
    const username = invite.username ?? null;
    const role = invite.role ?? "player";

    if (!email && !username) {
      console.warn(`Skipping entry with no email or username (note: ${invite.note ?? "unnamed"})`);
      skipped++;
      continue;
    }

    // Check for an existing row matching this email or username
    let existing: any = null;
    if (email) {
      [existing] = await db.select().from(leagueMembers)
        .where(sql`lower(approved_email) = ${email}`);
    }
    if (!existing && username) {
      [existing] = await db.select().from(leagueMembers)
        .where(eq(leagueMembers.approvedReplitUsername, username));
    }

    if (existing) {
      if (existing.status === "active") {
        console.log(`  SKIP (already active)  ${invite.note ?? ""} <${email ?? username}>`);
      } else {
        console.log(`  SKIP (already invited) ${invite.note ?? ""} <${email ?? username}>`);
      }
      skipped++;
      continue;
    }

    await db.insert(leagueMembers).values({
      approvedEmail: email,
      approvedReplitUsername: username,
      role,
      status: "invited",
    });

    console.log(`  INSERTED  ${invite.note ?? ""} <${email ?? username}> role=${role}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
