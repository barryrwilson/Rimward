/**
 * Agent schema pins: THREE quaternion fwd, live session commands, queued status,
 * shieldDown primitives, commLine consecutive dedup.
 */
import * as THREE from 'three';
import {
  COMMAND_NAMES,
  FORBIDDEN_NAMES,
  EVENT_CAP,
  COMM_LINE_CAP,
  EVENT_TYPES,
  actResult,
  fwdFromQuat,
  vec3,
  localDir,
  isLiveCommand,
  isPr1LiveCommand,
  isForbiddenName,
  isAuthoredCommand,
  sanitizeEvent,
  pushRing,
  noteSessionEvent,
} from '../src/game/agent-schema.js';

const EPS = 1e-6;
let fails = 0;

function near(a, b) {
  return Math.abs(a - b) <= EPS;
}

function vecNear(got, want) {
  if (!got || !want || got.length !== want.length) return false;
  for (let i = 0; i < want.length; i++) {
    if (!near(got[i], want[i])) return false;
  }
  return true;
}

function pin(name, ok) {
  if (ok) {
    console.log('ok', name);
    return;
  }
  fails++;
  console.log('FAIL', name);
}

const ident = new THREE.Quaternion();
pin('THREE quat x is getter not own', Object.hasOwn(ident, 'x') === false);
pin('identity fwd not null', fwdFromQuat(ident) !== null);
pin('identity fwd local -Z', vecNear(fwdFromQuat(ident), [0, 0, -1]));

const q90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
const want90 = new THREE.Vector3(0, 0, -1).applyQuaternion(q90);
const got90 = fwdFromQuat(q90);
pin('rotated fwd matches applyQuaternion', vecNear(got90, [want90.x, want90.y, want90.z]));

const plain = { x: 0, y: 0, z: 0, w: 1 };
pin('plain object quat still works', vecNear(fwdFromQuat(plain), [0, 0, -1]));
pin('null quat', fwdFromQuat(null) === null);
pin('nan quat', fwdFromQuat({ x: NaN, y: 0, z: 0, w: 1 }) === null);

const vOwn = { x: 1, y: 2, z: 3 };
pin('vec3 own xyz', vecNear(vec3(vOwn), [1, 2, 3]));
pin('vec3 array', vecNear(vec3([4, 5, 6]), [4, 5, 6]));
const protoVec = Object.create({ x: 7, y: 8, z: 9 });
pin('vec3 getter/proto xyz', vecNear(vec3(protoVec), [7, 8, 9]));

pin('startGame authored', isAuthoredCommand('startGame') === true);
pin('chooseOrigin authored', isAuthoredCommand('chooseOrigin') === true);
pin('startGame live', isLiveCommand('startGame') === true);
pin('chooseOrigin live', isLiveCommand('chooseOrigin') === true);
pin('startGame not pr1', isPr1LiveCommand('startGame') === false);
pin('command list has session', COMMAND_NAMES.includes('startGame') && COMMAND_NAMES.includes('chooseOrigin'));
pin('approachDock authored', isAuthoredCommand('approachDock') === true
  && COMMAND_NAMES.includes('approachDock'));
pin('approachDock live', isLiveCommand('approachDock') === true);
pin('teleport still forbidden', isForbiddenName('teleport') === true && FORBIDDEN_NAMES.includes('teleport'));
pin('setCredits still forbidden', isForbiddenName('setCredits') === true);

const ping = actResult({ ok: true, error: '', name: 'ping', token: '' });
pin('ping omits status', ping.ok === true && ping.token === '' && !Object.hasOwn(ping, 'status'));
const queued = actResult({ ok: true, error: '', name: 'hail', token: '', status: 'queued' });
pin('queued status', queued.ok === true && queued.token === '' && queued.status === 'queued');

