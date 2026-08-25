# UI Audit: FX-01 remaining combat punch brief (Wave 110)

### Summary

No product chrome ships this wave. This audit treats the pack as a **combat-picture spec** for later hull-local shield ripple — measured against live Wave 54/59 FX, HUD-01 empty 80 px hub, Digit 0/8/9, and `reducedMotion`. Picture is a **ring that rides the struck hull**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a punch pip). Digit theft is **not** proposed. Fail-closed missing helper keeps world-space ring (combat does not halt). First-person player-host full-size parent is **forbidden** (would spam center view).

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **world FX**: shielded hits stick to the hull. No new string, Digit, or required toast.
- Empty hub freeze is explicit: no punch pip, combo meter, or impact gauge on `.rw-reticle` (`src/ui/hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- Facing-rail `selfHitFlashUntil` stays on `.rw-combat-self` (`hud.js` 846–847, 1391–1399) — HUD-02 hair, not a hub child.
- Digit 0/8/9 stay shipyard / launch / Standing. Punch is not a dock verb.
- `reducedMotion` keeps live snap-one-frame; shake already zeros (`ship.js` 1207–1211). Existing `body.rw-reduced-motion` / `rw-colorblind` / `rw-contrast` stay.
- Recoil and marks remain the live gun/hull language; this leftover does not add a second camera kick as required work.
- Both HUD families keep the same glance set. No family-specific punch widget.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (fixed): First-person full-size ring on the player hull

**Location:** muzzle glass comment `combat.js` 998–1001; ripple animate scale `2.2 + 7.2*k` (1962–1963); hub 80 px `hud.css` 184–189.

**Issue:** Parenting the live ring to the living ship in first person would sit an additive billboard on the aim glass. Wishlist already flags “obscuring aim with particles; excessive camera shake.”

**Fix:** Spec now fail-closes first-person player host to world-space or FP-small. Chase/third and NPC hosts still get the ride.

**Status:** frozen in contract; later serial must honor.

#### 🟡 Minor: Untextured hit flash can still read cheap next to a parented ring

**Location:** `spawnFlash` without `map` (`combat.js` 588–596).

**Issue:** A hard square plus a riding ring can clash. Optional PR2 maps `glowTex` after playtest.

**Fix:** None required this leftover.

**Status:** documented.

#### 🟡 Minor: Shielded hits still have no sparks

**Location:** `spawnHitFx` XOR `combat.js` 1048–1052.

**Issue:** Screens-up punch is **only** the ring (plus flash / shake / audio). That is Wave 54/59 law, not a HUD bug. Players may still want chips on shields.

**Fix:** Out of this leftover (contract §0.18). Do not stamp scorches through shields. Do not draw a “SHIELD” pip on glass.

**Status:** frozen.

#### 💡 Suggestion: Do not reuse RANGE for punch combo

**Location:** `hud.js` 712 RANGE.

**Issue:** Painting hit-count on RANGE would smash TGT-01.

**Fix:** Contract already forbids. PR2 grep RANGE / `.rw-reticle`.

**Status:** frozen.

### Accessibility / theming / layout

- No new controls, focus rings, or hit targets.
- No new CSS tokens.
- No responsive overlay.
- Empty / error / loading states: N/A (no panel). Fail closed is **keep firing**, which is the correct disabled-data state (combat does not halt).
- Vestibular: `reducedMotion` must mute extra pulse; shake already gated. Do not add `@keyframes` on `#hud` for hits.

### Digit / hub freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new | forbidden |
| Punch pip / combo / impact meter | none | forbidden |
| Facing flash | `.rw-combat-self` consume | do not move to hub |
| Digit 0 | shipyard | do not steal |
| Digit 8/9 | launch / epics; outfitting papers | do not steal |
| Toast | not required | do not add “SHIELD HIT” |

### Verdict

Spec honors HUD-01, Digit law, and reducedMotion. Later serials must not grow chrome to sell the hull-local ring, and must not parent a full-size ring to the first-person player hull.
