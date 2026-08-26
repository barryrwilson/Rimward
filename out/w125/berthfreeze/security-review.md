## Security Review: CTL-03 PR1 berthHold helm latch (autopilot.js)

### Risk Level: Low

### Summary
Re-dispatch: `inputBreak` now treats `berthHeld` as non-helm. Session boolean only. No persist, no pause impersonation, no HTML, no HIGH/CRITICAL.

### Findings

None open at CRITICAL or HIGH.

#### 🟢 LOW: Slot meta still concatenates restored system name
**Location:** `src/game/save.js` refreshBerth (pre-existing)
**Issue:** `sysName` from `SYSTEMS[sysId] ? name : sysId` then `textContent`. Hostile sysId cannot inject HTML.
**Impact:** None as XSS. textContent.
**Fix:** Not this PR. Do not switch to innerHTML.

### Passed Checks
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `src/game/autopilot.js`
- [x] No secrets, tokens, or credentials in the AP hold path
- [x] `berthHeld` is a fail-closed boolean read (`overlay-policy.js` try/catch → false)
- [x] Hold does not write `flags.paused`
- [x] Hold does not skip the systems loop
- [x] No new WORLD_FIELDS / localStorage key
- [x] `jumpRequested` still only emitted from `gate.js`
- [x] Helm under hold cannot `disengage('input')`; `nav.autopilot` stays true
- [x] Leftover reticle hypot after RESUME is unlatched until hypot < `AP_STEER_BREAK`
- [x] Chart still unlatches steer via `chartOpen` (boot-test string pin stays)
- [x] Restore AP path is still `sanitizeNav` (not this pack)

### Recommendations
1. Keep hold as a session boolean. Do not map hold onto pause.
2. Do not persist `berthHold`.

### Re-review
After `helmSteerLatched` + `inputBreak` early `''` while held: still no CRITICAL/HIGH.
