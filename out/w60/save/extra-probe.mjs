// Extra verifier pins. Does not change src/.
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

// snapshot() itself (no JSON) must not keep mesh/attacker
{
  const live = makeCtx([{
    commodity: 'survivor', units: 1, faction: 'veridian', source: 'playerKill',
    name: 'Ada', attacker: { id: 1 }, mesh: { uuid: 'x', parent: {} },
  }]);
  live.ship = {
    object: {
      position: { toArray: () => [1, 2, 3] },
      quaternion: { toArray: () => [0, 0, 0, 1] },
    },
  };
  const snap = snapshot(live);
  const row = snap.cargo[0];
  pin('rawSnap.keys', Object.keys(row).sort().join(',') === 'commodity,faction,name,source,units', Object.keys(row).sort().join(','));
  pin('rawSnap.noMesh', !('mesh' in row) && !('attacker' in row));
  pin('rawSnap.ship.shape', snap.ship && Array.isArray(snap.ship.position) && Array.isArray(snap.ship.quaternion));
  pin('rawSnap.ship.noMesh', !('mesh' in snap.ship) && !('object' in snap.ship));
}

// snapshot does not mutate live cargo
{
  const liveRow = { commodity: 'survivor', units: 1, faction: 'hollow', source: 'other', mesh: { uuid: 1 } };
  const live = makeCtx();
  live.cargo = [liveRow];
  snapshot(live);
  pin('live.unmutated.mesh', live.cargo[0] === liveRow && live.cargo[0].mesh?.uuid === 1);
}

// restore must not throw on old / bad envelopes
{
  const dest = makeCtx([{ commodity: 'rawOre', units: 1 }]);
  let threw = false;
  try {
    restore(dest, null);
    restore(dest, undefined);
    restore(dest, {});
    restore(dest, { v: 1 });
    restore(dest, { v: 1, world: null });
    restore(dest, { v: 1, world: { currentSystem: 'freehold' } });
    restore(dest, { v: 1, world: { currentSystem: 'freehold' }, cargo: null });
    restore(dest, { v: 1, world: { currentSystem: 'freehold' }, cargo: 'nope' });
    restore(dest, { v: 1, world: { currentSystem: 'freehold' }, cargo: [null, 3, 'x', [], { units: 1 }] });
  } catch (e) {
    threw = true;
    fails.push(`oldSave.throw: ${e?.message || e}`);
  }
  pin('oldSave.noThrow', !threw);
}

// restore must not mutate the snap cargo object
{
  const snap = {
    v: 1,
    world: { currentSystem: 'freehold' },
    cargo: [{ commodity: 'survivor', units: 1, faction: 'veridian', source: 'playerKill', extra: 9 }],
  };
  const dest = makeCtx();
  restore(dest, snap);
  pin('snap.immutable.extra', snap.cargo[0].extra === 9);
  pin('dest.noExtra', dest.cargo[0] && !('extra' in dest.cargo[0]));
}

// name trim / empty omitted; units string accepted; hyphen faction dropped
{
  const dest = makeCtx();
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold' },
    cargo: [
      { commodity: 'survivor', units: '4', faction: 'gilded', source: 'playerKill', name: '  Nia  ' },
      { commodity: 'survivor', units: 1, faction: 'not-a-faction', source: 'other', name: '   ' },
      { commodity: 'survivor', units: 1, faction: 'independent', source: 'PLAYERKILL' },
    ],
  });
  pin('units.string', dest.cargo[0]?.units === 4);
  pin('name.trim', dest.cargo[0]?.name === 'Nia');
  pin('faction.hyphen.dropped', dest.cargo[1] && !('faction' in dest.cargo[1]));
  pin('name.empty.omitted', dest.cargo[1] && !('name' in dest.cargo[1]));
  pin('source.case.heals', dest.cargo[2]?.source === 'other');
}

// constructor / proto keys stay off the row
{
  const dest = makeCtx();
  const raw = { commodity: 'survivor', units: 1, faction: 'assembly', source: 'other' };
  Object.defineProperty(raw, 'constructor', { value: { polluted: true }, enumerable: true });
  restore(dest, { v: 1, world: { currentSystem: 'freehold' }, cargo: [raw] });
  pin('constructor.notCopied', dest.cargo[0]?.constructor === Object);
  pin('constructor.protoClean', Object.prototype.polluted === undefined);
}

// commodity too long dropped; 64 kept
{
  const dest = makeCtx();
  restore(dest, {
    v: 1,
    world: { currentSystem: 'freehold' },
    cargo: [
      { commodity: 'x'.repeat(65), units: 1 },
      { commodity: 'y'.repeat(64), units: 2 },
    ],
  });
  pin('commodity.tooLong.drop', dest.cargo.length === 1 && dest.cargo[0].commodity.length === 64);
}

if (fails.length) {
  console.log('FAIL');
  for (const f of fails) console.log('  ' + f);
  process.exitCode = 1;
} else {
  console.log('CLEAN');
}
