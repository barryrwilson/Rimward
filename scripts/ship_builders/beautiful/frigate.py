"""Beautiful Ones Frigate — TRAVEL-POSE OCTOPUS ELDER.

Bible §4.6: a large calm elder that carries a community. Wave 106 body plan
is OCTOPUS in travel pose, not a whale and not a manta. Mantle / head sits
toward -Z. Eight muscular arms trail toward +Z. The interbrachial web is a
trailing skirt (sanctuary), never a disc in the XY plane.

Plate family (beautiful-frigate-elder-guardian.png) still names an elder
guardian with nested young, a deep crown, and scar history. The silhouette
family is now round mantle + eight trailing arms. No rear rhomboid fins
(squid), no coordinated fin pairs (manta), no long fusiform flank with
hangar holes (whale), no nozzle.

Envelope (driver CLASSES): l = 32.0, b = l * 0.39 = 12.48, h = l * 0.26
= 8.32. Span band [19.20, 44.80]. AUTHORED largest-dimension target is
spanZ ≈ 30 (blunt mantle nose to trailing arm tips). Hull vertex aim
[16 000, 84 000]. Arms use travel_arm_tips(..., spread=0.40, drop=0.22)
so spanX stays modest and spanZ / spanX stays high.

Body plan
---------
One grown_loft bulbous mantle (near-ellipse rings, round sack, not a
fusiform shark). A shallow pearl hood loft rides the upper mantle. Eight
an.octopus_arm tubes trail from a buried hub; tips come from
an.travel_arm_tips. an.interbrachial_web is the trailing skirt under the
arms. Four hollows sit IN that skirt (two forward nurseries with nested
companions, two aft sanctuaries). Deep org.sensory_crown on the forehead.
Three an.healed_scar welts on the port mantle. Stern is arm tips and web
dissolving toward the driver glow at z = +l * 0.47. No nozzle.

LOD ladder
----------
detail=3  mantle, hood, 8 arms with suckers, web, 4 hollows, crown,
          vents, folds, veins, scars, nacre at the arm crown.
detail=2  fewer suckers (anatomy: 3 per arm), fewer vents / veins / crown.
detail=1  mantle, 8 arm tubes, web, hollow wells, crown hint, scars as
          chords. Suckers off (anatomy detail < 2).
detail=0  mantle + 8 arms + web (primary masses). Silhouette never drops
          an arm.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import anatomy as an
from . import organs as org


def _lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t)


def _unit(v, fallback=(0.0, -1.0, 0.0)):
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if n < 1e-8:
        return fallback
    return (v[0] / n, v[1] / n, v[2] / n)


def _glow_tag(obj):
    if obj is not None:
        obj['skin_role'] = 'glow'
    return obj


# ===========================================================================
# STATION LIST — bulbous mantle, nose toward -Z, no long tail loft
# ===========================================================================

def _frigate_stations(l, b, h):
    """Round mantle sack. Blunt nose, fat through the head, short dissolve
    into the arm crown. Does not run to the glow (arms carry the stern).
    """
    return [
        sf.fair(l * -0.470, b * 0.040, h * 0.055, h *  0.020),  # blunt nose
        sf.fair(l * -0.445, b * 0.110, h * 0.160, h *  0.025),
        sf.fair(l * -0.415, b * 0.190, h * 0.275, h *  0.018),
        sf.fair(l * -0.375, b * 0.270, h * 0.380, h *  0.006),
        sf.fair(l * -0.330, b * 0.325, h * 0.450, h * -0.008),
        sf.fair(l * -0.280, b * 0.350, h * 0.490, h * -0.018),  # round peak
        sf.fair(l * -0.225, b * 0.348, h * 0.485, h * -0.022),
        sf.fair(l * -0.170, b * 0.330, h * 0.460, h * -0.020),
        sf.fair(l * -0.115, b * 0.300, h * 0.415, h * -0.014),
        sf.fair(l * -0.065, b * 0.255, h * 0.355, h * -0.008),
        sf.fair(l * -0.020, b * 0.205, h * 0.290, h * -0.002),  # arm hub
        sf.fair(l *  0.025, b * 0.145, h * 0.205, h *  0.000),
        sf.fair(l *  0.065, b * 0.085, h * 0.120, h *  0.000),
        sf.fair(l *  0.095, b * 0.035, h * 0.050, h *  0.000),  # dissolve
    ]


def _hood_stations(stations, l, h):
    """Pearl hood on the upper mantle. Shallow grown mass, not a dorsal fin."""
    hood = []
    for (z, hw, hh, yo, _ch) in stations:
        if z < l * -0.430 or z > l * -0.010:
            continue
        if hw < 0.20:
            continue
        top = yo + hh
        hood.append(sf.fair(z, max(0.14, hw * 0.58), h * 0.095, top - h * 0.035))
    return hood


# ===========================================================================
# ARMS + WEB
# ===========================================================================

def _arm_hub(stations, l):
    """Buried junction at the posterior mantle. Inside the loft solid."""
    z = l * -0.018
    _hw, hh, yo, _ch = sf.section(stations, z)
    return (0.0, yo - hh * 0.08, z)


def _arm_inward(hub, root, tip):
    """Sucker row faces the trailing bundle, not the outer sky."""
    mid = _lerp(root, tip, 0.45)
    axis = (hub[0], hub[1] - 0.35, mid[2])
    return (axis[0] - mid[0], axis[1] - mid[1], axis[2] - mid[2])


def _mantle_bury(stations, hub, tip, bury):
    """Hub->tip point buried ``bury`` inboard of the mantle ellipse.

    The loft is a thin shell. A pad on the hub axis sits in the cavity and
    never shares a voxel with the wall (voxel 0.06, overlap needs > 0.15).
    """
    lo, hi = 0.05, 0.42
    for _ in range(20):
        t = 0.5 * (lo + hi)
        p = _lerp(hub, tip, t)
        hw, hh, yo, _ch = sf.section(stations, p[2])
        if hw < 1e-4 or hh < 1e-4:
            hi = t
            continue
        ell = math.sqrt((p[0] / hw) ** 2 + ((p[1] - yo) / hh) ** 2)
        if ell < 1.0:
            lo = t
        else:
            hi = t
    p = _lerp(hub, tip, 0.5 * (lo + hi))
    hw, hh, yo, _ch = sf.section(stations, p[2])
    gx = p[0] / max(hw * hw, 1e-8)
    gy = (p[1] - yo) / max(hh * hh, 1e-8)
    nout = _unit((gx, gy, 0.0), fallback=_unit((p[0], p[1] - yo, 0.0)))
    return (p[0] - nout[0] * bury, p[1] - nout[1] * bury, p[2])


def _bury_suckers(parts, arm_i, mat, root, tip, root_r, tip_r, inward, detail):
    """Sucker spheres on the inner arm wall. Anatomy's row sits on the
    axis (offset r*0.55), so at voxel 0.06 it is a hollow interior island.
    """
    if detail < 2:
        return
    inn = _unit(inward)
    n = 6 if detail >= 3 else 3
    for k in range(n):
        t = 0.12 + 0.7 * k / max(1, n - 1)
        p = _lerp(root, tip, t)
        arm_r = root_r + (tip_r - root_r) * t
        r = max(arm_r * 0.42, 0.14)
        # Centre 0.12 inboard of the wall so the sphere cuts the tube shell.
        d = max(arm_r - 0.12, 0.08)
        loc = (p[0] + inn[0] * d, p[1] + inn[1] * d, p[2] + inn[2] * d)
        kit.sphere(parts, 'living-arm-frigate.%02d.su%02d' % (arm_i, k),
                   kit.ROLE_TRIM, loc, (r, r * 0.72, r), mat, segments=8)


def _build_arms_and_web(parts, stations, hub, tips, hull_mat, detail):
    """Eight trailing octopus arms plus the interbrachial skirt.

    All eight arms stay at every detail. Suckers are class-placed on the
    inner wall (anatomy's axial row floats inside the tube shell).
    Web is primary mass (anatomy keeps it at detail 0).
    """
    n = len(tips)
    for i, tip in enumerate(tips):
        root = _lerp(hub, tip, 0.06)
        root_r = 0.50 + 0.04 * ((i % 3) - 1)
        inn = _arm_inward(hub, root, tip)
        an.octopus_arm(parts, 'living-arm-frigate.%02d' % i, hull_mat,
                       root, tip, root_r=root_r, tip_r=0.10,
                       suckers=False, inward=inn, detail=detail)
    an.interbrachial_web(parts, 'living-web-frigate', hull_mat, hub, tips,
                         thick=0.22, trail=0.32, detail=detail)


# ===========================================================================
# HOLLOWS — in the trailing web, not flank hangar bays
# ===========================================================================

def _web_mouth(hub, tips, i0, i1, t, y_drop):
    """Mouth centre on the underside of the web sheet between two arms."""
    a = _lerp(hub, tips[i0], t)
    b = _lerp(hub, tips[i1], t)
    mid = _lerp(a, b, 0.5)
    return (mid[0], mid[1] - y_drop, mid[2])


def _web_plug(parts, name, mat, hub, tips, i0, i1, t):
    """Ellipsoid that cuts both arm tubes and the web sheet at station t."""
    a = _lerp(hub, tips[i0], t)
    b = _lerp(hub, tips[i1], t)
    mid = _lerp(a, b, 0.5)
    hx = max(abs(a[0] - b[0]) * 0.55, 0.32)
    hy = 0.28
    hz = 0.48
    kit.sphere(parts, name, kit.ROLE_ARMOUR, mid, (hx, hy, hz), mat,
               segments=10)


def _hollows(parts, glow, hub, tips, hull_mat, glow_mat, detail):
    """Four grown pockets in the web folds. Forward pair are nurseries.

    Default sf.HOLLOW is 2.5 x 3.2 — wider than the web between two
    travel-pose arms — so lip beads hang in empty space. Mouths sit in
    the sheet (y_drop ~ 0) with a pocket sized to the fold, plus a plug
    that welds well, companion and web.
    """
    pocket = (0.62, 0.48, 0.88)
    # Sheet mouths (no hanging drop). Nested companions still pierce
    # along -Y from organs.nursery_hollow.
    loc_s = _web_mouth(hub, tips, 7, 0, 0.14, 0.02)
    loc_p = _web_mouth(hub, tips, 4, 5, 0.16, 0.02)
    org.nursery_hollow(parts, glow, 'frigate.hollow.fore.stbd',
                       hull_mat, glow_mat, loc_s, size=pocket, face='y',
                       occupants=1, detail=detail, seed=11)
    org.nursery_hollow(parts, glow, 'frigate.hollow.fore.port',
                       hull_mat, glow_mat, loc_p, size=pocket, face='y',
                       occupants=1, detail=detail, seed=23)
    loc_as = _web_mouth(hub, tips, 0, 1, 0.26, 0.02)
    loc_ap = _web_mouth(hub, tips, 5, 6, 0.24, 0.02)
    org.sanctuary_hollow(parts, glow, 'frigate.hollow.aft.stbd',
                         hull_mat, glow_mat, loc_as, size=pocket, face='y',
                         detail=detail, seed=37)
    org.sanctuary_hollow(parts, glow, 'frigate.hollow.aft.port',
                         hull_mat, glow_mat, loc_ap, size=pocket, face='y',
                         detail=detail, seed=41)
    _web_plug(parts, 'living-web-frigate.plug.fore.stbd', hull_mat,
              hub, tips, 7, 0, 0.14)
    _web_plug(parts, 'living-web-frigate.plug.fore.port', hull_mat,
              hub, tips, 4, 5, 0.16)
    _web_plug(parts, 'living-web-frigate.plug.aft.stbd', hull_mat,
              hub, tips, 0, 1, 0.26)
    _web_plug(parts, 'living-web-frigate.plug.aft.port', hull_mat,
              hub, tips, 5, 6, 0.24)
    # Companion bodies sit 0.186 below the mouth; pin them back into the sheet.
    for tag, loc in (('fore.stbd', loc_s), ('fore.port', loc_p)):
        oy = 1.0 if loc[1] >= 0.0 else -1.0
        cloc = (loc[0], loc[1] + oy * (sf.COMPANION_LEN * 0.11 - 0.10), loc[2])
        kit.sphere(parts, 'living-companion-%s.plug' % tag, kit.ROLE_ARMOUR,
                   _lerp(loc, cloc, 0.45), (0.42, 0.32, 0.70), hull_mat,
                   segments=10)


def _crown_weld(parts, glow, hull_mat, glow_mat, loc, count, detail):
    """Root pad plus thick shafts. Organ filaments (r≈0.02) and tip
    droplets (r=0.05) miss voxel 0.06 unless they cut the mantle shell.
    """
    kit.sphere(parts, 'sensory-crown-frigate.root', kit.ROLE_HULL, loc,
               (0.52, 0.38, 0.48), hull_mat, segments=10)
    if detail < 1:
        return
    fx, fy, fz = _unit((0.0, 0.30, -1.0), fallback=(0.0, 0.0, -1.0))
    if abs(fy) < 0.9:
        ux, uy, uz = _unit((-fz, 0.0, fx), fallback=(1.0, 0.0, 0.0))
    else:
        ux, uy, uz = 1.0, 0.0, 0.0
    vx = fy * uz - fz * uy
    vy = fz * ux - fx * uz
    vz = fx * uy - fy * ux
    vx, vy, vz = _unit((vx, vy, vz))
    n = count if detail >= 2 else 4
    rand = kit.rng(61)
    lx, ly, lz = loc
    for i in range(n):
        ang = 2.0 * math.pi * i / n + rand() * 0.4
        ca, sa = math.cos(ang), math.sin(ang)
        length = sf.FILAMENT_LEN * (0.85 + rand() * 0.30)
        spread = sf.FILAMENT_LEN * 0.55
        # Skip the two extra rand() calls organs uses for bow, then the tip.
        rand()
        rand()
        tip = (lx + fx * length + (ux * ca + vx * sa) * spread,
               ly + fy * length + (uy * ca + vy * sa) * spread,
               lz + fz * length + (uz * ca + vz * sa) * spread)
        kit.strut(parts, 'sensory-crown-frigate.shaft%02d' % i, kit.ROLE_HULL,
                  loc, tip, hull_mat, radius=0.10, vertices=6)
        if detail >= 2:
            _glow_tag(kit.sphere(glow, 'sensory-crown-frigate.weld%02d' % i,
                                 'glow', tip, (0.12, 0.12, 0.12), glow_mat,
                                 segments=8))


# ===========================================================================
# SURFACE PATHS
# ===========================================================================

def _hood_margin_path(stations, hood, side):
    """Flow line where the pearl hood meets the indigo mantle."""
    if len(hood) < 2:
        return []
    z0 = hood[0][0]
    z1 = hood[-1][0]
    pts = []
    n = 12
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        hw_h = sf.section(hood, z)[0]
        x = hw_h + 0.05
        y = sf.top_y(stations, z, x)
        if y == 0.0:
            continue
        if i == 0 or i == n - 1:
            x *= 0.55
            y -= 0.10
        pts.append((side * x, y + 0.02, z))
    return pts


def _scar_path(stations, side, z0, z1, yf0, yf1, n):
    """Healed welt on the mantle flank. Ends bury inboard."""
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        hw, hh, yo, _ch = sf.section(stations, z)
        if hw == 0.0:
            continue
        y = yo + (yf0 + (yf1 - yf0) * t) * hh
        fx = sf.flank_x(stations, z, y)
        if fx == 0.0:
            continue
        x = fx + 0.02
        if i == 0 or i == n - 1:
            x -= 0.12
        pts.append((side * x, y, z))
    return pts


def _vent_points(stations, side, l, y, n):
    """Breath mouths on the mantle flank only (short z-run)."""
    pts = []
    z0 = l * -0.340
    z1 = l * -0.080
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        fx = sf.flank_x(stations, z, y)
        if fx == 0.0:
            continue
        pts.append((side * fx, y, z))
    return pts


def _fold_y(stations, yf):
    _hw, hh, yo, _ch = sf.section(stations, 0.0)
    # Hub station is near z=0; fall back to a fat mantle sample if slim.
    if hh < 0.4:
        _hw, hh, yo, _ch = sf.section(stations, stations[5][0])
    return yo + yf * hh


# ===========================================================================
# BUILD
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones travel-pose octopus elder (frigate class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS / ROLE_TRIM /
                ROLE_ACCENT objects.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (32.0, 12.48,
                8.32).
    detail   -- 3 full  2 fewer repeats  1 primary + hints  0 masses only.
    """
    stations = _frigate_stations(l, b, h)
    hood = _hood_stations(stations, l, h)
    hub = _arm_hub(stations, l)
    arm_len = l * 0.480
    tips = an.travel_arm_tips(hub, arm_len, count=8, spread=0.40, drop=0.22)

    # -- Primary masses (always) -------------------------------------------
    sf.grown_loft(parts, 'frigate.hull', kit.ROLE_HULL, stations, hull_mat,
                  radial=32)
    if len(hood) >= 2:
        sf.grown_loft(parts, 'living-body-frigate.hood', kit.ROLE_ARMOUR,
                      hood, hull_mat, radial=20)

    z_head = l * -0.300
    ty = sf.top_y(stations, z_head, 0.0)
    if ty != 0.0:
        org.dorsal_mantles(parts, 'frigate.dorsal', hull_mat,
                           (0.0, ty - 0.16, z_head), (2.20, 0.80, 3.10),
                           count=3, seed=29, detail=detail)

    _build_arms_and_web(parts, stations, hub, tips, hull_mat, detail)
    _hollows(parts, glow, hub, tips, hull_mat, glow_mat, detail)

    if detail < 1:
        return

    # -- Scar history: one port welt (detail 1+) ---------------------------
    scars = (
        ('ridge.mid',  l * -0.250, l * -0.180, 0.22, 0.40),
    )
    for tag, z0, z1, yf0, yf1 in scars:
        path = _scar_path(stations, -1.0, z0, z1, yf0, yf1, 8)
        if len(path) >= 2:
            an.healed_scar(parts, 'frigate.scar.' + tag, hull_mat, path,
                           detail=detail)
