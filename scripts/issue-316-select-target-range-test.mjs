/** Issue #316: selectTarget names the targeting ceiling instead of no-service.
 *
 * The pirate playtest called `selectTarget { id: 'rec-7' }` eight times while
 * the hull sat at 752-873 u: every call answered `no-service`, the token an
 * overlay/service gate uses, while observe().availability.selectTarget read
 * ok:true. The runner retried instead of flying closer. The fix keeps the lock
 * and every in-range behaviour unchanged; a known hull/rock beyond the 600 u
 * ceiling now refuses token 'range' with a detail naming the target, its
 * distance and the ceiling, and observe() publishes the same sentence when no
 * cycle candidate is inside the ceiling. Unknown ids and bare cycles keep their
 * old tokens. Synthetic fixture; the real controls export, the public v2
 * dispatcher and buildObservation decide.
 */
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState, U } from '../src/game/state.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

const CEILING = U.TARGET_RANGE;
assert.equal(CEILING, 600, 'the targeting ceiling is the authored 600 u');

function shipFixture(id, at, name) {
  const s = {
    id,
    record: { name },
    object: new THREE.Object3D(),
    state: createShipState('light'),
  };
  s.object.position.set(at[0], at[1], at[2]);
  return s;
}

function rockFixture(at) {
  return { position: new THREE.Vector3(at[0], at[1], at[2]), radius: 5, ore: 100 };
}

function fixture() {
  installDomStubs();
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture';
  ctx.world.time = 1;
  ctx.systems = {};
  ctx.station = {};
  ctx.asteroids = { list: [] };
  ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D();
  ctx.ship.object.position.set(0, 0, 0);
  ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 66;
  ctx.player = createShipState('light');
  ctx.input.weaponGroup = 1;
  ctx.ships = [];
  initControls(ctx);
  initAgentApi(ctx);
  ctx.agent.optIn = true;
  window.__ctx = ctx; // the live handle act() reads; main.js assigns the same
  const api = window.rimward;
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  return { ctx, api, act };
}

test('inside the ceiling an id selection is unchanged and carries no detail', () => {
  const f = fixture();
  const near = shipFixture('rec-1', [0, 0, -300], 'Tallow-1');
  f.ctx.ships = [near];
  const r = f.act('selectTarget', { id: 'rec-1' });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.token, '');
  assert.equal(Object.hasOwn(r, 'detail'), false, 'in-range acceptance adds no detail');
  assert.equal(f.ctx.targets.current, near);
  const cycle = f.act('selectTarget', {});
  assert.equal(cycle.ok, true);
  assert.equal(cycle.status, 'queued', 'a bare cycle keeps the queued receipt');
});

test('a known hull beyond the ceiling refuses range with distance and ceiling', () => {
  const f = fixture();
  const far = shipFixture('rec-7', [0, 0, -766.4], 'Tallow-3');
  f.ctx.ships = [far];
  const r = f.act('selectTarget', { id: 'rec-7' });
  assert.equal(r.ok, false);
  assert.equal(r.token, 'range');
  assert.equal(r.error, 'range');
  assert.equal(typeof r.detail, 'string');
  assert.match(r.detail, /Tallow-3/);
  assert.match(r.detail, /rec-7/);
  assert.match(r.detail, /766 u/);
  assert.match(r.detail, new RegExp('targeting ceiling is ' + String(CEILING) + ' u'));
  assert.equal(f.ctx.targets.current, null, 'a range refusal moves no lock');
});

test('the playtest shape: the same sentence on act and availability, lock kept', () => {
  const f = fixture();
  const quarry = shipFixture('rec-7', [0, 0, -577], 'Tallow-3');
  f.ctx.ships = [quarry];
  assert.equal(f.act('selectTarget', { id: 'rec-7' }).ok, true);
  quarry.object.position.set(0, 0, -766.4); // the hull drifts past the ceiling
  const r = f.act('selectTarget', { id: 'rec-7' });
  assert.equal(r.token, 'range');
  assert.equal(f.ctx.targets.current, quarry, 'the retained lock survives the refusal');
  const obs = f.api.observe();
  const avail = obs.availability.selectTarget;
  assert.equal(avail.ok, false);
  assert.equal(avail.reason, 'range');
  assert.equal(avail.detail, r.detail, 'availability quotes the act refusal verbatim');
  assert.match(avail.detail, /766 u away/);
  // The lock itself is still observable while it sits outside the ceiling.
  assert.equal(obs.targets.current.id, 'rec-7');
  // Documented residual: availability is per-command and cannot see the
  // requested id. With an in-range candidate elsewhere it stays ok:true even
  // though an id-specific call for the far hull refuses range — the act
  // receipt is the authoritative refusal.
  f.ctx.ships.push(shipFixture('rec-near', [0, 0, -300], 'Tallow-9'));
  const nearAvail = f.api.observe().availability.selectTarget;
  assert.equal(nearAvail.ok, true, 'an in-range candidate keeps discovery open');
  assert.equal(nearAvail.reason, '');
  assert.equal(f.act('selectTarget', { id: 'rec-7' }).token, 'range');
});

