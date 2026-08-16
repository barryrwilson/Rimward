"""Veridian Combine Frigate — SURVEY COMMAND.

Body: long keel + a FILE of hex cans + a raised registry stack.
Not a scaled heavy slab.

Bible §4.1 Frigate: registry/data citadel, instrument fins, two launch
bays, armour on archive and bridge.

Envelope: l=32.0 b=12.48 h=8.32. Aim span ~31–33.
G2: cradle reach 5.20. G3: 6-nozzle drive + radiators.
G5: nested scout pierces the starboard bay can.
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
_N = 10
_Z0 = -15.40
_Z1 = 15.30


def _can_z(i):
    mid = (_Z0 + _Z1) * 0.5
    span = _PITCH * (_N - 1)
    return mid - span * 0.5 + i * _PITCH


def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Survey command: hex string, citadel stack, one nested scout."""
    md.keel_spine(parts, 'frigate.keel', hull_mat, _Z0, _Z1,
                  half_w=0.24, half_h=0.20, detail=detail)

    zs = [_can_z(i) for i in range(_N)]
    n_cans = _N if detail >= 2 else max(6, _N // 2)
    for i, z in enumerate(zs[:n_cans]):
        md.hex_module(parts, 'frigate.can.%d' % i, hull_mat,
                      (0.0, 0.06, z), detail=detail)

    # Registry citadel: three hex cans stacked on the mid spine.
    for i, z in enumerate((zs[4], zs[5], zs[6])):
        md.hex_module(parts, 'frigate.cit.%d' % i, hull_mat,
                      (0.0, 0.78, z), size=(0.90, 0.70, 1.10),
                      detail=detail)

    hw.survey_head(parts, glow, 'frigate.head', hull_mat, glow_mat,
                   (0.0, 0.12, _Z0 + 0.40), size=(1.10, 0.62, 0.80),
                   detail=detail)
    if detail >= 1:
        md.recess_well(parts, glow, 'frigate.bridge', hull_mat, glow_mat,
                       (0.0, 0.55, zs[1]), facing='up', detail=detail)

    n_vane = 4 if detail >= 3 else (2 if detail >= 2 else 0)
    for i in range(n_vane):
        z = zs[2 + i]
        hw.ranging_vane(parts, 'frigate.vane.%d' % i, hull_mat,
                        ((-1.0 if i % 2 == 0 else 1.0), 0.20, z),
                        reach=1.10,
                        facing=('port' if i % 2 == 0 else 'starboard'),
                        detail=detail)

    # Starboard bay: scout pierces the can wall and the pad.
    bay_z = zs[7]
    kit.box(parts, 'frigate.bay.pad.spine', kit.ROLE_HULL,
            (0.55, -0.18, bay_z), (0.90, 0.16, 1.10), hull_mat)
    hw.nested_scout(parts, 'frigate.bay.scout', hull_mat,
                    (0.70, 0.04, bay_z), detail=detail)

    if detail >= 2:
        kit.box(parts, 'frigate.bay.port.spine', kit.ROLE_HULL,
                (-0.55, -0.18, zs[3]), (0.90, 0.16, 1.10), hull_mat)

    hw.cradle_wing(parts, 'frigate.wing.p', hull_mat,
                   (-0.90, -0.22, zs[5]), reach=5.20, facing='port',
                   detail=detail)
    hw.cradle_wing(parts, 'frigate.wing.s', hull_mat,
                   (0.90, -0.22, zs[5]), reach=5.20, facing='starboard',
                   detail=detail)

    hw.sample_vault(parts, 'frigate.archive', hull_mat,
                    (0.0, 0.10, zs[8]), detail=detail)

    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, 0.04, _Z1 + 0.12), 0.48, 0.32, nozzles=6,
                  depth=0.56, detail=detail)
    z_rad = zs[9] if len(zs) > 9 else zs[-1]
    hw.radiator(parts, 'frigate.rad.p', hull_mat,
                (-0.42, 0.18, z_rad), size=(0.16, 1.00, 1.80),
                detail=detail)
    hw.radiator(parts, 'frigate.rad.s', hull_mat,
                (0.42, 0.18, z_rad), size=(0.16, 1.00, 1.80),
                detail=detail)
    kit.box(parts, 'frigate.rad.p.seat.spine', kit.ROLE_HULL,
            (-0.18, 0.10, z_rad), (0.42, 0.24, 1.00), hull_mat)
    kit.box(parts, 'frigate.rad.s.seat.spine', kit.ROLE_HULL,
            (0.18, 0.10, z_rad), (0.42, 0.24, 1.00), hull_mat)

    if detail >= 2:
        hw.navigation_light(parts, glow, 'frigate.nav.p', hull_mat, glow_mat,
                            (-0.50, 0.40, zs[0]), detail=detail)
        hw.navigation_light(parts, glow, 'frigate.nav.s', hull_mat, glow_mat,
                            (0.50, 0.40, zs[-1]), detail=detail)
