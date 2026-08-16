"""Veridian Combine Ace — PATENT DEMONSTRATOR.

Body: one fused hex capsule + two hex tail booms. Not a lofted slab.
Fewer seams than the rest of the fleet. No zone collar. No plate course.

Bible §4.1 Ace: oversized emerald aperture, high-output drive, split-tail.

Envelope: l=7.2 b=2.88 h=1.44. Aim span ~7.7–8.0 (at or above light).
G2: split-tail boom length 1.72.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import modules as md
from . import hardware as hw

_Z0 = -3.60
_Z1 = 2.05
_BOOM = 1.72


def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Patent demonstrator: fused hex body and split hex tail."""
    md.keel_spine(parts, 'ace.keel', hull_mat, _Z0, _Z1 + _BOOM * 0.35,
                  half_w=0.14, half_h=0.12, detail=detail)

    md.hex_module(parts, 'ace.body', hull_mat, (0.0, 0.04, -0.55),
                  size=(1.05, 0.78, 3.05), detail=detail)

    hw.survey_head(parts, glow, 'ace.head', hull_mat, glow_mat,
                   (0.0, 0.06, _Z0 + 0.36), size=(1.35, 0.70, 1.05),
                   detail=detail)

    z_boom = _Z1 + _BOOM * 0.35
    md.hex_module(parts, 'ace.boom.p', hull_mat, (-0.48, 0.00, z_boom),
                  size=(0.52, 0.44, _BOOM), detail=detail)
    md.hex_module(parts, 'ace.boom.s', hull_mat, (0.48, 0.00, z_boom),
                  size=(0.52, 0.44, _BOOM), detail=detail)

    kit.box(parts, 'ace.yoke.spine', kit.ROLE_HULL,
            (0.0, 0.00, _Z1 + 0.06), (1.10, 0.22, 0.36), hull_mat)

    hw.drive_face(parts, glow, 'ace.drive.p', hull_mat, glow_mat,
                  (-0.48, 0.00, z_boom + _BOOM * 0.48), 0.20, 0.16,
                  nozzles=2, depth=0.48, detail=detail)
    hw.drive_face(parts, glow, 'ace.drive.s', hull_mat, glow_mat,
                  (0.48, 0.00, z_boom + _BOOM * 0.48), 0.20, 0.16,
                  nozzles=2, depth=0.48, detail=detail)

    if detail >= 2:
        md.flush_plate(parts, 'ace.plate', hull_mat,
                       (0.38, 0.10, -0.40), facing='starboard',
                       detail=detail)
        hw.navigation_light(parts, glow, 'ace.nav.p', hull_mat, glow_mat,
                            (-0.42, 0.22, -1.20), detail=detail)
        hw.navigation_light(parts, glow, 'ace.nav.s', hull_mat, glow_mat,
                            (0.42, 0.22, -0.20), detail=detail)
