"""Independent FRIGATE — consortium / settlement defense ship.

Bible §5.1: "Rare consortium or settlement defense ship assembled from
compatible surplus sections, with a clear shared command spine."

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; authored largest-dimension target ≈ 32.0
(collar lip to drive face). Hull vertex band [16 000, 84 000];
prefer 18 000–36 000. lod0 triangle cap 60 000. Engine glow at l*0.47.
Proportions 1.15 / 0.60 / 0.16 (length-leads-beam, height/length,
beam/length).

BODY PLAN
    A slim command spine is the connective loft. The silhouette is
    SURPLUS SECTIONS bolted onto that spine: mismatched commercial
    boxes, several su.civilian_cabin modules, and ONE su.owner_module
    (the only ROLE_ACCENT mass). Mid carries a long su.crate_rack
    (length grows, crate size does not). Starboard mid holds an open
    hangar cradle with a miniature nested craft of kit.box parts that
    pierce the pad (G5). Stern is tug_core + 8-nozzle drive_face and
    a flat radiator pair (G3). Zone straps sit at every section joint.

STATIONS (z as fractions of l; half-extents are ABSOLUTE spine radii,
never the class beam — sections, rack and hangar break the outline):
    Loft nose at l*-0.530 = -16.960; transom at l*0.470 = +15.040.
    Drive loc at l*0.470 = +15.040 (engine glow).
    Authored collar lip ≈ -17.04; drive face ≈ +15.16; spanZ ≈ 32.2.
    Authored hangar outer ≈ +5.18; port section face ≈ -3.00;
    spanX ≈ 8.18; beam/len ≈ 0.25.
    Bow/mid seam at l*-0.280 = -8.960;
    mid/stern seam at l*+0.220 = +7.040.
    Spine half-beam 0.52 → 0.94 → 0.72; half-height 0.36 → 0.52 → 0.54.

ZONES (no surplus-section run crosses a seam):
    bow   loft-nose .. l*-0.280     ~25 %  (cabin cluster + collar)
    mid   l*-0.280 .. l*+0.220      ~50 %  (sections, rack, hangar)
    stern l*+0.220 .. drive         ~25 %  (tug + drive + radiators)

OUTLINE-BREAKER (§G2): su.crate_rack along mid. Grow LENGTH / COUNT.
    need  = 0.15 * 32.0 = 4.80
    pass  length=8.40  (crate stays HUMAN 0.85)
    Z run = 8.40 ≥ 4.80. Never inflate the crate.

G3
    hw.radiator_panel pair, flat, no fins: size (0.16, 2.00, 3.20),
    port and starboard stern flanks, buried >= 0.12.
    hw.drive_face 8 countable nozzles on a commercial housing. No
    kit.engine_bank.

G5
    Starboard mid hangar. Cradle pad pierces the surplus section
    flank and a keel strut reaches the spine. Nested light-scale
    craft (2–3 kit.box parts, ~1.9 long) INTERSECTS the pad. A nest
    wholly inside a hollow bay would float (island probe). Do not
    scale human modules for the craft.

EMISSIVE BUDGET (<= 5 % of hull area):
    Drive discs, one mid lamp run, collar mark. No edge-lit panels.
    AUTHORED AIM: emissive ~= 1.4 %.

DETAIL LADDER
    3  full: every construct, full plates / lamps / cabins / rack
    2  half repeats; sections, hangar, radiators, rack stay
    1  loft + sections + cabins + rack frame + hangar + drive
    0  loft + drive
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import surplus as su
from . import hardware as hw


_RACK_LEN = 8.40
_SEC_BURY = 0.16
_ROOT_BURY = 0.12


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, _b, _h):
    """Outer spine envelope for queries. Slim command keel, not the beam.

    Half-extents are absolute world units. Surplus sections, the crate
    rack and the hangar break the outline. Nose at l*-0.530; transom
    at l*0.470.
    """
    return [
        sf.fair(l * -0.530, 0.52, 0.36, 0.02),
        sf.fair(l * -0.460, 0.68, 0.42, 0.04),
        sf.fair(l * -0.360, 0.80, 0.46, 0.04),
        sf.fair(l * -0.280, 0.86, 0.48, 0.02),
        sf.fair(l * -0.140, 0.92, 0.50, 0.00),
        sf.fair(l *  0.000, 0.94, 0.52, 0.00),
        sf.fair(l *  0.120, 0.90, 0.50, 0.00),
        sf.fair(l *  0.220, 0.84, 0.48, 0.02),
        sf.fair(l *  0.340, 0.78, 0.50, 0.04),
        sf.fair(l *  0.470, 0.72, 0.54, 0.06),
    ]


# ===========================================================================
# COUNTS AND SEATING
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


def _grid(detail, cols, rows):
    """Plate-grid density. detail 1- returns (0, 0) so the caller skips."""
    if detail >= 3:
        return int(cols), int(rows)
    if detail == 2:
        return max(2, int(cols) // 2), max(2, int(rows) // 2)
    return 0, 0


def _on_spine(stations, z, sy, bury=_SEC_BURY):
    """Centre y for a surplus box sitting on the spine deck."""
    deck = sf.top_y(stations, z, 0.0)
    return deck + sy * 0.5 - bury


# Surplus mid/bow/stern sections: (tag, z, sx, sy, sz, role, chamfer)
# Absolute commercial boxes. Never scaled by class l/b/h.
_SECTIONS = (
    ('bow',   -12.20, 4.40, 1.70, 3.20, kit.ROLE_HULL,   0.14),
    ('a',      -6.70, 6.00, 2.00, 3.60, kit.ROLE_ARMOUR, 0.00),
    ('b',      -2.90, 5.60, 2.10, 3.80, kit.ROLE_HULL,   0.16),
    ('c',       1.10, 5.80, 1.90, 3.40, kit.ROLE_ARMOUR, 0.00),
    ('d',       4.70, 6.00, 2.00, 3.60, kit.ROLE_HULL,   0.12),
    ('stern',  12.40, 2.80, 1.90, 4.60, kit.ROLE_HULL,   0.18),
)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Independent consortium defense ship (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full  2 half repeats
                1 loft + sections + hangar + drive
                0 loft + drive.

    AUTHORED AIM only (no bake in this file):
        spanZ ≈ 32.2; spanX ≈ 8.2; verts 18 000–36 000; glow at l*0.47
        len/beam >= 1.15; ht/len <= 0.60; beam/len ≈ 0.25 (>= 0.16)
        G2 rack length=8.40 (>= 4.80); G5 nested craft pierces the pad
    """
    H = kit.ROLE_HULL

    stations = _frigate_stations(l, b, h)

    z_loft0 = l * -0.530
    z_bow_s = l * -0.280
    z_mid_s = l * 0.220
    z_trans = l * 0.470
    z_drive = l * 0.470

    z_collar = z_loft0 + 0.04
    z_rack = -2.00
    z_hangar = 4.70
    z_rad = 12.40
    z_lamp = l * -0.020
    z_owner = -2.90

    # ── COMMAND SPINE LOFT (always). ─────────────────────────────────────
    kit.hull_loft(parts, 'frigate.spineloft', H, stations, hull_mat)

    # ── DRIVE FACE (always): 8 countable nozzles. Glow at l*0.47. ────────
    d_w, d_h, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_drive), max(d_w, 1.10), max(d_h, 0.80),
                  nozzles=8, depth=0.58, detail=detail)
    # Root block ties the housing to the slim loft (island probe).
    kit.box(parts, 'frigate.drive.root', H,
            (0.0, d_yo, z_trans - 0.40),
            (2.20, 1.60, 1.20), hull_mat)

    if detail < 1:
        return

    # ── SURPLUS SECTIONS (detail 1+): bolted onto the spine. ─────────────
    seated = {}
    for tag, cz, sx, sy, sz, role, chamfer in _SECTIONS:
        if tag == 'bow' and cz > z_bow_s:
            continue
        if tag in ('a', 'b', 'c', 'd') and (cz < z_bow_s or cz > z_mid_s):
            continue
        if tag == 'stern' and cz < z_mid_s:
            continue
        cy = _on_spine(stations, cz, sy)
        loc = (0.0, cy, cz)
        seated[tag] = (loc, (sx, sy, sz), role)
        if chamfer > 0.0:
            kit.chamfer_block(parts, 'frigate.sec.%s' % tag, role,
                              loc, (sx, sy, sz), hull_mat, chamfer=chamfer)
        else:
            kit.box(parts, 'frigate.sec.%s' % tag, role,
                    loc, (sx, sy, sz), hull_mat)
        # Spine bite: a through-spar so the loft and the box share voxels.
        kit.box(parts, 'frigate.sec.%s.spar' % tag, H,
                (0.0, (sf.section(stations, cz)[2] + cy) * 0.5, cz),
                (sf.section(stations, cz)[0] * 2.0 + 0.20,
                 abs(cy - sf.section(stations, cz)[2]) + 0.28, 0.46),
                hull_mat)

    # ── ZONE STRAPS at every section joint + the two zone seams. ─────────
    joint_z = []
    tags = [t for t, _, _, _, _, _, _ in _SECTIONS if t in seated]
    for i in range(len(tags) - 1):
        a = seated[tags[i]]
        bsec = seated[tags[i + 1]]
        za = a[0][2] + a[1][2] * 0.5
        zb = bsec[0][2] - bsec[1][2] * 0.5
        # Open spine runs keep an end collar on each facing face.
        if zb - za > 0.70:
            joint_z.append((za - 0.04, a[1][0] + 0.12, a[1][1] + 0.12,
                            a[0][1]))
            joint_z.append((zb + 0.04, bsec[1][0] + 0.12, bsec[1][1] + 0.12,
                            bsec[0][1]))
            continue
        joint_z.append((0.5 * (za + zb),
                        max(a[1][0], bsec[1][0]) + 0.12,
                        max(a[1][1], bsec[1][1]) + 0.12,
                        0.5 * (a[0][1] + bsec[0][1])))
    for zs in (z_bow_s, z_mid_s):
        hw2, hh2, yo2, _ = sf.seam_ring(stations, zs, over=0.08)
        joint_z.append((zs, hw2 * 2.0 + 0.20, hh2 * 2.0 + 0.80, yo2 + 0.40))
    for i, (jz, jw, jh, jy) in enumerate(joint_z):
        # Collar spans the joint so a 0.14 strap cannot float in a gap.
        kit.box(parts, 'frigate.joint.%d' % i, H,
                (0.0, jy, jz), (jw * 0.92, jh * 0.70, 0.36), hull_mat)
        su.zone_strap(parts, 'frigate.strap.%d' % i, hull_mat,
                      (0.0, jy, jz), width=jw, height=jh, detail=detail)

    # ── BOW COMMAND CABIN CLUSTER + COLLAR (detail 1+). ──────────────────
    _cabin_cluster(parts, hull_mat, stations, detail)

    hw.docking_collar(parts, glow, 'frigate.collar', hull_mat, glow_mat,
                      (0.0, sf.section(stations, z_collar)[2], z_collar),
                      facing='nose', detail=detail)

    # ── STERN TUG CORE (detail 1+): more copies, never a scaled core. ────
    n_tug = 2 if detail >= 3 else 1
    tug_sz = sf.TUG_CORE[2]
    stern = seated.get('stern')
    if stern is not None:
        s_loc, _s_size, _ = stern
        for i in range(n_tug):
            tz = s_loc[2] - 0.55 + i * (tug_sz * 0.72)
            ty = s_loc[1] + 0.06
            hw.tug_core(parts, 'frigate.tug.%d' % i, hull_mat,
                        (0.0, ty, tz), detail=detail)
            # Core must share voxels with the stern section.
            kit.box(parts, 'frigate.tug.%d.root' % i, H,
                    (0.0, (s_loc[1] + ty) * 0.5, tz),
                    (0.80, abs(ty - s_loc[1]) + 0.30, 0.50), hull_mat)

    # ── §G3 RADIATORS (detail 1+): flat pair, buried >= 0.12. ─────────────
    if stern is not None:
        s_loc, s_size, _ = stern
        rad_size = (0.16, 2.00, 3.20)
        rad_x = s_size[0] * 0.5 + rad_size[0] * 0.5 - _ROOT_BURY
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            hw.radiator_panel(parts, 'frigate.rad.%s' % tag, hull_mat,
                              (side * rad_x, s_loc[1], z_rad),
                              rad_size, detail=detail)

    # ── §G2 CRATE RACK (detail 1+): length grows, crate does not. ────────
    _crate_run(parts, hull_mat, stations, seated, z_rack, detail)

    # ── §G5 HANGAR (detail 1+): starboard only. Pad pierces section D. ───
    _hangar(parts, hull_mat, stations, seated, z_hangar, detail)

    if detail < 2:
        return

    # ── ONE OWNER MODULE (detail 2+): the only ROLE_ACCENT mass. ─────────
    if 'b' in seated:
        b_loc, b_size, _ = seated['b']
        om_sy = sf.OWNER_MODULE[1]
        oy = b_loc[1] + b_size[1] * 0.5 + om_sy * 0.5 - 0.14
        su.owner_module(parts, 'frigate.owner', hull_mat,
                        (0.42, oy, z_owner), detail=detail)

    # ── MID CIVILIAN CABINS as extra surplus sections (detail 2+). ───────
    n_cab = _n(detail, 3, 2, 0, 0)
    cab_z = (-6.40, 1.40, -10.10)
    cab_sy = sf.CIVILIAN_CABIN[1]
    for i in range(n_cab):
        cz = cab_z[i]
        host = None
        for tag, rec in seated.items():
            if abs(rec[0][2] - cz) < rec[1][2] * 0.55:
                host = rec
                break
        if host is not None:
            cy = host[0][1] + host[1][1] * 0.5 + cab_sy * 0.5 - 0.12
            cx = -0.55 if i == 1 else 0.20
        else:
            cy = _on_spine(stations, cz, cab_sy, bury=0.14)
            cx = 0.0
        su.civilian_cabin(parts, 'frigate.sec.cabin.%d' % i, hull_mat,
                          (cx, cy, cz), detail=detail)

    # ── SECTION PLATES (detail 2+): mismatched-yard density. ─────────────
    for tag, rec in seated.items():
        skip_stbd = (tag == 'd')
        _section_plates(parts, tag, rec[0], rec[1], hull_mat, detail,
                        skip_stbd=skip_stbd)

    # ── ONE MID SERVICE BAND (detail 2+): lamps at 1.20, welds, ports. ───
    _service_band(parts, glow, hull_mat, glow_mat, stations, seated,
                  z_lamp, detail)

    if detail < 3:
        return

    # ── PATCH / CLAMP / POD LANGUAGE (detail 3). ─────────────────────────
    if 'a' in seated:
        a_loc, a_size, _ = seated['a']
        su.patch_plate(parts, 'frigate.patch.a', hull_mat,
                       (a_size[0] * 0.5, a_loc[1] + 0.10, a_loc[2]),
                       facing='starboard', detail=detail)
        su.field_weld(parts, 'frigate.weld.a', hull_mat,
                      (0.0, a_loc[1] + a_size[1] * 0.5 - 0.02, a_loc[2]),
                      length=2.20, axis='z', detail=detail)
    if 'c' in seated:
        c_loc, c_size, _ = seated['c']
        su.patch_plate(parts, 'frigate.patch.c', hull_mat,
                       (-c_size[0] * 0.5, c_loc[1] - 0.08, c_loc[2] + 0.30),
                       facing='port', detail=detail)
        su.strap_clamp(parts, 'frigate.clamp.c', hull_mat,
                       (0.0, c_loc[1] + c_size[1] * 0.5 - 0.02, c_loc[2]),
                       span=1.80, axis='x', detail=detail)
    if 'b' in seated:
        b_loc, b_size, _ = seated['b']
        hw.mission_pod(parts, 'frigate.pod.b', hull_mat,
                       (b_size[0] * 0.5 - 0.18,
                        b_loc[1] + 0.06, b_loc[2] + 0.80),
                       detail=detail)
        kit.greeble_field(parts, 'frigate.greeble.b', kit.ROLE_TRIM,
                          b_loc, b_size, hull_mat, seed=17, count=18,
                          detail=detail)
    if 'stern' in seated:
        st_loc, st_size, _ = seated['stern']
        kit.greeble_field(parts, 'frigate.greeble.stern', kit.ROLE_TRIM,
                          st_loc, st_size, hull_mat, seed=29, count=12,
                          detail=detail)


