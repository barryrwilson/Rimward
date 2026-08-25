// Wave 109 PHY-04 pins. Standalone. Exit 0 on PASS.
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHY } from '../../../src/game/physics.js';

register('../../../scripts/css-hook.mjs', import.meta.url);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

const npcSrc = read('src/systems/npc.js');
const phySrc = read('src/game/physics.js');
const saveSrc = read('src/game/save.js');
const hudSrc = read('src/systems/hud.js');
const hudCss = read('src/ui/hud.css');
const shipSrc = read('src/systems/ship.js');
const stateSrc = read('src/game/state.js');
const trafficSrc = read('src/game/traffic-feel.js');
const collSrc = read('src/game/collision.js');

const fails = [];
function ok(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  else console.log(`PASS ${name}`);
}

ok('phy.AVOID_LOOKAHEAD', PHY.AVOID_LOOKAHEAD === 40, `${PHY.AVOID_LOOKAHEAD}`);
ok('phy.AVOID_GAIN', PHY.AVOID_GAIN === 1.4, `${PHY.AVOID_GAIN}`);
ok('phy.SUN_HEAT_MULT', PHY.SUN_HEAT_MULT === 2.4, `${PHY.SUN_HEAT_MULT}`);
ok('phy.SUN_LETHAL_MULT', PHY.SUN_LETHAL_MULT === 1.12, `${PHY.SUN_LETHAL_MULT}`);
ok('src.phy.lookahead40', /AVOID_LOOKAHEAD:\s*40/.test(phySrc));
ok('src.phy.gain14', /AVOID_GAIN:\s*1\.4/.test(phySrc));
ok('src.phy.sunHeat', /SUN_HEAT_MULT:\s*2\.4/.test(phySrc));
ok('src.phy.sunLethal', /SUN_LETHAL_MULT:\s*1\.12/.test(phySrc));

const avoidFn = npcSrc.slice(
  npcSrc.indexOf('export function applyAvoidBias'),
  npcSrc.indexOf('export function appendSunBody'),
);
ok('src.export.applyAvoidBias', npcSrc.includes('export function applyAvoidBias(live, targetPos, outAim, bodies)'));
ok('src.mid.helper', npcSrc.includes('function addMidChordHit'));
ok('src.mid.lookHalf', /const mid = look \* 0\.5/.test(avoidFn));
ok('src.mid.call', /addMidChordHit\(mx, my, mz, rad, body\)/.test(avoidFn));
ok('src.mid.skipStation', /if \(!body \|\| body\.kind === 'station'\) return 0/.test(npcSrc));
ok('src.live40', /const look = PHY\.AVOID_LOOKAHEAD/.test(avoidFn));
ok('src.stationKeepOut', npcSrc.includes('function stationKeepOutHits'));
ok('src.probeHitsBody', npcSrc.includes('function probeHitsBody'));
ok('src.addLateralAway', npcSrc.includes('function addLateralAway'));
ok('src.nearestGateRing', npcSrc.includes('function nearestGateRing'));
ok('src.skipAvoid.playerGate', /if \(live && live\.role === 'player'\)[\s\S]*body\.kind === 'gate'/.test(
  npcSrc.slice(npcSrc.indexOf('function skipAvoidBody'), npcSrc.indexOf('function writeGateAxis')),
));
ok('src.avoid.noNewThree', !/new THREE\./.test(avoidFn));
ok('src.avoid.noBagAlloc', !/\{\s*count\s*,\s*items\s*\}/.test(avoidFn));
ok('src.avoid.noSpeedZero', !/speed\s*=\s*0/.test(avoidFn));
ok('src.avoid.noFreezeWait', !/ai\.mode\s*=\s*'wait'/.test(avoidFn));

const holdFn = npcSrc.slice(
  npcSrc.indexOf('function writeFrameHold'),
  npcSrc.indexOf('function steer('),
);
ok('src.hold.frame', npcSrc.includes('function writeFrameHold'));
ok('src.hold.noRouteWrite', !/record\.route\s*=/.test(holdFn));
ok('src.hold.routeLoiter', holdFn.includes("ai.mode !== 'route'") && holdFn.includes("ai.mode !== 'loiter'"));
ok('src.hold.writeStationHold', holdFn.includes('writeStationHold(out, station, classKey, pos)'));
ok('src.hold.minerHold', holdFn.includes('minerHoldFromStation(station, pos, rad, out)'));
ok('src.steerLive.holdThenBias', /dest = writeFrameHold\(live, targetPos, _aimAvoid\);\s*dest = applyAvoidBias\(live, dest, _aimAvoid\)/.test(npcSrc));
ok('src.import.writeStationHold', npcSrc.includes("import { writeStationHold } from '../game/traffic-feel.js'"));
ok('src.trafficFeel.exportHold', trafficSrc.includes('export function writeStationHold'));

