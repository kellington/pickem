# Plan

*Last rewritten: 2026-05-14*

## Current milestone

**V1 Week One Workflow** — deliver the smallest private NFL Pick'em app that lets the group log in, submit Week 1 winner picks with confidence points, and see calculated weekly and season standings after results are entered.

### Definition of done

- [ ] Stack, database, auth, hosting, and testing conventions are chosen and reflected in `AGENTS.md`.
- [ ] The app can be run locally by following documented commands.
- [ ] Approved users can log in.
- [ ] Each player can set a team name, with initials used as the default visual identity.
- [ ] Week 1 games can be loaded with game time, home team, away team, and pick cutoff time.
- [ ] Players can pick winners for each Week 1 game.
- [ ] Players can assign each confidence value exactly once for the week.
- [ ] Players can edit picks before each game's configured cutoff time.
- [ ] Picks are hidden from other players before the appropriate lock/visibility point.
- [ ] Results can be entered after games complete.
- [ ] A batch scoring workflow calculates weekly points and season standings.
- [ ] Players can view weekly rankings and season standings.

### In scope

- One private friend group.
- Simple login for approved users.
- Team name and initials fallback.
- Winner-only picks.
- Confidence-point validation.
- Per-game configured cutoff times.
- Manual schedule and result setup.
- Batch scoring.
- Basic responsive web UI for mobile and desktop.

### Out of scope for this milestone

- Public leagues or multi-league support.
- Payments, gambling, betting pools, or prize handling.
- Against-the-spread picks or spread-based scoring.
- Real-time live scoring.
- Full admin UI.
- Native mobile apps.
- Chat, social feeds, or complex community features.
- Automated odds/spread ingestion.
- Uploaded team images unless the core workflow finishes early.
- Stickers/badges unless the core workflow finishes early.

## Roadmap

1. **Foundation** — choose stack, define data model, scaffold app, and establish local dev/test loop.
2. **Pick Submission** — build login, weekly game view, confidence pick entry, validation, and cutoff behavior.
3. **Scoring and Standings** — enter results, run batch scoring, and display weekly and season rankings.
4. **League Polish** — add team images, stickers/badges, improved admin ergonomics, and optional display-only odds.

## Open risks

- Stack choice may change the implementation path for auth, file uploads, deployment, and batch jobs.
- NFL schedule loading needs a source or repeatable manual process.
- Pick visibility rules need one precise definition before implementation.
- Future scoring variations are expected, so the data model should stay flexible without overbuilding v1.

---

*Overwrite this file at milestone boundaries. Git keeps the history. If a decision caused the rewrite, log it in DECISIONS.md.*
