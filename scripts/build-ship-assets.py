"""Build original NPC ship source files and GLB LOD assets.

Run with Blender in background mode. This script creates original geometry only.
The Player ship and all runtime systems remain outside this production step.
"""
from pathlib import Path
import sys
import math
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ship_skins import SKINS
from ship_builders import ferrous as ferrous_pilot
from ship_builders import freehold as freehold_pilot
from ship_builders import redledger as redledger_pilot
from ship_builders import gilded as gilded_pilot
from ship_builders import beautiful as beautiful_pilot
from ship_builders import unknowables as unknowables_pilot
from ship_builders import assembly as assembly_pilot
from ship_builders import congregation as congregation_pilot
from ship_builders import lamplighter as lamplighter_pilot
from ship_builders import independent as independent_pilot
from ship_builders import hollow as hollow_pilot


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / 'assets-source' / 'ships'
DELIVERY_ROOT = ROOT / 'public' / 'assets' / 'ships'
MATERIAL_ROOT = ROOT / 'public' / 'assets' / 'ships' / 'materials'
ENV_ROOT = ROOT / 'public' / 'assets' / 'environment'

FACTIONS = [
    'veridian', 'ferrous', 'freehold', 'redledger',
    'gilded', 'beautiful', 'unknowables', 'assembly',
    'congregation', 'lamplighter', 'independent', 'hollow',
]
CLASSES = {
    'light': (7.8, 0.42, 0.24),
    'ace': (7.2, 0.40, 0.20),
    'cutter': (11.0, 0.48, 0.30),
    'heavy': (17.0, 0.52, 0.34),
    'frigate': (32.0, 0.39, 0.26),
    'freighter': (85.0, 0.55, 0.30),
}
LOD_FEATURES = {'lod0': 3, 'lod1': 2, 'lod2': 1, 'lod3': 0}


def rgba(hex_value, alpha=1.0):
    hex_value = hex_value.lstrip('#')
    return tuple(int(hex_value[i:i + 2], 16) / 255.0 for i in (0, 2, 4)) + (alpha,)


def _srgb_to_linear(c):
    """Convert one sRGB channel (0–1) to linear light.

    glTF COLOR_0 is linear; authored palette hex values are sRGB, so every
    vertex colour must be linearised before export so that what the viewer
    reconstructs back to sRGB matches the original palette entry.
    """
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4

def _det_hash_01(s):
    """Deterministic string hash → float in [0, 1]; no PYTHONHASHSEED dependence."""
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return (h >> 8 & 0xFFFF) / 65535.0


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for data in list(datablocks):
            datablocks.remove(data)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)


def material(name, color, metallic, roughness, emission=False, use_vertex_color=False, emission_strength=3.0):
    value = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    value.use_nodes = True
    tree = value.node_tree
    bsdf = tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value = color
        bsdf.inputs['Emission Strength'].default_value = emission_strength
    if use_vertex_color:
        vc = tree.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        vc.location = (-300, 200)
        tree.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
        if emission:
            tree.links.new(vc.outputs['Color'], bsdf.inputs['Emission Color'])
    return value


def assign_vc(obj, color):
    """Paint every corner of obj with color as the 'Col' float-color attribute.

    color is expected to be in sRGB (as returned by rgba()).  Each channel is
    converted to linear before storage because glTF COLOR_0 is defined as
    linear; the viewer applies inverse-gamma on display so the authored sRGB
    palette value is what the player sees.
    """
    mesh = obj.data
    mesh.update()
    attr = mesh.color_attributes.get('Col')
    if attr is None:
        attr = mesh.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='CORNER')
    c = (_srgb_to_linear(color[0]), _srgb_to_linear(color[1]), _srgb_to_linear(color[2]), 1.0)
    for i in range(len(mesh.loops)):
        attr.data[i].color = c
    mesh.color_attributes.active_color = attr


