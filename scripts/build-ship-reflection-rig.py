"""Create the local HDR reflection rig used by ship PBR materials."""
from pathlib import Path
import bpy

root = Path(__file__).resolve().parents[1]
target = root / 'public' / 'assets' / 'environment' / 'ship-reflection-rig.hdr'
target.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 256
scene.render.resolution_y = 128
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'HDR'
scene.render.filepath = str(target)
scene.world.use_nodes = True
background = scene.world.node_tree.nodes.get('Background')
background.inputs['Color'].default_value = (0.025, 0.035, 0.06, 1.0)
background.inputs['Strength'].default_value = 0.35

bpy.ops.object.camera_add(location=(0, -8, 2), rotation=(1.36, 0, 0))
scene.camera = bpy.context.object
for location, color, energy, size in [
    ((-4, -2, 5), (0.55, 0.72, 1.0), 1200, 4.0),
    ((4, -1, 2), (1.0, 0.48, 0.18), 850, 2.0),
    ((0, 3, 6), (0.72, 0.90, 1.0), 700, 3.0),
]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.color = color
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (0.55, 0, 3.14)

bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(0, 0, 0))
sphere = bpy.context.object
material = bpy.data.materials.new('reflection-metal')
material.use_nodes = True
bsdf = material.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.18, 0.22, 0.30, 1.0)
bsdf.inputs['Metallic'].default_value = 0.9
bsdf.inputs['Roughness'].default_value = 0.16
sphere.data.materials.append(material)

bpy.ops.render.render(write_still=True)
print(f'Wrote {target}')