const sdPlayer = sanitizeEvent({
  type: 'shieldDown',
  t: 1,
  layer: 'screen',
  player: true,
  actor: 'player',
  ship: { id: 'nope' },
  fn: () => {},
});
pin('shieldDown player primitives', !!(
  sdPlayer
  && sdPlayer.layer === 'screen'
  && sdPlayer.player === true
  && sdPlayer.actor === 'player'
  && !Object.hasOwn(sdPlayer, 'ship')
  && !Object.hasOwn(sdPlayer, 'fn')
));
const sdNpc = sanitizeEvent({
  type: 'shieldDown',
  t: 2,
  layer: 'shell',
  actor: 'npc',
  targetId: 'npc-1',
  ship: { id: 'npc-1' },
});
pin('shieldDown npc primitives', !!(
  sdNpc
  && sdNpc.layer === 'shell'
  && sdNpc.actor === 'npc'
  && sdNpc.targetId === 'npc-1'
  && !Object.hasOwn(sdNpc, 'ship')
));

pin('playerDestroyed authored', EVENT_TYPES.includes('playerDestroyed'));
pin('recovered authored', EVENT_TYPES.includes('recovered'));
pin('bodyHit authored', EVENT_TYPES.includes('bodyHit'));

const deadEv = sanitizeEvent({ type: 'playerDestroyed', t: 4, ship: { id: 'nope' }, fn: () => {} });
pin('playerDestroyed harvest primitives', !!(deadEv && deadEv.type === 'playerDestroyed' && !Object.hasOwn(deadEv, 'ship') && !Object.hasOwn(deadEv, 'fn')));

const recAuto = sanitizeEvent({ type: 'recovered', t: 5, source: 'autosave', ship: {} });
pin('recovered autosave', !!(recAuto && recAuto.source === 'autosave' && !Object.hasOwn(recAuto, 'ship')));
const recFresh = sanitizeEvent({ type: 'recovered', t: 6, source: 'fresh' });
pin('recovered fresh', !!(recFresh && recFresh.source === 'fresh'));
const recCheat = sanitizeEvent({ type: 'recovered', t: 7, source: 'god' });
pin('recovered source whitelist', !!(recCheat && !Object.hasOwn(recCheat, 'source')));

const bh = sanitizeEvent({
  type: 'bodyHit',
  t: 8,
  kind: 'station',
  speed: 42,
  damage: 3,
  object: { mesh: true },
  fn: () => {},
});
pin('bodyHit sanitize', !!(
  bh
  && bh.kind === 'station'
  && bh.speed === 42
  && bh.damage === 3
  && !Object.hasOwn(bh, 'object')
  && !Object.hasOwn(bh, 'fn')
));

const ring = [];
pushRing(ring, { type: 'commLine', t: 1, text: 'hello', from: 'dock' });
pushRing(ring, { type: 'commLine', t: 2, text: 'hello', from: 'dock' });
pushRing(ring, { type: 'commLine', t: 3, text: 'hello', from: 'bar' });
pushRing(ring, { type: 'hailOpened', t: 4, intents: [] });
pushRing(ring, { type: 'commLine', t: 5, text: 'hello', from: 'dock' });
pin('commLine non-consecutive collapse', ring.length === 3);
pin('commLine distinct from kept', ring[0].from === 'bar');
pin('commLine newest kept', ring[2].type === 'commLine' && ring[2].from === 'dock' && ring[2].count === 3);
pin('hailOpened survived comm collapse', ring[1].type === 'hailOpened');

const flood = [];
pushRing(flood, { type: 'playerDestroyed', t: 1 });
pushRing(flood, { type: 'playerHit', t: 1.1, damage: 2, family: 'cannon' });
pushRing(flood, { type: 'bodyHit', t: 1.2, kind: 'station', speed: 20, damage: 1 });
pushRing(flood, { type: 'shieldDown', t: 1.3, layer: 'screen' });
pushRing(flood, { type: 'recovered', t: 1.4, source: 'autosave' });
for (let i = 0; i < 20; i++) {
  pushRing(flood, { type: 'commLine', t: 2, text: 'Heave to. Cargo or hull.', from: 'pirate' });
}
for (let i = 0; i < 20; i++) {
  pushRing(flood, { type: 'commLine', t: 10 + i, text: `line-${i}`, from: 'dock' });
}
pin('ring never exceeds cap', flood.length <= EVENT_CAP);
pin('commLine cap', flood.filter((e) => e && e.type === 'commLine').length <= COMM_LINE_CAP);
pin('playerDestroyed survives comm flood', flood.some((e) => e && e.type === 'playerDestroyed'));
pin('recovered survives comm flood', flood.some((e) => e && e.type === 'recovered'));
pin('playerHit survives comm flood', flood.some((e) => e && e.type === 'playerHit'));
pin('bodyHit survives comm flood', flood.some((e) => e && e.type === 'bodyHit'));
pin('shieldDown survives comm flood', flood.some((e) => e && e.type === 'shieldDown'));

