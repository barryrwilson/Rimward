## UI Audit: People sworn gift papers

### Summary
Gift chrome lives on the Beautiful People desk. It reuses yard confirm classes, real buttons, and static `textContent`. Digit 0 on the dock root is still Shipyard.

### What's done well
- Two-step: `1 — Papers` / Digit 1 arms; `Confirm papers` grants.
- Esc / `Esc — Cancel` clears pending and writes nothing.
- KeyB undocks without a grant.
- Arm copy: `The berth answers. Confirm the sworn gift.`
- Success / full / already / no gift use contract strings via `ui.notice` (`textContent`).
- Confirm uses `screen-btn-warm`. Cancel is a second real `<button>`.
- Reduced motion keeps the same words. No extra animation.
- Pirate has no new chrome. `commLine` toast only.

### Findings

#### 🟡 Minor: Gift notice is not a dedicated `aria-live` region
**Location:** `src/systems/station.js` `.station-notice`
**Issue:** Success copy lands on the existing dock notice after a full redraw.
**Fix:** None this wave. Overlay already rebuilds the notice node each render, matching yard papers.
**Justification:** Same pattern as graft / restitution. Do not add a new live region.

#### 💡 Suggestion: Gift name `Sworn gift` is desk chrome, not a contract line
**Location:** `src/systems/station.js` `renderGiftPapers`
**Issue:** The row title is not in the copy table. Buttons and notices use the locked strings.
**Fix:** Optional owner retune. Keep it if the row needs a name.

### Keyboard
- Dock level-1 Digit 0 → shipyard (unchanged)
- People level-2 Digit 1 → arm only while the gift row is visible
- Digit 1 while pending does not confirm (button does)
- Esc cancels pending before leaving People
