## Security Review: Wave 120 PR1 toast-flood

### Risk Level: Low

### Summary
Toast copy stays on `textContent`. Authored `source` tokens only. No persist of linger clocks. No unbounded Map. No innerHTML. No HIGH or CRITICAL findings.

### Findings

No 🔴 CRITICAL.  
No 🟠 HIGH.

#### 🟢 LOW: `e.reason` still concatenates into SAVE BLOCKED copy
**Location:** `src/systems/hud.js:600`  
**Issue:** Berth/manual path writes `'▲ SAVE BLOCKED — ' + (e.reason ?? 'hostiles near')`.  
**Impact:** None as XSS: assignment is `textContent` (`hud.js:1210`). Authored reasons in `save.js` (`hostileEncounterBlock`, mid-jump literal). Unknown source fails closed to this path, still not HTML.  
**Fix:** None required. Do not switch to `innerHTML`.

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `hud.js`
- [x] `pushToast` uses `textContent` only
- [x] `el()` still uses `textContent`
- [x] No `for-in` of a save blob into toast copy
- [x] `e.source === 'autosave'` strict; else berth/manual copy
- [x] Emit tokens `'autosave'` / `'berth'` only at existing `saveBlocked` sites
- [x] Linger is five rows, not `new Map()`
- [x] No `WORLD_FIELDS` / `localStorage` toast clocks
- [x] No `ctx.flags.paused` write from HUD
- [x] Overlay-policy import in `save.js` not reverted
- [x] No toast / `#hud` z-index raise
- [x] `aria-live` stays `polite`

### Recommendations
1. Keep `textContent` on any later toast copy change.
2. Do not persist linger `lastShown`.

### Method
Self-applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` plus `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. No subagent spawn in this worker.

### Second pass
Re-read `hud.js` toast helpers, `pushToast`, expire, `save.js` emit sites, `hud.css` hide rule. Still no HIGH/CRITICAL.
