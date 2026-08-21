## Code Review: MSN-02 hunt jobs (Wave 78)

### Summary
Hunt copies mining/trade slot, sanitize, tick, and replace shapes. Unique four, overlay cap 2, haul dest bind, and NPC AI mode `'hunt'` stay untouched. WAVE78 boot pins were all true on the first full boot run.

### What's done well
- Cap is live mining+trade formula plus `HUNT_SLOTS_PER_SYSTEM * N` only.
- Drop order never evicts unique four, accepted jobs, or honest offered mining/trade/hunt.
- Claim requires live record `dead`/`captured` plus player `destroyed` incident on `rec.name`.
- Accept is origin-dock only and refuses a non-finite bounty `> 0` or a non-finite pay `> 0`.
- One-in-one-out uses `failed` then splice then replace; no `DONE` hunt cards.

### Findings

#### 🟠 Major: Offered unvisited hunt must not expire for a missing bank
**Location:** `src/systems/station.js:2554-2564`
**Issue:** First tick treated a missing bank as quarry-gone and replaced offered hunt.
**Why it matters:** Contract keeps grammar-valid hunt when the origin bank is missing.
**Fix:** Gate offered quarry-gone on `huntBank(ctx, origin)`. Applied.

#### 🟡 Minor: `extraDuplicateHuntRecords` only runs in overflow
**Location:** `src/game/save.js` `dropJobsUntilCap` extra hunt pass
**Issue:** Two hunt rows can share `recordId` when under cap.
**Suggestion:** Live `syncHuntJobs` already skips bound ids. Tick `huntPaidNames` blocks a second purse. Optional sanitize-always drop later.

#### 💡 Suggestion: Hunt helpers duplicate mining/trade id allocators
**Location:** `src/systems/station.js` `nextHuntId` / `replaceHuntJob`
**Issue:** Same prefix-scan as mining/trade. Fine for this serial. A shared helper is out of scope.

### Passed
- Unique `bounty-ace` / haul / ferry / patrol ids unchanged.
- Overlay pirate fill still uses `PIRATE_BOUNTY_CAP = 2`.
- WAVE26/WAVE35 unique haul still run; dest bind source still present.
- `need === 1` or drop; hunt forbids cargo field.
- Empty second slot is legal when no quarry remains.