def _cabin_cluster(parts, hull_mat, stations, detail):
    """Bow command cluster: two cabins + a cupola, all buried in the spine."""
    H = kit.ROLE_HULL
    z0 = -14.55
    z1 = -13.25
    cab_sy = sf.CIVILIAN_CABIN[1]
    y0 = _on_spine(stations, z0, cab_sy, bury=0.14)
    y1 = _on_spine(stations, z1, cab_sy, bury=0.14)
    su.civilian_cabin(parts, 'frigate.cmd.0', hull_mat,
                      (0.0, y0, z0), detail=detail)
    su.civilian_cabin(parts, 'frigate.cmd.1', hull_mat,
                      (-0.28, y1 + 0.06, z1), detail=detail)
    # Cupola sits on the forward cabin and bites it.
    cup_sy = 0.58
    cup_y = y0 + cab_sy * 0.5 + cup_sy * 0.5 - 0.12
    kit.chamfer_block(parts, 'frigate.cmd.cupola', H,
                      (0.10, cup_y, z0 - 0.10),
                      (1.00, cup_sy, 1.10), hull_mat, chamfer=0.10)
    kit.box(parts, 'frigate.cmd.root', H,
            (0.0, (sf.section(stations, z0)[2] + y0) * 0.5, z0),
            (0.90, abs(y0 - sf.section(stations, z0)[2]) + 0.24, 1.10),
            hull_mat)
    if detail >= 3:
        # HUMAN ports on the cupola flanks — never scaled.
        pw, ph, pd = sf.FLANK_PORT
        for side, tag in ((-1.0, 'p'), (1.0, 's')):
            kit.box(parts, 'frigate.cmd.port.%s' % tag, kit.ROLE_RECESS,
                    (side * (0.50 - 0.01), cup_y + 0.04, z0 - 0.10),
                    (pw, ph, pd), hull_mat)


