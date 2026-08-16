"""Unknowables Frigate — CHORUS FIELD.

Bible §4.7: "Several synchronized knots moving as one stable architecture,
with a clear central cadence and satellite exchange nodes. Smaller than the
cell caravan below." Plate 07-unknowables-ship.png is lace, not fog and not
a hull: nested loops, a pointed travel taper, thin luminous filaments, and
dark glossy cells as the only solid matter.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; authored largest-dimension target ≈ 32.0 (the
field z-span from travel tip to the driver engine glow at +l*0.47). Hull
vertex band [16 000, 84 000]. Relief L/B >= 0.70, H/L <= 1.15, B/L >= 0.45
(FACTION_PROPORTION_RELIEF.unknowables). Driver beam 12.48 is narrower than
the 0.45 floor, so the field envelope is authored wider than b.

Body plan
---------
ONE central knot (nested loops + a packed CELL_R pearl + field tip) and
FIVE satellite knots on a regular ring around it. Each satellite is a
smaller nested_loops nest plus one hex of CELL_R cells — more knots, never
bigger cells. fd.filament_lace speaks every spoke and the chorus ring, so
the knots read as one architecture, not a long freighter cell caravan.

Central cadence: regular nd.sync_mote rings around each core plane, seated
on the centre cell (radius CELL_R - MOTE_R) so every mote is matter, not
dust. Hull channel is cells (ROLE_ARMOUR) plus motes (ROLE_ACCENT) — two
colours, no plated ROLE_HULL body. Glow channel is loops, lace, arcs, tip.

The field volume tapers to a bright point at -Z and reaches just short of
the driver glow at +l*0.47 so that sphere reads as the chorus wake.

Estimated budgets (kit primitive costs; wave-8 batch: py_compile only):
lod0 (detail 3): ~75 cells + ~120 motes ≈ 18 000 hull verts.
lod1 (detail 2): ~75 cells + ~100 motes ≈ 17 000 hull verts.
lod2 (detail 1): hex planes and mote rings drop; constructs self-thin.

LOD ladder
----------
detail=3  five satellites, five core planes, 16 motes/ring, full lace
detail=2  five satellites, five core planes, 12 motes/ring, loops drop
          their outer members (nested_loops)
detail=1  four satellites, three core planes, 8 motes/ring, procession
          cells on satellites, fewer meridians
detail=0  three satellites, three core planes, cells + inner loops + tip
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from . import field as fd
from . import nodes as nd
from . import surface as sf


# ===========================================================================
# STATION LIST — traveling field volume, not a plated hull
# ===========================================================================

def _chorus_stations(l, b, h):
    """Field envelope. Nose at -Z (travel tip); stern just shy of +l*0.47.

    Mid half-width is the wider of 0.62 b and 0.248 of the field length so
    B/L stays at or above the 0.45 relief floor. Half-height follows the
    same envelope, never a box.
    """
    z0 = l * -0.530
    z1 = l * 0.455
    length = z1 - z0
    hw = max(b * 0.62, length * 0.248)
    hh = max(h * 0.50, hw * 0.62)
    return [
        sf.station(z0,                 hw * 0.04, hh * 0.04, 0.0),
        sf.station(z0 + length * 0.10, hw * 0.28, hh * 0.26, 0.0),
        sf.station(z0 + length * 0.28, hw * 0.72, hh * 0.68, 0.0),
        sf.station(z0 + length * 0.48, hw,        hh,        0.0),
        sf.station(z0 + length * 0.62, hw * 0.96, hh * 0.92, 0.0),
        sf.station(z0 + length * 0.80, hw * 0.55, hh * 0.50, 0.0),
        sf.station(z1,                 hw * 0.10, hh * 0.09, 0.0),
    ]


# ===========================================================================
# COUNTS
# ===========================================================================

def _core_planes(detail):
    if detail >= 3:
        return 4
    if detail >= 2:
        return 3
    return 2


def _sat_count(detail):
    if detail >= 3:
        return 5
    if detail >= 2:
        return 4
    if detail >= 1:
        return 3
    return 3


def _cadence_n(detail):
    if detail >= 3:
        return 10
    if detail >= 2:
        return 6
    return 4


def _meridian_n(detail):
    if detail >= 3:
        return 5
    if detail >= 2:
        return 2
    if detail >= 1:
        return 2
    return 2


# ===========================================================================
# KNOT SEATS — every point from surface queries
# ===========================================================================

def _core_loc(stations):
    z0 = sf.nose_z(stations)
    z1 = sf.stern_z(stations)
    return sf.spine(stations, z0 + (z1 - z0) * 0.48)


def _sat_locs(stations, core, n):
    """Regular chorus ring around the core, on the local ellipse."""
    hw, hh, yo = sf.interpolate(stations, core[2])
    locs = []
    for i in range(n):
        ang = (2.0 * math.pi * i / n) + (math.pi / 10.0)
        locs.append((
            hw * 0.62 * math.cos(ang),
            yo + hh * 0.62 * math.sin(ang),
            core[2],
        ))
    return locs


def _hex_plane(parts, name, hull_mat, loc, detail):
    """Centre CELL_R pearl plus six neighbours at cell_link_pitch."""
    pitch = sf.cell_link_pitch()
    cx, cy, cz = loc
    nd.energy_cell(parts, name + '-c', hull_mat, loc, detail)
    for i in range(6):
        ang = math.pi / 3.0 * i
        p = (cx + pitch * math.cos(ang), cy + pitch * math.sin(ang), cz)
        nd.energy_cell(parts, '%s-%d' % (name, i), hull_mat, p, detail)


def _mote_ring(parts, name, hull_mat, loc, count, detail):
    """Regular cadence ring seated on the centre cell at this loc."""
    radius = sf.CELL_R - sf.MOTE_R
    cx, cy, cz = loc
    for i in range(count):
        ang = 2.0 * math.pi * i / count
        p = (
            cx + radius * math.cos(ang),
            cy + radius * math.sin(ang),
            cz,
        )
        nd.sync_mote(parts, '%s-%d' % (name, i), hull_mat, p, detail)


# ===========================================================================
# LACE PATHS
# ===========================================================================

def _mid(a, b, dx=0.0, dy=0.0, dz=0.0):
    return (
        0.5 * (a[0] + b[0]) + dx,
        0.5 * (a[1] + b[1]) + dy,
        0.5 * (a[2] + b[2]) + dz,
    )


def _spoke_paths(core, sat, i):
    """Two bowed polylines from core to one satellite (one architecture)."""
    sign = 1.0 if (i % 2) == 0 else -1.0
    bow = _mid(core, sat, dy=0.18 * sign, dz=0.55)
    alt = _mid(core, sat, dy=-0.16 * sign, dz=-0.40)
    return (
        (core, bow, sat),
        (core, alt, sat),
    )


def _meridian_path(stations, angle, n):
    z0 = sf.nose_z(stations)
    z1 = sf.stern_z(stations)
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        hw, hh, yo = sf.interpolate(stations, z)
        flare = math.sin(math.pi * t)
        pts.append((
            hw * 0.90 * flare * math.cos(angle),
            yo + hh * 0.90 * flare * math.sin(angle),
            z,
        ))
    return pts


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Unknowables chorus field (frigate class).

    parts    -- hull channel: energy cells and sync motes only.
    glow     -- emissive channel: loops, lace, lensing arcs, travel tip.
    l, b, h  -- class length, beam, height from the driver (32.0, 12.48,
                8.32).
    detail   -- 3 full chorus  2 thinned repeats  1 primary knots + cadence
                0 primary knots and tip only.
    """
    stations = _chorus_stations(l, b, h)
    core = _core_loc(stations)
    tip = sf.tip_point(stations)
    stern = sf.spine(stations, sf.stern_z(stations))
    hw_core, _hh_core, _yo_core = sf.interpolate(stations, core[2])
    pitch = sf.cell_link_pitch()
    n_planes = _core_planes(detail)
    n_sat = _sat_count(detail)
    sats = _sat_locs(stations, core, n_sat)

    # -- Central knot: packed CELL_R planes along the core (always) --------
    plane_span = 0.5 * (n_planes - 1)
    for p in range(n_planes):
        z = core[2] + (p - plane_span) * pitch
        loc = (core[0], core[1], z)
        _hex_plane(parts, 'cell-core-p%d' % p, hull_mat, loc, detail)

    # -- Exchange cells: one step from the core hex toward each satellite --
    for i, sat in enumerate(sats):
        dx = sat[0] - core[0]
        dy = sat[1] - core[1]
        dist = math.sqrt(dx * dx + dy * dy)
        if dist < 1e-6:
            continue
        loc = (
            core[0] + (pitch * 2.0) * dx / dist,
            core[1] + (pitch * 2.0) * dy / dist,
            core[2],
        )
        nd.energy_cell(parts, 'cell-xchg-%d' % i, hull_mat, loc, detail)

    # -- Satellite knots: smaller hex (or a short procession at lod2) ------
    for i, sat in enumerate(sats):
        tag = 'cell-sat-%d' % i
        if detail >= 3:
            _hex_plane(parts, tag, hull_mat, sat, detail)
        else:
            nd.cell_procession(
                parts, tag, hull_mat,
                sat[2] - pitch * (1.0 if detail < 2 else 2.0),
                sat[2] + pitch * (1.0 if detail < 2 else 2.0),
                sat[0], sat[1], detail,
            )

    # -- Central + satellite nested loops (always; detail drops outers) ----
    r_mid = sf.radius_at(stations, core[2])
    fd.nested_loops(
        glow, 'loop-core', glow_mat, core,
        (r_mid * 0.26, r_mid * 0.40, r_mid * 0.56),
        (
            sf.TORUS_FACE_Z,
            (math.pi * 0.5, 0.0, 0.55),
            (0.40, 0.15, 0.35),
        ),
        detail,
    )
    sat_majors = (sf.CELL_R * 2.8, sf.CELL_R * 4.0)
    sat_tilts = (
        sf.TORUS_FACE_Z,
        (math.pi * 0.5, 0.22, 0.40),
    )
    for i, sat in enumerate(sats):
        fd.nested_loops(
            glow, 'loop-sat-%d' % i, glow_mat, sat,
            sat_majors, sat_tilts, detail,
        )

    # -- Travel tip (always): field geometry, not a prow -------------------
    fd.field_tip(glow, 'tip-chorus', glow_mat, tip, sf.TIP_LEN, detail)

    # -- Outer lensing arcs: wrap the chorus so beam meets relief ----------
    fd.lensing_arc(
        glow, 'arc-chorus-0', glow_mat, core, hw_core * 0.98,
        (0.55, 0.0, 0.20), detail,
    )
    fd.lensing_arc(
        glow, 'arc-chorus-1', glow_mat, core, hw_core * 1.02,
        (0.35, 0.25, -0.15), detail,
    )

    # -- Spoke and chorus-ring lace (always): one architecture -------------
    for i, sat in enumerate(sats):
        for s, path in enumerate(_spoke_paths(core, sat, i)):
            fd.filament_lace(
                glow, 'lace-spoke-%d-%d' % (i, s), glow_mat, path, detail,
            )
    for i in range(n_sat):
        a = sats[i]
        b = sats[(i + 1) % n_sat]
        fd.filament_lace(
            glow, 'lace-ring-%d' % i, glow_mat,
            (a, _mid(a, b, dz=0.35), b), detail,
        )
    fd.filament_lace(
        glow, 'lace-tip', glow_mat,
        (tip, _mid(tip, core, dy=0.20), core), detail,
    )
    fd.filament_lace(
        glow, 'lace-wake', glow_mat,
        (core, _mid(core, stern, dy=-0.22), stern), detail,
    )

    # -- Envelope meridians (always; count follows detail) -----------------
    n_mer = _meridian_n(detail)
    n_mer_pts = 5 if detail >= 2 else 4
    for i in range(n_mer):
        ang = 2.0 * math.pi * i / n_mer
        path = _meridian_path(stations, ang, n_mer_pts)
        fd.filament_lace(
            glow, 'lace-meridian-%d' % i, glow_mat, path, detail,
        )
        if detail >= 3 and path:
            mid = path[len(path) // 2]
            fd.tie_spoke(
                glow, 'lace-meridian-tie-%d' % i, glow_mat, core, mid, detail,
            )

    if detail < 2:
        nd.sync_mote(parts, 'mote-core', hull_mat, core, detail)
        if sats:
            nd.sync_mote(parts, 'mote-sat-0', hull_mat, sats[0], detail)
        return

    # -- Central cadence: regular mote rings on every core plane -----------
    n_mote = _cadence_n(detail)
    for p in range(n_planes):
        z = core[2] + (p - plane_span) * pitch
        _mote_ring(
            parts, 'mote-cadence-p%d' % p, hull_mat,
            (core[0], core[1], z), n_mote, detail,
        )
    for i, sat in enumerate(sats):
        _mote_ring(
            parts, 'mote-sat-%d' % i, hull_mat, sat,
            8 if detail >= 2 else 6, detail,
        )

    if detail < 3:
        return

    # -- Field loops along the travel axis (not extra knots) ---------------
    z0 = sf.nose_z(stations)
    z1 = sf.stern_z(stations)
    length = z1 - z0
    for tag, tf, rf, tilt in (
        ('fore', 0.28, 0.58, (math.pi * 0.5, 0.10, 0.20)),
        ('aft',  0.70, 0.64, (math.pi * 0.5, -0.12, 0.18)),
    ):
        z = z0 + length * tf
        loc = sf.spine(stations, z)
        major = sf.radius_at(stations, z) * rf
        fd.orbital_loop(
            glow, 'loop-field-%s' % tag, glow_mat, loc, major, tilt, detail,
        )
