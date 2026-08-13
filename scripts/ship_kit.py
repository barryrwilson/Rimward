"""Ferrous Hegemony ship-kit primitives.

Consumed by scripts/ship_builders/ferrous.py (and future builder modules).
Do NOT import from build-ship-assets.py; coordinate helpers are re-implemented
here so this module can be imported independently.

Constraints:
  - Blender 5.2 background Python: bpy and math are available; no third-party libs.
  - No dataclasses, no type annotations.
  - No random module: RNG is a deterministic LCG closure.
  - Triangle budget is caller-controlled via LOD detail argument.

Ship-space convention (nose = -Z, stern = +Z, up = +Y, starboard = +X):
  blender_location(x, y, z) = (x, -z,  y)   [Blender Y is ship -Z]
  blender_size   (x, y, z) = (x,  z,  y)   [swap Y/Z for scale]
"""
import math
import bpy
import bmesh
import mathutils

# ---------------------------------------------------------------------------
# Role constants
# ---------------------------------------------------------------------------
ROLE_HULL   = 'hull'
ROLE_ARMOUR = 'armour'
ROLE_ACCENT = 'accent'
ROLE_RECESS = 'recess'
ROLE_TRIM   = 'trim'

# ---------------------------------------------------------------------------
# Coordinate helpers — identical convention to build-ship-assets.py
# ---------------------------------------------------------------------------

def _bloc(loc):
    """Convert ship-space location to Blender location."""
    x, y, z = loc
    return (x, -z, y)


def _bsize(size):
    """Convert ship-space half-extents to Blender scale."""
    x, y, z = size
    return (x, z, y)


# ---------------------------------------------------------------------------
# Deterministic LCG RNG
# ---------------------------------------------------------------------------

def rng(seed):
    """Return a closure that yields deterministic floats in [0, 1).

    Uses the Numerical Recipes LCG (a=1664525, c=1013904223, m=2^32).
    No random module; no PYTHONHASHSEED dependence; safe for Blender builds.

    Usage::
        rand = rng(42)
        v = rand()   # float in [0, 1)
    """
    state = [int(seed) & 0xFFFFFFFF]

    def _next():
        state[0] = (state[0] * 1664525 + 1013904223) & 0xFFFFFFFF
        return state[0] / 0x100000000

    return _next


# ---------------------------------------------------------------------------
# Primitive creators
#
# Every creator:
#   1. Creates the Blender object via bpy.ops.
#   2. Names it.
#   3. Assigns the material.
#   4. Tags  obj['skin_role'] = role.
#   5. Appends to the caller-supplied list.
#   6. Returns obj.
# ---------------------------------------------------------------------------

