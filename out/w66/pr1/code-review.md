# Code Review: Wave 66 PR1 survivor cargo persist pins

**Scope:** `src/game/save.js`, `scripts/boot-test.mjs` WAVE66 SAVE PINS only.
**Pass:** final (no blocker / major).

### Summary
PR1 closes the `SAFE_ID` / `__proto__` faction hole and pins the survivor keep-list. Restore rebuilds cargo literals. `WORLD_FIELDS` does not grow. WAVE66 SAVE PINS are all-true. No blocker or major remains.

### What's done well
- Keep-list is a new object: `commodity`, `units`, `source`, optional `faction` / `name`.
- Reserved faction drops the row (fail closed), not a faction-less hold leftover.
- `sanitizeFaction` change also covers hangar callers without a hangar.js edit.
- Pins use public `restore()` plus `sanitizeCargoList` / `WORLD_FIELDS`, same style as WAVE64.
- Ordinary ore cannot keep `faction` / `source` / `name`.

### Findings

#### 🟡 Minor: `RESERVED_IDS` is copied from hangar.js
**Location:** `src/game/save.js` 100–104; `src/game/hangar.js` 21–25
**Issue:** Two sets. A later hangar add can drift.
**Fix:** Hangar already imports sanitizers from `save.js`. A later owner can import one set. Out of PR1 write-set.

#### 💡 Suggestion: freeze `WORLD_FIELDS`
**Location:** `src/game/save.js` 73
**Issue:** Export lets a caller mutate the whitelist.
**Fix:** `Object.freeze([...])` if a later PR wants it. Restore pin already refuses `peopleTrafficked`.

### Resolved this pass
1. `__proto__` / `constructor` / `prototype` cannot become cargo faction.
2. Extra keys and ore provenance leak drop on sanitize.

### Verdict
Approve for PR1 persist pins. Known WAVE4/26/35 FAILs unchanged (8). WAVE66 SAVE PINS all-true.
