// Wave 60 / save: survivor cargo fields survive snapshot→restore.
// Run: node --import ./scripts/with-css-stub.mjs out/w60/save/probe.mjs
import { snapshot, restore } from '../../../src/game/save.js';

const fails = [];

function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeCtx(cargo = []) {
  return {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0 },
    systems: { freehold: {} },
    cargo: cargo.map((row) => ({ ...row })),
    cargoCapacity: 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: null,
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

function throughLocalStorage(ctx) {
  const snap = JSON.parse(JSON.stringify(snapshot(ctx)));
  const dest = makeCtx();
  restore(dest, snap);
  return { snap, dest };
}

// 1. survivor faction+source+name survive a snapshot→restore
{
  const live = makeCtx([
    {
      commodity: 'survivor',
      units: 2,
      faction: 'veridian',
      source: 'playerKill',
      name: 'Ilyra Voss',
      attacker: { id: 'ship-9' },
      mesh: { uuid: 'nope' },
    },
  ]);
  const { snap, dest } = throughLocalStorage(live);
  const row = dest.cargo[0];
  pin('survivor.roundtrip.count', dest.cargo.length === 1, `len=${dest.cargo.length}`);
  pin('survivor.roundtrip.commodity', row?.commodity === 'survivor');
  pin('survivor.roundtrip.units', row?.units === 2);
  pin('survivor.roundtrip.faction', row?.faction === 'veridian');
  pin('survivor.roundtrip.source', row?.source === 'playerKill');
  pin('survivor.roundtrip.name', row?.name === 'Ilyra Voss');
  pin('survivor.snap.noAttacker', snap.cargo[0] && !('attacker' in snap.cargo[0]));
  pin('survivor.snap.noMesh', snap.cargo[0] && !('mesh' in snap.cargo[0]));
  pin('survivor.restored.noAttacker', row && !('attacker' in row));
}

// 2. bad source heals to other
{
  const dest = makeCtx();
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold', credits: 10, fear: 0 },
    cargo: [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'hacked' }],
  });
  pin('source.heal', dest.cargo[0]?.source === 'other', `source=${dest.cargo[0]?.source}`);
}

// 3. ordinary rawOre row stays {commodity, units} only
{
  const live = makeCtx([
    { commodity: 'rawOre', units: 5, grade: 3, vein: { id: 9 }, hardness: 2 },
  ]);
  const { snap, dest } = throughLocalStorage(live);
  const snapKeys = Object.keys(snap.cargo[0] ?? {}).sort().join(',');
  const destKeys = Object.keys(dest.cargo[0] ?? {}).sort().join(',');
  pin('rawOre.snap.keys', snapKeys === 'commodity,units', snapKeys);
  pin('rawOre.restored.keys', destKeys === 'commodity,units', destKeys);
  pin('rawOre.restored.values', dest.cargo[0]?.commodity === 'rawOre' && dest.cargo[0]?.units === 5);
}

// 4. old save with only commodity+units still loads
{
  const dest = makeCtx([{ commodity: 'provisions', units: 9 }]);
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold' },
    cargo: [{ commodity: 'provisions', units: 3 }],
  });
  pin('legacy.ordinary.count', dest.cargo.length === 1);
  pin('legacy.ordinary.keys', Object.keys(dest.cargo[0] ?? {}).sort().join(',') === 'commodity,units');
  pin('legacy.ordinary.values', dest.cargo[0]?.commodity === 'provisions' && dest.cargo[0]?.units === 3);

  const dest2 = makeCtx();
  restore(dest2, {
    v: 1,
    world: { currentSystem: 'freehold' },
    cargo: [{ commodity: 'survivor', units: 1 }],
  });
  pin('legacy.survivor.loads', dest2.cargo.length === 1 && dest2.cargo[0]?.commodity === 'survivor');
  pin('legacy.survivor.source', dest2.cargo[0]?.source === 'other');
  pin('legacy.survivor.units', dest2.cargo[0]?.units === 1);
}

// Extra boundary pins: do not throw, drop empty survivors, refuse pollution.
{
  const dest = makeCtx();
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold' },
    cargo: [
      { commodity: 'survivor', units: 0, faction: 'freehold', source: 'other' },
      { commodity: 'survivor', units: 1, faction: 'redledger', source: 'other', name: `${'x'.repeat(80)}\u0001` },
      JSON.parse('{"commodity":"survivor","units":1,"faction":"hollow","source":"other","__proto__":{"polluted":true}}'),
    ],
  });
  pin('drop.zeroSurvivor', dest.cargo.every((r) => r.units > 0));
  const named = dest.cargo.find((r) => r.faction === 'redledger');
  pin('name.cap', named?.name === 'x'.repeat(40), `name=${named?.name}`);
  pin('proto.pollution', Object.prototype.polluted === undefined);
  pin('proto.noKey', dest.cargo.every((r) => !Object.prototype.hasOwnProperty.call(r, '__proto__') || r.__proto__ === Object.prototype));
}

if (fails.length) {
  console.log('FAIL');
  for (const f of fails) console.log('  ' + f);
  process.exitCode = 1;
} else {
  console.log('CLEAN');
}
