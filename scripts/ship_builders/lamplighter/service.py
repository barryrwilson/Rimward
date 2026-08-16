"""Lamplighter surface language: truss, gantry, cable, clamp, fork, rails.

Bible §4.10 / synthesis §G6: exposed frame, utility. Gantries, cable
runs, work lights and clamp arms. This module builds geometry through
ship_kit only. It never queries a hull — the caller passes loc, size,
reach and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point in the kit. Absolute sf.* constants go
into kit.box at their stated values. Human and Lamplighter module sizes
are NEVER multiplied by ship l, b or h.

Detail ladder: 3 = full, 2 = half repeats, 1 = primary form, 0 = mass only.
"""
import math
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

def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _unit(v):
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if n < 1e-9:
        return (0.0, 0.0, 1.0)
    return (v[0] / n, v[1] / n, v[2] / n)


def _dir(facing):
    if isinstance(facing, tuple):
        return _unit(facing)
    return _FACE_DIR.get(facing, (0.0, 0.0, -1.0))


def _perp(d, hint=None):
    if hint is not None:
        hx, hy, hz = hint
        dot = hx * d[0] + hy * d[1] + hz * d[2]
        return _unit((hx - dot * d[0], hy - dot * d[1], hz - dot * d[2]))
    if abs(d[1]) < 0.75:
        return (0.0, 1.0, 0.0)
    return (1.0, 0.0, 0.0)


def truss_bay(parts, name, mat, loc, detail=3):
    """One exposed-frame bay. Open, not a solid box.

    FACING: longerons run along ship Z. ``loc`` is the bay centre. Size is
    the absolute ``sf.TRUSS_CHORD`` / ``sf.TRUSS_BAY_LEN`` module — never
    scaled. Members use ``sf.TRUSS_MEMBER`` radius (diameter 0.11).

    Detail: 0 = four longerons; 1 = + end frames; 2 = + mid frame;
    3 = + diagonal braces.
    """
    lx, ly, lz = loc
    hw = sf.TRUSS_CHORD * 0.50
    hh = sf.TRUSS_CHORD * 0.42
    hl = sf.TRUSS_BAY_LEN * 0.50
    r = max(sf.TRUSS_MEMBER, 0.050)
    corners = ((-hw, -hh), (-hw, hh), (hw, -hh), (hw, hh))
    objs = []
    for i, (cx, cy) in enumerate(corners):
        beam = kit.strut(parts, '%s.truss-bay.long.%d' % (name, i),
                         kit.ROLE_HULL,
                         (lx + cx, ly + cy, lz - hl),
                         (lx + cx, ly + cy, lz + hl),
                         mat, r, vertices=6)
        if beam:
            objs.append(beam)
    if detail < 1:
        return objs
    frame_zs = [-hl, hl]
    if detail >= 2:
        frame_zs.append(0.0)
    for zi, dz in enumerate(frame_zs):
        zz = lz + dz
        pairs = (
            ((-hw, -hh), (hw, -hh)),
            ((-hw, hh), (hw, hh)),
            ((-hw, -hh), (-hw, hh)),
            ((hw, -hh), (hw, hh)),
        )
        for j, (a, b) in enumerate(pairs):
            bar = kit.strut(parts, '%s.truss-bay.frame.%d.%d' % (name, zi, j),
                            kit.ROLE_HULL,
                            (lx + a[0], ly + a[1], zz),
                            (lx + b[0], ly + b[1], zz),
                            mat, r, vertices=6)
            if bar:
                objs.append(bar)
    if detail >= 3:
        for j, (a, b) in enumerate((((-hw, -hh), (hw, hh)),
                                    ((-hw, hh), (hw, -hh)))):
            brace = kit.strut(parts, '%s.truss-bay.brace.%d' % (name, j),
                              kit.ROLE_TRIM,
                              (lx + a[0], ly + a[1], lz),
                              (lx + b[0], ly + b[1], lz),
                              mat, r, vertices=6)
            if brace:
                objs.append(brace)
    return objs


