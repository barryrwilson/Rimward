"""Hollow Reach Freighter — DEEP-RIM PROVISION CARRIER.

Bible §5.2 Freighter: "A deep-rim provision carrier with shielded holds,
fuel bladders, and sensor masts carried far from the noisy drives;
enormous, slow, and externally serviced."

No concept-art plate. Do not invent a Banner look.

Construction is CLOSED SHELL, SHUTTERED. A colossal sealed carrier. The
silhouette is a long watch-hull, one wrap drape a side, many absolute
shielded holds, keel fuel bladders, and listening masts on bow / mid
only. Grow HOLD COUNT. Never inflate the hold, bladder, dish or lantern.

BODY PLAN
    Long sealed loft along Z. Absolute half-extents (core half-beam
    4.20–6.50, never the class beam). Bow is a shuttered sensor face
    plus a ventral external service collar. Mid is shielded holds, one
    wrap drape a side, keel bladders and one OPEN service bay. Stern is
    the 8-nozzle drive and one large flat radiator pair. Masts never
    sit near the noisy stern.

STATIONS (z as fractions of l; half-extents ABSOLUTE, never *b / *h):
    Nose at l*-0.448 = -38.080; transom at l*0.470 = +39.950.
    Drive housing face 0.12 aft → +40.070. Bow shutter proud ≈ -38.12.
    Authored spanZ ≈ 78.2 (aim 78–85, band [66.00, 109.20], floor 66).
    Bow/mid seam at l*-0.246 = -20.910; mid/stern at l*+0.213 = +18.105.

ZONES (of loft nose..transom = 78.03):
    bow   l*-0.448 .. l*-0.246    ~22 %  shuttered sensor + ventral collar
    mid   l*-0.246 .. l*+0.213    ~50 %  holds, wraps, bladders, open bay
    stern l*+0.213 .. l*+0.470    ~28 %  8-nozzle drive, radiator pair

OUTLINE-BREAKER (§G2): ``sh.listening_mast`` length 14.00
    (>= 0.15*l = 12.75) on a bow ``hw.sensor_root``. Second mid mast
    9.00. No mast aft of the mid/stern seam. Do not inflate the dish.

§G3  Large FLAT ``hw.radiator_panel`` pair on the stern.
    ``hw.drive_face`` 8 countable nozzles in a 4x2 grid. No
    ``kit.engine_bank``.

§G5  One OPEN starboard mid bay (inboard + forward + aft walls, no
    outboard face). Cradle pad starts inboard and runs THROUGH the
    wall. A 3-box transfer craft INTERSECTS that pad.

Always externally berthed: ``hw.docking_collar`` on the ventral bow
face (facing down), shuttered by a down-facing bank.

ONE wrap_panel per side (large mid drape, ROLE_ARMOUR). Bury >= 0.08.
Wave-46: wrap / trim carry the value contrast.

ONE functional asymmetry: one extra starboard fuel bladder.

ONE or two ``hw.buried_lantern`` only. Almost no windows.
Emissive <= 5 %: drive discs plus the lantern irises.

DETAIL LADDER (this class has lod3):
    3  full holds, bladders, both masts + dishes, bay craft, arrays
    2  half hold / bladder / array repeats; hardware halves internally
    1  loft, wrap masses, hold masses, drive, radiators, primary mast,
       bay + craft body, collar, seams
    0  loft + drive + radiators + a few hold boxes + mast shafts.
       Must still read as a provision carrier with forward masts.

DENSITY (AUTHORED AIM only — re-derive after bake):
    hull verts 40 000–90 000 (band [34 000, 154 000])
    max span ~78 (band [66.00, 109.20], target 78–85)
    spanZ/spanX >= 1.05; spanY/spanZ <= 0.62; spanX/spanZ >= 0.16
    triangles inside 60 000 / 24 000 / 8 000 / 4 000 (lod0..lod3)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import shroud as sh
from . import hardware as hw


# Absolute modules. Never multiply by l, b or h.
_MAST_PRI = 14.00
_MAST_MID = 9.00
_HOLD_OVER = 0.22
_BAY_KEEP = 4.50
_CRAFT_BODY = (1.10, 0.48, 2.20)
_CRAFT_NOSE = (0.74, 0.38, 0.72)
_CRAFT_TAIL = (0.60, 0.34, 0.50)
_PAD_T = 0.22


# ===========================================================================
# STATION LIST
# ===========================================================================

def _freighter_stations(l):
    """Long sealed watch-hull. Absolute half-extents. Nose at l*-0.448."""
    return [
        sf.fair(l * -0.448, 4.20, 3.35, 0.12),  # nose
        sf.fair(l * -0.360, 5.05, 3.85, 0.09),
        sf.fair(l * -0.246, 5.80, 4.20, 0.06),  # bow / mid seam
        sf.fair(l * -0.120, 6.25, 4.40, 0.04),
        sf.fair(l * -0.010, 6.50, 4.55, 0.02),
        sf.fair(l *  0.110, 6.45, 4.50, 0.00),
        sf.fair(l *  0.213, 6.10, 4.30, 0.00),  # mid / stern seam
        sf.fair(l *  0.330, 5.65, 4.00, 0.00),
        sf.fair(l *  0.410, 5.25, 3.70, 0.00),
        sf.fair(l *  0.470, 5.45, 3.85, 0.00),  # transom
    ]


# ===========================================================================
# COUNTS AND SPANS
# ===========================================================================

def _n(detail, full, half=None, low=None, mass=None):
    if half is None:
        half = max(1, int(full) // 2)
    if low is None:
        low = max(1, int(full) // 4)
    if mass is None:
        mass = 0
    if detail >= 3:
        return int(full)
    if detail == 2:
        return int(half)
    if detail == 1:
        return int(low)
    return int(mass)


def _keepout(z, centre, radius):
    return abs(z - centre) < radius


def _min_skin(stations, z0, z1, samples=9):
    """Min straight-flank half-extents on [z0, z1]."""
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


def _fill_span(z0, z1, n, length, overlap=_HOLD_OVER):
    """Return centres that place n modules of ``length`` inside [z0, z1]."""
    n = max(1, int(n))
    span = z1 - z0
    if n == 1 or span <= length:
        return ((z0 + z1) * 0.5,)
    pitch = (span - length) / float(n - 1)
    if pitch < length - overlap:
        pitch = length - overlap
    cz0 = z0 + length * 0.5
    return tuple(cz0 + i * pitch for i in range(n))


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Hollow Reach provision carrier (freighter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (85.0, 46.75, 25.5).
    detail   -- 3 full  2 halved repeats  1 primary masses + bay
                0 loft + drive + radiators + hold boxes + mast shafts.
                lod3 exists (detail 0).

    AUTHORED AIM only (no bake in this file):
        span ≈ 78; verts 40 000–90 000; engine glow at l*0.47
        G2 mast 14.00 >= 12.75; G5 transfer nest; G3 8-nozzle + rad pair
        spanZ/spanX >= 1.05; spanY/spanZ <= 0.62; spanX/spanZ >= 0.16
        triangles 60 000 / 24 000 / 8 000 / 4 000
    """
    H = kit.ROLE_HULL
    _ = (b, h)

    st = _freighter_stations(l)

    z_nose = l * -0.448
    z_bow_s = l * -0.246
    z_mid_s = l * 0.213
    z_trans = l * 0.470
    z_bay = l * 0.055
    z_dock = z_nose + 2.40
    z_mast_bow = l * -0.340
    z_mast_mid = l * -0.090

    # ── SEALED CARRIER LOFT (always). ───────────────────────────────────
    kit.hull_loft(parts, 'freighter.hull', H, st, hull_mat)

    # ── DRIVE FACE (always): 8 nozzles, 4x2 grid on the transom. ────────
    d_hw, d_hh, d_yo, _ch = sf.section(st, z_trans)
    hw.drive_face(parts, glow, 'freighter.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), d_hw, d_hh,
                  nozzles=8, depth=0.72, detail=detail)

    # ── §G3 RADIATORS (always): large flat slabs; primary outline. ──────
    _place_radiators(parts, st, hull_mat, l, detail)

    # ── HOLD MASS (always): provision identity at every LOD. ────────────
    _place_holds(parts, st, hull_mat, z_bow_s, z_mid_s, z_bay, detail)

    # ── §G2 MASTS (always): bow 14.00 + mid 9.00. Never on the stern. ───
    _place_masts(parts, st, hull_mat, z_mast_bow, z_mast_mid, detail)

    # ── BOW SENSOR + VENTRAL COLLAR (always): external berth, spanZ. ────
    _bow_sensor(parts, glow, st, hull_mat, glow_mat,
                z_nose, z_dock, detail)

    if detail < 1:
        return

    # ── ONE WRAP DRAPE A SIDE (detail 1+): mid value contrast. ──────────
    _place_wraps(parts, st, hull_mat, z_bow_s, z_mid_s, detail)

    # ── SHUTTER SEAMS at the two zone joints (detail 1+). ───────────────
    _place_seams(parts, st, hull_mat, z_bow_s, z_mid_s, detail)

    # ── KEEL BLADDERS (detail 1+): mid/keel, away from the drive. ───────
    _place_bladders(parts, st, hull_mat, z_bow_s, z_mid_s, detail)

    # ── §G5 OPEN BAY (detail 1+): pad through the wall, craft on pad. ───
    _open_bay(parts, hull_mat, z_bay, detail)

    if detail < 2:
        return

    # ── SENSOR-BAND ARRAYS + LANTERNS (detail 2+). Bow/mid only. ────────
    _sensor_band(parts, glow, st, hull_mat, glow_mat, l, detail)

    if detail < 3:
        return

    # ── SECOND BURIED LANTERN (detail 3): mid, still far from drives. ───
    z_ln = l * -0.050
    ty_ln = sf.top_y(st, z_ln, 0.10)
    hw.buried_lantern(parts, glow, 'freighter.lantern.mid', hull_mat,
                      glow_mat, (0.10, ty_ln - 0.04, z_ln),
                      facing='up', detail=detail)


