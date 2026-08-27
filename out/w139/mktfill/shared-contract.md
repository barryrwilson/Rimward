# Agent market fill shared contract

**Wave:** 139. Design only. No observe fill ships in this wave.  
**Status:** MERGE LAW for `docs/AgentApiMarketFillDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (observe market fill buy/sell matching `tradeFillUnit`; keep `posted`).  
**Name:** Agent market fill leftover.  
**One law:** (a) JSON market rows show fill buy/sell that match the desk fill, and still show posted. **Not** (b) desk rewrite / helper move / TRADE offset retune / market layout / badge / evade. Do **not** ship (b) as this leftover.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/AgentApiDesign.md`, `docs/AgentApiEvadeDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/Hail0*.md`, `docs/Hud0*.md`, `docs/Nav*.md`, `docs/Ctl*.md`, `docs/Tgt*.md`, `docs/Msn*.md`, `docs/OwnerDecisions*.md`. Do not steal sibling Wave 139 packs (Agent badge layout, Market desk layout). Do not steal optional PR2s (Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04). Do not steal Agent API PR1–PR6. Do not reopen evade. Do not write `out/w139/mktfill/verify/**`.

**Locked sources:** wishlist INBOX (P2, AGENT API) Playtest capture 2026-08-27 Claude Fable lines **308–312** (cite, do not edit); live inventory `out/w139/mktfill/current-agent-market-fill-inventory.md` (code wins); `docs/AgentApiDesign.md` header/laws as **honor** (do not edit).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over playtest rumor.

**This leftover is observe fill vs posted.** It is **not** a market pane rewrite. It is **not** TRADE overflow. It is **not** badge Manifest overlap. It is **not** pad 2B. It is **not** evade.

**Live hole:** `marketBlock` rows are `posted` only (`agent-observe.js` **267–273**). `trade` / pane already fill at nested `tradeFillUnit` (`station.js` **4692–4714**, **4736**, **4745**, **4842–4843**; `agent-api.js` **369–382**). **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit.
3. Digit 0/8/9 stay. Digit **1** stays market (`DOCK_KEY_SERVICES[0]`, `station.js` **189**). **No new Digit.** KeyH/J/L/M/P stay. KeyD strafe. Do **not** remap keys.
4. `innerHTML` forbidden later. Prototype-safe. Never `for-in` `world.prices` or act payload. Use `Object.hasOwn`. Pane stays `h()` `textContent`. Observe is JSON, not HTML.
5. `src/game/state.js` is READ-ONLY later. No new WORLD_FIELDS. No persist of fill, `optIn`, or god-mode prices. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** retune `HERMIT`, epic, rank, or `COMMODITIES.base`.
6. Owner pick **2A** still stands: pad approach is a v1 **non-goal**. Do **not** land pad-seeker / third helm / warp-to-pad.
7. **No in-repo LLM. Ever.** No `XAI_API_KEY` in the bundle. No page WebSocket.
8. Do not teleport. Do not cheat credits. Do not invent god-mode fill. Do not grant hull, credits, or cargo.
9. `trade` already uses fill. Do **not** rewrite `tryTrade`, `renderMarket`, TRADE offset **5**, locker copy, or Digit map.
10. Do **not** move `tradeFillUnit` out of `station.js`. Prefer **reading** the live helper.
11. Do **not** steal sibling Wave 139 packs (Agent badge layout, Market desk layout / TRADE wrap). Do not reopen evade. Do not edit `docs/AgentApiDesign.md`.
12. CTL-02 never writes `flags.paused`. CTL-03 berthHold: `act` while held still `token: 'held'`.
13. Agent badge stays Wave 134/Fable pin (top-right). Do not cover PWR/range marker. Badge overlap Manifest is a **sibling inbox**.
14. Fail closed:
    - Never throw from observe `marketBlock` / `postedPrice` / fill read.
    - Unknown commodity → **skip** the row. Do not crash.
    - Non-finite fill → **omit** `fillBuy` / `fillSell` (or `0`). Never `NaN`. Never throw. Deputize: **omit**.
    - Missing desk / missing peek hook → omit fill keys; keep `posted`. Never throw.
    - Never `for-in` `world.prices`. Row keys = authored `COMMODITIES` own keys only.
    - Prototype / reserved keys (`__proto__`, `constructor`, `prototype`, …) **drop**. `reservedName` skip.
    - `Object.hasOwn(COMMODITIES, key)` required. Do not copy attacker keys from the price table into rows.
    - `act` never throws (live catch stays). Bad commodity stays `bad-commodity`.
    - `peekFillUnit` is **read-only**. It must **not** call `tryTrade`, debit credits, mutate cargo, or fire milestones. Observe must not invoke `desk.trade` to “sample” a fill.
