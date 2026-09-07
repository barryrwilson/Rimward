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
// Re-sanitize (observe() copies ring rows) must keep the derived podId: the row
// has a plain podId and no pod, so a blanket "derived above" skip lost it.
const podEv2 = sanitizeEvent(podEv);
pin('podCollected podId survives re-sanitize', !!(podEv2 && podEv2.podId === 7 && !Object.hasOwn(podEv2, 'pod')));
const podSpawn = sanitizeEvent({ type: 'podSpawned', t: 12, pod: { id: 'pod-3', cargo: {} } });
const podSpawn2 = sanitizeEvent(podSpawn);
pin('podSpawned derives podId', !!(podSpawn && podSpawn.podId === 'pod-3' && !Object.hasOwn(podSpawn, 'pod')));
pin('podSpawned podId survives re-sanitize', !!(podSpawn2 && podSpawn2.podId === 'pod-3' && !Object.hasOwn(podSpawn2, 'cargo')));
// Raw pod.id still wins over a hand-supplied podId, and non-primitives never copy.
const podClash = sanitizeEvent({ type: 'podCollected', t: 13, podId: 'spoofed', pod: { id: 4 } });
pin('raw pod.id beats supplied podId', !!(podClash && podClash.podId === 4));
const podBad = sanitizeEvent({ type: 'podSpawned', t: 14, podId: { id: 'obj' } });
pin('object podId rejected', !!(podBad && !Object.hasOwn(podBad, 'podId')));
const podNoId = sanitizeEvent({ type: 'podCollected', t: 15, podId: 9, pod: { contents: [] } });
pin('plain podId kept when pod lacks id', !!(podNoId && podNoId.podId === 9 && !Object.hasOwn(podNoId, 'pod')));

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

// Demand receipts under ring saturation (PR57 hailDemand): a pirate fight fills
// the ring with distinct npcHit rows (foldable, so keep-class), then the tribute
// is paid. Before terminal retention the fresh hailClosed was the only non-keep
// row present, so eviction discarded it on arrival and the agent could never
// observe the outcome of its own hailResolve - one more tick did not help.
const saturate = (rows, tag) => {
  for (let i = 0; i < EVENT_CAP; i++) {
    pushRing(rows, { type: 'npcHit', t: i + 1, targetId: `${tag}-${i}`, damage: 3 });
  }
  return rows;
};
const paidRing = saturate([], 'paid');
pin('demand ring saturated by npcHit', paidRing.length === EVENT_CAP
  && paidRing.every((e) => e && e.type === 'npcHit'));
pushRing(paidRing, {
  type: 'hailClosed', t: 90, demandHail: true, demandOutcome: 'paid', speaker: 'Ninth Tooth', demand: 200,
});
pin('paid demand receipt survives arrival', paidRing.some((e) => e
  && e.type === 'hailClosed' && e.demandOutcome === 'paid'));
pin('demand ring within cap', paidRing.length <= EVENT_CAP);
// The next harvest ticks keep pumping combat rows; the receipt must still be
// observable on the following observe(), not just on the frame it arrived.
for (let i = 0; i < 6; i++) {
  pushRing(paidRing, { type: 'npcHit', t: 100 + i, targetId: `after-${i}`, damage: 2 });
}
pin('paid demand receipt survives later ticks', paidRing.some((e) => e
  && e.type === 'hailClosed' && e.demandOutcome === 'paid'));

// Every terminal outcome is a receipt, not just the paid one.
for (const outcome of ['refused', 'bluffed', 'failed', 'expired', 'docked', 'jumped', 'voided']) {
  const ring2 = saturate([], outcome);
  pushRing(ring2, { type: 'hailClosed', t: 90, demandHail: true, demandOutcome: outcome, speaker: 'Ninth Tooth', demand: 200 });
  pin(`${outcome} demand receipt survives arrival`, ring2.length <= EVENT_CAP
    && ring2.some((e) => e && e.type === 'hailClosed' && e.demandOutcome === outcome));
}

// Narrowness: an ordinary hang-up carries no outcome and stays evictable, so
// routine hail traffic cannot crowd the ring.
const plainRing = saturate([], 'plain');
pushRing(plainRing, { type: 'hailClosed', t: 90 });
pin('plain hailClosed stays evictable', plainRing.length <= EVENT_CAP
  && !plainRing.some((e) => e && e.type === 'hailClosed'));
// A demand flood is still bounded: the ring never grows past the cap and the
// newest outcomes win.
const demandFlood = [];
for (let i = 0; i < 40; i++) {
  pushRing(demandFlood, { type: 'hailClosed', t: 200 + i, demandHail: true, demandOutcome: 'paid', speaker: `p${i}`, demand: 10 });
}
pin('demand flood bounded by cap', demandFlood.length === EVENT_CAP);
pin('demand flood keeps newest', demandFlood[demandFlood.length - 1].speaker === 'p39');

