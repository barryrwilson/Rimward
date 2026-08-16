"""Smoke-probe the Assembly shared construct modules under Blender.

Why this exists: `ship_builders/assembly/lineage.py` and
`ship_builders/assembly/hardware.py` will be consumed by six class files. A
defect in one shared construct is otherwise diagnosed six times. This probe
runs every public construct at every detail level before any class file exists.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-assembly-parts.py

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
clean.
"""
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import ship_kit as kit
from ship_builders.assembly import hardware as hw
from ship_builders.assembly import lineage as ln
from ship_builders.assembly import surface as sf


LEGAL_ROLES = {kit.ROLE_HULL, kit.ROLE_ARMOUR, kit.ROLE_ACCENT,
               kit.ROLE_TRIM, kit.ROLE_RECESS, 'glow'}

VOXEL = 0.06


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


# Dummy spine stations for surf-callback self-trim (class authors will own
# a real list). Used only to prove the factories return 0.0 off-section.
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

    # ---- lineage.py -------------------------------------------------------
    out.append(('lineage.copy_drift', lambda p, g, hm, gm, d: _probe_drift()))
    out.append(('lineage.joint_ring', lambda p, g, hm, gm, d: ln.joint_ring(
        p, 'jr', hm, (0.0, 0.0, 0.9), 0.55, detail=d)))
    out.append(('lineage.spine_segment', lambda p, g, hm, gm, d: ln.spine_segment(
        p, 'sp', hm, (0.0, 0.0, 0.0), 0.55, 1.80, detail=d, seed=4)))
    out.append(('lineage.shell_module', lambda p, g, hm, gm, d: ln.shell_module(
        p, 'sh', hm, (0.0, 0.55, 0.0), (0.70, 0.42, 1.40), detail=d, seed=7)))
    out.append(('lineage.orange_patch', lambda p, g, hm, gm, d: ln.orange_patch(
        p, 'op', hm, (0.20, 0.62, -0.10), detail=d, seed=9)))
    out.append(('lineage.fan_petal', lambda p, g, hm, gm, d: ln.fan_petal(
        p, 'fp', hm, (0.0, 1.20, 0.0), facing='up', detail=d, seed=3)))
    out.append(('lineage.radial_fan xy', lambda p, g, hm, gm, d: ln.radial_fan(
        p, 'rfxy', hm, (0.0, 0.0, 2.4), count=10, radius=1.50,
        plane='xy', seed=11, detail=d)))
    out.append(('lineage.radial_fan xz', lambda p, g, hm, gm, d: ln.radial_fan(
        p, 'rfxz', hm, (0.0, 0.90, -1.6), count=12, radius=1.70,
        plane='xz', seed=13, detail=d)))

    # ---- hardware.py ------------------------------------------------------
    out.append(('hardware.teal_optic nose', lambda p, g, hm, gm, d: hw.teal_optic(
        p, g, 'to', hm, gm, (0.0, 0.0, -1.2), facing='nose', detail=d)))
    out.append(('hardware.teal_optic up', lambda p, g, hm, gm, d: hw.teal_optic(
        p, g, 'tou', hm, gm, (0.0, 0.6, 0.0), facing='up', detail=d)))
    out.append(('hardware.instrument_petal', lambda p, g, hm, gm, d: hw.instrument_petal(
        p, 'ip', hm, (1.0, 0.0, 0.0), facing='starboard', detail=d)))
    out.append(('hardware.fabrication_socket', lambda p, g, hm, gm, d: hw.fabrication_socket(
        p, g, 'fs', hm, gm, (0.0, 0.0, -2.0), facing='nose', detail=d)))
    out.append(('hardware.daughter_probe', lambda p, g, hm, gm, d: hw.daughter_probe(
        p, g, 'dp', hm, gm, (3.5, 0.0, 0.0), detail=d, seed=21, petals=4)))
    out.append(('hardware.antenna_mast', lambda p, g, hm, gm, d: hw.antenna_mast(
        p, 'am', hm, (0.0, 0.55, 0.4), detail=d)))
    out.append(('hardware.antenna_forest', lambda p, g, hm, gm, d: hw.antenna_forest(
        p, g, 'af', hm, gm, (0.0, 0.55, 0.8), count=6, detail=d, seed=17)))
    for n in (2, 4, 6, 8):
        def drive(p, g, hm, gm, d, n=n):
            return hw.drive_face(p, g, 'df%d' % n, hm, gm, (0.0, 0.0, 3.2),
                                 0.55, 0.40, nozzles=n, detail=d)
        out.append(('hardware.drive_face n=%d' % n, drive))
    out.append(('hardware.radiator_panel', lambda p, g, hm, gm, d: hw.radiator_panel(
        p, 'rp', hm, (1.10, 0.0, 1.6), (0.10, 1.20, 1.80), detail=d)))
    out.append(('hardware.docking_collar down', lambda p, g, hm, gm, d: hw.docking_collar(
        p, g, 'dc', hm, gm, (0.0, -0.55, 0.2), facing='down', detail=d)))
    out.append(('hardware.docking_collar nose', lambda p, g, hm, gm, d: hw.docking_collar(
        p, g, 'dcn', hm, gm, (0.0, 0.0, -2.4), facing='nose', detail=d)))

    # ---- surface factories (no geometry; raise if self-trim is broken) ----
    out.append(('surface.surf self-trim', lambda p, g, hm, gm, d: _probe_surf()))
    return out


def _probe_drift():
    sample = ln.copy_drift(42)
    a = sample()
    b = sample()
    if a == b:
        raise RuntimeError('copy_drift consecutive samples were identical')
    return []


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
    return []


def main():
    hull_mat, glow_mat = mats()
    failures = []
    print('== Assembly shared-construct smoke probe')
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
                print('  FAIL %-34s detail=%d  %s: %s'
                      % (label, detail, type(exc).__name__, exc))
                continue
            objs = parts + glow
            tris, (lo, hi), bad = measure(objs)
            for message in bad:
                failures.append('%s detail=%d %s' % (label, detail, message))
            if not objs:
                print('  ok   %-34s detail=%d  empty' % (label, detail))
                continue
            print('  ok   %-34s detail=%d  objs=%3d tris=%5d  x[%6.2f,%6.2f] y[%6.2f,%6.2f] z[%6.2f,%6.2f]%s'
                  % (label, detail, len(objs), tris,
                     lo[0], hi[0], lo[2], hi[2], -hi[1], -lo[1],
                     '  ' + '; '.join(bad) if bad else ''))
    print('')
    if failures:
        print('ASSEMBLY PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('ASSEMBLY PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
