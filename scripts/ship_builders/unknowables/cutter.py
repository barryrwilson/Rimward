"""Unknowables Cutter — EXCHANGE LATTICE.

Bible §4.7: "A bifurcated field that can extend a stable transfer pocket
toward another vessel. Keep the carried cells visibly moving between
fixed nodes." Plate (docs/FactionExamples/07-unknowables-ship.png):
ephemeral lace, not haze and not a hull. A traveling field tapers to a
bright POINT in the travel direction (ship −Z). Dark glossy ENERGY CELLS
sit on the spines. Nested orbital loops wrap each lobe. Thin luminous
filaments join the split. Outer dark lensing arcs. You can see through it.

Body plan: TWO lobes joined by lace, never a plated body.

  * PORT traveling lobe — the long field. A CELL_R procession on a fixed
    x-rail, nested loops around the lobe centre, lace meridians that
    taper into field_tip at the travel nose.
  * STARBOARD transfer pocket — a smaller nested-loop cage offset toward
    +X and slightly forward. Its own CELL_R procession sits between
    fixed nd.sync_mote nodes (dorsal/ventral caps and rung posts).
  * EXCHANGE RUNGS — short cell rows that step from the port rail to the
    pocket rail so the carried cells read as traffic between nodes.
    The rungs also keep the two hull islands 26-connected.
  * Wake — the port rail and aft lace stop short of the driver's engine
    glow at z = +l*0.47, so the glow is the cyan wake, not a nozzle.

No ROLE_HULL loft, no plates, no boarding-collar hardware, no haze_lobe
or smoke spheres. Cells stay at absolute sf.CELL_R (nd.energy_cell /
nd.cell_procession). Motes stay at absolute sf.MOTE_R. Hull COLOR_0 is
non-uniform because ROLE_ARMOUR cells and ROLE_ACCENT motes both land
on the parts list at every detail.

Envelope (driver): l = 11.0, b = 5.28, h = 3.30.
Authored largest-dimension target: ~11.0 (spanZ nose tip to engine-glow
far pole). Band 6.60-15.40. Hull vertex band 6 000-47 000.
Stations: nose l*-0.518 = -5.698; stern l*+0.452 = +4.972. Glow at
l*+0.47 = +5.170. Field L = 10.67, B = 5.28, H = 3.00.
Relief: L/B 2.02 (>= 0.70), H/L 0.28 (<= 1.15), B/L 0.50 (>= 0.45).
Loop majors stay inside that beam so spanX does not overtake spanZ.

LOD ladder
----------
detail=3  both processions at full run, nose spine, two exchange rungs,
          rung cells, mote caps on both rails plus rung posts, three
          nested loops per lobe, two lensing arcs, full lace.
detail=2  constructs thin: nested_loops / filament_lace drop outer
          members; one exchange rung; fewer meridians; one arc.
detail=1  primary masses + key anatomy: both processions (shortened),
          one rung, eight motes, two loops, tip, four lace braids.
detail=0  primary masses only: both processions, nose cells, eight
          rail motes, one loop per lobe, field_tip, spine and join lace.

Estimated lod0 hull verts (detail 3): ~55 CELL_R spheres (16-seg) plus
~30 motes (12-seg) ≈ 9 000. Glow lace and loops do not count as hull.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from . import field as fd
from . import nodes as nd
from . import surface as sf


# ===========================================================================
# STATION LIST
# ===========================================================================

def _cutter_stations(l, b, h):
    """Bifurcated traveling-field stations. Nose is −Z, stern is +Z.

    The volume is a lace envelope, not a plated loft. Class seating uses
    sf.interpolate / sf.spine after this list; it does not re-type l, b, h.
    Stern sits short of the driver glow at +l*0.47 so the glow is the wake.
    """
    return [
        sf.station(l * -0.518, b * 0.010, h * 0.014, 0.0),  # tip -5.698
        sf.station(l * -0.445, b * 0.055, h * 0.072, 0.0),
        sf.station(l * -0.336, b * 0.210, h * 0.242, 0.0),
        sf.station(l * -0.200, b * 0.410, h * 0.364, 0.0),  # fork / pocket
        sf.station(l * -0.045, b * 0.500, h * 0.455, 0.0),  # max beam
        sf.station(l *  0.127, b * 0.455, h * 0.394, 0.0),
        sf.station(l *  0.282, b * 0.280, h * 0.258, 0.0),
        sf.station(l *  0.382, b * 0.125, h * 0.136, 0.0),
        sf.station(l *  0.452, b * 0.028, h * 0.036, 0.0),  # wake +4.972
    ]


# ===========================================================================
# POINT HELPERS — envelope queries, no l/b/h fractions
# ===========================================================================

def _lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t)


def _lobe_xs(stations):
    """Fixed port-rail and pocket-rail x from the max-beam station."""
    z_lo = sf.nose_z(stations)
    z_hi = sf.stern_z(stations)
    z_mid = z_lo + (z_hi - z_lo) * 0.46
    hw, _hh, _yo = sf.interpolate(stations, z_mid)
    # Close split: two lobes of one field. Loop majors carry the beam.
    return (-hw * 0.46, hw * 0.52, z_mid)


def _meridian(stations, x_frac, y_frac, n, z0=None, z1=None):
    """Polyline riding a constant fraction of the local ellipse."""
    if z0 is None:
        z0 = sf.nose_z(stations)
    if z1 is None:
        z1 = sf.stern_z(stations)
    pts = []
    count = n if n >= 2 else 2
    for i in range(count):
        t = i / (count - 1.0)
        z = z0 + (z1 - z0) * t
        hw, hh, yo = sf.interpolate(stations, z)
        pts.append((hw * x_frac, yo + hh * y_frac, z))
    return pts


def _helix(stations, x_frac, y_amp, turns, phase, n, z0=None, z1=None):
    """Deterministic helical braid. Phase and turns are literals, not RNG."""
    if z0 is None:
        z0 = sf.nose_z(stations)
    if z1 is None:
        z1 = sf.stern_z(stations)
    pts = []
    count = n if n >= 2 else 2
    for i in range(count):
        t = i / (count - 1.0)
        z = z0 + (z1 - z0) * t
        hw, hh, yo = sf.interpolate(stations, z)
        ang = phase + turns * 2.0 * math.pi * t
        pts.append((
            hw * x_frac * (0.72 + 0.28 * math.cos(ang)),
            yo + hh * y_amp * math.sin(ang),
            z,
        ))
    return pts


def _bridge_pts(x0, x1, y, z, arch, n):
    """Arched lace from one rail to the other at fixed z."""
    pts = []
    count = n if n >= 2 else 2
    for i in range(count):
        t = i / (count - 1.0)
        pts.append((
            x0 + (x1 - x0) * t,
            y + arch * math.sin(t * math.pi),
            z,
        ))
    return pts


def _cell_row(parts, name, hull_mat, p0, p1, detail, skip_ends=False):
    """CELL_R spheres from p0 to p1 at cell_link_pitch. Never scaled."""
    dx = p1[0] - p0[0]
    dy = p1[1] - p0[1]
    dz = p1[2] - p0[2]
    dist = math.sqrt(dx * dx + dy * dy + dz * dz)
    pitch = sf.cell_link_pitch()
    if dist < 1e-6:
        return
    steps = int(math.ceil(dist / pitch))
    if steps < 1:
        steps = 1
    lo = 1 if skip_ends else 0
    hi = steps if skip_ends else (steps + 1)
    for i in range(lo, hi):
        t = i / float(steps)
        nd.energy_cell(
            parts, '%s-%d' % (name, i), hull_mat,
            (p0[0] + dx * t, p0[1] + dy * t, p0[2] + dz * t), detail,
        )


def _mote_pair(parts, name, hull_mat, loc, detail):
    """Dorsal and ventral sync motes overlapping the cell at loc.

    Offset is 0.22 so each mote shares solid with the CELL_R sphere
    (overlap 0.076, above the 0.06 island voxel) and still reads as a
    white-gold node sitting on the cell.
    """
    x, y, z = loc
    off = 0.22
    nd.sync_mote(parts, name + '-d', hull_mat, (x, y + off, z), detail)
    nd.sync_mote(parts, name + '-v', hull_mat, (x, y - off, z), detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Unknowables exchange lattice (cutter class).

    parts    -- ROLE_ARMOUR cells and ROLE_ACCENT motes (the only hull).
    glow     -- lace, loops, arcs, tip (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 thinned  1 primary + key  0 primary masses.
    """
    stations = _cutter_stations(l, b, h)
    z_nose = sf.nose_z(stations)
    z_stern = sf.stern_z(stations)
    span = z_stern - z_nose
    port_x, pocket_x, z_mid = _lobe_xs(stations)
    hw_mid, hh_mid, yo_mid = sf.interpolate(stations, z_mid)
    pocket_y = yo_mid + hh_mid * 0.04
    pocket_z = z_nose + span * 0.42

    # Procession windows. High detail keeps the long travel run; low
    # detail shortens both rails so lod2 stays under the 8 000 tri cap.
    if detail >= 3:
        port_z0 = z_nose + span * 0.220
        port_z1 = z_stern - span * 0.075
        pocket_z0 = z_nose + span * 0.255
        pocket_z1 = z_nose + span * 0.655
    elif detail >= 2:
        port_z0 = z_nose + span * 0.240
        port_z1 = z_stern - span * 0.110
        pocket_z0 = z_nose + span * 0.275
        pocket_z1 = z_nose + span * 0.620
    else:
        port_z0 = z_nose + span * 0.320
        port_z1 = z_stern - span * 0.220
        pocket_z0 = z_nose + span * 0.340
        pocket_z1 = z_nose + span * 0.540

    # -- CELLS: port traveling rail (always) --------------------------------
    nd.cell_procession(
        parts, 'cell-cutter-port', hull_mat,
        port_z0, port_z1, port_x, 0.0, detail,
    )

    # -- CELLS: starboard transfer pocket (always) --------------------------
    nd.cell_procession(
        parts, 'cell-cutter-pocket', hull_mat,
        pocket_z0, pocket_z1, pocket_x, pocket_y, detail,
    )

    # -- CELLS: exchange rungs — traffic between the fixed nodes ------------
    port_zs = nd.procession_zs(port_z0, port_z1)
    fork_z = port_zs[0]
    mid_i = len(port_zs) // 2
    xchg_z = port_zs[mid_i]
    _cell_row(
        parts, 'cell-cutter-rung-fork', hull_mat,
        (port_x, 0.0, fork_z), (pocket_x, pocket_y, fork_z),
        detail, skip_ends=True,
    )
    if detail >= 2:
        _cell_row(
            parts, 'cell-cutter-rung-mid', hull_mat,
            (port_x, 0.0, xchg_z), (pocket_x, pocket_y, xchg_z),
            detail, skip_ends=True,
        )

    # -- CELLS: short nose spine so field_tip meridians pierce matter ------
    nose_z0 = z_nose + sf.CELL_R + 0.08
    if detail >= 2:
        nose_z1 = port_z0
    else:
        nose_z1 = nose_z0 + sf.cell_link_pitch() * 2.0
    nd.cell_procession(
        parts, 'cell-cutter-nose', hull_mat,
        nose_z0, nose_z1, 0.0, 0.0, detail,
    )
    _cell_row(
        parts, 'cell-cutter-fork-port', hull_mat,
        (0.0, 0.0, port_z0), (port_x, 0.0, port_z0),
        detail, skip_ends=True,
    )

    # -- MOTES: fixed nodes the cells sit between (always) ------------------
    _mote_pair(parts, 'mote-cutter-port-fore', hull_mat,
               (port_x, 0.0, port_z0), detail)
    _mote_pair(parts, 'mote-cutter-port-aft', hull_mat,
               (port_x, 0.0, port_z1), detail)
    _mote_pair(parts, 'mote-cutter-pocket-fore', hull_mat,
               (pocket_x, pocket_y, pocket_z0), detail)
    _mote_pair(parts, 'mote-cutter-pocket-aft', hull_mat,
               (pocket_x, pocket_y, pocket_z1), detail)

    if detail >= 2:
        _mote_pair(parts, 'mote-cutter-port-mid', hull_mat,
                   (port_x, 0.0, xchg_z), detail)
        _mote_pair(parts, 'mote-cutter-pocket-mid', hull_mat,
                   (pocket_x, pocket_y, xchg_z), detail)
        # Rung posts — the nodes the exchange cells travel between.
        nd.sync_mote(
            parts, 'mote-cutter-rung-a', hull_mat,
            _lerp((port_x, 0.0, fork_z), (pocket_x, pocket_y, fork_z), 0.33),
            detail,
        )
        nd.sync_mote(
            parts, 'mote-cutter-rung-b', hull_mat,
            _lerp((port_x, 0.0, fork_z), (pocket_x, pocket_y, fork_z), 0.67),
            detail,
        )

    if detail >= 3:
        # Extra rail nodes so the procession reads as cells-between-posts.
        step = 3
        for i in range(step, len(port_zs) - 1, step):
            _mote_pair(
                parts, 'mote-cutter-port-n%d' % i, hull_mat,
                (port_x, 0.0, port_zs[i]), detail,
            )
        pocket_zs = nd.procession_zs(pocket_z0, pocket_z1)
        for i in range(step, len(pocket_zs) - 1, step):
            _mote_pair(
                parts, 'mote-cutter-pocket-n%d' % i, hull_mat,
                (pocket_x, pocket_y, pocket_zs[i]), detail,
            )
        nd.sync_mote(
            parts, 'mote-cutter-rung-mid-a', hull_mat,
            _lerp((port_x, 0.0, xchg_z), (pocket_x, pocket_y, xchg_z), 0.33),
            detail,
        )
        nd.sync_mote(
            parts, 'mote-cutter-rung-mid-b', hull_mat,
            _lerp((port_x, 0.0, xchg_z), (pocket_x, pocket_y, xchg_z), 0.67),
            detail,
        )

    # -- TIP: pointed travel taper on the nose (always) ---------------------
    fd.field_tip(
        glow, 'tip-cutter', glow_mat,
        sf.tip_point(stations), sf.TIP_LEN, detail,
    )

    # -- NESTED LOOPS: one cage per lobe (always) ---------------------------
    port_loc = (port_x, 0.0, z_mid + span * 0.04)
    pocket_loc = (pocket_x, pocket_y, pocket_z)
    r_port = max(sf.radius_at(stations, port_loc[2]) * 0.64, 1.28)
    r_pocket = max(r_port * 0.78, 0.98)
    port_tilts = (
        sf.TORUS_FACE_Z,
        (math.pi * 0.50, 0.32, 0.16),
        (0.52, 0.10, 0.38),
    )
    pocket_tilts = (
        sf.TORUS_FACE_Z,
        (math.pi * 0.50, -0.38, 0.20),
        (0.36, -0.16, 0.48),
    )
    fd.nested_loops(
        glow, 'loop-cutter-port', glow_mat, port_loc,
        (r_port * 0.62, r_port * 0.86, r_port * 1.08),
        port_tilts, detail,
    )
    fd.nested_loops(
        glow, 'loop-cutter-pocket', glow_mat, pocket_loc,
        (r_pocket * 0.60, r_pocket * 0.84, r_pocket * 1.06),
        pocket_tilts, detail,
    )

    # -- LENSING ARCS: outer dark rings (detail 2+) -------------------------
    if detail >= 2:
        fd.lensing_arc(
            glow, 'arc-cutter-field', glow_mat,
            (0.0, yo_mid, z_mid),
            max(hw_mid * 1.00, 2.52),
            sf.TORUS_FACE_Z, detail,
        )
    if detail >= 3:
        fd.lensing_arc(
            glow, 'arc-cutter-pocket', glow_mat,
            pocket_loc,
            r_pocket * 1.18,
            (0.40, -0.12, 0.28), detail,
        )

    # -- LACE: meridians, helices, exchange braids --------------------------
    if detail >= 3:
        meridians = (
            (-0.70, 0.10), (-0.66, -0.18), (-0.22, 0.32),
            (0.18, 0.22), (0.72, 0.08), (0.68, -0.20),
        )
        n_mer = 12
        helices = (
            (-0.68, 0.36, 1.15, 0.20),
            (0.70, 0.30, 1.35, 1.40),
            (-0.18, 0.28, 0.85, 2.10),
        )
        n_hel = 14
        bridges = (fork_z, xchg_z, port_zs[len(port_zs) // 3])
    elif detail >= 2:
        meridians = (
            (-0.70, 0.12), (-0.64, -0.16), (0.72, 0.08), (0.66, -0.18),
        )
        n_mer = 10
        helices = (
            (-0.68, 0.32, 1.10, 0.20),
            (0.70, 0.28, 1.20, 1.40),
        )
        n_hel = 12
        bridges = (fork_z, xchg_z)
    elif detail >= 1:
        meridians = ((-0.70, 0.10), (0.72, 0.08))
        n_mer = 8
        helices = ()
        n_hel = 8
        bridges = (fork_z,)
    else:
        meridians = ((-0.46, 0.08),)
        n_mer = 5
        helices = ()
        n_hel = 4
        bridges = (fork_z,)

    # Centreline thread: tip to wake. Joins field_tip to the nose cells.
    fd.filament_lace(
        glow, 'lace-cutter-spine', glow_mat,
        _meridian(stations, 0.0, 0.0, 8 if detail >= 2 else 5), detail,
    )

    for i, (xf, yf) in enumerate(meridians):
        fd.filament_lace(
            glow, 'lace-cutter-meridian-%d' % i, glow_mat,
            _meridian(stations, xf, yf, n_mer), detail,
        )
    for i, (xf, ya, turns, phase) in enumerate(helices):
        fd.filament_lace(
            glow, 'lace-cutter-helix-%d' % i, glow_mat,
            _helix(stations, xf, ya, turns, phase, n_hel), detail,
        )

    # Join the two lobes with arched braids at the exchange stations.
    for i, bz in enumerate(bridges):
        fd.filament_lace(
            glow, 'lace-cutter-join-%d' % i, glow_mat,
            _bridge_pts(port_x, pocket_x, 0.0, bz, 0.28, 6), detail,
        )
        if detail >= 2:
            fd.filament_lace(
                glow, 'lace-cutter-join-low-%d' % i, glow_mat,
                _bridge_pts(port_x, pocket_x, 0.0, bz, -0.22, 6), detail,
            )

    # Wake threads: last port cell toward the glow, still short of +l*0.47.
    fd.filament_lace(
        glow, 'lace-cutter-wake', glow_mat,
        _meridian(
            stations, -0.20, 0.06, 6 if detail >= 2 else 4,
            z0=port_z1 - span * 0.06, z1=z_stern,
        ),
        detail,
    )
