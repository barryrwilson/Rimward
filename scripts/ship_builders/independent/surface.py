"""Independent (Drifters) shared hull-surface language: loft queries and modules.

Bible §5.1: commercially available frames, secondhand modules, practical
field repairs, neutral grays, occasional old-looking commercial parts
(NOT captured other-faction signatures), warm universal navigation
lights. Independent does NOT mean random junk.

docs/FactionVisualUpdatePlan.md: "the lash-up. No two plates from the
same yard: donated hull sections bolted over a working frame, external
cargo netted down, patch welds, a single amber lamp run. Grey value
contrast comes from the weathering ladder, not from colour."

Construction logic (assigned; synthesis/21 §G6 has no Independent row):
REPEATED COMMERCIAL MODULE / LASH-UP. A civilian chassis or tug core
receives bolted secondhand modules and standardized ISO crates. Joints,
patch plates and clamp straps are the surface language. Refuse: closed
ornamental shell, grown body, field lace, ritual cans, identical radial
fans, salvage-boom captured Banner parts.

Silhouette family (rule 6): spine-and-pods. Civilian chassis along Z,
bolted modules/crates as pods. Hold this family across future classes.

§G2 outline-breaker (≥ 15 % of hull length): the STANDARDIZED CRATE
RACK (and/or one bolted secondhand owner-module). Grow rack LENGTH with
class later; NEVER inflate crate size. HUMAN.crateS is 0.85. Default
rack length is CRATE_RACK_LEN (1.80) ≥ 15 % of cutter l (11.0 * 0.15 =
1.65).

Three zones (rule 1): bow civilian cabin / mid crate+module rack /
stern tug drive. Visible seams or straps between zones. No plate course
crosses a zone boundary.

This module is the measurement layer: pure math, no geometry, no
Blender, no ship_kit, importable by plain CPython.

Absolute HUMAN sizes are copied from src/game/ship-scale.js and are
NEVER multiplied by ship l, b or h. A bigger Independent ship carries
MORE crates / MORE ports, never bigger ones.

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
# Sourced from src/game/ship-scale.js HUMAN. 1 world unit ~= 3.64 m.

PORT_LIGHT     = (0.20, 0.13, 0.06)  # cabin port on a deck face — ~0.73 × 0.47 × 0.22 m
FLANK_PORT     = (0.06, 0.13, 0.20)  # same port on a flank face (W and D swapped)
MARKER_LAMP    = (0.10, 0.10, 0.06)  # nav / marker lamp — ~0.36 × 0.36 × 0.22 m
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # suited crew hatch, doorW x doorH x recess —
                                     #   ~1.24 × 1.89 × 0.22 m
GRAB_RAIL      = (0.05, 0.30, 0.05)  # rail post, railH = 0.30 — ~0.18 × 1.09 × 0.18 m
CARGO_CRATE    = (0.85, 0.85, 0.85)  # HUMAN.crateS — one ISO cube, ~3.09 m edge

COLLAR_BORE    = 0.62   # fleet docking-collar bore radius — ~2.26 m
PORT_SPACING   = 0.34   # cabin-port centre-to-centre pitch — ~1.24 m
LAMP_SPACING   = 1.20   # lamp centre-to-centre pitch — HUMAN.lampGap

STATUS_SLIT    = (0.10, 0.05, 0.04)  # status / nav mark slit


# -- Independent module constants: ABSOLUTE, one size for every class --------
# A bigger ship carries MORE of these, never bigger ones. Grow the §G2
# crate rack with length / crate count. Never inflate CARGO_CRATE.

CRATE_RACK_LEN = 1.80   # default rack length — ≥ 1.65 (15 % of cutter 11.0)
CRATE_PITCH    = 0.90   # crate centre pitch on a rack — crates stay 0.85

OWNER_MODULE   = (0.92, 0.74, 1.80)  # one secondhand bolted box; Z ≥ 1.65
CIVILIAN_CABIN = (1.10, 0.72, 1.40)  # commercial bow cabin mass
TUG_CORE       = (1.16, 0.88, 1.48)  # old commercial tug engineering block
MISSION_POD    = (0.62, 0.52, 0.96)  # modular commercial pod

PATCH_PLATE    = (0.48, 0.10, 0.62)  # mismatched plate; thickness ≥ voxel
STRAP_CLAMP    = (0.16, 0.10, 0.42)  # clamp strap that joins two masses
WELD_BEAD      = (0.10, 0.08, 0.36)  # field weld bead, thick enough for 0.06
NET_MEMBER     = 0.07   # cargo-net strap thickness — ≥ 0.06 in at least one axis
ZONE_STRAP_T   = 0.14   # collar / strap depth between thrust zones

RAIL_SECTION   = 0.06   # rack rail / strap bar cross-section
RACK_RAIL_H    = 0.20   # crate-rack side-rail height
RACK_PAD_T     = 0.10   # crate-rack floor pad thickness

CLAMP_PAD      = (0.18, 0.22, 0.30)  # one container / salvage-tug jaw
CLAMP_YOKE     = (0.96, 0.14, 0.18)  # short yoke between a clamp pair
LAMP_HOUSING   = (0.16, 0.14, 0.16)  # nav-lamp housing (larger than iris)
LIP_MINOR      = 0.045  # collar / flange torus tube


# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) describing a
# rounded-octagon cross-section swept by kit.hull_loft. Every function here
# returns a coordinate or a station tuple. None of them create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.28):
    """Return one station chamfered toward a blocky civilian chassis.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.28`` keeps long flats — Independent is a
    commercial chassis, not a faired leaf. The kit clamps the chamfer to
    49 % of the smaller half-extent.
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
