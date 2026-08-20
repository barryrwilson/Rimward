# RIMWARD AST asteroid orbits

| Field | Value |
|---|---|
| **Title** | RIMWARD AST asteroid orbits and system-scale fields |
| **Author** | Wave 67 AST integrator |
| **Date** | 2026-08-19 |
| **Status** | Implemented. Wave 67 was markdown only. Wave 69 shipped PR1–PR5. |
| **Wave** | 67 — design. 69 — first impl. |
| **Owner request** | AST design brief. Do not ship orbit motion or `src/` in this wave. |
| **Merge law** | [`out/w67/ast/shared-contract.md`](../out/w67/ast/shared-contract.md). If this brief and that file conflict, the contract wins. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins) | [`out/w67/ast/current-asteroid-inventory.md`](../out/w67/ast/current-asteroid-inventory.md) |
| Merge law | [`out/w67/ast/shared-contract.md`](../out/w67/ast/shared-contract.md) |
| Security review | [`out/w67/ast/security-review.md`](../out/w67/ast/security-review.md) |
| Design-doc review | [`out/w67/ast/code-review.md`](../out/w67/ast/code-review.md) |

---

## Overview

Every system builds one **local cluster** of tumbling rocks around `SYSTEMS[id].field.center`. The clump is placed, not orbital. Wishlist AST still needs a belt or cloud on stellar paths, with mining left as a job a player can find and finish.

This brief is the integrator document for that later implementation wave. It freezes the `id === index` contract, a closed-form Kepler-lite model, per-system kinds derived from `band` (no 100 authored belts), keep-out vs sun/station/gate/planets, in-place position mutation so mineHit / PHY / miners keep working, sparse `fieldOre` persist, a work-sector find-aid, and a serial PR plan. Wave 67 lands this markdown only. Rocks do not move here.

HUD-02 chart marks and SHP stay closed. `src/game/state.js` stays READ-ONLY for feature workers.

---

## Background & Motivation

### Current state (inventory)

Source of truth for “asteroids today”: [`out/w67/ast/current-asteroid-inventory.md`](../out/w67/ast/current-asteroid-inventory.md). Code wins over stale comments.

| Surface | Today | Cite |
|---|---|---|
| Placement | Flattened torus around `field.center`, radius 80–160, count 25–140 | `asteroids.js` 1554–1561; authored `field` blocks |
| Identity | `list[i].id === i`; `{ id, position, radius, ore, commodity, oreKey, hardness }` | `asteroids.js` 1627–1635; `PROGRESS.md` 39–42 |
| Look | `ORE_TYPES[key].rock` only. No per-ore constants in `asteroids.js` | wave 52; `state.js` 322–474 |
| Motion | Tumble in place. No orbital advance | `asteroids.js` 1731–1743 |
| Mining | Ray-sphere vs live `position`. Hardness gate. `mineHit` / `mineBlocked` | `combat.js` 1054–1189 |
| PHY | Every rock is a sphere in `collectBodies` | `collision.js` 411–422 |
| Miners | 0–2; fly to `field.center`; cut hardness ≤ 1 | `world.js` 142–156, 387–401; `npc.js` 829–1013 |
| Persist | No field yield. Rebuild on `'systemLoaded'` refills every rock | `save.js` 73–92, 427–431 |
| Find-aid | The clump **is** the aid. Chart/mystery do not mark rocks | inventory §8 |

Sun sits at the origin (`ctx.js` 59; `solarsystem.js` 236). Freehold’s field center is ~515 u out, between planet slots 420 and 640 — a blob beside the star, not a ring around it.

### Pain points

- Wishlist AST-01: one stationary clump per system. It does not read as a belt or cloud.
- Wishlist AST-02: a naive uniform ring would turn mining into empty travel. Depletion already dies on leave/revisit.
- `mineHit.asteroidId` is an **index**. A new id scheme breaks combat, HUD, miners, and the blocked-id throttle.
- `list[i].position` is a shared `THREE.Vector3`. Replacing the list entry or the vector breaks T-cycle object identity (`controls.js` 78).
- Same-system restore does not emit `'systemLoaded'` (`save.js` 431). Motion that integrates `dt` will disagree with restored `world.time`.
- `state.js` cannot take a parallel belt-table rewrite. `field` already exists on every system record.

### Why now (design) / why not now (code)

The owner asked for the AST brief after PHY/AI leftover waves. Inventory and merge law exist. Implementation waits for a later serial wave so identity, persist, keep-out, and the mining career land against a frozen contract instead of a drive-by `position.add`.

---

## Goals & Non-Goals

