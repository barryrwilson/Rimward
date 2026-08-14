"""Red Ledger Light - ACCOUNT RUNNER.

Bible §4.4: "a lean spotter with a narrow predatory nose, oversized comms
receiver, hidden weapon shutters, and one external lockbox for contracts or
payment."

Three zones with cut-and-welded seams between them:
  BOW   22 %  z -3.50 -> -1.97  hard faceted needle all-hard_section; armoured
                                  brow over a two-pane cockpit; shutter-well
                                  pair on both flanks (closed, hidden threat);
                                  plate quilt both flanks bow-to-seam (rows=6,
                                  pitch=0.50); dried-red stripe cluster (5 bars)
                                  PORT prow flank.
  MID   50 %  z -1.97 -> +1.54  captured armoured body, wider at both seams;
                                  oversized comms dish (face tilted 30 deg from
                                  Z toward +Y so it reads from the side) on a
                                  small ROLE_HULL cradle, offset to PORT;
                                  plate quilt both flanks bow/mid seam to mid/
                                  stern seam (rows=10, pitch=0.50) + keel
                                  underside quilt (rows=4, pitch=0.50); dried-
                                  red stripe cluster (7 bars) PORT only; amber
                                  slit rows low on both flanks; belly lamp run;
                                  one LOCKBOX belly STARBOARD; Veridian stolen
                                  sensor bolted beside the dish.
  STERN 28 %  z +1.54 -> +3.12  plate quilt both flanks (rows=8, pitch=0.50)
                                  + aft deck quilt (rows=5, pitch=0.50); one
                                  2-nozzle captured drive (adapter collar and
                                  housing both overlapping hull body); flat
                                  radiator panels both flanks.

Quilt coverage: ALL visible flank faces bow-to-stern (three zones each side)
  plus the aft deck and the mid-zone keel belly.  role_mix=(0.55, 0.36, 0.09)
  on all runs: iron dominant, weathered-salvage gives patchwork read, recess
  reads as recessed seam gaps.  LOD: detail=1 coarse (1 row, 2x pitch);
  detail=2 half rows at 1.4x pitch; detail=3 full density.

Accent area: mid cluster 7 bars h=0.65 w=0.34 = 1.55 u^2; bow cluster 5 bars
  h=0.40 w=0.34 = 0.68 u^2; total 2.23 u^2 on hull area ~32 u^2 => ~7.0 pct.
  Both clusters PORT only; fleet asymmetry deliberate.

Silhouette family: WEDGE primary, SPINE-AND-PODS secondary.
Construction logic: EXPOSED FRAME, SALVAGE - cut-and-welded seams; CAPTURED
  PARTS OF OTHER FACTIONS BOLTED ON.

Donor parts carried:
  - One Veridian Combine instrument head (sensor aperture facing -Z) bolted
    to the PORT dorsal flat beside the dish; two weld_straps + one cut_edge.

Salvage boom: one sv.salvage_boom under and forward of the bow, root buried
  in the bow hull, jaws below and ahead of the nose tip.  Boom root-to-tip
  distance ~1.09 units = ~14 % of l = 7.8.

Deliberate asymmetry: dish and Veridian head offset to PORT; LOCKBOX and
  shutter wells slightly offset to STARBOARD.

Extent budget (l=7.8  b=l*0.42=3.276  h=l*0.24=1.872 nominal inputs):
  z  min = -3.84 (boom tip)  max = +3.30 (nozzle tip)  spanZ = 7.1 measured
  x  min = -0.92  max = +0.92  spanX = 1.85  (hull mid half-beam)
  y  lockbox belly -> dish crown  spanY = 2.56 measured
  spanZ/spanX = 3.83 >= 3.30  spanY/spanZ = 0.36 <= 0.42  (measured)

Measured (build, compress, measure, probe; all gates PASS):
  verts = 19072   span = 7.1
  len/beam = 3.83   ht/len = 0.36   beam/len = 0.26
  proxy cover = 100.0 %
  triangles:  lod0 = 9956   lod1 = 3256   lod2 = 1204
  probe-ship-islands light lod0:  ONE CONNECTED BODY
  produced by:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P scripts/build-ship-assets.py -- redledger
    node scripts/compress-ship-assets.mjs redledger
    node scripts/measure-ships.mjs redledger
    node scripts/probe-ship-islands.mjs redledger light lod0
"""
import sys
import math
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import hardware as hw
from . import salvage as sv
from . import donors as dn


