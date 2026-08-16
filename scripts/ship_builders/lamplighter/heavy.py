"""Lamplighter Heavy — GATE TUG.

Bible §4.10 heavy: "A dense high-thrust block around a massive clamp
frame. Add articulated push arms, redundant drives, and protected
crew/workshop volume; weapons are secondary emergency fittings."

Plate 10-lamplighter-guild-ship.png is concept art, not a model to copy.
The plate gives the family: soot high-thrust block, yellow modules,
cobalt open bays, articulated arms. This class hardens that language
into a SHORT THICK tug brick. The fork / push arms are the identity.
No giant wrench. No gunship.

Construction logic is EXPOSED FRAME, utility (synthesis/21 §G6). A
bigger class carries MORE bays / MORE modules / MORE lamps, never
bigger copies. Grow the §G2 fork with arm length, never hub size.

BODY PLAN
    A dense soot loft (kit.hull_loft, blocky fair k=0.32) is the
    high-thrust brick. Half-extents are ABSOLUTE, never *b or *h.
    The bow is a massive clamp frame (cheeks, yokes, forward hoop)
    with sv.gate_fork buried in the hoop. Mid holds a protected
    hw.workshop_volume, yellow sv.utility_module copies, sv.gantry
    bays, an open cobalt bay with hw.diag_panel, sv.truss_bay copies,
    cable and a ventral reel. Mid frame adds longerons, deck posts
    and a short keel truss run. Stern is REDUNDANT: two hw.drive_face
    side-by-side (4 nozzles each, 8 countable) plus a G3
    hw.radiator_panel pair. One mid service band of work lamps.
    One extra starboard locker is the functional asymmetry. One
    workshop locker sits on the starboard flank. One small emergency
    cutter box on the port bow (not a battery).

STATION / ZONE REASONING (z as fractions of l; half-extents ABSOLUTE)
    Nose / loft plane at l*-0.310 = -5.270.
    Transom / drive plane at l*+0.458 = +7.786. Drive faces stand
    0.12 proud; driver engine glow sits at l*+0.47 = +7.990.
    Bow / mid seam at l*-0.156 = -2.652.
    Mid / stern seam at l*+0.243 = +4.131.
    Lofted length 13.056. Zones: bow 20.1 %, mid 51.9 %, stern 28.0 %.
    Mid half-beam 2.55, mid half-height 1.98 (short thick brick).
    The loft is shorter than the class span so the fork can lead.

OUTLINE-BREAKER (§G2)
    sv.gate_fork, plane='lr', facing nose. Default sf.CLAMP_REACH
    is 2.40 and is TOO SHORT for this class (floor 0.15*l = 2.55).
    Grow reach with arm length. Hub stays the construct's 0.32 cube.
        authored reach = 3.60
        floor           = 0.15 * 17.0 = 2.55
        authored share  = 21.2 % of l
    mix=0.40 in the fork; forward component ~0.928 * 3.60 = 3.34.
    Fork loc at z_nose+0.18 = -5.090, buried in the hoop. Jaw tip
    near z = -8.66. Authored spanZ ~ 16.57 (band 16.5-17.5).

§G3 THERMAL / DRIVE
    One pair of hw.radiator_panel, FLAT, no fins. Each slab is
    (0.26, 1.55, 2.30) full extents. Inboard 0.14 sits inside the
    upper-aft flank. Two drive faces sit side-by-side on the
    transom; each face is a 2x2 of 4 nozzles (8 countable).

EMISSIVE (authored aim, <= 5 % of hull area)
    8 drive discs, one mid-band lamp row (irises only at detail
    >= 2), one collar mark. No edge-lit panels. Authored glow
    area ~2.0 against a ~90 unit hull area (~2.2 %).

DETAIL LADDER
    3  full: every construct, full module / bay / lamp / reel / rail count
    2  all construct families; repeats halve
    1  loft + clamp frame + fork + workshop + both drives
    0  loft + both drive housings

ENVELOPE / AUTHORED AIM
    Driver: l = 17.0, b = 8.84, h = 5.78. Aim span 16.5-17.5
    (band [10.20, 23.80], target 17.0).
    Authored spanZ ~ 16.57; len/beam ~ 3.15 (>= 1.15); ht/len ~ 0.28
    (<= 0.60); beam/len ~ 0.32 (>= 0.16).
    Authored hull verts 11,000-16,000 (band 9,000-78,000).
    Island aim: one body; every fitting overlaps its host by >= 0.12.
    Arms bury into the clamp hoop and cheeks.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import hardware as hw
from . import service as sv
from . import surface as sf


# Absolute structural sizes. Not scaled by l, b or h.
_BURY = 0.14
_FORK_REACH = 3.60
_FRAME_CHEEK = (0.62, 2.50, 2.00)
_FRAME_YOKE = (4.40, 0.52, 1.85)
_FRAME_HOOP = (4.00, 2.70, 0.46)
_RAD = (0.26, 1.55, 2.30)
_EMERG = (0.36, 0.22, 0.40)
_BAY = (0.42, 1.10, 1.70)
_SEAM = 0.16


def _heavy_stations(l, b, h):
    """Dense high-thrust brick. Shorter and thicker than a cutter stick.

    Half-extents are absolute workboat radii. z fractions of l. y_offset
    stays 0.0 so the body is a squat tug block, not a faired leaf. b and
    h are the class envelope; the brick does not use them.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.310, 1.75, 1.40, 0.00),  # loft nose
        sf.fair(l * -0.230, 2.15, 1.70, 0.00),
        sf.fair(l * -0.156, 2.38, 1.88, 0.00),  # bow/mid
        sf.fair(l * -0.020, 2.55, 1.98, 0.00),  # max brick
        sf.fair(l *  0.120, 2.55, 1.98, 0.00),
        sf.fair(l *  0.243, 2.38, 1.86, 0.00),  # mid/stern
        sf.fair(l *  0.360, 2.12, 1.62, 0.00),
        sf.fair(l *  0.458, 1.90, 1.45, 0.00),  # transom
    ]


