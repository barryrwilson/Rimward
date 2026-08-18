/**
 * Traffic clearance — hull-aware spawn separation and station holds.
 *
 * Pure data + math. No THREE, no DOM, no ctx writes.
 * traffic.js calls spawnBlocked / pirateLiveCap; radii come from SHIP_SCALE.
 */
import { scaleFor } from './ship-scale.js';
import { PHY } from './physics.js';

/** Extra gap (world units) between hull radii. */
export const SEPARATION_PAD = 10;

/** Extra gap outside the station cylinder + hull. */
export const STATION_HOLD_PAD = 12;

const HOLD_DIR_EPS = 1e-6;
const HOLD_OUT_EPS = 0.05;

function coordOf(p, axis, index, fallback) {
  if (!p) return fallback;
  const named = p[axis];
  if (Number.isFinite(named)) return named;
  const indexed = p[index];
  if (Number.isFinite(indexed)) return indexed;
  return fallback;
}

/** Ordinary-traffic pirate share of live ships. Blockade ignores this. */
export const PIRATE_LIVE_SHARE = 0.4;

/**
 * Player-to-record band that skips mix cap and hull gap.
 * Authored encounters park the player on the record (d≈0). 80 u covers that
 * sit-on case. U.TARGET_RANGE (600) is most of instantiate range and would
 * drop ordinary nearby gaps.
 */
export const CLOSE_SPAWN_RANGE = 80;

/** True when the candidate is on top of the player. NaN is not close. */
export function closeSpawn(dist) {
  return Number.isFinite(dist) && dist >= 0 && dist <= CLOSE_SPAWN_RANGE;
}

/**
 * Hull radius from the scale charter: target/2, else proxy hypot.
 * Unknown classKey falls back through scaleFor (light).
 */
export function hullRadiusFor(classKey) {
  const scale = scaleFor(classKey);
  if (scale && Number.isFinite(scale.target) && scale.target > 0) {
    return scale.target * 0.5;
  }
  const p = scale && scale.proxy;
  if (p) {
    const r = Math.hypot(p.rx || 0, p.ry || 0, p.halfLen || 0);
    if (r > 0 && Number.isFinite(r)) return r;
  }
  return scaleFor('light').target * 0.5;
}

/** Minimum centre-to-centre distance for two classes. */
export function separationFor(classA, classB) {
  return hullRadiusFor(classA) + hullRadiusFor(classB) + SEPARATION_PAD;
}

/**
 * Station-end hold: outside the D5 cylinder by hull + pad.
 * Direction is station → fromPos in XZ. Unusable fromPos falls back to
 * the system origin, then +X. Y stays at station.y inside the cyl band.
 */
export function writeStationHold(out, stationPos, classKey, fromPos) {
  const dest = out || { x: 0, y: 0, z: 0 };
  const sx = coordOf(stationPos, 'x', 0, 0);
  const sy = coordOf(stationPos, 'y', 1, 0);
  const sz = coordOf(stationPos, 'z', 2, 0);
  const hull = hullRadiusFor(classKey);
  const hold = PHY.STATION_CYL_RADIUS + hull + STATION_HOLD_PAD + HOLD_OUT_EPS;

  let dx = coordOf(fromPos, 'x', 0, sx) - sx;
  let dz = coordOf(fromPos, 'z', 2, sz) - sz;
  let len = Math.hypot(dx, dz);
  if (!(len > HOLD_DIR_EPS)) {
    dx = -sx;
    dz = -sz;
    len = Math.hypot(dx, dz);
  }
  if (!(len > HOLD_DIR_EPS)) {
    dx = 1;
    dz = 0;
    len = 1;
  }
  const inv = hold / len;
  let y = sy;
  const yMin = sy + PHY.STATION_CYL_Y0;
  const yMax = sy + PHY.STATION_CYL_Y1;
  if (y < yMin) y = yMin;
  if (y > yMax) y = yMax;
  dest.x = sx + dx * inv;
  dest.y = y;
  dest.z = sz + dz * inv;
  return dest;
}

/** Plain {x,y,z} hold outside the station cylinder. */
export function stationHoldPoint(stationPos, classKey, fromPos) {
  return writeStationHold({ x: 0, y: 0, z: 0 }, stationPos, classKey, fromPos);
}

/**
 * Class of the hull in the scene. Unrevealed q-ships use coverClass
 * (npc.js mesh default: freighter). Revealed / ordinary ships use classKey.
 * Accepts a record or a live ship `{ record, state }`.
 */
export function visualClassFor(src) {
  if (!src) return undefined;
  const rec = src.record !== undefined && src.record !== null ? src.record : src;
  const qship = rec.qship === true;
  const revealed = rec.revealed === true;
  if (qship && !revealed) return rec.coverClass ?? 'freighter';
  return rec.classKey ?? (src.state && src.state.classKey);
}

/**
 * True when `pos` sits inside another live ship's hull+pad.
 * liveShips: `{ object: { position }, state, record? }`.
 * Neighbor radius uses the visual (cover) class, not state.classKey.
 */
export function spawnBlocked(pos, classKey, liveShips) {
  if (!pos || !liveShips) return false;
  const px = pos.x;
  const py = pos.y;
  const pz = pos.z;
  if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) return true;
  const n = liveShips.length;
  for (let i = 0; i < n; i++) {
    const live = liveShips[i];
    const other = live && live.object && live.object.position;
    if (!other) continue;
    const ox = other.x;
    const oy = other.y;
    const oz = other.z;
    if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(oz)) return true;
    const otherKey = visualClassFor(live);
    const sep = separationFor(classKey, otherKey);
    const dx = px - ox;
    const dy = py - oy;
    const dz = pz - oz;
    if (dx * dx + dy * dy + dz * dz < sep * sep) return true;
  }
  return false;
}

/**
 * Max pirates among `liveCount` live ships.
 * Blockade: no cap. Else floor(share * n), at least 1 when n >= 1.
 */
export function pirateLiveCap(liveCount, blockade) {
  if (blockade) return Number.POSITIVE_INFINITY;
  const n = Number.isFinite(liveCount) ? liveCount : 0;
  if (n <= 0) return 0;
  return Math.max(1, Math.floor(n * PIRATE_LIVE_SHARE));
}