const session = { agent: { optIn: false, events: [] }, world: { time: 9 } };
noteSessionEvent(session, { type: 'recovered', source: 'fresh' });
pin('noteSessionEvent no optIn write', session.agent.optIn === false);
pin('noteSessionEvent recovered', session.agent.events.length === 1 && session.agent.events[0].type === 'recovered');

// ---- v2 pins (mission 43b34db25ae32972) ----
pin('version 2', COMMAND_NAMES.includes('setControl') && COMMAND_NAMES.includes('clearControl')
  && COMMAND_NAMES.includes('stationAction') && COMMAND_NAMES.includes('recover'));
pin('v2 commands live', isLiveCommand('setControl') === true && isLiveCommand('clearControl') === true
  && isLiveCommand('stationAction') === true && isLiveCommand('recover') === true);
pin('v2 events authored', EVENT_TYPES.includes('jobState') && EVENT_TYPES.includes('npcDestroyed')
  && EVENT_TYPES.includes('survivorRescued') && EVENT_TYPES.includes('landmarkFound')
  && EVENT_TYPES.includes('npcHit') && EVENT_TYPES.includes('hailMiss'));

const jobEv = sanitizeEvent({ type: 'jobState', t: 8, id: 'mine-freehold-0', kind: 'mining', outcome: 'delivered', pay: 220, extra: () => {} });
pin('jobState primitives', !!(jobEv && jobEv.id === 'mine-freehold-0' && jobEv.outcome === 'delivered'
  && jobEv.pay === 220 && !Object.hasOwn(jobEv, 'extra')));

const npcDead = sanitizeEvent({ type: 'npcDestroyed', t: 9, ship: { id: 'npc-9', state: { name: 'Gallows Wren' }, ai: { intent: true } } });
pin('npcDestroyed derives identity', !!(npcDead && npcDead.targetId === 'npc-9'
  && npcDead.targetName === 'Gallows Wren' && !Object.hasOwn(npcDead, 'ship') && !Object.hasOwn(npcDead, 'ai')));

const engOut = sanitizeEvent({ type: 'engineOut', t: 10, player: true });
pin('engineOut player primitive', !!(engOut && engOut.player === true && !Object.hasOwn(engOut, 'ship')));

const podEv = sanitizeEvent({ type: 'podCollected', t: 11, pod: { id: 7, contents: [] } });
pin('podCollected derives podId', !!(podEv && podEv.podId === 7 && !Object.hasOwn(podEv, 'pod')));

const hailEnd = sanitizeEvent({ type: 'hailClosed', t: 12, ship: { id: 'x' }, demandHail: true, demandOutcome: 'paid', speaker: 'Ninth Tooth', demand: 120 });
pin('hailClosed outcome primitives', !!(hailEnd && hailEnd.demandOutcome === 'paid'
  && hailEnd.speaker === 'Ninth Tooth' && hailEnd.demand === 120 && !Object.hasOwn(hailEnd, 'ship')));

