## Security Review: NAV-09 PR1 itinerary last-hop gate type

### Risk Level: Low

### Summary
Re-dispatch changes `paintItinerary` to one `textContent` row per plotted leg. Hop ids still pass `sanitizeSystemId`. No `innerHTML`, no persist, no teleport, no `flags.paused` write.

### Findings

No CRITICAL or HIGH issues.

#### 🟡 MEDIUM: Wheel does not call `preventDefault`
**Location:** `src/systems/galaxychart.js` SVG `wheel` listener  
**Issue:** WAVE85 boot pin forbids `preventDefault(` in this file. Zoom still changes `viewBox`. Page scroll is unlikely because `html` overflow is hidden.  
**Impact:** If a host page can scroll, wheel might also scroll.  
**Fix:** Later boot-pin rewrite if playtest needs `preventDefault` on `wheel` only.  
**Justification:** Keep WAVE85 `noPrevent` green. Unchanged this re-dispatch.

#### 🟢 LOW: Filter `<select>` values are attacker-mutable in DevTools
**Location:** `applyFilters` / `systemPassesFilters`  
**Issue:** A user can set `#rw-galaxy-filter-faction` to an arbitrary string.  
**Impact:** None beyond hiding discs. The value is never used as an object key into `world`, never `eval`’d, never persisted.  
**Justification:** Compare-only; fail closed. Unchanged this re-dispatch.

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write`
- [x] Leg `from` / `to` pass `sanitizeSystemId`; empty ids skip the row
- [x] Itinerary lines are `li.textContent` only
- [x] Itinerary still hidden when `status !== 'plotted'` or path length < 2
- [x] Gate token still fail-closed `unknown` only when neither `hasGateTo` nor `hasHubRouteTo`
- [x] Itinerary still reads `cast.pirates` only; never clue / landmark `line`
- [x] No `jumpRequested`; no chart teleport
- [x] No `flags.paused` write (`flags.paused` is still a KeyM **read**)
- [x] Zoom / pan / filter stay session; no new `WORLD_FIELDS`
- [x] Prototype-safe loops (`hasOwn`); no `for-in` into `world`

### Recommendations
1. Keep session-only view state.
2. If wheel `preventDefault` is added later, retarget the WAVE85 pin.
