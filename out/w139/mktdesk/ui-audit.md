# UI Audit: Mkt01 MARKET desk layout leftover integrator

### Summary

No product UI ships in Wave 139. Audit is of the live MARKET pane and later wrap + player-word subtitle. Blocker/Major UI holes in **live** play (TRADE clip at 560 px; subtitle “fill units”) are accepted as leftover **REAL** and frozen as PR1 wrap + `'MARKET — buy price and sell price'`. Color-only BUY/SELL, hotkeys-in-head, panel-min drop, observe JSON, and `innerHTML` names are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Live BUY and SELL already show qty-1 UU from the same helper as `+1`/`−1` (`station.js` **4842–4847**, **4736**, **4745**). Inbox honesty of two fills stays.
- Copy already goes through `h()` `textContent` (**4544–4548**, **4830–4847**). No `innerHTML` in this pane.
- TRADE head is the word TRADE. Hotkeys sit in `.screen-legend` (**4838**, **4859**). Keyboard Q/W/A/S already work (**6296–6300**).
- Restricted rows still show `trade refused` instead of dead/hidden buttons (**4850–4851**).
- Head color uses `--rw-accent`; colorblind tokens retint overlay `--rw-*` (`screens.css` **186–188**, **565–568**). Fill values use body color, not a red/green-only spread (**194–201**).
- `.screen-btn:focus-visible` already has a 2 px accent outline (`screens.css` **96–99**). TRADE uses real `<button>` via `btn()`.
- Digit 1 stays Market. HUD-01 hub stays empty. No new Digit.
- `reducedMotion`: no market animation live; PR1 wrap is static CSS.

### Findings

#### 🔴 Blocker: TRADE overflow at 560 px — **resolved as later mint**

**Location:** live `.market-actions` `screens.css` **215–218**; TRADE `minmax(10em, 1.7fr)` **181**; panel **28–31**; buttons `station.js` **4853–4856**  
**Issue:** Four `+1`/`+5`/`−1`/`−5` buttons with `padding: 3px 9px` and `gap: 6px` exceed 10em (~140 px). Flex does not wrap. Panel `overflow-y` only. Mouse hits clip at the live minimum.  
**Fix:** PR1 `flex-wrap: wrap` on `.market-actions`. Do not raise TRADE min as a second law. Do not drop panel `min-width`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Subtitle helper jargon — **resolved as later mint**

**Location:** `station.js` **4830**; `.screen-sub` uppercase + `letter-spacing: 0.22em` `screens.css` **45–51**  
**Issue:** `MARKET — buy and sell fill units` is honest to the helper and opaque to the player. BUY/SELL heads already name the columns.  
**Fix:** PR1 `'MARKET — buy price and sell price'`. Keep `.screen-sub` channel. Do not name `tradeFillUnit` on the pane.

#### 🟠 Major: Color-only BUY vs SELL — **resolved in freeze**

**Location:** honor a11y; Fable optional tint `out/orch-fable/t3/ui-audit.md` **32–36**  
**Issue:** Tinting fills without words would fail color-not-only. Live cells already say `n UU` under BUY/SELL heads.  
**Fix:** PR1 keeps words. Optional token tint is PR3 skip, not raw red/green. Colorblind tokens already swap `--rw-warm` / `--rw-good`.

#### 🟠 Major: Hotkeys in TRADE head / new Digit / pause chrome — **resolved in freeze**

**Location:** legend **4859**; Digit 1 **189**  
**Issue:** Stuffing `Q/W/A/S` into the TRADE head wraps the head in the last track. A new Digit or pause overlay would steal dock map / CTL-02.  
**Fix:** keep legend under the table. Keep Q/W/A/S. Digit 0/8/9 stay. Digit 1 stays Market. Do not pause.

#### 🟠 Major: Hide restricted / shrink fills to “fit” — **resolved in freeze**

**Location:** **4850–4851**; `.market-fill` nowrap **199–201**  
**Issue:** Dropping illegal rows or wrapping `184 UU` mid-number would steal locker honesty and scan.  
**Fix:** wrap **buttons**, not fills. Restricted stays.

### 🟡 Minor: Grid is not a real table

**Location:** `station.js` **4832–4848**  
**Issue:** Screen readers hear a flat stream of cells; two UU numbers can sound like one price twice.  
**Justification:** Pattern predates this leftover. Optional PR3 `role="table"` or hidden “Buy n UU” prefix via `textContent`. Not required with PR1.

### 🟡 Minor: `.screen-sub` tracking still long

**Location:** `screens.css` **45–51**  
**Issue:** Player-word subtitle is ~same character count as the jargon line. Uppercase + 0.22em may still wrap.  
**Justification:** Inbox asked for player words, not a shorter tracking token. Do not restyle all station subs. Do not keep “fill units” to save glyphs.

### 🟡 Minor: Wrap may stack TRADE on two rows

**Location:** later `.market-actions` wrap  
**Issue:** Hit row gets taller; selected-row inset still wraps the cell.  
**Justification:** Honest fit. Panel already scrolls vertically. Better than clip.

### 💡 Suggestion: Optional PR2 still

One still: dock a Freehold (or any) station, Digit 1 Market, panel width 560 px, TRADE buttons visible/wrappable, subtitle buy price and sell price, Q buys 1, S sells 5, closed locker still shows trade refused, hub empty, no pause.

### 💡 Suggestion: Do not add hover animation

Wrap is enough. Do not add button motion that ignores `reducedMotion`.

### Verdict

No 🔴/🟠 remain **in the freeze**. Live overflow + jargon stay until PR1. Color, table semantics, and unused `market-head-actions` stay optional.
