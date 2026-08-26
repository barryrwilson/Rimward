## UI Audit: Berth Records hold + RESUME (helm re-dispatch)

### Summary
This re-dispatch did not change DOM, copy, keys, or desk size. Prior PR1 UI still CLEAN. No Blocker. No Major.

Reviewed this pass: `src/game/autopilot.js` only (no UI). Honor from prior PR1 UI still holds on `save.js` / overlay-policy.

### What's done well
- No new Digit. No Enter. No KeyP remap. No desk shrink.
- RESUME remains a named text control below SAVE/LOAD.
- Hint still names hold and not Pause (P). Color is not the only cue.
- Helm on the desk cannot cancel the flying Autopilot leg, so the RESUME control can still continue that same leg.

### Findings

#### 🟡 Minor: Hint contrast is the live gray
**Location:** `src/game/save.js` berthHint `#5f7185`
**Issue:** Same as the old hint. Readable enough on the panel, not a new regression.
**Fix:** Do not retune the whole berth palette in PR1.

#### 💡 Suggestion: Open does not move focus into the dialog
**Location:** `src/game/save.js` setBerthOpen
**Issue:** Live berth also did not auto-focus. Keyboard users still reach SAVE/LOAD/RESUME via Tab after L.
**Fix:** Keep. Auto-focus can steal flight keys on the open frame.

### Re-review
No UI files in this helm fix. No remaining Blocker/Major. Verdict **CLEAN**.
