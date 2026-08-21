# Current TGT inventory (Wave 73)

**Wave:** 73. Design only.  
**Rule:** Live code wins over comments, lore, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** target selection, reticle, MATCH, lead/RANGE, mining lock, missile lock, HUD lock chrome, live keys.

This file is the source of truth for “TGT today.” The integrator brief and `shared-contract.md` must not invent fields, keys, target kinds, or cone degrees that are not here unless they mark them **proposed, needs owner**.

Cites are `file:line` at inventory time (2026-08-20).

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/systems/controls.js` | `cycleTarget`, `TRACKED`, KeyT, `reticleScreen`, LMB fire |
| `src/game/reticle-aim.js` | Visible-reticle → world ray (guns + mining) |
| `src/core/ctx.js` | `targets`, `input.targetPressed`, ownership, frozen events |
| `src/systems/hud.js` | Reticle clamp, bracket, lead, RANGE, MATCH lamp, rock helpers, group-3 cue |
| `src/systems/combat.js` | Seeker lock, mining lock pull, `CONVERGE_DOT`, muzzle ray |
| `src/systems/ship.js` | MATCH on live ship and rock lock |
| `src/systems/npc.js` | Stale **ship** lock drop |
| `src/game/jump.js` | Clears `targets.current` on system swap |
| `src/game/state.js` | `U.TARGET_RANGE` **READ-ONLY** |
| `src/systems/asteroids.js` | `ctx.asteroids.list`, `id === index` |
| `src/systems/station.js` | `ctx.station`, Digit 0 shipyard, dock digits |
| `src/systems/gate.js` | Gate zone, KeyG hub cycle |
| `src/game/pods.js` | `ctx.pods` scoop (not a lock) |
| `src/systems/landmarks.js` | Landmark / anomaly / clue meshes (not a lock) |
| `src/systems/hail.js` | Hail / salvage on **ship** lock |
| `src/systems/song.js` | Cue table; HUD-02 family ticks |
| `src/main.js` | KeyP pause (not in `TRACKED`) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | TGT-05 (~270–309). Do **not** edit |
| `PROGRESS.md` | Architecture contracts. Do **not** edit |

---

## 1. What `ctx.targets` is

| Surface | Today | Cite |
|---|---|---|
| Ownership | Written by `controls.js` (selection) + `npc.js` (availability). Combat/HUD/ship/hail **read** | `ctx.js` 27, 167–171 |
| `current` | Live ship from `ctx.ships` **or** asteroid **list ref** | `ctx.js` 169 |
| `reticleScreen` | Pixel offset from screen center. `0,0` = centered. Controls publishes; HUD recenters in first-person | `ctx.js` 170; `controls.js` 8–11, 268–270 |
| Persist | **None.** Not on `WORLD_FIELDS` | `ctx.js` 167–171 vs save world fields |
| Jump | Mid-swap sets `current = null` | `jump.js` 85–87 |
| Stale ship | `npc.js` nulls if destroyed or not in `ctx.ships`. Asteroid refs left alone | `npc.js` 2265–2270 |
| Stale rock | `controls.js` `dropStaleRockLock`: rock lock whose list no longer holds the ref | `controls.js` 87–93, 241–249 |

There is no `lockKind` field. Consumers **infer** ship vs rock from shape.

---

## 2. Live discriminators (untagged)

| Helper | Test | Cite | Treats as |
|---|---|---|---|
| `controls.js` `isRockLock` | `t.position && !t.object && !t.state` | 82–85 | Asteroid list row |
| `hud.js` `isRockLock` | Same | 349–352 | MATCH lamp |
| `hud.js` `isRockTarget` | `t.position && !t.state` (**does not** require `!t.object`) | 344–347 | Group-3 mine cue skip |
| `hud.js` `shipTgt` | `target.state && !destroyed && targetPos` | 1023–1025 | Combat rail, lead, RANGE pop |
| `hud.js` bracket `isShip` | `target.state \|\| target.object` | 1564 | Name/faction vs `ASTEROID` |
| `ship.js` `liveLock` | `lock.object && lock.state && !destroyed` | 651 | Ship MATCH |
| `ship.js` `rockLock` | `lock.position && !lock.object && !lock.state` | 653 | Rock MATCH |
| `combat.js` missile | `t.object && parent && t.state && !destroyed` | 1146–1151 | Seeker |
| `combat.js` mining pull | `t.position && !t.object` **or** Unknowable ship | 1264–1274 | Beam steer |

**Hole:** a later `{ position, name }` station ref with no `object`/`state` **matches rock helpers**. Inventory records the hole. The contract must close it.

Ship records from `createShipState` have **no** `radius` field (`state.js` 140–161). `reticle-aim.js` uses `s.state?.radius ?? 4` (line 61).

---

## 3. Cycle-T (the only select command)

`cycleTarget` (`controls.js` 51–80):

1. Need `ctx.ship.object`. Else `current = null`.
2. Range: `U.TARGET_RANGE` **600** squared (`state.js` 30).
3. Candidates: every `ctx.ships` entry with `object` and **not** `state.destroyed`.
4. Asteroids: **only** when `ctx.input.weaponGroup === 3`, every `ctx.asteroids.list` entry in range.
5. Sort nearest-first (`d2`). Wrap: next after current, or first if current missing.
6. No stations, gates, pods, landmarks, wrecks, or anomalies.

KeyT (`controls.js` 139–141, 224, 251) pulses `input.targetPressed` one frame. Comment 23: “cycle target (nearest first; asteroids too in group 3).”

HUD empty-lock prompt (`hud.js` 1678–1686): if no current target and a live ship is in `TARGET_RANGE`, show `T` / `Target`. Rocks do not set that prompt. Group 3 without a rock lock may show `3` / `Mine · belt Nu` (`hud.js` 1688–1695).

---

## 4. Reticle and camera ray

| Surface | Today | Cite |
|---|---|---|
| Mouse | No pointer lock. Offset from center, clamp radius `0.35 * min(vw,vh)` | `controls.js` 5–11, 49, 253–270 |
| Publish | `steerX/Y` in [-1,1]; `reticleScreen.x/y` = clamped **pixel** offset | 266–270 |
| HUD draw | First-person forces `rx,ry = 0`. Chase/third use `reticleScreen`. Extra clamp so the 80 px hub stays on glass (`cx-44`) | `hud.js` 16–17, 998–1009 |
| Aim ray | `reticleAimPoint(ctx, maxRange, out)` unprojects the **same** clamped reticle (FP zero; `RETICLE_EDGE` 44) from the camera | `reticle-aim.js` 11, 17–68 |
| Aim hits | Nearest ray-sphere vs asteroid **list** (`position`+`radius`) and live ships (`radius ?? 4`). Writes a world point. Returns bool hit | 47–67 |
| Guns | `playerMuzzleDir` uses that ray, then **optional** converge toward a **ship** lock in a frontal cone. Comment: does **not** snap spawn onto a lock | `combat.js` 1077–1104 |
| Mining | Same `reticleAimPoint` with installed head range; locked rock / Unknowable may pull if in cone | 1253–1274 |
| Gun cone | `CONVERGE_DOT = 0.72` (~44°). **Weapon** converge, not a pick cone | `combat.js` 174 |

There is **no** pick-for-lock function. `reticleAimPoint` does not write `targets.current`.

---

## 5. Keys (flight vs overlay)

### 5.1 `TRACKED` (controls.js swallows these)

`controls.js` 35–42:

`KeyW KeyA KeyS KeyD KeyR KeyF KeyQ KeyE KeyT KeyH KeyC KeyX Digit1 Digit2 Digit3 Digit4 ShiftLeft ShiftRight Space`

| Code | Role | Cite |
|---|---|---|
| WASD | Strafe | 272–273 |
| QE | Roll | 274 |
| RF | Throttle; double-tap F full stop | 155–161, 280–288 |
| Space | Afterburner | 136–137 |
| Shift | Drift | 277 |
| LMB (`button === 0`) | `fireHeld` | 188–193, 278 |
| Digit 1–4 | Weapon groups cannon / disruptor / mining / missiles | 163–175 |
| KeyT | Cycle target | 139–141 |
| KeyH | Hail | 142–144 |
| KeyD | Dock / jump | 145–147 |
| KeyC | Camera chase → third → first | 148–150, 232–238 |
| KeyX | MATCH edge | 151–153 |

Header comment 13–26 matches the set. `input.pausePressed` exists (`ctx.js` 89) but **controls never sets it**.

### 5.2 Live keys **outside** `TRACKED`

| Code | Role | Cite |
|---|---|---|
| KeyP | Pause (skip if typing / models / title) | `main.js` 156–167 |
| KeyG | Cycle hub route when in a Lamplighter junction zone | `gate.js` 501–507; HUD prompt 1662–1665 |
| KeyM | Galaxy chart | `galaxychart.js` 242 |
| KeyL | Berth records | `save.js` 989 |
| KeyO | Settings; title overlay also uses O / Escape | `settings.js` 227; `title.js` 201 |
| Digit 0 **while docked** | Shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 132, 2882–2883, 2963–2965 |
| Digit 1–9 **while docked** | Dock services (Digit 1 = market) | `station.js` 2958–2969 |
| KeyY **while docked** | Shipyard shortcut | 2960 |
| KeyB / Escape **while docked** | Undock / back | 2959, 2973–2982 |
| Hail overlay | Digit 1–9 intents | `hail.js` 407 |

`config.controls` HUD lines also name G, M, L, P (`controls.js` 199–216`). Those letters are **not** in `TRACKED`.

