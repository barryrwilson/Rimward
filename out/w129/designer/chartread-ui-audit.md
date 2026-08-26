## UI Audit: NAV-09 PR1 Galaxy Chart readability (`galaxychart.js` + `.rw-galaxy-*`)

**Persona:** designer (parent pass). Review only. Did not edit `src/systems/galaxychart.js` or `src/ui/hud.css`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Honor + merge law from `docs/Nav09ChartReadabilityDesign.md` / `out/w128/chartread/shared-contract.md`. Live cite `src/systems/galaxychart.js` and `src/ui/hud.css` `.rw-galaxy-*` only.
**Worker self-audit:** `out/w129/chartread/ui-audit.md` — checked, not rubber-stamped. Worker Blocker/Major call is correct. Extra Minors below are remaining polish, not reopen of dest-select or AP/Close.
**Coverage:** Code review of shipped PR1 chrome. `[NO BROWSER COVERAGE]`. No stills under `out/w129/chartread/` besides markdown. Graph resolve: `proceed_unmodeled`.

### Summary

PR1 adds Zoom in / Zoom out / Reset view buttons, Faction / Standing filters, zoom-aware SVG names, and a scrolling hop itinerary. `#rw-galaxy-dest` stays. Autopilot / Close stay in the header cluster. Overlay z-index stays 30. The chart still does not pause. No 🔴 Blocker. No 🟠 Major.

### What's done well

- Dest `<select id="rw-galaxy-dest">` kept with `<label for="rw-galaxy-dest">` (`galaxychart.js:267–276`). Native typeahead remains search. Filters hide options; they do not replace the control (`galaxychart.js:869–872`).
- Zoom controls are real `<button type="button">` with visible text matching `aria-label` (`Zoom in` / `Zoom out` / `Reset view`), ids `rw-galaxy-zoom-in|out|reset` (`galaxychart.js:359–381`). CSS `min-height` / `min-width` 24 px (`hud.css:2177–2188`). They sit in `.rw-galaxy-zoom-cluster`, **not** in `.rw-galaxy-ap-cluster` (`galaxychart.js:238–255` vs `359–387`).
- Filters are labeled `<select>`s (`Faction` / `Standing`) (`galaxychart.js:307–357`; `hud.css:2137–2166`). Dest stays on its own row (`hud.css:2090–2096`) so typeahead width is not crushed.
- Itinerary is `#rw-galaxy-itinerary` with heading `Itinerary`, `ol`/`li` + `textContent` (`galaxychart.js:389–400`, `919–922`). Idle: `hidden` + `aria-hidden="true"` (`galaxychart.js:392–393`, `876–882`). `overflow: auto` + `max-height: min(22vh, 160px)` (`hud.css:2201–2208`). In-flow under dest/filters, before the SVG — does not cover Autopilot / Close. z-index unchanged (`hud.css:1977`).
- Color is not the only cue: hop lines name faction / standing / gate / risk in words (`galaxychart.js:909`); SVG gates vs hub routes vs plot still use dash vs solid (`hud.css:2244–2286`); current system keeps thick stroke + dashed marker (`hud.css:2296–2298`, `2365–2371`); dest is a square, blocked is a dashed square (`galaxychart.js:1029–1036`, `1067–1074`).
- `textContent` only. No `innerHTML` / `insertAdjacentHTML` / `document.write` in `galaxychart.js`.
- KeyM stays. Close skip uses `isTypingFocus()` plus dest **and** filter select ids (`galaxychart.js:1297–1314`). Escape still closes (`galaxychart.js:1321–1322`). No second KeyM listener.
- Overlay never writes `flags.paused` (read-only at `galaxychart.js:1316`). `aria-modal="false"` (`galaxychart.js:206`). `canOpenPlayCard(ctx, 'chart')` still gates open (`galaxychart.js:933–934`).
- `body.rw-reduced-motion` kills animation/transition on `.rw-galaxy-chart *` (`hud.css:2494–2498`). Pan/zoom is instant `viewBox` write (`galaxychart.js:792–798`, `812–826`); no inertia.
- Hit discs stay `HIT_CSS_DIAMETER = 24` (`galaxychart.js:50`). `updateHitRadii` uses current `viewBox` scale (`galaxychart.js:957–967`). Hidden discs use `visibility` + `pointer-events: none`, not removal from `nodesById` (`hud.css:2352–2360`; `galaxychart.js:851–857`).
- Focus / hover rings reuse chart tokens (`--rw-accent`, `--panel-edge`, `--white`) (`hud.css:2159–2166`, `2193–2198`). No autofocus on open (`galaxychart.js:941–944`). 101 discs stay out of tab order; dest select is the dest keyboard path.
- HUD-01 80 px hub stays empty (`hud.css:184–193`). Chart root appends to `document.body` (`galaxychart.js:587`), not `#hud` / `.rw-reticle`.
- NAV-06 Autopilot **button** success still `setOpen(false)` (`galaxychart.js:1161`). `showApLive` body unchanged (`galaxychart.js:1099–1103`). Hover still inspects, does not plot (`galaxychart.js:1284–1288`).
- Fit view keeps authored ∪ pinned ∪ hub names; scale ≥ 2 names in-view systems (`galaxychart.js:45`, `520–532`, `778–789`). Close resets fitted view (`galaxychart.js:945–946`, `801–809`).

