"""Ferrous Hegemony equipment: batteries, rescue, drive, berth.

Bible §4.2: paired formal weapon housings; rescue always present;
restrained crimson recognition bands; small brass service honors;
exact symmetry. This module builds through ship_kit only. It never
queries a hull — the caller passes loc, size and facing computed from
surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into
kit.box unhalved. kit.sphere scale is a RADIUS. Human and Ferrous
sizes are NEVER multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan
the hull.

Name substrings prow, battery and navigation-light must appear on those
meshes (skin matchers). citadel lives on armour.citadel_plate.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
Emissive parts go in the glow list with skin_role 'glow'.
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


def battery_module(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='up', detail=3):
    """One formal turret housing. Paired, bilateral. Name contains battery.

    FACING: the barrel looks that way. ``loc`` is the housing centre.
    Size is ``sf.TURRET_MODULE``. Barrels stay on the housing, never a
    chaotic cluster.

    Detail: 0 = housing; 1 = + collar; 2+ = + barrel + slit glow.
    """
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    sx, sy, sz = sf.TURRET_MODULE
    sx = max(sx, 0.28)
    sy = max(sy, 0.24)
    sz = max(sz, 0.28)
    objs = []
    body = kit.chamfer_block(parts, name + '.battery', kit.ROLE_ARMOUR,
                             loc, (sx, sy, sz), hull_mat,
                             chamfer=min(sx, sy) * 0.18)
    if body:
        objs.append(body)
    if detail < 1:
        return objs
    collar_r = max(min(sx, sz) * 0.28, 0.10)
    col = kit.cyl(parts, name + '.battery.collar', kit.ROLE_TRIM,
                  _add(loc, d, min(sx, sy, sz) * 0.28),
                  collar_r, 0.12, hull_mat, rotation=rot, vertices=10)
    if col:
        objs.append(col)
    if detail < 2:
        return objs
    br = max(sf.TURRET_BARREL_R, 0.06)
    bl = max(sf.TURRET_BARREL_L, 0.24)
    barrel = kit.cyl(parts, name + '.battery.barrel', kit.ROLE_HULL,
                     _add(loc, d, min(sx, sy, sz) * 0.28 + bl * 0.35),
                     br, bl, hull_mat, rotation=rot, vertices=8)
    if barrel:
        objs.append(barrel)
    slit = kit.box(glow, name + '.battery.slit', kit.ROLE_RECESS,
                   _add(loc, d, 0.04), sf.STATUS_SLIT, glow_mat)
    if slit:
        objs.append(_glow_tag(slit))
    return objs


def turret_rail(parts, glow, name, hull_mat, glow_mat, loc, count=4,
                axis='z', facing='up', detail=3):
    """Turret modules repeated on a rail (G6 signature). Formal, bilateral.

    FACING: each battery looks that way. ``loc`` is the rail centre.
    ``count`` is the full (detail=3) module count. Pitch is even. Call
    once per side — the class file owns the pair.

    Detail: 3 = ``count``; 2 = half (min 2); 1 = rail + one module;
    0 = rail only.
    """
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(2, int(count) // 2) if int(count) >= 2 else 1
    elif detail == 1:
        n = 1
    else:
        n = 0
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    pitch = max(sf.TURRET_MODULE[2], sf.TURRET_MODULE[0]) + 0.18
    run = max(pitch * max(n, int(count)) + 0.20, 0.60)
    if axis == 'x':
        rail = (run, max(sf.RAIL_H, 0.10), max(sf.RAIL_W, 0.12))
    elif axis == 'y':
        rail = (max(sf.RAIL_W, 0.12), run, max(sf.RAIL_H, 0.10))
    else:
        rail = (max(sf.RAIL_W, 0.12), max(sf.RAIL_H, 0.10), run)
    objs = []
    bar = kit.box(parts, name + '.battery-rail', kit.ROLE_HULL, loc,
                  rail, hull_mat)
    if bar:
        objs.append(bar)
    if n < 1:
        return objs
    origin = _add(loc, step, -pitch * (n - 1) * 0.5)
    lift = _dir(facing)
    for i in range(n):
        mloc = _add(origin, step, pitch * i)
        mloc = _add(mloc, lift, sf.TURRET_MODULE[1] * 0.35)
        objs.extend(battery_module(parts, glow, '%s.battery.%d' % (name, i),
                                   hull_mat, glow_mat, mloc,
                                   facing=facing, detail=detail))
    return objs


def rescue_pannier(parts, glow, name, hull_mat, glow_mat, loc, detail=3):
    """Human-scale rescue pannier. Bible: rescue always present.

    FACING: box axes follow ship axes. ``loc`` is the pannier centre.
    Size is ``sf.RESCUE_PANNIER``. A lamp sits on the outer face.

    Detail: 0/1 = housing; 2+ = + rescue lamp.
    """
    sx, sy, sz = sf.RESCUE_PANNIER
    objs = []
    body = kit.box(parts, name + '.rescue-pannier', kit.ROLE_ACCENT,
                   loc, (sx, sy, sz), hull_mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    lamp = kit.box(glow, name + '.rescue-lamp', kit.ROLE_RECESS,
                   (loc[0], loc[1] + sy * 0.28, loc[2] + sz * 0.12),
                   sf.RESCUE_LAMP, glow_mat)
    if lamp:
        objs.append(_glow_tag(lamp))
    return objs


def rescue_hatch(parts, glow, name, hull_mat, glow_mat, loc,
                 face='-y', detail=3):
    """Rescue airlock. Wraps kit.rescue_hatch at HUMAN pannier size.

    FACING: ``face`` is the kit face token ('-y' belly, 'y' deck,
    'x' / '-x' flanks, 'z' / '-z' ends). ``loc`` is the hatch centre.
    Size is ``sf.RESCUE_PANNIER``.

    Detail: 0 = nothing (mass lives on the host); 1+ = the assembly.
    """
    if detail < 1:
        return []
    objs = kit.rescue_hatch(parts, glow, name + '.rescue-hatch',
                            loc, hull_mat, glow_mat, sf.RESCUE_PANNIER,
                            face=face)
    return [o for o in (objs or []) if o]


def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.50, detail=3):
    """Countable nozzle group 2/4/6/8 on an iron housing. Grid, not a row.

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


