# Decisions

Append-only log of meaningful decisions. Never edit past entries — if a decision is reversed, add a new entry that references the old one.

## [2026-05-14] — One private league

**Decision:** Build for one private friend group rather than public or multi-league use.
**Why:** The immediate goal is to run a known group's NFL Pick'em competition.
**Trade-off:** Multi-tenant league management is deferred.
**Impact:** V1 can keep setup, permissions, and administration simple.

## [2026-05-14] — Confidence pick'em scoring

**Decision:** Use winner-only NFL picks with weekly confidence points as the initial scoring format.
**Why:** This matches the desired competition: players pick winners and assign each confidence value once per week.
**Trade-off:** Against-the-spread and odds-based scoring are out of scope.
**Impact:** The core model needs games, picks, confidence values, results, and standings.

## [2026-05-14] — Manual admin for v1

**Decision:** Allow the admin to manage users, schedule, cutoffs, results, and fixes directly through the database for v1.
**Why:** A full admin UI is not needed to prove the league workflow.
**Trade-off:** Admin work is less friendly until a later milestone.
**Impact:** V1 can prioritize player login, pick submission, scoring, and standings.

## [2026-05-14] — Per-game cutoff times

**Decision:** Store a configured pick cutoff time for each scheduled game.
**Why:** This supports flexible deadlines and can handle different weekly schedules.
**Trade-off:** Cutoff validation is slightly more complex than one weekly lock.
**Impact:** The schedule model must include a pick cutoff timestamp per game.

## [2026-05-14] — Odds are display-only later

**Decision:** Treat odds or spread information as optional display-only data for a later phase.
**Why:** The competition is simple winner pick'em and does not use spreads for scoring.
**Trade-off:** V1 will not depend on external odds feeds.
**Impact:** Scoring must ignore spread and odds data entirely.

## [2026-05-15] — Replit-only v1 stack

**Decision:** Build v1 entirely on Replit services: Replit Auth, Replit managed PostgreSQL, Replit Deployments, and Replit App Storage when uploads are added.
**Why:** The league is a small private friend group, and the owner already has a Replit account and can help friends with Replit accounts.
**Trade-off:** Users must use Replit Auth, and the project is initially tied to Replit's platform.
**Impact:** Avoid third-party services for v1 and document Replit conventions in `AGENTS.md`.

## [2026-05-15] — Four dropped regular-season weeks

**Decision:** Regular-season standings should support a configurable dropped-week count, initially 4.
**Why:** The league wants Yahoo-style dropped weeks while keeping future seasons configurable.
**Trade-off:** Standings logic is more complex than a straight total.
**Impact:** The season model and scoring logic must track raw totals and dropped-week adjusted totals.

## [2026-05-15] — Separate playoff phase

**Decision:** The regular season has its own champion, then a separate playoff bracket or phase starts.
**Why:** Regular-season competition and playoff competition should be distinct.
**Trade-off:** Playoff rules can be deferred but cannot be collapsed into regular-season standings.
**Impact:** The data model should distinguish regular season from playoff phase.

## [2026-05-15] — Per-game pick reveal

**Decision:** Picks become visible to others only after each specific game starts.
**Why:** A Monday night pick should remain hidden until that Monday night game begins.
**Trade-off:** Group Picks visibility is more granular than revealing the whole week at once.
**Impact:** Pick visibility queries must filter by each game's start time.

## [2026-05-15] — League timezone

**Decision:** Use `America/Edmonton` as the league timezone for displaying kickoff and cutoff times.
**Why:** This matches the league owner's local operating context.
**Trade-off:** NFL source data is usually published in Eastern time, so imports must convert source times to UTC and display them in the league timezone.
**Impact:** The season model should store `league_timezone`, and all kickoff/cutoff timestamps should be stored in UTC.

## [2026-05-15] — Replit Auth mapping model

**Decision:** Keep Replit Auth identity separate from league membership and player profiles.
**Why:** Replit Auth should prove who logged in, while the app decides whether that user is approved for the private league and which team profile they control.
**Trade-off:** The app needs a small mapping layer between Replit Auth users, approved league members, and player profiles.
**Impact:** The v1 model uses `app_users`, `league_members`, and `player_profiles`, with first-login binding for approved members.

## [2026-05-15] — Derived standings

**Decision:** Derive standings from pick scores and cached weekly scores rather than maintaining standings as a manually edited source-of-truth table.
**Why:** Standings should be reproducible from picks, results, scoring rules, and dropped-week configuration.
**Trade-off:** Queries or views need to calculate raw totals, dropped points, adjusted totals, and ranks.
**Impact:** Batch scoring should write `pick_scores` and `weekly_scores`; standings should be a derived query or view.

## [2026-05-15] — Neutral-site schedule semantics

**Decision:** For neutral-site games, preserve the schedule source order as away/home and mark the game with `neutral_site = true` plus location metadata.
**Why:** This keeps imports deterministic while preserving enough context to display international or neutral-site games accurately.
**Trade-off:** The source order may not always communicate the official designated home team perfectly.
**Impact:** The game model stores `away_team_id`, `home_team_id`, `neutral_site`, and nullable site fields.

## [2026-05-15] — Replit Agent handoff blueprint

**Decision:** Document the approved v1 data model and 2026 schedule bootstrap process in `REPLIT_AGENT_HANDOFF.md` before importing the repo into Replit.
**Why:** Replit Agent needs a concrete implementation blueprint to scaffold the app without re-deciding product and data-model fundamentals.
**Trade-off:** The handoff doc may need to be reconciled with whatever exact auth/database conventions Replit Agent generates.
**Impact:** The next implementation step is to import the repo into Replit and scaffold against the approved handoff document.
