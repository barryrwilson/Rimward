## Code Review: src/systems/ship.js living class remount

### Summary
Hangar Mount of a living row now rebuilds `makeLivingHull(classKey)` with charter scale (`target / P`, light forced to 1) and a modest cutter/heavy silhouette. Light rest-pose still measures P = 6.6. CPU swim/breath/heartbeat remain; plated remount is unchanged.

### What's done well
- Default `makeLivingHull('light')` keeps Models Browser / boot yardstick without editing `model-catalog.js`.
- `scaleFor` + identity light scale avoids drifting P (`SHIP_SCALE.light.target` is 6.8, not P).
- Accessories (eyes, scars, underlight) and additive swim amps follow rest pose so a heavy hull does not look frozen.
- First-person nose offset scales from a copy of `FIRST_PERSON_NOSE`; the exported constant stays `(0, 0.45, -2.8)` for boot-test.
- Buy flow untouched. Built path still `buildBuiltVisual`. Unknowables still living.

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major
None.

#### 🟡 Minor: Collision radius stays PHY.PLAYER_RADIUS
**Location:** `src/systems/ship.js` (~resolveMover with `PHY.PLAYER_RADIUS`); `src/game/physics.js:7`
**Issue:** Living heavy rest spanX is ~18.7 vs collision 2.4. Visual clipping vs rocks is possible. Plated remount already keeps the same radius after `scalePlatedToPlayer`.
**Fix:** Out of scope (would need combat hit-radius lockstep). Leave as-is.
**Justification:** Shared PHY constant; not introduced as a living-only cheat; class collision is a later pass.

#### 💡 Suggestion: Chase / third camera still use light-sized offsets
**Location:** `src/systems/ship.js` `_camOffset` (0,4,12), `THIRD_HEIGHT` / `THIRD_BACK`
**Issue:** A heavy hull fills more of chase glass. Tail still sits forward of z=12, so the camera is not inside the mesh.
**Fix:** Optional follow-distance scale by `restScale` in a camera pass.
**Justification:** Acceptance is silhouette change in chase, which a closer follow actually helps.

### Measured rest pose (node, makeLivingHull)
| class  | spanX | spanY | spanZ | max   | restScale |
|--------|-------|-------|-------|-------|-----------|
| light  | 6.60  | 0.70  | 4.20  | 6.60  | 1.00      |
| cutter | 9.68  | 0.91  | 8.12  | 9.68  | 1.67      |
| heavy  | 18.70 | 2.39  | 11.47 | 18.70 | 2.58      |

### Re-review
Pass 2: no Blocker/Major. MEDIUM/LOW (Minor/Suggestion) documented; no code change.
