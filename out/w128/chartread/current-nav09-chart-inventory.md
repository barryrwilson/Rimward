# NAV-09 chart readability inventory (Wave 128)

**Domain:** data. Code wins. Did **not** start Vite or Chrome.  
**Census date:** 2026-08-26.  
**Live files:** `src/systems/galaxychart.js`, `src/ui/hud.css` (`.rw-galaxy-*` only), `src/game/state.js` (READ), `src/game/authored-systems.js` (READ), `src/game/galaxy.generated.js` (READ), `src/game/nav.js` (READ), `src/game/chart-hover.js` (READ), `src/game/data-trade.js` (READ), `src/systems/overlay-policy.js` (READ), `src/core/ctx.js` (READ), `src/game/save.js` (READ).  
**Verdict:** leftover **REAL**. Named serial: **PR1**. Not CONSUME. Not NAV-08 remaining-NAV. Not NAV-07 dest rewrite.

---

## 0. Catalog (101 systems; veil live)

| Fact | Live | Cite |
|---|---|---|
| `SYSTEMS` merge | authored first, then generated | `state.js` **578–583** |
| Generated count | **94** | `galaxy.generated.js` **1–6** |
| Authored count | **7**: `freehold`, `veridian`, `redmarch`, `hollowreach`, `hush`, `verge`, **`veil`** | `authored-systems.js` **30–255** |
| Wave 94 `veil` | id `veil`, name `The Veil`, faction `unknowables`, `chart: [890, 640]`, band 3, gate to `hush`, `clues: []` | `authored-systems.js` **232–255**; `galaxychart.js` `AUTHORED_IDS` **54** |
| Live `Object.keys(SYSTEMS).length` | **101** | node census 2026-08-26 |
| Charted (`Array.isArray(sys.chart)`) | **101 / 101** | same; `galaxychart.js` skip uncharted **117**, **211** |
| Do not hardcode 100 | live is **101** | this row |

---

## 1. Overlay chrome (NAV-01..07 already shipped; do not steal)

| Surface | Today | Cite |
|---|---|---|
| Root | `role=dialog`, `aria-modal=false`, `aria-labelledby` / `describedby`, `aria-hidden` | `galaxychart.js` **129–136** |
| Title | `Galaxy Chart` | **144–147** |
| Actions | Clear route / Autopilot / Close `×` | **151–187** |
| AP live | `#rw-galaxy-ap-live` `role=status` | **157–162**, `showApLive` **644–648** — **NAV-05; do not rewrite** |
| Dest field | labeled `<select id="rw-galaxy-dest">` under desc | **194–230**, **396** — **NAV-07; keep** |
| Dest options | placeholder `Plot a system` + **every charted** id, `textContent` names, `sanitizeSystemId` values, `Object.keys` + `hasOwn`, A–Z then id | **205–228** |
| Dest change | `activateSystem(v)` | **742–746** |
| SVG | `class=rw-galaxy-svg`, **static** `viewBox` fitted to data bbox + `MARGIN` 80, `preserveAspectRatio=xMidYMid meet`, `role=img`, `aria-label` `Map of ${ids.length} rim systems…` | **14–16**, **43–44**, **124–127**, **252–258** |
| Hover strip | name / Control / Standing; `textContent`; inspect only | **374–387**, **439–460**, **754–762** |
| Plot status | one line, not a hop list | **389–392**, **536–540**, **602–605** |
| Legend | gate / hub route / hub / plotted route | **232–249**, **400** |
| CSS home | `.rw-galaxy-*` in `hud.css` (chart already owns this block) | `hud.css` **1967–2376** |
| z | 30 | `hud.css` **1977** — **do not raise** |
| Empty hub | 80 px reticle; chart is overlay, not hub | `hud.css` **184–193** |

---

## 2. Zoom / pan — **ABSENT**

