/**
 * BIO-06 class-scaled living fin cadence. THREE-free. Not persisted.
 * Cruise integers live on SHIP_CLASSES in state.js (light 120, ace 135,
 * cutter 105, heavy 90, frigate 22, freighter 60). Do not copy them as data.
 */
import { SHIP_CLASSES } from './state.js';

export const SWIM_IDLE_HZ = 0.5;
export const SWIM_CRUISE_HZ = 2.3;
const DEFAULT_CRUISE = 120;

export const LIVING_CADENCE = Object.freeze({
  light: Object.freeze({ hzScale: 1.00, sweepScale: 1.00 }),
  ace: Object.freeze({ hzScale: 0.96, sweepScale: 1.06 }),
  cutter: Object.freeze({ hzScale: 0.80, sweepScale: 1.22 }),
  heavy: Object.freeze({ hzScale: 0.62, sweepScale: 1.42 }),
  frigate: Object.freeze({ hzScale: 0.44, sweepScale: 1.68 }),
  freighter: Object.freeze({ hzScale: 0.30, sweepScale: 2.00 }),
});

export function cadenceFor(classKey) {
  if (typeof classKey !== 'string' || !Object.hasOwn(LIVING_CADENCE, classKey)) {
    return LIVING_CADENCE.light;
  }
  return LIVING_CADENCE[classKey];
}

export function classCruise(classKey) {
  if (typeof classKey !== 'string' || !Object.hasOwn(SHIP_CLASSES, classKey)) {
    return DEFAULT_CRUISE;
  }
  const cruise = SHIP_CLASSES[classKey].cruise;
  if (typeof cruise !== 'number' || !Number.isFinite(cruise) || cruise <= 0) {
    return DEFAULT_CRUISE;
  }
  return cruise;
}
