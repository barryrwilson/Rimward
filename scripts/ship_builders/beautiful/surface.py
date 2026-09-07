"""Beautiful Ones shared hull-surface language: loft queries and living module.

The existing ``grown_loft`` and surface-query vocabulary seats the older
class anatomy. The approved Glassfin, Needlewake and Orchard sculpts use
``sculpt_*`` sampled surfaces and tapered curves in the same ship-space
coordinates, with authored linear vertex pigments. Thin membranes are
solidified before export so the production material can remain front-sided.

GROWN BODIES USE ``grown_loft``. It sweeps TRUE ELLIPSE rings (default 16
radial points) through the same station tuples. kit.hull_loft's 8-point
chamfered ring is LEGACY for this faction: its octagon front silhouettes
read as faceted plating, which a grown body must never show. The queries
below (section, flank_x, top_y, bottom_y, flat_half, straight_*) still
describe the fair-octagon APPROXIMATION of the section — on a fair()
station the true ellipse sits inside the octagon's error bars, so organ
seating needs no change. The chamfer field of the station tuple is ignored
by grown_loft; it is kept for the queries above.

THE ABSOLUTE MODULE. 1 world unit ~= 3.64 m (P = 6.6 = 24 m). The Beautiful
Ones have no windows, hatches, rails or collars, so the scale cues are
biological: crown filament thickness and length, vein radius and branch
pitch, breathing-vent lips, the nursery hollow and the companion craft that
nests in it. They are NEVER multiplied by ship l, b or h: a larger organism
carries MORE filaments, MORE hollows and MORE companions, never bigger ones.

Kit size conventions (verified against scripts/ship_kit.py source):
    kit.box / kit.taper_block / kit.wedge / kit.hull_loft -> FULL extents
    grown_loft (this module)                -> station-tuple half-extents,
                                               absolute ship-space rings
    kit.cyl / kit.torus / kit.strut         -> real radius / depth
    kit.sphere scale                        -> RADII per axis (unit sphere,
                                               obj.scale = _bsize(scale))
HALF is the convention for the station tuples here and for nothing the kit
accepts. plate_course / plate_grid / panel_lines / greeble_field are listed
for completeness only — a grown body has no use for them.
"""
import math
from bisect import bisect_left
from mathutils import Matrix, Vector

import bmesh
import bpy


# -- Cylinder orientation helpers --------------------------------------------
# Pass to the ``rot`` argument of kit.cyl and friends.
CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)
CYL_ALONG_X = (0.0, math.pi / 2.0, 0.0)


# -- Living-scale constants: ABSOLUTE units, never scaled by ship size -------
# 1 world unit ~= 3.64 m. Each comment gives the metre equivalent.

FILAMENT_R    = 0.04   # crown filament radius — ~0.15 m; thin and fragile
FILAMENT_LEN  = 1.10   # crown filament length — ~4.0 m
FILAMENT_FAN  = 0.34   # crown root-fan radius at the head — ~1.24 m

VEIN_R        = 0.045  # luminous vein strut radius — ~0.16 m; veins stay thin
VEIN_NODE_R   = 0.06   # bright node at a vein branch point — ~0.22 m radius
VEIN_PITCH    = 0.90   # branch pitch along a vein run — ~3.3 m

FLOW_R        = 0.05   # flow-line strut radius — ~0.18 m; a tonal boundary,
                       #   never a ridge

VENT_R        = 0.30   # breathing-vent lip radius — ~1.09 m; a suited figure
                       #   fits the mouth

HOLLOW        = (2.5, 0.8, 3.2)   # sanctuary / nursery hollow FULL extents
                                  #   (w, h, d) — ~9.1 x 2.9 x 11.6 m; cradles
                                  #   exactly one companion craft
COMPANION_LEN = 2.6    # nested companion craft overall length — ~9.5 m


# ---------------------------------------------------------------------------
# Hull surface queries
#
# Every function here returns a coordinate or a station tuple. None of them
# create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.49):
    """Return one station chamfered toward a smooth near-ellipse.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``grown_loft`` (which ignores the chamfer field). ``k=0.49`` sits at the
    kit's internal clamp so the rounded octagon is as round as the kit can
    cut it. A grown hull never shows a plank edge.
    """
    return (z, half_w, half_h, y_offset, k * min(half_w, half_h))