def _crate_run(parts, hull_mat, stations, seated, z_rack, detail):
    """Long mid crate rack. Pad bites a host section (or the spine)."""
    H = kit.ROLE_HULL
    host = seated.get('b') or seated.get('a')
    if host is not None:
        loc, size, _ = host
        rack_y = loc[1] + size[1] * 0.5 - 0.12
        rack_x = -1.35
    else:
        rack_y = sf.top_y(stations, z_rack, 0.0) - 0.02
        rack_x = -0.70
    n_crate = max(6, int(round(_RACK_LEN / sf.CRATE_PITCH)))
    su.crate_rack(parts, 'frigate.rack', hull_mat,
                  (rack_x, rack_y, z_rack),
                  length=_RACK_LEN, count=n_crate, detail=detail)
    # Through-bolts into the host / spine so the rack cannot island.
    kit.box(parts, 'frigate.rack.root', H,
            (rack_x * 0.45, rack_y - 0.10, z_rack),
            (abs(rack_x) + 0.40, 0.28, _RACK_LEN * 0.55), hull_mat)
    if detail >= 2:
        hw.clamp_pair(parts, 'frigate.rack.clamp', hull_mat,
                      (rack_x, rack_y + 0.28, z_rack + 1.10),
                      detail=detail)
    if detail >= 3:
        crate = sf.CARGO_CRATE[0]
        su.cargo_net(parts, 'frigate.rack.net', hull_mat,
                     (rack_x, rack_y + crate * 0.5 + 0.06, z_rack - 0.90),
                     facing='up', detail=detail)


