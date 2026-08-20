## Code Review: src/systems/asteroids.js (Wave 69 PR2 motion)

### Summary
Closed-form Kepler-lite pose runs every update from `ctx.world.time` via existing `writeOrbitPose`. Position identity holds. Tumble stays round-robin with a 1200 u skip. Probe pins pass. No Blocker/Major defects.

### What's done well
- `phase = phase0 + omega * tOrbit`; no `omega * dt` on the orbital angle.
- Mutates `rock.position` in place; does not `new THREE.Vector3` per rock per frame; does not replace `list[i]`.
- Reuses `_mat4` / `_quat` / `_scale`.
- Depleted husks still get orbit pose; tumble still skips them.
- `reducedMotion` does not freeze orbit. Tumble is skipped (accessibility).
- Tumble LOD uses squared distance; no per-frame alloc.
- Same seed + same time → same xyz (probe). Build at t=0 then snap `world.time` to 100 matches a fresh build at 100.

### Findings

#### 🟡 Minor: Keep-out at t=0 vs live station/gate xyz
**Location:** `src/systems/asteroids.js:1857–1875`
**Issue:** Elements stay seed-only so restore-time snap works. Keep-out therefore cannot guarantee the *live* pose misses the D5 cylinder or gate torii. Radial sun/planet-slot tests still apply.
**Fix:** PHY net for this slice. Optional later: station/gate radial bands like planet slots.
**Status:** documented (MEDIUM/LOW; required for the closed-form pin)

#### 🟡 Minor: Full-field matrix compose every frame
**Location:** `src/systems/asteroids.js:1995–2012`
**Issue:** All rocks get `compose` + `setMatrixAt` each update (N ≤ 160). Contract §8 allows this as the cheap first slice. Far rocks do not keep a stale matrix.
**Fix:** None required. A later LOD may skip compose beyond 1200 u once a pin shows fill-rate pain.
**Status:** accepted

#### 💡 Suggestion: Tumble still uses `dt`; orbit does not
**Location:** `src/systems/asteroids.js:2028`
**Issue:** Spin is `angle += spin * dt * (n/chunk)`. That is visual tumble, not orbit. Restore will not snap tumble angle to `world.time`. Contract says tumble is not orbital motion.
**Fix:** None. Do not fold spin into `world.time` unless a later PR asks.
**Status:** accepted

### Re-review
Renamed the orbit clock to `tOrbit` so it does not shadow collapse `t`. Comments shortened. Probe still PASS. No Blocker/Major opened or left.

### Probe
`node --import ./scripts/with-css-stub.mjs out/w69/pr2/probe.mjs` → `PASS w69 pr2 pins true n=130`
