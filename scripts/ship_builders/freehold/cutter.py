"""Freehold Compact — CUTTER, the lane-keeper.

Bible §4.3: "a practical rescue and patrol boat with a wide forward airlock, tow
winch, floodlights, medical compartment, and clamp-on supply lockers."

Three zones with real seams between them (SpaceShipIdeas/synthesis/20 rule 1):
  bow  22 %  wide flat work platform: bow airlock inside a fender ring,
             tow-winch drum, bollards, floodlight mast.
  mid  50 %  stepped-up house carrying a raked greenhouse windscreen, the
             separate medical compartment under a barrel roof, and its
             greenhouse galleries.
  stern 28 % an OPEN SOUND FRAME — four longitudinal spars, two hoops and
             crossed yard bracing over a slung water tank — then a solid drive
             block with tapered radiator fins and four countable nozzles in
             round housings.
The frame gap is 14 % of the hull length and is left empty on purpose: it is the
one element that tells a Freehold hull from every closed-shell faction at
thumbnail size (§21 G2 outline breaker, §21 G3 visible thermal hardware).

Measured (scripts/measure-ships.mjs): span 10.3 in the cutter band
[6.60, 15.40], spanZ/spanX 2.28, spanY/spanZ 0.31, proxy cover 100 %.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def _cutter_stations(l, b, h):
    """Lane-keeper hull stations, bow face to transom.

    Eleven stations, so the plan and the profile curve instead of stepping: a
    wide flat work platform forward, a step up into the house, then a narrow
    transom for the frame to bolt onto.
    """
    return [
        sf.fair(-l * 0.44, b * 0.26, h * 0.15, -h * 0.070),
        sf.fair(-l * 0.40, b * 0.285, h * 0.16, -h * 0.065),
        sf.fair(-l * 0.34, b * 0.31, h * 0.17, -h * 0.060),
        sf.fair(-l * 0.27, b * 0.305, h * 0.21, -h * 0.038),
        sf.fair(-l * 0.20, b * 0.29, h * 0.28, -h * 0.010),
        sf.fair(-l * 0.12, b * 0.28, h * 0.335, h * 0.015),
        sf.fair(-l * 0.05, b * 0.27, h * 0.37, h * 0.030),
        sf.fair( l * 0.02, b * 0.26, h * 0.365, h * 0.025),
        sf.fair( l * 0.08, b * 0.25, h * 0.35, h * 0.020),
        sf.fair( l * 0.12, b * 0.215, h * 0.29, h * 0.010),
        sf.fair( l * 0.15, b * 0.17, h * 0.22, 0.0),
    ]

# =============================================================================
# CUTTER — LANE-KEEPER
# Called with l=11.0  b=5.28  h=3.30 (from CLASSES).
# =============================================================================
def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    D = kit.ROLE_ARMOUR   # donated section / cream plate
    A = kit.ROLE_ACCENT   # replaced panel / clamped-on part
    T = kit.ROLE_TRIM

    st = _cutter_stations(l, b, h)

    # Frame geometry — shared by the spars, the hoops and the bracing.
    frame_z0 = st[-1][0]         # transom of the house
    frame_z1 = l * 0.29          # front face of the drive block
    frame_x = b * 0.13
    frame_y = h * 0.14

    # Drive block — its own local anchors, because it is a separated volume.
    drive_z = l * 0.36
    drive_len = l * 0.14
    drive_cy = h * 0.02
    drive_hw = b * 0.19
    drive_hh = h * 0.22
    drive_ch = h * 0.16
    drive_flat = drive_hw - drive_ch
    drive_top = drive_cy + drive_hh

    # Medical house — sized to the deck it stands on, so it never overhangs the
    # chamfer with a floating corner.
    house_z = -l * 0.02
    house_len = l * 0.22
    house_zs = (house_z - house_len * 0.5, house_z, house_z + house_len * 0.5)
    house_hw = min(sf.flat_half(st, z) for z in house_zs) * 0.90
    house_bottom = min(sf.top_y(st, z, 0.0) for z in house_zs) - h * 0.03
    house_h = h * 0.20
    house_cy = house_bottom + house_h * 0.5
    house_top = house_bottom + house_h
    barrel_r = house_hw * 0.70
    barrel_cy = house_top - barrel_r * 0.45

    # ── Primary masses (all detail levels) ───────────────────────────────────

    kit.hull_loft(parts, 'hull-body', H, st, hull_mat)

    # Forefoot — a pointed cutwater faired into the keel under the bow. It gives
    # the flat rescue bow one sharp edge, and it takes the first knock.
    foot_zs = (-l * 0.46, -l * 0.34)
    foot_h = h * 0.14
    foot_top = min(sf.bottom_y(st, z, 0.0) for z in foot_zs) + h * 0.05
    kit.wedge(parts, 'forefoot', H,
              (0.0, foot_top - foot_h * 0.5, -l * 0.40),
              (b * 0.20, foot_h, l * 0.12),
              hull_mat, taper=(0.10, 0.35), bevel=h * 0.010)

    # Medical compartment — a separate donated house on the roof, so the mid
    # zone reads as two volumes that were joined, not one moulded shell.
    kit.chamfer_block(parts, 'medical-house', D,
                      (0.0, house_cy, house_z),
                      (house_hw * 2.0, house_h, house_len),
                      hull_mat, chamfer=house_h * 0.28, bevel=h * 0.010)

    # Barrel roof over the medical compartment: a true curved surface, and the
    # mount for the greenhouse galleries. Sixteen sides read as a curve.
    kit.cyl(parts, 'greenhouse-barrel-roof', D,
            (0.0, barrel_cy, house_z),
            barrel_r, house_len * 1.06, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=16)

    # Drive block — the second solid volume, held off the house by the frame.
    kit.chamfer_block(parts, 'drive-block', H,
                      (0.0, drive_cy, drive_z),
                      (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                      hull_mat, chamfer=drive_ch, bevel=h * 0.012)

    # Radiator fins, port and starboard of the drive block. Each panel tapers to
    # a thin swept leading edge, so it reads as a fin, not a slab. Held flat and
    # empty: they break the outline and carry no detail (§20 rule 2 and 7).
    rad_hw = b * 0.12
    rad_cy = drive_cy + h * 0.04
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.taper_block(parts, 'radiator-%s' % side, D,
                        (sign * (drive_hw + rad_hw - h * 0.05), rad_cy, drive_z - l * 0.02),
                        (rad_hw * 2.0, h * 0.03, l * 0.16),
                        hull_mat, front=(0.62, 0.34), back=(1.0, 0.86),
                        bevel=h * 0.006)

    # Sound frame — four longitudinal spars across the open gap. Both ends sit
    # inside the volumes they join: the transom section and the drive-block face.
    for xi, yi, name in ((-1, -1, 'lower-port'), (1, -1, 'lower-stbd'),
                         (-1, 1, 'upper-port'), (1, 1, 'upper-stbd')):
        kit.strut(parts, 'sound-frame-spar-%s' % name, T,
                  (xi * frame_x, yi * frame_y, frame_z0 - l * 0.01),
                  (xi * frame_x, yi * frame_y, frame_z1 + l * 0.01),
                  hull_mat, radius=h * 0.022)

    # Two hoops around the frame, and crossed yard bracing on the flanks. The
    # two braces run opposite ways: yard work, not factory symmetry.
    for hi, hz in enumerate((l * 0.19, l * 0.25)):
        kit.strut(parts, 'sound-frame-hoop-top.%02d' % hi, T,
                  (-frame_x, frame_y, hz), (frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.018)
        kit.strut(parts, 'sound-frame-hoop-bottom.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (frame_x, -frame_y, hz),
                  hull_mat, radius=h * 0.018)
        kit.strut(parts, 'sound-frame-hoop-port.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (-frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.018)
        kit.strut(parts, 'sound-frame-hoop-stbd.%02d' % hi, T,
                  (frame_x, -frame_y, hz), (frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.018)
    kit.strut(parts, 'sound-frame-brace-port', T,
              (-frame_x, -frame_y, frame_z0), (-frame_x, frame_y, frame_z1),
              hull_mat, radius=h * 0.016)
    kit.strut(parts, 'sound-frame-brace-stbd', T,
              (frame_x, frame_y, frame_z0), (frame_x, -frame_y, frame_z1),
              hull_mat, radius=h * 0.016)

    # Water tank slung inside the frame — the gap carries function, not air.
    # Radius held under frame_y so the tank sits in the cradle of the spars.
    kit.cyl(parts, 'water-tank', D,
            (0.0, -h * 0.02, l * 0.22),
            frame_y * 0.94, l * 0.12, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=16)

    # Keel skid — this boat lands at homesteads. The skid tapers up at both
    # ends, so it reads as a shoe and not as a brick under the belly.
    skid_zs = (-l * 0.20, -l * 0.02, l * 0.16)
    skid_h = h * 0.05
    skid_top = min(sf.bottom_y(st, z, 0.0) for z in skid_zs) + skid_h * 0.35
    kit.taper_block(parts, 'keel-skid', D,
                    (0.0, skid_top - skid_h * 0.5, -l * 0.02),
                    (b * 0.24, skid_h, l * 0.36),
                    hull_mat, front=(0.55, 0.40), back=(0.70, 0.55),
                    bevel=h * 0.008)

    # Bow fender ring — the rescue boat's working face. Sized to the bow section
    # and mounted on four stand-offs, so it reads as bolted-on hardware.
    bow_z = st[0][0]
    bow_hw, bow_hh, bow_yo = st[0][1], st[0][2], st[0][3]
    fender_r = min(bow_hh * 0.92, bow_hw * 0.45)
    fender_minor = h * 0.05
    fender_z = bow_z - fender_minor * 1.4
    kit.torus(parts, 'bow-fender-ring', D,
              (0.0, bow_yo, fender_z),
              fender_r, fender_minor,
              hull_mat, rotation=sf.CYL_ALONG_Z)
    for si, (sx, sy) in enumerate(((-0.72, -0.62), (0.72, -0.62),
                                   (-0.72, 0.62), (0.72, 0.62))):
        kit.strut(parts, 'fender-standoff.%02d' % si, T,
                  (fender_r * sx, bow_yo + fender_r * sy, bow_z + h * 0.02),
                  (fender_r * sx, bow_yo + fender_r * sy, fender_z),
                  hull_mat, radius=h * 0.016)

    # Four countable nozzles: two main, two lower verniers (§20 rule 7).
    drive_dx = b * 0.09
    for di, dx in ((0, -drive_dx), (1, drive_dx)):
        kit.nozzle_ring(parts, glow, 'main-drive.%02d' % di,
                        (dx, drive_cy, drive_z + drive_len * 0.5),
                        hull_mat, glow_mat, radius=h * 0.15, depth=l * 0.06)
    # The verniers sit on the same aft face as the mains, low and outboard,
    # where the chamfer leaves them proud of the block instead of buried in it.
    for di, dx in ((0, -drive_dx), (1, drive_dx)):
        kit.nozzle_ring(parts, glow, 'vernier-drive.%02d' % di,
                        (dx, drive_cy - drive_hh + h * 0.06, drive_z + drive_len * 0.5),
                        hull_mat, glow_mat, radius=h * 0.075, depth=l * 0.04)

    # Round drive housings around the main nozzles: the stern is machinery, and
    # machinery of this size is built from tubes, not from boxes.
    for di, dx in ((0, -drive_dx), (1, drive_dx)):
        kit.cyl(parts, 'drive-housing.%02d' % di, H,
                (dx, drive_cy, drive_z + drive_len * 0.30),
                h * 0.17, l * 0.05, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=16)

    # ── Service band and plate courses (detail 1+) ───────────────────────────
    # The band is laid plate by plate, each plate seated on the flank at its own
    # station and clipped to the vertical part of that section. One band per
    # flank, so the barn-red hull field stays calm above and below (§20 rule 2).
    band_zs = [-l * 0.19 + i * (l * 0.075) for i in range(5)]
    band_t = b * 0.03
    band_h = h * 0.17
    band_top = min(sf.straight_top(st, z) for z in band_zs)
    band_cy = band_top - band_h * 0.5
    if detail >= 1:
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for pi, pz in enumerate(band_zs):
                fx = sf.flank_x(st, pz, band_cy)
                kit.box(parts, 'donated-flank-%s.%02d' % (side, pi), D,
                        (sign * (fx + band_t * 0.3), band_cy, pz),
                        (band_t, band_h * (1.0 - 0.04 * (pi % 2)), l * 0.082),
                        hull_mat, bevel=h * 0.010)
            # Rolled strakes close the top and the bottom of the band, and a rub
            # rail runs lower down. All three are laid as short segments, one per
            # band station: a single long cylinder would leave the flank as soon
            # as the hull narrows towards the transom.
            for edge, ey in (('top', band_top - h * 0.01),
                             ('bottom', band_cy - band_h * 0.5 + h * 0.01),
                             ('rub', band_cy - band_h * 0.5 - h * 0.10)):
                seg_r = h * 0.022 if edge == 'rub' else h * 0.018
                for pi, pz in enumerate(band_zs):
                    kit.cyl(parts, 'band-strake-%s-%s.%02d' % (edge, side, pi), T,
                            (sign * (sf.flank_x(st, pz, ey) + seg_r * 0.25), ey, pz),
                            seg_r, l * 0.086, hull_mat,
                            rotation=sf.CYL_ALONG_Z, vertices=8)

        # Foredeck planking. Each plank follows the sheer, so the deck course
        # rises with the hull instead of cutting through it.
        for pi in range(4):
            pz = -l * 0.38 + pi * (l * 0.05)
            deck = sf.top_y(st, pz, 0.0)
            pw = sf.flat_half(st, pz) * 1.70
            kit.box(parts, 'foredeck-plating.%02d' % pi, T,
                    (0.0, deck - h * 0.012, pz),
                    (pw, h * 0.035, l * 0.046),
                    hull_mat, bevel=h * 0.006)

        # Short donated course on the after deck, between house and transom.
        for pi in range(3):
            pz = l * 0.085 + pi * (l * 0.022)
            deck = sf.top_y(st, pz, 0.0)
            kit.box(parts, 'donated-afterdeck.%02d' % pi, D,
                    (0.0, deck - h * 0.010, pz),
                    (sf.flat_half(st, pz) * 1.60, h * 0.030, l * 0.020),
                    hull_mat, bevel=h * 0.006)

    # ── Seams (detail 2+) ────────────────────────────────────────────────────
    # One seam for each junction between band plates, each cut at its own
    # station so the strip spans exactly the beam it is sunk into.
    if detail >= 2:
        for si in range(len(band_zs) - 1):
            sz = (band_zs[si] + band_zs[si + 1]) * 0.5
            kit.panel_lines(parts, 'house-seam.%02d' % si,
                            (0.0, band_cy, sz),
                            (sf.flank_x(st, sz, band_cy) * 2.0, band_h * 0.9, l * 0.02),
                            hull_mat, count=1, axis='z', depth=0.30)

    # ── Donor sections: replaced plates and clamped-on lockers (detail 2+) ───
    # ONE ordered pool, because paint_parts_vc selects accent parts by sorted
    # name and paints only accent_density (32 %) of them the faded blue. The
    # 'donor.NN' index therefore decides WHICH parts came from another yard:
    # indices 00-03 are painted, the rest stay barn-red — patchwork spread over
    # both flanks, a locker and the medical house, never one blue block.
    #
    # A flank plate takes its X from the hull surface at its own station and
    # height. A locker stands off the flank by a fixed gap, and its clamps are
    # drawn from the hull surface to the locker face, so the gap always reads as
    # a shadow line with hardware across it.
    if detail >= 2:
        locker_cy = band_cy - band_h * 0.5 - sf.SUPPLY_LOCKER[1] * 0.45
        locker_gap = h * 0.05
        for name, sign, pz, py, size in (
            ('donor.00-hull-plate-port-fwd', -1.0, -l * 0.13, band_cy, (0.10, 0.46, 1.00)),
            ('donor.01-supply-locker-stbd', 1.0, -l * 0.09, locker_cy, sf.SUPPLY_LOCKER),
            ('donor.02-hull-plate-stbd-mid', 1.0, l * 0.01, band_cy, (0.10, 0.42, 0.86)),
            ('donor.03-medical-house-plate', -1.0, house_z - l * 0.03, house_cy, (0.10, house_h * 0.55, 0.52)),
            ('donor.04-supply-locker-port', -1.0, -l * 0.13, locker_cy, sf.SUPPLY_LOCKER),
            ('donor.05-hull-plate-port-aft', -1.0, l * 0.05, band_cy - h * 0.02, (0.10, 0.40, 0.72)),
            ('donor.06-supply-locker-stbd', 1.0, l * 0.01, locker_cy, sf.SUPPLY_LOCKER),
            ('donor.07-drive-plate', 0.0, drive_z - l * 0.01, drive_top, (drive_flat * 1.6, 0.10, 0.60)),
            ('donor.08-supply-locker-port', -1.0, -l * 0.05, locker_cy, sf.SUPPLY_LOCKER),
            ('donor.09-foredeck-plate', 0.0, -l * 0.35, 0.0, (1.10, 0.08, 0.62)),
            ('donor.10-supply-locker-port', -1.0, l * 0.04, locker_cy, sf.SUPPLY_LOCKER),
            ('donor.11-hull-plate-stbd-fwd', 1.0, -l * 0.17, band_cy - h * 0.03, (0.10, 0.36, 0.66)),
        ):
            if sign == 0.0 and 'foredeck' in name:
                # Deck patch: seat it on the sheer line.
                loc = (0.0, sf.top_y(st, pz, 0.0) - size[1] * 0.30, pz)
            elif sign == 0.0:
                # Drive-block patch: local anchor, sunk into the block roof.
                loc = (0.0, py - size[1] * 0.30, pz)
            elif 'medical-house' in name:
                loc = (sign * (house_hw + size[0] * 0.25), py, pz)
            elif size is sf.SUPPLY_LOCKER:
                loc = (sign * (sf.flank_x(st, pz, py) + locker_gap + size[0] * 0.5), py, pz)
            else:
                loc = (sign * (sf.flank_x(st, pz, py) + size[0] * 0.25), py, pz)

            # A cut-and-fitted plate has a dressed edge, and the highlight on
            # that edge is what stops it reading flat. A locker is a rolled steel
            # box: its vertical corners are cut back, so it never reads as a cube.
            if size is sf.SUPPLY_LOCKER:
                kit.chamfer_block(parts, name, A, loc, size, hull_mat,
                                  chamfer=0.15, bevel=0.035)
                for ci, cs in ((0, -1.0), (1, 1.0)):
                    cz = pz + cs * 0.30
                    kit.strut(parts, '%s-clamp.%02d' % (name, ci), T,
                              (sign * (sf.flank_x(st, cz, py) - h * 0.02), py, cz),
                              (loc[0] - sign * size[0] * 0.5, py, cz),
                              hull_mat, radius=h * 0.014)
            else:
                kit.box(parts, name, A, loc, size, hull_mat, bevel=0.022)

    # ── Working equipment (detail 2+) ────────────────────────────────────────
    if detail >= 2:
        # Bow airlock: the collar seats on the bow face, inside the fender bore.
        kit.rescue_hatch(parts, glow, 'bow-airlock',
                         (0.0, bow_yo, bow_z + sf.AIRLOCK[2] * 0.5),
                         hull_mat, glow_mat, sf.AIRLOCK, face='-z')

        # Tow winch on the foredeck: drum across the beam in two bearings.
        winch_z = -l * 0.30
        winch_deck = sf.top_y(st, winch_z, 0.0)
        kit.cyl(parts, 'tow-winch-drum', D,
                (0.0, winch_deck + 0.20, winch_z), 0.22, 0.62, hull_mat,
                rotation=sf.CYL_ALONG_X, vertices=16)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.box(parts, 'tow-winch-bearing-%s' % side, T,
                    (sign * 0.34, winch_deck + 0.12, winch_z), (0.10, 0.44, 0.30),
                    hull_mat, bevel=0.03)
            bollard_z = -l * 0.36
            kit.cyl(parts, 'bollard-%s' % side, T,
                    (sign * sf.flat_half(st, bollard_z) * 0.62,
                     sf.top_y(st, bollard_z, 0.0) + 0.10, bollard_z),
                    0.07, 0.24, hull_mat, vertices=12)

        # Floodlight mast on the work platform: the tallest point of the ship.
        mast_z = -l * 0.26
        mast_h = h * 0.24
        mast_base = sf.top_y(st, mast_z, 0.0) - h * 0.015
        kit.sensor_mast(parts, glow, 'floodlight-mast',
                        (0.0, mast_base, mast_z),
                        hull_mat, glow_mat, height=mast_h, radius=h * 0.035)
        gantry_y = mast_base + mast_h * 0.74
        kit.box(parts, 'floodlight-gantry', T,
                (0.0, gantry_y, mast_z), (0.62, 0.06, 0.10), hull_mat,
                bevel=0.02)

        # Deck rails along both edges of the work platform.
        rail_z = -l * 0.30
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.handrail(parts, 'foredeck-rail-%s' % side,
                         (sign * sf.flat_half(st, rail_z) * 0.92,
                          sf.top_y(st, rail_z, 0.0) - h * 0.01, rail_z),
                         hull_mat, length=l * 0.20, axis='z', posts=5)

        # Curved brow over the windscreen: a rolled drip rail that shades the
        # glass and puts one long highlight across the front of the house.
        brow_z = -l * 0.125
        kit.cyl(parts, 'windscreen-brow', T,
                (0.0, sf.top_y(st, brow_z, 0.0) - h * 0.015, brow_z),
                h * 0.038, sf.flat_half(st, brow_z) * 1.70, hull_mat,
                rotation=sf.CYL_ALONG_X, vertices=12)

    # ── Emissive: warm windows, floods, markers (detail 2+) ──────────────────
    if detail >= 2:
        # Raked greenhouse windscreen on the house shoulder — the Compact's
        # first read at any distance. Panes straddle the sloped surface.
        screen_z = -l * 0.165
        screen_n = 3 if detail >= 3 else 2
        kit.window_row(glow, 'greenhouse-screen',
                       (0.0, sf.top_y(st, screen_z, 0.0) - 0.02, screen_z),
                       glow_mat, screen_n, 0.56, (0.50, 0.30, 0.10))
        kit.box(parts, 'windscreen-frame', T,
                (0.0, sf.top_y(st, screen_z, 0.0) - 0.14, screen_z),
                (sf.flat_half(st, screen_z) * 1.60, h * 0.02, l * 0.10),
                hull_mat, bevel=h * 0.006)

        # Cabin windows down both flanks, inside the band, at the fleet pitch.
        flank_zs = (-l * 0.11, -l * 0.05, l * 0.01, l * 0.07) if detail >= 3 \
            else (-l * 0.08, l * 0.02)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for wi, wz in enumerate(flank_zs):
                kit.window_row(glow, 'cabin-window-%s.%02d' % (side, wi),
                               (sign * (sf.flank_x(st, wz, band_cy) + band_t * 0.7),
                                band_cy, wz),
                               glow_mat, 1, 0.0, sf.FLANK_PORT)

        # Medical compartment front windows, and the greenhouse galleries under
        # the crest of the barrel roof: warm repetition is the Freehold scale cue.
        kit.window_row(glow, 'medical-windows',
                       (0.0, house_cy, house_z - house_len * 0.5 - 0.02),
                       glow_mat, 3, sf.PORT_SPACING, sf.PORT_LIGHT)
        gallery_n = 3 if detail >= 3 else 2
        for gi, gz in ((0, house_z - house_len * 0.28), (1, house_z + house_len * 0.10)):
            kit.window_row(glow, 'greenhouse-gallery.%02d' % gi,
                           (0.0, barrel_cy + barrel_r - 0.03, gz),
                           glow_mat, gallery_n, 0.30, sf.ROOF_PANE)

        # Work floodlights on the mast gantry.
        kit.window_row(glow, 'floodlight',
                       (0.0, gantry_y, mast_z - 0.06),
                       glow_mat, 2, 0.46, sf.FLOOD_LAMP)

        # Navigation markers: bow quarters on the flank, house shoulders on deck.
        marker_bow_z = -l * 0.34
        marker_house_z = l * 0.06
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.window_row(glow, 'nav-marker-bow-%s' % side,
                           (sign * sf.flank_x(st, marker_bow_z, -h * 0.02),
                            -h * 0.02, marker_bow_z),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)
            marker_x = sf.flat_half(st, marker_house_z) * 0.85
            kit.window_row(glow, 'nav-marker-house-%s' % side,
                           (sign * marker_x,
                            sf.top_y(st, marker_house_z, marker_x), marker_house_z),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Drive-status readouts on the roof of the drive block.
        kit.window_row(glow, 'drive-status',
                       (0.0, drive_top, drive_z - drive_len * 0.30),
                       glow_mat, 2, sf.PORT_SPACING, sf.STATUS_SLIT)

    # ── Greeble fields (detail 3 only) ───────────────────────────────────────
    if detail >= 3:
        gear_z = -l * 0.34
        kit.greeble_field(parts, 'foredeck-gear', T,
                          (0.0, sf.top_y(st, gear_z, 0.0) - h * 0.015, gear_z),
                          (sf.flat_half(st, gear_z) * 1.40, h * 0.03, l * 0.14),
                          hull_mat, seed=311, count=10, detail=detail)
        kit.greeble_field(parts, 'drive-block-gear', T,
                          (0.0, drive_top - h * 0.015, drive_z + l * 0.01),
                          (drive_flat * 1.40, h * 0.03, l * 0.10),
                          hull_mat, seed=313, count=8, detail=detail)

