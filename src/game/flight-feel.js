/**
 * Shared flight feel — turn rate by class and speed.
 *
 * Pure data + math. No THREE, no DOM, no ctx writes.
 * NPC (npc.js) calls turnRateFor so dogfights share one yaw/pitch law.
 * Player station-keep / mining hover uses hoverTurnRateFor (RCS floor).
 */

/** Minimum turn radius (world units) by classKey. */
export const TURN_MIN_RADIUS = {
  light: 90,
  ace: 70,
  cutter: 85,
  heavy: 140,
  freighter: 200,
  frigate: 420,
};

/** Hard cap on yaw/pitch rate (rad/s) by classKey. */
export const TURN_MAX = {
  light: 0.85,
  ace: 1.05,
  cutter: 0.90,
  heavy: 0.55,
  freighter: 0.40,
  frigate: 0.18,
};

/**
 * Instantaneous turn rate (rad/s).
 * omega = min(TURN_MAX[class], max(speed, 8) / TURN_MIN_RADIUS[class])
 * Unknown classKey falls back to light.
 */
export function turnRateFor(classKey, speed) {
  const key = Object.hasOwn(TURN_MIN_RADIUS, classKey) ? classKey : 'light';
  const radius = TURN_MIN_RADIUS[key] || TURN_MIN_RADIUS.light;
  const cap = TURN_MAX[key] ?? TURN_MAX.light;
  const s = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const omega = Math.max(s, 8) / radius;
  return omega < cap ? omega : cap;
}

/**
 * Station-keep / mining RCS floor (rad/s). Must stay below cruise omega
 * so max(turnRateFor, floor) does not raise high-speed turns.
 */
export const HOVER_RCS = {
  light: 0.40,
  ace: 0.50,
  cutter: 0.42,
  heavy: 0.26,
  freighter: 0.19,
  frigate: 0.05,
};

/**
 * Player hover / creep / full-stop rate. Same dogfight law as turnRateFor
 * once speed already exceeds the RCS floor (light ≈ 36 u/s).
 * Unknown classKey falls back to light; non-finite speed is 0 (via turnRateFor).
 */
export function hoverTurnRateFor(classKey, speed) {
  const key = Object.hasOwn(TURN_MIN_RADIUS, classKey) ? classKey : 'light';
  const dogfight = turnRateFor(key, speed);
  const rcs = Object.hasOwn(HOVER_RCS, key) ? HOVER_RCS[key] : HOVER_RCS.light;
  return dogfight < rcs ? rcs : dogfight;
}
