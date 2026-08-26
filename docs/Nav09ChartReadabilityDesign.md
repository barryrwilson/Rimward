# RIMWARD NAV-09 leftover chart readability

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-09 leftover chart readability |
| **Author** | Wave 128 NAV-09 leftover integrator |
| **Date** | 2026-08-26 |
| **Status** | leftover **REAL**. Wave 129 **PR1 implemented**. Named serial: **PR1**. Not CONSUME. Name is **not** “no NAV-09 leftover.” |
| **Wave** | 129 PR1 — session zoom/pan, faction/standing filters, zoom-aware labels, hop itinerary in `galaxychart.js` + `.rw-galaxy-*` chrome. |
| **Owner request** | Census live Galaxy Chart vs wishlist INBOX (P1, NAV): make the 101-system chart readable as an exploration and decision tool, not only a route picker. If zoom/pan + search + faction/standing filters + zoom-aware labels + hop itinerary already live, freeze leftover **CONSUME** and named serial **none**. Census: **not** live. Freeze leftover **REAL** and name later serial **PR1**. Owner may override after playtest. Do not park. |
| **Merge law** | [`out/w128/chartread/shared-contract.md`](../out/w128/chartread/shared-contract.md). If this document and that file conflict, **the contract wins**. |
| **Honor** | HUD-01 empty hub. Aim-glass gauges stay off. Kit mutate omit. Chart is overlay, not hub. Digit 0/8/9 stay. No new Digit. KeyM stays. Existing KeyM close skips `isTypingFocus()` (NAV-07) — if a search field is added, close-skip must still honor typing focus. Overlay mutex CTL-02: hail/chart/berth exclusive; **never** write `flags.paused`. NAV-06 Autopilot **button** success still `setOpen(false)`. Direct `tryEngage` still does not close. NAV-07: labels share `activateSystem`; dest `<select id="rw-galaxy-dest">` **kept**. `innerHTML` forbidden later. `state.js` READ-ONLY. Default **no new persist**. Zoom/pan/filter are **session**. Route plot persist already exists (`world.nav`). Itinerary is a **read**. Agent API: do not add chart cheat teleport. Fail closed: unknown id ignore; standing missing → unknown; never `for-in` filter into world. `reducedMotion`: instant pan/zoom ok. Do **not** steal NAV-08 remaining-NAV CONSUME, NAV-07 dest rewrite, NAV-06, NAV-05, HUD-07, HUD-06, Hail02, Agent API PR2–PR6. Do **not** edit the wishlist, `PROGRESS.md`, `docs/Nav01*`–`docs/Nav08*`, `docs/Hail01*`, `docs/Hud06*`, `docs/Hud07*`, `docs/AgentApiDesign.md`, `docs/Ctl*.md`, `docs/OwnerDecisions*`. Do **not** write `out/w128/hailmiss/**` or `out/w128/deconflict/**`. Do **not** “fix” REDMARCH `castMatches`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 128 census) | [`out/w128/chartread/current-nav09-chart-inventory.md`](../out/w128/chartread/current-nav09-chart-inventory.md) |
| Merge law | [`out/w128/chartread/shared-contract.md`](../out/w128/chartread/shared-contract.md) |
| Wave 128 security review | [`out/w128/chartread/security-review.md`](../out/w128/chartread/security-review.md) |
| Wave 128 design-doc review | [`out/w128/chartread/code-review.md`](../out/w128/chartread/code-review.md) |
| Wave 128 UI audit | [`out/w128/chartread/ui-audit.md`](../out/w128/chartread/ui-audit.md) |
| Wave 128 notes | [`out/w128/chartread/notes.md`](../out/w128/chartread/notes.md) |
| NAV-01 plot (cite) | [`docs/Nav01RouteDesign.md`](./Nav01RouteDesign.md) |
| NAV-07 chart-label (cite; dest select stays) | [`docs/Nav07ChartLabelDesign.md`](./Nav07ChartLabelDesign.md) |
| NAV-06 chart-close (cite) | [`docs/Nav06ChartCloseDesign.md`](./Nav06ChartCloseDesign.md) |
| NAV-08 remaining-NAV (CONSUME; **not this leftover**) | [`docs/Nav08RemainingNavDesign.md`](./Nav08RemainingNavDesign.md) |

Siblings Hail02, HUD-07, Agent API, HUD-06, overlay/CTL-02, wishlist, and `PROGRESS.md` are **other workers**. **Do not edit** those paths. **Do not write** `src/`.

