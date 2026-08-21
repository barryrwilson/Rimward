// Wave 72 PR1 — hangar grafted boolean allowlist.
// node --import ./scripts/with-css-stub.mjs out/w72/pr1/probe.mjs
import { readFileSync } from 'node:fs';
import { createShipState } from '../../../src/game/state.js';
import {
  sanitizeHangar,
  sanitizeHangarRecord,
  parkMounted,
  healPlayerHullKind,
  syncMountedToPlayer,
  rebuildStarterHangar,
  switchTo,
} from '../../../src/game/hangar.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(extra = {}) {
  return {
    flags: extra.flags ?? {},
    gate: extra.gate ?? {},
    world: {
      currentSystem: 'freehold',
      credits: 350,
      fear: 0,
      scanner: extra.scanner ?? 0,
      miningLaser: extra.miningLaser ?? 0,
      concealedMounts: extra.concealedMounts ?? false,
      reputation: extra.reputation ?? { freehold: 0, redledger: 0, veridian: 0, hollow: 0 },
      ...(extra.world ?? {}),
    },
    systems: { freehold: {} },
    cargo: extra.cargo ?? [],
    cargoCapacity: extra.cargoCapacity ?? 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: extra.player ?? createShipState('light', { name: 'Probe' }),
    ship: { object: null },
    emit() {},
    ships: [],
    config: { ship: { maxSpeed: 120, creep: 30, afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 } } },
  };
}

function rowOf(id) {
  return { id, hullKind: 'built', classKey: 'light', faction: 'gilded' };
}

{
  const rec = sanitizeHangarRecord({ ...rowOf('hull_graft'), grafted: true });
  pin('keep.true', rec?.grafted === true && rec.hullKind === 'built');
}

{
  const missing = sanitizeHangarRecord(rowOf('hull_miss'));
  const falsy = sanitizeHangarRecord({ ...rowOf('hull_false'), grafted: false });
  const yes = sanitizeHangarRecord({ ...rowOf('hull_yes'), grafted: 'yes' });
  const one = sanitizeHangarRecord({ ...rowOf('hull_one'), grafted: 1 });
  const token = sanitizeHangarRecord({ ...rowOf('hull_token'), grafted: 'grafted' });
  pin('omit.missing', missing && !Object.prototype.hasOwnProperty.call(missing, 'grafted'));
  pin('omit.false', falsy && !Object.prototype.hasOwnProperty.call(falsy, 'grafted'));
  pin('omit.yes', yes && !Object.prototype.hasOwnProperty.call(yes, 'grafted'));
  pin('omit.one', one && !Object.prototype.hasOwnProperty.call(one, 'grafted'));
  pin('omit.token', token && !Object.prototype.hasOwnProperty.call(token, 'grafted'));
}

{
  const rec = sanitizeHangarRecord({
    id: 'hull_live',
    hullKind: 'living',
    classKey: 'light',
    faction: 'beautiful',
    grafted: true,
  });
  pin('living.drop', rec?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(rec, 'grafted'));
}

{
  const rec = sanitizeHangarRecord({
    id: 'hull_unk',
    hullKind: 'built',
    classKey: 'light',
    faction: 'unknowables',
    grafted: true,
  });
  pin('unk.kind', rec?.hullKind === 'living');
  pin('unk.drop', rec && !Object.prototype.hasOwnProperty.call(rec, 'grafted'));
}

{
  const rec = sanitizeHangarRecord({
    id: '__proto__',
    hullKind: 'built',
    grafted: true,
    classKey: 'light',
    faction: 'gilded',
  });
  pin('proto.id', rec === null);
}

{
  const rec = sanitizeHangarRecord(JSON.parse(
    '{"id":"constructor","hullKind":"built","grafted":true,"classKey":"light"}',
  ));
  pin('proto.constructor', rec === null);
}

{
  const polluted = Object.prototype.grafted;
  Object.prototype.grafted = true;
  try {
    const rec = sanitizeHangarRecord(rowOf('hull_proto_pollute'));
    pin('proto.pollute', rec && !Object.prototype.hasOwnProperty.call(rec, 'grafted'));
  } finally {
    if (polluted === undefined) delete Object.prototype.grafted;
    else Object.prototype.grafted = polluted;
  }
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true, faction: 'gilded' }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_built',
    hulls: [{ id: 'hull_built', hullKind: 'built', classKey: 'light', faction: 'gilded' }],
  };
  sanitizeHangar(ctx);
  parkMounted(ctx);
  const packed = ctx.world.hangar.hulls[0];
  pin('pack.built', packed?.grafted === true && packed.hullKind === 'built');
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'living', grafted: true, faction: 'independent' }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_starter',
    hulls: [{ id: 'hull_starter', hullKind: 'living', classKey: 'light', faction: 'independent' }],
  };
  sanitizeHangar(ctx);
  parkMounted(ctx);
  const packed = ctx.world.hangar.hulls[0];
  pin('pack.livingDrop', packed?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(packed, 'grafted'));
}

