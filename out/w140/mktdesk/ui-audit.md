# UI Audit: Wave 140 PR1 MARKET desk layout

### Summary

TRADE actions wrap at the live 560 px panel floor. Subtitle uses player words buy price / sell price. Keyboard Q/W/A/S stay. Restricted rows stay visible. No Blocker/Major remain in the shipped PR1.

### What's done well

- `.market-actions` keeps `display: flex` and `gap: 6px` and adds `flex-wrap: wrap` (`screens.css` **215–219**).
- TRADE min track stays `minmax(10em, 1.7fr)` (**181**). Panel `min-width` stays `560px` (**28**). Overflow is still `overflow-y: auto` only (**31**).
- Subtitle stays on `.screen-sub` via `textContent`. CSS uppercase / 0.22em tracking unchanged (**45–51**). Live string has no “fill units”.
- TRADE buttons stay real `<button>` via `btn()`. `.screen-btn:focus-visible` ring stays (**96–99**).
- Legend still sits under the table (`↑/↓ select · Q/W buy 1/5 · A/S sell 1/5`). Hotkeys are not in the TRADE head.
- BUY / SELL still show `n UU` words. Color is not the only cue.
- Closed locker still paints `trade refused`.
- Digit 1 still Market. No new Digit. No HUD pip. No new animation (`reducedMotion` unused).

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Wrap can stack TRADE on two rows

**Location:** `src/ui/screens.css` **215–219**  
**Issue:** Four `+1`/`+5`/`−1`/`−5` hits can wrap inside the 10em track. The selected-row cell grows taller. Panel already scrolls on Y.  
**Justification:** Wrap is the layout law. Better than clip. Gap 6 px stays.

#### 🟡 Minor: `.screen-sub` tracking still long

**Location:** `src/ui/screens.css` **45–51**; subtitle `station.js` **4831**  
**Issue:** Player-word line is about as long as the old jargon line. Uppercase + 0.22em may wrap the subtitle.  
**Justification:** Inbox asked for player words. Do not restyle every station sub.

#### 💡 Suggestion: Optional still (PR2 skip)

Dock Digit 1 at 560 px in a browser. Confirm four TRADE hits wrap or fit. Confirm subtitle reads BUY PRICE AND SELL PRICE. Confirm Q buys 1. This worker did not start Vite/Chrome.

### Re-review

After wrap + subtitle + skip: no new Blocker/Major. Stack and tracking stay Minor.

### Verdict

No 🔴/🟠 remain in PR1. Browser stills are the verifier, not this worker.
