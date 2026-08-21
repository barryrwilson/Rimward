// Wave 72 PR3 extra edges — verifier only. Does not edit src/.
// node --import ./scripts/with-css-stub.mjs out/w72/pr3/edge-probe.mjs
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
import {
  cancelGraftPending,
  cancelYardPending,
  handleShipyardDigit,
  GRAFT_WARN,
  GRAFT_WARN_REDUCED,
} from '../../../src/systems/shipyard-desk.js';
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
  const ctx = mockDock('gilded', { hullKind: 'built', credits: 350, reputation: { gilded: 0 } });
  const first = graftMounted(ctx);
  const credits = ctx.world.credits;
  const standing = ctx.world.reputation.beautiful;
  const second = graftMounted(ctx);
  pin('edge.double.secondAlready', second.ok === false && second.reason === 'already', JSON.stringify(second));
  pin('edge.double.firstOk', first.ok === true);
  pin('edge.double.credits', ctx.world.credits === credits && credits === 350);
  pin('edge.double.standingCap', ctx.world.reputation.beautiful === standing && standing === -10);
  pin('edge.double.stillGrafted', mounted(ctx)?.grafted === true && ctx.player.grafted === true);
}

{
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    hangar: { mountedId: 'hull_m', hulls: [builtRow('hull_m', { grafted: true })] },
    reputation: { gilded: 0, beautiful: -10 },
  });
  ctx.player.grafted = true;
  const refuse = graftMounted(ctx);
  pin('edge.double.apiRefuse', refuse.ok === false && refuse.reason === 'already');
}

{
  const protoBag = Object.create({ beautiful: 88, constructor: 3 });
  protoBag.gilded = 0;
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    hangar: { mountedId: 'hull_m', hulls: [builtRow('hull_m', { grafted: true })] },
    reputation: protoBag,
  });
  applyAbominationStanding(ctx);
  pin('edge.proto.ownBeautiful', Object.prototype.hasOwnProperty.call(ctx.world.reputation, 'beautiful')
    && ctx.world.reputation.beautiful === -10);
  pin('edge.proto.inheritedUntouched', Object.getPrototypeOf(ctx.world.reputation).beautiful === 88);
  pin('edge.proto.noConstructorWrite', !Object.prototype.hasOwnProperty.call(ctx.world.reputation, 'constructor'));
}

{
  let polluted = false;
  try {
    if (!Object.prototype.hasOwnProperty.call(Object.prototype, 'beautiful')) {
      Object.prototype.beautiful = 50;
      polluted = true;
    }
    const bag = { gilded: 0 };
    const ctx = mockDock('gilded', {
      hullKind: 'built',
      hangar: { mountedId: 'hull_m', hulls: [builtRow('hull_m', { grafted: true })] },
      reputation: bag,
    });
    applyAbominationStanding(ctx);
    pin('edge.proto.pollutionOwnWrite', Object.prototype.hasOwnProperty.call(bag, 'beautiful') && bag.beautiful === -10);
    pin('edge.proto.pollutionNotInheritedRead', bag.beautiful === -10);
  } finally {
    if (polluted) delete Object.prototype.beautiful;
  }
}

{
  const bag = { gilded: 0, constructor: 12, toString: 4 };
  const ctx = mockDock('gilded', {
    hullKind: 'built',
    reputation: bag,
  });
  graftMounted(ctx);
  pin('edge.constructor.unwritten', bag.constructor === 12);
  pin('edge.constructor.toStringUnwritten', bag.toString === 4);
  pin('edge.constructor.beautifulCap', bag.beautiful === -10);
}

{
  const ctx = mockDock('beautiful', {
    hullKind: 'built',
    reputation: { beautiful: 6, gilded: 9 },
  });
  const res = graftMounted(ctx);
  pin('edge.beautiful.failClosed', res.ok === false && res.reason === 'banner', JSON.stringify(res));
  pin('edge.beautiful.noFlag', ctx.player.grafted !== true && mounted(ctx)?.grafted !== true);
  pin('edge.beautiful.standing', ctx.world.reputation.beautiful === 6);
  pin('edge.beautiful.credits', ctx.world.credits === 350);
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
  pin('edge.parked.cap', ctx.world.reputation.beautiful === -10);
  pin('edge.parked.any', anyGrafted(ctx) === true);
  pin('edge.parked.mountedLiving', mounted(ctx)?.hullKind === 'living' && mounted(ctx)?.grafted !== true);
  pin('edge.parked.rowKept', ctx.world.hangar.hulls.find((h) => h.id === 'hull_park')?.grafted === true);
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
  ctx.player.grafted = true;
  sanitizeHangar(ctx);
  pin('edge.livingTamper.dropRow', !Object.prototype.hasOwnProperty.call(mounted(ctx) ?? {}, 'grafted'));
  pin('edge.livingTamper.noCap', ctx.world.reputation.beautiful === 4);
  pin('edge.livingTamper.any', anyGrafted(ctx) === false);
  applyMountedFlight(ctx);
  pin('edge.livingTamper.playerHeal', !Object.prototype.hasOwnProperty.call(ctx.player, 'grafted'));
  pin('edge.livingTamper.afterFlightNoCap', ctx.world.reputation.beautiful === 4);
}

{
  const ui = { graftPending: { mountedId: 'hull_m' }, yardPending: { classKey: 'light' }, notice: 'armed' };
  const graftCleared = cancelGraftPending(ui);
  pin('edge.cancel.graftFirst', graftCleared === true && ui.graftPending == null && ui.notice === '');
  pin('edge.cancel.yardStillArmed', ui.yardPending?.classKey === 'light');
  const yardCleared = cancelYardPending(ui);
  pin('edge.cancel.yardSecond', yardCleared === true && ui.yardPending == null);
}

