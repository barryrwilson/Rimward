## UI Audit: hull-local shield ripple (Wave 111 PR1)

### Summary
This is combat VFX, not HUD chrome. A family-tinted ring now sits on the struck hull and rides the turn. First-person player hits do not parent a full-size ring onto the living nose. The 80 px hub is untouched.

### What's done well
- Family color still tints the shared ring atlas (`FAMILY_COLORS`).
- THREE.Sprite still billboards; scale/opacity animate in local space.
- Unshielded hits still show sparks + scorches (pool 12).
- `reducedMotion` still snaps one static frame (scale 5.5) then hides. No extra pulse.
- No punch pip, no RANGE rewrite, no `.rw-reticle` child, no Digit.

### Findings

No Blocker or Major findings.

#### 💡 Suggestion: First-person player world-space ring can still sit near the glass
**Location:** `src/systems/combat.js` spawnRipple fpPlayer branch
**Issue:** Contract allows world-space copy (live Wave 54) instead of a muzzle-scale band. A nose hit in first person can still read large. It does not parent onto the hull, so it does not fill the glass as a child of the ship.
**Fix:** Not required for PR1. Optional later: FP-small world band after playtest.

### Honor
- HUD-01 empty hub.
- Digit 0/8/9 not bound.
- Aim-glass gauges stay off.
- Kit mutate omit.