def paint_parts_vc(parts, skin, is_glow=False):
    """Assign per-corner vertex colors to each object in parts.

    Glow parts receive the emissive color.  Role-tagged parts (skin_role
    custom property set by the kit builders) use the explicit role colour.
    Untagged parts fall back to substring matching against accent_parts /
    secondary_parts from the skin spec.
    """
    if is_glow:
        col = rgba(skin['emissive'])
        for obj in parts:
            assign_vc(obj, col)
        return
    accent_density = skin.get('accent_density', 1.0)
    secondary = skin.get('secondary_parts', ())
    accents = skin.get('accent_parts', ())
    base_col = rgba(skin['base'])
    panel_col = rgba(skin['panel'])
    accent_col = rgba(skin['accent'])
    recess_m = skin.get('recess_mult', 0.62)
    trim_m = skin.get('trim_mult', 1.12)
    recess_col = (min(1.0, max(0.0, base_col[0] * recess_m)),
                  min(1.0, max(0.0, base_col[1] * recess_m)),
                  min(1.0, max(0.0, base_col[2] * recess_m)),
                  1.0)
    trim_col = (min(1.0, max(0.0, panel_col[0] * trim_m)),
                min(1.0, max(0.0, panel_col[1] * trim_m)),
                min(1.0, max(0.0, panel_col[2] * trim_m)),
                1.0)

    # Accent-density selection: pool contains role-tagged accent parts plus
    # substring-matched untagged accent parts. Sort by name for determinism.
    candidates = sorted(
        [obj for obj in parts if
            obj.get('skin_role') == 'accent' or
            (obj.get('skin_role') is None and
             any(sub.lower() in obj.name.lower() for sub in accents))],
        key=lambda o: o.name,
    )
    n_select = max(1, round(len(candidates) * accent_density)) if candidates else 0
    selected = {o.name for o in candidates[:n_select]}

    for obj in parts:
        role = obj.get('skin_role')
        if role is not None:
            if role == 'hull':
                col = base_col
            elif role == 'armour':
                col = panel_col
            elif role == 'accent':
                col = accent_col if obj.name in selected else base_col
            elif role == 'recess':
                col = recess_col
            elif role == 'trim':
                col = trim_col
            else:
                col = base_col
        else:
            name = obj.name.lower()
            if any(sub.lower() in name for sub in accents):
                if obj.name in selected:
                    col = accent_col
                elif any(sub.lower() in name for sub in secondary):
                    col = panel_col
                else:
                    col = base_col
            elif any(sub.lower() in name for sub in secondary):
                col = panel_col
            else:
                col = base_col
        assign_vc(obj, col)


def blender_location(loc):
    x, y, z = loc
    return (x, -z, y)


def blender_size(size):
    x, y, z = size
    return (x, z, y)

