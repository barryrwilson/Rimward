/**
 * Gate scale charter — the single source of truth for jump-gate size.
 *
 * Authority: docs/FactionGateDesignBible.md §2.
 * Builders and probes consume this module. Gameplay zone / arrival still
 * live on JUMP in state.js; the numbers here must match them.
 */

import { P, HUMAN } from './ship-scale.js';

export { P, HUMAN };

/** Bore radius of the transit hole, world units. A lane, not a drydock. */
export const BORE_RADIUS = 30;

/** Inner clear radius. Player P = 6.6 must pass with margin. */
export const BORE_CLEAR_MIN = 24;

/** Hull vertices may not sit inside BORE_RADIUS − this slack, except FX. */
export const BORE_SLACK = 1;

/** Current live torus tube. G1+ bodies replace this mesh; the number stays
 *  as the default shutter thickness until a faction brief overrides it. */
export const RING_TUBE = 2.2;

/** Diameter used for the outline-breaker percent. */
export const GATE_DIAMETER = BORE_RADIUS * 2;

/** One silhouette-breaker must reach at least 15% of diameter. */
export const OUTLINE_BREAKER_MIN = GATE_DIAMETER * 0.15; // 9

/** Must match JUMP.zone in state.js. */
export const ZONE = 60;

/** Must match JUMP.arrivalOffset in state.js. */
export const ARRIVAL_OFFSET = 50;

export const MERGE_GEO_MAX = 6;
export const MERGE_MAT_MAX = 6;
export const HULL_VERTS_MIN = 40000;
export const HULL_VERTS_MAX = 90000;
export const GLOW_VERTS_MIN = 8000;
export const SILHOUETTE_IOU_MAX = 0.65;

export const TUNNEL_COUNT = 200;
export const TUNNEL_DEPTH = 24;
export const TUNNEL_SIZE = 1.7;

export const SPIN_SPEED = 0.25;
export const HEX_SPIN_SPEED = -SPIN_SPEED * 0.4;

export const HEX_RADIUS = BORE_RADIUS * 1.35;
export const HEX_BAR_THICK = 1.4;
export const ARM_THICK = 0.7;
export const LAMP_BASE_SCALE = 6;
export const LAMP_SELECTED_SCALE = 9.5;
export const LAMP_BASE_OPACITY = 0.45;
export const LAMP_SELECTED_OPACITY = 1;

/** Alias used by the live torus until G1 lands a new body. */
export const RING_RADIUS = BORE_RADIUS;

export const GUILD = {
  brass: 0x8a6a34,
  brassDark: 0x5a4422,
  amber: 0xffb84d,
  amberHot: 0xffd890,
};

export const CHANNELS = Object.freeze(['hull', 'glow', 'glaze']);

/**
 * Census wave order from docs/FactionGateRedesignPlan.md §6.
 * Not FACTION_REBUILD_ORDER (that list is for ships).
 */
export const GATE_REBUILD_ORDER = Object.freeze([
  'freehold',
  'veridian',
  'ferrous',
  'independent',
  'redledger',
  'gilded',
  'beautiful',
  'congregation',
  'hollow',
  'assembly',
  'lamplighter',
  'unknowables',
]);

/** Lamps on a run: pitch is HUMAN.lampGap, never lampSize. */
export function lampCountForRun(length) {
  if (!(length > 0)) return 1;
  return Math.max(2, Math.floor(length / HUMAN.lampGap) + 1);
}

export function minRadialXY(positionAttr) {
  let min = Infinity;
  const n = positionAttr.count;
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(positionAttr.getX(i), positionAttr.getY(i));
    if (r < min) min = r;
  }
  return min;
}

/** True when every vertex sits outside the bore slack (hull channel). */
export function boreClear(positionAttr, bore = BORE_RADIUS, slack = BORE_SLACK) {
  return minRadialXY(positionAttr) >= bore - slack;
}

/** Reach past the bore radius, for the outline-breaker pin. */
export function maxReach(positionAttr, bore = BORE_RADIUS) {
  let max = 0;
  const n = positionAttr.count;
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(
      positionAttr.getX(i),
      positionAttr.getY(i),
      positionAttr.getZ(i),
    );
    if (r > max) max = r;
  }
  return max - bore;
}

export function outlineBreakerOk(positionAttr, minReach = OUTLINE_BREAKER_MIN) {
  return maxReach(positionAttr) >= minReach;
}
