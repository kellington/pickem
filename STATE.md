# State

*Last updated: 2026-07-15 (code review session — review doc written, two decisions recorded, review tasks queued)*

## Summary

The app is live at **geeks-pickem.replit.app** with the full 2026 schedule (272 games), working auth, and a wired pick → score → standings path — plus features added via Replit agent on July 11 (Vegas odds display, auto-pick Favorites/Random, Clear All, results simulation/ESPN refresh, score-week + season standings). Today's session was a full code review (no code changed): findings are in `project/reviews/2026-07-15_claude.md` — 6 high-priority, 9 medium, 10 polish. Two decisions were recorded: invite-only membership (reverses auto-create) and phased dropped weeks starting week 5. Rob is committing and merging to GitHub to sync with Replit, then continuing with the Replit agent to address the review findings and TASKS list.

## What's working

- Full-stack app running via Replit Workflow: Vite/React frontend (port 5000), Express/TypeScript backend (port 3001 dev, proxied through Vite)
- Replit Auth OIDC login working — session cookie uses `SameSite=None; Secure` for the Replit preview iframe
- `/api/me` auto-creates an `appUsers` record on first login and matches against `leagueMembers` by email or Replit username
- Profile setup (`/api/profile` POST) — currently still auto-creates membership for anyone (to be removed per invite-only decision)
- All pages: Landing, SetupProfile, Home, WeekPicks (with odds, auto-pick, Clear All), GroupPicks, Standings, Nav
- Admin tools on Home: refresh odds (The Odds API), generate fake results, refresh results from ESPN, clear results, score week
- PostgreSQL via Drizzle; 32 teams, 2026 season active, 18 weeks, **272 games seeded**; schema has strong unique constraints backing all pick/score invariants
- **Replit Deployment live** at geeks-pickem.replit.app
- Feature Ideas table + submit/browse UI in the Nav toolbar
- **Code review complete** (`project/reviews/2026-07-15_claude.md`) and dated status page generated (`project/status/status-2026-07-15.html`)

## League operations

*(Hard deadline: league live by mid-August 2026 — see PLAN.md.)*

- Beta-tester email sent to 15 friends (June 10); 1 confirmed friend sign-in (Mike); follow-up owed to the rest.
- **Invite list drafted** — 17 names/emails in `project/diary/diary-2026-07.md` (2026-07-15 entry). Caveat: matching requires each friend's *Replit-account* email, exact match; confirm addresses and seed lowercase.
- Membership policy decided 2026-07-15: invite-only (`league_members` rows pre-seeded with `approved_email`, `status = invited`); auto-create to be removed. **Not yet implemented** — the door is still open until the code change lands.
- Season setup: 2026 season active, 18 weeks, 272 games; results-entry and scoring workflow still not exercised end-to-end.

## In progress

- Nothing in flight in code. Handoff state: review findings + TASKS queued for the Replit agent after Rob merges to GitHub. Start with the invite-only switch (H1) and lock-rule fixes (H2–H4) — see TASKS.md "Next".

## Known issues / gaps

*(High-priority review findings — details and file/line refs in `project/reviews/2026-07-15_claude.md`)*

- **H1 — Membership wide open:** any Replit user can join via profile auto-create. Fix decided (invite-only); not yet implemented.
- **H2 — Clear All bypasses locks:** the delete-picks endpoint ignores `pickCutoffAtUtc`; locked picks deletable until a result is entered.
- **H3 — Null cutoff never locks:** games without `pickCutoffAtUtc` stay pickable forever; needs kickoff fallback + data check that all 272 games have cutoffs.
- **H4 — Confidence range mismatch:** server caps at still-open game count; client offers 1..totalGames — confusing rejections for late pickers.
- **H5 — Dropped weeks zero early standings:** fix decided (phased drops from week 5); not yet implemented.
- **H6 — No tests:** `npm test` points at `server/tests/` which doesn't exist; scoring/validation/standings uncovered.
- **Pre-existing:** pick submission, scoring batch, standings, and Group Picks reveal all still unverified end-to-end; friends not yet onboarded (1/15).
- Medium review items worth an early pass: concurrent auto-pick saves can 500 (M1), retire the `fix-season-data` endpoint (M5), zod input validation (M6).

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

- **PLAN.md drift (milestone-boundary items):** (1) PLAN still lists the game schedule as "not yet loaded" — it's fully loaded; (2) reality is ahead of PLAN on features (odds, auto-pick, results tools, scoring shipped) but behind on verification; (3) stage 2 of the roadmap is done in practice. Rewrite PLAN.md at the next milestone.
- Should the Replit agent or a local Claude session own the review fixes? (Current plan: Replit agent, with the review doc as the spec.)
- Admin score-week flow: web endpoint (current) vs CLI script — still open.
- Lightweight admin UI vs DB-level access for v1 — still open.
- ~~When to lock down auto-create~~ — decided 2026-07-15: invite-only; remaining question is only sequencing (implement before onboarding push).

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
