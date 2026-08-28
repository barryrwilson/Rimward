/**
 * NAV-10 human pad speed envelope. Pure: no DOM, THREE, persist, or ctx writes.
 * Not agent approachDock. Subtracts excess closing speed only.
 */

export const PAD_GOV_SLOW = 20;
export const PAD_GOV_RANGE_MULT = 3;
export const PAD_GOV_FAR_CAP = 80;

function finiteNum(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function readAxis(obj, key, index) {
  if (!obj || typeof obj !== 'object') return NaN;
  if (finiteNum(obj[key])) return obj[key];
  if (typeof obj.length === 'number' && finiteNum(obj[index])) return obj[index];
  return NaN;
}

export function padGovernorBand(dockRange) {
  if (!finiteNum(dockRange) || dockRange <= 0) return NaN;
  return dockRange * PAD_GOV_RANGE_MULT;
}

export function padGovernorActive(flags) {
  if (!flags || typeof flags !== 'object') return false;
  if (flags.docked || flags.jumping || flags.berthHold || flags.paused) return false;
  if (flags.dockPressed || flags.burnerActive || flags.apDock) return false;
  return true;
}

/** Max closing speed toward the pad. At dock range: SLOW. At band edge: FAR_CAP. */
export function padMaxClosingSpeed(dist, dockRange) {
  if (!finiteNum(dockRange) || dockRange <= 0) return PAD_GOV_SLOW;
  if (!finiteNum(dist)) return PAD_GOV_SLOW;
  if (dist <= dockRange) return PAD_GOV_SLOW;
  const band = padGovernorBand(dockRange);
  if (!finiteNum(band)) return PAD_GOV_SLOW;
  if (dist >= band) return PAD_GOV_FAR_CAP;
  const span = band - dockRange;
  if (!(span > 0)) return PAD_GOV_SLOW;
  const t = (dist - dockRange) / span;
  return PAD_GOV_SLOW + t * (PAD_GOV_FAR_CAP - PAD_GOV_SLOW);
}

/**
 * Mutates vel in place. Returns true when closing speed was reduced.
 * Never adds velocity toward the station.
 */
export function applyPadSpeedGovernor(vel, pos, station, flags, dockRange) {
  if (!padGovernorActive(flags)) return false;
  if (!vel || typeof vel !== 'object') return false;
  const px = readAxis(pos, 'x', 0);
  const py = readAxis(pos, 'y', 1);
  const pz = readAxis(pos, 'z', 2);
  const vx = readAxis(vel, 'x', 0);
  const vy = readAxis(vel, 'y', 1);
  const vz = readAxis(vel, 'z', 2);
  const sx = readAxis(station, 'x', 0);
  const sy = readAxis(station, 'y', 1);
  const sz = readAxis(station, 'z', 2);
  if (![px, py, pz, vx, vy, vz, sx, sy, sz].every(finiteNum)) return false;
  const dx = sx - px;
  const dy = sy - py;
  const dz = sz - pz;
  const dist = Math.hypot(dx, dy, dz);
  if (!finiteNum(dist) || dist < 1e-6) return false;
  const band = padGovernorBand(dockRange);
  if (!finiteNum(band) || dist > band) return false;
  const inv = 1 / dist;
  const rx = dx * inv;
  const ry = dy * inv;
  const rz = dz * inv;
  const closing = vx * rx + vy * ry + vz * rz;
  if (!(closing > 0)) return false;
  const cap = padMaxClosingSpeed(dist, dockRange);
  if (!finiteNum(cap) || closing <= cap) return false;
  const excess = closing - cap;
  vel.x = vx - rx * excess;
  vel.y = vy - ry * excess;
  vel.z = vz - rz * excess;
  return true;
}
