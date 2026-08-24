## Security Review: w90 AP live jump-zone origin (re-dispatch)

### Risk Level: Low

### Summary
Self-applied checklist on the rebuild re-bind. Lookup still returns primitive `{x,y,z}` only. No authored-ghost fallback. Reserved ids unchanged.

### Findings

None at CRITICAL/HIGH.

#### 🟢 LOW: Last rebuild owns the module live list
**Location:** `src/systems/gate.js` rebuild `_liveAssemblies = assemblies`
**Issue:** A later `initGate` (models / boot-test throwaways) still steals lookup until the live graph's `gate.update` rebuilds.
**Impact:** Headless extra `initGate` only. Player loop has one instance; drift rebuild rebinds.
**Status:** accepted — matches the previous Map “last remember wins” contract.

### Re-review
WAVE85 `liveMatch`/`zoneJump` and WAVE88 `noOrbitCmd` true on `npm run test:boot`. Auction hub pins still PASS. No new HIGH/CRITICAL.

### Passed Checks
- [x] No secrets
- [x] No `innerHTML`
- [x] Reserved hop / stuffed `currentSystem` fail closed
- [x] No mesh leak from lookup
- [x] Overlay label `textContent`
- [x] AP does not emit `jumpRequested`
