# Current NAV-02 guidance inventory (Wave 84)

**Wave:** 84. Markdown only.  
**Rule:** Live code wins over comments, lore, Wave 73/81 cites, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** In-flight next-gate guidance while a plotted route is active. Persist is **consume `world.nav` (NAV-01)**. Guidance is **not** a lock. Off-screen cue is **not** the TGT-03 scanner bearing arc.

This file is the source of truth for “NAV / HUD / gate today” at Wave 84. The integrator brief and `shared-contract.md` must not invent a second persist key, a lock write, a scanner-arc reuse, or a KeyT/KeyV/KeyX steal unless they mark it **proposed, needs owner**.

Cites are `file:line` at inventory time (2026-08-21).

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/save.js` | `WORLD_FIELDS` 75–98. **No `'nav'` today.** Autosave `rimward-save-v1`. |
| `src/core/ctx.js` | `gate`, `targets`, frozen events, `emit` spread, `settings.reducedMotion` |
| `src/game/jump.js` | `jumpRequested` consume; midpoint `systemLoaded`; **clears lock** |
| `src/systems/gate.js` | Assemblies, zone 60, KeyG hub cycle, glow scale, overlay, reducedMotion |
| `src/game/gate-scale.js` | `BORE_RADIUS` 30, `ZONE` 60, `RING_RADIUS` alias |
| `src/game/state.js` | `JUMP`, `U.DOCK_RANGE` / `TARGET_RANGE` **READ-ONLY** |
| `src/systems/hud.js` | Rails, toasts, banner, jump bar, prompt, edge arrow, contacts arc, chart marks, POS |
| `src/ui/hud.css` | Occupancy: aim glass, rails 57%, toasts, contacts, prompt, resources |
| `src/systems/controls.js` | KeyT / KeyV / TRACKED; no KeyM here |
| `src/game/reticle-aim.js` | Gate **lock** pick uses authored positions + bore 30; not glow, not zone |
| `src/systems/galaxychart.js` | KeyM overlay. Names/factions/gates only. **No route plot today.** NAV-01 owns plot UI. |
| `src/systems/station.js` | Digit 0–9 dock services. Digit 0 = shipyard. |
| `src/main.js` | Init order: gate → … → jump → … → chart → HUD last |
| `src/systems/song.js` | `jumpRequested` / `systemLoaded` cues (81–82) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | NAV-02 730–740. **Do not edit.** |
| `docs/HudUtilityChangeProposal.md` | HUD-01 closed. Aim glass empty. **Do not reopen occupancy.** |
| `docs/Hud02IdentitiesDesign.md` | HUD-02 closed. Glance set stays. |
| `docs/Tgt05LockCatsDesign.md` | Gate lockKind already ships. Guidance must not become a lock. |

---

## 1. Persist today — no `world.nav`

| Surface | Today | Cite |
|---|---|---|
| Whitelist | `WORLD_FIELDS` lists time/credits/…/`fieldOre`. **No `'nav'`** | `save.js` 75–98 |
| Copy-out | `for (const k of WORLD_FIELDS)` copies `ctx.world[k]` | `save.js` 953 |
| Restore | Same walk on restore | `save.js` 1160 |
| Sanitize | Jobs, reputation, fieldOre, cargo. **No `sanitizeNav`** | `save.js` 1107–1109 |
| Lock persist | `targets` is **not** a world field | `ctx.js` 168–172 vs `save.js` 75–98 |
| Settings | `reducedMotion` is **client** settings key, not `WORLD_FIELDS` | `ctx.js` 185–191 |

Grep `world.nav` / `'nav'` under `src/` at inventory time: **0**. Live save has no nav record. NAV-01 owns the first `WORLD_FIELDS` `'nav'` add and the healer. NAV-02 **consumes** that record and may **propose extra fields on the same object**. NAV-02 must **not** add a second key.

---

## 2. `ctx.gate` (live travel surface, not a plotted route)

| Field | Owner | Role | Cite |
|---|---|---|---|
| `inZone` | `gate.js` | Player within `JUMP.zone` of **nearest** assembly | `ctx.js` 155; `gate.js` 548–552 |
| `nearTo` | `gate.js` | System id of that in-range gate / selected hub route | `ctx.js` 156; `gate.js` 553 |
| `nearHub` | `gate.js` | Junction vs physical gate | `ctx.js` 157; `gate.js` 550–554 |
| `nearRouteIndex` / `nearRouteCount` | `gate.js` | KeyG selection on hub | `ctx.js` 158–159; `gate.js` 555–556 |
| `jumping` / `progress` / `destination` | `jump.js` | Charge sequence | `ctx.js` 160–162; `jump.js` 70–76, 160–166 |

`ctx.gate` is **proximity + charge**. It is **not** a multi-hop plot. `nearTo` is whichever gate the ship is standing in, not the routed next hop.

Assemblies are **module-private** (`const assemblies = []`, `gate.js` 429). HUD and lock pick **cannot** walk that array. World positions come from `SYSTEMS[current].gates[i].position` and optional `hub.position`.

---

## 3. Jump sequence (advance clock)

| Step | What happens | Cite |
|---|---|---|
| Request | In zone + `dockPressed` → `emit('jumpRequested', { to: near.to })` | `gate.js` 558–559 |
| Begin | Same frame: `jump.js` `beginJump(e.to)` if `SYSTEMS[to]` | `jump.js` 139–147, 70–76 |
| Charge | `progress` 0→1 over `JUMP.chargeTime` 2.5 s | `state.js` 544; `jump.js` 152–166 |
| **Midpoint** | `p >= 0.5`: despawn ships, **`targets.current = null`**, swap `currentSystem`, relocate, `jumpGraceUntil`, **`emit('systemLoaded', { to })`**, arrival `commLine`s | `jump.js` 79–137, **85–87**, **123** |
| End | `p >= 1`: `jumping = false`, clear progress/destination | `jump.js` 160–164 |
| Gate rebuild | `gate.js` rebuilds assemblies on **`lastEvents` `systemLoaded`** | `gate.js` 510–516, 431–479 |
| HUD banner | Arrival banner also reads **`lastEvents` `systemLoaded`** | `hud.js` 1032–1044 |
| Autosave | `save.js` may autosave on `systemLoaded` while `jumping` is still true | `save.js` 1499–1515 comment + 1515 |

**Advance law for NAV-02:** the hop completes for gameplay at **`systemLoaded` (midpoint)**, not at `jumpRequested`, not at charge end. A HUD that advances on the request would skip a hop if the charge is cancelled (today there is no cancel; still freeze midpoint). Wishlist “after the corresponding jump completes” maps to this midpoint emit.

`jump.js` **always clears the combat/interaction lock** on midpoint (`85–87`). That is existing lock drop on system swap. Plotting a route must **not** also write `targets.current`. Guidance must survive a lock; a lock must not clear `world.nav`.

---

## 4. Gate meshes, zone, glow (not pick discs)

| Number | Value | Role | Cite |
|---|---|---|---|
| Bore | `BORE_RADIUS` **30** | Transit hole; **KeyV pick radius** | `gate-scale.js` 14; `reticle-aim.js` 19 `GATE_BODY_R` |
| Zone | `JUMP.zone` / `ZONE` **60** | **Verb** (D jump). Not a pick disc | `state.js` 543; `gate-scale.js` 33; `gate.js` 538 |
| Arrival offset | **50** | Past dest gate toward origin | `state.js` 545 |
| Glow scale | `RING_RADIUS * 3.2` = **96** | Sprite, not body | `gate.js` 78, 164–165 |
| Dock | `U.DOCK_RANGE` **45** | Station verb, not gate | `state.js` 29 |
| Target range | `U.TARGET_RANGE` **600** | Lock bubble | `state.js` 30 |

KeyG cycles hub `routeIndex` while in a junction zone (`gate.js` 499–507). D still emits `jumpRequested` with the **selected** hub `to`, which may **not** be the plotted next hop.

`reducedMotion`: shutter spin, beacon pulse, glow breath, Unknowables spin, hub hex spin, and charge swirl **freeze** (`gate.js` 152–202, 520–527). Static glow scale 1.0 is legal.

Overlay: full-screen fade `z-index:40` + `label.textContent = 'JUMP — ' + dest name` (`gate.js` 482–579). Names via `SYSTEMS[id].name` then raw id fallback.

---

## 5. HUD occupancy (HUD-01 closed)

Performance: nodes created once; transforms per frame; text ~5 Hz write-on-change; no per-frame alloc (`hud.js` 19–22). `el()` sets `textContent`, never `innerHTML` (`226–231`). Grep `innerHTML` in `hud.js`: **0**.

| Instrument | Where | Notes | Cite |
|---|---|---|---|
| Reticle + RANGE | Center hub, clamp 44 | Aim glass | `hud.js` 680–686, 1071–1078 |
| Bracket / lead | On lock when on-screen | Combat/interaction lock | `688–701`, `1089–1180` |
| **Lock edge arrow** | Off-screen **current lock** | Amber triangle `.rw-edge-arrow` | `702`, `1182–1196`; `hud.css` 530–548 |
| Chart marks | Charted **unvisited landmarks** | Diamond + label; edge clamp `EDGE_MARGIN` 84; dim in combat 0.14 | `hud.js` 57, 704–721, 1409–1449; `hud.css` 553–586 |
| Toasts | **Top-right**, `top:14px; right:168px` — **off aim column** | 5 slots, 4 s | `hud.js` 723–731; `hud.css` 588–623 |
| Arrival banner | `top:96px; right:14px` | 4 s on `systemLoaded` | `hud.js` 597–618, 734–739, 1032–1048 |
| Jump charge bar | **Center** while `gate.jumping` | Covers hub during charge | `hud.js` 632–659, 741–745, 1051–1068 |
| Context prompt | `bottom:20%` center | One verb: Dock / Jump / Hail / Target / Mine / Lock | `hud.css` 626–638; `hud.js` 1750–1816 |
| **Contacts arc (TGT-03)** | Bottom center, **scanner ≥ 1**, ships only | Friend/foe tick/chevron/diamond. **Not** gates. Hide docked | `hud.js` 44–47, 752–782, 1255–1407; `hud.css` 671–680 |
| Combat rails | `top:57%`, ±78 px | Self left, target right | `hud.css` 769–787; `hud.js` 792–814 |
| Manifest | `top:14px; right:14px` | Credits / fear / cargo; `.rw-fade` | `hud.css` 875–879 |
| Controls | Top-left; **only** `pointer-events:auto` | Digit list includes M chart | `hud.css` 6, 890; `hud.js` 896–914; `controls.js` 340 |
| POS | Bottom-right side-col | **Current system name** + XYZ | `hud.js` 878–881, 1622–1635 |
| `#hud` | `pointer-events:none` except controls toggle | Overlay click-through | `hud.css` 5–6 |

