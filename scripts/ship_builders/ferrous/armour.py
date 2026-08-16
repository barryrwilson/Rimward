"""Ferrous Hegemony surface language: ribs, flares, citadel plates.

Bible §4.2: layered citadel armor, blunt iron, exact symmetry.
Construction logic (synthesis/21 §G6): REPEATED MODULE, ARMOURED —
20–40 armour ribs at even pitch. The §G2 outline-breaker is rib_flare:
grow REACH, never rib thickness.

This module builds through ship_kit only. It never queries a hull — the
caller passes loc, size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into
kit.box unhalved. Human and Ferrous sizes are NEVER multiplied by ship
l, b or h.

Name substrings citadel must appear on citadel plates (skin matchers).

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
"""
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

_AXIS_DIR = {
    'x': (1.0, 0.0, 0.0),
    'y': (0.0, 1.0, 0.0),
    'z': (0.0, 0.0, 1.0),
}


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _dir(facing):
    if isinstance(facing, tuple):
        n = (facing[0] ** 2 + facing[1] ** 2 + facing[2] ** 2) ** 0.5
        if n < 1e-9:
            return (1.0, 0.0, 0.0)
        return (facing[0] / n, facing[1] / n, facing[2] / n)
    return _FACE_DIR.get(facing, (1.0, 0.0, 0.0))


def _axis_size(long_s, thick, wide, facing):
    """Map (long, thick, wide) so long sits on the facing axis."""
    d = _dir(facing)
    if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        return (long_s, wide, thick)
    if facing in ('up', 'down') or abs(d[1]) >= 0.7:
        return (wide, long_s, thick)
    return (wide, thick, long_s)


def rib_flare(parts, name, mat, loc, reach=None, facing='starboard',
              detail=3):
    """§G2 outline-breaker: one proud armour rib of long span ``reach``.

    FACING: the plate looks that way. ``loc`` is the flare centre.
    Default ``reach`` is ``sf.RIB_FLARE_REACH`` (1.80) ≥ 1.65. Grow
    ``reach`` with class. Thickness stays ``sf.RIB_FLARE_T`` — never
    inflate it as the scale cue.

    Detail: 0/1 = flare plate; 2+ = + a thin cap along the long run.
    """
    if reach is None:
        reach = sf.RIB_FLARE_REACH
    reach = max(float(reach), 0.28)
    thick = max(sf.RIB_FLARE_T, 0.10)
    wide = max(sf.RIB_FLARE_W, 0.24)
    size = _axis_size(reach, thick, wide, facing)
    objs = []
    body = kit.chamfer_block(parts, name + '.rib-flare', kit.ROLE_ARMOUR,
                             loc, size, mat,
                             chamfer=min(size[0], size[1]) * 0.14)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    cap_t = thick
    cap = _axis_size(reach * 0.72, cap_t + 0.04, wide * 0.38, facing)
    d = _dir(facing)
    cap_loc = _add(loc, d, thick * 0.35)
    lip = kit.box(parts, name + '.rib-flare.cap', kit.ROLE_TRIM,
                  cap_loc, cap, mat)
    if lip:
        objs.append(lip)
    return objs


