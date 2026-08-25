## Status
CLEAN

## What I tested
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/verify/duel-flee-probe.mjs`. Exit 0. Line `DUEL/FLEE PROBE PASS` was in the output. Log: `out/w-boot-fix2/update-err/verify/duel-flee-probe-4.log`.
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/probe.mjs`. Exit 0. Line `PROBE PASS` was in the output. Log: `out/w-boot-fix2/update-err/verify/probe-6.log`.
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/verify/extra-probe.mjs`. Exit 0. Line `EXTRA PROBE PASS` was in the output. Log: `out/w-boot-fix2/update-err/verify/extra-probe-6.log`.
- Grepped `src/systems/npc.js` for `SHIP_CLASSES[`, `.cruise`, and `.burn` on the update path.
- Read `shipClassOf` / `classCruise` / `classBurn` / `speedCap` (`410–428`), `updateDuel` (`1912–2071`), `updateFlee` (`2084–2114`), and the per-hull switch (`2412–2418`).
- Confirmed known cutter values: flee speed `210` (`SHIP_CLASSES.cutter.burn`), duel extend `73.5` (`cruise 105 × 0.70`).
- Did not run `npm run test:boot`. Did not edit `src/`. Did not kill pre-existing node processes (none of the probes stayed alive).

## Bugs found

## Environmental issues

## Evidence
Duel/flee probe (`out/w-boot-fix2/update-err/verify/duel-flee-probe-4.log`):

```
PASS dummy-unknown-class-no-ai
PASS dummy-plus-hole
PASS loiter-unknown-classKey
PASS route-unknown-classKey-wave116-default
PASS hunt-unknown-classKey
PASS duel-unknown-acePhase1
PASS duel-acePhase1-uses-speedCap
PASS duel-unknown-acePhase2
PASS duel-unknown-acePhase2-finite spd=0
PASS duel-unknown-acePhase3
PASS duel-unknown-acePhase3-finite-zero spd=0
PASS flee-trader-no-hunter-stands-down
PASS flee-trader-stood-down-to-route mode=route
PASS hail-or-capitulate-pirate-flee
PASS unknown-pirate-flee-speed-zero mode=flee spd=0
PASS hail-or-capitulate-ace-flee
PASS unknown-ace-flee-speed-zero mode=flee spd=0
PASS wave116-trader-unknown-plus-hunter
PASS wave116-mode-became-flee mode=flee
PASS wave116-unknown-flee-finite-zero spd=0
PASS miner-unknown-plus-hunter
PASS miner-unknown-became-flee mode=flee
PASS duel-proto-classKey
PASS duel-proto-classKey-finite spd=0
PASS known-cutter-flee
PASS known-cutter-still-flees mode=flee
PASS known-cutter-flee-uses-burn spd=210 burn=210
PASS known-cutter-duel
PASS known-cutter-still-duels mode=duel
PASS known-cutter-duel-speed-finite-nonzero spd=73.5
DUEL/FLEE PROBE PASS
```

Worker probe (`out/w-boot-fix2/update-err/verify/probe-6.log`):

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
PASS speedCap-unknown-classKey
PASS speedCap-unknown-class-finite
PASS findHunterOf-trader-with-null-hole
PASS findPirateWork-patrol-with-null-hole
PROBE PASS
```

Extra probe (`out/w-boot-fix2/update-err/verify/extra-probe-6.log`):

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
PASS speedCap-unknown-classKey
PASS speedCap-unknown-class-finite
PASS findHunterOf-trader-with-null-hole
PASS findPirateWork-patrol-with-null-hole
PASS pirate-hunt-telegraph
PASS telegraph-phase-set phase=telegraph
PASS telegraph-no-npcFire ["hailOpened"]
PASS live-velocity-copy-after-dummy
PASS live-velocity-moved-or-kept
EXTRA PROBE PASS
```

Update-path class lookup (no unguarded `SHIP_CLASSES[st.classKey]` cruise/burn read):

- Shared lookup: `src/systems/npc.js:410–414` (`shipClassOf` — string key + `hasOwnProperty`, else `undefined`)
- Fail-close speeds: `src/systems/npc.js:417–428` (`classCruise` / `classBurn` / `speedCap` — non-finite → `0`)
- `updateDuel` uses `shipClassOf` + `classBurn` + `speedCap`: `src/systems/npc.js:1915–1916`, `1947`, `1970`, `1994`, `2000–2013`
- `updateFlee` uses `shipClassOf` + `classCruise` / `classBurn`: `src/systems/npc.js:2086`, `2110`
- Remaining `SHIP_CLASSES[record.classKey]?.role` sites are spawn (`280`, `320`, `389`), not the per-frame update path. They do not read `.cruise` / `.burn`.
- Live unknown-class hulls in duel/flee/loiter/route/hunt did not throw. Unknown class fail-closes to finite `0`. Known cutter still flees at `210` and duels at `73.5`.
