# Code Review: Wave 140 PR1 Agent market fill

### Summary

PR1 lands observe `fillBuy` / `fillSell` from live `tradeFillUnit` via `stationDesk.peekFillUnit`. Posted stays. Desk `tryTrade` / `renderMarket` / TRADE offset 5 are untouched. Hardening and WAVE140 boot pins pass. Verdict: approve.

### What's done well

- Fail-closed skip: `reservedName`, `hasOwn(COMMODITIES)`, object record.
- Double try/catch: observe `peekFill` and desk `peekFillUnit`.
- No duplicated rank / faction / epic / hermit / fixer math.
- Hardening keeps `posted === 100` and pins omit / fill / throw paths.
- Boot pins match live peek, hermit `fillBuy !== posted`, undock/jobs `market === null`, TRADE offset 5.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: One throw in the commodity loop drops later rows

**Location:** `src/game/agent-observe.js` **274–298**  
**Issue:** The outer `try` wraps the full `Object.keys(COMMODITIES)` loop. A throw on one row (unexpected) omits later authored keys. Per-row `try` would keep more rows. `postedPrice` / `holdOf` / `peekFill` already fail closed, so this is defense in depth.  
**Fix:** Optional per-row catch. Not required for PR1.  
**Status:** open (accepted)

#### 💡 Suggestion: Schema market-row comment skipped

**Location:** `src/game/agent-schema.js`  
**Issue:** Task allowed a comment-only observe shape **if** a market-row note already existed. None existed. Skip is correct.  
**Status:** resolved (skip)

### Tests

- `node scripts/agent-api-hardening-test.mjs` — PASS. `posted === 100` kept. Fill omit without peek. Fill 125 with peek. Non-finite omit. Peek throw omit, no throw.
- `npm run test:boot` — WAVE140 MKTFILL all pins true. Pre-existing WAVE127 / WAVE132 fails ignored.

### Re-review

After moving dockmaster trust restore into `finally`: no new Blocker/Major. Minor loop-catch residual stays.
