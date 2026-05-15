# NFL Pickem

> A private NFL Pick'em web app where one friend group makes weekly confidence picks, tracks standings, and competes across the NFL season.

## Why this exists

This project replaces a previous pick'em workflow with a private web app that makes weekly NFL picks easier to submit, score, and follow. Friends should be able to log in, pick winners, assign confidence points, and see weekly and season standings without relying on spreadsheets, public league platforms, gambling features, or heavy weekly administration.

## Who it's for

- Primary users: friends participating in the private NFL Pick'em league.
- Secondary user: the league admin who manages the season setup, users, schedule, cutoffs, results, and corrections.

## Success criteria

- [ ] Approved league members can log in.
- [ ] Each player can set a team name and optionally upload a team image; initials are used as the fallback.
- [ ] Players can view each NFL week's games in a simple home/away matchup interface inspired by the previous Yahoo Pick'em workflow.
- [ ] Players can choose the winner of each game.
- [ ] Players can assign confidence points for the week, using each available value exactly once.
- [ ] Players can edit their own picks until each game's configured cutoff time.
- [ ] Picks for each game are private until that specific game starts.
- [ ] Game results can be entered or updated after games complete.
- [ ] Weekly scores can be calculated in a batch after results are known.
- [ ] Players can see their own pick status, saved-pick count, and remaining confidence values.
- [ ] Players can see group picks after each game becomes visible.
- [ ] Players can see weekly rankings, season standings, dropped-week impact, and regular-season champion results.
- [ ] The regular season can drop a configurable number of lowest-scoring weeks, initially 4.
- [ ] A separate playoff phase can start after the regular season.
- [ ] The admin can manage setup directly through the database for v1; a dedicated admin UI is not required.

## Non-goals

- Public leagues or multi-league support.
- Gambling, payments, betting pools, or prize handling.
- Against-the-spread scoring.
- Spread-based or odds-based scoring.
- Real-time scoring during live games for v1.
- Native mobile apps.
- Social feed, chat, or complex community features.
- Full admin interface before the core league workflow works.
- External services outside Replit for v1.

## Constraints

- Built for one private friend group.
- Run the v1 stack entirely on Replit: Replit Auth, Replit managed PostgreSQL, Replit Deployments, and Replit App Storage when uploads are added.
- Simple pick'em only: choose game winners and assign confidence points.
- The full season schedule can be preloaded at the start of the season.
- Each scheduled game should support at least: week, game date/time, away team, home team, pick cutoff time, and final winner/result.
- Manual database administration is acceptable for v1.
- Scoring can run as a batch process after games complete.
- The app should be usable on both mobile and desktop.
- The main UI should favor compact tables and dashboards over decorative layout.
- Odds or spread data may be displayed later if easy to source, but it is low priority and must not affect scoring.
- Future rule variations are expected, so the system should avoid hard-coding assumptions that make alternate scoring formats difficult later.

---

*This file changes rarely. If you find yourself editing it often, something is wrong — either the scope is actually shifting (record that in DECISIONS.md) or you're putting the wrong content here.*
