## Security Review: Wave 65 SHP catalog depth (cutter + ace)

**Scope:** `src/game/shipyard.js` stock lists + `MIN_REP`; probe `out/w65/catalog/probe.mjs`. Desk and hangar read-only.
**Mode:** Deep audit (price/rep trust, catalog vs save, double debit, class-key allowlist).
**Pass:** first pass after catalog pins.

### Risk Level: Low

### Summary
This slice only expands authored buy lists and min-rep floors. Cost still lives in `YARD_LIST_UU`. Hostile `rep < 0` still refuses before floors. Ace needs Known (`minRep` 10). No HIGH or CRITICAL finding.

### Findings

None at CRITICAL or HIGH.

#### 🟢 LOW: `listYardOffers` still lists ace below the Known floor
**Location:** `src/game/shipyard.js:104-117`
**Issue:** Offers include `ace` at stranger rep. `purchaseYardHullUnlocked` later refuses (`rep < minRepFor`).
**Impact:** Desk can arm Confirm papers. Debit does not run. Credits stay put.
**Fix:** Filter offers by live `dockReputation` if product wants a hidden SKU.
**Status:** accept — catalog may show the row; debit path re-checks floors. Probe `ace.minRep.refused` pins no debit.

### Passed Checks
- [x] Catalog is code (`YARD_LIST_UU`, `YARD_STOCK`, `MIN_REP`). No `ctx.player.bookValue` or blob price
- [x] Rank discount is hull list only. No `buyMult` / epic stack
- [x] Hostile `rep < 0` is no sale, not a surcharge (`purchaseYardHullUnlocked` `rep < 0 || rep < minRep`)
- [x] Ace floor 10. Light and cutter stay 0
- [x] Independent / hollow stay empty (`yardStockFor` miss → `[]`)
- [x] No `frigate` in any faction stock. Price table still holds `80000`
- [x] Stock is authored arrays. Not `Object.keys(SHIP_CLASSES)`
- [x] `classKey` must be `SHIP_CLASSES` ∩ this dock’s stock
- [x] `hullKind` from table. Unknowables still forced `'living'`
- [x] Hangar cap 8 still refuses extra buys
- [x] `buyInFlight` still blocks a second debit
- [x] Credits clamp after debit. No negative purse
- [x] Buy still does not remount (`mountedId` restore)
- [x] Desk still uses `textContent` via `h()` (not edited)
- [x] Confirm papers still required. Digit 3+ still selects papers only
- [x] Five plated SKUs fit Digit 3–7. Digit 0 stays row 8 (empty)
- [x] No secrets in changed files
- [x] Probe hostile + ace-floor purchases refuse with no debit

### Recommendations
1. Keep WAVE64 live Digit-3 pin on `light`. Cutter is Digit 4. Ace is Digit 7.
2. Update WAVE64 `stock.freeholdNoFrigate` so it no longer requires missing ace/cutter.

### Re-review
No HIGH/CRITICAL. No catalog-path code change after the first pass.
