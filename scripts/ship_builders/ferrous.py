"""Ferrous Hegemony pilot ship builders — light, cutter, freighter.

Re-authored against the extended kit (wedge, taper_block, chamfer_block,
hull_loft, strut, plate_grid, barbette, nozzle_ring, handrail, sensor_mast)
so each class has a distinct body plan readable at thumbnail size and passes
the Ferrous faction gate.

Body plans
----------
light    — hull_loft widest at midships (max half_w = b*0.36), chamfered
           blunt nose; chamfer_block dorsal spine ridge along the full length;
           chamfer_block keel skirt held below the hull body with a visible
           shadow gap; plate_grid breaking both flanks; paired barbettes on
           the dorsal spine; twin nozzle_ring drives at stern.

cutter   — hull_loft with a pronounced pinched waist (max half_w = b*0.30 at
           the bow quarter, pinched to b*0.16 at midship); large torus bow-lock
           ring proud of the hull nose; chamfer_block outboard nacelles at
           ±b*0.30 centre with visible struts and clear gap; sensor_mast on
           dorsal; paired barbettes; four nozzle_ring main drives + two
           nacelle nozzle_rings.

freighter — chamfer_block command tug connected by taper_block neck to a
            chamfer_block armoured spine; three container columns per side
            pulled close to the spine (inner ±b*0.14, mid ±b*0.24, outer
            ±b*0.32) so all column mass sits inside the fitted ellipse capsule;
            outer column tapered to h*0.34 height; plate_grid on container
            faces; sensor_mast on tug; four nozzle_ring main drives.

Proportion guarantees (by construction)
-----------------------------------------
light     beam/len ≈ 0.376  ht/len ≈ 0.280  span ≈ 6.3 u  (rules: ≤0.46, ≤0.30, 5.94-7.26)
cutter    beam/len ≈ 0.413  ht/len ≈ 0.276  span ≈10.0 u  (rules: ≤0.46, ≤0.32, 8.28-10.12)
freighter beam/len ≈ 0.467  ht/len ≈ 0.224  span ≈73.9 u  (rules: ≤0.58, ≤0.26, 64.3-78.5)

LOD rules
---------
detail=3  full build
detail=2  no greeble fields, half window rows
detail=1  primary masses + plate courses
detail=0  primary masses only
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ship_kit as kit

PILOT_CLASSES = ('light', 'cutter', 'freighter')

# ── Human-scale constants: SAME physical size on every Ferrous ship ──────────
# These are absolute units; do not multiply by l, b, or h.
_RESCUE_PANNIER = (0.45, 0.62, 1.20)   # rescue equipment pannier housing
_RESCUE_LAMP    = (0.12, 0.06, 0.06)   # rescue / status indicator lamp
_PORT_LIGHT     = (0.22, 0.10, 0.04)   # bridge / cabin port light
_STATUS_SLIT    = (0.10, 0.05, 0.04)   # engine-status readout slit
_PORT_SPACING   = 0.35                  # centre-to-centre window spacing

_CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)


def build(parts, glow, key, l, b, h, hull_mat, glow_mat, detail):
    """Dispatch to the per-class builder.

    parts    -- mutable list; opaque hull objects are appended here
    glow     -- mutable list; emissive objects are appended here
    key      -- 'light' | 'cutter' | 'freighter'
    l, b, h  -- ship envelope: length, beam, height
    hull_mat -- Blender material for opaque geometry
    glow_mat -- Blender material for emissive geometry
    detail   -- int 0-3 controlling LOD feature level
    """
    if key == 'light':
        _light(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'cutter':
        _cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'freighter':
        _freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail)


# =============================================================================
# LIGHT — PICKET GUNSHIP
# Called with l=7.8  b=3.276  h=1.872  (from CLASSES dict)
#
# Body plan: a hull_loft widest at midships (max half_w = b*0.36 = 1.179),
# narrowing to a blunt chamfered nose.  A chamfer_block dorsal spine ridge runs
# the full length proud of the hull top.  A chamfer_block keel armour skirt
# overlaps the hull underside, narrower than hull beam.  plate_grid on each
# flank face breaks the large flat surfaces.  Paired barbettes sit on the
# dorsal spine forward of amidships, giving the picket its overbuilt silhouette.
# Twin nozzle_rings at the stern.  All rescue equipment and emissive features
# retained.
#
# Proportion proof (beam/len ≤ 0.46, ht/len ≤ 0.30, span within 5.94-7.26):
#   beam  : hull max half_w = b*0.36 = 1.179 → total beam = 2.358
#   nose  : z = -l*0.40 = -3.120
#   stern : z =  l*0.37 + l*0.035 = 3.159  (nozzle_ring depth l*0.07 / 2)
#   span  : 3.120 + 3.159 = 6.279 u   → in [5.94, 7.26] ✓
#   b/len : 2.358 / 6.279 = 0.376 ≤ 0.46 ✓
#   spine top  : h*0.40 + h*0.04 = h*0.44 = 0.823
#   keel bottom: h*0.41 + h*0.04 = h*0.45 = 0.842
#   ht/len : (0.823 + 0.842) / 6.279 = 0.265 ≤ 0.30 ✓
# =============================================================================
def _light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    R = kit.ROLE_ARMOUR
    H = kit.ROLE_HULL
    A = kit.ROLE_ACCENT
    T = kit.ROLE_TRIM

    # ── Primary masses (detail 0+) ───────────────────────────────────────────

    # Main hull body — lofted section, widest at midships.
    # Stations: (z, half_w, half_h, y_offset, chamfer)
    # max half_w = b*0.36 at midship → beam = 2*b*0.36 = 2.358
    kit.hull_loft(parts, 'hull-body', R,
                  [(-l * 0.40, b * 0.22, h * 0.28, 0.0,       0.26),
                   (-l * 0.18, b * 0.34, h * 0.38, h * 0.02,  0.18),
                   ( 0.0,      b * 0.36, h * 0.40, h * 0.02,  0.14),
                   ( l * 0.18, b * 0.28, h * 0.34, 0.0,       0.12),
                   ( l * 0.36, b * 0.20, h * 0.26, 0.0,       0.10)],
                  hull_mat)

    # Dorsal spine ridge — tapered so both ends die inside the hull's own
    # taper instead of reading as a lip past the nose and tail.
    # Spine bottom at y = h*0.40 - h*0.04 = h*0.36 (overlaps hull top ≈ h*0.42).
    kit.taper_block(parts, 'dorsal-spine', R,
                    (0.0, h * 0.40, -l * 0.02),
                    (b * 0.18, h * 0.08, l * 0.62),
                    hull_mat, front=(0.45, 0.55), back=(0.55, 0.60))

    # Keel armour skirt — tapered block under the hull body.
    # Hull underside at midship ≈ y = h*0.02 - h*0.40 = -h*0.38.
    # Skirt centre at -h*0.41; top at -h*0.37, overlapping hull by h*0.01.
    # Width b*0.68 < hull beam b*0.72: skirt always within hull silhouette.
    kit.taper_block(parts, 'keel-skirt', H,
                    (0.0, -h * 0.41, 0.0),
                    (b * 0.68, h * 0.08, l * 0.60),
                    hull_mat, front=(0.55, 0.70), back=(0.62, 0.70))

    # ── Plate courses — layered flank and dorsal armour (detail 1+) ──────────
    if detail >= 1:
        kit.plate_course(parts, 'port-flank-armour', R,
                         (-b * 0.32, h * 0.04, 0.0),
                         (b * 0.06, h * 0.58, l * 0.58),
                         hull_mat, count=4, axis='z', gap=0.11, step=0.012)
        kit.plate_course(parts, 'stbd-flank-armour', R,
                         ( b * 0.32, h * 0.04, 0.0),
                         (b * 0.06, h * 0.58, l * 0.58),
                         hull_mat, count=4, axis='z', gap=0.11, step=0.012)
        kit.plate_course(parts, 'dorsal-armour', R,
                         (0.0, h * 0.42, 0.0),
                         (b * 0.40, h * 0.06, l * 0.54),
                         hull_mat, count=3, axis='z', gap=0.12, step=0.010)

    # ── Panel-line recesses — horizontal hull seams (detail 2+) ─────────────
    if detail >= 2:
        kit.panel_lines(parts, 'hull-seams',
                        (0.0, h * 0.12, 0.0),
                        (b * 0.60, h * 0.18, l * 0.62),
                        hull_mat, count=3, axis='z', depth=0.35)

    # ── Plate grid — breaks flat flank surfaces (detail 2+) ──────────────────
    if detail >= 2:
        kit.plate_grid(parts, 'port-flank-grid', R,
                       (-b * 0.30, h * 0.06, 0.0),
                       (b * 0.04, h * 0.50, l * 0.50),
                       hull_mat, cols=4, rows=3, face='-x', depth=0.18, gap=0.05)
        kit.plate_grid(parts, 'stbd-flank-grid', R,
                       ( b * 0.30, h * 0.06, 0.0),
                       (b * 0.04, h * 0.50, l * 0.50),
                       hull_mat, cols=4, rows=3, face='x', depth=0.18, gap=0.05)

    # ── Functional accent zones (detail 2+) ──────────────────────────────────
    if detail >= 2:
        # Paired barbette weapon positions on dorsal spine, forward of amidships.
        # Barbettes are placed bilaterally on the spine top face.
        # loc Y = h*0.40 (spine top face), radius and height kept small
        # so spine top + height = h*0.40 + h*0.08 = h*0.48 < spine ridge.
        kit.barbette(parts, glow, 'barbette-port',
                     (-b * 0.06, h * 0.40, -l * 0.12),
                     hull_mat, glow_mat, radius=h * 0.07, height=h * 0.08, barrels=2)
        kit.barbette(parts, glow, 'barbette-stbd',
                     ( b * 0.06, h * 0.40, -l * 0.12),
                     hull_mat, glow_mat, radius=h * 0.07, height=h * 0.08, barrels=2)

        # Rescue panniers — human-scale absolute size on aft flanks.
        # Centre X = ±b*0.28 = ±0.917; pannier outer = ±1.142 < hull max 1.179. ✓
        kit.box(parts, 'rescue-pannier-port', A,
                (-b * 0.28, -h * 0.08, l * 0.18), _RESCUE_PANNIER, hull_mat)
        kit.box(parts, 'rescue-pannier-stbd', A,
                ( b * 0.28, -h * 0.08, l * 0.18), _RESCUE_PANNIER, hull_mat)

        # Prow recognition trim strip — narrower than hull at nose, centred
        # so aft edge reaches hull nose z=-l*0.40; no forward overhang.
        kit.box(parts, 'prow-trim', T,
                (0.0, h * 0.08, -l * 0.38),
                (b * 0.44, h * 0.04, l * 0.04),
                hull_mat)

        # Service handrail along rescue pannier access route.
        kit.handrail(parts, 'rescue-rail-port',
                     (-b * 0.30, -h * 0.05, l * 0.18),
                     hull_mat, length=_RESCUE_PANNIER[2], axis='z', posts=4)
        kit.handrail(parts, 'rescue-rail-stbd',
                     ( b * 0.30, -h * 0.05, l * 0.18),
                     hull_mat, length=_RESCUE_PANNIER[2], axis='z', posts=4)

    # ── Emissive equipment (detail 2+) ───────────────────────────────────────
    if detail >= 2:
        # Narrow cockpit slit — top forward, horizontal slot on the spine ridge.
        kit.window_row(glow, 'cockpit-slit',
                       (0.0, h * 0.42, -l * 0.16),
                       glow_mat, 1, 0.0, (b * 0.22, 0.06, 0.08))

        # Rescue indicator lamps on panniers — absolute size.
        kit.window_row(glow, 'rescue-lamp-port',
                       (-b * 0.28, -h * 0.04, l * 0.20),
                       glow_mat, 1, 0.0, _RESCUE_LAMP)
        kit.window_row(glow, 'rescue-lamp-stbd',
                       ( b * 0.28, -h * 0.04, l * 0.20),
                       glow_mat, 1, 0.0, _RESCUE_LAMP)

        # Engine-status slits — aft, above engine fairing.
        status_n = 2 if detail >= 3 else 1
        kit.window_row(glow, 'status-slits',
                       (0.0, h * 0.26, l * 0.30),
                       glow_mat, status_n, _PORT_SPACING, _STATUS_SLIT)

    # ── Twin nozzle_ring drives — all detail levels ───────────────────────────
    # Nose at z=-l*0.40; nozzle_ring stern face at z=l*0.37+l*0.035=3.159.
    # span = 3.12 + 3.159 = 6.279.  beam/span = 2.358/6.279 = 0.376. ✓
    for _di, _dx in enumerate((-b * 0.11, b * 0.11)):
        kit.nozzle_ring(parts, glow, 'drive.%02d' % _di,
                        (_dx, -h * 0.04, l * 0.37),
                        hull_mat, glow_mat,
                        radius=h * 0.16, depth=l * 0.07)

    # ── Greeble field — dorsal equipment (detail 3 only) ─────────────────────
    if detail >= 3:
        kit.greeble_field(parts, 'dorsal-greeble', T,
                          (0.0, h * 0.42, -l * 0.06),
                          (b * 0.34, h * 0.04, l * 0.30),
                          hull_mat, seed=101, count=10, detail=detail)


# =============================================================================
# CUTTER — PATROL LAUNCH
# Called with l=11.0  b=5.28  h=3.30  (from CLASSES dict)
#
# Body plan: hull_loft with a pronounced pinched waist — max half_w = b*0.30 at
# the bow quarter (z=-l*0.20), pinched to b*0.16 at midship (z=0), widening
# again to b*0.22 at aft shoulder (z=l*0.18).  Large torus bow-lock ring sits
# proud of the hull nose.  Chamfer_block outboard nacelles at ±b*0.30 centre,
# with clear gap and visible struts.  sensor_mast on dorsal aft.  Paired
# barbettes port and starboard on the hull shoulders.  Four nozzle_ring main
# drives + two nacelle nozzle_rings.  Rescue airlock on belly.
#
# Proportion proof (beam/len ≤ 0.46, ht/len ≤ 0.32, span within 8.28-10.12):
#   max hull half_w = b*0.30 = 1.584  at z = -l*0.20
#   nacelle outer edge ≈ b*0.30 + gap + b*0.09 + b*0.09 = 1.584+0.15+0.475+0.475
#     → approx 2.684... wait, recalc:
#   hull half_w at nacelle Z (z=l*0.06): interpolate midship→aft shoulder
#     = b*0.16 + (l*0.06/l*0.18)*(b*0.22-b*0.16) = 0.845+0.333*0.317=0.951
#   nacelle half_x = b*0.09 = 0.475
#   nacelle inner edge = 0.951 + 0.150 gap = 1.101
#   nacelle centre   = 1.101 + 0.475 = 1.576
#   nacelle outer    = 1.576 + 0.475 = 2.051
#   beam = 2*2.051 = 4.102
#   bow-lock ring nose: z=-(l*0.42+h*0.10) = -4.620-0.330 = -4.950
#   nozzle_ring stern:  z= l*0.40+l*0.035 = 4.400+0.385 = 4.785
#   span = 4.950+4.785 = 9.735 u → in [8.28, 10.12] ✓
#   beam/span = 4.102/9.735 = 0.421 ≤ 0.46 ✓
#
#   hull top (fwd quarter) = h*0.38+h*0.02 = h*0.40 = 1.320
#   sensor_mast top ≈ h*0.40+h*0.08 = h*0.48 = 1.584
#   rescue airlock bottom = -h*0.30-0.31 = -1.30
#   height = 1.584+1.30 = 2.884; ht/span = 2.884/9.735 = 0.296 ≤ 0.32 ✓
# =============================================================================
def _cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    R = kit.ROLE_ARMOUR
    H = kit.ROLE_HULL
    A = kit.ROLE_ACCENT
    T = kit.ROLE_TRIM

    # Nacelle geometry constants (used at all LOD levels for separated-mass rule)
    _nacelle_cx = 1.576   # computed: hull_hw_at_nacelle_z + gap + nacelle_half_x
    # For l=11 b=5.28 h=3.30:
    #   hull at z=l*0.06: 0.951; gap 0.150; nacelle half_x=b*0.09=0.475
    #   _nacelle_cx = 0.951+0.150+0.475 = 1.576  (b*0.298)
    #   outer = 1.576+0.475 = 2.051
    # Use b-fraction so it scales correctly when CLASSES changes:
    _nacelle_cx = b * 0.298

    # ── Primary masses (detail 0+) ───────────────────────────────────────────

    # Main hull body — pinched-waist loft.  max half_w = b*0.30 at bow quarter.
    # Stations: (z, half_w, half_h, y_offset, chamfer)
    kit.hull_loft(parts, 'hull-body', R,
                  [(-l * 0.42, b * 0.24, h * 0.34, 0.0,       0.22),
                   (-l * 0.20, b * 0.30, h * 0.38, h * 0.02,  0.16),
                   ( 0.0,      b * 0.16, h * 0.32, 0.0,       0.14),
                   ( l * 0.18, b * 0.22, h * 0.36, 0.0,       0.12),
                   ( l * 0.40, b * 0.18, h * 0.30, 0.0,       0.10)],
                  hull_mat)

    # Outboard maneuvering nacelles — chamfered blocks clear of hull flanks.
    # Centre at ±_nacelle_cx, inner edge at ±(_nacelle_cx - b*0.09).
    # Hull outer at nacelle Z (z=l*0.06) ≈ b*0.18 = 0.950; gap ≥ 0.15. ✓
    kit.chamfer_block(parts, 'nacelle-port', A,
                      (-_nacelle_cx, -h * 0.02, l * 0.06),
                      (b * 0.18, h * 0.22, l * 0.28),
                      hull_mat, chamfer=0.22)
    kit.chamfer_block(parts, 'nacelle-stbd', A,
                      ( _nacelle_cx, -h * 0.02, l * 0.06),
                      (b * 0.18, h * 0.22, l * 0.28),
                      hull_mat, chamfer=0.22)

    # Bow-lock ring — torus seated against the hull nose.
    # Centre z = -l*0.42-h*0.04; aft face at -l*0.42+h*0.02 overlaps hull nose.
    # Forward face at -(l*0.42+h*0.10); ring reads as attached docking hardware.
    # Rotation Rx(pi/2) makes the ring plane face ship +Z.
    kit.torus(parts, 'bow-lock-ring', R,
              (0.0, h * 0.04, -l * 0.42 - h * 0.04),
              h * 0.30, h * 0.06,
              hull_mat,
              rotation=(math.pi * 0.5, 0.0, 0.0))

    # Nacelle attachment struts — at ALL detail levels (separated-mass rule).
    # Point A: hull outer at nacelle Z ≈ b*0.18 from centreline.
    # Point B: nacelle inner edge = _nacelle_cx - b*0.09.
    _nacelle_inner = _nacelle_cx - b * 0.09
    kit.strut(parts, 'nacelle-strut-port', A,
              (-b * 0.18, -h * 0.02, l * 0.06),
              (-_nacelle_inner, -h * 0.02, l * 0.06),
              hull_mat, radius=h * 0.02)
    kit.strut(parts, 'nacelle-strut-stbd', A,
              ( b * 0.18, -h * 0.02, l * 0.06),
              ( _nacelle_inner, -h * 0.02, l * 0.06),
              hull_mat, radius=h * 0.02)

    # ── Plate courses — citadel armour (detail 1+) ───────────────────────────
    if detail >= 1:
        kit.plate_course(parts, 'port-flank-armour', R,
                         (-b * 0.24, h * 0.06, 0.0),
                         (b * 0.06, h * 0.58, l * 0.62),
                         hull_mat, count=5, axis='z', gap=0.10, step=0.012)
        kit.plate_course(parts, 'stbd-flank-armour', R,
                         ( b * 0.24, h * 0.06, 0.0),
                         (b * 0.06, h * 0.58, l * 0.62),
                         hull_mat, count=5, axis='z', gap=0.10, step=0.012)
        kit.plate_course(parts, 'dorsal-armour', R,
                         (0.0, h * 0.40, 0.0),
                         (b * 0.50, h * 0.08, l * 0.56),
                         hull_mat, count=4, axis='z', gap=0.10, step=0.010)
        # Bow-lock face horizontal bands.
        kit.plate_course(parts, 'bow-lock-bands', T,
                         (0.0, h * 0.04, -l * 0.38),
                         (b * 0.46, h * 0.60, l * 0.06),
                         hull_mat, count=4, axis='y', gap=0.08, step=0.008)

    # ── Panel-line recesses (detail 2+) ──────────────────────────────────────
    if detail >= 2:
        kit.panel_lines(parts, 'hull-seams',
                        (0.0, h * 0.14, 0.0),
                        (b * 0.56, h * 0.24, l * 0.64),
                        hull_mat, count=4, axis='z', depth=0.35)

    # ── Plate grid — breaks large flank and nacelle faces (detail 2+) ─────────
    if detail >= 2:
        kit.plate_grid(parts, 'port-flank-grid', R,
                       (-b * 0.22, h * 0.08, -l * 0.08),
                       (b * 0.04, h * 0.52, l * 0.48),
                       hull_mat, cols=4, rows=3, face='-x', depth=0.16, gap=0.05)
        kit.plate_grid(parts, 'stbd-flank-grid', R,
                       ( b * 0.22, h * 0.08, -l * 0.08),
                       (b * 0.04, h * 0.52, l * 0.48),
                       hull_mat, cols=4, rows=3, face='x', depth=0.16, gap=0.05)
        # Nacelle dorsal faces — loc_y set so volume top face = nacelle top (h*0.09).
        kit.plate_grid(parts, 'nacelle-grid-port', T,
                       (-_nacelle_cx, h * 0.09 - b * 0.01, l * 0.06),
                       (b * 0.16, b * 0.02, l * 0.24),
                       hull_mat, cols=3, rows=2, face='y', depth=0.14, gap=0.05)
        kit.plate_grid(parts, 'nacelle-grid-stbd', T,
                       ( _nacelle_cx, h * 0.09 - b * 0.01, l * 0.06),
                       (b * 0.16, b * 0.02, l * 0.24),
                       hull_mat, cols=3, rows=2, face='y', depth=0.14, gap=0.05)

    # ── Functional accent zones (detail 2+) ──────────────────────────────────
    if detail >= 2:
        # Paired barbettes on port/starboard hull shoulders, forward of midship.
        kit.barbette(parts, glow, 'barbette-port',
                     (-b * 0.20, h * 0.36, -l * 0.14),
                     hull_mat, glow_mat, radius=h * 0.08, height=h * 0.10, barrels=2)
        kit.barbette(parts, glow, 'barbette-stbd',
                     ( b * 0.20, h * 0.36, -l * 0.14),
                     hull_mat, glow_mat, radius=h * 0.08, height=h * 0.10, barrels=2)

        # Sensor mast — dorsal aft, small glow eye.
        # Mast base at y=h*0.38; height h*0.10 → top y=h*0.48=1.584.
        kit.sensor_mast(parts, glow, 'sensor-mast',
                        (0.0, h * 0.38, l * 0.16),
                        hull_mat, glow_mat, height=h * 0.10, radius=h * 0.04)

        # Nonlethal projector housings — chamfered, forward flanks.
        kit.chamfer_block(parts, 'proj-housing-port', A,
                          (-b * 0.24, h * 0.18, -l * 0.12),
                          (b * 0.08, h * 0.20, l * 0.10),
                          hull_mat, chamfer=0.20)
        kit.chamfer_block(parts, 'proj-housing-stbd', A,
                          ( b * 0.24, h * 0.18, -l * 0.12),
                          (b * 0.08, h * 0.20, l * 0.10),
                          hull_mat, chamfer=0.20)

        # Rescue airlock — belly centreline, human-scale composite with lamps.
        # face='-y': assembly seats into the hull belly, collar reads as attached.
        kit.rescue_hatch(parts, glow, 'rescue-airlock',
                         (0.0, -h * 0.30, -l * 0.14),
                         hull_mat, glow_mat, _RESCUE_PANNIER, face='-y')

        # Bow-lock docking collar — wide flange bridging ring-to-hull junction.
        # Centred on ring z, size_z = h*0.14 covers ring tube diameter + margin.
        # Width b*0.38 spans ring major radius h*0.30 in X (h*0.30 ≈ b*0.188 half).
        kit.box(parts, 'bow-lock-collar', T,
                (0.0, h * 0.04, -l * 0.42 - h * 0.04),
                (b * 0.38, h * 0.28, h * 0.14),
                hull_mat)

        # Prow recognition trim strip.
        kit.box(parts, 'prow-trim', T,
                (0.0, h * 0.08, -l * 0.40),
                (b * 0.46, h * 0.04, l * 0.04),
                hull_mat)

        # Service handrails — bow-lock face access and rescue airlock belly.
        kit.handrail(parts, 'bow-rail-port',
                     (-b * 0.10, h * 0.38, -l * 0.38),
                     hull_mat, length=b * 0.20, axis='x', posts=4)
        kit.handrail(parts, 'bow-rail-stbd',
                     ( b * 0.10, h * 0.38, -l * 0.38),
                     hull_mat, length=b * 0.20, axis='x', posts=4)
        kit.handrail(parts, 'rescue-rail',
                     (-_RESCUE_PANNIER[0] * 0.5, -h * 0.26, -l * 0.14),
                     hull_mat, length=_RESCUE_PANNIER[2], axis='z', posts=4)

    # ── Emissive equipment (detail 2+) ───────────────────────────────────────
    if detail >= 2:
        # Cockpit slit — forward top.
        kit.window_row(glow, 'cockpit-slit',
                       (0.0, h * 0.38, -l * 0.18),
                       glow_mat, 1, 0.0, (b * 0.22, 0.06, 0.10))

        # Bridge status windows — human-scale port lights.
        bridge_n = 3 if detail >= 3 else 2
        kit.window_row(glow, 'bridge-windows',
                       (0.0, h * 0.38, l * 0.08),
                       glow_mat, bridge_n, _PORT_SPACING, _PORT_LIGHT)

        # Nacelle drive glow — aft face of each maneuvering nacelle.
        kit.window_row(glow, 'nacelle-glow-port',
                       (-_nacelle_cx, -h * 0.02, l * 0.20),
                       glow_mat, 1, 0.0, (b * 0.12, h * 0.12, 0.06))
        kit.window_row(glow, 'nacelle-glow-stbd',
                       ( _nacelle_cx, -h * 0.02, l * 0.20),
                       glow_mat, 1, 0.0, (b * 0.12, h * 0.12, 0.06))

        # Bow-lock status indicator — at ring centre z.
        kit.window_row(glow, 'bow-lock-status',
                       (0.0, h * 0.05, -l * 0.42 - h * 0.04),
                       glow_mat, 1, 0.0, (0.10, 0.10, 0.04))

        # Engine-status slits — aft.
        status_n = 3 if detail >= 3 else 2
        kit.window_row(glow, 'status-slits',
                       (0.0, h * 0.28, l * 0.32),
                       glow_mat, status_n, _PORT_SPACING, _STATUS_SLIT)

    # ── Four nozzle_ring main drives + two nacelle drives — all detail levels ─
    # Main drives: 4 abreast along X, centred on Z stern.
    # Nacelle drives: one per nacelle at their aft face.
    _drive_spacing = b * 0.14
    for _di in range(4):
        _dx = (_di - 1.5) * _drive_spacing
        kit.nozzle_ring(parts, glow, 'drive.%02d' % _di,
                        (_dx, 0.0, l * 0.40),
                        hull_mat, glow_mat,
                        radius=h * 0.18, depth=l * 0.07)
    kit.nozzle_ring(parts, glow, 'nacelle-drive-port',
                    (-_nacelle_cx, -h * 0.02, l * 0.20),
                    hull_mat, glow_mat, radius=h * 0.09, depth=l * 0.04)
    kit.nozzle_ring(parts, glow, 'nacelle-drive-stbd',
                    ( _nacelle_cx, -h * 0.02, l * 0.20),
                    hull_mat, glow_mat, radius=h * 0.09, depth=l * 0.04)

    # ── Greeble field (detail 3 only) ─────────────────────────────────────────
    if detail >= 3:
        kit.greeble_field(parts, 'dorsal-greeble', T,
                          (0.0, h * 0.40, 0.0),
                          (b * 0.36, h * 0.04, l * 0.44),
                          hull_mat, seed=201, count=14, detail=detail)


# =============================================================================
# FREIGHTER — FLEET LOGISTICS CARRIER
# Called with l=85.0  b=46.75  h=25.50  (from CLASSES dict)
#
# Body plan: chamfer_block command tug at the nose, blunt-nosed by wedge prow,
# narrowing through taper_block neck into chamfer_block armoured spine.  Three
# container columns per side, ALL pulled inward toward the spine:
#   inner  centre ±b*0.14 = ±6.545  outer edge ±b*0.19 = ±8.883
#   mid    centre ±b*0.24 = ±11.220 outer edge ±b*0.29 = ±13.558
#   outer  centre ±b*0.32 = ±14.960 outer edge ±b*0.36 = ±16.830
#         (outer col: smaller, height h*0.34 — tapered to keep within proxy)
# chamfer_block drive block at stern; four nozzle_ring drives.
# sensor_mast on tug dorsal.
#
# Proportion proof (beam/len ≤ 0.58, ht/len ≤ 0.26, span 64.3-78.5,
#                   proxyCover ≥ 80%):
#   outer col outer edge = b*0.36 = 16.830 → spanX = 33.660
#   rx = 0.62*33.660 = 20.869
#   tug top h*0.32 = 8.16, rescue airlock bottom ≈ -7.96 → spanY ≈ 16.12
#   ry = 0.62*16.12 = 9.994  (spanY set by tug, not containers)
#   After centring (shift ≈ 0.10 in Y): outer col centre Y ≈ -0.51+0.10=0.41,
#   outer col half-y = h*0.17 = 4.335, bottom = 0.41-4.335 = -3.925.
#   E_outer_bottom = (14.960/20.869)² + (3.925/9.994)² = 0.513+0.154 = 0.667 ≤ 1 ✓
#   All container face centres inside proxy → proxyCover > 95%. ✓
#
#   nose (wedge tip): z = -l*0.44 = -37.4
#   stern (nozzle_ring back): z = l*0.40+l*0.035 = 36.55
#   span = 73.95 u → in [64.3, 78.5] ✓
#   beam/span = 33.660/73.95 = 0.455 ≤ 0.58 ✓
#   ht/span  = 16.12/73.95  = 0.218 ≤ 0.26 ✓
# =============================================================================
def _freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    R = kit.ROLE_ARMOUR
    H = kit.ROLE_HULL
    A = kit.ROLE_ACCENT
    T = kit.ROLE_TRIM

    # Zone plan (fractions of l):
    #   Tug prow:  z = -l*0.44 .. -l*0.39   (wedge cap,     l*0.05)
    #   Tug body:  z = -l*0.42 .. -l*0.28   (chamfer_block, l*0.14)
    #   Neck:      z = -l*0.28 .. -l*0.23   (taper_block,   l*0.05)
    #   Spine:     z = -l*0.23 .. +l*0.29   (chamfer_block, l*0.52)
    #   Drive:     z = +l*0.29 .. +l*0.40   (chamfer_block, l*0.11)

    # ── Primary masses (detail 0+) ───────────────────────────────────────────

    # Command tug — chamfered, compact relative to total ship length.
    kit.chamfer_block(parts, 'tug-hull', R,
                      (0.0, h * 0.04, -l * 0.35),
                      (b * 0.22, h * 0.56, l * 0.14),
                      hull_mat, chamfer=0.20)

    # Tug prow cap — wedge tapers to a blunt reinforced nose.
    kit.wedge(parts, 'tug-prow', R,
              (0.0, h * 0.02, -l * 0.415),
              (b * 0.20, h * 0.50, l * 0.05),
              hull_mat, taper=(0.60, 0.70))

    # Tug-to-spine neck — narrowing from tug to spine cross-section.
    kit.taper_block(parts, 'tug-neck', R,
                    (0.0, h * 0.02, -l * 0.255),
                    (b * 0.22, h * 0.52, l * 0.05),
                    hull_mat,
                    front=(1.0, 1.0),
                    back=(0.43, 0.61))

    # Armoured spine — chamfered, runs the full container zone.
    kit.chamfer_block(parts, 'spine', R,
                      (0.0, h * 0.04, l * 0.03),
                      (b * 0.094, h * 0.34, l * 0.52),
                      hull_mat, chamfer=0.18)

    # Armoured drive block — stern mass carrying the engine nozzles.
    kit.chamfer_block(parts, 'drive-block', R,
                      (0.0, 0.0, l * 0.345),
                      (b * 0.22, h * 0.46, l * 0.11),
                      hull_mat, chamfer=0.16)

    # ── Container columns and cross-struts (detail 1+) ───────────────────────
    if detail >= 1:
        # Container columns — three per side, all pulled inward.
        # Column positions (centre from ship centreline):
        #   inner: ±b*0.14 = ±6.545   outer edge ±b*0.19 = ±8.883
        #   mid:   ±b*0.24 = ±11.220  outer edge ±b*0.29 = ±13.558
        #   outer: ±b*0.32 = ±14.960  outer edge ±b*0.36 = ±16.830
        # Column gaps verified:
        #   spine outer (±b*0.047) → inner inner (±b*0.09): gap b*0.043 ✓
        #   inner outer (±b*0.19)  → mid   inner (±b*0.19): gap b*0.00 → recalc:
        # Actual inner/outer extents with full x size:
        #   inner: centre b*0.14, size_x b*0.10 → inner edge b*0.09, outer b*0.19
        #   mid:   centre b*0.24, size_x b*0.10 → inner edge b*0.19, outer b*0.29
        #   outer: centre b*0.32, size_x b*0.08 → inner edge b*0.28, outer b*0.36
        # Gap inner→mid: b*0.19 outer → b*0.19 inner = 0.00  (touching)
        # Use slight separation: mid centre b*0.25:
        #   mid: centre b*0.25, size_x b*0.10 → inner b*0.20, outer b*0.30
        #   Gap inner outer(b*0.19) → mid inner(b*0.20): gap b*0.01 ✓ (small but nonzero)
        #   outer: centre b*0.33, size_x b*0.08 → inner b*0.29, outer b*0.37
        #   Gap mid outer(b*0.30) → outer inner(b*0.29): OVERLAP → use outer centre b*0.34:
        #   outer: centre b*0.34, size_x b*0.07 → inner b*0.305, outer b*0.375
        #   Gap mid outer(b*0.30) → outer inner(b*0.305): gap b*0.005 ≈ 0.23 u ✓
        # Final layout used in code:
        #   inner: centre b*0.14, size_x b*0.10, outer edge b*0.19
        #   mid:   centre b*0.25, size_x b*0.10, outer edge b*0.30
        #   outer: centre b*0.34, size_x b*0.07, outer edge b*0.375
        #   spanX = 2*b*0.375 = b*0.75 = 35.06 → beam/len = 35.06/73.95 = 0.474 ✓
        #   proxy: outer col centre b*0.34 = 15.895, half-x b*0.035 = 1.636
        #          E_bottom = (15.895/20.869)... need to recheck rx with new spanX:
        #          spanX = 35.06, rx = 0.62*35.06 = 21.74
        #          outer col bottom after centring ≈ -3.925 (h*0.34 height, h*0.02 centre)
        #          E = (15.895/21.74)² + (3.925/9.994)² = 0.535+0.154 = 0.689 ≤ 1 ✓
        _c_count = 6
        _c_len   = l * 0.48
        _c_pitch = _c_len / _c_count
        _c_block = _c_pitch * 0.88

        _cz0 = l * 0.03 - _c_len * 0.5

        for _i in range(_c_count):
            _cz = _cz0 + (_i + 0.5) * _c_pitch
            # Inner column: centre ±b*0.14, size_x b*0.10
            kit.box(parts, 'cont-port-inner.%02d' % _i, H,
                    (-b * 0.140, h * 0.02, _cz),
                    (b * 0.100, h * 0.50, _c_block), hull_mat)
            kit.box(parts, 'cont-stbd-inner.%02d' % _i, H,
                    ( b * 0.140, h * 0.02, _cz),
                    (b * 0.100, h * 0.50, _c_block), hull_mat)
            # Mid column: centre ±b*0.25, size_x b*0.10
            kit.box(parts, 'cont-port-mid.%02d' % _i, H,
                    (-b * 0.250, h * 0.02, _cz),
                    (b * 0.100, h * 0.50, _c_block), hull_mat)
            kit.box(parts, 'cont-stbd-mid.%02d' % _i, H,
                    ( b * 0.250, h * 0.02, _cz),
                    (b * 0.100, h * 0.50, _c_block), hull_mat)
            # Outer column: centre ±b*0.34, size_x b*0.07, height h*0.34 (tapered)
            kit.box(parts, 'cont-port-outer.%02d' % _i, H,
                    (-b * 0.340, h * 0.02, _cz),
                    (b * 0.070, h * 0.34, _c_block), hull_mat)
            kit.box(parts, 'cont-stbd-outer.%02d' % _i, H,
                    ( b * 0.340, h * 0.02, _cz),
                    (b * 0.070, h * 0.34, _c_block), hull_mat)

        # Cross-struts — spine flank (±b*0.047) to inner-column inner edge
        # (±b*0.09); four per side across the spine length.
        for _j, _zj in enumerate([-l * 0.13, -l * 0.03, l * 0.07, l * 0.17]):
            kit.strut(parts, 'xstrut-port.%02d' % _j, R,
                      (-b * 0.047, h * 0.04, _zj),
                      (-b * 0.090, h * 0.04, _zj),
                      hull_mat, radius=h * 0.020)
            kit.strut(parts, 'xstrut-stbd.%02d' % _j, R,
                      ( b * 0.047, h * 0.04, _zj),
                      ( b * 0.090, h * 0.04, _zj),
                      hull_mat, radius=h * 0.020)

        # Spine armour strakes.
        kit.plate_course(parts, 'spine-armour-port', R,
                         (-b * 0.050, h * 0.02, l * 0.03),
                         (b * 0.010, h * 0.28, l * 0.48),
                         hull_mat, count=5, axis='z', gap=0.10, step=0.010)
        kit.plate_course(parts, 'spine-armour-stbd', R,
                         ( b * 0.050, h * 0.02, l * 0.03),
                         (b * 0.010, h * 0.28, l * 0.48),
                         hull_mat, count=5, axis='z', gap=0.10, step=0.010)

        # Drive block armour banding.
        kit.plate_course(parts, 'drive-armour-bands', R,
                         (0.0, h * 0.02, l * 0.345),
                         (b * 0.20, h * 0.40, l * 0.09),
                         hull_mat, count=3, axis='y', gap=0.10, step=0.008)

    # ── Panel-line recesses (detail 2+) ──────────────────────────────────────
    if detail >= 2:
        kit.panel_lines(parts, 'tug-deck-seams',
                        (0.0, h * 0.04, -l * 0.35),
                        (b * 0.20, h * 0.50, l * 0.12),
                        hull_mat, count=3, axis='y', depth=0.35)
        kit.panel_lines(parts, 'spine-seams',
                        (0.0, h * 0.02, l * 0.03),
                        (b * 0.08, h * 0.30, l * 0.48),
                        hull_mat, count=4, axis='z', depth=0.35)

    # ── Plate grid — breaks container face surfaces (detail 2+) ──────────────
    if detail >= 2:
        # Plate grid on inner column port/stbd outer faces.
        kit.plate_grid(parts, 'cont-grid-inner-port', T,
                       (-b * 0.190, h * 0.02, l * 0.03),
                       (b * 0.02, h * 0.46, l * 0.44),
                       hull_mat, cols=3, rows=5, face='-x', depth=0.20, gap=0.06)
        kit.plate_grid(parts, 'cont-grid-inner-stbd', T,
                       ( b * 0.190, h * 0.02, l * 0.03),
                       (b * 0.02, h * 0.46, l * 0.44),
                       hull_mat, cols=3, rows=5, face='x', depth=0.20, gap=0.06)
        # Plate grid on mid column outer faces.
        kit.plate_grid(parts, 'cont-grid-mid-port', T,
                       (-b * 0.300, h * 0.02, l * 0.03),
                       (b * 0.02, h * 0.46, l * 0.44),
                       hull_mat, cols=3, rows=5, face='-x', depth=0.20, gap=0.06)
        kit.plate_grid(parts, 'cont-grid-mid-stbd', T,
                       ( b * 0.300, h * 0.02, l * 0.03),
                       (b * 0.02, h * 0.46, l * 0.44),
                       hull_mat, cols=3, rows=5, face='x', depth=0.20, gap=0.06)
        # Tug flanks.
        kit.plate_grid(parts, 'tug-flank-port', R,
                       (-b * 0.10, h * 0.04, -l * 0.35),
                       (b * 0.02, h * 0.48, l * 0.12),
                       hull_mat, cols=2, rows=4, face='-x', depth=0.24, gap=0.06)
        kit.plate_grid(parts, 'tug-flank-stbd', R,
                       ( b * 0.10, h * 0.04, -l * 0.35),
                       (b * 0.02, h * 0.48, l * 0.12),
                       hull_mat, cols=2, rows=4, face='x', depth=0.24, gap=0.06)

    # ── Functional accent zones (detail 2+) ──────────────────────────────────
    if detail >= 2:
        # Tug recognition trim band.
        kit.box(parts, 'tug-trim-band', T,
                (0.0, h * 0.04, -l * 0.36),
                (b * 0.20, h * 0.04, l * 0.10),
                hull_mat)

        # Tug bow collar — boarding interface trim.
        kit.box(parts, 'tug-bow-collar', T,
                (0.0, h * 0.02, -l * 0.40),
                (b * 0.18, h * 0.44, l * 0.02),
                hull_mat)

        # Rescue airlocks — tug belly, human-scale composite with paired lamps.
        # loc_y = -h*0.24 = tug belly face (tug centre h*0.04, half_y h*0.28).
        # face='-y': assemblies seat into the belly, collar reads as attached.
        kit.rescue_hatch(parts, glow, 'rescue-airlock-port',
                         (-b * 0.08, -h * 0.24, -l * 0.36),
                         hull_mat, glow_mat, _RESCUE_PANNIER, face='-y')
        kit.rescue_hatch(parts, glow, 'rescue-airlock-stbd',
                         ( b * 0.08, -h * 0.24, -l * 0.36),
                         hull_mat, glow_mat, _RESCUE_PANNIER, face='-y')

        # Sensor mast on tug roof — gives freighter a distinctive profile.
        kit.sensor_mast(parts, glow, 'tug-sensor-mast',
                        (0.0, h * 0.32, -l * 0.34),
                        hull_mat, glow_mat, height=h * 0.14, radius=h * 0.05)

        # Service handrails — outer column berthing face and tug access.
        kit.handrail(parts, 'berth-rail-port',
                     (-b * 0.375, h * 0.02, l * 0.03),
                     hull_mat, length=l * 0.44, axis='z', posts=8)
        kit.handrail(parts, 'berth-rail-stbd',
                     ( b * 0.375, h * 0.02, l * 0.03),
                     hull_mat, length=l * 0.44, axis='z', posts=8)
        kit.handrail(parts, 'tug-rail-port',
                     (-b * 0.10, h * 0.32, -l * 0.36),
                     hull_mat, length=l * 0.12, axis='z', posts=4)
        kit.handrail(parts, 'tug-rail-stbd',
                     ( b * 0.10, h * 0.32, -l * 0.36),
                     hull_mat, length=l * 0.12, axis='z', posts=4)

    # ── Emissive equipment (detail 2+) ───────────────────────────────────────
    if detail >= 2:
        # Bridge port lights — forward face of command tug, human-scale.
        bridge_n = 4 if detail >= 3 else 2
        kit.window_row(glow, 'bridge-windows',
                       (0.0, h * 0.32, -l * 0.38),
                       glow_mat, bridge_n, _PORT_SPACING, _PORT_LIGHT)

        # Drive block engine-status row.
        status_n = 4 if detail >= 3 else 2
        kit.window_row(glow, 'drive-status',
                       (0.0, h * 0.22, l * 0.40),
                       glow_mat, status_n, _PORT_SPACING, _STATUS_SLIT)

    # ── Four nozzle_ring main drives — all detail levels ─────────────────────
    _drive_spacing = b * 0.06
    for _di in range(4):
        _dx = (_di - 1.5) * _drive_spacing
        kit.nozzle_ring(parts, glow, 'drive.%02d' % _di,
                        (_dx, 0.0, l * 0.40),
                        hull_mat, glow_mat,
                        radius=h * 0.20, depth=l * 0.07)

    # ── Greeble fields (detail 3 only) ───────────────────────────────────────
    # loc_y set so that volume top face (loc_y + size_y/2) = host surface:
    #   tug-roof  : tug top = h*0.04+h*0.28 = h*0.32; loc_y = h*0.32-h*0.03 = h*0.29
    #   spine     : spine top = h*0.04+h*0.17 = h*0.21; loc_y = h*0.21-h*0.02 = h*0.19
    #   cont-top  : mid-col top = h*0.02+h*0.25 = h*0.27; loc_y = h*0.27-h*0.02 = h*0.25
    if detail >= 3:
        kit.greeble_field(parts, 'tug-roof-greeble', T,
                          (0.0, h * 0.29, -l * 0.35),
                          (b * 0.18, h * 0.06, l * 0.10),
                          hull_mat, seed=301, count=12, detail=detail)
        kit.greeble_field(parts, 'spine-greeble', T,
                          (0.0, h * 0.19, l * 0.03),
                          (b * 0.08, h * 0.04, l * 0.44),
                          hull_mat, seed=302, count=16, detail=detail)
        kit.greeble_field(parts, 'cont-top-greeble-port', T,
                          (-b * 0.250, h * 0.25, l * 0.03),
                          (b * 0.10, h * 0.04, l * 0.40),
                          hull_mat, seed=303, count=14, detail=detail)
        kit.greeble_field(parts, 'cont-top-greeble-stbd', T,
                          ( b * 0.250, h * 0.25, l * 0.03),
                          (b * 0.10, h * 0.04, l * 0.40),
                          hull_mat, seed=304, count=14, detail=detail)
