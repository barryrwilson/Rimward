"""Assembly Freighter — FOUNDRY LINEAGE.

Bible §4.8 Freighter: "A colossal mobile replication yard: resource hoppers,
repeating foundry cells, daughter-ship racks, and successive generations of
modules extending down one spine. The smallest visible daughter probe should
be light-class scale."

Plate 08-assembly-ship.png is concept art, not a model to copy. Honour the
family: a long charcoal spine of repeating bays, weathered off-white clamps,
faded orange blocks, teal irises, a bow dorsal petal-fan, a stern radial
fan, one mid antenna forest, and many small daughter probes. Do not copy
the plate vertex-for-vertex.

Construction logic is REPEATED MODULE (synthesis/20 §5, 21 §G2/§G6). One
part, many copies, linear and radial arrays, visible joints. Variation is
copy-drift through stepping seeds, not human patchwork. The same
``ln.spine_segment`` and ``ln.shell_module`` recur down the spine;
generations are new seeds, not new sizes. Human and Assembly modules stay
absolute. A bigger class carries MORE copies, never bigger copies.

BODY PLAN
    A slim inner charcoal loft is the connective core only. The silhouette
    is a VERY LONG spine of many ``ln.spine_segment`` bays with visible
    joint rings. Repeating foundry cells are the same-size
    ``ln.shell_module`` in linear arrays on the flanks and keel. Resource
    hoppers are larger chamfer tanks, still repeated, stacked on the mid
    flanks. Daughter-ship racks are a ROW of ``hw.daughter_probe``
    (DAUGHTER_BODY_R = 1.35, the absolute light-class module) on pads that
    INTERSECT each body.

    Two ``ln.radial_fan``s at G2 scale: bow dorsal (plane xz) and stern
    (plane xy). The fan grows by radius AND count (many petals). Do not
    scale FAN_PETAL_*. §G3: large flat ``hw.radiator_panel``s and
    ``hw.drive_face`` with 8 countable nozzles. §G5: one OPEN starboard
    bay whose floor pad runs THROUGH the wall face, with a daughter_probe
    and ``sf.CARGO_CRATE`` cubes visibly in it — a nest wholly inside a
    box will float. ``hw.antenna_forest`` sits in ONE mid service band
    only. ``hw.docking_collar`` on the ventral mid. A fabrication iris
    sits in the dark nose collar. Orange patches stay 3–8 %: MORE patches,
    same ``sf.ORANGE_PATCH`` size.

STATION-LIST REASONING (z as fractions of l; half-extents are the SPINE
envelope in world units, never the class beam — the fans break the
outline, the spine stays a charcoal tube):
    Nose loft at l*-0.498 = -42.330; transom at l*0.480 = +40.800.
    Drive housing stands 0.12 aft of the transom → authored spanZ ≈ 83.3.
    Bow/mid seam at l*-0.212 = -18.020; mid/stern seam at l*+0.212 = +18.020.
    Spine half-beam 2.40 → 3.30 → 2.55; half-height 2.30 → 3.20 → 2.45.

ZONES (seam rings mark the joints; foundry runs do not cross a seam):
    bow   l*-0.498..l*-0.212   28.6 % of loft length
    mid   l*-0.212..l*+0.212   42.4 %
    stern l*+0.212..l*+0.480   26.8 %
    Seams overlap neighbouring bays by >= 0.10. The open bay, the rack,
    the hoppers and the antenna forest live in mid. Fans sit in bow and
    stern. Drive and the large radiator pair live in stern.

OUTLINE-BREAKER (§G2): both fans at G2 scale. Petal module stays
FAN_PETAL_LEN = 1.55. The fan grows by radius and count.
    R >= 0.15*l - 1.55 + 0.16
    At l = 85, 15 % = 12.75, so R >= 12.75 - 1.55 + 0.16 ≈ 11.36.
    Authored R_bow = 12.00, count 22. Authored R_stern = 12.00, count 24.
    Outer reach = 12.00 + 1.55 - 0.16 = 13.39 = 15.75 % of l.

§G3 THERMAL / DRIVE
    Two pairs of FLAT ``hw.radiator_panel`` (no fins, no greeble). Each
    long slab is (0.18, 6.20, 14.00) — 14 units is 16 % of l. Inboard
    0.14 sits inside the stern / mid bays. Drive face has 8 nozzles in a
    4x2 grid on a charcoal housing.

§G5 OPEN BAY
    Starboard mid. A RECESS wall box is the bay face. The cradle pad
    starts inside the spine, runs THROUGH that wall, and holds one
    ``hw.daughter_probe`` plus three ``sf.CARGO_CRATE`` cubes. Every
    nested body intersects the pad or a neighbour by >= 0.10.

ORANGE BUDGET (3–8 %, accent_density is already 1.0):
    One ``sf.ORANGE_PATCH`` face is 0.58 x 0.44 = 0.255. Authored 240
    patches at detail 3 → 61.2 u². Paintable outer faces (spine flanks +
    foundry outboard) ≈ 1 700 u² → ≈ 3.6 %. MORE copies than heavy /
    frigate, same module.

EMISSIVE BUDGET (<= 5 % of hull area):
    Teal irises (nose socket, a few optics, every daughter eye / nest),
    8 drive discs, one antenna-tip marker, the collar slit. Orange is
    ROLE_ACCENT geometry, not glow. AUTHORED AIM: emissive ~= 0.8 %.

DETAIL LADDER (constructs count their own repeats down; gating is here).
This class blows lod caps if the ladder is soft — count down hard:
    3  full: every bay, every foundry cell, full racks, both fans, 240
       patches, hopper stacks, open-bay contents
    2  half the bays / cells / hoppers / patches / rack probes; fans
       and hardware halve internally
    1  primary masses: long spine, drive, both fan hubs + a few petals,
       radiators, hoppers, a short foundry row, the open bay with one
       probe. DROPS racks and most probes.
    0  spine masses + drive + ONE fan hub only (stern)

MEASURED 2026-08-15 (measure-ships + three.js tri count):
    detail 3  79,668 hull verts / 44,948 lod0 triangles
    detail 2  15,996 triangles
    detail 1  2,704 triangles
    detail 0  748 triangles
    max span 83.3 (aim 78–92, floor 66); len/beam 3.13 (>= 1.05);
    ht/len 0.32 (<= 0.62); beam/len 0.32 (>= 0.16)
    hull verts inside SHIP_SCALE.freighter.hull [34 000, 154 000]
    triangles inside 60 000 / 24 000 / 8 000 / 4 000
    proxy cover 100 %; ONE CONNECTED BODY at 0.06 voxels
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


# Absolute modules. Never multiply by l, b or h.
_SHELL = (0.72, 0.44, 1.42)
_SHELL_BURY = 0.14
_SHELL_PITCH = 1.26
_HOPPER = (2.50, 2.10, 2.90)
_HOPPER_BURY = 0.18
_BAY_OVER = 0.28
_FAN_BURY = 0.16
_PAD_H = 0.22
_PROBE_R = sf.DAUGHTER_BODY_R


# ===========================================================================
# STATION LIST
# ===========================================================================

def _freighter_stations(l, _b, _h):
    """Outer spine envelope for queries. Not a closed plated hull.

    Half-extents are the charcoal bay radius, not the class beam. Fans,
    cells and hoppers sit on this tube. Nose at l*-0.498; transom at
    l*0.480.
    """
    return [
        sf.fair(l * -0.498, 2.40, 2.30, 0.0),
        sf.fair(l * -0.420, 2.90, 2.80, 0.0),
        sf.fair(l * -0.320, 3.20, 3.10, 0.0),
        sf.fair(l * -0.212, 3.25, 3.15, 0.0),  # bow / mid seam
        sf.fair(l * -0.060, 3.30, 3.20, 0.0),
        sf.fair(l *  0.060, 3.30, 3.20, 0.0),
        sf.fair(l *  0.212, 3.20, 3.10, 0.0),  # mid / stern seam
        sf.fair(l *  0.340, 3.00, 2.90, 0.0),
        sf.fair(l *  0.430, 2.85, 2.75, 0.0),
        sf.fair(l *  0.480, 2.55, 2.45, 0.0),  # transom
    ]


def _core_stations(stations, inset=0.55):
    """Inner connective loft, buried inside the bay envelope."""
    out = []
    for z, half_w, half_h, yo, ch in stations:
        hw2 = max(half_w - inset, 0.80)
        hh2 = max(half_h - inset, 0.72)
        ch2 = min(ch, hw2 * 0.42, hh2 * 0.42)
        out.append((z, hw2, hh2, yo, ch2))
    return out


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


def _fill_span(z0, z1, n, overlap=_BAY_OVER):
    """Return (length, centres) that fill [z0, z1] with overlap >= 0.10."""
    n = max(1, int(n))
    span = z1 - z0
    if n == 1:
        return span, ((z0 + z1) * 0.5,)
    length = (span - overlap) / float(n) + overlap
    if length < 0.40:
        length = 0.40
    pitch = length - overlap
    cz0 = z0 + length * 0.5
    return length, tuple(cz0 + i * pitch for i in range(n))


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


def _fan_radius(l, floor):
    """§G2: outer reach >= 15 % of l. Petal module stays FAN_PETAL_LEN."""
    need = 0.15 * l - sf.FAN_PETAL_LEN + _FAN_BURY
    return max(need, floor)


def _keepout(z, centre, radius):
    return abs(z - centre) < radius


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly foundry lineage (freighter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (85.0, 46.75, 25.5).
    detail   -- 3 full  2 halved repeats  1 primary masses + open bay
                0 spine + drive + one fan hub.

    MEASURED 2026-08-15 (measure-ships assembly):
        detail 3  79,668 hull verts / 44,948 lod0 triangles
        max span 83.3, len/beam 3.13, ht/len 0.32, beam/len 0.32
        inside SHIP_SCALE.freighter.hull [34 000, 154 000] and the
        60 000 / 24 000 / 8 000 / 4 000 LOD triangle caps
    """
    H = kit.ROLE_HULL

    _ = (b, h)
    stations = _freighter_stations(l, b, h)
    core_st = _core_stations(stations)

    z_nose = l * -0.498
    z_bow_s = l * -0.212
    z_mid_s = l * 0.212
    z_trans = l * 0.480
    z_spine0 = l * -0.490
    z_spine1 = l * 0.470

    z_bow_fan = l * -0.310
    z_stern_fan = l * 0.455
    z_bay = l * 0.072
    z_rack0 = l * -0.150
    z_ant = l * 0.000
    z_dock = l * 0.048

    r_bow = _fan_radius(l, 12.00)
    r_stern = _fan_radius(l, 12.00)
    n_bow_fan = 22
    n_stern_fan = 24

    # ── Inner connective loft (always). Hidden inside the bay envelope. ──
    kit.hull_loft(parts, 'freighter.coreloft', H, core_st, hull_mat)

    # ── CHARCOAL SPINE: many bays, successive generations (always). ──────
    # Same module, stepping seeds. Count fills the same span at every lod
    # so the silhouette holds while joints and copies drop.
    n_bay = _n(detail, 32, 16, 10, 8)
    bay_len, bay_zs = _fill_span(z_spine0, z_spine1, n_bay, overlap=_BAY_OVER)
    for i, cz in enumerate(bay_zs):
        half_w, half_h, yo, _ch = sf.section(stations, cz)
        r = max(min(half_w, half_h), 1.20)
        ln.spine_segment(parts, 'freighter.spine.%02d' % i, hull_mat,
                         (0.0, yo, cz), r, bay_len,
                         detail=detail, seed=20 + i)
        if detail >= 3:
            # Second-generation clamp on the same bay (new seed family).
            ln.joint_ring(parts, 'freighter.spine.%02d.gen' % i, hull_mat,
                          (0.0, yo, cz - bay_len * 0.22), r + 0.05,
                          detail=detail)

    # ── DRIVE FACE (always): 8 countable nozzles at the transom. ─────────
    d_hw, d_hh, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'freighter.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), max(d_hw, 2.20), max(d_hh, 1.70),
                  nozzles=8, depth=0.72, detail=detail)

    # ── STERN §G2 FAN (always): the one hub that survives detail 0. ──────
    yo_st = sf.section(stations, z_stern_fan)[2]
    ln.radial_fan(parts, 'freighter.fan.stern', hull_mat,
                  (0.0, yo_st, z_stern_fan),
                  count=n_stern_fan, radius=r_stern, plane='xy',
                  seed=120, detail=detail)

    if detail < 1:
        return

    # ── BOW DORSAL §G2 FAN (detail 1+). ──────────────────────────────────
    top_bow = sf.top_y(stations, z_bow_fan, 0.0)
    ln.radial_fan(parts, 'freighter.fan.bow', hull_mat,
                  (0.0, top_bow - 0.04, z_bow_fan),
                  count=n_bow_fan, radius=r_bow, plane='xz',
                  seed=110, detail=detail)

    # ── ZONE SEAM RINGS (detail 1+). ─────────────────────────────────────
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        hw_s, hh_s, yo_s, _ = sf.section(stations, zs)
        ln.joint_ring(parts, 'freighter.seam.%s' % tag, hull_mat,
                      (0.0, yo_s, zs), max(hw_s, hh_s) + 0.06,
                      detail=detail)

    # ── NOSE FABRICATION COLLAR (detail 1+). ─────────────────────────────
    hw.fabrication_socket(parts, glow, 'freighter.nose', hull_mat, glow_mat,
                          (0.0, 0.0, z_nose + 0.08),
                          radius=sf.FAB_SOCKET_COLLAR_R, facing='nose',
                          detail=detail)

    # ── §G3 RADIATORS (detail 1+): large flat pairs, no fins. ────────────
    for i, zf in enumerate((0.250, 0.360)):
        z_rad = l * zf
        hw_r, _hh_r, yo_r, _ = sf.section(stations, z_rad)
        rad_size = (0.18, 6.20, 14.00)
        x_rad = hw_r - 0.05
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            hw.radiator_panel(parts, 'freighter.rad.%d.%s' % (i, tag),
                              hull_mat,
                              (side * x_rad, yo_r + 0.15, z_rad),
                              rad_size, detail=detail)

    # ── VENTRAL DOCKING COLLAR (detail 1+). ──────────────────────────────
    keel = sf.bottom_y(stations, z_dock, 0.0)
    hw.docking_collar(parts, glow, 'freighter.dock', hull_mat, glow_mat,
                      (0.0, keel, z_dock), facing='down', detail=detail)

    # ── §G5 OPEN BAY (detail 1+): pad runs THROUGH the wall face. ────────
    _open_bay(parts, glow, stations, hull_mat, glow_mat, z_bay, detail)

    # ── RESOURCE HOPPERS (detail 1+): larger chamfer tanks, repeated. ────
    _place_hoppers(parts, stations, hull_mat, detail, z_bow_s, z_mid_s, z_bay)

    # ── FOUNDRY CELLS (detail 1+): same shell, linear arrays. ────────────
    faces = _place_foundry(parts, stations, hull_mat, detail,
                           z_nose, z_bow_s, z_mid_s, z_trans, z_bay)

    # ── ANTENNA FOREST (detail 1+): ONE mid service band only. ───────────
    deck = sf.top_y(stations, z_ant, 0.0)
    hw.antenna_forest(parts, glow, 'freighter.ant', hull_mat, glow_mat,
                      (0.0, deck, z_ant),
                      count=8, detail=detail, seed=77)

    # ── ORANGE PATCHES (detail 1+): more copies, same module. ────────────
    n_patch = _n(detail, 240, 120, 24, 0)
    _place_patches(parts, stations, hull_mat, detail, faces, n_patch)

    if detail < 2:
        return

    # ── DAUGHTER RACKS (detail 2+): a ROW of light-class probes. ─────────
    # detail 1 already dropped racks. detail 2 halves the row.
    n_rack = _n(detail, 8, 4, 0, 0)
    _place_rack(parts, glow, stations, hull_mat, glow_mat,
                z_rack0, n_rack, detail)

    # ── TEAL OPTICS (detail 2+): few, not a light strip. ─────────────────
    for i, z_op in enumerate((l * -0.400, l * -0.040, l * 0.280)):
        if detail < 3 and i > 1:
            break
        hw_o, _hh_o, yo_o, _ = sf.section(stations, z_op)
        if i == 1:
            loc_o = (-hw_o, yo_o, z_op)
            face = 'port'
        else:
            loc_o = (0.0, sf.top_y(stations, z_op, 0.0), z_op)
            face = 'up'
        hw.teal_optic(parts, glow, 'freighter.optic.%d' % i, hull_mat, glow_mat,
                      loc_o, facing=face, detail=detail)


