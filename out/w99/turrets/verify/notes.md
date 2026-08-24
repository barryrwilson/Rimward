# WAVE99 NPC turret verifier notes

Date: 2026-08-23  
Workspace: `C:\Projects\WebSim`  
Source: read-only. Evidence only under `out/w99/turrets/verify/`.  
Browser: skipped. `[NO BROWSER COVERAGE]` for live fire feel.

## Status

CLEAN

## Commands

```
node --import ./scripts/with-css-stub.mjs out/w99/turrets/probe.mjs
→ PROBE PASS (exit 0)

node --import ./scripts/with-css-stub.mjs out/w99/turrets/verify/player-cap-probe.mjs
→ PLAYER-CAP PASS (exit 0)

npm run test:boot
→ BOOT TEST FAIL — 65 errors (pre-existing waves). WAVE99 all pins true. No `WAVE99 TURRETS FAIL`.
```

Ports 5173 / 9410 / 5174: not LISTENING. No Vite / Chrome / Playwright started.

## Probe (`out/w99/turrets/probe.mjs`)

All pins PASS:

- `src.npcCap4`, `src.playerCapFiltered`
- `gate.heavyPatrol`, `gate.ace`, `gate.frigate`
- `gate.cutterPirate`, `gate.seat0`, `gate.trader`, `gate.miner`
- `gate.unknowable`, `gate.unknownClass`, `gate.calmPatrol`
- `toast.turretIncomingFire`, `toast.turretOmitDrops`, `toast.dartUnchanged`
- `toast.sharedFireClock`, `toast.dockSuppress`
- `combat.missingTargetDrops`, `combat.noHangarWrite`, `combat.cannonOmitStillHits`
- `combat.npcCap4`, `combat.vsNpcDrops`
- `unknowable.miss`
- `PROBE PASS`

## Boot WAVE99 (after WAVE98)

Pins live in `scripts/boot-test.mjs` immediately after `WAVE98 TGT-03 remaining`. Excerpt: `out/w99/turrets/verify/boot-wave99.txt`.

Every `w99` value is `true`, including live emit:

- `heavyEmits` / `aceEmits` / `frigEmits`
- `seat0Never` (cutter pirate, trader, miner)
- `unkNeverEmit`
- `telegraphCold` / `demandCold`
- `cap4` / `playerCapFree` / `missingDrops` / `cannonOmitHits`
- `hudTree` / `noDartSteal` / `sameClock`

Boot overall FAIL ignored per brief (WAVE4 fence, WAVE26/35 haul, WAVE80 REP-04, WAVE85 nav, WAVE92 BIO, plus extra pre-existing FAILs). Not treated as turret bugs.

## Extra cap coexistence

`player-cap-probe.mjs`: five NPC turret emits → 4 live NPC bolts. Player `world.turret = 'auto'` then two time-stepped combat updates → 2 player turret bolts while NPC still 4.

## Code trace

### Q1 gate (`src/systems/npc.js`)

`canNpcTurret`: Unknowable false → `mayHuntPlayer` → `canSeat(classKey, 'turret')`.

`mayHuntPlayer` is unchanged for grants (civilians never; patrol needs standing/scratch; pirate/ace). Boot pin `huntUnchanged`.

`MOUNT_TABLE` as shipped: light/cutter/freighter turret 0; heavy 2; ace 1; frigate 4. Unknown classKey → light (seat 0).

Beautiful-as-faction: **no grant** (owner table). Turret gate has no `beautiful` word (boot `noBeautifulWord`). A Beautiful **heavy** patrol that already hunts can fire because class+hunt pass (`player-cap-probe` `beautifulHeavyNoGrantButClass`). A Beautiful **light** is seat 0. This is not an Unknowable-style faction never.

### Clock

`NPC_TURRET_INTERVAL = 1 / (WEAPONS.turret.rof * 0.5)` with `WEAPONS.turret.rof === 3` → interval `2/3` s (0.5× player ROF). Independent `ai.turretFireAt`. No `Math.random` in turret gate/try.

### Telegraph / demand-hold

`tryNpcTurret` requires `ai.phase === 'attack'` and `ai.target === 'player'`. Callers sit after telegraph `return` and after `bargaining`/`demanding` `return` in `engageTarget`. Ace telegraph `return`s before the duel `tryNpcTurret`. Demand hold freezes telegraph (`phaseStart = now`). Boot: `telegraphCold`, `demandCold`.

### Combat (`src/systems/combat.js`)

Turret `npcFire`: `e.target !== 'player'` continue (missing / vsNPC drop). Unknowable shooter continue. `spawnNpcShot(..., 'turret', playerObj)` then `bolt.vsPlayer = true`.

Cannon omit: `tgt === 'player' || tgt == null` still aims player.

Caps: `TURRET_LIVE_CAP = 2` counts `fromPlayer && wkey === 'turret'`. `NPC_TURRET_LIVE_CAP = 4` counts `fromPlayer === false && wkey === 'turret'`. `spawnNpcShot` does not `addHeat` / hangar write.

Hit split: `(p.fromPlayer || !p.vsPlayer) ? testNpcHits : testPlayerHit`.

### Unknowable miss

`applyHit`: Unknowable + `WEAPONS.turret.beam !== true` → `[]`, hull unchanged.

### Toast (`src/game/npc-fire-toast.js`)

Turret vs player → `INCOMING_FIRE_TOAST = 'Incoming fire.'`, `cls: 'warn'`, shared `FIRE_TOAST_GAP` with cannon. Missing turret target → null. Dart still `Incoming dart.`. Unknown / reserved weapon → null (fail closed). Dock/jump parked → null. No `Incoming turret` string.

HUD `toastForEvent` calls helper; fail-closed if helper returns null or unknown text. No new toast literal besides existing `INCOMING_FIRE_TOAST`.

### HUD child

No turret incoming gauge / lock box / aspect ring. Boot `hudTree` true; `inbound99` false. Working-tree HUD also has nav/autopilot/automine nodes from other waves, not a turret child.

### ctx vocab

`npcFire` comment: `weapon:'cannon'|'missile'|'turret'`. Missing turret target drops.

### Song

`npcFire` bark; missile sting only when `ev.weapon === 'missile'`. No turret branch.

## Bugs found

None for this slice.

## Environmental issues

None. Node probe and boot WAVE99 ran. Browser skipped.

## Evidence paths

- `out/w99/turrets/probe.mjs` (worker probe, PROBE PASS)
- `out/w99/turrets/verify/player-cap-probe.mjs` (PLAYER-CAP PASS)
- `out/w99/turrets/verify/boot-wave99.txt`
- `src/systems/npc.js` (`canNpcTurret`, `tryNpcTurret`, `NPC_TURRET_INTERVAL`)
- `src/systems/combat.js` (`NPC_TURRET_LIVE_CAP`, turret event drop, cannon omit)
- `src/game/npc-fire-toast.js`
- `src/core/ctx.js` npcFire vocab
- `scripts/boot-test.mjs` WAVE99 block after WAVE98
