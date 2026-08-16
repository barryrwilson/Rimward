"""Independent Cutter — SALVAGE TUG / SMUGGLER ESCORT.

Bible §5.1: "Escort, smuggler, or salvage tug with clamps and modular
mission pods." There is no concept-art plate. This file sculpts a
commercial chassis with a crate rack, tug jaws, and bolted surplus. It
does not copy a Lamplighter gate-arm fork or a Red Ledger salvage boom.

Construction logic is REPEATED COMMERCIAL MODULE / LASH-UP. A bigger
Independent ship carries MORE crates / MORE pods, never bigger ISO cubes.
HUMAN.crateS stays 0.85. This class refuses closed ornamental shells,
grown bodies, field lace, ritual cans, radial fans, captured Banner
parts, homestead trusses, and gate-arm forks.

The silhouette is a SPINE-AND-PODS work tug: civilian cabin at the bow,
crate rack as the mid outline-breaker, old tug core and a four-nozzle
drive at the stern. Length leads beam.

BODY PLAN
    Chamfered civilian loft (absolute half-extents, never class beam as
    a drum radius) from loft bow to transom. Bow face carries
    ``hw.docking_collar`` (facing nose) plus ``su.civilian_cabin``.
    ``hw.clamp_pair`` yoke buries into that bow; the jaws hang as tug
    clamps, not a long fork. Mid band is ``su.crate_rack`` grown along
    Z, one ``su.owner_module`` (the one accent), one or two
    ``hw.mission_pod``, and ``su.zone_strap`` at both zone seams. One
    extra starboard mission pod is the functional asymmetry. Optional
    ``su.cargo_net`` sits on a crate top, never on a hull query. Stern
    is ``hw.tug_core`` plus ``hw.drive_face`` with 4 nozzles. One
    service band (mid rack + nav lamps). Calm skins on bow and stern.

STATIONS (z as fractions of l; half-extents are ABSOLUTE chassis
radii, never a fraction of the class beam 5.28):
    Loft bow at l*-0.508 = -5.588. Transom at l*+0.470 = +5.170 so the
    driver engine glow at l*0.47 sits on the drive face. Drive discs
    stand 0.12 aft of the transom (z ≈ +5.290). Clamp pads reach
    ≈ -5.72. Max core half-beam is 1.12; pods carry the outline out
    to ~1.35.

ZONES (no plate or strap run crosses a zone seam):
    bow   l*-0.508 .. l*-0.248   ~26 %  cabin, collar, clamp yoke
    mid   l*-0.248 .. l* 0.210   ~46 %  crate rack, pods, owner, lamps
    stern l* 0.210 .. l* 0.482   ~27 %  tug core, drive house

OUTLINE-BREAKER (G2): ``su.crate_rack`` along Z. Authored length
    3.10 ≥ 0.15*l = 1.65 (28.2 % of 11). Grow with ``length=``. NEVER
    inflate the 0.85 crate.

EMISSIVE BUDGET (≤ 5 % of hull area, warm amber only):
    four drive discs; collar status slit; 2–4 nav-lamp irises at
    ``sf.LAMP_SPACING`` 1.20. AUTHORED AIM: glow face area ≈ 0.20
    against a hull area ≈ 55–80 (≈ 0.3 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; plate / lamp / pod counts halve
    1  loft + cabin + collar + clamp + rack + tug + drive
    0  loft + drive

DENSITY (AUTHORED AIM only — re-derive from measure-ships after bake):
    hull verts 8 000–28 000 (SHIP_SCALE.cutter.hull band 6 000–47 000)
    prefer ~11 000–18 000
    max span 10.6–11.4 (band [6.60, 15.40], target 11.0)
    len/beam ≥ 1.15; ht/len ≤ 0.60; beam/len ≥ 0.16

Extent budget (absolute ship-space, l=11.0  b=5.28  h=3.30):
    z  min ≈ -5.72 (clamp pad)     max ≈ +5.29 (drive discs)  spanZ ≈ 11.01
    x  min ≈ -1.20 (port pod)      max ≈ +1.36 (owner box)    spanX ≈  2.56
    y  min ≈ -0.68 (keel / jaws)   max ≈ +1.48 (crate top)    spanY ≈  2.16
    spanZ/spanX ≈ 4.30 ≥ 1.15; spanY/spanZ ≈ 0.20 ≤ 0.60;
    spanX/spanZ ≈ 0.23 ≥ 0.16.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import surplus as su
from . import hardware as hw


# Absolute repeated-module sizes. Never multiplied by ship l, b or h.
_RACK_LEN = 3.10
_BURY = 0.10


# ===========================================================================
# STATION LIST
# ===========================================================================

def _cutter_stations(l, b, h):
    """Blocky civilian chassis. Half-extents are absolute, not class beam.

    ``b`` and ``h`` name the driver envelope (5.28, 3.30). They do not
    scale the core. z tracks class length so the loft fills the cutter
    run under the cabin and onto the drive face. y_offset 0.0
    throughout: the tug sits on its centreline.

    Loft bow at l*-0.508; transom at l*+0.470. Bow/mid seam at l*-0.248;
    mid/stern seam at l*+0.210.
    """
    _ = (b, h)
    return [
        sf.fair(l * -0.508, 0.88, 0.52, 0.0),
        sf.fair(l * -0.400, 1.00, 0.56, 0.0),
        sf.fair(l * -0.248, 1.10, 0.60, 0.0),
        sf.fair(l * -0.060, 1.12, 0.62, 0.0),
        sf.fair(l * 0.080, 1.10, 0.60, 0.0),
        sf.fair(l * 0.210, 1.04, 0.56, 0.0),
        sf.fair(l * 0.360, 0.90, 0.50, 0.0),
        sf.fair(l * 0.470, 0.76, 0.42, 0.0),
    ]


def _rack_count(length):
    return max(1, int(round(float(length) / sf.CRATE_PITCH)))


def _rack_crate_zs(length, count, lz):
    """Crate centres matching surplus.crate_rack so a net can sit on one."""
    crate = sf.CARGO_CRATE[0]
    end_t = 0.12
    usable = max(float(length) - end_t * 1.2, crate)
    n = max(1, int(count))
    if n == 1:
        return [lz]
    span = min(usable - crate, (n - 1) * sf.CRATE_PITCH)
    span = max(span, 0.0)
    z0 = lz - span * 0.5
    return [z0 + span * i / float(n - 1) for i in range(n)]


def _min_mid_section(stations, z0, z1):
    """Narrowest half-extents on a mid run so a plate grid stays in-hull."""
    hw_m = 1e9
    hh_m = 1e9
    yo = 0.0
    for i in range(5):
        z = z0 + (z1 - z0) * i / 4.0
        hw, hh, yoi, _ch = sf.section(stations, z)
        if hw < hw_m:
            hw_m = hw
            yo = yoi
        if hh < hh_m:
            hh_m = hh
    return hw_m, hh_m, yo


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Independent salvage tug (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 loft + cabin + collar + clamp + rack + tug + drive
                0 loft + drive.

    AUTHORED AIM (re-derive from measure-ships after bake):
        detail 3  8 000–28 000 hull verts (prefer 11 000–18 000)
        max span 10.6–11.4, len/beam ≥ 1.15, ht/len ≤ 0.60, beam/len ≥ 0.16
        inside SHIP_SCALE.cutter.hull band 6 000–47 000
    """
    H = kit.ROLE_HULL
    A = kit.ROLE_ARMOUR

    stations = _cutter_stations(l, b, h)

    z_loft0 = l * -0.508
    z_bow_s = l * -0.248
    z_mid_s = l * 0.210
    z_stern = l * 0.470

    # ── Primary civilian loft (always) ───────────────────────────────────
    kit.hull_loft(parts, 'cutter.hull', H, stations, hull_mat)

    # ── DRIVE FACE — transom, 4 countable nozzles (always) ───────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  min(sec_t[0], 0.68), min(sec_t[1], 0.40),
                  nozzles=4, depth=0.50, detail=detail)

    if detail < 1:
        return

    # ── CIVILIAN CABIN — bow mass, buried into the loft (detail 1+) ──────
    z_cab = z_loft0 + sf.CIVILIAN_CABIN[2] * 0.5 - _BURY
    if z_cab < z_bow_s:
        ty_cab = sf.top_y(stations, z_cab)
        y_cab = ty_cab - _BURY + sf.CIVILIAN_CABIN[1] * 0.5
        su.civilian_cabin(parts, 'cutter.cabin', hull_mat,
                          (0.0, y_cab, z_cab), detail=detail)

    # ── FLEET COLLAR — bow face, facing the nose (detail 1+) ─────────────
    # Mating plane at the loft bow. Barrel buries ≥ 0.12 into the core.
    sec_b = sf.section(stations, z_loft0)
    hw.docking_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      (0.0, sec_b[2], z_loft0),
                      facing='nose', detail=detail)

    # ── TUG CLAMP PAIR — yoke buried in the bow (detail 1+) ──────────────
    # Short container jaws. Not a gate-arm fork. Yoke aft face sits
    # ≥ 0.08 inside the loft.
    z_cl = z_loft0 + 0.02
    y_cl = sf.bottom_y(stations, z_cl) + 0.22
    hw.clamp_pair(parts, 'cutter.clamp', hull_mat,
                  (0.0, y_cl, z_cl),
                  span=sf.CARGO_CRATE[0], detail=detail)

    # ── CRATE RACK — §G2 outline-breaker, mid band (detail 1+) ───────────
    # length 3.10 ≥ 1.65. Crate size stays 0.85. Pad buries ≥ 0.08 in deck.
    z_rk = (z_bow_s + z_mid_s) * 0.5
    pad_t = max(sf.RACK_PAD_T, 0.08)
    ty_rk = sf.top_y(stations, z_rk)
    y_rk = ty_rk - _BURY + pad_t * 0.5
    rack_n = _rack_count(_RACK_LEN)
    su.crate_rack(parts, 'cutter.rack', hull_mat,
                  (0.0, y_rk, z_rk),
                  length=_RACK_LEN, count=rack_n, detail=detail)

    # ── TUG CORE — stern engineering block (detail 1+) ───────────────────
    # Whole block stays aft of the mid/stern seam. Forward face buries
    # into the stern loft, not across the zone strap.
    z_tg = z_mid_s + _BURY + sf.TUG_CORE[2] * 0.5
    sec_g = sf.section(stations, z_tg)
    hw.tug_core(parts, 'cutter.tug', hull_mat,
                (0.0, sec_g[2], z_tg), detail=detail)

    # ── PORT MISSION POD — class identity, mid band (detail 1+) ──────────
    z_pod0 = l * -0.110
    px = sf.MISSION_POD[0]
    if z_bow_s < z_pod0 < z_mid_s:
        y_p0 = sf.section(stations, z_pod0)[2] + 0.02
        fx_p0 = sf.flank_x(stations, z_pod0, y_p0)
        if fx_p0 > 0.16:
            hw.mission_pod(parts, 'cutter.pod.port', hull_mat,
                           (-(fx_p0 - px * 0.5 + _BURY), y_p0, z_pod0),
                           detail=detail)

    if detail < 2:
        return

    # ── ZONE STRAPS — visible joints at both seams (detail 2+) ───────────
    for tag, zz in (('bow', z_bow_s), ('mid', z_mid_s)):
        hw2, hh2, yo, _ch = sf.seam_ring(stations, zz, over=0.06)
        su.zone_strap(parts, 'cutter.seam.' + tag, hull_mat,
                      (0.0, yo, zz),
                      width=hw2 * 2.0, height=hh2 * 2.0, detail=detail)

    # ── OWNER MODULE — one accent, starboard mid (detail 2+) ─────────────
    z_ow = l * 0.050
    if z_bow_s < z_ow < z_mid_s:
        ox, oy, _oz = sf.OWNER_MODULE
        y_ow = sf.section(stations, z_ow)[2] + 0.04
        fx_ow = sf.flank_x(stations, z_ow, y_ow)
        if fx_ow > 0.20:
            x_ow = fx_ow - ox * 0.5 + _BURY
            su.owner_module(parts, 'cutter.owner', hull_mat,
                            (x_ow, y_ow, z_ow), detail=detail)
            su.strap_clamp(parts, 'cutter.owner.strap', hull_mat,
                           (x_ow - ox * 0.25, y_ow + oy * 0.15, z_ow),
                           span=ox * 0.55, axis='x', detail=detail)

    # ── EXTRA STARBOARD POD — the one functional asymmetry (detail 2+) ───
    z_pod1 = l * 0.115
    if z_bow_s < z_pod1 < z_mid_s:
        y_p1 = sf.section(stations, z_pod1)[2] + 0.02
        fx_p1 = sf.flank_x(stations, z_pod1, y_p1)
        if fx_p1 > 0.16:
            hw.mission_pod(parts, 'cutter.pod.stbd', hull_mat,
                           (fx_p1 - px * 0.5 + _BURY, y_p1, z_pod1),
                           detail=detail)

    # ── CARGO NET — seated on the forward crate top, not a hull query ────
    crate = sf.CARGO_CRATE[0]
    if detail >= 3:
        n_cr = rack_n
    elif detail == 2:
        n_cr = max(1, rack_n // 2)
    else:
        n_cr = 1
    crate_zs = _rack_crate_zs(_RACK_LEN, n_cr, z_rk)
    crate_y = y_rk + pad_t * 0.5 + crate * 0.5 - 0.06
    z_net = crate_zs[0]
    su.cargo_net(parts, 'cutter.net', hull_mat,
                 (0.0, crate_y + crate * 0.5, z_net),
                 face=(crate, crate), facing='up', detail=detail)

    # ── SERVICE BAND — nav lamps on the starboard rack rail ──────────────
    # Two at detail 2, three at detail 3. Housing sits on the rail so a
    # halved crate count cannot leave a lamp in air.
    lamp_n = 3 if detail >= 3 else 2
    lamp_span = sf.LAMP_SPACING * (lamp_n - 1)
    rail_t = max(sf.RAIL_SECTION, 0.08)
    rail_h = max(sf.RACK_RAIL_H, 0.16)
    rail_x = crate * 0.50 - rail_t * 0.35
    rail_y = y_rk + pad_t * 0.5 + rail_h * 0.35
    y_lp = rail_y + rail_h * 0.5 - 0.01
    for i in range(lamp_n):
        lz = z_rk - lamp_span * 0.5 + i * sf.LAMP_SPACING
        if lz <= z_bow_s or lz >= z_mid_s:
            continue
        hw.nav_lamp(parts, glow, 'cutter.lamp.%d' % i,
                    hull_mat, glow_mat, (rail_x + 0.06, y_lp, lz),
                    facing='up', detail=detail)

    # ── MID LASH-UP — donated plates on the mid run only (detail 2+) ─────
    # Bow and stern skins stay calm. No course crosses a zone seam.
    z_p0 = z_bow_s + 0.10
    z_p1 = z_mid_s - 0.10
    z_pmid = 0.5 * (z_p0 + z_p1)
    mid_len = z_p1 - z_p0
    hw_m, hh_m, yo_m = _min_mid_section(stations, z_p0, z_p1)
    cols = 14 if detail >= 3 else 7
    rows = 5 if detail >= 3 else 3
    kit.plate_grid(parts, 'cutter.plates.s', A,
                   (0.0, yo_m, z_pmid),
                   (hw_m * 2.0, hh_m * 2.0, mid_len),
                   hull_mat, cols=cols, rows=rows, face='x', depth=0.10)
    kit.plate_grid(parts, 'cutter.plates.p', A,
                   (0.0, yo_m, z_pmid),
                   (hw_m * 2.0, hh_m * 2.0, mid_len),
                   hull_mat, cols=cols, rows=rows, face='-x', depth=0.10)
    deck_cols = 6 if detail >= 3 else 3
    deck_rows = 12 if detail >= 3 else 6
    kit.plate_grid(parts, 'cutter.plates.deck', A,
                   (0.0, yo_m, z_pmid),
                   (hw_m * 1.70, hh_m * 2.0, mid_len),
                   hull_mat, cols=deck_cols, rows=deck_rows,
                   face='y', depth=0.10)
    keel_cols = 5 if detail >= 3 else 3
    keel_rows = 10 if detail >= 3 else 5
    kit.plate_grid(parts, 'cutter.plates.keel', A,
                   (0.0, yo_m, z_pmid),
                   (hw_m * 1.50, hh_m * 2.0, mid_len),
                   hull_mat, cols=keel_cols, rows=keel_rows,
                   face='-y', depth=0.10)

    # Mismatched patch plates and field welds — mid flanks only.
    patches = (
        ('fwd', 1.0, l * -0.150, (0.42, 0.10, 0.54)),
        ('aft', -1.0, l * 0.080, (0.48, 0.10, 0.62)),
        ('low', 1.0, l * -0.020, (0.36, 0.10, 0.44)),
    )
    if detail < 3:
        patches = patches[:2]
    for tag, side, zz, psz in patches:
        if zz <= z_bow_s or zz >= z_mid_s:
            continue
        y_pt = yo_m + (0.10 if tag != 'low' else -0.14)
        fx = sf.flank_x(stations, zz, y_pt)
        if fx <= 0.16:
            continue
        facing = 'starboard' if side > 0.0 else 'port'
        x_pt = side * (fx - psz[1] * 0.5 + 0.03)
        su.patch_plate(parts, 'cutter.patch.' + tag, hull_mat,
                       (x_pt, y_pt, zz), size=psz, facing=facing,
                       detail=detail)

    welds = (
        ('rack.p', -0.36, y_rk, z_rk, _RACK_LEN * 0.55, 'z'),
        ('rack.s', 0.36, y_rk, z_rk, _RACK_LEN * 0.55, 'z'),
    )
    for tag, wx, wy, wz, wlen, axis in welds:
        su.field_weld(parts, 'cutter.weld.' + tag, hull_mat,
                      (wx, wy, wz), length=wlen, axis=axis, detail=detail)
