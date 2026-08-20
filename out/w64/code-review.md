# Code Review: Wave 64 PR1 hangar persist

**Scope:** hangar persist + `hullKind` allowlist. No shipyard UI. No remount.
**Pass:** post-fix recheck.

### Summary
PR1 matches ShpDesign / shared-contract persist law. Snapshot parks before WORLD_FIELDS. Restore migrates a missing hangar to one living starter. `freshStart` rebuilds one living starter. WAVE64 pins and `out/w64/hangar-probe.mjs` pass. No blocker or major remains.

### What's done well
- Fresh allowlisted rows; shared cargo sanitizer; no fork of XSS string paths.
- Cap keeps the mounted row, then earlier extras, then drops the tail.
- Legacy restore deletes leftover hangar when the blob omits the key.
- World scanner / miningLaser / concealedMounts heals stay; first migrate copies them onto the mounted row only.
- HUD is read-only (`hudFamily` pins still true). `state.js` untouched.

### Findings

#### 🟡 Minor: circular module import
**Location:** `src/game/hangar.js` ↔ `src/game/save.js`
**Issue:** Hangar imports sanitizer exports; save imports hangar verbs. Load order works in Node ESM (probe + boot-test).
**Fix (later):** a tiny `persist-sanitize.js` if a later PR can add a file.

#### 🟡 Minor: `healPlayerHullKind` now also heals class/faction
**Location:** `src/game/hangar.js` `healPlayerHullKind`
**Issue:** Name says hullKind. Body also writes `classKey` / `faction` and deletes `hangarId`. Correct for tamper, slightly broader than the suggested export list.
**Status:** accept — required so reserved faction cannot sit on the player after restore.

#### 💡 Suggestion: negative vital clamp
**Location:** `vitalsFromClass`
**Issue:** Negative hull/screen/shell/engine survive if finite and ≤ max.
**Fix:** `Math.max(0, Math.min(n, max))` if a later wave wants it.

### Resolved this pass
1. Reserved faction `__proto__` no longer survives on a row or the player.
2. Live cargo rows are copied, not aliased, on mounted sync.

### Verdict
Approve for PR1 persist. WAVE62 still true. Known WAVE4/26/35 FAILs unchanged (8). WAVE64 persist pins all true.
