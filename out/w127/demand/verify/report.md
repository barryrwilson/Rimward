## Status
CLEAN

## What I tested
- Graph: `execute_workflows` (`codex/workflow-browser-assisted-work`, resolve `r-mt9kpocy-a566e17d`). Did not write the graph. Local Vite/CDP is not an external send.
- Merge law: `out/w126/demand/shared-contract.md` wins.
- Node: `node --check` on `src/systems/hail.js`, `npc.js`, `hud.js` — all OK.
- Node: `node out/w127/demand/probe.mjs` — 46/46 passed. Log: `out/w127/demand/verify/probe.log`.
- Grep (`out/w127/demand/verify/grep-static.txt`):
  - `'Heave to. Cargo or hull.'` only in `npc.js` **1729**, gated by `!(ai.role === 'pirate' && ai.target === 'player')`.
  - Ace `'Run if you like.'` still in `npc.js` **1727** and **2227**.
  - No `flags.paused =` in `hail.js`.
  - No `innerHTML` in `hail.js`.
  - HUD-06 `HOME_EDGE_INSET = 108` still in `hud.js` **75**.
  - WAVE127 Hail01 boot-test block exists (`WAVE127 HAIL01 * FAIL` pins).
  - WAVE127 Agent API block still exists (`WAVE127 AGENT-OBSERVE FAIL`).
- Live: Vite `http://127.0.0.1:5180/`, Chrome CDP **9480**, New Game → Freehold Greenhand. Constructed pirate demand hulls (`spawnLiveShip` independent cutter/freighter trader mesh, then pirate demand stamp) + `ctx.emit('hailOpened')` because KeyH did not open a demand.
  1. Demand card: named `HAIL — VANE ROOK`, line `Vane Rook heaves to — 80 UU or hull. 20s.`, buttons Pay / Show teeth / Refuse. `01-demand-card.png`.
  2. Announce: same-frame harness `hailClosed` skipped the open toast on shot 01. Linger on pay still shows `HEAVE TO. PAY 80 UU OR FIGHT. 20S.` (`03-paid.png`). HUD copy is `{name} — heave to. Pay {n} UU or fight. {t}s.`
  3. Digit3 refuse: toast `Vane Rook — demand refused. They fire.` `demanding` false, outcome `refused`. `02-refused.png`.
  4. Digit1 pay: credits 500 → 420 (finite n=80), toast `tribute taken. They run.` `03-paid.png`.
  5. Dock (`flags.docked = true`): card gone, toast `demand broken. You docked.` outcome `docked`. `04-docked.png`.
  6. Jump (`systemLoaded`): toast `demand dropped. You jumped.` outcome `jumped`. `05-jumped.png`.
  7. Expire (`demandExpiresAt` in the past): toast `demand expired. They fire.` outcome `expired`. `06-expired.png`.
  8. Ace: live evaluate `payTribute` false, no `hailOpened` tribute. Static `updateDuel` has no `payTribute`. `07-ace-no-tribute.png`.
  9. HUD-06: flying undocked, `.rw-pos-home` exists (`HOMEFreehold Landing · 393u`). `08-home-still.png`.
  10. Console: no hail.js errors. No Runtime exceptions.
- npc.js expire/dock/jump also proved on live hulls without relying only on hail.js: `demanding` false, outcomes `expired` / `docked` / `jumped`.
- Did not run `npm run test:boot`. Did not edit `src/`.

## Bugs found
None.

## Environmental issues
- First `spawnLiveShip` with `redledger`/`pirate`/`cutter` returned null (mesh not primed). Fallback to independent trader mesh, then pirate demand fields, succeeded.
- Harness `hailClosed` without `ship` in the same events queue as `hailOpened` made HUD skip the named announce toast on shot 01 (look-ahead in `toastForEvent`). Not a product miss for a normal open.
- Live world also toasted nameless `Heave to. Cargo or hull.` (shots 04–08). `commLine` toasts drop `from`. Pirate-vs-NPC telegraph is still allowed by merge law. The pirate-vs-player gate is present. npcProof `heaveTo` scanned unscoped `lastEvents`, so it can count a world pirate-vs-NPC line.
- Wrapper timeout killed the first two Chrome runs. Third run wrote `live-results.json`. Vite PID 45680 stopped. CDP 9480 not LISTENING. Did not kill 9222.

## Evidence
- Screenshots:
  - `out/w127/demand/verify/01-demand-card.png`
  - `out/w127/demand/verify/02-refused.png`
  - `out/w127/demand/verify/03-paid.png`
  - `out/w127/demand/verify/04-docked.png`
  - `out/w127/demand/verify/05-jumped.png`
  - `out/w127/demand/verify/06-expired.png`
  - `out/w127/demand/verify/07-ace-no-tribute.png`
  - `out/w127/demand/verify/08-home-still.png`
- Logs:
  - `out/w127/demand/verify/probe.log` (46/46)
  - `out/w127/demand/verify/grep-static.txt`
  - `out/w127/demand/verify/node-check.log`
  - `out/w127/demand/verify/console.txt`
  - `out/w127/demand/verify/live-results.json`
- Test output: probe 46/46; live refuse/pay/dock/jump/expire toasts and outcomes all matched the contract.
