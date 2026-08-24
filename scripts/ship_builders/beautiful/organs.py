"""Beautiful Ones organs — functional biology for four body plans.

Bible section 4.6: class read comes from ANATOMY, not equipment. This
module is the working biology: sensory crown, breathing vents, an open
belly cradle, sanctuary and nursery hollows with nested companion craft,
dorsal garden folds, and overlapping muscle mantles. No nozzles, no
windows, no armour, no turrets, no box glow panels, no porthole tori.

THE ANCHOR RULE: organs NEVER query the hull. Every anchor arrives as an
argument the class file computed from surface.py. The only surface import
is the shared absolute living module.

PAINT follows the dual rule in anatomy.py: role tag and name selector
agree. Pearl organs are kit.ROLE_ARMOUR named 'living-…'. Violet nerve
is kit.ROLE_ACCENT named 'nerve-…'. Crown shafts are kit.ROLE_HULL named
'sensory-crown-…'. Hollow wells are kit.ROLE_RECESS. Every emissive is a
glow-list part with obj['skin_role'] = 'glow'.

Size conventions (verified against ship_kit.py):
    kit.sphere  scale is RADII per axis
    kit.cyl     real radius / depth
    kit.strut   real radius between ship-space points; None on zero span
Absolute sf.* sizes go in at their stated values, never halved, never
multiplied by ship l, b or h.

Connectivity: every organ overlaps its host by at least 0.10 of solid
material, or chains to something that does. A nested companion is seated
PIERCING its hollow's mouth plane.

Detail ladder: 3 full, 2 fewer repeats, 1 primary + hints, 0 primary
masses only.

Public API
----------
    sensory_crown(parts, glow, name, hull_mat, glow_mat, loc,
                  forward=(0,0,-1), fan=sf.FILAMENT_FAN, count=8,
                  detail=3, seed=1, arc=None)
    breathing_vents(parts, glow, name, hull_mat, glow_mat, loc,
                    step=(0,0,1), count=4, face='y', detail=3,
                    radius=sf.VENT_R, points=None)
    belly_chamber(parts, glow, name, hull_mat, glow_mat, loc, size, detail=3)
    sanctuary_hollow(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                     face='x', detail=3, seed=1)
    nursery_hollow(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                   face='x', occupants=1, detail=3, seed=None)
    companion_craft(parts, glow, name, hull_mat, glow_mat, loc, length=None,
                    detail=3)
    garden_fold(parts, glow, name, hull_mat, glow_mat, z0, z1, surf, x=0.0,
                detail=3, seed=1)
    dorsal_mantles(parts, name, mat, loc, size, count=3, seed=1, detail=3)
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import surface as sf


_CROWN_CONE = 0.55
_VENT_BOWL = 0.30
_VENT_GLOW = 0.22
_WELL_DEPTH = 0.55
_LIP_PROUD = 0.06
_BOW_DEFAULT = 0.30
_SHAFT_SCALE = 0.5
_MANTLE_RY_MIN = 0.55


def _glow_tag(obj):
    if obj is not None:
        obj['skin_role'] = 'glow'
    return obj


def _out_of(loc, face):
    if face == 'x':
        return (1.0 if loc[0] >= 0.0 else -1.0, 0.0, 0.0)
    return (0.0, 1.0 if loc[1] >= 0.0 else -1.0, 0.0)


def _bezier_quadratic(p0, ctrl, p2, t):
    u = 1.0 - t
    return (u * u * p0[0] + 2.0 * u * t * ctrl[0] + t * t * p2[0],
            u * u * p0[1] + 2.0 * u * t * ctrl[1] + t * t * p2[1],
            u * u * p0[2] + 2.0 * u * t * ctrl[2] + t * t * p2[2])


def _name_seed(name, loc):
    s = 2166136261
    for ch in name:
        s = (s ^ ord(ch)) * 16777619 & 0xFFFFFFFF
    s ^= (int(abs(loc[0]) * 1000) & 0xFFFF)
    s ^= (int(abs(loc[1]) * 1000) & 0xFFFF) << 8
    s ^= (int(abs(loc[2]) * 1000) & 0xFFFF) << 16
    return s & 0xFFFFFFFF


# ===========================================================================
# 1.  SENSORY CROWN
# ===========================================================================
def sensory_crown(parts, glow, name, hull_mat, glow_mat, loc,
                  forward=(0.0, 0.0, -1.0), fan=sf.FILAMENT_FAN, count=8,
                  detail=3, seed=1, arc=None):
    """Fan of fine curved filaments at the head, with luminous tip droplets.

    ``loc`` is given inside the head mass. ``forward`` faces the fan
    (ship -Z is the nose). Detail 0 emits nothing.
    """
    if detail < 1:
        return []
    n = count if detail >= 2 else 4
    fx, fy, fz = forward
    fl = math.sqrt(fx * fx + fy * fy + fz * fz)
    if fl < 1e-6:
        return []
    fx, fy, fz = fx / fl, fy / fl, fz / fl
    if abs(fy) < 0.9:
        ux, uy, uz = -fz, 0.0, fx
    else:
        ux, uy, uz = 1.0, 0.0, 0.0
    ul = math.sqrt(ux * ux + uy * uy + uz * uz)
    ux, uy, uz = ux / ul, uy / ul, uz / ul
    vx, vy, vz = (fy * uz - fz * uy, fz * ux - fx * uz, fx * uy - fy * ux)
    rand = kit.rng(seed)
    objs = []
    lx, ly, lz = loc
    bend_x, bend_y, bend_z = (-fx * 0.3 + (0.0 if abs(fy) >= 0.9 else ux * 0.2),
                               1.0 - abs(fy) * 0.4, -fz * 0.3)
    bend_l = math.sqrt(bend_x * bend_x + bend_y * bend_y + bend_z * bend_z)
    if bend_l > 1e-6:
        bend_x, bend_y, bend_z = bend_x / bend_l, bend_y / bend_l, bend_z / bend_l
    else:
        bend_x, bend_y, bend_z = 0.0, 1.0, 0.0
    for i in range(n):
        ang = 2.0 * math.pi * i / n + rand() * 0.4
        ca, sa = math.cos(ang), math.sin(ang)
        rx = lx + (ux * ca + vx * sa) * fan * 0.4
        ry = ly + (uy * ca + vy * sa) * fan * 0.4
        rz = lz + (uz * ca + vz * sa) * fan * 0.4
        length = sf.FILAMENT_LEN * (0.85 + rand() * 0.30)
        spread = sf.FILAMENT_LEN * _CROWN_CONE
        tip_x = lx + fx * length + (ux * ca + vx * sa) * spread
        tip_y = ly + fy * length + (uy * ca + vy * sa) * spread
        tip_z = lz + fz * length + (uz * ca + vz * sa) * spread
        bow = length * (_BOW_DEFAULT if arc is None else arc)
        bow *= 0.8 + rand() * 0.4
        bend_var = rand() * 0.5 - 0.25
        ctrl_x = (rx + tip_x) * 0.5 + (bend_x + bend_var * (1.0 - abs(fy))) * bow * 2.0
        ctrl_y = (ry + tip_y) * 0.5 + (bend_y + bend_var * (1.0 - abs(fy))) * bow * 2.0
        ctrl_z = (rz + tip_z) * 0.5 + (bend_z + bend_var * (1.0 - abs(fy))) * bow * 2.0
        segs = 4
        pts = [(rx, ry, rz)]
        for s in range(1, segs + 1):
            t = s / segs
            pts.append(_bezier_quadratic((rx, ry, rz), (ctrl_x, ctrl_y, ctrl_z),
                                          (tip_x, tip_y, tip_z), t))
        prev = pts[0]
        for s in range(1, len(pts)):
            cur = pts[s]
            seg_len = math.sqrt((cur[0] - prev[0]) ** 2 + (cur[1] - prev[1]) ** 2
                                + (cur[2] - prev[2]) ** 2)
            if seg_len < 1e-6:
                continue
            t_mid = (s - 0.5) / segs
            r = sf.FILAMENT_R * _SHAFT_SCALE * (1.0 - 0.35 * t_mid)
            fil = kit.strut(parts, 'sensory-crown-%s.f%02d.s%02d' % (name, i, s - 1),
                            kit.ROLE_HULL, prev, cur, hull_mat, radius=r,
                            vertices=6)
            if fil is not None:
                objs.append(fil)
            prev = cur
        tip = kit.sphere(glow, 'sensory-crown-%s.t%02d' % (name, i),
                         'glow', (tip_x, tip_y, tip_z), (0.05, 0.05, 0.05),
                         glow_mat, segments=8 if detail >= 3 else 6)
        if tip is not None:
            objs.append(_glow_tag(tip))
    return objs


# ===========================================================================
# 2.  BREATHING VENTS — grown lips, not porthole tori
# ===========================================================================
def breathing_vents(parts, glow, name, hull_mat, glow_mat, loc,
                    step=(0.0, 0.0, 1.0), count=4, face='y', detail=3,
                    radius=sf.VENT_R, points=None):
    """Row of breathing vents at absolute sf.VENT_R.

    Each vent is a dark bowl ellipsoid, an irregular grown lip, and (at
    detail 3) a breath glow inside the mouth. Pass ``points`` sampled
    from sf.top_y / sf.bottom_y / sf.flank_x. Skip at detail 0.
    """
    if detail < 1:
        return []
    if points is not None:
        centres = [tuple(p) for p in points]
    else:
        centres = [(loc[0] + step[0] * i, loc[1] + step[1] * i,
                    loc[2] + step[2] * i) for i in range(count)]
    if detail < 2:
        centres = centres[:max(1, len(centres) // 2)]
    if not centres:
        return []
    ox, oy, oz = _out_of(centres[0], face)
    bowl_r = radius * _VENT_BOWL
    objs = []
    for i, (cx, cy, cz) in enumerate(centres):
        bx = cx - ox * bowl_r
        by = cy - oy * bowl_r
        bz = cz - oz * bowl_r
        if face == 'y':
            bscale = (radius, bowl_r, radius)
            axis_u = (radius * 0.95, 0.0, 0.0)
            axis_v = (0.0, 0.0, radius * 0.95)
        else:
            bscale = (bowl_r, radius, radius)
            axis_u = (0.0, radius * 0.95, 0.0)
            axis_v = (0.0, 0.0, radius * 0.95)
        bowl = kit.sphere(parts, '%s.bowl%02d' % (name, i), kit.ROLE_RECESS,
                          (bx, by, bz), bscale, hull_mat,
                          segments=12 if detail >= 3 else 8)
        if bowl is not None:
            objs.append(bowl)
        if detail >= 2:
            objs.extend(an.grown_lip(parts, '%s.v%02d' % (name, i), hull_mat,
                                     (cx, cy, cz), axis_u, axis_v,
                                     (ox, oy, oz), count=8, bead_r=0.09,
                                     seed=11 + i, detail=detail,
                                     role=kit.ROLE_HULL))
        if detail >= 3:
            gr = radius * _VENT_GLOW
            gx = cx - ox * (gr - 0.01)
            gy = cy - oy * (gr - 0.01)
            gz = cz - oz * (gr - 0.01)
            gb = kit.sphere(glow, '%s.breath%02d' % (name, i), 'glow',
                            (gx, gy, gz), (gr, gr, gr), glow_mat, segments=8)
            if gb is not None:
                objs.append(_glow_tag(gb))
    return objs


# ===========================================================================
# 3.  BELLY CHAMBER — open cradle, not a mouth with teeth
# ===========================================================================
def belly_chamber(parts, glow, name, hull_mat, glow_mat, loc, size, detail=3):
    """Swollen ventral pouch with an open cradle. No teeth, no maw.

    The pouch is pearl living tissue. Two lateral nacre pads form the
    cradle walls. A shallow recess is the floor, not a bite. ``loc`` is
    the pouch centre; the caller buries the upper pole >= 0.10 into the
    belly. Primary mass at detail 0.
    """
    sx, sy, sz = size
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
    lx, ly, lz = loc
    objs = []
    pouch = kit.sphere(parts, 'living-belly-%s.pouch' % name, kit.ROLE_ARMOUR,
                       loc, (hx, hy, hz), hull_mat,
                       segments=12 if detail >= 2 else 8)
    if pouch is not None:
        objs.append(pouch)
    if detail < 1:
        return objs
    floor = kit.sphere(parts, 'living-belly-%s.floor' % name, kit.ROLE_RECESS,
                       (lx, ly - hy * 0.35, lz),
                       (hx * 0.55, hy * 0.22, hz * 0.50), hull_mat,
                       segments=10 if detail >= 2 else 8)
    if floor is not None:
        objs.append(floor)
    for s, tag in ((-1.0, 'p'), (1.0, 's')):
        pad = kit.sphere(parts, 'living-belly-%s.cradle-%s' % (name, tag),
                         kit.ROLE_ARMOUR,
                         (lx + s * hx * 0.55, ly - hy * 0.15, lz),
                         (hx * 0.28, hy * 0.38, hz * 0.42), hull_mat,
                         segments=10 if detail >= 2 else 8)
        if pad is not None:
            objs.append(pad)
    if detail >= 3:
        gr = min(hx, hz) * 0.18
        gb = kit.sphere(glow, 'living-belly-%s.breath' % name, 'glow',
                        (lx, ly - hy * 0.20, lz),
                        (gr, gr, gr), glow_mat, segments=8)
        if gb is not None:
            objs.append(_glow_tag(gb))
    return objs


# ===========================================================================
# 4.  SANCTUARY HOLLOW — grown well, no kit.box
# ===========================================================================
def sanctuary_hollow(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                     face='x', detail=3, seed=1):
    """Open hollow where a companion can shelter. Grown irregular lip.

    Dark well is a flattened ellipsoid sunk inboard (not a box). Lip is
    overlapping nacre beads. Breath is a sphere inside the well, not a
    glow panel. ``loc`` is the mouth centre ON the surface.
    """
    if size is None:
        size = sf.HOLLOW
    w, hh, dd = size
    ox, oy, oz = _out_of(loc, face)
    lx, ly, lz = loc
    objs = []
    if face == 'x':
        well_scale = (_WELL_DEPTH * 0.5, hh * 0.5, dd * 0.5)
        well_loc = (lx - ox * _WELL_DEPTH * 0.45, ly, lz)
        axis_u = (0.0, hh * 0.5 + _LIP_PROUD, 0.0)
        axis_v = (0.0, 0.0, dd * 0.5 + _LIP_PROUD)
        glow_scale = (0.12, hh * 0.22, dd * 0.22)
    else:
        well_scale = (w * 0.5, _WELL_DEPTH * 0.5, dd * 0.5)
        well_loc = (lx, ly - oy * _WELL_DEPTH * 0.45, lz)
        axis_u = (w * 0.5 + _LIP_PROUD, 0.0, 0.0)
        axis_v = (0.0, 0.0, dd * 0.5 + _LIP_PROUD)
        glow_scale = (w * 0.22, 0.12, dd * 0.22)
    well = kit.sphere(parts, '%s.well' % name, kit.ROLE_RECESS, well_loc,
                      well_scale, hull_mat,
                      segments=12 if detail >= 2 else 8)
    if well is not None:
        objs.append(well)
    if detail < 1:
        return objs
    objs.extend(an.grown_lip(parts, name, hull_mat, loc, axis_u, axis_v,
                             (ox, oy, oz), count=10, bead_r=0.14, seed=seed,
                             detail=detail))
    if detail >= 2:
        gb = kit.sphere(glow, '%s.breath' % name, 'glow', loc, glow_scale,
                        glow_mat, segments=8)
        if gb is not None:
            objs.append(_glow_tag(gb))
    return objs


# ===========================================================================
# 5.  COMPANION CRAFT — small living body, not a mini-manta
# ===========================================================================
def companion_craft(parts, glow, name, hull_mat, glow_mat, loc, length=None,
                    detail=3):
    """Young living body for a hollow. Fusiform, not a winged manta.

    One swollen fusiform mass plus a short caudal stub. Crown hint at
    detail 3. Sized by ``length``, default sf.COMPANION_LEN. The caller
    seats ``loc`` so the body pierces the hollow mouth by at least 0.10.
    """
    if length is None:
        length = sf.COMPANION_LEN
    lx, ly, lz = loc
    objs = []
    body = kit.sphere(parts, 'living-companion-%s.body' % name,
                      kit.ROLE_ARMOUR, loc,
                      (length * 0.14, length * 0.11, length * 0.38),
                      hull_mat, segments=12 if detail >= 2 else 8)
    if body is not None:
        objs.append(body)
    tail = kit.sphere(parts, 'living-companion-%s.tail' % name,
                      kit.ROLE_ARMOUR,
                      (lx, ly, lz + length * 0.34),
                      (length * 0.07, length * 0.06, length * 0.14),
                      hull_mat, segments=8)
    if tail is not None:
        objs.append(tail)
    if detail >= 2:
        wake = kit.sphere(glow, 'living-companion-%s.wake' % name, 'glow',
                          (lx, ly, lz + length * 0.44),
                          (length * 0.04, length * 0.04, length * 0.04),
                          glow_mat, segments=8)
        if wake is not None:
            objs.append(_glow_tag(wake))
    if detail >= 3:
        for s in (-1.0, 1.0):
            fa = (lx + s * length * 0.04, ly + length * 0.02,
                  lz - length * 0.28)
            fb = (lx + s * length * 0.10, ly + length * 0.05,
                  lz - length * 0.48)
            fil = kit.strut(parts, 'sensory-crown-%s.f%s' % (name, 'p' if s > 0 else 's'),
                            kit.ROLE_ACCENT, fa, fb, hull_mat,
                            radius=sf.FILAMENT_R, vertices=6)
            if fil is not None:
                objs.append(fil)
    return objs


# ===========================================================================
# 6.  NURSERY HOLLOW
# ===========================================================================
def nursery_hollow(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                   face='x', occupants=1, detail=3, seed=None):
    """Sanctuary hollow carrying ``occupants`` nested companion craft."""
    if seed is None:
        seed_val = _name_seed(name, loc)
    else:
        seed_val = seed
    objs = sanctuary_hollow(parts, glow, name, hull_mat, glow_mat, loc,
                            size=size, face=face, detail=detail,
                            seed=seed_val)
    if size is None:
        size = sf.HOLLOW
    dd = size[2]
    ox, oy, oz = _out_of(loc, face)
    sub_detail = max(0, detail - 1)
    for i in range(occupants):
        frac = (i + 0.5) / occupants - 0.5
        cz = loc[2] + frac * dd * 0.8
        cloc = (loc[0] + ox * (sf.COMPANION_LEN * 0.11 - 0.10),
                loc[1] + oy * (sf.COMPANION_LEN * 0.11 - 0.10), cz)
        objs.extend(companion_craft(parts, glow, '%s.n%d' % (name, i),
                                    hull_mat, glow_mat, cloc,
                                    detail=sub_detail))
    return objs


# ===========================================================================
# 7.  GARDEN FOLD
# ===========================================================================
def garden_fold(parts, glow, name, hull_mat, glow_mat, z0, z1, surf, x=0.0,
                detail=3, seed=1):
    """Raised dorsal fold of overlapping garden swells.

    ``surf(z)`` is the back height at offset ``x``. Skip 0.0. Skip the
    whole run at detail 0.
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0:
        return []
    n_swell = 3 if detail >= 3 else (2 if detail >= 2 else 1)
    rand = kit.rng(seed)
    objs = []
    gscale = max(1.0, span / 2.4)
    for i in range(n_swell):
        t = (i + 0.7) / (n_swell + 0.4)
        z = z0 + t * span
        sy = surf(z)
        if sy == 0.0:
            continue
        ry = (0.24 + rand() * 0.06) * gscale
        rz = (0.18 + rand() * 0.06) * gscale
        rx = (0.12 + rand() * 0.04) * gscale
        centre = (x, sy - ry * 0.4, z)
        swell = kit.sphere(parts, '%s.s%02d' % (name, i), kit.ROLE_HULL,
                           centre, (rx, ry, rz), hull_mat,
                           segments=12 if detail >= 3 else 8)
        if swell is not None:
            objs.append(swell)
        if detail < 2:
            continue
        ftop = (x, sy + (0.25 + rand() * 0.12) * gscale, z)
        fmid = (centre[0], centre[1] + ry * 0.7, centre[2])
        fr = kit.strut(parts, '%s.fr%02d' % (name, i), kit.ROLE_HULL,
                       fmid, ftop, hull_mat, radius=0.06 * min(2.4, gscale),
                       vertices=6)
        if fr is not None:
            objs.append(fr)
            tip = kit.sphere(parts, '%s.ft%02d' % (name, i), kit.ROLE_TRIM,
                             ftop, (0.10, 0.12, 0.10), hull_mat, segments=8)
            if tip is not None:
                objs.append(tip)
                if detail >= 3 and rand() < 0.45:
                    bud = kit.sphere(glow, '%s.fb%02d' % (name, i), 'glow',
                                     (ftop[0], ftop[1] + 0.08, ftop[2]),
                                     (0.045, 0.045, 0.045), glow_mat,
                                     segments=8)
                    if bud is not None:
                        objs.append(_glow_tag(bud))
    return objs


