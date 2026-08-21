## UI Audit: Digit 2 Jobs spy cards (Wave 80 re-dispatch)

### Summary
Accepted spy cards name the home dock on every board. Offered origin cards may still say “here”. Missing quote on the reward line uses live origin pay. No `innerHTML`. No extra animation. [NO BROWSER COVERAGE].

### What's done well
- Digit 2 is still Jobs. Digit 0 is still shipyard.
- Offered: dest station name, origin dock, employer, live quote, remaining time, `Accept (n)`, reward `File intel from ${destName} here`.
- Accepted: reward `File intel from ${destName} at ${homeName}`. State `ACCEPTED — gather at ${destName} then file at ${homeName}` or `intel aboard — file at ${homeName}`.
- “here” is gone from accepted spy paths. Dest dock no longer tells the player to file at the gather station.
- Note line still credits the dock flag, not the target.
- `h()` sets `textContent`. No new motion.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** `src/systems/station.js` digit accept into `boardJobs`
**Issue:** Home board can exceed 9 cards. Mouse Accept still works.
**Fix:** Contract §12.2. Do not cut spy to one slot.

### Method
Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `renderJobs` spy branches after the copy fix.