def box(parts, name, role, loc, size, mat, bevel=0.0):
    """Bevelled rectangular box.

    loc  -- ship-space centre (x, y, z)
    size -- ship-space full extents (sx, sy, sz)
    bevel -- edge width in Blender units; 0 skips the modifier (cheapest).
    Bevel uses 1 segment to keep the triangle budget low.
    """
    bpy.ops.mesh.primitive_cube_add(location=_bloc(loc))
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(v / 2.0 for v in _bsize(size))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0.0:
        mod = obj.modifiers.new('Kit_Bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        mod.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj


def cyl(parts, name, role, loc, radius, depth, mat, rotation=(0, 0, 0), vertices=12):
    """Cylinder.

    rotation is a Blender-space Euler (rx, ry, rz) in radians.
    depth is the length along the cylinder's own Z axis before rotation.
    Default 12 vertices keeps the cost low.
    """
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=_bloc(loc),
        rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj


def sphere(parts, name, role, loc, scale, mat, segments=16):
    """UV sphere with non-uniform scale.

    scale -- ship-space (sx, sy, sz) applied via obj.scale after creation.
    Default 16 major segments, 8 ring count.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=max(8, segments // 2),
        location=_bloc(loc))
    obj = bpy.context.object
    obj.name = name
    obj.scale = _bsize(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj


def torus(parts, name, role, loc, major, minor, mat, rotation=(0, 0, 0)):
    """Low-poly torus: 16 major x 6 minor segments.

    To face ship +Z (stern) pass rotation=(math.pi * 0.5, 0.0, 0.0).
    """
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=16,
        minor_segments=6,
        location=_bloc(loc),
        rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj


# ---------------------------------------------------------------------------
# Compound creators
# ---------------------------------------------------------------------------

def plate_course(parts, name, role, loc, size, mat,
                 count, axis='z', gap=0.12, step=0.02, bevel=0.0, length_vary=0.06):
    """Lay count overlapping armour plates distributed along axis.

    Each plate's span in the axis direction is (total_axis / count) * (1 + gap)
    so neighbouring plates overlap rather than leave gaps.  Each successive
    plate is `step` thicker in the cross-axis Y direction so that grazing
    light catches the stepped edges — the "catching light" ridging effect.

    length_vary -- peak fractional variation of plate length per course
                   (default 0.06 = ±6 % of pitch via a golden-angle oscillator).
                   Set 0.0 for the original uniform length.

    Plates are centred on loc and spread over the full size along the axis.
    They extend slightly past their host surface in the perpendicular directions
    (overlap factor baked into the gap fraction) so they never float.

    Returns a list of the created box objects.
    """
    objs = []
    if count < 1:
        return objs
    x0, y0, z0 = loc
    sx, sy, sz = size
    for i in range(count):
        # Golden-angle oscillator: deterministic, non-repeating variation
        v = math.sin(i * 2.3999631) * length_vary
        if axis == 'z':
            pitch = sz / count
            plate_z = pitch * (1.0 + gap + v)
            # Step the plate outward (+Y) per course so edges catch light
            plate_y = sy + i * step
            plate_x = sx
            cz = z0 - sz * 0.5 + (i + 0.5) * pitch
            ploc = (x0, y0, cz)
            psize = (plate_x, plate_y, plate_z)
        elif axis == 'x':
            pitch = sx / count
            plate_x = pitch * (1.0 + gap + v)
            plate_z = sz + i * step
            plate_y = sy
            cx = x0 - sx * 0.5 + (i + 0.5) * pitch
            ploc = (cx, y0, z0)
            psize = (plate_x, plate_y, plate_z)
        else:  # axis == 'y'
            pitch = sy / count
            plate_y = pitch * (1.0 + gap + v)
            plate_x = sx + i * step
            plate_z = sz
            cy = y0 - sy * 0.5 + (i + 0.5) * pitch
            ploc = (x0, cy, z0)
            psize = (plate_x, plate_y, plate_z)
        obj = box(parts, '%s.%02d' % (name, i), role, ploc, psize, mat, bevel)
        objs.append(obj)
    return objs

def panel_lines(parts, name, loc, size, mat, count, axis='z', depth=0.35, cross_count=0):
    """Cut visual seams as thin sunken strips distributed along axis.

    Role is always ROLE_RECESS (rendered darker than hull base).

    axis='z': count strips run across the full X width, spaced along Z.
              Each strip: (sx*1.005, depth, seam_width).
    axis='x': count strips run across the full Z width, spaced along X.
              Each strip: (seam_width, depth, sz*1.005).
    axis='y': count horizontal rings spaced along Y.
              Each strip: (sx*1.005, seam_width, sz*1.005).

    depth   -- Y (or cross-axis) extent of each strip in Blender units.
    Strips are equally spaced within loc/size (not at endpoints).
    cross_count -- additional seams perpendicular to the main axis on the same face;
                   0 disables (default, backward compatible).
    The 1.005 overlap factor ensures strips intersect the bounding box face.
    """
    objs = []
    if count < 1:
        return objs
    role = ROLE_RECESS
    x0, y0, z0 = loc
    sx, sy, sz = size
    seam = 0.04  # narrow seam width in the axis direction
    for i in range(count):
        slot = i + 1  # skip endpoints → equal interior spacing
        if axis == 'z':
            cz = z0 - sz * 0.5 + slot * sz / (count + 1)
            ploc = (x0, y0, cz)
            psize = (sx * 1.005, depth, seam)
        elif axis == 'x':
            cx = x0 - sx * 0.5 + slot * sx / (count + 1)
            ploc = (cx, y0, z0)
            psize = (seam, depth, sz * 1.005)
        else:  # axis == 'y'
            cy = y0 - sy * 0.5 + slot * sy / (count + 1)
            ploc = (x0, cy, z0)
            psize = (sx * 1.005, seam, sz * 1.005)
        obj = box(parts, '%s.%02d' % (name, i), role, ploc, psize, mat)
        objs.append(obj)
    # Cross seams: perpendicular strips on the same face
    if cross_count > 0:
        for i in range(cross_count):
            slot = i + 1
            if axis == 'z':
                # Cross spans full Z, spaced along X
                cx = x0 - sx * 0.5 + slot * sx / (cross_count + 1)
                ploc = (cx, y0, z0)
                psize = (seam, depth, sz * 1.005)
            elif axis == 'x':
                # Cross spans full X, spaced along Z
                cz = z0 - sz * 0.5 + slot * sz / (cross_count + 1)
                ploc = (x0, y0, cz)
                psize = (sx * 1.005, depth, seam)
            else:  # axis == 'y'
                # Cross spans full Z, spaced along X (deck-ring cross-hatch)
                cx = x0 - sx * 0.5 + slot * sx / (cross_count + 1)
                ploc = (cx, y0, z0)
                psize = (seam, seam, sz * 1.005)
            obj = box(parts, '%s-x.%02d' % (name, i), role, ploc, psize, mat)
            objs.append(obj)
    return objs


def greeble_field(parts, name, role, loc, size, mat, seed, count, detail):
    """Seat count small deterministic boxes on the +Y face of the bounding box.

    Returns an empty list when detail < 3 (LOD culling: greebles are the
    highest-detail layer and must be dropped at lod1/lod2/lod3).

    Boxes are positioned with seeded-random XZ scatter (90 % of face area)
    and random size variation.  Heights vary so the field reads as equipment,
    not a flat tile.  Each box overlaps 15 pct of its height into the face
    so it reads attached, never floating.
    """
    objs = []
    if detail < 3:
        return objs
    rand = rng(seed)
    x0, y0, z0 = loc
    sx, sy, sz = size
    face_y = y0 + sy * 0.5  # top face in ship space
    for i in range(count):
        rx  = rand()
        rz  = rand()
        rsx = rand()
        rsy = rand()
        rsz = rand()
        cx = x0 + (rx - 0.5) * sx * 0.90
        cz = z0 + (rz - 0.5) * sz * 0.90
        gw = sx * (0.04 + rsx * 0.06)  # X width
        gh = sy * (0.05 + rsy * 0.10)  # Y height (protrudes above face)
        gd = sz * (0.04 + rsz * 0.06)  # Z depth
        cy = face_y + gh * 0.35         # 15 pct inside face, 85 pct proud — no float
        obj = box(parts, '%s.%02d' % (name, i), role, (cx, cy, cz), (gw, gh, gd), mat)
        objs.append(obj)
    return objs


def window_row(glow, name, loc, mat, count, spacing, size):
    """Emit count small emissive window boxes evenly spaced along X.

    All objects go into the glow list and are tagged skin_role='glow'.
    loc     -- centre of the row in ship space.
    spacing -- centre-to-centre distance along X.
    size    -- ship-space extents (sx, sy, sz) of each individual window box.

    Returns the list of created objects (same objects appended to glow).
    """
    objs = []
    x0, y0, z0 = loc
    total = (count - 1) * spacing
    for i in range(count):
        cx = x0 - total * 0.5 + i * spacing
        bpy.ops.mesh.primitive_cube_add(location=_bloc((cx, y0, z0)))
        obj = bpy.context.object
        obj.name = '%s.%02d' % (name, i)
        obj.scale = tuple(v / 2.0 for v in _bsize(size))
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.data.materials.append(mat)
        obj['skin_role'] = 'glow'
        glow.append(obj)
        objs.append(obj)
    return objs


def engine_bank(parts, glow, name, loc, hull_mat, glow_mat,
                radius, depth, count, spacing):
    """Emit count hull nozzle rings plus a matching glow disc inside each.

    Nozzles are spaced symmetrically along X about loc.
    Hull rings (torus)  → parts, tagged ROLE_HULL.
    Glow discs (cyl)    → glow,  tagged 'glow'.

    Rotation pi/2 around Blender X makes each ring face ship +Z (stern) so
    the circular opening is visible from behind the ship.

    Returns a combined list [ring0, disc0, ring1, disc1, ...].
    """
    objs = []
    x0, y0, z0 = loc
    total = (count - 1) * spacing
    # Rotate ring/disc to face ship +Z (Blender -Y): Rx(pi/2)
    rot = (math.pi * 0.5, 0.0, 0.0)
    for i in range(count):
        cx = x0 - total * 0.5 + i * spacing
        # Hull nozzle ring
        ring = torus(parts,
                     '%s-nozzle.%02d' % (name, i),
                     ROLE_HULL,
                     (cx, y0, z0),
                     radius,
                     max(radius * 0.14, 0.06),
                     hull_mat,
                     rotation=rot)
        objs.append(ring)
        # Engine glow disc (cylinder lying flat inside the ring)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=12,
            radius=radius * 0.80,
            depth=depth * 0.10,
            location=_bloc((cx, y0, z0)),
            rotation=rot)
        disc = bpy.context.object
        disc.name = '%s-glow.%02d' % (name, i)
        disc.data.materials.append(glow_mat)
        disc['skin_role'] = 'glow'
        glow.append(disc)
        objs.append(disc)
    return objs


def rail(parts, name, loc, mat, length, axis='z', posts=4):
    """Emit a deck handrail strip plus evenly spaced vertical posts.

    Role is ROLE_TRIM throughout.
    loc  -- base centre of the rail assembly (bottom of posts).
    The horizontal strip sits at the top of the posts.

    axis='z': rail runs along ship Z; posts drop from the strip along Z.
    axis='x': rail runs along ship X.
    axis='y': rail runs along ship Y (e.g. a vertical ladder rail).

    Returns a list [strip, post.00, post.01, ...].
    """
    objs = []
    role = ROLE_TRIM
    x0, y0, z0 = loc
    post_h = 0.18   # post height in ship space
    post_w = 0.04   # post cross-section (square)
    rail_t = 0.04   # rail strip cross-section thickness

    def _post(idx, px, py, pz, pw, ph, pd):
        return box(parts, '%s-post.%02d' % (name, idx), role,
                   (px, py, pz), (pw, ph, pd), mat)

    if axis == 'z':
        # Strip runs along Z, centred one post_h above the base
        strip = box(parts, '%s-strip' % name, role,
                    (x0, y0 + post_h, z0),
                    (rail_t, rail_t, length), mat)
        objs.append(strip)
        for i in range(posts):
            t = i / max(posts - 1, 1) if posts > 1 else 0.5
            cz = z0 - length * 0.5 + t * length
            objs.append(_post(i, x0, y0 + post_h * 0.5, cz, post_w, post_h, post_w))

    elif axis == 'x':
        strip = box(parts, '%s-strip' % name, role,
                    (x0, y0 + post_h, z0),
                    (length, rail_t, rail_t), mat)
        objs.append(strip)
        for i in range(posts):
            t = i / max(posts - 1, 1) if posts > 1 else 0.5
            cx = x0 - length * 0.5 + t * length
            objs.append(_post(i, cx, y0 + post_h * 0.5, z0, post_w, post_h, post_w))

    else:  # axis == 'y'
        # Vertical rail: strip runs along Y; posts protrude in Z
        strip = box(parts, '%s-strip' % name, role,
                    (x0, y0, z0 + post_h),
                    (rail_t, length, rail_t), mat)
        objs.append(strip)
        for i in range(posts):
            t = i / max(posts - 1, 1) if posts > 1 else 0.5
            cy = y0 - length * 0.5 + t * length
            objs.append(_post(i, x0, cy, z0 + post_h * 0.5, post_w, post_w, post_h))

    return objs


# ---------------------------------------------------------------------------
# Hard-surface kit forms (bmesh-based)
# ---------------------------------------------------------------------------

def _bmesh_finish(bm, name, role, loc, mat, parts, bevel=0.0):
    """Finalise a bmesh into a linked scene object; apply optional bevel."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = _bloc(loc)
    bpy.context.collection.objects.link(obj)
    if bevel > 0.0:
        mod = obj.modifiers.new('Kit_Bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        mod.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj


def _chamfer_ring(bm, bl_y, hw, hh, ch, yo=0.0):
    """Add one 8-point chamfered rectangular ring to bm; return vert list.

    bl_y -- Blender Y position of the ring plane
    hw   -- half-width in Blender X  (ship X)
    hh   -- half-height in Blender Z (ship Y)
    ch   -- chamfer cut length (clamped to 49% of smaller half-extent)
    yo   -- Blender Z offset of ring centre (ship y_offset)
    Vertex order is CCW viewed from Blender +Y so recalc_face_normals
    will always produce consistent outward normals.
    """
    ch = min(ch, hw * 0.49, hh * 0.49)
    return [
        bm.verts.new(( hw - ch,   bl_y,  hh + yo)),        # 0 top-right
        bm.verts.new(( hw,        bl_y,  hh - ch + yo)),   # 1 right-upper
        bm.verts.new(( hw,        bl_y, -hh + ch + yo)),   # 2 right-lower
        bm.verts.new(( hw - ch,   bl_y, -hh + yo)),        # 3 bottom-right
        bm.verts.new((-(hw - ch), bl_y, -hh + yo)),        # 4 bottom-left
        bm.verts.new((-hw,        bl_y, -hh + ch + yo)),   # 5 left-lower
        bm.verts.new((-hw,        bl_y,  hh - ch + yo)),   # 6 left-upper
        bm.verts.new((-(hw - ch), bl_y,  hh + yo)),        # 7 top-left
    ]


def _bridge_rings(bm, r0, r1):
    """Create 8 quads connecting two 8-vert chamfered rings."""
    for i in range(8):
        j = (i + 1) % 8
        bm.faces.new((r0[i], r0[j], r1[j], r1[i]))


def wedge(parts, name, role, loc, size, mat, taper=(0.45, 0.60), bevel=0.0):
    """Box whose -Z face (ship nose, Blender +Y) is scaled by taper=(x_scale, y_scale).

    Creates a blunt prow form: full-size stern face, tapered nose face.
    loc  -- ship-space centre
    size -- ship-space full extents (sx, sy, sz)
    """
    sx, sy, sz = size
    hw = sx / 2.0   # Blender X half-extent
    hl = sz / 2.0   # Blender Y half-extent  (ship length axis)
    hh = sy / 2.0   # Blender Z half-extent  (ship height axis)
    tx, ty = taper

    bm = bmesh.new()
    # Stern face (Blender -Y = ship +Z): full size
    v0 = bm.verts.new((-hw, -hl, -hh))
    v1 = bm.verts.new(( hw, -hl, -hh))
    v2 = bm.verts.new(( hw, -hl,  hh))
    v3 = bm.verts.new((-hw, -hl,  hh))
    # Nose face (Blender +Y = ship -Z): tapered
    v4 = bm.verts.new((-hw * tx,  hl, -hh * ty))
    v5 = bm.verts.new(( hw * tx,  hl, -hh * ty))
    v6 = bm.verts.new(( hw * tx,  hl,  hh * ty))
    v7 = bm.verts.new((-hw * tx,  hl,  hh * ty))

    bm.faces.new((v0, v3, v2, v1))  # stern
    bm.faces.new((v4, v5, v6, v7))  # nose
    bm.faces.new((v0, v1, v5, v4))  # bottom
    bm.faces.new((v3, v7, v6, v2))  # top
    bm.faces.new((v0, v4, v7, v3))  # port
    bm.faces.new((v1, v2, v6, v5))  # starboard

    return _bmesh_finish(bm, name, role, loc, mat, parts, bevel)


def taper_block(parts, name, role, loc, size, mat,
                front=(1.0, 1.0), back=(1.0, 1.0), bevel=0.0):
    """Box with independent nose (-Z) and stern (+Z) face scale factors.

    front=(fx, fy) scales the -Z ship face (Blender +Y).
    back=(bx, by)  scales the +Z ship face (Blender -Y).
    Both default to (1.0, 1.0) i.e. no taper.
    """
    sx, sy, sz = size
    hw = sx / 2.0
    hl = sz / 2.0
    hh = sy / 2.0
    fx, fy = front
    bx, by = back

    bm = bmesh.new()
    v0 = bm.verts.new((-hw * bx, -hl, -hh * by))
    v1 = bm.verts.new(( hw * bx, -hl, -hh * by))
    v2 = bm.verts.new(( hw * bx, -hl,  hh * by))
    v3 = bm.verts.new((-hw * bx, -hl,  hh * by))
    v4 = bm.verts.new((-hw * fx,  hl, -hh * fy))
    v5 = bm.verts.new(( hw * fx,  hl, -hh * fy))
    v6 = bm.verts.new(( hw * fx,  hl,  hh * fy))
    v7 = bm.verts.new((-hw * fx,  hl,  hh * fy))

    bm.faces.new((v0, v3, v2, v1))  # stern
    bm.faces.new((v4, v5, v6, v7))  # nose
    bm.faces.new((v0, v1, v5, v4))  # bottom
    bm.faces.new((v3, v7, v6, v2))  # top
    bm.faces.new((v0, v4, v7, v3))  # port
    bm.faces.new((v1, v2, v6, v5))  # starboard

    return _bmesh_finish(bm, name, role, loc, mat, parts, bevel)


def chamfer_block(parts, name, role, loc, size, mat, chamfer=0.18, bevel=0.0):
    """Box with 45-degree corner cuts along the ship-XY cross-section.

    chamfer -- absolute cut length along each axis edge (Blender units).
               Clamped to 49% of the smaller half-extent automatically.
    """
    sx, sy, sz = size
    hw = sx / 2.0
    hl = sz / 2.0
    hh = sy / 2.0

    bm = bmesh.new()
    r0 = _chamfer_ring(bm, -hl, hw, hh, chamfer)   # stern ring
    r1 = _chamfer_ring(bm,  hl, hw, hh, chamfer)   # nose ring

    _bridge_rings(bm, r0, r1)
    bm.faces.new(r0[::-1])  # stern cap (reversed for outward normal)
    bm.faces.new(r1)        # nose cap

    return _bmesh_finish(bm, name, role, loc, mat, parts, bevel)


def hull_loft(parts, name, role, stations, mat):
    """Sweep a chamfered rectangular section along ship Z.

    stations -- list of (z, half_w, half_h, y_offset, chamfer) tuples.
                z, half_w, half_h, y_offset are in ship space.
                z is the absolute ship-Z position of each station.
                Consecutive stations are bridged with 8 quads each.
                At least two stations are required.
    Returns the created object.
    Geometry uses absolute ship-space coordinates; the object sits at
    the Blender origin with no additional location offset.
    """
    if len(stations) < 2:
        raise ValueError('hull_loft requires at least two stations')

    bm = bmesh.new()
    rings = []
    for (ship_z, hw, hh, yo, ch) in stations:
        bl_y = -ship_z          # ship +Z -> Blender -Y
        rings.append(_chamfer_ring(bm, bl_y, hw, hh, ch, yo))

    for ri in range(len(rings) - 1):
        _bridge_rings(bm, rings[ri], rings[ri + 1])

    bm.faces.new(rings[0][::-1])    # first-station cap
    bm.faces.new(rings[-1])         # last-station cap

    # Object at origin; all positions are absolute Blender-space.
    return _bmesh_finish(bm, name, role, (0, 0, 0), mat, parts)


def strut(parts, name, role, a, b, mat, radius, vertices=8):
    """Cylinder spanning ship-space points a and b.

    a, b     -- ship-space (x, y, z) endpoints
    radius   -- cylinder radius in Blender units
    vertices -- cross-section polygon count (default 8)
    The cylinder axis is aligned to the a->b direction via a quaternion
    rotation from the default Blender +Z cylinder axis.
    """
    a_bl = mathutils.Vector(_bloc(a))
    b_bl = mathutils.Vector(_bloc(b))
    mid = (a_bl + b_bl) * 0.5
    vec = b_bl - a_bl
    length = vec.length
    if length < 1e-6:
        return None

    rot = mathutils.Vector((0.0, 0.0, 1.0)).rotation_difference(
        vec.normalized())

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=length,
        location=tuple(mid),
        rotation=tuple(rot.to_euler()))

    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return obj



# ---------------------------------------------------------------------------
# Kit hardware callables (new in second correction round)
# ---------------------------------------------------------------------------

def plate_grid(parts, name, role, loc, size, mat, cols, rows,
               face='y', depth=0.25, gap=0.06):
    """Grid of shallow plates seated on one face of the given box volume.

    loc  -- ship-space centre of the host volume (x, y, z)
    size -- ship-space full extents of the host volume (sx, sy, sz)
    cols, rows -- number of plates across and down the face
    face -- which face: 'y' (+Y top), '-y' (-Y bottom),
                        'x' (+X starboard), '-x' (-X port),
                        'z' (+Z stern), '-z' (-Z bow)
    depth -- plate thickness; plates sink 25 pct into the face so they
             read attached and never float
    gap   -- fraction of cell size kept clear between adjacent plates

    Plates are tagged with the supplied role and appended to parts.
    Returns the list of created box objects.
    """
    objs = []
    if cols < 1 or rows < 1:
        return objs
    x0, y0, z0 = loc
    sx, sy, sz = size
    sink = depth * 0.25     # each plate sinks 25 pct of its depth into the face

    if face == 'y':
        # +Y (top) face: cols along X, rows along Z
        face_y = y0 + sy * 0.5
        cell_x = sx / cols
        cell_z = sz / rows
        pw = cell_x * (1.0 - gap)
        pd = cell_z * (1.0 - gap)
        cy = face_y + depth * 0.5 - sink
        for r in range(rows):
            cz = z0 - sz * 0.5 + (r + 0.5) * cell_z
            for c in range(cols):
                cx = x0 - sx * 0.5 + (c + 0.5) * cell_x
                obj = box(parts, '%s.%02d_%02d' % (name, r, c), role,
                          (cx, cy, cz), (pw, depth, pd), mat)
                objs.append(obj)

    elif face == '-y':
        # -Y (bottom) face: cols along X, rows along Z
        face_y = y0 - sy * 0.5
        cell_x = sx / cols
        cell_z = sz / rows
        pw = cell_x * (1.0 - gap)
        pd = cell_z * (1.0 - gap)
        cy = face_y - depth * 0.5 + sink
        for r in range(rows):
            cz = z0 - sz * 0.5 + (r + 0.5) * cell_z
            for c in range(cols):
                cx = x0 - sx * 0.5 + (c + 0.5) * cell_x
                obj = box(parts, '%s.%02d_%02d' % (name, r, c), role,
                          (cx, cy, cz), (pw, depth, pd), mat)
                objs.append(obj)

    elif face == 'x':
        # +X (starboard) face: cols along Z, rows along Y
        face_x = x0 + sx * 0.5
        cell_z = sz / cols
        cell_y = sy / rows
        pd = cell_z * (1.0 - gap)
        ph = cell_y * (1.0 - gap)
        cx = face_x + depth * 0.5 - sink
        for r in range(rows):
            cy = y0 - sy * 0.5 + (r + 0.5) * cell_y
            for c in range(cols):
                cz = z0 - sz * 0.5 + (c + 0.5) * cell_z
                obj = box(parts, '%s.%02d_%02d' % (name, r, c), role,
                          (cx, cy, cz), (depth, ph, pd), mat)
                objs.append(obj)

    elif face == '-x':
        # -X (port) face: cols along Z, rows along Y
        face_x = x0 - sx * 0.5
        cell_z = sz / cols
        cell_y = sy / rows
        pd = cell_z * (1.0 - gap)
        ph = cell_y * (1.0 - gap)
        cx = face_x - depth * 0.5 + sink
        for r in range(rows):
            cy = y0 - sy * 0.5 + (r + 0.5) * cell_y
            for c in range(cols):
                cz = z0 - sz * 0.5 + (c + 0.5) * cell_z
                obj = box(parts, '%s.%02d_%02d' % (name, r, c), role,
                          (cx, cy, cz), (depth, ph, pd), mat)
                objs.append(obj)

    elif face == 'z':
        # +Z (stern) face: cols along X, rows along Y
        face_z = z0 + sz * 0.5
        cell_x = sx / cols
        cell_y = sy / rows
        pw = cell_x * (1.0 - gap)
        ph = cell_y * (1.0 - gap)
        cz = face_z + depth * 0.5 - sink
        for r in range(rows):
            cy = y0 - sy * 0.5 + (r + 0.5) * cell_y
            for c in range(cols):
                cx = x0 - sx * 0.5 + (c + 0.5) * cell_x
                obj = box(parts, '%s.%02d_%02d' % (name, r, c), role,
                          (cx, cy, cz), (pw, ph, depth), mat)
                objs.append(obj)

    else:  # face == '-z'
        # -Z (bow) face: cols along X, rows along Y
        face_z = z0 - sz * 0.5
        cell_x = sx / cols
        cell_y = sy / rows
        pw = cell_x * (1.0 - gap)
        ph = cell_y * (1.0 - gap)
        cz = face_z - depth * 0.5 + sink
        for r in range(rows):
            cy = y0 - sy * 0.5 + (r + 0.5) * cell_y
            for c in range(cols):
                cx = x0 - sx * 0.5 + (c + 0.5) * cell_x
                obj = box(parts, '%s.%02d_%02d' % (name, r, c), role,
                          (cx, cy, cz), (pw, ph, depth), mat)
                objs.append(obj)

    return objs



def barbette(parts, glow, name, loc, hull_mat, glow_mat, radius, height, barrels=2):
    """Armoured turret base ring, rotating housing, and paired barrels; small glow aperture.

    loc      -- ship-space centre of the base ring bottom
    radius   -- outer radius of the base ring
    height   -- total assembly height in ship Y
    barrels  -- number of side-by-side barrels (default 2)

    Base ring and housing go into parts (ROLE_ARMOUR).
    Glow aperture goes into glow (tagged 'glow').
    Returns combined list [ring, house, barrel.00, …, glow].

    Triangle budget: ≈116 tris (well under the 220 cap).
    """
    objs = []
    x0, y0, z0 = loc

    # Base armour collar: short fat cylinder (default Blender Z axis = ship Y)
    ring_h = max(height * 0.25, 0.08)
    base = cyl(parts, '%s-ring' % name, ROLE_ARMOUR,
               (x0, y0 + ring_h * 0.5, z0),
               radius, ring_h, hull_mat, vertices=8)
    objs.append(base)

    # Rotating housing: taller, slightly narrower cylinder on top
    house_h = height - ring_h
    house_y = y0 + ring_h + house_h * 0.5
    house_r = radius * 0.82
    house = cyl(parts, '%s-house' % name, ROLE_ARMOUR,
                (x0, house_y, z0), house_r, house_h, hull_mat, vertices=8)
    objs.append(house)

    # Barrels: thin cylinders pointing forward (ship -Z = Blender +Y direction)
    # rotation=(pi/2,0,0) aligns cyl depth to Blender Y axis (ship ±Z direction)
    barrel_r = max(radius * 0.09, 0.035)
    barrel_len = radius * 1.5
    barrel_rot = (math.pi * 0.5, 0.0, 0.0)
    bspacing = radius * 0.32 if barrels > 1 else 0.0
    for i in range(max(barrels, 1)):
        cx = x0 + (i - (barrels - 1) * 0.5) * bspacing
        # Barrel centre is half-length forward of the housing centre
        b = cyl(parts, '%s-barrel.%02d' % (name, i), ROLE_ARMOUR,
                (cx, house_y, z0 - barrel_len * 0.5),
                barrel_r, barrel_len, hull_mat,
                rotation=barrel_rot, vertices=6)
        objs.append(b)

    # Small glow aperture at the front face of the housing
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=6,
        radius=radius * 0.14,
        depth=0.04,
        location=_bloc((x0, house_y, z0 - house_r - 0.02)),
        rotation=barrel_rot)
    eye = bpy.context.object
    eye.name = '%s-glow' % name
    eye.data.materials.append(glow_mat)
    eye['skin_role'] = 'glow'
    glow.append(eye)
    objs.append(eye)

    return objs


