# UI Audit: Agent market fill leftover integrator

### Summary

No product UI ships in Wave 139. Audit is of the **later** freeze: Agent observe JSON market rows plus unchanged human Digit 1 MARKET pane. Blocker/Major UI holes in **live** agent play (posted-only JSON vs fill pane) are accepted as leftover **REAL** and frozen as PR1 `fillBuy` / `fillSell`. Pane wrap, badge move, hub pip, and Digit remap are forbidden. No Blocker/Major remain in the integrator freeze.

### What's done well

- Player-facing freeze is audited (this file is **not** skipped). JSON **is** the agent UI.
- Human pane already names fill units (`station.js` **4830**) and paints BUY/SELL via `h()` (`**4846–4847**`).
- Digit 1 stays market (`DOCK_KEY_SERVICES[0]` **189**). No new Digit. KeyH/J/L/M/P stay. KeyD strafe.
- HUD-01 80 px hub stays empty. No market pip. No aim-glass gauge.
- TRADE offset **5** stays (`boot-test.mjs` **2809–2811**). Sibling Market desk layout owns overflow.
- Badge chrome stays Wave 134/Fable top-right. Manifest overlap is a **sibling inbox**.
- `reducedMotion`: no new animation.
- Color is not the only cue: pane shows `${buyUnit} UU` / `${sellUnit} UU` text; JSON fill is numbers.
- Buttons stay real `<button type="button">` (`station.js` **4551–4555**). This pack does not add buttons.

### Findings

#### 🔴 Blocker: Agent JSON shows posted while the pane shows fill — **resolved as later observe fields**

**Location:** live `marketBlock` `agent-observe.js` **267–273**; pane **4842–4847**; inbox **308–312**  
**Issue:** The watch user sees fill BUY/SELL. The outer loop sees `posted` only. Humans and agents do not share a unit. That is an agent-play hole, not a missing lamp.  
**Fix:** PR1 `fillBuy` / `fillSell` on the row; keep `posted`. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: New Digit / key as the default fix — **resolved in freeze**

**Location:** Digit 1 market; TRACKED keys honor  
**Issue:** A sixth Digit or remapped Q/W fights station map and muscle memory.  
**Fix:** Digit 1 stays. Agent uses `observe` + `act trade`. No new TRACKED code.

#### 🟠 Major: TRADE wrap / 560 px overflow as this leftover — **resolved in freeze**

**Location:** wishlist **318+**; `.market-actions` six buttons **4853–4856**  
**Issue:** Wrapping TRADE to “make fill obvious” steals the sibling Market desk layout pack.  
**Fix:** this pack does not claim overlay CSS. Offset **5** stays.

#### 🟠 Major: Badge copy / pin rewrite as this leftover — **resolved in freeze**

**Location:** sibling wishlist **313–317**  
**Issue:** Moving the badge or adding `MARKET FILL` jargon would cover PWR/range or steal Manifest inbox.  
**Fix:** pin stays. Copy stays. Fill lives on observe JSON.

#### 🟠 Major: Hub PPI / UU pip — **resolved in freeze**

**Location:** HUD-01 80 px hub  
**Issue:** A PRICE hub child would fill the empty glass and steal HUD-06/07.  
**Fix:** no hub child. Credits stay Manifest. Pane cells stay the human cue.

#### 🟠 Major: Color-only “fill vs posted” — **resolved in freeze**

**Location:** honor a11y; pane **4846–4847** already text UU  
**Issue:** A red posted number without a fill field fails the inbox for agents.  
**Fix:** JSON numbers + live pane text. No color-only cue. `innerHTML` forbidden.

### 🟡 Minor: Fake ctx observe will omit fill until a desk hook exists

**Location:** hardening harness  
**Issue:** Outer loops on a stub desk see posted only (same as today).  
**Justification:** fail-closed. Live dock is the product path.

### 🟡 Minor: Manifest still under the badge

**Location:** wishlist **313–317**; `z-index` 40  
**Issue:** Fill fields do not make overlap worse than posted-only rows.  
**Justification:** sibling inbox. Do not move the pin onto PWR.

### 🟡 Minor: Pane subhead already says “fill units”

**Location:** `station.js` **4830**  
**Issue:** Humans are already told. Agents were not.  
**Justification:** do not rewrite the subhead. JSON fill is the agent cue.

### 💡 Suggestion: Optional PR2 stills

One still: `?agent=1` docked Digit 1 Vigil; pane BUY ≠ posted table; observe `fillBuy` matches BUY cell; hub empty; TRADE six-column offset 5; badge top-right; no extra toast slot.

### 💡 Suggestion: Keep Enable / Stop labels

Do not retitle the badge for market fill.
