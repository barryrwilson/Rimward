"""Gilded Chain Frigate - PAVILION ESCORT.

Bible section 4.5: a long ceremonial warship with layered dorsal scales,
hidden batteries, a protected transfer bay, and an observation rotunda whose
elegance feels unnervingly calm. The longest non-freighter in the fleet and
the class closest to the concept art: one very long, very low crescent, a
single flowing shell, needle prow, ceremonially composed.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.

Geometry plan (all fractions of l):
  nose      l * -0.470 = -15.040     bow/mid seam  l * -0.260 =  -8.320
  mid/stern l *  0.200 =   6.400     transom       l *  0.450 =  14.400
  drive face back at 14.52

Measured (node scripts/measure-ships.mjs gilded, scripts/probe-ship-islands.mjs
gilded frigate lod0, node scripts/validate-ship-assets.mjs):
  max span 29.6; length/beam 3.63; height/length 0.13; beam/length 0.28
  hull 42 624 verts (band 16 000-84 000) -- PASS
  lod0 21 768 tris against the 60 000 cap; lod1 and lod2 pass
  validate-ship-assets inside their 24 000 and 8 000 caps
  proxy cover 100 %; ONE CONNECTED BODY

The deliberate functional asymmetry: the transfer bay with its berthed leaf
craft is STARBOARD ONLY. Everything else is symmetric except the single
open battery seam, which is port by rule.
"""
import sys
import math
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import shell as sh
from . import hardware as hw


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, b, h):
    """Hull loft stations for the pavilion escort.

    One continuous faired crescent: a long fine needle run in the bow (the
    prow is part of the LOFT, never a bolted-on spike), a long near-parallel
    mid body, and a calm taper to the transom. Bow stations use the default
    fair chamfer; the needle tip uses edge_section for a sharp leading read;
    the mid body uses k = 0.50 so the flank keeps a tall straight span for
    the galleries, the battery seams and the ivory margin.

    Nose at l*-0.470 = -15.040; transom at l*0.450 = +14.400.
    Bow/mid seam at l*-0.260 = -8.320; mid/stern seam at l*+0.200 = +6.400.
    Max half-beam b*0.270 = 3.37 at mid; max half-height h*0.162 = 1.35.
    """
    return [
        # -- BOW: the needle prow, a long fine run, sharp at the tip --
        sf.edge_section(l * -0.470, b * 0.008, h * 0.020, 0.00),   # nose tip
        sf.edge_section(l * -0.440, b * 0.045, h * 0.070, -0.02),
        sf.fair(l * -0.400, b * 0.100, h * 0.105, -0.04),
        sf.fair(l * -0.350, b * 0.160, h * 0.130, -0.05),
        sf.fair(l * -0.300, b * 0.215, h * 0.150, -0.05),
        sf.fair(l * -0.260, b * 0.250, h * 0.158, -0.05, k=0.55),  # bow/mid seam

        # -- MID: the long ceremonial body, tallest straight flank --
        sf.fair(l * -0.150, b * 0.268, h * 0.162, -0.04, k=0.50),
        sf.fair(l *  0.000, b * 0.270, h * 0.162, -0.03, k=0.50),  # max half-beam
        sf.fair(l *  0.100, b * 0.262, h * 0.160, -0.02, k=0.50),
        sf.fair(l *  0.200, b * 0.245, h * 0.155,  0.00, k=0.55),  # mid/stern seam

        # -- STERN: calm taper to the transom, drive face seats here --
        sf.fair(l *  0.290, b * 0.205, h * 0.145,  0.02, k=0.60),
        sf.fair(l *  0.370, b * 0.150, h * 0.130,  0.03, k=0.62),
        sf.fair(l *  0.450, b * 0.095, h * 0.110,  0.04, k=0.62),  # transom
    ]


# ===========================================================================
# INTERNAL HELPERS
# ===========================================================================

def _chine_path(stations, z0, z1, side, n=19):
    """Gold hairline path riding the deck/flank chine corner, z0 to z1.

    Each point is query-seated: y at the straight-top of the flank, x the
    half-beam at that height (the chamfer endpoint = the chine corner).
    """
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        y = sf.straight_top(stations, z)
        pts.append((side * sf.flank_x(stations, z, y), y, z))
    return pts


