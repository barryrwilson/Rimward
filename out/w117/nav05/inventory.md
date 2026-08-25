# Wave 117 NAV-05 PR1 — live inventory

**Wave:** 117 PR1 landed.  
**Rule:** Code wins. Merge law: `out/w116/nav05/shared-contract.md`.

## Emit

- Sole `jumpRequested` writer: `src/systems/gate.js` (`to: near.to`).
- `src/game/autopilot.js` does not emit jump.
- `apJump` still requires `nav.autopilot && wantJump && near.to === nextHop`.
- `wantJump` still `inZone && !docked && nearTo === hop`.

## Handoff

- `lookupLiveNavHopKind` returns `'ring'` | `'hub'` | `''`.
- Physical ring for `path[1]`: no `disengage`, no `cycleHub`, keep aiming at the ring.
- Hub cycle/wrap only when kind is `'hub'`. Wrap cap = `nearRouteCount`. Tokens `missingHub` / `hubWrap`.
- One-frame empty `nearTo` while in zone: no hub cancel, no emit unless `near.to === nextHop`.

## English (`AP_LINES`)

| Token | English |
|---|---|
| missingHop | Autopilot refused — next hop is not on the route. |
| missingLookup | Autopilot refused — next gate is not in this system. |
| lookupFail | Autopilot cancelled — next gate is not in this system. |
| missingPath | Autopilot cancelled — approach path failed. |
| missingHub | Autopilot cancelled — hub does not list the next hop. |
| hubWrap | Autopilot cancelled — hub spoke cycle failed. |
| missingGate | Autopilot cancelled — next gate is missing. |
| arrive | Arrived — autopilot off. |

Refuse vs cancel prefixes stay split. `missingHop` and `missingGate` no longer share one clause.

## Chart

- Chart stays open on engage.
- Fly `disengage` while `chartOpen` paints `#rw-galaxy-ap-live` via `showApLive(apLine(reason))`.
- Chart Cancel paints the same live region.
- `textContent` only. `restore` silent.

## Persist / consume

- `world.nav` one record. Next hop `path[1]`. Restore `autopilot: false`.
- MATCH refuse consume. PHY-02 `applyAvoidBias` consume.
- `state.js` not written. No new persist key.

## Pins

- WAVE85 / WAVE88 still true in `npm run test:boot`.
- WAVE117 object all true, including `liveRouteSeq` (`systemLoaded` `to` + `world.currentSystem` veridian then `vd_survey`).
- WAVE21 `dispatchKey('KeyD')` / `'D — dock'` not retargeted.
