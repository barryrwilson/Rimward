## Code Review: AST orbits design (Wave 67)

### Summary

The brief matches waves 51–53 / 57–58 live contracts: `id === index`, list shape, hardness gate, instanced per-ore meshes, PHY collect, miner `field.center`. First-pass holes (dt-integrated orbits vs restore; persist without seed clamp; HUD-02 chart marks as a find-aid) are closed. Remaining notes are implementation cautions, not design blockers.

### What's done well

- Inventory cites `file:line` and states code wins.
- Identity freeze is explicit: no UUID migration, in-place Vector3, list replace only on `'systemLoaded'`.
- Closed-form `world.time` avoids the planet restore gap (`solarsystem.js` 330–337).
- Reuses `field.center/radius/count` so `state.js` stays READ-ONLY and miners keep `fieldPoint`.
- Work sector ≥60% actually answers AST-02 instead of a uniform ring.
- Keep-out tables PHY sun/station/gate and planet `SLOTS`.
- Serial PRs put sanitize + identity before visible motion.
- Non-goals name HUD-02, SHP, n-body, Oort, new events, new localStorage.

### Findings

#### 🔴 Blocker (resolved): `id` migration left as a maybe

**Location:** owner freeze 1; first draft temptation  
**Issue:** Combat (`combat.js` 1189), miners (`npc.js` 997), and `rocks[ev.asteroidId]` (`asteroids.js` 1779) require `id === index`. A “stable UUID later” footnote would leak into PR1.  
**Fix applied:** Contract §0.2 / §1.1 / §11: first implementation does **not** migrate ids. No UUID.

#### 🔴 Blocker (resolved): dt integration vs `save.js` 431

**Location:** planets `angle += omega * dt`; same-system restore skips `systemLoaded`  
**Issue:** Copying planet motion would desync pose from restored `world.time` and refill/miss rocks.  
**Fix applied:** Closed form `phase0 + omega * world.time`. Overlay `fieldOre` on same-system restore without a new event.

#### 🟠 Major (resolved): Depletion not on `WORLD_FIELDS`

**Location:** inventory §7; AST-02  
**Issue:** Today a jump rebuilds a full field. Motion without persist still loses yield.  
**Fix applied:** Sparse `fieldOre`, seed clamp, write on every extracted unit, sanitize in §6.

#### 🟠 Major (resolved): Uniform belt would kill the mining career

**Location:** wishlist AST-02; `field.radius` 80–160 around R≈500  
**Issue:** Circumference ~3200 u with 130 rocks is ~25 u spacing if uniform — still findable, but empty arcs + rim cloud would tax travel. Miners use one `field.center`.  
**Fix applied:** Work sector; `fieldPoint` unchanged; group-3 context cue; no mystery/chart reopen.

#### 🟠 Major (resolved): `frustumCulled = false` on a system-scale mesh

**Location:** `asteroids.js` 1531  
**Issue:** A belt AABB around the star never culls. Tumble of 130 far rocks is wasted, not fatal.  
**Fix applied:** Cap 160; tumble only inside 1200 u; first slice does not split meshes. Closed-form pose is cheap.

#### 🟡 Minor: RNG stream comment vs extra draws

**Location:** integrator §2  
**Issue:** Axis jitter already consumes a variable number of draws per ore (`asteroids.js` 1583–1594). Replacing exactly five placement draws is correct **only** if no draws are inserted before `radius`. Reviewers of PR1 must count `rng()` calls against a recorded baseline (Freehold seed 11, first 8 rocks’ oreKey+radius+units).  
**Fix:** PR1 boot pin those tuples. Do not “add inclination later” in the middle of the stream.

#### 🟡 Minor: `collectBodies` O(N) every player + NPC

**Location:** `collision.js` 411–422; `npc.js` 2154  
**Issue:** 160 spheres is fine. Skipping far rocks in a later slice must not allow tunneling at cruise 120 u/s with lookahead 40. Contract already says first slice collects all.  
**Fix:** none in design. Pin in PR5 if someone “optimizes” early.

#### 🟡 Minor: HUD comment “asteroids sit still”

**Location:** `hud.js` 961–962  
**Issue:** Slow orbit will produce a tiny lead estimate on a locked rock. Mining lead is already hidden (`wSpeed === 0`). Cannon group on a rock is unusual (T-cycle rocks only in group 3).  
**Fix:** Do not add asteroid lead. Optional one-line comment update in PR4. Not HUD-02.

#### 💡 Suggestion: Planet keep-out uses slots, not live planet xyz

**Location:** contract §4  
**Issue:** Planets **move** (`solarsystem.js` 330–337). A rock on r=420 will eventually share a radius with slot 2. Generation keep-out of a **band** around each slot radius avoids the whole torus, not a snapshot. Good. Do not keep-out against the planet’s current xyz at build (that hole rotates into the rock).  
**Fix:** Already specified as slot radii. PR1 pin: no rock with `|r - SLOTS[i].orbitRadius| < planetRadius+40`.

#### 💡 Suggestion: `ctx.config.world.asteroidField`

**Location:** `ctx.js` 63  
**Issue:** Dead default. Someone may “wire” it instead of `SYSTEMS[id].field`.  
**Fix:** Integrator §9 forbids using it. Leave the ctx default; do not write it every frame.

### Wave 51 / 52 / 53 checklist

| Contract | Design |
|---|---|
| `id === index`; list fields | Preserved §1 |
| `mineHit` / `mineBlocked` payloads | Unchanged §1.2 |
| `miningLaserFor` every frame; hardness gate | Unchanged §5 |
| `ORE_TYPES[key].rock` owns look; asteroids.js no per-ore constants | Unchanged. Orbit scalars are not look. |
| Per-ore InstancedMesh name + dispose on jump | Unchanged §2 / inventory |
| First-pass `pickOreType` draw order | Frozen; extra draws after existing stream |
| PHY `collectBodies` asteroid spheres | Stay §4 / §5 |
| Sun heat/lethal `PHY.SUN_*` | Keep-out uses heat radius; combat `sunZone` untouched |
| Station D5 / gate torus (53/58) | Keep-out + bounce |
| Miners hardness ≤ 1, `field.center` (57) | Frozen §5 / §0.9 |
| `state.js` recipes | READ-ONLY |
| `WORLD_FIELDS` allowlist | One new key, sanitized |
| HUD glance geometry / family | Untouched |
| `textContent` | Frozen |

### Residual (accepted)

- Off-screen miner +1 rawOre does not decrement `fieldOre`. Pre-existing. First slice leaves it.
- Planets still integrate `dt`. Out of scope (Q4 default no).
- `pickOreType` `for…in` stays until a serial owner rewrites it.

No open 🔴 / 🟠 after the persist clamp, time heal, work sector, and id freezes.

### Re-review (after blocker/major fixes)

Contract §1, §2, §4 (planet **slot** torii, not live xyz), §6, §10 PR1 pins, and integrator §§5–8 match waves 51–53 / 57–58. Residual 🟡 RNG-count pin and collectBodies O(N) are PR1/PR5 work, not design holes. **No `src/` diff.**
