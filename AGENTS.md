# Project Protocol

This file tells AI Agents how to operate in this repo. Content about *what*
the project is lives in the five sibling files — this file is about *how we
work*.

## Source of truth

- **PROJECT.md** — why this exists, who it's for, success criteria, non-goals.
- **PLAN.md** — current roadmap and milestones. Rewritten at milestone boundaries.
- **STATE.md** — snapshot of where things are right now. Updated every session.
- **DECISIONS.md** — append-only log of decisions and their trade-offs. Never rewrite entries.
- **TASKS.md** — active and near-term work. Rolls over constantly.
- **tasks/subtask.md** — active and near-term work that is more complex or can be run by /goal

If any of these conflict, ask me which one is right. Don't silently reconcile.

## Start of session

1. Read STATE.md and TASKS.md. Skim PLAN.md. Only open PROJECT.md if scope is unclear.
2. Run `git status` and `git log -5 --oneline`. Run the test suite if one exists.
3. Compare what you see in the repo to what STATE.md claims. Flag any drift.
4. Summarize the current state in 3–5 lines.
5. Propose the next 1–3 tasks. For each, list assumptions and blockers.
6. Wait for my go-ahead before writing code.

## End of session

1. Update STATE.md to reflect what's now true.
2. Update TASKS.md — mark done, add new, prune stale.
3. If we made decisions worth recording, draft DECISIONS.md entries and **ask before writing them**.
4. Note any drift from PLAN.md in STATE.md under "open questions" — don't edit PLAN.md mid-stream.
5. Recommend a focus for the next session.

## Milestones

When I say "milestone" or "checkpoint":

1. Rewrite PLAN.md against reality, not against the old plan.
2. Prune TASKS.md — archive done items, drop anything that no longer matters.
3. Re-read PROJECT.md's success criteria. Confirm they still hold, or propose edits.
4. Summarize what shipped since the last milestone.

## Guardrails

Always ask before:

- Installing new dependencies
- Schema or migration changes
- Destructive file operations (delete, overwrite outside your working set)
- Commits or pushes
- Running anything that touches production data or external services

Prefer small, reversible changes. If you're unsure, stop and ask.

## Conventions

<!-- Fill these in per project. Leave blank until decided. -->

- **Language / stack:**
- **Code style:**
- **Testing:** (framework, when to add tests, coverage expectations)
- **Commits:** (message format, squash vs merge)
- **Branching:**
- **Secrets / env:** (how to handle, where `.env.example` lives)

## Notes to the agent

- Short, direct writing over hedging. I'd rather you say "I don't know" than guess.
- If a task takes more than ~3 tool calls of exploration without progress, stop and check in.
- Don't reformat or restructure these six files unless I ask. Small content edits only.
