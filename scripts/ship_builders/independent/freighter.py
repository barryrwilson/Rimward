"""Independent Freighter — BASELINE BULK HAULER.

Bible §5.1 Freighter: "The baseline bulk hauler—huge standardized
containers around an old tug core, visibly serviced by small craft and
always externally berthed."

No concept-art plate. Construction is REPEATED COMMERCIAL MODULE /
LASH-UP. An old tug chassis is the connective heart. The silhouette is
a mountain of standardized 0.85 crates on long racks. Grow COUNT and
rack LENGTH. Never inflate the crate.

BODY PLAN
    Slim lofted tug chassis along Z. ``hw.tug_core`` sits offset to
    port, visibly smaller than the cargo. Bow is a civilian cabin
    cluster plus a ventral external berth collar. Mid is the container
    mountain and a leftover command-spine box. Stern is the tug drive
    (8 nozzles) and one large flat radiator pair.

STATIONS (z as fractions of l; half-extents ABSOLUTE, never *b / *h):
    Nose at l*-0.448 = -38.080; transom at l*0.470 = +39.950.
    Drive housing face 0.12 aft → +40.070. Bow cabin overhang ≈ -38.78.
    Authored spanZ ≈ 78.9 (aim 78, band [66.00, 109.20], floor 66).
    Bow/mid seam at l*-0.220 = -18.700; mid/stern at l*+0.220 = +18.700.

ZONES (of loft nose..transom = 78.03):
    bow   l*-0.448 .. l*-0.220    ~25 %  cabins + ventral collar
    mid   l*-0.220 .. l*+0.220    ~48 %  crate mountain, offset tug,
                                          open bay, owner-module
    stern l*+0.220 .. l*+0.470    ~27 %  8-nozzle drive, radiator pair

OUTLINE-BREAKER (§G2): ``su.crate_rack`` runs of length 16.20
    (>= 0.15*l = 12.75). Grow length / count; crate stays 0.85.

§G3  Large FLAT ``hw.radiator_panel`` pair on the stern. ``hw.drive_face``
    8 countable nozzles in a 4x2 grid. No ``kit.engine_bank``.

§G5  One OPEN starboard mid bay (inboard + forward + aft walls, no
    outboard face, no roof). Cradle pad starts inboard and runs THROUGH
    the wall. A 3-box shuttle (~2.05 long) INTERSECTS that pad.

Always externally berthed: ``hw.docking_collar`` on the ventral bow
face (facing down), not hidden in the mountain.

ONE ``su.owner_module`` (ROLE_ACCENT). Other crates / plates are hull
or armour. One functional asymmetry: tug core offset to port; open bay
and extra crate column stay starboard / port as a pair.

ONE service band: starboard mid rail, lamps at ``sf.LAMP_SPACING`` 1.20.
Emissive <= 5 %: 8 drive discs, sparse lamps, one collar slit.

DETAIL LADDER (this class has lod3):
    3  full racks, full mountain, nets, lamps, bay shuttle, fittings
    2  half rack / cube repeats; hardware halves internally
    1  chassis, tug, drive, radiators, collar, cabins, bay + shuttle,
       short rack row, a crate block
    0  chassis + tug core + drive + radiators + collar + rack frames
       + crate masses. Must still read as tug-core + container mountain.

DENSITY (AUTHORED AIM only — re-derive after bake):
    hull verts 50 000–80 000 (band [34 000, 154 000])
    max span ~79 (band [66.00, 109.20], target 78)
    spanZ/spanX >= 1.05; spanY/spanZ <= 0.62; spanX/spanZ >= 0.16
    triangles inside 60 000 / 24 000 / 8 000 / 4 000 (lod0..lod3)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import surplus as su
from . import hardware as hw


# Absolute modules. Never multiply by l, b or h.
_RACK_LEN = 16.20
_PAD_T = 0.12
_LAYER = 0.72
_COL_PITCH = 0.80
_CRATE = sf.CARGO_CRATE[0]
_SHUTTLE_BODY = (1.05, 0.46, 2.05)
_SHUTTLE_NOSE = (0.72, 0.36, 0.70)
_SHUTTLE_TAIL = (0.58, 0.32, 0.48)
_BAY_KEEP = 3.40


# ===========================================================================
# STATION LIST
# ===========================================================================

def _freighter_stations(l):
    """Old tug chassis. Absolute half-extents. Nose at l*-0.448."""
    return [
        sf.fair(l * -0.448, 1.15, 1.00, 0.12),  # nose
        sf.fair(l * -0.380, 1.55, 1.25, 0.10),
        sf.fair(l * -0.300, 1.70, 1.35, 0.08),
        sf.fair(l * -0.220, 1.75, 1.40, 0.06),  # bow / mid seam
        sf.fair(l * -0.050, 1.85, 1.45, 0.04),
        sf.fair(l *  0.080, 1.85, 1.45, 0.02),
        sf.fair(l *  0.220, 1.80, 1.40, 0.00),  # mid / stern seam
        sf.fair(l *  0.340, 1.70, 1.35, 0.00),
        sf.fair(l *  0.420, 1.55, 1.25, 0.00),
        sf.fair(l *  0.470, 1.65, 1.35, 0.00),  # transom
    ]


# ===========================================================================
# COUNTS
# ===========================================================================

def _n(detail, full, half=None, low=None, mass=None):
    if half is None:
        half = max(1, int(full) // 2)
    if low is None:
        low = max(1, int(full) // 4)
    if mass is None:
        mass = 0
    if detail >= 3:
        return int(full)
    if detail == 2:
        return int(half)
    if detail == 1:
        return int(low)
    return int(mass)


def _keepout(z, centre, radius):
    return abs(z - centre) < radius


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Independent bulk hauler (freighter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (85.0, 46.75, 25.5).
    detail   -- 3 full  2 halved repeats  1 primary masses + bay
                0 chassis + tug + drive + rack frames + crate masses.
                lod3 exists (detail 0).

    AUTHORED AIM only (no bake in this file):
        span ≈ 79; verts 50 000–80 000; engine glow at l*0.47
        G2 rack 16.20 >= 12.75; G5 shuttle nest; G3 8-nozzle + rad pair
        spanZ/spanX >= 1.05; spanY/spanZ <= 0.62; spanX/spanZ >= 0.16
        triangles 60 000 / 24 000 / 8 000 / 4 000
    """
    H = kit.ROLE_HULL
    _ = (b, h)

    st = _freighter_stations(l)

    z_nose = l * -0.448
    z_bow_s = l * -0.220
    z_mid_s = l * 0.220
    z_trans = l * 0.470
    z_bay = l * 0.055
    z_tug = l * 0.188
    z_dock = z_nose + 2.20
    z_om = l * -0.305

    # ── OLD TUG CHASSIS (always). ───────────────────────────────────────
    kit.hull_loft(parts, 'freighter.chassis', H, st, hull_mat)

    # Command-spine remnant: leftover tug roof, mid zone only.
    z_sp = (z_bow_s + z_mid_s) * 0.5
    ty_sp = sf.top_y(st, z_sp, 0.0)
    kit.box(parts, 'freighter.spine.remnant', H,
            (0.0, ty_sp + 0.06, z_sp),
            (1.10, 0.28, (z_mid_s - z_bow_s) * 0.82), hull_mat)

    # Heart of the ship: one old tug core, offset to port, buried.
    sy_t = sf.TUG_CORE[1]
    cy_t = sf.top_y(st, z_tug, -0.72) - sy_t * 0.22
    hw.tug_core(parts, 'freighter.tug', hull_mat,
                (-0.72, cy_t, z_tug), detail=detail)

    # ── DRIVE FACE (always): 8 nozzles, 4x2 grid on the transom. ────────
    d_hw, d_hh, d_yo, _ch = sf.section(st, z_trans)
    hw.drive_face(parts, glow, 'freighter.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), d_hw, d_hh,
                  nozzles=8, depth=0.72, detail=detail)

    # ── §G3 RADIATORS (always): large flat slabs; primary outline. ──────
    _place_radiators(parts, st, hull_mat, l, detail)

    # ── CONTAINER MASS (always): G2 racks + a crate block. ──────────────
    _place_racks(parts, st, hull_mat, z_bow_s, z_mid_s, z_bay, detail)
    _crate_block(parts, st, hull_mat, z_bow_s, z_mid_s, z_bay, detail)

    # ── BOW CABIN + VENTRAL COLLAR (always): external berth, spanZ. ─────
    _bow_cluster(parts, glow, st, hull_mat, glow_mat,
                 z_nose, z_dock, detail)

    if detail < 1:
        return

    # ── ZONE STRAPS at the two seams (detail 1+). ───────────────────────
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        hw_s, hh_s, yo_s, _c = sf.seam_ring(st, zs, over=0.08)
        su.zone_strap(parts, 'freighter.seam.' + tag, hull_mat,
                      (0.0, yo_s, zs),
                      width=hw_s * 2.0, height=hh_s * 2.0, detail=detail)

    # ── §G5 OPEN BAY (detail 1+): pad through the wall, shuttle on pad. ─
    _open_bay(parts, hull_mat, z_bay, detail)

    # ── ONE OWNER MODULE (detail 1+): the single accent. ────────────────
    ty_om = sf.top_y(st, z_om, 0.40)
    su.owner_module(parts, 'freighter.owner', hull_mat,
                    (0.52, ty_om + sf.OWNER_MODULE[1] * 0.5 - 0.12, z_om),
                    detail=detail)

    if detail < 2:
        return

    # ── JOINT HARDWARE + NETS + SERVICE BAND (detail 2+). ───────────────
    _joint_plates(parts, st, hull_mat, z_bow_s, z_mid_s, detail)
    _cargo_nets(parts, st, hull_mat, z_bow_s, z_mid_s, z_bay, detail)
    _service_band(parts, glow, st, hull_mat, glow_mat,
                  z_bow_s, z_mid_s, z_bay, detail)

    if detail < 3:
        return

    # ── EXTRA PATCHES on the tug and a few cabin straps (detail 3). ─────
    _place_detail_gear(parts, st, hull_mat, l, z_tug, detail)


