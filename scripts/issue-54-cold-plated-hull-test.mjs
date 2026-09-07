// Behavioral coverage for issue #54: a mounted built (plated) hull remounted
// while its GLB template is still cold must not stay a grey box.
// remountPlayerHull dresses the rig in the fallback synchronously (flight
// state depends on that), then primes the SKU and swaps the REAL asset in
// under the same wrap.
//
// Run:
//   node --import ./scripts/with-css-stub.mjs scripts/issue-54-cold-plated-hull-test.mjs
//
// Pinned here:
//   1. cold cache -> real Gilded freighter GLB, same flight root/transform
//   2. scale normalization: the fit is computed in a detached frame, so a
//      rotated flight root, the flesh breath/third-person 0.55 view scale, and
//      first-person visibility toggles cannot change the hull's size — a cold
//      upgrade lands on exactly the scale warm construction gives the SKU
//   3. a delayed completion after a DIFFERENT hull was remounted is dropped
//   4. A -> B -> A: the first rig's completion must not touch the second rig
//      even though both asked for the same SKU
//   5. an asset load failure leaves the flying fallback in place
//   6. disposal: the fallback is freed on upgrade, and an upgraded asset is
//      released when its rig is later replaced
//
// Real GLB bytes come from public/ through configureShipAssetFileReader, so
// this exercises the production loader/parse path, not a stub template.
import { readFile } from 'node:fs/promises';

const THREE = await import('three');
const {
  configureShipAssetFileReader,
  isShipAssetReady,
} = await import('../src/systems/ship-assets.js');
const { remountPlayerHull } = await import('../src/systems/ship.js');
const { P } = await import('../src/game/ship-scale.js');

