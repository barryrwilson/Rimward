"""Lamplighter Freighter — MOBILE GATE YARD.

Bible §4.10 Freighter: "A colossal open truss carrying spare ring
segments, relay masts, fuel, cable drums, workshops, and docked tugs.
Its cargo is visibly infrastructure-scale. It must be one of the
broadest station-exterior silhouettes in the game."

Plate 10-lamplighter-guild-ship.png is CONCEPT ART, not a model.
New sculpt: EXPOSED FRAME, utility. Two solid volumes (forward yard
office, aft drive+fuel) with a genuinely OPEN truss mid. Not a closed
box. Not a plated tube. Not Congregation ritual geometry.

BODY PLAN
    Bow loft is the yard office. Stern loft is the drive house and
    fuel block. Mid is an OPEN two-deck truss: spine chords plus
    port / starboard wing runs. You can see through the mid gap.
    Cargo is MORE ``sf.RING_CHORD`` (1.85) segment boxes, never a
    scaled-up chord. Construction repeats ``sv.truss_bay``,
    ``sv.cable_reel``, ``sv.utility_module``.

STATIONS (z as fractions of l; half-extents ABSOLUTE, never *b / *h):
    Office nose at l*-0.318 = -27.030; transom at l*0.470 = +39.950.
    Drive loc is the transom; housing face 0.12 aft → +40.070.
    Fork hub at nose + 0.16; reach 14.00 → jaw tip ≈ -40.870.
    Authored spanZ ≈ 80.94 (aim 78–85, band [66.00, 109.20]).
    Bow/mid seam at l*-0.152 = -12.920; mid/stern at l*+0.257 = +21.845.

ZONES (of loft nose..transom = 66.98):
    bow   l*-0.318 .. l*-0.152    ~21 %  office + huge gate-fork + collar
    mid   l*-0.152 .. l*+0.257    ~52 %  open truss, rings, reels, bay
    stern l*+0.257 .. l*+0.470    ~27 %  drive house, 8-nozzle grid,
                                          flat radiators, fuel tanks

OUTLINE-BREAKER (§G2): ``sv.gate_fork`` facing nose, plane='lr'.
    need = 0.15 * 85.0 = 12.75
    authored reach = 14.00 (>= 12.75; grow with arm length, never hub)
    Shared hub stays the 0.32 construct. Arms are structural
    (construct link radius >= 0.08).

§G3
    Large FLAT ``hw.radiator_panel`` pairs on the stern (no fins).
    ``hw.drive_face`` 8 countable nozzles in a 4x2 GRID. No
    ``kit.engine_bank``.

§G5
    One OPEN starboard mid bay (inboard + forward + aft walls, no
    outboard face, no roof). Cradle pad starts inboard and runs
    THROUGH the wall. A tug-sized 3-box nest INTERSECTS that pad.

ONE functional asymmetry: open bay on starboard; one extra port mast.
ONE service band: starboard mid wing (gantries, lamps, utility boxes).
Lamps use ``sf.LAMP_SPACING`` 1.20, never edge-to-edge. Emissive
<= 5 % of this huge hull (drive discs + lamp irises + collar slit).

DETAIL LADDER (this class has lod3):
    3  full yard: both lofts, all truss bays, full ring racks, reels,
       workshops, lamps, gantries, bay contents, radiators, fork
    2  half the repeats (bays, rings, reels, modules, lamps)
    1  primary masses: both lofts, connecting chords, fork, drive,
       radiators, open bay + tug body, a short truss row, ring pads
    0  coarsest masses: both lofts + truss chords + drive + fork
       + a few ring boxes. Must still read as a yard at thumbnail.

DENSITY (AUTHORED AIM only — re-derive after bake):
    hull verts 50 000–120 000 (band [34 000, 154 000])
    max span 78–85 (band [66.00, 109.20], target 78; authored ≈ 81)
    len/beam >= 1.05; ht/len <= 0.62; beam/len >= 0.16
    triangles inside 60 000 / 24 000 / 8 000 / 4 000 (lod0..lod3)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import service as sv
from . import hardware as hw


# Absolute modules. Never multiply by l, b or h.
_FORK_REACH = 14.00
_CHORD_R = 0.10
_PAD_H = 0.22
_RING = (sf.RING_CHORD, 0.28, 0.62)
_WING_X = 22.00
_MID_X = 11.00
_Y_UP = 2.05
_Y_LO = -1.95
_YO_S = sf.TRUSS_CHORD * 0.42
# Upper longeron centre. Pads and the service rail bury into this member.
_Y_UP_CHORD = _Y_UP + _YO_S
_BAY_OVER = 0.16
_TUG_BODY = (1.50, 0.90, 4.80)
_TUG_CABIN = (1.10, 0.52, 1.40)
_TUG_TAIL = (0.85, 0.46, 0.90)
_TANK_R = 1.35
_TANK_LEN = 5.20


# ===========================================================================
# STATION LISTS — two solid volumes. Mid is not lofted.
# ===========================================================================

def _bow_stations(l):
    """Yard-office loft. Absolute half-extents. Nose at l*-0.318."""
    return [
        sf.fair(l * -0.318, 5.60, 3.10, 0.35),  # office nose
        sf.fair(l * -0.280, 6.60, 3.55, 0.28),
        sf.fair(l * -0.220, 7.10, 3.85, 0.22),
        sf.fair(l * -0.152, 7.00, 3.80, 0.18),  # bow / mid seam
    ]


def _stern_stations(l):
    """Drive-house loft. Absolute half-extents. Transom at l*0.470."""
    return [
        sf.fair(l *  0.257, 8.10, 4.30, 0.16),  # mid / stern seam
        sf.fair(l *  0.340, 8.50, 4.50, 0.10),
        sf.fair(l *  0.410, 7.60, 4.00, 0.04),
        sf.fair(l *  0.470, 6.20, 3.30, 0.00),  # transom
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


def _fill_span(z0, z1, n, length, overlap=_BAY_OVER):
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


def _keepout(z, centre, radius):
    return abs(z - centre) < radius


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Lamplighter Guild mobile gate yard (freighter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (85.0, 46.75, 25.5).
    detail   -- 3 full  2 halved repeats  1 primary masses + bay
                0 two volumes + truss chords + drive + fork + ring masses.
                lod3 exists (detail 0).

    AUTHORED AIM only (no bake in this file):
        span ≈ 81; verts 50 000–120 000; engine glow at l*0.47
        G2 reach 14.00 >= 12.75; G5 tug nest; G3 8-nozzle grid
        len/beam >= 1.05; ht/len <= 0.62; beam/len >= 0.16
        triangles 60 000 / 24 000 / 8 000 / 4 000
    """
    H = kit.ROLE_HULL
    _ = (b, h)

    bow_st = _bow_stations(l)
    stern_st = _stern_stations(l)

    z_nose = l * -0.318
    z_bow_s = l * -0.152
    z_mid_s = l * 0.257
    z_trans = l * 0.470
    z_fork = z_nose + 0.16
    z_bay = l * 0.040
    z_mast = l * -0.020

    # ── TWO SOLID VOLUMES (always). Mid is not lofted. ──────────────────
    kit.hull_loft(parts, 'freighter.office', H, bow_st, hull_mat)
    kit.hull_loft(parts, 'freighter.drivehouse', H, stern_st, hull_mat)

    # ── CONNECTING TRUSS CHORDS (always). One body across the open mid. ─
    z_c0 = z_bow_s - 0.55
    z_c1 = z_mid_s + 0.55
    _spine_chords(parts, hull_mat, z_c0, z_c1)

    # ── DRIVE FACE (always): 8 nozzles, 4x2 grid on the transom. ────────
    d_hw, d_hh, d_yo, _ = sf.section(stern_st, z_trans)
    hw.drive_face(parts, glow, 'freighter.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), d_hw, d_hh,
                  nozzles=8, depth=0.72, detail=detail)

    # ── §G2 GATE FORK (always): reach 14.00, hub stays small. ───────────
    yo_fork = sf.section(bow_st, z_fork)[2]
    sv.gate_fork(parts, 'freighter.fork', hull_mat,
                 (0.0, yo_fork, z_fork),
                 facing='nose', reach=_FORK_REACH, plane='lr',
                 detail=detail)

    # ── COARSE RING MASSES (always): thumbnail must read as a yard. ─────
    n_ring_z = _n(detail, 8, 4, 3, 2)
    n_ring_col = _n(detail, 3, 2, 2, 1)
    n_ring_ly = _n(detail, 2, 2, 1, 1)
    _ring_racks(parts, hull_mat, z_bow_s, z_mid_s, z_bay,
                n_ring_z, n_ring_col, n_ring_ly, detail)

    if detail < 1:
        return

    # ── TRUSS BAYS (detail 1+): MORE default modules on both decks. ─────
    n_bay = _n(detail, 10, 5, 3, 0)
    _truss_runs(parts, hull_mat, z_bow_s, z_mid_s, z_bay, n_bay, detail)

    # ── §G3 RADIATORS (detail 1+): large flat slabs, outline breakers. ──
    _place_radiators(parts, stern_st, hull_mat, l, detail)

    # ── §G5 OPEN BAY (detail 1+): pad through the wall, tug on the pad. ─
    _open_bay(parts, hull_mat, z_bay, detail)

    # ── FUEL TANKS (detail 1+): intersect the drive house keel. ─────────
    _fuel_tanks(parts, stern_st, hull_mat, l, detail)

    # ── BOW COLLAR (detail 1+): fleet bore, buried in the office nose. ──
    yo_nose = sf.section(bow_st, z_nose)[2]
    hw.docking_collar(parts, glow, 'freighter.collar', hull_mat, glow_mat,
                      (0.0, yo_nose, z_nose), facing='nose', detail=detail)

    # ── EXTRA PORT MAST (detail 1+): the one functional asymmetry. ──────
    _port_mast(parts, hull_mat, z_mast, detail)

    if detail < 2:
        return

    # ── WORKSHOPS + REELS + UTILITY (detail 2+). ────────────────────────
    _place_workshops(parts, hull_mat, z_bow_s, z_mid_s, z_bay, detail)
    _place_reels(parts, hull_mat, z_bow_s, z_mid_s, z_bay, detail)
    _place_utility(parts, hull_mat, z_bow_s, z_mid_s, z_bay, detail)

    # ── ONE STARBOARD SERVICE BAND (detail 2+): gantries + lamps. ───────
    _service_band(parts, glow, hull_mat, glow_mat,
                  z_bow_s, z_mid_s, z_bay, detail)

    # ── SEAM COLLARS on the two solid faces (detail 2+). ────────────────
    for tag, st, zs in (('bow', bow_st, z_bow_s),
                        ('stern', stern_st, z_mid_s)):
        hw_s, hh_s, yo_s, _ch = sf.seam_ring(st, zs, over=0.08)
        kit.box(parts, 'freighter.seam.' + tag, H,
                (0.0, yo_s, zs),
                (hw_s * 2.0, hh_s * 2.0, 0.22), hull_mat)

    if detail < 3:
        return

    # ── OFFICE / HOUSE FITTINGS (detail 3): rails, panels, beacons. ─────
    _place_office_gear(parts, bow_st, hull_mat, l, detail)
    _place_house_gear(parts, stern_st, hull_mat, l, detail)