# ===========================================================================
# 8.  DORSAL MANTLES — overlapping muscle ellipsoids
# ===========================================================================
def dorsal_mantles(parts, name, mat, loc, size, count=3, seed=1, detail=3):
    """Stacked swollen dorsal muscle masses. Not shell plates.

    ``size`` is FULL extents (w, h, d) of the lowest (largest) mantle.
    ``loc`` buries the first mass >= 0.10 into the hull. Primary mass at
    every detail.
    """
    w, h, d = size
    rx_base = w * 0.5
    ry_base = h * 0.5
    rz_base = d * 0.5
    rand = kit.rng(seed)
    objs = []
    prev_centre = loc
    prev_ry = ry_base
    prev_rz = rz_base
    segments = 20 if detail >= 2 else 12
    for i in range(count):
        scale = 1.0 - i * 0.22
        rx = rx_base * scale
        ry = ry_base * scale
        rz = rz_base * scale
        min_ry = _MANTLE_RY_MIN * rz
        if ry < min_ry:
            ry = min_ry
        if i == 0:
            centre = prev_centre
        else:
            z_drift = (rz + prev_rz) * 0.5 * 0.58
            x_jitter = (rand() - 0.5) * rx * 0.18
            z_jitter = (rand() - 0.5) * rz * 0.10
            dy = prev_ry * 0.16 + ry * 0.06
            centre = (prev_centre[0] + x_jitter,
                      prev_centre[1] + dy,
                      prev_centre[2] + z_drift + z_jitter)
        mantle = kit.sphere(parts, 'living-body-mantle-%s' % chr(97 + i),
                            kit.ROLE_ARMOUR, centre, (rx, ry, rz),
                            mat, segments=segments)
        if mantle is not None:
            objs.append(mantle)
            prev_centre = centre
            prev_ry = ry
            prev_rz = rz
    return objs
