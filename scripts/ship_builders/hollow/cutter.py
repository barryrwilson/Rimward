"""Hollow Reach Cutter — PATIENT PICKET.

Bible §5.2: "A patient picket with docking collar hidden behind shutters
and multiple passive arrays." There is no concept-art plate. This file
does not invent a Banner look.

Construction logic is CLOSED SHELL, SHUTTERED. A bigger Hollow ship
carries MORE arrays and MORE slats, never a bigger dish, slat, or
lantern. This class refuses crates, owner-modules, gate-arms, salvage,
ritual cans, radial fans, grown flesh, field lace, and window rows.

The silhouette is a sealed oblong watch-hull + bilateral wrap panels +
an outboard listening mast / dish ear.

BODY PLAN
    Sealed ``kit.hull_loft`` (absolute half-extents, never class beam as
    a drum radius) from loft bow to transom. Bow is a shuttered picket
    face: ``hw.docking_collar`` facing nose with ``sh.shutter_bank`` on
    the same loc so the slats cover the collar. Mid band is one
    ``sh.wrap_panel`` per side, sized from ``_min_skin``, plus 2–4
    ``hw.passive_array`` runs. ``sh.shutter_seam`` marks both zone
    seams (local beads, not full-beam strips). One
    ``hw.sensor_root`` carries ``sh.listening_mast`` length 3.20. One
    ``hw.buried_lantern``. Stern is ``hw.drive_face`` with 4 nozzles.
    No radiators. One extra starboard array is the functional
    asymmetry.

STATIONS (z as fractions of l; half-extents are ABSOLUTE chassis
radii, never a fraction of the class beam 5.28):
    Loft bow at l*-0.490 = -5.390. Transom at l*+0.470 = +5.170 so the
    driver engine glow at l*0.47 sits on the drive face. Drive discs
    stand 0.12 aft of the transom (z ≈ +5.290). Bow shutter front sits
    ≈ -5.47. Max core half-beam is 1.20; wraps stand slightly proud.

ZONES (no plate or wrap run crosses a zone seam):
    bow   l*-0.490 .. l*-0.250   ~25 %  picket shutter, hidden collar
    mid   l*-0.250 .. l* 0.220   ~48 %  wraps, arrays, mast, lantern
    stern l* 0.220 .. l* 0.482   ~27 %  quiet drive house

OUTLINE-BREAKER (G2): ``sh.listening_mast`` length=3.20 ≥ 0.15*l =
    1.65 (29.1 % of 11). Grow HEIGHT. NEVER inflate dish diameter.

EMISSIVE BUDGET (≤ 5 % of hull area, dim mauve only):
    four drive discs; one buried-command-lantern iris. Almost no
    windows. AUTHORED AIM: glow face area ≈ 0.12 against a hull area
    ≈ 55–80 (≈ 0.2 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; array run count and slat/vane counts halve
    1  loft + wraps + mast + shutter + collar + drive
    0  loft + drive

DENSITY (AUTHORED AIM only — re-derive from measure-ships after bake):
    hull verts 8 000–16 000 (SHIP_SCALE.cutter.hull band 6 000–47 000)
    max span 10.6–11.4 (band [6.60, 15.40], target 11.0)
    len/beam ≥ 1.15; ht/len ≤ 0.60; beam/len ≥ 0.16

Extent budget (absolute ship-space, l=11.0  b=5.28  h=3.30):
    z  min ≈ -5.47 (shutter face)  max ≈ +5.29 (drive discs)  spanZ ≈ 10.76
    x  min ≈ -1.22 (port wrap)     max ≈ +1.22                spanX ≈  2.44
    y  min ≈ -0.82 (keel)          max ≈ +4.05 (mast dish)    spanY ≈  4.87
    spanZ/spanX ≈ 4.41 ≥ 1.15; spanY/spanZ ≈ 0.45 ≤ 0.60;
    spanX/spanZ ≈ 0.23 ≥ 0.16.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import shroud as sh
from . import hardware as hw


# Absolute module sizes. Never multiplied by ship l, b or h.
_MAST_LEN = 3.20
_BURY = 0.08
_WRAP_LAP = 0.02


# ===========================================================================
# STATION LIST
# ===========================================================================

def _cutter_stations(l, b, h):
    """Sealed oblong watch-hull. Half-extents are absolute, not class beam.

    ``b`` and ``h`` name the driver envelope (5.28, 3.30). They do not
    scale the core. z tracks class length so the loft fills the cutter
    run under the picket face and onto the drive face. y_offset 0.0
    throughout: the hull sits on its centreline.

    Loft bow at l*-0.490; transom at l*+0.470. Bow/mid seam at l*-0.250;
    mid/stern seam at l*+0.220. Bow half-height 0.82 so a shutter bank
    can cover the 0.76-radius collar barrel.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.490, 1.00, 0.82, 0.0),
        sf.fair(l * -0.370, 1.10, 0.80, 0.0),
        sf.fair(l * -0.250, 1.16, 0.76, 0.0),
        sf.fair(l * -0.050, 1.20, 0.74, 0.0),
        sf.fair(l * 0.080, 1.18, 0.72, 0.0),
        sf.fair(l * 0.220, 1.12, 0.68, 0.0),
        sf.fair(l * 0.350, 0.98, 0.58, 0.0),
        sf.fair(l * 0.470, 0.84, 0.50, 0.0),
    ]


