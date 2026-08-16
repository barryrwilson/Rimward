"""Congregation Freighter — WANDERING BASILICA.

Bible §4.9 Freighter: "A huge pilgrimage and refuge vessel with habitation
districts, archive vaults, supply holds, and an immense forward-facing
nave/observatory. Repeated amber-lit rib bays create scale. It remains
outside stations and receives pilgrims by shuttle and bridge."

Plate 09-congregation-further-shore-ship.png IS the freighter charter:
a long midnight ribbed drum, a geodesic amber nave on the forward axis,
3–4 tall dorsal sail vanes plus a ventral vane, underslung canvas, and
repeated amber windows. Honour that civic refuge ship. Do not kitbash
a cathedral. No crosses, rose windows, gold, steeples or pews.

Construction logic is REPEATED MODULE, ritual (synthesis/21 G6). One
part, many copies. Scale from MORE drum_bays / MORE ribs / MORE shrine
cans / MORE sail vanes, never bigger modules. Bay size is ALWAYS
``sf.DRUM_BAY_*``. The nave is the one construct that may take a larger
envelope; its panes stay ``sf.NAVE_PANE``.

BODY PLAN
    A slim inner loft is connective tissue only — a midnight drum the
    bays, ribs and nave bury into. The silhouette is a procession of
    many ``rt.drum_bay`` (26 at detail 3; 13 at 2; 6 at 1; 4 at 0)
    with ``rt.rib_ring`` at the joints, wrapping the loft at the local
    host radius. Habitation districts are MORE drum_bays on the lower
    flanks plus ``hw.lamp_row`` in ONE lower band (count =
    runLength / 1.20, never packed). Archive vaults are several
    ``rt.shrine_procession`` and ``hw.archive_box`` on pads that
    intersect the crate. Supply holds are ``sf.CARGO_CRATE`` 0.85
    cubes on deck pads they pierce. Pilgrims arrive by the §G5 shuttle
    and by a thin lock-to-outboard bridge, not a church nave.

STATIONS (z as fractions of l; half-extents are the DRUM, never the
class beam — the sail set breaks the outline):
    Loft nose at l*-0.474 = -40.290; transom at l*0.472 = +40.120.
    Drive loc is the transom; housing stands 0.12 aft → +40.240.
    Nave centre at l*-0.482 = -40.970; radius 1.70, length 3.70;
    tip at centre - 1.85 = -42.820. Authored spanZ ≈ 83.06.
    Bow/mid seam at l*-0.280 = -23.800; mid/stern at l*+0.215 = +18.275.
    Drum half-beam 1.58 → 3.45 → 2.35; half-height 1.48 → 3.15 → 2.15.

ZONES (no shrine run or lamp band crosses a seam; ribs mark joints):
    bow   nave-tip .. l*-0.280    ~22.8 % of authored hull
    mid   l*-0.280 .. l*+0.215    ~50.7 %
    stern l*+0.215 .. drive aft   ~26.5 %

OUTLINE-BREAKER (§G2): a TALL dorsal mast, not a sail-hub disc.
    Vane module stays SAIL_SPAN = 1.85. The set grows by MORE masts
    and MORE vanes, never by hub_radius and never by scaling SAIL_*.
    need = 0.15 * 85.0 = 12.75  ⇒  mast_length >= 12.75
    Authored mast_length = 13.00; radius = 0.28; bury = 0.14.
    Tip reach from the deck = 13.00 - 0.14 = 12.86 >= 12.75.
    3–4 ``rt.folded_sail`` sit at the mast crown (port / starboard /
    up / aft). One ventral ``rt.folded_sail`` sits on the keel.
    Secondary ``rt.sail_cluster`` copies ride the spine at hub_radius
    0.4–1.0 so the hub cylinder intersects the mast and the deck.
    ``rt.canvas_drape`` copies hang along the ventral mid (MORE drapes,
    same CANVAS size).

G3
    Several large FLAT ``hw.radiator_panel`` (no fins, no greeble) on
    the stern flanks, buried >= 0.12. ``hw.drive_face`` 8 countable
    nozzles on a midnight housing. half_w / half_h come from the loft
    transom section so the 4x2 grid stays inside 70 % of that face.

G5
    One OPEN starboard bay (inboard + forward + aft walls, no outboard
    face, no roof). The floor pad starts inside the drum and runs
    THROUGH the wall. A 3-box shuttle (~1.20 long) and 2–3 cargo
    crates sit on that pad and intersect it. A nest wholly inside a
    wall box would float.

EMISSIVE BUDGET (<= 5 % of hull area):
    Nave interior, one lower lamp-row irises, 8 drive discs, collar
    and lock slits, two restrained Wakeglass irises. No edge-lit
    panels. AUTHORED AIM: emissive ~= 1.2 %.

DETAIL LADDER (count down HARD — this class has lod3):
    3  full procession + all sail clusters + lamp row + crates +
       drapes + shrine vaults + loft ribs
    2  half counts (bays, hab, drapes, shrines, ribs); constructs
       halve internally
    1  loft + ~6 bays + nave core + one tall mast + radiators +
       drive + hangar pad / shuttle body
    0  loft + 4 bays + nave core + drive housing

DENSITY (AUTHORED AIM only — re-derive after bake):
    hull verts 50 000–110 000 (band [34 000, 154 000])
    max span 78–88 (band [66.00, 109.20], target 78; authored ≈ 83.1)
    len/beam >= 1.05; ht/len <= 0.62; beam/len >= 0.16
    triangles inside 60 000 / 24 000 / 8 000 / 4 000 (lod0..lod3)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import ritual as rt
from . import hardware as hw


# Absolute modules. Never multiply by l, b or h.
_BAY_R = sf.DRUM_BAY_R
_BAY_LEN = sf.DRUM_BAY_LEN
_BAY_OVER = 0.12
_NAVE_R = 1.70
_NAVE_LEN = 3.70
_MAST_LEN = 13.00
_MAST_R = 0.28
_MAST_BURY = 0.14
_HUB_FWD = 0.60
_HUB_AFT = 0.70
_PAD_H = 0.22
_CRATE = sf.CARGO_CRATE


# ===========================================================================
# STATION LIST
# ===========================================================================

def _freighter_stations(l, _b, _h):
    """Outer drum envelope for queries. Slim civic spine, not class beam.

    Half-extents are the midnight drum radius. Sails break the outline.
    Nose at l*-0.474; transom at l*0.472.
    """
    return [
        sf.fair(l * -0.474, 2.10, 1.48, 0.0),  # loft nose, meets nave
        sf.fair(l * -0.400, 3.15, 2.25, 0.0),
        sf.fair(l * -0.280, 3.90, 2.90, 0.0),  # bow / mid seam
        sf.fair(l * -0.120, 4.15, 3.10, 0.0),
        sf.fair(l *  0.000, 4.20, 3.15, 0.0),
        sf.fair(l *  0.120, 4.15, 3.10, 0.0),
        sf.fair(l *  0.215, 3.95, 2.95, 0.0),  # mid / stern seam
        sf.fair(l *  0.340, 3.60, 2.65, 0.0),
        sf.fair(l *  0.420, 3.25, 2.38, 0.0),
        sf.fair(l *  0.472, 3.00, 2.15, 0.0),  # transom
    ]


# ===========================================================================
# COUNTS AND SPANS
# ===========================================================================

def _n(detail, full, half=None, low=None, mass=None):
    if half is None:
        half = max(1, int(full) // 2)
    if low is None:
        low = max(1, int(full) // 4)
    if mass is None:
        mass = 0
    if detail >= 3:
        return int(full)
    if detail == 2:
        return int(half)
    if detail == 1:
        return int(low)
    return int(mass)


def _fill_span(z0, z1, n, length, overlap=_BAY_OVER):
    """Return centres that place n modules of ``length`` inside [z0, z1]."""
    n = max(1, int(n))
    span = z1 - z0
    if n == 1:
        return ((z0 + z1) * 0.5,)
    if span <= length:
        return ((z0 + z1) * 0.5,)
    pitch = (span - length) / float(n - 1)
    if pitch < length - overlap:
        pitch = length - overlap
    cz0 = z0 + length * 0.5
    return tuple(cz0 + i * pitch for i in range(n))


def _centers(z0, z1, length, pitch):
    """Return centres that fill [z0, z1] without crossing the ends."""
    half = length * 0.5
    first = z0 + half
    last = z1 - half
    if last < first:
        return ((z0 + z1) * 0.5,)
    span = last - first
    n = int(round(span / pitch)) + 1
    if n < 1:
        return (first,)
    if n == 1:
        return ((first + last) * 0.5,)
    step = span / float(n - 1)
    return tuple(first + step * i for i in range(n))


def _keepout(z, centre, radius):
    return abs(z - centre) < radius


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Congregation wandering basilica (freighter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (85.0, 46.75, 25.5).
    detail   -- 3 full  2 halved repeats  1 loft+6 bays+nave+mast+hangar
                +radiators+drive  0 loft + 4 bays + nave core + drive.
                lod3 exists (detail 0).

    AUTHORED AIM only (no bake in this file):
        span ≈ 83.1; verts 50 000–110 000; engine glow at l*0.47
        len/beam >= 1.05; ht/len <= 0.62; beam/len >= 0.16
        triangles 60 000 / 24 000 / 8 000 / 4 000
    """
    H = kit.ROLE_HULL

    _ = (b, h)
    stations = _freighter_stations(l, b, h)

    z_loft0 = l * -0.474
    z_bow_s = l * -0.280
    z_mid_s = l * 0.215
    z_trans = l * 0.472
    z_nave = l * -0.482
    z_drive = z_trans

    z_hub = l * -0.020
    z_sail_fwd = l * -0.175
    z_sail_aft = l * 0.175
    z_vane = l * 0.085
    z_bay_open = l * 0.055
    z_dock = l * 0.000
    z_bridge = l * -0.090

    # ── SLIM DRUM LOFT (always). Connective tissue. ──────────────────────
    kit.hull_loft(parts, 'freighter.coreloft', H, stations, hull_mat)

    # ── IMMENSE FORWARD NAVE (always). Intersects the first drum. ────────
    hw.observation_nave(parts, glow, 'freighter.nave', hull_mat, glow_mat,
                        (0.0, 0.0, z_nave),
                        radius=_NAVE_R, length=_NAVE_LEN, detail=detail)

    # ── DRIVE FACE (always): 8 nozzles, housing from the transom section.
    d_hw, d_hh, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'freighter.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_drive), d_hw, d_hh,
                  nozzles=8, depth=0.70, detail=detail)

    # ── DRUM-BAY PROCESSION (always). Default module, never scaled. ──────
    n_bay = _n(detail, 26, 13, 6, 4)
    z_bay0 = z_nave + _NAVE_LEN * 0.5 - 0.22
    z_bay1 = z_trans - 4.80
    bay_zs = _fill_span(z_bay0, z_bay1, n_bay, _BAY_LEN, overlap=_BAY_OVER)
    for i, cz in enumerate(bay_zs):
        ty = sf.top_y(stations, cz, 0.0)
        # Dorsal seating: bay centre sits so the can buries >= 0.12.
        rt.drum_bay(parts, 'freighter.bay.%02d' % i, hull_mat,
                    (0.0, ty - 0.22, cz),
                    radius=_BAY_R, length=_BAY_LEN, detail=detail)
        if detail >= 2:
            rw, rh, ryo, _ = sf.section(stations, cz)
            rt.rib_ring(parts, 'freighter.bay.wrap.%02d' % i, hull_mat,
                        (0.0, ryo, cz), max(min(rw, rh), 0.40),
                        detail=detail)

    if detail < 1:
        return

    # ── MAIN §G2 TALL MAST (detail 1+): length >= 12.75, vanes at crown. ─
    _main_sail_mast(parts, stations, hull_mat, z_hub, z_vane, detail)

    # ── §G3 RADIATORS (detail 1+): several large flat slabs. ─────────────
    _place_radiators(parts, stations, hull_mat, l, detail)

    # ── §G5 OPEN BAY (detail 1+): pad through the wall, shuttle on it. ───
    _open_bay(parts, stations, hull_mat, z_bay_open, detail)

    # ── VENTRAL COLLAR + BRIDGE (detail 1+). ─────────────────────────────
    keel_d = sf.bottom_y(stations, z_dock, 0.0)
    hw.docking_collar(parts, glow, 'freighter.dock', hull_mat, glow_mat,
                      (0.0, keel_d, z_dock), facing='down', detail=detail)
    _place_bridge(parts, glow, stations, hull_mat, glow_mat, z_bridge,
                  detail)

    if detail < 2:
        return

    # ── SMALLER SPINE CLUSTERS (detail 2+). Small hub_radius only. ──────
    _secondary_sails(parts, stations, hull_mat, z_sail_fwd, z_sail_aft,
                     detail)

    # ── ZONE SEAM RIBS + TAPER RIBS (detail 2+). ─────────────────────────
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        rw, rh, ryo, _ = sf.section(stations, zs)
        rt.rib_ring(parts, 'freighter.seam.%s' % tag, hull_mat,
                    (0.0, ryo, zs), max(min(rw, rh), 0.40),
                    detail=detail)
    n_tap = 4 if detail >= 3 else 2
    _place_taper_ribs(parts, stations, hull_mat, detail,
                      z_loft0 + 1.20, z_bay0 - 0.30, n_tap, 'bow')
    _place_taper_ribs(parts, stations, hull_mat, detail,
                      z_mid_s + 0.40, z_trans - 1.20, n_tap, 'stern')

    # ── HABITATION DISTRICTS (detail 2+): MORE default drum_bays. ────────
    _place_habitation(parts, stations, hull_mat, detail,
                      z_bow_s, z_mid_s, z_bay_open, z_hub)

    # ── ONE LOWER LAMP BAND (detail 2+): count = runLength / 1.20. ───────
    _place_lamps(parts, glow, stations, hull_mat, glow_mat, detail,
                 z_bow_s, z_mid_s, z_bay_open)

    # ── VENTRAL CANVAS (detail 2+): MORE drapes, same CANVAS size. ───────
    n_drape = _n(detail, 8, 4, 0, 0)
    _place_drapes(parts, stations, hull_mat, detail,
                  z_bow_s, z_mid_s, n_drape)

    # ── ARCHIVE VAULTS + SUPPLY HOLDS (detail 2+). ───────────────────────
    _place_archives(parts, stations, hull_mat, detail, l,
                    z_bow_s, z_mid_s, z_bay_open)
    _place_holds(parts, stations, hull_mat, detail,
                 z_bow_s, z_mid_s, z_bay_open)

    if detail < 3:
        return

    # ── RESTRAINED WAKEGLASS (detail 3): two optics, not a strip. ────────
    for i, zf in enumerate((-0.360, 0.300)):
        z_op = l * zf
        oy = sf.straight_top(stations, z_op) - 0.10
        ox = sf.flank_x(stations, z_op, oy)
        if ox <= 0.08:
            continue
        face = 'starboard' if i == 0 else 'port'
        sx = 1.0 if i == 0 else -1.0
        hw.wakeglass_optic(parts, glow, 'freighter.optic.%d' % i,
                           hull_mat, glow_mat,
                           (sx * (ox - 0.02), oy, z_op),
                           facing=face, detail=detail)


