"""Congregation Light — PILGRIM COURIER.

Bible §4.9 light: "A small forward-looking craft centered on one
observation blister, with a silver rib cage, compact archive box, and
two folded emergency sails."

Construction logic: REPEATED MODULE, ritual (synthesis/20 §5, 21 §G2/§G6).
One part, many copies. Silhouette family: CIGAR / ribbed drum. The
outline-breaker is two rigid folded sail vanes (thickness >= 0.08), not
a cluster and not cloth. Midnight hull, weathered silver ribs,
candle-amber glow. No churches, crosses, gold, Assembly fans, lace, or
grown flesh. The 09-congregation plate escorts are this brief: a short
forward nave, a ribbed drum, two emergency vanes.

BODY PLAN
    A buried drum loft (kit.hull_loft) with three rt.drum_bay copies
    (bow / mid / stern), each bay kept inside its own zone. Half-extents
    are ABSOLUTE drum radii (0.28-0.42), never *b or *h. One
    hw.observation_nave at the bow (radius 0.38, length 0.90) bites the
    loft by 0.25. A silver rib cage of five rt.rib_ring copies sits at
    the local drum radius in the mid band (construct already buries).
    One hw.archive_box rides a mid port flank pad that intersects the
    crate. TWO rt.folded_sail copies: one dorsal, one slightly offset
    starboard-dorsal (the one functional asymmetry). A tiny
    hw.candle_lamp pair marks the forward mid deck. Stern hw.drive_face
    carries two countable nozzles. Ventral hw.receiving_lock (fleet
    collar, facing down) buries >= 0.12; a courier skips the larger
    docking_collar so beam stays on the lock and the archive.

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE
drum radii, never *b or *h). At l = 7.8:
    Loft nose at l*-0.430 = -3.354; transom at l*0.455 = +3.549 ->
    loft z-span 6.903. Driver engine glow sits at z = l*0.47 = 3.666;
    the drive loc (housing back-face) is the transom, just forward of
    that glow. Nave centre at l*-0.456 = -3.554; nave tip at -4.004;
    nave aft face at -3.104, so the blister intersects the loft by
    0.250 (>= 0.12). Bow/mid seam at l*-0.253 = -1.973; mid/stern
    seam at l*0.225 = +1.755.
    Tube half-extent 0.28 at the loft nose, 0.42 at mid, 0.32 at the
    transom. Each drum_bay takes the local host radius so the bay
    matches the drum.

ZONES (no plate or bay crosses a seam; detail lives in ONE mid band):
    bow   l*-0.430..l*-0.253   20 % of loft length
    mid   l*-0.253..l* 0.225   54 %
    stern l* 0.225..l* 0.455   26 %
    Bow is the nave plus one short drum_bay. Mid holds the long bay,
    the rib cage, both sails, the archive pad, the lamp pair and the
    ventral lock. Stern is the third bay and the drive face.

OUTLINE-BREAKER (G2): two rt.folded_sail vanes, not a sail_cluster.
    Reach = sf.SAIL_SPAN - sf.SAIL_BURY = 1.85 - 0.14 = 1.71.
    Floor is 0.15*l = 1.17 at l = 7.8. Authored reach 1.71 = 21.9 %
    of l. Do not scale SAIL_*. Roots bury into the deck by SAIL_BURY.
    Port and starboard petals open off the dorsal. They do not share light.

EMISSIVE BUDGET (<= 5 % of hull area):
    Nave interior glow, two drive discs, two candle irises, one lock
    slit. No marker runs, no edge-lit panels. AUTHORED AIM: emissive
    ~= 2-4 % of hull area.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; rib-cage count halves (5 -> 3)
    1  loft + three bays + nave + both sails + drive + archive + lock
    0  loft + nave core + drive housing

DENSITY (AUTHORED AIM, not measured):
    hull verts 6,000-18,000 (SHIP_SCALE.light.hull band 4,000-25,000)
    max span 7.2-7.8 (band 4.08-9.52, target 6.8)
    len/beam >= 1.15; ht/len <= 0.60; beam/len >= 0.16
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import ritual as rt
from . import hardware as hw


# Absolute module sizes. Never multiply by l, b or h.
_NAVE_R = 0.38
_NAVE_LEN = 0.90
_NAVE_OVER = 0.25
_BAY_BOW_R = 0.36
_BAY_MID_R = 0.42
_BAY_STERN_R = 0.34
_PAD_SZ = (0.16, 0.50, 0.64)
_PAD_LAP = 0.12
_LOCK_PAD = (0.70, 0.16, 0.70)


# ===========================================================================
# STATION LIST
# ===========================================================================

def _light_stations(l, b, h):
    """Buried cigar drum the bays and nave clamp onto.

    Half-extents are absolute drum radii. z fractions of l. y_offset
    stays 0.0 so the body is a straight pilgrim spine, not a faired
    leaf. b and h are the class envelope; the drum does not use them.
    """
    _ = (b, h)
    return [
        # -- BOW: narrow attach for the observation blister --------------
        sf.fair(l * -0.430, 0.28, 0.28, 0.0),  # loft nose
        sf.fair(l * -0.380, 0.34, 0.34, 0.0),
        sf.fair(l * -0.253, 0.38, 0.38, 0.0),  # bow/mid seam

        # -- MID: fullest drum, still a courier section ------------------
        sf.fair(l * -0.040, 0.42, 0.42, 0.0),
        sf.fair(l *  0.225, 0.40, 0.40, 0.0),  # mid/stern seam

        # -- STERN: calm run to the transom / drive plane ----------------
        sf.fair(l *  0.360, 0.36, 0.36, 0.0),
        sf.fair(l *  0.455, 0.32, 0.32, 0.0),  # transom
    ]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Congregation pilgrim courier (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.8, 3.276, 1.872).
    detail   -- 3 full  2 halved rib cage  1 loft+bays+nave+sails+
                drive+archive+lock  0 loft + nave core + drive housing.
    """
    H = kit.ROLE_HULL

    stations = _light_stations(l, b, h)

    z_nose = l * -0.430      # = -3.354  loft nose
    z_bow = l * -0.253       # = -1.973  bow / mid seam
    z_mid = l * 0.225        # =  1.755  mid / stern seam
    z_trans = l * 0.455      # =  3.549  transom / drive loc
    z_nave = z_nose - (_NAVE_LEN * 0.5 - _NAVE_OVER)

    # ── Primary drum (always, detail 0+) ────────────────────────────────
    kit.hull_loft(parts, 'light.drum', H, stations, hull_mat)

    # ── NAVE (always): one forward observation blister, bible 4.9 ───────
    hw.observation_nave(parts, glow, 'light.nave', hull_mat, glow_mat,
                        (0.0, 0.0, z_nave),
                        radius=_NAVE_R, length=_NAVE_LEN, detail=detail)

    # ── DRIVE FACE at the transom (always; 2 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern drum. Driver glow sits at z = l*0.47.
    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, 0.0, z_trans), 0.32, 0.28,
                  nozzles=2, depth=0.40, detail=detail)

    if detail < 1:
        return

    # ── DRUM BAYS (detail 1+): one module per zone, no seam cross ───────
    bow_len = 0.96
    bow_cz = z_nose + _NAVE_OVER + 0.08 + bow_len * 0.5
    mid_len = sf.DRUM_BAY_LEN
    mid_cz = (z_bow + z_mid) * 0.5
    stn_len = 1.28
    stn_cz = z_mid + 0.06 + stn_len * 0.5

    rt.drum_bay(parts, 'light.bay.bow', hull_mat,
                (0.0, 0.0, bow_cz), radius=_BAY_BOW_R, length=bow_len,
                detail=detail)
    rt.drum_bay(parts, 'light.bay.mid', hull_mat,
                (0.0, 0.0, mid_cz), radius=_BAY_MID_R, length=mid_len,
                detail=detail)
    rt.drum_bay(parts, 'light.bay.stern', hull_mat,
                (0.0, 0.0, stn_cz), radius=_BAY_STERN_R, length=stn_len,
                detail=detail)

    # ── SOLAR SAILS (detail 1+): two petals, port and starboard ──────────
    # One foil each. Booms open ~50 deg off the dorsal so the sheets
    # do not share light. Roots bury SAIL_BURY into the deck.
    z_sail = l * 0.010
    y_deck = sf.top_y(stations, z_sail, 0.0)
    root_y = y_deck - sf.SAIL_BURY
    rt.folded_sail(parts, 'light.sail.port', hull_mat,
                   (-0.10, root_y, z_sail),
                   facing=(-0.82, 0.57, 0.0), detail=detail)
    rt.folded_sail(parts, 'light.sail.stbd', hull_mat,
                   (0.10, root_y, z_sail),
                   facing=(0.82, 0.57, 0.0), detail=detail)

    # ── ARCHIVE BOX (detail 1+): port mid flank, pad intersects crate ───
    z_arch = l * 0.080
    y_arch = 0.0
    fx = sf.flank_x(stations, z_arch, y_arch)
    # Port flank: inboard is +X. Pad centre is inboard by half-thickness
    # minus lap so the box bites the drum by _PAD_LAP (not a surface kiss).
    pad_x = -fx + (_PAD_LAP - _PAD_SZ[0] * 0.5)
    kit.box(parts, 'light.archive.pad', H,
            (pad_x, y_arch, z_arch), _PAD_SZ, hull_mat)
    arch_x = pad_x - (sf.ARCHIVE[0] * 0.5 - 0.16)
    hw.archive_box(parts, 'light.archive', hull_mat,
                   (arch_x, y_arch, z_arch), detail=detail)

    # ── VENTRAL LOCK (detail 1+): receiving lock, buried >= 0.12 ────────
    z_lock = l * 0.140
    y_keel = sf.bottom_y(stations, z_lock, 0.0)
    kit.box(parts, 'light.lock.pad', H,
            (0.0, y_keel + 0.06, z_lock), _LOCK_PAD, hull_mat)
    hw.receiving_lock(parts, glow, 'light.lock', hull_mat, glow_mat,
                      (0.0, y_keel, z_lock), facing='down', detail=detail)

    if detail < 2:
        return

    # ── SILVER RIB CAGE (detail 2+): mid-band only, local drum radius ───
    rib_frac = (l * -0.220, l * -0.160, l * 0.100, l * 0.155, l * 0.200)
    if detail < 3:
        rib_frac = rib_frac[::2]
    for i, z_rib in enumerate(rib_frac):
        hw_r, _hh, _yo, _ch = sf.section(stations, z_rib)
        rt.rib_ring(parts, 'light.rib.%d' % i, hull_mat,
                    (0.0, 0.0, z_rib), hw_r, detail=detail)

    # ── CANDLE LAMPS (detail 2+): tiny pair, forward mid deck ───────────
    for i, z_lp in enumerate((l * -0.180, l * -0.100)):
        y_lp = sf.top_y(stations, z_lp, 0.0) - 0.04
        hw.candle_lamp(parts, glow, 'light.lamp.%d' % i, hull_mat, glow_mat,
                       (0.0, y_lp, z_lp), facing='up', detail=detail)
