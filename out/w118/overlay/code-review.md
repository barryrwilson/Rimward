## Code Review: Wave 118 PR1 overlay-priority

### Summary
Mutex, hail defer, and calm gates match the Wave 117 merge law. Chart write-set is `setOpen` / KeyM only. WAVE118 boot pins all true. WAVE117 `showApLive` / chart-open-on-engage still present.

### What's done well
- One helper owns authored ids, defer slot, and boolean flag reads.
- Incoming `hailOpened` still runs; only `openCard` is skipped on defer.
- Salvage `letGo` writes `ai.calmUntil = world.time + 30` on the same path as live let-go.
- KeyM/KeyL still close when already open; mutex only refuses **open**.
- Consumers catch helper throws so a missing helper does not stop the loop.
- `showApLive` call sites in `galaxychart.js` are unchanged.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟠 Major: Hail Digit1–9 under pause banner
**Location:** `overlay-policy.js` `hailDigitsAllowed`
**Issue:** Pause is z 50 over hail z 40. `system.update` stops; window keydown does not. Digit1 could still `resolveIntent`.
**Fix:** `hailDigitsAllowed` returns false when `ctx.flags.paused` is truthy. No write of `flags.paused`. Hail stays open. Pin `digitSkipUnderPause`.
**Status:** resolved

#### 🟡 Minor: Digit skip does not re-test module `open`
**Location:** `src/systems/hail.js` Digit listener; `overlay-policy.js:175-184`
**Issue:** `hailDigitsAllowed` tests title/settings/models/chart/berth, not `flags.hailOpen`. The listener already returns if `!open`.
**Fix:** None required. Documented so a later reader does not add a flag check that would drop digits if `hailOpen` failed to write.
**Status:** open — accepted.

#### 💡 Suggestion: Settings detection is structural
**Location:** `src/systems/overlay-policy.js:49-69`
**Issue:** Relies on berth/settings both being body-level labelled dialogs. Berth uses `aria-label='Berth Records'`, so it does not collide.
**Fix:** None this wave.
**Status:** open — accepted.

### Passed
- Digit1 under pause does not resolve (WAVE118 `digitSkipUnderPause`).
- Hail / chart / berth cannot all paint (WAVE118 live pins).
- KeyM refused while hail; incoming hail defers while chart open; flush on close.
- No `flags.paused` assignment in helper, hail, chart, or berth overlay slice.
- No `innerHTML` in helper or hail overlay path.
- Digit 0 shipyard grep unchanged.
- No `state.js` / `autopilot.js` / `controls.js` / `hud.js` edits.

### Method
Checklist from `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` plus persona `reviewer.md`. Re-read after WAVE118 pin slice fix.
