# PHY-04 remaining NPC avoid — live inventory

**Wave:** 108. Markdown only. Code wins over wishlist / PROGRESS comments.  
**Census date:** 2026-08-24.  
**Scope:** leftover PHY-02 quality after Wave 53 first pass and Wave 58 gate torus / station holds / stronger station-gate avoid.  
**Not this leftover:** PHY-01 bounce/slide, PHY-03 sun heat/kill radii, FLT player flight, NAV-03/04 autopilot MATCH/hover, BIO-06/08 motion, BIO-07 meshes, Digit/HUD chrome, persist.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Wishlist / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| PHY-01 / PHY-02 / PHY-03 first pass DONE Wave 53 | wishlist 54, 1020; PROGRESS 2785–2805 | **True.** `physics.js` + `collision.js` + NPC avoid + player bounce + combat heat |
| Wave 58: gate torus, station hold routes, stronger station/gate avoid | wishlist 58–59, 1021–1023; PROGRESS 2884–2907 | **True.** `torusOverlap`, `kind:'gate'` bodies, `writeStationHold`, `stationKeepOutHits`, `gateProbeHits` |
| NPC avoid is still a lookahead bias, not full path planning | wishlist 1022–1023, 838; PROGRESS 2898 | **True.** `applyAvoidBias` is one 40 u probe + lateral offset |
| Player cannot pass through major objects | wishlist 1049 | **Collision net**, not player lookahead. Manual FLT has no `applyAvoidBias` |
| NPC traffic completes routes without routine collisions | wishlist 1051 | **Open leftover.** Bias + bounce; not a planner |
| PHY-02: NPCs steer around ships, stations, asteroids, suns; collision is the safety net | wishlist 1036–1039 | **Partial.** Probe + bounce exist; chord misses still bounce |

Wave 58 OPEN (PROGRESS 2896–2898): old saved trader `route[0]` can sit on the pad until the bank rebuilds; Wave 59 `healPadHome` later rewrites pad-home (`world.js` 702–726). PHY-02 still lookahead after that heal.

Wave 58 verify: `out/w58/avoid/probe.log` ALL CLEAN (gate torus probe, skipAvoid no station/gate skip for NPC, miner hold, station path hit, lateral replica). That freeze is **shape**, not “no routine collisions.”

---

## 1. Shared PHY table (do not duplicate on `state.js`)

`src/game/physics.js` 1–23. Comment: do not duplicate these keys on `state.js`.

| Key | Value | Use |
|---|---|---|
| `PLAYER_RADIUS` | 2.4 | Player bounce + AP dummy live |
| `STATION_CYL_RADIUS` | 32 | D5 cylinder |
| `STATION_CYL_Y0` / `Y1` | −26 / 33 | Cylinder band |
| `IMPACT_SCREEN_PER_U` | 0.35 | Combat impact (not this leftover) |
| `IMPACT_MIN_SPEED` | 8 | Slide-only below this |
| `RESTITUTION` | 0.15 | Bounce |
| `SLIDE_FRICTION` | 0.85 | Slide |
| `SUN_HEAT_MULT` | 2.4 | Heat sphere / avoid sun body r |
| `SUN_LETHAL_MULT` | 1.12 | Lethal core — **do not retune here** |
| `SUN_HEAT_DPS` / `SUN_HEAT_RAMP` | 6 / 18 | Combat heat — **do not retune** |
| `AVOID_LOOKAHEAD` | **40** | Single probe distance along −Z |
| `AVOID_GAIN` | **1.4** | Lateral aim offset scale |
| `GATE_BORE` | 30 | Torus major R; slot `r` |
| `GATE_TUBE` | 2.2 | Torus tube; slot `y0` |

Kernel pins: `out/phy-verify/kernel-pins.mjs` 34–35 still 40 / 1.4.

---

## 2. Collision bag and safety net (PHY-01)

### 2.1 `collectBodies` — `src/game/collision.js` 345–455

Writes `{ count, items[] }` slots `{ kind, x, y, z, r, y0, y1, id }`. **No `axis` field.** After warmup, `acquireSlot` reuses items (47–54). No per-frame `new` after first fill.

Order:

1. Station cylinder if `ctx.station.position` or `config.world.stationPosition` (349–361)
2. System `gates[]` as `kind:'gate'`, `r=GATE_BORE`, `y0=GATE_TUBE` (363–388)
3. Hub lantern as a second gate if `hub.routes.length` (390–410)
4. Asteroids from `ctx.asteroids.list` (411–423)
5. Live ships, skip destroyed (424–444)
6. Player `kind:'player'`, id −1, r 2.4 (445–452)

**Sun is not in `collectBodies`.** NPC `appendSunBody` adds a heat-radius sphere to the same bag (`npc.js` 660–682). Player bounce **strips sun** before `resolveMover` (`ship.js` 908–914) so the star is heat, not a wall.

Gate torus axis in `torusOverlap` (`collision.js` 102–197) is **gate → origin** (`-gx,-gy,-gz`). NPC `writeGateAxis` (`npc.js` 436–464) uses `body.axis` if present, else the same −position fallback. `collectBodies` never sets `axis`, so live probes match origin-facing rings.

### 2.2 `resolveMover` — `collision.js` 457–550

TWO overlap passes. Station = cylinder, gate = torus, else sphere. Self-skip is `(skipKind, skipId)` so asteroid 0 ≠ station 0 (500–501). NaN clears, does not throw (458–473). Restitution 0.15 / slide 0.85. **Not swept CCD.** Safety net for overlap, not a planner.

### 2.3 Player FLT bounce — `src/systems/ship.js` 904–936

After integrate, if not docked / jumping / dockPressed: `collectBodies` → drop sun → `resolveMover(..., PLAYER_RADIUS, ..., 'player', -1)`. Writes position + velocity. `bodyHit` emit throttled. **Grep `applyAvoidBias` in `ship.js`: 0.** Manual player has **no** lookahead. Wave 58 player station/gate “avoid” is **collision**, not PHY-02 steer.

Cruise 120 u/s at 60 Hz ≈ 2 u/frame. Station r 32 + player 2.4 will not tunnel a D5 at that step. Gate tube 2.2 + 2.4 = 4.6; a 2 u step still overlaps. This leftover does **not** reopen player FLT.

### 2.4 NPC bounce — `npc.js` `bounceLive` 685–730

Derives vel from last pos (`ai._px/_py/_pz`). `resolveMover(..., 'ship', live.id)`. On hit, slides hull and may fold heading to bounce vel. Called every live tick when `_phyOn` (2304, 2337). Disabled/drift also bounce (2304).

`_phyOn = !ctx.gate.jumping` (2261). Jump: bag count 0, no avoid, no bounce.

---

## 3. PHY-02 lookahead (the leftover)

### 3.1 Module comments — `npc.js` 57–60, 603–607

```
PHY-02 lookahead steer and resolveMover bounce reuse module dest/out records.
Bias an aim point laterally around the nearest lookahead obstacle.
Writes outAim. Does not replace combat / waypoint aims — only adds offset.
```

Scratch: `_bodies`, `_aimAvoid`, `_fwd`, `_away`, `_v2`, `_v3` (67–79). **Zero alloc per frame** after spawn (57–59). `_phyOn` (90).

### 3.2 `skipAvoidBody` — `npc.js` 424–434

| Case | Skip? |
|---|---|
| Player dummy + `kind:'player'` | yes (self) |
| Player dummy + `kind:'gate'` | **yes** — AP must thread the bore |
| Own `kind:'ship'` id | yes |
| Combat `target === 'player'` + player body | yes — do not steer off envelope |
| Combat target ship id | yes |
| Station / sun / asteroid / other ships | **no** |

NPC does **not** skip station or gate. Wave 58 probe: `src.skipAvoid.noStation` / `noGate` CLEAN.

### 3.3 Station keep-out — `npc.js` 536–562

`stationKeepOutHits` returns 0 none, 1 path/probe, 2 hull already inside. Tests:

- hull in cylinder → 2
- lookahead point in cylinder → 1
- XZ segment hull→probe vs cylinder (Y band) → 1

**This is already a path test for stations only.** Other kinds have no segment test.

Inside (how===2): `addStationOutXZ` doubles XZ out (`npc.js` 585–601, 633–635, 653 gain ×2).

### 3.4 Gate probe — `npc.js` 471–487, 643–645

`gateProbeHits`: torus vs ring, bore empty, tube solid. `GATE_TUBE_FALLBACK = 2.2` (134). Hit uses `nearestGateRing` then `addLateralAway` from the ring point (489–517, 643–645).

### 3.5 `applyAvoidBias` — `npc.js` 608–658 (export)

