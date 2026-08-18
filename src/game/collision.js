/**
 * THREE-free collision helpers. Callers pass preallocated `out` / `dest`.
 * After warmup, functions reuse module-scope records only.
 */
import { PHY } from './physics.js';
import { scaleFor } from './ship-scale.js';
import { SYSTEMS } from './state.js';

const EPS = 1e-12;

const _ov = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
const _vel = { vx: 0, vy: 0, vz: 0 };

function finiteN(a, b, c, d, e, f) {
  return (
    Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) &&
    Number.isFinite(d) && Number.isFinite(e) && Number.isFinite(f)
  );
}

function clearHit(out) {
  out.hit = false;
  out.nx = 0;
  out.ny = 1;
  out.nz = 0;
  out.overlap = 0;
  return out;
}

function radiusForClass(classKey) {
  const scale = scaleFor(classKey);
  if (scale && Number.isFinite(scale.maxRadius)) return scale.maxRadius;
  const p = scale && scale.proxy;
  if (p) {
    const r = Math.hypot(p.rx || 0, p.ry || 0, p.halfLen || 0);
    if (r > 0) return r;
  }
  if (scale && scale.span && Number.isFinite(scale.span[1])) return scale.span[1] * 0.5;
  return 4;
}

function readPos(obj, fallback) {
  if (obj && Number.isFinite(obj.x) && Number.isFinite(obj.y) && Number.isFinite(obj.z)) return obj;
  return fallback;
}

function acquireSlot(dest, index) {
  let slot = dest.items[index];
  if (!slot) {
    slot = { kind: '', x: 0, y: 0, z: 0, r: 0, y0: 0, y1: 0, id: 0 };
    dest.items[index] = slot;
  }
  return slot;
}

function fillSlot(slot, kind, x, y, z, r, y0, y1, id) {
  slot.kind = kind;
  slot.x = x;
  slot.y = y;
  slot.z = z;
  slot.r = r;
  slot.y0 = y0;
  slot.y1 = y1;
  slot.id = id;
}

export function distSq(ax, ay, az, bx, by, bz) {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
}

export function sphereOverlap(ax, ay, az, ar, bx, by, bz, br, out) {
  if (!out) return out;
  if (!finiteN(ax, ay, az, bx, by, bz) || !Number.isFinite(ar) || !Number.isFinite(br)) {
    return clearHit(out);
  }
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  const d2 = dx * dx + dy * dy + dz * dz;
  const rr = (ar > 0 ? ar : 0) + (br > 0 ? br : 0);
  if (d2 > rr * rr) return clearHit(out);
  if (d2 <= EPS) {
    out.hit = true;
    out.nx = 0;
    out.ny = 1;
    out.nz = 0;
    out.overlap = rr;
    return out;
  }
  const d = Math.sqrt(d2);
  out.hit = true;
  out.nx = dx / d;
  out.ny = dy / d;
  out.nz = dz / d;
  out.overlap = rr - d;
  return out;
}

