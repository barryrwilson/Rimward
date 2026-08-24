# Wave 105 Beautiful heavy — verifier notes

Verifier only. No rebake. No product `src/` edit. No GLB rewrite. Measure/islands/inspect on existing `public/assets/ships/beautiful/heavy/*.glb`.

Graph: `graph_resolve` returned `codex/workflow-image-generation` (score 74, coverage 0.07, terms `edit`/`visual`). Owner brief is ship-asset verification, not raster generation. Did not run Imagine. Did not start Vite.

## Commands

```
node scripts/measure-ships.mjs beautiful
node scripts/probe-ship-islands.mjs beautiful heavy lod0
```

Meshopt: read-only inspect of lod0/1/2 (EXT_meshopt_compression + triangle/draw/idle/glow gates). Did not run `compress-ship-assets.mjs`.

Logs: `measure.txt`, `islands.txt`, `meshopt.txt`. Stills copied: `heavy-render.png`, `beautiful-shape.png`, `beautiful-scale.png`.

## Measure (`beautiful` faction)

ALL PASS.

| class     | size | notes |
|-----------|------|-------|
| light     | 7.8(Z) | sibling span; do not blame heavy |
| ace       | 7.7(Z) | within 15% of light (charter `light ≤ ace`) |
| cutter    | 10.7(Z) | |
| heavy     | **15.3(Z)** | band `[10.20, 23.80]`; verts=30216; ht/len=0.47; cover=98.2% |
| frigate   | 29.0(Z) | |
| freighter | 83.2(Z) | |

Ladder: cutter 10.7 < heavy 15.3 < frigate 29.0.

## Islands (lod0)

`ONE CONNECTED BODY`. voxel=0.06, triangles=17448, cells=218888, x[−5.94,5.94] y[−3.60,3.60] z[−7.86,7.44].

Island triangle count is hull-voxel; GLB inspect reports 17616 tris including glow.

## Meshopt / contract (inspect)

All three LODs PASS.

- lod0 294328 B, meshopt, 3 prims, 17616/60000 tris, idle, glowZ=7.582
- lod1 144552 B, meshopt, 3 prims, 9080/24000 tris, idle, glowZ=7.582
- lod2 57500 B, meshopt, 3 prims, 4160/8000 tris, idle, glowZ=7.582

Root `RIMWARD_SHIP_ROOT`, hull `RIMWARD_HULL`, glow `RIMWARD_ENGINE_GLOW`, materials hull+emissive.

## Write-set

`git diff --stat` for this class: `scripts/ship_builders/beautiful/heavy.py`, `assets-source/ships/beautiful/heavy.blend*`, `public/assets/ships/beautiful/heavy/lod{0,1,2}.glb`.

`heavy.py` uses `sf.grown_loft` for body + three mantle lofts + crest. Comment forbids `org.dorsal_mantles` spheres. No `kit.sphere` in `heavy.py`. Uses `an.fin_membrane`, `org.belly_chamber`, `org.sensory_crown`, `org.breathing_vents` (shared helpers, not edited by this file).

Worktree also dirty: `light.py`, `organs.py`, `src/systems/ship.js`, other beautiful `.blend` files. Sibling BIO/light work. Heavy worker notes claim those files were not written. `organs.dorsal_mantles` still builds spheres; heavy does not call it. `ship.js` `makeLivingHull` rest-scale is player CPU, not the NPC GLB.

## Visual (CPU stills)

`heavy-render.png` (3/4): blunt downturned snout; low crown (short filaments); overlapping pearl dorsal lofts, not a sphere turret; three flank vents, no box crease wells; shield fins wide at the tip (paddle, not dagger). Pearl/indigo join is a hard tonal split (two meshes). Not a helmet of discrete plates; not a back turret.

`beautiful-shape.png` HEAVY: dense whale side, raised paddle shield fins, small aft dorsal spike (crest/fin), no circular turret. Front view is a Y of shield walls.

Wave 95 `out/w95/bio03/stills/beautiful-shape.png` already lacked a round turret in silhouette. Wave 95 Models Browser still hung on load (`06-models-beautiful-heavy.png` = “Loading asset…”). Current 3/4 still is the glance proof that the sphere stack is gone.

## Browser

[NO BROWSER COVERAGE]. Optional Models Browser (Vite **5184**, CDP **9424**) not started. Wave 95 hung on the same GLB load. Ports were not LISTENING at start or end. No verifier process left on those ports.

## Verdict

NPC heavy sculpt matches the wave contract on measure, islands, meshopt, and stills. Residual pearl edge is paint/mesh split, out of this write-set.
