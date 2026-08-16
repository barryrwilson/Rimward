"""Independent equipment: lamps, collar, drive, radiators, clamps, tug.

Bible §5.1: warm universal navigation lights, modular mission pods,
salvage-tug clamps, an old commercial tug core. This module builds
through ship_kit only. It never queries a hull — the caller passes loc,
size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into kit.box
unhalved. kit.sphere scale is a RADIUS. Human and Independent sizes are
NEVER multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan the hull.

Nav lamps use HUMAN.lampGap 1.20. Never pack edge-to-edge.

clamp_pair is a short container / salvage-tug yoke. It is not a
Lamplighter gate-arm fork.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
Emissive parts go in the glow list with skin_role 'glow' (warm amber).
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


def nav_lamp(parts, glow, name, hull_mat, glow_mat, loc,
             facing='up', detail=3):
    """One HUMAN-scale navigation lamp. Housing is commercial; iris glows.

    FACING: the lamp looks that way. ``loc`` is the housing centre.
    Housing uses ``sf.LAMP_HOUSING`` (absolute). The iris sits just proud
    of the housing face. Never pack lamps closer than ``sf.LAMP_SPACING``.

    Detail: 0 = nothing; 1 = housing; 2+ = housing + glow iris.
    """
    if detail < 1:
        return []
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    objs = []
    hous = kit.box(parts, name + '.nav-lamp', kit.ROLE_TRIM, loc,
                   sf.LAMP_HOUSING, hull_mat)
    if hous:
        objs.append(hous)
    if detail >= 2:
        iris = kit.cyl(glow, name + '.lamp-iris', kit.ROLE_RECESS,
                       _add(loc, d, 0.06), 0.045, 0.05, glow_mat,
                       rotation=rot, vertices=8)
        if iris:
            objs.append(_glow_tag(iris))
    return objs


def lamp_run(parts, glow, name, hull_mat, glow_mat, loc, count=3,
             axis='z', facing='up', detail=3):
    """Row of nav lamps at HUMAN LAMP_SPACING 1.20. Never edge-to-edge.

    FACING: lamps look ``facing``. The run is centred on ``loc`` along
    ``axis`` ('x' / 'y' / 'z'). Pitch is ``sf.LAMP_SPACING``.

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
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    pitch = sf.LAMP_SPACING
    origin = _add(loc, step, -pitch * (n - 1) * 0.5)
    objs = []
    for i in range(n):
        lloc = _add(origin, step, pitch * i)
        objs.extend(nav_lamp(parts, glow, '%s.lamp-run.%d' % (name, i),
                             hull_mat, glow_mat, lloc, facing=facing,
                             detail=detail))
    return objs


def docking_collar(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='nose', detail=3):
    """Fleet-diameter docking collar. Bore is sf.COLLAR_BORE = 0.62.

    FACING: the mating face (nose = −Z, down = ventral −Y, stern = +Z).
    ``loc`` is the mating-plane centre. The barrel buries ≥ 0.12 into the
    host so the island probe reads one body.

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
        slit = kit.box(glow, name + '.collar.mark', kit.ROLE_RECESS,
                       _add(loc, d, 0.05),
                       sf.STATUS_SLIT, glow_mat)
        if slit:
            objs.append(_glow_tag(slit))
    return objs


def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.50, detail=3):
    """Countable nozzle group 2/4/6/8 on a commercial housing. Grid, not a row.

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


def mission_pod(parts, name, mat, loc, detail=3):
    """Modular commercial mission pod. Absolute ``sf.MISSION_POD`` size.

    FACING: box axes follow ship axes. ``loc`` is the pod centre.

    Detail: 0/1 = pod mass; 2 = + hatch; 3 = + latch + port.
    """
    sx, sy, sz = sf.MISSION_POD
    objs = []
    body = kit.box(parts, name + '.mission-pod', kit.ROLE_HULL, loc,
                   (sx, sy, sz), mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.mission-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 + 0.01),
                    (recess, min(door_h, sy * 0.70), min(door_w, sz * 0.45)),
                    mat)
    if hatch:
        objs.append(hatch)
    if detail < 3:
        return objs
    latch = kit.box(parts, name + '.mission-latch', kit.ROLE_TRIM,
                    _add(loc, (0.0, 1.0, 0.0), sy * 0.5 - 0.03),
                    (sx * 0.40, 0.08, sz * 0.28), mat)
    if latch:
        objs.append(latch)
    port = kit.box(parts, name + '.mission-port', kit.ROLE_RECESS,
                   _add(loc, (0.0, 0.0, -1.0), sz * 0.5 - 0.01),
                   sf.PORT_LIGHT, mat)
    if port:
        objs.append(port)
    return objs


