"""Independent Ace — HOT ROD.

Bible §5.1 Ace: "A unique hot rod whose silhouette grows from a
recognizable civilian chassis."

Same FAMILY as the shuttle (spine-and-pods civilian chassis) but a HOT
ROD: leaner loft, longer nose-to-drive stretch, 4-nozzle drive_face,
one offset intake / mission_pod, owner_module as a racing blister (the
owner mark). The bow cabin stays a civilian mass — not a fighter wedge.

BODY PLAN
    A lean commercial loft (kit.hull_loft) with ABSOLUTE half-extents,
    never *b or *h. Bow is a blunt cabin station. Mid pinches into a
    long lean stretch. Stern firms for a 4-nozzle transom. Starboard
    mid carries the one functional asymmetry: a racing blister
    (su.owner_module) plus one offset hw.mission_pod intake. One
    service band on the mid deck. Calm hull elsewhere.

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE).
At l = 7.2:
    Loft nose at l*-0.520 = -3.744; transom at l*0.470 = +3.384 ->
    loft z-span 7.128. Driver engine glow sits at z = l*0.47 = 3.384;
    drive loc is the transom, housing face 0.12 aft of that plane
    (disc z ≈ 3.504). Authored max span ≈ 7.25, slightly long of
    light (~6.8) and well below cutter (~11).

ZONES (no plate or rack crosses a seam; detail lives in ONE mid band):
    bow   l*-0.520..l*-0.280   24 %  civilian cabin
    mid   l*-0.280..l* 0.180   46 %  lean stretch, blister, intake, band
    stern l* 0.180..l* 0.470   30 %  4-nozzle drive

OUTLINE-BREAKER (G2): racing blister su.owner_module, Z >= 0.15*l.
    Floor is 1.08 at l = 7.2. Authored blister length 1.20. Do not
    inflate HUMAN.crateS (0.85). This ace carries 0 crates.

EMISSIVE BUDGET (<= 5 % of hull area):
    Four drive discs, 1-2 cabin/blister ports, 1-2 nav lamps at
    sf.LAMP_SPACING (1.20). No marker runs, no edge-lit panels.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: loft, cabin, blister, intake, drive, both zone straps,
       service band, cabin+chassis plate_course/plate_grid, HUMAN ports
       at PORT_SPACING, two lamps, two glow ports, extra welds/straps
    2  half plate / port / lamp / patch counts; cabin + blister +
       intake + drive + straps kept
    1  loft + cabin + blister + drive
    0  loft + drive

DENSITY (AUTHORED AIM, not measured):
    hull verts 5,000-9,000 (SHIP_SCALE.ace.hull band 4,000-21,000)
    max span ~7.2-7.4 (band [4.32, 10.08], target 7.2)
    spanZ/spanX >= 1.15; spanY/spanZ <= 0.60; spanX/spanZ >= 0.16
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import surplus as su
from . import hardware as hw


# Absolute module sizes. Never multiply by l, b or h.
_BURY = 0.10                    # module sink; floor 0.08
_BLISTER = (0.54, 0.36, 1.20)   # racing owner mark; Z >= 1.08
_DRIVE_DEP = 0.50
_INTAKE_R = 0.16
_INTAKE_D = 0.14
_SEAM_OVER = 0.05
_PLATE_D = 0.16                 # thick enough to hold a 0.06 hw change
_FACE_IN = 0.06                 # plate face sits this far inboard of MIN skin
_SLAB_T = 0.18                  # quilt host slab (full extent)
_SLAB_Y = 0.12


def _glow_tag(obj):
    if obj:
        obj['skin_role'] = 'glow'
    return obj


# ===========================================================================
# STATION LIST
# ===========================================================================

def _ace_stations(l, b, h):
    """Lean civilian chassis. Half-extents are absolute, never *b or *h.

    Blunt cabin bow, pinched mid stretch, firmer 4-nozzle transom.
    ``b`` and ``h`` name the class envelope; the loft does not use them.
    """
    _ = (b, h)
    return [
        # -- BOW: blunt civilian cabin attach --------------------------------
        sf.fair(l * -0.520, 0.24, 0.20, 0.04),  # loft nose
        sf.fair(l * -0.460, 0.38, 0.28, 0.05),
        sf.fair(l * -0.400, 0.50, 0.32, 0.05),  # cabin station
        sf.fair(l * -0.280, 0.46, 0.30, 0.03),  # bow/mid seam

        # -- MID: long lean hot-rod stretch ----------------------------------
        sf.fair(l * -0.140, 0.40, 0.26, 0.01),
        sf.fair(l *  0.000, 0.38, 0.24, 0.00),
        sf.fair(l *  0.180, 0.40, 0.26, 0.00),  # mid/stern seam

        # -- STERN: firm for the 4-nozzle transom ----------------------------
        sf.fair(l *  0.320, 0.42, 0.28, 0.00),
        sf.fair(l *  0.400, 0.40, 0.27, 0.00),
        sf.fair(l *  0.470, 0.38, 0.26, 0.00),  # transom
    ]


def _flank_pod_x(stations, z, y, half_w, side, bury):
    """Return the x-centre of a flank pod whose inner face buries ``bury``."""
    fx = sf.flank_x(stations, z, y)
    return side * (fx - bury + half_w)


def _lod_n(n, detail, floor=2):
    """Count down plate / port repeats. Detail 3 is full; 2 is half."""
    if detail >= 3:
        return max(floor, int(n))
    return max(floor, int(n) // 2)


def _run_min_hw(stations, z0, z1, samples=7):
    """Return (z_at_min, min_hw) along a short run."""
    hw_m = 1e9
    z_m = z0
    n = max(3, int(samples))
    for i in range(n):
        z = z0 + (z1 - z0) * i / float(n - 1)
        hw = sf.section(stations, z)[0]
        if hw < hw_m:
            hw_m = hw
            z_m = z
    return z_m, hw_m


def _skin_run(parts, name, mat, stations, z0, z1, cols, rows, detail):
    """Zone-local donated plates on the chassis. Does not cross a seam.

    Seat on the MINIMUM half-beam in the run so plates pierce the loft
    shell at the pinch and stay inside the skin at the swell. Keep each
    run short (hw change <= ~0.06).
    """
    if detail < 2:
        return
    run = z1 - z0
    if run < 0.24:
        return
    cz = 0.5 * (z0 + z1)
    z_pin, _hw_m = _run_min_hw(stations, z0, z1)
    cols = _lod_n(cols, detail)
    rows = _lod_n(rows, detail)
    st = sf.straight_top(stations, z_pin)
    sb = sf.straight_bottom(stations, z_pin)
    span_y = max(st - sb, 0.22)
    cy = 0.5 * (st + sb)
    fx = sf.flank_x(stations, z_pin, cy)
    A = kit.ROLE_ARMOUR
    if fx > 0.14:
        for side, face, tag in ((1.0, 'x', 's'), (-1.0, '-x', 'p')):
            loc_x = side * (fx - _FACE_IN - _SLAB_T * 0.5)
            kit.plate_grid(parts, '%s.flank.%s' % (name, tag), A,
                           (loc_x, cy, cz),
                           (_SLAB_T, span_y * 0.90, run),
                           mat, cols=cols, rows=rows, face=face,
                           depth=_PLATE_D, gap=0.08)
    ty = sf.top_y(stations, cz, 0.0)
    by = sf.bottom_y(stations, cz, 0.0)
    flat = max(sf.flat_half(stations, z_pin), 0.16)
    deck_cols = _lod_n(max(3, cols // 3), detail)
    deck_rows = cols
    kit.plate_grid(parts, name + '.deck', A,
                   (0.0, ty - _FACE_IN - _SLAB_Y * 0.5, cz),
                   (flat * 1.55, _SLAB_Y, run),
                   mat, cols=deck_cols, rows=deck_rows, face='y',
                   depth=_PLATE_D, gap=0.08)
    kit.plate_grid(parts, name + '.keel', A,
                   (0.0, by + _FACE_IN + _SLAB_Y * 0.5, cz),
                   (flat * 1.35, _SLAB_Y, run),
                   mat, cols=max(2, deck_cols - 1),
                   rows=max(2, deck_rows - 2),
                   face='-y', depth=_PLATE_D, gap=0.08)
    n_course = _lod_n(max(4, cols // 2), detail)
    if fx > 0.14:
        hh = sf.section(stations, z_pin)[1]
        yo = sf.section(stations, z_pin)[2]
        for side, tag in ((-1.0, 'p'), (1.0, 's')):
            kit.plate_course(parts, '%s.course.%s' % (name, tag), A,
                             (side * (fx - 0.05), yo, cz),
                             (0.22, hh * 0.95, run),
                             mat, count=n_course, axis='z',
                             gap=0.10, step=0.012, bevel=0.012)


def _cabin_skin(parts, mat, loc, detail):
    """plate_grid + plate_course on the civilian cabin box faces."""
    if detail < 2:
        return
    sx, sy, sz = sf.CIVILIAN_CABIN
    A = kit.ROLE_ARMOUR
    dc = _lod_n(5, detail)
    dr = _lod_n(7, detail)
    fc = _lod_n(7, detail)
    fr = _lod_n(4, detail)
    # Thin slabs sit on the cabin faces so plates pierce, not nest.
    kit.plate_grid(parts, 'ace.cabin.grid.dk', A,
                   (loc[0], loc[1] + sy * 0.5 - 0.04, loc[2]),
                   (sx * 0.70, 0.08, sz * 0.72),
                   mat, cols=dc, rows=dr, face='y', depth=0.08, gap=0.08)
    kit.plate_grid(parts, 'ace.cabin.grid.s', A,
                   (loc[0] + sx * 0.5 - 0.04, loc[1], loc[2]),
                   (0.08, sy * 0.62, sz * 0.72),
                   mat, cols=fc, rows=fr, face='x', depth=0.08, gap=0.08)
    kit.plate_grid(parts, 'ace.cabin.grid.p', A,
                   (loc[0] - sx * 0.5 + 0.04, loc[1], loc[2]),
                   (0.08, sy * 0.62, sz * 0.72),
                   mat, cols=fc, rows=fr, face='-x', depth=0.08, gap=0.08)
    kit.plate_grid(parts, 'ace.cabin.grid.bow', A,
                   (loc[0], loc[1], loc[2] - sz * 0.5 + 0.04),
                   (sx * 0.70, sy * 0.62, 0.08),
                   mat, cols=_lod_n(4, detail), rows=_lod_n(3, detail),
                   face='-z', depth=0.08, gap=0.08)
    n = _lod_n(4, detail)
    kit.plate_course(parts, 'ace.cabin.course.dk', A,
                     (loc[0], loc[1] + sy * 0.5 - 0.04, loc[2]),
                     (sx * 0.70, 0.08, sz * 0.72),
                     mat, count=n, axis='z', gap=0.10, step=0.010,
                     bevel=0.012)
    kit.plate_course(parts, 'ace.cabin.course.s', A,
                     (loc[0] + sx * 0.5 - 0.05, loc[1], loc[2]),
                     (0.10, sy * 0.58, sz * 0.72),
                     mat, count=n, axis='z', gap=0.10, step=0.010,
                     bevel=0.012)


def _human_ports(parts, mat, loc, count, detail):
    """HUMAN flank ports on the cabin. Pitch is sf.PORT_SPACING.

    Centres use the cabin box, not a loft query (separated volume).
    """
    if detail < 2:
        return
    n = count if detail >= 3 else max(1, count // 2)
    sx, _sy, sz = sf.CIVILIAN_CABIN
    pitch = sf.PORT_SPACING
    span = pitch * (n - 1)
    if span > sz - 0.28:
        n = max(1, int((sz - 0.28) / pitch) + 1)
        span = pitch * (n - 1)
    z0 = loc[2] - span * 0.5
    port = sf.FLANK_PORT
    hx = sx * 0.5 - 0.01
    for i in range(n):
        zz = z0 + pitch * i
        for side, tag in ((-1.0, 'p'), (1.0, 's')):
            kit.box(parts, 'ace.port.%s.%d' % (tag, i), kit.ROLE_RECESS,
                    (side * hx, loc[1] + 0.04, zz), port, mat)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Independent hot rod (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.2, 2.88, 1.44).
    detail   -- 3 full  2 half repeats  1 loft+cabin+blister+drive
                0 loft + drive.
    """
    _ = (b, h)
    H = kit.ROLE_HULL
    stations = _ace_stations(l, b, h)

    z_bow_s = l * -0.280
    z_mid_s = l * 0.180
    z_trans = l * 0.470
    z_cabin = l * -0.400
    z_blister = l * -0.040
    z_pod = l * 0.080
    z_band = l * -0.140

    # ── Lean civilian loft (always, detail 0+) ──────────────────────────
    kit.hull_loft(parts, 'ace.chassis', H, stations, hull_mat)

    # ── DRIVE FACE at the transom (always; 4 nozzles) ───────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern loft. Driver glow sits at z = l*0.47.
    hw_t, hh_t, yo_t, _ch = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'ace.drive', hull_mat, glow_mat,
                  (0.0, yo_t, z_trans), hw_t, hh_t,
                  nozzles=4, depth=_DRIVE_DEP, detail=detail)

    if detail < 1:
        return

    # ── CIVILIAN CABIN (detail 1+): recognizable shuttle bow mass ───────
    # Bottom face buries _BURY into the cabin-station deck.
    _sx_c, sy_c, sz_c = sf.CIVILIAN_CABIN
    y_cabin_deck = sf.top_y(stations, z_cabin, 0.0)
    cy_cabin = y_cabin_deck - _BURY + sy_c * 0.5
    cabin_loc = (0.0, cy_cabin, z_cabin)
    su.civilian_cabin(parts, 'ace.cabin', hull_mat, cabin_loc, detail=detail)

    # ── RACING BLISTER (detail 1+): G2 owner mark, starboard only ───────
    # Inner face and deck root bury _BURY into the lean mid loft.
    bx, by, bz = _BLISTER
    bz = max(bz, 0.15 * l)
    yo_b = sf.section(stations, z_blister)[2]
    cx_b = _flank_pod_x(stations, z_blister, yo_b, bx * 0.5, 1.0, _BURY)
    y_b_deck = sf.top_y(stations, z_blister, abs(cx_b) * 0.45)
    cy_b = y_b_deck - _BURY + by * 0.5
    blister_loc = (cx_b, cy_b, z_blister)
    su.owner_module(parts, 'ace.blister', hull_mat, blister_loc,
                    size=(bx, by, bz), detail=detail)

    if detail < 2:
        return

    # ── ZONE STRAPS (detail 2+): visible bow/mid and mid/stern joints ───
    for tag, z_seam in (('bow', z_bow_s), ('stern', z_mid_s)):
        hw_s, hh_s, yo_s, _ch_s = sf.seam_ring(stations, z_seam, over=_SEAM_OVER)
        su.zone_strap(parts, 'ace.seam.' + tag, hull_mat,
                      (0.0, yo_s, z_seam),
                      width=hw_s * 2.0, height=hh_s * 2.0, detail=detail)

    # ── OFFSET INTAKE (detail 2+): one starboard mission_pod scoop ──────
    px, _py, pz = sf.MISSION_POD
    yo_p = sf.section(stations, z_pod)[2]
    cx_p = _flank_pod_x(stations, z_pod, yo_p, px * 0.5, 1.0, _BURY)
    cy_p = yo_p - 0.04
    pod_loc = (cx_p, cy_p, z_pod)
    hw.mission_pod(parts, 'ace.intake', hull_mat, pod_loc, detail=detail)
    kit.cyl(parts, 'ace.intake.scoop', kit.ROLE_RECESS,
            (cx_p, cy_p, z_pod - pz * 0.5 + 0.04),
            _INTAKE_R, _INTAKE_D, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=10)

    # ── SERVICE BAND (detail 2+): one mid-deck cluster, calm hull else ──
    yo_band = sf.section(stations, z_band)[2]
    y_band = sf.top_y(stations, z_band, 0.0)
    fx_band = sf.flank_x(stations, z_band, yo_band)
    su.strap_clamp(parts, 'ace.band.strap', hull_mat,
                   (0.0, y_band - 0.02, z_band),
                   span=max(fx_band * 2.0 - 0.08, 0.42), axis='x',
                   detail=detail)
    su.field_weld(parts, 'ace.band.weld', hull_mat,
                  (fx_band - 0.04, yo_band + 0.04, z_band),
                  length=0.48, axis='z', detail=detail)
    su.patch_plate(parts, 'ace.band.patch.0', hull_mat,
                   (fx_band - 0.02, yo_band - 0.04, z_band - 0.18),
                   facing='starboard', detail=detail)

    # ── NAV LAMPS (detail 2+: one; 3: two at LAMP_SPACING) ───────────────
    # Centres sit 1.20 apart on the port mid deck so they stay clear of
    # the starboard blister. Housing roots bury into the deck.
    z_lamp0 = z_band - sf.LAMP_SPACING * 0.5
    z_lamp1 = z_band + sf.LAMP_SPACING * 0.5
    lamp_zs = (z_lamp0, z_lamp1) if detail >= 3 else (z_lamp0,)
    for i, z_lp in enumerate(lamp_zs):
        y_lp = sf.top_y(stations, z_lp, 0.12) - 0.04
        hw.nav_lamp(parts, glow, 'ace.lamp.%d' % i, hull_mat, glow_mat,
                    (-0.12, y_lp, z_lp), facing='up', detail=detail)

    # ── EMISSIVE PORTS (detail 2+: brow row; 3: + blister pane) ──────────
    # HUMAN pitch. Depth stays on the cabin face, inboard of the loft nose.
    n_brow = 2 if detail >= 3 else 1
    brows = kit.window_row(glow, 'ace.port.brow',
                           (0.0, cy_cabin + 0.06,
                            z_cabin - sz_c * 0.5 + 0.02),
                           glow_mat, n_brow, sf.PORT_SPACING, sf.PORT_LIGHT)
    for obj in brows:
        _glow_tag(obj)

    # ── CABIN + CHASSIS SURFACE LANGUAGE (detail 2+; counts halve at 2) ─
    # Armour courses stay inside one zone. No run crosses a seam.
    # Plates sit on sf-queried slabs; they do not grow the loft stations.
    _cabin_skin(parts, hull_mat, cabin_loc, detail)
    _human_ports(parts, hull_mat, cabin_loc, 3, detail)
    # Nose taper is the cabin's job. Chassis quilts start aft of the
    # cabin station so no course rides the 0.24-0.50 bow pinch.
    _skin_run(parts, 'ace.skin.bow.aft', hull_mat, stations,
              z_cabin + 0.10, z_bow_s - 0.08, 6, 3, detail)
    z_m0 = l * -0.140
    z_m1 = l * 0.000
    _skin_run(parts, 'ace.skin.mid.a', hull_mat, stations,
              z_bow_s + 0.08, z_m0 - 0.04, 8, 4, detail)
    _skin_run(parts, 'ace.skin.mid.b', hull_mat, stations,
              z_m0 + 0.04, z_m1 - 0.04, 8, 4, detail)
    _skin_run(parts, 'ace.skin.mid.c', hull_mat, stations,
              z_m1 + 0.04, z_mid_s - 0.08, 8, 4, detail)
    z_s0 = l * 0.320
    _skin_run(parts, 'ace.skin.stern.a', hull_mat, stations,
              z_mid_s + 0.08, z_s0 - 0.04, 7, 4, detail)
    _skin_run(parts, 'ace.skin.stern.b', hull_mat, stations,
              z_s0 + 0.04, z_trans - 0.20, 7, 4, detail)

    if detail < 3:
        return

    # Second service-band plate and the blister port stay on the mid band.
    su.patch_plate(parts, 'ace.band.patch.1', hull_mat,
                   (-fx_band + 0.02, yo_band + 0.02, z_band + 0.16),
                   facing='port', detail=detail)
    blister_port = kit.box(glow, 'ace.port.blister', kit.ROLE_RECESS,
                           (cx_b + bx * 0.5 - 0.01, cy_b + 0.04,
                            z_blister - bz * 0.18),
                           sf.FLANK_PORT, glow_mat)
    _glow_tag(blister_port)

    # Blister root weld: joins the owner mark to the mid deck.
    su.field_weld(parts, 'ace.blister.weld', hull_mat,
                  (cx_b - bx * 0.25, y_b_deck - 0.02, z_blister),
                  length=0.40, axis='z', detail=detail)
    su.strap_clamp(parts, 'ace.blister.strap', hull_mat,
                   (cx_b * 0.45, y_b_deck - 0.02, z_blister),
                   span=max(cx_b * 0.70, 0.36), axis='x', detail=detail)

    # ── CABIN / INTAKE JOINTS (detail 3): lash-up, 0 crates ──────────────
    su.field_weld(parts, 'ace.cabin.weld', hull_mat,
                  (0.0, y_cabin_deck - 0.02, z_cabin + sz_c * 0.22),
                  length=0.48, axis='x', detail=detail)
    su.strap_clamp(parts, 'ace.cabin.strap', hull_mat,
                   (0.0, y_cabin_deck - 0.02, z_cabin + sz_c * 0.28),
                   span=max(sf.flat_half(stations, z_cabin) * 1.50, 0.42),
                   axis='x', detail=detail)
    su.field_weld(parts, 'ace.intake.weld', hull_mat,
                  (cx_p - px * 0.25, cy_p, z_pod),
                  length=0.40, axis='z', detail=detail)
    su.strap_clamp(parts, 'ace.intake.strap', hull_mat,
                   (cx_p * 0.45, cy_p + 0.06, z_pod),
                   span=max(cx_p * 0.70, 0.36), axis='x', detail=detail)

    # Extra mismatched plates stay inside the mid band and inside the
    # existing beam (port hull / starboard blister). Thickness 0.10.
    extra_patches = (
        ('mid.p', -1.0, l * -0.080, 0.04, 'port'),
        ('mid.s', 1.0, l * 0.020, -0.06, 'starboard'),
        ('stern.p', -1.0, l * 0.280, 0.02, 'port'),
    )
    for tag, side, zz, y_off, facing in extra_patches:
        if tag.startswith('mid') and (zz <= z_bow_s or zz >= z_mid_s):
            continue
        if tag.startswith('stern') and (zz <= z_mid_s or zz >= z_trans):
            continue
        y_pt = sf.section(stations, zz)[2] + y_off
        fx_pt = sf.flank_x(stations, zz, y_pt)
        if fx_pt <= 0.14:
            continue
        x_pt = side * (fx_pt - 0.05)
        su.patch_plate(parts, 'ace.patch.' + tag, hull_mat,
                       (x_pt, y_pt, zz), facing=facing, detail=detail)