# ===========================================================================
# PLACEMENT HELPERS
# ===========================================================================

def _main_sail_mast(parts, stations, hull_mat, z_hub, z_vane, detail):
    """Tall G2 mast through the deck. Vanes sit at the crown, not on a disc."""
    H = kit.ROLE_HULL
    deck = sf.top_y(stations, z_hub, 0.0)
    foot = deck - _MAST_BURY
    crown_y = foot + _MAST_LEN
    mid_y = foot + _MAST_LEN * 0.5
    kit.cyl(parts, 'freighter.sail.mast-collar', H,
            (0.0, deck, z_hub),
            0.48, 0.55, hull_mat, rotation=sf.CYL_ALONG_Y, vertices=10)
    kit.cyl(parts, 'freighter.sail.mast-trunk', H,
            (0.0, mid_y, z_hub),
            _MAST_R, _MAST_LEN, hull_mat, rotation=sf.CYL_ALONG_Y,
            vertices=12)
    if detail < 2:
        return
    # Roots sit inside the mast so boom and membrane share one body.
    crown = (0.0, crown_y - 0.10, z_hub)
    n_vane = 4 if detail >= 3 else 3
    faces = ('starboard', 'port', 'up', 'down')[:n_vane]
    for i, face in enumerate(faces):
        rt.folded_sail(parts, 'freighter.sail.main.vane.%d' % i, hull_mat,
                       crown, facing=face, detail=detail)
    keel = sf.bottom_y(stations, z_vane, -0.35)
    rt.folded_sail(parts, 'freighter.sail.ventral', hull_mat,
                   (-0.35, keel + sf.SAIL_BURY, z_vane),
                   facing='down', detail=detail)


