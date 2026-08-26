/**
 * Scoped hypot-latch probe. Does not start Vite/Chrome. Does not edit src/.
 */
import { initAutopilot } from '../../../src/game/autopilot.js';
import { initAutomine, tryEngageAutomine } from '../../../src/game/automine.js';

const FAIL = [];
const PASS = [];

function check(name, cond, extra) {
  if (cond) PASS.push(name);
  else FAIL.push(extra ? `${name} — ${extra}` : name);
}

function baseInput() {
  return {
    steerX: 0,
    steerY: 0,
    strafeX: 0,
    strafeY: 0,
    roll: 0,
    throttleHeld: false,
    afterburnerPressed: false,
    driftHeld: false,
    fullStop: false,
  };
}

function makeApCtx(over = {}) {
  const events = [];
  const ctx = {
    emit(type, payload) { events.push({ type, payload }); },
    lastEvents: [],
    events,
    input: baseInput(),
    flags: {
      chartOpen: false,
      docked: false,
      paused: true,
      berthHold: false,
      matchSpeed: false,
    },
    agent: { optIn: false },
    world: {
      currentSystem: 'here',
      nav: { dest: 'there', path: ['here', 'there'], autopilot: true },
    },
    autopilot: {
      engaged: true, yaw: 0, pitch: 0, throttle: 0,
      wantJump: false, cycleHub: false, reason: '',
    },
    ship: { object: null, speed: 0 },
    gate: { jumping: false, inZone: false, nearTo: null, nearHub: false },
    player: { classKey: 'light' },
    systems: {},
  };
  Object.assign(ctx, over);
  return ctx;
}

function armAm(ctx, am) {
  ctx.automine.engaged = true;
  ctx.automine.reason = '';
  return am;
}

function makeAmCtx(over = {}) {
  const events = [];
  const ctx = {
    emit(type, payload) { events.push({ type, payload }); },
    lastEvents: [],
    events,
    input: baseInput(),
    flags: {
      chartOpen: false,
      docked: false,
      paused: true,
      berthHold: false,
      matchSpeed: false,
    },
    agent: { optIn: false },
    world: { nav: { dest: '', path: [], autopilot: false } },
    automine: {
      engaged: true, yaw: 0, pitch: 0, throttle: 0, wantMine: false, reason: '',
    },
    ship: { object: { position: { x: 0, y: 0, z: 0 } } },
    gate: { jumping: false },
    targets: { current: null },
    asteroids: { list: [] },
    cargo: [],
    cargoCapacity: 10,
  };
  Object.assign(ctx, over);
  return ctx;
}

function identities(ctx) {
  return {
    input: ctx.input,
    agent: ctx.agent,
    flags: ctx.flags,
    berthHold: ctx.flags && ctx.flags.berthHold,
  };
}

function assertNoWrites(label, ctx, before) {
  check(`${label} input identity`, ctx.input === before.input);
  check(`${label} agent identity`, ctx.agent === before.agent);
  check(`${label} flags identity`, ctx.flags === before.flags);
  check(`${label} berthHold unchanged`, ctx.flags.berthHold === before.berthHold);
}

// --- Autopilot ---
{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  const before = identities(ctx);

  ctx.agent.optIn = true;
  ctx.input.steerX = 1;
  ctx.input.steerY = 0;
  ap.update(0.016, ctx);
  check('AP optIn hypot keeps engaged', ctx.autopilot.engaged === true && ctx.autopilot.reason !== 'input',
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);

  ctx.input.steerX = 0;
  ctx.input.strafeX = 1;
  ap.update(0.016, ctx);
  check('AP optIn strafe returns input', ctx.autopilot.engaged === false && ctx.autopilot.reason === 'input',
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);
  assertNoWrites('AP after optIn+strafe', ctx, before);
}

