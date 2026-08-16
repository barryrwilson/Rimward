"""Hollow Reach FRIGATE — long-range vigil ship.

Bible §5.2: "A long-range vigil ship with redundant listening spines,
shuttered bays, and a small command lantern buried inside the hull."

There is NO concept-art plate. Do not invent a Banner look.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; authored largest-dimension target ≈ 32.0
(loft nose to drive face). Hull vertex band [16 000, 84 000];
prefer 18 000–40 000. Engine glow at l*0.47.
Proportions 1.15 / 0.60 / 0.16 (length-leads-beam, height/length,
beam/length). Pivot ±0.15.

Construction: CLOSED SHELL, SHUTTERED. LONG vigil hull. Redundant
masts (two or three spines). Shuttered bay with a nested small craft
(§G5). Refuse crates-as-identity, owner-modules, gate-arms, salvage,
ritual, fans, flesh, lace, window terraces.

BODY PLAN
    A long slim sealed loft is the hull. Half-extents are ABSOLUTE
    (core half-beam ~1.6–2.2, never the class half-beam 6.24). One
    wrap_panel per flank on the mid run. Bow is a shuttered sensor
    face. Mid holds the wraps, a starboard-open shuttered bay with a
    human-scale nested shuttle, and a command lantern buried in a
    citadel well. Stern is an 8-nozzle drive_face and a flat radiator
    pair (§G3). shutter_seam beads sit at the two zone joints.

STATIONS (z as fractions of l; half-extents are ABSOLUTE watch-hull
radii, never the class beam — wraps, bay and masts break the outline):
    Loft nose at l*-0.530 = -16.960; transom at l*0.470 = +15.040.
    Drive loc at l*0.470 = +15.040 (engine glow).
    Authored nose ≈ -16.96; drive face ≈ +15.16; spanZ ≈ 32.1.
    Authored bay outer ≈ +3.75; port wrap face ≈ -2.20;
    spanX ≈ 5.95; beam/len ≈ 0.19.
    Bow/mid seam at l*-0.310 = -9.920;
    mid/stern seam at l*+0.210 = +6.720.
    Core half-beam 1.62 → 2.16 → 1.70; half-height 0.92 → 1.32 → 1.08.

ZONES (~22 / 52 / 26; no plate course crosses a seam):
    bow   loft-nose .. l*-0.310     ~22 %  (shuttered sensor, collar)
    mid   l*-0.310 .. l*+0.210      ~52 %  (wraps, bay, lantern well)
    stern l*+0.210 .. drive         ~26 %  (drive + radiator pair)

OUTLINE-BREAKER (§G2): listening_mast. Grow HEIGHT, never dish.
    need  = 0.15 * 32.0 = 4.80
    pass  primary length=6.40
    second / third 4.0 / 3.2. Offset one mast.

G3
    hw.radiator_panel pair, flat, no fins: size (0.16, 2.00, 3.20),
    port and starboard stern flanks, buried >= 0.12.
    hw.drive_face 8 countable nozzles. No kit.engine_bank.

G5
    Starboard mid OPEN bay (inboard + forward + aft walls; no outboard
    face). sh.shutter_bank is the bay door and overlaps a wall.
    Nested shuttle of 4 kit.box parts, ~2.0 long, INTERSECTS the
    cradle pad. Do not scale the craft up.

EMISSIVE BUDGET (<= 5 % of hull area):
    Drive discs and ONE buried command lantern. No window rows.
    AUTHORED AIM: emissive ~= 0.6 %.

DETAIL LADDER
    3  full: bay craft + all masts (dishes) + full arrays / slats
    2  half arrays / slats; wraps, masts, bay mass, radiators stay
    1  loft + wraps + masts + bay mass + drive + radiators + lantern well
    0  loft + drive + radiators + primary mast shaft
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import shroud as sh
from . import hardware as hw


_BURY = 0.12
_SKIN = 0.08
_MAST0 = 6.40
_MAST1 = 4.00
_MAST2 = 3.20
_RAD = (0.16, 2.00, 3.20)
_WRAP_T = 0.12


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, _b, _h):
    """Long slim sealed watch-hull. Half-extents are absolute.

    Core half-beam stays in 1.6–2.2. Wraps, the open bay and the
    listening masts break the outline. Nose at l*-0.530; transom at
    l*0.470.
    """
    return [
        sf.fair(l * -0.530, 1.62, 0.92, 0.04),
        sf.fair(l * -0.460, 1.78, 1.04, 0.03),
        sf.fair(l * -0.380, 1.90, 1.16, 0.02),
        sf.fair(l * -0.310, 1.98, 1.22, 0.01),
        sf.fair(l * -0.180, 2.08, 1.28, 0.00),
        sf.fair(l * -0.040, 2.14, 1.32, 0.00),
        sf.fair(l *  0.080, 2.16, 1.32, 0.00),
        sf.fair(l *  0.210, 2.06, 1.26, 0.01),
        sf.fair(l *  0.320, 1.92, 1.18, 0.02),
        sf.fair(l *  0.400, 1.80, 1.12, 0.04),
        sf.fair(l *  0.470, 1.70, 1.08, 0.06),
    ]


# ===========================================================================
# COUNTS AND SEATING
# ===========================================================================

def _grid(detail, cols, rows):
    """Plate-grid density. detail 1- returns (0, 0) so the caller skips."""
    if detail >= 3:
        return int(cols), int(rows)
    if detail == 2:
        return max(2, int(cols) // 2), max(2, int(rows) // 2)
    return 0, 0


def _min_skin(stations, z0, z1, samples=9):
    """Min straight-flank half-extents on [z0, z1].

    Returns ``(half_w, straight_half_h, flat_half, y_offset)``. Callers
    double these for kit full extents. Uses the smallest section in the
    run so a plate grid stays on the loft and does not float at a taper.
    """
    hw_m = 1e9
    st_h = 1e9
    fw_m = 1e9
    yo_s = 0.0
    n = max(int(samples), 2)
    for i in range(n):
        z = z0 + (z1 - z0) * i / float(n - 1)
        hw, hh, yo, ch = sf.section(stations, z)
        ch = sf.clamped(hw, hh, ch)
        hw_m = min(hw_m, hw)
        st_h = min(st_h, hh - ch)
        fw_m = min(fw_m, hw - ch)
        yo_s += yo
    return hw_m, st_h, fw_m, yo_s / float(n)


def _flank(stations, z, y):
    """Outer skin x at (z, y); fall back to section half-beam."""
    fx = sf.flank_x(stations, z, y)
    if fx > 0.0:
        return fx
    return sf.section(stations, z)[0]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Hollow Reach vigil ship (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full (bay craft + all masts)
                2 half arrays / slats
                1 loft + wraps + masts + bay mass + drive + radiators
                  + lantern well
                0 loft + drive + radiators + primary mast shaft.

    AUTHORED AIM only (no bake in this file):
        spanZ ≈ 32.1; spanX ≈ 6.0; verts 18 000–40 000; glow at l*0.47
        len/beam >= 1.15; ht/len <= 0.60; beam/len ≈ 0.19 (>= 0.16)
        G2 primary mast=6.40 (>= 4.80); G5 nested craft pierces the pad
    """
    H = kit.ROLE_HULL

    stations = _frigate_stations(l, b, h)

    z_loft0 = l * -0.530
    z_bow_s = l * -0.310
    z_mid_s = l * 0.210
    z_trans = l * 0.470
    z_drive = l * 0.470

    z_collar = z_loft0 + 0.18
    z_bay = 4.20
    z_lantern = -1.40
    z_rad = 11.20
    z_mast0 = -12.40
    z_mast1 = -5.60
    z_mast2 = 0.80

    # ── WATCH LOFT (always). ─────────────────────────────────────────────
    kit.hull_loft(parts, 'frigate.watchloft', H, stations, hull_mat)

    # ── DRIVE FACE (always): 8 countable nozzles. Glow at l*0.47. ────────
    d_w, d_h, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_drive), max(d_w * 0.92, 0.90),
                  max(d_h * 0.88, 0.70),
                  nozzles=8, depth=0.55, detail=detail)
    kit.box(parts, 'frigate.drive.root', H,
            (0.0, d_yo, z_trans - 0.36),
            (d_w * 2.0 + 0.16, d_h * 2.0 + 0.12, 1.00), hull_mat)

    # ── §G3 RADIATORS (always): flat pair, buried >= 0.12. ───────────────
    _radiators(parts, hull_mat, stations, z_rad, detail)

    # ── PRIMARY MAST SHAFT (always). Dish only at detail 3. ──────────────
    _listening_spine(parts, hull_mat, stations, z_mast0, -0.35, _MAST0,
                     'frigate.mast.0', detail, dish=(detail >= 3))

    if detail < 1:
        return

    # ── LONG MID WRAPS (detail 1+): one plate per side. ──────────────────
    _wraps(parts, hull_mat, stations, z_bow_s, z_mid_s, z_bay, detail)

    # ── ZONE SEAMS (detail 1+). ──────────────────────────────────────────
    _seams(parts, hull_mat, stations, z_bow_s, z_mid_s, detail)

    # ── BOW SHUTTERED SENSOR + optional collar (detail 1+). ──────────────
    _bow_sensor(parts, glow, hull_mat, glow_mat, stations, z_loft0,
                z_collar, detail)

    # ── MID LANTERN WELL (detail 1+): command lantern buried in hull. ────
    _lantern_well(parts, glow, hull_mat, glow_mat, stations, z_lantern,
                  detail)

    # ── §G5 SHUTTERED BAY MASS (detail 1+). Craft at detail 3. ───────────
    _bay(parts, hull_mat, stations, z_bay, detail)

    # ── REDUNDANT SPINES (detail 1+): shorter offset pair. ───────────────
    _listening_spine(parts, hull_mat, stations, z_mast1, 1.10, _MAST1,
                     'frigate.mast.1', detail, dish=(detail >= 3))
    _listening_spine(parts, hull_mat, stations, z_mast2, -0.90, _MAST2,
                     'frigate.mast.2', detail, dish=(detail >= 3))

    if detail < 2:
        return

    # No Independent plate_grid / greeble_field. Those fields float off
    # the taper (11 island groups at y ≈ -2.2) and a mid 18×44 grid made
    # lod0 take ~15 min. Hollow surface language is wrap + shutter only.

    # ── PASSIVE ARRAYS along the spines (detail 2+; half at 2). ──────────
    _spine_arrays(parts, hull_mat, stations,
                  ((z_mast0, -0.35, 10),
                   (z_mast1, 1.10, 6),
                   (z_mast2, -0.90, 5)),
                  detail)

    if detail < 3:
        return

    # ── NESTED SHUTTLE (detail 3): 4 kit.box parts, ~2.0 long. ───────────
    _bay_craft(parts, hull_mat, stations, z_bay)


