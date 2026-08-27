CLEAN

# Designer UI audit — Wave 139 Agent market fill leftover freeze

**Auditor:** `[designer]` (independent of `out/w139/mktfill/ui-audit.md`)
**Review file:** `out/w139/designer/mktfill-ui-audit.md`
**Persona:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`
**Checklist:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`
**Scope:** Freeze only. Wave 139 this pack ships **no** live UI. JSON **is** the agent UI. Human Digit 1 MARKET pane is honor (unchanged).
**Merge law:** `out/w139/mktfill/shared-contract.md` wins over `docs/AgentApiMarketFillDesign.md`.
**Worker self-audit:** `out/w139/mktfill/ui-audit.md` (checked, not rubber-stamped).
**Inventory:** `out/w139/mktfill/current-agent-market-fill-inventory.md` (code wins).
**Live cites:** `src/game/agent-observe.js` `marketBlock` / `postedPrice`; `src/systems/station.js` `tradeFillUnit` / MARKET pane / desk `trade`.
**Method:** Read freeze + live cite targets. No Vite. No Chrome. No stills. [NO BROWSER COVERAGE].
**Product source:** review only. Did not edit `src/`. Did not edit `out/w139/mktfill/**`. Did not edit worker design docs.

## UI Audit: Agent market fill leftover freeze

### Summary

No product chrome ships in this wave. The live agent-play hole is posted-only observe rows versus desk fill units. The freeze names leftover **REAL** / serial **PR1** (`fillBuy` / `fillSell`, keep `posted`), fail-closed omit, no `innerHTML`, no new Digit, no TRADE wrap, empty 80 px hub. That is law (a). Desk rewrite and layout theft are forbidden. No Blocker and no Major remain **in the freeze**. The live posted-only hole stays until a later PR1 (expected).

### What's done well

- Player-facing freeze is audited. Observe JSON is treated as agent UI, not a comment or a lamp.
- Inbox hole matches live code: rows are `{ commodity, name, posted, hold, legal }` (`agent-observe.js` **267–273**). Pane BUY/SELL cells call `tradeFillUnit` (`station.js` **4842–4847**). `tryTrade` debits/credits those units (**4736**, **4745**). Agent `trade` calls `desk.trade` (`agent-api.js` **369–382**; desk bag **6390–6397**, **6434–6441**).
- Field names `fillBuy` / `fillSell` stay distinct from `side` `'buy'|'sell'` (contract §0.1). Inbox “show both” is required. Comment-only is rejected (`postedPrice` comment **243** is not a field).
- Human pane already names fill in text: subhead `MARKET — buy and sell fill units` (`station.js` **4830**) and cells `${buyUnit} UU` / `${sellUnit} UU` (**4846–4847**). Color is not the only cue.
- Pane paint stays `h()` `textContent` (`station.js` **4544–4547**). TRADE buttons are real `<button type="button">` (**4551–4555**, **4853–4856**). No `innerHTML` in `agent-observe.js`, `station.js`, or `agent-api.js` (census grep).
- Digit 1 stays market (`DOCK_KEY_SERVICES[0]` `station.js` **189**). No new Digit. KeyH/J/L/M/P stay. KeyD strafe.
- HUD-01 hub stays 80×80 empty glass (`.rw-reticle` `hud.css` **184–193**). Freeze adds no PRICE pip, no aim-glass gauge.
- TRADE stays sixth column, offset **5** (`station.js` **4838**, **4849–4856**; `boot-test.mjs` **2809–2811**). `.market-actions` wrap at 560 px is sibling Market desk layout. This pack does not claim overlay CSS.
- Badge pin stays Wave 134/Fable top-right. No `AGENT MARKET FILL` jargon. Manifest overlap is sibling inbox.
- Gate: `market` is `null` unless docked and `service === 'market'` (`agent-observe.js` **258–259**, attach **481**). Undocked / other desk is an empty agent state, not a fake table.
- Fail-closed: never throw from observe; unknown commodity skip; non-finite fill **omit** (deputize); missing peek omit fill, keep `posted`; authored `COMMODITIES` keys only; no `for-in` `world.prices`; `peekFillUnit` read-only (never `tryTrade` from observe).
- `reducedMotion`: no new animation. No market flash.
- `state.js` READ-ONLY later. No persist of fill or `optIn`. No god-mode posted mute.

### Honor / freeze gates (later PR1; this wave does not ship UI)