# ===========================================================================
# PRIMARY STRUCTURE
# ===========================================================================

def _spine_chords(parts, mat, z0, z1):
    """Longerons that enter both solid volumes. Wide wings + narrow spine."""
    H = kit.ROLE_HULL
    r = _CHORD_R
    # Spine box (enters office and drive house).
    xo_s = sf.TRUSS_CHORD * 0.50
    yo_s = sf.TRUSS_CHORD * 0.42
    for deck_y in (_Y_UP, _Y_LO):
        for sx in (-xo_s, xo_s):
            for sy in (-yo_s, yo_s):
                kit.strut(parts, 'freighter.chord.spine.%.1f.%d.%d' %
                          (deck_y, int(sx > 0), int(sy > 0)), H,
                          (sx, deck_y + sy, z0),
                          (sx, deck_y + sy, z1),
                          mat, r, vertices=6)
    # Wing longerons (the broad yard outline).
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        for xw in (_MID_X, _WING_X):
            for deck_y in (_Y_UP, _Y_LO):
                for sy in (-yo_s, yo_s):
                    kit.strut(parts, 'freighter.chord.%s.x%d.y%.1f.%d' %
                              (tag, int(xw), deck_y, int(sy > 0)), H,
                              (side * xw, deck_y + sy, z0),
                              (side * xw, deck_y + sy, z1),
                              mat, r, vertices=6)
    # End posts and cross-ties so wings share one body with the lofts.
    for zi, zz in enumerate((z0 + 0.20, (z0 + z1) * 0.5, z1 - 0.20)):
        for side in (-1.0, 1.0):
            for xw in (_MID_X, _WING_X):
                kit.strut(parts, 'freighter.tie.%d.%d.%d' %
                          (zi, int(side > 0), int(xw)), H,
                          (side * xo_s, _Y_UP, zz),
                          (side * xw, _Y_UP, zz),
                          mat, r, vertices=6)
                kit.strut(parts, 'freighter.tie.lo.%d.%d.%d' %
                          (zi, int(side > 0), int(xw)), H,
                          (side * xo_s, _Y_LO, zz),
                          (side * xw, _Y_LO, zz),
                          mat, r, vertices=6)
        # Vertical posts at the three stations (deck-to-deck).
        # No x=0.0 post: spine chords live at ±xo_s, so a centreline
        # strut floats (island groups at those three Z stations).
        for xi, xx in enumerate((-_WING_X, -_MID_X, _MID_X, _WING_X)):
            kit.strut(parts, 'freighter.post.%d.%d' % (zi, xi), H,
                      (xx, _Y_LO - yo_s, zz),
                      (xx, _Y_UP + yo_s, zz),
                      mat, r, vertices=6)


