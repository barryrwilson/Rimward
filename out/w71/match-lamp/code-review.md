## Code Review: src/systems/hud.js MATCH lamp (rock lock)

### Summary
The MATCH lamp now follows `flags.matchSpeed` for both a live ship target and a rock lock. Combat rail, MATCH physics, and flag ownership are unchanged. No blockers or majors.

### What's done well
- Lamp condition is a one-line OR: `shipTgt || isRockLock(target)`. Ship MATCH (TGT-02) still lights.
- Combat rail still uses `shipTgt` only, so rocks keep bracket/ore readout.
- `emitFamilyTick('mech', 'hudMechMatch', {})` still fires on the lamp rising edge, including rocks.
- Rock predicate matches `controls.js` `isRockLock` without importing that module.
- hud.js still only reads `ctx.flags.matchSpeed`.

### Findings

#### 🟡 Minor: Two rock-shape helpers in hud.js
**Location:** `src/systems/hud.js:345` (`isRockTarget`) and `src/systems/hud.js:350` (`isRockLock`)
**Issue:** `isRockTarget` is `position && !state`. `isRockLock` also requires `!object`. Both describe a rock lock.
**Fix (optional):** Leave as-is for this wave. MATCH must match ship.js/controls.js (`!object`). Mining prompt still uses `isRockTarget`. Merging them would change a different HUD path.
**Status:** accepted — one-line justification: do not widen the MATCH-only change into the mining-prompt predicate.

#### 💡 Suggestion: Call site sits after `shipTgt`, helper is module-level
**Location:** `src/systems/hud.js:350`, used at `src/systems/hud.js:1467`
**Issue:** Brief preferred a helper next to the `shipTgt` block. A module-level function avoids allocating a closure each frame.
**Fix (optional):** No change. `shipTgt` stays the combat-rail gate; MATCH reads it plus `isRockLock(target)`.
**Status:** accepted — module-level helper is the right place for a per-frame predicate.

### Acceptance trace
| Case | Expected | Code path |
| MATCH on + rock lock | lamp visible | `matchSpeed && isRockLock(target)` |
| MATCH on + live ship | lamp visible | `matchSpeed && shipTgt` |
| MATCH off or no target | lamp hidden | both sides of AND fail |
| Rock lock | no hull/shield rail | `tgtRail` still `!shipTgt` |

### Verdict
Approve. Ready for live verify (undock, WG3, T-lock rock, tap X).
