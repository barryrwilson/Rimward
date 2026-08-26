/**
 * Supplemental PR1 checks (verifier). Independent of node-contract comment scan.
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

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const observeSrc = src('src/game/agent-observe.js');
const schemaSrc = src('src/game/agent-schema.js');
const apiSrc = src('src/systems/agent-api.js');
const mainSrc = src('src/main.js');
const saveSrc = src('src/game/save.js');
const bootSrc = src('scripts/boot-test.mjs');

const observeCode = stripComments(observeSrc);
const schemaCode = stripComments(schemaSrc);
const apiCode = stripComments(apiSrc);

check('code-no-stringify-ctx', !/JSON\.stringify\(\s*ctx\s*\)/.test(observeCode + schemaCode + apiCode));
check('code-no-three-import', !/(?:from|import)\s*\(?\s*['"]three['"]/.test(observeCode + schemaCode + apiCode));
check('code-no-for-in', !/for\s*\(\s*\w+\s+in\s+/.test(observeCode + schemaCode + apiCode));
check('code-no-http', !/createServer|WebSocket|0\.0\.0\.0|XAI_API_KEY/.test(observeCode + schemaCode + apiCode));
check('api-no-innerHTML', !/innerHTML/.test(apiCode) && !/createElement/.test(apiCode));
check('api-harvest-events', /const queue = ctx\.events/.test(apiCode) && !/lastEvents/.test(apiCode));
check('main-__ctx-debug', /window\.__ctx\s*=\s*ctx;\s*\/\/ debug/.test(mainSrc));
check('save-no-agent', !/\bagent\b/.test(saveSrc) && !/optIn/.test(saveSrc));
check('world-fields-no-agent', /export const WORLD_FIELDS = \[[^\]]*\]/s.test(saveSrc)
  && !/WORLD_FIELDS = \[[^\]]*agent/s.test(saveSrc));
check('boot-wave127-block', bootSrc.includes('Wave 127 PR1: agent observe handle')
  && bootSrc.includes("console.log('WAVE127 AGENT-OBSERVE FAIL')"));
check('boot-before-errors-block', bootSrc.indexOf('WAVE127 AGENT-OBSERVE FAIL') < bootSrc.lastIndexOf('if (errors === 0)'));
check('boot-pins-handle', bootSrc.includes('rw.version === 1') && bootSrc.includes("typeof rw.observe === 'function'"));
check('boot-pins-no-ctx', bootSrc.includes("missing.error === 'no-ctx'") && bootSrc.includes("!Object.hasOwn(missing, 'ship')"));
check('boot-pins-forbidden', bootSrc.includes("name: 'teleport'") && bootSrc.includes("token === 'forbidden'"));
check('boot-pins-ping', bootSrc.includes("name: 'ping'") && bootSrc.includes('pingWhenIn'));
check('boot-pins-unknown', bootSrc.includes("name: 'plotRoute'") && bootSrc.includes("token === 'unknown'"));
check('boot-pins-ring-30', bootSrc.includes("tick(30, 'wave127 ring hold')") && bootSrc.includes('ringHeld'));

globalThis.window = { location: { search: '', href: 'http://127.0.0.1/extra' } };
globalThis.location = globalThis.window.location;

const { buildObservation } = await import(pathToFileURL(resolve(root, 'src/game/agent-observe.js')).href);
const { initAgentApi } = await import(pathToFileURL(resolve(root, 'src/systems/agent-api.js')).href);

const missing = buildObservation(null);
check('no-ctx-shape', missing.v === 1 && missing.t === 0 && missing.ok === false
  && missing.error === 'no-ctx' && missing.agentOptIn === false
  && Array.isArray(missing.events) && missing.events.length === 0
  && !Object.hasOwn(missing, 'ship') && !Object.hasOwn(missing, 'world')
  && !Object.hasOwn(missing, 'flags') && !Object.hasOwn(missing, 'nav'));

function makeCtx(extra = {}) {
  return {
    world: { time: 3, currentSystem: 'freehold', credits: 7, fear: 0, jobs: [], nav: null },
    ship: { object: { position: { x: 9, y: 8, z: 7 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } }, speed: 1 },
    player: { hull: 10, hullMax: 100 },
    input: { throttle: 0.1, weaponGroup: 2 },
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
    autopilot: { engaged: true, reason: 'nav' },
    automine: { engaged: true, reason: 'rock' },
    agent: { optIn: false, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] },
    ...extra,
  };
}

const ctx = makeCtx();
initAgentApi(ctx);
const rw = globalThis.window.rimward;

const names = ['teleport', 'setCredits', 'setHull', 'setCargo', 'god', 'win'];
for (const name of names) {
  const r = rw.act({ name });
  check(`forbidden-${name}`, r.ok === false && r.token === 'forbidden' && r.name === name && r.v === 1);
}

ctx.agent.optIn = true;
const telIn = rw.act({ name: 'teleport' });
check('forbidden-before-unknown-with-optin', telIn.token === 'forbidden');

ctx.flags.paused = true;
const telPaused = rw.act({ name: 'teleport' });
check('forbidden-before-paused', telPaused.token === 'forbidden');
const pingPaused = rw.act({ name: 'ping' });
check('ping-paused', pingPaused.ok === true);
ctx.flags.paused = false;
ctx.flags.berthHold = true;
const telHeld = rw.act({ name: 'teleport' });
check('forbidden-before-held', telHeld.token === 'forbidden');
const pingHeld = rw.act({ name: 'ping' });
check('ping-held', pingHeld.ok === true);
const plotHeld = rw.act({ name: 'plotRoute' });
check('plot-held', plotHeld.token === 'held' && plotHeld.token !== 'paused');
const apBefore = ctx.autopilot.engaged;
const amBefore = ctx.automine.engaged;
const dis = rw.act({ name: 'disable' });
check('disable-held-ok', dis.ok === true && ctx.agent.optIn === false);
check('disable-no-cancel-ap', ctx.autopilot.engaged === apBefore && ctx.autopilot.reason === 'nav');
check('disable-no-cancel-am', ctx.automine.engaged === amBefore);
check('disable-did-not-clear-hold', ctx.flags.berthHold === true);
ctx.flags.berthHold = false;

ctx.agent.optIn = true;
const credits = ctx.world.credits;
const px = ctx.ship.object.position.x;
const th = ctx.input.throttle;
rw.act({ name: 'setHull', args: { n: 1 } });
rw.act({ name: 'setCargo', args: { n: 1 } });
rw.act({ name: 'win' });
check('no-writes', ctx.world.credits === credits && ctx.ship.object.position.x === px && ctx.input.throttle === th);

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: failed.length, results }, null, 2));
if (failed.length) {
  console.error('EXTRA CONTRACT FAIL');
  process.exit(1);
}
console.log('EXTRA CONTRACT PASS');