# ===========================================================================
# CARGO MOUNTAIN
# ===========================================================================

def _rack_xs(detail):
    """Inboard rack columns. Port carries one extra column (asymmetry)."""
    n = _n(detail, 3, 2, 2, 1)
    stbd = tuple(2.15 + i * _COL_PITCH for i in range(n))
    n_p = n + (1 if detail >= 2 else 0)
    port = tuple(-(2.15 + i * _COL_PITCH) for i in range(n_p))
    return port, stbd


def _rack_zs(z_bow_s, z_mid_s):
    """Two G2 runs that fill mid without crossing the zone seams."""
    z0 = z_bow_s + _RACK_LEN * 0.5 + 0.35
    z1 = z_mid_s - _RACK_LEN * 0.5 - 0.35
    return (z0, z1)


def _pad_y(st, z):
    return sf.top_y(st, z, 0.0) - 0.04


def _place_racks(parts, st, mat, z_bow_s, z_mid_s, z_bay, detail):
    """Long crate_rack runs. Length 16.20 is the §G2 breaker."""
    port, stbd = _rack_xs(detail)
    zs = _rack_zs(z_bow_s, z_mid_s)
    n_ly = _n(detail, 1, 1, 1, 1)
    ly0 = _pad_y(st, 0.0)
    # Keel beams bury every pad into the chassis (island probe).
    for zi, cz in enumerate(zs):
        for side, cols, tag in ((-1.0, port, 'p'), (1.0, stbd, 's')):
            if not cols:
                continue
            x_out = cols[-1]
            if side > 0.0:
                x_a = 0.70
                x_b = x_out + 0.35
            else:
                x_a = -0.70
                x_b = x_out - 0.35
            kit.box(parts, 'freighter.keel.%s.%d' % (tag, zi), kit.ROLE_HULL,
                    ((x_a + x_b) * 0.5, ly0, cz),
                    (abs(x_b - x_a), 0.18, _RACK_LEN * 0.88), mat)
            for xi, xx in enumerate(cols):
                if side > 0.0 and zi == 1 and _keepout(cz, z_bay, _BAY_KEEP):
                    if xi == 0:
                        continue
                for layer in range(n_ly):
                    ly = ly0 + layer * _LAYER
                    su.crate_rack(parts, 'freighter.rack.%s.%d.%d.%d' %
                                  (tag, zi, xi, layer), mat,
                                  (xx, ly, cz),
                                  length=_RACK_LEN, detail=detail)


