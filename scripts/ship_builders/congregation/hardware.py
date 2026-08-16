"""Congregation equipment: nave, lamps, optics, locks, drive, radiators.

Bible §4.9: observation chambers, candle-amber guidance lamps, restrained
Wakeglass optics, archive boxes, rescue stores, folded sails as function.
This module builds through ship_kit only. It never queries a hull — the
caller passes loc, size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into kit.box
unhalved. kit.sphere scale is a RADIUS. Human and Congregation sizes are
NEVER multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan the hull.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
Emissive parts go in the glow list with skin_role 'glow' (candle amber).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import ritual as rt

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


def observation_nave(parts, glow, name, hull_mat, glow_mat, loc,
                     radius=None, length=None, detail=3):
    """Geodesic cage + inboard amber glow. Glass, lip and glow on distinct planes.

    FACING: tip toward ship −Z. ``loc`` is the nave centre. Default envelope
    is ``sf.NAVE_R`` / ``sf.NAVE_LEN``. The interior core sits inboard of
    the glass. Glow is a slightly larger taper so it is ≤ 0.01 proud of the
    core and below the lip — not enclosed inside an opaque box.

    Detail: 0 = core + cage mass; 1 = + glow volume; 2+ = + lip ring.
    """
    if radius is None:
        radius = sf.NAVE_R
    if length is None:
        length = sf.NAVE_LEN
    r = max(radius, 0.28)
    ln = max(length, 0.70)
    objs = []
    objs.extend(rt.nave_cage(parts, name + '.cage', hull_mat, loc,
                             radius=r, length=ln, detail=detail))
    # Core is a pointed interior mass; glow is a hair larger so its faces
    # sit proud of the core and remain visible between the panes.
    core = kit.taper_block(
        parts, name + '.observation-nave.core', kit.ROLE_HULL, loc,
        (r * 1.10, r * 1.10, ln * 0.82), hull_mat,
        front=(0.22, 0.22), back=(1.0, 1.0))
    if core:
        objs.append(core)
    if detail >= 1:
        glow_loc = _add(loc, (0.0, 0.0, -1.0), 0.02)
        ember = kit.taper_block(
            glow, name + '.observation-nave.glow', kit.ROLE_RECESS, glow_loc,
            (r * 1.14, r * 1.14, ln * 0.78), glow_mat,
            front=(0.20, 0.20), back=(1.0, 1.0))
        if ember:
            objs.append(_glow_tag(ember))
    if detail >= 2:
        lip = kit.torus(parts, name + '.nave-lip', kit.ROLE_TRIM,
                        _add(loc, (0.0, 0.0, 1.0), ln * 0.28),
                        r * 0.72, sf.RIB_MINOR, hull_mat,
                        rotation=sf.CYL_ALONG_Z)
        if lip:
            objs.append(lip)
    return objs


def candle_lamp(parts, glow, name, hull_mat, glow_mat, loc,
                facing='up', detail=3):
    """One HUMAN-scale candle lamp. Housing is amber; iris is the glow.

    FACING: the lamp looks that way. ``loc`` is the housing centre. Housing
    uses ``sf.LAMP_HOUSING`` (absolute). The iris disc is tiny and sits
    inside the housing — it may be sub-voxel; the housing is not.

    Detail: 0 = nothing; 1 = housing; 2+ = housing + glow iris.
    """
    if detail < 1:
        return []
    d = _dir(facing)
    rot = _CYL_ROT.get(facing, sf.CYL_ALONG_Y)
    if isinstance(facing, tuple):
        if abs(d[2]) >= abs(d[0]) and abs(d[2]) >= abs(d[1]):
            rot = sf.CYL_ALONG_Z
        elif abs(d[0]) >= abs(d[1]):
            rot = sf.CYL_ALONG_X
        else:
            rot = sf.CYL_ALONG_Y
    objs = []
    hous = kit.box(parts, name + '.candle-lamp', kit.ROLE_ACCENT, loc,
                   sf.LAMP_HOUSING, hull_mat)
    if hous:
        objs.append(hous)
    if detail >= 2:
        iris = kit.cyl(glow, name + '.lamp-iris', kit.ROLE_RECESS,
                       _add(loc, d, 0.04), 0.034, 0.04, glow_mat,
                       rotation=rot, vertices=8)
        if iris:
            objs.append(_glow_tag(iris))
    return objs


def lamp_row(parts, glow, name, hull_mat, glow_mat, loc, count=4,
             axis='z', detail=3):
    """Row of candle lamps at HUMAN LAMP_SPACING 1.20. Never edge-to-edge.

    FACING: lamps look +Y. The run is centred on ``loc`` along ``axis``
    ('x' / 'y' / 'z'). Pitch is ``sf.LAMP_SPACING``.

    Detail: 3 = ``count``; 2 = half; 1 = one lamp; 0 = empty.
    """
    if detail < 1:
        return []
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    else:
        n = 1
    step = {'x': (1.0, 0.0, 0.0), 'y': (0.0, 1.0, 0.0),
            'z': (0.0, 0.0, 1.0)}.get(axis, (0.0, 0.0, 1.0))
    pitch = sf.LAMP_SPACING
    origin = _add(loc, step, -pitch * (n - 1) * 0.5)
    objs = []
    for i in range(n):
        lloc = _add(origin, step, pitch * i)
        objs.extend(candle_lamp(parts, glow, '%s.lamp.%d' % (name, i),
                                hull_mat, glow_mat, lloc, facing='up',
                                detail=detail))
    return objs


def wakeglass_optic(parts, glow, name, hull_mat, glow_mat, loc,
                    facing='nose', detail=3):
    """Small framed Wakeglass pane. Glow disc is tiny and restrained.

    FACING: the pane looks that way. ``loc`` is the surface-plane centre.
    Frame is ROLE_TRIM; pane is ROLE_ARMOUR. The glow sits just proud of
    the pane, well below a nightclub fill.

    Detail: 0 = nothing; 1 = frame + pane; 2+ = + tiny glow disc.
    """
    if detail < 1:
        return []
    d = _dir(facing)
    rot = _CYL_ROT.get(facing, sf.CYL_ALONG_Z)
    if isinstance(facing, tuple):
        rot = sf.CYL_ALONG_Z
    objs = []
    sx, sy, sz = sf.WAKEGLASS
    if facing in ('port', 'starboard') or (isinstance(facing, tuple)
                                           and abs(d[0]) >= 0.7):
        frame_size = (sz, sy, sx)
        pane_size = (0.04, sy * 0.62, sx * 0.62)
    elif facing in ('up', 'down') or (isinstance(facing, tuple)
                                      and abs(d[1]) >= 0.7):
        frame_size = (sx, sz, sy)
        pane_size = (sx * 0.62, 0.04, sy * 0.62)
    else:
        frame_size = (sx, sy, sz)
        pane_size = (sx * 0.62, sy * 0.62, 0.04)
    frame = kit.box(parts, name + '.wakeglass.frame', kit.ROLE_TRIM, loc,
                    frame_size, hull_mat)
    if frame:
        objs.append(frame)
    pane = kit.box(parts, name + '.wakeglass.pane', kit.ROLE_ARMOUR,
                   _add(loc, d, 0.02), pane_size, hull_mat)
    if pane:
        objs.append(pane)
    if detail >= 2:
        iris = kit.cyl(glow, name + '.wakeglass.iris', kit.ROLE_RECESS,
                       _add(loc, d, 0.03), 0.034, 0.04, glow_mat,
                       rotation=rot, vertices=8)
        if iris:
            objs.append(_glow_tag(iris))
    return objs


def archive_box(parts, name, mat, loc, detail=3):
    """Compact crate-scale archive. HUMAN crate or smaller. Absolute size.

    FACING: box axes follow ship axes. ``loc`` is the crate centre.
    Size is ``sf.ARCHIVE``.

    Detail: 0/1 = box mass; 2+ = + lid seam.
    """
    objs = []
    body = kit.box(parts, name + '.archive-box', kit.ROLE_HULL, loc,
                   sf.ARCHIVE, mat)
    if body:
        objs.append(body)
    if detail >= 2:
        sx, sy, sz = sf.ARCHIVE
        lid = kit.box(parts, name + '.archive-lid', kit.ROLE_TRIM,
                      _add(loc, (0.0, 1.0, 0.0), sy * 0.5 - 0.03),
                      (sx * 0.92, 0.08, sz * 0.92), mat)
        if lid:
            objs.append(lid)
    return objs


def receiving_lock(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='down', detail=3):
    """Rescue / boarding collar + warm interior slit. Fleet collar bore.

    FACING: the mating face (usually down). ``loc`` is the mating-plane
    centre. The barrel buries ≥ 0.12 into the host. A candle-amber slit
    marks the interior.

    Detail: 0 = barrel; 1 = + bore; 2+ = + lip + glow slit.
    """
    d = _dir(facing)
    rot = _CYL_ROT.get(facing, sf.CYL_ALONG_Y)
    bore = sf.COLLAR_BORE
    r_bar = bore + 0.18
    depth = 0.40
    objs = []
    bar = kit.cyl(parts, name + '.receiving-lock.barrel', kit.ROLE_HULL,
                  _add(loc, d, -depth * 0.5 + 0.12),
                  r_bar, depth, hull_mat, rotation=rot, vertices=12)
    if bar:
        objs.append(bar)
    if detail >= 1:
        bd = kit.cyl(parts, name + '.receiving-lock.bore', kit.ROLE_RECESS,
                     _add(loc, d, 0.02), bore, 0.08,
                     hull_mat, rotation=rot, vertices=12)
        if bd:
            objs.append(bd)
    if detail >= 2:
        lip = kit.torus(parts, name + '.receiving-lock.lip', kit.ROLE_TRIM,
                        _add(loc, d, 0.04), bore + 0.08, sf.RIB_MINOR,
                        hull_mat, rotation=rot)
        if lip:
            objs.append(lip)
        slit = kit.box(glow, name + '.receiving-lock.slit', kit.ROLE_RECESS,
                       _add(loc, d, 0.05),
                       (sf.STATUS_SLIT[0], sf.STATUS_SLIT[1], sf.STATUS_SLIT[2]),
                       glow_mat)
        if slit:
            objs.append(_glow_tag(slit))
    return objs


def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.50, detail=3):
    """Countable nozzle group 2/4/6/8 on a midnight housing. Grid, not a row.

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
                        _add(loc, d, 0.04), bore + 0.06, sf.RIB_MINOR,
                        hull_mat, rotation=rot)
        if lip:
            objs.append(lip)
        slit = kit.box(glow, name + '.collar.mark', kit.ROLE_RECESS,
                       _add(loc, d, 0.05),
                       (sf.STATUS_SLIT[0], sf.STATUS_SLIT[1], sf.STATUS_SLIT[2]),
                       glow_mat)
        if slit:
            objs.append(_glow_tag(slit))
    return objs
