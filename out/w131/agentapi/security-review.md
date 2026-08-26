## Security Review: Agent API PR2 command intents (iter 2)

### Risk Level: Low

### Summary
Desk `act` now fails closed when the live station path refuses. Credits and cargo still only move in `tryTrade` / `act.repairAll` / feed. No HIGH or CRITICAL issues on this diff.

### Findings

None open at HIGH/CRITICAL.

#### 🟢 LOW: Desk token map is notice-string based
**Location:** `src/systems/agent-api.js` `deskNoticeToken`
**Issue:** UU/hold/not-offered tokens match live English. Unknown notices fall to `notice` with the same English in `error`.
**Impact:** Token names can drift if copy changes; fail-closed `ok:false` still holds.
**Status:** open — one-line justification: contract wants English in `error`; unmatched copy still refuses.

### Passed Checks
- [x] Trade with credits 0 does not debit; `ok:false`; cargo unchanged
- [x] Missing job id does not claim accept; `ok:false`
- [x] `agent-api.js` does not assign credits, position, or `ctx.input`
- [x] `tryTrade` still refuses before debit on UU/hold/locker
- [x] Forbidden names first; no HTTP; no snapshots; no innerHTML
- [x] `hailResolve` still refuses closed card / off-card `payTribute`

### Recommendations
1. Keep desk UU writes inside station.js only.