def _hangar(parts, hull_mat, stations, seated, z_hangar, detail):
    """Open starboard cradle. Pad pierces section D. Craft intersects pad."""
    H = kit.ROLE_HULL
    host = seated.get('d')
    if host is not None:
        h_loc, h_size, _ = host
        half = h_size[0] * 0.5
        pad_y = h_loc[1] - 0.10
        pad_x = half + 1.10 - 0.22
        yo = h_loc[1]
        fx = half
    else:
        half_w, _hh, yo, _ = sf.section(stations, z_hangar)
        fx = sf.flank_x(stations, z_hangar, yo)
        if fx <= 0.0:
            fx = half_w
        pad_x = fx + 1.10
        pad_y = yo

    pad_sx, pad_sy, pad_sz = 2.40, 0.28, 2.50
    kit.box(parts, 'frigate.berth.pad', H,
            (pad_x, pad_y, z_hangar),
            (pad_sx, pad_sy, pad_sz), hull_mat)
    # Keel strut: pad through the section into the spine.
    kit.box(parts, 'frigate.berth.keel-strut', H,
            (pad_x * 0.5, (yo + pad_y) * 0.5, z_hangar),
            (pad_x + 0.50, abs(yo - pad_y) + 0.36, 0.70),
            hull_mat)
    kit.box(parts, 'frigate.berth.cheek', kit.ROLE_RECESS,
            (fx + 0.18, yo - 0.06, z_hangar),
            (0.36, 0.70, 1.70), hull_mat)

    # Miniature nested craft from 2–3 kit.box parts. ~1.90 long.
    # Belly overlaps the pad slab so the island probe reads one body.
    y_c = pad_y + 0.16
    kit.box(parts, 'frigate.berth.craft.body', H,
            (pad_x, y_c, z_hangar),
            (0.58, 0.34, 1.32), hull_mat)
    kit.box(parts, 'frigate.berth.craft.nose', H,
            (pad_x, y_c - 0.02, z_hangar - 0.78),
            (0.40, 0.26, 0.48), hull_mat)
    kit.box(parts, 'frigate.berth.craft.tail', H,
            (pad_x, y_c + 0.02, z_hangar + 0.70),
            (0.36, 0.22, 0.42), hull_mat)
    # Explicit keel bite: craft belly into the pad.
    kit.box(parts, 'frigate.berth.craft.keel', H,
            (pad_x, pad_y + 0.08, z_hangar),
            (0.36, 0.18, 0.90), hull_mat)
    if detail >= 2:
        kit.box(parts, 'frigate.berth.cradle', H,
                (pad_x, pad_y + 0.14, z_hangar),
                (0.70, 0.14, 0.90), hull_mat)


