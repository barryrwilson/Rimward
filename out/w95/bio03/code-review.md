## Code Review: BIO-03 Beautiful class look + bake

### Summary
Six class files plus `organs.py` were tuned vs plates and glance law, then rebaked. Measure and validate pass. Runtime `src/` is untouched.

### What's done well
- Disjoint class files keep identity (crown vs dart vs cradle vs shield fins vs four hollows vs three gardens).
- Shared `organs.py` changes stay serial: mantle stack along the spine, garden ridges scale with biome span.
- Fail-closed Wave 8 copies sit in `out/w95/bio03/wave8-keep/`.
- Light wing span was pulled back after proxyCover 78% so measure passed.

### Findings

No 🔴 Blocker or 🟠 Major issues.

#### 🟡 Minor: Light span is 8.0 vs ace 7.7
**Location:** live `measure-ships.mjs` ladder (15% slack); `out/w95/bio03/measure.txt`
**Issue:** Strict `light ≤ ace` is inverted by 0.3. The live gate allows ace >= light*0.85.
**Fix:** Optional: shorten light crown reach. Not required for ALL PASS.

#### 💡 Suggestion: Models Browser `ship:player` has no `update()`
**Location:** `src/game/model-catalog.js` (read-only)
**Issue:** Player catalog entry is a static `makeLivingHull` mesh. CPU swim is in-game only. Pre-existing. This wave did not edit `src/`.

### Re-review
After the light wing proxy fix, `npm run ships:measure` is ALL PASS and `npm run ships:validate` is PASS. No remaining HIGH/CRITICAL.