def _truss_runs(parts, mat, z_bow_s, z_mid_s, z_bay, n_bay, detail):
    """Default ``sv.truss_bay`` copies on both decks. Never scaled."""
    if n_bay < 1:
        return
    z0 = z_bow_s + 0.20
    z1 = z_mid_s - 0.20
    zs = _fill_span(z0, z1, n_bay, sf.TRUSS_BAY_LEN, overlap=_BAY_OVER)
    # Three runs (spine + wings). Mid-X is chords only — keeps lod0 tris down.
    xs = (0.0, -_WING_X, _WING_X)
    for deck_i, deck_y in enumerate((_Y_UP, _Y_LO)):
        if detail < 3 and deck_i > 0:
            continue
        for xi, xx in enumerate(xs):
            for i, cz in enumerate(zs):
                if xx > 8.0 and _keepout(cz, z_bay, 4.20):
                    continue
                sv.truss_bay(parts, 'freighter.truss.d%d.x%d.%02d' %
                             (deck_i, xi, i), mat,
                             (xx, deck_y, cz), detail=detail)


def _ring_racks(parts, mat, z_bow_s, z_mid_s, z_bay,
                n_z, n_col, n_ly, detail):
    """Spare ring-segment boxes. Size is ``sf.RING_CHORD``, never scaled."""
    H = kit.ROLE_HULL
    if n_z < 1:
        return
    sx, sy, sz = _RING
    z0 = z_bow_s + 1.10
    z1 = z_mid_s - 1.10
    zs = _fill_span(z0, z1, n_z, sx, overlap=0.20)
    col_pitch = sx + 0.18
    # Port wing only at the coarsest mass so the thumbnail stays open.
    sides = ((-1.0, 'port'),)
    if detail >= 1:
        sides = ((-1.0, 'port'), (1.0, 'stbd'))
    for side, tag in sides:
        for i, cz in enumerate(zs):
            if side > 0.0 and _keepout(cz, z_bay, 4.40):
                continue
            pad_x = side * (_WING_X + 0.40)
            pad_y = _Y_UP_CHORD + _PAD_H * 0.5 - 0.14
            pad_w = col_pitch * n_col + 0.50
            kit.box(parts, 'freighter.ringpad.%s.%02d' % (tag, i), H,
                    (pad_x, pad_y, cz),
                    (pad_w, _PAD_H, sx + 0.30), mat)
            origin = pad_x - side * col_pitch * (n_col - 1) * 0.5
            for col in range(n_col):
                cx = origin + side * col * col_pitch
                for layer in range(n_ly):
                    cy = pad_y + _PAD_H * 0.5 + sy * 0.5 - 0.12 + layer * (sy - 0.08)
                    kit.box(parts, 'freighter.ring.%s.%02d.%d.%d' %
                            (tag, i, col, layer), H,
                            (cx, cy, cz), _RING, mat)


