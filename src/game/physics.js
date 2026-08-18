/**
 * Shared collision / heat constants. Combat hit radius and station
 * envelope live here so ship/combat/npc share one table.
 * Do not duplicate these keys on state.js.
 */
export const PHY = Object.freeze({
  PLAYER_RADIUS: 2.4, // must match combat.js PLAYER_HIT_RADIUS
  STATION_CYL_RADIUS: 32, // station D5 |x|,|z| envelope
  STATION_CYL_Y0: -26,
  STATION_CYL_Y1: 33,
  IMPACT_SCREEN_PER_U: 0.35, // screen/hull damage per u/s of closing speed
  IMPACT_MIN_SPEED: 8, // below this, slide only, no damage
  RESTITUTION: 0.15,
  SLIDE_FRICTION: 0.85,
  SUN_HEAT_MULT: 2.4, // heat zone starts at sunRadius * this
  SUN_LETHAL_MULT: 1.12, // lethal at sunRadius * this
  SUN_HEAT_DPS: 6,
  SUN_HEAT_RAMP: 18, // extra dps at the lethal skin
  AVOID_LOOKAHEAD: 40,
  AVOID_GAIN: 1.4,
  GATE_BORE: 30, // must match gate-scale.js BORE_RADIUS
  GATE_TUBE: 2.2, // must match gate-scale.js RING_TUBE
});
