"""Unknowables shared field-envelope queries. Pure math. No geometry.

This module is the measurement layer for a traveling energy field: no
Blender, no ship_kit, importable by plain CPython. Class authors seat
filaments, cells and loops from these numbers. They never type a fraction
of ship l, b or h.

THE FORM IS LACE, NOT FOG AND NOT A HULL. Stations describe a traveling
field volume that tapers to a bright point in the travel direction (ship
-Z, the engine nose). They do not describe plates, a prow, or a keel.

Absolute module: CELL_R, LOOP_MINOR, ARC_MINOR, FILAMENT_R, CELL_PITCH and
TIP_LEN are fixed world-unit sizes, NEVER multiplied by ship length, beam
or height. A larger field carries MORE cells and MORE threads at the same
pitch, never bigger ones.

World-unit conversion: P = 6.6 world units = 24 m, so 1 u is about 3.64 m.
"""
import math


# -- Cylinder orientation helpers --------------------------------------------
# Pass to the ``rot`` argument of kit.cyl and friends.
CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)
CYL_ALONG_X = (0.0, math.pi / 2.0, 0.0)

# Torus default axis is ship +Y. Face ship +Z (travel / stern) with this.
TORUS_FACE_Z = (math.pi * 0.5, 0.0, 0.0)


# -- Absolute field module: NEVER scaled by ship size ------------------------
# 1 world unit ~= 3.64 m. Each comment gives the metre equivalent.

CELL_R        = 0.26   # dark glossy energy-cell radius — ~0.95 m
CELL_PITCH    = 0.70   # nominal cell centre pitch — ~2.55 m; procession
                       #   tightens this so consecutive cells overlap
CELL_OVERLAP  = 0.10   # minimum solid overlap between consecutive cells

LOOP_MINOR    = 0.045  # orbital-loop tube radius — ~0.16 m
ARC_MINOR     = 0.03   # outer lensing-arc tube radius — ~0.11 m
FILAMENT_R    = 0.02   # luminous thread radius — ~0.07 m; the long axis
                       #   of any emitted part must still reach 0.06
TIP_LEN       = 1.40   # pointed travel-taper length — ~5.1 m
MOTE_R        = 0.036  # sync-mote radius — ~0.13 m (extent 0.072 > 0.06)

# Relief from src/game/ship-scale.js FACTION_PROPORTION_RELIEF.unknowables
MIN_LENGTH_OVER_BEAM   = 0.70
MAX_HEIGHT_OVER_LENGTH = 1.15
MIN_BEAM_OVER_LENGTH   = 0.45


# Reference traveling field. Nose is -Z (bright point). Stern is +Z (cyan).
# Spans: L = 8.00, B = 4.00, H = 4.00
#   L/B = 2.00 >= 0.70, B/L = 0.50 >= 0.45, H/L = 0.50 <= 1.15
DEFAULT_STATIONS = (
    (-4.20, 0.05, 0.05, 0.0),
    (-3.50, 0.32, 0.26, 0.0),
    (-2.20, 1.05, 0.90, 0.0),
    (-0.60, 1.70, 1.55, 0.0),
    ( 0.90, 2.00, 2.00, 0.0),
    ( 2.40, 1.55, 1.45, 0.0),
    ( 3.80, 0.48, 0.42, 0.0),
)


# ---------------------------------------------------------------------------
# Envelope queries
#
# A station is (z, half_w, half_h, y_offset) describing an elliptical field
# section. Every function here returns a coordinate or a tuple. None of them
# create geometry.
# ---------------------------------------------------------------------------

def station(z, half_w, half_h, y_offset=0.0):
    """Return one field station ``(z, half_w, half_h, y_offset)``."""
    return (z, half_w, half_h, y_offset)


def _parts(st):
    return (st[1], st[2], st[3])


def interpolate(stations, z):
    """Interpolate ``(half_w, half_h, y_offset)`` at ship z.

    Returns the linear interpolation between the two bracketing stations, or
    clamps to the first or last station when ``z`` is out of range.
    Stations must run in increasing z (nose to stern).
    """
    if z <= stations[0][0]:
        return _parts(stations[0])
    if z >= stations[-1][0]:
        return _parts(stations[-1])
    for a, b in zip(stations, stations[1:]):
        if a[0] <= z <= b[0]:
            span = b[0] - a[0]
            t = 0.0 if span == 0.0 else (z - a[0]) / span
            return (
                a[1] + t * (b[1] - a[1]),
                a[2] + t * (b[2] - a[2]),
                a[3] + t * (b[3] - a[3]),
            )
    return _parts(stations[-1])


def radius_at(stations, z):
    """Return the field half-extent at z (ellipse RMS radius), or 0.0."""
    hw, hh, _yo = interpolate(stations, z)
    if hw <= 0.0 and hh <= 0.0:
        return 0.0
    return math.sqrt(0.5 * (hw * hw + hh * hh))


def spine(stations, z):
    """Return the centreline point ``(0, y_offset, z)`` at station z."""
    _hw, _hh, yo = interpolate(stations, z)
    return (0.0, yo, z)


def nose_z(stations):
    """Return the most-forward station z (travel tip, ship -Z)."""
    return min(st[0] for st in stations)


def stern_z(stations):
    """Return the most-aft station z (cyan wake, ship +Z)."""
    return max(st[0] for st in stations)


