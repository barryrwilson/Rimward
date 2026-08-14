"""Beautiful Ones shared hull-surface language: loft queries and living module.

One geometry builder lives here: ``grown_loft``, the faction's body sweep.
Everything else is the query set every class file seats its anatomy with,
plus the ABSOLUTE biological scale constants (the faction's human module)
and the ``surf_*`` / ``fin_ray`` callback factories. Same shape of answer as
the wave-7 reference (gilded/surface.py): a class author never hand-writes a
lambda, and a run self-trims because a factory returns 0.0 off the section.

GROWN BODIES USE ``grown_loft``. It sweeps TRUE ELLIPSE rings (default 16
radial points) through the same station tuples. kit.hull_loft's 8-point
chamfered ring is LEGACY for this faction: its octagon front silhouettes
read as faceted plating, which a grown body must never show. The queries
below (section, flank_x, top_y, bottom_y, flat_half, straight_*) still
describe the fair-octagon APPROXIMATION of the section — that is fine and
intentional: on a fair() station the true ellipse sits inside the octagon's
error bars (the octagon's flat runs and chamfer corners bracket the ellipse
within ~0.15 of the smaller half-extent), so organ seating needs no change.
The chamfer field of the station tuple is ignored by grown_loft; it is kept
for the legacy kit sweep and for the queries above.

THE ABSOLUTE MODULE. 1 world unit ~= 3.64 m (P = 6.6 = 24 m). The Beautiful
Ones have no windows, hatches, rails or collars, so the scale cues are
biological: crown filament thickness and length, vein radius and branch
pitch, breathing-vent lips, the nursery hollow and the companion craft that
nests in it. They are NEVER multiplied by ship l, b or h: a larger organism
carries MORE filaments, MORE hollows and MORE companions, never bigger ones.

Kit size conventions (verified against scripts/ship_kit.py source):
    kit.box (line 82: obj.scale = size / 2 on Blender's default 2-unit cube),
    kit.plate_course / plate_grid / panel_lines / greeble_field,
    kit.chamfer_block / kit.taper_block / kit.wedge / kit.hull_loft
                                            -> FULL extents
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
COMPANION_LEN = 2.6    # nested companion craft overall length — ~9.5 m;
                       #   light-class anatomy, a young wayfinder in miniature


# ---------------------------------------------------------------------------
# Hull surface queries
#
# Every function here returns a coordinate or a station tuple. None of them
# create geometry.
# ---------------------------------------------------------------------------

def fair(z, half_w, half_h, y_offset, k=0.49):
    """Return one station chamfered toward a smooth near-ellipse.

    Returns a ``(z, half_w, half_h, y_offset, chamfer)`` tuple ready for
    ``grown_loft`` (which ignores the chamfer field) and for the legacy
    ``hull_loft``. ``k=0.49`` sits exactly at the kit's internal clamp
    (``_chamfer_ring`` clamps the chamfer to 49 % of the smaller half-extent),
    so the rounded octagon is as round as the kit can cut it: a swollen
    living section with no flat face and no corner. The whole faction's body
    language rests on this — a grown hull never shows a plank edge.
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
    the chamfer. On a near-ellipse (fair) section the straight run is short
    and the fall-off is most of the flank — that is the body's soft roll.
    Returns 0.0 when ``y`` is above or below the section — callers rely on
    this to self-trim runs of creases, fronds and flow lines, so the value
    is never negative and never clamped to a small positive.
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
    On a fair section the flat crown is narrow — the pearl back is a crest,
    not a deck.
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

    Returns a y coordinate. Above this point the section chamfer begins. On a
    fair section this sits close under the crown.
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

    Use for flank-seated runs: fold creases, breathing-vent rows, hollows.
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


def fin_ray(root, tip):
    """Return callable(t) -> ship-space (x, y, z) point on the segment root->tip.

    The fin-membrane seating factory. ``root`` and ``tip`` are the explicit
    anchors handed to anatomy.fin_membrane (root inside the hull, tip at the
    membrane's end). The closure linearly interpolates between them, clamped
    to t in [0, 1], so class authors can seat spanwise details — a vein
    entering a fin, a flow-line endpoint, a companion craft resting against
    a fin root — at an exact span fraction without re-deriving the segment.
    t = 0.0 returns ``root``, t = 1.0 returns ``tip``.
    """
    rx, ry, rz = root
    dx = tip[0] - rx
    dy = tip[1] - ry
    dz = tip[2] - rz

    def at(t):
        t = max(0.0, min(1.0, t))
        return (rx + dx * t, ry + dy * t, rz + dz * t)
    return at


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
                SAME tuples sf.fair() returns and the class files already
                build; the chamfer field is IGNORED (it exists for the
                legacy kit.hull_loft sweep and the surface queries, which
                still describe the fair-octagon approximation of this
                section). At least two stations are required.
    radial   -- points per ring (default 16; floored at 4).

    Each station becomes one ring of ``radial`` verts on the true ellipse
    x = half_w * cos(t), y = y_offset + half_h * sin(t) at ship z. Rings are
    bridged with ``radial`` quads per span; the end caps are n-gons built
    from the ring verts themselves, so the caps are WELDED — no duplicate
    verts, no seams. Every polygon is smooth-shaded: grown flesh shows no
    facets. Geometry is absolute ship space; the object sits at the Blender
    origin, exactly like kit.hull_loft.

    Ring/segment cost per loft (N stations, radial R):
        verts   R * N          (vs 8 * N for the legacy octagon sweep)
        quads   R * (N - 1)    (vs 8 * (N - 1))
        caps    2 n-gons (welded)
    At the default R = 16 a loft costs exactly 2x the legacy octagon sweep.
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
            # Decreasing angle = same winding as kit._chamfer_ring (CCW
            # viewed from Blender +Y), so recalc_face_normals yields
            # outward normals.
            th = -2.0 * math.pi * i / radial
            ring.append(bm.verts.new((hw * math.cos(th), bl_y,
                                      hh * math.sin(th) + yo)))
        rings.append(ring)

    for ri in range(len(rings) - 1):
        r0, r1 = rings[ri], rings[ri + 1]
        for i in range(radial):
            j = (i + 1) % radial
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))

    bm.faces.new(rings[0][::-1])    # first-station cap (welded: ring verts)
    bm.faces.new(rings[-1])         # last-station cap (welded: ring verts)

    # Inline finish, mirroring anatomy.fleshy_sweep: recalc normals, smooth
    # every polygon (grown flesh shows no facets), link, tag, append.
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
