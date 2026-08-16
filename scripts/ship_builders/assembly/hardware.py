"""Assembly equipment: optics, probes, sockets, masts, drive, radiators.

Bible §4.8: teal optics, antenna forests, fabrication apertures, daughter
probes. This module builds through ship_kit only. It never queries a hull —
the caller passes loc, size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into kit.box
unhalved. kit.sphere scale is a RADIUS. Human and Assembly sizes are NEVER
multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan the hull.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
Emissive parts go in the glow list with skin_role 'glow' (teal by palette).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
import mathutils

from . import surface as sf


_BL_LONG = mathutils.Vector((0.0, 1.0, 0.0))

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


def _glow_tag(obj):
    if obj:
        obj['skin_role'] = 'glow'
    return obj


def _dir(facing):
    if isinstance(facing, tuple):
        return facing
    return _FACE_DIR.get(facing, (0.0, 0.0, -1.0))


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _aim_long_axis(obj, ship_dir):
    target = mathutils.Vector((ship_dir[0], -ship_dir[2], ship_dir[1]))
    if target.length < 1e-6:
        return
    obj.rotation_euler = _BL_LONG.rotation_difference(target.normalized()).to_euler()


def teal_optic(parts, glow, name, hull_mat, glow_mat, loc, radius=None,
               facing='nose', detail=3):
    """Circular teal iris in a dark collar. Glow lives in the iris only.

    FACING: nose / stern / port / starboard / up / down — the iris looks
    that way. ``loc`` is the surface-plane centre. The collar is buried so
    half its depth sits inboard of ``loc``.

    ``radius`` is the collar radius; default sf.OPTIC_COLLAR_R (absolute).
    Detail: 0 = collar mass; 1 = collar + recess well; 2+ = well + teal iris.
    """
    if radius is None:
        radius = sf.OPTIC_COLLAR_R
    d = _dir(facing)
    rot = _CYL_ROT.get(facing, sf.CYL_ALONG_Z)
    depth = max(sf.OPTIC_DEPTH, radius * 0.40)
    objs = []
    # Collar centre half a depth inboard of the surface.
    col_c = _add(loc, d, -depth * 0.5 + 0.04)
    col = kit.cyl(parts, name + '.teal-optic.collar', kit.ROLE_HULL, col_c,
                  radius, depth, hull_mat, rotation=rot, vertices=12)
    if col:
        objs.append(col)
    if detail >= 1:
        well = kit.cyl(parts, name + '.well', kit.ROLE_RECESS,
                       _add(loc, d, 0.02), radius * 0.72, 0.06,
                       hull_mat, rotation=rot, vertices=12)
        if well:
            objs.append(well)
    if detail >= 2:
        iris_r = max(0.07, radius * 0.44)
        iris = kit.cyl(glow, name + '.iris', kit.ROLE_RECESS,
                       _add(loc, d, 0.03), iris_r, 0.05,
                       glow_mat, rotation=rot, vertices=10)
        if iris:
            objs.append(_glow_tag(iris))
    return objs


def instrument_petal(parts, name, mat, loc, facing='starboard', size=None,
                     detail=3):
    """One survey petal used by daughter probes and small fans.

    FACING: tip direction (nose / stern / port / starboard / up / down).
    ``loc`` is the petal centre. Default ``size`` is the absolute PETAL_*
    module (width, thickness, length). Caller buries 0.10 of length into
    the host body.

    Detail: 0 = nothing; 1+ = the petal mass.
    """
    if detail < 1:
        return []
    if size is None:
        size = (sf.PETAL_W, sf.PETAL_T, sf.PETAL_LEN)
    d = _dir(facing)
    sx = max(size[0], 0.16)
    sy = max(size[1], 0.08)
    sz = max(size[2], 0.28)
    petal = kit.taper_block(parts, name + '.instrument-petal', kit.ROLE_ARMOUR,
                            loc, (sx, sy, sz), mat,
                            front=(0.40, 0.82), back=(1.0, 1.0))
    if not petal:
        return []
    _aim_long_axis(petal, (-d[0], -d[1], -d[2]))
    return [petal]


def fabrication_socket(parts, glow, name, hull_mat, glow_mat, loc,
                       radius=None, facing='nose', detail=3):
    """Aperture a daughter can nest in: dark collar, teal iris, recess well.

    FACING: the open face (usually nose). ``loc`` is the surface-plane
    centre. Default radius is sf.FAB_SOCKET_COLLAR_R — large enough that a
    light-class daughter can sit in the mouth. For a socket ON a daughter
    pass a smaller radius.

    Detail: 0 = collar; 1 = collar + well; 2+ = well + iris + lip torus.
    """
    if radius is None:
        radius = sf.FAB_SOCKET_COLLAR_R
    d = _dir(facing)
    rot = _CYL_ROT.get(facing, sf.CYL_ALONG_Z)
    depth = max(sf.FAB_SOCKET_DEPTH, radius * 0.28)
    objs = []
    col = kit.cyl(parts, name + '.socket.collar', kit.ROLE_HULL,
                  _add(loc, d, -depth * 0.5 + 0.06),
                  radius, depth, hull_mat, rotation=rot, vertices=12)
    if col:
        objs.append(col)
    if detail >= 1:
        well = kit.cyl(parts, name + '.socket.well', kit.ROLE_RECESS,
                       _add(loc, d, 0.02), radius * 0.70, 0.08,
                       hull_mat, rotation=rot, vertices=12)
        if well:
            objs.append(well)
    if detail >= 2:
        lip = kit.torus(parts, name + '.socket.lip', kit.ROLE_TRIM,
                        _add(loc, d, 0.04), radius * 0.86, sf.JOINT_MINOR,
                        hull_mat, rotation=rot)
        if lip:
            objs.append(lip)
        iris = kit.cyl(glow, name + '.socket.iris', kit.ROLE_RECESS,
                       _add(loc, d, 0.025), max(0.10, radius * 0.42), 0.05,
                       glow_mat, rotation=rot, vertices=10)
        if iris:
            objs.append(_glow_tag(iris))
    return objs


def daughter_probe(parts, glow, name, hull_mat, glow_mat, loc,
                   detail=3, seed=1, petals=4):
    """Canonical repeated craft: body + teal optic + 3–4 petals + tiny socket.

    FACING: optic looks nose (−Z). Petals sit in the XY plane. The tiny
    fabrication socket sits on the stern (+Z). ``loc`` is the body centre.

    Absolute size is light-class escort (sf.DAUGHTER_BODY_R plus PETAL_LEN),
    NEVER scaled by host l. A freighter carries MORE of these, not bigger
    ones. The smallest visible daughter on a freighter is this module.

    Detail: 0 = body; 1 = body + optic; 2 = + petals; 3 = + stern socket.
    """
    objs = []
    r = sf.DAUGHTER_BODY_R
    segs = 12 if detail >= 2 else 10
    body = kit.sphere(parts, name + '.copied-probe.body', kit.ROLE_HULL, loc,
                      (r, r, r), hull_mat, segments=segs)
    if body:
        objs.append(body)
    # Equatorial joint so the body reads as a copied module, not a ball.
    if detail >= 1:
        eq = kit.torus(parts, name + '.copied-probe.joint', kit.ROLE_RECESS,
                       loc, r * 0.96, sf.JOINT_MINOR, hull_mat,
                       rotation=sf.CYL_ALONG_Z)
        if eq:
            objs.append(eq)
        optic_loc = _add(loc, (0.0, 0.0, -1.0), r - 0.04)
        objs.extend(teal_optic(parts, glow, name + '.eye', hull_mat, glow_mat,
                               optic_loc, radius=sf.OPTIC_COLLAR_R,
                               facing='nose', detail=detail))
    if detail >= 2:
        n = 4 if petals >= 4 else 3
        if detail == 2:
            n = 3
        bury = 0.14
        rand = kit.rng(int(seed) & 0xFFFFFFFF)
        for i in range(n):
            ang = 2.0 * math.pi * i / n + (rand() - 0.5) * 0.08
            radial = (math.cos(ang), math.sin(ang), 0.0)
            if abs(radial[0]) >= abs(radial[1]):
                face = 'starboard' if radial[0] > 0.0 else 'port'
            else:
                face = 'up' if radial[1] > 0.0 else 'down'
            dist = r + sf.PETAL_LEN * 0.5 - bury
            pc = _add(loc, radial, dist)
            objs.extend(instrument_petal(parts, '%s.petal.%d' % (name, i),
                                         hull_mat, pc, facing=face,
                                         detail=detail))
    if detail >= 3:
        sock = _add(loc, (0.0, 0.0, 1.0), r - 0.02)
        objs.extend(fabrication_socket(parts, glow, name + '.nest',
                                       hull_mat, glow_mat, sock,
                                       radius=0.32, facing='stern',
                                       detail=detail))
    return objs


def antenna_mast(parts, name, mat, loc, height=None, detail=3):
    """One thin fragile mast. Root buried 0.12 below ``loc``.

    FACING: stands along +Y. ``height`` defaults to sf.ANTENNA_H (absolute).
    Radius is sf.ANTENNA_R so the shaft stays above the 0.06 voxel on two
    axes while the height keeps max-extent well above SUB-VOXEL.

    Detail: 0 = nothing; 1+ = the shaft (ROLE_TRIM).
    """
    if detail < 1:
        return []
    if height is None:
        height = sf.ANTENNA_H
    h = max(height, 0.40)
    lx, ly, lz = loc
    shaft = kit.strut(parts, name + '.mast', kit.ROLE_TRIM,
                      (lx, ly - 0.12, lz), (lx, ly + h, lz),
                      mat, sf.ANTENNA_R, vertices=6)
    if shaft:
        return [shaft]
    return []


def antenna_forest(parts, glow, name, hull_mat, glow_mat, loc, count=5,
                   detail=3, seed=1):
    """Cluster of thin masts on the mid-spine service band.

    FACING: each mast stands +Y. ``loc`` is the forest centre on the deck.
    Count steps down with detail: 3 = ``count``, 2 = half, 1 = 1, 0 = empty.
    Heights jitter a few percent (copy-drift), never a new size family.
    A single teal marker sits at the tallest tip at detail >= 2.
    """
    if detail < 1:
        return []
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    else:
        n = 1
    rand = kit.rng(int(seed) & 0xFFFFFFFF)
    objs = []
    lx, ly, lz = loc
    tallest = None
    tall_h = -1.0
    for i in range(n):
        ox = (rand() - 0.5) * 0.36
        oz = (rand() - 0.5) * 0.70
        h = sf.ANTENNA_H * (0.82 + rand() * 0.28)
        mast = antenna_mast(parts, '%s.ant.%d' % (name, i), hull_mat,
                            (lx + ox, ly, lz + oz), height=h, detail=detail)
        objs.extend(mast)
        if h > tall_h:
            tall_h = h
            tallest = (lx + ox, ly + h, lz + oz)
    if detail >= 2 and tallest is not None:
        tip = kit.sphere(glow, name + '.marker', kit.ROLE_RECESS, tallest,
                         (0.045, 0.045, 0.045), glow_mat, segments=8)
        if tip:
            objs.append(_glow_tag(tip))
    return objs


def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.50, detail=3):
    """Countable nozzle group 2/4/6/8 on a charcoal housing. Grid, not a row.

    FACING: nozzles look stern (+Z). ``loc`` is the housing back-face centre
    (the transom plane). The housing's forward 0.12 is buried in the spine
    the caller anchored. Throats stay inside 70 % of the face half-extents
    so a 6- or 8-nozzle group cannot outspan the housing.

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
    hous = kit.chamfer_block(parts, name + '.housing', kit.ROLE_HULL,
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


def docking_collar(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='down', detail=3):
    """Fleet-diameter docking collar. Bore is sf.COLLAR_BORE = 0.62.

    FACING: the mating face (down = ventral −Y, nose = −Z, stern = +Z).
    ``loc`` is the mating-plane centre. The barrel buries ≥ 0.12 into the
    host so the island probe reads one body.

    Detail: 0 = barrel; 1 = barrel + bore disc; 2+ = + lip torus.
    """
    d = _dir(facing)
    rot = _CYL_ROT.get(facing, sf.CYL_ALONG_Y)
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
                        _add(loc, d, 0.04), bore + 0.06, sf.JOINT_MINOR,
                        hull_mat, rotation=rot)
        if lip:
            objs.append(lip)
        slit = kit.box(glow, name + '.collar.mark', kit.ROLE_RECESS,
                       _add(_add(loc, d, 0.05), (0.0, 0.0, 0.0)),
                       (sf.STATUS_SLIT[0], sf.STATUS_SLIT[1], sf.STATUS_SLIT[2]),
                       glow_mat)
        if slit:
            objs.append(_glow_tag(slit))
    return objs
