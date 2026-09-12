"""Assembly Freighter - FOUNDRY LINEAGE.

Bible 4.8 freighter: "A colossal mobile replication yard: resource
hoppers, repeating foundry cells, daughter-ship racks, and successive
generations of modules extending down one spine. The smallest visible
daughter probe should be light-class scale." Family: SURVEY HEAD + CAN
SPINE + REPORT DISH (see light.py for the redesign charter).

BODY PLAN (bow -Z, stern +Z; absolute figures derived once from l):
    booms      four survey booms, tips at l*-0.48
    head can   ln.bus_can r 2.40, z l*-0.38 .. l*-0.32; nose optic
    spine      ln.spine_bar r 0.85, visible in every gap
    cans       TEN generations, r 2.40, length l*0.05 at pitch l*0.062
               from l*-0.30. Slot 7 is EMPTY spine with THE ANCIENT
               CORE hanging below it (ln.ancient_core r 1.30).
    hoppers    two off-white resource hoppers (taper blocks) riding cans
               2 and 3
    foundry    repeating foundry cells (charcoal boxes with a teal iris)
               on the flanks of cans 5, 8 and 9 — three per side
    racks      four hw.daughter_craft cradled under cans 1-4 (the
               smallest visible daughter is light-class scale)
    radiators  hw.radiator_set cross (4) on can 10
    antennas   hw.antenna_forest on can 6's top facet
    stern      hw.stern_cluster: housing l*0.30 .. l*0.39, SIX nozzles,
               report dish R = l*0.24, rim at l*0.49

LOD: lod3 (detail 0) keeps drums, spine, housing, dish, two nozzles,
radiators, core drum + cage rings, the four daughters at their own
detail 0, and the longest boom.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


_CAN_R = 2.40
_SPINE_R = 0.85
_CORE_R = 1.30
_N_CANS = 10
_CORE_SLOT = 6


def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly foundry lineage (freighter class). l = 85.0."""
    _ = (b, h)
    head_z0, head_z1 = l * -0.38, l * -0.32
    head_c = (0.0, 0.0, (head_z0 + head_z1) * 0.5)
    can_len = l * 0.05
    pitch = l * 0.062
    starts = [l * -0.30 + i * pitch for i in range(_N_CANS)]
    hous_z0 = starts[-1] + can_len - 0.15
    hous_z1 = l * 0.39
    z_rim = l * 0.49
    dish_r = l * 0.24
    top = ln.top_facet(sf.CAN_SIDES)
    bot = ln.bottom_facet(sf.CAN_SIDES)
    stb = ln.side_facet(sf.CAN_SIDES, True)
    prt = ln.side_facet(sf.CAN_SIDES, False)
    hopper_slots = (1, 2)
    foundry_slots = (4, 7, 8)
    rack_slots = (0, 1, 2, 3)
    ant_slot = 5

    ln.spine_bar(parts, 'freighter', hull_mat, head_c[2], hous_z1 - 0.20, _SPINE_R)
    head, head_sides = ln.bus_can(parts, 'freighter.head', hull_mat, head_c,
                                  _CAN_R, head_z1 - head_z0, detail=detail,
                                  seed=601, rows=2, sides=sf.CAN_SIDES,
                                  skip=(top,))
    centres = {}
    for i, z0 in enumerate(starts):
        c = (0.0, 0.0, z0 + can_len * 0.5)
        centres[i] = c
        if i == _CORE_SLOT:
            continue
        skip = []
        if i in hopper_slots or i == ant_slot:
            skip.append(top)
        if i in rack_slots:
            skip.append(bot)
        if i in foundry_slots:
            skip.extend([stb, prt])
        if i == _N_CANS - 1:
            skip.extend([top, bot, stb, prt])
        ln.bus_can(parts, 'freighter.can%02d' % (i + 1), hull_mat, c, _CAN_R,
                   can_len, detail=detail, seed=602 + i, rows=2,
                   sides=sf.CAN_SIDES if skip else None, skip=tuple(skip))
    hw.stern_cluster(parts, glow, 'freighter.stern', hull_mat, glow_mat,
                     hous_z0, hous_z1, 1.70, 1.40, 6, dish_r, z_rim,
                     detail=detail, seed=620, gores=14)
    hw.teal_optic(parts, glow, 'freighter.eye', hull_mat, glow_mat,
                  (0.0, 0.20, head_z0 + 0.02), radius=0.80, facing='nose',
                  detail=detail)
    hw.boom_set(parts, glow, 'freighter.boom', hull_mat, glow_mat, head_c,
                _CAN_R, head_z0, (l * 0.10, l * 0.08, l * 0.06, l * 0.045),
                detail=detail, seed=621)

    apo = ln.apothem(_CAN_R, sf.CAN_SIDES)

    # ── THE ANCIENT CORE below the empty slot (always) ───────────────────
    core_c = centres[_CORE_SLOT]
    ln.ancient_core(parts, glow, 'freighter.core', hull_mat, glow_mat,
                    (0.0, -(_SPINE_R + _CORE_R + 0.05), core_c[2]), _CORE_R,
                    can_len * 0.85, detail=detail, seed=630)

    # ── Radiator cross on the last can (always) ──────────────────────────
    hw.radiator_set(parts, 'freighter.rad', hull_mat, centres[_N_CANS - 1],
                    apo, can_len * 0.80, 4.60, count=4, detail=detail)

    # ── Daughter racks under cans 1-4 (always: the scale objects) ────────
    y_d = -(apo + sf.DAUGHTER_CAN_R + 0.55)
    for n, i in enumerate(rack_slots):
        cz = centres[i][2]
        hw.daughter_craft(parts, glow, 'freighter.daughter%d' % n, hull_mat,
                          glow_mat, (0.0, y_d, cz), detail=detail,
                          seed=640 + n)
        hw.cradle(parts, 'freighter.daughter%d' % n, hull_mat,
                  (0.0, -apo + 0.15, cz), (0.0, y_d + 0.25, cz), detail=detail)

    # ── Resource hoppers on cans 2 and 3 (always: outline masses) ────────
    for i in hopper_slots:
        c = centres[i]
        hop = (2.6, 2.0, can_len * 0.78)
        kit.taper_block(parts, 'freighter.hopper%d' % i, kit.ROLE_ARMOUR,
                        (0.0, apo - 0.25 + hop[1] * 0.5, c[2]), hop, hull_mat,
                        front=(0.80, 0.70), back=(1.0, 1.0))
        if detail >= 2:
            kit.box(parts, 'freighter.hopper%d.lip' % i, kit.ROLE_RECESS,
                    (0.0, apo - 0.25 + hop[1] - 0.02, c[2]),
                    (hop[0] * 0.70, 0.10, hop[2] * 0.70), hull_mat)
    if detail < 1:
        return

    # ── Foundry cells on the flanks of cans 5, 8, 9 ──────────────────────
    n_cells = 3 if detail >= 2 else 1
    for i in foundry_slots:
        c = centres[i]
        for tag, facet, face, sx in (('stbd', stb, 'starboard', 1.0),
                                     ('port', prt, 'port', -1.0)):
            for k in range(n_cells):
                zo = (k - (n_cells - 1) * 0.5) * (can_len * 0.30)
                p = ln.facet_point(c, _CAN_R, sf.CAN_SIDES, facet, zo)
                cell = (1.00, 1.00, 1.10)
                kit.box(parts, 'freighter.cell%d.%s.%d' % (i, tag, k),
                        kit.ROLE_HULL,
                        (p[0] + sx * (cell[0] * 0.5 - 0.15), p[1], p[2]),
                        cell, hull_mat)
                hw.teal_optic(parts, glow, 'freighter.cell%d.%s.%d' % (i, tag, k),
                              hull_mat, glow_mat,
                              (p[0] + sx * (cell[0] - 0.15), p[1], p[2]),
                              radius=0.22, facing=face, detail=detail)

    # ── Top optic on the head ────────────────────────────────────────────
    tf = ln.top_facet(head_sides)
    hw.teal_optic(parts, glow, 'freighter.eye-top', hull_mat, glow_mat,
                  ln.facet_point(head_c, _CAN_R, head_sides, tf, -0.80),
                  radius=sf.OPTIC_COLLAR_R, facing='up', detail=detail)
    if detail < 2:
        return

    # ── Antenna forest on can 6 ──────────────────────────────────────────
    hw.antenna_forest(parts, glow, 'freighter.ants', hull_mat, glow_mat,
                      ln.facet_point(centres[ant_slot], _CAN_R, sf.CAN_SIDES, top, 0.0),
                      count=11, detail=detail, seed=650)
    # ── Docking collars on can 6's flanks ────────────────────────────────
    for tag, facet, face in (('stbd', stb, 'starboard'), ('port', prt, 'port')):
        hw.docking_collar(parts, glow, 'freighter.dock.' + tag, hull_mat,
                          glow_mat,
                          ln.facet_point(centres[ant_slot], _CAN_R, sf.CAN_SIDES, facet, 0.0),
                          facing=face, detail=detail)
