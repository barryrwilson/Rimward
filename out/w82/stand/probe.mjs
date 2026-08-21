// Wave 82 — kill standing -5, Abomination +5, graft 4000 debit.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShipState } from '../../../src/game/state.js';
import {
  applyPlayerKillStanding,
  KILL_STANDING_DELTA,
  ABOMINATION_DESTROY_BEAUTIFUL_DELTA,
} from '../../../src/game/kill-standing.js';
import { graftMounted } from '../../../src/game/hangar.js';
import { GRAFT_LIST_UU } from '../../../src/game/shipyard.js';
import {
  GRAFT_REFUSE_LINES,
  graftRefuseLine,
} from '../../../src/systems/shipyard-desk.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const fails = [];

function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function srcText(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function stubCtx(rep) {
  return {
    events: [],
    world: {
      reputation: { ...rep },
    },
    emit(type, payload) {
      this.events.push({ type, ...(payload && typeof payload === 'object' ? payload : {}) });
    },
  };
}

function hull(extra = {}) {
  const role = extra.role ?? 'patrol';
  const faction = extra.faction ?? 'freehold';
  const lastAttacker = extra.lastAttacker ?? 'player';
  const classKey = extra.classKey ?? 'light';
  const state = {
    destroyed: extra.destroyed !== false,
    faction,
    classKey,
  };
  if (extra.grafted === true) state.grafted = true;
  if (extra.stateHangar) state.hangar = extra.stateHangar;
  const ship = {
    record: { role, faction, classKey },
    state,
    role,
    classKey,
    ai: { lastAttacker, role, deathHandled: true },
  };
  if (extra.hangar) ship.hangar = extra.hangar;
  if (extra.player) ship.player = extra.player;
  return ship;
}

pin('const.killDelta', KILL_STANDING_DELTA === -5, String(KILL_STANDING_DELTA));
pin('const.abomDelta', ABOMINATION_DESTROY_BEAUTIFUL_DELTA === 5,
  String(ABOMINATION_DESTROY_BEAUTIFUL_DELTA));
pin('const.graftUu', GRAFT_LIST_UU === 4000, String(GRAFT_LIST_UU));
pin('const.graftRefuseCredits', GRAFT_REFUSE_LINES.credits === 'Not enough credits.');
pin('const.graftRefuseLine', graftRefuseLine('credits') === 'Not enough credits.');

{
  const ctx = stubCtx({ freehold: 10, redledger: 3, veridian: 1, hollow: 0 });
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'patrol', faction: 'freehold', lastAttacker: 'player',
  }));
  pin('kill.ok', res.ok === true && res.faction === 'freehold', JSON.stringify(res));
  pin('kill.deltaNeg5', ctx.world.reputation.freehold === 5,
    String(ctx.world.reputation.freehold));
  pin('kill.othersUntouched',
    ctx.world.reputation.redledger === 3
    && ctx.world.reputation.veridian === 1
    && ctx.world.reputation.hollow === 0
    && !Object.hasOwn(ctx.world.reputation, 'beautiful'));
  pin('kill.commLine', ctx.events.some((e) => e.type === 'commLine'
    && typeof e.text === 'string'
    && e.text.includes('Freehold Compact')));
  pin('kill.noCrimeScore', !Object.hasOwn(ctx.world, 'crimeScore')
    && !Object.hasOwn(ctx.world, 'wanted')
    && !Object.hasOwn(ctx.world, 'crimes'));
}

{
  const ctx = stubCtx({ freehold: 10 });
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'patrol',
    faction: 'freehold',
    lastAttacker: 'player',
    grafted: true,
  }));
  pin('abom.ok', res.ok === true && res.faction === 'freehold', JSON.stringify(res));
  pin('abom.victimNeg5', ctx.world.reputation.freehold === 5);
  pin('abom.beautifulPlus5', ctx.world.reputation.beautiful === 5,
    String(ctx.world.reputation.beautiful));
  pin('abom.createdKey', Object.hasOwn(ctx.world.reputation, 'beautiful'));
}

{
  const ctx = stubCtx({ freehold: 10, beautiful: 0 });
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'trader',
    faction: 'freehold',
    lastAttacker: 'player',
    grafted: true,
  }));
  pin('abom.noPlayerGraft.plus5', res.ok === true
    && ctx.world.reputation.beautiful === 5
    && ctx.world.reputation.freehold === 5,
    String(ctx.world.reputation.beautiful));
}

{
  const ctx = stubCtx({ freehold: 10, beautiful: -10 });
  ctx.world.hangar = {
    mountedId: 'h1',
    hulls: [{ id: 'h1', grafted: true, hullKind: 'built' }],
  };
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'trader',
    faction: 'freehold',
    lastAttacker: 'player',
    grafted: true,
  }));
  pin('abom.playerGrafted.capHold', res.ok === true
    && ctx.world.reputation.beautiful === -10
    && ctx.world.reputation.freehold === 5,
    String(ctx.world.reputation.beautiful));
}

