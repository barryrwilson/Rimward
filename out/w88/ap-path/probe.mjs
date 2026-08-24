/**
 * Headless AP path math pins (sun detour + no-orbit).
 * Run: node out/w88/ap-path/probe.mjs
 */
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { PHY } from '../../../src/game/physics.js';
import { JUMP, SYSTEMS } from '../../../src/game/state.js';
import { TURN_MIN_RADIUS } from '../../../src/game/flight-feel.js';
import {
  planApPath,
  throttleForPath,
  effectiveTurnRadius,
  sphereChordHit,
  keepRadius,
  AP_KEEP_PAD,
} from '../../../src/game/ap-path.js';
import { initAutopilot, tryEngage, disengage } from '../../../src/game/autopilot.js';
import { plotRoute } from '../../../src/game/nav.js';

const errors = [];
function ok(name, pass, extra) {
  if (!pass) errors.push(name);
  console.log(`${pass ? 'ok' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

const heatR = 60 * PHY.SUN_HEAT_MULT;
const keepSun = heatR + PHY.PLAYER_RADIUS + AP_KEEP_PAD;
const sunBody = { kind: 'sun', x: 0, y: 0, z: 0, r: heatR };
const sunPlan = planApPath({
  px: 0, py: 30, pz: 800,
  gx: 0, gy: 60, gz: -900,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 1, items: [sunBody] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const sunAimD = Math.hypot(sunPlan.ax, sunPlan.ay, sunPlan.az);
const sunChord = sphereChordHit(0, 30, 800, sunPlan.ax, sunPlan.ay, sunPlan.az, 0, 0, 0, keepSun);
const sunHeat = sphereChordHit(0, 30, 800, sunPlan.ax, sunPlan.ay, sunPlan.az, 0, 0, 0, heatR);
ok('chord-through-sun: ship→aim misses keep interior',
  sunPlan.hold === 'detour' && !sunChord.hit && !sunChord.inside && !sunHeat.hit && sunAimD > heatR,
  JSON.stringify({ hold: sunPlan.hold, sunAimD, heatR, keepSun, dist: sunChord.dist, t: sunChord.t }));

const closeSun = planApPath({
  px: 0, py: 0, pz: 200,
  gx: 0, gy: 60, gz: -900,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 1, items: [sunBody] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const closeChord = sphereChordHit(0, 0, 200, closeSun.ax, closeSun.ay, closeSun.az, 0, 0, 0, keepSun);
ok('closer spawn: ship→aim misses keep',
  closeSun.hold === 'detour' && !closeChord.hit && !closeChord.inside,
  JSON.stringify({ dist: closeChord.dist, t: closeChord.t }));

const fh = planApPath({
  px: 120, py: 20, pz: 620,
  gx: 0, gy: 60, gz: -900,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 1, items: [sunBody] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const fhChord = sphereChordHit(120, 20, 620, fh.ax, fh.ay, fh.az, 0, 0, 0, keepSun);
ok('freehold-like spawn: ship→aim misses keep',
  fh.hold === 'detour' && !fhChord.hit && !fhChord.inside,
  JSON.stringify({ dist: fhChord.dist, t: fhChord.t }));

const bInside = sphereChordHit(0, 0, 800, 0, 0, 40, 0, 0, 0, keepSun);
ok('sphereChordHit: interior endpoint B is a hit',
  bInside.hit === true,
  JSON.stringify({ t: bInside.t, dist: bInside.dist }));

const station = { kind: 'station', x: 80, y: 0, z: 200, r: 40, y0: -20, y1: 20 };
const two = planApPath({
  px: 0, py: 0, pz: 800,
  gx: 0, gy: 60, gz: -900,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 2, items: [sunBody, station] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const stKeep = keepRadius(station, PHY.PLAYER_RADIUS, AP_KEEP_PAD);
const twoSun = sphereChordHit(0, 0, 800, two.ax, two.ay, two.az, 0, 0, 0, keepSun);
const twoSt = sphereChordHit(0, 0, 800, two.ax, two.ay, two.az, station.x, station.y, station.z, stKeep);
ok('two obstacles: ship→aim misses sun and station keep',
  two.hold === 'detour' && !twoSun.hit && !twoSt.hit,
  JSON.stringify({ twoSun: twoSun.dist, twoSt: twoSt.dist, stKeep }));

ok('resume gate when chord clear',
  planApPath({
    px: 0, py: 0, pz: 800,
    gx: 0, gy: 0, gz: -900,
    hx: 0, hy: 0, hz: -1,
    bodies: { count: 0, items: [] },
    classKey: 'light',
    speed: 80,
    zone: JUMP.zone,
  }).hold === 'none');

const frR = effectiveTurnRadius('frigate', 40);
ok('frigate turn radius uses flight-feel table',
  Math.abs(frR - TURN_MIN_RADIUS.frigate) < 1e-6, `r=${frR}`);

const close = planApPath({
  px: 80, py: 0, pz: 0,
  gx: 0, gy: 0, gz: 0,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 0, items: [] },
  classKey: 'frigate',
  speed: 40,
  zone: JUMP.zone,
});
const th = throttleForPath(close.hold, close.intercept, 0, close.distGate, close.turnR);
const aimD = Math.hypot(close.ax - 80, close.ay, close.az);
ok('close misaligned frigate widens, throttle 0',
  close.hold === 'widen' && th <= 0.02 && aimD > 80,
  JSON.stringify({ hold: close.hold, th, aimD, turnR: close.turnR }));

ok('NaN fail-closed',
  planApPath({ px: Number.NaN, py: 0, pz: 0, gx: 1, gy: 0, gz: 0 }).ok === false);

function dummyRenderer() {
  return {
    domElement: { style: {} },
    setSize() {},
    setPixelRatio() {},
    setAnimationLoop() {},
    render() {},
  };
}

const ctx = createCtx({
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(70, 1, 0.1, 20000),
  renderer: dummyRenderer(),
});
ctx.systems = SYSTEMS;
ctx.player = { hull: 100, hullMax: 100, classKey: 'light' };
ctx.ship.object = {
  position: new THREE.Vector3(80, 60, -900),
  quaternion: new THREE.Quaternion(),
};
ctx.ship.speed = 30;
ctx.world.currentSystem = 'freehold';
ctx.flags.paused = false;
ctx.flags.docked = false;
ctx.flags.combat = false;
ctx.flags.matchSpeed = false;
ctx.gate.jumping = false;
ctx.gate.inZone = false;
ctx.gate.nearTo = null;
const api = initAutopilot(ctx);
plotRoute(ctx, 'veridian');
const tok = tryEngage(ctx);
api.update(0.016, ctx);
const noOrbitCmd = tok === ''
  && ctx.autopilot.throttle <= 0.02
  && Math.abs(ctx.autopilot.yaw) >= 0.9
  && ctx.autopilot.wantJump === false;
ok('close misaligned spawn: throttle 0, yaw saturates, no wantJump',
  noOrbitCmd,
  JSON.stringify({
    tok,
    th: ctx.autopilot.throttle,
    yaw: ctx.autopilot.yaw,
    wantJump: ctx.autopilot.wantJump,
  }));
disengage(ctx, 'cancel');

ctx.flags.paused = false;
ctx.flags.docked = false;
ctx.flags.combat = false;
ctx.flags.matchSpeed = false;
ctx.gate.jumping = false;
ctx.gate.inZone = false;
ctx.gate.nearTo = null;
ctx.ship.object.position.set(0, 30, 800);
ctx.ship.object.quaternion.identity();
ctx.ship.speed = 80;
ctx.config.world.sunPosition.set(0, 0, 0);
plotRoute(ctx, 'veridian');
const tokSun = tryEngage(ctx);
api.update(0.016, ctx);
const sunYaw = Math.abs(ctx.autopilot.yaw);
ok('live AP sun chord yaws off the direct gate line',
  tokSun === '' && sunYaw > 0.2 && ctx.autopilot.wantJump === false,
  JSON.stringify({ tokSun, yaw: ctx.autopilot.yaw, th: ctx.autopilot.throttle }));
disengage(ctx, 'cancel');

ctx.gate.inZone = true;
ctx.gate.nearTo = 'veridian';
ctx.ship.object.position.set(0, 60, -900);
ctx.ship.object.quaternion.identity();
ctx.ship.speed = 10;
plotRoute(ctx, 'veridian');
const tokZone = tryEngage(ctx);
api.update(0.016, ctx);
ok('in-zone wantJump stays gate-predicate only',
  tokZone === '' && ctx.autopilot.wantJump === true,
  JSON.stringify({ tokZone, wantJump: ctx.autopilot.wantJump, nearTo: ctx.gate.nearTo }));
disengage(ctx, 'cancel');

if (errors.length) {
  console.log('AP PATH PROBE FAIL', errors);
  process.exit(1);
}
console.log('AP PATH PROBE PASS');
