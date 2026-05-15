# Tasks

Keep this file small. Aim for under ~15 items total.

If a single item needs more than one session, has hard out-of-scope boundaries, or will run as /goal, promote it to tasks/<slug>.md and link to it from the appropriate section.

## Now

- [ ] Load the 2026 NFL game schedule into PostgreSQL — week, kickoff time (UTC), away team, home team, pick cutoff time. Without games, the pick flow cannot be exercised. Decide the source/approach first (manual CSV, scrape, or hand-entry of Week 1 only to unblock testing).
- [ ] Verify pick submission end-to-end: submit picks for a week, confirm confidence-point validation (each value used exactly once), per-game cutoff enforcement, and saved-pick count shown on Home.
- [ ] Verify scoring batch: enter a result for a game, run `/api/admin/score-week/:id`, confirm `pick_scores` and `weekly_scores` rows are correct.

## Next

- [ ] Verify Group Picks visibility: picks hidden until each game's kickoff, then revealed correctly.
- [ ] Verify Standings: weekly rankings, season totals, dropped-week adjusted totals, and rank ordering.
- [ ] Add unit tests for scoring logic, confidence-point validation, cutoff/lock behavior, and dropped-week calculation.
- [ ] Seed approved league member records for all friends so they can log in and bind their Replit Auth identity.
- [ ] Validate Replit Deployment end-to-end: deploy, confirm login, picks, and scoring work in production.

## Later

- [ ] Add optional uploaded team images with initials fallback (Replit App Storage).
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
- [x] Approved and documented the first v1 data model in `REPLIT_AGENT_HANDOFF.md`.
- [x] Approved and documented the 2026 schedule bootstrap process in `REPLIT_AGENT_HANDOFF.md`.
- [x] Imported repo into Replit; Replit Agent scaffolded the full-stack app.
- [x] Chose framework: Express + TypeScript backend, Vite + React frontend, Drizzle ORM, Tailwind v4, wouter, TanStack Query.
- [x] Replit Auth OIDC login working end-to-end (fixed SameSite=None cookie for iframe context).
- [x] Profile setup working (auto-creates league member on first save; first user becomes admin).
- [x] 32 NFL teams seeded; 2026 season and 18 week stubs seeded.
- [x] All core pages scaffolded: Landing, SetupProfile, Home, WeekPicks, GroupPicks, Standings, Nav.
- [x] All core API routes scaffolded.

---
