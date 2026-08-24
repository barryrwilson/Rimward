# Code Review: TGT-03 radar jump-park (Wave 99)

**Scope:** `src/game/contacts-gate.js`, `src/systems/hud.js` contacts gate, `out/w99/radar/probe.mjs`.  
**Persona:** `reviewer.md` + `orchestrator/references/code-review.md`.  
**Pass:** 1.

### Summary

PR2 jump park is the only behavior change. Helper is pure and boolean (no per-frame object). Mk I / Mk II range and cap stay in HUD. Probe covers hide/show and “do not clear scanner.” No Blocker/Major.

### What's done well

- `contactsGate(scanner, docked, jumping)` matches the contract signature.
- Boolean return avoids a per-frame allocation (HUD contract).
- `contactsScanner` heals garbage to 0; HUD uses the healed tier for range/cap.
- Reuses existing `jumping` in `update()` and existing `is-hidden`.
- No new CSS class. No `state.js` write. Ships-only loop unchanged.

### Findings

#### 💡 Suggestion: Double heal
**Location:** `src/systems/hud.js` (contacts block)
**Issue:** HUD heals with `contactsScanner`, then `contactsGate` heals again. Harmless.
**Fix:** Pass the healed `scanner` into `contactsGate` (already done). No further change.
**Status:** documented

#### 🟡 Minor: `ctx.gate.jumping` still assumes `ctx.gate`
**Location:** `src/systems/hud.js` jump bar (`const jumping = !!ctx.gate.jumping`)
**Issue:** Pre-existing. Contacts now reuse that boolean. Missing `gate` would throw before this change too.
**Fix:** Out of scope.
**Status:** documented; not opened

### Verdict

Ship. Probe: `WAVE99 contactsGate PASS`.
