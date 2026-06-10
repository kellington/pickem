---
name: start-session
description: Begin a work session in any repo — reads state files, checks git, flags drift, proposes next tasks, and waits for go-ahead. Use when starting work ("start session", "let's begin", "pick up where we left off").
---

<what-to-do>

Run these steps in order. Do not start writing code or making changes until step 7.

**1. Check for repo-specific session rules**
Scan CLAUDE.md for any session-start supplements (worktree detection, shared SESSIONS.md, rebase rules, etc.). If found, follow those in addition to these steps — they take precedence where they overlap.

**2. Read state files** (run reads in parallel; skip gracefully if a file doesn't exist)
- `STATE.md` — current snapshot
- `TASKS.md` — active work
- `PLAN.md` — milestone plan (skim only)
- Open `PROJECT.md` only if the scope of the session is unclear

**3. Check git**
Run in parallel:
- `git status`
- `git log -5 --oneline`

If a test suite exists (check for `package.json` scripts, `pytest`, `Makefile` test targets), note it — run it only if the user asks or if STATE.md claims tests are passing and you want to verify.

**4. Flag drift**
Compare what the repo actually contains to what STATE.md claims. Call out any discrepancy — files that should exist but don't, completed items still marked open, version mismatches. Don't silently reconcile.

**5. Summarize current state** — 3–5 lines. What's done, what's in progress, what's blocked.

**6. Propose next 1–3 tasks**
For each: one-line description, key assumptions, any known blockers.

**7. Wait for go-ahead before writing any code or making any changes.**

</what-to-do>
