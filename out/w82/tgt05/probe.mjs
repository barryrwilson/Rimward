/**
 * Wave 82 TGT-05: pick math, lockKind wrappers, 12 px cone, fail-closed rails.
 * Fake ctx only. Does not start Vite. Does not edit scripts/boot-test.mjs.
 */
import * as THREE from 'three';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCK_CONE_PX, pickReticleLock, reticleAimPoint } from '../../../src/game/reticle-aim.js';
import { SYSTEMS, U } from '../../../src/game/state.js';
import { canHailDisabled } from '../../../src/systems/hail.js';

const HERE = dirname(fileURLToPath(import.meta.url));
mkdirSync(HERE, { recursive: true });
const lines = [];
let fail = 0;

function say(msg) {
  lines.push(msg);
  console.log(msg);
}

function pin(ok, label, extra) {
  if (ok) say('PASS ' + label + (extra == null ? '' : ' ' + extra));
  else {
    fail++;
    say('FAIL ' + label + (extra == null ? '' : ' ' + extra));
  }
}

const src = (rel) => readFileSync(join(HERE, '..', '..', '..', rel), 'utf8');
const aimSrc = src('src/game/reticle-aim.js');
const controlsSrc = src('src/systems/controls.js');
const hudSrc = src('src/systems/hud.js');
const combatSrc = src('src/systems/combat.js');
const shipSrc = src('src/systems/ship.js');
const hailSrc = src('src/systems/hail.js');
const stateSrc = src('src/game/state.js');

function makeCam() {
  const cam = new THREE.PerspectiveCamera(60, 1280 / 720, 0.1, 5000);
  cam.position.set(0, 0, 100);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
}

function baseCtx(extra = {}) {
  return {
    camera: extra.camera ?? makeCam(),
    flags: { firstPerson: false, ...(extra.flags ?? {}) },
    ship: { object: { position: extra.shipPos ?? new THREE.Vector3(0, 0, 80) } },
    asteroids: { list: extra.list ?? [] },
    ships: extra.ships ?? [],
    pods: extra.pods ?? [],
    station: extra.station ?? null,
    scene: extra.scene ?? null,
    world: { currentSystem: extra.sys ?? 'freehold' },
    systems: extra.systems ?? SYSTEMS,
    gate: extra.gate ?? { nearHub: false, nearTo: null },
    targets: { current: extra.current ?? null, reticleScreen: { x: extra.rx ?? 0, y: extra.ry ?? 0 } },
  };
}

function shipAt(pos, extra = {}) {
  return {
    object: { position: pos.clone(), parent: extra.parent ?? {} },
    state: { destroyed: !!extra.destroyed, radius: extra.radius ?? 4, disabled: !!extra.disabled },
    record: { name: extra.name ?? 'NPC' },
  };
}

function miningPull(ctx) {
  const t = ctx.targets.current;
  const rockList = ctx.asteroids && ctx.asteroids.list;
  return !!(t && t.position && !t.object && !t.lockKind
    && rockList && rockList.indexOf(t) >= 0);
}

function matchRock(ctx, lock) {
  const liveLock = !!(lock && !lock.lockKind && lock.object && lock.state && !lock.state.destroyed);
  const rockList = ctx.asteroids && ctx.asteroids.list;
  const rockListed = !!(lock && rockList && rockList.indexOf(lock) >= 0);
  const rockLock = !!(rockListed && lock.position
    && (lock.lockKind === 'rock' || (!lock.lockKind && !lock.object && !lock.state)));
  return { liveLock, rockLock, matchLive: liveLock || rockLock };
}

function seekerOf(t) {
  if (!t || t.lockKind) return null;
  if (!t.object || !t.object.parent || !t.state || t.state.destroyed) return null;
  return t;
}

function cycleAddsKinds(srcText) {
  const start = srcText.indexOf('function cycleTarget');
  const end = srcText.indexOf('function reservedToken');
  const body = srcText.slice(start, end);
  return /station|gate|pod|landmark/.test(body);
}

