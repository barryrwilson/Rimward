// Wave 60 POD scoop: survivor cargo contract. Imports pods.js. Does not start Vite.
import * as THREE from 'three';
import {
  isSurvivorCargo,
  survivorKey,
  mergePodContents,
  spawnPod,
  spawnSurvivorPod,
  initPods,
} from '../../../src/game/pods.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

function makeCtx() {
  const events = [];
  return {
    scene: { add() {}, remove() {} },
    pods: [],
    cargo: [],
    cargoCapacity: 20,
    flags: { docked: false },
    world: { time: 0 },
    ship: { object: { position: new THREE.Vector3(0, 0, 0) } },
    emit(type, payload) { events.push({ type, payload }); },
    events,
  };
}

const origin = new THREE.Vector3(0, 0, 0);

ok('helper.ore', isSurvivorCargo({ commodity: 'rawOre', units: 3 }) === false);
ok('helper.survivor', isSurvivorCargo({ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }) === true);
ok('helper.null', isSurvivorCargo(null) === false);
ok('helper.key.ore', survivorKey({ commodity: 'rawOre', units: 1 }) === null);
ok(
  'helper.key.pair',
  survivorKey({ commodity: 'survivor', units: 1, faction: 'freehold', source: 'playerKill' }) === 'freehold:playerKill',
);

// --- merge: same faction+source ---
{
  const cargo = [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }]);
  ok('merge.same.rows', cargo.length === 1, String(cargo.length));
  ok('merge.same.units', cargo[0].units === 2, String(cargo[0].units));
}

// --- no-merge different faction ---
{
  const cargo = [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'veridian', source: 'other' }]);
  ok('merge.diffFaction.rows', cargo.length === 2, String(cargo.length));
  ok('merge.diffFaction.units', cargo[0].units === 1 && cargo[1].units === 1);
}

// --- no-merge different source ---
{
  const cargo = [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'playerKill' }]);
  ok('merge.diffSource.rows', cargo.length === 2, String(cargo.length));
  ok('merge.diffSource.kept', cargo[0].source === 'other' && cargo[1].source === 'playerKill');
}

// --- invalid source normalizes to other and stacks with other ---
{
  const cargo = [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'bogus' }]);
  ok('merge.bogusSource.rows', cargo.length === 1, String(cargo.length));
  ok('merge.bogusSource.units', cargo[0].units === 2 && cargo[0].source === 'other');
}

// --- invalid faction on incoming survivor is not scooped ---
{
  const cargo = [{ commodity: 'rawOre', units: 1 }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: '', source: 'other' }]);
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: '__proto__', source: 'other' }]);
  ok('merge.badFaction.skip', cargo.length === 1 && cargo[0].commodity === 'rawOre', String(cargo.length));
}

// --- survivor must not stack onto ore ---
{
  const cargo = [{ commodity: 'rawOre', units: 5 }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }]);
  ok('merge.noOre.rows', cargo.length === 2, String(cargo.length));
  ok('merge.noOre.oreUnits', cargo[0].commodity === 'rawOre' && cargo[0].units === 5);
  ok('merge.noOre.survivor', isSurvivorCargo(cargo[1]) && cargo[1].units === 1);
}

// --- empty contents scoop adds 0 ---
{
  const cargo = [{ commodity: 'rawOre', units: 2 }];
  mergePodContents(cargo, []);
  ok('merge.empty.noop', cargo.length === 1 && cargo[0].units === 2);
}

{
  const ctx = makeCtx();
  ctx.cargo.push({ commodity: 'rawOre', units: 2 });
  const sys = initPods(ctx);
  const before = ctx.cargo.length;
  const unitsBefore = ctx.cargo[0].units;
  spawnPod(ctx, [], origin);
  ok('empty.spawned', ctx.pods.length === 1);
  sys.update(0.016);
  ok('empty.scooped', ctx.pods.length === 0);
  ok('empty.adds0.rows', ctx.cargo.length === before, String(ctx.cargo.length));
  ok('empty.adds0.units', ctx.cargo[0].units === unitsBefore, String(ctx.cargo[0].units));
  ok('empty.collected', ctx.events.some((e) => e.type === 'podCollected'));
}

