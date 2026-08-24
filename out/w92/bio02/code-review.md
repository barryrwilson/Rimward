## Code Review: Wave 92 BIO-02 class-ladder train

### Summary
Same-row living `light`/`cutter` → `heavy` at Beautiful Hangar papers. Debit reuses `yardPrice('heavy')`. BIO-01 gift/pirate helpers stay. `bio.growth` does not remount.

### What's done well
- `livingTrainDest` sits next to `LIVING_STOCK`; dest never frigate/ace/freighter
- `trainMounted` parks, sanitizes, heals seats/vitals, keeps cargo, `applyFlightEnvelope` with `burn/cruise`, `callRemount` without `switchTo`
- Hostile Bloom paints `No sale.` (does not copy graft hide)
- Short credits keep Offer; Confirm refuses
- `trainPending` dies on pane leave, Esc, Back, select, dock, undock
- Digit 0 stays Shipyard; Digit 3+ swallowed while papers armed
- `grantLivingSeedRow` intact

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Confirm hop falls back to `light` if pending dest is not `heavy`
**Location:** `src/systems/shipyard-desk.js` train-pending paint
**Issue:** Tampered `destClass` shows `from → light` instead of refusing paint.
**Fix:** Confirm already refuses non-`heavy`. Acceptable fail-closed.

#### 💡 Suggestion: `trainPaint` uses `row.grafted === true`
**Location:** `src/systems/shipyard-desk.js` `trainPaint`
**Issue:** Mutate path uses `graftedOwnTrue`. Paint is equivalent for own-true flags.
**Fix:** None required for first impl.

### Test notes
- Headless `out/w92/bio02/probe.mjs` PASS
- `scripts/boot-test.mjs` WAVE92 BIO-02 section appended; full suite not finished in this worker (WAVE4/26/35 left as-is)
