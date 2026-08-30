import * as THREE from 'three';
import {
  DOCK_STAGE_RANGE,
  DOCK_SETTLE_RANGE,
  dockApproachPoints,
  dockApproachProgress,
  dockShouldBrake,
} from '../src/game/dock-approach.js';
import {
  initAutopilot,
  tryApproachDock,
  dockApproachRefuseToken,
  disengage,
} from '../src/game/autopilot.js';
import { hoverTurnRateFor } from '../src/game/flight-feel.js';

let fails = 0;
function pin(name, ok) {
  if (ok) console.log('ok', name);
  else {
    fails += 1;
    console.log('FAIL', name);
  }
}

function makeCtx(x = 300, speed = 0, opts = {}) {
  const sx = Number.isFinite(opts.stationX) ? opts.stationX : 0;
  const sy = Number.isFinite(opts.stationY) ? opts.stationY : 0;
  const sz = Number.isFinite(opts.stationZ) ? opts.stationZ : 0;
  const px = Number.isFinite(opts.x) ? opts.x : x;
  const py = Number.isFinite(opts.y) ? opts.y : 0;
  const pz = Number.isFinite(opts.z) ? opts.z : 0;
  const position = new THREE.Vector3(px, py, pz);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(-1, 0, 0),
  );
  const ctx = {
    flags: {
      docked: false,
      paused: false,
      berthHold: false,
      chartOpen: false,
      matchSpeed: false,
    },
    world: { time: 0, currentSystem: 'freehold', nav: { autopilot: false } },
    systems: {
      freehold: {
        station: { position: [sx, sy, sz] },
        gates: [],
        sunRadius: Number.isFinite(opts.sunRadius) ? opts.sunRadius : 0,
      },
      veridian: { station: { position: [1000, 0, 0] }, gates: [], sunRadius: 0 },
    },
    station: {
      inZone: position.distanceTo(new THREE.Vector3(sx, sy, sz)) <= 45,
      name: 'Freehold Landing',
      position: new THREE.Vector3(sx, sy, sz),
    },
    ship: {
      object: { position, quaternion },
      speed,
      velocity: new THREE.Vector3(-speed, 0, 0),
      driftActive: false,
      burnerActive: false,
    },
    player: { classKey: 'light' },
    input: {
      steerX: 0,
      steerY: 0,
      strafeX: 0,
      strafeY: 0,
      roll: 0,
      throttleHeld: false,
      afterburnerPressed: false,
      driftHeld: false,
      fullStop: false,
    },
    gate: { jumping: false },
    automine: { engaged: false },
    flee: { engaged: false },
    asteroids: { list: [] },
    ships: [],
    config: {
      ship: { acceleration: 90, creep: 30, maxSpeed: 120 },
      world: { stationPosition: new THREE.Vector3(), sunPosition: new THREE.Vector3() },
    },
    lastEvents: [],
    events: [],
    emit(type, data = {}) { this.events.push({ type, t: this.world.time, ...data }); },
  };
  return ctx;
}