def radiator(parts, name, mat, loc, size=None, detail=3):
    """FLAT thermal slab. No fins, no greeble, no panel lines.

    FACING: the box axes follow ship axes. The caller orients ``loc``
    and ``size`` (FULL extents) against the host face. Default size is
    ``sf.RADIATOR``. Heavy / frigate / freighter authors need a pair.

    Detail: 0+ = the slab (it is a primary outline mass). Thickness is
    clamped to ≥ 0.08 so the island probe always sees it.
    """
    if size is None:
        size = sf.RADIATOR
    sx, sy, sz = size
    sx = max(sx, 0.08)
    sy = max(sy, 0.20)
    sz = max(sz, 0.28)
    panel = kit.box(parts, name + '.radiator', kit.ROLE_HULL, loc,
                    (sx, sy, sz), mat)
    if panel:
        return [panel]
    return []


def hangar_berth(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                 facing='starboard', detail=3):
    """Visible berth for a nested light (frigate G5). ROLE_RECESS well.

    FACING: the mouth looks that way. ``loc`` is the berth centre.
    ``size`` is FULL extents. Default is ``sf.HANGAR_BERTH``. A small
    nested wedge sits inside so the mouth reads as a craft berth, not
    a dark hole.

    Detail: 0/1 = well + frame; 2+ = + nested craft mass; 3 = + lip lamp.
    """
    if size is None:
        size = sf.HANGAR_BERTH
    d = _dir(facing)
    sx = max(size[0], 0.80)
    sy = max(size[1], 0.56)
    sz = max(size[2], 1.00)
    objs = []
    well = kit.box(parts, name + '.hangar-berth.well', kit.ROLE_RECESS,
                   loc, (sx * 0.86, sy * 0.78, sz * 0.86), hull_mat)
    if well:
        objs.append(well)
    frame = kit.chamfer_block(parts, name + '.hangar-berth.frame',
                              kit.ROLE_ARMOUR,
                              _add(loc, d, 0.04),
                              (sx, sy, sz), hull_mat,
                              chamfer=min(sx, sy) * 0.10)
    if frame:
        objs.append(frame)
    if detail < 2:
        return objs
    craft = kit.wedge(parts, name + '.hangar-berth.nested', kit.ROLE_HULL,
                      _add(loc, (0.0, 0.0, -1.0), sz * 0.08),
                      (sx * 0.28, sy * 0.22, sz * 0.42),
                      hull_mat, taper=(0.55, 0.70))
    if craft:
        objs.append(craft)
    if detail < 3:
        return objs
    lamp = kit.box(glow, name + '.navigation-light.berth', kit.ROLE_RECESS,
                   _add(loc, d, max(sx, sz) * 0.12),
                   sf.MARKER_LAMP, glow_mat)
    if lamp:
        objs.append(_glow_tag(lamp))
    return objs


def recognition_band(parts, name, mat, loc, size=None, detail=3):
    """Restrained crimson recognition band. ROLE_ACCENT. Name contains prow.

    FACING: box axes follow ship axes. ``loc`` is the band centre.
    Default size is ``sf.RECOGNITION_BAND``. One band, not a wrap of
    edge-light.

    Detail: 0+ = the band (it is a recognition mark, not a LOD flourish).
    """
    if size is None:
        size = sf.RECOGNITION_BAND
    sx = max(size[0], 0.12)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.28)
    band = kit.box(parts, name + '.prow-band', kit.ROLE_ACCENT, loc,
                   (sx, sy, sz), mat)
    if band:
        return [band]
    return []


def honor_plate(parts, name, mat, loc, detail=3):
    """Small brass service honor. ROLE_TRIM. Absolute plate.

    FACING: box axes follow ship axes. ``loc`` is the plate centre.
    Size is ``sf.HONOR_PLATE``. Never a heraldic mural.

    Detail: 0 = nothing; 1+ = the plate.
    """
    if detail < 1:
        return []
    sx, sy, sz = sf.HONOR_PLATE
    sx = max(sx, 0.16)
    sy = max(sy, 0.12)
    sz = max(sz, 0.06)
    plate = kit.box(parts, name + '.honor-plate', kit.ROLE_TRIM, loc,
                    (sx, sy, sz), mat)
    if plate:
        return [plate]
    return []


def navigation_light(parts, glow, name, hull_mat, glow_mat, loc, detail=3):
    """Marker lamp. Name contains navigation-light. HUMAN.lampSize.

    FACING: box axes follow ship axes. ``loc`` is the lamp centre.
    Housing is slightly larger than ``sf.MARKER_LAMP``. Pitch for a
    run of these is ``sf.LAMP_SPACING`` (1.20).

    Detail: 0 = nothing; 1 = housing; 2+ = + glow iris.
    """
    if detail < 1:
        return []
    objs = []
    well = kit.box(parts, name + '.navigation-light.well', kit.ROLE_RECESS,
                   loc, (0.16, 0.14, 0.12), hull_mat)
    if well:
        objs.append(well)
    if detail < 2:
        return objs
    iris = kit.box(glow, name + '.navigation-light', kit.ROLE_RECESS,
                   loc, sf.MARKER_LAMP, glow_mat)
    if iris:
        objs.append(_glow_tag(iris))
    return objs
