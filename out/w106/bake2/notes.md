# Wave 106 — Beautiful Ones serial rebake 2

Bake order: ace, frigate, freighter.
Blender 5.2.0 LTS (`fbe6228777e7`). One Blender process at a time. Blender quit after each class. No blender.exe left running.

Did not edit Python builders. Did not restore Wave 95 GLBs.

## Gates

| gate | result |
|---|---|
| ace largest span >= 8.5 and < 11.0 cutter, preferably 8.6–9.2 | PASS 8.8 Z |
| measure ladder: light ≤ ace (within 15%) < cutter < heavy < frigate < freighter | PASS |
| frigate islands: 1 component | FAIL 1 FLOAT group |
| freighter islands: 1 component | FAIL 6 FLOAT groups |
| freighter lod0 tris ≤ 60000 | PASS 39252 |

## Per class

| class | bake | islands | span | lod0 tris |
|---|---|---|---|---|
| ace | ok (ace.hull) lod0–2 | PASS 1 body | 8.8 Z | 15752 |
| frigate | ok (frigate.hull) lod0–2 | FAIL 1 float group | 29.9 Z | 51824 |
| freighter | ok (body-main) lod0–3 | FAIL 6 float groups | 78.9 Z | 39252 |

## Measure (ALL PASS)

```
beautiful     light      verts= 31644 size=8.5(Z) len/beam=1.77 ht/len=0.26 beam/len=0.57 ctr x=0.0 y=0.0 z=-0.0 cover=98.3% fit:w=24%,h=24%,l=34%
beautiful     ace        verts= 28354 size=8.8(Z) len/beam=2.84 ht/len=0.16 beam/len=0.35 ctr x=0.0 y=0.0 z=0.0 cover=100.0% fit:w=24%,h=24%,l=34%
beautiful     cutter     verts= 40704 size=11.0(Z) len/beam=1.58 ht/len=0.40 beam/len=0.63 ctr x=0.0 y=0.0 z=-0.1 cover=100.0% fit:w=24%,h=24%,l=34%
beautiful     heavy      verts= 36224 size=15.9(Z) len/beam=1.21 ht/len=0.51 beam/len=0.83 ctr x=0.0 y=0.0 z=-0.1 cover=97.8% fit:w=24%,h=24%,l=34%
beautiful     frigate    verts=103200 size=29.9(Z) len/beam=2.39 ht/len=0.35 beam/len=0.42 ctr x=0.0 y=0.0 z=-0.4 cover=100.0% fit:w=24%,h=24%,l=34%
beautiful     freighter  verts= 79760 size=78.9(Z) len/beam=2.79 ht/len=0.17 beam/len=0.36 ctr x=0.0 y=0.0 z=-0.4 cover=100.0% fit:w=24%,h=24%,l=34%
beautiful class order OK: light=8.5 < ace=8.8 < cutter=11.0 < heavy=15.9 < frigate=29.9 < freighter=78.9
measure-ships: ALL PASS
```

Ace grew from 7.0 to 8.8. Light 8.5 is within 15% of ace. Cutter stays 11.0.

## Remaining FLOAT boxes — leave new GLBs; class-author re-dispatch

### frigate (voxel 0.06, 1 FLOATING PART GROUP)

```
main  cells=303925  x[ -6.24,  6.24]  y[ -5.16,  5.16]  z[-15.30, 14.52]
FLOAT cells=  1734  x[ -0.54,  0.60]  y[  0.06,  0.72]  z[ -0.96, -0.12]
```

One mid-body dorsal box at origin (y 0.06–0.72). 13 prior float groups at z≈5.76–5.94 are gone.

### freighter (voxel 0.06, 6 FLOATING PART GROUPS)

```
main  cells=1148611  x[-14.16, 14.16]  y[ -6.84,  6.84]  z[-39.84, 39.00]
FLOAT cells=   210  x[ -5.40, -5.16]  y[ -2.82, -2.64]  z[ -8.76, -7.68]
FLOAT cells=   208  x[  5.16,  5.40]  y[ -2.82, -2.64]  z[ -8.76, -7.68]
FLOAT cells=   202  x[ -5.40, -5.16]  y[ -2.82, -2.64]  z[-12.84,-11.70]
FLOAT cells=   201  x[  5.16,  5.40]  y[ -2.82, -2.64]  z[-12.84,-11.70]
FLOAT cells=   199  x[  5.16,  5.40]  y[ -2.76, -2.64]  z[-11.46,-10.38]
FLOAT cells=   199  x[ -5.40, -5.16]  y[ -2.76, -2.64]  z[-11.46,-10.38]
```

Port/starboard pairs. Small ventral-flank boxes at |x|≈5.16–5.40, y≈-2.82–-2.64, z from -12.84 to -7.68. Prior 10 large ridge/keel islands are gone. lod0 tris dropped 64152 → 39252.

Freighter lod3 exported. No `Warning: No mesh data to join` on this pass.

## Silhouette read

Six distinct animals. Not six mantas.

- light: reef shark — dorsal fin, caudal, gill stacks, barbels
- ace: squid — long mantle, lateral fins, siphon/tentacles
- cutter: hammerhead — T-head, shark body, ventral pods
- heavy: humpback — fat body, pectorals, ventral throat, dorsal mound
- frigate: octopus — oval mantle, trailing arms
- freighter: blue whale — long body, pectorals, tall fluke

## Verdict

Bake 2 is not a full gate pass. Ace span and fleet ladder pass. Freighter triangle budget passes. Frigate and freighter still have disconnected fittings. Re-dispatch class authors to weld those boxes. Do not restore Wave 95 GLBs.
