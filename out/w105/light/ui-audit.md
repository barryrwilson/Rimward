## UI Audit: Beautiful light young wayfinder (Wave 105)

### Summary
CPU stills show a compact crown-forward creature. Box crease courses and eye-sphere cockpits are gone. Player CPU hull was not edited. No HUD chrome in this write-set.

### What's done well
- **Creature read:** Side silhouette is a short swimming body with a crown, not a plated tube.
- **Head:** Flat snout lobes + lifted throat. No eye-as-cockpit. Crown is the class cue.
- **Fins:** Broad paddle wings, smaller aft pair, flukes. Rounded tips.
- **Not a player clone:** Player manta is a wide disc (spanX 6.60, spanZ 4.20). Light is compact in Z with a raised back and forward filaments.
- **Not an Earth photocopy:** Marine vibe (ray + cetacean), not a named zoo animal.
- **No HUD:** Bake stills only. No designer spawn.

### Findings

No 🔴 Blocker.

#### 🟠 Major: none
Fold-bead chain and tusk paddles from the first bake were fixed before ship.

#### 🟡 Minor: nacre still reads as a pale dorsal cap
**Location:** `out/w105/light/light-render.png`
**Issue:** Pearl vs indigo is faction DNA. Two low pads beat Wave 95’s helmet plate, but the three-quarter view still shows a tonal cowling.
**Fix:** Keep. Lower bury already reduced the visor lip. Further flattening would kill the young-wayfinder pearl back.

#### 🟡 Minor: wing-root muscle can read as a chest pod
**Location:** `out/w105/light/light-render.png` flank
**Issue:** Two buried ellipsoids replace box creases. At a glance they can look like a drop tank.
**Fix:** Keep. They are inside the hull beam and share material with the wing root. A bead chain was worse.

#### 💡 Suggestion: Models Browser live still skipped
Headless overlay failed in Wave 95. This wave used CPU raster (`ship-render.mjs`, `silhouette-sheet.mjs`). Did not start Vite 5181 / CDP 9421.

### Player bar
`src/systems/ship.js` living path was not touched. NPC light is GLB + existing GPU swim. Glance is more animal than Wave 95 fusion, not a zoo, not a CPU clone. Fail-closed restore was not required.
