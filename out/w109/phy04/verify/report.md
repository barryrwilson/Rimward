## Status
[ CLEAN ]

## What I tested
- Ran `node out/w109/phy04/probe.mjs`. Exit 0, `ALL CLEAN` (source pins plus live `applyAvoidBias` import).
- Ran `node --import ./scripts/with-css-stub.mjs out/phy-verify/kernel-pins.mjs`. Exit 0, `KERNEL PINS PASS`. `phy04.avoidKeysUnchanged` still pins `AVOID_LOOKAHEAD` 40 and `AVOID_GAIN` 1.4. Additive checks `phy04.midSample`, `phy04.bounceLive`, `phy04.noNavmeshPlan`, `phy04.sunRadii` (2.4 / 1.12) all passed.
- Ran `node out/w109/phy04/verify/extra-probe.mjs`. Exit 0, `EXTRA CLEAN`. Extra cases: mid-only asteroid bias, dest not mutated, 40 u sample still biases, station path keep-out counts one hit, both samples can count, empty bag keeps dest, pirate skip of player body, player skip of gate, `writeStationHold` / `minerHoldFromStation` sit outside the D5 cylinder.
- Static grep of `src/systems/npc.js`: `planApPath` 0, `navmesh` 0, `bounceLive` still defined and called under `_phyOn`, `applyAvoidBias` still exported, no `record.route =`, one module `_bodies`, `collectBodies(ctx, _bodies)` once per NPC update.
- `src/game/physics.js`: `AVOID_LOOKAHEAD: 40`, `AVOID_GAIN: 1.4`, `SUN_HEAT_MULT: 2.4`, `SUN_LETHAL_MULT: 1.12`. No AVOID retune.
- `src/game/save.js` `WORLD_FIELDS`: no persist `avoid` key.
- `src/systems/hud.js` reticle init still RANGE on 80 px hub; no avoid pip child. `src/ui/hud.css`: no `avoid` token.
- `src/systems/ship.js`: no `applyAvoidBias` (player FLT avoid not added). Working-tree ship.js diff is BIO gait, not PHY-04.
- Digit steal: `npc.js` has no `DOCK_KEY_SERVICES` and no Digit 0/8/9. Dirty `src/systems/station.js` is MSN-03 SKU grant text, not PHY.
- `scripts/boot-test.mjs` is dirty (+349). The WAVE109 block is `WAVE109 MSN-03 remaining unique SKU grants`. No PHY-04 section. MSN sibling owns that pin. PHY worker did not add PHY pins there.
- Flag scan: no extra `{ count, items }` alloc in `applyAvoidBias`; no `speed = 0` in avoid/hold; bounce still runs; hunt/loiter split keeps pirate player aim (`writeFrameHold` only `route`/`loiter`).
- Live Vite 5180 / CDP 9421 / Playwright: not started. `netstat` found no listeners on 5180 or 9421.

## Bugs found
None. No extra bag alloc per NPC. No freeze / `speed = 0` on empty bag. No player FLT avoid. No sun-radius retune. No Digit steal. No `record.route` write.

Documented (already in worker reviews, not new bugs):
- `typeof addMidChordHit === 'function'` is always true in the same file. Fail-closed 40 u path still runs first.
- `writeFrameHold` rewrites only when dest is inside the cylinder (`stationCylHits` on dest). Chord-through dest keeps live keep-out so a gate waypoint is not skipped.

## Environmental issues
- `[NO BROWSER COVERAGE]` Freighter hold→gate, miner home-to-hold, pirate aim, and hub pip were not watched in a live session.
- Unrelated dirty files (not PHY-04): `scripts/boot-test.mjs` (WAVE109 MSN-03), `src/systems/ship.js` (BIO gait), `src/systems/station.js` (MSN SKU grant). `docs/Phy04AvoidDesign.md` is untracked worker docs.

## Evidence
- Probe: `node out/w109/phy04/probe.mjs` → `ALL CLEAN` (exit 0).
- Kernel: `node --import ./scripts/with-css-stub.mjs out/phy-verify/kernel-pins.mjs` → `KERNEL PINS PASS` including `phy04.avoidKeysUnchanged look=40 gain=1.4`.
- Extra: `out/w109/phy04/verify/extra-probe.mjs` → `EXTRA CLEAN` (exit 0).
- Implementation: `src/systems/npc.js` `addMidChordHit` (mid = `look * 0.5`, skip `station`), `applyAvoidBias`, `writeFrameHold` (no `record.route`), `steerLive` hold-then-bias, `bounceLive` calls at disabled and post-mode.
- Pins: `src/game/physics.js` 19–20, 15–16; `out/phy-verify/kernel-pins.mjs` 176–194.
- Ports: 5180 and 9421 were free. This verifier started no Vite, Chrome, or Playwright process.
