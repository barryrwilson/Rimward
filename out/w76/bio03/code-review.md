## Code Review: BIO-03 Wave 76 NPC GPU swim

### Summary
Per-instance swim uniforms fix the shared 0.7 Hz fleet flap. Player CPU path is untouched. Old `animateShipMesh` arity still idles.

### What's done well

- Cloned Beautiful materials bind one uniform trio per instance; LOD adds reuse the same objects.
- Hz lerp matches player idle 0.5 / cruise 2.3 without a CPU vertex loop.
- Omit-speed and disabled hulls map to idle Hz.
- `reducedMotion` still zeros amp; mixer still freezes.
- Canonical faction/class path join unchanged.

### Findings

#### 🟡 Minor: Cloned materials are not disposed on release
**Location:** `src/systems/ship-assets.js:90-107`, `448-455`
**Issue:** Each Beautiful instance clones six materials per LOD. `releaseShipAsset` does not `dispose()` those clones. Textures stay shared (safe). GPU programs can linger until GC.
**Fix:** Track clones on `userData` and dispose on release. Not required for this slice; original shared materials were never disposed.

#### 💡 Suggestion: `time * hz` phase pops when speed changes
**Location:** `src/systems/ship-assets.js:68`, `470`
**Issue:** Shader phase is `elapsed * 2π * uSwimHz`. A sudden Hz jump discontinuities the wave. Player CPU integrates `swimPhase += dt * 2π * hz`.
**Fix:** Optional later: accumulate cycles on `userData` (still non-persisted) and pass that as `uSwimTime`.

#### 💡 Suggestion: Cruise speed 120 is a literal
**Location:** `src/systems/ship-assets.js:48`
**Issue:** Matches `SHIP_CLASSES.light.cruise` without importing `state.js` (BIO-03 must not edit `state.js`; ship-assets should not grow that coupling).
**Fix:** Leave the literal. Frigate cruise 22 stays near idle Hz, which reads as a large hull.

### Verdict

No blocker or major. Player preserve holds. Shared-uniform regression is addressed.
