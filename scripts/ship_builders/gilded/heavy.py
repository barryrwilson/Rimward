"""Gilded Chain Heavy - COLLECTION HUNTER.

Bible §4.5 heavy: "a black armoured wedge with ivory scale margins, recessed
interdiction gear, and a cold illuminated gallery running deep inside rather
than across the surface".  The family leaf hardens into a broad low blade:
the wedge read comes from a WIDER mid and sharpened forward sections
(sf.edge_section in the bow), never from steps, facets or bolted armour.
One continuous shell, needle prow in the loft.

The gallery is the hero emissive feature on this class: two long recessed
runs per flank, low in the mid band, depth 0.30 so the turquoise light
clearly lives INSIDE the hull.  Everything else that glows is kept minimal
so the whole ship stays well under the 5 % emissive-area cap.

The named §4.5 read is the IVORY REGION: per-row ivory_margin runs stacked
from the keel line to the chine across the bow zone, the upper rows
continuing across the front of the mid zone above the gallery — one
continuous teardrop, narrowing aft, bounded above by gold hairlines.  Every
row is seated with sf.surf_flank at its OWN height.

Proportion notes (wave 7 correction): the radiator vanes carry the thermal
story in CHORD (1.85 / 1.20) and COUNT (two flat pairs), not outboard reach
— span is kept short (0.80 / 0.60) so the measured len/beam is 3.42
(produced by `node scripts/measure-ships.mjs gilded`), in the family
(siblings 3.6-4.5); the previous 1.75-span pair measured 2.40 and broke
the family read.  The ventral pylons rake hard aft (tip +0.170*l from the
root) and drop 1.30, and the mast cluster is 0.60 tall, so the class keeps
its outline-breakers without the hunchback read.

Measured results (wave 7 build: `build-ship-assets.py -- gilded`,
`compress-ship-assets.mjs gilded`, `measure-ships.mjs gilded`,
`probe-ship-islands.mjs gilded heavy lod0`, `validate-ship-assets.mjs`,
`npm run test:boot` — ALL PASS):
  hull vertices    22,056   (inside the 9,000-78,000 hull band; the
                             30,000-38,000 vertex aim was not met because
                             ivory margin plates are long absolute-pitch
                             elements — the measured value stands)
  max span         16.3     (len/beam 3.42, ht/len 0.25, beam/len 0.29)
  lod0 triangles   11,656   (inside every LOD triangle cap)
  proxy cover      100 %
  islands          ONE CONNECTED BODY

Envelope from the driver: l = 17.0, b = 8.84, h = 5.78.
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

def _heavy_stations(l, b, h):
    """Hull loft stations for the collection hunter.

    Bow stations are sf.edge_section (k = 0.30) so the forward third reads
    as the bible's sharpened wedge; mid and stern stay sf.fair but at
    k = 0.50 (a broader, flatter flank than the 0.62 family default) so the
    stacked flank bands — scales / ivory / seams / gallery — all seat on
    vertical flank.

    Nose tip at l*-0.480 = -8.160; transom at l*+0.470 = +7.990.
    Bow/mid seam at l*-0.240 = -4.080; mid/stern seam at l*+0.200 = +3.400.
    Zones: bow 24.0 %, mid 44.0 %, stern 25.3 % of the lofted length.
    Max half-beam b*0.243 = 2.148 at l*-0.120; max half-height h*0.200.
    """
    return [
        # -- BOW: long needle prow run, edge-sharpened (the wedge read) --
        sf.edge_section(l * -0.480, b * 0.010, h * 0.025, 0.00),  # nose tip
        sf.edge_section(l * -0.447, b * 0.045, h * 0.085, 0.00),
        sf.edge_section(l * -0.394, b * 0.095, h * 0.130, 0.00),
        sf.edge_section(l * -0.335, b * 0.150, h * 0.163, 0.01),
        sf.edge_section(l * -0.282, b * 0.185, h * 0.180, 0.02),
        sf.edge_section(l * -0.247, b * 0.210, h * 0.190, 0.03),
        sf.edge_section(l * -0.240, b * 0.222, h * 0.194, 0.05),  # bow/mid seam

        # -- MID: broad low blade, max half-beam just aft of the seam --
        sf.fair(l * -0.120, b * 0.243, h * 0.200, 0.08, k=0.50),  # max beam
        sf.fair(l *  0.000, b * 0.240, h * 0.200, 0.10, k=0.50),
        sf.fair(l *  0.100, b * 0.230, h * 0.196, 0.09, k=0.50),
        sf.fair(l *  0.200, b * 0.212, h * 0.188, 0.07, k=0.50),  # mid/stern seam

        # -- STERN: long fair run-down to a composed transom --
        sf.fair(l *  0.300, b * 0.185, h * 0.175, 0.05, k=0.50),
        sf.fair(l *  0.385, b * 0.155, h * 0.160, 0.04, k=0.50),
        sf.fair(l *  0.470, b * 0.128, h * 0.142, 0.03, k=0.50),  # transom
    ]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Gilded Chain collection hunter (heavy class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_RECESS / ROLE_TRIM objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full  2 halved repeats, everything kept
                1 loft + collars + one course per flank + gallery wells +
                  keel + radiators + drive + pylons
                0 loft + drive only.
    """
    H = kit.ROLE_HULL

    stations = _heavy_stations(l, b, h)

    # Zone z-boundaries (absolute, world units)
    z_nose  = l * -0.480    # ≈ -8.160  needle tip
    z_bow_s = l * -0.240    # ≈ -4.080  bow / mid seam
    z_mid_s = l *  0.200    # ≈  3.400  mid / stern seam
    z_stern = l *  0.470    # ≈  7.990  transom

    # Flank band heights at the mid stations (vertical flank spans roughly
    # y -0.95 .. +1.14 there).  Every run below re-samples the half-beam at
    # its OWN station and height through an sf.surf_* callable.
    Y_CRS_HI =  0.68    # upper scale course (0.61 .. 0.75)
    Y_SEAM   = -0.08    # recessed interdiction seams (lips -0.175 .. 0.015)
    Y_GAL    = -0.35    # gallery slot centre (slot -0.46 .. -0.24)
    Y_CRS_LO = -0.60    # lower scale course (rides the lower chamfer)
    Y_MARK_S =  0.35    # stern marker run
    Y_MARK_B =  0.30    # bow marker run
    # Ivory region rows: keel line to chine in the bow zone; the upper rows
    # continue into the mid zone above the gallery, bracketing the upper
    # scale course (0.04 .. 0.56 and 0.82 .. 1.10).
    IVORY_ROW_H = 0.28
    IVORY_BOW_ROWS = (-0.66, -0.40, -0.14, 0.12, 0.38, 0.64)
    IVORY_MID_ROWS = (0.18, 0.42, 0.96)

    # ── Primary hull loft (always, detail 0+) ────────────────────────────
    kit.hull_loft(parts, 'heavy.hull', H, stations, hull_mat)

    # ── DRIVE FACE — distinct stern drive, always (§G3, engine glow stern) ─
    # Sized off sf.section at the transom station; housing half-extents at
    # 85 % of the transom section so the housing's forward 0.12+ sits inside
    # the stern (real overlap ≈ 0.48 of the depth).  Aft face stands 0.12
    # proud of the transom; the four turquoise discs are deep in the throats.
    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern), d_hw * 0.85, d_hh * 0.85,
                  nozzles=4, depth=0.60, detail=detail)

    if detail < 1:
        return

    # ── ZONE SEAM COLLARS — the family signature rings (detail 1+) ───────
    sh.collar_band(parts, 'heavy.collar.bow', hull_mat,
                   sf.collar_ring(stations, z_bow_s), z_bow_s,
                   width=0.12, ribs=8, detail=detail)
    sh.collar_band(parts, 'heavy.collar.mid', hull_mat,
                   sf.collar_ring(stations, z_mid_s), z_mid_s,
                   width=0.12, ribs=8, detail=detail)

    # ── FLANK SCALE COURSES — two per flank, zone-bounded (detail 1+) ────
    # Course 1 (upper) rides the top of the vertical flank; course 2 (lower)
    # laps over the start of the lower chamfer — its surf callable samples
    # the receded half-beam so each scale seats on the curve.  Neither run
    # crosses a zone seam: both stop short of the collar bands.
    z_c0 = z_bow_s + 0.23
    z_c1 = z_mid_s - 0.15
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.scale_course(parts, 'heavy.course.hi.' + tag, hull_mat,
                        z_c0, z_c1, Y_CRS_HI, 0.14,
                        sf.surf_flank(stations, Y_CRS_HI), side=side,
                        detail=detail, seed=21 if side > 0 else 22)
    # THE GALLERY — hero feature.  Two long recessed runs per flank, low in
    # the mid band, depth 0.30: the panes sit at the bottom of a real well,
    # 0.28 inboard of the lip plane, so the light reads from INSIDE the hull.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.gallery_slot(parts, glow, 'heavy.gallery.fwd.' + tag,
                        hull_mat, glow_mat,
                        z_bow_s + 0.38, l * -0.026, Y_GAL, 0.22,
                        sf.surf_flank(stations, Y_GAL), side=side,
                        depth=0.30, detail=detail, arch=True)
        sh.gallery_slot(parts, glow, 'heavy.gallery.aft.' + tag,
                        hull_mat, glow_mat,
                        l * 0.015, z_mid_s - 0.35, Y_GAL, 0.22,
                        sf.surf_flank(stations, Y_GAL), side=side,
                        depth=0.30, detail=detail, arch=True)

    # ── EDGE KEEL — ivory leading-edge blade, one run per zone (detail 1+) ─
    sh.edge_keel(parts, 'heavy.keel.bow', hull_mat,
                 z_nose + 0.26, z_bow_s - 0.12,
                 sf.surf_bottom(stations), half_w=0.05, detail=detail)
    sh.edge_keel(parts, 'heavy.keel.mid', hull_mat,
                 z_bow_s + 0.13, z_mid_s - 0.10,
                 sf.surf_bottom(stations), half_w=0.05, detail=detail)
    sh.edge_keel(parts, 'heavy.keel.stern', hull_mat,
                 z_mid_s + 0.10, z_stern - 0.69,
                 sf.surf_bottom(stations), half_w=0.05, detail=detail)

    # ── RADIATOR VANES — flat, empty, outline-breaking (§G3, detail 1+) ──
    # The thermal story is told by CHORD and COUNT, never by outboard reach:
    # a long span here sets the measured beam and broke the family len/beam
    # (the previous 1.75-span pair measured 2.40 against siblings 3.6-4.5).
    # The measured len/beam with the resized vanes is 3.42 (produced by
    # `node scripts/measure-ships.mjs gilded`).  Primary pair: span 0.80,
    # chord 1.85,
    # seated just aft of the mid collar; a second, smaller pair sits further
    # aft.  Both are flat, empty taper_blocks — no decoration (rule 7).
    # Seated with sf.flank_x at the vane's own height so the inboard 0.10 of
    # span buries in the stern flank (hw.radiator_vane shifts the block
    # outboard by span/2 - 0.10 from loc).
    z_rad = l * 0.280           # ≈ 4.760, stern zone, clear of the mid collar
    y_rad = 0.15
    x_rad = sf.flank_x(stations, z_rad, y_rad)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_vane(parts, 'heavy.radiator.' + tag, hull_mat,
                         (side * x_rad, y_rad, z_rad),
                         0.80, 1.85, thick=0.07, sweep=0.30,
                         detail=detail, side=side)
    z_rad2 = l * 0.360          # ≈ 6.120, second smaller pair further aft
    y_rad2 = 0.12
    x_rad2 = sf.flank_x(stations, z_rad2, y_rad2)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_vane(parts, 'heavy.radiator.aft.' + tag, hull_mat,
                         (side * x_rad2, y_rad2, z_rad2),
                         0.60, 1.20, thick=0.07, sweep=0.30,
                         detail=detail, side=side)

    # ── VENTRAL PYLONS — the outline-breaker pair (detail 1+) ────────────
    # Chord 2.90 = 17 % of l; the raked silhouette runs from the root
    # leading edge at z ≈ -0.55 to the tip trailing edge at z ≈ 4.37, so the
    # blade measures ≈ 4.92 = 29 % of l (>= 15 % silhouette gate).  The tip
    # sits 0.170*l ≈ 2.89 AFT of the root — a real sweep, not a rectangular
    # drop plate — and the drop is 1.30, so the blade reads as a raked fin
    # and the class height stays a low crescent.  Roots are INSIDE the hull:
    # root y is 0.15 above the keel plane at the root station, and the whole
    # root chord lies above the local keel — the burial is the connectivity.
    z_proot = l * 0.053         # ≈ 0.901, mid zone
    x_proot = b * 0.081         # ≈ 0.716, on the flat belly
    y_proot = sf.bottom_y(stations, z_proot, x_proot) + 0.15
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.ventral_pylon(parts, glow, 'heavy.pylon.' + tag, hull_mat, glow_mat,
                         (side * x_proot, y_proot, z_proot),
                         (side * (x_proot + 0.26), y_proot - 1.30,
                          z_proot + l * 0.170),
                         2.90, 0.11, detail=detail, glow_edge=True)

    if detail < 2:
        return

    # ── DORSAL SCALE FIELD — the near-black ceramic shell (detail 2+) ────
    # One field per zone so no course crosses a seam; each self-trims to the
    # sheer through sf.surf_top / sf.surf_flat.  Courses at ~0.24-0.30 world
    # width, fore-aft pitch the absolute _SCALE_PITCH — repetition at
    # constant human pitch, never scaled with the ship.
    sh.scale_field(parts, 'heavy.shell.bow', hull_mat,
                   z_nose + 0.36, z_bow_s - 0.17,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   5, detail=detail, seed=31)
    sh.scale_field(parts, 'heavy.shell.mid', hull_mat,
                   z_bow_s + 0.23, z_mid_s - 0.15,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   13, detail=detail, seed=32)
    sh.scale_field(parts, 'heavy.shell.stern', hull_mat,
                   z_mid_s + 0.15, z_stern - 0.85,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   10, detail=detail, seed=33)

    # ── IVORY REGION — the class's named §4.5 read (detail 2+) ───────────
    # A real two-tone REGION, not a ribbon: rows stacked from the keel line
    # to the chine across the bow zone (IVORY_BOW_ROWS, band -0.80 .. 0.78),
    # the upper rows continuing across the front of the mid zone above the
    # gallery (IVORY_MID_ROWS, bands 0.04 .. 0.56 and 0.82 .. 1.10, clear of
    # the gallery slot, the seam lips and the raised upper course).  The two
    # zones read as one continuous teardrop under the collar ring, narrowing
    # aft; taper draws each row down toward its aft end.  Every row is its
    # own ivory_margin call (rows=1) seated with sf.surf_flank at that row's
    # OWN height, so the top and bottom rows follow the chamfer fall-off and
    # every plate re-samples the surface at its own station.  Split at the
    # bow/mid seam so no plating run crosses the collar.
    z_ib0, z_ib1 = l * -0.385, z_bow_s - 0.22
    z_im0, z_im1 = z_bow_s + 0.23, l * 0.053
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for ri, ry in enumerate(IVORY_BOW_ROWS):
            sh.ivory_margin(parts, 'heavy.margin.bow%d.%s' % (ri, tag),
                            hull_mat, z_ib0, z_ib1, ry, IVORY_ROW_H,
                            sf.surf_flank(stations, ry), side=side,
                            detail=detail, rows=1, taper=0.90)
        for ri, ry in enumerate(IVORY_MID_ROWS):
            sh.ivory_margin(parts, 'heavy.margin.mid%d.%s' % (ri, tag),
                            hull_mat, z_im0, z_im1, ry, IVORY_ROW_H,
                            sf.surf_flank(stations, ry), side=side,
                            detail=detail, rows=1, taper=0.80)

    # Lower flank course — second course per flank (detail 2+; at detail 1
    # the single upper course carries the scale read).
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.scale_course(parts, 'heavy.course.lo.' + tag, hull_mat,
                        z_c0, z_c1, Y_CRS_LO, 0.14,
                        sf.surf_flank(stations, Y_CRS_LO), side=side,
                        detail=detail, seed=23 if side > 0 else 24)

    # Stern course — continues the upper course line into the stern zone as
    # its own zone-bounded run (no run crosses a collar), so the bare stern
    # flank carries the same scale read above the radiator vanes.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        sh.scale_course(parts, 'heavy.course.stern.' + tag, hull_mat,
                        z_mid_s + 0.23, z_stern - 0.94, Y_CRS_HI, 0.14,
                        sf.surf_flank(stations, Y_CRS_HI), side=side,
                        detail=detail, seed=25 if side > 0 else 26)

    # ── GOLD HAIRLINES — chine lines + margin bounds (detail 2+) ─────────
    # The chine line runs the hull length along the top-of-flank corner on
    # each side; both ends are pulled inboard into the tapering sections.
    # Struts are sub-voxel to the island probe; the inboard pull is for
    # physical seating, not connectivity.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        path = []
        n_s = 30
        for i in range(n_s + 1):
            z = (z_nose + 0.30) + (z_stern - 0.55 - z_nose) * i / n_s
            st = sf.straight_top(stations, z)
            fx = sf.flank_x(stations, z, st)
            if fx <= 0.05:
                continue
            path.append((side * fx, st + 0.02, z))
        if len(path) >= 2:
            x0, y0, z0 = path[0]
            x1, y1, z1 = path[-1]
            path[0] = (x0 * 0.55, y0, z0)       # buried in the needle
            path[-1] = (x1 * 0.60, y1, z1)      # buried in the transom taper
            sh.gold_line(parts, 'heavy.chine.' + tag, hull_mat, path,
                         thick=0.022, detail=detail)

    # Ivory region bound lines: hairline gold along the region edges — the
    # teardrop's upper bound in both zones, plus the lower bound in the bow
    # where the flank below is clear.  The bow top bound starts at l*-0.335
    # (aft of the region nose) so it never runs coplanar with the chine line
    # where the forward sections pinch; the top mid row (top edge 1.10) is
    # bounded above by the chine hairline itself (~1.15).  Ends pulled 0.15
    # inboard of the flank so the hairline ends bury in the shell.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for z0, z1, yb, run in (
                (l * -0.335, z_bow_s - 0.22,  0.79, 'bowtop'),
                (l * -0.385, z_bow_s - 0.22, -0.81, 'bowlow'),
                (z_bow_s + 0.23, l * 0.053,   0.57, 'midtop')):
            path = []
            n_s = max(2, int((z1 - z0) / 0.40))
            for i in range(n_s + 1):
                z = z0 + (z1 - z0) * i / n_s
                fx = sf.flank_x(stations, z, yb)
                if fx <= 0.05:
                    continue
                path.append((side * (fx + 0.01), yb, z))
            if len(path) >= 2:
                x0, y0, z0p = path[0]
                x1, y1, z1p = path[-1]
                path[0] = (x0 - side * 0.15, y0, z0p)
                path[-1] = (x1 - side * 0.15, y1, z1p)
                sh.gold_line(parts, 'heavy.margin.%s.%s' % (run, tag),
                             hull_mat, path, thick=0.022, detail=detail)

    # ── RECESSED INTERDICTION GEAR — hidden weapons (detail 2+) ──────────
    # Five closed hairline seams flush with the shell in the mid band, plus
    # two smooth tractor lenses recessed on the flanks.  THE ASYMMETRY: the
    # after starboard seam stands open=0.6 — one aperture caught in use —
    # and starboard carries the third seam.  All others are open=0.0 and
    # emit no light at all.
    seam_specs = [
        (-1.0, l * -0.168, 1.60, 0.0, 'port.fwd'),
        (-1.0, l * -0.044, 1.60, 0.0, 'port.aft'),
        ( 1.0, l * -0.168, 1.60, 0.0, 'stbd.fwd'),
        ( 1.0, l * -0.044, 1.60, 0.0, 'stbd.mid'),
        ( 1.0, l *  0.088, 1.40, 0.6, 'stbd.aft'),   # the one open aperture
    ]
    for side, zs, slen, sopen, tag in seam_specs:
        sx = sf.flank_anchor(stations, zs, Y_SEAM, 0.02)
        sh.aperture_seam(parts, glow, 'heavy.seam.' + tag, hull_mat, glow_mat,
                         (side * sx, Y_SEAM, zs), slen, axis='z',
                         open=sopen, detail=detail)

    # Tractor lenses: smooth quiet apertures, bezels sunk half a depth into
    # the flank at their own station (sf.flank_x at the lens height).
    z_lens = l * 0.156          # ≈ 2.652, clear of seams and the stern seam
    y_lens = 0.18
    x_lens = sf.flank_x(stations, z_lens, y_lens)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.tractor_lens(parts, glow, 'heavy.tractor.' + tag, hull_mat, glow_mat,
                        (side * x_lens, y_lens, z_lens), 0.30,
                        detail=detail, face='x')

    # ── MARKER RUNS — navigation lamps at absolute pitch (detail 2+) ─────
    # Stern run sits above the radiator vane chord line; bow run rides the
    # forward straight flank.  Both re-sample per lamp through surf callables.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.marker_run(parts, glow, 'heavy.markers.stern.' + tag,
                      hull_mat, glow_mat,
                      z_mid_s + 0.30, z_stern - 1.09, Y_MARK_S,
                      sf.surf_flank(stations, Y_MARK_S), side=side,
                      detail=detail)
        hw.marker_run(parts, glow, 'heavy.markers.bow.' + tag,
                      hull_mat, glow_mat,
                      z_nose + 0.46, l * -0.359, Y_MARK_B,
                      sf.surf_flank(stations, Y_MARK_B), side=side,
                      detail=detail)

    # ── MAST CLUSTER — thin fragile spires aft of the bow seam (detail 2+) ─
    # Height 0.60: the spires stay the only vertical accent on the low hull
    # without stacking a hunchback silhouette on top of the pylon drop.
    z_mast = l * -0.209         # ≈ -3.553, just aft of the bow collar
    hw.mast_cluster(parts, glow, 'heavy.mast', hull_mat, glow_mat,
                    (0.0, sf.top_y(stations, z_mast, 0.0), z_mast),
                    0.60, count=3, detail=detail)
