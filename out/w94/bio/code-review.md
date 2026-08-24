## Code Review: Wave 94 STOCK + TRAIN + SEED

### Summary
Stock, train dests, and Market seed match Owner Wave 94 §1–§3. Headless `out/w94/bio/probe.mjs` passed. No Blocker or Major defects.

### What's done well
- `LIVING_STOCK` is one frozen list for Beautiful and Unknowables; `hullKind` stays `living`.
- `livingTrainDests` / `trainListPrice(rep, dest)` replace the heavy-only ladder.
- Hangar Confirm stores `destClass` and calls `trainMounted(ctx, dest)`.
- Wave 92 envelope path remains: `applyFlightEnvelope`, cargo keep, no `switchTo`.
- Seed is Market papers with a frozen `SEED_MARKET_UU`, stem `seed_market`, gift still on People.

### Findings

#### 🟡 Minor: Dead `TRAIN_HEAVY_NOTE`
**Location:** `src/systems/shipyard-desk.js:93`
**Issue:** Same-class dests are filtered out, so the old “already as large as this dock trains” note never paints.
**Fix:** Leave the export for copy family, or delete it in a later desk tidy.

#### 💡 Suggestion: `livingTrainDest` is only the first dest
**Location:** `src/game/shipyard.js:46-49`
**Issue:** Callers that still use the singular helper see `light` → `cutter`, not every dest.
**Fix:** Desk and hangar Confirm already use the list / explicit dest. Keep the singular helper as a first-item wrapper.

### Verdict
Approve for this write-set. Do not expand into POWER or Unknowables dock.