def _centers(z0, z1, n):
    """n centres equally spaced on [z0, z1] inclusive."""
    if n <= 1:
        return ((z0 + z1) * 0.5,)
    step = (z1 - z0) / float(n - 1)
    return tuple(z0 + step * i for i in range(n))


def _twin_drives(parts, glow, hull_mat, glow_mat, stations, z_stern, detail):
    """Redundant tug drives: two faces, 4 nozzles each, 8 countable."""
    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw_d = max(d_hw * 0.40, 0.58)
    hh_d = max(d_hh * 0.48, 0.48)
    x_off = max(hw_d + 0.08, d_hw * 0.46)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.drive_face(parts, glow, 'heavy.drive.' + tag, hull_mat, glow_mat,
                      (side * x_off, d_yo, z_stern), hw_d, hh_d,
                      nozzles=4, depth=0.58, detail=detail)


def _clamp_frame(parts, mat, stations, z_nose):
    """Massive bow clamp frame. Cheeks, yokes and a forward hoop.

    Every member uses full-extent kit.box and buries >= 0.12 into the
    loft so the island probe reads one body. The fork root sits inside
    the hoop.
    """
    z_fr = z_nose + 0.90
    yo = sf.section(stations, z_fr)[2]
    y_fr = yo

    # Port / starboard cheeks wrap the bow flanks.
    cx, cy, cz = _FRAME_CHEEK
    fx = sf.flank_x(stations, z_fr, y_fr)
    if fx > 0.0:
        x_ch = fx + cx * 0.5 - _BURY
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            kit.box(parts, 'heavy.clamp.cheek.' + tag, kit.ROLE_HULL,
                    (side * x_ch, y_fr, z_fr), (cx, cy, cz), mat)

    # Dorsal / ventral yokes close the frame.
    yx, yy, yz = _FRAME_YOKE
    y_top = sf.top_y(stations, z_fr, 0.0) + yy * 0.5 - _BURY
    y_bot = sf.bottom_y(stations, z_fr, 0.0) - yy * 0.5 + _BURY
    kit.box(parts, 'heavy.clamp.yoke.dk', kit.ROLE_HULL,
            (0.0, y_top, z_fr), (yx, yy, yz), mat)
    kit.box(parts, 'heavy.clamp.yoke.keel', kit.ROLE_HULL,
            (0.0, y_bot, z_fr), (yx, yy, yz), mat)

    # Forward hoop: the fork buries here. Hoop sits on the loft nose.
    hx, hy, hz = _FRAME_HOOP
    z_hoop = z_nose + 0.10
    kit.box(parts, 'heavy.clamp.hoop', kit.ROLE_HULL,
            (0.0, yo, z_hoop), (hx, hy, hz), mat)

    # Side posts tie hoop to cheeks (overlap each host by >= 0.12).
    post = (0.28, 2.10, 0.80)
    z_post = z_nose + 0.42
    fx_p = sf.flank_x(stations, z_post, yo)
    x_p = 0.0
    if fx_p > 0.0:
        x_p = fx_p + post[0] * 0.5 - _BURY
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            kit.box(parts, 'heavy.clamp.post.' + tag, kit.ROLE_HULL,
                    (side * x_p, yo, z_post), post, mat)

    # Open-frame braces: hoop corners to cheek / post. Same member size.
    r_br = max(sf.TRUSS_MEMBER, 0.050)
    if fx > 0.0 and fx_p > 0.0:
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            kit.strut(parts, 'heavy.clamp.brace.dk.' + tag, kit.ROLE_HULL,
                      (side * hx * 0.42, yo + hy * 0.38, z_hoop),
                      (side * x_ch, y_fr + cy * 0.35, z_fr),
                      mat, r_br, vertices=6)
            kit.strut(parts, 'heavy.clamp.brace.keel.' + tag, kit.ROLE_HULL,
                      (side * hx * 0.42, yo - hy * 0.38, z_hoop),
                      (side * x_ch, y_fr - cy * 0.35, z_fr),
                      mat, r_br, vertices=6)
            kit.strut(parts, 'heavy.clamp.brace.post.' + tag, kit.ROLE_HULL,
                      (side * hx * 0.40, yo, z_hoop + hz * 0.20),
                      (side * x_p, yo, z_post),
                      mat, r_br, vertices=6)


