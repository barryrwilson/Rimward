# Security Review: Wave 68 PR2 hangar mutator + stock racks

**Scope:** `src/game/hangar.js` (`writeMountedGear`, `spendMissileAmmo`), `src/game/shipyard.js` (`buildStockRow`), `out/w68/pr2/probe.mjs`.
**Mode:** Deep audit (save/console tamper, prototype keys, class seat, ammo clamp, no combat-stat persist, no remount-on-buy).
**Pass:** 1 (post-impl).

### Risk Level: Low

### Summary
The mutator copies only allowlisted own keys. Launcher and turret ids must be catalog own keys and the mounted class must have a seat. Ammo uses `healMissileAmmo` after any launcher change. Spend requires a positive integer and a mounted row. Stock yard rows seed empty racks. No HIGH or CRITICAL on this pass.

## Security Review: writeMountedGear / spendMissileAmmo / stock racks

### Findings

#### 🟢 LOW: `writeMountedGear` mutates the live row, not a fresh literal
**Location:** `src/game/hangar.js` `writeMountedGear` 393–429
**Issue:** Scanner already wrote in place. New keys follow that path. A prior unsanitized row could keep extra own keys while launcher heals.
**Impact:** In-memory tamper only. Sanitize still drops unknown keys on restore / park.
**Status:** open
**Justification:** Same trust as the shipped scanner writer. A remake of the row would change park identity. Out of this PR.

#### 🟢 LOW: `spendMissileAmmo` trusts `row.launcher` until heal
**Location:** `src/game/hangar.js` `spendMissileAmmo` 437–447
**Issue:** Empty string refuses spend. Other dirty ids still pass the empty check, then `healMissileAmmo` caps via `launcherAmmoMax` (unknown id → 0).
**Impact:** A dirty id cannot grant ammo. Spend is 0.
**Status:** open
**Justification:** Fail closed. Re-heal of launcher is sanitize’s job.

### Resolved this pass
None. No HIGH or CRITICAL on this pass.

### Passed Checks
- [x] No secrets in the hangar / shipyard / probe diff
- [x] No `innerHTML` / `eval` / function hydrate
- [x] Patch uses `hasOwnProperty`; inherited `launcher` is ignored
- [x] Unknown keys (`damage`, `rof`, `loadout`) are not copied onto the row
- [x] `isLauncherId` / `isTurretId` (`Object.hasOwn` + reserved + length 64) plus `canSeat`
- [x] Light + `{ launcher: 'dart', missileAmmo: 4 }` → `''` / 0; no throw
- [x] `healMissileAmmo`: `'2'` / non-integer → 0; `99` + dart → 8; empty launcher → 0
- [x] Spend: non-integer / 0 / negative → 0; clamp to 0; no heat
- [x] Empty launcher spends 0
- [x] Missing hangar / missing row spends 0 (no starter rebuild)
- [x] Stock seed `launcher: ''`, `missileAmmo: 0`, `turret: ''`; buy does not remount
- [x] Combat stats not written; no `player.launcher` growth
- [x] No new `localStorage` key; no nested `loadout`

### Recommendations
1. Keep combat spawn as the only heat writer (PR3).
2. Optional later: re-heal launcher inside `spendMissileAmmo` if a caller skips sanitize.
