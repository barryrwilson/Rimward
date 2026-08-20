# Security Review: Wave 68 PR1 hangar weapon persist

**Scope:** `src/game/hangar.js`, `src/game/save.js` (`WORLD_FIELDS` / `restore` overwrite), `src/core/ctx.js` (defaults + comment), `out/w68/pr1/probe.mjs`.
**Mode:** Deep audit (save tamper, prototype keys, allowlist ids, ammo clamp, world-blob dart grant, no persist of combat stats).
**Pass:** 1 (post-impl).

### Risk Level: Low

### Summary
Hangar rows stay fresh literals. Launcher and turret ids must be own catalog keys and the class must have a seat. Ammo uses `healMissileAmmo` after the launcher heal. Restore overwrites world mirrors from the mounted row. A world blob cannot grant a dart that the row does not have.

## Security Review: hangar persist (launcher / missileAmmo / turret)

### Findings

#### 🟡 MEDIUM: in-session `sanitizeHangar` does not wipe world mirrors
**Location:** `src/game/hangar.js` `sanitizeHangar` 271–301; `src/game/save.js` `snapshot` 180–184
**Issue:** Restore calls `syncMountedWeaponMirrors` after hangar sanitize. `snapshot` / `ensureHangar` do not. If hangar is missing, `writeStarterHangar` builds an empty-rack starter, then `parkMounted` copies live `world.launcher` onto that row.
**Impact:** A console or mid-session world dart on a heavy player can land on a newly built starter at the next park. Restore of a blob with no hangar still forces `''` / `0` / `''` (probe pin 11).
**Fix:** Optional later: after starter rebuild, force empty racks and skip park of world launcher onto a just-created starter.
**Status:** open
**Justification:** Restore overwrite is the blob law. Park-from-live-world is the same class as scanner migrate. No extra grant on the restore path.

#### 🟢 LOW: `syncMountedWeaponMirrors` copies row fields without a second heal
**Location:** `src/game/hangar.js` `syncMountedWeaponMirrors` 372–385
**Issue:** The helper writes `row.launcher` / `missileAmmo` / `turret` as-is. A hangar mutated after sanitize could put a dirty id on world.
**Impact:** In-memory tamper only. `restore` sanitizes hangar first. The next `sanitizeHangarRecord` still drops unknown ids and unseated dart.
**Status:** open
**Justification:** Same trust as scanner after sanitize. Re-heal is PR2 depth.

#### 🟢 LOW: `WORLD_FIELDS` array stays mutable
**Location:** `src/game/save.js` `WORLD_FIELDS` 74–96
**Issue:** A later module can `push` extra names. A crafted blob still cannot add a key that the array does not list.
**Status:** open
**Justification:** Nearby style is a plain array.

### Resolved this pass
None. No HIGH or CRITICAL on this pass.

### Passed Checks
- [x] No secrets in the hangar / save / ctx diff
- [x] No `innerHTML` / `eval` / function hydrate from the blob
- [x] Fresh hangar literals; never `Object.assign(row, raw)`
- [x] Unknown keys drop (`loadout`, `damage`, `rof`, `mass`, `power`, `__proto__`)
- [x] Reserved hull ids still return null
- [x] Launcher / turret: `Object.hasOwn` catalog + reserved-id reject + length 64 (`isLauncherId` / `isTurretId`)
- [x] Class with 0 missile seats (light / cutter / freighter) heals launcher to `''` and ammo to 0
- [x] `healMissileAmmo` after launcher heal: `''` → 0; `'2'` / `2.9` → 0; `99` + dart → 8
- [x] World blob `launcher: 'dart'` + empty light row or missing hangar → world `''` after overwrite
- [x] Player `launcher` / `turret` / `missileAmmo` own keys deleted by `healPlayerHullKind`
- [x] `writeMountedGear` not grown (unknown launcher patch still ignored)
- [x] No new event type; `weaponGroup` unchanged
- [x] Combat stats (`damage`, `rof`) not persisted
- [x] No new `localStorage` weapons key; hangar still rides `{v:1}`

### Recommendations
1. PR2: grow `writeMountedGear` with the same heal as sanitize.
2. Later: re-heal inside `syncMountedWeaponMirrors` if a second caller skips sanitize.
