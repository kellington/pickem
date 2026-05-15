# State

*Last updated: 2026-05-15 11:25 MDT*

## Summary

The project is at product-definition stage. `PROJECT.md` defines a private NFL Pick'em app for one friend group, with weekly winner picks, confidence points, dropped weeks, standings, and simple admin-by-database setup for v1.

The initial stack direction is Replit-only: Replit Auth, Replit managed PostgreSQL, Replit Deployments, and Replit App Storage later for uploaded team images. The current milestone is focused on basic scaffolding, login, pick selection, manual result entry, and initial scoring before adding bonus features.

The first v1 data model and 2026 schedule bootstrap approach are now approved and documented in `REPLIT_AGENT_HANDOFF.md` for Replit Agent handoff.

## What's working

- Project protocol files exist at the repo root.
- Product scope is drafted in `PROJECT.md`.
- Initial milestone direction is captured in `PLAN.md`.
- Stack conventions are now captured in `AGENTS.md`.
- Approved Replit Agent handoff blueprint exists in `REPLIT_AGENT_HANDOFF.md`.

## In progress

- First milestone planning: define the smallest Replit-hosted v1 that supports a real Week 1 pick'em workflow.
- Import/scaffold transition to Replit Agent.
- Auth implementation details remain open inside the Replit Auth approach and should be validated during Replit scaffold work.

## Known issues

- No runnable app exists yet.
- No tests exist yet.
- `project/ideas/` contains Yahoo Pick'em reference screenshots for UI inspiration.
- `project/ideas/ideas.md` contains future feature ideas that are intentionally out of the first scaffold milestone.

## Environment / setup

No development environment is set up yet.

```sh
# No app commands exist yet.
```

## Open questions

- What exact Replit app framework should be scaffolded: Next.js, Remix/React Router, or a simpler Replit-native TypeScript setup?
- What exact Replit Auth table/claims shape will Replit Agent generate, and how should it be adapted to the approved `app_users` / `league_members` mapping?
- What batch scoring command or workflow should Replit Agent implement around the approved `pick_scores` and `weekly_scores` model?

## Resolved this session

- Defined the core product as a private NFL Pick'em web app for one friend group.
- Chose simple winner-based pick'em with confidence points as the initial scoring format.
- Chose per-game configurable cutoff times.
- Chose manual season setup and database-level admin operations as acceptable for v1.
- Deferred odds/spread display as low-priority and display-only.
- Reviewed Yahoo Pick'em screenshots and clarified the core UI surfaces: My Picks, Group Picks, and Standings.
- Chose Replit-only services for v1.
- Chose 4 dropped regular-season weeks as a configurable season parameter.
- Chose per-game pick reveal after each game starts.
- Chose regular-season champion plus a separate playoff phase.
- Refocused `PLAN.md` on basic scaffolding, login, pick selection, manual scoring, and schedule bootstrapping before advanced features.
- Identified the official NFL Football Operations 2026 schedule page as a candidate source for bootstrapping the season schedule.
- Approved `America/Edmonton` as the league timezone.
- Approved neutral-site game semantics: preserve source order as away/home and mark `neutral_site = true`.
- Approved derived standings from weekly scores rather than a manually edited standings table.
- Approved Replit Auth mapping through separate app user, league member, and player profile records.
- Approved the first v1 data model covering auth mapping, player/team profiles, seasons, season members, weeks, NFL teams, games, results, picks, pick scores, weekly scores, dropped-week standings, and schedule import staging.
- Approved the manual/semi-manual 2026 schedule bootstrap process from the NFL Football Operations schedule page into PostgreSQL.
- Added `REPLIT_AGENT_HANDOFF.md` as the concrete blueprint for importing the repo into Replit and starting scaffold work with Replit Agent.

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