# ===========================================================================
# PLACEMENT HELPERS
# ===========================================================================

def _open_bay(parts, glow, stations, hull_mat, glow_mat, z_bay, detail):
    """Open starboard bay. The pad pierces the wall; the probe sits on it."""
    H = kit.ROLE_HULL
    REC = kit.ROLE_RECESS
    hw_b, _hh_b, yo_b, _ = sf.section(stations, z_bay)
    # Wall: a face, not a closed hangar box. Inboard lip bites the spine.
    wall_sx = 1.80
    wall_x = hw_b + wall_sx * 0.5 - 0.16
    kit.box(parts, 'freighter.bay.wall', REC,
            (wall_x, yo_b, z_bay),
            (wall_sx, 3.60, 5.20), hull_mat)
    # Cheeks frame the mouth. They stay on the wall, not around the probe.
    kit.box(parts, 'freighter.bay.cheek.t', REC,
            (wall_x + 0.10, yo_b + 1.95, z_bay),
            (1.40, 0.28, 5.40), hull_mat)
    kit.box(parts, 'freighter.bay.cheek.b', REC,
            (wall_x + 0.10, yo_b - 1.95, z_bay),
            (1.40, 0.28, 5.40), hull_mat)
    # Pad starts INSIDE the spine, runs THROUGH the wall, out under the probe.
    pad_x0 = hw_b - 0.40
    pad_x1 = hw_b + 3.40
    pad_x = (pad_x0 + pad_x1) * 0.5
    pad_sx = pad_x1 - pad_x0
    pad_y = yo_b - 1.35
    kit.box(parts, 'freighter.bay.pad', H,
            (pad_x, pad_y, z_bay),
            (pad_sx, _PAD_H, 4.40), hull_mat)
    # Probe belly overlaps the pad top; body is not boxed in.
    probe_x = hw_b + 2.80
    probe_y = pad_y + _PAD_H * 0.5 + _PROBE_R - 0.18
    hw.daughter_probe(parts, glow, 'freighter.bay.probe',
                      hull_mat, glow_mat, (probe_x, probe_y, z_bay),
                      detail=detail, seed=501, petals=4)
    # Crates sit on the pad. Column 0 pierces the wall's outer face.
    cr = sf.CARGO_CRATE[0]
    crate_y = pad_y + _PAD_H * 0.5 + cr * 0.5 - 0.12
    wall_out = wall_x + wall_sx * 0.5
    cx0 = wall_out - 0.12 + cr * 0.5
    for i, cz in enumerate((z_bay - 1.10, z_bay + 0.05, z_bay + 1.20)):
        kit.box(parts, 'freighter.bay.crate.%d' % i, H,
                (cx0, crate_y, cz),
                sf.CARGO_CRATE, hull_mat)


