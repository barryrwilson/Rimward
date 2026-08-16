"""Ferrous Hegemony Heavy — BASTION GUNSHIP.

Bible §4.2 Heavy: "A short, dense citadel behind a deep wedge prow.
Use two or four deliberate weapon blocks and thick shoulder armor;
leave clean arcs for point defense."

Plate 02-ferrous-hegemony-ship.png is fleet language, not a long
frigate to copy. Hold the blunt prow, crimson vertical band + gold
crest, layered citadel, paired formal turrets on a rail, and
segmented iron cigar. This class is a SHORT hammerhead, not a
line escort.

Construction logic (synthesis/21 §G6): REPEATED MODULE, ARMOURED —
20–40 ribs at even pitch; turret modules on a rail. Human and
Ferrous module sizes stay absolute. A bigger class carries MORE
ribs and batteries, never bigger copies.

BODY PLAN
    A short dense loft (kit.hull_loft, sf.fair k=0.28) with ABSOLUTE
    half-extents, never *b or *h. Bow is a deep kit.wedge strike
    face. Mid is a layered citadel with thick shoulder blocks,
    bilateral rib runs, and two or four formal battery blocks on
    port/starboard rails. Stern is a 4-nozzle drive face and a pair
    of FLAT radiators. Rescue panniers sit on the lower mid flanks.
    One honor plate on the prow is the only functional asymmetry.

STATION / ZONE REASONING (z as fractions of l; half-extents ABSOLUTE)
    Loft nose at l*-0.490 = -8.330.
    Transom / drive plane at l*+0.488 = +8.296. Drive face stands
    0.12 proud. Wedge nose stands 0.30 forward of the loft nose.
    Authored spanZ ~ 17.05 (band [10.20, 23.80], aim 16.2–18.0).
    Bow / mid seam at l*-0.250 = -4.250. Mid / stern at l*+0.280
    = +4.760.
    Zones of lofted length 16.626:
        bow   24.5 %  deep wedge prow + crimson band
        mid   54.2 %  dense citadel + shoulders + batteries
        stern 21.3 %  drive face + flat radiator pair
    Mid half-beam 2.18, mid half-height 1.52 (short citadel, not a
    frigate stick).

OUTLINE-BREAKER (§G2)
    am.rib_flare on each shoulder. Grow REACH, never thickness.
        authored reach = 2.80
        floor           = 0.15 * 17.0 = 2.55
        authored share  = 16.5 % of l

§G3 THERMAL / DRIVE
    One pair of hw.radiator, FLAT, no fins, no greeble. Each slab
    is (2.40, 0.16, 2.90) full extents. Thickness 0.16 ≥ 0.08.
    Inboard 0.12 sits inside the upper-aft flank. Drive face is a
    2x2 of 4 countable nozzles. No kit.engine_bank.

EMISSIVE (authored aim, <= 5 % of hull area)
    4 drive discs, one citadel slit band, nav markers at
    sf.LAMP_SPACING, pannier lamps at detail >= 2. No edge-lit panels.

DETAIL LADDER
    3  full: every construct, full rib / course / battery count
    2  all construct families; repeats half
    1  loft + wedge + flares + citadel + drive + radiators
       + shoulders + rescue + prow band
    0  loft + wedge + drive housing

ENVELOPE / AUTHORED AIM
    Driver: l = 17.0, b = 8.84, h = 5.78. Aim span ~17.0
    (band [10.20, 23.80], target 17.0). Must outrank cutter (~9.7)
    and stay well below frigate (~32).
    Authored spanZ ~ 17.05; Z/X >= 1.15; Y/Z <= 0.60; X/Z >= 0.16.
    Authored hull verts 12,000-28,000 (band 9,000-78,000).
    Island aim: one body; every fitting overlaps its host by >= 0.08.
    Min extent >= 0.06.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import armour as am
from . import hardware as hw
from . import surface as sf


# Absolute structural sizes. Not scaled by l, b or h.
_BURY = 0.12
_FLARE_REACH = 2.80
_WEDGE = (3.80, 2.70, 4.20)
_WEDGE_PROUD = 0.30
_SHOULDER = (0.58, 1.48, 3.40)
_CITADEL = (3.00, 1.12, 5.40)
_RAD = (2.40, 0.16, 2.90)
_SLIT = (1.00, 0.06, 0.12)
_RIB_N = 30
_RIB_SPAN = 6.60  # 30 * sf.ARMOUR_RIB_PITCH


def _heavy_stations(l, b, h):
    """Short dense bastion loft. Half-extents are absolute radii.

    Deep wedge bow, hard step into a shouldered citadel, narrow
    transom. ``b`` and ``h`` name the class envelope; the core
    does not fill them.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.490, 0.85, 0.88, 0.04),  # loft nose
        sf.fair(l * -0.400, 1.55, 1.20, 0.06),
        sf.fair(l * -0.250, 2.12, 1.44, 0.08),  # bow/mid hammerhead
        sf.fair(l * -0.080, 2.18, 1.52, 0.10),  # citadel
        sf.fair(l *  0.080, 2.16, 1.50, 0.10),
        sf.fair(l *  0.280, 1.92, 1.32, 0.06),  # mid/stern
        sf.fair(l *  0.400, 1.58, 1.14, 0.02),
        sf.fair(l *  0.488, 1.28, 1.00, -0.02),  # transom
    ]


