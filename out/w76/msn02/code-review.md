# Code Review: Wave 76 MSN-02 trade impl

### Summary

Trade copies mining slot/expire/replace law with `HAUL_UNITS` 5, origin `payQuoted`, and dest-dock pay. Mining need stays `FERRY_UNITS`. Unique haul/ferry stamps and Wave 35 dest bind are untouched. WAVE71/WAVE72/WAVE74 pins stayed true. WAVE76 pins all true.

### What's done well

- Cap `4 + 4 * N_SYSTEMS + 16` (420 at 100) and extra-trade drop order never evict honest mining.
- Pay rebinds `otherSystemId`; UI dest name uses the same helper.
- One-in-one-out splice + new object; `failed` first on complete.
- Board filter hides offered trade off-home; accept also refuses.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Trade helpers sit after `maybeRefreshJobsBoard`

**Location:** `src/systems/station.js` ~1992–2128  
**Issue:** `syncTradeJobs` / `replaceTradeJob` live after the mining board-refresh helper, not next to `syncMiningJobs`.  
**Fix:** Optional move next to mining. Behavior is correct.  
**Status:** open — layout only; do not churn a hot file for it.

#### 💡 Suggestion: `miningTimeLeftLabel` reused for trade

**Location:** `src/systems/station.js` renderJobs offered/accepted trade  
**Issue:** The helper is generic (deadline vs `world.time`) but the name says mining.  
**Fix:** Rename later if a jobs helper lands.  
**Status:** open — reuse avoids a mining rename.

#### 💡 Suggestion: Jobs note line still names mining/patrol only

**Location:** `src/systems/station.js` `renderJobs` screen-note  
**Issue:** Trade also writes employer +2, but the note does not say so. Cards still show reward, need, dest, time.  
**Status:** open — copy is optional; cards meet acceptance 6.

### WAVE76 pin result (boot-test)

All keys true: unique four, `mine-freehold-0` restore, `trade-freehold-0` keep, proto drop, cap 420, fill two, need 5, commodity allowlist, stuffed dest ignored, complete replace twice, expire no pay, no innerHTML, mining need untouched, haul dest bind, unique haul ids.

### Pass 2

Re-read mining vs trade branches. Mining still uses `FERRY_UNITS`. Unique haul still stamps dest `jobPayFor`. Wave 35 haul dest bind still uses `otherSystemId(ctx, origin)`. No blocker/major. Minor layout / helper-name items stay open.
