## Security Review: `src/systems/station.js` mining board copy (WAVE 71 PR4)

### Risk Level: Low

### Summary

PR4 adds remaining-time and have/need copy on mining Jobs cards. All new strings go through existing `h()` / `textContent`. Ore and station names come from allowlisted live tables, not save strings. Pay, expire, and sanitize are unchanged. No 🔴 CRITICAL or 🟠 HIGH findings.

### Findings

#### 🟢 LOW: Unique four titles still render restored `job.title` / `job.detail`

- **Severity**: informational
- **Category**: XSS / stored text
- **Location:** `src/systems/station.js:2336-2347`
- **Issue:** Mining cards now rebuild title and detail from `COMMODITIES` + `SYSTEMS`. Unique four cards still pass saved `job.title` / `job.detail` into `h()`.
- **Impact:** Restored unique-four copy is already stripped in sanitize (PR1). `textContent` does not parse HTML. No new sink.
- **Fix:** None in PR4. Do not regenerate unique four copy here.
- **Status:** accepted (out of slice)

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` in `station.js`; board copy uses `h()` → `textContent`
- [x] Mining title/detail interpolate `COMMODITIES[commodity].name` and `SYSTEMS[id].station.name` after `Object.hasOwn`
- [x] Unknown commodity → local fallback `'ore'`; unknown origin → current dock id, then `'the dock'`
- [x] Remaining time is a number format only (`Ns left` / `Nm left`); missing/non-finite deadline returns `''` (fail closed)
- [x] Negative remaining time shows `0s left` — no invented deadline
- [x] `need` / `have` are numbers (`Number.isFinite` / `holdUnits`); not save strings
- [x] Unique four reward and ACCEPTED lines unchanged
- [x] No `jobs[id] =` map assign
- [x] No whole-string `SAFE_ID.test(job.id)`
- [x] Pay / expire / `sanitizeJobs` not edited
- [x] No new frozen event; Digit 0 still shipyard; no HUD glance
- [x] `state.js` / `save.js` / `hud.js` / `world.js` untouched
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Keep mining card names on live `COMMODITIES` / `SYSTEMS` keys. Do not print `job.title` from save for mining.
2. Keep remaining-time math fail-closed (empty string, not `'NaN'`).
3. PR5 may still drop hardness-4 mining at restore (open from PR2/PR3).

### Positive Observations

- Offered remaining time is a separate `job-state` node after Accept; unique four Accept buttons stay as they were.
- Accepted line matches contract copy: `ACCEPTED — deliver N <ore> here (have X) · t left`.
- Probe pins NaN / Infinity / missing deadline: no crash, no invented clock text.