// Hit spam collapses per target and never floods the ring.
const hitRing = [];
for (let i = 0; i < 30; i++) pushRing(hitRing, { type: 'npcHit', t: i, targetId: 'a', damage: 8 });
pushRing(hitRing, { type: 'npcHit', t: 31, targetId: 'b', damage: 4 });
const hitA = hitRing.find((e) => e && e.type === 'npcHit' && e.targetId === 'a');
pin('npcHit collapse per target', !!(hitA && hitA.count === 30));
pin('npcHit newest target kept', hitRing.some((e) => e && e.type === 'npcHit' && e.targetId === 'b'));
const keepRing = [];
pushRing(keepRing, { type: 'jobState', t: 1, id: 'j1', kind: 'mining', outcome: 'done' });
for (let i = 0; i < 24; i++) pushRing(keepRing, { type: 'npcHit', t: i + 2, targetId: 's', damage: 1 });
pin('jobState survives hit flood', keepRing.some((e) => e && e.type === 'jobState' && e.id === 'j1'));
// Combat spam folding (wave-142 ring starvation): sustained playerHit/bodyHit
// (KEEP_RING types) once saturated the 16-row ring so eviction discarded the
// agent's own playerFire/npcHit on arrival. Folding per family/kind/weapon
// keeps the ring mixed so fire/hit feedback survives heavy combat.
const combatRing = [];
for (let i = 0; i < 20; i++) pushRing(combatRing, { type: 'playerHit', t: i + 1, damage: 2, family: 'cannon' });
for (let i = 0; i < 10; i++) pushRing(combatRing, { type: 'bodyHit', t: 30 + i, kind: 'ship', speed: 20, damage: 1 });
for (let i = 0; i < 6; i++) pushRing(combatRing, { type: 'shieldDown', t: 40 + i, layer: i % 2 ? 'screen' : 'shell', actor: 'player' });
pushRing(combatRing, { type: 'playerFire', t: 50, weapon: 'cannon' });
pushRing(combatRing, { type: 'npcHit', t: 51, targetId: 'foe', damage: 8 });
const phRow = combatRing.find((e) => e && e.type === 'playerHit');
pin('playerHit folds per family', !!(phRow && phRow.count === 20));
pin('shieldDown rows keep per-layer identity', combatRing.filter((e) => e && e.type === 'shieldDown').length === 6);
pin('playerFire survives KEEP pressure', combatRing.some((e) => e && e.type === 'playerFire' && e.weapon === 'cannon'));
pin('npcHit survives KEEP pressure', combatRing.some((e) => e && e.type === 'npcHit' && e.targetId === 'foe'));
pin('combat ring within cap', combatRing.length <= EVENT_CAP);


// actResult v2 receipts: reqId + sim timestamp.
const receipt = actResult({ ok: true, error: '', name: 'setControl', token: '', status: 'active', reqId: 'q9', t: 12.5 });
pin('actResult v2 receipt', receipt.v === 2 && receipt.reqId === 'q9' && receipt.t === 12.5 && receipt.status === 'active');
const receiptBare = actResult({ ok: false, error: 'x', name: 'dock', token: 'range' });
pin('actResult omits empty reqId', !Object.hasOwn(receiptBare, 'reqId') && !Object.hasOwn(receiptBare, 't'));

// localDir: world dir through the inverse quaternion (identity + 90° yaw).
pin('localDir identity', vecNear(localDir({ x: 0, y: 0, z: 0, w: 1 }, 0, 0, -5), [0, 0, -1]));
const yaw90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
const wantLocal = new THREE.Vector3(10, 0, 0).applyQuaternion(yaw90.clone().invert()).normalize();
pin('localDir matches THREE inverse', vecNear(localDir(yaw90, 10, 0, 0), [wantLocal.x, wantLocal.y, wantLocal.z]));
pin('localDir bad quat', localDir(null, 1, 0, 0) === null && localDir({ x: NaN, y: 0, z: 0, w: 1 }, 1, 0, 0) === null);

// Capability manifest: every role and station service has an explicit status.
const { capabilityManifest } = await import('../src/game/agent-schema.js');
const manifest = capabilityManifest();
pin('manifest v2', manifest.version === 2 && Array.isArray(manifest.events));
pin('manifest roles explicit', Object.values(manifest.roles).every((r) => (
  r && (r.status === 'supported' || r.status === 'unavailable' || r.status === 'blocked-by-scope')
)));
pin('manifest services explicit', ['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']
  .every((s) => manifest.services[s] && manifest.services[s].status === 'supported'));
pin('manifest commands complete', COMMAND_NAMES.every((n) => manifest.commands[n]));

if (fails) {
  console.log(`AGENT SCHEMA FAIL — ${fails}`);
  process.exit(1);
}
console.log('AGENT SCHEMA PASS');
