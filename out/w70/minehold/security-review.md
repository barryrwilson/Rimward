## Security Review: WAVE70 rock MATCH (`src/systems/ship.js`)

### Risk Level: Low

### Summary
Client flight code. MATCH samples a lock pose and eases ship velocity. No persist, no network, no new keys. NaN rock pose fails closed.

### Findings

No CRITICAL, HIGH, or MEDIUM issues.

#### 🟢 LOW: HUD MATCH lamp still requires a ship lock
**Location:** `src/systems/hud.js` (read-only; out of worker scope)
**Issue:** Lamp is `flags.matchSpeed && shipTgt`. `shipTgt` needs `target.state`. A rock lock has no `state`, so the lamp stays off while rock MATCH is armed.
**Impact:** Display only. Flag and flight path are correct.
**Fix:** Out of scope (do not edit `hud.js` unless required).

### Passed Checks
- [x] No secrets in code
- [x] No new persist keys / no localStorage writes in the MATCH path
- [x] `_lockVel` is module scratch (not saved, not on `ctx.world`)
- [x] No `input.throttle` writes
- [x] NaN / non-finite rock position: skip sample, do not arm, cancel MATCH
- [x] Instant velocity must be finite before it updates `_lockVel`
- [x] No `__proto__` / prototype assignment
- [x] Rock lock test does not invent fields on the list entry

### Recommendations
1. Keep MATCH velocity in ship.js scratch. Do not put it on the asteroid list or save blob.
2. HUD lamp for rock MATCH is a later HUD change if wanted.
