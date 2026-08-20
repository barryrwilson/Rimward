## Security Review: src/systems/controls.js (Wave 69 PR3 stale rock lock)

### Risk Level: Low

### Summary
PR3 drops a detached asteroid lock from `ctx.targets.current`. It does not persist, parse user JSON, or write DOM. No HIGH or CRITICAL issues.

### Findings

No CRITICAL, HIGH, MEDIUM, or LOW findings.

### Passed Checks
- [x] No secrets in code
- [x] No new `localStorage` key
- [x] No `innerHTML` / string-to-DOM
- [x] No new frozen events
- [x] `lastEvents` is scanned by `type === 'systemLoaded'` only (internal emit, not restore JSON)
- [x] Rock vs ship uses `position` + absence of `object`/`state`; ship locks are not cleared
- [x] `asteroids.js` still does not write `ctx.targets`
- [x] `npc.js` / `combat.js` / `world.js` / `collision.js` not modified
- [x] List membership is identity `indexOf` (no user-supplied key onto `Object.prototype`)
- [x] Probe does not log credentials or write save blobs

### Recommendations
1. Keep `fieldOre` sanitize on save. This PR does not touch persist.
2. Do not let `asteroids.js` write `ctx.targets`.

### Re-review
First pass. No HIGH/CRITICAL to fix. No code change after this audit.