{
  const ctx = mockDock('gilded', { hullKind: 'built', reputation: { gilded: 0, beautiful: 0 } });
  const ui = { graftPending: { mountedId: 'hull_m' }, notice: '', shipyardPane: 'hangar' };
  const swallowed = handleShipyardDigit(3, ctx, ui);
  pin('edge.digit.swallowed', swallowed === true && ui.graftPending != null);
  pin('edge.digit.noGraft', mounted(ctx)?.grafted !== true && ctx.player.grafted !== true);
  pin('edge.digit.standing', ctx.world.reputation.beautiful === 0);
  pin('edge.digit.credits', ctx.world.credits === 350);
}

{
  const ctx = mockDock('gilded', { hullKind: 'built', reputation: { gilded: 0, beautiful: 0 } });
  ctx.player.destroyed = true;
  pin('edge.destroyed.refuse', graftMounted(ctx).reason === 'destroyed');
}

{
  const ctx = mockDock('gilded', { hullKind: 'built', reputation: { gilded: 0 } });
  graftMounted(ctx);
  pin('edge.hud.builtGraftedMech', hudFamily(ctx) === 'mech');
  const living = hudFamily({ player: { hullKind: 'living', grafted: true } });
  pin('edge.hud.livingStillBio', living === 'bio');
}

{
  const hangar = srcText('src/game/hangar.js');
  const desk = srcText('src/systems/shipyard-desk.js');
  const station = srcText('src/systems/station.js');
  const hud = srcText('src/systems/hud.js');
  const ctxSrc = srcText('src/core/ctx.js');
  const npc = srcText('src/systems/npc.js');

  pin('edge.src.noInnerHTML.hangar', !/innerHTML/.test(hangar));
  pin('edge.src.noInnerHTML.desk', !/innerHTML/.test(desk));
  pin('edge.src.noInnerHTML.station', !/innerHTML/.test(station));
  pin('edge.src.hangar.noCredits', !/world\.credits\s*=/.test(hangar) && !/credits\s*-=/.test(hangar));
  pin('edge.src.desk.noDebit', !/world\.credits\s*=/.test(desk) && !/credits\s*-=/.test(desk));
  pin('edge.src.desk.no900', !/\b900\b/.test(desk) && !/HIDDEN_MOUNTS/.test(desk));
  pin('edge.src.graftMounted.noRemount', !/function graftMounted[\s\S]*?^export function rebuildStarterHangar/m.test(hangar)
    || !/callRemount\(ctx\)/.test(hangar.slice(hangar.indexOf('export function graftMounted'), hangar.indexOf('export function rebuildStarterHangar'))));
  pin('edge.src.warnBeforeConfirm', (() => {
    const pending = desk.slice(desk.indexOf('if (ui.graftPending)'), desk.indexOf('hulls.forEach'));
    const warnAt = pending.indexOf('GRAFT_WARN');
    const confirmAt = pending.indexOf('confirmGraft');
    return warnAt >= 0 && confirmAt > warnAt;
  })());
  pin('edge.src.offerDoesNotGraft', desk.includes("btn(card, 'Offer graft', () => {\n    setGraftPending(ui, ctx);"));
  pin('edge.src.warnText', GRAFT_WARN.includes('Beautiful Ones become immediate enemies')
    && GRAFT_WARN.includes('Patrols hunt at standing -10 or worse'));
  pin('edge.src.warnReduced', GRAFT_WARN_REDUCED === 'Beautiful Ones become enemies.');
  pin('edge.src.hTextContent', station.includes('if (text !== undefined) node.textContent = text;'));
  pin('edge.src.escCallsCancel', station.includes('if (ui.service === \'shipyard\' && (cancelGraftPending(ui) || cancelYardPending(ui)))'));
  pin('edge.src.digitsSwallow', desk.includes('if (ui.graftPending) return true;'));
  pin('edge.src.flightHealOrder', (() => {
    const fn = hangar.slice(hangar.indexOf('export function applyMountedFlight'), hangar.indexOf('export function graftMounted'));
    return fn.indexOf("faction === 'unknowables'") >= 0
      && fn.indexOf('healPlayerGrafted') > fn.indexOf("faction === 'unknowables'")
      && fn.indexOf('applyAbominationStanding') > fn.indexOf('healPlayerGrafted');
  })());
  pin('edge.src.hudNoWriteKind', !/player\.hullKind\s*=/.test(hud) && !/\.grafted\s*=/.test(hud));
  pin('edge.src.ctxNoNewEvents', !/['"]grafted['"]/.test(ctxSrc) && !/['"]abomination['"]/.test(ctxSrc)
    && !/hullKindChanged/.test(ctxSrc) && !/bioSeed/.test(ctxSrc));
  pin('edge.src.npcHostile', /HOSTILE_STANDING\s*=\s*-10/.test(npc));
  pin('edge.src.hangarHostile', /const HOSTILE_STANDING = -10/.test(hangar));
  pin('edge.src.noForInRep', !/for\s*\(.*in.*reputation/.test(hangar));
}

{
  const ctx = mockDock('gilded', { hullKind: 'built', reputation: { gilded: 0 } });
  const beforeKind = ctx.player.hullKind;
  graftMounted(ctx);
  pin('edge.kind.staysBuilt', ctx.player.hullKind === 'built' && mounted(ctx)?.hullKind === 'built' && beforeKind === 'built');
}

if (fails.length) {
  console.error(`FAIL ${fails.length}\n${fails.join('\n')}`);
  process.exit(1);
}
console.log('PASS');
process.exit(0);
