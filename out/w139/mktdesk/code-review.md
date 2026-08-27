# Code Review: Mkt01 MARKET desk layout leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live jargon subtitle (`station.js` **4830**), `.market-actions` flex **no wrap** (`screens.css` **215–218**), and TRADE min `minmax(10em, 1.7fr)` (**181**) at panel `min-width: 560px` (**28**). Contract forbids CONSUME, competing raise-min law, `tradeFillUnit` retune, Agent observe fill, `innerHTML`, illegal-row hide, and pause write. No Blocker/Major remain after wrap-not-raise, player-word subtitle, fail-closed skip, and later write-set limited to `screens.css` wrap + `station.js` subtitle/skip.

### What's done well

- Code-wins inventory with file:line for subtitle, grid template, `.market-actions`, panel min, Q/W/A/S, `h()` `textContent`, `tradeFillUnit`, Digit 1, illegal refusal, observe `posted`.
- CONSUME path documented and rejected: keyboard-works and BUY/SELL UU are not desk layout.
- Fable `out/orch-fable/t3/ui-audit.md` cited as evidence; live CSS/JS win.
- One layout law deputized (wrap) over raise-min / drop panel min / overflow-x.
- Partial merge named: wrap without subtitle leaves jargon.
- Fail-closed skip vs overlay blank named before impl.
- Q/W/A/S and Digit map explicitly kept.
- Sibling Agent fill JSON explicitly unclaimed.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `station.js` **4830** vs `screens.css` **215–218**  
**Issue:** Fills and Q/W/A/S already work. That is not the CONSUME test. Wrap/fit **and** player words are missing. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: TRADE still overflows at 560 px — **resolved in freeze**

**Location:** `.market-actions` **215–218**; TRADE track **181**; buttons `station.js` **4853–4856**  
**Issue:** Four padded buttons in a no-wrap flex exceed 10em at the live panel floor. Frozen: `flex-wrap: wrap`. TRADE min track **unchanged**.

#### 🟠 Major: Competing layout laws — **resolved in freeze**

**Location:** inbox “wrap **or** raise”; contract §0.19  
**Issue:** Doing both as required laws fights. Raise-min grows the six-column min sum past the 516 px content box. Frozen: wrap only. Do not drop `min-width: 560px`. Do not use `overflow-x` as the only fit.

#### 🟠 Major: Jargon subtitle — **resolved in freeze**

**Location:** `station.js` **4830**  
**Issue:** `'MARKET — buy and sell fill units'` names the helper. Frozen: `'MARKET — buy price and sell price'` via `textContent`.

#### 🟠 Major: Partial merge (wrap XOR subtitle) — **resolved in freeze**

**Location:** contract §2  
**Issue:** Wrap without copy leaves jargon. Copy without wrap leaves clipped hits. Frozen: same PR. Skip unknown keys in the same PR so paint cannot blank the desk.

#### 🟠 Major: Observe fill / price retune / hide restricted scope — **resolved in freeze**

**Location:** honor; `agent-observe.js` **258–275**; `tradeFillUnit` **4692–4714**; **4850–4851**  
**Issue:** Easy steal. Frozen: do not claim observe; do not retune fills; do not hide illegal rows.

#### 🟠 Major: Digit / QWAS remap — **resolved in freeze**

**Location:** `station.js` **189**, **6296–6300**  
**Issue:** A new Digit or moving trade off Q/W/A/S would steal dock map and flight keys when undocked. Frozen: keep binds. Digit 1 stays Market.

### 🟡 Minor: `market-head-actions` has no CSS

**Location:** `station.js` **4838**  
**Issue:** Harmless leftover class.  
**Justification:** Optional drop. Not PR1. Do not put hotkeys back in the TRADE head.

### 🟡 Minor: Seed Digit 1 on MARKET

**Location:** `station.js` **6289–6292**  
**Issue:** Digit 1 arms seed papers when visible, so it does not re-select Market.  
**Justification:** Live seed path. Cite only. Do not steal.

### 🟡 Minor: Archive desk on MARKET

**Location:** `station.js` **4872**  
**Issue:** Data lots file at archive, not TRADE.  
**Justification:** Not this leftover. Do not restyle archive as “overflow fix”.

### 💡 Suggestion: Shared wrap comment

Later CSS: one short comment that wrap is the 560 px TRADE law and the min track must not grow. Do not narrate the wave.

### 💡 Suggestion: Optional PR2 still

One still: dock, Digit 1, panel at 560 px, TRADE buttons wrap/fit, subtitle buy price and sell price, Q buys 1, restricted still listed.
