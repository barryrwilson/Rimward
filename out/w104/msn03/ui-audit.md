## UI Audit: Wave 104 PR1 Jobs pane unique DONE hide

### Summary

Board filter only. Digit 2 Jobs pane still uses the existing header, `h()` / `btn()`, and two menu levels. No memorial, no empty-state string, no HUD glance. No Blocker or Major findings.

### What's done well

- Unique DONE cards leave the Jobs list the same way chain DONE already left it
- Offered/accepted unique cards keep title, reward, ace hunt line, and Accept
- Header `JOBS BOARD — ${station} postings` unchanged (`station.js` 5015)
- Digit 2 still opens Jobs; Digit 0 still opens shipyard; Digit 8/9 stay launch / Standing
- No extra animation; `reducedMotion` untouched
- No invented “Completed contracts” copy

### Findings

None at Blocker/Major.

#### 💡 Suggestion: empty board after hide is still a silent forEach

**Location:** `src/systems/station.js:5032` (`boardJobs(...).forEach`)

**Issue:** If a dock ever has zero visible cards after unique hide, the pane still shows only the header. Contract forbids a new empty-state string unless playtest asks.

**Fix:** Do not add copy this wave.

#### 💡 Suggestion: uniqueRetry Accept is unreachable from the board

**Location:** `src/systems/station.js:5211–5214`

**Issue:** Haul/ferry DONE no longer paint Accept because the card is filtered. That is the deputize. WAVE26 still mutates to `offered` before Digit 2, so quote tests still see Accept.

**Fix:** Leave source. Do not add a memorial Accept or a DONE line.

### Keyboard / a11y

- Digit accept still requires `state === 'offered'`
- Mouse Accept still works for offered cards past index 8
- No new controls, no focus-trap change, no `innerHTML`

### Verdict

Jobs pane hide is playable. `[NO BROWSER COVERAGE]` this worker; static copy + probe replica.