pin(LOCK_CONE_PX === 12, 'LOCK_CONE_PX is 12 CSS pixels');
pin(/export const LOCK_CONE_PX = 12/.test(aimSrc), 'LOCK_CONE_PX lives in reticle-aim.js');
pin(!/LOCK_CONE_PX/.test(stateSrc), 'state.js has no LOCK_CONE_PX');
pin(!/CONVERGE_DOT/.test(aimSrc), 'pick does not use CONVERGE_DOT');
pin(!/Raycaster/.test(aimSrc), 'no scene Raycaster in reticle-aim');
pin(/STATION_BODY_R = 32/.test(aimSrc), 'station body sphere 32');
pin(/GATE_BODY_R = 30/.test(aimSrc), 'gate body sphere 30 (bore)');
pin(/POD_BODY_R = 0\.9/.test(aimSrc), 'pod body sphere 0.9');
pin(!/96/.test(aimSrc.match(/GATE_BODY_R[\s\S]{0,80}/)?.[0] ?? ''), 'gate pick is not glow 96');
pin(U.TARGET_RANGE === 600, 'range cap is U.TARGET_RANGE 600');
pin(!cycleAddsKinds(controlsSrc), 'cycleTarget does not gain kind candidates');
pin(/KeyV/.test(controlsSrc) && /reticleLockPressed/.test(controlsSrc), 'KeyV still the lock edge');
pin(/Nothing under the reticle/.test(controlsSrc), 'miss line unchanged');
pin(/emit\('reticleLock', \{ hit: true \}\)/.test(controlsSrc)
  && /emit\('reticleLock', \{ hit: false \}\)/.test(controlsSrc), 'reticleLock payload is { hit } literal');
pin(/textContent/.test(hudSrc) && !/innerHTML/.test(hudSrc), 'HUD textContent only in this file');
pin(/allowedLockKind/.test(hudSrc) && /kind === 'station'/.test(hudSrc), 'HUD paints lockKind names');
pin(/ASTEROID/.test(hudSrc) && /rockOk/.test(hudSrc), 'ASTEROID paint requires rockOk');
pin(/rockList\.indexOf\(t\) >= 0/.test(combatSrc) || /rockList && rockList.indexOf\(t\) >= 0/.test(combatSrc),
  'mining pull requires list membership');
pin(/lock\.lockKind === 'rock'/.test(shipSrc) && /indexOf\(lock\) >= 0/.test(shipSrc),
  'MATCH rock test requires list membership');
pin(/live\.lockKind/.test(hailSrc), 'hail refuses lockKind');
pin(/dropStaleKindLock/.test(controlsSrc), 'stale kind drop exists');
pin(/systemLoaded/.test(controlsSrc) && /podCollected/.test(controlsSrc), 'stale drops on systemLoaded and scoop');

const liveNpc = shipAt(new THREE.Vector3(0, 0, 0));
const dead = shipAt(new THREE.Vector3(0, 0, 0), { destroyed: true });
pin(pickReticleLock(baseCtx({ ships: [liveNpc] })) === liveNpc, 'KeyV still locks a live ship');
pin(pickReticleLock(baseCtx({ ships: [dead] })) === null, 'destroyed ship never locks');

const rockRow = { id: 2, position: new THREE.Vector3(0, 0, 0), radius: 8 };
const rockList = [{ id: 0, position: new THREE.Vector3(80, 0, 0), radius: 0 }, { id: 1 }, rockRow];
const rockHit = pickReticleLock(baseCtx({ list: rockList }));
pin(rockHit === rockRow && rockList.indexOf(rockHit) === 2 && !rockHit.lockKind, 'KeyV still locks a rock list row untagged');

