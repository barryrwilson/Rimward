"""Assembly shared hull-surface language: loft queries and human module.

Faction charter (bible 4.8): inheritance copied until it became civilization.
The Assembly builds to REPEATED MODULE logic (synthesis/21 G6): one part, many
copies, radial and linear arrays, visible joints. Variation is systematic
copy-drift, not human patchwork. This module is the measurement layer: pure
math, no geometry, no Blender, no ship_kit, importable by plain CPython.

Why queries, never typed coordinates: a spine loft narrows at the bow and
swells at a fan hub. A fitting placed at a typed fraction of beam or height
floats the moment the section changes, and floating parts fail the island
probe. Class authors seat every construct with a query or a ``surf`` callable
from the factories below.

Absolute human module and Assembly module sizes are fixed world units, NEVER
multiplied by ship length, beam or height. A bigger Assembly ship carries
MORE copies at the same pitch, never bigger copies. The fan as a WHOLE may
grow with class (it is the §G2 outline-breaker); the individual petal module
stays one size.

World-unit conversion: P = 6.6 world units = 24 m, so 1 u is about 3.64 m
and P/24 = 0.275 u/m. The metre equivalents in the constant comments use this.
"""
import math


# -- Cylinder orientation helpers --------------------------------------------
# Pass to the ``rot`` argument of kit.cyl and friends.
# Default kit.cyl (0,0,0) is along Blender Z = ship +Y.
CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)
CYL_ALONG_X = (0.0, math.pi / 2.0, 0.0)
CYL_ALONG_Y = (0.0, 0.0, 0.0)


# -- Human-scale constants: ABSOLUTE units, never scaled by ship size --------
# Sourced from src/game/ship-scale.js HUMAN. 1 world unit ~= 3.64 m.

PORT_LIGHT     = (0.20, 0.13, 0.06)  # cabin port on a deck face
FLANK_PORT     = (0.06, 0.13, 0.20)  # same port on a flank face (W and D swapped)
MARKER_LAMP    = (0.10, 0.10, 0.06)  # work / nav lamp
STATUS_SLIT    = (0.10, 0.05, 0.04)  # status readout slit
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # suited crew hatch, doorW x doorH x recess
GRAB_RAIL      = (0.05, 0.30, 0.05)  # rail post, railH = 0.30
CARGO_CRATE    = (0.85, 0.85, 0.85)  # standard cargo cube

COLLAR_BORE    = 0.62   # fleet docking-collar bore radius
PORT_SPACING   = 0.34   # cabin-port centre-to-centre pitch
LAMP_SPACING   = 1.20   # lamp centre-to-centre pitch


# -- Assembly module constants: ABSOLUTE, one size for every class -----------
# A bigger ship carries MORE of these, never bigger ones.

OPTIC_R          = 0.22   # teal iris radius on a daughter / petal
OPTIC_COLLAR_R   = 0.30   # dark collar around that iris
OPTIC_IRIS_R     = 0.13   # glow disc inside the collar
OPTIC_DEPTH      = 0.12   # collar depth along the facing axis

FAB_SOCKET_R         = 0.72  # host aperture a daughter can nest in
FAB_SOCKET_COLLAR_R  = 0.92
FAB_SOCKET_DEPTH     = 0.28

DAUGHTER_BODY_R  = 1.35   # sphere radius; with petals the craft sits in the light band

PETAL_LEN        = 1.20   # instrument petal length (daughter / survey)
PETAL_W          = 0.34
PETAL_T          = 0.10

FAN_PETAL_LEN    = 1.55   # outline-breaker petal module — one size, many copies
FAN_PETAL_W      = 0.50
FAN_PETAL_T      = 0.12

JOINT_THICK      = 0.14   # visible joint ring depth along the spine
JOINT_MINOR      = 0.055  # torus tube / ring half-thickness

ORANGE_PATCH     = (0.58, 0.09, 0.44)  # one faded-orange replacement block

ANTENNA_R        = 0.038  # mast radius (diameter 0.076, above the 0.06 voxel)
ANTENNA_H        = 1.45   # default mast height

SHELL_THICK      = 0.16   # clamped shell thickness when the caller omits size


# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) describing a
# rounded-octagon cross-section swept by kit.hull_loft. Every function here
# returns a coordinate or a station tuple. None of them create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.42):
    """Return one station chamfered toward a rounded octagon.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.42`` keeps a visible flat on each face — the
    Assembly is a structural spine, not a faired leaf. The kit clamps the
    chamfer to 49 % of the smaller half-extent.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def section(stations, z):
    """Interpolate (half_w, half_h, y_offset, chamfer) at ship z.

    Returns the linear interpolation between the two bracketing stations, or
    clamps to the first or last station when ``z`` is out of range.
    """
    if z <= stations[0][0]:
        return stations[0][1:]
    if z >= stations[-1][0]:
        return stations[-1][1:]
    for a, b in zip(stations, stations[1:]):
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            return tuple(a[i + 1] + t * (b[i + 1] - a[i + 1]) for i in range(4))
    return stations[-1][1:]


def clamped(hw, hh, ch):
    """Return the chamfer the kit will actually cut after its internal clamp.

    Returns a scalar in world units — a coordinate, never geometry.
    """
    return min(ch, hw * 0.49, hh * 0.49)


def flank_x(stations, z, y):
    """Return the hull half-beam at station z and height y.

    Returns the x coordinate of the outer hull surface at that z and y:
    ``half_w`` inside the straight flank run, then falling off linearly across
    the chamfer. Returns 0.0 when ``y`` is above or below the section — callers
    rely on this to self-trim runs, so the value is never negative.
    """
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dy = abs(y - yo)
    if dy <= hh - ch:
        return hw
    if dy >= hh:
        return 0.0
    return hw - (dy - (hh - ch))


def top_y(stations, z, x=0.0):
    """Return the deck height at station z, x units off the centreline."""
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo + hh
    if dx >= hw:
        return yo
    return yo + hh - (dx - (hw - ch))


def bottom_y(stations, z, x=0.0):
    """Return the keel height at station z, x units off the centreline."""
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo - hh
    if dx >= hw:
        return yo
    return yo - hh + (dx - (hw - ch))


def flat_half(stations, z):
    """Return the half-width of the flat deck at station z, inboard of the chamfer."""
    hw, hh, yo, ch = section(stations, z)
    return hw - clamped(hw, hh, ch)


def straight_top(stations, z):
    """Return the highest y at which the flank is still vertical at station z."""
    hw, hh, yo, ch = section(stations, z)
    return yo + hh - clamped(hw, hh, ch)


def straight_bottom(stations, z):
    """Return the lowest y at which the flank is still vertical at station z."""
    hw, hh, yo, ch = section(stations, z)
    return yo - hh + clamped(hw, hh, ch)


def seam_ring(stations, z, over=0.06):
    """Return (half_w, half_h, y_offset, chamfer) for a joint ring at station z.

    The ring stands ``over`` world units clear of the local section on both
    axes so a primitive built from it intersects the loft. Returns a
    coordinate tuple, never geometry.
    """
    hw, hh, yo, ch = section(stations, z)
    hw2 = hw + over
    hh2 = hh + over
    ch2 = clamped(hw2, hh2, ch)
    return (hw2, hh2, yo, ch2)


def flank_anchor(stations, z, y, inset):
    """Return the x-centre for a fitting of half-thickness ``inset`` in the flank.

    Returns ``flank_x(z, y) - inset``, or 0.0 when the y is outside the hull.
    Mirror with a negative sign for the port side (starboard is positive x).
    """
    fx = flank_x(stations, z, y)
    if fx == 0.0:
        return 0.0
    return fx - inset


# ---------------------------------------------------------------------------
# Surface-callback factories
#
# Each returns a closure over ``stations`` answering one coordinate per
# station. Every closure returns 0.0 for z outside
# ``stations[0][0] .. stations[-1][0]`` so a run self-trims past a taper.
# ---------------------------------------------------------------------------

def surf_flank(stations, y, inset=0.0):
    """Return callable(z) -> half-beam at height ``y`` minus ``inset``, or 0.0."""
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        fx = flank_x(stations, z, y) - inset
        if fx <= 0.0:
            return 0.0
        return fx
    return at


def surf_top(stations, x=0.0, drop=0.0):
    """Return callable(z) -> deck height at offset ``x`` minus ``drop``, or 0.0."""
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, yo, ch = section(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        return top_y(stations, z, x) - drop
    return at


def surf_bottom(stations, x=0.0, rise=0.0):
    """Return callable(z) -> keel height at offset ``x`` plus ``rise``, or 0.0."""
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, yo, ch = section(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        return bottom_y(stations, z, x) + rise
    return at


def surf_flat(stations, inset=0.0):
    """Return callable(z) -> flat deck half-width minus ``inset``, or 0.0."""
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        fw = flat_half(stations, z) - inset
        if fw <= 0.0:
            return 0.0
        return fw
    return at
