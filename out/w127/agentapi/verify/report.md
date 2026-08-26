## Status
BUGS_FOUND

## What I tested
- Graph resolve (`omp/agent-omp`) → binding `omp/workflow-software-delivery` (`r-mt9iy1d7-d0611d13`).
- Node contract: `node out/w127/agentapi/verify/node-contract.mjs` (single `initAgentApi`). Missing ctx → `{ ok:false, error:'no-ctx' }`. `act({ name:'teleport' })` → `token:'forbidden'`. Ping/disable matrix, harvest from `ctx.events` not `lastEvents`, hailOpened strips `ship`, ring cap 16, `?agent=1` opt-in.
- Boot pins: `npm run test:boot`. WAVE127 JSON + `WAVE127 AGENT-OBSERVE FAIL`. Only 1 boot error this run.
- Static: `window.rimward` in `src/systems/agent-api.js`; `window.__ctx` debug in `src/main.js`; `initAgentApi` after hail/save/chart/models, before HUD; no HTTP listen; no badge DOM; harvest uses `ctx.events`.
- Live Playwright: Vite `npx vite --port 5177 --strictPort` (bound `[::1]:5177`). URL `http://localhost:5177/?agent=1` (IPv4 `127.0.0.1` refused). `observe()`, `ping`, forbidden `teleport`, no badge. Screenshot + evaluate JSON saved.
- Stopped Vite PID 42688, Playwright `browser_close`. 5177 / 9470 not LISTENING.

## Bugs found
1. WAVE127 boot pins fail (`pingWhenIn`, `unknown`).
   - Output: `wave127 agent-observe: {...,"pingWhenIn":false,"unknown":false,"noOptIn":true,"ringHeld":true,...}` then `WAVE127 AGENT-OBSERVE FAIL`.
   - Cause: `initAgentApi` always does `w.rimward = api`. `scripts/boot-test.mjs` `bootFreshHarness` (~2485) re-runs the full `inits` list (beautiful, marked, greenhand, drifter, wave10, wave24, wave25, …). Each call replaces `window.rimward` with an API closed over that nested ctx.
   - WAVE127 mutates the original `ctx.agent.optIn = true`, then calls `window.rimward.act({ name:'ping' })`. Act still reads the last nested ctx (`optIn` false) → `token:'opt-in'`. `plotRoute` also `opt-in`, not `unknown`.
   - Isolated Node (one init) passes ping/unknown. Live Vite (one init, `?agent=1`) ping ok.
   - Worker notes said they did not run `npm run test:boot`.
   - Fix: keep the first `window.rimward` (singleton public handle), or make observe/act follow a live ctx ref; and/or WAVE127 must opt-in the ctx the current handle closed over.

## Environmental issues
- Vite 5177 listens on `[::1]` only. Playwright `http://127.0.0.1:5177` → `ERR_CONNECTION_REFUSED`. `http://localhost:5177` works.
- `127.0.0.1:5178` still LISTENING (HUD-06, not started here). Left running.
- Pre-existing boot FAILs (REDMARCH `castMatches`, WAVE30 demand hail) did not fire this run. Boot exit 1 is WAVE127 only.

## Evidence
- Screenshots: `out/w127/agentapi/verify/live-agent1.png` (title screen, `?agent=1`, no agent badge)
- Logs:
  - `out/w127/agentapi/verify/boot-wave127.txt`
  - `out/w127/agentapi/verify/live-evaluate.json`
  - `out/w127/agentapi/verify/node-contract.mjs` (52/53; the one miss is a comment `Never JSON.stringify(ctx)` in `src/game/agent-observe.js` line 3 — not a product call)
- Test output:
  - Boot: `WAVE127 AGENT-OBSERVE FAIL`; `BOOT TEST FAIL — 1 errors`
  - Live evaluate: `rimward.version=1`, observe `{ok:true, agentOptIn:true, hasShip:true}`, ping `{ok:true, token:''}`, teleport `{token:'forbidden'}`, plotRoute `{token:'paused'}` (title paused), `badge:false`, `__ctx` present
  - Console: `rimward: forbidden act teleport` (expected)
- Static: `src/main.js` lines 80, 139–140; `src/systems/agent-api.js` `w.rimward = api`; no `createServer` / badge DOM
