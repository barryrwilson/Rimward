"""Name the parts that set a ship's span, per axis, under Blender.

`measure-ships` reports that a hull is too wide; it cannot say WHICH part made
it wide. Guessing costs a bake round each time — this wave lost two of them
narrowing hull stations while a radiator and a boom jaw were the real beam.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-ship-extremes.py -- redledger cutter [lod0] [--top=8]

For the built class it prints, per axis, the objects that reach furthest in each
direction, with their own extents, so the author knows exactly what to move. It
also prints the span the sculpt would measure with each of those parts removed,
which is the number that actually answers "what do I have to change".
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import ship_kit as kit  # noqa: F401  (imported for parity with the driver)

LOD_DETAIL = {'lod0': 3, 'lod1': 2, 'lod2': 1, 'lod3': 0}
AXES = (('x', 0), ('y', 1), ('z', 2))


def argv():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    faction = args[0] if args else 'redledger'
    cls = args[1] if len(args) > 1 else 'cutter'
    lod = 'lod0'
    top = 8
    at = None
    radius = 0.35
    for arg in args[2:]:
        if arg.startswith('--top='):
            top = int(arg.split('=', 1)[1])
        elif arg.startswith('--at='):
            at = [float(v) for v in arg.split('=', 1)[1].split(',')]
        elif arg.startswith('--r='):
            radius = float(arg.split('=', 1)[1])
        elif arg in LOD_DETAIL:
            lod = arg
    return faction, cls, lod, top, at, radius

def build(faction, cls, lod):
    """Build one class through the real driver so the geometry matches a bake."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        'build_ship_assets', str(ROOT / 'scripts' / 'build-ship-assets.py'))
    driver = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(driver)

    driver.clear_scene()
    length, beam_ratio, height_ratio = driver.CLASSES[cls]
    beam = length * beam_ratio
    height = length * height_ratio
    hull = driver.material('probe-hull', (0.2, 0.2, 0.2, 1.0), 0.4, 0.7)
    glow = driver.material('probe-glow', (1.0, 0.6, 0.2, 1.0), 0.0, 0.4,
                           emission=True)
    parts = []
    glow_parts = []
    pilot = driver.PILOTS.get(faction)
    detail = LOD_DETAIL[lod]
    if pilot is not None and cls in pilot.PILOT_CLASSES:
        pilot.build(parts, glow_parts, cls, length, beam, height, hull, glow, detail)
    else:
        driver.BUILDERS[faction](parts, glow_parts, cls, length, beam, height,
                                 hull, hull, glow, detail)
    bpy.context.view_layer.update()
    return parts + glow_parts


def bounds(obj):
    """Ship-space (lo, hi) triples for one object."""
    lo = [math.inf] * 3
    hi = [-math.inf] * 3
    for corner in obj.bound_box:
        world = obj.matrix_world @ Vector(corner)
        ship = (world.x, world.z, -world.y)   # blender (x, -z, y) -> ship (x, y, z)
        for i in range(3):
            lo[i] = min(lo[i], ship[i])
            hi[i] = max(hi[i], ship[i])
    return lo, hi


def main():
    faction, cls, lod, top, at, radius = argv()
    objs = build(faction, cls, lod)
    boxes = [(obj.name, ) + bounds(obj) for obj in objs if obj.type == 'MESH']
    if not boxes:
        print('no geometry built for %s/%s/%s' % (faction, cls, lod))
        return

    if at is not None:
        # `probe-ship-islands` reports POST-CENTRING coordinates, because the
        # driver's centre_parts shifts every object so the sculpt's bounding box
        # is centred on the origin before export. Undo that shift here so a
        # float report can be turned straight into part names.
        centre = [(min(b[1][i] for b in boxes) + max(b[2][i] for b in boxes)) * 0.5
                  for i in range(3)]
        build_at = [at[i] + centre[i] for i in range(3)]
        print('== %s/%s/%s  parts=%d' % (faction, cls, lod, len(boxes)))
        print('  centring shift (build = probe + shift): %.3f, %.3f, %.3f'
              % (centre[0], centre[1], centre[2]))
        print('  probe point %.2f, %.2f, %.2f  ->  build point %.2f, %.2f, %.2f  (r=%.2f)'
              % (at[0], at[1], at[2], build_at[0], build_at[1], build_at[2], radius))
        hits = []
        for entry in boxes:
            part_lo, part_hi = entry[1], entry[2]
            gap = 0.0
            for i in range(3):
                if build_at[i] < part_lo[i]:
                    gap = max(gap, part_lo[i] - build_at[i])
                elif build_at[i] > part_hi[i]:
                    gap = max(gap, build_at[i] - part_hi[i])
            if gap <= radius:
                hits.append((gap, entry))
        if not hits:
            print('  no part within %.2f of that point' % radius)
        for gap, entry in sorted(hits):
            part_lo, part_hi = entry[1], entry[2]
            print('  %-40s gap %.3f  x[%7.2f,%7.2f] y[%7.2f,%7.2f] z[%7.2f,%7.2f]'
                  % (entry[0], gap,
                     part_lo[0], part_hi[0], part_lo[1], part_hi[1],
                     part_lo[2], part_hi[2]))
        return
    print('== %s/%s/%s  parts=%d' % (faction, cls, lod, len(boxes)))
    for name, axis in AXES:
        lo = min(b[1][axis] for b in boxes)
        hi = max(b[2][axis] for b in boxes)
        print('  %s span %.2f   [%.2f, %.2f]' % (name, hi - lo, lo, hi))

        for label, key, reverse in (('max', 2, True), ('min', 1, False)):
            ranked = sorted(boxes, key=lambda b: b[key][axis], reverse=reverse)
            edge = ranked[0][key][axis]
            print('    %s reach:' % label)
            for entry in ranked[:top]:
                part_lo, part_hi = entry[1], entry[2]
                print('      %-38s %s[%7.2f,%7.2f]  ext %.2f'
                      % (entry[0], name, part_lo[axis], part_hi[axis],
                         part_hi[axis] - part_lo[axis]))
            # What the span becomes once every part at this edge is pulled in.
            at_edge = [e[0] for e in boxes if abs(e[key][axis] - edge) < 1e-4]
            rest = [e for e in boxes if e[0] not in at_edge]
            if rest:
                r_lo = min(e[1][axis] for e in rest)
                r_hi = max(e[2][axis] for e in rest)
                print('      -> without %d part(s) at the %s edge: span %.2f  [%.2f, %.2f]'
                      % (len(at_edge), label, r_hi - r_lo, r_lo, r_hi))


if __name__ == '__main__':
    main()
