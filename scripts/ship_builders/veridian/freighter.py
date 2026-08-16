"""Veridian Combine Freighter — EXTRACTION CARRIER.

Body: a LONG THIN keel. Cargo hangs on the keel. The crew is two hex
cans at the bow. This is not an 85-unit brick and not a scaled frigate.

Bible §4.1 Freighter: ore silos, refinery drums, claim modules, tug
docks. Small crew/control block. Exchange entire modules outside a
station.

Envelope: l=85.0 b=46.75 h=25.5. Aim span ~76–82.
G2: cradle reach 14.00. G3: 8-nozzle drive + radiators.
G5: nested scout pierces an open bay pad on the keel.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import modules as md
from . import hardware as hw

_Z0 = -38.40
_Z1 = 38.20


def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Extraction carrier: industrial keel with hung hex cargo."""
    md.keel_spine(parts, 'freighter.keel', hull_mat, _Z0, _Z1,
                  half_w=0.32, half_h=0.26, detail=detail)

    md.hex_module(parts, 'freighter.crew.a', hull_mat,
                  (0.0, 0.28, _Z0 + 1.40), size=(1.10, 0.90, 1.40),
                  detail=detail)
    md.hex_module(parts, 'freighter.crew.b', hull_mat,
                  (0.0, 0.28, _Z0 + 2.50), size=(1.10, 0.90, 1.40),
                  detail=detail)
    hw.survey_head(parts, glow, 'freighter.head', hull_mat, glow_mat,
                   (0.0, 0.30, _Z0 + 0.45), size=(0.90, 0.52, 0.70),
                   detail=detail)

    # Cargo ranks sit ON the keel (y slightly down) so they share voxels.
    n_rank = 6 if detail >= 3 else (4 if detail >= 2 else (2 if detail >= 1 else 1))
    z0 = -22.0
    pitch = 7.40
    for i in range(n_rank):
        z = z0 + i * pitch
        hw.ore_silo(parts, 'freighter.silo.%d' % i, hull_mat,
                    (0.0, -0.55, z), detail=detail)
        kit.box(parts, 'freighter.silo.%d.seat.spine' % i, kit.ROLE_HULL,
                (0.0, -0.20, z), (0.50, 0.40, 0.70), hull_mat)
        if detail >= 2:
            hw.refinery_drum(parts, 'freighter.drum.%d' % i, hull_mat,
                             (0.0, 0.55, z + 1.80), facing='z',
                             detail=detail)
            kit.box(parts, 'freighter.drum.%d.seat.spine' % i, kit.ROLE_HULL,
                    (0.0, 0.28, z + 1.80), (0.40, 0.36, 0.70), hull_mat)
        if detail >= 3 and i % 2 == 0:
            hw.claim_module(parts, 'freighter.claim.%d' % i, hull_mat,
                            (0.70, 0.10, z - 1.60), detail=detail)
            kit.box(parts, 'freighter.claim.%d.seat.spine' % i, kit.ROLE_HULL,
                    (0.30, 0.04, z - 1.60), (0.70, 0.30, 0.70), hull_mat)

    hw.cradle_wing(parts, 'freighter.wing.p', hull_mat,
                   (-1.10, -0.20, 0.0), reach=14.00, facing='port',
                   detail=detail)
    hw.cradle_wing(parts, 'freighter.wing.s', hull_mat,
                   (1.10, -0.20, 0.0), reach=14.00, facing='starboard',
                   detail=detail)

    # G5 open bay: pad through the keel face, scout through the pad.
    kit.box(parts, 'freighter.bay.pad.spine', kit.ROLE_HULL,
            (0.80, -0.10, 16.0), (1.40, 0.22, 2.20), hull_mat)
    hw.nested_scout(parts, 'freighter.bay.scout', hull_mat,
                    (0.90, 0.16, 16.0), detail=detail)

    hw.tug_dock(parts, 'freighter.tug.a', hull_mat,
                (0.38, 0.06, _Z1 - 3.20), facing='starboard',
                detail=detail)
    hw.tug_dock(parts, 'freighter.tug.b', hull_mat,
                (0.38, 0.06, _Z1 - 5.40), facing='starboard',
                detail=detail)
    kit.box(parts, 'freighter.tug.a.seat.spine', kit.ROLE_HULL,
            (0.16, 0.04, _Z1 - 3.20), (0.50, 0.28, 0.70), hull_mat)
    kit.box(parts, 'freighter.tug.b.seat.spine', kit.ROLE_HULL,
            (0.16, 0.04, _Z1 - 5.40), (0.50, 0.28, 0.70), hull_mat)

    hw.drive_face(parts, glow, 'freighter.drive', hull_mat, glow_mat,
                  (0.0, 0.04, _Z1 + 0.16), 0.70, 0.42, nozzles=8,
                  depth=0.70, detail=detail)
    hw.radiator(parts, 'freighter.rad.p', hull_mat,
                (-0.90, 0.30, _Z1 - 2.40), size=(0.12, 1.60, 2.40),
                detail=detail)
    hw.radiator(parts, 'freighter.rad.s', hull_mat,
                (0.90, 0.30, _Z1 - 2.40), size=(0.12, 1.60, 2.40),
                detail=detail)
    kit.box(parts, 'freighter.rad.p.seat.spine', kit.ROLE_HULL,
            (-0.40, 0.16, _Z1 - 2.40), (0.80, 0.28, 1.20), hull_mat)
    kit.box(parts, 'freighter.rad.s.seat.spine', kit.ROLE_HULL,
            (0.40, 0.16, _Z1 - 2.40), (0.80, 0.28, 1.20), hull_mat)

    if detail >= 2:
        n_lamp = 6 if detail >= 3 else 3
        for i in range(n_lamp):
            z = _Z0 + 6.0 + i * sf.LAMP_SPACING * 4
            hw.navigation_light(parts, glow, 'freighter.lamp.%d' % i,
                                hull_mat, glow_mat, (0.0, 0.42, z),
                                detail=detail)
