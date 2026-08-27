/**
 * Agent dock-approach geometry and braking math.
 * Pure: no THREE, DOM, ctx writes, input, or persistence.
 */

export const DOCK_STAGE_RANGE = 135;
export const DOCK_SETTLE_RANGE = 40;
export const DOCK_REQUEST_RANGE = 43;
export const DOCK_STAGE_ARRIVE = 12;
export const DOCK_STAGE_SPEED = 20;
export const DOCK_REQUEST_SPEED = 5;
export const DOCK_STAGE_BRAKE_BUFFER = 10;
export const DOCK_FINAL_BRAKE_BUFFER = 2;
export const DOCK_BLOCK_SECONDS = 10;
export const DOCK_PULSE_TIMEOUT = 2;
export const DOCK_ALIGN_IN = 0.86;
export const DOCK_CORRIDOR_ALIGN = 0.995;

function finite3(value) {
  return !!value
    && typeof value === 'object'
    && Number.isFinite(value.x)
    && Number.isFinite(value.y)
    && Number.isFinite(value.z);
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function dockApproachPoints(station) {
  if (!finite3(station)) return null;
  return {
    stage: {
      x: station.x + DOCK_STAGE_RANGE,
      y: station.y,
      z: station.z,
    },
    settle: {
      x: station.x + DOCK_SETTLE_RANGE,
      y: station.y,
      z: station.z,
    },
  };
}

export function dockStopDistance(speed, acceleration) {
  if (!Number.isFinite(speed) || !Number.isFinite(acceleration) || acceleration <= 0) {
    return null;
  }
  const v = Math.max(0, Math.abs(speed));
  return (v * v) / (2 * Math.max(acceleration, 1));
}

export function dockShouldBrake(distance, speed, acceleration, buffer) {
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(buffer) || buffer < 0) {
    return true;
  }
  const stop = dockStopDistance(speed, acceleration);
  if (stop === null) return true;
  return distance <= stop + buffer;
}

export function dockApproachProgress(startRange, currentRange, previous = 0) {
  const prior = clamp01(previous);
  if (!Number.isFinite(startRange) || !Number.isFinite(currentRange)) return prior;
  const span = startRange - DOCK_SETTLE_RANGE;
  if (span <= 0) return Math.max(prior, currentRange <= DOCK_SETTLE_RANGE ? 1 : 0);
  const raw = (startRange - currentRange) / span;
  return Math.max(prior, clamp01(raw));
}

export function dockDistance(a, b) {
  if (!finite3(a) || !finite3(b)) return null;
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
