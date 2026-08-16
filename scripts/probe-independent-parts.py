"""Smoke-probe the Independent shared construct modules under Blender.

Why this exists: `ship_builders/independent/surplus.py` and
`ship_builders/independent/hardware.py` will be consumed by six class
files. A defect in one shared construct is otherwise diagnosed six times.
This probe runs every public construct at every detail level before any
class file exists.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-independent-parts.py

For every construct, at every detail level 0..3, it reports:
  * whether the call raises (the exception is printed and the probe goes on),
  * the object count, the merged bounding box and the triangle count,
  * any NaN or non-finite vertex,
  * any object with a degenerate (zero-extent) bound,
  * any object whose extent is below 0.06 in EVERY axis -- the island probe's
    voxel size, so such a part would float invisibly (reported SUB-VOXEL),
  * the set of skin roles emitted, against the legal set
    {hull, armour, accent, recess, trim, glow}.

Depsgraph note: `measure()` calls `bpy.context.view_layer.update()` before
reading `matrix_world`. Kit builders assign `obj.location` without flushing
the depsgraph, so an early read reports every bmesh part as if it were
stacked at the origin.

It asserts nothing about art direction. It only proves the foundation runs
clean. Default crate_rack and owner_module lengths are checked against the
§G2 floor (15 % of cutter length 11.0 = 1.65).
"""
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import ship_kit as kit
from ship_builders.independent import hardware as hw
from ship_builders.independent import surplus as sv
from ship_builders.independent import surface as sf


LEGAL_ROLES = {kit.ROLE_HULL, kit.ROLE_ARMOUR, kit.ROLE_ACCENT,
               kit.ROLE_TRIM, kit.ROLE_RECESS, 'glow'}

VOXEL = 0.06
G2_FLOOR = 11.0 * 0.15


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def mats():
    hull = bpy.data.materials.get('probe-hull') or bpy.data.materials.new('probe-hull')
    glow = bpy.data.materials.get('probe-glow') or bpy.data.materials.new('probe-glow')
    return hull, glow


def measure(objs):
    """Return (tris, bbox, bad) for a list of objects.

    The view layer is updated first: kit builders assign `obj.location`
    without flushing the depsgraph, so `matrix_world` is still identity until
    Blender re-evaluates. Reading it early reports every bmesh part as if it
    were stacked at the origin.
    """
    bpy.context.view_layer.update()
    lo = [math.inf] * 3
    hi = [-math.inf] * 3
    tris = 0
    bad = []
    for obj in objs:
        if obj is None or obj.type != 'MESH':
            continue
        mesh = obj.data
        tris += sum(max(len(p.vertices) - 2, 0) for p in mesh.polygons)
        olo = [math.inf] * 3
        ohi = [-math.inf] * 3
        for vert in mesh.vertices:
            world = obj.matrix_world @ vert.co
            for i in range(3):
                value = world[i]
                if not math.isfinite(value):
                    bad.append('%s: non-finite vertex' % obj.name)
                    break
                lo[i] = min(lo[i], value)
                hi[i] = max(hi[i], value)
                olo[i] = min(olo[i], value)
                ohi[i] = max(ohi[i], value)
        if all(math.isfinite(v) for v in olo + ohi):
            extent = [ohi[i] - olo[i] for i in range(3)]
            if min(extent) <= 1e-6:
                bad.append('%s: degenerate extent %s'
                           % (obj.name, [round(e, 4) for e in extent]))
            elif max(extent) < VOXEL:
                bad.append('%s: SUB-VOXEL extent %s'
                           % (obj.name, [round(e, 4) for e in extent]))
        role = obj.get('skin_role')
        if role not in LEGAL_ROLES:
            bad.append('%s: illegal skin_role %r' % (obj.name, role))
    return tris, (lo, hi), bad


