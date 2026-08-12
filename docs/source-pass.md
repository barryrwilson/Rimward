# Three.js Space Simulator Model Quality - Source Pass

Accessed: 2026-08-11

Scope: Source-backed implementation notes for making imported 3D models look excellent in a Three.js space simulator. Sources prioritized: Three.js docs/manual/examples, Khronos glTF/PBR docs and specs, and primary asset optimization docs.

## Key Sources

- Three.js `MeshStandardMaterial`: https://threejs.org/docs/pages/MeshStandardMaterial.html
- Three.js `MeshPhysicalMaterial`: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Three.js `WebGLRenderer`: https://threejs.org/docs/pages/WebGLRenderer.html
- Three.js `Texture`: https://threejs.org/docs/pages/Texture.html
- Three.js `Scene`: https://threejs.org/docs/pages/Scene.html
- Three.js `PMREMGenerator`: https://threejs.org/docs/pages/PMREMGenerator.html
- Three.js `RoomEnvironment`: https://threejs.org/docs/pages/RoomEnvironment.html
- Three.js `GLTFLoader`: https://threejs.org/docs/pages/GLTFLoader.html
- Three.js `KTX2Loader`: https://threejs.org/docs/pages/KTX2Loader.html
- Three.js `DRACOLoader`: https://threejs.org/docs/pages/DRACOLoader.html
- Three.js examples index, glTF material/extension demos: https://threejs.org/examples/
- Three.js manual, lights: https://threejs.org/manual/en/lights.html
- Khronos glTF PBR overview: https://www.khronos.org/gltf/pbr/
- Khronos glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- Khronos glTF material schema: https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/schema/material.schema.json
- Khronos glTF pbrMetallicRoughness schema: https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/schema/material.pbrMetallicRoughness.schema.json
- Khronos `KHR_materials_clearcoat`: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md
- Khronos `KHR_materials_emissive_strength`: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
- Khronos `KHR_texture_basisu`: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md
- glTF Transform CLI: https://gltf-transform.dev/cli
- glTF Transform overview: https://gltf-transform.dev/
- glTF Transform `textureCompress`: https://gltf-transform.dev/modules/functions/functions/textureCompress
- glTF Transform `meshopt`: https://gltf-transform.dev/modules/functions/functions/meshopt
- glTF Transform `EXTMeshoptCompression`: https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression
- glTF Transform `KHRTextureBasisu`: https://gltf-transform.dev/modules/extensions/classes/KHRTextureBasisu
- glTF Transform `Material`: https://gltf-transform.dev/modules/core/classes/Material
- meshoptimizer / gltfpack docs: https://meshoptimizer.org/gltf/
- meshoptimizer GitHub: https://github.com/zeux/meshoptimizer

## High-Value Recommendations

1. Use glTF/GLB as the model delivery format, and keep authored materials in the glTF metallic-roughness PBR workflow.
   - `GLTFLoader` is the official Three.js loader for glTF 2.0 and supports major PBR extensions including clearcoat, emissive strength, transmission, iridescence, anisotropy, specular, IOR, volume, texture transform, Draco, meshopt, and KTX2/BasisU.
   - Khronos positions glTF PBR around `pbrMetallicRoughness`; base color, metallic, roughness, normal, occlusion, and emissive maps are the core material vocabulary. Use that vocabulary in Blender/Substance/source DCC, not custom Three.js-only shader values, unless the asset is genuinely special.

2. Start every hero ship/station/planet material from `MeshStandardMaterial` semantics; use `MeshPhysicalMaterial` only for surfaces that need it.
   - `MeshStandardMaterial` is Three.js' standard PBR material, with roughness/metalness and PMREM-backed environment reflections.
   - `MeshPhysicalMaterial` adds anisotropy, clearcoat, iridescence, transmission, advanced reflectivity, sheen, IOR, dispersion, and thickness, but Three.js documents that it has higher per-pixel cost. Reserve it for cockpit glass, glossy painted hull panels, solar panels, carbon fiber, coated ceramic, thin glass, holographic coatings, or specialty alien materials.
   - For space hardware: metals should generally be metallic with varied roughness; painted hulls should usually be non-metallic with clearcoat only where the asset calls for coated paint; cloth/insulation can use sheen if supported by the pipeline.

3. Treat image-based lighting as mandatory for PBR, even in space.
   - Three.js says `MeshStandardMaterial.envMap` is internally preprocessed with `PMREMGenerator` for physically correct rendering, and `PMREMGenerator` provides roughness-dependent blurred radiance lookup. `MeshPhysicalMaterial` docs explicitly recommend always specifying an environment map for best results.
   - In a space sim, a black starfield is not enough for PBR. Metal and glossy paint need bright environment features to reflect. Use a curated HDR/EXR environment, a PMREM from a procedural environment scene, or a local cube/equirect map containing sun/planet/rim-light features. Keep the visual starfield background separate if needed.
   - Use `Scene.environment` for shared PBR lighting, and control `Scene.environmentIntensity` / `Scene.environmentRotation` separately from `Scene.background`, `backgroundIntensity`, and `backgroundBlurriness`.

