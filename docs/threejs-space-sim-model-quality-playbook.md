---
topic: "Three.js space simulator model quality"
research_date: 2026-08-11
refresh_by: 2026-11-11
status: final
source_mode: web-backed primary-source pass plus synthesis
sources:
  - url: "https://threejs.org/docs/pages/MeshStandardMaterial.html"
    title: "Three.js MeshStandardMaterial"
    publisher: "Three.js"
    accessed: 2026-08-11
  - url: "https://threejs.org/docs/pages/MeshPhysicalMaterial.html"
    title: "Three.js MeshPhysicalMaterial"
    publisher: "Three.js"
    accessed: 2026-08-11
  - url: "https://threejs.org/docs/pages/WebGLRenderer.html"
    title: "Three.js WebGLRenderer"
    publisher: "Three.js"
    accessed: 2026-08-11
  - url: "https://threejs.org/docs/pages/PMREMGenerator.html"
    title: "Three.js PMREMGenerator"
    publisher: "Three.js"
    accessed: 2026-08-11
  - url: "https://threejs.org/docs/pages/Texture.html"
    title: "Three.js Texture"
    publisher: "Three.js"
    accessed: 2026-08-11
  - url: "https://threejs.org/docs/pages/GLTFLoader.html"
    title: "Three.js GLTFLoader"
    publisher: "Three.js"
    accessed: 2026-08-11
  - url: "https://www.khronos.org/gltf/pbr/"
    title: "glTF Physically Based Rendering"
    publisher: "Khronos Group"
    accessed: 2026-08-11
  - url: "https://gltf-transform.dev/cli"
    title: "glTF Transform CLI"
    publisher: "glTF Transform"
    accessed: 2026-08-11
---

# Three.js Space Sim Model Quality Playbook

## Executive Take

Three.js can make space-sim models look excellent, but not by throwing random lights at imported GLBs. The quality stack is:

1. Good source asset: bevels, weighted normals, UVs, PBR maps, scale, authored variation.
2. Correct export: glTF/GLB, metallic-roughness workflow, correct texture channel packing.
3. Correct renderer: color management, tone mapping, environment map, exposure, postprocessing.
4. Art-directed space lighting: strong sun/key, reflection environment, rim/fill for readability, controlled emissive/bloom.
5. Runtime strategy: LODs, compression, draw-call discipline, origin/depth handling.

The big rule: if a ship has no bevels, no normal detail, uniform roughness, and no environment reflections, it will look like a plastic toy no matter how much code you write.

## The Hero Asset Test

Before fixing the whole game, build a single hero test scene:

- One ship/station GLB.
- Black or simple star background.
- One directional sun light.
- One invisible PMREM environment map.
- Tone mapping enabled.
- Bloom only for emissive engines/windows.
- Camera close enough to inspect materials.
- Debug UI for exposure, env intensity, sun intensity, roughness override, metalness override, normal scale, and bloom threshold.

This scene should answer one question: can your pipeline make one asset look expensive? Do not debug fleets, planets, cockpit, particles, physics, or giant scales until this is true.

## Diagnosis Ladder

1. Open the model in Blender.
   - If it looks bad in Blender, fix the asset.
   - Add bevels, weighted normals, panel lines, better UVs, decals, roughness variation, and normal maps.

2. Open the exported GLB in a neutral glTF viewer.
   - If Blender looks good but glTF viewer does not, fix export settings or texture packing.
   - Check metallic-roughness channels: roughness is green, metalness is blue.
   - Check normal map tangent space.
   - Check whether textures are embedded or linked correctly.

3. Load the same GLB in your Three.js hero scene.
   - If viewer looks good but Three.js does not, fix renderer/color/environment/lighting.
   - Check `renderer.outputColorSpace`, tone mapping, texture color spaces, PMREM environment, and exposure.

4. Load the model in the actual game scene.
   - If hero scene looks good but game scene does not, fix scale, camera clipping, background, postprocessing, lighting layers, or performance degradation.

This ladder prevents you from blaming Three.js for a bad mesh, or re-authoring a model when your renderer is simply missing image-based lighting.

## Renderer Baseline

Use this as a known-good starting point, not as magic:

