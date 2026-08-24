# Wave 105 Beautiful light — verifier notes

Graph: `graph_resolve` (`omp/agent-omp`) returned `proceed_unmodeled`. No binding workflow.

Verifier started no Vite, Chrome, or Blender. Ports 5183 / 9423 / 5181 / 9421 were not LISTENING at start and end.

## Write-set

This class (dirty, expected):

- `scripts/ship_builders/beautiful/light.py` (197 insertions, 266 deletions)
- `assets-source/ships/beautiful/light.blend` and `.blend1`
- `public/assets/ships/beautiful/light/lod0.glb` `lod1.glb` `lod2.glb`
- `out/w105/light/**`

Forbidden for this worker, **no uncommitted diff**:

- `scripts/ship_builders/beautiful/anatomy.py`
- `scripts/ship_builders/beautiful/surface.py`

Forbidden for this worker, **dirty from siblings** (not light bake):

- `scripts/ship_builders/beautiful/organs.py` — `garden_fold` span scale + `dorsal_mantles` aft overlap. Light calls `org.sensory_crown` only. Diff does not touch crown.
- `scripts/ship_builders/beautiful/heavy.py` plus other Beautiful class builders / GLBs / blends (Wave 105 siblings).
- `src/systems/ship.js` — BIO-06/07 `classKey` rest-scale on player living hull. `makeLivingHull` still sculpts `SphereGeometry(1, 64, 40)` with manta disc, whip tail, flatten, head bulge. NPC light is not this path.

Worker claim "no `src/` writes" holds for this sculpt. Tree is dirty from other waves.

## `light.py` organic claims

- No `fold_crease`. No `kit.box` (comment only at fold flesh).
- `_fold_flesh`: two buried `kit.sphere` muscle masses, not box courses.
- Two nacre lofts: `living-body-light.brow` + `living-body-light.shoulder`, not one helmet plate.
- Flat snout lobes: `living-lobe-*` spheres `(0.58, 0.14, 0.46)` at snout.
- Soft crest loft `living-crest-light`. Throat loft, not turret sphere.
- Forward crown `count=8`. Paddle wings tip chord 1.35, thick 0.16, tips at x=±3.42.
- Envelope docstring: `l = 7.8`. Primary masses not gated on detail.

## Gates (re-run)

`node scripts/measure-ships.mjs beautiful` → ALL PASS. Log: `out/w105/light/verify/measure.txt`.

```
beautiful     light      verts= 18620 size=7.8(Z) len/beam=1.14 ht/len=0.42 beam/len=0.88 cover=82.0%
```

- `SHIP_SCALE.light.span` = `[4.08, 9.52]`. 7.8 is inside.
- Verts 18620 inside 4000–25000.
- Cover 82.0% ≥ 80%. Fit w/h/l = 24/24/34 (charter +25/+25/+35).
- len/beam 1.14 (wide manta; owner did not force 1.15).
- Ladder vs **published Wave 95 others**: ace 7.7, cutter 10.7, heavy 15.3, frigate 29.0, freighter 83.2. Live gate: ace ≥ light×0.85 (6.63). 7.7 ≥ 6.63. Same family as Wave 95 (then light 8.0 vs ace 7.7). Light did not break the slack ladder.
- Live print still writes `light=7.8 < ace=7.7` while 7.8 is not strictly less. Gate is 15% slack, not strict `<`. Not a light fail.
- Sibling heavy verts 30216 / cover 98.2% vs worker snapshot 30212 / 98.7%. Not this class.

`node scripts/probe-ship-islands.mjs beautiful light lod0` → ONE CONNECTED BODY.

```
main  cells= 40280  x[ -3.42,  3.42]  y[ -1.62,  1.62]  z[ -3.90,  3.90]
```

Span Z 7.80. Beam X 6.84. Island triangles 11640 (hull voxel; glow not in that census).

Meshopt (binary `EXT_meshopt_compression`) on public lods:

```
lod0 bytes=194152 meshopt=true
lod1 bytes=135228 meshopt=true
lod2 bytes=87188 meshopt=true
```

Targeted gltf-transform checks (caps, COLOR_0, idle, glow name): `out/w105/light/verify/validate-light.txt` PASS.

Wave 95 keep sizes differ (lod0 198124 vs live 194152). Bake is not a restore.

## Visual (CPU stills)

Read:

- `out/w105/light/light-render.png`
- `out/w105/light/beautiful-shape.png` (light = top row)
- `out/w105/light/beautiful-render.png` (light vs other Beautiful classes)

Creature vs plated fusion: organic loft, crown-forward filaments, paddle wings, flukes, throat + flat snout lobes. Dorsal nacre is two low pads, still a pale cap vs indigo hull (faction DNA). No box crease courses. Not a visor helmet. Compact Z vs player manta disc (P spanX 6.60, spanZ 4.20 in `ship-scale.js`). Distinct from ace dart / cutter / heavy / frigate / freighter on the sheet.

[NO BROWSER COVERAGE] Did not start Vite 5183 or CDP 9423. Wave 95 Models Browser overlay hung on "Loading asset."

## `makeLivingHull`

`src/systems/ship.js` 274–334 still exports `makeLivingHull(classKey = 'light')` with manta sculpt. Uncommitted delta is class rest-scale / silhouette for cutter and heavy player hulls, not NPC GLB. `npc.js` does not call this. This worker did not rewrite the CPU hull.

## Status call

CLEAN. Optional live Models Browser skipped as ENV. Sibling dirt is not a light bug.
