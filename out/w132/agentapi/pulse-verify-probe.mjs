/**
 * Scoped PR3 pulse/act verifier. Does not start Vite/Chrome. Does not edit src/.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isLiveCommand,
  isPr1LiveCommand,
  isForbiddenName,
  COMMAND_NAMES,
} from '../../../src/game/agent-schema.js';
import {
  agentPulse,
  agentSetWeaponGroup,
  agentSelectTarget,
  initControls,
} from '../../../src/systems/controls.js';
import { initAgentApi } from '../../../src/systems/agent-api.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const apiSrc = readFileSync(join(root, 'src/systems/agent-api.js'), 'utf8');
const controlsSrc = readFileSync(join(root, 'src/systems/controls.js'), 'utf8');
const schemaSrc = readFileSync(join(root, 'src/game/agent-schema.js'), 'utf8');

const PASS = [];
const FAIL = [];

function check(name, cond, extra) {
  if (cond) PASS.push(name);
  else FAIL.push(extra ? `${name} — ${extra}` : name);
}

function installHost() {
  const listeners = {};
  const doc = {
    body: { children: [] },
    activeElement: null,
    getElementById() { return null; },
  };
  const win = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener() {},
    dispatch(type, ev) {
      const list = listeners[type] || [];
      for (const fn of list) fn(ev);
    },
  };
  globalThis.window = win;
  globalThis.document = doc;
  delete win.rimward;
  delete win.__ctx;
  return { win, doc, listeners };
}

function makeInput() {
  return {
    steerX: 0,
    steerY: 0,
    strafeX: 0,
    strafeY: 0,
    roll: 0,
    throttle: 0,
    fullStop: false,
    afterburnerPressed: false,
    driftHeld: false,
    fireHeld: false,
    weaponGroup: 1,
    targetPressed: false,
    hailPressed: false,
    dockPressed: false,
    cameraPressed: false,
    matchSpeedPressed: false,
    reticleLockPressed: false,
    throttleHeld: false,
    pausePressed: false,
  };
}

function pos(d2 = 0) {
  return {
    x: 0, y: 0, z: 0,
    distanceToSquared() { return d2; },
  };
}

function liveCtx(over = {}) {
  const events = [];
  const baseFlags = {
    docked: false,
    paused: false,
    chartOpen: false,
    hailOpen: false,
    berthOpen: false,
    berthHold: false,
    camera: 'chase',
    firstPerson: false,
  };
  const baseAgent = { optIn: true, lastIntent: { name: '', ok: true, error: '', token: '', t: 0 }, events: [] };
  const ctx = {
    emit(type, payload) { events.push({ type, payload }); },
    lastEvents: [],
    events,
    input: makeInput(),
    flags: { ...baseFlags, ...(over.flags || {}) },
    agent: { ...baseAgent, ...(over.agent || {}) },
    world: { time: 1, credits: 10, currentSystem: 'here', nav: null },
    config: { controls: [] },
    ship: { object: { position: pos(0) }, speed: 0 },
    ships: [],
    asteroids: { list: [] },
    targets: { current: null, reticleScreen: { x: 0, y: 0 }, part: null },
    models: { isOpen() { return false; } },
    gate: { jumping: false },
    station: { position: pos(0) },
  };
  const { flags, agent, ...rest } = over;
  Object.assign(ctx, rest);
  if (flags) ctx.flags = { ...baseFlags, ...flags };
  if (agent) ctx.agent = { ...baseAgent, ...agent };
  return ctx;
}

function actOf(ctx) {
  installHost();
  globalThis.window.__ctx = ctx;
  initAgentApi(ctx);
  return globalThis.window.rimward.act;
}

// --- schema ---
check('live dock', isLiveCommand('dock') === true);
check('live hail', isLiveCommand('hail') === true);
check('live selectTarget', isLiveCommand('selectTarget') === true);
check('live pulse', isLiveCommand('pulse') === true);
check('live setWeaponGroup', isLiveCommand('setWeaponGroup') === true);
check('pr1 ping', isPr1LiveCommand('ping') === true);
check('pr1 not dock', isPr1LiveCommand('dock') === false);
check('teleport forbidden', isForbiddenName('teleport') === true);
check('no fireHeld name', !COMMAND_NAMES.includes('fireHeld') && !isLiveCommand('fireHeld'));
check('no camera name', !COMMAND_NAMES.includes('camera') && !isLiveCommand('camera'));
check('no afterburner name', !COMMAND_NAMES.includes('afterburner') && !isLiveCommand('afterburner'));

// --- static agent-api ---
check('api imports agentPulse', /import \{[^}]*agentPulse/.test(apiSrc));
check('api imports agentSetWeaponGroup', apiSrc.includes('agentSetWeaponGroup'));
check('api imports agentSelectTarget', apiSrc.includes('agentSelectTarget'));
check('api no ctx.input assign', !/ctx\.input(\.[A-Za-z]+|\[[^\]]+\])\s*=/.test(apiSrc) && !/ctx\.input\s*=/.test(apiSrc));
check('api no berthHold write', !/flags\.berthHold\s*=(?!=)/.test(apiSrc));
check('api no position write', !/ship\.object\.position/.test(apiSrc));
check('api no credits write', !/credits\s*(\+|)=/.test(apiSrc));
check('api no targets.current write', !/ctx\.targets\.current\s*=/.test(apiSrc));
check('api no fireHeld', !/fireHeld/.test(apiSrc));
check('api no camera pulse', !/agentPulse\(ctx,\s*'camera'\)/.test(apiSrc));
check('api no afterburner pulse', !/agentPulse\(ctx,\s*'afterburner'\)/.test(apiSrc));

const dispatchActBody = apiSrc.slice(apiSrc.indexOf('function dispatchAct'), apiSrc.indexOf('export function initAgentApi'));
const iForbidden = dispatchActBody.indexOf('isForbiddenName');
const iOptIn = dispatchActBody.indexOf("optIn !== true");
const iPing = dispatchActBody.indexOf("name === 'ping'");
const iDisable = dispatchActBody.indexOf("name === 'disable'");
const iPaused = dispatchActBody.indexOf("flags.paused === true");
const iHeld = dispatchActBody.indexOf("flags.berthHold === true");
const iLive = dispatchActBody.indexOf('isLiveCommand');
check(
  'gate order source',
  iForbidden >= 0 && iForbidden < iOptIn && iOptIn < iPing && iPing < iDisable && iDisable < iPaused && iPaused < iHeld && iHeld < iLive,
  `idx f=${iForbidden} o=${iOptIn} p=${iPing} d=${iDisable} pa=${iPaused} h=${iHeld} l=${iLive}`,
);

// --- static controls ---
check('four pulse edges', controlsSrc.includes("new Set(['dock', 'hail', 'target', 'reticleLock'])"));
check('KeyJ pendingDock', /case 'KeyJ':[\s\S]*?pendingDock = true/.test(controlsSrc));
check('KeyH pendingHail', /case 'KeyH':[\s\S]*?pendingHail = true/.test(controlsSrc));
check('KeyT pendingTarget', /case 'KeyT':[\s\S]*?pendingTarget = true/.test(controlsSrc));
check('KeyV pendingReticleLock', /case 'KeyV':[\s\S]*?pendingReticleLock = true/.test(controlsSrc));
check('timing comment', controlsSrc.includes("act({ name:'dock' })") && controlsSrc.includes('pendingDock'));
const wgFn = controlsSrc.split('export function agentSetWeaponGroup')[1] || '';
check('wg uses skip helper', /shouldSkipWeaponGroupDigits\(ctx\)/.test(wgFn));
check('no agentSetFireHeld', !/agentSetFireHeld/.test(controlsSrc));
check('no camera in PULSE_EDGES', !/PULSE_EDGES = new Set\(\[[^\]]*camera/.test(controlsSrc));

// --- agentPulse edges ---
check('bad edge camera', agentPulse({}, 'camera') === 'unknown');
check('bad edge afterburner', agentPulse({}, 'afterburner') === 'unknown');
check('bad edge fire', agentPulse({}, 'fireHeld') === 'unknown');
check('proto edge', agentPulse({}, '__proto__') === 'unknown');
check('constructor edge', agentPulse({}, 'constructor') === 'unknown');
check('missing edge type', agentPulse({}, undefined) === 'unknown');
check('numeric edge', agentPulse({}, 1) === 'unknown');
check('target edge ok', agentPulse({}, 'target') === '');
check('reticle edge ok', agentPulse({}, 'reticleLock') === '');

const hailBlock = { flags: { chartOpen: true } };
check('hail chart overlay', agentPulse(hailBlock, 'hail') === 'no-service');
check('hail berth overlay', agentPulse({ flags: { berthOpen: true } }, 'hail') === 'no-service');

let hailThrew = false;
let hailTok = 'unset';
try {
  hailTok = agentPulse({
    models: { isOpen() { throw new Error('boom'); } },
    flags: {},
  }, 'hail');
} catch (err) {
  hailThrew = true;
  hailTok = String(err && err.message);
}
check('hail never throws', hailThrew === false);
check('hail isOpen throw token string', typeof hailTok === 'string');

const dockSkip = {
  models: { isOpen() { return true; } },
};
check('dock skip models', agentPulse(dockSkip, 'dock') === 'no-service');
check('dock ok', agentPulse({ models: { isOpen() { return false; } } }, 'dock') === '');

// --- weapon group ---
const wg = { flags: {}, input: { weaponGroup: 1 } };
check('wg 3', agentSetWeaponGroup(wg, 3) === '' && wg.input.weaponGroup === 3);
check('wg 0', agentSetWeaponGroup(wg, 0) === 'bad-qty');
check('wg 6', agentSetWeaponGroup(wg, 6) === 'bad-qty');
check('wg 1.5', agentSetWeaponGroup(wg, 1.5) === 'bad-qty');
check('wg string', agentSetWeaponGroup(wg, '3') === 'bad-qty');
check('wg skip docked', agentSetWeaponGroup({ flags: { docked: true }, input: { weaponGroup: 1 } }, 2) === 'no-service');
check('wg skip hailOpen', agentSetWeaponGroup({ flags: { hailOpen: true }, input: { weaponGroup: 1 } }, 2) === 'no-service');
check('wg skip chart', agentSetWeaponGroup({ flags: { chartOpen: true }, input: { weaponGroup: 1 } }, 2) === 'no-service');
const wgKeep = { flags: { docked: true }, input: { weaponGroup: 4 } };
check('wg skip does not write', agentSetWeaponGroup(wgKeep, 1) === 'no-service' && wgKeep.input.weaponGroup === 4);

// --- selectTarget ---
const none = {
  flags: {},
  input: { weaponGroup: 1 },
  targets: { current: 'keep' },
  ship: { object: null },
  ships: [],
};
check('none in range', agentSelectTarget(none) === 'no-service' && none.targets.current === 'keep');

const npc = { id: 'npc-1', object: { position: pos(1) }, state: {} };
const far = { id: 'far', object: { position: pos(999999999) }, state: {} };
const field = {
  flags: {},
  input: { weaponGroup: 1 },
  targets: { current: null },
  ship: { object: { position: pos(0) } },
  ships: [npc, far],
};
check('select by id', agentSelectTarget(field, 'npc-1') === '' && field.targets.current === npc);
check('select proto id', agentSelectTarget(field, '__proto__') === 'no-service');
check('select constructor id', agentSelectTarget(field, 'constructor') === 'no-service');
check('select far id', agentSelectTarget(field, 'far') === 'no-service');
check('select cycle pulses', agentSelectTarget(field) === '');

const rock = { position: pos(4) };
const mine = {
  flags: {},
  input: { weaponGroup: 3 },
  targets: { current: null },
  ship: { object: { position: pos(0) } },
  ships: [],
  asteroids: { list: [rock] },
};
check('select rock index', agentSelectTarget(mine, 0) === '' && mine.targets.current === rock);
const mineCannon = {
  flags: {},
  input: { weaponGroup: 1 },
  targets: { current: 'keep' },
  ship: { object: { position: pos(0) } },
  ships: [],
  asteroids: { list: [rock] },
};
check('rock refused off group 3', agentSelectTarget(mineCannon, 0) === 'no-service' && mineCannon.targets.current === 'keep');

// --- act gates ---
function tokenOf(result) {
  return result && result.token;
}

{
  const ctx = liveCtx({ agent: { optIn: false } });
  const act = actOf(ctx);
  check('teleport forbidden before opt-in', tokenOf(act({ name: 'teleport' })) === 'forbidden');
  check('dock without opt-in', tokenOf(act({ name: 'dock' })) === 'opt-in');
}

{
  const ctx = liveCtx({ flags: { paused: true, berthHold: true } });
  const act = actOf(ctx);
  check('ping while paused+held', act({ name: 'ping' }).ok === true);
  const dis = act({ name: 'disable' });
  check('disable while paused', dis.ok === true && ctx.agent.optIn === false);
}

{
  const ctx = liveCtx({ flags: { paused: true } });
  const act = actOf(ctx);
  check('dock paused', tokenOf(act({ name: 'dock' })) === 'paused');
  check('hail paused', tokenOf(act({ name: 'hail' })) === 'paused');
  check('selectTarget paused', tokenOf(act({ name: 'selectTarget' })) === 'paused');
  check('pulse paused', tokenOf(act({ name: 'pulse', args: { edge: 'dock' } })) === 'paused');
  check('setWeaponGroup paused', tokenOf(act({ name: 'setWeaponGroup', args: { n: 2 } })) === 'paused');
}

{
  const ctx = liveCtx({ flags: { berthHold: true } });
  const act = actOf(ctx);
  check('dock held', tokenOf(act({ name: 'dock' })) === 'held');
  check('hail held', tokenOf(act({ name: 'hail' })) === 'held');
  check('selectTarget held', tokenOf(act({ name: 'selectTarget' })) === 'held');
  check('pulse held', tokenOf(act({ name: 'pulse', args: { edge: 'target' } })) === 'held');
  check('setWeaponGroup held', tokenOf(act({ name: 'setWeaponGroup', args: { n: 2 } })) === 'held');
  check('ping while held', act({ name: 'ping' }).ok === true);
}

{
  const ctx = liveCtx();
  const act = actOf(ctx);
  const credits = ctx.world.credits;
  const posRef = ctx.ship.object.position;
  check('act dock ok', act({ name: 'dock' }).ok === true);
  check('act hail ok', act({ name: 'hail' }).ok === true);
  check('act pulse target ok', act({ name: 'pulse', args: { edge: 'target' } }).ok === true);
  check('act pulse camera unknown', tokenOf(act({ name: 'pulse', args: { edge: 'camera' } })) === 'unknown');
  check('act pulse missing edge', tokenOf(act({ name: 'pulse', args: {} })) === 'unknown');
  check('act setWeaponGroup 2', act({ name: 'setWeaponGroup', args: { n: 2 } }).ok === true && ctx.input.weaponGroup === 2);
  check('act wg bad-qty', tokenOf(act({ name: 'setWeaponGroup', args: { n: 0 } })) === 'bad-qty');
  check('act select none', tokenOf(act({ name: 'selectTarget' })) === 'no-service');
  check('credits unchanged', ctx.world.credits === credits);
  check('position object unchanged', ctx.ship.object.position === posRef);
  check('berthHold still false', ctx.flags.berthHold === false);
  check('fireHeld still false', ctx.input.fireHeld === false);
}

{
  const npc2 = { id: 'alpha', object: { position: pos(1) }, state: {} };
  const ctx = liveCtx({ ships: [npc2] });
  const act = actOf(ctx);
  const r = act({ name: 'selectTarget', args: { id: 'alpha' } });
  check('act selectTarget id', r.ok === true && ctx.targets.current === npc2);
}

{
  const ctx = liveCtx({ flags: { chartOpen: true } });
  const act = actOf(ctx);
  check('act hail overlay no-service', tokenOf(act({ name: 'hail' })) === 'no-service');
}

{
  const ctx = liveCtx();
  const act = actOf(ctx);
  const protoArgs = Object.create({ edge: 'dock' });
  check('pulse inherited edge unknown', tokenOf(act({ name: 'pulse', args: protoArgs })) === 'unknown');
}

// --- one-frame publish ---
{
  const { win } = installHost();
  const ctx = liveCtx();
  win.__ctx = ctx;
  const sys = initControls(ctx);
  sys.update(0.016);
  const r = agentPulse(ctx, 'dock');
  check('pulse dock pending token', r === '');
  sys.update(0.016);
  check('frame1 dockPressed', ctx.input.dockPressed === true);
  check('frame1 hail clear', ctx.input.hailPressed === false);
  sys.update(0.016);
  check('frame2 dock cleared', ctx.input.dockPressed === false);
}

{
  const { win } = installHost();
  const ctx = liveCtx();
  win.__ctx = ctx;
  const sys = initControls(ctx);
  sys.update(0.016);
  agentPulse(ctx, 'hail');
  agentPulse(ctx, 'target');
  agentPulse(ctx, 'reticleLock');
  sys.update(0.016);
  check('frame1 hailPressed', ctx.input.hailPressed === true);
  check('frame1 targetPressed', ctx.input.targetPressed === true);
  check('frame1 reticleLockPressed', ctx.input.reticleLockPressed === true);
  sys.update(0.016);
  check('frame2 hail cleared', ctx.input.hailPressed === false);
  check('frame2 target cleared', ctx.input.targetPressed === false);
  check('frame2 reticle cleared', ctx.input.reticleLockPressed === false);
}

{
  const { win } = installHost();
  const ctx = liveCtx();
  win.__ctx = ctx;
  initAgentApi(ctx);
  const sys = initControls(ctx);
  sys.update(0.016);
  const r = win.rimward.act({ name: 'dock' });
  check('act dock before update not dockPressed yet', r.ok === true && ctx.input.dockPressed === false);
  sys.update(0.016);
  check('act dock next update dockPressed', ctx.input.dockPressed === true);
  sys.update(0.016);
  check('act dock second update cleared', ctx.input.dockPressed === false);
}

// --- KeyJ/H/T/V still set pending ---
{
  const { win } = installHost();
  const ctx = liveCtx();
  const sys = initControls(ctx);
  sys.update(0.016);
  win.dispatch('keydown', { code: 'KeyJ', repeat: false, preventDefault() {} });
  sys.update(0.016);
  check('KeyJ dockPressed', ctx.input.dockPressed === true);
  sys.update(0.016);
  win.dispatch('keydown', { code: 'KeyH', repeat: false, preventDefault() {} });
  sys.update(0.016);
  check('KeyH hailPressed', ctx.input.hailPressed === true);
  sys.update(0.016);
  win.dispatch('keydown', { code: 'KeyT', repeat: false, preventDefault() {} });
  sys.update(0.016);
  check('KeyT targetPressed', ctx.input.targetPressed === true);
  sys.update(0.016);
  win.dispatch('keydown', { code: 'KeyV', repeat: false, preventDefault() {} });
  sys.update(0.016);
  check('KeyV reticleLockPressed', ctx.input.reticleLockPressed === true);
}

{
  const { win } = installHost();
  const ctx = liveCtx({ flags: { docked: true } });
  initControls(ctx);
  const before = ctx.input.weaponGroup;
  win.dispatch('keydown', { code: 'Digit2', repeat: false, preventDefault() {} });
  check('Digit2 skipped when docked', ctx.input.weaponGroup === before);
  ctx.flags.docked = false;
  win.dispatch('keydown', { code: 'Digit2', repeat: false, preventDefault() {} });
  check('Digit2 writes when flight', ctx.input.weaponGroup === 2);
}

const report = [
  `pass ${PASS.length}`,
  `fail ${FAIL.length}`,
  ...FAIL.map((f) => `FAIL ${f}`),
  ...PASS.map((p) => `ok ${p}`),
].join('\n');
writeFileSync(join(here, 'pulse-verify-probe.log'), report, 'utf8');
console.log(report);
if (FAIL.length) process.exitCode = 1;
else console.log('pulse-verify-probe pass');
