/**
 * Independent AP-path math. Does not reuse probe assertions.
 * Run: node --import ./scripts/with-css-stub.mjs out/w88/ap-path/verify/math-check.mjs
 */
import { PHY } from '../../../../src/game/physics.js';
import { JUMP } from '../../../../src/game/state.js';
import {
  planApPath,
  sphereChordHit,
  keepRadius,
  throttleForPath,
  interceptOk,
  AP_KEEP_PAD,
  AP_LEAD_MARGIN,
} from '../../../../src/game/ap-path.js';

const lines = [];
const fails = [];
function log(s) { lines.push(s); console.log(s); }
function check(name, pass, extra) {
  const row = `${pass ? 'ok' : 'FAIL'} ${name}${extra ? ` ${JSON.stringify(extra)}` : ''}`;
  log(row);
  if (!pass) fails.push(name);
}

const heatR = 60 * PHY.SUN_HEAT_MULT;
const keepSun = heatR + PHY.PLAYER_RADIUS + AP_KEEP_PAD;
const sunBody = { kind: 'sun', x: 0, y: 0, z: 0, r: heatR };

function chordVsKeep(ax, ay, az, bx, by, bz, r) {
  const hit = sphereChordHit(ax, ay, az, bx, by, bz, 0, 0, 0, r);
  return hit;
}

// --- Probe geometry: ship (0,30,800) → gate (0,60,-900) ---
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
const aimD = Math.hypot(sunPlan.ax, sunPlan.ay, sunPlan.az);
const chordKeep = chordVsKeep(0, 30, 800, sunPlan.ax, sunPlan.ay, sunPlan.az, keepSun);
const chordHeat = chordVsKeep(0, 30, 800, sunPlan.ax, sunPlan.ay, sunPlan.az, heatR);
log(`sunPlan ${JSON.stringify({
  hold: sunPlan.hold, ax: sunPlan.ax, ay: sunPlan.ay, az: sunPlan.az, aimD, keepSun, heatR,
  chordKeep, chordHeat,
})}`);
check('waypoint on/outside keep sphere', sunPlan.hold === 'detour' && aimD >= keepSun - 1e-6);
check(
  'OWNER: ship→aim chord must not enter keep interior',
  !chordKeep.hit && !chordKeep.inside,
  { hit: chordKeep.hit, dist: chordKeep.dist, t: chordKeep.t, inside: !!chordKeep.inside },
);
check('ship→aim chord stays outside heat radius', !chordHeat.hit);

// --- Closer approach: still blocked, offset waypoint on sphere ---
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
const closeKeep = chordVsKeep(0, 0, 200, closeSun.ax, closeSun.ay, closeSun.az, keepSun);
const closeHeat = chordVsKeep(0, 0, 200, closeSun.ax, closeSun.ay, closeSun.az, heatR);
log(`closeSun ${JSON.stringify({
  hold: closeSun.hold, ax: closeSun.ax, ay: closeSun.ay, az: closeSun.az,
  closeKeep, closeHeat,
})}`);
check(
  'closer ship→aim chord clears keep',
  !closeKeep.hit && !closeKeep.inside,
  { hit: closeKeep.hit, dist: closeKeep.dist, t: closeKeep.t, heatHit: closeHeat.hit, heatDist: closeHeat.dist },
);
check(
  'closer ship→aim chord clears heat (original flies-through-sun)',
  !closeHeat.hit && !(closeHeat.dist < heatR && closeHeat.t >= 0 && closeHeat.t <= 1),
  { hit: closeHeat.hit, dist: closeHeat.dist, t: closeHeat.t },
);

// --- Freehold station-ish spawn → veridian gate ---
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
const fhKeep = chordVsKeep(120, 20, 620, fh.ax, fh.ay, fh.az, keepSun);
const fhHeat = chordVsKeep(120, 20, 620, fh.ax, fh.ay, fh.az, heatR);
const fhDirect = chordVsKeep(120, 20, 620, 0, 60, -900, keepSun);
log(`freehold ${JSON.stringify({ hold: fh.hold, ax: fh.ax, ay: fh.ay, az: fh.az, fhKeep, fhHeat, fhDirect })}`);
check('freehold direct chord hits keep (scenario valid)', fhDirect.hit);
check(
  'freehold ship→aim chord clears keep',
  fh.hold === 'detour' && !fhKeep.hit && !fhKeep.inside,
  { hit: fhKeep.hit, dist: fhKeep.dist, t: fhKeep.t },
);

