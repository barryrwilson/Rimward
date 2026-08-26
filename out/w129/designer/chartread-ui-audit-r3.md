## UI Audit: Galaxy Chart click-vs-drag restore (`galaxychart.js`)

**Persona:** designer (parent pass, r3). Review only. Did not edit `src/systems/galaxychart.js` or `src/ui/hud.css`. Did not start Vite or Chrome. Did not spawn other agents.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Scope is **click plots, pan does not** (WAVE85 click restore after click-vs-drag). Honor `docs/Nav09ChartReadabilityDesign.md` acceptance item 2. HUD-07 owns `hud.css`; this pass cites existing pan cursor / hit CSS only and does **not** demand CSS edits.
**Re-dispatch target:** restore `svg` `click` so a WAVE85-style click on a hit disc plots; drag ≥ 4 CSS px pans and must not `activateSystem`. Hover still inspects only.
**Worker self-audit:** `out/w129/chartread/wave85-click.md` UI section — checked, not rubber-stamped. Worker Blocker/Major call is correct. Extra polish below does not reopen itinerary, dest-select, zoom clamp, or filter omit.
**Coverage:** Code review of live pointer + click path. `[NO BROWSER COVERAGE]` this pass. Graph resolve: `proceed_unmodeled` (`r-mt9pz95v-ae4171ea`).

### Summary

The chart again plots from a `click` on a hit disc, label, or node with `data-system-id` when the gesture did not pan. Pan stays on `pointerdown` / `pointermove` / `pointerup` / `pointercancel` with a 4 CSS px slop. The same-id guard stops `pointerup` then `click` from plotting twice. Dest `<select>` remains the keyboard dest path. Hover still does not write `world.nav`. No 🔴 Blocker. No 🟠 Major.

### What's done well

- WAVE85 fires `_listeners.click` on `.rw-galaxy-svg` with `target` = Veridian `.rw-galaxy-hit` and never sends pointer events (`scripts/boot-test.mjs:19324–19328`). Live `svg.addEventListener('click', …)` is back (`galaxychart.js:1294–1298`). Plot no longer depends on `pointerup` alone.
- Acceptance: drag pans; a move under 4 CSS px still `activateSystem` (`docs/Nav09ChartReadabilityDesign.md` item 2). `MAP_DRAG_PX = 4` (`galaxychart.js:56`). `pointermove` waits for `Math.hypot(dx, dy) >= 4` before `moved` (`galaxychart.js:1273–1276`). `endPan` plots `drag.plotId` only when `!drag.moved` (`galaxychart.js:1246–1247`). Trailing `click` returns if `panMovedThisGesture` (`galaxychart.js:1296`).
- Hit / label / node share `isPlotTarget` (`galaxychart.js:97–106`). `plotIdFromTarget` refuses filter-hidden and zoom-hidden targets (`galaxychart.js:1219–1227`). Hidden discs stay in the tree with `pointer-events: none` (`hud.css:2361–2369`).
- `plotFromGesture` skips a second `activateSystem` for the same id after `pointerup` already plotted (`galaxychart.js:1229–1233`). A real pointer tap does not toggle plot then clear.
- Current-system click still clears (`activateSystem` `sid === here` → `clearRoute`) (`galaxychart.js:1187–1193`). Dest `<select id="rw-galaxy-dest">` still plots from the keyboard (`galaxychart.js:271–276`, `1203–1207`). 101 discs stay out of tab order.
- Hover is `pointerover` → `applyHoverId` only (`galaxychart.js:1306–1310`). Skipped while `panDrag.moved`. Does not call `plotRoute`. Plot overlay CSS is `pointer-events: none` so a plotted stroke does not steal the disc (`hud.css:2267–2273`).
- Existing pan chrome (HUD-07; **do not edit this pass**): `touch-action: none` (`hud.css:2245`). Idle `cursor: grab`; `.is-panning` `cursor: grabbing` (`hud.css:2246–2251`). Hits and labels keep `cursor: pointer` (`hud.css:2336–2341`, `2352–2358`). `HIT_CSS_DIAMETER` stays 24 (`galaxychart.js:50`).
- Open resets `panDrag`, `panMovedThisGesture`, and `plottedIdThisGesture`, then `resetView()` drops `.is-panning` (`galaxychart.js:944–948`, `810–811`). A prior pan cannot block the next WAVE85 click (boot opens KeyM first).
- No `preventDefault` / `stopPropagation` (WAVE85 `noPrevent`). No `innerHTML`. Overlay still `aria-modal="false"` (`galaxychart.js:207`). Chart still does not pause. Autopilot / Close cluster untouched.
- Pointer capture on the SVG keeps pan alive when the pointer leaves a disc (`galaxychart.js:1264–1266`, `1241–1244`). `pointercancel` uses the same `endPan` as `pointerup` (`galaxychart.js:1287–1292`). Primary button only (`e.button !== 0` ignored) (`galaxychart.js:1251`).
- Reduced-motion: pan is an instant `viewBox` write (`galaxychart.js:795–801`). No inertia.

