# Current TGT inventory (Wave 81)

**Wave:** 81. Markdown only.  
**Rule:** Live code wins over comments, lore, Wave 73 cites, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** KeyV reticle-lock (ships + asteroids already ship), KeyT cycle, Digit 0 shipyard, `ctx.targets.current` writers/readers, MATCH / hail / seeker / mining rails, station dock, gate jump, pods scoop, landmark/anomaly mystery + chart marks.

This file is the source of truth for “TGT today” at Wave 81. The integrator brief and `shared-contract.md` must not invent fields, keys, target kinds, cone degrees, or pick-pixel caps that are not here unless they mark them **proposed, needs owner**.

Cites are `file:line` at inventory time (2026-08-21). Wave 73 line numbers are stale.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/systems/controls.js` | `cycleTarget`, `tryReticleLock`, KeyT / KeyV, `TRACKED`, `reticleScreen`, LMB fire |
| `src/game/reticle-aim.js` | `reticleAimPoint` (guns/mining) + `pickReticleLock` (KeyV disc pick) |
| `src/core/ctx.js` | `targets`, `reticleLockPressed`, ownership, frozen `'reticleLock' { hit }` |
| `src/systems/hud.js` | Reticle clamp, bracket, lead, RANGE, MATCH lamp, rock helpers, chart marks, Digit-prompt |
| `src/systems/combat.js` | Seeker lock, mining lock pull, `CONVERGE_DOT`, muzzle ray |
| `src/systems/ship.js` | MATCH on live ship and rock lock |
| `src/systems/npc.js` | Stale **ship** lock drop |
| `src/game/jump.js` | Clears `targets.current` on system swap |
| `src/game/state.js` | `U.TARGET_RANGE` / `DOCK_RANGE` / `SCOOP_RANGE` **READ-ONLY** |
| `src/systems/asteroids.js` | `ctx.asteroids.list`, `id === index` |
| `src/systems/station.js` | `ctx.station`, Digit 0 shipyard, dock D in `U.DOCK_RANGE` |
| `src/systems/gate.js` | Gate zone, KeyG hub cycle, glow vs bore |
| `src/game/gate-scale.js` | `BORE_RADIUS` 30, `RING_RADIUS` alias, glow scale input |
| `src/game/pods.js` | `ctx.pods` auto-scoop (not a lock) |
| `src/systems/landmarks.js` | Landmark / anomaly / clue meshes (not a lock) |
| `src/game/mystery.js` | Clue 35 / landmark 100 discovery radii; `clueFound` / `landmarkFound` |
| `src/game/contacts.js` | Keeper `mystery.charted` write |
| `src/systems/hail.js` | Hail / salvage on **ship** lock |
| `src/systems/song.js` | `CUES.reticleLock`; HUD-02 family ticks |
| `src/game/world.js` | Aftermath `wreckMeshes` (decorative) |
| `src/game/save.js` | `WORLD_FIELDS` (no `targets`); `RESERVED_IDS` |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | TGT-05. Do **not** edit |
| `PROGRESS.md` | Architecture contracts. Do **not** edit |

---

## 1. What `ctx.targets` is

| Surface | Today | Cite |
|---|---|---|
| Ownership | Written by `controls.js` (selection) + `npc.js` (availability). Combat/HUD/ship/hail **read** | `ctx.js` 27, 168–172 |
| `current` | Live ship from `ctx.ships` **or** asteroid **list ref**. Comment still says that | `ctx.js` 170 |
| `reticleScreen` | Pixel offset from screen center. `0,0` = centered. Controls publishes; HUD recenters in first-person | `ctx.js` 171; `controls.js` 8–11, 310–311 |
| Persist | **None.** Not on `WORLD_FIELDS` | `save.js` 75–90 vs `ctx.js` 168–172 |
| Jump | Mid-swap sets `current = null` | `jump.js` 85–87 |
| Stale ship | `npc.js` nulls if destroyed or not in `ctx.ships`. Asteroid refs left alone | `npc.js` 2271–2276 |
| Stale rock | `controls.js` `dropStaleRockLock`: rock lock whose list no longer holds the ref | `controls.js` 84–95, 282–290 |
| KeyV write | `tryReticleLock` assigns `pickReticleLock` hit; miss does **not** steal | `controls.js` 114–127 |

There is **no** `lockKind` field anywhere under `src/` (grep 0). Consumers **infer** ship vs rock from shape.

`ctx.emit` spreads payload onto the event object: `{ type, t: ctx.world.time, ...data }` (`ctx.js` 230–231).

---

## 2. Live discriminators (untagged)

| Helper | Test | Cite | Treats as |
|---|---|---|---|
| `controls.js` `isRockLock` | `t.position && !t.object && !t.state` | 85–87 | Asteroid list row; also **any** `{position}` blob |
| `hud.js` `isRockLock` | Same | 350–352 | MATCH lamp |
| `hud.js` `isRockTarget` | `t.position && !t.state` (**does not** require `!t.object`) | 345–347 | Group-3 mine cue skip |
| `hud.js` `shipTgt` | `target.state && !destroyed && targetPos` | 1025 | Combat rail, lead, RANGE pop |
| `hud.js` bracket `isShip` | `target.state \|\| target.object` | 1564 | Name/faction vs `ASTEROID` |
| `ship.js` `liveLock` | `lock.object && lock.state && !destroyed` | 651 | Ship MATCH |
| `ship.js` `rockLock` | `lock.position && !lock.object && !lock.state` | 653 | Rock MATCH |
| `combat.js` missile | `t.object && parent && t.state && !destroyed` | 1146–1152 | Seeker |
| `combat.js` gun converge | `t.object && t.state && !destroyed` | 1086–1104 | Lead snap in `CONVERGE_DOT` |
| `combat.js` mining pull | `t.position && !t.object` **or** Unknowable ship | 1264–1274 | Beam steer |
| `hail.js` salvage | `live.state && live.object && disabled && in ctx.ships` | 75–81 | Player H |

**Hole (still live):** a later `{ position, name }` station ref with no `object`/`state` **matches rock helpers** (`isRockLock`, `ship.js` `rockLock`, mining pull). HUD bracket `isShip` is false, so it would also paint **`ASTEROID`**. Inventory records the hole. The contract must close it with `lockKind`.

**Partial fail-closed today:** `dropStaleRockLock` nulls any `isRockLock` ref that is not `list.indexOf(t) >= 0` (`controls.js` 90–94). An untagged `ctx.station` written into `current` would drop **every frame**. That is not a discriminator. Tagged kinds still need an explicit rock test.

Ship records from `createShipState` have **no** `radius` field. `reticle-aim.js` uses `s.state?.radius ?? 4` with `Math.max(2, …)` (`reticle-aim.js` 82, 130).

AST rock rows: `id: i` at list build (`asteroids.js` 1877–1885). `id === array index`.

---

## 3. Cycle-T (KeyT) — unchanged from Wave 74

`cycleTarget` (`controls.js` 54–82):

1. Need `ctx.ship.object`. Else `current = null`.
2. Range: `U.TARGET_RANGE` **600** squared (`state.js` 30).
3. Candidates: every `ctx.ships` entry with `object` and **not** `state.destroyed`.
4. Asteroids: **only** when `ctx.input.weaponGroup === 3`, every `ctx.asteroids.list` entry in range.
5. Sort nearest-first (`d2`). Wrap: next after current, or first if current missing.
6. No stations, gates, pods, landmarks, wrecks, or anomalies.

KeyT (`controls.js` 175–176, 264, 292) pulses `input.targetPressed` one frame. Header comment 24: “cycle target (nearest first; asteroids too in group 3).”

HUD empty-lock prompt (`hud.js` 1678–1686): if no current target and a live ship is in `TARGET_RANGE`, show `T` / `Target`. Rocks do not set that prompt. Group 3 without a rock lock may show `3` / `Mine · belt Nu` (`hud.js` 1688–1694). If still empty and a rock is in range, show `V` / `Lock` (`hud.js` 1696–1707).

---

## 4. KeyV reticle-lock (Wave 74 shipped)

| Surface | Today | Cite |
|---|---|---|
| Binding | **KeyV** in `TRACKED`. One-frame `pendingReticleLock` → `input.reticleLockPressed` | `controls.js` 40, 145, 190–191, 269, 313 |
| Edge field | `input.reticleLockPressed: false // edge: V` | `ctx.js` 88 |
| Blocked | No ship object; docked; jumping; paused; models overlay; `#rw-title` | `controls.js` 99–107 |
| Pick | `pickReticleLock(ctx)` — disc contains reticle pixel; overlap → smallest positive ray-t; **no cone** | `reticle-aim.js` 91–144 |
| Eligible | Asteroid list rows (`position` + `radius > 0`) **and** live ships (skip destroyed). **Any weapon group** | 106–142 |
| Range | `U.TARGET_RANGE` from **player ship** (not camera) | 100–102 |
| Ray | Same `fillCamRay` as `reticleAimPoint`: FP forces offset `0,0`; clamp `RETICLE_EDGE` 44 | 26–51, 11; `hud.js` 1004 |
| Miss | Authored `'Nothing under the reticle.'` via `commLine` + `reticleLock { hit: false }`. Does **not** clear current | `controls.js` 97, 109–112, 121–123 |
| Hit | `ctx.targets.current = hit`; `reticleLock { hit: true }` | 125–126 |
| Audio | `song.js` `CUES.reticleLock` square 1480 Hz, duration 0.06, gain 0.05. **Not** in `FAMILY_CUES` | `song.js` 119, 123–129 |
| Event freeze | `'reticleLock' { hit }       // controls.js: V pick; payload is { hit: boolean } only` | `ctx.js` 227 |
| Prompt line | HUD config `'V — lock under reticle'` | `controls.js` 249 |

