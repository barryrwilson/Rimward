/**
 * Agent API hardening: startGame / chooseOrigin / phase / queued / pause reason.
 * Fake ctx. No DOM. Registers the CSS stub so agent-api's save/overlay chain loads.
 */
import { register } from 'node:module';

register('./css-hook.mjs', import.meta.url);

import * as THREE from 'three';
import { fwdFromQuat, pushRing, sanitizeEvent } from '../src/game/agent-schema.js';

const { initAgentApi } = await import('../src/systems/agent-api.js');
const { buildObservation } = await import('../src/game/agent-observe.js');

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
if (typeof loc.href !== 'string' || !loc.href.includes('agent=1')) {
  loc.href = 'http://localhost/?agent=1';
}
globalThis.window.location = loc;
try { globalThis.window.rimward = undefined; } catch { /* ignore */ }

const q = new THREE.Quaternion();
pin('spot fwdFromQuat identity', fwdFromQuat(q) !== null
  && Math.abs(fwdFromQuat(q)[0]) < 1e-6
  && Math.abs(fwdFromQuat(q)[1]) < 1e-6
  && Math.abs(fwdFromQuat(q)[2] + 1) < 1e-6);

let titleOpen = true;
let startCalls = 0;
let startErased = false;
let originOpen = true;
let chosen = '';
let originChooseCalls = 0;

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
  world: { time: 12, credits: 350, currentSystem: 'freehold', origin: '' },
  ship: {
    object: {
      position: { x: 1, y: 2, z: 3 },
      quaternion: q,
    },
    speed: 0,
    burnerActive: false,
    driftActive: false,
  },
  player: { hull: 10, hullMax: 10 },
  input: { throttle: 0, weaponGroup: 1, fullStop: false },
  bio: { mood: 'serene', hunger: 0, wounds: 0, bond: 0 },
  gate: {},
  station: {},
  agent: { optIn: true, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] },
  events: [],
  automine: { engaged: false, reason: 'pause' },
  autopilot: { engaged: false, reason: 'pause' },
  titleApi: {
    isOpen() { return titleOpen; },
    start() {
      startCalls++;
      startErased = false;
      titleOpen = false;
      ctx.flags.paused = false;
    },
  },
  originsApi: {
    isOpen() { return originOpen; },
    choose(id) {
      originChooseCalls++;
      if (!originOpen) return 'no-service';
      if (id === '__proto__' || id === 'constructor') return 'unknown';
      if (id !== 'greenhand' && id !== 'drifter') return 'unknown';
      chosen = id;
      originOpen = false;
      ctx.world.origin = id;
      ctx.flags.paused = false;
      return '';
    },
  },
};

const handle = initAgentApi(ctx);
const rw = globalThis.window.rimward;
pin('rimward handle', !!(rw && typeof rw.act === 'function' && typeof rw.observe === 'function'));

const obsTitle = rw.observe();
pin('phase title', obsTitle.session && obsTitle.session.phase === 'title');
pin('fwd on observe', Array.isArray(obsTitle.ship.fwd) && Math.abs(obsTitle.ship.fwd[2] + 1) < 1e-6);
pin('stale pause reason while paused kept', obsTitle.automine.reason === 'pause');

const pingPaused = rw.act({ v: 1, name: 'ping', args: {} });
pin('ping while paused', pingPaused.ok === true && pingPaused.token === '');

const dockPaused = rw.act({ v: 1, name: 'dock', args: {} });
pin('dock refused paused', dockPaused.ok === false && dockPaused.token === 'paused');

const start = rw.act({ v: 1, name: 'startGame', args: {} });
pin('startGame while paused', start.ok === true && start.token === '' && startCalls === 1);
pin('startGame no erase flag', startErased === false);
pin('startGame closed title', titleOpen === false && ctx.flags.paused === false);

const startAgain = rw.act({ v: 1, name: 'startGame', args: {} });
pin('startGame closed no-op', startAgain.ok === true && startCalls === 1);

