## Security Review: src/systems/ship.js living remount classKey

### Risk Level: Low

### Summary
Client-side player-mesh remount. classKey is treated as a save-controlled enum: `scaleFor` uses `Object.hasOwn`, silhouette uses exact string equals, unknown keys fail closed to the light sculpt. No secrets, network, eval, or privilege paths were added.

### Findings

None.

#### 🔴 CRITICAL
None.

#### 🟠 HIGH
None.

#### 🟡 MEDIUM
None.

#### 🟢 LOW
None.

### Passed Checks
- [x] No secrets, API keys, or credentials in the diff
- [x] classKey is not used as a raw object index (`livingSilhouette` is `===` only; `livingRestScale` uses `scaleFor`)
- [x] `__proto__` / unknown classKey measures identical to light (fail closed)
- [x] No new eval, dynamic import URLs, or remote GLB paths
- [x] Living path stays CPU `makeLivingHull`; no NPC asset load on living remount
- [x] Built remount still uses `buildBuiltVisual(classKey, faction)`
- [x] Unknowables still force `hullKind: 'living'` before the mesh branch
- [x] No shipyard buy-flow change (no remount-on-buy)

### Recommendations
1. Keep classKey sanitization in hangar (`classKeyOf`) as the persist boundary; this file already fails closed if a bad key arrives.
2. Do not later map user words such as "destroyer" here; hangar/SKU already own that vocabulary (`heavy`).

### Re-review
Pass 2 after implementation: no HIGH/CRITICAL; no code change required.
