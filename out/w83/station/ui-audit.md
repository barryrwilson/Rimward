## UI Audit: Wave 83 Jobs + Standing

### Summary
Digit 2 chain cards use existing `h()` / Accept buttons. Digit 9 restitution copies the graft two-step (pending, Confirm, Esc cancel). Short credits show a note and hide the pay button.

### What's done well
- `textContent` only
- Confirm uses `screen-btn-warm`
- Esc on Standing cancels pending restitution without debit
- Offered chains hidden off-home and from Stranger

### Findings
None at Blocker/Major.

#### 💡 Suggestion: restitution copy could name the faction
**Location:** `station.js` renderEpics RESTITUTION
**Issue:** Lines say “this dock” / “dock flag” rather than the display name.
**Fix:** Optional; `factionDisplayName` is already on the rank line above.
