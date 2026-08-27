/**
 * Extra verifier pins for w136 agent API. Fake ctx. Does not edit src/.
 */
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

import { ORIGINS } from '../../../src/game/state.js';
import { actResult, reservedName } from '../../../src/game/agent-schema.js';

const { initAgentApi } = await import('../../../src/systems/agent-api.js');
const { buildObservation } = await import('../../../src/game/agent-observe.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
let fails = 0;
function pin(name, ok) {
  if (ok) {
    console.log('ok', name);
    return;
  }
  fails++;
  console.log('FAIL', name);
}

if (!globalThis.window || typeof globalThis.window !== 'object') {
  globalThis.window = globalThis;
}
const loc = globalThis.window.location && typeof globalThis.window.location === 'object'
  ? globalThis.window.location
  : {};
loc.search = '?agent=1';
loc.href = 'http://localhost/?agent=1';
globalThis.window.location = loc;
try { globalThis.window.rimward = undefined; } catch { /* ignore */ }

let titleOpen = false;
let originOpen = true;
let chosen = '';
const ctx = {
  flags: {
    paused: true,
    berthHold: false,
    docked: false,
    hailOpen: false,
    chartOpen: false,
    berthOpen: false,
    combat: false,
    camera: 'chase',
  },
  world: { time: 3, credits: 350, currentSystem: 'freehold', origin: '' },
  ship: { object: { position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } }, speed: 0 },
  player: { hull: 10, hullMax: 10 },
  input: { throttle: 0, weaponGroup: 1 },
  bio: { mood: 'serene', hunger: 0, wounds: 0, bond: 0 },
  gate: {},
  station: {},
  agent: { optIn: true, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] },
  events: [],
  automine: { engaged: false, reason: '' },
  autopilot: { engaged: false, reason: '' },
  titleApi: {
    isOpen() { return titleOpen; },
    start() { titleOpen = false; },
  },
  originsApi: {
    isOpen() { return originOpen; },
    choose(id) {
      if (!originOpen) return 'no-service';
      if (typeof id !== 'string' || !id || !Object.hasOwn(ORIGINS, id)) return 'unknown';
      chosen = id;
      originOpen = false;
      ctx.world.origin = id;
      ctx.flags.paused = false;
      return '';
    },
  },
};

initAgentApi(ctx);
const rw = globalThis.window.rimward;

pin('ORIGINS greenhand own', Object.hasOwn(ORIGINS, 'greenhand') === true);
pin('ORIGINS proto not own', Object.hasOwn(ORIGINS, '__proto__') === false);
pin('reserved proto', reservedName('__proto__') === true);

ctx.flags.berthHold = true;
const heldOrigin = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'greenhand' } });
pin('chooseOrigin held', heldOrigin.ok === false && heldOrigin.token === 'held' && chosen === '');
ctx.flags.berthHold = false;

ctx.agent.optIn = false;
const noOptOrigin = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'greenhand' } });
pin('chooseOrigin opt-in', noOptOrigin.ok === false && noOptOrigin.token === 'opt-in' && chosen === '');
ctx.agent.optIn = true;

const proto = rw.act({ v: 1, name: 'chooseOrigin', args: { id: '__proto__' } });
pin('chooseOrigin proto before api', proto.ok === false && proto.token === 'unknown' && originOpen === true);

const pick = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'greenhand' } });
pin('chooseOrigin real ORIGINS id', pick.ok === true && chosen === 'greenhand');

ctx.flags.paused = false;
ctx.flags.chartOpen = false;
ctx.flags.berthOpen = false;
ctx.flags.hailOpen = false;
ctx.models = { isOpen() { return false; } };

const plot = rw.act({ v: 1, name: 'plotRoute', args: { dest: 'redmarch' } });
pin('plotRoute ok', plot.ok === true && plot.token === '');
pin('plotRoute omits status', !Object.hasOwn(plot, 'status') || plot.status === '');
const obsPlot = rw.observe();
pin('plotRoute lastIntent omits status', !Object.hasOwn(obsPlot.lastIntent, 'status') || obsPlot.lastIntent.status === '');

const ping = rw.act({ v: 1, name: 'ping', args: {} });
pin('ping omits status', !Object.hasOwn(ping, 'status'));

const hail = rw.act({ v: 1, name: 'hail', args: {} });
pin('hail queued lastIntent', hail.status === 'queued' && hail.token === '');
const obsHail = rw.observe();
pin('observe lastIntent queued', obsHail.lastIntent.status === 'queued');
pin('observe phase playing', obsHail.session.phase === 'playing');

const srcApi = readFileSync(join(root, 'src/systems/agent-api.js'), 'utf8');
pin('agent-api no credits assign', !/credits\s*=/.test(srcApi));
pin('agent-api no position assign', !/\.position\s*=/.test(srcApi));
pin('agent-api no clearAutosave', !srcApi.includes('clearAutosave'));

const srcTitle = readFileSync(join(root, 'src/systems/title.js'), 'utf8');
const apiAt = srcTitle.indexOf('ctx.titleApi = {');
const startAt = srcTitle.indexOf('start() {', apiAt);
const startFn = srcTitle.slice(startAt, srcTitle.indexOf('},', startAt));
pin('title start has no clearAutosave', !startFn.includes('clearAutosave'));
pin('title start continue when save', startFn.includes("action === 'continue'"));
pin('title start new when no save', startFn.includes("action === 'new'"));

const srcCombat = readFileSync(join(root, 'src/systems/combat.js'), 'utf8');
pin('combat emitShieldDown primitives', srcCombat.includes("payload.actor = 'player'") && srcCombat.includes('payload.targetId'));

const emptyQueued = actResult({ ok: true, error: '', name: 'plotRoute', token: '', status: '' });
pin('empty status omitted on actResult', !Object.hasOwn(emptyQueued, 'status'));

originOpen = true;
titleOpen = false;
pin('phase origin extra', buildObservation(ctx).session.phase === 'origin');
titleOpen = true;
pin('phase title wins', buildObservation(ctx).session.phase === 'title');

if (fails) {
  console.log(`EXTRA PINS FAIL — ${fails}`);
  process.exit(1);
}
console.log('EXTRA PINS PASS');
