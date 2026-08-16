"""Independent Light — PERSONAL SHUTTLE.

Bible §5.1 Light: "Personal shuttle or prospecting boat with one obvious
owner-driven modification."

Construction logic is REPEATED COMMERCIAL MODULE / LASH-UP. A civilian
chassis takes one bolted secondhand owner-module and a short ISO crate
rack. Joints, patch plates and clamp straps are the surface language.
Refuse: closed ornamental shell, grown body, field lace, ritual cans,
identical radial fans, salvage-boom captured Banner parts, Lamplighter
gate-arms, Assembly fans, Beautiful flesh.

The silhouette is a SPINE-AND-PODS civilian shuttle. Length leads beam.
THE owner-driven modification is ``su.owner_module`` on the starboard
mid flank (ROLE_ACCENT). That is the thumbnail read. Port stays calmer.

BODY PLAN
    Chamfered civilian loft (absolute half-extents, never class beam as
    a drum radius) from loft bow to transom. Bow carries
    ``su.civilian_cabin``. Mid is one short ``su.crate_rack`` on the
    dorsal spine plus the starboard owner-module. Stern is
    ``hw.tug_core`` and a 2-nozzle ``hw.drive_face``. One service band
    (cabin ports + one lamp). Calm hull elsewhere.

STATIONS (z as fractions of l; half-extents are ABSOLUTE shuttle
radii, never a fraction of the class beam 3.276):
    Loft bow at l*-0.375 = -2.925. Transom at l*+0.470 = +3.666 so the
    driver engine glow at l*0.47 sits on the drive face. Drive discs
    stand 0.12 aft of the transom (z ≈ +3.786). Cabin nose sits near
    −3.005. Max core half-beam is 0.56; the owner-module carries the
    outline out to ~1.32.

ZONES (no service-band run crosses a zone seam):
    bow   l*-0.375 .. l*-0.180   ~25 %  civilian cabin, ports, one lamp
    mid   l*-0.180 .. l* 0.220   ~47 %  crate rack, starboard owner-module
    stern l* 0.220 .. l* 0.470   ~29 %  tug core, drive face

OUTLINE-BREAKER (G2): crate rack AND owner-module. Default
    ``sf.CRATE_RACK_LEN`` = 1.80 and ``sf.OWNER_MODULE`` Z = 1.80.
    Gate: length ≥ 0.15*l = 1.17. Both already pass. Grow with
    ``length=`` / module Z later. NEVER inflate crate size 0.85.

EMISSIVE BUDGET (≤ 5 % of hull area, warm amber only):
    two drive discs; 1–2 cabin ports; one nav-lamp iris.
    AUTHORED AIM: glow face area ≈ 0.09 against a hull area ≈ 20–28
    (≈ 0.4 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; crate / port counts halve
    1  loft + cabin + owner-module + rack frame + tug + drive
    0  loft + drive

DENSITY (AUTHORED AIM only — re-derive from measure-ships after bake):
    hull verts 5 000–9 000 (SHIP_SCALE.light.hull band 4 000–25 000)
    max span ~6.8 (band [4.08, 9.52], target 6.8)
    len/beam ≥ 1.15; ht/len ≤ 0.60; beam/len ≥ 0.16
    stay SMALLER than ace (~7.2) and well below cutter (~11)

Extent budget (absolute ship-space, l=7.8  b=3.276  h=1.872):
    z  min ≈ -3.01 (cabin nose)    max ≈ +3.79 (drive discs)  spanZ ≈ 6.80
    x  min ≈ -0.56 (port flank)    max ≈ +1.32 (owner-module) spanX ≈  1.88
    y  min ≈ -0.42 (keel)          max ≈ +1.22 (crate top)    spanY ≈  1.64
    spanZ/spanX ≈ 3.62 ≥ 1.15; spanY/spanZ ≈ 0.24 ≤ 0.60;
    spanX/spanZ ≈ 0.28 ≥ 0.16.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import surplus as su
from . import hardware as hw


# Absolute seating. Never multiplied by ship l, b or h.
_BURY = 0.16
_PAD_SINK = 0.04


# ===========================================================================
# STATION LIST
# ===========================================================================

def _light_stations(l, b, h):
    """Blocky civilian shuttle loft. Half-extents are absolute.

    ``b`` and ``h`` name the driver envelope (3.276, 1.872). They do not
    scale the core. z tracks class length so the loft fills the light
    run under the cabin and onto the drive face. y_offset stays near 0
    so the spine is a straight chassis, not a faired leaf.

    Loft bow at l*-0.375; transom at l*+0.470. Bow/mid seam at l*-0.180;
    mid/stern seam at l*+0.220.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.375, 0.38, 0.32, 0.04),
        sf.fair(l * -0.280, 0.46, 0.36, 0.03),
        sf.fair(l * -0.181, 0.50, 0.38, 0.02),
        sf.fair(l * -0.180, 0.54, 0.40, 0.00),
        sf.fair(l * 0.020, 0.56, 0.42, 0.00),
        sf.fair(l * 0.219, 0.52, 0.40, 0.00),
        sf.fair(l * 0.220, 0.48, 0.38, 0.02),
        sf.fair(l * 0.350, 0.52, 0.40, 0.02),
        sf.fair(l * 0.470, 0.46, 0.36, 0.02),
    ]


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


