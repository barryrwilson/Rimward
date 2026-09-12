"""Assembly Cutter - CONTACT PROBE.

Bible 4.8 cutter: "A robust survey chassis with several manipulator /
inspection arms, sample exchange ports, and daughter probes arranged
around an old central body." Family: SURVEY HEAD + CAN SPINE + REPORT
DISH (see light.py for the redesign charter).

BODY PLAN (bow -Z, stern +Z; absolute figures derived once from l):
    booms      two survey booms, tips at l*-0.49
    head can   ln.bus_can r 0.80, z l*-0.34 .. l*-0.18; nose optic
    spine      ln.spine_bar r 0.30
    can 1      r 0.80, z l*-0.15 .. l*-0.03, roots of TWO manipulator
               arms reaching forward past the head
    can 2      r 0.80, z l*0.00 .. l*0.12, ONE nested daughter craft
               cradled beneath it (the nested object that gives scale)
    can 3      r 0.80, z l*0.15 .. l*0.25, sample exchange ports (two
               fabrication sockets, port and starboard)
    stern      hw.stern_cluster: housing l*0.24 .. l*0.36, TWO nozzles,
               report dish R = l*0.26, rim at l*0.48

EMISSIVE: nose optic, top optic, socket irises, two nozzle discs, tip
markers, the daughter's own optic and disc.
ORANGE: one facet per can (four), one dish gore, the daughter's facet.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


_CAN_R = 0.80
_SPINE_R = 0.30


def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly contact probe (cutter class). Envelope l = 11.0."""
    _ = (b, h)
    head_z0, head_z1 = l * -0.34, l * -0.18
    cans = [(l * -0.15, l * -0.03), (l * 0.00, l * 0.12), (l * 0.15, l * 0.25)]
    head_c = (0.0, 0.0, (head_z0 + head_z1) * 0.5)
    hous_z0 = cans[-1][1] - 0.10
    hous_z1 = l * 0.36
    z_rim = l * 0.48
    dish_r = l * 0.26

    ln.spine_bar(parts, 'cutter', hull_mat, head_c[2], hous_z1 - 0.20, _SPINE_R)
    head, head_sides = ln.bus_can(parts, 'cutter.head', hull_mat, head_c,
                                  _CAN_R, head_z1 - head_z0, detail=detail,
                                  seed=301, rows=2, sides=sf.CAN_SIDES,
                                  skip=(ln.top_facet(sf.CAN_SIDES),))
    centres = []
    sides_of = []
    for i, (z0, z1) in enumerate(cans):
        c = (0.0, 0.0, (z0 + z1) * 0.5)
        centres.append(c)
        skip = ()
        if i == 1:
            skip = (ln.bottom_facet(sf.CAN_SIDES),)
        if i == 2:
            skip = (ln.side_facet(sf.CAN_SIDES, True),
                    ln.side_facet(sf.CAN_SIDES, False))
        _objs, sd = ln.bus_can(parts, 'cutter.can%d' % (i + 1), hull_mat, c,
                               _CAN_R, z1 - z0, detail=detail, seed=302 + i,
                               rows=2, sides=sf.CAN_SIDES if skip else None,
                               skip=skip)
        sides_of.append(sd)
    hw.stern_cluster(parts, glow, 'cutter.stern', hull_mat, glow_mat,
                     hous_z0, hous_z1, 0.55, 0.46, 2, dish_r, z_rim,
                     detail=detail, seed=306, gores=12)
    hw.teal_optic(parts, glow, 'cutter.eye', hull_mat, glow_mat,
                  (0.0, 0.08, head_z0 + 0.02), radius=0.40, facing='nose',
                  detail=detail)
    hw.boom_set(parts, glow, 'cutter.boom', hull_mat, glow_mat, head_c, _CAN_R,
                head_z0, (l * 0.15, l * 0.10), detail=detail, seed=307)

    # ── Nested daughter under can 2 (always: it is the scale object) ─────
    apo2 = ln.apothem(_CAN_R, sides_of[1])
    y_d = -(apo2 + sf.DAUGHTER_CAN_R + 0.55)
    d_loc = (0.0, y_d, centres[1][2])
    hw.daughter_craft(parts, glow, 'cutter.daughter', hull_mat, glow_mat,
                      d_loc, detail=detail, seed=311)
    hw.cradle(parts, 'cutter.daughter', hull_mat,
              (0.0, -apo2 + 0.15, centres[1][2]),
              (0.0, y_d + 0.25, centres[1][2]), detail=detail)

    # ── Manipulator arms from can 1 (outline; always) ────────────────────
    apo1 = ln.apothem(_CAN_R, sides_of[0])
    z1c = centres[0][2]
    for tag, sx in (('stbd', 1.0), ('port', -1.0)):
        root = (sx * (apo1 - 0.20), 0.30, z1c)
        elbow = (sx * (apo1 + 0.90), 1.05, z1c - 0.60)
        tip = (sx * (apo1 + 1.10), 0.70, z1c - 2.10)
        hw.manipulator_arm(parts, 'cutter.arm.' + tag, hull_mat, root, elbow,
                           tip, detail=detail)
    if detail < 1:
        return

    # ── Top optic on the head; sample ports on can 3 ─────────────────────
    tf = ln.top_facet(head_sides)
    hw.teal_optic(parts, glow, 'cutter.eye-top', hull_mat, glow_mat,
                  ln.facet_point(head_c, _CAN_R, head_sides, tf, -0.20),
                  radius=sf.OPTIC_COLLAR_R, facing='up', detail=detail)
    c3 = centres[2]
    for tag, stbd, face in (('stbd', True, 'starboard'), ('port', False, 'port')):
        f = ln.side_facet(sides_of[2], stbd)
        hw.fabrication_socket(parts, glow, 'cutter.port.' + tag, hull_mat,
                              glow_mat, ln.facet_point(c3, _CAN_R, sides_of[2], f, 0.0),
                              radius=0.42, facing=face, detail=detail)
    if detail < 2:
        return

    # ── Inspection petals on can 1 (up) and a third arm stub ─────────────
    dist = apo1 + sf.PETAL_LEN * 0.5 - 0.16
    hw.instrument_petal(parts, 'cutter.petal.up', hull_mat,
                        (0.0, dist, z1c + 0.25), facing='up', detail=detail)
    if detail >= 3:
        hw.instrument_petal(parts, 'cutter.petal.down', hull_mat,
                            (0.0, -dist, z1c + 0.25), facing='down',
                            detail=detail)
        root = (0.0, apo1 - 0.20, z1c - 0.45)
        elbow = (0.35, apo1 + 0.85, z1c - 0.90)
        tip = (0.55, apo1 + 0.75, z1c - 2.00)
        hw.manipulator_arm(parts, 'cutter.arm.top', hull_mat, root, elbow,
                           tip, detail=detail)
