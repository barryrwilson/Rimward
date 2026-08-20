## Code Review: WAVE70 rock MATCH (`src/systems/ship.js`)

### Summary
Rock MATCH eases toward sampled world velocity plus rest-frame command. Ship MATCH still uses scalar `lockSpeed` along the nose. Probe proves a sideways slide hold vs ship TGT-02.

### What's done well
- Same `vdt` cap (0.1) and gain `min(1, vdt * 8)` as the ship lockSpeed filter.
- `flags.matchSpeed` stays in ship.js. No `input.throttle` write.
- Chase-turn `* 1.22` still gated on `liveLock` (ships only).
- Zero extra per-frame alloc (`_lockVel` module scratch).
- Low-throttle damping skipped only while rock MATCH is on, so the hold does not bleed to world rest.
- Probe: rock slide → `v ≈ (48, 0, 0)`; ship lock → `v ≈ (0, 0, -48)`.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: MATCH lamp ignores rock locks
**Location:** `src/systems/hud.js:1462`
**Issue:** `matchOn = !!(ctx.flags.matchSpeed && shipTgt)` and `shipTgt` needs `target.state`.
**Fix:** Out of scope. Report only.

#### 💡 Suggestion: duplicated rock-lock test
**Location:** `src/systems/ship.js` MATCH block vs `controls.js` `isRockLock`
**Issue:** Same predicate copied so ship.js does not import controls.
**Fix:** Leave as-is. A shared helper would be a new export outside this leftover.

### Recheck
Probe re-run after review: PASS `rockV=48.0,0.0 shipV=0.0,-47.6`. No HIGH/CRITICAL to fix.
