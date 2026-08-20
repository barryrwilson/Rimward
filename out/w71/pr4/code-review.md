## Code Review: `src/systems/station.js` mining board remaining time (WAVE 71 PR4)

### Summary

PR4 stays inside `renderJobs`. Mining cards show allowlisted title/detail, stamped/live reward, remaining time, and accepted have/need. Unique four lines stay. Probe pins pass. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- Remaining time is `deadline - ctx.world.time`. Missing or non-finite deadline returns `''` and the UI hides the clock. No crash.
- Scheme is consistent: whole seconds below 120 s (`45s left`), whole minutes at 120 s and above (`10m left`).
- Offered mining: Accept (n), then a `job-state` line with remaining time.
- Accepted mining: `ACCEPTED — deliver N <ore> here (have X) · t left`.
- Title/detail for mining rebuild from `COMMODITIES[commodity].name` and `SYSTEMS[origin].station.name`.
- Reward still uses stamped `payQuoted` vs live `jobPayFor` (same split as haul).
- Unique four titles, haul/ferry reward lines, patrol progress, ace hunt line, and Digit 0 shipyard are unchanged.
- No `innerHTML`, no new Digit, no HUD glance, no extra animation (`reducedMotion` is not involved).
- Pay, expire, and sanitize are not edited.

### Findings

#### 💡 Suggestion: `Math.floor(sec / 60)` shows `9m left` one tick after a 600 s stamp

**Location:** `src/systems/station.js:1708-1716`

**Issue:** A fresh 600 s window becomes 599.98 s on the next frame. Floor minutes then print `9m left`. The offered first paint still shows `10m left` because the first Jobs render is in the same tick as `syncMiningJobs`.

**Fix:** Optional later: `Math.round(sec / 60)` so 570–629 s still read as 10 m. Floor is a valid whole-minute scheme.

**Status:** open (accepted; probe pins `Nm left`, not the exact 10)

### Test coverage

`out/w71/pr4/probe.mjs` boots `initStation`, docks, opens Digit 2:

- offered mining cards include remaining time (`10m left`) and Accept (n)
- accepted mining cards include have/need and remaining time
- 90 s remaining uses the seconds form (`90s left`)
- NaN / Infinity / missing deadline: have/need stays; no `NaN` / `Infinity` / invented clock
- unique four still render (patrol / haul / ferry / ace lines)
- unique four do not grow a mining clock
- after complete, replacement offered card has a deadline line
- after expire, replacement offered cards have a deadline line
- no `innerHTML`; Digit 2 jobs; Digit 0 shipyard; two menu levels

### Contract drift

- WAVE71 boot-test pins: not landed (PR5).
- Unique haul/ferry/ace/patrol: not migrated (correct).
- `state.js` / `save.js` / `hud.js` / `world.js`: untouched.
