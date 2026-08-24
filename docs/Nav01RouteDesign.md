# RIMWARD NAV-01 plot a multi-system route

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-01 plot a multi-system route |
| **Author** | Wave 84 NAV-01 integrator |
| **Date** | 2026-08-21 |
| **Status** | Implemented. Wave 85 persist + chart click + recalc. |
| **Wave** | 84 — design. Later — impl. |
| **Owner request** | NAV-01 plotted route brief. Do not ship `src/` or live bindings in this wave. |
| **Merge law** | [`out/w84/nav01/shared-contract.md`](../out/w84/nav01/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w84/nav01/current-nav-inventory.md`](../out/w84/nav01/current-nav-inventory.md) |
| Merge law | [`out/w84/nav01/shared-contract.md`](../out/w84/nav01/shared-contract.md) |
| Security review | [`out/w84/nav01/security-review.md`](../out/w84/nav01/security-review.md) |
| Design-doc review | [`out/w84/nav01/code-review.md`](../out/w84/nav01/code-review.md) |
| UI audit | [`out/w84/nav01/ui-audit.md`](../out/w84/nav01/ui-audit.md) |

Siblings NAV-02 (in-flight guidance) and NAV-03 (autopilot) are **other workers**. **Do not edit** `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, or `out/w84/nav02/**` / `out/w84/nav03/**`.

---

## Overview

KeyM already opens a live SVG galaxy chart (Wave 21). It paints every charted system, two-way gates, and one-way Lamplighter hub routes, and it marks the current system. Clicking a node does nothing. There is no plotted path, no remaining-hop count, and no `WORLD_FIELDS` key for a route.

Wishlist NAV-01 wants: pick a reachable dest on that map, persist an ordered hop list, paint dest + connections + remaining jumps, tell unreachable from merely far, keep the plot while the map closes / the player flies / docks / transits, allow replace or clear, and recalc (or fail closed) after an off-route jump.

This brief is the integrator document for a **later** implementation wave. It freezes `world.nav`, BFS on `gates[].to` ∪ `hub.routes`, chart click, sanitize, `navRoute`, and a serial PR plan. Wave 84 lands this markdown only. Bindings do not change here.

HUD-01 / HUD-02 / TGT lock stay closed. Plotting must not set `ctx.targets.current` and must not steal KeyV / KeyT. Jump stays `gate.js` / `jump.js`. `state.js` stays READ-ONLY. NAV-02 / NAV-03 consume the **same** `world.nav` bag. Do not invent UU.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “NAV today”: [`out/w84/nav01/current-nav-inventory.md`](../out/w84/nav01/current-nav-inventory.md). Code wins over stale comments. Wave 21 cites are re-checked against today’s files.

| Surface | Today | Cite |
|---|---|---|
| Chart overlay | DOM/SVG, built once from `SYSTEMS` | `galaxychart.js` 4–30, 58–227 |
| KeyM / Escape | Toggle; docked/paused close-only; no preventDefault/stopPropagation | `galaxychart.js` 21–24, 240–250 |
| Current marker | `.is-current` + dashed ring; diffs `currentSystem` | `galaxychart.js` 214–220, 257–273 |
| Click-to-select | **None** | `galaxychart.js` 174–210, 238–281 |
| Hub gold dashes | `.rw-galaxy-route` = **hub** one-way, not a player plot | `galaxychart.js` 156–172; `hud.css` 1510–1516 |
| Physical gates | Undirected dedupe of `gates[].to` | `galaxychart.js` 135–154 |
| Uncharted | Skip if `chart` is not an array | `galaxychart.js` 64–65, 181 |
| Graph data | `SYSTEMS` merge authored + 94 generated | `state.js` 541; `save.js` 124 |
| Hubs | `hub.routes` on four authored cores | `authored-systems.js` 37–38, 67, 99, 131 |
| Zone + request | `gate.js` D in `JUMP.zone` 60 → `jumpRequested { to }` | `gate.js` 535–560; `state.js` 542–543 |
| Swap | `jump.js` midpoint `currentSystem`, **nulls lock**, `systemLoaded { to }` | `jump.js` 79–123, 85–87 |
| Persist | `WORLD_FIELDS` 75–98 — **no `nav` / `route`** | `save.js` 75–98 |
| Ids | `SAFE_ID`, `RESERVED_IDS`, `ID_MAX` 64 | `save.js` 101–110 |
| Emit spread | `{ type, t, ...data }` | `ctx.js` 231–232 |
| HUD toasts | `commLine` → `textContent` | `hud.js` 226–231, 723–731 |
| Landmark marks | HUD `.rw-chartmark` from **mystery** — not the galaxy chart | `hud.js` 704–721, 1409–1510 |
| Lock | KeyV / KeyT; Digit 1–4 weapons; Digit 0 shipyard | `controls.js` 37–44; `station.js` 5710–5717 |
| LMB fire | window `mousedown` → `fireHeld` | `controls.js` 314–316 |
| Chart z-index | 30, full-screen scrim | `hud.css` 1421–1432 |
| innerHTML | **none** in `galaxychart.js` | grep 0 |

There is no plotted route. The player still counts gates by eye.

### Pain points

- Wishlist NAV-01: selecting a system on the map does not create a route. The player must memorize the gate sequence.
- `.rw-galaxy-route` already means hub gold. A naive “add route class” would paint player plots as Lamplighter one-ways.
- Chart undirected-dedupe is **display**. Pathfinding that only walks undirected pairs would drop one-way hub rides (`hub.routes`).
- `jump.js` already clears `ctx.targets.current` at midpoint (`85–87`). A plot that wrote the lock would both steal TGT and then lose it on every hop.
- Window LMB fire (`controls.js` 314–316) will shoot through a full-screen chart unless the impl wave gates pointer vs guns.
- `SAFE_ID` matches `__proto__` (`save.js` 105`). Dest ids must reuse reserved-id discipline.
- `ctx.emit` spreads `data` (`ctx.js` 231–232`). Emitting `world.nav` would smash `type` and leak `path` arrays.
- Live `WORLD_FIELDS` has no route bag. Without one key, the plot dies on dock autosave / jump autosave (`JUMP.saveOnJump` true).

### Why now (design) / why not now (code)

The owner asked for the NAV-01 route brief so a later serial can land `world.nav`, chart click, and recalc against a frozen contract instead of a drive-by SVG onclick. Sibling Wave 84 workers own NAV-02 and NAV-03; this brief does **not** wait on their files and does **not** invent autopilot or in-flight gate arrows. Implementation waits so sanitize, proto ids, and lock-steal fences exist before the first click writes a bag.

---

## Goals & Non-Goals

### Goals

1. Document live chart, graph, jump, save, HUD, lock, and CSS from **live code**.
2. Freeze **one** persist key `nav` and the record shape NAV-01 owns (`dest`, `path`, `remaining`, `status`).
3. Freeze BFS on `gates[].to` **and** `hub.routes`. Uncharted dests not clickable. Unknown ids fail closed.
4. Freeze click-to-plot, unreachable vs far, clear/replace, map highlight, remaining hops on the **map**.
5. Freeze recalc on `systemLoaded` (not KeyD). No teleport.
6. Freeze restore of a **manual** plot. Never auto-engage autopilot.
7. Freeze XSS / proto / emit-smash / no-`innerHTML` / no lock steal / no mystery on the chart.
8. Freeze a serial PR plan. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in Wave 84. No implementation PRs scheduled here.
- No NAV-02 in-flight next-gate marker / off-screen pip (sibling).
- No NAV-03 Autopilot button, steering, hazard policy, or resume-on-load (sibling).
- No KeyV / KeyT / Digit 0–9 steal. No HUD-01 layout move. No HUD-02 skin reopen.
- No `state.js` write. No new `U.*` / `JUMP.*`.
- No chart pause. No keydown preventDefault/stopPropagation.
- No clue ids/text or landmark discovery on the galaxy chart.
- No UU, standing, BIO, police, Unknowables dock, power ledger, living frigate, aim-glass gauge.
- Do not edit the wishlist, `PROGRESS.md`, or sibling NAV files.

---

## Detailed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **One:** `nav` | Inventory: none today. Contract §0.3, §1 |
| Second key for AP / HUD? | **Forbidden** | NAV-02/03 add fields on `world.nav` later |
| `state.js` neighbor table? | **No** | READ-ONLY. Home is `src/game/nav.js` |
| Graph | `gates[].to` ∪ `hub.routes` (one-way) | Contract §0.9, §2 |
| Search | Unweighted BFS. No hop refuse cap | Far ≠ unreachable |
| Click dest | Charted node `data-system-id` | No free-text dest field this slice |
| Unreachable | Distinct paint + `No route…` copy. Default persist `status: 'blocked'` | Owner Q2 default |
| Far | Plot anyway; show remaining hops | Wishlist |
| Click current | **Clear** | Owner Q1 default |
| Clear control | Header button + helper `clearRoute` | Anytime replace/clear |
| Advance | `systemLoaded` only | Contract §0.10 |
| Teleport? | **No** | Jump owners stay |
| Set lock? | **No** | Contract §0.5 |
| KeyV / KeyT / digits? | Untouched | Closed |
| `innerHTML`? | **No** | `textContent` / SVG attrs / `h()` |
| Mystery on chart? | **No** | Wave 21 |
| Autopilot on restore? | **No.** Drop unknown keys including `autopilot` | Contract §0.11, §1.4 |
| New event? | `'navRoute' { dest, hops, status }` literal | Contract §5 |
| HUD hop strip? | **Not NAV-01** | Owner Q3 default; NAV-02 |
| Plot CSS class | `.rw-galaxy-plot*` — **not** `.rw-galaxy-route` | Hub gold already uses that name |
| Chart pause / key swallow? | **No** | Wave 21 |
| LMB fire through overlay? | `ctx.flags.chartOpen` + `controls.js` ignore LMB. Chart must **not** stopPropagation | Law 4; inventory §1.4 |
| `ctx.js` bag default? | Omit until plotted | Idle = missing |
| Next hop for siblings? | **`path[1]`** when plotted | No `hopIndex`. Contract §1.4.1 |
| Sibling status words `active`/`recalc`/`broken`? | **Forbidden** on the bag | Healer deletes unknown status |
| Hit disc | ≥ **24 CSS px**, filled; hub rings `pointer-events: none`; plot above rings; nodes receive click | Designer Major; contract §3.3.1 |

### 2. Player outcome

Open the galaxy chart (KeyM). Click a reachable charted system. The map marks that dest, every hop, and the remaining jump count. Close the map, fly, dock, jump the painted gates: the plot is still there when the map opens again. Click another system to replace. Click Clear (or the current node) to drop it. Jump a **wrong** gate: the game rebuilds from the new system if a path still exists, and says so if it does not. Combat lock is unchanged.

### 3. Persist / sanitize

See contract §1.

Later PR1: add `'nav'` to `WORLD_FIELDS` (`save.js` 75–98). Export `sanitizeNav` from `nav.js` (or `save.js` if the helper must sit next to `SAFE_ID` — **prefer `nav.js` importing `SAFE_ID` / `RESERVED_IDS` / `SYSTEMS`** so `state.js` stays untouched). Snapshot calls sanitize before copy. Restore: after field assign + `currentSystem` heal (`save.js` 1169–1171), **if `snap.world.nav === undefined` then `delete ctx.world.nav`**, then `sanitizeNav`.

Idle is **omission**, not `{ status: 'idle' }` in the bag.

Same-system restore emits no `systemLoaded` (`save.js` 1207–1208). Sanitize **slices** a plotted path to `currentSystem`. `initNav` runs one recalc on first update for off-path / blocked bags.

Do not persist gate meshes, `targets.current`, or autopilot engaged. Do not persist `flags.chartOpen`. Do **not** persist `hopIndex`.

#### Sibling consume (contract wins)

See contract **§1.4.1**. NAV-02 / NAV-03 MUST:

- Read `dest`, `path`, `remaining`, `status` (`plotted` \| `blocked` \| `arrived`).
- Treat next hop as **`path[1]`** when `status === 'plotted'` and `path.length >= 2`.
- Use `remaining` (coherent with `path.length - 1`). Do not strip it.
- **Not** persist a second cursor (`hopIndex` or other).
- **Not** persist `active` / `recalc` / `broken`. Recalc is an event (`navRoute`), not a stored status.
- Unknown keys still drop until a sibling serial extends the allowlist (`autopilot` later). `hopIndex` never joins that list.

### 4. Pathfinding

See contract §2.

Neighbors = listed physical `to` + hub `routes`. BFS. Cap depth `N_SYSTEMS` (`save.js` 124). Prototype / unknown ids never enter the queue.

Uncharted (`!Array.isArray(chart)`): not a click target. Transit-only if some edge names them.

### 5. Recalc

See contract §4.

`initNav` after `initJump` (`main.js` 114 vs 125). On `systemLoaded`: arrived / BFS / blocked. `commLine` reports. No `jumpRequested`. No KeyD.

### 6. UI (galaxy chart)

See contract §3 and the UI audit.

**Later CSS (do not edit this wave):** `.rw-galaxy-plot`, `.rw-galaxy-plot-node.is-dest`, `.is-hop`, `.is-unreachable`, `.rw-galaxy-plot-status`, `.rw-galaxy-clear`. Colorblind / contrast / reduced-motion already wrap `.rw-galaxy-chart` (`hud.css` 1599–1623`); plot strokes must add a **pattern** cue (thicker solid vs hub dash vs gate slate), not hue alone.

**Hit / stack (PR3):** diameter ≥ 24 CSS px (not 16 chart units). Hit circle is filled (`transparent` / `fill-opacity: 0`) or `pointer-events: all`. Hub rings, labels, current marker, plot strokes: `pointer-events: none`. Paint order: gates → hub routes → plot overlay → painted nodes + hub rings → hit discs (click) → labels → current marker. Painted `NODE_R` stays 8. See contract §3.3.1.

Status line and toasts: `aria-live` polite (toasts already; add on `.rw-galaxy-plot-status`). Close button stays. Clear is a real `<button>`.

Keyboard: do **not** steal WASD for a node cursor (chart does not pause). Click is the plot verb. Owner Q4 default.

Labels: `textContent = SYSTEMS[id].name`. Never `innerHTML`.

### 7. Events

See contract §5.

Impl wave adds one freeze-comment line on `ctx.js` ~198–228:

`'navRoute' { dest, hops, status }`

Payload is a fresh literal. `dest` is `''` on clear. Never spread `world.nav`.

### 8. Ownership

See contract §8.

Jump ownership stays `jump.js` / `gate.js`. Chart stays SVG overlay. New `src/game/nav.js` is the bag writer. HUD-01 does not gain a hop strip in this slice.

### 9. Security

See contract §7 and `out/w84/nav01/security-review.md`.

Threats this freeze exists to kill: XSS via system names, proto dest ids, persist-smuggled `path` / `type`, emit smash, chart click stealing KeyV lock, `innerHTML`, mystery leak, LMB fire-through.

### 10. PR plan (serial, later wave)

See contract §9. Named PR1–PR5 only. **Do not schedule or land them in Wave 84.**

---

## Key Decisions

1. One `WORLD_FIELDS` key: **`nav`**. NAV-01 owns `dest` / `path` / `remaining` / `status`.
2. Home module: **`src/game/nav.js`**, not `state.js`.
3. Unweighted BFS; no “too far” refuse.
4. Plot verb: chart node click. Not KeyV.
5. Advance: `systemLoaded`. Not KeyD / `jumpRequested`.
6. Plot layer class must not reuse `.rw-galaxy-route`.
7. Restore manual plot; strip `autopilot`.
8. Blocked dest persists (default) so the map can keep showing “no route”.
9. NAV-01 HUD = map status + `commLine` only.
10. LMB fire: `ctx.flags.chartOpen` + `controls.js`. Chart never `stopPropagation`.
11. Siblings consume `path[1]` + `plotted|blocked|arrived`. No `hopIndex`.
12. Hit disc ≥ 24 CSS px; hub rings do not steal clicks.

---

## Open owner questions (fail-closed defaults)

Defaults are in the contract. Do not invent UU/rep while waiting.

1. **Click the current system:** clear the route, or no-op?  
   **Default: clear.**

2. **After a failed recalc, keep `dest` as `blocked` or drop the bag?**  
   **Default: keep dest, `status: 'blocked'`, empty path.** Distinct from far.

3. **Show remaining hops on the flight HUD in NAV-01?**  
   **Default: no.** Map + `commLine`. NAV-02 owns in-flight copy.

4. **Keyboard node pick (arrows / typeahead) while the chart is open?**  
   **Default: no.** Chart does not pause; arrows would fight steering. Click + Clear button + live status.

5. **Copy strings** for plot / blocked / arrived (`commLine` templates in contract §5.2).  
   **Default: the static Echo lines in the contract.** Owner may retune wording only.

---

## Regression risks

| Risk | Freeze |
|---|---|
| Sibling stores `hopIndex` / `active` | Consume table §1.4.1; healer deletes bad status; drop `hopIndex` |
| Hub ring steals node click | Rings `pointer-events: none`; filled hit disc ≥ 24 CSS px on top |
| Path uses display-deduped undirected pairs and drops hub one-ways | Walk `gates[].to` **and** `hub.routes` |
| Player plot painted as hub gold | New `.rw-galaxy-plot*`. Never `.rw-galaxy-route` |
| Unreachable looks like “20 jumps” | Blocked copy has **no** hop count |
| Plot steals KeyV lock | Never write `targets.current` |
| Chart click fires guns | `ctx.flags.chartOpen`; `controls.js` ignores LMB. Chart never stopPropagation |
| Chart swallows flight keys | No keydown preventDefault/stopPropagation |
| Chart pauses the sim | `aria-modal=false`; do not set `paused` |
| Dock digits stolen | Chart closed while docked; digits untouched |
| Mystery / clues on the map | Chart must not read `world.mystery` |
| Proto dest / path ids | `sanitizeSystemId` + reserved set |
| Emit smash | Literal `{ dest, hops, status }` only |
| `innerHTML` names | `textContent` / SVG text |
| Restore engages autopilot | NAV-01 drops unknown keys |
| Teleport / skip charge | Jump owners unchanged; no `currentSystem` write in nav.js except via jump |
| Stale path after off-route jump | Recalc on `systemLoaded` |
| Legacy save keeps a live plot | Omit → delete |
| HUD-01 rails move | No new glance row in NAV-01 |
| Sibling double persist key | One key `nav` |

Wishlist NAV regressions to call out (from `PLAYER-EXPERIENCE-WISHLIST.md` 778–782): pathfinding choosing nonexistent connections; route markers competing with target HUD; saving mid-route restoring unsafe steering. NAV-01 freezes the first and third (sanitize + no AP). The second is a **NAV-02** fence: this slice keeps plot paint on the **map**, not the aim glass.

---

## Acceptance direction (later impl)

Testable later; not this wave.

1. Click a reachable charted node from the current system → persist `path` of system ids + `remaining` hops; map highlights dest, hops, connections, count.
2. Unreachable dest is distinct from far (blocked copy / `.is-unreachable`, not a hop number).
3. Clear and replace work at any time the map can show the control; replace overwrites.
4. After an off-route jump, recalc to a valid path or fail-closed `blocked` report (`commLine` + status).
5. Save/load restores the plotted **manual** route. Autopilot is not engaged.
6. No `innerHTML`. No lock steal. No clue/landmark read on the galaxy chart. No teleport.

`state.js` untouched. Digit 0 still shipyard. KeyM still toggle. Jump still `gate.js` / `jump.js`.
