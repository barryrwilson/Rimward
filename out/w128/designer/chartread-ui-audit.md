## UI Audit: NAV-09 leftover chart readability (Wave 128 designer)

**Persona:** designer (parent pass). Review only. Did not edit `src/systems/galaxychart.js`, `src/ui/hud.css`, or `docs/Nav09ChartReadabilityDesign.md`. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` + merge law `out/w128/chartread/shared-contract.md` (wins over `docs/Nav09ChartReadabilityDesign.md`) + inventory `out/w128/chartread/current-nav09-chart-inventory.md` + live cite `src/systems/galaxychart.js` / `src/ui/hud.css`.
**Worker self-audit:** `out/w128/chartread/ui-audit.md` — checked, not rubber-stamped. Worker Blocker/Major call is correct: leftover is UI policy, dest `<select>` stays, majors are closed in freeze. Extra Minors below are impl constraints for later PR1.
**Coverage:** Spec audit of later player outcome. `[NO BROWSER COVERAGE]`. Live zoom not run. Graph resolve for this pass returned a false-positive Activar stack (`omp/workflow-activar-knowledge-capture`, coverage ~0.09) that does not apply to WebSim; that workflow was not followed.

### Summary

No product chrome ships this wave. Later PR1 must keep `#rw-galaxy-dest`, add session zoom/pan with Zoom in/out/Reset **buttons**, filter dest **options** and discs by faction/standing, name in-view systems at scale ≥ 2, and paint a hop itinerary from recorded `world.nav` only. Color is not the only cue. Digit 0/8/9 stay. Hub stays empty 80 px. KeyM stays; typing skip stays. `reducedMotion`: instant pan/zoom. Catalog is **101** including `veil`. Leftover stays **REAL**. No 🔴 Blocker. No 🟠 Major (open).

### What's done well

- Dest `<select id="rw-galaxy-dest">` is frozen **kept** (`shared-contract.md:24`; live `galaxychart.js:202–230`). Filters may shorten options. They must not delete the NAV-07 a11y dest control or replace it with an unnamed listbox.
- Keyboard dest path stays native typeahead (`galaxychart.js:742–746`). Search does not require a second `<input>` (`shared-contract.md:82`). Extra search box is optional only after playtest.
- Non-pointer zoom/pan is frozen as labeled buttons `rw-galaxy-zoom-in` / `rw-galaxy-zoom-out` / `rw-galaxy-zoom-reset`, min 24 CSS px, matching `aria-label`s (`shared-contract.md:40,78,101`). Wheel/drag is pointer; buttons are the keyboard equivalent. Arrow pan on the SVG is optional, not required.
- KeyM close still skips `isTypingFocus()` and `#rw-galaxy-dest` (`galaxychart.js:766–779`; `overlay-policy.js:72–77` includes INPUT / TEXTAREA / SELECT). Escape still closes (`galaxychart.js:786–787`). No second KeyM listener. No KeyM remap.
- `body.rw-reduced-motion` already kills chart animation/transition (`hud.css:2373–2376`). Deputize matches: instant pan/zoom; no inertia (`shared-contract.md:39,78`).
- Hit discs stay 24 CSS px (`galaxychart.js:48`; `hud.css:2052–2053,2109`). Freeze does not grow `HIT_CSS_DIAMETER`. Drag vs plot uses a 4 CSS px threshold (`shared-contract.md:79`).
- Itinerary is an `ol`/`li` under dest, `textContent` only, hidden when no plot (`shared-contract.md:86–99`). Known risk is standing band + recorded `cast.pirates`. Clue / landmark `line` is forbidden (`shared-contract.md:44,88`; live file comment `galaxychart.js:18–23`).
- Catalog freeze is **101** (7 authored including Wave 94 `veil` + 94 generated) (`current-nav09-chart-inventory.md:14–20`; `galaxychart.js:54`). Do not hardcode 100.
- Overlay stays `aria-modal=false` (`galaxychart.js:133`). Chart never writes `flags.paused`. Empty 80 px hub stays empty (`hud.css:184–193`).
- Live buttons already have `:hover` / `:focus-visible` rings (`hud.css:2071–2080,2120–2125`). New zoom/filter controls must reuse that pattern.
- Autopilot already has disabled / `aria-disabled` / `is-dim` (`galaxychart.js:662–688`). NAV-06 button success close is cited, not stolen (`galaxychart.js:704–706`).
- Worker self-audit correctly refuses SVG roving tabindex on 101 discs and autofocus on open.

### Must-check (focus)