There is **no** next-hop readout. There is **no** routed-gate chevron. There is **no** in-world route marker.

`stripHudText` strips control chars (`hud.js` 356–365). Gate lock names use `Object.hasOwn(SYSTEMS, to)` + `stripHudText(SYSTEMS[to].name)` (`414–419`).

Combat fade: `.rw-fade` career; `.rw-aux` 0.38 (`hud.css` 815). Chart marks 0.14 in combat.

---

## 6. Lock vs gate (TGT-05 already ships)

| Surface | Today | Cite |
|---|---|---|
| Writers of `targets.current` | `controls.js` select; `npc.js` ship availability; `jump.js` null on swap; stale drops | `ctx.js` 27, 168–172; `jump.js` 85–87; `controls.js` 369–376 |
| KeyT | Cycle **ships** (rocks if group 3). **No gates** | `controls.js` 54–82 |
| KeyV | `pickReticleLock` may return `{ lockKind:'gate', to, hub, position }` | `reticle-aim.js` 107–147, 172–203, 288–295; `controls.js` 198–214 |
| Gate pick center | Authored `gates[i].position` / `hub.position` | `reticle-aim.js` 172–203 |
| Gate pick radius | Bore **30**, not zone 60, not glow 96 | `reticle-aim.js` 19 |
| Hub lock `to` | `nearTo` if in hub zone, else `routes[0]` | `reticle-aim.js` 193–197 |
| Jump / dock | Stay **proximity verbs** | `gate.js` 535–560; station dock D |
| HUD lock chrome | Bracket + **amber** edge arrow + target rail (ships only) | `hud.js` 1089–1196 |
| MATCH / hail / seeker | Ship (and rock MATCH). Gate lock is identity, not combat rail | `hud.js` 1100–1102, 1544 |

