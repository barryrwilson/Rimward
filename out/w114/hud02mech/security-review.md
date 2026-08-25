## Security Review: Wave 114 HUD-02 PR1 plated class hint

### Risk Level: Low

### Summary
PR1 extends the live allowlisted `classKeyToken` writer to mech family and authors static CSS selectors. No XSS sink, no prototype write, no persist key, no Digit theft. Unknown / `__proto__` / `constructor` omit the attribute.

### Findings

No 🔴 CRITICAL or 🟠 HIGH findings.

#### 🟢 LOW: `data-class-key` is a DOM reflection of an allowlisted hull key
**Location:** `src/systems/hud.js:101-114`
**Issue:** `root.dataset.classKey = key` writes a player hull token into the HUD root. The token is only a `hasOwn` `SHIP_CLASSES` string (`light`/`heavy`/`ace`/`cutter`/`frigate`/`freighter`). CSS is authored literals, not concatenated from save strings.
**Impact:** None exploitable. A hostile save still cannot inject markup or CSS.
**Fix:** None. Fail-closed omit already drops non-allowlisted keys.
**Status:** accepted — allowlist + authored CSS is the contract control

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] No SVG or HTML built from `classKey`
- [x] `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)` before any dataset write
- [x] `__proto__`, `constructor`, non-string, unknown → `''` → `delete root.dataset.classKey`
- [x] Player mounted `ctx.player.classKey` only; lock/target classKey ignored
- [x] One writer (`classKeyToken` + `applyClassKeyAttr`); no second dataset path
- [x] CSS selectors are static `#hud[data-family="mech"][data-class-key="…"]` — no interpolation
- [x] Mech class rules do not set fill color as the class cue (`border-right-width` only)
- [x] No new `WORLD_FIELDS` / `world.hudClass` / `rw-hud-class` / session class picker
- [x] `state.js` not written; Digit 0 shipyard string untouched in `station.js`
- [x] Family not mech: mech class CSS does not match; allowlisted attribute is not deleted
- [x] No secrets, no persist of HUD class, no Digit/SKU theft

### Recommendations
1. Keep WAVE114 pins on dataset + `hasOwn` (do not switch to raw `getAttribute` writes).
2. Do not later interpolate `classKey` into style strings or SVG.