def _secondary_sails(parts, stations, hull_mat, z_fwd, z_aft, detail):
    """Spine clusters on short masts. hub_radius stays <= 1.0."""
    for tag, zz, hub_r, count in (
            ('fwd', z_fwd, _HUB_FWD, 3),
            ('aft', z_aft, _HUB_AFT, 3)):
        deck = sf.top_y(stations, zz, 0.0)
        loc = (0.0, deck + 0.08, zz)
        kit.cyl(parts, 'freighter.sail.%s.mast' % tag, kit.ROLE_HULL, loc,
                0.42, 2.20, hull_mat, rotation=sf.CYL_ALONG_Y, vertices=10)
        rt.sail_cluster(parts, 'freighter.sail.%s' % tag, hull_mat, loc,
                        count=count, hub_radius=hub_r, plane='xy',
                        detail=detail)
    if detail < 3:
        return
    # Extra short masts grow the set by count, not by vane size.
    extra = (
        ('mid.a', z_fwd + (z_aft - z_fwd) * 0.28),
        ('mid.b', z_fwd + (z_aft - z_fwd) * 0.72),
    )
    for tag, zz in extra:
        deck = sf.top_y(stations, zz, 0.0)
        loc = (0.0, deck + 0.10, zz)
        kit.cyl(parts, 'freighter.sail.%s.mast' % tag, kit.ROLE_HULL, loc,
                0.32, 3.40, hull_mat, rotation=sf.CYL_ALONG_Y, vertices=10)
        crown = (0.0, deck + 0.10 + 1.60, zz)
        rt.folded_sail(parts, 'freighter.sail.%s.vane.0' % tag, hull_mat,
                       crown, facing='up', detail=detail)
        rt.folded_sail(parts, 'freighter.sail.%s.vane.1' % tag, hull_mat,
                       crown, facing='port', detail=detail)


