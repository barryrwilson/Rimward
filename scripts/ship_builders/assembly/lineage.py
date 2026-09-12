"""Assembly surface language: the copied BUS CAN, joints, bands, the core.

Redesign (2026-09, owner-approved concept): the Assembly descends from ONE
ancient human survey probe. A survey probe is an instrument bus, a
high-gain dish that points home, long booms, and a power source. Ten
thousand generations of copying grew those four parts into a fleet. The
module is the BUS CAN: a short, wide, ten-sided instrument prism copied
along a charcoal spine. Copy-drift changes the facet count (9 / 10 / 11)
and the proud step of each shell plate; it never changes the joint ring.

Every can carries one teal optic, one faded-orange re-fabricated facet
(a panel the lineage could not colour-match), and a registry band (the
lineage stencil, painted on every can at one letter height).

Construction logic (synthesis/21 G6): REPEATED MODULE. One part, many
copies, linear arrays, visible joints. This module builds geometry through
ship_kit only. It never queries a hull; class files pass loc, radius and
length. All module thicknesses come from surface.py and are ABSOLUTE.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / chamfer_block / taper_block / hull_loft  -> FULL extents
    kit.cyl / torus / strut                            -> real radius / depth
There is NO half-extent entry point in the kit.

Facet geometry: kit.cyl with ``vertices=n`` and rotation CYL_ALONG_Z puts
vertex 0 on ship +X and facet centre i at ship-plane angle
``2*pi*(i+0.5)/n`` measured from +X toward +Y. For n = 10 the top facet is
i = 2 (+Y) and the bottom facet is i = 7. A rotation of ``phi`` about ship
Z is Blender ``rotation_euler = (0, -phi, 0)``; a kit box rotated by
``phi = angle - pi/2`` has its local +Y (thickness axis) pointing along
``(cos angle, sin angle, 0)``.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


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


def drift_sides(seed):
    """Facet count for one can: 10 canon, 9 or 11 by copy-drift (seeded)."""
    v = kit.rng(int(seed) & 0xFFFFFFFF)()
    if v < 0.18:
        return 9
    if v > 0.82:
        return 11
    return sf.CAN_SIDES


def apothem(radius, sides):
    """Distance from the can axis to a facet centre."""
    return radius * math.cos(math.pi / sides)


def facet_width(radius, sides):
    """Flat width of one facet."""
    return 2.0 * radius * math.sin(math.pi / sides)


def facet_angle(sides, facet):
    """Ship-plane angle (from +X toward +Y) of facet centre ``facet``."""
    return 2.0 * math.pi * (facet + 0.5) / sides


def facet_dir(sides, facet):
    a = facet_angle(sides, facet)
    return (math.cos(a), math.sin(a), 0.0)


def top_facet(sides):
    """Index of the facet whose centre is nearest +Y."""
    best = 0
    best_d = 9.0
    for i in range(sides):
        d = abs(facet_angle(sides, i) - math.pi * 0.5)
        if d < best_d:
            best_d = d
            best = i
    return best


def bottom_facet(sides):
    best = 0
    best_d = 9.0
    for i in range(sides):
        d = abs(facet_angle(sides, i) - math.pi * 1.5)
        if d < best_d:
            best_d = d
            best = i
    return best


def side_facet(sides, starboard=True):
    """Index of the facet nearest +X (starboard) or -X (port)."""
    target = 0.0 if starboard else math.pi
    best = 0
    best_d = 9.0
    for i in range(sides):
        a = facet_angle(sides, i)
        d = abs(math.atan2(math.sin(a - target), math.cos(a - target)))
        if d < best_d:
            best_d = d
            best = i
    return best


def facet_point(loc, radius, sides, facet, z_off=0.0, proud=0.0):
    """Ship-space point on facet ``facet`` of a can centred at ``loc``."""
    d = facet_dir(sides, facet)
    dist = apothem(radius, sides) + proud
    return (loc[0] + d[0] * dist, loc[1] + d[1] * dist, loc[2] + z_off)


def rotate_about_z(obj, angle):
    """Rotate a kit part about ship Z by ``angle`` (radians)."""
    if obj is not None:
        obj.rotation_euler = (0.0, -angle, 0.0)


def facet_plate(parts, name, role, mat, loc, radius, sides, facet, z_off,
                size, proud=0.02, bevel=0.0):
    """One box seated flat on facet ``facet`` of a can at ``loc``.

    ``size`` is (tangential width, radial thickness, length along Z), FULL
    extents. The plate centre sits ``apothem - thickness/2 + proud`` from
    the axis, so it buries ``thickness - proud`` into the drum and stands
    ``proud`` above the facet. Returns the box or None.
    """
    w, t, ln = size
    a = facet_angle(sides, facet)
    d = (math.cos(a), math.sin(a), 0.0)
    dist = apothem(radius, sides) - t * 0.5 + proud
    c = (loc[0] + d[0] * dist, loc[1] + d[1] * dist, loc[2] + z_off)
    obj = kit.box(parts, name, role, c, (w, t, ln), mat, bevel=bevel)
    rotate_about_z(obj, a - math.pi * 0.5)
    return obj


def joint_ring(parts, name, mat, loc, radius, detail=3):
    """Visible mechanical joint between two copies (the boundary the copy
    never crosses).

    FACING: wraps the spine about ship Z. ``loc`` is the ring centre.
    ``radius`` is the host can radius; the ring stands proud so the joint
    reads as a clamp, not a painted line.

    Detail: 0 = nothing; 1 = recess collar; 2+ = collar plus a bead.
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
    if detail >= 3:
        # Clamp bolts: the joint is hardware, not a painted line.
        for k in range(6):
            a = 2.0 * math.pi * k / 6.0 + math.pi / 6.0
            c = (loc[0] + math.cos(a) * (r + 0.04), loc[1] + math.sin(a) * (r + 0.04), loc[2])
            bolt = kit.box(parts, '%s.bolt.%d' % (name, k), kit.ROLE_HULL, c,
                           (0.09, 0.08, 0.11), mat)
            rotate_about_z(bolt, a - math.pi * 0.5)
            if bolt:
                objs.append(bolt)
    return objs


