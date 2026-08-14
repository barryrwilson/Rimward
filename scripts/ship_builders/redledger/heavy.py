"""Red Ledger — HEAVY, the tribute raider.

Bible §4.4: "a muscular captured hull rebuilt around a ram, four grappling
booms, recessed weapons, and modular ransom/cargo vaults.  Deliberately
unbalanced secondary machinery is welcome."

Silhouette family: WEDGE (primary), SPINE-AND-PODS (secondary).
All fourteen hull stations use hard_section; three k-values enforce the
three-capture visual without a single fair() curve.

Three zones (SpaceShipIdeas/synthesis/20 rule 1):
  bow    22 %  z –8.60 … –4.73   RAM ZONE — hw.ram_prow wedge weapon
               rooted 0.12 units inside the hull at the bow seam.
               Three stepped plate_course strakes.  No plate or quilt
               crosses the root seam.  Reads as a weapon at thumbnail.
  mid    55 %  z –4.73 … +4.59   CITADEL — muscular captured body,
               k=0.16 stations (hard flat faces, standard chines).
               Four grapple booms (A port-fwd 4.2 m, C stbd-fwd 3.2 m,
               B port-aft 2.6 m, D stbd-aft 1.9 m) rooted in flanks.
               Three ransom vaults on stand-off pads (vault-a large
               dorsal 1.80×1.00×2.20, vault-b medium dorsal 1.40×
               0.80×1.70, vault-c small port-flank 1.00×0.70×1.40
               body-overlap). Four closed shutter wells.
               Stripe clusters: stbd belt 6 stripes, ram-root port 4 stripes,
               port belt 5 stripes (asymmetric count, ~5 % hull area).
               Plate quilt: mid flanks full keel-to-crown (rows=10, pitch=0.75),
               deck full mid zone (rows=6), keel (rows=5, detail≥2), stern
               flanks (rows=6, detail≥2), ram flanks (rows=4, detail≥2);
               all runs role_mix=(0.55, 0.36, 0.09).  Two donor parts:
               Ferrous rib belt (port deck) and Gilded Chain scale panel
               (citadel deck, stbd-biased).
  stern  23 %  z +4.59 … +8.50   DRIVE FACE — k=0.10 stations (very
               flat rectangular drive block). Three mismatched captured
               drives giving 6 countable nozzles: PORT CLUSTER drive-a
               (r=0.62, 2 nozzles) + drive-b (r=0.42, 2 nozzles) vs
               STBD SINGLE drive-c (r=0.50, 2 nozzles). Port heavier
               than stbd. Two flat radiator panels break the outline.

Donor parts (§G6 — exposed frame / salvage construction):
  1. dn.donor_ferrous_ribs — captured Ferrous armour rib belt, port deck
     of the mid zone fwd; 6 standing ribs, two weld_straps, cut_edge at
     both Z ends.
  2. dn.donor_gilded_panel — captured Chain overlapping scale panel,
     citadel deck stbd-biased aft; 6 scale tiles, ivory edge trim, glow
     gallery at stern edge, two weld_straps, cut_edge at both Z ends.

Salvage boom: sv.salvage_boom, lattice arm slung under the bow, root
buried in the keel at z ≈ –3.57, tip at z ≈ –6.77 below the keel by
0.76 units. Boom 3D length ≈ 3.30 units = 19.2 % of hull length (≥ 15 %
§G2 requirement).  Radius 0.07, jaw 0.46.

Deliberate functional asymmetry: port drive cluster (two mismatched
packages, 4 nozzles, larger combined radius) vs starboard single (2
nozzles); plus donor_ferrous_ribs on port only and donor_gilded_panel
stbd-biased — the ship is visibly heavier to port, consistent with the
capture history of its left flank taking the Ferrous armour belt.

Extent budget (measured from the delivered GLB):
  spanZ 17.1
  spanZ / spanX = 2.37   spanY / spanZ = 0.39 ≤ 0.60
  spanX / spanZ = 0.42 ≥ 0.16

Measured (node scripts/measure-ships.mjs redledger, ALL PASS):
  verts 30682   span 17.1   len/beam 2.37   ht/len 0.39
  beam/len 0.42   proxy cover 100.0 %
  triangles: lod0 15760   lod1 7448   lod2 3776
  probe-ship-islands: ONE CONNECTED BODY

Commands:
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P scripts/build-ship-assets.py -- redledger
  node scripts/compress-ship-assets.mjs redledger
  node scripts/measure-ships.mjs redledger
  node scripts/probe-ship-islands.mjs redledger heavy lod0
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import hardware as hw
from . import salvage as sv
from . import donors as dn


def _heavy_stations(l, b, h):
    """Tribute-raider hull stations, bow face to transom.

    Fourteen stations, three k-value families — one per zone — so the
    lofted hull reads as three distinct captured sections:

      stations  0 – 2   hard_section k=0.14  z –4.73 … –2.64
                        Captured bow body: narrower, harder chines,
                        connects flush to the ram prow root seam.
      stations  3 – 9   hard_section k=0.16  z –1.53 … +4.59
                        Citadel: widest mid-section, flat faces with
                        standard chines — the muscular armoured core.
      stations 10 – 13  hard_section k=0.10  z +5.61 … +8.50
                        Drive block: very flat, near-rectangular
                        cross-section — the stern capture reads as a
                        different seized hull entirely.

    No plate course or quilt crosses a zone boundary.
    """
    return [
        # — Captured bow body (k=0.14 — harder chines, weapon end) ————————
        sf.hard_section(-l * 0.278, b * 0.262, h * 0.412,  0.000,      k=0.14),
        sf.hard_section(-l * 0.218, b * 0.284, h * 0.410,  0.000,      k=0.14),
        sf.hard_section(-l * 0.155, b * 0.308, h * 0.407,  h * 0.004,  k=0.14),
        # — Mid citadel (k=0.16 default — flat-faced muscular body) ————————
        sf.hard_section(-l * 0.090, b * 0.330, h * 0.416,  h * 0.009),
        sf.hard_section(-l * 0.030, b * 0.344, h * 0.422,  h * 0.011),
        sf.hard_section( 0.0,        b * 0.348, h * 0.424,  h * 0.012),
        sf.hard_section( l * 0.065,  b * 0.346, h * 0.422,  h * 0.011),
        sf.hard_section( l * 0.130,  b * 0.336, h * 0.414,  h * 0.007),
        sf.hard_section( l * 0.200,  b * 0.320, h * 0.402,  h * 0.002),
        sf.hard_section( l * 0.270,  b * 0.302, h * 0.386, -h * 0.004),
        # — Stern drive block (k=0.10 — very flat, squared drive face) ————
        sf.hard_section( l * 0.330,  b * 0.274, h * 0.360, -h * 0.010, k=0.10),
        sf.hard_section( l * 0.390,  b * 0.238, h * 0.322, -h * 0.016, k=0.10),
        sf.hard_section( l * 0.450,  b * 0.200, h * 0.282, -h * 0.022, k=0.10),
        sf.hard_section( l * 0.500,  b * 0.172, h * 0.256, -h * 0.026, k=0.10),
    ]


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL
    A = kit.ROLE_ARMOUR

    st = _heavy_stations(l, b, h)

    # ── Key Z landmarks ──────────────────────────────────────────────────────
    z_ram_tip  = -(l * 0.500 + 0.10)  # –8.60  ram tip
    z_bow_seam = -l * 0.278            # –4.73  bow-zone / mid-zone seam (station 0)
    z_ram_root =  z_bow_seam + 0.12   # –4.61  ram root BURIED 0.12 into hull body
    z_weld_mid =  l * 0.032            # +0.54  mid-body weld bead (two captures meet)
    z_mid_seam =  l * 0.270            # +4.59  mid-zone / stern-zone seam (station 9)
    z_transom  =  l * 0.500            # +8.50  transom

    # ── Pre-computed section queries ─────────────────────────────────────────
    # RAM root: use the section at the bow seam (the visible seam line),
    # then bury the root 0.12 inside the hull so the ram body overlaps the
    # hull volume by >= 0.10 units — satisfying the connectivity gate.
    bow_sec        = sf.section(st, z_bow_seam)
    ram_hw, ram_hh = bow_sec[0], bow_sec[1]   # half-extents at the seam

    mid_sec              = sf.section(st, 0.0)
    mid_hw, mid_hh, mid_yo = mid_sec[0], mid_sec[1], mid_sec[2]

    mid_run = z_mid_seam - z_bow_seam           # ≈ 9.32  mid zone length
    mid_cz  = (z_bow_seam + z_mid_seam) * 0.5   # ≈ –0.07  mid zone centre

    # ── ❶ Primary masses — LOD 0 and above ──────────────────────────────────

    kit.hull_loft(parts, 'hull-body', H, st, hull_mat)

    # Ram prow: z_root buried 0.12 past the bow seam into the hull body.
    # half_w / half_h taken at the seam (the physical junction ring).
    hw.ram_prow(parts, 'ram-prow', z_ram_tip, z_ram_root,
                ram_hw, ram_hh, hull_mat, courses=3, detail=detail)

    # ── ❷ Zone seams — three zones, two collars + one weld bead ─────────────

    # BOW / MID seam: capture collar where ram zone meets the citadel.
    bseam = sf.seam_ring(st, z_bow_seam)
    hw.capture_collar(parts, 'collar-bow',
                      bseam[0], bseam[1], bseam[2], bseam[3],
                      z_bow_seam, hull_mat, depth=0.26, ribs=4, detail=detail)

    # MID / STERN seam: capture collar where citadel meets the drive block.
    mseam = sf.seam_ring(st, z_mid_seam)
    hw.capture_collar(parts, 'collar-mid',
                      mseam[0], mseam[1], mseam[2], mseam[3],
                      z_mid_seam, hull_mat, depth=0.26, ribs=4, detail=detail)

    # INTERNAL WELD BEAD inside the mid zone — two captures butt-welded.
    wseam = sf.seam_ring(st, z_weld_mid)
    hw.weld_bead(parts, 'weld-mid',
                 wseam[0], wseam[1], wseam[2], wseam[3],
                 z_weld_mid, hull_mat, thickness=0.10, over=0.06, detail=detail)

    # ── ❸ Plate courses — six armour belt runs, no course crossing a seam ───
    # Belt plates are centred at the flank_anchor for the narrowest hull
    # cross-section in each zone so the belt stays inside the hull at every
    # Z position along the run.
    belt_y  = 0.0
    belt_fx = sf.flank_anchor(st, z_bow_seam, belt_y, 0.07)
    for pc_name, pc_sign in (('pc-port-belt', -1.0), ('pc-stbd-belt', 1.0)):
        kit.plate_course(parts, pc_name, H,
                         (pc_sign * belt_fx, belt_y, mid_cz),
                         (0.14, mid_hh * 1.08, mid_run),
                         hull_mat, count=7, axis='z', bevel=h * 0.008)

    # Forward deck run (bow-seam → weld-mid, within mid zone)
    fwd_run = z_weld_mid - z_bow_seam          # ≈ 5.27
    fwd_cz  = (z_bow_seam + z_weld_mid) * 0.5  # ≈ –2.10
    fwd_ty  = sf.top_y(st, fwd_cz) + 0.04
    kit.plate_course(parts, 'pc-deck-fwd', H,
                     (0.0, fwd_ty, fwd_cz),
                     (mid_hw * 1.72, 0.10, fwd_run),
                     hull_mat, count=6, axis='z', bevel=h * 0.007)

    # Aft deck run (weld-mid → mid-seam, within mid zone)
    aft_run = z_mid_seam - z_weld_mid          # ≈ 4.05
    aft_cz  = (z_weld_mid + z_mid_seam) * 0.5  # ≈ +2.57
    aft_ty  = sf.top_y(st, aft_cz) + 0.04
    kit.plate_course(parts, 'pc-deck-aft', H,
                     (0.0, aft_ty, aft_cz),
                     (mid_hw * 1.60, 0.10, aft_run),
                     hull_mat, count=5, axis='z', bevel=h * 0.007)

    # Keel armour belt (mid zone, below waterline)
    keel_by = sf.bottom_y(st, mid_cz) - 0.04
    kit.plate_course(parts, 'pc-keel', H,
                     (0.0, keel_by, mid_cz),
                     (mid_hw * 1.52, 0.08, mid_run),
                     hull_mat, count=6, axis='z', bevel=h * 0.007)

    # Stern flank belts (stern zone only: z_mid_seam → z_transom)
    stern_run = z_transom - z_mid_seam          # ≈ 3.91
    stern_cz  = (z_mid_seam + z_transom) * 0.5  # ≈ +6.55
    stern_fy  = sf.flank_anchor(st, z_transom, 0.0, 0.07)
    for sp_name, sp_sign in (('pc-stern-port', -1.0), ('pc-stern-stbd', 1.0)):
        kit.plate_course(parts, sp_name, H,
                         (sp_sign * stern_fy, 0.0, stern_cz),
                         (0.12, mid_hh * 0.84, stern_run),
                         hull_mat, count=5, axis='z', bevel=h * 0.007)

    # Panel lines on ventral (mid zone)
    vent_by = sf.bottom_y(st, 0.0) - 0.04
    kit.panel_lines(parts, 'ventral-seams',
                    (0.0, vent_by, mid_cz),
                    (mid_hw * 1.40, 0.10, mid_run),
                    hull_mat, count=6, axis='z')

    # ── ❹ Plate quilt — dominant faction surface read (§G6, §20 rule 5) ─────
    # surf= callbacks re-sample the actual hull surface per plate station so
    # plates self-seat on the tapering hull and trim at chamfer corners.
    # role_mix=(0.55, 0.36, 0.09) on every lofted run: iron dominates,
    # weathered tone reads as patchwork, recess share reads as seam gaps.
    #
    # LOD gating: plate_quilt degrades internally (detail=1→1 row, 2× pitch;
    # detail=2→rows//2, 1.4× pitch); new keel/ram/stern runs gated ≥2 so
    # detail=1 keeps only the coarse mid-zone course.  detail=0→nothing
    # (hull loft + armour still supply ROLE_HULL + ROLE_ARMOUR at lod3).

    # Ram flank surf: taper_block scales from tip_sc=(0.08,0.10) at nose
    # to (1.0,1.0) at root — linear in t=(z-z_tip)/(z_root-z_tip).
    # Returns +X half-width for stbd; callers negate for port.
    _ram_dz = z_ram_root - z_ram_tip
    def _ram_fx(z, yy):
        if z <= z_ram_tip or z >= z_ram_root:
            return 0.0
        t   = (z - z_ram_tip) / _ram_dz
        chw = ram_hw * (0.08 + 0.92 * t)
        chh = ram_hh * (0.10 + 0.90 * t)
        ch  = 0.14 * min(chw, chh)
        dy  = abs(yy)
        if dy >= chh:
            return 0.0
        if dy <= chh - ch:
            return chw
        return chw - (dy - (chh - ch))

    # Mid zone flanks: keel to crown (95 % of hull height), bow-seam to mid-seam.
    quilt_y = mid_yo
    quilt_h = mid_hh * 1.90    # covers ~95 % of hull height; surf trims chamfer

    sv.plate_quilt(parts, 'quilt-stbd', 0.0, quilt_y,
                   z_bow_seam, z_mid_seam, quilt_h,
                   hull_mat, seed=41, detail=detail,
                   rows=10, pitch=0.75, face='x',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, yy: sf.flank_x(st, z, yy))
    sv.plate_quilt(parts, 'quilt-port', 0.0, quilt_y,
                   z_bow_seam, z_mid_seam, quilt_h,
                   hull_mat, seed=42, detail=detail,
                   rows=10, pitch=0.75, face='-x',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, yy: -sf.flank_x(st, z, yy))

    # Deck quilt: full mid zone top face — extended to z_bow_seam…z_mid_seam.
    # surf re-seats every plate at the actual top_y; plates in the chamfer
    # shoulder are seated on the slope; only a genuinely flat face uses a
    # constant figure.
    deck_fw = sf.flat_half(st, 0.0)
    sv.plate_quilt(parts, 'quilt-deck', 0.0, 0.0,
                   z_bow_seam, z_mid_seam, deck_fw * 2.0,
                   hull_mat, seed=43, detail=detail,
                   rows=6, pitch=0.75, face='y',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, xx: sf.top_y(st, z, xx))

    # Stern zone flanks: detail≥2; surf trims the narrowing transom end.
    stern_qh = mid_hh * 1.80    # near-full height at the mid-seam end
    if detail >= 2:
        sv.plate_quilt(parts, 'quilt-stern-stbd', 0.0, 0.0,
                       z_mid_seam, z_transom, stern_qh,
                       hull_mat, seed=44, detail=min(detail, 2),
                       rows=6, pitch=0.75, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: sf.flank_x(st, z, yy))
        sv.plate_quilt(parts, 'quilt-stern-port', 0.0, 0.0,
                       z_mid_seam, z_transom, stern_qh,
                       hull_mat, seed=45, detail=min(detail, 2),
                       rows=6, pitch=0.75, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -sf.flank_x(st, z, yy))

        # Keel underside: mid zone — surf re-seats at actual bottom_y surface.
        sv.plate_quilt(parts, 'quilt-keel', 0.0, 0.0,
                       z_bow_seam, z_mid_seam, mid_hw * 1.60,
                       hull_mat, seed=48, detail=min(detail, 2),
                       rows=5, pitch=0.75, face='-y',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, xx: sf.bottom_y(st, z, xx))

        # Ram flanks: linear-taper surf trims plates toward the nose; quilt
        # self-builds up from the bow seam inward.  No plate crosses the
        # z_bow_seam (ram zone boundary).
        sv.plate_quilt(parts, 'quilt-ram-stbd', 0.0, 0.0,
                       z_ram_tip + 0.30, z_bow_seam, ram_hh * 2.0,
                       hull_mat, seed=46, detail=min(detail, 2),
                       rows=4, pitch=0.75, face='x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=_ram_fx)
        sv.plate_quilt(parts, 'quilt-ram-port', 0.0, 0.0,
                       z_ram_tip + 0.30, z_bow_seam, ram_hh * 2.0,
                       hull_mat, seed=47, detail=min(detail, 2),
                       rows=4, pitch=0.75, face='-x',
                       role_mix=(0.55, 0.36, 0.09),
                       surf=lambda z, yy: -_ram_fx(z, yy))

    # ── ❺ Stripe clusters — dried-red accent, ROLE_ACCENT, ~5 % hull area ────
    # 6 + 4 + 5 = 15 stripes × (0.34 × 3.0) ≈ 15.3 sq / ~316 sq hull ≈ 4.8 %.
    # surf= seats each stripe at its own z station.  Absolute gap=0.22 (never
    # a hull fraction).  Stripes on ONE flank per cluster; asymmetry deliberate.
    sg_y  = mid_yo
    sg_z0 = z_bow_seam                          # –4.73
    sg_z1 = -l * 0.060                          # –1.02

    # Main cluster: starboard belt, forward mid zone — 6 stripes.
    sv.stripe_group(parts, 'stripes-stbd', 0.0, sg_y, sg_z0, sg_z1,
                    hull_mat, height=3.0, count=6,
                    inward=-1.0, detail=detail,
                    surf=lambda z, yy: sf.flank_x(st, z, yy))

    # Ram-root cluster: port bow body, bow-seam → station-2 — 4 stripes.
    sr_z0 = z_bow_seam                          # –4.73
    sr_z1 = -l * 0.155                          # –2.64
    sv.stripe_group(parts, 'stripes-ram', 0.0, sg_y, sr_z0, sr_z1,
                    hull_mat, height=3.0, count=4,
                    inward=+1.0, detail=detail,
                    surf=lambda z, yy: -sf.flank_x(st, z, yy))

    # Port belt cluster: forward mid zone, port side, count=5 (≠6 stbd).
    # Centred between z_bow_seam and +l*0.060 to sit aft of stripes-ram.
    sp_z0 = z_bow_seam                          # –4.73
    sp_z1 = l * 0.060                           # +1.02
    sv.stripe_group(parts, 'stripes-port-belt', 0.0, sg_y, sp_z0, sp_z1,
                    hull_mat, height=3.0, count=5,
                    inward=+1.0, detail=detail,
                    surf=lambda z, yy: -sf.flank_x(st, z, yy))

    # ── ❻ Salvage boom — fleet signature, under and forward of the bow ───────
    # Root buried inside the hull keel; tip drops well below keel level at a
    # more forward Z position.  3D length ≈ 3.30 units = 19.2 % of hull length.
    boom_z0 = -l * 0.210                              # –3.57  root z
    boom_ry  = sf.bottom_y(st, boom_z0) + 0.16        # buried 0.16 in hull keel
    boom_ty  = sf.bottom_y(st, boom_z0) - 0.76        # tip drops below keel
    boom_tz  = boom_z0 - 3.20                          # –6.77  tip z
    sv.salvage_boom(parts, glow, 'salvage-boom',
                    root=(0.0, boom_ry, boom_z0),
                    tip=(0.0, boom_ty, boom_tz),
                    mat=hull_mat, glow_mat=glow_mat,
                    radius=0.07, jaw=0.46, detail=detail, bays=4)

    # ── ❼ Four grapple arms — FOUR DIFFERENT LENGTHS, roots in hull flanks ───
    # Roots are buried at 64-68 % of flank_x (32-36 % inside the hull).
    # Tips reach forward (-Z) and only slightly outboard (+/– X) so booms
    # do not widen the ship materially beyond the hull mid-section.
    boom_r = h * 0.042    # strut radius (absolute)
    boom_j = h * 0.060    # jaw total span (absolute)

    # Boom A — port-fwd, LONGEST 4.2 m
    z_ra = -l * 0.145                          # –2.47  root z
    y_ra =  h * 0.030
    fx_a = sf.flank_x(st, z_ra, y_ra)
    hw.grapple_arm(parts, glow, 'boom-a',
                   (-fx_a * 0.66, y_ra,              z_ra),
                   (-(fx_a + 0.10), y_ra + h * 0.05, z_ra - 4.2),
                   hull_mat, glow_mat,
                   radius=boom_r,        jaw=boom_j * 1.12, detail=detail)

    # Boom C — stbd-fwd, MID-LONG 3.2 m
    z_rc = -l * 0.080                          # –1.36
    y_rc =  h * 0.010
    fx_c = sf.flank_x(st, z_rc, y_rc)
    hw.grapple_arm(parts, glow, 'boom-c',
                   ( fx_c * 0.68, y_rc,              z_rc),
                   ( fx_c + 0.09, y_rc + h * 0.04,  z_rc - 3.2),
                   hull_mat, glow_mat,
                   radius=boom_r * 0.88, jaw=boom_j * 0.96, detail=detail)

    # Boom B — port-aft, MID-SHORT 2.6 m
    z_rb =  l * 0.035                          # +0.60
    y_rb = -h * 0.035
    fx_b = sf.flank_x(st, z_rb, y_rb)
    hw.grapple_arm(parts, glow, 'boom-b',
                   (-fx_b * 0.66, y_rb,              z_rb),
                   (-(fx_b + 0.05), y_rb + h * 0.05, z_rb - 2.6),
                   hull_mat, glow_mat,
                   radius=boom_r * 0.80, jaw=boom_j * 0.86, detail=detail)

    # Boom D — stbd-aft, SHORTEST 1.9 m
    z_rd =  l * 0.110                          # +1.87
    y_rd = -h * 0.060
    fx_d = sf.flank_x(st, z_rd, y_rd)
    hw.grapple_arm(parts, glow, 'boom-d',
                   ( fx_d * 0.64, y_rd,              z_rd),
                   ( fx_d + 0.06, y_rd + h * 0.04,  z_rd - 1.9),
                   hull_mat, glow_mat,
                   radius=boom_r * 0.72, jaw=boom_j * 0.74, detail=detail)

    # ── ❽ Three vault blocks — mid zone, on stand-off pads ──────────────────
    # Vault-a: large dorsal, port-of-centre.  ly = top_y + sy*0.5 so the
    # vault bottom is flush with the hull top and the pads (_PAD_H=0.20)
    # extend 0.20 units into the hull → connectivity satisfied.
    va_sz = (1.80, 1.00, 2.20)
    va_z  = -l * 0.059    # –1.00
    va_x  =  b * 0.040
    va_ty = sf.top_y(st, va_z, va_x)
    va_ly = va_ty + va_sz[1] * 0.5
    hw.vault_block(parts, glow, 'vault-a',
                   (va_x, va_ly, va_z),
                   hull_mat, glow_mat, va_sz, detail=detail, pads=4)

    # Vault-b: medium dorsal, stbd-of-centre and aft.
    vb_sz = (1.40, 0.80, 1.70)
    vb_z  =  l * 0.090    # +1.53
    vb_x  =  b * 0.100
    vb_ty = sf.top_y(st, vb_z, vb_x)
    vb_ly = vb_ty + vb_sz[1] * 0.5
    hw.vault_block(parts, glow, 'vault-b',
                   (vb_x, vb_ly, vb_z),
                   hull_mat, glow_mat, vb_sz, detail=detail, pads=4)

    # Vault-c: small port flank; right (+X) face 0.14 inside hull for
    # body overlap, satisfying the connectivity requirement (pads=0).
    vc_sz = (1.00, 0.70, 1.40)
    vc_z  = -l * 0.028    # –0.48
    vc_y  =  mid_yo
    vc_fx = sf.flank_x(st, vc_z, vc_y)
    vc_lx = -(vc_fx + vc_sz[0] * 0.5 - 0.14)   # right face 0.14 inside hull
    hw.vault_block(parts, glow, 'vault-c',
                   (vc_lx, vc_y, vc_z),
                   hull_mat, glow_mat, vc_sz, detail=detail, pads=0)

    # ── ❾ Four shutter wells — closed weapon positions ──────────────────────
    sw_sz = (0.90, 0.50, 1.20)
    for sw_name, sw_z, sw_x in (
            ('sw-port-fwd', -l * 0.118, -b * 0.140),
            ('sw-stbd-fwd', -l * 0.118,  b * 0.140),
            ('sw-port-aft',  l * 0.065,  -b * 0.140),
            ('sw-stbd-aft',  l * 0.065,   b * 0.140),
    ):
        sw_ty = sf.top_y(st, sw_z, sw_x)
        hw.shutter_well(parts, sw_name,
                        (sw_x, sw_ty - sw_sz[1] * 0.5, sw_z),
                        hull_mat, sw_sz, plates=2, open_frac=0.0, detail=detail)

    # ── ❿ Donor 1 — Ferrous Hegemony armour rib belt, port deck ─────────────
    # The backing's -Y face is buried 0.12 units below the deck surface,
    # satisfying the >= 0.10 connectivity requirement.
    # Placement: port-of-centre on the citadel deck, forward mid zone.
    fr_sz  = (1.80, 0.56, 3.60)   # full bounding box of rib belt
    fr_z   = -l * 0.040            # –0.68  centre Z
    fr_x   = -b * 0.080            # –0.71  port of centre
    fr_dty = sf.top_y(st, fr_z, fr_x)
    # ly = top_y + sy/2 - 0.12: backing bottom at top_y - 0.12 (buried)
    fr_ly  = fr_dty + fr_sz[1] * 0.5 - 0.12
    dn.donor_ferrous_ribs(parts, glow, 'donor-ferrous',
                          (fr_x, fr_ly, fr_z),
                          hull_mat, glow_mat,
                          fr_sz, detail=detail, n_ribs=6)

    # Weld straps at both Z ends of the rib belt (cross the donor/hull boundary)
    fr_strap_y = fr_ly    # strap at the bounding-box centre height
    fr_strap_sx = fr_sz[0] * 0.72   # narrower than full donor width
    fr_strap_sy = 0.10               # strap thickness
    fr_strap_sz = 0.40               # span ±0.20 from each Z-end
    for fs_name, fs_z in (
            ('fs-strap-fwd', fr_z - fr_sz[2] * 0.5),
            ('fs-strap-aft', fr_z + fr_sz[2] * 0.5),
    ):
        dn.weld_strap(parts, fs_name,
                      (fr_x, fr_strap_y, fs_z),
                      hull_mat,
                      (fr_strap_sx, fr_strap_sy, fr_strap_sz),
                      bolts=5, detail=detail)

    # Cut edges at both Z ends
    fr_back_h = fr_sz[1] * 0.30   # backing height (_BACK_FRAC = 0.30)
    fr_back_cy = (fr_ly - fr_sz[1] * 0.5) + fr_back_h * 0.5
    for fc_name, fc_z in (
            ('fc-edge-fwd', fr_z - fr_sz[2] * 0.5),
            ('fc-edge-aft', fr_z + fr_sz[2] * 0.5),
    ):
        dn.cut_edge(parts, fc_name,
                    (fr_x, fr_back_cy, fc_z),
                    hull_mat,
                    (fr_sz[0] * 0.88, fr_back_h, 0.06),
                    teeth=5, detail=detail)

    # ── ⓫ Donor 2 — Gilded Chain scale panel, citadel deck stbd-biased ──────
    # The backing's -Y face is buried 0.12 units below the deck surface.
    # Scale tiles and ivory edge trim protrude above hull surface.
    gp_sz  = (1.60, 0.40, 2.80)   # full bounding box of scale panel
    gp_z   =  l * 0.080            # +1.36  centre Z
    gp_x   =  b * 0.068            # +0.60  stbd of centre
    gp_dty = sf.top_y(st, gp_z, gp_x)
    # ly = top_y + sy/2 - 0.12: backing bottom at top_y - 0.12 (buried)
    gp_ly  = gp_dty + gp_sz[1] * 0.5 - 0.12
    dn.donor_gilded_panel(parts, glow, 'donor-gilded',
                          (gp_x, gp_ly, gp_z),
                          hull_mat, glow_mat,
                          gp_sz, detail=detail)

    # Weld straps at both Z ends of the scale panel
    gp_strap_y  = gp_ly
    gp_strap_sx = gp_sz[0] * 0.70
    gp_strap_sy = 0.09
    gp_strap_sz = 0.40
    for gs_name, gs_z in (
            ('gp-strap-fwd', gp_z - gp_sz[2] * 0.5),
            ('gp-strap-aft', gp_z + gp_sz[2] * 0.5),
    ):
        dn.weld_strap(parts, gs_name,
                      (gp_x, gp_strap_y, gs_z),
                      hull_mat,
                      (gp_strap_sx, gp_strap_sy, gp_strap_sz),
                      bolts=4, detail=detail)

    # Cut edges at both Z ends
    gp_back_h  = gp_sz[1]  # full backing = full sy (gilded panel is all-slab at backing)
    gp_back_cy = gp_ly      # backing centre = loc (box centre)
    for gc_name, gc_z in (
            ('gc-edge-fwd', gp_z - gp_sz[2] * 0.5),
            ('gc-edge-aft', gp_z + gp_sz[2] * 0.5),
    ):
        dn.cut_edge(parts, gc_name,
                    (gp_x, gp_back_cy, gc_z),
                    hull_mat,
                    (gp_sz[0] * 0.84, gp_sz[1], 0.06),
                    teeth=5, detail=detail)

    # ── ⓬ STERN — three mismatched captured drives + two radiator panels ─────
    # PORT CLUSTER: two drives (drive-a r=0.62, drive-b r=0.42) — heavier.
    # STBD SINGLE:  one drive  (drive-c r=0.50)                  — lighter.
    # 3 drives × 2 nozzles = 6 countable nozzles total.

    # Drive-a: port lower, large (r=0.62, 2 nozzles)
    z_da  = l * 0.428            # +7.28
    y_da  = mid_yo - h * 0.058
    fx_da = sf.flank_x(st, z_da, y_da)
    lx_da = -(fx_da + 0.62 * 1.20 - 0.20)   # right face 0.20 inside hull
    hw.captured_drive(parts, glow, 'drive-a',
                      (lx_da, y_da, z_da),
                      hull_mat, glow_mat,
                      radius=0.62, depth=1.38, nozzles=2, detail=detail)

    # Drive-b: port upper, small (r=0.42, 2 nozzles)
    z_db  = l * 0.404            # +6.87
    y_db  = mid_yo + h * 0.075
    fx_db = sf.flank_x(st, z_db, y_db)
    lx_db = -(fx_db + 0.42 * 1.20 - 0.20)
    hw.captured_drive(parts, glow, 'drive-b',
                      (lx_db, y_db, z_db),
                      hull_mat, glow_mat,
                      radius=0.42, depth=0.96, nozzles=2, detail=detail)

    # Drive-c: stbd, medium (r=0.50, 2 nozzles)
    z_dc  = l * 0.416            # +7.07
    y_dc  = mid_yo - h * 0.020
    fx_dc = sf.flank_x(st, z_dc, y_dc)
    lx_dc =  fx_dc + 0.50 * 1.20 - 0.20    # left face 0.20 inside hull
    hw.captured_drive(parts, glow, 'drive-c',
                      (lx_dc, y_dc, z_dc),
                      hull_mat, glow_mat,
                      radius=0.50, depth=1.16, nozzles=2, detail=detail)

    # Radiator panels — pulled flush against the flanks (inner face inboard,
    # outer face at the hull surface) so the booms, not the radiators, define
    # spanX.  Connectivity: each slab is half-buried (full thickness inboard).
    # Port: larger slab, z ≈ +6.40
    z_rpa  = l * 0.376           # +6.39
    fx_rpa = sf.flank_x(st, z_rpa, 0.0)
    rpa_sz = (0.80, 2.10, 2.80)  # (full extents: thick, tall, deep)
    lx_rpa = -(fx_rpa - rpa_sz[0] * 0.5)   # outer face flush with hull flank
    hw.radiator_panel(parts, 'radiator-port',
                      (lx_rpa, mid_yo - h * 0.030, z_rpa),
                      hull_mat, rpa_sz, detail=detail)

    # Stbd: smaller slab, slightly different z (asymmetry)
    z_rpb  = l * 0.392           # +6.66
    fx_rpb = sf.flank_x(st, z_rpb, 0.0)
    rpb_sz = (0.60, 1.60, 2.20)
    lx_rpb =  fx_rpb - rpb_sz[0] * 0.5     # outer face flush with hull flank
    hw.radiator_panel(parts, 'radiator-stbd',
                      (lx_rpb, mid_yo + h * 0.050, z_rpb),
                      hull_mat, rpb_sz, detail=detail)

    # ── ⓭ Lamp runs — five short segments, each seated at its own station ──────
    # A straight strip across the 6.34-unit citadel run drifts off the hull at
    # sections where flank_x differs from the single anchor z: the hull widens
    # into the mid-citadel and narrows again toward the stern, so a strip anchored
    # at min(flank_anchor(z0), flank_anchor(z1)) makes contact at one end only.
    # Fix: divide into n_seg equal segments; each is anchored at its own midpoint z
    # using straight_top(zm)-0.06 for y and flank_anchor(zm, y, 0.03) for x.
    # The strip outer face equals flank_x at each midpoint → shared voxel → one
    # 26-connected component.  Segment count equals the original lamp count (5)
    # so spacing, count and emissive budget are unchanged.
    z_lr0   = -l * 0.155           # –2.64  bow end of run
    z_lr1   =  l * 0.218           # +3.71  stern end of run
    _lr_run = z_lr1 - z_lr0
    _n_seg  = max(1, int(_lr_run / sf.LAMP_SPACING))   # 5 segs → 5 lamps
    _lr_dz  = _lr_run / _n_seg
    for _si in range(_n_seg):
        _z0   = z_lr0 + _si       * _lr_dz
        _z1   = z_lr0 + (_si + 1) * _lr_dz
        _zm   = (_z0 + _z1) * 0.5
        _lr_y = sf.straight_top(st, _zm) - 0.06
        _xs   = sf.flank_anchor(st, _zm, _lr_y, 0.03)
        hw.lamp_run(parts, glow, 'lamp-stbd.%d' % _si,
                     _xs, _lr_y, _z0, _z1,
                     glow_mat, hull_mat, sf.LAMP_SPACING, detail=detail)
        hw.lamp_run(parts, glow, 'lamp-port.%d' % _si,
                    -_xs, _lr_y, _z0, _z1,
                     glow_mat, hull_mat, sf.LAMP_SPACING, detail=detail)

    # ── ⓮ Flank port windows — amber slits, low on flanks (detail ≥ 2) ──────
    if detail >= 2:
        pw_z0 = -l * 0.195       # –3.32  forward bound of window zone
        pw_z1 =  l * 0.235       # +3.99  aft bound
        pw_run = pw_z1 - pw_z0
        n_win  = max(1, int(pw_run / sf.PORT_SPACING))
        if detail < 3:
            n_win = max(1, n_win // 2)
        pw_pitch = pw_run / n_win
        wy_low   = -h * 0.085    # low on flank, near keel
        for wi in range(n_win):
            wz  = pw_z0 + (wi + 0.5) * pw_pitch
            wx  = sf.flank_anchor(st, wz, wy_low, sf.FLANK_PORT[0] * 0.5)
            if wx > 0.0:
                kit.box(glow, 'win.%02d' % wi, kit.ROLE_ACCENT,
                        (-wx, wy_low, wz), sf.FLANK_PORT, glow_mat)

    # ── ⓯ Handrail beside vault walk (detail ≥ 2) ────────────────────────────
    if detail >= 2:
        rail_z0  = va_z - va_sz[2] * 0.5 - 0.10
        rail_z1  = vb_z + vb_sz[2] * 0.5 + 0.10
        rail_len = rail_z1 - rail_z0
        rail_cz  = (rail_z0 + rail_z1) * 0.5
        rail_cy  = sf.top_y(st, rail_cz, b * 0.06)
        kit.handrail(parts, 'vault-rail',
                     (b * 0.06, rail_cy, rail_cz),
                     hull_mat, rail_len, axis='z', posts=4)

    # ── ⓰ Greeble field on aft deck — lod0 vertex supplement (detail = 3) ───
    if detail >= 3:
        gf_z0  = vb_z + vb_sz[2] * 0.5 + 0.12
        gf_z1  = z_mid_seam - 0.12
        gf_run = gf_z1 - gf_z0
        gf_cz  = (gf_z0 + gf_z1) * 0.5
        gf_ty  = sf.top_y(st, gf_cz)
        gf_sy  = h * 0.08
        kit.greeble_field(parts, 'greeble-aft', A,
                          (0.0, gf_ty - gf_sy * 0.5, gf_cz),
                          (mid_hw * 1.20, gf_sy, gf_run),
                          hull_mat, seed=71, count=14, detail=detail)
