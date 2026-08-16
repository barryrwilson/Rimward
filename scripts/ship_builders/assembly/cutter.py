"""Assembly Cutter — CONTACT PROBE.

Bible §4.8: "A robust survey chassis with several manipulator/inspection
arms, sample exchange ports, and daughter probes arranged around an old
central body." Plate 08-assembly-ship.png is concept art, not a model to
copy: a charcoal structural spine of repeating cylindrical bays with
visible joints; weathered off-white shell modules clamped onto that
spine (not a smooth closed loft); faded orange replacement panels as
BLOCK accents; teal circular optics; a dorsal petal-fan; sample ports;
daughter probes around the mid body.

Construction logic is REPEATED MODULE (synthesis/21 G6). One part, many
copies, radial and linear arrays, visible joints. Variation is systematic
copy-drift inside the shared constructs, not human patchwork. This class
refuses a hull_loft: the old central body IS five-to-six
``ln.spine_segment`` bays on a buried charcoal axle.

BODY PLAN
    Six absolute spine bays (length 2.00, overlap 0.24) on a buried core
    axle. Bow and stern bays sit a few percent smaller than the mid pair
    so the chassis reads as successive generations of the same module.
    Weathered ``ln.shell_module`` clamps occupy port, starboard and
    (on odd bays) dorsal faces. Two ``hw.daughter_probe`` craft sit on
    the mid flanks and INTERSECT a ``hw.fabrication_socket`` plus a solid
    pad — they are not nested inside a hollow hangar (the island probe
    treats boxes as shells). Four manipulator arms (strut + kit boxes +
    ``hw.instrument_petal``) bury into the hull by ≥ 0.10; a fifth
    starboard-high arm is the ONE deliberate asymmetry. Dorsal
    ``ln.radial_fan`` (plane xz) is the §G2 outline-breaker. Nose teal
    optic. Ventral fleet ``hw.docking_collar``. Stern ``hw.drive_face``
    with 4 nozzles. A short ``hw.antenna_forest`` on the mid deck. A
    few ``ln.orange_patch`` blocks.

STATION-LIST REASONING (z as fractions of l; half-extents are the
ABSOLUTE bay radius, never a fraction of the class envelope maxima —
Assembly modules stay one size):
    Bow face at l*-0.490 = -5.390; last bay stern at that run plus the
    six-bay span 10.80 = +5.410. Drive housing back-face stands on the
    last stern; its nozzles sit 0.12 aft (z ≈ +5.530). Max half-beam of
    the spine itself is 0.60 at mid-body; the daughters and the fan
    carry the outline out to the beam.

ZONES (no shell or plate run crosses a bay-joint seam):
    bow   l*-0.490 .. l*-0.159   bays 0–1, ~33 %  survey head + fan
    mid   l*-0.159 .. l* 0.161   bays 2–3, ~33 %  daughters, collar, ports
    stern l* 0.161 .. l* 0.492   bays 4–5, ~33 %  drive house

OUTLINE-BREAKER (G2): the dorsal radial fan. Shared construct
``ln.radial_fan`` seats each petal with bury 0.16, so outer reach is
``R + FAN_PETAL_LEN - 0.16``. Gate: reach ≥ 0.15*l ⇒
``R >= 0.15*l - 1.55 + 0.16``. This file uses
``R = max(0.15*l - FAN_PETAL_LEN + 0.16, 1.12)``. At l = 11.0 that is
R = 1.12 and reach = 2.51 (22.8 % of l).

EMISSIVE BUDGET (≤ 5 % of hull area, teal only):
    nose iris; two daughter eyes plus their tiny stern sockets; two
    sample-port irises (detail ≥ 2); four drive discs; one collar status
    slit; one antenna-tip marker. AUTHORED AIM: glow face area ≈ 0.9
    against a hull area ≈ 70–80 (≈ 1.2 %).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; fan / antenna / arm / plate counts halve internally
    1  spine + core + fan hub + shells + daughter bodies + collar +
       drive + nose optic + arm root pads and first boom
    0  spine bays + core axle + drive housing + fan hub

DENSITY (MEASURED 2026-08-15, measure-ships + three.js tri count):
    Commands: blender -b -P scripts/build-ship-assets.py -- assembly,
              node scripts/compress-ship-assets.mjs assembly,
              node scripts/measure-ships.mjs assembly,
              node scripts/probe-ship-islands.mjs assembly cutter lod0
    detail 3  27,240 verts / 15,880 lod0 triangles
    detail 2  14,056 triangles
    detail 1  2,440 triangles
    Max span 11.0; len/beam 1.37; ht/len 0.44; beam/len 0.73.
    Proxy cover 99.7 %; ONE CONNECTED BODY at 0.06 voxels.
    Inside SHIP_SCALE.cutter.hull band 6 000-47 000 and the
    60 000 / 24 000 / 8 000 / 4 000 LOD triangle caps.

Extent budget (absolute ship-space, l=11.0  b=5.28  h=3.30):
    z  min ≈ -5.43 (nose iris)     max ≈ +5.53 (drive discs)  spanZ ≈ 10.96
    x  min ≈ -4.01 (port petals)   max ≈ +4.01                spanX ≈  8.02
    y  min ≈ -0.82 (collar barrel) max ≈ +2.05 (antenna tip)  spanY ≈  2.87
    spanZ/spanX ≈ 1.37 ≥ 1.15; spanY/spanZ ≈ 0.26 ≤ 0.60;
    spanX/spanZ ≈ 0.73 ≥ 0.16.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


# Absolute repeated-module sizes. Never multiplied by ship l, b or h.
_BAY_N = 6
_BAY_LEN = 2.00
_BAY_OVER = 0.24
_BAY_PITCH = _BAY_LEN - _BAY_OVER
_SPINE_SPAN = _BAY_LEN + (_BAY_N - 1) * _BAY_PITCH
_BAY_R = 0.60
_FAN_BURY = 0.16
_SHELL = (0.72, 0.44, 1.52)
_PAD = (0.40, 0.48, 0.66)


# ===========================================================================
# STATION LIST
# ===========================================================================

def _cutter_stations(l, b, h):
    """Spine envelope stations. Not lofted — the bays ARE the hull.

    Half-extents are the absolute bay radius, clamped so a wider class
    envelope cannot swell the module. z tracks class length so the six
    bays fill the cutter run. y_offset 0.0 throughout: the old chassis
    sits on its own centreline.

    Bow face at l*-0.490; last stern at bow + _SPINE_SPAN.
    Bow/mid seam at l*-0.159; mid/stern seam at l*+0.161.
    """
    r = min(_BAY_R, b * 0.22, h * 0.32)
    z0 = l * -0.490
    z1 = z0 + _SPINE_SPAN
    return [
        sf.fair(z0,                 r * 0.92, r * 0.92, 0.0),
        sf.fair(z0 + _BAY_PITCH,    r * 0.96, r * 0.96, 0.0),
        sf.fair(z0 + _BAY_PITCH * 2, r,        r,        0.0),
        sf.fair(z0 + _BAY_PITCH * 3, r,        r,        0.0),
        sf.fair(z0 + _BAY_PITCH * 4, r * 0.98, r * 0.98, 0.0),
        sf.fair(z0 + _BAY_PITCH * 5, r * 0.95, r * 0.95, 0.0),
        sf.fair(z1,                 r * 0.94, r * 0.94, 0.0),
    ]


def _bay_radius(i):
    """Slight generation step: mid bays are the fullest copies."""
    if i <= 1:
        return _BAY_R * 0.94
    if i >= 4:
        return _BAY_R * 0.97
    return _BAY_R


def _bay_center_z(l, i):
    return l * -0.490 + _BAY_LEN * 0.5 + i * _BAY_PITCH


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _fan_radius(l):
    """Hub-to-petal-root radius meeting the G2 outer-reach gate."""
    need = 0.15 * l - sf.FAN_PETAL_LEN + _FAN_BURY
    return max(need, 1.12)


# ===========================================================================
# MANIPULATOR ARM
# ===========================================================================

def _manip_arm(parts, name, hull_mat, root, elbow, wrist, facing, detail):
    """One inspection arm: root pad + strut + boxes + tip petal.

    ``root`` sits ≥ 0.10 inside a spine bay. The pad overlaps that bay.
    The first boom is a primary mass (detail 1+). The fore boom, wrist
    and instrument petal appear at detail 2+.
    """
    if detail < 1:
        return
    kit.box(parts, name + '.rootpad', kit.ROLE_HULL, root,
            (0.28, 0.22, 0.30), hull_mat)
    kit.strut(parts, name + '.boom', kit.ROLE_TRIM,
              root, elbow, hull_mat, 0.07, vertices=8)
    kit.box(parts, name + '.elbow', kit.ROLE_HULL, elbow,
            (0.22, 0.22, 0.28), hull_mat)
    if detail < 2:
        return
    kit.strut(parts, name + '.fore', kit.ROLE_TRIM,
              elbow, wrist, hull_mat, 0.06, vertices=8)
    kit.box(parts, name + '.wrist', kit.ROLE_HULL, wrist,
            (0.18, 0.18, 0.22), hull_mat)
    d = {
        'port': (-1.0, 0.0, 0.0),
        'starboard': (1.0, 0.0, 0.0),
        'up': (0.0, 1.0, 0.0),
        'down': (0.0, -1.0, 0.0),
        'nose': (0.0, 0.0, -1.0),
        'stern': (0.0, 0.0, 1.0),
    }.get(facing, (1.0, 0.0, 0.0))
    bury = 0.12
    pc = _add(wrist, d, sf.PETAL_LEN * 0.5 - bury)
    hw.instrument_petal(parts, name + '.tip', hull_mat, pc,
                        facing=facing, detail=detail)


def _clamp_shell(parts, name, hull_mat, loc, size, detail, seed):
    """One shell module plus fore/aft clamp rings (visible joints)."""
    ln.shell_module(parts, name, hull_mat, loc, size,
                    detail=detail, seed=seed)
    if detail < 2:
        return
    sx, sy, sz = size
    cr = max(min(sx, sy) * 0.42, 0.16)
    ln.joint_ring(parts, name + '.foreclamp', hull_mat,
                  (loc[0], loc[1], loc[2] - sz * 0.28), cr, detail=detail)
    ln.joint_ring(parts, name + '.aftclamp', hull_mat,
                  (loc[0], loc[1], loc[2] + sz * 0.28), cr, detail=detail)
    npl = 6 if detail >= 3 else 3
    # Sit the course in the shell top so each plate buries ≥ 0.10.
    kit.plate_course(parts, name + '.plates', kit.ROLE_ARMOUR,
                     (loc[0], loc[1] + sy * 0.5 - 0.06, loc[2]),
                     (sx * 0.70, 0.14, sz * 0.82),
                     hull_mat, count=npl, axis='z', gap=0.16)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly contact probe (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 halved counts, all equipment kept
                1 spine + shells + fan hub + daughters + collar + drive
                0 spine + core + drive + fan hub.

    MEASURED 2026-08-15 (measure-ships assembly):
        detail 3  27,240 hull verts / 15,880 lod0 triangles
        max span 11.0, len/beam 1.37, ht/len 0.44, beam/len 0.73
        proxy cover 99.7 %, ONE CONNECTED BODY at 0.06 voxels
        inside SHIP_SCALE.cutter.hull band 6 000-47 000
    """
    H = kit.ROLE_HULL

    stations = _cutter_stations(l, b, h)

    z_bow = l * -0.490
    z_stern = z_bow + _SPINE_SPAN
    z_bow_s = l * -0.159
    z_mid_s = l * 0.161

    # ── Buried charcoal axle (always) — keeps the six bays one body ──────
    kit.cyl(parts, 'cutter.core', H, (0.0, 0.0, 0.5 * (z_bow + z_stern)),
            0.28, _SPINE_SPAN - 0.20, hull_mat,
            rotation=sf.CYL_ALONG_Z, vertices=12)

    # ── OLD SPINE — six repeated bays, visible stern joints (always) ─────
    for i in range(_BAY_N):
        cz = _bay_center_z(l, i)
        rr = _bay_radius(i)
        ln.spine_segment(parts, 'cutter.spine.%02d' % i, hull_mat,
                         (0.0, 0.0, cz), rr, _BAY_LEN,
                         detail=detail, seed=20 + i)

    # Extra nose clamp plus the two zone seams (visible generation joints).
    if detail >= 2:
        ln.joint_ring(parts, 'cutter.spine.nose', hull_mat,
                      (0.0, 0.0, z_bow + 0.10), _bay_radius(0),
                      detail=detail)
        ln.joint_ring(parts, 'cutter.zone.bow', hull_mat,
                      (0.0, 0.0, z_bow_s), _BAY_R, detail=detail)
        ln.joint_ring(parts, 'cutter.zone.mid', hull_mat,
                      (0.0, 0.0, z_mid_s), _BAY_R, detail=detail)

    # ── DRIVE FACE — last stern, 4 countable nozzles (always) ────────────
    # loc is the transom plane; the construct buries 0.12 of the housing.
    sec_t = sf.section(stations, z_stern)
    hw.drive_face(parts, glow, 'cutter.drive', hull_mat, glow_mat,
                  (0.0, 0.0, z_stern),
                  min(sec_t[0], 0.50), min(sec_t[1], 0.42),
                  nozzles=4, depth=0.50, detail=detail)

    # ── DORSAL RADIAL FAN — §G2 outline-breaker (always; hub at detail 0)
    z_fan = _bay_center_z(l, 1)
    fan_r = _fan_radius(l)
    hub_d = max(0.28, sf.FAN_PETAL_T * 2.2)
    fan_y = sf.top_y(stations, z_fan) - 0.10 + hub_d * 0.5
    ln.radial_fan(parts, 'cutter.fan', hull_mat,
                  (0.0, fan_y, z_fan),
                  count=10, radius=fan_r, plane='xz',
                  seed=61, detail=detail)

    if detail < 1:
        return

    # ── CLAMPED SHELL MODULES — port / starboard every bay; dorsal odd ───
    sx, sy = _SHELL[0], _SHELL[1]
    bury = 0.14
    for i in range(_BAY_N):
        cz = _bay_center_z(l, i)
        # Shells stay inside their own bay; they never cross a zone seam.
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            fx = sf.flank_x(stations, cz, 0.0)
            if fx <= 0.05:
                continue
            cx = side * (fx + sx * 0.5 - bury)
            _clamp_shell(parts, 'cutter.shell.%s.%02d' % (tag, i),
                         hull_mat, (cx, 0.0, cz), _SHELL,
                         detail, seed=70 + i * 2 + (1 if side < 0.0 else 0))
        if i % 2 == 1:
            ty = sf.top_y(stations, cz)
            _clamp_shell(parts, 'cutter.shell.dorsal.%02d' % i,
                         hull_mat, (0.0, ty + sy * 0.5 - bury, cz),
                         _SHELL, detail, seed=90 + i)

    # ── NOSE TEAL OPTIC (detail 1+) ──────────────────────────────────────
    hw.teal_optic(parts, glow, 'cutter.eye', hull_mat, glow_mat,
                  (0.0, 0.0, z_bow), facing='nose', detail=detail)

    # ── VENTRAL DOCKING COLLAR — fleet bore 0.62 (detail 1+) ─────────────
    z_cc = _bay_center_z(l, 3)
    hw.docking_collar(parts, glow, 'cutter.collar', hull_mat, glow_mat,
                      (0.0, sf.bottom_y(stations, z_cc), z_cc),
                      facing='down', detail=detail)

    # ── SAMPLE PORTS + PADS — mid body, one per flank (detail 1+) ────────
    # Solid pads (kit.box) plus fabrication sockets. Daughters INTERSECT
    # these solids; they are not placed inside a hollow volume.
    z_dau = 0.0
    for side, tag, face in ((1.0, 'stbd', 'starboard'),
                            (-1.0, 'port', 'port')):
        fx = sf.flank_x(stations, z_dau, 0.0)
        loc_sock = (side * fx, 0.0, z_dau)
        hw.fabrication_socket(parts, glow, 'cutter.port.' + tag,
                              hull_mat, glow_mat, loc_sock,
                              facing=face, detail=detail)
        pad_x = side * (fx + _PAD[0] * 0.5 - 0.16)
        kit.box(parts, 'cutter.pad.' + tag, H,
                (pad_x, 0.0, z_dau), _PAD, hull_mat)

    # ── TWO DAUGHTER PROBES — mid flanks, intersecting pad + socket ──────
    # Body radius 1.35; centre sits so the sphere bites the pad by ≥ 0.20
    # and the socket collar by ≥ 0.10. Never nested in a hangar box.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        fx = sf.flank_x(stations, z_dau, 0.0)
        dx = side * (fx + sf.DAUGHTER_BODY_R - 0.35)
        hw.daughter_probe(parts, glow, 'cutter.daughter.' + tag,
                          hull_mat, glow_mat, (dx, 0.0, z_dau),
                          detail=detail, seed=110 if side > 0.0 else 111,
                          petals=4)

    # ── MANIPULATOR ARMS — roots inside the bays (detail 1+) ─────────────
    # Bow pair at detail 1+. Mid pair only at detail 3 (half the arms
    # at the middle ladder). The extra high arm is the one asymmetry.
    z0 = _bay_center_z(l, 0)
    z4 = _bay_center_z(l, 4)
    arms = [
        # bow pair — reach forward-out-down, tips stay short of the nose
        ('bow.stbd',
         (0.38, 0.08, z0), (1.15, -0.12, z0 - 0.40),
         (1.52, -0.32, z0 - 0.70), 'starboard'),
        ('bow.port',
         (-0.38, 0.08, z0), (-1.15, -0.12, z0 - 0.40),
         (-1.52, -0.32, z0 - 0.70), 'port'),
    ]
    if detail >= 3:
        # Stern-zone pair: clear of the mid-body daughter spheres.
        arms.extend([
            ('stern.stbd',
             (0.38, 0.04, z4), (1.28, -0.06, z4 + 0.18),
             (1.78, -0.18, z4 + 0.40), 'starboard'),
            ('stern.port',
             (-0.38, 0.04, z4), (-1.28, -0.06, z4 + 0.18),
             (-1.78, -0.18, z4 + 0.40), 'port'),
        ])
    for tag, root, elbow, wrist, face in arms:
        _manip_arm(parts, 'cutter.arm.' + tag, hull_mat,
                   root, elbow, wrist, face, detail)

    # THE ONE ASYMMETRY — extra starboard-high inspection arm on bay 1.
    if detail >= 2:
        z1 = _bay_center_z(l, 1)
        _manip_arm(parts, 'cutter.arm.high.stbd', hull_mat,
                   (0.36, 0.22, z1),
                   (1.18, 0.52, z1 - 0.22),
                   (1.58, 0.74, z1 - 0.48),
                   'up', detail)

    if detail < 2:
        return

    # ── ORANGE PATCHES — few block accents (detail 2+) ───────────────────
    # Coverage is the count, never accent_density. Three patches, ~4 %.
    ln.orange_patch(parts, 'cutter.patch.bow.stbd', hull_mat,
                    (sf.flank_x(stations, _bay_center_z(l, 0), 0.12) - 0.02,
                     0.12, _bay_center_z(l, 0)),
                    detail=detail, seed=130)
    ln.orange_patch(parts, 'cutter.patch.mid.dorsal', hull_mat,
                    (0.10, sf.top_y(stations, _bay_center_z(l, 3)) - 0.02,
                     _bay_center_z(l, 3)),
                    size=(0.58, 0.16, 0.44),
                    detail=detail, seed=131)
    ln.orange_patch(parts, 'cutter.patch.stern.port', hull_mat,
                    (-(sf.flank_x(stations, _bay_center_z(l, 5), -0.08) - 0.02),
                     -0.08, _bay_center_z(l, 5)),
                    detail=detail, seed=132)

    # ── SHORT ANTENNA FOREST — mid-spine deck (detail 2+) ────────────────
    z_ant = _bay_center_z(l, 3) + 0.20
    hw.antenna_forest(parts, glow, 'cutter.ants', hull_mat, glow_mat,
                      (0.0, sf.top_y(stations, z_ant), z_ant),
                      count=4, detail=detail, seed=140)