def _radiators(parts, hull_mat, stations, z_rad, detail):
    """Flat §G3 pair. Each slab overlaps the stern flank."""
    _hw, _hh, yo, _ = sf.section(stations, z_rad)
    fx = _flank(stations, z_rad, yo)
    sx, sy, sz = _RAD
    rad_x = fx + sx * 0.5 - _BURY
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'frigate.rad.%s' % tag, hull_mat,
                          (side * rad_x, yo, z_rad),
                          (sx, sy, sz), detail=detail)


def _wraps(parts, hull_mat, stations, z_bow_s, z_mid_s, z_bay, detail):
    """One long wrap_panel per side. Starboard stops short of the bay."""
    z_port = 0.5 * ((z_bow_s + 0.24) + (z_mid_s - 0.40))
    _hw, hh, yo, ch = sf.section(stations, z_port)
    ch = sf.clamped(_hw, hh, ch)
    face_h = max((hh - ch) * 2.0 * 0.90, 1.10)
    fx = _flank(stations, z_port, yo)
    loc_x = fx - _SKIN + _WRAP_T * 0.5
    port_w = min(13.00, (z_mid_s - 0.40) - (z_bow_s + 0.24))
    stbd_w = min(11.20, (z_bay - 1.80) - (z_bow_s + 0.24))
    z_stbd = 0.5 * ((z_bow_s + 0.24) + (z_bay - 1.80))
    sh.wrap_panel(parts, 'frigate.wrap.port', hull_mat,
                  (-loc_x, yo, z_port),
                  size=(port_w, face_h, _WRAP_T),
                  facing='port', detail=detail)
    fx_s = _flank(stations, z_stbd, yo)
    loc_xs = fx_s - _SKIN + _WRAP_T * 0.5
    sh.wrap_panel(parts, 'frigate.wrap.stbd', hull_mat,
                  (loc_xs, yo, z_stbd),
                  size=(stbd_w, face_h, _WRAP_T),
                  facing='starboard', detail=detail)