**This is not NAV-08 remaining-NAV.** **This is not NAV-07 dest `<select>` rewrite.** **This is not NAV-06 close-on-AP.** **This is not NAV-05 `showApLive`.** **This is not HUD-07.** **This is not HUD-06 HOME pip.** Wishlist 101-system chart readability is **INBOX**. Census still finds **static full-network view, 101-option dest list, 12 static labels, no hop itinerary**.

---

## Overview

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox — Playtest capture 2026-08-25 second pass — **cite, do not edit**):

> INBOX (P1, NAV): Make the 101-system chart readable as an exploration and decision tool, not only a route picker. Add zoom/pan, search and faction/standing filters, clearer labels at the active zoom, and a route itinerary listing every hop with faction, standing, gate type, and known risk. The current full-network view and very long destination list make individual systems and route consequences hard to inspect.

This leftover is **NAV-09**. It is **not** NAV-08 remaining-NAV CONSUME. It is **not** NAV-07 chart-label PR1.

Wave 128 this worker lands markdown only. Bindings do not change here.

Census (code wins): live chart fits **101** charted systems (7 authored including Wave 94 **`veil`** + 94 generated) into one static `viewBox`. There is **no** wheel/drag zoom. Dest `<select id="rw-galaxy-dest">` lists **all 101** names with native typeahead and **no** faction/standing filter. Labels exist for **12** authored ∪ pinned ∪ hub systems only; they already share `activateSystem` (NAV-07). Plot status is `{name} · {n} jumps`, not a per-hop itinerary. Leftover is **REAL**.

This leftover is **session zoom/pan + filter of the kept dest `<select>` and discs + zoom-aware names + a hop itinerary read of `world.nav`**. It is not a pause. It is not a teleport. It is not a second plot store. It is not a dest-control rewrite.

This document is the integrator for a **later** implementation wave.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0/8/9 stay. KeyM stays. Do not invent UU. Do not steal HUD-07. Do not claim `hud.js` flight HUD.

Wave 128 deputize (recorded here and in the contract; owner may override after playtest): **PR1** lands session zoom/pan (wheel + drag + Zoom buttons), dest `<select>` **kept** with faction and standing filters on options **and** discs/labels, names for in-view systems when zoomed in (scale ≥ 2), and an itinerary under the dest field naming each hop (display name, faction, standing band, gate type, known risk from recorded state only). Search reuses dest typeahead. Reset view on close. No persist. No `innerHTML`. Overlay never paused. Autopilot **button** still closes (NAV-06). Direct `tryEngage` still does not. If impl bloats, split itinerary to **PR2**. Leftover stays **REAL**. Serial stays **PR1**.

If census had proved zoom/pan + search + faction/standing filters + zoom-aware labels + hop itinerary already live, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w128/chartread/current-nav09-chart-inventory.md`](../out/w128/chartread/current-nav09-chart-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Catalog | **101** charted (7 authored incl. `veil` + 94 generated) | `state.js` **583**; `authored-systems.js` **234–255**; `galaxy.generated.js` **1–6** |
| `viewBox` | static bbox + MARGIN 80; full network | `galaxychart.js` **14–16**, **124–127**, **254** |
| Zoom / pan | **none** (no wheel / drag) | inventory §2 |
| `appliedScale` | settings `textScale`, not map zoom | **406–407**, **831–836** |
| Dest list | `#rw-galaxy-dest` all 101, A–Z | **194–230** |
| Faction / standing filter | **none** | inventory §3 |
| Labels | 12 names; pointer-events; `activateSystem` | **340–351**, **726–751** |
| Zoom-in names for generated | **none** | **340** `if` |
| Plot status | `{name} · N jumps` | **602–605** |
| Itinerary | **none** | inventory §5 |
| Gate records | `{ position, to }` only | node census; 243 gates |
| Hover | name / control / standing inspect | **374–387**; `chart-hover.js` **28** |
| AP button close | `setOpen(false)` | **704–706** — do not steal |
| `showApLive` | NAV-05 | **644–648** — do not rewrite |
| KeyM typing | `isTypingFocus` + dest id | **766–779** |
| Overlay | `canOpenPlayCard`; never `paused` | **482–486**; `overlay-policy.js` **4**, **118–127** |
| Persist | `world.nav` only; `chartOpen` session | `save.js` **103–104**; `ctx.js` **217** |
| `innerHTML` | **none** | grep 0 |

The player who opens M sees the whole rim at once. Generated names are not on the map. The dest list is 101 rows. A plotted route is a cyan polyline plus a jump count, not a decision table.

