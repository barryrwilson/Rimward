import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeOrganicVeinTexture } from './organic.js';
import {
  SWIM_IDLE_HZ,
  SWIM_CRUISE_HZ,
  cadenceFor,
  classCruise,
} from '../game/living-cadence.js';
import { gaitFor } from '../game/living-gait.js';

export { SWIM_IDLE_HZ, SWIM_CRUISE_HZ };

export const NPC_FACTIONS = Object.freeze([
  'veridian', 'ferrous', 'freehold', 'redledger', 'gilded', 'beautiful',
  'unknowables', 'assembly', 'congregation', 'lamplighter', 'independent', 'hollow',
]);
export const NPC_CLASSES = Object.freeze(['light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter']);

const ASSET_ROOT = '/assets/ships';
const MATERIAL_ROOT = `${ASSET_ROOT}/materials`;
const FALLBACK_FACTION = 'independent';
const FALLBACK_CLASS = 'light';
const templatePromises = new Map();
const materialPromises = new Map();
const templates = new Map();
const materialSets = new Map();
const instances = new Map();

export const NPC_SHIP_ASSETS = Object.freeze(Object.fromEntries(
  NPC_FACTIONS.flatMap((faction) => NPC_CLASSES.map((classKey) => {
    const lods = classKey === 'freighter' ? ['lod0', 'lod1', 'lod2', 'lod3'] : ['lod0', 'lod1', 'lod2'];
    return [`${faction}:${classKey}`, Object.freeze({
      lods: Object.freeze(lods.map((lod) => `${ASSET_ROOT}/${faction}/${classKey}/${lod}.glb`)),
      materials: Object.freeze({
        trader: `${MATERIAL_ROOT}/${faction}/trader`,
        pirate: `${MATERIAL_ROOT}/${faction}/pirate`,
      }),
      engineNode: 'RIMWARD_ENGINE_GLOW',
      idleClip: faction === 'beautiful' || faction === 'unknowables' ? 'idle' : null,
    })];
  })),
));

let assetFileReader = null;
const glowGeometry = new THREE.SphereGeometry(1, 12, 8);
let renderer = null;
let ktx2Loader = null;

// Beautiful NPC GPU swim. Matches player idle→cruise Hz (ship.js) without a
// CPU vertex loop. Per-instance uniform objects: shared module uniforms would
// lock every Beautiful NPC to one speed. Hz/sweep scales live in living-cadence.js.
// Gait axis mix lives in living-gait.js (floats, one program).
const SWIM_PROGRAM_KEY = 'rimward-beautiful-swim-gait';

function makeSwimUniforms() {
  return {
    uSwimTime: { value: 0 },
    uSwimAmp: { value: 1 },
    uSwimHz: { value: SWIM_IDLE_HZ },
    uSwimSweep: { value: 1 },
    uSwimSpineX: { value: 1 },
    uSwimFlapY: { value: 1 },
    uSwimKickZ: { value: 0 },
    uSwimRadial: { value: 0 },
  };
}