def add_box(parts, name, loc, size, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=blender_location(loc))
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(value / 2 for value in blender_size(size))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        modifier = obj.modifiers.new('Author_Bevel', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        modifier.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(mat)
    parts.append(obj)
    return obj


def add_cylinder(parts, name, loc, radius, depth, mat, rotation=(0, 0, 0), vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=blender_location(loc), rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    parts.append(obj)
    return obj


def add_sphere(parts, name, loc, scale, mat, segments=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(8, segments // 2), location=blender_location(loc))
    obj = bpy.context.object
    obj.name = name
    obj.scale = blender_size(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    parts.append(obj)
    return obj


def add_torus(parts, name, loc, major, minor, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=24, minor_segments=8, location=blender_location(loc), rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    parts.append(obj)
    return obj

def centre_parts(parts):
    lo = Vector((math.inf, math.inf, math.inf))
    hi = Vector((-math.inf, -math.inf, -math.inf))
    for obj in parts:
        for corner in obj.bound_box:
            point = obj.matrix_world @ Vector(corner)
            lo.x = min(lo.x, point.x)
            lo.y = min(lo.y, point.y)
            lo.z = min(lo.z, point.z)
            hi.x = max(hi.x, point.x)
            hi.y = max(hi.y, point.y)
            hi.z = max(hi.z, point.z)
    shift = (lo + hi) * 0.5
    for obj in parts:
        obj.location -= shift


def join(parts, name, parent):
    if not parts:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    merged = bpy.context.object
    merged.name = name
    merged.parent = parent
    return merged


def dock_ring(parts, z, radius, hull, rotation=(math.pi / 2, 0, 0)):
    return add_torus(parts, 'transfer-collar', (0, 0, z), radius, max(radius * 0.10, 0.08), hull, rotation)


def append_common_class(parts, glow_parts, key, length, beam, height, hull, emissive, detail):
    front = -length * 0.42
    stern = length * 0.42
    if key == 'ace':
        for x in (-beam * 0.32, beam * 0.32):
            fin = add_box(parts, 'split-tail', (x, 0, stern * 0.78), (beam * 0.10, height * 0.18, length * 0.38), hull, beam * 0.025)
            fin.rotation_euler.y = -0.32 if x < 0 else 0.32
    elif key == 'cutter':
        dock_ring(parts, front * 0.92, min(beam, height) * 0.34, hull)
        add_box(parts, 'transfer-bay', (0, -height * 0.38, -length * 0.03), (beam * 0.54, height * 0.20, length * 0.28), hull, beam * 0.025)
    elif key == 'heavy':
        for x in (-beam * 0.30, beam * 0.30):
            add_box(parts, 'weapon-block', (x, height * 0.35, -length * 0.10), (beam * 0.20, height * 0.24, length * 0.16), hull, beam * 0.025)
    elif key == 'frigate':
        add_box(parts, 'command-citadel', (0, height * 0.43, -length * 0.10), (beam * 0.30, height * 0.32, length * 0.24), hull, beam * 0.02)
        add_box(parts, 'rescue-bay', (0, -height * 0.34, length * 0.15), (beam * 0.50, height * 0.18, length * 0.30), hull, beam * 0.02)
    elif key == 'freighter':
        for factor in (-0.30, -0.05, 0.20):
            add_box(parts, 'cargo-habitat-module', (0, 0, length * factor), (beam * 0.72, height * 0.74, length * 0.18), hull, beam * 0.025)
        for x in (-beam * 0.60, beam * 0.60):
            add_box(parts, 'exterior-berth', (x, 0, length * 0.10), (beam * 0.12, height * 0.22, length * 0.38), hull, beam * 0.015)
    if detail >= 2:
        for x in (-beam * 0.42, beam * 0.42):
            add_box(glow_parts, 'navigation-light', (x, height * 0.30, -length * 0.08), (beam * 0.06, height * 0.05, length * 0.07), emissive)


def veridian(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'load-bearing-spine', (0, 0, 0), (b * 0.30, h * 0.38, l * 0.88), hull, b * 0.04)
    add_cylinder(parts, 'faceted-survey-head', (0, 0, -l * 0.38), b * 0.30, l * 0.22, accent, (math.pi / 2, 0, 0), 8)
    for x in (-b * 0.36, b * 0.36):
        add_cylinder(parts, 'sample-canister', (x, 0, l * 0.10), b * 0.11, l * 0.25, hull, (math.pi / 2, 0, 0), 8)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def ferrous(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'reinforced-prow', (0, 0, -l * 0.30), (b * 0.86, h * 0.78, l * 0.38), hull, b * 0.06)
    add_box(parts, 'layered-citadel', (0, 0, l * 0.12), (b * 0.68, h * 0.92, l * 0.46), hull, b * 0.05)
    for x in (-b * 0.42, b * 0.42):
        add_box(parts, 'paired-battery', (x, h * 0.27, l * 0.03), (b * 0.13, h * 0.22, l * 0.19), accent, b * 0.015)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def freehold(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'sound-keel', (0, 0, 0), (b * 0.38, h * 0.38, l * 0.90), hull, b * 0.04)
    add_box(parts, 'greenhouse-cabin', (0, h * 0.30, -l * 0.22), (b * 0.62, h * 0.42, l * 0.32), accent, b * 0.035)
    for x in (-b * 0.38, b * 0.38):
        add_cylinder(parts, 'water-tank', (x, 0, l * 0.16), b * 0.13, l * 0.27, hull, (math.pi / 2, 0, 0), 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def redledger(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'captured-core', (0, 0, l * 0.10), (b * 0.58, h * 0.68, l * 0.62), hull, b * 0.04)
    add_box(parts, 'boarding-spike', (0, 0, -l * 0.42), (b * 0.22, h * 0.24, l * 0.34), accent, b * 0.02)
    if key in ('cutter', 'heavy', 'frigate', 'freighter'):
        for x in (-b * 0.50, b * 0.50):
            arm = add_box(parts, 'grapple-arm', (x, 0, -l * 0.20), (b * 0.10, h * 0.13, l * 0.42), hull, b * 0.02)
            arm.rotation_euler.y = -0.20 if x < 0 else 0.20
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def gilded(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_sphere(parts, 'sealed-scale-body', (0, 0, 0), (b * 0.46, h * 0.38, l * 0.43), hull)
    for z in (-l * 0.26, -l * 0.06, l * 0.14):
        add_box(parts, 'ceramic-scale-course', (0, h * 0.25, z), (b * 0.74, h * 0.12, l * 0.20), hull, b * 0.045)
    add_box(glow, 'sealed-gallery', (0, 0, -l * 0.06), (b * 0.14, h * 0.08, l * 0.45), emissive, b * 0.01)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def beautiful(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_sphere(parts, 'living-body', (0, 0, 0), (b * 0.34, h * 0.43, l * 0.42), hull)
    for x in (-b * 0.38, b * 0.38):
        fin = add_sphere(parts, 'manta-fin', (x, 0, -l * 0.02), (b * 0.25, h * 0.10, l * 0.28), accent)
        fin.rotation_euler.y = -0.18 if x < 0 else 0.18
    add_sphere(parts, 'sensory-crown', (0, h * 0.38, -l * 0.25), (b * 0.13, h * 0.16, l * 0.12), accent)
    add_box(glow, 'nerve-line', (0, 0, -l * 0.06), (b * 0.08, h * 0.04, l * 0.66), emissive, b * 0.01)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def unknowables(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_sphere(parts, 'physical-anchor', (0, 0, 0), (b * 0.18, h * 0.18, l * 0.13), hull, 12)
    add_sphere(parts, 'structural-anchor', (0, 0, 0), (b * 0.60, h * 0.42, l * 0.46), hull, 20)
    for index, ratio in enumerate((0.20, 0.32, 0.44)):
        add_torus(glow, f'magnetic-loop-{index}', (0, 0, 0), b * ratio, max(b * 0.02, 0.08), emissive, (math.pi / 2, 0, index * 0.42))
    if key in ('cutter', 'heavy', 'frigate', 'freighter'):
        for x in (-b * 0.44, b * 0.44):
            add_sphere(parts, 'anchor-cell', (x, 0, l * 0.08), (b * 0.10, h * 0.11, l * 0.08), accent, 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def assembly(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'recursive-spine', (0, 0, 0), (b * 0.24, h * 0.32, l * 0.90), hull, b * 0.025)
    add_sphere(parts, 'memory-core', (0, 0, 0), (b * 0.42, h * 0.30, l * 0.36), hull, 20)
    for z in (-l * 0.28, -l * 0.06, l * 0.17):
        for x in (-b * 0.38, b * 0.38):
            add_box(parts, 'copied-probe-module', (x, 0, z), (b * 0.18, h * 0.34, l * 0.18), accent, b * 0.025)
    add_sphere(glow, 'teal-optic', (0, 0, -l * 0.39), (b * 0.12, h * 0.12, l * 0.06), emissive, 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def congregation(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'pilgrimage-keel', (0, 0, 0), (b * 0.28, h * 0.32, l * 0.92), hull, b * 0.025)
    for z in (-l * 0.26, -l * 0.06, l * 0.16):
        add_torus(parts, 'silver-navigation-rib', (0, 0, z), b * 0.36, b * 0.025, accent, (math.pi / 2, 0, 0))
    add_sphere(glow, 'wakeglass-observatory', (0, h * 0.20, -l * 0.33), (b * 0.20, h * 0.16, l * 0.12), emissive, 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def lamplighter(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'service-frame', (0, 0, 0), (b * 0.22, h * 0.24, l * 0.94), hull, b * 0.018)
    for x in (-b * 0.42, b * 0.42):
        add_box(parts, 'utility-module', (x, 0, -l * 0.05), (b * 0.19, h * 0.45, l * 0.34), accent, b * 0.02)
    add_box(parts, 'relay-mast', (0, h * 0.48, l * 0.08), (b * 0.06, h * 0.56, l * 0.10), hull, b * 0.01)
    for x in (-b * 0.30, b * 0.30):
        add_sphere(glow, 'work-lamp', (x, h * 0.33, -l * 0.28), (b * 0.06, h * 0.06, l * 0.05), emissive, 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def independent(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'civilian-chassis', (0, 0, 0), (b * 0.60, h * 0.50, l * 0.90), hull, b * 0.04)
    add_sphere(parts, 'load-bearing-core', (0, 0, 0), (b * 0.44, h * 0.36, l * 0.36), hull, 24)
    add_box(parts, 'secondhand-module', (b * 0.34, 0, l * 0.18), (b * 0.22, h * 0.35, l * 0.33), accent, b * 0.025)
    add_sphere(glow, 'warm-navigation-light', (0, h * 0.30, -l * 0.26), (b * 0.07, h * 0.06, l * 0.05), emissive, 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)


def hollow(parts, glow, key, l, b, h, hull, accent, emissive, detail):
    add_box(parts, 'sealed-watch-hull', (0, 0, 0), (b * 0.54, h * 0.48, l * 0.84), hull, b * 0.055)
    for x in (-b * 0.38, b * 0.38):
        add_box(parts, 'wrap-panel', (x, 0, -l * 0.04), (b * 0.10, h * 0.42, l * 0.48), accent, b * 0.015)
    dish = add_sphere(parts, 'listening-dish', (0, h * 0.36, -l * 0.18), (b * 0.34, h * 0.10, l * 0.18), accent, 16)
    dish.rotation_euler.x = 0.30
    add_sphere(glow, 'buried-command-lantern', (0, h * 0.24, l * 0.04), (b * 0.05, h * 0.05, l * 0.05), emissive, 12)
    append_common_class(parts, glow, key, l, b, h, hull, emissive, detail)

BUILDERS = {
    'veridian': veridian, 'ferrous': ferrous, 'freehold': freehold, 'redledger': redledger,
    'gilded': gilded, 'beautiful': beautiful, 'unknowables': unknowables, 'assembly': assembly,
    'congregation': congregation, 'lamplighter': lamplighter, 'independent': independent, 'hollow': hollow,
}

# Hand-authored per-class sculpt modules. A faction listed here uses its pilot
# module for the classes the module claims, and the generic BUILDERS entry for
# the rest.
PILOTS = {
    'ferrous': ferrous_pilot,
    'freehold': freehold_pilot,
    'redledger': redledger_pilot,
    'gilded': gilded_pilot,
    'beautiful': beautiful_pilot,
    'unknowables': unknowables_pilot,
    'assembly': assembly_pilot,
    'congregation': congregation_pilot,
    'lamplighter': lamplighter_pilot,
    'independent': independent_pilot,
    'hollow': hollow_pilot,
}


def add_idle(root, faction):
    if faction not in ('beautiful', 'unknowables'):
        return
    root.scale = (1, 1, 1)
    root.keyframe_insert(data_path='scale', frame=1)
    root.scale = (1.025, 0.985, 1.025)
    root.keyframe_insert(data_path='scale', frame=20)
    root.scale = (1, 1, 1)
    root.keyframe_insert(data_path='scale', frame=40)
    action = root.animation_data.action
    action.name = 'idle'
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 40


def build_one(faction, key, lod):
    clear_scene()
    l, beam_ratio, height_ratio = CLASSES[key]
    b = l * beam_ratio
    h = l * height_ratio
    skin = SKINS[faction]
    skin_roughness = skin.get('roughness', (0.48, 0.55, 0.55))
    hull = material('RIMWARD_HULL', rgba(skin['base']), 0.55 if faction not in ('beautiful', 'unknowables') else 0.1, skin_roughness[0], use_vertex_color=True)
    # Single opaque material slot; vertex colors carry palette roles.
    accent = hull
    em_str = skin.get('emissive_strength', 3.0)
    emissive = material('RIMWARD_EMISSIVE', rgba(skin['emissive']), 0.0, 0.32, emission=True, use_vertex_color=True, emission_strength=em_str)
    field = material('RIMWARD_FIELD', rgba(skin['emissive'], 0.75), 0.0, 0.18, emission=True, use_vertex_color=True, emission_strength=em_str)
    root = bpy.data.objects.new('RIMWARD_SHIP_ROOT', None)
    bpy.context.collection.objects.link(root)
    root.scale = (1, 1, 1)
    parts, glow_parts = [], []
    detail = LOD_FEATURES[lod]
    pilot = PILOTS.get(faction)
    if pilot is not None and key in pilot.PILOT_CLASSES:
        glow_mat = field if faction == 'unknowables' else emissive
        pilot.build(parts, glow_parts, key, l, b, h, hull, glow_mat, detail)
    else:
        BUILDERS[faction](parts, glow_parts, key, l, b, h, hull, accent, field if faction == 'unknowables' else emissive, detail)
    # Drive flare: sized off the hull's own drive end, not the full beam. The old
    # b*0.10 made a 9-unit bead on a 74-unit freighter, which read as a pearl stuck
    # to the stern. Kept flat in Z so it reads as a flare behind the nozzles.
    engine = add_sphere([], 'RIMWARD_ENGINE_GLOW', (0, 0, l * 0.47), (max(b * 0.045, 0.10), max(h * 0.05, 0.08), max(l * 0.018, 0.07)), emissive, 12)
    # The UV sphere primitive generates UVs that export as 0–65535 in glTF,
    # causing the emissive atlas to be sampled at junk coordinates.  The engine
    # glow is driven entirely by vertex colours and emissive material strength;
    # it does not need atlas UVs, so strip them here.
    for _uv in list(engine.data.uv_layers):
        engine.data.uv_layers.remove(_uv)
    centre_parts([*parts, *glow_parts, engine])
    # Per-corner vertex colors assigned before join so object names are still available.
    paint_parts_vc(parts, skin, is_glow=False)
    paint_parts_vc(glow_parts, skin, is_glow=True)
    assign_vc(engine, rgba(skin['emissive']))
    join(parts, 'RIMWARD_HULL', root)
    join(glow_parts, 'RIMWARD_EMISSIVE', root)
    engine.parent = root
    if faction in ('beautiful', 'unknowables'):
        add_idle(root, faction)
    bpy.context.view_layer.objects.active = root
    root.select_set(True)
    return root


def export_glb(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=True,
        export_materials='EXPORT', export_apply=True,
        export_animations=True, export_animation_mode='ACTIONS',
        export_yup=True,
    )


def create_source_and_delivery(factions=None, classes=None):
    for faction in (factions or FACTIONS):
        for key in (classes or CLASSES):
            lods = ('lod0', 'lod1', 'lod2', 'lod3') if key == 'freighter' else ('lod0', 'lod1', 'lod2')
            for lod in lods:
                build_one(faction, key, lod)
                target = DELIVERY_ROOT / faction / key / f'{lod}.glb'
                export_glb(target)
                print(f'built {faction}/{key}/{lod}', flush=True)
                if lod == 'lod0':
                    source = SOURCE_ROOT / faction / f'{key}.blend'
                    source.parent.mkdir(parents=True, exist_ok=True)
                    bpy.ops.wm.save_as_mainfile(filepath=str(source), check_existing=False)


def _pattern_value(pat, px, py, density):
    """Return feature intensity [0.0, 1.0] at pixel (px, py) for pat.

    0 = background surface; 1 = full feature (seam, plate edge, motif peak).
    density: panel_density from the SKIN spec, modulates feature coverage.
    """
    if pat == 'hex_module':
        row = py // 28
        hx = (px + (14 if row % 2 else 0)) % 32
        hy = py % 28
        edge = min(min(hx, 32 - hx), min(hy, 28 - hy))
        return 1.0 if edge < max(2, int(density * 7)) else 0.0
    if pat == 'plate_band':
        return 1.0 if py % 32 < max(2, int(density * 9)) else 0.0
    if pat in ('repair_patch', 'panel-patch'):
        cx, cy = px // 48, py // 36
        h_val = ((cx * 1664525 + cy * 1013904223) & 0xFFFFFFFF) % 1000
        if h_val >= int(density * 800):
            return 0.0
        # Bounded sub-patch within the cell — not the whole 48x36 block.
        lx, ly = px % 48, py % 36
        pw = 8 + (h_val % 20)
        ph = 6 + (h_val % 14)
        ox = (h_val // 20) % max(1, 48 - pw)
        oy = (h_val // 280) % max(1, 36 - ph)
        return 1.0 if ox <= lx < ox + pw and oy <= ly < oy + ph else 0.0
    if pat == 'tally':
        return 1.0 if px % 20 < max(1, int(density * 4)) else 0.0
    if pat == 'scale':
        row = py // 24
        sx = (px + (12 if row % 2 else 0)) % 24
        sy = py % 24
        edge = min(min(sx, 24 - sx), min(sy, 24 - sy))
        return 1.0 if edge < max(2, int(density * 6)) else 0.0
    if pat == 'growth':
        v = math.sin(px * 0.08 + math.cos(py * 0.05) * 1.5) * 0.5 + 0.5
        return 1.0 if v > 1.0 - density * 0.8 else 0.0
    if pat == 'ordered_field':
        gx, gy = px % 20 - 10, py % 20 - 10
        return 1.0 if math.sqrt(gx * gx + gy * gy) < max(2, int(density * 7)) else 0.0
    if pat == 'recursive':
        threshold = max(1, int(density * 4))
        for period in (64, 32, 16):
            gx, gy = px % period, py % period
            if min(min(gx, period - gx), min(gy, period - gy)) < threshold:
                return 1.0
        return 0.0
    if pat == 'folded_rib':
        row_thick = max(1, int(density * 8))
        col_thick = max(1, int(density * 5))
        return 1.0 if py % 28 < row_thick or px % 40 < col_thick else 0.0
    if pat == 'utility-grid':
        gx, gy = px % 24, py % 24
        edge = min(min(gx, 24 - gx), min(gy, 24 - gy))
        return 1.0 if edge < max(2, int(density * 5)) else 0.0
    if pat == 'shutter':
        return 1.0 if py % 16 < max(2, int(density * 5)) else 0.0
    return 0.0


def write_pbr_atlas(base_path, skin, role):
    """Generate 512×512 PBR atlas PNGs for one faction/role pair.

    basecolor — sRGB; near-neutral patterned modulation; vertex colours carry hue.
    normal    — linear tangent-space normals; flat default with pattern bumps.
    orm       — linear; R=occlusion, G=roughness, B=metalness.
    emissive  — sRGB; the faction glow colour, since the emissive geometry is
                itself the mask and three.js multiplies emissive by this map.
    Pirate role dims the palette by 0.62 without geometry changes.
    """
    import array as _array

    W, H = 512, 512
    pat = skin.get('pattern', '')
    roughness = skin.get('roughness', (0.55, 0.55, 0.55))
    density = skin.get('panel_density', 0.4)
    wear = skin.get('wear', 0.3)
    em_str = skin.get('emissive_strength', 1.0)
    em_col = rgba(skin['emissive'])
    dim = 0.62 if role == 'pirate' else 1.0
    # Runtime emissive = material emissive (white) x this map x emissiveIntensity.
    # Clamp the authored strength so a strength-2.5 faction cannot saturate the map.
    em_scale = min(1.0, 0.55 + 0.18 * em_str) * dim
    metal_base = 0.10 if skin['id'] in ('beautiful', 'unknowables') else 0.18
    faction_id = skin['id']

    base_px, nrm_px, orm_px, emi_px = [], [], [], []
    for py in range(H):
        ty = 1.0 - py / H           # 1.0 at top row = engine UV end
        for px in range(W):
            v = _pattern_value(pat, px, py, density)

            # Basecolor: neutral-grey modulation in [0.58, 0.90] before dimming.
            # dim=0.62 for pirate; floor at 0.471 (120/255) keeps pirate maps in
            # contract range while preserving the required 20/255 visible variation.
            bc = max(0.471, min(0.96, (0.90 - v * 0.32) * dim))
            base_px += [bc, bc, bc, 1.0]

            # ORM: all linear.
            occ = max(0.0, 1.0 - wear * 0.5 * v)
            rug = roughness[0] + (roughness[1] - roughness[0]) * v
            # roughness[2] (accent): deterministic fine-scale contribution.
            acc_h = ((px * 2053 + py * 7919) * 1664525 + 1013904223) & 0xFFFF
            acc_v = 1.0 if acc_h < int(density * 16383) else 0.0
            # No hard floor for any faction: clamping flattens the channel for every
            # skin whose authored roughness sits below the floor (gilded ceramic at
            # 0.22-0.36, organic tissue, field anchors), which is what produced a
            # constant ORM green. Instead lift the whole authored range so the base
            # value lands just above the contract minimum (120/255) and let the
            # pattern and accent terms modulate freely above it.
            rug_lift = max(0.0, (0.50 if metal_base > 0.10 else 0.478) - roughness[0])
            rug = min(1.0, rug + rug_lift + (roughness[2] - roughness[0]) * acc_v * density * 0.4)
            met = metal_base * (1.0 - v * 0.25)
            orm_px += [occ, rug, met, 1.0]

            # Normal: valid tangent-space; pattern edges add small surface bumps.
            if v > 0.0:
                tn_x = math.sin(px * 0.4) * v * 0.12
                tn_y = math.sin(py * 0.4) * v * 0.12
                tn_z = math.sqrt(max(1e-6, 1.0 - tn_x * tn_x - tn_y * tn_y))
            else:
                tn_x, tn_y, tn_z = 0.0, 0.0, 1.0
            nrm_px += [tn_x * 0.5 + 0.5, tn_y * 0.5 + 0.5, tn_z * 0.5 + 0.5, 1.0]

            # (emissive written below)
            # Emissive: the glow MESH is the mask, so the atlas carries the faction
            # glow colour at full strength. A black atlas would multiply the runtime
            # emissive term to zero and kill every lamp, slit, and drive core.
            emi_px += [
                min(1.0, em_col[0] * em_scale),
                min(1.0, em_col[1] * em_scale),
                min(1.0, em_col[2] * em_scale),
                1.0,
            ]

    def _channel_stats(buf):
        """Return (r_mean, g_mean, b_mean, r_range, g_range, b_range) from flat RGBA buffer."""
        n = W * H
        r = buf[0::4]
        g = buf[1::4]
        b = buf[2::4]
        return (
            sum(r) / n, sum(g) / n, sum(b) / n,
            max(r) - min(r), max(g) - min(g), max(b) - min(b),
        )

    def _save(stem, pixels, colorspace='Non-Color', validate=None):
        """Write a flat RGBA float buffer to a PNG and optionally assert contract ranges.

        Three bugs fixed versus the previous implementation:
        1. float_buffer=True avoids 8-bit internal clamping during assignment.
        2. colorspace_settings.name is set BEFORE pixels are written; setting it
           after triggers Blender's internal re-conversion and zeros the buffer.
        3. img.pixels.foreach_set() with an array.array('f') is the reliable path
           for large pixel buffers; direct list assignment silently fails.
        4. img.update() flushes the pixel buffer to Blender's internal store
           before img.save() reads it.
        """
        img_name = f'__atlas_{stem}_{faction_id}_{role}'
        existing = bpy.data.images.get(img_name)
        if existing:
            bpy.data.images.remove(existing)
        img = bpy.data.images.new(img_name, width=W, height=H, alpha=True, float_buffer=True)
        # Colorspace BEFORE pixel write — prevents silent re-conversion on assignment.
        img.colorspace_settings.name = colorspace
        img.pixels.foreach_set(_array.array('f', pixels))
        img.update()   # flush pixel buffer to internal store before save
        out = base_path.parent / f'{stem}.png'
        out.parent.mkdir(parents=True, exist_ok=True)
        img.filepath_raw = str(out)
        img.file_format = 'PNG'
        img.save()
        if validate is not None:
            stats = _channel_stats(list(img.pixels))
            validate(stats, f'faction={faction_id} role={role} map={stem}')
        bpy.data.images.remove(img)

    def _assert_basecolor(s, label):
        r_m, g_m, b_m, r_r, g_r, b_r = s
        lo, hi, min_var = 120 / 255, 245 / 255, 20 / 255
        for val, name in ((r_m, 'R'), (g_m, 'G'), (b_m, 'B')):
            if not (lo <= val <= hi):
                raise AssertionError(
                    f'basecolor {name} mean {val * 255:.1f}/255 outside '
                    f'[{lo * 255:.0f}, {hi * 255:.0f}] — {label}')
        for val, name in ((r_r, 'R'), (g_r, 'G'), (b_r, 'B')):
            if val < min_var:
                raise AssertionError(
                    f'basecolor {name} channel variation {val * 255:.1f}/255 < 20 '
                    f'(atlas is effectively constant — ensure the skin has a pattern) '
                    f'— {label}')

    def _assert_normal(s, label):
        r_m, g_m, b_m, r_r, g_r, b_r = s
        if b_m < 200 / 255:
            raise AssertionError(
                f'normal B mean {b_m * 255:.1f}/255 < 200 '
                f'(blue channel too low for tangent-space normals) — {label}')
        if r_r < 1e-4:
            raise AssertionError(
                f'normal R channel is constant '
                f'(ensure the skin has a pattern for surface bumps) — {label}')
        if g_r < 1e-4:
            raise AssertionError(
                f'normal G channel is constant '
                f'(ensure the skin has a pattern for surface bumps) — {label}')

    def _assert_orm(s, label):
        r_m, g_m, b_m, r_r, g_r, b_r = s
        if r_m < 180 / 255:
            raise AssertionError(
                f'ORM occlusion mean {r_m * 255:.1f}/255 < 180 — {label}')
        if not (120 / 255 <= g_m <= 200 / 255):
            raise AssertionError(
                f'ORM roughness mean {g_m * 255:.1f}/255 outside [120, 200] — {label}')
        if b_m >= 70 / 255:
            raise AssertionError(
                f'ORM metalness mean {b_m * 255:.1f}/255 >= 70 — {label}')

    _save('basecolor', base_px, 'sRGB',     validate=_assert_basecolor)
    _save('normal',    nrm_px,  'Non-Color', validate=_assert_normal)
    _save('orm',       orm_px,  'Non-Color', validate=_assert_orm)
    _save('emissive',  emi_px,  'sRGB')     # all-black is valid; no assertion needed


def create_texture_inputs(factions=None):
    for faction in (factions or FACTIONS):
        skin = SKINS[faction]
        for role in ('trader', 'pirate'):
            base_path = MATERIAL_ROOT / faction / role / 'basecolor.png'
            write_pbr_atlas(base_path, skin, role)


def create_reflection_rig():
    ENV_ROOT.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 64
    scene.render.resolution_y = 32
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'HDR'
    scene.render.filepath = str(ENV_ROOT / 'ship-reflection-rig.hdr')
    scene.world.color = (0.06, 0.07, 0.10)
    bpy.ops.wm.read_factory_settings(use_empty=True)


def parse_targets(argv):
    """Split CLI arguments into (factions, classes).

    Usage: build-ship-assets.py [faction ...] [--class=key[,key]]
    Both lists default to None, which means "the whole fleet". Blender's own
    argument list is separated by a bare '--', so anything before it is dropped.
    """
    if '--' in argv:
        argv = argv[argv.index('--') + 1:]
    factions, classes = [], []
    for arg in argv:
        if arg.startswith('--class='):
            classes += [k for k in arg.split('=', 1)[1].split(',') if k]
        elif not arg.startswith('-'):
            factions.append(arg)
    unknown = [f for f in factions if f not in FACTIONS] + [c for c in classes if c not in CLASSES]
    if unknown:
        raise SystemExit(f'unknown build target(s): {", ".join(unknown)}')
    return (factions or None), (classes or None)


if __name__ == '__main__':
    _factions, _classes = parse_targets(sys.argv[1:])
    create_source_and_delivery(_factions, _classes)
    create_texture_inputs(_factions)
