"""Ferrous Hegemony Ace — HONOR INTERCEPTOR.

Bible §4.2 Ace: "A sharpened, immaculate development of the picket with a
longer prow, larger paired drives, a single crimson centerline band, and
formal recognition plates."

Escorts in docs/FactionExamples/02-ferrous-hegemony-ship.png are the
light/ace brief: compact overbuilt iron wedges, blunt prows, crimson
recognition, paired formal guns, no wings.

Silhouette family: segmented cigar / monumental iron wedge + small
citadel. Sharper, longer prow than the light picket. Not a fighter dart.
Not a citadel brick. No radiators. No hangar.

BODY PLAN
    A faceted iron loft (kit.hull_loft) authored with sf.fair. Half-beam
    swells from a blunt-but-narrow nose to an overbuilt mid wedge, then
    holds enough transom for two drive nozzles. Mid wears one small
    citadel, a paired battery, a rib run on each flank, and the G2 rib
    flare. Bow wears the crimson centerline band. Stern is a larger
    paired drive_face. Rescue panniers sit on the aft mid flanks. One
    starboard honor_plate is the only deliberate asymmetry.

STATION-LIST REASONING (z as fractions of l; half-extents *b / *h so
the wedge stays in the picket family). At l = 7.2, b = 2.88, h = 1.44:
    Loft nose at l*-0.505 = -3.636; transom at l*+0.480 = +3.456 ->
    loft z-span 7.092. Drive loc is the transom; housing face 0.12 aft
    and throat depth can reach +0.14 past loc (disc z ≈ 3.476). A prow
    wedge stands ~0.06 proud of the loft nose. Authored max span ≈ 7.28,
    slightly long of the ferrous light (~6.28) and well below cutter
    (~9.7). Max half-beam b*0.36 = 1.037 at mid; flare outboard ≈ 1.56.

ZONES (no plate course crosses a seam):
    bow   l*-0.505..l*-0.285   22 %  blunt/sharpened wedge + centerline band
    mid   l*-0.285..l* 0.255   54 %  thin citadel, paired batteries, rib run
    stern l* 0.255..l* 0.480   22 %  larger PAIRED drives — 2 nozzles

OUTLINE-BREAKER (G2): one armour rib flare pair, port/starboard mid.
    Floor is 0.15*l = 1.08. Authored reach = 1.24. Thickness stays
    sf.RIB_FLARE_T. Do not inflate rib thickness.

Functional asymmetry: a single starboard hw.honor_plate.

EMISSIVE BUDGET (<= 5 %):
    two drive discs + one cockpit slit + 2 nav lights. Never edge-light.
    Rescue panniers are clamped to detail 1 so they do not add lamps.
    Battery housings may emit their own module slits at detail 2+.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: loft, prow, band, flare, citadel, rib runs, plates,
       batteries, panniers, honor, nav, cockpit, drive
    2  half rib / plate repeats; flare + drives + batteries +
       panniers + honor + nav + cockpit kept
    1  loft + prow + band + flare + citadel + rib bars + drives
       + battery housings + pannier housings
    0  loft + prow + band + drive housing

DENSITY (AUTHORED AIM, not measured):
    hull verts 6,000-16,000 (SHIP_SCALE.ace.hull band 4,000-21,000)
    max span ~7.3 (band [4.32, 10.08], target 7.2)
    spanZ/spanX >= 1.15; spanY/spanZ <= 0.60; spanX/spanZ >= 0.16
    pivot |centre / span| <= 0.15
    proxy cover >= 80 %; ONE connected body (island voxel 0.06)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import armour as am
from . import hardware as hw


# Absolute seating. Never multiplied by ship l, b or h.
_BURY = 0.10
_DRIVE_DEP = 0.54
_FLARE_REACH = 1.24          # G2 floor 0.15*l = 1.08 at l = 7.2
_CITADEL = (0.78, 0.22, 1.02)
_BAND = (0.14, 0.10, 1.05)   # centerline; default band is too tall for ace
_PROW = (0.90, 0.64, 0.44)
_SPINE = (0.42, 0.10, 2.20)
_KEEL = (0.70, 0.10, 2.40)
_SLAB_T = 0.18
_SLAB_Y = 0.12
_PLATE_D = 0.22              # sink 0.055; plus bury keeps overlap > 0.06
_FACE_IN = 0.06


# ===========================================================================
# STATION LIST
# ===========================================================================

def _ace_stations(l, b, h):
    """Overbuilt iron wedge. Longer, sharper prow than the light picket.

    Half-extents use the class envelope so the hull stays in the picket
    family. Nose half-beam is b*0.18 (light is b*0.22). Mid half-beam
    is b*0.36. Transom holds b*0.24 for the paired drive housing.
    """
    return [
        # -- BOW: longer sharpened wedge --------------------------------
        sf.fair(l * -0.505, b * 0.18, h * 0.26, 0.0),
        sf.fair(l * -0.430, b * 0.24, h * 0.30, h * 0.01),
        sf.fair(l * -0.360, b * 0.30, h * 0.34, h * 0.015),
        sf.fair(l * -0.285, b * 0.33, h * 0.36, h * 0.02),

        # -- MID: overbuilt iron, thin citadel sit ----------------------
        sf.fair(l * -0.140, b * 0.35, h * 0.38, h * 0.02),
        sf.fair(l *  0.000, b * 0.36, h * 0.38, h * 0.02),
        sf.fair(l *  0.140, b * 0.34, h * 0.36, h * 0.01),
        sf.fair(l *  0.255, b * 0.32, h * 0.34, 0.0),

        # -- STERN: paired-drive transom --------------------------------
        sf.fair(l *  0.370, b * 0.28, h * 0.30, 0.0),
        sf.fair(l *  0.480, b * 0.24, h * 0.26, 0.0),
    ]


def _min_skin(stations, z0, z1, samples=9):
    """Min straight-flank half-extents on [z0, z1].

    Returns ``(half_w, straight_half_h, flat_half, y_offset)``. Callers
    double these for kit full extents. Uses the smallest section in the
    run so a plate stays on the loft and does not float at a taper.
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