# ===========================================================================
# HOLDS / BLADDERS / WRAPS
# ===========================================================================

def _place_holds(parts, st, mat, z_bow_s, z_mid_s, z_bay, detail):
    """Repeated absolute shielded holds along mid. Grow count, not size."""
    H = kit.ROLE_HULL
    sz = sf.SHIELDED_HOLD[2]
    z0 = z_bow_s + 1.60
    z1 = z_mid_s - 1.60

    if detail < 1:
        # Coarse hold boxes so lod3 still reads as a provision carrier.
        zs = (z_bow_s + 6.40, (z_bow_s + z_mid_s) * 0.42, z_mid_s - 7.20)
        for side, tag in ((-1.0, 'p'), (1.0, 's')):
            for i, cz in enumerate(zs):
                if side > 0.0 and _keepout(cz, z_bay, _BAY_KEEP):
                    continue
                yo = sf.section(st, cz)[2]
                fx = sf.flank_x(st, cz, yo)
                if fx <= 0.20:
                    fx = 5.80
                kit.box(parts, 'freighter.hold-mass.%s.%d' % (tag, i), H,
                        (side * (fx + 0.35), yo, cz),
                        (2.20, 1.50, 5.80), mat)
        return

    n_z = _n(detail, 24, 12, 7, 0)
    n_col = _n(detail, 2, 2, 1, 0)
    n_ly = _n(detail, 2, 1, 1, 0)
    if n_z < 1:
        return
    zs = _fill_span(z0, z1, n_z, sz, overlap=_HOLD_OVER)
    x_off = (0.42, 1.37)
    y_off = (0.00, 0.62)
    for side, tag in ((-1.0, 'p'), (1.0, 's')):
        for zi, cz in enumerate(zs):
            if side > 0.0 and _keepout(cz, z_bay, _BAY_KEEP):
                continue
            for ci in range(n_col):
                for li in range(n_ly):
                    yo = sf.section(st, cz)[2] + y_off[li]
                    fx = sf.flank_x(st, cz, yo)
                    if fx <= 0.20:
                        fx = 5.80
                    loc_x = side * (fx + x_off[ci])
                    hw.shielded_hold(parts, 'freighter.hold.%s.%d.%d.%d' %
                                     (tag, zi, ci, li), mat,
                                     (loc_x, yo, cz), detail=detail)


