"""Veridian Combine shared hull-surface language: loft queries and modules.

Bible docs/FactionShipDesignBible.md §4.1: "calm corporate authority,
survey precision, modular extraction hardware." Fleet DNA: straight
load-bearing spine; hexagonal or chamfered pressure modules; detachable
survey pods; graphite hull; pale structural alloy; muted emerald optics.
Modules look serialized and replaceable.

Plate (docs/FactionExamples/01-veridian-combine-ship.png): STEPPED SLAB /
CHAMFERED BLOCK. Bow 15–25 % blunt faceted survey head with a WIDE
emerald inset glass band. Mid 45–60 % stacked chamfered modules, pale
alloy over graphite. Stern 20–30 % stepped superstructure. Ventral
hanging cargo pods / sponsons. Green nav lamps. Emissive ≤ 5 %.

Construction logic (synthesis/21 §G6): CLOSED SHELL, MACHINED.
Signature: inset recess lighting only; no surface pipes; large flush
plates. Refuse exposed-frame trusses, gilded lapped scales / ivory
margins / ventral pylons, ferrous rib flares / turret rails, Assembly
radial fans, Congregation sails, Beautiful flesh, Unknowables lace.
No plate quilt that reads as Ledger salvage.

§G2 outline-breaker (≥ 15 % of hull length): CARGO CRADLE WINGS.
Grow REACH with class. NEVER inflate wing thickness as the scale cue.
Default CRADLE_WING_REACH is 2.40 ≥ 1.65 (15 % of cutter length 11.0).

This module is the measurement layer: pure math, no geometry, no
Blender, no ship_kit, importable by plain CPython.

Absolute HUMAN sizes are NEVER multiplied by ship l, b or h. A bigger
Veridian ship carries MORE plates, lamps and modules at the same pitch,
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
# Quoted from src/game/ship-scale.js HUMAN. 1 world unit ~= 3.64 m.

PORT_LIGHT     = (0.20, 0.13, 0.06)  # cabin port — HUMAN.windowW/H/D
FLANK_PORT     = (0.06, 0.13, 0.20)  # same port on a flank face (W/D swapped)
MARKER_LAMP    = (0.10, 0.10, 0.06)  # HUMAN.lampSize — ~0.36 × 0.36 × 0.22 m
STATUS_SLIT    = (0.10, 0.05, 0.04)  # status readout slit
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # HUMAN.doorW × doorH × recess
GRAB_RAIL      = (0.05, 0.30, 0.05)  # HUMAN.railPost × railH
CARGO_CRATE    = (0.85, 0.85, 0.85)  # HUMAN.crateS
COLLAR_BORE    = 0.62                # HUMAN.collarR — fleet docking bore
PORT_SPACING   = 0.34                # HUMAN.windowGap
LAMP_SPACING   = 1.20                # HUMAN.lampGap — never pack lamps edge to edge


# -- Veridian module constants: ABSOLUTE, one size for every class -----------
# Grow the §G2 cradle wing with REACH. Never inflate wing thickness.

FLUSH_PLATE    = (0.16, 0.90, 2.00)  # large flush plate, thickness along facing
ALLOY_COURSE   = (0.16, 0.72, 2.40)  # pale-alloy plate-course span
HEX_MODULE     = (0.96, 0.80, 1.24)  # 6-sided pressure can (x/y → radius)
SPINE_BLOCK    = (0.36, 0.32, 2.40)  # thin graphite keel segment
ZONE_COLLAR    = (1.20, 0.80, 0.20)  # machined zone seam (full extents)
RECESS_WELL    = (0.72, 0.28, 1.20)  # opening face (mapped off facing)
RECESS_DEPTH   = 0.14                # inboard well depth
RECESS_HOOD    = 0.06                # hood/sill proud of skin, ≤ 0.07

CRADLE_WING_REACH = 2.40   # default long span — ≥ 1.65 (15 % of cutter 11.0)
CRADLE_WING_T     = 0.22   # thickness — NEVER the scale cue
CRADLE_WING_W     = 0.56   # face height / chord of the fork arm

SURVEY_HEAD     = (1.10, 0.62, 0.88)  # faceted bow survey head
SAMPLE_CANISTER = (0.28, 0.28, 0.72)  # detachable sample bottle
RANGING_VANE    = (0.10, 0.36, 0.80)  # thin lateral ranging vane
SURVEY_DRONE    = (0.42, 0.28, 0.48)  # flush hexagonal survey drone
EVIDENCE_LOCKER = (0.36, 0.42, 0.52)  # cutter evidence locker
SAMPLE_VAULT    = (0.72, 0.56, 0.88)  # heavy sample vault
RADIATOR        = (0.10, 1.20, 1.80)  # flat empty thermal slab
TUG_DOCK        = (0.56, 0.42, 0.56)  # tug capture pad
ORE_SILO_R      = 0.42                # ore silo cylinder radius
ORE_SILO_H      = 1.40                # ore silo cylinder depth
REFINERY_DRUM_R = 0.36
REFINERY_DRUM_H = 1.20
CLAIM_MODULE    = (0.85, 0.72, 1.20)  # detachable claim / cargo module
NESTED_SCOUT    = (0.90, 0.36, 1.40)  # docked light-class mass in an open bay
COLLAR_FLANGE_T = 0.14
HAIRLINE_T      = 0.08                # brass edge trim, never a face


# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) describing a
# rounded-octagon cross-section swept by kit.hull_loft. Every function here
# returns a coordinate or a station tuple. None of them create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.22):
    """Return one station chamfered toward a stepped slab / chamfered block.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.22`` keeps a broad flat face and a crisp corner —
    Veridian is a machined slab, not a faired leaf. The kit clamps the
    chamfer to 49 % of the smaller half-extent.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def edge_section(z, half_w, half_h, y_offset, k=0.14):
    """Return one station with a sharper chamfer than ``fair``.

    Use this for the blunt faceted survey head and legal-boundary prow,
    where the Combine wants a crisp machined corner, not a soft roll.
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
    rely on this to self-trim runs of plates, wells and lamps, so the value is
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
    """Return (half_w, half_h, y_offset, chamfer) for a machined zone collar.

    The ring stands ``over`` world units clear of the local section on both
    the beam and height axes. Returns a coordinate tuple of four scalars,
    never geometry. The caller feeds it to modules.zone_collar.
    """
    hw, hh, yo, ch = section(stations, z)
    hw2 = hw + over
    hh2 = hh + over
    ch2 = clamped(hw2, hh2, ch)
    return (hw2, hh2, yo, ch2)


def flank_anchor(stations, z, y, inset):
    """Return the x-centre for a fitting of half-thickness ``inset`` in the flank.

    Returns ``flank_x(z, y) - inset``. Returns 0.0 when ``flank_x`` returns
    0.0. Mirror with a negative sign for the port side.
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
# ``stations[0][0] .. stations[-1][0]`` so a run self-trims past the taper.
# ---------------------------------------------------------------------------

def surf_flank(stations, y, inset=0.0):
    """Return callable(z) -> half-beam at height ``y`` minus ``inset``, or 0.0.

    Use for flank-seated runs: alloy courses, recess wells, marker lamps.
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

    Use for dorsal runs: spine blocks, citadel plates, deck lamps.
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

    Use for ventral runs: cradle roots, hanging pods, locker rows.
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
    chamfer: plate runs, spine courses.
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