### Pain points

- Inbox P1: chart is a route picker, not an exploration tool.
- Static fit of 101 discs makes neighbors unreadable.
- Dest `<select>` is the right a11y control with the **wrong length** (unfiltered).
- 94 generated systems have no labels at any zoom.
- Plot consequences (faction, standing, gate vs hub, pirate traffic) are not listed per hop.
- A naive later PR that **deletes** `#rw-galaxy-dest` steals NAV-07 a11y.
- A naive later PR that remaps KeyM for a search box closes the map on typeahead **M** unless `isTypingFocus` still wins.
- A naive later PR that persists zoom/filter writes a new world field or leaks a god-mode map.
- A naive later PR that `innerHTML`s system names is XSS.
- A naive later PR that dumps landmark `line` / clue text violates §25.
- A naive later PR that closes the chart on plot fights NAV-06 / inspect-then-engage.
- A naive later PR that writes `flags.paused` steals CTL-02.
- A naive later PR that teleports from the chart steals Agent / jump.
- A naive later PR that hardcodes 100 systems drops Wave 94 `veil`.

### Why now (design) / why not now (code)

The owner asked for the NAV-09 leftover integrator so a later serial can make the 101-system chart inspectable **after** NAV-01..07 already ship plot, hover, AP, button-close, and dest `<select>`. Inventory shows no zoom, no standing/faction filter, no itinerary, and static 12 labels. Merge law can exist without touching `src/`. Implementation waits so overlay, `showApLive`, AP-close, dest select, persist, and freeze-the-sim stay frozen. Wave 128 this worker does not ship `src/`.

NAV-08 CONSUME does **not** consume this inbox. That leftover asked “remaining NAV after NAV-07.” This leftover is a **new** P1 readability ask.

If census had proved the inbox already gone, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Goals & Non-Goals

### Goals

