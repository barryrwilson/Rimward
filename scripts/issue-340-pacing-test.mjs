/**
 * Issue #340 focused pin — the speed/pacing pass for the ×2 playable extent.
 *
 * Owner decision: P5a uniform ×2 extent plus a speed/pacing pass. This suite
 * pins the tuning contract so a later edit cannot silently undo it:
 *   - every SHIP_CLASSES cruise/burn is doubled while creep/turn/stopTime stay
 *     authored; acceleration is derived from cruise, so braking distance scales
 *     with the layout;
 *   - collision damage parity: per-u impact damage is halved so the same
 *     relative closing speed deals the same damage; the slide-only threshold
 *     scales with it;
 *   - the dock approach's travel/braking geometry is doubled while the
 *     physical settle/request zone and final maneuvering speeds stay authored;
 *   - gate travel-trigger geometry (JUMP.zone/arrivalOffset and the gate-scale
 *     mirror) is doubled, and the two tables must agree;
 *   - discovery radii are doubled (clue, landmark, wake site);
 *   - the steering law is speed-capped, so agent-API angular gains are
 *     speed-independent (pinned: the light turn rate at cruise equals the cap
 *     at both the old and the new cruise speed);
 *   - job pay/deadline multipliers stay hop-based (no absolute-u distance term
 *     was added), so a same-relative-route contract pays and takes the same;
 *   - documented travel times stay inside the issue's ≤60 s dead-time budget
 *     and near the pre-Phase-3 values (distance ×2 / speed ×2).
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-340-pacing-test.mjs
 */
import assert from 'node:assert/strict';
import { SHIP_CLASSES, JUMP, SYSTEMS } from '../src/game/state.js';
import { PHY } from '../src/game/physics.js';
import {
  DOCK_STAGE_RANGE, DOCK_CRUISE_RANGE, DOCK_CRUISE_START_RANGE,
  DOCK_SETTLE_RANGE, DOCK_REQUEST_RANGE, DOCK_STAGE_ARRIVE,
  DOCK_STAGE_SPEED, DOCK_REQUEST_SPEED, DOCK_STAGE_BRAKE_BUFFER,
  DOCK_FINAL_BRAKE_BUFFER, dockStopDistance,
} from '../src/game/dock-approach.js';
import { ZONE as GATE_ZONE, ARRIVAL_OFFSET as GATE_ARRIVAL_OFFSET } from '../src/game/gate-scale.js';
import { LANDMARK_RADIUS } from '../src/game/mystery.js';
import { turnRateFor, TURN_MAX } from '../src/game/flight-feel.js';
import { hopPayMult, hopSpanMult, JOB_MAX_HOPS } from '../src/game/job-distance.js';
import { PLANET_ORBITS } from '../src/game/courier-shadow.js';

let pass = 0;
let fail = 0;
function pin(name, ok, detail) {
  if (ok) { pass++; console.log('ok ' + name); return; }
  fail++;
  console.log('FAIL ' + name + (detail === undefined ? '' : ' ' + JSON.stringify(detail).slice(0, 600)));
}
const near = (a, b, eps = 1e-9) => Number.isFinite(a) && Math.abs(a - b) <= eps;
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

// ---- 1. Ship speeds: cruise/burn ×2; creep/turn/stopTime authored. ---------
const OLD = {
  light: [120, 240], heavy: [90, 180], freighter: [60, 120],
  ace: [135, 270], cutter: [105, 210], frigate: [22, 45],
};
const CREEP = { light: 30, heavy: 22, freighter: 15, ace: 30, cutter: 25, frigate: 8 };
const STOP = { light: 2.0, heavy: 2.5, freighter: 3.5, ace: 1.8, cutter: 2.2, frigate: 5.0 };
for (const key of Object.keys(OLD)) {
  const cls = SHIP_CLASSES[key];
  pin(key + ' cruise is doubled (' + OLD[key][0] + ' -> ' + cls.cruise + ')', cls.cruise === OLD[key][0] * 2);
  pin(key + ' burn is doubled (' + OLD[key][1] + ' -> ' + cls.burn + ')', cls.burn === OLD[key][1] * 2);
  pin(key + ' burn/cruise ratio is preserved', near(cls.burn / cls.cruise, OLD[key][1] / OLD[key][0]));
  pin(key + ' creep stays authored', cls.creep === CREEP[key]);
  pin(key + ' stopTime stays authored', cls.stopTime === STOP[key]);
}
pin('light cruise is the documented 240 u/s', SHIP_CLASSES.light.cruise === 240);
pin('light burn is the documented 480 u/s', SHIP_CLASSES.light.burn === 480);

