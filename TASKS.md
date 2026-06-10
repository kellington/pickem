# Tasks

Keep this file small. Aim for under ~15 items total.

If a single item needs more than one session, has hard out-of-scope boundaries, or will run as /goal, promote it to tasks/<slug>.md and link to it from the appropriate section.

## Now

- [ ] Verify pick submission end-to-end: sign in as a second test user, submit picks for Week 1, confirm confidence-point validation (each value used exactly once), per-game cutoff enforcement, and saved-pick count shown on Home.
- [ ] Verify scoring batch: enter a game result, run `POST /api/admin/score-week/:weekId`, confirm `pick_scores` and `weekly_scores` rows are correct.
- [ ] Onboard at least one friend as a test player — share the app URL; they sign in with Replit and complete profile setup.

## Next

- [ ] Verify Group Picks visibility: picks hidden until each game's kickoff, then revealed correctly for all players.
- [ ] Verify Standings: weekly rankings, season totals, dropped-week adjusted totals, and rank ordering.
- [ ] Add unit tests for scoring logic, confidence-point validation, cutoff/lock behavior, and dropped-week calculation.
- [ ] Validate Replit Deployment end-to-end: deploy, confirm login, picks, and scoring work in production.

## Later

- [ ] Add optional uploaded team images with initials fallback (Replit App Storage).
- [ ] Add sticker/badge-style achievements for weekly performance.
- [ ] Add display-only odds/spread information if there is an easy, reliable source.
- [ ] Add an admin UI if database-level operations become too cumbersome.
- [ ] Build the post-regular-season playoff bracket phase.
- [ ] Explore bonus mechanics from `project/ideas/ideas.md`: double-confidence, head-to-head challenges, auto-pick, international-game bonuses, and catch-up rewards.
- [ ] Consider locking down auto-create of league members (require pre-approval) once the friend group is fully onboarded.

## Done (recent)

- [x] Drafted the initial `PROJECT.md` product brief.
- [x] Captured the first milestone direction in `PLAN.md`.
- [x] Recorded initial product decisions in `DECISIONS.md`.
- [x] Selected Replit-only v1 stack direction.
- [x] Approved and documented the first v1 data model in `REPLIT_AGENT_HANDOFF.md`.
- [x] Imported repo into Replit; Replit Agent scaffolded the full-stack app.
- [x] Replit Auth OIDC login working end-to-end (fixed SameSite=None cookie for iframe context).
- [x] Profile setup working (auto-creates league member on first save; first user becomes admin).
- [x] 32 NFL teams seeded; 2026 season and 18 week stubs seeded.
- [x] All core pages and API routes scaffolded.
- [x] Fetched full 2026 NFL schedule from ESPN API — 272 games, 18 weeks, saved to `data/schedule-2026.json`.
- [x] `scripts/seed-games.ts` written and run — all 272 games upserted into DB.
- [x] Fixed `package.json` git conflict markers; all npm scripts restored and working.
- [x] Added `scripts/check-users.ts` diagnostic script.
- [x] Created `end-of-session` agent skill at `.agents/skills/end-of-session/SKILL.md`.

---