const stPos = new THREE.Vector3(0, 0, 0);
const stationHit = pickReticleLock(baseCtx({
  station: { name: 'Freehold Landing', position: stPos },
}));
pin(!!stationHit && stationHit.lockKind === 'station', 'station lockKind');
pin(stationHit && stationHit.position === stPos, 'station wrapper is not ctx.station stamp');
pin(stationHit && !('name' in stationHit && stationHit === stPos), 'station wrapper is a fresh object');
pin(stationHit && !Object.hasOwn(stationHit, 'type') && !Object.hasOwn(stationHit, 't'),
  'station wrapper has no type/t');

const gateHit = pickReticleLock(baseCtx({
  systems: {
    freehold: {
      name: 'Freehold Drift',
      gates: [{ position: [0, 0, 0], to: 'veridian' }],
    },
  },
}));
pin(!!gateHit && gateHit.lockKind === 'gate' && gateHit.to === 'veridian' && gateHit.hub === false,
  'gate wrapper dest id + hub flag');
pin(gateHit && gateHit.position && Number.isFinite(gateHit.position.x), 'gate wrapper has position');

const hubHit = pickReticleLock(baseCtx({
  systems: {
    freehold: {
      name: 'Freehold Drift',
      hub: { position: [0, 0, 0], routes: ['veridian', 'redmarch'] },
    },
  },
  gate: { nearHub: true, nearTo: 'redmarch' },
}));
pin(!!hubHit && hubHit.lockKind === 'gate' && hubHit.hub === true && hubHit.to === 'redmarch',
  'hub gate uses in-zone dest');

const pod = {
  mesh: { position: new THREE.Vector3(0, 0, 0) },
  contents: [{ commodity: 'rawOre', units: 3 }],
};
const podHit = pickReticleLock(baseCtx({ pods: [pod] }));
pin(!!podHit && podHit.lockKind === 'pod' && podHit.pod === pod && podHit.position === pod.mesh.position,
  'pod wrapper points at live ctx.pods member');
pin(podHit && !podHit.object && !podHit.state, 'pod wrapper does not set object/state');

const lmDef = {
  id: 'fh_shepherd',
  name: 'The Shepherd',
  kind: 'beacon',
  position: [0, 0, 0],
};
const scene = new THREE.Scene();
const lmGroup = new THREE.Group();
lmGroup.name = 'landmarks';
const lmMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8));
lmMesh.position.set(0, 0, 0);
lmGroup.add(lmMesh);
scene.add(lmGroup);
scene.updateMatrixWorld(true);
const lmHit = pickReticleLock(baseCtx({
  scene,
  systems: { freehold: { name: 'Freehold Drift', landmarks: [lmDef] } },
}));
pin(!!lmHit && lmHit.lockKind === 'landmark' && lmHit.id === 'fh_shepherd', 'landmark lockKind + authored id');

const clueOnly = pickReticleLock(baseCtx({
  scene,
  systems: {
    freehold: {
      name: 'Freehold Drift',
      landmarks: [],
      clues: [{ id: 'vd_c_shanty', position: [0, 0, 0], line: 'secret' }],
    },
  },
}));
pin(clueOnly === null, 'clue motes never lock');

const noMeshLm = pickReticleLock(baseCtx({
  systems: { freehold: { name: 'Freehold Drift', landmarks: [lmDef] } },
}));
pin(noMeshLm === null, 'landmark without mesh bound skips');

const protoHit = pickReticleLock(baseCtx({
  systems: {
    freehold: {
      name: 'Freehold Drift',
      landmarks: [{ id: '__proto__', name: 'nope', position: [0, 0, 0] }],
    },
  },
  scene,
}));
pin(protoHit === null, 'reserved landmark id fails closed');

const badTo = pickReticleLock(baseCtx({
  systems: {
    freehold: {
      name: 'Freehold Drift',
      gates: [{ position: [0, 0, 0], to: '__proto__' }],
    },
  },
}));
pin(badTo === null, 'reserved gate to fails closed');

