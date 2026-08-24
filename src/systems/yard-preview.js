/**
 * Shipyard hull turntable. Own WebGLRenderer: main.js renders the game
 * scene every frame, so sharing that renderer fights the dock overlay.
 *
 * Lifecycle is canvas-driven. Station rebuilds the overlay with
 * overlay.textContent = '' (1 s refresh and pane redraw). When a host
 * canvas leaves the document, the loop drops that view. When no view
 * remains, the renderer and mesh cache are disposed. While the Yard pane
 * is open, meshes stay keyed by hullKind:faction:classKey.
 *
 * Living SKUs use makeLivingHull(classKey). Plated SKUs use
 * primeShipAsset + buildPlayerPlatedMesh. Fallback box until primed.
 *
 * Framing is a shared family scale, not fill-to-fit. Per-mesh fit cancelled
 * livingRestScale, so light and heavy looked the same size. Living tiles
 * (and plated light–heavy) share the heavy charter target. Frigate and
 * freighter use their own span so they are not clipped.
 */

import * as THREE from 'three';
import { makeLivingHull, makeVeinTexture } from './ship.js';
import { buildPlayerPlatedMesh, animateShipMesh } from './npc.js';
import { isShipAssetReady, primeShipAsset, releaseShipAsset } from './ship-assets.js';
import { addShipLightRig, applyShipToneMapping, applyShipLighting } from './ship-lighting.js';
import { scaleFor } from '../game/ship-scale.js';

const TURNTABLE_SPEED = 0.18;
const CAM_ALONG = 1.55;
const CAM_UP = 0.52;
const CAM_SIDE = 0.62;
const CSS_W = 128;
const CSS_H = 84;
const CONFIRM_W = 168;
const CONFIRM_H = 108;
const MAX_DPR = 2;
const BG = 0x070c14;

const meshCache = new Map();
const priming = new Map();
const views = new Set();

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

let renderer = null;
let glCanvas = null;
let clock = null;
let rafId = null;
let ctxRef = null;

function previewKey(spec) {
  const hullKind = spec?.hullKind === 'living' ? 'living' : 'built';
  const faction = typeof spec?.faction === 'string' ? spec.faction : '';
  const classKey = typeof spec?.classKey === 'string' && spec.classKey ? spec.classKey : 'light';
  return `${hullKind}:${faction}:${classKey}`;
}

function cssSize(host) {
  const confirm = host?.closest?.('.shipyard-confirm');
  return confirm
    ? { w: CONFIRM_W, h: CONFIRM_H }
    : { w: CSS_W, h: CSS_H };
}

function bufferSize(cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  return {
    w: Math.max(1, Math.round(cssW * dpr)),
    h: Math.max(1, Math.round(cssH * dpr)),
  };
}

