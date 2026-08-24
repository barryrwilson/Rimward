# UI Audit: Wave 85 galaxy chart plot layer

**Scope:** Chart header Clear control, plot overlay, hit discs, dest/hop/unreachable paint, status line.  
**Method:** self-applied checklist (orchestrator `ui-audit.md`). Did not spawn `[designer]`.  
**Date:** 2026-08-21

## UI Audit: galaxy chart PR3

### Summary
Clear sits in tab order with Close. Status is `aria-live` polite `textContent`. Plot vs hub vs gate is pattern + weight, not hue alone. Hit floor is 24 CSS px.

### What's done well
- `Clear route` is `<button type="button">` with the same focus ring as Close; min-height 24px.
- Status copy: dest name + `N jumps` / `1 jump`; blocked `No route from here.` (no hop count); arrived `Arrived · <name>`; idle hidden.
- Dest uses stroke + square outline (not fill-only). Hops use dashed stroke. Unreachable uses a different dash and a square mark.
- Hub gold stays dashed; player plot is thick solid accent (`.rw-galaxy-plot`).
- Colorblind / contrast / reduced-motion hooks already wrap the chart; unreachable gets an Okabe-Ito orange under `rw-colorblind`.
- Chart does not pause (`aria-modal=false`). Click does not swallow pointer events.

### Findings

#### 🟡 Minor: Dest square is chart-units, not CSS px
**Location:** `src/systems/galaxychart.js` dest/unreach `rect` (`NODE_R + 6`)
**Issue:** The shape cue scales with the viewBox. On a large window it stays readable; on a tiny panel it is small. The click target is the separate hit disc (≥ 24 CSS px).
**Fix:** Optional: size the dest square from the same CSS-px conversion as the hit disc.
**Status:** accepted (hit floor is the contract; paint stays `NODE_R` 8)

No Blocker or Major.

### Checks
- [x] Focus visible on Clear and Close
- [x] Status live region
- [x] Idle empty/hidden
- [x] Unreachable distinct from a large hop number
- [x] Hub rings cannot steal `data-system-id`
- [x] Keyboard: no WASD node picker (chart does not pause)