def nozzle_ring(parts, glow, name, loc, hull_mat, glow_mat, radius, depth):
    """Engine nozzle throat with an inner glow disc.

    Builds a square-section annular ring (10-sided) facing ship +Z (stern)
    via bmesh.  Cheaper than a torus at comparable visual quality.

    loc    -- ship-space centre of the ring
    radius -- outer radius of the nozzle throat
    depth  -- axial thickness of the ring collar (ship Z direction)

    Ring goes into parts (ROLE_HULL); glow disc goes into glow ('glow').
    Returns [ring_obj, glow_disc].

    Triangle budget: ≈108 tris (well under the 160 cap).
    """
    objs = []
    x0, y0, z0 = loc
    N = 10                       # polygon segments for the ring cross-section
    inner_r = radius * 0.68      # throat inner radius

    # Square-section annular ring built in Blender XZ plane
    # (ship XY plane = Blender XZ plane, ring opening faces Blender Y = ship ±Z)
    bm = bmesh.new()
    bl_y_front = depth * 0.5    # Blender +Y side = ship nose side
    bl_y_back  = -depth * 0.5   # Blender -Y side = ship stern side

    fo, fi, bo, bi = [], [], [], []
    for k in range(N):
        angle = 2.0 * math.pi * k / N
        ca, sa = math.cos(angle), math.sin(angle)
        fo.append(bm.verts.new((radius  * ca, bl_y_front, radius  * sa)))
        fi.append(bm.verts.new((inner_r * ca, bl_y_front, inner_r * sa)))
        bo.append(bm.verts.new((radius  * ca, bl_y_back,  radius  * sa)))
        bi.append(bm.verts.new((inner_r * ca, bl_y_back,  inner_r * sa)))

    for k in range(N):
        nk = (k + 1) % N
        bm.faces.new((fo[k], fo[nk], bo[nk], bo[k]))   # outer wall
        bm.faces.new((fi[k], bi[k], bi[nk], fi[nk]))   # inner wall
        bm.faces.new((fo[nk], fi[nk], fi[k], fo[k]))   # front annulus
        bm.faces.new((bo[k], bo[nk], bi[nk], bi[k]))   # back annulus

    ring_obj = _bmesh_finish(bm, '%s-ring' % name, ROLE_HULL, loc, hull_mat, parts)
    objs.append(ring_obj)

    # Glow disc: flat emissive cylinder inside the throat, facing ship +Z
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=inner_r * 0.90,
        depth=0.04,
        location=_bloc((x0, y0, z0)),
        rotation=(math.pi * 0.5, 0.0, 0.0))
    disc = bpy.context.object
    disc.name = '%s-glow' % name
    disc.data.materials.append(glow_mat)
    disc['skin_role'] = 'glow'
    glow.append(disc)
    objs.append(disc)

    return objs