def section(stations, z):
    """Interpolate (half_w, half_h, y_offset, chamfer) at ship z.

    Returns the linear interpolation between the two bracketing stations, or
    clamps to the first or last station when ``z`` is out of range.
    """
    if z <= stations[0][0]:
        return stations[0][1:]
    if z >= stations[-1][0]:
        return stations[-1][1:]
    for a, b in zip(stations, stations[1:]):
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            return tuple(a[i + 1] + t * (b[i + 1] - a[i + 1]) for i in range(4))
    return stations[-1][1:]


def clamped(hw, hh, ch):
    """Return the chamfer the kit will actually cut after its internal clamp.

    Returns a scalar in world units — a coordinate, never geometry.
    """
    return min(ch, hw * 0.49, hh * 0.49)


def flank_x(stations, z, y):
    """Return the hull half-beam at station z and height y.

    Returns the x coordinate of the outer hull surface at that z and y:
    ``half_w`` inside the straight flank run, then falling off linearly across
    the chamfer. Returns 0.0 when ``y`` is above or below the section —
    callers rely on this to self-trim runs, so the value is never negative
    and never clamped to a small positive.
    """
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dy = abs(y - yo)
    if dy <= hh - ch:
        return hw
    if dy >= hh:
        return 0.0
    return hw - (dy - (hh - ch))


def top_y(stations, z, x=0.0):
    """Return the back height at station z, x units off the centreline.

    Returns the y coordinate of the top hull surface at that z and x: flat at
    ``y_offset + half_h`` across the flat crown, falling across the chamfer.
    On a fair section the flat crown is narrow — a crest, not a deck.
    """
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo + hh
    if dx >= hw:
        return yo
    return yo + hh - (dx - (hw - ch))


def bottom_y(stations, z, x=0.0):
    """Return the belly height at station z, x units off the centreline.

    Returns the y coordinate of the bottom hull surface at that z and x.
    """
    hw, hh, yo, ch = section(stations, z)
    ch = clamped(hw, hh, ch)
    dx = abs(x)
    if dx <= hw - ch:
        return yo - hh
    if dx >= hw:
        return yo
    return yo - hh + (dx - (hw - ch))


def flat_half(stations, z):
    """Return the half-width of the flat crown at station z, inboard of the chamfer.

    Returns a scalar x extent — the beam over which the top face is horizontal.
    Narrow on a fair section. Never geometry.
    """
    hw, hh, yo, ch = section(stations, z)
    return hw - clamped(hw, hh, ch)


def straight_top(stations, z):
    """Return the highest y at which the flank is still vertical at station z.

    Returns a y coordinate. Above this point the section chamfer begins.
    """
    hw, hh, yo, ch = section(stations, z)
    return yo + hh - clamped(hw, hh, ch)


def straight_bottom(stations, z):
    """Return the lowest y at which the flank is still vertical at station z.

    Returns a y coordinate. Below this point the section chamfer begins.
    """
    hw, hh, yo, ch = section(stations, z)
    return yo - hh + clamped(hw, hh, ch)


def flank_anchor(stations, z, y, inset):
    """Return the x-centre for an organ of half-thickness ``inset`` seated in the flank.

    Returns the x coordinate at which the centre of a fitting must sit so
    that the fitting laps inboard of the flank surface: ``flank_x(z, y) -
    inset``. Returns 0.0 when ``flank_x`` returns 0.0 (the y is outside the
    hull at that z), signalling the caller to place nothing there. Mirror
    with a negative sign for the port side (starboard is positive x).
    """
    fx = flank_x(stations, z, y)
    if fx == 0.0:
        return 0.0
    return fx - inset


# ---------------------------------------------------------------------------
# Surface-callback factories
#
# Each returns a closure over ``stations`` answering one coordinate per
# station. Every closure returns 0.0 for z outside
# ``stations[0][0] .. stations[-1][0]`` — with the interpolation clamp in
# ``section`` alone, a run past the last station would seat on the end
# section and float past the taper; the 0.0 makes the run self-trim instead.
# A closure also returns 0.0 wherever the underlying query yields 0.0 or a
# non-positive extent, never a negative coordinate.
# ---------------------------------------------------------------------------

