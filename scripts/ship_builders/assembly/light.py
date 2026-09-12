"""Assembly Light - DAUGHTER PROBE.

Redesign (2026-09, owner-approved concept sheet): the Assembly is ONE
ancient human survey probe copied for ten thousand generations. Every
class is SURVEY HEAD + CAN SPINE + REPORT DISH. The light class is the
daughter itself: the smallest complete copy of the lineage.

Construction logic: REPEATED MODULE (synthesis/20 §5, 21 §G6). One part,
many copies, linear arrays, visible joints. Variation is copy-drift
(facet count 9/10/11, plate step), never human patchwork. Silhouette
family: SURVEY HEAD + CAN SPINE + REPORT DISH, held across all six
classes. The §G2 outline-breaker is the annular REPORT DISH at the
stern (diameter ~50 % of hull length); the drive fires through it.

BODY PLAN (bow -Z, stern +Z; all figures absolute, derived once from l):
    booms      two forward survey booms of UNEQUAL length rooted in the
               head can, tips at l*-0.45 (the nose)
    head can   ln.bus_can r 0.60, z l*-0.28 .. l*-0.06; the largest teal
               optic on its nose face, a second optic on the top facet
    spine      ln.spine_bar r 0.24 from the head centre to the housing
    spine can  ln.bus_can r 0.60, z l*-0.02 .. l*0.16, with three
               cruciform instrument petals and a tiny ventral
               fabrication socket
    stern      hw.stern_cluster: housing l*0.15 .. l*0.30, neck, ONE
               nozzle, report dish R = l*0.25 with rim at l*0.47

ZONES: bow (booms + head) 15-45 %, mid (spine can) 25 %, stern (housing
+ dish) 30 %. Each boundary is a visible joint ring or an empty spine
gap; no plate crosses a boundary.

OUTLINE-BREAKER (G2): report dish diameter 2R = 0.50 l. The dish rim is
the tallest and widest thing on the ship. Boom tips set the nose.

EMISSIVE (<= 5 %): nose optic iris, top optic iris, socket iris, one
nozzle disc, two boom tip markers. No edge lighting.

ORANGE (3-8 %): one re-fabricated facet per can (two), one re-fabricated
dish gore. Accent coverage is geometry count; accent_density is 1.0.

DETAIL LADDER:
    3  full: plates 3 rows, band ticks, bolts, all ribs, petals x3
    2  plates 1 row, band, half the ribs, petals x2
    1  drums + joints + seams + orange + dish + nozzle + booms + optics
    0  drums + spine + housing + dish + nozzle

DENSITY: see docstring of build_light for the MEASURED figures.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


_CAN_R = 0.60      # this generation's can radius (absolute)
_SPINE_R = 0.24


def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly daughter probe (light class).

    parts / glow -- receive hull-role objects / emissive objects.
    l, b, h      -- envelope (7.8, 3.276, 1.872); b and h are not used —
                    the can and dish radii are lineage sizes.
    detail       -- 3 full … 0 masses only.

    MEASURED: see PROGRESS / docs/ShipAssetPipeline.md wave note.
    """
    _ = (b, h)
    head_z0 = l * -0.28
    head_z1 = l * -0.06
    head_c = (0.0, 0.0, (head_z0 + head_z1) * 0.5)
    can_z0 = l * -0.02
    can_z1 = l * 0.16
    can_c = (0.0, 0.0, (can_z0 + can_z1) * 0.5)
    hous_z0 = can_z1 - 0.10
    hous_z1 = l * 0.30
    z_rim = l * 0.47
    dish_r = l * 0.25

    # ── Primary masses (detail 0+) ───────────────────────────────────────
    ln.spine_bar(parts, 'light', hull_mat, head_c[2], hous_z1 - 0.20, _SPINE_R)
    head, head_sides = ln.bus_can(parts, 'light.head', hull_mat, head_c,
                                  _CAN_R, head_z1 - head_z0, detail=detail,
                                  seed=101, rows=3, sides=sf.CAN_SIDES,
                                  skip=(ln.top_facet(sf.CAN_SIDES),))
    can, can_sides = ln.bus_can(parts, 'light.can', hull_mat, can_c, _CAN_R,
                                can_z1 - can_z0, detail=detail, seed=102,
                                rows=3)
    hw.stern_cluster(parts, glow, 'light.stern', hull_mat, glow_mat,
                     hous_z0, hous_z1, 0.42, 0.36, 1, dish_r, z_rim,
                     detail=detail, seed=103, gores=10)

    # ── Survey head: the largest optic, on the nose face ─────────────────
    hw.teal_optic(parts, glow, 'light.eye', hull_mat, glow_mat,
                  (0.0, 0.06, head_z0 + 0.02), radius=0.32, facing='nose',
                  detail=detail)
    # ── Booms (detail 0 builds the longest only) ─────────────────────────
    hw.boom_set(parts, glow, 'light.boom', hull_mat, glow_mat, head_c, _CAN_R,
                head_z0, (l * 0.17, l * 0.12), detail=detail, seed=104)
    if detail < 1:
        return

    # ── Top optic on the head's top facet ────────────────────────────────
    tf = ln.top_facet(head_sides)
    hw.teal_optic(parts, glow, 'light.eye-top', hull_mat, glow_mat,
                  ln.facet_point(head_c, _CAN_R, head_sides, tf, -0.15),
                  radius=sf.OPTIC_COLLAR_R, facing='up', detail=detail)

    # ── Ventral fabrication socket on the spine can ──────────────────────
    bf = ln.bottom_facet(can_sides)
    hw.fabrication_socket(parts, glow, 'light.socket', hull_mat, glow_mat,
                          ln.facet_point(can_c, _CAN_R, can_sides, bf, 0.10),
                          radius=0.30, facing='down', detail=detail)
    if detail < 2:
        return

    # ── Cruciform instrument petals on the spine can ─────────────────────
    apo = ln.apothem(_CAN_R, can_sides)
    bury = 0.16
    dist = apo + sf.PETAL_LEN * 0.5 - bury
    petals = [('stbd', 'starboard', (1.0, 0.0, 0.0)),
              ('port', 'port', (-1.0, 0.0, 0.0))]
    if detail >= 3:
        petals.append(('up', 'up', (0.0, 1.0, 0.0)))
    for tag, face, radial in petals:
        pc = (radial[0] * dist, radial[1] * dist, can_c[2] - 0.20)
        hw.instrument_petal(parts, 'light.petal.' + tag, hull_mat, pc,
                            facing=face, detail=detail)