def handrail(parts, name, loc, mat, length, axis='z', posts=6):
    """Thin rail and evenly spaced posts, human scale.

    Delegates to rail() with posts=6 as the default (vs rail's 4).
    Role is ROLE_TRIM throughout.

    Returns a list [strip, post.00, post.01, ...].
    """
    return rail(parts, name, loc, mat, length, axis=axis, posts=posts)


def sensor_mast(parts, glow, name, loc, hull_mat, glow_mat, height, radius):
    """Short armoured mast with a glow eye at the top.

    loc    -- ship-space base centre (bottom of the mast)
    height -- total mast height in ship Y
    radius -- shaft radius

    Base flange, shaft, and sensor cap go into parts (ROLE_ARMOUR).
    Glow eye goes into glow (tagged 'glow').
    Returns [base, shaft, cap, glow].

    Triangle budget: ≈104 tris (well under the 120 cap).
    """
    objs = []
    x0, y0, z0 = loc

    # Base flange: wider, short collar at the mount point
    base_h = height * 0.18
    base_r = radius * 1.4
    base = cyl(parts, '%s-base' % name, ROLE_ARMOUR,
               (x0, y0 + base_h * 0.5, z0), base_r, base_h, hull_mat, vertices=8)
    objs.append(base)

    # Shaft
    shaft_h = height * 0.65
    shaft_y = y0 + base_h + shaft_h * 0.5
    shaft = cyl(parts, '%s-shaft' % name, ROLE_ARMOUR,
                (x0, shaft_y, z0), radius, shaft_h, hull_mat, vertices=8)
    objs.append(shaft)

    # Sensor housing: slightly wider cap at the top
    cap_h = height * 0.17
    cap_y = y0 + base_h + shaft_h + cap_h * 0.5
    cap_r = radius * 1.3
    cap = cyl(parts, '%s-cap' % name, ROLE_ARMOUR,
              (x0, cap_y, z0), cap_r, cap_h, hull_mat, vertices=8)
    objs.append(cap)

    # Glow eye at the very top of the housing
    eye_y = y0 + base_h + shaft_h + cap_h
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=6,
        radius=radius * 0.55,
        depth=0.05,
        location=_bloc((x0, eye_y, z0)))
    eye = bpy.context.object
    eye.name = '%s-glow' % name
    eye.data.materials.append(glow_mat)
    eye['skin_role'] = 'glow'
    glow.append(eye)
    objs.append(eye)

    return objs


