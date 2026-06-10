import { db } from "../server/db.js";
import { leagueMembers, appUsers, playerProfiles } from "../shared/schema.js";

async function main() {
  const users = await db.select().from(appUsers);
  console.log("=== app_users ===");
  if (users.length === 0) console.log("  (none)");
  users.forEach(u => console.log(`  replitUsername=${u.replitUsername}  email=${u.email}  displayName=${u.displayName}  id=${u.id.slice(0,8)}`));

  const members = await db.select().from(leagueMembers);
  console.log("\n=== league_members ===");
  if (members.length === 0) console.log("  (none)");
  members.forEach(m => console.log(`  role=${m.role}  status=${m.status}  appUserId=${m.appUserId?.slice(0,8) ?? "null"}  approvedUsername=${m.approvedReplitUsername ?? "null"}  id=${m.id.slice(0,8)}`));

  const profiles = await db.select().from(playerProfiles);
  console.log("\n=== player_profiles ===");
  if (profiles.length === 0) console.log("  (none)");
  profiles.forEach(p => console.log(`  teamName=${p.teamName}  initials=${p.initials}  leagueMemberId=${p.leagueMemberId.slice(0,8)}`));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
