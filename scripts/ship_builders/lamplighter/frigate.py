"""Lamplighter Guild Frigate — NETWORK REPAIR SHIP.

Bible §4.10: "A compact mobile depot with multiple work bays, long crane
rails, relay control tower, spare modules, and tug berths. It coordinates
a repair operation rather than dominating a battle." Construction logic
is EXPOSED FRAME, utility. MORE bays and spare modules of the SAME size,
never bigger copies. Plate 10-lamplighter-guild-ship.png is CONCEPT ART.
This class is a depot, not a gun frigate.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; authored largest-dimension target ≈ 32.0
(fork jaw to drive face). Hull vertex band [16 000, 84 000].
lod0 triangle cap 60 000. Engine glow at l*0.47.
Proportions 1.15 / 0.60 / 0.16 (length-leads-beam, height/length,
beam/length).

BODY PLAN
    A slim soot service spine is the connective loft. The silhouette is
    MOBILE DEPOT: a mid-band depot floor, long crane-rail gantries on
    the outboard lips, a 2–3 bay ``sv.truss_bay`` work row, spare
    yellow ``sv.utility_module``s on the port and starboard racks, a
    tall ``hw.relay_mast`` control tower, and a starboard-only tug
    berth. Bow tools are ``hw.docking_collar`` plus the §G2
    ``sv.gate_fork``. Stern is a 6-nozzle ``hw.drive_face`` GRID and a
    §G3 ``hw.radiator_panel`` pair. One mid service band holds lamp
    bars at ``sf.LAMP_SPACING``, beacon racks, diag panels and access
    rails. Beam comes from the depot floor and outboard gear, not from
    the fork (the fork reaches along −Z).

STATIONS (z as fractions of l; half-extents are ABSOLUTE spine radii,
never the class beam — crane rails, floor and berth break the outline):
    Loft nose at l*-0.385 = -12.320; transom at l*0.470 = +15.040.
    Drive loc at l*0.470 = +15.040 (engine glow).
    Authored fork-jaw ≈ -17.25; drive face ≈ +15.16; spanZ ≈ 32.4.
    Authored depot floor spanX = 8.40; beam/len ≈ 0.26.
    Bow/mid seam at l*-0.215 = -6.880;
    mid/stern seam at l*+0.220 = +7.040.
    Spine half-beam 0.70 → 1.22 → 0.90; half-height 0.42 → 0.62 → 0.52.

ZONES (no work-bay run crosses a seam):
    bow   loft-nose .. l*-0.215     ~19.9 % of loft  (collar + fork + tower)
    mid   l*-0.215 .. l*+0.220      ~50.9 %          (bays, rails, berth)
    stern l*+0.220 .. drive         ~29.2 %          (drive + radiators)

OUTLINE-BREAKER (§G2): ``sv.gate_fork`` at the bow. Grow with ARM LENGTH.
    need  = 0.15 * 32.0 = 4.80
    pass  reach=5.60  (hub stays the construct's 0.32 cube)
    mix   = 0.40 ⇒ |d_z| = 1 / sqrt(1 + 0.40**2) ≈ 0.928
    Z reach ≈ 5.20 ≥ 4.80. Never inflate the shoulder hub.

G3
    ``hw.radiator_panel`` pair, flat, no fins: size (0.16, 2.00, 3.20),
    port and starboard stern flanks, buried >= 0.12.
    ``hw.drive_face`` 6 countable nozzles on a soot housing. No
    ``kit.engine_bank``.

G5
    Starboard mid tug berth. Cradle pad sits in the depot floor and a
    keel strut pierces the spine flank. Nested light-scale service pod
    (``hw.workshop_volume`` + a small chamfer / taper block +
    ``sv.utility_module``) INTERSECTS the pad. A nest wholly inside a
    wall box would float (island probe).

EMISSIVE BUDGET (<= 5 % of hull area):
    Drive discs, one mid lamp bar, collar mark. No edge-lit panels.
    AUTHORED AIM: emissive ~= 1.2 %.

DETAIL LADDER
    3  full: every construct, full bays / modules / lamps / rails
    2  half repeats; bays, tower, fork, berth, radiators stay
    1  loft + tower + fork + bays + floor + drive (+ rad, collar, berth)
    0  loft + drive
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import service as sv
from . import hardware as hw


_OVERLAP = 0.12
_FORK_REACH = 5.60
_TOWER_H = 4.80
_BAY_LEN = sf.TRUSS_BAY_LEN
# Mid depot floor is the authored beam. 8.40 / 32.4 ≈ 0.26.
_DECK_BEAM = 8.40
_DECK_T = 0.32


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, _b, _h):
    """Outer spine envelope for queries. Slim service keel, not the beam.

    Half-extents are absolute world units. Depot floor, crane rails and
    berth break the outline. Nose at l*-0.385; transom at l*0.470.
    """
    return [
        sf.fair(l * -0.385, 0.70, 0.42, 0.0),
        sf.fair(l * -0.330, 0.88, 0.50, 0.0),
        sf.fair(l * -0.215, 1.05, 0.56, 0.0),
        sf.fair(l * -0.080, 1.18, 0.60, 0.0),
        sf.fair(l *  0.040, 1.22, 0.62, 0.0),
        sf.fair(l *  0.140, 1.18, 0.60, 0.0),
        sf.fair(l *  0.220, 1.08, 0.56, 0.0),
        sf.fair(l *  0.320, 0.98, 0.54, 0.0),
        sf.fair(l *  0.400, 1.05, 0.58, 0.0),
        sf.fair(l *  0.470, 0.90, 0.52, 0.0),
    ]


# ===========================================================================
# COUNTS AND SPANS
# ===========================================================================

def _n(detail, full, half=None, low=None, mass=None):
    if half is None:
        half = max(1, int(full) // 2)
    if low is None:
        low = max(1, int(full) // 3)
    if mass is None:
        mass = max(1, int(full) // 4)
    if detail >= 3:
        return int(full)
    if detail == 2:
        return int(half)
    if detail == 1:
        return int(low)
    return int(mass)


def _fill_span(z0, z1, n, overlap=_OVERLAP):
    """Return (bay_length, centres) that fill [z0, z1] with overlap >= 0.10."""
    n = max(1, int(n))
    span = z1 - z0
    if n == 1:
        return span, ((z0 + z1) * 0.5,)
    bay = (span - overlap) / float(n) + overlap
    if bay < 0.40:
        bay = 0.40
    pitch = bay - overlap
    cz0 = z0 + bay * 0.5
    return bay, tuple(cz0 + i * pitch for i in range(n))


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Lamplighter network repair ship (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full  2 half repeats
                1 loft + tower + fork + bays + drive
                0 loft + drive.

    AUTHORED AIM only (no bake in this file):
        spanZ ≈ 32.4; spanX ≈ 8.4; verts 16 000–84 000; glow at l*0.47
        len/beam >= 1.15; ht/len <= 0.60; beam/len ≈ 0.26 (>= 0.16)
        G2 reach=5.60 (>= 4.80); G5 nested berth pierces the pad
    """
    H = kit.ROLE_HULL

    stations = _frigate_stations(l, b, h)

    z_loft0 = l * -0.385
    z_bow_s = l * -0.215
    z_mid_s = l * 0.220
    z_trans = l * 0.470
    z_drive = l * 0.470

    z_fork = l * -0.368
    z_collar = z_loft0 + 0.04
    z_tower = l * -0.280
    z_berth = l * 0.020
    z_rad = l * 0.340
    z_lamp = l * -0.020
    z_crane = l * 0.000

    # ── SERVICE SPINE LOFT (always). ─────────────────────────────────────
    kit.hull_loft(parts, 'frigate.spineloft', H, stations, hull_mat)

    # ── DRIVE FACE (always): 6 countable nozzles. Glow at l*0.47. ────────
    d_w, d_h, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_drive), max(d_w, 0.72), max(d_h, 0.58),
                  nozzles=6, depth=0.55, detail=detail)

    if detail < 1:
        return

    # ── §G2 GATE FORK (detail 1+): reach grows, hub stays small. ──────────
    yo_fk = sf.section(stations, z_fork)[2]
    sv.gate_fork(parts, 'frigate.fork', hull_mat,
                 (0.0, yo_fk, z_fork), facing='nose',
                 reach=_FORK_REACH, plane='lr', detail=detail)
    # Shoulder root must pierce the loft (island probe).
    kit.box(parts, 'frigate.fork.root-bury', H,
            (0.0, yo_fk, z_fork + 0.18),
            (0.46, 0.36, 0.50), hull_mat)

    # ── RELAY CONTROL TOWER (detail 1+): tall mast on a buried cabin. ────
    _tower(parts, hull_mat, stations, z_tower, detail)

    # ── WORK BAYS (detail 1+): 3 truss bays in the mid row. ───────────────
    n_work = 3 if detail >= 2 else 2
    z_bay0 = z_bow_s + 0.35
    z_bay1 = z_mid_s - 0.55
    _, work_zs = _fill_span(z_bay0, z_bay1, n_work)
    for i, cz in enumerate(work_zs):
        yo = sf.section(stations, cz)[2]
        sv.truss_bay(parts, 'frigate.work.%d' % i, hull_mat,
                     (0.0, yo, cz), detail=detail)
        # Walk deck under the open bay. Full depot beam, bites the loft.
        kit.box(parts, 'frigate.work.%d.deck' % i, H,
                (0.0, _deck_y(stations, cz), cz),
                (_DECK_BEAM, _DECK_T, _BAY_LEN + 0.20), hull_mat)
        if i == 0 or detail >= 2:
            hw.workshop_volume(parts, 'frigate.work.%d.shop' % i, hull_mat,
                               (0.0, yo + 0.08, cz), detail=detail)

    # ── DEPOT FLOOR (detail 1+): mid-band beam. Ties bays to the loft. ──
    _depot_floor(parts, hull_mat, stations, z_bow_s, z_mid_s)

    # ── §G3 RADIATORS (detail 1+): flat pair, buried >= 0.12. ─────────────
    rad_y = sf.section(stations, z_rad)[2]
    rad_fx = sf.flank_x(stations, z_rad, rad_y)
    if rad_fx <= 0.0:
        rad_fx = sf.section(stations, z_rad)[0]
    rad_size = (0.16, 2.00, 3.20)
    rad_x = rad_fx + rad_size[0] * 0.5 - 0.12
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'frigate.rad.%s' % tag, hull_mat,
                          (side * rad_x, rad_y, z_rad),
                          rad_size, detail=detail)

    # ── BOW COLLAR (detail 1+): fleet-diameter, buried into the nose. ────
    hw.docking_collar(parts, glow, 'frigate.collar', hull_mat, glow_mat,
                      (0.0, sf.section(stations, z_collar)[2], z_collar),
                      facing='nose', detail=detail)

    # ── §G5 TUG BERTH (detail 1+): starboard only. Pad pierces flank. ────
    _tug_berth(parts, hull_mat, stations, z_berth, detail)

    # ── ZONE SEAM COLLARS (detail 1+): visible bay-to-bay joints. ─────────
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        hw2, hh2, yo2, _ = sf.seam_ring(stations, zs, over=0.06)
        kit.box(parts, 'frigate.seam.%s' % tag, H,
                (0.0, yo2, zs),
                (hw2 * 2.0, hh2 * 2.0, 0.18), hull_mat)

    if detail < 2:
        return

    # ── FRAME TRUSSES (detail 2+): MORE bays, same module, no seam cross. ─
    n_frame = _n(detail, 6, 3, 0, 0)
    if n_frame > 0:
        _, frame_zs = _fill_span(z_bow_s + 0.20, z_mid_s - 0.20, n_frame)
        for i, cz in enumerate(frame_zs):
            near_work = any(abs(cz - wz) < _BAY_LEN * 0.55 for wz in work_zs)
            if near_work:
                continue
            yo = sf.section(stations, cz)[2]
            sv.truss_bay(parts, 'frigate.frame.%d' % i, hull_mat,
                         (0.0, yo, cz), detail=detail)

    # ── LONG CRANE-RAIL GANTRIES (detail 2+). ────────────────────────────
    _crane_rails(parts, hull_mat, stations, z_crane, z_bow_s, z_mid_s, detail)

    # ── SPARE YELLOW MODULES (detail 2+): same UTILITY_BOX, more copies. ─
    n_mod = _n(detail, 6, 3, 0, 0)
    _, mod_zs = _fill_span(z_bow_s + 0.55, z_mid_s - 0.80, max(n_mod, 1))
    sx, sy, _sz = sf.UTILITY_BOX
    # Outboard racks sit on the depot floor. Port always; starboard skips
    # the tug-berth z run so the pad and the modules stay one body.
    x_rack = _DECK_BEAM * 0.5 - sx * 0.42
    for i, cz in enumerate(mod_zs[:n_mod]):
        plat_top = _deck_y(stations, cz) + _DECK_T * 0.5
        y_mod = plat_top + sy * 0.5 - 0.16
        sv.utility_module(parts, 'frigate.spare.port.%d' % i, hull_mat,
                          (-x_rack, y_mod, cz), detail=detail)
        if abs(cz - z_berth) > 1.70:
            sv.utility_module(parts, 'frigate.spare.stbd.%d' % i, hull_mat,
                              (x_rack, y_mod, cz), detail=detail)

    # ── ONE MID SERVICE BAND (detail 2+): lamps, rails, racks. ───────────
    lamp_y = sf.top_y(stations, z_lamp, 0.0)
    kit.box(parts, 'frigate.lamps.rail', H,
            (0.0, lamp_y - 0.03, z_lamp),
            (0.30, 0.12, 5.20), hull_mat)
    hw.lamp_bar(parts, glow, 'frigate.lamps', hull_mat, glow_mat,
                (0.0, lamp_y + 0.08, z_lamp), count=5, axis='z',
                facing='down', detail=detail)
    sv.access_rail(parts, 'frigate.band.rail', hull_mat,
                   (0.22, lamp_y - 0.08, z_lamp), length=4.80, axis='z',
                   detail=detail)

    n_rack = _n(detail, 2, 1, 0, 0)
    for i in range(n_rack):
        rz = z_lamp + (i - 0.5) * 2.20
        deck = sf.top_y(stations, rz, 0.0)
        hw.beacon_rack(parts, 'frigate.beacon.%d' % i, hull_mat,
                       (0.0, deck + 0.02, rz), count=4, detail=detail)

    # ── CABLE REELS + RUN (detail 2+): mid-band only. ────────────────────
    z_reel = l * -0.090
    keel_r = sf.bottom_y(stations, z_reel, 0.0)
    sv.cable_reel(parts, 'frigate.reel.0', hull_mat,
                  (0.18, keel_r + sf.CABLE_DRUM_R - 0.06, z_reel),
                  detail=detail)
    if detail >= 3:
        sv.cable_reel(parts, 'frigate.reel.1', hull_mat,
                      (-0.18, keel_r + sf.CABLE_DRUM_R - 0.06, z_reel + 0.90),
                      detail=detail)
    sv.cable_run(parts, 'frigate.hose', hull_mat,
                 (0.0, keel_r + 0.02, z_lamp),
                 length=4.40, axis='z', detail=detail)

    if detail < 3:
        return

    # ── DIAG PANELS + TOOL PODS (detail 3): mid band / tower cheek. ──────
    z_diag = l * -0.160
    dy = sf.straight_top(stations, z_diag) - 0.06
    dx = sf.flank_x(stations, z_diag, dy)
    if dx > 0.0:
        hw.diag_panel(parts, 'frigate.diag.port', hull_mat,
                      (-dx + 0.01, dy, z_diag), facing='port',
                      detail=detail)
        hw.diag_panel(parts, 'frigate.diag.stbd', hull_mat,
                      (dx - 0.01, dy, z_diag), facing='starboard',
                      detail=detail)

    n_pod = 4
    _, pod_zs = _fill_span(z_bow_s + 0.80, z_mid_s - 1.10, n_pod)
    for i, cz in enumerate(pod_zs):
        deck = sf.top_y(stations, cz, 0.18)
        hw.tool_pod(parts, 'frigate.tool.%d' % i, hull_mat,
                    (0.28, deck + sf.TOOL_POD[1] * 0.5 - 0.08, cz),
                    detail=detail)


