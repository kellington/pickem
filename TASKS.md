# Tasks

Keep this file small. Aim for under ~15 items total.

If a single item needs more than one session, has hard out-of-scope boundaries, or will run as /goal, promote it to tasks/<slug>.md and link to it from the appropriate section.

Both workstreams are first-class: untagged items are app development; items tagged
**League ops —** are the operational track (onboarding, season admin) that must
also land before the mid-August 2026 launch deadline (see PLAN.md).

## Now

- [ ] Verify pick submission end-to-end: sign in as a second test user, submit picks for Week 1, confirm confidence-point validation (each value used exactly once), per-game cutoff enforcement, and saved-pick count shown on Home.
- [ ] Verify scoring batch: enter a game result, run `POST /api/admin/score-week/:weekId`, confirm `pick_scores` and `weekly_scores` rows are correct.
- [ ] League ops — Onboard at least one friend as a test player — share the app URL; they sign in with Replit and complete profile setup. Follow up on beta-tester email (sent June 10).
- [ ] League ops — Collect each friend's Replit-account email (the address on their Replit login, not just their usual email) for the invite list (DECISIONS.md 2026-07-15 invite-only membership).

## Next

- [ ] Verify Group Picks visibility: picks hidden until each game's kickoff, then revealed correctly for all players.
- [ ] Verify Standings: weekly rankings, season totals, dropped-week adjusted totals, and rank ordering.
- [ ] Add unit tests for scoring logic, confidence-point validation, cutoff/lock behavior, and dropped-week calculation.
- [ ] Validate Replit Deployment end-to-end: log in at geeks-pickem.replit.app, confirm picks and scoring work in production (not just dev).
- [ ] Switch to invite-only membership: remove the auto-create branch in `POST /api/profile` (return a friendly "not invited" response), and add a seed script in `scripts/` that inserts invited `league_members` rows from the admin's email list (lowercase emails, case-insensitive match). See DECISIONS.md 2026-07-15 and review finding H1.
- [ ] Implement phased dropped weeks: no drops until 5 weeks scored, then `min(droppedWeekCount, weeksScored − 4)`; route should reuse `computeStandings` in `server/domain.ts`. See DECISIONS.md 2026-07-15 and review finding H5.
- [ ] Fix lock-rule gaps from code review: Clear All ignores pick cutoff (H2), games with null `pickCutoffAtUtc` never lock (H3), confidence range should be validated against total games, not still-open games (H4). See `project/reviews/2026-07-15_claude.md`.

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
- [x] Fixed deployment build error (path-to-regexp wildcard); app published to geeks-pickem.replit.app.
- [x] Consolidated agent skills into `.agents/skills/` (end-session, start-session, generate-project-status).
- [x] Updated `generate-project-status` skill to add User Communications and Feature Ideas sections (14 sections total).
- [x] Added `feature_ideas` table to schema and DB; `POST` and `GET` API routes; "I have an idea!" and "Show me all the ideas" toolbar buttons with modals.
- [x] Sent beta-tester email to 15 friends (June 10) with geeks-pickem.replit.app URL.
- [x] Full code review completed (2026-07-15) — `project/reviews/2026-07-15_claude.md`; 6 high / 9 medium / 10 polish findings, follow-up tasks queued above.
- [x] Recorded decisions: invite-only membership (reverses auto-create) and phased dropped weeks from week 5 (DECISIONS.md 2026-07-15).
- [x] Generated status page `project/status/status-2026-07-15.html` and refreshed STATUS-SUMMARY.md.

---
