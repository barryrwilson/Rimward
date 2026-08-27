# Mkt01 MARKET desk layout shared contract

**Wave:** 139. Design only. No desk-layout ships in this wave.  
**Status:** MERGE LAW for `docs/Mkt01DeskLayoutDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (TRADE wrap + player-word subtitle).  
**Name:** at the live 560 px station panel minimum, MARKET TRADE `+1` / `+5` / `−1` / `−5` stay in the hit row (wrap), and the subtitle uses player words **buy price** and **sell price**, not helper jargon **fill units**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/ExpDataTradeDesign.md`, `docs/AgentApiDesign.md`, `docs/Ctl*.md`, `docs/Hud0*.md`, `docs/OwnerDecisions*.md`. Do not steal sibling Wave 139 packs (Agent market fill, Agent badge layout). Do not steal Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04 / pad 2B / in-repo LLM. Do not write `out/w139/mktdesk/verify/**`.

**Locked sources:** wishlist INBOX (P3, MARKET/UI) lines **318–323** (cite, do not edit); live inventory `out/w139/mktdesk/current-market-desk-layout-inventory.md` (code wins); Fable `out/orch-fable/t3/ui-audit.md` (evidence, not live truth); Wave 118 CTL-02 mutex + **never write `flags.paused`** (cite only).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over Fable “~170–180 px”: measure against live `.market-actions` + `minmax(10em, 1.7fr)` + `.screen-panel` `min-width: 560px`.

**This leftover is MARKET desk layout.** It is **not** Agent observe fill JSON. It is **not** Agent badge offset. It is **not** price retune. It is **not** locker / illegal hide.

**Live hole:** subtitle is `'MARKET — buy and sell fill units'` (`station.js` **4830**). `.market-actions` is `display: flex; gap: 6px` with **no wrap** (`screens.css` **215–218**). TRADE min track is `minmax(10em, 1.7fr)` (**181**). Four TRADE buttons do not fit 10em at the 560 px panel. Q/W/A/S already work (`station.js` **4859**, **6296–6300**). **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **Do not** steal Digit 0/8/9. Digit **1** stays Market (`DOCK_KEY_SERVICES[0]`, `station.js` **189**). **No new Digit.**
3. KeyH stays hail. KeyJ stays dock/jump. KeyL stays berth. KeyM stays chart. KeyP stays pause. KeyD stays strafe. Market Q/W/A/S stay buy 1 / buy 5 / sell 1 / sell 5 while the MARKET pane is open. **Do not remap those keys.** Flight KeyQ roll / KeyW/A/S move stay for undocked flight.
4. `innerHTML` forbidden later. MARKET pane stays `h()` `textContent` (`station.js` **4544–4548**, **4830–4859**). **No** `insertAdjacentHTML` / `document.write`. Commodity names, fills, HOLD, refusal, subtitle: `textContent` only.
5. `src/game/state.js` is READ-ONLY. Persist: **none** new. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** retune book prices, `PRICE_BAND`, epic multipliers, hermit multipliers, fixer markup, or `tradeFillUnit` math.
6. Overlay mutex stays CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. Mkt01 **cites** overlay-policy only. Do **not** claim `overlay-policy.js`. CTL-03/04 not this pack. CTL-04 menu digits **cite only** — do **not** steal PR2 `fireHeld`.
7. Illegal / restricted rows stay visible. Closed locker still paints `'trade refused'` (`station.js` **4850–4851**). Do **not** hide illegal rows. Do **not** drop `'RESTRICTED'` status.
8. Digit mapping for market service stays. Level-1 Digit 1 opens Market. Level-2 Digit 2–9/0 still pick other dock services. Digit 1 on MARKET still arms Beautiful seed papers when that card is visible. Do **not** steal seed papers. Do **not** steal archive desk.
9. Do **not** steal Agent market-fill observe JSON. Do **not** claim `src/game/agent-observe.js`. Do **not** claim `src/systems/agent-api.js`. Live `marketBlock` `posted` field stays until the sibling pack. This leftover does **not** add `buyFill` / `sellFill` / equal to observe.
10. Do **not** steal sibling Wave 139 packs (Agent market fill, Agent badge layout). Do **not** steal optional PR2s listed as Hail01 / HUD-06 / Hail02 / HUD-07 / NAV-09 / NAV-10 governor / TGT-07 stills / MSN-04 other families / CTL-03 / AI-05 / CTL-04, or Agent pad 2B, or in-repo LLM.
11. Fail closed:
    - Never throw from MARKET pane paint (`renderMarket` / its row loop).
    - Unknown commodity key → **skip** that row; do **not** crash the overlay.
    - Missing `COMMODITIES[key].name` → paint the **key** as text, not crash.
    - `tradeFillUnit` / `priceOf` throw on a row → skip that row; do **not** blank the desk.
    - Prototype / reserved keys: skip unless `typeof key === 'string'` and `Object.hasOwn(COMMODITIES, key)` and the record is a non-null object.
    - Never `for-in` a commodity blob onto `world`.
    - Sanitize / persist caps **unchanged**.