def _ivory_top_path(stations, side):
    """Gold hairline bounding the ivory region from above.

    Rides the top edge of the teardrop: level at y = 0.62-0.64 across the
    bow zone and the front of the mid zone, then dipping to the teardrop
    point at z = -0.75. Every point is seated on the surface at its OWN
    (z, y) via sf.flank_x, so the line follows the hull taper.
    """
    ctrl = ((-13.30, 0.62), (-11.00, 0.62), (-8.30, 0.64), (-5.50, 0.64),
            (-2.55, 0.64), (-1.60, 0.46), (-0.75, 0.24))
    pts = []
    for z, y in ctrl:
        fx = sf.flank_x(stations, z, y)
        if fx == 0.0:
            continue                 # section has fallen away — self-trim
        pts.append((side * (fx + 0.01), y, z))
    return pts


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Gilded Chain pavilion escort (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full (layered double dorsal field, overlay thinned to
                6 courses; full-height ivory region on the forward flank)
                2 scale counts, panes and ivory plates halved, second
                dorsal field dropped
                1 loft + collars + one course per flank + gallery wells +
                  bay + drive + pylons + radiators
                0 loft + drive only
    """
    H = kit.ROLE_HULL

    stations = _frigate_stations(l, b, h)

    # Zone z-boundaries (absolute, world units)
    z_nose  = l * -0.470    # ≈ -15.040  nose tip
    z_bow_s = l * -0.260    # ≈  -8.320  bow / mid seam
    z_mid_s = l *  0.200    # ≈   6.400  mid / stern seam
    z_stern = l *  0.450    # ≈  14.400  hull loft transom

    # ── Primary hull loft (always, detail 0+) ────────────────────────────
    kit.hull_loft(parts, 'frigate.hull', H, stations, hull_mat)

    # ── DRIVE FACE (always): 6 countable nozzles at the transom ──────────
    # Sized off the stern section; the housing's forward 0.43 lies inside
    # the hull body, the nozzle face stands 0.12 aft of the transom, so the
    # engine glow is the sternmost geometry on the ship.
    d_w, d_h, d_yo, _ = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern), d_w * 0.92, d_h * 0.88,
                  nozzles=6, depth=0.55, detail=detail)

    if detail < 1:
        return

    # ── ZONE SEAM COLLAR BANDS (detail 1+) — the family signature pair ───
    for tag, zc in (('bow', z_bow_s), ('stern', z_mid_s)):
        ring = sf.collar_ring(stations, zc, over=0.05)
        sh.collar_band(parts, 'frigate.collar.%s' % tag, hull_mat, ring, zc,
                       width=0.14, ribs=10, detail=detail)

    # ── GALLERY SLOTS (detail 1+): the dominant light, low on the flank ──
    # Two long runs per flank, deep wells with absolute-module panes.
    # Upper run ends ahead of the starboard bay; the lower run passes under
    # the bay mouth (bay mouth floor y = -0.30, lower gallery top y = -0.43).
    sh.gallery_slot(parts, glow, 'frigate.gallery.up.stbd', hull_mat, glow_mat,
                    z_bow_s + 0.32, 2.45, -0.15, 0.30,
                    sf.surf_flank(stations, -0.15), side=1.0, depth=0.24,
                    detail=detail)
    sh.gallery_slot(parts, glow, 'frigate.gallery.up.port', hull_mat, glow_mat,
                    z_bow_s + 0.32, z_mid_s - 0.30, -0.15, 0.30,
                    sf.surf_flank(stations, -0.15), side=-1.0, depth=0.24,
                    detail=detail)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gallery_slot(parts, glow, 'frigate.gallery.low.%s' % tag,
                        hull_mat, glow_mat,
                        z_bow_s + 0.32, z_mid_s - 0.30, -0.56, 0.26,
                        sf.surf_flank(stations, -0.56), side=side, depth=0.22,
                        detail=detail)

    # ── ONE FLANK COURSE PER SIDE at detail 1 (the detail-1 set) ─────────
    if detail == 1:
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            sh.scale_course(parts, 'frigate.course.mid.%s' % tag, hull_mat,
                            z_bow_s + 0.02, z_mid_s - 0.05 if side < 0.0 else 2.45,
                            0.14, 0.26, sf.surf_flank(stations, 0.14),
                            side=side, detail=detail, seed=21 if side > 0 else 22)

    # ── PROTECTED TRANSFER BAY with berthed leaf (detail 1+) ─────────────
    # STARBOARD ONLY — the class's deliberate functional asymmetry and its
    # strongest scale cue. Gallery-slot straddle idiom at berth scale: a
    # RECESS back wall buried 0.55 into the flank with its dark face a hair
    # proud of the skin, RECESS cheeks rising to the mouth, TRIM lips, RECESS
    # end posts. Every segment re-samples sf.flank_x at its OWN station so
    # the berth follows the hull taper toward the stern seam.
    bay_z0, bay_z1 = 2.62, 6.02
    bay_y, bay_h, bay_depth = 0.05, 0.70, 0.55
    bay_bury = 0.12
    n_seg = 4
    seg_len = (bay_z1 - bay_z0) / n_seg + 0.04
    for i in range(n_seg):
        cz = bay_z0 + (i + 0.5) * (bay_z1 - bay_z0) / n_seg
        fx = sf.flank_x(stations, cz, bay_y)
        if fx == 0.0:
            continue
        # back wall: body sunk bay_depth inboard, face 0.02 proud of the skin
        wall_x = bay_depth + 0.02
        kit.box(parts, 'frigate.bay.wall.%02d' % i, kit.ROLE_RECESS,
                (fx + 0.02 - wall_x * 0.5, bay_y, cz),
                (wall_x, bay_h, seg_len), hull_mat)
        # cheeks: side walls rising from a 0.12 burial to the mouth plane
        ccx = fx + (bay_depth - bay_bury) * 0.5
        for sy_sign, tag in ((1.0, 't'), (-1.0, 'b')):
            kit.box(parts, 'frigate.bay.cheek.%s%02d' % (tag, i),
                    kit.ROLE_RECESS,
                    (ccx, bay_y + sy_sign * (bay_h * 0.5 + 0.05), cz),
                    (bay_depth + bay_bury, 0.10, seg_len), hull_mat)
        # lips: the bright mouth rim
        if detail >= 2:
            lx = fx + bay_depth - 0.02
            for sy_sign, tag in ((1.0, 't'), (-1.0, 'b')):
                kit.box(parts, 'frigate.bay.lip.%s%02d' % (tag, i),
                        kit.ROLE_TRIM,
                        (lx, bay_y + sy_sign * (bay_h * 0.5 + 0.03), cz),
                        (0.07, 0.06, seg_len), hull_mat)
    # end posts close the berth, each seated at its own station
    for z_end, tag in ((bay_z0, 'n'), (bay_z1, 's')):
        fx = sf.flank_x(stations, z_end, bay_y)
        if fx == 0.0:
            continue
        kit.box(parts, 'frigate.bay.post.%s' % tag, kit.ROLE_RECESS,
                (fx + (bay_depth - bay_bury) * 0.5, bay_y, z_end),
                (bay_depth + bay_bury, bay_h + 0.10, 0.10), hull_mat)
    # Cradle: ROLE_HULL sill the leaf rests in. Inboard end buried 0.30 in
    # the hull; the leaf's belly overlaps its top face by 0.12 (>= 0.10).
    bay_zc = (bay_z0 + bay_z1) * 0.5                       # 4.32
    fx_c = sf.flank_x(stations, bay_zc, bay_y)             # ≈ 3.20
    kit.box(parts, 'frigate.bay.cradle', H,
            (fx_c + 0.20, -0.15, bay_zc), (1.00, 0.16, 2.90), hull_mat)
    # The berthed leaf: nested in the berth, overlapping both the cradle top
    # (0.12) and the back-wall/hull solid (inner 0.17 of the body), so the
    # whole ship stays ONE connected body. Length 3.0 against a 32-unit
    # parent hull is the scale cue section G5 asks for.
    hw.docked_leaf(parts, glow, 'frigate.berth.leaf', hull_mat, glow_mat,
                   (fx_c + 0.28, -0.025, bay_zc), 3.0, detail=detail)

    # ── VENTRAL PYLON SET (detail 1+): the outline-breaker, TWO pairs ────
    # Chord >= l*0.16 each; roots given INSIDE the hull via sf.bottom_y at
    # the root's own station; tips swept down-aft to y = -1.90. The set
    # spans z -7.18 .. +5.78 ≈ 40 % of hull length in the silhouette.
    pylon_chord = l * 0.161                                # 5.15 >= 5.12
    for pair_z, pair_tag in ((-4.60, 'fore'), (2.30, 'aft')):
        for side, tag in ((1.15, 'stbd'), (-1.15, 'port')):
            root_y = sf.bottom_y(stations, pair_z, side) + 0.15
            hw.ventral_pylon(parts, glow,
                             'frigate.pylon.%s.%s' % (pair_tag, tag),
                             hull_mat, glow_mat,
                             (side, root_y, pair_z),
                             (side, -1.90, pair_z + 2.45),
                             pylon_chord, 0.16, detail=detail)

    # ── RADIATOR VANES (detail 1+): two flat empty outline-breaking pairs ──
    # loc anchored ON the flank at its own station; the module buries the
    # inboard 0.10 of span. Pair A mid-flank, pair B on the stern taper.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_vane(parts, 'frigate.rad.a.%s' % tag, hull_mat,
                         (sf.flank_x(stations, -2.60, 0.15), 0.15, -2.60),
                         1.45, 2.00, thick=0.08, sweep=0.30,
                         detail=detail, side=side)
        hw.radiator_vane(parts, 'frigate.rad.b.%s' % tag, hull_mat,
                         (sf.flank_x(stations, 8.60, 0.15), 0.15, 8.60),
                         1.30, 1.80, thick=0.08, sweep=0.30,
                         detail=detail, side=side)

    if detail < 2:
        return

    # ── DORSAL SCALE FIELDS (detail 2+): the LAYERED shell ───────────────
    # Main field over the whole mid zone at 15 courses — the capital-scale
    # read is MORE courses, never bigger scales. Self-trims to the sheer.
    sh.scale_field(parts, 'frigate.field.main', hull_mat,
                   z_bow_s + 0.02, z_mid_s - 0.05,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   15, detail=detail, seed=31)
    # Second, shorter overlay field further aft at detail 3 only: sits one
    # scale-thickness proud of the main field so the dorsal reads as LAYERS.
    # Course count thinned 9 -> 6 this round: the saved scales pay for the
    # ivory region's rows (see IVORY REGION below); the layer still reads.
    if detail >= 3:
        sh.scale_field(parts, 'frigate.field.overlay', hull_mat,
                       2.20, 11.90,
                       sf.surf_top(stations), sf.surf_flat(stations),
                       6, detail=detail, proud=0.19, seed=32)

    # ── FLANK SCALE COURSES (detail 2+): three per flank, one stern ──────
    # No course crosses a zone boundary. The two bow courses are REMOVED:
    # the ivory region owns the bow flank now, and nearly-flush ivory under
    # 0.035-proud scales would be swallowed into peppered noise. The up and
    # mid courses start at z = -0.60, aft of the teardrop point — the scale
    # texture resumes exactly where the ivory ends. The starboard mid
    # course still stops ahead of the bay; the starboard stern course
    # starts aft of the transfer chamber.
    course_z_mid = (-0.60, z_mid_s - 0.05)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.scale_course(parts, 'frigate.course.up.%s' % tag, hull_mat,
                        course_z_mid[0], course_z_mid[1], 0.62, 0.26,
                        sf.surf_flank(stations, 0.62),
                        side=side, detail=detail, seed=41 if side > 0 else 42)
        sh.scale_course(parts, 'frigate.course.mid.%s' % tag, hull_mat,
                        course_z_mid[0],
                        course_z_mid[1] if side < 0.0 else 2.45,
                        0.14, 0.26, sf.surf_flank(stations, 0.14),
                        side=side, detail=detail, seed=43 if side > 0 else 44)
        sh.scale_course(parts, 'frigate.course.low.%s' % tag, hull_mat,
                        z_bow_s + 0.02, course_z_mid[1], -0.88, 0.24,
                        sf.surf_flank(stations, -0.88),
                        side=side, detail=detail, seed=45 if side > 0 else 46)
        sh.scale_course(parts, 'frigate.course.stern.%s' % tag, hull_mat,
                        6.60 if side < 0.0 else 7.95, 13.55, 0.10, 0.24,
                        sf.surf_flank(stations, 0.10),
                        side=side, detail=detail, seed=51 if side > 0 else 52)

    # ── IVORY REGION (detail 2+): the big forward-flank two-tone ─────────
    # One continuous teardrop, the charter's loudest feature: SIX stacked
    # rows cover the full straight flank height across the bow zone, then
    # three rows taper aft through the front of the mid zone to a point at
    # z = -0.8. Every row is its OWN ivory_margin call with rows=1 and a
    # surf sampled at the row's own height (sf.surf_flank(stations, ry)),
    # so the outer rows follow the chamfer as the section narrows toward
    # the nose and self-trim where they leave the hull. Runs split at the
    # bow/mid collar; the collar band covers the joint. Bounded above by a
    # hairline gold line. Role discipline: ivory plates are ROLE_ARMOUR,
    # the bounding line is a gold HAIRLINE (strut r = 0.022 <= 0.03).
    # Row stack (bow, all end at the collar face z = z_bow_s - 0.13):
    _IVORY_BOW = (
        # (y, height, z0)
        (-0.62, 0.18, -12.60),   # low wrap row: rides the lower chamfer
        (-0.415, 0.23, -13.20),
        (-0.18, 0.24, -13.90),
        (0.07, 0.26, -13.90),
        (0.33, 0.26, -13.20),
        (0.53, 0.14, -12.40),    # top wrap row: rides the upper chamfer
    )
    # Mid rows (all start aft of the collar at z = z_bow_s + 0.17):
    _IVORY_MID = (
        # (y, height, z1, taper)
        (0.12, 0.20, -0.80, 0.60),   # the teardrop point row
        (0.33, 0.26, -6.90, 0.70),   # ends ahead of the battery seams
        (0.55, 0.14, -1.90, 0.70),   # top row passes above the seams
    )
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for ri, (ry, rh, rz0) in enumerate(_IVORY_BOW):
            sh.ivory_margin(parts, 'frigate.ivory.bow%d.%s' % (ri, tag),
                            hull_mat, rz0, z_bow_s - 0.13, ry, rh,
                            sf.surf_flank(stations, ry),
                            side=side, detail=detail, rows=1)
        for ri, (ry, rh, rz1, rt) in enumerate(_IVORY_MID):
            sh.ivory_margin(parts, 'frigate.ivory.mid%d.%s' % (ri, tag),
                            hull_mat, z_bow_s + 0.17, rz1, ry, rh,
                            sf.surf_flank(stations, ry),
                            side=side, detail=detail, rows=1, taper=rt)
        sh.gold_line(parts, 'frigate.ivory.line.%s' % tag, hull_mat,
                     _ivory_top_path(stations, side), detail=detail)

    # ── FULL-LENGTH CHINE GOLD LINES (detail 2+) — family signature ──────
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gold_line(parts, 'frigate.chine.%s' % tag, hull_mat,
                     _chine_path(stations, -14.00, 13.80, side),
                     detail=detail)

    # ── EDGE KEEL (detail 2+): the ivory leading-edge blade ──────────────
    sh.edge_keel(parts, 'frigate.keel', hull_mat, -13.80, 13.60,
                 sf.surf_bottom(stations), half_w=0.06, detail=detail,
                 role=kit.ROLE_ARMOUR)

    # ── HIDDEN BATTERIES (detail 2+): closed hairline seams ──────────────
    # Disciplined run at constant 2.50 pitch on both flanks, inside the mid
    # band, fore of the bay. Exactly ONE — port, third of the run — is open
    # at 0.6: a thin turquoise line in the recess floor. loc is seated with
    # sf.flank_anchor so the seam face stands 0.02 proud of the skin.
    seam_zs = (-6.00, -3.50, -1.00, 1.50)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for i, sz in enumerate(seam_zs):
            open_v = 0.6 if (side < 0.0 and i == 2) else 0.0
            hw_sh_x = sf.flank_anchor(stations, sz, 0.38, -0.02)
            sh.aperture_seam(parts, glow,
                             'frigate.battery.%s.%d' % (tag, i),
                             hull_mat, glow_mat,
                             (side * hw_sh_x, 0.38, sz), 1.50, axis='z',
                             open=open_v, detail=detail)

    # ── OBSERVATION ROTUNDA (detail 2+): unnervingly calm ────────────────
    # Seated on a sf.top_y query so the drum's lower 0.12 is inside the
    # deck. Panes are the absolute PORT_LIGHT module: more panes, never
    # bigger ones.
    rot_z = -5.90
    hw.observation_rotunda(parts, glow, 'frigate.rotunda', hull_mat, glow_mat,
                           (0.0, sf.top_y(stations, rot_z, 0.0), rot_z),
                           0.65, 0.55, detail=detail)

    # ── TRANSFER CHAMBER (detail 2+): sealed, beside the bay ─────────────
    # Starboard, just aft of the berth; inboard half inside the hull via
    # sf.flank_anchor. Hatch faces +x, sealed, with a hairline gold frame.
    tc_z = 7.30
    tc_x = sf.flank_anchor(stations, tc_z, 0.10, 0.10)
    hw.transfer_chamber(parts, glow, 'frigate.transfer', hull_mat, glow_mat,
                        (tc_x, 0.10, tc_z), (0.55, 0.66, 1.05),
                        detail=detail, face='x')

    # ── MARKER RUNS (detail 2+): absolute LAMP_SPACING pitch ─────────────
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.marker_run(parts, glow, 'frigate.markers.%s' % tag,
                      hull_mat, glow_mat, z_bow_s + 0.32, z_mid_s - 0.20,
                      0.70, sf.surf_flank(stations, 0.70),
                      side=side, detail=detail)

    # ── MAST CLUSTERS (detail 2+): thin fragile spires, the only vertical ─
    for mz, mh, tag in ((-6.60, 0.68, 'fore'), (9.80, 0.55, 'aft')):
        hw.mast_cluster(parts, glow, 'frigate.mast.%s' % tag,
                        hull_mat, glow_mat,
                        (0.0, sf.top_y(stations, mz, 0.0), mz),
                        mh, count=3, detail=detail)
