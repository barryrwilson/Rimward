import * as THREE from 'three';
import { SYSTEMS, U } from './state.js';

/**
 * Shared HUD-reticle → world point. Combat fires along this ray.
 * Returns the nearest hit ref (rock list row or live ship) when the ray
 * hits; otherwise false. Writes `out` either way.
 *
 * Zero per-call allocation.
 */

export const RETICLE_EDGE = 44; // match hud.js hub clamp

/** Screen-space lock forgiveness around the visible pip. Not degrees. */
export const LOCK_CONE_PX = 12;

// Live body spheres (not dock 45 / jump 60 / glow 96 / scoop 30 / discovery 100).
const STATION_BODY_R = 32;
const GATE_BODY_R = 30;
const POD_BODY_R = 0.9;

const _ndc = new THREE.Vector3();
const _camRay = new THREE.Vector3();
const _oc = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _edge = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _center = new THREE.Vector3();
const _box = new THREE.Box3();
const _sphere = new THREE.Sphere();

let _vw = 1280;
let _vh = 720;
let _px = 640;
let _py = 360;

function fillCamRay(ctx) {
  const cam = ctx.camera;
  if (!cam) return false;
  _vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
  _vh = (typeof window !== 'undefined' && window.innerHeight) || 720;
  const cx = _vw * 0.5;
  const cy = _vh * 0.5;
  const fp = !!ctx.flags.firstPerson;
  let rx = fp ? 0 : (ctx.targets.reticleScreen?.x ?? 0);
  let ry = fp ? 0 : (ctx.targets.reticleScreen?.y ?? 0);
  const mx = Math.max(8, cx - RETICLE_EDGE);
  const my = Math.max(8, cy - RETICLE_EDGE);
  if (rx > mx) rx = mx; else if (rx < -mx) rx = -mx;
  if (ry > my) ry = my; else if (ry < -my) ry = -my;
  _px = cx + rx;
  _py = cy + ry;
  _ndc.set((_px / _vw) * 2 - 1, -(_py / _vh) * 2 + 1, 0.5);
  _ndc.unproject(cam);
  _camRay.subVectors(_ndc, cam.position);
  const rayLen = _camRay.length();
  if (rayLen < 1e-6) {
    cam.getWorldDirection(_camRay);
  } else {
    _camRay.divideScalar(rayLen);
  }
  return true;
}

export function reticleAimPoint(ctx, maxRange, out) {
  const range = maxRange > 1 ? maxRange : 200;
  const cam = ctx.camera;
  const fallback = ctx.ship?.object;
  if (!cam || !out) {
    if (out && fallback) out.copy(fallback.position);
    return false;
  }
  if (!fillCamRay(ctx)) {
    if (fallback) out.copy(fallback.position);
    return false;
  }
  let bestT = range;
  let bestRef = null;
  const list = ctx.asteroids?.list;
  if (list) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a?.position || !(a.radius > 0)) continue;
      const th = raySphereT(cam.position, _camRay, a.position, a.radius, bestT);
      if (th >= 0) { bestT = th; bestRef = a; }
    }
  }
  const ships = ctx.ships;
  if (ships) {
    for (let i = 0; i < ships.length; i++) {
      const s = ships[i];
      if (!s?.object || s.state?.destroyed) continue;
      const rad = Math.max(2, s.state?.radius ?? 4);
      const th = raySphereT(cam.position, _camRay, s.object.position, rad, bestT);
      if (th >= 0) { bestT = th; bestRef = s; }
    }
  }
  out.copy(cam.position).addScaledVector(_camRay, bestT);
  return bestRef || false;
}

/**
 * Reticle-lock pick on the visible-reticle ray. Direct-hit body disc wins.
 * If no disc contains the pip, LOCK_CONE_PX around the pip may take the
 * nearest unobscured projected center. Range is live U.TARGET_RANGE.
 */