### Honor checklist (click vs pan only)

| Check | Result | Cite |
|---|---|---|
| Click plots (WAVE85 click-only) | Pass | `galaxychart.js:1294–1298`; boot `19324–19334` |
| Drag ≥ 4 CSS px does not plot | Pass | `galaxychart.js:56`, `1273–1276`, `1246–1247`, `1296` |
| Click under 4 px still `activateSystem` | Pass | `endPan` `!drag.moved` + `click` when `!panMovedThisGesture` |
| Labels still plot (NAV-07) | Pass | `isPlotTarget` includes `.rw-galaxy-label` (`galaxychart.js:103`) |
| Hover does not plot | Pass | `galaxychart.js:1306–1310` |
| Dest `#rw-galaxy-dest` stays | Pass | `galaxychart.js:271–276` |
| Hit discs 24 CSS px | Pass | `HIT_CSS_DIAMETER = 24` (`galaxychart.js:50`) |
| Filtered / zoom-hidden no plot | Pass | `targetHidden` (`galaxychart.js:1219–1226`) |
| Current click clears | Pass | `galaxychart.js:1190–1192` |
| WAVE85 `noPrevent` | Pass | no `preventDefault(` / `stopPropagation(` in file |
| Do not cover Autopilot / Close | Pass | no new chrome; zoom/itinerary not in AP cluster |
| `reducedMotion`: instant pan | Pass | `viewBox` write; no inertia |
| Do not demand `hud.css` edits | Pass | existing grab / hit / `touch-action` cited only |

### Keyboard

Tab order is unchanged: Clear → Autopilot → Close → Destination → Faction → Standing → Zoom in → Zoom out → Reset view. SVG hits stay pointer-only. Dest select remains the dest keyboard path. Escape still closes. KeyM close still skips typing focus on dest and filter selects. This restore does not add `tabindex` on discs (would fight overlay tab order; contract forbids SVG roving tabindex).

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Hover readout can stay on the down system while the map pans

**Location:** `src/systems/galaxychart.js:1306–1314`
**Issue:** `pointerover` returns while `panDrag.moved`. `pointermove` does not call `clearHover()`. The hover ring and `aria-live` inspect line can name the system under the initial down while the viewBox slides. Hover still does not plot.
**Fix (JS only; do not edit `hud.css`):** In `pointermove`, when `panDrag.moved` becomes true, call `clearHover()`. Do not plot from hover.
**Status:** open. Not a Blocker: inspect is stale only for the length of the drag; plot path is separate.

#### 🟡 Minor: `.is-panning` grabbing cursor loses to hit/label `cursor: pointer`

**Location:** existing `hud.css:2249–2251` vs `hud.css:2336–2341`, `2352–2358`
**Issue:** During a drag that starts on a disc or name, the child `cursor: pointer` wins over inherited `grabbing`. The hand does not switch to grabbing until the pointer leaves that target. Pan still works.
**Fix:** HUD-07 owns CSS. Out of write-set this restore. Optional later: `.rw-galaxy-svg.is-panning, .rw-galaxy-svg.is-panning * { cursor: grabbing; }`. Do not grow hit discs. Do not demand a CSS edit in this pass.
**Status:** open. Visual only. Do not block DONE.

### Suggestions

#### 💡 Suggestion: Consume `panMovedThisGesture` on the skipped click

