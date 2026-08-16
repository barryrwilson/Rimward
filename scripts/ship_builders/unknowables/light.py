"""Unknowables Light — MOTE.

Bible §4.7: "Three nested loops around a handful of cells, with a pointed
distortion in the direction of travel. Compact and readable."

Plate: docs/FactionExamples/07-unknowables-ship.png — ephemeral lace, not
haze and not a hull. A compact traveling field tapers to a bright POINT
in the travel direction (engine nose −Z). Dark glossy ENERGY CELLS sit
on the spine. Three nested ORBITAL LOOPS wrap the cell cluster. Thin
cyan FILAMENTS follow the envelope. The driver engine glow at z = l*0.47
is the cyan wake; the field ends just short of that bead.

Envelope (driver): l = 7.8, b = 3.276, h = 1.872.
Authored largest-dimension target: ~6.8 (span band 4.08–9.52).
Hull vertex band 4 000–25 000.

BODY PLAN
---------
Stations describe a plump traveling volume (mote, not a needle): pointed
nose, fullest mid-body, taper into the wake. Relief:
    L/B >= 0.70, H/L <= 1.15, B/L >= 0.45.

Seating is from surface.py queries. Cell radius stays CELL_R; a larger
field would carry MORE cells, never bigger ones.

- a handful of overlapping energy cells on the spine (absolute CELL_R);
- three nested loops at the cell cluster, majors from envelope radii,
  mutually tilted;
- field_tip at the nose, overlapping the forward cells;
- filament_lace along the envelope, each run starting inside a cell;
- two sync motes (white-gold) for scale and a second hull colour.

LOD LADDER
----------
detail=3  full: cells, motes, three loops, tip, full lace (dorsal,
          ventral, both flanks, two wraps).
detail=2  fewer threads: cells, motes, loops, tip, dorsal + flank lace.
detail=1  primary: cells, motes, loops, tip.
detail=0  masses only: cells and motes.
"""
import math

from . import surface as sf
from . import field as fd
from . import nodes as nd


# ===========================================================================
# STATION LIST — authored first; every anchor below is read off it.
# ===========================================================================

def _light_stations(l, b, h):
    """Compact traveling-field stations. Nose −Z, stern just short of wake.

    The driver places engine glow at z = l*0.47. Stern sits 0.12 short of
    that so the bead reads as wake. Field length is the ~6.8 span target.
    Mid half-width fills the driver beam; mid half-height stays plump so
    the volume is a mote, not a ribbon.
    """
    z_stern = l * 0.47 - 0.12
    z_nose = z_stern - 6.80
    span = z_stern - z_nose
    half_b = b * 0.50
    half_h = max(h * 0.50, half_b * 0.82)

    def z_at(t):
        return z_nose + span * t

    return [
        sf.station(z_at(0.00), 0.04, 0.04, 0.0),
        sf.station(z_at(0.08), 0.22, 0.20, 0.0),
        sf.station(z_at(0.22), 0.88, 0.74, 0.0),
        sf.station(z_at(0.42), half_b, half_h, 0.0),
        sf.station(z_at(0.62), half_b * 0.88, half_h * 0.86, 0.0),
        sf.station(z_at(0.82), half_b * 0.38, half_h * 0.36, 0.0),
        sf.station(z_at(1.00), 0.16, 0.14, 0.0),
    ]


def _cell_span(stations):
    """Return (z0, z1) for a handful of overlapping spine cells.

    Starts inside the tip base so the travel taper and the first cell
    share volume. Six cells at CELL_PITCH-tight spacing.
    """
    z0 = sf.nose_z(stations) + sf.TIP_LEN * 0.70
    z1 = z0 + sf.cell_link_pitch() * 5.0
    z_lim = sf.stern_z(stations) - 0.45
    if z1 > z_lim:
        z1 = z_lim
    return z0, z1


def _zs(z0, z1, n):
    if n < 2:
        return [z0]
    return [z0 + (z1 - z0) * (float(i) / float(n - 1)) for i in range(n)]


def _start_in_cell(stations, z_cell, pts):
    """Prepend the spine point inside the cell at z_cell."""
    if not pts:
        return pts
    origin = sf.spine(stations, z_cell)
    return [origin] + list(pts)


def _path_dorsal(stations, z0, z1, n):
    pts = []
    for z in _zs(z0, z1, n):
        pts.append((0.0, sf.top_y(stations, z), z))
    return _start_in_cell(stations, z0, pts)


def _path_ventral(stations, z0, z1, n):
    pts = []
    for z in _zs(z0, z1, n):
        pts.append((0.0, sf.bottom_y(stations, z), z))
    return _start_in_cell(stations, z0, pts)