export function torusOverlap(px, py, pz, pr, gx, gy, gz, boreR, tubeR, out) {
  if (!out) return out;
  if (
    !finiteN(px, py, pz, gx, gy, gz) ||
    !Number.isFinite(pr) || !Number.isFinite(boreR) || !Number.isFinite(tubeR)
  ) {
    return clearHit(out);
  }
  const prS = pr > 0 ? pr : 0;
  const tubeS = tubeR > 0 ? tubeR : 0;
  let ax = -gx;
  let ay = -gy;
  let az = -gz;
  const aLen = Math.hypot(ax, ay, az);
  if (aLen <= EPS) {
    ax = 0;
    ay = 0;
    az = 1;
  } else {
    ax /= aLen;
    ay /= aLen;
    az /= aLen;
  }
  const qx = px - gx;
  const qy = py - gy;
  const qz = pz - gz;
  const axial = qx * ax + qy * ay + qz * az;
  const rx = qx - ax * axial;
  const ry = qy - ay * axial;
  const rz = qz - az * axial;
  const radial = Math.hypot(rx, ry, rz);
  const dr = radial - boreR;
  const dist = Math.hypot(dr, axial);
  const reach = tubeS + prS;
  if (dist >= reach) return clearHit(out);

  let nx;
  let ny;
  let nz;
  if (dist <= EPS) {
    if (radial > EPS) {
      nx = rx / radial;
      ny = ry / radial;
      nz = rz / radial;
    } else {
      nx = 0;
      ny = 1;
      nz = 0;
    }
    out.hit = true;
    out.nx = nx;
    out.ny = ny;
    out.nz = nz;
    out.overlap = reach;
    return out;
  }
  if (radial > EPS) {
    const inv = 1 / radial;
    nx = rx * inv * dr + ax * axial;
    ny = ry * inv * dr + ay * axial;
    nz = rz * inv * dr + az * axial;
  } else {
    let px0;
    let py0;
    let pz0;
    if (Math.abs(ax) < 0.9) {
      px0 = 0;
      py0 = az;
      pz0 = -ay;
    } else {
      px0 = -az;
      py0 = 0;
      pz0 = ax;
    }
    const plen = Math.hypot(px0, py0, pz0);
    const inv = plen > EPS ? 1 / plen : 1;
    nx = px0 * inv * dr + ax * axial;
    ny = py0 * inv * dr + ay * axial;
    nz = pz0 * inv * dr + az * axial;
  }
  const nlen = Math.hypot(nx, ny, nz);
  if (nlen <= EPS) {
    out.hit = true;
    out.nx = 0;
    out.ny = 1;
    out.nz = 0;
    out.overlap = reach - dist;
    return out;
  }
  out.hit = true;
  out.nx = nx / nlen;
  out.ny = ny / nlen;
  out.nz = nz / nlen;
  out.overlap = reach - dist;
  return out;
}

export function cylinderOverlap(px, py, pz, pr, cx, cy, cz, cr, y0, y1, out) {
  if (!out) return out;
  if (
    !finiteN(px, py, pz, cx, cy, cz) ||
    !Number.isFinite(pr) || !Number.isFinite(cr) ||
    !Number.isFinite(y0) || !Number.isFinite(y1)
  ) {
    return clearHit(out);
  }
  let ymin = cy + y0;
  let ymax = cy + y1;
  if (ymin > ymax) {
    const tmp = ymin;
    ymin = ymax;
    ymax = tmp;
  }
  const prS = pr > 0 ? pr : 0;
  const crS = cr > 0 ? cr : 0;
  const dx = px - cx;
  const dz = pz - cz;
  const radial = Math.hypot(dx, dz);
  const below = py < ymin;
  const above = py > ymax;

  if (!below && !above) {
    const gap = radial - crS;
    if (gap >= prS) return clearHit(out);
    if (radial < crS) {
      const distSide = crS - radial;
      const distTop = ymax - py;
      const distBot = py - ymin;
      if (distTop < distSide && distTop <= distBot) {
        out.hit = true;
        out.nx = 0;
        out.ny = 1;
        out.nz = 0;
        out.overlap = prS + distTop;
        return out;
      }
      if (distBot < distSide && distBot < distTop) {
        out.hit = true;
        out.nx = 0;
        out.ny = -1;
        out.nz = 0;
        out.overlap = prS + distBot;
        return out;
      }
    }
    if (radial > EPS) {
      out.nx = dx / radial;
      out.ny = 0;
      out.nz = dz / radial;
    } else {
      out.nx = 1;
      out.ny = 0;
      out.nz = 0;
    }
    out.hit = true;
    out.overlap = prS + crS - radial;
    return out;
  }

  const capY = above ? ymax : ymin;
  if (radial <= crS) {
    const ady = Math.abs(py - capY);
    if (ady >= prS) return clearHit(out);
    out.hit = true;
    out.nx = 0;
    out.ny = above ? 1 : -1;
    out.nz = 0;
    out.overlap = prS - ady;
    return out;
  }

  const inv = 1 / radial;
  const rx = px - (cx + dx * inv * crS);
  const ry = py - capY;
  const rz = pz - (cz + dz * inv * crS);
  const d = Math.hypot(rx, ry, rz);
  if (d >= prS) return clearHit(out);
  if (d <= EPS) {
    const ny = above ? 1 : -1;
    const s = Math.SQRT1_2;
    out.hit = true;
    out.nx = dx * inv * s;
    out.ny = ny * s;
    out.nz = dz * inv * s;
    out.overlap = prS;
    return out;
  }
  out.hit = true;
  out.nx = rx / d;
  out.ny = ry / d;
  out.nz = rz / d;
  out.overlap = prS - d;
  return out;
}