**Location:** `src/systems/galaxychart.js:1294–1298`
**Issue:** After a pan, the flag stays true until the next `pointerdown` or `setOpen(true)`. A synthetic `click` with no later `pointerdown` still no-ops. Live browsers send `pointerdown` before `click`. WAVE85 opens the chart first, which clears the flag.
**Fix:** None required for players. Optional: set `panMovedThisGesture = false` after the click listener returns early. Do not plot that trailing click.

#### 💡 Suggestion: Desc still omits pan

**Location:** `src/systems/galaxychart.js:266`
**Issue:** Copy says click a system to plot, M or Escape. It does not say drag pans. `aria-describedby` points at this node (`galaxychart.js:209`). Dest select already covers keyboard plot.
**Fix:** Optional `textContent` tweak. Keep the desc id. Do not mention clues.

#### 💡 Suggestion: `pointercancel` before the 4 px slop still plots

**Location:** `src/systems/galaxychart.js:1246–1247`, `1290–1292`
**Issue:** Cancel with `!drag.moved` calls `plotFromGesture`. An OS steal (touch scroll, capture loss) under 4 px can plot. Rare: SVG `touch-action: none` already blocks default pan (`hud.css:2245`).
**Fix:** Treat `pointercancel` as abort (`moved` or skip plot). Keep `pointerup` click-under-slop behavior.

### States

| State | Live |
|---|---|
| Click / tap on hit or label | `click` and/or `pointerup` `!moved` → `activateSystem` (`galaxychart.js:1247`, `1294–1298`) |
| Drag ≥ 4 CSS px | `moved`; `.is-panning`; `click` skipped; no plot |
| Drag < 4 CSS px | still plot (acceptance) |
| Click current system | `clearRoute` (`galaxychart.js:1190–1191`) |
| WAVE85 click, no pointer | plots; open reset cleared flags (`galaxychart.js:944–947`) |
| Same tap `pointerup` + `click` | second call skipped (`plottedIdThisGesture`) |
| Hover | inspect only; skipped while panning |
| Filter / zoom-hidden target | no plot (`targetHidden`) |
| Keyboard dest | `#rw-galaxy-dest` `change` (`galaxychart.js:1203–1207`) |
| Loading | none (session DOM; no fetch) |

### Theming

No new color. Pan feedback is cursor + optional `.is-panning` class. Hits stay transparent fill. Plot vs hover vs current still use stroke pattern, not hue alone. `body.rw-colorblind` / `body.rw-contrast` already wrap `.rw-galaxy-chart`. This restore adds no hex in JS.

### Closed this restore (WAVE85)

#### Closed: Click-to-plot dead after click-vs-drag

**Was:** Plot lived only on `pointerup`. WAVE85 dispatched `click` with a hit `target` and never sent pointer events, so `livePlot` stayed false.
**Now:** `galaxychart.js:1294–1298` plots from `click` when `open` and `!panMovedThisGesture`. `plotFromGesture` + `pointerup` still serve a real pointer tap. Pan ≥ 4 CSS px does not plot.

### Out of scope this pass (do not reopen)

Itinerary last-hop copy, itinerary keyboard scroll, stale hit radii after itinerary layout, dest `option.hidden` vs omit, zoom min/max disabled, zoom-in label cull, filter-row wrap, filter persist on close, HUD-07 CSS token nits. Do not grow `HIT_CSS_DIAMETER`. Do not put discs in tab order. Do not plot on hover. Do not add `preventDefault`. Do not start Vite.

### Worker self-audit

Worker `out/w129/chartread/wave85-click.md` is accurate: click listener restored, pan kept, same-id guard, hover inspect only, dest/zoom/filters/itinerary untouched, no `preventDefault`. It correctly calls no Blocker/Major. It did not name stale hover-during-pan or grabbing-vs-pointer cursor. Those stay 🟡. The consume-flag note stays 💡. Do not reopen dest-select deletion. Do not raise z. Do not demand `hud.css` edits for this restore.

### Verdict

**CLEAN** (no open Blocker/Major). Pass with minors.

- 🔴 Blocker: 0
- 🟠 Major: 0
- 🟡 Minor: 2 (stale hover while panning; grabbing cursor under hits)
- 💡 Suggestion: 3
- Closed: WAVE85 click-to-plot after click-vs-drag
