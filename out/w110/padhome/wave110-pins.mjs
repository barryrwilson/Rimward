// Isolate WAVE110 boot pins without the full harness.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SYSTEMS } from '../../../src/game/state.js';
import { healPadHome as heal110, tickBank as tick110, initWorld } from '../../../src/game/world.js';
import {
  hullRadiusFor as hull110, STATION_HOLD_PAD as pad110, writeStationHold as hold110,
} from '../../../src/game/traffic-feel.js';
import { PHY } from '../../../src/game/physics.js';

const here110 = dirname(fileURLToPath(import.meta.url));
const root = join(here110, '../../..');
const src110 = (rel) => readFileSync(join(root, rel), 'utf8');
const world110 = src110('src/game/world.js');
const save110 = src110('src/game/save.js');
const st110 = src110('src/systems/station.js');
const hud110 = src110('src/systems/hud.js');
const hudCss110 = src110('src/ui/hud.css');
const stPos110 = SYSTEMS.freehold.station.position;
const gp110 = SYSTEMS.freehold.gates[0].position;
const station110 = { x: stPos110[0], y: stPos110[1], z: stPos110[2] };
const gate110 = { x: gp110[0], y: gp110[1], z: gp110[2] };
const padPt110 = { x: station110.x, y: station110.y, z: station110.z };
const holdMin110 = PHY.STATION_CYL_RADIUS + hull110('heavy') + pad110;
const expected110 = hold110({ x: 0, y: 0, z: 0 }, station110, 'heavy', gate110);
const expectedXZ110 = Math.hypot(expected110.x - station110.x, expected110.z - station110.z);
const authorStr110 = "route: [writeStationHold(new THREE.Vector3(), station, 'heavy', gate), jitter(gate.clone(), 50), jitter(planet.clone(), 60)]";
const oldPadStr110 = 'route: [station.clone(), jitter(gate.clone(), 50), jitter(planet.clone(), 60)]';
const ctx = {
  world: { records: [], recordBanks: {}, currentSystem: 'freehold', time: 0 },
  systems: SYSTEMS,
  emit() {},
};
initWorld(ctx);
const livePatrols110 = [];
const banks110 = ctx.world.recordBanks ?? {};
for (const sysId of Object.keys(banks110)) {
  if (!Object.hasOwn(banks110, sysId)) continue;
  const bank = banks110[sysId];
  if (!Array.isArray(bank)) continue;
  for (let i = 0; i < bank.length; i++) {
    const rec = bank[i];
    if (rec && rec.role === 'patrol') livePatrols110.push(rec);
  }
}
const live110 = livePatrols110.find((r) => r.system === 'freehold') ?? livePatrols110[0];
const liveWp0110 = live110 && live110.route && live110.route[0];
const liveSys110 = live110 && live110.system && Object.hasOwn(SYSTEMS, live110.system)
  ? SYSTEMS[live110.system]
  : SYSTEMS.freehold;
const liveSt110 = liveSys110.station.position;
const liveSx110 = Number.isFinite(liveSt110.x) ? liveSt110.x : liveSt110[0];
const liveSz110 = Number.isFinite(liveSt110.z) ? liveSt110.z : liveSt110[2];
const liveXZ110 = liveWp0110
  ? Math.hypot(liveWp0110.x - liveSx110, liveWp0110.z - liveSz110)
  : 0;
