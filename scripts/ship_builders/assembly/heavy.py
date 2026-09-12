"""Assembly Heavy - REPLICATION DEFENDER.

Bible 4.8 heavy: "A dense machinery core surrounded by replaceable
armor modules, fabrication bays, and duplicated sensor/weapon clusters.
Function should remain legible despite complexity." Family: SURVEY HEAD
+ CAN SPINE + REPORT DISH (see light.py for the redesign charter).

BODY PLAN (bow -Z, stern +Z; absolute figures derived once from l):
    booms      three short survey booms, tips at l*-0.48
    head can   ln.bus_can r 1.15, z l*-0.36 .. l*-0.22; nose optic
    spine      ln.spine_bar r 0.42
    cans 1-4   r 1.15, tight pitch (the dense core): l*-0.20 .. l*0.28,
               THICK armour plates (replaceable armour modules) on cans
               1 and 2; DUPLICATED weapon clusters (kit.barbette pairs)
               on the top and bottom facets of cans 1 and 2; two
               fabrication bays (sockets) on the flanks of can 3
    radiators  hw.radiator_set cross (4) on can 4 beside the reactor
    stern      hw.stern_cluster: housing l*0.27 .. l*0.38, FOUR nozzles,
               report dish R = l*0.27, rim at l*0.49

EMISSIVE: nose + top optics, four barbette apertures, two bay irises,
four nozzle discs, tip markers.
ORANGE: one facet per can (five), radiator edge strips, one dish gore.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


_CAN_R = 1.15
_SPINE_R = 0.42


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly replication defender (heavy class). l = 17.0."""
    _ = (b, h)
    head_z0, head_z1 = l * -0.36, l * -0.22
    cans = [(l * -0.20, l * -0.08), (l * -0.06, l * 0.06),
            (l * 0.08, l * 0.18), (l * 0.20, l * 0.28)]
    head_c = (0.0, 0.0, (head_z0 + head_z1) * 0.5)
    hous_z0 = cans[-1][1] - 0.12
    hous_z1 = l * 0.38
    z_rim = l * 0.49
    dish_r = l * 0.27
    top = ln.top_facet(sf.CAN_SIDES)
    bot = ln.bottom_facet(sf.CAN_SIDES)
    stb = ln.side_facet(sf.CAN_SIDES, True)
    prt = ln.side_facet(sf.CAN_SIDES, False)

    ln.spine_bar(parts, 'heavy', hull_mat, head_c[2], hous_z1 - 0.20, _SPINE_R)
    head, head_sides = ln.bus_can(parts, 'heavy.head', hull_mat, head_c,
                                  _CAN_R, head_z1 - head_z0, detail=detail,
                                  seed=401, rows=2, sides=sf.CAN_SIDES,
                                  skip=(top,))
    centres = []
    for i, (z0, z1) in enumerate(cans):
        c = (0.0, 0.0, (z0 + z1) * 0.5)
        centres.append(c)
        if i < 2:
            ln.bus_can(parts, 'heavy.can%d' % (i + 1), hull_mat, c, _CAN_R,
                       z1 - z0, detail=detail, seed=402 + i, rows=2,
                       sides=sf.CAN_SIDES, skip=(top, bot), plate_t=0.20)
        elif i == 2:
            ln.bus_can(parts, 'heavy.can3', hull_mat, c, _CAN_R, z1 - z0,
                       detail=detail, seed=404, rows=2, sides=sf.CAN_SIDES,
                       skip=(stb, prt))
        else:
            ln.bus_can(parts, 'heavy.can4', hull_mat, c, _CAN_R, z1 - z0,
                       detail=detail, seed=405, rows=2, sides=sf.CAN_SIDES,
                       skip=(top, bot, stb, prt))
    hw.stern_cluster(parts, glow, 'heavy.stern', hull_mat, glow_mat,
                     hous_z0, hous_z1, 0.80, 0.66, 4, dish_r, z_rim,
                     detail=detail, seed=406, gores=12)
    hw.teal_optic(parts, glow, 'heavy.eye', hull_mat, glow_mat,
                  (0.0, 0.10, head_z0 + 0.02), radius=0.48, facing='nose',
                  detail=detail)
    hw.boom_set(parts, glow, 'heavy.boom', hull_mat, glow_mat, head_c, _CAN_R,
                head_z0, (l * 0.12, l * 0.09, l * 0.06), detail=detail,
                seed=407)

    # ── Radiator cross on can 4 (G3; always) ─────────────────────────────
    apo = ln.apothem(_CAN_R, sf.CAN_SIDES)
    hw.radiator_set(parts, 'heavy.rad', hull_mat, centres[3], apo,
                    (cans[3][1] - cans[3][0]) * 0.80, 1.70, count=4,
                    detail=detail)
    if detail < 1:
        return

    # ── Duplicated weapon clusters on cans 1 and 2 ───────────────────────
    for i in (0, 1):
        c = centres[i]
        for tag, facet, ry in (('top', top, 1.0), ('bot', bot, -1.0)):
            if ry < 0.0 and detail < 2:
                continue
            p = ln.facet_point(c, _CAN_R, sf.CAN_SIDES, facet, 0.0)
            objs = kit.barbette(parts, glow, 'heavy.gun%d.%s' % (i + 1, tag),
                                (p[0], p[1] - 0.06 * ry, p[2]), hull_mat,
                                glow_mat, 0.34, 0.42, barrels=2)
            if ry < 0.0:
                # Mirror the whole barbette below the keel (flip about Z).
                for o in objs:
                    o.rotation_euler = (o.rotation_euler[0],
                                        o.rotation_euler[1] + 3.14159265,
                                        o.rotation_euler[2])
                    o.location = (o.location[0], o.location[1],
                                  2.0 * (p[1] - 0.06 * ry) - o.location[2])

    # ── Fabrication bays on can 3's flanks ───────────────────────────────
    c3 = centres[2]
    for tag, facet, face in (('stbd', stb, 'starboard'), ('port', prt, 'port')):
        hw.fabrication_socket(parts, glow, 'heavy.bay.' + tag, hull_mat,
                              glow_mat, ln.facet_point(c3, _CAN_R, sf.CAN_SIDES, facet, 0.0),
                              radius=0.70, facing=face, detail=detail)

    # ── Top optic on the head ────────────────────────────────────────────
    tf = ln.top_facet(head_sides)
    hw.teal_optic(parts, glow, 'heavy.eye-top', hull_mat, glow_mat,
                  ln.facet_point(head_c, _CAN_R, head_sides, tf, -0.30),
                  radius=sf.OPTIC_COLLAR_R, facing='up', detail=detail)
    if detail < 2:
        return

    # ── Antenna cluster on can 3's top facet ─────────────────────────────
    hw.antenna_forest(parts, glow, 'heavy.ants', hull_mat, glow_mat,
                      ln.facet_point(c3, _CAN_R, sf.CAN_SIDES, top, 0.10),
                      count=5, detail=detail, seed=411)
