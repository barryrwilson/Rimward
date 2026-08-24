## Security Review: AP pathing (nav hop / live gate / jump)

### Risk Level: Low

### Summary
The change stays inside the client sim. Jump emit is still `gate.js` only. Route ids still pass `sanitizeSystemId`. No new persist key, no `innerHTML`, no lock write.

### Findings

No CRITICAL or HIGH findings.

#### 🟢 LOW: Module-scope live gate map

**Location:** `src/systems/gate.js` `_liveNavGate`  
**Issue:** One process-wide Map, not per `ctx`.  
**Impact:** A second `initGate` would overwrite coords. The game boots one ctx.  
**Fix:** Not required for this product.  
**Status:** accepted

### Passed Checks
- [x] No secrets in code
- [x] System ids sanitized (`sanitizeSystemId`, reserved set)
- [x] `Map` for live lookup (no `__proto__` object key)
- [x] No `innerHTML`
- [x] No `jumpRequested` from `autopilot.js`
- [x] `jumpRequested.to` is still `near.to`
- [x] Restore still forces `world.nav.autopilot === false` (unchanged `writeNav`)
- [x] `state.js` not edited
- [x] No new WORLD_FIELDS key
- [x] `ctx.js` has no `ctx.autopilot` substring
- [x] Phantom stuffed hops are healed or blocked, not flown

### Recommendations
1. Keep `gate.js` as the only jump emitter.
2. Do not add a second persist flag for autopilot.
