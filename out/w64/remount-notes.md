# Wave 64 PR2 — remount + flight envelope

`switchTo(ctx, id)` in `src/game/hangar.js` parks the mounted row, loads the chosen row through `createShipState` + parked vitals, copies authored `SHIP_CLASSES[classKey]` onto `ctx.config.ship`, replaces `ctx.cargo`, mirrors scanner / miningLaser / concealedMounts, then remounts the mesh.

Envelope map: `cruise` → `maxSpeed`, `creep` → `creep`, `burn` → `maxSpeed * afterburner.multiplier`, `stopTime` → `damping = 1 / stopTime` (light 2 s → 0.5). Acceleration scales with cruise so light stays 90. Do not persist `ctx.config.ship`. Do not read cruise/burn/creep/stopTime off the hangar blob.

Unknowables force `hullKind: 'living'` before the mesh branch. Living remount rebuilds `makeLivingHull` + swim / breath / heartbeat. Built remount uses `buildPlayerPlatedMesh` (NPC builder, player-scaled). Fallback plated box if the SKU is not primed. Boot default stays the living starter.

`restore` / `freshStart` call `applyMountedFlight` after hangar heal.

Probe: `node --import ./scripts/with-css-stub.mjs out/w64/remount-probe.mjs`
