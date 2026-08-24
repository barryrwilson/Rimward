# BIO-08 Wave 107 notes

Markdown-only integrator leftover. Write-set: `docs/Bio08LocomotionDesign.md`, `out/w107/bio08/**`. No `src/` edits. No bake. No GLB.

## Graph

`graph_resolve` with `codex/agent-codex` returned **blocked_ambiguous** (calendar / Drive / slides, coverage 0.09–0.18). Those workflows do not apply to this WebSim markdown leftover. Parent orchestrator already scoped the write-set. No calendar/Drive tools used. No graph writes.

## Live census (Wave 107)

- Player CPU: `ship.js` 151–162, 279–339, 551–565, 953–1009 — X spine + Y flap + breath/heart. Z not kicked. BIO-06 cadence on non-light remounts.
- NPC GPU: `ship-assets.js` 57–95, 278–310, 432, 455, 492–509 — uniforms `uSwimTime` / `uSwimAmp` / `uSwimHz` / `uSwimSweep`. One shader.
- `uSwimSweep` **live**. `src/game/living-cadence.js` **live** (Wave 104 numbers). Do not retune. Gait still absent.
- `mixer.timeScale` grep in `src/` = 0.
- Yard living: `yard-preview.js` 115 `update: null`.
- Digit 0 = shipyard (`station.js` 185, 6026–6030). Digit 8 = launch. Digit 9 = epics.
- Wave 106 body plans: `out/w106/foundation/notes.md` + `scripts/ship_builders/beautiful/{light,ace,cutter,heavy,frigate,freighter}.py`.

## Deputize

Four gait ids. Six-key map. Fail closed live spine+flap. PR1 `living-gait.js`. Named-only PR1–PR4.

## Sibling do-not-touch

`src/systems/ship.js`, `src/systems/ship-assets.js`, `src/game/living-cadence.js`, `scripts/boot-test.mjs`, `src/systems/station.js`, Bio01–07 briefs, Rep05, wishlist, PROGRESS.md, OwnerDecisions*.

## Reviews

Security: Low. No CRITICAL/HIGH.  
Code: no Blocker/Major. Brief ≡ contract on Digit/hub/state.js/persist.  
UI: spec audit; no hub child; no Blocker/Major.

## Processes

None started. None to kill.
