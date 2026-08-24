# Wave 104 REP-05 verify notes (PR1 covering + PR2 inbound jump)

Graph: `proceed_unmodeled` (`graph_resolve` with `codex/agent-codex`). No binding workflow.

Domain: mixed (helper + jump + npc hook + boot pins). No Vite. `[NO BROWSER COVERAGE]` for live covering toast.

Merge law: `out/w103/rep05/shared-contract.md` wins.

## Status

CLEAN

Worker files match contract §1–§2. Probe all PASS. WAVE104 covering-jump object all true. WAVE103 hud-alerts object still all true. Digit 9 copy is absent (PR3 waits). Police leave copy is still `Leave this space.`

## Named runs

### `node out/w104/rep05/probe.mjs`

Exit 0. Log: `out/w104/rep05/verify/probe.txt`.

40 pins PASS. `PROBE PASS true`.

Independent dest skip used `blackstation`.

### `npm run test:boot`

Exit 1. Log: `out/w104/rep05/verify/boot.txt`.

WAVE104 covering-jump (all true):

```
noWanted, coverSkipVsPlayer, destSkipFlags, protoBag, digit0Shipyard,
leaveLine, coverLine, jumpLine, hasOwnDest, coverGate, coverOnce,
coverLock, noNine, noZero, noZone, noHollowCover, jumpRefuse,
outboundOk, dockOpen, pirateWorkUngated
```

WAVE103 hud-alerts: all true. WAVE104 was appended after the WAVE103 block (`scripts/boot-test.mjs` 21751 HUD-03, 21923 WAVE104). WAVE103 was not rewritten.

BOOT TEST FAIL — 5 errors, all WAVE26 lane/ferry quote:

- WAVE26 FERRY QUOTE FAIL (`ferryCardQuoted: false`, `quoted=NaN`)
- WAVE26 LANE DELIVERY FAIL
- WAVE26 OLD-SAVE FALLBACK FAIL
- WAVE26 SAVE FIELDS FAIL
- WAVE26 RESTORE FAIL

Owner line: WAVE4/26/35/80/85/92 FAILs are not this worker. WAVE4 / WAVE35 / WAVE80 / WAVE85 / WAVE92 objects in this run are all true.

## Contract §1 covering (`src/game/police-cover.js` + `src/systems/npc.js`)

| Rule | Live | Result |
|---|---|---|
| `standingRead >= 10` | `COVERING_STANDING_MIN = 10`; `coveringAllowed` uses `standingRead(ctx.world?.reputation, systemFaction)` | Pass |
| Missing / proto / NaN → 0 → no covering | proto bag probe + boot `protoBag` | Pass |
| Patrol only | `isLocalSystemPatrol`; role `patrol`; record/state faction match system flag | Pass |
| vsPlayer never | `inCombatWithPlayer` skip; never `setTarget(ai, 'player')` in helper | Pass |
| pirate/ace only | `isCoveringHostile` roles; skip trader; skip Unknowable via `isUnknowable` | Pass |
| Player fight | `lastAttacker === 'player'` or `ctx.targets.current === hostile` | Pass |
| Law 300 | `COVERING_RADIUS = 300`; skip patrol in zone; skip hostile in zone (copy `hunterHasWork`) | Pass |
| BLOCKED beautiful/unknowables + independent/hollow | `BLOCKED_FACTIONS` | Pass |
| Ungated pirate-work stays | `findPirateWork` first; covering is `\|\|` / else; no `standingRead` in `findPirateWork` | Pass |
| Once/visit `Patrol covering.` | module `firedThisVisit`; separate from leave latch | Pass |
| No persist latch | not in `WORLD_FIELDS`; reset on `systemLoaded` | Pass |
| `commLine` only | `ctx.emit('commLine', { text: COVERING_LINE })` | Pass |

`npc.js` 29 import; 1279 additive hunt; 1734–1738 acquire else; 2386 `tickPoliceCover(ctx)` after `tickPoliceLeave`.

## Contract §2 inbound jump (`src/game/jump.js` `beginJump`)

| Rule | Live | Result |
|---|---|---|
| Refuse before jumping | `destJumpRefused` then `return` before `ctx.gate.jumping = true` | Pass |
| Dest standing `< −25` | `standingRead(reputation, fac) < JUMP_REFUSE_STANDING` (`-25`) | Pass |
| −25 Suspect does not lock | probe `jump.allowSuspect`; boot `lockableRefuse` | Pass |
| Skip unknowables / hollow / independent | `JUMP_REFUSE_SKIP`; beautiful not in skip set | Pass |
| `No passage.` once per dest per visit | `refusedDestThisVisit` Set; clear on `systemLoaded` | Pass |
| `Object.hasOwn(SYSTEMS, to)` | `beginJump` + `destJumpRefused` | Pass |
| Outbound not blocked | dest standing only; boot `outboundOk` with current freehold −1000 | Pass |
| Dock open | `station.js` `dock()` 5956–5984 no standing; boot `dockOpen` | Pass |

`gate.js` still reads `ctx.gate.jumping`. It does not set the flag.

## Frozen surfaces (not this worker)

| Path | LastWriteTime vs covering 23:14 | Digit / copy |
|---|---|---|
| `src/systems/station.js` | 23:06 (earlier) | Digit 0 shipyard (`DOCK_KEY_SERVICES` last); Digit 8 launch; Digit 9 epics; outfitting 8/9 papers. `standingLiveNotes` has no `Patrol covering.` / `No passage.` |
| `src/game/state.js` | 12:33 | not this PR |
| `src/game/save.js` | 17:49 | `'reputation'` present; no `wanted` / `crimeScore` / `world.allies` / `world.locks` |
| `src/systems/hud.js` | 19:35 | existing `commLine` toast `textContent` |
| `src/game/police-leave.js` | 00:29 | `POLICE_LEAVE_LINE = 'Leave this space.'` unchanged |

Restitution 1200 and kill −5 untouched.

## Frontend

No Vite this verify. Ports 5178 / 9418 / 5177: not LISTENING after work. `[NO BROWSER COVERAGE]` for covering toast. Probe + boot cover the emit path (`commLine` + hud already toasts).

## Nits (not bugs)

1. `JUMP_REFUSE_SKIP` is a live `Set`. Same-process mutation could change skip flags. Worker security review already named this. No user-input path.
2. Covering uses `ai.lastAttacker === 'player'` with `Object.hasOwn`, not `lastAttackerOf()`. Fail-closed vs a ship-object attacker; lock still covers `ctx.targets.current`.

## Environmental issues

First `npm run test:boot` hit the 120s wrapper kill before WAVE104. Second run with 300s finished. WAVE26 five FAILs are pre-existing (owner line). Not this worker.
