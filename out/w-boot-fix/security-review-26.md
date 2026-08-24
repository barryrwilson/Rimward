## Security Review: WAVE26 Census dock / job stamps

### Risk Level: Low

### Summary
Client-side berth and job-handle sync only. No network, auth, or secrets.

### Findings

#### 🟢 LOW: JOB_HANDLES Set retains job row objects
**Location:** `src/systems/station.js` (`JOB_HANDLES`)
**Issue:** Session Sets keep unique job objects so boot handles stay in sync after sanitize clones.
**Impact:** Tiny leak. Unique ferry/haul are two ids.
**Fix:** Optional WeakSet later.

### Passed Checks
- [x] No secrets
- [x] No innerHTML
- [x] Accept still requires a live berth
- [x] Unique-haul dest hold still skips extra trade/passenger pay (WAVE35)

### Recommendations
1. Keep job-handle writes keyed by job id.