// --- spawnSurvivorPod mesh.name + contents shape ---
{
  const ctx = makeCtx();
  const pod = spawnSurvivorPod(ctx, origin, { faction: 'freehold', source: 'playerKill', name: 'Marrow' });
  ok('spawn.returned', !!pod);
  ok('spawn.meshName', pod && pod.mesh && pod.mesh.name === 'survivor-pod', pod && pod.mesh && pod.mesh.name);
  const row = pod && pod.contents && pod.contents[0];
  ok(
    'spawn.contents',
    !!row
      && row.commodity === 'survivor'
      && row.units === 1
      && row.faction === 'freehold'
      && row.source === 'playerKill'
      && row.name === 'Marrow',
    JSON.stringify(row),
  );
  ok('spawn.event', ctx.events.some((e) => e.type === 'podSpawned' && e.payload.pod === pod));
  ok('spawn.event.name', ctx.events.some((e) => e.type === 'podSpawned' && e.payload.pod.mesh.name === 'survivor-pod'));
  ok('spawn.plain', JSON.parse(JSON.stringify(row)).commodity === 'survivor');
}

{
  const ctx = makeCtx();
  const pod = spawnSurvivorPod(ctx, origin, { faction: 'freehold', source: 'bogus' });
  ok('spawn.sourceFallback', pod && pod.contents[0].source === 'other', pod && pod.contents[0].source);
}

// --- invalid faction does not spawn ---
{
  const ctx = makeCtx();
  const a = spawnSurvivorPod(ctx, origin, { faction: '', source: 'other' });
  const b = spawnSurvivorPod(ctx, origin, { source: 'other' });
  const c = spawnSurvivorPod(ctx, origin, { faction: '__proto__', source: 'other' });
  const d = spawnSurvivorPod(ctx, origin, null);
  ok('spawn.invalid.empty', a == null);
  ok('spawn.invalid.missing', b == null);
  ok('spawn.invalid.proto', c == null);
  ok('spawn.invalid.nullSpec', d == null);
  ok('spawn.invalid.noPods', ctx.pods.length === 0, String(ctx.pods.length));
  ok('spawn.invalid.noEvent', ctx.events.length === 0);
}

// --- live scoop merge via initPods ---
{
  const ctx = makeCtx();
  ctx.cargo.push({ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' });
  const sys = initPods(ctx);
  spawnSurvivorPod(ctx, origin, { faction: 'freehold', source: 'other' });
  sys.update(0.016);
  ok('scoop.same.rows', ctx.cargo.length === 1, String(ctx.cargo.length));
  ok('scoop.same.units', ctx.cargo[0].units === 2, String(ctx.cargo[0].units));
}

{
  const ctx = makeCtx();
  ctx.cargo.push({ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' });
  const sys = initPods(ctx);
  spawnSurvivorPod(ctx, origin, { faction: 'gilded', source: 'other' });
  sys.update(0.016);
  ok('scoop.diffFaction.rows', ctx.cargo.length === 2, String(ctx.cargo.length));
}

{
  const ctx = makeCtx();
  ctx.cargo.push({ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' });
  const sys = initPods(ctx);
  spawnSurvivorPod(ctx, origin, { faction: 'freehold', source: 'playerKill' });
  sys.update(0.016);
  ok('scoop.diffSource.rows', ctx.cargo.length === 2, String(ctx.cargo.length));
}

// copy must not spread attacker-owned keys
{
  const cargo = [];
  const incoming = { commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' };
  Object.defineProperty(incoming, '__proto__', { value: { polluted: true }, enumerable: true });
  incoming.pollutedKey = true;
  mergePodContents(cargo, [incoming]);
  ok('copy.noExtra', cargo[0] && cargo[0].pollutedKey !== true);
  ok('copy.noProtoOwn', cargo[0] && !Object.prototype.hasOwnProperty.call(cargo[0], '__proto__'));
  ok('copy.noPollution', Object.prototype.polluted !== true);
}

// spawnPod 4-arg / 5-arg stay valid
{
  const ctx = makeCtx();
  const a = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin);
  const b = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin, null, 0x8a7a68);
  ok('spawnPod.4arg', a && a.contents[0].commodity === 'rawOre' && a.mesh.name !== 'survivor-pod');
  ok('spawnPod.5arg', b && b.mesh.material !== a.mesh.material);
}

if (fails.length) {
  console.log(`FAIL ${fails.length} ${fails.join(', ')}`);
  process.exit(1);
}
console.log('CLEAN');
process.exit(0);
