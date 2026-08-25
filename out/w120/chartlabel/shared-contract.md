# NAV-07 leftover chart-label a11y shared contract

**Wave:** 120. Design only. No label-click, dest `<select>`, or hit-target change ships in this wave.  
**Status:** MERGE LAW for `docs/Nav07ChartLabelDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1 chart-label** (named only).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Nav06ChartCloseDesign.md`, `docs/Hud*`, `docs/OwnerDecisions*`. Do not write `docs/OwnerDecisionsWave120.md`. Do not steal sibling Wave 120 paths (`out/w120/toast/**`, `out/w120/chartclose/**`). Do not steal `out/w118/**` (read ok), `out/w117/**`, `out/w116/**`.  
**Locked sources:** wishlist IDEA (P2, NAV/A11Y) chart labels / hit discs / keyboard (**cite, do not edit**); live inventory `out/w120/chartlabel/current-chartlabel-inventory.md` (code wins); HUD-01 empty 80 px hub; Digit 0/8/9; KeyM; CTL-01 KeyJ (**cite, do not remap**); overlay mutex (**cite, do not steal**); NAV-05 `showApLive` (**cite, do not steal**); Wave 120 sibling **PR1 chart-close-on-AP** Autopilot **button** success `setOpen(false)` (**cite; do not fight**); Wave 120 sibling **PR1 toast-flood** (**cite; do not steal**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins.

**This leftover is Galaxy Chart labels activating the same plot path as hit discs, plus one named keyboard destination list for all charted systems.** It is **not** CTL-01 KeyJ. It is **not** overlay hail/chart/berth mutex. It is **not** NAV-05 `showApLive` rewrite. It is **not** P1 toast-flood. It is **not** P2 close-chart-on-AP. It is **not** HUD-02 combat rails.

**Live path:** `.rw-galaxy-label` has `pointer-events: none` and no `data-system-id`. SVG click/hover require `isHitDisc`. Hits are transparent 24 CSS px discs. No system `tabindex`. No dest `<select>`. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No dest pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Digit 0 stays shipyard. Digit 8 dock root stays launch. Digit 9 dock root stays epics.
3. KeyM stays the chart **bind**. KeyP stays pause. KeyO stays settings. **Do not remap those keys** (KeyM remains `e.code === 'KeyM'`). CTL-01 **KeyJ** is a sibling dock/jump bind — **cite, do not remap**. **Do not edit `controls.js`.** Later PR1 **may** edit the **existing** KeyM handler only: while the chart is open, if `isTypingFocus()` (live `overlay-policy.js` **72–80**, includes `SELECT`), **do not** `setOpen(false)`. That skip is **not** a remap and **not** a new listener. **Do not** add a second window `keydown`. **Do not** rewrite `overlay-policy.js`.
4. `innerHTML` forbidden later. Labels, dest options, status, hover, live line use `textContent` / `createTextNode` / `h()` / `el()` / `svgEl` + `setAttribute` only. Live labels already `textContent` (`galaxychart.js` **289**). **No** `insertAdjacentHTML` / `document.write`. **No** `innerHTML` of `sys.name`.
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. **Do not** invent UU. **Do not** invent SKU. **Do not** invent Digit. Kit mutate omit. Aim-glass gauges stay off.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Do **not** persist dest `<select>` value, last focus, or hover id. `chartOpen` stays **session** (`ctx.flags.chartOpen`). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`. `world.nav` stays NAV-01 (`plotRoute` / `clearRoute`).
7. Fail closed:
    - Never freeze the sim. Label / dest pick **must not** set `ctx.flags.paused`. Title / origins / models / KeyP already pause — **keep**.
    - Never throw. Unknown dest / missing `data-system-id` / `sanitizeSystemId` null → skip plot. Keep flying.
    - Title open (`#rw-title`), models open, or typing in INPUT/TEXTAREA/SELECT/contentEditable → do **not** add a new KeyM listener. Dest `<select>` lives **inside** the chart; when the chart is `aria-hidden`, it is not a global capture. Never throw.
    - **Existing** KeyM close (live `if (open) setOpen(false)`, `galaxychart.js` **700–704**): if `open` and `isTypingFocus()` → **do not** `setOpen(false)`. Call live `isTypingFocus` from `overlay-policy.js` (already exported; SELECT included). Fallback if that call throws: if `document.activeElement` is `#rw-galaxy-dest`, skip close. If both miss, **close as live** (do not trap the chart). **Never stop** the loop.
    - Escape while open still `setOpen(false)`. Do **not** skip Escape for dest typeahead unless playtest proves the native listbox needs it.
    - If overlay helper is missing on **open**, KeyM open still uses live `setOpen` after `playSurfaceBlocked` catch-false. **Do not** rewrite `overlay-policy.js`. **Do not** invent a second `isTypingFocus`.
    - Do not teleport. Do not skip zone/charge. Do not emit `jumpRequested` from the chart.
    - Prototype-safe later helpers: `Object.keys(SYSTEMS)` + `Object.hasOwn` / `sanitizeSystemId`. Never `for-in` a save blob into options or SVG attrs. Never parse untrusted SVG/HTML into the chart.
8. NAV-05: later write-set **must not** rewrite `galaxychart.js` `showApLive` / `#rw-galaxy-ap-live`. **Must not** claim `autopilot.js`. `gate.js` stays sole `jumpRequested` writer.
9. Overlay mutex: later write-set **must not** claim `hail.js`, `overlay-policy.js` **body**, or berth **panel**. **Must** import and **call** live `isTypingFocus` from `galaxychart.js` KeyM close (same module as live `playSurfaceBlocked`). **Must not** raise `.rw-galaxy-chart` z-index. **Must not** skip hail flush. Open-gate `canOpenPlayCard` / `playSurfaceBlocked` **stays**.
10. P1 toast-flood is a **different** inbox item (Wave 120 sibling). Do **not** dedupe toasts. Do **not** raise `.rw-toasts` z-index. Do **not** emit a new toast or extra `commLine` on label/select plot (`plotRoute` / `clearRoute` already emit).
11. P2 close-chart-on-AP is a **Wave 120 sibling**. Later **PR1 chart-label** **must not** fight Autopilot **button** success `setOpen(false)`. **Must not** retune WAVE117 `chartStayOpen` / `chartEngageStay`. **Must not** claim that success branch. Dest `<select>` / labels **must not** steal focus after sibling close (sibling already blurs `activeElement` in chart root).
12. Wave 40: `initTitle` stays `systems[0]`. Settings stays able to open over title (z 80). **Do not** invert title capture. **Do not** put the chart above `#fatal` (99).
13. Prototype-safe later dest list: option `value` is a `sanitizeSystemId` catalog id. Option visible name is `textContent` from `destLabel` / `SYSTEMS[id].name` (authored string). Never HTML. Never `for-in`.
14. CPU: **no** per-frame DOM alloc for labels or dest options. Chart already builds SVG **once**. Dest `<select>` builds **once** at init from the same `ids` loop. Change/click is the plot path only. **No** per-frame rebuild of options. **No** unbounded Map of focus.
15. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Nav06ChartCloseDesign.md`. Do not write `docs/OwnerDecisionsWave120.md`. Deputize defaults live in **this** contract.
16. Do not steal `out/w120/toast/**`, `out/w120/chartclose/**`, `out/w118/**` (read ok), `out/w117/**`, `out/w116/**`.
17. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul, WAVE85, WAVE88).
18. `reducedMotion`: do **not** invent label or dest-list animation.
19. Accessibility: dest list is a real labeled HTML `<select id="rw-galaxy-dest">` (or native equivalent) **outside** the SVG `role=img`. Visible `<label>` + `htmlFor="rw-galaxy-dest"`. Options use `textContent`. Color is not the only cue. Keep Autopilot / Close names. Do **not** switch `#rw-galaxy-ap-live` or hover to `aria-live=assertive`. Do **not** add a second live region. Do **not** make ~100 SVG discs a required tab stop list in PR1. Do **not** add `tabindex` or `role=button` on SVG labels. Do **not** autofocus the dest list on chart open (fights sibling AP-close blur and title). Header Clear / Autopilot / Close stay in the **top** actions tab order; dest sits **under the desc** (after those buttons in DOM). KeyM typeahead on that `<select>` must not close the chart (§0.3 / §0.7).
20. Do **not** pause. Do **not** persist chart focus. Do **not** innerHTML. Do **not** grow hit discs over Autopilot / Close / overlay chrome. Do **not** steal hover-plot (`pointerover` still must **not** call `plotRoute`).

---

## 0.1 Wave 120 deputize (owner may override after playtest)

Pick a playable **chart-label** default. Inventory proves **labels do not activate**, **hits are invisible mouse-only**, and **no named keyboard dest list** exists. Do not park. Do not invent UU / SKU / Digit / persist key.

**Do not** design SVG roving tabindex **and** a searchable list as **required** PR1. Census: unlabeled generated systems (~94) cannot be saved by label-click alone. Smallest additive that unblocks play + a11y is **label activate + one named HTML dest `<select>`**.

### Live knobs (do not retune as the leftover except named dest + label hit)

| Knob | Live | Cite |
|---|---|---|
| `HIT_CSS_DIAMETER` | 24 CSS px | `galaxychart.js` **46**, **443–460** |
| `NODE_R` | 8 chart units | **43** |
| `isHitDisc` | class token `rw-galaxy-hit` | **77–85** |
| Label build | authored ∪ pinned ∪ hub; `textContent` name; **no** `data-system-id` | **283–291** |
| Label CSS | `pointer-events: none` | `hud.css` **2126–2132** |
| Click / hover | `isHitDisc` only | **675–692** (re-census) |
| Keyboard among systems | **none** | **698–713** KeyM / Escape |
| KeyM close while open | **always** `setOpen(false)` — no `isTypingFocus` skip | **700–704** |
| `isTypingFocus` | live; includes `SELECT`; used on **open** via `playSurfaceBlocked` only | `overlay-policy.js` **72–80**, **83–87**; chart import **5** has `playSurfaceBlocked`, **not** `isTypingFocus` |
| Dest `<select>` | **none** | — |
| SVG | `role=img` | **195–201** |
| Plot helpers | `plotRoute` / `clearRoute` / `sanitizeSystemId` | `nav.js` |
| Hover model | `hoverModel` NAV-04 | import **3**; **407–419** |

Do **not** “fix” a11y by pausing the world, remapping KeyJ, or raising chart z over hail/berth.

### Playable policy (smallest additive)

**Name:** labels activate the **same** plot path as hit discs. Effective target includes the **label box**. Keyboard + names for **all charted** systems come from one labeled dest `<select>`. Sim **stays live**. Overlay z **stays**. Sibling AP-close **stays**.

| Piece | Freeze |
|---|---|
| Label activate | Later: labels get `data-system-id` (sanitized catalog id) and `pointer-events: all` (CSS). Click (and Enter/Space if the node is a focusable control — **not** required if dest `<select>` is the keyboard path) calls the **same** helper as discs: current id → `clearRoute`; else `plotRoute`. Then `retargetPlot(true)` as live click. |
| Shared helper | Extract `activateSystem(id)` used by disc click, label click, dest `<select>` change. **Do not** duplicate BFS. **Do not** rewrite `nav.js` except by **calling** exports. |
| Hit discs | **Keep**. Still plot. `HIT_CSS_DIAMETER` **stays 24** unless playtest proves overlap with header buttons — do **not** grow discs over Autopilot / Close. Enlarge **effective** target by **including the label glyph**, not by a huge disc. |
| Hover | **Must** share `isPlotTarget` (hit **or** label) for pointerover **inspect only**. **Never** plot on hover. **Do not** rewrite `hoverModel` / `chart-hover.js`. |
| `isHitDisc` | **Keep** as disc predicate (boot / NAV-04 comments). `isPlotTarget` accepts hit **or** label. Do **not** silently make every SVG child a hit. |
| Dest list | One `<select id="rw-galaxy-dest" class="rw-galaxy-dest">` built **once** at init. Visible `<label htmlFor="rw-galaxy-dest">` “Destination”. First option value `''` copy `Plot a system` (authored). One `<option>` per **charted** system (`Array.isArray(sys.chart)`). `value` = id after `sanitizeSystemId` skip if null. `textContent` = `destLabel(id)` (already **475–480**). Sorted by visible name (`localeCompare`) then id. `change` → `activateSystem(value)`; empty value → **no-op** (Clear button still clears; do not steal Clear). After disc/label/`activateSystem` / `retargetPlot`, **sync** `select.value` to sanitized `nav.dest` when status is `plotted` or `blocked`; else `''`. Sync is a property write, **not** a DOM rebuild. |
| Dest layout | Label+select sit **under the desc**, not in the title/actions row. Clear / Autopilot / Close stay in the **top** actions cluster (`min-height`/`min-width` 24). Do **not** cover those buttons. Do **not** put the select over the SVG. Do **not** raise z. |
| Keyboard among SVG systems | **Not** required PR1. Dest `<select>` is the keyboard path. |
| KeyM close vs dest typeahead | On the **existing** KeyM handler: if `open` and `isTypingFocus()`, **do not** `setOpen(false)`. Import `isTypingFocus` next to live `playSurfaceBlocked`. **Not** a remap. **Not** a new listener. Escape still closes. |
| Accessible names | Dest options **are** the names. Do **not** `innerHTML`. SVG `role=img` **stays** (map summary). Do **not** add `aria-label` via HTML strings of untrusted names — names are catalog `textContent`. Do **not** put `tabindex` / `role=button` on SVG labels. |
| Focus | Dest `<select>` is in tab order **after** Close (DOM under desc). `:focus-visible` matches live chart buttons (`hud.css` **2002–2012** pattern). **No** autofocus on `setOpen(true)`. **No** focus trap. Sibling AP-close blur still wins. |
| Overlay / AP close | Labels and dest list **must not** call `setOpen` on plot. **Must not** `preventDefault` on Autopilot / Close. **Must not** cover those buttons (`pointer-events` on SVG stays in the SVG box). KeyM close skip is **only** the typing guard above. |
| Pause | **Never** `flags.paused`. |
| Persist | **none**. |
| Fail-closed | `sanitizeSystemId` null → skip. Missing SYSTEMS row → skip. Never throw. Never HTML. |
| Home | `galaxychart.js` labels + dest `<select>` + shared `activateSystem` + existing KeyM typing skip. Optional `hud.css` dest-select + label `pointer-events`. |

Owner freeze (do not invert):

- Non-clickable labels and mouse-only invisible discs are a **bug**, not a feature. Not CONSUME.
- Do **not** pause the sim to fake a dest picker.
- Do **not** persist dest focus.
- Do **not** steal KeyJ, Digit 0/8/9, NAV-05 `showApLive`, overlay mutex, toast-flood, or AP success close.
- If dest helper misses, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// CHART LABEL / DEST — same plot path as live hit discs (live 659–668)
function activateSystem(id) {
  const sid = sanitizeSystemId(id)
  if (!sid) return
  const here = sanitizeSystemId(ctx.world.currentSystem)
  if (sid === here) clearRoute(ctx)
  else plotRoute(ctx, sid)
  retargetPlot(true)
}

function isPlotTarget(el) {
  // hit disc OR .rw-galaxy-label (class token split, same style as isHitDisc)
}

svg click:
  t = e.target
  if (!isPlotTarget(t)) return
  activateSystem(t.getAttribute('data-system-id'))

// labels at build (live 283–291): also set data-system-id = id
// CSS: .rw-galaxy-label { pointer-events: all; cursor: pointer; }

svg pointerover:
  if (!isPlotTarget(t)) return
  applyHoverId(sanitizeSystemId(...))   // inspect only; NEVER plotRoute

// DEST SELECT — once at init, not per frame
// id = 'rw-galaxy-dest'; label.htmlFor = 'rw-galaxy-dest'; label.textContent = 'Destination'
// DOM home: under desc, not in title/actions row
// first option value '' textContent 'Plot a system'
// for each charted id (Object.keys + hasOwn + Array.isArray(chart)):
//   opt.value = id
//   opt.textContent = destLabel(id)
// sort options[1..] by textContent
// select change: if value then activateSystem(value)  // empty: no-op
// retargetPlot: sync select.value to nav.dest when plotted/blocked; else ''
//   (property write; never rebuild options)

// EXISTING KeyM handler (live 700–704) — not a new listener, not a remap
if (e.code === 'KeyM') {
  if (open) {
    let typing = false
    try { typing = isTypingFocus() === true } catch { typing = false }
    if (!typing) {
      try {
        const ae = document.activeElement
        typing = !!(ae && ae.id === 'rw-galaxy-dest')
      } catch { /* close as live */ }
    }
    if (!typing) setOpen(false)
  } else if (!docked && !paused) { /* live playSurfaceBlocked open */ }
} else if (e.code === 'Escape' && open) {
  setOpen(false)   // do not skip Escape for dest
}

