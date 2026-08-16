"""Veridian Combine Heavy — CLAIM-ENFORCEMENT SHIP.

Body: short keel + compact HEX STACK (file of four + two dorsal cans).
Not a long dart. Not a scaled cutter slab.

Bible §4.1 Heavy: armoured core, recessed weapons, sample vaults,
blunt legal prow.

Envelope: l=17.0 b=8.84 h=5.78. Aim span ~16.8–17.4.
G2: cradle wings reach 3.20. G3: 4-nozzle drive + radiator pair.
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
_N = 4
_Z0 = -8.10
_Z1 = 8.00


def _can_z(i):
    mid = (_Z0 + _Z1) * 0.5
    span = _PITCH * (_N - 1)
    return mid - span * 0.5 + i * _PITCH


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Claim-enforcement: compact hex stack on a short keel."""
    md.keel_spine(parts, 'heavy.keel', hull_mat, _Z0, _Z1,
                  half_w=0.28, half_h=0.22, detail=detail)

    zs = [_can_z(i) for i in range(_N)]
    for i, z in enumerate(zs):
        md.hex_module(parts, 'heavy.can.%d' % i, hull_mat,
                      (0.0, 0.06, z), size=(1.20, 1.00, 1.40),
                      detail=detail)

    md.hex_module(parts, 'heavy.cit.a', hull_mat,
                  (0.0, 0.72, zs[1]), size=(0.90, 0.72, 1.10),
                  detail=detail)
    md.hex_module(parts, 'heavy.cit.b', hull_mat,
                  (0.0, 0.72, zs[2]), size=(0.90, 0.72, 1.10),
                  detail=detail)

    hw.survey_head(parts, glow, 'heavy.head', hull_mat, glow_mat,
                   (0.0, 0.10, _Z0 + 0.40), size=(1.40, 0.86, 1.00),
                   detail=detail)
    if detail >= 1:
        md.recess_well(parts, glow, 'heavy.facet', hull_mat, glow_mat,
                       (0.48, 0.16, zs[0]), facing='starboard',
                       detail=detail)

    hw.sample_vault(parts, 'heavy.vault.a', hull_mat,
                    (0.0, -0.42, zs[1]), detail=detail)
    hw.sample_vault(parts, 'heavy.vault.b', hull_mat,
                    (0.0, -0.42, zs[2]), detail=detail)

    if detail >= 2:
        for i, z in enumerate((zs[1], zs[2])):
            md.recess_well(parts, glow, 'heavy.gun.%d' % i, hull_mat, glow_mat,
                           (0.52, 0.10, z), facing='starboard',
                           detail=1)

    hw.cradle_wing(parts, 'heavy.wing.p', hull_mat,
                   (-0.85, -0.20, zs[1]), reach=3.20, facing='port',
                   detail=detail)
    hw.cradle_wing(parts, 'heavy.wing.s', hull_mat,
                   (0.85, -0.20, zs[1]), reach=3.20, facing='starboard',
                   detail=detail)

    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, 0.04, _Z1 + 0.12), 0.40, 0.28, nozzles=4,
                  depth=0.52, detail=detail)
    hw.radiator(parts, 'heavy.rad.p', hull_mat,
                (-0.40, 0.16, zs[3]), size=(0.16, 0.90, 1.40),
                detail=detail)
    hw.radiator(parts, 'heavy.rad.s', hull_mat,
                (0.40, 0.16, zs[3]), size=(0.16, 0.90, 1.40),
                detail=detail)
    kit.box(parts, 'heavy.rad.p.seat.spine', kit.ROLE_HULL,
            (-0.18, 0.10, zs[3]), (0.40, 0.24, 0.90), hull_mat)
    kit.box(parts, 'heavy.rad.s.seat.spine', kit.ROLE_HULL,
            (0.18, 0.10, zs[3]), (0.40, 0.24, 0.90), hull_mat)

    if detail >= 2:
        hw.navigation_light(parts, glow, 'heavy.nav.p', hull_mat, glow_mat,
                            (-0.55, 0.40, zs[0]), detail=detail)
        hw.navigation_light(parts, glow, 'heavy.nav.s', hull_mat, glow_mat,
                            (0.55, 0.40, zs[3]), detail=detail)
