"""Hollow Reach surface language: wrap, shutters, masts, dish ears.

Bible §5.2 / VisualUpdatePlan shrouded: a sealed watch-hull under wrap
panels, shutter banks, long listening masts and dish ears standing clear
of the mass. This module builds geometry through ship_kit only. It never
queries a hull — the caller passes loc, size and facing computed from
surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point in the kit. Absolute sf.* constants go
into kit.box at their stated values. kit.sphere scale is a RADIUS. Human
and Hollow module sizes are NEVER multiplied by ship l, b or h.

The §G2 breaker is listening_mast: grow HEIGHT / boom reach, never dish
diameter. Default length is sf.LISTENING_MAST_LEN (2.40) ≥ 1.65. The
dish ear at the tip overlaps the shaft so the group stays one body.

Name substrings wrap-panel and listening-dish must appear on those
meshes (skin matchers).

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
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

def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _unit(v):
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if n < 1e-9:
        return (0.0, 0.0, 1.0)
    return (v[0] / n, v[1] / n, v[2] / n)


def _dir(facing):
    if isinstance(facing, tuple):
        return _unit(facing)
    return _FACE_DIR.get(facing, (1.0, 0.0, 0.0))


def _cyl_rot(facing, d):
    rot = _CYL_ROT.get(facing)
    if rot is not None:
        return rot
    if abs(d[2]) >= abs(d[0]) and abs(d[2]) >= abs(d[1]):
        return sf.CYL_ALONG_Z
    if abs(d[0]) >= abs(d[1]):
        return sf.CYL_ALONG_X
    return sf.CYL_ALONG_Y


def _plate_size(size, facing):
    """Map (face_w, face_h, thickness) so thickness sits on the face normal."""
    fw, fh, th = size
    fw = max(fw, 0.24)
    fh = max(fh, 0.24)
    th = max(th, 0.10)
    d = _dir(facing)
    if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        return (th, fh, fw)
    if facing in ('nose', 'stern') or abs(d[2]) >= 0.7:
        return (fw, fh, th)
    return (fw, th, fh)


def wrap_panel(parts, name, mat, loc, size=None, facing='starboard',
               detail=3):
    """Bilateral drape plate. ROLE_ARMOUR. Name contains wrap-panel.

    FACING: the plate looks that way. ``loc`` is the plate centre.
    ``size`` is (face_w, face_h, thickness). Default is ``sf.WRAP_PANEL``
    with thickness 0.12 so the 0.06 voxel keeps it. Call once per side.
    Laps onto the hull conceptually; a probe at the origin is fine.

    Detail: 0/1 = plate; 2+ = + two wrap-strap pads on the long run.
    """
    if size is None:
        size = sf.WRAP_PANEL
    mapped = _plate_size(size, facing)
    objs = []
    body = kit.chamfer_block(parts, name + '.wrap-panel', kit.ROLE_ARMOUR,
                             loc, mapped, mat,
                             chamfer=min(mapped[0], mapped[1]) * 0.12)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    mx, my, mz = mapped
    pad_t = max(sf.WRAP_STRAP_T, 0.10)
    if facing in ('port', 'starboard') or abs(_dir(facing)[0]) >= 0.7:
        pad = (pad_t + 0.04, my * 0.18, mz * 0.16)
        offs = ((0.0, my * 0.28, mz * 0.28), (0.0, -my * 0.28, -mz * 0.28))
    elif facing in ('nose', 'stern') or abs(_dir(facing)[2]) >= 0.7:
        pad = (mx * 0.16, my * 0.18, pad_t + 0.04)
        offs = ((mx * 0.28, my * 0.28, 0.0), (-mx * 0.28, -my * 0.28, 0.0))
    else:
        pad = (mx * 0.16, pad_t + 0.04, mz * 0.16)
        offs = ((mx * 0.28, 0.0, mz * 0.28), (-mx * 0.28, 0.0, -mz * 0.28))
    for i, off in enumerate(offs):
        cap = kit.box(parts, '%s.wrap-panel.pad.%d' % (name, i),
                      kit.ROLE_TRIM, _add(loc, off), pad, mat)
        if cap:
            objs.append(cap)
    return objs


def shutter_bank(parts, name, mat, loc, size=None, facing='nose',
                 detail=3):
    """Louvred sealed face. ROLE_HULL. Slat pitch is absolute.

    FACING: the bank looks that way. ``loc`` is the bank centre.
    ``size`` is (face_w, face_h, thickness). Default is
    ``sf.SHUTTER_BANK``. Slats use ``sf.SHUTTER_SLAT_PITCH`` and stay
    thick enough for the 0.06 voxel. They bury into the backing plate.

    Detail: 3 = full slat count; 2 = half; 1 = backing + two slats;
    0 = backing plate only.
    """
    if size is None:
        size = sf.SHUTTER_BANK
    mapped = _plate_size(size, facing)
    objs = []
    back = kit.box(parts, name + '.shutter-bank', kit.ROLE_HULL, loc,
                   mapped, mat)
    if back:
        objs.append(back)
    if detail < 1:
        return objs
    fw, fh, _th = size
    fw = max(fw, 0.24)
    fh = max(fh, 0.24)
    pitch = max(sf.SHUTTER_SLAT_PITCH, 0.10)
    slat_t = max(sf.SHUTTER_SLAT_T, 0.08)
    slat_d = max(sf.SHUTTER_SLAT_D, 0.08)
    n_full = max(2, int(round(fh / pitch)))
    if detail >= 3:
        n = n_full
    elif detail == 2:
        n = max(2, n_full // 2)
    else:
        n = 2
    d = _dir(facing)
    # Slats run across face_w and stack along face height, not along facing.
    if facing in ('up', 'down') or abs(d[1]) >= 0.7:
        stack = (0.0, 0.0, 1.0)
    else:
        stack = (0.0, 1.0, 0.0)
    span = (n - 1) * pitch
    origin = _add(loc, stack, -span * 0.5)
    bury = _add((0.0, 0.0, 0.0), d, slat_d * 0.20)
    for i in range(n):
        sloc = _add(origin, stack, pitch * i)
        sloc = (sloc[0] + bury[0], sloc[1] + bury[1], sloc[2] + bury[2])
        if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
            ssize = (slat_d, slat_t, fw * 0.88)
        elif facing in ('nose', 'stern') or abs(d[2]) >= 0.7:
            ssize = (fw * 0.88, slat_t, slat_d)
        else:
            ssize = (fw * 0.88, slat_d, slat_t)
        slat = kit.box(parts, '%s.shutter-slat.%d' % (name, i),
                       kit.ROLE_TRIM, sloc, ssize, mat)
        if slat:
            objs.append(slat)
    return objs


def wrap_strap(parts, name, mat, loc, span=None, axis='z', detail=3):
    """Strap / clamp across a wrap. ROLE_TRIM.

    FACING: ``axis`` is the strap span ('x' / 'z'). ``loc`` is the strap
    centre. Thickness is ``sf.WRAP_STRAP_T`` (≥ 0.10).

    Detail: 0/1 = strap; 2+ = + end clamps.
    """
    if span is None:
        span = sf.WRAP_STRAP[2]
    span = max(float(span), 0.32)
    t = max(sf.WRAP_STRAP_T, 0.10)
    w = max(sf.WRAP_STRAP[0], 0.14)
    if axis == 'x':
        size = (span, t, w)
        step = (1.0, 0.0, 0.0)
        pad = (0.14, t + 0.04, w + 0.06)
    else:
        size = (w, t, span)
        step = (0.0, 0.0, 1.0)
        pad = (w + 0.06, t + 0.04, 0.14)
    objs = []
    strap = kit.box(parts, name + '.wrap-strap', kit.ROLE_TRIM, loc,
                    size, mat)
    if strap:
        objs.append(strap)
    if detail < 2:
        return objs
    for i, sign in enumerate((-1.0, 1.0)):
        cap = kit.box(parts, '%s.wrap-strap.clamp.%d' % (name, i),
                      kit.ROLE_TRIM,
                      _add(loc, step, sign * (span * 0.5 - 0.06)),
                      pad, mat)
        if cap:
            objs.append(cap)
    return objs


def listening_dish(parts, name, mat, loc, radius=None, facing='starboard',
                   detail=3):
    """Dish ear. ROLE_ACCENT. Name contains listening-dish.

    FACING: the dish looks that way. ``loc`` is the dish centre.
    Radius is ``sf.DISH_EAR_R`` (do not grow this as the class scale).
    Structural thickness is ``sf.DISH_EAR_T`` ≥ 0.06.

    Detail: 0/1 = disc; 2 = + hub; 3 = + rim torus.
    """
    if radius is None:
        radius = sf.DISH_EAR_R
    radius = max(float(radius), 0.16)
    thick = max(sf.DISH_EAR_T, 0.08)
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    objs = []
    disc = kit.cyl(parts, name + '.listening-dish', kit.ROLE_ACCENT,
                   loc, radius, thick, mat, rotation=rot, vertices=12)
    if disc:
        objs.append(disc)
    if detail < 2:
        return objs
    hub = kit.cyl(parts, name + '.listening-dish.hub', kit.ROLE_TRIM,
                  _add(loc, d, -thick * 0.15),
                  max(sf.MAST_RADIUS, 0.08), thick * 0.80, mat,
                  rotation=rot, vertices=8)
    if hub:
        objs.append(hub)
    if detail < 3:
        return objs
    rim = kit.torus(parts, name + '.listening-dish.rim', kit.ROLE_ACCENT,
                    _add(loc, d, thick * 0.20),
                    radius * 0.78, max(sf.LIP_MINOR, 0.05),
                    mat, rotation=rot)
    if rim:
        objs.append(rim)
    return objs


def listening_mast(parts, name, mat, loc, length=None, facing='up',
                   detail=3, dish=True):
    """THE G2 construct: structural listening mast, optional dish at the tip.

    FACING: the mast grows that way from ``loc`` (the root). Default
    ``length`` is ``sf.LISTENING_MAST_LEN`` (2.40) ≥ 15 % of cutter
    length 11.0. Grow HEIGHT / boom reach with class. Never inflate the
    dish. Shaft radius is ``sf.MAST_RADIUS`` (structural, not a wire).
    ROLE_TRIM (value contrast on the shaft).

    The dish at the tip overlaps the shaft so the group is one body.

    Detail: 0/1 = shaft; 2 = + root collar; 3 = + dish ear (if dish).
    """
    if length is None:
        length = sf.LISTENING_MAST_LEN
    length = max(float(length), 0.80)
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    r = max(sf.MAST_RADIUS, 0.08)
    mid = _add(loc, d, length * 0.5)
    objs = []
    shaft = kit.cyl(parts, name + '.listening-mast', kit.ROLE_TRIM,
                    mid, r, length, mat, rotation=rot, vertices=10)
    if shaft:
        objs.append(shaft)
    if detail < 2:
        return objs
    collar = kit.cyl(parts, name + '.listening-mast.collar', kit.ROLE_HULL,
                     _add(loc, d, 0.08), r + 0.06, 0.16, mat,
                     rotation=rot, vertices=10)
    if collar:
        objs.append(collar)
    if detail < 3 or not dish:
        return objs
    tip = _add(loc, d, length - sf.DISH_EAR_T * 0.35)
    objs.extend(listening_dish(parts, name + '.mast', mat, tip,
                               facing=facing, detail=detail))
    return objs


def shutter_seam(parts, name, mat, loc, size=None, detail=3):
    """Zone seam bead. Not a full-beam paper strip.

    FACING: box axes follow ship axes; ``loc`` is the bead centre.
    Default ``sf.SHUTTER_SEAM`` is a local block (0.56 × 0.18 × 0.14)
    so it cannot read as a floating full-beam film.

    Detail: 0/1 = bead; 2+ = + two clamp pads.
    """
    if size is None:
        size = sf.SHUTTER_SEAM
    sx, sy, sz = size
    sx = max(sx, 0.28)
    sy = max(sy, 0.12)
    sz = max(sz, 0.12)
    objs = []
    bead = kit.box(parts, name + '.shutter-seam', kit.ROLE_TRIM, loc,
                   (sx, sy, sz), mat)
    if bead:
        objs.append(bead)
    if detail < 2:
        return objs
    pad = (max(sx * 0.22, 0.12), sy + 0.04, sz + 0.04)
    for i, sign in enumerate((-1.0, 1.0)):
        cap = kit.box(parts, '%s.shutter-seam.pad.%d' % (name, i),
                      kit.ROLE_HULL,
                      (loc[0] + sign * (sx * 0.5 - pad[0] * 0.35),
                       loc[1], loc[2]),
                      pad, mat)
        if cap:
            objs.append(cap)
    return objs
