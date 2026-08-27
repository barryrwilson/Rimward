# UI Audit: NAV-11 chart-close dest keep leftover (Wave 137 CONSUME)

**Auditor:** `[designer]` (independent of `out/w137/routepersist/ui-audit.md`)
**Scope:** Wave 137 NAV-11 leftover pack. **No product UI ships this wave.** Audit the later player-facing freeze (**none**) and live dest-keep chrome the census cites (Galaxy Chart dest `<select>`, plot status, Autopilot no-route vs ready, HUD DEST). Confirm CONSUME does **not** schedule dest chrome, a hub pip, a new Digit, pause-as-feedback, a second persist key, or NAV-06 invert.
**Review file:** `out/w137/designer/nav11-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Nav11RoutePersistDesign.md`, merge law `out/w137/routepersist/shared-contract.md` (wins on conflict), inventory `out/w137/routepersist/current-nav11-route-persist-inventory.md`. Worker self-audit `out/w137/routepersist/ui-audit.md` read, not copied. Live cites: `src/systems/galaxychart.js`, `src/ui/hud.css`, `src/systems/hud.js`, `src/systems/nav-guidance.js`, `src/game/nav.js`, `src/systems/overlay-policy.js`. No Playwright. No Vite. No Chrome (parent forbid). Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-26
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w137/routepersist/shared-contract.md` wins if the brief forks. This wave does not ship overlay CSS. Findings bind **later workers**: do not invent dest-keep chrome while `world.nav` and live paint already keep dest. Named serial is **none**.

Worker verdict (parent): leftover **CONSUME**. Named serial **none**. Chart close does not clear dest. This pass **agrees**.

## UI Audit: NAV-11 chart-close dest keep (CONSUME freeze)

### Summary

No product UI ships in Wave 137. Leftover is **CONSUME**. Later player-facing freeze is **none**. Live Galaxy Chart close hides the overlay and resets view/hover; it does **not** clear dest paint, dest `<select>`, plot status, or `world.nav`. HUD DEST still names the dest while the map is closed. Autopilot plot-first copy is idle-only. Color is not the only dest cue. No 🔴 Blocker. No 🟠 Major remain in the freeze.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; not leftover work), 2 suggestions. CONSUME freeze holds.

---

### Honor / Blocker gate

Flag **Blocker** if the freeze would drop dest on close, show plot-first while a dest exists, put dest on the 80 px hub, steal Digit 0/8/9, pause on chart close, invert NAV-06 Autopilot-button close, or name dest only by color.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| Dest survives chart close | Inventory §0 / §1; contract Close must not `clearRoute` | `setOpen(false)` hide + `resetView` + `clearHover` + blur only (`galaxychart.js` 952–961). No `clearRoute` / `dropNav` / `destSelect.value = ''` | **Pass.** Hole is not live. |
| Reopen reads bag; no second plot | Inventory §0; `update` always retargets | `update()` `retargetPlot(false)` + `syncApButton()` even when closed (`galaxychart.js` 1375–1376). Open paints itinerary (`945–951`) | **Pass.** |
| AP plot-first only when idle | Contract a11y; inventory §3 | `!navHasRoute` → disabled + aria `Autopilot unavailable — plot a destination first.` (`galaxychart.js` 1112–1116, 1129–1134). Has route → `Autopilot` / `Cancel autopilot` (`1127–1137`) | **Pass.** |
| Dest named in **text** | Contract §0.12; inbox shape | Status `{name} · {n} jump(s)` (`galaxychart.js` 1060–1063); dest `<select>` (`276–278`, 1019–1021); HUD DEST (`hud.js` 1217–1218, 2412, 2434) | **Pass.** Not color-only. |
| HUD-01 empty 80 px hub | Honor; contract §0.2 | `.rw-reticle` 80×80 `pointer-events: none` (`hud.css` 184–193). No dest pip | **Pass.** |
| No new Digit / keys | Contract §0.3 | KeyM toggle/close (`galaxychart.js` 1321–1344); Escape close (`1345–1346`). No Digit | **Pass.** |
| Chart does not pause | CTL-02; overlay-policy | `aria-modal="false"` (`galaxychart.js` 208). Overlay never writes `flags.paused` (`overlay-policy.js` 4). Chart reads pause only to gate open (`1340`) | **Pass.** |
| NAV-06 button close stays | Contract §0.7 | Success `setOpen(false)` (`galaxychart.js` 1167–1168). Same close path as × / KeyM / Escape | **Pass.** Must not invert. |
| `innerHTML` forbidden | Contract §0.4 | `galaxychart.js` innerHTML: **none**. Dest names `textContent` / `el()` | **Pass.** |
| `reducedMotion` | Contract §0.11 | CONSUME adds **no** new animation. Live kill: `body.rw-reduced-motion .rw-galaxy-chart *` (`hud.css` 2513–2517) | **Pass.** |
| Persist reuse `world.nav` | Contract §0.5 | `nav.js` owns bag (`4–6`, `48–55`). No new WORLD_FIELD | **Pass.** Cite only. |

If a later worker adds `clearRoute` on close, a dest pip on `.rw-reticle`, a Digit for dest, `flags.paused` on chart, a color-only dest class, or skips `setOpen(false)` on Autopilot **button** success, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Accessibility — dest named | **Pass.** Visible Destination label + `<select id="rw-galaxy-dest">`. Status `aria-live="polite"`. Plot-first is an aria name, not a mute dim. HUD DEST label + value. | `galaxychart.js` 269–278, 574–577, 1129–1134; `hud.js` 1217–1218 |
| Accessibility — close / AP | **Pass.** Real Close `<button>` `aria-label` Close galaxy chart. AP is a real `<button>` with `aria-label` and `aria-describedby="rw-galaxy-ap-live"`. Dialog labelled by title. | `galaxychart.js` 205–210, 241–254 |
| Keyboard | **Pass.** Dest list plots from keyboard (NAV-07 cite). KeyM / Escape close. KeyM while dest/filter focus does not steal the list. Close blurs overlay focus. | `galaxychart.js` 1204–1208, 1325–1346, 955–960 |
| Focus rings | **Pass.** Close / Clear / AP / dest `:hover` and `:focus-visible` outline 2px accent. | `hud.css` 2090–2099, 2139–2144 |
| Theming | **Pass.** Chart tokens `--rw-accent` / `--white` / `--dim` / `--panel-edge`. Contrast / colorblind / reduced-motion body classes. Plot stroke uses token + thickness (not hue alone). Unreachable uses dash **and** hue; colorblind remaps unreach stroke. | `hud.css` 1986–2004, 2277–2305, 2482–2517 |
| States — idle / plotted / blocked / flying | **Pass.** Idle: dest `''`, status hidden, AP plot-first disabled. Plotted: dest id + status name·jumps + AP enabled. Blocked: dest kept, status `No route from here.`, HUD `NO ROUTE`. Flying: `Cancel autopilot`. | `galaxychart.js` 1008–1137, 1084; `hud.js` 2415 |
| States — dest keep vs view reset | **Pass (distinct).** Close resets fitted zoom/pan (`resetView` 805–814). Close does **not** idle dest paint (`lastPlotKey` skip is not dest drop). | inventory §1; `galaxychart.js` 26–27 |
| Hierarchy | **Pass.** Primary fly is Autopilot in the header cluster. Clear route is secondary. Close is labelled. Dest field sits under the description, before the map. Status line is accent text under the map. | `galaxychart.js` 224–278, 574–586; `hud.css` 2020–2145, 2472–2480 |
| Responsive / hit | **Pass for this leftover.** Panel `min(1100px, 92vw)` / `min(760px, 88vh)`. Dest field flex + `min-width: 0`. Controls `min-height`/`min-width` 24px (HUD convention). Itinerary scrolls. | `hud.css` 2008–2013, 2061–2074, 2109–2136, 2220–2228 |
| Closed-chart dest | **Pass.** Overlay `aria-hidden` when closed (`galaxychart.js` 944). HUD readout still on from `world.nav` (`hud.js` 1924–1940, 2412, 2434). Chart hide is `display: none` (`hud.css` 2006) — dest chrome is not required on the hidden map. | — |
| Later UI | **None.** CONSUME. Optional later REAL = `setOpen(true)` `retargetPlot(true)` + `syncApButton` only if a true dest-drop census. No new chrome. | contract §0.1 / §1 / §3 |

---

### What's done well

- Dest is a **named** control: visible `<label>` Destination wired to `#rw-galaxy-dest` (`galaxychart.js` 269–278). Placeholder `Plot a system` is idle-only (`279–281`). Options use `textContent` names, not raw ids (`298–303`).
- Plotted status matches the inbox shape in **text**: `` `${name} · ${jumpPhrase(hops)}` `` (`galaxychart.js` 1060–1063). Blocked is also English: `No route from here.` (`1084`), not a red node alone.
- Autopilot no-route state is **named** in aria (`1129–1134`). Live does not leave a silent dim as the only “plot first” cue. `navHasRoute` requires dest **and** `path.length >= 1` (`1112–1116`), so a leftover empty bag cannot look ready.
- Close is a real `<button>` in tab order (`250–254`, `1197`). `×` has an accessible name. Chart does not trap flight (`aria-modal=false`, `208`).
- HUD DEST / NEXT / JUMPS stay on `#hud` while the map is closed (`hud.js` 1207–1221, 1932–1940, 2433–2434). The 80 px hub stays empty (`hud.css` 184–193`). Dest keep does not fight HOME or RANGE.
- Plot overlay uses stroke weight + solid dest square vs dashed unreach (`hud.css` 2277–2305, 2320–2336). Colorblind remaps unreach (`2508–2511`). Contrast thickens plot stroke (`2504–2506`).
- NAV-06 still closes the full-screen map on Autopilot **button** success (`galaxychart.js` 1167–1168`). Dest keep is the bag, not a trapped overlay. Fail-closed: close blur throw still wins (`955–960`).
- `textContent` only in chart. Worker CONSUME + serial **none** is the correct picture: reuse live dest chrome; do not add a second dest HUD.

