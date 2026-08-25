## Status
BUGS_FOUND

## What I tested
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/probe.mjs`. Exit 0. Line `PROBE PASS` was in the output. Log: `out/w-boot-fix2/update-err/verify/probe-4.log`.
- Ran `node --import ./scripts/with-css-stub.mjs out/w-boot-fix2/update-err/verify/extra-probe.mjs`. Exit 0. Line `EXTRA PROBE PASS` was in the output. Log: `out/w-boot-fix2/update-err/verify/extra-probe-4.log`.
- Confirmed both probes include `speedCap-unknown-classKey` (`classKey: 'nope'`), `findHunterOf-trader-with-null-hole`, and `findPirateWork-patrol-with-null-hole`.
- Read `src/systems/npc.js` `speedCap` (`410–418`), `findHunterOf` (`1247–1259`), `findPirateWork` (`1263–1282`), `updateDuel` (`1901–2059`), `updateFlee` (`2072–2102`), and the per-hull switch (`2367–2409`).
- Confirmed the only unguarded `SHIP_CLASSES[st.classKey]` reads in the npc update path are `updateDuel` (`1904`) and `updateFlee` (`2074`). Those then use `cls.burn` / `cls.cruise`.
- Ran `out/w-boot-fix2/update-err/verify/duel-flee-probe.mjs` for reachability. Exit 1. Log: `out/w-boot-fix2/update-err/verify/duel-flee-probe.log`.
- Did not run `npm run test:boot`. Did not edit `src/`.

## Bugs found

### Bug 1: wave116 unknown-class live hulls still throw in updateFlee
- Severity: HIGH
- Repro: Put a complete live trader (or miner) with `state.classKey = 'nope'` on `ctx.ships` with a complete pirate whose `ai.target` is that hull, plus a WAVE74-style dummy and a `null` hole. Call `npc.update(dt)`. This is the wave116 unknown lock omit hull (spawned live, then `classKey` mutated to `'nope'`) plus a hunter that `tickTraderJob` / `tickMinerJob` can see.
- Expected: Unknown `classKey` fail-closes like `speedCap` (finite 0). Update does not throw.
- Actual: `tickTraderJob` / `tickMinerJob` sets `ai.mode = 'flee'` then the same-frame switch calls `updateFlee`. `SHIP_CLASSES['nope']` is `undefined`. Line `2098` throws `TypeError: Cannot read properties of undefined (reading 'burn')`.
- Evidence: `out/w-boot-fix2/update-err/verify/duel-flee-probe.log` (`FAIL wave116-trader-unknown-plus-hunter`, `FAIL miner-unknown-plus-hunter`). Stack: `updateFlee` `npc.js:2098` then `Object.update` `npc.js:2408`. `wave116-mode-became-flee mode=flee`.
- Same throw on hail/capitulate flee for pirate and ace (`FAIL hail-or-capitulate-pirate-flee`, `FAIL hail-or-capitulate-ace-flee`). `hail.js` writes `ai.mode = 'flee'` for demandCargo / ransom / letGo / respect / payTribute / bluff; pirate/ace skip the trader stand-down.

### Bug 2: unknown-class aces still throw in updateDuel on fury
- Severity: HIGH
- Repro: Complete live ace, `classKey: 'nope'`, `ai.mode = 'duel'`, hull at or below 1/3 (`acePhase` 3). Call `npc.update(dt)` inside the encounter bubble.
- Expected: Unknown `classKey` fail-closes. Update does not throw.
- Actual: `updateDuel` indexes `SHIP_CLASSES[st.classKey]` with no `hasOwn` guard, then fury uses `cls.burn` at `npc.js:2000`. Throws `TypeError: Cannot read properties of undefined (reading 'burn')`.
- Evidence: `duel-flee-probe.log` `FAIL duel-unknown-acePhase3`. Stack: `updateDuel` `npc.js:2000` then `Object.update` `npc.js:2405`. Aces spawn in `duel` (`makeAi` `npc.js:213`).

WAVE74 dummy hulls (object+state+record, no `ai`) do **not** reach those functions. The per-hull loop continues at `npc.js:2369`. Dummy unknown `classKey` plus a list hole does not throw (`PASS dummy-unknown-class-no-ai`, `PASS dummy-plus-hole`).

Worker `speedCap` / hole probes stay green because they never enter duel/flee with unknown `classKey`:
- Loiter / route / hunt unknown `classKey` use `speedCap` (`PASS`).
- Trader `mode: 'flee'` with no hunter is stood down to `route` by `tickTraderJob` before the switch (`PASS flee-trader-stood-down-to-route`).
- Ace phase 1 (and phase 2 inside `ENVELOPE_EXTEND_DIST`) uses `speedCap`, not `cls.burn` (`PASS duel-unknown-acePhase1`, `PASS duel-unknown-acePhase2`).

## Environmental issues

## Evidence
Worker probe (`out/w-boot-fix2/update-err/verify/probe-4.log`):

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

Extra probe (`out/w-boot-fix2/update-err/verify/extra-probe-4.log`):

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

Duel/flee reachability (`out/w-boot-fix2/update-err/verify/duel-flee-probe.log`):

```
PASS dummy-unknown-class-no-ai
PASS dummy-plus-hole
PASS loiter-unknown-classKey
PASS route-unknown-classKey-wave116-default
PASS hunt-unknown-classKey
PASS duel-unknown-acePhase1
PASS duel-acePhase1-uses-speedCap
PASS duel-unknown-acePhase2 no-throw
FAIL duel-unknown-acePhase3 Cannot read properties of undefined (reading 'burn')
PASS flee-trader-no-hunter-stands-down
PASS flee-trader-stood-down-to-route mode=route
FAIL hail-or-capitulate-pirate-flee Cannot read properties of undefined (reading 'burn')
FAIL hail-or-capitulate-ace-flee Cannot read properties of undefined (reading 'burn')
FAIL wave116-trader-unknown-plus-hunter Cannot read properties of undefined (reading 'burn')
PASS wave116-mode-became-flee mode=flee
FAIL miner-unknown-plus-hunter Cannot read properties of undefined (reading 'burn')
PASS duel-proto-classKey
DUEL/FLEE FAIL — 5: duel-unknown-acePhase3, hail-or-capitulate-pirate-flee, hail-or-capitulate-ace-flee, wave116-trader-unknown-plus-hunter, miner-unknown-plus-hunter
```

Code still in the live path:

- `speedCap` fail-close: `src/systems/npc.js:410–418` (`hasOwn` + finite cruise else `0`)
- `findHunterOf` hole skip: `src/systems/npc.js:1252` (`if (!other || other === live || !other.ai) continue`)
- `findPirateWork` hole skip: `src/systems/npc.js:1272` (`if (!other || other === live || !other.ai || !other.object) continue`)
- Dummy skip before mode switch: `src/systems/npc.js:2369`
- Unguarded duel/flee class table: `src/systems/npc.js:1904` and `2074`, then `cls.burn` at `1992` / `2000` / `2001` / `2098` and `cls.cruise` at `2098`
