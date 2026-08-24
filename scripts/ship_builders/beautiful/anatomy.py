"""Beautiful Ones anatomy — four body plans in one tissue lineage.

Bible section 4.6: living kin, not organic machines. This module is the
surface of a grown body. There are no plates, no courses, no seams, no
collars, no rivets, no kitbash, no kit.box crease floors.

THE ANCHOR RULE (pipeline §6): no construct here takes a typed y fraction
of the ship. Every run takes a ``surf`` callback from surface.py and
re-samples at its OWN station, skipping any element whose sample is 0.0.
Every point path is computed by the class file from surface queries and
passed in explicitly. Roots handed inside the hull are used as given.

PAINT (dual rule — kit role tags AND skin name selectors must agree):
    pearl membrane   kit.ROLE_ARMOUR  names 'living-…' / 'fin-…'   #B0A8BE
    base tissue      kit.ROLE_HULL    (deep indigo body)           #6B617B
    violet nerve     kit.ROLE_ACCENT  names 'nerve-…' / 'sensory-…' #7850D4
    bright pearl     kit.ROLE_TRIM    flow lines, lips, welts      pearl x1.12
    crease floor     kit.ROLE_RECESS  dark indigo                  base x0.62
    emissive         glow list, obj['skin_role'] = 'glow'          #69D8E2

Size conventions (verified against ship_kit.py):
    kit.sphere        scale is RADII per axis
    kit.strut         real radius between two ship-space points; returns
                      None for a near-zero span — always filter
    grown lofts here  absolute ship-space rings, welded caps
Nothing here is scaled by ship l, b or h; filament, vein and flow-line
sizes come from the absolute sf.* living module.

Detail ladder: 3 = full, 2 = fewer repeats, 1 = primary + hints,
0 = primary masses only.

Public API
----------
Tissue (all four plans):
    flow_line(parts, name, mat, path, thick=sf.FLOW_R, detail=3, role=None)
    vein_fan(parts, glow, name, hull_mat, glow_mat, root, tips, out,
             detail=3, nodes=True)
    healed_scar(parts, name, mat, path, thick=0.08, detail=3, role=None)
    nacre_pads(parts, name, mat, path, radii, detail=3, role=None, seed=1)
    grown_lip(parts, name, mat, loc, axis_u, axis_v, out, count=10,
              bead_r=0.14, seed=1, detail=3, role=None)
    muscle_fold(parts, name, mat, z0, z1, surf, y, side=1.0, detail=3)
    fusiform_stations(z_nose, z_stern, max_hw, max_hh, y_offset=0.0,
                      peak_t=0.32, n=7)

Shark (light, cutter):
    shark_dorsal(parts, name, mat, root, tip, root_chord, thick=0.14, detail=3)
    shark_caudal(parts, name, mat, peduncle, upper_tip, lower_tip,
                 root_chord, thick=0.12, detail=3)
    shark_pectoral(parts, name, mat, root, tip, root_chord, tip_chord=0.16,
                   thick=0.12, detail=3)
    gill_slits(parts, name, mat, z0, z1, surf, y, side=1.0, count=5,
               height=0.38, detail=3)

Squid (ace):
    squid_mantle_fins(parts, name, mat, loc, span=1.8, chord=1.2,
                      thick=0.14, detail=3)
    squid_arm(parts, name, mat, root, tip, root_r=0.16, tip_r=0.07,
              suckers=True, inward=None, detail=3)
    feeding_tentacle(parts, name, mat, root, tip, root_r=0.12, club_r=0.20,
                     suckers=True, inward=None, detail=3)
    sucker_pads(parts, name, mat, path, inward, radius=0.08, detail=3)
    siphon(parts, name, mat, loc, length=0.70, radius=0.16, aim=(0.0, -0.2, 1.0),
           detail=3)

Octopus (frigate):
    octopus_arm(parts, name, mat, root, tip, root_r=0.22, tip_r=0.08,
                suckers=True, inward=None, web_to=None, web_frac=0.28,
                detail=3)
    interbrachial_web(parts, name, mat, hub, arm_tips, thick=0.12,
                      trail=0.30, detail=3)
    travel_arm_tips(hub, length, count=8, spread=0.40, drop=0.22)

Whale (heavy, freighter):
    whale_fluke(parts, name, mat, peduncle, span, chord, thick=0.16, detail=3)
    whale_pectoral(parts, name, mat, root, tip, root_chord, tip_chord=0.22,
                   thick=0.14, style='humpback', detail=3)
    dorsal_ridge(parts, name, mat, z0, z1, surf, x=0.0, height=0.22, detail=3)
    blowhole(parts, glow, name, hull_mat, glow_mat, loc, radius=0.28,
             detail=3, seed=1)
"""
import math
import sys
from pathlib import Path

import bmesh
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