def _section_plates(parts, tag, loc, size, hull_mat, detail, skip_stbd=False):
    """Mismatched commercial plates on a surplus section. Density is verts."""
    cols_t, rows_t = _grid(detail, 18, 12)
    cols_f, rows_f = _grid(detail, 14, 6)
    if cols_t < 1:
        return
    # depth 0.36 ⇒ kit sink 0.09 ≥ 0.08 bury (island probe).
    kit.plate_grid(parts, 'frigate.sec.%s.top' % tag, kit.ROLE_ARMOUR,
                   loc, size, hull_mat, cols_t, rows_t, face='y',
                   depth=0.36, gap=0.08)
    kit.plate_grid(parts, 'frigate.sec.%s.port' % tag, kit.ROLE_ARMOUR,
                   loc, size, hull_mat, cols_f, rows_f, face='-x',
                   depth=0.36, gap=0.08)
    if not skip_stbd:
        kit.plate_grid(parts, 'frigate.sec.%s.stbd' % tag, kit.ROLE_ARMOUR,
                       loc, size, hull_mat, cols_f, rows_f, face='x',
                       depth=0.36, gap=0.08)
    if detail >= 3:
        top = (loc[0], loc[1] + size[1] * 0.5, loc[2])
        kit.panel_lines(parts, 'frigate.sec.%s.seams' % tag, top, size,
                        hull_mat, count=4, axis='z', depth=0.10,
                        cross_count=2)


