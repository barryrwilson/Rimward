## Status
CLEAN
## What I tested
1. `python -m py_compile scripts/ship_builders/beautiful/freighter.py` from workspace root. Exit code 0.
2. AST walk of the same file for required calls: `whale_fluke`, `whale_pectoral`, `dorsal_ridge`, `garden_fold`, `nursery_hollow`, `sanctuary_hollow`.
3. AST walk for forbidden calls: `shark_dorsal`, `squid_mantle_fins`, `fin_membrane`, `box`.
4. Keyword scan of the `an.whale_pectoral` call for `style='blue'`.
5. AST extract of `_GARDENS` z-fraction ranges. Gap check that the three biomes do not overlap.
6. Token search for `kit.box`, `.box(`, `manta`, `wing`.
7. Read `build_freighter` in `scripts/ship_builders/beautiful/freighter.py` and `out/w106/freighter/notes.md`.
8. Read `an.whale_pectoral` / `an.whale_fluke` / `an.dorsal_ridge` in `scripts/ship_builders/beautiful/anatomy.py` and `org.garden_fold` / hollows in `scripts/ship_builders/beautiful/organs.py`.
9. Did not bake Blender. Did not start Vite.

## Bugs found
None.

## Environmental issues
None.

## Evidence
- Compile: `python -m py_compile scripts/ship_builders/beautiful/freighter.py` returned exit 0.
- Required calls in `scripts/ship_builders/beautiful/freighter.py`:
  - `an.dorsal_ridge` line 270 (`ridge-freighter`)
  - `an.whale_pectoral` line 283 (`fin-pectoral-` + stbd/port), `style='blue'`
  - `an.whale_fluke` line 291 (`fluke`, span=28.0, horizontal)
  - `org.garden_fold` line 317 (`garden-` + tag) for each `_GARDENS` biome at detail>=1
  - `org.nursery_hollow` line 405 when `occ > 0`
  - `org.sanctuary_hollow` line 408 when `occ == 0`
- `an.whale_pectoral` kwargs at L283: `root_chord=2.55`, `tip_chord=0.95`, `thick=0.42`, `style='blue'`. In `anatomy.py` L876–877, `style == 'blue'` selects triangle profile and short tip chord. Not humpback paddle.
- Forbidden body-plan calls: no AST hits for `shark_dorsal`, `squid_mantle_fins`, `fin_membrane`, `box`.
- `kit.box` / `.box(`: no matches. Wake uses `kit.sphere` (L307). Hollows use `kit.sphere` wells in `organs.py`.
- Three separated gardens in `_GARDENS` (L55–59):
  - fore zfrac `[-0.195, -0.055]`
  - mid zfrac `[0.025, 0.155]`
  - aft zfrac `[0.225, 0.345]`
  - gaps 0.080 and 0.070 of `l` (6.80 and 5.95 at `l=85`). Ranges do not overlap.
  - Primary masses `living-body-garden-{fore,mid,aft}` at L258–265 (all LOD). `org.garden_fold` per biome at L315–319.
- Body is one elongate `sf.grown_loft(..., 'body-main', ...)` (L235) from nose `l*-0.450` to tail `l*+0.462`. Peak half-width 6.50. Fluke span 28. Pectoral extra X 5.60. Not a manta diamond / wing planform.
- Token `manta` appears once: docstring L9 "not a humpback and not a manta". Token `wing` count 0.
- `out/w106/freighter/notes.md` matches this plan (blue-whale gardenback, `style='blue'`, three biomes, no kit.box / manta / shark_dorsal / squid_mantle_fins / fin_membrane).
- Raw AST dump: `out/w106/freighter/verify/ast_calls.txt`.