function injectSwim(uniforms) {
  return (shader) => {
    shader.uniforms.uSwimTime = uniforms.uSwimTime;
    shader.uniforms.uSwimAmp = uniforms.uSwimAmp;
    shader.uniforms.uSwimHz = uniforms.uSwimHz;
    shader.uniforms.uSwimSweep = uniforms.uSwimSweep;
    shader.uniforms.uSwimSpineX = uniforms.uSwimSpineX;
    shader.uniforms.uSwimFlapY = uniforms.uSwimFlapY;
    shader.uniforms.uSwimKickZ = uniforms.uSwimKickZ;
    shader.uniforms.uSwimRadial = uniforms.uSwimRadial;
    shader.vertexShader = 'uniform float uSwimTime;\nuniform float uSwimAmp;\nuniform float uSwimHz;\nuniform float uSwimSweep;\nuniform float uSwimSpineX;\nuniform float uSwimFlapY;\nuniform float uSwimKickZ;\nuniform float uSwimRadial;\nattribute vec4 aSwim;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
{
  float swimPhase = uSwimTime * 6.28318530718 * uSwimHz;
  #ifdef USE_MORPHTARGETS
    swimPhase += morphTargetInfluences[ MORPHTARGETS_COUNT - 1 ]; // per-ship phase
  #endif
  float zn = aSwim.x;       // 0 nose -> 1 tail
  float wing = aSwim.y;    // 0 spine -> 1 tips
  float xn = aSwim.z;      // 0 spine -> 1 tip (normalized)
  float sz = aSwim.w;      // ship size for amplitude scaling
  float bodyAmp = 0.025 * sz;
  float flapAmp = 0.045 * sz;
  float lag = 1.4 * xn;    // span-wise phase lag
  float breath = 1.0 + 0.012 * uSwimAmp * sin(uSwimTime * 6.28318530718 * 0.25);
  transformed *= breath;
  float spineWave = sin(6.9 * zn - swimPhase);
  float flap = sin(swimPhase - lag);
  float kick = sin(swimPhase - 2.1 * zn);
  transformed.x += uSwimAmp * bodyAmp * zn * zn * spineWave * uSwimSpineX;
  transformed.y += uSwimAmp * flapAmp * wing * flap * uSwimSweep * uSwimFlapY;
  transformed.z += uSwimAmp * bodyAmp * zn * zn * kick * uSwimKickZ;
  float pulse = 1.0 + uSwimAmp * 0.04 * uSwimRadial * sin(swimPhase);
  transformed *= pulse;
}`
    );
  };
}

function cloneSwimMaterials(materials, uniforms, privateMaterials) {
  const compile = injectSwim(uniforms);
  const wrap = (material) => {
    const cloned = material.clone();
    cloned.onBeforeCompile = compile;
    cloned.customProgramCacheKey = () => SWIM_PROGRAM_KEY;
    cloned.userData.swimUniforms = uniforms;
    cloned.needsUpdate = true;
    // Instance-owned clone: registered (even when this slot is never bound to
    // a mesh) so releaseShipAsset can dispose every private copy exactly once.
    privateMaterials?.add(cloned);
    return cloned;
  };
  return {
    hull: wrap(materials.hull),
    hullVC: wrap(materials.hullVC),
    emissive: wrap(materials.emissive),
    emissiveVC: wrap(materials.emissiveVC),
    field: wrap(materials.field),
    fieldVC: wrap(materials.fieldVC),
  };
}

function materialsForInstance(materials, swimUniforms, privateMaterials) {
  return swimUniforms ? cloneSwimMaterials(materials, swimUniforms, privateMaterials) : materials;
}

function canonicalFaction(faction) {
  return NPC_FACTIONS.includes(faction) ? faction : FALLBACK_FACTION;
}

function canonicalClass(classKey) {
  return NPC_CLASSES.includes(classKey) ? classKey : FALLBACK_CLASS;
}

function canonicalRole(role) {
  return role === 'pirate' ? 'pirate' : 'trader';
}

function templateKey(faction, classKey) {
  return `${canonicalFaction(faction)}:${canonicalClass(classKey)}`;
}

function materialKey(faction, role) {
  return `${canonicalFaction(faction)}:${canonicalRole(role)}`;
}

function ensureLoader() {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader().setTranscoderPath('/assets/basis/');
  }
  if (renderer) ktx2Loader.detectSupport(renderer);
  return new GLTFLoader().setKTX2Loader(ktx2Loader).setMeshoptDecoder(MeshoptDecoder);
}

function texture(path, color) {
  if (assetFileReader) return Promise.resolve(null);
  return ktx2Loader.loadAsync(path).then((value) => {
    // three.js requires NoColorSpace for non-colour data (normal, ORM); only
    // base colour and emissive carry an sRGB transfer function.
    // https://threejs.org/docs/pages/MeshStandardMaterial.html
    value.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    value.flipY = false;
    return value;
  });
}

function loadMaterials(faction, role) {
  const key = materialKey(faction, role);
  if (!materialPromises.has(key)) {
    const [resolvedFaction, resolvedRole] = key.split(':');
    const path = `${MATERIAL_ROOT}/${resolvedFaction}/${resolvedRole}`;
    const maps = assetFileReader
      ? Promise.resolve([null, null, null, null])
      : Promise.all([
        texture(`${path}/basecolor.ktx2`, true),
        texture(`${path}/normal.ktx2`, false),
        texture(`${path}/orm.ktx2`, false),
        texture(`${path}/emissive.ktx2`, true),
      ]);
    materialPromises.set(key, maps.then(([map, normalMap, ormMap, emissiveMap]) => {
      const hull = new THREE.MeshStandardMaterial({
        name: `RIMWARD_HULL:${key}`,
        map,
        normalMap,
        roughnessMap: ormMap,
        metalnessMap: ormMap,
        roughness: 1,
        metalness: 1,
        color: 0xffffff,
      });
      const emissive = new THREE.MeshStandardMaterial({
        name: `RIMWARD_EMISSIVE:${key}`,
        emissive: 0xffffff,
        emissiveMap,
        emissiveIntensity: 1.5,
        roughness: 0.42,
        metalness: 0.15,
      });
      const field = new THREE.MeshBasicMaterial({
        name: `RIMWARD_FIELD:${key}`,
        color: 0xffffff,
        map: emissiveMap,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const hullVC = hull.clone();
      hullVC.vertexColors = true;
      const emissiveVC = emissive.clone();
      emissiveVC.vertexColors = true;
      const fieldVC = field.clone();
      fieldVC.vertexColors = true;
      // Player living hull uses makeVeinTexture (teal + magenta). Beautiful
      // NPC GLBs get the same family on the hull emissive map, not 3D beads.
      if (resolvedFaction === 'beautiful') {
        let veinTex = null;
        try {
          const probe = typeof document !== 'undefined'
            ? document.createElement('canvas') : null;
          if (probe && typeof probe.getContext === 'function' && probe.getContext('2d')) {
            veinTex = makeOrganicVeinTexture({
              seed: 1337,
              colors: ['#46ffe0', '#4fe0c8', '#c86bff'],
              count: 42,
            });
            veinTex.wrapT = THREE.RepeatWrapping;
          }
        } catch (_) {
          veinTex = null;
        }
        if (veinTex) {
          for (const mat of [hull, hullVC]) {
            mat.emissive = new THREE.Color(0xffffff);
            mat.emissiveMap = veinTex;
            mat.emissiveIntensity = 0.85;
          }
        }
      }
      // Beautiful swim inject is per instance (cloneSwimMaterials). Shared
      // materials stay static so one NPC's speed cannot drive the fleet.
      const set = { hull, hullVC, emissive, emissiveVC, field, fieldVC };
      materialSets.set(key, set);
      return set;
    }));
  }
  return materialPromises.get(key);
}

function assertSelfContainedGlb(bytes, path) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 20 || view.getUint32(0, true) !== 0x46546C67 || view.getUint32(4, true) !== 2) {
    throw new Error(`Invalid GLB asset: ${path}`);
  }
  let offset = 12;
  let json = null;
  while (offset + 8 <= bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    offset += 8;
    if (offset + length > bytes.byteLength) throw new Error(`Truncated GLB asset: ${path}`);
    if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(bytes.subarray(offset, offset + length)));
    offset += length;
  }
  if (!json) throw new Error(`GLB JSON chunk missing: ${path}`);
  if (json.buffers?.some((buffer) => typeof buffer.uri === 'string') || json.images?.some((image) => typeof image.uri === 'string')) {
    throw new Error(`External GLB resource is not allowed in asset tests: ${path}`);
  }
}

async function loadTemplate(faction, classKey, lod) {
  const key = `${templateKey(faction, classKey)}:${lod}`;
  if (!templatePromises.has(key)) {
    const [resolvedFaction, resolvedClass] = templateKey(faction, classKey).split(':');
    const path = `${ASSET_ROOT}/${resolvedFaction}/${resolvedClass}/${lod}.glb`;
    const loader = ensureLoader();
    const request = assetFileReader
      ? assetFileReader(path).then((data) => {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        assertSelfContainedGlb(bytes, path);
        return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), `${ASSET_ROOT}/${resolvedFaction}/${resolvedClass}/`);
      })
      : loader.loadAsync(path);
    templatePromises.set(key, request.then((template) => {
      templates.set(key, template);
      // Beautiful Ones swim data: per-vertex aSwim attribute and dummy morph
      // for phase offset. Only needed once per cached template.
      if (resolvedFaction === 'beautiful') {
        template.scene.traverse((node) => {
          if (!node.isMesh || !node.geometry?.attributes.position) return;
          const geo = node.geometry;
          if (geo.attributes.aSwim) return; // Already processed
          const pos = geo.attributes.position;
          const count = pos.count;
          const aSwim = new THREE.BufferAttribute(new Float32Array(count * 4), 4);
          // Compute bounding box for this geometry
          const bbox = new THREE.Box3().setFromBufferAttribute(pos);
          const zMin = bbox.min.z, zMax = bbox.max.z, zSpan = zMax - zMin;
          const xMax = Math.max(Math.abs(bbox.min.x), Math.abs(bbox.max.x));
          const size = Math.max(zSpan, xMax * 2);
          for (let i = 0; i < count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            const zNorm = zSpan > 0 ? (z - zMin) / zSpan : 0.5;
            const xAbs = Math.abs(x);
            const xNorm = xMax > 0 ? xAbs / xMax : 0;
            const wingness = Math.pow(Math.min(xNorm, 1), 1.5);
            aSwim.setXYZW(i, zNorm, wingness, xNorm, size);
          }
          geo.attributes.aSwim = aSwim;
          // Add dummy morph for phase offset if not present
          if (!geo.morphAttributes.position || geo.morphAttributes.position.length === 0) {
            const dummy = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
            geo.morphAttributes.position = [dummy];
            geo.morphTargetsRelative = true;
            // Update mesh's morphTargetInfluences array
            node.updateMorphTargets();
          }
        });
      }
      return template;
    }));
  }
  return templatePromises.get(key);
}

function bindMaterials(root, materials) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    const material = Array.isArray(object.material) ? object.material[0] : object.material;
    const hasVC = !!object.geometry?.attributes.color;
    if (material?.name === 'RIMWARD_HULL') object.material = hasVC ? materials.hullVC : materials.hull;
    else if (material?.name === 'RIMWARD_EMISSIVE') object.material = hasVC ? materials.emissiveVC : materials.emissive;
    else if (material?.name === 'RIMWARD_FIELD') object.material = hasVC ? materials.fieldVC : materials.field;
  });
}

function removeEngineNode(root) {
  const engine = root.getObjectByName('RIMWARD_ENGINE_GLOW');
  if (engine?.parent) engine.parent.remove(engine);
  return engine;
}

function proxyFor(root) {
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  return {
    rx: Math.max(size.x * 0.62, 0.1),
    ry: Math.max(size.y * 0.62, 0.1),
    halfLen: Math.max(size.z * 0.67 - Math.max(size.x * 0.62, size.y * 0.62), 0.1),
  };
}

function addLevel(instance, lod, template, materials) {
  const visual = cloneSkinned(template.scene);
  bindMaterials(visual, materialsForInstance(materials, instance.userData.swimUniforms, instance.userData.privateMaterials));
  removeEngineNode(visual);
  // Beautiful Ones: set swim phase on the new LOD meshes
  if (instance.userData.swimPhase !== undefined) {
    visual.traverse((node) => {
      if (node.isMesh && node.morphTargetInfluences) {
        const count = node.morphTargetInfluences.length;
        if (count > 0) node.morphTargetInfluences[count - 1] = instance.userData.swimPhase;
      }
    });
  }
  instance.userData.lod.addLevel(visual, lod.distance, lod.hysteresis);
}

function updateDistanceBands(instance, camera) {
  const lod = instance.userData.lod;
  const radius = instance.userData.radius;
  if (!camera?.isPerspectiveCamera || !radius) return;
  const pixelsPerUnit = window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  const distanceFor = (pixels) => (radius * 2 * pixelsPerUnit) / pixels;
  const levels = lod.levels;
  if (levels[1]) levels[1].distance = distanceFor(240);
  if (levels[2]) levels[2].distance = distanceFor(80);
  if (levels[3]) levels[3].distance = distanceFor(24);
}

function attachLowerLods(faction, classKey, role) {
  const key = `${templateKey(faction, classKey)}:${canonicalRole(role)}`;
  const active = instances.get(key);
  if (!active) return;
  const lodNames = canonicalClass(classKey) === 'freighter' ? ['lod1', 'lod2', 'lod3'] : ['lod1', 'lod2'];
  for (const lodName of lodNames) {
    Promise.all([loadTemplate(faction, classKey, lodName), loadMaterials(faction, role)]).then(([template, materials]) => {
      for (const instance of active) {
        if (!instance.parent || instance.userData.released || instance.userData.loadedLods?.has(lodName)) continue;
        const level = lodName === 'lod1' ? { distance: 1, hysteresis: 0.1 } : lodName === 'lod2' ? { distance: 2, hysteresis: 0.1 } : { distance: 3, hysteresis: 0.1 };
        addLevel(instance, level, template, materials);
        instance.userData.loadedLods.add(lodName);
      }
    }).catch((error) => console.error(`Ship LOD load failed for ${key}:${lodName}`, error));
  }
}

/** Configure KTX2 decoding for a renderer before its first NPC asset load. */
export function configureShipAssets(nextRenderer) {
  renderer = nextRenderer;
  if (ktx2Loader) ktx2Loader.detectSupport(renderer);
}

/**
 * Configure an injected binary reader for Node asset-contract tests.
 * Production callers must leave this unset, so all runtime asset fetches use
 * the browser GLTFLoader and KTX2Loader paths.
 */
export function configureShipAssetFileReader(nextReader = null) {
  instances.clear();
  assetFileReader = nextReader;
  templatePromises.clear();
  materialPromises.clear();
  templates.clear();
  materialSets.clear();
}

/** Resolve the live LOD0 template and role materials without creating a placeholder. */
export async function primeShipAsset(faction, classKey, role = 'trader') {
  await Promise.all([loadTemplate(faction, classKey, 'lod0'), loadMaterials(faction, role)]);
  attachLowerLods(faction, classKey, role);
}

export function isShipAssetReady(faction, classKey, role = 'trader') {
  return templates.has(`${templateKey(faction, classKey)}:lod0`) && materialSets.has(materialKey(faction, role));
}

/** Build a new NPC visual synchronously after primeShipAsset resolves. */
export function buildShipAsset(classKey, faction, role = 'trader') {
  const resolvedFaction = canonicalFaction(faction);
  const resolvedClass = canonicalClass(classKey);
  const resolvedRole = canonicalRole(role);
  const template = templates.get(`${resolvedFaction}:${resolvedClass}:lod0`);
  const resolvedMaterials = materialSets.get(`${resolvedFaction}:${resolvedRole}`);
  if (!template || !resolvedMaterials) throw new Error(`NPC asset not primed: ${resolvedFaction}:${resolvedClass}:${resolvedRole}`);
  const root = new THREE.Group();
  root.name = 'npc-ship-asset';
  const lod = new THREE.LOD();
  const visual = cloneSkinned(template.scene);
  const swimUniforms = resolvedFaction === 'beautiful' ? makeSwimUniforms() : null;
  // Beautiful clones its swim materials per LOD level so each ship owns its
  // uniforms; the set lets releaseShipAsset free every clone, bound or not.
  const privateMaterials = swimUniforms ? new Set() : null;
  const boundMaterials = materialsForInstance(resolvedMaterials, swimUniforms, privateMaterials);
  bindMaterials(visual, boundMaterials);
  const engine = removeEngineNode(visual);
  lod.addLevel(visual, 0, 0.1);
  root.add(lod);
  const glow = new THREE.Group();
  glow.name = 'engine-effect';
  if (engine) {
    // The drive flare is additive light, not an opaque bead. RIMWARD_FIELD is the
    // additive slot; the opaque emissive material rendered it as a solid pearl.
    engine.material = engine.geometry?.attributes.color ? boundMaterials.fieldVC : boundMaterials.field;
    glow.add(engine);
  } else {
    glow.add(new THREE.Mesh(glowGeometry, boundMaterials.field));
  }
  root.add(glow);
  root.userData.proxy = proxyFor(visual);
  root.userData.glow = glow;
  root.userData.shipVisual = lod;
  root.userData.lod = lod;
  root.userData.radius = new THREE.Box3().setFromObject(visual).getBoundingSphere(new THREE.Sphere()).radius;
  root.userData.loadedLods = new Set(['lod0']);
  root.userData.classKey = resolvedClass;
  const idle = template.animations.find((clip) => clip.name === 'idle');
  if (idle) {
    const mixer = new THREE.AnimationMixer(visual);
    mixer.clipAction(idle).play();
    root.userData.mixer = mixer;
  }
  // Beautiful Ones swim phase: per-ship random phase offset (visual only).
  if (swimUniforms) {
    const gait = gaitFor(resolvedClass);
    swimUniforms.uSwimSpineX.value = gait.spineX;
    swimUniforms.uSwimFlapY.value = gait.flapY;
    swimUniforms.uSwimKickZ.value = gait.kickZ;
    swimUniforms.uSwimRadial.value = gait.radial;
    root.userData.swimUniforms = swimUniforms;
    root.userData.privateMaterials = privateMaterials;
    root.userData.swimPhase = Math.random() * Math.PI * 2;
    // Set morphTargetInfluences on all meshes (visual + glow engine)
    root.traverse((node) => {
      if (node.isMesh && node.morphTargetInfluences) {
        const count = node.morphTargetInfluences.length;
        if (count > 0) node.morphTargetInfluences[count - 1] = root.userData.swimPhase;
      }
    });
  }
  const key = `${resolvedFaction}:${resolvedClass}:${resolvedRole}`;
  root.userData.assetInstanceKey = key;
  if (!instances.has(key)) instances.set(key, new Set());
  instances.get(key).add(root);
  attachLowerLods(resolvedFaction, resolvedClass, resolvedRole);
  return root;
}

/** Release a live ship: unregister it and dispose its instance-owned materials. */
export function releaseShipAsset(root) {
  root.userData.mixer?.stopAllAction();
  if (!root.userData.released) {
    root.userData.released = true;
    // Only per-instance swim clones are private. Shared templates, geometries,
    // textures, and the cached base material sets stay alive for other ships.
    const privateMaterials = root.userData.privateMaterials;
    if (privateMaterials) {
      for (const material of privateMaterials) material.dispose();
      privateMaterials.clear();
    }
  }
  const key = root.userData.assetInstanceKey;
  if (!key) return;
  const active = instances.get(key);
  active?.delete(root);
  if (active?.size === 0) instances.delete(key);
}

export function updateShipAsset(object, elapsed, reducedMotion = false, camera, speed) {
  const mixer = object.userData.mixer;
  if (mixer && !reducedMotion) mixer.setTime(elapsed);
  if (camera) {
    updateDistanceBands(object, camera);
    object.userData.lod?.update(camera);
  }
  const uniforms = object.userData.swimUniforms;
  if (!uniforms) return;
  const spd = Number.isFinite(speed) ? Math.max(speed, 0) : 0;
  const cadence = cadenceFor(object.userData.classKey);
  const cruise = classCruise(object.userData.classKey);
  const speedNorm = Math.min(spd / cruise, 1);
  uniforms.uSwimTime.value = elapsed;
  uniforms.uSwimAmp.value = reducedMotion ? 0 : 1;
  uniforms.uSwimHz.value =
    (SWIM_IDLE_HZ + (SWIM_CRUISE_HZ - SWIM_IDLE_HZ) * speedNorm) * cadence.hzScale;
  uniforms.uSwimSweep.value = reducedMotion ? 0 : cadence.sweepScale;
  const gait = gaitFor(object.userData.classKey);
  uniforms.uSwimSpineX.value = gait.spineX;
  uniforms.uSwimFlapY.value = gait.flapY;
  uniforms.uSwimKickZ.value = gait.kickZ;
  uniforms.uSwimRadial.value = gait.radial;
}
