"""Lamplighter Ace — OUTAGE RUNNER.

Bible §4.10 ace: "A stripped emergency-response craft with oversized
maneuvering clusters, a compact relay mast, hot-swappable tool pods,
and high-visibility lamp bars."

The 10-lamplighter-guild-ship.png plate is CONCEPT ART, not a model.
This class is the FAST escort in that frame: slimmer, stripped, lamp-bar
identity — not the capital crane ship. Construction logic: EXPOSED
FRAME, utility (synthesis/20 §5, 21 §G2/§G6). MORE pods, never bigger
ones. Soot-dark frame, utility-yellow gantry, cobalt mast, warm lamps.
No racing shell, no brass, no gunship, no giant wrench.

BODY PLAN
    A slim dart loft (kit.hull_loft) with absolute half-extents
    0.16-0.28, narrower than the light service pod. Half-extents are
    ABSOLUTE, never *b or *h. A compact sv.gate_fork sits in the bow
    and intersects the hull. Mid is a stripped frame: dorsal and ventral
    longerons, two gantry + rail service snippets, cable runs, a
    hw.tool_pod set (paired plus one extra port pod), cobalt
    hw.diag_panel plates, and a compact hw.relay_mast. Stern is a
    2-nozzle hw.drive_face plus oversized maneuver clusters (housings
    and one short bell each, not extra nozzles) at the frame corners.
    Two short hw.lamp_bar runs sit 1.20 apart. Rails stay on the dart.

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE
slim-dart radii, never *b or *h). At l = 7.2:
    Loft nose at l*-0.505 = -3.636; transom at l*0.470 = +3.384 ->
    loft z-span 7.020. Driver engine glow sits at z = l*0.47 = 3.384;
    drive loc is the transom, housing face 0.12 aft of that plane.
    Bow/mid seam at l*-0.310 = -2.232; mid/stern seam at l*0.197
    = +1.418. Tube half-extent 0.16 at the loft nose, 0.28 at mid,
    0.20 at the transom.

ZONES (no plate or bay crosses a seam; detail lives in ONE mid band):
    bow   l*-0.505..l*-0.310   20 % of loft length
    mid   l*-0.310..l* 0.197   52 %
    stern l* 0.197..l* 0.470   28 %
    Bow is the lamp bar and the compact fork. Mid holds the stripped
    frame, the tool-pod set, the mast, the second lamp bar, the diag
    plates, and the service band. Stern is the drive face and the
    maneuver-cluster housings.

OUTLINE-BREAKER (G2): compact sv.gate_fork, plane='lr', facing nose.
    Reach = 1.20 (compact). Floor is 0.15*l = 1.08 at l = 7.2.
    Default sf.CLAMP_REACH = 2.40 is legal; at this bow station it
    would put the jaw tip near z = -5.0 and max span near 8.6, long
    of the light (~7.6-7.8). Authored reach 1.20 = 16.7 % of l.
    Grow with reach=, never hub size. Hub stays the construct 0.32.
    Arms INTERSECT the hull: hub centre at z = l*-0.360 sits in the
    bow dart (half-w 0.24); clamp joints 0.22 overlap the loft.
    Jaw tip at z ≈ -3.71; drive face at l*0.470 + 0.12 ≈ 3.50;
    authored max span ≈ 7.2-7.6.

EMISSIVE BUDGET (<= 5 % of hull area):
    Two drive discs and the lamp-bar irises (two short bars, two
    housings each at sf.LAMP_SPACING). No marker runs, no edge-lit
    panels. AUTHORED AIM: emissive ~= 2-3 % of hull area.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: loft, fork, mast, drive, both lamp bars, both longeron
       pairs, two gantries, rails, cable, seven pods, four cluster
       housings, mid frame, diag panels
    2  half: lamp bar halves; aft pods dropped; two dorsal clusters;
       one gantry; longerons + rails + fork + mast + drive kept
    1  loft + mast + fork + drive
    0  loft + drive

DENSITY (AUTHORED AIM, not measured):
    hull verts 5,000-9,000 (SHIP_SCALE.ace.hull band 4,000-21,000)
    max span 7.2-7.6 (band [4.32, 10.08], target 7.2)
    stay within 15 % of light (~7.6-7.8) so the ace may sit slightly
    SHORTER than the light (congregation: light 7.7, ace 7.6)
    len/beam >= 1.15; ht/len <= 0.60; beam/len >= 0.16
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import service as sv
from . import hardware as hw


# Absolute module sizes. Never multiply by l, b or h.
_FORK_REACH = 1.20
_MAST_H = 0.80
_CLUSTER = (0.38, 0.30, 0.36)
_CLUSTER_HOUSE = (0.46, 0.36, 0.44)
_CLUSTER_SHOE = (0.32, 0.22, 0.42)
_DRIVE_HW = 0.22
_DRIVE_HH = 0.18
_DRIVE_DEP = 0.46
_SEAM = 0.10
_BELL_R = 0.08
_BELL_D = 0.14
_BURY = 0.12


# ===========================================================================
# STATION LIST
# ===========================================================================

def _ace_stations(l, b, h):
    """Slim dart loft the fork, mast and clusters clamp onto.

    Half-extents are absolute slim-dart radii (0.16-0.28), narrower
    than the light's service pod. z fractions of l. y_offset stays 0.0
    so the body is a straight runner spine, not a faired leaf.
    b and h name the class envelope; the dart does not use them.
    """
    _ = (b, h)
    return [
        # -- BOW: narrow attach for the lamp bar and compact fork --------
        sf.fair(l * -0.505, 0.16, 0.14, 0.0),  # loft nose
        sf.fair(l * -0.450, 0.20, 0.18, 0.0),
        sf.fair(l * -0.380, 0.24, 0.20, 0.0),
        sf.fair(l * -0.310, 0.26, 0.22, 0.0),  # bow/mid seam

        # -- MID: constant slim frame run --------------------------------
        sf.fair(l * -0.180, 0.28, 0.24, 0.0),
        sf.fair(l *  0.000, 0.28, 0.24, 0.0),
        sf.fair(l *  0.100, 0.26, 0.22, 0.0),
        sf.fair(l *  0.197, 0.24, 0.20, 0.0),  # mid/stern seam

        # -- STERN: taper to the transom / drive plane -------------------
        sf.fair(l *  0.320, 0.24, 0.20, 0.0),
        sf.fair(l *  0.410, 0.22, 0.18, 0.0),
        sf.fair(l *  0.470, 0.20, 0.16, 0.0),  # transom
    ]


def _longeron(parts, tag, stations, z0, z1, hull_mat, side, face):
    """One loft-following longeron. face is 'top' or 'bot'."""
    r = max(sf.TRUSS_MEMBER, 0.055)
    x0 = side * (sf.flat_half(stations, z0) - 0.04)
    x1 = side * (sf.flat_half(stations, z1) - 0.04)
    if face == 'bot':
        y0 = sf.bottom_y(stations, z0, abs(x0)) + 0.06
        y1 = sf.bottom_y(stations, z1, abs(x1)) + 0.06
    else:
        y0 = sf.top_y(stations, z0, abs(x0)) - 0.06
        y1 = sf.top_y(stations, z1, abs(x1)) - 0.06
    kit.strut(parts, 'ace.longeron.' + tag, kit.ROLE_HULL,
              (x0, y0, z0), (x1, y1, z1),
              hull_mat, r, vertices=6)


def _maneuver_cluster(parts, tag, loc, dx, hull_mat, detail):
    """Oversized cluster: housings + one short bell. No extra nozzles.

    loc is the core centre. A shoe buries inboard into the dart so the
    island probe keeps one body. One torus collar is a housing lip, not
    a second throat.
    """
    H = kit.ROLE_HULL
    hx, hy, hz = _CLUSTER
    kit.chamfer_block(parts, 'ace.cluster.' + tag + '.house', H,
                      loc, _CLUSTER_HOUSE, hull_mat, chamfer=0.06)
    kit.box(parts, 'ace.cluster.' + tag, H, loc, _CLUSTER, hull_mat)
    shoe = (loc[0] - dx * 0.10, loc[1], loc[2])
    kit.box(parts, 'ace.cluster.' + tag + '.shoe', H,
            shoe, _CLUSTER_SHOE, hull_mat)
    kit.cyl(parts, 'ace.cluster.' + tag + '.collar', kit.ROLE_TRIM,
            (loc[0] + dx * (hx * 0.28), loc[1], loc[2]),
            _BELL_R + 0.045, 0.10, hull_mat,
            rotation=sf.CYL_ALONG_X, vertices=10)
    kit.torus(parts, 'ace.cluster.' + tag + '.lip', kit.ROLE_TRIM,
              (loc[0] + dx * (hx * 0.42), loc[1], loc[2]),
              _BELL_R + 0.02, sf.LIP_MINOR, hull_mat,
              rotation=sf.CYL_ALONG_X)
    # Short outboard bell — a thruster block, not a gun barrel.
    bloc = (loc[0] + dx * (hx * 0.5 - 0.02), loc[1], loc[2])
    kit.cyl(parts, 'ace.cluster.' + tag + '.bell', kit.ROLE_RECESS,
            bloc, _BELL_R, _BELL_D, hull_mat,
            rotation=sf.CYL_ALONG_X, vertices=8)
    inner = (loc[0] - dx * (hx * 0.5 + 0.08), loc[1], loc[2])
    kit.strut(parts, 'ace.cluster.' + tag + '.brace', H,
              inner, loc, hull_mat, max(sf.TRUSS_MEMBER, 0.055),
              vertices=6)
    if detail >= 3:
        hw.diag_panel(parts, 'ace.cluster.' + tag + '.diag', hull_mat,
                      (loc[0], loc[1] + hy * 0.42, loc[2]),
                      facing='up', detail=detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Lamplighter Guild outage runner (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.2, 2.88, 1.44).
    detail   -- 3 full  2 half repeats  1 loft+mast+fork+drive
                0 loft + drive.
    """
    _ = (b, h)
    H = kit.ROLE_HULL
    stations = _ace_stations(l, b, h)

    z_bow_s = l * -0.310     # = -2.232  bow / mid seam
    z_mid_s = l * 0.197      # =  1.418  mid / stern seam
    z_trans = l * 0.470      # =  3.384  transom / drive loc
    z_fork = l * -0.360
    z_mast = l * 0.080
    z_bar = l * -0.410
    z_bar2 = l * 0.000

    # ── Slim dart loft (always, detail 0+) ──────────────────────────────
    kit.hull_loft(parts, 'ace.dart', H, stations, hull_mat)

    # ── DRIVE FACE at the transom (always; 2 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern dart. Driver glow sits at z = l*0.47.
    yo_stern = sf.section(stations, z_trans)[2]
    hw.drive_face(parts, glow, 'ace.drive', hull_mat, glow_mat,
                  (0.0, yo_stern, z_trans), _DRIVE_HW, _DRIVE_HH,
                  nozzles=2, depth=_DRIVE_DEP, detail=detail)

    if detail < 1:
        return

    # ── COMPACT RELAY MAST (detail 1+): base buried in the mid deck ─────
    y_mast = sf.top_y(stations, z_mast, 0.0) - 0.10
    hw.relay_mast(parts, 'ace.mast', hull_mat,
                  (0.0, y_mast, z_mast), height=_MAST_H, detail=detail)

    # ── COMPACT GATE FORK (detail 1+): G2, arms intersect the bow ───────
    # loc is the small shoulder root. Reach grows the outline, not the hub.
    yo_fork = sf.section(stations, z_fork)[2]
    sv.gate_fork(parts, 'ace.fork', hull_mat, (0.0, yo_fork, z_fork),
                 facing='nose', reach=_FORK_REACH, plane='lr',
                 detail=detail)

    if detail < 2:
        return

    # ── ZONE SEAM COLLARS (detail 2+): visible bow/mid and mid/stern ────
    for tag, z_seam in (('bow', z_bow_s), ('stern', z_mid_s)):
        hw_s, hh_s, yo_s, _ch = sf.seam_ring(stations, z_seam, over=0.05)
        kit.box(parts, 'ace.seam.' + tag, H,
                (0.0, yo_s, z_seam),
                (hw_s * 2.0, hh_s * 2.0, _SEAM), hull_mat)

    # ── HIGH-VIS LAMP BARS (detail 2+): two short runs at LAMP_SPACING ──
    # Bow bar on the brow. Mid bar on the keel so the mast stays clear.
    # Centres are 2.95 apart; each 2-lamp run spans 1.20. Closest lamps
    # sit 1.75 apart (>= sf.LAMP_SPACING).
    y_bar = sf.top_y(stations, z_bar, 0.0) - 0.04
    hw.lamp_bar(parts, glow, 'ace.lamps.bow', hull_mat, glow_mat,
                (0.0, y_bar, z_bar), count=2, axis='z',
                facing='down', detail=detail)
    y_bar2 = sf.bottom_y(stations, z_bar2, 0.0) + 0.04
    hw.lamp_bar(parts, glow, 'ace.lamps.keel', hull_mat, glow_mat,
                (0.0, y_bar2, z_bar2), count=2, axis='z',
                facing='down', detail=detail)

    # ── STRIPPED FRAME (detail 2+): dorsal + ventral longerons ──────────
    # Ends sample the loft so the run stays on the tapering dart.
    z_long0 = z_bow_s + 0.12
    z_long1 = z_mid_s - 0.12
    for side, stag in ((-1.0, 'port'), (1.0, 'stbd')):
        _longeron(parts, stag + '.top', stations, z_long0, z_long1,
                  hull_mat, side, 'top')
        _longeron(parts, stag + '.bot', stations, z_long0, z_long1,
                  hull_mat, side, 'bot')

    # ── SERVICE BAND (detail 2+): gantry + rails; second gantry at 3 ────
    # Gantry deck is 0.07 thick; centre sits 0.065 below the loft so the
    # deck buries 0.10. Rail loc is the post base, buried the same way.
    z_band = l * -0.180
    yo_band = sf.section(stations, z_band)[2]
    y_top = sf.top_y(stations, z_band, 0.0)
    y_gantry = y_top - 0.065
    y_rail = y_top - 0.10
    sv.gantry(parts, 'ace.gantry.fwd', hull_mat,
              (0.0, y_gantry, z_band), length=sf.GANTRY_PITCH, detail=detail)
    fx_rail = sf.flank_x(stations, z_band, yo_band)
    sv.access_rail(parts, 'ace.rail.stbd.fwd', hull_mat,
                   (fx_rail - 0.06, y_rail, z_band),
                   length=1.40, axis='z', detail=detail)
    sv.access_rail(parts, 'ace.rail.port.fwd', hull_mat,
                   (-fx_rail + 0.06, y_rail, z_band),
                   length=1.40, axis='z', detail=detail)
    sv.cable_run(parts, 'ace.cable.fwd', hull_mat,
                 (fx_rail - 0.04, yo_band + 0.04, z_band),
                 length=1.60, axis='z', detail=detail)

    # ── HOT-SWAP TOOL PODS (detail 2+): pairs; extra port at detail 3 ───
    # One extra port pod is the one functional asymmetry.
    pod_locs = (
        ('port.fwd', -1.0, l * -0.200),
        ('stbd.fwd',  1.0, l * -0.200),
        ('port.mid', -1.0, l * -0.080),
        ('stbd.mid',  1.0, l * -0.080),
    )
    if detail >= 3:
        pod_locs = pod_locs + (
            ('port.aft', -1.0, l * 0.050),
            ('stbd.aft',  1.0, l * 0.050),
            ('port.xtra', -1.0, l * 0.140),
        )
    half_pod_x = sf.TOOL_POD[0] * 0.5
    for tag, side, z_pod in pod_locs:
        yo_p = sf.section(stations, z_pod)[2]
        fx_p = sf.flank_x(stations, z_pod, yo_p)
        # Inner face buries 0.12 into the loft.
        px = side * (fx_p - _BURY + half_pod_x)
        hw.tool_pod(parts, 'ace.pod.' + tag, hull_mat,
                    (px, yo_p, z_pod), detail=detail)

    # ── OVERSIZED MANEUVER CLUSTERS (detail 2+: dorsal; 3: all four) ────
    z_clu = l * 0.360
    yo_c = sf.section(stations, z_clu)[2]
    fx_c = sf.flank_x(stations, z_clu, yo_c)
    ty_c = sf.top_y(stations, z_clu, 0.0)
    by_c = sf.bottom_y(stations, z_clu, 0.0)
    hx, hy, _hz = _CLUSTER
    cx = fx_c - _BURY + hx * 0.5
    cy_top = ty_c - _BURY + hy * 0.5
    cy_bot = by_c + _BURY - hy * 0.5
    clusters = (
        ('port.top', -1.0, cy_top, -1.0),
        ('stbd.top',  1.0, cy_top,  1.0),
    )
    if detail >= 3:
        clusters = clusters + (
            ('port.bot', -1.0, cy_bot, -1.0),
            ('stbd.bot',  1.0, cy_bot,  1.0),
        )
    for tag, side, cy, dx in clusters:
        cloc = (side * cx, cy, z_clu)
        _maneuver_cluster(parts, tag, cloc, dx, hull_mat, detail)

    # Top yoke ties the dorsal housings through the dart.
    kit.box(parts, 'ace.cluster.yoke.top', H,
            (0.0, cy_top, z_clu),
            (cx * 2.0, 0.12, 0.22), hull_mat)

    if detail < 3:
        return

    kit.box(parts, 'ace.cluster.yoke.bot', H,
            (0.0, cy_bot, z_clu),
            (cx * 2.0, 0.12, 0.22), hull_mat)

    # ── AFT SERVICE SNIPPET (detail 3): second gantry + rails ───────────
    z_band2 = l * 0.050
    if z_bow_s < z_band2 < z_mid_s:
        yo_b2 = sf.section(stations, z_band2)[2]
        y_top2 = sf.top_y(stations, z_band2, 0.0)
        sv.gantry(parts, 'ace.gantry.aft', hull_mat,
                  (0.0, y_top2 - 0.065, z_band2),
                  length=sf.GANTRY_PITCH, detail=detail)
        fx_r2 = sf.flank_x(stations, z_band2, yo_b2)
        sv.access_rail(parts, 'ace.rail.stbd.aft', hull_mat,
                       (fx_r2 - 0.06, y_top2 - 0.10, z_band2),
                       length=1.40, axis='z', detail=detail)
        sv.access_rail(parts, 'ace.rail.port.aft', hull_mat,
                       (-fx_r2 + 0.06, y_top2 - 0.10, z_band2),
                       length=1.40, axis='z', detail=detail)
        y_keel2 = sf.bottom_y(stations, z_band2, 0.0)
        sv.access_rail(parts, 'ace.rail.keel', hull_mat,
                       (0.0, y_keel2 - 0.02, z_band2),
                       length=1.40, axis='z', detail=detail)
        sv.cable_run(parts, 'ace.cable.aft', hull_mat,
                     (-fx_r2 + 0.04, yo_b2 - 0.04, z_band2),
                     length=1.60, axis='z', detail=detail)
        sv.cable_run(parts, 'ace.cable.keel', hull_mat,
                     (0.0, y_keel2 + 0.05, z_band2),
                     length=1.80, axis='z', detail=detail)

    # ── MID CROSS TIES + DIAGONALS (detail 3): frame on the dart ────────
    r_long = max(sf.TRUSS_MEMBER, 0.055)
    z_tie = (l * -0.240, l * -0.140, l * -0.040, l * 0.060, l * 0.140)
    for i, z_t in enumerate(z_tie):
        if z_t <= z_bow_s or z_t >= z_mid_s:
            continue
        xt = sf.flat_half(stations, z_t) - 0.04
        yt = sf.top_y(stations, z_t, xt) - 0.06
        yb = sf.bottom_y(stations, z_t, xt) + 0.06
        kit.strut(parts, 'ace.tie.top.%d' % i, H,
                  (-xt, yt, z_t), (xt, yt, z_t),
                  hull_mat, r_long, vertices=6)
        kit.strut(parts, 'ace.tie.bot.%d' % i, H,
                  (-xt, yb, z_t), (xt, yb, z_t),
                  hull_mat, r_long, vertices=6)
        # Flank posts pierce the loft from deck to keel.
        kit.strut(parts, 'ace.post.port.%d' % i, H,
                  (-xt, yt, z_t), (-xt, yb, z_t),
                  hull_mat, r_long, vertices=6)
        kit.strut(parts, 'ace.post.stbd.%d' % i, H,
                  (xt, yt, z_t), (xt, yb, z_t),
                  hull_mat, r_long, vertices=6)

    # Deck diagonals between adjacent ties.
    for i in range(len(z_tie) - 1):
        z_a = z_tie[i]
        z_b = z_tie[i + 1]
        xa = sf.flat_half(stations, z_a) - 0.04
        xb = sf.flat_half(stations, z_b) - 0.04
        ya = sf.top_y(stations, z_a, xa) - 0.06
        yb = sf.top_y(stations, z_b, xb) - 0.06
        kit.strut(parts, 'ace.diag.deck.%d.a' % i, H,
                  (-xa, ya, z_a), (xb, yb, z_b),
                  hull_mat, r_long, vertices=6)
        kit.strut(parts, 'ace.diag.deck.%d.b' % i, H,
                  (xa, ya, z_a), (-xb, yb, z_b),
                  hull_mat, r_long, vertices=6)

    # ── DIAG PANELS (detail 3): cobalt plates on the mid flanks ─────────
    panel_zs = (l * -0.220, l * -0.060, l * 0.100)
    for i, z_d in enumerate(panel_zs):
        if z_d <= z_bow_s or z_d >= z_mid_s:
            continue
        y_d = sf.section(stations, z_d)[2]
        fx_d = sf.flank_x(stations, z_d, y_d)
        if fx_d <= 0.08:
            continue
        hw.diag_panel(parts, 'ace.diag.port.%d' % i, hull_mat,
                      (-fx_d + 0.02, y_d, z_d), facing='port',
                      detail=detail)
        hw.diag_panel(parts, 'ace.diag.stbd.%d' % i, hull_mat,
                      (fx_d - 0.02, y_d, z_d), facing='starboard',
                      detail=detail)
