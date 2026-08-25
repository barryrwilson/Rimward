## Status
CLEAN

## What I tested
- Static merge-law read of `src/systems/galaxychart.js` Autopilot click (`633–666`): success empty `tryEngage` token calls real `setOpen(false)` then blur / prefer visible `#hud .rw-autopilot-cancel`. Refuse keeps the chart and paints `showApLive` + `commLine`. Flying branch `disengage` + `showApLive(apLine('cancel'))` if `chartOpen`; no close.
- `tryEngage` body in `src/game/autopilot.js` (`209–222`) still does not close the chart.
- WAVE117 in `scripts/boot-test.mjs`: `chartStayOpen` still after direct `e117(ctx)`; `chartEngageStay` clicks `.rw-galaxy-ap` and requires `chartOpen === false` and `nav.autopilot === true`. WAVE118 `chartStayOpenSrc118` still greps `function showApLive` / cancel / line / reason helpers.
- Overlay open-gate still in `setOpen` (`canOpenPlayCard`) and KeyM (`playSurfaceBlocked`). `showApLive` is still the same helper (`textContent` only). No `flags.paused =`, no `jumpRequested`, no `innerHTML`, no new KeyM listener, no Digit 0/8/9 / KeyJ in this file.
- Browser on Vite `http://127.0.0.1:5174` (Playwright MCP): NEW GAME / CONTINUE, KeyM chart, plot, then:
  1. Direct `import('/src/game/autopilot.js').tryEngage`: chart stayed open, autopilot on.
  2. Chart Autopilot **button** `.click()` on a plotted route: `chartOpen === false`, `display:none`, `aria-hidden=true`, `nav.autopilot === true`, `flags.paused === false`. Focus left the chart root (`document.activeElement` was `BODY`). HUD Cancel chip was still `is-hidden` this frame (blur enough). After 300 ms the chip was visible and AP stayed on. `hailOpen` became true (overlay `takeDeferredHail` flush on real close).
  3. Refuse: Autopilot click with dest === here kept the chart and painted `Autopilot refused — already in the destination system.`
  4. Cancel-while-open: direct engage (chart stays) then chart `Cancel autopilot` click: chart stayed, live line `Autopilot cancelled.`, AP off, no pause.
- Console: 0 errors, 0 warnings from this close path.

## Bugs found
None.

## Environmental issues
- Pre-existing Vite on `127.0.0.1:5173` (PID 40044). This verifier did not stop it.
- Playwright MCP shared browser briefly gained 5173 tabs. Those tabs were closed or left; product proof used `location.port === '5174'`.
- First Vite launch used `timeout: 0` without `background: true`; the wrapper reported killed, but PID 46536 kept listening on 5174 and served the session.
- Graph resolve first returned `blocked_ambiguous`, then a Drive-publish false match. Owner task already named Playwright + Vite 5174; verification followed that scope.
- Full `browser_close` was not used so a sibling 5173 tab would not die. The 5174 tab was the current MCP page at teardown.
- `npm run test:boot` was not run (scope skip). WAVE117 pins were read, not executed.

## Evidence
- Screenshots:
  - `out/w120/chartclose/verify/01-chart-open.png`
  - `out/w120/chartclose/verify/02-after-engage-closed.png`
  - `out/w120/chartclose/verify/03-cancel-while-open.png`
  - `out/w120/chartclose/verify/04-refuse.png`
  - `out/w120/chartclose/verify/05-cancel-live.png`
- Logs:
  - `out/w120/chartclose/verify/console.txt`
  - `out/w120/chartclose/verify/live-results.json`
- Test output:
  - Direct `tryEngage`: tok `''`, chart open, AP true.
  - Button success: chart closed, AP true, paused false, focus not in chart, hail flush on.
  - Refuse: chart open, live refuse line.
  - Cancel-while-open: chart open, live `Autopilot cancelled.`