def gantry(parts, name, mat, loc, length=None, detail=3):
    """Walkable access gantry with rails at ``sf.GRAB_RAIL`` height.

    FACING: deck in the XZ plane, run along ship Z. ``loc`` is the deck
    centre. Default length is ``sf.GANTRY_PITCH``. Deck is utility-yellow
    (``gantry-deck``). Rails sit ``sf.GRAB_RAIL[1]`` (0.30) above the deck.

    Detail: 0/1 = deck mass; 2 = + rail strips; 3 = + posts.
    """
    if length is None:
        length = sf.GANTRY_PITCH
    length = max(length, 0.40)
    width = sf.GANTRY_WIDTH
    deck_t = 0.07
    objs = []
    deck = kit.box(parts, name + '.gantry-deck', kit.ROLE_ACCENT, loc,
                   (width, deck_t, length), mat)
    if deck:
        objs.append(deck)
    if detail < 2:
        return objs
    rail_h = sf.GRAB_RAIL[1]
    rail_t = max(sf.RAIL_SECTION, 0.05)
    lx, ly, lz = loc
    y_rail = ly + deck_t * 0.5 + rail_h
    x_off = width * 0.5 - rail_t
    for side, sx in (('p', -x_off), ('s', x_off)):
        strip = kit.box(parts, '%s.gantry-rail.%s' % (name, side),
                        kit.ROLE_TRIM, (lx + sx, y_rail, lz),
                        (rail_t, rail_t, length), mat)
        if strip:
            objs.append(strip)
        if detail < 3:
            continue
        n_post = max(2, int(round(length / 0.45)))
        for i in range(n_post):
            t = i / float(n_post - 1) if n_post > 1 else 0.5
            pz = lz - length * 0.5 + t * length
            post = kit.box(parts, '%s.gantry-post.%s.%d' % (name, side, i),
                           kit.ROLE_TRIM,
                           (lx + sx, ly + deck_t * 0.5 + rail_h * 0.5, pz),
                           (rail_t, rail_h, rail_t), mat)
            if post:
                objs.append(post)
    return objs


def cable_run(parts, name, mat, loc, length=1.60, axis='z', detail=3):
    """Visible cable / hose along a length.

    FACING: ``axis`` is 'x' / 'y' / 'z'. ``loc`` is the run centre.
    Hose radius is ``sf.CABLE_HOSE_R``. Parallel copies sit at a small
    offset; count follows the detail ladder.

    Detail: 0/1 = one hose; 2 = two; 3 = three.
    """
    length = max(length, 0.40)
    if detail >= 3:
        n = 3
    elif detail == 2:
        n = 2
    else:
        n = 1
    r = sf.CABLE_HOSE_R if detail >= 1 else 0.070
    r = max(r, 0.040)
    # A perpendicular offset so parallel hoses do not occupy one line.
    if axis == 'x':
        off = (0.0, 0.0, 1.0)
        rot = sf.CYL_ALONG_X
    elif axis == 'y':
        off = (1.0, 0.0, 0.0)
        rot = sf.CYL_ALONG_Y
    else:
        off = (0.0, 1.0, 0.0)
        rot = sf.CYL_ALONG_Z
    pitch = 0.11
    origin = _add(loc, off, -pitch * (n - 1) * 0.5)
    objs = []
    for i in range(n):
        cloc = _add(origin, off, pitch * i)
        hose = kit.cyl(parts, '%s.cable-run.%d' % (name, i), kit.ROLE_TRIM,
                       cloc, r, length, mat, rotation=rot, vertices=8)
        if hose:
            objs.append(hose)
    return objs


def cable_reel(parts, name, mat, loc, detail=3):
    """Drum + flanges, human / module-sized.

    FACING: axle along ship X (the plate drums hang under the mid hull).
    ``loc`` is the drum centre. Radius is ``sf.CABLE_DRUM_R``.

    Detail: 0/1 = drum mass; 2 = + flanges; 3 = + axle stub.
    """
    r = sf.CABLE_DRUM_R
    w = sf.CABLE_DRUM_W
    objs = []
    drum = kit.cyl(parts, name + '.cable-reel', kit.ROLE_HULL, loc,
                   r, w, mat, rotation=sf.CYL_ALONG_X, vertices=12)
    if drum:
        objs.append(drum)
    if detail >= 2:
        flange_r = r + 0.08
        flange_w = 0.08
        half = w * 0.5 - flange_w * 0.35
        for suffix, dx in (('.flange.p', -half), ('.flange.s', half)):
            fl = kit.cyl(parts, name + suffix, kit.ROLE_ARMOUR,
                         _add(loc, (1.0, 0.0, 0.0), dx),
                         flange_r, flange_w, mat,
                         rotation=sf.CYL_ALONG_X, vertices=12)
            if fl:
                objs.append(fl)
    if detail >= 3:
        axle = kit.cyl(parts, name + '.reel-axle', kit.ROLE_TRIM, loc,
                       0.06, w + 0.18, mat,
                       rotation=sf.CYL_ALONG_X, vertices=8)
        if axle:
            objs.append(axle)
    return objs


