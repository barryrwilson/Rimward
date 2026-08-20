## Code Review: plated frigate yard catalog (Wave 67 leftover)

### Summary
Plated `CORE_STOCK` now ends with `frigate`. The first five keys stay in order. Min-rep 25, list 80000, and existing purchase/confirm path match the leftover brief. Digit 8 is not stolen.

### What's done well
- Append-only stock change: `['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']`.
- `MIN_REP.frigate = 25`; ace stays 10; open SKUs stay 0.
- Header comment no longer says buy lists omit frigate.
- WAVE64 `freeholdHasFrigate` and WAVE65 `platedHasFrigate` flip old false pins instead of leaving them to fail.
- WAVE67 catalog pins cover plated presence, living/unk/indie/hollow omission, list price, Trusted/Sworn discounts, Known list-but-refuse, cargoCapacity 20, and Digit 8 index 5.
- Probe under `out/w67/frigate/probe.mjs` imports `shipyard.js` and `purchaseYardHull`.

### Findings

No Blocker or Major findings.

#### 🟡 Minor: WAVE67 `digit8Index` pin is a local arithmetic check
**Location:** `scripts/boot-test.mjs:13479`
**Issue:** `8 - 3 === 5 && CORE67[5] === 'frigate'` does not import `hullIndexForDigit` (the helper is not exported from `shipyard-desk.js`).
**Fix:** Optional later export. Manual check of `src/systems/shipyard-desk.js:76-79` already confirms Digit 8 → index 5. Desk was not rewritten.
**Status:** documented, no code change

#### 💡 Suggestion: Known "pays list" vs rank quote
**Location:** `src/game/shipyard.js:87-97`
**Issue:** The leftover text said Known 10 "pays list". `yardPrice` still applies Known's 5% because `rankFor(10).tier === 1`. Buy is refused, so no debit occurs.
**Fix:** Pins record the refuse (`reputation`) and leave `yardPrice` on the existing rank ladder. Probe also pins `yardPrice('frigate', 10) === Math.round(80000 * 0.95)`.
**Status:** accepted; matches "rank discounts still come from yardPrice + rankFor"

### Digit 8
`hullIndexForDigit(8)` returns `n - 3 === 5`. After append, offer index 5 is `frigate`. Digits 3–7 still map to light, cutter, heavy, freighter, ace. Digit 0 still maps to index 7 (empty slot). No desk or `station.js` edit.

### Test coverage
- Node probe: `node --import ./scripts/with-css-stub.mjs out/w67/frigate/probe.mjs` — ALL PINS TRUE.
- Boot WAVE67 block logs `wave67 catalog:` JSON and fails with `WAVE67 CATALOG FAIL`.
- Full `npm run test:boot` not run (orchestrator owns that).

### Method
Self-applied orchestrator `code-review.md` checklist plus persona `reviewer.md` on the worker diff only.
