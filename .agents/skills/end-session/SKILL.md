---
name: end-session
description: Close out a work session in any repo — updates STATE.md and TASKS.md, drafts any DECISIONS.md entries (asking before writing), and recommends a focus for next time. Use when wrapping up ("end session", "wrap up", "let's close out").
---

<what-to-do>

Run these steps in order.

**1. Check for repo-specific session rules**
Scan CLAUDE.md for any session-end supplements (worktree restrictions, shared SESSIONS.md updates, etc.). Follow those in addition to these steps — they take precedence where they overlap.

**2. Update STATE.md**
Rewrite the current-state snapshot to reflect what is now true. Focus on: what's working, what's in progress (and where to pick up), any new known issues, open questions.

**3. Update TASKS.md**
- Mark completed items done (or remove them)
- Add any new tasks that surfaced this session
- Prune anything stale or no longer relevant

**4. Draft DECISIONS.md entries**
If any decisions were made this session, draft the entries and **show them to the user before writing**. DECISIONS.md is append-only — never rewrite existing entries.

**5. Note PLAN.md drift**
If reality has diverged from PLAN.md, record it in STATE.md under "open questions." Do not edit PLAN.md mid-session — that's a milestone activity.

**6. Recommend a focus for the next session** — one sentence.

</what-to-do>
