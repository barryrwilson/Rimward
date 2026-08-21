## Code Review: Wave 74 persist helpers

### Summary
Sanitize, scoop provenance, fail-closed cargo value, and skip-spawn match the Wave 73 contracts. Probe pins all pass. No Blocker or Major findings.

### What's done well
- Reputation walks Object.keys into a new object; missing faction keys stay missing.
- Data sanitize requires exact source and originFaction tokens; extra keys are omitted.
- Survivor cargo path is unchanged.
- cargoValueSafe filters data keys before state.cargoValue so stuffed prices cannot pad tribute.
- spawnDataPod returns null; npc spill skips data flattening and still calls the no-op wreck hook.
- Hangar already routes through sanitizeCargoList; trim keeps row extras.

### Findings

#### Minor: mergePodContents does not re-sanitize units on a data stack
**Location:** `src/game/pods.js` mergePodContents
**Issue:** Matched lots add incoming units as-is. Ordinary and survivor rows already do this.
**Fix:** Optional finite trunc on the data match branch when spawn exists.
**Status:** open (documented)

#### Minor: reputation heal runs after systemLoaded
**Location:** `src/game/save.js` restore / sanitizeRestored
**Issue:** Matches sanitizeJobs. Listeners must not trust the raw bag.
**Fix:** Do not move the call site; use standingRead at readers.
**Status:** open (contract)

#### Suggestion: duplicate sanitizeUnits
**Location:** `src/game/data-trade.js` and `src/game/save.js`
**Issue:** Two copies of the same trunc. Avoids a save.js circular import.
**Fix:** Leave split until a shared units helper exists outside save.js.
**Status:** open (accepted)

#### Suggestion: station priceOf still lives in station.js
**Location:** later worker
**Issue:** This slice cannot wrap priceOf. cargoValueSafe covers owned tribute sites.
**Fix:** Station worker returns 0 for isDataCommodity.
**Status:** open (handoff)

### Test coverage
`out/w74/persist/probe.mjs` pins proto/NaN reputation, missing Beautiful, ordinary vs unknown cargo, data roundtrip, missing source drop, survivor unchanged, stuffed-price zero, and no data pod spawn.

### Second pass
No Blocker or Major after re-read. Open items stay Minor/Suggestion. Probe re-run: 49 pins, all true.