def _min_flank(stations, z0, z1, y, samples=9):
    """Smallest positive flank_x on [z0, z1] at height y, or 0.0."""
    fx_m = 1e9
    n = max(int(samples), 2)
    for i in range(n):
        z = z0 + (z1 - z0) * i / float(n - 1)
        fx = sf.flank_x(stations, z, y)
        if fx > 0.0:
            fx_m = min(fx_m, fx)
    if fx_m > 1e8:
        return 0.0
    return fx_m


def _seat_x(flank, half):
    """Centre so the inboard face buries ``_BURY`` into the flank."""
    return flank + half - _BURY


def _glow(obj):
    if obj:
        obj['skin_role'] = 'glow'
    return obj


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Ferrous Hegemony bastion gunship (heavy class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 half repeats, 1 primary form, 0 mass only.
    """
    _ = (b, h)
    stations = _heavy_stations(l, b, h)

    z_nose = l * -0.490
    z_bow = l * -0.250
    z_mid = l * 0.280
    z_stern = l * 0.488

    # ── Loft + deep wedge prow + drive (detail 0+) ──────────────────────
    kit.hull_loft(parts, 'heavy.hull', kit.ROLE_HULL, stations, hull_mat)

    _wx, _wy, wz = _WEDGE
    _n_hw, _n_hh, n_yo, _n_ch = sf.section(stations, z_nose)
    z_wedge = z_nose + wz * 0.5 - _WEDGE_PROUD
    kit.wedge(parts, 'heavy.prow.wedge', kit.ROLE_ARMOUR,
              (0.0, n_yo, z_wedge), _WEDGE, hull_mat,
              taper=(0.48, 0.58))

    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern),
                  max(d_hw * 0.84, 0.72), max(d_hh * 0.78, 0.54),
                  nozzles=4, depth=0.56, detail=detail)

    if detail < 1:
        return

    # ── Flares, citadel, shoulders, radiators (detail 1+) ───────────────
    z_flare = z_bow + 1.70
    y_flare = sf.section(stations, z_flare)[2]
    fx_fl = _min_flank(stations, z_flare - 0.20, z_flare + 0.20, y_flare,
                       samples=5)
    if fx_fl > 0.0:
        x_fl = _seat_x(fx_fl, _FLARE_REACH * 0.5)
        am.rib_flare(parts, 'heavy.flare.port', hull_mat,
                     (-x_fl, y_flare, z_flare),
                     reach=_FLARE_REACH, facing='port', detail=detail)
        am.rib_flare(parts, 'heavy.flare.stbd', hull_mat,
                     (x_fl, y_flare, z_flare),
                     reach=_FLARE_REACH, facing='starboard', detail=detail)

    z_cit = (z_bow + z_mid) * 0.52
    cx, cy, cz = _CITADEL
    y_deck = sf.top_y(stations, z_cit, 0.0)
    # Seat so the detail-2 plate_course (centre + 0.08*cy, height 0.18*cy)
    # straddles the deck. A shallow sit left that course inside the hollow
    # citadel shell and the surface voxeliser called it a float.
    y_cit = y_deck - cy * 0.12
    am.citadel_plate(parts, 'heavy.citadel', hull_mat,
                     (0.0, y_cit, z_cit), size=_CITADEL, detail=detail)

    sx, sy, sz = _SHOULDER
    z_sh = z_bow + sz * 0.5 + 0.16
    y_sh = sf.section(stations, z_sh)[2]
    fx_sh = _min_flank(stations, z_sh - sz * 0.5, z_sh + sz * 0.5, y_sh)
    if fx_sh > 0.0:
        x_sh = _seat_x(fx_sh, sx * 0.5)
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.chamfer_block(parts, 'heavy.shoulder.' + tag, kit.ROLE_ARMOUR,
                              (side * x_sh, y_sh, z_sh), _SHOULDER, hull_mat,
                              chamfer=min(sx, sy) * 0.16)

    z_rad = l * 0.385
    rx, _ry, rz = _RAD
    y_rad = sf.top_y(stations, z_rad, 0.0) - 0.02
    fx_rad = _min_flank(stations, z_rad - rz * 0.5, z_rad + rz * 0.5, y_rad)
    if fx_rad > 0.0:
        x_rad = _seat_x(fx_rad, rx * 0.5)
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.radiator(parts, 'heavy.radiator.' + tag, hull_mat,
                        (side * x_rad, y_rad, z_rad), _RAD, detail=detail)

    # Rescue is always present at playable LODs.
    z_pan = l * 0.160
    px, _py, pz = sf.RESCUE_PANNIER
    _p_hw, p_hh, p_yo, _p_ch = sf.section(stations, z_pan)
    y_pan = p_yo - p_hh * 0.42
    fx_pan = _min_flank(stations, z_pan - pz * 0.5, z_pan + pz * 0.5, y_pan,
                        samples=5)
    if fx_pan > 0.0:
        x_pan = _seat_x(fx_pan, px * 0.5)
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.rescue_pannier(parts, glow, 'heavy.rescue.' + tag,
                              hull_mat, glow_mat,
                              (side * x_pan, y_pan, z_pan), detail=detail)

    hw.recognition_band(parts, 'heavy.prow', hull_mat,
                        (0.0, n_yo + 0.08, z_wedge - wz * 0.5 + 0.12),
                        size=(0.24, 1.20, 0.18), detail=detail)

    if detail < 2:
        return

    # ── Ribs, courses, rails, honor, lamps (detail 2+; repeats half) ────
    z_rib = (z_bow + z_mid) * 0.50
    y_rib = sf.section(stations, z_rib)[2]
    fx_rib = _min_flank(stations, z_rib - _RIB_SPAN * 0.5,
                        z_rib + _RIB_SPAN * 0.5, y_rib)
    if fx_rib > 0.0:
        rib_half = (sf.ARMOUR_RIB_T + 0.04) * 0.5
        x_rib = _seat_x(fx_rib, rib_half)
        am.rib_run(parts, 'heavy.rib.port', hull_mat,
                   (-x_rib, y_rib, z_rib),
                   count=_RIB_N, span=_RIB_SPAN, axis='z',
                   facing='port', detail=detail)
        am.rib_run(parts, 'heavy.rib.stbd', hull_mat,
                   (x_rib, y_rib, z_rib),
                   count=_RIB_N, span=_RIB_SPAN, axis='z',
                   facing='starboard', detail=detail)

    if fx_sh > 0.0:
        course = (sx * 0.72, sy * 0.78, sz * 0.88)
        am.chamfered_course(parts, 'heavy.shoulder.course.port', hull_mat,
                            (-x_sh, y_sh, z_sh), size=course,
                            count=4, axis='z', detail=detail)
        am.chamfered_course(parts, 'heavy.shoulder.course.stbd', hull_mat,
                            (x_sh, y_sh, z_sh), size=course,
                            count=4, axis='z', detail=detail)
        am.armour_course(parts, 'heavy.shoulder.plate.port', hull_mat,
                         (-x_sh, y_sh + sy * 0.12, z_sh),
                         size=(0.22, sy * 0.55, sz * 0.72),
                         count=5, axis='z', detail=detail)
        am.armour_course(parts, 'heavy.shoulder.plate.stbd', hull_mat,
                         (x_sh, y_sh + sy * 0.12, z_sh),
                         size=(0.22, sy * 0.55, sz * 0.72),
                         count=5, axis='z', detail=detail)

    # Two batteries at detail 2; four (two pairs) at detail 3.
    n_bat = 2 if detail >= 3 else 1
    y_rail = y_cit + cy * 0.5 - 0.04
    x_rail = cx * 0.28
    z_rail = z_cit - 0.20
    hw.turret_rail(parts, glow, 'heavy.rail.port', hull_mat, glow_mat,
                   (-x_rail, y_rail, z_rail),
                   count=n_bat, axis='z', facing='up', detail=detail)
    hw.turret_rail(parts, glow, 'heavy.rail.stbd', hull_mat, glow_mat,
                   (x_rail, y_rail, z_rail),
                   count=n_bat, axis='z', facing='up', detail=detail)

    # Single honor plate, starboard of the prow band.
    hw.honor_plate(parts, 'heavy.prow.honor', hull_mat,
                   (0.22, n_yo + 0.42, z_wedge - wz * 0.5 + 0.10),
                   detail=detail)

    z_lamp = z_bow + 0.90
    for i, z_lp in enumerate((z_lamp, z_lamp + sf.LAMP_SPACING)):
        y_lp = sf.top_y(stations, z_lp, 0.0) - 0.02
        fx_lp = sf.flank_x(stations, z_lp, y_lp)
        if fx_lp <= 0.0:
            continue
        x_lp = _seat_x(fx_lp, 0.08)
        hw.navigation_light(parts, glow, 'heavy.lamp.port.%d' % i,
                            hull_mat, glow_mat,
                            (-x_lp, y_lp, z_lp), detail=detail)
        hw.navigation_light(parts, glow, 'heavy.lamp.stbd.%d' % i,
                            hull_mat, glow_mat,
                            (x_lp, y_lp, z_lp), detail=detail)

    slit = kit.box(glow, 'heavy.citadel.slit-band', kit.ROLE_RECESS,
                   (0.0, y_cit + cy * 0.18, z_cit - cz * 0.5 + 0.02),
                   _SLIT, glow_mat)
    _glow(slit)