def _min_skin(stations, z0, z1, samples=9):
    """Min straight-flank half-extents on [z0, z1].

    Returns ``(half_w, straight_half_h, flat_half, y_offset)``. Callers
    double these for kit full extents. Uses the smallest section in the
    run so a wrap stays on the loft and does not float at a taper.
    """
    hw_m = 1e9
    st_h = 1e9
    fw_m = 1e9
    yo_s = 0.0
    n = max(int(samples), 2)
    for i in range(n):
        z = z0 + (z1 - z0) * i / float(n - 1)
        hw, hh, yo, ch = sf.section(stations, z)
        ch = sf.clamped(hw, hh, ch)
        hw_m = min(hw_m, hw)
        st_h = min(st_h, hh - ch)
        fw_m = min(fw_m, hw - ch)
        yo_s += yo
    return hw_m, st_h, fw_m, yo_s / float(n)


def _seat_flank_array(parts, stations, name, mat, side, z, count, detail):
    """Bury one passive-array run in the straight flank at station z."""
    sec = sf.section(stations, z)
    y = sec[2]
    fx = sf.flank_x(stations, z, y)
    if fx < 0.16:
        return
    bar_t = 0.12
    x = side * (fx - _BURY + bar_t * 0.5)
    hw.passive_array(parts, name, mat, (x, y, z),
                     count=count, axis='z', detail=detail)


