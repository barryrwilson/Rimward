## Status
CLEAN

## What I tested
Live frontend check of Onb01 PR1 (flight lesson + WAVE6 look pin). I did not edit `src/`. I did not run formatters, linters, or full `npm run test:boot`. I ran a targeted syntax check: `node --check src/systems/onboarding.js` and `node --check src/systems/hud.js` (both exit 0).

Static grep:
- `src/systems/onboarding.js` has no id `'move'`. HINTS start with `look` then `throttle` `target` `hail` `dock` `chart`.
- `scripts/boot-test.mjs` has no onboarding `'move'` pin. WAVE6 section a pins look (`lookHintShown`, `lookSeenOnce`). WAVE6 section g SAVE FIELDS requires `seen.includes('look')`.
- CONTROLS default `controlsCollapsed = true` in `src/systems/hud.js`. Combat still calls `applyControlsCollapse()`.
- Keys stay: `KeyH` hail, `KeyJ` dock, `KeyD` strafe (`controls.js`); `KeyM` chart (`galaxychart.js`); `KeyP` pause (`main.js`); `KeyL` berth (`save.js`). Pause pack unused.

Live boot:
- Vite only on `http://127.0.0.1:5174/` (`npx vite --host 127.0.0.1 --port 5174 --strictPort`).
- Private Chrome profile `out/w142/onb01/verify/chrome-profile`, CDP 9474. Puppeteer-core from `out/hud-research/tools/node_modules`. Shared Playwright MCP unused.
- Fresh storage, New Game, origin Digit1 (`greenhand`).
- Capture: `out/w142/onb01/verify/capture-onb01.mjs`. 44/44 asserts passed.

Live results:
1. CONTROLS starts collapsed. Body `display:none`. Toggle `CONTROLS ▸`. `aria-expanded=false`.
2. First hint is look/turn only: `Mouse — look and turn toward the reticle`. No 19-line dump. No id `move`.
3. KeyZ dismiss: throttle → target → hail → dock → chart. One card at a time. Same `.rw-onboard-hint` node.
4. Click CONTROLS: 19 lines, `aria-expanded=true`, label `CONTROLS ▾`. Click again: hide.
5. Hint node: one `.rw-onboard-hint` on `#hud`, not in `.rw-reticle` (reticle 80×80). `role=status`, `aria-live=polite`, `aria-atomic=true`, `pointer-events:none`.
6. After origin pick, `flags.paused` is false. This pack does not write pause.

First capture try failed: this puppeteer-core rejects `waitUntil: 'commit'`. I changed the verifier script to `domcontentloaded` and reran. That is a harness issue, not a product bug.

## Bugs found
None.

Observation (not a fail): the hint rail sits under CONTROLS (`top: 48px`). When the encyclopedia is open, the hint can cover the first list lines. The 19 lines still exist in the DOM. The spec does not forbid this overlap.

## Environmental issues
First Chrome pass failed on `waitUntil: 'commit'` (puppeteer-core 25.8.0). After the harness fix, the live pass succeeded. Vite 5174 and CDP 9474 had no Listen state after stop. Other user Chrome processes were left running. I did not use the shared Playwright MCP.

## Evidence
- Capture log: `C:\Projects\WebSim\out\w142\onb01\verify\browser-log.txt`
- Assert dump: `C:\Projects\WebSim\out\w142\onb01\verify\asserts.json` (pass=44 fail=0)
- Screenshots:
  - `C:\Projects\WebSim\out\w142\onb01\verify\01-title.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\02-origin-overlay.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\03-hint-look-controls-collapsed.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\04-hint-throttle.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\05-hint-target.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\06-hint-hail.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\07-hint-dock.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\08-hint-chart.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\09-controls-expanded.png`
  - `C:\Projects\WebSim\out\w142\onb01\verify\10-controls-collapsed-again.png`
- WAVE6 a pin (`scripts/boot-test.mjs` ~1724–1751): first card `look`; `seen.includes('look')`.
- WAVE6 g pin (`scripts/boot-test.mjs` ~1930–1931): save `seen.includes('look')`.
- HINTS (`src/systems/onboarding.js` 52–70): `look` first; no `'move'`.
- CONTROLS (`src/systems/hud.js` 1291–1310): starts collapsed; `aria-expanded` on init and click. Combat collapse ~2280–2283.
- Ports after stop: 5174 and 9474 have no Listen process.
