## Security Review: yard-preview (iteration 2)

### Risk Level: Low

### Summary
Iteration 2 only changes camera distance. It does not debit, remount, or write save state. No CRITICAL or HIGH findings.

### Findings

None at CRITICAL / HIGH / MEDIUM.

#### 🟢 LOW: Charter lookup uses classKey from the offer
**Location:** `src/systems/yard-preview.js:161-163`
**Issue:** `scaleFor(spec.classKey)` reads the charter table. `scaleFor` uses `Object.hasOwn` and falls back to light. The class key still comes from `listYardOffers`, not from HTML.
**Impact:** None. No markup injection.
**Fix:** None.
**Justification:** Existing desk data path.

### Passed Checks
- [x] No new `innerHTML`
- [x] No secrets
- [x] Preview remains look-only
- [x] Living path still uses `makeLivingHull`; plated path still uses `primeShipAsset` / `buildPlayerPlatedMesh`
- [x] Disconnect dispose unchanged

### Recommendations
1. Keep framing in this module. Do not copy fill-to-fit from the Models Browser.
