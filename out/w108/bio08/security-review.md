## Security Review: BIO-08 Wave 108 gait first impl

### Risk Level: Low

### Summary
Self-applied security-auditor checklist on PR1–PR4. No CRITICAL or HIGH findings. Gait is a visual constant. Lookup is proto-safe. Shader source stays authored GLSL.

### Findings

None.

### Passed Checks
- [x] `gaitFor` / `axesForGait` use `Object.hasOwn` on `classKey` and `gaitId`. Unknown / reserved / non-string classKey → light. Unknown gaitId → live mix `1,1,0,0`.
- [x] No `classKey` / `gaitId` interpolation into shader source (`injectSwim` has no `${`, no `classKey`, no `gaitId`).
- [x] `customProgramCacheKey` is one constant `rimward-beautiful-swim-gait`.
- [x] No new `WORLD_FIELDS` key. No `localStorage` gait key. No persist of `gaitId`.
- [x] `innerHTML` absent on `living-gait.js`, `ship.js`, `ship-assets.js`.
- [x] Digit 0 stays shipyard. Digit 8/9 stay launch / epics. No new Digit.
- [x] No secrets, no UU, no SKU, no toast, no new DOM.
- [x] `Math.random()` swim phase is the live visual offset (contract §5). Not a gait key. Not persisted.
- [x] Unknowables NPC still skip `makeSwimUniforms`.
- [x] `state.js` / `living-cadence.js` / `save.js` / `station.js` not written.

### Recommendations
1. Keep gait floats out of save blobs.
2. Do not later compile per-class shader strings from `classKey`.
