# UI Audit: Org01 origin consequence preview leftover integrator

### Summary

No product UI ships in Wave 141. Audit is of the live origin overlay and later derived consequence rows. Blocker/Major UI holes in **live** play (flavor-only permanent pick) stay leftover **REAL** until PR1 (accepted). Parent designer Major (overflow with no keyboard read path) is **folded**: compact sublines first; overflow-y backup only; no `.screen-panel` steal. Color-only danger, `innerHTML`, Digit remap, two-step confirm, pause-menu chrome, and Onb01 copy stay forbidden. No Blocker/Major remain **open** in the integrator freeze.

### What's done well

- Live rows already use Digit index **and** name **and** flavor line (`origins.js` **141**). Selection is not color-only. Hover only tints background (**142–143**).
- Copy already goes through `textContent` (**121**, **141**, **150**). No `innerHTML`.
- Footer already says the choice is permanent (**150**). Keyboard Digit1–5 **and** click both work.
- Overlay is full-screen, 620 px card, `max-width: 92vw` (**114–116**). Readable monospace.
- Digit 0/8/9 ignored on this overlay (**156**). After pick, those digits stay station.
- HUD-01 hub stays empty. No new Digit. Origin overlay first (wave-6).
- `reducedMotion`: no overlay animation live; PR1 rows are static text. Hover is a background swap, not a required motion.

### Findings

#### 🔴 Blocker: Flavor-only permanent choice — **resolved as later mint**

**Location:** live row `origins.js` **141**; footer **150**; apply **127**  
**Issue:** The player can confirm a career from a one-line slogan. Hull, money/debt, standings, danger, and experience are invisible until after `world.origin` writes.  
**Fix:** PR1 labeled rows on each origin **before** Digit/click. Live hole remains until PR1 (expected). Integrator must not CONSUME.

#### 🟠 Major: Card overflow has no keyboard read path — **resolved in freeze** (Wave 141 re-dispatch)

**Location:** live card `origins.js` **114–116** (no `max-height`, no `overflow`); parent designer `out/w141/designer/org01-ui-audit.md`; prior freeze “may overflow”  
**Issue:** Five origins × five consequence kinds at 12 px uppercase can hide Digit4–5 and the footer. Digit1–5 still confirm. The card is an unfocusable `div`. Mouse wheel is not a keyboard read path. Overflow-only is mouse-only informed choice. Reuse of `.screen-panel` would steal station/pause chrome.  
**Fix (frozen):** Layout law **compact first** (contract §0.21): preview **sublines** ≈10 px, dimmer, wrap, under `[n] name — line`. Five Digit rows plus preview stay in view at live 620 px / 92vw **without** mouse-only scroll as the primary path. `overflow-y: auto` is **fail-closed backup** on a **dedicated origin list region** if content still clips. Title + footer stay outside the scroller when possible. No new scroll key. No Digit remap. No `.screen-panel` / `.screen-overlay` / `.screen-btn`. Dedicated `.rw-origin-*` allowed. Digit labels stay full size. `textContent` stays. `innerHTML` forbidden.

#### 🟠 Major: Color-only danger / experience — **resolved in freeze**

**Location:** honor a11y; live hover is already extra  
**Issue:** Tinting Marked or Ledger Debt red without words would fail color-not-only. Experience as a pip color would fail.  
**Fix:** PR1 uses words: `Money −1150 UU (debt)`, `Experienced`, faction names + rank names. Color optional extra, not PR1.

#### 🟠 Major: Two-step / pause chrome / flight lesson on the card — **resolved in freeze**

**Location:** Digit confirm **153–157**; Ctl05 sibling; Onb01 sibling  
**Issue:** A second Confirm button remaps the Digit contract. Pause-menu styling steals Ctl05. Move/R-F copy steals Onb01.  
**Fix:** keep one-press. Keep origin card. Do not steal siblings.

#### 🟠 Major: `innerHTML` / non-text clue ids as the only cue — **resolved in freeze**

**Location:** later clue `rm_c_tally`; `authored-systems.js` **122**  
**Issue:** Painting raw ids only, or HTML, hides meaning or XSS.  
**Fix:** `textContent`. Drifter clue uses player words from the authored tally-board line. Digit index stays on the title row.

### 🟡 Minor: `text-transform: uppercase` on long preview

**Location:** card `text-transform:uppercase` **116**  
**Issue:** Long standings lines become shouty and wrap more.  
**Justification:** Live card already uppercases flavor. Do not drop uppercase for the whole overlay in PR1 (scope). Prefer short deputized labels. Owner may later un-uppercase preview lines only.

### 🟡 Minor: Hover is mouse-only

**Location:** `mouseenter` / `mouseleave` **142–143**  
**Issue:** Keyboard Digit users get no hover tint.  
**Justification:** Digit `[n]` is the cue. Do not add animation. Optional later focus ring if rows become real `<button>` — not required PR1. Clickable `div` predates this leftover.

### 🟡 Minor: Shared hull line is repetitive

**Location:** deputize table  
**Issue:** Five identical hull lines add height.  
**Justification:** Inbox asked for hull/equipment. Shared starter is honest. Keep. Compact type is the height valve. Overflow is backup only.

### 🟡 Minor: Greenhand `fear 0` vs omit — **resolved in freeze**

**Location:** prior deputize table vs omit law; `ORIGINS.greenhand.effects` `{}`  
**Issue:** No `setFear` on Greenhand. Printing `fear 0` invents a cue.  
**Fix (frozen):** omit fear unless `setFear` exists. Greenhand danger is `Start Freehold Drift` only.

### 🟡 Minor: Skip-unknown must not reindex Digits — **resolved in freeze**

**Location:** live `[${i + 1}]` **136–141**  
**Issue:** Compacting labels after skip would make Digit1 mean Ledger.  
**Fix (frozen):** authored index stays the Digit. Skip omits the row; remaining keep 1–5.

### 💡 Suggestion: Optional PR2 still

One still: new game, overlay, all five kinds visible on Ledger Debt **before** any Digit; Digit2 confirms; overlay gone; Digit2 does not reopen origin; hub empty; no pause-menu chrome.

### 💡 Suggestion: Do not add row motion

Rows are enough. Do not add CSS animation that ignores `reducedMotion`.

### Verdict

No 🔴/🟠 remain **open in the freeze**. Live flavor-only stays until PR1 (accepted leftover REAL). Designer overflow Major is folded: compact first, overflow backup. Uppercase wrapping and hover-only tint stay minor.
