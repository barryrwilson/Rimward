## UI Audit: NAV-04 galaxy-map hover

### Summary
Reserved strip under the SVG, extra dashed hover ring, and Digit 9 standing copy. Idle strip stays in-flow (`visibility: hidden`) so the map scale does not jump. No Blocker or Major.

### What's done well
- Readout is below the SVG and above `.rw-galaxy-plot-status`; it cannot cover nodes, plot strokes, or header Clear / Autopilot / Close.
- `pointer-events: none` on readout and hover marker; clicks still hit discs.
- Hover cue is stroke + extra ring, not fill-only; dest square, hop dash, and current marker stay distinct.
- `.is-hover` does not override dest / hop / current / unreachable node strokes.
- Tokens: `--white`, `--dim`, `--rw-accent`, `--rw-text-scale`. Colorblind / contrast / reduced-motion body classes still apply to the overlay.
- No hover animation. `body.rw-reduced-motion .rw-galaxy-chart *` already kills animation/transition.
- `role="status"` `aria-live="polite"`; `textContent` only when id or standing text changes. Idle sets `aria-hidden`.
- Same 24 CSS px hit discs as click. No native `title`. No keyboard node picker.

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: idle strip still occupies three line-heights

**Location:** `src/ui/hud.css` `.rw-galaxy-hover`  
**Issue:** Reserved min-height keeps SVG scale stable (PR3 flicker). The gap is empty when idle.  
**Fix:** Accept. `display: none` would shrink the SVG under the pointer.

### Verdict
Approve.
