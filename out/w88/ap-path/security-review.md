## Security Review: live autopilot pathing (tangent rework)

### Risk Level: Low

### Summary
Client-only flight-command math. Tangent detour and chord restore do not add persist keys, DOM writes, teleports, or secrets. NaN still fail-closed. No HIGH/CRITICAL findings.

### Findings

None.

### Passed Checks
- [x] No secrets, API keys, or credentials
- [x] No innerHTML / DOM injection
- [x] No new persist keys; `state.js` / `WORLD_FIELDS` untouched
- [x] No `input.*` writes; no mesh writes
- [x] No `jumpRequested` emit
- [x] Channel keys unchanged
- [x] Non-finite ship/gate positions disengage (`missingGate`)
- [x] `planApPath` returns `ok: false` on NaN input
- [x] Detour walk is bounded (`DETOUR_ITERS = 8`); no infinite loop
- [x] Bias restore re-checks the **chord**, not only the aim point

### Recommendations
1. Keep path math in `ap-path.js` with no ctx writes.
