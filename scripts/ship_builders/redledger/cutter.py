"""Red Ledger — CUTTER, the boarding talon.

Bible §4.4: "forked grappling arms around a central breaching tube, strong
reverse thrust, prisoner/cargo transfer locks, and protected cockpit placement."

Three zones (SpaceShipIdeas/synthesis/20 rule 1):
  bow  25 %  z = -5.50 to -2.75  FORK ZONE — narrow faceted hard_section hull
             (k=0.16), tapered from nose (b×0.15) to shoulder (b×0.30).  Two
             salvage-boom prong arms (sv.salvage_boom) rooted inside the forward
             belly at z = -3.30 (port root x = -b×0.10, stbd root x = +b×0.10),
             sweeping forward and downward to tips below the keel line ahead of
             the hull bow face: port tip z ≈ -5.94, stbd tip z ≈ -5.72.  The
             breach tube runs the centreline between them, mouth at z = -5.665.
             Armoured brow cap backs the fork throat.  Two reverse-thrust blocks
             on the outboard bow shoulders, nozzles facing -Z.
  mid  50 %  z = -2.75 to +2.75  WORKING HULL — same hard_section family with
             k=0.22 (slightly more chamfered, reads as a different capture) and
             CONSTANT b×0.30 beam throughout.  Recessed armoured cockpit (dorsal,
             forward mid, z = -1.54).  Two flank transfer-lock cages at z = ±0.66.
             One closed shutter-well pair (dorsal, z = +0.44).  Plate quilt on
             both flanks and the working deck.  Stripe cluster (5 blocks) and
             tally band (11 strokes) on the starboard flank only.  Freehold
             habitation drum (prisoner hold) lashed to the working deck at
             z = +1.10 with two weld_straps and a cut_edge on its bow face.
  stern 25 %  z = +2.75 to +5.50  DRIVE ZONE — hard_section (k=0.16) tapering
             to b×0.10 at the transom.  Captured drive with 4-nozzle group;
             nozzle face flush with the transom at z = +5.50.  Two small flat
             radiator panels flanking the drive at z = +4.40.  Drive-status
             slits on a ROLE_TRIM plate overlapping the drive housing.

Zone seams: hw.capture_collar at z = -2.75 (bow/mid) and z = +2.75 (mid/stern).

Donor parts carried: ONE — dn.donor_freehold_drum at z = +1.10.  A Freehold
Compact habitation drum cut from its ship and lashed to the working deck as a
prisoner hold.  Two weld_straps (longitudinal, along Z, on drum top) and one
cut_edge on the drum bow face.  Connected through drum-bottom burial into hull.

Salvage boom fraction (sv.salvage_boom prongs):
  Port prong root z = -3.30, tip z = -5.94:
    dz=2.64, dx=0.37, dy=0.57 → root-to-tip ≈ 2.73 u = 24.8 % of l=11.0.
  Stbd prong root z = -3.30, tip z = -5.72:
    dz=2.42, dx=0.37, dy=0.45 → root-to-tip ≈ 2.50 u = 22.7 % of l=11.0.
  Both ≥ 15 % gate (1.65 u for l=11.0).

Deliberate asymmetry: port prong is LONGER (tip z = -5.94) and HEAVIER
(radius h×0.048) than stbd (tip z = -5.72, radius h×0.040).  Stripe group
and tally band run on the STARBOARD flank only.

Extent budget (absolute ship-space, l=11.0  b=5.28  h=3.30):
  z  min ≈ -5.94  (port prong tip)    max ≈ +5.50  (transom)   spanZ ≈ 11.44
  x  min ≈ -1.58  (hull mid beam)     max ≈ +1.58              spanX ≈  3.17
  y  min ≈ -1.39  (port prong tip)    max ≈ +1.90  (drum top)  spanY ≈  3.29

  spanZ/spanX ≈ 3.61 ≥ 3.0 ✓    (target 3.2-3.8)
  spanY/spanZ ≈ 0.29 ≤ 0.30 ✓
  spanX/spanZ ≈ 0.28 ≥ 0.16 ✓

Surface legibility (plate quilt + accent stripes):
  Quilt coverage: mid flanks bow-to-stern full height (h×0.76, rows=8, pitch=0.70);
    mid deck and keel bow-to-stern (rows=5/4, pitch=0.70); bow flanks full height
    (rows=6, pitch=0.70) with deck and keel bands; stern flanks (rows=6, pitch=0.70)
    with deck and keel bands.  All quilt runs use surf so plates self-trim at zone
    edges.  role_mix=(0.55, 0.36, 0.09) on all quilt runs.
  Accent stripes (ROLE_ACCENT, STARBOARD ONLY):
    Mid cluster: 5 stripes, height=1.65 u (66 % of local 2.51 u flank height),
      z=-0.66 to +1.76, gap=0.22.
    Prow cluster: 4 stripes, height=1.65 u (75 % of local 2.20 u flank height),
      z=-3.96 to -2.20, gap=0.22, beside the fork throat.
    Total accent face area: 9 × 0.34 × 1.65 ≈ 5.0 sq u.
    Hull surface area (rough): flanks 46 + deck/keel 33 ≈ 79 sq u.
    Accent coverage: 5.0 / 79 ≈ 6.4 % (gate: 3–8 %).

Float-fix record:
  Drive housing + collar: positioned with nozzle face at transom (z=+5.50);
    housing centre at z=+4.51, -Z face at z=+3.52 inside stern hull. ✓
  Lamp strips: anchored at flat_half(lamp_z1) and straight_top(lamp_z1);
    strip inner x-face buried at flat_half - 0.03 inside hull. ✓
  Stern status slits: placed on a ROLE_TRIM plate that overlaps the drive
    housing top face by ≥ 0.10 units. ✓

Measured (from the delivered assets; supersedes every design estimate above):
  Bake + check commands:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P
        scripts/build-ship-assets.py -- redledger
    node scripts/compress-ship-assets.mjs redledger
    node scripts/measure-ships.mjs redledger
    node scripts/probe-ship-islands.mjs redledger cutter lod0
  measure-ships redledger — ALL PASS, ladder monotone:
    verts 24522    span 11.9    len/beam 3.33    ht/len 0.32    beam/len 0.30
    proxy cover 100.0 %
  Triangles per LOD (caps lod0 60000 / lod1 24000 / lod2 8000):
    lod0 13028    lod1 6004    lod2 1880
  probe-ship-islands cutter lod0: ONE CONNECTED BODY.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import hardware as hw
from . import salvage as sv
from . import donors as dn


def _cutter_stations(l, b, h):
    """Boarding-talon hull stations, bow face to transom.

    Fifteen stations in two section families (k values):
    - Bow fork zone  (k=0.16, angular armoured plate, z = -l/2 to -l/4):
      tapers from b×0.15 at the nose to b×0.26 at the bow/mid seam.
    - Working hull   (k=0.22, slightly more chamfered working body,
                      CONSTANT b×0.26 beam, z = -l/4 to +l/4).
    - Stern drive zone (k=0.16, angular captured plate, z = +l/4 to +l/2):
      tapers from b×0.26 at mid seam to b×0.10 at the transom.
    The k-value change at each seam is the visible section-family boundary
    that reads as a welded capture seam at thumbnail size.
    """
    return [
        # ── bow fork zone: k=0.16, angular armoured plate ─────────────────
        sf.hard_section(-l * 0.50, b * 0.15, h * 0.22, -h * 0.008),      # nose
        sf.hard_section(-l * 0.44, b * 0.19, h * 0.26, -h * 0.004),
        sf.hard_section(-l * 0.36, b * 0.23, h * 0.30,  h * 0.006),
        sf.hard_section(-l * 0.30, b * 0.27, h * 0.33,  h * 0.010),
        sf.hard_section(-l * 0.25, b * 0.26, h * 0.35,  h * 0.012),  # bow/mid seam
        # ── working hull: k=0.22, constant beam b×0.26 ────────────────────
        sf.hard_section(-l * 0.18, b * 0.26, h * 0.37,  h * 0.014, k=0.22),
        sf.hard_section(-l * 0.08, b * 0.26, h * 0.38,  h * 0.016, k=0.22),
        sf.hard_section( 0.0,      b * 0.26, h * 0.38,  h * 0.016, k=0.22),
        sf.hard_section( l * 0.08, b * 0.26, h * 0.38,  h * 0.016, k=0.22),
        sf.hard_section( l * 0.18, b * 0.26, h * 0.37,  h * 0.014, k=0.22),
        sf.hard_section( l * 0.25, b * 0.26, h * 0.35,  h * 0.012, k=0.22),  # mid/stern seam
        # ── stern drive zone: k=0.16, taper to transom ────────────────────
        sf.hard_section( l * 0.32, b * 0.22, h * 0.32,  0.0),
        sf.hard_section( l * 0.40, b * 0.17, h * 0.28,  0.0),
        sf.hard_section( l * 0.46, b * 0.13, h * 0.25,  0.0),
        sf.hard_section( l * 0.50, b * 0.10, h * 0.22,  0.0),            # transom
    ]


# =============================================================================
# CUTTER — BOARDING TALON
# Called with l=11.0  b=5.28  h=3.30 (from CLASSES).
# =============================================================================
def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    A = kit.ROLE_ARMOUR
    T = kit.ROLE_TRIM
    R = kit.ROLE_RECESS

    st = _cutter_stations(l, b, h)

    # ── zone boundaries ────────────────────────────────────────────────────
    bow_z       = -l * 0.50    # hull bow face
    stern_z     =  l * 0.50    # hull transom
    bow_seam_z  = -l * 0.25   # bow / mid seam
    mid_seam_z  =  l * 0.25   # mid / stern seam

    # ── mid zone constants (CONSTANT b×0.26 hull, k=0.22) ─────────────────
    # At z=0: half_w=b*0.26, half_h=h*0.38, y_offset=h*0.016, k=0.22.
    # Narrowed from b×0.30 to b×0.26 to achieve len/beam >= 3.0.
    mid_hw   = b * 0.26                             # = 1.373 (half-width)
    mid_hh   = h * 0.38                             # = 1.254 (half-height at z=0)
    mid_yo   = h * 0.016                            # = 0.053 (y-offset at z=0)
    mid_ch   = 0.22 * min(mid_hw, mid_hh)           # = 0.276 (chamfer at mid; limited by hh)
    mid_flat = mid_hw - mid_ch                      # = 1.097 (flat half-width)
    mid_top  = mid_yo + mid_hh                      # = 1.307 (hull top at z=0)

    # ── cockpit: recessed dorsal armoured house (mid-forward) ─────────────
    ck_z       = -l * 0.14             # z = -1.54
    ck_top     = sf.top_y(st, ck_z)
    ck_flat    = sf.flat_half(st, ck_z)
    ck_house_h = h * 0.12              # FULL height of armoured house
    ck_house_l = l * 0.12              # FULL length along Z

    # ── captured drive — nozzle face flush with transom ─────────────────
    # chamfer_block FULL extents; size = (radius*2.4, radius*2.0, depth).
    drive_depth  = l * 0.18            # FULL depth (chamfer_block convention)
    drive_radius = h * 0.14            # real cylinder-equivalent radius
    # Centre z so nozzle face (+Z) is exactly at stern_z = +5.50.
    drive_z  = stern_z - drive_depth * 0.5    # = 5.50 - 0.99 = 4.51

    # ── prong geometry (sv.salvage_boom, one per side) ─────────────────────
    # Root: buried inside the forward belly at z=-l*0.30.
    # sf.bottom_y(st, -l*0.30) ≈ -(h*0.33 - h*0.010) ≈ -1.056
    prong_root_z = -l * 0.30           # z = -3.30
    prong_root_y = sf.bottom_y(st, prong_root_z) + 0.12   # ≈ -0.936, inside hull
    # Port prong (longer, heavier — deliberate asymmetry)
    prong_port_root = (-b * 0.10, prong_root_y, prong_root_z)
    prong_port_tip  = (-b * 0.03, -(h * 0.38 + h * 0.04), -l * 0.54)  # z=-5.94
    prong_port_r    = h * 0.048                             # radius
    # Stbd prong (shorter, lighter)
    prong_stbd_root = ( b * 0.10, prong_root_y, prong_root_z)
    prong_stbd_tip  = ( b * 0.03, -(h * 0.38 + h * 0.02), -l * 0.52)  # z=-5.72
    prong_stbd_r    = h * 0.040

    # ── reverse-thrust blocks (bow outboard shoulders, nozzles face -Z) ────
    rev_z  = -l * 0.42
    rev_y  =  h * 0.06
    rev_sx =  b * 0.14    # FULL extents for chamfer_block inside reverse_block
    rev_sy =  h * 0.16
    rev_sz =  h * 0.14

    # ── brow cap: armoured fork-throat backing ─────────────────────────────
    brow_z    = -l * 0.28
    brow_top  = sf.top_y(st, brow_z)
    brow_flat = sf.flat_half(st, brow_z)
    brow_hh   = h * 0.10              # FULL height (chamfer_block)
    brow_lz   = l * 0.05              # FULL length along Z

    # ── shutter well (dorsal, mid zone, forward of drum) ──────────────────
    shut_z    = l * 0.04
    shut_top  = sf.top_y(st, shut_z)
    shut_flat = sf.flat_half(st, shut_z)
    shut_hw   = shut_flat * 0.40
    shut_hh   = h * 0.08

    # ── Freehold drum donor (prisoner hold on working deck) ────────────────
    drum_lz   = l * 0.10              # drum centre z = 1.10
    drum_sz   = 1.00                  # drum FULL length in Z
    drum_sx   = 0.70                  # drum FULL extent in X (= diameter)
    drum_sy   = 0.70                  # drum FULL extent in Y (= diameter)
    drum_size = (drum_sx, drum_sy, drum_sz)
    drum_r    = min(drum_sx, drum_sy) * 0.5   # = 0.35 (matches donor internal calc)
    # Hull top at drum_lz; bury drum bottom 0.10 into hull deck.
    drum_deck_y = sf.top_y(st, drum_lz)
    drum_cy     = drum_deck_y - 0.10 + drum_r   # drum centre y ≈ 1.548

    # ── transfer lock dimensions ───────────────────────────────────────────
    lock_sx = 0.90
    lock_sy = 1.00
    lock_sz = 1.20
    bore_r_lock = min(lock_sx, lock_sy) * 0.28     # = 0.252
    cage_r_lock = bore_r_lock * 1.90               # = 0.479

    # ── tally band (STARBOARD ONLY, 11 strokes, mid zone) ─────────────────
    tally_z0  = -l * 0.10
    tally_z1  =  l * 0.10
    tally_y   =  h * 0.04
    tally_x   = sf.flank_x(st, 0.0, tally_y)
    tally_n   = 11 if detail >= 2 else 0

    # ── lamp runs (working deck edge, both flanks) ─────────────────────────
    # Anchored at the aft endpoint (z1) which is narrower than the mid so the
    # strip's x is inside the hull throughout its full Z run.
    lamp_z0  = -l * 0.14
    lamp_z1  =  l * 0.14
    # straight_top and flat_half at the AFTMOST point of the run.
    lamp_y   = sf.straight_top(st, lamp_z1)     # deck flat-top surface at z1
    lamp_x   = sf.flat_half(st, lamp_z1)        # flat half-width at z1

    # ── plate quilt parameters ─────────────────────────────────────────────
    # mid_hh varies slightly (h×0.35 at seams to h×0.38 at centre); all flank
    # quilts use surf so plates self-trim at each station.  quilt_h = mid_hh*2
    # spans the full mid flank; surf skips any plate whose y_r exits the hull.
    quilt_x  = mid_hw                            # = 1.373, hull flank (unused when surf set)
    quilt_y  = mid_yo                            # quilt band Y centre = yo
    quilt_z0 = bow_seam_z                        # = -2.75
    quilt_z1 = mid_seam_z                        # = +2.75
    quilt_h  = mid_hh * 2.0                      # full flank height = h × 0.76
    # Flat deck/keel X-spans for each zone; used only where mid deck is flat.
    deck_span_bow   = sf.flat_half(st, (bow_z + bow_seam_z) * 0.5) * 2.0
    deck_span_stern = sf.flat_half(st, (mid_seam_z + stern_z) * 0.5) * 2.0

    # ── stripe group (STARBOARD ONLY, two clusters) ───────────────────────
    # Mid cluster: z=-0.66 to +1.76, centred in forward mid band.
    stripe_z0 = -l * 0.06
    stripe_z1 =  l * 0.16
    stripe_y  =  h * 0.04
    # Prow cluster: z=-3.96 to -2.20, beside the fork throat (brow_z = -3.08).
    prow_stripe_z0 = -l * 0.36
    prow_stripe_z1 = -l * 0.20
    prow_stripe_y  =  h * 0.04

    # ── amber slit rows (low on both flanks, absolute PORT_SPACING pitch) ──
    win_y_low = -h * 0.12       # low on flank, above keel
    # Slit positions at PORT_SPACING pitch; slightly extended into bow/stern zones.
    win_zs = []
    _wz = -l * 0.22
    while _wz <= l * 0.22 + 1e-6:
        win_zs.append(_wz)
        _wz += sf.PORT_SPACING

    # ── drive status geometry ──────────────────────────────────────────────
    # Trim plate overlapping drive housing top face by 0.10 units.
    # Drive housing FULL height = drive_radius * 2.0; top face at +drive_radius.
    drive_top_y    = drive_radius                 # = h*0.14 = 0.462
    status_pl_hy   = h * 0.025                   # HALF-extent: thin trim plate
    status_pl_cy   = drive_top_y - 0.10 + status_pl_hy   # plate bottom = 0.10 inside housing top

    # ══════════════════════════════════════════════════════════════════════
    # PRIMARY MASSES — all detail levels
    # ══════════════════════════════════════════════════════════════════════
    kit.hull_loft(parts, 'cutter-hull', H, st, hull_mat)

    # ── Breach tube — centreline, lit mouth faces -Z ───────────────────
    # z0 = mouth, ahead of hull bow face (bow_z = -5.50).
    # z1 = welded into hull at z = -l*0.26 = -2.86 (well inside the bow zone).
    hw.breach_tube(parts, glow, 'breach-tube',
                   -l * 0.515, -l * 0.26,
                   hull_mat, glow_mat,
                   radius=h * 0.090, detail=detail)

    # ── Captured drive — 4-nozzle group, nozzle face at transom ───────
    # drive_z is housing centre; nozzle face at +5.50 (stern_z).
    hw.captured_drive(parts, glow, 'drive-main',
                      (0.0, 0.0, drive_z),
                      hull_mat, glow_mat,
                      radius=drive_radius, depth=drive_depth,
                      nozzles=4, detail=detail)

    # ── Flat radiator panels — flanking the drive, stern zone ──────────
    # rad_ext is a HALF-extent in X (radiator_panel calls kit.box).
    # Inner face = rad_fx - 0.10 (overlaps hull by 0.10 ✓).
    rad_cz  = l * 0.40           # panel centre z
    rad_ext = 0.14               # HALF-extent outboard in X
    rad_hh  = h * 0.16          # HALF-extent in Y
    rad_l   = drive_depth * 0.30 # HALF-extent along Z
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        rad_fx = sf.flank_x(st, rad_cz, -h * 0.04)
        if rad_fx > 0.0:
            rad_cx = sign * (rad_fx - 0.10 + rad_ext)
            hw.radiator_panel(parts, 'radiator-%s' % side,
                              (rad_cx, -h * 0.04, rad_cz),
                              hull_mat,
                              (rad_ext, rad_hh, rad_l),  # HALF-extents for kit.box
                              detail=detail)

    # ── Zone seam collars ─────────────────────────────────────────────
    for seam_z, collar_name in ((bow_seam_z, 'collar-bow-mid'),
                                (mid_seam_z, 'collar-mid-stern')):
        s_hw, s_hh, s_yo, s_ch = sf.seam_ring(st, seam_z)
        hw.capture_collar(parts, collar_name,
                          s_hw, s_hh, s_yo, s_ch,
                          seam_z, hull_mat,
                          depth=0.22, ribs=4, detail=detail)

    # ── Armoured brow cap — fork throat backing ─────────────────────────
    # chamfer_block takes FULL extents.
    kit.chamfer_block(parts, 'brow-cap', A,
                      (0.0, brow_top - brow_hh * 0.5, brow_z),
                      (brow_flat * 1.70, brow_hh, brow_lz),
                      hull_mat, chamfer=brow_hh * 0.40)

    # ══════════════════════════════════════════════════════════════════════
    # FORK ZONE — prongs and reverse thrust  (detail 1+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        # Port prong — longer, heavier (deliberate asymmetry)
        # Root buried at z=-3.30 inside belly; tip past hull bow, below keel.
        # Chord A root: (-b*0.10 - 4*r, prong_root_y, -3.30) inside hull ✓
        sv.salvage_boom(parts, glow, 'prong-port',
                        root=prong_port_root,
                        tip=prong_port_tip,
                        mat=hull_mat, glow_mat=glow_mat,
                        radius=prong_port_r,
                        jaw=b * 0.08,
                        detail=detail)

        # Stbd prong — shorter, lighter
        sv.salvage_boom(parts, glow, 'prong-stbd',
                        root=prong_stbd_root,
                        tip=prong_stbd_tip,
                        mat=hull_mat, glow_mat=glow_mat,
                        radius=prong_stbd_r,
                        jaw=b * 0.06,
                        detail=detail)

        # Reverse-thrust blocks (outboard bow shoulders, nozzles face -Z)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            # Inset = 20 % of block full X width so outer face protrudes hull
            rev_fx = sf.flank_anchor(st, rev_z, rev_y, rev_sx * 0.20)
            if rev_fx > 0.0:
                hw.reverse_block(parts, glow, 'rev-block-%s' % side,
                                 (sign * rev_fx, rev_y, rev_z),
                                 hull_mat, glow_mat,
                                 (rev_sx, rev_sy, rev_sz),
                                 detail=detail)

    # ══════════════════════════════════════════════════════════════════════
    # PLATE COURSES AND SURFACE LINES  (detail 1+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        # Brow banding — kit.plate_course axis='z':
        #   axis full Z span = brow_lz; cross HALF-extents = (X/2, Y/2).
        n_brow = 3 if detail >= 2 else 2
        kit.plate_course(parts, 'brow-banding', A,
                         (0.0, brow_top - brow_hh * 0.5, brow_z),
                         (brow_flat * 0.85, brow_hh * 0.5, brow_lz),
                         hull_mat, count=n_brow, axis='z')

        # Ventral panel lines — calm underside of working hull
        kit.panel_lines(parts, 'ventral-seams',
                        (0.0, sf.bottom_y(st, 0.0), 0.0),
                        (mid_hw * 0.50, h * 0.018, l * 0.40),
                        hull_mat, count=4, axis='z')

        # Bow dorsal strake — one plate_course along the bow zone top centreline.
        # plate_course axis='z': (X HALF, Y HALF, Z FULL).
        # Anchored at the z midpoint of the bow zone; stays on the loft top.
        bow_strake_z   = (bow_z + bow_seam_z) * 0.5            # = -4.125
        bow_strake_top = sf.top_y(st, bow_strake_z)
        bow_strake_fw  = sf.flat_half(st, bow_strake_z)
        kit.plate_course(parts, 'bow-dorsal-strake', H,
                         (0.0, bow_strake_top, bow_strake_z),
                         (bow_strake_fw * 0.70, h * 0.016,
                          (bow_seam_z - bow_z) * 0.75),
                         hull_mat, count=3, axis='z')

        # Mid dorsal strake — constant-section top of working hull.
        # Constant-section run: flat figure is exact without surf.
        kit.plate_course(parts, 'mid-dorsal-strake', H,
                         (0.0, mid_top, 0.0),
                         (mid_flat * 0.60, h * 0.016, l * 0.38),
                         hull_mat, count=4, axis='z')

        # Stern dorsal strake — drive zone top centreline.
        stern_strake_z   = (mid_seam_z + stern_z) * 0.5        # = +4.125
        stern_strake_top = sf.top_y(st, stern_strake_z)
        stern_strake_fw  = sf.flat_half(st, stern_strake_z)
        kit.plate_course(parts, 'stern-dorsal-strake', H,
                         (0.0, stern_strake_top, stern_strake_z),
                         (stern_strake_fw * 0.70, h * 0.016,
                          (stern_z - mid_seam_z) * 0.75),
                         hull_mat, count=3, axis='z')

    # ══════════════════════════════════════════════════════════════════════
    # COCKPIT — recessed armoured house  (detail 1+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        # chamfer_block FULL extents
        kit.chamfer_block(parts, 'cockpit-house', A,
                          (0.0, ck_top + ck_house_h * 0.5, ck_z),
                          (ck_flat * 1.10, ck_house_h, ck_house_l),
                          hull_mat, chamfer=h * 0.030)
        # Plate course on cockpit house; axis='z' → (X/2, Y/2, Z_full)
        kit.plate_course(parts, 'cockpit-banding', A,
                         (0.0, ck_top + ck_house_h * 0.5, ck_z),
                         (ck_flat * 0.55, ck_house_h * 0.5, ck_house_l),
                         hull_mat, count=3, axis='z')
        # Armoured visor slit — ROLE_RECESS, forward face; kit.box HALF-extents
        kit.box(parts, 'cockpit-slit', R,
                (0.0,
                 ck_top + ck_house_h * 0.70,
                 ck_z - ck_house_l * 0.5 - 0.01),
                (ck_flat * 0.40, h * 0.019, 0.04),
                hull_mat)

    # ══════════════════════════════════════════════════════════════════════
    # PLATE QUILT — all three zones, full flank coverage  (detail 1+)
    # All flank quilts use surf so each plate is seated at its own station.
    # Deck/keel quilts: surf adjusts y per plate; height is the zone's flat
    # X-span (flat separated deck face on each zone midpoint).
    # role_mix=(0.55, 0.36, 0.09): iron / weathered salvage / recess gaps.
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        # ── Mid flanks — full height bow-seam to mid-seam ─────────────────
        sv.plate_quilt(parts, 'quilt-stbd', 0.0, quilt_y,
                       quilt_z0, quilt_z1, quilt_h,
                       hull_mat, seed=731, detail=detail,
                       rows=8, pitch=0.70, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))
        sv.plate_quilt(parts, 'quilt-port', 0.0, quilt_y,
                       quilt_z0, quilt_z1, quilt_h,
                       hull_mat, seed=732, detail=detail,
                       rows=8, pitch=0.70, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))
        # ── Mid deck — constant-section flat face; surf adjusts y per plate ─
        sv.plate_quilt(parts, 'quilt-deck', 0.0, mid_top,
                       quilt_z0, quilt_z1, mid_flat * 2.0,
                       hull_mat, seed=733, detail=detail,
                       rows=5, pitch=0.70, face='y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.top_y(st, z, xx))
        # ── Mid keel ───────────────────────────────────────────────────────
        sv.plate_quilt(parts, 'quilt-keel', 0.0, sf.bottom_y(st, 0.0),
                       quilt_z0, quilt_z1, mid_flat * 2.0,
                       hull_mat, seed=734, detail=detail,
                       rows=4, pitch=0.70, face='-y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.bottom_y(st, z, xx))

        # ── Bow flanks — tapered; surf self-trims plates outside hull ──────
        sv.plate_quilt(parts, 'quilt-bow-stbd', 0.0, quilt_y,
                       bow_z, bow_seam_z, quilt_h,
                       hull_mat, seed=741, detail=detail,
                       rows=6, pitch=0.70, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))
        sv.plate_quilt(parts, 'quilt-bow-port', 0.0, quilt_y,
                       bow_z, bow_seam_z, quilt_h,
                       hull_mat, seed=742, detail=detail,
                       rows=6, pitch=0.70, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))
        # Bow deck — flat separated face at zone midpoint; surf adjusts y.
        sv.plate_quilt(parts, 'quilt-bow-deck', 0.0, sf.top_y(st, bow_z * 0.5 + bow_seam_z * 0.5),
                       bow_z, bow_seam_z, deck_span_bow,
                       hull_mat, seed=745, detail=detail,
                       rows=3, pitch=0.70, face='y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.top_y(st, z, xx))
        # Bow keel — symmetric with deck.
        sv.plate_quilt(parts, 'quilt-bow-keel', 0.0, sf.bottom_y(st, bow_z * 0.5 + bow_seam_z * 0.5),
                       bow_z, bow_seam_z, deck_span_bow,
                       hull_mat, seed=746, detail=detail,
                       rows=3, pitch=0.70, face='-y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.bottom_y(st, z, xx))

        # ── Stern flanks — tapered; surf self-trims plates outside hull ────
        sv.plate_quilt(parts, 'quilt-stern-stbd', 0.0, quilt_y,
                       mid_seam_z, stern_z, quilt_h,
                       hull_mat, seed=743, detail=detail,
                       rows=6, pitch=0.70, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))
        sv.plate_quilt(parts, 'quilt-stern-port', 0.0, quilt_y,
                       mid_seam_z, stern_z, quilt_h,
                       hull_mat, seed=744, detail=detail,
                       rows=6, pitch=0.70, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))
        # Stern deck — flat separated face at zone midpoint; surf adjusts y.
        sv.plate_quilt(parts, 'quilt-stern-deck', 0.0, sf.top_y(st, mid_seam_z * 0.5 + stern_z * 0.5),
                       mid_seam_z, stern_z, deck_span_stern,
                       hull_mat, seed=747, detail=detail,
                       rows=3, pitch=0.70, face='y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.top_y(st, z, xx))
        # Stern keel — symmetric with deck.
        sv.plate_quilt(parts, 'quilt-stern-keel', 0.0, sf.bottom_y(st, mid_seam_z * 0.5 + stern_z * 0.5),
                       mid_seam_z, stern_z, deck_span_stern,
                       hull_mat, seed=748, detail=detail,
                       rows=3, pitch=0.70, face='-y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.bottom_y(st, z, xx))

    # ══════════════════════════════════════════════════════════════════════
    # TRANSFER LOCKS — mid flanks, port and stbd  (detail 1+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        for lock_z, lock_side in ((-l * 0.06, 'port'), (l * 0.06, 'stbd')):
            sign = -1.0 if lock_side == 'port' else 1.0
            # Seat bore so its outboard face is 0.10 past hull surface.
            lx = sf.flank_anchor(st, lock_z, 0.0, bore_r_lock - 0.10)
            if lx > 0.0:
                hw.transfer_lock(parts, glow, 'transfer-%s' % lock_side,
                                 (sign * lx, 0.0, lock_z),
                                 hull_mat, glow_mat,
                                 (lock_sx, lock_sy, lock_sz),
                                 detail=detail)

                # Cage-bow flange: disc bridging bore → cage bars → hull (detail 2+)
                if detail >= 2:
                    fl_z = lock_z - lock_sz * 0.5
                    fl_r = cage_r_lock + 0.025 + 0.06
                    kit.cyl(parts, 'lock-flange-%s' % lock_side, A,
                            (sign * lx, 0.0, fl_z),
                            fl_r, 0.06, hull_mat, rotation=sf.CYL_ALONG_Z)

    # ══════════════════════════════════════════════════════════════════════
    # SHUTTER WELL — dorsal, mid zone  (detail 1+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        hw.shutter_well(parts, 'shutter-dorsal',
                        (0.0, shut_top - shut_hh * 0.5, shut_z),
                        hull_mat,
                        (shut_hw * 2.0, shut_hh, shut_hh * 1.6),
                        plates=2, detail=detail)

    # ══════════════════════════════════════════════════════════════════════
    # FREEHOLD DRUM DONOR — prisoner hold on working deck  (detail 1+)
    # Drum bottom face buried 0.10 into hull deck (drum_cy - drum_r = deck_y - 0.10).
    # Two weld_straps along Z on drum top (connected to drum ✓).
    # Cut_edge on drum bow face (shows the severed capture).
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 1:
        dn.donor_freehold_drum(parts, glow, 'drum-freehold',
                               (0.0, drum_cy, drum_lz),
                               hull_mat, glow_mat,
                               drum_size, detail=detail)

        # Weld straps: two longitudinal bars along Z at drum top, offset ±drum_r*0.55
        # in X. kit.box HALF-extents: hx=0.03, hy=0.05 (bottom face 0.10 below drum top),
        # hz = drum_sz/2 (spans full drum length).
        strap_hy = 0.05    # HALF-extent Y; bottom face 0.10 inside drum top
        strap_hz = drum_sz * 0.5
        strap_cy = drum_cy + drum_r - strap_hy   # centre: bottom = drum_top - 0.10
        for sign, sname in ((-1.0, 'port'), (1.0, 'stbd')):
            dn.weld_strap(parts, 'drum-strap-%s' % sname,
                          (sign * drum_r * 0.55, strap_cy, drum_lz),
                          hull_mat,
                          (0.03, strap_hy, strap_hz),   # HALF-extents (kit.box)
                          bolts=4, detail=detail)

        # Cut edge on the drum bow face (z = drum_lz - drum_sz/2).
        # Teeth extend +Z into drum body from the severed face.
        # sx = FULL row width (used for tooth x-spacing in cut_edge code).
        # sy = HALF-extent passed to kit.box for tooth height.
        # Limit sy to drum_r * 0.60 so teeth stay inside drum cross-section.
        drum_bow_z = drum_lz - drum_sz * 0.5
        dn.cut_edge(parts, 'drum-cut',
                    (0.0, drum_cy, drum_bow_z),
                    hull_mat,
                    (drum_r * 2.0, drum_r * 0.60, 0.20),
                    teeth=5, detail=detail)

    # ══════════════════════════════════════════════════════════════════════
    # STRIPE GROUP — stbd flank, two clusters  (detail 2+)
    # Dried-red vertical accent bars; height=1.65 u is absolute.
    # Mid cluster  (z=-0.66..+1.76): 5 stripes, 66 % of 2.51 u local height.
    # Prow cluster (z=-3.96..-2.20): 4 stripes, 75 % of 2.20 u local height,
    #   beside the fork throat — matches the heavy-red forward bias in ref.
    # Total accent ≈ 6.4 % of hull area (gate 3–8 %).  Stripes are on ONE
    # flank only; the asymmetry is deliberate fleet-wide.
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 2:
        sv.stripe_group(parts, 'stripes-stbd',
                        0.0, stripe_y,
                        stripe_z0, stripe_z1,
                        hull_mat, height=1.65,
                        count=5, gap=0.22, inward=-1.0,
                        detail=detail,
                        surf=lambda z, yy: sf.flank_x(st, z, yy))
        # Prow cluster — starboard flank, beside fork throat.
        sv.stripe_group(parts, 'stripes-prow',
                        0.0, prow_stripe_y,
                        prow_stripe_z0, prow_stripe_z1,
                        hull_mat, height=1.65,
                        count=4, gap=0.22, inward=-1.0,
                        detail=detail,
                        surf=lambda z, yy: sf.flank_x(st, z, yy))

    # ══════════════════════════════════════════════════════════════════════
    # TALLY BAND — stbd flank only  (detail 2+)
    # inward=-1: buries into -X (starboard face).
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 2 and tally_n > 0:
        hw.tally_band(parts, 'tally-stbd',
                      x=tally_x, y=tally_y,
                      z0=tally_z0, z1=tally_z1,
                      mat=hull_mat, strokes=tally_n,
                      inward=-1,
                      detail=detail)

    # ══════════════════════════════════════════════════════════════════════
    # LAMP RUNS — working deck edge, both flanks  (detail 2+)
    # Strip at (±lamp_x, lamp_y, z_mid); inner x-face buried at flat_half-0.03.
    # Anchored at lamp_z1 (aft, narrower) so strip stays inside hull throughout.
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 2:
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.lamp_run(parts, glow, 'lamp-run-%s' % side,
                        x=sign * lamp_x, y=lamp_y,
                        z0=lamp_z0, z1=lamp_z1,
                        glow_mat=glow_mat, mat=hull_mat,
                        spacing=sf.LAMP_SPACING, detail=detail)

    # ══════════════════════════════════════════════════════════════════════
    # AMBER SLIT ROWS — low on both flanks at PORT_SPACING pitch  (detail 2+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 2:
        # flank_x at (z=0, y=win_y_low): in constant-width zone, same for all z.
        wfx = sf.flank_x(st, 0.0, win_y_low)
        if wfx > 0.0:
            for sign, wside in ((-1.0, 'port'), (1.0, 'stbd')):
                for wi, wz in enumerate(win_zs):
                    # Window centre shifted inboard by half its X depth so outer
                    # face is flush with hull surface; FLANK_PORT are half-extents.
                    kit.window_row(
                        glow,
                        'amber-win-%s.%02d' % (wside, wi),
                        (sign * (wfx - sf.FLANK_PORT[0] * 0.5), win_y_low, wz),
                        glow_mat, 1, 0.0, sf.FLANK_PORT)

    # ══════════════════════════════════════════════════════════════════════
    # COCKPIT STATUS + DRIVE STATUS + NAV MARKERS  (detail 2+)
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 2:
        # Cockpit status slits: 2 slits on the forward face of cockpit house
        kit.window_row(glow, 'cockpit-status',
                       (0.0,
                        ck_top + ck_house_h * 0.70,
                        ck_z - ck_house_l * 0.5 + sf.STATUS_SLIT[2] * 0.60),
                       glow_mat, 2, sf.PORT_SPACING, sf.STATUS_SLIT)

        # Drive-status slits on a ROLE_TRIM plate overlapping drive housing top.
        # Plate bottom face is 0.10 inside drive housing top face (drive_top_y).
        # status_pl_cy: bottom = drive_top_y - 0.10, so cy = drive_top_y - 0.10 + hy
        kit.box(parts, 'drive-status-plate', T,
                (0.0, status_pl_cy, drive_z - drive_depth * 0.18),
                (drive_radius * 0.85, status_pl_hy, drive_depth * 0.24),  # HALF
                hull_mat)
        kit.window_row(glow, 'drive-status',
                       (0.0,
                        status_pl_cy + status_pl_hy + sf.STATUS_SLIT[1] * 0.5,
                        drive_z - drive_depth * 0.22),
                       glow_mat, 2, sf.PORT_SPACING, sf.STATUS_SLIT)

        # Navigation markers: bow flank quarter, both sides
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            mk_z  = -l * 0.32
            mk_y  =  h * 0.04
            mk_fx = sf.flank_x(st, mk_z, mk_y)
            if mk_fx > 0.0:
                kit.window_row(glow, 'nav-marker-%s' % side,
                               (sign * mk_fx, mk_y, mk_z),
                               glow_mat, 1, 0.0, sf.MARKER_LAMP)

    # ══════════════════════════════════════════════════════════════════════
    # GREEBLE — brow and drive gear  (detail 3 only)
    # kit.greeble_field loc + size (HALF-extents).
    # ══════════════════════════════════════════════════════════════════════
    if detail >= 3:
        kit.greeble_field(parts, 'brow-gear', T,
                          (0.0, brow_top - h * 0.012, brow_z + brow_lz * 0.18),
                          (brow_flat * 0.55, h * 0.022, brow_lz * 0.55),
                          hull_mat, seed=471, count=6, detail=detail)
        kit.greeble_field(parts, 'drive-gear', T,
                          (0.0,
                           drive_radius - h * 0.018,
                           drive_z - drive_depth * 0.20),
                          (drive_radius * 0.70, h * 0.018, drive_depth * 0.20),
                          hull_mat, seed=472, count=5, detail=detail)
