## Code Review: Wave 83 station serials

### Summary
Spy expose, war dest standing, restitution desk, and authored chains land against owner Wave 82 numbers and MSN-03 merge law. Sanitize grows by `CHAIN_ROOM` 7 only.

### What's done well
- Named constants `SPY_EXPOSE_DELTA`, `WAR_TARGET_DELTA`, `RESTITUTION_UU`, `CHAIN_ROOM`
- Employer/target from `SYSTEMS[id].faction`, live dest bind for war
- Chain 12-id allowlist + origin table in `save.js`
- Last-step SKU only when `canSeat`

### Findings

#### 🟡 Minor: WAVE80 `targetZero` is now stale
**Location:** `scripts/boot-test.mjs` WAVE80 war
**Issue:** Runtime pin expects Veridian/Red Ledger unchanged on war success.
**Fix:** Leave WAVE80; WAVE83 pins dest −2.

### Passed
- Unique four + family ids kept
- Proto chain dropped
- Done chain hidden on the board
- Step-1 standing gate Known+
- No 600 s chain deadline
