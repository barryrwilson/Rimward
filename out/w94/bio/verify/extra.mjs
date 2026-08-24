// Extra Wave 94 verifier pins. Not product source.
import { register } from 'node:module';
register(new URL('../css-register.mjs', import.meta.url));

const { createShipState, COMMODITIES, SHIP_CLASSES } = await import('../../../../src/game/state.js');
const { nextTrainClass, HANGAR_CAP } = await import('../../../../src/game/hangar.js');
const {
  LIVING_STOCK,
  livingTrainDest,
  livingTrainDests,
  trainListPrice,
  yardPrice,
  purchaseYardHull,
} = await import('../../../../src/game/shipyard.js');
const { DOCK_KEY_SERVICES } = await import('../../../../src/systems/station.js');

const dest = nextTrainClass('light');
const dests = livingTrainDests('light');
const valid = dests.includes(dest) && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, dest);
console.log('nextTrainClass(light)=', dest);
console.log('nextTrainClass.validDest', valid);
console.log('bootPin.nextTrainClass_light_heavy', dest === 'heavy');
console.log('bootPin.livingTrainDest_frigate_null', livingTrainDest('frigate') == null);
console.log('trainListPrice.eqYard', trainListPrice(50, 'ace') === yardPrice('ace', 50));
console.log('stock', [...LIVING_STOCK].join(','));
console.log('commodities.seed', Object.prototype.hasOwnProperty.call(COMMODITIES, 'seed'));
console.log('commodities.seed_market', Object.prototype.hasOwnProperty.call(COMMODITIES, 'seed_market'));
console.log('digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard');

const hulls = Array.from({ length: 8 }, (_, i) => ({
  id: i === 0 ? 'hull_starter' : `hull_fill_${i}`,
  hullKind: 'living',
  classKey: 'light',
  faction: 'independent',
  name: 'Fill',
}));
const ctx = {
  flags: { docked: true },
  gate: { jumping: false },
  world: {
    currentSystem: 'p',
    credits: 200000,
    reputation: { beautiful: 50 },
    hangar: { mountedId: hulls[0].id, hulls },
  },
  systems: { p: { faction: 'beautiful' } },
  player: createShipState('light', { name: 'P', faction: 'independent' }),
  config: { ship: { maxSpeed: 120, creep: 30, acceleration: 90, damping: 0.5, afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 } } },
  emit() {},
};
ctx.player.hullKind = 'living';
ctx.player.classKey = 'light';
const full = purchaseYardHull(ctx, 'light');
console.log('buy.full', full.ok === false && full.reason === 'full' && ctx.world.hangar.hulls.length === HANGAR_CAP);

if (!valid) process.exit(1);