ctx.flags.paused = true;
originOpen = true;
const protoPick = rw.act({ v: 1, name: 'chooseOrigin', args: { id: '__proto__' } });
pin('chooseOrigin proto refused', protoPick.ok === false && protoPick.token === 'unknown' && chosen === '');
const ctorPick = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'constructor' } });
pin('chooseOrigin constructor refused', ctorPick.ok === false && chosen === '');
const badPick = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'not-an-origin' } });
pin('chooseOrigin unknown', badPick.ok === false && badPick.token === 'unknown');

const pick = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'greenhand' } });
pin('chooseOrigin while paused', pick.ok === true && chosen === 'greenhand' && originChooseCalls >= 1);
pin('chooseOrigin closed overlay', originOpen === false);

const pickClosed = rw.act({ v: 1, name: 'chooseOrigin', args: { id: 'drifter' } });
pin('chooseOrigin closed no-service', pickClosed.ok === false && pickClosed.token === 'no-service' && chosen === 'greenhand');

ctx.flags.paused = true;
ctx.flags.berthHold = true;
originOpen = true;
const held = rw.act({ v: 1, name: 'startGame', args: {} });
pin('startGame held while berth', held.ok === false && held.token === 'held');
ctx.flags.berthHold = false;

ctx.agent.optIn = false;
const noOpt = rw.act({ v: 1, name: 'startGame', args: {} });
pin('startGame needs opt-in', noOpt.ok === false && noOpt.token === 'opt-in');
ctx.agent.optIn = true;

ctx.flags.paused = false;
titleOpen = false;
originOpen = false;
ctx.automine.reason = 'pause';
ctx.autopilot.reason = 'pause';
const obsPlay = rw.observe();
pin('phase playing', obsPlay.session && obsPlay.session.phase === 'playing');
pin('stale automine pause cleared', obsPlay.automine.reason === '');
pin('stale autopilot pause cleared', obsPlay.autopilot.reason === '');

originOpen = true;
const obsOrigin = buildObservation(ctx);
pin('phase origin', obsOrigin.session && obsOrigin.session.phase === 'origin');
originOpen = false;

ctx.flags.chartOpen = false;
ctx.flags.berthOpen = false;
ctx.flags.hailOpen = false;
ctx.models = { isOpen() { return false; } };
ctx.station = { inZone: false };
const dockRange = rw.act({ v: 1, name: 'dock', args: {} });
pin('dock out of zone range', dockRange.ok === false && dockRange.token === 'range' && dockRange.status !== 'queued');
ctx.station.inZone = true;
const hail = rw.act({ v: 1, name: 'hail', args: {} });
pin('hail queued token empty', hail.ok === true && hail.token === '' && hail.status === 'queued');
const dock = rw.act({ v: 1, name: 'dock', args: {} });
pin('dock queued token empty', dock.ok === true && dock.token === '' && dock.status === 'queued');
const pulse = rw.act({ v: 1, name: 'pulse', args: { edge: 'target' } });
pin('pulse queued', pulse.ok === true && pulse.token === '' && pulse.status === 'queued');
const ping = rw.act({ v: 1, name: 'ping', args: {} });
pin('ping has no status', ping.ok === true && !Object.hasOwn(ping, 'status'));

const tel = rw.act({ v: 1, name: 'teleport', args: {} });
pin('teleport forbidden', tel.ok === false && tel.token === 'forbidden');
const credits = rw.act({ v: 1, name: 'setCredits', args: { n: 99999 } });
pin('setCredits forbidden', credits.ok === false && credits.token === 'forbidden');
pin('credits unchanged', ctx.world.credits === 350);

ctx.events.push({ type: 'commLine', t: 1, text: 'same', from: 'dock' });
ctx.events.push({ type: 'commLine', t: 2, text: 'same', from: 'dock' });
ctx.events.push({ type: 'commLine', t: 3, text: 'other', from: 'dock' });
handle.update(0, ctx);
const lines = ctx.agent.events.filter((e) => e && e.type === 'commLine');
pin('harvest commLine dedup', lines.length === 2 && lines[0].text === 'same' && lines[1].text === 'other');

const ring = [];
const row = sanitizeEvent({
  type: 'shieldDown',
  t: 9,
  layer: 'screen',
  player: true,
  actor: 'player',
  ship: ctx.ship,
});
pushRing(ring, row);
pin('ring shieldDown no ship', ring.length === 1 && !Object.hasOwn(ring[0], 'ship') && ring[0].actor === 'player');

