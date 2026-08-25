## Status
[ CLEAN ]

## What I tested
- Grep `src/` for `jumpRequested`. Sole `ctx.emit('jumpRequested', { to: near.to })` is `src/systems/gate.js` line 678. Other hits are comments, `jump.js` consume, and `song.js` map.
- Grep `AP_LINES` / `BREAK_LINE` in `src/game/autopilot.js`. Strings match `out/w116/nav05/shared-contract.md` §0.1. Refuse vs cancel prefixes stay split. `missingHop` is not `missingGate`. Lookup/path/hub/wrap do not collapse onto `missingGate`/`missingHop`. `missingLookup` is refuse-only (not in `BREAK_LINE`).
- `node out/w117/nav05/probe.mjs` → WAVE117 NAV-05 PROBE PASS. All pins true, `fail: []`.
- WAVE85 / WAVE88 FAIL strings still present. `git diff scripts/boot-test.mjs` only appends WAVE117; it does not invert WAVE85/WAVE88.
- WAVE21 hub jump pins still `dispatchKey('KeyD')` at boot-test 706 and 732. Hint pin still `'D — dock'`. Probe `wave21Untouched` true. CTL-01 sibling has not rewritten those boot pins.
- NAV-05 write-set is `autopilot.js`, `gate.js`, `galaxychart.js`, WAVE117 boot append. `hud.js` / `hud.css` / `controls.js` diffs are HUD-02 silhouettes and CTL-01 KeyJ dock, not AP chrome.
- Live Playwright on Vite 5177:
  - New Game + Freehold Greenhand.
  - KeyM Galaxy Chart stays open.
  - Plot `vd_survey` (2 hops). Click Autopilot. Chart stays `display:flex`. Button becomes Cancel autopilot. Chip shows dest/next/rem.
  - Ship jumped Freehold Drift → Veridian Reach with the chart still open (AP flew).
  - Chart `.rw-galaxy-ap` Cancel sets `#rw-galaxy-ap-live` to `Autopilot cancelled.` (not blank, not a hop id). Chart stays open.
  - Re-engage with chart open: Cancel autopilot label + chip visible. Chart stays open.
  - Did not reach a nearer-hub vs physical-ring overlap in the browser. No live toast `next gate is missing`.
  - Console: 0 errors, 0 warnings from Playwright. Ignore pre-existing `Heave to. Cargo or hull.` toasts.

## Bugs found
[Empty if CLEAN]

## Environmental issues
- Working tree also has sibling HUD-02 (`hud.js`/`hud.css` class-key silhouettes) and CTL-01 (`controls.js` KeyJ dock; HUD prompt `J — Dock`). NAV-05 did not claim those files for AP chrome. Live HUD lists `H — hail · J — dock`. WAVE21 boot pins remain KeyD as required.
- `#rw-galaxy-ap-live` uses `AP_LIVE_LIFE = 4` seconds of `ctx.elapsed`. Viewport screenshots after that window show an empty live strip. DOM at click captured `Autopilot cancelled.`
- Playwright `getByText('Cancel autopilot')` hits the HUD chip first. That path left the live region blank (DOM emit after chart `update`, `ctx.events` drain to `lastEvents`). Chart button click paints. Contract paint path is the chart control; `hud.js` is not this leftover.
- Live hub-nearest ring overlap not reached. Covered by probe `ringNoCycle`/`hopKind` and WAVE117 `hubNoCancel`/`hubNoCycle` pins (full `test:boot` not run this pass).
- Vite 5177 PID 40728 started and stopped. Port 9477 unused. After stop: 5177 LISTENING gone; only TIME_WAIT leftovers.

## Evidence
- Screenshots:
  - `C:\Projects\WebSim\out\w117\nav05\verify\chart-ap-engaged.png` — chart open, Cancel autopilot, chip Survey/Survey/1
  - `C:\Projects\WebSim\out\w117\nav05\verify\chart-cancel-ap-live.png` — chart still open after cancel (live line expired)
  - `C:\Projects\WebSim\out\w117\nav05\verify\chart-cancel-live-now.png` — chart open, Autopilot restored
  - `C:\Projects\WebSim\out\w117\nav05\verify\ap-live-element.png` — live element after 4s life (blank)
- Logs:
  - `C:\Projects\WebSim\out\w117\nav05\verify\live-cancel-dom.txt`
  - `C:\Projects\WebSim\out\w117\nav05\verify\grep-jumpRequested.txt`
  - `C:\Projects\WebSim\out\w117\nav05\verify\grep-ap-lines.txt`
  - `C:\Projects\WebSim\out\w117\nav05\verify\grep-boot-pins.txt`
  - `C:\Projects\WebSim\out\w117\nav05\verify\grep-chart-live.txt`
  - `C:\Projects\WebSim\out\w117\nav05\verify\console.json`
  - `C:\Projects\WebSim\out\w117\nav05\verify\console-all.json`
- Test output: `C:\Projects\WebSim\out\w117\nav05\verify\probe-out.json` — WAVE117 NAV-05 PROBE PASS