def edge_seams(parts, name, mat, loc, radius, sides, length, detail=3):
    """Charcoal seam strips along every facet edge of an off-white drum.

    The drum is one off-white prism at every LOD; these strips are what
    make it read as ten clamped shells on a charcoal frame.
    Detail: 0 = nothing; 1 = every other edge; 2+ = every edge.
    """
    if detail < 1:
        return []
    objs = []
    step = 1 if detail >= 2 else 2
    ln = max(0.30, length * 0.96)
    for k in range(0, sides, step):
        a = 2.0 * math.pi * k / sides
        d = (math.cos(a), math.sin(a), 0.0)
        c = (loc[0] + d[0] * (radius - 0.015), loc[1] + d[1] * (radius - 0.015), loc[2])
        strip = kit.box(parts, '%s.seam.%02d' % (name, k), kit.ROLE_RECESS,
                        c, (0.07, 0.07, ln), mat)
        rotate_about_z(strip, a - math.pi * 0.5)
        if strip:
            objs.append(strip)
    return objs


def shell_plates(parts, name, mat, loc, radius, sides, length, rows=2,
                 detail=3, seed=1, skip=(), plate_t=None):
    """Off-white shell plates on every facet, stepped proud by copy-drift.

    ``rows`` plates per facet along Z. Each plate is narrower than its facet
    by FACET_PLATE_GAP so the charcoal seam shows. Detail: 0/1 = nothing;
    2 = one row; 3 = ``rows``. Facets listed in ``skip`` get no plates
    (an optic or the orange facet sits there).
    """
    if detail < 2:
        return []
    n_rows = rows if detail >= 3 else 1
    fw = facet_width(radius, sides) * (1.0 - sf.FACET_PLATE_GAP)
    margin = 0.12
    usable = max(0.20, length - 2.0 * margin)
    pl = usable / n_rows * 0.90
    rand = kit.rng(int(seed) & 0xFFFFFFFF)
    if plate_t is None:
        plate_t = sf.FACET_PLATE_T
    objs = []
    for f in range(sides):
        if f in skip:
            continue
        for r in range(n_rows):
            z_off = -usable * 0.5 + usable * (r + 0.5) / n_rows
            proud = 0.015 + rand() * 0.035 + max(0.0, plate_t - sf.FACET_PLATE_T) * 0.5
            p = facet_plate(parts, '%s.plate.%02d_%d' % (name, f, r),
                            kit.ROLE_ARMOUR, mat, loc, radius, sides, f, z_off,
                            (fw, plate_t, pl), proud=proud,
                            bevel=0.012)
            if p:
                objs.append(p)
    return objs


