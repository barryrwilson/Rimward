/** Issue #267: reactive defense must not starve an engage lease of fire time.
 * The old defenseSense re-entry path let any landed hit bypass the resumeAt
 * gate, so a quarry that hit every ~0.9 s pinned the lease in 'evading'
 * (playtest: fire ~1 s per 45 s lease, defense.phase stuck between
 * evading/reengaging). Two guards keep the loop honest: a fresh hit re-enters
 * evade through the same resumeAt gate as every other cue, and the
 * reengagement window (2 s) is long enough for the ordinary nose realignment
 * that follows an evade excursion. Withdrawal keeps its instant latch.
 * Synthetic contact + emitted playerHit rows; the real controls update and
 * public v2 dispatcher run the lease.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, REACTIVE_DEFENSE } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

function fixture() {
  installDomStubs();
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3(); ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'reaver-rec', record: {}, object: new THREE.Object3D(), state: createShipState('cutter') };
  target.object.position.set(0, 0, -300);
  ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  const applyTick = (dt) => controls.update(dt);
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 105, closing: 5,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const dt = 1 / 60;
  const tick = () => {
    ctx.world.time += dt;
    const a = ctx.world.time * 1.2;
    target.object.position.set(Math.sin(a) * 120, Math.cos(a * 0.8) * 40,
      -Math.sqrt(Math.max(100, 300 * 300 - Math.sin(a) * 120 ** 2)));
    sample();
    controls.update(dt);
  };
  return { ctx, target, act, tick, applyTick, nextSeq: () => ++seq, dt };
}

test('tuning keeps the two-second reengagement window that fits post-evade alignment', () => {
  assert.equal(REACTIVE_DEFENSE.reengage, 2);
});

test('the first hit reacts instantly while the lease is fresh', () => {
  const f = fixture();
  const r = f.act('setCombatIntent', { seq: f.nextSeq(), ttl: 20, targetId: f.target.id, intent: 'engage' });
  assert.equal(r.ok, true, JSON.stringify(r));
  f.tick();
  assert.equal(f.ctx.player.hull, f.ctx.player.hull); // fixture sanity
  const before = agentControlStatus(f.ctx).combat.defense.phase;
  f.ctx.emit('playerHit', { damage: 8, family: 'energy', fromAft: false, t: f.ctx.world.time });
  f.ctx.lastEvents = f.ctx.events; f.ctx.events = [];
  f.tick();
  const d = agentControlStatus(f.ctx).combat.defense;
  assert.equal(d.phase, 'evading', 'first cue still enters evade immediately (was ' + before + ')');
});

test('a shooter landing hits every 0.9s cannot starve the engage lease of fire time', () => {
  const f = fixture();
  const r = f.act('setCombatIntent', { seq: f.nextSeq(), ttl: 45, targetId: f.target.id, intent: 'engage' });
  assert.equal(r.ok, true, JSON.stringify(r));
  let nextHit = 1.0, fireTime = 0, evadeTime = 0;
  const dt = f.dt;
  for (let i = 0; i < 45 / dt; i++) {
    const simT = f.ctx.world.time + dt;
    f.ctx.world.time = simT;
    const a = simT * 1.2;
    f.target.object.position.set(Math.sin(a) * 120, Math.cos(a * 0.8) * 40,
      -Math.sqrt(Math.max(100, 300 * 300 - Math.sin(a) * 120 ** 2)));
    const p = f.target.object.position, o = f.ctx.ship.object.position;
    f.ctx.targets.aim = { targetId: f.target.id, system: f.ctx.world.currentSystem, t: simT, weaponGroup: f.ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 105, closing: 5,
      bearing: localDir(f.ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
    if (simT >= nextHit) {
      nextHit += 0.9;
      f.ctx.emit('playerHit', { damage: 8, family: 'energy', fromAft: Math.random() < 0.5, t: simT });
      f.ctx.lastEvents = f.ctx.events; f.ctx.events = [];
    }
    f.applyTick(dt);
    const st = agentControlStatus(f.ctx);
    if (!st.combat) break;
    if (st.combat.defense.phase === 'evading') evadeTime += dt;
    if (!st.combat.fireBlocked) fireTime += dt;
  }
  console.log('    measured fire time: ' + fireTime.toFixed(1) + 's, evading ' + evadeTime.toFixed(1) + 's per 45s lease');
  assert.ok(fireTime >= 6, 'fire time must recover (>=6s, got ' + fireTime.toFixed(1) + 's; the #267 stall measured ~1.1s)');
  assert.ok(evadeTime <= 30, 'evade episodes must stay bounded (<=30s, got ' + evadeTime.toFixed(1) + 's; the stall measured ~41.6s)');
});

console.log('issue-267 defense starvation tests:', checks, 'passed');
if (checks !== 3) process.exit(1);
