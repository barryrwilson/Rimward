## Code Review: Wave 64 PR4 catalog + buy adds hangar row

**Scope:** authored catalog, confirm-before-debit, hangar row add, no remount-on-buy.
**Pass:** first pass after WAVE64 buy pins.

### Summary
PR4 matches ShpDesign §6 and shared-contract §6. Buy adds a sanitized hangar row at the authored list price. Mounted id stays put. WAVE64 persist + remount + desk + buy pins are true. WAVE62 stays true. No blocker or major.

### What's done well
- `YARD_LIST_UU` and faction stock live in `shipyard.js`. First-slice lists omit ace / cutter / frigate.
- Independent and hollow catalogs stay empty. Generated docks reuse the same faction list.
- Rank discount is hull list price only (Sworn 15% / Trusted 10% / Known 5%).
- Hostile `reputation[faction] < 0` is no sale, not a surcharge.
- Confirm papers + Esc cancel. Digit 3+ cannot one-shot a debit.
- `parkMounted` then push. `purchaseYardHull` does not call `switchTo`.
- Stock gear is scanner 0, miningLaser 0, concealedMounts false, capacity 20, empty cargo, vitals from `createShipState`.
- `requestAutosave` shares the autosave key and the trySave combat/jump gates.
- Hangar Digit 1/2 still pane switches. Hangar Digit 3+ still `switchTo`.

### Findings

#### 🟡 Minor: hostile Yard still offers a Papers button
**Location:** `src/systems/shipyard-desk.js:135-148`
**Issue:** Hostile docks print `No sale.` then still list `3 — Papers`. Confirm later refuses and does not debit.
**Fix:** Hide the Papers buttons when `rep < 0`.
**Status:** accept — pin `liveH.credits` / `hostile.refused` already binds no debit.

#### 🟡 Minor: `canAcceptPurchase` sanitizes twice on the buy path
**Location:** `src/game/shipyard.js:181-182`, `src/game/hangar.js:100-105`
**Issue:** `purchaseYardHullUnlocked` sanitizes, then `canAcceptPurchase` sanitizes again, then `addPurchasedHull` sanitizes a third time.
**Fix:** Let `canAcceptPurchase` read length only when the caller already sanitized.
**Status:** accept — cap is 8; extra sanitize is cheap and fail-closed.

#### 💡 Suggestion: `HANGAR_CAP` re-export from shipyard.js
**Location:** `src/game/shipyard.js:4`, `src/game/shipyard.js:226`
**Issue:** Buy module re-exports hangar cap but does not use it.
**Fix:** Import cap from `hangar.js` at call sites.
**Status:** keep — harmless alias for pins.

### Resolved this pass
None. No HIGH/CRITICAL.

### Verdict
Approve for PR4 catalog + buy. WAVE62 still true. Known WAVE4/26/35 FAILs unchanged. WAVE64 persist + remount + desk + buy pins all true.

### Re-review
No blocker or major. No buy-path code change after the first pass. Minor hostile-list Papers note stays documented.
