## Security Review: Wave 68 PR0 weapon catalog

**Scope:** `src/game/state.js` (WEAPONS.missile / WEAPONS.turret / MOUNT_TABLE), `src/game/weapon-fit.js`, `out/w68/pr0/probe.mjs`.
**Mode:** Deep audit (prototype keys, Object.hasOwn vs inherited, reserved ids, eval, persist of combat stats, XSS).
**Persona:** security-auditor + orchestrator security-review checklist.
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
PR0 is a code catalog only. Ids use `Object.hasOwn` on null-prototype frozen tables. Reserved ids fail closed. Combat stats and seat counts are not persist keys. There is no DOM sink in this write-set.

### Findings

#### 🟡 MEDIUM: catalog `name` / `line` stay raw authored strings
**Location:** `src/game/weapon-fit.js` 41–42, 51–52
**Issue:** SKU copy is plain text with no HTML strip. This PR never writes the DOM.
**Impact:** A later desk/HUD that uses `innerHTML` of `name`/`line` would XSS if a future SKU grew markup. Authored rows today have no `<`.
**Status:** open — contract requires `textContent` at the UI boundary. Do not HTML-escape the catalog here.
**Justification:** Encoding belongs at render. PR0 has no UI.

#### 🟢 LOW: local `ID_MAX` is not imported from `save.js`
**Location:** `src/game/weapon-fit.js` 9–10
**Issue:** Length cap is the integer 64, copied, not `import { ID_MAX } from './save.js'`.
**Impact:** If persist later changes `ID_MAX`, fit ids could accept a longer string than hangar sanitize. Drift is a later-PR fail-open, not a current persist bug (this module does not write saves).
**Status:** open — importing `save.js` pulls CSS + hangar into a pure catalog helper and would break `node out/w68/pr0/probe.mjs`.
**Justification:** Same integer as `save.js`. PR1 can switch to a shared import if persist lands a tiny ids module.

#### 🟢 LOW: `WEAPONS` rows are not frozen
**Location:** `src/game/state.js` 97–119
**Issue:** `MOUNT_TABLE` and SKU tables freeze. `WEAPONS.cannon` was never frozen; missile/turret follow that pattern. A console patch can change `damage` / `rof`.
**Impact:** Local runtime only. The save blob still cannot supply combat stats (no persist in this PR).
**Status:** open — freeze-all-WEAPONS is a later catalog choice, not a PR0 security hole.
**Justification:** Byte-identical existing rows; do not change freeze semantics of shipped guns.

### Resolved this pass
1. **LOW (hardened):** `freezeIds` skips reserved ids and over-long keys so a future SKU `__proto__` cannot land as an own key (`weapon-fit.js` 18–24).

### Passed checks
- [x] No secrets, tokens, or eval in the write-set
- [x] No `innerHTML` / DOM / THREE
- [x] No persist of `damage` / `rof` / `turn` / seat counts
- [x] No `sessionStorage` / new `localStorage` key
- [x] `Object.hasOwn(LAUNCHER_IDS, 'dart')` true; `'god'` / `'__proto__'` false
- [x] Tables are `Object.create(null)` then `Object.freeze` (rows frozen too)
- [x] `isLauncherId` / `isTurretId` reject non-strings, empty, length > 64, hangar reserved set
- [x] `healMissileAmmo` does not trunc; `'2'` / `2.9` → 0; empty launcher → 0
- [x] `canSeat` unknown `classKey` uses `light` without mutating `MOUNT_TABLE`
- [x] Missiles are not `beam: true`; Unknowables still miss via existing `applyHit`
- [x] `SHIP_CLASSES` has no power / kW / heat-per-fit field; `HEAT` unchanged
- [x] Probe does not edit boot-test

### Recommendations
1. PR3 desk: print SKU `name` / `line` with `textContent` only.
2. Optional later: extract `ID_MAX` + `RESERVED_IDS` to a persist-free ids module so fit and save share one import.