{
  const ctx = stubCtx({ freehold: 4 });
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'trader',
    faction: 'freehold',
    lastAttacker: 'player',
    hangar: { mountedId: 'h1', hulls: [{ id: 'h1', grafted: true }] },
  }));
  pin('abom.hangarRow', res.ok === true && ctx.world.reputation.beautiful === 5
    && ctx.world.reputation.freehold === -1);
}

{
  const ctx = stubCtx({ beautiful: 8, gilded: 2 });
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'miner',
    faction: 'beautiful',
    lastAttacker: 'player',
    grafted: true,
  }));
  pin('abom.beautifulVictimSkipBonus', res.ok === true && res.faction === 'beautiful');
  pin('abom.beautifulOnlyNeg5', ctx.world.reputation.beautiful === 3
    && ctx.world.reputation.gilded === 2,
    String(ctx.world.reputation.beautiful));
}

{
  const proto = {};
  Object.setPrototypeOf(proto, { grafted: true });
  const ctx = stubCtx({ freehold: 0 });
  const ship = hull({ role: 'patrol', faction: 'freehold' });
  ship.state = Object.assign(Object.create({ grafted: true }), {
    destroyed: true,
    faction: 'freehold',
    classKey: 'light',
  });
  applyPlayerKillStanding(ctx, ship);
  pin('abom.protoInheritedNoBonus', !Object.hasOwn(ctx.world.reputation, 'beautiful')
    && ctx.world.reputation.freehold === -5);
}

{
  const ctx = stubCtx({ freehold: 6, beautiful: 1 });
  const res = applyPlayerKillStanding(ctx, hull({
    role: 'pirate',
    faction: 'freehold',
    lastAttacker: 'player',
    grafted: true,
  }));
  pin('skip.pirate', res.ok === false && res.reason === 'skip', JSON.stringify(res));
  pin('skip.pirateBag', ctx.world.reputation.freehold === 6
    && ctx.world.reputation.beautiful === 1);
  pin('skip.pirateNoComm', !ctx.events.some((e) => e.type === 'commLine'));
}

{
  const ctx = stubCtx({ freehold: 6 });
  applyPlayerKillStanding(ctx, hull({
    role: 'ace', faction: 'freehold', lastAttacker: 'player', classKey: 'ace', grafted: true,
  }));
  pin('skip.ace', ctx.world.reputation.freehold === 6
    && !Object.hasOwn(ctx.world.reputation, 'beautiful'));
}

{
  const ctx = stubCtx({ freehold: 6 });
  applyPlayerKillStanding(ctx, hull({
    role: 'patrol', faction: 'independent', lastAttacker: 'player', grafted: true,
  }));
  pin('skip.independent', ctx.world.reputation.freehold === 6
    && !Object.hasOwn(ctx.world.reputation, 'beautiful'));
}

{
  const ctx = stubCtx({ freehold: 6 });
  applyPlayerKillStanding(ctx, hull({
    role: 'patrol', faction: '__proto__', lastAttacker: 'player', grafted: true,
  }));
  pin('skip.reserved', ctx.world.reputation.freehold === 6
    && !Object.hasOwn(ctx.world.reputation, '__proto__')
    && !Object.hasOwn(ctx.world.reputation, 'beautiful'));
}

{
  const ctx = stubCtx({ freehold: 6 });
  applyPlayerKillStanding(ctx, hull({
    role: 'patrol', faction: 'freehold', lastAttacker: 'npc', grafted: true,
  }));
  pin('skip.npcAttacker', ctx.world.reputation.freehold === 6
    && !Object.hasOwn(ctx.world.reputation, 'beautiful'));
}

function builtRow(id, extra = {}) {
  const row = {
    id,
    hullKind: extra.hullKind ?? 'built',
    classKey: extra.classKey ?? 'light',
    faction: extra.faction ?? 'gilded',
    name: extra.name ?? id,
    scanner: 0,
    miningLaser: 0,
    concealedMounts: false,
    cargoCapacity: 20,
    cargo: [],
  };
  if (extra.grafted === true) row.grafted = true;
  return row;
}

