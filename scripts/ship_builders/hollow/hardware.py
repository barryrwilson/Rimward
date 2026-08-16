"""Hollow Reach equipment: lantern, collar, drive, arrays, hold.

Bible §5.2: one dim buried command lantern, a docking collar that can
sit behind a shutter, a quiet countable drive, flat radiators, passive
sensor vanes, armored mast roots, fuel bladders and shielded holds.
This module builds through ship_kit only. It never queries a hull — the
caller passes loc, size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into kit.box
unhalved. kit.sphere scale is a RADIUS. Human and Hollow sizes are NEVER
multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan the hull.

Lanterns use HUMAN.lampSize 0.10 and HUMAN.lampGap 1.20. Never edge-light
panels. Almost no windows.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
Emissive parts go in the glow list with skin_role 'glow' (dim mauve).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


_FACE_DIR = {
    'nose': (0.0, 0.0, -1.0),
    'stern': (0.0, 0.0, 1.0),
    'port': (-1.0, 0.0, 0.0),
    'starboard': (1.0, 0.0, 0.0),
    'up': (0.0, 1.0, 0.0),
    'down': (0.0, -1.0, 0.0),
}

_CYL_ROT = {
    'nose': sf.CYL_ALONG_Z,
    'stern': sf.CYL_ALONG_Z,
    'port': sf.CYL_ALONG_X,
    'starboard': sf.CYL_ALONG_X,
    'up': sf.CYL_ALONG_Y,
    'down': sf.CYL_ALONG_Y,
}

_AXIS_DIR = {
    'x': (1.0, 0.0, 0.0),
    'y': (0.0, 1.0, 0.0),
    'z': (0.0, 0.0, 1.0),
}


def _glow_tag(obj):
    if obj:
        obj['skin_role'] = 'glow'
    return obj


def _dir(facing):
    if isinstance(facing, tuple):
        n = math.sqrt(facing[0] ** 2 + facing[1] ** 2 + facing[2] ** 2)
        if n < 1e-9:
            return (0.0, 0.0, -1.0)
        return (facing[0] / n, facing[1] / n, facing[2] / n)
    return _FACE_DIR.get(facing, (0.0, 1.0, 0.0))


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _cyl_rot(facing, d):
    rot = _CYL_ROT.get(facing)
    if rot is not None:
        return rot
    if abs(d[2]) >= abs(d[0]) and abs(d[2]) >= abs(d[1]):
        return sf.CYL_ALONG_Z
    if abs(d[0]) >= abs(d[1]):
        return sf.CYL_ALONG_X
    return sf.CYL_ALONG_Y


def buried_lantern(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='up', detail=3):
    """Dim recessed command lantern. Glow in the glow list. HUMAN.lampSize.

    FACING: the iris looks that way. ``loc`` is the well centre.
    Housing is ``sf.LAMP_HOUSING``. The iris is ``sf.BURIED_LANTERN``
    (HUMAN.lampSize 0.10) and sits inside the well, not on an edge.
    Name includes buried-command-lantern.

    Detail: 0 = nothing; 1 = well; 2+ = well + glow iris.
    """
    if detail < 1:
        return []
    d = _dir(facing)
    objs = []
    well = kit.box(parts, name + '.buried-command-lantern.well',
                   kit.ROLE_RECESS, loc, sf.LAMP_HOUSING, hull_mat)
    if well:
        objs.append(well)
    if detail < 2:
        return objs
    iris = kit.box(glow, name + '.buried-command-lantern', kit.ROLE_RECESS,
                   _add(loc, d, 0.02), sf.BURIED_LANTERN, glow_mat)
    if iris:
        objs.append(_glow_tag(iris))
    return objs


def docking_collar(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='nose', detail=3):
    """Fleet-diameter docking collar. Bore is sf.COLLAR_BORE = 0.62.

    FACING: the mating face (nose = −Z, down = ventral −Y, stern = +Z).
    ``loc`` is the mating-plane centre. The barrel buries ≥ 0.12 into the
    host so the island probe reads one body. A shutter_bank may overlap
    this construct as a separate part; probe each alone.

    Hollow keeps the collar quiet: no slit glow.

    Detail: 0 = barrel; 1 = barrel + bore disc; 2+ = + lip torus.
    """
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    bore = sf.COLLAR_BORE
    r_bar = bore + 0.14
    depth = 0.34
    objs = []
    bar = kit.cyl(parts, name + '.collar.barrel', kit.ROLE_HULL,
                  _add(loc, d, -depth * 0.5 + 0.12),
                  r_bar, depth, hull_mat, rotation=rot, vertices=12)
    if bar:
        objs.append(bar)
    if detail >= 1:
        bd = kit.cyl(parts, name + '.collar.bore', kit.ROLE_RECESS,
                     _add(loc, d, 0.02), bore, 0.06,
                     hull_mat, rotation=rot, vertices=12)
        if bd:
            objs.append(bd)
    if detail >= 2:
        lip = kit.torus(parts, name + '.collar.lip', kit.ROLE_TRIM,
                        _add(loc, d, 0.04), bore + 0.06, sf.LIP_MINOR,
                        hull_mat, rotation=rot)
        if lip:
            objs.append(lip)
    return objs


def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.50, detail=3):
    """Countable nozzle group 2/4/6/8 on a sealed housing. Grid, not a row.

    FACING: nozzles look stern (+Z). ``loc`` is the housing back-face
    centre (the transom plane). The housing's forward 0.12 is buried in
    the spine the caller anchored. Throats stay inside 70 % of the face
    half-extents so a 6- or 8-nozzle group cannot outspan the housing.

    Do not use kit.engine_bank.

    Detail: >= 2 = full count; 1 = half (min 2); 0 = housing + 2 throats.
    """
    n = nozzles
    if detail == 1:
        n = max(2, nozzles // 2)
    elif detail <= 0:
        n = 2
    grid = {2: (2, 1), 4: (2, 2), 6: (3, 2), 8: (4, 2)}
    if n in grid:
        cols, rows = grid[n]
    else:
        cols = int(math.ceil(math.sqrt(n)))
        rows = int(math.ceil(n / float(cols)))
    objs = []
    lx, ly, lz = loc
    hw = max(half_w, 0.28)
    hh = max(half_h, 0.22)
    hz = lz - depth * 0.5 + 0.12
    hous = kit.chamfer_block(parts, name + '.drive-face.housing', kit.ROLE_HULL,
                             (lx, ly, hz), (hw * 2.0, hh * 2.0, depth),
                             hull_mat, chamfer=min(hw, hh) * 0.22)
    if hous:
        objs.append(hous)
    face_z = lz + 0.12
    span_x = hw * 0.70
    span_y = hh * 0.70
    pitch_x = (2.0 * span_x) / cols
    pitch_y = (2.0 * span_y) / rows
    r = max(0.07, min(pitch_x, pitch_y) * 0.32)
    made = 0
    for row in range(rows):
        for col in range(cols):
            if made >= n:
                break
            nx = lx - span_x + pitch_x * (col + 0.5)
            ny = ly - span_y + pitch_y * (row + 0.5)
            th = kit.cyl(parts, '%s.throat.%d' % (name, made),
                         kit.ROLE_RECESS, (nx, ny, face_z - 0.05), r, 0.14,
                         hull_mat, rotation=sf.CYL_ALONG_Z, vertices=10)
            if th:
                objs.append(th)
            disc = kit.cyl(glow, '%s.disc.%d' % (name, made), kit.ROLE_RECESS,
                           (nx, ny, face_z - 0.10), r * 0.62, 0.05, glow_mat,
                           rotation=sf.CYL_ALONG_Z, vertices=8)
            if disc:
                objs.append(_glow_tag(disc))
            made += 1
    return objs


def radiator_panel(parts, name, mat, loc, size, detail=3):
    """FLAT thermal slab. No fins, no greeble, no panel lines.

    FACING: the box axes follow ship axes. The caller orients ``loc`` and
    ``size`` (FULL extents) against the host face. Every future heavy,
    frigate and freighter must carry at least one pair (§G3).

    Detail: 0+ = the slab (it is a primary outline mass). Thickness is
    clamped to ≥ 0.08 so the island probe always sees it.
    """
    sx, sy, sz = size
    sx = max(sx, 0.20)
    sy = max(sy, 0.08)
    sz = max(sz, 0.28)
    panel = kit.box(parts, name + '.radiator', kit.ROLE_HULL, loc,
                    (sx, sy, sz), mat)
    if panel:
        return [panel]
    return []


def passive_array(parts, name, mat, loc, count=4, axis='z', detail=3):
    """Small repeated sensor vanes. Absolute vane size. Count grows later.

    FACING: vanes stand in ship Y; the run is centred on ``loc`` along
    ``axis`` ('x' / 'z'). Each vane is ``sf.PASSIVE_VANE``. Pitch is
    0.22 — more vanes on a bigger ship, never a bigger vane.

    Detail: 3 = ``count``; 2 = half; 1 = one vane; 0 = root bar only.
    """
    vx, vy, vz = sf.PASSIVE_VANE
    vx = max(vx, 0.08)
    vy = max(vy, 0.16)
    vz = max(vz, 0.10)
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    elif detail == 1:
        n = 1
    else:
        n = 0
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    pitch = 0.22
    run = max(pitch * max(n, int(count)) + 0.16, 0.40)
    objs = []
    bar = kit.box(parts, name + '.passive-array.bar', kit.ROLE_HULL, loc,
                  (0.12 if axis == 'z' else run,
                   0.10,
                   run if axis == 'z' else 0.12),
                  mat)
    if bar:
        objs.append(bar)
    if n < 1:
        return objs
    origin = _add(loc, step, -pitch * (n - 1) * 0.5)
    for i in range(n):
        vloc = _add(origin, step, pitch * i)
        vloc = (vloc[0], vloc[1] + vy * 0.25, vloc[2])
        vane = kit.box(parts, '%s.passive-vane.%d' % (name, i),
                       kit.ROLE_TRIM, vloc, (vx, vy, vz), mat)
        if vane:
            objs.append(vane)
    return objs


def sensor_root(parts, name, mat, loc, detail=3):
    """Armored root block for a listening mast.

    FACING: box axes follow ship axes. ``loc`` is the block centre.
    Size is ``sf.SENSOR_ROOT``. The mast shaft should bury into this.

    Detail: 0/1 = block; 2+ = + collar ring.
    """
    sx, sy, sz = sf.SENSOR_ROOT
    objs = []
    body = kit.chamfer_block(parts, name + '.sensor-root', kit.ROLE_ARMOUR,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.18)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    ring = kit.cyl(parts, name + '.sensor-root.collar', kit.ROLE_TRIM,
                   (loc[0], loc[1] + sy * 0.35, loc[2]),
                   max(sf.MAST_RADIUS + 0.05, 0.12), 0.12, mat,
                   rotation=sf.CYL_ALONG_Y, vertices=10)
    if ring:
        objs.append(ring)
    return objs


def fuel_bladder(parts, name, mat, loc, detail=3):
    """Soft tank for a freighter later. Absolute module size. ROLE_ARMOUR.

    FACING: box axes follow ship axes. ``loc`` is the tank centre.
    Size is ``sf.FUEL_BLADDER``. Large chamfer reads as a soft body,
    not a crate.

    Detail: 0/1 = tank; 2+ = + two strap bands.
    """
    sx, sy, sz = sf.FUEL_BLADDER
    objs = []
    body = kit.chamfer_block(parts, name + '.fuel-bladder', kit.ROLE_ARMOUR,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.36)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    t = max(sf.WRAP_STRAP_T, 0.10)
    for i, u in enumerate((-0.22, 0.22)):
        band = kit.box(parts, '%s.fuel-bladder.band.%d' % (name, i),
                       kit.ROLE_TRIM,
                       (loc[0], loc[1], loc[2] + sz * u),
                       (sx * 0.72, sy * 0.62, t), mat)
        if band:
            objs.append(band)
    return objs


def shielded_hold(parts, name, mat, loc, detail=3):
    """Sealed hold block. Calm metal. ROLE_HULL.

    FACING: box axes follow ship axes. ``loc`` is the hold centre.
    Size is ``sf.SHIELDED_HOLD``. No windows.

    Detail: 0/1 = hold mass; 2 = + transfer hatch recess; 3 = + wrap strap.
    """
    sx, sy, sz = sf.SHIELDED_HOLD
    objs = []
    body = kit.chamfer_block(parts, name + '.shielded-hold', kit.ROLE_HULL,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.14)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.hold-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 - recess * 0.35),
                    (recess, min(door_h, sy * 0.55), min(door_w, sz * 0.28)),
                    mat)
    if hatch:
        objs.append(hatch)
    if detail < 3:
        return objs
    strap = kit.box(parts, name + '.hold-wrap-strap', kit.ROLE_TRIM,
                    (loc[0], loc[1] + sy * 0.42, loc[2]),
                    (sx * 0.70, max(sf.WRAP_STRAP_T, 0.10), sz * 0.40),
                    mat)
    if strap:
        objs.append(strap)
    return objs
