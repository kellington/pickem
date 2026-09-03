# Plan


## Current milestone

**Basic Scaffold and Week One Workflow** — implementation complete. The remaining launch gate is end-to-end verification with a second user, production data, and league operations before Week 1.

> **Launch deadline (hard):** the league must be live by **mid-August 2026**, ahead
> of the NFL season — both workstreams must land by then: app verification
> (picks/scoring/standings) **and** league operations (~15 friends onboarded,
> season set up). This date is season-driven and does not move.

### Definition of done

- [x] Stack, database, auth, hosting, and testing conventions are chosen and reflected in `AGENTS.md`.
- [x] The app can be run locally/on Replit by following documented commands.
- [x] The app has a Replit-ready scaffold with a database connection, schema setup, and seed commands.
- [x] Approved users can log in with Replit Auth.
- [x] Each player can set a team name, with initials used as the default visual identity.
- [x] NFL teams and the 2026 regular-season schedule can be bootstrapped into PostgreSQL — 272 games are seeded.
- [x] Players can pick winners for each Week 1 game. *(implemented; end-to-end rehearsal pending)*
- [x] Players can assign each confidence value exactly once for the week. *(implemented; end-to-end rehearsal pending)*
- [x] Players can edit picks before each game's configured cutoff time. *(implemented; lock-rule verification pending)*
- [x] Picks for each game are hidden from other players until that game starts. *(implemented; visibility rehearsal pending)*
- [x] Results can be entered after games complete. *(implemented; real-data rehearsal pending)*
- [x] A batch scoring workflow calculates weekly points and season totals. *(implemented; scoring rehearsal pending)*
- [x] Players can view My Picks, Group Picks, and basic Standings views. *(implemented; end-to-end rehearsal pending)*

### In scope

- One private friend group.
- Replit-only v1 stack.
- Replit Auth for approved users.
- Replit managed PostgreSQL.
- Replit Deployments.
- Basic application scaffold and local dev loop.
- PostgreSQL schema for the first production data model.
- Team name and initials fallback.
- Winner-only picks.
- Confidence-point validation.
- Per-game configured cutoff times.
- Per-game pick visibility once each game starts.
- Manual schedule and result setup.
- Batch scoring.
- Season parameter for configurable dropped-week count, initially 4.
- Basic weekly and season standings; dropped-week adjusted standings.
- Basic responsive web UI for mobile and desktop.

### Out of scope for this milestone

- Public leagues or multi-league support.
- Payments, gambling, betting pools, or prize handling.
- Against-the-spread picks or spread-based scoring.
- Real-time live scoring.
- Full admin UI.
- Native mobile apps.
- Chat, social feeds, or complex community features.
- Automated odds/spread ingestion.
- Uploaded team images unless the core workflow finishes early.
- Stickers/badges unless the core workflow finishes early.
- Playoff bracket implementation beyond making room for a separate playoff phase.
- Bonus-point mechanics, double-confidence mechanics, head-to-head challenges, auto-pick, and international-game bonuses.

## Manual data bootstrapping

V1 can rely on repeatable manual or semi-manual seed data instead of admin screens.

- **Done:** 32 NFL teams seeded with stable names, abbreviations, and display ordering.
- **Done:** 2026 season row seeded with `dropped_week_count = 4`, regular-season phase, and `league_timezone = America/Edmonton`.
- **Done:** 18 week stubs seeded (regular season + playoffs).
- **Pending:** Parse the 2026 NFL game schedule into `games` rows. Source: NFL Football Operations (`https://operations.nfl.com/gameday/nfl-schedule/2026-nfl-schedule/`) or manual entry of Week 1 to unblock pick-flow testing.
- Store kickoff and cutoff timestamps in UTC; display in `America/Edmonton`.
- Default each game's pick cutoff time to kickoff time unless manually overridden.
- Leave results blank at bootstrap; fill winners manually after games complete.

## Roadmap

1. **Foundation** ✅ — data model, Replit scaffold, auth, teams + week stubs seeded.
2. **Game Schedule** ✅ — 2026 schedule loaded; Week 1 pick flow is ready to verify.
3. **Pick Submission** 🔄 — implementation complete; verify confidence-point validation, cutoff enforcement, and saved-pick status.
4. **Scoring and Standings** 🔄 — implementation complete; verify result entry, batch scoring, weekly, and season rankings.
5. **Dropped Weeks and Playoffs** — polish dropped-week standings; create the separate post-regular-season playoff phase.
6. **League Features** — team images, stickers/badges, bonus mechanics, improved admin ergonomics, optional display-only odds.

## Open risks

- 2026 NFL schedule updates and flexed game times need a safe refresh path.
- Replit Auth requires friends to create/use Replit accounts — worth validating with the group early.
- Replit deployment/database behavior should be validated before relying on it for the season.
- No automated tests yet; scoring and standings logic could regress without a test suite.
- The implemented pick, scoring, visibility, and standings paths still need a complete second-user and production rehearsal.

---

*Overwrite this file at milestone boundaries. Git keeps the history. If a decision caused the rewrite, log it in DECISIONS.md.*
