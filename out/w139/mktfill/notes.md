# Wave 139 Agent market-fill leftover notes

**Verdict:** leftover **REAL**. Name: **observe fill buy/sell vs posted**. Named serial: **PR1**. Not CONSUME. Named serial is **not** none. One law: **(a)** JSON rows show fill that matches `tradeFillUnit` and still show posted, not **(b)** desk rewrite / helper move / TRADE wrap / badge.

## Method

- Assigned Wave 139 leftover pack. Domain **data**. Local markdown only. Task forbade `graph_propose` / `graph_approve`. Did **not** call those tools. Did **not** start a Drive publish bind.
- Census live `src/game/agent-observe.js` `postedPrice` **242–256**, `marketBlock` **258–276**, attach **481**.
- Census `src/systems/station.js` `tradeFillUnit` **4692–4714**, `tryTrade` **4721–4766**, pane BUY/SELL **4842–4847**, `trade(spec)` **6390–6397**, Digit 1 **189**.
- Census `src/systems/agent-api.js` `trade` **369–382**, `tradeQty` **197–204**, `DESK_NEED.trade` **34**, `afterDesk` **182–187**.
- Census `src/game/agent-schema.js` `'trade'` **29**, **55**; `reservedName` **147–149**; `num` **182–185**.
- Census `scripts/boot-test.mjs` TRADE offset **5** **2809–2811**; agent trade refuse **24380–24404**.
- Census `scripts/agent-api-hardening-test.mjs` market posted-only **311–325**.
- Census `docs/AgentApiDesign.md` **337**, **363** — honor, **not edited**.
- Census wishlist **273–275** DONE (market block exists), **286–288** DONE (pane fill), **308–312** INBOX (this leftover). Cite, do not edit.
- Code wins. Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** write `src/`. Did **not** edit the wishlist or `PROGRESS.md`.

## Why REAL (not CONSUME)

Named hole still live:

- Observe rows have `posted` only (`agent-observe.js` **267–273**).
- No `fillBuy` / `fillSell` (grep 0 in `agent-observe.js`).
- `trade` / pane already fill at `tradeFillUnit`.
- Hardening pin is `posted === 100` with no fill assertion.

Pane fill + `trade` fill + `postedPrice` comment **are not** observe fill. Do not CONSUME on those.

CONSUME would require observe fill buy/sell that match `tradeFillUnit` so agents cannot be misled by posted-only JSON. Census did not prove that.

## Deputize (not parked)

| Knob | Freeze |
|---|---|
| Law | (a) observe `fillBuy` / `fillSell`; keep `posted` |
| Match | live `tradeFillUnit(key, true/false)` |
| Hook | `peekFillUnit` on desk (or export without move) |
| Duplicate math | **no** |
| Desk rewrite | **no** |
| TRADE offset | **5** |
| Non-finite | omit |
| Persist | none |

## Later write-set (do not edit now)

- `src/game/agent-observe.js` — `marketBlock` fill fields.
- Optional: schema comment; hardening/boot pin fill ≠ posted.
- Allowed hook only: `station.js` `peekFillUnit` or export of nested helper. **Do not** change `tryTrade` / `renderMarket`.
- Do **not** claim `state.js`, `save.js`, `market.js`, `agent-api.js` trade dispatch, `style.css`, `hud.js`.
- Do **not** claim sibling Wave 139 badge / market-layout packs.

## Coupling (do not steal)

- Wave 139 Agent badge layout (wishlist **313–317**).
- Wave 139 Market desk layout / TRADE wrap (wishlist **318+**).
- Agent evade (`docs/AgentApiEvadeDesign.md`).
- Pad 2B (`docs/AgentApiDesign.md`).
- Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 / CTL-03 / AI-05 / CTL-04.
- Agent API PR1–PR6 handle. Do not edit `docs/AgentApiDesign.md`.

## Graph

Task lock: local markdown; do not `graph_propose` / `graph_approve`. No workflow bind used. Owner write-set is local files under `docs/AgentApiMarketFillDesign.md` and `out/w139/mktfill/**` except `verify/**`.

## Reviews

Security HIGH/CRITICAL (XSS names, proto keys, persist god prices, throw, innerHTML, duplicate fill drift, `for-in` prices, observe `tryTrade` sample) **resolved in freeze**. Code Blocker/Major **resolved in freeze** after REAL/PR1, desk out, peek-not-move, show-both, peek read-only. UI Blocker/Major **resolved as later JSON fields** (live agent still sees posted-only until PR1). Open MEDIUM/LOW: fake-ctx omit fill; AgentApiDesign **337** vs new leftover; sibling TRADE wrap.

## Re-review

After freeze (peekFillUnit deputize **read-only**, omit non-finite, authored keys only, no observe `tryTrade`): no new HIGH/CRITICAL. MEDIUM AgentApiDesign shape drift documented, not expanded (do not edit that file). Did not start Vite/Chrome. Did not write `out/w139/mktfill/verify/**`.

## Not started

Vite, Chrome, Playwright, CDP. No ports claimed. No `out/w139/mktfill/verify/**`.
