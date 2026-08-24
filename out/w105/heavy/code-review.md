## Code Review: scripts/ship_builders/beautiful/heavy.py

### Summary

Heavy Shieldback now builds dorsal mass from overlapping `sf.grown_loft` muscle, not `org.dorsal_mantles` spheres. Measure 15.3, islands connected. No Blocker or Major.

### What's done well

- Surface queries seat crest, vents, veins, pouch, and scars.
- Fin roots stay inside the hull.
- LOD still drops veins/vents/crown; primary masses stay at detail 0.
- Fail-closed trial of saddle scallops was reverted when side view read as plates.

### Findings

#### 🟡 Minor: `_heavy_stations` ignores `b` and `h`

**Location:** `scripts/ship_builders/beautiful/heavy.py` `_heavy_stations`
**Issue:** Parameters match the driver signature but the body uses `l` only. Same pattern as the prior heavy file.
**Fix:** Keep. Driver always passes `(l, b, h)`.

#### 💡 Suggestion: pearl/indigo is still two meshes

**Location:** `build_heavy` mantle lofts vs `heavy-body`
**Issue:** Vertex colour cannot blend across objects, so the mantle edge stays a hard tonal split in 3/4 view.
**Fix:** Needs a shared-module paint change. Out of this worker's write scope.

### Verdict

Clean for ship. Comment-only cap wording was corrected. No rebake required for that comment.