ctx.events.length = 0;
ctx.agent.events.length = 0;
ctx.events.push({ type: 'playerDestroyed', t: 40, ship: ctx.ship });
ctx.events.push({ type: 'commLine', t: 41, text: 'Heave to. Cargo or hull.', from: 'pirate' });
for (let i = 0; i < 20; i++) {
  ctx.events.push({ type: 'commLine', t: 42, text: 'Heave to. Cargo or hull.', from: 'pirate' });
}
ctx.events.push({ type: 'bodyHit', t: 43, kind: 'station', speed: 30, damage: 4, mesh: ctx.ship });
ctx.events.push({ type: 'recovered', t: 44, source: 'autosave' });
handle.update(0, ctx);
const harvested = ctx.agent.events;
pin('harvest playerDestroyed', harvested.some((e) => e && e.type === 'playerDestroyed'));
pin('harvest recovered', harvested.some((e) => e && e.type === 'recovered' && e.source === 'autosave'));
pin('harvest bodyHit', harvested.some((e) => e && e.type === 'bodyHit' && e.kind === 'station' && !Object.hasOwn(e, 'mesh')));
pin('harvest comm collapse keeps death', harvested.some((e) => e && e.type === 'playerDestroyed')
  && harvested.filter((e) => e && e.type === 'commLine').length <= 4);

let deathOpen = true;
ctx.deathApi = { isOpen() { return deathOpen; } };
titleOpen = false;
originOpen = false;
const obsDead = rw.observe();
pin('phase dead', obsDead.session && obsDead.session.phase === 'dead');
deathOpen = false;
pin('phase playing after recover', rw.observe().session.phase === 'playing');

ctx.input.fullStop = true;
pin('flags.fullStop', rw.observe().flags && rw.observe().flags.fullStop === true);
const ap = rw.act({ v: 1, name: 'engageAutopilot', args: {} });
pin('engageAutopilot clears fullStop', ctx.input.fullStop === false);
void ap;
ctx.input.fullStop = true;
rw.act({ v: 1, name: 'engageAutomine', args: {} });
pin('engageAutomine clears fullStop', ctx.input.fullStop === false);

ctx.flags.docked = true;
ctx.world.jobs = [{
  id: 'haul-1',
  kind: 'haul',
  state: 'accepted',
  reward: 140,
  commodity: 'provisions',
  units: 10,
  destSystem: 'veridian',
  destination: 'Veridian Exchange',
  deadline: 600,
  secret: () => {},
}];
ctx.world.prices = { provisions: 100 };
ctx.cargo = [{ commodity: 'provisions', units: 2 }];
let deskService = 'jobs';
ctx.stationDesk = {
  peekService() { return deskService; },
};
const jobsObs = rw.observe();
const job0 = jobsObs.jobs && jobsObs.jobs[0];
pin('jobs extra fields', !!(
  job0
  && job0.commodity === 'provisions'
  && job0.units === 10
  && job0.destSystem === 'veridian'
  && job0.destination === 'Veridian Exchange'
  && job0.deadline === 600
  && !Object.hasOwn(job0, 'secret')
));

ctx.world.jobs = [{
  kind: 'mining',
  need: 8,
  commodity: 'rawOre',
  deadline: 400,
}];
const mineObs = rw.observe();
const mine0 = mineObs.jobs && mineObs.jobs[0];
pin('mining job need', !!(
  mine0
  && mine0.kind === 'mining'
  && mine0.need === 8
  && mine0.commodity === 'rawOre'
  && mine0.deadline === 400
  && !Object.hasOwn(mine0, 'progress')
));
ctx.world.jobs = [{
  kind: 'mining',
  need: 8,
  progress: 0,
  commodity: 'rawOre',
  deadline: 400,
}];
const mineProgObs = rw.observe();
const mineProg = mineProgObs.jobs && mineProgObs.jobs[0];
pin('mining job progress', !!(
  mineProg
  && mineProg.need === 8
  && mineProg.progress === 0
));

pin('market omitted off desk', jobsObs.market == null);