def _place_bladders(parts, st, mat, z_bow_s, z_mid_s, detail):
    """Soft tanks on a mid keel block. Extra starboard bladder is the bias."""
    H = kit.ROLE_HULL
    n = _n(detail, 8, 4, 3, 0)
    if n < 1:
        return
    sz = sf.FUEL_BLADDER[2]
    # Stay inside mid and well forward of the drive face.
    z0 = z_bow_s + 3.20
    z1 = z_mid_s - 4.80
    zs = _fill_span(z0, z1, n, sz, overlap=0.18)
    cz_k = (z0 + z1) * 0.5
    by_k = sf.bottom_y(st, cz_k, 0.0)
    kit.box(parts, 'freighter.keel.bladder-spine', H,
            (0.0, by_k + 0.08, cz_k),
            (2.20, 0.40, (z1 - z0) * 0.92), mat)
    for i, cz in enumerate(zs):
        by = sf.bottom_y(st, cz, 0.0)
        hw.fuel_bladder(parts, 'freighter.bladder.%d' % i, mat,
                        (0.0, by + 0.10, cz), detail=detail)
    if detail < 2:
        return
    # One extra starboard bladder — the functional asymmetry.
    cz_a = zs[min(2, len(zs) - 1)] + 0.40
    by_a = sf.bottom_y(st, cz_a, 0.55)
    hw.fuel_bladder(parts, 'freighter.bladder.stbd-extra', mat,
                    (0.62, by_a + 0.10, cz_a), detail=detail)


