## Code Review: Wave 138 PR1 named afterburner act

### Summary
PR1 lands as one unit: schema + dispatch + lifted latch + `agentPulse('afterburner')` + finite-or-omit observe. Public pulse stays four. Boot evade pins all passed.

### What's done well
- Module-scope `pendingAfterburner` matches `pendingDock`. Space and agent share one flag.
- `dispatchLive` uses `afterControls(..., true)` so success is `ok: true`, `status: 'queued'`.
- Docked refuses before pulse. Input miss refuses `no-service`.
- Observe adds `burnerReadyAt` only when finite; NaN omits; never throws.
- `EVADE_LIVE` keeps PR3 pulse names unchanged.

### Findings

#### 🟡 Minor: WAVE132 `dockOneFrame` still false on full boot
**Location:** `scripts/boot-test.mjs` WAVE132 section
**Issue:** Full `npm run test:boot` still logs `WAVE132 PULSE-LATCH FAIL` (`dockOneFrame: false`). WAVE127 `ringHeld` also false.
**Fix:** Out of scope. Do not patch WAVE127/132 in this PR. Evade pins all true after those sections.

#### 💡 Suggestion: `agentPulse` catch maps afterburner throw to `unknown`
**Location:** `src/systems/controls.js` agentPulse catch
**Issue:** Dock/hail catch returns `no-service`. Afterburner catch returns `unknown`.
**Fix:** Acceptable fail-closed. A throw is not a missing desk.

### Passed
- Partial merge not split: observe did not land without the act.
- No `src/systems/ship.js` burn retune.
- No MSN-05 / NAV-10 / npc.js / state.js / style.css edits.