def _cabin_ports(parts, name, mat, loc, sx, detail):
    """HUMAN flank ports on the cabin box. Pitch is sf.PORT_SPACING."""
    if detail < 2:
        return
    n = 3 if detail >= 3 else 2
    pitch = sf.PORT_SPACING
    z0 = loc[2] - pitch * (n - 1) * 0.5
    port = sf.FLANK_PORT
    y = loc[1] + 0.04
    for side, tag in ((-1.0, 'p'), (1.0, 's')):
        x = loc[0] + side * (sx * 0.5 - 0.01)
        for i in range(n):
            kit.box(parts, '%s.port.%s.%d' % (name, tag, i), kit.ROLE_RECESS,
                    (x, y, z0 + pitch * i), port, mat)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Independent personal shuttle (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (7.8, 3.276, 1.872).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 loft + cabin + owner-module + rack frame + tug + drive
                0 loft + drive.

    AUTHORED AIM (re-derive from measure-ships after bake):
        detail 3  5 000–9 000 hull verts
        max span ~6.8, len/beam ≥ 1.15, ht/len ≤ 0.60, beam/len ≥ 0.16
        inside SHIP_SCALE.light.hull band 4 000–25 000
    """
    H = kit.ROLE_HULL

    stations = _light_stations(l, b, h)

    z_loft0 = l * -0.375
    z_bow_s = l * -0.180
    z_mid_s = l * 0.220
    z_stern = l * 0.470

    cab_sx, cab_sy, cab_sz = sf.CIVILIAN_CABIN
    om_sx = sf.OWNER_MODULE[0]
    crate = sf.CARGO_CRATE[0]

    # Cabin centre sits 0.62 aft of the loft bow so the 1.40 cabin
    # overlaps the spine by more than 0.08 and the nose stays near −3.00.
    z_cab = z_loft0 + 0.62
    z_mid = l * 0.020
    z_tug = z_stern - sf.TUG_CORE[2] * 0.5 - 0.08

    # ── Primary shuttle loft (always) ────────────────────────────────────
    kit.hull_loft(parts, 'light.hull', H, stations, hull_mat)

    # ── DRIVE FACE — transom, 2 countable nozzles (always) ───────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  min(sec_t[0], 0.46), min(sec_t[1], 0.36),
                  nozzles=2, depth=0.46, detail=detail)

    if detail < 1:
        return

    # ── CIVILIAN CABIN — bow pod (detail 1+) ─────────────────────────────
    # Cap at detail 2 so surplus ports stay off; glow ports are authored
    # below as the one service band.
    sec_c = sf.section(stations, z_cab)
    y_cab = sec_c[2]
    su.civilian_cabin(parts, 'light.cabin', hull_mat,
                      (0.0, y_cab, z_cab),
                      detail=1 if detail < 2 else 2)

    # ── OWNER-MODULE — starboard mid, the one owner mark (detail 1+) ─────
    # Bury 0.16 of the 0.92 box into the flank. Port has no twin.
    y_om = sf.section(stations, z_mid)[2]
    fx_om = sf.flank_x(stations, z_mid, y_om)
    x_om = fx_om + om_sx * 0.5 - _BURY
    su.owner_module(parts, 'light.owner', hull_mat,
                    (x_om, y_om, z_mid),
                    detail=detail)

    # ── CRATE RACK — dorsal mid, default 1.80 / crate 0.85 (detail 1+) ───
    # Pad centre sits _PAD_SINK below the deck so the 0.10 pad pierces.
    ty_rk = sf.top_y(stations, z_mid, 0.0)
    y_pad = ty_rk - _PAD_SINK
    su.crate_rack(parts, 'light.rack', hull_mat,
                  (0.0, y_pad, z_mid),
                  length=sf.CRATE_RACK_LEN, detail=detail)

    # ── TUG CORE — stern engineering block (detail 1+) ───────────────────
    sec_g = sf.section(stations, z_tug)
    hw.tug_core(parts, 'light.tug', hull_mat,
                (0.0, sec_g[2], z_tug),
                detail=detail)

    if detail < 2:
        return

    # ── ZONE STRAPS — visible joints at each seam (detail 2+) ────────────
    for tag, zz in (('bow', z_bow_s), ('stern', z_mid_s)):
        hw2, hh2, yo, _ch = sf.seam_ring(stations, zz, over=0.06)
        su.zone_strap(parts, 'light.seam.' + tag, hull_mat,
                      (0.0, yo, zz),
                      width=hw2 * 2.0, height=hh2 * 2.0,
                      detail=detail)

    # ── SERVICE BAND — cabin ports + one lamp (detail 2+; bow only) ──────
    n_port = 2 if detail >= 3 else 1
    # PORT_LIGHT depth is 0.06; sit the row just aft of the cabin face
    # so every pane shares voxels with the cabin mass.
    port_z = z_cab - cab_sz * 0.5 + sf.PORT_LIGHT[2] * 0.5 - 0.01
    kit.window_row(glow, 'light.cabin.port',
                   (0.0, y_cab + 0.10, port_z),
                   glow_mat, n_port, sf.PORT_SPACING, sf.PORT_LIGHT)

    lamp_z = z_cab + 0.10
    if lamp_z < z_bow_s:
        y_lp = y_cab + cab_sy * 0.5 - 0.02
        hw.nav_lamp(parts, glow, 'light.cabin', hull_mat, glow_mat,
                    (0.0, y_lp, lamp_z),
                    facing='up', detail=detail)

    # ── OWNER JOINT — strap + weld into the starboard flank ──────────────
    su.field_weld(parts, 'light.owner', hull_mat,
                  (fx_om - 0.04, y_om, z_mid),
                  length=0.90, axis='z', detail=detail)
    su.strap_clamp(parts, 'light.owner', hull_mat,
                   ((fx_om + x_om) * 0.5, y_om + 0.16, z_mid),
                   span=max(x_om - fx_om + 0.16, 0.42),
                   axis='x', detail=detail)

    # ── PORT PATCH — one calm-side plate, not a twin module ──────────────
    z_pt = l * -0.040
    if z_bow_s < z_pt < z_mid_s:
        y_pt = 0.06
        fx_pt = sf.flank_x(stations, z_pt, y_pt)
        if fx_pt > 0.12:
            su.patch_plate(parts, 'light.port', hull_mat,
                           (-fx_pt + 0.03, y_pt, z_pt),
                           facing='port', detail=detail)

    # ── CABIN / SPINE WELD — bow deck joint (stays in the bow zone) ──────
    z_cw = z_cab + 0.40
    if z_cw < z_bow_s:
        ty_cw = sf.top_y(stations, z_cw, 0.0)
        su.field_weld(parts, 'light.cabin', hull_mat,
                      (0.0, ty_cw - 0.03, z_cw),
                      length=0.48, axis='x', detail=detail)

    if detail < 3:
        return

    # ── CARGO NET — over the rack crates (detail 3) ──────────────────────
    crate_top = y_pad + sf.RACK_PAD_T * 0.5 + crate - 0.06
    su.cargo_net(parts, 'light.rack', hull_mat,
                 (0.0, crate_top - 0.03, z_mid),
                 face=(crate, sf.CRATE_RACK_LEN - 0.24),
                 facing='up', detail=detail)

    # ── TUG / SPINE WELD — stern joint ───────────────────────────────────
    ty_tg = sf.top_y(stations, z_tug, 0.0)
    su.field_weld(parts, 'light.tug', hull_mat,
                  (0.0, ty_tg - 0.03, z_tug),
                  length=0.56, axis='x', detail=detail)

    # ── MID LASH-UP — armour on existing chassis faces ───────────────────
    # One detail band. No course crosses a zone seam. Host box is the
    # min straight section so plates pierce the loft and stay inboard of
    # the owner-module outline.
    z_p0 = z_bow_s + 0.10
    z_p1 = z_mid_s - 0.10
    z_pmid = 0.5 * (z_p0 + z_p1)
    mid_run = z_p1 - z_p0
    hw_m, st_h, fw_m, yo_m = _min_skin(stations, z_p0, z_p1)
    A = kit.ROLE_ARMOUR
    cols = 16 if detail >= 3 else 8
    rows = 7 if detail >= 3 else 4
    kit.plate_grid(parts, 'light.mid.s', A,
                   (0.0, yo_m, z_pmid),
                   (hw_m * 2.0, st_h * 2.0, mid_run),
                   hull_mat, cols=cols, rows=rows, face='x', depth=0.10)
    kit.plate_grid(parts, 'light.mid.p', A,
                   (0.0, yo_m, z_pmid),
                   (hw_m * 2.0, st_h * 2.0, mid_run),
                   hull_mat, cols=cols, rows=rows, face='-x', depth=0.10)
    dcols = 6 if detail >= 3 else 3
    drows = 14 if detail >= 3 else 7
    ty_mid = sf.top_y(stations, z_pmid, 0.0)
    kit.plate_grid(parts, 'light.mid.deck', A,
                   (0.0, ty_mid - 0.08, z_pmid),
                   (fw_m * 2.0, 0.16, mid_run),
                   hull_mat, cols=dcols, rows=drows, face='y', depth=0.10)
    kcols = 5 if detail >= 3 else 3
    krows = 12 if detail >= 3 else 6
    by_mid = sf.bottom_y(stations, z_pmid, 0.0)
    kit.plate_grid(parts, 'light.mid.keel', A,
                   (0.0, by_mid + 0.08, z_pmid),
                   (fw_m * 2.0, 0.16, mid_run),
                   hull_mat, cols=kcols, rows=krows, face='-y', depth=0.10)

    n_belt = 8 if detail >= 3 else 4
    fx_b = sf.flank_anchor(stations, z_pmid, yo_m, 0.06)
    if fx_b > 0.12:
        kit.plate_course(parts, 'light.mid.belt.s', A,
                         (fx_b, yo_m, z_pmid),
                         (0.16, st_h * 1.55, mid_run),
                         hull_mat, count=n_belt, axis='z', bevel=0.02)
        kit.plate_course(parts, 'light.mid.belt.p', A,
                         (-fx_b, yo_m, z_pmid),
                         (0.16, st_h * 1.55, mid_run),
                         hull_mat, count=n_belt, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.mid.belt.deck', A,
                     (0.0, ty_mid - 0.06, z_pmid),
                     (fw_m * 1.70, 0.16, mid_run),
                     hull_mat, count=n_belt, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.mid.belt.keel', A,
                     (0.0, by_mid + 0.06, z_pmid),
                     (fw_m * 1.50, 0.16, mid_run),
                     hull_mat, count=max(n_belt - 1, 3), axis='z', bevel=0.02)

    # ── CABIN COURSES + HUMAN PORTS — existing cabin faces ───────────────
    n_cab = 4 if detail >= 3 else 2
    kit.plate_course(parts, 'light.cabin.belt.s', A,
                     (cab_sx * 0.5 - 0.02, y_cab, z_cab),
                     (0.16, cab_sy * 0.70, cab_sz * 0.78),
                     hull_mat, count=n_cab, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.cabin.belt.p', A,
                     (-cab_sx * 0.5 + 0.02, y_cab, z_cab),
                     (0.16, cab_sy * 0.70, cab_sz * 0.78),
                     hull_mat, count=n_cab, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.cabin.belt.dk', A,
                     (0.0, y_cab + cab_sy * 0.5 - 0.02, z_cab),
                     (cab_sx * 0.70, 0.16, cab_sz * 0.78),
                     hull_mat, count=n_cab, axis='z', bevel=0.02)
    ccols = 5 if detail >= 3 else 3
    crows = 3 if detail >= 3 else 2
    kit.plate_grid(parts, 'light.cabin.s', A,
                   (0.0, y_cab, z_cab),
                   (cab_sx, cab_sy * 0.70, cab_sz * 0.80),
                   hull_mat, cols=ccols, rows=crows, face='x', depth=0.10)
    kit.plate_grid(parts, 'light.cabin.p', A,
                   (0.0, y_cab, z_cab),
                   (cab_sx, cab_sy * 0.70, cab_sz * 0.80),
                   hull_mat, cols=ccols, rows=crows, face='-x', depth=0.10)
    kit.plate_grid(parts, 'light.cabin.dk', A,
                   (0.0, y_cab, z_cab),
                   (cab_sx * 0.70, cab_sy, cab_sz * 0.80),
                   hull_mat, cols=4 if detail >= 3 else 2,
                   rows=5 if detail >= 3 else 3, face='y', depth=0.10)
    _cabin_ports(parts, 'light.cabin', hull_mat, (0.0, y_cab, z_cab),
                 cab_sx, detail)

    # ── STERN COURSES — existing tug / chassis faces, aft of mid seam ───
    z_s0 = z_mid_s + 0.12
    z_s1 = z_stern - 0.22
    z_smid = 0.5 * (z_s0 + z_s1)
    st_run = z_s1 - z_s0
    hw_s, st_s, fw_s, yo_s = _min_skin(stations, z_s0, z_s1)
    n_st = 6 if detail >= 3 else 3
    fx_s = sf.flank_anchor(stations, z_smid, yo_s, 0.06)
    if fx_s > 0.12:
        kit.plate_course(parts, 'light.stern.belt.s', A,
                         (fx_s, yo_s, z_smid),
                         (0.16, st_s * 1.55, st_run),
                         hull_mat, count=n_st, axis='z', bevel=0.02)
        kit.plate_course(parts, 'light.stern.belt.p', A,
                         (-fx_s, yo_s, z_smid),
                         (0.16, st_s * 1.55, st_run),
                         hull_mat, count=n_st, axis='z', bevel=0.02)
    ty_st = sf.top_y(stations, z_smid, 0.0)
    by_st = sf.bottom_y(stations, z_smid, 0.0)
    kit.plate_course(parts, 'light.stern.belt.deck', A,
                     (0.0, ty_st - 0.06, z_smid),
                     (fw_s * 1.60, 0.16, st_run),
                     hull_mat, count=n_st, axis='z', bevel=0.02)
    kit.plate_course(parts, 'light.stern.belt.keel', A,
                     (0.0, by_st + 0.06, z_smid),
                     (fw_s * 1.40, 0.16, st_run),
                     hull_mat, count=max(n_st - 1, 3), axis='z', bevel=0.02)

    # ── LASH-UP JOINTS — patches, welds, straps on existing masses ───────
    su.patch_plate(parts, 'light.cabin.dk', hull_mat,
                   (0.16, y_cab + cab_sy * 0.5 - 0.03, z_cab + 0.12),
                   size=(0.36, 0.10, 0.44), facing='up', detail=detail)
    su.patch_plate(parts, 'light.cabin.s', hull_mat,
                   (cab_sx * 0.5 - 0.02, y_cab - 0.06, z_cab - 0.16),
                   size=(0.36, 0.10, 0.44), facing='starboard',
                   detail=detail)
    su.patch_plate(parts, 'light.mid.dk', hull_mat,
                   (0.10, ty_mid - 0.03, z_pmid + 0.28),
                   size=(0.42, 0.10, 0.54), facing='up', detail=detail)
    su.patch_plate(parts, 'light.stern.p', hull_mat,
                   (-fx_s + 0.03 if fx_s > 0.12 else -0.36,
                    yo_s - 0.04, z_smid),
                   facing='port', detail=detail)
    su.patch_plate(parts, 'light.tug.s', hull_mat,
                   (sf.TUG_CORE[0] * 0.5 - 0.02, sec_g[2] + 0.08, z_tug),
                   size=(0.40, 0.10, 0.52), facing='starboard',
                   detail=detail)

    su.field_weld(parts, 'light.rack.p', hull_mat,
                  (-0.36, y_pad, z_mid),
                  length=sf.CRATE_RACK_LEN * 0.55, axis='z', detail=detail)
    su.field_weld(parts, 'light.rack.s', hull_mat,
                  (0.36, y_pad, z_mid),
                  length=sf.CRATE_RACK_LEN * 0.55, axis='z', detail=detail)
    su.field_weld(parts, 'light.cabin.keel', hull_mat,
                  (0.0, y_cab - cab_sy * 0.5 + 0.03, z_cab + 0.18),
                  length=0.48, axis='x', detail=detail)
    su.field_weld(parts, 'light.stern.deck', hull_mat,
                  (0.0, ty_st - 0.03, z_smid),
                  length=0.52, axis='x', detail=detail)

    su.strap_clamp(parts, 'light.cabin.spine', hull_mat,
                   (0.0, y_cab - cab_sy * 0.5 + 0.04, z_cab + 0.48),
                   span=0.70, axis='x', detail=detail)
    su.strap_clamp(parts, 'light.rack.pad', hull_mat,
                   (0.0, y_pad + 0.06, z_mid - 0.40),
                   span=0.70, axis='x', detail=detail)
    su.strap_clamp(parts, 'light.tug.deck', hull_mat,
                   (0.0, ty_tg - 0.02, z_tug),
                   span=0.80, axis='x', detail=detail)
