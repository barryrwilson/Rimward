"""Assembly surface language: repeated modules, joints, radial fans.

Bible §4.8 / synthesis §G6: one part, many copies, radial and linear arrays,
visible joints. This module builds geometry through ship_kit only. It never
queries a hull — the caller passes loc, size, radius and optional ``surf``
callables computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point in the kit. Absolute sf.* constants go
into kit.box at their stated values. Human and Assembly module sizes are
NEVER multiplied by ship l, b or h.

Copy-drift is systematic and small (a few percent), seeded through kit.rng.
It is how generations of the same module mismatch — not random junk.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
import mathutils

from . import surface as sf


# Petal long axis after kit.taper_block is ship +Z (Blender +Y).
_BL_LONG = mathutils.Vector((0.0, 1.0, 0.0))

_PLANES = {
    'xy': ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0)),  # normal +Z, stern / bow fan
    'xz': ((1.0, 0.0, 0.0), (0.0, 0.0, 1.0)),  # normal +Y, dorsal / ventral fan
    'yz': ((0.0, 1.0, 0.0), (0.0, 0.0, 1.0)),  # normal +X, side fan
}

_FACE_DIR = {
    'nose': (0.0, 0.0, -1.0),
    'stern': (0.0, 0.0, 1.0),
    'port': (-1.0, 0.0, 0.0),
    'starboard': (1.0, 0.0, 0.0),
    'up': (0.0, 1.0, 0.0),
    'down': (0.0, -1.0, 0.0),
}


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _ship_to_bl(d):
    return mathutils.Vector((d[0], -d[2], d[1]))


def _aim_long_axis(obj, ship_dir):
    """Rotate a kit part so its ship +Z long axis matches ``ship_dir``."""
    target = _ship_to_bl(ship_dir)
    if target.length < 1e-6:
        return
    obj.rotation_euler = _BL_LONG.rotation_difference(target.normalized()).to_euler()


def copy_drift(seed):
    """Return a callable that yields (scale_mul, rot_euler, offset).

    Scale mul is a 3-tuple near 1.0 (±4 %). Rotation is a small Euler in
    radians (~2 deg). Offset is a few centimetres of world-unit translation.
    Deterministic via kit.rng(seed). Each call advances the stream.
    """
    rand = kit.rng(int(seed) & 0xFFFFFFFF)

    def sample():
        def j(amp):
            return (rand() - 0.5) * 2.0 * amp
        scale = (1.0 + j(0.04), 1.0 + j(0.04), 1.0 + j(0.03))
        rot = (j(0.04), j(0.04), j(0.04))
        off = (j(0.03), j(0.03), j(0.03))
        return scale, rot, off
    return sample


def joint_ring(parts, name, mat, loc, radius, detail=3):
    """Visible mechanical joint between two spine copies.

    FACING: wraps the spine about ship Z. ``loc`` is the ring centre on the
    bay end face. ``radius`` is the host bay radius; the ring stands slightly
    proud so the joint reads as a clamp, not a painted line.

    Detail: 0 = nothing (the bay mass carries the silhouette); 1 = recess
    collar; 2+ = collar plus a thin torus bead.
    """
    if detail < 1:
        return []
    objs = []
    r = max(radius, 0.12)
    collar = kit.cyl(parts, name + '.collar', kit.ROLE_RECESS, loc,
                     r + 0.05, sf.JOINT_THICK, mat,
                     rotation=sf.CYL_ALONG_Z, vertices=12)
    if collar:
        objs.append(collar)
    if detail >= 2:
        bead = kit.torus(parts, name + '.bead', kit.ROLE_TRIM, loc,
                         r + 0.04, sf.JOINT_MINOR, mat,
                         rotation=sf.CYL_ALONG_Z)
        if bead:
            objs.append(bead)
    return objs


def spine_segment(parts, name, mat, loc, radius, length, detail=3, seed=1):
    """One charcoal octagonal spine bay with a visible stern joint ring.

    FACING: long axis along ship Z. ``loc`` is the bay centre. ``radius`` and
    ``length`` are full-size figures (kit.chamfer_block takes FULL extents).
    The stern joint is built inboard of the +Z end face so it overlaps the
    bay by ≥ 0.10.

    Detail: 0/1 = bay mass; 2+ = bay plus joint_ring. Copy-drift jitters the
    bay scale a few percent so adjacent bays read as successive generations.
    """
    objs = []
    drift = copy_drift(seed)()
    sc, _rot, off = drift
    r = max(radius * sc[0], 0.16)
    ln = max(length * sc[2], 0.40)
    cx, cy, cz = _add(loc, off)
    bay = kit.chamfer_block(parts, name + '.bay', kit.ROLE_HULL,
                            (cx, cy, cz), (r * 2.0, r * 2.0, ln), mat,
                            chamfer=r * 0.35)
    if bay:
        objs.append(bay)
    if detail >= 2:
        # Stern face, pulled 0.05 inboard so the ring bites the bay.
        jz = cz + ln * 0.5 - 0.05
        objs.extend(joint_ring(parts, name + '.joint', mat,
                               (cx, cy, jz), r, detail=detail))
    return objs


def shell_module(parts, name, mat, loc, size, detail=3, seed=1):
    """One weathered off-white shell clamped onto a spine.

    FACING: the box axes follow ship axes. ``loc`` is the module centre;
    the caller seats it so the inboard face overlaps the spine by ≥ 0.10.
    ``size`` is FULL extents.

    Detail: 0/1 = shell mass; 2 = shell plus a recess lip; 3 = lip plus one
    calm panel line (55–80 % of the face stays empty).
    """
    objs = []
    sx, sy, sz = size
    sc, _rot, off = copy_drift(seed)()
    sx = max(sx * sc[0], 0.20)
    sy = max(sy * sc[1], 0.16)
    sz = max(sz * sc[2], 0.28)
    cx, cy, cz = _add(loc, off)
    body = kit.chamfer_block(parts, name + '.shell-module', kit.ROLE_ARMOUR,
                             (cx, cy, cz), (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.18)
    if body:
        objs.append(body)
    if detail >= 2:
        # Recess lip on the outboard +Y face, proud 0.03, buried 0.04.
        lip = kit.box(parts, name + '.lip', kit.ROLE_RECESS,
                      (cx, cy + sy * 0.5 - 0.01, cz),
                      (sx * 0.72, 0.08, sz * 0.72), mat)
        if lip:
            objs.append(lip)
    if detail >= 3:
        before = len(parts)
        kit.panel_lines(parts, name + '.seam', (cx, cy + sy * 0.5, cz),
                        (sx * 0.70, 0.08, sz * 0.70), mat,
                        count=1, axis='z', depth=0.08)
        objs.extend(parts[before:])
    return objs


def orange_patch(parts, name, mat, loc, size=None, detail=3, seed=1):
    """One faded-orange replacement panel — the block accent.

    FACING: box axes follow ship axes. ``loc`` is the panel centre. Default
    ``size`` is sf.ORANGE_PATCH (FULL extents). Coverage is controlled by
    how many patches the class file places, never by accent_density.

    Detail: 0 = nothing (accent is not a primary mass); 1+ = the block.
    """
    if detail < 1:
        return []
    if size is None:
        size = sf.ORANGE_PATCH
    sx, sy, sz = size
    sc, _rot, off = copy_drift(seed)()
    sx = max(sx * sc[0], 0.20)
    sy = max(sy * sc[1], 0.08)
    sz = max(sz * sc[2], 0.20)
    cx, cy, cz = _add(loc, off)
    panel = kit.box(parts, name + '.orange-patch', kit.ROLE_ACCENT,
                    (cx, cy, cz), (sx, sy, sz), mat)
    if panel:
        return [panel]
    return []


def fan_petal(parts, name, mat, loc, facing='up', size=None, detail=3, seed=1):
    """One fan / survey petal module. Tip points along ``facing``.

    FACING: nose / stern / port / starboard / up / down. ``loc`` is the
    petal centre. The wide root is toward the opposite of ``facing`` so a
    caller can bury 0.10 of length into a hub. ``size`` defaults to the
    absolute FAN_PETAL_* module (FULL extents: width, thickness, length).

    Detail: 0 = nothing; 1+ = the petal mass. Copy-drift jitters scale.
    """
    if detail < 1:
        return []
    if size is None:
        size = (sf.FAN_PETAL_W, sf.FAN_PETAL_T, sf.FAN_PETAL_LEN)
    d = _FACE_DIR.get(facing, facing)
    if not isinstance(d, tuple):
        d = (0.0, 1.0, 0.0)
    sc, _rot, off = copy_drift(seed)()
    sx = max(size[0] * sc[0], 0.16)
    sy = max(size[1] * sc[1], 0.08)
    sz = max(size[2] * sc[2], 0.28)
    cx, cy, cz = _add(loc, off)
    petal = kit.taper_block(parts, name + '.fan-petal', kit.ROLE_ARMOUR,
                            (cx, cy, cz), (sx, sy, sz), mat,
                            front=(0.38, 0.80), back=(1.0, 1.0))
    if not petal:
        return []
    # taper_block tip is ship -Z; aim that axis along facing.
    _aim_long_axis(petal, (-d[0], -d[1], -d[2]))
    return [petal]


def radial_fan(parts, name, mat, loc, count=10, radius=1.40, petal_size=None,
               plane='xy', seed=1, detail=3):
    """Radial array of identical petal modules — the §G2 outline-breaker.

    FACING: ``plane`` is the petal plane ('xy' normal +Z, 'xz' normal +Y,
    'yz' normal +X). ``loc`` is the hub centre. ``radius`` is hub-centre to
    petal-root. The hub disc grows to that ring (``hub_r = radius - 0.02``).
    Each petal also gets a root peg (cyl/strut, r ≥ 0.08) that buries
    ≥ 0.20 into the hub and ≥ 0.20 into the petal so large-R fans stay
    26-connected at voxel 0.06. Outer fan reach is
    ``radius + petal_len - bury``. ``petal_size`` is the absolute module
    (width, thick, length); default FAN_PETAL_*. The fan as a WHOLE grows
    by raising ``count`` and ``radius``; the petal module stays one size.

    Generation ``seed`` drives copy-drift on every petal (scale and a few
    degrees of angle). Hub is charcoal; petals are off-white armour.

    Detail: 0 = hub mass; 1 = hub plus 3 petals; 2 = half of ``count``;
    3 = full ``count``.
    """
    if petal_size is None:
        petal_size = (sf.FAN_PETAL_W, sf.FAN_PETAL_T, sf.FAN_PETAL_LEN)
    pw, pt, pl = petal_size
    if plane not in _PLANES:
        plane = 'xy'
    u, v = _PLANES[plane]
    if detail >= 3:
        n = max(3, int(count))
    elif detail == 2:
        n = max(3, int(count) // 2)
    elif detail == 1:
        n = 3
    else:
        n = 0

    objs = []
    # Hub reaches the petal-root ring. Pegs (below) pin each petal into it.
    bury = 0.28
    hub_r = max(0.28, radius - 0.02)
    peg_r = 0.14
    peg_in = 0.40
    peg_out = 0.40
    hub_d = max(0.28, pt * 2.2)
    if plane == 'xy':
        hub_rot = sf.CYL_ALONG_Z
    elif plane == 'xz':
        hub_rot = sf.CYL_ALONG_Y
    else:
        hub_rot = sf.CYL_ALONG_X
    hub = kit.cyl(parts, name + '.hub', kit.ROLE_HULL, loc,
                  hub_r, hub_d, mat, rotation=hub_rot, vertices=12)
    if hub:
        objs.append(hub)
    if detail >= 2:
        ring = kit.torus(parts, name + '.hubjoint', kit.ROLE_RECESS, loc,
                         hub_r * 0.92, sf.JOINT_MINOR, mat,
                         rotation=hub_rot)
        if ring:
            objs.append(ring)
    if n < 1:
        return objs

    drift = copy_drift(seed)
    for i in range(n):
        ang = 2.0 * math.pi * i / n
        sc, _rot, off = drift()
        ang = ang + _rot[2]
        cu = math.cos(ang)
        sv = math.sin(ang)
        radial = (u[0] * cu + v[0] * sv,
                  u[1] * cu + v[1] * sv,
                  u[2] * cu + v[2] * sv)
        # Petal centre: root buried in the hub.
        dist = radius + pl * 0.5 * sc[2] - bury
        pc = _add(_add(loc, off), radial, dist)
        psz = (max(pw * sc[0], 0.16), max(pt * sc[1], 0.08), max(pl * sc[2], 0.28))
        petal = kit.taper_block(parts, '%s.fan-petal.%02d' % (name, i),
                                kit.ROLE_ARMOUR, pc, psz, mat,
                                front=(0.38, 0.80), back=(1.0, 1.0))
        if not petal:
            continue
        # Tip along +radial (taper tip is ship -Z, so aim long axis at -radial).
        _aim_long_axis(petal, (-radial[0], -radial[1], -radial[2]))
        objs.append(petal)
        # Root peg: fat spoke through the root ring. AABB overlap is not
        # enough at large R — the 0.12-thick taper misses the 0.06 voxel.
        pl_half = psz[2] * 0.5
        peg_a = _add(loc, radial, hub_r - peg_in)
        peg_b = _add(pc, radial, -(pl_half - peg_out))
        peg = kit.strut(parts, '%s.fan-peg.%02d' % (name, i), kit.ROLE_RECESS,
                        peg_a, peg_b, mat, peg_r, vertices=8)
        if peg:
            objs.append(peg)
    return objs
