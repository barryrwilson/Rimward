## UI Audit: NAV-01 galaxy chart plot

**Scope:** Click-to-plot on the KeyM galaxy map (`galaxychart.js`, `hud.css` galaxy chart block, `controls.js` `fireHeld` vs `chartOpen` only).  
**Method:** Static checklist (`orchestrator/references/ui-audit.md`) plus contract `out/w84/nav01/shared-contract.md` §3. No Playwright. Worker self-audit `out/w85/chart/ui-audit.md` was read, not treated as gospel.  
**Date:** 2026-08-21

### Summary
Click-to-plot meets the §3 UI law: 24 CSS px hit discs, hub rings `pointer-events: none`, plot class is not hub gold, Clear is a real button, status is `textContent` + `aria-live`, no `innerHTML`, chart does not pause, no `preventDefault`. No blocker and no major. Remaining notes are size-of-paint and empty-state polish.

### What's done well
- Dialog stays `role="dialog"` with `aria-modal="false"` and `aria-hidden` toggled in `setOpen` (`galaxychart.js:107–112`, `295–300`). Gameplay is not paused.
- `Clear route` is `<button type="button">` in `.rw-galaxy-chart-actions` with Close (`galaxychart.js:125–140`). Shared hover / `:focus-visible` ring, `min-height` / `min-width` 24px (`hud.css:1480–1508`).
- Status is a persistent `p.rw-galaxy-plot-status` with `aria-live="polite"`; copy uses `textContent` only (`galaxychart.js:279–282`, `342–346`). Idle hides the line. Plotted: `Name · N jumps` / `1 jump`. Blocked: `No route from here.` (not a hop count). Arrived: `Arrived · <name>`.
- No `innerHTML`. No `preventDefault` / `stopPropagation` in the chart module.
- Paint order matches §3.3.1 numbered list: gates → hub routes → plot overlay → nodes + hub rings → hit discs → labels → current marker (`galaxychart.js:177–277`).
- Plot strokes use `.rw-galaxy-plot` (solid accent, `stroke-dasharray: none`), not `.rw-galaxy-route` (`hud.css:1531–1552`, `1674–1676`). Legend adds a plotted-route swatch (`galaxychart.js:160–166`).
- Dest is stroke + square outline, not fill-only (`is-dest` + `.rw-galaxy-plot-dest`). Hops are dashed (`is-hop`). Unreachable is a different dash + square (`.is-unreachable` + `.rw-galaxy-plot-unreach`).
- Hub rings, labels, current marker, painted nodes, and plot geometry set `pointer-events: none` (`hud.css:1538–1544`, `1573`, `1612`, `1620`, `1631`). Clicks read `data-system-id` only from `.rw-galaxy-hit` (`galaxychart.js:72–79`, `449–457`).
- Hit disc fill is `transparent` + `fill-opacity: 0` + `pointer-events: all` (`galaxychart.js:246–254`, `hud.css:1599–1604`). Radius is `max(NODE_R, 12 / scale)` from live viewBox × CSS box at open and resize (`galaxychart.js:41`, `303–320`, `473–475`).
- `ctx.flags.chartOpen` is the fire gate. `controls.js:413` sets `fireHeld = fireDown && ctx.flags.chartOpen !== true` every frame, so a held LMB from before KeyM does not keep firing. Chart does not sniff a DOM class.
- Colorblind / contrast / reduced-motion hooks wrap the chart. Unreachable becomes Okabe-Ito orange under `rw-colorblind` (`hud.css:1690–1722`). Reduced motion kills the current-marker pulse; the dashed ring remains.

### Findings

#### 🟡 Minor: Dest / unreach square is chart units, not CSS px
**Location:** `src/systems/galaxychart.js:379–387`, `416–424`
**Issue:** Square size is `NODE_R + 6` in viewBox units. On a typical window the SVG scale is well below 1, so the shape cue is smaller than the 24 CSS px hit disc. The click target is still the hit disc.
**Fix:** Optional: size `.rw-galaxy-plot-dest` / `.rw-galaxy-plot-unreach` from the same CSS-px conversion as `hitRadiusChart()`.
**Status:** open (contract paint stays `NODE_R` 8; hit floor is the must-meet rule)