| Check | Result | Cite |
|---|---|---|
| Posted vs fill JSON | **Pass freeze.** Live rows posted-only. PR1 adds `fillBuy`/`fillSell`, keeps `posted`. Not CONSUME. | `agent-observe.js` **267–273**; contract §0.1, §2; inventory §1 |
| Agent can still buy/sell wrong unit | **Pass freeze.** Live hole **REAL**. Desk already fills. Observe is the lie. Later match `tradeFillUnit`. | pane **4842–4847**; `tryTrade` **4736**, **4745**; `trade` **369–382**; inbox **308–312** |
| Fail-closed omit | **Pass freeze.** Non-finite / missing hook omit fill keys; keep posted; never `NaN`; never throw. Deputize omit, not `0`. | contract §0.14, §0.1, §4 formula |
| No `innerHTML` | **Pass freeze + live.** Pane `h()` `textContent`. Names `str(own(com,'name'))`. Toasts stay `textContent`. | `station.js` **4544–4547**, **4844–4848**; contract §0.4 |
| No new Digit | **Pass freeze.** Digit 1 stays market. Digit 0/8/9 stay. | `station.js` **189**; contract §0.3 |
| No TRADE wrap theft | **Pass freeze.** Offset **5** stays. `.market-actions` / 560 px overflow is sibling. | `boot-test.mjs` **2809–2811**; `screens.css` **179–224**; contract §0.9, §0.11 |
| Hub stays empty | **Pass freeze.** No hub child. Credits stay Manifest. | `hud.css` **184–193**; contract §0.2; design non-goals |
| Peek does not sample a trade | **Pass freeze.** `peekFillUnit` read-only. Live desk bag has no peek yet (expected). | contract §0.14 last bullet; `station.js` **6434–6441** |
| Color is not the only cue | **Pass freeze.** JSON numbers + pane `UU` text. No color-only fill vs posted. | `station.js` **4846–4847**; contract §0.16 |
| No new persist / WORLD_FIELDS | **Pass freeze.** | contract §0.5; inventory §6 |

### Copy / JSON map (agent UI + human pane)

| Surface | Live today | Later PR1 (deputize) |
|---|---|---|
| Observe `market` | `{ rows:[{ commodity, name, posted, hold, legal }] }` or `null` (`agent-observe.js` **258–276**, **481**) | same + `fillBuy` / `fillSell` when finite peek |
| `posted` | table/base/`0` (`postedPrice` **242–256**) | **keep** |
| Pane subhead | `MARKET — buy and sell fill units` (`station.js` **4830**) | **unchanged** |
| Pane BUY/SELL | `${buyUnit} UU` / `${sellUnit} UU` (**4846–4847**) | **unchanged**; integers must equal JSON fill |
| TRADE column | offset **5**, six `+1/+5/−1/−5` buttons (**4849–4856**) | **unchanged** |
| Legend | `↑/↓ select · Q/W buy 1/5 · A/S sell 1/5` (**4859**) | **unchanged** |
| Hardening pin | `posted === 100`, no fill (`agent-api-hardening-test.mjs` **318–325**) | keep posted pin; add fill vs posted where fill ≠ posted |
| Badge | Wave 134/Fable Enable / Stop | **unchanged** |
| Hub RANGE | 80 px empty glass | **unchanged** |
| `docs/AgentApiDesign.md` **337** | posted table; fill may apply modifiers | **do not edit** this wave; leftover doc owns fill fields |

### Findings

#### 🔴 Blocker

None open in this freeze.

#### 🔴 Blocker: Agent JSON shows posted while the pane shows fill — **resolved as later observe fields**

**Location:** `src/game/agent-observe.js:267-273`; `src/systems/station.js:4842-4847`; `src/systems/station.js:4736,4745`; wishlist inbox **308–312**
**Issue:** The watch user sees fill BUY/SELL. The outer loop sees `posted` only. An agent that budgets `posted * qty` can debit more UU than planned (hermit buy × **1.25**, `station.js` **4688–4697**, `state.js` **622**) or refuse a sell the pane would pay. Humans and agents do not share a unit. That is an agent-play hole, not a missing lamp.
**Suggestion:** Later PR1: `fillBuy` / `fillSell` integers that match `tradeFillUnit(key, true/false)`; keep `posted`. Do not CONSUME. Do not rewrite `tryTrade` to posted.
**Status:** leftover REAL / named PR1. Live hole remains until PR1 (expected).

#### 🟠 Major

None open in this freeze.

#### 🟠 Major: New Digit / key as the default fix — **resolved in freeze**

**Location:** `src/systems/station.js:189`; `src/systems/controls.js:53,102,302,548`
**Issue:** A sixth Digit or remapped Q/W fights station map and muscle memory. Digit 1 already owns market.
**Suggestion:** Digit 1 stays. Agent uses `observe` + `act({ name: 'trade' })`. No new TRACKED code.
**Status:** freeze honor

#### 🟠 Major: TRADE wrap / 560 px overflow as this leftover — **resolved in freeze**

**Location:** `src/systems/station.js:4849-4856`; `src/ui/screens.css:179-224`; wishlist **318+**
**Issue:** Wrapping TRADE to “make fill obvious” steals sibling Market desk layout. Changing offset **5** breaks boot-test MARKET_CELL_TRADE.
**Suggestion:** This pack does not claim overlay CSS. Offset **5** stays. BUY cell offset **2** stays.
**Status:** freeze honor / sibling inbox

#### 🟠 Major: Badge copy / pin rewrite as this leftover — **resolved in freeze**

