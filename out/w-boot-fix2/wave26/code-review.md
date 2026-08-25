## Code Review: WAVE26 unique-four persist identity (`station.js` + WAVE26 pin)

### Summary
Unique four keep the persist row already in `world.jobs` across sanitize clones. Tracked handles get a field copy; prune no longer drops unique-four refs. Unique ferry dest-dock payout completes persist `ferry-consignment`. WAVE26 re-finds live ferry and haul after delivery ticks. Unique DONE hide and ferry re-offer are unchanged.

### What's done well
- Hide ≠ splice: persist unique four stay in `world.jobs`
- `w26ReofferFerry` still ferry-only
- `keepUniqueJobRows` no longer replaces persist with the first `JOB_HANDLES` object
- `completeJob` still prefers persist by unique id before `state = 'done'`, then `writeJobState` + remaining id matches
- WAVE26 delivery pins were not deleted; keys stay `ferryDone` / `haulDone`

### Findings

#### 💡 Suggestion: persist resolve is still duplicated
**Location:** `src/systems/station.js` unique haul/ferry `completeJob` calls and `completeJob` unique-four persist prefer
**Issue:** Delivery already passes `persistJobById`; `completeJob` looks up the same id again.
**Fix:** Keep. Two cheap scans; delivery must not complete a pruned clone if `completeJob` is later simplified.

#### 💡 Suggestion: WAVE26 re-find weakens pre-accept identity
**Location:** `scripts/boot-test.mjs` after delivery ticks
**Issue:** `ferryJob26` / `haulJob26` rebind to the live persist rows. A future array replace that leaves persist `accepted` would still fail the pin; a clone that stayed `accepted` would no longer fail it.
**Fix:** Keep. Product now mirrors persist onto unique-four handles and leaves those handles in `JOB_HANDLES`, so the pre-accept object should already read `done`. Re-find is the same belt as haul.

### Severity mapping
- No Blocker/Major. Suggestions documented; no further code change.
