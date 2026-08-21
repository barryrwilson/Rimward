## Security Review: Wave 83 station serials

### Risk Level: Low

### Summary
Standing writes, SKU grants, and Digit 9 restitution stay on allowlisted faction/SKU keys. Job ids reject reserved tokens. DOM uses `textContent` / existing `h()`.

### Findings
None at CRITICAL/HIGH.

#### 🟡 MEDIUM: WAVE80 pins still expect dest standing 0
**Location:** `scripts/boot-test.mjs` WAVE80 war `targetZero`
**Issue:** Owner Wave 82 dest −2 is live. WAVE80 was not rewritten.
**Impact:** Known WAVE80 WAR FAIL. WAVE83 pins the new law.
**Fix:** Later orchestrator pass if WAVE80 must stay green.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML`
- [x] No `job.faction` write source
- [x] `Object.hasOwn(FACTIONS, key)` on standing writes
- [x] Proto chain id `chain-__proto__-1` dropped
- [x] SKU grant from authored table + `canSeat` + `writeMountedGear` only
- [x] Restitution debit gated on dock, offended FACTIONS key, negative standing, credits
- [x] No `wanted` / `crimeScore` persist key
- [x] No new WORLD_FIELDS

### Recommendations
1. Keep WAVE83 STATION as the dest-standing pin.
