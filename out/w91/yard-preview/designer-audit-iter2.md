## UI Audit: Yard hull preview (iteration 2)

### Summary
Shared family camera scale makes heavy read larger than light in the same 128×84 (list) and 168×108 (confirm) wells. Empty margin around light is the size cue. No Blocker or Major defects.

### What's done well
- List tiles stay 128×84. Confirm stays 168×108. Class size is camera distance, not a larger CSS box (`screens.css:425-442`; `yard-preview.js:31-34, 59-64, 160-207`).
- Living SKUs and plated light–ace–cutter–heavy share the heavy charter span (17, or the longest cached mesh). `livingRestScale` is visible again (`yard-preview.js:155-186, 200-201`; `ship.js:252-256`).
- Light is not fill-to-fit. A light hull occupies roughly 0.4 of the family span, so void around it is the comparison, not a missing model (`yard-preview.js:160-186`).
- Frigate and freighter use `max(own, classTarget)` so a 32 / 78 span is not forced through the heavy camera. CSS `overflow: hidden` clips paint at the well edge if a mesh still overshoots (`yard-preview.js:174-176`; `screens.css:425-433`).
- `reframeFamily` updates sibling wells when a larger hull joins the cache, so a late heavy does not leave light at a private zoom (`yard-preview.js:209-224`).
- Confirm papers uses the same world scale. A heavy confirm is a larger viewport on the same framing, not a zoomed light (`shipyard-desk.js:206-213`; `yard-preview.js:59-64, 188-207`).
- Preview stays look-only: host and 2D canvas are `aria-hidden`, `tabIndex = -1`, `pointer-events: none`, `user-select: none`. Off-screen WebGL canvas matches that (`shipyard-desk.js:122-128`; `yard-preview.js:304-309, 420-424, 449`; `screens.css:425-448`).
- Accessible name stays the class word in `.shipyard-buy-copy` plus Papers / Confirm. AT does not get a second live region on the turntable (`shipyard-desk.js:235-241, 212-222`).
- Reduced motion reads `ctx.settings.reducedMotion`. Y rotation stops. `animateShipMesh` gets the flag. After the first paint, frozen views skip rAF work until `needsPaint` (`yard-preview.js:126-128, 381-382, 404-410, 471-473`).
- High-contrast settings still restyle the well border (`screens.css:610-613`).
- Papers, Cancel, Digit 1/2/3+/0, and Esc stay on real `<button type="button">` controls. The well does not take hit testing (`station.js:4237-4241`; `screens.css:88-100, 434-435`).

### Findings

#### 🟡 Minor: Plated capital SKUs still fill their own tiles
**Location:** `src/systems/yard-preview.js:174-176`
**Issue:** Frigate (`target` 32) and freighter (`target` 78) do not share the heavy family span. On a six-row CORE_STOCK list, light sits in void while frigate and freighter fill the well almost like fill-to-fit. Heavy vs light still reads. Heavy vs freighter does not.
**Fix:** Keep this for iteration 2 (clipping a 78-unit hull in a span-17 camera would be worse). A later plated ladder can use a compressed log scale or a faint length tick in copy. Do not fill-to-fit light to match them.
**Status:** open (accepted tradeoff)

#### 🟡 Minor: Unknowables light sits small with no sibling
**Location:** `src/systems/yard-preview.js:165-173`; `src/game/shipyard.js:30, 42`
**Issue:** Living family span is at least heavy even when stock is only `light`. The one well looks sparse. That matches the charter. A player who never sees a heavy at that dock can read it as a framing miss.
**Fix:** Keep shared scale. Do not special-case a single-SKU catalog with fill-to-fit.
**Status:** open (keep)

#### 💡 Suggestion: Empty margin around light is the size cue
**Location:** `src/ui/screens.css:425-431`; `src/systems/yard-preview.js:160-207`
**Issue:** Light (and ace) leave a dark field around the mesh. That is the intended hierarchy, not a hole. Filling the well would hide class scale (the iteration 1 defect).
**Fix:** None. Do not add “relative size” copy unless playtests still mix light and heavy.
**Status:** accepted (no change)

#### 💡 Suggestion: Screen readers skip the canvas on purpose
**Location:** `src/systems/shipyard-desk.js:122-128`; `src/systems/yard-preview.js:304-305, 420-424, 449`
**Issue:** Host, blit canvas, and off-screen WebGL canvas are `aria-hidden`. The class label plus Papers is the name.
**Fix:** None. Do not add `role="img"` or a live region on the turntable.
**Status:** accepted (no change)

### Re-review
Clean of Blocker and Major (0 / 0). Heavy reads larger than light under one camera scale. Capital plated SKUs keep their own span so they are not clipped. Reduced-motion freeze and decorative-canvas hiding still hold.