def _tower(parts, hull_mat, stations, z_tower, detail):
    """Relay control tower. Cabin buries into the deck; mast is tall."""
    H = kit.ROLE_HULL
    deck = sf.top_y(stations, z_tower, 0.0)
    cabin_h = 0.90
    cabin_c = (0.0, deck + cabin_h * 0.5 - 0.22, z_tower)
    kit.box(parts, 'frigate.tower.cabin', H, cabin_c,
            (0.78, cabin_h, 0.86), hull_mat)
    kit.box(parts, 'frigate.tower.deck', kit.ROLE_ACCENT,
            (0.0, cabin_c[1] + cabin_h * 0.5 + 0.04, z_tower),
            (0.96, 0.08, 1.00), hull_mat)
    mast_base = (0.0, cabin_c[1] + cabin_h * 0.5, z_tower)
    hw.relay_mast(parts, 'frigate.tower', hull_mat, mast_base,
                  height=_TOWER_H, detail=detail)
    if detail >= 2:
        hw.diag_panel(parts, 'frigate.tower.panel', hull_mat,
                      (0.36, cabin_c[1] + 0.10, z_tower),
                      facing='starboard', detail=detail)
        sv.access_rail(parts, 'frigate.tower.rail', hull_mat,
                       (0.30, deck - 0.08, z_tower), length=0.90, axis='z',
                       detail=detail)


