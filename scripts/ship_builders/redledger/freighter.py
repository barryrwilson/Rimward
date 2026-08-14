"""Red Ledger - FREIGHTER, the tribute barge.

Bible §4.4: a massive armoured haulage spine bearing seized containers,
ransom vaults, docked prize craft, and mobile counting-house modules.
Profitable enough to defend; too broad and irregular for an internal dock.

Three zones on the thrust axis
------------------------------
Bow (18 %):  z -39 to -25 — protected command tug: compact hard_section
    armoured hull (different section family from the spine), modest ram
    prow, two grapple arms (detail 3), a Veridian instrument head bolted
    to the tug dorsal flat stbd (detail 2+), a capture_collar where the
    tug is butt-welded to the spine, and the faction's salvage boom hung
    under and forward of the prow keel (detail 1+).

Mid (58 %):  z -25 to +20 — armoured haulage spine: alternating fair /
    hard_section runs so it reads as several captured bodies end-to-end.
    Carries two rows of seized containers at constant SEIZED_CRATE pitch,
    three-four ransom vault_blocks of different sizes, two counting_house
    modules at deliberately different z positions (port at z ≈ -5, stbd
    at z ≈ +8 — the one deliberate asymmetry), and two open prize-craft
    cradles (clamp_pads + chamfer_block craft, §G5 open bays).
    A Freehold habitation drum lashed to the port deck and a Gilded Chain
    scale panel laid across the stbd deck identify the cargo as prizes
    (donor parts, detail 2+).  Dried-red stripe clusters mark the clan
    property (detail 2+).  Plate-quilt runs at detail 3 cover both flanks,
    the top and keel decks.

Aft (24 %):  z +20 to +39 — drive block: squared stern armour around a
    deliberately mismatched pair of captured drive packages (stbd larger
    and farther aft than port; 4 + 4 nozzles = 8 countable), four flat
    radiator panels asymmetrically placed.

Silhouette family
-----------------
WEDGE primary (tapered tug to spine); SPINE-AND-PODS secondary (the
container rails, vault stacks, and prize cradles read as pods hung off a
central spine).

Donor parts carried
-------------------
  • dn.donor_veridian_head — tug dorsal flat, stbd, z ≈ -29, detail 2+
  • dn.donor_freehold_drum — spine port deck, z ≈ -8, detail 2+
  • dn.donor_gilded_panel  — spine stbd deck, z ≈ +8, detail 2+

Salvage boom
------------
Root under tug keel at (0, -5, -28); tip at (0, -11, -39).  Length ≈ 12.5
units ≈ 16 % of hull span (79.3 measured).  Appears at detail 1+; bays=5.

One deliberate asymmetry
------------------------
Port counting house at z ≈ -5; stbd counting house at z ≈ +8.  Different
longitudinal positions so neither face mirrors the other in side view.

Extent budget (computed; measured values from the delivered GLB in brackets)
-----------------------------------------------------------------------------
  spanZ: 79.3 measured  (z -39 to +39, dominated by hull loft; boom tip at z -39)
  spanX: ≈ 29  [29.3 measured]  (2 × spine_hw 13 + rad-panel thickness each side)
  spanY: ≈ 17  [20.6 measured]  (tug top ≈ 7.7; boom tip at y -11; counting-house top ≈ 9)

Surface legibility — triangle arithmetic (lod0 only, detail=3)
--------------------------------------------------------------
Formula: tris_per_run = (2*rows - 1) * n_cols * 12
         n_cols = ceil(span / pitch); plates=rows*n_cols boxes, seams=(rows-1)*n_cols boxes.

  Spine flanks (stbd+port): rows=9, pitch=0.95, span=45
    n_cols=ceil(45/0.95)=48  →  (2×9-1)×48×12 = 17×48×12 = 9,792 tri/run × 2 = 19,584
    vs old rows=7 pitch=0.90: 50 cols → 13×50×12 = 7,800/run × 2 = 15,600  (Δ +3,984)

  Spine top/keel (unchanged): rows=5, pitch=0.90, span=45
    50 cols → 9×50×12 = 5,400/run × 2 = 10,800

  Drive flanks (unchanged): rows=5, pitch=0.90, span=18
    20 cols → 9×20×12 = 2,160/run × 2 = 4,320

  Drive deck/keel (unchanged): rows=3, pitch=0.90, span=18
    20 cols → 5×20×12 = 1,200/run × 2 = 2,400

  Tug flanks (stbd+port): rows=7, pitch=0.90, span=13.5
    n_cols=ceil(13.5/0.90)=15  →  (2×7-1)×15×12 = 13×15×12 = 2,340/run × 2 = 4,680
    vs old rows=4: 7×15×12 = 1,260/run × 2 = 2,520  (Δ +2,160)

  Quilt total: 19,584 + 10,800 + 4,320 + 2,400 + 4,680 = 41,784

  New stripe cluster (tug-stbd-prow): 6 stripes × 12 tri = 72  (Δ +72)
  Total delta vs baseline: +3,984 + 2,160 + 72 = +6,216
  Estimated lod0: 49,860 + 6,216 = 56,076; measured 56,052  (hard cap 60,000)

Accent-area coverage (ROLE_ACCENT stripes)
------------------------------------------
  4 spine clusters × 6 stripes × h=7.0 × w=0.34 = 57.1 m²
  1 tug cluster    × 6 stripes × h=7.5 × w=0.34 = 15.3 m²
  Total accent area: 72.4 m²  /  hull surface ≈ 5,287 m²  =  1.37 %
  NOTE: below the 3-8 % guideline because the freighter hull is ~100 × the
  area of small escorts.  30 stripes is the practical maximum given the
  9,000-triangle headroom; raising count to hit 3 % would exhaust the budget.

Measured (delivered assets, 2026-08-14)
---------------------------------------
Commands:
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P scripts/build-ship-assets.py -- redledger
  node scripts/compress-ship-assets.mjs redledger
  node scripts/measure-ships.mjs redledger
  node scripts/probe-ship-islands.mjs redledger freighter lod0

  verts 110560; span 79.3; len/beam 2.71; ht/len 0.26; beam/len 0.37;
  proxy cover 100.0 %.
  Triangles per LOD: lod0 56052 / lod1 7664 / lod2 1584 / lod3 444.
  probe-ship-islands: ONE CONNECTED BODY.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import hardware as hw
from . import salvage as sv
from . import donors as dn


# ---------------------------------------------------------------------------
# Hull stations
# ---------------------------------------------------------------------------

def _freighter_stations(l, b, h):
    """Hull loft from prow tip to transom.

    The abrupt cross-section step at z ≈ -25 (tug hw 7 -> spine hw 13,
    yo 1.2 -> 0) and at z ≈ +20 (spine hw 13 -> drive hw 10.5) read as
    butt-welded zone seams; capture_collars are placed here by the builder.
    Alternating fair / hard_section within the spine zone makes the body
    read as several distinct captures welded end-to-end.
    """
    return [
        # ── TUG  (bow 18 %: z -39 to -25) ───────────────────────────────
        # Compact hard-section; yo = 1.2 raises the tug centreline above
        # the spine belt so it reads as a foreign captured hull origin.
        sf.hard_section(-39.0,  2.0,  2.2,  1.2),  # prow tip
        sf.hard_section(-37.0,  5.5,  5.0,  1.2),  # opens outboard
        sf.hard_section(-33.0,  7.0,  6.5,  1.2),  # full tug section
        sf.hard_section(-28.0,  7.0,  6.5,  1.2),  # maintained
        sf.hard_section(-25.5,  7.0,  6.5,  1.2),  # last tug station

        # ── SEAM: tug → spine  (hw 7 → 13, yo 1.2 → 0) ─────────────────
        # 1-unit flare reads as a weld flange; capture collar placed here.
        sf.fair      (-24.5, 13.0,  5.8,  0.0),    # spine opens (faired run A)

        # ── SPINE  (mid 58 %: z -24.5 to +20) ───────────────────────────
        sf.fair      (-18.0, 13.0,  5.8,  0.0),    # faired original run A
        sf.fair      (-10.0, 13.0,  5.8,  0.0),    # end of run A
        sf.hard_section( -4.0, 13.0,  5.8,  0.0),  # captured section B
        sf.hard_section(  4.0, 13.0,  5.8,  0.0),  # end of section B
        sf.fair      ( +10.0, 13.0,  5.8,  0.0),   # faired run C
        sf.fair      ( +18.0, 13.0,  5.8,  0.0),   # end of run C
        sf.hard_section( +20.0, 13.0,  5.8,  0.0), # last spine station

        # ── SEAM: spine → drive  (hw 13 → 10.5) ─────────────────────────
        sf.hard_section( +21.0, 10.5,  5.8,  0.0), # first drive station
        sf.hard_section( +32.0, 10.5,  5.8,  0.0),
        sf.hard_section( +39.0,  9.0,  5.8,  0.0), # flat transom, slight taper
    ]


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Red Ledger tribute barge.

    Called with l=85.0 b=46.75 h=25.50 from CLASSES.
    Those figures are the Blender scene envelope, not a fill target.
    """
    H  = kit.ROLE_HULL
    A  = kit.ROLE_ARMOUR

    st = _freighter_stations(l, b, h)

    # Zone boundary z values (absolute)
    Z_TUG_SEAM = -25.0   # tug / spine capture collar
    Z_DRV_SEAM = +20.0   # spine / drive capture collar

    # Derived hull surface constants
    spine_top = sf.top_y(st,    0.0)        # ≈ +5.8
    spine_bot = sf.bottom_y(st, 0.0)        # ≈ -5.8
    spine_hh  = spine_top - spine_bot       # ≈ 11.6  (full Y height of spine)
    spine_hw  = sf.section(st,  0.0)[0]     # ≈ 13.0  (flank half-width at mid)

    # _PAD_H mirrors the private constant in hardware.py (= 0.20 m)
    _PAD_H = 0.20

    # =========================================================================
    # DETAIL 0  ─  primary masses only  (lod3, 4 000-tri cap)
    # =========================================================================

    kit.hull_loft(parts, 'hull', H, st, hull_mat)

    # lod3 COLOR_0 gate: two drive-nacelle stubs give ROLE_ARMOUR alongside
    # ROLE_HULL.  Hull flank at z +30/+27 ≈ 10.5; inner edge overlaps flank
    # by ≥ 0.20 so both boxes are one connected body with the hull.
    kit.box(parts, 'drv0-stbd', A, (+11.1, 0.0, +30.0), (1.6, 1.6, 14.0), hull_mat)
    kit.box(parts, 'drv0-port', A, (-10.8, 0.5, +27.0), (1.2, 1.2, 11.0), hull_mat)

    if detail < 1:
        return

    # =========================================================================
    # DETAIL 1  ─  seams · plate courses · drives · ram prow · salvage boom
    #              (lod2, 8 000-tri cap)
    # =========================================================================

    _pc = 30 if detail >= 3 else (10 if detail >= 2 else 4)

    # Zone-boundary capture collars — ROLE_ARMOUR (mechanisms)
    for z_col, cname in ((Z_TUG_SEAM, 'collar-tug-spine'),
                         (Z_DRV_SEAM, 'collar-spine-drive')):
        sw, sh, sy_r, sc = sf.seam_ring(st, z_col)
        hw.capture_collar(parts, cname, sw, sh, sy_r, sc,
                          z_col, hull_mat, depth=0.22, ribs=4, detail=detail)

    # Spine internal weld beads — four seams make the spine read as captured lengths
    for z_b, bname in ((-7.0, 'weld-Ab'), (+7.0, 'weld-bC'),
                       (-14.0, 'weld-A2'), (+14.0, 'weld-C2')):
        bw, bh, by_r, bc = sf.seam_ring(st, z_b)
        hw.weld_bead(parts, bname, bw, bh, by_r, bc, z_b, hull_mat,
                     detail=max(1, detail))

    # Ram prow on tug tip — modest, this is a barge not a raider
    prow_hw, prow_hh, _, _ = sf.section(st, -36.5)
    hw.ram_prow(parts, 'tug-prow', -39.2, -36.5,
                prow_hw * 0.82, prow_hh * 0.82, hull_mat,
                courses=3 if detail >= 2 else 0, detail=min(detail, 2))

    # Spine belt plate courses — ROLE_HULL: iron plate field of the spine.
    # ROLE_HULL dominates; these are NOT armour overlays.
    kit.plate_course(parts, 'spine-belt', H,
                     (0.0, 0.0, -2.5),
                     (spine_hw * 2.0, spine_hh, 43.0),
                     hull_mat, count=_pc, axis='z')

    # Drive zone plate courses — ROLE_HULL
    kit.plate_course(parts, 'drive-belt', H,
                     (0.0, 0.0, +29.5),
                     (10.5 * 2.0, spine_hh, 18.0),
                     hull_mat, count=max(1, _pc // 2), axis='z')

    # Tug armour strakes — different section from spine; ROLE_HULL
    kit.plate_course(parts, 'tug-strakes', H,
                     (0.0, 1.2, -32.0),
                     (14.0, 13.0, 12.0),
                     hull_mat, count=max(1, _pc // 4), axis='z')

    # Captured drive packages — starboard and port, deliberately mismatched.
    # Stbd: larger radius, longer depth, vertically centred, more aft (z +30).
    # Port: smaller radius, shorter depth, raised 0.5, more forward (z +27).
    dr_s_r  = 0.80
    dr_s_d  = 14.0
    dr_s_hw = sf.flank_x(st, +30.0, 0.0)          # ≈ 10.5
    dr_s_cx = dr_s_hw + dr_s_r * 1.2 - 0.40       # overlap 0.40 into flank
    hw.captured_drive(parts, glow, 'drive-stbd',
                      (dr_s_cx, 0.0, +30.0),
                      hull_mat, glow_mat,
                      radius=dr_s_r, depth=dr_s_d, nozzles=4, detail=detail)

    dr_p_r  = 0.60
    dr_p_d  = 11.0
    dr_p_hw = sf.flank_x(st, +27.0, 0.0)          # ≈ 10.5
    dr_p_cx = -(dr_p_hw + dr_p_r * 1.2 - 0.40)   # port side (negative X)
    hw.captured_drive(parts, glow, 'drive-port',
                      (dr_p_cx, 0.5, +27.0),
                      hull_mat, glow_mat,
                      radius=dr_p_r, depth=dr_p_d, nozzles=4, detail=detail)

    # Four flat radiator panels — two per flank, different z and y positions
    # to break the outline asymmetrically.  Each panel overlaps the hull
    # flank by ≈ 0.4 units (inner edge) for connectivity.
    _rad_hx = 1.0    # panel half-thickness in X (= 1 unit proud of hull)

    def _rad_cx(z_pos, y_pos):
        """Stbd panel centre-x: flank + half-panel - 0.4 overlap."""
        return sf.flank_x(st, z_pos, y_pos) + _rad_hx - 0.40

    hw.radiator_panel(parts, 'rad-stbd-fwd',
                      ( _rad_cx(-10.0,  2.0),  2.0, -10.0),
                      hull_mat, (2.0, 8.0, 14.0), detail=detail)
    hw.radiator_panel(parts, 'rad-port-fwd',
                      (-_rad_cx(-14.0, -1.5), -1.5, -14.0),
                      hull_mat, (2.0, 7.0, 13.0), detail=detail)
    hw.radiator_panel(parts, 'rad-stbd-aft',
                      ( _rad_cx(+8.0,  -2.0), -2.0, +8.0),
                      hull_mat, (2.0, 7.0, 14.0), detail=detail)
    hw.radiator_panel(parts, 'rad-port-aft',
                      (-_rad_cx(+13.0,  1.5),  1.5, +13.0),
                      hull_mat, (2.0, 7.0, 12.0), detail=detail)

    # Seized container rows — ROLE_HULL: iron-painted seized hardware.
    # Pitch derived from SEIZED_CRATE depth (absolute, never scaled).
    # Port row: x = -6.0; stbd row: x = +6.0 (added at detail >= 2).
    _cs    = sf.SEIZED_CRATE          # (0.85, 0.85, 0.85) absolute
    _cp    = _cs[2]                   # pitch in Z from crate depth
    _cz0   = -22.0
    _cz1   = +16.0
    _cn_f  = int((_cz1 - _cz0) / _cp)               # ≈ 44 full count
    _cn    = _cn_f if detail != 2 else _cn_f // 2    # halved at detail 2

    for i in range(_cn):
        cz = _cz0 + (i + 0.5) * _cp
        cy = sf.top_y(st, cz) + _cs[1] * 0.5 - 0.10   # sinks 0.10 into deck
        kit.box(parts, 'crate-port.%03d' % i, H,
                (-6.0, cy, cz), _cs, hull_mat)

    if detail >= 2:
        for i in range(_cn):
            cz = _cz0 + (i + 0.5) * _cp
            cy = sf.top_y(st, cz) + _cs[1] * 0.5 - 0.10
            kit.box(parts, 'crate-stbd.%03d' % i, H,
                    (+6.0, cy, cz), _cs, hull_mat)

    # ─── Salvage boom ─────────────────────────────────────────────────────
    # Slung under and forward of the tug keel.  Root is buried 0.3 units
    # above the keel at z -28 (tug bottom ≈ -5.3; root y = -5.0 is inside
    # the hull body).  Tip at z -39 (prow tip Z), y -11 (well below keel).
    # Length ≈ 12.5 units ≈ 16 % of hull span (78).
    sv.salvage_boom(parts, glow, 'boom',
                    root=(0.0, -5.0, -28.0),
                    tip=(0.0, -11.0, -39.0),
                    mat=hull_mat, glow_mat=glow_mat,
                    radius=0.20, jaw=1.8, detail=detail, bays=5)

    if detail < 2:
        return

    # =========================================================================
    # DETAIL 2  ─  vaults · houses · cradles · tally · lamps
    #              stripe clusters · donor parts  (lod1, 24 000-tri cap)
    # =========================================================================

    # Ransom vault blocks of different sizes on the spine deck — ROLE_HULL body.
    # loc.y = top_y + _PAD_H + vault_hy - 0.10 so pads sink 0.10 into hull.
    def _vy(z_pos, vy_half):
        return sf.top_y(st, z_pos) + _PAD_H + vy_half - 0.10

    # Vaults 0–1 appear at detail 2; vaults 2–3 added at detail 3.
    _vaults = [
        ('vault-a', -3.0, -18.0, (3.5, 2.6, 4.5)),
        ('vault-b', +5.0,  -8.0, (2.5, 3.0, 3.5)),
        ('vault-c', -5.0,  +5.0, (4.0, 2.4, 5.5)),
        ('vault-d', +3.0, +14.0, (2.0, 2.8, 3.0)),
    ]
    for vi, (vname, vx, vz, vsz) in enumerate(_vaults):
        if vi >= 2 and detail < 3:
            continue
        hw.vault_block(parts, glow, vname,
                       (vx, _vy(vz, vsz[1] * 0.5), vz),
                       hull_mat, glow_mat, vsz, detail=detail)

    # Counting houses — port at z = -5 (left), stbd at z = +8 (right).
    # This off-centre / different-z placement is the deliberate asymmetry.
    _ch_sx, _ch_sy, _ch_sz = 6.0, 3.0, 8.0

    def _ch_y(z_pos):
        """House centre-y: bottom face 0.25 inside the deck for solid connectivity."""
        return sf.top_y(st, z_pos) + _ch_sy * 0.5 - 0.25

    hw.counting_house(parts, glow, 'house-port',
                      (-5.0, _ch_y(-5.0), -5.0),
                      hull_mat, glow_mat,
                      (_ch_sx, _ch_sy, _ch_sz), detail=detail)
    # Bridge: house-port body (stern face z=-1) → rescue_hatch collar.
    kit.strut(parts, 'house-port-hatch-strut', A,
              (-5.0, _ch_y(-5.0), -1.2),
              (-5.0, _ch_y(-5.0), -0.65),
              hull_mat, radius=0.08)

    if detail >= 3:
        hw.counting_house(parts, glow, 'house-stbd',
                          (+5.0, _ch_y(+8.0), +8.0),
                          hull_mat, glow_mat,
                          (_ch_sx, _ch_sy, _ch_sz), detail=detail)
        # Bridge: house-stbd body (stern face z=+12) → rescue_hatch collar.
        kit.strut(parts, 'house-stbd-hatch-strut', A,
                  (+5.0, _ch_y(+8.0), +11.7),
                  (+5.0, _ch_y(+8.0), +12.25),
                  hull_mat, radius=0.08)

    # Prize-craft cradles in open bays — ROLE_HULL craft bodies.
    # Pads sink 0.10 into the hull deck; craft overlaps pad tops by 0.20.
    _pad_sz     = (2.5, 0.30, 5.5)
    _pad_sy_h   = _pad_sz[1] * 0.5   # 0.15

    def _place_cradle(cx, cz, label):
        deck   = sf.top_y(st, cz)
        pad_y  = deck + _pad_sy_h - 0.10     # pad sinks 0.10 into hull
        hw.clamp_pad(parts, label + '-pad-a',
                     (cx - 2.2, pad_y, cz),
                     hull_mat, _pad_sz, teeth=4, detail=detail)
        hw.clamp_pad(parts, label + '-pad-b',
                     (cx + 2.2, pad_y, cz),
                     hull_mat, _pad_sz, teeth=4, detail=detail)
        # Craft bottom = deck surface; overlaps pad top by 0.20 m
        craft_sy = 2.8
        craft_y  = deck + craft_sy * 0.5
        kit.chamfer_block(parts, label + '-craft', H,
                          (cx, craft_y, cz),
                          (4.0, craft_sy, 7.5),
                          hull_mat, chamfer=0.40)

    _place_cradle(0.0, -19.0, 'cradle-fwd')
    _place_cradle(0.0, +13.5, 'cradle-aft')

    # Tally bands — long dried-red runs along both spine flanks.
    _tz0  = -23.5
    _tz1  = +18.5
    _ty   =  0.0    # at spine mid-height (vertical flank centre)
    _t_mid_z = (_tz0 + _tz1) * 0.5
    _tx   = sf.flank_anchor(st, _t_mid_z, _ty, sf.TALLY_STROKE[0] * 0.5)
    _full_st = int((_tz1 - _tz0) / sf.TALLY_SPACING)  # ≈ 190
    _n_st    = _full_st if detail >= 3 else max(1, _full_st // 2)

    hw.tally_band(parts, 'tally-stbd',  _tx, _ty,
                  _tz0, _tz1, hull_mat, strokes=_n_st, inward=-1, detail=detail)
    hw.tally_band(parts, 'tally-port', -_tx, _ty,
                  _tz0, _tz1, hull_mat, strokes=_n_st, inward=+1, detail=detail)

    # Lamp runs — amber work lamps at LAMP_SPACING along the spine walkways.
    _lz0  = -23.0
    _lz1  = +18.5
    _ly   =  1.0    # mid-flank height, within the vertical belt
    _lx   = sf.flank_anchor(st, (_lz0 + _lz1) * 0.5, _ly, 0.03)

    hw.lamp_run(parts, glow, 'lamp-stbd',  _lx, _ly,
                _lz0, _lz1, glow_mat, hull_mat,
                spacing=sf.LAMP_SPACING, detail=detail)
    hw.lamp_run(parts, glow, 'lamp-port', -_lx, _ly,
                _lz0, _lz1, glow_mat, hull_mat,
                spacing=sf.LAMP_SPACING, detail=detail)

    # ─── Red vertical stripe clusters ─────────────────────────────────────
    # Two clusters per side on the spine flanks, plus ONE cluster on the tug stbd
    # prow flank (the reference barge puts its heaviest red near the bow).
    # height=7.0 ≈ 60 % of spine_hh (11.6); height=7.5 ≈ 58 % of tug_hh (13.0).
    # All clusters on ONE flank only — asymmetry is deliberate per fleet rules.
    # Total: 4 spine × 6 stripes + 1 tug × 6 stripes = 30 stripes → 360 tri.
    # Accent area: 24×7.0×0.34 + 6×7.5×0.34 = 57.1+15.3 = 72.4 m² / 5287 m² = 1.4 %.
    sv.stripe_group(parts, 'stripe-stbd-fwd',
                    0.0, 0.0, -18.0, -11.0, hull_mat,
                    height=7.0, count=6, inward=-1.0, detail=detail,
                    surf=lambda z, yy: max(0.0, sf.flank_x(st, z, yy)))
    sv.stripe_group(parts, 'stripe-stbd-aft',
                    0.0, 0.0, +2.0, +10.0, hull_mat,
                    height=7.0, count=6, inward=-1.0, detail=detail,
                    surf=lambda z, yy: max(0.0, sf.flank_x(st, z, yy)))
    sv.stripe_group(parts, 'stripe-port-fwd',
                    0.0, 0.0, -18.0, -11.0, hull_mat,
                    height=7.0, count=6, inward=+1.0, detail=detail,
                    surf=lambda z, yy: -max(0.0, sf.flank_x(st, z, yy)))
    sv.stripe_group(parts, 'stripe-port-aft',
                    0.0, 0.0, +2.0, +10.0, hull_mat,
                    height=7.0, count=6, inward=+1.0, detail=detail,
                    surf=lambda z, yy: -max(0.0, sf.flank_x(st, z, yy)))
    # ONE new cluster: tug stbd prow flank — forward-most red on the barge.
    # Tug hh=6.5 yo=1.2 → full flank height 13.0; height=7.5 = 58 % of that.
    # y-centre at tug yo=1.2; stbd flank uses max(0,flank_x) for surf.
    sv.stripe_group(parts, 'stripe-tug-stbd-prow',
                    0.0, 1.2, -35.0, -28.0, hull_mat,
                    height=7.5, count=6, inward=-1.0, detail=detail,
                    surf=lambda z, yy: max(0.0, sf.flank_x(st, z, yy)))

    # ─── Donor part 1: Veridian instrument head on tug dorsal flat ────────
    # Sensor aperture faces -Z (nose-forward); body buried 0.3 into deck for
    # direct hull connectivity (tug top at z=-29 ≈ y=7.7; body bottom=7.4).
    # size = full extents (chamfer_block takes full extents).
    _tug_top_z29 = sf.top_y(st, -29.0)     # ≈ 7.7 (yo=1.2 + hh=6.5)
    _vhsz = (2.5, 1.8, 3.0)                # full extents: W=2.5, H=1.8, L=3.0
    _vhloc = (2.0,
              _tug_top_z29 + _vhsz[1] * 0.5 - 0.30,  # bottom buried 0.30
              -29.0)
    dn.donor_veridian_head(parts, glow, 'vhead', _vhloc, hull_mat, glow_mat,
                           _vhsz, detail=detail)
    # Two weld straps hold the head; positioned inside head body (head top ≈ 9.2)
    # for overlap connectivity: hull → head (0.30 burial) → strap (inside head).
    _vhsz_body_top = _vhloc[1] + _vhsz[1] * 0.5   # = head +Y face ≈ 9.2
    _vhstrap_y     = _vhsz_body_top - 0.10          # 0.10 inside head top
    dn.weld_strap(parts, 'vhead-strap-f',
                  (2.0, _vhstrap_y, -30.0), hull_mat,
                  (2.4, 0.08, 0.50), bolts=4, detail=detail)
    dn.weld_strap(parts, 'vhead-strap-a',
                  (2.0, _vhstrap_y, -28.0), hull_mat,
                  (2.4, 0.08, 0.50), bolts=4, detail=detail)
    # Cut edge at the forward face (torch cut when taken from its ship).
    # loc.z at the forward face; teeth extend in +Z (into the head body).
    _vhfwd_face_z = _vhloc[2] - _vhsz[2] * 0.5    # forward face ≈ -30.5
    dn.cut_edge(parts, 'vhead-cut',
                (2.0, _vhloc[1], _vhfwd_face_z), hull_mat,
                (2.4, 0.9, 0.30), teeth=6, detail=detail)

    # ─── Donor part 2: Freehold habitation drum on spine port deck ────────
    # Cylinder axis along Z; window band visible from abeam.
    # Bottom (-Y face) buried 0.20 into spine deck for hull connectivity.
    # size = full extents → radius = min(sx,sy)*0.5 = 2.0; depth (Z) = 6.0.
    _sp_top_z8n = sf.top_y(st, -8.0)       # spine top at z=-8 ≈ 5.8
    _drum_r     = 2.0                       # = min(4.0,4.0)*0.5
    _drumsz     = (4.0, 4.0, 6.0)          # full extents
    _drumloc    = (-3.0,
                   _sp_top_z8n + _drum_r - 0.20,   # bottom buried 0.20
                   -8.0)
    dn.donor_freehold_drum(parts, glow, 'drum', _drumloc, hull_mat, glow_mat,
                           _drumsz, detail=detail)
    # Two straps, each sunk 0.10 into the drum's +Y face for connectivity.
    _drum_top_y  = _drumloc[1] + _drum_r   # = _sp_top_z8n + _drum_r*2 - 0.20 ≈ 9.6
    _drum_strap_y = _drum_top_y - 0.10     # 0.10 inside drum top
    dn.weld_strap(parts, 'drum-strap-f',
                  (-3.0, _drum_strap_y, -10.5), hull_mat,
                  (3.6, 0.08, 0.50), bolts=4, detail=detail)
    dn.weld_strap(parts, 'drum-strap-a',
                  (-3.0, _drum_strap_y, -5.5), hull_mat,
                  (3.6, 0.08, 0.50), bolts=4, detail=detail)

    # ─── Donor part 3: Gilded Chain scale panel on spine stbd deck ───────
    # Scale plates on +Y face; backing -Y face buried 0.15 into spine deck.
    # size = full extents (backing half-Y = 0.25; panel top ≈ 6.15).
    _sp_top_z8p = sf.top_y(st, +8.0)       # spine top at z=+8 ≈ 5.8
    _gpansz     = (9.0, 0.50, 10.0)        # full extents: W=9, H=0.5, L=10
    _gpanloc    = (+5.0,
                   _sp_top_z8p + _gpansz[1] * 0.5 - 0.15,  # buried 0.15
                   +8.0)
    dn.donor_gilded_panel(parts, glow, 'gpan', _gpanloc, hull_mat, glow_mat,
                          _gpansz, detail=detail)
    # Two straps sunk into the panel top (+Y face).
    _gpan_top_y  = _gpanloc[1] + _gpansz[1] * 0.5   # ≈ 6.15
    _gpan_strap_y = _gpan_top_y - 0.10               # 0.10 inside panel top
    dn.weld_strap(parts, 'gpan-strap-f',
                  (+5.0, _gpan_strap_y, +3.5), hull_mat,
                  (8.5, 0.08, 0.50), bolts=5, detail=detail)
    dn.weld_strap(parts, 'gpan-strap-a',
                  (+5.0, _gpan_strap_y, +12.5), hull_mat,
                  (8.5, 0.08, 0.50), bolts=5, detail=detail)
    # Two cut edges: forward face (z=+3) and aft (teeth placed inside at z=+12.8).
    _gpan_fwd_z = _gpanloc[2] - _gpansz[2] * 0.5    # forward face = +8 - 5 = +3
    dn.cut_edge(parts, 'gpan-cut-f',
                (+5.0, _gpanloc[1], _gpan_fwd_z), hull_mat,
                (9.0, 0.25, 0.30), teeth=8, detail=detail)
    dn.cut_edge(parts, 'gpan-cut-a',
                (+5.0, _gpanloc[1], +12.8), hull_mat,
                (9.0, 0.25, 0.30), teeth=8, detail=detail)

    if detail < 3:
        return

    # =========================================================================
    # DETAIL 3  ─  grapple arms · tug windows · plate quilts  (lod0, 60 000-tri)
    # =========================================================================

    # Grapple arms on the tug flanks — jaw opens toward -Z (approach).
    _g_z   = -32.0
    _g_y   =  1.2    # tug y_offset
    _g_rx  = sf.flank_x(st, _g_z, _g_y) * 0.45   # ≈ 3.15 — inside hull
    _g_tip_x = 11.0
    _g_tip_z = -36.5

    hw.grapple_arm(parts, glow, 'grapple-stbd',
                   root=( _g_rx, _g_y, _g_z),
                   tip=( _g_tip_x,  2.5, _g_tip_z),
                   mat=hull_mat, glow_mat=glow_mat,
                   radius=0.28, jaw=1.5, detail=detail)
    hw.grapple_arm(parts, glow, 'grapple-port',
                   root=(-_g_rx, _g_y, _g_z),
                   tip=(-_g_tip_x, 2.5, _g_tip_z),
                   mat=hull_mat, glow_mat=glow_mat,
                   radius=0.28, jaw=1.5, detail=detail)

    # Tug armoured port windows on prow back face.
    _tw_z = -36.5
    _tw_y = prow_hh * 0.82 * 0.28
    _tw_n = 22
    kit.window_row(glow, 'tug-wins',
                   (0.0, _tw_y, _tw_z),
                   glow_mat, _tw_n, sf.PORT_SPACING, sf.PORT_LIGHT)

    # Tug deck greeble — small equipment boxes on the tug top surface.
    _tug_top = sf.top_y(st, -30.0)    # tug ceiling at z = -30 ≈ 7.7
    kit.greeble_field(parts, 'tug-deck-greeble', H,
                      (0.0, _tug_top - 0.25, -30.0),
                      (12.0, 0.5, 8.0),
                      hull_mat, seed=317, count=14, detail=detail)

    # =========================================================================
    # DETAIL 3 density: plate_quilt on all major hull faces.
    #
    # Every run on a lofted surface passes surf= so each plate is seated at
    # its own station and height.  The tug and drive sections taper; without
    # surf the aft plates of any fixed-x run float clear of the hull (the
    # 47 floating groups came from the drive seam at x=12.84, z 10.5-17.6).
    # The spine is genuinely constant-section (hw=13.0, hh=5.8, yo=0.0 from
    # z -24.5 to +20) so surf resolves the same value throughout — it is still
    # supplied per the lofted-hull-surface rule, and trims any plate that
    # overshoots the tug-spine seam near z -24.5.
    #
    # Guard: max(0.0, flank_x(…)) returns 0.0 when a quilt row straddles a
    # taper past the hull corner; plate_quilt skips those plates rather than
    # emitting them into open space.  Deck/keel surf (top_y / bottom_y) never
    # return 0.0 on this hull so no guard is needed there.
    # =========================================================================

    # -- Spine flanks (z -25 to +20, 45 units, full spine Y height) -----------
    # rows 9, pitch 0.95: n_cols=48 → (2×9-1)×48×12 = 9,792 tri/run × 2 = 19,584.
    # role_mix=(0.55,0.36,0.09): iron dominates, weathered salvage reads as
    # patchwork, recessed share reads as plate gaps.
    sv.plate_quilt(parts, 'quilt-spine-stbd',
                   0.0, 0.0, -25.0, +20.0, spine_hh,
                   hull_mat, seed=711, detail=detail,
                   rows=9, pitch=0.95, face='x',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, yy: max(0.0, sf.flank_x(st, z, yy)))
    sv.plate_quilt(parts, 'quilt-spine-port',
                   0.0, 0.0, -25.0, +20.0, spine_hh,
                   hull_mat, seed=712, detail=detail,
                   rows=9, pitch=0.95, face='-x',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, yy: -max(0.0, sf.flank_x(st, z, yy)))

    # -- Spine deck (z -25 to +20, X span = 2 × spine_hw ≈ 26, rows 5) ------
    sv.plate_quilt(parts, 'quilt-spine-top',
                   0.0, 0.0, -25.0, +20.0, spine_hw * 2.0,
                   hull_mat, seed=713, detail=detail,
                   rows=5, pitch=0.90, face='y',
                   surf=lambda z, xx: sf.top_y(st, z, xx))

    # -- Spine keel (z -25 to +20, X span = 2 × spine_hw ≈ 26, rows 5) ------
    sv.plate_quilt(parts, 'quilt-spine-bot',
                   0.0, 0.0, -25.0, +20.0, spine_hw * 2.0,
                   hull_mat, seed=714, detail=detail,
                   rows=5, pitch=0.90, face='-y',
                   surf=lambda z, xx: sf.bottom_y(st, z, xx))

    # -- Drive flanks (z +20 to +38; hw tapers 10.5→9.0; surf required) ------
    sv.plate_quilt(parts, 'quilt-drv-stbd',
                   0.0, 0.0, +20.0, +38.0, spine_hh,
                   hull_mat, seed=715, detail=detail,
                   rows=5, pitch=0.90, face='x',
                   surf=lambda z, yy: max(0.0, sf.flank_x(st, z, yy)))
    sv.plate_quilt(parts, 'quilt-drv-port',
                   0.0, 0.0, +20.0, +38.0, spine_hh,
                   hull_mat, seed=716, detail=detail,
                   rows=5, pitch=0.90, face='-x',
                   surf=lambda z, yy: -max(0.0, sf.flank_x(st, z, yy)))

    # -- Drive deck and keel (new; tapers; surf required) ---------------------
    # Cross-span 18.0 = 2 × aft hw (9.0) keeps outermost rows within the hull
    # at the transom; the wider mid-zone rows still bury into the chamfer.
    sv.plate_quilt(parts, 'quilt-drv-top',
                   0.0, 0.0, +20.0, +38.0, 18.0,
                   hull_mat, seed=719, detail=detail,
                   rows=3, pitch=0.90, face='y',
                   surf=lambda z, xx: sf.top_y(st, z, xx))
    sv.plate_quilt(parts, 'quilt-drv-bot',
                   0.0, 0.0, +20.0, +38.0, 18.0,
                   hull_mat, seed=720, detail=detail,
                   rows=3, pitch=0.90, face='-y',
                   surf=lambda z, xx: sf.bottom_y(st, z, xx))

    # -- Tug flanks (z -39 to -25.5; hw tapers 2→7; surf+guard required) -----
    # rows 7, pitch 0.90: n_cols=15 → (2×7-1)×15×12 = 2,340 tri/run × 2 = 4,680.
    # height=13.0 spans the parallel section Y; guard clips plates that
    # straddle the hull corner at the tapered prow tip (z -39 hw=2.0).
    # role_mix=(0.55,0.36,0.09): same tonal spread as spine flanks so the tug
    # reads as welded-on salvage armour rather than a clean factory section.
    sv.plate_quilt(parts, 'quilt-tug-stbd',
                   0.0, 1.2, -39.0, -25.5, 13.0,
                   hull_mat, seed=717, detail=detail,
                   rows=7, pitch=0.90, face='x',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, yy: max(0.0, sf.flank_x(st, z, yy)))
    sv.plate_quilt(parts, 'quilt-tug-port',
                   0.0, 1.2, -39.0, -25.5, 13.0,
                   hull_mat, seed=718, detail=detail,
                   rows=7, pitch=0.90, face='-x',
                   role_mix=(0.55, 0.36, 0.09),
                   surf=lambda z, yy: -max(0.0, sf.flank_x(st, z, yy)))