export function pickReticleLock(ctx) {
  const cam = ctx.camera;
  const shipObj = ctx.ship?.object;
  if (!cam || !shipObj || !fillCamRay(ctx)) return null;
  const range2 = U.TARGET_RANGE * U.TARGET_RANGE;
  const origin = cam.position;
  const from = shipObj.position;
  const disc = { t: Infinity, live: null, wrap: null };
  const cone = { t: Infinity, live: null, wrap: null };

  const list = ctx.asteroids?.list;
  if (list) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a?.position || !(a.radius > 0)) continue;
      considerPick(cam, origin, from, range2, a.position, a.radius, a, null, disc, cone);
    }
  }
  const ships = ctx.ships;
  if (ships) {
    for (let i = 0; i < ships.length; i++) {
      const s = ships[i];
      if (!s?.object || s.state?.destroyed) continue;
      const rad = Math.max(2, s.state?.radius ?? 4);
      considerPick(cam, origin, from, range2, s.object.position, rad, s, null, disc, cone);
    }
  }

  const stPos = ctx.station && ctx.station.position;
  if (stPos) {
    considerPick(cam, origin, from, range2, stPos, STATION_BODY_R, null, { kind: 'station' }, disc, cone);
  }

  considerGates(ctx, cam, origin, from, range2, disc, cone);
  considerPods(ctx, cam, origin, from, range2, disc, cone);
  considerLandmarks(ctx, cam, origin, from, range2, disc, cone);

  if (disc.t < Infinity) return materializeLock(ctx, disc);
  if (cone.t < Infinity) return materializeLock(ctx, cone);
  return null;
}

function considerPick(cam, origin, from, range2, center, radius, live, wrap, disc, cone) {
  if (!center || !(radius > 0)) return;
  if (center.distanceToSquared(from) > range2) return;
  let th = raySphereTOpen(origin, _camRay, center, radius, Infinity);
  if (th < 0) {
    _oc.subVectors(center, origin);
    th = _oc.dot(_camRay);
    if (th <= 0) return;
  }
  if (discContains(cam, center, radius)) {
    takePick(disc, th, live, wrap);
  } else if (centerInCone(cam, center)) {
    takePick(cone, th, live, wrap);
  }
}

function takePick(slot, th, live, wrap) {
  if (th >= slot.t) return;
  slot.t = th;
  slot.live = live || null;
  slot.wrap = wrap || null;
}

function considerGates(ctx, cam, origin, from, range2, disc, cone) {
  const def = currentSystemDef(ctx);
  if (!def) return;
  const gates = def.gates;
  if (gates) {
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      const to = g && g.to;
      if (!safeSystemId(to)) continue;
      const p = g.position;
      if (!p) continue;
      _center.set(p[0], p[1], p[2]);
      considerPick(cam, origin, from, range2, _center, GATE_BODY_R, null, {
        kind: 'gate', to, hub: false, x: p[0], y: p[1], z: p[2],
      }, disc, cone);
    }
  }
  const hub = def.hub;
  if (!hub || !hub.routes || !hub.routes.length) return;
  const hp = hub.position;
  if (!hp) return;
  let to = hub.routes[0];
  if (ctx.gate && ctx.gate.nearHub && safeSystemId(ctx.gate.nearTo)
    && hub.routes.indexOf(ctx.gate.nearTo) >= 0) {
    to = ctx.gate.nearTo;
  }
  if (!safeSystemId(to)) return;
  _center.set(hp[0], hp[1], hp[2]);
  considerPick(cam, origin, from, range2, _center, GATE_BODY_R, null, {
    kind: 'gate', to, hub: true, x: hp[0], y: hp[1], z: hp[2],
  }, disc, cone);
}

function considerPods(ctx, cam, origin, from, range2, disc, cone) {
  const pods = ctx.pods;
  if (!pods) return;
  for (let i = 0; i < pods.length; i++) {
    const pod = pods[i];
    const pos = pod && pod.mesh && pod.mesh.position;
    if (!pos) continue;
    considerPick(cam, origin, from, range2, pos, POD_BODY_R, null, { kind: 'pod', pod }, disc, cone);
  }
}

function considerLandmarks(ctx, cam, origin, from, range2, disc, cone) {
  const def = currentSystemDef(ctx);
  const lms = def && def.landmarks;
  if (!lms) return;
  for (let i = 0; i < lms.length; i++) {
    const lm = lms[i];
    const id = lm && lm.id;
    if (!safeAuthoredId(id)) continue;
    const p = lm.position;
    if (!p) continue;
    const rad = landmarkMeshRadius(ctx, lm);
    if (!(rad > 0)) continue;
    _center.set(p[0], p[1], p[2]);
    considerPick(cam, origin, from, range2, _center, rad, null, {
      kind: 'landmark', id, x: p[0], y: p[1], z: p[2],
    }, disc, cone);
  }
}

