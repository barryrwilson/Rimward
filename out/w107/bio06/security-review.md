## Security Review: BIO-06 class-scaled living fin cadence (Wave 107)

Persona: security-auditor + orchestrator `security-review.md`. Self-applied on the PR1–PR4 write-set.

### Risk Level: Low

### Summary

Cadence is a live visual constant. Lookup uses `Object.hasOwn`. Unknown and reserved keys fall to light. Shader source stays authored GLSL with a float uniform. No persist key, no secrets, no DOM, no Digit. No CRITICAL or HIGH.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: `classKey` is still a save-facing string at the call site

**Location:** `src/systems/ship.js` living-motion (`cadenceFor(ctx.player?.classKey)`); `src/systems/ship-assets.js` `updateShipAsset` (`cadenceFor(object.userData.classKey)`).

**Issue:** Hangar already heals via `classKeyOf`. GPU stash is `canonicalClass`. A later caller that writes a raw user string onto `userData.classKey` still hits `cadenceFor`. That helper refuses proto / non-string and returns light. Existence tests never index `LIVING_CADENCE[userString]` first.

**Impact:** Visual Hz only. Not RCE. Not persist smash.

**Fix:** Keep `hasOwn` in `cadenceFor` / `classCruise`. Do not interpolate `classKey` into GLSL.

**Status:** mitigated in this serial.

#### 🟢 LOW: `Math.random()` swim phase remains live visual noise

**Location:** `src/systems/ship-assets.js` `buildShipAsset` swimPhase.

**Issue:** Contract forbids replacing this with a cryptographic RNG and forbids persisting the phase. Not a secret.

**Status:** documented; no change.

### Passed Checks

- [x] No secrets or credentials in the write-set
- [x] `cadenceFor` / `classCruise` use `Object.hasOwn`; unknown / `__proto__` / non-string → light / 120
- [x] No `for-in` merge from a save blob
- [x] No new `WORLD_FIELDS` key (`cadence` absent from the save list)
- [x] Shader: authored GLSL; `uSwimSweep` is a float; `classKey` is not concatenated into source
- [x] `customProgramCacheKey` is a module constant, not user text
- [x] No `innerHTML`
- [x] No new Digit, SKU, UU, or `ctx.emit`
- [x] `state.js` not edited
- [x] Probe covers proto-safe miss → light

### Recommendations

1. Keep `cadenceFor` as the only table gate.
2. Do not later fold `classKey` into `SWIM_PROGRAM_KEY`.
