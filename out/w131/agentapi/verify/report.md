## Status
[ BUGS_FOUND ]

## What I tested
- Ran `npm run test:boot` from `C:\Projects\WebSim`. Exit 0. WAVE127 and WAVE131 JSON pins are all true. Log ends with `BOOT TEST PASS`.
- Static read of `src/systems/agent-api.js`, `src/game/agent-schema.js`, `src/systems/hail.js`, `src/systems/station.js` against merge law `out/w126/agentapi/shared-contract.md`.
- Gate order in `dispatchAct`: forbidden → opt-in → ping/disable → paused → held → live dispatch.
- `agent-api.js` does not assign `ctx.input`, ship position, or `ctx.world.credits`.
- `hailResolve` returns `no-service` when the card is closed. `hailApi.peek()` returns empty intents. `hailApi.resolve` returns before `resolveIntent` when `open` is null. It does not call `payTribute`.
- PR3 names `dock`, `hail`, `selectTarget`, `pulse`, `setWeaponGroup` stay `unknown`. They are authored in `COMMAND_NAMES` and they are not in `PR2_LIVE`.
- Live Playwright on Vite `127.0.0.1:5181` only. Opened `http://127.0.0.1:5181/?agent=1`. Clicked New Game, then Freehold Greenhand. Did not call `enable()`. Game was not paused.
- Live `observe()` ok with `agentOptIn: true`. `ping` ok. `teleport` forbidden. `plotRoute` to `veridian` ok. `openService` in space is `no-service`.
- Live pause/hold gates: `plotRoute` is `paused` / `held`. `ping` stays ok.
- Constructed live market buy with `credits=0` while docked+market. Constructed `acceptJob` with a missing posting id.

## Bugs found

### Bug 1: `act({ name: 'trade' })` reports success when the trade did not happen
- Severity: HIGH
- Repro: On `?agent=1`, after New Game, set `flags.docked = true`, `act({ name:'openService', args:{ id:'market' } })`, set `ctx.world.credits = 0`, then `act({ v:1, name:'trade', args:{ commodity:'provisions', qty:1, side:'buy' } })`.
- Expected: Fail closed. `ok: false`. Token/error may copy live `ui.notice` (`Not enough UU.` / hold full). Credits and cargo must not change. Contract §0.2 / AgentApiDesign trade refuse list includes UU and hold.
- Actual: `{ v:1, ok:true, error:'', name:'trade', token:'' }`. Credits stayed 0. Cargo stayed empty. `dispatchLive` always `return ok` after `desk.trade(...)`. `stationDesk.trade` calls `tryTrade`, which returns with a notice and does not debit.
- Evidence: `out/w131/agentapi/verify/live-evaluate.json` `tradeNoUu`. Source: `src/systems/agent-api.js` 285–299; `src/systems/station.js` 4616–4642 and 6294–6300.

### Bug 2: `act({ name: 'acceptJob' })` reports success when the posting is not valid
- Severity: HIGH
- Repro: Same live session. Set `flags.docked = true`, `act({ name:'openService', args:{ id:'jobs' } })`, then `act({ v:1, name:'acceptJob', args:{ id:'no-such-job-w131' } })`.
- Expected: Fail closed. Contract refuse list includes “not offered”. `acceptJobDesk` sets `ui.notice = 'That posting is not valid.'` and returns. `act` must not claim success.
- Actual: `{ v:1, ok:true, error:'', name:'acceptJob', token:'' }`. `dispatchLive` always `return ok` after `desk.acceptJob({ id })`.
- Evidence: `out/w131/agentapi/verify/live-evaluate.json` `acceptMissingJob`. Source: `src/systems/agent-api.js` 275–283; `src/systems/station.js` 6315–6332.

## Environmental issues
- PowerShell `Tee-Object` wrote the boot log last line with a mangled em dash (`ΓÇö`) in `boot-test.log`. The live stdout was `BOOT TEST PASS — no update errors`. Pins and exit code are intact.
- Vite bound `127.0.0.1:5181` only. No bind to `0.0.0.0`.

## Evidence
- Screenshots: `out/w131/agentapi/verify/live-title.png`, `out/w131/agentapi/verify/live-flight.png`
- Logs: `out/w131/agentapi/verify/boot-test.log`
- Test output:
  - `wave127 agent-observe: {"handle":true,"snapOk":true,"jsonPlain":true,"noThree":true,"noThrow":true,"noCtx":true,"forbidden":true,"pingWhenIn":true,"unknown":true,"noOptIn":true,"ringHeld":true,"sessionBag":true}`
  - `wave131 agent-intents: {"stationDesk":true,"hailApi":true,"plotCharted":true,"plotUncharted":true,"apEngage":true,"apCancelOk":true,"amNoRock":true,"openNotDocked":true,"tradeBadQty":true,"acceptWrongService":true,"repairWrong":true,"feedBadKind":true,"hailClosedRefuse":true,"undockOk":true,"pr3Unknown":true,"teleportForbidden":true,"disableNoCancelAp":true,"noThrow":true}`
  - `BOOT TEST PASS — no update errors` (exit 0)
- Live evaluate: `out/w131/agentapi/verify/live-evaluate.json`
- Console: one warning `rimward: forbidden act teleport` at `agent-api.js:346`. Zero new errors.
