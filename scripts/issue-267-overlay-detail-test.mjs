/** Issue #267: 'overlay' refusals name the surface that owns the screen.
 * The playtest showed setControl refusing 'overlay' for 25 s while observe()
 * published no open overlay: the gate folds typing focus, settings, title and
 * the models browser into the same token as the hail/chart/berth cards, and
 * observe() only published the cards. Now the act() receipt carries a detail
 * string naming the surface and the observe() availability entry carries the
 * same words, so a runner can see why without guessing. Synthetic DOM focus and
 * settings API; the real controls gate and the public v2 dispatcher decide.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
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
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3(); ctx.ship.speed = 66;
  ctx.player = createShipState('light');
  const target = { id: 'rec-13', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -215);
  ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  ctx.agent.optIn = true;
  window.__ctx = ctx; // the live handle act() reads; main.js assigns the same
  const api = window.rimward;
  let seq = 0;
  function sample() {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 0, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x - o.x, p.y - o.y, p.z - o.z) };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const setTyping = (v) => { document.activeElement = v ? { tagName: 'INPUT' } : null; };
  return { ctx, target, api, act, setTyping, sample, nextSeq: () => ++seq };
}

function refusedOverlay(r) {
  assert.equal(r.ok, false);
  assert.equal(r.token, 'overlay');
  assert.equal(typeof r.detail, 'string', 'overlay refusal carries detail');
  assert.ok(r.detail.length > 0, 'overlay detail is not empty');
  return r.detail;
}

test('typing focus refuses both leases and names typing in act and observe', () => {
  const f = fixture();
  f.setTyping(true);
  const raw = refusedOverlay(f.act('setControl', { seq: f.nextSeq(), ttl: 1 }));
  const tac = refusedOverlay(f.act('setCombatIntent', { seq: f.nextSeq(), ttl: 5, targetId: f.target.id, intent: 'engage' }));
  assert.match(raw, /typing/);
  assert.match(tac, /typing/);
  const obs = f.api.observe();
  assert.equal(obs.availability.setControl.reason, 'overlay');
  assert.equal(obs.availability.setControl.detail, raw);
  assert.equal(obs.availability.setCombatIntent.reason, 'overlay');
  assert.equal(obs.availability.setCombatIntent.detail, tac);
  f.setTyping(false);
});

test('an open settings panel refuses and names settings without any card flag', () => {
  const f = fixture();
  f.ctx.settingsApi = { isOpen: () => true };
  const detail = refusedOverlay(f.act('setControl', { seq: f.nextSeq(), ttl: 1 }));
  assert.match(detail, /settings/);
  const obs = f.api.observe();
  assert.equal(obs.availability.setControl.reason, 'overlay');
  assert.equal(obs.availability.setControl.detail, detail);
  delete f.ctx.settingsApi;
});

test('published cards keep the overlay token and now name the card', () => {
  const f = fixture();
  f.ctx.flags.chartOpen = true;
  assert.match(refusedOverlay(f.act('setControl', { seq: f.nextSeq(), ttl: 1 })), /chart/);
  f.ctx.flags.chartOpen = false;
  f.ctx.flags.berthOpen = true;
  assert.match(refusedOverlay(f.act('setControl', { seq: f.nextSeq(), ttl: 1 })), /berth/);
  f.ctx.flags.berthOpen = false;
  f.ctx.flags.hailOpen = true;
  assert.match(refusedOverlay(f.act('setControl', { seq: f.nextSeq(), ttl: 1 })), /hail/);
  f.ctx.flags.hailOpen = false;
  // observe agrees per card
  f.ctx.flags.chartOpen = true;
  const obs = f.api.observe();
  assert.equal(obs.availability.setControl.detail, 'galaxy chart open');
  f.ctx.flags.chartOpen = false;
});

test('a combat grant still keeps its authority through an open hail card', () => {
  const f = fixture();
  const grant = f.act('setCombatIntent', { seq: f.nextSeq(), ttl: 45, targetId: f.target.id, intent: 'engage' });
  assert.equal(grant.ok, true, JSON.stringify(grant));
  f.ctx.flags.hailOpen = true;
  // explicit renewals stay permitted; the availability view agrees
  const obs = f.api.observe();
  assert.equal(obs.availability.setCombatIntent.ok, true);
  assert.equal(obs.availability.setControl.reason, 'overlay');
  const renew = f.act('setCombatIntent', { seq: f.nextSeq(), ttl: 45, targetId: f.target.id, intent: 'engage' });
  assert.equal(renew.ok, true, JSON.stringify(renew));
  f.ctx.flags.hailOpen = false;
});

test('with nothing on screen the same requests are accepted and observe is clean', () => {
  const f = fixture();
  const r = f.act('setControl', { seq: f.nextSeq(), ttl: 1 });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(Object.hasOwn(r, 'detail'), false, 'accepted leases carry no detail');
  const obs = f.api.observe();
  assert.equal(obs.availability.setControl.ok, true);
  assert.equal(Object.hasOwn(obs.availability.setControl, 'detail'), false);
});

console.log('issue-267 overlay-detail tests:', checks, 'passed');
if (checks !== 5) process.exit(1);
