## UI Audit: Digit 2 Jobs pane (hunt cards)

### Summary
Hunt stays inside `renderJobs`. Cards use `h()` / `textContent` only. Copy names the live pirate, remaining time, and origin quote. Digit 2 and mouse Accept stay. No Blocker or Major issues after review.

### What's done well
- Title/detail regenerate from templates + stripped live `rec.name` (fallback `the marked reaver`).
- Reward uses origin `jobPayFor` when offered and stamped `payQuoted` when accepted.
- Offered cards show Accept (n) and the mining remaining-time label.
- Accepted copy: `ACCEPTED — hunt <name> in this system · t left`.
- `recordId` is never interpolated into title, detail, reward, or state lines.
- Jobs note states hunt credits the dock flag (+2).
- Home board can exceed 9 cards; mouse Accept still binds the job object.

### Findings

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** `src/systems/station.js` Digit handler + `renderJobs` Accept buttons
**Issue:** Unique four + overlays + mining + trade + two hunt can push Accept past Digit 9.
**Fix:** Contract default: keep two hunt slots; mouse Accept remains. Do not cut slots.

#### 💡 Suggestion: Verge may show one hunt card
**Location:** `syncHuntJobs` fill stop
**Issue:** One local pirate means one card. Empty slot is legal. No extra empty-state chrome.

### Passed
- No `innerHTML`.
- No new Digit. No HUD glance.
- `reducedMotion`: no hunt animation.
- Accept buttons are real `<button type="button">`.
- Offered hunt hidden off-home via `boardJobs`; accept also refuses foreign origin.
