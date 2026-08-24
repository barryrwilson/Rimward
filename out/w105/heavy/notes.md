# Wave 105 — Beautiful heavy (Shieldback)

**Class:** `beautiful/heavy` NPC GLB only. Player living path not touched.

## Result

Shipped new heavy mesh. Did not restore Wave 95 GLB.

- Span 15.3(Z), same Wave 95 band. ht/len 0.47. Ladder cutter 10.7 < heavy 15.3 < frigate 29.0.
- Islands: one connected body.
- Meshopt on lod0/1/2.
- Turret-dome sphere stack removed. Dorsal mass is three overlapping grown lofts.
- Box `fold_crease` wells removed. Vents 6 → 3, inset.
- Snout blunter and downturned. Crown flatter. Shield tips are paddles.

## Commands (final)

```
blender -b -P scripts/build-ship-assets.py -- beautiful --class=heavy
node scripts/compress-ship-assets.mjs beautiful/heavy
node scripts/measure-ships.mjs beautiful
node scripts/probe-ship-islands.mjs beautiful heavy lod0
```

Blender 5.2.0 LTS (`fbe6228777e7`). Logs: `bake5.log`, `compress5.log`, `measure5.log`, `islands5.log`.

## Glance

- `heavy-render.png` — no back turret. Pearl lofts still meet indigo on a visible edge (separate meshes). Better than Wave 95 dome.
- `beautiful-shape.png` — whale side, dense height, raised shield fins.
- Saddle/scallop trial read as shell plates; reverted to smooth overlap.

## Scope

Wrote only `scripts/ship_builders/beautiful/heavy.py`, heavy blend/GLB, and this folder. Did not edit `organs.py`, `anatomy.py`, `surface.py`, other class files, or `src/`.

Models Browser on 5182/9422 not run (optional; Wave 95 hung on load). CPU stills used instead.

5182 and 9422 were not LISTENING after bake. Blender quit. Did not kill the user's Chrome.