#### 🟡 Minor: Hit radius does not refresh when the SVG box changes without resize
**Location:** `src/systems/galaxychart.js:300`, `315–320`, `342–346`, `499–505`
**Issue:** `updateHitRadii()` runs on open and `window` resize only. Showing the status line (`display: none` → visible) or applying `--rw-text-scale` while open shrinks the flex SVG. Radius can lag the live CSS size by a few percent.
**Fix:** Call `updateHitRadii()` at the end of `setStatusText` and when `appliedScale` changes.
**Status:** open

#### 🟡 Minor: Idle Clear is not a disabled empty state
**Location:** `src/systems/galaxychart.js:128–131`, `444–447`; `src/ui/hud.css:1480–1508`
**Issue:** Checklist empty/disabled: Clear stays fully styled and clickable when `world.nav` is omitted. `clearRoute` still emits `Route cleared.` Focus and hover exist; disabled does not.
**Fix:** Set `clearBtn.disabled` (and a `:disabled` style) when the bag is idle; enable on plotted / blocked / arrived. Keep the control in tab order.
**Status:** open

#### 🟡 Minor: Live region uses `display: none` when idle
**Location:** `src/ui/hud.css:1686`; `src/systems/galaxychart.js:345`
**Issue:** `.rw-galaxy-plot-status.is-hidden { display: none; }` removes the polite live region from the a11y tree. Some AT skip the first announcement after the node returns.
**Fix:** Keep the node in flow (the rule already has `min-height`). Hide with empty `textContent` and `aria-hidden`, not `display: none`.
**Status:** open

#### 🟡 Minor: Unreachable red is a hardcoded hex, not a chart token
**Location:** `src/ui/hud.css:1561–1566`, `1593–1597`
**Issue:** Plot/dest/hops use `--rw-accent`. Unreachable uses `#ff6b6b` (HUD danger is `--rw-bad: #ff5252`). Contrast mode thickens `.rw-galaxy-plot` only (`hud.css:1710–1712`), not dest/unreach squares.
**Fix:** Add `--rw-unreach` on `.rw-galaxy-chart` (mirror `--rw-bad`) and include dest/unreach in the contrast stroke bump.
**Status:** open

#### 💡 Suggestion: No hover cue on hit discs
**Location:** `src/ui/hud.css:1599–1604`
**Issue:** Cursor is `pointer`, but the painted node does not change on hover. Unlabeled generated systems are easy to miss.
**Fix:** Optional `.rw-galaxy-hit:hover` stroke, or a sibling `.is-hover` on the painted node. Keep `pointer-events` on the hit disc only.

#### 💡 Suggestion: Blocked status color does not match the unreach mark
**Location:** `src/ui/hud.css:1678–1684`
**Issue:** Blocked copy is correct, but the line still uses `--rw-accent` (same as a good plot). The dest square is red/orange.
**Fix:** Optional `.rw-galaxy-plot-status.is-blocked { color: var(--rw-unreach, #ff6b6b); }`.

#### 💡 Suggestion: Interactive SVG still has `role="img"`
**Location:** `src/systems/galaxychart.js:169–175`
**Issue:** The map is now a click surface. `role="img"` hides descendant structure from AT. Keyboard node pick is contract-forbidden, so this is not a must-fix.
**Fix:** Drop `role="img"` or switch to `role="group"` and keep the existing `aria-label` plus the desc paragraph.

#### 💡 Suggestion: Header / legend can overflow at very small widths or text-scale 1.5
**Location:** `src/ui/hud.css:1455–1469`, `1641–1650`
**Issue:** Actions are `flex-shrink: 0`; title letter-spacing is 0.28em; legend is now four uppercase items with no wrap. Typical game windows fit. ~320 CSS px or large text-scale can clip.
**Fix:** `flex-wrap: wrap` on header and legend; `min-width: 0` on the title.

### Checks
- [x] Focus visible on Clear and Close
- [x] Status live region (`aria-live` polite, `textContent`)
- [x] Idle empty/hidden
- [x] Unreachable distinct from a large hop number (copy + dash + square)
- [x] Hub rings cannot steal `data-system-id`
- [x] Hit disc diameter computed to ≥ 24 CSS px (open / resize)
- [x] Plot class is `.rw-galaxy-plot`, not `.rw-galaxy-route`
- [x] Chart does not pause; no `preventDefault` / `stopPropagation`
- [x] `fireHeld` false every frame while `chartOpen`
- [x] Keyboard: no WASD node picker (contract Q4)
- [x] Color not the only plot/hub/unreach cue
- [x] No `innerHTML`

### Verdict
CLEAN
