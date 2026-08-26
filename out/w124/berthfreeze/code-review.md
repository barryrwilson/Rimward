# Code Review: CTL-03 Berth freeze design pack (Wave 124)

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `save.js` / `main.js` / `gate.js` / `jump.js` / `autopilot.js`. Contract correctly forbids pause impersonation, full-loop skip, resume-only remainder, `controls.js` steal, and persist. No Blocker/Major remain after jump.js-reader, LOAD-same-click, and desk-stays locks.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and persona `reviewer.md`. **Did not** edit `src/`.

### What's done well

- Inventory file:line cites match live code (berth hint **1377**, LOAD **1420**, pause loop **149-152**, `jumpRequested` **678**, AP pause return **388-390**, overlay never paused **4**).
- CTL-02 collision is explicit: mutex live, pause still forbidden for hail/chart/berth.
- NAV-03 restore AP false and NAV-05 sole emit are honored.
- Write-set excludes `controls.js` (CTL-04) and npc interest (AI-05).
- CONSUME path documented as unexpected and **not** taken.

### Findings

#### 🔴 Blocker: Charge owner mismatch (brief vs live)
**Location:** worker brief “`gate.js` refuse charge/emit”; live `jump.js:221-227`  
**Issue:** Charge/swap is `jump.js`. Emit-only would still arrive behind the modal.  
**Fix:** Contract §0.12 adds `jump.js` reader. Design Background pain + Neighbours table match. **This file wins on conflict with the brief.**  
**Status:** **resolved** in `shared-contract.md` / `Ctl03BerthFreezeDesign.md`

#### 🔴 Blocker: `main.js` skip misread
**Location:** `main.js:149-152`; brief “skip player-facing ticks”  
**Issue:** Skipping the whole loop is Wave 28 LOAD poison.  
**Fix:** Contract §0.9 forbids full-loop skip; readers early-return.  
**Status:** **resolved**

#### 🟠 Major: Resume must not `disengage` Autopilot
**Location:** `autopilot.js:385-390` vs `191-207`  
**Issue:** `inputBreak` disengage would drop the interrupted leg. Pause path already `zeroCmd` + return **without** disengage. Hold must mirror **that**, not helm cancel.  
**Fix:** Contract §0.1 AP early-return row.  
**Status:** **resolved**

#### 🟠 Major: LOAD must clear hold before next rAF
**Location:** `save.js:1433-1435`  
**Issue:** If resume-required kept `berthOpen` after LOAD, mutex + hold could linger on a restored system.  
**Fix:** Same-click clear hold + snapshot; no AP RESUME after LOAD.  
**Status:** **resolved**

#### 🟡 Minor: Hint rewrite is load-bearing English
**Location:** `save.js:1377`  
**Issue:** Shipping hold without copy leaves a lying hint.  
**Fix:** Contract §2 “partial merge forbidden”. PR1 lands copy with hold.  
**Status:** accepted — locked in contract; not a census bug.

#### 🟡 Minor: `world.time` may still advance
**Location:** contract §0.1 “what hold does not stop”  
**Issue:** Time-advance vs freeze is a playtest knob (calm clocks vs “stopped”). DPS skip is the safety net.  
**Fix:** Owner may override after playtest; do not park. Distant traffic default is explicit.  
**Status:** accepted — deputized, not a correctness hole.

#### 💡 Suggestion: Optional overlay-policy `berthHeld(ctx)` 
**Location:** `overlay-policy.js`  
**Issue:** Duplicate `flags.berthHold === true` reads will drift.  
**Fix:** Tiny helper next to `overlayIsOpen`. Writer still save.js.  
**Status:** optional PR1; already allowed.

#### 💡 Suggestion: Do not add boot FAIL “fixes”
**Location:** REDMARCH `castMatches`  
**Issue:** Honor list.  
**Fix:** Contract §0.20.  
**Status:** locked.

### Verdict

**Approve markdown pack** for orchestrator consume. Leftover REAL. Serial **PR1**. Do not implement in Wave 124.

### Re-review (after remainder lock)

#### 🟠 Major: Resume-only remainder hides LOAD
**Location:** prior `shared-contract.md` “or shrinks to a resume dialog”  
**Issue:** Interrupt path could replace the desk with RESUME-only chrome. LOAD while hold (and not KeyP) would be gone. Inbox is a save/load desk.  
**Fix:** Panel stays. SAVE/LOAD stay visible/clickable. RESUME below slots. Remainder hint does not claim L/ESC dumps to live flight. Non-pick added.  
**Status:** **resolved** this re-dispatch.

No remaining Blocker/Major. Minors accepted. Contract wins: no resume-only remainder.
