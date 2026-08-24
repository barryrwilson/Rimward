## Code Review: Wave 104 PR1 `boardJobs` unique DONE hide

### Summary

The skip matches the merge-law snippet and sits next to the live chain skip. Persist, uniqueRetry source, and Digit map are untouched. No Blocker or Major findings.

### What's done well

- Exact four id literals; no shared helper import (save.js remains forbidden this wave)
- One-line comment states why hide ≠ splice
- Chain `done` skip stays first; unique skip is additive
- Probe covers source adjacency, persist no-splice, Digit 2/0, `innerHTML`, UNIQUE map, WORLD_FIELDS, and a replica board for offered/accepted vs done

### Findings

None at Blocker/Major.

#### 💡 Suggestion: uniqueRetry source is now dead for hidden cards

**Location:** `src/systems/station.js:5211–5214`, `4692`

**Issue:** Haul/ferry DONE Accept still compiles. After hide, those cards do not reach `renderJobs`. Deputize and contract require leaving this leftover in place (WAVE26 offered-path).

**Fix:** Do not rewrite this wave. Owner may restore retry after playtest.

#### 💡 Suggestion: skip list is duplicated vs UNIQUE_JOB_KIND

**Location:** `src/systems/station.js:3618–3621` vs `src/game/save.js:152–157`

**Issue:** Four strings must stay in lockstep with the unique map.

**Fix:** Optional later `export function uniqueJobId` with `Object.hasOwn` only. Forbidden this wave.

### Verdict

Approve PR1 hide. Probe `node out/w104/msn03/probe.mjs` PASS.