function landmarkMeshRadius(ctx, lm) {
  const scene = ctx.scene;
  if (!scene || typeof scene.getObjectByName !== 'function') return 0;
  const group = scene.getObjectByName('landmarks');
  if (!group || !group.children) return 0;
  const p = lm.position;
  const lx = p[0], ly = p[1], lz = p[2];
  const kids = group.children;
  for (let i = 0; i < kids.length; i++) {
    const obj = kids[i];
    if (!obj || !obj.position) continue;
    const dx = obj.position.x - lx;
    const dy = obj.position.y - ly;
    const dz = obj.position.z - lz;
    if (dx * dx + dy * dy + dz * dz > 0.01) continue;
    _box.setFromObject(obj);
    _box.getBoundingSphere(_sphere);
    const r = _sphere.radius;
    if (Number.isFinite(r) && r > 0) return r;
    return 0;
  }
  return 0;
}

function currentSystemDef(ctx) {
  const sysId = ctx.world && ctx.world.currentSystem;
  if (!safeSystemId(sysId)) return null;
  if (ctx.systems && Object.hasOwn(ctx.systems, sysId)) return ctx.systems[sysId];
  if (Object.hasOwn(SYSTEMS, sysId)) return SYSTEMS[sysId];
  return null;
}

function reservedToken(value) {
  return value === '__proto__' || value === 'constructor' || value === 'prototype';
}

function safeSystemId(id) {
  return typeof id === 'string' && id.length > 0 && !reservedToken(id) && Object.hasOwn(SYSTEMS, id);
}

function safeAuthoredId(id) {
  return typeof id === 'string' && id.length > 0 && !reservedToken(id);
}

function materializeLock(ctx, slot) {
  if (slot.live) return slot.live;
  const w = slot.wrap;
  if (!w) return null;
  if (w.kind === 'station') {
    const position = ctx.station && ctx.station.position;
    if (!position) return null;
    return { lockKind: 'station', position };
  }
  if (w.kind === 'gate') {
    if (!safeSystemId(w.to)) return null;
    return {
      lockKind: 'gate',
      to: w.to,
      hub: !!w.hub,
      position: new THREE.Vector3(w.x, w.y, w.z),
    };
  }
  if (w.kind === 'pod') {
    const pod = w.pod;
    const position = pod && pod.mesh && pod.mesh.position;
    if (!position || !ctx.pods || ctx.pods.indexOf(pod) < 0) return null;
    return { lockKind: 'pod', position, pod };
  }
  if (w.kind === 'landmark') {
    if (!safeAuthoredId(w.id)) return null;
    return {
      lockKind: 'landmark',
      id: w.id,
      position: new THREE.Vector3(w.x, w.y, w.z),
    };
  }
  return null;
}

function centerInCone(cam, center) {
  _proj.copy(center).project(cam);
  if (_proj.z > 1) return false;
  const sx = (_proj.x * 0.5 + 0.5) * _vw;
  const sy = (-_proj.y * 0.5 + 0.5) * _vh;
  const dx = _px - sx;
  const dy = _py - sy;
  return dx * dx + dy * dy <= LOCK_CONE_PX * LOCK_CONE_PX;
}

function discContains(cam, center, radius) {
  _proj.copy(center).project(cam);
  if (_proj.z > 1) return false;
  const sx = (_proj.x * 0.5 + 0.5) * _vw;
  const sy = (-_proj.y * 0.5 + 0.5) * _vh;
  _camRight.setFromMatrixColumn(cam.matrixWorld, 0);
  _edge.copy(center).addScaledVector(_camRight, radius).project(cam);
  const ex = (_edge.x * 0.5 + 0.5) * _vw;
  const ey = (-_edge.y * 0.5 + 0.5) * _vh;
  const discR = Math.hypot(ex - sx, ey - sy);
  if (!(discR > 0)) return false;
  const dx = _px - sx;
  const dy = _py - sy;
  return dx * dx + dy * dy <= discR * discR;
}

function raySphereT(origin, dir, center, radius, maxT) {
  _oc.subVectors(origin, center);
  const b = _oc.dot(dir);
  const c = _oc.lengthSq() - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  let th = -b - sq;
  if (th < 0) th = -b + sq;
  if (th < 0.4 || th > maxT) return -1;
  return th;
}

function raySphereTOpen(origin, dir, center, radius, maxT) {
  _oc.subVectors(origin, center);
  const b = _oc.dot(dir);
  const c = _oc.lengthSq() - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  let th = -b - sq;
  if (th < 0) th = -b + sq;
  if (th <= 0 || th > maxT) return -1;
  return th;
}
