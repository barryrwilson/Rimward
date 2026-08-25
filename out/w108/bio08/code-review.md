## Code Review: BIO-08 Wave 108 gait first impl

### Summary
PR1–PR4 match merge law: THREE-free table, light CPU honor, Beautiful GPU floats on one program, WAVE108 pins after WAVE107. No Blocker or Major findings.

### What's done well
- `living-gait.js` mirrors `living-cadence.js` (freeze + hasOwn + identity returns).
- Player light vertex math stays on the unweighted spine/flap lines.
- GPU still multiplies flap by `uSwimSweep`; gait is four new uniforms.
- Ace flapY 0.12 / radial 1.00 and frigate radial 0.28 / kickZ 1.00 are in the table and pinned.
- aSwim bbox bake stays fail-closed (no unsafe wingness rewrite).
- Probe covers table, proto, and source contracts without Vite.

### Findings

None at Blocker/Major.

#### 🟡 Minor: Gait pulse amplitude is a deputize guess
**Location:** `src/systems/ship.js` pulse `0.04`; `src/systems/ship-assets.js` GLSL `0.04`
**Issue:** Mantle/radial scale is not in the freeze; only axis weights are. 4% may read quiet on ace.
**Fix:** Owner playtest retune. Do not park the serial.

#### 💡 Suggestion: Bake trail mass later
**Location:** `src/systems/ship-assets.js` aSwim bake
**Issue:** Contract allows optional +Z wingness bias. This wave skipped it (fail-closed).
**Fix:** Only if axis mix is not enough in a browser pass.

### Test coverage
- `out/w108/bio08/probe.mjs` exit 0.
- `npm run test:boot` WAVE108 keys all true. WAVE107 still all true.
- Pre-existing WAVE26 FAILs only. Not regressions.