def _crate_block(parts, st, mat, z_bow_s, z_mid_s, z_bay, detail):
    """ISO crate mountain on shared pads. Crates pierce the pad."""
    n_x = _n(detail, 5, 3, 2, 2)
    n_y = _n(detail, 2, 1, 1, 1)
    n_z = _n(detail, 14, 7, 4, 3)
    crate_d = 1 if detail >= 1 else 0
    ly0 = _pad_y(st, 0.0) + _LAYER
    z0 = z_bow_s + 1.20
    z1 = z_mid_s - 1.20
    # Port runs wider (one extra outboard column).
    sides = (
        (-1.0, 'p', 2.15 + 3 * _COL_PITCH),
        (1.0, 's', 2.15 + 3 * _COL_PITCH),
    )
    if detail >= 2:
        sides = (
            (-1.0, 'p', 2.15 + 4 * _COL_PITCH),
            (1.0, 's', 2.15 + 3 * _COL_PITCH),
        )
    for side, tag, x_origin in sides:
        xs = [side * (x_origin + i * _COL_PITCH) for i in range(n_x)]
        if n_z <= 1:
            zs = [(z0 + z1) * 0.5]
        else:
            span = z1 - z0
            zs = [z0 + span * i / float(n_z - 1) for i in range(n_z)]
        x_lo = min(xs)
        x_hi = max(xs)
        pad_w = (x_hi - x_lo) + 0.30
        pad_l = (max(zs) - min(zs)) + _CRATE + 0.20
        for layer in range(n_y):
            ly = ly0 + layer * _LAYER
            kit.box(parts, 'freighter.mtn.pad.%s.%d' % (tag, layer),
                    kit.ROLE_HULL,
                    ((x_lo + x_hi) * 0.5, ly, (z0 + z1) * 0.5),
                    (pad_w, _PAD_T, pad_l), mat)
            crate_y = ly + _PAD_T * 0.5 + _CRATE * 0.5 - 0.08
            for xi, xx in enumerate(xs):
                for zi, cz in enumerate(zs):
                    if side > 0.0 and _keepout(cz, z_bay, _BAY_KEEP):
                        continue
                    su.iso_crate(parts, 'freighter.mtn.%s.%d.%d.%d' %
                                 (tag, layer, xi, zi), mat,
                                 (xx, crate_y, cz), detail=crate_d)


