## Status
CLEAN

## What I tested
- Worker probe: `node --import ./scripts/with-css-stub.mjs out/w120/toast/probe.mjs` (did not edit the probe).
- Static contract reads against `out/w118/toast/shared-contract.md` and live `src/systems/hud.js`, `src/game/save.js`, `src/ui/hud.css`, `src/style.css`.
- Browser on Vite **5173 only** (`http://127.0.0.1:5173`). Chart-close Vite **5174** was left running. Playwright MCP was shared; a dedicated page ran the inject flow. `[ENV]` tab steal from 5174 occurred on the first tab; the scripted page still completed.

Browser flow:
- NEW GAME → Freehold Greenhand.
- `ctx.emit('saveBlocked', { source: 'autosave', reason: 'Hostiles within the encounter bubble — berth record refused.' })`.
- Wait for visual expire, then the same autosave emit inside 8 s.
- `source: 'berth'` with the same hostile reason.
- Five `.rw-toast` chips, `flags.paused` after origin pick, expire `aria-hidden`.

## Bugs found
None in this leftover.

Contract pins that passed:
- `TOAST_SLOTS = 5`, `TOAST_LIFETIME = 4`, `TOAST_DEDUP_WINDOW = 8`.
- Linger is a five-row `{ key, lastShown }` ring (`toastLinger`), not slot-tied. Chip reuse does not clear linger (probe `key linger survives chip reuse`).
- Expire sets `aria-hidden="true"` and keeps `textContent`. Browser: expire text `▲ AUTOSAVE HELD — hostiles near`, `show=false`, `aria-hidden=true`.
- Real show: `aria-hidden="false"` then `textContent` (`hud.js` 1209–1210).
- Visible same-key path extends `until` only; no `textContent` write.
- Autosave copy `▲ AUTOSAVE HELD — hostiles near` (no berth reason concat). Screenshot `01-autosave-held.png`.
- Berth / missing / unknown source: `▲ SAVE BLOCKED — ` + reason. Screenshot `02-save-blocked.png`.
- `save.js`: `source: 'autosave'` on `requestAutosave`; four `source: 'berth'` emit sites. `overlay-policy` import, `setBerthOpen`, KeyL still present.
- No `innerHTML` in `hud.js` / `pushToast`. No `toastMem` / linger persist. No `new Map()` in `hud.js`.
- No z-index on `.rw-toasts`. `#hud` stays `z-index: 10` in `src/style.css`. Optional CSS is only `.rw-toast:not(.show) { visibility: hidden; }`.
- Toast code does not set `ctx.flags.paused`. After origin pick, injects left `paused === false`. Sim kept drawing.

Probe: `PASS  toast-flood probe` (40 pins). Log: `out/w120/toast/verify/probe.log`.

## Environmental issues
- Graph resolve returned `blocked_ambiguous` on unrelated Drive/Docs/Sheets workflows. This verify stayed local per the assigned leftover.
- `[ENV]` Playwright MCP: first 5173 tab was switched/closed toward `127.0.0.1:5174` (chart-close sibling). Retried with a new page; did not close the 5174 tab; did not call `browser_close`.
- Title overlay keeps the sim paused until origin pick. Emit while paused is dropped by `main.js` (HUD `update` skipped). Not a toast-flood defect.
- Vite 5173 leftover from the first start was reused. A second `npx vite --port 5173` bound 5175 and was killed. 5174 left listening.

## Evidence
- Probe: `out/w120/toast/verify/probe.log`
- Console: `out/w120/toast/verify/console.txt`
- Stills: `out/w120/toast/verify/01-autosave-held.png`, `out/w120/toast/verify/02-save-blocked.png`
- Live cites: `src/systems/hud.js` 64–66, 530–555, 596–600, 848–855, 1186–1213, 1238–1244; `src/game/save.js` 14, 1040, 1385–1516, 1422, 1428, 1535, 1540; `src/ui/hud.css` 635–646, 734; `src/style.css` 24–29
- Browser DOM after autosave inject: 5 chips; AUTOSAVE HELD shown `aria-hidden=false`; sim `paused=false`.
- After expire + identical autosave re-emit at elapsed ~5.65: `shownAutosave=0`.
- Berth inject: SAVE BLOCKED + hostile reason; still 5 chips; `paused=false`.
