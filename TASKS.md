# Tasks

Keep this file small. Aim for under ~15 items total.

If a single item needs more than one session, has hard out-of-scope boundaries, or will run as /goal, promote it to tasks/<slug>.md and link to it from the appropriate section.

## Now

- [ ] Define the first v1 data model: users, teams/profiles, seasons, weeks, NFL teams, games, picks, confidence points, results, dropped weeks, and standings.
- [ ] Define the 2026 schedule bootstrap process from the NFL Football Operations schedule page into PostgreSQL.

## Next

- [ ] Scaffold the app once stack decisions are made.
- [ ] Add the initial PostgreSQL schema and seed/import script for NFL teams and 2026 games.
- [ ] Build the week-one pick submission flow.
- [ ] Build batch scoring and standings calculation.
- [ ] Build Group Picks visibility after each game starts.

## Later

- [ ] Add optional uploaded team images with initials fallback.
- [ ] Add sticker/badge-style achievements for weekly performance.
- [ ] Add display-only odds/spread information if there is an easy, reliable source.
- [ ] Add an admin UI if database-level operations become too cumbersome.
- [ ] Build the post-regular-season playoff bracket phase.
- [ ] Explore bonus mechanics from `project/ideas/ideas.md`: double-confidence, head-to-head challenges, auto-pick, international-game bonuses, and catch-up rewards.

## Done (recent)

- [x] Drafted the initial `PROJECT.md` product brief.
- [x] Captured the first milestone direction in `PLAN.md`.
- [x] Recorded initial product decisions in `DECISIONS.md`.
- [x] Selected Replit-only v1 stack direction.
- [x] Reviewed `PROJECT.md` scope against Yahoo Pick'em reference screenshots and `project/ideas/ideas.md`.
- [x] Refocused `PLAN.md` on basic scaffolding, login, pick selection, manual scoring, and schedule bootstrapping.

---
