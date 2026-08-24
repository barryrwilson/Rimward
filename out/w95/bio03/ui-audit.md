## UI Audit: Beautiful NPC class glance (Wave 95)

### Summary
CPU silhouette and shaded sheets show six different creatures. Player living hull in-game remains the unique CPU manta. Models Browser GLB stills did not finish load under headless swiftshader; sheets replace that glance proof.

### What's done well
- **Light:** Crown-forward wayfinder. Cephalic lobes read as flat paddles, not eyes. Not a clone of the player manta disc.
- **Ace:** Thin dart, swept fins, low nose fan. Distinct from light.
- **Cutter:** Ventral pouch and streamers. Vent row is two mouths, not an engine bank. Hold is an open cradle, not a toothed mouth.
- **Heavy:** Raised shield fins in front view. Mantles sit as overlapping back mass, not fitted plates.
- **Frigate:** Long elder, four fin pairs, four flank hollows. Not a scaled heavy.
- **Freighter:** Three dorsal garden mounds now read at thumbnail. Colossal vs frigate on the scale sheet.
- Size ladder on `beautiful-scale.png`: light/ace small → cutter → heavy → frigate → colossal gardenback.

### Findings

No 🔴 Blocker.

#### 🟠 Major: Models Browser GLB stills stayed on "Loading asset."
**Location:** `out/w95/bio03/stills/03-models-beautiful-*.png`
**Issue:** Headless Chrome + swiftshader did not finish NPC GLB prime in the overlay. Player catalog mesh did render (`02-models-player.png`).
**Fix:** CPU raster sheets (`beautiful-shape.png`, `beautiful-render.png`) plus in-game living starter (`01-starter-living.png`). GLBs validate and measure. Not a mesh hole.

#### 🟡 Minor: Frigate hollows still stamp as round flank mouths
**Location:** `out/w95/bio03/stills/beautiful-render.png` frigate cell
**Issue:** Four hollows remain circular. Staggered y/z reduces a manufactured bay row, but they still read as portholes at a glance.
**Fix:** Keep. Not a zoo. Wave 8 was the same family. Fail-closed restore was not required.

#### 💡 Suggestion: Light front view lobes are wide paddles
They beat the old eye spheres. They can look ear-like nose-on. Judge from quarter view as the pipeline asks.

### Player bar
`01-starter-living.png`: independent living light, vein skin, no nozzle. `02-models-player.png`: `ship:player` is still `makeLivingHull` (1 mesh, 4992 tris). NPC Beautiful stay GLB + GPU.
