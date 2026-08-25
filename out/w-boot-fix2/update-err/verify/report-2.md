## Status
BUGS_FOUND

## What I tested
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/probe.mjs`. Exit 0. Line `PROBE PASS` was in the output. Log: `out/w-boot-fix2/update-err/verify/probe-2.log`.
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/verify/extra-probe.mjs`. Exit 0. Line `EXTRA PROBE PASS` was in the output. Included `hailClosed-with-null-hole`, `hailOpened-with-null-hole`, `hunt-acquire-with-null-hole`. Log: `out/w-boot-fix2/update-err/verify/extra-probe-2.log`.
- Read `src/systems/npc.js` hunt acquire (`1837–1840`), hailClosed/hailOpened walks (`2446–2455`), demand-hit emit (`2373–2379`), and `findHunterOf` / `findPirateWork` (`1242–1277`).
- Confirmed hailClosed/hailOpened still skip `!s || !s.ai`. Demand-release gates on complete hulls still require `demanding` plus `demandOutcome` on close, and still release only other ships on `hailOpened`.
- Confirmed hunt acquire still skips `!other` then still uses `isCivilianRole(other.role)`, live `state`, law-zone, and encounter-bubble distance.
- Ran `out/w-boot-fix2/update-err/verify/hunt-acquire-complete-probe.mjs` to confirm hunt still acquires a complete civilian. Log: `out/w-boot-fix2/update-err/verify/hunt-acquire-complete-probe.log`.
- Did not run `npm run test:boot`.

## Bugs found

### Bug 1: tickTraderJob / findHunterOf still throws on a null list hole
- Severity: HIGH
- Repro: Put a complete trader and a complete hunt pirate in `ctx.ships` with a `null` hole (`[null, pirate, dummy, trader]`). Call `npc.update(dt)`.
- Expected: Incomplete entries skip. The pirate still acquires the complete trader. Update does not throw.
- Actual: `TypeError: Cannot read properties of null (reading 'ai')` at `src/systems/npc.js:1247` (`findHunterOf` via `tickTraderJob` at `1294`). The extra-probe hunt case does not hit this path because it has no complete civilian, so `tickTraderJob` never runs.
- Evidence: `out/w-boot-fix2/update-err/verify/hunt-acquire-complete-probe.log` (`FAIL hunt-acquire-complete-with-null-hole`). Stack names `findHunterOf` then `tickTraderJob` then `Object.update`. Same file: `PASS hunt-acquired-complete-trader` when the hole is absent.

### Bug 2: tickPatrolJob / findPirateWork still throws on a null list hole
- Severity: HIGH
- Repro: Put a complete patrol and a complete pirate in `ctx.ships` with a `null` hole (`[null, patrol, pirate]`). Call `npc.update(dt)`.
- Expected: Incomplete entries skip. Patrol job / pirate-work walk does not throw.
- Actual: `TypeError: Cannot read properties of null (reading 'ai')` at `src/systems/npc.js:1267` (`findPirateWork` via `tickPatrolJob` at `1356`).
- Evidence: `out/w-boot-fix2/update-err/verify/hunt-acquire-complete-probe.log` (`FAIL findPirateWork-with-null-hole`).

The named hailClosed / hailOpened / hunt-acquire (line 1837) throws from iteration 1 are gone. Demand-hit still emits ship-scoped `hailClosed` on a demanding live hull (`demanding-emits-hailClosed count=1`). Hunt still acquires a complete trader when the list has no holes.

## Environmental issues

## Evidence
- Worker probe: `out/w-boot-fix2/update-err/verify/probe-2.log`

```
PASS wave74-dummy-alone
PASS no-ai
PASS ai-without-velocity
PASS missing-object
PASS missing-state
PASS hole-in-list
PASS hailClosed-with-null-hole
PASS hailOpened-with-null-hole
PASS destroyed-wreck-no-object
PASS mix-dummy-and-live
PASS live-npc-still-ticks
PASS live-velocity-written-or-kept
PROBE PASS
```

- Extra probe: `out/w-boot-fix2/update-err/verify/extra-probe-2.log`

```
PASS velocity-plain-object
PASS velocity-length-number
PASS hailClosed-with-null-hole
PASS hailOpened-with-null-hole
PASS hailClosed-dummy-only
PASS hunt-acquire-with-null-hole
PASS hunt-acquire-did-not-throw
PASS hailClosed-hunt-with-null-hole
PASS hailClosed-hunt-hold-released
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
EXTRA PROBE PASS
```

- Hunt complete probe: `out/w-boot-fix2/update-err/verify/hunt-acquire-complete-probe.log`

```
PASS hunt-acquire-complete-no-hole
PASS hunt-acquired-complete-trader target=prey
PASS incomplete-dummy-not-acquired
FAIL hunt-acquire-complete-with-null-hole Cannot read properties of null (reading 'ai')
FAIL findPirateWork-with-null-hole Cannot read properties of null (reading 'ai')
HUNT COMPLETE FAIL — 2: hunt-acquire-complete-with-null-hole, findPirateWork-with-null-hole
```

Code still in the live path:

- Hail hole skip: `src/systems/npc.js:2448` and `2453` (`if (!s || !s.ai) continue`)
- HailClosed outcome gate unchanged: `src/systems/npc.js:2449`
- HailOpened steal-other-ship gate unchanged: `src/systems/npc.js:2454`
- Hunt acquire hole skip plus civilian/law/bubble predicates: `src/systems/npc.js:1837–1840`
- Demand-hit still emits `hailClosed`: `src/systems/npc.js:2373–2379`
- Remaining hole throws: `findHunterOf` `src/systems/npc.js:1247` (`if (other === live || !other.ai)`), `findPirateWork` `src/systems/npc.js:1267` (`if (other === live || !other.ai || !other.object)`)
