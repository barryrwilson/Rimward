## UI Audit: Galaxy Chart Autopilot success close

### Summary

Successful Autopilot click closes the full-screen map. Keyboard focus does not stay inside the `aria-hidden` chart. HUD Cancel is used only when that chip is visible. Labels and hit discs are unchanged.

### What's done well

- Close is instant `setOpen(false)`: no pause, no close animation, `reducedMotion` unused.
- Autopilot / Cancel labels stay. Live refuse / cancel copy stays text in `#rw-galaxy-ap-live`.
- Color is not the only cue.
- Chart labels are not hit targets (P2 sibling).
- HUD-01 hub and Digit 0/8/9 untouched.
- KeyM still toggles the chart. No new bind.

### Findings

No blocker. No major.

#### 💡 Suggestion: HUD Cancel often hidden on the success frame

**Location:** `src/systems/galaxychart.js:656–661`; `src/systems/hud.js:1714–1717` (cite only)

**Issue:** `.rw-autopilot` stays `is-hidden` until the next HUD frame after engage. This click therefore usually blurs and does not focus Cancel.

**Fix:** None in this PR. Merge law §0.19: if the chip is still hidden this frame, blur is enough. Do not write `hud.js`. Do not defer with a timer.

### Checklist

- [x] Focus not left in `aria-hidden` chart after success
- [x] Authored HUD selector only when ancestor `.rw-autopilot` lacks `is-hidden`
- [x] Refuse keeps map + live line
- [x] Cancel-while-open keeps map + cancel line
- [x] No toast on success
- [x] No overlay pip on the aim glass
