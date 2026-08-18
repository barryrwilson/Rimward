// Drain recheck after AI-02 linger fix. Evidence only; does not edit src.
import * as THREE from 'three';
import { SYSTEMS } from '../../src/game/state.js';
import { initWorld, recordPosition } from '../../src/game/world.js';

function makeSimCtx() {
  return {
    systems: SYSTEMS,
    lastEvents: [],
    ships: [],
    elapsed: 0,
    emit() {},
    input: { hailPressed: false },
    ship: { object: { position: new THREE.Vector3(1e6, 1e6, 1e6) } },
    world: {
      time: 0,
      currentSystem: 'freehold',
      records: [],
      recordBanks: {},
      markets: {},
      prices: null,
      milestones: [],
      credits: 500,
      reputation: {},
      fear: 0,
      aftermath: [],
      incidents: [],
      origin: null,
      shipName: 'probe',
    },
  };
}

function runOne(seconds = 180) {
  const sim = makeSimCtx();
  const world = initWorld(sim);
  const seeded = sim.world.records.filter((r) => r.role === 'trader').length;
  const startPirates = sim.world.records.filter((r) => r.role === 'pirate').length;
  const startAces = sim.world.records.filter((r) => r.role === 'ace').length;
  const startPatrols = sim.world.records.filter((r) => r.role === 'patrol').length;
  const startIds = new Set(sim.world.records.filter((r) => r.role === 'trader').map((r) => r.id));

  let minLocal = seeded;
  let firstEmptyAt = null;
  let firstTransitAt = null;
  const transitStarts = [];
  const snapshots = [];

  for (let t = 1; t <= seconds; t++) {
    sim.world.time += 1;
    sim.elapsed += 1;
    sim.lastEvents.length = 0;
    world.update(1);

    const recs = sim.world.records;
    const local = recs.filter((r) => r.role === 'trader' && r.state !== 'inTransit' && r.state !== 'dead' && r.state !== 'captured');
    const transit = recs.filter((r) => r.role === 'trader' && r.state === 'inTransit');
    const atGate = recs.filter((r) => r.role === 'trader' && r.state === 'enroute' && r.gateLinger === true);
    if (local.length < minLocal) minLocal = local.length;
    if (local.length === 0 && firstEmptyAt == null) firstEmptyAt = t;
    if (transit.length && firstTransitAt == null) firstTransitAt = t;
    for (const rec of transit) {
      if (!transitStarts.some((s) => s.id === rec.id && s.eta === rec.transitEta)) {
        transitStarts.push({ t, id: rec.id, dest: rec.transitTo, eta: rec.transitEta, role: rec.role });
      }
    }
    if (t === 22 || t === 45 || t === 90 || t === 180 || t === seconds) {
      snapshots.push({
        t,
        local: local.length,
        transit: transit.length,
        atGate: atGate.length,
        docked: recs.filter((r) => r.role === 'trader' && r.state === 'docked').length,
        pirates: recs.filter((r) => r.role === 'pirate').length,
        aces: recs.filter((r) => r.role === 'ace').length,
        patrols: recs.filter((r) => r.role === 'patrol').length,
      });
    }
  }

  const arrived = (sim.world.recordBanks.veridian ?? []).filter(
    (r) => r.role === 'trader' && startIds.has(r.id) && r.state !== 'inTransit',
  );
  const pirateTransit = [
    ...sim.world.records,
    ...(sim.world.recordBanks.veridian ?? []),
  ].filter((r) => (r.role === 'pirate' || r.role === 'ace' || r.role === 'patrol') && r.state === 'inTransit');

  const local = sim.world.records.filter((r) => r.role === 'trader' && (r.state === 'enroute' || r.state === 'docked'));
  const transitHere = sim.world.records.filter((r) => r.role === 'trader' && r.state === 'inTransit');
  const departed = transitHere.length + arrived.length;
  const maxDepart = Math.floor(seconds / (90 * 0.75)) + 1;

  let arriveSample = null;
  if (arrived[0]) {
    const rec = arrived[0];
    const pos = recordPosition(rec, new THREE.Vector3());
    const gate = SYSTEMS.veridian.gates.find((g) => g.to === 'freehold');
    const d = gate
      ? Math.hypot(pos.x - gate.position[0], pos.y - gate.position[1], pos.z - gate.position[2])
      : null;
    arriveSample = {
      id: rec.id,
      dir: rec.dir,
      leg: rec.leg,
      legT: rec.legT,
      outboundTo: rec.outboundTo,
      routeLen: rec.route.length,
      d,
    };
  }

  const intervals = [];
  for (let i = 1; i < transitStarts.length; i++) {
    intervals.push(transitStarts[i].t - transitStarts[i - 1].t);
  }

  return {
    seeded,
    startPirates,
    startAces,
    startPatrols,
    minLocal,
    firstEmptyAt,
    firstTransitAt,
    departed,
    maxDepart,
    local: local.length,
    transitHere: transitHere.length,
    arrived: arrived.length,
    transitStarts,
    intervals,
    snapshots,
    pirateAcePatrolTransit: pirateTransit.length,
    arriveSample,
    emptyAt22: snapshots.find((s) => s.t === 22)?.local === 0,
    piratesUnchanged: snapshots.every((s) => s.pirates === startPirates),
    acesUnchanged: snapshots.every((s) => s.aces === startAces),
    patrolsUnchanged: snapshots.every((s) => s.patrols === startPatrols),
  };
}

const runs = [];
for (let i = 0; i < 5; i++) runs.push(runOne(180));

const report = {
  pass: runs.every(
    (r) =>
      r.minLocal > 0
      && r.firstEmptyAt == null
      && !r.emptyAt22
      && r.departed <= r.maxDepart
      && r.local > 0
      && r.pirateAcePatrolTransit === 0
      && r.piratesUnchanged
      && r.acesUnchanged
      && r.intervals.every((d) => d >= 67),
  ),
  runs,
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