# Absolute floors. Island voxel is 0.06; nothing thinner in all axes.
_THICK_MIN = 0.07
_RADIAL = {3: 12, 2: 10, 1: 8, 0: 6}
_SPAN = {3: 8, 2: 6, 1: 5, 0: 4}
_VEIN_SHEATH = 1.5
_VEIN_CORE = 0.55
_VEIN_CORE_OUT = 0.05
_SCAR_SWELL = 1.3
_FOLD_PITCH = 0.90


def _glow_tag(obj):
    if obj is not None:
        obj['skin_role'] = 'glow'
    return obj


def _clamp_detail(detail):
    return min(max(int(detail), 0), 3)


def _vadd(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def _vsub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _vmul(a, s):
    return (a[0] * s, a[1] * s, a[2] * s)


def _vlen(a):
    return math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])


def _unit(a, fallback=(0.0, 1.0, 0.0)):
    n = _vlen(a)
    if n < 1e-8:
        return fallback
    return (a[0] / n, a[1] / n, a[2] / n)


def _dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def _cross(a, b):
    return (a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0])


def _lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t)


def _perp(vec, tangent):
    t = _unit(tangent)
    return _unit(_vsub(vec, _vmul(t, _dot(vec, t))), fallback=(1.0, 0.0, 0.0))


def _basis(tangent, prefer=(0.0, 1.0, 0.0)):
    t = _unit(tangent)
    u = _perp(prefer, t)
    if _vlen(u) < 0.2:
        u = _perp((1.0, 0.0, 0.0), t)
    v = _unit(_cross(t, u))
    u = _unit(_cross(v, t))
    return t, u, v


def _path_length(path):
    total = 0.0
    for i in range(len(path) - 1):
        total += _vlen(_vsub(path[i + 1], path[i]))
    return total


def _resample(path, n):
    n = max(2, int(n))
    if len(path) < 2:
        return list(path)
    segs = []
    total = 0.0
    for i in range(len(path) - 1):
        d = _vlen(_vsub(path[i + 1], path[i]))
        segs.append(d)
        total += d
    if total < 1e-6:
        return [path[0], path[-1]]
    out = [path[0]]
    for k in range(1, n - 1):
        target = total * k / (n - 1.0)
        acc = 0.0
        placed = False
        for i, d in enumerate(segs):
            if acc + d >= target:
                t = 0.0 if d < 1e-9 else (target - acc) / d
                out.append(_lerp(path[i], path[i + 1], t))
                placed = True
                break
            acc += d
        if not placed:
            out.append(path[-1])
    out.append(path[-1])
    return out


def _finish_loft(bm, name, role, mat, parts):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj


def _ring_loft(parts, name, role, mat, rings):
    """Welded loft through closed rings of equal vertex count (ship-space)."""
    if len(rings) < 2:
        return None
    n = len(rings[0])
    if n < 3:
        return None
    for ring in rings:
        if len(ring) != n:
            return None
    bm = bmesh.new()
    loops = []
    for ring in rings:
        loops.append([bm.verts.new(kit._bloc(p)) for p in ring])
    for ri in range(len(loops) - 1):
        r0, r1 = loops[ri], loops[ri + 1]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
    bm.faces.new(loops[0][::-1])
    bm.faces.new(loops[-1])
    return _finish_loft(bm, name, role, mat, parts)


def _ellipse_ring(centre, u, v, ru, rv, n):
    pts = []
    for i in range(n):
        th = -2.0 * math.pi * i / n
        c, s = math.cos(th), math.sin(th)
        pts.append(_vadd(centre, _vadd(_vmul(u, ru * c), _vmul(v, rv * s))))
    return pts


def _tube_loft(parts, name, role, mat, path, r0, r1, detail, prefer=(0.0, 1.0, 0.0)):
    """Circular tube along an explicit path. Primary limb mass."""
    d = _clamp_detail(detail)
    r0 = max(r0, _THICK_MIN * 0.5)
    r1 = max(r1, _THICK_MIN * 0.5)
    n_span = _SPAN[d]
    n_rad = _RADIAL[d]
    pts = _resample(path, n_span)
    if _path_length(pts) < _THICK_MIN:
        return []
    rings = []
    prev_u = prefer
    for i, p in enumerate(pts):
        if i < len(pts) - 1:
            tang = _vsub(pts[i + 1], p)
        else:
            tang = _vsub(p, pts[i - 1])
        _t, u, v = _basis(tang, prefer=prev_u)
        prev_u = u
        t = i / (len(pts) - 1.0)
        r = r0 + (r1 - r0) * t
        rings.append(_ellipse_ring(p, u, v, r, r, n_rad))
    obj = _ring_loft(parts, name, role, mat, rings)
    return [obj] if obj is not None else []


