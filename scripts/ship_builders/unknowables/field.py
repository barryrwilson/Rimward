"""Unknowables ephemeral field language — filaments, loops, arcs, tip.

Bible §4.7: a coherent traveling energy configuration. The plate is lace:
thousands of thin luminous threads, nested dark orbital loops, outer
lensing arcs, and a pointed travel taper. This module emits that language
through kit.* primitives only.

THE ANCHOR RULE: this module NEVER queries the envelope. Every location,
major radius and point list arrives as an argument the class file computed
from surface.py.

OWNER RULES
1. Not a conventional ship: no plates, wings, cockpit, nozzles, windows,
   armour, transom.
2. Not hazy fog blobs. Do not build large soft smoke spheres.
3. Ephemeral: filaments, lace, thin loops, cell knots. Structure is
   implied by threads and cells.
4. The pointed tip is field geometry, not a metal prow.

FORBIDDEN: haze_lobe, smoke sphere, plate_*, greeble, window, nozzle,
barbette, handrail. No random scatter.

Size conventions (verified against the ship_kit.py source):
    kit.cyl / kit.torus / kit.strut   -> real radius / depth
    kit.sphere                        -> RADII per axis
    kit.box family                    -> FULL extents (not used here)
Torus default axis is ship +Y. Face ship +Z with sf.TORUS_FACE_Z.

All glow parts: obj['skin_role'] = 'glow'. Absolute sizes come from
surface.py and are NEVER multiplied by ship l, b or h.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def _glow_tag(obj):
    if obj is not None:
        obj['skin_role'] = 'glow'
    return obj


def _length(a, b):
    return math.sqrt(
        (b[0] - a[0]) * (b[0] - a[0])
        + (b[1] - a[1]) * (b[1] - a[1])
        + (b[2] - a[2]) * (b[2] - a[2])
    )


def _unit(dx, dy, dz):
    n = math.sqrt(dx * dx + dy * dy + dz * dz)
    if n < 1e-9:
        return None
    return (dx / n, dy / n, dz / n)


def _perp(ux, uy, uz):
    if abs(uy) < 0.9:
        cx, cy, cz = 0.0, 1.0, 0.0
    else:
        cx, cy, cz = 1.0, 0.0, 0.0
    return _unit(
        uy * cz - uz * cy,
        uz * cx - ux * cz,
        ux * cy - uy * cx,
    )


def _cross(ax, ay, az, bx, by, bz):
    return (
        ay * bz - az * by,
        az * bx - ax * bz,
        ax * by - ay * bx,
    )


def tie_spoke(glow, name, glow_mat, p0, p1, detail=3):
    """One voxel-safe thread (r=0.08) from p0 to p1. lod0 only."""
    if detail < 3:
        return []
    if _length(p0, p1) < 0.06:
        return []
    obj = kit.strut(glow, name, kit.ROLE_TRIM, p0, p1, glow_mat, 0.08, vertices=6)
    if obj is None:
        return []
    return [_glow_tag(obj)]


def _thread(glow, name, glow_mat, p0, p1, radius):
    if _length(p0, p1) < 0.06:
        return None
    obj = kit.strut(glow, name, kit.ROLE_TRIM, p0, p1, glow_mat, radius, vertices=6)
    return _glow_tag(obj)


def filament_thread(glow, name, glow_mat, p0, p1, detail=3):
    """One thin luminous strut from p0 to p1.

    Radius is FILAMENT_R at every detail. The span must reach 0.06 on the
    long axis or the thread is skipped (sub-voxel parts float).
    """
    _ = detail
    obj = _thread(glow, name, glow_mat, p0, p1, sf.FILAMENT_R)
    if obj is None:
        return []
    return [obj]


def filament_lace(glow, name, glow_mat, points, detail=3):
    """Ordered braid along the given points. Deterministic. No scatter.

    ``points`` is an ordered ship-space polyline the class file computed.
    Detail 3/2 emit three twisted strands; detail 1 emits two; detail 0
    emits the centreline thread only. Each segment shorter than 0.06 is
    skipped so the island voxel never sees a speck.
    """
    if points is None or len(points) < 2:
        return []
    if detail >= 2:
        strands = 3
    elif detail >= 1:
        strands = 2
    else:
        strands = 1
    offset = 0.055
    twist = 0.70
    objs = []
    for i in range(len(points) - 1):
        a = points[i]
        b = points[i + 1]
        if _length(a, b) < 0.06:
            continue
        if strands == 1:
            obj = _thread(glow, '%s-%d' % (name, i), glow_mat, a, b, sf.FILAMENT_R)
            if obj is not None:
                objs.append(obj)
            continue
        d = _unit(b[0] - a[0], b[1] - a[1], b[2] - a[2])
        if d is None:
            continue
        p = _perp(d[0], d[1], d[2])
        if p is None:
            continue
        q = _cross(d[0], d[1], d[2], p[0], p[1], p[2])
        qn = _unit(q[0], q[1], q[2])
        if qn is None:
            continue
        for s in range(strands):
            ang0 = (2.0 * math.pi * s / strands) + (i * twist)
            ang1 = ang0 + twist
            c0, s0 = math.cos(ang0), math.sin(ang0)
            c1, s1 = math.cos(ang1), math.sin(ang1)
            p0 = (
                a[0] + offset * (p[0] * c0 + qn[0] * s0),
                a[1] + offset * (p[1] * c0 + qn[1] * s0),
                a[2] + offset * (p[2] * c0 + qn[2] * s0),
            )
            p1 = (
                b[0] + offset * (p[0] * c1 + qn[0] * s1),
                b[1] + offset * (p[1] * c1 + qn[1] * s1),
                b[2] + offset * (p[2] * c1 + qn[2] * s1),
            )
            obj = _thread(
                glow, '%s-%d-%d' % (name, i, s), glow_mat, p0, p1, sf.FILAMENT_R
            )
            if obj is not None:
                objs.append(obj)
    return objs


def _euler_xyz(rx, ry, rz, vx, vy, vz):
    """Rotate (vx,vy,vz) by Blender XYZ Euler (radians)."""
    cx, sx = math.cos(rx), math.sin(rx)
    y1 = cx * vy - sx * vz
    z1 = sx * vy + cx * vz
    cy, sy = math.cos(ry), math.sin(ry)
    x2 = cy * vx + sy * z1
    z2 = -sy * vx + cy * z1
    cz, sz = math.cos(rz), math.sin(rz)
    return (cz * x2 - sz * y1, sz * x2 + cz * y1, z2)


def tie_ring(glow, name, glow_mat, loc, major, detail=3, rotation=(0.0, 0.0, 0.0)):
    """Spokes from loc to the torus tube so a loop is one island.

    A torus at ``loc`` does not touch a cell at ``loc`` (the cell sits
    in the hole). Threads follow the torus plane (same Euler as kit.torus).
    Radius 0.08 beats the island voxel (0.06); FILAMENT_R does not.
    """
    if major <= sf.LOOP_MINOR + 0.06:
        return []
    if detail < 3:
        return []
    lx, ly, lz = loc
    bx, by, bz = lx, -lz, ly
    objs = []
    for i in range(4):
        ang = 2.0 * math.pi * float(i) / 4.0
        lx_b, ly_b, lz_b = _euler_xyz(
            rotation[0], rotation[1], rotation[2],
            major * math.cos(ang), major * math.sin(ang), 0.0,
        )
        p_b = (bx + lx_b, by + ly_b, bz + lz_b)
        p1 = (p_b[0], p_b[2], -p_b[1])
        obj = kit.strut(
            glow, '%s-%d' % (name, i), kit.ROLE_TRIM,
            loc, p1, glow_mat, 0.08, vertices=6,
        )
        if obj is not None:
            objs.append(_glow_tag(obj))
    return objs


def orbital_loop(glow, name, glow_mat, loc, major, rotation, detail=3):
    """One thin torus. ``major`` and ``rotation`` arrive from the caller."""
    if major <= sf.LOOP_MINOR:
        return []
    obj = kit.torus(
        glow, name, kit.ROLE_TRIM, loc, major, sf.LOOP_MINOR, glow_mat, rotation
    )
    if obj is None:
        return []
    objs = [_glow_tag(obj)]
    objs.extend(
        tie_ring(glow, name + '-tie', glow_mat, loc, major, detail, rotation)
    )
    return objs


def nested_loops(glow, name, glow_mat, loc, majors, tilts, detail=3):
    """Several orbital loops at the same loc, each with its own tilt.

    ``majors`` and ``tilts`` are parallel sequences the class file owns.
    Lower detail keeps the inner loops and drops the outer ones.
    """
    if not majors:
        return []
    count = len(majors)
    if detail < 1:
        count = min(count, 1)
    elif detail < 2:
        count = min(count, 2)
    objs = []
    for i in range(count):
        if i < len(tilts):
            rot = tilts[i]
        else:
            rot = sf.TORUS_FACE_Z
        objs.extend(
            orbital_loop(
                glow, '%s-%d' % (name, i), glow_mat, loc, majors[i], rot, detail
            )
        )
    return objs


def lensing_arc(glow, name, glow_mat, loc, major, rotation, detail=3):
    """Outer dark lensing ring: a thinner torus than an orbital loop."""
    _ = detail
    if major <= sf.ARC_MINOR:
        return []
    obj = kit.torus(
        glow, name, kit.ROLE_TRIM, loc, major, sf.ARC_MINOR, glow_mat, rotation
    )
    if obj is None:
        return []
    objs = [_glow_tag(obj)]
    objs.extend(
        tie_ring(glow, name + '-tie', glow_mat, loc, major, detail, rotation)
    )
    return objs


def field_tip(glow, name, glow_mat, loc, length, detail=3):
    """Pointed travel taper of thin meridians and rings. Not a solid cone.

    ``loc`` is the tip point (ship -Z). ``length`` runs aft toward +Z into
    the field. Meridians meet at the point. Rings shrink toward the tip.
    """
    if length < 0.06:
        return []
    if detail >= 3:
        n = 8
    elif detail >= 2:
        n = 6
    else:
        n = 4
    base_r = max(0.18, length * 0.22)
    lx, ly, lz = loc
    base_z = lz + length
    objs = []
    for i in range(n):
        ang = 2.0 * math.pi * i / n
        p1 = (
            lx + base_r * math.cos(ang),
            ly + base_r * math.sin(ang),
            base_z,
        )
        obj = _thread(
            glow, '%s-meridian-%d' % (name, i), glow_mat, loc, p1, sf.FILAMENT_R
        )
        if obj is not None:
            objs.append(obj)
    rings = ((0.45, 0.45), (0.85, 0.92))
    if detail < 1:
        rings = ((0.85, 0.92),)
    for ri, (t, rf) in enumerate(rings):
        major = base_r * rf
        if major <= sf.LOOP_MINOR:
            continue
        rloc = (lx, ly, lz + length * t)
        obj = kit.torus(
            glow, '%s-ring-%d' % (name, ri), kit.ROLE_TRIM,
            rloc, major, sf.LOOP_MINOR, glow_mat, sf.TORUS_FACE_Z,
        )
        if obj is not None:
            objs.append(_glow_tag(obj))
    return objs
