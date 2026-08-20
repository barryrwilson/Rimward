## Code Review: `src/game/save.js` sanitizeJobs (WAVE 71 PR1)

### Summary

PR1 lands persist heal only. `sanitizeJobs` runs from `sanitizeRestored`. Omit-key restore now deletes `world.jobs` like hangar / fieldOre, then heals missing to `[]`. Probe and edge-probe PASS. No 🔴 Blocker or 🟠 Major issues.

### What's done well

- Call site is `sanitizeRestored` (`save.js:647`), after wholesale assign in `restore`.
- Omit-key: `save.js:705-706` deletes missing `jobs`; `sanitizeJobs` maps non-array to `[]`.
- `WORLD_FIELDS` already has `'jobs'`. No new persist key.
- Empty / non-array heals to `[]` without `ensureJobs` / `makeJobs`.
- Hyphen-token grammar reuses `SAFE_ID` on each token only.
- Cap is `4 + MINING_SLOTS_PER_SYSTEM * Object.keys(SYSTEMS).length + 16`.
- Probe pins unique four, proto mining, cap, `payQuoted` clamp, omit-key, prototype pollution.

### Findings

#### 🟠 Major (resolved): Omitted `jobs` key kept live session jobs

**Location:** `src/game/save.js:698-706`  
**Issue:** Restore copied `WORLD_FIELDS` only when defined. A blob without `jobs` left the live board. Contract §1.2 and fieldOre precedent require missing → `[]`.  
**Fix applied:** Delete `ctx.world.jobs` when `snap.world.jobs === undefined`. `sanitizeJobs` treats undefined as `[]`. Probe `omit.jobsEmpty`; edge-probe omit pins.  
**Status:** resolved

#### 🟡 Minor (resolved): Extra mining overflow is per-slot

**Location:** `src/game/save.js:333-358`  
**Issue:** A global sort by slot then `n` would keep two `slot:0` rows and drop honest `slot:1`.  
**Fix applied:** Per (`originSystem`, `slot`), keep lowest `n`; later offered duplicates are extras.  
**Status:** resolved

#### 🟡 Minor: Optional dest/system fields copy onto kinds that do not use them

**Location:** `src/game/save.js:308-312`  
**Issue:** A valid `destSystem` on mining or a valid `system` on patrol is copied because the fields are on the allowlist. Later ticks ignore them.  
**Fix:** Optional: copy `destSystem` only for haul/ferry and `system` only for pirate overlay.  
**Status:** open (justified: contract §1.4 “if present and a SYSTEMS key, keep”)

#### 💡 Suggestion: Map.forEach to collect keys

**Location:** `src/game/save.js:348`  
**Issue:** `bySysSlot.forEach` is not `for…in`, but the rest of the healer uses index `for`.  
**Status:** open (no behavior change)

#### 💡 Suggestion: Unbounded `reward`

**Location:** `src/game/save.js:270`  
**Issue:** Finite `reward` can be huge. Contract does not clamp it.  
**Status:** open (contract-faithful)

### Verdict

Approve for PR1 persist heal. Omit-key heal is in place. Do not start mining fill, expire, UI, or boot-test pins here.
