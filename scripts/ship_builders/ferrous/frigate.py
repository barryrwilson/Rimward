"""Ferrous Hegemony Frigate — LINE ESCORT.

Bible §4.2 Frigate: "A compact naval capital ship with a stepped
command tower, layered central citadel, rescue-capable ventral
hangar, and rigorously paired batteries. It should be impressive,
not gigantic."

Plate 02-ferrous-hegemony-ship.png is the FRIGATE / capital charter:
segmented cigar, blunt prow with a VERTICAL crimson band + gold
crest, stepped command tower / layered citadel, paired turrets on a
dorsal rail, OPEN flank hangar with a nested craft, armour rib
segmentation along the hull.

Construction logic (synthesis/21 §G6): REPEATED MODULE, ARMOURED —
20–40 ribs at even pitch; turret modules on a rail. Human and
Ferrous module sizes stay absolute. Never multiply sf.* by l, b or h.

BODY PLAN
    A segmented cigar loft (kit.hull_loft, sf.fair, slight waist)
    with ABSOLUTE half-extents, never *b or *h. Bow is a blunt prow
    face with a vertical crimson band and a brass honor. Mid is a
    stepped citadel, paired dorsal battery rails, flank rib runs,
    and a STARBOARD-ONLY hangar berth. Stern is a 6-nozzle drive
    face and a pair of FLAT radiators. A ventral rescue hatch sits
    under the mid body.

STATION / ZONE REASONING (z as fractions of l; half-extents ABSOLUTE)
    Loft nose at l*-0.512 = -16.384.
    Transom / drive plane at l*+0.482 = +15.424. Drive discs stand
    0.12 proud (z ≈ 15.544). Prow face sits 0.08 forward of the
    loft nose.
    Authored spanZ ~ 32.0 (band [19.20, 44.80], aim 30–34).
    Bow / mid seam at l*-0.290 = -9.280. Mid / stern at l*+0.220
    = +7.040.
    Zones of lofted length 31.808:
        bow   22.3 %  blunt prow + crimson band + honor
        mid   51.3 %  stepped citadel + rails + hangar + ribs
        stern 26.4 %  drive face + radiator pair
    Mid half-beam 3.70, mid half-height 2.24. Citadel and outboard
    batteries give the beam; a slim spine would fail X/Z >= 0.16.

OUTLINE-BREAKER (§G2)
    am.rib_flare pair at the midships shoulders. Grow REACH, never
    thickness.
        authored reach = 5.20
        floor           = 0.15 * 32.0 = 4.80
        authored share  = 16.3 % of l

§G3 THERMAL / DRIVE
    One pair of hw.radiator, FLAT, no fins. Each slab is
    (2.60, 0.16, 3.20) full extents. Drive face is a 3x2 of 6
    countable nozzles. No kit.engine_bank.

§G5 HANGAR
    hw.hangar_berth on the STARBOARD mid flank, facing starboard.
    Size at least sf.HANGAR_BERTH. The well overlaps the loft.
    Nested craft lives inside the well. Ventral hw.rescue_hatch
    plus one pannier pair make the berth rescue-capable.

EMISSIVE (authored aim, <= 5 % of hull area)
    6 drive discs, one tower slit band, hangar lip lamp (detail 3),
    few navigation markers. Never edge-light the hull.

DETAIL LADDER
    3  full: every construct, full rib / rail / plate count
    2  all construct families; rails and ribs half
    1  tower + hangar frame + flare + drive + radiators
    0  loft + prow + drive housing

ENVELOPE / AUTHORED AIM
    Driver: l = 32.0, b = 12.48, h = 8.32. Aim span ~32
    (band [19.20, 44.80], target 32.0). Must sit between heavy
    (~17) and freighter (~74).
    Authored spanZ ~ 32.0; Z/X >= 1.15; Y/Z <= 0.60; X/Z >= 0.16.
    Authored hull verts 18,000-40,000 (band 16,000-84,000).
    Island aim: one body; fittings overlap the host by >= 0.08.
    Functional asymmetry: hangar on STARBOARD only.
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
_FACE_IN = 0.06
_SLAB_T = 0.18
_SLAB_Y = 0.14
_PLATE_D = 0.16
_FLARE_REACH = 5.20
_DRIVE_DEP = 0.56
_PROW = (5.00, 3.60, 0.40)
_HANGAR = (2.20, 1.40, 3.20)
_RAD = (2.60, 0.16, 3.20)
_SLIT = (1.10, 0.06, 0.12)
_STEP0 = (3.20, 0.92, 4.40)
_STEP1 = (2.40, 0.78, 3.20)
_STEP2 = (1.60, 0.68, 2.10)


def _frigate_stations(l, b, h):
    """Segmented cigar. Half-extents are absolute radii.

    Blunt prow, slight mid waist, generous transom for a 3x2 drive.
    ``b`` and ``h`` name the class envelope; the loft does not fill them.
    """
    _ = (b, h)
    return [
        # -- BOW: blunt iron face -------------------------------------------
        sf.fair(l * -0.512, 2.55, 1.90, 0.06, k=0.22),  # loft nose
        sf.fair(l * -0.440, 3.15, 2.10, 0.08, k=0.24),
        sf.fair(l * -0.360, 3.55, 2.20, 0.10),
        sf.fair(l * -0.290, 3.70, 2.24, 0.10),  # bow/mid seam

        # -- MID: citadel beam, slight waist --------------------------------
        sf.fair(l * -0.140, 3.62, 2.18, 0.08),
        sf.fair(l *  0.000, 3.48, 2.12, 0.06),  # waist
        sf.fair(l *  0.120, 3.64, 2.18, 0.08),
        sf.fair(l *  0.220, 3.58, 2.14, 0.08),  # mid/stern seam

        # -- STERN: drive housing -------------------------------------------
        sf.fair(l *  0.340, 3.30, 2.00, 0.06),
        sf.fair(l *  0.420, 3.10, 1.88, 0.04),
        sf.fair(l *  0.482, 2.92, 1.76, 0.02),  # transom
    ]


def _min_skin(stations, z0, z1, samples=9):
    """Min straight-flank half-extents on [z0, z1].

    Returns ``(half_w, straight_half_h, flat_half, y_offset)``.
    """
    hw_m = 1e9
    st_h = 1e9
    fw_m = 1e9
    yo_s = 0.0
    n = max(int(samples), 2)
    for i in range(n):
        z = z0 + (z1 - z0) * i / float(n - 1)
        hw_s, hh, yo, ch = sf.section(stations, z)
        ch = sf.clamped(hw_s, hh, ch)
        hw_m = min(hw_m, hw_s)
        st_h = min(st_h, hh - ch)
        fw_m = min(fw_m, hw_s - ch)
        yo_s += yo
    return hw_m, st_h, fw_m, yo_s / float(n)


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


def _lod_n(n, detail, floor=2):
    """Count down plate repeats. Detail 3 is full; 2 is half."""
    if detail >= 3:
        return max(floor, int(n))
    return max(floor, int(n) // 2)


def _glow(obj):
    if obj:
        obj['skin_role'] = 'glow'
    return obj


def _skin_run(parts, name, mat, stations, z0, z1, cols, rows, detail):
    """Zone-local donated plates. Does not cross a seam.

    Seat on the MINIMUM half-beam in the run so plates pierce the loft
    at the pinch and stay inside the skin at the swell.
    """
    if detail < 2:
        return
    run = z1 - z0
    if run < 0.40:
        return
    cz = 0.5 * (z0 + z1)
    hw_m, st_h, fw_m, yo = _min_skin(stations, z0, z1)
    cols = _lod_n(cols, detail)
    rows = _lod_n(rows, detail)
    span_y = max(st_h * 2.0, 0.40)
    A = kit.ROLE_ARMOUR
    if hw_m > 0.20:
        for side, face, tag in ((1.0, 'x', 's'), (-1.0, '-x', 'p')):
            loc_x = side * (hw_m - _FACE_IN - _SLAB_T * 0.5)
            kit.plate_grid(parts, '%s.flank.%s' % (name, tag), A,
                           (loc_x, yo, cz),
                           (_SLAB_T, span_y * 0.90, run),
                           mat, cols=cols, rows=rows, face=face,
                           depth=_PLATE_D, gap=0.08)
    ty = sf.top_y(stations, cz, 0.0)
    by = sf.bottom_y(stations, cz, 0.0)
    flat = max(fw_m, 0.28)
    deck_cols = _lod_n(max(3, cols // 2), detail)
    deck_rows = cols
    kit.plate_grid(parts, name + '.deck', A,
                   (0.0, ty - _FACE_IN - _SLAB_Y * 0.5, cz),
                   (flat * 1.55, _SLAB_Y, run),
                   mat, cols=deck_cols, rows=deck_rows, face='y',
                   depth=_PLATE_D, gap=0.08)
    kit.plate_grid(parts, name + '.keel', A,
                   (0.0, by + _FACE_IN + _SLAB_Y * 0.5, cz),
                   (flat * 1.35, _SLAB_Y, run),
                   mat, cols=max(2, deck_cols - 1),
                   rows=max(2, deck_rows - 2),
                   face='-y', depth=_PLATE_D, gap=0.08)


def _rib_zone(parts, tag, mat, stations, z0, z1, count, detail, skip=None):
    """One flank-pair of rib runs that stay inside [z0, z1].

    ``skip`` is an optional (z_lo, z_hi) gap on STARBOARD only so the
    hangar mouth is not closed by ribs.
    """
    span = max(z1 - z0, 0.40)
    cz = 0.5 * (z0 + z1)
    yo = sf.section(stations, cz)[2]
    fx = _min_flank(stations, z0, z1, yo)
    if fx <= 0.0:
        return
    rib_half = (sf.ARMOUR_RIB_T + 0.04) * 0.5
    x_rib = _seat_x(fx, rib_half)
    am.rib_run(parts, 'frigate.rib.%s.port' % tag, mat,
               (-x_rib, yo, cz),
               count=count, span=span, axis='z',
               facing='port', detail=detail)
    if skip is None:
        am.rib_run(parts, 'frigate.rib.%s.stbd' % tag, mat,
                   (x_rib, yo, cz),
                   count=count, span=span, axis='z',
                   facing='starboard', detail=detail)
        return
    s0, s1 = skip
    if s0 > z0 + 0.50:
        z_a1 = s0
        span_a = z_a1 - z0
        am.rib_run(parts, 'frigate.rib.%s.stbd.a' % tag, mat,
                   (x_rib, yo, 0.5 * (z0 + z_a1)),
                   count=count, span=span_a, axis='z',
                   facing='starboard', detail=detail)
    if s1 < z1 - 0.50:
        z_b0 = s1
        span_b = z1 - z_b0
        am.rib_run(parts, 'frigate.rib.%s.stbd.b' % tag, mat,
                   (x_rib, yo, 0.5 * (z_b0 + z1)),
                   count=count, span=span_b, axis='z',
                   facing='starboard', detail=detail)


def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Ferrous Hegemony line escort (frigate class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full, 2 half rails/ribs, 1 tower+hangar+flare+drive+rads,
                0 loft + prow + drive housing.
    """
    _ = (b, h)
    stations = _frigate_stations(l, b, h)

    z_nose = l * -0.512
    z_bow = l * -0.290
    z_mid = l * 0.220
    z_stern = l * 0.482

    z_cit = l * 0.040
    z_hang = l * -0.050
    z_flare = l * -0.020
    z_rail = l * -0.120
    z_hatch = l * -0.180
    z_rad = l * 0.360

    # ── Loft + blunt prow + drive (detail 0+) ───────────────────────────
    kit.hull_loft(parts, 'frigate.hull', kit.ROLE_HULL, stations, hull_mat)

    n_hw, n_hh, n_yo, _n_ch = sf.section(stations, z_nose)
    px, py, pz = _PROW
    px = min(px, n_hw * 2.0 * 0.98)
    py = min(py, n_hh * 2.0 * 0.98)
    z_prow = z_nose + pz * 0.5 - 0.08
    kit.chamfer_block(parts, 'frigate.prow.face', kit.ROLE_ARMOUR,
                      (0.0, n_yo, z_prow), (px, py, pz), hull_mat,
                      chamfer=min(px, py) * 0.14)

    hw.recognition_band(parts, 'frigate.prow', hull_mat,
                        (0.0, n_yo + 0.12, z_prow - pz * 0.5 + 0.06),
                        size=(0.55, 2.20, 0.18), detail=detail)

    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern),
                  max(d_hw * 0.88, 1.10), max(d_hh * 0.84, 0.80),
                  nozzles=6, depth=_DRIVE_DEP, detail=detail)

    if detail < 1:
        return

    # ── Tower, hangar frame, flare, radiators (detail 1+) ───────────────
    y_deck = sf.top_y(stations, z_cit, 0.0)
    y0 = y_deck - _BURY + _STEP0[1] * 0.5
    # citadel_plate at detail>=2 inserts a plate_course near the block
    # centre. Those plates sit inside the hollow chamfer shell and the
    # surface voxeliser reports them as floats. Keep the stepped masses.
    _cit_d = min(detail, 1)
    am.citadel_plate(parts, 'frigate.citadel.step0', hull_mat,
                     (0.0, y0, z_cit), size=_STEP0, detail=_cit_d)
    y1 = y0 + _STEP0[1] * 0.5 + _STEP1[1] * 0.5 - 0.08
    am.citadel_plate(parts, 'frigate.citadel.step1', hull_mat,
                     (0.0, y1, z_cit + 0.10), size=_STEP1, detail=_cit_d)
    y2 = y1 + _STEP1[1] * 0.5 + _STEP2[1] * 0.5 - 0.08
    am.citadel_plate(parts, 'frigate.citadel.step2', hull_mat,
                     (0.0, y2, z_cit + 0.18), size=_STEP2, detail=_cit_d)

    _hx, _hy, hz = _HANGAR
    y_hang = sf.section(stations, z_hang)[2]
    fx_h = _min_flank(stations, z_hang - hz * 0.5, z_hang + hz * 0.5, y_hang)
    if fx_h > 0.0:
        # Centre just inboard of the skin so the well overlaps the loft.
        x_hang = fx_h - 0.20
        hw.hangar_berth(parts, glow, 'frigate.hangar', hull_mat, glow_mat,
                        (x_hang, y_hang, z_hang), size=_HANGAR,
                        facing='starboard', detail=detail)

    y_flare = sf.section(stations, z_flare)[2]
    fx_fl = _min_flank(stations, z_flare - 0.20, z_flare + 0.20, y_flare,
                       samples=5)
    if fx_fl > 0.0:
        x_fl = _seat_x(fx_fl, _FLARE_REACH * 0.5)
        am.rib_flare(parts, 'frigate.flare.port', hull_mat,
                     (-x_fl, y_flare, z_flare),
                     reach=_FLARE_REACH, facing='port', detail=detail)
        am.rib_flare(parts, 'frigate.flare.stbd', hull_mat,
                     (x_fl, y_flare, z_flare),
                     reach=_FLARE_REACH, facing='starboard', detail=detail)

    rx, _ry, rz = _RAD
    y_rad = sf.top_y(stations, z_rad, 0.0) - 0.02
    fx_rad = _min_flank(stations, z_rad - rz * 0.5, z_rad + rz * 0.5, y_rad)
    if fx_rad > 0.0:
        x_rad = _seat_x(fx_rad, rx * 0.5)
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.radiator(parts, 'frigate.radiator.' + tag, hull_mat,
                        (side * x_rad, y_rad, z_rad), _RAD, detail=detail)

    hy_h = sf.RESCUE_PANNIER[1]
    y_hatch = sf.bottom_y(stations, z_hatch, 0.0) + hy_h * 0.35
    hw.rescue_hatch(parts, glow, 'frigate.rescue', hull_mat, glow_mat,
                    (0.0, y_hatch, z_hatch), face='-y', detail=detail)

    hw.honor_plate(parts, 'frigate.prow.honor', hull_mat,
                   (0.0, n_yo + n_hh * 0.42, z_prow - pz * 0.5 + 0.08),
                   detail=detail)

    slit = kit.box(glow, 'frigate.citadel.slit-band', kit.ROLE_RECESS,
                   (0.0, y2, z_cit + 0.18 - _STEP2[2] * 0.42),
                   _SLIT, glow_mat)
    _glow(slit)

    if detail < 2:
        return

    # ── Ribs, courses, rails, plates, lamps (detail 2+; repeats half) ───
    hang_lo = z_hang - hz * 0.5 - 0.16
    hang_hi = z_hang + hz * 0.5 + 0.16
    _rib_zone(parts, 'bow', hull_mat, stations,
              z_nose + 0.80, z_bow - 0.12, 20, detail)
    _rib_zone(parts, 'mid', hull_mat, stations,
              z_bow + 0.12, z_mid - 0.12, 32, detail,
              skip=(hang_lo, hang_hi))
    _rib_zone(parts, 'stern', hull_mat, stations,
              z_mid + 0.12, z_stern - 0.70, 20, detail)

    z_m0 = l * -0.140
    z_m1 = l * 0.000
    _skin_run(parts, 'frigate.skin.bow', hull_mat, stations,
              z_nose + 0.70, z_bow - 0.12, 10, 5, detail)
    _skin_run(parts, 'frigate.skin.mid.a', hull_mat, stations,
              z_bow + 0.12, z_m0 - 0.06, 16, 6, detail)
    _skin_run(parts, 'frigate.skin.mid.b', hull_mat, stations,
              z_m0 + 0.06, z_m1 - 0.06, 16, 6, detail)
    _skin_run(parts, 'frigate.skin.mid.c', hull_mat, stations,
              z_m1 + 0.06, z_mid - 0.12, 16, 6, detail)
    _skin_run(parts, 'frigate.skin.stern', hull_mat, stations,
              z_mid + 0.12, z_stern - 0.70, 10, 5, detail)

    hw_b, st_b, _fw_b, yo_b = _min_skin(stations, z_nose + 0.70, z_bow - 0.12)
    am.armour_course(parts, 'frigate.course.bow.port', hull_mat,
                     (-(hw_b - 0.04), yo_b, 0.5 * (z_nose + 0.70 + z_bow)),
                     size=(0.22, st_b * 1.70, z_bow - z_nose - 0.90),
                     count=5, axis='z', detail=detail)
    am.armour_course(parts, 'frigate.course.bow.stbd', hull_mat,
                     (hw_b - 0.04, yo_b, 0.5 * (z_nose + 0.70 + z_bow)),
                     size=(0.22, st_b * 1.70, z_bow - z_nose - 0.90),
                     count=5, axis='z', detail=detail)

    hw_m, st_m, _fw_m, yo_m = _min_skin(stations, z_bow + 0.20, z_mid - 0.20)
    am.chamfered_course(parts, 'frigate.course.mid.port', hull_mat,
                        (-(hw_m - 0.05), yo_m + st_m * 0.15,
                         0.5 * (z_bow + z_mid)),
                        size=(0.28, st_m * 1.20, (z_mid - z_bow) * 0.70),
                        count=6, axis='z', detail=detail)
    am.chamfered_course(parts, 'frigate.course.mid.stbd', hull_mat,
                        (hw_m - 0.05, yo_m + st_m * 0.15,
                         0.5 * (z_bow + z_mid)),
                        size=(0.28, st_m * 1.20, (z_mid - z_bow) * 0.70),
                        count=6, axis='z', detail=detail)

    hw_s, st_s, _fw_s, yo_s = _min_skin(stations, z_mid + 0.16, z_stern - 0.70)
    am.armour_course(parts, 'frigate.course.stern.port', hull_mat,
                     (-(hw_s - 0.04), yo_s, 0.5 * (z_mid + z_stern - 0.50)),
                     size=(0.22, st_s * 1.55, z_stern - z_mid - 0.90),
                     count=4, axis='z', detail=detail)
    am.armour_course(parts, 'frigate.course.stern.stbd', hull_mat,
                     (hw_s - 0.04, yo_s, 0.5 * (z_mid + z_stern - 0.50)),
                     size=(0.22, st_s * 1.55, z_stern - z_mid - 0.90),
                     count=4, axis='z', detail=detail)

    n_bat = 4
    x_rail = 0.90
    y_rail = sf.top_y(stations, z_rail, x_rail) - 0.04 + sf.RAIL_H * 0.5
    hw.turret_rail(parts, glow, 'frigate.rail.port', hull_mat, glow_mat,
                   (-x_rail, y_rail, z_rail),
                   count=n_bat, axis='z', facing='up', detail=detail)
    hw.turret_rail(parts, glow, 'frigate.rail.stbd', hull_mat, glow_mat,
                   (x_rail, y_rail, z_rail),
                   count=n_bat, axis='z', facing='up', detail=detail)

    z_pan = z_hang + 1.80
    ppx, ppy, ppz = sf.RESCUE_PANNIER
    y_pan = sf.bottom_y(stations, z_pan, 0.0) + ppy * 0.5 - 0.06
    fx_pan = _min_flank(stations, z_pan - ppz * 0.5, z_pan + ppz * 0.5, y_pan,
                        samples=5)
    if fx_pan > 0.0:
        x_pan = _seat_x(fx_pan, ppx * 0.5)
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.rescue_pannier(parts, glow, 'frigate.pannier.' + tag,
                              hull_mat, glow_mat,
                              (side * x_pan, y_pan, z_pan), detail=detail)

    z_lamp_b = z_bow - 1.20
    y_lamp_b = sf.top_y(stations, z_lamp_b, 0.0) - 0.02
    fx_lb = sf.flank_x(stations, z_lamp_b, y_lamp_b)
    if fx_lb > 0.0:
        x_lb = _seat_x(fx_lb, 0.08)
        hw.navigation_light(parts, glow, 'frigate.lamp.bow.port',
                            hull_mat, glow_mat,
                            (-x_lb, y_lamp_b, z_lamp_b), detail=detail)
        hw.navigation_light(parts, glow, 'frigate.lamp.bow.stbd',
                            hull_mat, glow_mat,
                            (x_lb, y_lamp_b, z_lamp_b), detail=detail)

    z_lamp_s = z_mid + 1.20
    y_lamp_s = sf.top_y(stations, z_lamp_s, 0.0) - 0.02
    fx_ls = sf.flank_x(stations, z_lamp_s, y_lamp_s)
    if fx_ls > 0.0:
        x_ls = _seat_x(fx_ls, 0.08)
        hw.navigation_light(parts, glow, 'frigate.lamp.stern.port',
                            hull_mat, glow_mat,
                            (-x_ls, y_lamp_s, z_lamp_s), detail=detail)
        hw.navigation_light(parts, glow, 'frigate.lamp.stern.stbd',
                            hull_mat, glow_mat,
                            (x_ls, y_lamp_s, z_lamp_s), detail=detail)
