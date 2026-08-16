"""Lamplighter Guild Light — SERVICE SKIFF.

Bible §4.10 light: "An open-looking but pressurized maintenance pod with
tool carousel, floodlights, handrails, and two universal clamp arms."

Construction logic: EXPOSED FRAME, utility (synthesis/20 §5, 21 §G2/§G6).
MORE modules, never bigger ones. Silhouette family: BLOCKY SERVICE
WORKBOAT / OPEN TRUSS. Compact pressurized pod + short open-frame mid +
two clamp arms. Not a cigar drum. Not a tiny copy of the plate's capital
crane / tug. The 10-lamplighter plate escorts are this brief: a compact
yellow-and-soot work pod.

BODY PLAN
    A blocky hull_loft pod with stepped zone walls (sf.fair k=0.32).
    Half-extents are ABSOLUTE work-hull radii (0.30-0.70), never *b or
    *h. The pod is a small work hull; the arms carry the outline. Bow is
    a blunt flood brow. Mid is the fullest pressurized cabin. Stern
    pinches to a 2-nozzle transom. Several sv.truss_bay copies sit at
    ABSOLUTE sf.TRUSS_* size: one proud on the pinched mid/stern waist,
    one proud aft of that waist, one proud on the brow, and three
    dorsal mid copies whose bottom longerons bury into the deck. Two
    universal clamp arms are one sv.gate_fork (default sf.CLAMP_REACH).
    The fork hub buries into the pod so the island probe stays one
    body. One hw.tool_carousel sits on the mid deck, offset starboard
    (the one functional asymmetry). Two yellow sv.utility_module boxes
    (port forward, starboard aft) plus one hw.tool_pod on the port aft
    mid flank. Access language is several sv.access_rail copies and two
    short sv.gantry decks on the mid service band. Cobalt hw.diag_panel
    plates sit on both mid flanks and the mid deck. Floods are
    hw.work_lamp copies pitched at sf.LAMP_SPACING (the brow is too
    short for a side-by-side pair). Stern hw.drive_face carries two
    countable nozzles.

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE,
never *b or *h). At l = 7.8:
    Loft nose at l*-0.380 = -2.964; transom at l*0.455 = +3.549 ->
    loft z-span 6.513. Driver engine glow sits at z = l*0.47 = 3.666;
    the drive loc (housing back-face) is the transom, just forward of
    that glow. Bow/mid seam at l*-0.210 = -1.638; mid/stern seam at
    l*0.220 = +1.716.
    Half-extent 0.36 x 0.30 at the loft nose, 0.70 x 0.54 at mid, 0.40
    x 0.34 at the transom. Visible step-out at the bow/mid wall and
    step-in at the mid/stern waist.

ZONES (no fitting course crosses a seam; detail lives in ONE mid band):
    bow   l*-0.380..l*-0.210   20 % of loft length
    mid   l*-0.210..l* 0.220   52 %
    stern l* 0.220..l* 0.455   28 %
    Bow is the flood brow plus the gate-fork root. Mid holds the
    pressurized pod, the carousel, the yellow modules, the tool pod,
    the rails / gantries, the dorsal truss copies, the diag plates and
    the service-band lamps. Stern is the proud two-bay truss waist and
    the drive face.

OUTLINE-BREAKER (G2): sv.gate_fork, two clamp_arm children, not a
    single wrench. Reach = sf.CLAMP_REACH = 2.40. Floor is 0.15*l =
    1.17 at l = 7.8. Authored reach 2.40 = 30.8 % of l. Do not scale
    CLAMP_*. Do not inflate the 0.32 hub. Fork loc at z = l*-0.226 =
    -1.763 (bow, near the pod wall) so the jaws pass the nose and the
    max span stays in band. Arms start inside the pod and exit the
    flanks; they intersect the loft.

EMISSIVE BUDGET (<= 5 % of hull area):
    Two drive discs, two to four work-lamp irises. No marker runs, no
    edge-lit panels. AUTHORED AIM: emissive ~= 2-4 % of hull area.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  mid dorsal truss + both yellow modules + two rails + floods;
       carousel / rail counts half inside the construct
    1  loft + gate-fork + carousel mass + drive
    0  loft + drive housing

DENSITY (AUTHORED AIM, not measured):
    hull verts 5,000-9,000 (SHIP_SCALE.light.hull band 4,000-25,000)
    max span 7.2-7.8 (band 4.08-9.52, target 6.8)
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
_SEAM_T = 0.10
_MODULE_BURY = 0.16


# ===========================================================================
# STATION LIST
# ===========================================================================

def _light_stations(l, b, h):
    """Blocky pressurized pod the fork and truss clamp onto.

    Half-extents are absolute work-hull radii. z fractions of l.
    y_offset stays near 0 so the pod is a straight service cabin, not a
    faired leaf. b and h are the class envelope; the pod does not use
    them.
    """
    _ = (b, h)
    return [
        # -- BOW: blunt flood brow (not a needle, not a drum) ------------
        sf.fair(l * -0.380, 0.36, 0.30, 0.06),  # loft nose
        sf.fair(l * -0.320, 0.46, 0.36, 0.05),
        sf.fair(l * -0.211, 0.50, 0.40, 0.04),  # pre-seam
        sf.fair(l * -0.210, 0.66, 0.52, 0.00),  # bow/mid pod wall

        # -- MID: fullest pressurized cabin ------------------------------
        sf.fair(l * -0.010, 0.70, 0.54, 0.00),
        sf.fair(l *  0.219, 0.66, 0.50, 0.00),
        sf.fair(l *  0.220, 0.52, 0.42, 0.02),  # mid/stern waist

        # -- STERN: calm run to the transom / drive plane ----------------
        sf.fair(l *  0.350, 0.46, 0.38, 0.02),
        sf.fair(l *  0.455, 0.40, 0.34, 0.02),  # transom
    ]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Lamplighter service skiff (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.8, 3.276, 1.872).
    detail   -- 3 full  2 halved repeats  1 loft+fork+carousel+drive
                0 loft + drive housing.
    """
    H = kit.ROLE_HULL

    stations = _light_stations(l, b, h)

    z_nose = l * -0.380      # = -2.964  loft nose
    z_bow = l * -0.210       # = -1.638  bow / mid seam
    z_mid = l * 0.220        # =  1.716  mid / stern seam
    z_trans = l * 0.455      # =  3.549  transom / drive loc
    z_fork = l * -0.226      # = -1.763  fork hub (bow, near pod wall)

    # ── Primary pod (always, detail 0+) ─────────────────────────────────
    kit.hull_loft(parts, 'light.pod', H, stations, hull_mat)

    # ── DRIVE FACE at the transom (always; 2 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern pod. Driver glow sits at z = l*0.47.
    d_hw, d_hh, d_yo, _ch = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), d_hw, d_hh,
                  nozzles=2, depth=0.40, detail=detail)

    if detail < 1:
        return

    # ── GATE FORK (detail 1+): two clamp arms, bible 4.10 / §G2 ─────────
    # kit.box hub inside gate_fork is FULL 0.32. Bury the hub in the pod
    # so the arms intersect the loft; do not inflate it.
    _hw_f, _hh_f, yo_f, _ch_f = sf.section(stations, z_fork)
    sv.gate_fork(parts, 'light.fork', hull_mat,
                 (0.0, yo_f, z_fork),
                 facing='nose', reach=sf.CLAMP_REACH,
                 plane='lr', detail=detail)

    # ── TOOL CAROUSEL (detail 1+): starboard mid deck (asymmetry) ───────
    # kit.cyl hub radius 0.22 / height 0.28. Bury the hub into the deck.
    z_car = l * 0.040
    x_car = 0.26
    y_deck = sf.top_y(stations, z_car, x_car)
    # Hub height 0.28; centre on the deck so the lower half buries.
    hw.tool_carousel(parts, 'light.carousel', hull_mat,
                     (x_car, y_deck, z_car), count=4, detail=detail)

    if detail < 2:
        return

    # ── OPEN-FRAME WAIST (detail 2+): proud truss at the mid/stern step ─
    # kit.strut members use sf.TRUSS_MEMBER radius. Chord 1.10 sits proud
    # of the pinched 0.52 x 0.42 waist.
    _hw_t, _hh_t, yo_t, _ch_t = sf.section(stations, z_mid)
    sv.truss_bay(parts, 'light.truss.stern', hull_mat,
                 (0.0, yo_t, z_mid), detail=detail)

    # Dorsal mid copies. Bottom longerons bury _MODULE_BURY into the deck
    # so the island probe stays one body. Same TRUSS_* size, never scaled.
    _truss_hh = sf.TRUSS_CHORD * 0.42
    z_tr_mid = l * -0.020
    y_tr_mid = sf.top_y(stations, z_tr_mid, 0.0) + _truss_hh - _MODULE_BURY
    sv.truss_bay(parts, 'light.truss.mid', hull_mat,
                 (0.0, y_tr_mid, z_tr_mid), detail=detail)

    if detail >= 3:
        # Forward of the pod wall so chord 1.10 stands proud of the brow.
        z_tb = z_bow - 0.08
        _hw_b, _hh_b, yo_b, _ch_b = sf.section(stations, z_tb)
        sv.truss_bay(parts, 'light.truss.bow', hull_mat,
                     (0.0, yo_b, z_tb), detail=detail)
        # Second proud waist bay, still inside the loft transom.
        z_ta = z_mid + 0.88
        _hw_a, _hh_a, yo_a, _ch_a = sf.section(stations, z_ta)
        sv.truss_bay(parts, 'light.truss.stern.aft', hull_mat,
                     (0.0, yo_a, z_ta), detail=detail)
        for tag, z_tr in (('mid.fwd', l * -0.140), ('mid.aft', l * 0.110)):
            y_tr = sf.top_y(stations, z_tr, 0.0) + _truss_hh - _MODULE_BURY
            sv.truss_bay(parts, 'light.truss.%s' % tag, hull_mat,
                         (0.0, y_tr, z_tr), detail=detail)

    # ── SEAM COLLARS (detail 2+): kit.chamfer_block FULL extents ────────
    for tag, z_s in (('bow', z_bow), ('stern', z_mid)):
        rw, rh, ryo, rch = sf.seam_ring(stations, z_s, over=0.05)
        kit.chamfer_block(parts, 'light.seam.%s' % tag, H,
                          (0.0, ryo, z_s),
                          (rw * 2.0, rh * 2.0, _SEAM_T),
                          hull_mat, chamfer=rch)

    # ── YELLOW ACCESS MODULES (detail 2+): FULL sf.UTILITY_BOX, staggered
    um_half = sf.UTILITY_BOX[0] * 0.50
    y_um = 0.06
    for tag, side, z_um in (
            ('port', -1.0, l * -0.020),
            ('stbd', 1.0, l * 0.095),
    ):
        fx_um = sf.flank_x(stations, z_um, y_um)
        x_um = side * (fx_um - (um_half - _MODULE_BURY))
        sv.utility_module(parts, 'light.module.%s' % tag, hull_mat,
                          (x_um, y_um, z_um), detail=detail)

    # ── ACCESS RAILS (detail 2+): kit.box rails, mid service band ───────
    for tag, x_rail, z_rail in (
            ('port', -0.22, l * 0.130),
            ('stbd', 0.22, l * -0.080),
    ):
        y_base = sf.top_y(stations, z_rail, x_rail) - 0.10
        sv.access_rail(parts, 'light.rail.%s' % tag, hull_mat,
                       (x_rail, y_base, z_rail),
                       length=1.40, axis='z', detail=detail)

    # ── FLOODS (detail 2+): pitch sf.LAMP_SPACING; brow is too short for
    # a side-by-side pair. One nose flood, one mid work lamp.
    # kit.box housing is FULL sf.LAMP_HOUSING.
    z_flood = z_nose + 0.22
    y_flood = sf.top_y(stations, z_flood, 0.0) - 0.05
    hw.work_lamp(parts, glow, 'light.flood.nose', hull_mat, glow_mat,
                 (0.0, y_flood, z_flood), facing='nose', detail=detail)
    z_mid_lp = z_flood + sf.LAMP_SPACING
    y_mid_lp = sf.straight_top(stations, z_mid_lp) - 0.08
    fx_lp = sf.flank_x(stations, z_mid_lp, y_mid_lp)
    hw.work_lamp(parts, glow, 'light.flood.mid', hull_mat, glow_mat,
                 (fx_lp - 0.02, y_mid_lp, z_mid_lp),
                 facing='down', detail=detail)

    if detail < 3:
        return

    # ── SERVICE LAMPS (detail 3): two more, still at sf.LAMP_SPACING ────
    for i in (1, 2):
        z_lp = z_flood + sf.LAMP_SPACING * (i + 1)
        y_lp = sf.straight_top(stations, z_lp) - 0.08
        fx = sf.flank_x(stations, z_lp, y_lp)
        hw.work_lamp(parts, glow, 'light.lamp.%d' % i, hull_mat, glow_mat,
                     (fx - 0.02, y_lp, z_lp), facing='down', detail=detail)

    # ── GANTRY SNIPPETS (detail 3): kit.box deck FULL sf.GANTRY_WIDTH ───
    for tag, x_gan, z_gan in (
            ('stbd', 0.16, l * 0.155),
            ('port', -0.16, l * -0.090),
    ):
        y_gan = sf.top_y(stations, z_gan, x_gan) - 0.03
        sv.gantry(parts, 'light.gantry.%s' % tag, hull_mat,
                  (x_gan, y_gan, z_gan),
                  length=sf.GANTRY_PITCH, detail=detail)

    # Cross-deck rail. Posts bury 0.10 into the mid deck.
    z_rx = l * 0.020
    y_rx = sf.top_y(stations, z_rx, 0.0) - 0.10
    sv.access_rail(parts, 'light.rail.cross', hull_mat,
                   (0.0, y_rx, z_rx),
                   length=1.20, axis='x', detail=detail)

    # ── TOOL POD (detail 3): FULL sf.TOOL_POD, port aft mid flank ───────
    z_pod = l * 0.170
    y_pod = 0.04
    fx_pod = sf.flank_x(stations, z_pod, y_pod)
    pod_hx = sf.TOOL_POD[0] * 0.50
    x_pod = -(fx_pod - 0.12 + pod_hx)
    hw.tool_pod(parts, 'light.pod.port', hull_mat,
                (x_pod, y_pod, z_pod), detail=detail)

    # ── DIAG PANELS (detail 3): FULL sf.DIAG_PANEL, buried 0.03 ─────────
    z_dp = l * 0.060
    y_dp = 0.18
    fx_dp = sf.flank_x(stations, z_dp, y_dp)
    hw.diag_panel(parts, 'light.diag.stbd', hull_mat,
                  (fx_dp - 0.03, y_dp, z_dp),
                  facing='starboard', detail=detail)
    z_dp2 = l * -0.080
    y_dp2 = 0.14
    fx_dp2 = sf.flank_x(stations, z_dp2, y_dp2)
    hw.diag_panel(parts, 'light.diag.port', hull_mat,
                  (-fx_dp2 + 0.03, y_dp2, z_dp2),
                  facing='port', detail=detail)
    z_dp3 = l * 0.185
    x_dp3 = -0.18
    y_dp3 = sf.top_y(stations, z_dp3, x_dp3) - 0.03
    hw.diag_panel(parts, 'light.diag.deck', hull_mat,
                  (x_dp3, y_dp3, z_dp3),
                  facing='up', detail=detail)

    # ── CABLE RUN (detail 3): kit.cyl radius sf.CABLE_HOSE_R ────────────
    z_cab = l * 0.050
    y_cab = 0.16
    fx_cab = sf.flank_x(stations, z_cab, y_cab)
    sv.cable_run(parts, 'light.cable', hull_mat,
                 (fx_cab - 0.02, y_cab, z_cab),
                 length=1.60, axis='z', detail=detail)
