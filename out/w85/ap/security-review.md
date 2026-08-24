# Security Review: Wave 85 NAV-03 PR3–PR6 autopilot

**Scope:** `src/game/autopilot.js`, `src/systems/ship.js`, `src/systems/gate.js`, `src/systems/npc.js` (export avoid), `src/systems/hud.js` (chip), `src/ui/hud.css`, `src/systems/galaxychart.js`, `src/main.js` / `title.js` / `origins.js` / `modelsbrowser.js` pause disengage, `scripts/boot-test.mjs` WAVE85 AP pins, `out/w85/ap/probe.mjs`.  
**Mode:** Self-applied checklist (`security-auditor.md`). No persist key added. No network.  
**Date:** 2026-08-21

## Security Audit: flying autopilot

### Summary
Fail-closed. Persist stays `world.nav.autopilot` with the NAV-01 healer forcing false. Jump emit stays `gate.js` with `to: near.to`. Dest ids are not stuffed onto `jumpRequested`. DOM uses `textContent` / `el()`. Live channel keys are allowlisted.

### Risk Level: Low

### Findings

None HIGH or CRITICAL.

#### 🟡 Minor: Combat interrupt at spawn can drop AP before Cancel

**Location:** `src/game/autopilot.js` combat rising edge  
**Issue:** `npc.js` may set `flags.combat` in the next frame after engage. That is the contract interrupt table, not a bypass.  
**Fix:** None. Keep combat as an interrupt.

### Passed Checks
- [x] No secrets
- [x] No `innerHTML` on hud/chart
- [x] No second `WORLD_FIELDS` key; no new `localStorage` key
- [x] `jumpRequested` only from `gate.js`; payload `to` is `near.to`
- [x] No `ctx.input.*` write from autopilot or ship throttle
- [x] No `targets.current` write
- [x] No `currentSystem` assignment from AP
- [x] `Object.keys` allowlist on the live channel
- [x] Engage emit `{ dest }` string only; disengage `{ reason }` string only
- [x] Restore stuffed `autopilot: true` still false (`sanitizeNav` / `writeNav`)
- [x] `src/core/ctx.js` does not contain the substring `ctx.autopilot` (WAVE85 persist/chart pins)
- [x] Digit / KeyM / KeyV not bound

### Recheck
Probe PASS. Pause sites call `disengage(ctx, 'pause')`.