def _deck_y(stations, z):
    """Centre y of the mid depot floor at station z."""
    return sf.bottom_y(stations, z, 0.0) + 0.06


def _depot_floor(parts, hull_mat, stations, z_bow_s, z_mid_s):
    """One mid-band walk plate. This plate is the authored beam."""
    H = kit.ROLE_HULL
    z0 = z_bow_s + 0.12
    z1 = z_mid_s - 0.20
    cz = (z0 + z1) * 0.5
    length = z1 - z0
    dy = _deck_y(stations, cz)
    kit.box(parts, 'frigate.depot.floor', H,
            (0.0, dy, cz),
            (_DECK_BEAM, _DECK_T, length), hull_mat)
    # Outboard lips give the crane rails a thick wall to bite.
    lip_x = _DECK_BEAM * 0.5 - 0.11
    for tag, side in (('port', -1.0), ('stbd', 1.0)):
        kit.box(parts, 'frigate.depot.lip.%s' % tag, H,
                (side * lip_x, dy + 0.12, cz),
                (0.22, 0.40, length - 0.40), hull_mat)
    # Spars run through the loft and down into the floor.
    for i, pz in enumerate((z0 + 0.80, cz, z1 - 0.80)):
        yo = sf.section(stations, pz)[2]
        fy = _deck_y(stations, pz)
        yc = (yo + fy) * 0.5
        yh = abs(yo - fy) + 0.22
        kit.box(parts, 'frigate.depot.spar.%d' % i, H,
                (0.0, yc, pz),
                (_DECK_BEAM - 0.28, yh, 0.42), hull_mat)


