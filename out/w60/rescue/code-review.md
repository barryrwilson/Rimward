## Code Review: wave 60 rescue / market block

### Summary
Rescue helpers and market guards match the ruling. Probe pins the contracts. Digit map stays sacred.

### What's done well
- Dedicated remove/apply path so trade `addCargo`/`removeCargo` cannot treat people as bulk.
- `priceOf` no longer throws on a missing COMMODITIES key.
- People card plus dock-home notice, no new hotkey digit.
- HUD toasts `survivorRescued` and dedupes the same-frame comm line.

### Findings

#### 🟡 Minor: Rescue chrome appears on dock home and People
**Location:** `src/systems/station.js` renderRescue
**Issue:** Two Return buttons if the player is on the People service after seeing the home notice.
**Fix:** Optional later. Both paths call the same helper.

#### 💡 Suggestion: Drop `key === 'survivor'` once COMMODITIES never lists it
**Location:** `src/systems/station.js` tryTrade
**Issue:** `isMarketCommodity` already returns false for `survivor`.
**Fix:** Leave the extra check as belt-and-braces against a later COMMODITIES edit.

### Status
No blocker or major. Probe prints CLEAN.
