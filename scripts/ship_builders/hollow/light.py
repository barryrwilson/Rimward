"""Hollow Reach Light — LISTENING SKIFF.

Bible §5.2 Light: "A sealed listening skiff with one oversized sensor ear
and almost no windows."

There is NO concept art. Do not invent a Banner look.

Construction logic is CLOSED SHELL, SHUTTERED. A sealed oblong watch-hull
wears one wrap panel per flank and one outboard listening mast / dish ear.
Joints are local shutter seams, not full-beam film. Refuse: crates,
owner-modules, gate-arms, salvage, ritual, fans, flesh, lace, window rows.

The silhouette is a SEALED OBLONG WATCH-HULL + BILATERAL WRAP + ONE
outboard listening mast (the oversized ear). THE outline-breaker is
``sh.listening_mast`` on a starboard-offset ``hw.sensor_root``.

BODY PLAN
    Chamfered watch-hull loft (absolute half-extents, never class beam as
    a drum radius) from loft bow to transom. Bow is a shuttered sensor
    face. Mid is one wrap panel per flank over a sealed hold. Stern is a
    quiet 2-nozzle ``hw.drive_face``. One sensor/mid detail band. Calm
    sealed metal elsewhere. Almost no windows.

STATIONS (z as fractions of l; half-extents are ABSOLUTE watch-hull
radii, never a fraction of the class beam 3.276):
    Loft bow at l*-0.375 = -2.925. Transom at l*+0.470 = +3.666 so the
    driver engine glow at l*0.47 sits on the drive face. Drive discs
    stand 0.12 aft of the transom (z ≈ +3.786). Shutter nose sits near
    −3.005. Max core half-beam is 0.66; wraps stand ~0.03 proud.

ZONES (no plate course crosses a zone seam):
    bow   l*-0.375 .. l*-0.180   ~23 %  shuttered sensor face, passive array
    mid   l*-0.180 .. l* 0.220   ~47 %  wrap pair, sealed hold, lantern well
    stern l* 0.220 .. l* 0.470   ~29 %  quiet 2-nozzle drive

OUTLINE-BREAKER (G2): one ``sh.listening_mast``. Default
    ``sf.LISTENING_MAST_LEN`` = 2.40. Gate: length ≥ 0.15*l = 1.17.
    Already passes. NEVER inflate ``sf.DISH_EAR_R``.

EMISSIVE BUDGET (≤ 5 % of hull area, dim mauve only):
    two drive discs; one buried command lantern. No window row.
    AUTHORED AIM: glow face area ≈ 0.04 against a hull area ≈ 22–30
    (≈ 0.2 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; plate / slat / vane counts halve
    1  loft + wraps + mast shaft + drive + shutter backing
    0  loft + drive

DENSITY (AUTHORED AIM only — re-derive from measure-ships after bake):
    hull verts 5 000–12 000 (SHIP_SCALE.light.hull band 4 000–25 000)
    max span ~6.8 (band [4.08, 9.52], target 6.8)
    spanZ/spanX ≥ 1.15; spanY/spanZ ≤ 0.60; spanX/spanZ ≥ 0.16
    stay SMALLER than ace (~7.3) and well below cutter (~11)
    pivot |bbox-centre| ≤ 0.15 of span per axis

Extent budget (absolute ship-space, l=7.8  b=3.276  h=1.872):
    z  min ≈ -3.01 (shutter nose)  max ≈ +3.79 (drive discs)  spanZ ≈ 6.80
    x  min ≈ -0.69 (port wrap)     max ≈ +0.69 (stbd wrap)    spanX ≈  1.38
    y  min ≈ -0.44 (keel)          max ≈ +2.86 (mast / dish)  spanY ≈  3.30
    spanZ/spanX ≈ 4.93 ≥ 1.15; spanY/spanZ ≈ 0.49 ≤ 0.60;
    spanX/spanZ ≈ 0.20 ≥ 0.16.
    Mast is the G2 ear. It pushes bbox-centre +Y; glow stays at y=0.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import shroud as sh
from . import hardware as hw


# Absolute seating. Never multiplied by ship l, b or h.
_BURY = 0.10
_WRAP_LAP = 0.03
_MAST_X = 0.22


# ===========================================================================
# STATION LIST
# ===========================================================================

def _light_stations(l, b, h):
    """Sealed oblong watch-hull loft. Half-extents are absolute.

    ``b`` and ``h`` name the driver envelope (3.276, 1.872). They do not
    scale the core. z tracks class length so the loft fills the light
    run onto the drive face. y_offset stays 0 so the transom centre
    meets the driver glow at (0, 0, l*0.47).

    Loft bow at l*-0.375; transom at l*+0.470. Bow/mid seam at l*-0.180;
    mid/stern seam at l*+0.220.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.375, 0.42, 0.34, 0.00),
        sf.fair(l * -0.280, 0.54, 0.40, 0.00),
        sf.fair(l * -0.181, 0.60, 0.42, 0.00),
        sf.fair(l * -0.180, 0.62, 0.44, 0.00),
        sf.fair(l * 0.020, 0.66, 0.44, 0.00),
        sf.fair(l * 0.219, 0.60, 0.42, 0.00),
        sf.fair(l * 0.220, 0.56, 0.40, 0.00),
        sf.fair(l * 0.350, 0.54, 0.38, 0.00),
        sf.fair(l * 0.470, 0.50, 0.36, 0.00),
    ]


