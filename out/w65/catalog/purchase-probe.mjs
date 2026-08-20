// Extra verifier pin: cutter papers add a row and do not remount.
import { purchaseYardHull } from '../../../src/game/shipyard.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function mockDock(faction, extra = {}) {
  const systemId = extra.systemId ?? 'probe_dock';
  return {
    flags: { docked: true, combat: false, paused: false },
    world: {
      currentSystem: systemId,
      credits: extra.credits ?? 50000,
      reputation: extra.reputation ?? { [faction]: extra.rep ?? 0 },
      hangar: extra.hangar ?? {
        mountedId: 'hull_starter',
        hulls: [{
          id: 'hull_starter',
          hullKind: 'living',
          classKey: 'light',
          faction: 'independent',
          name: 'starter',
          scanner: 0,
          miningLaser: 0,
          concealedMounts: false,
          cargoCapacity: 20,
          cargo: [],
        }],
      },
    },
    systems: { [systemId]: { faction } },
    cargo: [],
    cargoCapacity: 20,
    player: extra.player ?? { classKey: 'light', hullKind: 'living', faction: 'independent' },
    ship: { object: { position: { toArray: () => [0, 0, 0] }, quaternion: { toArray: () => [0, 0, 0, 1] } } },
    emit() {},
    ships: [],
    gate: { jumping: false },
  };
}

const ctx = mockDock('freehold', { credits: 20000, rep: 0 });
const beforeMount = ctx.world.hangar.mountedId;
const beforeCredits = ctx.world.credits;
const bought = purchaseYardHull(ctx, 'cutter');
pin('cutter.ok', bought.ok === true, JSON.stringify(bought));
pin('cutter.price', bought.price === 11000, String(bought.price));
pin('cutter.rowClass', bought.row?.classKey === 'cutter');
pin('cutter.debit', ctx.world.credits === beforeCredits - 11000, String(ctx.world.credits));
pin('cutter.rowCount', ctx.world.hangar.hulls.length === 2, String(ctx.world.hangar.hulls.length));
pin('cutter.noRemount', ctx.world.hangar.mountedId === beforeMount, ctx.world.hangar.mountedId);
pin('cutter.playerClass', ctx.player.classKey === 'light');

const known = mockDock('freehold', { credits: 50000, rep: 10 });
const ace = purchaseYardHull(known, 'ace');
pin('ace.known.ok', ace.ok === true, JSON.stringify(ace));
pin('ace.known.noRemount', known.world.hangar.mountedId === 'hull_starter');

const beau = mockDock('beautiful', { credits: 20000, rep: 0 });
const beauCutter = purchaseYardHull(beau, 'cutter');
pin('beautiful.cutter.ok', beauCutter.ok === true, JSON.stringify(beauCutter));
pin('beautiful.cutter.living', beauCutter.row?.hullKind === 'living');
const beauAce = purchaseYardHull(beau, 'ace');
pin('beautiful.ace.stock', beauAce.ok === false && beauAce.reason === 'stock', JSON.stringify(beauAce));

if (fails.length) {
  console.log('FAIL', fails.join('; '));
  process.exitCode = 1;
} else {
  console.log('ALL PURCHASE PINS TRUE');
}