def utility_module(parts, name, mat, loc, detail=3):
    """Yellow access box, standardized. Hatch at human door size.

    FACING: box axes follow ship axes. ``loc`` is the module centre.
    Size is ``sf.UTILITY_BOX``. The hatch is ``sf.TRANSFER_HATCH`` on the
    starboard face so a suited crew can enter.

    Detail: 0/1 = box mass; 2 = + hatch; 3 = + grab rails on the hatch
    sides.
    """
    sx, sy, sz = sf.UTILITY_BOX
    objs = []
    body = kit.box(parts, name + '.utility-module', kit.ROLE_ACCENT, loc,
                   (sx, sy, sz), mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    # TRANSFER_HATCH is (doorW, doorH, recess) on a deck face. On the
    # starboard flank the recess is X, the height is Y, the door width is Z.
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.access-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 + 0.01),
                    (recess, door_h, door_w), mat)
    if hatch:
        objs.append(hatch)
    if detail >= 3:
        rail_t = max(sf.RAIL_SECTION, 0.05)
        rail_h = sf.GRAB_RAIL[1]
        face_x = loc[0] + sx * 0.5 + 0.04
        for side, dz in (('n', -door_w * 0.55), ('s', door_w * 0.55)):
            rail = kit.box(parts, '%s.module-rail.%s' % (name, side),
                           kit.ROLE_TRIM,
                           (face_x, loc[1], loc[2] + dz),
                           (rail_t, rail_h, rail_t), mat)
            if rail:
                objs.append(rail)
    return objs


def clamp_arm(parts, name, mat, loc, facing='nose', reach=None,
              kink=1.0, detail=3):
    """One articulated arm segment chain (shoulder / elbow / jaw).

    FACING: the reach direction (nose / stern / a unit tuple). ``loc`` is
    the shoulder root. Default ``reach`` is ``sf.CLAMP_REACH`` (2.40),
    clearly ≥ 15 % of cutter length 11.0. Every link radius is
    ``sf.CLAMP_LINK_R`` (0.09) so the island probe keeps the arm.

    Grow reach with this length. Do not inflate a hub to fake span.

    A single giant wrench is forbidden: this is a three-joint chain, not
    one bar.

    Detail: 0 = one strut + jaw mass; 1 = + shoulder; 2 = full chain;
    3 = + yellow jaw pads.
    """
    if reach is None:
        reach = sf.CLAMP_REACH
    reach = max(float(reach), 0.80)
    d = _dir(facing)
    perp = _perp(d)
    kink = 1.0 if kink >= 0.0 else -1.0
    link_r = max(sf.CLAMP_LINK_R, 0.08)
    shoulder = loc
    elbow = _add(_add(loc, d, reach * 0.48), perp, kink * reach * 0.20)
    jaw = _add(loc, d, reach)
    objs = []
    if detail >= 1:
        joint = kit.box(parts, name + '.clamp-shoulder', kit.ROLE_HULL,
                        shoulder, (sf.CLAMP_JOINT,) * 3, mat)
        if joint:
            objs.append(joint)
    if detail >= 2:
        elbow_box = kit.box(parts, name + '.clamp-elbow', kit.ROLE_HULL,
                            elbow, (sf.CLAMP_JOINT * 0.85,) * 3, mat)
        if elbow_box:
            objs.append(elbow_box)
        upper = kit.strut(parts, name + '.clamp-arm.upper', kit.ROLE_HULL,
                          shoulder, elbow, mat, link_r, vertices=8)
        if upper:
            objs.append(upper)
        lower = kit.strut(parts, name + '.clamp-arm.lower', kit.ROLE_HULL,
                          elbow, jaw, mat, link_r, vertices=8)
        if lower:
            objs.append(lower)
    else:
        bar = kit.strut(parts, name + '.clamp-arm', kit.ROLE_HULL,
                        shoulder, jaw, mat, link_r, vertices=8)
        if bar:
            objs.append(bar)
    jw, jh, jd = sf.CLAMP_JAW
    jaw_loc = _add(jaw, d, jd * 0.20)
    jaw_box = kit.box(parts, name + '.clamp-jaw', kit.ROLE_ACCENT,
                      jaw_loc, (jw, jh, jd), mat)
    if jaw_box:
        objs.append(jaw_box)
    if detail >= 3:
        pad_t = 0.08
        for i, sign in enumerate((-1.0, 1.0)):
            pad = kit.box(parts, '%s.clamp-jaw.pad.%d' % (name, i),
                          kit.ROLE_ACCENT,
                          _add(jaw_loc, perp, sign * (jh * 0.45)),
                          (jw * 0.70, pad_t, jd * 0.55), mat)
            if pad:
                objs.append(pad)
    return objs


