"""Independent Heavy — HIRED ESCORT.

Bible §5.1 heavy: "Hired escort built by reinforcing a commercial work
hull around a serious drive and weapon package."

There is no concept-art plate. Do not invent a Banner look, a citadel,
or turret batteries. Construction logic is REPEATED COMMERCIAL MODULE /
LASH-UP. Silhouette family is spine-and-pods: civilian chassis along Z,
bolted modules and crates as pods.

BODY PLAN
    A blocky commercial work loft (kit.hull_loft, sf.fair k=0.28) is the
    chassis. Half-extents are ABSOLUTE work-hull radii, never *b or *h.
    Bow is a thicker command host with su.civilian_cabin, a nose
    hw.docking_collar, patch plates and field welds. Mid carries the
    §G2 su.crate_rack, ONE su.owner_module (accent), 2+ hw.mission_pod
    as the commercial weapon package, and su.zone_strap seams. Stern is
    a large hw.tug_core on a plinth, hw.drive_face with 6 nozzles, and
    a PAIR of flat hw.radiator_panel. One leftover port clamp is the
    functional asymmetry. One starboard service band holds the lamps.
    One HUMAN port row sits on the command-host starboard flank.

STATION / ZONE REASONING (z as fractions of l; half-extents ABSOLUTE)
    Loft nose at l*-0.400 = -6.800.
    Transom / drive plane at l*+0.470 = +7.990. Drive face stands
    0.12 proud.
    Command-host nose at -8.720. Collar mating plane sits on that
    face. Authored spanZ ~ 16.9 (band 16.5-17.5, target 17.0).
    Bow / mid seam at l*-0.296 = -5.032.
    Mid / stern seam at l*+0.199 = +3.383.
    Visible bow (host nose → bow seam) ~ 22 % of authored span.
    Mid ~ 50 %. Stern ~ 28 %.
    Mid half-beam 1.90, mid half-height 1.26 (work brick, not a
    war-citadel).

OUTLINE-BREAKER (§G2)
    su.crate_rack along mid deck. Grow LENGTH, never crate size
    (HUMAN.crateS = 0.85).
        authored length = 4.20
        floor           = 0.15 * 17.0 = 2.55
        authored share  = 24.7 % of l

§G3 THERMAL / DRIVE
    One pair of hw.radiator_panel, FLAT, no fins, no greeble. Each
    slab is (2.10, 0.16, 2.70) full extents. Z = 2.70 = 15.9 % of l.
    Inboard 0.14 sits inside the upper-aft flank. Drive face is a
    3x2 of 6 countable nozzles. No kit.engine_bank.

EMISSIVE (authored aim, <= 5 % of hull area)
    6 drive discs, one HUMAN port row (ROLE_RECESS, not glow),
    4 nav lamps at HUMAN.lampGap 1.20 (2 at detail 2). Collar may
    add one tiny status slit at detail >= 2. No edge-lit panels.

DETAIL LADDER
    3  full: every construct, full plate / crate / lamp / port count
    2  all construct families; repeats halve
    1  loft + command host + cabin + rack + tug + pods + radiators
       + drive + zone straps
    0  loft + drive housing

ENVELOPE / AUTHORED AIM
    Driver: l = 17.0, b = 8.84, h = 5.78. Aim span 16.5-17.5
    (band [10.20, 23.80], target 17.0).
    Authored spanZ ~ 16.9; len/beam ~ 2.2 (>= 1.15); ht/len ~ 0.22
    (<= 0.60); beam/len ~ 0.45 (>= 0.16).
    Authored hull verts 12,000-28,000 (band 9,000-78,000).
    Island aim: one body; every fitting overlaps its host by >= 0.08.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import surplus as su
from . import hardware as hw


# Absolute structural sizes. Not scaled by l, b or h.
_BURY = 0.10
_RACK_LEN = 4.20
_HOST = (1.90, 1.30, 2.50)
_HOST_PROUD = 1.92
_PLINTH = (1.70, 0.36, 1.90)
_RAD = (2.10, 0.16, 2.70)
_DONATED = (0.16, 0.92, 2.40)
_CHEEK = (0.16, 0.88, 1.80)
_BAND = (0.16, 1.12, 3.80)


def _heavy_stations(l, b, h):
    """Blocky commercial work chassis. Longer than a cutter stick.

    Half-extents are absolute work-hull radii. z fractions of l.
    b and h are the class envelope; the brick does not fill them.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.400, 1.18, 0.94, 0.02),  # loft nose
        sf.fair(l * -0.340, 1.48, 1.08, 0.04),
        sf.fair(l * -0.296, 1.68, 1.18, 0.05),  # bow/mid
        sf.fair(l * -0.080, 1.88, 1.24, 0.06),
        sf.fair(l *  0.040, 1.90, 1.26, 0.06),  # max work
        sf.fair(l *  0.199, 1.74, 1.18, 0.04),  # mid/stern
        sf.fair(l *  0.340, 1.52, 1.06, 0.01),
        sf.fair(l *  0.470, 1.32, 0.96, -0.02),  # transom
    ]


