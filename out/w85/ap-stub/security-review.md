# Security Review: Wave 85 NAV-03 PR2 autopilot stub

**Scope:** `src/game/autopilot.js`, `src/core/ctx.js` live channel + event freeze comments, `src/main.js` init/tick insert, `out/w85/ap-stub/probe.mjs`.  
**Mode:** Quick scan (no persist write, no DOM, no network). Persist flag remains `world.nav.autopilot` (PR1 healer).  
**Method:** self-applied checklist (`security-auditor.md` + orchestrator `security-review.md`).  
**Date:** 2026-08-21

## Security Audit: autopilot command channel

### Summary
Clean. The stub reads a boolean persist flag, writes an allowlisted live object, and does not emit, persist command fields, or touch input / mesh / locks.

## Security Review: autopilot.js + ctx channel

### Risk Level: Low

### Summary
No HIGH or CRITICAL issues. The live channel is not a `WORLD_FIELDS` key. Extra keys are dropped. `autopilot === true` is a strict boolean check.

### Findings

None.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` / DOM in `autopilot.js`
- [x] No new `localStorage` key; no second `WORLD_FIELDS` key (`autopilot` is live only)
- [x] No `jumpRequested` emit from the stub
- [x] No `ctx.input.*` write
- [x] No `targets.current` write
- [x] No mesh / `currentSystem` write
- [x] `Object.keys` + `Object.hasOwn`; no `for…in`
- [x] Unknown channel keys deleted; fresh `{}` when the slot is not a plain object
- [x] Stuffed `autopilot: 'true'` does not set `engaged`
- [x] `wantJump` / steer / `reason` are not copied onto `world.nav`
- [x] Event comments list primitives only; stub does not `emit` (no type smash via spread)
- [x] `state.js` untouched

### Recommendations
1. Later engage/disengage must emit `{ dest }` / `{ reason }` literals only. Do not spread `world.nav`.
2. Keep `gate.js` as the only `jumpRequested` writer when PR5 ORs `wantJump`.

## Recheck
Probe PASS. No HIGH/CRITICAL.
