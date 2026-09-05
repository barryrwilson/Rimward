// Behavioral coverage for issue #48: releaseShipAsset must dispose every
// instance-owned Beautiful swim material clone exactly once, across all
// loaded LOD levels (including clone slots never bound to a mesh), while
// shared templates, geometries, textures, base material sets, and active
// sibling ships stay untouched.
import { readFile } from 'node:fs/promises';

const THREE = await import('three');
const {
  configureShipAssetFileReader,
  primeShipAsset,
  buildShipAsset,
  releaseShipAsset,
} = await import('../src/systems/ship-assets.js');

let fails = 0;
function pin(name, ok) {
  if (ok) { console.log(`ok — ${name}`); return; }
  fails += 1;
  console.log(`FAIL — ${name}`);
}

async function waitFor(predicate, label, timeoutMs = 20000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

// ---- Spies (installed before any asset work, restored in finally) ---------
// Material.dispose / BufferGeometry.dispose / Texture.dispose: per-object
// counts. Material.clone: identity tracking, so the private-clone set is
// observed directly instead of inferred from a hardcoded slot count.
const materialDisposes = new Map();
const geometryDisposes = new Map();
const textureDisposes = new Map();
const clones = new Set();
const original = {
  materialDispose: THREE.Material.prototype.dispose,
  geometryDispose: THREE.BufferGeometry.prototype.dispose,
  textureDispose: THREE.Texture.prototype.dispose,
  materialClone: THREE.Material.prototype.clone,
};
THREE.Material.prototype.dispose = function dispose() {
  materialDisposes.set(this, (materialDisposes.get(this) ?? 0) + 1);
  return original.materialDispose.call(this);
};
THREE.BufferGeometry.prototype.dispose = function dispose() {
  geometryDisposes.set(this, (geometryDisposes.get(this) ?? 0) + 1);
  return original.geometryDispose.call(this);
};
THREE.Texture.prototype.dispose = function dispose() {
  textureDisposes.set(this, (textureDisposes.get(this) ?? 0) + 1);
  return original.textureDispose.call(this);
};
THREE.Material.prototype.clone = function clone() {
  const cloned = original.materialClone.call(this);
  clones.add(cloned);
  return cloned;
};

const disposesOf = (map, object) => map.get(object) ?? 0;
// Swim clones are stamped with userData.swimUniforms after clone() returns,
// so filtering is deferred to assert time. Per-instance identity comes from
// the shared per-ship uniform object every clone of that ship points at.
const swimClones = () => [...clones].filter((material) => material.userData?.swimUniforms);
const clonesOf = (ship) => swimClones().filter((material) => material.userData.swimUniforms === ship.userData.swimUniforms);
const disposedSwimClones = () => swimClones().filter((material) => disposesOf(materialDisposes, material) > 0);

function attachedMaterials(root) {
  const found = new Set();
  root.traverse((node) => {
    if (!node.isMesh) return;
    const list = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of list) if (material) found.add(material);
  }
  );
  return [...found];
}

// ---- Gated asset reader ----------------------------------------------------
// Real GLB bytes from public/, but lower-LOD reads for the late-load scenario
// are deferred until the gate opens, so release-before-load is deterministic.
const readAsset = (assetPath) => readFile(new URL(`../public${assetPath}`, import.meta.url));
const pendingReads = new Map();
let gateLowerLods = false;
configureShipAssetFileReader((assetPath) => {
  const gatedPath = assetPath.startsWith('/assets/ships/beautiful/cutter/') && !assetPath.endsWith('lod0.glb');
  if (gateLowerLods && gatedPath) {
    return new Promise((resolve) => pendingReads.set(assetPath, resolve));
  }
  return readAsset(assetPath);
});
async function openGate() {
  gateLowerLods = false;
  for (const [assetPath, resolve] of pendingReads) resolve(await readAsset(assetPath));
  pendingReads.clear();
}

const holder = new THREE.Group();

