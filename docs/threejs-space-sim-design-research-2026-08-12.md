---
title: "Three.js Space Sim Design Research"
research_date: 2026-08-12
status: final
scope: "Web-based space-sim rendering, asset strategy, and review of the attached 3DRT free model collection"
source_mode: "Internet research using primary technical sources, plus local inspection of the supplied archive"
---

# Three.js Space Sim Design Research

## Executive conclusion

Using simpler geometry with strong texture and material work is generally the right direction for a Three.js space sim. The important qualification is that geometry must still carry the silhouette, large hull transitions, docking surfaces, engines, weapon profiles, and anything visible during close flybys. Textures cannot repair an obviously angular outline or create convincing parallax, collisions, or shadows.

The recommended balance is:

- Low-to-mid-poly structural models.
- One or two materials per ordinary ship.
- PBR texture detail using base color, normal, packed occlusion/roughness/metalness, and emissive maps.
- Geometry reserved for silhouette-changing or gameplay-relevant features.
- Multiple levels of detail, instancing, and compressed textures.
- Restrained real-time lighting, shadows, transparency, and post-processing.

The attached models validate the basic texture-led approach, but their very low geometry and legacy diffuse-only materials make them better references, background assets, or prototypes than modern close-up hero assets.

## Findings from the attached collection

The supplied `Free-game-models-collection.zip` contains `.3DS` and `.max` source models, preview images, and JPG textures. The `.3DS` files were parsed with Three.js to inspect their geometry and material groups.

| Asset category | Triangle count | Material groups | Texture strategy |
|---|---:|---:|---|
| Fighters and shuttles | 104–183 | 1–2 | One 512×512 JPG per model |
| Space station | 248 | 1 | One 256×256 JPG |
| Buildings | 148–371 | 4–6 | Shared 128×128 JPGs |
| Hovercar | 1,442 | 4 | One 512×512 JPG |

These models are extremely lightweight. Painted panel lines, seams, grime, warning markings, windows, and illuminated accents provide most of their visual information.

