# RIMWARD NAV-02 in-flight next-gate guidance

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-02 in-flight next-gate guidance |
| **Author** | Wave 84 NAV-02 integrator |
| **Date** | 2026-08-21 |
| **Status** | Design freeze. Later impl **after** NAV-01 persist PR. Wave 84 is markdown only. |
| **Wave** | 84 — design. Later — impl. |
| **Owner request** | While a route is active, the HUD identifies the next hop with an in-world marker **and** an off-screen cue, plus next/dest/distance/remaining jumps, without keeping the galaxy map open. Advance after the jump completes. Guidance is not a lock. |
| **Merge law** | [`out/w84/nav02/shared-contract.md`](../out/w84/nav02/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w84/nav02/current-nav-guidance-inventory.md`](../out/w84/nav02/current-nav-guidance-inventory.md) |
| Merge law | [`out/w84/nav02/shared-contract.md`](../out/w84/nav02/shared-contract.md) |
| Security review | [`out/w84/nav02/security-review.md`](../out/w84/nav02/security-review.md) |
| Design-doc review | [`out/w84/nav02/code-review.md`](../out/w84/nav02/code-review.md) |
| UI audit | [`out/w84/nav02/ui-audit.md`](../out/w84/nav02/ui-audit.md) |

Sibling Wave 84 workers own NAV-01 (plot persist + chart) and NAV-03 (autopilot). **Do not edit** `docs/Nav01RouteDesign.md`, `docs/Nav03AutopilotDesign.md`, `out/w84/nav01/**`, or `out/w84/nav03/**`.

---

## Overview

Wishlist NAV-02 wants the next hop to stay findable in flight after NAV-01 plots a path. Live today: the galaxy chart is a KeyM overlay with **no** plot (`galaxychart.js`). Jump is proximity D in `JUMP.zone` 60. HUD POS names the **current** system. The prompt names the **in-zone** gate. The amber edge arrow is the **lock**. The bottom bearing arc is **scanner ships**. There is no `world.nav` (`save.js` 75–98).

This brief is the integrator document for a **later** implementation wave. It freezes consume-`world.nav`, a third HUD identity (`nav-gate` ≠ lock ≠ scanner), authored-position markers, `systemLoaded` advance, and a serial PR plan **after** NAV-01 persist. Wave 84 lands this markdown only. Bindings do not change here.

HUD-01 occupancy stays closed. HUD-02 skins stay closed. KeyT / KeyV / KeyX / Digit 0–9 / KeyM stay. Guidance must **not** write `ctx.targets.current`. `state.js` stays READ-ONLY.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “NAV / HUD / gate today”: [`out/w84/nav02/current-nav-guidance-inventory.md`](../out/w84/nav02/current-nav-guidance-inventory.md). Code wins over stale comments. Wave 73/81 line numbers are stale if they disagree.

| Surface | Today | Cite |
|---|---|---|
| Persist | `WORLD_FIELDS` has no `'nav'` | `save.js` 75–98 |
| `ctx.gate` | Zone + charge, **not** a plot | `ctx.js` 153–162; `gate.js` 535–560 |
| Jump request | In zone + D → `'jumpRequested' { to }` | `gate.js` 558–559 |
| Jump midpoint | Swap system, **null lock**, `'systemLoaded' { to }` | `jump.js` 79–137, **85–87**, **123** |
| Gate pick | KeyV authored bore **30**, not zone 60, not glow 96 | `reticle-aim.js` 19, 172–203 |
| Lock chrome | Bracket + amber `.rw-edge-arrow` | `hud.js` 688–702, 1182–1196 |
| Contacts arc | Scanner ≥ 1, **ships**, bottom 5.5% | `hud.js` 44–47, 1255–1260; `hud.css` 671–680 |
| Chart marks | Charted unvisited **landmarks** | `hud.js` 704–721, 1409–1449 |
| Toasts | Top-right `right:168px` (off aim column) | `hud.css` 588–594 |
| Banner | Top-right `top:96px` on `systemLoaded` | `hud.js` 597–618, 1032–1044 |
| Prompt | Bottom 20%: Dock / Jump / Hail / … | `hud.js` 1750–1816 |
| POS | Current system name + XYZ | `hud.js` 878–881, 1622–1635 |
| Chart | KeyM; names/factions/gates; **no plot**; no clues | `galaxychart.js` 14–19, 240–250 |
| Names | `el()` / overlays use `textContent` | `hud.js` 226–231; `gate.js` 578 |
| `innerHTML` | **none** in `hud.js` | grep 0 |
| Digits | 1–4 weapons; docked 0–9 services; 0 = shipyard | `controls.js` 41; `station.js` 174, 5710–5714 |
| `reducedMotion` | Gate VFX freeze to static | `gate.js` 152–202, 520 |
| Emit smash | `emit` spreads `data` onto `{ type, t, ...data }` | `ctx.js` 231–232 |

There is no next-hop HUD. There is no routed-gate marker. `ctx.gate.nearTo` is “the gate I am standing in,” not “the hop I plotted.”

### Pain points

- Wishlist NAV-02: after a multi-hop plot, the player must close the chart and still find the **correct** gate among several, including behind the camera.
- Reusing the lock arrow would replace a combat lock when the player plots, or would look like the routed gate is the selected target.
- Reusing the TGT-03 contacts arc would put a **gate** on a **scanner-gated ship** instrument and reopen HUD-01 bottom occupancy.
- Advancing on `jumpRequested` would move the marker before arrival (and before `gate.js` rebuilds on `lastEvents` `systemLoaded`).
- A 3D marker that is pickable, or stamped `lockKind`, would steal KeyV disc/cone (`reticle-aim.js` `LOCK_CONE_PX` 12) or MATCH/mining if it looks like a rock.
- System names are world strings. `innerHTML` (models-browser pattern) would XSS the HUD.
- A second persist key would fork NAV-01’s path. A stuffed `path[1]` / proto `dest` could mark the wrong gate. Requiring `hopIndex` would hide a legal NAV-01 bag (unknown keys drop).

### Why now (design) / why not now (code)

The owner asked for the NAV-02 guidance brief in the same wave as NAV-01 persist+chart and NAV-03 autopilot. Inventory and merge law exist. Implementation waits for a later serial **after** NAV-01 persist so the HUD reads a sanitized `world.nav` instead of inventing a parallel cursor. Wave 84 does not ship `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live HUD occupancy, gate zone vs pick, jump midpoint, chart, keys, and persist gap from **live code**.
2. Freeze consume-`world.nav` **exactly** as NAV-01 `{ dest, path, remaining, status }` (`plotted|blocked|arrived`). No second key. No `hopIndex`.
3. Freeze guidance as a **third identity**: not lock, not scanner arc, not landmark chart mark.
4. Freeze in-world decorative marker on the **routed** gate only + distinct off-screen `.rw-nav-gate-cue`.
5. Freeze persistent readout: next name, dest name, distance, remaining jumps. Chart may stay closed.
6. Freeze rebind on `'systemLoaded'` / `'navRoute'`. Recalc HUD is transient, not a persist enum.
7. Freeze XSS / proto / emit / stuffed-`path[1]` law. `textContent`. No meshes in events.
8. Freeze serial PR plan after NAV-01 persist. This wave writes the brief.

### Non-goals (locked — do not reopen)

- No `src/` in Wave 84.
- No NAV-01 plot UI, pathfinding, or chart highlight numbers.
- No NAV-03 autopilot, cancel, or steering.
- No `state.js` writes. No new `U.*` / `JUMP.*`.
- No HUD-01 layout move. No HUD-02 skin reopen.
- No KeyT / KeyV / KeyX / KeyM / Digit 0–9 steal. No KeyG auto-snap to plot.
- No scanner-arc gate pip. No lock write from route.
- No UU, standing, BIO gift/pirate, police leave, Unknowables dock, BIO-04, power ledger, living frigate, aim-glass.
- Do not edit the wishlist, `PROGRESS.md`, sibling NAV-01/NAV-03 paths, or listed closed design docs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New persist key? | **No.** Consume `world.nav` | Merge law §3. Live `save.js` 75–98 has no `nav` |
| Record shape? | **Exactly** `{ dest, path, remaining, status }` | NAV-01 §1.2. Unknown keys drop |
| `status` tokens? | `'plotted' \| 'blocked' \| 'arrived'` | Idle = omit bag. **Not** `active\|recalc\|broken` |
| Extra persist fields? | **None** this slice | Sanitize would drop `hopIndex` / `nextTo` |
| Next hop? | **`path[1]`** when `plotted` and `path.length >= 2` | NAV-01 §2.3. `path[0]` is current |
| `remaining`? | Display the **bag** int | NAV-01: `path.length - 1`. Do not derive from a cursor |
| Recalc HUD? | **Transient** after `systemLoaded` / `'navRoute'` | Recalc is an **event**, not a persist status |
| Persist `nextTo` / `hopIndex`? | **No.** Never | Would hide after legal NAV-01 restore |
| Set `targets.current`? | **Never** from route/marker/readout | Merge law §4. Guidance is not a lock |
| Off-screen instrument? | New `.rw-nav-gate-cue` | Not TGT-03 arc, not lock arrow, not chartmark |
| In-world marker pickable? | **No.** Empty `raycast`. No `lockKind` | Merge law §10. Bore pick stays 30 |
| Jump / dock zones? | Stay verbs (60 / 45) | Merge law §11 |
| Advance clock? | `'systemLoaded'` midpoint, not `'jumpRequested'` | `jump.js` 123 vs 144; NAV-01 then writes plotted/blocked |
| Readout place? | `.rw-side-col` above POS; **max-width 180px** + ellipsis | Off rails; `textScale` 1.5 must not cover target rail |
| Hide / motion? | Docked+jumping hide and static motion in **first chrome PR** | Not deferred to PR5 |
| Toasts for hop? | **No** NAV-02 `commLine` | Persistent readout; NAV-01 may already toast |
| `innerHTML`? | **No** | Live HUD is `textContent` |
| New event? | **None.** Consume `'navRoute'` + `'systemLoaded'` | Merge law §14. Do not invent `'navGuidance'` |
| Keys? | Untouched | Digit 0–9, M, T, V, X, G |
| Chart clues? | Still never | `galaxychart.js` 14–19 |
| `state.js`? | READ-ONLY | Architecture |
| Hub KeyG snap to plot? | **No** | Would steal KeyG; marker still on the physical hub |
| Autopilot HUD? | Out | NAV-03 |

### 2. Player outcome

With a sanitized `world.nav` where `status === 'plotted'`, the flight HUD (chart closed) names `SYSTEMS[path[1]]`, the dest, bag `remaining`, and distance to the routed gate. A cyan/wake **gate chevron** on the screen edge finds that gate when it is off-screen or behind the camera. A static-capable in-world ring sits on **that** gate only.

The player can lock a ship, rock, or station. The route stays. Plotting or showing guidance does not replace `targets.current`. Amber lock arrow and nav chevron may appear together.

After a correct jump, `systemLoaded` fires at charge midpoint; NAV-01 rewrites `path` so `path[0]` is the new current and `path[1]` is the next hop (`status` stays `'plotted'`). The HUD rebinds. After a wrong-gate jump, NAV-01 BFS writes `'plotted'` or `'blocked'` and emits `'navRoute'`. The HUD shows transient `REROUTE` or persist `NO ROUTE` on the readout, not a center toast.

### 3. Persist consume

See contract §2. Consume NAV-01 **exactly**:

```
world.nav = { dest, path, remaining, status }
status ∈ { plotted, blocked, arrived }
idle = omit the bag
next hop = path[1]
```

Live save has no `nav`. First impl PR of **this** family is blocked on NAV-01 adding `'nav'` + healer. Do **not** propose `hopIndex`. Do **not** persist `'recalc'` / `'broken'` / `'active'`.

HUD map: `plotted` → next/dest/remaining/distance; `blocked` → `NO ROUTE`; `arrived` → hide; omit → hide.

Restore: re-read `ctx.world.nav` every HUD/marker update. Same-system restore emits no `systemLoaded` (`save.js` 1207–1208).

### 4. Next gate (authored)

See contract §3. Assemblies are private (`gate.js` 429). Resolve:

1. Physical `gates[i].to === nextTo` → that position.
2. Else hub `routes` contains `nextTo` → `hub.position`.
3. Else no 3D / no edge cue.

One marker. Distance from player ship to that point.

### 5. HUD readout

See contract §7.

Module: `hud.js` (existing overlay, created-once nodes). Class `.rw-nav-readout`. CSS in `hud.css` (not a new injected W2 sheet unless occupancy cannot land there — prefer `hud.css`).

Copy is labels + allowlisted names via `stripHudText`. `JUMPS` is bag `remaining`. Distance matches chart-mark abbreviation (`hud.js` 1507–1509). Screen-reader live region covers next / dest / remaining / status only — not the 5 Hz distance field (contract §7).

CSS in **PR1**: `max-width: 180px`; name ellipsis; `min-width: 0`. Combat: `.rw-aux` 0.38. Docked / jumping: **hidden in PR1** (station overlay / jump bar own those moments).

### 6. Off-screen cue

See contract §5.

Project with the lock-arrow behind-camera flip (`hud.js` 1141–1142) but a **new** node. Hide when the gate is on-screen (3D marker is the find-aid). `EDGE_MARGIN` 84. Distinct glyph.

### 7. In-world marker

See contract §6.

Owner at impl: a small nav-guidance visual in `gate.js` **or** a new `src/systems/nav-guidance.js` that only **reads** `world.nav` + `SYSTEMS` + player position. Do **not** put Three.js in `hud.js` if a dedicated module is cleaner. Do **not** write the nav bag. Next gate id is `path[1]`.

Empty `raycast`. Shared material. `reducedMotion` static.

### 8. Events

See contract §9. **No new frozen type** from NAV-02. Consume `'systemLoaded' { to }` and NAV-01 `'navRoute' { dest, hops, status }`. Never emit meshes. Do not invent `'navGuidance'`.

### 9. Ownership

| Surface | Writer | Reader |
|---|---|---|
| `world.nav.{ dest, path, remaining, status }` | NAV-01 | NAV-02 HUD + marker (read only) |
| `targets.current` | `controls.js` + `npc.js` + jump/stale drops | combat/hud/hail/ship |
| `ctx.gate.*` | `gate.js` / `jump.js` as today | HUD prompt, jump overlay |
| `.rw-nav-readout` / `.rw-nav-gate-cue` | `hud.js` | player |
| In-world ring | NAV-02 visual module | player |
| Chart plot | NAV-01 | — |
| Autopilot | NAV-03 | — |

### 10. Security

See `out/w84/nav02/security-review.md`. Freeze: `textContent`; allowlisted `SYSTEMS` names; no `innerHTML`; no bag write; no emit of assemblies; marker not a lock body; fail-closed stuffed `path[1]` / `dest` / unknown `status`.

### 11. PR plan (serial, later wave, **after** NAV-01 persist PR)

See contract §13.

1. NAV-01 persist (`WORLD_FIELDS` `'nav'`, sanitize `{ dest, path, remaining, status }`, plot, `systemLoaded` recalc).
2. NAV-02 PR1 readout from NAV-01 tokens + **width cap/ellipsis** + **hide docked/jumping**.
3. PR2 off-screen cue (static; no `@keyframes`).
4. PR3 in-world ring (static under `reducedMotion`).
5. PR4 rebind + transient `REROUTE` + `blocked`/`arrived` + restore.
6. PR5 boot pins / screenshots only.

Do not parallel PR1 with a second persist key. Do not defer hide/motion/width to PR5.

---

## Key Decisions

1. **Guidance is not a lock.** Plot never writes `targets.current`. Amber lock chrome and cyan nav chrome are simultaneous.
2. **One persist record, NAV-01 shape.** Consume `{ dest, path, remaining, status }`. Next = `path[1]`. No `hopIndex`. Recalc is an event.
3. **Advance at midpoint `systemLoaded`.** Not at `jumpRequested`. HUD then reads the bag NAV-01 just wrote.
4. **Distinct off-screen class.** `.rw-nav-gate-cue` ≠ contacts arc ≠ lock arrow ≠ chartmark.
5. **Readout above POS.** Persistent, capped 180 px + ellipsis, not toast, not banner-on-aim-column.
6. **Authored positions.** Do not walk private assemblies. Do not enlarge KeyV discs.
7. **KeyG stays player-owned.** Marker on the hub body; D may still jump a non-plot hub selection; NAV-01 recalc handles the miss.
8. **No new event.** Consume `'navRoute'` + `'systemLoaded'`.

---

## Open owner questions

1. **Hub auto-select** — this brief freezes **no** KeyG snap. If the owner wants the junction lamp to pre-select `path[1]` when entering the zone, that is a **later** NAV-01/NAV-03 interaction, not a lock, and needs an explicit yes.
2. **Transient `REROUTE` duration** — freeze is one 5 Hz equality tick after `path[1]` changes. Owner may ask for a fixed second count instead.
3. **Readout in first-person** — freeze same bottom-right slot on all three cameras (HUD-01 “one HUD”). Owner override only if POS moves.

---

## Regression risks

- Route marker competing with lock bracket / lead / amber edge arrow (wishlist NAV acceptance).
- Contacts-arc reuse putting a gate on a scanner-gated ship instrument (HUD-01 / TGT-03).
- Marker child of a gate becoming a Raycaster / cone steal if a later PR scene-picks (TGT-05 forbids full-scene Raycaster; keep empty `raycast` anyway).
- Advancing on `jumpRequested` then rebuilding on `systemLoaded` one frame later (wrong gate marked during charge).
- `jump.js` 85–87 clearing **lock** interpreted as clearing **route**.
- Requiring `hopIndex` so a legal NAV-01 persist hides guidance (unknown keys drop).
- Branching HUD on `'active'` / `'recalc'` / `'broken'` so `'plotted'` / `'blocked'` never paint.
- Stuffed `path[1]` / proto `dest` marking the wrong gate or XSS names.
- System name `innerHTML` on readout (XSS).
- `emit(..., assembly)` or `emit(..., navBlob)` smash via `type` (`ctx.js` 231–232).
- Chart growing clue/landmark layers while adding a path (NAV-01 risk; NAV-02 must not add them).
- Toasts on the aim column if someone uses `commLine` for every hop (`hud.js` 1009–1020).
- `reducedMotion` ignored → glow-scale pulse on the nav ring (seizure).
- Digit/KeyM steal when adding a “next gate” bind that is not needed.

---

## Acceptance direction

1. With an active `nav` path, flight HUD names next hop + dest + remaining jumps + distance to the routed gate.
2. Off-screen chevron/arrow finds the routed gate when it is behind the camera.
3. In-world marker on the **routed** gate only; other gates stay unmarked.
4. Locking a ship/rock/station does not clear the route; route does not replace the lock.
5. Indicator rebinds after jump completes (`systemLoaded`); NAV-01 recalc writes `'plotted'` or `'blocked'`; HUD shows transient `REROUTE` or persist `NO ROUTE`.
6. `reducedMotion`: no seizure pulses; static marker ok.

Boot / later pins (impl wave): chart closed; two gates in system; lock a ship then plot; plot then lock; jump correct gate; jump wrong gate; restore mid-route without `systemLoaded`; `reducedMotion` on; scanner 0 (cue still works); scanner 2 (contacts arc still ships-only).