`reticleAimPoint` still aims guns/mining. It returns a nearest **ray-sphere** ref (rock or ship) or `false`. It does **not** write `targets.current` (`reticle-aim.js` 54–88). Combat calls it (`combat.js` 1081, 1260).

There is **no** scene `Raycaster` on this path.

Cone pixel cap: **still absent**. Pick is **direct-hit only**. `CONVERGE_DOT = 0.72` (~44°) is a **gun** cone (`combat.js` 174), not a pick cone.

---

## 5. Keys (flight vs overlay)

### 5.1 `TRACKED` (controls.js swallows these)

`controls.js` 37–44:

`KeyW KeyA KeyS KeyD KeyR KeyF KeyQ KeyE KeyT KeyH KeyC KeyX` **`KeyV`** `Digit1 Digit2 Digit3 Digit4 ShiftLeft ShiftRight Space`

LMB is fire (`mousedown` button 0, `controls.js` 227–232, 321). Not in `TRACKED`.

| Code | Role | Cite |
|---|---|---|
| WASD | Strafe | 315–316 |
| QE | Roll | 317 |
| RF | Throttle ramp; F double-tap full stop | 193–200, 324–331 |
| Space | Afterburner edge | 172–174 |
| Shift | Drift hold | 320 |
| LMB | Fire hold | 227–232, 321 |
| 1–4 | Weapon groups | 202–214 |
| T | Cycle target | 175–176, 292 |
| V | Reticle-lock | 190–191, 313 |
| H | Hail | 178–179 |
| D | Dock / jump (station + gate consume `dockPressed`) | 181–182; station 5281; gate 558–560 |
| C | Camera | 184–185, 273–280 |
| X | MATCH edge | 187–188 |