### Goals

1. Document the live cluster and the `id === index` contract.
2. Freeze a simplified orbital model: radius, inclination, phase, slower when farther.
3. Freeze per-system kinds (`belt` / `sparse` / `cloud`) from `band` + optional `field.kind`, without 100 authored belts.
4. Keep mining targeting, combat hits, NPC miners, and collision lookahead correct on moving rocks.
5. Freeze save/load and `'systemLoaded'` rebuild, including depletion overlay.
6. Freeze a clear find-aid so mining is not empty travel.
7. Freeze a serial PR plan: data/seed → motion → mining/AI → HUD/nav → boot pins.
8. Name non-goals and wishlist regression risks.
9. This wave writes the brief. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No orbit motion, pooling, or `src/` in Wave 67.
- No full n-body, eccentricity, precession, or Lagrange points.
- No asteroid–asteroid collision as a feature. Rocks may pass through each other.
- No destroying, towing, or capturing planets or the sun.
- No unbounded Oort stream. Hard count cap 160.
- No casual break of `id === array index`. No UUID migration in the first implementation.
- No new `localStorage` key. No THREE on the save blob. No persisted positions if seed+time suffice.
- No HUD-02 identity work. No new keeper chart marks. No mystery landmark ids in the feature PRs.
- No SHP / POD / missiles / TGT-04.
- No `state.js` feature rewrite. No new `ORE_TYPES` / `MINING_LASERS` rows.
- No new frozen event type.
- Do not edit the wishlist or `PROGRESS.md` in this wave.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| New asteroid ids? | **No.** `id === i` stays | combat/HUD/miners dereference the index. Contract §1. |
| How does a rock move? | Mutate the existing `position` Vector3. Closed form from `world.time` | Object identity + restore clock. Contract §0.3–0.4. |
| Persist pose? | **No.** Seed + `world.time` | Freeze 10. Small saves. |
| Persist depletion? | **Yes.** Sparse `world.fieldOre` on `WORLD_FIELDS` | AST-02. Cannot be derived. Contract §6. |
| 100 authored belts? | **No.** Default kind from `band`. Reuse `field.center/radius/count` | `state.js` READ-ONLY. Contract §3. |
| Work density | ≥60% of rocks in ~80° sector around `field.center` azimuth | AST-02 travel tax. |
| Find-aid | `commLine` + group-3 context cue. Miners still mark the sector | Do not reopen HUD-02 / mystery. |
| Sun / station / gates | Generation keep-out + PHY net | PHY-01/03. |
| NPC miners | `fieldPoint` stays `field.center`. `nearestSoftRock` unchanged rules | Wave 57. |
| Performance | Count cap 160. Active tumble 1200 u. No Oort | Wishlist regression. |

---

### 2. Current cluster behavior and identity

See inventory §§1–2. The load-bearing loop is:

1. First RNG pass: `pickOreType(band, rng())` × count (`asteroids.js` 1506–1514).
2. One InstancedMesh per present ore, named `asteroid-field-<oreKey>`.
3. Second pass index `i` writes `rocks[i]` and `list[i]` with `id: i`.
4. Rebuild on `'systemLoaded'` disposes meshes and **replaces** `ctx.asteroids.list`.

**Implementation must not change step 1’s draw count or order.** Orbit elements replace the **five** placement draws (theta, radial frac, x jitter, y, z) so radius / colour / axis / spin / units stay on the same subsequent stream. If a kind needs more draws, take them **after** the existing rock literal’s last `rng()` (after `angle`, before push) so look stays stable.

`asteroidId` on `mineHit` / `mineBlocked` remains that index. HUD T-cycle holds the list entry object.

---

### 3. Orbital model

Circular Kepler-lite. Same `ORBIT_K = 1500` spirit as planets (`solarsystem.js` 263–266):

- `omega ∝ r^-1.5` — farther rocks move slower.
- `phase = phase0 + omega * ctx.world.time`.
- Inclination and node give a readable 3D sheet, not a razor ring, not a sphere.

Full basis and ranges: contract §2.

**Closed form, every update.** Do not copy planet `angle += omega * dt`. Planets desync from `world.time` on restore; AST must snap.

Tumble remains a local spin. It is not orbit.

`reducedMotion`: skip tumble and heat lerp (today). **Do not** freeze orbital phase — a frozen belt is a clump again. Pose still follows `world.time`.

---

### 4. Per-system distribution

Day one needs **three** looks, not 100 unique authored belts.