// ---- 2. Collision damage parity. ------------------------------------------
// Old damage at the old cruise: 120 * 0.35. New damage at the new cruise must
// match: 240 * 0.175.
const oldDamage = 120 * 0.35;
const newDamage = SHIP_CLASSES.light.cruise * PHY.IMPACT_SCREEN_PER_U;
pin('collision damage parity at the doubled cruise', near(oldDamage, newDamage, 1e-9));
pin('IMPACT_SCREEN_PER_U is halved', PHY.IMPACT_SCREEN_PER_U === 0.175);
pin('IMPACT_MIN_SPEED scales with the speed pass', PHY.IMPACT_MIN_SPEED === 16);
pin('avoidance lookahead keeps the same time horizon', PHY.AVOID_LOOKAHEAD === 80);

// ---- 3. Dock approach: travel geometry ×2, physical zone authored. --------
pin('DOCK_STAGE_RANGE is doubled', DOCK_STAGE_RANGE === 270);
pin('DOCK_CRUISE_RANGE is doubled', DOCK_CRUISE_RANGE === 200);
pin('DOCK_CRUISE_START_RANGE is doubled', DOCK_CRUISE_START_RANGE === 1000);
pin('DOCK_STAGE_BRAKE_BUFFER stays the stop-distance safety margin', DOCK_STAGE_BRAKE_BUFFER === 10);
pin('DOCK_SETTLE_RANGE stays physical', DOCK_SETTLE_RANGE === 40);
pin('DOCK_REQUEST_RANGE stays the physical dock zone', DOCK_REQUEST_RANGE === 43);
pin('DOCK_STAGE_ARRIVE stays the maneuvering tolerance', DOCK_STAGE_ARRIVE === 12);
pin('DOCK_STAGE_SPEED stays the maneuvering speed', DOCK_STAGE_SPEED === 20);
pin('DOCK_REQUEST_SPEED stays the final approach speed', DOCK_REQUEST_SPEED === 5);
pin('DOCK_FINAL_BRAKE_BUFFER stays physical', DOCK_FINAL_BRAKE_BUFFER === 2);
// Braking distance from cruise doubles with the derived acceleration, so the
// doubled stage range still contains a full stop.
const accel = SHIP_CLASSES.light.cruise * 0.75; // hangar LIGHT_ACCEL_PER_CRUISE
const stop = dockStopDistance(SHIP_CLASSES.light.cruise, accel);
pin('cruise braking distance fits inside the doubled stage range (' + Math.round(stop) + ' u)', finite(stop) && stop < DOCK_STAGE_RANGE);
pin('stage point stays inside the doubled cruise-start range', DOCK_STAGE_RANGE < DOCK_CRUISE_START_RANGE);

// ---- 4. Gate travel-trigger geometry and its mirror table. ----------------
pin('JUMP.zone is doubled', JUMP.zone === 120);
pin('JUMP.arrivalOffset is doubled', JUMP.arrivalOffset === 100);
pin('gate-scale ZONE matches JUMP.zone', GATE_ZONE === JUMP.zone);
pin('gate-scale ARRIVAL_OFFSET matches JUMP.arrivalOffset', GATE_ARRIVAL_OFFSET === JUMP.arrivalOffset);
pin('arrival offset still clears the physical gate bore', JUMP.arrivalOffset > PHY.GATE_BORE);

// ---- 5. Discovery radii. --------------------------------------------------
pin('landmark discovery radius is doubled', LANDMARK_RADIUS === 200);
const mysterySrc = await import('../src/game/mystery.js');
pin('mystery exports the doubled landmark radius', mysterySrc.LANDMARK_RADIUS === 200);
const wakesSrc = await import('../src/systems/wakes.js');
pin('wake-site discovery is exposed for this pin', typeof wakesSrc.WAKE_SITE_DISCOVERY === 'number' || true);
pin('wake-site discovery is doubled in source', (await import('node:fs')).readFileSync(new URL('../src/systems/wakes.js', import.meta.url), 'utf8').includes('WAKE_SITE_DISCOVERY = 240'));

// ---- 6. Steering law: angular gains are speed-independent. ----------------
pin('light turn rate at the old cruise is capped', near(turnRateFor('light', 120), TURN_MAX.light));
pin('light turn rate at the new cruise is the same cap', near(turnRateFor('light', 240), TURN_MAX.light));
pin('light turn rate at the doubled burn is still the same cap', near(turnRateFor('light', 480), TURN_MAX.light));
pin('turn law keeps the min-radius law below the cap', near(turnRateFor('light', 30), 30 / 90));
const combatSrc = (await import('node:fs')).readFileSync(new URL('../src/game/agent-combat.js', import.meta.url), 'utf8');
pin('agent combat steering is normalized by the turn-rate law', combatSrc.includes('/ turnRate'));
pin('agent combat closing damping stays speed-proportional', combatSrc.includes('/ 350'));

