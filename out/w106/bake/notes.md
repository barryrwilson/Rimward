# Wave 106 — Beautiful Ones serial bake

Bake order: light, ace, cutter, heavy, frigate, freighter.
Blender 5.2.0 LTS (`fbe6228777e7`). No second Blender process. Blender quit after each class.

Did not edit Python builders. Did not restore Wave 95 GLBs.

## Per class

| class | bake | islands | span | band | measure other | lod0 tris | animal read |
|---|---|---|---|---|---|---|---|
| light | ok (living-body-reef) | PASS 1 body | 8.5 Z | [4.08, 9.52] PASS | cover 98.3% | 16228 | reef shark |
| ace | ok (ace.hull) | PASS 1 body | 7.0 Z | [4.32, 10.08] PASS | cover 93.2% | 15224 | squid |
| cutter | ok (cutter.hull) | PASS 1 body | 11.0 Z | [6.60, 15.40] PASS | cover 100% | 20548 | hammerhead |
| heavy | ok (heavy-body) | PASS 1 body | 15.9 Z | [10.20, 23.80] PASS | cover 97.8% | 18324 | humpback |
| frigate | ok (frigate.hull) | FAIL 13 float groups | 29.9 Z | [19.20, 44.80] PASS | cover 100% | 48732 | octopus |
| freighter | ok (body-main) | FAIL 10 float groups | 78.9 Z | [66.00, 109.20] PASS | cover 100% | 64152 OVER 60k | blue whale |

Proportions (Beautiful relief minLengthOverBeam 0.55, minBeamOverLength 0.35, maxHeightOverLength 0.60): all six pass.
Pivot centroid ±0.15 span: all six pass.
Proxy cover ≥ 80%: all six pass.

## Measure FAIL

```
beautiful CLASS ORDER FAIL: ace(7.0) < light(8.5) by more than 15%
measure-ships: 1 FAILING
```

Ladder required: light ≤ ace (within 15%) < cutter < heavy < frigate < freighter.
Actual: 8.5, 7.0, 11.0, 15.9, 29.9, 78.9.
Ace is 17.6% smaller than light. Cutter through freighter order is correct.

## Island FAIL — leave new GLBs; class-author re-dispatch

### frigate (voxel 0.06, 13 FLOATING PART GROUPS)

```
main  cells=310471  x[ -6.24,  6.24]  y[ -5.16,  5.16]  z[-15.30, 14.52]
FLOAT cells=   113  x[ -2.16, -1.86]  y[ -1.14, -0.78]  z[  2.40,  2.70]
FLOAT cells=   106  x[ -1.26, -0.96]  y[ -0.54, -0.24]  z[ -0.36,  0.00]
FLOAT cells=    69  x[  0.42,  0.66]  y[ -0.48, -0.24]  z[ -0.60, -0.36]
FLOAT cells=    28  x[  1.74,  1.92]  y[ -0.42, -0.30]  z[  5.76,  5.94]
FLOAT cells=    28  x[ -1.92, -1.74]  y[ -0.42, -0.30]  z[  5.76,  5.94]
FLOAT cells=    28  x[ -2.52, -2.34]  y[ -2.34, -2.22]  z[  7.80,  7.92]
FLOAT cells=    26  x[  2.58,  2.70]  y[ -1.08, -0.96]  z[  5.76,  5.94]
FLOAT cells=    26  x[ -0.06,  0.06]  y[ -0.12,  0.00]  z[  5.76,  5.94]
FLOAT cells=    25  x[ -2.70, -2.58]  y[ -1.08, -0.96]  z[  5.76,  5.94]
FLOAT cells=    25  x[ -0.06,  0.06]  y[ -1.98, -1.86]  z[  5.76,  5.94]
FLOAT cells=    24  x[ -1.92, -1.80]  y[ -1.74, -1.62]  z[  5.76,  5.94]
FLOAT cells=    24  x[  1.80,  1.92]  y[ -1.74, -1.62]  z[  5.76,  5.94]
FLOAT cells=    21  x[ -0.06,  0.06]  y[ -0.24, -0.12]  z[  7.80,  7.92]
```

Many float boxes sit at z≈5.76–5.94 (aft of centre). Likely small fittings that do not touch the mantle.

### freighter (voxel 0.06, 10 FLOATING PART GROUPS)

```
main  cells=1161601  x[-14.16, 14.16]  y[ -7.32,  7.32]  z[-39.84, 39.00]
FLOAT cells=  6782  x[ -5.88, -2.64]  y[  2.28,  3.66]  z[-25.44, 18.42]
FLOAT cells=  4749  x[  2.94,  5.88]  y[  2.28,  3.36]  z[-25.44, 18.42]
FLOAT cells=  4674  x[  2.52,  5.64]  y[ -4.14, -3.90]  z[-27.42, -7.44]
FLOAT cells=  4662  x[ -5.64, -2.52]  y[ -4.14, -3.90]  z[-27.42, -7.44]
FLOAT cells=  3604  x[ -4.74, -3.00]  y[ -5.04, -4.80]  z[-22.92, -7.44]
FLOAT cells=  3598  x[  3.00,  4.74]  y[ -5.04, -4.80]  z[-22.92, -7.44]
FLOAT cells=   885  x[ -5.16, -4.80]  y[  3.42,  3.72]  z[-14.70, -9.78]
FLOAT cells=   881  x[  4.80,  5.16]  y[  3.42,  3.72]  z[-14.70, -9.78]
FLOAT cells=   870  x[  4.50,  5.10]  y[  2.70,  3.06]  z[  3.60,  8.52]
FLOAT cells=   869  x[ -5.10, -4.50]  y[  2.70,  3.06]  z[  3.60,  8.52]
```

Port/starboard pairs. Likely dorsal ridges and ventral keels that sit off the hull.

Bake log: `Warning: No mesh data to join` on freighter lod3. lod3 still exported.

## Silhouette read

Six distinct animals. Not six mantas.

- light: reef shark — dorsal fin, caudal, gill stacks, barbels
- ace: squid — mantle, lateral fins, siphon/tentacles
- cutter: hammerhead — T-head, shark body, ventral pods
- heavy: humpback — fat body, pectorals, ventral throat, dorsal mound
- frigate: octopus — oval mantle, trailing arms
- freighter: blue whale — long body, pectorals, tall fluke

## Geometry fix needed (class authors)

1. ace — grow span so ace ≥ light and within 15%, still in [4.32, 10.08]. Or shrink light. Target ace 7.2, light 6.8.
2. frigate — weld the 13 float groups (mostly z 5.76–5.94 and two mid-body boxes).
3. freighter — weld the 10 flank float groups; cut lod0 tris from 64152 to ≤ 60000.

validate-ship-assets.mjs not run (whole fleet).
