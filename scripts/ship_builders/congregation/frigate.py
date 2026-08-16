"""Congregation Frigate — PILGRIMAGE ESCORT.

Bible §4.9: "A long outward-pointing command ship with a luminous forward
observation chamber, repeated silver ribs, sect-specific modular bays,
rescue hangar, and folded radial sails." Construction logic is REPEATED
MODULE, ritual. One part, many copies. Sect bays are MORE drum_bay /
shrine_can of the SAME size, different seeds and stations — not new
cathedrals.

Plate 09-congregation-further-shore-ship.png is the closest class
reference (long midnight drum, silver ribs, geodesic amber nave, folded
radial vanes, underslung canvas). Honour the family. Do not copy the
plate vertex-for-vertex.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; authored largest-dimension target ≈ 30.2
(nave tip to drive face). Hull vertex band [16 000, 84 000]; authored
aim 22 000–55 000. lod0 triangle cap 60 000. Engine glow at l*0.47.
Proportions 1.15 / 0.60 / 0.16 (length-leads-beam, height/length,
beam/length). Congregation has no FACTION_PROPORTION_RELIEF.

BODY PLAN
    A LONG drum loft is the cigar spine. 10–11 ``rt.drum_bay`` copies
    of the default 1.40 module stack through the mid body; ``rt.rib_ring``
    sits at each bay joint and continues the silver rhythm onto the bow
    and stern tapers. The luminous bow is ``hw.observation_nave`` at
    radius 0.80, length 1.80, intersecting the loft. Sect bays are
    ``rt.shrine_procession`` on port, starboard and dorsal mid — same
    can, one run one can longer (starboard). Folded radial sails are
    ``rt.sail_cluster`` count=6 plane='xy' on a real dorsal mast/hub
    drum, plus a smaller plane='xz' cluster. §G5 is an OPEN starboard
    hangar (three walls + floor); the pad runs through the inboard wall
    and a small craft INTERSECTS the pad. §G3 is a flat radiator pair
    and a 8-nozzle drive face. Ventral ``hw.docking_collar`` and
    ``hw.receiving_lock``. ``hw.lamp_row`` in ONE mid band only.

STATIONS (z as fractions of l; half-extents are the DRUM, never the
class beam — the sail set breaks the outline):
    Loft nose at l*-0.430 = -13.760; transom at l*0.468 = +14.976.
    Drive loc at l*0.470 = +15.040 (engine glow).
    Nave centre at l*-0.445 = -14.240; tip at centre - 0.90 = -15.140.
    Authored span ≈ 30.18. Bow/mid seam at l*-0.250 = -8.000;
    mid/stern seam at l*+0.200 = +6.400.
    Drum half-beam 0.95 → 1.85 → 1.20; half-height 0.90 → 1.72 → 1.10.

ZONES (no shrine run crosses a seam; rib rings mark the joints):
    bow   nave-tip .. l*-0.250    ~23.7 % of authored hull
    mid   l*-0.250 .. l*+0.200    ~47.7 %
    stern l*+0.200 .. drive       ~28.6 %

OUTLINE-BREAKER (§G2): the dorsal xy sail cluster. Vane module stays
SAIL_SPAN = 1.85. The cluster grows by hub_radius, not by scaling.
    reach = hub_radius + sf.SAIL_SPAN - sf.SAIL_BURY
          = hub_radius + 1.85 - 0.14
          = hub_radius + 1.71
    need  = 0.15 * 32.0 = 4.80  ⇒  hub_radius >= 3.09
    Authored hub_radius = 3.12. reach = 4.83 >= 4.80.
    Hub sits as a real mast/drum mass through the loft so the vane
    root is not a floating disc. A smaller xz cluster (hub 1.35,
    count 4) is a second folded set, not the G2 proof.

G3
    ``hw.radiator_panel`` pair, flat, no fins: size (0.16, 2.50, 4.00),
    port and starboard stern flanks, buried >= 0.12.
    ``hw.drive_face`` 8 countable nozzles on a midnight housing.

G5
    Starboard mid OPEN bay: inboard wall + forward wall + aft wall +
    floor. No outboard face, no roof. Floor pad runs through the
    inboard wall into the drum. Docked craft is a sphere (r = 0.50)
    plus two boxes — not a call to another class. Craft INTERSECTS
    the pad. A nest wholly inside a wall box would float.

EMISSIVE BUDGET (<= 5 % of hull area):
    Nave interior, drive discs, one mid lamp row (4–6), collar and
    lock slits. No edge-lit panels. AUTHORED AIM: emissive ~= 1.5 %.

DETAIL LADDER
    3  full: every construct, full processions / sails / lamps / ribs
    2  half processions / sails / lamps; bays and hangar stay
    1  loft + bays + nave + sail hubs + hangar pad + craft body
       + radiators + drive
    0  loft + nave + drive
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import ritual as rt
from . import hardware as hw


_OVERLAP = 0.12
_BAY_LEN = sf.DRUM_BAY_LEN
_HUB_XY = 3.12
_HUB_XZ = 1.35
_NAVE_R = 0.80
_NAVE_LEN = 1.80


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, _b, _h):
    """Outer drum envelope for queries. Long cigar, not the class beam.

    Half-extents are the midnight drum radius. Sails break the outline.
    Nose at l*-0.430; transom at l*0.468.
    """
    return [
        sf.fair(l * -0.430, 0.95, 0.90, 0.0),
        sf.fair(l * -0.370, 1.38, 1.28, 0.0),
        sf.fair(l * -0.250, 1.68, 1.56, 0.0),
        sf.fair(l * -0.120, 1.80, 1.68, 0.0),
        sf.fair(l *  0.000, 1.85, 1.72, 0.0),
        sf.fair(l *  0.100, 1.82, 1.70, 0.0),
        sf.fair(l *  0.200, 1.70, 1.58, 0.0),
        sf.fair(l *  0.320, 1.58, 1.46, 0.0),
        sf.fair(l *  0.400, 1.42, 1.32, 0.0),
        sf.fair(l *  0.468, 1.20, 1.10, 0.0),
    ]


# ===========================================================================
# COUNTS AND SPANS
# ===========================================================================

def _n(detail, full, half=None, low=None, mass=None):
    if half is None:
        half = max(1, int(full) // 2)
    if low is None:
        low = max(1, int(full) // 3)
    if mass is None:
        mass = max(1, int(full) // 4)
    if detail >= 3:
        return int(full)
    if detail == 2:
        return int(half)
    if detail == 1:
        return int(low)
    return int(mass)


def _fill_span(z0, z1, n, overlap=_OVERLAP):
    """Return (bay_length, centres) that fill [z0, z1] with overlap >= 0.10."""
    n = max(1, int(n))
    span = z1 - z0
    if n == 1:
        return span, ((z0 + z1) * 0.5,)
    bay = (span - overlap) / float(n) + overlap
    if bay < 0.40:
        bay = 0.40
    pitch = bay - overlap
    cz0 = z0 + bay * 0.5
    return bay, tuple(cz0 + i * pitch for i in range(n))


def _rib_zs(z0, z1, pitch=_BAY_LEN):
    """Centres for extra silver ribs between z0 and z1."""
    if z1 <= z0 + 0.20:
        return ()
    n = max(1, int((z1 - z0) / pitch))
    if n == 1:
        return ((z0 + z1) * 0.5,)
    step = (z1 - z0) / float(n)
    return tuple(z0 + step * (i + 0.5) for i in range(n))


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Congregation pilgrimage escort (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full  2 half processions/sails/lamps
                1 loft + bays + nave + sail hubs + hangar + radiators + drive
                0 loft + nave + drive.

    AUTHORED AIM only (no bake in this file):
        span ≈ 30.2; verts 22 000–55 000; engine glow at l*0.47
        len/beam >= 1.15; ht/len <= 0.60; beam/len >= 0.16
    """
    H = kit.ROLE_HULL

    stations = _frigate_stations(l, b, h)

    z_loft0 = l * -0.430
    z_bow_s = l * -0.250
    z_mid_s = l * 0.200
    z_trans = l * 0.468
    z_drive = l * 0.470
    z_nave = l * -0.445

    z_sail_xy = l * 0.220
    z_sail_xz = l * -0.180
    z_hang = l * -0.050
    z_dock = l * 0.080
    z_lock = l * -0.090
    z_rad = l * 0.360
    z_lamp = l * 0.000
    z_drape = l * 0.040

    # ── LONG DRUM LOFT (always). ─────────────────────────────────────────
    kit.hull_loft(parts, 'frigate.drumloft', H, stations, hull_mat)

    # ── LUMINOUS BOW NAVE (always). Intersects the loft. ─────────────────
    hw.observation_nave(parts, glow, 'frigate.nave', hull_mat, glow_mat,
                        (0.0, 0.0, z_nave),
                        radius=_NAVE_R, length=_NAVE_LEN, detail=detail)

    # ── DRIVE FACE (always): 8 countable nozzles. Glow at l*0.47. ────────
    d_w, d_h, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_drive), max(d_w, 0.70), max(d_h, 0.58),
                  nozzles=8, depth=0.55, detail=detail)

    if detail < 1:
        return

    # ── REPEATED DRUM BAYS + JOINT RIBS (detail 1+). ─────────────────────
    n_bay = _n(detail, 11, 6, 4, 0)
    z_bay0 = z_bow_s + 0.20
    z_bay1 = z_mid_s - 0.20
    _, bay_zs = _fill_span(z_bay0, z_bay1, n_bay)
    for i, cz in enumerate(bay_zs):
        half_w, half_h, yo, _ch = sf.section(stations, cz)
        rad = max(min(half_w, half_h), 0.40)
        rt.drum_bay(parts, 'frigate.bay.%02d' % i, hull_mat,
                    (0.0, yo, cz), radius=rad, length=_BAY_LEN,
                    detail=detail)
        if i > 0:
            jz = (bay_zs[i - 1] + cz) * 0.5
            jw, jh, jyo, _ = sf.section(stations, jz)
            rt.rib_ring(parts, 'frigate.bay.joint.%02d' % i, hull_mat,
                        (0.0, jyo, jz), max(min(jw, jh), 0.40),
                        detail=detail)

    # ── SAIL HUB / MAST MASS (detail 1+). Vanes count down inside. ───────
    yo_xy = sf.section(stations, z_sail_xy)[2]
    deck_xy = sf.top_y(stations, z_sail_xy, 0.0)
    hub_xy = (0.0, yo_xy + 0.55, z_sail_xy)
    # Real mast trunk and hub drum so the large G2 hub is not a paper disc.
    kit.cyl(parts, 'frigate.sail.mast-trunk', H,
            (0.0, yo_xy + 0.70, z_sail_xy),
            0.52, 3.40, hull_mat, rotation=sf.CYL_ALONG_Y, vertices=12)
    kit.cyl(parts, 'frigate.sail.hub-mass', H, hub_xy,
            1.10, 1.70, hull_mat, rotation=sf.CYL_ALONG_Z, vertices=12)
    kit.cyl(parts, 'frigate.sail.hub-collar', kit.ROLE_ARMOUR,
            (0.0, deck_xy + 0.10, z_sail_xy),
            0.72, 0.55, hull_mat, rotation=sf.CYL_ALONG_Y, vertices=10)
    sail_d = detail if detail >= 2 else 0
    rt.sail_cluster(parts, 'frigate.sail.xy', hull_mat, hub_xy,
                    count=6, hub_radius=_HUB_XY, plane='xy',
                    detail=sail_d)

    deck_xz = sf.top_y(stations, z_sail_xz, 0.0)
    hub_xz = (0.0, deck_xz + 0.10, z_sail_xz)
    kit.cyl(parts, 'frigate.sail.xz-mast', H, hub_xz,
            0.38, 1.40, hull_mat, rotation=sf.CYL_ALONG_Y, vertices=10)
    rt.sail_cluster(parts, 'frigate.sail.xz', hull_mat, hub_xz,
                    count=4, hub_radius=_HUB_XZ, plane='xz',
                    detail=sail_d)

    # ── §G3 RADIATORS (detail 1+): flat pair, buried >= 0.12. ────────────
    rad_y = sf.section(stations, z_rad)[2] + 0.50
    rad_fx = sf.flank_x(stations, z_rad, rad_y)
    if rad_fx <= 0.0:
        rad_fx = sf.section(stations, z_rad)[0]
        rad_y = sf.section(stations, z_rad)[2]
    rad_size = (0.16, 2.50, 4.00)
    # centre = flank + half_thick - bury; bury 0.12, proud 0.04
    rad_x = rad_fx + rad_size[0] * 0.5 - 0.12
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'frigate.rad.%s' % tag, hull_mat,
                          (side * rad_x, rad_y, z_rad),
                          rad_size, detail=detail)

    # ── §G5 RESCUE HANGAR (detail 1+): open bay, pad through wall. ───────
    _hangar(parts, hull_mat, stations, z_hang, detail)

    # ── VENTRAL COLLAR + RECEIVING LOCK (detail 1+). ─────────────────────
    keel_d = sf.bottom_y(stations, z_dock, 0.0)
    hw.docking_collar(parts, glow, 'frigate.dock', hull_mat, glow_mat,
                      (0.0, keel_d, z_dock), facing='down', detail=detail)
    keel_l = sf.bottom_y(stations, z_lock, 0.0)
    hw.receiving_lock(parts, glow, 'frigate.lock', hull_mat, glow_mat,
                      (0.0, keel_l, z_lock), facing='down', detail=detail)

    if detail < 2:
        return

    # ── BOW / STERN SILVER RIBS (detail 2+): same rib module. ────────────
    n_rib = 3 if detail >= 3 else 2
    for i, rz in enumerate(_rib_zs(z_loft0 + 1.10, z_bay0 - 0.20,
                                   pitch=_BAY_LEN)[:n_rib + 1]):
        rw, rh, ryo, _ = sf.section(stations, rz)
        rt.rib_ring(parts, 'frigate.rib.bow.%d' % i, hull_mat,
                    (0.0, ryo, rz), max(min(rw, rh), 0.40),
                    detail=detail)
    for i, rz in enumerate(_rib_zs(z_bay1 + 0.20, z_trans - 0.45,
                                   pitch=_BAY_LEN)[:n_rib + 1]):
        rw, rh, ryo, _ = sf.section(stations, rz)
        rt.rib_ring(parts, 'frigate.rib.stern.%d' % i, hull_mat,
                    (0.0, ryo, rz), max(min(rw, rh), 0.40),
                    detail=detail)

    # ── SECT BAYS (detail 2+): same shrine_can, one run longer. ──────────
    _sect_bays(parts, hull_mat, stations, l, detail)

    # ── ONE MID LAMP BAND (detail 2+): count 5, pitch 1.20. ──────────────
    lamp_y = sf.top_y(stations, z_lamp, 0.0)
    kit.box(parts, 'frigate.lamps.rail', H,
            (0.0, lamp_y - 0.04, z_lamp),
            (0.28, 0.14, 5.40), hull_mat)
    hw.lamp_row(parts, glow, 'frigate.lamps', hull_mat, glow_mat,
                (0.0, lamp_y + 0.02, z_lamp), count=5, axis='z',
                detail=detail)

    # ── STOWED SHELTER CANVAS (detail 2+): plate family, keel-seated. ────
    keel_c = sf.bottom_y(stations, z_drape, 0.0)
    rt.canvas_drape(parts, 'frigate.drape', hull_mat,
                    (0.0, keel_c + 0.02, z_drape), detail=detail)

    if detail < 3:
        return

    # ── RESTRAINED OPTICS + RESCUE STORES (detail 3). ────────────────────
    z_opt = l * -0.310
    opt_y = sf.straight_top(stations, z_opt) - 0.08
    opt_x = sf.flank_x(stations, z_opt, opt_y)
    if opt_x > 0.0:
        hw.wakeglass_optic(parts, glow, 'frigate.optic.stbd',
                           hull_mat, glow_mat,
                           (opt_x - 0.02, opt_y, z_opt),
                           facing='starboard', detail=detail)
        hw.wakeglass_optic(parts, glow, 'frigate.optic.port',
                           hull_mat, glow_mat,
                           (-opt_x + 0.02, opt_y, z_opt),
                           facing='port', detail=detail)

    hang_yo = sf.section(stations, z_hang)[2]
    hang_fx = sf.flank_x(stations, z_hang, hang_yo)
    pad_top = hang_yo - 0.82 + 0.09
    store_y = pad_top + sf.ARCHIVE[1] * 0.5 - 0.14
    hw.archive_box(parts, 'frigate.store.0', hull_mat,
                   (hang_fx + 0.55, store_y, z_hang - 0.85),
                   detail=detail)
    hw.archive_box(parts, 'frigate.store.1', hull_mat,
                   (hang_fx + 0.55, store_y, z_hang + 0.85),
                   detail=detail)


