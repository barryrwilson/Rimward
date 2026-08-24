## UI Audit: WAVE26 station overlay (jobs / market / Digit2)

### Summary
Census market still files at the archive desk. Digit 2 from market opens the jobs board. Unique ferry/haul keep Accept when the contract is done so a new run can start.

### What's done well
- Digit 1 on market still arms Beautiful seed papers when visible.
- Arrows and Q/W/A/S still trade.
- Jobs Accept still uses `Accept (N)` and textContent.
- Confirm papers on gift/train is unchanged.

### Findings

#### 💡 Suggestion: Esc on market still cancels archive papers first
**Location:** level-2 Escape
**Issue:** One Esc cancels pending filing. A second Esc returns to services. Digit2 skips that extra Esc.
**Fix:** Keep two-step Esc for armed papers.

### Severity mapping
- No Blocker/Major UI issues
