## Code Review: CTL-03 PR1 berthHold helm latch (autopilot.js)

### Summary
Helm no longer runs under hold. `inputBreak` unlatches the reticle like chart and returns `''` while `berthHeld`. `flyTick` still `zeroCmd` + return and keeps `nav.autopilot`. No Blocker/Major.

### What's done well
- Hold is not helm: `inputBreak` returns `''` while `berthHeld(ctx)` before strafe/roll/throttle/steer cancel (`autopilot.js` 157–169).
- Reticle unlatch matches chart so leftover hypot after RESUME cannot cancel the same flying leg (`helmSteerLatched`, `tryEngage` 227).
- `flyTick` still `zeroCmd` + return on hold (`autopilot.js` 392–398). Does not `disengage('input')`.
- `berthHeld` fail-closed. Missing flag is false. Chart WASD cancel is unchanged (`held` is false).
- `apSrc` still contains `chartOpen`. Boot-test Wave 85 chart pin stays.
- No `flags.paused` write. No systems-loop skip. No `controls.js`.

### Findings

#### 🟡 Minor: MATCH may toggle while held
**Location:** `src/systems/ship.js` ~742–754
**Issue:** Match-speed toggle sits above the hold skip. A MATCH tap under berth can apply after RESUME.
**Fix:** Optional later. Hold skip is the flight integrate block; MATCH is not gate/jump. Out of this helm re-dispatch.

#### 🟡 Minor: Hub KeyG still cycles while hold
**Location:** `src/systems/gate.js` ~609–614
**Issue:** Human KeyG ignores `berthHold`. Emit is still refused until RESUME.
**Fix:** Out of PR1 emit-only gate freeze. Do not steal CTL-04.

#### 💡 Suggestion: Dual hold write paths
**Location:** `src/game/save.js` `applyBerthHoldFlag`
**Issue:** Helper plus a catch fallback that writes `flags.berthHold` again. Never writes paused.
**Fix:** Keep. Fail-closed if the helper throws.

#### 💡 Suggestion: `berthHeld` is read twice per `inputBreak`
**Location:** `src/game/autopilot.js` 160, 154 via `helmSteerLatched`
**Issue:** One extra fail-closed boolean read per AP tick.
**Fix:** Keep. Cheap. Do not cache flags.

### Re-review
Helm cancel cannot fire while held. Leftover hypot after RESUME waits for hypot < `AP_STEER_BREAK`. No remaining Blocker/Major.

### Contract census (this pack)
- `flags.paused` assign in save.js / overlay-policy: **none**
- `jumpRequested` emit in src/: **gate.js only**
- Hint “while you fly”: **gone**
- WORLD_FIELDS: **unchanged**
- AP helm under hold: **does not disengage**
