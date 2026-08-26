# NAV-09 chart readability shared contract

**Wave:** 128. Design only. No chart-readability ships in this wave.  
**Status:** MERGE LAW for `docs/Nav09ChartReadabilityDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (chart zoom / pan / filter / zoom-labels / hop itinerary).  
**Name:** 101-system chart as exploration and decision tool (not only a route picker).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01*`–`docs/Nav08*`, `docs/Hail01*`, `docs/Hail02*`, `docs/Hud06*`, `docs/Hud07*`, `docs/AgentApiDesign.md`, `docs/Ctl*.md`, `docs/OwnerDecisions*`. Do not write Hail02 or HUD-07. Do not steal `out/w128/hailmiss/**`, `out/w128/deconflict/**`, `out/w127/**`, `out/w122/**`. Do not write `out/w128/chartread/verify/**`.

**Locked sources:** wishlist INBOX (P1, NAV) chart readability (`docs/PLAYER-EXPERIENCE-WISHLIST.md` **106–111** — **cite, do not edit**); live inventory `out/w128/chartread/current-nav09-chart-inventory.md` (code wins); NAV-01 `world.nav`; NAV-06 Autopilot **button** `setOpen(false)`; NAV-07 dest `<select id="rw-galaxy-dest">` + KeyM `isTypingFocus` skip; CTL-02 overlay mutex never `flags.paused`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale NAV-08 CONSUME (that leftover was remaining-NAV after NAV-07, **not** this inbox).

**This leftover is chart readability (NAV-09).** It is **not** NAV-08 remaining-NAV. It is **not** NAV-07 dest rewrite. It is **not** NAV-06 close-on-AP. It is **not** NAV-05 `showApLive`. It is **not** HUD-07 deconfliction. It is **not** HUD-06 HOME pip. It is **not** Hail02. It is **not** Agent chart teleport.

**Live hole:** static full-network `viewBox`; no pan/zoom; dest list is 101 unfiltered options; labels are 12 static names; plot status is `name · N jumps`, not a hop itinerary. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. Chart is overlay, not hub. **No** chart pip on the reticle.
3. Digit 0 stays **shipyard**. Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics**. **No new Digit.** KeyM stays chart toggle. **Do not remap KeyM.**
4. NAV-07 dest `<select id="rw-galaxy-dest">` **stays**. Zoom/filter may **filter options**, group them, or disable hidden ones. Do **not** delete the a11y dest control. Do **not** replace it with a new unnamed widget. Census: the hole is the **length** of the list, not the `<select>`.
5. Existing KeyM close **skips `isTypingFocus()`** (NAV-07) and also skips `#rw-galaxy-dest`. If later PR1 adds a search `<input>`, close-skip **must still honor typing focus** (`overlay-policy.js` already includes INPUT / TEXTAREA / SELECT). Do **not** add a second KeyM listener. Do **not** remap KeyM. Escape still closes.
6. Overlay mutex CTL-02: hail / chart / berth exclusive. Hail / chart / berth **never** write `ctx.flags.paused`. NAV-06 Autopilot **button** success still `setOpen(false)`. Direct `tryEngage` still does **not** close. **Cite; do not steal.**
7. NAV-07: labels share `activateSystem`; hover inspects only. Do **not** fight click-to-plot. Do **not** plot on hover.
8. `innerHTML` forbidden later. SVG/HTML via `createElement` / `createElementNS` / `textContent` / `el()`. System names from authored `SYSTEMS[id].name` only (via `destLabel` / `stripControlChars`). No `insertAdjacentHTML` / `document.write`.
9. `src/game/state.js` is READ-ONLY later. **No** new persist key. Zoom / pan / filter are **session** (closure on the chart). Default **none** persist. Do **not** persist flying Autopilot. Do **not** invent UU / SKU / Digit.
10. Route plot persist already exists (NAV-01 `world.nav`). **Cite; do not invent a second plot store.** Itinerary is a **read** of plotted hops + live faction / standing / gate. Clear route hides itinerary.
11. Agent API: do **not** add chart cheat teleport. Observe may later read filter state; **not this wave**. Do not claim `agent-api.js`.
12. Fail closed:
    - Unknown system id → ignore (existing `sanitizeSystemId`).
    - Standing lookup missing → show **Unknown**, do not throw.
    - Never `for-in` a filter payload into `world`.
    - Never throw out of zoom / pan / filter / itinerary paint.
    - Missing overlay helper → skip mutex (live chart catch) **and do not** fall back to `flags.paused`.
    - Never freeze the sim.