A `{position}` blob without `lockKind` used to look like a rock. Live `hud.js` `isRockLock` requires asteroid **list** membership (`367–379`). Decorative geometry must still **not** become `lockKind` and must **not** enter `ctx.ships` / asteroid list.

---

## 7. Galaxy chart (NAV-01 owns plot UI)

| Surface | Today | Cite |
|---|---|---|
| Toggle | KeyM; suppressed docked/paused; Escape closes | `galaxychart.js` 21–24, 240–250 |
| Content | Names, factions, undirected gates, one-way hub routes. Authored+hub+pinned labels | `galaxychart.js` 14–19, 43–44 |
| Mystery | **Never** reads clue ids/text or landmark discovery | `14–19` |
| Plot | **None.** No click-to-route. No path highlight. No remaining-jumps chip | `update` 257–281 only moves current-system marker |
| Pause | Chart does **not** pause the sim | `23–24` |

NAV-02 must **not** edit this overlay except as a later NAV-01 consumer. Flight HUD must show next hop **without** the chart staying open (wishlist). Chart must still never show clues/landmarks.

---

## 8. Keys (closed)

| Key | Owner | Cite |
|---|---|---|
| W/A/S/D/Q/E/R/F, Space, Shift, LMB | Flight / fire | `controls.js` 37–44, 325–334 |
| Digit **1–4** | Weapon groups (flight) | `TRACKED` 41; help 334 |
| Digit **0–9** docked | Station services. Digit **0** = last `DOCK_KEY_SERVICES` = **shipyard** | `station.js` 174, 5710–5718 |
| KeyT | Cycle lock | `controls.js` 40, 54–82 |
| KeyV | Reticle lock | `40`, `198–214` |
| KeyX | MATCH | `40`, `338` |
| KeyH / KeyD / KeyC | Hail / dock-or-jump / camera | `337` |
| KeyG | Hub route cycle (**gate.js** listener, not TRACKED) | `gate.js` 501–507; help 339 |
| KeyM | Galaxy chart (**galaxychart.js**) | `galaxychart.js` 242–247; help 340 |
| KeyL / KeyP | Berth / pause | help 341–342 |