def _blade_loft(parts, name, role, mat, root, tip, chord_dir, root_c, tip_c,
                root_h, tip_h, detail, profile='triangle'):
    """Planar fin: elliptical section in (chord, thickness), swept root->tip.

    profile 'triangle' lerps chord to the tip.
    profile 'diamond' peaks near mid-span (rhomboid mantle fin).
    profile 'paddle' tapers slowly (cetacean pectoral).
    """
    d = _clamp_detail(detail)
    span = _vsub(tip, root)
    if _vlen(span) < _THICK_MIN:
        return []
    n_span = _SPAN[d]
    n_rad = _RADIAL[d]
    root_c = max(root_c, _THICK_MIN)
    tip_c = max(tip_c, _THICK_MIN)
    root_h = max(root_h, _THICK_MIN * 0.5)
    tip_h = max(tip_h, _THICK_MIN * 0.5)
    chord = _perp(chord_dir, span)
    _t, _u, normal = _basis(span, prefer=chord)
    # Rebuild so u is chord, v is thickness.
    u = chord
    v = _unit(_cross(_unit(span), u))
    if _vlen(v) < 0.2:
        v = normal
    rings = []
    for i in range(n_span):
        t = i / (n_span - 1.0)
        p = _lerp(root, tip, t)
        if profile == 'diamond':
            peak = max(root_c, tip_c) * 1.35
            if t < 0.45:
                ufrac = t / 0.45
                c = root_c + (peak - root_c) * ufrac
            else:
                ufrac = (t - 0.45) / 0.55
                c = peak + (tip_c - peak) * ufrac
        elif profile == 'paddle':
            c = root_c + (tip_c - root_c) * (t ** 0.65)
        else:
            c = root_c + (tip_c - root_c) * t
        h = root_h + (tip_h - root_h) * t
        rings.append(_ellipse_ring(p, u, v, c, h, n_rad))
    obj = _ring_loft(parts, name, role, mat, rings)
    return [obj] if obj is not None else []


