// Wave 104 REP-05 — covering gate + beginJump refuse (no Vite).
// node out/w104/rep05/probe.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const coverSrc = src('src/game/police-cover.js');
const jumpSrc = src('src/game/jump.js');
const npcSrc = src('src/systems/npc.js');
const leaveSrc = src('src/game/police-leave.js');
const saveSrc = src('src/game/save.js');
const stationSrc = src('src/systems/station.js');
const hudSrc = src('src/systems/hud.js');

const {
  COVERING_LINE,
  COVERING_STANDING_MIN,
  COVERING_RADIUS,
  findCoveringWork,
  tickPoliceCover,
  resetPoliceCoverVisit,
} = await import('../../../src/game/police-cover.js');
const {
  destJumpRefused,
  JUMP_REFUSE_LINE,
  JUMP_REFUSE_STANDING,
  JUMP_REFUSE_SKIP,
  resetJumpRefuseVisit,
  initJump,
} = await import('../../../src/game/jump.js');
const { POLICE_LEAVE_LINE } = await import('../../../src/game/police-leave.js');
const { standingRead } = await import('../../../src/game/data-trade.js');
const { WORLD_FIELDS } = await import('../../../src/game/save.js');
const { SYSTEMS } = await import('../../../src/game/state.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

function vec(x, y, z) {
  return {
    x, y, z,
    distanceTo(o) { return Math.hypot(x - o.x, y - o.y, z - o.z); },
  };
}

function hull(role, faction, extra = {}) {
  return {
    role,
    record: { role, faction, ...(extra.record || {}) },
    state: {
      hull: 100, hullMax: 100, screen: 50, screenMax: 50,
      destroyed: false, disabled: false, surrendered: false, faction,
      ...(extra.state || {}),
    },
    ai: {
      role,
      mode: extra.mode ?? (role === 'patrol' ? 'loiter' : 'hunt'),
      target: extra.target ?? null,
      intent: extra.intent ?? false,
      lastAttacker: extra.lastAttacker ?? null,
    },
    object: { position: extra.pos ?? vec(0, 0, 500) },
  };
}

function makeCoverCtx(extra = {}) {
  const events = [];
  return {
    events,
    lastEvents: extra.lastEvents ?? [],
    emit(type, data = {}) { events.push({ type, ...data }); },
    world: {
      currentSystem: extra.system ?? 'freehold',
      reputation: extra.reputation ?? { freehold: 10 },
      time: 0,
    },
    ship: extra.ship ?? { object: { position: extra.playerPos ?? vec(0, 0, 500) } },
    config: { world: { stationPosition: extra.station ?? vec(0, 0, 0) } },
    ships: extra.ships ?? [],
    flags: extra.flags ?? { docked: false },
    gate: extra.gate ?? { jumping: false },
    targets: extra.targets ?? { current: null },
  };
}

function coverCount(ctx) {
  return ctx.events.filter((e) => e.type === 'commLine' && e.text === COVERING_LINE).length;
}
function jumpCount(ctx) {
  return ctx.events.filter((e) => e.type === 'commLine' && e.text === JUMP_REFUSE_LINE).length;
}

pin('copy.cover', COVERING_LINE === 'Patrol covering.');
pin('copy.jump', JUMP_REFUSE_LINE === 'No passage.');
pin('copy.leaveUntouched', POLICE_LEAVE_LINE === 'Leave this space.');
pin('gate.known', COVERING_STANDING_MIN === 10);
pin('gate.marked', JUMP_REFUSE_STANDING === -25);
pin('radius.300', COVERING_RADIUS === 300);
pin('src.standingRead', coverSrc.includes('standingRead(ctx.world?.reputation, systemFaction)')
  && jumpSrc.includes('standingRead(reputation, fac)'));
pin('src.noStandingOf', !coverSrc.includes('standingOf') && !jumpSrc.includes('standingOf'));
pin('src.hasOwn', coverSrc.includes('Object.hasOwn(SYSTEMS, id)')
  && coverSrc.includes('Object.hasOwn(FACTIONS, fac)')
  && jumpSrc.includes('Object.hasOwn(SYSTEMS, to)')
  && jumpSrc.includes('Object.hasOwn(FACTIONS, fac)'));
pin('src.noInnerHTML', !coverSrc.includes('innerHTML') && !jumpSrc.includes('innerHTML'));
pin('src.noWanted', !/\bwanted\b/.test(coverSrc) && !/\bcrimeScore\b/.test(coverSrc)
  && !/\bwanted\b/.test(jumpSrc) && !/\bcrimeScore\b/.test(jumpSrc)
  && !WORLD_FIELDS.includes('wanted') && !WORLD_FIELDS.includes('crimeScore'));
pin('src.npcHook', npcSrc.includes("import { tickPoliceCover, findCoveringWork }")
  && npcSrc.includes('tickPoliceCover(ctx)')
  && npcSrc.includes('findPirateWork(ctx, live) || findCoveringWork(ctx, live)'));
pin('src.pirateWorkUngated', npcSrc.includes('export function findPirateWork')
  && !/function findPirateWork[\s\S]{0,500}standingRead/.test(npcSrc));
pin('src.leaveLatchSeparate', coverSrc.includes('let firedThisVisit')
  && leaveSrc.includes('let firedThisVisit')
  && coverSrc.includes("text: COVERING_LINE")
  && !coverSrc.includes('Leave this space.')
  && !jumpSrc.includes('Leave this space.')
  && !jumpSrc.includes('No sale.'));
pin('src.digit0', stationSrc.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0")
  && stationSrc.includes("'shipyard'"));
pin('src.hudToast', hudSrc.includes("case 'commLine':")
  && hudSrc.includes('slot.el.textContent = text'));
pin('skip.jump', JUMP_REFUSE_SKIP.has('independent') && JUMP_REFUSE_SKIP.has('hollow')
  && JUMP_REFUSE_SKIP.has('unknowables') && !JUMP_REFUSE_SKIP.has('beautiful'));

{
  const patrol = hull('patrol', 'freehold');
  const pirate = hull('pirate', 'independent', { lastAttacker: 'player', pos: vec(40, 0, 500) });
  const ctx = makeCoverCtx({ ships: [patrol, pirate], reputation: { freehold: 10 } });
  pin('cover.knownHuntPirate', findCoveringWork(ctx, patrol) === pirate);
  resetPoliceCoverVisit();
  pin('cover.emitOnce', tickPoliceCover(ctx) === true && coverCount(ctx) === 1);
  pin('cover.emitNoSpam', tickPoliceCover(ctx) === false && coverCount(ctx) === 1);
}

{
  const patrol = hull('patrol', 'freehold');
  const pirate = hull('pirate', 'independent', { lastAttacker: 'player' });
  for (const [label, standing] of [['zero', 0], ['nine', 9], ['neg', -1]]) {
    const ctx = makeCoverCtx({ ships: [patrol, pirate], reputation: { freehold: standing } });
    resetPoliceCoverVisit();
    pin(`cover.noGate.${label}`, findCoveringWork(ctx, patrol) === null && tickPoliceCover(ctx) === false);
  }
}

{
  const patrol = hull('patrol', 'freehold', { lastAttacker: 'player', target: 'player', intent: true });
  const pirate = hull('pirate', 'independent', { lastAttacker: 'player' });
  const ctx = makeCoverCtx({ ships: [patrol, pirate], reputation: { freehold: 10 } });
  pin('cover.skipVsPlayerPatrol', findCoveringWork(ctx, patrol) === null);
}

{
  const patrol = hull('patrol', 'freehold');
  const trader = hull('trader', 'freehold', { lastAttacker: 'player' });
  const ctx = makeCoverCtx({
    ships: [patrol, trader],
    reputation: { freehold: 10 },
    targets: { current: trader },
  });
  pin('cover.skipTrader', findCoveringWork(ctx, patrol) === null);
}

{
  const patrol = hull('patrol', 'freehold');
  const ace = hull('ace', 'redledger');
  const ctx = makeCoverCtx({
    ships: [patrol, ace],
    reputation: { freehold: 10 },
    targets: { current: ace },
  });
  pin('cover.lockAce', findCoveringWork(ctx, patrol) === ace);
}

{
  const patrol = hull('patrol', 'freehold', { pos: vec(0, 0, 10) });
  const pirate = hull('pirate', 'independent', { lastAttacker: 'player', pos: vec(0, 0, 500) });
  const ctx = makeCoverCtx({ ships: [patrol, pirate], reputation: { freehold: 10 } });
  pin('cover.skipLawZone', findCoveringWork(ctx, patrol) === null);
}

{
  const proto = Object.create({ freehold: 50, veridian: -100 });
  pin('proto.standingRead0', standingRead(proto, 'freehold') === 0 && standingRead(proto, 'veridian') === 0);
  const patrol = hull('patrol', 'freehold');
  const pirate = hull('pirate', 'independent', { lastAttacker: 'player' });
  const ctx = makeCoverCtx({ ships: [patrol, pirate], reputation: proto });
  resetPoliceCoverVisit();
  pin('proto.noCover', findCoveringWork(ctx, patrol) === null && tickPoliceCover(ctx) === false);
  pin('proto.noRefuse', destJumpRefused('veridian', proto) === false);
}

{
  const bag = {
    freehold: -26, veridian: -26, hollow: -1000, independent: -1000, unknowables: -1000,
  };
  pin('jump.refuseMarked', destJumpRefused('veridian', bag) === true);
  pin('jump.allowSuspect', destJumpRefused('freehold', { freehold: -25 }) === false);
  pin('jump.skipHollow', destJumpRefused('hollowreach', bag) === false);
  pin('jump.skipUnknowables', destJumpRefused('veil', bag) === false);
  const indy = Object.keys(SYSTEMS).find((id) => Object.hasOwn(SYSTEMS, id) && SYSTEMS[id].faction === 'independent');
  pin('jump.skipIndependent', !!indy && destJumpRefused(indy, bag) === false, indy || 'none');
  pin('jump.protoDest', destJumpRefused('__proto__', bag) === false
    && destJumpRefused('constructor', bag) === false);
}

{
  resetJumpRefuseVisit();
  const events = [];
  const ctx = {
    events,
    lastEvents: [],
    emit(type, data = {}) { events.push({ type, ...data }); },
    world: { reputation: { veridian: -26 }, currentSystem: 'freehold', time: 0 },
    gate: { jumping: false, progress: 0, destination: null },
    flags: { docked: false },
    ships: [],
    targets: { current: null },
    ship: { object: null, velocity: { set() {} } },
  };
  const ctl = initJump(ctx);
  ctx.emit('jumpRequested', { to: 'veridian' });
  ctl.update(0);
  pin('beginJump.refuse', ctx.gate.jumping === false && jumpCount(ctx) === 1);
  events.length = 0;
  ctx.emit('jumpRequested', { to: 'veridian' });
  ctl.update(0);
  pin('beginJump.oncePerDest', ctx.gate.jumping === false && jumpCount(ctx) === 0);
}

{
  resetJumpRefuseVisit();
  const events = [];
  const ctx = {
    events,
    lastEvents: [],
    emit(type, data = {}) { events.push({ type, ...data }); },
    world: { reputation: { freehold: -1000, veridian: 0 }, currentSystem: 'freehold', time: 0 },
    gate: { jumping: false, progress: 0, destination: null },
    flags: { docked: false },
    ships: [],
    targets: { current: null },
    ship: { object: null, velocity: { set() {} } },
  };
  const ctl = initJump(ctx);
  ctx.emit('jumpRequested', { to: 'veridian' });
  ctl.update(0);
  pin('beginJump.outbound', ctx.gate.jumping === true && jumpCount(ctx) === 0);
  ctx.gate.jumping = false;
  ctx.gate.destination = null;
}

pin('save.worldFields', saveSrc.includes("'reputation'") && !saveSrc.slice(
  saveSrc.indexOf('export const WORLD_FIELDS'),
  saveSrc.indexOf('const SURVIVOR'),
).includes('wanted'));

if (fails.length) {
  console.log('PROBE FAIL', fails.join('; '));
  process.exit(1);
}
console.log('PROBE PASS', fails.length === 0);
process.exit(0);
