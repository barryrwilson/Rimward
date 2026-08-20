# Security Review: Wave 64 PR1 hangar persist

**Scope:** `src/game/hangar.js`, `src/game/save.js` (WORLD_FIELDS / snapshot / restore / freshStart / exports), `src/core/ctx.js` (comments), `scripts/boot-test.mjs` WAVE64 pins, `out/w64/**`.
**Mode:** Deep audit (save tamper, prototype keys, hullKind smuggling, XSS, blob trust, clearAutosave berth rule).
**Pass:** post-fix recheck.

### Risk Level: Low

### Summary
Hangar rows are fresh allowlisted literals. Unknown keys, reserved ids, and illegal `hullKind` tokens drop. Unknowables force `'living'`. `clearAutosave` still removes one key. No HIGH/CRITICAL remains after the reserved-faction fix.

### Findings

#### 🟡 MEDIUM: cargoCapacity has no authored upper bound
**Location:** `src/game/hangar.js` `healCargoCapacity`
**Issue:** Contract requires finite ≥ 20 only. A hand-edited `cargoCapacity: 1e12` survives.
**Impact:** Local save tamper grants a huge hold. Credits are already editable.
**Status:** open — contract wins; first-slice `{20,30,40}` lost to merge law.
**Justification:** Same class as editable credits. Do not invent a cap the contract omitted.

#### 🟡 MEDIUM: wholesale player extras still persist
**Location:** `src/game/save.js` `snapshot` `player: ctx.player`; `restore` `Object.assign`
**Issue:** SHP-02 asked to delete every unknown player key. PR1 allowlists `hullKind`, deletes `cargo` / `hangarId`, sanitizes `classKey` / `faction`. Other extras still keep.
**Impact:** A planted `hudFamily` or `price` on the player record can survive. It does not pick the HUD (`hudFamily()` reads `hullKind` only).
**Status:** open — full player strip is later depth; HUD still never writes `hullKind`.

#### 🟢 LOW: current vitals may be negative
**Location:** `src/game/hangar.js` `vitalsFromClass`
**Issue:** Clamp is current ≤ max only. `-1` hull stays.
**Impact:** Odd HUD numbers after tamper. No privilege gain.
**Status:** open — contract text is clamp current ≤ max.

#### 🟢 LOW: circular ESM import save.js ↔ hangar.js
**Location:** `src/game/hangar.js` imports sanitizers from `save.js`; `save.js` imports hangar helpers.
**Issue:** Relies on live bindings. Probe and boot-test load.
**Status:** open — no third persist module in PR1 write-set.

### Resolved this pass
1. **HIGH (fixed):** `sanitizeFaction` accepts `SAFE_ID` `__proto__`. Hangar now rejects reserved faction tokens and heals the player the same way.
2. **MEDIUM (fixed):** `syncMountedToPlayer` cloned cargo rows so live hold and parked list do not share refs.

### Passed checks
- [x] No secrets in hangar/save diff
- [x] No `innerHTML` / `eval` / function hydrate from the blob
- [x] Fresh literals; never `Object.assign(target, rawSlot)`
- [x] Drop `__proto__` / `constructor` / `prototype` / `loadout` / `price`
- [x] Reserved hull ids drop the row
- [x] `hullKind` only `living`|`built`; else delete; Unknowables → `living`
- [x] `classKey` ∈ `SHIP_CLASSES` else `light`
- [x] scanner 0|1|2, miningLaser 0|1|2|3, concealedMounts literal true else false
- [x] Cargo uses shared `sanitizeCargoList` / `stripControlChars`
- [x] Do not persist `ctx.config.ship`, cruise, meshes, bio, HUD family
- [x] `clearAutosave` removes only `rimward-save-v1`; slots 1–3 stay
- [x] No new localStorage hangar key
- [x] World equipment keys stay on WORLD_FIELDS

### Recommendations
1. Later PR: extract cargo sanitizers so save/hangar are not circular.
2. Later PR: optional full player-key strip if SHP remount lands.