def _place_hoppers(parts, stations, hull_mat, detail, z_bow_s, z_mid_s, z_bay):
    """Repeated resource hoppers. Larger chamfer tanks, stacked shells."""
    n_z = _n(detail, 6, 3, 2, 0)
    if n_z < 1:
        return
    sx, sy, sz = _HOPPER
    z0 = z_bow_s + 1.60
    z1 = z_mid_s - 2.40
    zs = _centers(z0, z1, sz, sz - 0.20)[:n_z]
    stacks = 2 if detail >= 2 else 1
    seed = 301
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for j, cz in enumerate(zs):
            if side > 0.0 and _keepout(cz, z_bay, 3.20):
                continue
            half_w, _hh, yo, _ = sf.section(stations, cz)
            x = side * (half_w + sx * 0.5 - _HOPPER_BURY)
            for k in range(stacks):
                sc, _rot, off = ln.copy_drift(seed)()
                y = yo + (0.15 if k == 0 else sy - 0.16)
                loc = _add((x, y, cz), off)
                kit.chamfer_block(
                    parts, 'freighter.hopper.%s.%02d.%d' % (tag, j, k),
                    kit.ROLE_HULL, loc,
                    (max(sx * sc[0], 0.80), max(sy * sc[1], 0.70),
                     max(sz * sc[2], 0.90)),
                    hull_mat, chamfer=0.42)
                if detail >= 2:
                    # Cladding sits on the outboard face, proud, not nested.
                    clad_x = x + side * (sx * 0.5 - _SHELL[0] * 0.5 + _SHELL_BURY)
                    ln.shell_module(
                        parts, 'freighter.hopper.shell.%s.%02d.%d' % (tag, j, k),
                        hull_mat, (clad_x, y, cz),
                        _SHELL, detail=detail, seed=seed + 3)
                seed += 1


