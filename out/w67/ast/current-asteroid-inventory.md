# Current asteroid inventory (code wins)

**Wave:** 67. Design only.  
**Status:** LIVE CODE inventory for Initiative AST. If a comment, wishlist line, or this file disagrees with `src/`, **code wins**.  
**Not this wave:** any edit under `src/`.

Cites are `file:line` at inventory time (2026-08-19). Re-read those lines before an implementation PR.

---

## 1. Identity contract (wave 51 — do not break)

`PROGRESS.md` 39–42 and `asteroids.js` 1546–1635:

| Rule | Live |
|---|---|
| `id === array index` | `list.push({ id: i, ... })` at `asteroids.js` 1627–1635. Second pass index `i` **is** `asteroidId`. |
| Flat list | `ctx.asteroids.list` is one array. Replaced wholesale on rebuild (`asteroids.js` 25–26, 1652–1653). |
| Same index as sim | Closure `rocks[]` and `list[]` share index (`asteroids.js` 1483–1484, 1625–1635). |
| Consumers dereference by id | `asteroids.js` 1779: `rocks[ev.asteroidId]`. `combat.js` 1189 / 1170 emit `bestEntry.id`. `npc.js` 996–997 emit `rock.id`. |
| HUD / controls hold the **entry object** | `controls.js` 67–70 pushes `ref: a` (the list entry). `hud.js` 933–934 reads `target.position`. Identity is object + `id`, not a UUID. |

Required list fields (`PROGRESS.md` 39–41; `asteroids.js` 1627–1635):

```
{ id, position, radius, ore, commodity, oreKey, hardness }
```

- `position` is a live `THREE.Vector3` (same object as `rock.position`). Not JSON-plain in memory.
- `ore` is remaining **units**, not a commodity key (`hud.js` 1515–1524).
- `commodity` and `oreKey` are the ore key string (`rawOre`, …).
- `hardness` is copied from `ORE_TYPES[oreKey].hardness` at build.

---

## 2. Generation (one local cluster)

Owner: `src/systems/asteroids.js` `initAsteroids` → `build(def)`.

| Step | Cite | What happens |
|---|---|---|
| Seed | 1504 | `makeRng(0xa57e000 + def.worldSeed)` (mulberry32, same family as `solarsystem.js` 67–77). |
| Count / center | 1500–1502 | `field.count`, `field.center` `[cx,cy,cz]`, `field.oreMult ?? 1`. |
| Band mix | 1503, 1506–1514 | `pickOreType(def.band ?? 0, rng())` **first**, one draw per rock, before geometry. Deterministic mix. |
| Meshes | 1516–1544 | One `InstancedMesh` per ore that drew ≥1 rock. Name `'asteroid-field-' + oreKey`. `userData.oreKey`. Empty meshes never allocated. `frustumCulled = false`. |
| Placement | 1554–1561 | Flattened torus/cluster: `theta` full circle, `r = field.radius * (0.35 + 0.65 * rng^0.7)`, ±24 xz jitter, y `±18` around `cy`. **This is the local clump.** |
| Radius | 1563 | `(2 + rng^1.6 * 12) * profile.scaleMult`. Bounding sphere for mining. |
| Axis jitter | 1570–1594 | Gated on `profile.axisJitter`. Max axis component = 1 so scale never exceeds `radius`. |
| Units | 1607 | `ceil((4 + floor(rng*9)) * oreMult * unitsMult)`, min 1. |
| List write | 1627–1635 | `id: i` plus live `position` Vector3. |
| Tumble budget | 1655–1658, 1731–1743 | Recompose ~1/4 of the **flat** array per frame. Depleted rocks skip tumble. |

`asteroids.js` holds **no** per-ore look constants (`PROGRESS.md` 43–45; header 12–20). Shape, craters, `axisJitter`, `surface` live on `ORE_TYPES[key].rock` (`state.js` 322–474). `rock-surface.js` reads the recipe only.

Standalone browser prop: `buildAsteroidModel(seed, oreKey)` (`asteroids.js` 1422–1478). Unknown `oreKey` falls back to `'rawOre'` (1423).

---

## 3. Per-system field data (already on system records)

`state.js` is READ-ONLY for feature workers. Field blocks already live on each system.

Authored six (`src/game/authored-systems.js`):