Not in `TRACKED` (other modules): Digit **0**, G, M, L, P, O, Digit 5–9, Escape, KeyB, KeyY.

### 5.2 Digit 0 = shipyard (HUD-02 closed neighbour)

`DOCK_KEY_SERVICES` last entry is `'shipyard'` (`station.js` 152). Overlay level-1 Digit 0 selects that last service (`station.js` 5173–5177). Digit 1–9 map `d-1` into the same list. KeyY also opens shipyard (`station.js` 5172).

Wave 73 cited `station.js` 132 / 2963–2965. Those lines are now war-job helpers. **Code wins:** Digit 0 is 5175–5177.

---

## 6. MATCH, hail, seeker, mining, HUD rails

| Consumer | Ship lock | Rock lock | Cite |
|---|---|---|---|
| MATCH arm | Live `object+state` | Sampled world velocity on `position && !object && !state` | `ship.js` 650–703 |
| MATCH lamp | `flags.matchSpeed && (shipTgt \|\| isRockLock)` | same | `hud.js` 1467 |
| Hail H | Salvage: disabled live ship in `ctx.ships` | No-op (`canHailDisabled` needs `state`+`object`) | `hail.js` 75–96, 425–427 |
| Seeker | Live ship in launcher range | null | `combat.js` 1146–1152 |
| Gun converge | Ship lock inside `CONVERGE_DOT` | no | `combat.js` 1086–1104 |
| Mining pull | Unknowable ship only | `t.position && !t.object` in cone | `combat.js` 1264–1274 |
| Mining fire | Group 3 beam vs list spheres | same | `combat.js` 1253+ |
| Combat rail | `shipTgt` | hidden | `hud.js` 1023–1034 |
| Lead | `shipTgt` + selected-weapon speed; mining hides | hidden | `hud.js` 1078–1103 |
| RANGE pop | `shipTgt` && dist ≤ selected-weapon range | off | `hud.js` 1142–1153 |
| Bracket | Name/faction/resolve | `ASTEROID` + ore meta | `hud.js` 1563–1612 |
| Turret | Own `pickTurretTarget` (hostile cone). Independent of lock | independent | `combat.js` 1185–1206 |

