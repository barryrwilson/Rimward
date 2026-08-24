## Security Review: NAV-04 galaxy-map hover (Wave 96 impl)

### Risk Level: Low

### Summary
Deep audit of `src/game/chart-hover.js`, hover paths in `src/systems/galaxychart.js`, and `.rw-galaxy-hover*` CSS. No CRITICAL or HIGH findings after proto/id sanitize, `textContent`-only DOM, allowlisted `standingRead`, and no persist/emit.

### Findings

None at 🔴 CRITICAL or 🟠 HIGH.

#### 🟢 LOW: `svgEl` still uses `Object.entries(attrs)`

**Location:** `src/systems/galaxychart.js` `svgEl`  
**Issue:** Untrusted attribute **names** would inject SVG.  
**Impact:** None with current call sites. Hover marker uses a literal map (`class`, `cx`, `cy`, `r`, `fill`).  
**Fix:** Keep literal attr maps only (existing NAV-01 law). No change required.

### Passed Checks

- [x] No secrets, API keys, or credentials
- [x] No `innerHTML` in `chart-hover.js` or `galaxychart.js`
- [x] Names via `textContent` after `stripControlChars`
- [x] `sanitizeSystemId` on every `data-system-id` (reserved / proto / unknown → no panel)
- [x] Unknown political path does not `standingRead` a non-FACTIONS key
- [x] `standingRead` only after `Object.hasOwn(FACTIONS, key)` and reserved-key reject
- [x] No `world.mystery` read; no mystery module import
- [x] No new `WORLD_FIELDS` / `localStorage` key
- [x] Hover does not write `world.nav` or `world.reputation`
- [x] No `ctx.emit` from `hoverModel` or hover listeners
- [x] Hover id is module-local, not a `ctx` field
- [x] Click handler does not `preventDefault` / `stopPropagation`
- [x] Hover listeners do not call `plotRoute` / `clearRoute` / `tryEngage`

### Recommendations

1. Keep hover ids behind `sanitizeSystemId`.
2. Do not add `innerHTML` or native `title` tooltips later.
