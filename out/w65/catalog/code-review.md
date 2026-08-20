## Code Review: Wave 65 SHP catalog depth (cutter + ace)

**Scope:** authored buy lists in `src/game/shipyard.js`; pins in `out/w65/catalog/probe.mjs`.
**Pass:** first pass after `node --import ./scripts/with-css-stub.mjs out/w65/catalog/probe.mjs`.

### Summary
Plated yards now sell light, cutter, heavy, freighter, ace. Beautiful sells light, cutter, heavy. Unknowables stay light-only. Independent and hollow stay empty. Frigate stays off buy lists. No blocker or major.

### What's done well
- `CORE_STOCK` order matches the brief: `['light', 'cutter', 'heavy', 'freighter', 'ace']`. Digit 3 still selects light.
- `LIVING_STOCK` adds cutter and omits ace. Career fork for Beautiful stays living and non-capital.
- `MIN_REP` names every sold class. Ace is Known (10). Light and cutter stay 0.
- Header no longer claims first-slice lists omit ace/cutter. Frigate omit stays explicit.
- `YARD_LIST_UU` still holds cutter 11000, ace 28000, frigate 80000. `yardPrice` still uses rank only.
- `listYardOffers` / `purchaseYardHull` iterate stock. No desk rewrite.
- Desk already supports 8 rows (digits 3–9 and 0). Five plated offers fit. Confirm papers still required.
- Probe pins stock, prices, min-rep, list offers, hostile refuse, and ace floor refuse.

### Findings

#### 🟡 Minor: WAVE64 buy pin will fail on ace/cutter
**Location:** `scripts/boot-test.mjs:12764-12765` (read-only this task)
**Issue:** `stock.freeholdNoFrigate` currently also requires `!includes('ace') && !includes('cutter')`.
**Fix:** Orchestrator must split the pin: no frigate, yes cutter, yes ace.
**Status:** accept — this task must not edit `scripts/boot-test.mjs`.

#### 💡 Suggestion: `listYardOffers` does not hide ace below Known
**Location:** `src/game/shipyard.js:104-117`
**Issue:** Stranger docks still list ace. Purchase refuses on floor.
**Fix:** None required. Brief asks freehold offers to include cutter and ace.
**Status:** keep — listing is the catalog. Gate is the debit.

### Resolved this pass
None. No HIGH/CRITICAL.

### Verdict
Approve catalog depth. Desk Digit 3+ papers still index stock. Five plated SKUs do not overflow the 8-row desk. Do not sell frigate.

### Re-review
No blocker or major. Stock, floors, and probe pins are true. Boot-test WAVE64 stock pin needs a later update.
