## Code Review: NAV-02 in-flight next-gate guidance (Wave 85)

### Summary

PR1–PR5 land as one slice. HUD reads NAV-01 `world.nav` (`path[1]`, bag `remaining`, allowlisted status). DOM is created once. The ring is a parked decorative group. Boot pins and `out/w85/guide/probe.mjs` cover the contract.

### What's done well

- Next hop is `path[1]` only. No hop cursor on the bag.
- Authored gate before hub (`nav-guidance.js` 59–83). One marker.
- Restore works without `systemLoaded` (re-read each HUD frame, `hud.js` 1505–1506).
- Transient `REROUTE` is session-only; `blocked` copy is `NO ROUTE`.
- `reducedMotion` zeros torus spin/scale (`nav-guidance.js` 180–182).
- Cue class `.rw-nav-gate-cue` is not the lock arrow or contacts pip.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: `lookAt` origin when a gate sits at `(0,0,0)`

**Location:** `src/systems/nav-guidance.js:177–179`  
**Issue:** `lookAt` the same point can yield a NaN quaternion. Authored gates are not at origin.  
**Fix:** Skip `lookAt` when the authored point is near zero, if a future system parks a ring there.

#### 🟡 Minor: `systemLoaded` / `navRoute` scanned on both `events` and `lastEvents`

**Location:** `src/systems/hud.js:1013–1025`, `1074`, `1097`  
**Issue:** The same hop can start `REROUTE` twice. The second pass is a no-op after `navLastNext` updates.  
**Fix:** Scan `ctx.events` only (HUD already runs last).

#### 💡 Suggestion: Slow spin when motion is allowed

**Location:** `src/systems/nav-guidance.js:183–185`  
**Issue:** First 3D PR may stay fully static. Current spin is ~0.35 rad/s and frozen under `reducedMotion`.  
**Fix:** Optional. Leave as-is; pin is `reducedMotion` static.

### Re-review

Designer Major on implicit `aria-atomic` from outer `role="status"` is fixed in `hud.js` (live child only). No Blocker/Major. WAVE85 persist+chart source files were not edited in this slice.