def _place_radiators(parts, stations, hull_mat, l, detail):
    """Several large FLAT radiator slabs on the stern flanks."""
    rad_size = (0.22, 5.40, 12.00)
    inset = rad_size[0] * 0.5 - 0.14
    for i, zf in enumerate((0.280, 0.380)):
        z_rad = l * zf
        yo = sf.section(stations, z_rad)[2]
        fx = sf.flank_x(stations, z_rad, yo)
        if fx <= 0.20:
            continue
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            hw.radiator_panel(parts, 'freighter.rad.%d.%s' % (i, tag),
                              hull_mat,
                              (side * (fx - inset), yo, z_rad),
                              rad_size, detail=detail)


def _place_taper_ribs(parts, stations, hull_mat, detail, z0, z1, n, tag):
    """Silver ribs on a bow or stern taper. Local loft radius."""
    if z1 <= z0 + 0.40 or n < 1:
        return
    zs = _fill_span(z0, z1, n, sf.RIB_DEPTH, overlap=0.04)
    for i, cz in enumerate(zs):
        rw, rh, ryo, _ = sf.section(stations, cz)
        rt.rib_ring(parts, 'freighter.rib.%s.%d' % (tag, i), hull_mat,
                    (0.0, ryo, cz), max(min(rw, rh), 0.40),
                    detail=detail)


