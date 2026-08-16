"""Veridian Combine equipment: survey gear, cradle wings, drive, cargo.

Bible §4.1: faceted survey head, sample canisters, ranging vanes,
docking/impound collar, flush survey drones, evidence lockers, sample
vaults, cargo cradle wings, tug docks, ore silos, refinery drums,
nested claim modules. Construction logic (synthesis/21 §G6): CLOSED
SHELL, MACHINED. §G2 breaker is the cargo cradle wing — grow REACH,
never thickness.

This module builds through ship_kit only. It never queries a hull —
the caller passes loc, size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into
kit.box unhalved. kit.sphere scale is a RADIUS. Human and Veridian
sizes are NEVER multiplied by ship l, b or h.

Drive nozzles are a GRID bounded by the housing face. Do not use
kit.engine_bank — it lays one X row and a 6-nozzle group can outspan
the hull.

Name substrings survey-head, canister, cradle and navigation-light
must appear on those meshes (skin matchers).

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
    return _FACE_DIR.get(facing, (0.0, 0.0, -1.0))


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


def _axis_size(long_s, thick, wide, facing):
    """Map (long, thick, wide) so long sits on the facing axis."""
    d = _dir(facing)
    if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        return (long_s, wide, thick)
    if facing in ('up', 'down') or abs(d[1]) >= 0.7:
        return (wide, long_s, thick)
    return (wide, thick, long_s)


def survey_head(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                facing='nose', detail=3):
    """Faceted survey head with a WIDE emerald inset glass band.

    FACING: the glass looks that way (default nose, −Z). ``loc`` is the
    head centre. Default size is ``sf.SURVEY_HEAD``. Glass is a recess
    well, not a painted face. Name contains survey-head.

    Detail: 0/1 = mass; 2 = + inset band; 3 = + glow panes.
    """
    if size is None:
        size = sf.SURVEY_HEAD
    d = _dir(facing)
    sx = max(size[0], 0.48)
    sy = max(size[1], 0.36)
    sz = max(size[2], 0.48)
    objs = []
    body = kit.chamfer_block(parts, name + '.survey-head', kit.ROLE_HULL,
                             loc, (sx, sy, sz), hull_mat,
                             chamfer=min(sx, sy) * 0.18)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    # Wide inset glass band across the facing face. Wall inboard.
    depth = max(sf.RECESS_DEPTH, 0.12)
    band_t = 0.10
    band_c = _add(loc, d, min(sx, sy, sz) * 0.42 - depth * 0.5)
    if abs(d[2]) >= 0.7:
        band_size = (sx * 0.78, sy * 0.38, depth)
    elif abs(d[0]) >= 0.7:
        band_size = (depth, sy * 0.38, sz * 0.78)
    else:
        band_size = (sx * 0.78, depth, sz * 0.38)
    wall = kit.box(parts, name + '.survey-head.glass-well', kit.ROLE_RECESS,
                   band_c, band_size, hull_mat)
    if wall:
        objs.append(wall)
    hood_p = min(sf.RECESS_HOOD, 0.07)
    hood_c = _add(loc, d, min(sx, sy, sz) * 0.42 + hood_p * 0.35)
    if abs(d[2]) >= 0.7:
        hood_size = (sx * 0.82, 0.10, max(hood_p + 0.04, 0.10))
        hood_c = _add(hood_c, (0.0, 1.0, 0.0), sy * 0.22)
    elif abs(d[0]) >= 0.7:
        hood_size = (max(hood_p + 0.04, 0.10), 0.10, sz * 0.82)
        hood_c = _add(hood_c, (0.0, 1.0, 0.0), sy * 0.22)
    else:
        hood_size = (sx * 0.82, max(hood_p + 0.04, 0.10), 0.10)
    hood = kit.box(parts, name + '.survey-head.hood', kit.ROLE_RECESS,
                   hood_c, hood_size, hull_mat)
    if hood:
        objs.append(hood)
    if detail < 3:
        return objs
    glow_t = 0.04
    glow_c = _add(loc, d, min(sx, sy, sz) * 0.42 - depth + 0.01 + glow_t * 0.5)
    if abs(d[2]) >= 0.7:
        gsize = (sx * 0.62, sy * 0.22, glow_t)
    elif abs(d[0]) >= 0.7:
        gsize = (glow_t, sy * 0.22, sz * 0.62)
    else:
        gsize = (sx * 0.62, glow_t, sz * 0.22)
    pane = kit.box(glow, name + '.survey-head.glass', kit.ROLE_RECESS,
                   glow_c, gsize, glow_mat)
    if pane:
        objs.append(_glow_tag(pane))
    return objs


def sample_canister(parts, name, mat, loc, facing='up', detail=3):
    """Detachable sample canister. Name contains canister.

    FACING: the long axis looks that way. ``loc`` is the bottle centre.
    Size is ``sf.SAMPLE_CANISTER``. Absolute — a freighter carries MORE.

    Detail: 0/1 = bottle; 2+ = + cap collar.
    """
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    sx, sy, sz = sf.SAMPLE_CANISTER
    r = max(min(sx, sy) * 0.5, 0.10)
    h = max(sz, 0.40)
    objs = []
    body = kit.cyl(parts, name + '.canister', kit.ROLE_ARMOUR, loc,
                   r, h, mat, rotation=rot, vertices=10)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    cap = kit.cyl(parts, name + '.canister.cap', kit.ROLE_TRIM,
                  _add(loc, d, h * 0.42), r * 0.78, 0.10, mat,
                  rotation=rot, vertices=10)
    if cap:
        objs.append(cap)
    return objs


def ranging_vane(parts, name, mat, loc, reach=None, facing='starboard',
                 detail=3):
    """Thin lateral ranging vane. Survey function, not a decorative fin.

    FACING: the vane reaches that way. ``loc`` is the vane centre.
    Thickness stays ``sf.RANGING_VANE[0]``. Grow ``reach`` with class.

    Detail: 0/1 = vane; 2+ = + a root block that overlaps the host.
    """
    if reach is None:
        reach = sf.RANGING_VANE[2]
    reach = max(float(reach), 0.40)
    thick = max(sf.RANGING_VANE[0], 0.10)
    wide = max(sf.RANGING_VANE[1], 0.24)
    size = _axis_size(reach, thick, wide, facing)
    objs = []
    vane = kit.chamfer_block(parts, name + '.ranging-vane', kit.ROLE_ARMOUR,
                             loc, size, mat,
                             chamfer=min(size[0], size[1]) * 0.16)
    if vane:
        objs.append(vane)
    if detail < 2:
        return objs
    d = _dir(facing)
    root = _axis_size(0.28, thick + 0.06, wide * 0.70, facing)
    block = kit.box(parts, name + '.ranging-vane.root', kit.ROLE_HULL,
                    _add(loc, d, -reach * 0.38), root, mat)
    if block:
        objs.append(block)
    return objs


def docking_collar(parts, glow, name, hull_mat, glow_mat, loc,
                   facing='nose', detail=3):
    """Fleet docking / impound collar. Bore is HUMAN.collarR = 0.62.

    FACING: the mouth looks that way. ``loc`` is the ring centre.
    One fleet diameter for the whole Combine. Backing flange overlaps
    the host by ≥ 0.10.

    Detail: 0/1 = flange + ring; 2+ = + bore recess; 3 = + lip lamp.
    """
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    r = max(sf.COLLAR_BORE, 0.40)
    ft = max(sf.COLLAR_FLANGE_T, 0.12)
    objs = []
    flange = kit.cyl(parts, name + '.dock-collar.flange', kit.ROLE_ARMOUR,
                     loc, r + 0.16, ft, hull_mat, rotation=rot, vertices=12)
    if flange:
        objs.append(flange)
    ring = kit.torus(parts, name + '.dock-collar.ring', kit.ROLE_HULL,
                     _add(loc, d, 0.04), r, 0.10, hull_mat, rotation=rot)
    if ring:
        objs.append(ring)
    if detail < 2:
        return objs
    bore = kit.cyl(parts, name + '.dock-collar.bore', kit.ROLE_RECESS,
                   _add(loc, d, 0.02), r * 0.72, 0.12, hull_mat,
                   rotation=rot, vertices=12)
    if bore:
        objs.append(bore)
    if detail < 3:
        return objs
    lamp = kit.box(glow, name + '.navigation-light.collar', kit.ROLE_RECESS,
                   _add(loc, (0.0, 1.0, 0.0), r * 0.55),
                   sf.MARKER_LAMP, glow_mat)
    if lamp:
        objs.append(_glow_tag(lamp))
    return objs


def survey_drone(parts, glow, name, hull_mat, glow_mat, loc, detail=3):
    """Flush hexagonal survey drone. Escorts in the plate are this mass.

    FACING: box axes follow ship axes. ``loc`` is the drone centre.
    Size is ``sf.SURVEY_DRONE``. Seat it so the body laps a flank recess.

    Detail: 0/1 = hull; 2+ = + optic; 3 = + glow iris.
    """
    sx, sy, sz = sf.SURVEY_DRONE
    sx = max(sx, 0.28)
    sy = max(sy, 0.20)
    sz = max(sz, 0.28)
    objs = []
    body = kit.chamfer_block(parts, name + '.survey-drone', kit.ROLE_HULL,
                             loc, (sx, sy, sz), hull_mat,
                             chamfer=min(sx, sy) * 0.24)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    optic = kit.box(parts, name + '.survey-drone.optic', kit.ROLE_RECESS,
                    (loc[0], loc[1], loc[2] - sz * 0.28),
                    (sx * 0.42, sy * 0.28, 0.10), hull_mat)
    if optic:
        objs.append(optic)
    if detail < 3:
        return objs
    iris = kit.box(glow, name + '.survey-drone.iris', kit.ROLE_RECESS,
                   (loc[0], loc[1], loc[2] - sz * 0.30),
                   (sx * 0.22, sy * 0.14, 0.06), glow_mat)
    if iris:
        objs.append(_glow_tag(iris))
    return objs


def evidence_locker(parts, name, mat, loc, detail=3):
    """Cutter evidence locker. Serialized box, ROLE_ARMOUR.

    FACING: box axes follow ship axes. ``loc`` is the locker centre.
    Size is ``sf.EVIDENCE_LOCKER``. Repeat along the spine; do not scale.

    Detail: 0/1 = box; 2+ = + door plate.
    """
    sx, sy, sz = sf.EVIDENCE_LOCKER
    sx = max(sx, 0.24)
    sy = max(sy, 0.24)
    sz = max(sz, 0.28)
    objs = []
    body = kit.box(parts, name + '.locker', kit.ROLE_ARMOUR,
                   loc, (sx, sy, sz), mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    door = kit.box(parts, name + '.locker.door', kit.ROLE_RECESS,
                   (loc[0], loc[1], loc[2] + sz * 0.42),
                   (sx * 0.72, sy * 0.62, 0.08), mat)
    if door:
        objs.append(door)
    return objs


def sample_vault(parts, name, mat, loc, detail=3):
    """Protected sample vault. ROLE_ARMOUR over a graphite core.

    FACING: box axes follow ship axes. ``loc`` is the vault centre.
    Size is ``sf.SAMPLE_VAULT``.

    Detail: 0/1 = mass; 2+ = + alloy cap; 3 = + hairline trim.
    """
    sx, sy, sz = sf.SAMPLE_VAULT
    sx = max(sx, 0.40)
    sy = max(sy, 0.32)
    sz = max(sz, 0.40)
    objs = []
    core = kit.chamfer_block(parts, name + '.vault', kit.ROLE_HULL,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.12)
    if core:
        objs.append(core)
    if detail < 2:
        return objs
    cap = kit.box(parts, name + '.vault.cap', kit.ROLE_ARMOUR,
                  (loc[0], loc[1] + sy * 0.38, loc[2]),
                  (sx * 0.82, max(sy * 0.28, 0.12), sz * 0.82), mat)
    if cap:
        objs.append(cap)
    if detail < 3:
        return objs
    ht = max(sf.HAIRLINE_T, 0.08)
    trim = kit.box(parts, name + '.vault.trim', kit.ROLE_TRIM,
                   (loc[0], loc[1] + sy * 0.48, loc[2]),
                   (sx * 0.70, ht, sz * 0.70), mat)
    if trim:
        objs.append(trim)
    return objs


def cradle_wing(parts, name, mat, loc, reach=None, facing='starboard',
                detail=3):
    """§G2 outline-breaker: one cargo-cradle fork arm.

    FACING: the arm reaches that way. ``loc`` is the wing centre.
    Default ``reach`` is ``sf.CRADLE_WING_REACH`` (2.40) ≥ 1.65. Grow
    ``reach`` with class. Thickness stays ``sf.CRADLE_WING_T`` — never
    inflate it as the scale cue. Structural: survives the 0.06 voxel.

    Detail: 0/1 = arm; 2 = + tip pad; 3 = + root block.
    """
    if reach is None:
        reach = sf.CRADLE_WING_REACH
    reach = max(float(reach), 0.40)
    thick = max(sf.CRADLE_WING_T, 0.18)
    wide = max(sf.CRADLE_WING_W, 0.32)
    size = _axis_size(reach, thick, wide, facing)
    d = _dir(facing)
    objs = []
    arm = kit.chamfer_block(parts, name + '.cradle', kit.ROLE_ARMOUR,
                            loc, size, mat,
                            chamfer=min(size[1], size[2]) * 0.12
                            if abs(d[0]) >= 0.7
                            else min(size[0], size[1]) * 0.12)
    if arm:
        objs.append(arm)
    if detail < 2:
        return objs
    pad = _axis_size(max(wide * 0.70, 0.28), thick + 0.06, wide * 0.85, facing)
    tip = kit.box(parts, name + '.cradle.pad', kit.ROLE_HULL,
                  _add(loc, d, reach * 0.38), pad, mat)
    if tip:
        objs.append(tip)
    if detail < 3:
        return objs
    root = _axis_size(0.36, thick + 0.08, wide * 0.90, facing)
    block = kit.box(parts, name + '.cradle.root', kit.ROLE_HULL,
                    _add(loc, d, -reach * 0.40), root, mat)
    if block:
        objs.append(block)
    return objs


def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.50, detail=3):
    """Countable nozzle group 2/4/6/8 on a graphite housing. Grid, not a row.

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
                             hull_mat, chamfer=min(hw, hh) * 0.18)
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