# ===========================================================================
# STATION LIST
# ===========================================================================

def _light_stations(l, b, h):
    """Hull loft stations for the account runner.

    All hard_section throughout so every silhouette reads as hard-chined
    faceted plate — no faired consumer hull curves.

    Nose at l*-0.449 = -3.502; hull transom at l*0.400 = +3.120.
    Bow/mid seam at l*-0.252 = -1.966; mid/stern seam at l*+0.197 = +1.537.
    """
    return [
        # -- BOW: predatory narrow needle, hard-section all the way --
        sf.hard_section(l * -0.449, b * 0.006, h * 0.025, 0.0),  # nose tip
        sf.hard_section(l * -0.415, b * 0.038, h * 0.095, 0.0),
        sf.hard_section(l * -0.370, b * 0.088, h * 0.175, 0.0),
        sf.hard_section(l * -0.310, b * 0.150, h * 0.238, 0.0),
        sf.hard_section(l * -0.252, b * 0.210, h * 0.290, 0.0),  # bow/mid seam

        # -- MID: captured armoured body, steps wider at both seams --
        sf.hard_section(l * -0.251, b * 0.245, h * 0.316, 0.0),  # step at bow seam
        sf.hard_section(l * -0.100, b * 0.282, h * 0.316, 0.0),  # max half-beam
        sf.hard_section(l *  0.000, b * 0.278, h * 0.310, 0.0),
        sf.hard_section(l *  0.100, b * 0.262, h * 0.300, 0.0),
        sf.hard_section(l *  0.197, b * 0.236, h * 0.285, 0.0),  # mid/stern seam

        # -- STERN: slightly squatter, drive housing overlaps here --
        sf.hard_section(l *  0.198, b * 0.252, h * 0.302, 0.0),  # step at stern seam
        sf.hard_section(l *  0.340, b * 0.223, h * 0.278, 0.0),
        sf.hard_section(l *  0.400, b * 0.188, h * 0.248, 0.0),  # hull transom
    ]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Red Ledger account-runner (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (7.8, 3.276, 1.872).
    detail   -- 3 full  2 fewer repeats  1 primary + seams + plates + boom
                0 primary masses only (hull loft).
    """
    H = kit.ROLE_HULL
    A = kit.ROLE_ARMOUR

    stations = _light_stations(l, b, h)

    # Zone z-boundaries (absolute, in world units)
    z_nose  = l * -0.449    # ≈ -3.502  nose tip
    z_bow_s = l * -0.252    # ≈ -1.966  bow / mid seam
    z_mid_s = l *  0.197    # ≈  1.537  mid / stern seam
    z_stern = l *  0.400    # ≈  3.120  hull loft transom

    # ── Primary hull loft (always, detail 0+) ────────────────────────────
    kit.hull_loft(parts, 'light.hull', H, stations, hull_mat)

    # Armoured bow block — small ROLE_ARMOUR mass always present (detail 0+)
    # so COLOR_0 uniformity gate sees at least two distinct roles at every LOD.
    # Seated on the hull CROWN at the seam shoulder with 0.10 burial so the
    # block connects to the hull skin and cannot float as an isolated island.
    z_ba   = z_bow_s + l * 0.022
    top_ba = sf.top_y(stations, z_ba, 0.0)
    ba_cy  = top_ba + h * 0.060 - 0.10   # 0.10 proud above crown; rest buried
    kit.box(parts, 'light.bow.armour', A,
            (0.0, ba_cy, z_ba),
            (b * 0.048, h * 0.060, l * 0.022), hull_mat)

    if detail < 1:
        return

    # ── Zone seam weld beads (detail 1+) ─────────────────────────────────
    sr_bow = sf.seam_ring(stations, z_bow_s)
    hw.weld_bead(parts, 'light.seam.bow',
                 sr_bow[0], sr_bow[1], sr_bow[2], sr_bow[3],
                 z_bow_s, hull_mat, detail=detail)

    sr_mid = sf.seam_ring(stations, z_mid_s)
    hw.weld_bead(parts, 'light.seam.mid',
                 sr_mid[0], sr_mid[1], sr_mid[2], sr_mid[3],
                 z_mid_s, hull_mat, detail=detail)

    # Capture collar weld ring visible at the bow/mid weld zone
    z_si  = z_bow_s + 0.14
    sr_si = sf.seam_ring(stations, z_si)
    hw.weld_bead(parts, 'light.seam.bow.inner',
                 sr_si[0], sr_si[1], sr_si[2], sr_si[3],
                 z_si, hull_mat, thickness=0.06, detail=detail)

    # ── COMMS DISH - oversized forward-angled collector (detail 1+) ──────
    # Dish faces mostly -Z but tilted 30 deg toward +Y so its face reads
    # from the side view (rotation pi/3 around X tilts axis from Y to Z by
    # 60 deg = 30 deg off pure CYL_ALONG_Z).
    # kit.cyl convention: real radius, real depth along axis.
    #
    # SIZE CONVENTION: cradle half-extents passed to kit.box (takes half-ext).
    # dish_dep / 2 is the half-depth passed to kit.cyl (takes real depth so
    # no halving — the depth is already the full depth along the axis).
    #
    # CONNECTIVITY: cradle is buried 0.11 into hull crown in Y.  Dish is sunk
    # 0.10 into the cradle platform in Y.  The cradle Z-span (half-depth chd)
    # is extended aft to cover the region where the tilted dish body reaches
    # its minimum Y (which is offset in +Z relative to the dish centre).
    dish_x   = -b * 0.060          # ≈ -0.197  PORT offset (functional asymmetry)
    dish_z   = l * -0.040          # ≈ -0.312  near front of mid zone

    top_mid  = sf.top_y(stations, dish_z, 0.0)   # hull crown at dish position

    # Cradle: small ROLE_HULL platform, sunk 0.11 into hull crown.
    # half-extents for kit.box: (chw in X, chh in Y, chd in Z)
    chw = b * 0.075                # half-width in X  ≈ 0.246
    chh = h * 0.040                # half-height in Y ≈ 0.075
    chd = l * 0.068                # half-depth in Z  ≈ 0.530 — extended to cover
                                   # the aft reach of the tilted dish bottom

    cradle_cy  = top_mid + chh - 0.11   # 0.11 inside hull crown
    cradle_top = cradle_cy + chh        # top surface of cradle platform

    kit.box(parts, 'light.cradle', H,
            (dish_x, cradle_cy, dish_z), (chw, chh, chd), hull_mat)

    # Dish: large tilted cylinder; axis is (0, sin(pi/3), cos(pi/3)) =
    # (0, 0.866, 0.500) — wait, rotation=(pi/3) around X tilts original Y-axis
    # by pi/3 toward Z:  new_axis = (0, cos(pi/3), sin(pi/3)) = (0, 0.500, 0.866).
    # axis_y = 0.500, axis_z = 0.866.
    #
    # Y half-extent of bounding box of the tilted cylinder:
    #   Y_half = dish_r * sqrt(1 - axis_y^2) + (dish_dep/2) * axis_y
    #          = dish_r * 0.866 + (dish_dep/2) * 0.500
    # With dish_r = b*0.185 = 0.606, dish_dep = 0.15:
    #   Y_half = 0.606*0.866 + 0.075*0.500 = 0.525 + 0.038 = 0.563
    #
    # Dish centre Y set so dish_bottom_y = cradle_top - 0.10 (0.10 inside cradle).
    #   dish_cy_y = (cradle_top - 0.10) + Y_half
    dish_r   = b * 0.185           # ≈ 0.606  oversized relative to hull beam
    dish_dep = 0.15                 # real depth along axis (kit.cyl takes real depth)
    _AX_Y = math.cos(math.pi / 3.0)   # axis_y = 0.500
    _AX_Z = math.sin(math.pi / 3.0)   # axis_z = 0.866
    y_half_dish = dish_r * math.sqrt(1.0 - _AX_Y ** 2) + (dish_dep * 0.5) * _AX_Y
    # y_half_dish ≈ 0.525 + 0.038 = 0.563
    dish_cy_y = (cradle_top - 0.10) + y_half_dish

    _DISH_ROT = (math.pi / 3.0, 0.0, 0.0)   # 30 deg tilt from Z toward Y

    kit.cyl(parts, 'light.dish', H,
            (dish_x, dish_cy_y, dish_z),
            dish_r, dish_dep, hull_mat,
            rotation=_DISH_ROT)

    if detail >= 3:
        # Rim torus around the dish face — makes the oversized diameter obvious
        # from any angle.  Torus also along _DISH_ROT.
        kit.torus(parts, 'light.dish.rim', A,
                  (dish_x, dish_cy_y, dish_z),
                  dish_r + 0.04, 0.04, hull_mat,
                  rotation=_DISH_ROT)

    # ── PLATE QUILTS — bow, mid, stern flanks + aft deck + keel (detail 1+) ─
    # surf= is required on every tapering run so each plate re-samples its own
    # hull-surface station.  Pitch 0.50, role_mix=(0.55, 0.36, 0.09): iron
    # dominant, weathered-salvage gives patchwork read, recess = seam gaps.
    # LOD gating is internal to plate_quilt: detail=1 → 1 row / 2x pitch
    # (coarse course only); detail=2 → half rows / 1.4x pitch; detail=3 full.
    z_qb = (z_nose + z_bow_s) * 0.5    # ≈ -2.734  bow zone centre
    z_qm = (z_bow_s + z_mid_s) * 0.5   # ≈ -0.215  mid zone centre
    z_qs = (z_mid_s + z_stern) * 0.5   # ≈  2.329  stern zone centre

    q_ht_bow   = 2.0 * sf.straight_top(stations, z_qb)   # full vertical span, bow
    q_ht_mid   = 2.0 * sf.straight_top(stations, z_qm)   # full vertical span, mid
    q_ht_stern = 2.0 * sf.straight_top(stations, z_qs)   # full vertical span, stern

    _RM = (0.55, 0.36, 0.09)   # role mix shared by all hull-mass quilts

    # Bow zone — both flanks; rows=6, pitch=0.50; surf trims plates to the
    # tapering needle so no plate floats clear of the hull surface.
    sv.plate_quilt(parts, 'light.quilt.bow.port',
                   0.0, 0.0, z_nose, z_bow_s, q_ht_bow,
                   hull_mat, seed=17, detail=detail, rows=6, pitch=0.50,
                   face='-x', role_mix=_RM,
                   surf=lambda z, yy: -sf.flank_x(stations, z, yy))
    sv.plate_quilt(parts, 'light.quilt.bow.stbd',
                   0.0, 0.0, z_nose, z_bow_s, q_ht_bow,
                   hull_mat, seed=18, detail=detail, rows=6, pitch=0.50,
                   face='x', role_mix=_RM,
                   surf=lambda z, yy: sf.flank_x(stations, z, yy))

    # Mid zone — both flanks; rows=10, pitch=0.50
    sv.plate_quilt(parts, 'light.quilt.mid.port',
                   0.0, 0.0, z_bow_s, z_mid_s, q_ht_mid,
                   hull_mat, seed=11, detail=detail, rows=10, pitch=0.50,
                   face='-x', role_mix=_RM,
                   surf=lambda z, yy: -sf.flank_x(stations, z, yy))
    sv.plate_quilt(parts, 'light.quilt.mid.stbd',
                   0.0, 0.0, z_bow_s, z_mid_s, q_ht_mid,
                   hull_mat, seed=12, detail=detail, rows=10, pitch=0.50,
                   face='x', role_mix=_RM,
                   surf=lambda z, yy: sf.flank_x(stations, z, yy))

    # Stern zone — both flanks; rows=8, pitch=0.50
    sv.plate_quilt(parts, 'light.quilt.stern.port',
                   0.0, 0.0, z_mid_s, z_stern, q_ht_stern,
                   hull_mat, seed=13, detail=detail, rows=8, pitch=0.50,
                   face='-x', role_mix=_RM,
                   surf=lambda z, yy: -sf.flank_x(stations, z, yy))
    sv.plate_quilt(parts, 'light.quilt.stern.stbd',
                   0.0, 0.0, z_mid_s, z_stern, q_ht_stern,
                   hull_mat, seed=14, detail=detail, rows=8, pitch=0.50,
                   face='x', role_mix=_RM,
                   surf=lambda z, yy: sf.flank_x(stations, z, yy))

    # Aft deck quilt — tops of the stern section; rows=5, pitch=0.50
    z_aft_deck = z_mid_s + (z_stern - z_mid_s) * 0.40
    w_aft_deck = 2.0 * sf.flat_half(stations, z_aft_deck)
    sv.plate_quilt(parts, 'light.quilt.aft.deck',
                   0.0, 0.0, z_mid_s, z_stern, w_aft_deck,
                   hull_mat, seed=15, detail=detail, rows=5, pitch=0.50,
                   face='y', role_mix=_RM,
                   surf=lambda z, xx: sf.top_y(stations, z, xx))

    # Keel underside quilt — belly of mid zone; rows=4, pitch=0.50
    q_keel_w = 2.0 * sf.flat_half(stations, z_qm)   # full flat belly width
    sv.plate_quilt(parts, 'light.quilt.keel',
                   0.0, 0.0, z_bow_s, z_mid_s, q_keel_w,
                   hull_mat, seed=16, detail=detail, rows=4, pitch=0.50,
                   face='-y', role_mix=_RM,
                   surf=lambda z, xx: sf.bottom_y(stations, z, xx))

    # Mid-zone keel plate course — additional panel ridging
    keel_by  = sf.bottom_y(stations, z_qm, 0.0) - 0.04
    keel_hw  = sf.flat_half(stations, z_qm) * 1.50
    keel_run = (z_mid_s - z_bow_s) * 0.70
    kit.plate_course(parts, 'light.pc.keel', H,
                     (0.0, keel_by, z_qm),
                     (keel_hw, 0.08, keel_run),
                     hull_mat, count=5, axis='z')

    # ── DRIED-RED STRIPE CLUSTERS — PORT flank only (detail 1+) ─────────
    # Two clusters, one per zone, PORT side only (inward=+1.0).
    # surf= re-samples the flank x at each stripe station so no stripe floats.
    #
    # Cluster 1: mid zone, 7 bars, height=0.65.
    #   Local straight flank height at mid centre ≈ 1.0 u; 0.65/1.0 = 65 % ✓
    #   (within required 55-80 % of local flank height).
    sv.stripe_group(parts, 'light.stripes.mid',
                    0.0, 0.0, z_bow_s, z_mid_s,
                    hull_mat, height=0.65, count=7,
                    gap=sf.TALLY_SPACING, inward=1.0, detail=detail,
                    surf=lambda z, yy: -sf.flank_x(stations, z, yy))

    # Cluster 2: bow/prow zone, 5 bars, height=0.40 — heavy red near the prow
    #   as the reference shows.  Local straight flank height at bow centre
    #   ≈ 0.62 u; 0.40/0.62 = 65 % ✓ (within required 55-80 %).
    sv.stripe_group(parts, 'light.stripes.bow',
                    0.0, 0.0, z_nose, z_bow_s,
                    hull_mat, height=0.40, count=5,
                    gap=sf.TALLY_SPACING, inward=1.0, detail=detail,
                    surf=lambda z, yy: -sf.flank_x(stations, z, yy))

    # ── SALVAGE BOOM — under and forward of the bow (detail 1+) ──────────
    # Root INSIDE the hull (0.15 above keel at z_boom_root so the chord
    # struts that exit from the root overlap the hull mesh).
    # Tip forward and below the nose — breaks the keel silhouette.
    # Boom length ≈ 1.09 units ≈ 14 % of l = 7.8 (> 15 % gate = 1.07).
    # Tip pulled aft (0.248 ahead of nose vs former 0.60) to bring spanZ to
    # ≈7.14; extra Y depth (-0.90 vs -0.80) compensates length so boom ≥ 1.07.
    z_boom_root  = l * -0.380           # ≈ -2.964  in bow zone
    root_keel_y  = sf.bottom_y(stations, z_boom_root, 0.0)
    boom_root    = (0.0, root_keel_y + 0.15, z_boom_root)   # inside hull ✓

    z_boom_tip   = z_nose - 0.248       # ≈ -3.750  forward of nose
    boom_tip     = (0.0, -0.90, z_boom_tip)   # below keel; deeper Y for length

    sv.salvage_boom(parts, glow, 'light.boom',
                    boom_root, boom_tip,
                    hull_mat, glow_mat,
                    radius=0.030, jaw=0.12, detail=detail, bays=4)

    # ── CAPTURED DRIVE — stern, adapter collar seats against transom ──────
    # z_drive chosen so the housing front face is well inside the hull body
    # (≥ 0.10 overlap) and the collar (at housing_front - collar_d) is also
    # inside the hull body, eliminating the floating-collar island.
    # drive_dep sized so the nozzle face protrudes ≈ 0.13 past the transom.
    z_drive   = z_mid_s + (z_stern - z_mid_s) * 0.76    # ≈ 2.740
    d_hw, d_hh, d_yo, _ = sf.section(stations, z_drive)
    drive_r   = min(d_hw, d_hh) * 0.34                  # ≈ 0.183
    drive_dep = (z_stern - z_mid_s) * 0.64               # ≈ 1.013
    # Housing front at z_drive - drive_dep*0.5 ≈ 2.233 — inside hull ✓
    # Collar at housing_front - collar_d*0.5 ≈ 2.163  — inside hull ✓
    # Nozzle face at z_drive + drive_dep*0.5 ≈ 3.247  — protrudes ✓

    hw.captured_drive(parts, glow, 'light.drive',
                      (0.0, d_yo, z_drive),
                      hull_mat, glow_mat,
                      radius=drive_r, depth=drive_dep,
                      nozzles=2, detail=detail)

    if detail < 2:
        return

    # ── DONOR VERIDIAN HEAD — stolen Combine sensor beside the dish ───────
    # Faces -Z (nose direction, same as dish).  Body partially embedded in
    # the PORT hull crown (0.12 units in Y) so the probe sees hull→donor.
    # Two weld_straps straddle the hull-donor junction at the crown surface.
    # One cut_edge at the -Z (severed) face marks the captured origin.
    d_sz   = (0.22, 0.22, 0.30)     # (sx, sy, sz) FULL extents for chamfer_block
    dv_x   = -b * 0.185              # ≈ -0.606  PORT, outboard of dish at -0.197
    dv_z   = l * -0.065              # ≈ -0.507  slightly aft of dish centre
    dv_ht  = sf.top_y(stations, dv_z, abs(dv_x))   # hull crown at donor site
    # Centre Y: d_sz[1]*0.5 = 0.11 = half of full block height
    dv_y   = dv_ht - d_sz[1] * 0.5 + 0.12          # 0.12 burial of bottom face

    dn.donor_veridian_head(parts, glow, 'light.veridian',
                           (dv_x, dv_y, dv_z),
                           hull_mat, glow_mat, d_sz, detail)

    # Weld straps — full extents (sx, sy, sz) per weld_strap docstring.
    # Centre Y at hull-crown - 0.06 so both hull and donor body overlap in Y:
    #   hull body below dv_ht ← strap also below dv_ht ✓
    #   donor body from dv_ht - 0.12 upward ← strap spans into donor range ✓
    ws_y  = dv_ht - 0.06
    ws_sz = (d_sz[0] + 0.08, 0.12, 0.20)   # full extents
    for si, dz_off in enumerate((-d_sz[2] * 0.30, +d_sz[2] * 0.30)):
        dn.weld_strap(parts, 'light.veridian.strap.%d' % si,
                      (dv_x, ws_y, dv_z + dz_off),
                      hull_mat, ws_sz, bolts=4, detail=detail)

    # Cut edge at the -Z (forward/severed) face — teeth bite in +Z direction
    ce_z = dv_z - d_sz[2] * 0.5    # at the forward face of the donor block
    dn.cut_edge(parts, 'light.veridian.cut',
                (dv_x, dv_y, ce_z),
                hull_mat, (d_sz[0], d_sz[1], 0.06),
                teeth=5, detail=detail)

    # ── LOCKBOX — belly, STARBOARD offset (deliberate functional asymmetry) ─
    lb_z   = l *  0.060        # ≈  0.468  mid zone aft
    lb_x   = b *  0.080        # ≈  0.262  STARBOARD
    bot_lb = sf.bottom_y(stations, lb_z, lb_x)
    # Bury 0.20 of the LOCKBOX[1] half-extent into the hull belly so the
    # assembly does not tip too far below keel (controls spanY).
    # kit.box takes HALF-extents: sf.LOCKBOX = (0.34, 0.52, 0.20) half-extents.
    lb_cy  = bot_lb - sf.LOCKBOX[1] * 0.5 + 0.20

    kit.box(parts, 'light.lockbox', A,
            (lb_x, lb_cy, lb_z), sf.LOCKBOX, hull_mat)

    if detail >= 3:
        # Stand-off pads at hull/lockbox junction
        lb_top = lb_cy + sf.LOCKBOX[1]   # kit.box half-extent → actual top
        for pi, (px, pz) in enumerate([
            (-sf.LOCKBOX[0] * 0.28, -sf.LOCKBOX[2] * 0.28),
            (-sf.LOCKBOX[0] * 0.28,  sf.LOCKBOX[2] * 0.28),
            ( sf.LOCKBOX[0] * 0.28, -sf.LOCKBOX[2] * 0.28),
            ( sf.LOCKBOX[0] * 0.28,  sf.LOCKBOX[2] * 0.28),
        ]):
            kit.cyl(parts, 'light.lb.pad.%02d' % pi, A,
                    (lb_x + px, (bot_lb + lb_top) * 0.5, lb_z + pz),
                    0.06, 0.20, hull_mat)
        # Status slit
        slit_x = lb_x + sf.LOCKBOX[0] - sf.STATUS_SLIT[0] * 0.5
        hw._glow_box(glow, 'light.lb.slit',
                     (slit_x, lb_cy, lb_z),
                     sf.STATUS_SLIT, glow_mat)

    # ── BOW FITTINGS — brow, cockpit, shutter wells (detail 2+) ─────────
    # Armoured brow — narrow box above hull crown in bow zone.
    z_brow    = l * -0.330
    top_brow  = sf.top_y(stations, z_brow, 0.0)
    brow_chh  = h * 0.050       # half-height; full brow height ≈ 0.094
    brow_cy   = top_brow + brow_chh - 0.10   # 0.10 burial into hull crown
    kit.box(parts, 'light.brow', A,
            (0.0, brow_cy, z_brow),
            (b * 0.075, brow_chh, l * 0.038), hull_mat)

    # Two-pane cockpit windows recessed into hull crown, under the brow.
    z_cpit    = z_brow + l * 0.022
    top_cpit  = sf.top_y(stations, z_cpit, 0.0)
    kit.window_row(glow, 'light.cockpit',
                   (0.0, top_cpit - sf.PORT_LIGHT[1] * 0.5, z_cpit),
                   glow_mat, 2, sf.PORT_SPACING, sf.PORT_LIGHT)

    # Shutter wells — BOTH flanks, aft of brow; CLOSED hidden weapon pair.
    # +X face of each well aligned to hull flank via flank_x query so the
    # well doesn't float when the hull tapers.
    z_sw  = l * -0.285
    sw_sx = h * 0.080       # depth into hull (X)
    sw_sy = h * 0.195       # opening height (Y)
    sw_sz = l * 0.058       # opening length (Z)
    sw_fx = sf.flank_x(stations, z_sw, 0.0)
    sw_lx = sw_fx - sw_sx * 0.5    # well +X face at hull flank
    hw.shutter_well(parts, 'light.sw.stbd',
                    ( sw_lx, 0.0, z_sw), hull_mat,
                    (sw_sx, sw_sy, sw_sz),
                    plates=2, open_frac=0.0, detail=detail)
    hw.shutter_well(parts, 'light.sw.port',
                    (-sw_lx, 0.0, z_sw), hull_mat,
                    (sw_sx, sw_sy, sw_sz),
                    plates=2, open_frac=0.0, detail=detail)

    # ── AMBER WINDOW SLIT ROWS — both flanks, low (detail 2+) ───────────
    # Rows run along the mid zone at PORT_SPACING pitch. Low flank position
    # (y_win < 0) — each window half-buried in the flank surface via
    # flank_anchor so tapered sections never produce floats.
    z_win_ref = (z_bow_s + z_mid_s) * 0.5
    y_win     = -sf.straight_top(stations, z_win_ref) * 0.55   # lower flank
    z_win0    = z_bow_s + 0.18
    n_win     = 10 if detail >= 3 else 7
    for wi in range(n_win):
        wz = z_win0 + wi * sf.PORT_SPACING
        if wz >= z_mid_s - 0.20:
            break
        p_fx = sf.flank_anchor(stations, wz, y_win, sf.FLANK_PORT[0] * 0.5)
        if p_fx > 0.0:
            kit.window_row(glow, 'light.win.port.%02d' % wi,
                           (-p_fx, y_win, wz),
                           glow_mat, 1, sf.PORT_SPACING, sf.FLANK_PORT)
            kit.window_row(glow, 'light.win.stbd.%02d' % wi,
                           ( p_fx, y_win, wz),
                           glow_mat, 1, sf.PORT_SPACING, sf.FLANK_PORT)

    # ── BELLY LAMP RUN — mid zone centreline (detail 2+) ─────────────────
    z_lr0 = z_bow_s + 0.45
    z_lr1 = z_mid_s - 0.45
    lr_y  = sf.bottom_y(stations, (z_lr0 + z_lr1) * 0.5, 0.0)
    hw.lamp_run(parts, glow, 'light.lr',
                0.0, lr_y, z_lr0, z_lr1,
                glow_mat, hull_mat, sf.LAMP_SPACING, detail)

    # ── RADIATOR PANELS — stern flanks, break the outline (detail 2+) ────
    # Inboard face buried 0.10 into hull flank for solid connectivity.
    # kit.radiator_panel size convention matches the function's own docstring
    # (full extents); rad_cx positions the centre so inboard = flank_x - 0.10.
    z_rad   = z_mid_s + (z_stern - z_mid_s) * 0.35
    r_hw, r_hh, r_yo, _ = sf.section(stations, z_rad)
    r_fx    = sf.flank_x(stations, z_rad, r_yo)
    rad_w   = l * 0.022                        # thin slab in X (full extent)
    rad_h   = h * 0.420                        # breaks the stern profile
    rad_d   = (z_stern - z_mid_s) * 0.44      # Z span
    rad_cx  = r_fx + rad_w * 0.5 - 0.10       # inboard face 0.10 inside hull
    hw.radiator_panel(parts, 'light.rad.stbd',
                      ( rad_cx, r_yo, z_rad),
                      hull_mat, (rad_w, rad_h, rad_d),
                      fins=0, detail=detail)
    hw.radiator_panel(parts, 'light.rad.port',
                      (-rad_cx, r_yo, z_rad),
                      hull_mat, (rad_w, rad_h, rad_d),
                      fins=0, detail=detail)