def _place_radiators(parts, st, mat, l, detail):
    """Large FLAT radiator wings on the drive house. Outline breakers."""
    z_h = l * 0.360
    yo = sf.section(st, z_h)[2]
    fx = sf.flank_x(st, z_h, yo)
    if fx <= 0.20:
        fx = 1.70
    hx, hy, hz = (14.40, 0.22, 12.60)
    inset = 0.16
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        loc_x = side * (fx - inset + hx * 0.5)
        loc_y = yo + 0.55
        hw.radiator_panel(parts, 'freighter.rad.%s' % tag, mat,
                          (loc_x, loc_y, z_h), (hx, hy, hz),
                          detail=detail)


# ===========================================================================
# BOW / BAY / BAND
# ===========================================================================

def _bow_cluster(parts, glow, st, hull_mat, glow_mat, z_nose, z_dock, detail):
    """Civilian cabins plus a ventral external berth collar."""
    H = kit.ROLE_HULL
    # Primary cabin on the nose. Overhang sets the authored spanZ.
    ty = sf.top_y(st, z_nose + 0.40, 0.0)
    su.civilian_cabin(parts, 'freighter.cabin.main', hull_mat,
                      (0.0, ty - 0.10, z_nose + 0.50), detail=detail)
    if detail >= 1:
        ty_p = sf.top_y(st, z_nose + 1.55, -0.90)
        su.civilian_cabin(parts, 'freighter.cabin.port', hull_mat,
                          (-0.95, ty_p - 0.18, z_nose + 1.55),
                          detail=detail)
        ty_s = sf.top_y(st, z_nose + 1.80, 0.90)
        su.civilian_cabin(parts, 'freighter.cabin.stbd', hull_mat,
                          (0.90, ty_s - 0.16, z_nose + 1.80),
                          detail=detail)
    # Ventral berth pad + collar on an OUTBOARD face (down).
    by = sf.bottom_y(st, z_dock, 0.0)
    kit.box(parts, 'freighter.berth.pad', H,
            (0.0, by + 0.04, z_dock),
            (2.20, 0.22, 2.40), hull_mat)
    hw.docking_collar(parts, glow, 'freighter.collar', hull_mat, glow_mat,
                      (0.0, by - 0.02, z_dock), facing='down',
                      detail=detail)
    if detail >= 2:
        su.strap_clamp(parts, 'freighter.cabin.strap', hull_mat,
                       (0.0, ty - 0.02, z_nose + 1.05),
                       span=1.40, axis='x', detail=detail)


