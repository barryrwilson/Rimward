# PHY-05 Wave 110 notes

Worker: PR1 persist heal + PR2 pins. No `state.js`. No `npc.js`. No Vite. No Chrome.

## Delivered

| Path | Role |
|---|---|
| `src/game/world.js` | Patrol author hold; `healPadHome` + `holdClassFor`; rebuild/tick callers |
| `scripts/boot-test.mjs` | WAVE110 section after WAVE109 |
| `out/w58/routes/probe.mjs` | Invert `src.patrolCenter` |
| `out/w58/routes/verifier.mjs` | Invert `src.patrolCenter` + stale trader pad pin |
| `out/w59/routes/verifier.mjs` | Invert `leave.patrol.pad` |
| `docs/Phy05PadHomeDesign.md` | Status/wave row only |
| `out/w110/padhome/probe.mjs` | Standalone PASS, no dock |
| `out/w110/padhome/wave110-pins.mjs` | Isolated WAVE110 all true |
| `out/w110/padhome/security-review.md` | Self-applied auditor |
| `out/w110/padhome/code-review.md` | Self-applied reviewer |
| `out/w110/padhome/ui-audit.md` | Self-applied UI audit |
| `out/w110/padhome/notes.md` | This file |

## PR1

- Patrol `route[0]` = `writeStationHold(..., 'heavy', gate)`. Three waypoints. wp0 only.
- `healPadHome` roles: trader, miner, patrol. Unknown role skip.
- `holdClassFor`: trader `freighter`; miner `light`/`cutter` else `light`; patrol known scale else `heavy`.
- Callers: `rebuildTransitRegistry` + `tickBank`. Direct `healPadHome`. No `normalizePatrolRecord`.
- New plain `{x,y,z}`. `Object.hasOwn` on `SYSTEMS`. Fail closed. Idempotent `PAD_HOME_EPS`.

## WAVE110 pin names

`authorHold`, `authorClassHeavy`, `expectedHold`, `livePatrolOffPad`, `oldPadHeals`, `idempotent`, `nanUnknownNoThrow`, `traderMinerStill`, `pirateAceUnchanged`, `rebuildTickHeal`, `holdClass`, `noPadHomeField`, `noInnerHtml`, `digit0Shipyard`, `digit8Digit9`, `hubEmpty`.

## Verify

- `node out/w110/padhome/probe.mjs` → PASS
- `node out/w110/padhome/wave110-pins.mjs` → WAVE110 ALL TRUE
- `node out/w58/routes/probe.mjs` → CLEAN
- `node out/w58/routes/verifier.mjs` → CLEAN
- `node out/w59/routes/verifier.mjs` → CLEAN (`leave.patrol.pad` hold-off-pad)
- Full `npm run test:boot` may still FAIL WAVE26. Not this leftover.

## Graph

`graph_resolve` (`codex/agent-codex`, namespace `codex`) returned `proceed_unmodeled`. No calendar/CRM writes.

## Processes

This worker started none. Ports 5173 and 9400 were not LISTENING.

## Out of scope (honored)

Did not edit `npc.js`, `traffic-feel.js`, `state.js`, `Phy04AvoidDesign.md`, wishlist, `PROGRESS.md`, sibling Wave 110 briefs, Digit, HUD, navmesh.
