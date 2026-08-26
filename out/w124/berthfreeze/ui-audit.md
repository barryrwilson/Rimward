# UI Audit: CTL-03 Berth Records hold / resume copy (Wave 124)

### Summary

Player-facing leftover is the Berth Records **desk** plus later RESUME copy **below** SAVE/LOAD. Live hint still lies (“records hold while you fly”). PR1 must rewrite that English. Interrupt must **not** shrink to a resume-only card. SAVE/LOAD stay visible while hold is on. No new Digit. Color is not the only cue.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** skip: resume copy is UI. Did not spawn a designer agent. Did not start Vite/Chrome.

### What's done well

- Live panel: `role='dialog'` `aria-label='Berth Records'` (`save.js` **1362-1363**).
- Named close already: **L or ESC** (`save.js` **1377**).
- Title `BERTH RECORDS` via `textContent` (**1370**).
- SAVE / LOAD are real `<button>` elements with `textContent` (**1467-1480**).
- Root `pointer-events:none` except the panel (**1353-1358**) so the canvas is not a hidden hit target around the dialog.
- Mutex (CTL-02) already prevents hail Digit 1–9 from firing under berth (`hailDigitsAllowed`).
- z 60 sits above pause 50 so the desk remains visible if the player also taps P (LOAD then correctly refuses).

### Findings

#### 🔴 Blocker: Hint copy contradicts a safe records desk
**Location:** `save.js:1377` `'L or ESC to close — records hold while you fly'`  
**Issue:** Inbox: a save/load screen must be a safe place to stop. Live copy tells the player the world keeps flying. Playtest: routed flight enters a gate behind the modal.  
**Fix:** PR1 must change this English. Open (no interrupt): `L or ESC to close — your ship holds. This is not Pause (P).` Interrupt remainder: `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).` `textContent` only.  
**Status:** **resolved** in contract §0.1 hint row (two authored literals). (Live string stays until later PR1 — expected.)

#### 🟠 Major: Interrupted close has no named resume
**Location:** KeyL/Escape `save.js:1503-1516` — close only  
**Issue:** Inbox requires explicit resume when a transition or Autopilot leg was interrupted. Close today dumps the player back into a live charge/steer with no choice and no explanation.  
**Fix:** Resume-required **keeps the full desk**. Button `RESUME` **below** slots. Reason literals in contract §0.1. No Digit. No Enter. Color chip is not the only cue. `berthOpen` stays true so hail/chart stay mutexed. L/ESC keep the desk.  
**Status:** **resolved** in contract §0.1 (panel stays; no resume-only remainder).

#### 🟠 Major: Resume-only remainder can hide LOAD while hold is on
**Location:** prior freeze `shared-contract.md` “or shrinks to a resume dialog”; designer 2026-08-25  
**Issue:** A resume-only card would hide SAVE/LOAD while `berthHold` is true. Remaining action would be RESUME (continue the jump/AP the player opened L to stop). Inbox requires a save/load **desk**. LOAD must work while hold is on and KeyP is off.  
**Fix:** Lock **panel stays**. SAVE/LOAD rows stay visible and clickable. Reason + `RESUME` below slots, more prominent than slot SAVE, still `textContent`. Remainder hint must not say L/ESC dumps to live flight. Explicit non-pick: resume-only remainder.  
**Status:** **resolved** this re-dispatch — contract §0.1 When keep; non-pick table; design Acceptance 3/5; Picture; Player outcome.

#### 🟠 Major: LOAD vs Pause must stay distinguishable in copy
**Location:** pause banner `main.js:163` `'PAUSED — P to resume'`; berth z 60 over pause z 50  
**Issue:** If hint and pause banner both say “paused”, players KeyP under berth and then LOAD silently does nothing (Wave 28).  
**Fix:** Berth copy must say this hold is **not** KeyP pause. Pause banner stays P. LOAD refuse remains pause-only. Remainder hint also names “This is not Pause (P).”  
**Status:** **resolved** in deputize hint language.

#### 🟡 Minor: Remainder hint must not imply L/ESC dumps to live flight
**Location:** contract §0.1 remainder hint  
**Issue:** Open hint names L or ESC to close. On interrupt that would lie if L dumped into a charge.  
**Fix:** Remainder literal: `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).` Keys L/ESC still exist; they keep the desk.  
**Status:** **resolved** this re-dispatch (closed cheap with the Major).

#### 🟡 Minor: Resume button keyboard reach
**Location:** later RESUME `<button>` (not live)  
**Issue:** Mouse-only resume would fail keyboard users. Enter is forbidden (death/title).  
**Fix:** Native button in the dialog tab order **after** SAVE/LOAD. Space/click on the focused button (browser default). Do not bind Enter at window level.  
**Status:** accepted — PR1 acceptance; not a live hole.

#### 🟡 Minor: Slot meta contrast
**Location:** `save.js:1378` hint `#5f7185` on dark panel  
**Issue:** Hint is dim. After rewrite it must stay readable; high-contrast setting is a global body class, not this leftover.  
**Fix:** Keep letter-spacing + `textContent`. Do not invent a new settings checkbox. Optional: slightly brighter hint if playtest fails contrast — skippable PR2.  
**Status:** accepted — not required PR1.

#### 💡 Suggestion: Disable SAVE/LOAD visual during mid-jump
**Location:** live mid-jump refuse is toast, buttons stay enabled  
**Issue:** Buttons click then toast. Not this leftover to redesign row disable, except hold must not add a second mute.  
**Fix:** Keep live toast. Do not `innerHTML` the reason. Do not hide the buttons on interrupt.  
**Status:** out of scope.

### Accessibility checklist (later PR1)

- [x] Open (no interrupt) names L / ESC to close
- [x] Interrupt remainder does **not** claim L/ESC dumps to live flight
- [x] SAVE/LOAD stay named buttons on interrupt
- [x] Resume named in text (not color-only), below slots
- [x] No new Digit
- [x] No Enter bind
- [x] `textContent` / `el()` only
- [x] Dialog `aria-label` stays Berth Records
- [x] Hail/chart not paused (different overlays keep their own close names)
- [x] Aim-glass gauges stay off; no hub pip

### Verdict

UI leftover is **real** (lying hint + missing resume). Markdown freeze now keeps the **desk** on interrupt. Do not skip UI audit. Do not implement in this wave.

### Re-review (after remainder lock)

No remaining Blocker/Major **in the markdown freeze**. Designer Major (resume-only remainder hides LOAD) is **closed**. Live hint/resume holes are the leftover PR1 is named to land. Audit does not claim they are gone from `src/`.
