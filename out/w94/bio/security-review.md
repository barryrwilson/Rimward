## Security Review: Wave 94 STOCK + TRAIN + SEED

### Risk Level: Low

### Summary
Living yard stock, train dests, and Beautiful Market seed papers stay fail-closed. Dest keys, hull ids, and credits gates do not take untrusted catalog writes. No CRITICAL or HIGH findings.

### Findings

#### 🟡 MEDIUM: Seed grant can keep a row if the post-grant id check fails
**Location:** `src/game/bio-seed.js:109-128`
**Issue:** `grantLivingSeedRow` appends a hangar row, then a stem/id check can return `{ ok: false, reason: 'invalid' }` without a debit and without removing the row.
**Impact:** A free living `light` if the stem helper ever minted a non-`hull_seed_market_` id.
**Fix:** Stem is a frozen `seed_market` constant, so the path is not reachable from UI. Keep the check as belt-and-suspenders. Do not take a caller-supplied id on the Market path.

#### 🟢 LOW: Train dest is a caller string
**Location:** `src/game/hangar.js:803-808`
**Issue:** `trainMounted(ctx, destClass)` takes a string from Confirm papers.
**Impact:** A smashed dest cannot write `__proto__` or leave `LIVING_STOCK`. `livingTrainDests` uses `Array.includes` plus `hasOwnProperty` on `SHIP_CLASSES`.
**Fix:** None required.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in shipyard, hangar, bio-seed, desk, or station `h()`
- [x] `h()` uses `textContent` only
- [x] Hostile Beautiful (`rep < 0`) refuses buy, train, and seed (`No sale.`)
- [x] Train dests must be other `LIVING_STOCK` keys; same class refuses
- [x] Rank gate `minRepFor(dest)` on train Confirm
- [x] Seed id stem `seed_market`; never `hull_seed_gift`
- [x] Seed is not a `COMMODITIES` key and does not write cargo
- [x] Hangar cap 8 fail-closed; no remount on buy or seed
- [x] `trainInFlight` / `seedInFlight` / UI busy flags block double Confirm
- [x] Prototype-safe hull ids (`RESERVED_IDS`, `SAFE_ID`)
- [x] No standing write on train or seed success
- [x] Digit 0 stays dock Shipyard; Market Digit 1 only arms seed papers

### Recommendations
1. Keep Market seed on `stem: MARKET_SEED_STEM` only. Do not add an `id` override.
2. Unknowables dock worker must not drop `seedPending` chrome or `renderSeedPapers`.
