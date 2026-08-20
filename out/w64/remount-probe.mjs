// Wave 64 PR2 — envelope + switchTo without editing state.js.
// node --import ./scripts/with-css-stub.mjs out/w64/remount-probe.mjs
import { createShipState, SHIP_CLASSES } from '../../src/game/state.js';
import {
  switchTo,
  applyFlightEnvelope,
  sanitizeHangar,
} from '../../src/game/hangar.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(extra = {}) {
  return {
    flags: { docked: extra.docked === true, combat: false, paused: false },
    gate: { jumping: false },
    config: {
      ship: {
        maxSpeed: 120,
        creep: 30,
        acceleration: 90,
        damping: 0.5,
        afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 },
      },
    },
    world: {
      currentSystem: 'freehold',
      credits: 350,
      scanner: extra.scanner ?? 0,
      miningLaser: extra.miningLaser ?? 0,
      concealedMounts: extra.concealedMounts ?? false,
      shipName: extra.shipName ?? 'Probe',
      hangar: extra.hangar,
    },
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: { mood: 'serene', bond: 0.2, hunger: 0.15, wounds: 0, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: extra.player ?? createShipState('light', { name: 'Probe' }),
    input: { throttle: 0.3 },
    ship: { object: null, velocity: { set() {} }, speed: 0 },
    emit() {},
    ships: [],
  };
}

{
  const ctx = makeCtx();
  applyFlightEnvelope(ctx, 'heavy');
  pin('env.cruise', ctx.config.ship.maxSpeed === SHIP_CLASSES.heavy.cruise);
  pin('env.creep', ctx.config.ship.creep === SHIP_CLASSES.heavy.creep);
  pin('env.burn', ctx.config.ship.maxSpeed * ctx.config.ship.afterburner.multiplier === SHIP_CLASSES.heavy.burn);
  pin('env.damp', Math.abs(ctx.config.ship.damping - 1 / SHIP_CLASSES.heavy.stopTime) < 1e-9);
}

{
  const ctx = makeCtx({
    docked: true,
    cargo: [{ commodity: 'rawOre', units: 4 }],
    hangar: {
      mountedId: 'a',
      hulls: [
        { id: 'a', hullKind: 'living', classKey: 'light', faction: 'independent', cargo: [{ commodity: 'rawOre', units: 4 }], cargoCapacity: 20 },
        {
          id: 'b', hullKind: 'built', classKey: 'freighter', faction: 'freehold',
          cruise: 999, maxSpeed: 999, cargo: [{ commodity: 'slagIron', units: 2 }], cargoCapacity: 40,
        },
      ],
    },
  });
  ctx.flags.matchSpeed = true;
  const mood = ctx.bio.mood;
  const bond = ctx.bio.bond;
  const throttle = ctx.input.throttle;
  sanitizeHangar(ctx);
  const res = switchTo(ctx, 'b');
  pin('sw.ok', res.ok === true);
  pin('sw.cruise', ctx.config.ship.maxSpeed === SHIP_CLASSES.freighter.cruise);
  pin('sw.notBlob', ctx.config.ship.maxSpeed !== 999);
  pin('sw.cargo', ctx.cargo.length === 1 && ctx.cargo[0].commodity === 'slagIron');
  pin('sw.noConcat', !ctx.cargo.some((r) => r.commodity === 'rawOre'));
  pin('sw.bio', ctx.bio.mood === mood && ctx.bio.bond === bond);
  pin('sw.throttle', ctx.input.throttle === throttle);
  pin('sw.match', ctx.flags.matchSpeed === true);
  pin('sw.kind', ctx.player.hullKind === 'built');
  pin('sw.noNpc', ctx.ships.length === 0);
}

{
  const ctx = makeCtx({
    docked: false,
    hangar: {
      mountedId: 'a',
      hulls: [
        { id: 'a', hullKind: 'living', classKey: 'light', faction: 'independent' },
        { id: 'b', hullKind: 'built', classKey: 'heavy', faction: 'freehold' },
      ],
    },
  });
  sanitizeHangar(ctx);
  const res = switchTo(ctx, 'b');
  pin('space.refuse', res.ok === false && res.reason === 'not-docked');
  pin('space.stillA', ctx.world.hangar.mountedId === 'a');
}

{
  const ctx = makeCtx({
    docked: true,
    hangar: {
      mountedId: 'a',
      hulls: [
        { id: 'a', hullKind: 'living', classKey: 'light', faction: 'independent' },
        { id: 'u', hullKind: 'built', classKey: 'heavy', faction: 'unknowables' },
      ],
    },
  });
  sanitizeHangar(ctx);
  const res = switchTo(ctx, 'u');
  pin('unk.ok', res.ok === true);
  pin('unk.living', ctx.player.hullKind === 'living');
}

if (fails.length) {
  console.log('REMOUNT PROBE FAIL');
  for (const f of fails) console.log(' -', f);
  process.exit(1);
}
console.log('REMOUNT PROBE PASS');
