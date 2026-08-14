"""Red Ledger - ACE, the collector.

Bible §4.4: "a low, unmistakable pursuit hull with offset captured engines, a
precise boarding spike, retractable gun ports, and repeated tally grooves cut
into one armor flank."

Three zones with real seams between them (ShipAssetPipeline §3 rule 1):
    bow   20 %  z = -3.60 to -2.16  machined boarding spike on the centreline
                (ROLE_ACCENT, 5:1 taper, root-third guide rails); hard shoulder
                armour plate; recessed armoured canopy slit.
                sv.plate_quilt on both flanks and shoulder deck (detail >= 2),
                rows=5, pitch=0.50, role_mix=(0.55, 0.36, 0.09).
    mid   50 %  z = -2.16 to +1.44  the low narrow pursuit blade — widest at
                b*0.306 half-width.  sv.plate_quilt on both flanks (rows=6,
                pitch=0.50), deck (rows=4), and keel (rows=3, detail >= 2).
                role_mix=(0.55, 0.36, 0.09) on every run; 94 % flank height.
                THREE sv.stripe_group clusters of dried-red ROLE_ACCENT vertical
                tally strokes on the PORT flank only; starboard stays calm
                (bible: "grooves cut into one armor flank"):
                  G1 (7 stripes, h=0.726, z=-2.16 to -0.72 — forward mid),
                  G2 (6 stripes, h=0.726, z=-0.72 to +0.43 — aft mid),
                  G3 (5 stripes, h=0.665, z=-3.53 to -2.56 — port prow bow,
                      the heaviest concentration as in the reference image).
                Accent area: stripe footprints G1 1.21 + G2 1.04 + G3 0.81 sq,
                plus spike body ≈ 0.47 sq = 3.53 sq total ROLE_ACCENT.
                Hull mesh surface ≈ 42 sq (body 33 + attachments 9) →
                accent coverage ≈ 8 % of hull mesh area.
                Three hw.shutter_well gun ports all closed (two stbd flank, one
                dorsal).  dn.donor_ferrous_ribs rib belt bolted to the stbd
                shoulder with two weld straps and one cut edge.
    stern 30 %  z = +1.44 to +3.50  TWO hw.captured_drive packages deliberately
                mismatched — port (r=0.22, depth=0.58, 4 nozzles) mounted lower
                and further aft; starboard (r=0.15, depth=0.42, 2 nozzles)
                mounted higher and further forward.  Each keeps its own adapter
                collar.  Two small flat hw.radiator_panel flush to the flanks.
                sv.plate_quilt on both flanks, rows=5, pitch=0.50.

Silhouette family: WEDGE (primary), spine-and-pods (secondary — mismatched
drive pair reads as a spine with offset pods).  All stations hard_section:
hard chines, flat facets, no fair rounding.

Donor parts carried: ONE captured Ferrous Hegemony armour rib belt (n_ribs=5)
strapped to the starboard shoulder with two dn.weld_strap hold-downs and one
dn.cut_edge at the severed forward face where the belt was torched off.

Salvage boom: sv.salvage_boom from z = -1.872 to z = -3.528, length 1.656
units (23 % of l = 7.2), hanging below the keel.  Breaks the silhouette in
side view as required by §G2.

Deliberate asymmetry: port captured drive visibly larger, lower, and further
aft than the starboard drive; tally strokes on PORT flank only; rib belt on
STARBOARD shoulder only; boom runs on the hull centreline below the keel.

Extent budget (measured):
    Z  spanZ  7.4
    X  spanX  1.85
    Y  spanY  1.41
    Proportions: spanZ/spanX = 4.01   spanY/spanZ = 0.19
                 spanX/spanZ = 0.25

Measured (2026-08-14 bake):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P scripts/build-ship-assets.py -- redledger
    node scripts/compress-ship-assets.mjs redledger
    node scripts/measure-ships.mjs redledger
    node scripts/probe-ship-islands.mjs redledger ace lod0

    verts 13764   span 7.4   len/beam 4.01   ht/len 0.19   beam/len 0.25
    proxy cover 100.0%
    triangles  lod0 7248   lod1 2776   lod2 1436
    probe-ship-islands: ONE CONNECTED BODY
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import hardware as hw
from . import salvage as sv
from . import donors as dn


# =============================================================================
# ACE station list
# =============================================================================
def _ace_stations(l, b, h):
    """Hull-loft stations for the low narrow hard-chined pursuit blade.

    All stations use hard_section (k=0.16) — hard chines and flat facets, no
    fair rounding.  Max half-width = b*0.306 so spanZ/spanX ≈ 4.20 >= 3.0.
    Three distinct section families separated by visible seam collars:
        bow   — tight taper toward the nose
        mid   — constant max beam, slight drop in hh toward the stern seam
        stern — taper to a narrow square transom for the drive brackets
    """
    return [
        # -- bow  (z -3.60 to -2.16, 20 %) ------------------------------------
        sf.hard_section(-l * 0.500, b * 0.09, h * 0.24, h * 0.04),  # nose
        sf.hard_section(-l * 0.420, b * 0.22, h * 0.33, h * 0.05),  # shoulder ramp
        sf.hard_section(-l * 0.300, b * 0.27,  h * 0.36, h * 0.05),  # bow/mid seam — 10 % narrowed
        # -- mid  (z -2.16 to +1.44, 50 %) — 10 % narrower beam throughout mid zone
        sf.hard_section(-l * 0.200, b * 0.297, h * 0.36, h * 0.05),
        sf.hard_section(-l * 0.050, b * 0.306, h * 0.36, h * 0.05),  # widest
        sf.hard_section( l * 0.100, b * 0.306, h * 0.35, h * 0.05),
        sf.hard_section( l * 0.200, b * 0.27,  h * 0.33, h * 0.04),  # mid/stern seam — 10 % narrowed
        # -- stern  (z +1.44 to +3.50, 30 %) -----------------------------------
        sf.hard_section( l * 0.280, b * 0.22, h * 0.29, h * 0.03),
        sf.hard_section( l * 0.400, b * 0.14, h * 0.25, h * 0.02),
        sf.hard_section( l * 0.486, b * 0.09, h * 0.21, h * 0.01),  # transom
    ]


# =============================================================================
# ACE - COLLECTOR
# Called with l=7.2 b=2.88 h=1.44 (from CLASSES).
# =============================================================================
def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    D = kit.ROLE_ARMOUR
    A = kit.ROLE_ACCENT
    T = kit.ROLE_TRIM
    R = kit.ROLE_RECESS

    st = _ace_stations(l, b, h)

    # -- Zone boundaries -------------------------------------------------------
    bow_mid_z   = -l * 0.300   # bow / mid seam   z = -2.16
    mid_stern_z =  l * 0.200   # mid / stern seam  z = +1.44

    # -- Spike geometry --------------------------------------------------------
    nose_z      = -l * 0.500              # hull nose station  z = -3.60
    spike_len   =  l * 0.042              # 0.302 world units
    spike_tip_z =  nose_z - spike_len     # -3.902  (docstring anchor)
    spike_cz    =  nose_z - spike_len * 0.5
    nose_hw     = b * 0.09                # half-width  at nose station
    nose_hh     = h * 0.24                # half-height at nose station
    nose_yo     = h * 0.04                # y_offset    at nose station

    # -- Drive pre-computations ------------------------------------------------
    # Port: larger (r=0.22), lower, further aft, 4 nozzles.
    drv_p_r   = 0.22
    drv_p_dep = 0.58
    drv_p_z   =  l * 0.360                           # z = +2.592
    drv_p_yo  = sf.section(st, drv_p_z)[2]           # interpolated y_offset
    drv_p_cy  = drv_p_yo - h * 0.10                  # lower than hull centre
    drv_p_fx  = sf.flank_x(st, drv_p_z, drv_p_cy)
    drv_p_cx  = -(drv_p_fx + 0.10)                   # collar overlaps hull ≥ 0.10

    # Starboard: smaller (r=0.15), higher, further forward, 2 nozzles.
    drv_s_r   = 0.15
    drv_s_dep = 0.42
    drv_s_z   =  l * 0.300                           # z = +2.160
    drv_s_yo  = sf.section(st, drv_s_z)[2]
    drv_s_cy  = drv_s_yo + h * 0.08                  # higher than hull centre
    drv_s_fx  = sf.flank_x(st, drv_s_z, drv_s_cy)
    drv_s_cx  =  drv_s_fx + 0.10                     # collar overlaps hull ≥ 0.10

    # -- Boom pre-computations -------------------------------------------------
    # Boom hangs below the keel from the forward mid belly to near the nose.
    # root.y is 0.12 below the hull keel so the chord struts bury ≥ 0.10 ✓.
    # tip.y is 0.22 below the bow keel so the boom breaks the outline in side
    # view at a point forward of the spike root.
    boom_root_z = -l * 0.260                             # z = -1.872
    boom_tip_z  = -l * 0.490                             # z = -3.528
    boom_root_y = sf.bottom_y(st, boom_root_z) - 0.12   # 0.12 below keel
    boom_tip_y  = sf.bottom_y(st, boom_tip_z)  - 0.22   # 0.22 below bow keel

    # =========================================================================
    # PRIMARY MASSES (all detail levels)
    # =========================================================================

    # Hull pursuit blade — hard_section throughout: hard chines, flat facets.
    kit.hull_loft(parts, 'hull-body', H, st, hull_mat)

    # Boarding spike — precise machined cone, ROLE_ACCENT (dried-red).
    # Back face matches the hull nose station face → guaranteed connectivity.
    # kit.taper_block takes FULL extents (halved internally).
    kit.taper_block(parts, 'spike-body', A,
                    (0.0, nose_yo, spike_cz),
                    (nose_hw * 2.0, nose_hh * 2.0, spike_len),   # full extents
                    hull_mat,
                    front=(0.06, 0.07),   # fine tip at -Z
                    back=(1.0,  1.0),     # full root at +Z (matches hull nose)
                    bevel=h * 0.006)

    # Spike guide rails: root third of the spike only; ramp inward with taper.
    rail_z0 = nose_z                        # root end at hull nose face
    rail_z1 = nose_z - spike_len * 0.33    # tip end  one-third along spike
    for sign, rside in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.strut(parts, 'spike-rail-%s' % rside, D,
                  (sign * nose_hw * 0.86, nose_yo, rail_z0),
                  (sign * nose_hw * 0.55, nose_yo, rail_z1),
                  hull_mat, radius=h * 0.020)

    # Salvage boom — slung below the keel, length 1.656 units (23 % of l=7.2,
    # satisfying §G2 >= 15 % rule).  Root buried 0.12 into hull keel ✓.
    sv.salvage_boom(parts, glow, 'salvage-boom',
                    root=(0.0, boom_root_y, boom_root_z),
                    tip=(0.0,  boom_tip_y,  boom_tip_z),
                    mat=hull_mat, glow_mat=glow_mat,
                    radius=0.04, jaw=0.10, detail=detail, bays=3)

    # Port captured drive — larger, lower, further aft, 4 nozzles.
    hw.captured_drive(parts, glow, 'drive-port',
                      (drv_p_cx, drv_p_cy, drv_p_z),
                      hull_mat, glow_mat,
                      drv_p_r, drv_p_dep, nozzles=4, detail=detail)

    # Starboard captured drive — smaller, higher, further forward, 2 nozzles.
    hw.captured_drive(parts, glow, 'drive-stbd',
                      (drv_s_cx, drv_s_cy, drv_s_z),
                      hull_mat, glow_mat,
                      drv_s_r, drv_s_dep, nozzles=2, detail=detail)

    # Small flat radiator panels — one per side, ROLE_ARMOUR.
    # hw.radiator_panel → kit.box → SIZE CONVENTION: size arg is HALF-extents.
    # Placement: inner face buried 0.10 inside hull; outer face 0.02 proud.
    # X half-extent = 0.06 → full 0.12; inner face = flank - 0.06 + 0.04 = flank - 0.02?
    # Actual burial: center at (flank - 0.04), half = 0.06 → inner face at flank + 0.02... 
    # Port: center_x = -(rad_p_fx - 0.04) so inner face = -(rad_p_fx-0.04) + 0.06 = -rad_p_fx+0.10
    # burial = 0.10 ✓   outer face = -rad_p_fx - 0.02 (2 cm proud) ✓
    rad_p_z  =  l * 0.240
    rad_p_fx = sf.flank_x(st, rad_p_z, 0.0)
    rad_p_yo = sf.section(st, rad_p_z)[2]
    hw.radiator_panel(parts, 'radiator-port',
                      (-(rad_p_fx - 0.04), rad_p_yo, rad_p_z),
                      hull_mat,
                      (0.06, h * 0.06, l * 0.040),   # half-extents; full 0.12 × 0.173 × 0.576
                      detail=detail)

    # Stbd: center_x = +(rad_s_fx - 0.04), inner face = rad_s_fx - 0.10, burial = 0.10 ✓
    rad_s_z  =  l * 0.330
    rad_s_fx = sf.flank_x(st, rad_s_z, 0.0)
    rad_s_yo = sf.section(st, rad_s_z)[2]
    hw.radiator_panel(parts, 'radiator-stbd',
                      ( (rad_s_fx - 0.04), rad_s_yo, rad_s_z),
                      hull_mat,
                      (0.06, h * 0.05, l * 0.030),   # half-extents; full 0.12 × 0.144 × 0.432
                      detail=detail)

    # =========================================================================
    # ZONE SEAMS  (detail 1+)
    # =========================================================================
    if detail >= 1:
        # Bow / mid seam — weld bead at the hard_section boundary.
        bm_hw, bm_hh, bm_yo, bm_ch = sf.seam_ring(st, bow_mid_z)
        hw.weld_bead(parts, 'seam-bow-mid',
                     bm_hw, bm_hh, bm_yo, bm_ch, bow_mid_z,
                     hull_mat, detail=detail)

        # Mid / stern seam — heavier capture collar marks the drive zone entry.
        ms_hw, ms_hh, ms_yo, ms_ch = sf.seam_ring(st, mid_stern_z)
        hw.capture_collar(parts, 'seam-mid-stern',
                          ms_hw, ms_hh, ms_yo, ms_ch, mid_stern_z,
                          hull_mat, depth=0.22, detail=detail)

    # =========================================================================
    # SURFACE LANGUAGE  (detail 1+)
    # =========================================================================
    if detail >= 1:

        # ---- BOW SHOULDER FEATURES ------------------------------------------
        # Shoulder armour plate — separately captured section read.
        # Connectivity: bottom face is ~0.028 below hull top → sub-voxel at
        # 0.06 resolution, 26-connected through shared voxels ✓.
        # kit.chamfer_block takes FULL extents (halved internally).
        shld_z    = -l * 0.380
        shld_top  = sf.top_y(st, shld_z, 0.0)
        shld_flat = sf.flat_half(st, shld_z)
        kit.chamfer_block(parts, 'bow-shoulder-plate', D,
                          (0.0, shld_top + h * 0.040, shld_z),
                          (shld_flat * 1.80, h * 0.12, l * 0.15),  # full extents
                          hull_mat, chamfer=h * 0.040)

        # Canopy slit — recessed pilot visor on the upper bow.
        # kit.box takes HALF-extents.
        canopy_z   = -l * 0.330
        canopy_top = sf.top_y(st, canopy_z, 0.0)
        kit.box(parts, 'canopy-slit', R,
                (0.0, canopy_top - h * 0.025, canopy_z),
                (b * 0.20, h * 0.045, l * 0.08),   # half-extents
                hull_mat)

        # ---- PLATE QUILTS ---------------------------------------------------
        # Dense cut-and-welded patchwork covering the full visible hull surface,
        # bow to stern, keel to crown.  Small plates (pitch 0.50, rows 5-7)
        # make individual welded sections legible at thumbnail distance; tonal
        # spread (iron 55 %, weathered 36 %, recess 9 %) reads as a quilt of
        # separately salvaged panels.  Each quilt run stays inside ONE zone.
        #
        # plate_quilt: x/y absolute hull coords; z0/z1 absolute; surf re-samples
        # the tapering section at every plate — no plates float off the surface.

        # ── Mid zone — clear of both seam beads ──────────────────────────────
        q_z0   = bow_mid_z  + l * 0.022   # just clear of bow/mid weld bead
        q_z1   = mid_stern_z - l * 0.022  # just clear of mid/stern capture collar
        q_zmid = (q_z0 + q_z1) * 0.5

        q_yo  = sf.section(st, q_zmid)[2]
        q_hh  = sf.section(st, q_zmid)[1]
        q_ht  = 2.0 * q_hh * 0.94   # 94 % of full mid flank height

        sv.plate_quilt(parts, 'quilt-port-mid',
                       0.0, q_yo, q_z0, q_z1, q_ht,
                       hull_mat, seed=111, detail=detail,
                       rows=6, pitch=0.50, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))

        sv.plate_quilt(parts, 'quilt-stbd-mid',
                       0.0, q_yo, q_z0, q_z1, q_ht,
                       hull_mat, seed=122, detail=detail,
                       rows=6, pitch=0.50, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))

        # Deck quilt: face='y' — height is the full X-span across the flat deck.
        deck_flat = sf.flat_half(st, q_zmid)
        deck_ht   = 2.0 * deck_flat * 0.82   # 82 % of flat deck full width
        sv.plate_quilt(parts, 'quilt-deck-mid',
                       0.0, 0.0, q_z0, q_z1, deck_ht,
                       hull_mat, seed=133, detail=detail,
                       rows=4, pitch=0.50, face='y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.top_y(st, z, xx))

        # ── Stern zone — drive bracket flank ─────────────────────────────────
        sq_z0   = mid_stern_z + l * 0.022
        sq_z1   = l * 0.420
        sq_zmid = (sq_z0 + sq_z1) * 0.5
        sq_yo   = sf.section(st, sq_zmid)[2]
        sq_hh   = sf.section(st, sq_zmid)[1]
        sq_ht   = 2.0 * sq_hh * 0.88

        sv.plate_quilt(parts, 'quilt-port-stern',
                       0.0, sq_yo, sq_z0, sq_z1, sq_ht,
                       hull_mat, seed=144, detail=detail,
                       rows=5, pitch=0.50, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))
        sv.plate_quilt(parts, 'quilt-stbd-stern',
                       0.0, sq_yo, sq_z0, sq_z1, sq_ht,
                       hull_mat, seed=155, detail=detail,
                       rows=5, pitch=0.50, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))

        # ── Bow zone + keel (detail >= 2) ─────────────────────────────────────
        # Gated at detail 2: detail 1 retains only the coarser mid/stern runs.
        if detail >= 2:
            bq_z0   = -l * 0.488                     # z = -3.514, inside nose
            bq_z1   = bow_mid_z - l * 0.022          # z = -2.318, clear of seam
            bq_zmid = (bq_z0 + bq_z1) * 0.5
            bq_yo   = sf.section(st, bq_zmid)[2]
            bq_hh   = sf.section(st, bq_zmid)[1]
            bq_ht   = 2.0 * bq_hh * 0.90            # 90 % of bow flank height

            sv.plate_quilt(parts, 'quilt-port-bow',
                           0.0, bq_yo, bq_z0, bq_z1, bq_ht,
                           hull_mat, seed=211, detail=detail,
                           rows=5, pitch=0.50, face='-x',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, yy: -sf.flank_x(st, z, yy))

            sv.plate_quilt(parts, 'quilt-stbd-bow',
                           0.0, bq_yo, bq_z0, bq_z1, bq_ht,
                           hull_mat, seed=222, detail=detail,
                           rows=5, pitch=0.50, face='x',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, yy: sf.flank_x(st, z, yy))

            # Bow shoulder deck quilt — armour plating over the canopy brow.
            # face='y': height is the full X-span of the band; surf re-samples
            # the tapered deck top at every plate column.
            bq_deck_flat = sf.flat_half(st, bq_zmid)
            bq_deck_ht   = 2.0 * bq_deck_flat * 0.78
            sv.plate_quilt(parts, 'quilt-deck-bow',
                           0.0, 0.0, bq_z0, bq_z1, bq_deck_ht,
                           hull_mat, seed=232, detail=detail,
                           rows=3, pitch=0.50, face='y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.top_y(st, z, xx))

            # Keel quilt — mid zone underside.  face='-y' protrudes downward.
            # surf=sf.bottom_y re-samples at every plate; not optional on a
            # tapering hull (the keel narrows toward both ends).
            kq_z0   = q_z0
            kq_z1   = q_z1
            kq_zmid = q_zmid
            kq_ky   = sf.bottom_y(st, kq_zmid, 0.0)
            kq_flat = sf.flat_half(st, kq_zmid)
            kq_ht   = 2.0 * kq_flat * 0.75           # 75 % of keel flat width
            sv.plate_quilt(parts, 'quilt-keel-mid',
                           0.0, kq_ky, kq_z0, kq_z1, kq_ht,
                           hull_mat, seed=243, detail=detail,
                           rows=3, pitch=0.50, face='-y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.bottom_y(st, z, xx))

        # ---- STRIPE GROUPS — PORT FLANK ONLY --------------------------------
        # Bible §4.4 "repeated tally grooves cut into one armor flank."
        # THREE clusters on the port flank; starboard stays calm.
        # inward=+1.0 for port: stripes protrude in -X, buried into +X (hull).
        # Stripe height = 70 % of local full flank height per zone.
        # Accent coverage ≈ 8 % of hull mesh surface — see docstring for the
        # per-cluster footprint calculation.

        sg_yo    = sf.section(st, -l * 0.200)[2]   # yo at mid-zone entry ≈ 0.072
        sg_mid_h = 2.0 * h * 0.36 * 0.70            # 70 % of mid full flank height

        # Group 1: forward mid band, 7 stripes centred in [bow_mid_z, -0.72].
        sg1_z0   = bow_mid_z            # -2.16
        sg1_z1   = -l * 0.100          # -0.720
        sv.stripe_group(parts, 'stripes-port-fwd', 0.0, sg_yo,
                        sg1_z0, sg1_z1, hull_mat,
                        height=sg_mid_h, count=7, gap=0.22, inward=+1.0,
                        detail=detail,
                        surf=lambda z, yy: -sf.flank_x(st, z, yy))

        # Group 2: aft mid band, 6 stripes centred in [-0.72, +0.432].
        sg2_z0   = -l * 0.100          # -0.720
        sg2_z1   =  l * 0.060          # +0.432
        sv.stripe_group(parts, 'stripes-port-mid', 0.0, sg_yo,
                        sg2_z0, sg2_z1, hull_mat,
                        height=sg_mid_h, count=6, gap=0.22, inward=+1.0,
                        detail=detail,
                        surf=lambda z, yy: -sf.flank_x(st, z, yy))

        # Group 3: prow burst — the heaviest red, on the port bow flank.
        # Placed forward of the shoulder where the reference concentrates its
        # tally marks.  70 % of local bow flank height (hh ≈ h*0.33 here).
        sg3_z0    = -l * 0.490          # -3.528 — near the nose
        sg3_z1    = -l * 0.355          # -2.556 — mid bow zone
        sg_yo_bow = sf.section(st, (sg3_z0 + sg3_z1) * 0.5)[2]
        sv.stripe_group(parts, 'stripes-port-prow', 0.0, sg_yo_bow,
                        sg3_z0, sg3_z1, hull_mat,
                        height=2.0 * h * 0.33 * 0.70,   # 70 % of bow local flank
                        count=5, gap=0.22, inward=+1.0,
                        detail=detail,
                        surf=lambda z, yy: -sf.flank_x(st, z, yy))

        # ---- DONOR: FERROUS HEGEMONY ARMOUR RIB BELT (STBD SHOULDER) --------
        # Captured Hegemony armour rib belt, bolted to the starboard shoulder.
        # Ribs stand proud in +Y (upward from deck surface).
        # Backing -Y face buried 0.12 into hull top (>= 0.10 gate ✓).
        rib_loc_z = -l * 0.090              # z = -0.648, forward mid zone
        rib_sz    = 0.80                     # full Z length (absolute, not hull-scaled)
        rib_sx    = 0.28                     # full X width
        rib_sy    = 0.26                     # full Y height: backing (30%) + ribs (70%)

        rib_top   = sf.top_y(st, rib_loc_z, 0.0)   # hull deck top at belt station
        rib_flat  = sf.flat_half(st, rib_loc_z)     # flat deck half-width
        # Bury backing -Y face 0.12 into hull: loc.y - rib_sy*0.5 = rib_top - 0.12
        # → loc.y = rib_top - 0.12 + rib_sy*0.5
        rib_loc_y = rib_top - 0.12 + rib_sy * 0.5
        rib_loc_x = rib_flat * 0.42              # 42 % outboard on flat shoulder

        dn.donor_ferrous_ribs(parts, glow, 'rib-belt',
                              (rib_loc_x, rib_loc_y, rib_loc_z),
                              hull_mat, glow_mat,
                              (rib_sx, rib_sy, rib_sz),
                              detail=detail, n_ribs=5)

        # Two weld straps: secure the rib belt, bridge hull and belt.
        # rib_strap_sy is the Y half-extent passed to kit.box.
        # Centre the strap at rib_top so:
        #   bottom = rib_top - rib_strap_sy = hull_top - 0.12  → burial 0.12 ✓
        #   top    = rib_top + rib_strap_sy = hull_top + 0.12  → inside belt ✓
        # The belt backing bottom is at rib_top - 0.12 (same as strap bottom),
        # giving >= 0.12 overlap with both the hull body and the belt body.
        rib_strap_sy = 0.12
        rib_strap_y  = rib_top          # straddles the hull/belt interface
        dn.weld_strap(parts, 'rib-strap-fwd',
                      (rib_loc_x, rib_strap_y, rib_loc_z - rib_sz * 0.26),
                      hull_mat,
                      size=(rib_sx + 0.08, rib_strap_sy, 0.18),
                      bolts=4, detail=detail)
        dn.weld_strap(parts, 'rib-strap-aft',
                      (rib_loc_x, rib_strap_y, rib_loc_z + rib_sz * 0.26),
                      hull_mat,
                      size=(rib_sx + 0.08, rib_strap_sy, 0.18),
                      bolts=4, detail=detail)

        # Cut edge at the forward face — ragged torch-cut margin reveals the
        # belt was taken from a Ferrous Hegemony ship, not ordered new.
        # Teeth extend in +Z (into the belt body) from the severed forward face.
        rib_cut_z = rib_loc_z - rib_sz * 0.5   # forward face of the rib belt
        dn.cut_edge(parts, 'rib-cut-fwd',
                    (rib_loc_x, rib_loc_y, rib_cut_z),
                    hull_mat,
                    size=(rib_sx, rib_sy, 0.14),
                    teeth=5, detail=detail)

        # ---- SHOULDER PLATE COURSES (DECK) ----------------------------------
        # Flat armor strake run across the mid-zone shoulder deck.
        # kit.plate_course: for axis='z', Z arg is full span; X, Y are half-extents.
        crs_z_ctr = 0.0
        crs_span  = l * 0.300                           # 2.16 units full Z span
        crs_top   = sf.top_y(st, crs_z_ctr, 0.0) - h * 0.006
        crs_flat  = sf.flat_half(st, crs_z_ctr)
        n_courses = 4 if detail >= 2 else 3
        kit.plate_course(parts, 'shoulder-courses', H,
                         (0.0, crs_top, crs_z_ctr),
                         (crs_flat * 2.0, h * 0.038, crs_span),
                         hull_mat, count=n_courses, axis='z', bevel=h * 0.004)

        # Panel seams on the calm starboard flank — no stripes on this side.
        # kit.panel_lines takes HALF-extents.
        pl_z_ctr = crs_z_ctr
        pl_fx    = sf.flank_x(st, pl_z_ctr, 0.0)
        pl_yo    = sf.section(st, pl_z_ctr)[2]
        n_plines = 3 if detail >= 3 else 2
        kit.panel_lines(parts, 'stbd-panel-seams',
                        (pl_fx * 0.60, pl_yo, pl_z_ctr),
                        (pl_fx * 0.38, h * 0.60, crs_span),
                        hull_mat, count=n_plines, axis='z', depth=0.25)

        # ---- GUN PORTS — three shutter wells, all closed --------------------
        # Two on the starboard flank (mid zone), one dorsal.
        gp_yo = sf.section(st, -l * 0.080)[2]
        for gi, gz in enumerate((-l * 0.080, l * 0.060)):
            gp_fx = sf.flank_x(st, gz, gp_yo)
            hw.shutter_well(parts, 'gun-port-stbd.%02d' % gi,
                            (gp_fx - 0.10, gp_yo, gz),
                            hull_mat, (0.22, 0.18, 0.28),
                            plates=2 if detail >= 2 else 0,
                            open_frac=0.0, detail=detail)

        dors_z   = l * 0.010
        dors_top = sf.top_y(st, dors_z, 0.0)
        hw.shutter_well(parts, 'gun-port-dorsal',
                        (0.0, dors_top - 0.09, dors_z),
                        hull_mat, (0.26, 0.18, 0.32),
                        plates=2 if detail >= 2 else 0,
                        open_frac=0.0, detail=detail)

    # =========================================================================
    # EMISSIVE HARDWARE  (detail 2+)
    # =========================================================================
    if detail >= 2:
        # Bow port lights — transverse row across the bow shoulder top deck.
        win_z   = -l * 0.360
        win_top = sf.top_y(st, win_z, 0.0)
        n_wins  = 5 if detail >= 3 else 4
        kit.window_row(glow, 'bow-port-lights',
                       (0.0, win_top - sf.PORT_LIGHT[1] * 0.70, win_z),
                       glow_mat, n_wins, sf.PORT_SPACING, sf.PORT_LIGHT)

        # Amber slit window rows — low on BOTH flanks across the mid zone.
        # Pattern from frigate.py: loop over Z positions, window_row(count=1).
        # sf.FLANK_PORT = (0.06, 0.13, 0.20) — x-depth, y-height, z-width.
        # sf.flank_anchor positions the window half-buried in the hull surface.
        fw_win_y = sf.straight_bottom(st, 0.0) + sf.FLANK_PORT[1] * 0.70
        fw_z0    = bow_mid_z  + l * 0.04
        fw_z1    = mid_stern_z - l * 0.04
        fw_z_span = fw_z1 - fw_z0
        n_fw     = min(9, int(fw_z_span / sf.PORT_SPACING) + 1)
        n_fw     = n_fw if detail >= 3 else max(5, n_fw - 2)
        for wi in range(n_fw):
            wz  = fw_z0 + wi * sf.PORT_SPACING
            wfx = sf.flank_anchor(st, wz, fw_win_y, sf.FLANK_PORT[0] * 0.5)
            if wfx <= 0.0:
                continue
            kit.window_row(glow, 'fw-port.%02d' % wi,
                           (-wfx, fw_win_y, wz), glow_mat, 1, 0.0, sf.FLANK_PORT)
            kit.window_row(glow, 'fw-stbd.%02d' % wi,
                           ( wfx, fw_win_y, wz), glow_mat, 1, 0.0, sf.FLANK_PORT)

        # Port shoulder lamp run.
        lamp_z0    = bow_mid_z + l * 0.015
        lamp_z1    =  l * 0.060
        lamp_z_mid = (lamp_z0 + lamp_z1) * 0.5
        lamp_y     = sf.straight_top(st, lamp_z_mid) - 0.02
        lamp_ax    = sf.flank_anchor(st, lamp_z_mid, lamp_y, 0.03)
        hw.lamp_run(parts, glow, 'port-shoulder-lamps',
                    -lamp_ax, lamp_y, lamp_z0, lamp_z1,
                    glow_mat, hull_mat, sf.LAMP_SPACING, detail=detail)

        # Drive status slits — one amber slit above each drive housing.
        kit.window_row(glow, 'drive-status-port',
                       (drv_p_cx,
                        drv_p_cy + drv_p_r + sf.STATUS_SLIT[1] * 0.5 + 0.02,
                        drv_p_z  - drv_p_dep * 0.20),
                       glow_mat, 1, 0.0, sf.STATUS_SLIT)
        kit.window_row(glow, 'drive-status-stbd',
                       (drv_s_cx,
                        drv_s_cy + drv_s_r + sf.STATUS_SLIT[1] * 0.5 + 0.02,
                        drv_s_z  - drv_s_dep * 0.20),
                       glow_mat, 1, 0.0, sf.STATUS_SLIT)

    # =========================================================================
    # GREEBLE FIELDS  (detail 3 only)
    # =========================================================================
    if detail >= 3:
        # Bow shoulder surface gear — kit.greeble_field takes HALF-extents.
        grb_z    = -l * 0.350
        grb_top  = sf.top_y(st, grb_z, 0.0) - h * 0.012
        grb_flat = sf.flat_half(st, grb_z)
        kit.greeble_field(parts, 'bow-shoulder-gear', T,
                          (0.0, grb_top, grb_z),
                          (grb_flat * 1.70, h * 0.030, l * 0.11),  # half-extents
                          hull_mat, seed=441, count=8, detail=detail)