def tug_dock(parts, name, mat, loc, facing='stern', detail=3):
    """Tug capture pad. Freighter / heavy authors place several.

    FACING: the mouth looks that way. ``loc`` is the pad centre.
    Size is ``sf.TUG_DOCK``. Bore is smaller than the fleet collar.

    Detail: 0/1 = pad; 2+ = + ring.
    """
    d = _dir(facing)
    rot = _cyl_rot(facing, d)
    sx, sy, sz = sf.TUG_DOCK
    sx = max(sx, 0.36)
    sy = max(sy, 0.24)
    sz = max(sz, 0.36)
    objs = []
    pad = kit.chamfer_block(parts, name + '.tug-dock', kit.ROLE_ARMOUR,
                            loc, (sx, sy, sz), mat,
                            chamfer=min(sx, sy) * 0.14)
    if pad:
        objs.append(pad)
    if detail < 2:
        return objs
    ring = kit.cyl(parts, name + '.tug-dock.ring', kit.ROLE_HULL,
                   _add(loc, d, min(sx, sy, sz) * 0.28),
                   min(sx, sy) * 0.28, 0.12, mat, rotation=rot, vertices=10)
    if ring:
        objs.append(ring)
    return objs


def ore_silo(parts, name, mat, loc, detail=3):
    """Vertical ore silo. ROLE_ARMOUR. Name contains silo.

    FACING: cylinder stands along +Y. ``loc`` is the silo centre.
    Radius ``sf.ORE_SILO_R``, height ``sf.ORE_SILO_H``. Absolute.

    Detail: 0/1 = drum; 2+ = + foot ring.
    """
    r = max(sf.ORE_SILO_R, 0.20)
    h = max(sf.ORE_SILO_H, 0.60)
    objs = []
    body = kit.cyl(parts, name + '.silo', kit.ROLE_ARMOUR, loc,
                   r, h, mat, rotation=sf.CYL_ALONG_Y, vertices=12)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    foot = kit.cyl(parts, name + '.silo.foot', kit.ROLE_HULL,
                   (loc[0], loc[1] - h * 0.42, loc[2]),
                   r + 0.08, 0.14, mat, rotation=sf.CYL_ALONG_Y, vertices=12)
    if foot:
        objs.append(foot)
    return objs


