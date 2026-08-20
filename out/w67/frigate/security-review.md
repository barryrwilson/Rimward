## Security Review: plated frigate yard catalog (Wave 67 leftover)

### Risk Level: Low

### Summary
The diff only adds `frigate` to plated `CORE_STOCK` and sets `MIN_REP.frigate = 25`. Credits still debit on the existing `purchaseYardHull` path (authored `YARD_LIST_UU`, hangar cap, reputation gate). No XSS, no proto pollution, no new persist keys.

### Findings

No CRITICAL or HIGH findings.

#### 🟢 LOW: Known-rank quote still applies a 5% rank discount when buy is refused
**Location:** `src/game/shipyard.js:87-97` (`yardPrice`) and `listYardOffers` / desk price line (unchanged)
**Issue:** `yardPrice('frigate', 10)` returns `Math.round(80000 * 0.95)` because Known is rank tier 1. `purchaseYardHull` still refuses with `reputation` because `minRepFor('frigate') === 25`.
**Impact:** The desk can show a discounted quote for a hull the player cannot buy. Ace already had this pattern at Stranger vs min-rep 10.
**Fix:** None in this leftover. Rank discount and min-rep stay separate on purpose. Do not invent a save-blob price.
**Status:** documented, no code change

### Passed Checks
- [x] No secrets in code
- [x] Credits debit uses authored `YARD_LIST_UU.frigate === 80000` plus `rankFor` — not a hangar-row `price` field
- [x] Reputation gate: `rep < minRepFor(classKey)` returns `{ ok: false, reason: 'reputation' }` before debit
- [x] Hangar cap: `canAcceptPurchase` still blocks overfill
- [x] Buy lock: `buyInFlight` still blocks double debit
- [x] Purchase does not remount (`mountedId` restored if mutated)
- [x] `hasOwn` stays proto-safe (`Object.prototype.hasOwnProperty.call`)
- [x] `canReleaseSku` unchanged; Unknowables still force living on their light SKU only
- [x] Independent / hollow stay empty stock (no class-key dump)
- [x] Beautiful Ones stock stays `light, cutter, heavy` (no frigate, no ace)
- [x] `cargoCapacity: 20` on purchased rows unchanged
- [x] No new `WORLD_FIELDS`, no new `localStorage` key, `state.js` untouched
- [x] No desk / `station.js` rewrite; Digit 8 still maps to offer index 5 via `hullIndexForDigit`
- [x] UI strings remain `textContent` via existing desk `h()`
- [x] Probe: Known refuse leaves credits and hangar length unchanged

### Recommendations
1. Keep min-rep and rank discount as two gates. Do not fold Trusted into `yardPrice`.
2. Leave Digit 8 mapping in `shipyard-desk.js`. Offer index 5 is now `frigate`.

### Method
Self-applied orchestrator `security-review.md` checklist plus persona `security-auditor.md`. Mode: deep audit of the credit/reputation purchase path for the new SKU only.
