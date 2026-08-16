"""Lamplighter equipment: lamps, mast, collar, drive, tools, workshop.

Bible §4.10: floodlights and diagnostic panels are the equivalent of
other factions' weapon mounts. This module builds through ship_kit only.
It never queries a hull — the caller passes loc, size and facing
computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into kit.box
unhalved. kit.sphere scale is a RADIUS. Human and Lamplighter sizes are
NEVER multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan the hull.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
Emissive parts go in the glow list with skin_role 'glow' (warm lamp).
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


def work_lamp(parts, glow, name, hull_mat, glow_mat, loc,
              facing='down', detail=3):
    """One HUMAN-scale work lamp. Housing is yellow; iris is the glow.

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
    hous = kit.box(parts, name + '.work-lamp', kit.ROLE_ACCENT, loc,
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


def lamp_bar(parts, glow, name, hull_mat, glow_mat, loc, count=4,
             axis='z', facing='down', detail=3):
    """Row of work lamps at HUMAN LAMP_SPACING 1.20. Never edge-to-edge.

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
        objs.extend(work_lamp(parts, glow, '%s.lamp-bar.%d' % (name, i),
                              hull_mat, glow_mat, lloc, facing=facing,
                              detail=detail))
    return objs


def relay_mast(parts, name, mat, loc, height=None, detail=3):
    """Diagnostic column. Cobalt / armour.

    FACING: the shaft stands along +Y. ``loc`` is the BASE centre.
    Cross-section is ``sf.RELAY_MAST_SEC`` (absolute). Default height is
    ``sf.RELAY_MAST_H``.

    Detail: 0/1 = shaft; 2 = + cap platform; 3 = + small readout plate.
    """
    if height is None:
        height = sf.RELAY_MAST_H
    height = max(height, 0.40)
    sec = sf.RELAY_MAST_SEC
    lx, ly, lz = loc
    shaft_c = (lx, ly + height * 0.5, lz)
    objs = []
    shaft = kit.box(parts, name + '.relay-mast', kit.ROLE_ARMOUR, shaft_c,
                    (sec, height, sec), mat)
    if shaft:
        objs.append(shaft)
    if detail >= 2:
        cap = kit.box(parts, name + '.relay-mast.cap', kit.ROLE_TRIM,
                      (lx, ly + height + 0.04, lz),
                      (sec + 0.10, 0.08, sec + 0.10), mat)
        if cap:
            objs.append(cap)
    if detail >= 3:
        plate = kit.box(parts, name + '.diag-panel', kit.ROLE_ARMOUR,
                        (lx + sec * 0.5 + 0.03, ly + height * 0.62, lz),
                        sf.DIAG_PANEL, mat)
        if plate:
            objs.append(plate)
    return objs


def diag_panel(parts, name, mat, loc, facing='starboard', detail=3):
    """Cobalt readout plate.

    FACING: the plate looks that way. ``loc`` is the plate centre.
    Size is ``sf.DIAG_PANEL`` (FULL extents) on a flank face, remapped
    for nose / up.

    Detail: 0/1 = plate; 2+ = + status slits.
    """
    d = _dir(facing)
    sx, sy, sz = sf.DIAG_PANEL
    if facing in ('nose', 'stern') or abs(d[2]) >= 0.7:
        size = (sx, sy, sz)
    elif facing in ('up', 'down') or abs(d[1]) >= 0.7:
        size = (sx, sz, sy)
    else:
        size = (sz, sy, sx)
    objs = []
    plate = kit.box(parts, name + '.diag-panel', kit.ROLE_ARMOUR, loc,
                    size, mat)
    if plate:
        objs.append(plate)
    if detail >= 2:
        slit = kit.box(parts, name + '.diag-slit', kit.ROLE_RECESS,
                       _add(loc, d, 0.03),
                       sf.STATUS_SLIT, mat)
        if slit:
            objs.append(slit)
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
    """Countable nozzle group 2/4/6/8 on a soot housing. Grid, not a row.

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
    # kit.chamfer_block size is FULL extents.
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


def tool_pod(parts, name, mat, loc, detail=3):
    """One hot-swap tool pod. Absolute ``sf.TOOL_POD`` size.

    FACING: box axes follow ship axes. ``loc`` is the pod centre.

    Detail: 0/1 = pod mass; 2 = + latch; 3 = + face socket.
    """
    objs = []
    body = kit.box(parts, name + '.tool-pod', kit.ROLE_HULL, loc,
                   sf.TOOL_POD, mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    sx, sy, sz = sf.TOOL_POD
    latch = kit.box(parts, name + '.tool-pod.latch', kit.ROLE_TRIM,
                    _add(loc, (0.0, 1.0, 0.0), sy * 0.5 - 0.03),
                    (sx * 0.45, 0.08, sz * 0.30), mat)
    if latch:
        objs.append(latch)
    if detail >= 3:
        sock = kit.cyl(parts, name + '.tool-pod.socket', kit.ROLE_RECESS,
                       _add(loc, (0.0, 0.0, 1.0), sz * 0.5 - 0.02),
                       0.07, 0.08, mat,
                       rotation=sf.CYL_ALONG_Z, vertices=8)
        if sock:
            objs.append(sock)
    return objs


def tool_carousel(parts, name, mat, loc, count=4, detail=3):
    """Skiff tool carousel: a hub with hot-swap pods around it.

    FACING: the hub stands along +Y. ``loc`` is the hub centre. Pods use
    the absolute ``sf.TOOL_POD`` module. A bigger ship passes a larger
    ``count``, never a larger pod.

    Detail: 0 = hub; 1 = hub + one pod; 2 = half of ``count``; 3 = full.
    """
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    elif detail == 1:
        n = 1
    else:
        n = 0
    objs = []
    hub_r = 0.22
    hub_h = 0.28
    hub = kit.cyl(parts, name + '.carousel-hub', kit.ROLE_HULL, loc,
                  hub_r, hub_h, mat, rotation=sf.CYL_ALONG_Y, vertices=10)
    if hub:
        objs.append(hub)
    if n < 1:
        return objs
    ring = hub_r + sf.TOOL_POD[0] * 0.55
    for i in range(n):
        ang = 2.0 * math.pi * i / n
        ploc = (loc[0] + ring * math.cos(ang), loc[1],
                loc[2] + ring * math.sin(ang))
        objs.extend(tool_pod(parts, '%s.pod.%d' % (name, i), mat, ploc,
                             detail=detail))
    return objs


def beacon_rack(parts, name, mat, loc, count=4, detail=3):
    """Replacement beacon slots. Absolute ``sf.BEACON`` bodies.

    FACING: beacons stand along +Y in a row along Z. ``loc`` is the rack
    centre. Frame is hull; beacons are cobalt armour.

    Detail: 3 = ``count``; 2 = half; 1 = frame + one beacon; 0 = frame.
    """
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    elif detail == 1:
        n = 1
    else:
        n = 0
    pitch = 0.28
    bw, bh, bd = sf.BEACON
    span = pitch * max(n - 1, 0)
    frame_z = max(span + 0.24, 0.50)
    objs = []
    frame = kit.box(parts, name + '.beacon-rack', kit.ROLE_HULL, loc,
                    (0.28, 0.12, frame_z), mat)
    if frame:
        objs.append(frame)
    if n < 1:
        return objs
    origin = _add(loc, (0.0, 0.0, 1.0), -pitch * (n - 1) * 0.5)
    for i in range(n):
        bloc = _add(origin, (0.0, 1.0, 0.0), 0.18)
        bloc = _add(bloc, (0.0, 0.0, 1.0), pitch * i)
        body = kit.cyl(parts, '%s.beacon.%d' % (name, i), kit.ROLE_ARMOUR,
                       bloc, max(bw, 0.08), bd, mat,
                       rotation=sf.CYL_ALONG_Y, vertices=8)
        if body:
            objs.append(body)
    return objs


def workshop_volume(parts, name, mat, loc, detail=3):
    """Protected crew / workshop box with a visible hatch.

    FACING: box axes follow ship axes. ``loc`` is the volume centre.
    Size is ``sf.WORKSHOP``. The hatch is human-door sized. An inboard
    cobalt core reads as the open diagnostic bay from the plate.

    Detail: 0/1 = box mass; 2 = + hatch + core; 3 = + port light.
    """
    sx, sy, sz = sf.WORKSHOP
    objs = []
    shell = kit.box(parts, name + '.workshop-volume', kit.ROLE_HULL, loc,
                    (sx, sy, sz), mat)
    if shell:
        objs.append(shell)
    if detail < 2:
        return objs
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.workshop-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 + 0.01),
                    (recess, door_h, door_w), mat)
    if hatch:
        objs.append(hatch)
    core = kit.box(parts, name + '.workshop-core', kit.ROLE_ARMOUR,
                   loc, (sx * 0.62, sy * 0.55, sz * 0.62), mat)
    if core:
        objs.append(core)
    if detail >= 3:
        port = kit.box(parts, name + '.workshop-port', kit.ROLE_RECESS,
                       _add(loc, (0.0, 1.0, 0.0), sy * 0.5 - 0.01),
                       sf.PORT_LIGHT, mat)
        if port:
            objs.append(port)
    return objs
