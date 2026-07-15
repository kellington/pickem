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

## [2026-05-15] — Framework choice: Express + Vite + Drizzle

**Decision:** Use Express + TypeScript (ESM) as the backend, Vite + React 19 as the frontend, Drizzle ORM for PostgreSQL access, Tailwind v4 for styling, wouter for client routing, and TanStack Query for data fetching.
**Why:** Replit Agent selected this stack during scaffold as the best fit for Replit Auth, managed PostgreSQL, and the project's simple server-side rendering needs. No Next.js or Remix — simpler is appropriate for a private league app.
**Trade-off:** Two separate dev servers (frontend :5000, backend :3001) with Vite proxying `/api/*`; slightly more config than a unified framework.
**Impact:** Dev workflow uses `concurrently`; production builds the Vite bundle and serves it from Express on port 5000.

## [2026-05-15] — SameSite=None session cookie for Replit iframe context

**Decision:** Set `sameSite: "none"` (with `secure: true`) on the session cookie.
**Why:** The Replit preview pane embeds the app in an iframe served from `replit.com`. With the default `SameSite=Lax`, the browser treats API calls from within the iframe as cross-site requests and withholds the session cookie, breaking auth after login.
**Trade-off:** `SameSite=None` is less restrictive. Acceptable because the app is private and HTTPS-only.
**Impact:** Session persists correctly in both the Replit preview iframe and direct browser access.

## [2026-05-15] — Auto-create league member on profile setup

**Decision:** If a user who logs in has no matching `league_members` record (by email or Replit username), auto-create one when they submit the profile setup form. The first member to do this becomes admin; subsequent ones become players.
**Why:** For this private friend group, anyone who has a Replit account and can reach the app URL is effectively trusted. Pre-seeding approved records for every friend before they can set up a profile creates unnecessary admin friction for v1.
**Trade-off:** Any Replit user who discovers the URL can create a profile. Acceptable for a private friend group; revisit if the app is ever more broadly accessible.
**Impact:** Admin only needs to share the app URL with friends. No pre-seeding of `league_members` required before first login.

## [2026-07-15] — Invite-only membership (reverses 2026-05-15 auto-create)

**Decision:** Replace auto-create-on-profile-setup with an admin-provided invite list: `league_members` rows pre-seeded with `approved_email` (and/or `approved_replit_username`), `status = invited`. Logging in still creates an `app_users` row, but users with no matching invite get a "not invited" message instead of a membership. Bootstrap logic (first member becomes admin) is removed — the admin already exists.
**Why:** The auto-create path let any Replit user who found the URL become an active player (2026-07-15 code review, finding H1). With launch approaching, membership should be a closed list controlled by the admin.
**Trade-off:** Each friend's Replit-account email must be collected and seeded before they first log in; a mismatched email means a support ping to the admin. Seed emails lowercase and compare case-insensitively to reduce misses.
**Impact:** Remove the auto-create branch in `POST /api/profile`; add an admin path (script or endpoint) to seed invited members from the email list. League ops: collect each friend's Replit email before launch.

## [2026-07-15] — Dropped weeks phase in starting week 5

**Decision:** No weeks are dropped from season standings until 5 weeks have been scored. From week 5 on, drops phase in one at a time: dropped weeks = `min(droppedWeekCount, weeksScored − 4)`, so 1 week is dropped at 5 scored weeks, 2 at 6, up to the configured 4. Refines the 2026-05-15 "Four dropped regular-season weeks" decision.
**Why:** The original rule dropped the lowest 4 weeks unconditionally, which zeroes everyone's adjusted total until week 5 and makes early-season standings look broken (2026-07-15 code review, finding H5).
**Trade-off:** Standings math depends on weeks-scored count, not just the config value; a player's adjusted total can dip when a new drop phases in.
**Impact:** Season-standings logic (and the `computeStandings` domain function it should share) must apply the phased formula; needs unit tests covering 1–18 scored weeks.

## [2026-07-15] — League operations is a first-class workstream

**Decision:** The protocol files explicitly carry both workstreams — app development and league operations (friend onboarding, season admin) — with the hard mid-August 2026 launch deadline recorded in PLAN.md. Mirrors the portfolio-wide dual-workstream pattern (conforma DECISIONS.md 2026-07-15).
**Why:** The launch deadline and onboarding work were previously scattered or unrecorded; the AI team couldn't see the ops track that gates launch as much as the code does.
**Trade-off:** Light tagging overhead in TASKS.md and a League operations section to keep current in STATE.md.
**Impact:** PLAN.md carries the deadline; STATE.md gains a League operations section; TASKS.md tags ops items "League ops —".
