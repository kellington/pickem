# Replit Agent Handoff

This is the approved blueprint for moving the project from planning docs into a
Replit-built TypeScript app. Replit Agent should read this file after
`AGENTS.md`, `PROJECT.md`, `PLAN.md`, `STATE.md`, `TASKS.md`, and
`DECISIONS.md`.

## Scope

Build the **Basic Scaffold and Week One Workflow** milestone only.

- Use Replit-only v1 services: Replit Auth, Replit managed PostgreSQL, Replit
  Deployments, and Replit App Storage later for uploaded team images.
- Do not add third-party services for v1.
- Do not build bonus features, public leagues, payments, gambling features,
  odds ingestion, chat, native mobile apps, or a full admin UI.
- Prefer compact, table-driven UI and server-side domain logic for validation,
  locking, scoring, visibility, and standings.

## Approved Choices

- League timezone: `America/Edmonton`.
- Neutral-site games: store `away_team_id` and `home_team_id` from source order,
  plus `neutral_site = true` and location metadata.
- Standings: derive season standings from scored picks and cached weekly scores;
  do not make standings a manually edited source-of-truth table.
- Replit Auth mapping: keep Replit Auth identity separate from league/player
  identity through app-level user and league-member tables.

## Data Model

Use PostgreSQL. Exact column types can follow the chosen TypeScript ORM or
migration tool, but preserve these entities and constraints.

### `app_users`

Mirror authenticated Replit users.

- `id`
- `replit_user_id` unique
- `replit_username`
- `email`
- `display_name`
- `avatar_url`
- `first_seen_at`
- `last_seen_at`
- `created_at`
- `updated_at`

Notes:

- Replit Auth may create its own user table or auth records. Adapt to Replit
  Agent's generated auth shape, but keep a stable app-level user reference.
- Replit Auth decides who is logged in; this app decides who is approved for the
  league.

### `league_members`

Approved people in the private league.

- `id`
- `app_user_id` nullable unique
- `approved_email` nullable
- `approved_replit_username` nullable
- `role`: `admin` or `player`
- `status`: `invited`, `active`, or `disabled`
- `joined_at`
- `created_at`
- `updated_at`

First login should bind a Replit user to an existing approved member by
`app_user_id`, Replit username, or email. Unapproved users should not get league
access.

### `player_profiles`

Friend-group team identity.

- `id`
- `league_member_id` unique
- `team_name`
- `initials`
- `image_storage_key` nullable
- `primary_color` nullable
- `display_order`
- `created_at`
- `updated_at`

Initials are the required fallback identity. Uploaded images can wait until the
core workflow works.

### `seasons`

One pickem season.

- `id`
- `year`, for example `2026`
- `name`
- `league_timezone`, initially `America/Edmonton`
- `regular_season_start_week`, initially `1`
- `regular_season_end_week`, initially `18`
- `dropped_week_count`, initially `4`
- `status`: `setup`, `active`, or `complete`
- `created_at`
- `updated_at`

### `season_members`

Participants in one season.

- `id`
- `season_id`
- `league_member_id`
- `is_active`
- `display_order`
- `created_at`

Constraint:

- unique `(season_id, league_member_id)`

### `nfl_teams`

Canonical NFL teams.

- `id`
- `abbreviation`
- `slug`
- `city`
- `name`
- `full_name`
- `conference`
- `division`
- `display_order`
- `is_active`

Seed all 32 teams before importing games.

### `weeks`

NFL weeks and later playoff phases.

- `id`
- `season_id`
- `phase`: `regular` or `playoff`
- `week_number`
- `label`, for example `Week 1`
- `starts_on`
- `ends_on`
- `status`: `setup`, `open`, `locked`, or `scored`
- `created_at`
- `updated_at`

Constraint:

- unique `(season_id, phase, week_number)`

### `games`

Scheduled NFL games.

- `id`
- `season_id`
- `week_id`
- `source_game_key` unique
- `away_team_id`
- `home_team_id`
- `kickoff_at_utc` nullable
- `kickoff_status`: `scheduled`, `date_tbd`, `time_tbd`, or `date_time_tbd`
- `pick_cutoff_at_utc` nullable
- `neutral_site`
- `site_name` nullable
- `site_city` nullable
- `site_country` nullable
- `broadcast` nullable
- `source_notes` nullable
- `is_subject_to_change`
- `display_order`
- `created_at`
- `updated_at`

Rules:

- Default `pick_cutoff_at_utc` to `kickoff_at_utc` when kickoff is known.
- If kickoff is TBD, keep picks unavailable until kickoff and cutoff are
  resolved.
- For neutral-site games, preserve the source order as away/home and set
  `neutral_site = true`.

### `game_results`

Manual result entry.

- `id`
- `game_id` unique
- `status`: `scheduled`, `in_progress`, `final`, `postponed`, or `cancelled`
- `away_score` nullable
- `home_score` nullable
- `winning_team_id` nullable
- `is_tie`
- `finalized_at`
- `entered_by_member_id`
- `created_at`
- `updated_at`

Winner-only scoring uses `winning_team_id`. Scores are for display and audit.

### `picks`

One player pick for one game.

- `id`
- `season_member_id`
- `week_id`
- `game_id`
- `selected_team_id`
- `confidence_value`
- `submitted_at`
- `updated_at`

Constraints:

- unique `(season_member_id, game_id)`
- unique `(season_member_id, week_id, confidence_value)`
- `selected_team_id` must be either the game's home team or away team.
- `confidence_value` must be between `1` and the number of pickable games in
  that week.

Rules:

- Validate picks server-side.
- A player can edit a game pick only before that game's `pick_cutoff_at_utc`.
- Picks for a game are hidden from other players until that game's kickoff time.

### `pick_scores`

Audit-level scoring per pick.

- `id`
- `pick_id` unique
- `game_result_id`
- `is_correct`
- `points_awarded`
- `scored_at`

Rule:

- If `selected_team_id = winning_team_id`, award `confidence_value`; otherwise
  award `0`.

### `weekly_scores`

Cached weekly totals after batch scoring.

- `id`
- `season_member_id`
- `week_id`
- `correct_pick_count`
- `raw_points`
- `possible_points`
- `scored_at`

Constraint:

- unique `(season_member_id, week_id)`

### Standings View

Implement standings as a derived query or database view from `weekly_scores`,
not as a manually edited source table.

Derived fields:

- `season_member_id`
- `raw_total_points`
- `dropped_points`
- `adjusted_total_points`
- `weeks_scored`
- `rank`
- `correct_pick_total`

Dropped-week rule:

- For each season member, sort completed regular-season weekly scores by
  `raw_points` ascending.
- Mark the lowest `seasons.dropped_week_count` weeks as dropped.
- `adjusted_total_points = raw_total_points - dropped_points`.
- During the season, show raw total and dropped-adjusted total based only on
  scored weeks so far.

An optional helper view can expose one row per member/week with `raw_points` and
`is_dropped`.

## Schedule Bootstrap Tables

### `schedule_imports`

Audit record for each schedule import.

- `id`
- `season_id`
- `source_url`
- `source_name`
- `source_fetched_at`
- `raw_content_hash`
- `status`: `staged`, `validated`, `imported`, `superseded`, or `failed`
- `notes`

### `schedule_import_rows`

Raw and parsed staging rows before writing `games`.

- `id`
- `schedule_import_id`
- `week_number`
- `raw_date_label`
- `raw_matchup`
- `raw_time`
- `raw_broadcast`
- `parsed_away_team_name`
- `parsed_home_team_name`
- `parsed_neutral_site_name`
- `parsed_kickoff_at_utc` nullable
- `parse_status`
- `parse_error` nullable

## 2026 Schedule Bootstrap Process

Source:

- `https://operations.nfl.com/gameday/nfl-schedule/2026-nfl-schedule/`

Workflow:

1. Seed all 32 `nfl_teams` rows with stable abbreviations, slugs,
   conference/division values, and display ordering.
2. Create the `2026` season with `league_timezone = America/Edmonton`,
   `dropped_week_count = 4`, regular weeks `1` through `18`, and `status =
   setup`.
3. Create `weeks` rows for regular-season Weeks 1-18.
4. Fetch or manually capture the NFL Football Operations schedule page, then
   create a `schedule_imports` row with source URL, fetch timestamp, content
   hash, and status `staged`.
5. Parse the schedule into `schedule_import_rows` before touching `games`.
6. Parse normal matchups with `at` as away/home.
7. Parse neutral-site matchups with source-order away/home plus
   `neutral_site = true` and location metadata.
8. Convert displayed Eastern kickoff times to UTC. Display times later in
   `America/Edmonton`.
9. For TBD date/time rows, leave `kickoff_at_utc` nullable and set an
   appropriate `kickoff_status`.
10. Validate staging before inserting games:
    - every parsed team maps to exactly one `nfl_teams` row
    - non-TBD games have valid UTC kickoff timestamps
    - each week has the expected game count
    - the regular season has 272 games total
    - every team has 17 games
    - Week 1 is manually checked against the source page
    - neutral-site games have location metadata
11. Upsert into `games` by deterministic `source_game_key`, for example
    `2026-regular-week-01-new-england-patriots-at-seattle-seahawks`.
12. Default `pick_cutoff_at_utc = kickoff_at_utc` where kickoff is known.
13. Mark TBD and flex-prone games with `is_subject_to_change = true`.

## Schedule Change Process

When the NFL flexes or updates games:

1. Create a new `schedule_imports` row.
2. Stage all parsed rows again.
3. Compare staged rows to existing `games`.
4. Update kickoff, cutoff, broadcast, and source notes only when safe.
5. Require admin confirmation for updates to games with locked picks, existing
   picks, or results.
6. Never delete games that have picks or results. Mark changed records through
   status/source notes or add a replacement row only if necessary.

## Manual Result And Scoring Workflow

1. Admin enters final scores and winner in `game_results`.
2. Batch scoring creates or updates `pick_scores`.
3. Batch scoring creates or updates `weekly_scores`.
4. Standings query/view derives raw totals, dropped-week impact, adjusted totals,
   and ranks.

## First Replit Agent Task

After import into Replit, start with the foundation only:

1. Scaffold a TypeScript web app that runs in Replit.
2. Add Replit Auth.
3. Add managed PostgreSQL connection.
4. Add migrations/schema setup for the approved model.
5. Add a seed/import path for NFL teams and staged 2026 schedule data.
6. Add a test command and focused server-side tests for pick validation,
   per-game locking/visibility, scoring, and dropped-week standings.
7. Build only a minimal login-gated shell until the data and auth path are
   verified.

Do not build the full UI before proving auth, database, migrations, seed/import,
and tests in Replit.