def _crane_rails(parts, hull_mat, stations, z_crane, z_bow_s, z_mid_s, detail):
    """Two long walkable crane rails on the outboard depot lips."""
    H = kit.ROLE_HULL
    length = min(z_mid_s - z_bow_s - 1.10, 10.40)
    length = max(length, 4.80)
    dy = _deck_y(stations, z_crane)
    plat_top = dy + _DECK_T * 0.5
    # Rails sit on the floor lips. Outer face ≈ ±4.24 (spanX ≈ 8.48).
    rail_x = _DECK_BEAM * 0.5 - sf.GANTRY_WIDTH * 0.5 + 0.04
    rail_y = plat_top - 0.04
    for tag, side in (('port', -1.0), ('stbd', 1.0)):
        sv.gantry(parts, 'frigate.crane.low.%s' % tag, hull_mat,
                  (side * rail_x, rail_y, z_crane),
                  length=length, detail=detail)
    # Overhead crane beam on posts that pierce floor and rails.
    crane_y = plat_top + 1.40
    sv.gantry(parts, 'frigate.crane.over', hull_mat,
              (0.0, crane_y, z_crane), length=length, detail=detail)
    kit.box(parts, 'frigate.crane.cross', H,
            (0.0, crane_y, z_crane),
            (_DECK_BEAM - 0.20, 0.16, 0.22), hull_mat)
    half = length * 0.5
    post_h = crane_y - dy + 0.20
    post_y = (dy + crane_y) * 0.5
    for i, pz in enumerate((z_crane - half + 0.20, z_crane,
                            z_crane + half - 0.20)):
        for tag, side in (('c', 0.0), ('p', -1.0), ('s', 1.0)):
            px = 0.0 if tag == 'c' else side * rail_x
            kit.box(parts, 'frigate.crane.post.%s.%d' % (tag, i), H,
                    (px, post_y, pz),
                    (0.16, post_h, 0.16), hull_mat)