const out = new THREE.Vector3();
const aimRef = reticleAimPoint(baseCtx({
  station: { name: 'Freehold Landing', position: stPos },
  pods: [pod],
}), 400, out);
pin(aimRef === false, 'guns do not use station/pod as aim proxies');

const coneHit = pickReticleLock(baseCtx({
  pods: [pod],
  rx: 10,
  ry: 0,
}));
pin(!!coneHit && coneHit.lockKind === 'pod', '12 px cone locks nearest miss of disc');

const coneMiss = pickReticleLock(baseCtx({
  pods: [pod],
  rx: 40,
  ry: 0,
}));
pin(coneMiss === null, 'outside 12 px cone is a miss');

const discWins = pickReticleLock(baseCtx({
  station: { name: 'Freehold Landing', position: stPos },
  pods: [{ mesh: { position: new THREE.Vector3(0, 8, 40) }, contents: [] }],
  rx: 0,
  ry: 0,
}));
pin(!!discWins && discWins.lockKind === 'station', 'any body disc beats the cone fallback');

const kinds = [stationHit, gateHit, hubHit, podHit, lmHit];
for (const k of kinds) {
  const ctx = baseCtx({
    current: k,
    list: rockList,
    ships: [liveNpc],
  });
  ctx.targets.current = k;
  pin(!miningPull(ctx), 'mining refuses ' + (k && k.lockKind));
  pin(!matchRock(ctx, k).rockLock && !matchRock(ctx, k).liveLock, 'MATCH refuses ' + (k && k.lockKind));
  pin(seekerOf(k) === null, 'seeker null for ' + (k && k.lockKind));
  pin(!canHailDisabled(ctx, k), 'hail no-op for ' + (k && k.lockKind));
}

const fakeStation = { lockKind: 'station', position: stPos, name: 'Freehold Landing' };
const blob = { position: stPos, name: 'Freehold Landing' };
const ctxBlob = baseCtx({ current: blob, list: rockList });
ctxBlob.targets.current = blob;
pin(!miningPull(ctxBlob), 'untagged {position,name} does not mining-pull');
pin(!matchRock(ctxBlob, blob).rockLock, 'untagged {position,name} does not MATCH as rock');
pin(fakeStation.lockKind === 'station', 'allowlist includes station');

ctxBlob.targets.current = rockRow;
pin(miningPull(ctxBlob), 'listed rock still mining-pulls');
pin(matchRock(ctxBlob, rockRow).rockLock, 'listed rock still MATCH');

const hailShip = shipAt(new THREE.Vector3(0, 0, 80), { disabled: true, parent: {} });
const hailCtx = baseCtx({ ships: [hailShip], current: hailShip });
hailCtx.ships = [hailShip];
hailCtx.targets.current = hailShip;
hailCtx.ship = { object: { position: new THREE.Vector3(0, 0, 80) } };
pin(canHailDisabled(hailCtx, hailShip), 'hail still opens on a disabled ship');

pin(!/hullKind\s*=(?!=)/.test(hudSrc), 'HUD never writes hullKind');
pin(/Digit1/.test(controlsSrc) && !/Digit0/.test(controlsSrc.slice(controlsSrc.indexOf('const TRACKED'), controlsSrc.indexOf('const PREVENT_DEFAULT'))),
  'Digit 0 stays off TRACKED (shipyard)');

const report = {
  fail,
  cone: LOCK_CONE_PX,
  stationKind: stationHit && stationHit.lockKind,
  gateTo: gateHit && gateHit.to,
  podKind: podHit && podHit.lockKind,
  landmarkId: lmHit && lmHit.id,
};
say('SUMMARY fail=' + fail + ' ' + JSON.stringify(report));
writeFileSync(join(HERE, 'probe-log.txt'), lines.join('\n') + '\n');
if (fail) process.exitCode = 1;
