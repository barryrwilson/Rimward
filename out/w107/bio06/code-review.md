## Code Review: BIO-06 class-scaled living fin cadence (Wave 107)

Persona: reviewer + orchestrator `code-review.md`. Self-applied on the PR1–PR4 write-set.

### Summary

PR1–PR4 match the Wave 104 merge law. Light player Hz stays unscaled. Larger living remounts and Beautiful NPC swim use class Hz + sweep. No Blocker or Major.

### What's done well

- THREE-free `living-cadence.js` with frozen rows and `Object.hasOwn`.
- Player light path does not multiply by `1.00`.
- NPC speed-norm uses `classCruise` instead of a hard `120`.
- `uSwimAmp` stays the reducedMotion gate. `uSwimSweep` is a new float.
- Idle mixer still uses `setTime(elapsed)` only. No `mixer.timeScale`.
- `updateShipAsset` signature stays compatible with `npc.js`.
- WAVE107 boot pins all print true. Probe exits 0.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: NPC light still multiplies `hzScale`

**Location:** `src/systems/ship-assets.js` `updateShipAsset` `uSwimHz`.

**Issue:** Player honor skips the scale when the row is light. NPC applies `* cadence.hzScale` for every class, including light `1.00`. IEEE multiply by 1 is exact for these constants.

**Fix:** Optional skip when `cadence === LIVING_CADENCE.light`. Not required.

**Status:** documented; no change.

#### 💡 Suggestion: light identity uses object reference

**Location:** `src/systems/ship.js` `cadence !== LIVING_CADENCE.light`.

**Issue:** This is correct while `cadenceFor` returns the frozen row. A later clone of the row would scale light.

**Fix:** Keep returning the frozen row, or compare `cadenceFor` via a key helper.

**Status:** documented; no change.

#### 💡 Suggestion: comments name BIO-06

**Location:** `src/systems/ship.js` living-motion; `src/game/living-cadence.js` header.

**Issue:** Short why-comments. They cite the leftover id.

**Status:** leave; they document the light-honor constraint.

### Test coverage

- `out/w107/bio06/probe.mjs` — table + proto-safe miss.
- `scripts/boot-test.mjs` WAVE107 BIO-06 — ten contract pins.
- `npm run test:boot` still FAILs on older WAVE* sections. WAVE107 printed all true.

### Verdict

Approve for Wave 107 first impl.