13. `reducedMotion`: **no** inertial pan animation required. Instant pan/zoom is ok. Honor `body.rw-reduced-motion` (live chart already kills animation/transition — `hud.css` **2373–2376**).
14. Keyboard: dest select + labels stay reachable. If zoom/pan is pointer, provide a **non-pointer equivalent** (dest select stays; add Zoom in / Zoom out / Reset **buttons**, min 24 px). Hit targets a11y.
15. Do not “fix” REDMARCH `castMatches`.
16. Later write-set if REAL: **`src/systems/galaxychart.js`** plus chart CSS in that file **or** existing overlay CSS **only if already owned by the chart** (`.rw-galaxy-*` in `src/ui/hud.css`). Do **not** claim `hud.js` flight HUD. Do **not** claim `jump.js`. Do **not** claim `nav.js` BFS rewrite. Do **not** claim `autopilot.js`. Do **not** claim `controls.js`.
17. Catalog count is **101** (7 authored including Wave 94 `veil` + 94 generated). Do **not** hardcode 100.
18. §25: never unpublished clue text / landmark `line` on the itinerary or hover. Navigation information only.
19. Do not steal NAV-06 close-on-AP, HUD-06 HOME pip, Hail02, HUD-07 deconfliction, Agent API PR2–PR6, NAV-07 dest select rewrite.
20. Bindings do not change here.

---

## 0.1 Wave 128 deputize (owner may override after playtest)

Pick a playable **chart exploration + decision** punch. Inventory proves the hole is **live**. Do not park. Do not invent UU / SKU / Digit / persist key / teleport.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Systems | **101** charted | inventory §0 |
| `viewBox` | static bbox + MARGIN 80 | `galaxychart.js` **43–44**, **124–127**, **254** |
| Dest `<select>` | `#rw-galaxy-dest` all charted | **202–230** |
| Labels | 12 authored ∪ pinned ∪ hub | **340–351** |
| HIT discs | 24 CSS px | **48**, **504–514** |
| Plot persist | `world.nav` one record | `save.js` **103–104** |
| AP button close | `setOpen(false)` | **704–706** |
| Direct engage | does not close | NAV-05/06 |
| KeyM typing | `isTypingFocus` + dest id | **766–779** |
| Overlay pause | **never** | `overlay-policy.js` **4** |
| `innerHTML` | none | grep 0 |
| Hub | 80 px empty | `hud.css` **184–193** |
| Digit 0 | shipyard | `station.js` **188** |

### Playable policy (smallest additive)

**Name:** session zoom/pan on the SVG + faction/standing **filter of discs, labels, and dest options** + zoom-aware names + hop itinerary **read** of `world.nav.path`. Dest `<select>` stays.

| Piece | Freeze |
|---|---|
| **Zoom / pan** | Session only. Wheel + drag on the SVG. Keyboard: **buttons** Zoom in / Zoom out / Reset (ids `rw-galaxy-zoom-in`, `rw-galaxy-zoom-out`, `rw-galaxy-zoom-reset`). Optional arrow pan while the SVG is focused is allowed; not required if buttons exist. **Reset on close** so reopen is the full network. No persist. `reducedMotion`: instant, no inertia. |
| **Click vs drag** | Pointer movement below **4 CSS px** still plots via `activateSystem`. Pan starts on the SVG **background**, not as a second plot path. Do not steal NAV-07. |
| **Labels at zoom** | Default (fit) keeps today’s 12 names. When zoomed in past deputize **scale ≥ 2** (owner may retune 1.5–3), show `textContent` names for charted systems whose nodes sit in the **current viewBox**. Hide extra names when zoomed back out. New labels still `data-system-id` + `isPlotTarget` (NAV-07). Do not grow `HIT_CSS_DIAMETER`. |
| **Dest `<select>`** | **Keep.** Filter may hide/disable options that fail faction/standing. Placeholder `Plot a system` stays. Sync `select.value` from `nav.dest` still. If dest is filtered-out but plotted, **keep that option visible** (decision tool). |
| **Search** | Native dest typeahead **is** search. Do **not** require a second search box. Optional later search `<input>` only if playtest proves typeahead + filter still fail; if added, KeyM skip must honor `isTypingFocus()`. |
| **Faction filter** | Labeled `<select id="rw-galaxy-filter-faction">`. Options: `All` + authored `FACTIONS` display names (`textContent`). Value = faction key or `''`. Session. Filters discs + labels + dest options. Current system **stays visible**. |
| **Standing filter** | Labeled `<select id="rw-galaxy-filter-standing">`. Options: `All` + `RANK_LADDER` names + `Unknown`. Uses `standingRead` + `rankFor`. Missing bag → **Unknown**, do not throw. Independent / unknown faction → **Unknown**. |
| **Filter + map** | Hidden discs: `visibility: hidden` or `display: none` on node/hit/label (not removed from `nodesById`). Gates/hub lines: hide an edge if **both** ends fail the filter; keep an edge if either end is current/dest/hop. Never `for-in` into `world`. |
| **Itinerary** | `#rw-galaxy-itinerary` **under the dest field** (before SVG). Hidden when no plotted path (`status !== 'plotted'` or path length < 2). One row per hop in `world.nav.path` order. Columns/fields: **display name**, **faction** (`FACTIONS.name` or Unknown), **standing band** (`rankFor` name or Unknown), **gate type** to the **next** hop, **known risk**. `ol`/`li` + `textContent`. No `innerHTML`. If hop count would shrink the SVG, the list **scrolls** (`overflow: auto` + a max-height). Do not cover Autopilot / Close. Do not raise z. |
| **Gate type** | No `gates[].type` field live. Freeze tokens: `gate` (from.gates `to` === next), `hub route` (from.hub.routes includes next), `gate + hub` (both), `unknown` (neither — fail closed, still list the hop). Do not invent a new SYSTEMS field. |
| **Known risk** | Recorded state only: standing band (Suspect/Marked → `hostile standing`; else rank name or Unknown) **plus** authored `cast.pirates` as `pirate traffic N` when `typeof n === 'number' && n > 0`, else omit that clause. **Never** clue `line`, landmark `line`, or unpublished mystery. Color is not the only cue. |
| **Blocked / arrived** | Blocked: hide hop list; keep plot status `No route from here.` Arrived: hide hop list or one `Arrived` line (do not duplicate NAV-05 AP live). |
| **Persist** | **none** new. `world.nav` stays the only plot store. |
| **Fail-closed** | never throw; never pause; never persist zoom; unknown id ignore. |