def surf_flank(stations, y, inset=0.0):
    """Return callable(z) -> half-beam at height ``y`` minus ``inset``, or 0.0.

    Use for flank-seated runs: muscle folds, breathing-vent rows, hollows.
    """
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        fx = flank_x(stations, z, y) - inset
        if fx <= 0.0:
            return 0.0
        return fx
    return at


def surf_top(stations, x=0.0, drop=0.0):
    """Return callable(z) -> back height at offset ``x`` minus ``drop``, or 0.0.

    Use for dorsal runs: garden folds, scar welts, the pearl crest line.
    """
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, yo, ch = section(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        return top_y(stations, z, x) - drop
    return at


def surf_bottom(stations, x=0.0, rise=0.0):
    """Return callable(z) -> belly height at offset ``x`` plus ``rise``, or 0.0.

    Use for ventral runs: belly chambers, keel-line flow lines, vent rows.
    """
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, yo, ch = section(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        return bottom_y(stations, z, x) + rise
    return at


def surf_flat(stations, inset=0.0):
    """Return callable(z) -> flat crown half-width minus ``inset``, or 0.0.

    Use for anything that must stay on the horizontal crown, inboard of the
    chamfer roll: crest runs, dorsal hollow placement limits.
    """
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        fw = flat_half(stations, z) - inset
        if fw <= 0.0:
            return 0.0
        return fw
    return at


def span_ray(root, tip):
    """Return callable(t) -> ship-space (x, y, z) on the segment root->tip.

    ``root`` and ``tip`` are explicit anchors. The closure linearly
    interpolates between them, clamped to t in [0, 1]. t = 0.0 returns
    ``root``, t = 1.0 returns ``tip``. Seat spanwise details (a vein
    entering a fin, a sucker row, a companion against a limb root) at an
    exact span fraction without re-deriving the segment.
    """
    rx, ry, rz = root
    dx = tip[0] - rx
    dy = tip[1] - ry
    dz = tip[2] - rz

    def at(t):
        t = max(0.0, min(1.0, t))
        return (rx + dx * t, ry + dy * t, rz + dz * t)
    return at


# Kept name: class authors and older notes used fin_ray for the same ray.
fin_ray = span_ray


# ---------------------------------------------------------------------------
# Grown-body loft
#
# The one geometry builder in this module: the faction's true-ellipse body
# sweep. kit.hull_loft is legacy for the Beautiful Ones — its 8-point
# chamfered ring renders faceted octagon silhouettes.
# ---------------------------------------------------------------------------

def grown_loft(parts, name, role, stations, mat, radial=16):
    """Sweep a true-ellipse section along ship Z — the faction's grown body.

    stations -- list of (z, half_w, half_h, y_offset, chamfer) tuples, the
                SAME tuples sf.fair() returns; the chamfer field is IGNORED.
                At least two stations are required.
    radial   -- points per ring (default 16; floored at 4).

    Each station becomes one ring of ``radial`` verts on the true ellipse
    x = half_w * cos(t), y = y_offset + half_h * sin(t) at ship z. Rings are
    bridged with ``radial`` quads per span; the end caps are n-gons built
    from the ring verts themselves, so the caps are WELDED. Every polygon
    is smooth-shaded. Geometry is absolute ship space; the object sits at
    the Blender origin.

    Ring/segment cost per loft (N stations, radial R):
        verts   R * N
        quads   R * (N - 1)
        caps    2 n-gons (welded)
    """
    if len(stations) < 2:
        raise ValueError('grown_loft requires at least two stations')
    radial = max(4, int(radial))

    bm = bmesh.new()
    rings = []
    for (ship_z, hw, hh, yo, _ch) in stations:
        bl_y = -ship_z          # ship +Z -> Blender -Y (kit convention)
        ring = []
        for i in range(radial):
            # Decreasing angle = CCW viewed from Blender +Y, so
            # recalc_face_normals yields outward normals.
            th = -2.0 * math.pi * i / radial
            ring.append(bm.verts.new((hw * math.cos(th), bl_y,
                                      hh * math.sin(th) + yo)))
        rings.append(ring)

    for ri in range(len(rings) - 1):
        r0, r1 = rings[ri], rings[ri + 1]
        for i in range(radial):
            j = (i + 1) % radial
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))

    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])

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