1. `outAim.copy(targetPos)`
2. If `!live` return
3. `live.avoidHits = 0`
4. If caller omitted `bodies` and `!_phyOn` return (NPC jump fail-closed: **no bias**, keep dest)
5. Probe at `pos + fwd * PHY.AVOID_LOOKAHEAD` (40)
6. For each bag body: skip, station keep-out, else `probeHitsBody` (sphere / gate torus)
7. Accumulate lateral in `_v2`; normalize; add `look * AVOID_GAIN` (40 × 1.4 = 56 u), or 2× if inside station
8. `live.avoidHits = hits` (count of bodies, not a HUD)

**One sample along heading.** No second range. No dest-chord. No A*. No navmesh.

Fail-closed today if bag empty / `_phyOn` false / no object: **unmodified aim**. Never freeze the hull. Never `speed = 0` from avoid.

### 3.6 `steerLive` — `npc.js` 748–754

```
const aim = _phyOn ? applyAvoidBias(live, targetPos, _aimAvoid) : targetPos;
steer(..., aim, turnRateFor(classKey, speed), dt);
```

All route / loiter / hunt / flee / mine home that call `steerLive` get the bias. Combat envelope still writes `_aim` first; avoid is **additive**.

### 3.7 Per-frame collect — `npc.js` 2261–2267

Once per `initNpc` update, not per ship: `collectBodies(ctx, _bodies)` then `appendSunBody(ctx)` (sun uses heat radius `sunRadius * SUN_HEAT_MULT`). Then every live ship `steerLive` + `bounceLive` shares that bag.

---

## 4. Station holds (Wave 58 routes; not a planner)

### 4.1 Authored holds — `src/game/traffic-feel.js`

- `STATION_HOLD_PAD = 12` (14)
- `writeStationHold` (71–102): XZ out by `STATION_CYL_RADIUS + hull + pad + 0.05`. Y clamped to cylinder band. Direction station → `fromPos`, else origin, else +X.
- `stationHoldPoint` (105–107)

Trader shared routes use **freighter** hold (`world.js` 98–102, 106–110). Miner station legs use light/cutter (`world.js` 398–399).

### 4.2 Live miner/flee hold — `npc.js`

- `MINER_HOLD_PAD = 12` (132), `MINER_HOLD_ARRIVE = 28` (133)
- `minerHoldFromStation` export (900–922)
- `steerMinerHome` (957–973): aim hold, dock when dist < 28, **not pad**
- Wave 58: no-threat flee docks at hold

### 4.3 Pad heal — `world.js` 702–726

`healPadHome` rewrites trader/miner `route[0]` if it sits on the pad (`PAD_HOME_EPS`). Patrol **not** healed.

### 4.4 Patrol still pad-center

`world.js` 374–381: patrol `route: [station.clone(), jitter(gate), jitter(planet)]`. Comment 899: waypoint 0 is home; patrols dock at the station. **Live avoid + bounce** keep the hull out of the cylinder; the authored dest can still sit **inside** D5. This leftover may **live-retarget** a hold when the station path test fires. It must **not** rewrite patrol persist / AI jobs as a navmesh.

---

## 5. Player / AP (do not steal)

| Surface | Today | Cite |
|---|---|---|
| Manual FLT avoid | **none** | `ship.js` no `applyAvoidBias` |
| Player station/gate | bounce torus/cylinder | `ship.js` 904–927; `collision.js` 502–505 |
| Autopilot dummy live | `role:'player'`, skip gates | `autopilot.js` 47–54; `skipAvoidBody` 425–428 |
| AP path | `planApPath` chord detour + widen/hover | `ap-path.js` 1–5, 352–409 |
| AP then PHY-02 | `applyAvoidBias(_playerLive, _aim, _aim, _apBodies)` | `autopilot.js` 247–275 |
| AP keep-out skip | gate, player, ship, asteroid | `ap-path.js` 41–43 |

NAV-03/04 own MATCH, hover, Autopilot. PHY-04 must **not** import `planApPath` into NPC tick (that couples hover/detour/MATCH). NPC may reuse **the idea** of a cheap second sample inside `applyAvoidBias` with existing scratch.

---

## 6. HUD / Digit / persist / DOM

