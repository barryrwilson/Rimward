# WAVE110 pad-home verify notes

**Verdict: CLEAN**  
**Date:** 2026-08-24  
**Domain:** mixed

Did not edit `src/`, `scripts/`, or `docs/`. Evidence only under `out/w110/padhome/verify/`.

## Graph

`graph_resolve` (`codex/agent-codex`, namespace `codex`) returned `execute_workflows` for `codex/workflow-browser-assisted-work`. Followed that stack. No calendar/CRM writes. No external send.

## Probes

| Command | Result |
|---|---|
| `node out/w110/padhome/probe.mjs` | PASS |
| `node out/w110/padhome/wave110-pins.mjs` | WAVE110 ALL TRUE |
| `node out/w58/routes/probe.mjs` | CLEAN |
| `node out/w58/routes/verifier.mjs` | CLEAN (`src.patrolCenter` hold-off-pad) |
| `node out/w59/routes/verifier.mjs` | CLEAN (`leave.patrol.pad` heavy hold) |

Did not run full `npm run test:boot` (WAVE26 pre-existing). Isolated WAVE110 via `wave110-pins.mjs`.

## Source / git

`world.js` patrol author is `writeStationHold(..., 'heavy', gate)`, not `station.clone()`. `healPadHome` allowlist includes `patrol`. `holdClassFor` maps patrol scale keys else `'heavy'`. Rebuild + `tickBank` both call `healPadHome` for patrol. No third helper. No `speed = 0`. No `padHome` persist key. No `planApPath` / `applyAvoidBias` / navmesh in `world.js`. `station.clone()` gone from `src/game/world.js`.

`git diff` of `src/game/npc.js`, `src/game/traffic-feel.js`, `src/game/state.js`: empty. Not pad-home.

Sibling dirty tree (do not fail this leftover): `src/systems/station.js` MSN-03 SKU grant; large `scripts/boot-test.mjs` WAVE108/109 plus WAVE110.

Digit 0 still last `DOCK_KEY_SERVICES` = shipyard (`station.js` 188, 6075–6077). Digit 8 launch / Digit 9 epics. Hub `.rw-reticle` 80 px + RANGE (`hud.css` 184–193; `hud.js` 709–712). `WORLD_FIELDS` has no `padHome`.

Hold math (Freehold): cyl 32 + heavy hull 8.5 + pad 12 + 0.05 = 52.55. Light hold 47.45. Fresh authored patrol after `plainRoute` round: xz ≈ 52.15 (still >> D5). Heal of old pad: 52.55, speed kept 90.

## Browser

Vite `http://127.0.0.1:5174/` (`--host 127.0.0.1 --strictPort`). Chrome CDP 9401, profile `out/w110/padhome/verify/chrome-profile/`. Playwright MCP also opened the same origin.

Hub: 80×80, pupil + 3 cilia + RANGE. No pad-home child.

Digit 0 docked: shipyard hangar. No pad-home text.

Live patrol `route[0]` in `__ctx`: Chrome new session xz ≈ 52.15; Playwright CONTINUE xz ≈ 52.55 (heal, unrounded). Both off pad. `[NO BROWSER COVERAGE]` for a visual of patrol hulls flying after save/load.

## Teardown

Killed Vite pid 27952 and verify Chrome (user-data-dir this profile, pid 3396). Ports 5174 and 9401 not LISTENING. Did not kill the user's other Chrome windows.
