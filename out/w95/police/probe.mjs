// Wave 95 police leave — standalone pins (do not edit scripts/boot-test.mjs).
// node out/w95/police/probe.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const npcSrc = src('src/systems/npc.js');
const leaveSrc = src('src/game/police-leave.js');
const hudSrc = src('src/systems/hud.js');
const hudCss = src('src/ui/hud.css');
const saveSrc = src('src/game/save.js');
const restSrc = src('src/game/restitution.js');
const ctxSrc = src('src/core/ctx.js');
const stateSrc = src('src/game/state.js');
const mainSrc = src('src/main.js');

const {
  POLICE_LEAVE_LINE,
  POLICE_LEAVE_RADIUS,
  tickPoliceLeave,
  resetPoliceLeaveVisit,
} = await import('../../../src/game/police-leave.js');
const { RESTITUTION_UU } = await import('../../../src/game/restitution.js');
const { mayHuntPlayer } = await import('../../../src/systems/npc.js');
const { WORLD_FIELDS } = await import('../../../src/game/save.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

function vec(x, y, z) {
  return {
    x, y, z,
    distanceTo(o) {
      return Math.hypot(x - o.x, y - o.y, z - o.z);
    },
  };
}

function hull(role, faction, extra = {}) {
  return {
    role,
    record: { role, faction, ...(extra.record || {}) },
    state: {
      hull: 100,
      hullMax: 100,
      screen: 50,
      screenMax: 50,
      destroyed: false,
      disabled: false,
      surrendered: false,
      faction,
      ...(extra.state || {}),
    },
    ai: {
      role,
      mode: extra.mode ?? (role === 'patrol' ? 'loiter' : 'hunt'),
      target: extra.target ?? null,
      intent: extra.intent ?? false,
      lastAttacker: extra.lastAttacker ?? null,
    },
    object: { position: extra.pos ?? vec(120, 20, 620) },
  };
}

function makeCtx(extra = {}) {
  const events = [];
  const station = extra.station ?? vec(120, 20, 620);
  return {
    events,
    lastEvents: extra.lastEvents ?? [],
    emit(type, data = {}) { events.push({ type, ...data }); },
    world: {
      currentSystem: extra.system ?? 'freehold',
      reputation: extra.reputation ?? { freehold: -5 },
      time: 0,
    },
    ship: { object: { position: extra.playerPos ?? vec(120, 20, 620) } },
    config: { world: { stationPosition: station } },
    ships: extra.ships ?? [hull('patrol', extra.patrolFaction ?? 'freehold')],
    flags: extra.flags ?? { docked: false },
    gate: extra.gate ?? { jumping: false },
  };
}

function fireCount(ctx) {
  return ctx.events.filter((e) => e.type === 'commLine' && e.text === POLICE_LEAVE_LINE).length;
}

function runLeave(extra) {
  resetPoliceLeaveVisit();
  const ctx = makeCtx(extra);
  const did = tickPoliceLeave(ctx);
  return { ctx, did, n: fireCount(ctx) };
}

pin('copy.literal', POLICE_LEAVE_LINE === 'Leave this space.');
pin('radius.matchNpc', POLICE_LEAVE_RADIUS === 300 && /const LAW_ZONE_RADIUS = 300/.test(npcSrc));
pin('npc.callsTick', npcSrc.includes("import { tickPoliceLeave } from '../game/police-leave.js'")
  && npcSrc.includes('tickPoliceLeave(ctx)'));
pin('npc.noMainEditNeeded', /tickPoliceLeave/.test(npcSrc));
pin('src.usesStandingRead', leaveSrc.includes("standingRead(ctx.world?.reputation, systemFaction)"));
pin('src.noHullStanding', !/standingOf\(/.test(leaveSrc) && !/table\[fac\]/.test(leaveSrc));
pin('src.band', leaveSrc.includes('standing < 0 && standing > -10'));
pin('src.noWanted', !/\bwanted\b/.test(leaveSrc) && !/\bcrimeScore\b/.test(leaveSrc));
pin('src.noWorldFields', !/WORLD_FIELDS/.test(leaveSrc));
pin('src.noInnerHTML', !/innerHTML/.test(leaveSrc) && !/innerHTML/.test(npcSrc));
pin('src.noHail', !/hailOpened/.test(leaveSrc) && !/hailClosed/.test(leaveSrc));
pin('src.noSong', !/song/.test(leaveSrc));
pin('src.noNewEvent', !/ctx\.emit\('(?!commLine)/.test(leaveSrc)
  && leaveSrc.includes("ctx.emit('commLine', { text: POLICE_LEAVE_LINE })"));
pin('src.resetOnLoaded', leaveSrc.includes("evs[i].type === 'systemLoaded'"));
pin('hunt.untouched', npcSrc.includes('HOSTILE_STANDING = -10')
  && npcSrc.includes('standingOf(ctx, live) <= HOSTILE_STANDING'));
pin('rest.untouched', RESTITUTION_UU === 1200 && restSrc.includes('export const RESTITUTION_UU = 1200'));
pin('save.noNewKey', !WORLD_FIELDS.includes('wanted')
  && !WORLD_FIELDS.includes('crimeScore')
  && !WORLD_FIELDS.includes('policeLeave')
  && !WORLD_FIELDS.includes('policeLeaveSent'));
pin('ctx.unedited', !/policeLeave/.test(ctxSrc) && !/Leave this space/.test(ctxSrc));
pin('main.unedited', !/police-leave/.test(mainSrc) && !/tickPoliceLeave/.test(mainSrc));
pin('state.uneditedLeave', !/policeLeave/.test(stateSrc) && !/Leave this space/.test(stateSrc));
pin('hud.commToast', hudSrc.includes("case 'commLine':")
  && hudSrc.includes("return { text: e.text ?? e.line ?? '', cls: 'comm' }")
  && hudSrc.includes('slot.el.textContent = text'));
pin('hud.noInnerHTML', !/innerHTML/.test(hudSrc));
pin('css.reducedKeepsToast', /body\.rw-reduced-motion #hud \*/.test(hudCss)
  && /animation: none !important/.test(hudCss)
  && /\.rw-toast\.show \{ opacity: 1/.test(hudCss));

{
  const a = runLeave({ reputation: { freehold: -1 } });
  pin('live.standingNeg1', a.did === true && a.n === 1);
  tickPoliceLeave(a.ctx);
  pin('live.oncePerVisit', fireCount(a.ctx) === 1);
}

{
  const a = runLeave({ reputation: { freehold: -9 } });
  pin('live.standingNeg9', a.did === true && a.n === 1);
}

for (const [label, standing] of [['zero', 0], ['neg10', -10], ['neg11', -11], ['pos', 4]]) {
  const a = runLeave({ reputation: { freehold: standing } });
  pin(`live.noLeave.${label}`, a.did === false && a.n === 0, String(standing));
}

{
  const patrol = hull('patrol', 'freehold');
  pin('hunt.neg10', mayHuntPlayer({ world: { reputation: { freehold: -10 } } }, patrol) === true);
  pin('hunt.neg11', mayHuntPlayer({ world: { reputation: { freehold: -11 } } }, patrol) === true);
  pin('hunt.neg9', mayHuntPlayer({ world: { reputation: { freehold: -9 } } }, patrol) === false);
  pin('hunt.neg1', mayHuntPlayer({ world: { reputation: { freehold: -1 } } }, patrol) === false);
}

{
  const a = runLeave({
    reputation: { freehold: Number.NaN },
  });
  pin('live.nanFailClosed', a.did === false && a.n === 0);
}

{
  const bag = {};
  Object.defineProperty(bag, '__proto__', { value: -5, enumerable: false });
  const a = runLeave({ reputation: bag, system: 'freehold' });
  pin('live.protoFailClosed', a.did === false && a.n === 0);
}

{
  const proto = Object.prototype;
  const had = Object.hasOwn(proto, 'role');
  const prev = proto.role;
  proto.role = 'patrol';
  try {
    const a = runLeave({
      ships: [{
        record: { faction: 'freehold' },
        state: { destroyed: false, disabled: false, surrendered: false, faction: 'freehold' },
        ai: {},
        object: { position: vec(120, 20, 620) },
      }],
      reputation: { freehold: -5 },
    });
    pin('live.protoRoleIgnored', a.did === false && a.n === 0);
  } finally {
    if (had) proto.role = prev;
    else delete proto.role;
  }
}

{
  const a = runLeave({
    playerPos: vec(120, 20, 620 + 301),
    reputation: { freehold: -5 },
  });
  pin('live.outOfZone', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    playerPos: vec(120, 20, 620 + 299),
    reputation: { freehold: -5 },
  });
  pin('live.inZone', a.did === true && a.n === 1);
}

{
  const a = runLeave({ ships: [], reputation: { freehold: -5 } });
  pin('live.noPatrol', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('pirate', 'freehold')],
    reputation: { freehold: -5 },
  });
  pin('live.pirateNever', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('ace', 'freehold')],
    reputation: { freehold: -5 },
  });
  pin('live.aceNever', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('trader', 'freehold')],
    reputation: { freehold: -5 },
  });
  pin('live.traderNever', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('miner', 'freehold')],
    reputation: { freehold: -5 },
  });
  pin('live.minerNever', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('patrol', 'redledger')],
    reputation: { freehold: -5, redledger: -5 },
  });
  pin('live.foreignPatrol', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('patrol', 'freehold', { record: { role: 'patrol', faction: 'freehold' }, state: { faction: 'redledger' } })],
    reputation: { freehold: -5, redledger: -5 },
  });
  pin('live.stateFactionMismatch', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    system: 'bt_cradle',
    reputation: { beautiful: -5 },
    ships: [hull('patrol', 'beautiful')],
    patrolFaction: 'beautiful',
  });
  pin('live.beautifulNever', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    system: 'veil',
    reputation: { unknowables: -5 },
    ships: [hull('patrol', 'unknowables')],
  });
  pin('live.unknowableNever', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('patrol', 'freehold', { lastAttacker: 'player' })],
    reputation: { freehold: -5 },
  });
  pin('live.combatAttackerSkip', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [hull('patrol', 'freehold', { target: 'player', intent: true, mode: 'hunt' })],
    reputation: { freehold: -5 },
  });
  pin('live.combatHuntSkip', a.did === false && a.n === 0);
}