def tip_point(stations):
    """Return the pointed travel-tip coordinate on the spine."""
    return spine(stations, nose_z(stations))


def envelope_spans(stations):
    """Return ``(length, beam, height)`` of the field volume.

    Beam is twice the largest half-width. Height is the largest vertical
    span of the local ellipse (2 * half_h) across the y_offset range.
    """
    z0 = nose_z(stations)
    z1 = stern_z(stations)
    max_hw = 0.0
    y_lo = math.inf
    y_hi = -math.inf
    for st in stations:
        hw, hh, yo = st[1], st[2], st[3]
        if hw > max_hw:
            max_hw = hw
        if yo - hh < y_lo:
            y_lo = yo - hh
        if yo + hh > y_hi:
            y_hi = yo + hh
    return (z1 - z0, 2.0 * max_hw, y_hi - y_lo)


def envelope_relief_ok(stations):
    """Return True when the volume meets FACTION_PROPORTION_RELIEF.unknowables."""
    length, beam, height = envelope_spans(stations)
    if length <= 0.0 or beam <= 0.0:
        return False
    if length / beam < MIN_LENGTH_OVER_BEAM:
        return False
    if height / length > MAX_HEIGHT_OVER_LENGTH:
        return False
    if beam / length < MIN_BEAM_OVER_LENGTH:
        return False
    return True


def flank_x(stations, z, y):
    """Return the field half-beam at station z and height y.

    The section is a true ellipse. Returns 0.0 when ``y`` is outside the
    section so a run past the taper self-trims.
    """
    hw, hh, yo = interpolate(stations, z)
    if hw <= 0.0 or hh <= 0.0:
        return 0.0
    dy = abs(y - yo)
    if dy >= hh:
        return 0.0
    return hw * math.sqrt(1.0 - (dy / hh) * (dy / hh))


def top_y(stations, z, x=0.0):
    """Return the dorsal field height at station z, x units off the centreline."""
    hw, hh, yo = interpolate(stations, z)
    if hw <= 0.0 or hh <= 0.0:
        return yo
    dx = abs(x)
    if dx >= hw:
        return yo
    return yo + hh * math.sqrt(1.0 - (dx / hw) * (dx / hw))


def bottom_y(stations, z, x=0.0):
    """Return the ventral field height at station z, x units off the centreline."""
    hw, hh, yo = interpolate(stations, z)
    if hw <= 0.0 or hh <= 0.0:
        return yo
    dx = abs(x)
    if dx >= hw:
        return yo
    return yo - hh * math.sqrt(1.0 - (dx / hw) * (dx / hw))


# ---------------------------------------------------------------------------
# Surface-callback factories
#
# Each returns a closure over ``stations``. Every closure returns 0.0 for z
# outside the envelope, and 0.0 wherever the underlying query is not a
# positive extent. Class authors never hand-write a lambda.
# ---------------------------------------------------------------------------

def surf_flank(stations, y, inset=0.0):
    """Return callable(z) -> half-beam at height ``y`` minus ``inset``, or 0.0."""
    z0 = nose_z(stations)
    z1 = stern_z(stations)

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        fx = flank_x(stations, z, y) - inset
        if fx <= 0.0:
            return 0.0
        return fx
    return at


def surf_top(stations, x=0.0, drop=0.0):
    """Return callable(z) -> dorsal height at offset ``x`` minus ``drop``, or 0.0."""
    z0 = nose_z(stations)
    z1 = stern_z(stations)

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, _yo = interpolate(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        return top_y(stations, z, x) - drop
    return at


def surf_bottom(stations, x=0.0, rise=0.0):
    """Return callable(z) -> ventral height at offset ``x`` plus ``rise``, or 0.0."""
    z0 = nose_z(stations)
    z1 = stern_z(stations)

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, _yo = interpolate(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        return bottom_y(stations, z, x) + rise
    return at


def surf_radius(stations, inset=0.0):
    """Return callable(z) -> field RMS radius minus ``inset``, or 0.0."""
    z0 = nose_z(stations)
    z1 = stern_z(stations)

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        r = radius_at(stations, z) - inset
        if r <= 0.0:
            return 0.0
        return r
    return at


def surf_half_w(stations, inset=0.0):
    """Return callable(z) -> half-width minus ``inset``, or 0.0."""
    z0 = nose_z(stations)
    z1 = stern_z(stations)

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, _hh, _yo = interpolate(stations, z)
        w = hw - inset
        if w <= 0.0:
            return 0.0
        return w
    return at


def surf_half_h(stations, inset=0.0):
    """Return callable(z) -> half-height minus ``inset``, or 0.0."""
    z0 = nose_z(stations)
    z1 = stern_z(stations)

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        _hw, hh, _yo = interpolate(stations, z)
        h = hh - inset
        if h <= 0.0:
            return 0.0
        return h
    return at


def cell_link_pitch():
    """Return the procession pitch that keeps overlap above CELL_OVERLAP.

    CELL_PITCH is the nominal human-module pitch. Consecutive cells must
    overlap by more than CELL_OVERLAP, so this returns the tighter of the
    two. Class authors ask for MORE cells, never bigger cells.
    """
    tight = 2.0 * CELL_R - CELL_OVERLAP - 0.02
    if tight < CELL_PITCH:
        return tight
    return CELL_PITCH
