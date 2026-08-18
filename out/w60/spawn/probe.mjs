// Wave 60 slice B: survivor spawn on crewPods / destroy.
// Run: node --import ./scripts/with-css-stub.mjs out/w60/spawn/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { lastAttackerOf, spawnShipSurvivor, spillShipCargo } from '../../../src/systems/npc.js';

const here = dirname(fileURLToPath(import.meta.url));
const npcPath = resolve(here, '../../../src/systems/npc.js');
const npcSrc = readFileSync(npcPath, 'utf8');
const fails = [];

function ok(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  else console.log(`CLEAN ${name}`);
}

function makeCtx() {
  return {
    scene: { add() {} },
    pods: [],
    world: { time: 10 },
    emit() {},
  };
}

function liveOf({ faction = 'freehold', name = 'Tess', lastAttacker = 'player', cargo = [], role = 'trader' } = {}) {
  return {
    role,
    record: { faction, name, role },
    state: { faction, name, cargo: cargo.map((c) => ({ ...c })), destroyed: false },
    object: { position: new THREE.Vector3(4, 1, -2) },
    ai: { lastAttacker, survivorsSpawned: false },
  };
}

function survivorEntries(ctx) {
  const out = [];
  for (const pod of ctx.pods) {
    const list = pod.contents || [];
    for (const e of list) {
      if (e && e.commodity === 'survivor') out.push({ pod, entry: e });
    }
  }
  return out;
}

// --- source wiring ---
ok('src.crewPods.oneCall', /if \(crewPods\) spawnShipSurvivor\(ctx, live\)/.test(npcSrc));
ok('src.noEmptyFlavorLoop', !/for \(let k = 0; k < 2; k\+\+\)/.test(npcSrc));
ok('src.noEmptyCrewPod', !/spawnPod\(ctx, \[\],/.test(npcSrc));
ok('src.destroyAfterSpill', /spillShipCargo\(ctx, live\);\s*\n\s*spawnShipSurvivor\(ctx, live\);/.test(npcSrc));
ok('src.playerKillRule', /lastAttackerOf\(live\) === 'player' \? 'playerKill' : 'other'/.test(npcSrc));
ok('src.unknowablesSkip', /faction === 'unknowables'/.test(npcSrc));
ok('src.prefersWorkerA', /spawnSurvivorPod\(ctx, _v1, spec, drift\)/.test(npcSrc));
ok('src.worldNoSecondAftermath', !/stageAftermath/.test(npcSrc));

// --- lastAttacker source ---
ok('src.lastAttacker.player', lastAttackerOf({ ai: { lastAttacker: 'player' } }) === 'player');
ok('src.lastAttacker.npcToken', lastAttackerOf({ ai: { lastAttacker: 'npc' } }) === 'npc');
const otherLive = { state: { destroyed: false } };
ok('src.lastAttacker.otherLive', lastAttackerOf({ ai: { lastAttacker: otherLive } }) === otherLive);

// --- crewPods / playerKill ---
{
  const ctx = makeCtx();
  const live = liveOf({ lastAttacker: 'player', faction: 'ferrous', name: 'Mara' });
  const before = ctx.pods.length;
  const pod = spawnShipSurvivor(ctx, live);
  const hits = survivorEntries(ctx);
  ok('crew.onePod', ctx.pods.length === before + 1 && hits.length === 1, `n=${ctx.pods.length} surv=${hits.length}`);
  const e = hits[0] && hits[0].entry;
  ok('crew.shape', !!(e && e.commodity === 'survivor' && e.units === 1));
  ok('crew.faction', e && e.faction === 'ferrous');
  ok('crew.source.playerKill', e && e.source === 'playerKill');
  ok('crew.name', e && e.name === 'Mara');
  ok('crew.meshName', pod && pod.mesh && pod.mesh.name === 'survivor-pod');
  const again = spawnShipSurvivor(ctx, live);
  ok('crew.noDouble', again == null && ctx.pods.length === before + 1);
}

// --- npc / other ---
{
  const ctx = makeCtx();
  const pirate = { state: { destroyed: false } };
  const live = liveOf({ lastAttacker: pirate, faction: 'veridian', name: 'Holt', role: 'miner' });
  spawnShipSurvivor(ctx, live);
  const e = survivorEntries(ctx)[0]?.entry;
  ok('other.live.source', e && e.source === 'other', `source=${e && e.source}`);
  ok('other.live.faction', e && e.faction === 'veridian');
}
{
  const ctx = makeCtx();
  const live = liveOf({ lastAttacker: 'npc', faction: 'redledger', role: 'patrol' });
  spawnShipSurvivor(ctx, live);
  const e = survivorEntries(ctx)[0]?.entry;
  ok('other.npc.source', e && e.source === 'other');
}
{
  const ctx = makeCtx();
  const live = liveOf({ lastAttacker: null, faction: 'gilded', role: 'ace' });
  spawnShipSurvivor(ctx, live);
  const e = survivorEntries(ctx)[0]?.entry;
  ok('other.null.source', e && e.source === 'other');
}

// --- unknowables skip ---
{
  const ctx = makeCtx();
  const live = liveOf({ faction: 'unknowables', lastAttacker: 'player' });
  const pod = spawnShipSurvivor(ctx, live);
  ok('unk.skip', pod == null && ctx.pods.length === 0 && survivorEntries(ctx).length === 0);
}

// --- no faction (dead wreck record) skip ---
{
  const ctx = makeCtx();
  const live = {
    record: {},
    state: {},
    object: { position: new THREE.Vector3() },
    ai: { lastAttacker: 'player', survivorsSpawned: false },
  };
  const pod = spawnShipSurvivor(ctx, live);
  ok('wreck.noFaction.skip', pod == null && ctx.pods.length === 0);
}

// --- cargo spill stays cargo ---
{
  const ctx = makeCtx();
  const live = liveOf({
    lastAttacker: 'player',
    cargo: [{ commodity: 'refinedMetals', units: 3 }, { commodity: 'rawOre', units: 2 }],
  });
  const n = spillShipCargo(ctx, live);
  const cargoPods = ctx.pods.filter((p) => (p.contents || []).every((e) => e.commodity !== 'survivor'));
  const surv = survivorEntries(ctx);
  ok('cargo.spillCount', n === 2 && cargoPods.length === 2, `n=${n} cargo=${cargoPods.length}`);
  ok('cargo.notSurvivors', surv.length === 0);
  ok('cargo.contents', cargoPods[0].contents[0].commodity === 'refinedMetals' && cargoPods[0].contents[0].units === 3);
  ok('cargo.holdEmpty', live.state.cargo.length === 0);
  spawnShipSurvivor(ctx, live);
  ok('cargo.thenOneSurvivor', survivorEntries(ctx).length === 1 && ctx.pods.length === 3);
  ok('cargo.stillCargo', ctx.pods.filter((p) => p.contents?.[0]?.commodity === 'refinedMetals').length === 1);
}

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exit(1);
}
console.log('ALL CLEAN');
