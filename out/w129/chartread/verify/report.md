## Status
BUGS_FOUND

## What I tested
- Static grep on `src/systems/galaxychart.js` and `.rw-galaxy-*` in `src/ui/hud.css` against `docs/Nav09ChartReadabilityDesign.md` and `out/w128/chartread/shared-contract.md` (contract wins).
- Live drive: Vite `http://127.0.0.1:5174` (Playwright tab 1). Did not use or steal `5173`.
- New Game → origin Digit1 → KeyM chart.
- Chrome: `#rw-galaxy-dest`, zoom buttons `#rw-galaxy-zoom-in|out|reset` (computed height 24px, width ≥24px), filters `#rw-galaxy-filter-faction` / `#rw-galaxy-filter-standing`, `#rw-galaxy-itinerary`.
- Zoom in / out / Reset view and real wheel: SVG `viewBox` changes; `ctx.settings.textScale` and `--rw-text-scale` stay `1`.
- Real pointer drag after zoom pans `viewBox` (example `1014.44 646.44 559.11 447.11` → `910.32 588.60 559.11 447.11`).
- Click movement under 4 CSS px on a label still plots (`The Veil`). Hover inspects (`The Hush`) and does not plot.
- Faction `redledger`: dest options 101 → 14; 87 discs hidden; current `freehold` stays visible; plotted dest stays listed.
- Standing `Sworn` with empty/missing bag: dest+nodes shrink to current+plotted dest. Standing `Unknown` after `world.reputation = undefined`: no throw; `flags.paused` stays false.
- Focus `#rw-galaxy-dest`, KeyM: chart stays open (`ae` remains `rw-galaxy-dest`).
- Plot Freehold → Veridian: itinerary lists hops; Clear route hides `#rw-galaxy-itinerary` (`hidden` + `aria-hidden=true`, 0 `li`).
- Close while zoomed, reopen: `viewBox` returns to fitted `665 367 1258 1006`; 89 zoom-hidden labels (12 fit names).
- Autopilot **button** success: `tryEngage` empty token, `nav.autopilot===true`, `setOpen(false)`, `flags.paused` still false.
- Direct `import('/src/game/autopilot.js').tryEngage(ctx)`: chart stays open (`chartOpen` true).
- Persist: `localStorage` only `rimward-save-v1`; no zoom/mapScale/chartView world key. `WORLD_FIELDS` still has `nav` only for plot.
- Console on 5174: Vite debug connect only. No error/warning.
- Static: dest id kept; `HIT_CSS_DIAMETER = 24`; no `innerHTML` / `insertAdjacentHTML` / `document.write`; no `flags.paused=`; no `jumpRequested`; no `preventDefault(` / `stopPropagation(` (WAVE85 `noPrevent` still holds).

## Bugs found
1. **Itinerary last hop always prints gate type `unknown`.**  
   Contract: each hop lists gate type **to the next hop**. `paintItinerary` does `const gate = next ? gateTypeToken(id, next) : 'unknown'`. The destination row therefore always ends `— unknown —`, even on a valid 1-jump gate (Freehold → Veridian) and on longer plots (Margin Call last row). That is fail-closed copy on a known hop, not missing connectivity. Live lines:
   - `Veridian Reach — Veridian Combine — Stranger — unknown — Stranger; pirate traffic 3`
   - `Margin Call — Red Ledger — Stranger — unknown — Stranger`  
   Cite: `src/systems/galaxychart.js` **903–909**. Screenshots `04-itinerary-veridian.png`, `03-zoom-pan.png`.

No other NAV-09 acceptance miss found in the listed flows.

## Environmental issues
- Vite **5174** was started for this pass (PID 24964) and is stopped after the report.
- Playwright already had Hail02 on **5173**. This verifier opened a **new tab** to 5174 and did not navigate or close 5173. One accidental snapshot of tab 0 was discarded; no click on 5173.
- CDP **9411** was not used (Playwright MCP drove the page). Port 9411 was not LISTENING after teardown.
- After Vite 5174 stop, 5173 was already `FinWait2`/`TimeWait` (PID 50848) and then not LISTENING. This verifier did not `taskkill` 50848. Sibling Hail02 may have exited on its own.
- Ship drifted into Freehold berth once while the chart was open (`setOpen(false)` on dock is live chart law). Relaunch + KeyM continued the pass.
- Native dest typeahead on KeyM `m` can change the selected option (Margin Call). Chart still stayed open. Not counted as a NAV-09 dest rewrite.

## Evidence
- Screenshots: `out/w129/chartread/verify/01-chart-open.png`, `03-zoom-pan.png`, `04-itinerary-veridian.png`, `05-reopen-fit.png`, `06-after-ap.png`, `07-filter-redledger.png`
- Console: `out/w129/chartread/verify/console.txt` (Vite debug only)
- Snaps: `snap-title.yml`, `snap-chart-5174.yml`
- Probe notes: `out/w129/chartread/verify/probes.json`
- Static: `HIT_CSS_DIAMETER` 24 at `galaxychart.js:50`; dest `#rw-galaxy-dest`; zoom button CSS `min-height/min-width: 24px` (`hud.css` **2187–2188**); filters and itinerary CSS present; `WORLD_FIELDS` has no zoom key (`save.js` **80–105**).
