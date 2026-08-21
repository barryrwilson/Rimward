# UI Audit: Digit 2 Jobs — explore recovery (Wave 78)

**Scope:** `renderJobs` explore cards only. Digit 2. No new Digit.  
**Method:** Self-applied `orchestrator/references/ui-audit.md`. Digit 2 Jobs cards are frontend UI — not skipped.  
**Date:** 2026-08-21

## UI Audit: Jobs pane explore cards

### Summary
Explore cards reuse the live job-card pattern: title, detail, reward, Accept, remaining time. Landmark and system names come from `resolveExploreSite` + `landmarks[i].name` + `SYSTEMS[site].name`. No Blocker or Major findings.

### What's done well
- `h()` / `textContent` only. No `innerHTML`.
- Title `Survey <landmarkName>`. Detail `Fly to <landmarkName> in <systemName>. Redock here to file.`
- Reward `File the survey at this dock — pays <est> UU`.
- Offered remaining time reuses `miningTimeLeftLabel`.
- Accepted: `ACCEPTED — survey <landmarkName> in <systemName> · t left`.
- Accept is `btn(card, Accept (n), () => acceptJob(job))` by identity, so mouse Accept still works past index 8.
- Hunt and passenger cards still render on the same board. Unique four stay.
- Offered explore is home-only via `boardJobs`. Accepted explore still shows at other docks.
- Copy never prints `fh_shepherd`, `rec-`, clue ids, or `mystery.visited`.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit 1–9 cannot accept past index 8
**Location:** live digit accept into `boardJobs` (unchanged)  
**Issue:** Home board can exceed 9 cards (unique four + overlays + mining + trade + hunt + passenger + two explore). Existing UX. Mouse Accept still works. Contract forbids cutting to one slot.  
**Fix:** None in this serial.

#### 💡 Suggestion: Standing note mentions explore +2
**Location:** Jobs sub-note  
**Issue:** Players see mining, hunt, passenger, and explore share employer standing. Patrol still names Freehold. Clear hierarchy.  
**Fix:** None.

### Accessibility
- Buttons are real `<button>` nodes via `btn()`.
- Copy is plain English, no clue-id internals.
- `reducedMotion`: no extra animation added.

### Verdict
Approve for Digit 2 explore cards.
