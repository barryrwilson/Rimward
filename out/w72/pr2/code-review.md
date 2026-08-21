## Code Review: Wave 72 PR2 BIO obtain pins (`out/w72/pr2/probe.mjs`)

### Summary

The probe pins live yard obtain law against contract §3.2, §8, §3.3 gift defer, and §12 PR2. It imports real `shipyard.js` and `hangar.js`. Live yards already match: Beautiful `light,cutter,heavy`; Unknowables `light`; no frigate SKU; buy adds a living row and does not remount. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- `mockDock` sets `flags.docked`, `player.hullKind = 'living'`, and a starter hangar row so `parkMounted` cannot wipe starter kind on buy (`probe.mjs` ~49–80; matches `purchaseYardHull` + `addPurchasedHull`).
- Pin 1 / 2 use both `yardStockFor` and `listYardOffers` with exact classKey lists (not only `!includes('frigate')`).
- Pin 5 asserts new living row, `mountedId === hull_starter`, starter still living, and `player.hullKind` still living.
- Pin 6 asserts Unknowables light row is living with faction `unknowables`.
- Pins 7–8 require `reason === 'stock'` and unchanged hangar length (live `purchaseYardHullUnlocked` `!stock.includes`).
- Pins 9–10 cover `reputation`, `credits`, `full`, and extra `dock` refuse with no added row.
- Pin 12 greps the three named sources for `hull_seed_gift` (owner did not approve Sworn gift).
- Extra cutter/heavy Beautiful buys pin the rest of `LIVING_STOCK`.
- Catalog slice mutation pin catches a later in-place `YARD_STOCK` leak.

### Findings

#### 💡 Suggestion: Pin 11 is worker-scoped, not whole-tree `git diff -- src`

**Location:** `out/w72/pr2/probe.mjs:266-287`

**Issue:** The brief asked to assert `git diff -- src` empty. Parallel Wave 72 PR1 persist currently dirties `src/game/hangar.js` (grafted allowlist). A whole-tree empty check would fail this pin-only worker even when it did not write `src/`.

**Fix applied:** Fail if any `src/` path other than `src/game/hangar.js` is dirty. `shipyard.js` and `origins.js` must stay clean. When PR1 lands, dirty set empty still passes.

**Status:** accepted (parallel persist)

#### 💡 Suggestion: Gift grep is substring `includes`, three files only

**Location:** `out/w72/pr2/probe.mjs:289-296`

**Issue:** A later gift helper in `shipyard-desk.js` or `state.js` would not fail pin 12. Contract named `shipyard.js` / `hangar.js` / `origins.js`.

**Fix:** None required for PR2. Expand the grep if a gift PR is scheduled.

**Status:** open (contract-faithful)

### Test coverage

`node --import ./scripts/with-css-stub.mjs out/w72/pr2/probe.mjs` exit 0, 85 pins true:

1. Beautiful stock/offers exactly `light,cutter,heavy`; no frigate
2. Unknowables exactly `light`; no frigate
3. `hullKindFor` beautiful/unknowables `living`; plated `built`
4. Every Beautiful/Unknowables offer `hullKind === 'living'`
5. Beautiful light buy: ok, new living row, no remount, starter still living
6. Unknowables light: living row, force living
7. Beautiful frigate: `ok false`, `reason stock`, hangar unchanged
8. Unknowables cutter/frigate: `reason stock`
9. Beautiful `rep < 0`: `reputation`, no sale
10. Hostile / credits / full / not-docked: refuse, no new row
11. This worker did not dirty `shipyard.js` / `origins.js` / other src (hangar sibling allowed)
12. `hull_seed_gift` absent in the three named files

### Re-review

No HIGH/CRITICAL in the probe. Extra dock refuse pin added after first review. Probe re-run PASS.
