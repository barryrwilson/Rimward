## Security Review: HUD-02 PR1 target facing class tokens

### Risk Level: Low

### Summary
The rail writer copies an allowlisted ship-class token onto `.rw-combat-target` only. It does not interpolate lock strings into HTML or CSS. Q-ship glyphs follow cover class. No CRITICAL or HIGH.

### Findings

#### 🟢 LOW: `data-class-key` is a DOM reflection of an allowlisted hull key
**Location:** `src/systems/hud.js` `applyTgtClassKeyAttr` / `lockClassToken`
**Issue:** The browser reflects `data-class-key` on the target rail.
**Impact:** An observer can read visible lock class from the overlay. Hidden cutter stats stay off the attribute while `qship && !revealed`.
**Fix:** Keep `hasOwn` `SHIP_CLASSES` before any dataset write. Do not persist the attribute.
**Status:** accepted — same class as the live player writer.

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] No `for-in` merge into `#hud.dataset` or `tgtRail.dataset`
- [x] Prototype keys (`__proto__`, `constructor`) omit via `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)`
- [x] Unrevealed Q-ship uses `coverClass ?? 'freighter'`, never hidden `state.classKey`
- [x] Mk II name pierce does not change `coverOn`
- [x] Hide rail deletes the attribute immediately
- [x] Lock class is not written to `#hud`
- [x] No new persist key / `WORLD_FIELDS` / session class picker
- [x] CSS selectors are authored literals, not concatenated from lock strings
- [x] No secrets, Digit theft, or UU

### Recommendations
1. Keep the target writer on `.rw-combat-target` only.
2. Do not later unmask the glyph from scanner pierce.
