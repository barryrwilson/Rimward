# Mkt01 MARKET desk layout inventory

**Wave:** 139 leftover census. Markdown only. No `src/` writes.  
**Code wins.** Cites are live file:line at census time (2026-08-27).  
**Leftover:** **REAL.** Named serial **PR1**. Not CONSUME. Named serial is **not** none.  
**Name:** TRADE actions fit at the live 560 px panel minimum, and the MARKET subtitle uses player words (buy price / sell price), not helper jargon (“fill units”).  
**Not this leftover:** Agent market-fill observe JSON. Agent badge layout. Pad 2B. In-repo LLM. Price / `tradeFillUnit` math. Illegal-row hide. Digit remap. CTL-04 `fireHeld`. HUD-01 hub.

Inbox sources (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Playtest capture 2026-08-27 Claude Fable — **318–323** — cite, do not edit): Six-column market TRADE buttons can overflow at the 560 px panel minimum. Wrap `.market-actions` or raise the TRADE min track. Keep Q/W/A/S. Subtitle `MARKET — buy and sell fill units` is honest but uses helper jargon. Prefer player words such as buy price and sell price. Cite `out/orch-fable/t3/ui-audit.md` as evidence, not live truth.

Fable UI audit (`out/orch-fable/t3/ui-audit.md` **20–30**): TRADE track can overflow at panel min-width; subtitle uses designer jargon. **Code wins** over that report.

---

## 1. MARKET pane paint (subtitle, grid, cells, Q/W/A/S)

| Surface | Today | Cite |
|---|---|---|
| Subtitle | `'MARKET — buy and sell fill units'` | `station.js` **4830** |
| Seed papers (Beautiful) | `renderSeedPapers` before the table | **4831**, **4795–4826** |
| Table host | `div.market-table` (not `<table>`) | **4832** |
| Heads | COMMODITY / STATUS / BUY / SELL / HOLD / TRADE | **4833–4838** |
| TRADE head class | `market-head market-head-actions` (no CSS rule) | **4838**; `screens.css` census |
| Row keys | `COMMODITY_KEYS = Object.keys(COMMODITIES)` | **4558**, **4839** |
| Name cell | `com.name` via `h()` `textContent` | **4844** |
| Status | `'Legal'` / `'RESTRICTED'` | **4845** |
| BUY fill | `` `${buyUnit} UU` `` from `tradeFillUnit(key, true)` | **4842**, **4846** |
| SELL fill | `` `${sellUnit} UU` `` from `tradeFillUnit(key, false)` | **4843**, **4847** |
| HOLD | `String(holdUnits(ctx, key))` | **4848**; helper **1029–1032** |
| TRADE legal | four `btn`: `+1` `+5` `−1` `−5` | **4853–4856** |
| TRADE illegal closed | `'trade refused'` span, **not** hidden row | **4850–4851** |
| Legend | `'↑/↓ select · Q/W buy 1/5 · A/S sell 1/5'` | **4859** |
| `h()` | `textContent` only; **no** `innerHTML` in `station.js` | **4544–4548**; grep `innerHTML` empty |
| `btn()` | `h('button', …)` + click | **4551–4555** |
| Digit 1 Market | `DOCK_KEY_SERVICES[0] === 'market'`; hot `i + 1` | **189**, **6123–6126** |
| Level-2 Digit 2–9/0 | still pick dock services while on market | **6302–6313** |
| Digit 1 on market | seed papers when visible, else unused for trade | **6289–6292** |
| Arrow select | wrap `ui.marketSel` on `COMMODITY_KEYS.length` | **6294–6295** |
| Q/W/A/S | qty 1/5; Q/W buy; A/S sell; `tryTrade` then `render` | **6296–6300** |
| Renderer | `RENDERERS.market = renderMarket`; `RENDERERS[ui.service](panel)` | **6082–6083**, **6151** |
| Panel scroller | `.screen-panel` `overflow-y: auto`; restore `scrollTop` | **6101–6109**, **6159**; CSS **31** |
| Archive desk | `renderArchiveDesk` after notes | **4872** |

**Subtitle still uses helper jargon.** Player words “buy price” / “sell price” are **not** live.

`h()` `textContent` is already live. Later PR1 must **keep** it.

---

## 2. Six-column grid and TRADE overflow (primary layout hole)

| Surface | Today | Cite |
|---|---|---|
| Panel min | `min-width: 560px`; padding `18px 22px 16px` | `screens.css` **27–32** |
| Panel overflow | `overflow-y: auto` only (no `overflow-x`) | **31** |
| Grid | six tracks: name / status / buy / sell / hold / trade | **178–181** |
| Template | `minmax(6.5em, 1.3fr) minmax(5em, 0.8fr) minmax(4em, 0.6fr) minmax(4em, 0.6fr) minmax(3em, 0.4fr) minmax(10em, 1.7fr)` | **181** |
| Gap | `4px 10px` | **182** |
| Fill nowrap | `.market-fill { white-space: nowrap }` | **199–201** |
| TRADE actions | `.market-actions { display: flex; gap: 6px; }` — **no** `flex-wrap` | **215–218** |
| TRADE buttons | `width: auto; padding: 3px 9px` | **220–224** |
| Font | panel `font-size: 14px` | **39** |
| Accent heads | `--rw-accent` | **186–188**, **565–568** |
| Colorblind tokens | `body.rw-colorblind .screen-overlay` remaps `--rw-*` | **565–568** |
| `reducedMotion` | **no** market animation; **no** `@media (prefers-reduced-motion)` in this file | census |

**Fit math at the live 560 px minimum (code wins):**

