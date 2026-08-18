/**
 * Hull-mark pool size and local-offset math.
 * Combat owns the render pool. This module stays free of a renderer import.
 * After warmup, callers pass scratch records only.
 */

export const HULL_MARK_POOL = 12;
export const HULL_MARK_SIZE = 0.62;
export const HULL_MARK_LIFT = 0.12;

export function isFiniteVec3(x, y, z) {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
}

/**
 * World hit → host-local offset. Host pose is px/py/pz, qx/qy/qz/qw, sx/sy/sz.
 * Writes out.x/y/z. Returns false on a non-finite input or a zero scale.
 */
export function worldHitToLocal(wx, wy, wz, pose, out) {
  if (!out || !pose) return false;
  if (!isFiniteVec3(wx, wy, wz)) return false;
  const px = pose.px, py = pose.py, pz = pose.pz;
  const qx = pose.qx, qy = pose.qy, qz = pose.qz, qw = pose.qw;
  const sx = pose.sx, sy = pose.sy, sz = pose.sz;
  if (!isFiniteVec3(px, py, pz)) return false;
  if (!Number.isFinite(qx) || !Number.isFinite(qy) || !Number.isFinite(qz) || !Number.isFinite(qw)) {
    return false;
  }
  if (!isFiniteVec3(sx, sy, sz) || sx === 0 || sy === 0 || sz === 0) return false;

  let x = wx - px;
  let y = wy - py;
  let z = wz - pz;
  const ix = -qx, iy = -qy, iz = -qz, iw = qw;
  const tx = 2 * (iy * z - iz * y);
  const ty = 2 * (iz * x - ix * z);
  const tz = 2 * (ix * y - iy * x);
  x = x + iw * tx + (iy * tz - iz * ty);
  y = y + iw * ty + (iz * tx - ix * tz);
  z = z + iw * tz + (ix * ty - iy * tx);
  out.x = x / sx;
  out.y = y / sy;
  out.z = z / sz;
  return isFiniteVec3(out.x, out.y, out.z);
}

/** Push a local offset a short distance away from the host origin. */
export function liftLocalOffset(out, lift) {
  if (!out || !Number.isFinite(lift) || lift === 0) return;
  const len = Math.hypot(out.x, out.y, out.z);
  if (!(len > 1e-8)) return;
  const k = lift / len;
  out.x += out.x * k;
  out.y += out.y * k;
  out.z += out.z * k;
}

/**
 * First free slot, else the oldest stamp. slots[i] has { live, stampAt }.
 * Returns -1 on an empty list.
 */
export function nextMarkSlot(slots) {
  if (!slots || slots.length === 0) return -1;
  let oldest = 0;
  let oldestAt = Infinity;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (!s.live) return i;
    if (s.stampAt < oldestAt) {
      oldestAt = s.stampAt;
      oldest = i;
    }
  }
  return oldest;
}
