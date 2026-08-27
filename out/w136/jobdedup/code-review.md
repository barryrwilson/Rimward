## Code Review: Msn04 PR1 mining identity uniqueness

### Summary

Fill, replace, and offered-twin heal share `pickMiningCommodityExcluding` plus sibling scan. Cap 2 is a max. Unique four, pay formula, ids, and other families stay. No Blocker or Major findings remain.

### What's done well

- Slot under fill/replace is excluded from the sibling commodity set, so replace can pick a new ore that is not the sibling’s.
- Empty table / exhausted exclusion returns `null` and `syncMiningJobs` breaks (omit).
- `healOfferedMiningTwins` remints offered only, prefers slot 1, leaves two accepted same-commodity cards.
- `makeMiningJob` gates `COMMODITIES` before `.name`.
- `nextMiningId` unchanged; pay path unchanged.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: `pickMiningCommodity` is now a wrapper

**Location:** `src/systems/station.js` `pickMiningCommodity`  
**Issue:** only `pickMiningCommodityExcluding` is on the mint path. The wrapper stays so name greps still match.  
**Fix:** keep the wrapper (boot / inventory cites).  
**Status:** accepted

#### 💡 Suggestion: one remint cap per sync for extra hostile rows

**Location:** `healOfferedMiningTwins` remint loop capped at `MINING_SLOTS_PER_SYSTEM`  
**Issue:** a hostile array with many extra same-commodity offered rows heals two per `renderJobs` tick. Next paint continues.  
**Fix:** not required; sanitize extra-slot law already drops extra same origin+slot.  
**Status:** accepted

### Passed

- `MINING_SLOTS_PER_SYSTEM = 2` still the cap
- `while (count < MINING_SLOTS_PER_SYSTEM)` increments or breaks; pick loop is finite
- `makeJobs` unique-four ids unchanged
- Trade/passenger/explore/hunt/spy/war allocators unchanged
- No `state.js` / `save.js` / Digit map / `renderJobs` paint-channel edit
