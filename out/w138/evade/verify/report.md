## Status
CLEAN

## What I tested
- `npm run test:boot` (full harness). WAVE138 evade JSON all `true`. No `WAVE138 EVADE FAIL`. WAVE138 oreguide JSON all `true`; no `WAVE138 OREGUIDE FAIL`.
- Boot also printed known sibling fails (not this PR): WAVE127 `ringHeld`, WAVE127 hail01 nan, WAVE129 hailmiss, WAVE132 `dockOneFrame`. `BOOT TEST FAIL — 4 errors` is those waves only.
- Static contract on worker files vs merge law `out/w137/evade/shared-contract.md`:
  - `'afterburner'` is in `COMMAND_NAMES` and `EVADE_LIVE` (`src/game/agent-schema.js`).
  - `evade` / `flee` are not live. `teleport` / `warp` stay forbidden.
  - Public `PULSE_EDGES` in `src/systems/agent-api.js` is still four (`dock` / `hail` / `target` / `reticleLock`). No public afterburner alias.
  - `pendingAfterburner` is module-scope in `src/systems/controls.js`. Space keydown and `agentPulse('afterburner')` set the same flag. `initControls` no longer holds a local latch.
  - `dispatchLive` afterburner: docked → `docked`; else `afterControls(..., agentPulse(ctx, 'afterburner'), true)`.
  - `dispatchAct` still returns live tokens `opt-in` / `paused` / `held` before live dispatch.
  - Afterburner path in `agent-api.js` does not write `ctx.input`, pose, credits, or `flags.paused`. Missing `ctx.input` → `no-service`.
  - `src/game/state.js` / `src/systems/npc.js` / `src/systems/ship.js` burn knobs unchanged (×2 / 6 s / 8 s cd / min power 15).
  - Worker files did not introduce `innerHTML`.
  - MSN-05 `acceptedMiningOreKeys` / `fieldHasMatchingOre` / `rockMatchesOreKeys` filter remains inside `collectCycleCands`.
- Observe: `ship.burnerReadyAt` finite-or-omit in `src/game/agent-observe.js`. Boot `readyAtFinite` / `readyAtOmit` true.
- Browser (Vite `127.0.0.1:5186`, Chrome `--user-data-dir out/w138/evade/verify/chrome-profile`, CDP `9486`, `?agent=1`):
  - `act({ name: 'afterburner' })` → `{ ok: true, status: 'queued' }`, no throw.
  - After two animation frames: `burnerActive` true, badge `Last: afterburner`, HUD `BURNING`.
  - Hull stayed at Freehold spawn (~`0,30,800` → slight physics Z). No pad warp. Docked false.
  - Aim-glass hub stayed empty (LOCK / TARGET only). `evade` / `flee` unknown and `teleport` forbidden in the first CDP session.

## Bugs found
[Empty if CLEAN.]

## Environmental issues
- First Vite bind was `[::1]:5186` only. Chrome `http://127.0.0.1:5186` refused until Vite restarted with `--host 127.0.0.1`.
- Harness `BOOT TEST FAIL — 4 errors` is WAVE127 / WAVE129 / WAVE132 leftovers. Do not treat as WAVE138 evade.
- Worktree also has sibling edits (`src/style.css` badge pin, `src/systems/hud.js` NAV-10 SLOW / MSN-05 cue). Those files are not in this evade write-set. No evade regression attributed to them.
- Stopped verifier processes: Vite PID 56844, Chrome CDP PID 60536 tree. Ports 5186 / 9486 / 5184 not LISTENING after kill.

## Evidence
- Screenshots:
  - `out/w138/evade/verify/afterburner-last.png` — Agent on, `Last: afterburner`, BURNING, empty hub, Freehold Drift, no pad warp.
  - `out/w138/evade/verify/afterburner.png` — earlier still (probe then called `teleport`; origin card still up). Not the clean still.
- Logs:
  - `out/w138/evade/verify/boot-test.log`
  - `out/w138/evade/verify/browser.json`
  - `out/w138/evade/verify/browser-shot.json`
  - `out/w138/evade/verify/browser-raf.json`
- Test output:
  - `wave138 oreguide:` all true
  - `wave138 evade: {"namesHave":true,"queued":true,"edgeFrame":true,"burnerOn":true,"evadeUnknown":true,"fleeUnknown":true,"dockedTok":true,"optInTok":true,"pausedTok":true,"heldTok":true,"teleportForbidden":true,"readyAtFinite":true,"readyAtOmit":true,"lastLine":true,"helpLine":true,"oreguideKeep":true,"publicPulseFour":true,"pulseAliasUnknown":true,"noThrow":true}`