# Dummy civilian-chassis stations for surf-callback self-trim (class authors
# will own a real list). Used only to prove the factories return 0.0
# off-section.
STATIONS = [
    sf.fair(-5.0, 0.35, 0.35, 0.0),
    sf.fair(-2.0, 0.55, 0.50, 0.0),
    sf.fair(0.0, 0.60, 0.52, 0.0),
    sf.fair(2.5, 0.50, 0.46, 0.0),
    sf.fair(5.0, 0.32, 0.32, 0.0),
]


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    # ---- surplus.py -------------------------------------------------------
    out.append(('surplus.patch_plate', lambda p, g, hm, gm, d: sv.patch_plate(
        p, 'pp', hm, (0.6, 0.0, 0.0), facing='starboard', detail=d)))
    out.append(('surplus.field_weld', lambda p, g, hm, gm, d: sv.field_weld(
        p, 'fw', hm, (0.0, 0.10, 0.0), length=0.48, axis='z', detail=d)))
    out.append(('surplus.strap_clamp', lambda p, g, hm, gm, d: sv.strap_clamp(
        p, 'sc', hm, (0.0, 0.20, 0.0), span=0.90, axis='x', detail=d)))
    out.append(('surplus.iso_crate', lambda p, g, hm, gm, d: sv.iso_crate(
        p, 'ic', hm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('surplus.crate_rack', lambda p, g, hm, gm, d: sv.crate_rack(
        p, 'rk', hm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('surplus.owner_module', lambda p, g, hm, gm, d: sv.owner_module(
        p, 'om', hm, (1.2, 0.0, 0.0), detail=d)))
    out.append(('surplus.cargo_net', lambda p, g, hm, gm, d: sv.cargo_net(
        p, 'cn', hm, (0.0, 0.50, 0.0), facing='up', detail=d)))
    out.append(('surplus.civilian_cabin', lambda p, g, hm, gm, d: sv.civilian_cabin(
        p, 'cc', hm, (0.0, 0.10, -2.0), detail=d)))
    out.append(('surplus.zone_strap', lambda p, g, hm, gm, d: sv.zone_strap(
        p, 'zs', hm, (0.0, 0.0, 0.4), width=1.20, height=0.80, detail=d)))

    # ---- hardware.py ------------------------------------------------------
    out.append(('hardware.nav_lamp', lambda p, g, hm, gm, d: hw.nav_lamp(
        p, g, 'nl', hm, gm, (0.0, 0.70, 0.0), facing='up', detail=d)))
    out.append(('hardware.lamp_run', lambda p, g, hm, gm, d: hw.lamp_run(
        p, g, 'lr', hm, gm, (0.0, 0.70, 0.0), count=3, detail=d)))
    out.append(('hardware.docking_collar down', lambda p, g, hm, gm, d: hw.docking_collar(
        p, g, 'dc', hm, gm, (0.0, -0.55, 0.2), facing='down', detail=d)))
    out.append(('hardware.docking_collar nose', lambda p, g, hm, gm, d: hw.docking_collar(
        p, g, 'dcn', hm, gm, (0.0, 0.0, -2.4), facing='nose', detail=d)))
    for n in (2, 4, 6, 8):
        def drive(p, g, hm, gm, d, n=n):
            return hw.drive_face(p, g, 'df%d' % n, hm, gm, (0.0, 0.0, 3.2),
                                 0.55, 0.40, nozzles=n, detail=d)
        out.append(('hardware.drive_face n=%d' % n, drive))
    out.append(('hardware.radiator_panel', lambda p, g, hm, gm, d: hw.radiator_panel(
        p, 'rp', hm, (1.10, 0.0, 1.6), (0.10, 1.20, 1.80), detail=d)))
    out.append(('hardware.mission_pod', lambda p, g, hm, gm, d: hw.mission_pod(
        p, 'mp', hm, (0.5, 0.0, 0.2), detail=d)))
    out.append(('hardware.clamp_pair', lambda p, g, hm, gm, d: hw.clamp_pair(
        p, 'cp', hm, (0.0, 0.20, 0.0), detail=d)))
    out.append(('hardware.tug_core', lambda p, g, hm, gm, d: hw.tug_core(
        p, 'tg', hm, (0.0, 0.0, 2.0), detail=d)))

    # ---- surface factories + G2 floors ------------------------------------
    out.append(('surface.surf self-trim', lambda p, g, hm, gm, d: _probe_surf()))
    out.append(('g2.crate_rack span', lambda p, g, hm, gm, d: _probe_g2_rack(p, hm, d)))
    out.append(('g2.owner_module span', lambda p, g, hm, gm, d: _probe_g2_owner(p, hm, d)))
    return out


def _probe_surf():
    flank = sf.surf_flank(STATIONS, 0.0)
    top = sf.surf_top(STATIONS)
    bot = sf.surf_bottom(STATIONS)
    flat = sf.surf_flat(STATIONS)
    if flank(-8.0) != 0.0 or flank(8.0) != 0.0:
        raise RuntimeError('surf_flank did not self-trim off-section')
    if top(-8.0) != 0.0 or bot(8.0) != 0.0 or flat(-9.0) != 0.0:
        raise RuntimeError('surf_top/bottom/flat did not self-trim off-section')
    if flank(0.0) <= 0.0:
        raise RuntimeError('surf_flank returned 0.0 on a live station')
    if sf.flank_x(STATIONS, 0.0, 4.0) != 0.0:
        raise RuntimeError('flank_x must return 0.0 above the section')
    if sf.CRATE_RACK_LEN < G2_FLOOR:
        raise RuntimeError('default CRATE_RACK_LEN must be >= 15 % of cutter length')
    if sf.OWNER_MODULE[2] < G2_FLOOR:
        raise RuntimeError('default owner_module length must be >= 15 % of cutter length')
    if sf.CARGO_CRATE[0] != 0.85:
        raise RuntimeError('CARGO_CRATE edge must stay HUMAN.crateS 0.85')
    return []


def _ship_span_z(lo, hi):
    # Blender Y is ship -Z; the span is the same number.
    return hi[1] - lo[1]


def _probe_g2_rack(parts, hull_mat, detail):
    if detail != 3:
        return []
    objs = sv.crate_rack(parts, 'g2rk', hull_mat, (0.0, 0.0, 0.0), detail=3)
    tris, (lo, hi), bad = measure(objs)
    span = _ship_span_z(lo, hi)
    if span < G2_FLOOR:
        raise RuntimeError('crate_rack default Z span %.3f < %.3f' % (span, G2_FLOOR))
    return objs


def _probe_g2_owner(parts, hull_mat, detail):
    if detail != 3:
        return []
    objs = sv.owner_module(parts, 'g2om', hull_mat, (0.0, 0.0, 0.0), detail=3)
    tris, (lo, hi), bad = measure(objs)
    span = _ship_span_z(lo, hi)
    if span < G2_FLOOR:
        raise RuntimeError('owner_module default Z span %.3f < %.3f' % (span, G2_FLOOR))
    return objs


def main():
    hull_mat, glow_mat = mats()
    failures = []
    print('== Independent shared-construct smoke probe')
    for label, build in cases():
        for detail in (3, 2, 1, 0):
            clear()
            parts = []
            glow = []
            try:
                build(parts, glow, hull_mat, glow_mat, detail)
            except Exception as exc:  # noqa: BLE001 - probe reports every failure
                failures.append('%s detail=%d RAISED %s: %s'
                                % (label, detail, type(exc).__name__, exc))
                print('  FAIL %-38s detail=%d  %s: %s'
                      % (label, detail, type(exc).__name__, exc))
                continue
            objs = parts + glow
            tris, (lo, hi), bad = measure(objs)
            for message in bad:
                failures.append('%s detail=%d %s' % (label, detail, message))
            if not objs:
                print('  ok   %-38s detail=%d  empty' % (label, detail))
                continue
            print('  ok   %-38s detail=%d  objs=%3d tris=%5d  x[%6.2f,%6.2f] y[%6.2f,%6.2f] z[%6.2f,%6.2f]%s'
                  % (label, detail, len(objs), tris,
                     lo[0], hi[0], lo[2], hi[2], -hi[1], -lo[1],
                     '  ' + '; '.join(bad) if bad else ''))
    print('')
    if failures:
        print('INDEPENDENT PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('INDEPENDENT PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