4. Use directional/key light design, not flat ambient light.
   - Three.js manual warns `AmbientLight` has no direction and makes shapes look flat. For space, prefer a dominant `DirectionalLight` for the sun, optional low-intensity hemisphere/fill for readability, and emissive materials for engines/windows. Let the environment map provide broad specular context.
   - Hard-edged silhouettes, rim highlights, and strong contrast are visually appropriate in space; avoid washing everything in ambient.

5. Set modern renderer output deliberately.
   - `WebGLRenderer.outputColorSpace` defaults to `SRGBColorSpace`.
   - `WebGLRenderer.toneMapping` defaults to `NoToneMapping`; for HDR environments, emissive bloom, and sunlit ships, set a tone mapping mode intentionally, then tune `toneMappingExposure`. Current Three.js docs list `ACESFilmicToneMapping`, `AgXToneMapping`, and `NeutralToneMapping` among options.
   - If using post-processing, ensure the final pass handles tone mapping / output transform correctly for the installed Three.js version. Pitfall: render targets and composers can change where output conversion happens.

6. Color-space rules are non-negotiable.
   - Three.js `Texture.colorSpace` docs: textures containing color data should be annotated with `SRGBColorSpace` or `LinearSRGBColorSpace`; default is `NoColorSpace`.
   - Three.js material docs: `map` and `emissiveMap` are color data and are typically `SRGBColorSpace`; `envMap` and `lightMap` are luminance/illuminance data and commonly `LinearSRGBColorSpace` for HDR/EXR; many non-color maps default to `NoColorSpace`.
   - glTF schemas specify non-color maps as linear data: normal texture encodes tangent-space normals with linear transfer; metallic-roughness texture stores roughness in G and metalness in B with linear transfer. Do not mark normal/roughness/metalness/occlusion as sRGB.
   - Practical pitfall: double-gamma or missing sRGB annotation makes models look washed out, too dark, or unlike Blender.

7. Put material variation into texture maps, not uniform sliders.
   - "Good" spacecraft surfaces need per-pixel variation: scratches, panel wear, decals, oil/grime, exposed metal, micro-normal detail, roughness breakup, and localized emissive windows/thrusters.
   - Metallic/roughness packing: glTF metallic-roughness texture samples roughness from G and metalness from B; unused channels must not be assumed meaningful. A common authoring mistake is exporting separate maps but wiring channels incorrectly.
   - Roughness is especially important in space: perfectly smooth metal often looks like chrome/plastic unless the environment is carefully designed. Use roughness variation to catch sun rims and broad reflections.

8. Use glTF extensions selectively for "excellent" materials.
   - `KHR_materials_clearcoat`: protective/gloss layer over base material; good for painted ship hulls, carbon fiber, polished helmets, high-end probes. Khronos describes clearcoat as layered on top of existing glTF material.
   - `KHR_materials_emissive_strength`: raises emissive beyond the core [0,1] clamp; Khronos says it can hint renderers to enable bloom. Good for engines, nav lights, station windows, UI strips, plasma conduits.
   - `KHR_texture_basisu`: KTX2/Basis Universal textures for smaller transmission and lower GPU memory; Three.js needs `KTX2Loader` registered with `GLTFLoader`.
   - `KHR_materials_transmission`/volume/IOR: use for cockpit glass and canopy materials, but expect higher render cost and extra tuning.

9. Optimize models as an asset pipeline step, then wire matching loaders.
   - glTF Transform CLI supports `inspect`, `optimize`, `draco`, `meshopt`, resizing, WebP, and KTX2/BasisU workflows. Its docs warn `optimize` defaults may not be ideal for all scenes; inspect first and customize.
   - Suggested review loop:
     - `gltf-transform inspect input.glb`
     - `gltf-transform optimize input.glb output.glb --compress meshopt --texture-compress webp` for broad web compatibility and fast iteration, or KTX2/BasisU (`uastc` / `etc1s`) for GPU memory savings once the loader path is ready.
     - Compare size, visual quality, load time, draw calls, texture memory, and shader variant count before/after.
   - glTF Transform `Material` docs note GPU draw calls typically rise with primitive/material count; reuse materials where possible. Texture atlasing and vertex colors can vary appearance while sharing material.
   - glTF Transform `meshopt` applies `EXT_meshopt_compression`, covering geometry, morph targets, and animation. `EXTMeshoptCompression` docs describe meshopt as lightweight, fast runtime decompression; if textures dominate size, pair it with texture compression.
   - `DRACOLoader` docs: Draco can significantly shrink compressed geometry but adds client decode time. Meshopt is often preferable for runtime loading speed, but validate on target devices.
   - gltfpack is an opinionated full-scene optimizer that reduces download size and improves loading/rendering speed; docs say native binaries are recommended over npm for large files, speed, and texture compression.

