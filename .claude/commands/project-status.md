---
description: Generate a dated HTML status page (project/status/status-YYYY-MM-DD.html) summarising the pickem project from its protocol files, recent diary, and git history. Covers what's built, what's left, the hard deadline, and the next session focus.
---

Generate a project status HTML report for pickem.

## What to read first (do all reads in parallel)

**Protocol files:**
1. `PROJECT.md` — purpose, success criteria, constraints
2. `PLAN.md` — current milestone, definition of done, roadmap, open risks
3. `STATE.md` — what's working, what's in progress, known issues/gaps
4. `TASKS.md` — Now / Next / Later / Done lists
5. `DECISIONS.md` — scan all entries (this project has a meaningful log)

**Activity:**
6. The most recent diary file under `project/diary/` — check `ls project/diary/` and read the newest one
7. Run `git log --oneline -15` for recent commits
8. Run `git log -3 --stat` for detail on the last 3 commits

## Output

Create a single self-contained HTML file at:

```
project/status/status-YYYY-MM-DD.html
```

where `YYYY-MM-DD` is today's date. No external dependencies — all CSS and SVG inline.

## Section order and content

The page answers: "Will this be ready before September? What works today, what's left, and what's the most important next step?"

### 1. Header bar
- Project name (NFL Pick'em), tagline ("Private league for ~15 friends"), platform badge (Replit), current date
- **Deadline badge** — hard deadline mid-August 2026 (NFL season starts September). Show days remaining in a prominent amber/red chip.
- Palette: dark green `#166534` + amber `#d97706` + slate `#0f172a` (football field feel)

### 2. Key metrics row (stat pills)
Pull exact numbers from STATE.md, PLAN.md, and TASKS.md. Show:
- Milestone: "Basic Scaffold & Week 1 Workflow"
- Milestone completion % (derive from checked/unchecked items in PLAN.md definition of done)
- Roadmap stage (e.g. "Stage 2 of 6 — Game Schedule")
- Known issues count (from STATE.md)
- Now tasks remaining (from TASKS.md)
- Days to deadline

### 3. Current Truth
A single blunt paragraph (3–5 sentences): what works today, what is genuinely blocked, and what must happen before the deadline. Pull from STATE.md summary and PLAN.md open risks.

Example structure: "The app is [state]. [X] is working. [Y] is not yet verified. The next proof point is [Z]. The deadline is [N] weeks away."

This paragraph should be slightly uncomfortable — that means it's honest.

### 4. Milestone Progress — Definition of Done
A checklist card showing every item from PLAN.md "Definition of done." Use:
- ✓ green for checked items `[x]`
- ✗ red for unchecked items `[ ]`
- Amber note for items marked as blocked

Show a progress bar: X of Y complete. Include the plain-English blocker where one is noted.

### 5. App Readiness — Core User Flows
A horizontal flow diagram (left → right):

**Login → Profile Setup → View Week → Submit Picks → See Group Picks → View Standings**

Each node: green (shipped + verified), amber (scaffolded, untested), red (not yet built), grey (not started). Pull from STATE.md "What's working" and "Known issues."

Below the flow, a readiness table:

| Flow | Status | Notes |
|---|---|---|
| Replit Auth login | | |
| Profile setup | | |
| Game schedule loaded | | |
| Pick submission (confidence pts) | | |
| Cutoff enforcement | | |
| Scoring batch | | |
| Group Picks reveal | | |
| Weekly standings | | |
| Season standings (dropped weeks) | | |
| Playoff phase | | |
| Replit Deployment verified | | |
| Friends onboarded (Replit accounts) | | |

Use ✓ / ~ / ✗ for status. Pull status from STATE.md "What's working" and "Known issues."

### 6. Deadline Tracker
Three columns showing the critical path to launch:

**Now (unblocked)** | **Next (sequential)** | **Before Launch**

Each item is a numbered action. Pull "Now" from TASKS.md. Derive "Next" and "Before Launch" from PLAN.md roadmap stages 2–6 and the PROJECT.md success criteria checklist.

Flag any item that is on the critical path to the mid-August deadline in amber.

Show a visual timeline bar:
- Today → Game Schedule → Pick Flow Verified → Scoring Verified → Friends Onboarded → **Mid-August** → NFL Season

### 7. Roadmap Stages
All 6 stages from PLAN.md with:
- Status dot: ✓ green (done), pulsing amber (in progress), grey (pending)
- Stage name + one-line outcome label (translate to user value, not just implementation description)
- Brief note for the active stage

Outcome label examples:
- "Foundation" → "App runs, auth works, database seeded"
- "Game Schedule" → "Real games loaded; pick flow can be tested"
- "Pick Submission" → "Friends can submit weekly picks with confidence points"
- "Scoring and Standings" → "Scores calculate correctly; league can track weekly rankings"
- "Dropped Weeks and Playoffs" → "Full regular season and playoff competition works"
- "League Features" → "Team images, stickers, admin ergonomics — polish"

### 8. Open Risks
Pull from PLAN.md "Open risks" and STATE.md "Known issues." Merge into a ranked table.

| Risk | Severity | Impact | Next move |
|---|---|---|---|

Severity: High (red) / Medium (amber) / Low (grey). Sort by severity. At minimum include:
- No game schedule loaded (blocks everything else)
- Replit Auth requires friends to create Replit accounts
- No automated tests for scoring/standings logic
- NFL schedule flex/update path not defined
- Replit Deployment not yet verified end-to-end

Each row needs a "Next move" — not just a description of the problem.

### 9. Key Decisions (recent)
Pull the 5 most recent entries from DECISIONS.md (scan from bottom). For each: date chip, title, one-sentence rationale.

### 10. Next Session Focus
A single highlighted card: "If you only have one session this week, do this." Derive from the top item in TASKS.md "Now" and the most critical blocker in STATE.md.

### 11. Stack Reference
A compact card (not a full section):
- **Platform:** Replit (Auth, PostgreSQL, Deployments)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind v4 + wouter + TanStack Query
- **Backend:** Express + TypeScript (ESM) + Drizzle ORM
- **Dev:** `npm run dev` (frontend :5000, backend :3001 via Vite proxy)
- **Deploy:** `npm run build` + `npm run start:prod`
- **Required secrets:** DATABASE_URL, SESSION_SECRET, REPL_ID, REPLIT_DOMAINS, ISSUER_URL

### 12. Footer
"Generated YYYY-MM-DD · NFL Pick'em · Private league app · Deadline: mid-August 2026 · derived from PROJECT.md, PLAN.md, STATE.md, TASKS.md, DECISIONS.md, diary, git log"

## Visual style

- Background: `#f9fafb`; cards: white with `1px solid #e5e7eb` and light shadow
- Palette: dark green `#166534`, amber `#d97706`, slate `#0f172a`, sky `#2563eb`, red `#dc2626`
- Deadline badge: amber if >6 weeks, red if ≤6 weeks (mid-August 2026)
- Status cells: green bg for ✓ done/working, amber bg for ~ scaffolded/untested, red bg for ✗ not built/blocked
- Flow diagram nodes: filled circles with coloured rings; amber nodes show "untested" label
- Progress bar: green for done, amber for active stage
- "Next Session Focus" card: left amber border, slightly tinted background — this should be the most visually prominent element after the header
- No external fonts or images — system font stack only
- Fully responsive (single-column on narrow viewports)

## Rules

- Write the file directly — do not ask for confirmation first
- Derive all numbers from the source files; do not guess or hallucinate metrics
- If a section has no source data, note it inline ("Not yet documented") — do not skip it
- The days-to-deadline chip must be accurate to today's date
- After writing the file, confirm the path and list the sections included
- Keep the tone honest and slightly urgent — this is a deadline-driven project