{
  const ctx = makeCtx({
    flags: { docked: true },
    player: Object.assign(createShipState('light'), { hullKind: 'living', faction: 'independent' }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_a',
    hulls: [
      { id: 'hull_a', hullKind: 'living', classKey: 'light', faction: 'independent' },
      { id: 'hull_b', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' },
    ],
  };
  const onto = switchTo(ctx, 'hull_b');
  pin('load.ok', onto.ok === true);
  pin('load.copy', ctx.player.grafted === true && ctx.player.hullKind === 'built');
  const back = switchTo(ctx, 'hull_a');
  pin('load.clear', back.ok === true && !Object.prototype.hasOwnProperty.call(ctx.player, 'grafted'));
  pin('load.living', ctx.player.hullKind === 'living');
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'living', grafted: true }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_b',
    hulls: [
      { id: 'hull_a', hullKind: 'living', classKey: 'light', faction: 'independent' },
      { id: 'hull_b', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' },
    ],
  };
  sanitizeHangar(ctx);
  syncMountedToPlayer(ctx);
  pin('sync.copy', ctx.player.grafted === true && ctx.player.hullKind === 'built');
  ctx.world.hangar.mountedId = 'hull_a';
  syncMountedToPlayer(ctx);
  pin('sync.clear', ctx.player.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(ctx.player, 'grafted'));
}

{
  const built = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true, faction: 'gilded' }),
  });
  healPlayerHullKind(built);
  pin('heal.keepBuilt', built.player.grafted === true && built.player.hullKind === 'built');

  const junk = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: 'yes', faction: 'gilded' }),
  });
  healPlayerHullKind(junk);
  pin('heal.dropJunk', junk.player.hullKind === 'built' && !Object.prototype.hasOwnProperty.call(junk.player, 'grafted'));

  const living = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'living', grafted: true }),
  });
  healPlayerHullKind(living);
  pin('heal.dropLiving', living.player.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(living.player, 'grafted'));

  const unk = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true, faction: 'unknowables' }),
  });
  healPlayerHullKind(unk);
  pin('heal.dropUnk', unk.player.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(unk.player, 'grafted'));
}

{
  const ctx = makeCtx();
  ctx.world.hangar = {
    mountedId: 'hull_a',
    hulls: [
      { id: 'hull_a', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' },
      { id: 'hull_b', hullKind: 'living', grafted: true, classKey: 'light', faction: 'beautiful' },
      { id: 'hull_c', hullKind: 'built', grafted: 'yes', classKey: 'light', faction: 'gilded' },
      { id: 'hull_d', hullKind: 'built', grafted: true, classKey: 'light', faction: 'unknowables' },
      { id: 'hull_e', hullKind: 'built', grafted: 1, classKey: 'light', faction: 'gilded' },
      { id: '__proto__', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' },
    ],
  };
  const beforeRep = { ...ctx.world.reputation };
  sanitizeHangar(ctx);
  const byId = Object.fromEntries(ctx.world.hangar.hulls.map((r) => [r.id, r]));
  pin('mix.len', ctx.world.hangar.hulls.length === 5);
  pin('mix.a', byId.hull_a?.grafted === true && byId.hull_a.hullKind === 'built');
  pin('mix.b', byId.hull_b?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(byId.hull_b, 'grafted'));
  pin('mix.c', byId.hull_c && !Object.prototype.hasOwnProperty.call(byId.hull_c, 'grafted'));
  pin('mix.d', byId.hull_d?.hullKind === 'living' && !Object.prototype.hasOwnProperty.call(byId.hull_d, 'grafted'));
  pin('mix.e', byId.hull_e && !Object.prototype.hasOwnProperty.call(byId.hull_e, 'grafted'));
  pin('mix.protoGone', !ctx.world.hangar.hulls.some((r) => r.id === '__proto__'));
  pin('mix.noRepWrite', JSON.stringify(ctx.world.reputation) === JSON.stringify(beforeRep));
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true, faction: 'gilded' }),
  });
  delete ctx.world.hangar;
  sanitizeHangar(ctx);
  const starter = ctx.world.hangar.hulls[0];
  pin('starter.living', starter?.hullKind === 'living' && ctx.player.hullKind === 'living');
  pin('starter.noGraft', !Object.prototype.hasOwnProperty.call(starter, 'grafted'));
  pin('starter.playerNoGraft', !Object.prototype.hasOwnProperty.call(ctx.player, 'grafted'));
}

{
  const ctx = makeCtx({
    player: Object.assign(createShipState('light'), { hullKind: 'built', grafted: true }),
  });
  ctx.world.hangar = {
    mountedId: 'hull_x',
    hulls: [{ id: 'hull_x', hullKind: 'built', grafted: true, classKey: 'light', faction: 'gilded' }],
  };
  rebuildStarterHangar(ctx);
  pin('rebuild.noGraft', !Object.prototype.hasOwnProperty.call(ctx.world.hangar.hulls[0], 'grafted'));
  pin('rebuild.living', ctx.world.hangar.hulls[0].hullKind === 'living' && ctx.player.hullKind === 'living');
}

{
  const src = readFileSync(new URL('../../../src/game/hangar.js', import.meta.url), 'utf8');
  pin('src.noBeautifulRep', !/reputation\.beautiful/.test(src));
  pin('src.noHostileStanding', !/HOSTILE_STANDING/.test(src));
  pin('src.noInnerHtml', !/innerHTML/.test(src));
}

if (fails.length) {
  console.log('W72 PR1 PROBE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W72 PR1 PROBE PASS', fails.length);
process.exit(0);
