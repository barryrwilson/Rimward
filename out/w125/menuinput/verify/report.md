## Status
[ CLEAN ]

## What I tested
- Static read of `src/systems/controls.js` against `out/w124/menuinput/shared-contract.md`.
  - `shouldSkipWeaponGroupDigits` matches the merge-law formula (`docked === true`, `hailOpen === true`, `hailDigitsAllowed(ctx) === false`, `playSurfaceBlocked(ctx) === true`, `settingsOwnsScreen() === true`, `paused` / `chartOpen` / `berthOpen`, `shouldSkipDockPulse`; outer catch returns docked only).
  - Digit1–5 assign `input.weaponGroup` only when the skip is false.
  - TRACKED still lists Digit1–5. No Digit6–9/0 cases. No `stopImmediatePropagation`. KeyJ still uses `shouldSkipDockPulse`. KeyD still writes `strafeX`. `fireHeld` is still `fireDown && ctx.flags.chartOpen !== true`.
  - Import of `hailDigitsAllowed`, `playSurfaceBlocked`, `settingsOwnsScreen` is read-only.
- Node formula probe: `out/w125/menuinput/verify/formula-probe.mjs` → FORMULA PROBE OK (18 cases).
- Live Playwright on Vite `http://127.0.0.1:5178/` (Chrome CDP 9432 also started). Click New Game (`data-title-action="new"`), then Freehold Greenhand. No title Digit dispatch.
  1. Dock at Freehold Landing. Digit5 opens Repair. `weaponGroup` stays 1. HUD WPN stays `1 · Energy cannon`. Digit4 opens Feed & tend. `weaponGroup` stays 1 (does not become 4).
  2. Digit0 still opens Shipyard. Digit9 still opens Standing. Digit8 still Launch and undocks. Open space Digit1–5 set groups 1–5 (`2 · Disruptor`, `3 · Mining laser Mk I`, `4 · —`, `5 · Psionic bolt`, `1 · Energy cannon`).
  3. Hail: KeyH on `rec-11` did not open a card. `ctx.emit('hailOpened', { intents: letGo, keepFiring })` opened HAIL — Ninth Tooth. Digit1 resolved Let them go (`hailOpen` false). `weaponGroup` stayed 1.
  4. Chart (M), berth (L), settings (O), pause (P): Digit5 does not write `weaponGroup`. Chart/berth/settings closed with Escape. Pause closed with KeyP.
  5. Direct `window.__ctx.input.weaponGroup = 2` sticks. After unpause HUD is `2 · Disruptor`.
  6. Console: 0 errors from this session.

Did not run `npm run test:boot`. Did not run project-wide formatters or linters.

## Bugs found
None.

## Environmental issues
- `graph_resolve` with no namespace was `blocked_ambiguous`. Resolve with `namespace: omp` bound `omp/workflow-software-delivery`. No graph writes.
- Working tree also has `src/systems/overlay-policy.js` `berthHeld` / `setBerthHold`. That is sibling CTL-03 dirt. PR1 does not import those helpers. Not a PR1 write.
- Vite started with `--host 127.0.0.1 --port 5178 --strictPort` so `127.0.0.1` binds. Playwright also had a 5176 tab (other worker). This pack used the 5178 page only. Did not close the 5176 tab.
- Pause does not close on Escape. KeyP toggles pause. Digit skip under pause still held.
- Live hail from KeyH did not open. Coverage used a live `hailOpened` emit on a nearby ship.
- Stop: killed Vite PID 41120 (port 5178). Killed Chrome CDP PID 49188 (port 9432). Closed the Playwright 5178 tab. Did not call full `browser_close` because tab 1 is the other worker on 5176. After stop, 5178 and 9432 are not LISTENING.

## Evidence
- Screenshots:
  - `out/w125/menuinput/verify/01-title.png`
  - `out/w125/menuinput/verify/03-docked.png`
  - `out/w125/menuinput/verify/04-digit5-repair.png`
  - `out/w125/menuinput/verify/05-digit4-feed.png`
  - `out/w125/menuinput/verify/06-digit0-shipyard.png`
  - `out/w125/menuinput/verify/07-digit9-standing.png`
  - `out/w125/menuinput/verify/08-digit8-launch-undock.png`
  - `out/w125/menuinput/verify/09-space-digit1.png` … `09-space-digit5.png`
  - `out/w125/menuinput/verify/10-overlay-chart.png`
  - `out/w125/menuinput/verify/10-overlay-berth.png`
  - `out/w125/menuinput/verify/10-overlay-settings-open.png`
  - `out/w125/menuinput/verify/10-overlay-pause.png`
  - `out/w125/menuinput/verify/11-direct-assign-live.png`
  - `out/w125/menuinput/verify/12-hail-open.png`
- Logs:
  - `out/w125/menuinput/verify/formula-probe.log`
  - `out/w125/menuinput/verify/grep-static.txt`
  - `out/w125/menuinput/verify/console.txt`
  - `out/w125/menuinput/verify/live-results.json`
