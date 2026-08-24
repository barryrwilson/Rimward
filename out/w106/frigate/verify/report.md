## Status
CLEAN

## What I tested
- Domain: data. No bake.
- `python -m py_compile scripts/ship_builders/beautiful/frigate.py` (exit 0). Log: `out/w106/frigate/verify/py_compile.txt`.
- AST walk of `scripts/ship_builders/beautiful/frigate.py` for required calls, forbidden calls, `kit.box`, and arm count.
- Source read of `build_frigate`, `_build_arms_and_web`, `_hollows`, `_frigate_stations`, `_arm_hub`.
- Source read of `an.travel_arm_tips`, `an.octopus_arm`, `an.interbrachial_web` in `scripts/ship_builders/beautiful/anatomy.py`.
- Source read of `org.nursery_hollow` / `org.sanctuary_hollow` in `scripts/ship_builders/beautiful/organs.py`.
- Graph resolve returned `codex/workflow-image-generation` (false match: raster-image trigger). This task is compile + source inspect only. Image tools were not used.

## Bugs found
None.

## Environmental issues
None. `py_compile` ran on local Python and returned exit 0.

## Evidence

### 1. Compile
```
python -m py_compile scripts/ship_builders/beautiful/frigate.py
EXIT:0
```

### 2. Required calls (AST)

| Call | Count | Line(s) |
|------|-------|---------|
| `an.travel_arm_tips` | 1 | 258 |
| `an.octopus_arm` | 1 (inside `for i, tip in enumerate(tips)`) | 125 |
| `an.interbrachial_web` | 1 | 129 |
| `org.nursery_hollow` | 2 | 154, 157 |
| `org.sanctuary_hollow` | 2 | 163, 166 |

`travel_arm_tips` is called with `count=8`:

```258:258:scripts/ship_builders/beautiful/frigate.py
    tips = an.travel_arm_tips(hub, arm_len, count=8, spread=0.40, drop=0.22)
```

Each tip becomes one `octopus_arm`. `len(tips)` is 8. `_build_arms_and_web` runs before the `detail < 1` return, so all eight arms stay at detail 0.

```115:130:scripts/ship_builders/beautiful/frigate.py
def _build_arms_and_web(parts, hub, tips, hull_mat, detail):
    """Eight trailing octopus arms plus the interbrachial skirt.

    All eight arms stay at every detail. Suckers thin inside octopus_arm.
    Web is primary mass (anatomy keeps it at detail 0).
    """
    n = len(tips)
    for i, tip in enumerate(tips):
        root = _lerp(hub, tip, 0.06)
        root_r = 0.50 + 0.04 * ((i % 3) - 1)
        an.octopus_arm(parts, 'living-arm-frigate.%02d' % i, hull_mat,
                       root, tip, root_r=root_r, tip_r=0.10,
                       suckers=True, inward=_arm_inward(hub, root, tip),
                       detail=detail)
    an.interbrachial_web(parts, 'living-web-frigate', hull_mat, hub, tips,
                         thick=0.16, trail=0.32, detail=detail)
```

Hollows: two nursery (fore, occupants=1) and two sanctuary (aft), all in the web (`face='y'`).

```154:168:scripts/ship_builders/beautiful/frigate.py
    org.nursery_hollow(parts, glow, 'frigate.hollow.fore.stbd',
                       hull_mat, glow_mat, loc_s, face='y', occupants=1,
                       detail=detail, seed=11)
    org.nursery_hollow(parts, glow, 'frigate.hollow.fore.port',
                       hull_mat, glow_mat, loc_p, face='y', occupants=1,
                       detail=detail, seed=23)
    # Slightly further aft in the same skirt: open sanctuaries.
    loc_as = _web_mouth(hub, tips, 0, 1, 0.26, 0.18)
    loc_ap = _web_mouth(hub, tips, 5, 6, 0.24, 0.18)
    org.sanctuary_hollow(parts, glow, 'frigate.hollow.aft.stbd',
                         hull_mat, glow_mat, loc_as, face='y',
                         detail=detail, seed=37)
    org.sanctuary_hollow(parts, glow, 'frigate.hollow.aft.port',
                         hull_mat, glow_mat, loc_ap, face='y',
                         detail=detail, seed=41)
```

### 3. Forbidden calls
AST count 0 for `squid_mantle_fins`, `shark_dorsal`, `whale_fluke`, `fin_membrane`.
No `kit.box` string and no `box(` call in `frigate.py`.
`kit.` in this file is only `kit.ROLE_HULL` and `kit.ROLE_ARMOUR`.

`org.dorsal_mantles` is present (stacked ellipsoids on the upper mantle). It is not `shark_dorsal` and is not in the forbidden-call list.

### 4. Eight arms + travel pose
`an.travel_arm_tips` places each tip at `hub[2] + length` (+Z) with modest XY spread:

```780:795:scripts/ship_builders/beautiful/anatomy.py
def travel_arm_tips(hub, length, count=8, spread=0.40, drop=0.22):
    """Eight trailing arm tips for travel pose. Mantle stays toward -Z.

    Tips lie toward +Z from ``hub`` with a modest XY spread. Not a
    radial sunburst in the XY plane.
    """
    count = max(3, int(count))
    tips = []
    for i in range(count):
        ang = 2.0 * math.pi * i / count
        tips.append((
            hub[0] + spread * length * math.cos(ang),
            hub[1] - drop * length + 0.35 * spread * length * math.sin(ang),
            hub[2] + length,
        ))
    return tips
```

Authored numbers (l = 32.0):
- Mantle stations: z from `l * -0.470` (nose) to `l * 0.095` (dissolve). Head sits toward -Z.
- Hub: `z = l * -0.018`.
- `arm_len = l * 0.480`. Tip z = `-0.018l + 0.480l = 0.462l` (toward +Z, short of glow at `+l * 0.47`).
- spanZ ≈ `0.470l + 0.462l = 0.932l ≈ 29.8` (notes: ≈ 30).
- tip spanX = `2 * 0.40 * 0.480 * 32 = 12.288` (notes: ≈ 12.2).

Module docstring states travel-pose octopus: mantle toward -Z, eight arms toward +Z, not whale / manta / squid.

### 5. Bake
Not run (task: Do NOT bake).
