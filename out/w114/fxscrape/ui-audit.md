# UI Audit: FX scrape PR1 world punch (Wave 114)

### Summary

World punch reuses the weapon hit family on damaging rams only. No hub pip, no extra toast, no Digit, no new settings checkbox. `reducedMotion` still snaps one ripple frame and mutes sparks. No Blocker or Major.

Method: self-applied orchestrator `ui-audit.md`. Did not spawn `[designer]`.

---

### What's done well

- Shielded ram → live `spawnRipple` (hull-local in chase/third; first-person stays WAVE111 world-space).
- Unshielded ram → live sparks + scorch via XOR. Mark pool stays 12.
- Slide `speed < 8` has no world FX.
- `'▲ Hull strike.'` remains the one HUD toast (`hud.js` 610). Combat does not toast scrape.
- Facing flash still comes from existing `playerHit`. No `.rw-reticle` child.
- `reducedMotion` path is live helpers (`spawnRipple` snap, `spawnSparks` early return). No extra `@keyframes`.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Untextured flash square still used

**Location:** live `spawnFlash` (`combat.js` 990–1001), called from `spawnHitFx` 1110

**Issue:** FX-01 glow map is skippable, not required PR1. Rams inherit the same untextured square weapons already show.

**Fix:** Do not land flash map as this leftover.

**Status:** documented; skippable.

#### 💡 Suggestion: Family `'impact'` tints energy cyan

**Location:** `FAMILY_COLORS[family] ?? FAMILY_COLORS.energy`

**Issue:** Scrape rings match energy, not a unique scrape hue. Contract forbids `FAMILY_COLORS.impact` and `WEAPONS.impact`.

**Fix:** Keep fallback.

**Status:** accepted.

### Hub / Digit / toast (consume)

- Hub 80 px empty of punch chrome. Combat PR1 does not touch `hud.js` / `hud.css`.
- Digit 0 shipyard untouched.
- No second hull-strike string. Grep `'▲ Hull strike.'` still one row.