def _place_wraps(parts, st, mat, z_bow_s, z_mid_s, detail):
    """One large mid drape a side. Thickness straddles the flank skin."""
    z0 = z_bow_s + 2.80
    z1 = z_mid_s - 2.80
    hw_m, st_h, _fw, yo_m = _min_skin(st, z0, z1)
    if hw_m <= 0.40 or st_h <= 0.40:
        return
    face_w = (z1 - z0) * 0.88
    face_h = st_h * 2.0 * 0.90
    th = 0.16
    cz = (z0 + z1) * 0.5
    for side, facing, tag in ((1.0, 'starboard', 's'),
                              (-1.0, 'port', 'p')):
        loc_x = side * (hw_m - 0.02)
        sh.wrap_panel(parts, 'freighter.wrap.%s' % tag, mat,
                      (loc_x, yo_m, cz),
                      size=(face_w, face_h, th), facing=facing,
                      detail=detail)


def _place_seams(parts, st, mat, z_bow_s, z_mid_s, detail):
    """Local shutter-seam beads at each zone joint. Not a full-beam strip."""
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        _hw, _hh, yo, _ch = sf.section(st, zs)
        fx = sf.flank_x(st, zs, yo)
        ty = sf.top_y(st, zs, 0.0)
        sh.shutter_seam(parts, 'freighter.seam.%s.top' % tag, mat,
                        (0.0, ty - 0.02, zs),
                        size=(0.70, 0.16, 0.18), detail=detail)
        if fx > 0.30:
            sh.shutter_seam(parts, 'freighter.seam.%s.s' % tag, mat,
                            (fx - 0.10, yo, zs),
                            size=(0.56, 0.22, 0.16), detail=detail)
            sh.shutter_seam(parts, 'freighter.seam.%s.p' % tag, mat,
                            (-(fx - 0.10), yo, zs),
                            size=(0.56, 0.22, 0.16), detail=detail)
        if detail >= 2:
            by = sf.bottom_y(st, zs, 0.0)
            sh.shutter_seam(parts, 'freighter.seam.%s.keel' % tag, mat,
                            (0.0, by + 0.04, zs),
                            size=(0.64, 0.16, 0.16), detail=detail)


# ===========================================================================
# MASTS / BOW / BAY / BAND
# ===========================================================================

def _place_masts(parts, st, mat, z_bow, z_mid, detail):
    """Bow G2 mast 14.00 and mid mast 9.00. Shafts bury into the roots."""
    # Primary — bow / forward-mid deck, far from the transom drives.
    ty = sf.top_y(st, z_bow, 0.0)
    root_y = ty - 0.06
    hw.sensor_root(parts, 'freighter.mast.bow', mat,
                   (0.0, root_y, z_bow), detail=detail)
    sh.listening_mast(parts, 'freighter.mast.bow', mat,
                      (0.0, root_y + 0.08, z_bow),
                      length=_MAST_PRI, facing='up', detail=detail)
    # Secondary — still in mid, never on the stern drive face.
    ty2 = sf.top_y(st, z_mid, 0.55)
    root_y2 = ty2 - 0.06
    hw.sensor_root(parts, 'freighter.mast.mid', mat,
                   (0.55, root_y2, z_mid), detail=detail)
    sh.listening_mast(parts, 'freighter.mast.mid', mat,
                      (0.55, root_y2 + 0.08, z_mid),
                      length=_MAST_MID, facing='up', detail=detail)


def _bow_sensor(parts, glow, st, hull_mat, glow_mat, z_nose, z_dock, detail):
    """Shuttered sensor face plus a shuttered ventral external collar."""
    H = kit.ROLE_HULL
    hw_n, hh_n, yo_n, _ch = sf.section(st, z_nose)
    sh.shutter_bank(parts, 'freighter.bow.shutter', hull_mat,
                    (0.0, yo_n, z_nose + 0.04),
                    size=(hw_n * 2.0 * 0.92, hh_n * 2.0 * 0.88, 0.16),
                    facing='nose', detail=detail)
    # Ventral berth pad + collar on an OUTBOARD face (down).
    by = sf.bottom_y(st, z_dock, 0.0)
    kit.box(parts, 'freighter.berth.pad', H,
            (0.0, by + 0.04, z_dock),
            (2.20, 0.22, 2.40), hull_mat)
    hw.docking_collar(parts, glow, 'freighter.collar', hull_mat, glow_mat,
                      (0.0, by - 0.02, z_dock), facing='down',
                      detail=detail)
    if detail >= 1:
        sh.shutter_bank(parts, 'freighter.collar.shutter', hull_mat,
                        (0.0, by + 0.04, z_dock),
                        size=(1.80, 1.80, 0.14), facing='down',
                        detail=detail)


