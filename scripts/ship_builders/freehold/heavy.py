"""Freehold Compact — HEAVY, the militia monitor.

Bible §4.3: "a reinforced work hull carrying bolt-on armour and defensive
turrets around an intact civilian core. Keep the greenhouse/cabin warmth
visible behind protection."

Three zones with hard seams between them (SpaceShipIdeas/synthesis/20 rule 1):
  bow  19 %  broad blunt work face: this hull pushes and lifts, not wedges
             through.  Bow fender ring on standoffs, forefoot keel wedge,
             rescue hatch, and flood lamps.  Seam collar at -28 % marks the
             structural junction where the work bow bolts onto the mid body.
  mid  55 %  armoured civilian core: the original farm/work hull body survives
             intact under bolt-on ROLE_ARMOUR plate courses.  Greenhouse house
             with barrel roof and a warm window row under the eaves sits exposed
             between the armour bands — warmth visible behind protection.
             Two shoulder flares break the outline at both ends of the armour
             zone (§21 G2 outline breaker).  Two militia barbettes on the
             forward shoulders carry clear arcs over the armour.
  stern 26 % an OPEN SOUND FRAME (12 % of l, §21 G2 outline breaker) — four
             longitudinal spars, two hoops and crossed yard bracing over a
             slung water tank — then a solid drive block with flat empty
             radiator panels and four countable nozzles in a 2×2 group
             (§21 G3 visible thermal hardware and distinct drive face).
The frame gap is 12 % of hull length (2.04 m at l = 17.0).

Bolt-on armour is ADDED history, not moulded hull: ROLE_ARMOUR plate_grid
courses stand proud on shadow gaps; flanks outside the armour band stay calm
(§20 rule 2 detail in a band).  Port-only rescue bracket is the deliberate
asymmetric yard detail (§21 G4).

Satisfies: §20 rule 1 (three zones + seams), rule 2 (detail in one band),
rule 3 (≤5 % emissive), rule 4 (constant-pitch human modules), rule 5
(exposed frame + empty truss gap), rule 6 (countable nozzle group 2×2),
rule 7 (flat radiators + distinct drive face), §21 G2 (outline breakers at
both shoulder flares), §21 G3 (radiators + drive face), §21 G4 (asymmetric
yard detail on port side only).

Connectivity fix: panel-seam strips now cut into the armour plate face
  (not the hull circumference), so each strip overlaps both the hull body
  and the armour plate — one 26-connected component guaranteed.
  Mid-deck greeble field capped to l×0.06 in z (was l×0.18) so no
  component outruns the hull top at the forward field edge.

Measured (node scripts/measure-ships.mjs freehold, l = 17.0):
  verts 14 340, span 17.0 in the heavy band [10.20, 23.80]
  spanZ/spanX 1.76, spanY/spanZ 0.43, spanX/spanZ 0.57
  proxyCover 100 %, fit w 24 % / h 24 % / l 34 %
  lod0 7 460 triangles (cap 60 000); one 26-connected body under
  node scripts/probe-ship-islands.mjs freehold heavy lod0

The density comes from the armour band, not from the calm hull: the flank
plate_grid courses run 9×7 per side and the shoulder flares carry 2×6 forward
and 2×5 aft, which is what lifts the monitor above the cutter it outranks
(charter floor for the class is 9 000 hull verts, SHIP_SCALE.heavy).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def _heavy_stations(l, b, h):
    """Militia monitor hull stations, bow face to transom collar.

    Thirteen stations give the work hull its character: the bow widens fast
    from a blunt face to full beam at the shoulder (a pusher bow, not a wedge),
    the mid section holds its beam and height for the full armour zone, and
    the last three stations taper quickly to a narrow transom collar that the
    sound-frame spars bolt into.  The overall section sits low on the Y axis
    (negative y_offset) so the keel and skid read below the datum.
    """
    return [
        sf.fair(-l * 0.46, b * 0.22, h * 0.16, -h * 0.060),  # blunt work face
        sf.fair(-l * 0.42, b * 0.30, h * 0.20, -h * 0.052),  # bow widens fast
        sf.fair(-l * 0.36, b * 0.38, h * 0.26, -h * 0.040),  # shoulder rising
        sf.fair(-l * 0.28, b * 0.42, h * 0.32, -h * 0.025),  # bow/mid seam
        sf.fair(-l * 0.20, b * 0.44, h * 0.40, -h * 0.008),  # mid body fills
        sf.fair(-l * 0.10, b * 0.45, h * 0.44,  h * 0.010),  # mid full beam
        sf.fair( 0.0,      b * 0.45, h * 0.45,  h * 0.015),  # mid peak
        sf.fair( l * 0.08, b * 0.44, h * 0.44,  h * 0.012),  # mid holds
        sf.fair( l * 0.14, b * 0.42, h * 0.42,  h * 0.006),  # mid steps
        sf.fair( l * 0.18, b * 0.38, h * 0.36, -h * 0.002),  # stepping down
        sf.fair( l * 0.21, b * 0.28, h * 0.28, -h * 0.014),  # transom narrows
        sf.fair( l * 0.23, b * 0.20, h * 0.22, -h * 0.024),  # transom collar
        sf.fair( l * 0.25, b * 0.14, h * 0.17, -h * 0.032),  # transom face
    ]


# =============================================================================
# HEAVY - MILITIA MONITOR
# Called with l=17.0 b=8.84 h=5.78 (from CLASSES).
# =============================================================================
def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    D = kit.ROLE_ARMOUR   # donated sections / cream plate-work / civilian core
    A = kit.ROLE_ACCENT   # bolt-on replacement panels, clamp-on fittings
    T = kit.ROLE_TRIM

    st = _heavy_stations(l, b, h)

    # Frame gap geometry — shared by the spars, the hoops and the bracing.
    # frame_z0 is the transom face of the mid body (last station z).
    frame_z0 = st[-1][0]          # = l * 0.25
    frame_z1 = l * 0.37           # forward face of the drive block
    frame_x  = b * 0.12
    frame_y  = h * 0.14

    # Drive block — its own local anchors, because it is a separated volume.
    drive_z      = l * 0.40
    drive_len    = l * 0.14
    drive_cy     = h * 0.02
    drive_hw     = b * 0.22
    drive_hh     = h * 0.24
    drive_ch     = h * 0.18
    drive_flat   = drive_hw - drive_ch
    drive_top    = drive_cy + drive_hh
    drive_face_z = drive_z + drive_len * 0.5   # aft nozzle face

    # Zone boundary positions, used for seam collars and armour band limits.
    bow_mid_z   = -l * 0.28   # bow-to-mid zone seam
    mid_frame_z = frame_z0    # mid-to-frame zone seam (= l * 0.25)

    # Greenhouse house — the intact civilian cabin visible between the armour
    # courses.  The house is ROLE_ARMOUR: a donated structure that predates the
    # militia fit-out, not part of the original framed hull.
    house_z   = l * 0.03
    house_len = l * 0.20
    house_zs  = (house_z - house_len * 0.5, house_z, house_z + house_len * 0.5)
    house_hw  = min(sf.flat_half(st, z) for z in house_zs) * 0.86
    house_bot = min(sf.top_y(st, z, 0.0) for z in house_zs) - h * 0.02
    house_h   = h * 0.24
    house_cy  = house_bot + house_h * 0.5
    house_top = house_bot + house_h
    barrel_r  = house_hw * 0.72
    barrel_cy = house_top - barrel_r * 0.42

    # Armour band geometry.  The host volume for plate_grid is zero-thickness so
    # the face sits flush with the hull surface; the plate depth itself determines
    # how far the plates stand proud (75 %) and how far they dip in (25 %).
    plate_d      = b * 0.030     # plate depth: visible proud edge against barn-red hull
    armour_h     = h * 0.34     # band height: vertical extent of the armour zone
    armour_cy    = 0.0          # band centred on the datum; calm hull above and below
    armour_z_fwd = -l * 0.23   # forward edge of armour band
    armour_z_aft =  l * 0.16   # aft edge of armour band
    armour_z_len = armour_z_aft - armour_z_fwd   # = l * 0.39
    armour_z_ctr = (armour_z_fwd + armour_z_aft) * 0.5
    host_sx      = 0.02         # near-zero host volume thickness

    # Shoulder flare size — breaks the silhouette at both ends of the armour band.
    shldr_w = b * 0.044
    shldr_h = h * 0.40

    # 2×2 nozzle group spacing.
    drive_dx = b * 0.10
    drive_dy = h * 0.10

    # Bow references (station 0).
    bow_z  = st[0][0]
    bow_hw = st[0][1]
    bow_hh = st[0][2]
    bow_yo = st[0][3]

    # ── Primary masses (all detail levels) ────────────────────────────────────

    kit.hull_loft(parts, 'hull-body', H, st, hull_mat)

    # Forefoot keel wedge — this hull grounds at homesteads and braces against
    # push loads.  It takes the first knock so the hull plating does not.
    foot_zs  = (-l * 0.46, -l * 0.36)
    foot_h   = h * 0.14
    foot_top = min(sf.bottom_y(st, z, 0.0) for z in foot_zs) + h * 0.06
    kit.wedge(parts, 'forefoot', H,
              (0.0, foot_top - foot_h * 0.5, -l * 0.42),
              (b * 0.18, foot_h, l * 0.12),
              hull_mat, taper=(0.12, 0.38), bevel=h * 0.010)

    # Bow fender ring — the circular bumper at the work face, on four standoffs
    # that read as bolted hardware against the hull plating.
    fender_r     = min(bow_hh * 0.88, bow_hw * 0.82)
    fender_minor = h * 0.055
    fender_z     = bow_z - fender_minor * 1.4
    kit.torus(parts, 'bow-fender-ring', D,
              (0.0, bow_yo, fender_z),
              fender_r, fender_minor,
              hull_mat, rotation=sf.CYL_ALONG_Z)
    for si, (sx, sy) in enumerate(((-0.70, -0.60), (0.70, -0.60),
                                    (-0.70,  0.60), (0.70,  0.60))):
        kit.strut(parts, 'fender-standoff.%02d' % si, T,
                  (fender_r * sx, bow_yo + fender_r * sy, bow_z + h * 0.02),
                  (fender_r * sx, bow_yo + fender_r * sy, fender_z),
                  hull_mat, radius=h * 0.018)

    # Drive block — the second solid volume, held off by the open sound frame.
    kit.chamfer_block(parts, 'drive-block', H,
                      (0.0, drive_cy, drive_z),
                      (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                      hull_mat, chamfer=drive_ch, bevel=h * 0.012)

    # Flat radiator panels port and starboard of the drive block.  Empty and
    # plain: they break the outline and carry no detail (§20 rule 2, §21 G3).
    rad_hw = b * 0.14
    rad_cy = drive_cy + h * 0.02
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.taper_block(parts, 'radiator-%s' % side, D,
                        (sign * (drive_hw + rad_hw - h * 0.04), rad_cy,
                         drive_z - l * 0.02),
                        (rad_hw * 2.0, h * 0.028, l * 0.18),
                        hull_mat, front=(0.58, 0.32), back=(1.0, 0.88),
                        bevel=h * 0.006)

    # Sound frame — the faction thumbnail: four longitudinal spars across the
    # empty gap.  Both ends of each spar sit inside the volumes they join (the
    # transom of the mid body and the forward face of the drive block) so
    # probe-ship-islands sees ONE connected component.
    for xi, yi, tag in ((-1, -1, 'lower-port'), (1, -1, 'lower-stbd'),
                         (-1,  1, 'upper-port'), (1,  1, 'upper-stbd')):
        kit.strut(parts, 'sound-frame-spar-%s' % tag, T,
                  (xi * frame_x, yi * frame_y, frame_z0 - l * 0.01),
                  (xi * frame_x, yi * frame_y, frame_z1 + l * 0.01),
                  hull_mat, radius=h * 0.024)

    # Two rectangular hoops inside the gap — structural rhythm at constant pitch.
    for hi, hz in enumerate((l * 0.285, l * 0.335)):
        kit.strut(parts, 'sound-frame-hoop-top.%02d' % hi, T,
                  (-frame_x,  frame_y, hz), (frame_x,  frame_y, hz),
                  hull_mat, radius=h * 0.020)
        kit.strut(parts, 'sound-frame-hoop-bottom.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (frame_x, -frame_y, hz),
                  hull_mat, radius=h * 0.020)
        kit.strut(parts, 'sound-frame-hoop-port.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (-frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.020)
        kit.strut(parts, 'sound-frame-hoop-stbd.%02d' % hi, T,
                  ( frame_x, -frame_y, hz), ( frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.020)
    # Diagonal yard bracing — opposite crossing directions, yard work not factory.
    kit.strut(parts, 'sound-frame-brace-port', T,
              (-frame_x, -frame_y, frame_z0), (-frame_x,  frame_y, frame_z1),
              hull_mat, radius=h * 0.018)
    kit.strut(parts, 'sound-frame-brace-stbd', T,
              ( frame_x,  frame_y, frame_z0), ( frame_x, -frame_y, frame_z1),
              hull_mat, radius=h * 0.018)

    # Water tank slung inside the frame — the gap carries function, not void.
    # Radius held under frame_y so the tank sits in the cradle of the spars.
    kit.cyl(parts, 'water-tank', D,
            (0.0, -h * 0.02, l * 0.31),
            frame_y * 0.90, l * 0.10, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=16)

    # Four nozzles in a countable 2×2 group (§20 rule 6 / §21 G3).
    # Each pair shares a horizontal row; the pattern is legible from astern.
    for di, (dx, dy) in enumerate(((-drive_dx,  drive_dy),
                                    ( drive_dx,  drive_dy),
                                    (-drive_dx, -drive_dy),
                                    ( drive_dx, -drive_dy))):
        kit.nozzle_ring(parts, glow, 'main-drive.%02d' % di,
                        (dx, drive_cy + dy, drive_face_z),
                        hull_mat, glow_mat, radius=h * 0.12, depth=l * 0.06)

    # Greenhouse house — the original crew accommodation, predating the armour.
    # It stays exposed between the armour courses; the warmth is the civilian
    # read at thumbnail size.
    kit.chamfer_block(parts, 'greenhouse-house', D,
                      (0.0, house_cy, house_z),
                      (house_hw * 2.0, house_h, house_len),
                      hull_mat, chamfer=house_h * 0.26, bevel=h * 0.010)

    # Barrel roof over the greenhouse: 16 sides read as a true curve.  The
    # rotation aligns the cylinder axis with ship Z so the profile is an arc
    # in section rather than a flat slab.
    kit.cyl(parts, 'greenhouse-barrel-roof', D,
            (0.0, barrel_cy, house_z),
            barrel_r, house_len * 1.04, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=16)

    # Zone seam collars: one at each structural junction in the plate courses.
    # Bow/mid collar at -28 % marks where the work bow bolts onto the civilian hull.
    bmz_hw, bmz_hh, bmz_yo, _ = sf.section(st, bow_mid_z)
    kit.box(parts, 'bow-mid-seam-collar', T,
            (0.0, bmz_yo, bow_mid_z),
            (bmz_hw * 2.0 + h * 0.06, bmz_hh * 0.12, h * 0.04),
            hull_mat, bevel=h * 0.006)
    # Mid/frame collar at +25 % is the last body course before the truss gap.
    mfz_hw, mfz_hh, mfz_yo, _ = sf.section(st, mid_frame_z)
    kit.box(parts, 'mid-frame-seam-collar', T,
            (0.0, mfz_yo, mid_frame_z),
            (mfz_hw * 2.0 + h * 0.06, mfz_hh * 0.14, h * 0.05),
            hull_mat, bevel=h * 0.008)

    # Keel skid — the monitor grounds at homesteads under full armour weight.
    # Tapers fore and aft so it reads as a fitted shoe, not a dropped slab.
    skid_zs  = (-l * 0.22, -l * 0.04, l * 0.14)
    skid_h   = h * 0.055
    skid_top = min(sf.bottom_y(st, z, 0.0) for z in skid_zs) + skid_h * 0.32
    kit.taper_block(parts, 'keel-skid', D,
                    (0.0, skid_top - skid_h * 0.5, -l * 0.03),
                    (b * 0.26, skid_h, l * 0.36),
                    hull_mat, front=(0.52, 0.38), back=(0.68, 0.52),
                    bevel=h * 0.008)

    # ── Bolt-on armour: plate courses, shoulder flares, barbettes (detail 1+) ──
    # The armour was added AFTER the hull was operational: cream ROLE_ARMOUR
    # plates stand proud against the barn-red hull.  Flanks outside the armour
    # band stay calm; all structural detail is inside this one band (§20 rule 2).
    if detail >= 1:
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            fx_mid   = sf.flank_x(st, armour_z_ctr, armour_cy)
            face_dir = 'x' if sign > 0 else '-x'
            # Armour course: host-volume face sits at the hull surface; plates
            # dip 25 % of plate_d for connectivity and stand 75 % proud.
            # cols=6, rows=5 give 30 plates per side — denser course language.
            kit.plate_grid(parts, 'armour-course-%s' % side, D,
                           (sign * (fx_mid - host_sx * 0.5),
                            armour_cy, armour_z_ctr),
                           (host_sx, armour_h, armour_z_len),
                           hull_mat, cols=9, rows=7, face=face_dir,
                           depth=plate_d, gap=0.06)

            # Forward shoulder flare — tapers to a thin leading edge at the bow
            # side, widening the silhouette at the bow/mid seam (§21 G2).
            fx_fwd = sf.flank_x(st, armour_z_fwd, armour_cy)
            kit.taper_block(parts, 'shoulder-flare-fwd-%s' % side, D,
                            (sign * (fx_fwd + plate_d * 0.30 + shldr_w * 0.5),
                             armour_cy, armour_z_fwd - l * 0.04),
                            (shldr_w, shldr_h, l * 0.10),
                            hull_mat, front=(0.52, 0.74), back=(1.0, 1.0),
                            bevel=h * 0.008)

            # Shoulder flare face plates — bolt-on plating on the outboard face
            # of each flare; the face is in the y-z plane so we use face='x'/'x'.
            # Plates dip 25 % into the flare → overlap guaranteed.
            # Inner x: fx_fwd + plate_d*0.30 + shldr_w*0.5 - shldr_w*0.5025
            #         = fx_fwd + plate_d*0.30 - 0.0025*shldr_w → inside flare ✓
            kit.plate_grid(parts, 'shoulder-fwd-plates-%s' % side, D,
                           (sign * (fx_fwd + plate_d * 0.30 + shldr_w * 0.5),
                            armour_cy, armour_z_fwd - l * 0.04),
                           (shldr_w, shldr_h * 0.90, l * 0.10 * 0.90),
                           hull_mat, cols=2, rows=6, face=face_dir,
                           depth=shldr_w * 0.40, gap=0.08)

            # Aft shoulder flare — marks the end of the armoured zone before
            # the truss gap opens up; tapers forward to nothing.
            fx_aft = sf.flank_x(st, armour_z_aft, armour_cy)
            kit.taper_block(parts, 'shoulder-flare-aft-%s' % side, D,
                            (sign * (fx_aft + plate_d * 0.30 + shldr_w * 0.5),
                             armour_cy, armour_z_aft + l * 0.03),
                            (shldr_w, h * 0.36, l * 0.08),
                            hull_mat, front=(1.0, 1.0), back=(0.58, 0.72),
                            bevel=h * 0.008)

            kit.plate_grid(parts, 'shoulder-aft-plates-%s' % side, D,
                           (sign * (fx_aft + plate_d * 0.30 + shldr_w * 0.5),
                            armour_cy, armour_z_aft + l * 0.03),
                           (shldr_w, h * 0.36 * 0.90, l * 0.08 * 0.90),
                           hull_mat, cols=2, rows=5, face=face_dir,
                           depth=shldr_w * 0.40, gap=0.08)

        # Two defensive barbettes on the forward armour shoulders.  Placed for
        # clear upper arcs over the armour belt; formally positioned but on a
        # work hull — militia, not navy.
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            barb_z = armour_z_fwd - l * 0.04
            barb_x = sign * sf.flank_x(st, barb_z, armour_cy) * 0.62
            # Base ring bottom sunk slightly into hull deck for connectivity.
            barb_y = sf.top_y(st, barb_z, abs(barb_x)) - h * 0.04
            kit.barbette(parts, glow, 'barbette-%s' % side,
                         (barb_x, barb_y, barb_z),
                         hull_mat, glow_mat, radius=h * 0.18, height=h * 0.14)

        # Drive housings around each nozzle: machinery of this mass is built
        # from tubes, not boxes, so it reads as functional rather than blocky.
        for di, (dx, dy) in enumerate(((-drive_dx,  drive_dy),
                                        ( drive_dx,  drive_dy),
                                        (-drive_dx, -drive_dy),
                                        ( drive_dx, -drive_dy))):
            kit.cyl(parts, 'drive-housing.%02d' % di, H,
                    (dx, drive_cy + dy, drive_z + drive_len * 0.30),
                    h * 0.14, l * 0.05, hull_mat,
                    rotation=sf.CYL_ALONG_Z, vertices=16)

    # ── Working gear and service fittings (detail 2+) ────────────────────────
    if detail >= 2:
        # Supply lockers — clamp-on, with strap struts that cross the shadow
        # gap to the hull flank.  Six lockers, two per side, at mid-zone pitch.
        locker_cy  = armour_cy - armour_h * 0.5 - sf.SUPPLY_LOCKER[1] * 0.42
        locker_gap = h * 0.042
        locker_zs  = (-l * 0.14, -l * 0.02, l * 0.10) if detail >= 3 \
                else (-l * 0.10, l * 0.04)
        for li, lz in enumerate(locker_zs):
            for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
                lname = 'supply-locker-%s.%02d' % (side, li)
                lx = sign * (sf.flank_x(st, lz, locker_cy)
                             + locker_gap + sf.SUPPLY_LOCKER[0] * 0.5)
                kit.chamfer_block(parts, lname, A,
                                  (lx, locker_cy, lz),
                                  sf.SUPPLY_LOCKER, hull_mat,
                                  chamfer=0.15, bevel=0.035)
                # Clamp straps cross from hull surface to the locker inboard face.
                for ci, cs in ((0, -1.0), (1, 1.0)):
                    cz = lz + cs * 0.28
                    kit.strut(parts, '%s-clamp.%02d' % (lname, ci), T,
                              (sign * (sf.flank_x(st, cz, locker_cy) - h * 0.02),
                               locker_cy, cz),
                              (lx - sign * sf.SUPPLY_LOCKER[0] * 0.5,
                               locker_cy, cz),
                              hull_mat, radius=h * 0.014)

        # Sensor mast on the mid deck, aft of the barrel roof — thin and fragile
        # against the hull mass behind it: the Freehold scale contrast (§20 rule 4).
        mast_z    = l * 0.15
        mast_base = sf.top_y(st, mast_z, 0.0) - h * 0.010
        kit.sensor_mast(parts, glow, 'sensor-mast',
                        (0.0, mast_base, mast_z),
                        hull_mat, glow_mat, height=h * 0.28, radius=h * 0.032)

        # Handrails along both edges of the mid deck.  The post pitch is
        # human-scale regardless of hull length (§20 rule 4 scale from repetition).
        # y0 is set so the rail strip sits AT the hull deck top (not proud of it)
        # — this ensures the strip voxels overlap the hull body for 26-connectivity.
        rail_z = -l * 0.14
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.handrail(parts, 'mid-deck-rail-%s' % side,
                         (sign * sf.flat_half(st, rail_z) * 0.88,
                          sf.top_y(st, rail_z, 0.0) - h * 0.026, rail_z),
                         hull_mat, length=l * 0.22, axis='z', posts=6)

        # Aft mid-deck handrail at the greenhouse aft end — second course of
        # railing gives human-pitch rhythm along the entire work deck.
        rail_z2 = l * 0.10
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.handrail(parts, 'aft-deck-rail-%s' % side,
                         (sign * sf.flat_half(st, rail_z2) * 0.88,
                          sf.top_y(st, rail_z2, 0.0) - h * 0.026, rail_z2),
                         hull_mat, length=l * 0.12, axis='z', posts=4)

        # Rescue hatch on the bow work face — the Compact always carries rescue
        # gear; this hatch is sized for a stretcher (sf.AIRLOCK is the fleet size).
        kit.rescue_hatch(parts, glow, 'bow-rescue-hatch',
                         (0.0, bow_yo, bow_z + sf.AIRLOCK[2] * 0.5),
                         hull_mat, glow_mat, sf.AIRLOCK, face='-z')

        # Port-only rescue gear bracket — the deliberate asymmetric yard detail
        # (§21 G4).  Starboard is the docking approach; port is the rescue side,
        # chosen by crew convention and marked by one extra fitting.
        bkt_z = -l * 0.40
        bkt_x = -sf.flat_half(st, bkt_z) * 0.58
        bkt_y = sf.top_y(st, bkt_z, abs(bkt_x)) - h * 0.020
        kit.box(parts, 'rescue-bracket-port', A,
                (bkt_x, bkt_y, bkt_z),
                (0.40, 0.18, 0.60), hull_mat, bevel=0.04)

        # Two work flood lamps at the bow quarters — one per side, human scale,
        # aimed toward the work face.  Size constant across the fleet (§20 rule 4).
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            fl_z = -l * 0.38
            fl_x = sign * sf.flat_half(st, fl_z) * 0.70
            fl_y = sf.top_y(st, fl_z, fl_x) + sf.FLOOD_LAMP[1] * 0.5
            kit.window_row(glow, 'flood-lamp-%s' % side,
                           (fl_x, fl_y, fl_z),
                           glow_mat, 1, 0.0, sf.FLOOD_LAMP)

        # Armour plate seams: thin strips cut into the armour plate face on each
        # flank.  Each strip's inner edge is inside the hull body; its outer edge
        # is within the armour plate — both neighbours present → 26-connected.
        #
        # Connectivity proof (at z=0 for stbd, l=17.0 b=8.84 h=5.78):
        #   fx = sf.flank_x(st, 0.0, 0.0) = b*0.45 = 3.978 (vertical flank).
        #   Seam center x = fx + plate_d*0.25 = 3.978 + 0.066 = 4.044.
        #   Seam x span (axis='z' → psize_x = plate_d*1.005):
        #     inner = 4.044 − plate_d*0.5025 = 4.044 − 0.133 = 3.911
        #     outer = 4.044 + plate_d*0.5025 = 4.177
        #   Hull flank at y=0, z=0 is at x=3.978 > inner 3.911 ✓ inside hull.
        #   Armour plate face spans x=[3.911, 4.177] ✓ same range → overlap.
        for pi, pz in enumerate((-l * 0.20, -l * 0.10, 0.0, l * 0.08)):
            for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
                fx = sf.flank_x(st, pz, armour_cy)
                kit.panel_lines(parts, 'armour-seam-%s.%02d' % (side, pi),
                                (sign * (fx + plate_d * 0.25), armour_cy, pz),
                                (plate_d, armour_h * 0.90, h * 0.018),
                                hull_mat, count=1, axis='z',
                                depth=armour_h * 0.90)

        # Greenhouse face plates at detail 2: bolt-on trim course on the forward
        # face of the house (face='-z') — two rows of three plates each.
        kit.plate_grid(parts, 'greenhouse-fwd-plates', D,
                       (0.0, house_cy, house_z - house_len * 0.5),
                       (house_hw * 2.0 * 0.88, house_h * 0.88, 0.02),
                       hull_mat, cols=4, rows=3, face='-z',
                       depth=plate_d * 0.60, gap=0.08)

    # ── Emissive: windows, lamps, markers (detail 2+) ────────────────────────
    if detail >= 2:
        # Greenhouse windows under the barrel eave — the civilian warmth visible
        # from outside the armour belt.  PORT_LIGHT size and PORT_SPACING pitch
        # are the same on this ship as on the smallest cutter (§20 rule 4).
        # sf.flat_half caps the count so no pane overhangs the house chamfer.
        win_count = 9 if detail >= 3 else 5
        max_win   = max(1, int(house_hw * 2.0 / sf.PORT_SPACING))
        win_count = min(win_count, max_win)
        window_z  = house_z - house_len * 0.5 - 0.02
        window_y  = house_bot + house_h * 0.44
        kit.window_row(glow, 'greenhouse-eave-windows',
                       (0.0, window_y, window_z),
                       glow_mat, win_count, sf.PORT_SPACING, sf.PORT_LIGHT)

        # Aft greenhouse window row (detail 3): eave on the aft face gives the
        # house a second warm face visible from the sound frame side.
        if detail >= 3:
            window_z_aft = house_z + house_len * 0.5 + 0.02
            kit.window_row(glow, 'greenhouse-aft-windows',
                           (0.0, window_y, window_z_aft),
                           glow_mat, win_count, sf.PORT_SPACING, sf.PORT_LIGHT)

        # Flank cabin windows peeking through the armour band — each in its own
        # z-slot, one window per position.  Constant PORT_SPACING pitch, constant
        # FLANK_PORT size; more windows per ship means more ship, not bigger panes.
        flank_zs = (-l * 0.18, -l * 0.10, -l * 0.02, l * 0.06,
                    l * 0.12, l * 0.14) if detail >= 3 \
            else (-l * 0.10, l * 0.06)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for wi, wz in enumerate(flank_zs):
                kit.window_row(glow, 'cabin-window-%s.%02d' % (side, wi),
                               (sign * (sf.flank_x(st, wz, armour_cy)
                                + plate_d * 0.70),
                                armour_cy, wz),
                               glow_mat, 1, 0.0, sf.FLANK_PORT)

        # Navigation markers: bow quarters on the flank, mid deck shoulders above.
        # Positions are human-readable from outside; sizes are human-scale always.
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            mk_z = -l * 0.34
            kit.window_row(glow, 'nav-marker-bow-%s' % side,
                           (sign * sf.flank_x(st, mk_z, -h * 0.02),
                            -h * 0.02, mk_z),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)
            mk2_z = l * 0.08
            mk2_x = sf.flat_half(st, mk2_z) * 0.80
            kit.window_row(glow, 'nav-marker-mid-%s' % side,
                           (sign * mk2_x,
                            sf.top_y(st, mk2_z, mk2_x), mk2_z),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)
            # Extra marker lamp at z=-l*0.08 (mid-deck lamp at l/8 spacing):
            mk3_z = -l * 0.08
            mk3_x = sf.flat_half(st, mk3_z) * 0.80
            kit.window_row(glow, 'nav-marker-fwd-%s' % side,
                           (sign * mk3_x,
                            sf.top_y(st, mk3_z, mk3_x), mk3_z),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Drive-status readouts on the drive-block roof (§21 G3 function hardware).
        kit.window_row(glow, 'drive-status',
                       (0.0, drive_top, drive_z - drive_len * 0.28),
                       glow_mat, 2, sf.PORT_SPACING, sf.STATUS_SLIT)

    # ── Greeble fields (detail 3 only) ────────────────────────────────────────
    if detail >= 3:
        # Mid-deck greebles — three safe sub-fields cover the mid zone without
        # producing floating components.  Each field's z-extent is chosen so the
        # hull-top drop from center to edge stays below 1 voxel (0.06 m).
        #
        # Field 1 (gear_z = −l×0.08, sz = l×0.04 = 0.68 m):
        #   forward edge z = −1.36 − 0.34 = −1.70.  hull_top(−1.70) = 2.601;
        #   face_y ≈ 2.642; gap = 0.037 m = 0.62 vox → same voxel ✓.
        #   Minimum greeble cz = −1.36 − 0.306 = −1.67 — cannot reach z ≈ −2.43. ✓
        gear_z = -l * 0.08
        kit.greeble_field(parts, 'mid-deck-gear', T,
                          (0.0, sf.top_y(st, gear_z, 0.0) - h * 0.012, gear_z),
                          (sf.flat_half(st, gear_z) * 1.28, h * 0.032, l * 0.04),
                          hull_mat, seed=401, count=20, detail=detail)

        # Field 2: centred on z=0 (mid peak), hull-top ≈ 2.688 throughout.
        # Gap ≤ 0.04 m at both edges — well within one voxel.
        gear_z3 = 0.0
        kit.greeble_field(parts, 'mid-deck-gear-ctr', T,
                          (0.0, sf.top_y(st, gear_z3, 0.0) - h * 0.012, gear_z3),
                          (sf.flat_half(st, gear_z3) * 1.28, h * 0.032, l * 0.06),
                          hull_mat, seed=405, count=16, detail=detail)

        # Field 3: aft zone, sz capped to l×0.04 because hull_top drops more
        # steeply aft of l×0.06.  Safe gap at both edges < 0.05 m.
        gear_z2 = l * 0.06
        kit.greeble_field(parts, 'mid-deck-gear-aft', T,
                          (0.0, sf.top_y(st, gear_z2, 0.0) - h * 0.012, gear_z2),
                          (sf.flat_half(st, gear_z2) * 1.28, h * 0.032, l * 0.04),
                          hull_mat, seed=407, count=14, detail=detail)

        # Drive-block surface gear: status connectors and inspection panels.
        # drive_top is the local face anchor; face_y = drive_top − h×0.012 +
        # h×0.032/2 = drive_top + h×0.004 sits 0.02 m above drive_top, which
        # is < 1 voxel — greeble sink of 15 % bridges it reliably.
        kit.greeble_field(parts, 'drive-block-gear', T,
                          (0.0, drive_top - h * 0.012, drive_z + l * 0.01),
                          (drive_flat * 1.28, h * 0.032, l * 0.10),
                          hull_mat, seed=403, count=15, detail=detail)
