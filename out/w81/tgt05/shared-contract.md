# TGT-05 remaining lock categories shared contract

**Wave:** 81. Design only. No TGT-05 category feature ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/Tgt05LockCatsDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt05ReticleLockDesign.md`, `docs/Hud02IdentitiesDesign.md`, `docs/ShpDesign.md`, `docs/Shp03WeaponsDesign.md`, `docs/NpcMissilesDesign.md`, `docs/BioLivingShipsDesign.md`, `docs/MsnMissionsDesign.md`, `docs/AstOrbitsDesign.md`, `docs/Pod02TraffickingDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/RepStandingDesign.md`, or sibling `docs/Msn03ChainsDesign.md` / `docs/Bio03ClassLookDesign.md` (other workers).  
**Locked sources:** wishlist Initiative TGT TGT-05; live inventory `out/w81/tgt05/current-tgt-inventory.md` (code wins; Wave 73 cites are stale); Wave 74 KeyV ships+rocks; `src/systems/controls.js`; `src/game/reticle-aim.js`; `src/core/ctx.js`; `src/systems/hud.js`; `src/systems/combat.js`; `src/systems/ship.js`; `src/game/state.js` (READ-ONLY); HUD-01 / HUD-02; AST `id === index`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale comments.

Wave 73 contract (`out/w73/tgt05/shared-contract.md`) remains the record for the **ships + rocks** KeyV slice. This file owns the remaining categories. Where they overlap (KeyT, KeyV, cone, rock test, `reticleLock` event), **this file + live code** win over Wave 73 proposals that already shipped.

---

## 0. Law in one page

1. Wave 81 is markdown only. Implementation is a later **serial** wave. Do not schedule or land these PRs in `src/` in this wave.
2. Keep **KeyT** `cycleTarget`. Keep **KeyV** `reticleLockPressed`. **No new binding.** Do not overload LMB. Do not reopen KeyV vs KeyT.
3. First impl of **this** slice **in:** station + gate + pod + landmark (anomaly is a landmark kind). **Out:** aftermath wreck debris. Salvage stays a **ship**. Do not invent `lockKind: 'salvage'`.
4. Cone pixel cap is **`LOCK_CONE_PX = 12`** (Wave 82 `docs/OwnerDecisionsWave82.md`). Do **not** invent degrees. Do **not** copy `CONVERGE_DOT` 0.72 (~44°). Use the 12 px radius only when no body disc contains the pip.
5. Ray = live `reticleAimPoint` / `fillCamRay` path (visible reticle, first-person recenter `0,0`, `RETICLE_EDGE` 44). No raw mouse-behind-camera ray. **No** full-scene `Raycaster` (station lights, gate glow, chevrons, instanced rock children must not steal).
6. Tight **body** sphere for pick: not glow, not dock zone (`U.DOCK_RANGE` 45), not `JUMP.zone` 60, not gate overlay chevrons, not landmark discovery 100, not clue 35. Foreground nearer sphere wins.
7. `lockKind` is **required** on station / gate / pod / landmark lock refs. Allowlist only. Unknown / untagged `{position}` **fails closed** (must not look like a rock). Live ships and asteroid list rows stay **untagged** (Wave 74 cycle-T compatibility).
8. MATCH **refuse** on station/gate/pod/landmark. Mining pull **refuse** except asteroid **list rows**. Hail / seeker / combat rail / lead / RANGE **ship-only**. Dock D and jump D stay **proximity**. Lock does not replace dock/jump.
9. Landmark lock uses **authored landmark id** only. Never clue id/text in HUD (§25). Chart marks stay **inert HUD**, not a lock source of truth.
10. No persist of lock. Reuse existing frozen event `'reticleLock' { hit: boolean }`. **No new frozen event.** Inventory proves miss/hit already use it (`controls.js` 109–126; `ctx.js` 227).
11. World strings: `textContent` only. No `innerHTML`. Prototype keys fail closed. No `for…in` blob merge. `ctx.emit` must not spread a lock ref (`ctx.js` 230–231 already spreads `data`).
12. `state.js` READ-ONLY. No new `U.*` in a feature PR. Digit 0 stays shipyard. HUD-02 closed. TGT-03 extras stay out. NPC missiles stay off (owner Q1/Q2).
13. Cycle-T must **not** gain station/gate/pod/landmark candidates.
14. Do not persist `targets.current`. Jump / despawn / destroy / scoop / systemLoaded already drop or must drop stale kind refs.

---

## 1. Command and keys (closed)

### 1.1 KeyT (preserve)

`cycleTarget` stays on KeyT / `input.targetPressed` (`controls.js` 54–82, 175–176, 292).

Must not:

- drop asteroid candidates in group 3
- add stations / gates / pods / landmarks to the cycle list
- change nearest-first wrap
- bind this slice to KeyT, LMB, or a hold that fires

### 1.2 KeyV (preserve + extend pick)

`tryReticleLock` stays on KeyV / `input.reticleLockPressed` (`controls.js` 114–127, 190–191, 313).

Later impl **extends** `pickReticleLock` (`reticle-aim.js` 96–144) so a direct-hit station / gate / pod / landmark may win. Same blocked gates (`reticleLockBlocked` 99–107). Miss still does not steal. Hit still assigns `ctx.targets.current`.

Must not reuse `fireHeld`, `targetPressed`, `matchSpeedPressed`, `dockPressed`, or `hailPressed`.

### 1.3 Binding

**Closed.** KeyV ships. Do not propose KeyZ / KeyN / Tab / RMB in this slice. Do not steal Digit 0–9.

Gamepad: **no** live API. Out of this slice.

### 1.4 When the command runs

Refuse (no write, miss feedback) when: no `ctx.ship.object`; docked; jumping; paused; models/title overlay. Miss when glass is empty or only ineligible objects sit under the reticle.

---

## 2. Pick math (later PR2 of this slice)

### 2.1 Ray = visible reticle

Reuse `fillCamRay` / `pickReticleLock`:

1. Read `ctx.targets.reticleScreen`.
2. If `ctx.flags.firstPerson`, treat offset as `0,0` (`reticle-aim.js` 33–35).
3. Clamp with `RETICLE_EDGE` 44 (`reticle-aim.js` 11, 36–39; `hud.js` 1004).
4. Unproject from **`ctx.camera`**.

Do not add a second ad-hoc ray. Do not Raycast `ctx.scene`.

`reticleAimPoint` stays the **gun/mining** hit. Do **not** add station/gate/pod/landmark as gun aim proxies. Guns still fire along the reticle ray (`combat.js` 1076–1084).

### 2.2 Direct hit (this slice)

For each **eligible** candidate inside `U.TARGET_RANGE` 600 from the player ship:

- Project **body** center + pick radius to screen. If the reticle pixel lies inside that disc, it is a direct hit.
- If several overlap, the **smallest positive ray-t** (nearer, unobscured) wins. Ships, rocks, and the four new kinds share **one** pick pass.

### 2.3 Body spheres (not glow / not zone)

| Kind | Center | Pick radius (live numbers, not invented cone) | Forbidden as pick |
|---|---|---|---|
| Station | `ctx.station.position` | Horizontal detail envelope **32** (`station.js` 389–390 `\|x\|,\|z\| <= 32`). Must be **<** `U.DOCK_RANGE` 45 | Glow / beacon sprites; dock zone 45; box diagonal (~46) |
| Gate | Assembly `group.position` / `a.x,a.y,a.z` | `BORE_RADIUS` **30** (`gate-scale.js` 14). Must be **<** `JUMP.zone` 60 | Glow sprite scale `RING_RADIUS * 3.2` = 96 (`gate.js` 78); chevrons/shutter; overlay |
| Pod | `pod.mesh.position` | `POD_RADIUS` **0.9** (`pods.js` 35) | Magnet radius `SCOOP_RANGE * 3` = 30; scoop 10 |
| Landmark | Authored `landmarks[i].position` | Bounding sphere of that landmark's **mesh object** in the landmarks group. If no mesh / no finite radius → **skip** (miss). Must not use discovery **100** or clue **35** | Chart-mark diamonds; clue motes; `LANDMARK_RADIUS` |

Do not invent a new world-unit constant in `state.js`. Use the live numbers above or the live mesh bound.

### 2.4 Occlusion

A farther eligible object does not win if a nearer eligible **or blocking** body sphere sits on the same ray at smaller t. Instanced rock GPU mesh, gate glow sprites, station running lights, ship scar planes, and HUD chart marks are **not** blockers unless they are the owning list/object sphere.

### 2.5 Forgiving cone

**Proposed, needs owner.** No degree number. No pixel number in this contract.

Until the owner sets a **screen-pixel** (or equivalent authored) cap:

- This slice ships direct-hit only.
- Do not use `CONVERGE_DOT` 0.72.
- Do not add `U.RETICLE_LOCK_CONE`.

### 2.6 Range

Cap = live `U.TARGET_RANGE` (600). Feature PRs do not add a parallel range.

---

## 3. Eligible categories

### 3.1 Already selectable (do not regress)

| Kind | Ref stored in `targets.current` | Skip |
|---|---|---|
| Ship | The live `ctx.ships` member (same as cycle-T). **Untagged** | `!object`, `state.destroyed`, not in `ctx.ships` |
| Asteroid | The **list row** (`ctx.asteroids.list[i]`), not a copy. **Untagged** | Missing `position`, not `list.indexOf(ref) >= 0` |

Asteroid reticle-lock **does not** require `weaponGroup === 3` (Wave 74). Cycle-T rocks stay group-3-only.

### 3.2 This slice — in (identity frozen)

| Kind | Live mesh/id | Lock ref | Notes |
|---|---|---|---|
| Station | `ctx.station` + station mesh | Wrapper `{ lockKind: 'station', position }`. One per system. Do not stamp `ctx.station` | Dock verb D stays proximity. Raw `ctx.station` matches rock helpers. |
| Gate | Gate assemblies (`gate.js`) | Wrapper `{ lockKind: 'gate', to, hub, position }` | Jump verb D / G stay zone. |
| Pod / cargo / ore / survivor | `ctx.pods[]` | Wrapper `{ lockKind: 'pod', position, pod }` where `pod` is the live list member. Stale drop: `ctx.pods.indexOf(ref.pod) < 0`. Do **not** stamp the live pod (`podCollected` emits `{ pod }`) | Auto-scoop stays. No persist. Must **not** set `object` to `mesh` (HUD `isShip` is `state \|\| object`). |
| Landmark / anomaly | `SYSTEMS[].landmarks` meshes | Wrapper `{ lockKind: 'landmark', id, position }` with authored `id` on current `SYSTEMS[currentSystem].landmarks` | Chart marks inert. Mystery persist unchanged. Anomaly = landmark kind. Never clue `id`. |

### 3.3 This slice — out

| Kind | Rule |
|---|---|
| Aftermath wreck | `wreckMeshes` decorative. **Out** unless a later world owner gives a stable selectable id |
| Salvage as a new kind | **Forbidden.** Disabled ships are ships. Hail salvage = ship lock + H |
| Clue motes | **Out.** Discovery only (`mystery.js` 106–114) |
| HUD chart marks | **Out** as a pick source. Display only |

Do not invent a target kind with no live mesh/id.

### 3.4 Salvage

Disabled ships remain **ships**. Reticle-lock may select them (Wave 74). Hail/salvage UI does not change.

---

## 4. Lock identity (fail closed)

Live ships and rocks stay **untagged**.

Non-ship/non-rock locks **must** set `lockKind` from this allowlist:

```
'station' | 'gate' | 'pod' | 'landmark'
```

Optional later tags `'ship'` / `'rock'` are legal to **read** but Wave 74 writers must not be forced to stamp them.

Sanitize / write:

- Only `Object.hasOwn` / `Object.prototype.hasOwnProperty` on incoming blobs. No `for…in` merge.
- Reject `__proto__`, `constructor`, `prototype`, and any key in live `RESERVED_IDS` (`save.js` 106–110) if ids are strings.
- Landmark `id` must equal an authored `SYSTEMS[…].landmarks[i].id` (lookup). Never a UUID. Never a clue id.
- Gate `to` must be `Object.hasOwn(SYSTEMS, to)`.
- Asteroid `id` stays the list index. Never a UUID.
- Fresh `{}` literals only when wrapping. Do **not** `Object.assign` / stamp `lockKind` onto `ctx.station`, a gate assembly, a live `ctx.pods[]` member, or a `SYSTEMS` row. `emit('podCollected', { pod })` already puts the live pod on the queue (`pods.js` 613; `ctx.js` 230–231). A stamped pod would leak lock identity into that event. A stamped `ctx.station` would linger after a miss/jump.
- The lock ref is a **wrapper**: `{ lockKind, position, … }` plus a non-enumerable or explicitly named live pointer (`pod`, `station`, `to`, `id`) that still `indexOf`s / allowlist-lookups. Do not put `type`, `__proto__`, `constructor`, or `t` on the wrapper (`emit` would smash the event).

**Rock test (must stay true only for asteroid list rows):**

```
list.indexOf(t) >= 0
OR (lockKind === 'rock' && list.indexOf(t) >= 0)
```

Shape-only tests that remain in live code **must be tightened** in the impl wave:

```
TODAY (unsafe):  t && t.position && !t.object && !t.state
REQUIRED:        that AND !t.lockKind AND list.indexOf(t) >= 0
```

A station `{ position, name }` **without** `lockKind: 'station'` must not be written. If a worker writes it anyway, MATCH / mining pull / HUD `ASTEROID` path must refuse (treat as no-lock / unknown), not as a rock.

NPC availability drop stays ship-shaped (`record` + `state`). Rock drop stays `dropStaleRockLock`. Jump still nulls `current`. This slice adds stale drops:

| Kind | Drop when |
|---|---|
| Station | `systemLoaded` / jump (already nulls) or `current` is not the current system's station lock |
| Gate | Assembly gone / not current system / `to` no longer on a live assembly |
| Pod | `ctx.pods.indexOf(ref.pod) < 0` (scooped, TTL) |
| Landmark | authored id missing from current `SYSTEMS[currentSystem].landmarks` |

---

## 5. Consumer fail-closed matrix

| Consumer | Ship lock | Rock lock | Station / gate / pod / landmark | Unknown / untagged `{position}` |
|---|---|---|---|---|
| HUD bracket | Name / faction / resolve | `ASTEROID` + ore meta | Authored name + dist only. No ship vitals. No `ASTEROID`. No clue text | Hide |
| Target combat rail | On | Hidden | Hidden | Hidden |
| Lead | Selected-weapon TOF | Hidden | Hidden | Hidden |
| RANGE pop | Selected-weapon envelope | Off | Off | Off |
| MATCH | Live (scalar) | Live (world vel) | **Refuse to arm.** Do not copy rock MATCH | Refuse |
| MATCH lamp | On if flag | On if flag | Off (flag must not stay armed) | Off |
| Missiles seeker | `liveMissileLock` | null | null | null |
| Gun converge | Ship in cone | no | no | no |
| Mining pull | Unknowable ship only | Pull if list row in cone | **No pull** | **No pull** |
| Hail H | Live / salvage | No-op | No-op | No-op |
| Dock D / Jump D | Unchanged (zone) | Unchanged | Unchanged (zone). Lock must not teleport dock/jump | Unchanged |
| Turret | Unchanged (own pick) | Unchanged | Unchanged | Unchanged |
| Contacts lock pip | Ship object | Off | Off | Off |
| Chart marks | n/a | n/a | Stay inert HUD. Locking a landmark does not write `mystery.charted` | n/a |
| Auto-scoop | n/a | n/a | Pod scoop unchanged | n/a |

A station lock must **not** silently break MATCH/combat: MATCH stays off; guns still fire along the reticle ray; seeker stays null.

Group-3 mining: rock lock + beam ray-sphere stay. Reticle-lock of a station in group 3 must not pull the laser. Reticle-lock of a rock in group 1/2/4 must not fire the laser.

HUD prompt order stays dock → jump → hail → T → mine → V (`hud.js` 1654–1707). A station lock must not hide `D Dock` when `inZone`.

---

## 6. Feedback

### 6.1 Visual hit

Existing target bracket. Immediate. No new glance instrument. Do not move HUD-01 / HUD-02 layout.

Bracket copy (always `textContent`):

| Kind | Name | Meta |
|---|---|---|
| Station | `ctx.station.name` (authored) | dist only |
| Gate | Destination `SYSTEMS[to].name` (allowlisted). Hub may add a static `HUB` suffix | dist only. Do not print raw `to` token if a display name exists |
| Pod | Static kind word from contents: `CARGO` / ore `COMMODITIES[key].name` / `SURVIVOR` | dist only. Do not print stuffed survivor `name` on the **name** line without control-char strip; prefer the static word |
| Landmark | Authored `landmarks[i].name` for that **id** | dist only. **Never** clue id, clue line, or `mystery.found` ids |

Strip / ignore control chars on any copied world string.

### 6.2 Visual miss

Reuse live miss: `commLine` `{ text: 'Nothing under the reticle.' }` (`controls.js` 97, 109–111). Do not build it from `record.name`, cover names, landmark ids, clue lines, or save strings. Do not `emit('commLine', lockRef)`.

### 6.3 Audio

Reuse live `'reticleLock' { hit: boolean }` + `song.js` `CUES.reticleLock`. No second event type. No HUD-03 checkbox. Do not reuse `hailOpened`, `hudMechContact`, `hudMechMatch`, `saveBlocked`, `landmarkFound`, or `clueFound` as the lock beep.

Payload is only `{ hit: true }` or `{ hit: false }` written as a literal. Do not spread a station, gate, pod, landmark, ship, rock, or save blob into `emit`.

### 6.4 Names / §25

Q-ship cover rules stay (`hud.js` 1569–1578). Landmark HUD must not print unpublished mystery clue text or clue ids.

---

## 7. Persist, prototype, XSS, events

- No new `localStorage` key. Autosave stays `rimward-save-v1`.
- Do not add `targets` to `WORLD_FIELDS`.
- No nested lock blob on hangar / player / mystery / aftermath.
- `mystery.charted` stays a landmark-id list written **only** by keeper chart mark (`contacts.js` 387–400). Lock must not push ids into it.
- Prototype keys fail closed on `lockKind` / gate `to` / landmark `id`.
- `innerHTML` forbidden on HUD / toasts / prompts / bracket. Models-browser `innerHTML` is out of scope (do not copy it).
- No secrets.
- No new frozen event. `reticleLock` already exists.

`ctx.emit` **spreads** `data` (`ctx.js` 230–231). A lock object with `__proto__` or `type` on it would corrupt the queue. Writers pass a fresh `{ hit: boolean }` only.

---

## 8. Closed neighbours

| Neighbour | Freeze |
|---|---|
| HUD-01 | Glance set and positions stay |
| HUD-02 | Family skins stay. HUD never writes `hullKind` |
| HUD-03 | No new audio/settings key |
| TGT-01 | Lead + RANGE = selected weapon. Mining hides lead |
| TGT-02 | MATCH lamp on ship **or** rock only |
| TGT-03 | Contacts arc scanner-gated. No missile warning gauge in this slice |
| TGT-04 | Turret pick stays independent of this command |
| TGT-05 ships+rocks | Wave 74 stays. This slice extends pick + `lockKind` only |
| SHP | Digit 0 shipyard. No dock-digit steal |
| AST | `id === index`. No rock UUID |
| POD | Scoop unchanged. No trafficking reopen |
| NPC missiles | Off. Owner Q1/Q2. Do not ship here |
| BIO / MSN | Closed. Do not invent sibling numbers |

---

## 9. Serial PR plan (later impl, named only)

Do **not** implement in Wave 81.

| PR | Name | Lands | Must not |
|---|---|---|---|
| **PR1** | Inventory pins | Boot/harness pins: KeyT cycle, KeyV ships+rocks, `TRACKED` includes V, `reticleLock { hit }`, Digit 0 shipyard, rock-shape hole still present, `U.TARGET_RANGE` 600 | Change bindings; invent cone |
| **PR2** | Pick math | Extend `pickReticleLock` with four body spheres; disc hit; occlusion; range cap; no scene Raycaster. **May return** new-kind hits from the helper. `tryReticleLock` must **not** assign them to `targets.current` until PR3 | Invent cone degrees/pixels; use glow/dock/jump/discovery radii; gun `reticleAimPoint` proxy hits; write wrappers while `isRockLock` is still shape-only (`dropStaleRockLock` would null them the same frame) |
| **PR3** | Identity + fail-closed | Tighten rock tests to **list membership** **first** in the PR; then write `lockKind` wrappers; MATCH/mining/hail/seeker/HUD refuse non-ship/non-rock | Station-as-rock; assign wrappers before the rock-test tighten; new persist; new event; mutate `state.js` |
| **PR4** | HUD + stale drop | Bracket authored name+dist; stale pod/gate/landmark/station drops; miss/hit reuse `reticleLock` | `innerHTML`; clue ids; chart-mark as source of truth |
| **PR5** | Boot pins | Point-at-station/gate/pod/landmark + V locks; MATCH refuse; mining refuse; dock/jump still zone; KeyT still ships-only (rocks in group 3); FP recenter; miss no steal | Sibling docs; cone |

Order is serial. PR3 must not land without PR2 body spheres. PR4 must not print clue text.

---

## 10. Open owner questions (block impl only)

Defaults in this file stand unless the owner overrides.

1. **Cone pixel cap** — **proposed, needs owner**. Without a number, pick stays direct-hit. **Not** a KeyV vs KeyT question.

No other career questions. Station/gate/pod/landmark **in** for this slice is the owner request. Binding is closed (KeyV).

---

## 11. Verifier pins (later)

A later wave should pin:

1. KeyT still cycles ships; group 3 still adds rocks; **no** station in the cycle list.
2. KeyV still the only reticle-lock edge. Not LMB / Digit 0 / H/D/C/X / 1–4 / Space / Shift.
3. FP: pick uses centered reticle, not raw mouse.
4. Destroyed ships never lock. Aftermath wrecks never lock. Clues never lock.
5. Rock lock is the list row (`indexOf`), `id === index`.
6. Station/gate/pod/landmark locks carry `lockKind` from the allowlist.
7. Untagged `{position,name}` does not MATCH as a rock and does not mining-pull.
8. MATCH refuses the four kinds. Seeker null. Hail no-op. Combat rail hidden.
9. Dock D still needs `U.DOCK_RANGE`. Jump D still needs `JUMP.zone`. Lock does not dock/jump.
10. Landmark bracket uses authored name; never clue id/text.
11. Chart mark click/pick is not a lock writer.
12. Miss does not use `innerHTML` or `saveBlocked`. `reticleLock` payload is `{ hit }` only.
13. `state.js` untouched. No new frozen event.
14. Digit 0 still shipyard.
