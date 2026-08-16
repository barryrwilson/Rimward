"""Ferrous Hegemony Freighter — FLEET LOGISTICS CARRIER.

No-op port of the pilot ``_freighter`` builder. Geometry is unchanged.
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
def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
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