### Honor checklist

| Check | Result | Cite |
|---|---|---|
| Dest `#rw-galaxy-dest` stays | Pass | `galaxychart.js:271–276` |
| KeyM stays | Pass | `galaxychart.js:1297–1320` |
| Overlay never paused | Pass | no `flags.paused` write; `galaxychart.js:206`, `1316` |
| Buttons ≥ 24 px | Pass | `hud.css:2052–2053`, `2187–2188` |
| `textContent` only | Pass | itinerary `galaxychart.js:921`; grep 0 `innerHTML` |
| Color is not the only cue | Pass | hop words + dash/ring/square |
| `reducedMotion`: instant pan/zoom | Pass | `hud.css:2494–2498`; no inertia JS |
| Do not cover Autopilot / Close | Pass | zoom/itinerary not in AP cluster; itinerary in-flow |
| z-index ladder unchanged | Pass | `hud.css:1977` still 30 |
| HUD-01 hub empty (chart is overlay) | Pass | `hud.css:184–193`; `galaxychart.js:587` |

### Keyboard

Tab order: Clear → Autopilot → Close (header) → Destination → Faction → Standing → Zoom in → Zoom out → Reset view. SVG hits are pointer-only. Dest select remains the dest keyboard path. Filter SELECT focus does not close on KeyM. Escape still closes.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Last itinerary hop prints gate type `unknown`

**Location:** `src/systems/galaxychart.js:903–909`
**Issue:** Path length ≥ 2 includes the destination as the last id. That row has no next hop, so the line is `{name} — {faction} — {rank} — unknown — {risk}`. That reads like a data hole, not “no outgoing gate.”
**Fix:** Last row: omit the gate token or use `destination`. Intermediate rows keep `gate` / `hub route` / `gate + hub` / `unknown`.
**Status:** open. Worker code-review accepted fail-closed; copy still hurts the decision table.

#### 🟡 Minor: Dest filter uses `option.hidden` instead of omit

**Location:** `src/systems/galaxychart.js:869–872`
**Issue:** Acceptance is to **shorten** the dest list. `hidden` on `<option>` is not reliable in every browser (Safari historically still lists the row). `disabled` would also keep length. AT can still hear a long list where `hidden` is ignored.
**Fix:** Omit failed options from the list (rebuild or detach). Always keep placeholder, current system, and plotted dest. Do not use `disabled` as the only filter.
**Status:** open. `hidden` is better than `disabled`; omit is the robust shorten.

#### 🟡 Minor: Zoom in / Zoom out have no min/max disabled state

**Location:** `src/systems/galaxychart.js:51–53`, `760–772`, `1209–1211`; `hud.css:2177–2198`
**Issue:** Scale clamps 1..8, but the buttons stay enabled. At fit, Zoom out is a silent no-op. At max, Zoom in is a silent no-op. Autopilot already has `disabled` / `aria-disabled` / `is-dim` (`galaxychart.js:1117–1143`).
**Fix:** At fit, disable Zoom out (keep Reset enabled). At max, disable Zoom in. Reuse the AP dim pattern. Do not drop the 24 px target.
**Status:** open. Not a Blocker: clamp still works.

#### 🟡 Minor: Zoom-in labels can collide; SVG type is in user units

**Location:** `src/systems/galaxychart.js:778–789`; `hud.css:2343–2350` (`font-size: 15px` on `.rw-galaxy-label`)
**Issue:** Scale ≥ 2 still shows about a quarter of the rim. Generated names sit on the same `text-anchor: middle` baseline. Label size is SVG user units, so type grows with zoom (small at fit, large at scale 8). Overlap is not “clearer labels.” Dest select + hover remain the a11y name path.
**Fix:** Show in-view names. If two label boxes overlap, keep authored ∪ pinned ∪ hub, then cull the rest. Do not grow `HIT_CSS_DIAMETER`. Owner may retune the scale ≥ 2 gate after playtest. Optional: cap CSS px via a screen-space label layer later; not required to invent a second layout engine in this PR.
**Status:** open. Playtest may retune.

#### 🟡 Minor: Scrollable itinerary is not keyboard-focusable