export function resolveVelocity(vx, vy, vz, nx, ny, nz, restitution, friction, out) {
  if (!out) return out;
  if (!finiteN(vx, vy, vz, nx, ny, nz)) {
    out.vx = 0;
    out.vy = 0;
    out.vz = 0;
    return out;
  }
  const rest = Number.isFinite(restitution) ? restitution : 0;
  const fric = Number.isFinite(friction) ? friction : 1;
  const vn = vx * nx + vy * ny + vz * nz;
  const tx = vx - vn * nx;
  const ty = vy - vn * ny;
  const tz = vz - vn * nz;
  const rvn = -vn * rest;
  out.vx = rvn * nx + tx * fric;
  out.vy = rvn * ny + ty * fric;
  out.vz = rvn * nz + tz * fric;
  return out;
}

export function sunZone(px, py, pz, sx, sy, sz, sunRadius, out) {
  if (!out) return out;
  if (!finiteN(px, py, pz, sx, sy, sz) || !Number.isFinite(sunRadius)) {
    out.zone = 0;
    out.t = 0;
    out.dist = 0;
    return out;
  }
  const r = sunRadius > 0 ? sunRadius : 0;
  const heatR = r * PHY.SUN_HEAT_MULT;
  const killR = r * PHY.SUN_LETHAL_MULT;
  const dist = Math.hypot(px - sx, py - sy, pz - sz);
  let zone = 0;
  if (dist <= killR) zone = 2;
  else if (dist <= heatR) zone = 1;
  const span = heatR - killR;
  let t = 0;
  if (zone === 2) t = 1;
  else if (zone === 1 && span > EPS) t = (heatR - dist) / span;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  out.zone = zone;
  out.t = t;
  out.dist = dist;
  return out;
}

export function collectBodies(ctx, dest) {
  if (!dest) return dest;
  if (!dest.items) dest.items = [];
  let n = 0;
  const stationPos = readPos(ctx && ctx.station && ctx.station.position, null)
    || readPos(ctx && ctx.config && ctx.config.world && ctx.config.world.stationPosition, null);
  if (stationPos) {
    fillSlot(
      acquireSlot(dest, n),
      'station',
      stationPos.x, stationPos.y, stationPos.z,
      PHY.STATION_CYL_RADIUS,
      PHY.STATION_CYL_Y0,
      PHY.STATION_CYL_Y1,
      0,
    );
    n += 1;
  }
  const sysId = ctx && ctx.world && ctx.world.currentSystem;
  const table = (ctx && ctx.systems) || SYSTEMS;
  const def = sysId && table ? table[sysId] : null;
  let gateId = 0;
  const gates = def && def.gates;
  if (gates) {
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      const p = g && g.position;
      if (!p) continue;
      const x = p[0];
      const y = p[1];
      const z = p[2];
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      fillSlot(
        acquireSlot(dest, n),
        'gate',
        x, y, z,
        PHY.GATE_BORE,
        PHY.GATE_TUBE,
        0,
        gateId,
      );
      n += 1;
      gateId += 1;
    }
  }
  const hub = def && def.hub;
  if (hub && hub.routes && hub.routes.length) {
    const p = hub.position;
    if (p) {
      const x = p[0];
      const y = p[1];
      const z = p[2];
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        fillSlot(
          acquireSlot(dest, n),
          'gate',
          x, y, z,
          PHY.GATE_BORE,
          PHY.GATE_TUBE,
          0,
          gateId,
        );
        n += 1;
      }
    }
  }
  const rocks = ctx && ctx.asteroids && ctx.asteroids.list;
  if (rocks) {
    for (let i = 0; i < rocks.length; i++) {
      const a = rocks[i];
      if (!a) continue;
      const p = readPos(a.position, a);
      if (!p) continue;
      const r = Number.isFinite(a.radius) ? a.radius : 0;
      const id = a.id;
      fillSlot(acquireSlot(dest, n), 'asteroid', p.x, p.y, p.z, r, 0, 0, id);
      n += 1;
    }
  }
  const ships = ctx && ctx.ships;
  if (ships) {
    for (let i = 0; i < ships.length; i++) {
      const ship = ships[i];
      if (!ship || (ship.state && ship.state.destroyed)) continue;
      const p = readPos(ship.object && ship.object.position, ship.position);
      if (!p) continue;
      const classKey = (ship.state && ship.state.classKey)
        || (ship.record && ship.record.classKey)
        || ship.classKey;
      fillSlot(
        acquireSlot(dest, n),
        'ship',
        p.x, p.y, p.z,
        radiusForClass(classKey),
        0, 0,
        ship.id,
      );
      n += 1;
    }
  }
  const playerObj = ctx && ctx.ship && ctx.ship.object;
  if (playerObj) {
    const p = readPos(playerObj.position, playerObj);
    if (p) {
      fillSlot(acquireSlot(dest, n), 'player', p.x, p.y, p.z, PHY.PLAYER_RADIUS, 0, 0, -1);
      n += 1;
    }
  }
  dest.count = n;
  return dest;
}

