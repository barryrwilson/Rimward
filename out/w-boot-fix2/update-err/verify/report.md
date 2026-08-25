## Status
BUGS_FOUND

## What I tested
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/probe.mjs`. Exit 0. Line `PROBE PASS` was in the output.
- Read the `src/systems/npc.js` update loop, `steerLive`, `removeLiveShip`, `animateShipMesh`, `handleDestroyed`, hail-closed, telegraph, and turret code.
- Confirmed worker files under `out/w-boot-fix2/update-err/` plus `src/systems/npc.js`. Other dirty repo files belong to other waves in this tree.
- Ran extra cases in `out/w-boot-fix2/update-err/verify/extra-probe.mjs` (velocity without `length`, hailClosed with a dummy, wreck without `object`, `removeLiveShip`/`animateShipMesh` no-ops, demanding hailClosed emit, pirate telegraph, live velocity after a dummy).

## Bugs found
- `initNpc.update` skips a missing `ctx.ships` entry in the per-hull loop (`if (!live) continue`), but the same frame still walks `ctx.ships` raw on hail events. `hailClosed` at `src/systems/npc.js:2448` throws `Cannot read properties of null (reading 'ai')`. `hailOpened` at `src/systems/npc.js:2452` throws on `undefined`. Dummy hulls without `ai` do not throw on this path.
- Hunt acquire also walks `ctx.ships` without a hole skip (`src/systems/npc.js:1837`). A live pirate plus a `null` hole throws `Cannot read properties of null (reading 'role')` before hail release. WAVE74 KeyT dummies (object+state+record, no `ai`) do not hit this.

## Environmental issues

## Evidence
Worker probe (`out/w-boot-fix2/update-err/verify/probe.log`):

```
PASS wave74-dummy-alone
PASS no-ai
PASS ai-without-velocity
PASS missing-object
PASS missing-state
PASS hole-in-list
PASS destroyed-wreck-no-object
PASS mix-dummy-and-live
PASS live-npc-still-ticks
PASS live-velocity-written-or-kept
PROBE PASS
```

Extra probe (`out/w-boot-fix2/update-err/verify/extra-probe.log`):

```
PASS velocity-plain-object
PASS velocity-length-number
FAIL hailClosed-with-null-hole Cannot read properties of null (reading 'ai')
FAIL hailOpened-with-null-hole Cannot read properties of undefined (reading 'ai')
PASS hailClosed-dummy-only
PASS destroyed-no-object-spawn-survivor-path
PASS removeLiveShip-no-object
PASS animateShipMesh-no-userData
PASS demanding-live-hailClosed-emit
PASS demanding-emits-hailClosed count=1
PASS demanding-cleared
PASS hailClosed-event-releases-stamped-hold
PASS stamped-hold-released
PASS pirate-hunt-telegraph
PASS telegraph-phase-set phase=telegraph
PASS telegraph-no-npcFire ["hailOpened"]
PASS live-velocity-copy-after-dummy
PASS live-velocity-moved-or-kept
EXTRA FAIL — 2: hailClosed-with-null-hole, hailOpened-with-null-hole
```

Code still in the live path (not gutted):

- Dummy / no `ai` / no `velocity.length` / no `object` skip: `src/systems/npc.js:2349-2365`
- `steerLive` writes velocity only when `copy` exists: `src/systems/npc.js:828-829`
- Demand hit still emits ship-scoped `hailClosed`: `src/systems/npc.js:2373-2379`
- Outcome-stamped `hailClosed` / steal-on-`hailOpened` still run: `src/systems/npc.js:2445-2454`
- Telegraph freeze and turret-cold-until-attack still in `engageTarget` / `tryNpcTurret`

Worker probe is thin on `lastEvents` hail plus list holes. `ai.velocity` without `length` does skip (typeof check). Destroyed wreck without `object` does not throw (`handleDestroyed` / `removeLiveShip` no-op).
