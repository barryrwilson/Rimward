## Security Review: Wave 74 persist (REP PR1 + EXP PR1 + EXP PR2 skip-spawn)

### Risk Level: Low

### Summary
Restore heals reputation into a fresh object and drops reserved, non-faction, and non-finite keys. Data cargo rows fail closed on missing `source` / `originFaction` (no heal-to-legal). Owned tribute paths treat data keys as 0. No HIGH or CRITICAL findings.

### Findings

#### MEDIUM: systemLoaded can read reputation before bag heal
**Location:** `src/game/save.js` restore emit, then `sanitizeRestored` then `sanitizeReputation`
**Issue:** Restore copies `world.reputation` wholesale, may emit `systemLoaded`, then sanitizes. A listener could see `__proto__` or NaN for one turn.
**Impact:** Same window as jobs sanitize. Rank-from-NaN could read as Marked if a listener called `rankFor` on the raw bag before heal.
**Fix:** Keep the contract call site next to `sanitizeJobs`. Later listeners must use `standingRead`.
**Status:** open (documented; call site frozen to match jobs)

#### MEDIUM: scoop merge adds raw units onto a matched data row
**Location:** `src/game/pods.js` `mergePodContents`
**Issue:** New data rows go through `copyDataCargoEntry`. A match only does `existing.units += c.units`.
**Impact:** An in-memory pod with non-finite units could NaN a stacked lot. No first-impl spawn writes data pods.
**Fix:** Add only a finite truncated count of 1 or more on the data match path.
**Status:** open (no spawn path this slice)

#### LOW: stuffed source legal still restores
**Location:** `src/game/data-trade.js` `sanitizeDataCargoRow`
**Issue:** Allowlist accepts `legal` without a signature.
**Impact:** Local save edit can mark captured goods legal. Contract section 5.3: no HMAC.
**Status:** open (accepted)

### Passed Checks
- [x] No secrets in code
- [x] No innerHTML on persist or helpers
- [x] RESERVED_IDS and Object.hasOwn on faction and origin keys
- [x] No for-in assign from a save blob onto reputation
- [x] Fresh reputation object; missing keys stay missing
- [x] Data row missing source drops (does not become legal)
- [x] Reserved commodity / origin drops the row
- [x] Unknown commodity strings drop
- [x] Survivor path unchanged
- [x] cargoValueSafe zeros stuffed dataCrystal / dataCube prices
- [x] npc/hail tribute and interest use cargoValueSafe
- [x] No new WORLD_FIELDS law key; autosave stays rimward-save-v1
- [x] spawnDataPod / maybeSpawnDataFromWreck no-op while drop rate is unset
- [x] spillShipCargo does not flatten data rows into bulk pods
- [x] Hangar trimCargoToCapacity keeps extra allowlisted fields (no hangar edit)

### Recommendations
1. Station Archive priceOf must return 0 for data keys (later worker).
2. When a drop rate exists, add a once-flag so salvage plus destroy cannot double-spawn.

### Second pass
Re-read `save.js`, `data-trade.js`, `pods.js`, `npc.js`, `hail.js` after the cargo list index walk. No new CRITICAL or HIGH. Open items stay MEDIUM/LOW as above. Probe: 49 pins, all true.
