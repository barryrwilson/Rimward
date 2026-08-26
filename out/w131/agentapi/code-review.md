## Code Review: Agent API PR2 command intents (iter 2)

### Summary
Desk helpers now return `{ ok, notice }` from live boolean results. `act` no longer reports success when `tryTrade` / `acceptJob` / repair / feed refuse. WAVE131 pins cover the verifier repros.

### What's done well
- Root cause is the live return value, not a one-line `ok` flip.
- Human buttons ignore the new booleans.
- `acceptJob` success is only the `state = 'accepted'` path.
- Missing posting still sets `That posting is not valid.` without mutating a stub job.

### Findings

None at Blocker/Major.

#### 💡 Suggestion: `repairOnMkt` now runs after jobs is open
**Location:** `scripts/boot-test.mjs` WAVE131
**Issue:** Service mismatch still refuses (`jobs` !== `repair`). Pin stays true.
**Status:** open — still fail-closed; order is fine.

### Passed
- trade / acceptJob / repairAll / feed all use `afterDesk`
- Boot pins: tradeNoUu, acceptMissingJob, repairRefuse, feedRefuse
- WAVE127 unknown probe still `notACommand`
- UI audit: not applicable (no UI)