### 5.3 Mouse buttons

Only `button === 0` (LMB) is bound. RMB / middle are free in live flight code.

### 5.4 Letters unused in flight

No `Gamepad` API (`src` grep empty). Unused flight letters include **B I J K N U V Y Z** (B/Y are dock-only). **Tab** is unused (browser focus). **Do not treat unused as reserved** — owner picks the TGT-05 command.

**Must not steal for TGT-05:** WASD RF QE, H D C X T, Digit 1–4, Space, Shift, LMB, Digit 0, G, M, L, P, O.

---

## 6. HUD lock chrome (HUD-01 / HUD-02 closed)

| Instrument | Live rule | Cite |
|---|---|---|
| Family | `hudFamily`: `hullKind` built → mech, living → bio. HUD **never writes** `hullKind` | `hud.js` 66–75 |
| Strings | `el()` uses `textContent`. Bracket / rail / toast / prompt same | 224–229, 1613–1640 |
| `innerHTML` | **Not** in `hud.js`. Live `innerHTML` is models-browser only | `modelsbrowser.js` 114, 317, 369, 460, 468, 602 |
| Reticle | 80 px hub; iris + RANGE word | 607–611 |
| First-person | Recenters reticle only. Same overlay | 16–17, 998–1013 |
| Bracket | On-glass lock; name + meta; rocks show ore / hardness / NEEDS | 1016–1076, 1561–1628 |
| Lead | Selected-weapon TOF. Hide mining (`wSpeed === 0`) or no `shipTgt` | 1078–1103 |
| RANGE pop | `shipTgt` and dist ≤ selected weapon range (mining uses head range) | 1142–1153 |
| MATCH lamp | Self SPD only. On when `flags.matchSpeed` **and** (`shipTgt` **or** `isRockLock`) | 1467–1471; lamp 281–305 |
| Target rail | Live ship vitals only. Hidden for rock / none / destroyed | 1023–1035, 1630–1652 |
| Contacts arc | Scanner-gated. Lock pip on **ship** lock. Not a reticle ring | 45–47, 1178–1216 |
| Chart marks | Landmark POI diamonds. Pointer-inert. Not a lock | 24–30, 631–647, 1332–1366 |
| Family ticks | `hudMechRange` / `hudMechMatch` / `hudMechContact` (mech); `hostileEnter` / `hullBand` (bio). Reduced-motion skips | 896–900; `ctx.js` 221–225 |

