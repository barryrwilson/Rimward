## Status
CLEAN
## What I tested
1. `python -m py_compile scripts/ship_builders/beautiful/cutter.py` (workspace root). Exit code 0.
2. AST walk of the same file (`out/w106/cutter/verify/ast_scan.py`) for required calls: `shark_dorsal`, `shark_caudal`, `shark_pectoral`, `gill_slits`, `belly_chamber`.
3. AST walk for forbidden calls: `squid_mantle_fins`, `octopus_arm`, `whale_fluke`, `fin_membrane`, `box`.
4. Grep of `cutter.py` for `kit.box`, `.box(`, and the forbidden primitive names.
5. Grep of `cutter.py` for `manta` / `wing`.
6. Read `_cutter_stations` and `build_cutter` in `scripts/ship_builders/beautiful/cutter.py`.
7. Read `out/w106/cutter/notes.md` for the intended hammerhead plan.
8. Confirmed defs exist: `anatomy.shark_dorsal`, `shark_caudal`, `shark_pectoral`, `gill_slits`; `organs.belly_chamber`.
9. Did not bake Blender. Did not start Vite. No leftover processes.

## Bugs found
None.

## Environmental issues
None.

## Evidence
- Compile: `python -m py_compile scripts/ship_builders/beautiful/cutter.py` returned exit 0. Log: `out/w106/cutter/verify/compile.log`.
- AST dump: `out/w106/cutter/verify/ast_scan.out`.
- Required calls in `scripts/ship_builders/beautiful/cutter.py`:
  - `an.shark_dorsal` line 192 (`fin-dorsal-cutter`) — before the `detail < 1` return, so silhouette keeps the blade.
  - `an.shark_caudal` line 199 (`fin-caudal-cutter`) — heterocercal upper/lower tips.
  - `an.shark_pectoral` line 212 (`fin-pectoral-cutter.` + port/stbd) — one call site, two sides in the loop.
  - `org.belly_chamber` line 236 (`'cutter'`) — ventral pouch, detail 1+.
  - `an.gill_slits` line 249 (`cutter.gills.` + tag, `count=5`) — both sides, detail 1+.
- Forbidden body-plan tokens: no matches for `squid_mantle_fins`, `octopus_arm`, `whale_fluke`, `fin_membrane`. AST reports `box` as none.
- `kit.box` / `.box(`: no matches. `kit.` uses are `ROLE_HULL`, `ROLE_ARMOUR`, and `kit.sphere` only (hammer tip/bar, pectoral root/curl).
- Head is a cephalofoil, not a manta wing pair:
  - One fusiform `sf.grown_loft` at line 170 (`cutter.hull`) plus a narrow pearl loft at line 174. Not paired wing lofts along Z.
  - `_cutter_stations` lines 65–83: half-beam peaks at `b*0.520` on a short brow run (`z = l*-0.478` … `l*-0.352`, 13% of hull Z), then snaps to neck `b*0.228`, then thorax `b*0.298`.
  - Envelope `l=11`, `b=5.28`: foil beam 5.49, thorax beam 3.15, extra brow beam 2.34 = 0.213*l (>= 0.15*l). Foil half-height 0.33 vs thorax 0.94 (flat T-bar, not a pancake wing).
  - Lines 181–188: paired `kit.sphere` nacre lobes `living-hammer-cutter.tip/bar` on ±X at `z_foil`. Comment: "T-bar muscle on ±X, not wings".
- `manta` / `wing` hits are comments/docstrings only (not manta, not wings). No manta primitives.
- `out/w106/cutter/notes.md` matches the same plan (adult hammerhead, cephalofoil, shark fins, belly chamber, no `kit.box`).
