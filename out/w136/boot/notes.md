# Wave 136 boot pins

Merged into `scripts/boot-test.mjs` immediately before the final pass/fail log. Earlier waves were not rewritten.

## NAV-10 (dock approach)

Source pins from `out/w136/dockapproach/boot-pins.md`: `DOCK_SLOW_VERB`, `.rw-slow-lamp`, MATCH stays, `tgtSpeed` speed-only, hub 80×80, HOME 108, no `innerHTML`, no `state.js` `DOCK_SLOW`.

Live HUD: if `#hud` has `.rw-prompt-verb`, the harness parks in the dock zone, holds speed 120 vs 20 for 15 frames, and checks the Dock / SLOW verb. `.rw-slow-lamp` is asserted only when that node exists.

The stub `querySelector` returns null, so `selfSlowLamp` may never mount. In that case the lamp pin is source-only. If `station.inZone` is false after park, the live verb pins stay true (skip). Pose, speed, throttle, pause, berth hold, jump, and dock restore in `finally`.

## TGT-07 (combat cycle)

Source pins from `out/w136/tgtcycle/boot-pins.md`: help line, `isCycleHostile`, gated sort, wrap, no `for-in` ships, no `innerHTML`, no class pierce.

Live: three stubs at d2 20 / 40 / 59. Only the far hull has `ai.intent === true`. `targets.current = null`, `KeyT`, `tick(1)` → first lock is the hostile. Then intent off → nearest first. Stubs use `THREE.Vector3` `distanceToSquared`. Ships, lock, weapon group, and pause restore in `finally`.

## MSN-04 (job dedup)

Source pins from `out/w136/jobdedup/boot-pins.md`: exclude helper, bounded attempts, no `while (true)`, unique four ids, Digit2 jobs, `healOfferedMiningTwins`.

Live: WAVE71-style warp/dock freehold, Digit2, live mining commodities unique (`Set` size === length). Then two offered `rawOre` twins, Digit2 again so `syncMiningJobs` heals. Unique four must remain. Jobs array, system, and dock restore in `finally`. Soft table still has two hardness-1 keys; WAVE71 `fillTwo` is not attacked.

## Verification

`node --check scripts/boot-test.mjs` only. Full `npm run test:boot` is the parent run.