HUD-02 closed. Do not move glance geometry. MATCH on rock already shipped (Wave 71); w61 contract text that lamped **only** ships is **stale** vs `hud.js` 1467.

---

## 7. MATCH / combat / mining consumers

| Consumer | Live | Cite |
|---|---|---|
| MATCH toggle | `ship.js` owns `flags.matchSpeed`. Must not write `input.throttle` | `ctx.js` 30–32; `ship.js` 649–703 |
| Ship MATCH | Scalar speed along the nose (sampled lock speed) | `ship.js` 651, 673–674 |
| Rock MATCH | Sampled **world velocity**; damping must not bleed the hold | 80, 653, 675–679, 829 comment |
| Cancel | Dock, jump, lost lock, throttle held | 700–703 |
| Missiles | `liveMissileLock`: live ship in launcher range. Asteroid / no lock → `null` | `combat.js` 1146–1170 |
| Turret | `pickTurretTarget`: nearest hostile in forward cone. **Ignores** `targets.current` | 1185–1206 |
| Mining beam | Ray vs rock spheres + Unknowable proxies. Group 3 fire. Locked rock pulls if in `CONVERGE_DOT` | 1253–1306 |
| Hail | Player H uses `targets.current` as live ship. Salvage = disabled ship, not a mesh kind | `hail.js` 73–91, 85 |

---

## 8. Categories: live mesh vs live **selectable**

Selectable today = `cycleTarget` can set `targets.current` to it.