def _min_skin(stations, z0, z1, samples=9):
    """Min straight-flank half-extents on [z0, z1].

    Returns ``(half_w, straight_half_h, flat_half, y_offset)``. Callers
    double these for kit full extents. Uses the smallest section in the
    run so a plate or wrap stays on the loft and does not float at a taper.
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


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Hollow Reach listening skiff (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (7.8, 3.276, 1.872).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 loft + wraps + mast shaft + drive + shutter backing
                0 loft + drive.

    AUTHORED AIM (re-derive from measure-ships after bake):
        detail 3  5 000–12 000 hull verts
        max span ~6.8, spanZ/spanX ≥ 1.15, spanY/spanZ ≤ 0.60,
        spanX/spanZ ≥ 0.16
        inside SHIP_SCALE.light.hull band 4 000–25 000
    """
    H = kit.ROLE_HULL
    T = kit.ROLE_TRIM

    stations = _light_stations(l, b, h)

    z_loft0 = l * -0.375
    z_bow_s = l * -0.180
    z_mid_s = l * 0.220
    z_stern = l * 0.470

    z_mid = l * 0.020
    z_well = l * 0.110

    # ── Primary watch-hull loft (always) ─────────────────────────────────
    kit.hull_loft(parts, 'light.hull', H, stations, hull_mat)

    # ── DRIVE FACE — transom, 2 countable nozzles (always) ───────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  min(sec_t[0], 0.50), min(sec_t[1], 0.36),
                  nozzles=2, depth=0.46, detail=detail)

    if detail < 1:
        return

    # ── WRAP PANELS — one port, one starboard, mid flank lap (detail 1+) ─
    # Size from min mid skin so the plate laps the taper and does not
    # float outboard. Centre sits inboard of flank_x by half thickness
    # minus a small lap.
    z_w0 = z_bow_s + 0.12
    z_w1 = z_mid_s - 0.12
    z_wrap = 0.5 * (z_w0 + z_w1)
    hw_w, st_w, _fw_w, yo_w = _min_skin(stations, z_w0, z_w1)
    wrap_fw = max(z_w1 - z_w0, 0.80)
    wrap_fh = max(st_w * 2.0 * 0.92, 0.40)
    wrap_th = sf.WRAP_PANEL[2]
    wrap_size = (wrap_fw, wrap_fh, wrap_th)
    x_wrap = hw_w - (wrap_th * 0.5 - _WRAP_LAP)
    sh.wrap_panel(parts, 'light.wrap.s', hull_mat,
                  (x_wrap, yo_w, z_wrap),
                  size=wrap_size, facing='starboard', detail=detail)
    sh.wrap_panel(parts, 'light.wrap.p', hull_mat,
                  (-x_wrap, yo_w, z_wrap),
                  size=wrap_size, facing='port', detail=detail)

    # ── SENSOR ROOT + LISTENING MAST — the one oversized ear (detail 1+) ─
    # Root on the mid-dorsal, slightly starboard. Mast loc is the root
    # centre so shaft, root and loft overlap. Default mast length 2.40.
    # Dish stays sf.DISH_EAR_R (construct default).
    ty_m = sf.top_y(stations, z_mid, _MAST_X)
    root_sy = sf.SENSOR_ROOT[1]
    y_root = ty_m + root_sy * 0.5 - _BURY
    hw.sensor_root(parts, 'light.ear', hull_mat,
                   (_MAST_X, y_root, z_mid),
                   detail=detail)
    sh.listening_mast(parts, 'light.ear', hull_mat,
                      (_MAST_X, y_root, z_mid),
                      facing='up', detail=detail)

    # ── BOW SHUTTER BANK — facing nose (detail 1 = backing only) ─────────
    sec_b = sf.section(stations, z_loft0)
    bank_w = max(sec_b[0] * 2.0 * 0.96, 0.48)
    bank_h = max(sec_b[1] * 2.0 * 0.96, 0.40)
    bank_t = sf.SHUTTER_BANK[2]
    sh_det = 0 if detail < 2 else detail
    sh.shutter_bank(parts, 'light.bow', hull_mat,
                    (0.0, sec_b[2], z_loft0),
                    size=(bank_w, bank_h, bank_t),
                    facing='nose', detail=sh_det)

    if detail < 2:
        return

    # ── ZONE SEAMS — local beads at both seams (detail 2+) ───────────────
    for tag, zz in (('bow', z_bow_s), ('stern', z_mid_s)):
        ty_s = sf.top_y(stations, zz, 0.0)
        sh.shutter_seam(parts, 'light.seam.' + tag, hull_mat,
                        (0.0, ty_s - 0.02, zz),
                        detail=detail)

    # ── MID WELL + BURIED LANTERN — inboard, not on an edge (detail 2+) ──
    if z_bow_s < z_well < z_mid_s:
        ty_w = sf.top_y(stations, z_well, 0.0)
        well = (0.52, 0.22, 0.64)
        y_well = ty_w + well[1] * 0.5 - _BURY
        kit.chamfer_block(parts, 'light.well', H,
                          (0.0, y_well, z_well), well, hull_mat,
                          chamfer=min(well[0], well[1]) * 0.18)
        hw.buried_lantern(parts, glow, 'light.well', hull_mat, glow_mat,
                          (0.0, y_well + 0.02, z_well),
                          facing='up', detail=detail)

    # ── PASSIVE ARRAY — sensor band only, count 2–3 (detail 2+) ──────────
    z_arr = 0.5 * (z_loft0 + z_bow_s)
    if z_loft0 < z_arr < z_bow_s:
        ty_a = sf.top_y(stations, z_arr, 0.0)
        n_vane = 3 if detail >= 3 else 2
        hw.passive_array(parts, 'light.sensor', hull_mat,
                         (0.0, ty_a - 0.04, z_arr),
                         count=n_vane, axis='z', detail=detail)

    # ── DETAIL BAND — mid deck / keel + bow sensor faces (detail 2+) ─────
    # Stern stays calm. Mid flanks are the wrap pair. Host boxes use min
    # skin so plates pierce the loft.
    z_b0 = z_loft0 + 0.10
    z_b1 = z_bow_s - 0.08
    z_bmid = 0.5 * (z_b0 + z_b1)
    bow_run = z_b1 - z_b0
    hw_b, st_b, fw_b, yo_b = _min_skin(stations, z_b0, z_b1)

    z_p0 = z_bow_s + 0.10
    z_p1 = z_mid_s - 0.10
    z_pmid = 0.5 * (z_p0 + z_p1)
    mid_run = z_p1 - z_p0
    _hw_m, _st_m, fw_m, _yo_m = _min_skin(stations, z_p0, z_p1)

    cols_b = 14 if detail >= 3 else 7
    rows_b = 8 if detail >= 3 else 4
    kit.plate_grid(parts, 'light.bow.s', H,
                   (0.0, yo_b, z_bmid),
                   (hw_b * 2.0, st_b * 2.0, bow_run),
                   hull_mat, cols=cols_b, rows=rows_b, face='x', depth=0.10)
    kit.plate_grid(parts, 'light.bow.p', H,
                   (0.0, yo_b, z_bmid),
                   (hw_b * 2.0, st_b * 2.0, bow_run),
                   hull_mat, cols=cols_b, rows=rows_b, face='-x', depth=0.10)

    dcols_b = 8 if detail >= 3 else 4
    drows_b = 10 if detail >= 3 else 5
    ty_bow = sf.top_y(stations, z_bmid, 0.0)
    kit.plate_grid(parts, 'light.bow.deck', H,
                   (0.0, ty_bow - 0.08, z_bmid),
                   (fw_b * 2.0, 0.16, bow_run),
                   hull_mat, cols=dcols_b, rows=drows_b, face='y', depth=0.10)

    n_bow = 8 if detail >= 3 else 4
    kit.plate_grid(parts, 'light.bow.face', H,
                   (0.0, yo_b, z_loft0 + 0.08),
                   (hw_b * 2.0, st_b * 2.0, 0.20),
                   hull_mat, cols=n_bow, rows=6 if detail >= 3 else 3,
                   face='-z', depth=0.10)

    dcols = 10 if detail >= 3 else 5
    drows = 20 if detail >= 3 else 10
    ty_mid = sf.top_y(stations, z_pmid, 0.0)
    kit.plate_grid(parts, 'light.mid.deck', H,
                   (0.0, ty_mid - 0.08, z_pmid),
                   (fw_m * 2.0, 0.16, mid_run),
                   hull_mat, cols=dcols, rows=drows, face='y', depth=0.10)

    kcols = 8 if detail >= 3 else 4
    krows = 16 if detail >= 3 else 8
    by_mid = sf.bottom_y(stations, z_pmid, 0.0)
    kit.plate_grid(parts, 'light.mid.keel', H,
                   (0.0, by_mid + 0.08, z_pmid),
                   (fw_m * 2.0, 0.16, mid_run),
                   hull_mat, cols=kcols, rows=krows, face='-y', depth=0.10)

    n_belt = 8 if detail >= 3 else 4
    kit.plate_course(parts, 'light.mid.belt.deck', T,
                     (0.0, ty_mid - 0.06, z_pmid),
                     (fw_m * 1.60, 0.16, mid_run),
                     hull_mat, count=n_belt, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.mid.belt.keel', T,
                     (0.0, by_mid + 0.06, z_pmid),
                     (fw_m * 1.40, 0.16, mid_run),
                     hull_mat, count=max(n_belt - 1, 3), axis='z', bevel=0.02)

    n_sen = 6 if detail >= 3 else 3
    kit.plate_course(parts, 'light.bow.belt.s', T,
                     (hw_b - 0.02, yo_b, z_bmid),
                     (0.16, st_b * 1.50, bow_run),
                     hull_mat, count=n_sen, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.bow.belt.p', T,
                     (-hw_b + 0.02, yo_b, z_bmid),
                     (0.16, st_b * 1.50, bow_run),
                     hull_mat, count=n_sen, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.bow.belt.deck', T,
                     (0.0, ty_bow - 0.06, z_bmid),
                     (fw_b * 1.50, 0.16, bow_run),
                     hull_mat, count=n_sen, axis='z', bevel=0.02)
