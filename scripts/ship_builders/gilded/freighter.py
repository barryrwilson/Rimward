"""Gilded Chain Freighter - CATALOG ARK.

Bible 4.5: "a huge, immaculate acquisition carrier composed of several
sealed vault/gallery bodies beneath one flowing scale shell. Multiple
transfer salons and tug points establish scale. It never enters a station;
the station connects to it through controlled bridges."

Body plan: ONE flowing faired shell (the loft) over FIVE sealed vault bodies
(hardware.vault_body) hung beneath it in the mid band, each lapped 0.35 into
the shell so the ship is one body. The vaults are the calm 55-80 %: a hairline
gold seam ring each and nothing else. The shell carries the ordered scale
skin; it is never "a spine with boxes" — the vaults read as being UNDER one
continuous volume.

Three zones with gold collar bands at both seams (measured spanZ 76.6):
  BOW   23 %  z -39.10 -> -21.25  long needle prow run in the loft; THE
                                  IVORY REGION starts here (z -33.0): one
                                  stepped teardrop both flanks, full flank
                                  height keel-line to chine across the bow
                                  zone, bounded above by a gold hairline;
                                  bow dorsal scale field; bow gallery run
                                  (C) dropped to the lower chamfer below
                                  the ivory.
  MID   50 %  z -21.25 -> +17.00  max beam b*0.20 half; five vault bodies
                                  beneath the shell; the ivory region
                                  crosses the collar at full height over
                                  the mid front and pinches to its
                                  teardrop tip at z +3.8; THREE swept
                                  ventral pylon pairs (chord l*0.153);
                                  long gallery run (A) both flanks; the
                                  OPEN BAY on STARBOARD only (the one
                                  asymmetry) with a nested docked_leaf and
                                  eight CARGO_CRATE containers; three
                                  capture-collar tug points at the fleet
                                  bore.
  STERN 27 %  z +17.00 -> +37.40  four transfer salons at human scale on the
                                  flanks; three radiator vane pairs breaking
                                  the outline; stern dorsal field; gallery
                                  run (B); 8-nozzle drive face at the
                                  transom.

Silhouette family: BLADE / CRESCENT / LEAF — extremely long, LOW, one
  continuous faired volume, needle prow. MEASURED (measure-ships gilded):
  len/beam 4.04, ht/len 0.13, beam/len 0.25.
Construction logic: CLOSED SHELL, ORNAMENT — one continuous curve, edge-only
  precious trim, long thin light lines. No exposed frame, no bolted-on
  masses, no greeble, no dirt.
Outline-breaker: the swept ventral pylon set — chord 13.0 = 17 % of hull
  length each, the set spanning z -20.5..+16.6 in silhouette.

Detail ladder (this class has FOUR). MEASURED lod0 (detail 3) is 50,348
  triangles against the hard 60,000 cap — 9,652 of headroom — produced by
  build-ship-assets.py + compress-ship-assets.mjs + measure-ships.mjs gilded;
  lod1, lod2 and lod3 pass validate-ship-assets inside their 24,000 / 8,000 /
  4,000 caps. The ladder contents:
  3  full — every run at absolute pitch, three dorsal fields, the full
     ivory region (66 plates a flank in 12 row-runs), three gallery runs,
     masts, full markers.
  2  bow/stern dorsal fields dropped, gallery
     runs B and C dropped, masts dropped, marker runs shortened, the ivory
     region merged to half its rows and plates, every remaining repeated
     construct halved by its own internal ladder.
  1  loft + collars + one scale course per flank +
     vaults + gallery A wells + drive + radiators + pylons + the open bay.
  0  loft + vaults + drive face only; still reads as
     the ark: one long shell over sealed vault bodies, glow at the stern.

Extent budget (driver envelope l=85.0, b=46.75, h=25.5):
  z  min = -39.10 (needle nose)   max = +37.52 (drive housing back face)
     spanZ = 76.62  (band 66.00-109.20; frigate ~33.5 — the fleet looks
     wrong beside it, section G7)
  x  half-beam 9.35 at mid (b*0.20); radiator tips +-9.13
     spanX = 18.77  (hull + scale proud is the widest line)
  y  pylon tips -6.38 -> aft mast tip +3.82   spanY = 10.20
  spanZ/spanX = 4.08 >= 1.15   spanX/spanZ = 0.245 >= 0.16
  spanY/spanZ = 0.133 <= 0.60  (family ht/len <= 0.16 holds)
  MEASURED on the built mesh (measure-ships gilded): max span 76.6,
  len/beam 4.04, beam/len 0.25, ht/len 0.13 — every family gate holds.

Measured pipeline (authoritative; produced by build-ship-assets.py -- gilded,
compress-ship-assets.mjs gilded, measure-ships.mjs gilded,
probe-ship-islands.mjs gilded freighter lod0, validate-ship-assets.mjs):
  hull vertices 98,912 (inside the 34,000-154,000 class band)
  lod0 triangles 50,348 of the 60,000 cap; proxy cover 100 %;
  ONE CONNECTED BODY at 0.06 voxels — the nested bay content is connected
  through the cradle pad piercing the bay wall face, proven by the island
  probe, not assumed.

Ivory region: z -33.0 -> +3.8, five stepped runs; full height y -1.25 ->
  +0.64 across the bow zone and mid front, pinching to one row at the tip.
  ~58 units^2 a flank = ~15 % of the broadside silhouette (~385 units^2 a
  side) — the charter two-tone, no longer a ribbon.
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

def _freighter_stations(l, b, h):
    """Hull loft stations for the catalog ark.

    ONE continuous faired leaf volume; the needle prow is a long fine run of
    stations in the loft, never a bolted-on spike. Max half-beam b*0.20 at
    z = l*-0.07. Nose at l*-0.46, transom at l*0.44. Bow/mid seam at
    l*-0.25, mid/stern seam at l*+0.20.
    """
    return [
        # -- BOW: the needle prow run, faired, y_offset rising from the drop --
        sf.edge_section(l * -0.460, b * 0.0064, h * 0.0118, h * -0.008),  # nose tip
        sf.fair(l * -0.4235, b * 0.0342, h * 0.0353, h * -0.008),
        sf.fair(l * -0.3765, b * 0.0727, h * 0.0588, h * -0.008),
        sf.fair(l * -0.3176, b * 0.1198, h * 0.0824, h * -0.006),
        sf.fair(l * -0.2500, b * 0.1626, h * 0.1020, h * -0.004),  # bow/mid seam

        # -- MID: the long calm body the vaults hang beneath --
        sf.fair(l * -0.1647, b * 0.1882, h * 0.1137, h * -0.002),
        sf.fair(l * -0.0706, b * 0.2000, h * 0.1216, 0.0),         # max half-beam
        sf.fair(l *  0.0471, b * 0.1989, h * 0.1216, 0.0),
        sf.fair(l *  0.1412, b * 0.1904, h * 0.1176, 0.0),
        sf.fair(l *  0.2000, b * 0.1797, h * 0.1137, 0.0),         # mid/stern seam

        # -- STERN: the fair taper to the transom, drive face overlaps here --
        sf.fair(l *  0.2824, b * 0.1540, h * 0.1020, h *  0.002),
        sf.fair(l *  0.3647, b * 0.1198, h * 0.0863, h *  0.004),
        sf.fair(l *  0.4400, b * 0.0898, h * 0.0745, h *  0.006),  # transom
    ]


# ===========================================================================
# THE IVORY REGION — run table (the charter two-tone, a REGION not a ribbon)
# ===========================================================================
# (z0/l, z1/l, y centre/h, height/h, rows). Five stepped runs: full flank
# height (keel line to chine) across the bow zone and the front of the mid
# zone, pinching aft to a one-row teardrop tip at z +3.8. Every band stays
# inside the vertical flank (sf.straight_bottom / sf.straight_top) at every
# station of its z-range, so the 0.12 burial holds along the whole run; the
# run split at l*-0.25 keeps any plate from crossing the collar seam. Rows
# are built one call per row so each row is seated with sf.surf_flank at its
# OWN height. Clears: chine course (bottom h*0.027) above, gallery A (rim
# top ~h*-0.051) and gallery C (rim top ~h*-0.041) below, the bay (z +4.0)
# aft.
_IVORY_RUNS = (
    (-0.388, -0.353, -0.008, 0.043, 2),   # fore step, over the bow gallery
    (-0.353, -0.252, -0.007, 0.062, 3),   # bow zone, up to the collar
    (-0.248, -0.012, -0.012, 0.074, 4),   # mid front, FULL flank height
    (-0.012,  0.018, -0.013, 0.039, 2),   # taper step
    ( 0.018,  0.045, -0.013, 0.020, 1),   # teardrop tip
)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Gilded Chain catalog ark (freighter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class envelope from the driver (85.0, 46.75, 25.5).
    detail   -- 3 full  2 halved runs  1 primary masses + bay  0 loft/vaults/
                drive only.
    """
    H = kit.ROLE_HULL
    REC = kit.ROLE_RECESS
    TRM = kit.ROLE_TRIM

    stations = _freighter_stations(l, b, h)

    z_nose = l * -0.46      # -39.10  needle nose
    z_seam_bow = l * -0.25  # -21.25  bow / mid seam (collar band)
    z_seam_mid = l * 0.20   # +17.00  mid / stern seam (collar band)
    z_transom = l * 0.44    # +37.40  loft transom

    # ── 1. Primary shell loft (always) ───────────────────────────────────
    kit.hull_loft(parts, 'frt.hull', H, stations, hull_mat)

    # ── 2. FIVE sealed vault bodies under the shell (always) ─────────────
    # Each vault is seated with sf.bottom_y at ITS OWN station and lapped
    # 0.35 into the shell (>= 0.10 gate); sizes follow the hull taper, so no
    # two vaults are the same size. Calm ceramic masses — the construct adds
    # only its hairline gold seam rings at detail >= 2.
    for i, zf in enumerate((-0.194, -0.115, -0.035, 0.044, 0.124)):
        zc = l * zf
        keel = sf.bottom_y(stations, zc)
        vhw = sf.flank_x(stations, zc, keel)          # half-beam at keel level
        vhh = sf.section(stations, zc)[1]             # hull half-height here
        vsy = vhh * 0.75                              # full y extent
        vsx = vhw * 0.62 * 2.0                        # full x extent
        vsz = l * 0.0635                              # full z extent (5.4)
        vcy = keel - vsy * 0.5 + 0.35                 # 0.35 lap into the shell
        hw.vault_body(parts, 'frt.vault.%d' % i, hull_mat,
                      (0.0, vcy, zc), (vsx, vsy, vsz), detail=detail)

    # ── 3. Drive face at the transom (always; engine glow at the stern) ──
    dhw, dhh, dyo, _dch = sf.section(stations, z_transom)
    hw.drive_face(parts, glow, 'frt.drive', hull_mat, glow_mat,
                  (0.0, dyo, z_transom), dhw * 0.90, dhh * 0.90,
                  nozzles=8, depth=0.6, detail=detail)

    if detail < 1:
        return

    # ── 4. Zone-seam collar bands (detail 1+) ────────────────────────────
    # The family signature pair: a gold collar ring on a collar_ring section
    # at each zone seam.
    for zf, tag in ((-0.25, 'bow'), (0.20, 'mid')):
        zc = l * zf
        sh.collar_band(parts, 'frt.collar.%s' % tag, hull_mat,
                       sf.collar_ring(stations, zc, over=0.05), zc,
                       width=0.10, ribs=8, detail=detail)

    # ── 5. THE OPEN BAY — starboard only, THE deliberate asymmetry ───────
    # A genuinely open acquisition bay cut into the shell: RECESS walls
    # seated with sf.flank_x, a nested docked_leaf on a cradle pad, and a
    # stack of eight absolute CARGO_CRATE containers. Every nested item
    # overlaps the back wall or its neighbour by >= 0.10. This — with the
    # fleet-bore tug collars — is what gives an 80-unit hull its size.
    bay_z0 = l * 0.047                      #  +4.0
    bay_z1 = l * 0.182                      # +15.5 (clear of the +17.0 collar)
    bay_zc = (bay_z0 + bay_z1) * 0.5
    bay_len = bay_z1 - bay_z0
    bay_y = 0.0
    fx_bay = sf.flank_x(stations, bay_zc, bay_y)    # ~9.2 at bay centre
    dep = b * 0.064                         #  3.0 bay depth
    mh = h * 0.086                          #  2.2 mouth height
    if fx_bay > 0.0:
        # Back wall: dark RECESS plane, face a hair proud of the skin, body
        # sunk the full bay depth into the hull (burial ~3.0).
        kit.box(parts, 'frt.bay.wall', REC,
                (fx_bay - dep * 0.5 + 0.02, bay_y, bay_zc),
                (dep + 0.04, mh, bay_len), hull_mat)
        # Top / bottom cheeks: RECESS, inboard 2.8 buried in the hull, outer
        # face 0.2 proud of the skin forming the mouth rim.
        for sgn, tag in ((1.0, 't'), (-1.0, 'b')):
            kit.box(parts, 'frt.bay.cheek.%s' % tag, REC,
                    (fx_bay - dep * 0.5 + 0.2,
                     bay_y + sgn * (mh * 0.5 + h * 0.010), bay_zc),
                    (dep, h * 0.020, bay_len + 0.4), hull_mat)
        # End posts: RECESS, same seating.
        for ze, tag in ((bay_z0, 'n'), (bay_z1, 's')):
            kit.box(parts, 'frt.bay.post.%s' % tag, REC,
                    (fx_bay - dep * 0.5 + 0.2, bay_y, ze),
                    (dep, mh + 0.4, 0.5), hull_mat)
        # Bright TRIM lip around the mouth: 0.10 x-overlap onto the cheek /
        # post outer faces and >= 0.10 y-overlap into the cheek bodies.
        kit.box(parts, 'frt.bay.lip.t', TRM,
                (fx_bay + 0.16, bay_y + mh * 0.5 + 0.05, bay_zc),
                (0.12, 0.24, bay_len), hull_mat)
        kit.box(parts, 'frt.bay.lip.b', TRM,
                (fx_bay + 0.16, bay_y - mh * 0.5 - 0.05, bay_zc),
                (0.12, 0.24, bay_len), hull_mat)
        for ze, tag in ((bay_z0, 'n'), (bay_z1, 's')):
            kit.box(parts, 'frt.bay.lip.%s' % tag, TRM,
                    (fx_bay + 0.16, bay_y, ze),
                    (0.12, mh, 0.12), hull_mat)

        # Nested leaf craft on its cradle pad, forward end of the bay.
        leaf_len = l * 0.0706               #  6.0 — a real scale cue
        leaf_z = bay_z0 + leaf_len * 0.5 + l * 0.0094
        leaf_x = fx_bay - dep * 0.60        # body laps 0.9 into the back wall
        # The pad is what CONNECTS the whole nest to the ship, and it has to
        # pierce a face to do it. The bay wall is a solid box spanning
        # x [fx_bay - dep, fx_bay + 0.04], and the leaf, the crates and this
        # pad all sit in its INTERIOR: a lofted hull and a box are surface
        # shells to the island probe, and two nested shells share no voxel, so
        # the first bake floated the entire nest as one 12,145-cell island.
        # Running the pad from 0.15 inboard of the wall's inner face out to
        # under the leaf's belly makes the two surfaces intersect. PROVEN by
        # probe-ship-islands gilded freighter lod0 reporting ONE CONNECTED
        # BODY at 0.06 voxels.
        pad_x0 = fx_bay - dep - 0.15
        pad_x1 = leaf_x + leaf_len * 0.14
        kit.box(parts, 'frt.bay.cradle', REC,
                ((pad_x0 + pad_x1) * 0.5, bay_y - h * 0.0165, leaf_z),
                (pad_x1 - pad_x0, h * 0.0157, leaf_len * 0.85), hull_mat)
        hw.docked_leaf(parts, glow, 'frt.bay.leaf', hull_mat, glow_mat,
                       (leaf_x, bay_y - 0.02, leaf_z), leaf_len,
                       detail=detail)
        # The cradle pad top overlaps the leaf belly by 0.13; the pad laps
        # into the back wall.

        # Container stack: 2 long x 2 deep x 2 high at absolute CARGO_CRATE.
        # SURFACE-INTERSECTION rule: a crate wholly inside the wall box's
        # interior shares no voxel with it, so column 0 PIERCES the bay
        # wall's inner face by 0.11 (its top/bottom/end faces cross the
        # wall's inner-face surface — that wall is itself connected to the
        # hull); column 1 laps 0.15 onto column 0; the upper tier laps 0.10
        # onto the lower.
        cr = sf.CARGO_CRATE[0]              # 0.85 cube edge
        cz0 = bay_z1 - l * 0.0235           # aft column centre
        cx0 = fx_bay - dep - 0.11 + cr * 0.5
        for ix, cxx in enumerate((cx0, cx0 + (cr - 0.15))):
            for iz in range(2):
                for iy in range(2):
                    kit.box(parts, 'frt.bay.crate.%d%d%d' % (ix, iz, iy), H,
                            (cxx,
                             bay_y - 0.62 + iy * (cr - 0.10),
                             cz0 - cr * 0.5 + iz * cr),
                            (cr, cr, cr), hull_mat)

    # ── 6. Transfer salons — human scale on the stern flanks (detail 1+) ─
    # Four SEALED chambers, hatches at the absolute TRANSFER_HATCH module,
    # staggered port/starboard between the radiator stations.
    salon_size = (b * 0.0171, h * 0.0392, l * 0.0165)   # (0.8, 1.0, 1.4)
    for side, zf, tag in ((1.0, 0.282, 'a.stbd'), (1.0, 0.353, 'b.stbd'),
                          (-1.0, 0.262, 'a.port'), (-1.0, 0.329, 'b.port')):
        zc = l * zf
        yc = h * 0.012
        xc = sf.flank_anchor(stations, zc, yc, salon_size[0] * 0.5)
        hw.transfer_chamber(parts, glow, 'frt.salon.%s' % tag,
                            hull_mat, glow_mat,
                            (side * xc, yc, zc), salon_size,
                            detail=detail, face='x')

    # ── 7. Capture-collar tug points at the ONE fleet bore (detail 1+) ───
    # Three ventral collars at absolute COLLAR_BORE, unscaled — the fleet
    # scale cue. Seated on the keel with sf.bottom_y at their own stations,
    # fore and aft of the vault band.
    for zf, tag in ((-0.237, 'fore'), (0.182, 'mid'), (0.253, 'aft')):
        zc = l * zf
        hw.capture_collar(parts, glow, 'frt.tug.%s' % tag, hull_mat, glow_mat,
                          (0.0, sf.bottom_y(stations, zc), zc),
                          detail=detail)

    # ── 8. Radiator vanes — flat, empty, breaking the outline (detail 1+) ─
    # Three staggered pairs on the stern flanks; inboard 0.10 buried by the
    # construct. span b*0.034 holds hull len/beam at the measured 4.04 with
    # the tips counted.
    for side, zfs in ((1.0, (0.247, 0.318, 0.388)),
                      (-1.0, (0.224, 0.294, 0.365))):
        stag = 'stbd' if side > 0.0 else 'port'
        for k, zf in enumerate(zfs):
            zc = l * zf
            yc = h * 0.016
            fxr = sf.flank_x(stations, zc, yc)
            hw.radiator_vane(parts, 'frt.rad.%s.%d' % (stag, k), hull_mat,
                             (side * fxr, yc, zc),
                             b * 0.034, l * 0.045,
                             detail=detail, side=side)

    # ── 9. THE SWEPT VENTRAL PYLON SET — the outline-breaker (detail 1+) ─
    # Three pairs, chord l*0.153 = 13.0 = 17 % of hull length each (>= 15 %
    # gate); roots INSIDE the hull (handed to the construct as given), tips
    # swept aft and outboard below the vaults.
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        for k, zf in enumerate((-0.165, -0.024, 0.118)):
            zr = l * zf
            yr = h * -0.071                 # -1.8, inside the hull
            xr = sf.flank_x(stations, zr, yr) * 0.55
            hw.ventral_pylon(parts, glow, 'frt.pylon.%s.%d' % (stag, k),
                             hull_mat, glow_mat,
                             (side * xr, yr, zr),
                             (side * (xr + b * 0.047), h * -0.250,
                              zr + l * 0.047),
                             l * 0.153, b * 0.006, detail=detail)

    # ── 10. Closed hairline aperture seams — hidden threats (detail 1+) ──
    # All four closed (open=0.0); the open bay is this class's one open
    # feature. Seated with sf.flank_anchor on the LOWER CHAMFER below the
    # gallery rim, staggered — clear of the ivory region above them.
    for side, zf, tag in ((1.0, -0.229, 'a.stbd'), (1.0, -0.094, 'b.stbd'),
                          (-1.0, -0.165, 'a.port'), (-1.0, 0.024, 'b.port')):
        zc = l * zf
        yc = h * -0.083
        xc = sf.flank_anchor(stations, zc, yc, 0.08)
        sh.aperture_seam(parts, glow, 'frt.seam.%s' % tag, hull_mat, glow_mat,
                         (side * xc, yc, zc), l * 0.035,
                         axis='z', open=0.0, detail=detail)

    # ── 11. Gallery run A — the dominant light, both flanks (detail 1+) ──
    # Long low recessed slot; cold turquoise panes at absolute GALLERY_PANE
    # / PANE_SPACING deep inside the well.
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        sh.gallery_slot(parts, glow, 'frt.gallery.a.%s' % stag,
                        hull_mat, glow_mat,
                        l * -0.282, l * 0.047, h * -0.063, h * 0.020,
                        sf.surf_flank(stations, h * -0.063),
                        side=side, detail=detail)

    # ── 12. ONE scale course per flank (detail 1+; the lod2 skin) ────────
    # Rides the chine line on the vertical flank, clear of the ivory region
    # below it (course bottom h*0.027 vs the region top h*0.025).
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        sh.scale_course(parts, 'frt.course.mid.%s' % stag, hull_mat,
                        l * -0.353, l * 0.188, h * 0.039, h * 0.024,
                        sf.surf_flank(stations, h * 0.039),
                        side=side, detail=detail, seed=11)

    if detail < 2:
        return

    # ── 13. The dorsal shell — main scale field (detail 2+) ──────────────
    # Courses touch laterally; the field self-trims to the sheer. Bow and
    # stern fields join at detail 3 (the detail-2 budget drops them).
    sh.scale_field(parts, 'frt.shell.main', hull_mat,
                   l * -0.306, l * 0.376,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   13, detail=detail, seed=3)

    # ── 14. Second flank course on the chine slope (detail 2+) ───────────
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        sh.scale_course(parts, 'frt.course.chine.%s' % stag, hull_mat,
                        l * -0.329, l * 0.400, h * 0.075, h * 0.022,
                        sf.surf_flank(stations, h * 0.075),
                        side=side, detail=detail, seed=12)

    # ── 15. THE IVORY REGION — forward flank, both sides (detail 2+) ─────
    # The charter two-tone as a REGION: five stepped runs from the keel line
    # to the chine across the bow zone and the mid front, tapering aft into
    # a teardrop (run table _IVORY_RUNS). One ivory_margin call PER ROW so
    # every row is seated with sf.surf_flank at its own height; runs split
    # at the collar seam and the taper steps so no plate crosses a zone
    # boundary. Bounded above by the gold hairline in section 16. At detail
    # 2 each run's rows merge into half the calls (same silhouette, half
    # the plates) and the construct halves the plate count itself.
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        for ri, (zf0, zf1, yf, hf, rows) in enumerate(_IVORY_RUNS):
            rowh = h * hf / rows
            specs = []
            for r in range(rows):
                specs.append((h * (yf - hf * 0.5) + (r + 0.5) * rowh, rowh))
            if detail == 2:                 # merge row pairs: half the calls
                merged = []
                for r in range(0, rows - 1, 2):
                    lo = specs[r][0] - specs[r][1] * 0.5
                    hi = specs[r + 1][0] + specs[r + 1][1] * 0.5
                    merged.append(((lo + hi) * 0.5, hi - lo))
                if rows % 2:
                    merged.append(specs[-1])
                specs = merged
            for qi, (ry, rh) in enumerate(specs):
                sh.ivory_margin(parts, 'frt.ivory.%d.%s.%d' % (ri, stag, qi),
                                hull_mat, l * zf0, l * zf1, ry, rh,
                                sf.surf_flank(stations, ry),
                                side=side, detail=detail, rows=1)

    # ── 16. Gold hairlines: full-length chine + margin bound (detail 2+) ─
    # The family signature chine line rides the chamfer corner (hw,
    # straight_top); both ends are pulled inboard and down so they bury
    # >= 0.10 into the hull (a hairline is sub-voxel and must ride a
    # connected body).
    npt = 17 if detail >= 3 else 9
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        path = []
        for k in range(npt):
            zc = l * -0.40 + (l * 0.80) * k / float(npt - 1)
            st = sf.straight_top(stations, zc)
            fx = sf.flank_x(stations, zc, st)
            if fx <= 0.0:
                continue
            path.append((side * fx, st, zc))
        if len(path) >= 2:
            x0, y0, z0 = path[0]
            path[0] = (x0 * 0.96, y0 - 0.12, z0)
            x1, y1, z1 = path[-1]
            path[-1] = (x1 * 0.96, y1 - 0.12, z1)
            sh.gold_line(parts, 'frt.chine.%s' % stag, hull_mat, path,
                         detail=detail)
        # Ivory bound: ONE gold hairline tracing the region's stepped top
        # edge — a level run 0.03 above each ivory run's top with vertical
        # jogs at the taper steps, both ends buried >= 0.10 into the hull.
        # Coarser sampling at detail 2 (the hairline is sub-voxel anyway).
        step = 3.0 if detail >= 3 else 6.5
        bpath = []
        for zf0, zf1, yf, hf, _rows in _IVORY_RUNS:
            zr0, zr1 = l * zf0, l * zf1
            yl = h * (yf + hf * 0.5) + 0.03
            n_seg = max(1, int(round((zr1 - zr0) / step)))
            for k in range(n_seg + 1):
                zc = zr0 + (zr1 - zr0) * k / float(n_seg)
                fx = sf.flank_x(stations, zc, yl)
                if fx <= 0.0:
                    continue
                bpath.append((side * fx, yl, zc))
        if len(bpath) >= 2:
            x0, y0, z0 = bpath[0]
            bpath[0] = (x0 * 0.96, y0 - 0.15, z0)
            x1, y1, z1 = bpath[-1]
            bpath[-1] = (x1 * 0.96, y1 - 0.15, z1)
            sh.gold_line(parts, 'frt.margin.line.%s' % stag, hull_mat, bpath,
                         detail=detail)

    # ── 17. Ivory leading-edge blade along the keel (detail 2+) ──────────
    sh.edge_keel(parts, 'frt.keel', hull_mat, l * -0.447, l * 0.424,
                 sf.surf_bottom(stations), half_w=0.05, detail=detail)

    # ── 18. Marker runs at absolute LAMP_SPACING (detail 2+) ─────────────
    # High on the chine slope, inboard of the chine course. The detail-2
    # budget carries a shortened mid-band run.
    if detail >= 3:
        mz0, mz1 = l * -0.259, l * 0.212
    else:
        mz0, mz1 = l * -0.141, l * 0.141
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        hw.marker_run(parts, glow, 'frt.mark.%s' % stag, hull_mat, glow_mat,
                      mz0, mz1, h * 0.096,
                      sf.surf_flank(stations, h * 0.096),
                      side=side, detail=detail)

    if detail < 3:
        return

    # ── 19. detail 3 only: bow + stern dorsal fields ─────────────────────
    # The bow field rides one scale-thickness higher (proud 0.075) so the
    # overlap with the main field reads as a second shingle layer.
    sh.scale_field(parts, 'frt.shell.bow', hull_mat,
                   l * -0.435, l * -0.235,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   5, detail=detail, proud=0.075, seed=7)
    sh.scale_field(parts, 'frt.shell.stern', hull_mat,
                   l * 0.235, l * 0.424,
                   sf.surf_top(stations), sf.surf_flat(stations),
                   6, detail=detail, seed=8)

    # ── 20. detail 3 only: gallery runs B (aft) and C (bow) ──────────────
    for side in (1.0, -1.0):
        stag = 'stbd' if side > 0.0 else 'port'
        sh.gallery_slot(parts, glow, 'frt.gallery.b.%s' % stag,
                        hull_mat, glow_mat,
                        l * 0.212, l * 0.400, h * -0.047, h * 0.020,
                        sf.surf_flank(stations, h * -0.047),
                        side=side, detail=detail)
        # Gallery C dropped to the lower chamfer: its rim top (~h*-0.041)
        # stays clear of the ivory region's bottom edge above it.
        sh.gallery_slot(parts, glow, 'frt.gallery.c.%s' % stag,
                        hull_mat, glow_mat,
                        l * -0.424, l * -0.294, h * -0.053, h * 0.020,
                        sf.surf_flank(stations, h * -0.053),
                        side=side, detail=detail)

    # ── 21. detail 3 only: two small dorsal mast clusters ────────────────
    for zf, mhgt, cnt, tag in ((-0.282, h * 0.035, 3, 'fore'),
                               (0.259, h * 0.043, 4, 'aft')):
        zc = l * zf
        hw.mast_cluster(parts, glow, 'frt.mast.%s' % tag, hull_mat, glow_mat,
                        (0.0, sf.top_y(stations, zc), zc), mhgt,
                        count=cnt, detail=detail)