def _lod_n(n, detail, floor=2):
    """Count down plate repeats. Detail 3 is full; 2 is half."""
    if detail >= 3:
        return max(floor, int(n))
    return max(floor, int(n) // 2)


def _skin_run(parts, name, mat, stations, z0, z1, cols, rows, detail):
    """Mid-band donated plates. Does not cross a zone seam.

    Seat on the MINIMUM half-beam in the run so plates pierce the loft
    shell at the pinch and stay inside the skin at the swell.
    """
    if detail < 2:
        return
    run = z1 - z0
    if run < 0.24:
        return
    cz = 0.5 * (z0 + z1)
    hw_m, st_h, fw_m, yo = _min_skin(stations, z0, z1)
    cols = _lod_n(cols, detail)
    rows = _lod_n(rows, detail)
    span_y = max(st_h * 2.0, 0.22)
    A = kit.ROLE_ARMOUR
    if hw_m > 0.14:
        for side, face, tag in ((1.0, 'x', 's'), (-1.0, '-x', 'p')):
            loc_x = side * (hw_m - _FACE_IN - _SLAB_T * 0.5)
            kit.plate_grid(parts, '%s.flank.%s' % (name, tag), A,
                           (loc_x, yo, cz),
                           (_SLAB_T, span_y * 0.90, run),
                           mat, cols=cols, rows=rows, face=face,
                           depth=_PLATE_D, gap=0.08)
    ty = sf.top_y(stations, cz, 0.0)
    by = sf.bottom_y(stations, cz, 0.0)
    flat = max(fw_m, 0.16)
    deck_cols = _lod_n(max(3, cols // 3), detail)
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


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Ferrous Hegemony honor interceptor (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.2, 2.88, 1.44).
    detail   -- 3 full  2 half repeats  1 primary + flare + drives
                0 loft + prow + drive housing.
    """
    H = kit.ROLE_HULL
    stations = _ace_stations(l, b, h)

    z_nose = l * -0.505
    z_bow_s = l * -0.285
    z_mid_s = l * 0.255
    z_trans = l * 0.480
    z_flare = l * 0.000
    z_cit = l * -0.060
    z_batt = l * -0.120
    z_rib = 0.5 * (z_bow_s + z_mid_s)
    z_band = z_nose + _BAND[2] * 0.52
    z_cock = l * -0.240
    z_nav = l * -0.400
    z_pan = l * 0.140
    z_honor = l * 0.040
    z_spine = l * -0.020
    z_keel = l * 0.020

    # ── Iron wedge loft (always, detail 0+) ─────────────────────────────
    kit.hull_loft(parts, 'ace.hull', H, stations, hull_mat)

    # ── PROW CAP (always): blunt iron wedge, buried into the loft nose
    yo_n = sf.section(stations, z_nose + 0.16)[2]
    kit.wedge(parts, 'ace.prow', kit.ROLE_ARMOUR,
              (0.0, yo_n, z_nose + _PROW[2] * 0.36),
              _PROW, hull_mat, taper=(0.62, 0.70))

    # ── CRIMSON CENTERLINE BAND (always; name contains prow) ────────────
    y_band = sf.top_y(stations, z_band, 0.0) - _BAND[1] * 0.35
    hw.recognition_band(parts, 'ace.prow', hull_mat,
                        (0.0, y_band, z_band), size=_BAND, detail=detail)

    # ── DRIVE FACE at the transom (always; 2 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern loft. Driver glow sits near z = l*0.48.
    hw_t, hh_t, yo_t, _ch = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'ace.drive', hull_mat, glow_mat,
                  (0.0, yo_t, z_trans), hw_t, hh_t,
                  nozzles=2, depth=_DRIVE_DEP, detail=detail)

    if detail < 1:
        return

    # ── G2 RIB FLARE (detail 1+): one pair, reach 1.24, thickness fixed
    hw_f, _st_f, _fw_f, yo_f = _min_skin(
        stations, z_flare - 0.16, z_flare + 0.16, samples=5)
    for side, facing, tag in ((1.0, 'starboard', 's'), (-1.0, 'port', 'p')):
        fx = side * (hw_f - _BURY)
        am.rib_flare(parts, 'ace.flare.' + tag, hull_mat,
                     (fx, yo_f, z_flare),
                     reach=_FLARE_REACH, facing=facing, detail=detail)

    # ── SMALL CITADEL (detail 1+): mid dorsal, buried into the deck
    y_cit = sf.top_y(stations, z_cit, 0.0) - _CITADEL[1] * 0.35
    am.citadel_plate(parts, 'ace.citadel', hull_mat,
                     (0.0, y_cit, z_cit), size=_CITADEL, detail=detail)

    # ── RIB RUN (detail 1+): one flank pair, count 20, mid zone only
    rib_span = (z_mid_s - z_bow_s) - 0.36
    hw_r, _st_r, _fw_r, yo_r = _min_skin(
        stations, z_rib - rib_span * 0.5, z_rib + rib_span * 0.5)
    for side, facing, tag in ((1.0, 'starboard', 's'), (-1.0, 'port', 'p')):
        rx = side * (hw_r - _FACE_IN)
        am.rib_run(parts, 'ace.rib.' + tag, hull_mat,
                   (rx, yo_r, z_rib),
                   count=20, span=rib_span, axis='z',
                   facing=facing, detail=detail)

    # ── DORSAL SPINE + KEEL SLAB (detail 1+): both ends inside the loft
    y_sp = sf.top_y(stations, z_spine, 0.0) - _SPINE[1] * 0.40
    kit.taper_block(parts, 'ace.spine', H,
                    (0.0, y_sp, z_spine), _SPINE, hull_mat,
                    front=(0.55, 0.70), back=(0.70, 0.80))
    y_k = sf.bottom_y(stations, z_keel, 0.0) + _KEEL[1] * 0.40
    kit.taper_block(parts, 'ace.keel', H,
                    (0.0, y_k, z_keel), _KEEL, hull_mat,
                    front=(0.60, 0.75), back=(0.70, 0.80))

    # ── PAIRED BATTERIES (detail 1+): formal, bilateral, facing the nose
    ty_b = sf.top_y(stations, z_batt, 0.0)
    fw_b = sf.flat_half(stations, z_batt)
    bx = min(max(fw_b * 0.55, 0.18), 0.30)
    by = ty_b - sf.TURRET_MODULE[1] * 0.35
    hw.battery_module(parts, glow, 'ace.battery.p', hull_mat, glow_mat,
                      (-bx, by, z_batt), facing='nose', detail=detail)
    hw.battery_module(parts, glow, 'ace.battery.s', hull_mat, glow_mat,
                      ( bx, by, z_batt), facing='nose', detail=detail)

    # ── RESCUE PANNIERS (detail 1+): pair, seated on aft-mid flanks
    hw_p, _st_p, _fw_p, _yo_p = _min_skin(
        stations, z_pan - sf.RESCUE_PANNIER[2] * 0.5,
        z_pan + sf.RESCUE_PANNIER[2] * 0.5, samples=5)
    by_p = sf.bottom_y(stations, z_pan, 0.0) + sf.RESCUE_PANNIER[1] * 0.35
    for side, tag in ((-1.0, 'p'), (1.0, 's')):
        px = side * (hw_p - _BURY)
        hw.rescue_pannier(parts, glow, 'ace.rescue.' + tag, hull_mat, glow_mat,
                          (px, by_p, z_pan), detail=min(detail, 1))

    # ── STARBOARD HONOR PLATE (detail 1+): the one functional asymmetry
    yo_h = sf.section(stations, z_honor)[2]
    hx = sf.flank_x(stations, z_honor, yo_h) - _FACE_IN + sf.HONOR_PLATE[0] * 0.20
    hw.honor_plate(parts, 'ace.honor.s', hull_mat,
                   (hx, yo_h + 0.04, z_honor), detail=detail)

    if detail < 2:
        return

    # ── MID-BAND SURFACE (detail 2+; counts halve at 2) ─────────────────
    # Armour stays inside the mid zone. No run crosses a seam.
    z_m0 = l * -0.140
    z_m1 = l * 0.000
    z_m2 = l * 0.140
    _skin_run(parts, 'ace.skin.mid.a', hull_mat, stations,
              z_bow_s + 0.10, z_m0 - 0.04, 12, 4, detail)
    _skin_run(parts, 'ace.skin.mid.b', hull_mat, stations,
              z_m0 + 0.04, z_m1 - 0.04, 12, 4, detail)
    _skin_run(parts, 'ace.skin.mid.c', hull_mat, stations,
              z_m1 + 0.04, z_m2 - 0.04, 12, 4, detail)
    _skin_run(parts, 'ace.skin.mid.d', hull_mat, stations,
              z_m2 + 0.04, z_mid_s - 0.10, 12, 4, detail)

    hw_c, st_c, _fw_c, yo_c = _min_skin(stations, z_m0, z_m2)
    am.armour_course(parts, 'ace.course.p', hull_mat,
                     (-(hw_c - _FACE_IN), yo_c, 0.5 * (z_m0 + z_m2)),
                     size=(0.16, st_c * 1.6, z_m2 - z_m0),
                     count=6, axis='z', detail=detail)
    am.armour_course(parts, 'ace.course.s', hull_mat,
                     ( hw_c - _FACE_IN, yo_c, 0.5 * (z_m0 + z_m2)),
                     size=(0.16, st_c * 1.6, z_m2 - z_m0),
                     count=6, axis='z', detail=detail)

    # ── COCKPIT SLIT (detail 2+): one dorsal slot
    y_ck = sf.top_y(stations, z_cock, 0.0) - 0.02
    kit.window_row(glow, 'ace.cockpit-slit',
                   (0.0, y_ck, z_cock),
                   glow_mat, 1, 0.0, (0.28, 0.05, 0.08))

    # ── NAV LIGHTS (detail 2+): one pair, bow shoulders
    yo_nv = sf.section(stations, z_nav)[2]
    nx = sf.flank_x(stations, z_nav, yo_nv) - _FACE_IN
    hw.navigation_light(parts, glow, 'ace.nav.p', hull_mat, glow_mat,
                        (-nx, yo_nv, z_nav), detail=detail)
    hw.navigation_light(parts, glow, 'ace.nav.s', hull_mat, glow_mat,
                        ( nx, yo_nv, z_nav), detail=detail)

    if detail < 3:
        return

    # ── CITADEL GREEBLE (detail 3 only): stays on the citadel top face
    kit.greeble_field(parts, 'ace.citadel.greeble', kit.ROLE_TRIM,
                      (0.0, y_cit, z_cit),
                      (_CITADEL[0] * 0.70, _CITADEL[1], _CITADEL[2] * 0.70),
                      hull_mat, seed=107, count=10, detail=detail)
