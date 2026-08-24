## Code Review: WAVE26 ferry/haul cluster

### Summary
Census berth now holds. Digit2 from market opens jobs. Unique ferry/haul Accept and completeJob write every handle with that id. WAVE4/35/80/92/85 still pass.

### What's done well
- Dock runs before mesh animation.
- Berth pins `currentSystem` to `currentId` so a restore cannot silently move the world to Freehold.
- Ferry still pays at dest while unique haul is open (WAVE26). Extra dest payers stay held (WAVE35).

### Findings

#### 🟡 Minor: Job handle Set is extra machinery
**Location:** `src/systems/station.js` `JOB_HANDLES`
**Issue:** Needed because `sanitizeJobs` clones rows and the boot test keeps the old ref.
**Fix:** Keep until save.js can mutate unique jobs in place.

#### 💡 Suggestion: Digit 2-9 from market switch service
**Location:** station keydown market block
**Issue:** Census archive can eat Esc. Digit2 still reaches the jobs board.
**Fix:** None. This matches dock Digit hotkeys.

### Severity mapping
- No Blocker/Major on the WAVE26 path
