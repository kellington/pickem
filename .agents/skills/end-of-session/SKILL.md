---
name: end-of-session
description: End-of-session wrap-up for the NFL Pick'em project. Run when the user says "end of session", "wrap up", "close out", or asks for a session summary. Updates STATE.md, TASKS.md, optionally DECISIONS.md, and appends a diary entry with a next-session prompt.
---

# End of Session — NFL Pick'em

Follow these steps in order. Do not skip steps or combine them silently — show the user each update before writing it (except diary, which can be written directly).

## Step 1 — Take stock

Before touching any files, run:

```sh
git --no-optional-locks log -5 --oneline
npx tsx scripts/check-users.ts
```

Read `STATE.md` and `TASKS.md` to understand what was claimed at the start. Compare against what actually happened this session.

## Step 2 — Update STATE.md

Rewrite the relevant sections of `STATE.md` (repo root). Keep the format intact:

- **Summary** — 3–5 sentence snapshot of where the app stands *right now*. Overwrite the old summary entirely.
- **What's working** — update the bullet list to reflect current reality. Remove anything no longer true.
- **In progress** — list anything left mid-flight. If nothing, write `- Nothing actively in flight at end of session.`
- **Known issues / gaps** — update or remove resolved items; add newly discovered ones.
- **Environment / setup** — add any new npm scripts introduced this session (check `package.json` scripts block).
- **Open questions** — remove answered questions; add new ones.

Update the `*Last updated:*` line to today's date and a short label, e.g. `2026-06-10 (games seeded, server healthy)`.

**Show the user the proposed STATE.md diff before writing** if the changes are substantial. For small updates, write directly.

## Step 3 — Update TASKS.md

- Mark completed items `[x]` and move them to **Done (recent)**.
- Add any new tasks discovered this session to the appropriate section (Now / Next / Later).
- Prune Done (recent) to the last ~10 items — older done items can be dropped.
- Keep the total list under ~15 active items.

**Key task categories for this project:**
- **Now** — blocking pick flow, scoring, or standings verification
- **Next** — testing, deployment validation, friend onboarding
- **Later** — bonus mechanics, admin UI, playoff bracket, achievements

## Step 4 — DECISIONS.md (conditional)

Only if a non-obvious decision was made this session (tradeoff, approach chosen over an alternative, convention locked in):

1. Draft the entry in this format:
   ```
   ### YYYY-MM-DD — [short title]
   **Decision:** …
   **Alternatives considered:** …
   **Rationale:** …
   ```
2. **Ask the user before writing.** DECISIONS.md is append-only — entries are never edited once written.

If no decision-worthy choices were made, skip this step.

## Step 5 — Diary entry

Append to `project/diary/diary-YYYY-MM.md` (create the file if the month rolled over).

Format:
```markdown
## YYYY-MM-DD

### What we did
- [bullet per meaningful thing completed]

### What's next
- [bullet per open item or blocker]

### Next Prompt
[A self-contained prompt the user can paste to start the next session cold.
Include: current milestone, what was just completed, what to tackle next, and any
critical context a fresh agent needs (e.g. "Week 1 is open, games are seeded,
pick flow needs end-to-end verification with a real test user").
Keep it under ~150 words.]
```

Write this directly without asking — it's append-only and low-stakes.

## Step 6 — Recommend next session focus

Tell the user in 2–3 sentences:
- What is the single highest-priority thing to do next session
- Any blocker or prerequisite they need to handle before then (e.g. invite a friend to test, approve a dependency)

---

## Project quick-reference

**Key doc files (repo root):**
- `STATE.md` — current truth, read first each session
- `TASKS.md` — active work queue
- `DECISIONS.md` — append-only decision log
- `PLAN.md` — milestone roadmap (only rewrite at milestone boundaries)
- `PROJECT.md` — product brief and success criteria
- `AGENTS.md` — agent operating protocol (guardrails, conventions)

**Diary:** `project/diary/diary-YYYY-MM.md`

**Useful scripts for state-checking:**
```sh
npx tsx scripts/check-users.ts        # shows app_users / league_members / player_profiles
npm run seed:season                   # idempotent — safe to re-run
git --no-optional-locks log -5 --oneline
```

**DB entities to be aware of:**
- `seasons` → `weeks` → `games` → `picks` → `pick_scores` → `weekly_scores`
- `app_users` ← (linked) → `league_members` → `player_profiles`, `season_members`
- `game_results` feeds the score-week batch

**Admin-only routes:** `POST /api/admin/score-week/:weekId`

**Stack:** Express+TypeScript ESM (port 3001 dev), Vite+React 19 (port 5000), Drizzle ORM, Tailwind v4, wouter, TanStack Query. Vite proxies `/api/*`.