| Wishlist category | Live object? | Selectable today? | Identity | Cite |
|---|---|---|---|---|
| Ships | `ctx.ships[]` `{ id, record, object, state, role, ai }` | **Yes** (skip destroyed) | Live list member | `ctx.js` 163–165; `controls.js` 61–64 |
| Asteroids | `ctx.asteroids.list[]` `{ id, position, radius, ore, commodity, oreKey, hardness }` | **Yes only if weaponGroup === 3** | `id === array index` (AST). List **replaced** on rebuild | `asteroids.js` 28–29, 48–51, 1877–1903; `PROGRESS.md` 38–42 |
| Stations | `ctx.station { position, name, systemName, inZone, … }` + dock mesh | **No** | `SYSTEMS[id].station`; dock verb D in `U.DOCK_RANGE` 45 | `station.js` 1980–1987, 3061–3064; `state.js` 28 |
| Gates | Assemblies at system gate positions; `ctx.gate` zone flags | **No** | System def gates; D jumps; G cycles hub. Bore radius 30; zone 60 | `gate.js` 26–38, 535–559; `gate-scale.js` 14, 32–33 |
| Salvage (hail) | Disabled **ship** still in `ctx.ships` | Yes **as a ship** | Same ship ref. H hail | `hail.js` 73–91; HUD toast 465–466 |
| Salvage (aftermath) | `world.js` `wreckMeshes` decorative debris | **No** | Aftermath id → group | `world.js` 1240, 1253–1271 |
| Cargo / ore pods | `ctx.pods[]` `{ mesh, contents, velocity, bornAt, ttl }` | **No** | Auto-scoop `U.SCOOP_RANGE` 10 | `pods.js` 8–10, 515–527, 578–611; `state.js` 29 |
| Escape / survivor pods | Same list; `mesh.name = 'survivor-pod'` | **No** | Scoop; `commodity: 'survivor'` | `pods.js` 536–542 |
| Landmarks | `SYSTEMS[].landmarks` meshes in `landmarks` group | **No** | Authored `id` + `name` + `kind` + `position[]`. Proximity discovery | `landmarks.js` 11–15, 71–79 |
| Anomalies | Landmark `kind: 'anomaly'` (+ convergence site) | **No** | Same landmark table | `landmarks.js` 91–97; `model-catalog.js` 168 |
| Clue motes | `SYSTEMS[].clues` | **No** | Mystery `found` | `landmarks.js` 82–88 |

`ctx.asteroids` and `ctx.pods` are **not** created in `createCtx`. `asteroids.js` / `pods.js` attach them.

Decorative children (station lights, gate glow sprites, ship scars, instanced rock GPU mesh) are **not** lock refs. Mining and aim already ray **list spheres**, not a full-scene `Raycaster`.

---

## 9. Events and audio

Frozen vocabulary: `ctx.js` 197–226. Feature workers do not add types unless the comment list grows in a named `ctx.js` serial.

Song plays `CUES[event.type]` from `lastEvents` (`song.js` 415–438).

| Cue | Use | Cite |
|---|---|---|
| `hudMechRange` / `hudMechMatch` / `hudMechContact` | HUD-02 mech ticks. Family-gated. Gain ≤ 0.08 | `song.js` 113–128 |
| `hailOpened` | Comms blip; hail.js also opens the hail card | 78; `hail.js` |
| `saveBlocked` | Denial toast **and** tone — copy is SAVE BLOCKED | `song.js` 90; `hud.js` 436–437 |
| `commLine` | HUD toast (`cls: 'comm'`). **No** song cue | `hud.js` 400–409 |
| `podCollected` | Scoop chime | `song.js` 46 |

There is **no** lock-acquired or lock-miss event.

---

## 10. Tuning constants (READ-ONLY `state.js`)

| Name | Value | Role |
|---|---|---|
| `U.TARGET_RANGE` | 600 | Cycle range; hail salvage range; gun converge cap |
| `U.ENCOUNTER_BUBBLE` | 800 | Contacts Mk I |
| `U.DOCK_RANGE` | 45 | Station dock zone |
| `U.SCOOP_RANGE` | 10 | Pod scoop |
| `JUMP.zone` | must match `ZONE` 60 | Gate in-zone |

Feature workers do not add `U.*`. `CONVERGE_DOT` 0.72 lives in `combat.js` 174, not `state.js`.

---

## 11. Architecture contracts (do not break)

From `PROGRESS.md` 31–45 and `ctx.js` header:

- `ctx.js` header = ownership + frozen events.
- `state.js` = all tuning/data; **READ-ONLY** for feature workers (`state.js` 7–9).
- Per-system rebuild on `'systemLoaded'`.
- Asteroid `id === array index`.
- HUD-01 rails stay; HUD-02 skins closed; HUD never writes `hullKind`.
- Digit 0 = shipyard when docked.

---

## 12. What TGT-05 does **not** exist as

- No reticle-lock command.
- No pick cone / screen disc helper for selection.
- No occlusion-aware lock (aim ray exists for **fire point** only).
- No station/gate/pod/landmark `targets.current`.
- No gamepad map.
