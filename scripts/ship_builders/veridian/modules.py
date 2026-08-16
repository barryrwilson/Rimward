"""Veridian Combine surface language: hex cans on a graphite keel.

Bible §4.1: a straight load-bearing spine and hexagonal pressure
modules. The ship IS the spine plus a countable string of hex cans.
A lofted slab is the wrong body. Construction logic (synthesis/21 §G6):
CLOSED SHELL, MACHINED — inset recess lighting only, no surface pipes.
Flush plates dress a can face. They do not make the hull.

This module builds through ship_kit only. It never queries a hull — the
caller passes loc, size, facing and optional ``surf`` callables computed
from surface.py. A ``surf`` that returns 0.0 self-trims that plate.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point. Absolute sf.* constants go into
kit.box unhalved. Human and Veridian sizes are NEVER multiplied by ship
l, b or h.

Name substrings spine must appear on spine blocks (skin matchers).
Pale-alloy plates use ROLE_ARMOUR. Brass hairlines use ROLE_TRIM, never
a face. Recess wells use ROLE_RECESS; glow sits on a distinct plane.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


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
        n = (facing[0] ** 2 + facing[1] ** 2 + facing[2] ** 2) ** 0.5
        if n < 1e-9:
            return (1.0, 0.0, 0.0)
        return (facing[0] / n, facing[1] / n, facing[2] / n)
    return _FACE_DIR.get(facing, (1.0, 0.0, 0.0))


def _perp_up(d):
    """Unit vector roughly 'up' relative to facing, for hood/sill."""
    if abs(d[1]) < 0.7:
        return (0.0, 1.0, 0.0)
    return (0.0, 0.0, 1.0)


def _perp_side(d, up):
    return (d[1] * up[2] - d[2] * up[1],
            d[2] * up[0] - d[0] * up[2],
            d[0] * up[1] - d[1] * up[0])


def _axis_size(along, thick, wide, facing):
    """Map (along-facing, cross-up, cross-side) is NOT used.

    Map (thick along facing, wide, long) so thick sits on the facing axis.
    """
    d = _dir(facing)
    if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        return (thick, wide, along)
    if facing in ('up', 'down') or abs(d[1]) >= 0.7:
        return (wide, thick, along)
    return (wide, along, thick)


def _seat_surf(loc, facing, surf, thick, bury=0.12):
    """Return a new loc seated on surf(z), or None when surf self-trims."""
    if surf is None:
        return loc
    fx = surf(loc[2])
    if fx == 0.0:
        return None
    d = _dir(facing)
    # Surface x is |fx|; sign follows facing. Bury ≥ 0.10, proud leftover.
    proud = max(thick - bury, 0.02)
    centre_off = -thick * 0.5 + proud
    signed = fx if d[0] >= 0.0 else -fx
    if abs(d[0]) >= 0.7:
        return (signed + (1.0 if d[0] > 0.0 else -1.0) * centre_off,
                loc[1], loc[2])
    if abs(d[1]) >= 0.7:
        return (loc[0], fx + (1.0 if d[1] > 0.0 else -1.0) * centre_off, loc[2])
    return (loc[0], loc[1],
            fx + (1.0 if d[2] > 0.0 else -1.0) * centre_off)


def flush_plate(parts, name, mat, loc, size=None, facing='starboard',
                surf=None, detail=3):
    """One large flush pale-alloy plate. ROLE_ARMOUR.

    FACING: the plate stands that way. ``loc`` is the plate centre (or the
    skin station when ``surf`` is given). ``size`` is FULL extents; default
    is ``sf.FLUSH_PLATE`` mapped so thickness sits on the facing axis.
    ``surf(z)`` returning 0.0 skips the plate.

    Detail: 0/1 = plate; 2+ = + hairline ROLE_TRIM on the long edges.
    """
    if size is None:
        sx, sy, sz = sf.FLUSH_PLATE
        size = _axis_size(sz, sx, sy, facing)
    sx = max(size[0], 0.10)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.28)
    seated = _seat_surf(loc, facing, surf, min(sx, sy, sz))
    if seated is None:
        return []
    objs = []
    body = kit.box(parts, name + '.flush-plate', kit.ROLE_ARMOUR,
                   seated, (sx, sy, sz), mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    d = _dir(facing)
    ht = max(sf.HAIRLINE_T, 0.08)
    # Hairline along the long Z edges, thickness ≥ 0.08 so the probe sees it.
    if abs(d[0]) >= 0.7:
        tsize = (ht, ht, max(sz * 0.92, 0.24))
        yo = sy * 0.5 - ht * 0.35
        for sign, tag in ((1.0, 'a'), (-1.0, 'b')):
            lip = kit.box(parts, '%s.flush-plate.trim-%s' % (name, tag),
                          kit.ROLE_TRIM, _add(seated, (0.0, 1.0, 0.0), yo * sign),
                          tsize, mat)
            if lip:
                objs.append(lip)
    else:
        tsize = (max(sx * 0.92, 0.24), ht, ht)
        zo = sz * 0.5 - ht * 0.35
        for sign, tag in ((1.0, 'a'), (-1.0, 'b')):
            lip = kit.box(parts, '%s.flush-plate.trim-%s' % (name, tag),
                          kit.ROLE_TRIM, _add(seated, (0.0, 0.0, 1.0), zo * sign),
                          tsize, mat)
            if lip:
                objs.append(lip)
    return objs


def alloy_course(parts, name, mat, loc, size=None, count=4, axis='z',
                 facing='starboard', surf=None, detail=3):
    """Pale-alloy plates with a STEPPED outboard offset. ROLE_ARMOUR.

    Coplanar laps are invisible; each plate steps 0.012 along facing so
    the course catches light. FACING: plates stand that way. ``loc`` is
    the course centre. ``size`` is FULL extents of the run. ``surf(z)``
    returning 0.0 skips that plate.

    Detail: 3 = ``count``; 2 = half (min 2); 1/0 = one plate.
    """
    if size is None:
        size = sf.ALLOY_COURSE
        size = _axis_size(size[2], size[0], size[1], facing)
    sx = max(size[0], 0.12)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.40)
    if detail >= 3:
        n = max(2, int(count))
    elif detail == 2:
        n = max(2, int(count) // 2)
    else:
        n = 1
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    if axis == 'x':
        run = sx
        brick = (max(run / n * 0.88, 0.28), sy, sz)
    elif axis == 'y':
        run = sy
        brick = (sx, max(run / n * 0.88, 0.24), sz)
    else:
        run = sz
        brick = (sx, sy, max(run / n * 0.88, 0.28))
    d = _dir(facing)
    origin = _add(loc, step, -run * 0.5 + (run / n) * 0.5)
    objs = []
    for i in range(n):
        bloc = _add(origin, step, (run / n) * i)
        seated = _seat_surf(bloc, facing, surf, min(brick))
        if seated is None:
            continue
        # Step the outboard offset in a 0/1/2 cycle so laps catch light.
        seated = _add(seated, d, (i % 3) * 0.012)
        plate = kit.box(parts, '%s.alloy-plate.%d' % (name, i),
                        kit.ROLE_ARMOUR, seated, brick, mat)
        if plate:
            objs.append(plate)
    return objs


def hex_module(parts, name, mat, loc, size=None, facing='z', detail=3):
    """One serialized hexagonal pressure can. ROLE_ARMOUR.

    The can is a 6-vertex cylinder. That hex section is the Combine
    hull language. ``loc`` is the can centre. Default size is
    ``sf.HEX_MODULE`` (x/y set the radius, z the long depth).
    ``facing`` is ``'z'`` (travel), ``'x'`` or ``'y'``.

    Neighbour cans and the keel must overlap this body by ≥ 0.10.

    Detail: 0/1 = hex prism; 2+ = + end rings; 3 = + hairline trim.
    """
    if size is None:
        size = sf.HEX_MODULE
    sx = max(size[0], 0.28)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.28)
    radius = max(min(sx, sy) * 0.5, 0.14)
    depth = max(sz, 0.40)
    if facing == 'x':
        rot = sf.CYL_ALONG_X
        ring = (max(depth * 0.12, 0.10), radius * 1.15, radius * 1.15)
        ring_a = _add(loc, (1.0, 0.0, 0.0), depth * 0.42)
        ring_b = _add(loc, (1.0, 0.0, 0.0), -depth * 0.42)
        trim_size = (max(depth * 0.70, 0.24), max(sf.HAIRLINE_T, 0.08), radius * 0.55)
        trim_loc = _add(loc, (0.0, 1.0, 0.0), radius * 0.72)
    elif facing == 'y':
        rot = sf.CYL_ALONG_Y
        ring = (radius * 1.15, max(depth * 0.12, 0.10), radius * 1.15)
        ring_a = _add(loc, (0.0, 1.0, 0.0), depth * 0.42)
        ring_b = _add(loc, (0.0, 1.0, 0.0), -depth * 0.42)
        trim_size = (radius * 0.55, max(sf.HAIRLINE_T, 0.08), max(depth * 0.70, 0.24))
        trim_loc = _add(loc, (1.0, 0.0, 0.0), radius * 0.72)
    else:
        rot = sf.CYL_ALONG_Z
        ring = (radius * 1.15, radius * 1.15, max(depth * 0.12, 0.10))
        ring_a = _add(loc, (0.0, 0.0, 1.0), depth * 0.42)
        ring_b = _add(loc, (0.0, 0.0, 1.0), -depth * 0.42)
        trim_size = (radius * 0.55, max(sf.HAIRLINE_T, 0.08), max(depth * 0.70, 0.24))
        trim_loc = _add(loc, (0.0, 1.0, 0.0), radius * 0.72)
    objs = []
    body = kit.cyl(parts, name + '.hex-module', kit.ROLE_ARMOUR, loc,
                   radius, depth, mat, rotation=rot, vertices=6)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    for tag, rloc in (('fore', ring_a), ('aft', ring_b)):
        cap = kit.box(parts, '%s.hex-module.ring-%s' % (name, tag),
                      kit.ROLE_HULL, rloc, ring, mat)
        if cap:
            objs.append(cap)
    if detail < 3:
        return objs
    trim = kit.box(parts, name + '.hex-module.trim', kit.ROLE_TRIM,
                   trim_loc, trim_size, mat)
    if trim:
        objs.append(trim)
    return objs


def hex_run(parts, name, mat, loc, count=4, span=None, axis='z', detail=3):
    """Serialized hex modules along a spine bar. ROLE_ARMOUR on the cans.

    FACING: box axes follow ship axes. ``loc`` is the run centre.
    ``count`` is the detail=3 count. Modules overlap the bar by ≥ 0.10.

    Detail: 3 = ``count``; 2 = half (min 2); 1 = two modules; 0 = bar only.
    """
    n_full = max(1, int(count))
    if detail >= 3:
        n = n_full
    elif detail == 2:
        n = max(2, n_full // 2) if n_full >= 2 else 1
    elif detail == 1:
        n = min(2, n_full)
    else:
        n = 0
    # Overlap neighbour cans so the string is one body (island voxel 0.06).
    pitch = max(sf.HEX_MODULE[2] - 0.16, 0.40)
    if span is None:
        span = max(pitch * max(n_full - 1, 0) + sf.HEX_MODULE[2], 0.80)
    span = max(float(span), 0.80)
    step = _AXIS_DIR.get(axis, (0.0, 0.0, 1.0))
    hx, hy, hz = sf.HEX_MODULE
    if axis == 'x':
        bar = (span, max(hy * 0.42, 0.24), max(hz * 0.36, 0.20))
    elif axis == 'y':
        bar = (max(hx * 0.36, 0.20), span, max(hz * 0.36, 0.20))
    else:
        bar = (max(hx * 0.36, 0.20), max(hy * 0.42, 0.24), span)
    objs = []
    back = kit.box(parts, name + '.hex-run.bar', kit.ROLE_HULL, loc, bar, mat)
    if back:
        objs.append(back)
    if n < 1:
        return objs
    origin = _add(loc, step, -span * 0.5 + (span / n) * 0.5)
    for i in range(n):
        mloc = _add(origin, step, (span / n) * i)
        mloc = (mloc[0], mloc[1] + hy * 0.18, mloc[2])
        objs.extend(hex_module(parts, '%s.hex.%d' % (name, i), mat, mloc,
                               detail=detail))
    return objs


def recess_well(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                facing='starboard', surf=None, detail=3):
    """Inset recess lighting well. Light lives INBOARD, never on the skin.

    FACING: the mouth looks that way. ``loc`` is the skin-plane centre of
    the opening. ``size`` is the opening FULL extents in world axes;
    default maps ``sf.RECESS_WELL``. Hood/sill protrude ≤ 0.07. Glow sits
    on a distinct plane, ≤ 0.01 proud of the well floor, below the lip.
    ``surf(z)`` returning 0.0 skips the well.

    Detail: 0 = back wall; 1 = + hood/sill; 2+ = + glow; 3 = + side posts.
    """
    seated = _seat_surf(loc, facing, surf, sf.RECESS_DEPTH, bury=sf.RECESS_DEPTH)
    if seated is None:
        return []
    # _seat_surf with bury=depth puts the *plate* centre inboard; we want
    # the SKIN point. Recover skin as loc (or surf-seated at the surface).
    if surf is not None:
        fx = surf(loc[2])
        d0 = _dir(facing)
        if abs(d0[0]) >= 0.7:
            skin = (fx if d0[0] > 0.0 else -fx, loc[1], loc[2])
        elif abs(d0[1]) >= 0.7:
            skin = (loc[0], fx, loc[2])
        else:
            skin = (loc[0], loc[1], fx)
    else:
        skin = loc
    d = _dir(facing)
    if size is None:
        ox, oy, oz = sf.RECESS_WELL
        if abs(d[0]) >= 0.7:
            face_w, face_h = oz, oy
        elif abs(d[1]) >= 0.7:
            face_w, face_h = ox, oz
        else:
            face_w, face_h = ox, oy
    else:
        if abs(d[0]) >= 0.7:
            face_w, face_h = max(size[2], 0.40), max(size[1], 0.16)
        elif abs(d[1]) >= 0.7:
            face_w, face_h = max(size[0], 0.40), max(size[2], 0.16)
        else:
            face_w, face_h = max(size[0], 0.40), max(size[1], 0.16)
    depth = max(sf.RECESS_DEPTH, 0.12)
    hood_p = min(sf.RECESS_HOOD, 0.07)
    wall_t = 0.10
    up = _perp_up(d)
    side = _perp_side(d, up)
    # If the cross product vanished, pick a fallback side.
    sn = (side[0] ** 2 + side[1] ** 2 + side[2] ** 2) ** 0.5
    if sn < 1e-9:
        side = (0.0, 0.0, 1.0) if abs(d[2]) < 0.7 else (1.0, 0.0, 0.0)
        sn = 1.0
    side = (side[0] / sn, side[1] / sn, side[2] / sn)

    def _box_size(along_d, along_up, along_side):
        # Rebuild world extents from local axes (axis-aligned faces only).
        ax = (abs(d[0]) * along_d + abs(up[0]) * along_up + abs(side[0]) * along_side)
        ay = (abs(d[1]) * along_d + abs(up[1]) * along_up + abs(side[1]) * along_side)
        az = (abs(d[2]) * along_d + abs(up[2]) * along_up + abs(side[2]) * along_side)
        return (max(ax, 0.08), max(ay, 0.08), max(az, 0.08))

    objs = []
    # Back wall: outer face at skin - d*depth. Body further inboard.
    wall_c = _add(skin, d, -(depth + wall_t * 0.5))
    wall = kit.box(parts, name + '.recess-well.wall', kit.ROLE_RECESS,
                   wall_c, _box_size(wall_t, face_h, face_w), hull_mat)
    if wall:
        objs.append(wall)
    if detail < 1:
        return objs
    # Hood / sill: anchored at the back wall, proud ≤ 0.07.
    hood_along = depth + wall_t + hood_p
    hood_c_along = (-(depth + wall_t) + hood_p) * 0.5
    chan_t = 0.10
    for sign, tag, proud in ((1.0, 'hood', hood_p), (-1.0, 'sill', min(hood_p, 0.05))):
        along = depth + wall_t + proud
        c_along = (-(depth + wall_t) + proud) * 0.5
        cloc = _add(_add(skin, d, c_along), up, sign * (face_h * 0.5 + chan_t * 0.5))
        lip = kit.box(parts, '%s.recess-well.%s' % (name, tag), kit.ROLE_RECESS,
                      cloc, _box_size(along, chan_t, face_w + 0.04), hull_mat)
        if lip:
            objs.append(lip)
    if detail < 2:
        return objs
    # Glow: distinct plane, 0.01 proud of the well floor, below the lip.
    glow_t = 0.04
    glow_c = _add(skin, d, -(depth - 0.01 - glow_t * 0.5))
    pane = kit.box(glow, name + '.recess-well.glow', kit.ROLE_RECESS,
                   glow_c, _box_size(glow_t, max(face_h - 0.10, 0.10),
                                     max(face_w - 0.16, 0.24)), glow_mat)
    if pane:
        pane['skin_role'] = 'glow'
        objs.append(pane)
    if detail < 3:
        return objs
    post_t = 0.10
    for sign, tag in ((1.0, 'p'), (-1.0, 's')):
        ploc = _add(_add(skin, d, hood_c_along), side,
                    sign * (face_w * 0.5 + post_t * 0.35))
        post = kit.box(parts, '%s.recess-well.post-%s' % (name, tag),
                       kit.ROLE_RECESS, ploc,
                       _box_size(hood_along, max(face_h - 0.04, 0.12), post_t),
                       hull_mat)
        if post:
            objs.append(post)
    return objs


def zone_collar(parts, name, mat, loc, size=None, detail=3):
    """Machined zone seam. Not a gilded gold ring.

    FACING: box axes follow ship axes. ``loc`` is the collar centre.
    ``size`` is FULL extents; default ``sf.ZONE_COLLAR``. Brass is a
    hairline on the seam edges only (ROLE_TRIM), never a face.

    Detail: 0/1 = band; 2+ = + hairline trim.
    """
    if size is None:
        size = sf.ZONE_COLLAR
    sx = max(size[0], 0.40)
    sy = max(size[1], 0.28)
    sz = max(size[2], 0.16)
    objs = []
    band = kit.chamfer_block(parts, name + '.zone-collar', kit.ROLE_HULL,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.10)
    if band:
        objs.append(band)
    if detail < 2:
        return objs
    ht = max(sf.HAIRLINE_T, 0.08)
    for sign, tag in ((1.0, 'a'), (-1.0, 'b')):
        lip = kit.box(parts, '%s.zone-collar.trim-%s' % (name, tag),
                      kit.ROLE_TRIM,
                      (loc[0], loc[1] + sign * (sy * 0.5 - ht * 0.30), loc[2]),
                      (max(sx * 0.72, 0.28), ht, max(sz + 0.04, 0.16)), mat)
        if lip:
            objs.append(lip)
    return objs


def keel_spine(parts, name, mat, z0, z1, half_w=None, half_h=None,
               y=0.0, x=0.0, detail=3):
    """Graphite load-bearing keel. ROLE_HULL. Name contains spine.

    One bar from ``z0`` to ``z1``. This is the Combine backbone. Every
    hex can must overlap it by ≥ 0.10. Default half extents come from
    ``sf.SPINE_BLOCK``. Class authors grow LENGTH. They do not fatten
    the bar into a slab.

    Detail: 0/1 = bar; 2+ = + a pale-alloy cap strip.
    """
    z_lo = min(z0, z1)
    z_hi = max(z0, z1)
    length = max(z_hi - z_lo, 0.40)
    loc = (x, y, (z_lo + z_hi) * 0.5)
    hw = sf.SPINE_BLOCK[0] * 0.5 if half_w is None else float(half_w)
    hh = sf.SPINE_BLOCK[1] * 0.5 if half_h is None else float(half_h)
    sx = max(hw * 2.0, 0.22)
    sy = max(hh * 2.0, 0.18)
    return spine_block(parts, name, mat, loc, size=(sx, sy, length),
                       detail=detail)


def spine_block(parts, name, mat, loc, size=None, detail=3):
    """Load-bearing spine segment. ROLE_HULL. Name contains spine.

    FACING: box axes follow ship axes. ``loc`` is the block centre.
    Default size is ``sf.SPINE_BLOCK``. Serialized: class authors repeat
    this at human pitch, they do not scale it.

    Detail: 0/1 = mass; 2+ = + a pale-alloy cap plate.
    """
    if size is None:
        size = sf.SPINE_BLOCK
    sx = max(size[0], 0.28)
    sy = max(size[1], 0.24)
    sz = max(size[2], 0.40)
    objs = []
    body = kit.chamfer_block(parts, name + '.spine', kit.ROLE_HULL,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.12)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    cap = kit.box(parts, name + '.spine.cap', kit.ROLE_ARMOUR,
                  (loc[0], loc[1] + sy * 0.42, loc[2]),
                  (sx * 0.78, max(sy * 0.22, 0.10), sz * 0.88), mat)
    if cap:
        objs.append(cap)
    return objs