def _place_lamps(parts, glow, stations, hull_mat, glow_mat, detail,
                 z_bow_s, z_mid_s, z_bay):
    """One lower starboard band. Each housing intersects the drum."""
    z0 = z_bow_s + 0.80
    z1 = z_mid_s - 0.80
    if z1 <= z0:
        return
    pitch = sf.LAMP_SPACING if detail >= 3 else sf.LAMP_SPACING * 2.0
    zs = _centers(z0, z1, sf.LAMP_HOUSING[2], pitch)
    hx = sf.LAMP_HOUSING[0]
    hy = sf.LAMP_HOUSING[1]
    bury = 0.12
    for i, cz in enumerate(zs):
        if _keepout(cz, z_bay, 2.40):
            continue
        y = sf.straight_bottom(stations, cz) + hy * 0.5
        fx = sf.flank_x(stations, cz, y)
        if fx <= 0.08:
            # Drop onto the keel so the housing still bites the drum.
            x_k = 0.55
            y = sf.bottom_y(stations, cz, x_k) + hy * 0.5 - bury
            fx = sf.flank_x(stations, cz, y)
            if fx <= 0.08:
                continue
            x = min(x_k, fx - hx * 0.5 + bury)
        else:
            # Centre inboard: 0.12 of the housing sits inside the flank.
            x = fx - bury + hx * 0.5
        hw.candle_lamp(parts, glow, 'freighter.lamps.lamp.%d' % i,
                       hull_mat, glow_mat, (x, y, cz),
                       facing='starboard', detail=detail)


