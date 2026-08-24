# Security Review: TGT-03 remaining awareness (Wave 98 impl)

**Scope:** `src/game/npc-fire-toast.js`, `src/systems/hud.js` (`npcFire` toast + `.rw-edge-arrow` park/aria), `scripts/boot-test.mjs` WAVE98 pins, `out/w98/tgt03/probe.mjs`. Untouched: `state.js`, `save.js`, `npc.js`, `combat.js`.  
**Mode:** Deep audit of toast/copy trust boundary (XSS, innerHTML, prototype weapon keys, persist).  
**Persona:** `security-auditor.md` + `orchestrator/references/security-review.md`.  
**Pass:** 2 (after HUD fail-closed drop of unknown helper text).

### Risk Level: Low

### Summary

Attacker-is-firing copy is two authored literals on the existing `textContent` toast path. The helper allowlists `weapon === 'cannon'|'missile'` on own properties only, rejects `__proto__` / missing / inherited weapons, and does not index `WEAPONS`. No HIGH/CRITICAL remain open.

## Security Audit: Wave 98 npcFire toast + lock cue

### Summary

Overall risk assessment: **low**. Toast payload cannot carry ship names or record strings. Unknown weapons fail closed (do not copy combat’s unknown→cannon default).

### Findings

#### Finding 1: Unknown npcFire.weapon must not toast as cannon
- **Severity**: high (preempted) → **addressed**
- **Category**: Input validation / fail-closed
- **Location:** `src/game/npc-fire-toast.js:17-22,39-40`
- **Description:** `spawnNpcShot` may default unknown weapons to cannon. The toast helper must not.
- **Impact:** False `Incoming fire.` lines; prototype-key lookups if HUD used `WEAPONS[e.weapon]`.
- **Reproduction:** `{ weapon: '__proto__', target: 'player' }` and `Object.create({ weapon: 'cannon' })` both return null (probe PASS).
- **Remediation:** Own-property string allowlist `=== 'cannon'|'missile'` only. Reserved tokens rejected. No `WEAPONS[` in the helper.
- **Status:** addressed

#### Finding 2: Dynamic attacker names / innerHTML on toast
- **Severity**: high (preempted) → **addressed**
- **Category**: XSS / injection
- **Location:** `src/systems/hud.js:568-574`, `pushToast` `textContent`
- **Description:** Interpolating `e.ship` / `state.name` would put record strings on HUD. `innerHTML` is forbidden.
- **Impact:** Spoofed warn lines; HTML injection if a later PR switched to `innerHTML`.
- **Reproduction:** WAVE98 pins `!npcFireCase.includes('e.ship')` and no `innerHTML` in helper or case.
- **Remediation:** HUD maps helper output onto `INCOMING_DART_TOAST` / `INCOMING_FIRE_TOAST` only; unknown helper text returns null.
- **Status:** addressed (pass 2)

#### Finding 3: New persist / settings keys
- **Severity**: medium (preempted) → **addressed**
- **Category**: Data exposure / persist
- **Location:** freeze; this serial does not touch `save.js` / `settings.js`
- **Description:** Awareness clocks live on HUD `mem` only (`lastIncomingDartAt`, `lastIncomingFireAt`).
- **Impact:** None shipped.
- **Status:** addressed (no new `WORLD_FIELDS` / localStorage key)

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in HUD / helper
- [x] Toast is `textContent` + static literals
- [x] No `WEAPONS[e.weapon]` index
- [x] Prototype / missing / empty weapon → no toast
- [x] HUD does not write `hullKind`
- [x] No new `ctx.emit` type
- [x] Docked / jumping suppress fire toast (not a persist hole)

### Recommendations
1. Keep toast copy as authored literals only.
2. Do not later index `WEAPONS` from HUD for this warning.
