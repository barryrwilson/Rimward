## Code Review: live autopilot pathing (tangent rework)

### Summary
Detour waypoints are outside-tangents of keep+1u, so ship→aim closest approach is 159.4 on the owner sun case (keep 158.4). Multi-body walk is bounded and retries the other lateral sign. `sphereChordHit` uses the clamped segment (A inside, B inside, or closest on [0,1]). No Blocker/Major.

### What's done well
- Tangent uses `L = R * d / sqrt(d² − R²)` with `R = keep + 1`, not a 1.1× keep guess.
- Gate authored inside keep is still skipped (`gateClear < keep`).
- Far-side gates outside keep still detour.
- Greedy 20u replans stay outside keep (math-check min 159.46).
- `applyAvoidBias` restore tests the chord; if it cuts a keep, aim returns to the planned tangent.
- Close misaligned frigate/light still widen with throttle 0.

### Findings

#### 🟡 Minor: Planets are not keep-out bodies
**Location:** `src/game/ap-path.js` / `collectBodies`
**Issue:** Live planet meshes are not in `collectBodies`.
**Fix:** Out of scope (solarsystem.js).

#### 💡 Suggestion: Two-body walk uses sequential first-hit, not a combined offset
**Location:** `src/game/ap-path.js` `walkDetour`
**Issue:** Worst-case 8 iters + one sign flip. Two overlapping keeps can still fail-closed with a last waypoint.
**Fix:** Acceptable; collision remains the net.

### Verdict
Clean for this slice. `math-check.mjs` PASS. `probe.mjs` PASS.
