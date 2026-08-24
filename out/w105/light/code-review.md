## Code Review: `scripts/ship_builders/beautiful/light.py`

### Summary
Young-wayfinder sculpt uses grown lofts, paddle fins, and buried flesh. Measure, islands, and Meshopt pass. Runtime `src/` is untouched.

### What's done well
- No `kit.box` crease courses. Fold mass is overlapping ellipsoids.
- Nacre is two overlapping pads, not one canopy plate.
- Head identity is flat lobes + throat loft + forward crown, not an eye cockpit.
- LOD ladder still drops organs at detail 0 and keeps primary masses.
- Island probe: one connected body. Span 7.8 stays in band.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: proxyCover 82.0% is close to the 80% floor
**Location:** `out/w105/light/measure.txt`
**Issue:** Wave 95 light was 83.5%. Flat lobes and lower nacre cut cover. Gate still passes.
**Fix:** Keep. Do not widen wings past the Wave 95 span pull. Not required.

#### 🟡 Minor: light 7.8 vs ace 7.7 inverts strict `light ≤ ace`
**Location:** live `measure-ships.mjs` 15% slack
**Issue:** Same family as Wave 95 (8.0 vs 7.7). Live gate allows ace >= light*0.85.
**Fix:** Optional. Not required for ALL PASS.

#### 💡 Suggestion: docstring still says “cephalic PADDLES” in the plate line
**Location:** `light.py` header
**Issue:** Geometry is flat fused lobes. Body-plan section matches.
**Fix:** Optional wording. No bake impact.

### Envelope / LOD / connectivity
- Envelope: size 7.8(Z), band 4.08–9.52, verts 18620, cover 82.0%, len/beam 1.14 (wide manta allowed).
- LOD: driver still bakes lod0–2 from detail 3/2/1. Primary masses are not gated on detail.
- Connectivity: `probe-ship-islands.mjs beautiful light lod0` → ONE CONNECTED BODY.

### Re-review
After fold-bead and tusk-paddle fixes, gates stay green. No remaining HIGH/CRITICAL.