- Content box ≈ `560 − 22 − 22 = 516` px.
- Column **min** sum at 14 px em: `6.5+5+4+4+3+10 = 32.5em = 455` px + five `10` px column gaps = **505** px. The six **min** tracks fit the content box by ~11 px.
- Last track min = `10em` = **140** px.
- Four TRADE buttons, `padding: 3px 9px`, `gap: 6px`, labels `+1` / `+5` / `−1` / `−5`, `flex` **no wrap**: ~170–180 px (Fable **20–24**). That is **wider than 140 px**.
- `.market-fill` nowrap stops BUY/SELL from shrinking to feed TRADE.
- The panel does not grow (`min-width` is the floor) and does not set `overflow-x`. Mouse TRADE hits clip or spill. Keyboard Q/W/A/S still work (**4859**, **6296–6300**).

**TRADE does not wrap. TRADE does not fit at the live panel minimum.** Raising the TRADE min track without growing the panel would **increase** the six-min sum and still overflow. Wrap is the smaller fit.

---

## 3. `tradeFillUnit` / `tryTrade` (cite only — do not retune)

| Surface | Today | Cite |
|---|---|---|
| Helper | qty-1 fill UU; buy vs sell | `station.js` **4691–4714** |
| Buy | `price * epic buyMult * service buyMult * hermitBuyMult`, `Math.round` | **4695–4696** |
| Sell | price × epic/tier/service/hermit; restricted fixer markup | **4698–4713** |
| Pane uses same helper | BUY/SELL cells | **4842–4847** |
| Trade uses same helper | `tryTrade` buy **4736**, sell **4745** | **4721–4766** |
| Data skip | notice; no people trade | **4722–4728** |
| Illegal closed | notice; **does not hide** the row | **4730–4733**; paint **4850–4851** |
| `priceOf` | market key → `world.prices[key] ?? COMMODITIES[key].base` | **2064–2068** |
| `isMarketCommodity` | `Object.hasOwn(COMMODITIES, key)` | **1043–1045** |
| Authored keys | 11: provisions … wakeglass | `state.js` **350–364** |

Inbox Agent fill-JSON is a **sibling** Wave 139 pack. This leftover does **not** claim `agent-observe.js` `marketBlock` (**258–275**, still `posted` not fill).

---

## 4. Fail-closed paint (live hole, freeze later)

| Surface | Today | Throw? | Cite |
|---|---|---|---|
| Name | `COMMODITIES[key]` then `com.name` | missing `com` → TypeError | **4840**, **4844** |
| `tradeFillUnit` | `priceOf` then `Math.round` | missing `world.prices` object can throw | **4692–4693**, **2068** |
| `RENDERERS[ui.service](panel)` | no try/catch | throw blanks overlay (`overlay.textContent = ''` already ran) | **6109**, **6151** |
| Unknown key skip | **none** in `forEach` | — | **4839–4857** |
| Missing name → key text | **no**; uses `com.name` | — | **4844** |

`h()` itself is safe (`textContent`). The loop is not fail-closed.

---

## 5. Honor / neighbours (cite only — do not steal)

| Surface | Today | Mkt01 claim |
|---|---|---|
| Digit 0/8/9 | dock services; Digit 0 = last (`shipyard`) | **keep**; no new Digit | **189**, **6258–6265**, **6302–6313** |
| KeyH/J/L/M/P | not remapped in `station.js` | **keep** | census empty in `station.js` |
| KeyD strafe | flight `controls.js` | **keep** | `controls.js` TRACKED **50** |
| Flight KeyQ/W/A/S | roll / move while undocked | dock overlay **already** eats Q/W/A/S for trade; **keep** that market bind | `controls.js` **50–51**; `station.js` **6296–6300** |
| CTL-02 pause | overlay **never** writes `flags.paused` | **cite only** | `overlay-policy.js` **4**, **196** |
| CTL-04 `fireHeld` | **not** in `station.js` | **cite only**; do not steal PR2 | grep empty |
| HUD-01 hub | 80 px empty | **do not** add market chrome | honor |
| Agent observe market | `{ rows: { commodity, name, posted, hold, legal } }` | **do not claim** | `agent-observe.js` **258–275**, **481** |
| Agent API | not this leftover | **do not claim** `agent-api.js` | honor |
| `state.js` | `COMMODITIES` authored | **READ-ONLY**; no price retune | **350–364** |

---

## 6. What would have been CONSUME

CONSUME + serial **none** + name **no remaining Mkt01 desk-layout leftover** only if **both** were live:

1. TRADE buttons already wrap **or** otherwise fit at the live 560 px panel minimum, **and**
2. Subtitle already uses player words (buy price / sell price), **not** “fill units”.

Census: (1) **is not live** (`.market-actions` flex, no wrap; TRADE min `10em` < four-button row). (2) **is not live** (subtitle **4830** is `'MARKET — buy and sell fill units'`).

Do **not** CONSUME on Q/W/A/S working. Do **not** CONSUME on BUY/SELL cells already showing UU. Do **not** CONSUME on Fable “no blocker/major” — those leftover minors **are** this pack.

---

## 7. Leftover verdict

**REAL.** Named later serial **PR1** (wrap `.market-actions`; subtitle `MARKET — buy price and sell price`; fail-closed skip; keep Q/W/A/S). Not CONSUME. Serial is **not** none.

Deputize the **smaller** layout law: **wrap** `.market-actions`. Do **not** raise the TRADE min track as a competing law. Do **not** drop `.screen-panel` `min-width`. Do **not** retune `tradeFillUnit`. Do **not** hide illegal rows. Do **not** steal Agent fill JSON.
