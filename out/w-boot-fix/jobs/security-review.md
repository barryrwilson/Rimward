## Security Review: src/systems/station.js (WAVE78/WAVE80 dock-tick payout)

### Risk Level: Low

### Summary
The change only zeroes the local `jobTick` throttle on `dock()`. It does not add a new credit or reputation write. Passenger and spy payout still use `clampJobPay` / `payQuoted` and `writeFactionStanding`. No HIGH or CRITICAL issues.

### Findings

None.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` added
- [x] Credit writes still go through `clampJobPay` / `payQuoted` (passenger, spy)
- [x] Spy employer standing still uses `writeFactionStanding` with finite `MINING_REP`
- [x] Unique-haul dest bind and `destPayHeldForUniqueHaul` are unchanged
- [x] Throttle reset cannot double-pay: delivery still sets `job.state = 'failed'` then replaces the row
- [x] `jobTick = 0` is local to the `initStation` closure (not attacker-controlled)

### Trust boundary
Credits and reputation writes stay in `tickDeliveryJobs`. This patch only delays the first post-dock delivery until 0.5s of docked time, so a leftover throttle cannot pay on the 3-frame dock settle before the caller stamps `payQuoted`.

### Recommendations
1. Keep payout math on `payQuoted` + `clampJobPay`. Do not fall back to live epic `jobPay` for these renewable jobs.