```js
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

Three.js currently defaults `outputColorSpace` to `SRGBColorSpace`, but `toneMapping` defaults to `NoToneMapping`. For HDR environment maps, sunlit hulls, engine glow, and bloom, choose tone mapping deliberately. Test `ACESFilmicToneMapping`, `AgXToneMapping`, and `NeutralToneMapping`; pick the one that supports your art direction.

Avoid changing five things at once. Exposure, environment intensity, and material roughness interact heavily.

## Color Space Rules

This is where a lot of "my model looks wrong" problems live.

Color textures:

- Base color / albedo: `SRGBColorSpace`.
- Emissive map: usually `SRGBColorSpace`.
- UI/decal color textures: usually `SRGBColorSpace`.

Non-color data:

- Normal map: `NoColorSpace`.
- Roughness: `NoColorSpace`.
- Metalness: `NoColorSpace`.
- Ambient occlusion: `NoColorSpace`.
- Clearcoat roughness, transmission, anisotropy strength, masks: `NoColorSpace`.

HDR environment:

- Usually linear HDR data, commonly `LinearSRGBColorSpace` in Three.js docs.

If you use `GLTFLoader`, it handles most glTF texture color-space semantics for imported assets. Problems usually start when you manually replace maps in code or load loose textures separately.

## Environment Lighting In Space

Space is visually black, but PBR cannot reflect "nothing." Metals and glossy paint need something to reflect.

Use two separate concepts:

- `scene.background`: what the player sees.
- `scene.environment`: what PBR materials reflect.

For a space sim, these should often be different. Keep the visible background dark, but give the model an invisible reflection world: a subtle HDR studio, nebula, sun/planet cube map, or a procedural PMREM scene with bright bands and colored rim sources.

```js
const pmrem = new THREE.PMREMGenerator(renderer);

new RGBELoader().load('/env/ship-reflection-rig.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const env = pmrem.fromEquirectangular(hdr).texture;
  scene.environment = env;
  scene.background = null;
  hdr.dispose();
});
```

Three.js `PMREMGenerator` exists because rough materials need prefiltered radiance at different blur levels. A raw HDR map is not the same thing as a proper roughness-aware environment.

## Lighting Model For Ships

Use cinematic space lighting, not indoor lighting.

Start with:

```js
const sun = new THREE.DirectionalLight(0xffffff, 3.0);
sun.position.set(10, 4, 2);
scene.add(sun);

const rim = new THREE.DirectionalLight(0x7aa7ff, 0.6);
rim.position.set(-6, 2, -8);
scene.add(rim);
```

Then tune:

- Sun defines form and hard shadow direction.
- Environment defines reflections and broad material response.
- Rim/fill protects readability.
- Emissive maps sell engines, windows, sensors, and scale.
- Ambient light should be minimal. Too much ambient makes shapes look flat.

For realism, the unlit side of a ship can go very dark. For a game, you usually need an art-directed cheat so the silhouette and gameplay readability survive.

## Asset Authoring: What Makes A Ship Look Good

The model needs light-catching geometry.

Required for hero ships:

- Small bevels on most hard edges.
- Weighted normals or clean custom normals.
- Good smoothing groups.
- UVs without obvious stretching.
- Normal map for panels, screws, vents, seams, hull plating.
- Roughness variation map.
- Decals, warning labels, faction marks, grime, heat discoloration.
- Non-uniform panel materials.
- Engine emissive masks.

Common bad signs:

- Infinite razor-sharp edges.
- One material across the whole hull.
- Flat grey albedo.
- Metalness set to `1` everywhere.
- Roughness set to one uniform slider value.
- No scale cues: no ports, windows, seams, decals, antennas, thrusters, docking features.

In sci-fi especially, detail density matters. A 100-meter ship with no readable small features looks like a toy because the eye cannot infer scale.

## Material Recipes

Painted hull:

- `metalness`: 0.0
- `roughness`: 0.45-0.85 with map variation
- Optional clearcoat for glossy military/civilian paint
- Normal map for panel seams
- Decals in base color/normal/roughness

Bare metal:

- `metalness`: 1.0
- `roughness`: 0.25-0.75 depending on polish/wear
- Strong roughness breakup
- Scratches mostly in roughness/normal, not just base color

Dark stealth hull:

- Avoid pure black albedo. Use dark grey with material variation.
- Use rim light and grazing reflections.
- Let shape come from silhouette and roughness contrast.

Cockpit glass:

- Close-up: `MeshPhysicalMaterial`, transmission/IOR/roughness tuned carefully.
- Distance: fake it with opaque dark material, strong specular/clearcoat, and maybe emissive interior hints. Often looks better and costs less.

Engines:

- Emissive core with high emissive intensity.
- Bloom threshold tuned so only hot areas bloom.
- Rough metal nozzle material around it.
- Optional particles/volumetric cone as separate effect.
- Do not rely on emissive alone to show nozzle geometry.

Solar panels:

- Dark base.
- Anisotropy if using `MeshPhysicalMaterial` and close-up quality matters.
- Directional normal/roughness patterns.
- Strong glancing reflections.

Asteroids:

- Non-metal.
- High roughness.
- Strong normal/displacement baked detail.
- Varied albedo.
- Sharp directional sun; little ambient.

Stations:

- Lots of material reuse with atlased detail.
- Window emissive masks with variation.
- Scale cues: docking bays, antennas, service lights, panels, radiators.
- Avoid every window being identical brightness.

## When To Use MeshPhysicalMaterial

Default to glTF PBR / `MeshStandardMaterial` behavior. Use `MeshPhysicalMaterial` features only when the surface earns the cost:

- Clearcoat: painted ships, polished helmets, coated panels.
- Transmission/IOR/volume: glass canopies, visors, transparent alien materials.
- Anisotropy: brushed metal, solar panels, carbon fiber.
- Iridescence: exotic coatings, alien materials, shield effects.
- Specular controls: non-metal materials needing better reflectivity.

Three.js documents `MeshPhysicalMaterial` as higher per-pixel cost. On a space sim with many ships, use it for hero LODs and close-up materials, not every asteroid and background drone.

## Postprocessing

Postprocessing should support the material work, not hide bad materials.

Use:

- Bloom for engines, nav lights, station windows, plasma, lasers.
- SMAA/FXAA/TAA-style antialiasing depending stack and performance.
- Subtle color grading after tone mapping decisions are stable.
- Depth of field only for cinematic/photo modes unless gameplay tolerates it.
- Motion blur cautiously; it can smear readable ship detail.

Bloom rule:

- Raise emissive intensity on specific maps.
- Set bloom threshold so normal hull highlights do not bloom.
- Do not bloom the whole ship unless intentionally stylized.

## Scale And Depth

Do not render real astronomical scale in one scene with one camera and expect precision to behave.

Use:

- Local gameplay scene around the player.
- Floating origin / origin rebasing.
- Separate background scene for stars/nebulae.
- Separate planet impostors or far-scene layers.
- Tight camera near/far planes for the current layer.
- `reversedDepthBuffer` if supported and appropriate.
- `logarithmicDepthBuffer` only when necessary; Three.js notes performance tradeoffs because it can disable early fragment tests.

Perspective camera near plane matters. Do not set near to `0.0001` and far to `1e12` unless you enjoy z-fighting.

## Optimization Pipeline

Keep two asset versions:

- Source: Blender/Substance/high-quality editable files.
- Delivery: optimized GLB for runtime.

Inspection:

```bash
gltf-transform inspect ship.glb
```

Common optimization pass:

```bash
gltf-transform optimize ship.src.glb ship.runtime.glb \
  --compress meshopt \
  --texture-compress webp
