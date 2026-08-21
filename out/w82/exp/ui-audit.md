## UI Audit: Archive desk and People fixer launder

### Summary
Archive copy shows 400 / 900 UU and drops "UU unset". Launder is a two-step mark on the live fixer card. reducedMotion keeps the same verbs. No Blocker or Major.

### What's done well
- `h(..., text)` uses `textContent`. Buttons use existing `screen-btn` / `screen-btn-warm`.
- Archive verbs stay File buy / File sell / Confirm filing / Esc — Cancel.
- Launder verbs stay Mark legal / Confirm mark / Esc — Cancel.
- Hostile Assembly desk prints "No sale." and hides buy/sell.
- Vanished lots clear pending and print hold copy.
- Esc on Market cancels data pending. Esc on People cancels launder pending.

### Findings

#### 🟡 Minor: File buy stays armed when the hold is full
**Location:** `src/systems/station.js:1345-1350`
**Issue:** The buy row does not check capacity before arming. Confirm then prints "Hold is full."
**Fix:** Optional disable. Fail-closed confirm is enough for money safety.

#### 💡 Suggestion: Hostile desk still prints prices above "No sale."
**Location:** `src/systems/station.js:1306-1313`
**Issue:** The player can read 400 / 900 UU with no File buttons.
**Fix:** Optional. Yard also names prices near a no-sale line.

### Re-run
No Blocker/Major after copy and hostile gate. Did not spawn a designer agent.
