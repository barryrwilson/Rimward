"""Congregation Ace — VISIONARY PATHFINDER.

Bible §4.9 ace: "A narrow, fast craft with an enlarged Wakeglass sight,
long forward keel, and sails folded so tightly they form a sharp dorsal
silhouette."

Construction logic: REPEATED MODULE, ritual (synthesis/20 §5, 21 §G2/§G6).
One part, many copies. Silhouette family: CIGAR / slim drum. The
outline-breaker is a TIGHT dorsal sail_cluster (plane xz), not a windmill
and not cloth. Midnight hull, weathered silver ribs, candle-amber glow.
No churches, crosses, gold, Assembly fans, lace, or grown flesh. Narrower
than the light courier. The sight is the identity, not a huge dome.

BODY PLAN
    A slim drum loft (kit.hull_loft) plus TWO rt.drum_bay copies in the
    mid zone. Half-extents are ABSOLUTE (0.22-0.34), never *b or *h.
    An enlarged hw.wakeglass_optic faces the nose on a trim sight hood.
    A modest hw.observation_nave (radius 0.32) bites the loft by 0.36.
    A long forward keel (kit.taper_block, length 1.80 >= 0.20*l,
    thickness 0.16 >= 0.08) runs along -Z under the bow and buries
    0.14 into the drum. G2 is rt.sail_cluster count=3, hub_radius 0.26,
    plane='xz', seated dorsal mid/bow; one extra starboard vane on a
    slightly longer hub is the one functional asymmetry. Stern
    hw.drive_face carries two countable nozzles. Two candle lamps.
    No radiator (ace is not G3).

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE
slim-drum radii, never *b or *h). At l = 7.2:
    Loft nose at l*-0.530 = -3.816; transom at l*0.455 = +3.276 ->
    loft z-span 7.092. Driver engine glow sits at z = l*0.47 = 3.384;
    drive loc is the transom, housing face 0.12 aft of that plane.
    Nave centre at l*-0.530 = -3.816; nave tip at -4.176; nave aft
    face at -3.456, so the blister intersects the loft by 0.360.
    Bow/mid seam at l*-0.310 = -2.232; mid/stern seam at l*0.220
    = +1.584. Tube half-extent 0.22 at the loft nose, 0.34 at mid,
    0.24 at the transom. Each drum_bay takes the local host radius.

ZONES (no plate or bay crosses a seam; detail lives in ONE mid band):
    bow   l*-0.530..l*-0.310   22 % of loft length
    mid   l*-0.310..l* 0.220   54 %
    stern l* 0.220..l* 0.455   24 %
    Bow is the sight, nave and long keel. Mid holds both drum bays,
    the dorsal sail ridge, the rib cage, the plate band, the paired
    shrine cans and the lamp pair. Stern is the drive face.

OUTLINE-BREAKER (G2): folded sails as a SHARP DORSAL ridge.
    rt.sail_cluster plane='xz', count=3, hub_radius 0.26.
    Reach = hub_radius + sf.SAIL_SPAN - sf.SAIL_BURY
          = 0.26 + 1.85 - 0.14
          = 1.97
    Floor is 0.15*l = 1.08 at l = 7.2. Authored reach 1.97 = 27.4 %
    of l. Do not scale SAIL_*. Tight hub, not a radial fan. The extra
    starboard vane uses hub 0.32 (reach 2.03) and a few degrees of
    bow rotation — the one deliberate mismatch.

EMISSIVE BUDGET (<= 5 % of hull area):
    Nave interior glow, two drive discs, two candle irises, one
    Wakeglass iris. No marker runs, no edge-lit panels. AUTHORED AIM:
    emissive ~= 2-3 % of hull area.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: loft, keel, nave, sight, both bays, sail cluster,
       extra vane, ribs, plates, shrine pair, lamps, drive
    2  half the bay / rib / plate repeats; cluster halves; extra
       vane kept; nave + sight + drive + keel kept
    1  loft + keel + nave + sail hub + drive + sight
    0  loft + drive + keel

DENSITY (AUTHORED AIM, not measured):
    hull verts 6,000-18,000 (SHIP_SCALE.ace.hull band 4,000-21,000)
    max span 7.4-8.0 (band [4.32, 10.08], target 7.2)
    stay within 15 % of light (~7.2-7.8) so ladder light <= ace holds
    len/beam >= 1.15; ht/len <= 0.60; beam/len >= 0.16
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import ritual as rt
from . import hardware as hw


# Absolute module sizes. Never multiply by l, b or h.
_NAVE_R = 0.32
_NAVE_LEN = 0.72
_NAVE_OVER = 0.36
_BAY_R = 0.32
_BAY_LEN = 1.00
_HUB_R = 0.26
_KEEL = (0.16, 0.26, 1.80)
_KEEL_BURY = 0.14
_SIGHT = (0.30, 0.30, 0.16)
_DRIVE_HW = 0.28
_DRIVE_HH = 0.22
_DRIVE_DEP = 0.46
_PLATE = (0.16, 0.28, 3.40)
_PORT_WELL = (0.14, 0.16, 0.24)


# ===========================================================================
# STATION LIST
# ===========================================================================

def _ace_stations(l, b, h):
    """Slim cigar drum the bays, nave and keel clamp onto.

    Half-extents are absolute slim-drum radii (0.22-0.34), narrower
    than the light's 0.28-0.42. z fractions of l. y_offset stays 0.0
    so the body is a straight pathfinder spine, not a faired leaf.
    b and h name the class envelope; the drum does not use them.
    """
    _ = (b, h)
    return [
        # -- BOW: narrow attach for the sight and nave -------------------
        sf.fair(l * -0.530, 0.22, 0.22, 0.0),  # loft nose
        sf.fair(l * -0.470, 0.26, 0.25, 0.0),
        sf.fair(l * -0.400, 0.30, 0.28, 0.0),
        sf.fair(l * -0.310, 0.32, 0.30, 0.0),  # bow/mid seam

        # -- MID: constant slim bay run ----------------------------------
        sf.fair(l * -0.160, 0.34, 0.30, 0.0),
        sf.fair(l *  0.000, 0.34, 0.30, 0.0),
        sf.fair(l *  0.110, 0.32, 0.28, 0.0),
        sf.fair(l *  0.220, 0.30, 0.27, 0.0),  # mid/stern seam

        # -- STERN: taper to the transom / drive plane -------------------
        sf.fair(l *  0.340, 0.28, 0.25, 0.0),
        sf.fair(l *  0.410, 0.26, 0.23, 0.0),
        sf.fair(l *  0.455, 0.24, 0.22, 0.0),  # transom
    ]


def _hub_radius(l):
    """Return the G2 floor hub radius. Vane module is not scaled."""
    g2 = 0.15 * l - sf.SAIL_SPAN + sf.SAIL_BURY
    return max(g2, _HUB_R)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Congregation visionary pathfinder (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.2, 2.88, 1.44).
    detail   -- 3 full  2 half repeats  1 loft+keel+nave+hub+drive
                0 loft + drive + keel.
    """
    _ = b
    H = kit.ROLE_HULL
    stations = _ace_stations(l, b, h)

    z_nose = l * -0.530      # = -3.816  loft nose
    z_bow_s = l * -0.310     # = -2.232  bow / mid seam
    z_mid_s = l * 0.220      # =  1.584  mid / stern seam
    z_trans = l * 0.455      # =  3.276  transom / drive loc
    z_nave = z_nose - (_NAVE_LEN * 0.5 - _NAVE_OVER)
    z_keel = l * -0.400
    z_sail = l * -0.280
    hub_r = _hub_radius(l)

    # ── Slim drum loft (always, detail 0+) ──────────────────────────────
    kit.hull_loft(parts, 'ace.drum', H, stations, hull_mat)

    # ── LONG FORWARD KEEL (always): blade under the bow, bury >= 0.12 ───
    # Length 1.80 >= 0.20*l. Thickness 0.16 >= 0.08. Tapers toward -Z.
    by = sf.bottom_y(stations, z_keel, 0.0)
    ky = by + _KEEL_BURY - _KEEL[1] * 0.5
    kit.taper_block(parts, 'ace.keel', H,
                    (0.0, ky, z_keel), _KEEL, hull_mat,
                    front=(0.40, 0.65), back=(1.0, 1.0))

    # ── DRIVE FACE at the transom (always; 2 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern drum. Driver glow sits at z = l*0.47.
    yo_stern = sf.section(stations, z_trans)[2]
    hw.drive_face(parts, glow, 'ace.drive', hull_mat, glow_mat,
                  (0.0, yo_stern, z_trans), _DRIVE_HW, _DRIVE_HH,
                  nozzles=2, depth=_DRIVE_DEP, detail=detail)

    if detail < 1:
        return

    # ── MODEST NAVE (detail 1+): identity is the sight, not a dome ──────
    hw.observation_nave(parts, glow, 'ace.nave', hull_mat, glow_mat,
                        (0.0, 0.0, z_nave),
                        radius=_NAVE_R, length=_NAVE_LEN, detail=detail)

    # ── ENLARGED WAKEGLASS SIGHT (detail 1+): hood + framed optic ───────
    tip_z = z_nave - _NAVE_LEN * 0.5
    kit.box(parts, 'ace.sight.hood', kit.ROLE_TRIM,
            (0.0, 0.0, tip_z + 0.05), _SIGHT, hull_mat)
    hw.wakeglass_optic(parts, glow, 'ace.sight.optic', hull_mat, glow_mat,
                       (0.0, 0.0, tip_z + 0.02),
                       facing='nose', detail=detail)

    # ── SAIL RIDGE (detail 1+): hub always; vanes from the construct ────
    # detail 1 asks for the hub only, so the cluster is called at 0.
    y_sail = sf.top_y(stations, z_sail, 0.0) - sf.SAIL_BURY
    sail_loc = (0.0, y_sail, z_sail)
    cluster_detail = 0 if detail < 2 else detail
    rt.sail_cluster(parts, 'ace.sail', hull_mat, sail_loc,
                    count=3, hub_radius=hub_r, plane='xz',
                    detail=cluster_detail)

    if detail < 2:
        return

    # ── DRUM BAYS (detail 2+): two mid modules, one at half detail ──────
    bay_locs = (
        ('fwd', l * -0.140, _BAY_R),
        ('aft', l *  0.100, _BAY_R + 0.01),
    )
    if detail < 3:
        bay_locs = bay_locs[:1]
    for tag, z_bay, r_bay in bay_locs:
        yo = sf.section(stations, z_bay)[2]
        rt.drum_bay(parts, 'ace.bay.' + tag, hull_mat,
                    (0.0, yo, z_bay), radius=r_bay, length=_BAY_LEN,
                    detail=detail)

    # ── ZONE SEAM RIBS + MID RIB CAGE (detail 2+) ───────────────────────
    rib_z = (z_bow_s, l * -0.200, l * 0.000, l * 0.160, z_mid_s)
    if detail < 3:
        rib_z = (z_bow_s, l * 0.000, z_mid_s)
    for i, z_rib in enumerate(rib_z):
        hw_r, _hh, yo, _ch = sf.section(stations, z_rib)
        rt.rib_ring(parts, 'ace.rib.%d' % i, hull_mat,
                    (0.0, yo, z_rib), hw_r, detail=detail)

    # ── MID PLATE BAND (detail 2+): plated drum, stays inside mid ───────
    z_p0 = z_bow_s + 0.14
    z_p1 = z_mid_s - 0.14
    z_pc = 0.5 * (z_p0 + z_p1)
    sz_p = z_p1 - z_p0
    npl = 12 if detail >= 3 else 6
    yo_p = sf.section(stations, z_pc)[2]
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        fx = sf.flank_x(stations, z_pc, yo_p)
        kit.plate_course(parts, 'ace.plate.' + tag, H,
                         (side * (fx - 0.05), yo_p, z_pc),
                         (_PLATE[0], _PLATE[1], sz_p), hull_mat,
                         count=npl, axis='z', gap=0.10, step=0.012)

    # ── CANDLE LAMPS (detail 2+): two, forward mid deck ─────────────────
    for i, z_lp in enumerate((l * -0.170, l * -0.050)):
        y_lp = sf.top_y(stations, z_lp, 0.0) - 0.04
        hw.candle_lamp(parts, glow, 'ace.lamp.%d' % i, hull_mat, glow_mat,
                       (0.0, y_lp, z_lp), facing='up', detail=detail)

    if detail < 3:
        return

    # ── PAIRED SHRINE CANS (detail 3): one module, two copies ───────────
    z_can = l * 0.040
    yo_c = sf.section(stations, z_can)[2]
    fx_c = sf.flank_x(stations, z_can, yo_c)
    can_x = fx_c + sf.SHRINE_CAN_R - 0.16
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        rt.shrine_can(parts, 'ace.shrine.' + tag, hull_mat,
                      (side * can_x, yo_c, z_can), detail=detail)

    # ── MID FLANK PORT WELLS (detail 3): human pitch, buried >= 0.12 ────
    port_z = (l * -0.220, l * -0.080, l * 0.060)
    for i, z_pt in enumerate(port_z):
        yo_pt = sf.section(stations, z_pt)[2]
        fx_pt = sf.flank_x(stations, z_pt, yo_pt)
        for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.box(parts, 'ace.port.%s.%d' % (tag, i), kit.ROLE_RECESS,
                    (side * (fx_pt - 0.05), yo_pt, z_pt),
                    _PORT_WELL, hull_mat)
