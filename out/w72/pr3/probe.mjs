// Wave 72 PR3 — Abomination desk (contract §12 PR3 / §7).
// node --import ./scripts/with-css-stub.mjs out/w72/pr3/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShipState } from '../../../src/game/state.js';
import {
  sanitizeHangar,
  graftMounted,
  applyAbominationStanding,
  anyGrafted,
  applyMountedFlight,
} from '../../../src/game/hangar.js';
import { cancelGraftPending } from '../../../src/systems/shipyard-desk.js';
import { hudFamily } from '../../../src/systems/hud.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const fails = [];

function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function srcText(rel) {
  return readFileSync(join(root, rel), 'utf8');
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

function livingRow(id, extra = {}) {
  return builtRow(id, { ...extra, hullKind: 'living', faction: extra.faction ?? 'beautiful' });
}

function mockDock(faction, extra = {}) {
  const systemId = extra.systemId ?? `${faction}_dock`;
  const player = extra.player ?? createShipState('light', {
    name: 'probe',
    faction: extra.playerFaction ?? 'independent',
  });
  if (extra.hullKind) player.hullKind = extra.hullKind;
  if (extra.playerGrafted === true) player.grafted = true;
  return {
    flags: { docked: true, combat: false, paused: false, ...(extra.flags ?? {}) },
    world: {
      currentSystem: systemId,
      credits: extra.credits ?? 350,
      reputation: extra.reputation ?? { [faction]: extra.rep ?? 0 },
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
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: {
      hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0,
      speedFactor: 1, turnFactor: 1,
    },
    player,
    ship: { object: null },
    emit() {},
    ships: [],
    gate: extra.gate ?? { jumping: false },
    config: { ship: { maxSpeed: 120, creep: 30, afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 } } },
    settings: extra.settings ?? { reducedMotion: false },
  };
}

function mounted(ctx) {
  const hangar = ctx.world?.hangar;
  return hangar?.hulls?.find((h) => h.id === hangar.mountedId) ?? null;
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    credits: 350,
    reputation: { gilded: 0 },
  });
  const credits = ctx.world.credits;
  const result = graftMounted(ctx);
  const row = mounted(ctx);
  pin('1.confirm.ok', result.ok === true, JSON.stringify(result));
  pin('1.row.grafted', row?.grafted === true && row?.hullKind === 'built');
  pin('1.player.grafted', ctx.player.grafted === true);
  pin('1.hullKind.built', ctx.player.hullKind === 'built' && row?.hullKind === 'built');
  pin('1.credits.unchanged', ctx.world.credits === credits && credits === 350);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: { gilded: 0 },
  });
  graftMounted(ctx);
  pin('2.standing.fromZero', ctx.world.reputation.beautiful === -10);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: {},
  });
  graftMounted(ctx);
  pin('2.standing.missingKey', ctx.world.reputation.beautiful === -10);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: { gilded: 0, beautiful: -25 },
  });
  graftMounted(ctx);
  pin('3.standing.keepWorse', ctx.world.reputation.beautiful === -25);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: { gilded: 0, beautiful: 0 },
  });
  const ui = { graftPending: { mountedId: 'hull_m' }, notice: 'armed' };
  const cleared = cancelGraftPending(ui);
  pin('4.cancel.clears', cleared === true && ui.graftPending == null);
  pin('4.cancel.noGrafted', mounted(ctx)?.grafted !== true);
  pin('4.cancel.playerClear', !Object.prototype.hasOwnProperty.call(ctx.player, 'grafted'));
  pin('4.cancel.standing', ctx.world.reputation.beautiful === 0);
  pin('4.cancel.credits', ctx.world.credits === 350);
}

