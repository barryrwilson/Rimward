# Code Review: Wave 140 PR1 MARKET desk layout

### Summary

PR1 lands wrap on `.market-actions`, player-word MARKET subtitle, and fail-closed row skip. TRADE min track and panel 560 stay. Q/W/A/S, Digit 1, `tradeFillUnit` math, `tryTrade`, Digit map, and `peekFillUnit` stay. WAVE140 MKTDESK pins pass. Verdict: approve.

### What's done well

- One layout law: `flex-wrap: wrap`. No raise of `minmax(10em, 1.7fr)`. No drop of `min-width: 560px`. No `overflow-x` as the only fit.
- Subtitle is the contracted literal via existing `h()` `textContent`.
- Skip gates before any cell paint, so a bad key cannot desync the six-column grid.
- Fill units compute inside per-row `try` before `h()`, so a throw skips the whole row.
- Illegal `'trade refused'` path unchanged.
- Boot block is append-only after WAVE140 MKTFILL.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: Outer `renderMarket` catch covers archive desk

**Location:** `src/systems/station.js` **4830–4882**  
**Issue:** Contract says never throw from market pane paint. The outer `try` also swallows `renderArchiveDesk`. A later archive throw omits remaining notes without a log.  
**Fix:** Optional inner catch around the commodity loop only, plus a second catch around archive. Not required for PR1.  
**Status:** open (accepted)

#### 🟡 Minor: Skip does not remap `ui.marketSel`

**Location:** `src/systems/station.js` **4840–4866**, **6304–6308**  
**Issue:** Arrow keys still walk `COMMODITY_KEYS.length`. A skipped key has no highlighted cells. Q/W/A/S still call `tryTrade` on that key. Live authored records do not skip.  
**Fix:** Do not remap keys. Skip is fail-closed paint only.  
**Status:** open (accepted)

#### 💡 Suggestion: Unused `market-head-actions` class stays

**Location:** `src/systems/station.js` TRADE head  
**Issue:** Contract says unused class is not required to drop.  
**Status:** resolved (skip)

### Tests

- `npm run test:boot` — WAVE140 MKTDESK all pins true. WAVE140 MKTFILL still all true. Pre-existing WAVE127 / WAVE132 fails ignored.

### Re-review

After restore-before-tick on the boot poison: no new Blocker/Major. Outer-catch and selection-index residuals stay.
