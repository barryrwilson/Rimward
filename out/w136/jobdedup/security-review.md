## Security Review: Msn04 PR1 mining identity uniqueness (`station.js` mining helpers)

### Risk Level: Low

### Summary

PR1 closes offered mining twins at mint time. Titles still flow through the live `h()` `textContent` Jobs pane. No Agent accept, no persist flag, no sanitize rewrite, no infinite reroll. Unknown sibling keys never enter the used set. Missing `COMMODITIES[key]` returns `null` instead of throwing. No HIGH/CRITICAL findings remain open in this write-set.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None.

#### 🟡 MEDIUM: Accepted same-commodity pair can still double-pay

**Location:** `src/systems/station.js` `healOfferedMiningTwins` (skip when both `accepted`); complete pay still `tickDeliveryJobs`  
**Issue:** Merge law leaves two already-accepted same-commodity contracts in flight (pre-PR1 saves). Each can still complete and pay.  
**Impact:** credit duplication only for restored in-flight pairs, not new offered twins.  
**Fix:** frozen: do not drop or rewrite accepted cards. Document only.  
**Status:** accepted (contract)

#### 🟢 LOW: `Math.random` is the game pick

**Location:** `pickMiningCommodityExcluding` random index into `available`  
**Issue:** not a security boundary (contract §0.20).  
**Impact:** none for XSS / persist / Agent.  
**Status:** accepted

### Passed Checks

- [x] No secrets in mining helpers
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `station.js`
- [x] No Agent `act({ name: 'acceptJob' })`; Digit accept path unchanged
- [x] No new persist key / WORLD_FIELDS / `save.js` edit
- [x] Used set holds authored `MINING_ORE_KEYS` only; unknown sibling skipped
- [x] Prototype-safe: no `jobs[id] =`; no `for-in` of a job blob onto `world`; ids still `nextMiningId` + `SYSTEMS` hasOwn
- [x] Missing `COMMODITIES[key]` at mint → `null`, no throw
- [x] Bounded pick (`n + 2` with `i < n && i < attempts`); no `while (true)`
- [x] Offered-twin heal remints offered only; accepted twins left
- [x] Sanitize cap untouched
- [x] Overlay / `flags.paused` untouched

### Positive Observations

- Fail-closed mint sits in `makeMiningJob`, so fill and replace share one gate.
- `replaceMiningJob` still splices before mint, so the slot under replace is not a sibling.
- Cap 2 is a max: `if (!job) break` omits instead of forcing a twin.

### Recommendations

1. Later boot pin: offered-twin heal + empty-origin distinct commodities (see `boot-pins.md`).
2. Do not add a sanitize “drop extra commodity” pass that can eat accepted or unique four.