def _seams(parts, hull_mat, stations, z_bow_s, z_mid_s, detail):
    """Local shutter_seam beads at the two zone joints."""
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        _hw, _hh, yo, _ = sf.section(stations, zs)
        deck = sf.top_y(stations, zs, 0.0)
        sh.shutter_seam(parts, 'frigate.seam.%s.deck' % tag, hull_mat,
                        (0.0, deck - 0.05, zs),
                        size=(0.80, 0.18, 0.16), detail=detail)
        fx = _flank(stations, zs, yo)
        for side, face in ((-1.0, 'port'), (1.0, 'stbd')):
            sh.shutter_seam(parts, 'frigate.seam.%s.%s' % (tag, face),
                            hull_mat,
                            (side * (fx - 0.04), yo, zs),
                            size=(0.18, 0.72, 0.16), detail=detail)


def _bow_sensor(parts, glow, hull_mat, glow_mat, stations, z_loft0,
                z_collar, detail):
    """Shuttered sensor face. Collar sits behind the nose shutter."""
    hw0, hh0, yo0, _ = sf.section(stations, z_loft0 + 0.22)
    sh.shutter_bank(parts, 'frigate.sensor.nose', hull_mat,
                    (0.0, yo0, z_loft0 + 0.08),
                    size=(max(hw0 * 1.70, 1.20), max(hh0 * 1.60, 0.90), 0.16),
                    facing='nose', detail=detail)
    # Small dorsal sensor shutter, buried into the bow deck.
    deck = sf.top_y(stations, z_loft0 + 1.40, 0.0)
    sh.shutter_bank(parts, 'frigate.sensor.deck', hull_mat,
                    (0.0, deck - 0.02, z_loft0 + 1.40),
                    size=(1.10, 0.80, 0.16),
                    facing='up', detail=detail)
    hw.docking_collar(parts, glow, 'frigate.collar', hull_mat, glow_mat,
                      (0.0, yo0, z_collar), facing='nose', detail=detail)
    # Shutter leaf overlaps the collar barrel so the mouth stays sealed.
    sh.shutter_bank(parts, 'frigate.collar.shutter', hull_mat,
                    (0.0, yo0, z_collar - 0.06),
                    size=(1.00, 0.84, 0.16),
                    facing='nose', detail=detail)