def refinery_drum(parts, name, mat, loc, facing='z', detail=3):
    """Refinery process drum. ROLE_ARMOUR. Name contains drum.

    FACING: ``z`` lies along ship Z, ``x`` along X, ``y`` along Y.
    ``loc`` is the drum centre. Radius ``sf.REFINERY_DRUM_R``.

    Detail: 0/1 = drum; 2+ = + end cap.
    """
    r = max(sf.REFINERY_DRUM_R, 0.18)
    h = max(sf.REFINERY_DRUM_H, 0.50)
    if facing == 'x':
        rot = sf.CYL_ALONG_X
        cap_d = (1.0, 0.0, 0.0)
    elif facing == 'y':
        rot = sf.CYL_ALONG_Y
        cap_d = (0.0, 1.0, 0.0)
    else:
        rot = sf.CYL_ALONG_Z
        cap_d = (0.0, 0.0, 1.0)
    objs = []
    body = kit.cyl(parts, name + '.drum', kit.ROLE_ARMOUR, loc,
                   r, h, mat, rotation=rot, vertices=12)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    cap = kit.cyl(parts, name + '.drum.cap', kit.ROLE_HULL,
                  _add(loc, cap_d, h * 0.42), r + 0.04, 0.12, mat,
                  rotation=rot, vertices=12)
    if cap:
        objs.append(cap)
    return objs


