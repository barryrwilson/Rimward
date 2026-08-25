## Security Review: Wave 118 PR1 overlay-priority

### Risk Level: Low

### Summary
Play-card mutex, hail defer, and session calm live in `overlay-policy.js` plus hail/chart/berth open gates. No persist of overlay flags. No HTML parse. Hail Digit shortcuts fail closed when settings, title, or models own the screen, and when `ctx.flags.paused` is set.

### Findings

None at 🔴 CRITICAL or 🟠 HIGH.

#### 🟢 LOW: Settings ownership is a DOM walk, not an exported flag
**Location:** `src/systems/overlay-policy.js:49-69`
**Issue:** `settingsOwnsScreen` matches a body-child panel with `aria-label='Settings'`. A later overlay that copies that label could block hail digits.
**Impact:** Hidden hail Digit1–9 would not resolve (fail closed). Not a privilege gain.
**Fix:** Optional later: settings.js could expose `isOpen()` (out of this write-set).
**Status:** open — accepted; settings.js is forbidden this wave.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `overlay-policy.js` or hail overlay path
- [x] Hail lines and buttons use `textContent` / `createElement`
- [x] Authored overlay ids only (`hail` / `chart` / `berth`); no `for-in` of save blobs
- [x] No new `WORLD_FIELDS` / localStorage key; `ai.calmUntil` remains session
- [x] `flags.hailOpen` / `flags.berthOpen` are session booleans, not persist
- [x] Hail Digit1–9 skip while settings/title/models own the screen
- [x] Hail Digit1–9 skip while `ctx.flags.paused` (pause banner z 50; hail z 40). Helper reads paused; it does not assign it. Hail card stays open.
- [x] Helper never writes `ctx.flags.paused`; hail/chart/berth assign none
- [x] Unknown overlay id skips open
- [x] Deferred hail drops if ship is gone, destroyed, or still in calm
- [x] Missing-helper path: consumers `try/catch` and skip mutex; never freeze the sim
- [x] Portrait `src` still comes from `portraitFor` (unchanged)

### Recommendations
1. Keep settings.js out of this leftover; Digit skip via labelled dialog is enough for PR1.
2. Do not persist `calmUntil` or overlay flags in a later wave.

### Method
Checklist from `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` plus persona `security-auditor.md`. Mode: deep audit of overlay open/Digit/defer data flow. Re-read after pin fixes.
