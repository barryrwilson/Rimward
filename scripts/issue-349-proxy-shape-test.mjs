/**
 * Issue #349 focused regression — mid-traffic proxies read as hulls, not plates.
 *
 * Covers the acceptance criteria that can be pinned headlessly:
 *  - a freighter-class mid proxy has a SHIP-LIKE cross-section: the dart
 *    renders at beam ~0.22 and height ~0.08 of the charter length (the same
 *    ratios the far-traffic impostor layer draws), not the flat 0.8/0.25
 *    plate the first cut produced. Length still follows the class charter so
 *    the 900 u handoff reads as the same hull;
 *  - per-instance colour is mixed toward the faction hull tone: visibly less
 *    saturated than the raw accent, so a large proxy no longer reads as a
 *    glowing slab;
 *  - instances dim across the mid band: a proxy near the 2500 u edge is drawn
 *    darker than one inside the near bubble, softening pop-in;
 *  - the layer is still the cheap presentation budget: one instanced mesh,
 *    8 triangles, transparent material at reduced opacity;
 *  - the #341 draw-boundary contract is UNCHANGED: a minimum draw distance was
 *    considered and deliberately rejected — the near bubble keeps drawing
 *    uninstantiated approach-lane records; only how they read changed.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-349-proxy-shape-test.mjs
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStubs, seedBootRandom } from './lib/boot-harness.mjs';

seedBootRandom();
installDomStubs();

const { createCtx } = await import('../src/core/ctx.js');
const tiers = await import('../src/game/traffic-tiers.js');
const { initMidTraffic, shouldShowMidProxy } = await import('../src/systems/mid-traffic.js');
const { styleFor } = await import('../src/game/faction-style.js');
const { scaleFor } = await import('../src/game/ship-scale.js');

const rendererStub = () => ({
  domElement: { style: {} }, setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {},
});

function scopedCtx(systemId = 'freehold', opts = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const ctx = createCtx({ scene, camera, renderer: rendererStub() });
  ctx.systems = { freehold: { id: 'freehold' } };
  ctx.world.currentSystem = systemId;
  ctx.world.time = 0;
  ctx.settings.reducedMotion = opts.reducedMotion === true;
  ctx.ship.object = new THREE.Object3D();
  if (Array.isArray(opts.player)) ctx.ship.object.position.fromArray(opts.player);
  return ctx;
}

function mkRec(id, x, extra = {}) {
  return {
    id, faction: 'freehold', classKey: 'freighter', state: 'enroute', system: 'freehold',
    route: [{ x, y: 0, z: 0 }, { x: x + 100, y: 0, z: 0 }],
    leg: 0, legT: 0.5, dir: 1,
    ...extra,
  };
}

const checks = [];
const check = (name, fn) => {
  try { fn(); checks.push({ name, ok: true }); }
  catch (e) { checks.push({ name, ok: false, error: e.message }); }
};

// ---------------------------------------------------------------------------
// 1. Ship-like cross-section on the largest class (the reported defect).
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  ctx.world.records = [mkRec('big', 1400)];
  initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const m = new THREE.Matrix4();
  mesh.getMatrixAt(0, m);
  const s = new THREE.Vector3().setFromMatrixScale(m);
  // Dart basis: x spans 2, y spans 1, z spans 2.
  const beam = s.x * 2;
  const height = s.y * 1;
  const length = s.z * 2;
  const target = scaleFor('freighter').target;
  check('shape: freighter proxy length still follows the class charter', () => {
    assert.ok(length >= target * 0.85 && length <= target * 1.15,
      'length ' + length + ' vs target ' + target);
  });
  check('shape: beam is ship-like (~0.22 of length, was 0.8)', () => {
    const ratio = beam / length;
    assert.ok(ratio >= 0.18 && ratio <= 0.26, 'beam/length ' + ratio);
  });
  check('shape: height is ship-like (~0.08 of length, was 0.25)', () => {
    const ratio = height / length;
    assert.ok(ratio >= 0.06 && ratio <= 0.10, 'height/length ' + ratio);
  });
  check('shape: length leads beam, so travel direction stays legible', () => {
    assert.ok(length > beam && length > height);
  });
  check('shape: still the 8-triangle presentation budget', () => {
    assert.equal(mesh.userData.proxyTriangles, 8);
    assert.equal(mesh.geometry.index.count, 24);
  });
}

// ---------------------------------------------------------------------------
// 2. Hull-tone colour mix and mid-band distance dim.
// ---------------------------------------------------------------------------
{
  const ctx = scopedCtx('freehold', { player: [0, 0, 0] });
  // slot 0: inside the near bubble; slot 1: near the 2500 u edge.
  ctx.world.records = [mkRec('nearLane', 400), mkRec('bandEdge', 2300)];
  initMidTraffic(ctx);
  const mesh = ctx.scene.children.find((o) => o.name === 'mid-traffic-proxies');
  const style = styleFor('freehold');
  const accent = new THREE.Color(style.accent);
  const aHSL = { h: 0, s: 0, l: 0 };
  accent.getHSL(aHSL);
  const c0 = new THREE.Color();
  const c1 = new THREE.Color();
  mesh.getColorAt(0, c0);
  mesh.getColorAt(1, c1);
  const hsl0 = { h: 0, s: 0, l: 0 };
  const hsl1 = { h: 0, s: 0, l: 0 };
  c0.getHSL(hsl0);
  c1.getHSL(hsl1);
  check('colour: drawn proxy is less saturated than the raw faction accent', () => {
    assert.ok(hsl0.s < aHSL.s - 0.05, 'instance s ' + hsl0.s + ' vs accent s ' + aHSL.s);
  });
  check('colour: hue keeps the faction identity (mix, not repaint)', () => {
    assert.ok(Math.abs(hsl0.h - aHSL.h) < 0.08, 'hue drift ' + Math.abs(hsl0.h - aHSL.h));
  });
  check('colour: band-edge instance is dimmed vs the near-lane instance', () => {
    const b0 = c0.r + c0.g + c0.b;
    const b1 = c1.r + c1.g + c1.b;
    assert.ok(b1 < b0, 'edge ' + b1 + ' should be dimmer than near ' + b0);
  });
  check('colour: near-lane instance keeps most of its tone (approach stays readable)', () => {
    // Far-edge dim floor is 0.6; a near-lane proxy must sit well above it.
    const b0 = (c0.r + c0.g + c0.b) / 3;
    const accentL = (accent.r + accent.g + accent.b) / 3;
    assert.ok(b0 > accentL * 0.4, 'near brightness ' + b0 + ' vs accent ' + accentL);
  });
  check('material: transparent and dimmed below the old 0.9 opacity', () => {
    assert.equal(mesh.material.transparent, true);
    assert.equal(mesh.material.opacity, 0.6);
  });
}

// ---------------------------------------------------------------------------
// 3. The #341 draw-boundary contract is unchanged (no minimum draw distance).
// ---------------------------------------------------------------------------
check('boundaries: near bubble still draws (0 u station-hold)', () => {
  assert.equal(shouldShowMidProxy(mkRec('a', 0), 0), true);
});
check('boundaries: 900 u and just past it still draw', () => {
  assert.equal(shouldShowMidProxy(mkRec('b', 900), tiers.NEAR_RANGE), true);
  assert.equal(shouldShowMidProxy(mkRec('c', 901), tiers.NEAR_RANGE + 0.01), true);
});
check('boundaries: mid band edge is 2500 u, far-traffic owns beyond', () => {
  assert.equal(shouldShowMidProxy(mkRec('d', 2500), tiers.MID_RANGE), true);
  assert.equal(shouldShowMidProxy(mkRec('e', 2501), tiers.MID_RANGE + 0.01), false);
});
check('boundaries: live and terminal records never draw', () => {
  assert.equal(shouldShowMidProxy({ state: 'enroute', live: true }, 1500), false);
  assert.equal(shouldShowMidProxy({ state: 'dead' }, 1500), false);
  assert.equal(shouldShowMidProxy({ state: 'captured' }, 1500), false);
  assert.equal(shouldShowMidProxy({ state: 'inTransit' }, 1500), false);
});

const failures = checks.filter((c) => !c.ok);
for (const c of checks) console.log((c.ok ? 'ok ' : 'FAIL ') + c.name + (c.ok ? '' : ' — ' + c.error));
if (failures.length > 0) {
  console.error('ISSUE #349 PROXY SHAPE FAIL (' + failures.length + ' of ' + checks.length + ')');
  process.exit(1);
}
console.log('ISSUE #349 PROXY SHAPE PASS (' + checks.length + ' checks)');
