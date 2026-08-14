"""Red Ledger -- FRIGATE, the clan command ship.

Bible §4.4: "A long raiding command vessel whose forward third is dedicated
to pursuit and boarding, middle to weapons and command, and stern to captured
drives.  Use disciplined red tally bands to unify mismatched parts."

Three zones along the thrust axis (nose at -Z, stern at +Z):

  BOW   32 %  z ≈ -15.2 → -5.6   HARD SECTION (k=0.08) — very angular chase
              hull, near-box cross-section; centreline breach tube (lit mouth
              at -Z), two grapple arms from the forward shoulders, two transfer
              locks on the gallery flanks (entry -Z), two reverse blocks on
              outboard bow shoulders (nozzles -Z).  Salvage boom rooted in the
              forward keel, hanging below and forward of the bow.
              Section family: sf.hard_section(k=0.08) — maximum angularity.

  MID   45 %  z ≈ -5.6  → +8.2   HARD SECTION (k=0.16) — armoured command
              citadel; three-step rising citadel (step1 wide base, step2
              weapons platform, step3 command peak); plate_quilt over both
              flanks and both citadel vertical faces; six closed shutter-wells
              on the step1 deck; two barbette turrets on step1 shoulders; one
              counting_house (port); starboard hangar bay with prize craft on
              two clamp pads; 20 amber window slits at sf.PORT_SPACING on the
              citadel belt (both flanks); three lamp runs; sensor_mast on step3
              crown.  Veridian Combine instrument head donor on the citadel
              forward face, with two weld straps and a cut edge.
              Section family: sf.hard_section(k=0.16) — standard armoured.

  STERN 23 %  z ≈ +8.2  → +15.2  FAIR sections — widened drive rack captured
              from a rounded donor hull; three mismatched captured drive packages
              (2 / 4 / 6 nozzles, different radii and z-offsets); Freehold
              Compact habitation drum lashed to the port keel as a prize hold,
              with two weld straps and a cut edge; two flat radiator panels
              (port); plate_quilt on both stern flanks.
              Section family: sf.fair() — rounded; reads as a different capture.

Salvage boom:
  Root at (0, keel_y+0.28, z≈-9.6) buried inside the forward keel (was
  +0.14 — the island probe found the five root-bay lattice groups under
  the gallery floating; the shallow root left the chord struts under the
  0.10-unit connectivity minimum of parent contact, so the cross-braces
  and drop struts hung off them lost their parent body).
  Tip at (0, keel_y_tip-0.55, z≈-15.0), hanging below and forward of the
  bow (dip reduced 0.90 → 0.55 so the lattice stays compact).
  Z-span ≈ 5.44 u, total length ≥ 5.44 u = 16.3 % of the 33.4 span. ≥15 % ✓
  Jaw apex ≈ z = -15.7, below the keel line in side view.

Donor parts:
  (a) Veridian Combine instrument head — citadel forward face; +Z face buried
      0.12 into step3 body; two Z-running weld straps at the head/step3 junction;
      cut edge on the aperture rim.  A stolen Ledger survey scanner, nose forward.
  (b) Freehold Compact habitation drum — port stern keel; cylinder centre at
      hull bottom_y so the top half is inside the hull; two weld straps at the
      drum-hull interface; cut edge on the drum -Z face.  Somebody's crew home,
      now a prize hold lashed under the stern.

Deliberate asymmetry:
  Three captured drives at different z/y offsets and nozzle counts at the stern.
  Starboard hangar bay with prize craft amidships.
  Veridian head offset 0.20 to starboard on the citadel forward face.
  Stripe clusters run on the STARBOARD belt through all three zones and on
  the citadel forward face; the single port cluster is the heavy bow-gallery
  burst where the reference puts its heaviest red.

Surface language pass (quilt + stripe legibility, island seating):
  Plate quilt covers every zone flank keel-to-crown plus deck and keel runs
  in all three zones (mid deck excluded: the three citadel steps stand on
  it, leaving only slivers of bare deck).  Every lofted run passes surf=
  (sf.flank_x / sf.top_y / sf.bottom_y over the station list) and
  role_mix=(0.55, 0.36, 0.09); hull-run pitch is 0.75.  The five citadel
  STEP quilts keep their flat constant-x / constant-y figures with no surf:
  the steps are separated chamfer_block volumes with planar faces, so one
  flat figure per face is exact there.
  Stripe heights are 0.55-0.80 of the LOCAL flank height (2*hh) at each
  cluster's own station; gap stays the absolute 0.22 (= sf.TALLY_SPACING);
  one flank per cluster.  Accent area (detail 3, 28 stripes):
    bow stbd 5 + gallery port 7 = 12 × (0.34 × ≈2.19) ≈ 8.9 sq
    mid stbd 5 × (0.34 × ≈4.98) ≈ 8.5 sq
    stern stbd 5 × (0.34 × ≈3.46) ≈ 5.9 sq
    citadel face 6 × (0.34 × 1.28) ≈ 2.6 sq
    total ≈ 25.9 sq / hull ≈ 580 sq (zones ≈ 101 + 330 + 146) ≈ 4.5 % ✓ (3-8 %)
  Quilt triangle arithmetic (detail 3; 12 tris/plate, 12 tris/seam strip):
    mid flanks   2 × (18 cols × 8 rows + 7×18 seams) × 12 = 6 480
    bow flanks   2 × (12 × 4 + 3×12) × 12                = 2 016
    stern flanks 2 × ( 9 × 6 + 5×9)  × 12                = 2 376
    bow deck + keel   2 × (12 × 3 + 2×12) × 12           = 1 440
    stern deck + keel 2 × ( 9 × 3 + 2×9)  × 12           = 1 080
    mid keel          (18 × 4 + 3×18) × 12               = 1 512
    step faces (flat, geometry unchanged)                = 4 992

Measured (Blender bake): verts 58 336, span 33.4, len/beam 4.29, ht/len 0.39, beam/len 0.23, proxy cover 99.2%, lod0 30 312 tris, lod1 10 760 tris, lod2 1 836 tris, probe-ship-islands: ONE CONNECTED BODY.

Commands:
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P scripts/build-ship-assets.py -- redledger
node scripts/compress-ship-assets.mjs redledger
node scripts/measure-ships.mjs redledger
node scripts/probe-ship-islands.mjs redledger frigate lod0
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import hardware as hw
from . import salvage as sv
from . import donors as dn


# ---------------------------------------------------------------------------
# Hull station list
# ---------------------------------------------------------------------------

def _frigate_stations(l, b, h):
    """Clan command ship hull stations, bow to transom.

    Three section families so each zone reads as a different captured section:
      bow   (k=0.08) — very shallow chamfer, near-box angular chase hull
      mid   (k=0.16) — standard hard-section armoured citadel
      stern (fair)   — rounded, squatter; a different donor hull section

    Max half-beam b*0.28 keeps mid-zone beam narrow for len/beam >= 2.9.
    Grapple arm tips at b*0.25 stay within the narrowed hull footprint so
    they do not add to the measured beam.
    """
    return [
        # Bow zone -- HARD SECTION k=0.08 -- angular boarding gallery
        sf.hard_section(-l * 0.475, b * 0.04,  h * 0.08, -h * 0.06, k=0.08),
        sf.hard_section(-l * 0.42,  b * 0.06,  h * 0.12, -h * 0.04, k=0.08),
        sf.hard_section(-l * 0.35,  b * 0.10,  h * 0.17, -h * 0.02, k=0.08),
        sf.hard_section(-l * 0.28,  b * 0.15,  h * 0.22, -h * 0.01, k=0.08),
        sf.hard_section(-l * 0.175, b * 0.20,  h * 0.26,  h * 0.00, k=0.08),
        # Mid zone -- HARD SECTION k=0.16 -- armoured command citadel
        sf.hard_section(-l * 0.17,  b * 0.26,  h * 0.44,  h * 0.02),
        sf.hard_section(-l * 0.08,  b * 0.28,  h * 0.46,  h * 0.02),
        sf.hard_section( l * 0.00,  b * 0.28,  h * 0.46,  h * 0.02),
        sf.hard_section( l * 0.10,  b * 0.28,  h * 0.46,  h * 0.02),
        sf.hard_section( l * 0.20,  b * 0.27,  h * 0.44,  h * 0.01),
        sf.hard_section( l * 0.255, b * 0.26,  h * 0.42,  h * 0.00),
        # Stern zone -- FAIR -- rounded drive rack (different donor section)
        sf.fair( l * 0.26,  b * 0.26,  h * 0.40,  h * 0.00),
        sf.fair( l * 0.36,  b * 0.26,  h * 0.38, -h * 0.01),
        sf.fair( l * 0.475, b * 0.22,  h * 0.34, -h * 0.02),
    ]


# ---------------------------------------------------------------------------
# Builder entry point
# ---------------------------------------------------------------------------

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Red Ledger clan command ship (frigate class).

    detail 3 -- full build
    detail 2 -- fewer repeats: halved windows; thinner lamp/stripe density
    detail 1 -- hull + seams + citadel steps + drives + plate courses
               + the coarse mid-flank quilt course only (quilt density
               belongs to detail >= 2)
    detail 0 -- hull loft + gallery armour block (ROLE_HULL + ROLE_ARMOUR:
               two roles survive every LOD)
    """
    H = kit.ROLE_HULL
    A = kit.ROLE_ARMOUR
    T = kit.ROLE_TRIM
    R = kit.ROLE_RECESS

    st = _frigate_stations(l, b, h)

    # ── Zone boundary z values ──────────────────────────────────────────────
    z_bow     = -l * 0.475   # ≈ -15.20  bow tip
    z_gal_mid = -l * 0.175   # ≈  -5.60  bow / mid seam
    z_mid_drv =  l * 0.255   # ≈  +8.16  mid / stern seam
    z_stern   =  l * 0.475   # ≈ +15.20  transom

    # ── Zone centres and lengths ────────────────────────────────────────────
    z_fwd_ctr = (z_bow + z_gal_mid) * 0.5        # ≈ -10.40
    z_mid_ctr = (z_gal_mid + z_mid_drv) * 0.5    # ≈  +1.28
    z_drv_ctr = (z_mid_drv + z_stern) * 0.5      # ≈ +11.68

    z_fwd_len = (z_gal_mid - z_bow) * 0.88       # ≈  8.45  (gallery run)
    z_mid_len = (z_mid_drv - z_gal_mid) * 0.88   # ≈ 12.07  (citadel run)
    z_drv_len = (z_stern - z_mid_drv) * 0.88     # ≈  6.19  (drive rack run)

    # ── Key surface queries ─────────────────────────────────────────────────
    # All computed at the centreline (x=0) to avoid hull-width drift issues.
    deck_y   = sf.top_y(st,    0.0, 0.0)   # hull deck y at z=0 ≈ +4.00
    keel_y   = sf.bottom_y(st, 0.0, 0.0)  # hull keel y at z=0 ≈ -3.66
    belt_y   = deck_y - 1.10               # lamp / window belt ≈ +2.90

    # Forward zone hull top (used to anchor gallery hardware)
    z_gal_ctr  = z_fwd_ctr               # same as zone centre ≈ -10.40
    gal_top_y  = sf.top_y(st, z_gal_ctr, 0.0)  # hull top at gallery ≈ +1.43

    # ── Citadel step geometry ───────────────────────────────────────────────
    # Each step sinks 0.10 into the volume below for connectivity.
    # chamfer_block takes FULL extents (step1_hw * 2 is the full X extent).
    step1_h   = 1.60;  step1_hw = 2.60;  step1_len = 12.00
    step1_z   = z_mid_ctr - 0.50                        # ≈  +0.78
    step1_cy  = deck_y + step1_h * 0.5 - 0.10           # ≈  +4.70
    step1_top = step1_cy + step1_h * 0.5                # ≈  +5.50

    step2_h   = 1.40;  step2_hw = 1.90;  step2_len = 8.50
    step2_z   = step1_z - 0.80                          # ≈  -0.02
    step2_cy  = step1_top + step2_h * 0.5 - 0.10        # ≈  +6.10
    step2_top = step2_cy + step2_h * 0.5                # ≈  +6.80

    step3_h   = 1.20;  step3_hw = 1.30;  step3_len = 4.50
    step3_z   = step1_z - 1.40                          # ≈  -0.62
    step3_cy  = step2_top + step3_h * 0.5 - 0.10        # ≈  +7.30
    step3_top = step3_cy + step3_h * 0.5                # ≈  +7.90

    # ── Zone seam ring data ─────────────────────────────────────────────────
    sr1 = sf.seam_ring(st, z_gal_mid)   # (hw, hh, yo, ch) at bow/mid seam
    sr2 = sf.seam_ring(st, z_mid_drv)   # at mid/stern seam

    # ── Three mismatched captured drives ────────────────────────────────────
    # Different radii, depths, nozzle counts and positions reveal three seized
    # lineages.  Collar -Z face overlaps hull transom by collar_d >= 0.10 ✓
    drv_a_r = 0.65;  drv_a_d = 1.80;  drv_a_noz = 2   # port-keel, small
    drv_b_r = 0.90;  drv_b_d = 2.20;  drv_b_noz = 4   # centre-high, medium
    drv_c_r = 1.10;  drv_c_d = 2.40;  drv_c_noz = 6   # starboard-mid, large

    drv_base_y = sf.bottom_y(st, z_stern, 0.0)   # keel y at transom ≈ -3.0
    drv_a_loc  = (-2.00, drv_base_y + drv_a_r * 1.40, z_stern + drv_a_d * 0.5)
    drv_b_loc  = ( 0.30, 0.80,                          z_stern + drv_b_d * 0.5)
    drv_c_loc  = ( 2.80, -0.50,                         z_stern + drv_c_d * 0.5)

    # ── Hangar bay and prize craft ──────────────────────────────────────────
    hgr_z      = z_mid_ctr + 0.50              # bay centre z ≈ +1.78
    hgr_y      = keel_y * 0.28                 # bay centre y ≈ -1.02
    hgr_sd     = 2.00                          # bay full depth in X
    hgr_h_full = 1.80                          # bay full height
    hgr_len    = 3.20                          # bay full length in Z
    # Anchor the bay to the actual stbd hull flank at hgr_y height
    hgr_fx     = sf.flank_x(st, hgr_z, hgr_y)           # ≈ 4.74 (stbd hull)
    hgr_cx     = hgr_fx - hgr_sd * 0.5 + 0.15            # bay centre x ≈ 3.89

    # Prize craft: -X (inboard) face buried 0.12 into hull body for connectivity.
    # bay back wall x = hgr_fx - hgr_sd = 2.74
    pz_x2 = 1.50;  pz_y2 = 1.20;  pz_z2 = 2.40   # FULL extents
    pz_cx = (hgr_fx - hgr_sd) + pz_x2 * 0.5 - 0.12   # ≈ 3.37

    hgr_floor_y = hgr_y - hgr_h_full * 0.5           # bay floor y ≈ -1.92
    pad_h       = hgr_h_full * 0.28                   # clamp pad height ≈ 0.50
    pad_cy      = hgr_floor_y + pad_h * 0.5           # pad centre y ≈ -1.67

    # ── Salvage boom geometry ───────────────────────────────────────────────
    # Root is buried 0.28 inside the forward keel (was 0.14 — the island probe
    # found the five root-bay lattice groups under the gallery floating: at
    # 0.14 burial the chord struts crossed the keel skin with under the
    # 0.10-unit connectivity minimum of parent contact, so the cross-braces
    # and drop struts hung off them lost their parent body).
    # Tip dip reduced 0.90 -> 0.55 so the lattice stays compact; the z-span
    # 5.44 keeps total boom length >= 5.0 (15 % of the 33.4 span) regardless.
    boom_root_z   = -l * 0.30                              # ≈ -9.60
    boom_root_ky  = sf.bottom_y(st, boom_root_z, 0.0)      # keel y at root
    boom_root_y   = boom_root_ky + 0.28                    # 0.28 inside keel ✓

    boom_tip_z    = -l * 0.470                             # ≈ -15.04
    boom_tip_ky   = sf.bottom_y(st, z_bow + 0.20, 0.0)    # keel y near bow tip
    boom_tip_y    = boom_tip_ky - 0.55                     # 0.55 below keel ✓

    boom_root  = (0.0, boom_root_y, boom_root_z)
    boom_tip   = (0.0, boom_tip_y,  boom_tip_z)
    boom_radius = 0.12                                     # strut radius
    boom_jaw    = 0.90                                     # jaw spread width

    # ── Donor (a): Veridian Combine instrument head ─────────────────────────
    # Nose (aperture, -Z face) faces forward.  +Z face buried 0.12 into step3.
    # step3 -Z face: step3_z - step3_len*0.5 = -0.62 - 2.25 = -2.87
    # head centre z so head +Z face is 0.12 inside step3:
    #   vh_z + vh_sz*0.5 = step3_z - step3_len*0.5 + 0.12
    #   vh_z = step3_z - step3_len*0.5 - vh_sz*0.5 + 0.12
    vh_sx = 1.20;  vh_sy = 0.80;  vh_sz = 1.40   # FULL extents
    vh_z  = step3_z - step3_len * 0.5 - vh_sz * 0.5 + 0.12
    vh_x  = 0.20           # slight stbd offset (asymmetry)
    vh_y  = step3_cy       # same y-centre as step3 body

    # ── Donor (b): Freehold habitation drum ────────────────────────────────
    # Drum axis along Z.  Centre at hull bottom_y so top half overlaps hull.
    # radius = min(drum_sx, drum_sy) * 0.5 = 1.0  (overlap = 1.0 units) ✓
    drum_sx = 2.00;  drum_sy = 2.00;  drum_sz = 2.80   # FULL extents
    drum_z  = z_drv_ctr - 0.40                          # ≈ +11.28
    drum_x  = -2.20                                     # port side
    drum_y  = sf.bottom_y(st, drum_z, drum_x)          # keel y at drum pos

    # ==========================================================================
    # PRIMARY MASSES -- detail 0 and above
    # ==========================================================================
    kit.hull_loft(parts, 'fg-hull', H, st, hull_mat)

    # Armoured gallery-crown block — small ROLE_ARMOUR mass always present
    # (detail 0+) so COLOR_0 uniformity sees at least two distinct roles at
    # every LOD (same pattern as light.bow.armour).  Seated on the gallery
    # crown with 0.10 burial so it connects to the hull skin and cannot
    # float as an isolated island; 0.14 proud stays far below the mast tip,
    # so the measured spanY is unchanged.
    gal_ar_cy = gal_top_y + 0.12 - 0.10      # 0.14 proud, 0.10 buried ✓
    kit.box(parts, 'fg-gal-armour', A,
            (0.0, gal_ar_cy, z_gal_ctr),
            (sf.flat_half(st, z_gal_ctr) * 0.55, 0.12, l * 0.030), hull_mat)

    # ==========================================================================
    # detail >= 1: steps, seams, plate courses, quilts, drives, boom, donors
    # ==========================================================================
    if detail >= 1:

        # ── Three citadel steps ──────────────────────────────────────────────
        # chamfer_block takes FULL extents.  Each step sinks 0.10 into body below.
        kit.chamfer_block(parts, 'fg-step1', H,
                          (0.0, step1_cy, step1_z),
                          (step1_hw * 2.0, step1_h, step1_len),   # FULL extents
                          hull_mat, chamfer=step1_h * 0.16)
        kit.chamfer_block(parts, 'fg-step2', H,
                          (0.0, step2_cy, step2_z),
                          (step2_hw * 2.0, step2_h, step2_len),
                          hull_mat, chamfer=step2_h * 0.16)
        kit.chamfer_block(parts, 'fg-step3', H,
                          (0.0, step3_cy, step3_z),
                          (step3_hw * 2.0, step3_h, step3_len),
                          hull_mat, chamfer=step3_h * 0.18)

        # ── Zone seam capture collars ────────────────────────────────────────
        hw.capture_collar(parts, 'fg-seam-bm',
                          sr1[0], sr1[1], sr1[2], sr1[3],
                          z_gal_mid, hull_mat, depth=0.22, ribs=6, detail=detail)
        hw.capture_collar(parts, 'fg-seam-ms',
                          sr2[0], sr2[1], sr2[2], sr2[3],
                          z_mid_drv, hull_mat, depth=0.22, ribs=6, detail=detail)

        # ── Plate courses: none crosses a zone boundary ──────────────────────
        # plate_course semantics: (x, y, z) are HALF-extents for the axis
        # perpendicular to 'axis'; the axis figure (3rd arg here for axis='z')
        # is the FULL span.  All size values here are correctly sized.

        # Bow zone gallery flanks (2 runs)
        # y anchored well below hull top at z_fwd_ctr so y stays inside hull
        y_fwd_fl = gal_top_y * 0.40    # ≈ +0.57  (40 % of gallery top)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            fx_fwd = sf.flank_anchor(st, z_fwd_ctr, y_fwd_fl, 0.04)
            if fx_fwd > 0.0:
                kit.plate_course(parts, 'fg-pc-fwd-%s' % side, H,
                                 (sign * fx_fwd, y_fwd_fl, z_fwd_ctr),
                                 (0.18, h * 0.12, z_fwd_len),
                                 hull_mat, count=5, axis='z')

        # Mid zone hull flanks (2 runs)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            fx_mid = sf.flank_anchor(st, z_mid_ctr, belt_y, 0.04)
            if fx_mid > 0.0:
                kit.plate_course(parts, 'fg-pc-mid-%s' % side, H,
                                 (sign * fx_mid, belt_y, z_mid_ctr),
                                 (0.20, h * 0.18, z_mid_len),
                                 hull_mat, count=7, axis='z')

        # Citadel step1 flanks (2 runs, ROLE_ARMOUR -- adapter strakes)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.plate_course(parts, 'fg-pc-s1-%s' % side, A,
                             (sign * (step1_hw - 0.04), step1_cy, step1_z),
                             (0.14, step1_h * 0.74, step1_len * 0.88),
                             hull_mat, count=6, axis='z')

        # Stern zone drive rack flanks (2 runs)
        y_drv_fl = keel_y * 0.25
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            fx_drv = sf.flank_anchor(st, z_drv_ctr, y_drv_fl, 0.04)
            if fx_drv > 0.0:
                kit.plate_course(parts, 'fg-pc-drv-%s' % side, H,
                                 (sign * fx_drv, y_drv_fl, z_drv_ctr),
                                 (0.18, h * 0.20, z_drv_len),
                                 hull_mat, count=4, axis='z')

        # Ventral keel mid zone (1 run)
        kit.plate_course(parts, 'fg-pc-keel', H,
                         (0.0, keel_y + 0.10, z_mid_ctr),
                         (b * 0.20, 0.18, z_mid_len),
                         hull_mat, count=6, axis='z')

        # ── Plate quilts: faction's cut-and-welded surface language ─────────
        # Quilts are the primary vertex budget item and the dominant surface
        # read (plate_quilt docstring: 42-50 triangles per unit Z, rows=3).
        # Every lofted-hull run passes surf so each plate re-seats on the
        # tapering hull at its own station, pitch=0.75 on every hull run, and
        # role_mix=(0.55, 0.36, 0.09) on EVERY quilt so the weathered salvage
        # tone reads as patchwork (iron dominant, armour second, recess as
        # gaps).  Flank runs cover the FULL flank height keel-to-crown
        # (height = hh*1.90 centred on the section yo; surf trims the plates
        # that fall on the chamfers or above/below the hull).  No run crosses
        # a zone seam.
        #
        # The five citadel STEP quilts (s1/s2 flanks, s3 crown) keep their
        # flat constant-x / constant-y figures with NO surf: the steps are
        # separated chamfer_block volumes with planar faces, so one flat
        # figure per face is exact — a hull-surface callback would be wrong
        # there, not merely unnecessary.
        #
        # LOD gating: plate_quilt degrades internally (detail 1 → 1 row at
        # 2x pitch; detail 2 → rows//2 at 1.4x pitch).  Only the two mid-zone
        # flank runs emit at detail 1 (the coarse course); every other run is
        # gated detail >= 2 so the density belongs to the close LODs.
        #
        # Triangle arithmetic (detail 3; 12 tris/plate, 12 tris/seam strip):
        #   mid flanks   2 × (18 cols × 8 rows + 7×18 seams) × 12 = 6 480
        #   bow flanks   2 × (12 × 4 + 3×12) × 12                = 2 016
        #   stern flanks 2 × ( 9 × 6 + 5×9)  × 12                = 2 376
        #   bow deck + keel   2 × (12 × 3 + 2×12) × 12           = 1 440
        #   stern deck + keel 2 × ( 9 × 3 + 2×9)  × 12           = 1 080
        #   mid keel          (18 × 4 + 3×18) × 12               = 1 512
        #   step faces (flat, geometry unchanged)                = 4 992
        #   quilt total ≈ 19 896 tris (was ≈ 14 904) → lod0 ≈ 28 300 tris
        #   (< 40 000 cap); verts ≈ 44 704 + ≈1.92 × 4 992 ≈ 54 300, inside
        #   the 45 000-70 000 band.

        # Section figures at each zone centre drive the full-height runs.
        sec_fwd = sf.section(st, z_fwd_ctr)   # (hw, hh, yo, ch) gallery
        sec_mid = sf.section(st, z_mid_ctr)   # citadel
        sec_drv = sf.section(st, z_drv_ctr)   # drive rack

        # Mid zone flanks -- FULL keel-to-crown height (rows=8, pitch=0.75).
        # These two runs are the coarse course: the only quilts at detail 1.
        q_mid_y   = sec_mid[2]                        # section yo
        q_mid_ht  = sec_mid[1] * 1.90                 # ≈ 95 % of hull height
        q_mid_z0  = z_gal_mid + 0.30
        q_mid_z1  = z_mid_drv - 0.30
        sv.plate_quilt(parts, 'fg-q-mid-port',
                       0.0, q_mid_y, q_mid_z0, q_mid_z1,
                       q_mid_ht, hull_mat, 101, detail,
                       rows=8, pitch=0.75, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))
        # Mid zone stbd flank
        sv.plate_quilt(parts, 'fg-q-mid-stbd',
                       0.0, q_mid_y, q_mid_z0, q_mid_z1,
                       q_mid_ht, hull_mat, 102, detail,
                       rows=8, pitch=0.75, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))

        if detail >= 2:
            # Bow zone flanks -- full gallery height (rows=4, pitch=0.75).
            q_bow_y   = sec_fwd[2]                    # gallery section yo
            q_bow_ht  = sec_fwd[1] * 1.90
            q_bow_z0  = z_bow + 0.50
            q_bow_z1  = z_gal_mid - 0.30
            if sf.flank_x(st, z_fwd_ctr, q_bow_y) > 0.0:
                sv.plate_quilt(parts, 'fg-q-bow-port',
                               0.0, q_bow_y, q_bow_z0, q_bow_z1,
                               q_bow_ht, hull_mat, 103, detail,
                               rows=4, pitch=0.75, face='-x',
                               role_mix=(0.55, 0.36, 0.09),
                               surf=lambda z, yy: -sf.flank_x(st, z, yy))
                sv.plate_quilt(parts, 'fg-q-bow-stbd',
                               0.0, q_bow_y, q_bow_z0, q_bow_z1,
                               q_bow_ht, hull_mat, 104, detail,
                               rows=4, pitch=0.75, face='x',
                               role_mix=(0.55, 0.36, 0.09),
                               surf=lambda z, yy: sf.flank_x(st, z, yy))

            # Stern zone flanks -- full drive-rack height (rows=6, pitch=0.75).
            q_drv_y   = sec_drv[2]                    # drive-rack section yo
            q_drv_ht  = sec_drv[1] * 1.90
            q_drv_z0  = z_mid_drv + 0.30
            q_drv_z1  = z_stern - 0.30
            if sf.flank_x(st, z_drv_ctr, q_drv_y) > 0.0:
                sv.plate_quilt(parts, 'fg-q-drv-port',
                               0.0, q_drv_y, q_drv_z0, q_drv_z1,
                               q_drv_ht, hull_mat, 105, detail,
                               rows=6, pitch=0.75, face='-x',
                               role_mix=(0.55, 0.36, 0.09),
                               surf=lambda z, yy: -sf.flank_x(st, z, yy))
                sv.plate_quilt(parts, 'fg-q-drv-stbd',
                               0.0, q_drv_y, q_drv_z0, q_drv_z1,
                               q_drv_ht, hull_mat, 106, detail,
                               rows=6, pitch=0.75, face='x',
                               role_mix=(0.55, 0.36, 0.09),
                               surf=lambda z, yy: sf.flank_x(st, z, yy))

            # Forward gallery deck quilt (face='y', rows=3, pitch=0.75).
            # Hull top tapers toward the bow -- surf samples per-plate y.
            q_gal_x   = sf.flat_half(st, z_fwd_ctr)   # flat half-width
            sv.plate_quilt(parts, 'fg-q-galdeck',
                           0.0, 0.0, q_bow_z0, q_bow_z1,
                           q_gal_x * 1.55, hull_mat, 111, detail,
                           rows=3, pitch=0.75, face='y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.top_y(st, z, xx))

            # Bow keel quilt (face='-y') -- NEW run; its plates also give the
            # salvage boom root extra parent contact across the forward keel.
            sv.plate_quilt(parts, 'fg-q-bowkeel',
                           0.0, 0.0, q_bow_z0, q_bow_z1,
                           q_gal_x * 1.50, hull_mat, 114, detail,
                           rows=3, pitch=0.75, face='-y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.bottom_y(st, z, xx))

            # Mid zone keel quilt (face='-y', plates on hull belly).
            # Hull belly varies along z -- surf samples per-plate y position.
            q_keel_x  = sf.flat_half(st, z_mid_ctr)   # belly flat half-width
            sv.plate_quilt(parts, 'fg-q-keel',
                           0.0, 0.0, q_mid_z0, q_mid_z1,
                           q_keel_x * 1.50, hull_mat, 112, detail,
                           rows=4, pitch=0.75, face='-y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.bottom_y(st, z, xx))

            # Stern deck + keel quilts -- NEW runs, inside the drive-rack
            # zone only (no course crosses the mid/stern seam).
            # The mid zone deck is intentionally NOT quilted: the three
            # citadel steps stand on it (step1 spans nearly the whole zone),
            # leaving only slivers of bare deck.
            q_drv_fw  = sf.flat_half(st, z_drv_ctr)
            sv.plate_quilt(parts, 'fg-q-drvdeck',
                           0.0, 0.0, q_drv_z0, q_drv_z1,
                           q_drv_fw * 1.55, hull_mat, 115, detail,
                           rows=3, pitch=0.75, face='y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.top_y(st, z, xx))
            sv.plate_quilt(parts, 'fg-q-drvkeel',
                           0.0, 0.0, q_drv_z0, q_drv_z1,
                           q_drv_fw * 1.50, hull_mat, 116, detail,
                           rows=3, pitch=0.75, face='-y',
                           role_mix=(0.55, 0.36, 0.09),
                           surf=lambda z, xx: sf.bottom_y(st, z, xx))

            # Citadel step1 vertical face quilts (port & stbd, rows=5 pitch=0.70)
            # Flat side faces of the step1 chamfer block -- constant x, no surf.
            q_s1_z0   = step1_z - step1_len * 0.44
            q_s1_z1   = step1_z + step1_len * 0.44
            q_s1_ht   = step1_h * 0.80
            sv.plate_quilt(parts, 'fg-q-s1-port',
                           -step1_hw, step1_cy, q_s1_z0, q_s1_z1,
                           q_s1_ht, hull_mat, 107, detail,
                           rows=5, pitch=0.70, face='-x',
                           role_mix=(0.55, 0.36, 0.09))
            sv.plate_quilt(parts, 'fg-q-s1-stbd',
                           step1_hw, step1_cy, q_s1_z0, q_s1_z1,
                           q_s1_ht, hull_mat, 108, detail,
                           rows=5, pitch=0.70, face='x',
                           role_mix=(0.55, 0.36, 0.09))

            # Citadel step2 vertical face quilts (port & stbd, rows=3 pitch=0.80)
            # Flat side faces of the step2 chamfer block -- constant x, no surf.
            q_s2_z0   = step2_z - step2_len * 0.44
            q_s2_z1   = step2_z + step2_len * 0.44
            q_s2_ht   = step2_h * 0.78
            sv.plate_quilt(parts, 'fg-q-s2-port',
                           -step2_hw, step2_cy, q_s2_z0, q_s2_z1,
                           q_s2_ht, hull_mat, 109, detail,
                           rows=3, pitch=0.80, face='-x',
                           role_mix=(0.55, 0.36, 0.09))
            sv.plate_quilt(parts, 'fg-q-s2-stbd',
                           step2_hw, step2_cy, q_s2_z0, q_s2_z1,
                           q_s2_ht, hull_mat, 110, detail,
                           rows=3, pitch=0.80, face='x',
                           role_mix=(0.55, 0.36, 0.09))

            # Citadel step3 crown deck quilt.  Flat top of the step3 chamfer
            # block -- constant y, no surf.
            sv.plate_quilt(parts, 'fg-q-s3crown',
                           0.0, step3_top,
                           step3_z - step3_len * 0.44, step3_z + step3_len * 0.44,
                           step3_hw * 1.50, hull_mat, 113, detail,
                           rows=3, pitch=0.72, face='y',
                           role_mix=(0.55, 0.36, 0.09))

        # ── Breach tube: centreline, lit mouth faces -Z ──────────────────────
        hw.breach_tube(parts, glow, 'fg-bt',
                       z_fwd_ctr - 1.40,    # z0 mouth ≈ -11.80
                       z_gal_mid - 0.50,    # z1 into gallery ≈ -6.10
                       hull_mat, glow_mat, radius=0.55, detail=detail)

        # ── Three mismatched captured drives ─────────────────────────────────
        hw.captured_drive(parts, glow, 'fg-drv-a',
                          drv_a_loc, hull_mat, glow_mat,
                          drv_a_r, drv_a_d, drv_a_noz, detail)
        hw.captured_drive(parts, glow, 'fg-drv-b',
                          drv_b_loc, hull_mat, glow_mat,
                          drv_b_r, drv_b_d, drv_b_noz, detail)
        hw.captured_drive(parts, glow, 'fg-drv-c',
                          drv_c_loc, hull_mat, glow_mat,
                          drv_c_r, drv_c_d, drv_c_noz, detail)

        # ── Radiator panels: two flat panels port side ───────────────────────
        pan_t   = 0.28    # panel thickness in X (FULL)
        pan_lap = 0.12    # inward overlap with hull for connectivity

        z_rA = z_drv_ctr - 0.60;  y_rA = 0.0
        fx_rA = sf.flank_x(st, z_rA, y_rA)
        if fx_rA > 0.0:
            hw.radiator_panel(parts, 'fg-rad-a',
                              (-(fx_rA + pan_t * 0.5 - pan_lap), y_rA, z_rA),
                              hull_mat, (pan_t, 2.40, 5.00), detail=detail)

        z_rB = z_mid_ctr + 2.80;  y_rB = belt_y + 0.70
        fx_rB = sf.flank_x(st, z_rB, y_rB)
        if fx_rB > 0.0:
            hw.radiator_panel(parts, 'fg-rad-b',
                              (-(fx_rB + pan_t * 0.5 - pan_lap), y_rB, z_rB),
                              hull_mat, (pan_t, 1.80, 3.60), detail=detail)

        # ── Salvage boom: slung below forward keel ───────────────────────────
        # Root is INSIDE the hull (boom_root_y = keel_y + 0.14, above keel).
        # The chord struts start from this interior point and cross the keel
        # surface, hanging below the hull all the way to the tip.
        sv.salvage_boom(parts, glow, 'fg-boom',
                        boom_root, boom_tip,
                        hull_mat, glow_mat,
                        radius=boom_radius, jaw=boom_jaw,
                        detail=detail, bays=4)

        # ── Three lamp runs ─────────────────────────────────────────────────
        # Lamps are anchored to known flat surfaces (belt_y on hull flanks and
        # step1_cy on the citadel face) to avoid hull-curve drift islands.
        #
        # ISLAND FIX: the mid-zone hull flank is a constant 0.28b section only
        # up to z = l*0.10; aft of that it tapers inboard toward the drive
        # seam (0.27b at l*0.20, 0.26b at l*0.255).  A lamp_run carries ONE
        # strip anchor (taken at z_mid_ctr) for its whole length, so the aft
        # strip tail and its end lamp hung clear of the tapered flank — the
        # two floating groups the probe reported at y ≈ 1.26, z ≈ 7.26
        # (post-centring x −2.43 port / +1.74 stbd).  The runs below now end
        # where the constant-section flank ends (z = l*0.10), and the belt-end
        # lamps are re-added as a mirrored pair at the float station z = 7.26,
        # each anchored at ITS OWN z via sf.flank_anchor and mounted on a short
        # ROLE_TRIM plate whose inner face is buried 0.10 in the flank — the
        # same mounting pattern hw.lamp_run uses.

        # Run 1: stbd hull belt, mid zone (ends at the constant-section limit)
        lx_lamp = sf.flank_anchor(st, z_mid_ctr, belt_y, 0.0)
        hw.lamp_run(parts, glow, 'fg-lamp-stbd',
                    lx_lamp, belt_y,
                    z_gal_mid + 0.40, l * 0.10,
                    glow_mat, hull_mat, sf.LAMP_SPACING, detail)

        # Run 2: port hull belt, mid zone (mirror of run 1)
        hw.lamp_run(parts, glow, 'fg-lamp-port',
                    -lx_lamp, belt_y,
                    z_gal_mid + 0.40, l * 0.10,
                    glow_mat, hull_mat, sf.LAMP_SPACING, detail)

        # Re-seated belt-end lamp pair at z = 7.26 (the probe float station).
        z_lamp_end = 7.26
        lx_end = sf.flank_anchor(st, z_lamp_end, belt_y, 0.02)
        if lx_end > 0.0:
            for sign, side in ((1.0, 'stbd'), (-1.0, 'port')):
                # ROLE_TRIM mounting plate, half-extents (0.08, 0.02, 0.30):
                # inner face = (flank_x − 0.02) − 0.08 = flank_x − 0.10 ✓
                kit.box(parts, 'fg-lamp-end-plate-%s' % side, T,
                        (sign * lx_end, belt_y, z_lamp_end),
                        (0.08, 0.02, 0.30), hull_mat)
                # Amber lamp on the plate face, sunk 0.01 (lamp_run pattern:
                # strip at detail 1, lamps at detail 2+); glow-tagged.
                if detail >= 2:
                    lamp = kit.box(glow, 'fg-lamp-end-%s' % side, T,
                                   (sign * lx_end,
                                    belt_y + 0.02 + sf.WORK_LAMP[1] * 0.5 - 0.01,
                                    z_lamp_end),
                                   (sf.WORK_LAMP[0] * 0.5, sf.WORK_LAMP[1] * 0.5,
                                    sf.WORK_LAMP[2] * 0.5), glow_mat)
                    lamp['skin_role'] = 'glow'

        # Run 3: port face of citadel step1 (flat surface, no drift)
        hw.lamp_run(parts, glow, 'fg-lamp-cit',
                    -step1_hw, step1_cy,
                    step1_z - step1_len * 0.42, step1_z + step1_len * 0.42,
                    glow_mat, hull_mat, sf.LAMP_SPACING, detail)

        # ── Donor (b): Freehold Compact habitation drum ─────────────────────
        # Centre at hull bottom_y → top half (radius = 1.0 u) inside hull ✓
        dn.donor_freehold_drum(parts, glow, 'fg-drum',
                               (drum_x, drum_y, drum_z),
                               hull_mat, glow_mat,
                               (drum_sx, drum_sy, drum_sz), detail)

        # Two weld straps running along Z, inside the drum body and bridging
        # to the hull.  y = drum_y + drum_r*0.70 (well within cylinder at that
        # height, r_cross ≈ 0.71) keeps the straps inside the drum at all y
        # within the strap sy span.  x offsets ±0.20 (< r_cross 0.71) ensure
        # both straps sit inside the drum cross-section at that height. ✓
        drum_r        = min(drum_sx, drum_sy) * 0.5    # = 1.0 (radius)
        strap_body_y  = drum_y + drum_r * 0.70          # ≈ -2.54  (inside drum)
        strap_sz      = drum_sz + 0.22                  # full Z, +0.11 past drum each end
        dn.weld_strap(parts, 'fg-drum-strap-a',
                      (drum_x + 0.20, strap_body_y, drum_z),
                      hull_mat, (0.10, 0.10, strap_sz), bolts=5, detail=detail)
        dn.weld_strap(parts, 'fg-drum-strap-b',
                      (drum_x - 0.20, strap_body_y, drum_z),
                      hull_mat, (0.10, 0.10, strap_sz), bolts=5, detail=detail)

        # Cut edge at the drum's forward (-Z) face: ragged torch-cut end
        dn.cut_edge(parts, 'fg-drum-cut',
                    (drum_x, drum_y, drum_z - drum_sz * 0.5),
                    hull_mat, (drum_sx * 0.88, drum_sy * 0.88, 0.12),
                    teeth=6, detail=detail)

    # ==========================================================================
    # detail >= 2: boarding gear, weapons, command, greeble, donors, stripes
    # ==========================================================================
    if detail >= 2:

        # ── Grapple arms: port and stbd forward shoulders ────────────────────
        # Root INSIDE hull: 70 % of hull half-beam at the grapple z-station
        # keeps the root 30 % inside the hull body (radius 0.18 << 30 %). ✓
        z_gra   = -l * 0.27                    # ≈ -8.64
        y_gra   = gal_top_y * 0.48             # ≈ +0.69 (below hull top)
        gra_in  = 0.30                         # inset: flank_anchor returns
        #                                       #   flank_x - 0.30 → root is
        #                                       #   inside hull by 0.30 units ✓
        stbd_rx = sf.flank_anchor(st, z_gra, y_gra, gra_in)
        if stbd_rx > 0.0:
            hw.grapple_arm(parts, glow, 'fg-gra-stbd',
                           ( stbd_rx,  y_gra, z_gra),
                           ( b * 0.25, y_gra + 0.50, z_gra - l * 0.08),
                           hull_mat, glow_mat, radius=0.16, jaw=0.55,
                           detail=detail)
            hw.grapple_arm(parts, glow, 'fg-gra-port',
                           (-stbd_rx,  y_gra, z_gra),
                           (-b * 0.25, y_gra + 0.50, z_gra - l * 0.08),
                           hull_mat, glow_mat, radius=0.16, jaw=0.55,
                           detail=detail)

        # ── Transfer locks: gallery flanks, entry facing -Z ─────────────────
        # Bore seated with outer face 0.10 past hull surface = bore protrudes
        # 0.10 through hull (accessible from outside) while inner face (bore_r
        # deeper inside hull) is connected.  Flange disc added at detail >= 2
        # to bridge bore ↔ cage bars ↔ hull in voxel space.
        z_tlock  = -l * 0.34                  # ≈ -10.88
        y_tlock  = gal_top_y * 0.22           # ≈ +0.31
        tlk_size = (0.90, 0.90, 1.30)         # FULL extents
        bore_r   = min(tlk_size[0], tlk_size[1]) * 0.28    # = 0.252
        cage_r   = bore_r * 1.90                            # = 0.479
        stbd_tlx = sf.flank_anchor(st, z_tlock, y_tlock, bore_r - 0.10)
        if stbd_tlx > 0.0:
            for sign, side in ((1.0, 'stbd'), (-1.0, 'port')):
                hw.transfer_lock(parts, glow, 'fg-tlk-%s' % side,
                                 (sign * stbd_tlx, y_tlock, z_tlock),
                                 hull_mat, glow_mat, tlk_size, detail)
                # Cage-bow flange: thin disc bridging bore ↔ cage bars ↔ hull.
                # fl_r covers the cage ring plus one bar radius plus voxel margin.
                fl_z = z_tlock - tlk_size[2] * 0.5
                fl_r = cage_r + 0.025 + 0.06
                kit.cyl(parts, 'fg-tlk-flange-%s' % side, A,
                        (sign * stbd_tlx, y_tlock, fl_z),
                        fl_r, 0.06, hull_mat, rotation=sf.CYL_ALONG_Z)

        # ── Reverse blocks: outboard bow shoulders, nozzles face -Z ─────────
        z_rev    = -l * 0.36                  # ≈ -11.52
        rev_x    = b * 0.10                   # ≈  +1.25
        rev_size = (1.10, 0.85, 0.90)         # FULL extents
        rev_y    = sf.top_y(st, z_rev, rev_x) + rev_size[1] * 0.5 - 0.10
        hw.reverse_block(parts, glow, 'fg-rev-port',
                         (-rev_x, rev_y, z_rev),
                         hull_mat, glow_mat, rev_size, detail)
        hw.reverse_block(parts, glow, 'fg-rev-stbd',
                         ( rev_x, rev_y, z_rev),
                         hull_mat, glow_mat, rev_size, detail)

        # ── Six closed shutter wells on step1 deck ──────────────────────────
        well_sz  = (1.50, 0.65, 1.80)   # FULL extents
        well_cy  = step1_top - well_sz[1] * 0.5    # top face flush with step1 deck
        for wi, (wz, wx) in enumerate((
            (step1_z - step1_len * 0.30,  step1_hw * 0.60),
            (step1_z - step1_len * 0.30, -step1_hw * 0.60),
            (step1_z,                     step1_hw * 0.62),
            (step1_z,                    -step1_hw * 0.62),
            (step1_z + step1_len * 0.30,  step1_hw * 0.60),
            (step1_z + step1_len * 0.30, -step1_hw * 0.60),
        )):
            hw.shutter_well(parts, 'fg-well.%02d' % wi,
                            (wx, well_cy, wz),
                            hull_mat, well_sz, plates=2,
                            open_frac=0.0, detail=detail)

        # ── Barbette turrets: step1 shoulders ───────────────────────────────
        bar_r      = 0.50;  bar_h = 0.80
        bar_z      = step1_z - step1_len * 0.26
        bar_y_base = step1_top - 0.16    # base sinks 0.16 into step1 top ✓
        kit.barbette(parts, glow, 'fg-bar-port',
                    (-step1_hw + bar_r * 1.40, bar_y_base, bar_z),
                    hull_mat, glow_mat, radius=bar_r, height=bar_h)
        kit.barbette(parts, glow, 'fg-bar-stbd',
                    ( step1_hw - bar_r * 1.40, bar_y_base, bar_z),
                    hull_mat, glow_mat, radius=bar_r, height=bar_h)

        # ── Counting house: port side of citadel step1 ──────────────────────
        ch_size = (1.80, 1.40, 2.20)
        ch_z    = step1_z + 1.20
        ch_x    = -(step1_hw - ch_size[0] * 0.5 - 0.10)
        ch_y    = step1_top + ch_size[1] * 0.5 - 0.10
        hw.counting_house(parts, glow, 'fg-ch',
                          (ch_x, ch_y, ch_z),
                          hull_mat, glow_mat, ch_size, detail)

        # ── Hangar bay: recessed into stbd flank (ROLE_RECESS) ─────────────
        kit.box(parts, 'fg-hangar-bay', R,
                (hgr_cx, hgr_y, hgr_z),
                (hgr_sd, hgr_h_full, hgr_len),   # kit.box takes HALF-extents
                hull_mat)

        # ── Prize craft: -X face buried 0.12 into hull for connectivity ──────
        kit.chamfer_block(parts, 'fg-prize-craft', A,
                          (pz_cx, hgr_y, hgr_z),
                          (pz_x2, pz_y2, pz_z2),   # FULL extents
                          hull_mat, chamfer=0.18)

        # ── Clamp pads: bridge bay floor to prize craft bottom ───────────────
        for pad_i, pad_z in enumerate((hgr_z - 0.70, hgr_z + 0.70)):
            hw.clamp_pad(parts, 'fg-cp.%02d' % pad_i,
                         (pz_cx, pad_cy, pad_z),
                         hull_mat, (0.28, pad_h, 0.45),
                         teeth=2, detail=detail)

        # ── Sensor mast on the command peak (step3) ──────────────────────────
        mast_y = step3_cy + step3_h * 0.5    # = step3_top
        mast_z = step3_z - step3_len * 0.18
        kit.sensor_mast(parts, glow, 'fg-mast',
                        (0.0, mast_y, mast_z),
                        hull_mat, glow_mat, height=0.85, radius=0.08)

        # ── Gallery handrail (aft gallery where hull top is flat enough) ─────
        rail_z   = (z_fwd_ctr + z_gal_mid) * 0.5    # ≈ -7.92 (mid of aft gallery)
        rail_y   = sf.top_y(st, rail_z, 0.0) - 0.04
        kit.handrail(parts, 'fg-rail-gal',
                     (0.0, rail_y, rail_z),
                     hull_mat, length=l * 0.055, axis='z', posts=4)

        # ── Plate grids on two lower citadel deck faces ──────────────────────
        kit.plate_grid(parts, 'fg-pg-s1', H,
                       (0.0, step1_cy, step1_z),
                       (step1_hw * 2.0, step1_h, step1_len),
                       hull_mat, cols=6, rows=4, face='y', depth=0.18)
        kit.plate_grid(parts, 'fg-pg-s2', H,
                       (0.0, step2_cy, step2_z),
                       (step2_hw * 2.0, step2_h, step2_len),
                       hull_mat, cols=5, rows=3, face='y', depth=0.18)

        # ── Ventral keel panel lines (mid zone) ─────────────────────────────
        kit.panel_lines(parts, 'fg-pl-keel',
                        (0.0, keel_y + 0.08, z_mid_ctr),
                        (b * 0.34, 0.20, z_mid_len * 0.84),
                        hull_mat, count=4, axis='z', depth=0.28)

        # ── Amber windows on citadel belt at sf.PORT_SPACING ────────────────
        # Anchored to each window's own flank_anchor to prevent drift islands.
        win_n  = 20 if detail >= 3 else 10
        win_y  = belt_y - 0.12
        win_z0 = z_gal_mid + 1.00
        for wi in range(win_n):
            wz = win_z0 + wi * sf.PORT_SPACING    # absolute pitch, never scaled
            wx = sf.flank_anchor(st, wz, win_y, sf.FLANK_PORT[0] * 0.5)
            if wx <= 0.0:
                continue
            kit.window_row(glow, 'fg-win-port.%02d' % wi,
                           (-wx, win_y, wz), glow_mat, 1, 0.0, sf.FLANK_PORT)
            kit.window_row(glow, 'fg-win-stbd.%02d' % wi,
                           ( wx, win_y, wz), glow_mat, 1, 0.0, sf.FLANK_PORT)

        # ── Stripe groups: constant-pitch ROLE_ACCENT clusters ──────────────
        # "Disciplined red tally bands" — the class unifying device (bible).
        # CONSTANT gap=0.22 (= sf.TALLY_SPACING) across ALL clusters so every
        # stripe across every zone is at the same absolute pitch.
        # Heights are 0.55-0.80 of the LOCAL flank height (2*hh) at each
        # cluster's own station; y-centre is the local section yo so each
        # band stands centred on its flank.  One flank per cluster.
        # surf=flank_x per stripe so each band seats on the actual taper.
        #
        # Accent area budget (ROLE_ACCENT target 3-8 % of hull surface):
        #   bow stbd 5 + gallery port 7 = 12 × (0.34 × sg_bow_h ≈ 2.19) ≈ 8.9 sq
        #   mid stbd 5 × (0.34 × sg_mid_h ≈ 4.98)                   ≈ 8.5 sq
        #   stern stbd 5 × (0.34 × sg_drv_h ≈ 3.46)                 ≈ 5.9 sq
        #   citadel face 6 × (0.34 × 1.28)                          ≈ 2.6 sq
        #   total ≈ 25.9 sq / hull ≈ 580 sq (zones ≈ 101 + 330 + 146)
        #       ≈ 4.5 % ✓
        stripe_g  = 0.22       # absolute pitch (= sf.TALLY_SPACING)
        n_stripe  = 5 if detail >= 3 else 3
        sg_bow_h  = 2.0 * sec_fwd[1] * 0.70   # 70 % of gallery flank height
        sg_mid_h  = 2.0 * sec_mid[1] * 0.65   # 65 % of citadel flank height
        sg_drv_h  = 2.0 * sec_drv[1] * 0.55   # 55 % (fair stern chamfer deep)

        # Forward zone cluster (stbd gallery shoulder)
        if sf.flank_x(st, z_fwd_ctr, sec_fwd[2]) > 0.0:
            sv.stripe_group(parts, 'fg-sg-bow',
                            0.0, sec_fwd[2],
                            z_bow + 0.50, z_gal_mid - 0.20,
                            hull_mat, sg_bow_h, n_stripe,
                            gap=stripe_g, inward=-1.0, detail=detail,
                            surf=lambda z, yy: sf.flank_x(st, z, yy))

        # Bow-gallery cluster (PORT) — NEW: the reference puts its heaviest
        # red on the bow-gallery flank, so this is the densest cluster.
        if sf.flank_x(st, z_fwd_ctr, sec_fwd[2]) > 0.0:
            sv.stripe_group(parts, 'fg-sg-gal',
                            0.0, sec_fwd[2],
                            z_bow + 0.50, z_gal_mid - 0.20,
                            hull_mat, sg_bow_h, n_stripe + 2,
                            gap=stripe_g, inward=+1.0, detail=detail,
                            surf=lambda z, yy: -sf.flank_x(st, z, yy))

        # Mid zone cluster (stbd hull belt)
        if sf.flank_x(st, z_mid_ctr, sec_mid[2]) > 0.0:
            sv.stripe_group(parts, 'fg-sg-mid',
                            0.0, sec_mid[2],
                            z_gal_mid + 0.50, z_mid_drv - 0.50,
                            hull_mat, sg_mid_h, n_stripe,
                            gap=stripe_g, inward=-1.0, detail=detail,
                            surf=lambda z, yy: sf.flank_x(st, z, yy))

        # Stern zone cluster (drive rack stbd belt)
        if sf.flank_x(st, z_drv_ctr, sec_drv[2]) > 0.0:
            sv.stripe_group(parts, 'fg-sg-drv',
                            0.0, sec_drv[2],
                            z_mid_drv + 0.50, z_stern - 1.00,
                            hull_mat, sg_drv_h, n_stripe,
                            gap=stripe_g, inward=-1.0, detail=detail,
                            surf=lambda z, yy: sf.flank_x(st, z, yy))

        # Citadel face cluster (step1 stbd forward shoulder)
        # Flat face of citadel step1 chamfer block -- constant x, no surf.
        sv.stripe_group(parts, 'fg-sg-cit',
                        step1_hw, step1_cy,
                        step1_z - step1_len * 0.45, step1_z - step1_len * 0.10,
                        hull_mat, step1_h * 0.80, n_stripe + 1,
                        gap=stripe_g, inward=-1.0, detail=detail)

        # ── Donor (a): Veridian Combine instrument head ──────────────────────
        # Placed with +Z face buried 0.12 into the step3 forward face.
        dn.donor_veridian_head(parts, glow, 'fg-vhead',
                               (vh_x, vh_y, vh_z),
                               hull_mat, glow_mat,
                               (vh_sx, vh_sy, vh_sz), detail)

        # Two weld straps running along Z, straddling the head/step3 junction.
        # strap sz = vh_sz (same as head length) centres the strap at vh_z + 0.10
        # so that:
        #   -Z end = vh_z + 0.10 - vh_sz/2 = vh_z - 0.60 → 0.10 inside head ✓
        #   +Z end = vh_z + 0.10 + vh_sz/2 = vh_z + 0.80 → 0.10 inside step3 ✓
        #   (step3 -Z face at vh_z + vh_sz/2 = vh_z + 0.70)
        # x positions ±vh_sx*0.26 keep both straps inside the head's ±sx/2 range.
        vh_strap_sz = vh_sz           # 1.40 u — spans head -Z through step3 -Z face
        vh_strap_cz = vh_z + 0.10    # centre is 0.10 toward step3
        vh_strap_y  = vh_y + vh_sy * 0.32    # inside head top (< vh_sy/2 = 0.40)
        dn.weld_strap(parts, 'fg-vhead-strap-a',
                      (vh_x - vh_sx * 0.26, vh_strap_y, vh_strap_cz),
                      hull_mat, (0.09, 0.09, vh_strap_sz), bolts=4, detail=detail)
        dn.weld_strap(parts, 'fg-vhead-strap-b',
                      (vh_x + vh_sx * 0.26, vh_strap_y, vh_strap_cz),
                      hull_mat, (0.09, 0.09, vh_strap_sz), bolts=4, detail=detail)

        # Cut edge at the head's -Z (aperture) face: torch-cut margin
        dn.cut_edge(parts, 'fg-vhead-cut',
                    (vh_x, vh_y, vh_z - vh_sz * 0.5),
                    hull_mat, (vh_sx * 0.82, vh_sy * 0.82, 0.12),
                    teeth=5, detail=detail)

    # ==========================================================================
    # detail >= 3: greeble fields
    # ==========================================================================
    if detail >= 3:
        # `kit.greeble_field`'s `sy` is the FIELD BOX height, and each greeble is
        # 5-15 % of it, seated 15 % into the box's +Y face. A field box 0.06 tall
        # therefore emits greebles ~0.01 units tall — below the 0.06 voxel the
        # island probe rasterises at, so they cannot touch the deck and every one
        # becomes its own floating group. That is what `fg-grl-gal` was: five
        # floats at a single flat y. The field box must be a real box, seated so
        # its +Y face lands ON the deck: y = deck_top - sy * 0.5.
        gf_sy = 0.45

        # Command deck greeble (step3 crown)
        kit.greeble_field(parts, 'fg-grl-s3', T,
                          (0.0, step3_top - gf_sy * 0.5, step3_z),
                          (step3_hw * 1.55, gf_sy, step3_len * 0.78),
                          hull_mat, 417, 18, detail)

        # Gallery deck greeble. Two traps here, both hit once:
        #  * `kit.greeble_field`'s `sy` is the FIELD BOX height and each greeble
        #    is 5-15 % of it, so a 0.06-tall box emits sub-voxel greebles that
        #    cannot touch the deck at the probe's 0.06 voxel.
        #  * The gallery deck slopes, and seating the box on the run's LOWEST
        #    deck height buries the whole field inside the hull, which is just
        #    as detached as floating above it.
        # Sample the deck at the field's OWN station and keep the run short
        # enough that the deck barely moves across it.
        gal_gz   = z_gal_ctr + l * 0.04
        gal_grun = l * 0.055
        kit.greeble_field(parts, 'fg-grl-gal', T,
                          (0.0,
                           sf.top_y(st, gal_gz, 0.0) - gf_sy * 0.5,
                           gal_gz),
                          (sf.flat_half(st, gal_gz) * 1.05, gf_sy, gal_grun),
                          hull_mat, 421, 12, detail)

        # Citadel step2 deck greeble
        kit.greeble_field(parts, 'fg-grl-s2', T,
                          (0.0, step2_top - gf_sy * 0.5, step2_z),
                          (step2_hw * 1.45, gf_sy, step2_len * 0.72),
                          hull_mat, 433, 14, detail)

        # Citadel step1 deck greeble (weapon platform detail)
        kit.greeble_field(parts, 'fg-grl-s1', T,
                          (step1_hw * 0.40, step1_top - gf_sy * 0.5,
                           step1_z + step1_len * 0.25),
                          (step1_hw * 0.55, gf_sy, step1_len * 0.45),
                          hull_mat, 437, 12, detail)
