"""Gilded Chain Cutter - CUSTOMS ACQUISITOR.

Bible §4.5: "a poised vessel with a ventral capture collar, precision
tractor lenses, two sealed transfer chambers, and symmetrical inspection
sensor arrays". The same family leaf as every Chain hull - one continuous
faired volume with a needle prow - but with a fuller mid-body that hosts
the working equipment. Everything reads SEALED and QUIET: a closed
instrument, not a tug.

Envelope (driver): l = 11.0, b = 5.28, h = 3.30.
-Measured (node scripts/measure-ships.mjs gilded, scripts/probe-ship-islands.mjs gilded cutter lod0, node scripts/validate-ship-assets.mjs):
  hull 17 776 verts (band 6 000-47 000); max span 10.0; length/beam 3.42; height/length 0.14; beam/length 0.29
  lod0 9 320 tris against the 60 000 cap; lod1 and lod2 pass; lod3 against the 4 000 cap
  proxy cover 100 %; ONE CONNECTED BODY

Family signature held here:
- one loft, needle prow in the station run, never a bolted spike;
- zone seams marked by sh.collar_band on sf.collar_ring at l*-0.24 and
  l*+0.20, plus one full-length chine sh.gold_line per side;
- the ivory two-tone is a REGION, not a ribbon: three stacked rows of LONG
  plates covering most of the forward flank's height (y -0.19..+0.14) over
  the bow zone and the front of the mid zone, every row seated at its own
  height, split at the bow/mid collar seam, tapering aft into a teardrop,
  the tall bow-zone top edge bounded by a gold hairline; dorsal and stern
  stay near-black scales;
- gallery slots low on the mid flank carry the dominant emissive; drive
  glow only from hw.drive_face at the transom;
- apertures are closed hairline seams; the ONE deliberate asymmetry is a
  single open (0.6) inspection seam on the PORT flank;
- outline-breaker: the swept ventral pylon pair, chord >= l*0.16, tips
  swept well aft of the transom.
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

def _cutter_stations(l, b, h):
    """Hull loft stations for the customs acquisitor.

    sf.fair near-oval sections throughout (the Chain default); only the
    nose tip uses sf.edge_section for the sharp needle entry.

    Nose at l*-0.460 = -5.060; hull transom at l*+0.440 = +4.840.
    Bow/mid seam at l*-0.240 = -2.640; mid/stern seam at l*+0.200 = +2.200.
    Max half-beam b*0.265 = 1.399 at l*-0.120; max half-height h*0.115 =
    0.380 through the full mid-body.
    """
    return [
        # -- BOW: long fine needle run, the prow is part of the loft --
        sf.edge_section(l * -0.460, b * 0.008, h * 0.012, 0.0),  # nose tip
        sf.fair(l * -0.430, b * 0.030, h * 0.020, 0.0),
        sf.fair(l * -0.390, b * 0.075, h * 0.045, 0.0),
        sf.fair(l * -0.340, b * 0.140, h * 0.075, 0.0),
        sf.fair(l * -0.290, b * 0.205, h * 0.098, 0.0),
        sf.fair(l * -0.240, b * 0.240, h * 0.110, 0.0),  # bow / mid seam

        # -- MID: fuller body hosting the working equipment --
        sf.fair(l * -0.120, b * 0.265, h * 0.115, 0.0),  # max half-beam
        sf.fair(l *  0.000, b * 0.262, h * 0.115, 0.0),
        sf.fair(l *  0.100, b * 0.250, h * 0.112, 0.0),
        sf.fair(l *  0.200, b * 0.230, h * 0.105, 0.0),  # mid / stern seam

        # -- STERN: clean taper to the transom, drive housing overlaps --
        sf.fair(l *  0.300, b * 0.200, h * 0.095, 0.0),
        sf.fair(l *  0.380, b * 0.160, h * 0.082, 0.0),
        sf.fair(l *  0.440, b * 0.120, h * 0.068, 0.0),  # hull transom
    ]


# ===========================================================================
# GOLD LINE PATH HELPERS
# ===========================================================================

def _chine_path(stations, side, z0, z1, n):
    """Points riding the chine corner (deck edge) from z0 to z1.

    Each point sits 0.02 proud of the chamfer corner (flat_half,
    straight_top); both endpoints are pulled 0.12 inboard so the hairline
    ends bury inside the hull solid.
    """
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        x = sf.flat_half(stations, z) + 0.02
        y = sf.straight_top(stations, z) + 0.02
        if i == 0 or i == n - 1:
            x -= 0.12
            y -= 0.12
        pts.append((side * x, y, z))
    return pts


def _margin_line(stations, side, z0, z1, y, y1=None):
    """Points riding the flank at height y, bounding the ivory region.

    Stations where the hull section has fallen away at height y (the fine
    nose run) are skipped so the line never floats; the first kept point
    and the last point are pulled 0.12 inboard to bury the ends. `y1`
    lerps the ride height along the run so the line can follow a region
    edge that drops toward a tapering tip.
    """
    if y1 is None:
        y1 = y
    pts = []
    n = 8
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        yy = y + (y1 - y) * t
        fx = sf.flank_x(stations, z, yy)
        if fx <= 0.05:
            continue                     # nose section too fine here
        x = fx + 0.02
        if not pts or i == n - 1:
            x -= 0.12
        pts.append((side * x, yy, z))
    if len(pts) < 2:
        return []
    return pts


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Gilded Chain customs acquisitor (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 loft + collar bands + capture collar + pylons + one
                  course per flank + gallery well + drive
                0 loft + drive only.
    """
    H = kit.ROLE_HULL

    stations = _cutter_stations(l, b, h)

    # Zone z-boundaries (absolute, world units)
    z_nose  = l * -0.460    # ≈ -5.060  nose tip
    z_bow_s = l * -0.240    # ≈ -2.640  bow / mid seam
    z_mid_s = l *  0.200    # ≈  2.200  mid / stern seam
    z_stern = l *  0.440    # ≈  4.840  hull loft transom

    # ── Primary hull loft (always, detail 0+) ────────────────────────────
    kit.hull_loft(parts, 'cutter.hull', H, stations, hull_mat)

    # ── DRIVE FACE — transom, 4 countable nozzles (always, detail 0+) ────
    # Housing back face stands at the transom; its forward 0.12 is buried
    # in the stern section (the construct seats it), so the drive is part
    # of the hull mass, never an add-on. half extents fit inside the
    # transom section (hw 0.634, hh 0.224).
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  b * 0.095, h * 0.058, nozzles=4, depth=0.5,
                  detail=detail)

    if detail < 1:
        return

    # ── ZONE SEAM COLLAR BANDS (detail 1+) ───────────────────────────────
    # The family signature: a gold collar ring on each zone boundary.
    sh.collar_band(parts, 'cutter.zone.bow', hull_mat,
                   sf.collar_ring(stations, z_bow_s), z_bow_s,
                   width=0.10, ribs=8, detail=detail)
    sh.collar_band(parts, 'cutter.zone.mid', hull_mat,
                   sf.collar_ring(stations, z_mid_s), z_mid_s,
                   width=0.10, ribs=8, detail=detail)

    # ── CAPTURE COLLAR — ventral centreline, mid band (detail 1+) ────────
    # THE class fitting. bore=None -> the ONE fleet bore (sf.COLLAR_BORE),
    # never scaled. Seated with sf.bottom_y at its own station so the
    # barrel's upper 0.22 is inside the hull and the bore face points -y
    # just clear of the keel skin.
    z_cc  = l * -0.020                        # ≈ -0.220, mid band
    cc_by = sf.bottom_y(stations, z_cc)
    hw.capture_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      (0.0, cc_by, z_cc), bore=None, ribs=8, detail=detail)

    # ── VENTRAL PYLON PAIR — the outline-breaker (detail 1+) ─────────────
    # Swept blades: roots INSIDE the hull (given inside, never inset back
    # out). The tip was at l*0.573, which made the blade span z 0.09..6.66 —
    # 6.58 units, 60 % of the hull, running 1.7 past the transom, and the
    # Models Browser read it as a whisker antenna rather than a fin, because
    # ventral_pylon interpolates its LE and TE lines to a 40 % tip chord. The
    # tip now sits 0.35 chord aft of the root, so the pair reads as a swept
    # delta whose chord (1.80 = l*0.164) carries the >= 15 % outline share on
    # its own. MEASURED span after the change: 10.0, set by the loft plus the
    # drive face (node scripts/measure-ships.mjs gilded).
    py_root_z = l * 0.090                     # ≈ 0.990
    py_tip_z  = py_root_z + l * 0.164 * 0.35  # ≈ 1.621, tip TE ≈ +1.98
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.ventral_pylon(parts, glow, 'cutter.pylon.' + tag,
                         hull_mat, glow_mat,
                         (side * 0.55, -0.15, py_root_z),   # root, in-hull
                         (side * 0.55, -0.78, py_tip_z),    # tip, low + aft
                         l * 0.164, 0.10, detail=detail)

    # ── ONE SCALE COURSE PER FLANK — mid upper band (detail 1+) ──────────
    # The detail-1 shell read: a single fair course per flank, seated with
    # its own sf.surf_flank callable so every scale re-samples its station.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.scale_course(parts, 'cutter.course.mid.' + tag, hull_mat,
                        z_bow_s + 0.06, z_mid_s - 0.06, 0.17, 0.10,
                        sf.surf_flank(stations, 0.17), side=side,
                        detail=detail, seed=31 if side > 0.0 else 32)

    # ── GALLERY SLOTS — low mid flank, the dominant light (detail 1+) ────
    # One long slot per flank, forward of the transfer chambers. Turquoise
    # panes sit at the bottom of a real recessed well (the construct builds
    # back wall, cheeks, lips and arch ends, all buried >= 0.10).
    gz0 = l * -0.136                          # ≈ -1.496
    gz1 = l *  0.064                          # ≈  0.704
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gallery_slot(parts, glow, 'cutter.gallery.' + tag,
                        hull_mat, glow_mat, gz0, gz1, -0.16, 0.14,
                        sf.surf_flank(stations, -0.16), side=side,
                        depth=0.22, detail=detail, arch=True)

    if detail < 2:
        return

    # ── DORSAL SCALE FIELDS — one per zone, never crossing a seam ────────
    # Near-black overlapping scales in long fore-and-aft courses across the
    # deck. Courses derive from the widest flat deck of EACH zone run and
    # self-trim where the sheer tapers. A bigger hull gets MORE courses at
    # the same absolute pitch, never bigger scales.
    sh.scale_field(parts, 'cutter.field.bow', hull_mat,
                   l * -0.400, z_bow_s - 0.06,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   11, detail=detail, seed=41)
    sh.scale_field(parts, 'cutter.field.mid', hull_mat,
                   z_bow_s + 0.06, z_mid_s - 0.06,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   19, detail=detail, seed=42)
    sh.scale_field(parts, 'cutter.field.stern', hull_mat,
                   z_mid_s + 0.06, l * 0.414,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   11, detail=detail, seed=43)

    # ── FLANK SCALE COURSES — mid relief strake, bow and stern zones ─────
    # The mid band carries TWO courses per flank: the original at the top of
    # the straight flank (detail 1 block) and a second strake on the lower
    # chamfer between it and the chine, filling what was the flattest black
    # area on the hull. The strake ends clear of the transfer-chamber block
    # (forward face z ≈ 0.90). The bow courses move OFF y ±0.14 onto the
    # chamfers so the tall ivory region owns the straight flank; stern keeps
    # its upper and lower course. No course crosses a zone boundary.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        s_up = 51 if side > 0.0 else 52
        s_lo = 53 if side > 0.0 else 54
        sh.scale_course(parts, 'cutter.course.mid.hi.' + tag, hull_mat,
                        z_bow_s + 0.06, l * 0.076, 0.26, 0.08,
                        sf.surf_flank(stations, 0.26), side=side,
                        detail=detail, seed=33 if side > 0.0 else 34)
        sh.scale_course(parts, 'cutter.course.bow.up.' + tag, hull_mat,
                        l * -0.414, z_bow_s - 0.06, 0.24, 0.08,
                        sf.surf_flank(stations, 0.24), side=side,
                        detail=detail, seed=s_up)
        sh.scale_course(parts, 'cutter.course.bow.lo.' + tag, hull_mat,
                        l * -0.414, z_bow_s - 0.06, -0.24, 0.08,
                        sf.surf_flank(stations, -0.24), side=side,
                        detail=detail, seed=s_lo)
        sh.scale_course(parts, 'cutter.course.stern.up.' + tag, hull_mat,
                        z_mid_s + 0.06, l * 0.414, 0.12, 0.12,
                        sf.surf_flank(stations, 0.12), side=side,
                        detail=detail, seed=s_up + 4)
        sh.scale_course(parts, 'cutter.course.stern.lo.' + tag, hull_mat,
                        z_mid_s + 0.06, l * 0.414, -0.12, 0.12,
                        sf.surf_flank(stations, -0.12), side=side,
                        detail=detail, seed=s_lo + 4)

    # ── IVORY REGION — the forward-flank two-tone (detail 2+) ────────────
    # A REGION, not a ribbon: three stacked rows of LONG ivory plates cover
    # the forward flank from y -0.19 to +0.14 — most of the straight flank's
    # height (±0.19 at the max section) — over the bow zone and the front of
    # the mid zone. Each row is its own run, seated with sf.surf_flank at
    # its OWN height so the fine nose self-trims row by row; every run
    # splits at the bow/mid collar seam. Aft the region closes as a
    # teardrop: the mid-zone upper row tucks under the mid shell course
    # (its lower edge at y 0.12) and ends first, the lower row ends at the
    # gallery lip, and every plate tapers toward its run end. ONE hairline
    # gold line bounds the tall bow-zone top edge, dropping onto the collar.
    mz0 = l * -0.414                          # ≈ -4.554
    mz1 = l * -0.050                          # ≈ -0.550
    zb0 = z_bow_s - 0.06                      # ≈ -2.700  bow runs aft end
    zb1 = z_bow_s + 0.06                      # ≈ -2.580  mid runs fwd end
    bow_rows = (('lo', -0.120, 0.14),         # y -0.19..-0.05
                ('ce',  0.000, 0.10),         # y -0.05..+0.05
                ('up',  0.095, 0.09))         # y +0.05..+0.14, meets the line
    mid_rows = (('lo', -0.120, 0.14, gz0 - 0.06),  # stops at the gallery lip
                ('ce',  0.000, 0.10, mz1),         # carries the tractor lenses
                ('up',  0.085, 0.07, l * -0.100))  # tucks under the mid course
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for rtag, ry, rh in bow_rows:
            sh.ivory_margin(parts, 'cutter.margin.%s.a.%s' % (rtag, tag),
                            hull_mat, mz0, zb0, ry, rh,
                            sf.surf_flank(stations, ry),
                            side=side, detail=detail, rows=1, taper=0.75)
        for rtag, ry, rh, rz1 in mid_rows:
            sh.ivory_margin(parts, 'cutter.margin.%s.b.%s' % (rtag, tag),
                            hull_mat, zb1, rz1, ry, rh,
                            sf.surf_flank(stations, ry),
                            side=side, detail=detail, rows=1, taper=0.55)
        line = _margin_line(stations, side, mz0, zb0, 0.14, y1=0.13)
        if line:
            sh.gold_line(parts, 'cutter.margin.line.' + tag, hull_mat,
                         line, thick=0.022, detail=detail)

    # ── CHINE GOLD LINES — full length, both sides (detail 2+) ───────────
    # The second half of the family signature: one hairline running the
    # hull length along each chine, ends buried in the bow and stern solids.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gold_line(parts, 'cutter.chine.' + tag, hull_mat,
                     _chine_path(stations, side, l * -0.400, l * 0.400, 15),
                     thick=0.022, detail=detail)

    # ── MARKER RUNS — both flanks, absolute lamp pitch (detail 2+) ───────
    # Navigation markers at sf.LAMP_SPACING, never scaled with the ship.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.marker_run(parts, glow, 'cutter.markers.' + tag,
                      hull_mat, glow_mat, l * -0.400, l * 0.391, 0.05,
                      sf.surf_flank(stations, 0.05), side=side,
                      detail=detail)

    # ── TRACTOR LENSES — precision, flush, one per flank (detail 2+) ─────
    # Small and flush, set into the ivory forward of the capture collar,
    # aft of the open inspection seam (z span -2.55..-1.85): the lens drum
    # (z span -1.86..-1.54) stays clear of both.
    # flank_anchor with inset 0.0 puts the anchor plane ON the flank; the
    # construct sinks the bezel drum half a depth inboard of it.
    z_tr = l * -0.155                         # ≈ -1.705
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.tractor_lens(parts, glow, 'cutter.tractor.' + tag,
                        hull_mat, glow_mat,
                        (side * sf.flank_anchor(stations, z_tr, 0.0, 0.0),
                         0.0, z_tr),
                        0.16, detail=detail, face='x')

    # ── TRANSFER CHAMBERS — sealed, one per flank (detail 2+) ────────────
    # A low fair blister per flank in the mid band, aft of the gallery.
    # Seated with flank_anchor inset 0.10: only 0.07 of the block stands
    # proud of the flank (quiet, nearly flush) while 0.27 of it is buried.
    # Height 0.84 keeps the absolute TRANSFER_HATCH door AND the status
    # slit below it on the block's own face — the slit never floats.
    z_tc = l * 0.132                          # ≈ 1.452
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.transfer_chamber(parts, glow, 'cutter.chamber.' + tag,
                            hull_mat, glow_mat,
                            (side * sf.flank_anchor(stations, z_tc, 0.0, 0.10),
                             0.0, z_tc),
                            (0.34, 0.84, 1.10), detail=detail, face='x')

    # ── INSPECTION SENSOR ARRAYS — symmetrical mast pair (detail 2+) ─────
    # Thin fragile spire clusters on the deck, one per side at the same
    # station: the symmetrical inspection fit. Roots bury 0.10 below the
    # deck anchor (the construct does it); the masts are a scale cue, not
    # a mass, so height stays small.
    z_ms = l * -0.100                         # ≈ -1.100
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        ms_x = side * 0.45
        hw.mast_cluster(parts, glow, 'cutter.mast.' + tag,
                        hull_mat, glow_mat,
                        (ms_x, sf.top_y(stations, z_ms, abs(ms_x)), z_ms),
                        0.20, count=3, detail=detail)

    # ── APERTURE SEAMS — hidden threats, closed (detail 2+) ──────────────
    # One closed hairline weapon seam per stern flank, flush with the
    # shell: the customs vessel carries arms that do not show.
    z_ws = l * 0.282                          # ≈ 3.102
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.aperture_seam(parts, glow, 'cutter.aperture.weapon.' + tag,
                         hull_mat, glow_mat,
                         (side * sf.flank_anchor(stations, z_ws, 0.0, 0.0),
                          0.0, z_ws),
                         0.80, axis='z', open=0.0, detail=detail)

    # ── THE ONE ASYMMETRY — open PORT inspection seam (detail 2+) ────────
    # A single seam at the forward end of the inspection band, lips slid
    # open 0.6 with the turquoise line showing: the one open inspection
    # port on an otherwise sealed, symmetrical vessel.
    z_os = l * -0.200                         # ≈ -2.200
    sh.aperture_seam(parts, glow, 'cutter.aperture.inspect.port',
                     hull_mat, glow_mat,
                     (-sf.flank_anchor(stations, z_os, 0.16, 0.0),
                      0.16, z_os),
                     0.70, axis='z', open=0.6, detail=detail)

    # ── EDGE KEEL — ivory leading-edge blade, forward of the collar ──────
    # The faired keel edge of the leaf, ending clear of the capture-collar
    # drum (drum forward edge at z ≈ -0.98).
    sh.edge_keel(parts, 'cutter.keel', hull_mat,
                 l * -0.410, l * -0.100,
                 sf.surf_bottom(stations), half_w=0.05, detail=detail)