def _open_bay(parts, mat, z_bay, detail):
    """Open starboard bay. Pad pierces the wall. Shuttle sits on the pad."""
    H = kit.ROLE_HULL
    wall_x = 7.40
    yo = 1.15
    kit.box(parts, 'freighter.bay.wall.in', H,
            (wall_x, yo, z_bay),
            (0.28, 2.20, 5.60), mat)
    kit.box(parts, 'freighter.bay.wall.fwd', H,
            (wall_x + 2.00, yo, z_bay - 2.75),
            (4.00, 2.10, 0.22), mat)
    kit.box(parts, 'freighter.bay.wall.aft', H,
            (wall_x + 2.00, yo, z_bay + 2.75),
            (4.00, 2.10, 0.22), mat)
    # Pad starts INBOARD of the wall and runs THROUGH it.
    pad_x = wall_x + 1.60
    pad_y = yo - 1.05
    kit.box(parts, 'freighter.bay.pad', H,
            (pad_x, pad_y, z_bay),
            (4.80, 0.22, 5.00), mat)
    kit.box(parts, 'freighter.bay.keel-strut', H,
            (wall_x * 0.50, yo - 0.35, z_bay),
            (wall_x + 0.50, 0.32, 0.90), mat)

    tbx, tby, tbz = _SHUTTLE_BODY
    craft_x = wall_x + 2.20
    craft_y = pad_y + 0.11 + tby * 0.5 - 0.14
    kit.box(parts, 'freighter.bay.shuttle.body', H,
            (craft_x, craft_y, z_bay),
            _SHUTTLE_BODY, mat)
    kit.box(parts, 'freighter.bay.shuttle.nose', H,
            (craft_x, craft_y + 0.08, z_bay - 0.85),
            _SHUTTLE_NOSE, mat)
    kit.box(parts, 'freighter.bay.shuttle.tail', kit.ROLE_ARMOUR,
            (craft_x, craft_y, z_bay + 0.90),
            _SHUTTLE_TAIL, mat)
    if detail >= 2:
        cr = _CRATE
        crate_y = pad_y + 0.11 + cr * 0.5 - 0.12
        wall_out = wall_x + 0.14
        cx0 = wall_out + cr * 0.5 - 0.10
        n_cr = 3 if detail >= 3 else 2
        for i, cz in enumerate((z_bay - 1.40, z_bay - 0.50, z_bay + 1.60)):
            if i >= n_cr:
                break
            su.iso_crate(parts, 'freighter.bay.crate.%d' % i, mat,
                         (cx0, crate_y, cz), detail=1)


