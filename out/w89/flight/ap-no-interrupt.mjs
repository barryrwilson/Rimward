import { initAutopilot, tryEngage, apRefuseToken } from '../../../src/game/autopilot.js';

function nav() {
  return { dest: 'fh_hearth', path: ['freehold', 'fh_hearth'], remaining: 1, status: 'plotted', autopilot: false };
}

function makeCtx() {
  const events = [];
  const ctx = {
    world: { time: 0, currentSystem: 'freehold', nav: nav() },
    flags: { docked: false, paused: false, combat: false, matchSpeed: false, chartOpen: false },
    gate: { jumping: false, inZone: false, nearTo: null, nearHub: false },
    player: { hull: 10, hullMax: 100 },
    ship: { object: { position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 } }, speed: 40 },
    input: {
      steerX: 0, steerY: 0, strafeX: 0, strafeY: 0, roll: 0,
      throttleHeld: false, afterburnerPressed: false, driftHeld: false, fullStop: false,
    },
    lastEvents: [],
    events,
    emit(type, data = {}) { events.push({ type, ...data }); },
  };
  return ctx;
}

const fails = [];
function check(name, ok, detail) {
  if (!ok) fails.push({ name, detail });
  console.log(ok ? `ok ${name}` : `FAIL ${name}`, detail || '');
}

{
  const ctx = makeCtx();
  ctx.flags.combat = true;
  ctx.player.hull = 10;
  initAutopilot(ctx);
  check('combat+hull do not refuse', apRefuseToken(ctx) === '');
}

{
  const ctx = makeCtx();
  const sys = initAutopilot(ctx);
  const token = tryEngage(ctx);
  check('engage', token === '' && ctx.world.nav.autopilot === true);
  ctx.events.length = 0;
  ctx.flags.combat = true;
  ctx.lastEvents = [
    { type: 'hailOpened' },
    { type: 'sunHeat' },
    { type: 'bodyHit', kind: 'asteroid', speed: 20 },
  ];
  ctx.player.hull = 5;
  sys.update(0.016, ctx);
  const ev = ctx.events.find((e) => e.type === 'autopilotDisengaged');
  check('world events do not cancel', ctx.world.nav.autopilot === true && ctx.autopilot.engaged === true && !ev, {
    flying: ctx.world.nav.autopilot,
    engaged: ctx.autopilot.engaged,
    ev,
  });
}

{
  const ctx = makeCtx();
  const sys = initAutopilot(ctx);
  tryEngage(ctx);
  ctx.events.length = 0;
  ctx.input.roll = 1;
  sys.update(0.016, ctx);
  check('manual helm still cancels', ctx.world.nav.autopilot === false && ctx.autopilot.reason === 'input');
}

if (fails.length) {
  console.error(`${fails.length} failed`);
  process.exit(1);
}
console.log('ap-no-interrupt passed');
