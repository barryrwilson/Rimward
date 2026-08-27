# Agent market fill inventory (observe JSON fill vs posted)

**Wave:** 139 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-27).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** observe market rows show fill buy/sell that match desk `tradeFillUnit`, and still show `posted`.  
**Law:** **one** — add fill buy/sell on the observe market block (keep posted). `trade` already fills at `tradeFillUnit`. **Do not** rewrite the desk. **Do not** move `tradeFillUnit`.  
**Not this leftover:** Agent badge layout. Market desk layout / TRADE overflow. Agent evade. Pad 2B. Agent API PR1–PR6 rewrite. Digit 1 market map.

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-27 Claude Fable — lines **308–312** — cite, do not edit):

> INBOX (P2, AGENT API): Observe market rows expose **posted** table
> prices (`priceOf` / `world.prices`). Desk fill still applies rank, faction,
> epic, and hermit modifiers. An agent can still buy/sell on the wrong unit
> if it trusts JSON posted instead of the pane fill. Add fill buy/sell on the
> market block, or document that `trade` uses fill and show both.

Agent API serial PR1–PR6 is **complete**. Market observe already lists keys, names, posted, hold, legal (`wishlist` **273–275** DONE). Fill vs posted is **this leftover**. Pane BUY/SELL already share `tradeFillUnit` with `tryTrade` (`wishlist` **286–288** DONE). **Do not edit** `docs/AgentApiDesign.md`. This pack owns the observe fill leftover.

If census had proved observe already exposes fill buy/sell that match `tradeFillUnit` (and agents cannot be misled by posted-only JSON), this pack would freeze leftover **CONSUME** and named serial **none**. Census did not.

---

## 1. Observe market block (primary hole)

| Surface | Today | Cite |
|---|---|---|
| Builder | `marketBlock(ctx, docked, service)` | `agent-observe.js` **258–276** |
| Gate | `null` unless `docked` and `service === 'market'` | **259** |
| Row source | `Object.keys(COMMODITIES)` then `Object.hasOwn(COMMODITIES, commodity)` | **260–264** |
| Row fields | `commodity`, `name`, `posted`, `hold`, `legal` | **267–273** |
| Fill buy | **absent** | **267–273** |
| Fill sell | **absent** | **267–273** |
| Attach | `market: marketBlock(...)` on snapshot | **481** |
| Off desk | `null` (hardening pin) | `agent-api-hardening-test.mjs` **311** |
| On market | provisions `posted === 100` (base), hold, legal — **no fill pin** | **313–325** |

**Hole:** JSON rows are posted-only. An outer loop that prices `act({ name: 'trade' })` from `row.posted` can debit/credit the **wrong** UU vs the pane and `tryTrade`.

---

## 2. `postedPrice` (table only — keep)

| Surface | Today | Cite |
|---|---|---|
| Helper | `postedPrice(ctx, key)` | `agent-observe.js` **242–256** |
| Comment | “Posted table price only. Desk fill may apply hermit/epic/rank modifiers” | **243** |
| World table | `Object.hasOwn(prices, key)` then `num(prices[key])` | **244–250** |
| Fallback | `COMMODITIES[key].base` via `hasOwn` | **251–254** |
| Fail | return `0` | **255** |
| Iteration | **does not** `for-in` `world.prices` | **242–256** vs **260** |

`posted` is honest table price (`priceOf` / `world.prices` / base). The comment **does not** expose fill. Comment-exists is **not** CONSUME.

Live `priceOf` (`station.js` **2064–2069**): survivor `0`; data `0`; else `world.prices[key] ?? COMMODITIES[key].base`. Observe `postedPrice` does not call `priceOf`; it copies the same table/base idea with `hasOwn` + `num`.

---

## 3. Desk fill (live — reuse, do not rewrite)

| Surface | Today | Cite |
|---|---|---|
| Helper | nested `tradeFillUnit(key, buying)` | `station.js` **4692–4714** |
| Export | **not exported** | census: nested inside station init |
| Buy | `Math.round(price * epic.buyMult * service.buyMult * hermitBuyMult)` | **4695–4697** |
| Sell | price × epic sell × rank goodwill × service sell × hermit sell × restricted × fixer | **4698–4713** |
| Posted input | `priceOf(ctx, key)` | **4693** |
| Hermit buy | `HERMIT.buyMult` **1.25** when hermit and keeper trust &lt; `KEEPER_COMP_TRUST` | **4688–4690**; `state.js` **621–623** |
| Hermit sell | always `HERMIT.sellMult` **1.25** on hermit docks | **4701** |
| Rank | `1 + 0.02 * tier` when `tier > 0` | **4698–4699** |
| Faction service | `currentService` from `FACTION_SERVICES` on generated docks | **4472**, **4696**, **4700** |
| Pane BUY/SELL | `tradeFillUnit(key, true/false)` cells | **4842–4847** |
| Subhead | `MARKET — buy and sell fill units` | **4830** |
| Row keys | `COMMODITY_KEYS = Object.keys(COMMODITIES)` | **4558**, **4839** |
| TRADE cell | sixth column (offset **5**) | **4838**, **4849–4856** |

**Reuse:** later observe fill **must** match these integers. Do **not** retune multipliers. Do **not** change pane copy. Do **not** move the helper body out of `station.js`.

---