def _joint_plates(parts, st, mat, z_bow_s, z_mid_s, detail):
    """Patch plates and field welds at the zone joints."""
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        yo = sf.section(st, zs)[2]
        fx = sf.flank_x(st, zs, yo)
        if fx <= 0.20:
            continue
        su.patch_plate(parts, 'freighter.joint.%s.s' % tag, mat,
                       (fx - 0.01, yo + 0.20, zs),
                       facing='starboard', detail=detail)
        su.patch_plate(parts, 'freighter.joint.%s.p' % tag, mat,
                       (-(fx - 0.01), yo + 0.20, zs),
                       facing='port', detail=detail)
        ty = sf.top_y(st, zs, 0.0)
        su.field_weld(parts, 'freighter.joint.%s.weld' % tag, mat,
                      (0.0, ty + 0.02, zs), length=0.90, axis='x',
                      detail=detail)


def _cargo_nets(parts, st, mat, z_bow_s, z_mid_s, z_bay, detail):
    """Nets on a few crate faces only. Do not greeble the mountain."""
    # y sits inside the layer-0 mountain crate (same seating as _crate_block).
    ly = _pad_y(st, 0.0) + _LAYER + _PAD_T * 0.5 + _CRATE * 0.5 + 0.02
    # Snap to real mountain crate centres. x=-4.55 is the extra port *rack*
    # column, not a mountain crate — a net there floats (island probe).
    z0 = z_bow_s + 1.20
    z1 = z_mid_s - 1.20
    span = z1 - z0
    zs = (z0 + span * 5.0 / 13.0,)
    xs = (-(2.15 + 4 * _COL_PITCH), 2.15 + 3 * _COL_PITCH)
    for i, cz in enumerate(zs):
        if _keepout(cz, z_bay, _BAY_KEEP):
            continue
        for j, xx in enumerate(xs):
            su.cargo_net(parts, 'freighter.net.%d.%d' % (i, j), mat,
                         (xx, ly, cz), facing='up', detail=detail)


def _service_band(parts, glow, st, hull_mat, glow_mat,
                  z_bow_s, z_mid_s, z_bay, detail):
    """One starboard mid band: rail + sparse lamps at 1.20 pitch."""
    H = kit.ROLE_HULL
    z0 = z_bow_s + 2.40
    z1 = z_mid_s - 2.40
    if z1 <= z0:
        return
    run = min(z1 - z0, 9.60)
    cz = (z0 + z1) * 0.5
    if _keepout(cz, z_bay, 2.00):
        cz = z_bay - 5.20
    rail_x = 6.15
    rail_y = _pad_y(st, 0.0) + _LAYER * 2.0 + 0.06
    kit.box(parts, 'freighter.band.rail', H,
            (rail_x, rail_y, cz),
            (0.20, 0.14, run), hull_mat)
    # Sparse: 7 housings at d=3, halved by lamp_run at d=2. Never a strip.
    hw.lamp_run(parts, glow, 'freighter.lamps', hull_mat, glow_mat,
                (rail_x, rail_y + 0.10, cz),
                count=7, axis='z', facing='up', detail=detail)


def _place_detail_gear(parts, st, mat, l, z_tug, detail):
    """A few extra plates on the tug core neighbourhood. Band stays mid."""
    z_p = l * 0.300
    yo = sf.section(st, z_p)[2]
    fx = sf.flank_x(st, z_p, yo)
    if fx > 0.20:
        su.patch_plate(parts, 'freighter.drive.patch.s', mat,
                       (fx - 0.01, yo + 0.35, z_p),
                       facing='starboard', detail=detail)
        su.patch_plate(parts, 'freighter.drive.patch.p', mat,
                       (-(fx - 0.01), yo - 0.20, z_p),
                       facing='port', detail=detail)
    ty = sf.top_y(st, z_tug, -0.40)
    su.field_weld(parts, 'freighter.tug.weld', mat,
                  (-0.40, ty + 0.04, z_tug), length=0.70, axis='z',
                  detail=detail)
    hw.mission_pod(parts, 'freighter.bow.pod', mat,
                   (1.05, sf.top_y(st, l * -0.340, 1.05) + 0.18,
                    l * -0.340),
                   detail=detail)
    hw.clamp_pair(parts, 'freighter.clamp', mat,
                  (-3.35, _pad_y(st, 0.0) + 0.50, l * -0.040),
                  detail=detail)
