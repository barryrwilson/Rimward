/**
 * Wave 91 living remount geometry check. Does not touch src/.
 */
import * as THREE from 'three';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeLivingHull, remountPlayerHull } from '../../../../src/systems/ship.js';
import { P } from '../../../../src/game/ship-scale.js';
import { purchaseYardHull } from '../../../../src/game/shipyard.js';
import { createShipState } from '../../../../src/game/state.js';

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

function spansFromGeo(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  const spanX = b.max.x - b.min.x;
  const spanY = b.max.y - b.min.y;
  const spanZ = b.max.z - b.min.z;
  const max = Math.max(spanX, spanY, spanZ);
  return { spanX, spanY, spanZ, max };
}

function roundSpans(s) {
  return {
    spanX: +s.spanX.toFixed(2),
    spanY: +s.spanY.toFixed(2),
    spanZ: +s.spanZ.toFixed(2),
    max: +s.max.toFixed(2),
  };
}

function measure(classKey) {
  const r = classKey === undefined
    ? makeLivingHull()
    : makeLivingHull(classKey);
  const s = spansFromGeo(r.geo);
  return {
    classKey: classKey === undefined ? '(default)' : String(classKey),
    restScale: r.restScale,
    sx: r.sx,
    sy: r.sy,
    sz: r.sz,
    ...roundSpans(s),
    rawMax: s.max,
  };
}

const keys = [undefined, 'light', 'cutter', 'heavy', 'nope', 'junk-class', 0, null];
const rows = [];
let threw = null;
try {
  for (const k of keys) rows.push(measure(k));
} catch (e) {
  threw = String(e && e.stack ? e.stack : e);
}

const light = rows.find((r) => r.classKey === 'light');
const def = rows.find((r) => r.classKey === '(default)');
const cutter = rows.find((r) => r.classKey === 'cutter');
const heavy = rows.find((r) => r.classKey === 'heavy');
const junk = rows.filter((r) => !['(default)', 'light', 'cutter', 'heavy'].includes(r.classKey));

function near(a, b, eps = 0.03) {
  return Math.abs(a - b) <= eps;
}

const checks = {
  noThrow: threw == null,
  P: P === 6.6,
  lightMax660: light && near(light.max, 6.6, 0.02),
  defaultEqualsLight: def && light && def.max === light.max
    && def.spanX === light.spanX && def.spanZ === light.spanZ
    && def.restScale === 1,
  cutterMax968: cutter && near(cutter.max, 9.68, 0.05),
  cutterLongerZ: cutter && light && cutter.spanZ > light.spanZ + 2,
  heavyMax1870: heavy && near(heavy.max, 18.7, 0.08),
  heavyBiggerThanLight: heavy && light && heavy.max > light.max * 2,
  junkEqualsLight: junk.every((r) => light && r.max === light.max && r.restScale === 1),
};

// remountPlayerHull class-aware living path
let remount = { ok: false };
try {
  const scene = new THREE.Scene();
  const dummy = new THREE.Object3D();
  dummy.position.set(1, 2, 3);
  scene.add(dummy);
  const ctx = {
    scene,
    player: { classKey: 'heavy', hullKind: 'living', faction: 'beautiful' },
    ship: {
      object: dummy,
      hullRig: null,
      velocity: new THREE.Vector3(),
      speed: 0,
    },
  };
  remountPlayerHull(ctx);
  const rig = ctx.ship.hullRig;
  const geo = rig?.hull?.geometry || rig?.geo;
  const s = geo ? roundSpans(spansFromGeo(geo)) : null;
  remount = {
    ok: true,
    kind: rig?.kind,
    restScale: rig?.restScale,
    living: {
      swim: !!ctx.ship.living?.swim,
      breath: !!ctx.ship.living?.breath,
      heartbeat: !!ctx.ship.living?.heartbeat,
      base: !!ctx.ship.living?.base,
    },
    spans: s,
    posKept: ctx.ship.object.position.x === 1
      && ctx.ship.object.position.y === 2
      && ctx.ship.object.position.z === 3,
    unknownClosed: false,
  };
  ctx.player.classKey = 'totally-unknown';
  remountPlayerHull(ctx);
  const s2 = roundSpans(spansFromGeo(ctx.ship.hullRig.geo));
  remount.unknownClosed = s2.max === light.max && ctx.ship.hullRig.kind === 'living';
  remount.unknownSpans = s2;
} catch (e) {
  remount = { ok: false, error: String(e && e.stack ? e.stack : e) };
}

// buy does not remount
function buyCtx() {
  const player = createShipState('light', { name: 'Verify', faction: 'beautiful' });
  player.hullKind = 'living';
  return {
    flags: { docked: true, combat: false, paused: false },
    world: {
      currentSystem: 'bt_cradle',
      credits: 100000,
      reputation: { beautiful: 0 },
      hangar: {
        mountedId: 'hull_starter',
        hulls: [{
          id: 'hull_starter',
          hullKind: 'living',
          classKey: 'light',
          faction: 'beautiful',
          name: 'She',
        }],
      },
    },
    systems: { bt_cradle: { faction: 'beautiful' } },
    cargo: [],
    cargoCapacity: 20,
    player,
    ship: {
      object: { position: { toArray: () => [0, 0, 0] }, quaternion: { toArray: () => [0, 0, 0, 1] } },
    },
    emit() {},
    ships: [],
    gate: { jumping: false },
  };
}

let buy = { ok: false };
try {
  const ctx = buyCtx();
  const mountedBefore = ctx.world.hangar.mountedId;
  const classBefore = ctx.player.classKey;
  const res = purchaseYardHull(ctx, 'heavy');
  buy = {
    ok: true,
    purchaseOk: res.ok === true,
    reason: res.reason ?? null,
    mountedSame: ctx.world.hangar.mountedId === mountedBefore,
    classSame: ctx.player.classKey === classBefore,
    hulls: ctx.world.hangar.hulls.map((h) => ({
      id: h.id, classKey: h.classKey, hullKind: h.hullKind,
    })),
  };
} catch (e) {
  buy = { ok: false, error: String(e && e.stack ? e.stack : e) };
}

const allPass = Object.values(checks).every(Boolean)
  && remount.ok
  && remount.kind === 'living'
  && remount.spans && near(remount.spans.max, 18.7, 0.08)
  && remount.unknownClosed
  && remount.living.swim && remount.living.breath && remount.living.heartbeat
  && buy.ok && buy.purchaseOk && buy.mountedSame && buy.classSame;

const report = {
  allPass,
  P,
  checks,
  threw,
  rows,
  remount,
  buy,
};
writeFileSync(join(OUT, 'measure-living.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(allPass ? 0 : 1);
