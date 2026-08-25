# Security Review: Wave 122 remaining TGT leftover (tgtrest)

**Scope:** markdown pack `docs/Tgt06RemainingTgtDesign.md` + `out/w122/tgtrest/**`. No `src/` in write-set.  
**Mode:** Quick scan (design freeze, no runtime change) plus live-path trace of HUD targeting copy / `lockKind` / `npcFire` because the leftover names player-facing strings.  
**Personas:** `security-auditor.md` + orchestrator `security-review.md`.  
**Date:** 2026-08-25. Second pass: still 0 HIGH/CRITICAL after inventory/contract freeze (no security change).

## Security Review: remaining TGT leftover

### Risk Level: Low

### Summary

This wave writes **markdown only**. Live targeting HUD already uses `textContent` / `el()`. Authored toast strings only. `lockKind` and `npcFire.weapon` are allowlisted. Reserved prototype keys fail closed. Contract **forbids** later `innerHTML`, a second live region, and new persist. No HIGH or CRITICAL findings.

### Findings

None open at critical / high / medium.

#### 🟢 LOW: Landmark / station names ride `textContent` (not leftover; do not invent)

**Location:** `src/systems/hud.js` bracket / rail name writes (live, cite only)  
**Issue:** Authored SYSTEM / record names become HUD text. If a later serial switched those writes to `innerHTML`, XSS.  
**Impact:** Theoretical XSS only if leftover PR1 invented HTML. CONSUME forbids that serial.  
**Fix:** **Do not** name PR1. Contract §0.4 already forbids `innerHTML`.  
**Status:** documented — not leftover. **Justification:** CONSUME freeze; live path is `textContent`.

#### 🟢 LOW: Contacts / edge-arrow stay `aria-hidden` (not leftover)

**Location:** `hud.js` 816–817, 877–878  
**Issue:** Bearing picture and lock triangle are hidden from AT. Incoming fire uses the existing polite toast stack.  
**Impact:** Not XSS. Not privilege. Not a missing warning channel (toast carries fire/dart).  
**Fix:** Do not add a second assertive live region as leftover.  
**Status:** documented — standing a11y shape, not leftover.

### Passed Checks

- [x] No secrets in leftover markdown
- [x] No `src/` write this wave
- [x] Live `hud.js` `innerHTML`: **none**
- [x] Live `npc-fire-toast.js` / `contacts-gate.js` / `los-close.js` / `subsys-aim.js` / `reticle-aim.js` `innerHTML`: **none**
- [x] Toast copy authored (`Incoming dart.` / `Incoming fire.`)
- [x] `npcFireToast` refuses reserved weapon keys (`__proto__` / `constructor` / `prototype`)
- [x] `allowedLockKind` allowlist only
- [x] `safeSystemId` / `reservedToken` on kind materialize
- [x] No new persist key; CLOS / part / MATCH session
- [x] Fail-closed never pause the sim
- [x] Prototype-safe: no `for-in` blob → lock
- [x] Overlay z not raised
- [x] `WORLD_FIELDS` `'contacts'` not reused as radar snapshot (station roster)

### Recommendations

1. Keep CONSUME. Do not add HTML lock labels “for remaining TGT.”
2. If a named slice disappears, re-open **that slice**, not a new HTML channel.

### Severity counts

| Severity | Open | Resolved this pack |
|---|---|---|
| critical | 0 | — |
| high | 0 | — |
| medium | 0 | — |
| low | 0 leftover (2 documented live cites) | n/a |
| informational | 0 | — |

### Positive Observations

- Incoming warnings already reuse HUD-04 `textContent` chips with expire `aria-hidden`.
- Integrator freeze repeats `innerHTML` forbidden.
- Scanner heal 0 on garbage prevents a lying arc without throwing.
- Missing turret `target` drops (does not default to player).
