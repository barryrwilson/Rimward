"""Assembly Ace - DIVERGENT SURVEYOR.

Bible 4.8 ace: "A high-speed lineage with duplicated drive modules and
slightly mismatched recursive fins — the same design copied, corrected,
and copied again." Family: SURVEY HEAD + CAN SPINE + REPORT DISH (see
light.py for the redesign charter).

BODY PLAN (bow -Z, stern +Z; absolute figures derived once from l):
    booms      THREE survey booms of unequal length, tips at l*-0.52
    head can   ln.bus_can r 0.50, z l*-0.30 .. l*-0.12; nose optic
    spine      ln.spine_bar r 0.20 head centre .. housing
    can 1      r 0.50, z l*-0.08 .. l*0.08
    can 2      r 0.50, z l*0.10 .. l*0.24, carrying the DUPLICATED DRIVE
               MODULES (two charcoal pods on the flanks) and the two
               MISMATCHED FINS (dorsal larger, ventral a drifted smaller
               copy — the class's deliberate asymmetry)
    stern      hw.stern_cluster: housing l*0.23 .. l*0.36, TWO nozzles,
               narrow report dish R = l*0.21, rim at l*0.50

The ace is longer and narrower than the light (dish 0.42 l against
0.50 l) so the ladder reads light <= ace on span with the ace still the
sleeker hull.

EMISSIVE: nose optic, top optic, two nozzle discs, three tip markers.
ORANGE: one facet per can (three), one dish gore.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


_CAN_R = 0.50
_SPINE_R = 0.20


def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly divergent surveyor (ace class). Envelope l = 7.2."""
    _ = (b, h)
    head_z0 = l * -0.30
    head_z1 = l * -0.12
    head_c = (0.0, 0.0, (head_z0 + head_z1) * 0.5)
    c1_z0, c1_z1 = l * -0.08, l * 0.08
    c2_z0, c2_z1 = l * 0.10, l * 0.24
    c1_c = (0.0, 0.0, (c1_z0 + c1_z1) * 0.5)
    c2_c = (0.0, 0.0, (c2_z0 + c2_z1) * 0.5)
    hous_z0 = c2_z1 - 0.10
    hous_z1 = l * 0.36
    z_rim = l * 0.50
    dish_r = l * 0.21

    # ── Primary masses ───────────────────────────────────────────────────
    ln.spine_bar(parts, 'ace', hull_mat, head_c[2], hous_z1 - 0.20, _SPINE_R)
    head, head_sides = ln.bus_can(parts, 'ace.head', hull_mat, head_c, _CAN_R,
                                  head_z1 - head_z0, detail=detail, seed=201,
                                  rows=2, sides=sf.CAN_SIDES,
                                  skip=(ln.top_facet(sf.CAN_SIDES),))
    c1, c1_sides = ln.bus_can(parts, 'ace.can1', hull_mat, c1_c, _CAN_R,
                              c1_z1 - c1_z0, detail=detail, seed=202, rows=2)
    c2, c2_sides = ln.bus_can(parts, 'ace.can2', hull_mat, c2_c, _CAN_R,
                              c2_z1 - c2_z0, detail=detail, seed=203, rows=2,
                              skip=(ln.top_facet(sf.CAN_SIDES),
                                    ln.bottom_facet(sf.CAN_SIDES)),
                              sides=sf.CAN_SIDES)
    hw.stern_cluster(parts, glow, 'ace.stern', hull_mat, glow_mat,
                     hous_z0, hous_z1, 0.36, 0.30, 2, dish_r, z_rim,
                     detail=detail, seed=204, gores=10)
    hw.teal_optic(parts, glow, 'ace.eye', hull_mat, glow_mat,
                  (0.0, 0.05, head_z0 + 0.02), radius=0.28, facing='nose',
                  detail=detail)
    hw.boom_set(parts, glow, 'ace.boom', hull_mat, glow_mat, head_c, _CAN_R,
                head_z0, (l * 0.22, l * 0.16, l * 0.11), detail=detail,
                seed=205)

    # ── Mismatched recursive fins on can 2 (outline; detail 0+) ──────────
    # hw.instrument_petal aims a taper_block radially: size is (thickness
    # across X, chord along Z, radial length). The ventral fin is the same
    # module copied, corrected and drifted smaller — the one asymmetry.
    apo2 = ln.apothem(_CAN_R, c2_sides)
    fin_d = (0.10, 0.95, 1.10)
    fin_v = (0.10, 0.74, 0.82)
    bury = 0.14
    hw.instrument_petal(parts, 'ace.fin.dorsal', hull_mat,
                        (0.0, apo2 - bury + fin_d[2] * 0.5, c2_c[2] + 0.05),
                        facing='up', size=fin_d, detail=max(detail, 1))
    hw.instrument_petal(parts, 'ace.fin.ventral', hull_mat,
                        (0.0, -(apo2 - bury + fin_v[2] * 0.5), c2_c[2] + 0.12),
                        facing='down', size=fin_v, detail=max(detail, 1))
    if detail < 1:
        return

    # ── Duplicated drive modules: two charcoal pods on can 2's flanks ────
    for tag, sx in (('stbd', 1.0), ('port', -1.0)):
        kit.cyl(parts, 'ace.pod.' + tag, kit.ROLE_HULL,
                (sx * (apo2 - 0.10 + 0.20), 0.0, c2_c[2] + 0.10), 0.20, 1.30,
                hull_mat, rotation=sf.CYL_ALONG_Z, vertices=10)
        if detail >= 2:
            kit.cyl(parts, 'ace.pod-ring.' + tag, kit.ROLE_RECESS,
                    (sx * (apo2 - 0.10 + 0.20), 0.0, c2_c[2] + 0.55), 0.23, 0.10,
                    hull_mat, rotation=sf.CYL_ALONG_Z, vertices=10)

    # ── Top optic on the head ────────────────────────────────────────────
    tf = ln.top_facet(head_sides)
    hw.teal_optic(parts, glow, 'ace.eye-top', hull_mat, glow_mat,
                  ln.facet_point(head_c, _CAN_R, head_sides, tf, -0.10),
                  radius=sf.OPTIC_COLLAR_R, facing='up', detail=detail)
    if detail < 2:
        return

    # ── Two instrument petals on can 1 (port / starboard) ────────────────
    apo1 = ln.apothem(_CAN_R, c1_sides)
    dist = apo1 + sf.PETAL_LEN * 0.5 - 0.16
    for tag, face, sx in (('stbd', 'starboard', 1.0), ('port', 'port', -1.0)):
        hw.instrument_petal(parts, 'ace.petal.' + tag, hull_mat,
                            (sx * dist, 0.0, c1_c[2] - 0.10), facing=face,
                            detail=detail)