def assign_beautiful_uv(parts):
    """Cylindrical UV around Blender Y (ship length) for the player vein map.

    World-space, after centre_parts. u wraps around the body; v runs nose
    to tail. Every hull part shares one ymin/ymax so the joined mesh
    keeps a continuous map. TEXCOORD stays in [0, 1].
    """
    if not parts:
        return
    pts = []
    for obj in parts:
        mw = obj.matrix_world
        for vert in obj.data.vertices:
            pts.append(mw @ vert.co)
    if not pts:
        return
    ymin = min(p.y for p in pts)
    ymax = max(p.y for p in pts)
    yspan = max(ymax - ymin, 1e-6)
    repeats = max(1.0, yspan / 10.0)
    tau = 2.0 * math.pi
    for obj in parts:
        mesh = obj.data
        uv = mesh.uv_layers.active
        if uv is None:
            uv = mesh.uv_layers.new(name='UVMap')
        mw = obj.matrix_world
        for poly in mesh.polygons:
            for li in poly.loop_indices:
                vi = mesh.loops[li].vertex_index
                co = mw @ mesh.vertices[vi].co
                u = math.atan2(co.x, co.z) / tau + 0.5
                if u >= 1.0:
                    u = 0.0
                v = ((co.y - ymin) / yspan) * repeats
                v = v - math.floor(v)
                uv.data[li].uv = (u, v)


# Approved parametric sculpts: author in review coordinates, then uniformly
# fit the complete anatomy to the class length. No runtime procedural meshes.
def sculpt_color(value):
    """Hex sRGB to the linear RGB used by Blender Col and glTF COLOR_0."""
    value = value.lstrip('#')
    channels = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels)


def sculpt_palette(accent):
    hue = sculpt_color(accent)
    lavender, pearl = sculpt_color('#c5b8de'), sculpt_color('#d7e7df')
    return {
        'skin': tuple(c * 0.55 for c in hue),
        'underside': sculpt_color('#b5cac7'),
        'membrane': tuple(a * 0.6 + b * 0.4 for a, b in zip(hue, lavender)),
        'ridge': tuple(a * 0.52 + b * 0.48 for a, b in zip(hue, pearl)),
        'glow': hue,
        'warm': sculpt_color('#edbb92'),
        'dark': sculpt_color('#172c3a'),
    }


def _sculpt_pigments(mesh, colors):
    attr = mesh.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='CORNER')
    for loop in mesh.loops:
        attr.data[loop.index].color = (*colors[loop.vertex_index], 1.0)
    mesh.color_attributes.active_color = attr


def _sculpt_mesh(parts, name, vertices, faces, mat, colors):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x, -z, y) for x, y, z in vertices], [], faces)
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    _sculpt_pigments(mesh, colors)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(mat)
    obj['skin_role'] = 'hull'
    parts.append(obj)
    return obj


def sculpt_surface(parts, name, fn, mat, u_segments, v_segments, color, *, thickness=0.0):
    """Sample a ship-space surface; pigments are linear RGB or color(u,v)."""
    nu, nv = max(2, int(u_segments)), max(2, int(v_segments))
    vertices, colors = [], []
    for i in range(nu + 1):
        for j in range(nv + 1):
            u, v = i / nu, j / nv
            vertices.append(fn(u, v))
            colors.append(color(u, v) if callable(color) else color)
    stride = nv + 1
    faces = []
    for i in range(nu):
        for j in range(nv):
            a = i * stride + j
            faces.append((a, a + stride, a + stride + 1, a + 1))
    obj = _sculpt_mesh(parts, name, vertices, faces, mat, colors)
    mesh = obj.data
    uv = mesh.uv_layers.new(name='UVMap')
    for loop in mesh.loops:
        i, j = divmod(loop.vertex_index, stride)
        uv.data[loop.index].uv = (i / nu, j / nv)
    # Weld wrapped body seams and collapsed tips before generating thin shells.
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    if thickness > 0:
        modifier = obj.modifiers.new('grown-membrane', 'SOLIDIFY')
        modifier.thickness = thickness
        modifier.offset = 0
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def sculpt_sphere(parts, name, center, radii, mat, color, segments=16):
    """Reuse the ship kit's sphere, with authored pigment rather than a role."""
    import ship_kit as kit
    obj = kit.sphere(parts, name, kit.ROLE_HULL, center, radii, mat, segments=segments)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    _sculpt_pigments(obj.data, [color] * len(obj.data.vertices))
    return obj


