# Code Review: Wave 85 NAV-03 PR2 autopilot stub

**Scope:** `src/game/autopilot.js`, `src/core/ctx.js` channel + §9 freeze comments, `src/main.js` tick insert.  
**Method:** self-applied checklist (`reviewer.md` + orchestrator `code-review.md`).  
**Date:** 2026-08-21

## Code Review: autopilot command computer

### Summary
PR2 lands the live command channel and a no-motion stub. Tick order is gate → controls → autopilot → ship. Commands stay zero. Persist stays `world.nav.autopilot`.

### What's done well
- Single writer for the live channel; `publishStub` never copies onto `ctx.input`
- `engaged` mirrors `world.nav.autopilot === true` without writing the persist flag
- Allowlist strip keeps the channel identity from `createCtx`
- `reason` is not zeroed each tick (last interrupt token)
- Event types listed next to `navRoute`; `flags.chartOpen` comment kept
- Probe pins throttle, `jumpRequested`, `targets.current`, `innerHTML`, `state.js`, and `WORLD_FIELDS`

### Findings

#### 💡 Suggestion: Settings/bio still sit between autopilot and ship
**Location:** `src/main.js:111-114`
**Issue:** Contract asks for after controls, before ship. Settings and bio are DOM/companion and do not consume the channel.
**Fix:** None this PR. Do not reorder unrelated inits.
**Status:** accepted

### Recheck
No Blocker/Major. Probe PASS. No Autopilot chrome this PR.