| Probe | Live | Cite |
|---|---|---|
| Wheel listener | **none** | grep `wheel` in `galaxychart.js` = 0 |
| Pointer drag / pan | **none** | grep `pointerdown` / `pointermove` / `mousedown` in `galaxychart.js` = 0 |
| Map transform / scale session | **none** | `viewBox` set once at init **254**; never rewritten |
| `appliedScale` | **settings `textScale`**, not map zoom | **406–407**, **831–836** |
| Resize | `updateHitRadii()` only | **791–793**, **516–521** |
| Zoom buttons | **none** | no `#rw-galaxy-zoom-*` |
| Keyboard +/- / arrows for map | **none** | keydown is KeyM / Escape only **764–788** |
| Persist zoom | **none** (correct; keep none) | `ctx.js` **217** `chartOpen` session; `WORLD_FIELDS` has `nav` not zoom (`save.js` **80–105**) |

Inbox hole: **full-network static view**. Individual discs are small on the fitted 101-node bbox.

---

## 3. Search / faction / standing filters — **ABSENT** (dest typeahead is not a filter)

| Probe | Live | Cite |
|---|---|---|
| Dest native typeahead | **yes** (NAV-07 `<select>`) | **202–230**, **742–746** |
| Faction filter control | **none** | no `#rw-galaxy-filter-*` |
| Standing-band filter | **none** | none |
| Search `<input>` | **none** | none |
| Filter hides discs / labels / options | **none** | node loop paints **all** charted **308–352**; dest loop appends **all** charted **209–228** |
| Option count | **101** systems + placeholder | node census; dest loop **222–228** |

Inbox hole: **very long destination list**; no faction/standing filter. Native typeahead is search-by-name only. That does **not** consume the filter ask.

---

## 4. Labels at active zoom — **partial (NAV-07), not zoom-aware**

| Probe | Live | Cite |
|---|---|---|
| Who gets a `<text>` | authored ∪ pinned ∪ hub only | **50–55**, **340–351**; file comment **21–22** |
| Label count | **12** | `freehold` `veridian` `redmarch` `hollowreach` `hush` `verge` `veil` `stolenwomb` `lastbeacon` `blackstation` `fx_bastion` `gc_auction` |
| Generated (94) labels | **none** at any zoom | **340** `if` |
| Click labels | **yes** — `isPlotTarget` + `data-system-id` + `activateSystem` | **89–96**, **347**, **726–751**; `hud.css` **2233–2240** `pointer-events: all` |
| Hover labels | inspect only (`hoverModel`) | **754–757**; `chart-hover.js` **28–66** |
| Zoom-thin / zoom-in names | **none** | no zoom; 12 names always; 89 systems unnamed on the map |

Inbox hole: **clearer labels at the active zoom**. NAV-07 click-to-plot is **live**. Do **not** reopen label activate as this leftover.

---

## 5. Route itinerary — **ABSENT**

| Probe | Live | Cite |
|---|---|---|
| Hop list UI | **none** | no `#rw-galaxy-itinerary`; grep itinerary = 0 |
| Plot status copy | dest **name · N jumps** or `No route from here.` / `Arrived · name` | **602–605**, **625**, **634** |
| Path paint | SVG lines + `is-hop` / `is-dest` classes | **565–601** |
| Path data | `world.nav.path` string ids | `nav.js` `writeNav` **48–55**; `galaxychart.js` `plotIdentity` **523–533** |
| Per-hop faction | **not listed** | hover is pointer-only **374–387** |
| Per-hop standing | **not listed** | `hoverModel` + `standingRead` exist but only on hover (`chart-hover.js` **54–65**; `data-trade.js` **73–80**) |
| Per-hop gate type | **not listed** | gates drawn as undirected lines **260–278**; hub routes dashed **281–297**; `SYSTEMS.gates[]` fields are **`position`, `to` only** (node census; 243 gates) |
| Known risk | **not listed** | `SYSTEMS.cast.pirates` exists on records (85 systems > 0) but chart never reads `cast` |
| Clues / landmark lines | **not read** (honor §25) | file comment **18–23** |

Inbox hole: itinerary listing **every hop** with faction, standing, gate type, known risk.

---

## 6. Plot / AP / overlay (cite; do not steal)