def sculpt_tendril(parts, name, points, radius, mat, color, *, tip=0.003, segments=64, sides=10):
    """Centripetal Catmull-Rom tube with arc-length taper and transported frame."""
    points = [Vector(p) for p in points]
    segments, sides = max(2, int(segments)), max(3, int(sides))

    def at(t):
        param = min(t, 1.0) * (len(points) - 1)
        index = min(int(param), len(points) - 2)
        weight = param - index
        p1, p2 = points[index], points[index + 1]
        p0 = points[index - 1] if index > 0 else p1 * 2 - p2
        p3 = points[index + 2] if index + 2 < len(points) else p2 * 2 - p1
        dt1 = max((p2 - p1).length ** 0.5, 1e-4)
        dt0 = (p1 - p0).length ** 0.5
        dt2 = (p3 - p2).length ** 0.5
        if dt0 < 1e-4:
            dt0 = dt1
        if dt2 < 1e-4:
            dt2 = dt1
        m1 = ((p1 - p0) / dt0 - (p2 - p0) / (dt0 + dt1) + (p2 - p1) / dt1) * dt1
        m2 = ((p2 - p1) / dt1 - (p3 - p1) / (dt1 + dt2) + (p3 - p2) / dt2) * dt1
        t2, t3 = weight * weight, weight * weight * weight
        return p1 * (2 * t3 - 3 * t2 + 1) + m1 * (t3 - 2 * t2 + weight) + p2 * (-2 * t3 + 3 * t2) + m2 * (t3 - t2)

    # Match Three's default arc-length sampling; radii taper by distance, not
    # control-point spacing, so roots remain muscular through tight bends.
    samples = [at(i / 200) for i in range(201)]
    lengths = [0.0]
    for previous, current in zip(samples, samples[1:]):
        lengths.append(lengths[-1] + (current - previous).length)
    centers = []
    for i in range(segments + 1):
        distance = lengths[-1] * i / segments
        k = min(max(bisect_left(lengths, distance), 1), 200)
        span = lengths[k] - lengths[k - 1]
        fraction = (distance - lengths[k - 1]) / span if span > 0 else 0
        centers.append(at((k - 1 + fraction) / 200))
    tangents = []
    for i in range(segments + 1):
        tangent = centers[min(i + 1, segments)] - centers[max(i - 1, 0)]
        tangents.append(tangent.normalized() if tangent.length > 1e-8 else Vector((0, 0, 1)))
    tangent = tangents[0]
    axis = min((Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))), key=lambda a: abs(a.dot(tangent)))
    normal = tangent.cross(axis).normalized()
    vertices = []
    for i, (center, tangent) in enumerate(zip(centers, tangents)):
        if i:
            normal = tangents[i - 1].rotation_difference(tangent) @ normal
        binormal = tangent.cross(normal).normalized()
        r = tip + (radius - tip) * (1 - i / segments) ** 1.15
        for j in range(sides):
            angle = j * math.tau / sides
            vertices.append(tuple(center + r * (math.cos(angle) * normal + math.sin(angle) * binormal)))
    faces = []
    for i in range(segments):
        for j in range(sides):
            a, b = i * sides + j, i * sides + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple(segments * sides + j for j in range(sides)))
    obj = _sculpt_mesh(parts, name, vertices, faces, mat, [color] * len(vertices))
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def fit_sculpt(parts, length):
    """Bake a uniform scale and centered pivot; preserve the approved shape."""
    bpy.context.view_layer.update()
    vertices = [obj.matrix_world @ v.co for obj in parts for v in obj.data.vertices]
    lo = Vector(tuple(min(v[i] for v in vertices) for i in range(3)))
    hi = Vector(tuple(max(v[i] for v in vertices) for i in range(3)))
    center = (lo + hi) * 0.5
    # Blender Y is the ship's longitudinal Z.
    scale = length / (hi.y - lo.y)
    for obj in parts:
        matrix = obj.matrix_world.copy()
        for vertex in obj.data.vertices:
            vertex.co = ((matrix @ vertex.co) - center) * scale
        obj.matrix_world = Matrix.Identity(4)
        obj.data.update()