{
  const living = mockDock('gilded', {
    hullKind: 'living',
    playerFaction: 'independent',
    hangar: { mountedId: 'hull_m', hulls: [livingRow('hull_m')] },
    reputation: { gilded: 0, beautiful: 0 },
  });
  const livingRes = graftMounted(living);
  pin('5.living.refuse', livingRes.ok === false && livingRes.reason === 'living', JSON.stringify(livingRes));
  pin('5.living.noFlag', living.player.grafted !== true && mounted(living)?.grafted !== true);
  pin('5.living.standing', living.world.reputation.beautiful === 0);

  const unk = mockDock('gilded', {
    hullKind: 'living',
    playerFaction: 'unknowables',
    hangar: {
      mountedId: 'hull_m',
      hulls: [builtRow('hull_m', { faction: 'unknowables', hullKind: 'built' })],
    },
    reputation: { gilded: 0, beautiful: 0 },
  });
  unk.player.faction = 'unknowables';
  const unkRes = graftMounted(unk);
  pin('5.unk.refuse', unkRes.ok === false && unkRes.reason === 'living', JSON.stringify(unkRes));
  pin('5.unk.noFlag', !Object.prototype.hasOwnProperty.call(mounted(unk) ?? {}, 'grafted'));

  const already = mockDock('gilded', {
    hullKind: 'built',
    hangar: { mountedId: 'hull_m', hulls: [builtRow('hull_m', { grafted: true })] },
    reputation: { gilded: 0, beautiful: -10 },
  });
  already.player.grafted = true;
  const alreadyRes = graftMounted(already);
  pin('5.already.refuse', alreadyRes.ok === false && alreadyRes.reason === 'already', JSON.stringify(alreadyRes));

  const freehold = mockDock('freehold', { hullKind: 'built', reputation: { freehold: 0, gilded: 5 } });
  const fhRes = graftMounted(freehold);
  pin('5.freehold.banner', fhRes.ok === false && fhRes.reason === 'banner', JSON.stringify(fhRes));
  pin('5.freehold.noGraft', freehold.player.grafted !== true);

  const beau = mockDock('beautiful', { hullKind: 'built', reputation: { beautiful: 5, gilded: 5 } });
  const beauRes = graftMounted(beau);
  pin('5.beautiful.banner', beauRes.ok === false && beauRes.reason === 'banner', JSON.stringify(beauRes));
  pin('5.beautiful.noGraft', beau.player.grafted !== true);
  pin('5.beautiful.standingUntouched', beau.world.reputation.beautiful === 5);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: { gilded: -1 },
  });
  const result = graftMounted(ctx);
  pin('6.rep.refuse', result.ok === false && result.reason === 'reputation', JSON.stringify(result));
  pin('6.rep.noGraft', ctx.player.grafted !== true && mounted(ctx)?.grafted !== true);
}

{
  const undocked = mockDock('gilded', { hullKind: 'built', flags: { docked: false } });
  pin('7.dock.refuse', graftMounted(undocked).reason === 'dock');

  const paused = mockDock('gilded', { hullKind: 'built', flags: { docked: true, paused: true } });
  pin('7.paused.refuse', graftMounted(paused).reason === 'paused');

  const combat = mockDock('gilded', { hullKind: 'built', flags: { docked: true, combat: true } });
  pin('7.combat.refuse', graftMounted(combat).reason === 'combat');

  const jumping = mockDock('gilded', { hullKind: 'built', gate: { jumping: true } });
  pin('7.jump.refuse', graftMounted(jumping).reason === 'jump');
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: { gilded: 0, beautiful: 4 },
    hangar: {
      mountedId: 'hull_m',
      hulls: [builtRow('hull_m', { grafted: true })],
    },
  });
  sanitizeHangar(ctx);
  pin('8.tamper.cap', ctx.world.reputation.beautiful === -10);
  pin('8.tamper.keepRow', mounted(ctx)?.grafted === true && mounted(ctx)?.hullKind === 'built');
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'living',
    reputation: { gilded: 0, beautiful: 4 },
    hangar: {
      mountedId: 'hull_l',
      hulls: [livingRow('hull_l', { grafted: true })],
    },
  });
  ctx.player.hullKind = 'living';
  sanitizeHangar(ctx);
  pin('8.livingDrop.noFlag', !Object.prototype.hasOwnProperty.call(mounted(ctx) ?? {}, 'grafted'));
  pin('8.livingDrop.noCap', ctx.world.reputation.beautiful === 4);
  pin('8.livingDrop.any', anyGrafted(ctx) === false);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'living',
    reputation: { gilded: 0, beautiful: 3 },
    hangar: {
      mountedId: 'hull_l',
      hulls: [
        livingRow('hull_l'),
        builtRow('hull_park', { grafted: true }),
      ],
    },
  });
  ctx.player.hullKind = 'living';
  sanitizeHangar(ctx);
  pin('9.mixed.any', anyGrafted(ctx) === true);
  pin('9.mixed.cap', ctx.world.reputation.beautiful === -10);
  pin('9.mixed.parked', ctx.world.hangar.hulls.find((h) => h.id === 'hull_park')?.grafted === true);
  pin('9.mixed.mountedLiving', mounted(ctx)?.hullKind === 'living');
}

