"""Print per-part ship-space extents for one pilot faction class.

Run with Blender in background mode:
  blender --background --python scripts/probe-ship-parts.py -- ferrous light

Blender X/Y/Z maps to ship X/Z/Y, so extents are reported back in ship space
(nose -Z, stern +Z, up +Y). Use it to find parts that reach outside the hull.
"""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import ship_kit as kit                      # noqa: E402
from ship_builders import ferrous as ferrous_pilot  # noqa: E402

CLASSES = {
    'light': (7.8, 0.42, 0.24),
    'ace': (7.2, 0.40, 0.20),
    'cutter': (11.0, 0.48, 0.30),
    'heavy': (17.0, 0.52, 0.34),
    'frigate': (32.0, 0.39, 0.26),
    'freighter': (85.0, 0.55, 0.30),
}
BUILDERS = {'ferrous': ferrous_pilot}


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def ship_extent(obj):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for corner in obj.bound_box:
        p = obj.matrix_world @ Vector(corner)
        lo.x, hi.x = min(lo.x, p.x), max(hi.x, p.x)
        lo.y, hi.y = min(lo.y, p.y), max(hi.y, p.y)
        lo.z, hi.z = min(lo.z, p.z), max(hi.z, p.z)
    # Blender (x, y, z) -> ship (x, z, -y)
    return (lo.x, hi.x), (lo.z, hi.z), (-hi.y, -lo.y)


def main():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    faction = args[0] if args else 'ferrous'
    key = args[1] if len(args) > 1 else 'light'
    detail = int(args[2]) if len(args) > 2 else 3
    clear()
    l, beam_ratio, height_ratio = CLASSES[key]
    b, h = l * beam_ratio, l * height_ratio
    hull_mat = bpy.data.materials.new('RIMWARD_HULL')
    glow_mat = bpy.data.materials.new('RIMWARD_EMISSIVE')
    parts, glow = [], []
    BUILDERS[faction].build(parts, glow, key, l, b, h, hull_mat, glow_mat, detail)

    rows = []
    for obj in parts + glow:
        (x0, x1), (y0, y1), (z0, z1) = ship_extent(obj)
        rows.append((obj.name, obj.get('skin_role', '-'), x0, x1, y0, y1, z0, z1))
    hull_z0 = min(r[6] for r in rows)
    hull_z1 = max(r[7] for r in rows)
    hull_x1 = max(r[3] for r in rows)
    print(f'== {faction} {key} detail={detail} parts={len(rows)} '
          f'spanZ={hull_z1 - hull_z0:.2f} spanX={2 * hull_x1:.2f}')
    for name, role, x0, x1, y0, y1, z0, z1 in sorted(rows, key=lambda r: r[6]):
        print(f'{name:28s} {role:7s} x[{x0:8.2f},{x1:8.2f}] '
              f'y[{y0:8.2f},{y1:8.2f}] z[{z0:8.2f},{z1:8.2f}]')


main()
