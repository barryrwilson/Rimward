# AST asteroid orbits shared contract

**Wave:** 67. Design only. No orbit motion ships in this wave.  
**Status:** MERGE LAW for the integrator brief. If `docs/AstOrbitsDesign.md` and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md` or `PROGRESS.md`.  
**Locked sources:** wishlist Initiative AST (`docs/PLAYER-EXPERIENCE-WISHLIST.md` ~574–628); `src/systems/asteroids.js`; `src/systems/combat.js` mining; `src/systems/hud.js` asteroid bracket; `src/systems/controls.js` T-cycle; `src/game/reticle-aim.js`; `src/game/collision.js` `collectBodies`; `src/game/physics.js` `PHY`; `src/systems/npc.js` miners / avoid; `src/game/world.js` `fieldPoint` / `minerCountForCast`; `src/game/save.js` `WORLD_FIELDS` / `systemLoaded` emit rule; `src/core/ctx.js` ownership + frozen events; `src/game/state.js` `ORE_TYPES` / `MINING_LASERS` / `SYSTEMS` (READ-ONLY for feature workers); waves 51–53, 56–58.

Integrator rule: a later implementation wave obeys this file. Inventory cites live in `out/w67/ast/current-asteroid-inventory.md`. Code wins over stale comments.

---

## 0. Law in one page

1. Wave 67 is markdown only. Implementation is a later **serial** wave.
2. Keep `ctx.asteroids.list[i].id === i`. Do not invent UUIDs. Do not ship a serial id migration.
3. Mutate `position` **in place** (the live `THREE.Vector3` already shared by `rocks[i]` and `list[i]`). Do not replace list entries while combat / HUD / miners hold refs.
4. Same `worldSeed` → same population (count, ore keys, radii, orbit elements, starting phase). Evaluate pose from **`ctx.world.time`** (closed form). Do not integrate orbital angle with `dt`.
5. Depletion stays on index `i` across motion, save/load, and leave/revisit. Persist remaining units sparsely on `WORLD_FIELDS` as `fieldOre`. Never persist meshes, quaternions, or THREE objects.
6. No new `localStorage` key. Autosave stays `rimward-save-v1`.
7. Do not fly belts through the sun heat/lethal core, the station D5 cylinder, or gate torii. PHY-01/03 remain the safety net. Generation keep-out is mandatory.
8. Mining stays a practical career. ≥60% of a system's rocks sit in one **work sector** around `field.center`'s azimuth. Players get a clear find-aid (arrival line + context/POS cue). Do not reopen HUD-02 chart marks or mystery.
9. NPC miners still pick hardness ≤ 1, `ore > 0`, reachable rocks. `fieldPoint` stays `field.center` (work-sector anchor).
10. Count stays the live `field.count` (25–140). Hard cap 160. No unbounded Oort. Active visual set ≤ `ENCOUNTER_BUBBLE * 1.5` (1200 u).
11. `state.js` is READ-ONLY. Optional `field.kind` / belt numbers live on existing per-system `field` records (serial data PR) or default from `band` inside `asteroids.js`.
12. World strings use `textContent` (HUD) / existing `commLine` emit. No `innerHTML`.
13. Ore keys fail closed: only `Object.hasOwn(ORE_TYPES, key)`. Persist never stores `oreKey`. Do not use `for…in` on `ORE_TYPES` / `ORE_BAND_WEIGHTS` / `fieldOre` in new AST code (`pickOreType` today uses `for…in` — leave it until a serial owner rewrites it; do not copy the pattern).
14. Do not add a new frozen event. Rebuild still rides `'systemLoaded' { to }`. Same-system restore still does **not** emit it; asteroids must overlay `fieldOre` when the world blob changes.
15. `world.time` heals to `0` if not finite. Orbit pose uses that clock.

---

## 1. Identity (frozen)

### 1.1 List shape

Unchanged from wave 51:

```
ctx.asteroids.list[i] = {
  id,          // === i
  position,    // THREE.Vector3, same object as rocks[i].position
  radius,      // mining / PHY sphere
  ore,         // remaining units (number)
  commodity,   // ore key string
  oreKey,      // same key
  hardness,    // ORE_TYPES[oreKey].hardness
}
```

Allowed later **internal** fields on `rocks[i]` (not required on `list`): `orbitR`, `inc`, `node`, `phase0`, `omega`. Do not put THREE objects on `list` entries beyond the existing `position` Vector3.

Forbidden:

- `id !== i`
- UUID / `asteroidId` remap without a named serial migration + boot pins (rejected for first AST implementation)
- Replacing `ctx.asteroids.list` except on `'systemLoaded'` teardown (same as today)
- Cloning a new Vector3 onto `list[i].position` each frame (breaks HUD/controls object identity and allocates)

### 1.2 Events

Payloads stay:

| Event | Payload | Owner |
|---|---|---|
| `mineHit` | `{ asteroidId, point, laserTier, extractPerSec }` | combat.js (player), npc.js (miner) |
| `mineBlocked` | `{ asteroidId, oreKey, hardness, needs, line }` | combat.js |
| `systemLoaded` | `{ to }` | jump.js / save.js (cross-system only) |

`asteroidId` is the list index. `rocks[asteroidId]` / `list[asteroidId]` must be that rock.

Throttle: `mineBlocked` ≤ 1/s per id; reset on `'systemLoaded'` (ids reuse).

Do **not** add `'orbitsReady'`, `'fieldOreApplied'`, or `'saveRestored'` to `ctx.js` EVENTS.

---

## 2. Orbital model (simplified, frozen numbers)

Circular Kepler-lite, same family as planets (`solarsystem.js` 263–305).

```
omega = ORBIT_K * r ^ -1.5
ORBIT_K = 1500          // same constant as planets; inner r=250 → ~17 s/rev
position.x = r * cos(phase) * cos(node) - r * sin(phase) * cos(inc) * sin(node)
position.z = r * cos(phase) * sin(node) + r * sin(phase) * cos(inc) * cos(node)
position.y = r * sin(phase) * sin(inc) + y0
phase     = phase0 + omega * ctx.world.time
```

| Element | Range | Source |
|---|---|---|
| `r` | keep-out min … belt outer | seed draw inside the system's ring |
| `phase0` | `[0, 2π)` | seed |
| `inc` | belt: `±0.12 rad` typical; cloud: `±0.55` | seed + kind |
| `node` | `[0, 2π)` | seed |
| `y0` | small, from `field.center[1]` | seed |
| `omega` | derived; farther → slower | `r` |

No eccentricity, precession, n-body, or rock–rock gravity. Tumble (spin about `rock.axis`) stays the visual rotation and is **not** orbital motion.

**Closed form is load-bearing.** Restore writes `world.time`. Integrating `dt` would desync pose from the save clock (planets already have this gap; AST must not copy it).

Use `ctx.world.time`, never `ctx.elapsed`.

---

## 3. Per-system distribution (no 100 authored belts)

### 3.1 Default `kind` from band (code, not a `state.js` table)

| `def.band` | Default `kind` | Shape |
|---|---|---|
| 0, 1 | `belt` | Dense annulus. Work sector ≥60% of count. Inclination low. |
| 2 | `sparse` | Same annulus, fewer rocks, wider radial scatter. Work sector ≥60%. |
| 3, 4 | `cloud` | Thicker inclination, still bounded. Work sector ≥50% (rim scarcity, not empty). |

If `def.field.kind` is one of `belt|sparse|cloud`, use it. Anything else (missing, typo, `__proto__`) → band default.

### 3.2 Reuse live `field` numbers

Do not require new keys on day one.

| Existing | AST meaning |
|---|---|
| `field.center` | Work-sector **anchor** and mean belt radius `R = hypot(cx, cz)` (sun at origin). Miners still fly here (`world.js` `fieldPoint`). |
| `field.radius` | Radial half-width of the annulus (clump radius today). |
| `field.count` | Population. Unchanged. |
| `field.oreMult` | Units per rock. Unchanged. |

Belt inner/outer: `R ± field.radius`, then clamp through keep-out.

Authored flavour (serial **data** PR, not a feature `state.js` rewrite): optional `field.kind`, optional `field.workFrac` (default 0.60). Generated galaxy may omit both.

### 3.3 Work sector (AST-02)

Let `az0 = atan2(center.z, center.x)`.

Place `ceil(workFrac * count)` rocks with `phase0` in `az0 ± 0.7 rad` (~80°). Remaining rocks scatter over `[0, 2π)` for the look of a ring.

This is the career density. Do not scatter 130 rocks uniformly on a 3000 u circumference.

---

## 4. Keep-out (generation + PHY net)

At build, reject or bump `r` / `phase0` until **all** hold (pad = rock radius + 20 u):

| Body | Rule | Cite |
|---|---|---|
| Sun heat / lethal | `r >= sunRadius * PHY.SUN_HEAT_MULT + pad` | `physics.js` 15–16; `collision.js` `sunZone` |
| Station cylinder | Rock sphere disjoint from r=32, y −26…33, + pad | `PHY.STATION_CYL_*` |
| Gates + hub | Disjoint from torus `GATE_BORE`/`GATE_TUBE` + pad | wave 58 |
| Planet slots | Avoid the **whole torus**: `|r - SLOTS[i].orbitRadius| < planetRadius + 40` when `i < planetCount`. Do not keep-out against the planet’s xyz at build time (that hole rotates). | `solarsystem.js` 170–206 |

Finite retries (e.g. 8). If still intersecting, push `r` outward (never inward through the sun).

PHY player bounce + NPC avoid stay. Do not remove asteroid spheres from `collectBodies`.

Rocks may pass each other. Rock–rock collision is **not** a feature (non-goal).

---

## 5. Moving targets (consumers)

All of these already read **live** `list[i].position` each frame. Motion that mutates that Vector3 in place keeps them correct:

| Consumer | File |
|---|---|
| Mining ray | `combat.js` 1054–1069 |
| Reticle aim | `reticle-aim.js` 47–54 |
| T-cycle | `controls.js` 67–70 |
| HUD bracket / dist | `hud.js` 933–934, 1488 |
| PHY collect | `collision.js` 411–422 |
| NPC avoid | `npc.js` 2154–2155 + probe |
| NPC miner | `npc.js` `nearestSoftRock` 829–849 |

Rules:

- Update orbit pose **before** combat/HUD in the same frame, or accept one-frame lag equal to today's tumble chunking. Prefer: asteroids `update` runs in current `main.js` order (asteroids inited before combat; update order follows the systems array). Do not reorder `main.js` unless a pin proves combat raycasts a stale pose.
- Active-set LOD may skip **tumble** for far rocks. It may **not** skip orbit pose for rocks inside `TARGET_RANGE` (600) of the player, a live miner, or the work-sector anchor if a miner is en route.
- `collectBodies` may skip rocks farther than `AVOID_LOOKAHEAD + 80` from player and every live NPC only if a pin shows no tunneling. First slice: keep collecting all rocks (count ≤ 160). Cheap.

HUD lead: mining already hides lead (`wSpeed === 0`). Do not invent asteroid lead. Comment “asteroids sit still” becomes false; no HUD-02 work.

Stale lock after `'systemLoaded'`: list is a new array. `controls.js` identity `===` fails; T-cycle replaces. Acceptable. Optionally clear `ctx.targets.current` when it is a rock and `systemLoaded` fired (asteroids.js must not write `ctx.targets` — **controls or hud** may). Prefer controls: if current is a rock (`!object && position`) and list no longer includes it, null it. Tiny, serial.

---

## 6. Persist: `fieldOre`

### 6.1 Why a world field

Orbits derive from seed + `world.time` → **no** pose on disk.

Remaining `ore` cannot be derived. Leave/revisit today **refills** the field (inventory §7). AST-02 forbids that.

### 6.2 Shape

Add **one** key to `WORLD_FIELDS`: `'fieldOre'`.

```js
// ctx.world.fieldOre — sparse remaining units, JSON-plain
// { [systemId]: { [indexString]: remainingInt } }
```

Only store rocks whose remaining units **differ** from the seeded full amount. Missing system → full field. Missing index → seeded amount.

On apply (build or same-system overlay):

```
seeded = rocks[i].ore as rolled at build
persisted = fieldOre[sys][i]   // may be missing
rocks[i].ore = list[i].ore = persisted == null ? seeded : min(seeded, max(0, persisted))
```

Never raise a rock above its seed. A hand-edited `64` cannot mint wakeglass.

Write `fieldOre[sys][i]` whenever remaining units **change** (each extracted unit), not only on full deplete. Delete the index when it returns to seeded (it will not, in normal play). Delete the system key when it has no indices.

Caps after sanitize:

- At most **32** system keys (LRU: drop the oldest unvisited if over; or drop any not in `recordBanks`). Prefer: keep systems that exist on `ctx.world.recordBanks` plus `currentSystem`.
- Per system: at most `field.count` entries.
- `remainingInt` integer `0..64` (seeded max is `ceil(12 * oreMult * unitsMult)` ≤ ~42 at oreMult 3.5).

### 6.3 Sanitize (fail closed)

On restore, in `sanitizeRestored` (or a helper it calls):

1. If `fieldOre` is missing / not a plain object / isArray → `delete ctx.world.fieldOre`.
2. Walk keys with `Object.keys` only (never `for…in`).
3. Drop key if `RESERVED_IDS.has(k)` or `k === '__proto__'` or `!Object.hasOwn(SYSTEMS, k)`.
4. Child must be a plain object, not array.
5. Child keys: decimal integer strings `0..field.count-1` (unknown system count: use 160 as absolute max).
6. Values: finite integer `0..64`. Else drop that index.
7. Do not restore `oreKey`, positions, or extra child fields.
8. `ctx.world.time`: if not a finite number ≥ 0, heal to `0`. JSON `null` / `NaN` must not reach `sin`/`cos` (NaN xyz). This heal is AST-load-bearing even though `world.time` already persists.

Prototype pollution: walk with `Object.keys` only. Write a fresh `{}` (or `Object.create(null)` then copy onto a plain object) with only healed keys. Never `for…in`. Never assign user keys onto `Object.prototype`.

### 6.4 Apply

On `build()` / `'systemLoaded'`: after seeding full `ore`, overlay `fieldOre[currentSystem][i]`.

On same-system restore (no `systemLoaded`): asteroids `update` compares a local token (`lastOreRef !== ctx.world.fieldOre` or `flags.saveRestored && !appliedThisRestore`). Re-apply overlay onto existing `rocks`/`list` **without** disposing meshes if seed+system match. If `currentSystem` or seed would disagree, wait for `systemLoaded`.

Do not write THREE to the blob. Do not store `position`.

`freshStart` / New Game: `clearAutosave` only. Live `fieldOre` dies with the world object rebuild — no extra key.

---

## 7. Navigation aid (AST-02)

Must-ship in the HUD/nav PR (not HUD-02 skins, not mystery):

1. **Arrival / systemLoaded commLine** (existing `commLine` channel): one line naming the work sector bearing, e.g. `Belt lies 520 u sun-relative, off the station's port.` Copy is authored spare. `textContent` via HUD toast path already used for commLine.
2. **Context prompt** when weapon group is 3 and no rock lock: `Mine · belt 340u` with distance to nearest work-sector rock or to `field.center`. Uses existing context slot (Dock / Jump / Hail / Target). Do not add a glance instrument. Do not move rails.
3. **Living tell:** miners still fly to `field.center`. Players can follow them.

