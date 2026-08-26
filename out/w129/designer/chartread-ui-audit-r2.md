## UI Audit: NAV-09 itinerary re-dispatch (`paintItinerary` / `#rw-galaxy-itinerary`)

**Persona:** designer (parent pass, r2). Review only. Did not edit `src/systems/galaxychart.js` or `src/ui/hud.css`. Did not start Vite or Chrome. Did not spawn other agents.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Scope is `paintItinerary` / itinerary DOM plus **existing** itinerary CSS. HUD-07 owns `hud.css`; this pass does **not** demand CSS edits.
**Re-dispatch target:** leg rows `path[i]→path[i+1]`; no last-hop `unknown` on the destination node. Honor `docs/Nav09ChartReadabilityDesign.md` acceptance item 6.
**Worker self-audit:** `out/w129/chartread/ui-audit.md` — checked, not rubber-stamped. Worker Blocker/Major call is correct. Prior r1 Minor “last itinerary hop prints gate type `unknown`” is **closed** in live JS.
**Coverage:** Code review of live itinerary paint. `[NO BROWSER COVERAGE]` this pass. `out/w129/chartread/verify/04-itinerary-veridian.png` still shows the **old** origin + dest-`unknown` two-row copy; it is not a live cite for this re-dispatch. Graph resolve: `proceed_unmodeled` (`r-mt9omg1u-14b2464e`).

### Summary

`paintItinerary` now emits one `<li>` per plotted **leg**, not per path node. A 1-jump plot is one arrival row whose gate token is `gateTypeToken(from, to)`. The destination is no longer a hop with no next id, so last-row `unknown` is gone unless the edge really has no gate and no hub. Empty / idle / blocked / arrived still hide the pane. No 🔴 Blocker. No 🟠 Major.

### What's done well

- Itinerary chrome is still `#rw-galaxy-itinerary` (`section`) + `h3` `Itinerary` + `ol.rw-galaxy-itinerary-list` (`galaxychart.js:389–400`). In-flow after dest/filters, before the SVG (`galaxychart.js:577–581`). Does not sit in `.rw-galaxy-ap-cluster`. Does not cover Autopilot / Close.
- Idle and fail-closed hide: `hidden` + `aria-hidden="true"`, and the list is cleared when the last key was non-empty (`galaxychart.js:392–393`, `876–882`, `926–928`). Shown only when `status === 'plotted'` and `path.length >= 2` (`galaxychart.js:892–896`).
- Leg loop is `i` in `0 .. path.length-2` with `Object.hasOwn` on both ends (`galaxychart.js:899–910`). Identity fields read **arrival** `to`. Gate token is `gateTypeToken(from, to)` (`galaxychart.js:907`, `154–162`). `unknown` remains only when neither `hasGateTo` nor `hasHubRouteTo`.
- A 1-jump path (`length === 2`) paints **one** row. Spec: not an origin line plus dest-`unknown` (`docs/Nav09ChartReadabilityDesign.md` acceptance 6). Origin is not hop 0; current-system chrome already names “here.”
- Copy is `textContent` only (`galaxychart.js:920–922`). No `innerHTML` / `insertAdjacentHTML` / `document.write` in `galaxychart.js`.
- Color is not the only cue: each row names faction, standing band, gate type, and known risk in words (`galaxychart.js:904–909`). Gate words match legend tokens (`gate` / `hub route` / `gate + hub`) (`galaxychart.js:154–162`, `406–415`).
- Known risk is recorded standing plus authored `cast.pirates` (`galaxychart.js:690–696`, `164–171`). No clue / landmark `line`.
- `lastItinKey` includes status, path, and row text (`galaxychart.js:911–916`). `update()` paints every open frame (`galaxychart.js:1372`) but the key skip keeps the `ol` and scroll position. Standing edits still rebuild because rank/risk sit in `parts`.
- Existing itinerary CSS (HUD-07; **do not edit this pass**): `max-height: min(22vh, 160px)` + `overflow: auto` (`hud.css:2201–2208`). Title uses `--dim`; list uses `--white` (`hud.css:2211–2226`). `flex-shrink: 0` keeps the pane from crushing under the SVG. z-index ladder stays 30 (`hud.css:1977`). `body.rw-reduced-motion` already kills animation/transition on `.rw-galaxy-chart *` (`hud.css:2494–2498`).

### Honor checklist (itinerary only)

| Check | Result | Cite |
|---|---|---|
| Leg rows `path[i]→path[i+1]` | Pass | `galaxychart.js:899–910` |
| 1-jump = one arrival row | Pass | loop bound `path.length - 1`; hide if `path.length < 2` (`galaxychart.js:894–896`) |
| Last hop is not dest-`unknown` | Pass (closed) | gate from previous id (`galaxychart.js:901–907`) |
| No plot → hidden | Pass | `galaxychart.js:888–896`, `876–878` |
| `textContent` only | Pass | `galaxychart.js:921`; grep 0 `innerHTML` |
| Color is not the only cue | Pass | gate/faction/standing/risk words |
| Do not cover Autopilot / Close | Pass | in-flow `galaxychart.js:581`; not in AP cluster |
| No clue / landmark prose | Pass | `knownRiskText` standing + pirates only |
| Do not demand `hud.css` edits | Pass | existing itinerary rules cited only |

### Keyboard

Tab order does not include the itinerary pane (no `tabindex` on `#rw-galaxy-itinerary`). Screen readers still walk the `ol` when the pane is shown (`aria-hidden="false"`). Dest `<select>` remains the dest keyboard path. Escape still closes the overlay. This pass does not ask for CSS changes to tab order.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Scrollable itinerary is not keyboard-focusable

