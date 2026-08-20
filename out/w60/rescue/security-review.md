## Security Review: wave 60 rescue / market block

### Risk Level: Low

### Summary
Rescue writes reputation from cargo rows. Guards reject unknown factions, non-finite units, and stacks larger than hold capacity. The market cannot list or sell survivors. Digit order is frozen.

### Findings

#### 🟡 MEDIUM: Crafted cargo can still grant legitimate-cap reputation
**Location:** `src/systems/station.js` applySurvivorRescue
**Issue:** A player who edits save/console cargo can mint `{ commodity: 'survivor', faction: 'freehold', source: 'other', units: 20 }` and cash 80 rep at Freehold.
**Impact:** Standing inflation in a single-player client. No server trust boundary.
**Fix:** Out of scope for a local sim. Cap already matches hold size.

#### 🟢 LOW: Mixed-source event reports `source: 'other'`
**Location:** `src/systems/station.js` applySurvivorRescue payload
**Issue:** A hold with both sources emits one event tagged `other`.
**Impact:** A later listener that keys only on source may over-count recovered people.
**Fix:** Not required this pass. Payload stays in the documented enum.

### Passed Checks
- [x] No secrets in code
- [x] Unknown faction (`__proto__`) cannot create reputation keys
- [x] Infinite units grant no reputation and stay in the hold
- [x] Oversize stacks grant no reputation and stay in the hold
- [x] `source === 'other'` is exact; anything else uses the small bump
- [x] `tryTrade` refuses non-market keys and `survivor`
- [x] `removeCargo` will not sell a survivor row
- [x] `priceOf('survivor')` does not throw
- [x] `DOCK_KEY_SERVICES` length/order unchanged and frozen
- [x] UI copy uses `textContent` (no HTML injection)
- [x] Spoken lines use faction display names only