def rib_run(parts, name, mat, loc, count=28, span=None, axis='z',
            facing='starboard', detail=3):
    """20–40 armour ribs at even pitch (G6: Repeated module, armoured).

    FACING: each rib stands that way. ``loc`` is the run centre.
    ``count`` is the full (detail=3) count and is clamped to 20–40.
    ``span`` is the long run; default is ``count * sf.ARMOUR_RIB_PITCH``.
    Rib thickness is ``sf.ARMOUR_RIB_T`` and does not grow.

    Detail: 3 = full count; 2 = half; 1 = four ribs; 0 = backing bar only.
    """
    n_full = max(20, min(40, int(count)))
    if detail >= 3:
        n = n_full
    elif detail == 2:
        n = max(8, n_full // 2)
    elif detail == 1:
        n = 4
    else:
        n = 0
    pitch = sf.ARMOUR_RIB_PITCH
    if span is None:
        span = n_full * pitch
    span = max(float(span), 0.40)
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    thick = max(sf.ARMOUR_RIB_T, 0.10)
    _rt, rh, rc = sf.ARMOUR_RIB
    rh = max(rh, 0.24)
    rc = max(rc, 0.16)
    if axis == 'x':
        bar = (span, max(sf.RAIL_H, 0.10), thick + 0.04)
    elif axis == 'y':
        bar = (thick + 0.04, span, max(sf.RAIL_H, 0.10))
    else:
        bar = (thick + 0.04, max(sf.RAIL_H, 0.10), span)
    objs = []
    back = kit.box(parts, name + '.rib-run.bar', kit.ROLE_HULL, loc, bar, mat)
    if back:
        objs.append(back)
    if n < 1:
        return objs
    origin = _add(loc, step, -span * 0.5 + (span / n) * 0.5)
    d = _dir(facing)
    for i in range(n):
        rloc = _add(origin, step, (span / n) * i)
        rloc = _add(rloc, d, thick * 0.25)
        rsize = _axis_size(rc, thick, rh, facing)
        rib = kit.box(parts, '%s.armour-rib.%d' % (name, i),
                      kit.ROLE_ARMOUR, rloc, rsize, mat)
        if rib:
            objs.append(rib)
    return objs


def citadel_plate(parts, name, mat, loc, size=None, detail=3):
    """Layered citadel armour block. ROLE_ARMOUR. Name contains citadel.

    FACING: box axes follow ship axes. ``loc`` is the plate centre.
    ``size`` is FULL extents. Default is ``sf.CITADEL_PLATE``.

    Detail: 0/1 = mass; 2 = + one plate course; 3 = + a second course.
    """
    if size is None:
        size = sf.CITADEL_PLATE
    sx = max(size[0], 0.28)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.28)
    objs = []
    body = kit.chamfer_block(parts, name + '.citadel', kit.ROLE_ARMOUR,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.16)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    n = 3 if detail >= 3 else 2
    course = kit.plate_course(parts, name + '.citadel.course', kit.ROLE_ARMOUR,
                              (loc[0], loc[1] + sy * 0.08, loc[2]),
                              (sx * 0.86, sy * 0.18, sz * 0.88),
                              mat, count=n, axis='z', gap=0.10, step=0.010,
                              length_vary=0.0)
    if course:
        objs.extend(course)
    return objs


def armour_course(parts, name, mat, loc, size=None, count=5, axis='z',
                  detail=3):
    """Overlapping citadel armour course. ROLE_ARMOUR.

    FACING: ``axis`` is the run. ``loc`` is the course centre.
    ``size`` is FULL extents. Default is ``sf.ARMOUR_COURSE``.
    Count goes down with detail. No course should later cross a zone
    boundary — the caller owns the span.

    Detail: 3 = ``count``; 2 = half (min 2); 1/0 = one plate.
    """
    if size is None:
        size = sf.ARMOUR_COURSE
    sx = max(size[0], 0.12)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.40)
    if detail >= 3:
        n = max(2, int(count))
    elif detail == 2:
        n = max(2, int(count) // 2)
    else:
        n = 1
    return kit.plate_course(parts, name + '.armour-course', kit.ROLE_ARMOUR,
                            loc, (sx, sy, sz), mat, count=n, axis=axis,
                            gap=0.10, step=0.010, length_vary=0.0) or []


def chamfered_course(parts, name, mat, loc, size=None, count=4, axis='z',
                     detail=3):
    """Row of chamfered armour blocks at even pitch. ROLE_ARMOUR.

    FACING: ``axis`` is the run. ``loc`` is the course centre.
    ``size`` is the FULL span of the run. Each block is a chamfered
    iron brick — the layered-citadel look without a plate_course step.

    Detail: 3 = ``count``; 2 = half (min 2); 1 = two blocks; 0 = one block.
    """
    if size is None:
        size = sf.ARMOUR_COURSE
    sx, sy, sz = size
    sx = max(sx, 0.16)
    sy = max(sy, 0.24)
    sz = max(sz, 0.40)
    if detail >= 3:
        n = max(2, int(count))
    elif detail == 2:
        n = max(2, int(count) // 2)
    elif detail == 1:
        n = 2
    else:
        n = 1
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    if axis == 'x':
        run = sx
        brick = (max(run / n * 0.82, 0.16), sy, sz)
    elif axis == 'y':
        run = sy
        brick = (sx, max(run / n * 0.82, 0.16), sz)
    else:
        run = sz
        brick = (sx, sy, max(run / n * 0.82, 0.16))
    origin = _add(loc, step, -run * 0.5 + (run / n) * 0.5)
    objs = []
    for i in range(n):
        bloc = _add(origin, step, (run / n) * i)
        blk = kit.chamfer_block(parts, '%s.chamfer-armour.%d' % (name, i),
                                kit.ROLE_ARMOUR, bloc, brick, mat,
                                chamfer=min(brick[0], brick[1]) * 0.18)
        if blk:
            objs.append(blk)
    return objs
