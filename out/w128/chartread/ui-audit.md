# UI Audit: NAV-09 leftover chart readability (Wave 128)

### Summary

No product chrome ships this wave. Spec picture: open Galaxy Chart, **zoom/pan** the 101-system map, **filter** dest options and discs by faction/standing, read **names at the active zoom**, and inspect a **hop itinerary** without deleting `#rw-galaxy-dest`. Keys stay M / Escape. Color is not the only cue. Digit 0/8/9 stay. Hub stays empty 80 px. Leftover stays **REAL**. `reducedMotion`: instant pan/zoom; no inertia required.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit of later player outcome. Did **not** start Vite or Chrome. `[NO BROWSER COVERAGE]`. This leftover **is** UI policy — audit not skipped. Reduced coverage: live zoom not run.

### What's done well

- Reuses live `.rw-galaxy-chart` dialog (`galaxychart.js` **129–136**; `hud.css` **1967–1985**) and live NAV-01 `plotRoute`. Dest `<select id="rw-galaxy-dest">` stays **under the desc**.
- Live close already named: M, Escape, `aria-label` Close galaxy chart (**177–179**, **735**, **764–788**). Search/filter typeahead uses the **existing** KeyM `isTypingFocus` skip. Escape still closes.
- Accessible dest names already live on HTML options (`textContent`), not on SVG `role=img` children (**252–258**). Filters shorten that list instead of inventing a second unnamed widget.
- Tab order freeze: Clear / Autopilot / Close stay top actions. Dest stays under desc. New filter/zoom controls are **labeled** and 24 px min (`hud.css` dest/button already **2042–2056**, **2106–2117**). **No** 101-disc tab trap. **No** autofocus on open (NAV-06 blur still works).
- Hover stays inspect (`role=status` **376–377**). Plot stays a click/change. Color is not the only plot cue: dest square + plot stroke + status text already exist (**565–605**). Itinerary adds **text** fields (faction, rank, gate, risk).
- Empty hub freeze: no chart pip on `.rw-reticle` (`hud.css` **184–193**).
- `aria-modal=false` (**133**) stays honest: zoom/filter does not pause the sim.
- `body.rw-reduced-motion` already kills chart animation (`hud.css` **2373–2376**). Deputize matches: no inertial pan.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): full-network static view is unreadable

**Location:** `galaxychart.js` **254** static `viewBox`; no wheel (**inventory §2**).

**Issue:** Inbox P1. 101 discs fit one panel. Individual systems and route consequences are hard to inspect.

**Fix landed (markdown):** session zoom/pan; wheel + drag; Zoom in / Zoom out / Reset **buttons** as the non-pointer path.

**Status:** closed in contract §0.1 / §0.14.

#### 🟠 Major (closed in freeze): dest list too long; no faction/standing filter

**Location:** dest loop **209–228** (101 options).

**Issue:** Native typeahead is search-by-name. It does not answer “show Red Ledger / Marked only.” Deleting the select would steal NAV-07.

**Fix landed (markdown):** keep `#rw-galaxy-dest`; labeled Faction / Standing `<select>`s filter options **and** discs. Current + plotted dest stay listed.

**Status:** closed in contract §0.4 / §0.1.

#### 🟠 Major (closed in freeze): no hop itinerary

**Location:** plot status **602–605** `{name} · N jumps` only.

**Issue:** Player cannot read per-hop faction, standing, gate type, or known risk without hovering each disc.

**Fix landed (markdown):** `#rw-galaxy-itinerary` under dest; `ol`/`li` `textContent`; hidden when no plot.

**Status:** closed in contract §0.1.

#### 🟡 Minor (closed in freeze): generated systems unlabeled until zoom

**Location:** labels **340–351** (12 names).

**Issue:** Zoom-out stays readable (thin labels). Zoom-in must name in-view systems without covering Autopilot (discs stay 24 CSS px).

**Fix landed (markdown):** extra labels at scale ≥ 2 in view; still `activateSystem`; `HIT_CSS_DIAMETER` unchanged.

**Status:** closed in contract §0.1.

#### 🟡 Minor (closed in freeze): pointer zoom without keyboard equivalent

**Location:** honor keyboard / hit targets.

**Issue:** Wheel-only zoom fails non-pointer play.

**Fix landed (markdown):** Zoom in / Zoom out / Reset buttons, min 24 px, `aria-label`s. Dest select remains the dest keyboard path.

**Status:** closed in contract §0.14.

#### 🟡 Minor: itinerary + hover + plot-status stack

**Location:** panel column **394–400**; hover min-height `hud.css` **2307–2321**.

**Issue:** Adding an itinerary list can shrink the SVG on short viewports.

**Fix landed (markdown):** itinerary under dest, **before** SVG; hide when no plot; do not cover Autopilot/Close; do not raise z. Impl wave must keep SVG `min-height: 0` (`hud.css` **2128–2132**) and allow itinerary to scroll (`overflow: auto`, max-height) if hop count is large.

**Status:** accepted as impl constraint; not a Blocker. Documented here so PR1 does not pin a 20-hop list over the map.

#### 💡 Suggestion: desc copy still says “Click a system… M or Escape closes.”

**Location:** desc **192**.

**Issue:** After PR1, players also zoom, filter, and read itinerary. Optional `textContent` tweak (not `innerHTML`).

**Status:** optional; do not block PR1.

### Accessibility freeze (later PR1)

- Labeled controls: Destination, Faction, Standing, Zoom in/out/Reset.
- `:focus-visible` matches live chart buttons (`hud.css` **2071–2080**, **2120–2125**).
- Itinerary is text, not color-only. Gate vs hub already differs by dash on the SVG; itinerary repeats the token in words.
- Contrast / colorblind body classes already wrap `.rw-galaxy-chart` (`hud.css` **2344–2371**). New strokes must keep a non-color cue.
- Do not autofocus zoom or filter on open.
- Hit targets ≥ 24 CSS px.