| Check | Result | Cite |
|---|---|---|
| Dest `<select id="rw-galaxy-dest">` kept | Pass (freeze) | `shared-contract.md:24,81`; `galaxychart.js:198–203` |
| Zoom/pan keyboard equivalent (buttons, ≥24 px) | Pass (freeze) | `shared-contract.md:40,78,101` |
| Filter shortens dest **options** and discs | Pass (freeze) | `shared-contract.md:83–86`; design acceptance 4 |
| Itinerary hop list scrolls; does not cover AP/Close | Pass (freeze) + Minor max-height | `shared-contract.md:86` |
| Labels at zoom (scale ≥ 2, in-view; 12 at fit) | Pass (freeze) + Minor collision | `shared-contract.md:80`; `galaxychart.js:340–351` |
| KeyM + `isTypingFocus` (SELECT/INPUT) | Pass (freeze) | `galaxychart.js:766–779`; `overlay-policy.js:72–77` |
| `reducedMotion` instant pan/zoom | Pass (freeze) | `shared-contract.md:39`; `hud.css:2373–2376` |
| Hit targets 24 CSS px; discs not grown | Pass (freeze) | `galaxychart.js:48`; `hud.css:2052–2054` |
| Itinerary recorded state only; no clue text | Pass (freeze) | `shared-contract.md:44,88`; `galaxychart.js:18–23` |
| 101-system density (incl. `veil`) | Pass (freeze) | inventory §0; `galaxychart.js:54` |
| Color not the only cue | Pass (freeze) | hop text tokens; live dash/ring/square (`hud.css:2134–2176`) |
| No autofocus on open | Pass (live + worker freeze) | no `focus()` on open in `galaxychart.js:482–502` |

### Findings

No 🔴 Blocker or 🟠 Major (open).

Live 101-disc static view, unfiltered dest list, 12 labels, and missing itinerary are **inbox holes**. The freeze closes them for later PR1. They are not product defects in this markdown wave.

#### 🟠 Major (closed in freeze): dest `<select>` deleted or replaced

**Location:** `src/systems/galaxychart.js:202`; `out/w128/chartread/shared-contract.md:24`
**Issue:** Deleting `#rw-galaxy-dest` would remove the only keyboard/AT dest control (NAV-07). A custom listbox would drop native typeahead and option names.
**Fix landed (markdown):** keep the named select; filter/group options. Census hole is **length**, not the widget.
**Status:** closed. Treat a later PR that removes the id as a **Blocker**.

#### 🟠 Major (closed in freeze): pointer-only zoom/pan

**Location:** live none (`galaxychart.js` no `wheel` / drag; inventory §2); honor `shared-contract.md:40,78`
**Issue:** Wheel-only zoom fails keyboard and non-pointer play.
**Fix landed (markdown):** Zoom in / Zoom out / Reset view buttons, min 24 CSS px, `aria-label`s. Dest select remains the dest keyboard path.
**Status:** closed in contract §0.14 / §0.1.

#### 🟠 Major (closed in freeze): 101-option dest list with no faction/standing filter

**Location:** `galaxychart.js:209–228`
**Issue:** Native typeahead searches names only. It does not answer “Red Ledger / Marked.”
**Fix landed (markdown):** labeled `#rw-galaxy-filter-faction` and `#rw-galaxy-filter-standing`; filter options **and** discs; current + plotted dest stay listed.
**Status:** closed. Acceptance says **shorten** options (see Minor on `disabled`).

#### 🟠 Major (closed in freeze): no hop itinerary / clue leak

**Location:** plot status `galaxychart.js:602–605`; content rule `galaxychart.js:18–23`
**Issue:** `{name} · N jumps` is not a decision table. Dumping landmark `line` would violate §25.
**Fix landed (markdown):** `#rw-galaxy-itinerary` under dest; fields from recorded standing + `cast.pirates`; hide when no plot / blocked.
**Status:** closed.

#### 🟡 Minor: itinerary `max-height` is not a number

**Location:** `out/w128/chartread/shared-contract.md:86`; live stack `galaxychart.js:394–400`; hover min-height `hud.css:2307–2321`; SVG `min-height: 0` `hud.css:2128–2132`
**Issue:** Freeze requires `overflow: auto` + a max-height if hops shrink the SVG. It does not name the cap. A 20-hop `ol` with no cap still eats the map on `height: min(760px, 88vh)` (`hud.css:1989–1993`). Hover stays in-flow when idle (`hud.css:2318–2321`).
**Fix:** Impl: `#rw-galaxy-itinerary { overflow: auto; max-height: 6.5em; }` (about four hop lines) or ≤ 22% of the panel. Keep SVG `flex: 1; min-height: 0`. Do not cover Autopilot / Close. Do not raise z.
**Status:** accepted as impl constraint; not a Blocker.