def gate_fork(parts, name, mat, loc, facing='nose', reach=None,
              plane='lr', detail=3):
    """THE G2 construct: a PAIR of clamp_arms that fork.

    FACING: the pair reaches that way (usually nose, toward a gate ring).
    ``loc`` is the small shoulder root — not a hub disc. Default
    ``reach`` is ``sf.CLAMP_REACH`` (2.40). 15 % of cutter length ~11 is
    1.65; the default is clearly over that floor. Grow the fork with
    ``reach`` (arm length). Do not inflate this root.

    ``plane`` is ``'lr'`` (port / starboard) or ``'ud'`` (up / down).

    Detail: follows ``clamp_arm``. Detail 0 still emits the pair plus a
    small root block.
    """
    if reach is None:
        reach = sf.CLAMP_REACH
    reach = max(float(reach), 0.80)
    d = _dir(facing)
    if plane == 'ud':
        out_a = (0.0, 1.0, 0.0)
        out_b = (0.0, -1.0, 0.0)
    else:
        out_a = (-1.0, 0.0, 0.0)
        out_b = (1.0, 0.0, 0.0)
    objs = []
    # kit.box size is FULL extents. Root stays small on purpose.
    root = kit.box(parts, name + '.gate-fork.hub', kit.ROLE_HULL, loc,
                   (0.32, 0.28, 0.32), mat)
    if root:
        objs.append(root)
    spread = 0.18
    mix = 0.40
    fa = _unit((d[0] + mix * out_a[0], d[1] + mix * out_a[1],
                d[2] + mix * out_a[2]))
    fb = _unit((d[0] + mix * out_b[0], d[1] + mix * out_b[1],
                d[2] + mix * out_b[2]))
    root_a = _add(loc, out_a, spread)
    root_b = _add(loc, out_b, spread)
    objs.extend(clamp_arm(parts, name + '.fork.a', mat, root_a,
                          facing=fa, reach=reach, kink=1.0, detail=detail))
    objs.extend(clamp_arm(parts, name + '.fork.b', mat, root_b,
                          facing=fb, reach=reach, kink=-1.0, detail=detail))
    return objs


def access_rail(parts, name, mat, loc, length=1.40, axis='z', detail=3):
    """Pressure-suit handrail run at ``sf.GRAB_RAIL`` height.

    FACING: ``axis`` is 'x' / 'z' (deck run) or 'y' (ladder). ``loc`` is
    the base centre (bottom of the posts). The strip sits
    ``sf.GRAB_RAIL[1]`` (0.30) above the base. This is a Guild access
    feature, not decorative trim.

    Detail: 0/1 = strip only; 2+ = strip + posts.
    """
    length = max(length, 0.40)
    rail_t = max(sf.RAIL_SECTION, 0.05)
    rail_h = sf.GRAB_RAIL[1]
    lx, ly, lz = loc
    objs = []
    if axis == 'x':
        strip_loc = (lx, ly + rail_h, lz)
        strip_size = (length, rail_t, rail_t)
    elif axis == 'y':
        strip_loc = (lx, ly, lz + rail_h)
        strip_size = (rail_t, length, rail_t)
    else:
        strip_loc = (lx, ly + rail_h, lz)
        strip_size = (rail_t, rail_t, length)
    strip = kit.box(parts, name + '.access-rail', kit.ROLE_TRIM,
                    strip_loc, strip_size, mat)
    if strip:
        objs.append(strip)
    if detail < 2:
        return objs
    n_post = max(2, int(round(length / 0.50)))
    for i in range(n_post):
        t = i / float(n_post - 1) if n_post > 1 else 0.5
        if axis == 'x':
            px = lx - length * 0.5 + t * length
            ploc = (px, ly + rail_h * 0.5, lz)
            psize = (rail_t, rail_h, rail_t)
        elif axis == 'y':
            py = ly - length * 0.5 + t * length
            ploc = (lx, py, lz + rail_h * 0.5)
            psize = (rail_t, rail_t, rail_h)
        else:
            pz = lz - length * 0.5 + t * length
            ploc = (lx, ly + rail_h * 0.5, lz)
            psize = (rail_t, rail_h, rail_t)
            ploc = (lx, ly + rail_h * 0.5, pz)
        post = kit.box(parts, '%s.access-rail.post.%d' % (name, i),
                       kit.ROLE_TRIM, ploc, psize, mat)
        if post:
            objs.append(post)
    return objs
