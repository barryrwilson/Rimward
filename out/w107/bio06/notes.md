# WAVE107 BIO-06 notes

## Landed

- PR1 `src/game/living-cadence.js` — frozen `LIVING_CADENCE`, `cadenceFor` hasOwn → light, `classCruise` reads `SHIP_CLASSES` (no state.js write). Exports `SWIM_IDLE_HZ` 0.5 / `SWIM_CRUISE_HZ` 2.3.
- PR2 `src/systems/ship.js` — light (unknown → light) bit-identical Hz/flap. Other living remounts: hzScale + flap sweepScale. Breath/heart/mood/bodyAmp unscaled. Built plated still no CPU swim.
- PR3 `src/systems/ship-assets.js` — Beautiful only. `userData.classKey`. Class-cruise speed-norm. `uSwimSweep`. Shader flap × sweep. Breath unscaled. Program key bumped. Mixer timeScale untouched.
- PR4 WAVE107 boot pins after WAVE104. All nine pin keys true.

## Verify

- `node out/w107/bio06/probe.mjs` — exit 0.
- `node out/w107/bio06/boot-pins.mjs` — replica of harness pins, all true.
- `npm run test:boot` — `wave107 bio-06` all true. Harness still FAIL on older WAVE* (expected). Do not fix those.

## Coupling

- Cadence module imports `SHIP_CLASSES` from `state.js` (read).
- `ship.js` and `ship-assets.js` import the cadence module. Duplicate Hz tables removed.
- `npc.js` still calls `updateShipAsset(object, elapsed, reducedMotion, camera, speed)`.

## Surprises

- None in src. Boot harness FAIL count stayed on known older waves.
- Graph resolve: proceed_unmodeled.

## Env

- No Vite. No Chrome. No listener on 5177–5199 or 94xx from this worker.
- No blender / GLB rewrite.