def _place_radiators(parts, stern_st, mat, l, detail):
    """Large FLAT radiator wings on the drive house. Outline breakers."""
    # Horizontal pair: inboard edge buries >= 0.14 in the house.
    z_h = l * 0.360
    yo = sf.section(stern_st, z_h)[2]
    fx = sf.flank_x(stern_st, z_h, yo)
    if fx <= 0.20:
        fx = 8.20
    hx, hy, hz = (16.80, 0.22, 13.20)
    inset = 0.16
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        loc_x = side * (fx - inset + hx * 0.5)
        loc_y = yo + 2.10
        hw.radiator_panel(parts, 'freighter.rad.h.%s' % tag, mat,
                          (loc_x, loc_y, z_h), (hx, hy, hz),
                          detail=detail)
    if detail < 2:
        return
    # Vertical pair: extra thermal face, still flat, no fins.
    z_v = l * 0.400
    yo_v = sf.section(stern_st, z_v)[2]
    fx_v = sf.flank_x(stern_st, z_v, yo_v)
    if fx_v <= 0.20:
        fx_v = 7.40
    vx, vy, vz = (0.24, 7.20, 11.40)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'freighter.rad.v.%s' % tag, mat,
                          (side * (fx_v - 0.08), yo_v, z_v),
                          (vx, vy, vz), detail=detail)


