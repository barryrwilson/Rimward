/**
 * BIO-08 anatomy-native living gait. THREE-free. Not persisted.
 * Class cruise stays on SHIP_CLASSES (via living-cadence). Do not copy it here.
 * Player light CPU honors the live sculpt; this table still maps light → shark
 * so Beautiful NPC light GPU may kick a caudal.
 */
export const LIVE_GAIT_MIX = Object.freeze({
  gaitId: 'live-spine-flap',
  spineX: 1.00,
  flapY: 1.00,
  kickZ: 0.00,
  radial: 0.00,
});

export const GAIT_AXES = Object.freeze({
  'shark-caudal': Object.freeze({
    gaitId: 'shark-caudal',
    spineX: 0.55,
    flapY: 1.00,
    kickZ: 0.70,
    radial: 0.00,
  }),
  'squid-mantle': Object.freeze({
    gaitId: 'squid-mantle',
    spineX: 0.15,
    flapY: 0.12,
    kickZ: 0.50,
    radial: 1.00,
  }),
  'whale-fluke': Object.freeze({
    gaitId: 'whale-fluke',
    spineX: 0.90,
    flapY: 0.28,
    kickZ: 0.85,
    radial: 0.08,
  }),
  'octopus-trail': Object.freeze({
    gaitId: 'octopus-trail',
    spineX: 0.22,
    flapY: 0.18,
    kickZ: 1.00,
    radial: 0.28,
  }),
});

/** classKey → gaitId. Unknown classKey is light (then player CPU may ignore). */
export const LIVING_GAIT = Object.freeze({
  light: 'shark-caudal',
  cutter: 'shark-caudal',
  ace: 'squid-mantle',
  heavy: 'whale-fluke',
  freighter: 'whale-fluke',
  frigate: 'octopus-trail',
});

export function axesForGait(gaitId) {
  if (typeof gaitId !== 'string' || !Object.hasOwn(GAIT_AXES, gaitId)) {
    return LIVE_GAIT_MIX;
  }
  return GAIT_AXES[gaitId];
}

export function gaitFor(classKey) {
  if (typeof classKey !== 'string' || !Object.hasOwn(LIVING_GAIT, classKey)) {
    return axesForGait(LIVING_GAIT.light);
  }
  return axesForGait(LIVING_GAIT[classKey]);
}
