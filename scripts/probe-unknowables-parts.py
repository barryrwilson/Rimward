"""Smoke-probe the Unknowables shared construct modules under Blender.

Why this exists: `ship_builders/unknowables/field.py` and
`ship_builders/unknowables/nodes.py` will be consumed by class files. A
defect in one shared construct is otherwise diagnosed six times. This
probe runs every public construct at every detail level before any class
file exists.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-unknowables-parts.py

For every construct, at every detail level 0..3, it reports:
  * whether the call raises (the exception is printed and the probe goes on),
  * the object count, the merged bounding box and the triangle count,
  * any NaN or non-finite vertex,
  * any object with a degenerate (zero-extent) bound,
  * any object whose extent is below 0.06 in EVERY axis -- the island probe's
    voxel size, so such a part would float invisibly (reported SUB-VOXEL),
  * the set of skin roles emitted, against the legal set
    {hull, armour, accent, recess, trim, glow}.

cell_procession also asserts consecutive centres stay under 2*CELL_R - 0.10.

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
from ship_builders.unknowables import field as fd
from ship_builders.unknowables import nodes as nd
from ship_builders.unknowables import surface as sf


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


def _ship_loc(obj):
    t = obj.matrix_world.translation
    return (t.x, t.z, -t.y)


LACE_POINTS = (
    (0.00, 0.00, -2.40),
    (0.18, 0.12, -1.20),
    (0.00, 0.00,  0.00),
    (-0.18, -0.10, 1.20),
    (0.00, 0.00,  2.40),
)

LOOP_TILTS = (
    sf.TORUS_FACE_Z,
    (math.pi * 0.5, 0.0, 0.55),
    (0.40, 0.15, 0.35),
)


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    out.append(('field.filament_thread', lambda p, g, hm, gm, d: fd.filament_thread(
        g, 'lace-thread', gm, (0.0, 0.0, -1.2), (0.2, 0.1, 1.2), d)))
    out.append(('field.filament_lace', lambda p, g, hm, gm, d: fd.filament_lace(
        g, 'lace', gm, LACE_POINTS, d)))
    out.append(('field.orbital_loop', lambda p, g, hm, gm, d: fd.orbital_loop(
        g, 'loop', gm, (0.0, 0.0, 0.0), 1.20, sf.TORUS_FACE_Z, d)))
    out.append(('field.nested_loops', lambda p, g, hm, gm, d: fd.nested_loops(
        g, 'loop-nest', gm, (0.0, 0.0, 0.2),
        (1.00, 1.45, 1.90), LOOP_TILTS, d)))
    out.append(('field.lensing_arc', lambda p, g, hm, gm, d: fd.lensing_arc(
        g, 'arc', gm, (0.0, 0.0, 0.0), 2.20, (0.55, 0.0, 0.20), d)))
    out.append(('field.field_tip', lambda p, g, hm, gm, d: fd.field_tip(
        g, 'tip', gm, (0.0, 0.0, -2.0), sf.TIP_LEN, d)))

    out.append(('nodes.energy_cell', lambda p, g, hm, gm, d: nd.energy_cell(
        p, 'cell', hm, (0.0, 0.0, 0.0), d)))
    out.append(('nodes.sync_mote', lambda p, g, hm, gm, d: nd.sync_mote(
        p, 'mote', hm, (0.40, 0.20, 0.10), d)))

    def procession_overlap(p, g, hm, gm, d):
        built = nd.cell_procession(p, 'cell', hm, -2.0, 2.2, 0.0, 0.0, d)
        bpy.context.view_layer.update()
        cells = []
        for obj in p:
            if obj is None:
                continue
            label = obj.name
            if not label.startswith('cell'):
                continue
            if 'link' in label:
                continue
            cells.append(obj)
        cells.sort(key=lambda o: _ship_loc(o)[2])
        limit = 2.0 * sf.CELL_R - 0.10
        if len(cells) < 2:
            raise RuntimeError('cell_procession emitted %d cells' % len(cells))
        for i in range(len(cells) - 1):
            c0 = _ship_loc(cells[i])
            c1 = _ship_loc(cells[i + 1])
            dist = math.sqrt(sum((c1[k] - c0[k]) ** 2 for k in range(3)))
            if not (dist < limit):
                raise RuntimeError(
                    'cell gap: centres %d/%d distance %.3f >= 2*CELL_R-0.10 %.3f'
                    % (i, i + 1, dist, limit)
                )
        return built

    out.append(('nodes.cell_procession', procession_overlap))
    return out


def check_surface():
    """Plain-math envelope checks (no geometry). Return a list of problems."""
    bad = []
    if not sf.envelope_relief_ok(sf.DEFAULT_STATIONS):
        bad.append('DEFAULT_STATIONS fail FACTION_PROPORTION_RELIEF.unknowables')
    z0 = sf.nose_z(sf.DEFAULT_STATIONS)
    z1 = sf.stern_z(sf.DEFAULT_STATIONS)
    tip = sf.tip_point(sf.DEFAULT_STATIONS)
    if tip[2] != z0:
        bad.append('tip_point z %s != nose_z %s' % (tip[2], z0))
    if z0 >= z1:
        bad.append('nose_z %s is not forward of stern_z %s' % (z0, z1))
    flank = sf.surf_flank(sf.DEFAULT_STATIONS, 0.0)
    if flank(z0 - 1.0) != 0.0 or flank(z1 + 1.0) != 0.0:
        bad.append('surf_flank did not return 0.0 off the envelope')
    rad = sf.surf_radius(sf.DEFAULT_STATIONS)
    if rad(z0 - 1.0) != 0.0 or rad(z1 + 1.0) != 0.0:
        bad.append('surf_radius did not return 0.0 off the envelope')
    if rad(0.9) <= 0.0:
        bad.append('surf_radius at mid-field is not positive')
    pitch = sf.cell_link_pitch()
    if not (pitch < 2.0 * sf.CELL_R - 0.10):
        bad.append('cell_link_pitch %.3f does not keep centres < 2*CELL_R-0.10'
                   % pitch)
    return bad


def main():
    hull_mat, glow_mat = mats()
    failures = []
    print('== Unknowables shared-construct smoke probe')
    for message in check_surface():
        failures.append('surface %s' % message)
        print('  FAIL surface                             %s' % message)
    if not check_surface():
        print('  ok   surface                             envelope queries clean')
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
        print('UNKNOWABLES PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('UNKNOWABLES PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