### Later copy (authored `textContent` literals)

`{name}` = `SYSTEMS[id].name` cleaned. `{faction}` = `FACTIONS[key].name` or `Unknown`. `{rank}` = `RANK_LADDER` name or `Unknown`. `{gate}` = `gate` / `hub route` / `gate + hub` / `unknown`. `{risk}` = standing clause + optional pirate traffic.

**Itinerary heading:** `Itinerary`  
**Hop line:** `{name} — {faction} — {rank} — {gate} — {risk}`  
**Empty / hidden:** no node, or `hidden` + `aria-hidden=true` when no plot.  
**Filter labels:** `Faction` / `Standing`.  
**Zoom buttons:** `Zoom in` / `Zoom out` / `Reset view` with matching `aria-label`.

Do **not** interpolate system ids into HTML. `textContent` only.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/galaxychart.js` (session zoom/pan, filter, zoom labels, itinerary paint, zoom buttons, filter selects).
- **CSS:** `.rw-galaxy-*` in `src/ui/hud.css` **or** styles kept next to the chart module if the impl wave already owns that file for chart chrome. Do **not** restyle flight HUD.

**May call (do not rewrite):**

- `plotRoute` / `clearRoute` / `sanitizeSystemId` (`nav.js`)
- `hoverModel` (`chart-hover.js`)
- `standingRead` / `rankFor` / `FACTIONS` / `SYSTEMS`
- `tryEngage` / `disengage` / `showApLive` (leave bodies)
- `canOpenPlayCard` / `isTypingFocus` / `playSurfaceBlocked`

**Do not claim:**

- `src/systems/hud.js` flight HUD / HUD-07
- `src/systems/jump.js` / `src/game/gate.js`
- `src/game/state.js`
- `src/systems/controls.js`
- `src/systems/agent-api.js`
- `src/game/autopilot.js` (NAV-06 close stays the button path)
- NAV-07 dest select **rewrite** (filter options only)

---

## 2. Partial merge forbidden

PR1 must land **together** enough of: session zoom/pan (with non-pointer buttons), dest `<select>` kept, faction **or** standing filter that hits both map and options, zoom-aware labels, itinerary when a plot exists. Shipping zoom without keeping the dest `<select>` is forbidden. Shipping a second unnamed dest widget is forbidden. Shipping itinerary via `innerHTML` is forbidden.

If impl bloats, split **PR2 itinerary** (named only): hop list only, same write-set. Zoom+filter stay PR1. Do **not** land `src/` in Wave 128.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** chart-readability | session zoom/pan + buttons; zoom-aware labels; faction/standing filter of discs+labels+dest options; dest `<select>` kept; KeyM typing skip still honors INPUT/SELECT; itinerary read of `world.nav.path` **unless** split to PR2 | persist zoom; replace dest select; AP close steal; `showApLive` rewrite; `innerHTML`; `flags.paused`; Agent teleport; HUD-07; HUD-06; Hail02; `state.js`; Digit; KeyM remap; `jump.js` |
| **PR2 itinerary (optional split)** | hop list faction/standing/gate/risk | new persist; clue text |
| **PR2 stills (optional)** | playtest stills: zoom a cluster; filter Red Ledger; itinerary names hops | required with PR1 |
| **PR3 census (optional skip)** | re-grep: no innerHTML; dest id live; no WORLD_FIELDS zoom | new world field |

First remaining serial is **PR1**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim `hud.js` flight HUD. Do not land overlay pause.

---

## 4. Wins vs integrator brief

| Brief | Contract |
|---|---|
| Census zoom+search+filters+labels+itinerary already live → CONSUME none | **Not live.** REAL / PR1 |
| Keep dest select | **Yes** |
| Session zoom; default no persist | **Yes** |
| Itinerary reads `world.nav` | **Yes** |
| NAV-06 / NAV-07 / overlay mutex | **Cite only** |
| 101 including veil | **Yes** |
| Markdown only this wave | **Yes** |