#### 🟡 Minor: `disabled` dest options would not shorten the list

**Location:** `shared-contract.md:24,81` (“hide/disable”); acceptance “shorten **options**”
**Issue:** Native `<select>` still lists `disabled` options. AT still hears 101 rows. Inbox length would remain. `hidden` on `<option>` is not reliable in every browser.
**Fix:** Prefer **omit** failed options from the list (rebuild or `display` via not appending). Always keep placeholder, current system, and plotted dest. Do not use `disabled` as the only filter.
**Status:** should-fix in PR1; acceptance already says shorten.

#### 🟡 Minor: zoom-in labels can collide at scale ≥ 2

**Location:** `shared-contract.md:80`; live labels `galaxychart.js:340–351`; type `hud.css:2233–2240` (15px, uppercase, letter-spacing 0.08em)
**Issue:** Scale 2 still shows about a quarter of the rim. A faction cluster can place many generated names on top of each other. Overlap is not “clearer labels.” Dest select + hover remain the a11y name path.
**Fix:** Show in-view names; if two label boxes overlap, keep authored ∪ pinned ∪ hub, then cull the rest. Do not grow `HIT_CSS_DIAMETER`. Owner may retune the 1.5–3 scale gate after playtest.
**Status:** impl constraint; playtest may retune. Not required to invent a second layout engine in PR1.

#### 🟡 Minor: filter + dest row can crush typeahead on 92vw

**Location:** freeze “next to Destination” `shared-contract.md:83–84`; live dest row `hud.css:2090–2096`; panel `width: min(1100px, 92vw)` `hud.css:1992`
**Issue:** One flex row with Destination + Faction + Standing (plus optional zoom buttons) can shrink the dest `<select>` below a usable typeahead width. Live dest already `min-width: 0` (`hud.css:2108`).
**Fix:** Wrap: dest row stays under desc; filter selects on the same wrap row or a second `flex-wrap` row. Zoom buttons sit with the map or that wrap row, **not** in the Autopilot / Close cluster (`galaxychart.js:149–187`). Each control `min-height: 24px`. Reuse `.rw-galaxy-dest` / button tokens (`--panel-edge`, `--white`, `--rw-accent`).
**Status:** should-fix in PR1 layout; do not steal header actions.

#### 🟡 Minor: last itinerary hop has no “next” gate

**Location:** `shared-contract.md:86–87` (“gate type to the **next** hop”); path paint `galaxychart.js:588–605`
**Issue:** Path length ≥ 2 includes the destination as the last id. That row has no next hop. Printing `unknown` looks like a data hole.
**Fix:** Last row: omit gate token or use `destination`. Keep name / faction / standing / known risk. Intermediate rows keep `gate` / `hub route` / `gate + hub` / `unknown`.
**Status:** should-fix in itinerary copy; not a Blocker.

#### 🟡 Minor: zoom buttons lack min/max and disabled states

**Location:** `shared-contract.md:78` (buttons named; no scale clamp)
**Issue:** Freeze does not name a max scale or a disabled Zoom in / Zoom out at the ends. Unbounded wheel zoom makes 101-system density unreadable again. Live AP already shows a disabled pattern (`galaxychart.js:667–671`).
**Fix:** Clamp session scale (fit = 1 through a max such as 8). At fit, disable Zoom out (keep Reset enabled). At max, disable Zoom in. `aria-disabled` + live dim class. `updateHitRadii` must use the **current** `viewBox` so hits stay 24 CSS px after zoom (`galaxychart.js:504–521` today uses init `viewW`/`viewH`).
**Status:** impl constraint for PR1.

#### 🟡 Minor: hop lines can overflow the panel

**Location:** hop template `shared-contract.md:98`; dest field width `hud.css:2090–2117`
**Issue:** `{name} — {faction} — {rank} — {gate} — {risk}` is long (Congregation name, pirate clause). `nowrap` would clip or grow the panel.
**Fix:** Allow wrap on `li`. Do not use `innerHTML`. Tokens `--white` / `--dim`, not a new hex. Color is not the only cue (words already are).
**Status:** should-fix in CSS.

#### 💡 Suggestion: desc still omits zoom / filter / itinerary

**Location:** `galaxychart.js:192`
**Issue:** Copy is “Click a system to plot a route. M or Escape closes.” After PR1, players also zoom, filter, and read hops.
**Fix:** Optional `textContent` tweak. Keep `aria-describedby` on the desc id (`galaxychart.js:135,190–191`).
**Status:** optional; do not block PR1.