The important weakness is material count. A 150-triangle structure split across five materials can require approximately five rendering groups or draw calls. That may perform worse than a somewhat denser model using one texture atlas and one material. WebGL guidance emphasizes batching and texture atlases because texture and material changes break batches. See [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) and [Three.js: Optimizing Lots of Objects](https://threejs.org/manual/en/optimize-lots-of-objects.html).

The collection also represents a legacy material workflow. It provides detailed diffuse JPGs but no normal, roughness, metalness, or dedicated emissive maps. Its baked shading can work for a deliberately retro or unlit style, but it is not directly equivalent to a modern PBR asset.

## Recommended visual strategy

“Complex skins” should mean efficiently encoded material information rather than simply using very large painted textures.

For important ships and stations:

- Model the outer profile, wings, engines, turrets, landing gear, docking hardware, major hull steps, and collision-relevant features.
- Put bolts, seams, vents, shallow recesses, scratches, warning labels, paint wear, and small paneling into textures.
- Use normal maps for shallow mechanical relief.
- Pack occlusion, roughness, and metalness channels efficiently. glTF uses a metallic-roughness PBR workflow and defines channel packing for these material properties. See the [Khronos glTF material specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).
- Use emissive maps for engines, windows, navigation lights, and weapon charging effects.
- Use trim sheets or atlases across related ships and station modules.
- Add a controlled library of modular geometry—antennas, tanks, weapons, cargo pods, and sensor arrays—to produce variants without creating entirely unique models.

Suggested asset hierarchy:

- **Player or hero ship:** strongest silhouette, real geometry around the cockpit and engines, and the highest-resolution material set.
- **Nearby NPCs:** moderate geometry using the same material vocabulary and fewer unique materials.
- **Distant fleets:** aggressive LODs or impostors.
- **Debris and asteroids:** a small geometry library rendered with instancing.

Three.js includes a basic distance-switched `LOD` component with hysteresis support to reduce flicker at transition boundaries. See the [Three.js LOD documentation](https://threejs.org/docs/pages/LOD.html).

## Recommended asset pipeline

### 1. Convert legacy formats offline

Use `.GLB` or glTF for runtime delivery instead of shipping `.3DS`. Three.js recommends glTF because it is designed for compact, fast runtime asset delivery. `TDSLoader` exists, but it only supports basic geometry, UVs, materials, and textures.

- [Three.js recommended model workflow](https://threejs.org/manual/en/loading-3d-models.html)
- [Three.js TDSLoader](https://threejs.org/docs/pages/TDSLoader.html)

### 2. Optimize after export

Inspect each GLB for excessive materials, draw calls, textures, geometry, or unused data. glTF Transform can inspect, join, instance, simplify, quantize, resize textures, and apply Meshopt or Draco compression. See the [glTF Transform CLI documentation](https://gltf-transform.dev/cli).

### 3. Compare Meshopt and Draco

Three.js `GLTFLoader` supports both Meshopt and Draco compression. Draco can reduce geometry download size substantially but adds decoding cost on the client. Meshopt is designed around efficient decoding and GPU-ready mesh organization. Test both against representative ships rather than assuming that the smallest download will produce the fastest experience.

- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [meshoptimizer](https://github.com/zeux/meshoptimizer)

### 4. Use KTX2/Basis textures

JPG and PNG reduce network transfer size but normally expand significantly in GPU memory. KTX2 can be transcoded into a compressed format supported by the user’s GPU, reducing memory consumption and texture bandwidth.

- [Three.js KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html)
- [Khronos KTX](https://www.khronos.org/ktx/)

## Three.js rendering architecture

### Materials

Use `MeshStandardMaterial` as the default PBR material. Reserve `MeshPhysicalMaterial` for a small number of hero surfaces that genuinely require clearcoat, transmission, iridescence, or similar effects. The latter has a higher per-pixel cost.

- [Three.js material comparison](https://threejs.org/manual/en/materials.html)
- [MeshPhysicalMaterial documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

### Batching and instancing

- Use `InstancedMesh` for many copies of the same geometry and material, such as repeated fighters, projectiles, debris, or asteroid variants.
- Use `BatchedMesh` for different geometries sharing one material, such as a station-module or debris library.
- Merge static geometry by sector when individual movement or selection is unnecessary.
- Favor shared materials, atlases, and trim sheets over many tiny material assignments.

Both `InstancedMesh` and `BatchedMesh` are intended to reduce draw calls.

- [InstancedMesh documentation](https://threejs.org/docs/pages/InstancedMesh.html)
- [BatchedMesh documentation](https://threejs.org/docs/pages/BatchedMesh.html)

### Lighting and effects

- Use one primary directional light as the system’s sun.
- Add controlled environment or fill lighting for readable dark sides.
- Represent most engine and window lights with emissive materials, sprites, and restrained bloom instead of many real lights.
- Restrict dynamic shadow casting to nearby hero objects or important gameplay moments.
- Avoid shadow-casting point lights where possible. A point-light shadow renders the scene from six directions and is especially expensive.

See [Three.js shadow guidance](https://threejs.org/manual/en/shadows.html).

### Large-world coordinates and depth

Space simulation requires special handling because a single camera may otherwise need to cover cockpit-scale detail and astronomical distances.

- Keep simulation coordinates separate from render coordinates.
- Recenter the rendered scene around the camera using a floating-origin or sector-coordinate system.
- Make the camera `near` distance as large and `far` distance as small as the current view permits.
- Render cockpit, local space, and distant backgrounds in separate layers or passes when useful.
- Prefer reversed depth when the required extension is available.
- Treat logarithmic depth as a fallback. Three.js notes that it disables an early fragment optimization and can reduce performance.

See the [WebGLRenderer depth-buffer options](https://threejs.org/docs/pages/WebGLRenderer.html).

## Performance priorities

For this type of browser experience, the likely optimization order is:

1. Draw calls and material switches.
2. Screen resolution and post-processing.
3. Transparent particle overdraw.
4. Shadow passes.
5. Texture GPU memory.
6. Triangle count.

This is why a model’s polygon count alone is not a sufficient quality or performance metric. The attached buildings demonstrate the issue: they contain very few triangles but as many as six material groups.

Profile representative battles using `renderer.info`, particularly:

- Draw calls.
- Triangles.
- Active geometries.
- Active textures.
- Shader programs.

Three.js exposes these values for performance monitoring. Internal render resolution should also be capped instead of blindly matching the full device pixel ratio; high-density screens can multiply pixel work dramatically.

- [WebGLRenderer statistics](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js responsive rendering guidance](https://threejs.org/manual/en/responsive.html)

Budgets should be established from frame time on representative target devices rather than from a universal triangle limit. A representative benchmark should include multiple ships, particles, weapons, station geometry, UI, post-processing, and shadows—not an isolated model viewer.

## Renderer choice

For an initial production version, `WebGLRenderer` remains the conservative choice. Current Three.js documentation describes `WebGPURenderer` as the next-generation direction but still experimental, with missing features and cases where WebGL performs better. Avoid making the project heavily dependent on custom `onBeforeCompile` GLSL if migration to TSL and WebGPU is a future goal.

See [Three.js WebGPURenderer guidance](https://threejs.org/manual/en/webgpurenderer).

The current project declares and installs Three.js `0.170.0`, while the current official release is r184. Some newer APIs and naming conventions differ, so an eventual upgrade should be deliberate and reviewed against the [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) and [official releases](https://github.com/mrdoob/three.js/releases).

## Licensing warning for the attached assets

The archive appears to be 3DRT’s “Free models collection.” The publisher’s download page states that these free samples are for testing and educational purposes and cannot be used commercially.

Treat the supplied assets as references or prototypes rather than commercial shipping content unless separate permission or an applicable commercial license is obtained. See the [3DRT downloads and usage notice](https://www.3drt.com/downloads.htm).

## Final recommendation

Use the attached collection as evidence that texture-led detail can work and as a reference for efficient silhouettes. Modernize the formula for the actual game:

- Deliver GLB assets.
- Preserve strong, readable silhouettes.
- Keep ordinary ships to one or two materials.
- Use compact PBR maps and KTX2 texture compression.
- Build LODs and impostors around projected screen size.
- Instance repeated ships, projectiles, asteroids, and debris.
- Use one primary sun, controlled environment lighting, emissive engines, and restrained bloom.
- Use floating-origin rendering for large distances.
- Optimize draw calls, pixel cost, transparency, and shadows before chasing extremely low triangle counts.

The desired result is not “the fewest polygons possible.” It is the least expensive asset that still preserves the silhouette, material response, readability, and gameplay information visible at its current screen size.