function flyFixture(x, facingX, setup) {
  const ctx = typeof setup === 'function' ? setup() : makeCtx(x, 0);
  if (typeof setup !== 'function') {
    ctx.ship.object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(facingX, 0, 0),
    );
  }
  const sys = initAutopilot(ctx);
  const token = tryApproachDock(ctx);
  const dt = 1 / 60;
  const forward = new THREE.Vector3();
  const targetVelocity = new THREE.Vector3();
  const delta = new THREE.Vector3();
  let minRange = Infinity;
  let minPos = null;
  let minPhase = '';
  let pulseFrames = 0;
  for (let i = 0; i < 30000 && !ctx.flags.docked; i++) {
    const range = ctx.ship.object.position.distanceTo(ctx.station.position);
    if (range < minRange) {
      minRange = range;
      minPos = ctx.ship.object.position.toArray();
      minPhase = ctx.autopilot.phase;
    }
    ctx.station.inZone = range <= 45;
    if (ctx.autopilot.phase === 'docking') pulseFrames += 1;
    if (pulseFrames >= 2) {
      ctx.flags.docked = true;
      ctx.emit('docked');
    }
    sys.update(dt, ctx);
    if (ctx.autopilot.engaged) {
      const turn = hoverTurnRateFor('light', ctx.ship.speed) * dt;
      if (ctx.autopilot.pitch) ctx.ship.object.quaternion
        .multiply(new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), ctx.autopilot.pitch * turn,
        ));
      if (ctx.autopilot.yaw) ctx.ship.object.quaternion
        .multiply(new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), -ctx.autopilot.yaw * turn,
        ));
      forward.set(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion);
      const targetSpeed = ctx.autopilot.idle
        ? 0
        : 30 + ctx.autopilot.throttle * 90;
      targetVelocity.copy(forward).multiplyScalar(targetSpeed);
      delta.subVectors(targetVelocity, ctx.ship.velocity);
      const maxStep = 90 * dt;
      if (delta.length() > maxStep) delta.setLength(maxStep);
      ctx.ship.velocity.add(delta);
      if (ctx.autopilot.throttle < 0.02) {
        ctx.ship.velocity.multiplyScalar(Math.exp(-0.5 * dt));
      }
      ctx.ship.object.position.addScaledVector(ctx.ship.velocity, dt);
      ctx.ship.speed = ctx.ship.velocity.length();
    }
    ctx.world.time += dt;
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
  sys.update(dt, ctx);
  return {
    token,
    docked: ctx.flags.docked,
    reason: ctx.autopilot.reason,
    phase: ctx.autopilot.phase,
    minRange,
    minPos,
    minPhase,
    pulseFrames,
  };
}

const points = dockApproachPoints({ x: 10, y: 20, z: 30 });
pin('geometry uses station +X corridor', points.stage.x === 10 + DOCK_STAGE_RANGE
  && points.settle.x === 10 + DOCK_SETTLE_RANGE
  && points.stage.y === 20 && points.settle.z === 30);
pin('geometry rejects non-finite station', dockApproachPoints({ x: NaN, y: 0, z: 0 }) === null);
pin('brake envelope brakes at stop distance', dockShouldBrake(20, 60, 90, 1) === true);
pin('brake envelope cruises outside stop distance', dockShouldBrake(30, 60, 90, 1) === false);
pin('progress monotonic', dockApproachProgress(300, 200, 0.5) === 0.5
  && dockApproachProgress(300, 100, 0.2) > 0.2);

const berthSide = flyFixture(300, -1);
pin('300u berth-side fixture docks through pulse', berthSide.token === ''
  && berthSide.docked === true && berthSide.reason === 'docked'
  && berthSide.phase === 'complete' && berthSide.pulseFrames >= 1
  && berthSide.minRange > 34.4);
const farSide = flyFixture(-600, 1);
if (!farSide.docked || farSide.minRange <= 34.4) {
  console.log('far-side diagnostic', JSON.stringify(farSide));
}
pin('600u far-side fixture routes around station and docks', farSide.token === ''
  && farSide.docked === true && farSide.reason === 'docked'
  && farSide.phase === 'complete' && farSide.pulseFrames >= 1
  && farSide.minRange > 34.4);

const liveSpawn = flyFixture(0, 0, () => {
  const ctx = makeCtx(0, 0, {
    x: 0, y: 30, z: 800,
    stationX: 120, stationY: 20, stationZ: 620,
    sunRadius: 60,
  });
  ctx.ship.object.quaternion.identity();
  ctx.ship.velocity.set(0, 0, 0);
  ctx.config.world.sunPosition = new THREE.Vector3(0, 0, 0);
  return ctx;
});
if (!liveSpawn.docked) {
  console.log('live-spawn diagnostic', JSON.stringify(liveSpawn));
}
pin('live Freehold spawn idle-turns then docks', liveSpawn.token === ''
  && liveSpawn.docked === true && liveSpawn.reason === 'docked'
  && liveSpawn.phase === 'complete' && liveSpawn.pulseFrames >= 1
  && liveSpawn.minRange > 34.4);