| System | band | center | radius | count | oreMult | Cite |
|---|---|---|---|---|---|---|
| freehold | 0 | `[-450,-30,-250]` | 160 | 130 | 1 | 43 |
| veridian | 0 | `[500,-40,300]` | 120 | 90 | 1.5 | 72 |
| redmarch | 1 | `[-380,-50,380]` | 140 | 110 | 1.2 | 104 |
| hollowreach | 2 | `[420,-60,-320]` | 100 | 60 | 2.0 | 136 |
| hush | 3 | `[-350,-50,-280]` | 90 | 45 | 2.5 | 171 |
| verge | 4 | `[-300,-40,-240]` | 80 | 35 | 3.0 | 203 |

Generated 94 (`scripts/generate-galaxy.mjs` 592–597; emitted into `src/game/galaxy.generated.js`):

- `center`: `[rint(-550,550), rint(-70,-20), rint(-550,550)]`
- `radius`: 85–160
- `count`: `clamp(round(130 - band*25 + jitter), 25, 140)`
- `oreMult`: `clamp(1 + band*0.5 + jitter, 0.5, 3.5)`

There is **no** `field.kind`, orbit radius, inclination table, or belt width today.

`ctx.config.world.asteroidField` (`ctx.js` 63) is a leftover default Vector3 blob. Live build reads `SYSTEMS[id].field`, not this object.

Sun is at `ctx.config.world.sunPosition` default `(0,0,0)` (`ctx.js` 59). Planets orbit that origin (`solarsystem.js` 236, 333–337). Cluster centers sit **hundreds of units off the star**, so the field reads as a placed blob, not a stellar belt.

---

## 4. Ore look and hardness ladder (waves 51–52)

| Surface | Cite | Law |
|---|---|---|
| `ORE_TYPES` | `state.js` 322–474 | Nine keys. `hardness` 1..4, `extractResist`, `unitsMult`, colours, `blockedLine`, full `rock` recipe. |
| `ORE_KEYS` / `pickOreType` / `oreKeysForBand` | `state.js` 476–512 | Band weights. Unknown band → band 0. `pickOreType` uses `for (const key in weights)`. |
| `MINING_LASERS` | `state.js` 51–76 | Index **is** `ctx.world.miningLaser` 0..3. Mk I–IV: extract 1.2/2.0/3.1/4.4, range 90/115/140/165, tiers 1–4. |
| `miningLaserFor` | `state.js` 79–81 | Non-integer / OOB → Mk I. |
| `WEAPONS.mining` | `state.js` 92–95 | Derived from `MINING_LASERS[0]`. Combat reads the **installed** head, not this row. |
| Outfitter | PROGRESS 2551–2556 | Digits 5/6/7 sell indices 1..3. Prerequisite ladder. |
| Persist | `save.js` 87–89, 310–315 | `'miningLaser'` on `WORLD_FIELDS`. `sanitizeRestored` allowlists `0\|1\|2\|3` else 0. |

Combat hardness gate (`combat.js` 1026–1189):

- Resolve `miningLaserFor(ctx.world.miningLaser)` **every** `updateMining` call (1028–1031). Do not cache across frames.
- Ray-sphere vs **every** `list[i]` (`1054–1069`). Closest `t` wins. Uses live `a.position` + `a.radius`.
- `hardness > laser.tier` → `'mineBlocked' { asteroidId, oreKey, hardness, needs, line }` at most once per second per id (`1159–1170`). Module scalars `_lastBlockedId` / `_lastBlockedAt`; reset on `'systemLoaded'` (PROGRESS 2567).
- Else `'mineHit' { asteroidId, point, laserTier, extractPerSec }` (`1189`). `point` is a pooled Vector3 (`combat.js` 126–127 comment, 1186–1188).

Extraction (`asteroids.js` 1775–1825):

- `rocks[ev.asteroidId]`. Ignore missing / depleted.
- Effective rate = `rawRate / ORE_TYPES[rock.oreKey].extractResist`.
- Integer units spawn pods (`spawnPod` + `podTint`). `strikeRush` doubles yield (`1789`).
- `ore <= 0` → `deplete(i, rock)`: `list[i].ore = 0`, darken ×0.35, collapse radius to `baseScale * 0.3` (~0.4 s; snap if `reducedMotion`) (`1688–1712`).