const oldPatrol110 = {
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  speed: 90,
  route: [{ ...padPt110 }, { ...gate110 }, { x: gate110.x + 10, y: gate110.y, z: gate110.z }],
};
heal110(oldPatrol110);
const healedXZ110 = Math.hypot(oldPatrol110.route[0].x - station110.x, oldPatrol110.route[0].z - station110.z);
const good110 = { x: oldPatrol110.route[0].x, y: oldPatrol110.route[0].y, z: oldPatrol110.route[0].z };
const again110 = heal110({
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  route: [{ ...good110 }, { ...gate110 }, { x: gate110.x + 10, y: gate110.y, z: gate110.z }],
});
const trader110 = heal110({
  role: 'trader',
  classKey: 'light',
  system: 'freehold',
  route: [{ ...padPt110 }, { ...gate110 }],
});
const miner110 = heal110({
  role: 'miner',
  classKey: 'light',
  system: 'freehold',
  route: [{ ...padPt110 }, { ...gate110 }],
});
const pirate110 = {
  role: 'pirate',
  classKey: 'cutter',
  system: 'freehold',
  route: [{ ...padPt110 }, { ...gate110 }],
};
const ace110 = {
  role: 'ace',
  classKey: 'ace',
  system: 'freehold',
  route: [{ ...padPt110 }, { ...gate110 }],
};
heal110(pirate110);
heal110(ace110);
let nanThrew110 = false;
const nan110 = { role: 'patrol', classKey: 'heavy', system: 'nope', speed: 77, route: [{ x: NaN, y: 0, z: 0 }] };
const unk110 = { role: 'patrol', classKey: 'heavy', system: 'nope', speed: 88, route: [{ ...padPt110 }, { ...gate110 }] };
const copyUnk110 = JSON.stringify(unk110);
try {
  heal110(nan110);
  heal110(unk110);
} catch {
  nanThrew110 = true;
}
const tickRec110 = {
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  state: 'enroute',
  speed: 90,
  dir: 1,
  leg: 0,
  legT: 0,
  dwellUntil: 1,
  route: [{ ...padPt110 }, { ...gate110 }, { x: gate110.x + 10, y: gate110.y, z: gate110.z }],
};
tick110([tickRec110], 'freehold', { world: { time: 0, activeEvent: null } });
const tickXZ110 = Math.hypot(tickRec110.route[0].x - station110.x, tickRec110.route[0].z - station110.z);
const traderXZ110 = Math.hypot(trader110.route[0].x - station110.x, trader110.route[0].z - station110.z);
const minerXZ110 = Math.hypot(miner110.route[0].x - station110.x, miner110.route[0].z - station110.z);
const freightMin110 = PHY.STATION_CYL_RADIUS + hull110('freighter') + pad110 - 0.01;
const worldFields110 = save110.slice(
  save110.indexOf('export const WORLD_FIELDS'),
  save110.indexOf('const SURVIVOR'),
);
const w110 = {
  authorHold: world110.includes(authorStr110) && !world110.includes(oldPadStr110),
  authorClassHeavy: world110.includes("classKey: 'heavy'")
    && world110.includes("writeStationHold(new THREE.Vector3(), station, 'heavy', gate)"),
  expectedHold: expectedXZ110 >= holdMin110,
  livePatrolOffPad: !!liveWp0110 && liveXZ110 > 0.5 && liveXZ110 >= holdMin110 - 1,
  oldPadHeals: healedXZ110 >= holdMin110
    && oldPatrol110.route.length === 3
    && oldPatrol110.speed === 90
    && oldPatrol110.route[0] !== padPt110
    && Object.keys(oldPatrol110.route[0]).sort().join(',') === 'x,y,z',
  idempotent: again110.route[0].x === good110.x && again110.route[0].z === good110.z,
  nanUnknownNoThrow: nanThrew110 === false
    && Number.isNaN(nan110.route[0].x)
    && nan110.speed === 77
    && JSON.stringify(unk110) === copyUnk110
    && unk110.speed === 88,
  traderMinerStill: traderXZ110 >= freightMin110
    && minerXZ110 > PHY.STATION_CYL_RADIUS
    && minerXZ110 < traderXZ110,
  pirateAceUnchanged: pirate110.route[0].x === padPt110.x
    && pirate110.route[0].z === padPt110.z
    && ace110.route[0].x === padPt110.x
    && ace110.route[0].z === padPt110.z
    && world110.includes('route: [jitter(gate.clone(), 90), laneMid, jitter(gate.clone(), 120)]')
    && world110.includes('route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)]'),
  rebuildTickHeal: world110.includes("if (rec.role === 'patrol') healPadHome(rec)")
    && (world110.match(/if \(rec\.role === 'patrol'\) healPadHome\(rec\)/g) || []).length >= 2
    && tickXZ110 >= holdMin110
    && tickRec110.speed === 90,
  holdClass: world110.includes("if (rec.role === 'patrol')")
    && world110.includes("return 'heavy'"),
  noPadHomeField: !/padHome/.test(worldFields110)
    && worldFields110.includes('recordBanks')
    && worldFields110.includes('records'),
  noInnerHtml: !/innerHTML/.test(world110),
  digit0Shipyard: st110.includes("'shipyard'")
    && st110.includes('i === DOCK_KEY_SERVICES.length - 1 ? 0'),
  digit8Digit9: st110.includes("'launch', 'epics'"),
  hubEmpty: hudCss110.includes('80px')
    && !/padHome|pad-home/.test(hud110)
    && !/padHome|pad-home/.test(world110),
};
const failed = Object.entries(w110).filter(([, v]) => !v).map(([k]) => k);
console.log(JSON.stringify(w110));
if (failed.length) {
  console.log(`WAVE110 FAIL ${failed.join(',')}`);
  process.exitCode = 1;
} else {
  console.log('WAVE110 ALL TRUE');
}
