## Code Review: Wave 138 PR1 oreguide

### Summary
PR1 lands the required together-set: accepted mining key set, group-3 T-filter, named cue, fallback, never-throw. Cycle and cue share one helper. TGT-07, MATCH, lock card, and `mineBlocked` stay. Boot pins cover the deputize table.

### What's done well
- One helper used by `collectCycleCands` and `beltMineDist`.
- Filter-on only when a matching `ore > 0` rock still exists; true empty falls back to live belt/cycle.
- Matching rocks outside 600 u keep the filter on (no brine-ice fallback).
- Two-pass work-sector-then-list preserved and match-gated.
- Fail-closed reserved keys and unknown commodities.
- WAVE138 boot section restores jobs, list, ships, pose, dock, group, target.

### Findings

No Blocker or Major findings.

#### 🟡 Minor: `collectCycleCands` itself is not try-wrapped
**Location:** `src/systems/controls.js` ~125–167
**Issue:** `distanceToSquared` on a malformed rock could throw before `cycleTarget`'s catch.
**Fix:** Not required. Live rocks are Vector3. `cycleTarget` already catches. Helper match tests are try-wrapped.
**Status:** accepted — live path already relied on `cycleTarget` catch.

#### 💡 Suggestion: `beltMineDist` now returns `{ n, oreName }`
**Location:** `src/systems/hud.js` ~552
**Issue:** Return shape changed. Single caller updated.
**Fix:** None. Keep the object so the cue cannot name one ore and range another.
**Status:** accepted.

### Verdict
Approve for verifier. Partial merge not present.
