"""Gilded Chain Ace — ACQUISITION DUELIST.

Bible §4.5: "a thin crescent or predatory leaf with tightly overlapped
ceramic scales, swept gold control spines, and weapon apertures visible
only as hairline seams". The ace is the thinnest, most extreme crescent in
the fleet — a true blade. It is slightly LONGER than the light (measured
max span 7.3 against the light's 7.2): the body is thinner, and the
surface read comes from pitch and count, never from mass.

Body plan
---------
One continuous faired volume; the needle prow is grown from the loft as a
long fine station run (never a bolted spike). The sheer is a CRESCENT:
y_offset rises toward the bow (+0.062 h at the tip) and drops at the stern
(-0.045 h at the transom), so the profile smiles instead of lying straight.
The first three stations are sf.edge_section (a knife cross-section for the
prow); the body is sf.fair (the Chain's near-oval default).

Station z fractions (of l): -0.475 needle tip, -0.440, -0.395, -0.340,
-0.260 bow/mid seam, -0.120 max half-beam, 0.000, +0.100, +0.200 mid/stern
seam, +0.300, +0.430, +0.520 transom. The stern stations were moved aft
to l * +0.430 and l * +0.520 in the pylon-fix round, so the loft — not a
raked pylon tip — sets the measured span.

Zone split (of the 7.16-unit loft, 0.995 l): bow 22 %, mid 46 %, stern 32 %, with a
gold sh.collar_band on a sf.collar_ring at both seams. No course crosses a
seam: the dorsal scale field is three runs (bow / mid / stern), the ivory
region is six runs split at the bow seam, and the keel blade is three runs.

Surface read
------------
Tightly overlapped scales: SMALL scale heights (0.10 upper flank, 0.09
lower flank) and MORE courses (12 across the mid deck, 9 bow and stern,
two per flank at lod0) at the constant absolute pitch — order, not jitter.
The ivory two-tone is a REGION, not a ribbon: six runs per side from
l * -0.360 to l * -0.042 (bow zone through the front of the mid zone),
three rows stacking from the keel chamfer to just under the upper flank
course — most of the flank's height. Each row seats with sf.surf_flank at
its own height; taper swells the region out of the prow and pinches it
aft, and the last run is the centre row alone, so it closes to a point:
one continuous teardrop, ~16 % of the broadside flank area, bounded above
by a hairline gold line that follows the top edge. Dorsal and stern stay
near-black. One full-length gold chine line per side rides the flat-deck
edge; three swept gold control spines per side start buried in the deck,
sweep outboard over the scale shell and end buried in the flank —
hairlines, the class signature ornament. This class tells no thermal
story: no radiator vanes.

Emissive budget (<= 5 % of hull area): two gallery slots (one per flank,
low, running most of the mid band, ~7 panes each), two drive discs at the
stern, the ONE open aperture line, two pylon tip lines. Nothing else glows;
no edge-lighting anywhere.

Outline-breaker: the swept ventral pylon pair. Root inside the belly at
z = +0.076 l; the tip sits 0.35 chord aft of its root (z = +0.139 l), so
the pair reads as a swept delta rather than a whisker, and its chord
(0.18 l) carries the >= 15 % outline share by itself. The loft sets the
measured span: the transom at l * +0.520 is the aft extreme, and the
measured max span is 7.3 — just above the light's 7.2.

Asymmetry: exactly one open aperture — the SECOND seam on the STARBOARD
flank runs open = 0.6; every other weapon seam on both flanks is a closed
hairline. That single lit seam is the only place a threat shows.

Detail ladder
-------------
3  full build (two flank courses per side, all counts at absolute pitch)
2  one flank course per side; fields, panes and seams thinned by the
   constructs (half counts); the ivory region keeps all rows and plates
   (one plate per run row at every pitch level); gold and collars kept
1  loft + collars + one course per flank + gallery wells + drive + pylons
   + keel blade
0  loft + drive only

Measured (blender -b -P scripts/build-ship-assets.py -- gilded, then
node scripts/compress-ship-assets.mjs gilded, node scripts/measure-ships.mjs
gilded and node scripts/probe-ship-islands.mjs gilded ace lod0): 12 288 hull
vertices — inside the 4 000-21 000 band; max span 7.3; len/beam 4.33,
ht/len 0.13, beam/len 0.23; 6 572 triangles at lod0, under every LOD
triangle cap (60 000 / 24 000 / 8 000 / 4 000); proxy cover 100 %; ONE
CONNECTED BODY. node scripts/validate-ship-assets.mjs and npm run test:boot
pass with gildedSpan, gildedProportion, gildedPivot, gildedProxyCover and
gildedClassOrdering all true. The ivory region costs ~+300 verts / ~+450
tris over the old two-run ribbon: no course counts were traded for it.
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

def _ace_stations(l, b, h):
    """Hull loft stations for the acquisition duelist.

    Crescent sheer: y_offset climbs to +0.062 h at the needle tip, falls
    through +0.017 h at the max-beam station and drops to -0.045 h at the
    transom. Max half-beam is b * 0.270 at l * -0.120; max half-height is
    h * 0.205 there — the lowest hull in the fleet. The prow run is
    edge_section (knife section); the body is fair (near-oval).
    """
    return [
        # -- BOW: the needle prow, lifted on the crescent --
        sf.edge_section(l * -0.475, b * 0.006, h * 0.022, h *  0.062),  # tip
        sf.edge_section(l * -0.440, b * 0.048, h * 0.080, h *  0.056),
        sf.edge_section(l * -0.395, b * 0.110, h * 0.135, h *  0.047),
        sf.fair(        l * -0.340, b * 0.178, h * 0.178, h *  0.038),
        sf.fair(        l * -0.260, b * 0.240, h * 0.200, h *  0.028),  # bow/mid seam

        # -- MID: max beam, low and calm --
        sf.fair(        l * -0.120, b * 0.270, h * 0.205, h *  0.017),  # max half-beam
        sf.fair(        l *  0.000, b * 0.268, h * 0.200, h *  0.007),
        sf.fair(        l *  0.100, b * 0.250, h * 0.190, h * -0.003),
        sf.fair(        l *  0.200, b * 0.225, h * 0.180, h * -0.014),  # mid/stern seam

        # -- STERN: the crescent drops, tapering to the transom --
        sf.fair(        l *  0.300, b * 0.185, h * 0.160, h * -0.028),
        sf.fair(        l *  0.430, b * 0.150, h * 0.140, h * -0.038),
        sf.fair(        l *  0.520, b * 0.115, h * 0.120, h * -0.045),  # transom
    ]


# ===========================================================================
# GOLD HAIRLINE PATHS — every point computed from a surface query
# ===========================================================================

def _chine_path(stations, side, z0, z1):
    """Full-length chine line: rides the flat-deck edge, both ends buried.

    The path runs just outboard of the flat deck on the chamfer corner, a
    hair under the surface so the hairline half-sinks into the shell edge;
    the scale field self-trims to surf_flat and never covers it. End points
    drop 0.13 below the deck INSIDE the solid section (>= 0.10 burial).
    """
    pts = [(side * sf.flat_half(stations, z0) * 0.55,
            sf.top_y(stations, z0, 0.0) - 0.13, z0)]
    for i in range(8):
        z = z0 + (z1 - z0) * i / 7.0
        x = sf.flat_half(stations, z) + 0.02
        pts.append((side * x, sf.top_y(stations, z, x) - 0.01, z))
    pts.append((side * sf.flat_half(stations, z1) * 0.55,
                sf.top_y(stations, z1, 0.0) - 0.13, z1))
    return pts


def _margin_line(stations, side, segs):
    """Gold bound above the ivory region: rides the region's top edge.

    segs -- the ivory run table (z0, z1, top-row centre y, row height,
    taper); the line samples each run's top edge, so the bound follows the
    teardrop as the taper pinches it — including the step down to the
    single-row tail. Surface points sit 0.015 proud of the flank at the
    local top edge: the 0.022-radius line sinks into the ivory face (proud
    0.02) and reads as the region's gold bound. End points step 0.14
    inboard, inside the solid hull behind the ivory plates.
    """
    def _top(seg, z):
        z0, z1, yc, rowh, taper = seg
        f = 1.0 + (taper - 1.0) * ((z - z0) / (z1 - z0))
        return yc + 0.5 * rowh * f

    pts = []
    for si, seg in enumerate(segs):
        z0, z1 = seg[0], seg[1]
        for t in ((0.0, 0.5, 1.0) if si == len(segs) - 1 else (0.0, 0.5)):
            z = z0 + (z1 - z0) * t
            y = _top(seg, z)
            fx = sf.flank_x(stations, z, y)
            if fx <= 0.0:
                continue
            pts.append((side * (fx + 0.015), y, z))
    if len(pts) < 2:
        return pts
    x0, y0, z0 = pts[0]
    pts.insert(0, (side * (abs(x0) - 0.155), y0, z0))
    x1, y1, z1 = pts[-1]
    pts.append((side * (abs(x1) - 0.155), y1, z1))
    return pts


def _spine_path(stations, side, z0, z1):
    """One swept gold control spine: deck-buried root to flank-buried tip.

    Starts 0.15 below the deck near the centreline, sweeps outboard and aft
    over the scale shell (riding 0.05 above the deck; the scales step
    outboard on a 3-scale cycle at shell._SCALE_STEP 0.022, so a course
    reads as lapped strakes instead of one flat shelf), then dives to the
    straight flank and ends 0.14 inside it.
    """
    y_end = sf.straight_top(stations, z1) - 0.03
    fx_end = sf.flank_x(stations, z1, y_end)
    pts = [(side * 0.06, sf.top_y(stations, z0, 0.06) - 0.15, z0)]
    for t in (0.18, 0.40, 0.62, 0.84):
        z = z0 + (z1 - z0) * t
        x = side * (0.06 + (fx_end - 0.06) * (t ** 1.7))
        pts.append((x, sf.top_y(stations, z, abs(x)) + 0.05, z))
    pts.append((side * fx_end, y_end + 0.03, z1))
    pts.append((side * (fx_end - 0.14), y_end, z1 + 0.03))
    return pts


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Gilded Chain acquisition duelist (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (7.2, 2.88, 1.44).
    detail   -- 3 full  2 thinned counts, one flank course  1 primaries,
                collars, one course, wells, drive, pylons, keel  0 loft+drive.
    """
    stations = _ace_stations(l, b, h)

    # Zone z-boundaries (absolute, in world units)
    z_nose  = l * -0.475    # needle tip
    z_bow_s = l * -0.260    # bow / mid seam
    z_mid_s = l *  0.200    # mid / stern seam
    z_stern = l *  0.520    # transom — stretched aft in the pylon fix round so
                            # the loft, not a raked pylon tip, sets the span

    # ── Primary hull loft (always, detail 0+) ────────────────────────────
    kit.hull_loft(parts, 'ace.hull', kit.ROLE_HULL, stations, hull_mat)

    # ── DRIVE FACE (always, detail 0+) ───────────────────────────────────
    # loc is the transom station: the housing's forward 0.12+ buries in the
    # hull, the nozzle face stands 0.12 aft of the transom. 2 nozzles — the
    # duelist's countable pair. Glow sits at the stern, as the gate demands.
    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'ace.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern), d_hw * 0.80, d_hh * 0.80,
                  nozzles=2, depth=0.42, detail=detail)

    if detail < 1:
        return

    # ── ZONE SEAM COLLARS (detail 1+) — the family signature pair ────────
    sh.collar_band(parts, 'ace.collar.bow', hull_mat,
                   sf.collar_ring(stations, z_bow_s), z_bow_s,
                   width=0.10, ribs=8, detail=detail)
    sh.collar_band(parts, 'ace.collar.mid', hull_mat,
                   sf.collar_ring(stations, z_mid_s), z_mid_s,
                   width=0.10, ribs=8, detail=detail)

    # ── FLANK SCALE COURSES — upper shoulder (detail 1+), lower bilge (3) ─
    # Both seat with sf.surf_flank at their own height and self-trim where
    # the chamfer falls away. Small heights + absolute pitch = the tightly
    # overlapped read. z run stays inside the mid zone — no seam crossing.
    z_c0, z_c1 = l * -0.118, l * 0.189          # -0.850 .. 1.361
    y_up = h * 0.132                            # upper shoulder, on the chamfer
    y_lo = h * -0.139                           # lower bilge, on the chamfer
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.scale_course(parts, 'ace.course.up.' + tag, hull_mat,
                        z_c0, z_c1, y_up, 0.10,
                        sf.surf_flank(stations, y_up), side=side,
                        detail=detail, seed=31 if side > 0.0 else 32)
        if detail >= 3:
            sh.scale_course(parts, 'ace.course.lo.' + tag, hull_mat,
                            z_c0, z_c1, y_lo, 0.09,
                            sf.surf_flank(stations, y_lo), side=side,
                            detail=detail, seed=33 if side > 0.0 else 34)

    # ── GALLERY SLOTS (detail 1+) — the faction's light, low on the flank ─
    # One long slot per flank, running most of the mid band. surf re-samples
    # the flank per wall segment, pane and end cap; the run self-trims.
    z_g0, z_g1 = l * -0.236, l * 0.181          # -1.699 .. 1.303
    y_gal = h * -0.014                          # slot centre just below mid-flank
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gallery_slot(parts, glow, 'ace.gallery.' + tag, hull_mat, glow_mat,
                        z_g0, z_g1, y_gal, 0.13,
                        sf.surf_flank(stations, y_gal), side=side,
                        detail=detail)

    # ── EDGE KEEL (detail 1+) — the ivory blade that makes the crescent ──
    # Three runs, split at the seams so no course crosses a zone boundary.
    surf_keel = sf.surf_bottom(stations)
    sh.edge_keel(parts, 'ace.keel.bow', hull_mat,
                 l * -0.360, z_bow_s - 0.01, surf_keel, detail=detail)
    sh.edge_keel(parts, 'ace.keel.mid', hull_mat,
                 z_bow_s + 0.01, z_mid_s - 0.01, surf_keel, detail=detail)
    sh.edge_keel(parts, 'ace.keel.stern', hull_mat,
                 z_mid_s + 0.01, l * 0.500, surf_keel, detail=detail)

    # ── VENTRAL PYLON PAIR (detail 1+) — the outline-breaker ─────────────
    # Root is INSIDE the hull (0.15 above the keel query) and passed as
    # given. The tip used to sit at l*0.539, well past the transom, which made
    # the blade 4.05 long — 56 % of the hull tapering to a 40 % tip chord, and
    # the Models Browser read it as a whisker rather than a fin. The tip now
    # sits 0.35 chord aft of the root, so the pair reads as a swept delta; its
    # chord (0.18 l) carries the >= 15 % outline share by itself, and the
    # transom station below was moved aft to keep the measured span above the
    # light's 7.2 now that the pylon no longer sets it.
    py_rz = l * 0.076
    py_ry = sf.bottom_y(stations, py_rz, 0.0) + 0.15
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.ventral_pylon(parts, glow, 'ace.pylon.' + tag, hull_mat, glow_mat,
                         (side * b * 0.097, py_ry, py_rz),
                         (side * b * 0.146, h * -0.382,
                          py_rz + l * 0.18 * 0.35),
                         l * 0.18, 0.09, detail=detail)

    if detail < 2:
        return

    # ── DORSAL SCALE FIELDS (detail 2+) — one run per zone ───────────────
    # 12 courses across the mid deck, 9 on the bow and stern runs: more,
    # tighter courses at the absolute pitch. surf_y / surf_half re-sample
    # per scale; the field self-trims to the sheer.
    sh.scale_field(parts, 'ace.field.bow', hull_mat,
                   l * -0.458, z_bow_s - 0.02,
                   sf.surf_top(stations), sf.surf_flat(stations), 9,
                   detail=detail, seed=21)
    sh.scale_field(parts, 'ace.field.mid', hull_mat,
                   z_bow_s + 0.02, z_mid_s - 0.02,
                   sf.surf_top(stations), sf.surf_flat(stations), 12,
                   detail=detail, seed=22)
    sh.scale_field(parts, 'ace.field.stern', hull_mat,
                   z_mid_s + 0.02, l * 0.431,
                   sf.surf_top(stations), sf.surf_flat(stations), 9,
                   detail=detail, seed=23)

    # ── IVORY REGION (detail 2+) — the forward-flank two-tone ────────────
    # The charter's loudest feature: ONE large ivory region covering most of
    # the forward flank's HEIGHT, from the bow zone through the front of the
    # mid zone, closing to a teardrop point aft. Six runs per side; every
    # run stays inside its zone (the bow/mid split sits at the bow-seam
    # collar) and the 0.05 plate lap at each joint keeps the region
    # continuous. Every ROW is its own ivory_margin call (rows=1) so each
    # row seats with sf.surf_flank at its OWN height; three rows stack from
    # just above the keel chamfer to just under the upper scale course.
    # taper swells the bow runs out of the prow and pinches the last runs
    # aft; the final run is the centre row alone, so the region closes to a
    # point — the teardrop. Where the upper flank course runs (z >=
    # l * -0.118) the ivory top edge stays <= 0.13, clear of the course
    # bottom edge 0.14 and its chamfer-inboard seat — no shared face plane.
    # Area: ~0.48 sq units per side against a ~3.0 sq-unit broadside flank —
    # the ivory reads as ~16 % of the visible flank. 32 plates per ship
    # (256 verts / 384 tris), replacing the old 4-plate ribbon.
    # (tag, z0, z1, band centre y, band height, taper)
    ivory_runs = (
        ('prow', l * -0.360, l * -0.310,  0.055, 0.20, 1.15),
        ('bow',  l * -0.310, z_bow_s - 0.02, 0.030, 0.24, 1.05),
        ('mid',  z_bow_s + 0.02, l * -0.188, 0.0,  0.26, 1.00),
        ('midb', l * -0.188, l * -0.118,  0.0,  0.26, 0.90),
        ('tail', l * -0.118, l * -0.085,  0.0,  0.26, 0.85),
        ('tip',  l * -0.085, l * -0.042,  0.0,  0.087, 0.55),
    )
    ivory_rows = 3
    ivory_segs = []                             # top-edge table for the gold bound
    for rtag, rz0, rz1, ry, rh, rtaper in ivory_runs:
        r_eff = ivory_rows if rh > 0.20 else 1
        rowh = rh / r_eff
        ivory_segs.append((rz0, rz1, ry - rh * 0.5 + (r_eff - 0.5) * rowh,
                           rowh, rtaper))
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for (rtag, rz0, rz1, ry, rh, rtaper), (_s0, _s1, ry_top, rowh, _t) \
                in zip(ivory_runs, ivory_segs):
            r_eff = ivory_rows if rh > 0.20 else 1
            for ri in range(r_eff):
                ry_i = ry_top - (r_eff - 1 - ri) * rowh
                sh.ivory_margin(parts,
                                'ace.ivory.%s.r%d.%s' % (rtag, ri, tag),
                                hull_mat, rz0, rz1, ry_i, rowh,
                                sf.surf_flank(stations, ry_i), side=side,
                                detail=detail, rows=1, taper=rtaper)

    # ── GOLD HAIRLINES (detail 2+) — bound, chine pair, control spines ───
    # All hairline (0.022), all paths computed from surface queries with
    # both ends buried >= 0.10. The margin bound is the ONLY gold added this
    # round: it is the charter-mandated hairline above the ivory region, so
    # it must run the region's full length and follow its top edge — it
    # REPLACES the old shorter margin line (net +4 struts per side). The
    # spines are the class signature: three per side, swept aft-outboard
    # from a deck-buried root to a flank-buried tip, untouched. NOT
    # radiator vanes — the duelist has no thermal story.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gold_line(parts, 'ace.gold.margin.' + tag, hull_mat,
                     _margin_line(stations, side, ivory_segs),
                     detail=detail)
        sh.gold_line(parts, 'ace.gold.chine.' + tag, hull_mat,
                     _chine_path(stations, side, l * -0.361, l * 0.389),
                     detail=detail)
        for si in range(3):
            z_s0 = l * (-0.215 + si * 0.069)    # -1.548, -1.051, -0.554
            z_s1 = z_s0 + l * 0.257             # +1.85 run, ends <= +0.80 l
            sh.gold_line(parts, 'ace.gold.spine.%s%d' % (tag, si), hull_mat,
                         _spine_path(stations, side, z_s0, z_s1),
                         detail=detail)

    # ── WEAPON APERTURES (detail 2+) — hairline seams, threats hidden ────
    # Four seams per flank inside the mid band, seated with sf.flank_anchor:
    # inset 0.0 puts the seam face 0.02 proud of the bare flank (the flush
    # read); the ivory region now runs to l * -0.042, so the FIRST TWO seams
    # sit on the ivory — inset -0.02 lifts them flush with the ivory face
    # (proud 0.02) instead of sinking them under it. EXACTLY ONE runs open:
    # the second seam, STARBOARD only, open = 0.6 — the class's deliberate
    # asymmetry. Its centre (z = l * -0.086) stays on the 3-row ivory band;
    # its aft end crosses the pinching tail onto bare ceramic, where it
    # stands a hair proud — the lit slit reads as it leaves the teardrop.
    y_seam = h * 0.069
    seam_z = (l * -0.222, l * -0.086, l * 0.014, l * 0.108)
    for si, sz in enumerate(seam_z):
        inset = -0.02 if sz < l * -0.050 else 0.0   # first two seams on ivory
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            ax = sf.flank_anchor(stations, sz, y_seam, inset)
            if ax == 0.0:
                continue
            open_f = 0.6 if (side > 0.0 and si == 1) else 0.0
            sh.aperture_seam(parts, glow,
                             'ace.seam.%s%d' % (tag, si), hull_mat, glow_mat,
                             (side * ax, y_seam, sz), 0.70, axis='z',
                             open=open_f, detail=detail)
