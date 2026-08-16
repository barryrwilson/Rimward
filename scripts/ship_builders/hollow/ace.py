"""Hollow Reach Ace — NARROW WATCH-RUNNER.

Bible §5.2 Ace: "A narrow watch-runner with folded sensor vanes and a
very low emission profile."

There is NO concept-art plate. Do not invent a Banner look.

Construction is CLOSED SHELL, SHUTTERED. Silhouette family: sealed
oblong + wraps + outboard mast/dishes. Ace is NARROWER and slightly
longer-looking than light — a runner, not a skiff.

Refuse: crates, owner-modules, gate-arms, salvage, ritual, fans, flesh,
lace, window rows, loud lamp runs. No radiators.

BODY PLAN
    A slim sealed loft (kit.hull_loft) with ABSOLUTE half-extents,
    never *b or *h. Half-beam stays 0.38-0.48 — slimmer than a light
    skiff. Bow is a shuttered sensor face. Mid wears ONE wrap_panel per
    side plus folded passive vanes and two short listening booms
    (facing port/starboard, not a tall tower). Stern is a quiet
    2-nozzle drive. Seams are sh.shutter_seam beads.

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE).
At l = 7.2:
    Loft nose at l*-0.518 = -3.730; transom at l*+0.470 = +3.384 ->
    loft z-span 7.114. Driver engine glow sits at z = l*0.47 = 3.384;
    drive loc is the transom, housing face 0.12 aft of that plane
    (disc z ≈ 3.404). Bow shutter buries 0.10 and stands ~0.06 proud of
    the nose. Authored max span ≈ 7.25, slightly long of light (~6.8)
    and well below cutter (~11).

ZONES (no plate course crosses a seam):
    bow   l*-0.518..l*-0.270   24 %  shuttered sensor face
    mid   l*-0.270..l* 0.180   44 %  wrap, folded vanes, listening booms
    stern l* 0.180..l* 0.470   32 %  quiet 2-nozzle drive

OUTLINE-BREAKER (G2): listening boom. Floor is 0.15*l = 1.08 at
    l = 7.2. Starboard boom length 2.20; port boom stowed shorter at
    1.80. Do NOT inflate DISH_EAR_R.

Functional asymmetry: port vane count is stowed shorter than
starboard; port boom is shorter and sits further aft.

EMISSIVE BUDGET (very low emission):
    ONE tiny hw.buried_lantern + 2 drive discs. No lamp_run. No windows.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: loft, wraps, both booms + starboard dish, vanes, roots,
       bow shutter, seams, lantern, mid-band plates, drive
    2  half vane / plate / shutter counts; wraps + boom shafts +
       drive + lantern + seams kept
    1  loft + wraps + mast shafts + drive
    0  loft + drive

DENSITY (AUTHORED AIM, not measured):
    hull verts 6,000-14,000 (SHIP_SCALE.ace.hull band 4,000-21,000)
    max span ~7.3 (band [4.32, 10.08], target 7.2)
    spanZ/spanX >= 1.15; spanY/spanZ <= 0.60; spanX/spanZ >= 0.16
    pivot |centre / span| <= 0.15
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import shroud as sh
from . import hardware as hw


# Absolute seating. Never multiplied by ship l, b or h.
_BURY = 0.10                    # module sink; floor 0.08
_DRIVE_DEP = 0.50
_WRAP_T = 0.12
_WRAP = (1.24, 0.64, 0.12)      # face_w, face_h, thickness; drapes the slim core
_MAST_S = 2.20                  # starboard boom; G2 >= 1.08
_MAST_P = 1.80                  # port boom, stowed shorter
_PLATE_D = 0.16                 # thick enough to hold a 0.06 hw change
_FACE_IN = 0.06                 # plate face sits this far inboard of MIN skin
_SLAB_T = 0.18                  # quilt host slab (full extent)
_SLAB_Y = 0.12


# ===========================================================================
# STATION LIST
# ===========================================================================

def _ace_stations(l, b, h):
    """Slim sealed watch-runner. Half-extents are absolute, never *b or *h.

    Narrower than a light skiff (half-beam 0.38-0.46). Blunt shuttered
    bow, long mid stretch, quiet 2-nozzle transom. ``b`` and ``h`` name
    the class envelope; the loft does not use them.
    """
    _ = (b, h)
    return [
        # -- BOW: shuttered sensor face --------------------------------------
        sf.fair(l * -0.518, 0.22, 0.18, 0.02),  # loft nose
        sf.fair(l * -0.450, 0.34, 0.22, 0.02),
        sf.fair(l * -0.360, 0.40, 0.24, 0.01),
        sf.fair(l * -0.270, 0.42, 0.25, 0.00),  # bow/mid seam

        # -- MID: sealed runner stretch --------------------------------------
        sf.fair(l * -0.120, 0.44, 0.26, 0.00),
        sf.fair(l *  0.000, 0.46, 0.26, 0.00),  # max half-beam 0.46
        sf.fair(l *  0.180, 0.44, 0.25, 0.00),  # mid/stern seam

        # -- STERN: quiet 2-nozzle transom -----------------------------------
        sf.fair(l *  0.300, 0.42, 0.24, 0.00),
        sf.fair(l *  0.400, 0.40, 0.23, 0.00),
        sf.fair(l *  0.470, 0.38, 0.22, 0.00),  # transom
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
    """Zone-local donated plates. Does not cross a seam.

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
    n_course = _lod_n(max(4, cols // 2), detail)
    if hw_m > 0.14:
        fx = sf.flank_x(stations, cz, yo)
        hh = sf.section(stations, cz)[1]
        for side, tag in ((-1.0, 'p'), (1.0, 's')):
            kit.plate_course(parts, '%s.course.%s' % (name, tag), A,
                             (side * (fx - 0.05), yo, cz),
                             (0.22, hh * 0.95, run),
                             mat, count=n_course, axis='z',
                             gap=0.10, step=0.012, bevel=0.012)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Hollow Reach watch-runner (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.2, 2.88, 1.44).
    detail   -- 3 full  2 half vanes  1 loft+wraps+mast shafts+drive
                0 loft + drive.
    """
    _ = (b, h)
    H = kit.ROLE_HULL
    stations = _ace_stations(l, b, h)

    z_nose = l * -0.518
    z_bow_s = l * -0.270
    z_mid_s = l * 0.180
    z_trans = l * 0.470
    z_wrap = l * -0.040
    z_mast_s = l * 0.020
    z_mast_p = l * 0.080
    z_vane_s = l * -0.140
    z_vane_p = l * 0.050
    z_lamp = l * -0.080

    # ── Sealed watch loft (always, detail 0+) ───────────────────────────
    kit.hull_loft(parts, 'ace.hull', H, stations, hull_mat)

    # ── DRIVE FACE at the transom (always; 2 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern loft. Driver glow sits at z = l*0.47.
    hw_t, hh_t, yo_t, _ch = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'ace.drive', hull_mat, glow_mat,
                  (0.0, yo_t, z_trans), hw_t, hh_t,
                  nozzles=2, depth=_DRIVE_DEP, detail=detail)

    if detail < 1:
        return

    # ── ONE WRAP PER SIDE (detail 1+): mid drape, buried so it does not float
    hw_w, st_w, _fw_w, yo_w = _min_skin(stations, z_wrap - 0.50, z_wrap + 0.50)
    wx, wy, wt = _WRAP
    wt = max(wt, _WRAP_T)
    wy = max(wy, 2.0 * st_w, 0.48)
    for side, facing, tag in ((1.0, 'starboard', 's'), (-1.0, 'port', 'p')):
        cx = side * (hw_w - _BURY + wt * 0.5)
        sh.wrap_panel(parts, 'ace.wrap.' + tag, hull_mat,
                      (cx, yo_w, z_wrap),
                      size=(wx, wy, wt), facing=facing, detail=detail)

    # ── LISTENING BOOMS (detail 1+): shafts always; dish on starboard at 3
    # Root sits in the flank so the shaft overlaps hull. Not a tall tower.
    hw_ms, _st_ms, _fw_ms, yo_ms = _min_skin(
        stations, z_mast_s - 0.16, z_mast_s + 0.16, samples=5)
    hw_mp, _st_mp, _fw_mp, yo_mp = _min_skin(
        stations, z_mast_p - 0.16, z_mast_p + 0.16, samples=5)
    loc_mast_s = (hw_ms - _BURY, yo_ms, z_mast_s)
    loc_mast_p = (-(hw_mp - _BURY), yo_mp, z_mast_p)
    sh.listening_mast(parts, 'ace.mast.s', hull_mat, loc_mast_s,
                      length=_MAST_S, facing='starboard',
                      detail=detail, dish=(detail >= 3))
    sh.listening_mast(parts, 'ace.mast.p', hull_mat, loc_mast_p,
                      length=_MAST_P, facing='port',
                      detail=detail, dish=False)

    if detail < 2:
        return

    # ── SENSOR ROOTS (detail 2+): overlap mast / root / hull ────────────
    rx = max(sf.SENSOR_ROOT[0], 0.28)
    hw.sensor_root(parts, 'ace.root.s', hull_mat,
                   (loc_mast_s[0] + rx * 0.20, loc_mast_s[1], loc_mast_s[2]),
                   detail=detail)
    hw.sensor_root(parts, 'ace.root.p', hull_mat,
                   (loc_mast_p[0] - rx * 0.20, loc_mast_p[1], loc_mast_p[2]),
                   detail=detail)

    # ── FOLDED SENSOR VANES (detail 2 = half; 3 = full) ─────────────────
    # Port count is stowed shorter than starboard.
    yo_vs = sf.section(stations, z_vane_s)[2]
    yo_vp = sf.section(stations, z_vane_p)[2]
    fx_vs = sf.flank_x(stations, z_vane_s, yo_vs)
    fx_vp = sf.flank_x(stations, z_vane_p, yo_vp)
    hw.passive_array(parts, 'ace.vane.s', hull_mat,
                     (fx_vs - _BURY + 0.06, yo_vs, z_vane_s),
                     count=5, axis='z', detail=detail)
    hw.passive_array(parts, 'ace.vane.p', hull_mat,
                     (-(fx_vp - _BURY + 0.06), yo_vp, z_vane_p),
                     count=2, axis='z', detail=detail)

    # ── BOW SHUTTER (detail 2+) ─────────────────────────────────────────
    hw_b, st_b, _fw_b, yo_b = _min_skin(stations, z_nose, z_nose + 0.36,
                                        samples=5)
    shut_w = max(hw_b * 1.70, 0.40)
    shut_h = max(st_b * 1.80, 0.32)
    shut_t = 0.16
    z_shut = z_nose + shut_t * 0.5 - _BURY
    sh.shutter_bank(parts, 'ace.bow.shutter', hull_mat,
                    (0.0, yo_b, z_shut),
                    size=(shut_w, shut_h, shut_t), facing='nose',
                    detail=detail)

    # ── ZONE SEAMS (detail 2+): local beads, not full-beam films ────────
    for tag, z_seam in (('bow', z_bow_s), ('stern', z_mid_s)):
        y_seam = sf.top_y(stations, z_seam, 0.0) - _BURY + 0.06
        yo_s = sf.section(stations, z_seam)[2]
        sh.shutter_seam(parts, 'ace.seam.' + tag, hull_mat,
                        (0.0, 0.5 * (y_seam + yo_s), z_seam),
                        detail=detail)

    # ── ONE BURIED COMMAND LANTERN (detail 2+). No lamp_run. ────────────
    y_lp = sf.top_y(stations, z_lamp, 0.0) - 0.06
    hw.buried_lantern(parts, glow, 'ace.lantern', hull_mat, glow_mat,
                      (0.0, y_lp, z_lamp), facing='up', detail=detail)

    # ── WRAP STRAPS (detail 2+): clamp the mid drape ────────────────────
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        cx = side * (hw_w - _BURY + wt * 0.5)
        sh.wrap_strap(parts, 'ace.wrap.strap.' + tag, hull_mat,
                      (cx, yo_w + wy * 0.28, z_wrap),
                      span=max(wx * 0.55, 0.40), axis='z', detail=detail)

    # ── MID-BAND SURFACE (detail 2+; counts halve at 2) ─────────────────
    # Armour stays inside one zone. No run crosses a seam.
    z_m0 = l * -0.120
    z_m1 = l * 0.000
    _skin_run(parts, 'ace.skin.mid.a', hull_mat, stations,
              z_bow_s + 0.08, z_m0 - 0.04, 8, 4, detail)
    _skin_run(parts, 'ace.skin.mid.b', hull_mat, stations,
              z_m0 + 0.04, z_m1 - 0.04, 8, 4, detail)
    _skin_run(parts, 'ace.skin.mid.c', hull_mat, stations,
              z_m1 + 0.04, z_mid_s - 0.08, 8, 4, detail)
    _skin_run(parts, 'ace.skin.bow', hull_mat, stations,
              z_nose + 0.28, z_bow_s - 0.08, 6, 3, detail)
    z_s0 = l * 0.300
    _skin_run(parts, 'ace.skin.stern.a', hull_mat, stations,
              z_mid_s + 0.08, z_s0 - 0.04, 7, 4, detail)
    _skin_run(parts, 'ace.skin.stern.b', hull_mat, stations,
              z_s0 + 0.04, z_trans - 0.20, 7, 4, detail)
