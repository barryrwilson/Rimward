## Status
CLEAN

## What I tested
- Git status: this leftover pack is untracked markdown only (`docs/AgentApiMarketFillDesign.md` + `out/w139/mktfill/*.md` except `verify/`). Worker did not add `src/`, `PROGRESS.md`, wishlist, `docs/AgentApiDesign.md`, `out/w139/badge/**`, or `out/w139/mktdesk/**`. Working tree is dirty from other packs; those diffs do not add `fillBuy` / `fillSell` / `peekFillUnit`.
- Live census vs inventory/contract/design:
  - `src/game/agent-observe.js` `postedPrice` 242–256, `marketBlock` 258–276 rows `{ commodity, name, posted, hold, legal }` at 267–273, attach 481. No fill keys.
  - `src/systems/station.js` nested `tradeFillUnit` 4692–4714 (not exported; `initStation` 4466). `tryTrade` 4736 / 4745. Pane BUY/SELL 4842–4847, subhead 4830, TRADE header 4838, TRADE cell 4849–4856. Digit 1 `DOCK_KEY_SERVICES[0] === 'market'` 189. `h()` textContent 4544–4547. `priceOf` 2064–2069. `isMarketCommodity` 1043–1045. `currentService` 4472. `COMMODITY_KEYS` 4558 / forEach 4839. Desk bag 6434–6442 has `trade` + `peekService`, no `peekFillUnit`. Desk `trade(spec)` 6390–6397.
  - `src/systems/agent-api.js` `DESK_NEED.trade` 34, `tradeQty` 197–204, `afterDesk` 182–187, `trade` act 369–382 → `desk.trade`.
  - `scripts/boot-test.mjs` BUY offset 2 / TRADE offset **5** at 2809–2811; hermit Vigil buy pin 2838–2843; agent qty 0 `bad-qty` and credits 0 refuse 24380–24404.
  - `scripts/agent-api-hardening-test.mjs` fake ctx 51–104; market omitted off desk 311; provisions `posted === 100` / hold / legal 313–325; no fill assertion. Desk mock is `peekService` only (265–267).
  - `src/game/agent-schema.js` `'trade'` 29 / 55; `FORBIDDEN_NAMES` 71–78 (inventory 69–76 is adjacent, still that block); `reservedName` 147–150; `isForbiddenName` 172–179 (inventory 175 inside it).
  - `src/game/state.js` `COMMODITIES` 350–364; `HERMIT.buyMult` 1.25 at 622.
  - `src/game/save.js` `WORLD_FIELDS` includes `'prices'` 86; `rebindPrices` 1076–1084 (inventory 1071–1083 is the comment+body window).
  - Wishlist INBOX 308–312 (cite only). DONE market block 273–275. DONE pane fill / TRADE 5 at 286–288. Sibling badge 313–317 and TRADE wrap 318+ left to other packs.
  - `docs/AgentApiDesign.md` 337 posted-only observe shape; 363 `trade` via `stationDesk.trade`. Honor, not rewritten by this pack (dirty header/flags/jobs lines are other work).
- Leftover **REAL** / named serial **PR1** is earned: observe JSON is posted-only; pane + `tryTrade` + `act trade` already fill at nested `tradeFillUnit`. Fill is not on observe. CONSUME would be wrong. Serial is not none.
- Deputize matches the owner brief: add `fillBuy` / `fillSell`, keep `posted`, read live helper via read-only `peekFillUnit` (or export without moving the body). Do not rewrite the desk. Comment-only freeze is rejected.
- Honor / non-goals present in design + MERGE LAW: no desk rewrite, no helper move, TRADE offset **5**, no badge/layout theft, no evade reopen, no pad 2B, no in-repo LLM, no later `innerHTML`, fail-closed omit/skip, `state.js` read-only, Digit 1 stays market, no new Digit, no teleport/credits.
- Contract vs design: no merge conflict. Design states contract wins. Same leftover, fields, hook, desk-out, TRADE 5, persist none.
- Line cites point at the named functions. Small width drift (schema 69–76 vs 71–78; save 1071 vs 1076) still lands on the right block.
- Non-blocking census nit: inventory says “11 authored” commodities at `state.js` 350–364. Live `COMMODITIES` has **12** keys (4 bulk + restrictedComponents + 7 exotic). Contract CPU line uses “~11”. Does not change leftover verdict (later pass is `Object.keys(COMMODITIES)`).
- Domain data only. Did not start Vite or Chrome. Did not run `npm run test:boot`. Did not claim ports. No LISTENING on 5173 / 4173 / 3000 / 8080 from this verifier.

## Bugs found

## Environmental issues

## Evidence
- Screenshots: none (data domain; no UI run)
- Logs: none
- Test output: `out/w139/mktfill/verify/write-set.txt`
- Live hole: `src/game/agent-observe.js` 267–273 posted-only rows
- Live fill: `src/systems/station.js` 4692–4714, 4736, 4745, 4842–4847; `src/systems/agent-api.js` 369–382
- Merge law: `out/w139/mktfill/shared-contract.md` (wins over `docs/AgentApiMarketFillDesign.md`)