def orange_facet(parts, name, mat, loc, radius, sides, facet, z_off, length,
                 detail=3, seed=1):
    """The faded-orange re-fabricated facet: one block accent per can.

    Detail: 0 = nothing (accent is not a primary mass); 1+ = the block.
    """
    if detail < 1:
        return []
    sc, _rot, off = copy_drift(seed)()
    fw = facet_width(radius, sides) * 0.78 * sc[0]
    pl = max(0.20, length * 0.42 * sc[2])
    p = facet_plate(parts, name + '.orange-facet', kit.ROLE_ACCENT, mat,
                    (loc[0], loc[1], loc[2] + off[2]), radius, sides, facet,
                    z_off, (fw, 0.10, pl), proud=0.05)
    return [p] if p else []


def registry_band(parts, name, mat, loc, radius, sides, z_off, detail=3,
                  seed=1):
    """The lineage stencil: a dark band ring near one end of the can, with
    a few pale stencil ticks at constant letter height.

    Detail: 0/1 = nothing; 2 = the band; 3 = band plus ticks.
    """
    if detail < 2:
        return []
    objs = []
    c = (loc[0], loc[1], loc[2] + z_off)
    band = kit.cyl(parts, name + '.band', kit.ROLE_RECESS, c,
                   radius + sf.BAND_PROUD, sf.BAND_DEPTH, mat,
                   rotation=sf.CYL_ALONG_Z, vertices=max(12, sides * 2))
    if band:
        objs.append(band)
    if detail >= 3:
        rand = kit.rng(int(seed) & 0xFFFFFFFF)
        proud = (radius - apothem(radius, sides)) + sf.BAND_PROUD + 0.03
        for f in range(sides):
            if rand() < 0.45:
                continue
            tw, tt, tl = sf.BAND_TICK
            t = facet_plate(parts, '%s.tick.%02d' % (name, f), kit.ROLE_TRIM,
                            mat, loc, radius, sides, f, z_off,
                            (tw, tt, tl), proud=proud)
            if t:
                objs.append(t)
    return objs


def bus_can(parts, name, mat, loc, radius, length, detail=3, seed=1,
            sides=None, rows=2, orange=True, band=True, skip=(), plate_t=None):
    """One copied survey bus: off-white drum, end joints, seams, plates,
    orange facet, registry band.

    ``loc`` is the can centre; ``radius`` is the circumradius; ``length``
    along Z. ``sides`` defaults to copy-drift (9/10/11). ``skip`` lists
    facets to leave bare for an optic. Returns (objs, sides) so the caller
    can seat optics on the drifted facet count.

    Detail: 0 = drum; 1 = + end joints, seams, orange; 2 = + plates (one
    row), band; 3 = full rows, band ticks.
    """
    if sides is None:
        sides = drift_sides(seed)
    objs = []
    drum = kit.cyl(parts, name + '.drum', kit.ROLE_ARMOUR, loc, radius,
                   length, mat, rotation=sf.CYL_ALONG_Z, vertices=sides)
    if drum:
        objs.append(drum)
    if detail < 1:
        return objs, sides
    half = length * 0.5
    objs.extend(joint_ring(parts, name + '.jn', mat,
                           (loc[0], loc[1], loc[2] - half + 0.05), radius,
                           detail=detail))
    objs.extend(joint_ring(parts, name + '.js', mat,
                           (loc[0], loc[1], loc[2] + half - 0.05), radius,
                           detail=detail))
    objs.extend(edge_seams(parts, name, mat, loc, radius, sides, length,
                           detail=detail))
    o_facet = None
    if orange:
        rand = kit.rng((int(seed) * 7 + 3) & 0xFFFFFFFF)
        cands = [f for f in range(sides) if f not in skip]
        if cands:
            o_facet = cands[int(rand() * len(cands)) % len(cands)]
            objs.extend(orange_facet(parts, name, mat, loc, radius, sides,
                                     o_facet, -length * 0.12, length,
                                     detail=detail, seed=seed + 11))
    plate_skip = tuple(skip) + ((o_facet,) if o_facet is not None else ())
    objs.extend(shell_plates(parts, name, mat, loc, radius, sides, length,
                             rows=rows, detail=detail, seed=seed + 23,
                             skip=plate_skip, plate_t=plate_t))
    if band:
        objs.extend(registry_band(parts, name, mat, loc, radius, sides,
                                  length * 0.5 - 0.30, detail=detail,
                                  seed=seed + 31))
    return objs, sides


