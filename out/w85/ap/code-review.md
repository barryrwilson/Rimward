# Code Review: Wave 85 NAV-03 PR3–PR6 autopilot

**Scope:** flying consume, MATCH refuse, interrupt table, avoid/sun/blocked, gate wantJump/cycleHub, chart button, HUD chip.  
**Method:** self-applied checklist (`reviewer.md`).  
**Date:** 2026-08-21

## Code Review: flying autopilot

### Summary
PR3–PR6 land on the PR1 persist flag and PR2 live channel. `ship.js` consumes yaw/pitch/throttle while `world.nav.autopilot === true`. `gate.js` remains the only `jumpRequested` emitter. Avoid is the exported PHY-02 helper.

### What's done well
- Single flight writer: ship mesh still `ship.js`; command computer is `autopilot.js`
- MATCH refuse does not clear MATCH and does not write `input.throttle`
- Steer-break ignored while `flags.chartOpen`; re-arm after hypot < 0.65
- WASD / throttle / afterburner / drift cancel even with the chart open
- `wantJump` is published after gate (seen next frame)
- `cycleHub` uses the same modulo as KeyG inside `gate.update`
- Pause sites call exported `disengage` because the sim loop does not tick
- Chart native `disabled` only when there is no dest/route
- Chip is `#hud .rw-autopilot` at top 14px center; NAV-02 readout stays

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Combat often wins the first flight frame at spawn

**Location:** `autopilot.js` interrupt order vs `npc.js` combat flag  
**Issue:** A hostile in the bubble sets `flags.combat` after AP tick. Next frame disengages `combat`. Helm cancel still works when combat is off.  
**Fix:** None this PR. Contract says AP is not immunity.

#### 💡 Suggestion: Skip avoid collect when jumping

**Issue:** Jumping already zeros cmds. `collectBodies` still runs until the jumping hold returns. Cheap and bounded.  
**Fix:** Optional later.

### Recheck
Probe PASS (`out/w85/ap/probe.mjs`). WAVE85 AP pins added to `scripts/boot-test.mjs`.