10. Precompile and monitor runtime cost.
   - `WebGLRenderer.compile()` and `compileAsync()` can precompile materials after scene lighting/environment are configured; `compileAsync()` uses `KHR_parallel_shader_compile` where available to avoid first-frame stalls.
   - Monitor `renderer.info`: geometries, textures, draw calls, triangles, shader programs. For a space sim, draw calls and texture memory usually limit scale before triangle count alone.

## Three.js Loader Wiring Notes

- If assets use KTX2/BasisU: create `KTX2Loader`, set transcoder path, call `detectSupport(renderer)`, then `gltfLoader.setKTX2Loader(ktx2Loader)` before loading. Three.js docs say `setKTX2Loader` is required for KTX2 compressed textures.
- If assets use Draco: instantiate `DRACOLoader`, set decoder path, then `gltfLoader.setDRACOLoader(dracoLoader)`. Three.js docs say compressed geometry is smaller but costs decode time.
- If assets use meshopt: import `MeshoptDecoder` from Three.js examples libs and call `gltfLoader.setMeshoptDecoder(MeshoptDecoder)`.
- Keep decoder versions aligned with the installed Three.js release. Mismatched loaders/decoders are a common source of opaque loading failures.

## Space-Sim-Specific Material Playbook

- Hero spacecraft hull:
  - Base: glTF metallic-roughness maps, normal map, AO where useful.
  - Non-metal painted panels: metalness near 0, roughness varied, optional clearcoat for painted/glossy areas.
  - Bare metal panels: metalness high, roughness varied by panel and wear; avoid uniform mirror surfaces.
  - Add decals and panel lines in base color/normal/roughness, not geometry everywhere.

- Engines, windows, antennas, sensors:
  - Use emissive maps and `KHR_materials_emissive_strength`; pair with bloom/postprocessing, but keep emissive materials from lighting the whole scene unless actual lights are needed.
  - Engine cones/nozzles benefit from rough metal + emissive core + rim/key light; do not rely on emissive alone for form.

- Cockpit glass / visors:
  - Use `MeshPhysicalMaterial` / glTF transmission, IOR, roughness, and thickness/volume only where close-up quality warrants it.
  - For distant ships, fake glass with opaque dark material + clearcoat/specular can look better and cost less.

- Planets/asteroids:
  - Planets often need custom shader or layered materials beyond generic glTF PBR: day/night maps, atmospheric scattering, clouds, terminator control. Still apply renderer color management and HDR/tone mapping rules.
  - Asteroids: non-metallic, high roughness, strong normal/displacement baked into normal maps, varied albedo; use low ambient and sharp sun key for silhouette.

- Stations/interiors visible through windows:
  - Emissive window masks and bloom sell scale. Keep window emissive strength varied; perfect repeating rectangles look artificial.
  - Use material reuse/atlasing aggressively to control draw calls.

## Common Pitfalls

- Black environment, black reflections: PBR metals look dead in a pure-black scene. Add controlled HDR/PMREM reflection sources even if the background is deep space.
- Too much ambient: flat fill destroys spaceship form. Ambient should rescue readability, not replace sun/environment lighting.
- Wrong color spaces: base color/emissive as linear or roughness/normal as sRGB will break the look.
- Uniform roughness/metalness: physically based does not mean visually rich. The maps need authored variation.
- Overusing `MeshPhysicalMaterial`: clearcoat/transmission/iridescence are expensive per pixel. Use close-up LODs or material variants where possible.
- Compression without visual QA: texture compression can introduce block artifacts in smooth gradients, normal maps, UI decals, and emissive masks. Inspect close-up and at motion.
- Optimizing before final material authoring: mesh/material merging can complicate later edits. Keep source assets separate from delivery GLBs.
- Forgetting loader prerequisites: KTX2/Draco/meshopt GLBs need the corresponding Three.js loader/decoder registered before `GLTFLoader.load()`.
- Transparent glass sorting: alpha-blended transparency can sort incorrectly; use transmission/opaque fakes strategically.
- Scale/depth precision: huge space scenes can strain depth precision. Three.js `WebGLRenderer` offers `logarithmicDepthBuffer` and `reversedDepthBuffer`, but docs note requirements/tradeoffs; also consider origin rebasing and separate near/far scene layers.

## Minimal Renderer/Scene Baseline To Validate

```js
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // or AgX/Neutral, choose by art direction.
renderer.toneMappingExposure = 1.0;

scene.environment = pmremTexture; // HDR/EXR or PMREM from scene.
scene.environmentIntensity = 1.0;

const sun = new THREE.DirectionalLight(0xffffff, 3.0);
scene.add(sun);
```

Notes:
- Tone mapping choice is art direction; source docs only establish the available renderer controls and defaults.
- Environment must be in place before `renderer.compile()` / `compileAsync()` if precompiling.

