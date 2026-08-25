// Verifier extras for PHY-04. Does not edit src/. Exit 0 on PASS.
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { PHY } from '../../../../src/game/physics.js';
import { writeStationHold } from '../../../../src/game/traffic-feel.js';

register('../../../../scripts/css-hook.mjs', import.meta.url);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../');
const npcSrc = readFileSync(resolve(root, 'src/systems/npc.js'), 'utf8');
const shipSrc = readFileSync(resolve(root, 'src/systems/ship.js'), 'utf8');
const saveSrc = readFileSync(resolve(root, 'src/game/save.js'), 'utf8');

const fails = [];
function ok(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  else console.log(`PASS ${name}`);
}

ok('static.planApPath.zero', (npcSrc.match(/planApPath/g) || []).length === 0);
ok('static.navmesh.zero', !/navmesh/i.test(npcSrc));
ok('static.bounceLive.called', npcSrc.includes('if (_phyOn) bounceLive(live, dt)'));
ok('static.applyAvoidBias.export', npcSrc.includes('export function applyAvoidBias'));
ok('static.noRecordRouteWrite', !/record\.route\s*=/.test(npcSrc));
ok('static.noSpeedZeroInAvoid', !/speed\s*=\s*0/.test(
  npcSrc.slice(npcSrc.indexOf('export function applyAvoidBias'), npcSrc.indexOf('export function appendSunBody')),
));
ok('static.noSpeedZeroInHold', !/speed\s*=\s*0/.test(
  npcSrc.slice(npcSrc.indexOf('function writeFrameHold'), npcSrc.indexOf('function steer(')),
));
ok('static.noBagLiteralInAvoid', !/\{\s*count\s*:\s*0\s*,\s*items\s*:\s*\[/.test(
  npcSrc.slice(npcSrc.indexOf('export function applyAvoidBias'), npcSrc.indexOf('export function appendSunBody')),
));
ok('static.oneModuleBag', (npcSrc.match(/const _bodies = \{ count: 0, items: \[\] \}/g) || []).length === 1);
ok('static.collectOnce', npcSrc.includes('collectBodies(ctx, _bodies)'));
ok('static.playerFltNoAvoid', !shipSrc.includes('applyAvoidBias'));
ok('static.sunHeat', PHY.SUN_HEAT_MULT === 2.4 && /SUN_HEAT_MULT:\s*2\.4/.test(
  readFileSync(resolve(root, 'src/game/physics.js'), 'utf8'),
));
ok('static.sunLethal', PHY.SUN_LETHAL_MULT === 1.12);
ok('static.digitSteal', !npcSrc.includes('DOCK_KEY_SERVICES') && !/Digit\s*[089]/.test(npcSrc));
ok('static.persistAvoid', !saveSrc.includes("'avoid'") && !saveSrc.includes('"avoid"'));
ok('static.holdHuntSkip', npcSrc.includes("ai.mode !== 'route'") && npcSrc.includes("ai.mode !== 'loiter'"));
ok('static.holdPlayerSkip', /function writeFrameHold[\s\S]*live\.role === 'player'[\s\S]*function steer\(/.test(npcSrc));

const { applyAvoidBias, minerHoldFromStation } = await import('../../../../src/systems/npc.js');
const q = new THREE.Quaternion();
function makeLive(role, mode, target) {
  return {
    id: 7,
    role,
    ai: { target, mode },
    object: { position: new THREE.Vector3(0, 0, 0), quaternion: q },
    state: { classKey: 'light' },
  };
}

const dest = new THREE.Vector3(0, 0, -200);
const out = new THREE.Vector3();

const live = makeLive('trader', 'route', null);
const destCopy = dest.clone();
applyAvoidBias(live, dest, out, {
  count: 1,
  items: [{ kind: 'asteroid', x: 0, y: 0, z: -20, r: 2, y0: 0, y1: 0, id: 9 }],
});
ok('behav.midOnlyBiases', Math.abs(out.x) > 1e-3 && Math.abs(out.z + 200) < 1e-3, `${out.x},${out.z}`);
ok('behav.destNotMutated', dest.x === destCopy.x && dest.y === destCopy.y && dest.z === destCopy.z);
ok('behav.speedUntouched', live.state && true);

const farOut = new THREE.Vector3();
applyAvoidBias(live, dest, farOut, {
  count: 1,
  items: [{ kind: 'asteroid', x: 0, y: 0, z: -40, r: 2, y0: 0, y1: 0, id: 8 }],
});
ok('behav.far40StillBiases', Math.abs(farOut.x) > 1e-3, `${farOut.x},${farOut.z}`);

const stOut = new THREE.Vector3();
const stLive = makeLive('trader', 'route', null);
applyAvoidBias(stLive, dest, stOut, {
  count: 1,
  items: [{
    kind: 'station', x: 0, y: 0, z: -20, r: 8,
    y0: PHY.STATION_CYL_Y0, y1: PHY.STATION_CYL_Y1, id: 0,
  }],
});
ok('behav.stationPathKeepOut', stLive.avoidHits === 1, `hits=${stLive.avoidHits} out=${stOut.x},${stOut.z}`);

const bothOut = new THREE.Vector3();
const bothLive = makeLive('trader', 'route', null);
applyAvoidBias(bothLive, dest, bothOut, {
  count: 1,
  items: [{ kind: 'asteroid', x: 0, y: 0, z: -30, r: 25, y0: 0, y1: 0, id: 3 }],
});
ok('behav.bothSamplesCount', bothLive.avoidHits >= 2, `hits=${bothLive.avoidHits}`);

const emptyOut = new THREE.Vector3();
applyAvoidBias(live, dest, emptyOut, { count: 0, items: [] });
ok('behav.emptyBagKeepsDest', emptyOut.z === -200 && emptyOut.x === 0);
ok('behav.emptyNoFreezeField', live.ai.mode === 'route');

const pirate = makeLive('pirate', 'hunt', 'player');
const pirateOut = new THREE.Vector3();
applyAvoidBias(pirate, dest, pirateOut, {
  count: 1,
  items: [{ kind: 'player', x: 0, y: 0, z: -20, r: 2.4, y0: 0, y1: 0, id: -1 }],
});
ok('behav.pirateKeepsPlayerAim', pirateOut.x === 0 && pirateOut.z === -200, `${pirateOut.x},${pirateOut.z}`);

const player = makeLive('player', 'route', null);
const playerOut = new THREE.Vector3();
applyAvoidBias(player, dest, playerOut, {
  count: 1,
  items: [{ kind: 'gate', x: 0, y: 0, z: -20, r: PHY.GATE_BORE, y0: PHY.GATE_TUBE, y1: 0, id: 0 }],
});
ok('behav.playerSkipGate', playerOut.x === 0 && playerOut.z === -200, `${playerOut.x},${playerOut.z}`);

const hold = { x: 0, y: 0, z: 0 };
writeStationHold(hold, { x: 0, y: 0, z: 0 }, 'freighter', { x: 80, y: 0, z: 0 });
const holdR = Math.hypot(hold.x, hold.z);
ok('behav.writeStationHoldOutside', holdR > PHY.STATION_CYL_RADIUS + 1, `r=${holdR}`);

const minerHold = new THREE.Vector3();
minerHoldFromStation({ x: 0, y: 0, z: 0 }, { x: 90, y: 0, z: 0 }, 5, minerHold);
const minerR = Math.hypot(minerHold.x, minerHold.z);
ok('behav.minerHoldOutside', minerR > PHY.STATION_CYL_RADIUS + 1, `r=${minerR}`);
ok('behav.minerNotPad', minerR > 10, `r=${minerR}`);

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exit(1);
}
console.log('EXTRA CLEAN');
process.exit(0);
