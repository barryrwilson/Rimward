/** Disclosed initial-state fixture shared by the node and live-browser probes.
 * Nine previously surrendered station runners occupy a full ten-hull bubble.
 * A tenth ordinary patrol and an eligible loaded trader complete the setup.
 * We stage surrender/escape approach history, never completion or retirement.
 */
import * as THREE from 'three';
import { SYSTEMS } from '../../src/game/state.js';
import { spawnLiveShip, removeLiveShip } from '../../src/systems/npc.js';
import { primeShipAsset } from '../../src/systems/ship-assets.js';
import { replanEscape, captureCondition } from '../../src/game/npc-escape.js';

export async function stageTrafficRetirement(ctx) {
  await Promise.all([
    primeShipAsset('redledger', 'cutter', 'pirate'),
    primeShipAsset('freehold', 'cutter', 'patrol'),
    primeShipAsset('freehold', 'cutter', 'trader'),
  ]);
  for (const live of ctx.ships) removeLiveShip(ctx, live);
  ctx.ships.length = 0;
  const sys = ctx.world.currentSystem;
  const station = new THREE.Vector3(...SYSTEMS[sys].station.position);
  ctx.ship.object.position.copy(station).add(new THREE.Vector3(0, 80, 60));
  ctx.ship.velocity?.set(0, 0, 0);
  ctx.input.fullStop = true;
  ctx.input.throttle = 0;
  ctx.targets.current = null;
  ctx.flags.docked = false;
  const bank = [];
  ctx.world.records = bank;
  ctx.world.recordBanks[sys] = bank;
  let seq = 0;
  function add(role, at, name) {
    const rec = {
      id: `i101-${++seq}`, name, role, classKey: 'cutter',
      faction: role === 'pirate' ? 'redledger' : 'freehold',
      system: sys, state: 'enroute', live: false, resolve: 60,
      cargo: [], route: [at.clone(), at.clone().add(new THREE.Vector3(0, 0, 300))]
        .map(({ x, y, z }) => ({ x, y, z })),
      legLens: [300], leg: 0, legT: 0, dir: 1, dwellUntil: ctx.world.time + 1000,
    };
    bank.push(rec);
    return rec;
  }
  for (let i = 0; i < 9; i++) {
    const angle = i * Math.PI * 2 / 9;
    const at = station.clone().add(new THREE.Vector3(Math.cos(angle) * 430, 0, Math.sin(angle) * 430));
    // Six patrols + three pirates keep the authored pirate mix legal even
    // before the admission under test. All nine share the yielded lifecycle.
    const rec = add(i < 6 ? 'patrol' : 'pirate', at, `Yielded ${i + 1}`);
    const plan = replanEscape(rec, { sysId: sys, pos: at, threatPos: null, now: ctx.world.time });
    // Start at the chosen approach endpoint. The live phase machine must
    // recognize arrival, serve its real calm dwell and finish the escape.
    const live = spawnLiveShip(ctx, rec, new THREE.Vector3(...plan.dest));
    live.state.surrendered = true;
    live.state.hull = 60;
    live.state.screen = 0;
    live.state.lastHitAt = ctx.world.time - 100;
    live.state.lastCombatAt = ctx.world.time - 100;
    live.ai.surrenderDone = true;
    live.ai.demandSent = true;
    live.ai.mode = 'flee';
    live.ai.fleeFrom = 'player';
    live.ai.velocity.set(0, 0, 0);
    live.ai.speed = 0;
    // A positive cargo-conservation witness on every potentially retired hull.
    live.state.cargo.push({ commodity: 'rawOre', units: 3 });
    rec.cargo = live.state.cargo;
    captureCondition(plan, live.state, live.ai, ctx.world.time, live.object);
    ctx.ships.push(live);
    rec.live = true;
  }
  const patrol = add('patrol', station.clone().add(new THREE.Vector3(0, 300, 0)), 'Patrol');
  const livePatrol = spawnLiveShip(ctx, patrol, new THREE.Vector3(...[patrol.route[0].x, patrol.route[0].y, patrol.route[0].z]));
  ctx.ships.push(livePatrol);
  patrol.live = true;
  const trader = add('trader', station.clone().add(new THREE.Vector3(0, 180, 420)), 'Patient Sorrow');
  trader.cargo = [{ commodity: 'rawOre', units: 5 }];
  return { ids: bank.slice(0, 9).map(r => r.id), traderId: trader.id, patrolId: patrol.id };
}

export function sampleTrafficRetirement(ctx, fixture) {
  return {
    time: ctx.world.time, count: ctx.ships.length,
    pirates: ctx.ships.filter(s => s.role === 'pirate').length,
    credits: ctx.world.credits, fear: ctx.world.fear,
    player: ctx.ship.object.position.toArray(),
    retiredLive: ctx.ships.filter(s => fixture.ids.includes(s.record.id)).map(s => s.record.id),
    traderLive: ctx.ships.some(s => s.record.id === fixture.traderId),
    records: ctx.world.records.filter(r => fixture.ids.includes(r.id)).map(r => ({
      id: r.id, phase: r.escape?.phase, reason: r.escape?.reason,
      hull: r.escape?.cond?.hull, surrendered: r.escape?.cond?.flags?.surrendered,
      live: r.live, cargo: r.cargo,
    })),
  };
}