def _service_band(parts, glow, hull_mat, glow_mat, stations, seated,
                  z_lamp, detail):
    """One mid service band: lamp run at HUMAN 1.20, ports, a weld rail."""
    H = kit.ROLE_HULL
    host = seated.get('b') or seated.get('c')
    if host is not None:
        loc, size, _ = host
        deck = loc[1] + size[1] * 0.5
        band_x = 0.0
    else:
        deck = sf.top_y(stations, z_lamp, 0.0)
        loc = (0.0, deck, z_lamp)
        size = (1.20, 0.20, 5.00)
        band_x = 0.0
    kit.box(parts, 'frigate.band.rail', H,
            (band_x, deck - 0.02, z_lamp),
            (0.32, 0.12, 5.20), hull_mat)
    hw.lamp_run(parts, glow, 'frigate.lamps', hull_mat, glow_mat,
                (0.0, deck + 0.04, z_lamp), count=5, axis='z',
                facing='up', detail=detail)
    su.field_weld(parts, 'frigate.band.weld', hull_mat,
                  (0.18, deck - 0.01, z_lamp),
                  length=4.40, axis='z', detail=detail)
    # HUMAN ports along the starboard belt of the host section.
    n_port = _n(detail, 4, 2, 0, 0)
    if host is not None and n_port > 0:
        pw, ph, pd = sf.FLANK_PORT
        face_x = loc[0] + size[0] * 0.5 - 0.01
        for i in range(n_port):
            pz = z_lamp + (i - (n_port - 1) * 0.5) * sf.PORT_SPACING
            kit.box(parts, 'frigate.band.port.%d' % i, kit.ROLE_RECESS,
                    (face_x, loc[1] + 0.06, pz),
                    (pw, ph, pd), hull_mat)
