## Security Review: src/systems/npc.js (updateDuel / updateFlee unknown classKey)

### Risk Level: Low

### Summary
`updateDuel` and `updateFlee` now use the same own-property `SHIP_CLASSES` lookup as `speedCap`. Missing or prototype-polluted `classKey` fail-closes to finite `0` burn/cruise. Client-side simulation only. No new trust boundary, secrets, DOM write, or WORLD_FIELDS.

### Findings

No critical, high, or medium findings.

#### 🟢 LOW: unknown classKey hulls keep ticking in duel/flee at burn/cruise 0
**Location:** `src/systems/npc.js:410-429`, `1915-1916`, `2110`
**Issue:** A complete live hull with `classKey` not in `SHIP_CLASSES` still enters `updateDuel` / `updateFlee`. It no longer throws; motion is `0`.
**Impact:** Fail-closed motion only. Known-class combat numbers are unchanged. No privilege or data leak.
**Fix:** Not required. Matches the finite-fallback contract. Do not invent class keys.
**Status:** accepted (low)

### Passed Checks
- [x] No secrets in code
- [x] No innerHTML / HTML injection
- [x] No new WORLD_FIELDS
- [x] No eval / dynamic code
- [x] No auth/session changes
- [x] No network / CORS / headers
- [x] Logs do not print tokens or PII
- [x] `shipClassOf` uses `hasOwn` so `__proto__` / `constructor` do not walk Object.prototype
- [x] Missing class yields finite `0` for `cruise` and `burn` (`Number.isFinite` else `0`)
- [x] `state.js` class table not written; no invented keys
- [x] Hail / hunt-acquire / hunter / pirate hole skips from prior passes remain
- [x] Demand-hail outcome gates unchanged

### Recommendations
1. Parent verifier should re-run `out/w-boot-fix2/update-err/verify/duel-flee-probe.mjs` (unknown trader+hunter no-throw; known cutter flee/duel).
2. Keep `state.js` class tables closed; do not add keys to silence this path.

### Re-check
Re-read `shipClassOf` / `classCruise` / `classBurn` (`410-423`), `speedCap` (`425-429`), `updateDuel` (`1915-1916`, `2004`, `2012-2013`), `updateFlee` (`2086`, `2110`). No new HIGH/CRITICAL. LOW burn/cruise-0 tick remains accepted.