// NEVER
ctx.flags.paused = true
WORLD_FIELDS.push('chartDest')
label.innerHTML = sys.name
option.innerHTML = sys.name
for (const k in saveBlob) …
svg querySelectorAll('*') tabIndex = 0
new KeyJ / Digit bind
showApLive = function …
setOpen(false) on activateSystem   // sibling owns AP-success close
pushToast / extra commLine
HIT_CSS_DIAMETER = 200             // do not cover Autopilot
new window KeyM listener
rewrite isTypingFocus / overlay-policy.js
setOpen(false) on KeyM while isTypingFocus()   // dest typeahead M
```

Do **not** plot on hover. Do **not** rewrite `showApLive`. Do **not** close the chart on plot. Do **not** skip hail flush. Do **not** leave a required 100-node tab loop.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — labels/hits/keyboard still live holes |
| SVG roving tabindex as **required** PR1 | **Forbidden** as required — dest `<select>` is the keyboard pick |
| Dest `<select>` **and** SVG tab trap both required | **Forbidden** — pick dest `<select>` only |
| Labels-only click, skip dest list | **Forbidden** — ~94 unlabeled generated systems stay mouse-only |
| Grow discs over header / overlay | **Forbidden** §0.20 |
| Plot on hover | **Forbidden** — NAV-04 inspect only |
| Pause sim for picker | **Forbidden** §0.7 |
| Persist dest / focus / WORLD_FIELDS | **Forbidden** §0.6 |
| `innerHTML` label or option | **Forbidden** §0.4 |
| `for-in` save blob / SYSTEMS | **Forbidden** §0.7 |
| Steal Digit 0/8/9 / hub pip | **Forbidden** §0.2 |
| Remap KeyH/M/L/J | **Forbidden** §0.3 |
| Skip dest KeyM typeahead (ship dest `<select>` without KeyM close skip) | **Forbidden** — partial merge; PR1 **must** land typing skip on the **existing** handler |
| New KeyM window listener | **Forbidden** §0.3 / §0.7 |
| Rewrite `overlay-policy.js` / `isTypingFocus` | **Forbidden** §0.9 — **call** only |
| Skip Escape close while dest focused | **Forbidden** unless playtest |
| Claim `autopilot.js` | **Forbidden** §0.8 |
| Rewrite `showApLive` | **Forbidden** §0.8 |
| Close chart on plot / on dest change | **Forbidden** — sibling AP-success close only |
| Fight sibling `setOpen(false)` on AP success | **Forbidden** §0.11 |
| Retune WAVE117 stay pins | **Forbidden** §0.11 |
| Toast / extra `commLine` | **Forbidden** §0.10 |
| Overlay mutex / `hail.js` / overlay-policy | **Forbidden** §0.9 |
| `state.js` write | **Forbidden** §0.5 |
| New Digit / UU / SKU | **Forbidden** |
| Autofocus dest on open | **Forbidden** §0.19 |
| Focus trap | **Forbidden** §0.19 |
| `aria-live=assertive` / second live region | **Forbidden** §0.19 |
| Freeze the sim on miss | **Forbidden** §0.7 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| Label `data-system-id` + CSS `pointer-events` | PR1 `galaxychart.js` / `hud.css` | click / hover target |
| `isPlotTarget` + `activateSystem` | PR1 `galaxychart.js` | disc, label, dest `<select>` |
| Dest `<select id="rw-galaxy-dest">` + visible `<label>` under desc | PR1 `galaxychart.js` (+ CSS) | keyboard / AT |
| Existing KeyM close typing skip | PR1 `galaxychart.js` **existing** handler | dest typeahead |
| `isTypingFocus` | **none** (call live export) | KeyM close skip |
| `isHitDisc` | **keep** (disc predicate) | hover/click also use `isPlotTarget` |
| `plotRoute` / `clearRoute` | **none** (call only) | NAV-01 |
| `hoverModel` / `chart-hover.js` | **none** | NAV-04 |
| `showApLive` | **none** (NAV-05) | chart |
| Autopilot **button** success `setOpen(false)` | **none** (Wave 120 sibling PR1 chart-close-on-AP) | — |
| WAVE117 stay pins | **none** (sibling chart-close later) | — |
| Toast channel / `save.js` | **none** (Wave 120 sibling PR1 toast-flood) | — |
| `overlay-policy.js` / `hail.js` | **none** | — |
| `flags.paused` | **none** from this leftover | main loop |
| `state.js` / WORLD_FIELDS | **none** | SYSTEMS **read** |
| Digit 0/8/9 / KeyJ | **none** | consume |
| `controls.js` | **none** | — |
| Chart z-index | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| Label click, missing / bad `data-system-id` | skip; never throw |
| Dest `<select>` empty value | **no-op** (Clear button still clears) |
| Disc/label plot while dest `<select>` exists | `retargetPlot` **syncs** `select.value` to `nav.dest` (or `''`); never rebuild options |
| Dest value not in SYSTEMS / uncharted | `sanitizeSystemId` / `plotRoute` fail closed; no write |
| Current system chosen | `clearRoute` (same as disc click) |
| Hover on label (if `isPlotTarget`) | inspect only; **no** plot |
| Overlay hail open | KeyM open still gated (`playSurfaceBlocked`). Dest list does not open hail |
| KeyM while chart open and `isTypingFocus()` | **do not** `setOpen(false)` |
| KeyM while chart open, not typing | `setOpen(false)` as live |
| KeyM while dest `#rw-galaxy-dest` focused and `isTypingFocus` throws | skip close via `activeElement.id` fallback |
| KeyM typing helper miss (no focus, no dest id) | **close as live**; never trap |
| Escape while chart open | `setOpen(false)` even if dest focused |
| Sibling AP success close | real `setOpen(false)` + blur; dest `<select>` must not re-focus |
| Title / settings / typing | no new capture listener |
| `reducedMotion` | no new motion |
| Helper miss | skip that pick; **never throw**; never pause |
| Partial merge (labels click, no dest list) | generated systems stay mouse-only — **forbidden**; PR1 must land **labels + dest `<select>`** |
| Partial merge (dest list, labels still `pointer-events: none`) | inbox label hole stays — **forbidden**; PR1 must land **both** |
| Partial merge (closes chart on plot) | fights sibling AP-close and NAV-04 inspect — **forbidden** |
| Partial merge (dest `<select>` without KeyM typing skip) | typeahead **M** closes the map — **forbidden**; PR1 must land **labels + dest `<select>` + KeyM skip** |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 chart-label** | label `data-system-id` + CSS pointer-events; `isPlotTarget` + `activateSystem`; dest `<select id="rw-galaxy-dest">` once at init under desc; hover `isPlotTarget` **inspect only**; dest `:focus-visible`; **existing** KeyM close skip via `isTypingFocus` | SVG tab trap; persist; pause; overlay mutex rewrite; toast; `showApLive` rewrite; AP success `setOpen(false)`; WAVE pin retune; KeyJ; Digit steal; `innerHTML`; `state.js`; grow discs over chrome; plot-on-hover; autofocus; KeyM remap; new KeyM listener; Escape skip |
| **PR2 stills (optional)** | Playtest stills: click label plots; dest `<select>` plots generated system without mouse on disc | Required if PR1 code is enough; overlay mutex; known FAILs |
| **PR3 census (optional skip)** | Re-grep: `rw-galaxy-label` pointer-events not `none`; dest select present; no `innerHTML` in galaxychart; `showApLive` body unchanged | New world field |