def _lantern_well(parts, glow, hull_mat, glow_mat, stations, z_lantern,
                  detail):
    """Citadel well that intersects the mid deck. One dim lantern."""
    deck = sf.top_y(stations, z_lantern, 0.18)
    kit.chamfer_block(parts, 'frigate.lantern.citadel', kit.ROLE_HULL,
                      (0.18, deck - 0.10, z_lantern),
                      (1.10, 0.40, 1.40), hull_mat, chamfer=0.10)
    # Through-plug so the well shares voxels with the loft crown.
    kit.box(parts, 'frigate.lantern.plug', kit.ROLE_HULL,
            (0.18, deck - 0.18, z_lantern),
            (0.70, 0.36, 0.90), hull_mat)
    hw.buried_lantern(parts, glow, 'frigate.lantern', hull_mat, glow_mat,
                      (0.18, deck - 0.12, z_lantern),
                      facing='up', detail=detail)


def _listening_spine(parts, hull_mat, stations, z, x, length, name,
                     detail, dish):
    """sensor_root + listening_mast. Shaft buries into the root and deck."""
    deck = sf.top_y(stations, z, x)
    _rx, ry, _rz = sf.SENSOR_ROOT
    root_y = deck + ry * 0.5 - _BURY
    hw.sensor_root(parts, name + '.root', hull_mat,
                   (x, root_y, z), detail=detail)
    # Shaft starts inside the root so the island probe reads one body.
    mast_y = root_y - ry * 0.30
    sh.listening_mast(parts, name, hull_mat,
                      (x, mast_y, z), length=length, facing='up',
                      detail=detail, dish=dish)


