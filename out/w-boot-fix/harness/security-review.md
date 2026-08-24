## Security Review: scripts/boot-test.mjs (stale harness pins)

### Risk Level: Low

### Summary
Changes are test-only pins in `scripts/boot-test.mjs`. No product hail, hangar, or state code changed. No secrets, auth, or network surfaces.

### Findings

None at CRITICAL or HIGH.

#### 🟢 LOW: Test pokes `jumpGraceUntil`

**Location:** `scripts/boot-test.mjs` WAVE30 / WAVE31 / WAVE35b wait loops
**Issue:** The harness writes `ctx.world.jumpGraceUntil = 0` after a 300-tick wait.
**Impact:** None in production. The poke is TEST SETUP, same pattern as WAVE32.
**Fix:** None. Keep the one-line comment that live grace is 60 s.

### Passed Checks
- [x] No secrets in code
- [x] No product hail.js / npc.js / state.js writes
- [x] No injection vectors (harness literals only)
- [x] No auth, session, or crypto changes
- [x] Logs print pin JSON, not credentials

### Recommendations
1. Keep jump-grace pokes inside the boot harness. Do not copy them into live jump.js.
