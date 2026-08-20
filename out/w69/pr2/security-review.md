## Security Review: src/systems/asteroids.js (Wave 69 PR2 motion)

### Risk Level: Low

### Summary
PR2 only advances live rock xyz from `ctx.world.time` and LOD-skips tumble. It does not add persist keys, frozen events, `for…in`, or new `fieldOre` writers. No HIGH or CRITICAL issues.

### Findings

#### 🟡 MEDIUM: Keep-out tests a t=0 pose, not the live spawn pose
**Location:** `src/systems/asteroids.js:1857–1875`
**Issue:** Generation keep-out writes a t=0 pose, then `writeOrbitPose(..., tNow)` places the rock at the live clock. Same seed must yield the same orbit elements at any build time (PR2 closed-form pin). A load or jump at large `world.time` can therefore spawn a rock through the station cylinder or a gate torus.
**Impact:** PHY still collects asteroid spheres and bounces the player/NPC. Not a persist or XSS issue. A ram at spawn is possible until PHY runs.
**Fix:** Out of this PR’s closed-form pin. Later: keep-out a radial band around the station/gate heliocentric r, or accept PHY as the net (contract §4).
**Status:** documented, not fixed (gameplay/PHY; not a trust-boundary bug)

### Passed Checks
- [x] No secrets in code
- [x] No new `localStorage` key
- [x] No `innerHTML` / string-to-DOM
- [x] No new frozen events
- [x] No `for…in` on `ORE_TYPES` / `fieldOre` / `ORE_BAND_WEIGHTS`
- [x] `writeFieldOre` / `overlayFieldOre` still use `Object.hasOwn` and string indices
- [x] No THREE or pose written to the world blob
- [x] `ctx.ship` / `ctx.input` / `ctx.camera` / `ctx.targets` are not written (ship pose is read-only for tumble LOD)
- [x] Non-finite `world.time` is not written; pose uses a local finite clock so xyz cannot NaN from `null` time
- [x] List identity: in-place Vector3 mutate, no `list[i]` replace

### Recommendations
1. Leave `fieldOre` sanitize on PR1/save. Do not copy `for…in`.
2. PHY-01/03 remain the live net for a rock that crosses the station after t=0 keep-out.

### Re-review
After the tOrbit rename and comment trim: no new trust-boundary changes. Still no HIGH/CRITICAL.
