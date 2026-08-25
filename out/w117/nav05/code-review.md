## Code Review: Wave 117 NAV-05 PR1

### Summary

Handoff matches merge law §0.1: ring hops keep flying, hub-only hops cycle/wrap, English is split, `gate.js` remains the only emitter. WAVE117 live `systemLoaded` sequence passed in `npm run test:boot`. WAVE85 / WAVE88 stayed true.

### What's done well

- `wantJump` still `inZone && !docked && nearTo === hop`.
- Gate cycle hygiene skips `ring` hops and still greps `zoneHub.to !== nextHop` / `near.to === nextHop`.
- Distinct tokens in both `AP_LINES` and `BREAK_LINE` (cancel family).
- Chart Cancel and fly `autopilotDisengaged` share `showApLive(apLine(...))`.
- Boot pin asserts `systemLoaded` `to` and `world.currentSystem`, not only yaw/throttle.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 🟡 Minor: Second hop re-engages after NAV-01 `writeNav`

**Location:** `src/game/nav.js` `writeNav` (consume) + WAVE117 pin

**Issue:** `systemLoaded` recalc writes `autopilot: false`. PR1 does not fight that healer. The pin re-engages for hop 2.

**Justification:** Contract forbids `state.js` / persist / nav bag writers. Consume NAV-01.

#### 🟡 Minor: Empty `nearTo` skips cycle on hub-only hops

**Location:** `src/game/autopilot.js` `else if (!nearTo)`

**Issue:** One-frame empty `nearTo` delays `cycleHub` by one frame. Emit still requires `near.to === nextHop`.

**Justification:** Contract §0.1 nearTo lag: do not cancel; still no emit.

#### 💡 Suggestion: Share one scan between kind and pos

Autopilot calls `lookupLiveNavHopKind` then `resolveNavGatePos` (two assembly walks). Assembly count is small. Leave it unless a later census cares.

### Recheck after review

No product fix required. WAVE117 object all true. Probe PASS.
