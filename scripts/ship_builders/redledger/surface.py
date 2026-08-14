"""Red Ledger shared hull-surface language.

Red Ledger hulls are WELDED CAPTURED SECTIONS — mismatched armoured zones
butt-welded into one deliberate machine. Adjacent sections therefore read as
different extrusions with different half-extents, and the seam between them
carries a raised weld bead or capture collar. This module provides the math to
query that geometry without creating any Blender objects.

Station tuple convention
------------------------
A station is (z, half_w, half_h, y_offset, chamfer). Ship space: x = beam,
y = height, z = length; nose at −Z, stern at +Z. ``hull_loft`` in ship_kit
takes an ordered list of these tuples. The section cross-section is a rounded
octagon: the chamfer cuts each corner at 45°, so the flank is vertical for
``|y − y_offset| <= half_h − chamfer`` and then falls away one unit in X for
each unit in Y. Use ``fair`` for faired civilian-feel zones and
``hard_section`` for armoured captured zones that must read as hard-edged iron.

Human module rule
-----------------
Every constant below is ABSOLUTE — it never gets multiplied by a ship's beam,
height or length. A bigger Red Ledger ship carries MORE of a fitting, never a
bigger one. Violating this breaks the 'probe-ship-islands' connectivity gate
(the voxeliser at 0.06 m cannot resolve sub-human geometry) and destroys the
faction read.

Layout
------
- ``hardware.py`` owns equipment: it creates geometry via ship_kit only, and it
  takes explicit absolute ship-space coordinates/anchors from the caller.
- ``<class>.py`` owns one body plan each: it builds the station list, calls
  queries here to compute anchors, and passes them into hardware.
- This file does NOT create geometry and does NOT import ship_kit.
"""
import math


# ── Cylinder orientation helpers ─────────────────────────────────────────────
# Pass to the ``rot`` argument of kit.cyl / kit.nozzle_ring etc.
CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)
CYL_ALONG_X = (0.0, math.pi / 2.0, 0.0)


# ── Human-scale constants: ABSOLUTE units, never scaled by ship dimensions ───
# Derived from HUMAN in src/game/ship-scale.js.
# P = 6.6 world units = 24 m, so 1 world unit ≈ 3.64 m; P/24 = 0.275 u/m.
# Each comment gives the approximate metre equivalent for cross-checking.

PORT_LIGHT     = (0.20, 0.13, 0.06)  # armoured port window — ~0.73 × 0.47 × 0.22 m
FLANK_PORT     = (0.06, 0.13, 0.20)  # same window on a flank face (W and D swapped)
WORK_LAMP      = (0.10, 0.10, 0.08)  # amber work lamp housing — ~0.36 × 0.36 × 0.29 m
MARKER_LAMP    = (0.10, 0.10, 0.06)  # navigation marker lamp — ~0.36 × 0.36 × 0.22 m
STATUS_SLIT    = (0.10, 0.05, 0.04)  # drive-status readout slit — ~0.36 × 0.18 × 0.15 m
TALLY_STROKE   = (0.10, 0.34, 0.05)  # one scored tally mark, narrow shallow stroke —
                                      #   ~0.36 × 1.24 × 0.18 m
LOCKBOX        = (0.34, 0.52, 0.20)  # external contract/payment box, one crew opens —
                                      #   ~1.24 × 1.89 × 0.73 m (door-scale panel)
TRANSFER_HATCH = (0.34, 0.52, 0.06)  # prisoner/cargo transfer door — ~1.24 × 1.89 m,
                                      #   doorW × doorH, 0.06 recess depth
GRAB_RAIL      = (0.05, 0.30, 0.05)  # boarding/grapple handrail post — ~0.18 × 1.09 × 0.18 m
SEIZED_CRATE   = (0.85, 0.85, 0.85)  # standard lashed cargo container cube — ~3.09 m edge

COLLAR_BORE    = 0.62   # standard docking collar bore radius — ~2.26 m
PORT_SPACING   = 0.34   # window centre-to-centre pitch — ~1.24 m
LAMP_SPACING   = 1.20   # work-lamp centre-to-centre pitch — ~4.36 m
TALLY_SPACING  = 0.22   # tally stroke centre-to-centre pitch — ~0.80 m


# ---------------------------------------------------------------------------
# Hull surface queries
#
# Every function returns a coordinate or a station tuple.
# None of them create geometry or call ship_kit.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.38):
    """Return one station whose corners are chamfered to a rounded octagon.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``hull_loft``. ``k=0.38`` produces a clearly faired section that still
    leaves a usable vertical flank for service bands and windows. The kit
    clamps the chamfer to 49 % of the smaller half-extent.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def hard_section(z, half_w, half_h, y_offset, k=0.16):
    """Return one station with a much shallower chamfer than ``fair``.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple — the same
    shape as ``fair`` — with ``k=0.16`` so the section reads as hard-edged
    iron rather than a faired civilian hull. Use this for captured armoured
    zones. Adjacent ``fair`` and ``hard_section`` stations will produce a
    visible silhouette kink at the weld seam, which is intentional.

    Returns a coordinate tuple, never geometry.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def section(stations, z):
    """Interpolate (half_w, half_h, y_offset, chamfer) at ship z.

    Returns the interpolated four-element tuple between the two bracketing
    stations, or clamps to the first or last station if ``z`` is out of range.
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

    Returns the x coordinate of the outer hull surface at that z and y.
    Returns 0.0 when y is above or below the hull (outside the section).
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

    Returns the y coordinate of the top hull surface at that z and x.
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

    Returns a scalar x coordinate — the beam extent where the top face is
    horizontal. Never geometry.
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


def seam_ring(stations, z, over=0.06):
    """Return (half_w, half_h, y_offset, chamfer) for a weld-bead capture collar.

    The collar sits ``over`` world units proud of the local section on both the
    beam and height axes, so a hull primitive built from it always intersects
    the underlying loft. The chamfer is reclamped to the expanded extents.

    Returns a coordinate tuple of four scalars, never geometry. Pass the result
    as the ``hw``/``hh``/``yo``/``ch`` arguments of a ``kit.box`` or
    ``kit.cyl`` ring primitive in ``hardware.py``.
    """
    hw, hh, yo, ch = section(stations, z)
    hw2 = hw + over
    hh2 = hh + over
    ch2 = clamped(hw2, hh2, ch)
    return (hw2, hh2, yo, ch2)


def flank_anchor(stations, z, y, inset):
    """Return the x-centre for a fitting of half-thickness ``inset`` seated in the flank.

    Returns the x coordinate at which the centre of a fitting must sit so that
    the fitting is half-buried in the hull flank: ``flank_x(z, y) - inset``.
    Returns 0.0 when ``flank_x`` returns 0 (y is outside the hull at that z),
    signalling the caller that no fitting should be placed there.

    The caller mirrors this value with a negative sign for the port side
    (starboard is positive x).

    This is the documented fix for the 'one medium floating group' failure mode:
    fittings placed at a typed fraction of beam float when the hull tapers; this
    function seats them against the actual surface at their y height.
    """
    fx = flank_x(stations, z, y)
    if fx == 0.0:
        return 0.0
    return fx - inset