test('an id that names nothing stays no-service with no detail', () => {
  const f = fixture();
  f.ctx.ships = [shipFixture('rec-1', [0, 0, -300], 'Tallow-1')];
  const unknown = f.act('selectTarget', { id: 'rec-99' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.token, 'no-service');
  assert.equal(Object.hasOwn(unknown, 'detail'), false);
  const numeric = f.act('selectTarget', { id: 42 }); // no rock 42 in the field
  assert.equal(numeric.token, 'no-service');
  assert.equal(Object.hasOwn(numeric, 'detail'), false);
});

test('bare cycles keep their old tokens', () => {
  const empty = fixture();
  assert.equal(empty.act('selectTarget', {}).token, 'no-service', 'nothing at all stays no-service');
  const farOnly = fixture();
  farOnly.ctx.ships = [shipFixture('rec-7', [0, 0, -766], 'Tallow-3')];
  assert.equal(farOnly.act('selectTarget', {}).token, 'no-service', 'a far-only cycle is unchanged');
});

test('docked still refuses docked and availability agrees', () => {
  const f = fixture();
  f.ctx.ships = [shipFixture('rec-1', [0, 0, -300], 'Tallow-1')];
  f.ctx.flags.docked = true;
  const r = f.act('selectTarget', { id: 'rec-1' });
  assert.equal(r.token, 'docked');
  const avail = f.api.observe().availability.selectTarget;
  assert.equal(avail.ok, false);
  assert.equal(avail.reason, 'docked');
  assert.equal(Object.hasOwn(avail, 'detail'), false);
});

test('a known rock beyond the ceiling refuses range only in the mining group', () => {
  const f = fixture();
  const rock = rockFixture([0, 0, -700]);
  f.ctx.asteroids = { list: [rock] };
  f.ctx.input.weaponGroup = 3;
  const r = f.act('selectTarget', { id: 0 });
  assert.equal(r.token, 'range', JSON.stringify(r));
  assert.match(r.detail, /rock 0/);
  assert.match(r.detail, /700 u away/);
  assert.equal(f.ctx.targets.current, null);
  // Weapon group 1 does not cycle rocks at all: the id is not a candidate.
  f.ctx.input.weaponGroup = 1;
  assert.equal(f.act('selectTarget', { id: 0 }).token, 'no-service');
  // An in-range rock in the mining group still selects.
  rock.position.set(0, 0, -300);
  f.ctx.input.weaponGroup = 3;
  assert.equal(f.act('selectTarget', { id: 0 }).ok, true);
  assert.equal(f.ctx.targets.current, rock);
});

test('the ceiling boundary is unchanged: 600 u in, 601 u out', () => {
  const f = fixture();
  const edge = shipFixture('rec-edge', [0, 0, -600], 'Edge');
  f.ctx.ships = [edge];
  const inside = f.act('selectTarget', { id: 'rec-edge' });
  assert.equal(inside.ok, true, 'exactly at the ceiling is still selectable');
  edge.object.position.set(0, 0, -601);
  const outside = f.act('selectTarget', { id: 'rec-edge' });
  assert.equal(outside.token, 'range');
  assert.match(outside.detail, /601 u away/);
  // A hair past the ceiling is not rounded down onto it: 600.4 u reads as
  // 600.4 u, never "600 u away" beside "ceiling is 600 u".
  edge.object.position.set(0, 0, -600.4);
  const justOut = f.act('selectTarget', { id: 'rec-edge' });
  assert.equal(justOut.token, 'range');
  assert.match(justOut.detail, /600\.4 u away/);
  assert.doesNotMatch(justOut.detail, /600 u away/);
});

test('receipts and the availability entry stay JSON-plain', () => {
  const f = fixture();
  f.ctx.ships = [shipFixture('rec-7', [0, 0, -766.4], 'Tallow-3')];
  const r = f.act('selectTarget', { id: 'rec-7' });
  const obs = f.api.observe();
  const avail = obs.availability.selectTarget;
  assert.equal(typeof avail.detail, 'string');
  assert.deepEqual(JSON.parse(JSON.stringify(avail)), avail, 'availability entry is JSON-plain');
  assert.deepEqual(JSON.parse(JSON.stringify(r)), r, 'the refusal receipt is JSON-plain');
  const last = obs.lastIntent;
  assert.ok(last && last.name === 'selectTarget', 'lastIntent mirrors the range receipt');
  assert.equal(last.detail, r.detail, 'lastIntent mirrors the detail');
});

console.log('issue-316 selectTarget range tests:', checks, 'passed');
if (checks !== 9) process.exit(1);