def _sect_bays(parts, hull_mat, stations, l, detail):
    """Port / starboard / dorsal shrine processions. Same can. One longer."""
    # Starboard is the long run (count 4). Port and dorsal stay at 3.
    specs = (
        ('stbd', l * 0.120, 4, 1.0, 0.0),
        ('port', l * 0.000, 3, -1.0, 0.0),
        ('dorsal', l * -0.340, 3, 0.0, 1.0),
    )
    for tag, cz, count, sx, sy in specs:
        half_w, half_h, yo, _ = sf.section(stations, cz)
        if half_w <= 0.0 or half_h <= 0.0:
            continue
        bury = _OVERLAP
        if sy > 0.0:
            ty = sf.top_y(stations, cz, 0.0)
            loc = (0.0, ty + sf.SHRINE_CAN_R - bury, cz)
        else:
            fx = sf.flank_x(stations, cz, yo)
            loc = (sx * (fx + sf.SHRINE_CAN_R - bury), yo, cz)
        rt.shrine_procession(parts, 'frigate.sect.%s' % tag, hull_mat,
                             loc, count=count, axis='z', detail=detail)


def _hangar(parts, hull_mat, stations, z_hang, detail):
    """Open starboard hangar. Pad pierces the wall. Craft intersects pad."""
    H = kit.ROLE_HULL
    half_w, half_h, yo, _ = sf.section(stations, z_hang)
    fx = sf.flank_x(stations, z_hang, yo)
    if fx <= 0.0:
        fx = half_w

    # Inboard wall: three walls + floor, no outboard face, no roof.
    wall_x = fx - 0.01
    kit.box(parts, 'frigate.hangar.wall.in', H,
            (wall_x, yo - 0.15, z_hang),
            (0.22, 1.20, 2.50), hull_mat)
    kit.box(parts, 'frigate.hangar.wall.fwd', H,
            (fx + 0.70, yo - 0.18, z_hang - 1.22),
            (1.55, 1.16, 0.16), hull_mat)
    kit.box(parts, 'frigate.hangar.wall.aft', H,
            (fx + 0.70, yo - 0.18, z_hang + 1.22),
            (1.55, 1.16, 0.16), hull_mat)

    # Floor pad MUST run through the inboard wall (G5 island trap).
    pad_x = fx + 0.50
    pad_y = yo - 0.82
    kit.box(parts, 'frigate.hangar.pad', H,
            (pad_x, pad_y, z_hang),
            (2.40, 0.18, 2.70), hull_mat)
    kit.box(parts, 'frigate.hangar.keel-strut', H,
            (fx - 0.10, yo - 0.48, z_hang),
            (0.70, 0.28, 0.55), hull_mat)

    # Small craft, body radius 0.50. Centre sits so the sphere bites the pad.
    craft_x = fx + 0.88
    craft_y = pad_y + 0.28
    kit.sphere(parts, 'frigate.hangar.craft.body', H,
               (craft_x, craft_y, z_hang),
               (0.50, 0.50, 0.50), hull_mat, segments=12)
    if detail >= 2:
        kit.box(parts, 'frigate.hangar.craft.fuse', H,
                (craft_x, craft_y + 0.02, z_hang + 0.08),
                (0.42, 0.26, 1.05), hull_mat)
        kit.box(parts, 'frigate.hangar.craft.wing', kit.ROLE_ARMOUR,
                (craft_x, craft_y + 0.06, z_hang - 0.10),
                (1.05, 0.10, 0.34), hull_mat)
        kit.box(parts, 'frigate.hangar.cradle', H,
                (craft_x, pad_y + 0.12, z_hang),
                (0.55, 0.16, 0.80), hull_mat)