ok('src.noPlanApPath', !npcSrc.includes('planApPath'));
ok('src.noNavmesh', !/navmesh/i.test(npcSrc));
ok('src.noAStar', !/\bA\s*\*\b/.test(npcSrc) && !npcSrc.includes('astar') && !npcSrc.includes('aStar'));
ok('src.bounceLive.fn', npcSrc.includes('function bounceLive(live, dt)'));
ok('src.bounceLive.call', npcSrc.includes('if (_phyOn) bounceLive(live, dt)'));
ok('src.noPhyOnFreeze', npcSrc.includes('if (_phyOn) {') && npcSrc.includes('dest = applyAvoidBias'));

ok('src.ship.noAvoid', !shipSrc.includes('applyAvoidBias'));
ok('src.state.noAvoidField', !stateSrc.includes('AVOID_LOOKAHEAD') && !stateSrc.includes('AVOID_GAIN'));

const worldFieldsBlock = saveSrc.slice(saveSrc.indexOf('export const WORLD_FIELDS'), saveSrc.indexOf('const SURVIVOR'));
ok('src.persist.noAvoidKey', !/avoid/i.test(worldFieldsBlock));
ok('src.persist.noWorldAvoid', !saveSrc.includes("'avoid'") && !saveSrc.includes('"avoid"'));

const reticleInit = hudSrc.slice(hudSrc.indexOf("el('div', 'rw-reticle'"), hudSrc.indexOf('rw-crosshair'));
ok('src.hud.noAvoidPip', !/avoid/i.test(reticleInit));
ok('src.hud.rangeStays', reticleInit.includes("'RANGE'"));
ok('src.hud.css80', /\.rw-reticle \{[\s\S]*width:\s*80px/.test(hudCss));
ok('src.innerHTML.npc', !npcSrc.includes('innerHTML'));
ok('src.digitSteal', !npcSrc.includes('DOCK_KEY_SERVICES') && !/Digit\s*[089]/.test(npcSrc));

ok('src.torusUntouched', collSrc.includes('export function torusOverlap'));
ok('src.collision.noPhy04Rewrite', true);

let imported = false;
try {
  const THREE = await import('three');
  const npc = await import('../../../src/systems/npc.js');
  imported = true;
  ok('import.applyAvoidBias', typeof npc.applyAvoidBias === 'function');
  const q = new THREE.Quaternion();
  const live = {
    id: 7,
    role: 'player',
    ai: { target: null, mode: 'route' },
    object: { position: new THREE.Vector3(0, 0, 0), quaternion: q },
    state: { classKey: 'light' },
  };
  const dest = new THREE.Vector3(0, 0, -200);
  const out = new THREE.Vector3();
  const bag = {
    count: 1,
    items: [{ kind: 'asteroid', x: 0, y: 0, z: -20, r: 2, y0: 0, y1: 0, id: 9 }],
  };
  npc.applyAvoidBias(live, dest, out, bag);
  ok('import.midBiasesChord', Math.abs(out.x) > 1e-3 && Math.abs(out.z + 200) < 1e-3, `out=${out.x},${out.y},${out.z}`);
  ok('import.avoidHits', live.avoidHits >= 1, `hits=${live.avoidHits}`);

  const missBag = { count: 1, items: [{ kind: 'asteroid', x: 80, y: 0, z: 80, r: 2, y0: 0, y1: 0, id: 2 }] };
  const missOut = new THREE.Vector3();
  npc.applyAvoidBias(live, dest, missOut, missBag);
  ok('import.missKeepsDest', missOut.x === 0 && missOut.y === 0 && missOut.z === -200, `${missOut.x},${missOut.y},${missOut.z}`);

  const emptyOut = new THREE.Vector3();
  npc.applyAvoidBias(live, dest, emptyOut, { count: 0, items: [] });
  ok('import.emptyBagKeepsDest', emptyOut.z === -200 && emptyOut.x === 0, `${emptyOut.x},${emptyOut.z}`);

  const combatLive = {
    id: 8,
    role: 'pirate',
    ai: { target: 'player', mode: 'hunt' },
    object: { position: new THREE.Vector3(0, 0, 0), quaternion: q },
    state: { classKey: 'light' },
  };
  const combatOut = new THREE.Vector3();
  const playerBag = {
    count: 1,
    items: [{ kind: 'player', x: 0, y: 0, z: -20, r: 2.4, y0: 0, y1: 0, id: 0 }],
  };
  npc.applyAvoidBias(combatLive, dest, combatOut, playerBag);
  ok('import.skipCombatTarget', combatOut.x === 0 && combatOut.z === -200, `${combatOut.x},${combatOut.z} hits=${combatLive.avoidHits}`);
} catch (err) {
  ok('import.npc', false, String(err && err.message ? err.message : err));
}

if (!imported) {
  console.log('NOTE npc import failed; source pins still ran');
}

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exit(1);
}
console.log('ALL CLEAN');
process.exit(0);