def _centers(z0, z1, n):
    """n centres equally spaced on [z0, z1] inclusive."""
    if n <= 1:
        return ((z0 + z1) * 0.5,)
    step = (z1 - z0) / float(n - 1)
    return tuple(z0 + step * i for i in range(n))


def _zone_ring(parts, name, mat, stations, z, detail):
    """Zone seam from the local loft section. width/height are FULL."""
    hw2, hh2, yo, _ch = sf.seam_ring(stations, z, over=0.06)
    su.zone_strap(parts, name, mat, (0.0, yo, z),
                  width=hw2 * 2.0, height=hh2 * 2.0, detail=detail)


def _port_row(parts, name, mat, loc, count, detail):
    """One HUMAN flank-port row. Pitch is sf.PORT_SPACING. Not glow."""
    if detail < 2:
        return
    if detail >= 3:
        n = max(1, int(count))
    else:
        n = max(1, int(count) // 2)
    pitch = sf.PORT_SPACING
    z0 = loc[2] - pitch * (n - 1) * 0.5
    port = sf.FLANK_PORT
    for i in range(n):
        kit.box(parts, '%s.port.%d' % (name, i), kit.ROLE_RECESS,
                (loc[0], loc[1], z0 + pitch * i), port, mat)


def _belt(parts, name, mat, stations, z0, z1, y, count, detail):
    """One zone-local plate course. Does not cross a zone seam."""
    if detail < 2:
        return
    n = count if detail >= 3 else max(2, count // 2)
    cz = (z0 + z1) * 0.5
    run = max(z1 - z0, 0.80)
    hh = sf.section(stations, cz)[1]
    fx = sf.flank_anchor(stations, cz, y, 0.07)
    if fx <= 0.0:
        return
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.plate_course(parts, '%s.%s' % (name, tag), kit.ROLE_ARMOUR,
                         (side * fx, y, cz),
                         (0.14, hh * 1.05, run),
                         mat, count=n, axis='z', bevel=0.02)


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Independent hired escort (heavy class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 half repeats, 1 primary form, 0 mass only.
    """
    stations = _heavy_stations(l, b, h)

    z_nose = l * -0.400
    z_bow = l * -0.296
    z_mid = l * 0.199
    z_stern = l * 0.470

    # ── Work chassis + drive (detail 0+) ────────────────────────────────
    kit.hull_loft(parts, 'heavy.chassis', kit.ROLE_HULL, stations, hull_mat)

    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern),
                  max(d_hw * 0.78, 0.72), max(d_hh * 0.70, 0.52),
                  nozzles=6, depth=0.56, detail=detail)

    if detail < 1:
        return

    # ── Command host + cabin + G2 rack + tug + pods + radiators (1+) ───
    hx, hy, hz = _HOST
    z_host_nose = z_nose - _HOST_PROUD
    z_host = z_host_nose + hz * 0.5
    y_host = 0.10
    kit.chamfer_block(parts, 'heavy.command.host', kit.ROLE_HULL,
                      (0.0, y_host, z_host), _HOST, hull_mat,
                      chamfer=min(hx, hy) * 0.16)

    # Cabin stays the absolute commercial module; host is the extra mass.
    su.civilian_cabin(parts, 'heavy.command', hull_mat,
                      (0.0, y_host + 0.10, z_host - 0.28),
                      detail=min(detail, 2))

    hw.docking_collar(parts, glow, 'heavy.collar', hull_mat, glow_mat,
                      (0.0, y_host, z_host_nose), facing='nose',
                      detail=detail)

    # Cheek plates: bolted reinforcement, not citadel armour.
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.box(parts, 'heavy.command.cheek.' + tag, kit.ROLE_ARMOUR,
                (side * (hx * 0.5 + _CHEEK[0] * 0.5 - _BURY),
                 y_host, z_host + 0.08),
                _CHEEK, hull_mat)

    z_rack = (z_bow + z_mid) * 0.5
    y_deck = sf.top_y(stations, z_rack, 0.0)
    y_pad = y_deck - sf.RACK_PAD_T * 0.5
    su.crate_rack(parts, 'heavy.rack', hull_mat,
                  (-0.16, y_pad, z_rack),
                  length=_RACK_LEN, detail=detail)

    z_tug = z_stern - 1.20
    y_tug_deck = sf.top_y(stations, z_tug, 0.0)
    ty = _PLINTH[1]
    kit.box(parts, 'heavy.tug.plinth', kit.ROLE_HULL,
            (0.0, y_tug_deck - ty * 0.5 + _BURY, z_tug),
            _PLINTH, hull_mat)
    hw.tug_core(parts, 'heavy.tug', hull_mat,
                (0.0, y_tug_deck + sf.TUG_CORE[1] * 0.5 - _BURY, z_tug),
                detail=detail)

    # Weapon package: commercial mission pods, not turrets.
    n_pod = 2 if detail >= 2 else 1
    pod_zs = _centers(z_bow + 0.90, z_mid - 0.70, n_pod)
    px = sf.MISSION_POD[0]
    for i, cz in enumerate(pod_zs):
        y_p = 0.04
        fx_p = sf.flank_x(stations, cz, y_p)
        if fx_p <= 0.0:
            continue
        x_p = fx_p + px * 0.5 - _BURY
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.mission_pod(parts, 'heavy.pod.%s.%d' % (tag, i), hull_mat,
                           (side * x_p, y_p, cz), detail=detail)

    z_rad = l * 0.340
    rx = _RAD[0]
    y_rad = sf.straight_top(stations, z_rad) - 0.04
    fx_rad = sf.flank_x(stations, z_rad, y_rad)
    if fx_rad > 0.0:
        x_rad = fx_rad + rx * 0.5 - 0.14
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            hw.radiator_panel(parts, 'heavy.radiator.' + tag, hull_mat,
                              (side * x_rad, y_rad, z_rad), _RAD,
                              detail=detail)

    _zone_ring(parts, 'heavy.seam.bow', hull_mat, stations, z_bow, detail)
    _zone_ring(parts, 'heavy.seam.mid', hull_mat, stations, z_mid, detail)

    if detail < 2:
        return

    # ── Owner mark, leftover clamp, plates, band, lamps (detail 2+) ────
    z_own = z_rack + 0.85
    y_own = 0.18
    fx_own = sf.flank_x(stations, z_own, y_own)
    if fx_own > 0.0:
        ox = fx_own + sf.OWNER_MODULE[0] * 0.5 - _BURY
        su.owner_module(parts, 'heavy.owner', hull_mat,
                        (ox, y_own, z_own), detail=detail)

    # Functional asymmetry: one salvage clamp, port only, no starboard twin.
    y_cl = sf.bottom_y(stations, z_rack, 0.0) - sf.CLAMP_YOKE[1] * 0.5 + _BURY
    hw.clamp_pair(parts, 'heavy.clamp.port', hull_mat,
                  (-0.42, y_cl, z_rack + 0.20), detail=detail)

    # Donated mid plate on port only — secondhand section, not a Banner part.
    z_don = z_rack - 0.40
    y_don = 0.06
    fx_don = sf.flank_x(stations, z_don, y_don)
    if fx_don > 0.0:
        kit.box(parts, 'heavy.donated.port', kit.ROLE_ARMOUR,
                (-(fx_don + _DONATED[0] * 0.5 - _BURY), y_don, z_don),
                _DONATED, hull_mat)

    # Host / loft field welds and bow patch plates.
    su.field_weld(parts, 'heavy.weld.host', hull_mat,
                  (0.0, y_host + hy * 0.42, z_nose + 0.06),
                  length=0.72, axis='x', detail=detail)
    su.field_weld(parts, 'heavy.weld.bow', hull_mat,
                  (0.0, sf.top_y(stations, z_bow, 0.0) - 0.02, z_bow),
                  length=0.80, axis='x', detail=detail)
    su.patch_plate(parts, 'heavy.patch.host.stbd', hull_mat,
                   (hx * 0.5, y_host + 0.16, z_host - 0.35),
                   size=(0.52, 0.10, 0.70), facing='starboard',
                   detail=detail)
    su.patch_plate(parts, 'heavy.patch.host.port', hull_mat,
                   (-hx * 0.5, y_host - 0.10, z_host + 0.20),
                   size=(0.44, 0.10, 0.58), facing='port',
                   detail=detail)
    su.patch_plate(parts, 'heavy.patch.bow.dk', hull_mat,
                   (0.22, sf.top_y(stations, z_nose + 0.55, 0.20) - 0.03,
                    z_nose + 0.55),
                   size=(0.48, 0.10, 0.62), facing='up', detail=detail)

    n_strap = 2 if detail >= 3 else 1
    for i, cz in enumerate(pod_zs[:n_strap]):
        y_s = 0.28
        fx_s = sf.flank_x(stations, cz, y_s)
        if fx_s <= 0.0:
            continue
        su.strap_clamp(parts, 'heavy.strap.pod.%d' % i, hull_mat,
                       (fx_s - 0.04, y_s, cz),
                       span=0.70, axis='x', detail=detail)

    crate = sf.CARGO_CRATE[0]
    net_y = y_pad + sf.RACK_PAD_T * 0.5 + crate - 0.06
    su.cargo_net(parts, 'heavy.rack.net', hull_mat,
                 (-0.16, net_y, z_rack),
                 face=(crate, min(_RACK_LEN * 0.70, 2.60)),
                 facing='up', detail=detail)

    # Reinforcement belts stay inside one zone.
    _belt(parts, 'heavy.belt.mid', hull_mat, stations,
          z_bow + 0.20, z_mid - 0.20, 0.02, 8, detail)
    _belt(parts, 'heavy.belt.stern', hull_mat, stations,
          z_mid + 0.20, z_stern - 0.25, 0.00, 5, detail)
    _belt(parts, 'heavy.belt.bow', hull_mat, stations,
          z_nose + 0.15, z_bow - 0.12, 0.04, 4, detail)

    mid_cz = (z_bow + z_mid) * 0.5
    mid_run = z_mid - z_bow - 0.40
    mid_hw = sf.section(stations, mid_cz)[0]
    kit.plate_course(parts, 'heavy.belt.deck', kit.ROLE_ARMOUR,
                     (0.0, sf.top_y(stations, mid_cz, 0.0) - 0.03, mid_cz),
                     (mid_hw * 1.55, 0.10, mid_run),
                     hull_mat, count=6 if detail >= 3 else 3,
                     axis='z', bevel=0.02)
    kit.plate_course(parts, 'heavy.belt.keel', kit.ROLE_ARMOUR,
                     (0.0, sf.bottom_y(stations, mid_cz, 0.0) + 0.03, mid_cz),
                     (mid_hw * 1.40, 0.10, mid_run),
                     hull_mat, count=5 if detail >= 3 else 3,
                     axis='z', bevel=0.02)

    # One service band: starboard mid access lids.
    z_band = mid_cz
    y_band = 0.06
    fx_band = sf.flank_x(stations, z_band, y_band)
    if fx_band > 0.0:
        loc_band = (fx_band - _BAND[0] * 0.5 + 0.05, y_band, z_band)
        cols = 6 if detail >= 3 else 3
        rows = 3 if detail >= 3 else 2
        kit.plate_grid(parts, 'heavy.access', kit.ROLE_HULL, loc_band, _BAND,
                       hull_mat, cols, rows, face='x', depth=0.07, gap=0.08)

        # 4 lamps at HUMAN 1.20. Same band, same flank.
        x_lamp = fx_band - 0.08
        hw.lamp_run(parts, glow, 'heavy.lamps', hull_mat, glow_mat,
                    (x_lamp, y_band + 0.36, z_band),
                    count=4, axis='z', facing='starboard', detail=detail)

    # One HUMAN port row on the command-host starboard flank.
    _port_row(parts, 'heavy.command', hull_mat,
              (hx * 0.5 - 0.01, y_host + 0.12, z_host),
              count=5, detail=detail)
