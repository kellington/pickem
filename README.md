# The Six-File Project Protocol

A lightweight working method for collaborating with an AI coding agent on a long-running software project. Six small Markdown files at the repo root, each with one job. No tooling, no scaffolding, no per-feature spec folders — just plain text the agent reads first and updates as it goes.

This document describes the pattern so you can adopt it on your own projects.

---

## The problem it solves

When you work with a coding agent across many sessions, three things go wrong:

1. **Context loss between sessions.** The agent starts each conversation cold. Without a place to look, it either re-derives state from `git log` (slow, lossy) or asks you to re-explain (annoying).
2. **Drift between intent and reality.** Plans live in your head; code lives in the repo; the agent has no reliable way to tell when they've diverged.
3. **Lost rationale.** Six weeks later, nobody remembers *why* you picked Cloud SQL over Neon, and the agent re-litigates the decision every time it comes up.

The six files solve all three by giving every kind of project knowledge exactly one home — and giving the agent a fixed routine for reading and updating them.

---

## The six files

Each file has one purpose. If you can't decide where something goes, the file boundaries are wrong — re-read this section.

### 1. `AGENTS.md` | `CLAUDE.md` | `REPLIT.md` | etc — the protocol

**Purpose:** Tells the agent *how* to work in this repo. Not what the project is.

**Contents:**
- Pointers to the other five files and what each one is for.
- The session loop (what to read at start, what to update at end).
- Milestone behavior.
- Guardrails — what the agent must ask before doing (installs, schema changes, destructive ops, commits, prod actions).
- Conventions: stack, code style, naming, testing, commits, branching, secrets.
- Notes on tone (terse over hedging, ask before guessing).

**Update cadence:** Rarely. Touch only when working agreements change.

**Tip:** If you have a personal `~/AGENTS.md` or a parent-directory `AGENTS.md`, make this file repo-specific and let the parent carry the generic stuff.

**Tip:** Options for varying agents.
1. Create a symlink to `AGENTS.md` as `CLAUDE.md` that would be picked up by another Agent frameworks.
2. Create CLAUDE.md (or other as needed) referencing AGENTS.md and only adding unique instructions for that Agent


### 2. `PROJECT.md` — why this exists

**Purpose:** The brief. Why the project exists, who it's for, what success looks like, what it explicitly *won't* do.

**Contents:**
- One-sentence description.
- Why it exists (the problem, in human terms).
- Who it's for (primary and secondary users).
- Success criteria (checklist of outcomes, not features).
- **Non-goals** — the things you're choosing not to build.
- Constraints — market, scale, compliance, stack, budget.

**Update cadence:** Rarely. Frequent edits here mean scope is shifting — log that in `DECISIONS.md`.

**Why non-goals matter:** They prevent the agent (and you) from drifting into adjacent work that sounds reasonable but isn't the job.

### 3. `PLAN.md` — the current milestone

**Purpose:** What you're working toward *right now*, with a clear definition of done.

**Contents:**
- Current milestone (one paragraph).
- Definition of done (checklist — every item must be objectively verifiable).
- In scope / out of scope for this milestone.
- Phases (rough sequence — not a Gantt chart).
- Roadmap (what comes after this milestone, one line each).
- Open risks.

**Update cadence:** Rewritten at milestone boundaries. Not edited mid-milestone — if reality diverges, note it in `STATE.md` under "open questions" and address at the next milestone rewrite.

**Key discipline:** Rewrite against *reality*, not against the old plan. Git keeps history.

### 4. `STATE.md` — where things actually are

**Purpose:** A snapshot of the repo's true state, in prose. The first file the agent reads each session.

**Contents:**
- One-paragraph summary at the top — what's done, what's next.
- What's working (by phase or feature).
- In progress.
- Known issues.
- Environment / setup notes (commands, env vars, secrets location).
- Open questions.
- Resolved this session.

**Update cadence:** Every session. This is the file that drifts fastest if you don't tend it.

**Why prose, not tickets:** The agent doesn't need a kanban board — it needs a paragraph it can read in 10 seconds and know where you are. If `STATE.md` and the repo disagree, the agent's job is to flag the drift, not silently reconcile.

### 5. `DECISIONS.md` — append-only log

**Purpose:** Why you chose X over Y, written down once so nobody re-litigates it.

**Format:** One entry per decision. Each entry:

```
## [YYYY-MM-DD] — Short title

**Decision:** What you decided, in one sentence.
**Why:** The reasoning that drove it.
**Trade-off:** What you're giving up.
**Impact:** What changes because of this.
```

**Update cadence:** Append when a decision is made. **Never edit past entries.** If a decision is reversed, write a new entry that references the old one.

**Discipline:** Keep entries short — under ~8 lines. If you need more, it's a design doc and belongs elsewhere.

**Why append-only:** The value is the trail. An edited decision log is just current opinion with extra steps.

### 6. `TASKS.md` — active and near-term work

**Purpose:** What's on deck. Three sections: **Now** (1–2 items), **Next** (the handful after that, ordered), **Later** (small ideas that don't deserve a ticket).