def _spine_arrays(parts, hull_mat, stations, specs, detail):
    """Passive vanes along each listening spine. Count halves at detail 2."""
    for z, x, count in specs:
        deck = sf.top_y(stations, z, x)
        hw.passive_array(parts, 'frigate.array.z%+.0f' % z, hull_mat,
                         (x + 0.24, deck - 0.04, z),
                         count=count, axis='z', detail=detail)


def _bay(parts, hull_mat, stations, z_bay, detail):
    """Open starboard bay: inboard + forward + aft walls. No outboard face."""
    H = kit.ROLE_HULL
    _hw, _hh, yo, _ = sf.section(stations, z_bay)
    fx = _flank(stations, z_bay, yo)
    bay_sz = 3.20
    bay_sy = 1.40
    bay_depth = 1.70
    wall_t = 0.22

    # Inboard wall: buried into the loft, slightly proud of the skin.
    in_x = fx - _SKIN + wall_t * 0.5
    kit.box(parts, 'frigate.bay.inboard', H,
            (in_x, yo, z_bay),
            (wall_t, bay_sy, bay_sz), hull_mat)

    # Forward and aft walls. No outboard face.
    wall_x = fx + bay_depth * 0.5 - _SKIN
    wall_sx = bay_depth + _SKIN + 0.04
    for tag, zz in (('fwd', z_bay - bay_sz * 0.5),
                    ('aft', z_bay + bay_sz * 0.5)):
        kit.box(parts, 'frigate.bay.%s' % tag, H,
                (wall_x, yo, zz),
                (wall_sx, bay_sy, 0.20), hull_mat)

    # Cradle pad. Inboard edge overlaps the inboard wall.
    pad_sx, pad_sy, pad_sz = 1.50, 0.22, 2.20
    pad_x = fx + 0.62
    pad_y = yo - 0.42
    kit.box(parts, 'frigate.bay.pad', H,
            (pad_x, pad_y, z_bay),
            (pad_sx, pad_sy, pad_sz), hull_mat)
    # Keel strut: pad through the wall into the loft.
    kit.box(parts, 'frigate.bay.keel', H,
            ((fx + pad_x) * 0.5, (yo + pad_y) * 0.5, z_bay),
            (abs(pad_x - fx) + 0.40, abs(yo - pad_y) + 0.28, 0.70),
            hull_mat)

    # Bay door: shutter_bank overlapping the inboard wall.
    sh.shutter_bank(parts, 'frigate.bay.door', hull_mat,
                    (fx + 0.10, yo, z_bay),
                    size=(bay_sz * 0.88, bay_sy * 0.90, 0.16),
                    facing='starboard', detail=detail)