// --- Step toward aim from probe spawn; replan each step (flight sim, no physics) ---
let sx = 0, sy = 30, sz = 800;
let minKeep = Infinity;
let minHeat = Infinity;
let enteredKeep = false;
let enteredHeat = false;
for (let i = 0; i < 80; i++) {
  const p = planApPath({
    px: sx, py: sy, pz: sz,
    gx: 0, gy: 60, gz: -900,
    hx: fh.ax - sx, hy: fh.ay - sy, hz: fh.az - sz,
    bodies: { count: 1, items: [sunBody] },
    shipR: PHY.PLAYER_RADIUS,
    classKey: 'light',
    speed: 80,
    zone: JUMP.zone,
  });
  const dSun = Math.hypot(sx, sy, sz);
  if (dSun < minKeep) minKeep = dSun;
  if (dSun < minHeat) minHeat = dSun;
  if (dSun < keepSun) enteredKeep = true;
  if (dSun < heatR) enteredHeat = true;
  const dx = p.ax - sx, dy = p.ay - sy, dz = p.az - sz;
  const len = Math.hypot(dx, dy, dz) || 1;
  sx += (dx / len) * 20;
  sy += (dy / len) * 20;
  sz += (dz / len) * 20;
}
log(`stepSim minSunDist=${minKeep} keep=${keepSun} heat=${heatR} enteredKeep=${enteredKeep} enteredHeat=${enteredHeat} end=${JSON.stringify({ sx, sy, sz })}`);
check('greedy steps toward planned aim stay outside keep', !enteredKeep, { minKeep, keepSun });
check('greedy steps toward planned aim stay outside heat', !enteredHeat, { minHeat, heatR });

// --- Close intercept ---
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
const aimFromShip = Math.hypot(close.ax - 80, close.ay, close.az);
const aimFromGate = Math.hypot(close.ax, close.ay, close.az);
log(`closeFrigate ${JSON.stringify({ hold: close.hold, intercept: close.intercept, th, aimFromShip, aimFromGate, turnR: close.turnR, distGate: close.distGate })}`);
check('close frigate does not interceptOk', close.intercept === false);
check('close frigate throttle 0 while turning', th <= 0.02);
check('close frigate widen not a gate-circle', close.hold === 'widen' && aimFromGate > JUMP.zone);

const aligned = planApPath({
  px: 80, py: 0, pz: 0,
  gx: 0, gy: 0, gz: 0,
  hx: -1, hy: 0, hz: 0,
  bodies: { count: 0, items: [] },
  classKey: 'frigate',
  speed: 40,
  zone: JUMP.zone,
});
const thA = throttleForPath(aligned.hold, aligned.intercept, 1, aligned.distGate, aligned.turnR);
log(`alignedClose ${JSON.stringify({ hold: aligned.hold, intercept: aligned.intercept, thA, ok: interceptOk(80, 0, JUMP.zone, aligned.turnR) })}`);
check('aligned close still intercepts / approaches', aligned.intercept === true && aligned.hold === 'none' && thA > 0.2);

const lightClose = planApPath({
  px: 80, py: 0, pz: 0,
  gx: 0, gy: 0, gz: 0,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 0, items: [] },
  classKey: 'light',
  speed: 40,
  zone: JUMP.zone,
});
const thL = throttleForPath(lightClose.hold, lightClose.intercept, 0, lightClose.distGate, lightClose.turnR);
log(`lightClose ${JSON.stringify({ hold: lightClose.hold, intercept: lightClose.intercept, thL, turnR: lightClose.turnR })}`);
check('light close misaligned does not interceptOk', lightClose.intercept === false);
check('light close throttle 0 or widen, no orbit', thL <= 0.02 || lightClose.hold === 'widen');

