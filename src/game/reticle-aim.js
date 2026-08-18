import * as THREE from 'three';

/**
 * Shared HUD-reticle → world point. Combat fires along this ray.
 * Returns true when the ray hits a rock or ship (chase / third use that
 * for steer-to-object). False on empty glass. Writes `out` either way.
 *
 * Zero per-call allocation.
 */

export const RETICLE_EDGE = 44; // match hud.js hub clamp

const _ndc = new THREE.Vector3();
const _camRay = new THREE.Vector3();
const _oc = new THREE.Vector3();

export function reticleAimPoint(ctx, maxRange, out) {
  const range = maxRange > 1 ? maxRange : 200;
  const cam = ctx.camera;
  const fallback = ctx.ship?.object;
  if (!cam || !out) {
    if (out && fallback) out.copy(fallback.position);
    return false;
  }
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 720;
  const cx = vw * 0.5;
  const cy = vh * 0.5;
  const fp = !!ctx.flags.firstPerson;
  let rx = fp ? 0 : (ctx.targets.reticleScreen?.x ?? 0);
  let ry = fp ? 0 : (ctx.targets.reticleScreen?.y ?? 0);
  const mx = Math.max(8, cx - RETICLE_EDGE);
  const my = Math.max(8, cy - RETICLE_EDGE);
  if (rx > mx) rx = mx; else if (rx < -mx) rx = -mx;
  if (ry > my) ry = my; else if (ry < -my) ry = -my;
  _ndc.set(((cx + rx) / vw) * 2 - 1, -((cy + ry) / vh) * 2 + 1, 0.5);
  _ndc.unproject(cam);
  _camRay.subVectors(_ndc, cam.position);
  const rayLen = _camRay.length();
  if (rayLen < 1e-6) {
    cam.getWorldDirection(_camRay);
  } else {
    _camRay.divideScalar(rayLen);
  }
  let bestT = range;
  let hit = false;
  const list = ctx.asteroids?.list;
  if (list) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a?.position || !(a.radius > 0)) continue;
      const th = raySphereT(cam.position, _camRay, a.position, a.radius, bestT);
      if (th >= 0) { bestT = th; hit = true; }
    }
  }
  const ships = ctx.ships;
  if (ships) {
    for (let i = 0; i < ships.length; i++) {
      const s = ships[i];
      if (!s?.object || s.state?.destroyed) continue;
      const rad = Math.max(2, s.state?.radius ?? 4);
      const th = raySphereT(cam.position, _camRay, s.object.position, rad, bestT);
      if (th >= 0) { bestT = th; hit = true; }
    }
  }
  out.copy(cam.position).addScaledVector(_camRay, bestT);
  return hit;
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