def _place_foundry(parts, stations, hull_mat, detail, z_nose, z_bow_s,
                   z_mid_s, z_trans, z_bay):
    """Linear foundry-cell arrays. Returns outboard face centres for patches."""
    faces = []
    sx, sy, sz = _SHELL
    n_mid = _n(detail, 24, 12, 5, 0)
    n_bow = _n(detail, 8, 4, 0, 0)
    n_stn = _n(detail, 8, 4, 0, 0)
    rows = (
        ('stbd.hi',  1.0,  0.95),
        ('stbd.lo',  1.0, -0.95),
        ('port.hi', -1.0,  0.95),
        ('port.lo', -1.0, -0.95),
        ('vent.stbd', 1.0, None),
        ('vent.port', -1.0, None),
    )
    if detail <= 1:
        rows = (
            ('stbd.hi',  1.0,  0.95),
            ('port.hi', -1.0,  0.95),
        )
    elif detail == 2:
        rows = (
            ('stbd.hi',  1.0,  0.95),
            ('stbd.lo',  1.0, -0.95),
            ('port.hi', -1.0,  0.95),
            ('port.lo', -1.0, -0.95),
        )

    bands = []
    if n_bow > 0:
        bands.append(('bow', z_nose + 2.20, z_bow_s - 0.30, n_bow))
    if n_mid > 0:
        bands.append(('mid', z_bow_s + 0.30, z_mid_s - 0.30, n_mid))
    if n_stn > 0:
        bands.append(('stern', z_mid_s + 0.30, z_trans - 5.40, n_stn))

    seed = 201
    for band, z0, z1, n in bands:
        zs = _centers(z0, z1, sz, _SHELL_PITCH)
        if n < len(zs):
            step = max(1, int(round(len(zs) / float(n))))
            zs = zs[::step][:n]
        for row, side, y_off in rows:
            for i, cz in enumerate(zs):
                if side > 0.0 and _keepout(cz, z_bay, 3.00):
                    continue
                half_w, half_h, yo, _ = sf.section(stations, cz)
                if half_w <= 0.0 or half_h <= 0.0:
                    continue
                if y_off is None:
                    loc = (side * (half_w * 0.45),
                           yo - half_h - sy * 0.5 + _SHELL_BURY, cz)
                else:
                    loc = (side * (half_w + sx * 0.5 - _SHELL_BURY),
                           yo + y_off, cz)
                ln.shell_module(parts, 'freighter.cell.%s.%s.%02d' % (band, row, i),
                                hull_mat, loc, _SHELL,
                                detail=detail, seed=seed)
                faces.append((loc[0] + side * sx * 0.5, loc[1], loc[2], side))
                seed += 1
    return faces