Forbidden as AST:

- New keeper chart marks (`hud.js` mystery.charted)
- New landmark / clue ids in a feature PR
- Galaxy-chart asteroid icons
- Scanner contacts-arc rocks (TGT-03 is ships)
- New `settings.js` key

---

## 8. Performance

| Limit | Value |
|---|---|
| `field.count` | authored/generated as live; hard clamp **160** at build |
| Active visual/tumble radius | 1200 u from player (`1.5 * U.ENCOUNTER_BUBBLE`) |
| Orbit pose update | all rocks **or** all within 1200 u + every rock a live miner is cutting; first slice may update all 160 closed-form (cheap trig) |
| Tumble | only active set, same ~1/4 chunk rule |
| Meshes | still one InstancedMesh per present ore; no per-rock Mesh |
| Far rocks | leave last matrix; do not allocate Points LOD in first slice |
| `frustumCulled` | may stay false; do not split meshes in first slice unless a pin shows fill-rate pain |

No “Oort” radius. Cloud kind still uses `R ± field.radius` with higher `inc`, not 10× scale.

---

## 9. `ctx` / `state.js` / strings

- `asteroids.js` remains the only writer of `ctx.asteroids`.
- Do not write `ctx.input`, `ctx.ship`, `ctx.camera`, `ctx.targets` (exception: serial one-liner in **controls.js** to drop a detached rock lock).
- `state.js` READ-ONLY. No new `ORE_TYPES` rows. No `ASTEROID_ORBIT` table unless a later serial owner lands a tiny constant block; prefer module constants in `asteroids.js` (`ORBIT_K = 1500` reused as a local const, not imported from solarsystem).
- Authored `field.kind`: `authored-systems.js` only, serial data PR.
- World strings: `textContent` / existing emit. No `innerHTML`.