{
  const a = runLeave({
    ships: [
      hull('patrol', 'freehold', { lastAttacker: 'player' }),
      hull('patrol', 'freehold', { pos: vec(130, 20, 620) }),
    ],
    reputation: { freehold: -5 },
  });
  pin('live.otherPatrolStillWarns', a.did === true && a.n === 1);
}

{
  const a = runLeave({
    flags: { docked: true },
    reputation: { freehold: -5 },
  });
  pin('live.dockedSkip', a.did === false && a.n === 0);
}

{
  resetPoliceLeaveVisit();
  const ctx = makeCtx({ reputation: { freehold: -5 } });
  tickPoliceLeave(ctx);
  pin('live.firstVisit', fireCount(ctx) === 1);
  ctx.events.length = 0;
  ctx.lastEvents = [{ type: 'systemLoaded', to: 'veridian' }];
  ctx.world.currentSystem = 'veridian';
  ctx.world.reputation = { veridian: -5 };
  ctx.ships = [hull('patrol', 'veridian')];
  tickPoliceLeave(ctx);
  pin('live.jumpRefires', fireCount(ctx) === 1);
}

{
  const payload = runLeave({ reputation: { freehold: -5 } });
  const ev = payload.ctx.events.find((e) => e.type === 'commLine');
  pin('live.payloadTextOnly', !!ev && ev.text === 'Leave this space.' && ev.from === undefined);
}

if (fails.length) {
  console.log('WAVE95 POLICE FAIL');
  for (const f of fails) console.log('  FAIL', f);
  process.exitCode = 1;
} else {
  console.log('WAVE95 POLICE PASS', {
    line: POLICE_LEAVE_LINE,
    radius: POLICE_LEAVE_RADIUS,
    rest: RESTITUTION_UU,
  });
}