{
  const ctx = mockDock('unknowables', {
    hullKind: 'built',
    playerFaction: 'unknowables',
    playerGrafted: true,
    hangar: {
      mountedId: 'hull_m',
      hulls: [builtRow('hull_m', { faction: 'unknowables', grafted: true })],
    },
    reputation: { unknowables: 0, beautiful: -10 },
  });
  ctx.player.faction = 'unknowables';
  ctx.player.grafted = true;
  ctx.player.hullKind = 'built';
  applyMountedFlight(ctx);
  pin('10.unk.kindLiving', ctx.player.hullKind === 'living');
  pin('10.unk.playerHeal', !Object.prototype.hasOwnProperty.call(ctx.player, 'grafted'));
}

{
  const desk = srcText('src/systems/shipyard-desk.js');
  const hangar = srcText('src/game/hangar.js');
  const station = srcText('src/systems/station.js');
  const ctxSrc = srcText('src/core/ctx.js');
  pin('11.desk.noInnerHTML', !/innerHTML/.test(desk));
  pin('11.desk.textContentFamily', desk.includes("h('div', 'shipyard-buy-meta', box, reduced ? GRAFT_WARN_REDUCED : GRAFT_WARN)"));
  pin('11.desk.warn', desk.includes('Beautiful Ones become immediate enemies'));
  pin('11.desk.warnHunt', desk.includes('Patrols hunt at standing -10 or worse'));
  pin('11.station.esc', station.includes('cancelGraftPending(ui)') && station.includes('cancelYardPending(ui)'));
  pin('11.station.init', station.includes('graftPending: null'));
  pin('11.ctx.noGraftedEvent', !/['\"]grafted['\"]/.test(ctxSrc) && !/['\"]abomination['\"]/.test(ctxSrc));
  pin('11.ctx.noHullKindChanged', !/hullKindChanged/.test(ctxSrc) && !/bioSeed/.test(ctxSrc));
  pin('11.hangar.noCreditsWrite', !/world\.credits\s*=/.test(hangar));
  pin('11.hangar.noAutosave', !/requestAutosave/.test(hangar));
  pin('11.hangar.noNpcImport', !/from '\.\.\/systems\/npc\.js'/.test(hangar) && !/from '\.\/npc\.js'/.test(hangar));
  pin('11.noHiddenMountCost', !/HIDDEN_MOUNTS/.test(desk) && !/\b900\b/.test(desk));
  pin('11.noYardPriceCopy', !/\b8000\b/.test(desk.split('GRAFT')[1] ?? 'GRAFT'));
}

{
  const fam = hudFamily({ player: { hullKind: 'built', grafted: true } });
  pin('12.hudFamily.mech', fam === 'mech', String(fam));
}

{
  applyAbominationStanding({ world: { hangar: { hulls: [] }, reputation: { beautiful: 8 } } });
  const bag = { beautiful: 8 };
  applyAbominationStanding({ world: { hangar: { hulls: [] }, reputation: bag } });
  pin('standing.noHealEmpty', bag.beautiful === 8);
}

if (fails.length) {
  console.error(`FAIL ${fails.length}\n${fails.join('\n')}`);
  process.exit(1);
}
console.log('PASS');
process.exit(0);
