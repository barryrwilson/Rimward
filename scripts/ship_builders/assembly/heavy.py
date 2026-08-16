"""Assembly Heavy — REPLICATION DEFENDER.

Bible §4.8 heavy: "A dense machinery core surrounded by replaceable armor
modules, fabrication bays, and duplicated sensor/weapon clusters. Function
should remain legible despite complexity."

Plate 08-assembly-ship.png is concept art, not a model to copy. The plate
gives the family: charcoal spine, off-white clamped shells, few orange
blocks, teal irises, a large radial fan, a mid antenna forest. This class
hardens that language into a SHORT THICK defender, not a long survey stick.

Construction logic is REPEATED MODULE (synthesis/21 §G6). One part, many
copies, radial and linear arrays, visible joints. Variation is copy-drift
through kit.rng seeds. Human and Assembly module sizes stay absolute. A
bigger class carries MORE copies, never bigger copies.

BODY PLAN
    A short thick charcoal core (kit.hull_loft, half-extents <= 0.94)
    wrapped by overlapping ln.spine_segment bays. Replaceable
    ln.shell_module armour clamps the core on twelve tracks (three
    columns dorsal, three ventral, three rows each flank). Two hw.fabrication_socket bays open on
    real faces (bow −Z, starboard +X). A third port socket is the spare
    mouth. Duplicated clusters: one mirrored hw.teal_optic pair on the
    bow, one copy-drifted optic pair on the mid flanks, and one pair of
    three-petal weapon clusters (ln.fan_petal) with independent seeds.
    §G2 outline-breaker is ln.radial_fan. §G3 is a port/starboard pair of
    FLAT hw.radiator_panel plus hw.drive_face with 6 countable nozzles.
    hw.antenna_forest sits on the mid service band only. Three
    ln.orange_patch blocks. One hw.daughter_probe intersects the bow
    socket at detail >= 2.

STATION / ZONE REASONING (z as fractions of l)
    Nose / socket plane at l*-0.455 = -7.735.
    Transom / drive plane at l*+0.458 = +7.786. Drive face stands 0.12
    proud, so authored spanZ without the daughter is ~15.64.
    Bow / mid seam at l*-0.188 = -3.196.
    Mid / stern seam at l*+0.200 = +3.400.
    Zones: bow 26.7 %, mid 38.8 %, stern 25.8 % of lofted length.
    Dense core: spine radius 1.08, bay length 1.24, packed at 0.82 pitch
    so copy-drift still leaves >= 0.10 bay overlap.
    Shell module is the absolute (0.68, 0.38, 1.28) clamp. Pitch 0.88 so
    neighbours overlap; the inboard face buries 0.14 into the spine.

OUTLINE-BREAKER (§G2)
    Large dorsal fan, plane='xz', radius 2.12, count 16. Petal module is
    sf.FAN_PETAL_* (length 1.55). Lineage bury is 0.16. Outer reach is
    radius + 1.55 - 0.16 = 3.51 = 20.6 % of l (floor is 15 %).
    Gate on radius: R >= 0.15*l - 1.55 + 0.16 = 1.16 at l = 17.0.
    Authored R = 2.12. The fan grows by radius and count, never petal size.
    Second generation: stern plane='xy' fan, radius 1.28, count 8. Outer
    reach 2.67 = 15.7 % of l. Hub sits forward of the drive so petals do
    not swallow the nozzle face.

§G3 THERMAL / DRIVE
    One pair of hw.radiator_panel, FLAT, no fins, no panel lines. Each
    slab is (2.20, 0.14, 2.40). Inboard 0.16 sits inside the last stern
    bays. Outboard reach ~3.12 breaks the armour outline. Drive face has
    6 nozzles in a 3x2 grid on a charcoal housing.

EMISSIVE (authored aim, <= 5 % of hull area)
    Teal irises on 4 optics + 3 sockets + daughter eye / nest, 6 drive
    discs, one antenna-tip marker. No edge-lit panels. Authored glow area
    ~1.6 against a ~90 unit hull area (~1.8 %).

DETAIL LADDER
    3  full: every construct, full copy counts, daughter in the bow socket
    2  all construct families; lineage / hardware halve repeats
    1  loft + spine + drive + both fan hubs + radiators + sockets + armour
    0  loft + spine bays + drive housing + large-fan hub

ENVELOPE / MEASURED 2026-08-15 (measure-ships + three.js tri count)
    Driver: l = 17.0, b = 8.84, h = 5.78. Aim span 15.5–18.0.
    MEASURED spanZ 17.4; len/beam 2.55 (>= 1.15); ht/len 0.30 (<= 0.60);
    beam/len 0.39 (>= 0.16). Length still leads after fans and radiators
    add beam. MEASURED hull verts 32,680 (band 9k–78k); tris
    lod0/lod1/lod2 = 18,560/15,676/6,368. Proxy cover 100 %. Island aim:
    one body; every fitting overlaps its host by >= 0.10.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import hardware as hw
from . import lineage as ln
from . import surface as sf


# Absolute structural sizes. Not scaled by l, b or h.
_SPINE_R = 1.08
_BAY_LEN = 1.24
_SHELL = (0.68, 0.38, 1.28)
_SHELL_BURY = 0.14
_SHELL_PITCH = 0.88

# §G2: R >= 0.15*l - FAN_PETAL_LEN + bury = 1.16 at l=17. Grow R and count.
_FAN_R = 2.12
_FAN_N = 16
_FAN2_R = 1.28
_FAN2_N = 8


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _heavy_stations(l, b, h):
    """Dense charcoal core stations. Shorter and thicker than a survey stick.

    Half-extents stay under the 1.08 spine so the loft sits inside the
    bays. Nose at l*-0.455 = -7.735; transom at l*+0.458 = +7.786.
    Bow/mid seam at l*-0.188; mid/stern seam at l*+0.200.
    """
    return [
        # Half-extents stay under _SPINE_R so the repeating bays stay visible.
        sf.fair(l * -0.455, b * 0.078, h * 0.118, 0.00),  # hw 0.69
        sf.fair(l * -0.400, b * 0.090, h * 0.136, 0.00),
        sf.fair(l * -0.320, b * 0.098, h * 0.148, 0.00),
        sf.fair(l * -0.188, b * 0.102, h * 0.154, 0.00),
        sf.fair(l * -0.080, b * 0.104, h * 0.158, 0.00),
        sf.fair(l *  0.040, b * 0.106, h * 0.160, 0.00),  # hw 0.94 < 1.08
        sf.fair(l *  0.200, b * 0.102, h * 0.154, 0.00),
        sf.fair(l *  0.320, b * 0.094, h * 0.142, 0.00),
        sf.fair(l *  0.400, b * 0.086, h * 0.130, 0.00),
        sf.fair(l *  0.458, b * 0.074, h * 0.114, 0.00),
    ]


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


def _armour_track(parts, name, mat, x, y, zs, detail, seed0):
    """One linear run of the same shell module. Unique copy-drift per copy."""
    for i, z in enumerate(zs):
        ln.shell_module(parts, '%s.%02d' % (name, i), mat,
                        (x, y, z), _SHELL, detail=detail, seed=seed0 + i)


def _weapon_cluster(parts, glow, name, hull_mat, glow_mat, loc, facing,
                    detail, seed):
    """One optic plus three fan petals. Petal roots bury ~0.12 into the host."""
    hw.teal_optic(parts, glow, name + '.eye', hull_mat, glow_mat,
                  loc, facing=facing, detail=detail)
    dmap = {
        'starboard': (1.0, 0.0, 0.0),
        'port': (-1.0, 0.0, 0.0),
        'up': (0.0, 1.0, 0.0),
        'nose': (0.0, 0.0, -1.0),
    }
    out = dmap.get(facing, (1.0, 0.0, 0.0))
    petal_faces = (facing, 'up', 'nose')
    petal_dirs = (out, (0.0, 1.0, 0.0), (0.0, 0.0, -1.0))
    reach = sf.FAN_PETAL_LEN * 0.5 - 0.12
    for i, (face, direction) in enumerate(zip(petal_faces, petal_dirs)):
        ln.fan_petal(parts, '%s.petal.%d' % (name, i), hull_mat,
                     _add(loc, direction, reach), facing=face,
                     detail=detail, seed=seed + i)


def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly replication defender (heavy class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT / ROLE_RECESS / ROLE_TRIM.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class envelope from CLASSES (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 half repeats, 1 primary form, 0 mass only.
    """
    stations = _heavy_stations(l, b, h)

    z_nose = l * -0.455
    z_bow_s = l * -0.188
    z_mid_s = l * 0.200
    z_stern = l * 0.458

    # ── Dense core loft + spine bays + drive (detail 0+) ─────────────────
    kit.hull_loft(parts, 'heavy.core', kit.ROLE_HULL, stations, hull_mat)

    # Pack tighter than (length - 0.16) so drift cannot open a 0.10 gap.
    bay_pitch = 0.82
    bow_cz = _centers(z_nose + 0.04, z_bow_s + 0.24,
                      _BAY_LEN, bay_pitch)
    mid_cz = _centers(z_bow_s - 0.24, z_mid_s + 0.24,
                      _BAY_LEN, bay_pitch)
    stn_cz = _centers(z_mid_s - 0.24, z_stern,
                      _BAY_LEN, bay_pitch)
    seed = 11
    for tag, czs in (('bow', bow_cz), ('mid', mid_cz), ('stern', stn_cz)):
        for i, cz in enumerate(czs):
            ln.spine_segment(parts, 'heavy.spine.%s.%02d' % (tag, i),
                             hull_mat, (0.0, 0.0, cz),
                             _SPINE_R, _BAY_LEN, detail=detail, seed=seed)
            seed += 1

    d_hw, d_hh, d_yo, _d_ch = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'heavy.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_stern), max(d_hw, 0.72), max(d_hh, 0.58),
                  nozzles=6, depth=0.56, detail=detail)

    # Large §G2 fan: hub is primary mass even at detail 0.
    y_fan = _SPINE_R - 0.04
    z_fan = l * -0.055
    ln.radial_fan(parts, 'heavy.fan.primary', hull_mat,
                  (0.0, y_fan, z_fan),
                  count=_FAN_N, radius=_FAN_R, plane='xz',
                  seed=101, detail=detail)

    if detail < 1:
        return

    # ── Radiators, sockets, second fan, armour (detail 1+) ───────────────
    # Horizontal thermal slabs. Inboard 0.16 buries in the stern bays.
    z_rad = l * 0.394
    y_rad = 0.22
    rad_sx = 2.20
    x_rad = _SPINE_R + rad_sx * 0.5 - 0.16
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'heavy.radiator.' + tag, hull_mat,
                          (side * x_rad, y_rad, z_rad),
                          (rad_sx, 0.14, 2.40), detail=detail)

    hw.fabrication_socket(parts, glow, 'heavy.bay.bow', hull_mat, glow_mat,
                          (0.0, 0.0, z_nose), facing='nose', detail=detail)
    x_sock = _SPINE_R - 0.02
    z_sock = l * 0.028
    hw.fabrication_socket(parts, glow, 'heavy.bay.stbd', hull_mat, glow_mat,
                          (x_sock, 0.04, z_sock),
                          facing='starboard', detail=detail)
    hw.fabrication_socket(parts, glow, 'heavy.bay.port', hull_mat, glow_mat,
                          (-x_sock, 0.04, z_sock),
                          facing='port', detail=detail)

    ln.radial_fan(parts, 'heavy.fan.stern', hull_mat,
                  (0.0, 0.0, l * 0.318),
                  count=_FAN2_N, radius=_FAN2_R, plane='xy',
                  seed=109, detail=detail)

    # Twelve armour tracks. Skip the flank cell that would paint over a socket.
    sx, sy, sz = _SHELL
    y_out = _SPINE_R + sy * 0.5 - _SHELL_BURY
    x_out = _SPINE_R + sx * 0.5 - _SHELL_BURY
    bow_zs = _centers(z_nose + 0.50, z_bow_s - 0.10, sz, _SHELL_PITCH)
    mid_zs = _centers(z_bow_s + 0.10, z_mid_s - 0.10, sz, _SHELL_PITCH)
    stn_zs = _centers(z_mid_s + 0.10, z_stern - 0.50, sz, _SHELL_PITCH)

    tracks = (
        ('dorsal.a',  0.36,  y_out, None),
        ('dorsal.b',  0.00,  y_out, None),
        ('dorsal.c', -0.36,  y_out, None),
        ('ventral.a',  0.36, -y_out, None),
        ('ventral.b',  0.00, -y_out, None),
        ('ventral.c', -0.36, -y_out, None),
        ('stbd.hi',   x_out,  0.36, 'stbd'),
        ('stbd.mid',  x_out,  0.00, 'stbd'),
        ('stbd.lo',   x_out, -0.36, 'stbd'),
        ('port.hi',  -x_out,  0.36, 'port'),
        ('port.mid', -x_out,  0.00, 'port'),
        ('port.lo',  -x_out, -0.36, 'port'),
    )
    seed = 201
    for tag, tx, ty, skip_face in tracks:
        for zone, zs in (('bow', bow_zs), ('mid', mid_zs), ('stern', stn_zs)):
            use = zs
            if skip_face and zone == 'mid':
                use = tuple(z for z in zs if abs(z - z_sock) > sz * 0.45)
            _armour_track(parts, 'heavy.shell.%s.%s' % (tag, zone),
                          hull_mat, tx, ty, use, detail, seed)
            seed += 20

    if detail < 2:
        return

    # ── Sensors, weapons, service band, accents, daughter (detail 2+) ────
    # Mirrored bow pair — same height and station, opposite x.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.teal_optic(parts, glow, 'heavy.optic.bow.' + tag,
                      hull_mat, glow_mat,
                      (side * 0.70, 0.46, z_nose + 0.52),
                      facing='nose', detail=detail)

    # Copy-drifted mid pair — each side samples a new drift.
    drift = ln.copy_drift(67)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        _sc, _rot, off = drift()
        face = 'starboard' if side > 0.0 else 'port'
        hw.teal_optic(parts, glow, 'heavy.optic.mid.' + tag,
                      hull_mat, glow_mat,
                      (side * x_out + off[0], 0.18 + off[1],
                       l * 0.118 + off[2]),
                      facing=face, detail=detail)

    # Weapon petal clusters: mirrored layout, independent seeds.
    z_wpn = l * -0.268
    _weapon_cluster(parts, glow, 'heavy.wpn.stbd', hull_mat, glow_mat,
                    (x_out, 0.22, z_wpn), 'starboard', detail, 401)
    _weapon_cluster(parts, glow, 'heavy.wpn.port', hull_mat, glow_mat,
                    (-x_out, 0.22, z_wpn), 'port', detail, 431)

    # Mid service band only — not on bow or stern decks.
    hw.antenna_forest(parts, glow, 'heavy.ant', hull_mat, glow_mat,
                      (0.0, y_out + 0.02, l * 0.072),
                      count=6, detail=detail, seed=77)

    # Few orange replacement blocks (faction accent, not a coat).
    for i, z_p in enumerate((l * -0.112, l * 0.018, l * 0.142)):
        ln.orange_patch(parts, 'heavy.patch.%d' % i, hull_mat,
                        (0.22 if i != 1 else -0.18, y_out + 0.02, z_p),
                        detail=detail, seed=91 + i)

    # One docked daughter intersecting the bow socket mouth.
    hw.daughter_probe(parts, glow, 'heavy.daughter', hull_mat, glow_mat,
                      (0.0, 0.0, z_nose - 0.38),
                      detail=detail, seed=53, petals=4)
