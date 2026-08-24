## UI Audit: Yard hull preview (Digit 0)

### Summary
Yard offer rows and Confirm papers now carry a small decorative hull turntable. Papers and Cancel stay real `button`s. Keyboard digits and Tab still reach those controls. No Blocker or Major defects. Contrast, reduced-motion freeze, and aria-hidden canvas are in place.

### What's done well
- Preview is look-only: `pointer-events: none`, `user-select: none`, `tabIndex = -1`, and `aria-hidden` on host and canvas (`shipyard-desk.js:122-128`, `yard-preview.js:361-363, 388`, `screens.css:425-448`).
- Copy stays in `.shipyard-buy-copy` with `min-width: 0`, so class name, price, and Papers remain the readable column (`screens.css:413-423`; `shipyard-desk.js:210-241`).
- Confirm papers uses the cyan rail, a larger viewport (168×108), and `screen-btn-warm` for the buy action. Cancel stays a default button (`shipyard-desk.js:209-222`; `screens.css:409-442`).
- `btn()` still emits `<button type="button">` with existing `:hover` / `:focus-visible` rings (`station.js:4237-4241`; `screens.css:88-100`).
- Reduced motion reads `ctx.settings.reducedMotion` and skips Y rotation after the first paint (`yard-preview.js:320, 343-348, 410-412`).
- High-contrast settings restyle the well (`body.rw-contrast .shipyard-preview`, `screens.css:610-613`).
- Empty catalog and “No sale.” notes stay text, with no canvas (`shipyard-desk.js:198-200, 226-228`).
- Plated load uses a grey box in the well, not a hole. Living SKUs sculpt synchronously (`yard-preview.js:65-81, 174-194`).
- WebGL lives off-screen (`left: -4096px`, `aria-hidden`, `pointer-events: none`) and blits into the 2D canvas (`yard-preview.js:243-248, 325`).

### Findings

#### 🟡 Minor: Six CORE_STOCK rows push Papers below the fold
**Location:** `src/ui/screens.css:26-30, 425-441`; `src/systems/shipyard-desk.js:230-241`
**Issue:** Freehold stock is six classes. Each list row is a 128×84 well plus name, meta, and a Papers button. `.screen-panel` already scrolls at `max-height: 82vh`. Digit 0 (last row) can sit below the fold on short docks.
**Fix:** If playtests hide the last Papers control, shrink list wells (for example 96×64) and keep 168×108 on Confirm only.
**Status:** open

#### 🟡 Minor: 1 s overlay rebuild restarts the turntable
**Location:** `src/systems/yard-preview.js:254-267, 320, 378-412`; station overlay rebuild at 1 s
**Issue:** Each remount builds a new pivot at identity. `TURNTABLE_SPEED` is 0.18 rad/s, so the hull turns about 10° then snaps back. The silhouette still reads. It does not complete a turntable orbit.
**Fix:** Carry `pivot.rotation.y` (or a shared clock angle) across remounts keyed by `previewKey`. Do not change Digit mapping.
**Status:** open

#### 🟡 Minor: Plated rows show an unlabeled grey box while assets prime
**Location:** `src/systems/yard-preview.js:65-81, 190-194, 203-224`
**Issue:** Until `primeShipAsset` resolves, the well shows a metal box. Class text beside it still names the SKU. The desk does not hang. A long prime can look like a generic crate.
**Fix:** Optional. If the box lasts more than a beat, add a quiet `.screen-note` “Loading hull” in the copy column, not on the canvas.
**Status:** open

#### 🟡 Minor: WebGL init failure leaves an empty well
**Location:** `src/systems/shipyard-desk.js:122-128`; `src/systems/yard-preview.js:227-238, 378-389`
**Issue:** `attachHullPreview` always mounts `.shipyard-preview`. If `ensureRenderer()` fails, `mountYardPreview` returns after `aria-hidden` with no canvas. The row keeps an 84px dark rectangle and the Papers button. Usable, but the well looks broken.
**Fix:** If `mountYardPreview` cannot paint, omit the host or collapse `.shipyard-preview` with a CSS class so copy uses the full row.
**Status:** open

#### 💡 Suggestion: Confirm copy stacks buttons with no gap
**Location:** `src/ui/screens.css:420-423`; `src/systems/shipyard-desk.js:212-222`
**Issue:** `.shipyard-buy-copy` is a block column. Confirm papers and Cancel sit flush. List rows have one button, so they are fine.
**Fix:** `display: flex; flex-direction: column; gap: 8px` on `.shipyard-buy-copy`, matching `.screen-btnrow`.
**Status:** open

#### 💡 Suggestion: High-contrast CSS well and GL clear color differ
**Location:** `src/ui/screens.css:610-613`; `src/systems/yard-preview.js:27, 256`
**Issue:** Contrast mode sets the well to `#060b14`. The scene clear stays `0x070c14`. The canvas covers the CSS fill after the first blit, so the mismatch is a one-frame or letterbox edge at most.
**Fix:** If contrast is on, set `scene.background` to `0x060b14` (or read a shared token). Optional.
**Status:** open

#### 💡 Suggestion: Screen readers skip the canvas on purpose
**Location:** `src/systems/shipyard-desk.js:122-128`; `src/systems/yard-preview.js:361-363, 388`
**Issue:** Host and canvas are `aria-hidden`. The accessible name is the class word in `.shipyard-buy-name` plus the Papers / Confirm control.
**Fix:** None. Do not add `role="img"` or a live region on the turntable.
**Status:** accepted (no change)

### Re-review
Clean of Blocker and Major. Papers, Cancel, Digit 1/2/3+/0, and Esc stay on real controls. Contrast border and reduced-motion freeze hold.