def spine_bar(parts, name, mat, z0, z1, radius, x=0.0, y=0.0, detail=3):
    """The charcoal structural spine the cans are copied along.

    Octagonal chamfer_block from z0 to z1 (FULL extents). Always built —
    it is the primary connection between every can, drive and dish.
    """
    ln = max(0.30, z1 - z0)
    bar = kit.chamfer_block(parts, name + '.spine', kit.ROLE_HULL,
                            (x, y, (z0 + z1) * 0.5),
                            (radius * 2.0, radius * 2.0, ln), mat,
                            chamfer=radius * 0.35)
    return [bar] if bar else []


def orange_patch(parts, name, mat, loc, size=None, detail=3, seed=1):
    """One faded-orange replacement block on a flat face (not a can).

    Detail: 0 = nothing; 1+ = the block.
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
    panel = kit.box(parts, name + '.orange-patch', kit.ROLE_ACCENT,
                    _add(loc, off), (sx, sy, sz), mat)
    return [panel] if panel else []


def ancient_core(parts, glow, name, hull_mat, glow_mat, loc, radius, length,
                 detail=3, seed=1):
    """THE ANCIENT CORE: the original probe body, dark, caged, off-centre.

    A charcoal nine-sided drum with its own joints and one side optic,
    inside a cage of two rings and four longitudinal bars. The caller seats
    ``loc`` below the spine so the cage rings pass through the spine bar
    (that intersection is the connection). Cage rings are always built.

    Detail: 0 = drum + rings; 1 = + joints + optic; 2+ = + cage bars.
    """
    objs = []
    sides = 9
    drum = kit.cyl(parts, name + '.core-drum', kit.ROLE_HULL, loc, radius,
                   length, hull_mat, rotation=sf.CYL_ALONG_Z, vertices=sides)
    if drum:
        objs.append(drum)
    cage_r = radius + sf.CAGE_CLEAR
    half = length * 0.5
    for tag, zo in (('a', -half + 0.10), ('b', half - 0.10)):
        ring = kit.torus(parts, '%s.cage-ring.%s' % (name, tag), kit.ROLE_TRIM,
                         (loc[0], loc[1], loc[2] + zo), cage_r, 0.05,
                         hull_mat, rotation=sf.CYL_ALONG_Z)
        if ring:
            objs.append(ring)
    if detail < 1:
        return objs
    objs.extend(joint_ring(parts, name + '.jn', hull_mat,
                           (loc[0], loc[1], loc[2] - half + 0.06), radius,
                           detail=detail))
    objs.extend(joint_ring(parts, name + '.js', hull_mat,
                           (loc[0], loc[1], loc[2] + half - 0.06), radius,
                           detail=detail))
    from . import hardware as hw
    f = side_facet(sides, starboard=True)
    objs.extend(hw.teal_optic(parts, glow, name + '.eye', hull_mat, glow_mat,
                              facet_point(loc, radius, sides, f, 0.0, 0.0),
                              radius=min(sf.OPTIC_COLLAR_R, radius * 0.45),
                              facing='starboard', detail=detail))
    if detail < 2:
        return objs
    for k in range(4):
        a = math.pi * 0.25 + k * math.pi * 0.5
        x = loc[0] + math.cos(a) * cage_r
        y = loc[1] + math.sin(a) * cage_r
        bar = kit.strut(parts, '%s.cage-bar.%d' % (name, k), kit.ROLE_TRIM,
                        (x, y, loc[2] - half + 0.10), (x, y, loc[2] + half - 0.10),
                        hull_mat, sf.CAGE_STRUT_R, vertices=6)
        if bar:
            objs.append(bar)
    return objs
