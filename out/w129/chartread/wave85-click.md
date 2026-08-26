# WAVE85 click-to-plot restore

Graph resolve: `proceed_unmodeled` (`r-mt9ps8ul-f2f38c58`). No binding workflow.

Write-set: `src/systems/galaxychart.js` only. Did not clobber `verify/` or `verify2/`.

Click-vs-drag had replaced `svg.addEventListener('click', …)` with plot-on-`pointerup` only. WAVE85 fires `_listeners.click` with `target` = `.rw-galaxy-hit` for `veridian` and never sends pointer events, so `livePlot` stayed false.

Fix:
- Keep pan on `pointerdown` / `pointermove` / `pointerup` / `pointercancel`.
- Restore `svg.addEventListener('click', …)`.
- Plot from hit / label / node with `data-system-id` when the gesture did not pan (`panMovedThisGesture` false).
- `plotFromGesture` skips a second `activateSystem` for the same id after `pointerup` already plotted.
- Hover stays `pointerover` only.
- Dest select, zoom, filters, itinerary leg rows unchanged.
- No `preventDefault` / `stopPropagation` / `innerHTML`.

Did not start Vite. Did not write `hud.css`, `hud.js`, `hail.js`, `boot-test.mjs`, `PROGRESS`, wishlist. Did not touch REDMARCH `castMatches`.

Verification: `npm run test:boot` — WAVE85 `livePlot`, `liveCleared`, `clickCurrentClears` all true. Unrelated fails: WAVE30 PAYTRIBUTE, WAVE129 SRC (`noFearOnMiss`).

## Security Review: galaxychart.js click restore

### Risk Level: Low

### Summary
Client chart overlay. Plot ids still pass `sanitizeSystemId`. No new network, storage, or HTML injection.

### Findings
None (no HIGH/CRITICAL).

### Passed Checks
- [x] No secrets in code
- [x] `data-system-id` sanitized before `plotRoute` / `clearRoute`
- [x] No `innerHTML`
- [x] No `preventDefault` / `stopPropagation` (WAVE85 `noPrevent`)
- [x] Hidden / filtered targets do not plot
- [x] Hover does not write `world.nav`

## Code Review: galaxychart.js click restore

### Summary
Click-to-plot is back on the SVG. Pan remains. Same-id plot from `pointerup` then `click` is guarded.

### What's done well
- WAVE85 click-only path does not need `pointerdown`.
- Drag ≥ 4 CSS px sets `panMovedThisGesture` and the trailing `click` does not plot.
- Open reset clears gesture flags so a prior pan cannot block the next WAVE85 click.

### Findings
No Blocker or Major.

#### 💡 Suggestion: consume `panMovedThisGesture` on click
**Location:** `src/systems/galaxychart.js` click listener  
**Issue:** After a pan, a synthetic click with no later `pointerdown` still no-ops until open or next down.  
**Justification:** Browser click after pan is the case we skip. WAVE85 opens the chart first.

## UI Audit: galaxychart.js click restore

### Summary
Hit discs and labels still plot. Drag still pans. Hover inspect only.

### What's done well
- 24 CSS px hit discs unchanged
- Dest `<select>`, zoom buttons, faction/standing filters, itinerary legs untouched
- Keyboard KeyM / Escape unchanged

### Findings
No Blocker or Major.

