# HUD-06 PR1 notes (Wave 127)

**Serial:** PR1 persistent current-system home-station marker  
**Write-set:** `src/systems/hud.js`, `src/ui/hud.css`  
**Merge law:** `out/w126/homemarker/shared-contract.md` wins  

## Landed

- Create-once `.rw-home-mark` square pip + label and off-glass chevron on `#hud` (not `.rw-reticle`).
- Off-glass inset `HOME_EDGE_INSET = 108`. TGT/NAV-02 keep `EDGE_MARGIN = 84`.
- POS row label `HOME`, value `stripHudText(name) + ' · ' + formatNavDist(dist)` (empty name → `HOME · dist`).
- Hide cue when missing/non-finite pad pose, docked, jumping, hail, chart, berth.
- Hide pip + chevron when `allowedLockKind === 'station'`; keep POS HOME.
- `textContent` / `el()` only. No `innerHTML`. No persist. No toast. No new Digit.
- Combat dim `#hud.in-combat .rw-home-mark { opacity: 0.14 }`. No `@keyframes` on the home mark.
- One scratch `homeProj` Vector3. Transforms every frame; POS/pip text at `TEXT_UPDATE_INTERVAL`.

## Did not land

- TGT `edgeArrow` reuse, NAV-02 `gateCue` / GATE row, Agent API badge, hail copy, selected POI, `state.js`, hub child.

## Reviews

Security, code, and UI audits are self-applied. This worker has no `general-purpose` spawn tool. Personas and orchestrator references were applied in-process.

## Live verify

Vite 5178 / Chrome CDP 9471 were not started. Static grep + `node --check src/systems/hud.js` only. Ports 5178 and 9471 were not LISTENING at report time.

## Sibling handoff

Hail01 toast listeners in `hud.js` are unchanged. `ctx.js` / `main.js` / `boot-test.mjs` untouched.