**Location:** `hud.css:2201–2208`; `galaxychart.js:389–400`
**Issue:** The list scrolls at `max-height: min(22vh, 160px)`. The `<section>` has no `tabindex`. A long hop list clips for a keyboard user who cannot move a pointer onto the pane. Screen readers still walk the `ol`. Short plots fit; long plots do not.
**Fix:** `tabindex="0"` on `#rw-galaxy-itinerary` when shown, or rely on the `ol` being fully in the accessibility tree and keep the cap near four–eight lines so clip is rare. Do not raise z. Do not cover Autopilot / Close.
**Status:** open.

#### 🟡 Minor: Itinerary paint can stale 24 CSS px hit discs

**Location:** `src/systems/galaxychart.js:885–925`, `957–967`, `1366–1372`
**Issue:** `updateHitRadii` runs from `applyView` (zoom / pan / resize). `paintItinerary` can add ~160 px of chrome and shrink the SVG without `applyView`. Hit radius in chart units then maps to **less** than 24 CSS px until the next zoom/pan/resize.
**Fix:** Call `updateHitRadii()` (or `applyView()`) after itinerary show/hide. Keep `HIT_CSS_DIAMETER` at 24.
**Status:** open. Discs stay clickable; honor 24 px can dip until the next view apply.

### Suggestions

#### 💡 Suggestion: Chart desc still omits zoom / filter / itinerary

**Location:** `src/systems/galaxychart.js:265`
**Issue:** Copy is names, factions, gates, click-to-plot, M or Escape. Players also zoom, filter, and read hops. `aria-describedby` points at this node (`galaxychart.js:208`).
**Fix:** Optional `textContent` tweak. Keep the desc id.

#### 💡 Suggestion: Filters survive close; only the view resets

**Location:** `src/systems/galaxychart.js:25` (comment), `941–946`
**Issue:** Close resets fitted `viewBox`. Faction / Standing `<select>` values persist for the session because the dialog DOM is not rebuilt. Reopen can look like a sparse map until the player notices the filters.
**Fix:** Optional: reset filter selects to `All` in `setOpen(false)`, then `applyFilters()`. Session-while-open is also defensible; document it if kept.

#### 💡 Suggestion: No zoom-level status for AT

**Location:** `src/systems/galaxychart.js:359–381`
**Issue:** Buttons change scale with no live “scale 2 of 8” line. Plot status / hover already use `aria-live`. A third live region would double-speak.
**Fix:** Optional `aria-disabled` at ends (Minor above) is enough. Do not add a new assertive live region.

#### 💡 Suggestion: Standing `Unknown` also matches independents

**Location:** `src/systems/galaxychart.js:674–678`, `354–357`
**Issue:** Faction filter can pick Independent. Standing `Unknown` also includes independent / missing bag (`standingBandOf(..., true)`). Two doors, same systems.
**Fix:** Keep the freeze. Do not add a third standing option named Independent.

### States

| State | Live |
|---|---|
| Empty itinerary | `hidden` + `aria-hidden` when `status !== 'plotted'` or path length < 2 (`galaxychart.js:894–896`) |
| Blocked | hop list hidden; plot status `No route from here.` (`galaxychart.js:1077`) |
| Arrived | hop list hidden; `Arrived · {name}` on plot status (`galaxychart.js:1082–1088`) |
| Filter empty map | current + plotted dest/hops stay via `mapAnchors` (`galaxychart.js:704–723`, `851–852`) |
| Disabled zoom | **missing** (Minor) |
| Focus / hover | rings on dest / filters / zoom; hover inspects, does not plot |
| Loading | none (session DOM; no fetch) |
| Error | fail closed: unknown id ignore; missing standing → Unknown |

### Theming

New chrome uses `--panel-edge`, `--white`, `--dim`, `--rw-accent`. `body.rw-colorblind` / `body.rw-contrast` already wrap `.rw-galaxy-chart` (`hud.css:2465–2492`). No new one-off hex on the filter/zoom/itinerary block. Unreachable plot already has a dash cue plus colorblind stroke retint.

### Worker self-audit

Worker `out/w129/chartread/ui-audit.md` is accurate on dest keep, 24 px zoom buttons, itinerary scroll cap, focus rings, reduced-motion instant pan, and filter-row wrap as non-blocking. It did not name last-hop `unknown`, `option.hidden` vs omit, zoom disabled-at-clamp, itinerary keyboard scroll, or stale hit radii after itinerary layout. Those stay 🟡. Do not reopen dest-select deletion. Do not raise z. Do not put zoom in the Autopilot / Close cluster.

### Verdict

**CLEAN** (no open Blocker/Major). Pass with minors.

- 🔴 Blocker: 0
- 🟠 Major: 0
- 🟡 Minor: 6
- 💡 Suggestion: 4
