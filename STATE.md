# State

*Last updated: 2026-05-15 10:38 MDT*

## Summary

The project is at product-definition stage. `PROJECT.md` defines a private NFL Pick'em app for one friend group, with weekly winner picks, confidence points, dropped weeks, standings, and simple admin-by-database setup for v1.

The initial stack direction is Replit-only: Replit Auth, Replit managed PostgreSQL, Replit Deployments, and Replit App Storage later for uploaded team images. The current milestone is focused on basic scaffolding, login, pick selection, manual result entry, and initial scoring before adding bonus features.

## What's working

- Project protocol files exist at the repo root.
- Product scope is drafted in `PROJECT.md`.
- Initial milestone direction is captured in `PLAN.md`.
- Stack conventions are now captured in `AGENTS.md`.

## In progress

- First milestone planning: define the smallest Replit-hosted v1 that supports a real Week 1 pick'em workflow.
- Data model remains open.
- Manual bootstrap process for NFL teams and the 2026 regular-season schedule remains open.
- Auth implementation details remain open inside the Replit Auth approach.

## Known issues

- No runnable app exists yet.
- No tests exist yet.
- `project/ideas/` contains untracked Yahoo Pick'em reference screenshots.
- `project/ideas/ideas.md` contains future feature ideas that are intentionally out of the first scaffold milestone.

## Environment / setup

No development environment is set up yet.

```sh
# No app commands exist yet.
```

## Open questions

- How should the full NFL schedule be imported or seeded?
- What batch scoring command or workflow should compute weekly results?
- What exact Replit app framework should be scaffolded: Next.js, Remix/React Router, or a simpler Replit-native TypeScript setup?
- How should Replit Auth users be mapped to allowed league members and team profiles?
- What league timezone should be used for displaying kickoff and cutoff times?

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
- Closed the session with data modeling and schedule bootstrapping as the next focus.

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
