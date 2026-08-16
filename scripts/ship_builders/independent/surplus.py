"""Independent surface language: plates, welds, crates, rack, cabin.

Bible §5.1 / VisualUpdatePlan lash-up: donated hull sections bolted over
a working frame, external cargo netted down, patch welds. Construction
logic is repeated commercial module / lash-up. This module builds
geometry through ship_kit only. It never queries a hull — the caller
passes loc, size and facing computed from surface.py.

Size conventions (verified against scripts/ship_kit.py source):
    kit.box / plate_course / plate_grid / panel_lines / greeble_field
    / chamfer_block / taper_block / wedge / hull_loft   -> FULL extents
    kit.cyl / torus / strut                             -> real radius / depth
There is NO half-extent entry point in the kit. Absolute sf.* constants go
into kit.box at their stated values. Human and Independent module sizes
are NEVER multiplied by ship l, b or h.

The §G2 breaker is crate_rack: grow length / crate count, never crate
size (HUMAN.crateS = 0.85). Default length is sf.CRATE_RACK_LEN (1.80)
≥ 1.65. Crates sit IN the rails and pierce the floor pad so they share
voxels with the frame.

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
    return _FACE_DIR.get(facing, (0.0, 1.0, 0.0))


def _plate_size(size, facing):
    """Map (face_w, thickness, face_l) so thickness sits on the face normal."""
    fw, th, fl = size
    fw = max(fw, 0.20)
    fl = max(fl, 0.20)
    th = max(th, 0.08)
    d = _dir(facing)
    if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        return (th, fw, fl)
    if facing in ('nose', 'stern') or abs(d[2]) >= 0.7:
        return (fw, fl, th)
    return (fw, th, fl)


def _plate_bolt_offsets(mapped, facing):
    mx, my, mz = mapped
    d = _dir(facing)
    if facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        sign = 1.0 if (facing == 'starboard' or d[0] > 0.0) else -1.0
        return (
            (sign * mx * 0.35, my * 0.32, mz * 0.32),
            (sign * mx * 0.35, my * 0.32, -mz * 0.32),
            (sign * mx * 0.35, -my * 0.32, mz * 0.32),
            (sign * mx * 0.35, -my * 0.32, -mz * 0.32),
        )
    if facing in ('nose', 'stern') or abs(d[2]) >= 0.7:
        sign = 1.0 if (facing == 'stern' or d[2] > 0.0) else -1.0
        return (
            (mx * 0.32, my * 0.32, sign * mz * 0.35),
            (mx * 0.32, -my * 0.32, sign * mz * 0.35),
            (-mx * 0.32, my * 0.32, sign * mz * 0.35),
            (-mx * 0.32, -my * 0.32, sign * mz * 0.35),
        )
    sign = 1.0 if (facing == 'up' or d[1] > 0.0) else -1.0
    return (
        (mx * 0.32, sign * my * 0.35, mz * 0.32),
        (mx * 0.32, sign * my * 0.35, -mz * 0.32),
        (-mx * 0.32, sign * my * 0.35, mz * 0.32),
        (-mx * 0.32, sign * my * 0.35, -mz * 0.32),
    )


def patch_plate(parts, name, mat, loc, size=None, facing='starboard',
                detail=3):
    """Mismatched commercial plate with visible thickness.

    FACING: the plate looks that way. ``loc`` is the plate centre.
    ``size`` is (face_w, thickness, face_l). Default is ``sf.PATCH_PLATE``
    with thickness 0.10. This is not a paper-thin island.

    Detail: 0/1 = plate; 2+ = + corner bolts.
    """
    if size is None:
        size = sf.PATCH_PLATE
    mapped = _plate_size(size, facing)
    objs = []
    body = kit.box(parts, name + '.patch-plate', kit.ROLE_ARMOUR, loc,
                   mapped, mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    bolt = 0.08
    for i, off in enumerate(_plate_bolt_offsets(mapped, facing)):
        bloc = (loc[0] + off[0], loc[1] + off[1], loc[2] + off[2])
        cap = kit.box(parts, '%s.patch-bolt.%d' % (name, i), kit.ROLE_TRIM,
                      bloc, (bolt, bolt, bolt), mat)
        if cap:
            objs.append(cap)
    return objs


def field_weld(parts, name, mat, loc, length=None, axis='z', detail=3):
    """Raised weld bead that joins two masses.

    FACING: ``axis`` is the run ('x' / 'y' / 'z'). ``loc`` is the bead
    centre. Thickness is ``sf.WELD_BEAD`` so the 0.06 voxel keeps it.

    Detail: 0/1 = bead; 2+ = + two end lumps.
    """
    if length is None:
        length = sf.WELD_BEAD[2]
    length = max(float(length), 0.24)
    t = max(sf.WELD_BEAD[0], 0.08)
    h = max(sf.WELD_BEAD[1], 0.08)
    if axis == 'x':
        size = (length, h, t)
    elif axis == 'y':
        size = (t, length, h)
    else:
        size = (t, h, length)
    objs = []
    bead = kit.box(parts, name + '.field-weld', kit.ROLE_TRIM, loc, size, mat)
    if bead:
        objs.append(bead)
    if detail < 2:
        return objs
    step = {'x': (1.0, 0.0, 0.0), 'y': (0.0, 1.0, 0.0)}.get(
        axis, (0.0, 0.0, 1.0))
    lump = 0.10
    for i, sign in enumerate((-1.0, 1.0)):
        cap = kit.box(parts, '%s.field-weld.end.%d' % (name, i), kit.ROLE_TRIM,
                      _add(loc, step, sign * (length * 0.5 - 0.04)),
                      (lump, lump, lump), mat)
        if cap:
            objs.append(cap)
    return objs


def strap_clamp(parts, name, mat, loc, span=None, axis='x', detail=3):
    """Clamp strap that visibly joins two masses.

    FACING: ``axis`` is the strap span ('x' / 'z'). ``loc`` is the strap
    centre. Pads sit at both ends; the strap is ``sf.STRAP_CLAMP`` thick
    (≥ 0.08) so the island probe keeps the joint.

    Detail: 0/1 = strap; 2+ = + end pads.
    """
    if span is None:
        span = max(sf.STRAP_CLAMP[2], 0.42)
    span = max(float(span), 0.28)
    t = max(sf.STRAP_CLAMP[0], 0.08)
    h = max(sf.STRAP_CLAMP[1], 0.08)
    if axis == 'z':
        size = (t, h, span)
        step = (0.0, 0.0, 1.0)
        pad = (t + 0.06, h + 0.04, 0.12)
    else:
        size = (span, h, t)
        step = (1.0, 0.0, 0.0)
        pad = (0.12, h + 0.04, t + 0.06)
    objs = []
    strap = kit.box(parts, name + '.strap-clamp', kit.ROLE_TRIM, loc,
                    size, mat)
    if strap:
        objs.append(strap)
    if detail < 2:
        return objs
    for i, sign in enumerate((-1.0, 1.0)):
        ploc = _add(loc, step, sign * (span * 0.5 - 0.04))
        cap = kit.box(parts, '%s.strap-pad.%d' % (name, i), kit.ROLE_HULL,
                      ploc, pad, mat)
        if cap:
            objs.append(cap)
    return objs


def iso_crate(parts, name, mat, loc, detail=3):
    """One standardized ISO cargo cube. HUMAN.crateS = 0.85.

    FACING: box axes follow ship axes. ``loc`` is the cube centre.
    Size is always ``sf.CARGO_CRATE``. Role is armour (charcoal
    commercial container), never glow.

    Detail: 0/1 = cube; 2+ = + ISO corner fittings.
    """
    edge = sf.CARGO_CRATE[0]
    objs = []
    body = kit.box(parts, name + '.iso-crate', kit.ROLE_ARMOUR, loc,
                   (edge, edge, edge), mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    fit = 0.10
    half = edge * 0.5 - fit * 0.30
    for i, (dx, dy, dz) in enumerate((
            (-1, -1, -1), (-1, -1, 1), (-1, 1, -1), (-1, 1, 1),
            (1, -1, -1), (1, -1, 1), (1, 1, -1), (1, 1, 1))):
        floc = (loc[0] + dx * half, loc[1] + dy * half, loc[2] + dz * half)
        cap = kit.box(parts, '%s.iso-corner.%d' % (name, i), kit.ROLE_TRIM,
                      floc, (fit, fit, fit), mat)
        if cap:
            objs.append(cap)
    return objs


def crate_rack(parts, name, mat, loc, length=None, count=None, detail=3):
    """THE G2 construct: frame + N crates at absolute crate size.

    FACING: the rack runs along ship Z. ``loc`` is the pad centre.
    Default ``length`` is ``sf.CRATE_RACK_LEN`` (1.80) ≥ 15 % of cutter
    length 11.0. Grow ``length`` / ``count`` with class. Never inflate
    the 0.85 crate.

    Crates sit IN the side rails and pierce the floor pad so every crate
    shares voxels with the frame. Do not float crates inside a hollow
    shell.

    Detail: 3 = full count; 2 = half; 1 = frame + one crate; 0 = frame.
    """
    if length is None:
        length = sf.CRATE_RACK_LEN
    length = max(float(length), 0.90)
    crate = sf.CARGO_CRATE[0]
    if count is None:
        count = max(1, int(round(length / sf.CRATE_PITCH)))
    if detail >= 3:
        n = max(1, int(count))
    elif detail == 2:
        n = max(1, int(count) // 2)
    elif detail == 1:
        n = 1
    else:
        n = 0
    lx, ly, lz = loc
    rail_t = max(sf.RAIL_SECTION, 0.08)
    rail_h = max(sf.RACK_RAIL_H, 0.16)
    pad_t = max(sf.RACK_PAD_T, 0.08)
    end_t = 0.12
    # Rails sit inside the crate half-width so crates occupy the same voxels.
    rail_x = crate * 0.50 - rail_t * 0.35
    pad_w = crate + 0.08
    objs = []
    pad = kit.box(parts, name + '.crate-rack.pad', kit.ROLE_HULL,
                  (lx, ly, lz), (pad_w, pad_t, length), mat)
    if pad:
        objs.append(pad)
    rail_y = ly + pad_t * 0.5 + rail_h * 0.35
    for side, sx in (('p', -rail_x), ('s', rail_x)):
        rail = kit.box(parts, '%s.crate-rack.rail.%s' % (name, side),
                       kit.ROLE_HULL, (lx + sx, rail_y, lz),
                       (rail_t, rail_h, length), mat)
        if rail:
            objs.append(rail)
    end_h = pad_t + rail_h * 0.70
    end_y = ly + (end_h - pad_t) * 0.35
    for i, sign in enumerate((-1.0, 1.0)):
        end = kit.box(parts, '%s.crate-rack.end.%d' % (name, i),
                      kit.ROLE_HULL,
                      (lx, end_y, lz + sign * (length * 0.5 - end_t * 0.35)),
                      (pad_w, end_h, end_t), mat)
        if end:
            objs.append(end)
    if n < 1:
        return objs
    # Crate bottoms pierce the pad; sides sit in the rails.
    crate_y = ly + pad_t * 0.5 + crate * 0.5 - 0.06
    usable = max(length - end_t * 1.2, crate)
    if n == 1:
        zs = [lz]
    else:
        span = min(usable - crate, (n - 1) * sf.CRATE_PITCH)
        span = max(span, 0.0)
        z0 = lz - span * 0.5
        zs = [z0 + span * i / float(n - 1) for i in range(n)]
    for i, cz in enumerate(zs):
        objs.extend(iso_crate(parts, '%s.rack-crate.%d' % (name, i), mat,
                              (lx, crate_y, cz), detail=detail))
    return objs


def owner_module(parts, name, mat, loc, size=None, detail=3):
    """One secondhand bolted box. The owner mark. ROLE_ACCENT.

    FACING: box axes follow ship axes. ``loc`` is the module centre.
    Default size is ``sf.OWNER_MODULE``; Z length 1.80 ≥ 1.65. Grow
    length with class if needed. One shape family.

    Detail: 0/1 = box; 2 = + hatch; 3 = + bolts + one patch plate.
    """
    if size is None:
        size = sf.OWNER_MODULE
    sx, sy, sz = size
    sz = max(sz, 0.90)
    sx = max(sx, 0.40)
    sy = max(sy, 0.36)
    objs = []
    body = kit.box(parts, name + '.owner-module', kit.ROLE_ACCENT, loc,
                   (sx, sy, sz), mat)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.owner-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 + 0.01),
                    (recess, min(door_h, sy * 0.70), min(door_w, sz * 0.40)),
                    mat)
    if hatch:
        objs.append(hatch)
    if detail < 3:
        return objs
    bolt = 0.08
    for i, (dx, dy, dz) in enumerate((
            (1, 1, 1), (1, 1, -1), (1, -1, 1), (1, -1, -1))):
        bloc = (loc[0] + dx * (sx * 0.5 - 0.04),
                loc[1] + dy * (sy * 0.5 - 0.04),
                loc[2] + dz * (sz * 0.5 - 0.06))
        cap = kit.box(parts, '%s.owner-bolt.%d' % (name, i), kit.ROLE_TRIM,
                      bloc, (bolt, bolt, bolt), mat)
        if cap:
            objs.append(cap)
    # Centre on the port face so 0.05 of the 0.10 plate sits inside the box.
    plate_loc = (loc[0] - sx * 0.5, loc[1] + sy * 0.08, loc[2])
    objs.extend(patch_plate(parts, name + '.owner', mat, plate_loc,
                            size=(0.36, 0.10, 0.44), facing='port',
                            detail=2))
    return objs


def cargo_net(parts, name, mat, loc, face=None, facing='up', detail=3):
    """Coarse strap grid over a crate face.

    FACING: the net lies on that face. ``loc`` is the face centre.
    Default face is one ISO crate top (0.85 × 0.85). Members are
    ``sf.NET_MEMBER`` (0.07) so no axis is a SUB-VOXEL island.

    Detail: 0/1 = two straps; 2 = four; 3 = six.
    """
    if face is None:
        face = (sf.CARGO_CRATE[0], sf.CARGO_CRATE[2])
    fw, fd = face
    fw = max(fw, 0.40)
    fd = max(fd, 0.40)
    t = max(sf.NET_MEMBER, 0.06)
    if detail >= 3:
        n = 3
    elif detail == 2:
        n = 2
    else:
        n = 1
    d = _dir(facing)
    objs = []
    # Straps along the two in-plane axes.
    if facing in ('up', 'down') or abs(d[1]) >= 0.7:
        for i in range(n):
            u = (i + 0.5) / float(n) - 0.5
            a = kit.box(parts, '%s.cargo-net.x.%d' % (name, i), kit.ROLE_TRIM,
                        (loc[0] + u * fw * 0.70, loc[1], loc[2]),
                        (t, t, fd * 0.92), mat)
            if a:
                objs.append(a)
            b = kit.box(parts, '%s.cargo-net.z.%d' % (name, i), kit.ROLE_TRIM,
                        (loc[0], loc[1], loc[2] + u * fd * 0.70),
                        (fw * 0.92, t, t), mat)
            if b:
                objs.append(b)
    elif facing in ('port', 'starboard') or abs(d[0]) >= 0.7:
        for i in range(n):
            u = (i + 0.5) / float(n) - 0.5
            a = kit.box(parts, '%s.cargo-net.y.%d' % (name, i), kit.ROLE_TRIM,
                        (loc[0], loc[1] + u * fw * 0.70, loc[2]),
                        (t, t, fd * 0.92), mat)
            if a:
                objs.append(a)
            b = kit.box(parts, '%s.cargo-net.z.%d' % (name, i), kit.ROLE_TRIM,
                        (loc[0], loc[1], loc[2] + u * fd * 0.70),
                        (t, fw * 0.92, t), mat)
            if b:
                objs.append(b)
    else:
        for i in range(n):
            u = (i + 0.5) / float(n) - 0.5
            a = kit.box(parts, '%s.cargo-net.x.%d' % (name, i), kit.ROLE_TRIM,
                        (loc[0] + u * fw * 0.70, loc[1], loc[2]),
                        (t, fd * 0.92, t), mat)
            if a:
                objs.append(a)
            b = kit.box(parts, '%s.cargo-net.y.%d' % (name, i), kit.ROLE_TRIM,
                        (loc[0], loc[1] + u * fd * 0.70, loc[2]),
                        (fw * 0.92, t, t), mat)
            if b:
                objs.append(b)
    return objs


def civilian_cabin(parts, name, mat, loc, detail=3):
    """Commercial bow cabin mass.

    FACING: box axes follow ship axes; nose is −Z. ``loc`` is the cabin
    centre. Size is ``sf.CIVILIAN_CABIN``. Ports stay HUMAN size.

    Detail: 0/1 = cabin mass; 2 = + hatch; 3 = + flank ports + rail.
    """
    sx, sy, sz = sf.CIVILIAN_CABIN
    objs = []
    body = kit.chamfer_block(parts, name + '.civilian-cabin', kit.ROLE_HULL,
                             loc, (sx, sy, sz), mat,
                             chamfer=min(sx, sy) * 0.16)
    if body:
        objs.append(body)
    if detail < 2:
        return objs
    door_w, door_h, recess = sf.TRANSFER_HATCH
    hatch = kit.box(parts, name + '.cabin-hatch', kit.ROLE_RECESS,
                    _add(loc, (1.0, 0.0, 0.0), sx * 0.5 + 0.01),
                    (recess, min(door_h, sy * 0.72), min(door_w, sz * 0.36)),
                    mat)
    if hatch:
        objs.append(hatch)
    if detail < 3:
        return objs
    port = sf.FLANK_PORT
    for side, sxn in (('p', -1.0), ('s', 1.0)):
        ploc = (loc[0] + sxn * (sx * 0.5 - 0.01), loc[1] + 0.04,
                loc[2] - sz * 0.18)
        pane = kit.box(parts, '%s.cabin-port.%s' % (name, side),
                       kit.ROLE_RECESS, ploc, port, mat)
        if pane:
            objs.append(pane)
    rail_t = max(sf.RAIL_SECTION, 0.05)
    rail_h = sf.GRAB_RAIL[1]
    rail = kit.box(parts, name + '.cabin-rail', kit.ROLE_TRIM,
                   (loc[0] + sx * 0.5 + 0.04, loc[1] + 0.02, loc[2]),
                   (rail_t, rail_h, sz * 0.55), mat)
    if rail:
        objs.append(rail)
    return objs


def zone_strap(parts, name, mat, loc, width=1.20, height=0.80, detail=3):
    """Seam / collar / strap between thrust zones.

    FACING: the strap sits in the XY plane at ship Z = loc.z. ``loc`` is
    the collar centre. ``width`` / ``height`` are FULL extents of the
    host section plus a small over. Depth is ``sf.ZONE_STRAP_T``.

    Detail: 0/1 = four face straps; 2+ = + corner blocks.
    """
    w = max(float(width), 0.40)
    h = max(float(height), 0.32)
    depth = max(sf.ZONE_STRAP_T, 0.10)
    t = max(sf.RAIL_SECTION, 0.08)
    lx, ly, lz = loc
    objs = []
    # Four face straps; they meet at the corners so the ring is one body.
    faces = (
        ('top', (lx, ly + h * 0.5 - t * 0.5, lz), (w, t, depth)),
        ('bot', (lx, ly - h * 0.5 + t * 0.5, lz), (w, t, depth)),
        ('p', (lx - w * 0.5 + t * 0.5, ly, lz), (t, h, depth)),
        ('s', (lx + w * 0.5 - t * 0.5, ly, lz), (t, h, depth)),
    )
    for suffix, floc, fsize in faces:
        strap = kit.box(parts, '%s.zone-strap.%s' % (name, suffix),
                        kit.ROLE_TRIM, floc, fsize, mat)
        if strap:
            objs.append(strap)
    if detail < 2:
        return objs
    block = 0.12
    for i, (dx, dy) in enumerate(((-1, -1), (-1, 1), (1, -1), (1, 1))):
        bloc = (lx + dx * (w * 0.5 - 0.04),
                ly + dy * (h * 0.5 - 0.04), lz)
        cap = kit.box(parts, '%s.zone-block.%d' % (name, i), kit.ROLE_HULL,
                      bloc, (block, block, depth + 0.04), mat)
        if cap:
            objs.append(cap)
    return objs
