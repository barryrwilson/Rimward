## Security Review: NAV-10 PR1 HUD approach-speed cue

### Risk Level: Low

### Summary
PR1 writes authored HUD text and a self-SPD lamp class. No `innerHTML`, no persist key, no Agent dock, no pause. Round-1 fail-closed null toggle is fixed.

### Findings

None open at HIGH/CRITICAL.

#### 🟢 LOW: Prompt copy still uses live Jump dest names (pre-existing)

**Location:** `src/systems/hud.js` ~2588–2590 (untouched Jump branch)
**Issue:** Jump verb still concatenates `destName` from `SYSTEMS`. PR1 does not change that path and still assigns via `promptVerb.textContent`.
**Impact:** None new. Station ids do not enter HTML.
**Fix:** Out of scope. Documented only.

### Passed Checks

- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] Authored literals: `DOCK_SLOW_VERB`, `'SLOW'`, `'MATCH'`, `'Dock'`, `'J'`
- [x] Lamp and prompt use `el()` / `textContent` / `classList`
- [x] No Agent `act dock`
- [x] No `state.js` / persist mute / bounce-off
- [x] No `flags.paused` write
- [x] No teleport past 2× snap
- [x] Missing pose / non-finite speed → omit SLOW; do not throw
- [x] `selfSlowLamp` null-guard before `classList` (round-1 HIGH fail-closed; **fixed**)

### Recommendations

1. Keep parent boot pins on `noInnerHtml` and `tgtSpeedOnly`.
2. Do not later reuse Hail02 keys for SLOW.

### Round 2

Re-read `hud.js` / `hud.css` after the null-guard. No new XSS or cheat paths. Residual LOW Jump dest is pre-existing and not this pack.
