# State

*Last updated: 2026-09-02 (Week 1 feature implementation and verification review)*

## Summary

The app is live at **geeks-pickem.replit.app** with the full 2026 schedule (272 games), working auth, and implemented pick → score → standings flows. September work added odds guidance, Favorites/Upsets/Random helpers, completion messaging, transferable confidence points with clear available/used states, aggregate team-pick statistics, and Home-screen status updates. A code audit on September 2 confirmed that the Week 1 milestone capabilities and invite-only membership gate are implemented; remaining work is end-to-end verification, automated tests, roster cleanup, and production rehearsal before Week 1 begins on September 9.

## What's working

- Full-stack app running via Replit Workflow: Vite/React frontend (port 5000), Express/TypeScript backend (port 3001 dev, proxied through Vite)
- Replit Auth OIDC login working — session cookie uses `SameSite=None; Secure` for the Replit preview iframe
- `/api/me` auto-creates an `appUsers` record on first login and matches against `leagueMembers` by email or Replit username
- Profile setup (`/api/profile` POST) — matches users to pre-seeded invites by email or Replit username and rejects unmatched users
- All pages: Landing, SetupProfile, Home, WeekPicks (with odds, auto-pick, Clear All, confidence transfer/status), GroupPicks, Standings, Nav
- Admin tools on Home: refresh odds (The Odds API), generate fake results, refresh results from ESPN, clear results, score week
- PostgreSQL via Drizzle; 32 teams, 2026 season active, 18 weeks, **272 games seeded**; schema has strong unique constraints backing all pick/score invariants
- **Replit Deployment live** at geeks-pickem.replit.app
- Feature Ideas table + submit/browse UI in the Nav toolbar
- **Code review complete** (`project/reviews/2026-07-15_claude.md`) and dated status pages generated (`project/status/status-2026-07-15.html`, `project/status/status-2026-09-02.html`)

## League operations

*(Hard deadline: league live by mid-August 2026 — see PLAN.md.)*

- Beta-tester email sent to 15 friends (June 10); 1 confirmed friend sign-in (Mike); follow-up owed to the rest.
- **Invite list drafted** — 17 names/emails in `project/diary/diary-2026-07.md` (2026-07-15 entry). Caveat: matching requires each friend's *Replit-account* email, exact match; confirm addresses and seed lowercase.
- Membership policy decided 2026-07-15: invite-only (`league_members` rows pre-seeded with `approved_email`, `status = invited`); implemented in profile setup with a friendly rejection for unmatched users.
- Season setup: 2026 season active, 18 weeks, 272 games; results-entry and scoring workflow are implemented but still need end-to-end exercise.

## In progress

- Nothing in flight in code. The implementation is ahead of the written verification checklist; focus next on the Week 1 rehearsal, roster cleanup, and production sign-off.

## Known issues / gaps

*(Review details remain in `project/reviews/2026-07-15_claude.md`; H1 and H2–H5 are implemented in the current code.)*

- **H6 — No tests:** `npm test` points at `server/tests/`, which doesn't exist; scoring, validation, locking, and standings need automated coverage.
- **Verification gap:** pick submission, confidence transfer, cutoff enforcement, scoring, standings, and Group Picks reveal are implemented but not yet signed off with a complete second-user and production rehearsal.
- **League operations:** 10 active members and 16 invited rows are recorded; 7 invited rows appear stale or duplicated and the remaining friends still need confirmation/onboarding.
- **Schedule operations:** the NFL can flex game times; the safe refresh/update path is not formalized.

## Environment / setup

```sh
npm run dev            # starts both servers via concurrently (frontend :5000, backend :3001)
npm run db:push        # push Drizzle schema to PostgreSQL
npm run seed:teams     # seed 32 NFL teams
npm run seed:season    # seed 2026 season + week stubs (idempotent)
npm run seed:games     # upsert 272 games from data/schedule-2026.json (idempotent)
npm run fetch:schedule # re-fetch schedule from ESPN into data/schedule-2026.json
npm run build          # production build
npm run start:prod     # production server (port 5000, serves built frontend + API)
npx tsx scripts/check-users.ts  # inspect app_users / league_members / player_profiles
```

Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `REPLIT_DOMAINS`, `ISSUER_URL` (set as Replit Secrets). Optional: `ODDS_API_KEY` for the odds refresh.

## Open questions

- **Verification vs. implementation:** the core Week 1 capability is now implemented, but the user-facing rehearsal and production sign-off remain open.
- Admin score-week flow: web endpoint (current) vs CLI script — still open.
- Lightweight admin UI vs DB-level access for v1 — still open.
- ~~When to lock down auto-create~~ — decided 2026-07-15 and implemented: invite-only matching is enforced before profile setup.

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