def _place_patches(parts, stations, hull_mat, detail, faces, n_patch):
    """Faded-orange replacement blocks. Same size, more copies."""
    if n_patch < 1 or detail < 1:
        return
    # Prefer foundry faces, then fill from a spine dorsal walk.
    chosen = []
    if faces:
        step = max(1, int(round(len(faces) / float(n_patch))))
        chosen = list(faces[::step][:n_patch])
    seed = 80
    for i, (fx, fy, fz, side) in enumerate(chosen):
        # Thin axis along X so the block sits in the flank, buried 0.03.
        size = (sf.ORANGE_PATCH[1], sf.ORANGE_PATCH[0], sf.ORANGE_PATCH[2])
        ln.orange_patch(parts, 'freighter.patch.cell.%d' % i, hull_mat,
                        (fx - side * 0.03, fy, fz),
                        size=size, detail=detail, seed=seed)
        seed += 1
    remain = n_patch - len(chosen)
    if remain <= 0:
        return
    # Spine-top extras so coverage still reads when a track is sparse.
    z0 = stations[0][0] + 4.0
    z1 = stations[-1][0] - 6.0
    zs = _centers(z0, z1, sf.ORANGE_PATCH[2], 1.10)[:remain]
    for i, cz in enumerate(zs):
        top = sf.top_y(stations, cz, 0.0)
        side = 1.0 if (i % 2) == 0 else -1.0
        half_w = sf.section(stations, cz)[0]
        ln.orange_patch(parts, 'freighter.patch.deck.%d' % i, hull_mat,
                        (side * min(0.80, half_w * 0.35), top - 0.03, cz),
                        detail=detail, seed=seed)
        seed += 1


def _place_rack(parts, glow, stations, hull_mat, glow_mat, z0, n, detail):
    """Dorsal row of light-class daughters. Each pad intersects its body."""
    if n < 1:
        return
    H = kit.ROLE_HULL
    pitch = _PROBE_R * 2.0 + 0.40
    zs = tuple(z0 + i * pitch for i in range(n))
    for i, cz in enumerate(zs):
        top = sf.top_y(stations, cz, 0.0)
        # Pad bites the spine deck and the probe belly.
        pad_y = top - 0.04
        # Port of centreline so the mid antenna forest keeps a clear deck.
        rx = -1.70
        kit.box(parts, 'freighter.rack.pad.%d' % i, H,
                (rx, pad_y, cz),
                (2.40, _PAD_H, 2.50), hull_mat)
        probe_y = pad_y + _PAD_H * 0.5 + _PROBE_R - 0.18
        hw.daughter_probe(parts, glow, 'freighter.rack.probe.%d' % i,
                          hull_mat, glow_mat, (rx, probe_y, cz),
                          detail=detail, seed=520 + i, petals=4)
