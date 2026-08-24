# Security Review: TGT-03 radar jump-park (Wave 99)

**Scope:** `src/game/contacts-gate.js`, `src/systems/hud.js` (contacts show/hide), `out/w99/radar/probe.mjs`, status bump in `docs/Tgt03RadarDesign.md`.  
**Mode:** Quick scan + persist / XSS / proto / heal trace.  
**Persona:** `security-auditor.md` + `orchestrator/references/security-review.md`.  
**Pass:** 1.

### Risk Level: Low

### Summary

Jump park hides `.rw-contacts` while jumping. Helper heals garbage scanner to 0. HUD does not write `ctx.world.scanner` or `ctx.world.contacts`. No persist key. No pip names. No `innerHTML`. No HIGH/CRITICAL.

## Security Audit: contacts-gate + HUD park

### Summary

Overall risk assessment: **low**. Fail-closed scanner heal. Park does not mutate world. Picture stays live `ctx.ships` + healed scanner.

### Findings

None at CRITICAL / HIGH.

#### 🟢 LOW: Truthy docked/jumping parks the arc
**Location:** `src/game/contacts-gate.js:18`
**Issue:** `!docked && !jumping` treats any truthy value as park. Matches live HUD `!ctx.flags.docked`.
**Impact:** None in production flags (boolean). Garbage truthy parks (fail-closed hide).
**Fix:** Optional `=== true` would be stricter; live HUD uses truthy. Leave as-is.
**Status:** documented; no change

### Passed Checks

- [x] No secrets in code
- [x] No persist of pips / no new `WORLD_FIELDS` / no `localStorage`
- [x] HUD does not assign `ctx.world.contacts`
- [x] HUD does not assign `ctx.world.scanner` on park
- [x] No names / `record` blobs on pip DOM (unchanged `«` / `»` `textContent`)
- [x] `innerHTML` still none in `hud.js` and helper
- [x] Prototype-safe scanner heal (`=== 1 || === 2`, else 0). No `for-in`. No `WEAPONS` index
- [x] `'2'`, `99`, objects, `__proto__` hide
- [x] No new `ctx.emit` type
- [x] Helper has no DOM

### Recommendations

1. Keep scanner heal 0/1/2 only.
2. Do not later snapshot pips into `world.contacts`.
