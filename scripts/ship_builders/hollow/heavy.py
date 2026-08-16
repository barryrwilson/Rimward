"""Hollow Reach Heavy — COMPACT WATCH POST.

Bible §5.2 heavy: "A compact watch post with armored sensor roots and
only a few protected defensive apertures."

There is no concept-art plate. Do not invent a Banner look, turrets, or
a weapon-first silhouette. Construction logic is CLOSED SHELL, SHUTTERED.
The silhouette is a short sealed watch-hull, one wrap panel per flank,
armored sensor roots, and listening masts that stand clear of the mass.

Refuse crates, owner-modules, gate-arms, salvage, ritual cans, fans,
flesh, lace, window grids, and guns-as-identity.

BODY PLAN
    A sealed oblong loft (kit.hull_loft, sf.fair k=0.38). Half-extents
    are ABSOLUTE watch-hull radii, never class beam or height as a
    drum radius. Bow is an armored shutter face. Mid is one large wrap
    panel per side (wave-46 value contrast) plus a low watch citadel.
    Stern is a six-nozzle drive face and a pair of FLAT radiators.
    Two armored sensor roots carry the masts. A few shutter banks are
    defensive slits, not a window grid. One buried lantern. Optional
    ventral collar sits behind a shutter. One functional asymmetry.

STATION / ZONE REASONING (z as fractions of l; half-extents ABSOLUTE)
    Loft nose at l*-0.488 = -8.296.
    Transom / drive plane at l*+0.470 = +7.990. Drive face stands
    0.12 proud. Radiator aft edge aims ~ +8.69 so authored spanZ
    ~ 17.0 and the mass pivot stays near the origin (±0.15).
    Bow / mid seam at l*-0.230 = -3.910.
    Mid / stern seam at l*+0.185 = +3.145.
    Mid half-beam 1.72, mid half-height 1.38 (thicker/taller than a
    cutter stick at ~1.12 / 0.62). Half-beam stays in 1.2–1.8.

OUTLINE-BREAKER (§G2)
    sh.listening_mast on the port sensor root.
        authored length = 4.40
        floor           = 0.15 * 17.0 = 2.55
        authored share  = 25.9 % of l
    Do not inflate dish diameter. A second shorter starboard mast is
    the functional asymmetry.

§G3 THERMAL / DRIVE
    One pair of hw.radiator_panel, FLAT, no fins, no greeble. Each
    slab is (2.40, 0.16, 3.10) full extents. Thickness 0.16 ≥ 0.08.
    Z = 3.10 = 18.2 % of l. Inboard 0.12 sits inside the upper-aft
    flank. Drive face is a 3x2 of 6 countable nozzles.

EMISSIVE (authored aim, <= 5 % of hull area)
    6 drive discs, one hw.buried_lantern (HUMAN.lampSize). Almost no
    windows. No edge-lit panels. Collar has no slit glow.

DETAIL LADDER
    3  full: every construct, full slat / vane count
    2  all construct families; slats and arrays half
    1  loft + wraps + roots + masts + drive + radiators
    0  loft + drive + radiators

ENVELOPE / AUTHORED AIM
    Driver: l = 17.0, b = 8.84, h = 5.78. Aim span ~17.0
    (band [10.20, 23.80], target 17.0). Must outrank cutter (~11)
    and stay well below frigate (~32).
    Authored spanZ ~ 17.0; Z/X >= 1.15; Y/Z <= 0.60; X/Z >= 0.16.
    Authored hull verts 12,000-28,000 (band 9,000-78,000).
    Island aim: one body; every fitting overlaps its host by >= 0.08.
    Min extent >= 0.06.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import hardware as hw
from . import shroud as sh
from . import surface as sf


# Absolute structural sizes. Not scaled by l, b or h.
_BURY = 0.10
_MAST_LEN = 4.40
_MAST_LEN_SHORT = 2.80
_WRAP = (4.80, 1.68, 0.22)
_RAD = (2.40, 0.16, 3.10)
_BOW_FACE = (2.04, 1.64, 0.58)
_BOW_SHUTTER = (1.56, 1.12, 0.16)
_SLIT = (0.78, 0.44, 0.14)
_CITADEL_H = 0.72


def _heavy_stations(l, b, h):
    """Compact sealed watch-hull. Thicker and taller than a cutter.

    Half-extents are absolute radii. z fractions of l.
    b and h name the class envelope; the core does not fill them.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.488, 1.18, 0.98, 0.04),  # loft nose
        sf.fair(l * -0.390, 1.40, 1.14, 0.06),
        sf.fair(l * -0.230, 1.58, 1.26, 0.08),  # bow/mid
        sf.fair(l * -0.050, 1.72, 1.38, 0.10),  # watch citadel
        sf.fair(l *  0.070, 1.70, 1.36, 0.09),
        sf.fair(l *  0.185, 1.54, 1.20, 0.06),  # mid/stern
        sf.fair(l *  0.340, 1.36, 1.06, 0.02),
        sf.fair(l *  0.470, 1.20, 0.96, -0.02),  # transom
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
        hw, hh, yo, ch = sf.section(stations, z)
        ch = sf.clamped(hw, hh, ch)
        hw_m = min(hw_m, hw)
        st_h = min(st_h, hh - ch)
        fw_m = min(fw_m, hw - ch)
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