def _path_flank(stations, z0, z1, n, side):
    pts = []
    for z in _zs(z0, z1, n):
        _hw, _hh, yo = sf.interpolate(stations, z)
        fx = sf.flank_x(stations, z, yo)
        if fx <= 0.04:
            continue
        pts.append((side * fx, yo, z))
    return _start_in_cell(stations, z0, pts)


def _path_wrap(stations, z0, z1, n, turns, phase):
    """Deterministic envelope wrap. First sample sits in the cell."""
    pts = []
    for i, z in enumerate(_zs(z0, z1, n)):
        hw, hh, yo = sf.interpolate(stations, z)
        if hw <= 0.04 or hh <= 0.04:
            continue
        t = float(i) / float(max(n - 1, 1))
        ang = phase + turns * 2.0 * math.pi * t
        pts.append((
            hw * math.cos(ang) * 0.92,
            yo + hh * math.sin(ang) * 0.92,
            z,
        ))
    return _start_in_cell(stations, z0, pts)


def _loop_rig(stations, z_mid):
    """Three majors from envelope radii, mutually tilted."""
    hw, hh, _yo = sf.interpolate(stations, z_mid)
    r = sf.radius_at(stations, z_mid)
    inner = min(hw, hh)
    outer = max(hw, hh)
    majors = (
        max(sf.CELL_R + 0.28, inner * 0.85),
        max(r, inner + 0.18),
        max(outer, r + 0.16),
    )
    tilts = (
        sf.TORUS_FACE_Z,
        (math.pi * 0.50, 0.35, 0.55),
        (0.55, 0.40, 0.22),
    )
    return majors, tilts


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Unknowables mote (light class).

    parts    -- hull channel: energy cells and sync motes.
    glow     -- field channel: loops, lace, travel tip.
    l, b, h  -- class length, beam, height from the driver
                (7.8, 3.276, 1.872).
    detail   -- 3 full  2 fewer threads  1 loops+cells+tip  0 masses.
    """
    stations = _light_stations(l, b, h)
    z0, z1 = _cell_span(stations)
    z_mid = 0.5 * (z0 + z1)
    z_wake = sf.stern_z(stations)
    mid = sf.spine(stations, z_mid)
    fore = sf.spine(stations, z0)

    # ── MASSES (always, detail 0+) ──────────────────────────────────────
    nd.cell_procession(
        parts, 'cell', hull_mat, z0, z1, mid[0], mid[1], detail,
    )
    nd.sync_mote(
        parts, 'mote-core', hull_mat,
        (mid[0], mid[1] + sf.CELL_R + sf.MOTE_R * 0.35, mid[2]),
        detail,
    )
    nd.sync_mote(
        parts, 'mote-fore', hull_mat,
        (fore[0] + sf.CELL_R * 0.55, fore[1] + sf.CELL_R * 0.35, fore[2]),
        detail,
    )

    if detail < 1:
        return

    # ── PRIMARY FIELD (detail 1+) ───────────────────────────────────────
    majors, tilts = _loop_rig(stations, z_mid)
    fd.nested_loops(
        glow, 'loop', glow_mat, mid, majors, tilts, detail,
    )
    fd.field_tip(
        glow, 'tip', glow_mat, sf.tip_point(stations), sf.TIP_LEN, detail,
    )

    if detail < 2:
        return

    # ── LACE (detail 2 fewer threads, detail 3 full) ────────────────────
    n = 10 if detail >= 3 else 7
    z_end = z_wake - 0.18
    fd.filament_lace(
        glow, 'lace-dorsal', glow_mat,
        _path_dorsal(stations, z0, z_end, n), detail,
    )
    fd.filament_lace(
        glow, 'lace-starboard', glow_mat,
        _path_flank(stations, z0, z_end, n, 1.0), detail,
    )
    fd.filament_lace(
        glow, 'lace-port', glow_mat,
        _path_flank(stations, z0, z_end, n, -1.0), detail,
    )

    if detail < 3:
        return

    fd.filament_lace(
        glow, 'lace-ventral', glow_mat,
        _path_ventral(stations, z0, z_end, n), detail,
    )
    fd.filament_lace(
        glow, 'lace-wrap-a', glow_mat,
        _path_wrap(stations, z0, z_end, 12, 0.85, 0.20), detail,
    )
    fd.filament_lace(
        glow, 'lace-wrap-b', glow_mat,
        _path_wrap(stations, z0, z_end, 12, 0.85, 0.20 + math.pi), detail,
    )
