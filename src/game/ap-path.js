/**
 * Autopilot geometric pathing. Pure math. No ctx writes, no mesh, no input.
 * Chord detour around keep-out spheres; lead-out / hover when the gate sits
 * inside the class turn circle.
 */

import { turnRateFor, TURN_MIN_RADIUS } from './flight-feel.js';
import { PHY } from './physics.js';

export const AP_KEEP_PAD = 12;
export const AP_LEAD_MARGIN = 1.25;
export const AP_ALIGN_IN = 0.86;
/** Extra radius for an outside tangent so closest approach is strictly > keep. */
const TANGENT_CLEAR = 1;
const DETOUR_ITERS = 8;

const EPS = 1e-10;

function finite3(x, y, z) {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
}

function hypot3(x, y, z) {
  return Math.hypot(x, y, z);
}

function bodyCount(bodies) {
  if (!bodies) return 0;
  if (Array.isArray(bodies)) return bodies.length;
  const n = bodies.count;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function bodyAt(bodies, i) {
  if (!bodies) return null;
  if (Array.isArray(bodies)) return bodies[i];
  const items = bodies.items;
  return items ? items[i] : null;
}

function skipKeepBody(kind) {
  return kind === 'gate' || kind === 'player' || kind === 'ship' || kind === 'asteroid';
}

/** Keep-out radius for a collected body. 0 = ignore. */
export function keepRadius(body, shipR, pad) {
  if (!body) return 0;
  if (skipKeepBody(body.kind)) return 0;
  if (!finite3(body.x, body.y, body.z)) return 0;
  let r = Number.isFinite(body.r) && body.r > 0 ? body.r : 0;
  if (body.kind === 'station') {
    const hy = Math.max(Math.abs(body.y0 || 0), Math.abs(body.y1 || 0));
    r = Math.hypot(r, hy);
  }
  if (!(r > 0)) return 0;
  const sr = Number.isFinite(shipR) && shipR > 0 ? shipR : PHY.PLAYER_RADIUS;
  const p = Number.isFinite(pad) && pad > 0 ? pad : AP_KEEP_PAD;
  return r + sr + p;
}

/**
 * Instantaneous min turn radius from turnRateFor (not a second table).
 * High-speed cap on omega grows the radius above TURN_MIN_RADIUS.
 */
export function effectiveTurnRadius(classKey, speed) {
  const key = Object.hasOwn(TURN_MIN_RADIUS, classKey) ? classKey : 'light';
  const floor = TURN_MIN_RADIUS[key] || TURN_MIN_RADIUS.light;
  const omega = turnRateFor(key, speed);
  if (!Number.isFinite(omega) || omega <= 1e-8) return floor;
  const s = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const r = Math.max(s, 8) / omega;
  if (!Number.isFinite(r) || r <= 0) return floor;
  return r;
}

export function sphereChordHit(ax, ay, az, bx, by, bz, cx, cy, cz, r) {
  if (!finite3(ax, ay, az) || !finite3(bx, by, bz) || !finite3(cx, cy, cz)) {
    return { hit: false, t: 0, dist: 0, px: ax, py: ay, pz: az };
  }
  if (!(r > 0) || !Number.isFinite(r)) {
    return { hit: false, t: 0, dist: 0, px: ax, py: ay, pz: az };
  }
  const d0 = hypot3(ax - cx, ay - cy, az - cz);
  if (d0 < r) {
    return { hit: true, t: 0, dist: d0, px: ax, py: ay, pz: az, inside: true };
  }
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const ab2 = abx * abx + aby * aby + abz * abz;
  if (ab2 < EPS) {
    return { hit: d0 < r, t: 0, dist: d0, px: ax, py: ay, pz: az };
  }
  const d1 = hypot3(bx - cx, by - cy, bz - cz);
  let tUn = ((cx - ax) * abx + (cy - ay) * aby + (cz - az) * abz) / ab2;
  let t = tUn;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const px = ax + abx * t;
  const py = ay + aby * t;
  const pz = az + abz * t;
  const dist = hypot3(px - cx, py - cy, pz - cz);
  const hit = dist < r || d1 < r;
  return { hit, t, dist, px, py, pz, tUn };
}

function perpUnit(abx, aby, abz) {
  let px = -abz;
  let py = 0;
  let pz = abx;
  let len = hypot3(px, py, pz);
  if (len < 1e-8) {
    px = 0;
    py = abz;
    pz = -aby;
    len = hypot3(px, py, pz);
  }
  if (len < 1e-8) return { x: 1, y: 0, z: 0 };
  return { x: px / len, y: py / len, z: pz / len };
}

export function headingError(hx, hy, hz, dx, dy, dz) {
  if (!finite3(hx, hy, hz) || !finite3(dx, dy, dz)) return Math.PI;
  const hl = hypot3(hx, hy, hz);
  const dl = hypot3(dx, dy, dz);
  if (hl < EPS || dl < EPS) return Math.PI;
  const c = Math.max(-1, Math.min(1, (hx * dx + hy * dy + hz * dz) / (hl * dl)));
  return Math.acos(c);
}

export function interceptOk(dist, yawAbs, zone, turnR) {
  if (!Number.isFinite(dist) || !Number.isFinite(yawAbs) || !Number.isFinite(zone) || !Number.isFinite(turnR)) {
    return false;
  }
  const d = dist < 0 ? 0 : dist;
  const yaw = Math.abs(yawAbs);
  const z = zone > 0 ? zone : 0;
  if (d <= z) return true;
  if (yaw <= 1e-4) return true;
  if (yaw > 0.55) return false;
  const miss = d * Math.sin(Math.min(yaw, Math.PI / 2));
  if (yaw < Math.PI / 2 && miss <= z) return true;
  if (d >= turnR * AP_LEAD_MARGIN && yaw < 0.4) return true;
  if (d >= turnR * 2) return true;
  return false;
}

export function widenAim(px, py, pz, gx, gy, gz, hx, hy, hz, turnR, zone) {
  if (!finite3(px, py, pz) || !finite3(gx, gy, gz)) {
    return { x: gx, y: gy, z: gz };
  }
  const dx = px - gx;
  const dy = py - gy;
  const dz = pz - gz;
  const d = hypot3(dx, dy, dz);
  let ux;
  let uy;
  let uz;
  if (d < 1e-6) {
    if (finite3(hx, hy, hz)) {
      const hl = hypot3(hx, hy, hz);
      if (hl > 1e-8) {
        ux = -hx / hl;
        uy = -hy / hl;
        uz = -hz / hl;
      } else {
        ux = 1;
        uy = 0;
        uz = 0;
      }
    } else {
      ux = 1;
      uy = 0;
      uz = 0;
    }
  } else {
    ux = dx / d;
    uy = dy / d;
    uz = dz / d;
  }
  const tr = Number.isFinite(turnR) && turnR > 0 ? turnR : TURN_MIN_RADIUS.light;
  const z = Number.isFinite(zone) && zone > 0 ? zone : 0;
  const reach = tr * AP_LEAD_MARGIN + z * 0.25;
  return { x: gx + ux * reach, y: gy + uy * reach, z: gz + uz * reach };
}

function firstChordKeep(px, py, pz, wx, wy, wz, gx, gy, gz, bodies, shipR, pad) {
  const n = bodyCount(bodies);
  let bestT = Infinity;
  let best = null;
  let bestKeep = 0;
  let bestInside = false;
  for (let i = 0; i < n; i++) {
    const body = bodyAt(bodies, i);
    const keep = keepRadius(body, shipR, pad);
    if (!(keep > 0)) continue;
    const gateClear = hypot3(gx - body.x, gy - body.y, gz - body.z);
    if (gateClear < keep) continue;
    const hit = sphereChordHit(px, py, pz, wx, wy, wz, body.x, body.y, body.z, keep);
    if (!hit.hit) continue;
    const t = Number.isFinite(hit.t) ? hit.t : 0;
    if (t < bestT) {
      bestT = t;
      best = body;
      bestKeep = keep;
      bestInside = !!hit.inside;
    }
  }
  if (!best) return null;
  return { body: best, keep: bestKeep, t: bestT, inside: bestInside };
}

function pickSign(px, py, pz, body, keep, hint) {
  const u = perpUnit(px - body.x, py - body.y, pz - body.z);
  const lat = (px - body.x) * u.x + (py - body.y) * u.y + (pz - body.z) * u.z;
  let sign = lat > 1e-4 ? 1 : lat < -1e-4 ? -1 : 0;
  const h = hint === 1 || hint === -1 ? hint : 0;
  if (sign === 0) sign = h || 1;
  else if (h && sign !== h && Math.abs(lat) < keep * 0.25) sign = h;
  return sign;
}

/**
 * Outside-tangent waypoint from P around sphere C,R.
 * W lies in the PC-perp plane so P→W is tangent to radius R = keep+clear.
 * If P is inside, W is a point outside on the chosen side (chord exits and stays out).
 */
function tangentWaypoint(px, py, pz, cx, cy, cz, keep, sign) {
  const s = sign === -1 ? -1 : 1;
  const rx = px - cx;
  const ry = py - cy;
  const rz = pz - cz;
  const d = hypot3(rx, ry, rz);
  const R = keep + TANGENT_CLEAR;
  const u = perpUnit(rx, ry, rz);
  if (!(d > 1e-8)) {
    return { x: cx + u.x * R * s, y: cy + u.y * R * s, z: cz + u.z * R * s, sign: s };
  }
  const radx = rx / d;
  const rady = ry / d;
  const radz = rz / d;
  if (d <= R) {
    let mx = radx + u.x * s;
    let my = rady + u.y * s;
    let mz = radz + u.z * s;
    let ml = hypot3(mx, my, mz);
    if (ml < 1e-8) {
      mx = u.x * s;
      my = u.y * s;
      mz = u.z * s;
      ml = hypot3(mx, my, mz) || 1;
    }
    const out = R;
    return {
      x: cx + (mx / ml) * out,
      y: cy + (my / ml) * out,
      z: cz + (mz / ml) * out,
      sign: s,
    };
  }
  const span = d * d - R * R;
  if (!(span > EPS)) {
    return { x: cx + u.x * R * s, y: cy + u.y * R * s, z: cz + u.z * R * s, sign: s };
  }
  const L = (R * d) / Math.sqrt(span);
  if (!Number.isFinite(L) || L <= 0) {
    return { x: cx + u.x * R * s, y: cy + u.y * R * s, z: cz + u.z * R * s, sign: s };
  }
  return {
    x: cx + u.x * L * s,
    y: cy + u.y * L * s,
    z: cz + u.z * L * s,
    sign: s,
  };
}

function walkDetour(px, py, pz, gx, gy, gz, bodies, shipR, pad, sign) {
  let wx = gx;
  let wy = gy;
  let wz = gz;
  let used = sign;
  let kind = '';
  let any = false;
  for (let i = 0; i < DETOUR_ITERS; i++) {
    const hit = firstChordKeep(px, py, pz, wx, wy, wz, gx, gy, gz, bodies, shipR, pad);
    if (!hit) return { clear: true, x: wx, y: wy, z: wz, sign: used, kind, any };
    const tw = tangentWaypoint(px, py, pz, hit.body.x, hit.body.y, hit.body.z, hit.keep, used);
    if (hit.inside) {
      if (!Number.isFinite(tw.x) || !Number.isFinite(tw.y) || !Number.isFinite(tw.z)) {
        return { clear: false, x: wx, y: wy, z: wz, sign: used, kind, any };
      }
      return {
        clear: true,
        x: tw.x, y: tw.y, z: tw.z,
        sign: tw.sign, kind: hit.body.kind || '', any: true,
      };
    }
    if (!Number.isFinite(tw.x) || !Number.isFinite(tw.y) || !Number.isFinite(tw.z)) {
      return { clear: false, x: wx, y: wy, z: wz, sign: used, kind, any };
    }
    wx = tw.x;
    wy = tw.y;
    wz = tw.z;
    used = tw.sign;
    kind = hit.body.kind || '';
    any = true;
  }
  const still = firstChordKeep(px, py, pz, wx, wy, wz, gx, gy, gz, bodies, shipR, pad);
  return { clear: !still, x: wx, y: wy, z: wz, sign: used, kind, any };
}

export function detourForObstacles(px, py, pz, gx, gy, gz, bodies, shipR, pad, sideHint) {
  if (!finite3(px, py, pz) || !finite3(gx, gy, gz)) {
    return { hit: false, x: gx, y: gy, z: gz, sign: 0 };
  }
  const seed = firstChordKeep(px, py, pz, gx, gy, gz, gx, gy, gz, bodies, shipR, pad);
  if (!seed) return { hit: false, x: gx, y: gy, z: gz, sign: 0 };
  const preferred = pickSign(px, py, pz, seed.body, seed.keep, sideHint);
  const first = walkDetour(px, py, pz, gx, gy, gz, bodies, shipR, pad, preferred);
  let best = first;
  if (!first.clear) {
    const alt = walkDetour(px, py, pz, gx, gy, gz, bodies, shipR, pad, -preferred);
    if (alt.clear) best = alt;
  }
  if (!Number.isFinite(best.x) || !Number.isFinite(best.y) || !Number.isFinite(best.z)) {
    return { hit: false, x: gx, y: gy, z: gz, sign: 0 };
  }
  return {
    hit: true,
    x: best.x,
    y: best.y,
    z: best.z,
    sign: best.sign,
    kind: best.kind || '',
  };
}

export function throttleForPath(hold, intercept, align, distGate, turnR) {
  const a = Number.isFinite(align) ? Math.max(0, Math.min(1, align)) : 0;
  const cruise = 0.2 + 0.8 * a;
  if (hold === 'widen') return a < AP_ALIGN_IN ? 0 : cruise;
  if (!intercept && Number.isFinite(distGate) && Number.isFinite(turnR) && distGate < turnR) {
    return 0;
  }
  return cruise;
}

/**
 * Plan the current aim. Writes no world state.
 * bodies: collectBodies bag or plain array of {kind,x,y,z,r,...}.
 */
export function planApPath(args) {
  const a = args || {};
  const px = a.px;
  const py = a.py;
  const pz = a.pz;
  const gx = a.gx;
  const gy = a.gy;
  const gz = a.gz;
  if (!finite3(px, py, pz) || !finite3(gx, gy, gz)) {
    return {
      ok: false,
      ax: 0, ay: 0, az: 0,
      hold: 'none',
      sign: 0,
      turnR: TURN_MIN_RADIUS.light,
      distGate: 0,
      intercept: false,
    };
  }
  const turnR = effectiveTurnRadius(a.classKey, a.speed);
  const distGate = hypot3(gx - px, gy - py, gz - pz);
  const yawGate = headingError(a.hx, a.hy, a.hz, gx - px, gy - py, gz - pz);
  const zone = Number.isFinite(a.zone) ? a.zone : 0;
  const intercept = interceptOk(distGate, yawGate, zone, turnR);
  const detour = detourForObstacles(
    px, py, pz, gx, gy, gz,
    a.bodies, a.shipR, a.pad, a.sideHint,
  );
  let ax = gx;
  let ay = gy;
  let az = gz;
  let hold = 'none';
  let sign = 0;
  if (detour.hit && Number.isFinite(detour.x) && Number.isFinite(detour.y) && Number.isFinite(detour.z)) {
    ax = detour.x;
    ay = detour.y;
    az = detour.z;
    hold = 'detour';
    sign = detour.sign || 0;
  } else if (!intercept && distGate < turnR * AP_LEAD_MARGIN) {
    const w = widenAim(px, py, pz, gx, gy, gz, a.hx, a.hy, a.hz, turnR, zone);
    if (Number.isFinite(w.x) && Number.isFinite(w.y) && Number.isFinite(w.z)) {
      ax = w.x;
      ay = w.y;
      az = w.z;
      hold = 'widen';
    }
  }
  return {
    ok: true,
    ax, ay, az,
    hold,
    sign,
    turnR,
    distGate,
    intercept,
  };
}