def _seam(parts, name, mat, stations, z, detail):
    """Local shutter-seam bead on the deck. Not a full-beam strip."""
    if detail < 2:
        return
    sy = max(sf.SHUTTER_SEAM[1], 0.16)
    sz = max(sf.SHUTTER_SEAM[2], 0.14)
    hw, _hh, _yo, _ch = sf.section(stations, z)
    sx = max(min(hw * 1.05, 1.48), 0.56)
    y = sf.top_y(stations, z, 0.0) - sy * 0.5 + _BURY
    sh.shutter_seam(parts, name, mat, (0.0, y, z),
                    size=(sx, sy, sz), detail=detail)


def _root_and_mast(parts, name, mat, loc, length, detail):
    """Armored sensor root with a listening mast buried in the block."""
    _rx, ry, _rz = sf.SENSOR_ROOT
    hw.sensor_root(parts, name, mat, loc, detail=detail)
    mast_y = loc[1] + ry * 0.5 - _BURY
    sh.listening_mast(parts, name + '.mast', mat,
                      (loc[0], mast_y, loc[2]),
                      length=length, facing='up', detail=detail)


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Hollow Reach compact watch post (heavy class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 half slats/arrays, 1 primary form, 0 mass only.
    """
    stations = _heavy_stations(l, b, h)

    z_nose = l * -0.488
    z_bow = l * -0.230
    z_mid = l * 0.185
    z_stern = l * 0.470

    # ── Sealed hull + drive + radiators (detail 0+) ─────────────────────
    kit.hull_loft(parts, 'heavy.hull', kit.ROLE_HULL, stations, hull_mat)

    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern),
                  max(d_hw * 0.82, 0.70), max(d_hh * 0.74, 0.52),
                  nozzles=6, depth=0.56, detail=detail)

    z_rad = l * 0.418
    rx, _ry, rz = _RAD
    y_rad = sf.straight_top(stations, z_rad) - 0.04
    z_r0 = z_rad - rz * 0.5
    z_r1 = z_rad + rz * 0.5
    fx_rad = _min_flank(stations, z_r0, z_r1, y_rad)
    if fx_rad > 0.0:
        x_rad = fx_rad + rx * 0.5 - 0.12
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.radiator_panel(parts, 'heavy.radiator.' + tag, hull_mat,
                              (side * x_rad, y_rad, z_rad), _RAD,
                              detail=detail)

    if detail < 1:
        return

    # ── Wraps, armored face, citadel, roots, masts (detail 1+) ──────────
    z_wrap = (z_bow + z_mid) * 0.5
    y_wrap = 0.10
    fw, fh, th = _WRAP
    z_w0 = z_wrap - fw * 0.5
    z_w1 = z_wrap + fw * 0.5
    fx_wrap = _min_flank(stations, z_w0, z_w1, y_wrap)
    if fx_wrap > 0.0:
        x_wrap = fx_wrap + th * 0.5 - _BURY
        for side, facing in ((-1.0, 'port'), (1.0, 'starboard')):
            sh.wrap_panel(parts, 'heavy.wrap.' + facing, hull_mat,
                          (side * x_wrap, y_wrap, z_wrap),
                          size=_WRAP, facing=facing, detail=detail)

    bx, by, bz = _BOW_FACE
    n_hw, n_hh, n_yo, _n_ch = sf.section(stations, z_nose)
    bow_sx = min(bx, n_hw * 2.0 - 0.12)
    bow_sy = min(by, n_hh * 2.0 - 0.08)
    z_face = z_nose - bz * 0.5 + 0.16
    kit.chamfer_block(parts, 'heavy.bow.face', kit.ROLE_ARMOUR,
                      (0.0, n_yo, z_face), (bow_sx, bow_sy, bz),
                      hull_mat, chamfer=min(bow_sx, bow_sy) * 0.14)

    z_c0 = l * -0.110
    z_c1 = l * 0.070
    _hw_m, _st_h, fw_m, _yo_m = _min_skin(stations, z_c0, z_c1)
    z_cit = (z_c0 + z_c1) * 0.5
    y_deck = sf.top_y(stations, z_cit, 0.0)
    cit_sx = max(min(fw_m * 2.0 * 0.88, 2.36), 1.10)
    cit_sz = max(z_c1 - z_c0, 1.80)
    cit_y = y_deck - _CITADEL_H * 0.5 + _BURY
    kit.chamfer_block(parts, 'heavy.citadel', kit.ROLE_HULL,
                      (0.0, cit_y, z_cit),
                      (cit_sx, _CITADEL_H, cit_sz),
                      hull_mat, chamfer=min(cit_sx, _CITADEL_H) * 0.16)

    _rx_r, ry_r, _rz_r = sf.SENSOR_ROOT
    z_root_p = l * -0.080
    y_root_p = sf.top_y(stations, z_root_p, -0.22) - ry_r * 0.5 + _BURY
    _root_and_mast(parts, 'heavy.root.port', hull_mat,
                   (-0.22, y_root_p, z_root_p), _MAST_LEN, detail)

    z_root_s = l * 0.095
    y_root_s = sf.top_y(stations, z_root_s, 0.48) - ry_r * 0.5 + _BURY
    _root_and_mast(parts, 'heavy.root.stbd', hull_mat,
                   (0.48, y_root_s, z_root_s), _MAST_LEN_SHORT, detail)

    if detail < 2:
        return

    # ── Slits, seams, array, lantern, collar (detail 2+; slats/arrays half)
    sh.shutter_bank(parts, 'heavy.shutter.bow', hull_mat,
                    (0.0, n_yo, z_face - bz * 0.5 + _BOW_SHUTTER[2] * 0.35),
                    size=_BOW_SHUTTER, facing='nose', detail=detail)

    y_slit = 0.10
    z_slit = (z_bow + z_mid) * 0.5
    _sl_fw, _sl_fh, sl_th = _SLIT
    fx_slit = sf.flank_x(stations, z_slit, y_slit)
    if fx_slit > 0.0:
        x_slit = fx_slit + sl_th * 0.5 - _BURY
        sh.shutter_bank(parts, 'heavy.shutter.port', hull_mat,
                        (-x_slit, y_slit, z_slit),
                        size=_SLIT, facing='port', detail=detail)
        sh.shutter_bank(parts, 'heavy.shutter.stbd', hull_mat,
                        (x_slit, y_slit, z_slit),
                        size=_SLIT, facing='starboard', detail=detail)

    _seam(parts, 'heavy.seam.bow', hull_mat, stations, z_bow, detail)
    _seam(parts, 'heavy.seam.mid', hull_mat, stations, z_mid, detail)

    # Wrap straps stay on the wrap faces, not as a through-beam slab
    # inside the loft shell (those two slabs floated at y 0.57).
    if fx_wrap > 0.0:
        for i, cz in enumerate((z_wrap - 1.10, z_wrap + 1.10)):
            for side, tag in ((-1.0, 'p'), (1.0, 's')):
                sh.wrap_strap(parts, 'heavy.wrap.strap.%s.%d' % (tag, i),
                              hull_mat, (side * x_wrap, y_wrap, cz),
                              span=min(fh * 0.72, 1.20), axis='z',
                              detail=detail)

    z_arr = (z_nose + z_bow) * 0.52
    y_arr = sf.top_y(stations, z_arr, 0.18) - 0.04
    hw.passive_array(parts, 'heavy.array', hull_mat,
                     (0.18, y_arr, z_arr),
                     count=6, axis='z', detail=detail)

    y_lantern = cit_y + _CITADEL_H * 0.5 - 0.04
    hw.buried_lantern(parts, glow, 'heavy.lantern', hull_mat, glow_mat,
                      (0.0, y_lantern, z_cit),
                      facing='up', detail=detail)

    z_col = l * -0.040
    y_keel = sf.bottom_y(stations, z_col, 0.0)
    hw.docking_collar(parts, glow, 'heavy.collar', hull_mat, glow_mat,
                      (0.0, y_keel + 0.08, z_col),
                      facing='down', detail=detail)
    sh.shutter_bank(parts, 'heavy.collar.shutter', hull_mat,
                    (0.0, y_keel - 0.02, z_col),
                    size=(0.88, 0.88, 0.14), facing='down', detail=detail)
