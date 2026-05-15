# State

*Last updated: 2026-05-15 (end of Replit scaffold session)*

## Summary

The app is scaffolded and running on Replit. Replit Auth login works end-to-end. Profile setup works. The database has 32 NFL teams, a 2026 season row, and 18 week stubs — but no actual game schedule loaded yet. The core pick submission, scoring, and standings routes are wired but untested against real game data. The milestone is roughly 60% complete: auth and profile are done; pick flow, scoring, and standings need real games and end-to-end verification.

## What's working

- Full-stack app running via Replit Workflow: Vite/React frontend (port 5000), Express/TypeScript backend (port 3001 dev, proxied through Vite)
- Replit Auth OIDC login working — session cookie uses `SameSite=None; Secure` to work correctly inside the Replit preview iframe
- `/api/me` auto-creates an `appUsers` record on first login and matches against `leagueMembers` by email or Replit username
- Profile setup (`/api/profile` POST) auto-creates a `leagueMembers` record if none exists (first user becomes admin), then saves `playerProfiles`
- All pages scaffolded: Landing, SetupProfile, Home, WeekPicks, GroupPicks, Standings, Nav
- All core API routes scaffolded: `/api/me`, `/api/profile`, `/api/picks`, `/api/seasons`, `/api/weeks/:id/games`, `/api/weeks/:id/standings`, `/api/seasons/:id/standings`, `/api/admin/score-week/:id`
- PostgreSQL connected via Drizzle ORM; schema pushed; 32 NFL teams and 2026 season/weeks seeded
- Replit Deployment configured: autoscale, `npm run build` + `npm run start:prod`

## In progress

- Nothing actively in flight at end of session.

## Known issues / gaps

- **No game schedule loaded.** Week stubs exist but no `games` rows — the pick submission UI cannot be exercised end-to-end.
- **2026 NFL schedule not yet bootstrapped** from the NFL Football Operations source.
- **Pick submission flow unverified:** confidence-point validation, per-game cutoff enforcement, and saved-pick count need testing with real games.
- **Scoring batch unverified:** `/api/admin/score-week/:id` logic not tested against real picks and results.
- **Standings unverified:** dropped-week calculation not tested.
- **Group Picks visibility unverified:** per-game reveal after kickoff not confirmed working.
- STATE.md, TASKS.md, and PLAN.md were stale (pre-scaffold) at the start of this session — now updated.
- No automated tests yet; scoring, validation, and standings logic need unit coverage.

## Environment / setup

```sh
npm run dev          # starts both servers via concurrently (frontend :5000, backend :3001)
npm run db:push      # push Drizzle schema to PostgreSQL
npm run seed:teams   # seed 32 NFL teams
npm run seed:season  # seed 2026 season + week stubs
npm run build        # production build
npm run start:prod   # production server (port 5000, serves built frontend + API)
```

Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `REPLIT_DOMAINS`, `ISSUER_URL` (set as Replit Secrets).

## Open questions

- What is the source and format for the 2026 NFL game schedule? Manual CSV, NFL Football Operations page scrape, or another approach?
- Should the admin score-week flow be triggered via a web endpoint (current) or a CLI/script?
- Do we want to seed one or two real Week 1 games manually to unblock pick-flow testing before the full schedule is loaded?

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
