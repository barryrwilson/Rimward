/**
 * Independent chord recompute. Uses src/game/ap-path.js planApPath for aims.
 * Closest-approach test is local, not a copy of sphereChordHit.
 */
import { PHY } from '../../../../src/game/physics.js';
import { JUMP } from '../../../../src/game/state.js';
import {
  planApPath,
  sphereChordHit,
  keepRadius,
  throttleForPath,
  AP_KEEP_PAD,
} from '../../../../src/game/ap-path.js';

const lines = [];
const fails = [];
function log(s) { lines.push(s); console.log(s); }
function check(name, pass, extra) {
  const row = `${pass ? 'ok' : 'FAIL'} ${name}${extra ? ` ${JSON.stringify(extra)}` : ''}`;
  log(row);
  if (!pass) fails.push(name);
}

function indepClosest(ax, ay, az, bx, by, bz, cx, cy, cz) {
  const d0 = Math.hypot(ax - cx, ay - cy, az - cz);
  const d1 = Math.hypot(bx - cx, by - cy, bz - cz);
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const ab2 = abx * abx + aby * aby + abz * abz;
  let t = 0;
  if (ab2 > 1e-20) {
    t = ((cx - ax) * abx + (cy - ay) * aby + (cz - az) * abz) / ab2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  const px = ax + abx * t;
  const py = ay + aby * t;
  const pz = az + abz * t;
  const dist = Math.hypot(px - cx, py - cy, pz - cz);
  const endpointInside = d0 < 1e30; // placeholder
  return { t, dist, d0, d1, px, py, pz };
}

function indepHit(ax, ay, az, bx, by, bz, cx, cy, cz, r) {
  const c = indepClosest(ax, ay, az, bx, by, bz, cx, cy, cz);
  const hit = c.d0 < r || c.d1 < r || c.dist < r;
  return { ...c, hit, r };
}

const heatR = 60 * PHY.SUN_HEAT_MULT;
const keepSun = heatR + PHY.PLAYER_RADIUS + AP_KEEP_PAD;
const sunBody = { kind: 'sun', x: 0, y: 0, z: 0, r: heatR };
log(`constants heatR=${heatR} keepSun=${keepSun} PLAYER_RADIUS=${PHY.PLAYER_RADIUS} pad=${AP_KEEP_PAD} JUMP.zone=${JUMP.zone}`);
check('keepSun is 158.4', Math.abs(keepSun - 158.4) < 1e-9);
check('heatR is 144', Math.abs(heatR - 144) < 1e-9);

function planSun(px, py, pz, gx, gy, gz, extra = {}) {
  return planApPath({
    px, py, pz, gx, gy, gz,
    hx: extra.hx ?? 0, hy: extra.hy ?? 0, hz: extra.hz ?? -1,
    bodies: extra.bodies ?? { count: 1, items: [sunBody] },
    shipR: PHY.PLAYER_RADIUS,
    classKey: extra.classKey || 'light',
    speed: extra.speed ?? 80,
    zone: JUMP.zone,
    sideHint: extra.sideHint,
  });
}

// --- Owner case 1: (0,30,800) → (0,60,-900) ---
const p1 = planSun(0, 30, 800, 0, 60, -900);
const c1 = indepHit(0, 30, 800, p1.ax, p1.ay, p1.az, 0, 0, 0, keepSun);
const src1 = sphereChordHit(0, 30, 800, p1.ax, p1.ay, p1.az, 0, 0, 0, keepSun);
log(`case1 plan ${JSON.stringify({ hold: p1.hold, aim: [p1.ax, p1.ay, p1.az], aimD: Math.hypot(p1.ax, p1.ay, p1.az) })}`);
log(`case1 indep ${JSON.stringify(c1)}`);
log(`case1 src sphereChordHit ${JSON.stringify(src1)}`);
check('case1 detour', p1.hold === 'detour');
check('case1 independent: not a keep hit', !c1.hit);
check('case1 independent: closest >= keep', c1.dist + 1e-9 >= keepSun, { dist: c1.dist, keepSun });
check('case1 source sphereChordHit not a hit', src1.hit === false);

// --- Owner case 2: closer spawn (0,0,200), must not enter heat 144 ---
const p2 = planSun(0, 0, 200, 0, 60, -900);
const c2k = indepHit(0, 0, 200, p2.ax, p2.ay, p2.az, 0, 0, 0, keepSun);
const c2h = indepHit(0, 0, 200, p2.ax, p2.ay, p2.az, 0, 0, 0, heatR);
log(`case2 plan ${JSON.stringify({ hold: p2.hold, aim: [p2.ax, p2.ay, p2.az] })}`);
log(`case2 indep keep ${JSON.stringify(c2k)}`);
log(`case2 indep heat ${JSON.stringify(c2h)}`);
check('case2 detour', p2.hold === 'detour');
check('case2 independent: chord misses keep', !c2k.hit && c2k.dist + 1e-9 >= keepSun, { dist: c2k.dist });
check('case2 independent: chord misses heat 144', !c2h.hit && c2h.dist + 1e-9 >= heatR, { dist: c2h.dist, heatR });

// --- Owner case 3: two-body sun+station ---
const station = { kind: 'station', x: 80, y: 0, z: 200, r: 40, y0: -20, y1: 20 };
const stKeep = keepRadius(station, PHY.PLAYER_RADIUS, AP_KEEP_PAD);
const p3 = planSun(0, 0, 800, 0, 60, -900, {
  bodies: { count: 2, items: [sunBody, station] },
});
const c3s = indepHit(0, 0, 800, p3.ax, p3.ay, p3.az, 0, 0, 0, keepSun);
const c3t = indepHit(0, 0, 800, p3.ax, p3.ay, p3.az, station.x, station.y, station.z, stKeep);
log(`case3 plan ${JSON.stringify({ hold: p3.hold, aim: [p3.ax, p3.ay, p3.az], stKeep })}`);
log(`case3 sun ${JSON.stringify(c3s)}`);
log(`case3 station ${JSON.stringify(c3t)}`);
check('case3 detour', p3.hold === 'detour');
check('case3 independent: misses sun keep', !c3s.hit && c3s.dist + 1e-9 >= keepSun);
check('case3 independent: misses station keep', !c3t.hit && c3t.dist + 1e-9 >= stKeep);

// Adverse lateral (force +X toward station)
const p3b = planSun(0, 0, 800, 0, 60, -900, {
  bodies: { count: 2, items: [sunBody, station] },
  sideHint: -1,
});
const c3bs = indepHit(0, 0, 800, p3b.ax, p3b.ay, p3b.az, 0, 0, 0, keepSun);
const c3bt = indepHit(0, 0, 800, p3b.ax, p3b.ay, p3b.az, station.x, station.y, station.z, stKeep);
log(`case3 adverse ${JSON.stringify({ hold: p3b.hold, aim: [p3b.ax, p3b.ay, p3b.az] })}`);
log(`case3 adverse sun ${JSON.stringify(c3bs)}`);
log(`case3 adverse station ${JSON.stringify(c3bt)}`);
check('case3 adverse: misses sun keep', !c3bs.hit && c3bs.dist + 1e-9 >= keepSun);
check('case3 adverse: misses station keep', !c3bt.hit && c3bt.dist + 1e-9 >= stKeep);

// --- Owner case 4: B-inside (0,0,800)→(0,0,40) must be hit=true ---
const bIn = indepHit(0, 0, 800, 0, 0, 40, 0, 0, 0, keepSun);
const bSrc = sphereChordHit(0, 0, 800, 0, 0, 40, 0, 0, 0, keepSun);
log(`case4 indep ${JSON.stringify(bIn)}`);
log(`case4 src ${JSON.stringify(bSrc)}`);
check('case4 independent B inside is hit', bIn.hit === true && bIn.d1 < keepSun, { d1: bIn.d1, t: bIn.t });
check('case4 source sphereChordHit hit=true', bSrc.hit === true, { t: bSrc.t, dist: bSrc.dist, tUn: bSrc.tUn });

// --- Close-gate frigate 80u heading 90° ---
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
const aimFromGate = Math.hypot(close.ax, close.ay, close.az);
log(`closeFrigate ${JSON.stringify({ hold: close.hold, intercept: close.intercept, th, aimFromGate, turnR: close.turnR, distGate: close.distGate })}`);
check('close frigate heading 90: intercept false', close.intercept === false);
check('close frigate hold=widen', close.hold === 'widen');
check('close frigate throttle 0', th === 0);
check('close frigate aim not a gate circle', aimFromGate > JUMP.zone);

if (fails.length) {
  log(`RECOMPUTE FAIL ${JSON.stringify(fails)}`);
  process.exitCode = 1;
} else {
  log('RECOMPUTE PASS');
}