deskService = 'market';
const mkt = rw.observe().market;
const provisions = mkt && Array.isArray(mkt.rows)
  ? mkt.rows.find((r) => r && r.commodity === 'provisions')
  : null;
pin('market block when service market', !!(
  mkt
  && provisions
  && provisions.name
  && provisions.posted === 100
  && provisions.hold === 2
  && provisions.legal === true
));
pin('market fill omitted without peekFillUnit', !!(
  provisions
  && provisions.posted === 100
  && !Object.hasOwn(provisions, 'fillBuy')
  && !Object.hasOwn(provisions, 'fillSell')
));

ctx.stationDesk.peekFillUnit = (key, buying) => {
  if (key === 'provisions') return buying ? 125 : 80;
  return 90;
};
let mktFill = null;
let fillThrew = false;
try { mktFill = rw.observe().market; } catch { fillThrew = true; }
const provisionsFill = mktFill && Array.isArray(mktFill.rows)
  ? mktFill.rows.find((r) => r && r.commodity === 'provisions')
  : null;
pin('market fillBuy from peekFillUnit', !!(
  fillThrew === false
  && provisionsFill
  && provisionsFill.posted === 100
  && provisionsFill.fillBuy === 125
  && provisionsFill.fillSell === 80
));

ctx.stationDesk.peekFillUnit = () => Number.NaN;
let mktNan = null;
let nanThrew = false;
try { mktNan = rw.observe().market; } catch { nanThrew = true; }
const provisionsNan = mktNan && Array.isArray(mktNan.rows)
  ? mktNan.rows.find((r) => r && r.commodity === 'provisions')
  : null;
pin('market fill omitted when peek non-finite', !!(
  nanThrew === false
  && provisionsNan
  && provisionsNan.posted === 100
  && !Object.hasOwn(provisionsNan, 'fillBuy')
  && !Object.hasOwn(provisionsNan, 'fillSell')
));

ctx.stationDesk.peekFillUnit = () => { throw new Error('peek boom'); };
let mktBoom = null;
let boomThrew = false;
try { mktBoom = rw.observe().market; } catch { boomThrew = true; }
const provisionsBoom = mktBoom && Array.isArray(mktBoom.rows)
  ? mktBoom.rows.find((r) => r && r.commodity === 'provisions')
  : null;
pin('market peekFillUnit throw omit fill', !!(
  boomThrew === false
  && provisionsBoom
  && provisionsBoom.posted === 100
  && !Object.hasOwn(provisionsBoom, 'fillBuy')
  && !Object.hasOwn(provisionsBoom, 'fillSell')
));
delete ctx.stationDesk.peekFillUnit;
deskService = 'jobs';
ctx.flags.docked = false;
pin('jobs empty undocked', Array.isArray(rw.observe().jobs) && rw.observe().jobs.length === 0);

ctx.flags.docked = true;
const selDocked = rw.act({ v: 1, name: 'selectTarget', args: {} });
pin('selectTarget docked', selDocked.ok === false && selDocked.token === 'docked');
ctx.flags.docked = false;

ctx.hailApi = undefined;
const hailMissing = rw.act({ v: 1, name: 'hailResolve', args: { intent: 'pay' } });
pin('hailResolve missing api no-service', hailMissing.ok === false && hailMissing.token === 'no-service');
ctx.flags.hailOpen = false;
ctx.hailApi = {
  peek() { return { intents: [], open: false }; },
  resolve() {},
};
const hailClosed = rw.act({ v: 1, name: 'hailResolve', args: { intent: 'pay' } });
pin('hailResolve closed', hailClosed.ok === false && hailClosed.token === 'closed');

const optBefore = ctx.agent.optIn;
ctx.agent.events.push({ type: 'playerDestroyed', t: 99 });
const ringBefore = ctx.agent.events.length;
ctx.world.credits = 1;
ctx.world.time = 0;
pin('restore does not clear optIn', ctx.agent.optIn === optBefore);
pin('restore does not empty ring', ctx.agent.events.length === ringBefore);

if (fails) {
  console.log(`AGENT API HARDENING FAIL — ${fails}`);
  process.exit(1);
}
console.log('AGENT API HARDENING PASS');
