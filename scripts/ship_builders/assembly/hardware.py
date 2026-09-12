"""Assembly equipment: optics, booms, the report dish, drive, radiators, daughters.

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
import bmesh
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


# ===========================================================================
# Survey-probe lineage hardware (2026-09 redesign)
# ===========================================================================

def _bl_local(ship_xyz):
    """Ship-space local offset -> Blender local offset (x, -z, y)."""
    x, y, z = ship_xyz
    return (x, -z, y)


def report_dish(parts, name, hull_mat, loc, radius, hole_r, gores=12,
                detail=3, seed=1, depth=None, thick=None):
    """THE REPORT DISH: an annular high-gain paraboloid facing home (+Z).

    ``loc`` is the rim-plane centre on the drive axis. The bowl is concave
    toward the stern; its vertex sits ``depth`` forward of the rim. The
    hole of radius ``hole_r`` is where the drive fires through — the
    caller buries that inner ring inside a neck tube so the sheet crosses
    a solid and the island probe reads one body.

    The bowl is a closed shell ``thick`` deep (>= 0.06 voxel), gored into
    ``gores`` flat sectors; one gore is re-fabricated in orange (ACCENT).
    A rim bead (TRIM) and charcoal back ribs (HULL) come in at detail 2.

    Detail: 0 = 3-ring bowl; 1 = 3-ring bowl + orange gore; 2 = 4 rings,
    rim bead, half the ribs; 3 = 6 rings, all ribs.
    """
    R = max(radius, 0.30)
    h = min(max(hole_r, 0.06), R * 0.6)
    if depth is None:
        depth = R * sf.DISH_DEPTH_RATIO
    if thick is None:
        thick = sf.DISH_THICK
    g = max(6, int(gores))
    n = 6 if detail >= 3 else (4 if detail == 2 else 3)
    rand = kit.rng(int(seed) & 0xFFFFFFFF)
    twist = (rand() - 0.5) * 0.10

    def zr(r):
        return -depth * (1.0 - (r / R) ** 2)

    radii = [h + (R - h) * i / float(n) for i in range(n + 1)]
    angles = [2.0 * math.pi * k / g + twist for k in range(g)]
    objs = []

    bm = bmesh.new()
    front = []
    back = []
    for r in radii:
        fr = []
        br = []
        for a in angles:
            x = r * math.cos(a)
            y = r * math.sin(a)
            fr.append(bm.verts.new(_bl_local((x, y, zr(r)))))
            br.append(bm.verts.new(_bl_local((x, y, zr(r) - thick))))
        front.append(fr)
        back.append(br)
    for i in range(n):
        for k in range(g):
            k2 = (k + 1) % g
            bm.faces.new((front[i][k], front[i][k2], front[i + 1][k2], front[i + 1][k]))
            bm.faces.new((back[i + 1][k], back[i + 1][k2], back[i][k2], back[i][k]))
    for k in range(g):
        k2 = (k + 1) % g
        bm.faces.new((front[0][k2], front[0][k], back[0][k], back[0][k2]))
        bm.faces.new((front[n][k], front[n][k2], back[n][k2], back[n][k]))
    bowl = kit._bmesh_finish(bm, name + '.report-dish', kit.ROLE_ARMOUR, loc,
                             hull_mat, parts)
    if bowl:
        objs.append(bowl)

    if detail >= 1:
        kg = int(rand() * g) % g
        a0 = angles[kg]
        a1 = angles[kg + 1] if kg + 1 < g else angles[0] + 2.0 * math.pi
        bm = bmesh.new()
        fr = []
        br = []
        for r in radii:
            fr.append([bm.verts.new(_bl_local((r * math.cos(a), r * math.sin(a), zr(r) + 0.04)))
                       for a in (a0, a1)])
            br.append([bm.verts.new(_bl_local((r * math.cos(a), r * math.sin(a), zr(r) - 0.04)))
                       for a in (a0, a1)])
        for i in range(n):
            bm.faces.new((fr[i][0], fr[i][1], fr[i + 1][1], fr[i + 1][0]))
            bm.faces.new((br[i + 1][0], br[i + 1][1], br[i][1], br[i][0]))
            bm.faces.new((fr[i][0], fr[i + 1][0], br[i + 1][0], br[i][0]))
            bm.faces.new((fr[i + 1][1], fr[i][1], br[i][1], br[i + 1][1]))
        bm.faces.new((fr[0][1], fr[0][0], br[0][0], br[0][1]))
        bm.faces.new((fr[n][0], fr[n][1], br[n][1], br[n][0]))
        gore = kit._bmesh_finish(bm, name + '.orange-gore', kit.ROLE_ACCENT,
                                 loc, hull_mat, parts)
        if gore:
            objs.append(gore)

    if detail >= 2:
        rim = kit.torus(parts, name + '.rim', kit.ROLE_TRIM,
                        (loc[0], loc[1], loc[2] - thick * 0.5),
                        R + 0.01, sf.DISH_RIM_MINOR, hull_mat,
                        rotation=sf.CYL_ALONG_Z)
        if rim:
            objs.append(rim)
        step = 1 if detail >= 3 else 2
        for k in range(0, g, step):
            a = angles[k] + math.pi / g
            ca, sa = math.cos(a), math.sin(a)
            r0 = h + 0.02
            p0 = (loc[0] + r0 * ca, loc[1] + r0 * sa, loc[2] + zr(r0) - thick - 0.02)
            r1 = R - 0.06
            p1 = (loc[0] + r1 * ca, loc[1] + r1 * sa, loc[2] + zr(r1) - thick - 0.02)
            rib = kit.strut(parts, '%s.rib.%02d' % (name, k), kit.ROLE_HULL,
                            p0, p1, hull_mat, sf.DISH_RIB_R, vertices=6)
            if rib:
                objs.append(rib)
    return objs


def _nozzle_layout(n, ring_r):
    """(x, y) offsets for n nozzles inside a circle of radius ring_r."""
    if n <= 1:
        return [(0.0, 0.0)]
    if n == 2:
        return [(-ring_r * 0.55, 0.0), (ring_r * 0.55, 0.0)]
    if n == 4:
        d = ring_r * 0.55
        return [(-d, -d), (d, -d), (-d, d), (d, d)]
    out = []
    for i in range(n):
        a = 2.0 * math.pi * i / n + math.pi / n
        out.append((ring_r * 0.66 * math.cos(a), ring_r * 0.66 * math.sin(a)))
    return out


def stern_cluster(parts, glow, name, hull_mat, glow_mat, z0, z1, half_w, half_h,
                  nozzles, dish_r, z_rim, detail=3, seed=1, gores=12,
                  x=0.0, y=0.0):
    """Drive housing + neck tube + report dish + countable nozzle group.

    The housing (charcoal chamfer block) runs z0..z1 and buries its forward
    0.12 in the caller's stern can or spine. A solid neck tube grows aft
    from the housing to the dish vertex; the dish's inner ring is buried in
    that tube. Nozzle bells run from inside the housing to 0.10 short of
    the rim plane, so they show through the dish aperture from astern, and
    each carries a glow disc at its exit plane (the driver's engine flare
    sits just aft of that).

    Detail: nozzle count full at >= 2, half at 1 (min 1), min(n, 2) at 0;
    skirts at >= 2. Dish detail follows ``detail``.
    """
    objs = []
    hw_ = max(half_w, 0.24)
    hh_ = max(half_h, 0.20)
    hous = kit.chamfer_block(parts, name + '.housing', kit.ROLE_HULL,
                             (x, y, (z0 + z1) * 0.5),
                             (hw_ * 2.0, hh_ * 2.0, max(0.30, z1 - z0)),
                             hull_mat, chamfer=min(hw_, hh_) * 0.22)
    if hous:
        objs.append(hous)
    neck_r = max(0.20, min(hw_, hh_) * 0.62)
    hole_r = max(0.10, neck_r - 0.08)
    depth = dish_r * sf.DISH_DEPTH_RATIO
    z_vertex = z_rim - depth * (1.0 - (hole_r / dish_r) ** 2)
    n0 = z1 - 0.12
    n1 = max(z_vertex + 0.14, n0 + 0.30)
    neck = kit.cyl(parts, name + '.neck', kit.ROLE_HULL,
                   (x, y, (n0 + n1) * 0.5), neck_r, n1 - n0, hull_mat,
                   rotation=sf.CYL_ALONG_Z, vertices=12)
    if neck:
        objs.append(neck)
    objs.extend(report_dish(parts, name + '.dish', hull_mat, (x, y, z_rim),
                            dish_r, hole_r, gores=gores, detail=detail,
                            seed=seed))
    n = nozzles
    if detail == 1:
        n = max(1, nozzles // 2)
    elif detail <= 0:
        n = min(nozzles, 2)
    layout = _nozzle_layout(n, neck_r * 0.90)
    if n <= 1:
        rn = neck_r * 0.55
    elif n == 2:
        rn = neck_r * 0.36
    elif n <= 4:
        rn = neck_r * 0.30
    else:
        rn = neck_r * 0.22
    z_exit = z_rim - 0.10
    b0 = z1 - 0.10
    blen = max(0.30, z_exit - b0)
    for i, (ox, oy) in enumerate(layout):
        cx = x + ox
        cy = y + oy
        bell = kit.cyl(parts, '%s.bell.%d' % (name, i), kit.ROLE_HULL,
                       (cx, cy, b0 + blen * 0.5), rn, blen, hull_mat,
                       rotation=sf.CYL_ALONG_Z, vertices=10)
        if bell:
            objs.append(bell)
        if detail >= 2:
            sk_len = max(0.12, blen * 0.22)
            skirt = kit.cyl(parts, '%s.skirt.%d' % (name, i), kit.ROLE_RECESS,
                            (cx, cy, z_exit - sk_len * 0.5), rn * sf.NOZZLE_SKIRT,
                            sk_len, hull_mat, rotation=sf.CYL_ALONG_Z,
                            vertices=10)
            if skirt:
                objs.append(skirt)
        disc_r = rn * (sf.NOZZLE_SKIRT if detail >= 2 else 1.0) * 0.92
        disc = kit.cyl(glow, '%s.disc.%d' % (name, i), kit.ROLE_RECESS,
                       (cx, cy, z_exit + 0.005), disc_r, 0.05, glow_mat,
                       rotation=sf.CYL_ALONG_Z, vertices=10)
        if disc:
            objs.append(_glow_tag(disc))
    return objs


def survey_boom(parts, glow, name, hull_mat, glow_mat, root, length,
                detail=3, seed=1):
    """One forward survey boom (magnetometer / RTG): thin shaft along -Z,
    segment collars, an instrument head and a teal tip marker.

    ``root`` is buried >= 0.20 inside the survey head can by the caller.
    Detail: 0 = shaft; 1 = + head box; 2 = + collars; 3 = + tip marker.
    """
    ln = max(length, 0.40)
    rx, ry, rz = root
    tip = (rx, ry, rz - ln)
    objs = []
    shaft = kit.strut(parts, name + '.boom', kit.ROLE_TRIM, root, tip,
                      hull_mat, sf.BOOM_R, vertices=6)
    if shaft:
        objs.append(shaft)
    if detail >= 1:
        bw, bh, bd = sf.BOOM_TIP_BOX
        head = kit.box(parts, name + '.boom-head', kit.ROLE_HULL,
                       (rx, ry, rz - ln + bd * 0.5 - 0.02), (bw, bh, bd),
                       hull_mat)
        if head:
            objs.append(head)
    if detail >= 2:
        n = max(1, int(ln / 0.9))
        for i in range(n):
            cz = rz - ln * (i + 0.5) / n
            col = kit.cyl(parts, '%s.collar.%d' % (name, i), kit.ROLE_HULL,
                          (rx, ry, cz), sf.BOOM_COLLAR_R, 0.10, hull_mat,
                          rotation=sf.CYL_ALONG_Z, vertices=8)
            if col:
                objs.append(col)
    if detail >= 3:
        mk = kit.sphere(glow, name + '.tip', kit.ROLE_RECESS,
                        (rx, ry, rz - ln - 0.02),
                        (sf.BOOM_TIP_R, sf.BOOM_TIP_R, sf.BOOM_TIP_R),
                        glow_mat, segments=8)
        if mk:
            objs.append(_glow_tag(mk))
    return objs


def boom_set(parts, glow, name, hull_mat, glow_mat, head_loc, head_r, head_z0,
             lengths, detail=3, seed=1):
    """Two to four survey booms of UNEQUAL length rooted in the head can.

    Booms fan around the can axis at a radius of 0.45 * head_r. ``head_z0``
    is the can's forward face; roots bury 0.30 behind it. Detail >= 1 builds
    every boom; detail 0 builds the longest only.
    """
    objs = []
    n = len(lengths)
    use = lengths if detail >= 1 else lengths[:1]
    rand = kit.rng(int(seed) & 0xFFFFFFFF)
    for i, ln in enumerate(use):
        a = math.pi * 0.5 + 2.0 * math.pi * i / max(n, 1) + (rand() - 0.5) * 0.2
        rr = head_r * 0.45
        root = (head_loc[0] + math.cos(a) * rr, head_loc[1] + math.sin(a) * rr,
                head_z0 + 0.30)
        objs.extend(survey_boom(parts, glow, '%s.%d' % (name, i), hull_mat,
                                glow_mat, root, ln + 0.30, detail=detail,
                                seed=seed + i))
    return objs


def radiator_set(parts, name, mat, loc, seat_r, length, reach, count=2,
                 detail=3):
    """Flat charcoal radiator panels beside the reactor (G3).

    ``loc`` is the panel-set centre on the axis; ``seat_r`` is the host
    can's apothem, panels bury 0.15 inside it. ``count`` 2 = dorsal and
    ventral; 4 = a cross. Each slab is 0.10 thick, ``reach`` tall and
    ``length`` long, with one faded-orange edge strip. Always built — a
    radiator is an outline mass.
    """
    objs = []
    dirs = [(0.0, 1.0), (0.0, -1.0)]
    if count >= 4:
        dirs += [(1.0, 0.0), (-1.0, 0.0)]
    for i, (dx, dy) in enumerate(dirs):
        dist = seat_r - 0.15 + reach * 0.5
        c = (loc[0] + dx * dist, loc[1] + dy * dist, loc[2])
        if abs(dx) > 0.5:
            size = (reach, 0.10, length)
            esz = (0.10, 0.14, length)
            e = (loc[0] + dx * (seat_r - 0.15 + reach - 0.05), loc[1], loc[2])
        else:
            size = (0.10, reach, length)
            esz = (0.14, 0.10, length)
            e = (loc[0], loc[1] + dy * (seat_r - 0.15 + reach - 0.05), loc[2])
        panel = kit.box(parts, '%s.radiator.%d' % (name, i), kit.ROLE_HULL,
                        c, size, mat)
        if panel:
            objs.append(panel)
        if detail >= 2:
            edge = kit.box(parts, '%s.radiator-edge.%d' % (name, i),
                           kit.ROLE_ACCENT, e, esz, mat)
            if edge:
                objs.append(edge)
    return objs


def manipulator_arm(parts, name, mat, root, elbow, tip, detail=3):
    """Two-segment contact arm with an elbow joint and a claw head.

    ``root`` is buried inside a can by the caller. Detail: 0 = both
    segments + claw; 1+ = + elbow sphere.
    """
    objs = []
    s1 = kit.strut(parts, name + '.arm-a', kit.ROLE_TRIM, root, elbow, mat,
                   sf.ARM_R, vertices=8)
    s2 = kit.strut(parts, name + '.arm-b', kit.ROLE_TRIM, elbow, tip, mat,
                   sf.ARM_R, vertices=8)
    objs.extend([o for o in (s1, s2) if o])
    cw, ch, cd = sf.ARM_CLAW
    claw = kit.box(parts, name + '.claw', kit.ROLE_HULL, tip, (cw, ch, cd), mat)
    if claw:
        objs.append(claw)
    if detail >= 1:
        el = kit.sphere(parts, name + '.elbow', kit.ROLE_HULL, elbow,
                        (0.12, 0.12, 0.12), mat, segments=8)
        if el:
            objs.append(el)
    return objs


def cradle(parts, name, mat, host_pt, craft_pt, detail=3):
    """Two charcoal struts hanging a nested craft from a host keel.

    ``host_pt`` sits 0.15 inside the host can; ``craft_pt`` 0.15 inside the
    craft's can. Struts are offset ±0.22 along Z. Always built.
    """
    objs = []
    for i, dz in enumerate((-0.22, 0.22)):
        a = (host_pt[0], host_pt[1], host_pt[2] + dz)
        b = (craft_pt[0], craft_pt[1], craft_pt[2] + dz)
        s = kit.strut(parts, '%s.cradle.%d' % (name, i), kit.ROLE_HULL, a, b,
                      mat, 0.08, vertices=6)
        if s:
            objs.append(s)
    return objs


def daughter_craft(parts, glow, name, hull_mat, glow_mat, loc, detail=3,
                   seed=1):
    """The nested light-class daughter: one can, one boom, one report dish.

    ABSOLUTE size (sf.DAUGHTER_*), never scaled by the host. ``loc`` is the
    can centre; the craft's nose tip is 1.75 forward of it and its dish rim
    1.15 aft. Sub-constructs build one detail step below the host so a
    nested craft is always cheaper than the host. Returns (objs, can_r).
    """
    from . import lineage as ln
    d = max(0, detail - 1)
    r = sf.DAUGHTER_CAN_R
    cx, cy, cz = loc
    objs = []
    can, sides = ln.bus_can(parts, name + '.can', hull_mat, (cx, cy, cz), r,
                            0.80, detail=d, seed=seed, rows=1)
    objs.extend(can)
    objs.extend(ln.spine_bar(parts, name, hull_mat, cz + 0.20, cz + 0.85,
                             0.15, x=cx, y=cy))
    objs.extend(stern_cluster(parts, glow, name + '.stern', hull_mat, glow_mat,
                              cz + 0.55, cz + 0.85, 0.28, 0.24, 1,
                              sf.DAUGHTER_DISH_R, cz + 1.15, detail=d,
                              seed=seed + 5, gores=8, x=cx, y=cy))
    if detail >= 1:
        objs.extend(survey_boom(parts, glow, name + '.boom', hull_mat, glow_mat,
                                (cx, cy + 0.12, cz - 0.10), 1.35 + 0.30,
                                detail=d, seed=seed + 9))
        f = ln.top_facet(sides)
        objs.extend(teal_optic(parts, glow, name + '.eye', hull_mat, glow_mat,
                               ln.facet_point((cx, cy, cz), r, sides, f, -0.10),
                               radius=0.16, facing='up', detail=d))
    return objs, r