let fails = 0;
function pin(name, ok) {
  if (ok) { console.log(`ok — ${name}`); return; }
  fails += 1;
  console.log(`FAIL — ${name}`);
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function waitFor(predicate, label, timeoutMs = 20000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

// ---- Spies ----------------------------------------------------------------
// Geometry/material dispose counts prove the fallback box is freed exactly
// once — by whichever path retires it — and never twice.
const geometryDisposes = new Map();
const materialDisposes = new Map();
const original = {
  geometryDispose: THREE.BufferGeometry.prototype.dispose,
  materialDispose: THREE.Material.prototype.dispose,
  consoleError: console.error,
};
THREE.BufferGeometry.prototype.dispose = function dispose() {
  geometryDisposes.set(this, (geometryDisposes.get(this) ?? 0) + 1);
  return original.geometryDispose.call(this);
};
THREE.Material.prototype.dispose = function dispose() {
  materialDisposes.set(this, (materialDisposes.get(this) ?? 0) + 1);
  return original.materialDispose.call(this);
};
const disposesOf = (map, object) => map.get(object) ?? 0;

const consoleErrors = [];
console.error = (...args) => { consoleErrors.push(args.map(String).join(' ')); };

// ---- Gated / failing asset reader -----------------------------------------
const readAsset = (assetPath) => readFile(new URL(`../public${assetPath}`, import.meta.url));
const pendingReads = new Map();
let gatedPrefix = null; // reads under this prefix are held until the gate opens
let failingPrefix = null; // reads under this prefix reject

configureShipAssetFileReader((assetPath) => {
  if (failingPrefix && assetPath.startsWith(failingPrefix)) {
    return Promise.reject(new Error(`synthetic asset read failure: ${assetPath}`));
  }
  if (gatedPrefix && assetPath.startsWith(gatedPrefix)) {
    return new Promise((resolve, reject) => pendingReads.set(assetPath, { resolve, reject }));
  }
  return readAsset(assetPath);
});

async function openGate() {
  gatedPrefix = null;
  const held = [...pendingReads];
  pendingReads.clear();
  for (const [assetPath, { resolve }] of held) resolve(await readAsset(assetPath));
}

// ---- Minimal ctx -----------------------------------------------------------
const SPAWN = new THREE.Vector3(11, -4, 27);
const FACING = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.7);

const scene = new THREE.Scene();
const bootRoot = new THREE.Object3D();
bootRoot.position.copy(SPAWN);
bootRoot.quaternion.copy(FACING);
scene.add(bootRoot);
const ctx = {
  scene,
  ship: {
    object: bootRoot,
    hullRig: null,
    velocity: new THREE.Vector3(3, 0, -5),
    speed: 42,
  },
  player: { faction: 'gilded', classKey: 'freighter', hullKind: 'built' },
};

function mount(faction, classKey) {
  ctx.player.faction = faction;
  ctx.player.classKey = classKey;
  ctx.player.hullKind = 'built';
  remountPlayerHull(ctx);
  return ctx.ship.hullRig;
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
function longestExtent(object) {
  // Flush from the scene root, exactly as the renderer does each frame:
  // updateMatrixWorld on a child alone reuses its ancestors' STALE cached
  // world matrices, which would hide an in-place fit reading a live frame.
  scene.updateMatrixWorld(true);
  _box.setFromObject(object).getSize(_size);
  return Math.max(_size.x, _size.y, _size.z);
}
function hullMaterialNames(root) {
  const names = new Set();
  root.traverse((node) => {
    if (!node.isMesh) return;
    const list = Array.isArray(node.material) ? node.material : [node.material];
    for (const m of list) if (m?.name) names.add(m.name);
  });
  return names;
}
function bakeOf(root, prefix) {
  return [...hullMaterialNames(root)].some((n) => n.startsWith(prefix));
}
function meshCount(root) {
  let n = 0;
  root.traverse((node) => { if (node.isMesh || node.isSkinnedMesh) n += 1; });
  return n;
}

try {
  // ---- 1. Cold cache upgrades to the real Gilded freighter GLB -------------
  pin('gilded freighter starts cold', !isShipAssetReady('gilded', 'freighter', 'trader'));

  const rigA = mount('gilded', 'freighter');
  const rootA = rigA.root;
  const fallbackA = rigA.plated;
  const fallbackMesh = fallbackA.children[0];
  const fallbackGeo = fallbackMesh.geometry;
  const fallbackMat = fallbackMesh.material;
  const fallbackFit = rigA.hull.scale.x;

  pin('cold remount flies the fallback immediately', rigA.platedIsAsset === false
    && fallbackA.userData.platedFallback === true);
  pin('cold remount publishes the built hull path', ctx.ship.hullPath === 'built');
  pin('cold remount keeps the dock transform',
    rootA.position.equals(SPAWN) && rootA.quaternion.equals(FACING));
  pin('cold remount starts an asset load', !!rigA.platedLoad);

  const upgradedA = await rigA.platedLoad;
  const coldFreighterFit = rigA.hull.scale.x;
  pin('cold load reports an upgrade', upgradedA === true);
  pin('upgrade installs the real asset', rigA.platedIsAsset === true
    && rigA.plated !== fallbackA
    && rigA.plated.name === 'npc-ship-asset');
  pin('upgraded mesh is the Gilded trader bake', bakeOf(rigA.plated, 'RIMWARD_HULL:gilded:trader'));
  pin('upgraded mesh is real geometry, not a box', meshCount(rigA.plated) > 1);
  pin('upgrade keeps the flight root identity',
    ctx.ship.object === rootA && ctx.ship.hullRig === rigA && rootA.parent === scene);
  pin('upgrade keeps the dock transform',
    rootA.position.equals(SPAWN) && rootA.quaternion.equals(FACING));
  pin('upgrade swaps under the same plated wrap',
    rigA.hull.name === 'player-plated'
    && rigA.hull.children.length === 1
    && rigA.hull.children[0] === rigA.plated
    && fallbackA.parent === null);
  pin('upgrade refits the wrap for the new geometry',
    Number.isFinite(coldFreighterFit) && coldFreighterFit > 0 && coldFreighterFit !== fallbackFit);
  pin('fallback box geometry disposed exactly once by the swap',
    disposesOf(geometryDisposes, fallbackGeo) === 1);
  pin('fallback box material disposed exactly once by the swap',
    disposesOf(materialDisposes, fallbackMat) === 1);
  pin('asset ready after the cold load', isShipAssetReady('gilded', 'freighter', 'trader'));
  pin('no console error on a clean cold load', consoleErrors.length === 0);

  // ---- 2. Scale normalization under a hostile live frame -------------------
  // Ferrous heavy arrives while the update loop has the rig mid-flight: root
  // rotated off axis, flesh carrying breath * the third-person 0.55 view
  // scale, and the first-person camera hiding flesh and wrap. None of that may
  // reach the fit. Box3 is axis-aligned, so an in-place measurement inflates
  // with rotation and shrinks with the view scale.
  gatedPrefix = '/assets/ships/ferrous/heavy/';
  const rigH = mount('ferrous', 'heavy');
  await waitFor(() => pendingReads.size > 0, 'ferrous heavy read held at the gate');
  pin('ferrous heavy read is held at the gate', pendingReads.size > 0);
  pin('held hull flies the fallback', rigH.platedIsAsset === false);

  const HOSTILE_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, 0.9, 0.4));
  const HOSTILE_FLESH = 0.55 * 1.03; // third-person view scale * breath
  rigH.root.quaternion.copy(HOSTILE_QUAT);
  rigH.flesh.scale.setScalar(HOSTILE_FLESH);
  rigH.flesh.visible = false; // first-person camera
  rigH.hull.visible = false;
  scene.updateMatrixWorld(true); // the frame the upgrade lands in is current

  await openGate();
  const upgradedH = await rigH.platedLoad;
  const coldHeavyFit = rigH.hull.scale.x;
  pin('hostile-frame cold load still upgrades', upgradedH === true
    && rigH.platedIsAsset === true
    && bakeOf(rigH.plated, 'RIMWARD_HULL:ferrous:trader'));
  pin('upgrade preserves the camera visibility state',
    rigH.hull.visible === false && rigH.flesh.visible === false);
  pin('upgraded inner is itself visible', rigH.plated.visible === true);
  pin('upgrade does not touch the flesh view scale',
    Math.abs(rigH.flesh.scale.x - HOSTILE_FLESH) < 1e-12);
  pin('upgrade does not touch the root rotation', rigH.root.quaternion.equals(HOSTILE_QUAT));

  // The frame really is hostile: measured in place the wrap's world AABB is
  // NOT the neutral fitted size, so an in-place fit would have mis-scaled.
  rigH.hull.visible = true;
  rigH.flesh.visible = true;
  const inPlaceLongest = longestExtent(rigH.hull);
  const neutralLongest = P * rigH.restScale * HOSTILE_FLESH;
  pin('hostile frame genuinely distorts an in-place measurement',
    Math.abs(inPlaceLongest - neutralLongest) > neutralLongest * 0.02);

  // Warm construction of the same SKU is now possible; the fits must match.
  const rigHWarm = mount('ferrous', 'heavy');
  pin('same SKU builds warm on the next remount',
    rigHWarm.platedIsAsset === true && rigHWarm.platedLoad === null);
  pin('cold-upgrade fit equals warm-construction fit',
    Math.abs(coldHeavyFit - rigHWarm.hull.scale.x) < 1e-12);
  // Neutral frame — identity root, unit flesh — so the number under test is
  // the fitted hull size itself and not an AABB inflated by attitude.
  rigHWarm.root.quaternion.identity();
  rigHWarm.flesh.scale.setScalar(1);
  pin('fitted hull lands on the charter size for the class',
    Math.abs(longestExtent(rigHWarm.hull) - P * rigHWarm.restScale) < 1e-6);
  rigHWarm.root.quaternion.copy(FACING);

  // ---- 3. Stale completion after a DIFFERENT hull was remounted ------------
  gatedPrefix = '/assets/ships/gilded/heavy/';
  const rigStale = mount('gilded', 'heavy');
  await waitFor(() => pendingReads.size > 0, 'gilded heavy read held at the gate');
  pin('gilded heavy read is held at the gate', pendingReads.size > 0);
  const staleFallback = rigStale.plated;
  const staleGeo = staleFallback.children[0].geometry;
  const staleMat = staleFallback.children[0].material;
  pin('held hull flies the fallback', rigStale.platedIsAsset === false);

  // Remount a DIFFERENT hull while the gilded heavy GLB is still in flight.
  const rigB = mount('independent', 'light');
  await rigB.platedLoad;
  pin('replacement hull upgraded to its own asset', rigB.platedIsAsset === true
    && bakeOf(rigB.plated, 'RIMWARD_HULL:independent:trader'));
  pin('stale rig was disposed by the remount', rigStale.disposed === true);
  // disposeRig retires the dead rig's fallback. That is the ONLY dispose it
  // may ever get: the late completion must not run the swap and free it again.
  pin('dead rig fallback disposed once by disposeRig',
    disposesOf(geometryDisposes, staleGeo) === 1
    && disposesOf(materialDisposes, staleMat) === 1);

  await openGate();
  const staleResult = await rigStale.platedLoad;
  pin('stale completion reports no upgrade', staleResult === false);
  pin('stale completion did not build into the dead rig',
    rigStale.platedIsAsset === false
    && rigStale.plated === staleFallback
    && rigStale.hull.children.length === 1);
  pin('stale completion did not double-dispose the dead rig fallback',
    disposesOf(geometryDisposes, staleGeo) === 1
    && disposesOf(materialDisposes, staleMat) === 1);
  pin('stale completion did not touch the live hull',
    ctx.ship.hullRig === rigB && ctx.ship.object === rigB.root
    && rigB.hull.children.length === 1 && rigB.hull.children[0] === rigB.plated);
  pin('stale completion logged no error', consoleErrors.length === 0);

  // ---- 4. A -> B -> A on the SAME SKU -------------------------------------
  // Both rigs asked for veridian:cutter off one shared template promise. The
  // first rig is dead; its completion must not dress the second rig (or be
  // mistaken for the second rig's own completion).
  gatedPrefix = '/assets/ships/veridian/cutter/';
  const rigA1 = mount('veridian', 'cutter');
  await waitFor(() => pendingReads.size > 0, 'veridian cutter read held at the gate');
  const a1Fallback = rigA1.plated;
  const rigMid = mount('gilded', 'freighter');
  pin('interposed warm SKU needs no load', rigMid.platedIsAsset === true && rigMid.platedLoad === null);
  pin('interposed warm SKU reuses the cold-upgrade fit',
    Math.abs(rigMid.hull.scale.x - coldFreighterFit) < 1e-12);
  const rigA2 = mount('veridian', 'cutter');
  pin('returning to the same cold SKU flies a fresh fallback',
    rigA2 !== rigA1 && rigA2.platedIsAsset === false && rigA2.plated !== a1Fallback);
  await tick();
  await openGate();
  const a1Result = await rigA1.platedLoad;
  const a2Result = await rigA2.platedLoad;
  pin('first rig completion is dropped even though the SKU matches',
    a1Result === false && rigA1.platedIsAsset === false && rigA1.plated === a1Fallback);
  pin('second rig completion upgrades the live hull',
    a2Result === true && rigA2.platedIsAsset === true
    && bakeOf(rigA2.plated, 'RIMWARD_HULL:veridian:trader'));
  pin('same-SKU stale completion left the live wrap single-child',
    ctx.ship.hullRig === rigA2
    && rigA2.hull.children.length === 1
    && rigA2.hull.children[0] === rigA2.plated);

  // ---- 5. Asset load failure keeps the flying fallback ---------------------
  failingPrefix = '/assets/ships/ferrous/frigate/';
  const rigFail = mount('ferrous', 'frigate');
  const failFallback = rigFail.plated;
  const failResult = await rigFail.platedLoad;
  pin('failed load reports no upgrade', failResult === false);
  pin('failed load keeps the fallback hull', rigFail.platedIsAsset === false
    && rigFail.plated === failFallback
    && failFallback.userData.platedFallback === true
    && rigFail.hull.children.length === 1);
  pin('failed load keeps the ship flyable',
    ctx.ship.object === rigFail.root && rigFail.root.parent === scene);
  pin('failed load reports the SKU on the console',
    consoleErrors.length === 1 && consoleErrors[0].includes('ferrous:frigate'));
  failingPrefix = null;

  // ---- 6. Disposal of an upgraded asset on the next remount ---------------
  const upgradedInner = rigA2.plated;
  const rigC = mount('gilded', 'freighter');
  pin('warm remount builds the asset synchronously', rigC.platedIsAsset === true
    && rigC.platedLoad === null);
  pin('replaced rig releases its upgraded asset', upgradedInner.userData.released === true);
  pin('replaced rig is marked disposed and detached',
    rigA2.disposed === true && rigA2.root.parent === null);
  pin('live rig is the new one', ctx.ship.hullRig === rigC && ctx.ship.object === rigC.root);
  pin('no geometry from a shared GLB template was disposed',
    [...geometryDisposes.keys()].every((geo) => geo.type === 'BoxGeometry'));
} finally {
  THREE.BufferGeometry.prototype.dispose = original.geometryDispose;
  THREE.Material.prototype.dispose = original.materialDispose;
  console.error = original.consoleError;
}

if (fails === 0) {
  console.log('ISSUE 54 COLD PLATED HULL PASS');
  process.exit(0);
}
console.log(`ISSUE 54 COLD PLATED HULL FAIL — ${fails}`);
process.exit(1);
