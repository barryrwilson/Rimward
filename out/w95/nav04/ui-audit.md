## UI Audit: NAV-04 hover panel (design freeze)

### Summary

Self-applied checklist on the proposed chart hover (no `[designer]` spawn). Reserved strip + `.is-hover` stroke meets contrast, overlap, reduced-motion, and non-mouse constraints without covering plot chrome. No Blocker/Major remain.

### What's done well

- Reuses the live plot-status slot pattern (below SVG, inside the panel) instead of a cursor balloon.
- Hover highlight is stroke/shape, not fill-only; composes with current/dest/hop.
- Digit 9 rank **name + number** is the standing language (no mystery color-only rank).
- Independent / Unknown are words, not a missing row.
- `body.rw-reduced-motion` already kills overlay animation (`hud.css` 1944–1948).
- Colorblind / contrast tokens already wrap `.rw-galaxy-chart`.
- Header Clear / Autopilot / Close stay the only tab stops. Hover does not add 100 `tabindex` nodes (NAV-01 tab trap).

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None remaining. Prevented in freeze:

| Risk | Freeze |
|---|---|
| Tooltip covers hovered node / plot strokes | Reserved strip below SVG; `pointer-events: none` on the readout |
| Panel off-screen | Inside `.rw-galaxy-chart-panel` (already clamped to 92vw × 88vh) |
| Flicker on overlap | Sticky id; topmost hit disc; no `title=` |
| Hover steals plot click | Separate pointerover; click handler unchanged; no preventDefault |
| Hover highlight looks like dest | Dest keeps square overlay; hover is a distinct ring/class |
| Standing unreadable | Digit 9 string; `--white` / contrast tokens; `--rw-text-scale` |

#### 🟡 Minor

##### U1: No keyboard node inspect

**Location:** inventory §1.2; contract §2.2  
**Issue:** Screen-reader / keyboard users cannot move a hover subject without a pointer. Chart does not pause; arrows would steal flight.  
**Fix (accepted):** Do not add a picker this serial. `aria-live="polite"` on the strip when pointer (or a **future** focus) changes the id. Owner Q5.

##### U2: Strip competes with plot-status height

**Location:** `hud.css` 1642–1647 panel height; plot-status 1903–1911  
**Issue:** Two status rows shrink the SVG on short viewports.  
**Fix:** Compact 3-line type at plot-status size (`calc(11px * var(--rw-text-scale, 1))`). Hide the hover strip when idle. Do not cover the legend or header.

##### U3: `aria-live` spam

**Issue:** Re-writing standing every frame while hovered would re-announce.  
**Fix:** Contract §4.2 — write only when the **text** changes.

#### 💡 Suggestion

- Include the hovered name in `.is-hover` via `aria-label` on the live region (`Inspecting <name>`), still `textContent`.
- Colorblind: hover ring uses dash pattern, not a new hue that collapses to dest cyan.

### Passed Checks

- [x] Contrast: chart tokens + `body.rw-contrast`
- [x] Focus rings: existing header buttons; hover adds none
- [x] Hit targets: same ≥ 24 CSS px discs as plot
- [x] States: idle hidden, hover shown, leave clears, close clears
- [x] Reduced motion: no new animation
- [x] Semantic: `role="status"`; no `innerHTML`
- [x] HUD-01 aim glass untouched
- [x] Non-mouse: inventoried (none today); same `hoverModel` if added later
