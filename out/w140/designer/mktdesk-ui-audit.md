# CLEAN

## UI Audit: Mkt01 MARKET desk layout (Wave 140 PR1)

**Reviewer:** parent `[designer]` pass  
**Scope:** `.market-actions` wrap in `src/ui/screens.css`; `renderMarket` subtitle, skip, name fallback, per-row try/catch in `src/systems/station.js`. Merge law `out/w139/mktdesk/shared-contract.md`. Design `docs/Mkt01DeskLayoutDesign.md`. Worker context `out/w140/mktdesk/ui-audit.md` (cite only). **No product edit. No Vite/Chrome.**  
**Graph:** `proceed_unmodeled` (`r-mtbm877l-12d8f25c`). Mandatory false.

### Summary

PR1 lands wrap on `.market-actions`, player-word subtitle `MARKET — buy price and sell price`, fail-closed skip, and `textContent` paint. TRADE min track, panel `560px`, Digit 1, and Q/W/A/S stay. Color is not the only cue. No Blocker. No Major.

### Wave 140 constraint check

| Constraint | Freeze | Live after PR1 | Status |
|---|---|---|---|
| Layout law = wrap only | `flex-wrap: wrap` on `.market-actions`; keep `display: flex` and `gap: 6px` | `screens.css:215-219` | Honored. |
| Do not raise TRADE min | keep `minmax(10em, 1.7fr)` | `screens.css:181` | Honored. |
| Panel min 560 px | keep `.screen-panel` `min-width: 560px`; no `overflow-x` as the only fit | `screens.css:26-31` `overflow-y: auto` only | Honored. |
| Subtitle player words | `'MARKET — buy price and sell price'` via `h()` `textContent`; no “fill units” | `station.js:4831`; `h()` `4544-4548` | Honored. |
| Q/W/A/S stay | buy 1 / buy 5 / sell 1 / sell 5; legend under the table; no hotkeys in TRADE head | legend `station.js:4868`; keys `6306-6310`; TRADE head `4839` | Honored. |
| Digit 1 Market | `DOCK_KEY_SERVICES[0] === 'market'`; no new Digit | `station.js:189`; menu `6134-6136` | Honored. |
| Fail-closed skip | unknown key skip; missing name → key; never throw | `hasOwn` skip `4841-4843`; name `4849`; row `catch` `4864-4866`; pane `catch` `4882` | Honored. |
| Illegal rows visible | `'trade refused'` when locker closed | `4856-4857` | Honored. |
| `tradeFillUnit` math | unchanged; BUY/SELL still `n UU` | helper `4692-4714`; cells `4846-4853` | Honored (cite). |
| `textContent` / no `innerHTML` | `h()` only | `4544-4548`; no `innerHTML` / `insertAdjacentHTML` in `station.js` | Honored. |
| Color not only cue | BUY/SELL words + `n UU` + `+1`/`+5`/`−1`/`−5` + legend; RESTRICTED / trade refused words | heads `4834-4839`; fills `4852-4853`; buttons `4859-4862`; illegal `4851`; refusal `4857` | Honored. |
| Focus rings | `.screen-btn:focus-visible` stays; real `<button>` via `btn()` | `screens.css:88-99`; `btn()` `4551-4556` | Honored. |
| `reducedMotion` | no new animation | wrap is static CSS; no `@keyframes` / `prefers-reduced-motion` in `screens.css` | Honored. |
| Observe JSON | do not steal Agent fill | `renderMarket` does not touch `agent-observe.js` | Honored. |
| Partial merge | wrap + subtitle + skip + `textContent` + Q/W/A/S together | all live in this PR | Honored. |

### What's done well

- Wrap is the one layout law. Four TRADE hits can stack inside the live `10em` track instead of clip (`screens.css:215-219`, `181`).
- Panel floor stays `560px`. Overflow stays Y only (`screens.css:28-31`). The pack does not steal other station panes.
- Subtitle uses player words on the same `.screen-sub` channel (`station.js:4831`; `screens.css:45-51`). CSS uppercase / 0.22em tracking is unchanged.
- Copy uses `textContent` (`station.js:4544-4548`). Commodity name, UU, HOLD, refusal, and subtitle do not go through HTML parse.
- TRADE controls stay real `<button type="button">` (`4551-4556`, `4859-4862`). Hover and a 2 px accent `outline` stay (`screens.css:88-99`).
- Legend stays under the table (`station.js:4868`). TRADE head is the word TRADE (`4839`).
- Restricted rows stay. Closed locker paints `trade refused` (`4856-4857`). Status still says `RESTRICTED` in words (`4851`).
- BUY and SELL still print `n UU` under named heads (`4852-4853`). Color is extra, not the cue.
- Fail-closed: skip unknown / non-object keys (`4841-4843`); missing name paints the key (`4849`); a throw on one row does not blank the desk (`4864-4866`, `4882`).
- Digit 1 stays Market (`189`, `6134-6136`). Notice uses `aria-live="polite"` (`6165-6167`).
- Head accent uses `--rw-accent` (`screens.css:186-188`). Colorblind tokens retint overlay `--rw-*` (`565-569`). Fill values use body color, not a red/green-only pair (`194-201`).
- CPU: wrap is CSS. No resize observer. Dock rebuild path is unchanged.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Wrap can stack TRADE on two rows