def _tug_berth(parts, hull_mat, stations, z_berth, detail):
    """Open starboard cradle. Pad pierces the flank. Pod intersects pad."""
    H = kit.ROLE_HULL
    half_w, _half_h, yo, _ = sf.section(stations, z_berth)
    fx = sf.flank_x(stations, z_berth, yo)
    if fx <= 0.0:
        fx = half_w

    # Cradle pad MUST run through the flank and the depot floor (G5).
    dy = _deck_y(stations, z_berth)
    pad_x = _DECK_BEAM * 0.5 - 1.00
    pad_y = dy
    kit.box(parts, 'frigate.berth.pad', H,
            (pad_x, pad_y, z_berth),
            (2.40, _DECK_T, 2.60), hull_mat)
    kit.box(parts, 'frigate.berth.keel-strut', H,
            ((fx + pad_x) * 0.5, (yo + pad_y) * 0.5, z_berth),
            (pad_x - fx + 0.50, abs(yo - pad_y) + 0.28, 0.70), hull_mat)
    kit.box(parts, 'frigate.berth.cheek', kit.ROLE_RECESS,
            (fx + 0.22, yo - 0.08, z_berth),
            (0.36, 0.70, 1.80), hull_mat)

    # Light-scale service pod. Chamfered body + workshop + yellow box
    # all bite the pad (island probe: nested shells must intersect).
    # Pad half-h is _DECK_T/2. Body half-h 0.26 around y_c so the belly
    # sits at y_c-0.26 and overlaps the pad slab.
    y_c = pad_y + 0.18
    kit.chamfer_block(parts, 'frigate.berth.pod.body', H,
                      (pad_x, y_c, z_berth),
                      (0.88, 0.52, 1.55), hull_mat, chamfer=0.10)
    kit.taper_block(parts, 'frigate.berth.pod.nose', H,
                    (pad_x, y_c, z_berth - 0.85),
                    (0.62, 0.38, 0.55), hull_mat,
                    front=(0.45, 0.55), back=(1.0, 1.0))
    hw.workshop_volume(parts, 'frigate.berth.pod.shop', hull_mat,
                       (pad_x + 0.10, y_c + 0.16, z_berth),
                       detail=detail)
    sv.utility_module(parts, 'frigate.berth.pod.cab', hull_mat,
                      (pad_x - 0.15, y_c + 0.08, z_berth + 0.20),
                      detail=detail)
    kit.box(parts, 'frigate.berth.cradle', H,
            (pad_x, pad_y + 0.14, z_berth),
            (0.70, 0.16, 0.90), hull_mat)
    if detail >= 2:
        kit.box(parts, 'frigate.berth.pod.keel', H,
                (pad_x, pad_y + 0.06, z_berth - 0.10),
                (0.48, 0.20, 1.10), hull_mat)
        hw.tool_pod(parts, 'frigate.berth.pod.tool', hull_mat,
                    (pad_x + 0.35, y_c + 0.30, z_berth - 0.25),
                    detail=detail)
