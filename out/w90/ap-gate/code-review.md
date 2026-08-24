## Code Review: w90 AP live jump-zone origin (re-dispatch)

### Summary
Self-applied checklist. Root cause of WAVE85 `liveMatch: false` was module `_liveAssemblies` stolen by later `initGate` throwaways; main `gate.update` rebuilt its closed-over list but lookup walked the throwaway. Rebuild now rebinds. WAVE88 `noOrbitCmd` was the same stale far-gate aim.

### What's done well
- No authored-ghost fallback restored.
- Physical `to` still beats hub.
- Zone origin is `a.x/y/z` (same as in-zone test).
- Probe covers steal → `systemLoaded` → Freehold coords → zone jump → no-orbit.

### Findings

None at Blocker/Major.

#### 💡 Suggestion: `update(dt, next)` ignores `next`
**Location:** `src/systems/gate.js` `function update(dt)`
**Issue:** Boot-test passes `ctx` as the second arg; the closure already holds that ctx. Pre-existing. Not this fail.

### Re-review
`npm run test:boot`: `wave85 nav ap path` all true including `liveMatch` and `zoneJump`; `wave88 ap path` `noOrbitCmd` true. Pre-existing `WAVE85 NAV GUIDANCE FAIL` (`hideJumping`, `markerRay`) unchanged.

### Verdict
Clean for verifier.
