"""Freehold Compact shared hull-surface language.

Every Freehold class is a faired loft, so its flank falls away from the beam
line and its deck rises along the sheer. Fixed coordinates therefore produce
fittings that float. Every fitting is seated against the surface with one of the
queries below, so it always cuts into the hull it belongs to. Only separated
volumes — drive blocks, greenhouse houses, habitation drums — carry their own
local anchors.

The human-scale constants are absolute units, from HUMAN in
src/game/ship-scale.js: a locker on the freighter is the same locker as the one
on the light. A family that needs more window carries more windows; it never
scales one.
"""
import math


# ── Human-scale constants: SAME physical size on every Freehold ship ─────────
# Absolute units, from HUMAN in src/game/ship-scale.js. Never multiplied by
# l, b or h — a locker on the freighter is the same locker as here.
SUPPLY_LOCKER = (0.62, 0.70, 1.05)   # clamp-on supply locker
AIRLOCK       = (0.72, 0.60, 0.42)   # bow rescue airlock, stretcher width
PORT_LIGHT    = (0.20, 0.13, 0.06)   # one cabin window
FLANK_PORT    = (0.06, 0.13, 0.20)   # the same window on a flank face
ROOF_PANE     = (0.22, 0.05, 0.20)   # greenhouse gallery pane
FLOOD_LAMP    = (0.16, 0.12, 0.08)   # work floodlight
MARKER_LAMP   = (0.10, 0.10, 0.06)   # navigation marker
STATUS_SLIT   = (0.10, 0.05, 0.04)   # drive-status readout
PORT_SPACING  = 0.34                  # window centre-to-centre

CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)
CYL_ALONG_X = (0.0, math.pi / 2.0, 0.0)

# ---------------------------------------------------------------------------
# Hull surface queries
#
# A station is (z, half_w, half_h, y_offset, chamfer) — the tuple hull_loft
# takes. The section is a rounded octagon: the chamfer cuts each corner at 45°,
# so the flank is vertical for |y - y_offset| <= half_h - chamfer and then falls
# away one unit in X for each unit in Y.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.38):
    """One station whose corners are cut back to a rounded octagon.

    The kit clamps the chamfer to 49 % of the smaller half-extent. k=0.38 keeps
    the section clearly faired and still leaves a usable vertical flank for the
    service band, the windows and the lockers.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def section(stations, z):
    """Interpolate (half_w, half_h, y_offset, chamfer) at ship z."""
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
    """The chamfer the kit will actually cut."""
    return min(ch, hw * 0.49, hh * 0.49)


def flank_x(stations, z, y):
    """Hull half-beam at station z and height y. Zero above the hull."""
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dy = abs(y - yo)
    if dy <= hh - ch:
        return hw
    if dy >= hh:
        return 0.0
    return hw - (dy - (hh - ch))


def top_y(stations, z, x=0.0):
    """Deck height at station z, x units off the centreline."""
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo + hh
    if dx >= hw:
        return yo
    return yo + hh - (dx - (hw - ch))


def bottom_y(stations, z, x=0.0):
    """Keel height at station z, x units off the centreline."""
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo - hh
    if dx >= hw:
        return yo
    return yo - hh + (dx - (hw - ch))


def flat_half(stations, z):
    """Half-width of the flat deck at station z, inboard of the chamfer."""
    hw, hh, yo, ch = section(stations, z)
    return hw - clamped(hw, hh, ch)


def straight_top(stations, z):
    """Highest y at which the flank is still vertical."""
    hw, hh, yo, ch = section(stations, z)
    return yo + hh - clamped(hw, hh, ch)


def straight_bottom(stations, z):
    """Lowest y at which the flank is still vertical."""
    hw, hh, yo, ch = section(stations, z)
    return yo - hh + clamped(hw, hh, ch)
