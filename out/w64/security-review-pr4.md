## Security Review: Wave 64 PR4 catalog + buy adds hangar row

**Scope:** `src/game/shipyard.js`, `src/systems/shipyard-desk.js`, `src/game/hangar.js` purchase helpers, `src/game/save.js` `requestAutosave`, `src/systems/station.js` Esc cancel, `src/ui/screens.css` buy-row styles, `scripts/boot-test.mjs` WAVE64 buy pins.
**Mode:** Deep audit (price/rep trust, XSS, prototype keys on new rows, double debit).
**Pass:** first pass after WAVE64 buy pins.

### Risk Level: Low

### Summary
Catalog cost and min-rep live in code. Live credits and `reputation[dockFaction]` gate the debit. Confirm papers is required. New hangar rows pass sanitize before use. Names and notices use `h()` `textContent`. No HIGH or CRITICAL finding.

### Findings

#### 🟢 LOW: `factionLabel` reads `FACTIONS[faction]` without `hasOwnProperty`
**Location:** `src/systems/shipyard-desk.js:63-65`
**Issue:** A tampered dock faction token that matches an Object builtin (`constructor`) can print a function name. Render still uses `textContent`.
**Impact:** Display only. No object-key write and no debit.
**Status:** accept — dock faction comes from `ctx.systems[id].faction`; stock lookup already uses `hasOwn`.
**Justification:** Same desk helper as PR3. XSS pin still true.

#### 🟢 LOW: `buyRefuseLine` indexes freeze with a raw reason token
**Location:** `src/systems/shipyard-desk.js:42-44`
**Issue:** `BUY_REFUSE_LINES[reason]` can hit inherited keys if a caller passes `__proto__`.
**Impact:** Notice becomes a coerced object string on `textContent`. Purchase already refused.
**Status:** accept — reasons are authored string literals from `purchaseYardHull`.
**Justification:** Not attacker-controlled in the desk path.

### Passed checks
- [x] Catalog is code (`YARD_LIST_UU` / `YARD_STOCK`). Blob `price` / `bookValue` / slot `minRep` are not read
- [x] `credits < price` refuse, then debit. No negative purse
- [x] Reputation is `ctx.world.reputation[dockFaction]` with `hasOwn` + finite; fail closed to 0
- [x] Gate is dock faction, not origin or `ctx.player.faction`
- [x] Confirm required; Digit 3+ on Yard selects papers and does not debit
- [x] `buyInFlight` refuses re-entry while a buy runs
- [x] Stock row is `sanitizeHangarRecord` before `addPurchasedHull`
- [x] `classKey` must be `SHIP_CLASSES` ∩ this dock’s stock
- [x] `faction` is dock flag, never `data-faction`
- [x] `hullKind` from table; Unknowables forced `'living'`
- [x] Prototype keys dropped by hangar sanitize; buy pins cover JSON `__proto__` / `constructor` / `price`
- [x] Hull names, catalog lines, notices: `textContent` via `h()`
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` on the buy path
- [x] `requestAutosave` writes only `rimward-save-v1`
- [x] Hangar Digit 3+ still `switchTo` only. Buy does not remount
- [x] No secrets in new files

### Recommendations
1. Keep catalog prices in code. Do not read hangar blob prices.
2. Keep Digit 3+ bound to the pane read at keydown.

### Re-review
No HIGH/CRITICAL. No code change after the first pass. Findings stay LOW.
