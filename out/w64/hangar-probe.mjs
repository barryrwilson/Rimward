// Wave 64 PR1 — hangar helpers without editing state.js.
// node --import ./scripts/with-css-stub.mjs out/w64/hangar-probe.mjs
import { snapshot, restore, clearAutosave } from '../../src/game/save.js';
import { createShipState } from '../../src/game/state.js';
import {
  HANGAR_CAP,
  sanitizeHangar,
  parkMounted,
  healPlayerHullKind,
  rebuildStarterHangar,
} from '../../src/game/hangar.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(extra = {}) {
  return {
    flags: {},
    world: {
      currentSystem: 'freehold',
      credits: 350,
      fear: 0,
      scanner: extra.scanner ?? 0,
      miningLaser: extra.miningLaser ?? 0,
      concealedMounts: extra.concealedMounts ?? false,
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
  };
}

{
  const ctx = makeCtx({ scanner: 1, cargo: [{ commodity: 'rawOre', units: 2 }] });
  delete ctx.world.hangar;
  sanitizeHangar(ctx);
  pin('migrate.one', ctx.world.hangar.hulls.length === 1);
  pin('migrate.living', ctx.world.hangar.hulls[0].hullKind === 'living');
  pin('migrate.mounted', ctx.world.hangar.mountedId === ctx.world.hangar.hulls[0].id);
  pin('migrate.scanner', ctx.world.hangar.hulls[0].scanner === 1);
}

{
  const hulls = [];
  for (let i = 1; i <= 10; i++) hulls.push({ id: 'hull_' + i, hullKind: 'living', classKey: 'light', faction: 'independent' });
  const ctx = makeCtx();
  ctx.world.hangar = { mountedId: 'hull_9', hulls };
  sanitizeHangar(ctx);
  const ids = ctx.world.hangar.hulls.map((h) => h.id);
  pin('cap.len', ctx.world.hangar.hulls.length === HANGAR_CAP);
  pin('cap.mounted', ids.includes('hull_9') && ctx.world.hangar.mountedId === 'hull_9');
  pin('cap.tail', !ids.includes('hull_10'));
}

{
  const ctx = makeCtx({ player: Object.assign(createShipState('light'), { hullKind: 'built', faction: 'unknowables' }) });
  ctx.world.hangar = {
    mountedId: 'u1',
    hulls: [{ id: 'u1', hullKind: 'built', classKey: 'ace', faction: 'unknowables', price: 0, loadout: {} }],
  };
  sanitizeHangar(ctx);
  healPlayerHullKind(ctx);
  pin('unk.row', ctx.world.hangar.hulls[0].hullKind === 'living');
  pin('unk.player', ctx.player.hullKind === 'living');
  pin('unk.noPrice', !('price' in ctx.world.hangar.hulls[0]));
  pin('unk.noLoadout', !('loadout' in ctx.world.hangar.hulls[0]));
  pin('unk.aceKept', ctx.world.hangar.hulls[0].classKey === 'ace');
}

{
  const ctx = makeCtx({ scanner: 2, miningLaser: 3, concealedMounts: true, cargo: [{ commodity: 'rawOre', units: 1, mesh: true }] });
  sanitizeHangar(ctx);
  parkMounted(ctx);
  const snap = snapshot(ctx);
  const row = snap.world.hangar.hulls[0];
  pin('snap.hangar', !!snap.world.hangar);
  pin('snap.parkScanner', row.scanner === 2);
  pin('snap.cargo', row.cargo.length === 1 && !('mesh' in row.cargo[0]));
}

{
  const ctx = makeCtx({ player: Object.assign(createShipState('light'), { hullKind: 'built' }) });
  ctx.world.hangar = { mountedId: 'a', hulls: [{ id: 'a', hullKind: 'built' }, { id: 'b', hullKind: 'built' }] };
  ctx.cargo = [{ commodity: 'rawOre', units: 5 }];
  rebuildStarterHangar(ctx);
  pin('fresh.one', ctx.world.hangar.hulls.length === 1);
  pin('fresh.living', ctx.player.hullKind === 'living' && ctx.world.hangar.hulls[0].hullKind === 'living');
  pin('fresh.cargo', ctx.cargo.length === 0 && ctx.cargoCapacity === 20);
}

{
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  mem.set('rimward-save-v1', 'x');
  mem.set('rimward-save-v1-slot-1', '1');
  mem.set('rimward-save-v1-slot-2', '2');
  mem.set('rimward-save-v1-slot-3', '3');
  clearAutosave();
  pin('berth.auto', !mem.has('rimward-save-v1'));
  pin('berth.slots', mem.get('rimward-save-v1-slot-1') === '1'
    && mem.get('rimward-save-v1-slot-2') === '2'
    && mem.get('rimward-save-v1-slot-3') === '3');
}

{
  const dest = makeCtx();
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold', scanner: 2 },
    cargo: [{ commodity: 'rawOre', units: 1 }],
  });
  pin('restore.legacyOne', dest.world.hangar.hulls.length === 1);
  pin('restore.legacyLiving', dest.world.hangar.hulls[0].hullKind === 'living');
}

{
  const ctx = makeCtx();
  ctx.world.hangar = {
    mountedId: 'hull_starter',
    hulls: [{ id: 'hull_starter', hullKind: 'living', classKey: 'light', faction: '__proto__' }],
  };
  sanitizeHangar(ctx);
  pin('proto.faction', ctx.world.hangar.hulls[0].faction === 'independent');
}

if (fails.length) {
  console.log('W64 PROBE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W64 PROBE PASS', fails.length);
process.exit(0);