def _fuel_tanks(parts, stern_st, mat, l, detail):
    """Fuel drums under the drive house. Each cylinder bites the loft."""
    H = kit.ROLE_HULL
    n = _n(detail, 4, 4, 2, 0)
    if n < 1:
        return
    z_tank = l * 0.355
    keel = sf.bottom_y(stern_st, z_tank, 0.0)
    xs = (-3.10, 3.10, -5.40, 5.40)[:n]
    for i, xx in enumerate(xs):
        # Top of the drum sits inside the house keel.
        cy = keel + _TANK_R - 0.22
        kit.cyl(parts, 'freighter.fuel.%d' % i, H,
                (xx, cy, z_tank),
                _TANK_R, _TANK_LEN, mat,
                rotation=sf.CYL_ALONG_Z, vertices=12)


def _port_mast(parts, mat, z_mast, detail):
    """One extra port-wing mast. Asymmetry; not a scaled relay module."""
    H = kit.ROLE_HULL
    foot_y = _Y_UP - 0.12
    col_h = 5.20
    kit.box(parts, 'freighter.mast.port.col', H,
            (-_WING_X, foot_y + col_h * 0.5, z_mast),
            (0.30, col_h, 0.30), mat)
    hw.relay_mast(parts, 'freighter.mast.port.cap', mat,
                  (-_WING_X, foot_y + col_h - 0.08, z_mast),
                  height=sf.RELAY_MAST_H, detail=detail)
    if detail < 2:
        return
    # Standard relay copies on the office-side wing — MORE masts, same size.
    hw.relay_mast(parts, 'freighter.mast.stbd', mat,
                  (_MID_X, _Y_UP - 0.10, z_mast + 4.20),
                  height=sf.RELAY_MAST_H, detail=detail)


def _open_bay(parts, mat, z_bay, detail):
    """Open starboard bay. Pad pierces the wall. Tug sits on the pad."""
    H = kit.ROLE_HULL
    wall_x = 16.80
    yo = _Y_UP - 0.40
    # Three walls + floor. No outboard face, no roof.
    kit.box(parts, 'freighter.bay.wall.in', H,
            (wall_x, yo, z_bay),
            (0.28, 2.60, 6.40), mat)
    kit.box(parts, 'freighter.bay.wall.fwd', H,
            (wall_x + 2.20, yo, z_bay - 3.15),
            (4.40, 2.50, 0.22), mat)
    kit.box(parts, 'freighter.bay.wall.aft', H,
            (wall_x + 2.20, yo, z_bay + 3.15),
            (4.40, 2.50, 0.22), mat)
    # Pad starts INBOARD of the wall and runs THROUGH it.
    pad_x = wall_x + 1.80
    pad_y = yo - 1.25
    kit.box(parts, 'freighter.bay.pad', H,
            (pad_x, pad_y, z_bay),
            (5.20, _PAD_H, 5.80), mat)
    # Strut from the spine chord through the inboard wall (one body).
    kit.box(parts, 'freighter.bay.keel-strut', H,
            (wall_x * 0.5, _Y_UP, z_bay),
            (wall_x + 0.60, 0.36, 0.80), mat)

    # Tug-sized 3-box nest. Body always; cabin/tail at detail 2+.
    # Body half-height 0.45; bury 0.14 into the pad so the probe is one body.
    tbx, tby, tbz = _TUG_BODY
    craft_x = wall_x + 2.40
    craft_y = pad_y + _PAD_H * 0.5 + tby * 0.5 - 0.14
    kit.box(parts, 'freighter.bay.tug.body', H,
            (craft_x, craft_y, z_bay),
            _TUG_BODY, mat)
    if detail >= 2:
        kit.box(parts, 'freighter.bay.tug.cabin', H,
                (craft_x, craft_y + 0.28, z_bay - 1.10),
                _TUG_CABIN, mat)
        kit.box(parts, 'freighter.bay.tug.tail', kit.ROLE_ARMOUR,
                (craft_x, craft_y, z_bay + 1.85),
                _TUG_TAIL, mat)
        cr = sf.CARGO_CRATE[0]
        crate_y = pad_y + _PAD_H * 0.5 + cr * 0.5 - 0.12
        wall_out = wall_x + 0.14
        cx0 = wall_out + cr * 0.5 - 0.10
        n_cr = 3 if detail >= 3 else 2
        for i, cz in enumerate((z_bay - 1.70, z_bay - 0.70, z_bay + 2.10)):
            if i >= n_cr:
                break
            kit.box(parts, 'freighter.bay.crate.%d' % i, H,
                    (cx0, crate_y, cz),
                    sf.CARGO_CRATE, mat)