def _bay_craft(parts, hull_mat, stations, z_bay):
    """Human-scale shuttle. Belly intersects the cradle pad."""
    H = kit.ROLE_HULL
    _hw, _hh, yo, _ = sf.section(stations, z_bay)
    fx = _flank(stations, z_bay, yo)
    pad_x = fx + 0.62
    pad_y = yo - 0.42
    # Pad top at pad_y + 0.11. Craft keel overlaps that plane.
    y_c = pad_y + 0.18
    kit.box(parts, 'frigate.berth.craft.body', H,
            (pad_x, y_c, z_bay),
            (0.50, 0.30, 1.24), hull_mat)
    kit.box(parts, 'frigate.berth.craft.nose', H,
            (pad_x, y_c - 0.02, z_bay - 0.78),
            (0.36, 0.24, 0.42), hull_mat)
    kit.box(parts, 'frigate.berth.craft.tail', H,
            (pad_x, y_c + 0.02, z_bay + 0.76),
            (0.34, 0.22, 0.38), hull_mat)
    kit.box(parts, 'frigate.berth.craft.keel', H,
            (pad_x, pad_y + 0.08, z_bay),
            (0.30, 0.16, 0.90), hull_mat)


def _flank_plates(parts, tag, stations, z0, z1, hull_mat, detail,
                  cols_f, rows_f, face):
    """One flank plate grid on the min skin of [z0, z1]."""
    span = z1 - z0
    if span < 1.20:
        return
    cf, rf = _grid(detail, cols_f, rows_f)
    if cf < 1:
        return
    # Keep plate Z extent >= 0.06 after the 0.08 gap.
    max_c = max(2, int(span * 0.92 / 0.08))
    if cf > max_c:
        cf = max_c
    hw_m, st_h, fw_m, yo = _min_skin(stations, z0, z1)
    hh_m = st_h + (hw_m - fw_m)
    loc = (0.0, yo, 0.5 * (z0 + z1))
    size = (max(hw_m * 2.0 - 0.04, 0.80),
            max(hh_m * 2.0, 0.80),
            span)
    kit.plate_grid(parts, tag, kit.ROLE_ARMOUR,
                   loc, size, hull_mat, cf, rf, face=face,
                   depth=0.36, gap=0.08)


def _zone_plates(parts, tag, stations, z0, z1, hull_mat, detail,
                 cols_t, rows_t, cols_f, rows_f, skip_stbd_z=None):
    """Plate grids seated on the min skin of one zone. depth 0.36 ⇒ sink 0.09."""
    if z1 <= z0:
        return
    cols, rows = _grid(detail, cols_t, rows_t)
    cf, rf = _grid(detail, cols_f, rows_f)
    if cols < 1:
        return
    hw_m, st_h, fw_m, yo = _min_skin(stations, z0, z1)
    hh_m = st_h + (hw_m - fw_m)
    loc = (0.0, yo, 0.5 * (z0 + z1))
    size = (max(hw_m * 2.0 - 0.04, 0.80),
            max(hh_m * 2.0, 0.80),
            max(z1 - z0, 0.80))
    kit.plate_grid(parts, 'frigate.plate.%s.top' % tag, kit.ROLE_ARMOUR,
                   loc, size, hull_mat, cols, rows, face='y',
                   depth=0.36, gap=0.08)
    # No keel plate_grid. A -Y field at the min-skin box floats as a
    # paper-thin row under the taper (island y ≈ -2.2, 11 groups).
    kit.plate_grid(parts, 'frigate.plate.%s.port' % tag, kit.ROLE_ARMOUR,
                   loc, size, hull_mat, cf, rf, face='-x',
                   depth=0.36, gap=0.08)
    if skip_stbd_z is None:
        kit.plate_grid(parts, 'frigate.plate.%s.stbd' % tag, kit.ROLE_ARMOUR,
                       loc, size, hull_mat, cf, rf, face='x',
                       depth=0.36, gap=0.08)
        return
    a0, a1 = skip_stbd_z
    half_c = max(4, cols_f // 2)
    if z0 < a0:
        _flank_plates(parts, 'frigate.plate.%s.stbd0' % tag, stations,
                      z0, a0, hull_mat, detail, half_c, rows_f, 'x')
    if a1 < z1:
        _flank_plates(parts, 'frigate.plate.%s.stbd1' % tag, stations,
                      a1, z1, hull_mat, detail, half_c, rows_f, 'x')
