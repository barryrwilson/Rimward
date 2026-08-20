# Security Review: Wave 64 PR2 remount + envelope

**Scope:** `src/systems/ship.js` remount, `src/game/hangar.js` switchTo / applyFlightEnvelope, `src/game/save.js` applyMountedFlight hooks, `src/systems/npc.js` `buildPlayerPlatedMesh`, `scripts/boot-test.mjs` WAVE64 remount pins, `out/w64/**`.
**Mode:** Deep audit (dispose leaks, blob cruise, Unknowables mesh branch, XSS).
**Pass:** post-fix recheck.

### Risk Level: Low

### Summary
Envelope numbers come from authored `SHIP_CLASSES` only. Hangar blob cruise is dropped and never copied. Unknowables force `'living'` before the mesh branch. Remount disposes unique living geos/mats and releases NPC assets without disposing shared templates. No HIGH/CRITICAL remains after the remount-ctx guard.

### Findings

#### 🟡 MEDIUM: cargoCapacity still has no authored upper bound
**Location:** `src/game/hangar.js` `healCargoCapacity`
**Issue:** Switch copies the sanitized row capacity. Tamper `1e12` still survives PR1 law.
**Impact:** Local save tamper grants a huge hold. Credits are already editable.
**Status:** open — contract wins; do not invent a cap PR1 omitted.
**Justification:** Same class as editable credits.

#### 🟢 LOW: module `currentRig` is a fallback only
**Location:** `src/systems/ship.js` `currentRig`
**Issue:** Last living/built visual is also cached on the module. Live update reads `ctx.ship.hullRig` first.
**Impact:** Extra `initShip` in a harness can still overwrite the fallback. Game boot has one ship system.
**Status:** open — hull identity lives on `ctx.ship`.

### Resolved this pass
1. **HIGH (fixed):** `remountPlayerHull` used module `currentRig` even when `ctx.ship.object` was missing. A foreign ctx could dispose the live hull. Guard: require `ctx.scene` and `ship.object`. Store the rig on `ctx.ship.hullRig`. Dispose only when `prev.root === oldRoot`. Do not bind remount to the last `initShip` ctx (harness extra boots would steal it).
2. **MEDIUM (fixed):** Envelope never reads hangar `cruise` / `maxSpeed` / `burn` / `creep` / `stopTime`. Tamper 999 is ignored (probe + boot pins).

### Passed checks
- [x] No secrets in remount/envelope diff
- [x] No `innerHTML` / `eval` / function hydrate from the blob
- [x] Do not persist `ctx.config.ship`
- [x] Envelope from `SHIP_CLASSES[classKey]` after class sanitize (`light` fallback)
- [x] Unknowables `hullKind = 'living'` before living vs built mesh
- [x] Living unique geos/mats disposed; NPC templates `releaseShipAsset` only
- [x] Fallback plated unique geo/mat disposed; shared glow geo not disposed
- [x] Trail Points stay on the scene (not parented, not disposed)
- [x] Player mesh never `ctx.ships.push`
- [x] No DOM write of `shipName` / hull names in this PR (desk is PR3)
- [x] switchTo refuse: not docked, combat, jump, destroyed, paused, missing, already mounted
- [x] Rollback restores player, cargo, hangar, capacity, world mirrors, `config.ship`
- [x] HUD never writes `hullKind`

### Recommendations
1. Station PR3: keep catalog / hull names on `textContent`.
2. Keep remount bound to the boot ctx; do not call it on headless persist stubs (already no-ops).