let ctx = makeCtx();
let sys = initAutopilot(ctx);
pin('outer approach engages stage', tryApproachDock(ctx) === ''
  && ctx.autopilot.mode === 'dock' && ctx.autopilot.phase === 'stage');
sys.update(1 / 60, ctx);
ctx.world.time = 11;
sys.update(1 / 60, ctx);
pin('stalled approach fails blocked', ctx.autopilot.engaged === false
  && ctx.autopilot.reason === 'blocked' && ctx.autopilot.phase === 'failed');

ctx = makeCtx();
sys = initAutopilot(ctx);
tryApproachDock(ctx);
ctx.world.currentSystem = 'veridian';
sys.update(1 / 60, ctx);
pin('system change loses station', ctx.autopilot.engaged === false
  && ctx.autopilot.reason === 'lost-station');

ctx = makeCtx();
sys = initAutopilot(ctx);
tryApproachDock(ctx);
ctx.gate.jumping = true;
sys.update(1 / 60, ctx);
pin('jump cancels approach', ctx.autopilot.reason === 'jumping');

ctx = makeCtx();
sys = initAutopilot(ctx);
tryApproachDock(ctx);
ctx.lastEvents = [{ type: 'bodyHit', t: 0, kind: 'station' }];
sys.update(1 / 60, ctx);
pin('impact cancels approach', ctx.autopilot.reason === 'impact');

ctx = makeCtx();
sys = initAutopilot(ctx);
tryApproachDock(ctx);
ctx.input.strafeX = 1;
sys.update(1 / 60, ctx);
pin('manual helm cancels approach', ctx.autopilot.reason === 'input');

ctx = makeCtx();
sys = initAutopilot(ctx);
tryApproachDock(ctx);
ctx.flags.paused = true;
sys.update(1 / 60, ctx);
const pauseHeld = ctx.autopilot.engaged === true
  && ctx.autopilot.phase === 'stage'
  && ctx.autopilot.idle === true;
ctx.flags.paused = false;
ctx.world.time = 1;
sys.update(1 / 60, ctx);
pin('active pause holds and resume revalidates', pauseHeld === true
  && ctx.autopilot.engaged === true && ctx.autopilot.phase === 'stage');

ctx = makeCtx(40, 0);
sys = initAutopilot(ctx);
pin('in-zone approach begins settle', tryApproachDock(ctx) === ''
  && ctx.autopilot.phase === 'settle');
sys.update(1 / 60, ctx);
pin('settle queues ordinary dock pulse once', ctx.autopilot.phase === 'docking'
  && ctx.autopilot.wantDock === true && ctx.autopilot.idle === true);
ctx.flags.docked = true;
ctx.world.time = 0.1;
sys.update(1 / 60, ctx);
pin('station dock state completes approach', ctx.autopilot.engaged === false
  && ctx.autopilot.phase === 'complete' && ctx.autopilot.reason === 'docked');

ctx = makeCtx(40, 0);
sys = initAutopilot(ctx);
tryApproachDock(ctx);
globalThis.document = {
  activeElement: null,
  getElementById(id) { return id === 'rw-title' ? { isConnected: true } : null; },
};
sys.update(1 / 60, ctx);
delete globalThis.document;
pin('refused dock pulse fails without retry', ctx.autopilot.engaged === false
  && ctx.autopilot.reason === 'dock-refused');

ctx = makeCtx();
ctx.flags.paused = true;
pin('pause command refusal', dockApproachRefuseToken(ctx) === 'paused');
ctx.flags.paused = false;
ctx.flags.docked = true;
pin('already docked command refusal', dockApproachRefuseToken(ctx) === 'docked');

ctx = makeCtx();
initAutopilot(ctx);
tryApproachDock(ctx);
disengage(ctx, 'restore');
pin('restore clears session approach', ctx.autopilot.engaged === false
  && ctx.autopilot.mode === '' && ctx.autopilot.phase === ''
  && ctx.autopilot.wantDock === false);

if (fails) {
  console.error(`DOCK APPROACH FAIL ${fails}`);
  process.exitCode = 1;
} else {
  console.log('DOCK APPROACH PASS');
}