# ===========================================================================
# DETAIL-2+ FITTINGS
# ===========================================================================

def _place_workshops(parts, mat, z_bow_s, z_mid_s, z_bay, detail):
    """Protected workshop volumes on spine pads that bite the chords."""
    H = kit.ROLE_HULL
    n = _n(detail, 4, 2, 0, 0)
    if n < 1:
        return
    zs = _fill_span(z_bow_s + 2.00, z_mid_s - 2.00, n, sf.WORKSHOP[2],
                    overlap=0.20)
    for i, cz in enumerate(zs):
        if _keepout(cz, z_bay, 3.80):
            continue
        side = -1.0 if (i % 2) == 0 else 1.0
        if side > 0.0 and _keepout(cz, z_bay, 3.80):
            continue
        loc_x = side * 0.90
        pad_y = _Y_UP_CHORD + _PAD_H * 0.5 - 0.14
        kit.box(parts, 'freighter.shop.pad.%02d' % i, H,
                (loc_x, pad_y, cz),
                (2.60, _PAD_H, sf.WORKSHOP[2] + 0.30), mat)
        wy = pad_y + _PAD_H * 0.5 + sf.WORKSHOP[1] * 0.5 - 0.12
        hw.workshop_volume(parts, 'freighter.shop.%02d' % i, mat,
                           (loc_x, wy, cz), detail=detail)


def _place_reels(parts, mat, z_bow_s, z_mid_s, z_bay, detail):
    """MORE cable drums under the lower wing chords."""
    n = _n(detail, 10, 5, 0, 0)
    if n < 1:
        return
    zs = _fill_span(z_bow_s + 1.40, z_mid_s - 1.40, n,
                    sf.CABLE_DRUM_R * 2.2, overlap=0.20)
    yo = _Y_LO - sf.CABLE_DRUM_R + 0.10
    for i, cz in enumerate(zs):
        if _keepout(cz, z_bay, 3.40):
            continue
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            if side > 0.0 and _keepout(cz, z_bay, 3.40):
                continue
            sv.cable_reel(parts, 'freighter.reel.%s.%02d' % (tag, i),
                          mat, (side * _MID_X, yo, cz), detail=detail)


def _place_utility(parts, mat, z_bow_s, z_mid_s, z_bay, detail):
    """Yellow access boxes on the starboard service band only."""
    H = kit.ROLE_HULL
    n = _n(detail, 8, 4, 0, 0)
    if n < 1:
        return
    zs = _fill_span(z_bow_s + 1.60, z_mid_s - 1.60, n, sf.UTILITY_BOX[2],
                    overlap=0.18)
    ux, uy, uz = sf.UTILITY_BOX
    for i, cz in enumerate(zs):
        if _keepout(cz, z_bay, 3.60):
            continue
        loc_x = _WING_X
        pad_y = _Y_UP_CHORD + _PAD_H * 0.5 - 0.14
        kit.box(parts, 'freighter.util.pad.%02d' % i, H,
                (loc_x, pad_y, cz),
                (ux + 0.40, _PAD_H, uz + 0.20), mat)
        uy_c = pad_y + _PAD_H * 0.5 + uy * 0.5 - 0.12
        sv.utility_module(parts, 'freighter.util.%02d' % i, mat,
                          (loc_x, uy_c, cz), detail=detail)


