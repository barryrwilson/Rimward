"""Gilded Chain shared hull-surface language: loft queries and human module.

Faction charter (bible 4.5): "immaculate procedure concealing horror". The
Chain builds to CLOSED SHELL, ORNAMENT logic (synthesis/21 G6): one continuous
faired curve, edge-only precious trim, long thin light lines seen from deep
inside. There is no exposed frame, no mismatched plating, no visible
mechanism. This module is the measurement layer for that surface: pure math,
no geometry, no Blender, no ship_kit, importable by plain CPython.

Why queries, never typed coordinates: a Chain hull is a long tapering leaf.
Any fitting placed at a typed fraction of beam or height floats the moment the
loft narrows, and floating parts fail the island probe. Every seated construct
in shell.py and hardware.py therefore takes a ``surf`` callable or an anchor
computed here, so each element is measured against the real section at its own
station and skipped where the section no longer reaches. The four factory
functions at the bottom exist so that class authors never hand-write a lambda.

Absolute human module: PORT_LIGHT, GALLERY_PANE, MARKER_LAMP and friends are
fixed world-unit sizes, NEVER multiplied by ship length, beam or height. A
bigger Chain ship carries MORE panes, lamps and hatches at the same pitch,
never bigger ones. Scale is read from repetition at constant human pitch.

World-unit conversion: P = 6.6 world units = 24 m, so 1 u is about 3.64 m
and P/24 = 0.275 u/m. The metre equivalents in the constant comments use this.
"""
import math


# -- Cylinder orientation helpers --------------------------------------------
# Pass to the ``rot`` argument of kit.cyl and friends.
CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)
CYL_ALONG_X = (0.0, math.pi / 2.0, 0.0)


# -- Human-scale constants: ABSOLUTE units, never scaled by ship size --------
# 1 world unit ~= 3.64 m. Each comment gives the metre equivalent.

PORT_LIGHT     = (0.20, 0.13, 0.06)  # cabin port on a deck face — ~0.73 × 0.47 × 0.22 m
FLANK_PORT     = (0.06, 0.13, 0.20)  # same port on a flank face (W and D swapped)
GALLERY_PANE   = (0.34, 0.13, 0.05)  # one lit pane deep inside a gallery — ~1.24 × 0.47 × 0.18 m
MARKER_LAMP    = (0.10, 0.10, 0.06)  # navigation marker lamp — ~0.36 × 0.36 × 0.22 m
STATUS_SLIT    = (0.10, 0.05, 0.04)  # status readout slit — ~0.36 × 0.18 × 0.15 m
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # sealed transfer door, doorW × doorH × recess —
                                     #   ~1.24 × 1.89 × 0.22 m
SALON_DOOR     = (0.34, 0.52, 0.08)  # gallery salon door, deeper recess —
                                     #   ~1.24 × 1.89 × 0.29 m
GRAB_RAIL      = (0.05, 0.30, 0.05)  # boarding handrail post — ~0.18 × 1.09 × 0.18 m
CARGO_CRATE    = (0.85, 0.85, 0.85)  # standard cargo container cube — ~3.09 m edge

COLLAR_BORE    = 0.62   # fleet capture-collar bore radius — ~2.26 m
PORT_SPACING   = 0.34   # cabin-port centre-to-centre pitch — ~1.24 m
PANE_SPACING   = 0.42   # gallery-pane centre-to-centre pitch — ~1.53 m
LAMP_SPACING   = 1.20   # marker-lamp centre-to-centre pitch — ~4.36 m

SCALE_LAP      = 0.06   # fore-aft overlap of one ceramic scale over the next — ~0.22 m
SCALE_PROUD    = 0.035  # how far a scale stands off the loft surface — ~0.13 m
SCALE_BURY     = 0.12   # how deep a scale is buried into the loft — ~0.44 m


# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) describing a
# rounded-octagon cross-section swept by kit.hull_loft. Every function here
# returns a coordinate or a station tuple. None of them create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.62):
    """Return one station chamfered toward a smooth near-oval.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.62`` is a LARGE chamfer coefficient: the Chain is one
    continuous curve, so the default section is a faired near-oval with only a
    short straight run on the flank. The kit clamps the chamfer to 49 % of the
    smaller half-extent.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def edge_section(z, half_w, half_h, y_offset, k=0.30):
    """Return one station with a sharper chamfer than ``fair``.

    Returns the same ``(z, half_w, half_h, y_offset, chamfer)`` tuple shape
    with ``k=0.30``, so the section keeps a broad flat face and a crisper
    corner. Use this for leading edges and the keel blade, where the Chain
    wants a deliberate knife line instead of a soft roll.
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
    rely on this to self-trim runs of scales, panes and lamps, so the value is
    never negative and never clamped to a small positive.
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
    """Return the deck height at station z, x units off the centreline.

    Returns the y coordinate of the top hull surface at that z and x: flat at
    ``y_offset + half_h`` across the flat deck, falling across the chamfer.
    """
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo + hh
    if dx >= hw:
        return yo
    return yo + hh - (dx - (hw - ch))


def bottom_y(stations, z, x=0.0):
    """Return the keel height at station z, x units off the centreline.

    Returns the y coordinate of the bottom hull surface at that z and x.
    """
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo - hh
    if dx >= hw:
        return yo
    return yo - hh + (dx - (hw - ch))


def flat_half(stations, z):
    """Return the half-width of the flat deck at station z, inboard of the chamfer.

    Returns a scalar x extent — the beam over which the top face is horizontal.
    Never geometry.
    """
    hw, hh, yo, ch = section(stations, z)
    return hw - clamped(hw, hh, ch)


def straight_top(stations, z):
    """Return the highest y at which the flank is still vertical at station z.

    Returns a y coordinate. Above this point the section chamfer begins.
    """
    hw, hh, yo, ch = section(stations, z)
    return yo + hh - clamped(hw, hh, ch)


def straight_bottom(stations, z):
    """Return the lowest y at which the flank is still vertical at station z.

    Returns a y coordinate. Below this point the section chamfer begins.
    """
    hw, hh, yo, ch = section(stations, z)
    return yo - hh + clamped(hw, hh, ch)


def collar_ring(stations, z, over=0.05):
    """Return (half_w, half_h, y_offset, chamfer) for a gold collar ring.

    The ring stands ``over`` world units clear of the local section on both the
    beam and height axes, so a ring primitive built from it always clears the
    underlying loft while still hugging it as a hairline collar. The chamfer is
    reclamped against the expanded extents.

    Returns a coordinate tuple of four scalars, never geometry. The caller
    feeds it to shell.collar_band, which places ribs on the flat faces only.
    """
    hw, hh, yo, ch = section(stations, z)
    hw2 = hw + over
    hh2 = hh + over
    ch2 = clamped(hw2, hh2, ch)
    return (hw2, hh2, yo, ch2)


def flank_anchor(stations, z, y, inset):
    """Return the x-centre for a fitting of half-thickness ``inset`` seated in the flank.

    Returns the x coordinate at which the centre of a fitting must sit so that
    the fitting laps inboard of the flank surface: ``flank_x(z, y) - inset``.
    Returns 0.0 when ``flank_x`` returns 0.0 (the y is outside the hull at
    that z), signalling the caller to place nothing there. Mirror with a
    negative sign for the port side (starboard is positive x).
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
# ``stations[0][0] .. stations[-1][0]`` — with the interpolation clamp in
# ``section`` alone, a run past the last station would seat on the end
# section and float past the taper; the 0.0 makes the run self-trim instead.
# A closure also returns 0.0 wherever the underlying query yields 0.0 or a
# non-positive extent, never a negative coordinate.
# ---------------------------------------------------------------------------

def surf_flank(stations, y, inset=0.0):
    """Return callable(z) -> half-beam at height ``y`` minus ``inset``, or 0.0.

    Use for flank-seated runs: scale courses, gallery slots, marker lamps.
    """
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
    """Return callable(z) -> deck height at offset ``x`` minus ``drop``, or 0.0.

    Use for dorsal runs: scale fields, spire roots, deck edging.
    """
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
    """Return callable(z) -> keel height at offset ``x`` plus ``rise``, or 0.0.

    Use for ventral runs: keel blades, pylon roots, capture collars.
    """
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
    """Return callable(z) -> flat deck half-width minus ``inset``, or 0.0.

    Use for anything that must stay on the horizontal deck, inboard of the
    chamfer: deck course extents, panel runs.
    """
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
