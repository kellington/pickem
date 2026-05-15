# Plan

*Last rewritten: 2026-05-15*

## Current milestone

**Basic Scaffold and Week One Workflow** — scaffold the Replit app and deliver the first usable path: login, select Week 1 picks with confidence points, enter results manually, and see weekly scores/standings.

### Definition of done

- [x] Stack, database, auth, hosting, and testing conventions are chosen and reflected in `AGENTS.md`.
- [ ] The app can be run locally by following documented commands.
- [ ] The app has a basic Replit-ready scaffold with a database connection, migrations/schema setup, and test command.
- [ ] Approved users can log in with Replit Auth.
- [ ] Each player can set a team name, with initials used as the default visual identity.
- [ ] NFL teams and the 2026 regular-season schedule can be bootstrapped into PostgreSQL, with Week 1 verified.
- [ ] Players can pick winners for each Week 1 game.
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
- Basic raw season standings; dropped-week adjusted standings can be included if it does not slow down the first scoring path.
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
- Full dropped-week standings polish if raw standings and weekly scoring are not done yet.
- No third party systems outside of Replit.

## Manual data bootstrapping

V1 can rely on repeatable manual or semi-manual seed data instead of admin screens.

- Create one `seasons` row for 2026 with `dropped_week_count = 4`, regular-season phase enabled, and playoff phase reserved for later.
- Seed the 32 NFL teams with stable names, abbreviations, and display ordering.
- Parse the official 2026 NFL regular-season schedule from NFL Football Operations (`https://operations.nfl.com/gameday/nfl-schedule/2026-nfl-schedule/`) into a staging format before inserting games.
- Normalize each game into: season, week, phase, kickoff time, away team, home team, neutral-site flag/location when applicable, broadcaster/source notes when useful, pick cutoff time, and result fields.
- Store kickoff and cutoff timestamps in UTC; display them in the league's chosen local timezone.
- Default each game's pick cutoff time to kickoff time unless manually overridden.
- Create approved league-member records that map Replit Auth identities to player/team profiles.
- Leave results blank at bootstrap; fill winners manually after games complete until automated result loading is intentionally added.
- Keep the original schedule source URL and import timestamp so the admin can audit or re-run the import if the NFL flexes or updates games.

## Roadmap

1. **Foundation** — define data model, scaffold the Replit app, establish local dev/test loop, and bootstrap NFL teams plus the 2026 schedule.
2. **Pick Submission** — build login, weekly game view, confidence pick entry, validation, and cutoff behavior.
3. **Scoring and Standings** — enter results, run batch scoring, and display weekly and season rankings.
4. **Dropped Weeks and Playoffs** — polish dropped-week standings and create the separate post-regular-season playoff phase or bracket.
5. **League Features** — add team images, stickers/badges, bonus mechanics, improved admin ergonomics, and optional display-only odds.

## Open risks

- NFL schedule loading needs a source or repeatable manual process.
- Replit Auth may require friends to create or use Replit accounts.
- Replit deployment/database behavior should be validated before relying on it for the season.
- The NFL can flex or update game times, so schedule data needs an update path even if the initial load is manual.
- Future scoring variations are expected, so the data model should stay flexible without overbuilding v1.

---

*Overwrite this file at milestone boundaries. Git keeps the history. If a decision caused the rewrite, log it in DECISIONS.md.*