---

## 10. Serial PR plan (implementation wave)

| PR | Scope | Pins |
|---|---|---|
| **PR1 data/seed** | Generate orbit elements from existing `field` + band default kind. Place at `t = world.time` (static if time frozen in harness). Keep-out. `id === i`. Ore first-pass RNG **unchanged** (replace the five placement draws only). Overlay `fieldOre` + sanitize + `world.time` heal. Still no visible slide if time is 0. | Boot: count, mix, `id===i`, Freehold seed 11 first-8 `(oreKey,radius,ore)` tuples, keep-out vs sun/station/gate/planet **slots**, sanitize `__proto__` / `time:null` / remaining 99. |
| **PR2 motion** | Closed-form pose each update from `world.time`. Active-set tumble. Zero per-frame alloc. | Same seed+time → same xyz. Restore time snap. No NaN. |
| **PR3 mining/AI** | Confirm mineHit ids, hardness gate, NPC `nearestSoftRock` in the work sector, `fieldPoint` unchanged, collision collect. Drop stale rock lock in controls. | WAVE51 mining pins + WAVE57 miner cut still green. |
| **PR4 HUD/nav** | commLine + group-3 context cue. No mystery/chart. | textContent; no new settings; HUD glance geometry untouched. |
| **PR5 boot pins** | Harness: belt occupancy vs clump, depletion roundtrip leave/revisit, same-system restore overlay, perf count cap, PHY sun miss. | `npm run test:boot` AST section PASS. |