```

For production texture memory, evaluate KTX2/BasisU. If you use KTX2, wire `KTX2Loader` into `GLTFLoader`. If you use Draco, wire `DRACOLoader`. If you use meshopt, wire `MeshoptDecoder`.

Measure:

- Draw calls
- Texture memory
- GPU time
- Shader program count
- Load/decode time
- Visual difference close-up and in motion

Compression can damage normal maps, smooth gradients, emissive masks, and UI decals. Inspect after optimization.

## Loader Wiring

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();

const ktx2 = new KTX2Loader()
  .setTranscoderPath('/basis/')
  .detectSupport(renderer);
loader.setKTX2Loader(ktx2);

const draco = new DRACOLoader().setDecoderPath('/draco/');
loader.setDRACOLoader(draco);

loader.setMeshoptDecoder(MeshoptDecoder);

const gltf = await loader.loadAsync('/models/ship.runtime.glb');
scene.add(gltf.scene);
```

Only register decoders you actually need. Keep decoder paths and Three.js version aligned.

## Runtime Debug UI

Add a hidden developer panel for model quality. Minimum controls:

- Renderer tone mapping mode.
- Exposure.
- Environment intensity.
- Environment rotation.
- Sun intensity.
- Rim intensity.
- Bloom strength/radius/threshold.
- Normal scale multiplier.
- Roughness override.
- Metalness override.
- Texture mip/anisotropy toggle.
- Show UV debug material.
- Show normal debug material.
- Show roughness/metalness/AO maps.
- Freeze camera at known comparison angles.

This turns subjective "looks bad" into specific failures.

## What I Would Do First

1. Pick one hero ship.
2. Open it in Blender and inspect bevels, normals, UVs, maps, and scale cues.
3. Export GLB.
4. Compare it in a glTF viewer.
5. Build the hero Three.js test scene.
6. Add PMREM environment separate from visible background.
7. Tune tone mapping/exposure/env/sun.
8. Add bloom only for emissive maps.
9. Add debug UI.
10. Only then bring the asset into the actual game world.

If the hero ship cannot look good in a controlled scene, the game scene will not save it. If it does look good in the hero scene, then the remaining work is integration: scale, lighting layers, postprocessing, performance, and camera composition.

