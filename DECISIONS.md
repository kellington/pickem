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
