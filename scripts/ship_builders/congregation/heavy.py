"""Congregation Heavy — WARDSHIP.

Bible §4.9 heavy: "A compact armored pilgrim escort with a protected
forward chapel/observatory, defensive batteries kept below the rib line,
and redundant life-support vaults."

Plate 09-congregation-further-shore-ship.png is concept art, not a model
to copy. The plate gives the family: midnight-blue plated drum, weathered
silver rib rings, a faceted geodesic observation nave as the forward axis,
folded sail vanes, candle-amber lamps. This class hardens that language
into a SHORT THICK armored drum, not a battleship slab and not a long
frigate stick.

Construction logic is REPEATED MODULE, ritual (synthesis/21 §G6). One
part, many copies. A bigger class carries MORE cans / MORE ribs / MORE
sail vanes, never bigger modules. No churches, no crosses, no gold
steeples. The chapel is a protected observatory, not a nave with pews.

BODY PLAN
    A thick drum loft (kit.hull_loft, nearly circular stations) plus six
    rt.drum_bay copies of the same module length. Many rt.rib_ring collars
    wrap the drum. The observatory is hw.observation_nave at radius 0.65,
    set slightly INBOARD of the loft nose so extra bow rib rings sit
    OUTBOARD of the glass and read as a cage. Four identical rt.shrine_can
    life-support vaults sit on intersecting pads along the mid flanks.
    Batteries are small barbette-like kit.box ROLE_HULL blocks on the
    lower flanks (below the rib line), with one extra port box as the
    deliberate asymmetry. §G2 is rt.sail_cluster, count=4, plane='xz'.
    §G3 is a port/starboard pair of FLAT hw.radiator_panel on the
    upper-aft flanks plus hw.drive_face with 6 countable nozzles.
    hw.docking_collar hangs ventral. Lamps live in one mid band only.

STATION / ZONE REASONING (z as fractions of l)
    Nose / loft plane at l*-0.520 = -8.840.
    Transom / drive plane at l*+0.458 = +7.786. Drive face stands 0.12
    proud; driver engine glow sits at l*+0.47 = +7.990.
    Nave centre at l*-0.458 = -7.786, length 1.45, tip at -8.511
    (0.329 inboard of the loft nose). Authored spanZ ~ 16.83.
    Bow / mid seam at l*-0.280 = -4.760.
    Mid / stern seam at l*+0.180 = +3.060.
    Zones of lofted length 16.626: bow 24.5 %, mid 47.0 %, stern 28.4 %.
    Mid half-beam 2.74, mid half-height 2.56 (thick short drum).

OUTLINE-BREAKER (§G2)
    sail_cluster count=4, plane='xz' (vanes in XZ, not XY — length still
    leads beam). Vane module is sf.SAIL_* and is never scaled.
        reach = hub_radius + sf.SAIL_SPAN - sf.SAIL_BURY
              = hub_radius + 1.85 - 0.14
              = hub_radius + 1.71
    Floor: reach >= 0.15 * 17.0 = 2.55 ⇒ hub_radius >= 0.84.
    Authored hub_radius = 1.12. Authored reach = 2.83 = 16.6 % of l.
    Vane spanX = 2 * 2.83 = 5.66. Authored spanZ ~ 16.83 ⇒
    spanZ/spanX ~ 2.97 (>= 1.15). Smaller share than the cutter; the
    class reads thick and short against the frigate.

§G3 THERMAL / DRIVE
    One pair of hw.radiator_panel, FLAT, no fins, no panel lines. Each
    slab is (0.24, 1.40, 2.20) full extents. Inboard 0.12 sits inside
    the upper-aft flank. Drive face has 6 nozzles in a 3x2 grid on a
    midnight housing. Engine glow at z = l*0.47.

EMISSIVE (authored aim, <= 5 % of hull area)
    Nave interior taper, 6 drive discs, one mid-band lamp row (irises
    only at detail >= 2), two restrained Wakeglass discs, one collar
    mark. No edge-lit panels. Authored glow area ~2.4 against a ~95
    unit hull area (~2.5 %).

DETAIL LADDER
    3  full: every construct, six bays, full rib count, four vaults,
       four vanes, three batteries, full lamp row
    2  all construct families; bays / ribs / vaults / sails / lamps
       halve
    1  loft + bays + nave + vaults + radiators + drive
    0  loft + nave core + drive

ENVELOPE / AUTHORED AIM
    Driver: l = 17.0, b = 8.84, h = 5.78. Aim span 16.6–17.8
    (band [10.20, 23.80], target 17.0).
    Authored spanZ ~ 16.83; len/beam ~ 2.97 (>= 1.15); ht/len ~ 0.39
    (<= 0.60); beam/len ~ 0.34 (>= 0.16).
    Authored hull verts 14,000–40,000 (band 9,000–78,000).
    Island aim: one body; every fitting overlaps its host by >= 0.12.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import hardware as hw
from . import ritual as rt
from . import surface as sf


# Absolute structural sizes. Not scaled by l, b or h.
_NAVE_R = 0.65
_NAVE_LEN = 1.45
_HUB_R = 1.12
_BAY_LEN = sf.DRUM_BAY_LEN
_BAY_N = 6
_BURY = 0.12
_BAT = (0.58, 0.30, 0.68)
_PAD = (0.52, 0.34, 1.62)
_RAD = (0.24, 1.40, 2.20)


def _heavy_stations(l, b, h):
    """Thick nearly-circular drum. Shorter and fatter than a frigate stick.

    Half-extents stay close on X and Y so the loft reads as a drum, not
    a slab. Nose at l*-0.520 = -8.840; transom at l*+0.458 = +7.786.
    Bow/mid seam at l*-0.280; mid/stern seam at l*+0.180.
    Mid half-beam b*0.310 = 2.74; mid half-height h*0.443 = 2.56.
    """
    return [
        sf.fair(l * -0.520, b * 0.124, h * 0.190, 0.00),  # loft nose
        sf.fair(l * -0.450, b * 0.209, h * 0.311, 0.00),
        sf.fair(l * -0.360, b * 0.266, h * 0.389, 0.00),
        sf.fair(l * -0.280, b * 0.288, h * 0.419, 0.00),  # bow/mid
        sf.fair(l * -0.100, b * 0.308, h * 0.441, 0.00),
        sf.fair(l *  0.040, b * 0.310, h * 0.443, 0.00),  # max drum
        sf.fair(l *  0.180, b * 0.296, h * 0.426, 0.00),  # mid/stern
        sf.fair(l *  0.320, b * 0.266, h * 0.384, 0.00),
        sf.fair(l *  0.400, b * 0.232, h * 0.337, 0.00),
        sf.fair(l *  0.458, b * 0.192, h * 0.273, 0.00),  # transom
    ]


def _centers(z0, z1, n):
    """n centres equally spaced on [z0, z1] inclusive."""
    if n <= 1:
        return ((z0 + z1) * 0.5,)
    step = (z1 - z0) / float(n - 1)
    return tuple(z0 + step * i for i in range(n))


def _drum_r(stations, z):
    """Host radius for a bay or rib at station z (max of half-extents)."""
    hw_, hh, _yo, _ch = sf.section(stations, z)
    return max(hw_, hh)


def _vault_pad(parts, name, mat, loc, size):
    """Hull pad the shrine can intersects. size is FULL extents."""
    kit.box(parts, name, kit.ROLE_HULL, loc, size, mat)


def _battery(parts, name, mat, loc, size):
    """Barbette-like defensive box. size is FULL extents. ROLE_HULL."""
    kit.box(parts, name, kit.ROLE_HULL, loc, size, mat)


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Congregation wardship (heavy class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 half repeats, 1 primary form, 0 mass only.
    """
    stations = _heavy_stations(l, b, h)

    z_nose = l * -0.520
    z_stern = l * 0.458
    z_nave = l * -0.458

    # ── Drum loft + nave core + drive (detail 0+) ────────────────────────
    kit.hull_loft(parts, 'heavy.drum', kit.ROLE_HULL, stations, hull_mat)

    hw.observation_nave(parts, glow, 'heavy.nave', hull_mat, glow_mat,
                        (0.0, 0.0, z_nave),
                        radius=_NAVE_R, length=_NAVE_LEN, detail=detail)

    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern), max(d_hw, 0.72), max(d_hh, 0.58),
                  nozzles=6, depth=0.56, detail=detail)

    if detail < 1:
        return

    # ── Bays, vaults, radiators (detail 1+) ──────────────────────────────
    n_bay = _BAY_N if detail != 2 else _BAY_N // 2
    bay_first = z_nave + _NAVE_LEN * 0.5 + _BAY_LEN * 0.5 + 0.18
    bay_last = z_stern - 0.56 - _BAY_LEN * 0.5
    bay_zs = _centers(bay_first, bay_last, n_bay)
    for i, cz in enumerate(bay_zs):
        rt.drum_bay(parts, 'heavy.bay.%02d' % i, hull_mat,
                    (0.0, 0.0, cz),
                    radius=_drum_r(stations, cz),
                    length=_BAY_LEN, detail=detail)

    # Bow cage: extra ribs outboard of the glass, inboard of the loft nose.
    cage_zs = (
        z_nose + 0.44,
        z_nave - 0.12,
        z_nave + 0.38,
        z_nave + _NAVE_LEN * 0.5 + 0.16,
    )
    if detail == 2:
        cage_zs = cage_zs[::2]
    for i, cz in enumerate(cage_zs):
        rt.rib_ring(parts, 'heavy.cage.%02d' % i, hull_mat,
                    (0.0, 0.0, cz), _drum_r(stations, cz), detail=detail)

    # Four identical vaults (two per flank) on pads that bite the drum.
    vault_zs = (l * -0.055, l * 0.085)
    if detail == 2:
        vault_zs = vault_zs[:1]
    y_vault = 0.18
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for i, cz in enumerate(vault_zs):
            fx = sf.flank_x(stations, cz, y_vault)
            if fx <= 0.0:
                continue
            x_pad = side * (fx - _PAD[0] * 0.5 + _BURY)
            _vault_pad(parts, 'heavy.vault.pad.%s.%d' % (tag, i),
                       hull_mat, (x_pad, y_vault, cz), _PAD)
            # Can sits on the pad and still bites the drum by >= 0.12.
            x_can = side * (abs(x_pad) + 0.10)
            rt.shrine_can(parts, 'heavy.vault.%s.%d' % (tag, i), hull_mat,
                          (x_can, y_vault, cz), detail=detail)

    # Flat thermal slabs. Inboard 0.12 buries in the upper-aft flank.
    z_rad = l * 0.372
    sx, sy = _RAD[0], _RAD[1]
    y_rad = sf.straight_top(stations, z_rad) - sy * 0.28
    fx_rad = sf.flank_x(stations, z_rad, y_rad)
    x_rad = fx_rad - sx * 0.5 + _BURY
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'heavy.radiator.' + tag, hull_mat,
                          (side * x_rad, y_rad, z_rad), _RAD, detail=detail)

    if detail < 2:
        return

    # ── Ribs, sails, batteries, collar, mid-band lamps (detail 2+) ───────
    rib_pitch = 0.62
    z_rib0 = z_nose + 0.22
    z_rib1 = z_stern - 0.16
    n_rib = int(round((z_rib1 - z_rib0) / rib_pitch)) + 1
    if detail == 2:
        n_rib = max(4, n_rib // 2)
    rib_zs = _centers(z_rib0, z_rib1, n_rib)
    for i, cz in enumerate(rib_zs):
        rt.rib_ring(parts, 'heavy.rib.%02d' % i, hull_mat,
                    (0.0, 0.0, cz), _drum_r(stations, cz), detail=detail)

    # §G2 sail set. Hub buries into the dorsal so pegs stay one body.
    z_hub = l * -0.042
    y_hub = sf.top_y(stations, z_hub, 0.0) - 0.10
    rt.sail_cluster(parts, 'heavy.sails', hull_mat,
                    (0.0, y_hub, z_hub),
                    count=4, hub_radius=_HUB_R, plane='xz', detail=detail)

    # Batteries below the rib line. Extra port box is the asymmetry.
    bat_plan = (
        (1.0, 'stbd', l * -0.165),
        (-1.0, 'port', l * -0.165),
        (-1.0, 'portx', l * 0.205),
    )
    bx, by = _BAT[0], _BAT[1]
    for side, tag, cz in bat_plan:
        y_lo = sf.straight_bottom(stations, cz) + 0.10
        fx = sf.flank_x(stations, cz, y_lo)
        if fx <= 0.0:
            continue
        y_keel = sf.bottom_y(stations, cz, fx * 0.55)
        y_b = y_keel + by * 0.5 - _BURY
        fx2 = sf.flank_x(stations, cz, y_b)
        if fx2 <= 0.0:
            fx2 = fx
        x_b = side * (fx2 - bx * 0.5 + _BURY)
        _battery(parts, 'heavy.battery.' + tag, hull_mat,
                 (x_b, y_b, cz), _BAT)

    z_dock = l * 0.072
    y_dock = sf.bottom_y(stations, z_dock, 0.0)
    hw.docking_collar(parts, glow, 'heavy.dock', hull_mat, glow_mat,
                      (0.0, y_dock, z_dock), facing='down', detail=detail)

    # One mid band only — both flanks, same z run, no bow or stern lamps.
    z_lamp = l * 0.018
    y_lamp = 0.22
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        fx = sf.flank_x(stations, z_lamp, y_lamp)
        if fx <= 0.0:
            continue
        x_l = side * (fx + sf.LAMP_HOUSING[0] * 0.5 - _BURY)
        hw.lamp_row(parts, glow, 'heavy.lamps.' + tag,
                    hull_mat, glow_mat, (x_l, y_lamp, z_lamp),
                    count=4, axis='z', detail=detail)

    # Restrained Wakeglass on the protected bow, one per flank.
    z_opt = z_nave + 0.22
    y_opt = 0.28
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        face = 'starboard' if side > 0.0 else 'port'
        fx = sf.flank_x(stations, z_opt, y_opt)
        if fx <= 0.0:
            continue
        x_o = side * fx
        hw.wakeglass_optic(parts, glow, 'heavy.optic.' + tag,
                           hull_mat, glow_mat, (x_o, y_opt, z_opt),
                           facing=face, detail=detail)
