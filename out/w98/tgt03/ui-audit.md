# UI Audit: TGT-03 remaining awareness (Wave 98 impl)

**Scope:** HUD toast copy, `.rw-edge-arrow` park/aria, empty 80 px hub. `src/ui/hud.css` unchanged.  
**Persona:** worker-applied `orchestrator/references/ui-audit.md` (no `[designer]` spawn).  
**Pass:** 1.

### Summary

Attacker fire reuses the existing off-column toast channel (`warn`, static `Incoming fire.`). The lock cue stays the amber triangle class. No new glance node, no incoming gauge, no `@keyframes` on the arrow.

### What's done well
- Toast class `warn` matches `Incoming dart.`
- Copy is `textContent` only; no ship-name interpolation.
- `.rw-edge-arrow` stays distinct from `.rw-nav-gate-cue`.
- `aria-hidden="true"` on the decorative triangle (name stays on the on-glass bracket).
- Park while docked or jumping; lock is not cleared.
- Color still `var(--amber)` so colorblind/contrast remaps apply. Shape + rotation remain the non-color cue.
- FORE/AFT still flashes only on `playerHit` (boot `foreAftHitOnly`).

### Findings

No Blocker/Major.

#### 💡 Suggestion: Edge arrow still has no `pointer-events: none`
**Location:** `src/ui/hud.css:576` (pre-existing)  
**Issue:** NAV-02 cue sets `pointer-events: none`; the lock triangle does not. Width/height are 0 so hit area is already empty.  
**Fix:** Out of this serial unless the owner opens a restyle.  
**Status:** accepted (do not restyle into NAV-02)

### Hub / digits
- 80 px hub stays empty. No lock box. No incoming gauge. Boot `noNewHudChild`.
- Digit 0/8/9 and KeyT/KeyV untouched.

### Reduced motion / contrast
- No new `@keyframes` on `.rw-edge-arrow` (boot `noKeyframes`).
- FORE/AFT flash CSS unchanged (`rw-facing-flash` remains hit-only).
