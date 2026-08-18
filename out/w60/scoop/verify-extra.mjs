// Extra verifier checks beyond official probe. Does not start Vite.
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
const drift = new THREE.Vector3(1, 0, 0);

ok('exports.fns', typeof isSurvivorCargo === 'function' && typeof survivorKey === 'function' && typeof spawnSurvivorPod === 'function');

// reserved faction: constructor / prototype
{
  const ctx = makeCtx();
  const a = spawnSurvivorPod(ctx, origin, { faction: 'constructor', source: 'other' });
  const b = spawnSurvivorPod(ctx, origin, { faction: 'prototype', source: 'other' });
  ok('spawn.reserved.constructor', a == null);
  ok('spawn.reserved.prototype', b == null);
  const cargo = [{ commodity: 'rawOre', units: 1 }];
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'constructor', source: 'other' }]);
  mergePodContents(cargo, [{ commodity: 'survivor', units: 1, faction: 'prototype', source: 'other' }]);
  ok('merge.reserved.skip', cargo.length === 1 && cargo[0].commodity === 'rawOre');
}

// ore still stacks with itself; tint 4-arg/5-arg
{
  const cargo = [{ commodity: 'rawOre', units: 3 }];
  mergePodContents(cargo, [{ commodity: 'rawOre', units: 2 }]);
  ok('ore.stack.rows', cargo.length === 1);
  ok('ore.stack.units', cargo[0].units === 5, String(cargo[0].units));
  ok('ore.stack.noFaction', cargo[0].faction === undefined);
}

{
  const ctx = makeCtx();
  const a = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin, drift);
  ok('spawnPod.4arg.drift', a && a.velocity.x === 1 && a.velocity.y === 0);
  ok('spawnPod.4arg.defaultTintName', a.mesh.name !== 'survivor-pod');
  const b = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin, drift, 0x8a7a68);
  ok('spawnPod.5arg.tintDiff', b.mesh.material !== a.mesh.material);
}

// live scoop: ore stacks, survivor does not land on ore
{
  const ctx = makeCtx();
  ctx.cargo.push({ commodity: 'rawOre', units: 4 });
  const sys = initPods(ctx);
  spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin);
  sys.update(0.016);
  ok('scoop.ore.stack', ctx.cargo.length === 1 && ctx.cargo[0].units === 5, JSON.stringify(ctx.cargo));
  spawnSurvivorPod(ctx, origin, { faction: 'freehold', source: 'other' });
  sys.update(0.016);
  ok('scoop.survivor.notOnOre', ctx.cargo.length === 2 && ctx.cargo[0].units === 5 && ctx.cargo[1].commodity === 'survivor');
}

// mixed contents in one pod
{
  const cargo = [{ commodity: 'rawOre', units: 1 }];
  mergePodContents(cargo, [
    { commodity: 'rawOre', units: 1 },
    { commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' },
  ]);
  ok('mixed.rows', cargo.length === 2, String(cargo.length));
  ok('mixed.ore', cargo[0].commodity === 'rawOre' && cargo[0].units === 2);
  ok('mixed.surv', isSurvivorCargo(cargo[1]) && cargo[1].faction === 'freehold');
}

// increment path must not copy hostile keys onto existing row
{
  const cargo = [{ commodity: 'survivor', units: 1, faction: 'freehold', source: 'other' }];
  const incoming = { commodity: 'survivor', units: 1, faction: 'freehold', source: 'other', pollutedKey: true };
  mergePodContents(cargo, [incoming]);
  ok('inc.units', cargo[0].units === 2);
  ok('inc.noHostile', cargo[0].pollutedKey !== true);
}

// existing ore increment must not pick up survivor fields
{
  const cargo = [{ commodity: 'rawOre', units: 1 }];
  mergePodContents(cargo, [{ commodity: 'rawOre', units: 2, faction: 'freehold', source: 'other', name: 'nope' }]);
  ok('inc.ore.units', cargo.length === 1 && cargo[0].units === 3);
  ok('inc.ore.noSurvFields', cargo[0].faction === undefined && cargo[0].name === undefined);
}

// spawnSurvivorPod shares geometry with spawnPod, different tint/name
{
  const ctx = makeCtx();
  const ore = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin);
  const surv = spawnSurvivorPod(ctx, origin, { faction: 'freehold', source: 'other' });
  ok('mesh.sameGeo', ore.mesh.geometry === surv.mesh.geometry);
  ok('mesh.survName', surv.mesh.name === 'survivor-pod');
  ok('mesh.survTintDiff', surv.mesh.material !== ore.mesh.material);
}

// merge undefined / null contents
{
  const cargo = [{ commodity: 'rawOre', units: 1 }];
  mergePodContents(cargo, null);
  mergePodContents(cargo, undefined);
  ok('merge.nullish', cargo.length === 1 && cargo[0].units === 1);
}

if (fails.length) {
  console.log(`FAIL ${fails.length} ${fails.join(', ')}`);
  process.exit(1);
}
console.log('CLEAN extra');
process.exit(0);
