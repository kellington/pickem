# State

*Last updated: 2026-06-10 (beta testers emailed, feature-ideas UI shipped, deployment live)*

## Summary

The app is live at **geeks-pickem.replit.app** and a beta-tester email went out to 15 friends today. The DB has 32 teams, a 2026 season (active), 18 week stubs (Week 1 = open), and all 272 regular-season games seeded from ESPN data. The deployment build error is fixed. Core pick → score → standings logic is wired but not yet verified end-to-end against real data. A `feature_ideas` table is in the DB; logged-in users can submit ideas and browse all submissions via two new toolbar buttons.

## What's working

- Full-stack app running via Replit Workflow: Vite/React frontend (port 5000), Express/TypeScript backend (port 3001 dev, proxied through Vite)
- Replit Auth OIDC login working — session cookie uses `SameSite=None; Secure` to work correctly inside the Replit preview iframe
- `/api/me` auto-creates an `appUsers` record on first login and matches against `leagueMembers` by email or Replit username
- Profile setup (`/api/profile` POST) auto-creates a `leagueMembers` record if none exists (first user becomes admin), then saves `playerProfiles` and auto-enrolls into active seasons
- All pages scaffolded: Landing, SetupProfile, Home, WeekPicks, GroupPicks, Standings, Nav
- All core API routes scaffolded: `/api/me`, `/api/profile`, `/api/picks`, `/api/seasons`, `/api/weeks/:id/games`, `/api/weeks/:id/standings`, `/api/seasons/:id/standings`, `/api/admin/score-week/:id`
- PostgreSQL connected via Drizzle ORM; schema pushed; 32 NFL teams, 2026 season/weeks, and **272 games seeded**
- `data/schedule-2026.json` in repo root — 272 games, 18 weeks, real ESPN data, 9 international neutral-site games
- One user confirmed in DB: `robkellington` — admin, active, profile `teamName=banana`
- **Replit Deployment live** at geeks-pickem.replit.app — path-to-regexp wildcard fix applied
- **Feature Ideas** — `feature_ideas` table in DB; `POST /api/feature-ideas` and `GET /api/feature-ideas` routes; "💡 I have an idea!" and "Show me all the ideas" buttons in the Nav toolbar
- **Beta-tester email sent** to 15 friends (June 10) with the app URL and request for feedback

## In progress

- Nothing actively in flight at end of session.

## Known issues / gaps

- **Pick submission flow unverified:** confidence-point validation, per-game cutoff enforcement, and saved-pick count need real end-to-end testing now that games exist.
- **Scoring batch unverified:** `/api/admin/score-week/:id` logic not tested against real picks and results.
- **Standings unverified:** dropped-week calculation not tested.
- **Group Picks visibility unverified:** per-game reveal after kickoff not confirmed working.
- **No automated tests yet:** scoring, validation, and standings logic need unit coverage.
- **Friends not yet onboarded:** beta email sent; no confirmed sign-ins from friends yet.
- **PLAN.md drift:** PLAN.md still lists game schedule as "not yet loaded" — it is fully loaded (272 games seeded June 10). Update PLAN.md at the next milestone boundary.

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

Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `REPLIT_DOMAINS`, `ISSUER_URL` (set as Replit Secrets).

## Open questions

- Should the admin score-week flow be triggered via the web endpoint (current) or a CLI/script for convenience?
- Do we want a lightweight admin UI page, or is DB-level access sufficient for v1?
- At what point should auto-create of league members be locked down (to prevent unknown users joining)?

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
