## Security Review: HUD-06 PR1 home-station marker (`hud.js` / `hud.css`)

**Method:** self-applied `[security-auditor]` + `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. No general-purpose spawn tool in this worker.

### Risk Level: Low

### Summary

PR1 is session HUD chrome. Station name and distance go through `textContent` and `stripHudText`. There is no new persist key and no NPC projection. No CRITICAL or HIGH findings.

### Findings

None at CRITICAL or HIGH.

#### 🟢 LOW: Station name is not HTML-escaped in the string

**Location:** `src/systems/hud.js:2110-2117`  
**Issue:** `stripHudText` drops C0 controls only. A hostile authored name could contain `<` or `&`.  
**Impact:** None with `textContent`. The DOM does not parse HTML. `innerHTML` is absent in `hud.js`.  
**Fix:** Keep `textContent`. Do not switch to `innerHTML`.  
**Status:** accepted — fail-closed by sink.

### Passed Checks

- [x] No secrets in `hud.js` / `hud.css`
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write`
- [x] No `eval` / `new Function`
- [x] No new `localStorage` / `WORLD_FIELDS` key
- [x] Authored class names only (`rw-home-mark`, `rw-home-pip`, `rw-home-chevron`)
- [x] No `for-in` of save blobs into HUD nodes
- [x] Project `ctx.station.position` only; no NPC / unspawned banks
- [x] Missing / non-finite pose hides the mark; does not throw
- [x] Overlay hide reads `flags.hailOpen` / `chartOpen` / `berthOpen`; does not edit overlay-policy
- [x] TGT `edgeArrow` and NAV-02 `gateCue` transforms stay on their own nodes

### Recommendations

1. Keep POS HOME on `textContent` in any later serial.
2. Do not add a persist “home id” key (hostile save spoof).
