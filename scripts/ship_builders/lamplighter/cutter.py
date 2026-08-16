"""Lamplighter Guild Cutter — RELAY TENDER.

Bible §4.10: "A stable workboat with cable reels, diagnostic booms, a
replacement beacon rack, and a forward universal docking collar." Plate
10-lamplighter-guild-ship.png is CONCEPT ART, not a model to copy: soot
service frame, weathered utility-yellow access modules, cobalt
diagnostics, cable drums, a forward collar, clamp arms. This file sculpts
a new escort / workboat. It does not reproduce the capital ring-servicing
monster.

Construction logic is EXPOSED FRAME, utility (synthesis/21 G6). A bigger
Guild ship carries MORE reels / MORE bays / MORE lamps, never bigger
modules. This class refuses a closed plated drum, Assembly radial fans,
Congregation ritual cans and sails, Freehold homestead plates, Ledger
salvage, Beautiful flesh, and Unknowables lace. No nave, no shrine cans,
no shelter sails.

The silhouette is a STABLE WORKBOAT: blocky bow service core, open truss
mid, forward universal collar, gate-arm fork, cable reels, stern tug
drive. Length leads beam.

BODY PLAN
    Chamfered workboat loft (absolute half-extents, never class beam as
    a drum radius) from loft bow to transom. Bow face carries
    ``hw.docking_collar`` (facing nose) plus a diagnostic boom /
    ``hw.diag_panel``. ``sv.gate_fork`` roots bury into that bow frame
    and reach toward −Z. Mid band is a thin spine wrapped by
    ``sv.truss_bay`` copies, 2+ ``sv.cable_reel``, one dorsal
    ``sv.gantry`` service walk, yellow ``sv.utility_module`` boxes, and
    one starboard-offset ``hw.beacon_rack`` (the one functional
    asymmetry). ``sv.cable_run`` and ``sv.access_rail`` dress the walk.
    A few ``hw.work_lamp`` sit at ``sf.LAMP_SPACING``. Stern
    ``hw.drive_face`` uses 4 nozzles. One service band (dorsal mid walk).
    Calm hull on bow and stern skins.

STATIONS (z as fractions of l; half-extents are ABSOLUTE workboat
radii, never a fraction of the class beam 5.28):
    Loft bow at l*-0.318 = -3.498. Transom at l*+0.470 = +5.170 so the
    driver engine glow at l*0.47 sits on the drive face. Drive discs
    stand 0.12 aft of the transom (z ≈ +5.290). Fork jaws sit near
    −5.73. Max core half-beam is 1.02; the fork carries the outline
    out to ~1.21.

ZONES (no service-band run crosses a zone seam):
    bow   l*-0.520 .. l*-0.268   ~25 %  collar, diag boom, fork roots
    mid   l*-0.268 .. l* 0.252   ~52 %  truss, reels, gantry, rack
    stern l* 0.252 .. l* 0.482   ~23 %  drive house

OUTLINE-BREAKER (G2): ``sv.gate_fork`` facing='nose', plane lr.
    Default ``sf.CLAMP_REACH`` = 2.40. Gate: reach ≥ 0.15*l = 1.65.
    2.40 ≥ 1.65 (21.8 % of 11). Grow with ``reach=``. NEVER inflate the
    0.32 hub (Wave 11). Fork loc sits 0.10 aft of the loft bow so the
    0.32 root INTERSECTS the bow frame (≥ 0.16 bury).

EMISSIVE BUDGET (≤ 5 % of hull area, warm lamp only):
    four drive discs; collar status slit; 2–4 work-lamp irises.
    AUTHORED AIM: glow face area ≈ 0.16 against a hull area ≈ 55–75
    (≈ 0.3 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; truss / reel / module / lamp counts halve
    1  loft + collar + fork + reel masses + drive
    0  loft + drive

DENSITY (AUTHORED AIM only — re-derive from measure-ships after bake):
    hull verts 10 000–28 000 (SHIP_SCALE.cutter.hull band 6 000–47 000)
    max span 10.6–11.4 (band [6.60, 15.40], target 11.0)
    len/beam ≥ 1.15; ht/len ≤ 0.60; beam/len ≥ 0.16

Extent budget (absolute ship-space, l=11.0  b=5.28  h=3.30):
    z  min ≈ -5.88 (fork jaws)     max ≈ +5.29 (drive discs)  spanZ ≈ 11.17
    x  min ≈ -1.21 (port fork)     max ≈ +1.21                spanX ≈  2.42
    y  min ≈ -0.88 (reel flange)   max ≈ +0.94 (gantry rail)  spanY ≈  1.82
    spanZ/spanX ≈ 4.62 ≥ 1.15; spanY/spanZ ≈ 0.16 ≤ 0.60;
    spanX/spanZ ≈ 0.22 ≥ 0.16.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import service as sv
from . import hardware as hw


# Absolute repeated-module sizes. Never multiplied by ship l, b or h.
_BAY_N = 4
_BAY_LEN = sf.TRUSS_BAY_LEN
_REEL_BURY = 0.16
_FORK_BURY = 0.10
_BOOM_R = 0.08
_SEAM_T = 0.10


# ===========================================================================
# STATION LIST
# ===========================================================================

def _cutter_stations(l, b, h):
    """Blocky workboat loft. Half-extents are absolute, not class beam.

    ``b`` and ``h`` name the driver envelope (5.28, 3.30). They do not
    scale the core. z tracks class length so the loft fills the cutter
    run under the fork roots and onto the drive face. y_offset 0.0
    throughout: the tender sits on its centreline.

    Loft bow at l*-0.318; transom at l*+0.470. Bow/mid seam at l*-0.268;
    mid/stern seam at l*+0.252.
    """
    # Envelope is recorded so a later measure pass can compare, but the
    # section never uses class beam as a drum radius.
    _ = (b, h)
    return [
        sf.fair(l * -0.318, 1.02, 0.76, 0.0),
        sf.fair(l * -0.268, 0.96, 0.72, 0.0),
        sf.fair(l * -0.140, 0.50, 0.52, 0.0),
        sf.fair(l * 0.040, 0.48, 0.50, 0.0),
        sf.fair(l * 0.252, 0.74, 0.58, 0.0),
        sf.fair(l * 0.370, 0.78, 0.56, 0.0),
        sf.fair(l * 0.470, 0.70, 0.50, 0.0),
    ]


def _bay0_z(l):
    """First truss-bay start, just aft of the bow/mid seam (mid band)."""
    return l * -0.268 + 0.10


def _bay_center_z(l, i):
    return _bay0_z(l) + _BAY_LEN * 0.5 + i * _BAY_LEN


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Lamplighter relay tender (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 loft + collar + fork + reel masses + drive
                0 loft + drive.

    AUTHORED AIM (re-derive from measure-ships after bake):
        detail 3  10 000–28 000 hull verts
        max span 10.6–11.4, len/beam ≥ 1.15, ht/len ≤ 0.60, beam/len ≥ 0.16
        inside SHIP_SCALE.cutter.hull band 6 000–47 000
    """
    H = kit.ROLE_HULL

    stations = _cutter_stations(l, b, h)

    z_loft0 = l * -0.318
    z_bow_s = l * -0.268
    z_mid_s = l * 0.252
    z_stern = l * 0.470
    z_fork = z_loft0 + _FORK_BURY

    # ── Primary workboat loft (always) ───────────────────────────────────
    kit.hull_loft(parts, 'cutter.hull', H, stations, hull_mat)

    # ── DRIVE FACE — transom, 4 countable nozzles (always) ───────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  min(sec_t[0], 0.70), min(sec_t[1], 0.52),
                  nozzles=4, depth=0.50, detail=detail)

    if detail < 1:
        return

    # ── UNIVERSAL COLLAR — bow face, facing the nose (detail 1+) ─────────
    # Mating plane at the loft bow. Barrel buries ≥ 0.12 into the core.
    sec_b = sf.section(stations, z_loft0)
    hw.docking_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      (0.0, sec_b[2], z_loft0),
                      facing='nose', detail=detail)

    # ── GATE-ARM FORK — §G2 outline-breaker (detail 1+) ──────────────────
    # Root 0.10 aft of the loft bow so the 0.32 hub intersects the frame.
    # reach is the default 2.40 (21.8 % of 11) ≥ 1.65. Do not grow the hub.
    sec_f = sf.section(stations, z_fork)
    sv.gate_fork(parts, 'cutter.fork', hull_mat,
                 (0.0, sec_f[2], z_fork),
                 facing='nose', reach=sf.CLAMP_REACH, plane='lr',
                 detail=detail)

    # ── CABLE REELS — keel drums, mid band (detail 1+ masses) ────────────
    # Two always; a third copy at detail 3. Same CABLE_DRUM_* size.
    reel_set = (
        ('fwd', 0.0, l * -0.140),
        ('mid', 0.0, l * 0.020),
        ('aft', 0.0, l * 0.160),
    )
    n_reel = 3 if detail >= 3 else 2
    for tag, rx, zz in reel_set[:n_reel]:
        if zz <= z_bow_s or zz >= z_mid_s:
            continue
        by = sf.bottom_y(stations, zz, rx)
        sv.cable_reel(parts, 'cutter.reel.' + tag, hull_mat,
                      (rx, by + _REEL_BURY, zz),
                      detail=detail)

    if detail < 2:
        return

    # ── TRUSS BAYS — open mid frame, same TRUSS_* size (detail 2+) ───────
    bay_idx = range(_BAY_N) if detail >= 3 else (0, 2)
    for i in bay_idx:
        cz = _bay_center_z(l, i)
        if cz <= z_bow_s or cz >= z_mid_s:
            continue
        sec = sf.section(stations, cz)
        sv.truss_bay(parts, 'cutter.truss.%02d' % i, hull_mat,
                     (0.0, sec[2], cz),
                     detail=detail)

    # ── ZONE SEAM BANDS — visible joints, mid of each seam (detail 2+) ───
    for tag, zz in (('bow', z_bow_s), ('mid', z_mid_s)):
        hw2, hh2, yo, _ch = sf.seam_ring(stations, zz, over=0.06)
        kit.box(parts, 'cutter.seam.' + tag, H,
                (0.0, yo, zz),
                (hw2 * 2.0, hh2 * 2.0, _SEAM_T),
                hull_mat)

    # ── DORSAL GANTRY — the one service band (detail 2+) ─────────────────
    # Length ~2.70 is 24.5 % of l (inside the 20–30 % service-band window).
    z_g = l * -0.010
    if z_bow_s < z_g < z_mid_s:
        ty_g = sf.top_y(stations, z_g)
        gantry_len = sf.GANTRY_PITCH * (3 if detail >= 3 else 2)
        sv.gantry(parts, 'cutter.gantry', hull_mat,
                  (0.0, ty_g - 0.03, z_g),
                  length=gantry_len, detail=detail)
        sv.access_rail(parts, 'cutter.rail', hull_mat,
                       (-0.20, ty_g, z_g),
                       length=gantry_len - 0.30, axis='z',
                       detail=detail)
        sv.cable_run(parts, 'cutter.cables', hull_mat,
                     (0.16, ty_g - 0.06, z_g),
                     length=gantry_len - 0.40, axis='z',
                     detail=detail)

        # Work lamps at HUMAN lamp gap 1.20. Two at detail 2, three at 3.
        # Housing half-height is 0.07; sit it on the gantry so the island
        # probe does not treat a 0.02 air gap as a separate body.
        lamp_n = 3 if detail >= 3 else 2
        span = sf.LAMP_SPACING * (lamp_n - 1)
        lamp_zs = tuple(
            z_g - span * 0.5 + i * sf.LAMP_SPACING
            for i in range(lamp_n)
        )
        y_lp = ty_g + 0.02
        for i, lz in enumerate(lamp_zs):
            if lz <= z_bow_s or lz >= z_mid_s:
                continue
            hw.work_lamp(parts, glow, 'cutter.lamp.%d' % i,
                         hull_mat, glow_mat, (0.0, y_lp, lz),
                         facing='down', detail=detail)

    # ── YELLOW UTILITY MODULES — mid flanks (detail 2+) ──────────────────
    # Same UTILITY_BOX size. Half count at detail 2.
    modules = (
        ('stbd', 1.0, l * -0.080),
        ('port', -1.0, l * 0.080),
    )
    n_mod = 2 if detail >= 3 else 1
    box_hx = sf.UTILITY_BOX[0] * 0.5
    for tag, side, zz in modules[:n_mod]:
        if zz <= z_bow_s or zz >= z_mid_s:
            continue
        y_m = 0.06
        fx = sf.flank_x(stations, zz, y_m)
        if fx <= 0.12:
            continue
        cx = side * (fx - box_hx + 0.18)
        sv.utility_module(parts, 'cutter.util.' + tag, hull_mat,
                          (cx, y_m, zz),
                          detail=detail)

    # ── BEACON RACK — starboard mid offset, the one asymmetry ────────────
    z_rk = l * 0.140
    if z_bow_s < z_rk < z_mid_s:
        x_rk = 0.22
        ty_rk = sf.top_y(stations, z_rk, x_rk)
        hw.beacon_rack(parts, 'cutter.beacons', hull_mat,
                       (x_rk, ty_rk + 0.04, z_rk),
                       count=4, detail=detail)

    # ── DIAGNOSTIC BOOM + PANEL — bow, intersects the core (detail 2+) ───
    z_bm = l * -0.292
    if z_bm < z_bow_s:
        y_bm = 0.18
        fx_bm = sf.flank_x(stations, z_bm, y_bm)
        if fx_bm > 0.16:
            root = (fx_bm - 0.14, y_bm, z_bm)
            tip = (fx_bm + 0.12, y_bm + 0.10, z_loft0 - 0.40)
            kit.strut(parts, 'cutter.diag.boom', kit.ROLE_HULL,
                      root, tip, hull_mat, _BOOM_R, vertices=8)
            hw.diag_panel(parts, 'cutter.diag', hull_mat, tip,
                          facing='starboard', detail=detail)
