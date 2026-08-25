# Code Review: MSN-03 remaining unique SKU design (Wave 108)

## Code Review: `docs/Msn03UniqueSkuDesign.md` + `out/w108/msn03sku/*`

### Summary
Markdown-only leftover matches live `CHAIN_GRANT` / `grantChainSku`. Deputize reuses `dart`/`auto`, protects light starters via `canSeat`, and forbids persist/Digit/`state.js` theft. No Blocker after the fail-UU caller freeze.

### What's done well
- Inventory cites live file:line (`jobs-chains.js` 28–33; `station.js` 3494–3526; `weapon-fit.js` 33–53; `save.js` 94–96).
- Reuse of the only two catalog ids is proven, not asserted.
- Light smash is answered with `MOUNT_TABLE` zeros, not a parked question.
- PR1 home is `jobs-chains.js` — cannot steal Digit 0/8/9 or write `state.js`.
- Unique four, splice, shop prices, graft/scanner/mining stay closed.
- Gilded is explicitly not an employer.

### Findings

#### 🟠 Major: Fail UU must not sit in `grantChainSku`
**Location:** first draft brief §4; **fixed** contract §1 + brief §4
**Issue:** A credits write in the helper would mint 2 UU without a parsed step 3.
**Suggestion:** Boolean helper; `finishChainStep` step 3 only; proto splice stays unpaid.
**Status:** fixed

#### 🟡 Minor: PR1 without PR2 leaves Veridian/Hollow light still without +2 UU
**Location:** contract §3 PR table
**Issue:** PR1 fills specs. Light `canSeat` false still silent besides `payQuoted` until PR2.
**Suggestion:** Accept. Same as live Freehold light. Do not block PR1 on Digit-safe table fill.
**Status:** documented; no brief change

#### 🟡 Minor: Hollow dart is an empty rack
**Location:** inventory §3; contract §0.1 write shape
**Issue:** Shop fills `ammoMax` 8; chain dart does not. Remaining Hollow dart matches live Freehold.
**Suggestion:** Keep match. Owner open question on all-dart ammo fill.
**Status:** documented deputize; do not remaining-only buff

#### 💡 Suggestion: Verify write for all four employers in PR2
**Location:** live `station.js` 3499–3502
**Issue:** Live can emit `Gear seated.` after a null hangar row.
**Suggestion:** Already in contract §0.1 / §1 step 6.
**Status:** named in PR2

### Verdict
Approve as design-only. Later impl must keep PR1 off `state.js` and off Digit 0/8/9. Brief ≡ contract on Digit/hub/`state.js`/persist/`canSeat`.
