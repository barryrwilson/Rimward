/**
 * PR1 Agent API Node contract (verifier). Does not import THREE via agent-observe.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail: detail || (ok ? 'ok' : 'FAIL') });
}

function src(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

const observeSrc = src('src/game/agent-observe.js');
const schemaSrc = src('src/game/agent-schema.js');
const apiSrc = src('src/systems/agent-api.js');
const mainSrc = src('src/main.js');
const ctxSrc = src('src/core/ctx.js');

const importThree = /(?:from|import)\s*\(?\s*['"]three['"]/;
check('observe-src-no-three-import', !importThree.test(observeSrc), 'direct import scan');
check('observe-src-no-from-three', !/from\s+['"]three['"]/.test(observeSrc));
check('schema-src-no-from-three', !/from\s+['"]three['"]/.test(schemaSrc));
check('api-src-no-from-three', !/from\s+['"]three['"]/.test(apiSrc));
check('observe-src-no-stringify-ctx', !/JSON\.stringify\(\s*ctx\s*\)/.test(observeSrc));
check('api-harvests-ctx-events', /const queue = ctx\.events/.test(apiSrc) && !/lastEvents/.test(apiSrc));
check('api-window-rimward', /w\.rimward\s*=\s*api/.test(apiSrc));
check('api-no-http', !/createServer|listen\(|WebSocket/.test(apiSrc));
check('api-no-badge-dom', !/createElement|innerHTML|textContent|badge/.test(apiSrc));
check('main-__ctx-debug', /window\.__ctx\s*=\s*ctx;\s*\/\/ debug/.test(mainSrc));
check(
  'main-agent-before-hud',
  /initAgentApi,\s*\n\s*initHud/.test(mainSrc)
);
check('ctx-agent-session', /agent:\s*\{[\s\S]*optIn:\s*false/.test(ctxSrc));
check('ctx-no-world-fields-agent', !/WORLD_FIELDS/.test(ctxSrc) || !/WORLD_FIELDS[^\n]*agent/.test(ctxSrc));

globalThis.window = {
  location: { search: '', href: 'http://127.0.0.1/node-contract' },
};
globalThis.location = globalThis.window.location;

const observeMod = await import(pathToFileURL(resolve(root, 'src/game/agent-observe.js')).href);
const schemaMod = await import(pathToFileURL(resolve(root, 'src/game/agent-schema.js')).href);
const { initAgentApi } = await import(pathToFileURL(resolve(root, 'src/systems/agent-api.js')).href);
const { buildObservation } = observeMod;

const missing = buildObservation(null);
check('no-ctx-ok-false', missing.ok === false && missing.error === 'no-ctx');
check('no-ctx-v1', missing.v === 1 && missing.t === 0 && missing.agentOptIn === false);
check('no-ctx-omit-ship', !Object.hasOwn(missing, 'ship') && !Object.hasOwn(missing, 'world'));
check('no-ctx-events-empty', Array.isArray(missing.events) && missing.events.length === 0);

const missingUndef = buildObservation(undefined);
check('no-ctx-undefined', missingUndef.error === 'no-ctx');

function makeCtx(extra = {}) {
  const ctx = {
    world: { time: 12.5, currentSystem: 'freehold', credits: 40, fear: 0, jobs: [], nav: null },
    ship: { object: { position: { x: 1, y: 2, z: 3 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } }, speed: 10 },
    player: { hull: 80, hullMax: 100, screen: 50, screenMax: 100, shell: 40, shellMax: 100, engine: 90, engineMax: 100, power: 1, heat: 0 },
    input: { throttle: 0.2, weaponGroup: 1 },
    flags: { docked: false, combat: false, paused: false, chartOpen: false, hailOpen: false, berthOpen: false, berthHold: false, matchSpeed: false, camera: 'chase' },
    bio: { mood: 'serene', hunger: 0, wounds: 0, bond: 0 },
    gate: { inZone: false, nearTo: null, jumping: false, progress: 0, destination: null },
    station: { inZone: false, name: '', systemName: '' },
    cargo: [],
    cargoCapacity: 20,
    ships: [],
    targets: { current: null },
    events: [],
    lastEvents: [],
    agent: { optIn: false, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] },
    emit(type, data = {}) {
      this.events.push({ type, t: this.world.time, ...data });
    },
    ...extra,
  };
  return ctx;
}

const ctx = makeCtx();
const sys = initAgentApi(ctx);
const rw = globalThis.window.rimward;
check('handle-installed', !!(rw && rw.version === 1 && typeof rw.observe === 'function' && typeof rw.act === 'function'));
check('handle-frozen', Object.isFrozen(rw));

let threw = false;
let snap;
try { snap = rw.observe(); } catch (e) { threw = true; snap = e; }
check('observe-no-throw', threw === false && snap.ok === true && snap.v === 1);
let jsonPlain = false;
try { JSON.stringify(snap); jsonPlain = true; } catch { jsonPlain = false; }
check('observe-json-plain', jsonPlain);
check('observe-no-function', typeof snap.ship === 'object' && typeof snap.ship.pos !== 'function');
check('observe-pos', Array.isArray(snap.ship.pos) && snap.ship.pos[0] === 1 && snap.ship.pos[2] === 3);
check('observe-credits-hud', snap.world.credits === 40);
check('observe-optin-false', snap.agentOptIn === false);

const tel = rw.act({ v: 1, name: 'teleport', args: {} });
check('teleport-forbidden-no-optin', tel.ok === false && tel.token === 'forbidden' && tel.name === 'teleport');
const god = rw.act({ name: 'god' });
check('god-forbidden', god.token === 'forbidden');
const setC = rw.act({ name: 'setCredits' });
check('setCredits-forbidden', setC.token === 'forbidden');
const pingClosed = rw.act({ v: 1, name: 'ping', args: {} });
check('ping-opt-in', pingClosed.ok === false && pingClosed.token === 'opt-in');

ctx.agent.optIn = true;
const pingOk = rw.act({ v: 1, name: 'ping', args: {} });
check('ping-when-in', pingOk.ok === true && pingOk.token === '' && pingOk.name === 'ping' && pingOk.v === 1);
const unk = rw.act({ v: 1, name: 'plotRoute', args: { dest: 'veridian' } });
check('plotRoute-unknown-pr1', unk.ok === false && unk.token === 'unknown');

ctx.flags.paused = true;
const pingPaused = rw.act({ name: 'ping' });
check('ping-ok-while-paused', pingPaused.ok === true);
const plotPaused = rw.act({ name: 'plotRoute', args: { dest: 'x' } });
check('later-name-paused', plotPaused.token === 'paused');
const disPaused = rw.act({ name: 'disable' });
check('disable-ok-while-paused', disPaused.ok === true && ctx.agent.optIn === false);
ctx.flags.paused = false;
ctx.agent.optIn = true;
ctx.flags.berthHold = true;
const pingHeld = rw.act({ name: 'ping' });
check('ping-ok-while-held', pingHeld.ok === true);
const plotHeld = rw.act({ name: 'plotRoute' });
check('later-name-held', plotHeld.token === 'held');
const holdStill = ctx.flags.berthHold === true;
check('act-does-not-write-berthHold', holdStill);
ctx.flags.berthHold = false;

const enableFake = rw.enable({ isTrusted: false });
check('enable-untrusted-opt-in', enableFake.ok === false && enableFake.token === 'opt-in');
const enableOk = rw.enable({ isTrusted: true });
check('enable-trusted', enableOk.ok === true && ctx.agent.optIn === true);

const creditsBefore = ctx.world.credits;
const posBefore = ctx.ship.object.position.x;
const throttleBefore = ctx.input.throttle;
rw.act({ name: 'setCredits', args: { n: 9999 } });
rw.act({ name: 'teleport', args: { x: 0, y: 0, z: 0 } });
rw.act({ name: 'ping' });
check('no-credit-write', ctx.world.credits === creditsBefore);
check('no-pos-write', ctx.ship.object.position.x === posBefore);
check('no-input-write', ctx.input.throttle === throttleBefore);

ctx.events.push({ type: 'commLine', t: 12.5, text: 'from-events', from: 'Echo' });
ctx.lastEvents.push({ type: 'commLine', t: 12.4, text: 'from-lastEvents', from: 'Ghost' });
sys.update(0.016, ctx);
const harvested = ctx.agent.events.map((e) => e && e.text);
check('harvest-ctx-events', harvested.includes('from-events'));
check('harvest-not-lastEvents', !harvested.includes('from-lastEvents'));

ctx.events = [{ type: 'hailOpened', t: 1, ship: { id: 'npc-1', ai: { secret: true } }, intents: ['pay', 'fight'], salvage: false }];
sys.update(0.016, ctx);
const hail = ctx.agent.events.find((e) => e && e.type === 'hailOpened');
check('hailOpened-no-ship', hail && !Object.hasOwn(hail, 'ship') && Array.isArray(hail.intents) && hail.intents[0] === 'pay');

ctx.agent.events = [];
ctx.events = [];
for (let i = 0; i < 20; i++) ctx.events.push({ type: 'commLine', t: i, text: `n${i}`, from: 'x' });
sys.update(0.016, ctx);
check('ring-cap-16', ctx.agent.events.length === 16);
check('ring-dropped-oldest', ctx.agent.events[0].text === 'n4' && ctx.agent.events[15].text === 'n19');

const observeAfter = rw.observe();
check('observe-copies-ring', observeAfter.events.some((e) => e.text === 'n19'));
check('observe-not-same-array', observeAfter.events !== ctx.agent.events);

ctx.location = undefined;
const win2 = { location: { search: '?agent=1', href: 'http://127.0.0.1/?agent=1' } };
globalThis.window = win2;
globalThis.location = win2.location;
const ctx2 = makeCtx();
initAgentApi(ctx2);
check('query-agent-1-optin', ctx2.agent.optIn === true);
check('query-installs-rimward', win2.rimward && win2.rimward.version === 1);
const pingQ = win2.rimward.act({ name: 'ping' });
check('query-ping-ok', pingQ.ok === true);

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({
  passed: results.filter((r) => r.ok).length,
  failed: failed.length,
  results,
}, null, 2));
if (failed.length) {
  console.error('NODE CONTRACT FAIL');
  process.exit(1);
}
console.log('NODE CONTRACT PASS');