Salvage = **disabled ships**. Not a new kind. H hail stays ship-only.

NPC missiles: **off**. Owner Q1/Q2 still open (`docs/NpcMissilesDesign.md`). TGT-03 extras (missile warnings, subsystem) stay out.

---

## 7. Station mesh / dock D / `U.DOCK_RANGE`

| Surface | Today | Cite |
|---|---|---|
| Record | `ctx.station = { position, name, systemName, inZone, fenceUnlocked, keeperComp }` | `station.js` 3793–3800 |
| Position | `stationPos` from `SYSTEMS[id].station.position` | 3810–3811 |
| Zone | Player distance to `stationPos` ≤ `U.DOCK_RANGE` **45** | `state.js` 28; `station.js` 5276–5278 |
| Dock verb | In zone + `input.dockPressed` → `dock()` | 5280–5281 |
| HUD prompt | `ctx.station.inZone && !docked` → `D` / `Dock` (wins over jump/hail/T/V) | `hud.js` 1657–1658 |
| Envelope | Detail sculpt invariant: beacon inside envelope `\|x\|,\|z\| <= 32`, `y` in `[-26, 33]` | `station.js` 389–390 |
| Glow | `mesh.glowMat` / `beaconGlowMat` opacity driven in update | 5270–5271 |
| Bloom note | Envelope ~30u radius (Beautiful Ones) | 543–544 |

Lock does **not** exist for stations. Dock is proximity. Station glow sprites are not a pick sphere.

---

## 8. Gate mesh / jump D / glow vs bore

| Surface | Today | Cite |
|---|---|---|
| Bore | `BORE_RADIUS = 30`. `RING_RADIUS` **alias** of bore | `gate-scale.js` 14, 61 |
| Glow sprite | `glowBaseScale = RING_RADIUS * 3.2` (**96**) | `gate.js` 78, 348 |
| Zone | Nearest assembly within `JUMP.zone` **60** | `state.js` 542–543; `gate.js` 535–556 |
| Jump verb | In zone + `dockPressed` → `jumpRequested { to }` | `gate.js` 558–560 |
| Hub cycle | KeyG cycles `zoneHub.routes` | `gate.js` 501–507 |
| HUD prompt | After dock: `D` Jump to dest, or `G` route n/m · `D` Jump | `hud.js` 1659–1668 |
| Overlay | `label.textContent = 'JUMP — ' + dest.name` | `gate.js` 578 |
| Chevrons | `mounted.shutter` on the assembly | `gate.js` 337, 397 |

Glow scale 96 > zone 60 > bore 30. A glow pick would steal. Jump stays zone. No gate lock today.

---

## 9. Pods (cargo / ore / survivor)