// --- Inside keep-out ---
const inside = planApPath({
  px: 0, py: 0, pz: 50,
  gx: 0, gy: 60, gz: -900,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 1, items: [sunBody] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const inHit = sphereChordHit(0, 0, 50, 0, 60, -900, 0, 0, 0, keepSun);
const inAimD = Math.hypot(inside.ax, inside.ay, inside.az);
log(`inside ${JSON.stringify({ hold: inside.hold, ax: inside.ax, ay: inside.ay, az: inside.az, inAimD, inHit })}`);
check('inside keep: sphereChordHit.inside', inHit.inside === true && inHit.hit === true);
check('inside keep: still plans a finite detour', inside.ok && inside.hold === 'detour' && Number.isFinite(inside.ax));
check('inside keep: aim not NaN', Number.isFinite(inside.ax) && Number.isFinite(inside.ay) && Number.isFinite(inside.az));

// --- Gate inside keep (skip body) ---
const gateInside = planApPath({
  px: 0, py: 0, pz: 800,
  gx: 0, gy: 0, gz: 40,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 1, items: [sunBody] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const giChord = chordVsKeep(0, 0, 800, gateInside.ax, gateInside.ay, gateInside.az, keepSun);
log(`gateInsideKeep ${JSON.stringify({ hold: gateInside.hold, ax: gateInside.ax, ay: gateInside.ay, az: gateInside.az, giChord })}`);
check(
  'gate inside keep: skip body (aim is gate, chord through sun)',
  gateInside.hold !== 'detour',
  { hold: gateInside.hold, aim: [gateInside.ax, gateInside.ay, gateInside.az], chordHit: giChord.hit },
);

// Far-side gate OUTSIDE keep must still detour (not skip)
const farGate = planApPath({
  px: 0, py: 0, pz: 800,
  gx: 0, gy: 0, gz: -400,
  hx: 0, hy: 0, hz: -1,
  bodies: { count: 1, items: [sunBody] },
  shipR: PHY.PLAYER_RADIUS,
  classKey: 'light',
  speed: 80,
  zone: JUMP.zone,
});
const farChord = chordVsKeep(0, 0, 800, farGate.ax, farGate.ay, farGate.az, keepSun);
log(`farGate ${JSON.stringify({ hold: farGate.hold, ax: farGate.ax, ay: farGate.ay, az: farGate.az, farChord, gateClear: 400, keepSun })}`);
check('far-side gate outside keep still detours', farGate.hold === 'detour');
check(
  'far-side ship→aim chord clears keep',
  !farChord.hit && !farChord.inside,
  { hit: farChord.hit, dist: farChord.dist, t: farChord.t },
);

// --- Two obstacles ---
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
const twoSun = chordVsKeep(0, 0, 800, two.ax, two.ay, two.az, keepSun);
const twoSt = sphereChordHit(0, 0, 800, two.ax, two.ay, two.az, station.x, station.y, station.z, stKeep);
log(`twoObst ${JSON.stringify({ hold: two.hold, ax: two.ax, ay: two.ay, az: two.az, stKeep, twoSun, twoSt })}`);
check(
  'two obstacles: ship→aim misses sun keep',
  !twoSun.hit,
  { hit: twoSun.hit, dist: twoSun.dist },
);
check(
  'two obstacles: ship→aim misses station keep',
  !twoSt.hit,
  { hit: twoSt.hit, dist: twoSt.dist, stKeep },
);

// --- keepRadius composition ---
check('keepRadius sun = heat + ship + pad', Math.abs(keepRadius(sunBody, PHY.PLAYER_RADIUS, AP_KEEP_PAD) - keepSun) < 1e-9);
check('AP_LEAD_MARGIN is 1.25', AP_LEAD_MARGIN === 1.25);

if (fails.length) {
  log(`MATH CHECK FAIL ${JSON.stringify(fails)}`);
  process.exitCode = 1;
} else {
  log('MATH CHECK PASS');
}