| Surface | Today | Cite |
|---|---|---|
| `activateSystem` | current → `clearRoute`, else `plotRoute` | **726–732** |
| Persist plot | one `world.nav` on `WORLD_FIELDS` | `save.js` **103–104**; `nav.js` **4–6**, **48–55** |
| Restore AP | `autopilot: false` | `nav.js` **54**, `sanitizeNav` **191–192** |
| Autopilot **button** success | `setOpen(false)` + blur / prefer HUD Cancel | **704–706** — **NAV-06; do not steal** |
| Direct `tryEngage` | does **not** close chart | `autopilot.js` (NAV-05/06 split); chart only closes from the **button** path **699–706** |
| Overlay open | `canOpenPlayCard(ctx, 'chart')` | **482–486**; `overlay-policy.js` **118–127** |
| Overlay pause | **never** write `flags.paused` | `overlay-policy.js` **4**; chart reads `flags.paused` only to refuse **open** while paused **781** |
| KeyM | toggle; close skips `isTypingFocus()` **and** `#rw-galaxy-dest` | **766–779**; `overlay-policy.js` **72–80** (INPUT/TEXTAREA/SELECT) |
| Escape | still closes | **786–787** |
| `innerHTML` in chart | **none** | grep 0 |
| Digit 0 / 8 / 9 | shipyard / launch / epics | `station.js` **188** `DOCK_KEY_SERVICES` |
| Agent chart teleport | **none** | do not add |

---

## 7. Standing / faction / gate / risk sources (for later itinerary + filters)

| Source | Live | Cite |
|---|---|---|
| Faction on system | `SYSTEMS[id].faction` + `FACTIONS[key].name` / `.color` | `state.js` **591–606**; nodes `data-faction` **317–318** |
| Rank ladder | Sworn / Trusted / Known / Stranger / Suspect / Marked | `state.js` **714–725** `RANK_LADDER` / `rankFor` |
| Standing number | `standingRead(world.reputation, faction)` | `data-trade.js` **73–80**; hover **54–55** |
| Missing standing | `standingRead` returns **0** (not throw) | **73–80** |
| Unknown faction | hover `political: 'unknown'`, `showStanding: false` | `chart-hover.js` **39–49** |
| Gate type field | **none** on `gates[]` | only `position`, `to` |
| Gate vs hub | physical undirected `.rw-galaxy-gate` vs one-way `.rw-galaxy-route` | **260–297**; `nav.js` `neighborsOf` **81–112** `canTransit` |
| Recorded pirate traffic | `SYSTEMS[id].cast.pirates` number | e.g. generated `fh_hearth` `cast.pirates` 5; authored `veil` **0** |
| Unpublished clues | must **not** appear | `galaxychart.js` **18–23** |

---

## 8. What is already gone (do not reopen as NAV-09)

- NAV-01 plot persist + chart click (`world.nav`, `plotRoute`).
- NAV-02 in-flight guidance.
- NAV-03 Autopilot (restore never resumes).
- NAV-04 hover inspect.
- NAV-05 handoff + `#rw-galaxy-ap-live`.
- NAV-06 Autopilot **button** success `setOpen(false)`.
- NAV-07 labels share `activateSystem`; dest `<select id="rw-galaxy-dest">`; KeyM typing skip.
- NAV-08 remaining-NAV after NAV-07: leftover **CONSUME** (`docs/Nav08RemainingNavDesign.md`). This inbox is a **new** P1 chart-readability hole, not remaining-NAV.

---

## 9. Inbox mapping (wishlist **106–111** — cite, do not edit)

| Inbox ask | Live? | Hole? |
|---|---|---|
| Zoom / pan | no | **yes** |
| Search | dest `<select>` typeahead only | **partial** — no filter; list is 101 long |
| Faction / standing filters | no | **yes** |
| Clearer labels at active zoom | 12 static names; 94 unlabeled | **yes** |
| Route itinerary (faction, standing, gate type, known risk) | status line only | **yes** |
| Full-network view hard to inspect | fitted static `viewBox` | **yes** |
| Very long destination list | 101 options, ungrouped | **yes** |

**Leftover is REAL. Serial is PR1, not none. Name is not “no NAV-09 leftover.”**
