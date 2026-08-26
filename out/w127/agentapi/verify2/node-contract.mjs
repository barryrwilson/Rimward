/**
 * WAVE127 re-verify: first-install handle, live __ctx, no-ctx, teleport.
 * Does not import THREE via agent-observe. Does not edit src/.
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

const apiSrc = src('src/systems/agent-api.js');
const observeSrc = src('src/game/agent-observe.js');

check('src-first-install-guard', /if\s*\(\s*w\s*&&\s*!isPublicHandle\(\s*w\.rimward\s*\)\s*\)/.test(apiSrc));
check('src-readLiveCtx', /function readLiveCtx\(fallback\)/.test(apiSrc)
  && /const live = w && w\.__ctx/.test(apiSrc)
  && /if \(live && typeof live === 'object'\) return live/.test(apiSrc));
check('src-observe-live', /return buildObservation\(readLiveCtx\(ctx\)\)/.test(apiSrc));
check('src-act-live', /return dispatchAct\(readLiveCtx\(ctx\),\s*command\)/.test(apiSrc));
check('src-rimward-assign-once', (apiSrc.match(/w\.rimward\s*=\s*api/g) || []).length === 1);
check('src-assign-inside-guard', apiSrc.indexOf('if (w && !isPublicHandle(w.rimward))') < apiSrc.indexOf('w.rimward = api'));
check('src-no-always-replace', !/w\.rimward\s*=\s*api;\s*\n\s*\}/.test(apiSrc)
  || apiSrc.includes('if (w && !isPublicHandle(w.rimward))'));
check('observe-src-no-from-three', !/from\s+['"]three['"]/.test(observeSrc));
check('observe-src-no-stringify-ctx', !/JSON\.stringify\(\s*ctx\s*\)/.test(observeSrc));

globalThis.window = {
  location: { search: '', href: 'http://127.0.0.1/verify2-node' },
};
globalThis.location = globalThis.window.location;

const { buildObservation } = await import(pathToFileURL(resolve(root, 'src/game/agent-observe.js')).href);
const { initAgentApi } = await import(pathToFileURL(resolve(root, 'src/systems/agent-api.js')).href);

const missing = buildObservation(null);
check('no-ctx-ok-false', missing.ok === false && missing.error === 'no-ctx');
check('no-ctx-v1', missing.v === 1 && missing.t === 0 && missing.agentOptIn === false);
check('no-ctx-omit-ship', !Object.hasOwn(missing, 'ship') && !Object.hasOwn(missing, 'world'));
check('no-ctx-events-empty', Array.isArray(missing.events) && missing.events.length === 0);
check('no-ctx-undefined', buildObservation(undefined).error === 'no-ctx');

function makeCtx(extra = {}) {
  return {
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
    ...extra,
  };
}

const ctxA = makeCtx();
initAgentApi(ctxA);
const rw1 = globalThis.window.rimward;
check('handle-installed', !!(rw1 && rw1.version === 1 && typeof rw1.observe === 'function' && typeof rw1.act === 'function'));
check('handle-frozen', Object.isFrozen(rw1));

const tel = rw1.act({ v: 1, name: 'teleport', args: {} });
check('teleport-forbidden-no-optin', tel.ok === false && tel.token === 'forbidden' && tel.name === 'teleport');

const ctxB = makeCtx();
initAgentApi(ctxB);
const rw2 = globalThis.window.rimward;
check('nested-init-same-handle', rw2 === rw1);

ctxA.agent.optIn = true;
ctxB.agent.optIn = false;
const pingAfterNested = rw1.act({ v: 1, name: 'ping', args: {} });
check('wave127-first-ctx-ping-no-__ctx', pingAfterNested.ok === true && pingAfterNested.token === '');
const unkAfterNested = rw1.act({ v: 1, name: 'plotRoute', args: { dest: 'veridian' } });
check('wave127-first-ctx-unknown-no-__ctx', unkAfterNested.ok === false && unkAfterNested.token === 'unknown');
ctxA.agent.optIn = false;

const ctxLive = makeCtx();
ctxLive.agent.optIn = true;
globalThis.window.__ctx = ctxLive;
const pingLive = rw1.act({ v: 1, name: 'ping', args: {} });
check('live-__ctx-ping', pingLive.ok === true && pingLive.token === '');
const telLive = rw1.act({ name: 'teleport' });
check('live-__ctx-teleport-forbidden', telLive.token === 'forbidden');
const unkLive = rw1.act({ name: 'plotRoute' });
check('live-__ctx-unknown', unkLive.token === 'unknown');
const snapLive = rw1.observe();
check('live-__ctx-observe-credits', snapLive.ok === true && snapLive.world && snapLive.world.credits === 40);
ctxLive.world.credits = 99;
const snapLive2 = rw1.observe();
check('live-__ctx-observe-follows', snapLive2.world && snapLive2.world.credits === 99);

delete globalThis.window.__ctx;
ctxA.agent.optIn = false;
const pingFallbackClosed = rw1.act({ name: 'ping' });
check('fallback-first-ctx-after-delete-__ctx', pingFallbackClosed.token === 'opt-in');
ctxA.agent.optIn = true;
const pingFallbackOpen = rw1.act({ name: 'ping' });
check('fallback-first-ctx-ping', pingFallbackOpen.ok === true);

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