// Session lifecycle feedback under mineHit saturation (issue #72): an automine
// run fills the ring with 16 distinct mineHit rows (foldable, so keep-class),
// then the ship docks, undocks, or a save is refused. Before lifecycle
// retention the fresh row was the only non-keep row in the ring, so eviction
// discarded it on arrival and the agent could never observe its own dock or
// undock, nor learn why a save was blocked.
const mineSaturate = (tag) => {
  const rows = [];
  for (let i = 0; i < EVENT_CAP; i++) {
    pushRing(rows, { type: 'mineHit', t: i + 1, asteroidId: `${tag}-${i}` });
  }
  return rows;
};
const LIFECYCLE_ROWS = [
  { type: 'saveBlocked', t: 90, reason: 'in-combat' },
  { type: 'docked', t: 91 },
  { type: 'undocked', t: 92 },
];
for (const raw of LIFECYCLE_ROWS) {
  const kind = raw.type;
  const ring = mineSaturate(kind);
  pin(`${kind} ring saturated by distinct mineHit`, ring.length === EVENT_CAP
    && ring.every((e) => e && e.type === 'mineHit'));
  pushRing(ring, sanitizeEvent(raw));
  const found = ring.filter((e) => e && e.type === kind);
  pin(`${kind} survives arrival`, ring.length === EVENT_CAP && found.length === 1);
  pin(`${kind} keeps its timestamp`, found.length === 1 && found[0].t === raw.t);
  if (kind === 'saveBlocked') {
    pin('saveBlocked keeps its reason', found.length === 1 && found[0].reason === 'in-combat');
  }
  // Mixed keep/foldable traffic keeps pumping: the row must still be
  // observable on following observe() calls, not only on its arrival frame.
  for (let i = 0; i < 6; i++) {
    pushRing(ring, { type: 'mineHit', t: 100 + i, asteroidId: `after-${i}` });
    pushRing(ring, { type: 'playerHit', t: 100 + i, family: `fam-${i}`, damage: 2 });
  }
  pin(`${kind} survives later mixed traffic`, ring.length === EVENT_CAP
    && ring.some((e) => e && e.type === kind && e.t === raw.t));
  // Retention is bounded, not permanent: enough newer retained rows age it out
  // in FIFO order and the ring never grows past the cap.
  for (let i = 0; i < EVENT_CAP + 4; i++) {
    pushRing(ring, { type: 'shieldDown', t: 200 + i, layer: i, targetId: `s-${i}` });
  }
  pin(`${kind} eventually evicted FIFO`, ring.length === EVENT_CAP
    && !ring.some((e) => e && e.type === kind));
  // Repeats stay capped, newest wins, and lifecycle rows never collapse — so
  // every retained row keeps its own reason/timestamp.
  const flood = [];
  for (let i = 0; i < 40; i++) pushRing(flood, sanitizeEvent({ ...raw, t: 300 + i }));
  pin(`${kind} flood bounded by cap`, flood.length === EVENT_CAP);
  pin(`${kind} flood keeps newest`, flood[flood.length - 1].t === 339);
  pin(`${kind} flood keeps distinct uncollapsed rows`, flood.every((e) => e
    && e.type === kind && !Object.hasOwn(e, 'count'))
    && new Set(flood.map((e) => e.t)).size === EVENT_CAP);
  // sanitizeEvent: primitives only, idempotent, JSON-safe.
  const clean = sanitizeEvent({ ...raw, ship: { id: 'x' }, nested: { a: 1 }, bogus: 3 });
  pin(`${kind} sanitized primitives only`, !!clean && clean.type === kind && clean.t === raw.t
    && !Object.hasOwn(clean, 'ship') && !Object.hasOwn(clean, 'nested')
    && !Object.hasOwn(clean, 'bogus')
    && Object.keys(clean).every((k) => typeof clean[k] !== 'object'));
  pin(`${kind} sanitize idempotent`,
    JSON.stringify(sanitizeEvent(clean)) === JSON.stringify(clean));
  pin(`${kind} json safe`,
    JSON.stringify(JSON.parse(JSON.stringify(clean))) === JSON.stringify(clean));
}

// Narrowness: ordinary non-keep chatter is still evicted first, so lifecycle
// retention cannot crowd the ring.
const chatterRing = mineSaturate('chatter');
pushRing(chatterRing, { type: 'reticleLock', t: 90, hit: true });
pin('ordinary reticleLock stays evictable', chatterRing.length === EVENT_CAP
  && !chatterRing.some((e) => e && e.type === 'reticleLock'));
const hangRing = mineSaturate('hang');
pushRing(hangRing, { type: 'hailClosed', t: 90 });
pin('plain hailClosed still evictable under mineHit saturation', hangRing.length === EVENT_CAP
  && !hangRing.some((e) => e && e.type === 'hailClosed'));
// Demand receipts, combat feedback and mission outcomes stay equal-priority
// keep rows beside the new lifecycle rows: none outranks another.
const mixRing = mineSaturate('mix');
pushRing(mixRing, {
  type: 'hailClosed', t: 95, demandHail: true, demandOutcome: 'paid', speaker: 'Ninth Tooth', demand: 200,
});
pushRing(mixRing, sanitizeEvent({ type: 'docked', t: 96 }));
pushRing(mixRing, { type: 'npcHit', t: 97, targetId: 'mix-npc', damage: 4 });
pushRing(mixRing, {
  type: 'jobState', t: 98, id: 'j1', kind: 'delivery', outcome: 'delivered', pay: 120,
});
pushRing(mixRing, sanitizeEvent({ type: 'undocked', t: 99 }));
pin('lifecycle coexists with demand/combat/mission rows', mixRing.length === EVENT_CAP
  && mixRing.some((e) => e && e.type === 'hailClosed' && e.demandOutcome === 'paid')
  && mixRing.some((e) => e && e.type === 'npcHit' && e.targetId === 'mix-npc')
  && mixRing.some((e) => e && e.type === 'jobState' && e.outcome === 'delivered')
  && mixRing.some((e) => e && e.type === 'docked' && e.t === 96)
  && mixRing.some((e) => e && e.type === 'undocked' && e.t === 99));


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
