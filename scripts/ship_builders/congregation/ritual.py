"""Congregation surface language: ribs, shrine cans, sails, drapes, nave.

Bible §4.9 / synthesis §G6: stacked reliquary cans, a procession of
identical shrines along a spine. This module builds geometry through
ship_kit only. It never queries a hull — the caller passes loc, size,
radius and optional ``surf`` callables computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point in the kit. Absolute sf.* constants go
into kit.box at their stated values. Human and Congregation module sizes
are NEVER multiplied by ship l, b or h.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
import mathutils

from . import surface as sf


_BL_LONG = mathutils.Vector((0.0, 1.0, 0.0))

_FACE_DIR = {
    'nose': (0.0, 0.0, -1.0),
    'stern': (0.0, 0.0, 1.0),
    'port': (-1.0, 0.0, 0.0),
    'starboard': (1.0, 0.0, 0.0),
    'up': (0.0, 1.0, 0.0),
    'down': (0.0, -1.0, 0.0),
}

_AXIS_DIR = {
    'x': (1.0, 0.0, 0.0),
    'y': (0.0, 1.0, 0.0),
    'z': (0.0, 0.0, 1.0),
}


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _dir(facing):
    if isinstance(facing, tuple):
        return facing
    return _FACE_DIR.get(facing, (0.0, 1.0, 0.0))


def _aim_long_axis(obj, ship_dir):
    """Rotate a kit part so its ship +Z long axis matches ``ship_dir``."""
    target = mathutils.Vector((ship_dir[0], -ship_dir[2], ship_dir[1]))
    if target.length < 1e-6:
        return
    obj.rotation_euler = _BL_LONG.rotation_difference(target.normalized()).to_euler()


def _boom_xy(facing):
    """Unit boom in the XY plane. Nose/stern map to a dorsal boom.

    Solar vanes radiate around the thrust axis. A boom along +Z would
    make a fin that sits edge-on to the light and cannot push the ship.
    """
    d = _dir(facing)
    hx, hy = d[0], d[1]
    horiz = math.hypot(hx, hy)
    if horiz < 0.20:
        return (0.0, 1.0, 0.0)
    return (hx / horiz, hy / horiz, 0.0)


def _orient_solar_sheet(obj, boom_ship, tilt):
    """Orient a kit.box/taper whose ship size is (chord, thick, span).

    Unrotated ``_bsize`` puts blender +Y on the span, +Z on the thickness
    and +X on the chord. The sheet then faces mostly aft (ship +Z) so
    photon pressure pushes the bow (−Z). ``tilt`` leans the sheet toward
    vertical so the side silhouette still reads.
    """
    boom_bl = mathutils.Vector((boom_ship[0], -boom_ship[2], boom_ship[1]))
    if boom_bl.length < 1e-6:
        return
    boom_bl.normalize()
    aft_bl = mathutils.Vector((0.0, -1.0, 0.0))
    thin = aft_bl - boom_bl * aft_bl.dot(boom_bl)
    if thin.length < 0.15:
        thin = mathutils.Vector((0.0, 0.0, 1.0))
        thin = thin - boom_bl * thin.dot(boom_bl)
    if thin.length < 1e-6:
        return
    thin.normalize()
    up_bl = mathutils.Vector((0.0, 0.0, 1.0))
    side_bl = mathutils.Vector((1.0, 0.0, 0.0))
    up_perp = up_bl - boom_bl * up_bl.dot(boom_bl)
    side_perp = side_bl - boom_bl * side_bl.dot(boom_bl)
    if up_perp.length > 0.1:
        lean = up_perp.normalized()
    elif side_perp.length > 0.1:
        lean = side_perp.normalized()
    else:
        lean = None
    if lean is not None:
        thin = (thin * math.cos(tilt) + lean * math.sin(tilt)).normalized()
    width = boom_bl.cross(thin)
    if width.length < 1e-6:
        return
    width.normalize()
    thin = width.cross(boom_bl).normalized()
    rot = mathutils.Matrix((width, boom_bl, thin)).transposed()
    obj.rotation_euler = rot.to_euler()


def _lod_count(n, detail, floor=1):
    if detail >= 3:
        return max(floor, int(n))
    if detail == 2:
        return max(floor, int(n) // 2)
    if detail == 1:
        return floor
    return floor


def rib_ring(parts, name, mat, loc, radius, detail=3):
    """Silver structural rib around a drum.

    FACING: wraps the drum about ship Z. ``loc`` is the ring centre on the
    axis. ``radius`` is the host drum radius. The solid collar fills the
    section and stands ``sf.RIB_PROUD`` proud so the rib is one body with
    the host (buried ``sf.RIB_BURY`` into the radius). Do not place this
    as a free torus in empty space — torus-in-a-hole fails the island probe.

    Detail: 0/1 = solid collar mass; 2+ = collar plus a thin torus bead.
    """
    r = max(radius, 0.16)
    objs = []
    collar = kit.cyl(parts, name + '.rib-ring', kit.ROLE_ARMOUR, loc,
                     r + sf.RIB_PROUD, sf.RIB_DEPTH, mat,
                     rotation=sf.CYL_ALONG_Z, vertices=12)
    if collar:
        objs.append(collar)
    if detail >= 2:
        bead = kit.torus(parts, name + '.rib-bead', kit.ROLE_TRIM, loc,
                         r + sf.RIB_PROUD * 0.4, sf.RIB_MINOR, mat,
                         rotation=sf.CYL_ALONG_Z)
        if bead:
            objs.append(bead)
    return objs


def shrine_can(parts, name, mat, loc, detail=3):
    """ONE reliquary / shrine cylinder. Identical copies. Visible end joints.

    FACING: long axis along ship Z. ``loc`` is the can centre. Size is the
    absolute ``sf.SHRINE_CAN_*`` module — never scaled. Joint collars sit
    inboard of each end face so they bite the can.

    Detail: 0/1 = can mass; 2 = + end joints; 3 = + one amber plaque.
    """
    objs = []
    r = sf.SHRINE_CAN_R
    ln = sf.SHRINE_CAN_LEN
    body = kit.cyl(parts, name + '.shrine-can', kit.ROLE_HULL, loc,
                   r, ln, mat, rotation=sf.CYL_ALONG_Z, vertices=12)
    if body:
        objs.append(body)
    if detail >= 2:
        half = ln * 0.5 - sf.SHRINE_JOINT * 0.35
        for suffix, dz in (('.joint.n', -half), ('.joint.s', half)):
            jloc = _add(loc, (0.0, 0.0, 1.0), dz)
            joint = kit.cyl(parts, name + suffix, kit.ROLE_ARMOUR, jloc,
                            r + 0.05, sf.SHRINE_JOINT, mat,
                            rotation=sf.CYL_ALONG_Z, vertices=12)
            if joint:
                objs.append(joint)
    if detail >= 3:
        plaque = kit.box(parts, name + '.ritual-plaque', kit.ROLE_ACCENT,
                         _add(loc, (1.0, 0.0, 0.0), r + 0.01),
                         sf.PLAQUE, mat)
        if plaque:
            objs.append(plaque)
    return objs


def shrine_procession(parts, name, mat, loc, count=4, pitch=None,
                      axis='z', detail=3):
    """Linear array of shrine_can. Count by argument, pitch ABSOLUTE.

    FACING: ``axis`` is 'x' / 'y' / 'z' or a unit tuple. The run is centred
    on ``loc``. ``pitch`` defaults to ``sf.SHRINE_PITCH`` (cans overlap at
    the joints). A bigger ship passes a larger ``count``, never a larger can.

    Detail: 3 = ``count``; 2 = half; 1 = one can; 0 = one can mass.
    """
    if pitch is None:
        pitch = sf.SHRINE_PITCH
    step = _AXIS_DIR.get(axis, axis)
    if not isinstance(step, tuple):
        step = (0.0, 0.0, 1.0)
    n = _lod_count(count, detail, floor=1)
    if n < 1:
        return []
    span = pitch * (n - 1)
    origin = _add(loc, step, -span * 0.5)
    objs = []
    for i in range(n):
        cloc = _add(origin, step, pitch * i)
        objs.extend(shrine_can(parts, '%s.can.%02d' % (name, i), mat,
                               cloc, detail=detail))
    return objs


def drum_bay(parts, name, mat, loc, radius=None, length=None, detail=3):
    """One repeating cylindrical bay with rib rhythm (reliquary-can host).

    FACING: long axis along ship Z. ``loc`` is the bay centre. Default
    ``radius`` / ``length`` are ``sf.DRUM_BAY_*``. Class authors stack MORE
    bays rather than scaling the default module. A lofted spine may pass
    the local host radius so the bay matches the drum.

    Detail: 0/1 = bay mass; 2 = + end ribs; 3 = + one mid rib.
    """
    if radius is None:
        radius = sf.DRUM_BAY_R
    if length is None:
        length = sf.DRUM_BAY_LEN
    r = max(radius, 0.20)
    ln = max(length, 0.50)
    objs = []
    bay = kit.cyl(parts, name + '.drum-bay', kit.ROLE_HULL, loc,
                  r, ln, mat, rotation=sf.CYL_ALONG_Z, vertices=12)
    if bay:
        objs.append(bay)
    if detail >= 2:
        inset = ln * 0.5 - sf.RIB_DEPTH * 0.45
        objs.extend(rib_ring(parts, name + '.rib.n', mat,
                             _add(loc, (0.0, 0.0, 1.0), -inset),
                             r, detail=detail))
        objs.extend(rib_ring(parts, name + '.rib.s', mat,
                             _add(loc, (0.0, 0.0, 1.0), inset),
                             r, detail=detail))
    if detail >= 3:
        objs.extend(rib_ring(parts, name + '.rib.m', mat, loc, r,
                             detail=detail))
    return objs


def folded_sail(parts, name, mat, loc, facing='up', detail=3):
    """One thin solar membrane on a boom. Face is mostly aft.

    FACING: boom-out direction (port / starboard / up / down or an XY
    tuple). ``loc`` is the vane ROOT. Nose/stern map to a dorsal boom —
    a boom along +Z would sit edge-on to the light and cannot push the
    ship toward the bow (−Z).

    The foil is ``sf.SAIL_THICK`` (0.024). A thicker boom and a tip yard
    run through the sheet so the island probe still sees one body.
    Photon-facing is ship +Z (stern). A ``sf.SAIL_TILT`` lean keeps the
    sheet visible in profile.

    Grow the SET by count, never by scaling this module.

    One boom, one foil. The petal is narrow at the hub and wide at the
    tip so neighbour vanes do not occupy the same light.

    Detail: 0 = nothing; 1+ = boom + one foil + tip yard.
    """
    if detail < 1:
        return []
    boom_dir = _boom_xy(facing)
    span = sf.SAIL_SPAN
    chord = sf.SAIL_CHORD
    thick = max(sf.SAIL_THICK, 0.018)
    bury = sf.SAIL_BURY
    objs = []
    tip = _add(loc, boom_dir, span)
    boom = kit.strut(parts, name + '.sail-boom', kit.ROLE_TRIM,
                     loc, tip, mat, sf.SAIL_BOOM_R, vertices=6)
    if boom:
        objs.append(boom)
    mid = _add(loc, boom_dir, span * 0.5 - bury * 0.20)
    # front = tip (wide petal), back = root (narrow). A wide root makes
    # two vanes share the same light.
    membrane = kit.taper_block(
        parts, name + '.solar-foil', kit.ROLE_ARMOUR, mid,
        (chord, thick, span), mat, front=(1.0, 1.0), back=(0.18, 1.0))
    if membrane:
        _orient_solar_sheet(membrane, boom_dir, sf.SAIL_TILT)
        objs.append(membrane)
    yard = kit.strut(parts, name + '.sail-yard', kit.ROLE_TRIM,
                     _add(tip, boom_dir, -0.08),
                     _add(tip, boom_dir, 0.02),
                     mat, max(sf.SAIL_BOOM_R, 0.035), vertices=6)
    if yard:
        objs.append(yard)
    return objs


def sail_cluster(parts, name, mat, loc, count=4, hub_radius=0.35,
                 plane='xy', detail=3):
    """Aft-facing solar vanes around a small hub — the §G2 breaker.

    Booms always radiate in the XY plane so each foil faces the stern
    and can push the ship toward the bow. ``plane`` is accepted for call
    compatibility and is ignored for vane direction.

    ``loc`` is the hub centre. ``hub_radius`` is hub-centre to vane-root
    and must stay small (the hub cylinder uses this radius).

        reach = hub_radius + sf.SAIL_SPAN - sf.SAIL_BURY

    Detail: 0 = hub mass; 1 = hub + one vane; 2 = half of ``count``;
    3 = full ``count``.
    """
    _ = plane
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    elif detail == 1:
        n = 1
    else:
        n = 0
    objs = []
    hub_r = max(min(hub_radius, 1.20), 0.20)
    hub = kit.cyl(parts, name + '.sail-hub', kit.ROLE_HULL, loc,
                  hub_r, 0.22, mat, rotation=sf.CYL_ALONG_Z, vertices=10)
    if hub:
        objs.append(hub)
    if n < 1:
        return objs
    for i in range(n):
        ang = 2.0 * math.pi * i / n + math.pi * 0.5
        radial = (math.cos(ang), math.sin(ang), 0.0)
        root = _add(loc, radial, hub_r - 0.04)
        peg = kit.strut(parts, '%s.peg.%d' % (name, i), kit.ROLE_TRIM,
                        _add(loc, radial, hub_r - 0.22),
                        _add(loc, radial, hub_r + 0.22),
                        mat, 0.08, vertices=6)
        if peg:
            objs.append(peg)
        objs.extend(folded_sail(parts, '%s.vane.%d' % (name, i), mat,
                                root, facing=radial, detail=detail))
    return objs


def canvas_drape(parts, name, mat, loc, detail=3):
    """Stowed shelter sail / hung tarp under the keel.

    FACING: hangs along −Y. ``loc`` is the KEEL PAD centre. The canvas
    overlaps the pad so it is not an island. Functional stowed shelter,
    not a church banner.

    Detail: 0/1 = pad + drape mass; 2+ = + hanger bar.
    """
    objs = []
    pad = kit.box(parts, name + '.drape-pad', kit.ROLE_HULL, loc,
                  sf.CANVAS_PAD, mat)
    if pad:
        objs.append(pad)
    hang = sf.CANVAS[1]
    drape_c = _add(loc, (0.0, -1.0, 0.0), hang * 0.5 - 0.08)
    drape = kit.wedge(parts, name + '.canvas-drape', kit.ROLE_ARMOUR,
                      drape_c, (sf.CANVAS[0], hang, max(sf.CANVAS_THICK, 0.08)),
                      mat, taper=(0.85, 0.55))
    if drape:
        objs.append(drape)
    if detail >= 2:
        hx, hy, hz = loc
        bar = kit.strut(parts, name + '.drape-bar', kit.ROLE_TRIM,
                        (hx - 0.38, hy, hz), (hx + 0.38, hy, hz),
                        mat, 0.04, vertices=6)
        if bar:
            objs.append(bar)
    return objs


def nave_cage(parts, name, mat, loc, radius=None, length=None, detail=3):
    """Faceted geodesic glass frame. Many small flat panes, not a sphere.

    FACING: tip toward ship −Z (the Rim). ``loc`` is the nave centre.
    Default envelope is ``sf.NAVE_R`` / ``sf.NAVE_LEN``. A solid base
    collar at the aft end is what a class author buries into the drum.
    No glow lives here — see hardware.observation_nave.

    Detail: 0 = base collar + tip mass; 1 = + meridians; 2 = half panes;
    3 = full panes + latitude rings.
    """
    if radius is None:
        radius = sf.NAVE_R
    if length is None:
        length = sf.NAVE_LEN
    r = max(radius, 0.28)
    ln = max(length, 0.70)
    lx, ly, lz = loc
    tip_z = lz - ln * 0.5
    base_z = lz + ln * 0.5
    objs = []
    collar = kit.cyl(parts, name + '.nave-base', kit.ROLE_ARMOUR,
                     (lx, ly, base_z - 0.08), r + 0.04, 0.22, mat,
                     rotation=sf.CYL_ALONG_Z, vertices=12)
    if collar:
        objs.append(collar)
    tip = kit.chamfer_block(parts, name + '.nave-tip', kit.ROLE_TRIM,
                            (lx, ly, tip_z + 0.10),
                            (r * 0.36, r * 0.36, 0.28), mat,
                            chamfer=r * 0.10)
    if tip:
        objs.append(tip)
    if detail < 1:
        return objs
    n_mer = 8 if detail >= 3 else (6 if detail == 2 else 4)
    tip_pt = (lx, ly, tip_z + 0.06)
    for i in range(n_mer):
        ang = 2.0 * math.pi * i / n_mer
        root = (lx + r * math.cos(ang), ly + r * math.sin(ang), base_z - 0.06)
        rib = kit.strut(parts, '%s.nave-mer.%d' % (name, i), kit.ROLE_TRIM,
                        root, tip_pt, mat, 0.035, vertices=6)
        if rib:
            objs.append(rib)
    if detail < 2:
        return objs
    n_lat = 3 if detail >= 3 else 2
    n_pane = n_mer if detail >= 3 else max(4, n_mer // 2)
    pw, pt, pl = sf.NAVE_PANE
    for j in range(n_lat):
        t = (j + 1) / float(n_lat + 1)
        rr = r * (0.22 + 0.78 * t)
        zz = tip_z + ln * t
        if detail >= 3:
            ring = kit.torus(parts, '%s.nave-lat.%d' % (name, j),
                             kit.ROLE_TRIM, (lx, ly, zz),
                             rr, sf.RIB_MINOR, mat,
                             rotation=sf.CYL_ALONG_Z)
            if ring:
                objs.append(ring)
        for i in range(n_pane):
            ang = 2.0 * math.pi * i / n_pane + (j % 2) * math.pi / n_pane
            cx = lx + rr * math.cos(ang)
            cy = ly + rr * math.sin(ang)
            if abs(math.cos(ang)) >= abs(math.sin(ang)):
                size = (pt, pw, pl)
            else:
                size = (pw, pt, pl)
            pane = kit.box(parts, '%s.nave-pane.%d.%d' % (name, j, i),
                           kit.ROLE_ARMOUR, (cx, cy, zz), size, mat)
            if pane:
                objs.append(pane)
    return objs