def _place_habitation(parts, stations, hull_mat, detail,
                      z_bow_s, z_mid_s, z_bay, z_hub):
    """Lower-flank drum_bays. Same default module. Mid zone only."""
    n_hab = _n(detail, 8, 4, 0, 0)
    if n_hab < 1:
        return
    z0 = z_bow_s + 1.20
    z1 = z_mid_s - 1.20
    zs = _fill_span(z0, z1, n_hab, _BAY_LEN, overlap=_BAY_OVER)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for i, cz in enumerate(zs):
            if side > 0.0 and _keepout(cz, z_bay, 3.20):
                continue
            if _keepout(cz, z_hub, 3.60):
                continue
            yo = sf.section(stations, cz)[2]
            y_row = yo - 0.55
            fx = sf.flank_x(stations, cz, y_row)
            if fx <= 0.20:
                continue
            loc_x = side * (fx + _BAY_R - 0.18)
            rt.drum_bay(parts, 'freighter.hab.%s.%02d' % (tag, i),
                        hull_mat, (loc_x, y_row, cz),
                        radius=_BAY_R, length=_BAY_LEN, detail=detail)


def _place_drapes(parts, stations, hull_mat, detail, z_bow_s, z_mid_s, n):
    """Ventral mid canvas copies. Same CANVAS size. One port offset."""
    if n < 1:
        return
    z0 = z_bow_s + 1.40
    z1 = z_mid_s - 1.40
    zs = _fill_span(z0, z1, n, sf.CANVAS[2], overlap=0.10)
    for i, cz in enumerate(zs):
        keel = sf.bottom_y(stations, cz, 0.0)
        rt.canvas_drape(parts, 'freighter.drape.%02d' % i, hull_mat,
                        (0.0, keel + 0.05, cz), detail=detail)
    # Extra port-offset drape: more copies, same size, one asymmetry.
    if detail >= 3 and zs:
        cz = zs[len(zs) // 2]
        keel_p = sf.bottom_y(stations, cz, -0.55)
        rt.canvas_drape(parts, 'freighter.drape.port', hull_mat,
                        (-0.55, keel_p + 0.05, cz + 0.70), detail=detail)


def _place_archives(parts, stations, hull_mat, detail, l,
                    z_bow_s, z_mid_s, z_bay):
    """Shrine processions + archive boxes on intersecting pads."""
    H = kit.ROLE_HULL
    runs = (
        ('stbd.a',  1.0, l * -0.200, 8),
        ('stbd.b',  1.0, l *  0.130, 7),
        ('stbd.c',  1.0, l * -0.080, 6),
        ('port.a', -1.0, l * -0.150, 8),
        ('port.b', -1.0, l *  0.100, 7),
        ('port.c', -1.0, l * -0.050, 6),
        ('dorsal',  0.0, l * -0.230, 6),
        ('dorsal.b', 0.0, l *  0.145, 5),
    )
    if detail < 3:
        runs = runs[:4]
    for tag, side, cz, count in runs:
        if cz <= z_bow_s or cz >= z_mid_s:
            continue
        if side > 0.0 and _keepout(cz, z_bay, 3.00):
            continue
        yo = sf.section(stations, cz)[2]
        if side == 0.0:
            ty = sf.top_y(stations, cz, 0.0)
            loc = (0.55, ty + sf.SHRINE_CAN_R - 0.14, cz)
            pad = (1.10, 0.18, count * sf.SHRINE_PITCH + 0.20)
            kit.box(parts, 'freighter.vaultpad.%s' % tag, H,
                    (0.55, ty - 0.04, cz), pad, hull_mat)
        else:
            fx = sf.flank_x(stations, cz, yo)
            if fx <= 0.20:
                continue
            loc = (side * (fx + sf.SHRINE_CAN_R - 0.14), yo, cz)
            pad = (0.70, 0.18, count * sf.SHRINE_PITCH + 0.20)
            kit.box(parts, 'freighter.vaultpad.%s' % tag, H,
                    (side * (fx - 0.04), yo - 0.20, cz), pad, hull_mat)
        rt.shrine_procession(parts, 'freighter.vault.%s' % tag, hull_mat,
                             loc, count=count, axis='z', detail=detail)
        hw.archive_box(parts, 'freighter.archive.%s' % tag, hull_mat,
                       _add(loc, (0.0, -1.0, 0.0), 0.28), detail=detail)


def _place_holds(parts, stations, hull_mat, detail,
                 z_bow_s, z_mid_s, z_bay):
    """Crate stacks on deck pads. Each cube intersects its pad."""
    H = kit.ROLE_HULL
    n_stack = _n(detail, 6, 3, 0, 0)
    if n_stack < 1:
        return
    cr = _CRATE[0]
    z0 = z_bow_s + 2.00
    z1 = z_mid_s - 2.00
    zs = _centers(z0, z1, cr * 2.2, cr * 2.6)[:n_stack]
    for i, cz in enumerate(zs):
        if _keepout(cz, z_bay, 3.00):
            continue
        side = -1.0 if (i % 2) == 0 else 1.0
        if side > 0.0 and _keepout(cz, z_bay, 3.00):
            continue
        yo = sf.section(stations, cz)[2]
        fx = sf.flank_x(stations, cz, yo - 0.20)
        if fx <= 0.20:
            continue
        pad_x = side * (fx - 0.06)
        pad_y = yo - 0.85
        kit.box(parts, 'freighter.hold.pad.%02d' % i, H,
                (pad_x, pad_y, cz),
                (1.80, _PAD_H, 2.20), hull_mat)
        crate_y = pad_y + _PAD_H * 0.5 + cr * 0.5 - 0.12
        n_col = 2 if detail >= 3 else 1
        for col in range(n_col):
            for row in range(2):
                kit.box(parts, 'freighter.hold.crate.%02d.%d.%d' %
                        (i, col, row), H,
                        (pad_x + side * (0.10 + col * 0.78),
                         crate_y + row * (cr - 0.10),
                         cz),
                        _CRATE, hull_mat)


def _place_bridge(parts, glow, stations, hull_mat, glow_mat, z_bridge,
                  detail):
    """Thin lock-to-outboard bridge. Not a church nave."""
    H = kit.ROLE_HULL
    yo = sf.section(stations, z_bridge)[2]
    fx = sf.flank_x(stations, z_bridge, yo)
    if fx <= 0.20:
        return
    # Mid lock on the starboard flank. Barrel buries >= 0.12.
    lock_x = fx
    hw.receiving_lock(parts, glow, 'freighter.lock', hull_mat, glow_mat,
                      (lock_x, yo, z_bridge), facing='starboard',
                      detail=detail)
    # Thin box / strut from the lock outboard. Intersects the lock.
    kit.box(parts, 'freighter.bridge.deck', H,
            (fx + 2.10, yo + 0.06, z_bridge),
            (4.20, 0.18, 0.42), hull_mat)
    kit.strut(parts, 'freighter.bridge.strut', kit.ROLE_TRIM,
              (fx - 0.20, yo, z_bridge),
              (fx + 4.10, yo + 0.06, z_bridge),
              hull_mat, 0.07, vertices=6)
    kit.box(parts, 'freighter.bridge.cheek', kit.ROLE_ARMOUR,
            (fx + 0.35, yo + 0.16, z_bridge),
            (0.55, 0.28, 0.50), hull_mat)


def _open_bay(parts, stations, hull_mat, z_bay, detail):
    """Open starboard bay. Pad pierces the wall. Shuttle sits on the pad."""
    H = kit.ROLE_HULL
    half_w, _hh, yo, _ = sf.section(stations, z_bay)
    fx = sf.flank_x(stations, z_bay, yo)
    if fx <= 0.0:
        fx = half_w

    # Three walls + floor. No outboard face, no roof.
    kit.box(parts, 'freighter.bay.wall.in', H,
            (fx - 0.02, yo - 0.20, z_bay),
            (0.24, 2.20, 3.60), hull_mat)
    kit.box(parts, 'freighter.bay.wall.fwd', H,
            (fx + 0.95, yo - 0.22, z_bay - 1.78),
            (2.10, 2.10, 0.18), hull_mat)
    kit.box(parts, 'freighter.bay.wall.aft', H,
            (fx + 0.95, yo - 0.22, z_bay + 1.78),
            (2.10, 2.10, 0.18), hull_mat)
    # Pad starts INSIDE the drum and runs THROUGH the inboard wall.
    pad_x = fx + 0.70
    pad_y = yo - 1.20
    kit.box(parts, 'freighter.bay.pad', H,
            (pad_x, pad_y, z_bay),
            (2.80, _PAD_H, 3.20), hull_mat)
    kit.box(parts, 'freighter.bay.keel-strut', H,
            (fx - 0.16, yo - 0.70, z_bay),
            (0.80, 0.32, 0.70), hull_mat)

    # 3-box shuttle ~1.20 long. Body always; cabin/tail at detail 2+.
    craft_x = fx + 1.15
    # Body half-height 0.12; bury 0.12 into the pad top so the probe
    # sees one body (a nest that only kisses the pad can float).
    craft_y = pad_y + _PAD_H * 0.5 + 0.12 - 0.12
    kit.box(parts, 'freighter.bay.shuttle.body', H,
            (craft_x, craft_y, z_bay),
            (0.40, 0.24, 1.20), hull_mat)
    if detail >= 2:
        kit.box(parts, 'freighter.bay.shuttle.cabin', H,
                (craft_x, craft_y + 0.08, z_bay - 0.22),
                (0.30, 0.18, 0.42), hull_mat)
        kit.box(parts, 'freighter.bay.shuttle.tail', kit.ROLE_ARMOUR,
                (craft_x, craft_y, z_bay + 0.42),
                (0.22, 0.16, 0.32), hull_mat)

    # Crates on the pad. Column 0 pierces the wall's outer face.
    if detail >= 2:
        cr = _CRATE[0]
        crate_y = pad_y + _PAD_H * 0.5 + cr * 0.5 - 0.12
        wall_out = (fx - 0.02) + 0.12
        cx0 = wall_out + cr * 0.5 - 0.10
        for i, cz in enumerate((z_bay - 0.95, z_bay + 0.05, z_bay + 1.05)):
            if detail == 2 and i > 1:
                break
            kit.box(parts, 'freighter.bay.crate.%d' % i, H,
                    (cx0, crate_y, cz),
                    _CRATE, hull_mat)