export function resolveMover(px, py, pz, vx, vy, vz, radius, dest, skipKind, skipId, out) {
  if (!out) return out;
  if (!finiteN(px, py, pz, vx, vy, vz) || !Number.isFinite(radius)) {
    out.px = Number.isFinite(px) ? px : 0;
    out.py = Number.isFinite(py) ? py : 0;
    out.pz = Number.isFinite(pz) ? pz : 0;
    out.vx = Number.isFinite(vx) ? vx : 0;
    out.vy = Number.isFinite(vy) ? vy : 0;
    out.vz = Number.isFinite(vz) ? vz : 0;
    out.hit = false;
    out.kind = null;
    out.speed = 0;
    out.nx = 0;
    out.ny = 1;
    out.nz = 0;
    out.overlap = 0;
    return out;
  }
  let x = px;
  let y = py;
  let z = pz;
  let ovx = vx;
  let ovy = vy;
  let ovz = vz;
  let hit = false;
  let kind = null;
  let speed = 0;
  let nx = 0;
  let ny = 1;
  let nz = 0;
  let overlap = 0;
  const items = dest && dest.items;
  const count = dest && dest.count ? dest.count : 0;
  if (items && count > 0) {
    for (let pass = 0; pass < 2; pass++) {
      let best = -1;
      let bestO = 0;
      let bestNx = 0;
      let bestNy = 1;
      let bestNz = 0;
      for (let i = 0; i < count; i++) {
        const b = items[i];
        if (!b) continue;
        // Self-skip is a (kind, id) pair so asteroid 0 is not station 0.
        if (b.kind === skipKind && b.id === skipId) continue;
        if (b.kind === 'station') {
          cylinderOverlap(x, y, z, radius, b.x, b.y, b.z, b.r, b.y0, b.y1, _ov);
        } else if (b.kind === 'gate') {
          torusOverlap(x, y, z, radius, b.x, b.y, b.z, b.r, b.y0, _ov);
        } else {
          sphereOverlap(x, y, z, radius, b.x, b.y, b.z, b.r, _ov);
        }
        if (_ov.hit && _ov.overlap > bestO) {
          bestO = _ov.overlap;
          best = i;
          bestNx = _ov.nx;
          bestNy = _ov.ny;
          bestNz = _ov.nz;
        }
      }
      if (best < 0) break;
      if (!hit) {
        speed = -(ovx * bestNx + ovy * bestNy + ovz * bestNz);
        kind = items[best].kind;
        nx = bestNx;
        ny = bestNy;
        nz = bestNz;
        overlap = bestO;
      }
      x += bestNx * bestO;
      y += bestNy * bestO;
      z += bestNz * bestO;
      resolveVelocity(ovx, ovy, ovz, bestNx, bestNy, bestNz, PHY.RESTITUTION, PHY.SLIDE_FRICTION, _vel);
      ovx = _vel.vx;
      ovy = _vel.vy;
      ovz = _vel.vz;
      hit = true;
    }
  }
  out.px = x;
  out.py = y;
  out.pz = z;
  out.vx = ovx;
  out.vy = ovy;
  out.vz = ovz;
  out.hit = hit;
  out.kind = kind;
  out.speed = speed;
  out.nx = nx;
  out.ny = ny;
  out.nz = nz;
  out.overlap = overlap;
  return out;
}