{
  const keys = [
    ['strafeY', 1],
    ['roll', 1],
    ['throttleHeld', true],
    ['afterburnerPressed', true],
    ['driftHeld', true],
    ['fullStop', true],
  ];
  for (const [key, val] of keys) {
    const ctx = makeApCtx();
    const ap = initAutopilot(ctx);
    ctx.world.nav.autopilot = true;
    ctx.autopilot.engaged = true;
    ctx.autopilot.reason = '';
    ctx.agent.optIn = true;
    ctx.input.steerX = 0.9;
    ctx.input[key] = val;
    ap.update(0.016, ctx);
    check(`AP optIn ${key} returns input`, ctx.autopilot.reason === 'input' && ctx.autopilot.engaged === false,
      `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);
  }
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  ctx.agent.optIn = true;
  ctx.input.steerX = 1;
  ap.update(0.016, ctx);
  check('AP latch tick keeps flying', ctx.autopilot.engaged === true);

  ctx.agent.optIn = false;
  ctx.input.steerX = 1;
  ap.update(0.016, ctx);
  check('AP after latch hypot still unarmed', ctx.autopilot.engaged === true && ctx.autopilot.reason !== 'input',
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);

  ctx.input.steerX = 0;
  ap.update(0.016, ctx);
  check('AP re-arm on small hypot', ctx.autopilot.engaged === true);

  ctx.input.steerX = 1;
  ap.update(0.016, ctx);
  check('AP armed hypot after re-arm is input', ctx.autopilot.reason === 'input' && ctx.autopilot.engaged === false,
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  ctx.agent.optIn = 'true';
  ctx.input.steerX = 1;
  ap.update(0.016, ctx);
  check('AP string optIn does not latch', ctx.autopilot.reason === 'input' && ctx.autopilot.engaged === false,
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  ctx.agent.optIn = 1;
  ctx.input.steerX = 1;
  ap.update(0.016, ctx);
  check('AP numeric 1 optIn does not latch', ctx.autopilot.reason === 'input' && ctx.autopilot.engaged === false,
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  ctx.flags.chartOpen = true;
  ctx.agent.optIn = false;
  ctx.input.steerX = 1;
  ap.update(0.016, ctx);
  check('AP chartOpen hypot skipped', ctx.autopilot.engaged === true && ctx.autopilot.reason !== 'input',
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason}`);
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  ctx.flags.berthHold = true;
  ctx.flags.paused = false;
  ctx.agent.optIn = false;
  ctx.input.steerX = 1;
  ctx.input.strafeX = 1;
  ap.update(0.016, ctx);
  check('AP berthHold mutes hypot and strafe', ctx.autopilot.engaged === true && ctx.world.nav.autopilot === true,
    `engaged=${ctx.autopilot.engaged} reason=${ctx.autopilot.reason} flying=${ctx.world.nav.autopilot}`);
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  ctx.agent.optIn = true;
  ctx.flags.berthHold = false;
  ctx.input.strafeX = 1;
  ap.update(0.016, ctx);
  check('AP optIn does not mute strafe', ctx.autopilot.reason === 'input',
    `reason=${ctx.autopilot.reason}`);
}

{
  const ctx = makeApCtx();
  const ap = initAutopilot(ctx);
  const before = identities(ctx);
  ctx.agent.optIn = true;
  ctx.input.steerX = 0.7;
  ap.update(0.016, ctx);
  assertNoWrites('AP hypot-only tick', ctx, before);
}

// --- Automine ---
{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  armAm(ctx, am);
  const before = identities(ctx);
  ctx.agent.optIn = true;
  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM optIn hypot keeps engaged', ctx.automine.engaged === true && ctx.automine.reason !== 'input',
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);

  ctx.input.steerX = 0;
  ctx.input.strafeX = 1;
  am.update(0.016, ctx);
  check('AM optIn strafe returns input', ctx.automine.engaged === false && ctx.automine.reason === 'input',
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
  assertNoWrites('AM after optIn+strafe', ctx, before);
}

{
  const keys = [
    ['strafeY', 1],
    ['roll', 1],
    ['throttleHeld', true],
    ['afterburnerPressed', true],
    ['driftHeld', true],
    ['fullStop', true],
  ];
  for (const [key, val] of keys) {
    const ctx = makeAmCtx();
    const am = initAutomine(ctx);
    ctx.automine.engaged = true;
    ctx.automine.reason = '';
    ctx.agent.optIn = true;
    ctx.input.steerX = 0.9;
    ctx.input[key] = val;
    am.update(0.016, ctx);
    check(`AM optIn ${key} returns input`, ctx.automine.reason === 'input' && ctx.automine.engaged === false,
      `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
  }
}

{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  armAm(ctx, am);
  ctx.agent.optIn = true;
  ctx.input.steerX = 1;
  am.update(0.016, ctx);

  ctx.agent.optIn = false;
  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM after latch hypot still unarmed', ctx.automine.engaged === true && ctx.automine.reason !== 'input',
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);

  ctx.input.steerX = 0;
  am.update(0.016, ctx);
  check('AM re-arm on small hypot', ctx.automine.engaged === true);

  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM armed hypot after re-arm is input', ctx.automine.reason === 'input' && ctx.automine.engaged === false,
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
}

{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  armAm(ctx, am);
  ctx.agent.optIn = 'true';
  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM string optIn does not latch', ctx.automine.reason === 'input' && ctx.automine.engaged === false,
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
}

{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  armAm(ctx, am);
  ctx.flags.chartOpen = true;
  ctx.agent.optIn = false;
  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM chartOpen hypot skipped', ctx.automine.engaged === true && ctx.automine.reason !== 'input',
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
}

{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  armAm(ctx, am);
  ctx.flags.berthHold = true;
  ctx.agent.optIn = false;
  ctx.flags.chartOpen = false;
  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM berthHold does not latch hypot', ctx.automine.reason === 'input' && ctx.automine.engaged === false,
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
}

{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  armAm(ctx, am);
  const before = identities(ctx);
  ctx.agent.optIn = true;
  ctx.input.steerX = 0.7;
  am.update(0.016, ctx);
  assertNoWrites('AM hypot-only tick', ctx, before);
}

{
  const ctx = makeAmCtx();
  const am = initAutomine(ctx);
  const rock = {
    id: 1, ore: 10, hardness: 1, radius: 8, lockKind: 'rock',
    position: { x: 40, y: 0, z: 0 },
  };
  ctx.asteroids.list = [rock];
  ctx.targets.current = rock;
  ctx.flags.paused = false;
  ctx.flags.docked = false;
  ctx.agent.optIn = true;
  ctx.ship = { object: { position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } } };
  const token = tryEngageAutomine(ctx);
  check('AM tryEngage while optIn', token === '', `token=${token}`);
  ctx.flags.paused = true;
  ctx.input.steerX = 1;
  am.update(0.016, ctx);
  check('AM engage helper unarms hypot', ctx.automine.engaged === true && ctx.automine.reason !== 'input',
    `engaged=${ctx.automine.engaged} reason=${ctx.automine.reason}`);
}

console.log(JSON.stringify({ pass: PASS.length, fail: FAIL.length, FAIL, PASS }, null, 2));
if (FAIL.length) process.exitCode = 1;