15. `reducedMotion`: **no** new animation. No market flash.
16. Accessibility: fill is **numbers in JSON** plus live pane text (`${buyUnit} UU`). Color is not the only cue. No new Digit.
17. CPU: one pass over authored commodity keys (today ~11). No per-frame DOM alloc. No second scan of `world.prices`.
18. Prototype-safe: authored commodity keys only. Never merge raw price blobs onto `world`.
19. Do not “fix” known REDMARCH `castMatches` flake.
20. Do not pause. Do not teleport. Do not remap keys.
21. Do not steal Agent API PR1–PR6 handle. Observe `market` stays HUD-visible extract, not `stationDesk` serialize.

---

## 0.1 Wave 139 deputize (owner may override after playtest)

Pick playable **observe fill buy/sell**. Inventory proves the hole is **live**. Do not park. Do not rewrite the desk.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Observe row fill | **not live** (posted only) | `agent-observe.js` **267–273** |
| Posted helper | table / base / 0 | **242–256** |
| Desk fill | nested `tradeFillUnit` | `station.js` **4692–4714** |
| Pane BUY/SELL | fill units | **4842–4847** |
| `trade` act | desk `tryTrade` fill | `agent-api.js` **369–382**; `station.js` **6390–6397** |
| TRADE offset | **5** | `boot-test.mjs` **2809–2811** |
| Hermit buy | **1.25** | `state.js` **622** |
| Digit 1 | market | `station.js` **189** |
| Hardening | `posted === 100`, no fill | `agent-api-hardening-test.mjs` **318–325** |

Do **not** “fix” the hole by changing `tryTrade` to posted. Do **not** drop `posted`. Do **not** wrap TRADE as this pack.

### Playable policy (smallest additive)

**Name:** while docked on Digit 1 market, each observe market row keeps `posted` and adds `fillBuy` / `fillSell` integers that equal `tradeFillUnit(key, true)` / `tradeFillUnit(key, false)` when those values are finite.

| Piece | Freeze |
|---|---|
| **Who** | Observe `marketBlock` only. Human pane unchanged. `trade` act unchanged. |
| **Fields** | Keep `commodity`, `name`, `posted`, `hold`, `legal`. Add `fillBuy` and `fillSell` (integer UU per unit). Not `buy`/`sell` (too easy to confuse with side). |
| **Match** | `fillBuy === tradeFillUnit(key, true)` and `fillSell === tradeFillUnit(key, false)` when finite. |
| **Posted** | **keep**. Table/base via live `postedPrice`. |
| **Gate** | `market` still `null` unless docked and `service === 'market'`. |
| **Keys** | Authored `COMMODITIES` own keys. Skip reserved / unknown. Do not iterate `world.prices`. |
| **Read hook** | Do not duplicate rank/faction/epic/hermit/fixer math in observe. Nested helper stays. Attach `ctx.stationDesk.peekFillUnit(key, buying)` **or** export `tradeFillUnit` **without moving the body**. Peek/export **calls** the live helper. Peek is **read-only** (no `tryTrade`). This is **not** a pane rewrite. Peek only after authored `hasOwn(COMMODITIES)` and not reserved. |
| **Missing hook** | Omit fill keys. Keep posted. Never throw. |
| **Non-finite** | Omit fill keys (deputize). `0` allowed if a pin needs a number; never `NaN`. |
| **Names** | `str(own(com, 'name')) \|\| commodity`. No HTML. |
| **Desk** | `tryTrade` / `renderMarket` / TRADE offset **5** **out**. |
| **Persist** | **none** new. |
| **Fail-closed** | never throw; never innerHTML; unknown skip; proto drop. |

Inbox “or document that `trade` uses fill and show both”: **showing both on the row is required**. A comment-only freeze is **not** enough (agents still trust posted JSON). Owner may override after playtest.

### Later copy (authored)

