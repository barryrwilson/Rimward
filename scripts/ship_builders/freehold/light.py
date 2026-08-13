"""Freehold Compact - LIGHT, the family runabout.

Bible §4.3: "a compact cabin-forward craft with a broad greenhouse-like
windscreen, tool lockers, a rescue winch, and two clearly replaced hull
panels."

Three zones with real seams between them (SpaceShipIdeas/synthesis/20 rule 1):
    bow  21 %  narrow working bow: rescue-winch drum, fairlead, forefoot,
               and the cabin-shoulder seam at z ≈ –l·0.27 where the hull
               swells abruptly from the pointed nose to the full cabin beam.
               Travel direction is obvious from the knife bow and the
               raked cabin face.
    mid  52 %  the raised cabin block (donated glazing frame) carrying the
               greenhouse windscreen on its bow face, then a flat open work
               deck aft of the cabin with handrails and two tool lockers.
    stern 27 % an OPEN SOUND FRAME — two longitudinal spars, a full hoop
               and one diagonal brace over a slung fuel tank — then the
               drive block with two countable nozzles and small flat
               radiator fins that break the outline.
The frame gap is 11 % of the hull length and is left genuinely empty:
the Freehold thumbnail signature at any distance (§21 G2 outline breaker).

Research rules satisfied:
    §20 rule 1: three zones; seams at z ≈ –l·0.27 (bow/mid shoulder step)
                and z ≈ l·0.20 (mid/stern, hull transom to frame).
    §20 rule 2: detail band (windscreen + plate band + lockers) contained in
                the cabin/mid zone; aft hull and upper hull stay calm.
    §20 rule 4: constant-pitch PORT_LIGHT row; PORT_SPACING carries scale
                cue — window size is unchanged from freight to light.
    §20 rule 5: exposed open truss gap between hull transom and drive block.
    §20 rule 6: two side-by-side countable nozzles, no vague glow field.
    §20 rule 7: flat radiators empty of detail; emissive budget one window
                row + one flood + two markers + one status slit ≤ 5 % hull.
    §20 rule 8: diagonal brace runs port-bottom to starboard-top — an
                asymmetric yard repair, not factory symmetry. Two replaced
                hull panels at different z, height, and size: patchwork
                history, never a stripe. These are the only asymmetries.
    §21 G2: open frame gap readable at thumbnail size.
    §21 G3: visible flat radiators and a countable drive face.

Intended measurements (l=7.8, b=3.276, h=1.872):
    spanZ ≈ 6.9 (Z-axis dominates), spanX ≈ 3.5 (hull + radiators),
    spanY ≈ 2.2 (hull depth + cabin).
    spanZ/spanX ≈ 1.97 ≥ 1.15 ✓   spanY/spanZ ≈ 0.32 ≤ 0.60 ✓
    spanX/spanZ ≈ 0.51 ≥ 0.16 ✓   span ≈ 6.9, below cutter 10.3 ✓
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2]))
import ship_kit as kit
from . import surface as sf


# =============================================================================
# LIGHT — FAMILY RUNABOUT
# Called with l=7.8 b=3.276 h=1.872 (from CLASSES).
# =============================================================================

def _light_stations(l, b, h):
    """Seven-station hull loft: widest and tallest in the forward section.

    The beam swells sharply from the pointed bow to the cabin shoulder at
    station 2 (z = –l·0.26), holds wide across both cabin stations, then
    narrows steadily to the narrow transom where the sound frame bolts on.
    This plan reads as a house on a small hull, not a dart.
    """
    return [
        sf.fair(-l * 0.46, b * 0.06, h * 0.22, h * 0.10),  # bow knife
        sf.fair(-l * 0.36, b * 0.20, h * 0.30, h * 0.08),  # bow swell
        sf.fair(-l * 0.26, b * 0.48, h * 0.46, h * 0.02),  # cabin shoulder: widest, tallest
        sf.fair(-l * 0.16, b * 0.48, h * 0.44, h * 0.02),  # cabin body
        sf.fair(-l * 0.04, b * 0.44, h * 0.38, h * 0.01),  # midship, starts narrowing
        sf.fair( l * 0.08, b * 0.36, h * 0.31, h * 0.01),  # aft of midship
        sf.fair( l * 0.20, b * 0.24, h * 0.25, 0.00),       # transom — frame bolt-on
    ]


def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    D = kit.ROLE_ARMOUR   # donated section / cream plate
    A = kit.ROLE_ACCENT   # replaced panel / clamped-on part
    T = kit.ROLE_TRIM

    st = _light_stations(l, b, h)

    # Open frame geometry — shared by spars, hoop and brace.
    # frame_z0: hull transom; frame_z1: exact forward face of the drive block.
    # The 11 % gap between them is left empty (§21 G2).
    frame_z0  = st[-1][0]               # z = l * 0.20
    drive_len = l * 0.12
    drive_z   = l * 0.375
    frame_z1  = drive_z - drive_len * 0.5   # z = l * 0.315 (drive bow face)
    frame_x   = b * 0.10                # spar offset: compact footprint
    frame_y   = h * 0.11                # spar offset: moderate height

    # Drive block — separated volume; own local anchors.
    drive_cy  = h * 0.01
    drive_hw  = b * 0.18
    drive_hh  = h * 0.21
    drive_ch  = h * 0.14
    drive_top = drive_cy + drive_hh

    # Cabin block — a donated glazing frame (ROLE_ARMOUR) sitting on the
    # forward hull. Sized so its flat corners always land in the straight
    # (vertical) part of the hull section and never overhang the chamfer.
    cabin_z      = -l * 0.19
    cabin_len    = l * 0.16
    cabin_zs     = (cabin_z - cabin_len * 0.5,
                    cabin_z,
                    cabin_z + cabin_len * 0.5)
    cabin_hw     = min(sf.flat_half(st, z) for z in cabin_zs) * 0.88
    cabin_bottom = min(sf.top_y(st, z, 0.0) for z in cabin_zs) - h * 0.02
    cabin_h      = h * 0.24
    cabin_cy     = cabin_bottom + cabin_h * 0.5
    cabin_top    = cabin_bottom + cabin_h

    # ── Primary masses (all detail levels) ──────────────────────────────────

    kit.hull_loft(parts, 'hull-body', H, st, hull_mat)

    # Forefoot: a blunt keel entry under the bow; the first thing that takes
    # a knock when the family beaches. Tapers sharply at the nose.
    foot_zs  = (-l * 0.45, -l * 0.34)
    foot_h   = h * 0.10
    foot_top = min(sf.bottom_y(st, z, 0.0) for z in foot_zs) + h * 0.038
    kit.wedge(parts, 'forefoot', H,
              (0.0, foot_top - foot_h * 0.5, -l * 0.40),
              (b * 0.14, foot_h, l * 0.10),
              hull_mat, taper=(0.12, 0.30), bevel=h * 0.007)

    # Cabin block: the donated glazing frame that makes the runabout read as
    # a house. The chamfer at 20 % of height gives it rolled-steel corners
    # rather than an extruded box. Its bow face is the bow/mid zone seam.
    kit.chamfer_block(parts, 'cabin-block', D,
                      (0.0, cabin_cy, cabin_z),
                      (cabin_hw * 2.0, cabin_h, cabin_len),
                      hull_mat, chamfer=cabin_h * 0.20, bevel=h * 0.008)

    # Drive block: the powerplant held off the hull transom by the open frame.
    kit.chamfer_block(parts, 'drive-block', H,
                      (0.0, drive_cy, drive_z),
                      (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                      hull_mat, chamfer=drive_ch, bevel=h * 0.010)

    # Radiator fins: flat, empty panels that break the drive-block outline.
    # Compact on this small ship; no greeble added (§20 rule 7).
    rad_hw = b * 0.095
    rad_cy = drive_cy + h * 0.025
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.taper_block(parts, 'radiator-%s' % side, D,
                        (sign * (drive_hw + rad_hw - h * 0.040),
                         rad_cy, drive_z - l * 0.014),
                        (rad_hw * 2.0, h * 0.024, l * 0.130),
                        hull_mat, front=(0.58, 0.30), back=(1.0, 0.82),
                        bevel=h * 0.005)

    # Sound frame: two longitudinal spars, a single hoop, and one diagonal
    # brace. Simpler than the cutter's four-spar frame, proportional to the
    # lighter ship. Both ends of every spar overlap the adjacent solid volume
    # so the frame reads as bolted-in, not floating (probe requirement).
    for xi, spar_name in ((-1, 'port'), (1, 'stbd')):
        kit.strut(parts, 'sound-frame-spar-%s' % spar_name, T,
                  (xi * frame_x, -frame_y, frame_z0 - l * 0.010),
                  (xi * frame_x, -frame_y, frame_z1 + l * 0.010),
                  hull_mat, radius=h * 0.019)

    # Single hoop at 45 % across the frame gap — four sides forming a ring.
    hoop_z    = frame_z0 + (frame_z1 - frame_z0) * 0.45
    hoop_segs = [
        ('hoop-bottom', (-frame_x, -frame_y, hoop_z), ( frame_x, -frame_y, hoop_z)),
        ('hoop-top',    (-frame_x,  frame_y, hoop_z), ( frame_x,  frame_y, hoop_z)),
        ('hoop-port',   (-frame_x, -frame_y, hoop_z), (-frame_x,  frame_y, hoop_z)),
        ('hoop-stbd',   ( frame_x, -frame_y, hoop_z), ( frame_x,  frame_y, hoop_z)),
    ]
    for seg_name, ep_a, ep_b in hoop_segs:
        kit.strut(parts, 'sound-frame-%s' % seg_name, T,
                  ep_a, ep_b, hull_mat, radius=h * 0.016)

    # Diagonal brace: port-bottom at the hull transom to starboard-top at the
    # drive block. Cross-frame bracing is a yard repair that stuck — it is the
    # one deliberate asymmetry in the stern structure (§20 rule 8).
    kit.strut(parts, 'sound-frame-brace', T,
              (-frame_x, -frame_y, frame_z0 + l * 0.005),
              ( frame_x,  frame_y, frame_z1 + l * 0.010),
              hull_mat, radius=h * 0.014)

    # Fuel tank slung inside the frame: the gap carries function.
    # Extends slightly past both ends so it overlaps hull transom and drive
    # block — a continuous component, not a floating barrel (probe requirement).
    tank_len = (frame_z1 - frame_z0) + l * 0.030
    kit.cyl(parts, 'fuel-tank', T,
            (0.0, -h * 0.012, (frame_z0 + frame_z1) * 0.5),
            frame_y * 0.90, tank_len, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=12)

    # Two countable nozzles: a side-by-side pair, clearly readable from stern
    # at any LOD (§20 rule 6, §21 G3).
    drive_dx = b * 0.075
    for di, dx in ((0, -drive_dx), (1, drive_dx)):
        kit.nozzle_ring(parts, glow, 'main-drive.%02d' % di,
                        (dx, drive_cy, drive_z + drive_len * 0.5),
                        hull_mat, glow_mat, radius=h * 0.115, depth=l * 0.048)

    # Round drive housings around the nozzles: machinery of this size is built
    # from tubes, not boxes. They also pin the nozzle rings to the drive block.
    for di, dx in ((0, -drive_dx), (1, drive_dx)):
        kit.cyl(parts, 'drive-housing.%02d' % di, H,
                (dx, drive_cy, drive_z + drive_len * 0.26),
                h * 0.135, l * 0.038, hull_mat,
                rotation=sf.CYL_ALONG_Z, vertices=14)

    # Keel skid: this runabout sets down on farmstead pads and river banks.
    # Tapered at both ends so it reads as a shoe, not a brick.
    skid_zs  = (-l * 0.12, l * 0.02, l * 0.16)
    skid_h   = h * 0.050
    skid_top = min(sf.bottom_y(st, z, 0.0) for z in skid_zs) + skid_h * 0.35
    kit.taper_block(parts, 'keel-skid', D,
                    (0.0, skid_top - skid_h * 0.5, l * 0.020),
                    (b * 0.18, skid_h, l * 0.280),
                    hull_mat, front=(0.52, 0.36), back=(0.74, 0.54),
                    bevel=h * 0.007)

    # ── Plate courses and replaced panels (detail 1+) ─────────────────────────
    # One service band per flank, centred on the mid zone below the cabin
    # shoulder. The barn-red upper hull stays calm above and below (§20 rule 2).
    band_zs  = [-l * 0.04 + i * (l * 0.076) for i in range(4)]
    band_t   = b * 0.026
    band_h   = h * 0.145
    band_top = min(sf.straight_top(st, z) for z in band_zs)
    band_cy  = band_top - band_h * 0.5

    if detail >= 1:
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for pi, pz in enumerate(band_zs):
                fx = sf.flank_x(st, pz, band_cy)
                kit.box(parts, 'donated-flank-%s.%02d' % (side, pi), D,
                        (sign * (fx + band_t * 0.30), band_cy, pz),
                        (band_t, band_h * (1.0 - 0.04 * (pi % 2)), l * 0.082),
                        hull_mat, bevel=h * 0.008)

            # Strake at the top of the plate band and a rub rail below.
            # Both are short segments so they follow the hull taper instead
            # of leaving the flank.
            for edge, ey, er in (
                ('top', band_top - h * 0.010, h * 0.017),
                ('rub', band_cy - band_h * 0.5 - h * 0.085, h * 0.019),
            ):
                for pi, pz in enumerate(band_zs):
                    kit.cyl(parts, 'band-strake-%s-%s.%02d' % (edge, side, pi), T,
                            (sign * (sf.flank_x(st, pz, ey) + er * 0.25),
                             ey, pz),
                            er, l * 0.086, hull_mat,
                            rotation=sf.CYL_ALONG_Z, vertices=8)

        # Foredeck planking on the narrow bow platform — scale cue for the
        # working bow, different from the cabin volume above it.
        for pi in range(4):
            pz   = -l * 0.38 + pi * (l * 0.050)
            deck = sf.top_y(st, pz, 0.0)
            pw   = sf.flat_half(st, pz) * 1.64
            kit.box(parts, 'foredeck-plating.%02d' % pi, T,
                    (0.0, deck - h * 0.010, pz),
                    (pw, h * 0.028, l * 0.046),
                    hull_mat, bevel=h * 0.005)

        # Work deck planking aft of the cabin — donated cream course that
        # marks the mid/work-deck sub-zone.
        for pi in range(3):
            pz   = -l * 0.09 + pi * (l * 0.040)
            deck = sf.top_y(st, pz, 0.0)
            kit.box(parts, 'workdeck-plating.%02d' % pi, D,
                    (0.0, deck - h * 0.008, pz),
                    (sf.flat_half(st, pz) * 1.56, h * 0.025, l * 0.036),
                    hull_mat, bevel=h * 0.005)

        # TWO replaced hull panels: patchwork history, not neglect (§20 rule 8).
        # Different sizes and different z positions, one each side.
        # These are the only ROLE_ACCENT parts on the hull; paint selects some
        # of them for faded blue per the accent_density rule.
        for pname, sign, pz, py_off, psize in (
            ('replaced-panel-port', -1.0, -l * 0.06, band_cy - h * 0.008,
             (0.10, 0.46, 0.88)),
            ('replaced-panel-stbd',  1.0,  l * 0.04, band_cy + h * 0.030,
             (0.10, 0.36, 0.66)),
        ):
            fx = sf.flank_x(st, pz, py_off)
            kit.box(parts, pname, A,
                    (sign * (fx + psize[0] * 0.25), py_off, pz),
                    psize, hull_mat, bevel=0.018)

    # ── Working equipment (detail 2+) ─────────────────────────────────────────
    if detail >= 2:
        # Rescue winch drum on the bow deck. Across the beam in two bearings,
        # unambiguously working hardware not ornament.
        winch_z    = -l * 0.340
        winch_deck = sf.top_y(st, winch_z, 0.0)
        kit.cyl(parts, 'rescue-winch-drum', D,
                (0.0, winch_deck + 0.14, winch_z),
                0.135, b * 0.190, hull_mat,
                rotation=sf.CYL_ALONG_X, vertices=12)
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.box(parts, 'winch-bearing-%s' % side, T,
                    (sign * b * 0.094, winch_deck + 0.085, winch_z),
                    (0.08, 0.26, 0.20), hull_mat, bevel=0.020)

        # Fairlead guides at the bow: two small brackets that line up with the
        # winch drum axis, so the rope run is obvious.
        fairlead_z = -l * 0.420
        fairlead_y = sf.top_y(st, fairlead_z, 0.0) - h * 0.050
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.box(parts, 'fairlead-%s' % side, T,
                    (sign * 0.078, fairlead_y, fairlead_z),
                    (0.05, 0.09, 0.07), hull_mat, bevel=0.010)

        # Two supply lockers on the work deck, aft of the cabin. One port and
        # one starboard at slightly different Z: they were fitted at different
        # refits and it shows.
        for l_side, l_sign, lz in (('port', -1.0, l * 0.038),
                                    ('stbd',  1.0, l * 0.064)):
            l_deck = sf.top_y(st, lz, 0.0)
            lx     = sf.flat_half(st, lz) * 0.58
            lcy    = l_deck + sf.SUPPLY_LOCKER[1] * 0.5 - h * 0.015
            loc    = (l_sign * lx, lcy, lz)
            kit.chamfer_block(parts, 'supply-locker-%s' % l_side, A, loc,
                              sf.SUPPLY_LOCKER, hull_mat, chamfer=0.14, bevel=0.030)
            # Strap clamps fore and aft of each locker.
            for ci, cz_off in ((0, -0.28), (1, 0.28)):
                clamp_z   = lz + cz_off
                cl_deck   = sf.top_y(st, clamp_z, 0.0)
                cl_inner  = l_sign * (lx - sf.SUPPLY_LOCKER[0] * 0.44)
                cl_outer  = l_sign * sf.flat_half(st, clamp_z) * 0.90
                kit.strut(parts, 'locker-clamp-%s.%02d' % (l_side, ci), T,
                          (cl_outer, cl_deck - h * 0.015, clamp_z),
                          (cl_inner, cl_deck - h * 0.015, clamp_z),
                          hull_mat, radius=h * 0.011)

        # Handrails along the work-deck edges, running from cabin stern face
        # to the transom. Posts sit slightly below the deck surface so they
        # overlap the hull mesh (probe requirement).
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            rail_z = l * 0.048
            kit.handrail(parts, 'work-deck-rail-%s' % side,
                         (sign * sf.flat_half(st, rail_z) * 0.86,
                          sf.top_y(st, rail_z, 0.0) - h * 0.012, rail_z),
                         hull_mat, length=l * 0.140, axis='z', posts=4)

        # Drip rail over the cabin bow face: a rolled cylinder that shades the
        # windscreen and draws one long bright highlight across the house front.
        # Centred just inside the cabin bow face so it overlaps the block.
        brow_z = cabin_z - cabin_len * 0.5 + h * 0.015
        kit.cyl(parts, 'windscreen-brow', T,
                (0.0, cabin_top - h * 0.012, brow_z),
                h * 0.030, cabin_hw * 1.55, hull_mat,
                rotation=sf.CYL_ALONG_X, vertices=10)

    # ── Emissive: windows, flood, markers, status (detail 2+) ─────────────────
    if detail >= 2:
        # Greenhouse windscreen: one row of PORT_LIGHT windows at PORT_SPACING
        # pitch on the cabin bow face. This is the family's living room and the
        # ship's primary scale cue. Window size never changes between classes
        # (§20 rule 4); a bigger family means more windows, not taller ones.
        screen_z = cabin_z - cabin_len * 0.5 - 0.035
        screen_n = 4 if detail >= 3 else 2
        kit.window_row(glow, 'cabin-windscreen',
                       (0.0, cabin_top - sf.PORT_LIGHT[1] * 0.68, screen_z),
                       glow_mat, screen_n, sf.PORT_SPACING, sf.PORT_LIGHT)

        # Bow flood lamp: one work light for night landings and rescue ops.
        flood_z = -l * 0.380
        kit.window_row(glow, 'bow-flood',
                       (0.0, sf.top_y(st, flood_z, 0.0) + h * 0.012, flood_z),
                       glow_mat, 1, 0.0, sf.FLOOD_LAMP)

        # Navigation markers: port and starboard at the bow quarters, seated
        # on the hull flank at the straight-top line.
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            marker_z = -l * 0.300
            marker_y = sf.straight_top(st, marker_z)
            kit.window_row(glow, 'nav-marker-%s' % side,
                           (sign * sf.flank_x(st, marker_z, marker_y),
                            marker_y, marker_z),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Drive-status readout on the roof of the drive block: one slit, not
        # an array, because this is a small plant, not a capital-ship reactor.
        kit.window_row(glow, 'drive-status',
                       (0.0, drive_top, drive_z - drive_len * 0.28),
                       glow_mat, 1, 0.0, sf.STATUS_SLIT)

    # ── Greeble fields (detail 3 only) ────────────────────────────────────────
    if detail >= 3:
        # One greeble field on the work deck: fittings, cleats, deck hardware.
        # Only one field — the light ship has a small deck (§20 rule 2).
        gear_z = l * 0.040
        kit.greeble_field(parts, 'work-deck-gear', T,
                          (0.0, sf.top_y(st, gear_z, 0.0) - h * 0.012, gear_z),
                          (sf.flat_half(st, gear_z) * 1.28, h * 0.024, l * 0.110),
                          hull_mat, seed=201, count=8, detail=detail)
