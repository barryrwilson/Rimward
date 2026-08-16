"""Ferrous Hegemony Cutter — PATROL LAUNCH.

No-op port of the pilot ``_cutter`` builder. Geometry is unchanged.
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
def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
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
