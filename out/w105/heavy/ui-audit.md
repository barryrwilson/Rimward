## UI Audit: Beautiful heavy Shieldback (Wave 105)

### Summary

CPU stills show a dense whale-like defender. The Wave 95 back turret is gone. No HUD chrome. Designer agent was not spawned.

### What's done well

- **Silhouette:** Side view is a blunt downturned snout, thick chest, tapering tail. Height still reads as the class.
- **Shield fins:** Raised walls in front view. Paddle tips, not daggers.
- **Mantles:** Grown overlapping lofts, not stacked discs. Side view is a continuous back, not plates.
- **Weapons:** Cyan vein fans in the skirt and fin roots. No barrels.
- **Vents:** Three mouths per flank, not a six-well bank.
- **Crown:** Low and short. Watchful, not a light-class fan.
- **Ladder:** heavy 15.3 stays between cutter 10.7 and frigate 29.0.
- **Player bar:** `src/systems/ship.js` living path was not edited.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Pearl/indigo edge is still a visor line in 3/4

**Location:** `out/w105/heavy/heavy-render.png`
**Issue:** Separate pearl lofts sit on indigo hull, so the colour split is a clean curve. It is muscle-shaped, not a turret, but it can still read as a nacre cap.
**Fix:** Keep. Shared paint would soften it. Out of class-file scope. Better than Wave 95 dome.

#### 💡 Suggestion: Shield fins stay a bit triangular in 3/4

Path-loft membranes cannot be rewritten here. Tip chord 2.20 already pads the dagger.

### HUD

Not in scope. No HUD chrome in these stills.

### Models Browser

Skipped. Optional. Wave 95 hung on "Loading asset." under headless swiftshader. Stills are `heavy-render.png` and `beautiful-shape.png`.

### Fail-closed

Did not restore Wave 95. New mesh beats the turret/plate stack on silhouette. Not a zoo copy. Not a player CPU clone.