1. Document live chart zoom, dest list, labels, itinerary, overlay from **live code**.
2. Freeze leftover = **REAL** chart readability. Not CONSUME. Serial is **not** none.
3. Freeze deputize: session zoom/pan + buttons; keep dest `<select>`; faction/standing filter; zoom-aware labels; hop itinerary read of `world.nav`. Owner may override after playtest. Do not park.
4. Freeze persist: **none** new. Zoom/filter session. `state.js` READ-ONLY. No UU. No SKU. No new Digit.
5. Freeze HUD-01 empty hub. Digit 0/8/9 stay. KeyM stays. Dest select stays.
6. Freeze later copy via `textContent`. `innerHTML` forbidden.
7. Freeze jump: `gate.js` sole `jumpRequested` writer. Do not teleport.
8. Freeze overlay: do not raise z. Do not write `flags.paused`. Do not skip hail flush on real close.
9. Freeze siblings: do not fight AP success `setOpen(false)`. Do not rewrite `showApLive`. Do not steal HUD-07 / Hail02 / HUD-06.
10. Freeze a serial PR plan. This wave writes the document. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No pause-the-sim. No teleport. No skip zone/charge.
- No NAV-05 `showApLive` rewrite. No `#rw-galaxy-ap-live` node rewrite.
- No Autopilot **button** success close change. Direct `tryEngage` still does not close.
- No NAV-07 dest `<select>` **deletion** or unnamed replacement.
- No NAV-08 remaining-NAV reopen.
- No CTL-01 KeyJ remap. No `controls.js` edit. No KeyM remap.
- No overlay mutex rewrite. No `hail.js` write.
- No HUD-07 flight HUD. No HUD-06 HOME pip. No HUD-01 hub child. No new Digit.
- No `state.js` write. No WORLD_FIELDS zoom/filter.
- No Agent chart teleport. No observe filter this wave.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Nav01*`–`docs/Nav08*`, `docs/Hail*`, `docs/Hud*`, `docs/Ctl*`, `docs/AgentApiDesign.md`, `docs/OwnerDecisions*`.
- Do not write `docs/OwnerDecisionsWave128.md`.
- Do not fix known boot FAILs (REDMARCH `castMatches`).
- Do not steal `out/w128/hailmiss/**`, `out/w128/deconflict/**`, `out/w127/**`, `out/w122/**`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **Yes** — static full map, long dest list, no itinerary | Inventory §2–§5 |
| CONSUME? | **No**. Serial is **not** none | Census |
| New persist key? | **No** | Contract §0.9 |
| `state.js` write? | **No** | Contract §0.9 |
| Pause under map? | **No** | CTL-02 |
| Dest `<select>` | **Keep**; filter options | NAV-07; wishlist length |
| Search widget | Dest typeahead is search; no required second box | Smallest additive |
| Zoom / pan | Session; wheel+drag+buttons; reset on close | Inbox; `reducedMotion` |
| Zoom labels | Extra names at scale ≥ 2 in view; 12 at fit | Inbox; do not fight NAV-07 |
| Filters | Faction + standing; discs + labels + options | Inbox |
| Itinerary | Read `world.nav.path`; hide if no plot | Inbox; no second store |
| Gate type | `gate` / `hub route` / `gate + hub` / `unknown` | No `gates[].type` field. Rows are **legs**: `i` in `0 .. path.length-2`, copy is arrival `path[i+1]`, token is `gateTypeToken(from, to)`. `unknown` only when neither gate nor hub. |
| Known risk | standing band + recorded `cast.pirates`; never clues | §25 |
| Close chart on plot? | **No** | NAV-06 sibling |
| `showApLive` rewrite? | **No** | NAV-05 |
| Jump emit from chart? | **No** | `gate.js` sole writer |
| Overlay fight? | **No** | CTL-02 |
| Named PR1? | **PR1** chart-readability | REAL leftover |
| Optional split | **PR2 itinerary** if PR1 bloats | Contract §2 |

### 2. Current chart pick (do not break NAV-01..07 / overlay)

Title stays `systems[0]` capture. Settings KeyO stays z 80. Pause KeyP stays. Chart still sets `flags.chartOpen`. Click disc/label still plots. Hover still inspects. Dest `<select>` still plots. Sibling NAV-05 still paints `showApLive`. Sibling NAV-06 still owns Autopilot success `setOpen(false)`. Later PR1 **adds** session view + filters + itinerary. It does **not** rewrite `showApLive`. It does **not** close on plot. It does **not** delete `#rw-galaxy-dest`.

### 3. Smallest additive punch (later)

See contract §0.1. Session `viewBox` (or equivalent transform) in the chart closure. Zoom buttons. Faction/standing `<select>`s next to Destination. Filter dest options without replacing the control. Labels for in-view nodes when zoomed in. Itinerary `ol` under dest, `textContent` hops. Existing KeyM close still skips typing focus. Hover still inspects. No new key bind. No KeyM remap. No pause. No overlay-policy write. No `nav.js` second store.

### 4. Neighbours

| Module | This leftover does | This leftover does not |
|---|---|---|
| `galaxychart.js` | later PR1: zoom/pan, filters, zoom labels, itinerary; **re-census lines at impl** | rewrite `showApLive`; AP success close; overlay open-gate; KeyM remap; dest select delete |
| `hud.css` `.rw-galaxy-*` | later: zoom buttons, filter row, itinerary list | z-index; flight HUD; HUD-07 |
| Overlay mutex | consume | rewrite; `flags.paused` |
| `overlay-policy.js` | **call** live `isTypingFocus` | rewrite body |
| `autopilot.js` | none | `jumpRequested`; `tryEngage` steal |
| `gate.js` / `jump.js` | none (sole jump writer) | teleport |
| `controls.js` | none | KeyJ; KeyM remap |
| `nav.js` | **read** `world.nav`; **call** plot/clear/sanitize | second plot store; BFS rewrite |
| `chart-hover.js` | **call** `hoverModel` / standing | rewrite |
| `hail.js` / `hud.js` | none | Hail02; HUD-07 layout |
| `agent-api.js` | none | chart teleport; observe filter this wave |
| `save.js` | none | persist zoom |
| `state.js` | none | write |
| Title / origins / settings | honor capture | steal Enter; steal KeyO |

### 5. Serial PR plan

Matches contract §3. **Named only. Do not implement in Wave 128.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1** chart-readability | zoom/pan session + buttons; zoom-aware labels; faction/standing filter; dest `<select>` kept; KeyM typing skip still honors INPUT/SELECT; itinerary unless split | persist zoom; dest delete; AP close steal; `showApLive` rewrite; `innerHTML`; pause; Agent teleport; HUD-07; Digit; KeyM remap |
| **PR2 itinerary (optional split)** | hop list fields | clue text; new persist |
| **PR2 stills (optional)** | playtest stills | required with PR1 |
| **PR3 census (optional skip)** | re-grep dest id; no innerHTML; no WORLD_FIELDS zoom | new world field |

First remaining serial for **this** leftover is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim Autopilot success close. It must not land in this worker.

### 6. Picture

Reuse live chart dialog, live discs, live dest `<select>`, live `plotRoute`. Player opens KeyM. Scrolls the SVG; a Freehold cluster fills the panel; names appear. Tabs to **Faction**, picks Red Ledger; dest list shortens; independent discs hide. Tabs to **Destination**, types a name; chart **stays**. Plot. An **Itinerary** lists each hop: name, flag, standing band, gate vs hub, pirate traffic. Autopilot / Close stay in the top row. Sibling AP success still closes the map. Hover still inspects, does not plot. Close resets the view.

No hub pip. Digit 0 stays shipyard. KeyM stays. KeyJ stays CTL-01.

---

## Player outcome (later serial; freeze here)

Fly. Open Galaxy Chart with M. The full rim still fits at reset. Wheel or **Zoom in**. A cluster is readable. Names of in-view systems appear. **Reset view** returns to the full network.

Fly. Open the chart. Tab to **Faction** or **Standing**. The dest list is no longer 101 undifferentiated rows. Discs that fail the filter hide. Current system stays visible. Dest `<select>` still plots.

Fly. Plot a route. Read **Itinerary**: every hop names faction, standing, gate type, known risk. Clear route hides the list. No clue prose.

Fly. Focus Destination. Type **M**. The chart **stays open** (`isTypingFocus`). Escape still closes.

Fly. Click Autopilot. **NAV-06** still closes the chart on **button** success. Direct engage still does not. This leftover does **not** close on plot.

Pause is still P. Settings is still O. Title still captures. KeyM still toggles the chart. Digit 0/8/9 stay.

`reducedMotion`: pan/zoom is instant. No inertia.

**NAV-08 remaining-NAV** is **not** this work. **HUD-07** is **not** this work. **Hail02** is **not** this work. **HUD-06** is **not** this work. **Agent API** is **not** this work.

---

## Security

See [`out/w128/chartread/security-review.md`](../out/w128/chartread/security-review.md).

- Dest / filter / itinerary values pass `sanitizeSystemId` / authored faction keys / `RANK_LADDER` names. Names are `textContent`, never `innerHTML`.
- Filter input is not `eval`. Authored keys only.
- Prototype-safe: `Object.keys` + `hasOwn`. Never `for-in` a save blob or filter payload into `world`.
- Do not persist zoom, pan, or filter. Hostile save must not grant a god-mode revealed map of unauthored state.
- Standing is already-known recorded `world.reputation`. Missing → Unknown. Do not throw.
- Itinerary never prints clue / landmark `line` (§25).
- Agent: no chart teleport.
- Fail-closed never freeze the sim. Never throw. Never set `flags.paused`.
- Do not parse untrusted SVG/HTML into the chart.

---

## Acceptance direction (implementation wave)

1. Wheel or Zoom in changes the SVG view (not settings `textScale`). Reset / close returns to the fitted full network.
2. Drag pans; a click under 4 CSS px still `activateSystem`. Hover still does not plot.
3. Zoom in past deputize scale ≥ 2 shows names for in-view charted systems (`textContent`). Zoom out restores the 12-name set. Labels still plot (NAV-07).
4. `#rw-galaxy-dest` still exists. Faction/standing filters shorten **options** and hide discs. Current + plotted dest stay listed.
5. Dest focused, player types KeyM: chart **stays**. If a search INPUT exists, `isTypingFocus()` skip still applies. Escape still closes.
6. With `status === 'plotted'` and path length ≥ 2, itinerary lists every **leg** `path[i]→path[i+1]`: arrival name, faction, standing band, gate type to that dest, known risk from recorded state. A 1-jump plot is one row (not an origin plus dest-`unknown`). No plot → itinerary hidden.
7. `showApLive` body not rewritten. Autopilot success close not claimed.
8. Hail/chart/berth never set `flags.paused` from this leftover.
9. KeyM still the chart bind. Digit 0/8/9 untouched.
10. `gate.js` still the only `jumpRequested` writer. No teleport.
11. Overlay mutex still owns open-gate. This PR does not write `overlay-policy.js`.
12. No new `WORLD_FIELDS`. No `innerHTML`. Catalog copy may say 101, not 100.
13. Known boot FAILs untouched.

---

## Alternatives considered

| Alternative | Why not |
|---|---|
| Freeze CONSUME / serial none | Census: no zoom, no filters, no itinerary, 12 static labels |
| Treat as NAV-08 remaining-NAV | NAV-08 CONSUME was “after NAV-07”; this is a **new** P1 inbox |
| Delete dest `<select>` for a custom listbox | Steals NAV-07 a11y; wishlist asked to shorten the list |
| Required second search `<input>` | Native typeahead already searches names; extra KeyM risk |
| Persist zoom / filter | Hostile save / god-mode map; default none |
| SVG roving tabindex on 101 discs | Fights overlay tab order; dest select stays the keyboard dest |
| Plot on hover | Steals NAV-04 |
| Close chart on dest pick | Fights NAV-06 and inspect-then-engage |
| Pause sim while inspecting | CTL-02; freeze-the-sim |
| `innerHTML` names | XSS |
| Clue / landmark lines on itinerary | §25 unpublished |
| Invent `gates[].type` in `state.js` | Not required; derive gate vs hub from live records |
| Agent observe filter this wave | Not this leftover |
| Chart teleport | Cheat travel |
| Hardcode 100 systems | Live is **101**; `veil` is Wave 94 |
| Grow discs instead of zoom | Covers Autopilot/Close; 24 CSS px already live |

---

## Regression risks

| Risk | Mitigation |
|---|---|
| Dest select deleted | contract forbids; acceptance requires `#rw-galaxy-dest` |
| KeyM closes on search | keep `isTypingFocus` skip; SELECT+INPUT already in helper |
| AP button close inverted | do not touch **704–706** |
| Direct engage now closes | do not steal NAV-05/06 split |
| Overlay pause | never write `flags.paused` |
| XSS names | `textContent` only |
| Persist zoom | session; reset on close |
| Filter writes world | closure only; no `for-in` |
| Itinerary leaks clues | recorded standing + `cast.pirates` only |
| Zoom steals click-plot | 4 px drag threshold |
| `textScale` confused with map zoom | keep `appliedScale` as settings; separate map scale |
| 100 vs 101 | census 101 including `veil` |
| HUD-07 / Hail02 steal | write-set `galaxychart.js` + chart CSS only |
| REDMARCH boot flake | do not “fix” |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| Map zoom/pan/filter session | later PR1 `galaxychart.js` | player |
| Dest `<select>` | later PR1 **filters options** (NAV-07 owns the control) | keyboard / AT |
| Zoom labels | later PR1 `galaxychart.js` | pointer; `activateSystem` |
| Itinerary DOM | later PR1 `galaxychart.js` | player |
| `world.nav` | **NAV-01** `nav.js` | itinerary **read** |
| `showApLive` | **NAV-05** (unchanged) | — |
| AP button `setOpen(false)` | **NAV-06** (unchanged) | — |
| `flags.paused` | **none** (KeyP) | chart open-gate |
| `state.js` | **none** | SYSTEMS / FACTIONS / RANK_LADDER read |
| `hud.js` flight HUD | **none** (HUD-07) | — |
| `agent-api.js` | **none** | — |
| Digit / station | **none** | — |

---

## Open owner questions

**Deputized this wave** (contract §0.1). Owner may override after playtest. Do not park.

1. Smallest additive = session zoom/pan + dest `<select>` kept + faction/standing filter + zoom-aware labels + hop itinerary. Do not use KeyP pause.
2. Search = dest typeahead unless playtest proves a second box is required.
3. Zoom labels at scale ≥ 2 in view. Fit view keeps 12 names.
4. Reset view on close. No persist.
5. Known risk = standing band + recorded `cast.pirates`. No clue text.
6. Home: `galaxychart.js` + chart CSS. Not `hud.js` flight HUD. Not `state.js`.
7. Optional PR2 itinerary split if PR1 bloats. Optional stills skippable after playtest.
8. Leftover is **real**. Not CONSUME. Serial is **PR1**, not none.

---

## Key Decisions

| Decision | Freeze |
|---|---|
| Leftover | **REAL** |
| Serial | **PR1** (optional **PR2 itinerary**) |
| Dest control | keep `#rw-galaxy-dest` |
| Persist | none new; `world.nav` is the plot store |
| Catalog | **101** including `veil` |
| Overlay | never `flags.paused` |
| Jump | no teleport; `gate.js` sole emit |
| Copy | `textContent` only |
| Motion | instant pan/zoom; no inertia required |

---

## PR Plan

See Proposed Design §5 and contract §3. Named only. Do not implement in Wave 128.

**PR1** is the first remaining serial. It must not steal Digit 0/8/9. It must not write `state.js`. It must not land in this worker.