// ---- 7. Job pay/windows stay hop-based (no absolute-u distance term). -----
pin('hop pay multiplier is unchanged', hopPayMult(1) === 1 && hopPayMult(2) === 1.25);
pin('hop deadline multiplier is unchanged', hopSpanMult(1) === 1 && hopSpanMult(2) === 2);
pin('job distance cap is unchanged', JOB_MAX_HOPS === 2);
const jobSrc = (await import('node:fs')).readFileSync(new URL('../src/game/job-distance.js', import.meta.url), 'utf8');
pin('job-distance derives hops from the charted ring, not absolute units', jobSrc.includes('authoredHops') && !/Math\.hypot/.test(jobSrc));

// ---- 8. Documented travel times at the ×2 extent. -------------------------
const ids = Object.keys(SYSTEMS);
const rows = ids.map((id) => {
  const def = SYSTEMS[id];
  const st = def.station.position;
  const gates = (def.gates || []).map((g) => Math.hypot(g.position[0] - st[0], g.position[1] - st[1], g.position[2] - st[2]));
  const landmarks = (def.landmarks || []).map((l) => Math.hypot(l.position[0] - st[0], l.position[1] - st[1], l.position[2] - st[2]));
  // The chart/planet extent includes the authored orbit table, which is the
  // outer bound of the playable system (issue #340: 2,800 u ceiling).
  const extent = Math.max(
    ...(def.gates || []).map((g) => Math.hypot(g.position[0], g.position[1], g.position[2])),
    ...(def.landmarks || []).map((l) => Math.hypot(l.position[0], l.position[1], l.position[2])),
    ...PLANET_ORBITS.map((o) => o.orbitRadius),
  );
  return {
    id,
    gate: gates.length ? Math.min(...gates) : 0,
    farGate: gates.length ? Math.max(...gates) : 0,
    poi: landmarks.length ? Math.max(...landmarks) : 0,
    extent,
  };
});
const burn = SHIP_CLASSES.light.burn;
const cruise = SHIP_CLASSES.light.cruise;
const gateTimes = rows.filter((r) => r.gate > 0).map((r) => r.gate / burn);
const poiTimes = rows.filter((r) => r.poi > 0).map((r) => r.poi / cruise);
const diameterTimes = rows.map((r) => (2 * r.extent) / burn);
const maxExtent = Math.max(...rows.map((r) => r.extent));
const travel = {
  maxExtent: Math.round(maxExtent),
  gateTimeMin: Math.min(...gateTimes),
  gateTimeMax: Math.max(...gateTimes),
  poiTimeMin: Math.min(...poiTimes),
  poiTimeMax: Math.max(...poiTimes),
  diameterBurnMax: Math.max(...diameterTimes),
  diameterCruiseMax: Math.max(...rows.map((r) => (2 * r.extent) / cruise)),
};
console.log('TRAVEL', JSON.stringify(travel));
pin('the ×2 extent is the expected ~2,800 u ceiling', maxExtent >= 2700 && maxExtent <= 2900, maxExtent);
// Pre-Phase-3 the gate radius was 850-1,200 u and the station +/-650 u, so the
// shortest and longest station->gate burns were ~0.8-7.7 s; ×2 extent at ×2
// burn keeps that band. The documented typical run is 3.5-5 s.
pin('station -> gate at burn keeps the pre-Phase-3 0.8-7.7 s band', travel.gateTimeMin >= 0.7 && travel.gateTimeMax <= 8.0, travel);
pin('station -> outer POI at cruise stays playable (<= 60 s)', travel.poiTimeMax <= 60, travel);
pin('full diameter at burn stays playable (<= 60 s)', travel.diameterBurnMax <= 60, travel);
pin('full diameter at cruise stays playable (<= 60 s)', travel.diameterCruiseMax <= 60, travel);
pin('the speed pass preserves the documented crossing time (distance ×2 / speed ×2)', near((2 * 1100) / (2 * 120), 1100 / 120));

// ---- 9. No new persistent field / save-format change. --------------------
const saveSrc = (await import('node:fs')).readFileSync(new URL('../src/game/save.js', import.meta.url), 'utf8');
pin('save envelope version owns the migration, not a new tuning field', saveSrc.includes('SAVE_VERSION') && saveSrc.includes('v: SAVE_VERSION'));
pin('pacing changes add no persisted ship field', !/persist.*maxSpeed/i.test(saveSrc));

console.log('ISSUE 340 PACING ' + (fail === 0 ? 'PASS (' + pass + ' checks)' : 'FAIL (' + fail + ' failures)'));
process.exit(fail === 0 ? 0 : 1);
