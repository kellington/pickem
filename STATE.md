# State

*Last updated: 2026-05-14 21:12 MDT*

## Summary

The project is at product-definition stage. `PROJECT.md` now defines a private NFL Pick'em app for one friend group, with weekly winner picks, confidence points, standings, and simple admin-by-database setup for v1.

No application stack, database, hosting, auth provider, or implementation has been chosen yet. There is no app scaffold, dependency setup, or test suite.

## What's working

- Project protocol files exist at the repo root.
- Product scope is drafted in `PROJECT.md`.
- Initial milestone direction is captured in `PLAN.md`.

## In progress

- First milestone planning: define the smallest v1 that supports a real Week 1 pick'em workflow.
- Stack selection remains open.
- Data model remains open.

## Known issues

- `AGENTS.md` conventions are still blank because stack, testing, branching, commits, and secrets conventions are undecided.
- No runnable app exists yet.
- No tests exist yet.

## Environment / setup

No development environment is set up yet.

```sh
# No app commands exist yet.
```

## Open questions

- Which stack should be used for the web app, database, auth, and deployment?
- What should the first deploy target be?
- Should v1 use email/password, magic links, or another simple private-login approach?
- How should the full NFL schedule be imported or seeded?
- What batch scoring command or workflow should compute weekly results?

## Resolved this session

- Defined the core product as a private NFL Pick'em web app for one friend group.
- Chose simple winner-based pick'em with confidence points as the initial scoring format.
- Chose per-game configurable cutoff times.
- Chose manual season setup and database-level admin operations as acceptable for v1.
- Deferred odds/spread display as low-priority and display-only.

---

*Updated at the end of every session. Keep it current — this is the file the agent reads first next session.*