**Contents:**
- **Now** — actively in progress.
- **Next** — what the agent should propose at the start of a session.
- **Later** — small near-term ideas. If something sits here across two milestones untouched, delete it.
- **Done (recent)** — cleared at each milestone, gives a glance at what shipped.

**Update cadence:** Constantly. Roll items through Now → Done.

**Discipline:** Keep it small. Aim for under ~15 items total. But also OK to ask to drop until later in the project.

**SubTasks** If a single task needs more than one session, has hard out-of-scope boundaries, or will run as /goal, promote it to tasks/<slug>.md and link to it from the appropriate section.  The template task/subtask.md has more structured sections.
- (e.g. `- [ ] Auth migration → tasks/auth-migration.md`).

---

## How they work together

### The session loop

Every session follows the same pattern. The agent does this — you don't have to remember it.

**Start of session:**
1. Read `STATE.md` and `TASKS.md`. Skim `PLAN.md`. Open `PROJECT.md` only if scope is unclear.
2. Run `git status` and `git log -5 --oneline`. Run the test suite if there is one.
3. Compare the repo to what `STATE.md` claims. Flag drift.
4. Summarize the current state in 3–5 lines.
5. Propose the next 1–3 tasks. List assumptions and blockers for each.
6. Wait for go-ahead before writing code.

**End of session:**
1. Update `STATE.md` to reflect what's now true.
2. Update `TASKS.md` — mark done, add new, prune stale.
3. If you made decisions worth recording, draft `DECISIONS.md` entries and *ask before writing*.
4. Note any drift from `PLAN.md` in `STATE.md` under "open questions" — don't edit `PLAN.md` mid-stream.
5. Recommend a focus for the next session.

This is the engine. The files are inert without it.

### Milestone checkpoints

When you say "milestone" or "checkpoint":

1. Rewrite `PLAN.md` against reality.
2. Prune `TASKS.md` — archive done, drop irrelevant.
3. Re-read `PROJECT.md` success criteria. Confirm or propose edits.
4. Summarize what shipped since the last milestone.

Milestones are when `PLAN.md` is allowed to change. Between them, it's read-only.

### Conflict resolution

If the files disagree, the agent should ask — not silently reconcile. Typical conflicts:

| Symptom | Likely cause |
|---|---|
| `STATE.md` says X is done, repo says no | Last session ended without an update — fix `STATE.md` |
| `TASKS.md` Now item isn't in `PLAN.md` scope | Scope drift — decide whether to rewrite `PLAN.md` or drop the task |
| `DECISIONS.md` says one thing, code does another | Either the decision was reversed (write a new entry) or the code is wrong (fix it) |

---

## Why this works

- **Single source of truth per concern.** Every kind of knowledge has one home. No more "is this in the spec or the README or the issue?"
- **Plain text, repo-local.** The files travel with the code. Git history is the audit trail. No external tool to log into.
- **Cheap to read, cheap to update.** Six small files load into context fast. Updates are diffs, not new documents.
- **Designed for the agent's actual workflow.** The session loop matches how an agent actually works — read state, propose, do, update state. No translation layer.
- **Forces decisions to be written down.** The append-only log makes it hard to drift on rationale. Six weeks later, you don't re-argue Cloud SQL vs Neon.
- **Non-goals are first-class.** `PROJECT.md` makes it socially OK to say "we're not doing that" — and the agent respects it.

---

## When not to use it

- **One-off scripts or throwaway prototypes.** Overhead exceeds value.
- **Large teams with established PM tooling.** Linear, Jira, Notion already own this surface — don't fight them.
- **Specs-heavy regulated work** where you need traceability artifacts. Use a real spec framework (e.g. SpecKit) and let this pattern coexist as the working layer above it.

A reasonable signal: if you're a solo dev or 2–3 person team building one product over months, this pattern fits. If you're shipping ten features a week across a 20-person team, it won't scale.

---

## Adopting it on a new project

1. Copy the six files in as empty stubs.
2. Fill in `PROJECT.md` first — one sitting, 30 minutes. If you can't, you don't know what you're building yet.
3. Fill in `AGENTS.md` | `CLAUDE.md` from the template. Adjust conventions for your stack.
4. Write `PLAN.md` for your first milestone. Be specific about *done*.
5. Drop the first 1–3 tasks into `TASKS.md` Now/Next.
6. Leave `STATE.md` as a one-line "Just started — see PLAN.md" until you've actually shipped something.
7. Start `DECISIONS.md` with whatever foundational choices you've already made (stack, hosting, auth).

After a couple of sessions, the rhythm clicks. The agent reads `STATE.md`, proposes from `TASKS.md`, you nod or redirect, work happens, files get updated. That's the whole loop.

---

## A note on the agent's discipline

The pattern only works if the agent actually follows the session loop and updates the files. Two safeguards:

- **Make the loop part of `AGENTS.md` | `CLAUDE.md` .** The agent reads it every session.
- **Call out misses.** If a session ends without `STATE.md` being updated, say so next time. The agent learns.

You're not babysitting — you're calibrating. Once the rhythm is established, the files maintain themselves as a side effect of working.

---

*This protocol is deliberately small. Six files, one loop, append-only history. If it grows, prune. If it shrinks, you're fine — the discipline is in the rhythm, not the document count.*