---

## 4. Later write-set (named files; do not write this wave)

**Allowed (narrow):**

- `src/systems/galaxychart.js` — **labels + dest `<select id="rw-galaxy-dest">` + shared `activateSystem` / `isPlotTarget` + import `isTypingFocus` + existing KeyM close typing skip**. Forbidden: `showApLive` rewrite; Autopilot **button** success close; overlay open-gate rewrite; `innerHTML`; KeyM **remap**; new KeyM listener; pause; Escape skip
- `src/ui/hud.css` — `.rw-galaxy-label { pointer-events: all; cursor: pointer; }` and dest-select / dest-label styles matching chart buttons (`min-height` 24, `:focus-visible` accent). Dest control **under desc**. Forbidden: z-index; overlay geometry; toast; aim-column; dest over SVG or Autopilot/Close

**Forbidden:**

- `src/systems/hail.js`
- `src/systems/overlay-policy.js`
- `src/game/autopilot.js`
- `src/systems/controls.js`
- `src/game/state.js`
- `src/game/nav.js` (call exports only; do not rewrite BFS)
- `src/game/chart-hover.js` (call `hoverModel` only)
- `src/systems/hud.js` toast channel
- `src/game/save.js`
- `src/systems/station.js` Digit map
- `scripts/boot-test.mjs` WAVE117 close pins (sibling)
- `public/**`, `package.json`, wishlist, `PROGRESS.md`