try {
  // ---- Full-load release ---------------------------------------------------
  await primeShipAsset('beautiful', 'light', 'trader');
  const shipA = buildShipAsset('light', 'beautiful', 'trader');
  const shipB = buildShipAsset('light', 'beautiful', 'trader');
  holder.add(shipA, shipB);
  await waitFor(
    () => shipA.userData.loadedLods.size === 3 && shipB.userData.loadedLods.size === 3,
    'lower LOD attach for both ships',
  );

  const clonesA = clonesOf(shipA);
  const clonesB = clonesOf(shipB);
  pin('beautiful build creates private swim clones', clonesA.length > 0);
  pin('three LOD levels loaded', shipA.userData.loadedLods.size === 3);
  pin('unused clone slots exist beyond attached set',
    clonesA.length > attachedMaterials(shipA).filter((m) => m.userData?.swimUniforms).length);

  releaseShipAsset(shipA);

  pin('every private clone disposed exactly once',
    clonesA.every((material) => disposesOf(materialDisposes, material) === 1));
  const disposedSwim = disposedSwimClones();
  pin('disposed swim clones are exactly the released ship clone set',
    disposedSwim.length === clonesA.length && disposedSwim.every((material) => clonesA.includes(material)));
  pin('sibling ship clones untouched',
    clonesB.every((material) => disposesOf(materialDisposes, material) === 0));
  pin('no non-swim material disposed',
    [...materialDisposes.keys()].every((material) => material.userData?.swimUniforms));
  pin('no geometry disposed', geometryDisposes.size === 0);
  pin('no texture disposed', textureDisposes.size === 0);

  // Shared cache survives: a fresh build reuses templates and base materials.
  const shipC = buildShipAsset('light', 'beautiful', 'trader');
  holder.add(shipC);
  pin('shared templates and base materials still usable after release',
    !!shipC.userData.shipVisual && clonesOf(shipC).length > 0);

  // ---- Repeated release ----------------------------------------------------
  const disposedBeforeRepeat = disposedSwim.length;
  releaseShipAsset(shipA);
  releaseShipAsset(shipA);
  pin('repeated release is a safe no-op',
    disposedSwimClones().length === disposedBeforeRepeat
    && clonesA.every((material) => disposesOf(materialDisposes, material) === 1));

  // ---- Release before lower LODs arrive ------------------------------------
  gateLowerLods = true;
  await primeShipAsset('beautiful', 'cutter', 'trader');
  const shipD = buildShipAsset('cutter', 'beautiful', 'trader');
  const shipE = buildShipAsset('cutter', 'beautiful', 'trader');
  holder.add(shipD, shipE);
  pin('lower LOD reads held at the gate', pendingReads.size === 2);

  const clonesDAtRelease = clonesOf(shipD).length;
  releaseShipAsset(shipD);
  pin('released-before-load ship clones disposed',
    clonesOf(shipD).every((material) => disposesOf(materialDisposes, material) === 1));

  await openGate();
  // Explicit completion: the live sibling shares the same template promises
  // and instance set, so its LOD attachment proves the released ship's
  // callback ran (and skipped it) in the same iteration.
  await waitFor(() => shipE.userData.loadedLods.size === 3, 'sibling late lower LODs');

  pin('late lower-LOD load does not revive released ship',
    shipD.userData.loadedLods.size === 1 && shipD.userData.lod.levels.length === 1);
  pin('late lower-LOD load creates no new clones for released ship',
    clonesOf(shipD).length === clonesDAtRelease);
  pin('late lower-LOD clones attach to live sibling only',
    clonesOf(shipE).length > clonesDAtRelease
    && clonesOf(shipE).every((material) => disposesOf(materialDisposes, material) === 0));

  // ---- Ordinary faction: shared materials, no private clones ---------------
  await primeShipAsset('independent', 'light', 'trader');
  const shipF = buildShipAsset('light', 'independent', 'trader');
  holder.add(shipF);
  await waitFor(() => shipF.userData.loadedLods.size === 3, 'ordinary faction lower LODs');
  const sharedF = attachedMaterials(shipF);
  pin('ordinary faction ship owns no private clone set', !shipF.userData.privateMaterials);
  releaseShipAsset(shipF);
  pin('ordinary faction release disposes no shared materials',
    sharedF.every((material) => disposesOf(materialDisposes, material) === 0));
  const shipG = buildShipAsset('light', 'independent', 'trader');
  holder.add(shipG);
  pin('ordinary faction shared materials still usable', !!shipG.userData.shipVisual);

  pin('no geometry disposed across all scenarios', geometryDisposes.size === 0);
  pin('no texture disposed across all scenarios', textureDisposes.size === 0);
} finally {
  THREE.Material.prototype.dispose = original.materialDispose;
  THREE.BufferGeometry.prototype.dispose = original.geometryDispose;
  THREE.Texture.prototype.dispose = original.textureDispose;
  THREE.Material.prototype.clone = original.materialClone;
}

if (fails === 0) {
  console.log('SHIP MATERIAL RELEASE PASS');
  process.exit(0);
}
console.log(`SHIP MATERIAL RELEASE FAIL — ${fails}`);
process.exit(1);
