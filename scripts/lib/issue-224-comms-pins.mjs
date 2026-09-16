// Shared Node/full-boot and Chromium fixture. Explicit NPC/clock setup;
// production initNpc, spawnLiveShip and ctx.emit own every tested outcome.
import * as THREE from 'three';
import { COMM_REPEAT_SECONDS } from '../../src/game/state.js';
import { spawnLiveShip, removeLiveShip, initNpc } from '../../src/systems/npc.js';

export function runCommsPins(ctx) {
  const passed = [];
  const pin = (name, ok) => {
    if (!ok) throw new Error(`Issue #224: ${name}`);
    passed.push(name);
  };
  ctx.events = [];
  ctx.lastEvents = [];
  ctx.world.time = 1000;
  const emit = (from = 'I224 A', text = 'Heave to. Cargo or hull.') => ctx.emit('commLine', { from, text });
  emit();
  for (let i = 0; i < 60; i++) emit();
  pin('identical same-sender burst enqueues once', ctx.events.length === 1);
  ctx.world.time += COMM_REPEAT_SECONDS - 0.01;
  emit();
  pin('duplicate remains quiet before cooldown', ctx.events.length === 1);
  emit('I224 B');
  emit('I224 A', 'A different line');
  emit();
  pin('different sender and text survive; interleaving cannot bypass debounce', ctx.events.length === 3);
  ctx.world.time = 1000 + COMM_REPEAT_SECONDS;
  emit();
  pin('cooldown runs from accepted line, not suppressed attempts', ctx.events.length === 4);
  ctx.world.time = 10;
  emit();
  pin('clock rewind clears debounce', ctx.events.length === 5);
  ctx.emit('systemLoaded', { to: ctx.world.currentSystem });
  emit();
  pin('system load clears session debounce', ctx.events.length === 7);
  ctx.emit('npcFire', { target: 'player' });
  ctx.emit('npcFire', { target: 'player' });
  pin('non-comm events are never deduplicated', ctx.events.length === 9);

  // Real spawned hulls, isolated from background lane actors. Hold position
  // far outside law/acquire bubbles so the generic trader demand is eligible.
  for (const live of ctx.ships) removeLiveShip(ctx, live);
  ctx.ships.length = 0;
  ctx.events = [];
  ctx.lastEvents = [];
  ctx.world.time = 2000;
  ctx.world.jumpGraceUntil = 0;
  ctx.flags.paused = false;
  ctx.flags.berthOpen = false;
  ctx.flags.hailOpen = false;
  ctx.flags.chartOpen = false;
  ctx.cargo.length = 0;
  ctx.ship.object.position.set(30000, 30000, 30000);
  ctx.ship.velocity.set(0, 0, 0);
  const spawn = (role, n) => {
    const rec = {
      id: `i224-${n}`, name: `I224 ${role}`, role, classKey: 'light',
      faction: role === 'pirate' ? 'redledger' : 'freehold',
      resolve: 80, personality: 0, cargo: [], system: ctx.world.currentSystem,
      state: 'enroute', route: [{ x: 20000, y: 20000, z: 20000 }, { x: 20600, y: 20000, z: 20000 }],
      leg: 0, legT: 0, dir: 1,
    };
    const live = spawnLiveShip(ctx, rec, new THREE.Vector3(20000 + n * 100, 20000, 20000));
    pin(`${role} fixture spawned`, !!live);
    ctx.ships.push(live);
    live.ai.resolveAt = Infinity;
    return live;
  };
  const pirate = spawn('pirate', 1);
  const trader = spawn('trader', 2);
  pirate.ai.playerRolled = true;
  pirate.ai.playerInterested = false;
  const npc = initNpc(ctx);
  const arm = (target = trader) => {
    Object.assign(pirate.ai, { mode: 'hunt', target, phase: 'telegraph',
      phaseStart: ctx.world.time, commSent: false, demanding: false, demandSent: false });
  };
  const lines = () => ctx.events.filter(e => e.type === 'commLine' && e.from === pirate.state.name);
  for (const held of ['docked', 'berthHold']) {
    ctx.flags.docked = held === 'docked';
    ctx.flags.berthHold = held === 'berthHold';
    ctx.events = [];
    for (let i = 0; i < 60; i++) {
      arm();
      npc.update(1 / 60);
      ctx.world.time += 1 / 60;
    }
    pin(`${held}: repeated trader-demand telegraphs emit no comm`, lines().length === 0);
    arm('player');
    ctx.ship.object.position.copy(pirate.object.position).add(new THREE.Vector3(0, 0, 100));
    npc.update(1 / 60);
    pin(`${held}: demand against player emits no hail or comm`,
      !ctx.events.some(e => (e.type === 'hailOpened' && e.ship === pirate) || (e.type === 'commLine' && e.from === pirate.state.name)));
    ctx.ship.object.position.set(30000, 30000, 30000);
  }
  ctx.flags.docked = false;
  ctx.flags.berthHold = false;
  ctx.events = [];
  for (let i = 0; i < 60; i++) {
    arm();
    npc.update(1 / 60);
    ctx.world.time += 1 / 60;
  }
  pin('in-flight repeated telegraphs print exactly once', lines().length === 1);
  ctx.world.time += COMM_REPEAT_SECONDS;
  arm();
  npc.update(1 / 60);
  pin('in-flight NPC comm resumes after cooldown', lines().length === 2);
  arm('player');
  ctx.ship.object.position.copy(pirate.object.position).add(new THREE.Vector3(0, 0, 100));
  npc.update(1 / 60);
  pin('undocked eligible player demand still opens', ctx.events.some(e => e.type === 'hailOpened' && e.ship === pirate && e.demandHail));
  return passed;
}