| Kind | Who gets it | Read |
|---|---|---|
| `belt` | band 0–1 default (Freehold, Veridian, Redmarch, most core generated) | Tight annulus, low inc, dense work sector |
| `sparse` | band 2 default (Hollow Reach) | Same ring, thinner, wider radial scatter |
| `cloud` | band 3–4 default (Hush, Verge) | Higher inc, still `R ± field.radius`, not an Oort |

`R = hypot(field.center[0], field.center[2])` with the sun at the origin. `field.radius` is the annulus half-width. `field.center` remains the **work-sector anchor** so miner routes (`world.js` 142–151) and the player find-aid share one point.

Optional later: `field.kind` on authored six (`authored-systems.js` only). Generated systems may omit it and take the band default inside `asteroids.js`.

Faction flavour without new tables: band already encodes rim hardness and count. Cloud + high `oreMult` is the Hollow/Verge tell. A later data PR may set Gilded `belt` vs Congregation `cloud` explicitly.

---

### 5. Mining, combat, miners, collision

**Player beam.** `updateMining` already raycasts the live list (`combat.js` 1054–1069). In-place xyz is enough. Hardness gate and event payloads do not change. `extractResist` stays in `asteroids.js`.

**Targeting.** Group 3 T-cycle uses `position.distanceToSquared` (`controls.js` 67–70). Range 600 u. A belt that puts the player in the work sector still offers many candidates. A player who flies the empty arc gets few — that is the career geography.

**Stale lock.** After `'systemLoaded'`, the old list entry is detached. PR3: `controls.js` nulls `ctx.targets.current` when it looks like a rock and is not in the new list. `asteroids.js` does not write `ctx.targets`.

**NPC miners.** `nearestSoftRock` already re-picks every tick (`npc.js` 964). Keep hardness ≤ 1 and `ore > 0`. As long as the work sector sits on `field.center`, the station↔field route still ends among soft rocks. If the sector is empty (all soft rocks depleted), today’s haul-home / `updateRoute` path already runs (`npc.js` 965–972).

Off-screen +1 rawOre / 5 s (`world.js` 192–200) does not decrement rocks. Leave it. Do not invent a ghost extract against `fieldOre` in the first slice.

**PHY.** `collectBodies` copies live positions (`collision.js` 411–422). First slice collects all rocks (N ≤ 160). NPC `applyAvoidBias` already treats asteroid spheres. Sun heat/lethal stay `sunZone` (player) + `appendSunBody` (NPC). Generation keep-out (contract §4) stops belts from being authored through the star, the D5 cylinder, gate torii, or planet **slot radii** (the whole torus — not the planet xyz at build time).

**Lead pip.** Mining lead stays hidden (`wSpeed === 0`). Do not add asteroid lead. Do not restyle HUD families.

---

### 6. Save / load / `systemLoaded`

```
jump / cross-system restore
  → 'systemLoaded' { to }
  → dispose meshes, new list, seed full ore, overlay fieldOre[to], pose at world.time

same-system restore
  → no 'systemLoaded' (save.js 431 — record-bank identity)
  → asteroids sees world.fieldOre identity change / saveRestored
  → overlay units onto existing rocks; pose = f(seed, world.time)
  → do not dispose if system+seed match
```

`fieldOre` shape, caps, and sanitize: contract §6. Positions stay off the blob. Apply with `min(seeded, persisted)` so a hand-edited remaining count cannot exceed the seed roll. Write the sparse index on every extracted unit, not only on deplete.

`world.time` is already on `WORLD_FIELDS`. It is the orbit clock. `sanitizeRestored` must heal a non-finite time to `0` so pose math cannot NaN.

New Game: `clearAutosave()` only (`save.js` KEY). No second asteroid store.

---

### 7. Navigation aid

Mining must stay a job, not a hike.

1. **Work sector** (≥60% of count within ~80° of `field.center` azimuth). This is the primary aid.
2. **Arrival `commLine`** on `'systemLoaded'`: one spare sentence that names the belt relative to the station. HUD already prints commLine via `textContent`.
3. **Context prompt** while weapon group is 3 and the player has no rock lock: `Mine · belt <n>u` toward the nearest work-sector rock or `field.center`. Existing prompt slot. No new glance row. No rail move.
4. **Follow the miners.** Their route endpoint stays `field.center`.

Not in AST: galaxy-chart rock icons, mystery chart marks, scanner-arc rocks, new landmark ids, new settings keys.

---

### 8. Serial PR plan