| Surface | Today | Cite |
|---|---|---|
| List | `ctx.pods[]` live objects `{ mesh, contents, velocity, bornAt, ttl }` | `pods.js` 525–532, 584 |
| Hull | Shared icosahedron `POD_RADIUS = 0.9` | `pods.js` 26–27, 35 |
| Scoop | Magnet inside `U.SCOOP_RANGE * 3` (30); collect at `U.SCOOP_RANGE` **10** if cargo fits | `state.js` 29; `pods.js` 603–616 |
| Kinds | Cargo (`spawnPod`), ore tint, survivor (`spawnSurvivorPod`) | `pods.js` 13–24, 537–547 |
| Events | `'podSpawned' {pod}` / `'podCollected' {pod}` | `ctx.js` 202; `pods.js` 533, 613 |
| TTL | 300 world-seconds | `pods.js` 530 |

No cycle-T. No KeyV. Auto-scoop is the verb. Pod has **no** top-level `position` (pose is `mesh.position`). Treating `mesh` as `object` would trip HUD `isShip` (`state \|\| object`).

---

## 10. Landmarks / anomalies / chart marks

| Surface | Today | Cite |
|---|---|---|
| Authored | `SYSTEMS[id].landmarks[]` with `id`, `name`, `position`, `kind` | `landmarks.js` 11–13, 71–79 |
| Meshes | Per-system group `'landmarks'`; kinds + authored heroes | `landmarks.js` 51–79 |
| Anomaly | A **kind** of landmark mesh, not a separate lock type | `landmarks.js` 13–14 |
| Clues | Separate `SYSTEMS[id].clues[]`; discovery radius **35** | `mystery.js` 37, 106–114 |
| Landmark discovery | Radius **100**; writes `mystery.visited`; emits `landmarkFound { id, name, line }` | `mystery.js` 38, 120–128 |
| Chart marks | Keeper writes **landmark id** into `mystery.charted` | `contacts.js` 374–400 |
| HUD marks | Inert diamonds: charted **and** not yet `visited`; `textContent` name + dist; `aria-hidden`; never clue id/text | `hud.js` 24–30, 631–648, 1332–1372, 1421–1433 |
| §25 | Labels name the authored landmark + distance only | `hud.js` 29–30; `contacts.js` 380 |

Chart marks are **HUD only**. They are not a lock source of truth. Clue motes are not lockable.

---

## 11. Aftermath wreck debris (stay out)

`world.js` `wreckMeshes` Map: `aftermath.id → { group, emberMat }` (`world.js` 1240, 1253–1268). Decorative debris group. No stable selectable gameplay id for TGT. **Out.**

Disabled ships (salvage) remain **ships**.

---

## 12. Wave 73 deferred table (status at Wave 81)

Wave 73/74 first impl **in:** ships + asteroids. Wave 74 shipped KeyV.

| Kind | Wave 73 | Wave 81 live | Later identity |
|---|---|---|---|
| Station | defer | still unselected | `lockKind: 'station'` |
| Gate | defer | still unselected | `lockKind: 'gate'` |
| Pod (cargo/ore/survivor) | defer | still unselected | `lockKind: 'pod'` |
| Landmark / anomaly | defer | still unselected | `lockKind: 'landmark'` + authored id |
| Aftermath wreck debris | out | still out | stay out |
| Salvage | ship | ship | **do not invent** a salvage kind |

---

## 13. XSS / proto / persist (live)

| Surface | Today | Cite |
|---|---|---|
| HUD `el()` | `textContent` | `hud.js` 224–229 |
| `innerHTML` in `src/` | **only** `modelsbrowser.js` (out of TGT scope) | grep |
| Chart labels | `s.label.textContent` | `hud.js` 1430–1432 |
| Gate overlay | `label.textContent` | `gate.js` 578 |
| Miss line | module literal | `controls.js` 97 |
| `RESERVED_IDS` | `__proto__` / `constructor` / `prototype` / … | `save.js` 106–110 |
| Lock persist | none | `WORLD_FIELDS` has no `targets` |

---

## 14. Closed / do-not-reopen (inventory facts)

- HUD-02 family skins ship. HUD never writes `hullKind` (`hud.js` 70–74 reads).
- Digit 0 shipyard ships.
- KeyV vs KeyT is **closed**: both live. Do not reopen.
- TGT-03 extras (missiles warning gauge, subsystem) stay out.
- NPC missiles stay off (owner Q1/Q2).
- `state.js` has no `U.RETICLE_LOCK_*`. Feature PRs must not add one.
- Cone pixel cap does **not** exist. Do not invent a number here.
