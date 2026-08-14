"""Gilded Chain Light - CATALOG COURIER.

Bible 4.5 light: "a small polished seed/scale shape with one turquoise
sensory slit, hidden landing geometry, and a perfectly flush sealed payload
chamber". The smallest, most polished hull in the fleet: a closed pebble,
not a warship. All shell, no visible mechanism.

BODY PLAN
    One continuous faired seed/leaf loft (sf.fair throughout, the Chain
    default), widest just aft of the hull midpoint, drawn forward to a fine
    needle nose that is part of the LOFT (never a bolted spike) and aft to a
    clean narrow transom. No steps, no bolt-ons, one continuous curve.

STATION-LIST REASONING (z as fractions of l; half-extents as fractions of
the CLASS envelope maxima b and h, kept well inside both):
    Nose tip at l*-0.46, transom at l*0.44 -> loft z-span 0.90*l = 7.02,
    inside the 4.08-9.52 band with the drive housing (its back face stands
    0.12 aft of the transom) taking the measured span to ~7.14.
    The bow run l*-0.46..l*-0.29 is the needle: five stations climbing
    b*0.004 -> b*0.195 so the prow reads as a drawn point, not a cone.
    Max half-beam b*0.255 = 0.835 at l*0.00 (just aft of the hull midpoint
    z=-0.078): hull length/beam 7.02/1.67 = 4.2, beam/length 0.238 (>= 0.19
    floor). Max half-height h*0.208 = 0.389: loft spanY 0.78, and ~1.02
    including the pylon tips -> height/length 0.146 (<= 0.15).

ZONES (each boundary marked by a sh.collar_band on sf.collar_ring; no course
crosses a boundary):
    bow   l*-0.46..l*-0.25   23 % of hull length
    mid   l*-0.25..l*0.18    48 %
    stern l* 0.18..l*0.44    29 %
    The ivory REGION spans bow + forward mid as TWO runs split at the bow
    collar (the collar covers the joint; the region reads as one teardrop).
    Each run is a stack of sub-band ivory_margin calls, every sub-band
    seated with sf.surf_flank at its OWN height so the rows follow the
    chamfer: the bow run covers the flank from near the keel line to the
    chine, the mid run rides the upper flank clear of the gallery and
    tapers hard aft. Dorsal scale fields fill all three zones (bow, mid,
    stern decks, each confined to its zone); flank courses are one low mid
    course plus two stern courses per side; gallery slots and the payload
    seam stay in the mid zone; the marker run rides the stern lower flank.

OUTLINE-BREAKER (G2): the swept ventral pylon pair, root chord 1.30 =
l*0.167, 18.5 % of the loft length in the side silhouette (>= 15 %). Roots
are given INSIDE the hull (keel query + 0.16 rise) and used as given; tips
sweep down 0.23 below the keel and aft, doubling as the hidden landing
geometry. chord = 1.30 >= l*0.16. No masts: a polished courier carries none.

EMISSIVE BUDGET (<= 5 % of hull area, gallery is the dominant light):
    ONE sh.gallery_slot low on each flank in the mid band - the "one
    turquoise sensory slit" the bible names; every other light stays off the
    bow. Drive glow comes only from hw.drive_face at the transom (2 nozzles,
    countable). A marker run at absolute LAMP_SPACING rides ONE flank -
    the class's single deliberate functional asymmetry - on the starboard
    lower STERN flank between the lower stern course and the keel, plus two
    thin pylon tip lines. All seams are closed (open=0.0): threats hidden
    until used. AUTHORED AIM: emissive ~= 3-3.5 % of hull area (gallery
    panes ~0.32, drive ~0.05, markers ~0.03, pylon tips ~0.04 against a
    ~12-15 unit hull area); the additions below carry NO new emissive.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; scale counts and pane counts halve internally
    1  loft + collars + one flank course per side + the gallery well
       + the drive + the pylons
    0  loft + drive only (housing + 2 throats; COLOR_0 stays non-uniform
       via ROLE_HULL hull vs ROLE_RECESS throats)

DENSITY (MEASURED - from the pipeline, not authored):
    Commands: blender -b -P scripts/build-ship-assets.py -- gilded,
              node scripts/compress-ship-assets.mjs gilded,
              node scripts/measure-ships.mjs gilded,
              node scripts/probe-ship-islands.mjs gilded light lod0
    detail 3  10,756 verts / 5,584 lod0 triangles
    detail 2  ~7,600 verts / ~4,000 triangles (shell count halves
                internally: fields, courses and ivory plates all count down)
    detail 1  ~2,600 verts / ~1,500 triangles (loft + collars + one
                low flank course per side + the gallery wells + the drive
                + the pylons)
    detail 0  ~310 verts / ~260 triangles (loft + drive)
    Max span 7.2; len/beam 3.98; ht/len 0.15; beam/len 0.25.
    Proxy cover 100 %; probe-ship-islands reports ONE CONNECTED BODY
    at 0.06 voxels.
    All four sit far under the whole-ship lod caps (60,000 / 24,000 /
    8,000 / 4,000). SHIP_SCALE.light.hull band 4,000-25,000: the build
    lands mid-band at 10,756 verts.

IVORY COVERAGE (AUTHORED AIM): the region covers ~= 1.0-1.1 square units
per flank - bow run 5 sub-bands x 0.12 tall (y -0.30..+0.30, self-trimming
on the needle) over z -3.12..-2.01, mid run 2 sub-bands (y 0.03..0.27)
over z -1.89..+0.86 with taper 0.35 closing the teardrop. Against a
broadside flank silhouette of ~= 4.33 square units that is ~= 23-25 % of
the visible flank - the charter's big deliberate two-tone.
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

def _light_stations(l, b, h):
    """Hull loft stations for the catalog courier: one faired seed/leaf.

    All sf.fair (smooth near-oval, the Chain default); y_offset 0.0
    throughout so the section stays a clean symmetric leaf. z fractions of
    l; half-extents as fractions of the class envelope b and h, held well
    inside both (the Chain is far slimmer than the envelope allows).

    Nose at l*-0.46 = -3.588; transom at l*0.44 = +3.432.
    Bow/mid seam at l*-0.25 = -1.950; mid/stern seam at l*+0.18 = +1.404.
    Widest at l*0.00 (half-beam b*0.255 = 0.835), just aft of the hull
    midpoint z = -0.078.
    """
    return [
        # -- BOW: the needle prow, five stations drawn to a point ----------
        sf.fair(l * -0.460, b * 0.004, h * 0.012, 0.0),  # nose tip
        sf.fair(l * -0.430, b * 0.030, h * 0.050, 0.0),
        sf.fair(l * -0.390, b * 0.075, h * 0.105, 0.0),
        sf.fair(l * -0.340, b * 0.140, h * 0.160, 0.0),
        sf.fair(l * -0.290, b * 0.195, h * 0.190, 0.0),
        sf.fair(l * -0.250, b * 0.225, h * 0.205, 0.0),  # bow/mid seam

        # -- MID: the full seed body, widest just aft of the midpoint ------
        sf.fair(l * -0.140, b * 0.248, h * 0.208, 0.0),
        sf.fair(l *  0.000, b * 0.255, h * 0.200, 0.0),  # max half-beam
        sf.fair(l *  0.090, b * 0.248, h * 0.188, 0.0),
        sf.fair(l *  0.180, b * 0.222, h * 0.172, 0.0),  # mid/stern seam

        # -- STERN: one calm fair run to the clean transom -----------------
        sf.fair(l *  0.290, b * 0.178, h * 0.148, 0.0),
        sf.fair(l *  0.380, b * 0.128, h * 0.118, 0.0),
        sf.fair(l *  0.440, b * 0.088, h * 0.092, 0.0),  # transom
    ]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Gilded Chain catalog courier (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.8, 3.276, 1.872).
    detail   -- 3 full  2 halved repeats  1 primary masses + gallery well
                0 loft + drive only.

    MEASURED (from measure-ships.mjs gilded, probe-ship-islands.mjs):
        detail 3  10,756 hull verts / 5,584 lod0 triangles
        max span 7.2, len/beam 3.98, ht/len 0.15, beam/len 0.25
        proxy cover 100 %, ONE CONNECTED BODY at 0.06 voxels
        inside SHIP_SCALE.light.hull band 4,000-25,000 and the
        60,000/24,000/8,000 LOD triangle caps
    """
    H = kit.ROLE_HULL

    stations = _light_stations(l, b, h)

    # Zone z-boundaries (absolute, world units)
    z_bow    = l * -0.25    # = -1.950  bow / mid seam
    z_mid    = l *  0.18    # =  1.404  mid / stern seam
    z_trans  = l *  0.44    # =  3.432  hull loft transom

    # ── Primary hull loft (always, detail 0+) ────────────────────────────
    kit.hull_loft(parts, 'light.hull', H, stations, hull_mat)

    # ── DRIVE FACE at the transom (always; detail 0 = housing + 2 throats)
    # Sized off sf.section at the stern station; loc is the stern surface
    # point, the hardware buries its own forward 0.12. 2 nozzles: the
    # countable small-craft group. Glow ends up AT the stern.
    d_hw, d_hh, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), d_hw * 0.94, d_hh * 0.94,
                  nozzles=2, depth=0.36, detail=detail)

    if detail < 1:
        return

    # ── ZONE COLLARS (detail 1+): the family signature seam marks ────────
    sh.collar_band(parts, 'light.collar.bow', hull_mat,
                   sf.collar_ring(stations, z_bow), z_bow, detail=detail)
    sh.collar_band(parts, 'light.collar.mid', hull_mat,
                   sf.collar_ring(stations, z_mid), z_mid, detail=detail)

    # ── FLANK SCALE COURSE, LOW MID (detail 1+): the ladder's one course ─
    # The detail-1 course per flank: a LOW mid-zone lane below the gallery
    # (gallery sole -0.235; course crown -0.30) and clear of the ivory
    # region's lower edge (-0.30) at the bow collar. Seated with
    # sf.surf_flank at the course centre height; self-trims aft where the
    # stern section drops below y=-0.33. Confined to the mid zone.
    y_crs_a = -0.33
    surf_crs_a = sf.surf_flank(stations, y_crs_a)
    sh.scale_course(parts, 'light.flank.low.stbd', hull_mat,
                    z_bow + 0.05, z_mid - 0.05, y_crs_a, 0.06, surf_crs_a,
                    side=1.0, detail=detail, seed=21)
    sh.scale_course(parts, 'light.flank.low.port', hull_mat,
                    z_bow + 0.05, z_mid - 0.05, y_crs_a, 0.06, surf_crs_a,
                    side=-1.0, detail=detail, seed=22)

    # ── GALLERY SLOTS (detail 1+): the one turquoise sensory slit ────────
    # Low on each flank, wholly inside the mid zone; the dominant light on
    # the ship. depth 0.16 keeps the pane 0.125 inboard of the lip plane
    # (>= 0.12 rule) and pulls the raised mouth tight to the slim hull.
    y_gal = -0.16
    surf_gal = sf.surf_flank(stations, y_gal)
    sh.gallery_slot(parts, glow, 'light.gallery.stbd', hull_mat, glow_mat,
                    l * -0.20, l * 0.14, y_gal, 0.15, surf_gal,
                    side=1.0, depth=0.16, detail=detail)
    sh.gallery_slot(parts, glow, 'light.gallery.port', hull_mat, glow_mat,
                    l * -0.20, l * 0.14, y_gal, 0.15, surf_gal,
                    side=-1.0, depth=0.16, detail=detail)

    # ── VENTRAL PYLONS (detail 1+): THE outline-breaker + landing gear ───
    # Root given INSIDE the hull (keel query + 0.16 rise at the root's own
    # station) and used as given - that burial is the connectivity. Tip
    # sweeps down 0.23 below the keel and aft; root chord 1.30 = l*0.167.
    z_py = l * 0.02
    py_ry = sf.bottom_y(stations, z_py) + 0.16
    hw.ventral_pylon(parts, glow, 'light.pylon.stbd', hull_mat, glow_mat,
                     (0.30, py_ry, z_py), (0.36, -0.60, l * 0.16),
                     1.30, 0.10, detail=detail)
    hw.ventral_pylon(parts, glow, 'light.pylon.port', hull_mat, glow_mat,
                     (-0.30, py_ry, z_py), (-0.36, -0.60, l * 0.16),
                     1.30, 0.10, detail=detail)

    if detail < 2:
        return

    # ── DORSAL SCALE FIELDS (detail 2+): the ceramic shell, three zones ──
    # Density comes from MORE COURSES and longer runs at the absolute
    # _SCALE_PITCH (0.46), never from a finer pitch - the charter's own
    # scale cue. One field per zone, each confined inside its zone; every
    # field is seated with sf.surf_top / sf.surf_flat and self-trims to
    # the sheer.
    deck_y = sf.surf_top(stations, 0.0, 0.0)
    deck_half = sf.surf_flat(stations, 0.02)
    # mid deck: 18 strake courses over the full seed body (was 6)
    sh.scale_field(parts, 'light.deck.field', hull_mat,
                   z_bow + 0.06, z_mid - 0.06, deck_y, deck_half,
                   18, detail=detail, seed=11)
    # bow deck: 12 courses riding the needle's back; edge courses
    # self-trim as the deck tapers to the prow
    sh.scale_field(parts, 'light.deck.bow', hull_mat,
                   l * -0.40, z_bow - 0.06, deck_y, deck_half,
                   12, detail=detail, seed=12)
    # stern deck: 14 courses from the mid collar to the transom
    sh.scale_field(parts, 'light.deck.stern', hull_mat,
                   z_mid + 0.06, z_trans - 0.10, deck_y, deck_half,
                   14, detail=detail, seed=13)

    # ── FLANK SCALE COURSES, STERN (detail 2+): second + third courses ──
    # Two more courses per flank at different heights, both wholly inside
    # the stern zone so they never meet the ivory (mid, upper) or the
    # gallery (mid, centre). Seated with sf.surf_flank at each course's
    # OWN centre height; both self-trim toward the transom taper.
    y_crs_b = 0.10                       # upper stern flank
    y_crs_c = -0.12                      # lower stern flank, above the markers
    surf_crs_b = sf.surf_flank(stations, y_crs_b)
    surf_crs_c = sf.surf_flank(stations, y_crs_c)
    for side, tag, sd in ((1.0, 'stbd', 23), (-1.0, 'port', 24)):
        sh.scale_course(parts, 'light.flank.stern.up.' + tag, hull_mat,
                        z_mid + 0.05, z_trans - 0.10, y_crs_b, 0.06,
                        surf_crs_b, side=side, detail=detail, seed=sd)
        sh.scale_course(parts, 'light.flank.stern.lo.' + tag, hull_mat,
                        z_mid + 0.05, z_trans - 0.10, y_crs_c, 0.06,
                        surf_crs_c, side=side, detail=detail, seed=sd + 2)

    # ── IVORY REGION (detail 2+): the forward-flank two-tone teardrop ────
    # One continuous region from the forward bow to the front of the mid
    # zone, built as TWO runs split at the bow collar so no course crosses
    # a zone boundary; the collar band covers the joint. Each run is a
    # stack of sub-band calls: every sub-band is seated with sf.surf_flank
    # at its OWN height (so the rows follow the chamfer instead of poking
    # outboard where the section rolls) and stacks rows=3 plates inside
    # its 0.12 height. Long fair plates at absolute _MARGIN_PITCH.
    #   bow run: 5 sub-bands covering y -0.30..+0.30 - from near the keel
    #            line up to the chine; high bands self-trim on the needle.
    #   mid run: 2 sub-bands covering y 0.03..0.27 - the upper flank, clear
    #            of the gallery crown (-0.085); taper 0.35 shrinks the
    #            plates toward the stern, closing the teardrop.
    _IVORY_BANDS_BOW = (-0.24, -0.12, 0.0, 0.12, 0.24)
    _IVORY_BANDS_MID = (0.09, 0.21)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for bi, yb in enumerate(_IVORY_BANDS_BOW):
            sh.ivory_margin(parts, 'light.margin.bow%d.%s' % (bi, tag),
                            hull_mat, l * -0.40, z_bow - 0.06, yb, 0.12,
                            sf.surf_flank(stations, yb),
                            side=side, detail=detail, rows=3)
        for bi, yb in enumerate(_IVORY_BANDS_MID):
            sh.ivory_margin(parts, 'light.margin.mid%d.%s' % (bi, tag),
                            hull_mat, z_bow + 0.06, l * 0.11, yb, 0.12,
                            sf.surf_flank(stations, yb),
                            side=side, detail=detail, rows=3, taper=0.35)

    # ── GOLD HAIRLINES (detail 2+) ────────────────────────────────────────
    # (a) the region's upper bound, forward bow to the mid-zone tail: each
    #     point rides min(region crown 0.30, hull surface - 0.03) at its
    #     OWN station (sf.section for the height, sf.flank_x for the
    #     beam); both ends buried 0.12 into the hull solid.
    zs_mb = (l * -0.31, l * -0.29, z_bow, l * -0.14,
             0.0, l * 0.06, l * 0.11)
    n_mb = len(zs_mb)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        path = []
        for i, z in enumerate(zs_mb):
            _, hh_mb, yo_mb, _ = sf.section(stations, z)
            yl = min(0.30, yo_mb + hh_mb - 0.03)
            xp = sf.flank_x(stations, z, yl)
            if i == 0 or i == n_mb - 1:
                xp -= 0.12            # end buried into the hull solid
            path.append((side * xp, yl, z))
        sh.gold_line(parts, 'light.marginline.' + tag, hull_mat, path,
                     detail=detail)

    # (b) the deck-edge sheer line, near full length: each point rides the
    #     deck surface 0.03 outboard of the flat-deck break (sf.flat_half /
    #     sf.top_y at its own station); both ends dropped 0.12 into solid.
    zs_sh = (l * -0.34, l * -0.25, l * -0.14, 0.0,
             l * 0.09, l * 0.18, l * 0.29, l * 0.36)
    n_sh = len(zs_sh)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        path = []
        for i, z in enumerate(zs_sh):
            xp = sf.flat_half(stations, z) + 0.03
            yp = sf.top_y(stations, z, xp)
            if i == 0 or i == n_sh - 1:
                yp -= 0.12            # end buried into the hull solid
            path.append((side * xp, yp, z))
        sh.gold_line(parts, 'light.sheer.' + tag, hull_mat, path,
                     detail=detail)

    # ── SEALED PAYLOAD CHAMBER (detail 2+): perfectly flush, CLOSED ──────
    # A closed hairline seam on the ventral centreline, seated on the keel
    # query at its own station. open=0.0: no glow, lips touching - the
    # flush sealed chamber is the point.
    z_sm = l * -0.10
    sh.aperture_seam(parts, glow, 'light.payload.seam', hull_mat, glow_mat,
                     (0.0, sf.bottom_y(stations, z_sm), z_sm),
                     l * 0.14, axis='x', open=0.0, detail=detail)

    # ── MARKER RUN (detail 2+): STARBOARD ONLY - the one asymmetry ───────
    # Navigation markers at absolute LAMP_SPACING on the starboard lower
    # STERN flank, wholly inside the stern zone: between the lower stern
    # course (sole -0.15) and the keel, self-trimming where the transom
    # taper drops the section below y=-0.20. The port flank stays clean.
    # That single-sided run is this class's only deliberate asymmetry.
    y_mk = -0.20
    hw.marker_run(parts, glow, 'light.markers', hull_mat, glow_mat,
                  l * 0.20, l * 0.42, y_mk,
                  sf.surf_flank(stations, y_mk),
                  side=1.0, detail=detail)
