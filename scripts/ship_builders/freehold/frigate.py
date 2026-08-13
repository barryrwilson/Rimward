"""Freehold Compact — FRIGATE, the convoy keeper.

Bible §4.3: "convoy keeper: a community-funded escort with a long repaired
keel, several different yard modules, a proper command cabin, rescue hangar,
and replaceable side armour.  It should feel like several towns contributed
to one dependable ship."

Three zones with real seams between them (SpaceShipIdeas/synthesis/20 rule 1):
  bow  20 %  command section: stepped cabin block with raked greenhouse
             windscreen, two paired barbette mounts on the cabin deck, and
             a sensor mast at the apex.  Bow/mid seam collar at z ≈ -l·0.27.
  mid  52 %  four yard modules bolted to the keel — each from a different
             yard: a cream ROLE_ARMOUR chamfer block (town A), a faded-blue
             ROLE_ACCENT taper block (town B), a 16-sided barrel-roof
             greenhouse cylinder (town C), and a slung water cistern (town
             D).  Seam collars mark every module boundary so no plate course
             crosses two zones.  Rescue hangar with docked inspection craft
             on the starboard flank (§21 G5).  Partial plate-course side
             armour on both flanks — some bays still bare hull because not
             every contributing town has funded a full plate run.
  stern 28 % OPEN SOUND FRAME — four spars, two hoops, three crossed braces,
             gap = 9 % of hull length — then a drive block with SIX countable
             nozzles (2 rows × 3 columns) and two large flat radiator panels
             breaking the outline on port and starboard (§21 G3).

The empty truss gap spans z ≈ l·0.22 to z ≈ l·0.31 and is left genuinely
empty: the faction thumbnail signature (§21 G2 outline breaker).

Measured (node scripts/measure-ships.mjs freehold, l = 32.0):
  verts 18 236, span 29.7 in the frigate band [19.20, 44.80]
  spanZ/spanX 2.25, spanY/spanZ 0.32, spanX/spanZ 0.45
  proxyCover 100 %, fit w 24 % / h 24 % / l 34 %
  lod0 8 168 triangles (cap 60 000); one 26-connected body under
  node scripts/probe-ship-islands.mjs freehold frigate lod0

Density lives in the replaceable-armour and module-plate language at detail 3
(module A 6×4 top plus 4×4 per flank, module B 6×4 top plus 5×4 per flank,
drive rank 5×3 per face, three keel-deck zones at 6×4), which carries the class
over its 16 000-vertex charter floor (SHIP_SCALE.frigate) while the bare bays
between armour courses stay unplated — the town has not paid for those yet.

Connectivity repairs (all three groups were floating at voxel 0.06):
  Armour plates: sx formula fixed so inner face sits armour_lap inside hull
    flank (armour_lap = b*0.010 ≈ 0.125 m overlap). Previously plate centre
    was at flank_x + armour_t (entirely outboard).
  Seam collars (mod-AB and mid-stern were detached): collar y-centre raised
    to top_y - h*0.010 so the top face protrudes 0.077 m above the hull top
    surface — collar now crosses the hull top polygon, confirmed seated.
  Cabin port lights: port_x changed from sf.flank_x(…, cabin_cy) + h*0.030
    (returned 0 because cabin_cy is above the hull loft, giving x = ±0.25 m
    near centreline) to cabin_hw - FLANK_PORT[0]*0.5 + 0.010, seating each
    window 0.050 m inside the cabin-block flank face.

Research rules satisfied:
  §20/1  Three zones, seam collars at z ≈ -l·0.27 (bow/mid) and +l·0.14
         (mid/stern).  Individual module seam collars prevent any plate course
         from crossing two zones.
  §20/2  Detail concentrated in one mid band; 57 % of keel calm.
  §20/3  Emissive ≤ 5 %: drive glow group, cabin windows at fleet pitch,
         greenhouse galleries, hazard markers at constant pitch.
  §20/4  Scale from repetition: PORT_SPACING window pitch, l·0.08–0.10
         module bays, constant seam-collar interval.
  §20/5  Exposed frame: open trusses, genuinely empty.
  §20/6  Six nozzles in 2 × 3 — countable at thumbnail.
  §20/8  One asymmetric yard detail: port armour missing the centre segment.
  §21/G3 Visible flat radiators and distinct drive face.
  §21/G5 Open rescue hangar, docked small craft inside.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def _frigate_stations(l, b, h):
    """Convoy-keeper keel stations, bow to transom.

    Fourteen stations.  The keel is long and low: y_offsets are negative
    throughout, so the spine reads as a slab lying close to the centreline.
    Yard modules and the command cabin then read as distinct volumes bolted
    ON TOP of a continuous keel rather than one moulded shell.

    The last four stations narrow deliberately to give the truss frame a
    clean transom to bolt onto; the drive block then reads as a second
    solid mass held clear of the keel by the open gap.
    """
    return [
        sf.fair(-l * 0.44, b * 0.22, h * 0.18, -h * 0.080),  # bow cap, narrow keel tip
        sf.fair(-l * 0.39, b * 0.28, h * 0.19, -h * 0.070),  # just forward of command
        sf.fair(-l * 0.34, b * 0.34, h * 0.20, -h * 0.050),  # command forward face
        sf.fair(-l * 0.28, b * 0.39, h * 0.22, -h * 0.030),  # command mid section
        sf.fair(-l * 0.27, b * 0.40, h * 0.23, -h * 0.020),  # bow/mid seam collar z
        sf.fair(-l * 0.22, b * 0.43, h * 0.24,  0.000),       # module A start
        sf.fair(-l * 0.14, b * 0.43, h * 0.24,  0.000),       # module A/B seam
        sf.fair(-l * 0.04, b * 0.43, h * 0.24,  0.000),       # module B/C seam
        sf.fair( l * 0.06, b * 0.42, h * 0.24,  0.000),       # module C/D seam
        sf.fair( l * 0.14, b * 0.39, h * 0.23, -h * 0.010),  # mid/stern seam collar z
        sf.fair( l * 0.16, b * 0.32, h * 0.21, -h * 0.020),  # keel narrowing for truss
        sf.fair( l * 0.18, b * 0.25, h * 0.19, -h * 0.040),  # truss transom outer ring
        sf.fair( l * 0.20, b * 0.20, h * 0.17, -h * 0.060),  # truss transom inner ring
        sf.fair( l * 0.22, b * 0.16, h * 0.15, -h * 0.080),  # spar attachment foot
    ]


# =============================================================================
# FRIGATE — CONVOY KEEPER
# Called with l=32.0  b=12.48  h=8.32 (from CLASSES).
# =============================================================================
def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    D = kit.ROLE_ARMOUR   # donated section / cream plate
    A = kit.ROLE_ACCENT   # replaced panel / faded-blue clamped part
    T = kit.ROLE_TRIM

    st = _frigate_stations(l, b, h)

    # ── Frame geometry (shared by spars, hoops, bracing) ──────────────────────
    # The gap between the keel transom and the drive block front is 9 % of hull
    # length and left genuinely empty — the faction thumbnail signature (§21 G2).
    # Spars start l·0.01 inside the keel transom and end l·0.01 inside the
    # drive block so both ends are embedded in a solid volume.
    frame_z0  = st[-1][0]         # l·0.22 — spar attachment foot on the keel
    frame_z1  = l * 0.31          # drive block front face
    frame_cx  = b * 0.12          # lateral offset of the four spars
    frame_cy  = -h * 0.06         # frame vertical centre (matches keel y_offset here)
    frame_hy  = h * 0.09          # ± extent of spar group from frame_cy

    # ── Drive block (separate volume, own local anchors) ──────────────────────
    drive_z    = l * 0.385         # centre → block spans l·0.31 to l·0.46
    drive_len  = l * 0.150
    drive_cy   = -h * 0.06        # flush with the frame centre for alignment
    drive_hw   = b * 0.21
    drive_hh   = h * 0.24
    drive_ch   = h * 0.18
    drive_flat = drive_hw - drive_ch
    drive_top  = drive_cy + drive_hh

    # ── Command cabin geometry ─────────────────────────────────────────────────
    # Half-width clamped to the narrowest flat deck in the cabin's z range so
    # no corner of the cabin block overhangs the keel chamfer.
    cabin_z   = -l * 0.325
    cabin_len = l * 0.110
    cabin_zs  = (-l * 0.38, cabin_z, -l * 0.27)
    cabin_hw  = min(sf.flat_half(st, z) for z in cabin_zs) * 0.86
    cabin_ky  = min(sf.top_y(st, z, 0.0) for z in cabin_zs) - h * 0.02
    cabin_h   = h * 0.28
    cabin_cy  = cabin_ky + cabin_h * 0.5
    cabin_top = cabin_ky + cabin_h

    # Wheelhouse: narrower step on the cabin roof.
    wh_hw  = cabin_hw * 0.72
    wh_len = cabin_len * 0.62
    wh_h   = h * 0.20
    wh_cy  = cabin_top + wh_h * 0.5
    wh_top = cabin_top + wh_h

    # ── Module geometry (mid zone) ─────────────────────────────────────────────
    # Module A — cream donated chamfer block (ROLE_ARMOUR, town A).
    mod_a_z    = -l * 0.180
    mod_a_len  =  l * 0.080
    mod_a_h    =  h * 0.220
    mod_a_ky   =  sf.top_y(st, mod_a_z, 0.0) - h * 0.030  # bottom overlaps keel top
    mod_a_cy   =  mod_a_ky + mod_a_h * 0.5
    mod_a_hw   =  sf.flat_half(st, mod_a_z) * 1.06

    # Module B — faded-blue replaced taper block (ROLE_ACCENT, town B).
    mod_b_z    = -l * 0.090
    mod_b_len  =  l * 0.100
    mod_b_h    =  h * 0.260                  # taller than A — different pattern book
    mod_b_ky   =  sf.top_y(st, mod_b_z, 0.0) - h * 0.030
    mod_b_cy   =  mod_b_ky + mod_b_h * 0.5
    mod_b_hw   =  sf.flat_half(st, mod_b_z) * 1.04

    # Module C — barrel-roof greenhouse (ROLE_ARMOUR, town C).
    mod_c_z    = l * 0.010
    mod_c_len  = l * 0.100
    mod_c_r    = h * 0.180                   # radius 1.50 m — human scale, fixed
    mod_c_cy   = sf.top_y(st, mod_c_z, 0.0) - mod_c_r * 0.28  # overlaps keel top

    # Module D — water cistern slung below the keel (ROLE_TRIM, bare metal).
    mod_d_z    = l * 0.100
    mod_d_len  = l * 0.080
    mod_d_r    = h * 0.150
    mod_d_cy   = sf.bottom_y(st, mod_d_z, 0.0) + mod_d_r * 0.30  # overlaps keel bottom
    # ── Armour band geometry ───────────────────────────────────────────────────
    armour_cy  = -h * 0.020          # mid-flank position, accessible from working platform
    armour_h   =  h * 0.180
    armour_t   =  b * 0.016          # plate standing thickness ≈ 0.20 m
    armour_lap =  b * 0.010          # lap into hull flank ≈ 0.125 m; keeps plates seated

    # ── Rescue hangar geometry (§21 G5) ───────────────────────────────────────
    # Bay on the starboard flank, module C/D zone.
    bay_z      = l * 0.010
    bay_len    = l * 0.075
    bay_cy_pos = -h * 0.050          # bay vertical centre, just below keel mid
    bay_h      = h * 0.200
    bay_face_x = sf.flank_x(st, bay_z, bay_cy_pos)
    col_t      = 0.14                # collar bar thickness

    # Docked inspection craft: stbd face protrudes past hull by 'protrude';
    # port face sits well inside the keel body (overlap ensures one connected body).
    craft_sx  = b * 0.076            # 0.95 m full width
    craft_sy  = h * 0.140            # 1.16 m full height
    craft_sz  = l * 0.055            # 1.76 m full length
    protrude  = h * 0.035            # 0.29 m proud of hull flank
    craft_cx  = bay_face_x - craft_sx * 0.5 + protrude
    craft_cy  = bay_cy_pos - bay_h * 0.28   # near bay floor, inside hull body
    craft_cz  = bay_z - craft_sz * 0.08

    # ── Locker geometry ────────────────────────────────────────────────────────
    # Lockers hang below the armour band so they are accessible from a working
    # platform without removing the armour plates.
    locker_cy  = armour_cy - armour_h * 0.5 - sf.SUPPLY_LOCKER[1] * 0.45
    locker_gap = h * 0.04

    # ── Primary masses (all detail levels) ────────────────────────────────────

    kit.hull_loft(parts, 'keel-body', H, st, hull_mat)

    # Drive block: second solid mass, held off the keel by the open frame.
    kit.chamfer_block(parts, 'drive-block', H,
                      (0.0, drive_cy, drive_z),
                      (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                      hull_mat, chamfer=drive_ch, bevel=h * 0.012)

    # Command cabin: chamfered block sitting on the forward keel.
    kit.chamfer_block(parts, 'command-cabin', H,
                      (0.0, cabin_cy, cabin_z),
                      (cabin_hw * 2.0, cabin_h, cabin_len),
                      hull_mat, chamfer=cabin_h * 0.22, bevel=h * 0.012)

    # Wheelhouse: stepped-up block on the cabin roof, narrower footprint.
    kit.chamfer_block(parts, 'wheelhouse', H,
                      (0.0, wh_cy, cabin_z - cabin_len * 0.05),
                      (wh_hw * 2.0, wh_h, wh_len),
                      hull_mat, chamfer=wh_h * 0.24, bevel=h * 0.010)

    # ── Drives, frame, modules, and armour (detail 1+) ────────────────────────
    # At detail 0 only the three primary mass blocks above render; all the
    # structural vocabulary (frame, modules, nozzles, radiators, armour) is
    # visible at detail 1 and above.
    if detail >= 1:

        # Six countable nozzles: 2 rows × 3 columns (§20 rule 6).
        # Both rows share the drive aft face so they read as one grouped drive,
        # not two separate drives.
        nozzle_r  = h * 0.120
        nozzle_dx = b * 0.065
        nozzle_dy = h * 0.090
        drive_face_z = drive_z + drive_len * 0.5
        for col in range(3):
            dx = (col - 1) * nozzle_dx
            kit.nozzle_ring(parts, glow, 'drive-top.%02d' % col,
                            (dx, drive_cy + nozzle_dy, drive_face_z),
                            hull_mat, glow_mat, radius=nozzle_r, depth=l * 0.055)
            kit.nozzle_ring(parts, glow, 'drive-bot.%02d' % col,
                            (dx, drive_cy - nozzle_dy, drive_face_z),
                            hull_mat, glow_mat, radius=nozzle_r, depth=l * 0.055)

        # Radiator panels port and starboard (§21 G3).  Flat and EMPTY: no
        # detail is placed on them so their clean silhouette reads as thermal
        # hardware, not hull surface (§20 rule 2).
        # Inner edge overlaps the drive block by h·0.06 for connectivity.
        rad_hw = b * 0.180
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            rad_cx = sign * (drive_hw + rad_hw - h * 0.060)
            kit.taper_block(parts, 'radiator-%s' % side, D,
                            (rad_cx, drive_cy, drive_z - l * 0.020),
                            (rad_hw * 2.0, h * 0.040, l * 0.170),
                            hull_mat, front=(0.55, 0.30), back=(1.0, 0.82),
                            bevel=h * 0.008)

        # Open sound frame: four spars, two hoops, three crossed braces.
        for xi, xname in ((-1, 'port'), (1, 'stbd')):
            for yi, yname in ((-1, 'lower'), (1, 'upper')):
                kit.strut(parts, 'frame-spar-%s-%s' % (yname, xname), T,
                          (xi * frame_cx,
                           frame_cy + yi * frame_hy,
                           frame_z0 - l * 0.010),
                          (xi * frame_cx,
                           frame_cy + yi * frame_hy,
                           frame_z1 + l * 0.010),
                          hull_mat, radius=h * 0.024)

        # Two rectangular hoops at 1/3 and 2/3 of the gap.
        hoop_zs = (frame_z0 + (frame_z1 - frame_z0) / 3.0,
                   frame_z0 + (frame_z1 - frame_z0) * 2.0 / 3.0)
        for hi, hz in enumerate(hoop_zs):
            kit.strut(parts, 'frame-hoop-top.%02d' % hi, T,
                      (-frame_cx, frame_cy + frame_hy, hz),
                      ( frame_cx, frame_cy + frame_hy, hz),
                      hull_mat, radius=h * 0.018)
            kit.strut(parts, 'frame-hoop-bot.%02d' % hi, T,
                      (-frame_cx, frame_cy - frame_hy, hz),
                      ( frame_cx, frame_cy - frame_hy, hz),
                      hull_mat, radius=h * 0.018)
            kit.strut(parts, 'frame-hoop-port.%02d' % hi, T,
                      (-frame_cx, frame_cy - frame_hy, hz),
                      (-frame_cx, frame_cy + frame_hy, hz),
                      hull_mat, radius=h * 0.018)
            kit.strut(parts, 'frame-hoop-stbd.%02d' % hi, T,
                      ( frame_cx, frame_cy - frame_hy, hz),
                      ( frame_cx, frame_cy + frame_hy, hz),
                      hull_mat, radius=h * 0.018)

        # Three crossed braces: port face, starboard face, and a top diagonal.
        # Alternating directions break factory symmetry (§20/8: one asymmetric
        # yard detail — the top brace also crosses diagonally, deliberate).
        kit.strut(parts, 'frame-brace-port', T,
                  (-frame_cx, frame_cy - frame_hy, frame_z0),
                  (-frame_cx, frame_cy + frame_hy, frame_z1),
                  hull_mat, radius=h * 0.016)
        kit.strut(parts, 'frame-brace-stbd', T,
                  ( frame_cx, frame_cy + frame_hy, frame_z0),
                  ( frame_cx, frame_cy - frame_hy, frame_z1),
                  hull_mat, radius=h * 0.016)
        kit.strut(parts, 'frame-brace-top', T,
                  (-frame_cx, frame_cy + frame_hy, frame_z0 + l * 0.005),
                  ( frame_cx, frame_cy + frame_hy, frame_z1 - l * 0.005),
                  hull_mat, radius=h * 0.014)

        # ── Module A: cream donated chamfer block (ROLE_ARMOUR, town A) ────────
        # Chamfer_block reads as a section that was prefabricated at another
        # yard and shipped; the ROLE_ARMOUR paint (cream) confirms the donation.
        # Different chamfer ratio and height from module B so the two blocks
        # cannot be from the same pattern book.
        kit.chamfer_block(parts, 'mod-A-donated', D,
                          (0.0, mod_a_cy, mod_a_z),
                          (mod_a_hw * 2.0, mod_a_h, mod_a_len),
                          hull_mat, chamfer=mod_a_h * 0.20, bevel=h * 0.010)

        # ── Module B: faded-blue replaced taper block (ROLE_ACCENT, town B) ───
        # Taper_block with raked back face; taller than A and without the square
        # chamfer, which is enough to read as a different yard's work.
        kit.taper_block(parts, 'mod-B-replaced', A,
                        (0.0, mod_b_cy, mod_b_z),
                        (mod_b_hw * 2.0, mod_b_h, mod_b_len),
                        hull_mat, front=(0.80, 0.90), back=(1.0, 0.82),
                        bevel=h * 0.010)

        # ── Module C: barrel-roof greenhouse (ROLE_ARMOUR, town C) ─────────────
        # 16-sided cylinder along Z; the circular cross-section contrasts with
        # the box modules so the module boundary is unmistakable without a
        # collar stripe.  The greenhouse function (growing, light) is readable
        # at any distance.
        kit.cyl(parts, 'mod-C-greenhouse', D,
                (0.0, mod_c_cy, mod_c_z),
                mod_c_r, mod_c_len * 1.04, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=16)

        # ── Module D: water cistern below the keel (ROLE_TRIM, town D) ─────────
        # Ventral cylinder: bare metal, different from the donated/painted modules
        # above the keel.  Its position below the centreline (slung, not bolted
        # on top) is immediately readable as water storage, not living space.
        kit.cyl(parts, 'mod-D-cistern', T,
                (0.0, mod_d_cy, mod_d_z),
                mod_d_r, mod_d_len, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=12)

        # ── Module seam collars ────────────────────────────────────────────────
        # One recessed panel-line strip at each zone boundary (§20 rule 1).
        # Collar centre y = top_y(sz) - h*0.010: the collar top face protrudes
        # depth/2 - h*0.010 = 0.160 - 0.083 = 0.077 m above hull top surface,
        # so the strip crosses the hull's top-face polygon — confirmed seated. ✓
        for sz, col_name in (
                (-l * 0.270, 'bow-mid'),
                (-l * 0.140, 'mod-AB'),
                (-l * 0.040, 'mod-BC'),
                ( l * 0.060, 'mod-CD'),
                ( l * 0.140, 'mid-stern'),
        ):
            sw = sf.flat_half(st, sz) * 2.0 * 1.04
            kit.panel_lines(parts, 'keel-seam-%s' % col_name,
                            (0.0, sf.top_y(st, sz, 0.0) - h * 0.010, sz),
                            (sw, h * 0.140, l * 0.015),
                            hull_mat, count=1, axis='z', depth=0.32)

        # ── Side armour plate courses (partial, §20/8) ─────────────────────────
        # Three course segments on the starboard side; port is missing the centre
        # segment — the asymmetric yard detail the research requires (§20 rule 8):
        # that town has not yet paid for those plates.  Some bare hull remains
        # on both flanks to keep 57 % of the hull surface calm (§20 rule 2).
        seg_defs = (
            ('fwd', -l * 0.210, l * 0.070),
            ('ctr', -l * 0.090, l * 0.090),
            ('aft',  l * 0.090, l * 0.060),
        )
        for sign, side, skip in (
                ( 1.0, 'stbd', ()),
                (-1.0, 'port', ('ctr',)),   # centre segment not funded on port
        ):
            for sname, sz, slen in seg_defs:
                if sname in skip:
                    continue
                # sx formula: plate centre x = flank_x + armour_t*0.5 - armour_lap.
                # Inner plate face at flank_x - armour_lap (≈ 0.125 m inside hull),
                # outer face at flank_x + armour_t*0.5 - armour_lap + armour_t*0.5
                #           = flank_x + armour_t - armour_lap ≈ flank_x + 0.075 m proud.
                # Confirmed seated overlap ≈ 0.125 m. ✓
                sx = sf.flank_x(st, sz, armour_cy) + armour_t * 0.5 - armour_lap
                kit.plate_course(parts, 'armour-%s-%s' % (side, sname), D,
                                 (sign * sx, armour_cy, sz),
                                 (armour_t, armour_h, slen),
                                 hull_mat, count=4, axis='z',
                                 gap=0.14, step=0.018, bevel=h * 0.008,
                                 length_vary=0.05)

        # ── Rescue hangar (§21 G5) ─────────────────────────────────────────────
        # Four ROLE_TRIM collar bars frame the bay mouth on the starboard flank.
        # Each bar is centred AT the hull face (x = bay_face_x) so it straddles
        # the surface: half outboard (visible frame), half inboard (attached).
        for c_loc, c_size, c_name in (
                # Top bar: above bay opening, full bay length
                ((bay_face_x,
                  bay_cy_pos + bay_h * 0.5 + col_t * 0.5,
                  bay_z),
                 (col_t * 2.0, col_t, bay_len + col_t * 2.0),
                 'hangar-collar-top'),
                # Bottom bar: below bay opening
                ((bay_face_x,
                  bay_cy_pos - bay_h * 0.5 - col_t * 0.5,
                  bay_z),
                 (col_t * 2.0, col_t, bay_len + col_t * 2.0),
                 'hangar-collar-bot'),
                # Forward bar (bow side of bay)
                ((bay_face_x,
                  bay_cy_pos,
                  bay_z - bay_len * 0.5 - col_t * 0.5),
                 (col_t * 2.0, bay_h + col_t * 2.0, col_t),
                 'hangar-collar-fwd'),
                # Aft bar
                ((bay_face_x,
                  bay_cy_pos,
                  bay_z + bay_len * 0.5 + col_t * 0.5),
                 (col_t * 2.0, bay_h + col_t * 2.0, col_t),
                 'hangar-collar-aft'),
        ):
            kit.box(parts, c_name, T, c_loc, c_size, hull_mat, bevel=0.020)

        # Docked inspection craft.
        # Its port face is well inside the keel body; the stbd face protrudes
        # slightly past the hull flank so the wedge shape reads as a craft
        # nose-out in a bay, and the voxel probe finds one connected body.
        kit.wedge(parts, 'hangar-craft', H,
                  (craft_cx, craft_cy, craft_cz),
                  (craft_sx, craft_sy, craft_sz),
                  hull_mat, taper=(0.20, 0.35), bevel=h * 0.008)

    # ── Working equipment (detail 2+) ─────────────────────────────────────────
    if detail >= 2:
        # Seam collar ring at the bow/mid boundary: a physical flanged ring so
        # the first yard module bolts onto a proper connection, not a raw face.
        seam_hw, seam_hh, seam_yo, seam_ch = sf.section(st, -l * 0.270)
        kit.cyl(parts, 'bow-seam-ring', T,
                (0.0, seam_yo, -l * 0.270 - l * 0.004),
                min(seam_hh * 0.82, seam_hw * 0.40), l * 0.008, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=16)

        # Sensor mast on the wheelhouse apex.  Thin mast against the cabin mass
        # is the correct Freehold scale cue: fragile hardware, heavy hull.
        kit.sensor_mast(parts, glow, 'sensor-mast',
                        (0.0, wh_top - h * 0.015, cabin_z - wh_len * 0.20),
                        hull_mat, glow_mat, height=h * 0.220, radius=h * 0.034)

        # Two paired barbette mounts on the cabin deck (militia discipline:
        # paired so traverse covers both flanks without rotation).
        barb_z    = cabin_z + cabin_len * 0.10
        barb_deck = cabin_top - h * 0.015
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.barbette(parts, glow, 'barbette-%s' % side,
                         (sign * cabin_hw * 0.52, barb_deck, barb_z),
                         hull_mat, glow_mat,
                         radius=h * 0.100, height=h * 0.110, barrels=2)

        # Crew hatch on the forward keel face: recessed so the bow is clearly
        # for people, not just for the drive.
        hatch_ky = sf.top_y(st, -l * 0.38, 0.0)
        kit.rescue_hatch(parts, glow, 'bow-hatch',
                         (0.0, hatch_ky - sf.AIRLOCK[1] * 0.30, -l * 0.380),
                         hull_mat, glow_mat, sf.AIRLOCK, face='-z')

        # Handrails along both cabin deck edges: the crew can walk the full
        # cabin top without a safety risk (the ship is armed, not reckless).
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.handrail(parts, 'cabin-rail-%s' % side,
                         (sign * cabin_hw * 0.88, cabin_top - h * 0.010, cabin_z),
                         hull_mat, length=cabin_len * 0.88, axis='z', posts=5)

        # Supply lockers clamped to both flanks, below the armour band.
        # Clamp struts cross the gap from hull to locker face so the shadow
        # line behind the locker reads as hardware, not a gap.
        for lk_name, lk_sign, lk_z in (
                ('locker-stbd-fwd',  1.0, -l * 0.160),
                ('locker-port-fwd', -1.0, -l * 0.200),
                ('locker-stbd-aft',  1.0,  l * 0.080),
                ('locker-port-aft', -1.0,  l * 0.080),
        ):
            lk_x = lk_sign * (sf.flank_x(st, lk_z, locker_cy)
                               + locker_gap + sf.SUPPLY_LOCKER[0] * 0.5)
            lk_loc = (lk_x, locker_cy, lk_z)
            kit.chamfer_block(parts, lk_name, A, lk_loc, sf.SUPPLY_LOCKER,
                              hull_mat, chamfer=0.14, bevel=0.030)
            for ci, cs in ((0, -1.0), (1, 1.0)):
                cz = lk_z + cs * 0.28
                inner_x = lk_sign * (sf.flank_x(st, cz, locker_cy) - h * 0.020)
                outer_x = lk_x - lk_sign * sf.SUPPLY_LOCKER[0] * 0.5
                kit.strut(parts, '%s-clamp.%02d' % (lk_name, ci), T,
                          (inner_x, locker_cy, cz),
                          (outer_x, locker_cy, cz),
                          hull_mat, radius=h * 0.014)

        # Extra supply lockers — late-funded hardware on two more flank zones.
        for lk_name, lk_sign, lk_z in (
                ('locker-stbd-mid',  1.0, -l * 0.030),
                ('locker-port-mid', -1.0, -l * 0.020),
                ('locker-stbd-aft2',  1.0,  l * 0.110),
                ('locker-port-aft2', -1.0,  l * 0.100),
        ):
            lk_x = lk_sign * (sf.flank_x(st, lk_z, locker_cy)
                               + locker_gap + sf.SUPPLY_LOCKER[0] * 0.5)
            lk_loc = (lk_x, locker_cy, lk_z)
            kit.chamfer_block(parts, lk_name, A, lk_loc, sf.SUPPLY_LOCKER,
                              hull_mat, chamfer=0.14, bevel=0.030)
            for ci, cs in ((0, -1.0), (1, 1.0)):
                cz = lk_z + cs * 0.28
                inner_x = lk_sign * (sf.flank_x(st, cz, locker_cy) - h * 0.020)
                outer_x = lk_x - lk_sign * sf.SUPPLY_LOCKER[0] * 0.5
                kit.strut(parts, '%s-clamp.%02d' % (lk_name, ci), T,
                          (inner_x, locker_cy, cz),
                          (outer_x, locker_cy, cz),
                          hull_mat, radius=h * 0.014)

        # Keel deck handrails on the module-zone working deck (port and stbd).
        # Post base sits h*0.010 below hull top, penetrating the keel by that
        # amount — confirmed seated (≈ 1.4 voxels at 0.06 m resolution). ✓
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for rl_z, rl_name in ((-l * 0.110, 'mid-fwd'), (l * 0.075, 'mid-aft')):
                rl_hw  = sf.flat_half(st, rl_z) * 0.84
                rl_top = sf.top_y(st, rl_z, 0.0) - h * 0.010
                kit.handrail(parts, 'keel-rail-%s-%s' % (rl_name, side),
                             (sign * rl_hw, rl_top, rl_z),
                             hull_mat, length=l * 0.080, axis='z', posts=4)

    # ── Emissive: windows, lamps, drive status (detail 2+) ────────────────────
    if detail >= 2:
        # Raked greenhouse windscreen on the wheelhouse forward face.
        # The warm glow is the first read at long range; the raked angle tells
        # you the ship's direction even in silhouette.
        screen_z = cabin_z - wh_len * 0.48
        screen_n = 4 if detail >= 3 else 2
        kit.window_row(glow, 'wh-screen',
                       (0.0, wh_top - h * 0.020, screen_z),
                       glow_mat, screen_n, sf.PORT_SPACING * 1.10,
                       (0.52, 0.28, 0.08))
        # Drip rail along the base of the windscreen: one long highlight that
        # reads as a structural edge from across a landing field.
        kit.box(parts, 'screen-drip-rail', T,
                (0.0, wh_top - h * 0.140, screen_z),
                (wh_hw * 1.50, h * 0.020, wh_len * 0.30),
                hull_mat, bevel=h * 0.006)

        # Cabin-flank port lights at constant fleet pitch (§20/4 scale cue).
        # The human pitch is fixed; a bigger ship carries more windows, not
        # bigger ones.
        if detail >= 3:
            cab_port_zs = [-l * 0.38 + i * sf.PORT_SPACING
                           for i in range(12)
                           if -l * 0.38 + i * sf.PORT_SPACING < -l * 0.27]
        else:
            cab_port_zs = [-l * 0.370, -l * 0.335, -l * 0.300]
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for wi, wz in enumerate(cab_port_zs):
                # cabin_hw is the cabin block's flat half-beam; window centre is
                # (cabin_hw - 0.020) m so inner face sits 0.050 m inside the block,
                # outer face protrudes 0.010 m — confirmed seated overlap 0.050 m. ✓
                port_x = sign * (cabin_hw - sf.FLANK_PORT[0] * 0.5 + 0.010)
                kit.window_row(glow, 'cabin-port-%s.%02d' % (side, wi),
                               (port_x, cabin_cy, wz),
                               glow_mat, 1, 0.0, sf.FLANK_PORT)

        # Greenhouse gallery panes on the barrel-roof (module C).
        # Three positions along the cylinder; fewer at detail 2 (§20/3 emissive budget).
        gallery_n = 3 if detail >= 3 else 2
        gal_cy = mod_c_cy + mod_c_r - 0.03
        for gi, gz in enumerate((-l * 0.025, l * 0.010, l * 0.045)):
            if gi >= gallery_n:
                break
            kit.window_row(glow, 'greenhouse-gallery.%02d' % gi,
                           (0.0, gal_cy, gz),
                           glow_mat, 3 if detail >= 3 else 2, 0.28, sf.ROOF_PANE)
        # Two extra greenhouse gallery panes at detail 3 (denser emissive band).
        if detail >= 3:
            for gi, gz in enumerate((l * 0.035, l * 0.060)):
                kit.window_row(glow, 'greenhouse-extra.%02d' % gi,
                               (0.0, gal_cy, gz),
                               glow_mat, 3, 0.28, sf.ROOF_PANE)

        # Flood-work lamps at constant pitch along the keel deck, mid zone.
        flood_zs = (-l * 0.200, -l * 0.060, l * 0.080)
        flood_n  = 3 if detail >= 3 else 2
        for li, fz in enumerate(flood_zs[:flood_n]):
            deck = sf.top_y(st, fz, 0.0)
            kit.window_row(glow, 'flood-lamp.%02d' % li,
                           (0.0, deck + sf.FLOOD_LAMP[1] * 0.6, fz),
                           glow_mat, 2, 0.40, sf.FLOOD_LAMP)

        # Navigation markers: bow quarters and mid/stern zone seam (§20/4).
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for mk_z, mk_name in ((-l * 0.38, 'bow'), (l * 0.14, 'mid')):
                kit.window_row(glow, 'marker-%s-%s' % (mk_name, side),
                               (sign * sf.flank_x(st, mk_z, -h * 0.030),
                                -h * 0.030, mk_z),
                               glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Module A flank warm ports at fleet pitch (§20/4).
        # Window centre x = mod_a_hw - 0.020 m; inner face 0.050 m inside block,
        # outer face 0.010 m proud — confirmed seated overlap 0.050 m. ✓
        mod_a_port_y  = mod_a_ky + mod_a_h * 0.40
        mod_a_px      = mod_a_hw - sf.FLANK_PORT[0] * 0.5 + 0.010
        mod_a_port_zs = [mod_a_z - mod_a_len * 0.42 + i * sf.PORT_SPACING
                         for i in range(int(mod_a_len * 0.84 / sf.PORT_SPACING) + 1)]
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for wi, wz in enumerate(mod_a_port_zs):
                kit.window_row(glow, 'mod-A-port-%s.%02d' % (side, wi),
                               (sign * mod_a_px, mod_a_port_y, wz),
                               glow_mat, 1, 0.0, sf.FLANK_PORT)

        # Extra navigation markers at module-zone seam positions.
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for mk_z, mk_name in ((-l * 0.140, 'mod-ab'), (l * 0.060, 'mod-cd')):
                kit.window_row(glow, 'marker-%s-%s' % (mk_name, side),
                               (sign * sf.flank_x(st, mk_z, -h * 0.030),
                                -h * 0.030, mk_z),
                               glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Drive-status readout slits on the drive-block roof.
        kit.window_row(glow, 'drive-status',
                       (0.0, drive_top + 0.02, drive_z - drive_len * 0.20),
                       glow_mat, 3, sf.PORT_SPACING, sf.STATUS_SLIT)

        # One lit port on the docked inspection craft: confirms there is a
        # functional vessel in the bay, not a hull mock-up.
        kit.window_row(glow, 'hangar-craft-port',
                       (bay_face_x + h * 0.010, bay_cy_pos - bay_h * 0.10, bay_z),
                       glow_mat, 1, 0.0, sf.FLANK_PORT)
        # Inspection-craft comms spike: one more readable element that confirms
        # the vessel is active, not a hull mock-up (§21 G5).
        # Spike bottom at craft_cy + craft_sy*0.35 — inside craft body. ✓
        kit.box(parts, 'hangar-craft-spike', T,
                (craft_cx,
                 craft_cy + craft_sy * 0.35,
                 craft_cz - craft_sz * 0.38),
                (h * 0.012, h * 0.075, h * 0.014),
                hull_mat)

    # ── Greeble fields (detail 3 only) ────────────────────────────────────────
    if detail >= 3:
        # Forward keel deck: navigation and mooring gear where the crew works
        # between the cabin and the bow.
        gear_z = -l * 0.350
        kit.greeble_field(parts, 'bow-deck-gear', T,
                          (0.0,
                           sf.top_y(st, gear_z, 0.0) - h * 0.012,
                           gear_z),
                          (sf.flat_half(st, gear_z) * 1.30, h * 0.030, l * 0.080),
                          hull_mat, seed=501, count=10, detail=detail)
        # Drive block top: engineering access gear on the power plant.
        kit.greeble_field(parts, 'drive-block-gear', T,
                          (0.0, drive_top - h * 0.012, drive_z + l * 0.010),
                          (drive_flat * 1.30, h * 0.030, l * 0.080),
                          hull_mat, seed=503, count=8, detail=detail)

        # ── Module-face replacement plates (detail 3 only) ────────────────────
        # plate_grid sink = depth*0.25; with depth = h*0.035 ≈ 0.291 m,
        # sink ≈ 0.073 m (> 1 voxel at 0.06 m) — all plates confirmed seated. ✓

        # Module A top, stbd, port: replacement panels on the donated chamfer block.
        kit.plate_grid(parts, 'mod-A-top-grid', D,
                       (0.0, mod_a_cy, mod_a_z),
                       (mod_a_hw * 2.0, mod_a_h, mod_a_len),
                       hull_mat, cols=6, rows=4, face='y', depth=h*0.035, gap=0.08)
        kit.plate_grid(parts, 'mod-A-stbd-grid', D,
                       (0.0, mod_a_cy, mod_a_z),
                       (mod_a_hw * 2.0, mod_a_h, mod_a_len),
                       hull_mat, cols=4, rows=4, face='x', depth=h*0.035, gap=0.08)
        kit.plate_grid(parts, 'mod-A-port-grid', D,
                       (0.0, mod_a_cy, mod_a_z),
                       (mod_a_hw * 2.0, mod_a_h, mod_a_len),
                       hull_mat, cols=4, rows=4, face='-x', depth=h*0.035, gap=0.08)

        # Module B top: surface language on the taper block.
        kit.plate_grid(parts, 'mod-B-top-grid', A,
                       (0.0, mod_b_cy, mod_b_z),
                       (mod_b_hw * 2.0, mod_b_h, mod_b_len),
                       hull_mat, cols=6, rows=4, face='y', depth=h*0.035, gap=0.08)
        kit.plate_grid(parts, 'mod-B-stbd-grid', A,
                       (0.0, mod_b_cy, mod_b_z),
                       (mod_b_hw * 2.0, mod_b_h, mod_b_len),
                       hull_mat, cols=5, rows=4, face='x', depth=h*0.035, gap=0.08)
        kit.plate_grid(parts, 'mod-B-port-grid', A,
                       (0.0, mod_b_cy, mod_b_z),
                       (mod_b_hw * 2.0, mod_b_h, mod_b_len),
                       hull_mat, cols=5, rows=4, face='-x', depth=h*0.035, gap=0.08)

        # Drive block engineering rank: top deck and both flanks.
        # Centred on drive block bounding box; sink 0.073 m into each face. ✓
        kit.plate_grid(parts, 'drive-rank-top', H,
                       (0.0, drive_cy, drive_z),
                       (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                       hull_mat, cols=5, rows=3, face='y', depth=h*0.035, gap=0.10)
        kit.plate_grid(parts, 'drive-rank-stbd', H,
                       (0.0, drive_cy, drive_z),
                       (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                       hull_mat, cols=5, rows=3, face='x', depth=h*0.035, gap=0.10)
        kit.plate_grid(parts, 'drive-rank-port', H,
                       (0.0, drive_cy, drive_z),
                       (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                       hull_mat, cols=5, rows=3, face='-x', depth=h*0.035, gap=0.10)

        # Keel deck replacement strips in two working zones.
        # Bounding box at kd_top - h*0.010 puts its +Y face exactly at hull top;
        # plate sink depth*0.25 = 0.075 m into hull — confirmed seated. ✓
        for kd_name, kd_z in (('fwd', -l * 0.160), ('mid', -l * 0.030),
                              ('aft', l * 0.100)):
            kd_hw  = sf.flat_half(st, kd_z)
            kd_top = sf.top_y(st, kd_z, 0.0)
            kit.plate_grid(parts, 'keel-deck-%s' % kd_name, T,
                           (0.0, kd_top - h * 0.010, kd_z),
                           (kd_hw * 2.0, h * 0.020, l * 0.080),
                           hull_mat, cols=6, rows=4, face='y', depth=h*0.030, gap=0.10)

        # Module seam panel lines: two recessed grooves + one cross seam per module.
        # Strip centre at module top-y: top protrudes depth/2 = 0.075 m above face,
        # bottom sits depth/2 inside module — confirmed seated overlap. ✓
        for ms_nm, ms_cy, ms_z, ms_hw, ms_h, ms_ln in (
                ('A', mod_a_cy, mod_a_z, mod_a_hw, mod_a_h, mod_a_len),
                ('B', mod_b_cy, mod_b_z, mod_b_hw, mod_b_h, mod_b_len),
        ):
            kit.panel_lines(parts, 'mod-%s-panel' % ms_nm,
                            (0.0, ms_cy + ms_h * 0.5, ms_z),
                            (ms_hw * 2.0, h * 0.020, ms_ln),
                            hull_mat, count=2, axis='z', depth=h*0.018,
                            cross_count=1)

        # Module deck greeble fields on module A and B rooftops.
        kit.greeble_field(parts, 'mod-A-deck-gear', T,
                          (0.0,
                           mod_a_cy + mod_a_h * 0.5 - h * 0.015,
                           mod_a_z),
                          (mod_a_hw * 1.60, h * 0.030, mod_a_len * 0.80),
                          hull_mat, seed=511, count=8, detail=detail)
        kit.greeble_field(parts, 'mod-B-deck-gear', T,
                          (0.0,
                           mod_b_cy + mod_b_h * 0.5 - h * 0.015,
                           mod_b_z),
                          (mod_b_hw * 1.40, h * 0.030, mod_b_len * 0.80),
                          hull_mat, seed=513, count=8, detail=detail)