#### 💡 Suggestion: KeyM fallback id list is dest-only

**Location:** `galaxychart.js:773–776`; new ids `rw-galaxy-filter-faction` / `rw-galaxy-filter-standing` / optional search INPUT
**Issue:** Happy path uses `isTypingFocus()` (all SELECT/INPUT). The catch fallback only treats `#rw-galaxy-dest` as typing. If the helper throws while a filter select is focused, KeyM would close.
**Fix:** Keep calling `isTypingFocus()`. Optional: treat filter/search ids like dest in the fallback. Do not add a second KeyM listener.
**Status:** optional belt-and-suspenders.

#### 💡 Suggestion: standing `Unknown` also matches independents

**Location:** `shared-contract.md:84`; hover already maps independent standing off (`chart-hover.js:39–53,417–419`)
**Issue:** Faction filter can pick Independent (`FACTIONS.independent`, `state.js:591–606`). Standing `Unknown` also includes independent / missing bag. Two doors, same systems.
**Fix:** Keep the freeze. Do not add a third standing option named Independent. Filter labels stay `Faction` / `Standing`.
**Status:** optional playtest note.

#### 💡 Suggestion: itinerary need not be an extra live region

**Location:** plot status `aria-live=polite` `galaxychart.js:389–392`; hover `role=status` `galaxychart.js:374–378`
**Issue:** A second assertive live region on the hop `ol` would double-speak on plot.
**Fix:** Visible heading `Itinerary` + `aria-labelledby` or wrap in a named region. Hide with `hidden` + `aria-hidden=true` when no plot (`shared-contract.md:99`). Leave polite live on the existing status line.
**Status:** optional; do not flood.

### Accessibility freeze (later PR1)

- Keep `#rw-galaxy-dest` with `<label for="rw-galaxy-dest">`. Add labels for Faction, Standing, Zoom in, Zoom out, Reset view.
- `:focus-visible` matches live chart buttons (`hud.css:2071–2080,2120–2125`).
- Hit targets ≥ 24 CSS px. Close `×` already meets this (`hud.css:2042–2056`).
- Do not autofocus zoom or filter on open (NAV-06 blur on close still works, `galaxychart.js:493–500,707–714`).
- Itinerary is text, not color-only. Gate vs hub already differs by dash on the SVG (`hud.css:2134–2146`); itinerary repeats the token in words.
- Contrast / colorblind body classes already wrap `.rw-galaxy-chart` (`hud.css:2344–2371`). New strokes must keep a non-color cue. New CSS uses `--rw-accent` / `--white` / `--dim` / `--panel-edge`, not one-off hex.
- `reducedMotion`: no JS inertia; honor `body.rw-reduced-motion` (`hud.css:2373–2376`).
- Do not put 101 discs in tab order. Dest select is the dest keyboard path.
- If a search `<input>` exists, KeyM skip still honors `isTypingFocus()`.
- `innerHTML` / `insertAdjacentHTML` / `document.write` forbidden (`shared-contract.md:28`).

### States (later PR1)

| State | Freeze |
|---|---|
| Empty itinerary | hide node or `hidden` + `aria-hidden` when `status !== 'plotted'` or path length < 2 |
| Blocked | hide hop list; keep `No route from here.` (`galaxychart.js:625`) |
| Arrived | hide hop list or one `Arrived` line; do not duplicate `#rw-galaxy-ap-live` |
| Filter empty map | current system stays visible; dest keeps current (+ plotted dest if any) |
| Disabled zoom | at fit / max (Minor above); AP disabled already live |
| Focus / hover | reuse live ring; hover still inspects, does not plot (`galaxychart.js:754–757`) |
| Loading | none (session DOM; no fetch) |
| Error | fail closed: unknown id ignore; missing standing → Unknown; never throw |

### Worker self-audit

Worker `out/w128/chartread/ui-audit.md` is accurate on dest keep, KeyM typing skip, 24 px buttons, no 101-disc tab trap, no autofocus, `aria-modal=false`, and reduced-motion instant pan. It under-specifies itinerary max-height, omit-vs-disabled options, last-hop gate copy, zoom clamp, and filter-row wrap. Those are Minors, not Blockers. Do not reopen dest-select deletion. Do not send this leftover to CONSUME.

### Verdict

**Pass with minors.** Markdown freeze is ready for a later serial PR1. Do not edit product UI in this designer pass.

- 🔴 Blocker: 0
- 🟠 Major (open): 0
- 🟡 Minor: 6
- 💡 Suggestion: 4

**CLEAN** for worker lifecycle (no open Blocker/Major).