HUD bracket (`hud.js` 1513–1534): `COMMODITIES[target.commodity]`, `H<n>`, units left or `NEEDS <head>`. `.ore-blocked` is redundant colour. `textContent` only.

---

## 5. Targeting and aim

| Consumer | Cite | Behavior |
|---|---|---|
| T-cycle | `controls.js` 51–79 | Weapon group 3 only. Candidates with `distanceToSquared <= TARGET_RANGE²`. `TARGET_RANGE` = 600 (`state.js` 29). Pushes the **list entry**. |
| Mining beam pull | `combat.js` 1038–1043 | If lock is a rock (`t.position && !t.object`) and inside reticle cone, beam steers to it. |
| Reticle world point | `reticle-aim.js` 47–54 | Ray-sphere vs every rock. Used by combat fire / mining aim. |
| HUD bracket / lead | `hud.js` 933–962, 1513–1534 | `target.position`. Lead estimates velocity from deltas. Comment 962: **asteroids sit still so their pip hides**. Mining lead already hidden when `wSpeed === 0` (HUD-02 glance table). |
| NPC target drop | `npc.js` 2265–2269 | Drops destroyed **ships**. Asteroid refs have no `.record/.state` and are left alone. A rebuilt `list` makes an old lock a detached object (stale position). |

---

## 6. PHY collision / NPC avoid / miners (waves 53, 56–58)

### 6.1 Bodies

`collectBodies` (`collision.js` 345–455) writes:

- Station D5 cylinder (`PHY.STATION_CYL_*`, `physics.js` 8–10)
- Each `gates[i]` torus (`GATE_BORE` 30, `GATE_TUBE` 2.2)
- Hub lantern as a second gate
- **Every** `ctx.asteroids.list` entry as `kind: 'asteroid'`, sphere `r = a.radius`, `id = a.id` (`411–422`)
- Live ships + player

Sun is **not** in `collectBodies`. `combat.js` 1418 uses `sunZone` (`collision.js` 318–342): heat at `sunRadius * 2.4`, lethal at `* 1.12` (`physics.js` 15–18). `npc.js` `appendSunBody` (637–658) adds a heat-radius sphere for NPC avoid only. `ship.js` 801 skips `kind === 'sun'` if one ever appears.

Player bounce: `ship.js` 795–827 after integrate. `bodyHit { kind, speed, damage:0 }`. Combat fills impact damage.

NPC: `collectBodies` + `appendSunBody` then `applyAvoidBias` (`npc.js` 590–634, `AVOID_LOOKAHEAD` 40) and `bounceLive` (660–706). Asteroids are ordinary spheres in that pass.

### 6.2 Miners (wave 57)

| Piece | Cite | Live |
|---|---|---|
| Count | `world.js` 153–156, 387 | `min(2, traders/4)`. Freehold 2. hush/verge 0. |
| Route | `world.js` 142–151, 388–401 | Station hold → `jitter(field.center, 50)`. `fieldPoint` reads `def.field.center`. Comment: never a planet. |
| Live cut | `npc.js` 829–849, 951–1013 | `nearestSoftRock`: hardness ≤ 1, `ore > 0`, nearest by distance². Hold at `max(MINER_RANGE*0.62, radius+18)`. Emits `mineHit` with `asteroidId: rock.id`, `laserTier: 0`, `extractPerSec: MINER_EXTRACT_PER_SEC` (min 0.6, Mk I). Cargo cap 8. |
| Off-screen | `world.js` 192–200 | +1 `rawOre` / 5 s while not live. Does not decrement rocks. |
| Home | `npc.js` 933–948, 875–897 | Dock at station **hold**, not pad (wave 58). |

Miners never migrate and never hunt (`PROGRESS.md` 2879–2880).

---

## 7. Save / `systemLoaded` rebuild