def _seat_dorsal_array(parts, stations, name, mat, z, count, detail):
    """Bury one passive-array run in the deck at station z."""
    ty = sf.top_y(stations, z)
    bar_h = 0.10
    y = ty - _BURY + bar_h * 0.5
    hw.passive_array(parts, name, mat, (0.0, y, z),
                     count=count, axis='z', detail=detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Hollow Reach patient picket (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 halved array/slat counts, all equipment kept
                1 loft + wraps + mast + shutter + collar + drive
                0 loft + drive.

    AUTHORED AIM (re-derive from measure-ships after bake):
        detail 3  8 000–16 000 hull verts (band 6 000–47 000)
        max span 10.6–11.4, len/beam ≥ 1.15, ht/len ≤ 0.60, beam/len ≥ 0.16
    """
    H = kit.ROLE_HULL

    stations = _cutter_stations(l, b, h)

    z_loft0 = l * -0.490
    z_bow_s = l * -0.250
    z_mid_s = l * 0.220
    z_stern = l * 0.470

    # ── Primary sealed loft (always) ─────────────────────────────────────
    kit.hull_loft(parts, 'cutter.hull', H, stations, hull_mat)

    # ── DRIVE FACE — transom, 4 countable nozzles (always) ───────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  min(sec_t[0], 0.70), min(sec_t[1], 0.42),
                  nozzles=4, depth=0.50, detail=detail)

    if detail < 1:
        return

    # ── HIDDEN COLLAR + PICKET SHUTTER — same loc, overlapping (1+) ──────
    # Mating plane at the loft bow. Barrel buries ≥ 0.12 aft. Shutter
    # face covers the 0.76-radius barrel so the collar is not a free
    # island and is not a naked lock.
    sec_b = sf.section(stations, z_loft0)
    collar_loc = (0.0, sec_b[2], z_loft0)
    hw.docking_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      collar_loc, facing='nose', detail=detail)
    bar_d = (sf.COLLAR_BORE + 0.14) * 2.0
    shut_w = max(sf.SHUTTER_BANK[0], min(sec_b[0] * 2.0 * 0.94, bar_d * 1.08))
    shut_h = max(sf.SHUTTER_BANK[1], min(sec_b[1] * 2.0 * 0.96, bar_d * 1.04))
    shut_t = max(sf.SHUTTER_BANK[2], 0.16)
    sh.shutter_bank(parts, 'cutter.picket', hull_mat, collar_loc,
                    size=(max(shut_w, 0.24), max(shut_h, 0.24), shut_t),
                    facing='nose', detail=detail)

    # ── WRAP PANELS — one per side, mid flank, buried (detail 1+) ────────
    # Centre inboard of the min flank by half thickness − lap so the
    # plate laps the loft (≥ 0.08) and does not float at a taper.
    z_w0 = z_bow_s + 0.10
    z_w1 = z_mid_s - 0.10
    hw_m, st_h, _fw_m, yo_m = _min_skin(stations, z_w0, z_w1)
    wrap_t = max(sf.WRAP_PANEL[2], 0.10)
    wrap_w = max(z_w1 - z_w0, 0.24)
    wrap_h = max(st_h * 2.0, 0.24)
    wrap_inset = wrap_t * 0.5 - _WRAP_LAP
    z_wrap = 0.5 * (z_w0 + z_w1)
    for side, facing in ((-1.0, 'port'), (1.0, 'starboard')):
        if hw_m < 0.16:
            continue
        sh.wrap_panel(parts, 'cutter.wrap.' + facing, hull_mat,
                      (side * (hw_m - wrap_inset), yo_m, z_wrap),
                      size=(wrap_w, wrap_h, wrap_t),
                      facing=facing, detail=detail)

    # ── LISTENING MAST — §G2, mid-dorsal, slight starboard offset (1+) ───
    # length 3.20 ≥ 1.65. Dish stays sf.DISH_EAR_R. Shaft buries in root.
    z_mast = 0.5 * (z_bow_s + z_mid_s)
    x_mast = 0.14
    _sx, ry, _sz = sf.SENSOR_ROOT
    ty_m = sf.top_y(stations, z_mast, x_mast)
    y_root = ty_m - _BURY + ry * 0.5
    hw.sensor_root(parts, 'cutter.mast-root', hull_mat,
                   (x_mast, y_root, z_mast), detail=detail)
    sh.listening_mast(parts, 'cutter.mast', hull_mat,
                      (x_mast, y_root + ry * 0.12, z_mast),
                      length=_MAST_LEN, facing='up',
                      detail=detail, dish=True)

    if detail < 2:
        return

    # ── ZONE SEAMS — local shutter beads, not full-beam strips (2+) ──────
    sx_s, sy_s, sz_s = sf.SHUTTER_SEAM
    sy_s = max(sy_s, 0.12)
    for tag, zz in (('bow', z_bow_s), ('mid', z_mid_s)):
        ty_s = sf.top_y(stations, zz)
        sh.shutter_seam(parts, 'cutter.seam.' + tag, hull_mat,
                        (0.0, ty_s - _BURY + sy_s * 0.5, zz),
                        size=(max(sx_s, 0.28), sy_s, max(sz_s, 0.12)),
                        detail=detail)

    # ── BURIED COMMAND LANTERN — one dim iris, mid deck (detail 2+) ──────
    z_lp = l * -0.080
    if z_bow_s < z_lp < z_mid_s:
        ty_lp = sf.top_y(stations, z_lp)
        hw.buried_lantern(parts, glow, 'cutter.lantern', hull_mat, glow_mat,
                          (0.0, ty_lp - _BURY, z_lp),
                          facing='up', detail=detail)

    # ── PASSIVE ARRAYS — sensor band, absolute vanes, grow COUNT (2+) ────
    # Detail 2 keeps two runs; detail 3 adds dorsal + extra starboard.
    z_arr = 0.5 * (z_bow_s + z_mid_s)
    vane_n = 5
    _seat_flank_array(parts, stations, 'cutter.array.port', hull_mat,
                      -1.0, z_arr, vane_n, detail)
    _seat_flank_array(parts, stations, 'cutter.array.stbd', hull_mat,
                      1.0, z_arr, vane_n, detail)
    if detail >= 3:
        _seat_dorsal_array(parts, stations, 'cutter.array.dorsal', hull_mat,
                           z_arr + 0.18, vane_n, detail)
        z_as = z_arr + 0.72
        if z_as < z_mid_s - 0.16:
            _seat_flank_array(parts, stations, 'cutter.array.stbd-aft',
                              hull_mat, 1.0, z_as, 4, detail)
