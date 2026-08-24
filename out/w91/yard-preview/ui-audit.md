## UI Audit: yard-preview

### Summary
Yard Digit 2 now shows a small hull turntable on each offer and on Confirm papers. Papers and Cancel stay real `button`s. The canvas is decorative.

### What's done well
- Layout uses existing `.shipyard-buy-row` tokens plus a copy column, so Confirm papers keeps the cyan rail and warm confirm button.
- Preview is `pointer-events: none` and `aria-hidden`, so Digit 1/2/3+ and Tab still hit the desk buttons.
- `ctx.settings.reducedMotion === true` freezes Y rotation after the first paint.
- Contrast theme paints a stronger preview border (`body.rw-contrast .shipyard-preview`).
- Fallback box is a dark panel, not an empty hole, while plated GLBs load.
- No new dock Digit.

### Findings

#### 🟡 Minor: Six plated rows add vertical scroll
**Location:** `src/ui/screens.css:425-441`; `src/systems/shipyard-desk.js:230-241`
**Issue:** Freehold CORE_STOCK is six classes. Each row is now ~84px of preview plus the Papers button. The panel already scrolls (`max-height: 82vh`).
**Fix:** If playtests show the last Papers control below the fold too often, shrink list previews to 96×64 and keep the larger confirm viewport.

#### 🟡 Minor: No explicit loading copy on the fallback box
**Location:** `src/systems/yard-preview.js:65-81, 190-194`
**Issue:** Until `primeShipAsset` resolves, plated yards show a grey box. The class word is still next to it. The desk does not hang.
**Fix:** Optional `screen-note` “Loading hull” if the box lasts more than a beat. Not required for Beautiful living SKUs (sync sculpt).

#### 💡 Suggestion: Screen readers skip the canvas
**Location:** `src/systems/shipyard-desk.js:122-128`; `src/systems/yard-preview.js:388`
**Issue:** Hosts are `aria-hidden`. The class label in `.shipyard-buy-name` is the accessible name. That matches “decorative canvas”.
**Fix:** None. Do not put a second live region on the turntable.

### Re-review
No Blocker or Major remaining. Keyboard confirm/cancel, Digit mapping, and contrast tokens hold.
