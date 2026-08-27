## Security Review: CTL-05 PR1 pause menu

### Risk Level: Medium (in-run overlay access) / Low after controls

### Summary

PR1 turns the copy-only pause banner into ACCESS buttons. Trust edges are pause paint, title remount, berth LOAD, and dim-ring click-through. No HIGH or CRITICAL remain after the landed controls: textContent only, title-skip stays NEW GAME, LOAD stays paused-gated with named disable, and pause hits freeze while settings/berth/title cover.

### Findings

#### CRITICAL

None.

#### HIGH

None open.

#### MEDIUM: Synthetic KeyO is not isTrusted

**Location:** `src/main.js` SETTINGS action; live `settings.js` KeyO listener
**Issue:** SETTINGS dispatches a KeyboardEvent with code KeyO. Settings does not check isTrusted. Title already uses this path. A page script could also dispatch KeyO.
**Impact:** Settings toggle from script. No new privilege; KeyO is already global.
**Fix:** Not this pack. Do not add expansion knobs.

#### LOW: ctx.berthApi / ctx.setPaused on the debug handle

**Location:** `window.__ctx` in `main.js`; `ctx.berthApi` in `save.js`
**Issue:** Harness and console can call openFromPause / setPaused.
**Impact:** Same as poking flags.paused today. Session only. Not persisted.
**Fix:** None. Test handle is existing policy.

### Passed Checks

- [x] No secrets in code
- [x] No innerHTML / insertAdjacentHTML / document.write on pause, title remount, or berth LOAD labels
- [x] Pause labels and berth meta use textContent
- [x] Authored action ids only (resume, settings, berth, title); prototype keys skip
- [x] No for-in onto ctx.flags
- [x] KeyP typing / models / #rw-title guards stay
- [x] TITLE remount does not set rimward-title-skip; NEW GAME reload still owns the marker
- [x] TITLE remount does not location.reload
- [x] LOAD while paused still returns in loadFromSlot; UI says LOAD — resume first
- [x] Overlay-policy still never writes flags.paused (main reads settingsOwnsScreen / overlayIsOpen / titleOwnsScreen only)
- [x] pauseEl / panel pointer-events none while covered; runPauseAction skips when covered (dim-ring cannot RESUME)
- [x] Persist none new; flags.paused and berthHold stay session flags
- [x] Settings FIELDS unchanged (no settings.js write)

### Recommendations

1. Verifier: confirm dim-ring around Settings/Berth does not unpause.
2. Verifier: confirm TITLE does not write rimward-title-skip.
3. Verifier: confirm LOAD stays refused while paused even if the button is forced enabled.