**None required** on the pane. Subhead already says fill units (`station.js` **4830**). Do **not** dual-stack a toast as the only observe fill. Do **not** ship jargon `AGENT MARKET FILL` on the badge.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/game/agent-observe.js` — `marketBlock` adds `fillBuy` / `fillSell`; keep `posted`; fail-closed skip/omit.
- **Optional same PR1:** `src/game/agent-schema.js` — comment-only observe shape if a market-row note exists. Do **not** add cheat commands.
- **Optional same PR1:** `scripts/agent-api-hardening-test.mjs` and/or `scripts/boot-test.mjs` — pin fill vs posted (hermit or epic dock where fill ≠ posted). Do **not** change TRADE offset **5**. Do **not** drop `posted === 100` on the fake ctx.

**Allowed station read hook (not a desk rewrite):**

- `src/systems/station.js` **only** to attach `peekFillUnit` on the existing `ctx.stationDesk` bag **or** to `export` the live `tradeFillUnit` **without moving its body** and **without** changing `tryTrade` / `renderMarket` / TRADE cells.
- Default deputize: **`peekFillUnit(key, buying)`** on the desk bag, because the helper is nested today (`station.js` **4692**).

**Do not claim:**

- `tryTrade` / `renderMarket` / locker / Digit map / overlay CSS
- `src/game/state.js` `COMMODITIES` / `HERMIT` / rank
- `src/game/save.js` WORLD_FIELDS / price rebind
- `src/game/market.js` walk
- `src/systems/agent-api.js` `trade` dispatch (already fill)
- `src/style.css` badge / `.market-actions` wrap (siblings)
- `src/systems/hud.js` layout
- Evade / pad 2B / overlay-policy

---

## 2. Partial merge forbidden

PR1 must land **together**: observe `fillBuy`/`fillSell` + keep `posted` + numbers match live `tradeFillUnit` + fail-closed omit/skip + never throw. Shipping comments without JSON fill leaves the inbox hole. Shipping duplicated fill math without the helper read **will drift**. Shipping a pane rewrite as “fill” steals the sibling layout pack.

Do **not** ship fill **instead of** posted. Do **not** ship `for-in` prices as rows.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** observe fill | `fillBuy`/`fillSell` on market rows; keep `posted`; peek/export read of live `tradeFillUnit`; fail-closed; optional hardening/boot pin | desk rewrite; helper move; TRADE offset; market wrap; badge; Digit; `innerHTML`; persist; `state.js`; `trade` act rewrite; UU retune; pad 2B; evade |
| **PR2 stills (optional skip)** | playtest: hermit Vigil, observe `fillBuy` ≠ `posted`, `trade` qty 1 buy debits `fillBuy` | required with PR1 |

First remaining serial is **PR1**.

---

## 4. Formulas (later impl; named only — do not implement this wave)

```
marketBlock(ctx, docked, service):
  if !docked or service !== 'market': return null
  rows = []
  for key of Object.keys(COMMODITIES):
    if reservedName(key): continue
    if !Object.hasOwn(COMMODITIES, key): continue
    com = COMMODITIES[key]
    if !com or typeof com !== 'object': continue
    row = {
      commodity: key,
      name: str(own(com, 'name')) || key,
      posted: postedPrice(ctx, key),   // keep
      hold: holdOf(ctx.cargo, key),
      legal: com.legal === true,
    }
    fillB = peekFill(ctx, key, true)
    fillS = peekFill(ctx, key, false)
    if finite integer-or-number fillB: row.fillBuy = fillB
    if finite integer-or-number fillS: row.fillSell = fillS
    rows.push(row)
  return { rows }

peekFill(ctx, key, buying):
  desk = ctx.stationDesk
  if desk and typeof desk.peekFillUnit === 'function':
    try:
      n = desk.peekFillUnit(key, buying)
      if typeof n === 'number' and Number.isFinite(n): return n
    catch: omit
  return omit

postedPrice: unchanged (hasOwn prices / hasOwn COMMODITIES.base / 0)
never for-in world.prices
never throw
trade / tryTrade / renderMarket: unchanged
```

Playtest (docked Digit 1, hermit or epic dock): observe row `fillBuy` equals pane BUY cell and equals credits lost on `act trade` qty 1 buy. `posted` still present. No teleport. No new Digit.

---

## 5. Later tests (named only — do not add this wave)

If a later wave adds tests, defend:

1. Docked + `service === 'market'`: each authored commodity row has `posted` and finite `fillBuy`/`fillSell` when the desk hook works.
2. Fill integers equal live `tradeFillUnit` (or peekFillUnit) for buy and sell.
3. Hermit (or epic) dock: at least one staple has `fillBuy !== posted`.
4. `act trade` qty 1 buy debits `fillBuy`, not `posted`, when they differ.
5. Undocked / non-market: `market === null`.
6. Reserved / unknown commodity: no row; `act` still `bad-commodity`.
7. Non-finite peek result: omit fill keys; observe `ok: true`; no throw.
8. Missing `peekFillUnit`: omit fill; keep posted; no throw.
9. TRADE offset still **5**. BUY cell still offset **2**.
10. No new WORLD_FIELDS. No `innerHTML`. `state.js` untouched.

Do **not** add tests that “fix” REDMARCH `castMatches`.