def claim_module(parts, name, mat, loc, detail=3):
    """Detachable claim / cargo module. ROLE_ARMOUR. Nested in an open bay.

    FACING: box axes follow ship axes. ``loc`` is the module centre.
    Default size is ``sf.CLAIM_MODULE``. A pad pierces a host face so
    the island probe sees one body, not a nested shell.

    Detail: 0/1 = mass; 2+ = + pad; 3 = + hatch.
    """
    sx, sy, sz = sf.CLAIM_MODULE
    sx = max(sx, 0.40)
    sy = max(sy, 0.32)
    sz = max(sz, 0.48)
    objs = []
    body = kit.chamfer_block(parts, name + '.claim-module', kit.ROLE_ARMOUR,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.14)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    pad = kit.box(parts, name + '.claim-module.pad', kit.ROLE_HULL,
                  (loc[0], loc[1] - sy * 0.48, loc[2]),
                  (sx * 0.70, 0.16, sz * 0.70), mat)
    if pad:
        objs.append(pad)
    if detail < 3:
        return objs
    hatch = kit.box(parts, name + '.claim-module.hatch', kit.ROLE_RECESS,
                    (loc[0], loc[1] + sy * 0.38, loc[2]),
                    (sf.TRANSFER_HATCH[0], 0.08, sf.TRANSFER_HATCH[1]), mat)
    if hatch:
        objs.append(hatch)
    return objs