12. `reducedMotion`: **no** new animation that ignores it. Color is not the only cue (BUY / SELL **words** + `n UU` text + TRADE labels `+1`/`+5`/`−1`/`−5` + Q/W/A/S legend). Do **not** make BUY vs SELL color-only.
13. Accessibility: TRADE buttons stay real `<button>` via `btn()`. Focus-visible ring on `.screen-btn` stays. Do **not** put hotkeys back in the TRADE column head. Legend stays under the table.
14. CPU: no per-frame extra DOM beyond the live docked 1 s rebuild. Wrap is CSS. Do **not** add a resize observer / animation frame for layout.
15. Prototype-safe: authored `COMMODITIES` keys only for row identity.
16. Do not “fix” known REDMARCH `castMatches` flake.
17. Do not steal sibling Wave 139 packs. Do not edit the wishlist or `PROGRESS.md`. Deputize defaults live in **this** contract.
18. Do **not** pause. Do **not** teleport. Do **not** remap keys. Do **not** change `need`. Digit 1 stays Market.
19. Layout law is **one**: wrap `.market-actions`. Do **not** also raise the TRADE min track as a second required law. Do **not** drop `.screen-panel` `min-width: 560px` as the fix. Do **not** add `overflow-x: auto` as the only “fit”.
20. Subtitle law is **one**: later paint `'MARKET — buy price and sell price'` (player words). Do **not** keep “fill units”. Do **not** name the helper `tradeFillUnit` on the pane.

---

## 0.1 Wave 139 deputize (owner may override after playtest)

Pick a playable **desk layout**. Inventory proves both holes are **live**. Do not park. Do not invent UU / SKU / Digit / persist key / observe fill field.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Panel min | `560px` | `screens.css` **28** |
| TRADE track | `minmax(10em, 1.7fr)` | **181** |
| Actions | `display: flex; gap: 6px` no wrap | **215–218** |
| Buttons | `+1` `+5` `−1` `−5`; padding `3px 9px` | `station.js` **4853–4856**; CSS **220–224** |
| Subtitle | `'MARKET — buy and sell fill units'` | `station.js` **4830** |
| Legend | Q/W buy 1/5 · A/S sell 1/5 | **4859**, **6296–6300** |
| Fill helper | `tradeFillUnit` | **4692–4714**, **4842–4847** |
| `h()` | `textContent` | **4544–4548** |
| Digit 1 | Market | **189**, **6124–6126** |
| Agent market JSON | `posted` not fill | `agent-observe.js` **258–275** — **do not claim** |

Do **not** “fix” the hole by raising panel min-width, by hiding restricted rows, by retuning prices, by `innerHTML` names, or by stuffing Q/W/A/S into the TRADE head.

### Playable policy (smallest additive)

**Name:** wrap the TRADE button row so it fits the live 560 px panel, and replace the subtitle jargon with player words.

