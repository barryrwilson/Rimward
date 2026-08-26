## Status
CLEAN

## What I tested
- Graph: `execute_workflows` (`codex/workflow-software-delivery`, resolve `r-mt9lyag0-cde08aaf`). Did not write the graph. Did not edit `src/`.
- Boot: `npm run test:boot` (77.59 s, exit 0). Full log `out/w127/demand/verify2/boot-test.txt`. WAVE127 excerpt `out/w127/demand/verify2/boot-wave127.txt`.
  - No `WAVE127 HAIL01 OPEN FAIL`.
  - No `WAVE127 HAIL01 HEAVE FAIL`.
  - No other `WAVE127 HAIL01 * FAIL`.
  - No `WAVE127 AGENT-OBSERVE FAIL`.
  - `wave127 hail01 open` all true, including `toastNamed:true`.
  - `wave127 hail01 heave` `{heaveSuppressed:true, noDemandYet:true}`.
  - Expire / dock / jump / ace / nan all true.
  - Agent-observe all true (`handle` through `sessionBag`).
  - `BOOT TEST PASS — no update errors`.
- Static (`out/w127/demand/verify2/grep-static.txt`):
  - HUD-06 `.rw-home-mark` in `hud.js` (pip + chevron) and `hud.css`.
  - POS HOME comment + `.rw-pos-home` in `hud.js` / `hud.css`.
  - `HOME_EDGE_INSET = 108` still at `hud.js` **75**.
  - No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hail.js`.
  - Ace `updateDuel` 4500-char slice: no `payTribute`; `'Run if you like.'` at `npc.js` **2260**.
  - Only non-duel `payTribute` in `npc.js` is hunt demand intents at **1534**.
- Node: `node out/w127/demand/probe.mjs` — 50/50 passed. Log: `out/w127/demand/verify2/probe.log`.
- Live Vite: skipped (boot passed).
- Processes: boot-test node exited. Did not start Vite or Chrome. Did not kill host `127.0.0.1:9222` (PID 20800) or MCP node processes.

## Bugs found
None.

## Environmental issues
- PowerShell `*>` wrote `boot-test.txt` with a garbled em dash on the PASS line (`ΓÇö`). Exit 0 and the WAVE127 JSON pins are the source of truth. Excerpt file uses the authored dash.

## Evidence
- Logs:
  - `out/w127/demand/verify2/boot-test.txt`
  - `out/w127/demand/verify2/boot-wave127.txt`
  - `out/w127/demand/verify2/probe.log` (50/50)
  - `out/w127/demand/verify2/grep-static.txt`
- Test output:
  - `wave127 agent-observe: {"handle":true,"snapOk":true,"jsonPlain":true,"noThree":true,"noThrow":true,"noCtx":true,"forbidden":true,"pingWhenIn":true,"unknown":true,"noOptIn":true,"ringHeld":true,"sessionBag":true}`
  - `wave127 hail01 open: {"hailOpened":true,"speakerOnEv":true,"demandHail":true,"expiresAt":true,"toastNamed":true,"cardNamedTimer":true,"intents":true}`
  - `wave127 hail01 heave: {"heaveSuppressed":true,"noDemandYet":true}`
  - `BOOT TEST PASS — no update errors`
- Static: `src/systems/hud.js` `HOME_EDGE_INSET = 108` **75**; `.rw-home-mark` **903/907**; POS HOME **37**; `initHud` parents `#hud` **851**. `toastForEvent` hailOpened look-ahead requires `o.demandHail === true` and `o.ship === e.ship` **694–701**. `npc.js` `suppressPirateHeaveTo` uses `U.ENCOUNTER_BUBBLE` (800) **364–373**. Ace `updateDuel` has no `payTribute`. Did not edit `src/`.
