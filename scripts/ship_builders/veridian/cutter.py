"""Veridian Combine Cutter — INSPECTION LAUNCH.

Body: slim keel + FIVE hex cans in a single file. Not a wide loft blade.

Bible §4.1 Cutter: forward impound collar, evidence lockers on the
spine, paired survey drones flush in the sides.

Envelope: l=11.0 b=5.28 h=3.30. Aim span ~11.0. Keep spanX ≤ 5.0 so
the derived proxy covers ≥ 80 % (len/beam ≥ 2.2).
G2: ventral-biased cradle wings, reach 2.00 (≥ 1.65).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import modules as md
from . import hardware as hw

_CAN = sf.HEX_MODULE
_PITCH = _CAN[2] - 0.18
_N = 5
_Z0 = -5.20
_Z1 = 5.05


def _can_z(i):
    mid = (_Z0 + _Z1) * 0.5
    span = _PITCH * (_N - 1)
    return mid - span * 0.5 + i * _PITCH


def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Inspection launch: five hex cans on a slim keel."""
    md.keel_spine(parts, 'cutter.keel', hull_mat, _Z0, _Z1,
                  half_w=0.18, half_h=0.15, detail=detail)

    zs = [_can_z(i) for i in range(_N)]
    for i, z in enumerate(zs):
        md.hex_module(parts, 'cutter.can.%d' % i, hull_mat,
                      (0.0, 0.04, z), detail=detail)

    hw.docking_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      (0.0, 0.04, _Z0 + 0.10), facing='nose',
                      detail=detail)
    hw.survey_head(parts, glow, 'cutter.head', hull_mat, glow_mat,
                   (0.0, 0.10, _Z0 + 0.55), size=(0.72, 0.42, 0.56),
                   detail=detail)

    n_lock = 4 if detail >= 3 else (2 if detail >= 2 else (1 if detail >= 1 else 0))
    for i in range(n_lock):
        hw.evidence_locker(parts, 'cutter.lock.%d' % i, hull_mat,
                           (0.0, 0.42, zs[1] + i * 0.48), detail=detail)

    if detail >= 1:
        hw.survey_drone(parts, glow, 'cutter.drone.p', hull_mat, glow_mat,
                        (-0.38, 0.04, zs[2]), detail=detail)
        hw.survey_drone(parts, glow, 'cutter.drone.s', hull_mat, glow_mat,
                        (0.38, 0.04, zs[2]), detail=detail)

    hw.cradle_wing(parts, 'cutter.wing.p', hull_mat,
                   (-0.55, -0.28, zs[2]), reach=2.00, facing='port',
                   detail=detail)
    hw.cradle_wing(parts, 'cutter.wing.s', hull_mat,
                   (0.55, -0.28, zs[2]), reach=2.00, facing='starboard',
                   detail=detail)

    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, 0.0, _Z1 + 0.10), 0.28, 0.20, nozzles=4,
                  depth=0.46, detail=detail)

    if detail >= 2:
        md.recess_well(parts, glow, 'cutter.hatch', hull_mat, glow_mat,
                       (0.40, 0.04, zs[3]), facing='starboard',
                       detail=detail)
        hw.navigation_light(parts, glow, 'cutter.nav.p', hull_mat, glow_mat,
                            (-0.40, 0.22, zs[1]), detail=detail)
        hw.navigation_light(parts, glow, 'cutter.nav.s', hull_mat, glow_mat,
                            (0.40, 0.22, zs[3]), detail=detail)
