## Status
[ CLEAN ]

## What I tested
- Read `src/systems/controls.js` `titleOverlayAttached` / `shouldSkipDockPulse`. Title skip is attach-only (`isConnected === true` / `parentNode` / `parent`). Detached boot stub (`parent: null`, no `parentNode`, no `isConnected`) does not skip. Typing (INPUT/TEXTAREA/SELECT/contentEditable) and `ctx.models.isOpen()` still skip. Catch still skips (never throw). `case 'KeyJ'` still sets `pendingDock` behind the helper. `KeyD` still writes `strafeX` only.
- Boot stub `scripts/boot-test.mjs` `getElementById` still fabricates a detached node (`makeEl` `parent: null`). Live `closeTitle()` still `root.remove()`.
- Node simulation of the same attach tests: detached stub does not skip; attached `isConnected` / `parent` / `parentNode` skip; models and typing skip. `ATTACH SKIP SIM OK`.
- `node out/w117/ctl01/probe.mjs` → **PROBE OK** (all pins ok, including skip title attached helper / parent checks).
- WAVE21 still `dispatchKey('KeyJ')` at 706 and 732. Comments name junction J / back-gate J. No `dispatchKey('KeyD')`. Did not run `npm run test:boot` this pass. Worker notes claim WAVE21 hub junction all true, WAVE117 all true, remaining 20 errors WAVE26 cluster. Not re-run; not treated as this leftover.
- WAVE117 NAV-05 pins not inverted: header `WAVE117 NAV-05 PR1`, `liveRouteSeq`, chart still `dispatchKey('KeyM')` (23538, 23617, restore 23665–23666). Fail string still `WAVE117 NAV-05 HANDOFF FAIL`.
- Live Vite/Playwright not re-run this pass. Prior live on 5178 already CLEAN for title-open KeyJ block and post–New Game station/gate KeyJ. This attach bug is harness-only.

## Bugs found
[Empty if CLEAN]

## Environmental issues
- `graph_resolve` bound `omp/workflow-software-delivery`. No scheduler writes. No CRM writes. Product source not edited.
- [NO BROWSER COVERAGE] this pass. Vite 5178 and Playwright not started. Prior `live-results.json` stays on disk. Stop not required.
- `titleOverlayAttached` / `shouldSkipDockPulse` are not exported. Attach proof used a same-logic Node sim, not an import of `controls.js`.
- `reticleLockBlocked` still treats a truthy `getElementById('rw-title')` as blocked. That is KeyV/automine, not KeyJ dock pulse. Out of scope.

## Evidence
- Logs:
  - `C:\Projects\WebSim\out\w117\ctl01\verify\probe-out.txt` — PROBE OK
  - `C:\Projects\WebSim\out\w117\ctl01\verify\attach-skip-sim.txt` — ATTACH SKIP SIM OK
  - `C:\Projects\WebSim\out\w117\ctl01\verify\grep-controls.txt`
  - `C:\Projects\WebSim\out\w117\ctl01\verify\grep-boot-pins.txt`
  - `C:\Projects\WebSim\out\w117\ctl01\verify\grep-nav05-wave117.txt`
  - `C:\Projects\WebSim\out\w117\ctl01\verify\grep-boot-stub.txt`
  - `C:\Projects\WebSim\out\w117\ctl01\verify\grep-title-close.txt`
  - `C:\Projects\WebSim\out\w117\ctl01\verify\live-results.json` — prior live KeyJ CLEAN (not re-run)
- Screenshots: prior pass only (`title.png`, `hud-space.png`, `station-j-prompt.png`, `docked-after-j.png`, `gate-j-prompt.png`, `gate-after-j.png`, `ap-no-j.png`).
