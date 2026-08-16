"""Unknowables Freighter - ENERGY PROCESSION.

Bible §4.7: a vast chain or nested procession of fields with thousands of
physical cells in ordered streams. Repeated anchor clusters create enormous
scale. A station meets one TERMINAL node; the rest stays outside.

Reference plate (docs/FactionExamples/07-unknowables-ship.png): ephemeral
lace — nested orbital loops, thin luminous threads, a pointed travel taper,
dark glossy cells as pearls of matter. Not haze. Not a plated hull.

Envelope (driver): l = 85.0, b = 46.75, h = 25.5. Authored length ~77.95
(tip at l*-0.448 to stern at l*+0.469; SHIP_SCALE freighter span band
[66.00, 109.20]; target ~78.0). The driver engine-glow sphere sits at
z = +l*0.47 = +39.95. The TERMINAL cage sits just short of that glow so a
station can meet one node. Cells stay CELL_R; the cage is bigger.

Body plan
---------
A long traveling field, the fleet's deep-end sculpt:

- THREE parallel cell processions along most of the length (two at detail
  0-1). Absolute CELL_R. More cells via pitch, never bigger pearls.
- Repeated nested-loop cages every N cells, plus a larger outer loop on
  every third cage (anchor clusters).
- ONE TERMINAL node at the stern (+Z): a larger loop cage and a mote
  cluster. Cells stay CELL_R.
- Travel tip at −Z (field_tip + lace meridians).
- Lace envelopes (helices + meridians) and outer lensing arcs follow the
  field stations. They make the beam; they are not a cargo hull.

LOD ladder (this class also bakes lod3 / detail 0):

- lod0 (detail 3): three streams (stride 6), cage every 3 kept cells,
  three helices, two meridians, five outer arcs, full motes.
- lod1 (detail 2): three streams (stride 8), cage every 3, nested_loops
  trims the outer ring, two helices, two meridians, three arcs.
- lod2 (detail 1): two streams (stride 8), cage every 4, two helices,
  two meridians, three arcs.
- lod3 (detail 0): two streams (stride 14) + terminal cage + tip + two
  meridians + one helix + two outer arcs. Primary masses stay.

Hull channel is cells + motes only (ROLE_ARMOUR / ROLE_ACCENT). Glow
channel is lace, loops, arcs, tip. No cargo hull, no haze blobs.

Relief (FACTION_PROPORTION_RELIEF.unknowables): L/B >= 0.70, H/L <= 1.15,
B/L >= 0.45. This class should dominate the ladder.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import field as fd
from . import nodes as nd
from . import surface as sf


# Inner cages wrap the cell streams. Absolute majors — never scaled by l.
_CAGE_MAJORS = (1.15, 1.70, 2.35)
_ANCHOR_MAJORS = (4.20, 6.40, 8.80)
# Terminal cage is bigger so a station can meet it. Cells stay CELL_R.
_TERM_MAJORS = (3.60, 5.20, 7.00, 9.20)

_GLOW_LIMIT = 0.47


# ===========================================================================
# STATION LIST
# ===========================================================================

def _field_stations(l, b, h):
    """Traveling-field stations: tip, repeating swells, TERMINAL, stern.

    Nose at l*-0.448 = -38.08. Stern at l*+0.469 = +39.865, just short of
    the driver glow at +l*0.47 = +39.95. SpanZ = 77.945 (band 66.00-109.20,
    target ~78.0). Half-width peaks at the terminal bulge (b*0.520) so the
    meeting node reads larger than the chain. y_offset stays on the spine.
    """
    return [
        sf.station(l * -0.448, b * 0.004, h * 0.004, 0.0),  # travel tip
        sf.station(l * -0.420, b * 0.085, h * 0.090, 0.0),
        sf.station(l * -0.380, b * 0.220, h * 0.240, 0.0),
        sf.station(l * -0.320, b * 0.380, h * 0.380, 0.0),
        sf.station(l * -0.250, b * 0.470, h * 0.460, 0.0),  # swell 1
        sf.station(l * -0.180, b * 0.420, h * 0.410, 0.0),
        sf.station(l * -0.080, b * 0.500, h * 0.490, 0.0),  # swell 2
        sf.station(l *  0.020, b * 0.455, h * 0.440, 0.0),
        sf.station(l *  0.120, b * 0.490, h * 0.470, 0.0),  # swell 3
        sf.station(l *  0.220, b * 0.430, h * 0.410, 0.0),
        sf.station(l *  0.320, b * 0.460, h * 0.440, 0.0),  # swell 4
        sf.station(l *  0.390, b * 0.400, h * 0.380, 0.0),
        sf.station(l *  0.445, b * 0.520, h * 0.510, 0.0),  # TERMINAL
        sf.station(l *  0.462, b * 0.280, h * 0.270, 0.0),
        sf.station(l * (_GLOW_LIMIT - 0.001), b * 0.060, h * 0.055, 0.0),
    ]


# ===========================================================================
# PATH HELPERS — points from stations / CELL_R, never a typed y
# ===========================================================================

def _stream_offsets(detail):
    """Parallel processions as (tag, x, y). Offsets are module, not l*b*h."""
    cr = sf.CELL_R
    streams = [
        ('main', 0.0, 0.0),
        ('stbd', 2.40 * cr, 0.55 * cr),
    ]
    if detail >= 2:
        streams.append(('port', -2.50 * cr, -0.45 * cr))
    return streams


def _terminal_z(stations):
    """Aft station with the largest half-width — the TERMINAL meeting node."""
    z0 = sf.nose_z(stations)
    z1 = sf.stern_z(stations)
    cut = z0 + 0.72 * (z1 - z0)
    best_z = z1
    best_w = -1.0
    for st in stations:
        if st[0] < cut:
            continue
        if st[1] > best_w:
            best_w = st[1]
            best_z = st[0]
    return best_z


def _stream_cell_n(detail):
    # Fixed pearl counts so lower LODs stay inside triangle caps.
    # Links hold the long chain as one island.
    if detail >= 3:
        return 28
    if detail >= 2:
        return 14
    if detail >= 1:
        return 7
    return 5


def _cage_step(detail):
    # Step is in KEPT cells, not raw pitch.
    if detail >= 3:
        return 4
    if detail >= 2:
        return 4
    if detail >= 1:
        return 4
    return 5


def _path_n(z0, z1, step):
    n = int(math.ceil((z1 - z0) / step)) + 1
    if n < 3:
        n = 3
    return n


def _helix_path(stations, z0, z1, n, turns, phase, radial):
    """Helical lace polyline riding the field envelope."""
    pts = []
    for i in range(n):
        t = float(i) / float(n - 1)
        z = z0 + (z1 - z0) * t
        hw, hh, yo = sf.interpolate(stations, z)
        ang = phase + turns * 2.0 * math.pi * t
        pts.append((
            radial * hw * math.cos(ang),
            yo + radial * hh * math.sin(ang),
            z,
        ))
    return pts


def _meridian_path(stations, z0, z1, n, ang, radial):
    """Longitudinal lace polyline at a fixed envelope angle."""
    pts = []
    ca = math.cos(ang)
    sa = math.sin(ang)
    for i in range(n):
        t = float(i) / float(n - 1)
        z = z0 + (z1 - z0) * t
        hw, hh, yo = sf.interpolate(stations, z)
        pts.append((radial * hw * ca, yo + radial * hh * sa, z))
    return pts


def _ring_path(loc, major, n, twist):
    """Closed-ish polyline around loc in a slightly tilted plane."""
    lx, ly, lz = loc
    pts = []
    for i in range(n):
        t = float(i) / float(n - 1)
        ang = t * 2.0 * math.pi
        c, s = math.cos(ang), math.sin(ang)
        pts.append((
            lx + major * c,
            ly + major * s * math.cos(twist),
            lz + major * s * math.sin(twist),
        ))
    return pts


def _cage_tilts(k):
    """Deterministic tilt set for cage k. No random."""
    a = 0.18 * math.sin(float(k) * 1.7)
    b = 0.22 * math.cos(float(k) * 1.3)
    return (
        sf.TORUS_FACE_Z,
        (math.pi * 0.5, a, 0.55 + b),
        (0.40 + a, 0.15, 0.35 + b),
    )


def _arc_tilt(k):
    a = 0.28 * math.sin(float(k) * 0.9)
    c = 0.20 * math.cos(float(k) * 1.1)
    if k % 3 == 0:
        return sf.TORUS_FACE_Z
    if k % 3 == 1:
        return (math.pi * 0.5, a, 0.35 + c)
    return (0.55 + a, 0.12, 0.22 + c)


def _bridge(parts, name, hull_mat, a, b):
    """Matter thread between streams so the island probe reads one body."""
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    dz = b[2] - a[2]
    dist = math.sqrt(dx * dx + dy * dy + dz * dz)
    if dist < 0.06:
        return
    kit.strut(
        parts, name, kit.ROLE_ARMOUR, a, b, hull_mat, 0.08, vertices=6,
    )


def _pierce_mote(parts, name, hull_mat, cell_loc, direction, detail):
    """One sync mote that bites into a cell. Direction is a unit-ish triple."""
    dx, dy, dz = direction
    n = math.sqrt(dx * dx + dy * dy + dz * dz)
    if n < 1e-9:
        return
    reach = sf.CELL_R * 0.82
    loc = (
        cell_loc[0] + reach * dx / n,
        cell_loc[1] + reach * dy / n,
        cell_loc[2] + reach * dz / n,
    )
    nd.sync_mote(parts, name, hull_mat, loc, detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Unknowables energy-procession freighter.

    parts / glow -- object lists the driver joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    l, b, h      -- class envelope 85.0 x 46.75 x 25.5.
    detail       -- 3 (lod0) … 0 (lod3). Primary masses survive at 0.
    """
    d = min(max(int(detail), 0), 3)
    stations = _field_stations(l, b, h)
    z_nose = sf.nose_z(stations)
    z_stern = sf.stern_z(stations)
    # Procession runs most of the length: aft of the tip taper, into the
    # terminal. Stern stations sit short of the driver glow at +l*0.47.
    z_cell0 = z_nose + sf.TIP_LEN + 0.15
    z_term = _terminal_z(stations)
    z_cell1 = z_term

    streams = _stream_offsets(d)
    n_cells = _stream_cell_n(d)
    step = _cage_step(d)
    kept = [
        z_cell0 + (z_cell1 - z_cell0) * float(i) / float(n_cells - 1)
        for i in range(n_cells)
    ]
    cage_zs = [kept[i] for i in range(len(kept)) if i % step == 0]
    if not cage_zs or cage_zs[-1] != kept[-1]:
        cage_zs.append(kept[-1])

    # -- PRIMARY MASSES: cell streams (all LODs) ----------------------------
    for tag, sx, sy in streams:
        for i, z in enumerate(kept):
            nd.energy_cell(
                parts, 'cell-%s-%d' % (tag, i), hull_mat, (sx, sy, z), d,
            )
        for i in range(len(kept) - 1):
            _bridge(
                parts, 'cell-%s-link-%d' % (tag, i),
                hull_mat, (sx, sy, kept[i]), (sx, sy, kept[i + 1]),
            )

    # Bridges at each cage keep parallel streams one body.
    for ci, cz in enumerate(cage_zs):
        locs = [(sx, sy, cz) for _tag, sx, sy in streams]
        for bi in range(len(locs) - 1):
            _bridge(
                parts, 'cell-link-cage-%d-%d' % (ci, bi),
                hull_mat, locs[0], locs[bi + 1],
            )

    # -- TERMINAL node: larger cage + mote cluster (all LODs) ---------------
    term_loc = sf.spine(stations, z_term)
    term_tilts = (
        sf.TORUS_FACE_Z,
        (math.pi * 0.5, 0.12, 0.48),
        (0.38, 0.18, 0.30),
        (0.62, -0.10, 0.22),
    )
    term_keep = 2 if d < 1 else (3 if d < 2 else 4)
    for i in range(term_keep):
        fd.orbital_loop(
            glow, 'loop-term-%d' % i, glow_mat, term_loc,
            _TERM_MAJORS[i], term_tilts[i], d,
        )
    term_lace_n = 8 if d < 1 else 12
    fd.filament_lace(
        glow, 'lace-term', glow_mat,
        _ring_path(term_loc, 4.80, term_lace_n, 0.35), d,
    )
    fd.filament_lace(
        glow, 'lace-term-inner', glow_mat,
        _ring_path(term_loc, 3.10, term_lace_n, -0.22), d,
    )
    # Motes bite the last cell of each stream (non-uniform hull colour).
    _TERM_DIRS = (
        (1.0, 0.0, 0.0), (-1.0, 0.0, 0.0),
        (0.0, 1.0, 0.0), (0.0, -1.0, 0.0),
        (0.70, 0.70, 0.0), (-0.70, 0.55, 0.0),
        (0.60, -0.65, 0.15), (-0.55, -0.60, -0.10),
    )
    mote_dirs = _TERM_DIRS if d >= 3 else (_TERM_DIRS[:4] if d >= 2 else _TERM_DIRS[:2])
    for si, (_tag, sx, sy) in enumerate(streams):
        cell_loc = (sx, sy, z_term)
        for mi, direction in enumerate(mote_dirs):
            _pierce_mote(
                parts, 'mote-term-%d-%d' % (si, mi),
                hull_mat, cell_loc, direction, d,
            )

    # -- TRAVEL TIP (−Z), all LODs ------------------------------------------
    tip = sf.tip_point(stations)
    fd.field_tip(glow, 'tip-travel', glow_mat, tip, sf.TIP_LEN, d)

    # -- REPEATED CAGES along the chain -------------------------------------
    if d >= 1:
        for ci, cz in enumerate(cage_zs):
            if abs(cz - z_term) < 0.35:
                continue
            loc = sf.spine(stations, cz)
            fd.nested_loops(
                glow, 'loop-cage-%d' % ci, glow_mat, loc,
                _CAGE_MAJORS, _cage_tilts(ci), d,
            )
            if d >= 3 and ci % 3 == 0:
                fd.nested_loops(
                    glow, 'loop-anchor-%d' % ci, glow_mat, loc,
                    _ANCHOR_MAJORS, _cage_tilts(ci + 4), d,
                )
            if d >= 2:
                _pierce_mote(
                    parts, 'mote-cage-%d' % ci, hull_mat,
                    (0.0, 0.0, cz), (0.0, 1.0, 0.0), d,
                )

    # -- LACE ENVELOPES (beam + height; not a solid barge) ------------------
    lace_step = {3: 2.40, 2: 3.20, 1: 4.40, 0: 6.00}[d]
    lace_n = _path_n(z_cell0, z_stern, lace_step)
    helix_count = {3: 3, 2: 1, 1: 0, 0: 0}[d]
    for hi in range(helix_count):
        phase = (2.0 * math.pi * hi) / float(helix_count)
        radial = 0.62 + 0.06 * float(hi % 3)
        fd.filament_lace(
            glow, 'lace-helix-%d' % hi, glow_mat,
            _helix_path(stations, z_cell0, z_stern, lace_n, 2.4, phase, radial),
            d,
        )
    mer_count = 2 if d >= 1 else 1
    mer_radial = 0.90
    for mi in range(mer_count):
        ang = (2.0 * math.pi * mi) / float(mer_count) + 0.18
        fd.filament_lace(
            glow, 'lace-meridian-%d' % mi, glow_mat,
            _meridian_path(stations, z_nose, z_stern, lace_n, ang, mer_radial),
            d,
        )
    if d >= 3:
        mer0 = 0.18
        for ci, cz in enumerate(cage_zs):
            hw, hh, yo = sf.interpolate(stations, cz)
            hub = (0.0, 0.0, cz)
            env = (
                mer_radial * hw * math.cos(mer0),
                yo + mer_radial * hh * math.sin(mer0),
                cz,
            )
            fd.tie_spoke(
                glow, 'lace-env-tie-%d' % ci, glow_mat, hub, env, d,
            )

    # -- OUTER LENSING ARCS (silhouette width at every LOD) -----------------
    arc_keep = {3: 5, 2: 3, 1: 2, 0: 1}[d]
    span = z_term - z_cell0
    if arc_keep <= 1:
        arc_zs = [z_cell0 + span * 0.5]
    else:
        arc_zs = [
            z_cell0 + span * float(i) / float(arc_keep - 1)
            for i in range(arc_keep)
        ]
    for ai, az in enumerate(arc_zs):
        hw, _hh, yo = sf.interpolate(stations, az)
        major = hw * 0.94
        if major <= sf.ARC_MINOR:
            continue
        loc = (0.0, yo, az)
        fd.lensing_arc(
            glow, 'arc-lens-%d' % ai, glow_mat, loc, major, _arc_tilt(ai), d,
        )
