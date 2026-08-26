## Status
CLEAN

## What I tested
- Graph resolve (`omp/agent-omp`) → binding `omp/workflow-software-delivery` (`r-mt9khthp-2ae96ac5`).
- Boot pins: `npm run test:boot`. WAVE127 JSON all true. No `WAVE127 AGENT-OBSERVE FAIL`. `BOOT TEST PASS — no update errors`. Exit 0.
- Static: `src/systems/agent-api.js` first-installs `window.rimward` only when `!isPublicHandle(w.rimward)`. Observe/act/enable/disable call `readLiveCtx`: `window.__ctx` if it is an object, else the first-install ctx. One `w.rimward = api` assignment, inside the guard. Not always-replace.
- Node: `node out/w127/agentapi/verify2/node-contract.mjs`. Missing ctx → `{ ok:false, error:'no-ctx' }` (no `ship`/`world`). `act({ name:'teleport' })` → `token:'forbidden'` without opt-in. Nested `initAgentApi` keeps the same frozen handle. First-ctx ping/unknown still work with no `__ctx` (WAVE127 harness). `__ctx` rebind follows the live bag; delete `__ctx` falls back to first-install ctx.
- Live Playwright: Vite `npx vite --port 5180 --host 127.0.0.1 --strictPort` (bound `127.0.0.1:5180`). URL `http://127.0.0.1:5180/?agent=1`. `observe()`, ping, forbidden `teleport`, no badge. Screenshot + evaluate JSON saved.
- Stopped Playwright page. Stopped Vite PIDs 46672 / 44376. 5180 no longer LISTENING (TIME_WAIT only).

## Bugs found
None for WAVE127 pins. The nested-ctx replace bug is gone.

## Notes (not WAVE127 FAILs)
- Node scan `observe-src-no-stringify-ctx` is false: `src/game/agent-observe.js` line 3 is the comment `Never JSON.stringify(ctx)`. Product code does not call `JSON.stringify(ctx)`. Other 26 Node checks passed. Exit 1 is that scan only.
- Live `plotRoute` returns `token:'paused'` on the title screen (paused). Boot WAVE127 unpauses flags before `unknown`. Expected.
- Live console: one warning `rimward: forbidden act teleport` (expected).

## Environmental issues
- None this run. Vite bound IPv4 `127.0.0.1:5180` as required.

## Evidence
- Screenshots: `out/w127/agentapi/verify2/live-agent1.png` (title screen, `?agent=1`, no agent badge)
- Logs:
  - `out/w127/agentapi/verify2/boot-wave127.txt`
  - `out/w127/agentapi/verify2/node-contract.log`
  - `out/w127/agentapi/verify2/live-evaluate.json`
  - `out/w127/agentapi/verify2/live-console.json`
  - `out/w127/agentapi/verify2/node-contract.mjs`
- Test output:
  - Boot: `wave127 agent-observe: {"handle":true,"snapOk":true,"jsonPlain":true,"noThree":true,"noThrow":true,"noCtx":true,"forbidden":true,"pingWhenIn":true,"unknown":true,"noOptIn":true,"ringHeld":true,"sessionBag":true}`
  - Boot: `BOOT TEST PASS — no update errors`
  - Live: `rimward.version=1`, observe `{ok:true, agentOptIn:true, hasShip:true}`, ping `{ok:true, token:''}`, teleport `{token:'forbidden'}`, plotRoute `{token:'paused'}`, `badge:false`, `__ctx` present
- Static: `src/systems/agent-api.js` `readLiveCtx` ~107–117; first-install `if (w && !isPublicHandle(w.rimward))` ~161; `w.rimward = api` ~210. `src/main.js` `window.__ctx = ctx; // debug`. Did not edit `src/`.