**Location:** `src/ui/screens.css:215-219`; TRADE track `:181`; buttons `src/systems/station.js:4859-4862`; panel overflow `screens.css:28-31`  
**Issue:** Four `+1`/`+5`/`−1`/`−5` hits with `padding: 3px 9px` and `gap: 6px` still exceed ~10em (~140 px). Wrap makes the TRADE cell taller. `.market-table` uses `align-items: center` (`screens.css:183`). Sibling cells do not stretch, so `.market-row-sel` paint can look shorter than the TRADE cell. Panel already scrolls on Y.  
**Suggestion:** Keep wrap. Do not raise TRADE min. Do not add `overflow-x`. Optional still at 560 px.  
**Status:** accepted. Wrap is the layout law.

#### 🟡 Minor: `.screen-sub` tracking still long

**Location:** `src/ui/screens.css:45-51`; subtitle `src/systems/station.js:4831`  
**Issue:** `MARKET — buy price and sell price` is about as long as the old jargon line. Uppercase + `letter-spacing: 0.22em` may wrap the subtitle at the 560 px floor.  
**Suggestion:** Keep player words. Do not restyle every station sub. Do not keep “fill units” to save glyphs.  
**Status:** accepted. Inbox asked for player words.

#### 🟡 Minor: Grid is not a real table

**Location:** `src/systems/station.js:4833-4863`  
**Issue:** Screen readers hear a flat stream of `div` cells. Two UU numbers can sound like one price twice. No `role="table"` / column headers as `th`.  
**Suggestion:** Optional PR3 `role="table"` or a hidden “Buy n UU” prefix via `textContent`. Not required with PR1.  
**Status:** documented. Contract §0.1 table semantics skip.

#### 🟡 Minor: Skip can leave selection on a row with no cells

**Location:** skip `src/systems/station.js:4840-4843`, `4864-4866`; select `sel` `:4845`; ArrowUp/Down `:6304-6305`; Q/W/A/S `:6306-6309`  
**Issue:** The loop skips unknown or throwing keys but `ui.marketSel` still indexes `COMMODITY_KEYS`. Arrow keys can land on a skipped index. No cell gets `market-row-sel`. Q still calls `tryTrade` on that key. Authored `Object.keys(COMMODITIES)` rows should not skip.  
**Suggestion:** Keep skip. Do not densify visual indices in this PR (that can desync `tryTrade`). Fail-closed overlay stays.  
**Status:** accepted. Honor: skip, never throw.

#### 💡 Suggestion: Optional PR2 still (skip)

**Location:** acceptance `docs/Mkt01DeskLayoutDesign.md` player outcome; contract §3 PR2  
**Issue:** This pass is static. It does not dock Digit 1 at 560 px in a browser.  
**Suggestion:** One still: TRADE hits wrap or fit; subtitle reads BUY PRICE AND SELL PRICE; Q buys 1; closed locker still shows trade refused.  
**Status:** optional. Not required with PR1.

#### 💡 Suggestion: Do not add hover motion

**Location:** wrap `src/ui/screens.css:215-219`; focus/hover `:88-99`  
**Issue:** Live hover only changes border, color, and background. Wrap is static.  
**Suggestion:** Do not add button motion that ignores `reducedMotion`.  
**Status:** no action in PR1.

### Honor residuals (not new holes)

- TRADE hit padding `3px 9px` (`screens.css:221-225`) is small vs 44 px AAA. Labels and keyboard still work. Do not grow padding as a second layout law.
- `.market-illegal` / `.market-refusal` use hardcoded `#e06a5a` (`screens.css:209-213`, `227-230`). Words RESTRICTED / trade refused stay. Colorblind tokens do not retint that red. Pre-existing. Not this write-set.
- Full overlay rebuild (`station.js:6119`) drops focus after a TRADE click. Pre-existing. Wrap does not add it.

### Re-review

After wrap + subtitle + skip: no new Blocker/Major. Stack, tracking, table semantics, and skip/selection mismatch stay Minor.

### Verdict

CLEAN
