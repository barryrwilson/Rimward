## Status
CLEAN

## What I tested
- Probe: `node --import ./scripts/with-css-stub.mjs out/w121/chartlabel/probe.mjs` → PASS (64 pins). Log: `out/w121/chartlabel/verify/probe.log`.
- Static vs merge law `out/w120/chartlabel/shared-contract.md`:
  - Labels set `data-system-id`; CSS `.rw-galaxy-label { pointer-events: all; cursor: pointer; }`.
  - Shared `isPlotTarget` (hit or label) and `activateSystem` used by disc click, label click, dest change.
  - Dest `<select id="rw-galaxy-dest">` with visible label `Destination` under `#rw-galaxy-chart-desc`, not in `.rw-galaxy-chart-actions`.
  - Existing KeyM handler skips `setOpen(false)` when `isTypingFocus()`; fallback `activeElement.id === 'rw-galaxy-dest'`. One `e.code === 'KeyM'`. No new window KeyM listener. `controls.js` not in the diff.
  - No `innerHTML` in `galaxychart.js`. `showApLive` still writes `textContent` + `apLiveUntil` only. `overlay-policy.js` not written; chart imports and calls `isTypingFocus`.
  - Autopilot success still `setOpen(false)` then blur (`galaxychart.js` 704–721).
  - `HIT_CSS_DIAMETER = 24`. Hover `pointerover` calls `applyHoverId` only (no `plotRoute`).
  - `git diff --stat -- src/` is only `galaxychart.js` and `hud.css`.
- Live Playwright on Vite `http://127.0.0.1:5175/` (Playwright MCP):
  1. NEW GAME → Freehold Greenhand. Flying, not docked, not paused.
  2. KeyM opens the chart. Dest list sits under the desc (102 options = 101 charted + placeholder).
  3. Click `.rw-galaxy-label` Veridian Reach: `nav.dest === "veridian"`, dest select syncs, chart stays open, sim not paused.
  4. Hover Freehold Drift label: inspect strip = Freehold Drift / Freehold Compact; `world.nav.dest` stays `veridian`.
  5. `#rw-galaxy-dest` change to generated `fx_aegis` (Aegis): route plots (4 jumps), chart stays open.
  6. Dest select focused, KeyM: chart stays open. Native typeahead jumps the list to Margin Call (`rl_margin`). That is dest typing, not a close.
  7. Escape with dest focused and no listbox: chart closes (`aria-hidden=true`, `display:none`). First Escape while the native listbox is open closes the listbox only (browser default).
  8. Autopilot **button** click on a plotted route: `chartOpen === false`, `nav.autopilot === true`, `paused === false`, focus not in the chart. HUD Cancel chip visible. Hail did not open this run (do not fail if it does).
  9. Empty hub / aim glass: no dest pip. Digit 0 shipyard not exercised (not docked; optional).
  10. Console: 0 errors, 0 warnings from this session.

## Bugs found
None.

## Environmental issues
- First `npx vite --port 5175 --strictPort` bound `[::1]:5175` only. Playwright `127.0.0.1:5175` refused. Restarted with `npx vite --host 127.0.0.1 --port 5175 --strictPort`.
- Digit 0 docked shipyard not run (optional).
- `npm run test:boot` not run (scope skip).
- Screenshot `06-escape-closed.png` is the still-open frame after native-listbox Escape. Closed proof is `07-escape-closed.png`.

## Evidence
- Screenshots:
  - `out/w121/chartlabel/verify/01-chart-open.png`
  - `out/w121/chartlabel/verify/02-label-click-plot.png`
  - `out/w121/chartlabel/verify/03-hover-inspect.png`
  - `out/w121/chartlabel/verify/04-dest-select-plot.png`
  - `out/w121/chartlabel/verify/05-keym-dest-stays-open.png`
  - `out/w121/chartlabel/verify/06-escape-closed.png` (listbox Escape; chart still open)
  - `out/w121/chartlabel/verify/07-escape-closed.png`
  - `out/w121/chartlabel/verify/08-ap-button-close.png`
- Logs:
  - `out/w121/chartlabel/verify/probe.log`
  - `out/w121/chartlabel/verify/console.txt`
  - `out/w121/chartlabel/verify/live-results.json`