Matches contract §10.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 data/seed** | Orbit elements from existing `field`. Band default kind. Keep-out. `fieldOre` + sanitize. Pose at current `world.time` (static in a t=0 harness). Identity + RNG order pins | Visible slide, HUD copy |
| **PR2 motion** | Closed-form xyz each update. Active-set tumble. Zero alloc | New meshes, Oort LOD |
| **PR3 mining/AI** | Confirm mineHit ids, miner work-sector, drop stale rock lock | Outfitter / hardness table changes |
| **PR4 HUD/nav** | commLine + group-3 context cue | HUD-02 skins, mystery marks |
| **PR5 boot pins** | Harness: belt vs clump, depletion roundtrip, restore overlay, cap 160, sun miss | Wishlist / PROGRESS edits by feature workers (owner/orchestrator updates those) |

`state.js` stays untouched unless a later serial owner must land a tiny constant. Prefer locals in `asteroids.js`. Authored `field.kind` is a **data** commit on `authored-systems.js`, not bundled into a HUD PR.

Boot pins belong in `scripts/boot-test.mjs` in the implementation wave (not this worker).

---

### 9. Non-goals (expanded)

- n-body, moons of planets, shepherd rocks, resonances.
- Colliding asteroids, breakups, voxel mining, destructible meshes.
- Moving the sun or planets to make room (keep-out adjusts **rocks**).
- Per-rock InstancedMesh split, GPU compute, worker threads.
- Mission destination records keyed by asteroid UUID (no missions consume asteroid ids today; do not invent them).
- Changing `ctx.config.world.asteroidField` (dead default). Live data is `SYSTEMS[id].field`.

---

### 10. Regression risks (wishlist)

| Risk | Mitigation |
|---|---|
| Travel tax (AST-02) | Work sector ≥60%; context cue; miners as living tell; count not spread over Oort |
| Frame cost | Cap 160; tumble only inside 1200 u; closed-form trig; keep instancing |
| Mining AI | `fieldPoint` unchanged; `nearestSoftRock` still O(N) on ≤160; hardness ≤ 1 |
| Collision lookahead | Live `collectBodies`; keep-out so stations/gates/sun are not inside the ring |
| Save identity | `id === i` + sparse `fieldOre[i]`; no pose persist |
| Mission destinations | None exist for rocks. Do not add id-stable missions in AST |
| Fields ∩ stations/gates | Generation keep-out; PHY bounce remains |
| Oort-scale useless range | Cloud kind still uses `field.radius`; hard cap |
| `id` reuse after jump | Already true; `mineBlocked` throttle resets on `'systemLoaded'` |
| Same-system restore | Overlay `fieldOre` without requiring `systemLoaded` |
| Proto / tamper on persist | Contract §6.3; ore keys never on the blob |
| HUD-02 / SHP reopen | Explicit non-goals |

---

### 11. Ownership

| Object | Writer | Reader |
|---|---|---|
| `ctx.asteroids.list` | `asteroids.js` only | combat, hud, controls, reticle-aim, collision, npc |
| `rocks[i]` orbit scalars | `asteroids.js` (internal) | — |
| `ctx.world.fieldOre` | `asteroids.js` (on deplete); `save.js` restore/sanitize | `asteroids.js` build/overlay |
| `ctx.world.miningLaser` | station.js (unchanged) | combat, hud |
| `ctx.world.time` | world.js | asteroids pose; everyone else |
| `SYSTEMS[id].field` | data modules only | asteroids, world `fieldPoint` |
| `ctx.targets.current` | controls.js | combat, hud |
| `state.js` | serial data owner only | everyone; **feature PRs read-only** |

`asteroids.js` still must not touch `ctx.input`, `ctx.ship`, `ctx.camera`.

---

## Acceptance direction (implementation wave)

From the wishlist, made testable:

1. Enter Freehold (or any band-0 system): rocks occupy a wide annulus, not one 160 u clump.
2. Individual rocks advance on stable paths. No teleport, no identity swap, no `id` reshuffle.
3. Same `worldSeed` + same `world.time` → same xyz and same ore keys.
4. Mine a rock, jump out, jump back: that index is still depleted. Save/load the same.
5. No routine intersection with station cylinder, gate torus, or sun heat sphere at build time. PHY still bounces a ram.
6. A player can find the work sector from the arrival line or the group-3 prompt without opening the galaxy chart.
7. NPC miners still cut a hardness-1 rock near `field.center`.
8. Boot AST section PASS. Glance HUD geometry unchanged.

---

## Open owner questions

Defaults in the contract §12 stand unless the owner overrides.

1. Remaining units vs depleted-only bits on disk.
2. Whether authored six set `field.kind` in the first impl wave.
3. Stale rock-lock clear in `controls.js`.
4. Planet closed-form (out of scope; default no).
