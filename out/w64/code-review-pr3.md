# Code Review: Wave 64 PR3 shipyard desk + Digit 0

**Scope:** one appended `shipyard` service, Digit 0, two-pane desk, WAVE64 desk pins.
**Pass:** first pass after desk pins.

### Summary
PR3 matches ShpDesign §2 and shared-contract §2. Digits 1–9 stay Market…Standing. Digit 0 opens the desk. Hangar lists sanitized rows and calls `switchTo`. Yard is fail-closed. WAVE64 persist + remount + desk pins are true. WAVE62 stays true. No blocker or major.

### What's done well
- Append-only key. No mid-list insert.
- Last menu button is `0 — Shipyard`, not `10 — Shipyard`.
- Level-1 legend names Digit 0.
- One desk, two panes. Digit 1 Hangar, Digit 2 Yard. 3+ re-reads the pane.
- Empty Yard does not debit. Digit keys cannot sell.
- Refuse reasons map to short player lines on `textContent`.
- High-contrast selectors match other dim list text.
- Desk pins cover length, Digit 0, 1–9, hangar list, XSS text, remount Digit5 / Digit3, Digit8 launch.

### Findings

#### 🟡 Minor: Digit 0 on Hangar also indexes hull 8
**Location:** `src/systems/shipyard-desk.js:45-48`, `src/systems/shipyard-desk.js:119`
**Issue:** Level-2 Digit 0 mounts `hulls[7]`. Cap is 8, so the last row needs a key. The desk legend says `3+` and does not name 0.
**Fix (later):** add `0 last hull` to the desk legend when PR4 touches the pane.
**Status:** accept — click `0 — Mount` still works; 8th row is rare this slice.

#### 🟡 Minor: hull cards past index 7 have no mount button
**Location:** `src/systems/shipyard-desk.js:71`
**Issue:** `if (i > 7) return` still draws a nameless-digit card. Sanitize caps at 8, so the branch is dead.
**Fix:** drop the extra cards or keep as a belt.
**Status:** accept — hangar cap already drops the tail.

#### 💡 Suggestion: comments on pane law
**Location:** `src/systems/shipyard-desk.js:4`, `102-106`
**Issue:** Short comments state Digit 1/2/3+ law for PR4. Useful, not a restatement of a single line.
**Status:** keep.

### Resolved this pass
None. No HIGH/CRITICAL.

### Verdict
Approve for PR3 desk. WAVE62 still true. Known WAVE4/26/35 FAILs unchanged (9). WAVE64 persist + remount + desk pins all true.

### Re-review
No blocker or major. No desk code change after the first pass. Minor Digit-0 hull-8 note stays documented.
