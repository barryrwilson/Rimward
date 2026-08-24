## Security Review: station / contacts / shipyard-desk boot cluster

### Risk Level: Low

### Summary
The changes are client-side sim UI and job/favor state. No new network, auth, or crypto. Favor banking is in-memory only.

### Findings

#### 🟢 LOW: Favor handle Set retains contact objects
**Location:** `src/game/contacts.js` (`favorHandles`)
**Issue:** Session Sets keep roster row objects for favor sync.
**Impact:** Tiny leak in a long session. Boot roster is 104 rows.
**Fix:** Optional WeakSet if the roster churns in a later wave.

### Passed Checks
- [x] No secrets in code
- [x] No innerHTML writes added
- [x] Credits/favor writes stay on existing station/contact paths
- [x] Unique-haul dest hold does not invent pay

### Recommendations
1. Keep favor bank keyed by contact id, not by display name.
