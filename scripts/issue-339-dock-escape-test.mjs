/** Issue #339 dock-lane blockage control: the private static-keep cruise
 * escape. Recorded run-3 orbit poses are independent QA witnesses, not a world
 * replay. No ship integration claim is made here; the live probe owns that.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gitIdentity } from './lib/git-identity.mjs';

const runtimeRoot = resolve(process.env.STAGE_RUNTIME || fileURLToPath(new URL('..', import.meta.url)));
const mod = path => import(pathToFileURL(resolve(runtimeRoot, path)).href);
const { planApPath, keepRadius, AP_KEEP_PAD } = await mod('src/game/ap-path.js');
const cruise = await mod('src/game/dock-cruise.js');
const { dockApproachPoints } = await mod('src/game/dock-approach.js');
const { AUTHORED_SYSTEMS } = await mod('src/game/authored-systems.js');
const { PHY } = await mod('src/game/physics.js');
// Source identity via the EPERM-robust helper (issue #286).
const identity = gitIdentity(runtimeRoot);
const artifact = {
  head: identity.commit, runtimeSourceDirty: identity.workingTreeDirty,
  runtimeSha256: identity.sourceHash, identityMode: identity.mode, identityDirtyUnknown: identity.dirtyUnknown,
};
const vec = a => ({ x: a[0], y: a[1], z: a[2] });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const length = a => Math.hypot(a.x, a.y, a.z);
const unit = a => scale(a, 1 / length(a));

// Real Veridian Reach geometry, exactly as dockTick builds the cruise bag:
// the authored station cylinder, the arrival gate converted to 'dock-gate',
// and the sun keep sphere appended by appendSunBody.
const stationPos = vec(AUTHORED_SYSTEMS.veridian.station.position);
const stage = dockApproachPoints(stationPos).stage;
const sunRadius = AUTHORED_SYSTEMS.veridian.sunRadius;
const sunHeat = sunRadius * PHY.SUN_HEAT_MULT;
const sun = { kind: 'sun', x: 0, y: 0, z: 0, r: sunHeat, y0: 0, y1: 0, id: 0 };
const station = {
  kind: 'station', x: stationPos.x, y: stationPos.y, z: stationPos.z,
  r: PHY.STATION_CYL_RADIUS, y0: PHY.STATION_CYL_Y0, y1: PHY.STATION_CYL_Y1, id: 0,
};
const gates = AUTHORED_SYSTEMS.veridian.gates.map((g, i) => ({
  kind: 'dock-gate', x: g.position[0], y: g.position[1], z: g.position[2],
  r: PHY.GATE_BORE + PHY.GATE_TUBE, y0: PHY.GATE_TUBE, y1: 0, id: i,
}));
const bag = { items: [sun, station, ...gates], count: 2 + gates.length };
const sunKeep = keepRadius(sun, PHY.PLAYER_RADIUS);
const stationKeep = keepRadius(station, PHY.PLAYER_RADIUS);

function closestDistance(p, end, c) {
  const d = sub(end, p), span = dot(d, d);
  const t = span > 0 ? Math.max(0, Math.min(1, dot(sub(c, p), d) / span)) : 0;
  return length(sub(add(p, scale(d, t)), c));
}
function plan(p, goal, bodies, sideHint) {
  return planApPath({
    px: p.x, py: p.y, pz: p.z, gx: goal.x, gy: goal.y, gz: goal.z,
    hx: 0, hy: 0, hz: -1, bodies, shipR: PHY.PLAYER_RADIUS,
    classKey: 'light', speed: 84, zone: 12, sideHint,
  });
}
function call(p, target, bodies) {
  const out = { x: 123456, y: 234567, z: 345678 };
  const before = JSON.stringify({ p, target, items: bodies.items });
  const status = cruise.dockCruiseKeepExitAim(p, target, bodies, out);
  assert.equal(JSON.stringify({ p, target, items: bodies.items }), before,
    'the correction does not mutate input geometry');
  if (status !== 'clear') assert.deepEqual(out, { x: 123456, y: 234567, z: 345678 },
    'none/blocked never publishes an aim');
  return { status, aim: status === 'clear' ? out : target };
}

const records = [];
let verdict = 'FAIL';
let witness = null;
try {
  assert.equal(sunRadius, 55);
  assert.equal(sunKeep, sunHeat + PHY.PLAYER_RADIUS + AP_KEEP_PAD);
  assert.ok(stationKeep > PHY.STATION_CYL_RADIUS + PHY.PLAYER_RADIUS);

  // Run-3 witness: the frozen failed pose, plus the observed orbit ring at
  // several bearings. Inside keep past R/sqrt(2) the shared planner's inside
  // tangent always points inward, so the hull can ring the sun indefinitely.
  const frozen = vec([104, 0, 84]);
  const ring = [0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const a = deg * Math.PI / 180;
    return vec([134.3 * Math.sin(a), 0, 134.3 * Math.cos(a)]);
  });
  for (const [name, p] of [['run-3-frozen', frozen], ...ring.map((q, i) => [`orbit-${i}`, q])]) {
    for (const sideHint of [-1, 1]) {
      const radial = unit(p);
      const distance = length(p);
      assert.ok(distance > sunHeat && distance < sunKeep, `${name} starts inside the sun keep`);
      const raw = plan(p, stage, bag, sideHint);
      assert.equal(raw.hold, 'detour');
      const rawAim = { x: raw.ax, y: raw.ay, z: raw.az };
      const rawDelta = sub(rawAim, p);
      const rawRadialDot = dot(radial, rawDelta);
      const rawClosest = closestDistance(p, rawAim, { x: 0, y: 0, z: 0 });
      assert.ok(rawRadialDot < 0, `${name} side ${sideHint}: the planner points inward`);
      assert.ok(rawClosest < sunHeat, `${name} side ${sideHint}: the inward chord enters the heat zone`);
      const corrected = call(p, rawAim, bag);
      const delta = sub(corrected.aim, p);
      const record = {
        name, sideHint, distance, rawRadialDot, rawClosest,
        status: corrected.status, radialDot: dot(radial, delta),
        closest: closestDistance(p, corrected.aim, { x: 0, y: 0, z: 0 }),
        endDistance: length(sub(corrected.aim, { x: 0, y: 0, z: 0 })),
      };
      records.push(record);
      assert.equal(corrected.status, 'clear');
      assert.ok(record.radialDot > 0, `${name} side ${sideHint}: the effective course leaves the keep outward`);
      assert.ok(record.closest >= record.distance - 1e-6,
        `${name} side ${sideHint}: the corrected chord never closes on the sun`);
      assert.ok(record.closest > sunHeat, `${name} side ${sideHint}: the corrected course clears the heat zone`);
      assert.ok(record.endDistance > sunKeep, `${name} side ${sideHint}: the aim point ends outside keep`);
      // The selected tangent side is retained: lateral travel keeps its sign.
      const lateral = sub(rawDelta, scale(radial, dot(rawDelta, radial)));
      assert.ok(dot(delta, lateral) > 0, `${name} side ${sideHint}: the chosen tangent side is kept`);
      if (name === 'run-3-frozen' && sideHint === 1) witness = { p, rawAim, aim: corrected.aim };
    }
  }

  // Inside the heat radius the same trap applies: the inside waypoint is still
  // inward, so the hull would be steered deeper into the heat zone.
  const deep = vec([0, 0, 120]);
  const deepRaw = plan(deep, stage, bag, 1);
  const deepAim = { x: deepRaw.ax, y: deepRaw.ay, z: deepRaw.az };
  assert.ok(dot(unit(deep), sub(deepAim, deep)) < 0, 'heat-zone pose still gets an inward waypoint');
  const deepCorrected = call(deep, deepAim, bag);
  assert.equal(deepCorrected.status, 'clear');
  assert.ok(dot(unit(deep), sub(deepCorrected.aim, deep)) > 0);
  records.push({ name: 'inside-heat-zone', status: deepCorrected.status });

  // The station's own body can hold the hull on its far side while cruise is
  // still active. The correction must leave that keep outward too.
  const stageDir = unit(sub(stage, stationPos));
  const farSide = add(stationPos, scale(stageDir, -50));
  assert.ok(length(sub(farSide, stationPos)) < stationKeep);
  assert.ok(length(sub(stage, farSide)) > 100, 'the far-side pose is still a cruise leg');
  const stationRaw = plan(farSide, stage, bag, 1);
  const stationAim = { x: stationRaw.ax, y: stationRaw.ay, z: stationRaw.az };
  const stationRadial = unit(sub(farSide, stationPos));
  assert.ok(dot(stationRadial, sub(stationAim, farSide)) < 0, 'station far side gets an inward waypoint');
  const stationCorrected = call(farSide, stationAim, bag);
  assert.equal(stationCorrected.status, 'clear');
  const stationDelta = sub(stationCorrected.aim, farSide);
  assert.ok(dot(stationRadial, stationDelta) > 0, 'station escape is outward');
  assert.ok(closestDistance(farSide, stationCorrected.aim, stationPos) >=
    length(sub(farSide, stationPos)) - 1e-6, 'station escape never closes on the body');
  records.push({ name: 'station-far-side', status: stationCorrected.status, radialDot: dot(stationRadial, stationDelta) });

  // Bounded exclusions: outside the inside-tangent interval, a direct outward
  // chord, a bare gate, and traffic-only bags keep their existing policies.
  const outside = add({ x: 0, y: 0, z: 0 }, scale(unit(vec([0, 0, 1])), sunKeep + 2));
  const outsideRaw = plan(outside, vec([0, 0, 400]), bag, 1);
  assert.equal(call(outside, { x: outsideRaw.ax, y: outsideRaw.ay, z: outsideRaw.az }, bag).status, 'none');
  records.push({ name: 'outside-interval', status: 'none' });

  const outwardTarget = add(vec([0, 0, 134.3]), scale(unit(vec([0, 0, 134.3])), 100));
  assert.equal(call(vec([0, 0, 134.3]), outwardTarget, bag).status, 'none');
  records.push({ name: 'already-outward-target', status: 'none' });

  const gateOnly = { items: [gates[0]], count: 1 };
  const gatePose = add(vec([gates[0].x, gates[0].y, gates[0].z]), vec([0, 0, -5]));
  assert.equal(call(gatePose, add(gatePose, vec([0, 0, -200])), gateOnly).status, 'none');
  records.push({ name: 'gate-owns-its-bore', status: 'none' });

  const trafficOnly = {
    items: [{ kind: 'cruise-obstacle', bodyKind: 'ship', id: 'rec-1', x: 0, y: 0, z: 0, r: 10,
      baseX: 0, baseY: 0, baseZ: 0, bodyRadius: 10, vx: 0, vy: 0, vz: 0, motionVx: 0, motionVy: 0, motionVz: 0 }],
    count: 1,
  };
  assert.equal(call(vec([0, 0, 12]), vec([0, 0, -100]), trafficOnly).status, 'none');
  records.push({ name: 'traffic-keeps-ship-policy', status: 'none' });

  // A second keep sphere on the outgoing segment vetoes it without publishing.
  const { p, rawAim, aim } = witness;
  const mid = add(p, scale(sub(aim, p), 0.5));
  const blocker = {
    kind: 'station', x: mid.x, y: mid.y, z: mid.z, r: 1, y0: 0, y1: 0, id: 'blocker',
  };
  assert.ok(closestDistance(p, aim, mid) < keepRadius(blocker, PHY.PLAYER_RADIUS),
    'the candidate course really intersects the second protected sphere');
  const blocked = call(p, rawAim, { items: [sun, blocker], count: 2 });
  assert.equal(blocked.status, 'blocked');
  records.push({ name: 'other-keep-sphere-veto', status: blocked.status });

  // Non-finite and empty inputs fail closed.
  assert.equal(cruise.dockCruiseKeepExitAim({ x: NaN, y: 0, z: 0 }, rawAim, bag, { x: 0, y: 0, z: 0 }), 'blocked');
  assert.equal(cruise.dockCruiseKeepExitAim(p, rawAim, { items: [], count: 0 }, { x: 0, y: 0, z: 0 }), 'none');
  records.push({ name: 'fail-closed-inputs' });

  verdict = 'PASS';
  console.log(`PASS #339 dock keep escape geometry (${records.length} cases)`);
} finally {
  const out = resolve(process.env.STAGE_OUT || 'out/issue-339-dock-escape');
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'result.json'), JSON.stringify({
    verdict,
    authority: 'pure planner/escape geometry on authored Veridian Reach; no ship integration',
    artifact, sunRadius, sunHeat, sunKeep, stationKeep, stage, records,
  }, null, 2) + '\n');
}