## 4. `trade` act already uses fill (do not rewrite)

| Surface | Today | Cite |
|---|---|---|
| Schema name | `'trade'` live | `agent-schema.js` **29**, **55** |
| Dispatch | `desk.trade({ commodity, qty, side })` | `agent-api.js` **369–382** |
| Commodity | string + `Object.hasOwn(COMMODITIES, commodity)` else `bad-commodity` | **374–378** |
| Qty | integer 1..min(99, capacity) else `bad-qty` | `tradeQty` **197–204**; **376**, **380** |
| Side | `'buy'` \| `'sell'` else `bad-qty` | **381** |
| Desk need | `service === 'market'` | `DESK_NEED.trade` **34**; `refuseDesk` **370–371** |
| Desk sink | `trade(spec)` → `tryTrade(commodity, qty, side === 'buy')` | `station.js` **6390–6397** |
| Buy debit | `unit = tradeFillUnit(key, true)`; `cost = unit * qty` | **4736–4740** |
| Sell credit | `unit = tradeFillUnit(key, false)`; `payout = unit * qty` | **4745–4754** |
| People / data | refuse survivor and data lots | **4722–4728** |
| Result | `afterDesk` maps notice → `uu` / `hold` / `notice` | `agent-api.js` **166–187** |

**Hole is observe, not the desk.** `trade` already charges fill. An agent that trusts JSON `posted` still mis-budgets. Do **not** change `tryTrade` as this leftover.

---

## 5. Boot-test TRADE offset (cite only — do not retune)

| Surface | Today | Cite |
|---|---|---|
| Six-column table | name, status, BUY, SELL, HOLD, TRADE | `boot-test.mjs` **2807–2811** |
| BUY fill cell | offset **2** | **2810** |
| TRADE buttons | offset **5** (not HOLD at 4) | **2811** |
| Hermit pin | Vigil buy = posted × epic × `HERMIT.buyMult` | **2838–2843** |
| Agent trade refuse | qty 0 → `bad-qty`; credits 0 → refuse, cargo unchanged | **24380–24404** |

Wishlist **286–288** DONE: pane fill shares `tradeFillUnit`; TRADE offset is **5**. This leftover **must not** move TRADE to HOLD or retune offset **5**. Sibling **Market desk layout** owns overflow at 560 px (wishlist **318+**). Do not steal it.

---

## 6. Authored commodities / persist (cite only)

| Surface | Today | Cite |
|---|---|---|
| Keys | 11 authored: provisions … wakeglass | `state.js` **350–364** |
| Survivor / data | **not** in `COMMODITIES` | **350–364**; `isMarketCommodity` `station.js` **1043–1045** |
| Persist prices | `WORLD_FIELDS` includes `'prices'` | `save.js` **86** |
| Rebind | `ctx.world.prices` to system table | `save.js` **1071–1083** |
| Observe | **must not** add WORLD_FIELDS | honor |

`marketBlock` already iterates **authored** `COMMODITIES` keys, not `world.prices`. Keep that. Later fill must **not** `for-in` the save table.

---

## 7. Honor surfaces (cite only — do not steal)

| Surface | Today | This leftover |
|---|---|---|
| Observe shape note | `posted` table; fill may apply modifiers | honor; **do not edit** | `docs/AgentApiDesign.md` **337** |
| Digit 1 | `DOCK_KEY_SERVICES[0] === 'market'` | **no new Digit** | `station.js` **189** |
| Pane paint | `h()` `textContent` | **no `innerHTML`** | `station.js` **4544–4547**, **4844–4848** |
| Overlay pause | never write `flags.paused` | cite CTL-02 | honor |
| Badge / Manifest | top-right overlap INBOX | sibling Wave 139 | wishlist **313–317** |
| TRADE overflow | P3 MARKET/UI | sibling Wave 139 | wishlist **318+** |
| Evade | Wave 138 afterburner live | **do not reopen** | `docs/AgentApiEvadeDesign.md` |

---

## 8. What would have been CONSUME

CONSUME + serial **none** only if **all** were live:

1. Observe market rows include fill buy **and** fill sell, **and**
2. Those integers match `tradeFillUnit(key, true/false)` (pane + `tryTrade`), **and**
3. Agents cannot be misled by posted-only JSON (posted may remain if fill is also present, or both documented on the row).

Census:

- (1) **not live** — rows are `posted` only (`agent-observe.js` **267–273**).
- (2) **desk live, observe not** — `tryTrade` / pane use `tradeFillUnit` (**4736**, **4745**, **4842–4843**).
- (3) **fail** — hardening pins `posted === 100` and no fill field (**318–325**). Comment at **243** is documentation, not JSON fill.

Do **not** CONSUME on pane fill. Do **not** CONSUME on `trade` using fill. Do **not** CONSUME on the `postedPrice` comment. Do **not** CONSUME on AgentApiDesign **337**.

---

## 9. Leftover verdict

**REAL.** Named later serial **PR1** (observe market fill buy/sell matching `tradeFillUnit`; keep `posted`). Not CONSUME. Serial is **not** none.

Deputize the **smaller** freeze: observe (+ schema/boot pin if needed) + a **read-only** hook onto live `tradeFillUnit` **without moving it**. Do **not** rewrite `tryTrade`. Do **not** sample fill by executing a trade. Do **not** claim pane layout.