function mockDock(extra = {}) {
  const faction = extra.banner ?? 'gilded';
  const systemId = extra.systemId ?? `${faction}_dock`;
  const player = extra.player ?? createShipState('light', {
    name: 'probe',
    faction: extra.playerFaction ?? 'independent',
  });
  player.hullKind = extra.hullKind ?? 'built';
  if (extra.playerGrafted === true) player.grafted = true;
  return {
    flags: { docked: true, combat: false, paused: false, ...(extra.flags ?? {}) },
    world: {
      currentSystem: systemId,
      credits: Object.hasOwn(extra, 'credits') ? extra.credits : 5000,
      reputation: extra.reputation ?? { gilded: 0 },
      hangar: extra.hangar ?? {
        mountedId: 'hull_m',
        hulls: [builtRow('hull_m')],
      },
      shipName: 'probe',
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
    },
    systems: extra.systems ?? { [systemId]: { faction } },
    cargo: [],
    cargoCapacity: 20,
    player,
    gate: extra.gate ?? { jumping: false },
    emit() {},
  };
}

function mounted(ctx) {
  const hangar = ctx.world?.hangar;
  return hangar?.hulls?.find((h) => h.id === hangar.mountedId) ?? null;
}

{
  const ctx = mockDock({ credits: 3999 });
  const res = graftMounted(ctx);
  pin('graft.short.refuse', res.ok === false && res.reason === 'credits', JSON.stringify(res));
  pin('graft.short.noFlag', mounted(ctx)?.grafted !== true
    && !Object.hasOwn(ctx.player, 'grafted'));
  pin('graft.short.creditsStay', ctx.world.credits === 3999);
  pin('graft.short.noBeautiful', !Object.hasOwn(ctx.world.reputation, 'beautiful'));
}

{
  const ctx = mockDock({ credits: Number.NaN });
  const res = graftMounted(ctx);
  pin('graft.nan.refuse', res.ok === false && res.reason === 'credits', JSON.stringify(res));
  pin('graft.nan.noFlag', mounted(ctx)?.grafted !== true);
}

{
  const ctx = mockDock({});
  delete ctx.world.credits;
  const res = graftMounted(ctx);
  pin('graft.missing.refuse', res.ok === false && res.reason === 'credits', JSON.stringify(res));
  pin('graft.missing.noFlag', mounted(ctx)?.grafted !== true);
}

{
  const ctx = mockDock({ credits: 4000 });
  const res = graftMounted(ctx);
  pin('graft.exact.ok', res.ok === true, JSON.stringify(res));
  pin('graft.exact.debit0', ctx.world.credits === 0, String(ctx.world.credits));
  pin('graft.exact.flag', mounted(ctx)?.grafted === true && ctx.player.grafted === true);
  pin('graft.exact.standingCap', ctx.world.reputation.beautiful === -10);
  pin('graft.exact.hullKind', ctx.player.hullKind === 'built'
    && mounted(ctx)?.hullKind === 'built');
}

{
  const ctx = mockDock({ credits: 5000, reputation: { gilded: 0, beautiful: 4 } });
  const res = graftMounted(ctx);
  pin('graft.ok.debit4000', res.ok === true && ctx.world.credits === 1000,
    String(ctx.world.credits));
  pin('graft.ok.standingCap', ctx.world.reputation.beautiful === -10);
}

{
  const ctx = mockDock({ credits: 9000, reputation: { gilded: -1 } });
  const res = graftMounted(ctx);
  pin('graft.hostile.refuse', res.ok === false && res.reason === 'reputation');
  pin('graft.hostile.noDebit', ctx.world.credits === 9000 && mounted(ctx)?.grafted !== true);
}

{
  const ctx = mockDock({ credits: 9000, banner: 'freehold', reputation: { freehold: 0, gilded: 5 } });
  const res = graftMounted(ctx);
  pin('graft.banner.refuse', res.ok === false && res.reason === 'banner');
  pin('graft.banner.noDebit', ctx.world.credits === 9000);
}

{
  const hangarSrc = srcText('src/game/hangar.js');
  const start = hangarSrc.indexOf('export function graftMounted');
  const end = hangarSrc.indexOf('export function rebuildStarterHangar');
  const body = start >= 0 && end > start ? hangarSrc.slice(start, end) : '';
  pin('graft.src.noRemount', body.includes('graftMounted')
    && !body.includes('callRemount')
    && !body.includes('registerPlayerRemount'));
  pin('graft.src.debit', body.includes('credits - price')
    && body.includes("reason: 'credits'"));
}

{
  const desk = srcText('src/systems/shipyard-desk.js');
  pin('desk.offerUu', desk.includes('${GRAFT_LIST_UU} UU · Mounted plated hull.'));
  pin('desk.confirmUu', desk.includes('${GRAFT_LIST_UU} UU · ${reduced ? GRAFT_WARN_REDUCED : GRAFT_WARN}'));
  pin('desk.creditsLine', desk.includes("credits: 'Not enough credits.'"));
  pin('src.noCrimeScore', !srcText('src/game/kill-standing.js').includes('crimeScore'));
}

if (fails.length) {
  console.log(`FAIL count=${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('PASS all');
}
