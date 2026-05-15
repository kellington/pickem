# Decisions

Append-only log of meaningful decisions. Never edit past entries — if a
decision is reversed, add a new entry that references the old one.

## How to write an entry

```
## [YYYY-MM-DD] — Short title

**Decision:** What we decided, in one sentence.
**Why:** The reasoning that drove it.
**Trade-off:** What we're giving up.
**Impact:** What changes because of this (code, scope, process).
```

Keep entries short. If you need more than ~8 lines, you're probably
writing a design doc, which belongs elsewhere.

---

## [YYYY-MM-DD] — Example: chose SQLite over Postgres

**Decision:** Use SQLite for local dev and first deploy.
**Why:** Solo project, single-writer workload, no ops overhead.
**Trade-off:** Will need a migration if we ever add concurrent writers.
**Impact:** Connection string simpler, no Docker dep for dev setup.

<!-- Delete the example once you add a real entry. -->