def _service_band(parts, glow, hull_mat, glow_mat,
                  z_bow_s, z_mid_s, z_bay, detail):
    """One starboard flank band: gantries, rails, lamps at 1.20 pitch."""
    H = kit.ROLE_HULL
    z0 = z_bow_s + 1.20
    z1 = z_mid_s - 1.20
    run = z1 - z0
    # Long rail the lamps bury into (not a closed mid hull).
    rail_y = _Y_UP_CHORD + 0.02
    kit.box(parts, 'freighter.band.rail', H,
            (_WING_X, rail_y, (z0 + z1) * 0.5),
            (0.22, 0.16, run), hull_mat)
    n_gantry = _n(detail, 6, 3, 0, 0)
    if n_gantry >= 1:
        gzs = _fill_span(z0 + 0.40, z1 - 0.40, n_gantry, sf.GANTRY_PITCH,
                         overlap=0.10)
        for i, cz in enumerate(gzs):
            if _keepout(cz, z_bay, 3.20):
                continue
            sv.gantry(parts, 'freighter.gantry.%02d' % i, hull_mat,
                      (_WING_X - 0.12, rail_y - 0.04, cz),
                      length=sf.GANTRY_PITCH, detail=detail)
            sv.access_rail(parts, 'freighter.rail.%02d' % i, hull_mat,
                           (_WING_X + 0.18, rail_y - 0.04, cz),
                           length=1.40, axis='z', detail=detail)
    # Full run count. lamp_bar halves at detail 2. Pitch is LAMP_SPACING.
    n_lamp = max(2, int(run / sf.LAMP_SPACING))
    hw.lamp_bar(parts, glow, 'freighter.lamps', hull_mat, glow_mat,
                (_WING_X, rail_y + 0.10, (z0 + z1) * 0.5),
                count=n_lamp, axis='z', facing='down', detail=detail)
    sv.cable_run(parts, 'freighter.band.cable', hull_mat,
                 (_WING_X - 0.55, rail_y, (z0 + z1) * 0.5),
                 length=min(run, 12.00), axis='z', detail=detail)


def _place_office_gear(parts, bow_st, mat, l, detail):
    """Human-scale fittings on the yard office. One roof rack, few panels."""
    z_rack = l * -0.240
    ty = sf.top_y(bow_st, z_rack, 0.0)
    hw.beacon_rack(parts, 'freighter.office.beacons', mat,
                   (0.80, ty + 0.04, z_rack), count=5, detail=detail)
    z_panel = l * -0.200
    yo = sf.section(bow_st, z_panel)[2]
    fx = sf.flank_x(bow_st, z_panel, yo)
    if fx > 0.20:
        hw.diag_panel(parts, 'freighter.office.diag', mat,
                      (fx - 0.02, yo + 0.40, z_panel),
                      facing='starboard', detail=detail)
    z_rail = l * -0.265
    ty_r = sf.top_y(bow_st, z_rail, 1.40)
    sv.access_rail(parts, 'freighter.office.rail', mat,
                   (1.40, ty_r - 0.02, z_rail),
                   length=2.20, axis='z', detail=detail)


def _place_house_gear(parts, stern_st, mat, l, detail):
    """A few diagnostic plates on the drive house. Band stays midships."""
    z_panel = l * 0.310
    yo = sf.section(stern_st, z_panel)[2]
    fx = sf.flank_x(stern_st, z_panel, yo)
    if fx > 0.20:
        hw.diag_panel(parts, 'freighter.house.diag.s', mat,
                      (fx - 0.02, yo + 0.55, z_panel),
                      facing='starboard', detail=detail)
        hw.diag_panel(parts, 'freighter.house.diag.p', mat,
                      (-(fx - 0.02), yo + 0.55, z_panel),
                      facing='port', detail=detail)
    z_pod = l * 0.290
    ty = sf.top_y(stern_st, z_pod, 1.10)
    hw.tool_pod(parts, 'freighter.house.pod', mat,
                (1.10, ty + sf.TOOL_POD[1] * 0.5 - 0.10, z_pod),
                detail=detail)