def _ribbon_loft(parts, name, role, mat, rail_a, rail_b, thick, detail):
    """Flattened sheet between two rails (interbrachial web, arm webbing)."""
    if len(rail_a) < 2 or len(rail_b) < 2:
        return []
    d = _clamp_detail(detail)
    n = max(len(rail_a), _SPAN[d])
    a = _resample(rail_a, n)
    b = _resample(rail_b, n)
    n_rad = max(6, _RADIAL[d] // 2 * 2)
    thick = max(thick, _THICK_MIN)
    rings = []
    for i in range(n):
        pa, pb = a[i], b[i]
        mid = _lerp(pa, pb, 0.5)
        major = _vsub(pb, pa)
        ru = max(_vlen(major) * 0.5, _THICK_MIN)
        if i < n - 1:
            along = _vadd(_vsub(a[i + 1], pa), _vsub(b[i + 1], pb))
        else:
            along = _vadd(_vsub(pa, a[i - 1]), _vsub(pb, b[i - 1]))
        u = _unit(major, fallback=(1.0, 0.0, 0.0))
        v = _unit(_cross(_unit(along), u), fallback=(0.0, 1.0, 0.0))
        rings.append(_ellipse_ring(mid, u, v, ru, thick * 0.5, n_rad))
    obj = _ring_loft(parts, name, role, mat, rings)
    return [obj] if obj is not None else []


# ===========================================================================
# Tissue
# ===========================================================================
def fusiform_stations(z_nose, z_stern, max_hw, max_hh, y_offset=0.0,
                      peak_t=0.32, n=7):
    """Fair station list for a fusiform grown body (shark / whale).

    z_nose is toward -Z, z_stern toward +Z. peak_t is the fraction from
    nose to maximum girth (just aft of the head). End stations keep a
    positive half-extent so grown_loft never collapses.
    """
    n = max(3, int(n))
    span = z_stern - z_nose
    if span <= 0.0:
        return []
    peak_t = min(max(peak_t, 0.15), 0.55)
    out = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z_nose + t * span
        if t <= peak_t:
            u = t / peak_t
        else:
            u = 1.0 - (t - peak_t) / (1.0 - peak_t)
        s = math.sin(0.5 * math.pi * max(0.0, min(1.0, u)))
        hw = max(0.08, max_hw * max(0.10, s))
        hh = max(0.08, max_hh * max(0.10, s))
        out.append(sf.fair(z, hw, hh, y_offset))
    return out


def flow_line(parts, name, mat, path, thick=sf.FLOW_R, detail=3, role=None):
    """Long thin flow line along an explicit surface ``path``.

    Pearl-bone dorsal tissue meets violet-indigo flanks in gradual flow
    lines. The line is pale (kit.ROLE_TRIM). ``path`` is >= 2 ship-space
    points from surface queries. Consecutive struts share endpoints.

    Detail: 0 single chord; 1 every second point; 2+ full path.
    """
    if role is None:
        role = kit.ROLE_TRIM
    pts = [tuple(p) for p in path]
    if len(pts) < 2:
        return []
    if detail <= 0:
        pts = [pts[0], pts[-1]]
    elif detail == 1 and len(pts) > 2:
        dec = pts[::2]
        if dec[-1] != pts[-1]:
            dec.append(pts[-1])
        pts = dec
    verts = 8 if detail >= 2 else 6
    objs = []
    for i in range(len(pts) - 1):
        seg = kit.strut(parts, '%s.f%02d' % (name, i), role,
                        pts[i], pts[i + 1], mat, radius=thick,
                        vertices=verts)
        if seg is not None:
            objs.append(seg)
    return objs


def vein_fan(parts, glow, name, hull_mat, glow_mat, root, tips, out,
             detail=3, nodes=True):
    """Branching cyan-violet vein from ``root`` to each of ``tips``.

    Each branch is a violet sheath (ROLE_ACCENT, 'nerve-…') plus a cyan
    core offset along ``out``. Skip at detail 0. ``out`` is the unit
    outward of the fold the veins live in.
    """
    if detail < 1:
        return []
    tips = [tuple(t) for t in tips]
    if not tips:
        return []
    if detail >= 3:
        keep = len(tips)
    elif detail == 2:
        keep = max(1, len(tips) // 2)
    else:
        keep = 1
    ox, oy, oz = out
    sheath_r = sf.VEIN_R * _VEIN_SHEATH
    core_r = sf.VEIN_R * _VEIN_CORE
    objs = []
    for i in range(keep):
        tx, ty, tz = tips[i]
        sheath = kit.strut(parts, 'nerve-%s.b%02d' % (name, i),
                           kit.ROLE_ACCENT, root, tips[i], hull_mat,
                           radius=sheath_r, vertices=6)
        if sheath is not None:
            objs.append(sheath)
        ca = (root[0] + ox * _VEIN_CORE_OUT, root[1] + oy * _VEIN_CORE_OUT,
              root[2] + oz * _VEIN_CORE_OUT)
        cb = (tx + ox * _VEIN_CORE_OUT, ty + oy * _VEIN_CORE_OUT,
              tz + oz * _VEIN_CORE_OUT)
        core = kit.strut(glow, 'nerve-%s.c%02d' % (name, i), 'glow',
                         ca, cb, glow_mat, radius=core_r, vertices=6)
        if core is not None:
            objs.append(_glow_tag(core))
        if nodes and detail >= 3:
            node = kit.sphere(glow, 'nerve-%s.n%02d' % (name, i), 'glow',
                              cb, (sf.VEIN_NODE_R,) * 3, glow_mat, segments=8)
            if node is not None:
                objs.append(_glow_tag(node))
    if nodes and detail >= 2:
        rn = kit.sphere(glow, 'nerve-%s.nroot' % name, 'glow',
                        (root[0] + ox * _VEIN_CORE_OUT,
                         root[1] + oy * _VEIN_CORE_OUT,
                         root[2] + oz * _VEIN_CORE_OUT),
                        (sf.VEIN_NODE_R,) * 3, glow_mat, segments=8)
        if rn is not None:
            objs.append(_glow_tag(rn))
    return objs


def healed_scar(parts, name, mat, path, thick=0.08, detail=3, role=None):
    """Pale welt along an explicit surface ``path``. Skip at detail 0."""
    if detail < 1:
        return []
    if role is None:
        role = kit.ROLE_TRIM
    pts = [tuple(p) for p in path]
    if len(pts) < 2:
        return []
    if detail == 1:
        pts = [pts[0], pts[-1]]
    objs = []
    for i in range(len(pts) - 1):
        seg = kit.strut(parts, '%s.s%02d' % (name, i), role,
                        pts[i], pts[i + 1], mat, radius=thick, vertices=8)
        if seg is not None:
            objs.append(seg)
    if detail >= 3:
        for i in range(1, len(pts) - 1):
            sw = kit.sphere(parts, '%s.w%02d' % (name, i), role, pts[i],
                            (thick * _SCAR_SWELL,) * 3, mat, segments=8)
            if sw is not None:
                objs.append(sw)
    return objs


def nacre_pads(parts, name, mat, path, radii, detail=3, role=None, seed=1):
    """Overlapping nacre muscle pads along ``path``. Not plates.

    ``radii`` is (rx, ry, rz) of the first pad; later pads scale down
    slightly. Consecutive centres sit close enough to share voxels.
    Detail 0 still emits pads (they are mass). Skip when path is empty.
    """
    if role is None:
        role = kit.ROLE_ARMOUR
    pts = [tuple(p) for p in path]
    if len(pts) < 1:
        return []
    d = _clamp_detail(detail)
    rx, ry, rz = radii
    rx = max(rx, _THICK_MIN)
    ry = max(ry, _THICK_MIN)
    rz = max(rz, _THICK_MIN)
    rand = kit.rng(seed)
    segs = 12 if d >= 2 else 8
    objs = []
    n = len(pts)
    for i, p in enumerate(pts):
        t = 0.0 if n == 1 else i / (n - 1.0)
        scale = 1.0 - 0.18 * t
        jitter = 0.04 * (rand() - 0.5)
        loc = (p[0], p[1] + jitter, p[2])
        srx, sry, srz = rx * scale, ry * scale, rz * scale
        if n >= 2:
            dists = []
            if i > 0:
                dists.append(_vlen(_vsub(p, pts[i - 1])))
            if i < n - 1:
                dists.append(_vlen(_vsub(pts[i + 1], p)))
            need = min(0.62 * (sum(dists) / len(dists)), max(rz * 2.4, 0.55))
            srz = max(srz, need)
            srx = max(srx, _THICK_MIN)
            sry = max(sry, _THICK_MIN)
        pad = kit.sphere(parts, 'living-%s.p%02d' % (name, i), role, loc,
                         (srx, sry, srz), mat, segments=segs)
        if pad is not None:
            objs.append(pad)
    return objs


def grown_lip(parts, name, mat, loc, axis_u, axis_v, out, count=10,
              bead_r=0.14, seed=1, detail=3, role=None):
    """Irregular oval lip of overlapping nacre beads. Not a torus, not a box.

    ``loc`` is the mouth centre on the skin. ``axis_u`` / ``axis_v`` are
    ellipse half-extent vectors in the mouth plane. ``out`` is unit
    outward. Skip at detail 0.
    """
    if detail < 1:
        return []
    if role is None:
        role = kit.ROLE_ARMOUR
    d = _clamp_detail(detail)
    n = count if d >= 3 else (max(6, count - 2) if d >= 2 else max(5, count // 2))
    rand = kit.rng(seed)
    ox, oy, oz = _unit(out)
    bead_r = max(bead_r, _THICK_MIN)
    objs = []
    for i in range(n):
        ang = 2.0 * math.pi * i / n + rand() * 0.22
        ca, sa = math.cos(ang), math.sin(ang)
        stretch = 1.0 + (rand() - 0.5) * 0.28
        r = bead_r * (0.85 + rand() * 0.30)
        centre = (
            loc[0] + axis_u[0] * ca * stretch + axis_v[0] * sa * stretch
            + ox * (0.04 - r * 0.35),
            loc[1] + axis_u[1] * ca * stretch + axis_v[1] * sa * stretch
            + oy * (0.04 - r * 0.35),
            loc[2] + axis_u[2] * ca * stretch + axis_v[2] * sa * stretch
            + oz * (0.04 - r * 0.35),
        )
        bead = kit.sphere(parts, 'living-lip-%s.b%02d' % (name, i),
                          role, centre, (r, r, r), mat,
                          segments=10 if d >= 3 else 8)
        if bead is not None:
            objs.append(bead)
    return objs


def muscle_fold(parts, name, mat, z0, z1, surf, y, side=1.0, detail=3):
    """Flank muscle gathering as overlapping nacre pads. No box floors.

    ``surf(z)`` is the half-beam at height ``y``. Skip samples of 0.0.
    Skip the whole run at detail 0.
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0:
        return []
    pitch = _FOLD_PITCH if detail >= 3 else (1.4 if detail == 2 else 2.0)
    n_seg = max(2, int(math.ceil(span / pitch)))
    path = []
    for i in range(n_seg):
        cz = z0 + (i + 0.5) * (span / n_seg)
        sx = surf(cz)
        if sx == 0.0:
            continue
        path.append((side * (sx - 0.10), y, cz))
    if len(path) < 1:
        return []
    return nacre_pads(parts, name, mat, path, (0.16, 0.10, 0.22),
                      detail=detail, role=kit.ROLE_HULL, seed=3)


# ===========================================================================
# Shark
# ===========================================================================
def shark_dorsal(parts, name, mat, root, tip, root_chord, thick=0.14, detail=3):
    """Triangular dorsal fin. Chord is fore-aft (ship Z). Vertical blade."""
    chord_dir = (0.0, 0.0, 1.0)
    return _blade_loft(parts, name, kit.ROLE_ARMOUR, mat, root, tip,
                       chord_dir, max(root_chord, _THICK_MIN), _THICK_MIN,
                       max(thick, _THICK_MIN) * 0.5, _THICK_MIN * 0.5,
                       detail, profile='triangle')


def shark_caudal(parts, name, mat, peduncle, upper_tip, lower_tip,
                 root_chord, thick=0.12, detail=3):
    """Heterocercal caudal: longer upper lobe, shorter lower, vertical."""
    chord_dir = (0.0, 0.0, 1.0)
    objs = []
    objs.extend(_blade_loft(parts, name + '.upper', kit.ROLE_ARMOUR, mat,
                            peduncle, upper_tip, chord_dir,
                            max(root_chord, _THICK_MIN), _THICK_MIN,
                            max(thick, _THICK_MIN) * 0.5, _THICK_MIN * 0.5,
                            detail, profile='triangle'))
    objs.extend(_blade_loft(parts, name + '.lower', kit.ROLE_ARMOUR, mat,
                            peduncle, lower_tip, chord_dir,
                            max(root_chord * 0.72, _THICK_MIN), _THICK_MIN,
                            max(thick, _THICK_MIN) * 0.5, _THICK_MIN * 0.5,
                            detail, profile='triangle'))
    return objs


def shark_pectoral(parts, name, mat, root, tip, root_chord, tip_chord=0.16,
                   thick=0.12, detail=3):
    """Triangular pectoral. ``root`` is inside the flank."""
    chord_dir = (0.0, 0.0, 1.0)
    return _blade_loft(parts, name, kit.ROLE_ARMOUR, mat, root, tip,
                       chord_dir, max(root_chord, _THICK_MIN),
                       max(tip_chord, _THICK_MIN),
                       max(thick, _THICK_MIN) * 0.5, _THICK_MIN * 0.5,
                       detail, profile='triangle')


def gill_slits(parts, name, mat, z0, z1, surf, y, side=1.0, count=5,
               height=0.38, detail=3):
    """Row of gill slits as grown lips, not boxes. ``surf(z)`` half-beam."""
    if detail < 1:
        return []
    if z1 <= z0 or count < 1:
        return []
    n = count if detail >= 2 else max(1, count // 2)
    objs = []
    for i in range(n):
        t = (i + 0.5) / n
        z = z0 + t * (z1 - z0)
        sx = surf(z)
        if sx == 0.0:
            continue
        loc = (side * sx, y, z)
        out = (side, 0.0, 0.0)
        well = kit.sphere(parts, '%s.well%02d' % (name, i), kit.ROLE_RECESS,
                          (loc[0] - out[0] * 0.06, loc[1], loc[2]),
                          (0.05, height * 0.42, 0.10), mat, segments=8)
        if well is not None:
            objs.append(well)
        # No grown-lip beads: those read as greeble clusters, not gills.
    return objs


# ===========================================================================
# Squid
# ===========================================================================
def squid_mantle_fins(parts, name, mat, loc, span=1.8, chord=1.2,
                      thick=0.14, detail=3):
    """Rhomboid / diamond fin pair at the rear of a mantle. ``loc`` is the
    shared root on the mantle, buried. Span is outboard along +X / -X.
    """
    chord_dir = (0.0, 0.0, 1.0)
    objs = []
    for s, tag in ((1.0, 's'), (-1.0, 'p')):
        tip = (loc[0] + s * span, loc[1], loc[2] + chord * 0.08)
        objs.extend(_blade_loft(parts, 'fin-%s-%s' % (name, tag),
                                kit.ROLE_ARMOUR, mat, loc, tip, chord_dir,
                                max(chord * 0.22, _THICK_MIN),
                                max(chord * 0.16, _THICK_MIN),
                                max(thick, _THICK_MIN) * 0.5,
                                _THICK_MIN * 0.5, detail, profile='diamond'))
    return objs


def sucker_pads(parts, name, mat, path, inward, radius=0.08, detail=3):
    """Overlapping sucker spheres along ``path``, offset along ``inward``."""
    if detail < 2:
        return []
    pts = [tuple(p) for p in path]
    if len(pts) < 2:
        return []
    if detail == 2 and len(pts) > 3:
        pts = pts[::2]
        if pts[-1] != path[-1]:
            pts.append(tuple(path[-1]))
    inn = _unit(inward)
    r = max(radius, _THICK_MIN)
    objs = []
    for i, p in enumerate(pts):
        loc = _vadd(p, _vmul(inn, r * 0.55))
        sk = kit.sphere(parts, 'living-%s.su%02d' % (name, i), kit.ROLE_TRIM,
                        loc, (r, r * 0.72, r), mat, segments=8)
        if sk is not None:
            objs.append(sk)
    return objs


def squid_arm(parts, name, mat, root, tip, root_r=0.16, tip_r=0.07,
              suckers=False, inward=None, detail=3):
    """Muscular arm: circular tube root->tip. Optional sucker row."""
    path = [root, _lerp(root, tip, 0.45), tip]
    objs = _tube_loft(parts, name, kit.ROLE_ARMOUR, mat, path,
                      root_r, tip_r, detail)
    if suckers and detail >= 2:
        inn = inward if inward is not None else (0.0, -1.0, 0.0)
        n = 5 if detail >= 3 else 3
        row = [_lerp(root, tip, 0.15 + 0.7 * i / max(1, n - 1)) for i in range(n)]
        objs.extend(sucker_pads(parts, name, mat, row, inn,
                                radius=max(tip_r * 0.7, 0.07), detail=detail))
    return objs


def feeding_tentacle(parts, name, mat, root, tip, root_r=0.12, club_r=0.20,
                     suckers=False, inward=None, detail=3):
    """Long feeding tentacle with a clubbed tip."""
    mid = _lerp(root, tip, 0.72)
    path = [root, _lerp(root, tip, 0.4), mid, tip]
    objs = _tube_loft(parts, name, kit.ROLE_ARMOUR, mat, path,
                      root_r, max(root_r * 0.55, _THICK_MIN * 0.5), detail)
    club = kit.sphere(parts, 'living-%s.club' % name, kit.ROLE_ARMOUR, tip,
                      (club_r, club_r * 0.7, club_r * 1.15), mat,
                      segments=12 if detail >= 2 else 8)
    if club is not None:
        objs.append(club)
    if suckers and detail >= 2:
        inn = inward if inward is not None else (0.0, -1.0, 0.0)
        club_path = [_lerp(mid, tip, t) for t in (0.2, 0.5, 0.8, 1.0)]
        objs.extend(sucker_pads(parts, name + '.club', mat, club_path, inn,
                                radius=max(club_r * 0.28, 0.07), detail=detail))
    return objs


def siphon(parts, name, mat, loc, length=0.70, radius=0.16,
           aim=(0.0, -0.2, 1.0), detail=3):
    """Exhalant siphon. ``loc`` is buried in the mantle; ``aim`` is unit-ish
    toward the open end (default aft and slightly down).
    """
    direction = _unit(aim, fallback=(0.0, 0.0, 1.0))
    end = _vadd(loc, _vmul(direction, max(length, _THICK_MIN * 2.0)))
    path = [loc, end]
    objs = _tube_loft(parts, name, kit.ROLE_HULL, mat, path,
                      radius, max(radius * 0.7, _THICK_MIN), detail)
    rim = kit.sphere(parts, 'living-%s.rim' % name, kit.ROLE_HULL, end,
                     (radius * 0.85, radius * 0.85, radius * 0.55), mat,
                     segments=10 if detail >= 2 else 8)
    if rim is not None:
        objs.append(rim)
    return objs


# ===========================================================================
# Octopus
# ===========================================================================
def travel_arm_tips(hub, length, count=8, spread=0.40, drop=0.22):
    """Eight trailing arm tips for travel pose. Mantle stays toward -Z.

    Tips lie toward +Z from ``hub`` with a modest XY spread. Not a
    radial sunburst in the XY plane.
    """
    count = max(3, int(count))
    tips = []
    for i in range(count):
        ang = 2.0 * math.pi * i / count
        tips.append((
            hub[0] + spread * length * math.cos(ang),
            hub[1] - drop * length + 0.35 * spread * length * math.sin(ang),
            hub[2] + length,
        ))
    return tips


def octopus_arm(parts, name, mat, root, tip, root_r=0.22, tip_r=0.08,
                suckers=False, inward=None, web_to=None, web_frac=0.28,
                detail=3):
    """Thick muscular arm. Optional webbing ribbon toward ``web_to``."""
    path = [root, _lerp(root, tip, 0.38), _lerp(root, tip, 0.72), tip]
    objs = _tube_loft(parts, name, kit.ROLE_ARMOUR, mat, path,
                      root_r, tip_r, detail)
    if suckers and detail >= 2:
        inn = inward if inward is not None else (0.0, -1.0, 0.0)
        n = 6 if detail >= 3 else 3
        row = [_lerp(root, tip, 0.12 + 0.7 * i / max(1, n - 1)) for i in range(n)]
        objs.extend(sucker_pads(parts, name, mat, row, inn,
                                radius=max(tip_r * 0.85, 0.07), detail=detail))
    if web_to is not None and web_frac > 0.0:
        a0, a1 = root, _lerp(root, tip, web_frac)
        b0, b1 = root, _lerp(root, tuple(web_to), web_frac)
        objs.extend(_ribbon_loft(parts, name + '.web', kit.ROLE_HULL, mat,
                                 [a0, a1], [b0, b1],
                                 max(root_r * 0.45, _THICK_MIN), detail))
    return objs


def interbrachial_web(parts, name, mat, hub, arm_tips, thick=0.12,
                      trail=0.30, detail=3):
    """Web sheet between consecutive trailing arms. Travel pose only.

    ``hub`` is the mantle/arm junction. ``arm_tips`` must already trail
    toward +Z. The sheet occupies the first ``trail`` fraction of each
    hub->tip run, so the silhouette stays a trailing skirt, not a disc.
    Primary mass: kept at detail 0.
    """
    tips = [tuple(t) for t in arm_tips]
    n = len(tips)
    if n < 3:
        return []
    trail = min(max(trail, 0.12), 0.6)
    thick = max(thick, _THICK_MIN)
    objs = []
    for i in range(n):
        a_tip = tips[i]
        b_tip = tips[(i + 1) % n]
        rail_a = [_lerp(hub, a_tip, 0.06), _lerp(hub, a_tip, trail)]
        rail_b = [_lerp(hub, b_tip, 0.06), _lerp(hub, b_tip, trail)]
        objs.extend(_ribbon_loft(parts, '%s.w%02d' % (name, i),
                                 kit.ROLE_ARMOUR, mat, rail_a, rail_b,
                                 thick, detail))
    return objs


# ===========================================================================
# Whale
# ===========================================================================
def whale_fluke(parts, name, mat, peduncle, span, chord, thick=0.16, detail=3):
    """Horizontal fluke: two lobes in the XZ plane, not a vertical tail."""
    chord_dir = (0.0, 0.0, 1.0)
    px, py, pz = peduncle
    span = max(span, _THICK_MIN * 4.0)
    chord = max(chord, _THICK_MIN * 2.0)
    objs = []
    for s, tag in ((1.0, 's'), (-1.0, 'p')):
        tip = (px + s * span * 0.5, py, pz + chord * 0.18)
        objs.extend(_blade_loft(parts, 'fin-%s-%s' % (name, tag),
                                kit.ROLE_ARMOUR, mat, peduncle, tip,
                                chord_dir, max(chord * 0.45, _THICK_MIN),
                                max(chord * 0.18, _THICK_MIN),
                                max(thick, _THICK_MIN) * 0.5,
                                _THICK_MIN * 0.5, detail, profile='paddle'))
    return objs


def whale_pectoral(parts, name, mat, root, tip, root_chord, tip_chord=0.22,
                   thick=0.14, style='humpback', detail=3):
    """Cetacean pectoral. style 'humpback' = long paddle; 'blue' = short.

    ``root`` is inside the flank. Chord is fore-aft.
    """
    chord_dir = (0.0, 0.0, 1.0)
    profile = 'paddle' if style != 'blue' else 'triangle'
    if style == 'blue':
        tip_chord = min(tip_chord, root_chord * 0.45)
    return _blade_loft(parts, name, kit.ROLE_ARMOUR, mat, root, tip,
                       chord_dir, max(root_chord, _THICK_MIN),
                       max(tip_chord, _THICK_MIN),
                       max(thick, _THICK_MIN) * 0.5, _THICK_MIN * 0.5,
                       detail, profile=profile)


def dorsal_ridge(parts, name, mat, z0, z1, surf, x=0.0, height=0.22, detail=3):
    """Soft whale dorsal ridge: overlapping muscle ellipsoids, not a triangle.

    ``surf(z)`` is the back height at offset ``x``. Skip 0.0 samples.
    Primary mass: kept at detail 0.
    """
    span = z1 - z0
    if span <= 0.0:
        return []
    n = 5 if detail >= 3 else (4 if detail >= 2 else (3 if detail >= 1 else 2))
    path = []
    for i in range(n):
        z = z0 + (i + 0.5) * (span / n)
        sy = surf(z)
        if sy == 0.0:
            continue
        path.append((x, sy - height * 0.25, z))
    if not path:
        return []
    rz = max(span / (n * 1.15), _THICK_MIN)
    return nacre_pads(parts, name, mat, path,
                      (height * 0.7, height, rz),
                      detail=max(detail, 0), role=kit.ROLE_ARMOUR, seed=5)


def blowhole(parts, glow, name, hull_mat, glow_mat, loc, radius=0.28,
             detail=3, seed=1):
    """Irregular grown-lip blowhole on the back. Not a porthole torus.

    ``loc`` is the mouth centre on the dorsal skin. Skip at detail 0.
    """
    if detail < 1:
        return []
    r = max(radius, 0.16)
    out = (0.0, 1.0, 0.0)
    well = kit.sphere(parts, '%s.well' % name, kit.ROLE_RECESS,
                      (loc[0], loc[1] - r * 0.35, loc[2]),
                      (r * 0.85, r * 0.40, r * 1.05), hull_mat,
                      segments=12 if detail >= 2 else 8)
    objs = []
    if well is not None:
        objs.append(well)
    objs.extend(grown_lip(parts, name, hull_mat, loc,
                          (r * 0.9, 0.0, 0.0), (0.0, 0.0, r * 1.15),
                          out, count=9, bead_r=0.11, seed=seed, detail=detail))
    if detail >= 3:
        gb = kit.sphere(glow, '%s.breath' % name, 'glow',
                        (loc[0], loc[1] - r * 0.12, loc[2]),
                        (r * 0.28, r * 0.22, r * 0.28), glow_mat, segments=8)
        if gb is not None:
            objs.append(_glow_tag(gb))
    return objs
