# UI Audit: Digit 2 Jobs — passenger escort (Wave 78)

**Scope:** `renderJobs` passenger cards only. Digit 2. No new Digit.  
**Method:** Self-applied `orchestrator/references/ui-audit.md`. Digit 2 Jobs cards are frontend UI — not skipped.  
**Date:** 2026-08-21

## UI Audit: Jobs pane passenger cards

### Summary
Passenger cards reuse the live job-card pattern: title, detail, reward, Accept, remaining time. Dest names come from `otherSystemId` + `SYSTEMS[dest].station.name`. No Blocker or Major findings.

### What's done well
- `h()` / `textContent` only. No `innerHTML`.
- Title `Escort passengers`. Detail names the dest station. Reward `Escort to <dest> — pays <est> UU`.
- Offered remaining time reuses `miningTimeLeftLabel`.
- Accepted: `ACCEPTED — dock at <dest> · t left`.
- Accept is `btn(card, Accept (n), () => acceptJob(job))` by identity, so mouse Accept still works past index 8.
- Hunt cards still render on the same board. Unique ferry stays a unique card (`kind: 'ferry'`).
- Offered passenger is home-only via `boardJobs`. Accepted passenger still shows at other docks.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** live digit accept into `boardJobs` (unchanged)  
**Issue:** Home board can exceed 9 cards (unique four + overlays + mining + trade + hunt + two passenger). Existing UX. Mouse Accept still works. Contract forbids cutting to one slot.  
**Fix:** None in this serial.

#### 💡 Suggestion: Standing note mentions passenger +2
**Location:** Jobs sub-note  
**Issue:** Players see mining, hunt, and passenger share employer standing. Patrol still names Freehold. Clear hierarchy.  
**Fix:** None.

### Accessibility
- Buttons are real `<button>` nodes via `btn()`.
- Copy is plain English, no slave/stock/meat voice.
- `reducedMotion`: no extra animation added.

### Verdict
Approve for Digit 2 passenger cards.