| Surface | Today | Cite |
|---|---|---|
| Empty 80 px hub | `.rw-reticle` 80×80; RANGE child | `hud.css` 184–193; `hud.js` 709–712 |
| Avoid pip | **none** | grep avoid chrome 0 |
| `bodyHit` toast | Hull strike only if `damage > 0` | `hud.js` 591–593 |
| `sunHeat` / `sunKill` | STAR HEAT / star took the ship | `hud.js` 587–590 |
| Digit 0 | shipyard | `station.js` 188 `DOCK_KEY_SERVICES` last; 6041–6043 |
| Digit 8 dock root | launch (index 7) | `station.js` 188, 6045–6046 |
| Digit 9 dock root | epics / Standing (index 8) | same |
| Outfitting 8/9 | launcher / turret papers | `station.js` 1633–1634 |
| `WORLD_FIELDS` | time…nav; **no avoid key** | `save.js` 76–101 |
| Autosave key | `rimward-save-v1` | `save.js` 16, 66 |
| `innerHTML` in `npc.js` | **none** | grep 0 |
| `state.js` PHY keys | **none**; PHY lives in `physics.js` | `physics.js` 4–5 |

---

## 7. Speeds vs lookahead (why bias still collides)

| classKey | cruise u/s | time to cover 40 u |
|---|---|---|
| ace | 135 | 0.30 s |
| light | 120 | 0.33 s |
| cutter | 105 | 0.38 s |
| heavy | 90 | 0.44 s |
| freighter | 60 | 0.67 s |
| frigate | 22 | 1.82 s |

A body whose closest approach sits **between** hull and the 40 u point is invisible to sphere/gate probes (station already tests the XZ chord). Ace/light can close ~2 u/frame; bounce still catches overlap, which is the **routine collision** the leftover wants to stop **as navigation**.

`npcRadius` prefers `scale.maxRadius` else proxy hypot else 3 (`npc.js` 411–422). Player dummy uses `PLAYER_RADIUS` (413).

---

## 8. What is already “path-like” vs still a bias

| Already shipped | Still a bias |
|---|---|
| Station hull + path keep-out | One heading sample for ship/asteroid/sun/gate |
| Gate torus probe + nearest ring lateral | No dest-to-hull chord for those kinds |
| Inside-cylinder XZ eject ×2 gain | Laterals summed then **one** normalize — nearest is not chosen, they blend |
| Trader/miner authored holds | Patrol pad-center dest |
| `healPadHome` for old trader/miner saves | Avoid never rewrites waypoints |
| PHY-01 bounce/slide | Avoid never stops the ship |
| AP `planApPath` (player AP only) | NPC must not call it |

---

## 9. CPU / alloc (freeze input)

- Collect once per frame into module `_bodies`
- Per NPC: loop `bag.count`, a few Vector3 ops, no `new`
- `resolveMover` two passes, module `_ov` / `_vel`
- Forbidden later: per-NPC A* grid, navmesh, extra `{items}` alloc per NPC per frame, `planApPath` DETOUR_ITERS (8) on every traffic hull

---

## 10. Fail-closed live behavior (must keep)

| Missing data | Live result |
|---|---|
| Jumping / `!_phyOn` | Aim = dest; no bounce |
| Empty bag | Aim = dest |
| No `live.object` | Aim = dest |
| Probe miss | Aim = dest |
| NaN vel in bounce | vel 0 then resolveMover NaN-safe |
| Missing station for miner home | `steerMinerHome` falls through `updateRoute` (`npc.js` 959–961) |

Never freeze NPCs in place because avoid data is missing.

---

## 11. Neighbour fences (do not reopen)

| Neighbour | Fence |
|---|---|
| PHY-01 | Keep `resolveMover` bounce/slide |
| PHY-03 | Do not retune `SUN_*` |
| FLT | No player `applyAvoidBias` in `ship.js` |
| NAV-03/04 | No MATCH/hover/AP steal; do not import `planApPath` into NPC |
| HUD-01 | No hub child; RANGE stays TGT-01 |
| Digit 0/8/9 | No steal, no new Digit |
| `state.js` | READ-ONLY later |
| Persist | No new `WORLD_FIELDS` |
| BIO-06/07/08 | Motion/meshes other workers |
| Boot FAILs | Do not fix |

---

## 12. Deputize input (no live second sample)

Grep: no `AVOID_LOOKAHEAD / 2`, no second probe loop, no NPC `sphereChordHit`. Smallest additive that reads as path is **not** live. Wave 108 freeze lives in `shared-contract.md` §0.1.
