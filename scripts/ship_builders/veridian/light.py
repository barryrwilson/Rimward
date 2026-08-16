"""Veridian Combine Light — CLAIM SCOUT.

Body: graphite keel + TWO hex pressure cans. Not a lofted slab.

Bible §4.1 Light: sensor dart, faceted survey head, two sample
canisters, thin ranging vanes. Almost no weapon mass.

Envelope: l=7.8 b=3.276 h=1.872. Aim span ~7.6. G2: ranging vanes 1.80.
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
_Z0 = -3.55
_Z1 = 3.50


def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Claim scout: two hex cans on a thin keel."""
    md.keel_spine(parts, 'light.keel', hull_mat, _Z0, _Z1,
                  half_w=0.16, half_h=0.14, detail=detail)

    z_cabin = -0.85
    z_aft = z_cabin + _PITCH
    md.hex_module(parts, 'light.cabin', hull_mat, (0.0, 0.04, z_cabin),
                  detail=detail)
    md.hex_module(parts, 'light.aft', hull_mat, (0.0, 0.04, z_aft),
                  detail=detail)

    hw.survey_head(parts, glow, 'light.head', hull_mat, glow_mat,
                   (0.0, 0.06, _Z0 + 0.28), size=(0.92, 0.52, 0.72),
                   detail=detail)

    if detail >= 1:
        hw.sample_canister(parts, 'light.can.a', hull_mat,
                           (0.42, 0.10, z_cabin + 0.10), facing='up',
                           detail=detail)
        hw.sample_canister(parts, 'light.can.b', hull_mat,
                           (0.42, 0.10, z_cabin - 0.28), facing='up',
                           detail=detail)

    hw.ranging_vane(parts, 'light.vane.p', hull_mat,
                    (-0.55, 0.04, z_cabin), reach=1.80, facing='port',
                    detail=detail)
    hw.ranging_vane(parts, 'light.vane.s', hull_mat,
                    (0.55, 0.04, z_cabin), reach=1.80, facing='starboard',
                    detail=detail)

    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, 0.0, _Z1 + 0.08), 0.22, 0.16, nozzles=2,
                  depth=0.42, detail=detail)

    if detail >= 2:
        hw.navigation_light(parts, glow, 'light.nav.p', hull_mat, glow_mat,
                            (-0.38, 0.18, z_cabin), detail=detail)
        hw.navigation_light(parts, glow, 'light.nav.s', hull_mat, glow_mat,
                            (0.38, 0.18, z_aft), detail=detail)
