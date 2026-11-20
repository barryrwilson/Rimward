/**
 * Traffic population tiers — system scale/population Phase 2 (issue #339).
 *
 * Pure constants shared by traffic.js (near spawn cap), mid-traffic.js (mid
 * instanced proxies), far-traffic.js (far impostors) and the dev-only perf
 * overlay. Nothing here is persisted: a tier is derived from distance every
 * frame and never written onto a record.
 *
 * Tier contract (docs/SystemScalePopulationDesign.md §3):
 *   near  <= NEAR_RANGE   full GLB hull, full-frame AI/physics, combat/hail
 *   mid   <= MID_RANGE    one instanced low-poly proxy, 8 Hz coarse pose
 *   far   >  MID_RANGE    one instanced impostor, 1 Hz abstract pose
 *
 * The near cap is the existing MAX_LIVE (10); mid/far are capacity ceilings for
 * one instanced layer each, not simulation counts. Combat, collision and hail
 * remain near-only: mid/far proxies have no AI, collision, combat or FX.
 */
import { U } from './state.js';

/** Distance where a record may promote to a full hull (U.INSTANTIATE_RANGE). */
export const NEAR_RANGE = U.INSTANTIATE_RANGE;

/** Distance where the mid proxy band ends and the far impostor band begins. */
export const MID_RANGE = 2500;

/** Full-detail live-hull cap (the existing MAX_LIVE contract, 10-14 band). */
export const NEAR_CAP = 10;

/** One instanced mid-proxy layer capacity (issue target 30-40). */
export const MID_CAP = 40;

/** One instanced far-impostor layer capacity (issue target 150-300). */
export const FAR_CAP = 256;
