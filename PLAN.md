# Plan

*Last rewritten: 2026-05-15 (end of Replit scaffold session)*

## Current milestone

**Basic Scaffold and Week One Workflow** — scaffold the Replit app and deliver the first usable path: login, select Week 1 picks with confidence points, enter results manually, and see weekly scores/standings.

### Definition of done

- [x] Stack, database, auth, hosting, and testing conventions are chosen and reflected in `AGENTS.md`.
- [x] The app can be run locally/on Replit by following documented commands.
- [x] The app has a Replit-ready scaffold with a database connection, schema setup, and seed commands.
- [x] Approved users can log in with Replit Auth.
- [x] Each player can set a team name, with initials used as the default visual identity.
- [x] NFL teams and the 2026 regular-season schedule can be bootstrapped into PostgreSQL — **teams done; game schedule not yet loaded**.
- [ ] Players can pick winners for each Week 1 game. *(blocked on game schedule)*
- [ ] Players can assign each confidence value exactly once for the week.
- [ ] Players can edit picks before each game's configured cutoff time.
- [ ] Picks for each game are hidden from other players until that game starts.
- [ ] Results can be entered after games complete.
- [ ] A batch scoring workflow calculates weekly points and season totals.
- [ ] Players can view My Picks, Group Picks, and basic Standings views.

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
2. **Game Schedule** 🔄 — load 2026 game schedule; verify Week 1 pick flow end-to-end.
3. **Pick Submission** 🔄 — verify confidence-point validation, cutoff enforcement, saved-pick status.
4. **Scoring and Standings** — enter results, run batch scoring, verify weekly and season rankings.
5. **Dropped Weeks and Playoffs** — polish dropped-week standings; create the separate post-regular-season playoff phase.
6. **League Features** — team images, stickers/badges, bonus mechanics, improved admin ergonomics, optional display-only odds.

## Open risks

- 2026 NFL schedule source format is not yet confirmed; manual entry for Week 1 is the fallback.
- Replit Auth requires friends to create/use Replit accounts — worth validating with the group early.
- Replit deployment/database behavior should be validated before relying on it for the season.
- The NFL can flex or update game times; schedule data needs an update path.
- No automated tests yet; scoring and standings logic could have bugs that only surface with real data.

---

*Overwrite this file at milestone boundaries. Git keeps the history. If a decision caused the rewrite, log it in DECISIONS.md.*
