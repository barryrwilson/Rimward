# Beautiful Ones frigate — travel-pose octopus elder (wave 106)

Class file: `scripts/ship_builders/beautiful/frigate.py`.
Entry: `build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail)`.

## Body plan

Travel-pose octopus. Mantle / head toward -Z. Eight arms trail toward +Z.

- Round `grown_loft` mantle (sack, not a fusiform shark, not a dart).
- No rear rhomboid mantle fins (not a squid).
- No coordinated manta fin pairs.
- No long whale body with flank hangar holes.
- Arms from `an.travel_arm_tips(hub, length, count=8, spread=0.40, drop=0.22)`
  then `an.octopus_arm` for each. Outline-breaker is the trailing arm set
  (arm run ≈ 0.48 l, well above 15 % of length).
- `an.interbrachial_web` is a trailing skirt under the arms (sanctuary),
  not a disc in the XY plane.
- Four hollows sit in the web folds: two forward `nursery_hollow` with
  nested companions, two aft `sanctuary_hollow`. Grown lips, face='y'.
- Deep `org.sensory_crown` (16 filaments at detail 3, long arc).
- Three `an.healed_scar` welts on the port mantle.
- Stern: arm tips and web end just short of driver glow at z = +l*0.47.
  No nozzle.

Thumbnail read: round head + eight trailing arms.

## Envelope

- l = 32.0, b = 12.48, h = 8.32
- Span band [19.20, 44.80]
- Authored spanZ ≈ 30 (nose ≈ -15.0, arm tips ≈ +14.9)
- Authored spanX ≈ 12.2 (0.40 spread on 15.4 arm length)
- spanZ / spanX high; not a sunburst
- Vertex aim [16 000, 84 000]
- Glow wake at z = +l*0.47

Measured numbers wait for bake. This wave is py_compile only.

## LOD

| detail | Contents |
|--------|----------|
| 3 | mantle, hood, 8 arms + suckers, web, 4 hollows, crown, vents, folds, veins, scars |
| 2 | fewer suckers (anatomy 3/arm), fewer vents / veins / crown |
| 1 | mantle, 8 arm tubes, web, hollow wells, crown hint, scar chords |
| 0 | mantle + 8 arms + web. All eight arms stay. |

## Paint (dual rule)

- hull indigo — `frigate.hull` ROLE_HULL
- pearl — `living-body-frigate.hood`, `living-arm-frigate.*`, `living-web-frigate`, `living-body-mantle-*` ROLE_ARMOUR
- nerve — `nerve-frigate.fan.*` ROLE_ACCENT (vein_fan)
- crown — `sensory-crown-frigate.crown.*` (organ names)
- trim — scars, hood-margin flow lines ROLE_TRIM
- recess — hollow wells ROLE_RECESS
- glow — crown tips, vent breath, hollow breath, companion wake

No kit.box, no windows, no nozzles, no turrets, no teeth.

## Forbidden calls (this class)

Do not use `squid_mantle_fins`, `shark_dorsal`, `whale_fluke`, `whale_pectoral`,
`siphon`, `feeding_tentacle`, or manta `fin_membrane` as the plan.

## Island weld (post-centre lod0, voxel 0.06)

Bake probe reported 13 FLOATING PART GROUPS. Main octopus held. Mapped
boxes to constructs (authored, then AABB-centred):

- 8 groups at z≈5.76–5.94 (21–28 cells) plus 2 at z≈7.80–7.92: sucker
  spheres from `an.octopus_arm`. Anatomy places the row on the arm axis
  (`offset = sucker_r * 0.55 ≈ 0.047`). Island probe fills mesh *shells*,
  so an interior sphere never touches the tube wall.
- 3 compact groups (69–113 cells): `grown_lip` beads on default
  `sf.HOLLOW` (2.5 × 3.2), which is wider than the web between two
  travel-pose arms. Stray beads hang off the skirt.

Fixes in `frigate.py` only (shared anatomy/organs untouched):

- `octopus_arm(..., suckers=False)` then `_bury_suckers`: sphere centre
  `arm_r - 0.12` along inward, radius ≥ 0.14, so the pad cuts the tube
  shell (overlap > 0.10).
- Hollow mouths at `y_drop=0.02` (in the sheet). Pocket size
  `(0.62, 0.48, 0.88)`. `_web_plug` at each fold. Companion pin sphere
  between mouth and nested body.
- Crown loc on the forehead skin (`yo + hh - 0.18`). Root pad plus
  shafts r=0.10 and glow r=0.12 at the organ tip points.
- Web thick 0.22. Arm-crown nacre moved to t=0.02 and enlarged.

Travel pose, eight trailing arms, no squid fins, no shark dorsal.
`python -m py_compile` exit 0. Next bake: `probe-ship-islands.mjs
beautiful frigate lod0` must report 1 component.

## Island weld 3 (post-centre lod0, voxel 0.06)

Bake 2 left 1 FLOATING PART GROUP:

```
FLOAT cells=1734  x[-0.54, 0.60]  y[0.06, 0.72]  z[-0.96, -0.12]
```

AABB size 1.14 x 0.66 x 0.84, midline, slightly above centre after
AABB-centre (dropped arms pull y-origin down). Authored, before the
~(+0.29 Z, -0.62 Y) centre shift, this is:

```
arm-crown nacre  x[-0.60, 0.60]  y[-0.64, 0.09]  z[-0.69, 0.15]
```

Match: `an.nacre_pads` on `crown_path` at t=0.02. Eight pads of
(0.48, 0.32, 0.42) sit on the hub axis inside the mantle loft cavity.
The loft is a thin shell; interior ellipsoids never share a voxel with
the wall. Not the sensory crown (that seats at z=l*-0.385 ≈ -12.32).
Not a hollow lip (those sit in the web at z>1.5, y negative).

Fix in `frigate.py` only:

- `_mantle_bury`: binary-search the hub->tip hit on the mantle ellipse,
  then step 0.18 inboard along the section normal.
- Seat the eight arm-crown pads on those hits. Radii (0.52, 0.40, 0.48)
  so each pad crosses the shell (overlap > 0.15).
- Keep sensory-crown loc and fat shafts from the last pass. Hollows
  unchanged.

Travel pose, eight trailing arms, no squid fins, no shark dorsal.
`python -m py_compile` exit 0. Next bake: `probe-ship-islands.mjs
beautiful frigate lod0` must report 1 component.
