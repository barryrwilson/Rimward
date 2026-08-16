"""Congregation Cutter — REFUGE LAUNCH.

Bible §4.9: "A rescue-oriented vessel with a broad receiving lock, warm
beacon nave, medical stores, and deployable shelter sails. Its posture is
invitational but durable." Plate 09-congregation-further-shore-ship.png
is concept art, not a model to copy: midnight-blue plated drum, weathered
silver rib rings, a faceted geodesic observation nave as the forward axis,
tall folded sail vanes, underslung stowed-shelter canvas, candle-amber
guidance, restrained Wakeglass. No churches, crosses, or gold.

Construction logic is REPEATED MODULE, ritual (synthesis/21 G6). One
part, many copies. This class refuses Assembly radial fans, Unknowables
lace, Beautiful Ones flesh, Freehold empty trusses, and fantasy nave
ornament. The silhouette is a CIGAR / ribbed cylindrical DRUM SPINE.

BODY PLAN
    Drum loft (thick durable cigar) plus four ``rt.drum_bay`` copies
    along the dorsal spine — MORE than the light, same ``sf.DRUM_BAY_*``
    size, never scaled. Silver ``rt.rib_ring`` collars sit at every bay
    joint and at both zone seams. Warm ``hw.observation_nave`` (radius
    0.64, default-ish) buries into the bow face. Broad
    ``hw.receiving_lock`` faces the nose under the nave. Fleet
    ``hw.docking_collar`` hangs ventral mid. Three ``hw.archive_box``
    medical stores sit on intersecting pads in the mid band only.
    Dorsal ``rt.sail_cluster`` (count=4, plane xz) plus ventral
    ``rt.canvas_drape`` are the §G2 shelter-sail set. ONE extra
    starboard canvas is the deliberate asymmetry. Stern
    ``hw.drive_face`` with 4 nozzles. One pair of ``hw.candle_lamp``
    in the mid service band.

STATIONS (z as fractions of l; half-extents are ABSOLUTE drum radii,
never a fraction of the sail-wide class beam):
    Nave tip at l*-0.495 = -5.445. Loft bow at l*-0.382 = -4.202
    (nave bury ≥ 0.40). Transom at l*+0.470 = +5.170 so the driver
    engine glow at l*0.47 sits on the drive face. Drive discs stand
    0.12 aft of the transom (z ≈ +5.290). Max half-beam of the drum
    is 1.08; the sail cluster carries the outline out to ~2.13.

ZONES (no plate or shrine run crosses a zone seam):
    bow   l*-0.495 .. l*-0.300   ~20 %  nave + receiving lock
    mid   l*-0.300 .. l* 0.227   ~53 %  four bays, stores, sails, collar
    stern l* 0.227 .. l* 0.482   ~27 %  drive house

OUTLINE-BREAKER (G2): deployable shelter sails — dorsal cluster plus
ventral canvas drape. Shared ``rt.sail_cluster`` seats each vane with
bury ``sf.SAIL_BURY`` 0.14, so outer reach is
``hub_radius + sf.SAIL_SPAN - sf.SAIL_BURY`` = hub_radius + 1.71.
Gate: reach ≥ 0.15*l ⇒ hub_radius ≥ 0.15*l - 1.71. At l = 11.0 that
floor is −0.06, so the authored floor hub_radius = 0.42 applies.
reach = 2.13 (19.4 % of l). Plane xz keeps the four vanes in the
horizontal so the ventral canvas, not a −Y vane, breaks the keel.

EMISSIVE BUDGET (≤ 5 % of hull area, candle amber only):
    nave interior glow; two lamp irises; four drive discs; receiving
    lock slit; collar status slit. AUTHORED AIM: glow face area ≈ 2.4
    against a hull area ≈ 70–80 (≈ 3.2 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; sail / shrine / plate / bay-rib counts halve
       internally
    1  loft + four bay masses + nave + cluster hub + receiving lock
       + collar + drive
    0  loft + nave core + drive

DENSITY (AUTHORED AIM only — re-derive from measure-ships after bake):
    hull verts 10 000–28 000 (SHIP_SCALE.cutter.hull band 6 000–47 000)
    max span 10.6–11.4 (band [6.60, 15.40], target 11.0)
    len/beam ≥ 1.15; ht/len ≤ 0.60; beam/len ≥ 0.16

Extent budget (absolute ship-space, l=11.0  b=5.28  h=3.30):
    z  min ≈ -5.45 (nave tip)      max ≈ +5.29 (drive discs)  spanZ ≈ 10.74
    x  min ≈ -2.13 (port vane)     max ≈ +2.13                spanX ≈  4.26
    y  min ≈ -1.64 (ventral drape) max ≈ +1.67 (sail mast)    spanY ≈  3.31
    spanZ/spanX ≈ 2.52 ≥ 1.15; spanY/spanZ ≈ 0.31 ≤ 0.60;
    spanX/spanZ ≈ 0.40 ≥ 0.16.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import ritual as rt
from . import hardware as hw


# Absolute repeated-module sizes. Never multiplied by ship l, b or h.
_BAY_N = 4
_BAY_LEN = sf.DRUM_BAY_LEN
_BAY_R = sf.DRUM_BAY_R
_BAY_OVER = 0.12
_BAY_PITCH = _BAY_LEN - _BAY_OVER
_HUB_R = 0.42
_NAVE_R = 0.64
_PAD = (0.62, 0.18, 0.78)


# ===========================================================================
# STATION LIST
# ===========================================================================

def _cutter_stations(l, b, h):
    """Thick drum loft stations. Half-extents are absolute drum radii.

    The sail-wide class beam must not swell the module. z tracks class
    length so the loft fills the cutter run under the nave and onto the
    drive face. y_offset 0.0 throughout: the drum sits on its centreline.

    Loft bow at l*-0.382; transom at l*+0.470. Bow/mid seam at l*-0.300;
    mid/stern seam at l*+0.227.
    """
    r = min(1.08, b * 0.22, h * 0.34)
    z0 = l * -0.382
    z1 = l * 0.470
    return [
        sf.fair(z0,          r * 0.67, r * 0.65, 0.0),
        sf.fair(l * -0.300,  r * 0.89, r * 0.83, 0.0),
        sf.fair(l * -0.120,  r,        r * 0.93, 0.0),
        sf.fair(0.0,         r,        r * 0.93, 0.0),
        sf.fair(l * 0.227,   r * 0.93, r * 0.87, 0.0),
        sf.fair(l * 0.360,   r * 0.78, r * 0.72, 0.0),
        sf.fair(z1,          r * 0.63, r * 0.54, 0.0),
    ]


def _bay0_z(l):
    """First bay start, just aft of the bow/mid seam (mid band only)."""
    return l * -0.300 + 0.10


def _bay_center_z(l, i):
    return _bay0_z(l) + _BAY_LEN * 0.5 + i * _BAY_PITCH


def _bay_joint_z(l, i):
    """Joint between bay i and bay i+1 (i in 0 .. _BAY_N-2)."""
    return _bay_center_z(l, i) + _BAY_PITCH * 0.5


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Congregation refuge launch (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 loft + bays + nave + cluster hub + lock + collar + drive
                0 loft + nave core + drive.

    AUTHORED AIM (re-derive from measure-ships after bake):
        detail 3  10 000–28 000 hull verts
        max span 10.6–11.4, len/beam ≥ 1.15, ht/len ≤ 0.60, beam/len ≥ 0.16
        inside SHIP_SCALE.cutter.hull band 6 000–47 000
    """
    H = kit.ROLE_HULL

    stations = _cutter_stations(l, b, h)

    z_nose = l * -0.495
    z_loft0 = l * -0.382
    z_bow_s = l * -0.300
    z_mid_s = l * 0.227
    z_stern = l * 0.470

    # ── Primary drum loft (always) ───────────────────────────────────────
    kit.hull_loft(parts, 'cutter.hull', H, stations, hull_mat)

    # ── WARM BEACON NAVE — buried into the loft bow (always) ─────────────
    # loc is the nave centre; tip toward −Z. Base collar sits inside the
    # loft by ≥ 0.12. detail 0 keeps the core + cage mass only.
    nave_z = z_nose + sf.NAVE_LEN * 0.5
    hw.observation_nave(parts, glow, 'cutter.nave', hull_mat, glow_mat,
                        (0.0, 0.0, nave_z),
                        radius=_NAVE_R, length=sf.NAVE_LEN,
                        detail=detail)

    # ── DRIVE FACE — transom, 4 countable nozzles (always) ───────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, sec_t[2], z_stern),
                  min(sec_t[0], 0.58), min(sec_t[1], 0.48),
                  nozzles=4, depth=0.50, detail=detail)

    if detail < 1:
        return

    # ── FOUR DRUM BAYS — same DRUM_BAY_* size, mid band only ─────────────
    # Seated on the dorsal spine so each can intersects the loft by ≥ 0.18.
    for i in range(_BAY_N):
        cz = _bay_center_z(l, i)
        ty = sf.top_y(stations, cz)
        rt.drum_bay(parts, 'cutter.bay.%02d' % i, hull_mat,
                    (0.0, ty - 0.22, cz),
                    radius=_BAY_R, length=_BAY_LEN,
                    detail=detail)

    # ── DORSAL SAIL CLUSTER — §G2 outline-breaker ────────────────────────
    # detail 1 keeps the hub only (construct detail 0). Plane xz: four
    # vanes in the horizontal. Hub buries into the deck by ≥ 0.12.
    z_sail = l * 0.070
    ty_sail = sf.top_y(stations, z_sail)
    sail_det = detail if detail >= 2 else 0
    rt.sail_cluster(parts, 'cutter.sails', hull_mat,
                    (0.0, ty_sail - 0.10, z_sail),
                    count=4, hub_radius=_HUB_R, plane='xz',
                    detail=sail_det)

    # ── BROAD RECEIVING LOCK — nose, under the nave (detail 1+) ──────────
    # Mating plane at the loft bow. Barrel buries ≥ 0.12 into the drum.
    y_lock = sf.straight_bottom(stations, z_loft0) + 0.14
    hw.receiving_lock(parts, glow, 'cutter.lock', hull_mat, glow_mat,
                      (0.0, y_lock, z_loft0),
                      facing='nose', detail=detail)

    # ── VENTRAL DOCKING COLLAR — fleet bore, mid band (detail 1+) ────────
    z_cc = l * 0.020
    hw.docking_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      (0.0, sf.bottom_y(stations, z_cc), z_cc),
                      facing='down', detail=detail)

    if detail < 2:
        return

    # ── RIBS AT BAY JOINTS + ZONE SEAMS (detail 2+) ──────────────────────
    # Wrap the loft, not the smaller bay module, so the silver collars
    # read on the thick drum. Radius is the local loft half-extent.
    for i in range(_BAY_N - 1):
        jz = _bay_joint_z(l, i)
        sec = sf.section(stations, jz)
        rt.rib_ring(parts, 'cutter.joint.%02d' % i, hull_mat,
                    (0.0, sec[2], jz),
                    max(sec[0], sec[1]), detail=detail)
    for tag, zz in (('bow', z_bow_s), ('mid', z_mid_s)):
        sec = sf.section(stations, zz)
        rt.rib_ring(parts, 'cutter.zone.' + tag, hull_mat,
                    (0.0, sec[2], zz),
                    max(sec[0], sec[1]), detail=detail)

    # ── VENTRAL CANVAS + STARBOARD ASYMMETRY (detail 2+) ─────────────────
    # Construct already owns its keel pad. Extra starboard drape is the
    # one functional asymmetry.
    z_drape = l * -0.040
    by_drape = sf.bottom_y(stations, z_drape)
    rt.canvas_drape(parts, 'cutter.drape.keel', hull_mat,
                    (0.0, by_drape + 0.02, z_drape),
                    detail=detail)
    z_asym = l * 0.110
    by_as = sf.bottom_y(stations, z_asym, 0.55)
    rt.canvas_drape(parts, 'cutter.drape.stbd', hull_mat,
                    (0.55, by_as + 0.02, z_asym),
                    detail=detail)

    # ── MEDICAL STORES — 3 archive boxes on intersecting pads, mid only ──
    stores = (
        ('port', -1.0, l * -0.140),
        ('stbd.a', 1.0, l * -0.060),
        ('stbd.b', 1.0, l * 0.080),
    )
    for tag, side, zz in stores:
        if zz <= z_bow_s or zz >= z_mid_s:
            continue
        ty = sf.top_y(stations, zz, side * 0.50)
        fx = sf.flat_half(stations, zz)
        if fx < 0.28:
            continue
        cx = side * min(fx * 0.55, 0.52)
        pad_y = ty - 0.05
        kit.box(parts, 'cutter.storepad.' + tag, H,
                (cx, pad_y, zz), _PAD, hull_mat)
        hw.archive_box(parts, 'cutter.store.' + tag, hull_mat,
                       (cx, ty + 0.08, zz), detail=detail)

    # ── SHRINE PROCESSION — mid port flank, same can module (detail 2+) ──
    z_shr = l * -0.080
    if z_bow_s < z_shr < z_mid_s:
        fx = sf.flank_x(stations, z_shr, 0.0)
        if fx > 0.20:
            rt.shrine_procession(parts, 'cutter.shrines', hull_mat,
                                 (-(fx - 0.14), 0.0, z_shr),
                                 count=4, axis='z', detail=detail)

    # ── MID-DECK PLATE COURSE — service band, does not cross a seam ──────
    z_p0 = z_bow_s + 0.18
    z_p1 = z_mid_s - 0.18
    z_pc = 0.5 * (z_p0 + z_p1)
    npl = 10 if detail >= 3 else 5
    ty_p = sf.top_y(stations, z_pc)
    fw = sf.flat_half(stations, z_pc)
    kit.plate_course(parts, 'cutter.plates.mid', kit.ROLE_ARMOUR,
                     (0.0, ty_p - 0.05, z_pc),
                     (fw * 1.70, 0.12, z_p1 - z_p0),
                     hull_mat, count=npl, axis='z', gap=0.16)

    # ── ONE LAMP PAIR — mid service band (detail 2+) ─────────────────────
    z_lp = l * 0.015
    y_lp = 0.18
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        fx = sf.flank_x(stations, z_lp, y_lp)
        if fx <= 0.08:
            continue
        lx = side * (fx - 0.05)
        hw.candle_lamp(parts, glow, 'cutter.lamp.' + tag,
                       hull_mat, glow_mat, (lx, y_lp, z_lp),
                       facing='up', detail=detail)