NAV-02 must **not** steal KeyT / KeyV / KeyX / Digit 0–9 / KeyM.

---

## 9. Events (frozen list)

Comment block `ctx.js` 198–228. `emit` spreads payload: `{ type, t: ctx.world.time, ...data }` (`231–232`). A payload key `type` **smashes** the event type. Meshes in payload stay on the queue until HUD drains.

Jump-related live types:

| Type | Payload | Emitter |
|---|---|---|
| `jumpRequested` | `{ to }` system id | `gate.js` 559 |
| `systemLoaded` | `{ to }` | `jump.js` 123; also save/origins same-system rules |
| `commLine` | `{ text, from }` | jump arrival, many others → **toasts** |

HUD-02 ticks (`hudMechRange` / `hudMechMatch` / `hudMechContact` / `hostileEnter` / `hullBand`) are family audio. Do not reuse them for gates.

Grep: **no** `nav*` event type in `src/`.

---

## 10. Init order

`main.js` 98–127: `initGate` (105) before world; `initJump` (114) after world (same-frame `jumpRequested`); `initGalaxyChart` (125); **`initHud` last** (127) so it sees the queue.

---

## 11. Gaps vs wishlist NAV-02

| Wishlist | Live |
|---|---|
| HUD names next hop + dest + remaining jumps + distance to routed gate | Missing. POS names **current** system only (`hud.js` 1622–1628). Prompt names **in-zone** gate (`1755–1763`). |
| In-world marker on **routed** gate only | Missing. Glow/beacon on **charging** dest during jump only (`gate.js` 525–527). |
| Off-screen directional for that gate regardless of camera | Missing. Lock arrow is **current target** (`1182–1196`). Contacts arc is **scanner ships** (`1255–1260`). Chart marks are **landmarks** (`1409–1449`). |
| Advance after jump completes | Live `src/` has no route cursor. Jump already emits `systemLoaded` at midpoint (`jump.js` 123). NAV-01 will rewrite `path` / `remaining` then. |
| Route ≠ lock | Plot does not exist, so it cannot steal yet. KeyV **can** lock a gate (`lockKind:'gate'`). Guidance must stay a **third** identity. |
| Persist while map closed | No `world.nav`. |

