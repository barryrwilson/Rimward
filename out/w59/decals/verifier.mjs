// Wave 59 FX-DECALS verifier. Logs only. Does not start Vite.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import {
  HULL_MARK_POOL,
  HULL_MARK_SIZE,
  HULL_MARK_LIFT,
  isFiniteVec3,
  worldHitToLocal,
  liftLocalOffset,
  nextMarkSlot,
} from '../../../src/game/hull-marks.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const hullPath = join(root, 'src', 'game', 'hull-marks.js');
const combatPath = join(root, 'src', 'systems', 'combat.js');

const fails = [];
const lines = [];
function log(s) {
  lines.push(s);
  console.log(s);
}
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const hullSrc = existsSync(hullPath) ? readFileSync(hullPath, 'utf8') : '';
const combatSrc = readFileSync(combatPath, 'utf8');

ok('fix.noLastEventsArrayLiteral', !/\[\s*ctx\.lastEvents\s*,\s*ctx\.events\s*\]/.test(combatSrc));
ok(
  'fix.reclaimFromEventsTwice',
  /reclaimFromEvents\s*\(\s*ctx\.lastEvents\s*\)/.test(combatSrc) &&
    /reclaimFromEvents\s*\(\s*ctx\.events\s*\)/.test(combatSrc),
);
ok('fix.noForOfOnEventBanks', !/for\s*\(\s*(?:const|let)\s+\w+\s+of\s+\[\s*ctx\.lastEvents/.test(combatSrc));

ok('src.noMarkMatClone', !/hullMarkMat\.clone\s*\(/.test(combatSrc) && !/hullMarkTex\.clone\s*\(/.test(combatSrc));
ok('src.noMaterialClone', !/Material\.clone|material\.clone\s*\(/.test(combatSrc));
ok(
  'src.sharedTags',
  combatSrc.includes('hullMarkTex.userData.shared = true') &&
    combatSrc.includes('hullMarkMat.userData.shared = true') &&
    combatSrc.includes('hullMarkRoot.userData.shared = true'),
);
ok('src.stampOnlyUnshielded', /if \(shielded\) spawnRipple[\s\S]*else \{[\s\S]*stampHullMark/.test(combatSrc));
ok('src.unknowableSkip', combatSrc.includes('if (isUnknowable(s.state.faction)) continue;'));
ok(
  'src.reclaimEvents',
  combatSrc.includes("e.type === 'npcDestroyed'") &&
    combatSrc.includes("e.type === 'playerDestroyed'") &&
    combatSrc.includes("e.type === 'systemLoaded'") &&
    combatSrc.includes('if (ctx.player?.destroyed)'),
);
ok('src.hostOrphanPark', /slot\.host\.parent == null/.test(combatSrc));
ok('src.parkOnKill', combatSrc.includes('if (s.state.destroyed) parkMarksOnHost(s.object)'));
ok('src.parkOnPlayerKill', combatSrc.includes('if (player.destroyed) parkMarksOnHost(playerObj)'));
ok('src.playerFireUnchanged', combatSrc.includes("ctx.emit('playerFire', { weapon: wkey })"));
ok('src.projRadius', /const PROJ_RADIUS = 0\.4/.test(combatSrc));
ok('src.applyHitDamage', combatSrc.includes('applyHit(s.state, { damage: p.damage, family: p.wkey, facet, now })'));
ok('src.miningFamily', combatSrc.includes("family: 'mining'"));
ok('src.noMatchSpeed', !/matchSpeed/.test(combatSrc));
ok('src.noThreeInHelper', !/from\s+['"]three['"]/.test(hullSrc) && !/\bTHREE\b/.test(hullSrc));
ok('src.poolSize', HULL_MARK_POOL === 12, String(HULL_MARK_POOL));
ok('src.markSize', Number.isFinite(HULL_MARK_SIZE) && HULL_MARK_SIZE > 0);

function poseFromObject(obj) {
  return {
    px: obj.position.x, py: obj.position.y, pz: obj.position.z,
    qx: obj.quaternion.x, qy: obj.quaternion.y, qz: obj.quaternion.z, qw: obj.quaternion.w,
    sx: obj.scale.x, sy: obj.scale.y, sz: obj.scale.z,
  };
}

function compareWorldToLocal(name, obj, wx, wy, wz) {
  obj.updateMatrixWorld(true);
  const out = { x: 0, y: 0, z: 0 };
  const okFn = worldHitToLocal(wx, wy, wz, poseFromObject(obj), out);
  const ref = obj.worldToLocal(new THREE.Vector3(wx, wy, wz));
  const dx = Math.abs(out.x - ref.x);
  const dy = Math.abs(out.y - ref.y);
  const dz = Math.abs(out.z - ref.z);
  const close = okFn && dx < 1e-6 && dy < 1e-6 && dz < 1e-6;
  ok(name, close, JSON.stringify({ out, ref: { x: ref.x, y: ref.y, z: ref.z }, okFn }));
}

const host = new THREE.Object3D();
host.position.set(10, -4, 7);
host.quaternion.setFromEuler(new THREE.Euler(0.4, -1.1, 0.25));
host.scale.set(1, 1, 1);
compareWorldToLocal('math.rotTrans', host, 12.5, -3.2, 8.1);

const scaled = new THREE.Object3D();
scaled.position.set(-3, 2, 5);
scaled.quaternion.setFromEuler(new THREE.Euler(-0.2, 0.8, 1.3));
scaled.scale.set(2, 0.5, 1.25);
compareWorldToLocal('math.rotTransScale', scaled, 0, 0, 0);
compareWorldToLocal('math.rotTransScaleHit', scaled, -2.1, 2.4, 6.2);

const yaw = new THREE.Object3D();
yaw.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
compareWorldToLocal('math.threeYaw90', yaw, 1, 0, 0);

const pitch = new THREE.Object3D();
pitch.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
compareWorldToLocal('math.threePitch90', pitch, 0, 1, 0);

const id = { px: 0, py: 0, pz: 0, qx: 0, qy: 0, qz: 0, qw: 1, sx: 1, sy: 1, sz: 1 };
const out = { x: 0, y: 0, z: 0 };
ok('math.zeroScale', worldHitToLocal(1, 2, 3, { ...id, sx: 0 }, out) === false);
ok('math.negScale', worldHitToLocal(2, 0, 0, { ...id, sx: -2 }, out) === true && Math.abs(out.x + 1) < 1e-9);
ok('math.infSkip', worldHitToLocal(Infinity, 0, 0, id, out) === false);
ok('math.noOut', worldHitToLocal(1, 2, 3, id, null) === false);
ok('math.noPose', worldHitToLocal(1, 2, 3, null, out) === false);
ok('math.badQuat', worldHitToLocal(1, 0, 0, { ...id, qw: NaN }, out) === false);

const diag = { x: 3, y: 0, z: 4 };
liftLocalOffset(diag, 0.5);
ok('math.liftDiag', Math.abs(Math.hypot(diag.x, diag.y, diag.z) - 5.5) < 1e-9, String(Math.hypot(diag.x, diag.y, diag.z)));
const zed = { x: 0, y: 0, z: 0 };
liftLocalOffset(zed, HULL_MARK_LIFT);
ok('math.liftZero', zed.x === 0 && zed.y === 0 && zed.z === 0);
const same = { x: 1, y: 0, z: 0 };
liftLocalOffset(same, 0);
ok('math.liftNone', same.x === 1 && same.y === 0 && same.z === 0);

ok('recycle.null', nextMarkSlot(null) === -1);
const pool = [];
for (let i = 0; i < HULL_MARK_POOL; i++) pool.push({ live: false, stampAt: -1 });
ok('recycle.firstFree', nextMarkSlot(pool) === 0);
for (let i = 0; i < HULL_MARK_POOL; i++) {
  pool[i].live = true;
  pool[i].stampAt = i;
}
ok('recycle.oldestOf12', nextMarkSlot(pool) === 0);
pool[7].stampAt = -5;
ok('recycle.oldestMid', nextMarkSlot(pool) === 7);
pool[3].live = false;
ok('recycle.freeBeatsOldest', nextMarkSlot(pool) === 3);

// Simulate stamp + park + orphan reclaim without Three scene teardown.
function makeSim() {
  const rootKids = new Set();
  const slots = [];
  for (let i = 0; i < HULL_MARK_POOL; i++) {
    const sprite = { parent: 'root', visible: false };
    rootKids.add(sprite);
    slots.push({ sprite, live: false, stampAt: -1, host: null });
  }
  function park(slot) {
    slot.live = false;
    slot.host = null;
    slot.sprite.visible = false;
    slot.sprite.parent = 'root';
    rootKids.add(slot.sprite);
  }
  function stamp(host, t) {
    const idx = nextMarkSlot(slots);
    const slot = slots[idx];
    if (slot.live) park(slot);
    slot.sprite.parent = host;
    rootKids.delete(slot.sprite);
    slot.sprite.visible = true;
    slot.live = true;
    slot.host = host;
    slot.stampAt = t;
    return slot;
  }
  function reclaimOrphans() {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.live) continue;
      if (!slot.host || slot.host.parent == null) park(slot);
    }
  }
  return { slots, rootKids, park, stamp, reclaimOrphans };
}

const sim = makeSim();
const shipA = { parent: 'scene', name: 'a' };
const shipB = { parent: 'scene', name: 'b' };
for (let i = 0; i < 14; i++) sim.stamp(i < 7 ? shipA : shipB, i);
const live = sim.slots.filter((s) => s.live).length;
ok('sim.poolCap', live === HULL_MARK_POOL, String(live));
ok('sim.oldestReused', sim.slots[0].host === shipB && sim.slots[0].stampAt === 12);
ok('sim.rootHoldsIdle', sim.rootKids.size === 0);
shipA.parent = null;
sim.reclaimOrphans();
const onA = sim.slots.filter((s) => s.host === shipA).length;
const parked = sim.slots.filter((s) => !s.live).length;
ok('sim.despawnParksA', onA === 0 && parked >= 5, `onA=${onA} parked=${parked} root=${sim.rootKids.size}`);
ok('sim.bStillLive', sim.slots.some((s) => s.host === shipB && s.live));
for (const s of sim.slots) if (s.host === shipB) sim.park(s);
ok('sim.allBackOnRoot', sim.rootKids.size === HULL_MARK_POOL && sim.slots.every((s) => !s.live && s.sprite.parent === 'root'));

const unparented = new THREE.Object3D();
unparented.position.set(5, 0, 0);
compareWorldToLocal('math.sceneParentedHost', unparented, 105, 0, 0);

const nested = new THREE.Object3D();
const child = new THREE.Object3D();
nested.position.set(100, 0, 0);
nested.add(child);
child.position.set(5, 0, 0);
child.updateMatrixWorld(true);
const nestedOut = { x: 0, y: 0, z: 0 };
worldHitToLocal(105, 0, 0, poseFromObject(child), nestedOut);
ok(
  'math.localPoseOnNestedChild',
  Math.abs(nestedOut.x - 100) < 1e-9,
  String(nestedOut.x),
);

const summary = fails.length ? `FAIL ${fails.length} ${fails.join(', ')}` : 'CLEAN';
log(summary);
writeFileSync(join(here, 'verifier.log'), `${lines.join('\n')}\n`, 'utf8');
process.exit(fails.length ? 1 : 0);