| Fact | Cite |
|---|---|
| Per-system furniture rebuilds on `'systemLoaded' { to }` | `PROGRESS.md` 36; `asteroids.js` 1719–1725; `solarsystem.js` 321–326 |
| Teardown | `asteroids.js` 1664–1676: remove + dispose every per-ore mesh, then `build(SYSTEMS[to])`. |
| List replaced | `1652–1653`. Combat must not keep stale entries. Blocked-id throttle resets (PROGRESS 2567). |
| Cross-system restore emits `systemLoaded` | `save.js` 427–431: **only if** `currentSystem !== fromSystem`. |
| Same-system restore does **not** emit | `save.js` 400–401, 431. Live `rocks[]` keep depletion and positions. |
| Boot init order | `main.js` 78–127: `initAsteroids` **before** `initSave`. Boot restore into non-freehold emits `systemLoaded`. Boot restore into freehold does not. |
| `WORLD_FIELDS` | `save.js` 73–92. **No asteroid / field / ore-remaining key.** |
| Autosave key | `save.js` 63: `'rimward-save-v1'`. Berths `…-slot-1..3`. Settings is a different key. |
| Positions on disk | Player ship `[x,y,z]` + quaternion (`save.js` 421–423). Asteroid positions are **not** saved. |
| `world.time` | On `WORLD_FIELDS` (`save.js` 74). Used by events, miner timers, heat. Planets integrate `dt` (`solarsystem.js` 330–337), so they do **not** snap to `world.time`. |

**Depletion today does not survive leave / revisit.** A jump or cross-system restore rebuilds a full field from seed. Same-system restore (F5 / berth in the same system) keeps the live field in RAM only.

---

## 8. Navigation / career findability (today)

| Aid | Exists? | Cite |
|---|---|---|
| One local cluster near a known offset | Yes — the whole career | `asteroids.js` 1554–1561; authored centers above |
| Galaxy chart asteroid marks | **No** | `galaxychart.js` has no `field` / asteroid hits |
| HUD keeper chart marks | Mystery landmarks only | `hud.js` 24–27, 547, 1250–1257. Unrelated to rocks. |
| Landmarks | Authored away from field/station/gates | `authored-systems.js` 24–25, 56–58 |
| Scanner contacts arc | Ships, not rocks | HUD-02: scanner-gated hostiles |
| T-cycle in group 3 | Rocks inside 600 u | `controls.js` 66–71 |
| Arrival / POS belt cue | **No** | — |
| Miner traffic | 0–2 hulls flying station↔`field.center` | `world.js` 387–401 |

Mining is practical **because** the field is one clump. Spread without a find-aid breaks AST-02.

---

## 9. `ctx` ownership

`createCtx` does **not** allocate `ctx.asteroids` (`ctx.js` 37–228). `asteroids.js` writes `ctx.asteroids = { list }` (45–48, 1653).

Header law (`asteroids.js` 45–48): never touches `ctx.input`, `ctx.ship`, `ctx.camera`. Consumes `'mineHit'` / `'systemLoaded'`. Spawns pods.

Frozen events already include `mineHit` / `mineBlocked` / `systemLoaded` / `bodyHit` / `sunHeat` / `sunKill` (`ctx.js` 191–220).

`ctx.world.time` increments in world sim (persisted). `ctx.elapsed` is real seconds for visuals only (`ctx.js` 226).

---

## 10. Performance (live)

- Authored/generated count **25–140**. Freehold 130.
- One InstancedMesh per present ore (≤9). Geometry paid once per ore.
- `frustumCulled = false` because instances span the clump (`asteroids.js` 1531). A system-scale AABB would never cull.
- Zero per-frame allocations in the update path (header 50–54).
- Heat list cap 24 (`asteroids.js` 65, 63–64).
- Camera far plane 20000 (`main.js` 71).
- Tumble touches ~count/4 matrices per frame for the **whole** field.

---

## 11. Wishlist AST (not shipped)

`docs/PLAYER-EXPERIENCE-WISHLIST.md` 574–628. Status **CAPTURED**.

- AST-01: individual stellar orbits, belt/cloud, radius/inclination/phase, farther = slower, per-system flavour.
- AST-02: find-aid, no endless empty travel, NPC/mission reach, depletion sticks across motion / save / leave-revisit.

Regression risks named there: travel tax, frame cost, AI / collision lookahead / identity / missions, stations/gates, Oort-scale useless range.

---

## 12. `state.js` READ-ONLY

`src/game/state.js` is the tuning table. Feature workers do not rewrite it. Ore recipes, `MINING_LASERS`, `SYSTEMS` merge, `U.TARGET_RANGE` / `ENCOUNTER_BUBBLE` live there.

Belt params, if authored, belong on **existing** `SYSTEMS[id].field` records (`authored-systems.js` / generated emit), not a sibling `state.js` PR.
