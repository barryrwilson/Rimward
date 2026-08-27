## Code Review: CTL-05 PR1 pause menu

### Summary

PR1 lands together: pause dialog actions, setPaused, title remount, berth open-from-pause, LOAD named-disable. KeyP guards stay. Overlay-policy still never writes paused. Settings FIELDS stay live-only. No Blocker or Major remain.

### What's done well

- `setPaused` writes `ctx.flags.paused` and `pauseEl` display together. Title on screen keeps the banner hidden.
- CONTINUE calls `ctx.setPaused(false)` so the banner cannot stay up.
- KeyP still ignores typing, models, and `#rw-title`.
- Berth KeyL still refuses open while paused. Menu-only `berthApi.openFromPause` bypasses that gate and still uses `canOpenPlayCard`.
- LOAD refuse in `loadFromSlot` is unchanged. SAVE still writes.
- Authored action ids with a list check. Unknown ids skip and do not unpause.
- `settings.js` not edited. Synthetic KeyO opens live Settings.

### Findings

#### Blocker

None.

#### Major

None.

#### Minor: Title remount capture registers after boot listeners

**Location:** `src/systems/title.js` remount `addEventListener('keydown', onTitleKey, true)`
**Issue:** Boot title registers capture first. Remount registers later. Capture still runs before bubble controls, so play keys stay swallowed. Models capture still registers only while models is open.
**Fix:** None required. Capture vs bubble is enough.

#### Minor: NEW GAME with no autosave from a remount does not unpause

**Location:** `src/systems/title.js` NEW GAME `!liveSave` path
**Issue:** Live boot path closes title and leaves pause to origins. From an in-run remount, origins is not on screen. CONTINUE is always shown on remount, and KeyP works after title close.
**Fix:** Do not steal NEW GAME. CONTINUE is the return path.

#### Suggestion: Optional settings setOpen export skipped

**Location:** `src/systems/settings.js`
**Issue:** SETTINGS uses synthetic KeyO and skips dispatch when Settings already owns the screen, so it does not toggle closed.
**Fix:** None. Contract allows this path.

### Honor hold

- No overlay-policy paused write
- berthHold not merged
- No new Digit, persist, teleport, credits
- No screens.css / origins / onboarding / hud writes
- No WAVE127 / WAVE132 / REDMARCH "fix"
