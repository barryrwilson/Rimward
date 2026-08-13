"""Freehold Compact - FREIGHTER, the travelling neighbourhood.

Bible §4.3: "mobile homestead: a huge slow carrier with habitation drums,
greenhouse galleries, water tanks, workshops, family craft docks, and cargo
pods on a structural spine.  It is a travelling neighbourhood and must berth
outside."

Three zones with real seams between them (SpaceShipIdeas/synthesis/20 rule 1):
  bow  22 % command block: bow docking collar, sensor mast, rescue hatch,
        one open family-craft dock bay with a small craft modelled inside
        (§21 G5).  The bow block encloses the forward spine so the barn-red
        keel is only visible where it is not clad by the block.
  mid  51 % the homestead: two large habitation drums centred on the spine
        Z axis; their hub cylinders protrude at each drum face and the
        eight face-spokes read as spin-section at any viewing angle (§20
        rule 7, item 8).  A dorsal greenhouse barrel runs the length of the
        mid zone with ROOF_PANE galleries.  Two ranks of water tanks are
        slung under the keel.  A workshop block with surface greeble gear.
        Cargo pods in a ranked pair per flank.  One open cargo bay with a
        container inside (§21 G5).  Supply lockers and donated plate courses
        spread across both flanks at constant pitch.
  stern 27 % an OPEN SOUND FRAME of four longitudinal spars, two rectangular
        hoops and crossed yard bracing — genuinely EMPTY (§21 G2), the
        Freehold thumbnail signature.  Then a solid drive block with eight
        nozzle rings in a 4 × 2 countable grid behind a wide annular drive
        shield (the NASA nuclear-shuttle read), and flat empty radiator panels
        breaking the outline port and starboard (§21 G3).

The truss gap spans 7 % of hull length; that emptiness is the one mark that
distinguishes a Freehold hull from every closed-shell faction at thumbnail size.

Measured (target for scripts/measure-ships.mjs):
  span  ≈ 77 m  (Z-axis dominant; bow collar to nozzle tip)
  spanX ≈ 14 m  (hab drums, CYL_ALONG_Z, ±7.14 m radius from Z axis)
  spanY ≈ 14 m  (same drums; greenhouse does not exceed drum radius)
  spanZ / spanX = 5.5 ≥ 1.05 ✓
  spanY / spanZ = 0.18 ≤ 0.62 ✓
  spanX / spanZ = 0.18 ≥ 0.16 ✓
  proxyCover ≥ 80 %: all geometry within drum_r = 7.14 m of the Z axis;
    radiator outer edges at 6.55 m, pod outer edges ≤ 6.89 m, both inside.

Measured (node scripts/measure-ships.mjs freehold, l = 85.0):
  verts 78 868, span 76.6 in the freighter band [66.00, 109.20]
  spanZ/spanX 4.26, spanY/spanZ 0.19, spanX/spanZ 0.23
  proxyCover 100 %, fit w 24 % / h 24 % / l 34 %
  lod0 40 048 triangles (cap 60 000); lod1, lod2 and lod3 clear their
  24 000 / 8 000 / 4 000 caps under scripts/validate-ship-assets.mjs, and the
  ship is one 26-connected body under probe-ship-islands.mjs.
  The window ranks are the density: 80 drum z-positions × 2 drums × 11 strips,
  110 greenhouse rows × 5 panes, ≈ 88 spine-flank z-positions per side, all at
  the fleet PORT_SPACING pitch — more windows, never bigger windows.
  Below detail 2 the drum spokes halve to four per face and the water-tank rank
  drops to the two original pairs; that is what keeps lod2 inside 8 000
  triangles, which it exceeded (8 576) before the cut.

Connectivity — all lamps, ports, and the docked craft are now surface-seated:
  rescue hatch: loc x = bow_hw − AIRLOCK[0]×0.5 so collar overlaps bow block ≥ 0.08 m
  bow-cabin-wins: z = bow_front + PORT_LIGHT[2]×0.5 (forward face flush with bow) ✓
  flood-workshop: y = ws_y + ws_h×0.5 (on workshop top face, not 1 m above it) ✓
  spine markers: upper bound = truss_z0 so no marker enters the drive block interior ✓
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf


# =============================================================================
# FREIGHTER SPINE STATIONS
# The spine is the structural keel that the neighbourhood was built onto.
# It is narrower than the hab drums so the drum silhouette dominates from
# ahead or astern.  It widens only in the homestead mid-zone and tapers to a
# small cross-section at the aft transom where the open truss begins.
# Called with l=85.0 b=46.75 h=25.5 (from CLASSES).
# =============================================================================

def _freighter_stations(l, b, h):
    """16 stations for the freighter spine keel, -l*0.44 to l*0.26."""
    sw = b * 0.055   # 2.57 m half-width at normal sections
    mw = b * 0.080   # 3.74 m half-width in the homestead zone
    sh = h * 0.075   # 1.91 m half-height at normal sections
    mh = h * 0.105   # 2.68 m half-height in the homestead zone
    return [
        sf.fair(-l * 0.44, sw * 0.28, sh * 0.32, 0.0),   # bow tip (sharp)
        sf.fair(-l * 0.40, sw * 0.58, sh * 0.52, 0.0),
        sf.fair(-l * 0.35, sw * 0.82, sh * 0.77, 0.0),
        sf.fair(-l * 0.28, sw,         sh,         0.0),   # bow / mid seam
        sf.fair(-l * 0.22, mw * 0.90,  mh * 0.88,  0.0),
        sf.fair(-l * 0.15, mw,          mh,          0.0),  # fwd drum station
        sf.fair(-l * 0.08, mw * 1.04,  mh * 1.04,  0.0),
        sf.fair(-l * 0.01, mw * 1.06,  mh * 1.06,  0.0),  # midship maximum
        sf.fair( l * 0.06, mw * 1.04,  mh * 1.04,  0.0),
        sf.fair( l * 0.12, mw,          mh,          0.0),  # aft drum station
        sf.fair( l * 0.17, sw,          sh,          0.0),  # homestead aft
        sf.fair( l * 0.20, sw * 0.92,  sh * 0.90,  0.0),
        sf.fair( l * 0.22, sw * 0.85,  sh * 0.82,  0.0),
        sf.fair( l * 0.24, sw * 0.78,  sh * 0.74,  0.0),
        sf.fair( l * 0.25, sw * 0.72,  sh * 0.66,  0.0),
        sf.fair( l * 0.26, sw * 0.65,  sh * 0.58,  0.0),  # spine aft transom
    ]


# =============================================================================
# FREIGHTER — TRAVELLING NEIGHBOURHOOD
# =============================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    D = kit.ROLE_ARMOUR   # donated section / cream plate
    A = kit.ROLE_ACCENT   # replaced panel / clamped-on part  (sparse)
    T = kit.ROLE_TRIM

    st = _freighter_stations(l, b, h)

    # ── Zone boundary anchors ─────────────────────────────────────────────────
    # The truss gap begins where the spine aft transom ends (truss_z0) and runs
    # to the drive block front face (truss_z1).  Gap = 5.5 m = 7 % of hull.
    truss_z0 = l * 0.260   # = 22.1 m (spine transom, homestead aft face)
    truss_z1 = l * 0.325   # = 27.6 m (drive block front face)

    # Spar corner positions must be inside the spine cross-section at truss_z0 so
    # the probe sees endpoints embedded in the spine volume.  At z = l*0.252:
    #   hw ≈ 1.81 m, hh ≈ 1.23 m, chamfer ≈ 0.47 m — (1.22, 1.07) is inside.
    frame_x = b * 0.026    # 1.22 m
    frame_y = h * 0.042    # 1.07 m

    # ── Drive block — own local anchors (separated by the truss) ─────────────
    drive_z    = l * 0.380   # centre z  = 32.3 m
    drive_len  = l * 0.110   # 9.35 m axial length
    drive_cy   = 0.0
    drive_hw   = b * 0.080   # 3.74 m half-width → outer nozzle col at 2.67 m ✓
    drive_hh   = h * 0.145   # 3.70 m half-height → nozzle rows at ±1.32 m ✓
    drive_ch   = h * 0.060   # chamfer
    drive_top  = drive_cy + drive_hh
    drive_face = drive_z + drive_len * 0.5   # = 36.98 m, nozzle mount face

    # 4 × 2 nozzle grid: columns at ±nozzle_dx and ±3·nozzle_dx (both < drive_hw)
    nozzle_dx  = drive_hw / 4.2    # 0.89 m; outer col at 2.67 m < 3.74 m ✓
    nozzle_dy  = drive_hh / 2.8    # 1.32 m
    nozzle_r   = h * 0.042         # 1.07 m nozzle radius
    nozzle_dep = l * 0.025         # 2.13 m ring depth

    # ── Hab drums — CYL_ALONG_Z (barrel sections centred on the spine Z axis) ─
    # drum_r > spine max half-width (3.96 m) so each drum encloses the spine.
    # From ahead/astern the drum reads as the dominant cross-section — the
    # spin-section cue (§20 rule 7, item 8).
    drum_r     = h * 0.280   # 7.14 m radius
    drum_depth = l * 0.085   # 7.23 m barrel length
    drum_hub_r = h * 0.038   # 0.97 m hub radius
    drum_zs    = (-l * 0.135, l * 0.045)   # fwd drum at -11.5 m, aft at +3.8 m

    # ── Greenhouse barrel — dorsal, CYL_ALONG_Z ──────────────────────────────
    gh_r     = h * 0.110   # 2.81 m radius; underside overlaps spine top
    gh_depth = l * 0.220   # 18.7 m (spans across both drums in z)
    gh_z     = -l * 0.060  # centre z = -5.1 m

    # ── Cargo pods — three ranked pairs (port and stbd) in the mid zone ───────
    # Pod centre offset = spine_hw + pod_r * 0.75, so the pod cylinder always
    # overlaps the spine by 0.25 × pod_r — connectivity holds at every LOD.
    pod_r     = h * 0.043   # 1.10 m radius
    pod_depth = l * 0.075   # 6.38 m
    pod_zs    = (-l * 0.120, -l * 0.060, l * 0.060, l * 0.140, l * 0.200)   # -10.2, -5.1, +5.1, +11.9, +17.0 m

    # ── Bow command block ─────────────────────────────────────────────────────
    # Encloses the forward spine (bow block wider than spine in that z range).
    bow_hw   = b * 0.060    # 2.81 m half-width
    bow_hh   = h * 0.095    # 2.42 m half-height
    bow_z    = -l * 0.360   # centre z = -30.6 m
    bow_len  = l * 0.170    # 14.45 m → front at -37.83 m, aft at -23.38 m
    bow_cy   = bow_hh * 0.08   # 0.19 m upward trim
    bow_front = bow_z - bow_len * 0.5   # = -37.83 m

    # Fleet-standard docking collar at the bow block front face.
    collar_r = h * 0.070    # 1.79 m major radius

    # ── Radiators — flat empty panels port and stbd of drive block ────────────
    # Outer edge at drive_hw + rad_hw = 3.74 + 2.81 = 6.55 m < drum_r = 7.14 m.
    # Every vertex is within the capsule proxy radius (drum_r).
    rad_hw = b * 0.060   # 2.81 m
    rad_t  = h * 0.014   # 0.36 m thickness

    # ── Supply lockers ────────────────────────────────────────────────────────
    locker_gap = h * 0.030   # 0.77 m stand-off from spine flank
    locker_cy  = -h * 0.015  # near spine mid-height
    locker_zs  = (-l * 0.140, -l * 0.010, l * 0.110)

    # ── Plate courses (4 positions per flank) ────────────────────────────────
    plate_zs = [-l * 0.180 + i * (l * 0.090) for i in range(4)]

    # ──────────────────────────────────────────────────────────────────────────
    # PRIMARY MASSES  (all detail levels — lod0 target ≈ 3 400 tris)
    # ──────────────────────────────────────────────────────────────────────────

    # Spine keel — the structural backbone.  16 stations; narrower than the
    # drums so the drum profile is the dominant cross-section from bow or stern.
    kit.hull_loft(parts, 'spine-keel', H, st, hull_mat)

    # Two habitation drums, each enclosing the spine.
    # Hub depth = drum_depth + l*0.012 so the hub collar protrudes at each face,
    # making the hub ring visible against the drum barrel from any angle.
    for di, dz in enumerate(drum_zs):
        kit.cyl(parts, 'hab-drum.%02d' % di, D,
                (0.0, 0.0, dz),
                drum_r, drum_depth, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=16)
        kit.cyl(parts, 'hab-drum-hub.%02d' % di, T,
                (0.0, 0.0, dz),
                drum_hub_r, drum_depth + l * 0.012, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=12)

    # Drive block — the second solid volume.
    kit.chamfer_block(parts, 'drive-block', H,
                      (0.0, drive_cy, drive_z),
                      (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                      hull_mat, chamfer=drive_ch, bevel=h * 0.012)

    # Drive shield — wide annular torus at the drive block's forward face.
    # Placed so its aft half overlaps the drive block (connectivity).
    # Reads as the thermal/radiation shield of the NASA nuclear-shuttle layout.
    kit.torus(parts, 'drive-shield', D,
              (0.0, drive_cy, truss_z1),
              drive_hh * 1.10, l * 0.016,
              hull_mat, rotation=sf.CYL_ALONG_Z)

    # Eight nozzles in a 4 × 2 grid — every nozzle a distinct countable unit.
    # Columns at ±nozzle_dx and ±3·nozzle_dx; rows at ±nozzle_dy.
    for row, dy in enumerate((-nozzle_dy, nozzle_dy)):
        for col, dx in enumerate((-3.0 * nozzle_dx, -nozzle_dx,
                                   nozzle_dx,  3.0 * nozzle_dx)):
            kit.nozzle_ring(parts, glow,
                            'drive-nozzle.r%dc%d' % (row, col),
                            (dx, drive_cy + dy, drive_face),
                            hull_mat, glow_mat,
                            radius=nozzle_r, depth=nozzle_dep)

    # Radiator panels: flat, EMPTY slabs that break the drive-block outline.
    # No detail is ever added to them — thermal truth, not surface decoration
    # (§20 rule 2, §21 G3).
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.taper_block(parts, 'radiator-%s' % side, D,
                        (sign * (drive_hw + rad_hw * 0.88),
                         drive_cy, drive_z - l * 0.018),
                        (rad_hw * 2.0, rad_t * 2.0, drive_len * 1.12),
                        hull_mat,
                        front=(0.50, 0.28), back=(1.0, 0.78),
                        bevel=h * 0.004)

    # Bow command block — encloses the forward spine (bow block is wider than
    # the spine at every bow-zone z section, so they share volume and are one
    # connected component without extra struts).
    kit.chamfer_block(parts, 'bow-block', H,
                      (0.0, bow_cy, bow_z),
                      (bow_hw * 2.0, bow_hh * 2.0, bow_len),
                      hull_mat, chamfer=bow_hh * 0.28, bevel=h * 0.008)

    # Fleet-standard docking collar: centre at the bow block front face.
    # Aft half of the torus overlaps the bow block for connectivity.
    kit.torus(parts, 'bow-docking-collar', D,
              (0.0, bow_cy, bow_front),
              collar_r, l * 0.010,
              hull_mat, rotation=sf.CYL_ALONG_Z)

    # Cargo pods — three pairs in the mid zone.
    # Each pod centre is placed at spine_hw + pod_r * 0.75 so the pod cylinder
    # overlaps the spine by 0.25 × pod_r at every z: connectivity without struts.
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        for pi, pz in enumerate(pod_zs):
            sx  = sf.flank_x(st, pz, 0.0)
            pcx = sign * (sx + pod_r * 0.75)
            kit.cyl(parts, 'cargo-pod-%s.%02d' % (side, pi), D,
                    (pcx, 0.0, pz),
                    pod_r, pod_depth, hull_mat,
                    rotation=sf.CYL_ALONG_Z, vertices=12)

    # Open truss gap — the Freehold thumbnail signature (§21 G2).
    # Four longitudinal spars; each end embeds in its respective solid volume
    # (spine or drive block) by l*0.008 so the probe sees one component.
    # The gap between them is left EMPTY: no tanks, no struts, no fill.
    for xi, yi, fname in ((-1, -1, 'll'), (1, -1, 'lr'),
                          (-1,  1, 'ul'), (1,  1, 'ur')):
        kit.strut(parts, 'truss-spar-%s' % fname, T,
                  (xi * frame_x, yi * frame_y, truss_z0 - l * 0.008),
                  (xi * frame_x, yi * frame_y, truss_z1 + l * 0.008),
                  hull_mat, radius=h * 0.030)

    # Two rectangular hoops in the gap.  Each hoop endpoint falls on a spar axis,
    # so the hoop overlaps the spar cylinder — connected indirectly to both spine
    # and drive block through the spars.
    for hi, hz in enumerate((truss_z0 + l * 0.024, truss_z0 + l * 0.050)):
        kit.strut(parts, 'truss-hoop-top.%02d' % hi, T,
                  (-frame_x, frame_y, hz), (frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.022)
        kit.strut(parts, 'truss-hoop-bot.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (frame_x, -frame_y, hz),
                  hull_mat, radius=h * 0.022)
        kit.strut(parts, 'truss-hoop-port.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (-frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.022)
        kit.strut(parts, 'truss-hoop-stbd.%02d' % hi, T,
                  (frame_x, -frame_y, hz), (frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.022)

    # Crossed yard bracing — opposite diagonals, yard work not factory symmetry.
    kit.strut(parts, 'truss-brace-port', T,
              (-frame_x, -frame_y, truss_z0), (-frame_x, frame_y, truss_z1),
              hull_mat, radius=h * 0.018)
    kit.strut(parts, 'truss-brace-stbd', T,
              (frame_x,  frame_y, truss_z0),  (frame_x, -frame_y, truss_z1),
              hull_mat, radius=h * 0.018)

    # ──────────────────────────────────────────────────────────────────────────
    # SECONDARY MASSES, BAY CONTENTS, PLATE COURSES  (detail 1+)
    # lod1 target ≈ 6 700 tris (adds ≈ 3 300 to lod0)
    # ──────────────────────────────────────────────────────────────────────────
    if detail >= 1:

        # ── Drum face spokes ──────────────────────────────────────────────────
        # Eight radial spokes per drum face (two faces per drum) from the hub
        # surface to the drum inner rim.  The hub protrudes beyond each drum
        # face so at face_z the hub IS present; the spoke endpoints overlap both
        # the hub cylinder and the drum end cap.
        # Spoke count halves below detail 2: at LOD2 the spin section still has
        # to read as hub-and-spokes, but 32 eight-sided struts alone cost ~1,000
        # triangles against an 8,000 cap for the whole ship.
        spoke_r = h * 0.016
        n_spokes = 8 if detail >= 2 else 4
        for di, dz in enumerate(drum_zs):
            for face_sign in (-1.0, 1.0):
                face_z = dz + face_sign * drum_depth * 0.5
                for si in range(n_spokes):
                    angle = 2.0 * math.pi * si / n_spokes
                    ca, sa = math.cos(angle), math.sin(angle)
                    kit.strut(parts,
                               'drum-spoke.%02d.f%d.s%02d' % (
                                   di, int(face_sign > 0), si),
                               T,
                               (drum_hub_r * ca, drum_hub_r * sa, face_z),
                               (drum_r      * ca, drum_r      * sa, face_z),
                               hull_mat, radius=spoke_r)

        # ── Greenhouse barrel ─────────────────────────────────────────────────
        # Dorsal CYL_ALONG_Z barrel on the spine roof; spans across both drums
        # in z.  gh_cy places the underside into the spine top by 0.28 × gh_r.
        gh_spine_top = sf.top_y(st, gh_z, 0.0)
        gh_cy        = gh_spine_top + gh_r * 0.72
        kit.cyl(parts, 'greenhouse-barrel', D,
                (0.0, gh_cy, gh_z),
                gh_r, gh_depth, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=16)

        # ── Water tanks ───────────────────────────────────────────────────────
        # Six port/stbd pairs slung below the spine keel.  Each sphere centre is
        # 0.8 × tank_r below the keel bottom so the top 0.2 × tank_r overlaps
        # the spine — connectivity without extra struts.
        tank_r = h * 0.080
        _tank_zs = (
            -l * 0.160,   # -13.6 m  (inside fwd drum z range, on spine)
            -l * 0.100,   # -8.5 m   (original fwd pair)
            -l * 0.040,   # -3.4 m   (between drums, fully visible below spine)
             l * 0.030,   # +2.6 m   (original aft pair)
             l * 0.090,   # +7.7 m   (clear of aft drum)
             l * 0.160,   # +13.6 m  (mid homestead aft)
        )
        # Below detail 2 only the two original pairs are carried: a rank of six
        # 12-segment spheres per side costs ~1,600 triangles at LOD2.
        tank_zs_lod = _tank_zs if detail >= 2 else (-l * 0.100, l * 0.030)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for ti, tz in enumerate(tank_zs_lod):
                spine_bot = sf.bottom_y(st, tz, 0.0)
                tank_cy   = spine_bot - tank_r * 0.80
                # tank top at spine_bot + 0.20*tank_r — overlaps spine ✓
                kit.sphere(parts, 'water-tank-%s.%02d' % (side, ti), D,
                           (sign * b * 0.028, tank_cy, tz),
                           (tank_r, tank_r, tank_r * 1.25), hull_mat,
                           segments=12)

        # ── Workshop block ────────────────────────────────────────────────────
        # Donated armour block on the spine roof in the mid zone.
        # Its base overlaps the spine top by 0.20 × ws_h.
        ws_z  = -l * 0.210
        ws_hw = b * 0.065
        ws_h  = h * 0.100
        ws_len = l * 0.070
        ws_y  = sf.top_y(st, ws_z, 0.0) - ws_h * 0.20
        kit.chamfer_block(parts, 'workshop-block', D,
                          (0.0, ws_y, ws_z),
                          (ws_hw * 2.0, ws_h, ws_len),
                          hull_mat, chamfer=ws_h * 0.22, bevel=h * 0.007)

        # ── Keel skid ─────────────────────────────────────────────────────────
        # The freighter sets down at homesteads.  Shoe tapers at both ends.
        skid_zs  = (-l * 0.390, -l * 0.300, -l * 0.220)
        skid_h   = h * 0.055
        skid_bot = min(sf.bottom_y(st, z, 0.0) for z in skid_zs)
        kit.taper_block(parts, 'keel-skid', D,
                        (0.0, skid_bot + skid_h * 0.35, -l * 0.305),
                        (b * 0.075, skid_h, l * 0.170),
                        hull_mat, front=(0.45, 0.40), back=(0.70, 0.55),
                        bevel=h * 0.006)

        # ── Spine plate courses ───────────────────────────────────────────────
        # Four donated armour plates per flank in the mid zone service band.
        # Each plate is seated at its own station so it tracks the hull line.
        plate_h  = h * 0.150
        plate_t  = b * 0.024
        plate_cy = sf.top_y(st, 0.0, 0.0) - plate_h * 0.50
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for pli, plz in enumerate(plate_zs):
                fx = sf.flank_x(st, plz, plate_cy)
                kit.box(parts, 'spine-plate-%s.%02d' % (side, pli), D,
                        (sign * (fx + plate_t * 0.30), plate_cy, plz),
                        (plate_t,
                         plate_h * (1.0 - 0.04 * (pli % 2)),
                         l * 0.088),
                        hull_mat, bevel=h * 0.007)

        # ── Family-craft dock bay with small craft inside (§21 G5) ───────────
        # Recessed into the port flank of the bow block.
        dock_z   = -l * 0.370
        dock_hw  = bow_hw * 0.68
        dock_hh  = bow_hh * 0.55
        dock_len = bow_len * 0.38
        bay_cx   = -(bow_hw - dock_hw * 0.18)
        kit.box(parts, 'craft-dock-bay', kit.ROLE_RECESS,
                (bay_cx, bow_cy, dock_z),
                (dock_hw * 2.0, dock_hh * 2.0, dock_len),
                hull_mat)
        # Small craft: a wedge that reads as a launch, overlapping the bay floor.
        kit.wedge(parts, 'craft-dock-smallcraft', D,
                  (bay_cx + dock_hw * 0.12, bow_cy, dock_z),
                  (dock_hw * 0.62, dock_hh * 0.58, dock_len * 0.68),
                  hull_mat, taper=(0.28, 0.48), bevel=h * 0.004)

        # ── Open cargo bay with container inside (§21 G5) ────────────────────
        # Recessed into the spine roof in the aft mid zone.
        cargo_z   = l * 0.085
        cargo_hw  = b * 0.055
        cargo_hh  = h * 0.110
        cargo_len = l * 0.075
        sp_top    = sf.top_y(st, cargo_z, 0.0)
        kit.box(parts, 'cargo-bay-recess', kit.ROLE_RECESS,
                (0.0, sp_top - cargo_hh * 0.28, cargo_z),
                (cargo_hw * 2.0, cargo_hh, cargo_len),
                hull_mat)
        kit.box(parts, 'cargo-container', D,
                (0.0, sp_top - cargo_hh * 0.55, cargo_z),
                (cargo_hw * 1.28, cargo_hh * 0.62, cargo_len * 0.78),
                hull_mat, bevel=h * 0.006)

        # ── Pod struts ────────────────────────────────────────────────────────
        # Visible mounting hardware.  Each strut starts inside the spine and
        # ends inside the pod volume (at pod_inner + pod_r * 0.60 ✓).
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for pi, pz in enumerate(pod_zs):
                sx  = sf.flank_x(st, pz, 0.0)
                pcx = sign * (sx + pod_r * 0.75)
                pod_inner_x = sign * (abs(pcx) - pod_r)
                for si, sz_off in enumerate((-pod_depth * 0.26, pod_depth * 0.26)):
                    kit.strut(parts,
                               'pod-strut-%s.%02d.%d' % (side, pi, si), T,
                               (sign * (sx - h * 0.020), 0.0, pz + sz_off),
                               (sign * (abs(pod_inner_x) + pod_r * 0.60),
                                0.0, pz + sz_off),
                               hull_mat, radius=h * 0.018)

        # ── Supply lockers ────────────────────────────────────────────────────
        # Absolute SUPPLY_LOCKER boxes clamped to the spine flanks.  Each locker
        # stands off the spine on two struts; the gap is a shadow line that reads
        # as hardware, not paint.
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for li, lz in enumerate(locker_zs):
                flank_x = sf.flank_x(st, lz, locker_cy)
                loc_x   = sign * (flank_x + locker_gap
                                  + sf.SUPPLY_LOCKER[0] * 0.5)
                kit.chamfer_block(parts,
                                   'supply-locker-%s.%02d' % (side, li), A,
                                   (loc_x, locker_cy, lz),
                                   sf.SUPPLY_LOCKER, hull_mat,
                                   chamfer=0.12, bevel=0.028)
                for ci, cz_off in ((0, -0.30), (1, 0.30)):
                    cz = lz + cz_off
                    kit.strut(parts,
                               'locker-clamp-%s.%02d.%d' % (side, li, ci), T,
                               (sign * (sf.flank_x(st, cz, locker_cy) - h * 0.012),
                                locker_cy, cz),
                               (loc_x - sign * sf.SUPPLY_LOCKER[0] * 0.5,
                                locker_cy, cz),
                               hull_mat, radius=h * 0.012)

        # ── Handrails along the spine roof ────────────────────────────────────
        # Mid-zone catwalk rail (existing central pair), plus bow-zone and
        # aft-homestead pairs for the full neighbourhood access route.
        _rail_specs = [
            (-l * 0.080, l * 0.180, 6),   # mid catwalk (original)
            (-l * 0.310, l * 0.120, 5),   # bow access ramp
            ( l * 0.170, l * 0.080, 4),   # aft homestead stub
            ( l * 0.065, l * 0.100, 5),   # aft drum approach
        ]
        for rail_z, rail_len, n_posts in _rail_specs:
            for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
                rail_x = sf.flat_half(st, rail_z) * 0.82
                kit.handrail(parts, 'spine-rail-%s.%d' % (side, int(abs(rail_z * 10))),
                             (sign * rail_x,
                              sf.top_y(st, rail_z, sign * rail_x) - h * 0.004,
                              rail_z),
                             hull_mat, length=rail_len, axis='z', posts=n_posts)

    # ──────────────────────────────────────────────────────────────────────────
    # SEAMS AND SERVICE EQUIPMENT  (detail 2+)
    # lod2 target ≈ 7 600 tris (adds ≈ 900 to lod1)
    # ──────────────────────────────────────────────────────────────────────────
    if detail >= 2:

        # Zone seam ring at the bow / mid junction
        seam_z = -l * 0.280
        kit.panel_lines(parts, 'seam-bow-mid',
                        (0.0, 0.0, seam_z),
                        (sf.flank_x(st, seam_z, 0.0) * 2.0,
                         h * 0.075 * 2.0, l * 0.022),
                        hull_mat, count=1, axis='z', depth=0.30)

        # Zone seam ring at the mid / truss junction (spine aft transom)
        seam_z2 = l * 0.260
        kit.panel_lines(parts, 'seam-mid-truss',
                        (0.0, 0.0, seam_z2),
                        (sf.flank_x(st, seam_z2, 0.0) * 2.0,
                         h * 0.075 * 2.0, l * 0.020),
                        hull_mat, count=1, axis='z', depth=0.30)

        # Sensor mast on the bow block roof
        mast_base_y = bow_cy + bow_hh + h * 0.004
        kit.sensor_mast(parts, glow, 'bow-sensor-mast',
                        (0.0, mast_base_y, bow_z + bow_len * 0.18),
                        hull_mat, glow_mat,
                        height=h * 0.130, radius=h * 0.018)

        # Rescue hatch on the starboard flank of the bow block.
        # loc x = bow_hw − AIRLOCK[0]×0.5 places the bounding-volume +x face at
        # bow_hw; the collar's inner face then sinks in by c_sink = cd×0.20 ≈ 0.08 m,
        # so it overlaps the bow block by 0.08 m — connectivity ✓ (was bow_hw, no overlap)
        kit.rescue_hatch(parts, glow, 'bow-rescue-hatch',
                         (bow_hw - sf.AIRLOCK[0] * 0.5, bow_cy, bow_z - bow_len * 0.12),
                         hull_mat, glow_mat,
                         size=(sf.AIRLOCK[0], sf.AIRLOCK[1], sf.AIRLOCK[2]),
                         face='x')

        # Work floodlights on the workshop forward and aft faces.
        # ws_top_y = ws_y + ws_h*0.5 = workshop block top face.
        # OLD formula (sf.top_y + 0.80*ws_h + FLOOD_LAMP[1]) placed floods
        # ≈ 1.0 m ABOVE the workshop top → floating group.  Now seated on
        # workshop top; outer face 0.06 m above block ✓.
        ws_top_y = ws_y + ws_h * 0.5
        kit.window_row(glow, 'flood-workshop-fwd',
                       (0.0, ws_top_y, ws_z - l * 0.036),
                       glow_mat, 2, sf.PORT_SPACING * 1.60, sf.FLOOD_LAMP)
        kit.window_row(glow, 'flood-workshop-aft',
                       (0.0, ws_top_y, ws_z + l * 0.036),
                       glow_mat, 2, sf.PORT_SPACING * 1.60, sf.FLOOD_LAMP)

        # Navigation marker lamps at ≈ 8 m pitch along the spine flanks.
        # Half the positions at detail == 2; all at detail >= 3 (§20 rule 4).
        all_marker_zs = []
        mz = -l * 0.370
        while mz <= l * 0.420:
            all_marker_zs.append(mz)
            mz += 8.0
        if detail == 2:
            all_marker_zs = all_marker_zs[::2]
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for mki, mkz in enumerate(all_marker_zs):
                if mkz < -l * 0.43 or mkz > truss_z0:
                    # truss_z0 = l*0.26 = 22.1 m.  Markers only on the spine;
                    # z = 32.55 (drive block interior) excluded — floated
                    # inside the drive block with no surface voxels nearby ✓.
                    continue
                mk_x = sf.flank_x(st, mkz, -h * 0.008)
                kit.window_row(glow, 'marker-%s.%03d' % (side, mki),
                               (sign * mk_x, -h * 0.008, mkz),
                               glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Drive-status readout slits on the drive block roof
        n_status = 4 if detail >= 3 else 2
        kit.window_row(glow, 'drive-status',
                       (0.0,
                        drive_top + sf.STATUS_SLIT[1] * 0.5,
                        drive_z - drive_len * 0.18),
                       glow_mat, n_status, sf.PORT_SPACING * 1.20, sf.STATUS_SLIT)

        # Fleet-standard docking collar tori at drum hub face positions.
        # Each torus centre is placed at the drum face (hub surface); its aft half
        # overlaps the hub cylinder by minor_r so the collar reads attached ✓.
        # collar_r = fleet diameter used on the bow (consistent read fleet-wide).
        for di, dz in enumerate(drum_zs):
            for face_sign, fname in ((-1.0, 'fwd'), (1.0, 'aft')):
                face_z = dz + face_sign * drum_depth * 0.5
                kit.torus(parts, 'drum-collar.%02d.%s' % (di, fname), T,
                          (0.0, 0.0, face_z),
                          drum_hub_r * 1.25, l * 0.010,
                          hull_mat, rotation=sf.CYL_ALONG_Z)

        # Module face seams: one ring per drum face, two per drum.
        # Seats at zero y so each strip spans the full hub-plus-drum cross section.
        for di, dz in enumerate(drum_zs):
            for face_sign, fname in ((-1.0, 'fwd'), (1.0, 'aft')):
                sface_z = dz + face_sign * (drum_depth * 0.5 + l * 0.005)
                kit.panel_lines(parts, 'drum-face-seam.%02d.%s' % (di, fname),
                                (0.0, 0.0, sface_z),
                                (drum_r * 2.0, drum_r * 2.0, l * 0.018),
                                hull_mat, count=1, axis='z', depth=0.30)

        # Greenhouse spine seams: ring just INSIDE each end of the greenhouse
        # barrel. An offset past the end face leaves the ring in open air — that
        # is what the island probe found at z = +4.76 — so the offset is pulled
        # l*0.004 inboard of the barrel end and the ring cuts the barrel skin.
        for gi, gz_off in ((0, -(gh_depth * 0.5 - l * 0.004)),
                           (1,  (gh_depth * 0.5 - l * 0.004))):
            gh_sz = gh_z + gz_off
            kit.panel_lines(parts, 'gh-seam.%02d' % gi,
                            (0.0, sf.top_y(st, gh_z, 0.0) + gh_r * 0.72, gh_sz),
                            (gh_r * 2.0, gh_r * 2.0, l * 0.018),
                            hull_mat, count=1, axis='z', depth=0.25)

    # ──────────────────────────────────────────────────────────────────────────
    # WARM WINDOWS  (detail 2+)
    # Drum surface windows at PORT_SPACING pitch are the primary scale cue for
    # the whole ship (§20 rule 4, §21 G4).  A bigger ship carries MORE windows,
    # never bigger windows — the constant pitch is what reads as neighbourhood.
    # ──────────────────────────────────────────────────────────────────────────
    if detail >= 2:
        n_drum_z   = 80 if detail >= 3 else 12   # z-positions per drum barrel
        n_top_wins = 5  if detail >= 3 else 3    # ROOF_PANE count per top strip
        # 80 pos × 2 drums × 11 strips (top×5 + stbd×1 + port×1 + 4 diag×1) = 1760 boxes
        # 12 pos × 2 drums × 5 strips  (top×3 + stbd×1 + port×1)            =  120 boxes (lod1)

        # Longitudinal window positions spaced evenly across the drum depth.
        drum_z_half = drum_depth * 0.5 - sf.PORT_SPACING * 0.5
        drum_z_offsets = [
            -drum_z_half + k * (drum_depth - sf.PORT_SPACING)
            / max(n_drum_z - 1, 1)
            for k in range(n_drum_z)
        ]

        # Diagonal drum-radius components for the 45° strips (unit circle × drum_r).
        _drum_diag = drum_r * 0.7071   # drum_r × sin(45°) = drum_r × cos(45°)

        for di, dz in enumerate(drum_zs):
            for zk, dz_off in enumerate(drum_z_offsets):
                wz = dz + dz_off
                # Roof-pane strip across the drum top (y = +drum_r) — n_top_wins ROOF_PANE
                kit.window_row(glow, 'drum-top.%02d.%03d' % (di, zk),
                               (0.0, drum_r, wz),
                               glow_mat, n_top_wins, sf.PORT_SPACING, sf.ROOF_PANE)
                # Cabin windows at the starboard and port equators (x = ±drum_r)
                kit.window_row(glow, 'drum-stbd.%02d.%03d' % (di, zk),
                               (drum_r, 0.0, wz),
                               glow_mat, 1, 0.0, sf.FLANK_PORT)
                kit.window_row(glow, 'drum-port.%02d.%03d' % (di, zk),
                               (-drum_r, 0.0, wz),
                               glow_mat, 1, 0.0, sf.FLANK_PORT)
                # Four diagonal bands at 45°, 135°, 225°, 315° — warm window
                # repetition at constant PORT_SPACING pitch (§20 rule 4, §21 G4).
                # _drum_diag = drum_r × cos(45°) = drum_r × 0.7071; positions lie
                # exactly on the drum cylinder surface, inner faces 0.03 m inside ✓.
                if detail >= 3:
                    kit.window_row(glow, 'drum-urstbd.%02d.%03d' % (di, zk),
                                   (_drum_diag, _drum_diag, wz),
                                   glow_mat, 1, 0.0, sf.FLANK_PORT)
                    kit.window_row(glow, 'drum-urport.%02d.%03d' % (di, zk),
                                   (-_drum_diag, _drum_diag, wz),
                                   glow_mat, 1, 0.0, sf.FLANK_PORT)
                    kit.window_row(glow, 'drum-lrstbd.%02d.%03d' % (di, zk),
                                   (_drum_diag, -_drum_diag, wz),
                                   glow_mat, 1, 0.0, sf.FLANK_PORT)
                    kit.window_row(glow, 'drum-lrport.%02d.%03d' % (di, zk),
                                   (-_drum_diag, -_drum_diag, wz),
                                   glow_mat, 1, 0.0, sf.FLANK_PORT)

        # Greenhouse ROOF_PANE rows along the barrel crest at PORT_SPACING pitch.
        # 110 rows × 5 panes = 550 boxes (lod0);  24 × 3 = 72 boxes (lod1).
        n_gh_rows  = 110 if detail >= 3 else 24
        n_gh_panes = 5   if detail >= 3 else 3
        gh_spine_top2 = sf.top_y(st, gh_z, 0.0)
        gh_cy2        = gh_spine_top2 + gh_r * 0.72
        gh_pane_y     = gh_cy2 + gh_r - sf.ROOF_PANE[1] * 0.5
        for zi in range(n_gh_rows):
            gz = (gh_z - gh_depth * 0.5 + 0.20
                  + zi * (gh_depth - 0.40) / max(n_gh_rows - 1, 1))
            kit.window_row(glow, 'greenhouse-pane.%03d' % zi,
                           (0.0, gh_pane_y, gz),
                           glow_mat, n_gh_panes, sf.PORT_SPACING, sf.ROOF_PANE)

        # Bow block cabin windows on the forward face.
        # z = bow_front + PORT_LIGHT[2]*0.5: forward face of each box is flush
        # with bow block front face (bow_front); inner face 0.06 m inside block ✓.
        # OLD z = bow_front − l*0.002 placed windows 0.17 m AHEAD of block → float.
        n_bow = 6 if detail >= 3 else 2
        kit.window_row(glow, 'bow-cabin-wins',
                       (0.0,
                        bow_cy + sf.PORT_LIGHT[1] * 0.5,
                        bow_front + sf.PORT_LIGHT[2] * 0.5),
                       glow_mat, n_bow, sf.PORT_SPACING, sf.PORT_LIGHT)

        # Spine flank FLANK_PORT windows in the homestead mid zone.
        # Placed at PORT_SPACING pitch along z from the bow/mid seam to the
        # truss.  Drum z-ranges are skipped: drum windows cover those bands.
        # Outer face flush with spine flank (centre at flank_x − FLANK_PORT[0]×0.5);
        # inner face overlaps hull by FLANK_PORT[0] = 0.06 m → connectivity ✓.
        if detail >= 3:
            _fwd_drum_zlo = drum_zs[0] - drum_depth * 0.5 - sf.PORT_SPACING
            _fwd_drum_zhi = drum_zs[0] + drum_depth * 0.5 + sf.PORT_SPACING
            _aft_drum_zlo = drum_zs[1] - drum_depth * 0.5 - sf.PORT_SPACING
            _aft_drum_zhi = drum_zs[1] + drum_depth * 0.5 + sf.PORT_SPACING
            _sf_z0 = -l * 0.275 + sf.PORT_SPACING
            _sf_z1 = truss_z0 - sf.PORT_SPACING
            _n_sf  = int((_sf_z1 - _sf_z0) / sf.PORT_SPACING) + 1
            for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
                for wi in range(_n_sf):
                    sfwz = _sf_z0 + wi * sf.PORT_SPACING
                    if _fwd_drum_zlo < sfwz < _fwd_drum_zhi:
                        continue
                    if _aft_drum_zlo < sfwz < _aft_drum_zhi:
                        continue
                    sfwx = sf.flank_x(st, sfwz, 0.0)
                    if sfwx <= 0.0:
                        continue
                    kit.window_row(glow, 'spine-flank-%s.%03d' % (side, wi),
                                   (sign * (sfwx - sf.FLANK_PORT[0] * 0.5),
                                    0.0, sfwz),
                                   glow_mat, 1, 0.0, sf.FLANK_PORT)

    # ──────────────────────────────────────────────────────────────────────────
    # GREEBLE FIELDS AND PLATE GRID  (detail 3 only)
    # ──────────────────────────────────────────────────────────────────────────
    if detail >= 3:
        # Workshop roof: service valves and conduit boxes
        kit.greeble_field(parts, 'workshop-gear', T,
                          (0.0,
                           ws_y + ws_h * 0.5 - h * 0.014,
                           ws_z),
                          (ws_hw * 1.60, h * 0.028, ws_len * 0.80),
                          hull_mat, seed=401, count=12, detail=detail)
        # Drive block roof: instrumentation pods and coolant valves
        kit.greeble_field(parts, 'drive-roof-gear', T,
                          (0.0,
                           drive_top - h * 0.014,
                           drive_z),
                          (drive_hw * 1.40, h * 0.028, drive_len * 0.60),
                          hull_mat, seed=403, count=10, detail=detail)
        # Bow block roof: communications and sensor gear
        kit.greeble_field(parts, 'bow-roof-gear', T,
                          (0.0,
                           bow_cy + bow_hh - h * 0.012,
                           bow_z + bow_len * 0.10),
                          (bow_hw * 1.40, h * 0.024, bow_len * 0.30),
                          hull_mat, seed=407, count=8, detail=detail)
        # Workshop starboard face plating grid (4 cols × 3 rows).
        # Seated on the +x face; depth 0.25 = sinks 25 % into face ✓.
        kit.plate_grid(parts, 'ws-face-plates', T,
                       (0.0, ws_y, ws_z),
                       (ws_hw * 2.0, ws_h, ws_len),
                       hull_mat, cols=4, rows=3, face='x', depth=0.20)