def nested_scout(parts, name, mat, loc, detail=3):
    """Docked scout mass for an open cradle / hangar (G5).

    FACING: nose toward −Z. ``loc`` is the craft centre. Size is
    ``sf.NESTED_SCOUT``. A pad runs through the host wall face.

    Detail: 0/1 = hull; 2+ = + pad; 3 = + canopy recess.
    """
    sx, sy, sz = sf.NESTED_SCOUT
    sx = max(sx, 0.40)
    sy = max(sy, 0.24)
    sz = max(sz, 0.60)
    objs = []
    body = kit.taper_block(parts, name + '.nested-scout', kit.ROLE_HULL,
                           loc, (sx, sy, sz), mat,
                           front=(0.55, 0.70), back=(1.0, 1.0))
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    pad = kit.box(parts, name + '.nested-scout.pad', kit.ROLE_ARMOUR,
                  (loc[0], loc[1] - sy * 0.42, loc[2]),
                  (sx * 0.62, 0.14, sz * 0.55), mat)
    if pad:
        objs.append(pad)
    if detail < 3:
        return objs
    canopy = kit.box(parts, name + '.nested-scout.canopy', kit.ROLE_RECESS,
                     (loc[0], loc[1] + sy * 0.28, loc[2] - sz * 0.18),
                     (sx * 0.36, 0.10, sz * 0.22), mat)
    if canopy:
        objs.append(canopy)
    return objs


def navigation_light(parts, glow, name, hull_mat, glow_mat, loc, detail=3):
    """Green nav / marker lamp. Name contains navigation-light.

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
