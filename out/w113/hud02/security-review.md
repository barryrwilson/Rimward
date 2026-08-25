## Security Review: HUD-02 PR1 living facing class tokens

### Risk Level: Low

### Summary
Player `classKey` reaches the DOM only after a prototype-safe `SHIP_CLASSES` hasOwn allowlist, and only while family is bio. No `innerHTML`, no CSS concatenation, no new persist key, no Digit bind. Unknown / `__proto__` / mech omit the attribute.

### Findings

No CRITICAL or HIGH findings.

#### 🟡 MEDIUM: Hangar `classKey` is already persisted; HUD mirrors it to a DOM attribute
**Location:** `src/systems/hud.js` `classKeyToken` / `applyClassKeyAttr`
**Issue:** A hostile save can already store a string `classKey`. PR1 copies an allowlisted token onto `#hud.dataset.classKey`.
**Impact:** Attribute injection of a known class name only (`light` / `heavy` / `ace` / `cutter` / `frigate` / `freighter`). Not HTML, not CSS text, not a new `WORLD_FIELDS` key.
**Fix:** None in PR1. Allowlist + authored CSS is the freeze. Do not interpolate the raw string into HTML or style text.
**Justification:** Contract §0.4 / §0.7. Fail closed omits unknown keys.

#### 🟢 LOW: `dataset.classKey` write is a string attribute
**Location:** `src/systems/hud.js` `root.dataset.classKey = key`
**Issue:** Browser reflects `data-class-key`.
**Impact:** Only allowlisted literals are assigned. CSS selectors are authored in `hud.css`.
**Fix:** Keep hasOwn. Never assign `raw`.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] No SVG markup from `classKey`
- [x] No concatenated CSS from save strings
- [x] `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)` before dataset write
- [x] `__proto__` / `constructor` / unknown omit
- [x] Mech family omits `data-class-key`
- [x] No `state.js` write; no `ctx.player.classKey` / `hullKind` write
- [x] No `world.hudClass`; no `rw-hud-class` session key
- [x] `rw-hud-family` stays mech|bio
- [x] Lock / target `classKey` is not read
- [x] No Digit 0/8/9 steal
- [x] No new DOM on `.rw-reticle`
- [x] Fail closed never throws

### Recommendations
1. Keep WAVE113 boot pins that tick `__proto__` and `nope`.
2. Do not add plated class glyphs that interpolate keys in a later PR.

### Pin-only follow-up (iteration 2)
Harness pin now reads `dataset.classKey` like WAVE62. Omit still requires a falsy/missing token after `__proto__` / `nope` / mech. No new XSS surface. Stub `dataset` is a plain object; `delete` still omits.
