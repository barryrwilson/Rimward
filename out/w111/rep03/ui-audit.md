## UI Audit: Digit 9 Standing climb copy (`standingRemedialNotes`)

### Summary
Digit 9 Standing now names the climb from restitution 0 under HOW STANDING MOVES with two existing `screen-note` rows. Pay restitution still shows only when standing is below 0. After pay, that block hides and the climb lines remain. No new Digit, hub child, toast, or CSS.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`.

### What's done well
- Climb copy uses live `h('div', 'screen-note', panel, …)` / `textContent`. Same type, color (`#9fb2c6`), and 8px rhythm as move notes.
- Preferred placement: under **HOW STANDING MOVES**, not a new AFTER RESTITUTION subhead, and not nested in RESTITUTION.
- Copy points at **Jobs board** (Digit 2) with no new hotkey. Digit 9 stays Standing. Digit 0 stays shipyard. Digit 8 stays launch.
- Honesty: 0 (Stranger), +2 families, Known 10, Beautiful Ones graft cap, Freehold Compact patrol only. Does not say jobs lock until pay.
- Fail closed: if the helper is missing, Pay restitution and live move/live notes still paint. Standing never blanks.
- HUD-01: no new `.rw-reticle` child. RANGE stays TGT-01.
- No `@keyframes`. No new CSS tokens. Overlay still `max-height: 82vh; overflow-y: auto`.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Two extra notes add scroll on a short dock panel
**Location:** `src/systems/station.js` `renderEpics` HOW STANDING MOVES; `src/ui/screens.css` `.screen-note`
**Issue:** Digit 9 already lists ladder, move notes, live consequences, and epic stages. Two more rows wrap on a 560px min panel.
**Fix:** Keep two lines (contract one-or-two). Do not add a third subhead this PR. Honor live `.screen-note`.
**Status:** accepted; owner may shorten after playtest.

#### 💡 Suggestion: Do not paint climb progress on RANGE
**Location:** `src/systems/hud.js` RANGE
**Issue:** Remaining-rep-to-Known on RANGE would smash TGT-01.
**Fix:** Contract forbids. Pins grep empty hub / no new reticle child.
**Status:** frozen.

### Accessibility / theming / layout
- No new controls. Keyboard reach unchanged: Digit 9 opens Standing; Digit 2 Jobs; restitution buttons stay `screen-btn` / `screen-btn-warm`.
- Contrast: climb text uses `.screen-note` (`#9fb2c6` on `#101826` panel). `body.rw-contrast` already restyles `.screen-note`.
- Empty / error: missing helper keeps live Digit 9. Restitution still shows at standing `< 0`.
- `aria-live` on `ui.notice` is unchanged. Climb notes are static `div` text, same as other Standing notes.

### Method
Worker self-audit. Digit 9 is frontend station UI. Checklist applied in-process.