| Piece | Freeze |
|---|---|
| **Who** | MARKET pane: `.market-actions` in `screens.css`; subtitle string in `renderMarket`. Not Jobs. Not Agent observe. Not `tryTrade` math. |
| **Layout law (pick one)** | **Wrap** `.market-actions` (`flex-wrap: wrap`; keep `display: flex` and `gap: 6px`). TRADE min track **stays** `minmax(10em, 1.7fr)`. Panel `min-width` **stays** `560px`. |
| **Why wrap, not raise min** | Four buttons already exceed 10em. Raising TRADE min grows the six-column min sum past the 516 px content box and still overflows unless the panel min grows. Wrap keeps the panel floor and Q/W/A/S. |
| **Subtitle** | `'MARKET — buy price and sell price'`. Same `h('div', 'screen-sub', …)` channel. `.screen-sub` uppercase / tracking **unchanged**. |
| **Buttons** | Keep labels `+1` `+5` `−1` `−5`. Keep Q/W/A/S. Keep ArrowUp/Down select. |
| **Fills** | BUY/SELL still `tradeFillUnit` + `` `${n} UU` ``. **Do not** change the helper. `.market-fill` nowrap **stays**. |
| **Illegal rows** | Still paint; still `'trade refused'` when closed. |
| **Heads** | COMMODITY / STATUS / BUY / SELL / HOLD / TRADE. Do not put hotkeys in TRADE head. |
| **Fail-closed** | skip unknown key; missing name → key text; never throw; never innerHTML. |
| **Color** | extra, not the only cue. Optional BUY/SELL tint is **not** PR1. |
| **Table semantics** | real `<table>` / `role="table"` is **not** PR1. |
| **`market-head-actions`** | unused class; **not** required to drop. |
| **Persist** | **none** new. |
| **`reducedMotion`** | no new animation. Wrap is static CSS. |

### Later helper (named only)

No new module. CSS wrap + one subtitle literal + a small skip in the `COMMODITY_KEYS.forEach` body. Do **not** put layout in `agent-api.js`. Do **not** import a new Digit.

Do **not** interpolate save strings into HTML. Names stay `textContent`.

Do **not** dual-stack Agent fill JSON as “desk layout”.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/ui/screens.css` (`.market-actions` wrap only — do not raise TRADE min track; do not drop panel `min-width`; do not restyle HUD).
- **Writer:** `src/systems/station.js` MARKET subtitle string in `renderMarket`, plus fail-closed skip in the commodity row loop. Do **not** retune `tradeFillUnit` / `tryTrade` / Digit map / Q/W/A/S.

**Do not claim:**

- `src/game/state.js` (`COMMODITIES` / prices / `PRICE_BAND`)
- `src/game/save.js`
- `src/game/agent-observe.js` / `src/systems/agent-api.js` / `src/game/agent-schema.js`
- `src/systems/overlay-policy.js`
- `src/systems/hud.js` / HUD CSS
- `src/systems/controls.js` flight binds
- Archive desk / seed papers writers beyond not stealing them
- Sibling Wave 139 Agent fill / Agent badge paths

---

## 2. Partial merge forbidden

PR1 must land **together**: `.market-actions` wrap + subtitle `'MARKET — buy price and sell price'` + fail-closed unknown skip + `textContent` kept + Q/W/A/S kept. Shipping wrap without the subtitle leaves helper jargon. Shipping the subtitle without wrap leaves clipped TRADE hits at 560 px. Shipping either without skip can blank the overlay on a bad row.

Do **not** ship TRADE min-track raise **and** wrap as competing required laws. Wrap is the law. Do **not** ship observe fill JSON. Do **not** ship color-only BUY/SELL.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** desk layout | `.market-actions { flex-wrap: wrap }`; subtitle `MARKET — buy price and sell price`; unknown commodity skip; missing name → key text; never throw; `textContent`; Q/W/A/S kept; Digit map kept; TRADE min track unchanged; panel 560 kept; illegal rows kept; `tradeFillUnit` unchanged | raise TRADE min as a second law; drop panel min-width; `overflow-x` as the only fit; `innerHTML`; price retune; hide restricted; Agent observe fill; Agent badge; HUD-01 pip; new Digit; `flags.paused`; `state.js`; animation that ignores `reducedMotion`; hotkeys in TRADE head |
| **PR2 stills (optional skip)** | playtest still: dock Market at 560 px panel, four TRADE buttons wrap/fit, subtitle reads buy price and sell price, Q buys 1, restricted still visible when closed | required with PR1 |
| **PR3 table semantics / BUY-SELL tint (optional skip)** | owner-asked only: `role="table"` or hidden “Buy n UU” prefix; token tint not raw red/green | required with PR1 |

First remaining serial is **PR1**.
