# Security Review: Wave 140 PR1 Agent market fill (observe JSON)

### Risk Level: Low

### Summary

Observe market rows now copy `fillBuy` / `fillSell` from a read-only desk peek of nested `tradeFillUnit`. Posted table price stays. Trust boundary is JSON numbers on authored commodity keys. No HIGH/CRITICAL remain after implement. Peek does not call `tryTrade`. Observe does not throw. No `innerHTML`. No persist. No `for-in` on `world.prices`.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None.

#### 🟡 MEDIUM: Desk `peekFillUnit` accepts any key — **documented, not expanded**

**Location:** `src/systems/station.js` **6384–6390**  
**Issue:** The hook does not re-check `reservedName` / `hasOwn(COMMODITIES)` before `tradeFillUnit` → `priceOf`. A harness caller with `__ctx.stationDesk` could pass `__proto__`. `priceOf` then reads `prices?.[key]`. Result is non-finite or a number; peek catch still returns `undefined` on throw.  
**Impact:** Debug/harness only. Public `act` does not expose peek. Observe skips reserved keys before peek.  
**Fix:** Keep observe filter. Do not add a second copy of fill math. Do not serialize the desk.  
**Status:** open (accepted residual)

#### 🟢 LOW: Temporary boot-test trust write

**Location:** `scripts/boot-test.mjs` WAVE140 block  
**Issue:** Test lowers Verge dockmaster trust so hermit `buyMult` 1.25 makes `fillBuy !== posted`. Restore now runs in `finally`.  
**Impact:** None on live play.  
**Status:** resolved in test `finally`

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` / HTML string concat of names
- [x] No `for-in` `world.prices`
- [x] Row keys = `Object.keys(COMMODITIES)` + `Object.hasOwn` + `reservedName`
- [x] `peekFillUnit` does not call `tryTrade`, debit credits, mutate cargo, or fire milestones
- [x] Observe `peekFill` wraps desk throws
- [x] Desk `peekFillUnit` wraps `tradeFillUnit` throws
- [x] Non-finite peek omits fill keys; posted stays
- [x] Missing `peekFillUnit` omits fill keys; posted stays
- [x] `postedPrice` unchanged (hasOwn prices / hasOwn base / 0)
- [x] No persist of fill / `optIn` / god prices
- [x] `state.js` READ-ONLY (no edit)
- [x] No teleport / credit grant
- [x] Digit 1 stays market; TRADE offset 5 unchanged
- [x] No in-repo LLM / page WebSocket / `XAI_API_KEY`

### Recommendations

1. Keep `peekFillUnit` read-only. Do not sample fill via `desk.trade`.
2. Do not iterate `world.prices` in a later serial.

### Re-review

Second pass after test `finally` trust restore: no new HIGH/CRITICAL. MEDIUM desk-key residual stays.