function makeFallbackBox() {
  const geo = new THREE.BoxGeometry(2.4, 0.6, 3.6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6a7380,
    metalness: 0.7,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'yard-preview-fallback';
  return {
    object: mesh,
    fallback: true,
    owned: true,
    geos: [geo],
    mats: [mat],
    update: null,
  };
}

function makeLivingPreview(classKey) {
  const { geo } = makeLivingHull(classKey);
  const veinTex = makeVeinTexture();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x2b2145,
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.7,
    clearcoatRoughness: 0.35,
    emissive: 0xffffff,
    emissiveMap: veinTex,
    emissiveIntensity: 0.8,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'yard-preview-living';
  return {
    object: mesh,
    fallback: false,
    owned: true,
    geos: [geo],
    mats: [mat],
    tex: [veinTex],
    update: null,
  };
}

function makePlatedPreview(faction, classKey) {
  const object = buildPlayerPlatedMesh(classKey, faction);
  if (!object) return null;
  return {
    object,
    fallback: false,
    owned: false,
    update: (elapsed, reducedMotion, camera) => {
      animateShipMesh(object, elapsed, reducedMotion, camera);
    },
  };
}

function disposeOwned(entry) {
  if (!entry?.owned) {
    if (entry?.object) releaseShipAsset(entry.object);
    return;
  }
  for (const g of entry.geos ?? []) g.dispose?.();
  for (const m of entry.mats ?? []) m.dispose?.();
  for (const t of entry.tex ?? []) t.dispose?.();
}

function detachObject(entry) {
  if (!entry?.object?.parent) return;
  entry.object.parent.remove(entry.object);
}

function measureLongest(object) {
  object.updateMatrixWorld(true);
  _box.setFromObject(object);
  if (_box.isEmpty()) return 0;
  _box.getSize(_size);
  return Math.max(_size.x, _size.y, _size.z, 0);
}

function heavyTarget() {
  const n = scaleFor('heavy').target;
  return Number.isFinite(n) && n > 0 ? n : 17;
}

/** Shared well scale so class size is visible. Do not fill each mesh. */
function familyFrameSpan(spec, ownLongest) {
  const heavy = heavyTarget();
  const classTarget = scaleFor(spec?.classKey).target;
  const own = ownLongest > 0 ? ownLongest : (Number.isFinite(classTarget) ? classTarget : heavy);
  if (spec?.hullKind === 'living') {
    let span = heavy;
    for (const [key, entry] of meshCache) {
      if (!key.startsWith('living:') || entry.fallback || !entry.object) continue;
      const n = measureLongest(entry.object);
      if (n > span) span = n;
    }
    return Math.max(span, own, heavy);
  }
  if (Number.isFinite(classTarget) && classTarget > heavy) {
    return Math.max(own, classTarget);
  }
  let span = heavy;
  for (const [key, entry] of meshCache) {
    if (!key.startsWith('built:') || entry.fallback || !entry.object) continue;
    const ck = key.split(':')[2];
    if (scaleFor(ck).target > heavy) continue;
    const n = measureLongest(entry.object);
    if (n > span) span = n;
  }
  return Math.max(span, heavy);
}

function frameObject(view, object) {
  view.fit.position.set(0, 0, 0);
  object.updateMatrixWorld(true);
  _box.setFromObject(object);
  if (_box.isEmpty()) {
    view.camera.position.set(4, 1.6, 2.4);
    view.camera.lookAt(0, 0, 0);
    return;
  }
  _box.getCenter(_center);
  _box.getSize(_size);
  view.fit.position.copy(_center).multiplyScalar(-1);
  const own = Math.max(_size.x, _size.y, _size.z, 0.5);
  const span = familyFrameSpan(view.spec, own);
  view.camera.position.set(span * CAM_ALONG, span * CAM_UP, span * CAM_SIDE);
  view.camera.near = Math.max(0.05, span * 0.04);
  view.camera.far = Math.max(40, span * 24);
  view.camera.lookAt(0, 0, 0);
  view.camera.updateProjectionMatrix();
}

function reframeFamily(hullKind) {
  for (const view of views) {
    if (view.spec?.hullKind !== hullKind || !view.entry?.object) continue;
    frameObject(view, view.entry.object);
    view.needsPaint = true;
  }
}

function attachCached(view, entry) {
  detachObject(entry);
  while (view.fit.children.length) view.fit.remove(view.fit.children[0]);
  view.fit.add(entry.object);
  view.entry = entry;
  frameObject(view, entry.object);
  reframeFamily(view.spec.hullKind);
}

function putCache(key, entry) {
  const prev = meshCache.get(key);
  if (prev && prev !== entry) {
    detachObject(prev);
    disposeOwned(prev);
  }
  meshCache.set(key, entry);
}

function ensureCached(key, spec) {
  try {
    const hit = meshCache.get(key);
    if (spec.hullKind === 'living') {
      if (hit && !hit.fallback) return hit;
      const living = makeLivingPreview(spec.classKey);
      putCache(key, living);
      return living;
    }
    if (hit && !hit.fallback) return hit;
    const plated = isShipAssetReady(spec.faction, spec.classKey, 'trader')
      ? makePlatedPreview(spec.faction, spec.classKey)
      : null;
    if (plated) {
      putCache(key, plated);
      return plated;
    }
    const box = hit?.fallback ? hit : makeFallbackBox();
    putCache(key, box);
    requestPlated(key, spec);
    return box;
  } catch {
    const box = makeFallbackBox();
    putCache(key, box);
    if (spec.hullKind !== 'living') requestPlated(key, spec);
    return box;
  }
}

function requestPlated(key, spec) {
  if (spec.hullKind === 'living') return;
  if (priming.has(key)) return;
  const job = Promise.resolve()
    .then(() => primeShipAsset(spec.faction, spec.classKey, 'trader'))
    .then(() => {
      const plated = makePlatedPreview(spec.faction, spec.classKey);
      if (!plated) return;
      if (views.size === 0) {
        releaseShipAsset(plated.object);
        return;
      }
      putCache(key, plated);
      for (const view of views) {
        if (view.key !== key) continue;
        attachCached(view, plated);
        view.needsPaint = true;
      }
    })
    .catch(() => {})
    .finally(() => priming.delete(key));
  priming.set(key, job);
}

function ensureRenderer() {
  if (renderer) return true;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
  } catch {
    renderer = null;
    return false;
  }
  applyShipToneMapping(renderer);
  renderer.setPixelRatio(1);
  glCanvas = renderer.domElement;
  glCanvas.tabIndex = -1;
  glCanvas.setAttribute('aria-hidden', 'true');
  glCanvas.style.position = 'fixed';
  glCanvas.style.left = '-4096px';
  glCanvas.style.top = '0';
  glCanvas.style.pointerEvents = 'none';
  document.body.appendChild(glCanvas);
  clock = new THREE.Clock();
  return true;
}

function makeViewScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  addShipLightRig(scene);
  if (renderer) applyShipLighting(renderer, scene);
  const pivot = new THREE.Group();
  const fit = new THREE.Group();
  pivot.add(fit);
  scene.add(pivot);
  const camera = new THREE.PerspectiveCamera(50, CSS_W / CSS_H, 0.05, 100);
  camera.position.set(4, 1.6, 2.4);
  camera.lookAt(0, 0, 0);
  return { scene, camera, pivot, fit };
}

function pruneDisconnected() {
  for (const view of [...views]) {
    if (view.canvas.isConnected) continue;
    views.delete(view);
    if (view.entry?.object?.parent === view.fit) {
      view.fit.remove(view.entry.object);
    }
  }
}

function clearMeshCache() {
  for (const entry of meshCache.values()) {
    detachObject(entry);
    disposeOwned(entry);
  }
  meshCache.clear();
}

function disposeRenderer() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  for (const view of views) {
    if (view.entry?.object?.parent === view.fit) view.fit.remove(view.entry.object);
  }
  views.clear();
  clearMeshCache();
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  renderer = null;
  clock = null;
  if (glCanvas?.parentNode) glCanvas.parentNode.removeChild(glCanvas);
  glCanvas = null;
}

function paintView(view, elapsed, dt, reducedMotion) {
  if (!renderer || !view.canvas.isConnected) return;
  const css = cssSize(view.host);
  const buf = bufferSize(css.w, css.h);
  if (view.canvas.width !== buf.w || view.canvas.height !== buf.h) {
    view.canvas.width = buf.w;
    view.canvas.height = buf.h;
  }
  const aspect = buf.w / buf.h;
  if (view.camera.aspect !== aspect) {
    view.camera.aspect = aspect;
    view.camera.updateProjectionMatrix();
  }
  if (!reducedMotion) view.pivot.rotateY(TURNTABLE_SPEED * dt);
  if (view.entry?.update) view.entry.update(elapsed, reducedMotion, view.camera);
  renderer.setSize(buf.w, buf.h, false);
  try {
    renderer.render(view.scene, view.camera);
    view.ctx2d?.drawImage(glCanvas, 0, 0, buf.w, buf.h);
  } catch {
    // Keep the desk up if a single frame fails.
  }
  view.needsPaint = false;
}

function loop() {
  rafId = requestAnimationFrame(loop);
  pruneDisconnected();
  if (views.size === 0) {
    disposeRenderer();
    return;
  }
  if (!renderer && !ensureRenderer()) {
    disposeRenderer();
    return;
  }
  const reducedMotion = ctxRef?.settings?.reducedMotion === true;
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  for (const view of views) {
    if (reducedMotion && view.painted && !view.needsPaint) continue;
    paintView(view, elapsed, reducedMotion ? 0 : dt, reducedMotion);
    view.painted = true;
  }
}

function startLoop() {
  if (rafId !== null) return;
  if (!renderer) return;
  rafId = requestAnimationFrame(loop);
}

function bindCanvas(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'shipyard-preview-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  const css = cssSize(host);
  const buf = bufferSize(css.w, css.h);
  canvas.width = buf.w;
  canvas.height = buf.h;
  host.appendChild(canvas);
  return canvas;
}

/**
 * Mount a look-only hull turntable into `host`.
 * @param {HTMLElement} host
 * @param {{ hullKind: string, faction: string, classKey: string }} spec
 * @param {object} ctx
 */
export function mountYardPreview(host, spec, ctx) {
  if (!host) return;
  ctxRef = ctx;
  pruneDisconnected();
  const key = previewKey(spec);
  const resolved = {
    hullKind: key.startsWith('living:') ? 'living' : 'built',
    faction: typeof spec?.faction === 'string' ? spec.faction : '',
    classKey: typeof spec?.classKey === 'string' && spec.classKey ? spec.classKey : 'light',
  };
  host.setAttribute('aria-hidden', 'true');
  if (!ensureRenderer()) return;
  const canvas = bindCanvas(host);
  const ctx2d = canvas.getContext('2d');
  const rig = makeViewScene();
  const view = {
    host,
    canvas,
    ctx2d,
    key,
    spec: resolved,
    scene: rig.scene,
    camera: rig.camera,
    pivot: rig.pivot,
    fit: rig.fit,
    entry: null,
    needsPaint: true,
    painted: false,
  };
  views.add(view);
  attachCached(view, ensureCached(key, resolved));
  startLoop();
  const reducedMotion = ctx?.settings?.reducedMotion === true;
  paintView(view, 0, 0, reducedMotion);
  view.painted = true;
}