**Location:** sibling wishlist **313–317**; contract §0.13
**Issue:** Moving the badge or adding `MARKET FILL` jargon would cover PWR/range or steal Manifest inbox.
**Suggestion:** Pin stays. Enable / Stop labels stay. Fill lives on observe JSON.
**Status:** freeze honor

#### 🟠 Major: Hub PPI / UU pip — **resolved in freeze**

**Location:** `src/ui/hud.css:184-193`
**Issue:** A PRICE hub child would fill the empty glass and steal HUD-06/07.
**Suggestion:** No hub child. Credits stay Manifest. Pane cells stay the human cue.
**Status:** freeze honor

#### 🟠 Major: Color-only “fill vs posted” — **resolved in freeze**

**Location:** `src/systems/station.js:4846-4847`; contract §0.16; `.market-illegal` `screens.css:209-213` (existing restricted cue, not this pack)
**Issue:** A red posted number without a fill field fails the inbox for agents. Color-only also fails a11y.
**Suggestion:** JSON numbers + live pane `UU` text. `innerHTML` forbidden. Do not paint fill vs posted as color only.
**Status:** freeze honor

#### 🟠 Major: Duplicate fill math / observe-side `tryTrade` — **resolved in freeze**

**Location:** nested `tradeFillUnit` `src/systems/station.js:4692-4714`; desk bag **6434-6441** (no `peekFillUnit` today)
**Issue:** Copied hermit/fixer/rank math will drift. Sampling fill via `desk.trade` would debit UU from observe.
**Suggestion:** Attach read-only `peekFillUnit` (or export without moving the body). Never call `tryTrade` from observe.
**Status:** freeze honor

#### 🟡 Minor: Omit fill + keep posted still lets a naive agent use posted

**Location:** contract §0.14, §0.1 “Missing hook → omit fill keys; keep `posted`”; formula `out/w139/mktfill/shared-contract.md:173-180`; hardening stub `scripts/agent-api-hardening-test.mjs:318-325`
**Issue:** Fail-closed omit is correct (never `NaN`, never throw). After omit, `posted` remains the only number. An outer loop that treats missing `fillBuy` as “use posted” still trades the wrong unit on a stub desk, and on a live dock if peek throws.
**Suggestion:** Later PR1 schema/observe note: trade unit is `fillBuy`/`fillSell` when present; if those keys are absent, do **not** budget from `posted`. Hardening may keep `posted === 100` on the fake ctx (contract §1). Do not ship `0` as a silent lie unless a pin requires a number.
**Status:** fail-closed. Live dock with peek is the product path. Not a freeze Blocker.

#### 🟡 Minor: Per-side omit can leave one fill key

**Location:** contract §4 formula `out/w139/mktfill/shared-contract.md:166-169`
**Issue:** `fillBuy` and `fillSell` omit independently. An agent that assumes both keys always arrive together can mis-parse a row.
**Suggestion:** Document per-side omit. Agents must `hasOwn` each field.
**Status:** freeze formula already omits per side. Nice to call out in later schema comment.

#### 🟡 Minor: Manifest still under the badge

**Location:** wishlist **313–317**; contract §0.13
**Issue:** Fill fields do not make overlap worse than posted-only rows.
**Suggestion:** Sibling inbox. Do not move the pin onto PWR.
**Status:** not this leftover

#### 🟡 Minor: Pane subhead already says “fill units”

**Location:** `src/systems/station.js:4830`; contract §0.1 “Later copy: None required on the pane”
**Issue:** Humans are already told. Agents were not. Rewriting the subhead does not fix JSON.
**Suggestion:** Do not rewrite the subhead. JSON fill is the agent cue. Do not dual-stack a toast as the only observe fill.
**Status:** freeze honor

#### 💡 Suggestion: Optional PR2 still (skip unless owner asks)

One still after a later impl wave: `?agent=1` docked Digit 1 Vigil; pane BUY ≠ posted table; observe `fillBuy` matches BUY cell and matches `act trade` qty 1 debit; hub empty; TRADE six-column offset 5; badge top-right; no extra toast slot. Contract already names this as optional skip.

#### 💡 Suggestion: Keep Enable / Stop labels

Do not retitle the badge for market fill.

#### 💡 Suggestion: Do not edit `docs/AgentApiDesign.md` **337** in this pack

Honor forbids that edit. Outer loops that only read that paragraph stay posted-shaped until a later owner wave. Discovery of fill is the observe JSON itself plus this leftover doc.

### Worker self-audit

`out/w139/mktfill/ui-audit.md` CLEAN on freeze (Blocker/Major all **resolved in freeze**, live hole named REAL/PR1) is correct. Parent pass agrees. No extra Blocker or Major.

### Verdict

**CLEAN.** No open Blocker. No open Major. Wave 139 ships no live UI. Later PR1 must still land observe fill that matches the desk, fail-closed omit, no `innerHTML`, no new Digit, no TRADE wrap, empty hub.