Worker self-audit (`out/w137/routepersist/ui-audit.md`) also reports no remaining Blocker/Major. This pass **agrees**. It does not copy that file.

---

### Findings

None at 🔴 Blocker / 🟠 Major.

Inbox dest-drop and plot-first-while-dest are **not live**. They are recorded here so a later worker does not reopen them as UI to ship.

#### 🔴 Blocker: Dest gone after close — **not live; CONSUME**

**Location:** wishlist inbox **207–210** (cite only); live `setOpen` `galaxychart.js` **952–961**; dest sync **1008–1021**; HUD DEST `hud.js` **2412**, **2434**
**Issue:** Playtest saw missing `Veridian Reach · 1 jump` and plot-first after close/reopen.
**Fix:** Do not add dest chrome. Census: bag stays; dest `<select>` stays; status stays; HUD DEST names dest while closed. Integrator must CONSUME.

#### 🟠 Major: Plot-first while dest exists — **not live**

**Location:** `galaxychart.js` **1129–1134** vs **1112–1116**
**Issue:** That is the named AP copy hole.
**Fix:** Live plot-first is idle-only. Do not retune AP button copy as NAV-11 leftover (NAV-03/05 cite).

#### 🟠 Major: Color-only dest keep — **resolved in freeze**

**Location:** honor color-not-only; live status + select + HUD
**Issue:** A dest class without a name would fail the inbox and a11y.
**Fix:** Live names dest in text on three surfaces. CONSUME adds no color-only cue.

