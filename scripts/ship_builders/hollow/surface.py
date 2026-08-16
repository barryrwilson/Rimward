"""Hollow Reach shared hull-surface language: loft queries and modules.

There is NO concept-art plate. Do not invent a Banner look.

Bible docs/FactionShipDesignBible.md §5.2: "sealed and shuttered hulls,
dusk-mauve and dark metal, wrap panels, long listening masts, dish ears,
minimal dim lighting, and patient station-keeping. Treat this as deep-rim
regional equipment, not a formal nation or secret villain fleet."

docs/FactionVisualUpdatePlan.md: "the shrouded. A sealed, shuttered hull
under wrap panels, long listening masts and dish ears standing clear of
the mass, very few lights and those dim. `trim` is the dominant plate
colour: the dark pair alone has no value contrast in a band-3 sun (the
wave-46 hollow lesson)."

src/game/faction-style.js hollow: hull #4a4054, hullDark #2c2634,
trim #8a7c96, accent #7a6a8a, glow #b09ac0.

Existing skin scripts/ship_skins/hollow.py: base #4a4054, panel #7a6a8a
(wrap), accent #5a6878 (dish), emissive #b09ac0, pattern shutter. Keep
name substrings wrap-panel and listening-dish.

Construction logic (assigned; synthesis/21 §G6 has no Hollow row):
CLOSED SHELL, SHUTTERED / SHROUDED. A sealed watch-hull wears wrap
panels and shutter banks. Joints are shutter seams and wrap straps.
Listening masts and dish ears stand CLEAR of the mass.

Silhouette family (rule 6): sealed oblong watch-hull + bilateral wrap
panels + outboard listening masts/dish ears.

§G2 outline-breaker (≥ 15 % of hull length): the LISTENING MAST (with a
dish ear at the tip). Grow mast HEIGHT / boom reach with class later.
NEVER inflate dish diameter as the primary scale (Wave 11 hub lesson).
Default LISTENING_MAST_LEN is 2.40 ≥ 15 % of cutter l (11.0 * 0.15 =
1.65).

Three zones (rule 1): bow shuttered sensor face / mid sealed hold + wrap
/ stern quiet drive. Visible shutter seams or wrap straps between zones.
No plate course crosses a zone boundary.

This module is the measurement layer: pure math, no geometry, no
Blender, no ship_kit, importable by plain CPython.

Absolute HUMAN sizes are copied from src/game/ship-scale.js and are
NEVER multiplied by ship l, b or h. Hollow almost has no windows. Scale
cues are shutter slat pitch, lantern size, collar bore, mast thickness,
dish thickness — MORE of them on bigger ships, never bigger slats or
lanterns.

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
MARKER_LAMP    = (0.10, 0.10, 0.06)  # marker lamp — ~0.36 × 0.36 × 0.22 m
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # suited crew hatch, doorW x doorH x recess —
                                     #   ~1.24 × 1.89 × 0.22 m
GRAB_RAIL      = (0.05, 0.30, 0.05)  # rail post, railH = 0.30 — ~0.18 × 1.09 × 0.18 m

COLLAR_BORE    = 0.62   # fleet docking-collar bore radius — ~2.26 m
PORT_SPACING   = 0.34   # cabin-port centre-to-centre pitch — ~1.24 m
LAMP_SPACING   = 1.20   # lamp centre-to-centre pitch — HUMAN.lampGap

STATUS_SLIT    = (0.10, 0.05, 0.04)  # status / nav mark slit
LIP_MINOR      = 0.050  # collar / dish-rim torus tube — diameter 0.10 ≥ voxel


# -- Hollow module constants: ABSOLUTE, one size for every class -------------
# A bigger ship carries MORE of these, never bigger ones. Grow the §G2
# listening mast with HEIGHT / boom reach. Never inflate DISH_EAR_R.

LISTENING_MAST_LEN = 2.40   # default mast height — ≥ 1.65 (15 % of cutter 11.0)
MAST_RADIUS        = 0.09   # structural shaft radius — not a wire

DISH_EAR_R = 0.30   # dish-ear face radius; do not grow this as the scale cue
DISH_EAR_T = 0.10   # dish structural thickness — ≥ 0.06 voxel

SHUTTER_SLAT_PITCH = 0.14  # slat centre pitch — never scaled
SHUTTER_SLAT_T     = 0.08  # slat thickness (in-plane)
SHUTTER_SLAT_D     = 0.10  # slat depth (proud of the bank)

WRAP_STRAP_T = 0.10        # wrap-strap thickness — ≥ voxel
WRAP_PANEL   = (1.20, 0.88, 0.12)  # face_w, face_h, thickness
WRAP_STRAP   = (0.18, 0.10, 0.72)  # strap width, thickness, span
SHUTTER_BANK = (0.96, 0.72, 0.16)  # face_w, face_h, thickness
SHUTTER_SEAM = (0.56, 0.18, 0.14)  # local zone bead, not a full-beam strip

BURIED_LANTERN = (0.10, 0.10, 0.10)  # HUMAN.lampSize — one dim command iris
LAMP_HOUSING   = (0.16, 0.14, 0.16)  # recessed well around the lantern

SENSOR_ROOT    = (0.40, 0.32, 0.40)  # armored mast root
PASSIVE_VANE   = (0.08, 0.28, 0.14)  # one passive-array vane
FUEL_BLADDER   = (0.96, 0.72, 1.20)  # soft tank for freighter later
SHIELDED_HOLD  = (1.36, 0.92, 1.70)  # sealed hold block


# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) describing a
# rounded-octagon cross-section swept by kit.hull_loft. Every function here
# returns a coordinate or a station tuple. None of them create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.38):
    """Return one station chamfered toward a sealed oblong watch-hull.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.38`` keeps a closed oblong with short flats —
    Hollow is a shuttered watch-hull, not a faired leaf and not a
    commercial chassis. The kit clamps the chamfer to 49 % of the
    smaller half-extent.
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
