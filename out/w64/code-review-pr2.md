# Code Review: Wave 64 PR2 remount + envelope

**Scope:** remount + `ctx.config.ship` retune from `SHIP_CLASSES`. Living preserve. Unknowables living before mesh.
**Pass:** post-fix recheck.

### Summary
PR2 matches ShpDesign §5 and shared-contract §4. Envelope copy is mandatory and authored. Living remount still swims. Built remount uses the NPC plated builder, player-scaled, with no living vertex swim. WAVE64 remount pins and `out/w64/remount-probe.mjs` pass. Persist pins stay true. No blocker or major remains.

### What's done well
- `classKey` alone does not retune cruise; `applyFlightEnvelope` writes `config.ship`.
- Hangar stays THREE-free; ship.js registers remount.
- Restore / `freshStart` run envelope + remount after hangar heal.
- Unknowables force living before the mesh branch.
- Cargo replace, not concat. Bio / throttle / MATCH left alone.
- Rollback snapshot on remount throw.

### Findings

#### 🟡 Minor: circular module import
**Location:** `src/systems/ship.js` → `hangar.js` → `save.js` → `hangar.js`
**Issue:** Remount register + envelope live on hangar. Load order works in Node ESM (probe + boot-test).
**Fix (later):** keep the register hook; extract envelope to a tiny numbers module if a later PR can add a file.
**Status:** accept — same class as PR1 hangar/save cycle.

#### 🟡 Minor: every restore rebuilds the player mesh
**Location:** `src/game/save.js` `applyMountedFlight` after `syncMountedToPlayer`
**Issue:** Death restore remounts even when the mounted row is still the living starter.
**Impact:** Extra dispose/rebuild on load. Correct envelope + kind. Not a functional miss.
**Status:** accept — contract says restore remount must run the copy.

#### 💡 Suggestion: `familyAfterLive` pin allows unset kind
**Location:** `scripts/boot-test.mjs` WAVE64 remount
**Issue:** Parking a player with no `hullKind` stores an unset row. Switch-back stays `bio` without stamping `'living'`.
**Fix:** optional — park could keep `'living'` when the live mesh path is living. Contract allows unset = bio.

### Resolved this pass
1. Remount requires `ctx.scene` and `ctx.ship.object`. Persist stubs skip mesh work.
2. Rig lives on `ctx.ship.hullRig`. Dispose only the replaced root (`prev.root === oldRoot`).
3. `familyAfterLive` pin matches HUD law (`bio` and not `'built'`).

### Verdict
Approve for PR2 remount. WAVE62 still true. Known WAVE4/26/35 FAILs unchanged (8). WAVE64 persist + remount pins all true.
