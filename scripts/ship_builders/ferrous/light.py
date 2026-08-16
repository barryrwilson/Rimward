"""Ferrous Hegemony Light — PICKET GUNSHIP.

No-op port of the pilot ``_light`` builder. Geometry is unchanged.
Shared armour / hardware modules are not consumed in this wave.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from .surface import (
    PORT_LIGHT as _PORT_LIGHT,
    PORT_SPACING as _PORT_SPACING,
    RESCUE_LAMP as _RESCUE_LAMP,
    RESCUE_PANNIER as _RESCUE_PANNIER,
    STATUS_SLIT as _STATUS_SLIT,
)


# =============================================================================
def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
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
