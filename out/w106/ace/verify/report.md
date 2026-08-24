## Status
CLEAN

## What I tested
1. `python -m py_compile scripts/ship_builders/beautiful/ace.py` (workspace root). Exit code 0.
2. Grep `scripts/ship_builders/beautiful/ace.py` for required anatomy: `squid_mantle_fins`, `squid_arm`, `feeding_tentacle`, `siphon`.
3. Grep same file for forbidden body-plan calls: `shark_dorsal`, `shark_caudal`, `octopus_arm`, `fin_membrane`.
4. Grep same file for `kit.box`, `.box(`, `fold_crease`, `window`, `nozzle`, `turret`.
5. Grep same file for `manta` / `wing`.
6. Read `build_ace`, `_mantle_stations`, and `_arm_layout` in `scripts/ship_builders/beautiful/ace.py`.
7. Read `an.squid_mantle_fins` in `scripts/ship_builders/beautiful/anatomy.py` (loc = rear mantle root, diamond pair along ±X).
8. Read `out/w106/ace/notes.md` for intended body plan.
9. Did not bake Blender. Did not start Vite.

## Bugs found
None.

## Environmental issues
None.

## Evidence
- Compile: `python -m py_compile scripts/ship_builders/beautiful/ace.py` returned exit 0.
- Required calls in `scripts/ship_builders/beautiful/ace.py`:
  - `an.squid_mantle_fins` line 194 (`ace-mantle`, loc `(0.0, yo_fin, z_fin)`, span=2.42)
  - `an.squid_arm` line 209 (`living-ace-arm-%d`) inside `for i, root, tip, dx, dy in arms` from `_arm_layout` `for i in range(8)` (lines 138–145): eight arms
  - `an.feeding_tentacle` line 215 (`living-ace-tentacle-%s`) over `tents` with tags `stbd` and `port` (lines 146–151): two feeding tentacles
  - `an.siphon` line 222 (`ace-siphon`, ventral loc, aim `(0.0, -0.22, 1.0)`)
- Forbidden body-plan tokens: no matches for `shark_dorsal`, `shark_caudal`, `octopus_arm`, `fin_membrane`. Also no `fold_crease`.
- `kit.box` / `.box(`: no matches. File uses `kit.ROLE_HULL` and `kit.ROLE_ARMOUR` only (`import ship_kit as kit` line 33).
- Fin placement is aft mantle, not mid-body wings:
  - Mantle stations: `z_nose = -l * 0.468` to `z_head = l * 0.100` (`_mantle_stations` lines 48–49).
  - `z_fin = l * 0.042` (line 180), passed as `loc[2]` to `squid_mantle_fins`.
  - Fraction along mantle: `(0.042 - (-0.468)) / (0.100 - (-0.468)) = 0.510 / 0.568 ≈ 0.90` from the nose. Near the head collar, not mid-body (`t ≈ 0.5` would be `z ≈ -l * 0.184`).
  - Comment at line 192: "Rhomboid pair at the AFT mantle."
  - `anatomy.squid_mantle_fins` (anatomy.py 683–698) builds a diamond pair along ±X from a shared mantle root; chord along +Z. Not a forward wing pair.
- Body assembly in `build_ace`: one fusiform `sf.grown_loft(..., 'ace.hull', ...)` from `an.fusiform_stations` (lines 52–53, 184–185); pearl head loft; aft mantle fins; eight `squid_arm`; two `feeding_tentacle`; ventral `siphon`; then (detail≥1) nacre, flow lines, vein fans, `org.sensory_crown` (count=6, small arc), port `an.healed_scar`.
- Only `manta` hit is docstring line 5: "not a manta and not an octopus". No `wing` token.
- `out/w106/ace/notes.md` matches the same plan (fusiform mantle, aft rhomboid fins, 8 arms, 2 tentacles, siphon; not manta, not octopus; no `kit.box`).
- No Blender process was started.
