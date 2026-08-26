## Status
CLEAN

## What I tested
- Graph: `execute_workflows` (`codex/workflow-software-delivery`, resolve `r-mt9lxbiy-1d1c10a1`). Did not write the graph. Did not start Vite/Chrome. Did not kill 9222. Did not edit `src/`.
- Merge law: `out/w126/demand/shared-contract.md` wins.
- Node: `node --check` on `src/systems/hail.js`, `npc.js`, `hud.js` — all OK. Log: `out/w127/demand/verify-r2/node-check.log`.
- Node: `node out/w127/demand/probe.mjs` — 50/50 passed. Log: `out/w127/demand/verify-r2/probe.log`.
- **In-scope:** `npm run test:boot` from `C:\Projects\WebSim`. Exit 0. `BOOT TEST PASS — no update errors`. Log: `out/w127/demand/verify-r2/boot-test.log`.
- Hail01 runtime pins (this re-dispatch):
  - `wave127 hail01 open`: all true including `toastNamed: true` (no `WAVE127 HAIL01 OPEN FAIL`).
  - `wave127 hail01 heave`: `heaveSuppressed: true`, `noDemandYet: true` (no `WAVE127 HAIL01 HEAVE FAIL`).
  - expire / dock / jump / ace / nan / src: all true. No `WAVE127 HAIL01 * FAIL`.
- Agent API: `wave127 agent-observe` all true. No `WAVE127 AGENT-OBSERVE FAIL`.
- Grep (`out/w127/demand/verify-r2/grep-static.txt`):
  - HUD-06 `HOME_EDGE_INSET = 108` still in `hud.js` **75**.
  - WAVE127 Agent API block still (`WAVE127 AGENT-OBSERVE FAIL` at `boot-test.mjs` **24053**).
  - `toastNamed` pin still at **24112** / OPEN FAIL at **24118**.
  - `heaveSuppressed` pin still at **24165–24172**.
  - HUD look-ahead still requires `o.demandHail === true` and `o.ship === e.ship` (`hud.js` **694–700**).
  - `suppressPirateHeaveTo` still in `npc.js` **364** / **1747**.

## Bugs found
None.

## Environmental issues
None. Boot log encodes the PASS em dash as `ΓÇö` under PowerShell tee; the run is still `BOOT TEST PASS`.

## Evidence
- Screenshots: none (no Vite/Chrome by instruction).
- Logs:
  - `out/w127/demand/verify-r2/node-check.log`
  - `out/w127/demand/verify-r2/probe.log` (50/50)
  - `out/w127/demand/verify-r2/boot-test.log` (`BOOT TEST PASS`)
  - `out/w127/demand/verify-r2/grep-static.txt`
- Test output excerpts:
  - `wave127 hail01 open: {"hailOpened":true,"speakerOnEv":true,"demandHail":true,"expiresAt":true,"toastNamed":true,"cardNamedTimer":true,"intents":true}`
  - `wave127 hail01 heave: {"heaveSuppressed":true,"noDemandYet":true}`
  - `wave127 agent-observe: {"handle":true,"snapOk":true,"jsonPlain":true,"noThree":true,"noThrow":true,"noCtx":true,"forbidden":true,"pingWhenIn":true,"unknown":true,"noOptIn":true,"ringHeld":true,"sessionBag":true}`
  - `BOOT TEST PASS — no update errors`