def _place_radiators(parts, st, mat, l, detail):
    """Large FLAT radiator wings on the drive house. Outline breakers."""
    z_h = l * 0.360
    yo = sf.section(st, z_h)[2]
    fx = sf.flank_x(st, z_h, yo)
    if fx <= 0.20:
        fx = 5.40
    hx, hy, hz = (11.40, 0.22, 15.60)
    inset = 0.18
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        loc_x = side * (fx - inset + hx * 0.5)
        loc_y = yo + 0.85
        hw.radiator_panel(parts, 'freighter.rad.%s' % tag, mat,
                          (loc_x, loc_y, z_h), (hx, hy, hz),
                          detail=detail)


def _open_bay(parts, mat, z_bay, detail):
    """Open starboard bay. Pad pierces the wall. Transfer craft sits on it."""
    H = kit.ROLE_HULL
    wall_x = 6.40
    yo = 0.20
    kit.box(parts, 'freighter.bay.wall.in', H,
            (wall_x, yo, z_bay),
            (0.32, 2.40, 6.20), mat)
    kit.box(parts, 'freighter.bay.wall.fwd', H,
            (wall_x + 1.90, yo, z_bay - 3.05),
            (3.80, 2.30, 0.22), mat)
    kit.box(parts, 'freighter.bay.wall.aft', H,
            (wall_x + 1.90, yo, z_bay + 3.05),
            (3.80, 2.30, 0.22), mat)
    # Pad starts INBOARD of the wall and runs THROUGH it.
    pad_x = wall_x + 1.60
    pad_y = yo - 1.15
    kit.box(parts, 'freighter.bay.pad', H,
            (pad_x, pad_y, z_bay),
            (5.00, _PAD_T, 5.60), mat)
    kit.box(parts, 'freighter.bay.keel-strut', H,
            (wall_x * 0.50, yo - 0.40, z_bay),
            (wall_x + 0.40, 0.32, 0.90), mat)

    tby = _CRAFT_BODY[1]
    craft_x = wall_x + 2.20
    craft_y = pad_y + _PAD_T * 0.5 + tby * 0.5 - 0.14
    kit.box(parts, 'freighter.bay.craft.body', H,
            (craft_x, craft_y, z_bay),
            _CRAFT_BODY, mat)
    if detail < 2:
        return
    kit.box(parts, 'freighter.bay.craft.nose', H,
            (craft_x, craft_y + 0.06, z_bay - 0.92),
            _CRAFT_NOSE, mat)
    kit.box(parts, 'freighter.bay.craft.tail', kit.ROLE_ARMOUR,
            (craft_x, craft_y, z_bay + 0.96),
            _CRAFT_TAIL, mat)
    if detail < 3:
        return
    # Nested hold on the same cradle; intersects the pad.
    hy = sf.SHIELDED_HOLD[1]
    hw.shielded_hold(parts, 'freighter.bay.hold', mat,
                     (wall_x + 1.10, pad_y + _PAD_T * 0.5 + hy * 0.5 - 0.14,
                      z_bay + 1.70),
                     detail=detail)


def _sensor_band(parts, glow, st, hull_mat, glow_mat, l, detail):
    """Passive vanes and one buried lantern — bow / forward-mid only."""
    z_arr = l * -0.360
    ty = sf.top_y(st, z_arr, 0.0)
    hw.passive_array(parts, 'freighter.array.bow', hull_mat,
                     (0.0, ty + 0.08, z_arr),
                     count=10, axis='z', detail=detail)
    yo = sf.section(st, z_arr)[2]
    fx = sf.flank_x(st, z_arr, yo)
    if fx > 0.30:
        n_flank = 6 if detail >= 3 else 3
        hw.passive_array(parts, 'freighter.array.bow.s', hull_mat,
                         (fx - 0.06, yo + 0.55, z_arr),
                         count=n_flank, axis='z', detail=detail)
        hw.passive_array(parts, 'freighter.array.bow.p', hull_mat,
                         (-(fx - 0.06), yo + 0.55, z_arr),
                         count=n_flank, axis='z', detail=detail)
    z_ln = l * -0.300
    ty_ln = sf.top_y(st, z_ln, 0.15)
    hw.buried_lantern(parts, glow, 'freighter.lantern.bow', hull_mat,
                      glow_mat, (0.15, ty_ln - 0.04, z_ln),
                      facing='up', detail=detail)
