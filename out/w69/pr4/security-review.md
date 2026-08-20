## Security Review: AST PR4 HUD/nav find-aid (`jump.js`, `hud.js`)

### Risk Level: Low

### Summary
PR4 emits a second authored `commLine` and writes a group-3 context verb via `textContent`. Copy is a constant plus a finite integer. No new events, persist keys, or HTML sinks.

### Findings

No critical, high, or medium issues.

#### 🟢 LOW: Toast path still concatenates event `text`
**Location:** `src/systems/hud.js:395-403`
**Issue:** Existing `toastForEvent` assigns `e.text` to a toast node with `textContent` (`pushToast` ~871). This PR’s belt line is authored plus `Math.round` of `hypot`. A hostile `field.center` cannot inject markup.
**Impact:** None with the current sink. If a later change used `innerHTML` for toasts, any `commLine.text` would become XSS.
**Fix:** Keep `textContent`. Do not route comm lines through HTML.
**Status:** accepted (existing path; this PR does not widen it)

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in `jump.js` or `hud.js`
- [x] Belt and mine strings are payload / `textContent` only
- [x] `n` is coerced through `Math.round` + `Number.isFinite` (else `0`)
- [x] No new frozen event (reuse `commLine` `{ text, from }`)
- [x] No new `settings.js` / `localStorage` key
- [x] No `mystery.charted` / chart-mark writes
- [x] No `for…in` on `ORE_TYPES` / `fieldOre`
- [x] HUD does not write `ctx.input`, `ctx.targets`, or persist
- [x] Jump still emits only `systemLoaded` + `commLine`
- [x] Prompt order: Dock / Jump / Hail / Target before mine; rock lock skips the cue

### Recommendations
1. Keep HUD toasts on `textContent`.
2. Do not add a settings key for this find-aid.

### Re-review
After comment trim: no new sinks.