---

## 12. Grep notes (inventory time)

| Probe | Result |
|---|---|
| `world.nav` / `WORLD_FIELDS` `'nav'` | 0 |
| `innerHTML` in `hud.js` | 0 (`el` is `textContent`) |
| `innerHTML` in `systems/` | `modelsbrowser.js` only — **out of this slice** |
| TGT-03 contacts | `hud.js` 44–47, 752+, 1255+; scanner-gated ships |
| `.rw-edge-arrow` | Lock-only amber triangle |
| `lockKind: 'gate'` | Live KeyV wrapper, authored bore pick |

---

## 13. What NAV-02 must not confuse

1. **`ctx.gate.nearTo`** — standing in a zone, not the plotted hop.  
2. **Gate lock** — `targets.current.lockKind === 'gate'` — combat/identity chrome.  
3. **Charging glow** — the gate you already committed to this jump.  
4. **Contacts arc** — scanner friend/foe ships.  
5. **Chart marks** — mystery landmarks, not gates.  
6. **Lock edge arrow** — off-screen **lock**.

---

## 14. Sibling consume target (NAV-01, not live `src/`)

Live `src/` still has no `world.nav`. NAV-02 must consume the **NAV-01 merge-law bag**, not invent a cursor.

Cite: `out/w84/nav01/shared-contract.md` §1.2–§1.3, §2.3, §4–§5 (Wave 84 freeze). Do not edit that tree.

| Field | NAV-01 |
|---|---|
| Key | `'nav'` on `WORLD_FIELDS` (proposed) |
| Shape | `{ dest, path, remaining, status }` |
| `status` | `'plotted' \| 'blocked' \| 'arrived'` |
| Idle | omit bag |
| Next hop | `path[1]` when plotted and `path.length >= 2` |
| `path[0]` | `currentSystem` |
| `remaining` | `path.length - 1` when plotted |
| Recalc | **event** (`systemLoaded` → rewrite plotted/blocked + `'navRoute'`). Not a persist status |
| Allowlist | dest, path, remaining, status. **Unknown keys drop** |
| `hopIndex` | **absent** (grep 0 in NAV-01 contract/brief) |

A HUD that requires `hopIndex` or `'active'|'recalc'|'broken'` will hide after a legal NAV-01 persist.