def clamp_pair(parts, name, mat, loc, span=None, detail=3):
    """Salvage-tug / container clamp pair. Short yoke, two inward jaws.

    FACING: the pair spans ship X and grips a crate on the centreline.
    ``loc`` is the yoke centre. Default span matches one ISO crate
    (0.85). This is cutter hardware, not a Lamplighter gate-arm fork.

    Detail: 0/1 = yoke + two pads; 2+ = + short rams.
    """
    crate = sf.CARGO_CRATE[0]
    if span is None:
        span = crate
    span = max(float(span), 0.50)
    lx, ly, lz = loc
    yw, yh, yd = sf.CLAMP_YOKE
    yw = max(span + 0.10, yw)
    yh = max(yh, 0.10)
    yd = max(yd, 0.12)
    pw, ph, pd = sf.CLAMP_PAD
    objs = []
    yoke = kit.box(parts, name + '.clamp-pair.yoke', kit.ROLE_HULL,
                   loc, (yw, yh, yd), mat)
    if yoke:
        objs.append(yoke)
    jaw_x = span * 0.5 + pw * 0.15
    jaw_y = ly - yh * 0.5 - ph * 0.25
    for side, sx in (('p', -1.0), ('s', 1.0)):
        jaw = kit.box(parts, '%s.clamp-pair.jaw.%s' % (name, side),
                      kit.ROLE_TRIM,
                      (lx + sx * jaw_x, jaw_y, lz),
                      (pw, ph, pd), mat)
        if jaw:
            objs.append(jaw)
    if detail < 2:
        return objs
    ram_r = 0.06
    ram_len = max(ph * 0.70, 0.16)
    for side, sx in (('p', -1.0), ('s', 1.0)):
        ram = kit.cyl(parts, '%s.clamp-pair.ram.%s' % (name, side),
                      kit.ROLE_HULL,
                      (lx + sx * (span * 0.35), ly - 0.02, lz),
                      ram_r, ram_len, mat,
                      rotation=sf.CYL_ALONG_Y, vertices=8)
        if ram:
            objs.append(ram)
    return objs


def tug_core(parts, name, mat, loc, detail=3):
    """Old commercial tug engineering block.

    FACING: box axes follow ship axes; stern is +Z. ``loc`` is the block
    centre. Size is ``sf.TUG_CORE``. A bigger ship carries MORE of these
    or a longer rack, never a scaled-up core.

    Detail: 0/1 = block mass; 2 = + intake; 3 = + service hatch + vent.
    """
    sx, sy, sz = sf.TUG_CORE
    objs = []
    body = kit.chamfer_block(parts, name + '.tug-core', kit.ROLE_HULL,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.14)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    intake = kit.cyl(parts, name + '.tug-intake', kit.ROLE_RECESS,
                     _add(loc, (0.0, 0.0, 1.0), sz * 0.5 - 0.04),
                     0.16, 0.12, mat, rotation=sf.CYL_ALONG_Z, vertices=10)
    if intake:
        objs.append(intake)
    if detail < 3:
        return objs
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.tug-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 + 0.01),
                    (recess, min(door_h, sy * 0.60), min(door_w, sz * 0.30)),
                    mat)
    if hatch:
        objs.append(hatch)
    vent = kit.box(parts, name + '.tug-vent', kit.ROLE_ARMOUR,
                   _add(loc, (0.0, 1.0, 0.0), sy * 0.5 - 0.02),
                   (sx * 0.36, 0.08, sz * 0.28), mat)
    if vent:
        objs.append(vent)
    return objs