Do not land PR2 without PR1 keep-out + identity. Do not land PR2 without PR1 `fieldOre` sanitize if PR2 ships leave/revisit in the same cut.

---

## 11. Non-goals (locked)

- Full n-body, Lagrange, resonances, Yarkovsky.
- Asteroid–asteroid collision as gameplay (no bouncing rocks, no chaining).
- Destroying or capturing planets / sun.
- Unbounded Oort / infinite instance stream.
- Changing `MINING_LASERS` / `ORE_TYPES` look recipes.
- New `localStorage` key.
- HUD-02 family work, SHP, POD, missiles, TGT-04.
- `state.js` sibling rewrite.
- New frozen events.
- Persisting `position` or THREE.
- Casual `id` migration.

---

## 12. Owner questions (do not block first slice)

These are recorded for the orchestrator. First slice proceeds with the **defaults** below unless the owner overrides.

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | Persist remaining units or only `depleted` bits? | Remaining units sparse (`fieldOre`). |
| Q2 | May authored six set `field.kind` in the same impl wave? | Yes, serial data PR on `authored-systems.js` only. Generated may stay implicit. |
| Q3 | Clear rock lock on `systemLoaded` in controls.js? | Yes, tiny serial in PR3. |
| Q4 | Update planet pose to closed-form too? | **No.** Out of AST scope. |