**Location:** `src/systems/galaxychart.js:389–400`; existing `hud.css:2201–2208`
**Issue:** The pane scrolls at `max-height: min(22vh, 160px)`. The `<section>` has no `tabindex`. A long hop list clips for a keyboard user who cannot put a pointer on the pane. AT can still walk the `ol`. Short plots fit; long plots do not.
**Fix (JS only; do not edit `hud.css`):** When shown, set `tabindex="0"` on `#rw-galaxy-itinerary`. When hidden, remove it. Do not raise z. Do not cover Autopilot / Close. Keep the existing 160 px cap.
**Status:** open. Same as r1. Not a Blocker: the list stays in the accessibility tree; clip is rare for short plots.

#### 🟡 Minor: Itinerary show/hide can stale 24 CSS px hit discs

**Location:** `src/systems/galaxychart.js:885–925`, `957–967`, `1366–1372`
**Issue:** `updateHitRadii` runs from `applyView` (zoom / pan / resize). `paintItinerary` can add or drop ~160 px of chrome and shrink the SVG without `applyView`. Hit radius in chart units then maps to **less** than 24 CSS px until the next zoom/pan/resize.
**Fix:** Call `updateHitRadii()` (or `applyView()`) after itinerary show/hide. Keep `HIT_CSS_DIAMETER` at 24. Do not change itinerary CSS.
**Status:** open. Same as r1. Discs stay clickable; honor 24 px can dip until the next view apply.

### Suggestions

#### 💡 Suggestion: Hide when every leg sanitizes empty

**Location:** `src/systems/galaxychart.js:898–925`
**Issue:** A plotted path of length ≥ 2 with no valid `from`/`to` pairs still shows the heading and an empty `ol` (`hidden = false`). Missing empty state.
**Fix:** If `parts.length === 0`, call `hideItinerary()`. Live NAV-01 paths are sanitized ids; not an acceptance miss.

#### 💡 Suggestion: Origin is no longer a list row

**Location:** `src/systems/galaxychart.js:899–910`
**Issue:** The list no longer repeats the current system as hop 0.
**Fix:** None required. Each row is a decision about the next arrival. Matches the re-dispatch spec (leg rows).

#### 💡 Suggestion: Do not add an itinerary live region

**Location:** `src/systems/galaxychart.js:389–400`, `571–575`
**Issue:** Plot status already uses `aria-live="polite"`. The hop `ol` updates in place. A second live region would double-speak name and jump count.
**Fix:** Keep the `ol` as a static (when shown) list. Dest select + plot status remain the AT plot path.

### States

| State | Live |
|---|---|
| Empty / no plot | `hidden` + `aria-hidden` when no bag, `status !== 'plotted'`, or path length < 2 (`galaxychart.js:888–896`) |
| 1-jump plotted | one `<li>`: arrival name, faction, standing, `gateTypeToken(from,to)`, risk |
| Multi-hop plotted | `path.length - 1` rows; last row is dest with gate from previous hop |
| Blocked / arrived | hop list hidden (`galaxychart.js:894–896`; retarget still paints plot status) |
| Clear route | `hideItinerary` via `paintItinerary` after bag drop (`galaxychart.js:1002–1006`) |
| Fail closed | `catch` → `hideItinerary` (`galaxychart.js:926–928`) |
| Keyboard scroll | **missing** (Minor; JS `tabindex` only) |
| Loading | none (session DOM; no fetch) |

### Theming

Existing itinerary block uses `--dim` / `--white` for type (`hud.css:2211–2226`). The pane border is `rgba(111, 242, 224, 0.12)` (`hud.css:2207`). HUD-07 owns `hud.css`; this audit does not demand a token swap. `body.rw-colorblind` / `body.rw-contrast` already wrap `.rw-galaxy-chart` (`hud.css:2465–2492`). No itinerary-only hex in JS.

### Closed from r1 (itinerary)

#### Closed: Last itinerary hop prints gate type `unknown`

**Was:** `galaxychart.js` listed every path **node**. The dest row had no next hop, so `gateTypeToken` saw no pair and printed `unknown`.
**Now:** `galaxychart.js:899–910` lists **legs**. Gate is always `from → to`. Fail-closed `unknown` only when that edge has no gate and no hub (`galaxychart.js:154–162`). NAV-01 `canTransit` uses the same gate/hub neighbor set (`nav.js:81–124`), so a live plotted edge should not print `unknown`.
**Still stale:** `out/w129/chartread/verify/04-itinerary-veridian.png` (two rows, dest `unknown`). Do not treat that still as live copy.

### Out of scope this pass (do not reopen)

Dest `#rw-galaxy-dest` keep, filter `option.hidden` vs omit, zoom min/max disabled, zoom-in label cull, filter-row wrap, chart desc copy, filter persist on close. HUD-07 owns itinerary CSS; do not file CSS-only fixes here.

### Worker self-audit

Worker `out/w129/chartread/ui-audit.md` is accurate on dest keep, leg identity, idle hide, and `textContent`. It correctly closes last-hop `unknown`. Remaining itinerary polish (keyboard scroll, stale hit radii) stays 🟡. Empty-`ol` hide is 💡. Do not reopen dest-select deletion. Do not raise z. Do not put the itinerary in the Autopilot / Close cluster. Do not demand `hud.css` edits.

### Verdict

**CLEAN** (no open Blocker/Major). Pass with minors.

- 🔴 Blocker: 0
- 🟠 Major: 0
- 🟡 Minor: 2 (keyboard scroll; stale hit radii after itinerary layout)
- 💡 Suggestion: 3
- Closed r1 Minor: last-hop `unknown`