def _seam_collar(parts, name, mat, stations, z):
    """Zone-seam hoop. Four boxes stand proud and bite the loft by 0.12."""
    hw0, hh0, yo, _ch = sf.section(stations, z)
    t = _SEAM
    bar = 0.24
    kit.box(parts, name + '.dk', kit.ROLE_HULL,
            (0.0, yo + hh0, z), ((hw0 + 0.06) * 2.0, bar, t), mat)
    kit.box(parts, name + '.keel', kit.ROLE_HULL,
            (0.0, yo - hh0, z), ((hw0 + 0.06) * 2.0, bar, t), mat)
    kit.box(parts, name + '.stbd', kit.ROLE_HULL,
            (hw0, yo, z), (bar, (hh0 + 0.06) * 2.0, t), mat)
    kit.box(parts, name + '.port', kit.ROLE_HULL,
            (-hw0, yo, z), (bar, (hh0 + 0.06) * 2.0, t), mat)


def _mid_frame(parts, mat, stations, tr_zs, detail):
    """Longerons, deck posts and cross ties stitch the dorsal truss run.

    Bottom corners of each bay already bury 0.16 into the brick. Posts
    bite the deck by 0.12 so the extra members stay on the one body.
    """
    if not tr_zs:
        return
    r = max(sf.TRUSS_MEMBER, 0.050)
    hw = sf.TRUSS_CHORD * 0.50
    hh = sf.TRUSS_CHORD * 0.42
    z0, z1 = tr_zs[0], tr_zs[-1]
    y0 = sf.top_y(stations, z0, 0.0) + hh - 0.16
    y1 = sf.top_y(stations, z1, 0.0) + hh - 0.16
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.strut(parts, 'heavy.longeron.' + tag, kit.ROLE_HULL,
                  (side * hw, y0, z0), (side * hw, y1, z1),
                  mat, r, vertices=6)
    n_tie = len(tr_zs) if detail >= 3 else max(1, len(tr_zs) // 2)
    for i, cz in enumerate(tr_zs[:n_tie]):
        y_t = sf.top_y(stations, cz, 0.0) + hh - 0.16
        kit.strut(parts, 'heavy.tie.%d' % i, kit.ROLE_HULL,
                  (-hw, y_t, cz), (hw, y_t, cz),
                  mat, r, vertices=6)
        y_deck = sf.top_y(stations, cz, 0.0) - 0.12
        kit.strut(parts, 'heavy.post.%d' % i, kit.ROLE_HULL,
                  (0.0, y_deck, cz), (0.0, y_t, cz),
                  mat, r, vertices=6)
        if i + 1 >= len(tr_zs):
            continue
        z_b = tr_zs[i + 1]
        y_b = sf.top_y(stations, z_b, 0.0) + hh - 0.16
        kit.strut(parts, 'heavy.truss.diag.%d' % i, kit.ROLE_TRIM,
                  (-hw, y_t, cz), (hw, y_b, z_b),
                  mat, r, vertices=6)


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Lamplighter gate tug (heavy class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 half repeats, 1 primary form, 0 mass only.
    """
    stations = _heavy_stations(l, b, h)

    z_nose = l * -0.310
    z_bow = l * -0.156
    z_mid = l * 0.243
    z_stern = l * 0.458

    # ── Dense brick + redundant drives (detail 0+) ──────────────────────
    kit.hull_loft(parts, 'heavy.brick', kit.ROLE_HULL, stations, hull_mat)
    _twin_drives(parts, glow, hull_mat, glow_mat, stations, z_stern, detail)

    if detail < 1:
        return

    # ── Clamp frame + fork + protected workshop (detail 1+) ─────────────
    _clamp_frame(parts, hull_mat, stations, z_nose)

    yo_n = sf.section(stations, z_nose)[2]
    z_fork = z_nose + 0.18
    sv.gate_fork(parts, 'heavy.fork', hull_mat,
                 (0.0, yo_n + 0.04, z_fork),
                 facing='nose', reach=_FORK_REACH, plane='lr',
                 detail=detail)

    sx = sf.WORKSHOP[0]
    z_ws = l * 0.035
    y_ws = 0.22
    fx_ws = sf.flank_x(stations, z_ws, y_ws)
    if fx_ws > 0.0:
        x_ws = fx_ws - sx * 0.5 + _BURY
        hw.workshop_volume(parts, 'heavy.workshop', hull_mat,
                           (x_ws, y_ws, z_ws), detail=detail)

    if detail < 2:
        return

    # ── Radiators, modules, gantry, truss, lamps, cable (detail 2+) ─────
    z_rad = l * 0.355
    rx, ry = _RAD[0], _RAD[1]
    y_rad = sf.straight_top(stations, z_rad) - ry * 0.28
    fx_rad = sf.flank_x(stations, z_rad, y_rad)
    if fx_rad > 0.0:
        x_rad = fx_rad - rx * 0.5 + _BURY
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            hw.radiator_panel(parts, 'heavy.radiator.' + tag, hull_mat,
                              (side * x_rad, y_rad, z_rad), _RAD,
                              detail=detail)

    _seam_collar(parts, 'heavy.seam.bow', hull_mat, stations, z_bow)
    _seam_collar(parts, 'heavy.seam.mid', hull_mat, stations, z_mid)

    # Yellow access modules. Extra starboard locker is the asymmetry.
    n_mod = 3 if detail >= 3 else 2
    mod_zs = _centers(z_bow + 0.55, z_mid - 0.70, n_mod)
    mx, my = sf.UTILITY_BOX[0], sf.UTILITY_BOX[1]
    for i, cz in enumerate(mod_zs):
        y_m = sf.top_y(stations, cz, 0.80) - my * 0.5 + _BURY
        fx_m = sf.flat_half(stations, cz)
        if fx_m <= 0.0:
            continue
        x_m = fx_m - mx * 0.5 - 0.10
        sv.utility_module(parts, 'heavy.mod.stbd.%d' % i, hull_mat,
                          (x_m, y_m, cz), detail=detail)
        if i < n_mod - 1:
            sv.utility_module(parts, 'heavy.mod.port.%d' % i, hull_mat,
                              (-x_m, y_m, cz), detail=detail)
    # One functional asymmetry: spare starboard locker, no port twin.
    z_as = l * 0.195
    y_as = sf.top_y(stations, z_as, 0.70) - my * 0.5 + _BURY
    fx_as = sf.flat_half(stations, z_as)
    if fx_as > 0.0:
        x_as = fx_as - mx * 0.5 - 0.06
        sv.utility_module(parts, 'heavy.mod.stbd.spare', hull_mat,
                          (x_as, y_as, z_as), detail=detail)

    # One extra workshop locker on the starboard flank. Bites the brick.
    z_lk = l * 0.110
    y_lk = 0.22
    fx_lk = sf.flank_x(stations, z_lk, y_lk)
    if fx_lk > 0.0:
        x_lk = fx_lk - mx * 0.5 + _BURY
        sv.utility_module(parts, 'heavy.mod.workshop', hull_mat,
                          (x_lk, y_lk, z_lk), detail=detail)

    # Walkable gantries: more copies and a longer deck (two pitches).
    n_gan = 4 if detail >= 3 else 2
    gan_len = sf.GANTRY_PITCH * (2 if detail >= 3 else 1)
    gan_zs = _centers(z_bow + 0.70, z_mid - 0.55, n_gan)
    for i, cz in enumerate(gan_zs):
        x_g = 0.58
        y_top = sf.top_y(stations, cz, x_g)
        # Pad bites the brick; thin gantry deck bites the pad.
        kit.box(parts, 'heavy.gantry.pad.%d' % i, kit.ROLE_HULL,
                (x_g, y_top - 0.04, cz),
                (sf.GANTRY_WIDTH, 0.16, gan_len), hull_mat)
        sv.gantry(parts, 'heavy.gantry.%d' % i, hull_mat,
                  (x_g, y_top + 0.02, cz),
                  length=gan_len, detail=detail)

    # Exposed dorsal truss run (open frame, not a plated drum).
    n_tr = 6 if detail >= 3 else 3
    tr_zs = _centers(z_bow + 0.40, z_mid - 0.35, n_tr)
    for i, cz in enumerate(tr_zs):
        y_tr = sf.top_y(stations, cz, 0.0) + sf.TRUSS_CHORD * 0.42 - 0.16
        sv.truss_bay(parts, 'heavy.truss.%d' % i, hull_mat,
                     (0.0, y_tr, cz), detail=detail)
    _mid_frame(parts, hull_mat, stations, tr_zs, detail)

    # Short keel truss run. Bottom longerons bury 0.16 into the brick.
    n_keel = 4 if detail >= 3 else 2
    keel_zs = _centers(z_bow + 0.50, z_mid - 0.50, n_keel)
    for i, cz in enumerate(keel_zs):
        y_k = sf.bottom_y(stations, cz, 0.0) - sf.TRUSS_CHORD * 0.42 + 0.16
        sv.truss_bay(parts, 'heavy.truss.keel.%d' % i, hull_mat,
                     (0.0, y_k, cz), detail=detail)

    # Port open bay: cobalt volume + diagnostic plate.
    bx, by, bz = _BAY
    z_bay = l * -0.015
    y_bay = 0.12
    fx_bay = sf.flank_x(stations, z_bay, y_bay)
    if fx_bay > 0.0:
        x_bay = -(fx_bay - bx * 0.5 + _BURY)
        kit.box(parts, 'heavy.bay.open', kit.ROLE_ARMOUR,
                (x_bay, y_bay, z_bay), (bx, by, bz), hull_mat)
        hw.diag_panel(parts, 'heavy.bay.diag', hull_mat,
                      (x_bay - bx * 0.5 + 0.03, y_bay + 0.18, z_bay),
                      facing='port', detail=detail)

    # Mid-band access lids (one service band, starboard flank).
    z_pg = (z_bow + z_mid) * 0.5
    y_pg = 0.08
    fx_pg = sf.flank_x(stations, z_pg, y_pg)
    if fx_pg > 0.0:
        host = (0.18, 1.55, 3.10)
        loc_pg = (fx_pg - host[0] * 0.5 + 0.05, y_pg, z_pg)
        cols = 6 if detail >= 3 else 3
        rows = 4 if detail >= 3 else 2
        kit.plate_grid(parts, 'heavy.access', kit.ROLE_HULL, loc_pg, host,
                       hull_mat, cols, rows, face='x', depth=0.07, gap=0.08)

    # Cable + ventral reels (plate language: drums under the mid hull).
    z_cab = l * 0.050
    y_cab = 0.55
    fx_cab = sf.flank_x(stations, z_cab, y_cab)
    if fx_cab > 0.0:
        # Tray straddles the flank so the thin hose cannot float.
        kit.box(parts, 'heavy.cable.tray', kit.ROLE_TRIM,
                (fx_cab - 0.06, y_cab, z_cab),
                (0.18, 0.12, 1.70), hull_mat)
        sv.cable_run(parts, 'heavy.cable', hull_mat,
                     (fx_cab - 0.06, y_cab, z_cab),
                     length=1.60, axis='z', detail=detail)

    n_reel = 2 if detail >= 3 else 1
    reel_zs = _centers(l * -0.040, l * 0.110, n_reel)
    for i, cz in enumerate(reel_zs):
        y_r = sf.bottom_y(stations, cz, 0.0) + sf.CABLE_DRUM_R - _BURY
        sv.cable_reel(parts, 'heavy.reel.%d' % i, hull_mat,
                      (0.0, y_r, cz), detail=detail)

    z_dock = l * 0.095
    y_dock = sf.bottom_y(stations, z_dock, 0.0)
    hw.docking_collar(parts, glow, 'heavy.dock', hull_mat, glow_mat,
                      (0.0, y_dock, z_dock), facing='down', detail=detail)

    # One mid band only — both flanks, same z run, HUMAN lamp gap.
    z_lamp = l * 0.048
    y_lamp = 0.38
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        face = 'starboard' if side > 0.0 else 'port'
        fx_l = sf.flank_x(stations, z_lamp, y_lamp)
        if fx_l <= 0.0:
            continue
        x_l = side * (fx_l + sf.LAMP_HOUSING[0] * 0.5 - _BURY)
        hw.lamp_bar(parts, glow, 'heavy.lamps.' + tag,
                    hull_mat, glow_mat, (x_l, y_lamp, z_lamp),
                    count=4, axis='z', facing=face, detail=detail)

    # Pressure-suit rails on both mid deck runs.
    n_rail = 3 if detail >= 3 else 2
    rail_len = 2.20 if detail >= 3 else 1.40
    rail_zs = _centers(z_bow + 0.80, z_mid - 0.60, n_rail)
    for i, cz in enumerate(rail_zs):
        for x_rl, tag in ((-0.70, 'port'), (0.70, 'stbd')):
            y_rl = sf.top_y(stations, cz, x_rl) - _BURY
            sv.access_rail(parts, 'heavy.rail.%s.%d' % (tag, i), hull_mat,
                           (x_rl, y_rl, cz), length=rail_len, axis='z',
                           detail=detail)

    # Small emergency cutter. Secondary. Not a gunship battery.
    z_em = z_nose + 0.55
    y_em = sf.straight_bottom(stations, z_em) + 0.06
    fx_em = sf.flank_x(stations, z_em, y_em)
    if fx_em > 0.0:
        x_em = -(fx_em - _EMERG[0] * 0.5 + _BURY)
        kit.box(parts, 'heavy.emergency', kit.ROLE_HULL,
                (x_em, y_em, z_em), _EMERG, hull_mat)
