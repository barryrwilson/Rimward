## Security Review: `src/systems/combat.js` hull-local shield ripple (Wave 111 PR1)

### Risk Level: Low

### Summary
PR1 reparents pooled shield rings. It does not read save blobs into materials, does not write DOM, and does not freeze the sim when the pool is busy. Fail-closed world-space copy holds on NaN host / missing helper.

### Findings

No CRITICAL or HIGH findings.

#### 🟢 LOW: Empty catch on parent / world copy
**Location:** `src/systems/combat.js` spawnRipple try/catch
**Issue:** Catch swallows add/copy errors.
**Impact:** A disposed host does not throw into the combat tick. The ring falls back to scene copy or stays skipped.
**Fix:** Keep. Contract fail-closed forbids throw-on-NaN-host.

### Passed Checks
- [x] No user shader / GLSL / `ShaderMaterial` / `onBeforeCompile` from save
- [x] No `innerHTML`
- [x] No `for-in` merge from a save blob into a sprite or material
- [x] No new `WORLD_FIELDS` key; ripples are scene pointers only
- [x] Busy `RIPPLE_POOL` skips a new ring; bolts still call `applyHit`
- [x] NaN / missing `worldHitToLocal` / non-finite pose → `position.copy(pos)`
- [x] No freeze-until-free-slot
- [x] No secrets, Digit theft, or UU
- [x] `state.js` not written

### Recommendations
1. Keep fail-closed world-space copy. Do not wait on a free slot.
2. Keep canvas ring atlas engine-authored at init.
