"""Assembly Frigate - ARCHIVE SURVEYOR.

Bible 4.8 frigate: "A long archive spine bearing repeated data vaults,
an antenna crown, probe launch petals, and a protected ancient core
embedded off-center by generations of growth." Family: SURVEY HEAD +
CAN SPINE + REPORT DISH (see light.py for the redesign charter).

BODY PLAN (bow -Z, stern +Z; absolute figures derived once from l):
    booms      three survey booms, tips at l*-0.49
    head can   ln.bus_can r 1.35, z l*-0.35 .. l*-0.25; nose optic
    spine      ln.spine_bar r 0.48, visible in every gap
    cans       r 1.35, length l*0.075 at pitch l*0.095 — the archive
               vaults — at l*-0.22, -0.125, -0.03, [core slot], 0.16,
               0.255. The fourth slot is EMPTY spine, and THE ANCIENT
               CORE (ln.ancient_core, dark, caged, nine-sided) hangs
               below it off-centre.
    daughters  two hw.daughter_craft cradled under cans 2 and 3 (the
               nested craft; G5 hangar equivalent)
    antennas   hw.antenna_forest crown on can 3's top facet
    petals     four probe-launch petals cruciform on can 1
    radiators  hw.radiator_set pair (dorsal / ventral) on can 6
    stern      hw.stern_cluster: housing l*0.32 .. l*0.40, FOUR nozzles,
               report dish R = l*0.25, rim at l*0.49

EMISSIVE: optics (nose, top, core side), forest marker, four nozzle
discs, tip markers, daughters' own.
ORANGE: one facet per can (seven), radiator edges, one dish gore.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


_CAN_R = 1.35
_SPINE_R = 0.48
_CORE_R = 0.72


def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly archive surveyor (frigate class). l = 32.0."""
    _ = (b, h)
    head_z0, head_z1 = l * -0.35, l * -0.25
    head_c = (0.0, 0.0, (head_z0 + head_z1) * 0.5)
    can_len = l * 0.075
    starts = [l * -0.22, l * -0.125, l * -0.03, l * 0.16, l * 0.255]
    core_z0 = l * 0.065
    hous_z0 = starts[-1] + can_len - 0.12
    hous_z1 = l * 0.40
    z_rim = l * 0.49
    dish_r = l * 0.25
    top = ln.top_facet(sf.CAN_SIDES)
    bot = ln.bottom_facet(sf.CAN_SIDES)

    ln.spine_bar(parts, 'frigate', hull_mat, head_c[2], hous_z1 - 0.20, _SPINE_R)
    head, head_sides = ln.bus_can(parts, 'frigate.head', hull_mat, head_c,
                                  _CAN_R, head_z1 - head_z0, detail=detail,
                                  seed=501, rows=2, sides=sf.CAN_SIDES,
                                  skip=(top,))
    centres = []
    for i, z0 in enumerate(starts):
        c = (0.0, 0.0, z0 + can_len * 0.5)
        centres.append(c)
        skip = ()
        force = None
        if i in (1, 2):
            skip = (bot, top) if i == 2 else (bot,)
            force = sf.CAN_SIDES
        if i == 3:
            skip = (bot,)
            force = sf.CAN_SIDES
        if i == 4:
            skip = (top, bot)
            force = sf.CAN_SIDES
        ln.bus_can(parts, 'frigate.can%d' % (i + 1), hull_mat, c, _CAN_R,
                   can_len, detail=detail, seed=502 + i, rows=2, sides=force,
                   skip=skip)
    hw.stern_cluster(parts, glow, 'frigate.stern', hull_mat, glow_mat,
                     hous_z0, hous_z1, 0.95, 0.80, 4, dish_r, z_rim,
                     detail=detail, seed=510, gores=12)
    hw.teal_optic(parts, glow, 'frigate.eye', hull_mat, glow_mat,
                  (0.0, 0.12, head_z0 + 0.02), radius=0.55, facing='nose',
                  detail=detail)
    hw.boom_set(parts, glow, 'frigate.boom', hull_mat, glow_mat, head_c,
                _CAN_R, head_z0, (l * 0.14, l * 0.10, l * 0.07),
                detail=detail, seed=511)

    apo = ln.apothem(_CAN_R, sf.CAN_SIDES)

    # ── THE ANCIENT CORE below the empty slot (always) ───────────────────
    core_len = can_len * 0.90
    core_loc = (0.0, -(_SPINE_R + _CORE_R + 0.05), core_z0 + can_len * 0.5)
    ln.ancient_core(parts, glow, 'frigate.core', hull_mat, glow_mat, core_loc,
                    _CORE_R, core_len, detail=detail, seed=520)

    # ── Radiator pair on can 6 (G3; always) ──────────────────────────────
    hw.radiator_set(parts, 'frigate.rad', hull_mat, centres[4], apo,
                    can_len * 0.80, 2.60, count=2, detail=detail)

    # ── Two nested daughters under cans 2 and 3 (always) ─────────────────
    y_d = -(apo + sf.DAUGHTER_CAN_R + 0.55)
    for i, seed in ((1, 531), (2, 532)):
        cz = centres[i][2]
        hw.daughter_craft(parts, glow, 'frigate.daughter%d' % i, hull_mat,
                          glow_mat, (0.0, y_d, cz), detail=detail, seed=seed)
        hw.cradle(parts, 'frigate.daughter%d' % i, hull_mat,
                  (0.0, -apo + 0.15, cz), (0.0, y_d + 0.25, cz), detail=detail)
    if detail < 1:
        return

    # ── Top optic; probe-launch petals on can 1 ──────────────────────────
    tf = ln.top_facet(head_sides)
    hw.teal_optic(parts, glow, 'frigate.eye-top', hull_mat, glow_mat,
                  ln.facet_point(head_c, _CAN_R, head_sides, tf, -0.40),
                  radius=sf.OPTIC_COLLAR_R, facing='up', detail=detail)
    z1 = centres[0][2]
    dist = apo + sf.PETAL_LEN * 0.5 - 0.16
    petals = [('stbd', 'starboard', (1.0, 0.0)), ('port', 'port', (-1.0, 0.0)),
              ('up', 'up', (0.0, 1.0))]
    if detail >= 3:
        petals.append(('down', 'down', (0.0, -1.0)))
    for tag, face, (rx, ry) in petals:
        hw.instrument_petal(parts, 'frigate.petal.' + tag, hull_mat,
                            (rx * dist, ry * dist, z1 - 0.20), facing=face,
                            detail=detail)
    if detail < 2:
        return

    # ── Antenna crown on can 3 ───────────────────────────────────────────
    hw.antenna_forest(parts, glow, 'frigate.crown', hull_mat, glow_mat,
                      ln.facet_point(centres[2], _CAN_R, sf.CAN_SIDES, top, 0.0),
                      count=9, detail=detail, seed=541)
    # ── Docking collar on can 5's keel ───────────────────────────────────
    hw.docking_collar(parts, glow, 'frigate.dock', hull_mat, glow_mat,
                      ln.facet_point(centres[3], _CAN_R, sf.CAN_SIDES, bot, 0.0),
                      facing='down', detail=detail)
