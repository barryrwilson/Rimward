"""Ferrous Hegemony shared hull-surface language: loft queries and modules.

Bible docs/FactionShipDesignBible.md §4.2: "disciplined military mass,
exact symmetry, protected citizens behind a hard line." Fleet DNA: blunt
reinforced prows; layered citadel armor; paired formal weapon housings;
iron gray; restrained crimson recognition bands; small brass service
honors. Rescue is always present. Symmetry is doctrine.

Construction logic (synthesis/21 §G6): REPEATED MODULE, ARMOURED.
20–40 armour ribs at even pitch. Turret modules repeated on a rail.

Silhouette family (rule 6): segmented cigar / monumental iron wedge +
citadel. Hold this family for later classes.

§G2 outline-breaker (≥ 15 % of hull length): the ARMOUR RIB FLARE.
Grow REACH with class later. NEVER inflate rib thickness as the scale
cue. Default RIB_FLARE_REACH is 1.80 ≥ 15 % of cutter length 11.0 = 1.65.

Three zones (rule 1): bow 15–25 % / mid 45–60 % / stern 20–30 %.
No plate course crosses a zone boundary.

This module is the measurement layer: pure math, no geometry, no
Blender, no ship_kit, importable by plain CPython.

Absolute HUMAN sizes are NEVER multiplied by ship l, b or h. A bigger
Ferrous ship carries MORE ribs, batteries and lamps at the same pitch,
never bigger ones.

Size convention (scripts/ship_kit.py source): kit.box / plate_course /
plate_grid / panel_lines / greeble_field / chamfer_block / taper_block /
wedge / hull_loft take FULL extents. kit.cyl / torus / strut take real
radius / depth. kit.sphere scale is a RADIUS. Station tuples here use
half_w / half_h. Absolute constants go into kit.box UNHALVED.

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
# Ported from the pilot ferrous.py private names. 1 world unit ~= 3.64 m.

RESCUE_PANNIER = (0.45, 0.62, 1.20)  # rescue equipment pannier housing
RESCUE_LAMP    = (0.12, 0.06, 0.06)  # rescue / status indicator lamp
PORT_LIGHT     = (0.22, 0.10, 0.04)  # bridge / cabin port light
STATUS_SLIT    = (0.10, 0.05, 0.04)  # engine-status readout slit
PORT_SPACING   = 0.35                # centre-to-centre window spacing
LAMP_SPACING   = 1.20                # HUMAN.lampGap — marker-lamp pitch

MARKER_LAMP    = (0.10, 0.10, 0.06)  # navigation marker — ~0.36 × 0.36 × 0.22 m
FLANK_PORT     = (0.04, 0.10, 0.22)  # PORT_LIGHT on a flank face (W/D swapped)
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # suited crew hatch — ~1.24 × 1.89 × 0.22 m
GRAB_RAIL      = (0.05, 0.30, 0.05)  # boarding handrail post
COLLAR_BORE    = 0.62                # fleet docking-collar bore radius


# -- Ferrous module constants: ABSOLUTE, one size for every class ------------
# Grow the §G2 rib flare with REACH. Never inflate rib thickness.

ARMOUR_RIB       = (0.12, 0.36, 0.22)  # thickness, height, chord
ARMOUR_RIB_T     = 0.12                # thickness — NEVER the scale cue
ARMOUR_RIB_PITCH = 0.22                # even rib pitch along a run

RIB_FLARE_REACH = 1.80   # default long span — ≥ 1.65 (15 % of cutter 11.0)
RIB_FLARE_T     = 0.12   # same thickness as a rib
RIB_FLARE_W     = 0.42   # face height of the flare plate

CITADEL_PLATE   = (1.20, 0.72, 1.60)  # layered citadel armour block
ARMOUR_COURSE   = (0.18, 0.56, 2.40)  # one chamfered armour course

TURRET_MODULE   = (0.52, 0.36, 0.52)  # one formal battery housing
TURRET_BARREL_R = 0.07
TURRET_BARREL_L = 0.38
RAIL_W          = 0.16
RAIL_H          = 0.10

RECOGNITION_BAND = (0.18, 0.72, 1.10)  # restrained crimson prow band
HONOR_PLATE      = (0.28, 0.18, 0.06)  # small brass service honor

HANGAR_BERTH = (1.80, 1.10, 2.40)  # ventral / flank berth for a nested light
RADIATOR     = (0.10, 1.20, 1.80)  # flat thermal slab


# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) describing a
# rounded-octagon cross-section swept by kit.hull_loft. Every function here
# returns a coordinate or a station tuple. None of them create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.28):
    """Return one station chamfered toward a faceted iron cigar / wedge.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.28`` keeps a broad flat face and a crisp corner —
    Ferrous is layered iron, not a faired leaf. The kit clamps the chamfer
    to 49 % of the smaller half-extent.
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
    rely on this to self-trim runs of ribs, bands and lamps, so the value is
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


def surf_flank(stations, y, inset=0.0):
    """Return callable(z) -> half-beam at height ``y`` minus ``inset``, or 0.0.

    Use for flank-seated runs: rib courses, recognition bands, marker lamps.
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

    Use for dorsal runs: citadel plates, battery rails, deck honors.
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

    Use for ventral runs: rescue hatches, hangar berths, keel skirts.
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
    chamfer: citadel courses, panel runs.
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