#### 🟠 Major: Hub pip / extra overlay for dest — **resolved in freeze**

**Location:** HUD-01 empty hub `hud.css` **184–193**
**Issue:** A glass dest pip would fight HOME and the reticle.
**Fix:** CONSUME adds none. Dest stays on chart + HUD DEST.

#### 🟠 Major: Keep chart open to “keep dest” — **resolved in freeze**

**Location:** NAV-06 `setOpen(false)` `galaxychart.js` **1167–1168**
**Issue:** Blocking close would trap flight behind the map.
**Fix:** Close stays. Dest is `world.nav`, not the overlay.

#### 🟡 Minor: Autopilot button text is not the system name

**Location:** `galaxychart.js` **1127–1128**, **1136–1137**
**Severity:** minor
**Status:** accepted — not leftover work.

**Issue:** A player who only reads the Autopilot **button** sees `Autopilot` / `Cancel autopilot`, not `Veridian Reach`. Status, dest list, itinerary, and HUD DEST do name the system.

**Fix:** Do not retune AP button as NAV-11 leftover. That copy is NAV-03/05. CONSUME “names that dest” = not plot-first **and** dest still on those other surfaces.

#### 🟡 Minor: Zoom/filter reset on close can look like “map forgot”

**Location:** `resetView` `galaxychart.js` **805–814**; file header **26–27**; `setOpen(false)` **952–954**
**Severity:** minor
**Status:** accepted — NAV-09 session view, not dest.

**Issue:** Fitted view reset on close can feel like the chart forgot the route even while dest `<select>` and status still name it.

**Fix:** Do not persist zoom to “keep dest.” Cite NAV-09 only. Dest paint is independent of cam.

#### 💡 Suggestion: Optional later REAL re-sync (named only after true dest-drop census)

**Location:** `setOpen(true)` `galaxychart.js` **945–951** (itinerary + filters + view; no forced `retargetPlot(true)`); per-frame `1375–1376`
**Severity:** suggestion
**Status:** optional. Not this wave.

If playtest still *sees* an empty dest `<select>` or plot-first while HUD DEST names the system, `setOpen(true)` force `retargetPlot(true)` + `syncApButton()` is enough. Do **not** add a WORLD_FIELD. Do **not** `clearRoute` on close. Do **not** invent dest chrome.

#### 💡 Suggestion: Dest field wrapping on a short panel is existing chart chrome

**Location:** `hud.css` **2109–2114** dest field `flex` row; panel height `min(760px, 88vh)` **2010–2012**
**Severity:** suggestion
**Status:** optional. Not NAV-11 leftover.

A very short viewport already squeezes header + dest + filters + itinerary + map. CONSUME must not add a dest card or a second dest row to “fix” that.

---

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a **true** dest-drop census, PR1 (named only then) must:

- Keep real Close / Autopilot / dest `<select>` + visible Destination label
- `textContent` dest names (never `innerHTML`)
- Plot-first only when idle
- Empty 80 px hub; no new Digit; no pause; no color-only dest
- Must not invert NAV-06 Autopilot-button close
- `reducedMotion`: no new animation
- Prefer `setOpen(true)` `retargetPlot(true)` + `syncApButton` only
- Must not add a WORLD_FIELD or dest pip

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.
}