def rescue_hatch(parts, glow, name, loc, hull_mat, glow_mat, size, face='y'):
    """Composite rescue-airlock assembly: recessed door panel, raised collar
    frame, two status indicator lamps.

    loc  -- ship-space centre of the hatch bounding volume (x, y, z)
    size -- ship-space full extents (sx, sy, sz); the component along the face
            normal drives collar and door depth; the other two set the footprint
    face -- which hull face the hatch opens on:
            'y' top, '-y' belly, 'x' starboard, '-x' port, 'z' stern, '-z' bow

    The collar overlaps the host face by 20 pct of its own depth so the
    assembly reads attached, never detached.  Lamps go to glow (tagged 'glow');
    door plate and collar go to parts (ROLE_ARMOUR / ROLE_RECESS).
    Returns a combined list of all created objects.

    Triangle budget: 48 triangles (four boxes at 12 each).
    """
    objs = []
    sx, sy, sz = size
    _sz = [sx, sy, sz]

    # Normal axis index and outward sign for each face
    _ai = {'y': 1, '-y': 1, 'x': 0, '-x': 0, 'z': 2, '-z': 2}[face]
    _sg = {'y': 1.0, '-y': -1.0, 'x': 1.0, '-x': -1.0, 'z': 1.0, '-z': -1.0}[face]

    # Position of the host face along the normal axis (uses centre convention)
    face_coord = loc[_ai] + _sg * _sz[_ai] * 0.5

    # The two footprint axes (perpendicular to normal)
    _fp = [i for i in (0, 1, 2) if i != _ai]
    fp0 = _sz[_fp[0]]    # footprint width
    fp1 = _sz[_fp[1]]    # footprint length

    # Component depths along the face normal
    cd = _sz[_ai] * 0.56          # collar depth
    c_sink = cd * 0.20             # collar overlap into host
    dh = _sz[_ai] * 0.18          # door plate depth
    lh = _sz[_ai] * 0.20          # lamp depth

    def _lc(n_off, s0=0.0, s1=0.0):
        """Ship-space loc: n_off outward from face, s0/s1 in footprint plane."""
        v = list(loc)
        v[_ai] = face_coord + _sg * n_off
        v[_fp[0]] += s0
        v[_fp[1]] += s1
        return tuple(v)

    def _sz3(n_depth, f0=1.0, f1=1.0):
        """Size tuple: n_depth on normal axis; fp0*f0, fp1*f1 on footprint axes."""
        s = list(_sz)
        s[_ai] = n_depth
        s[_fp[0]] = fp0 * f0
        s[_fp[1]] = fp1 * f1
        return tuple(s)

    # ── Collar frame: 56 pct of face-normal size; 20 pct sinks into host ────
    # Centre is (cd/2 - c_sink) outward → protrudes 80 pct, overlaps 20 pct.
    collar = box(parts, name + '.collar', ROLE_ARMOUR,
                 _lc(cd * 0.5 - c_sink), _sz3(cd), hull_mat)
    objs.append(collar)

    # ── Recessed door panel: 18 pct depth, slightly inside the face ─────────
    door = box(parts, name + '.door', ROLE_RECESS,
               _lc(-dh * 0.30), _sz3(dh, 0.78, 0.78), hull_mat)
    objs.append(door)

    # ── Status lamps: near the outer collar face, diagonal footprint offset ──
    l_n = cd - c_sink - lh * 0.40   # normal offset (near collar outer face)
    for suffix, d0, d1 in (('.lampA',  fp0 * 0.27,  fp1 * 0.27),
                            ('.lampB', -fp0 * 0.27, -fp1 * 0.27)):
        lp = _lc(l_n, d0, d1)
        ls = _sz3(lh, 0.10, 0.10)
        bpy.ops.mesh.primitive_cube_add(location=_bloc(lp))
        lamp = bpy.context.object
        lamp.name = name + suffix
        lamp.scale = tuple(v / 2.0 for v in _bsize(ls))
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        lamp.data.materials.append(glow_mat)
        lamp['skin_role'] = 'glow'
        glow.append(lamp)
        objs.append(lamp)

    return objs