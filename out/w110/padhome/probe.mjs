// Wave 110 PHY-05 pad-home PR1+PR2. Standalone. No dock. No Vite.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SYSTEMS } from '../../../src/game/state.js';
import { healPadHome, tickBank, initWorld } from '../../../src/game/world.js';
import {
  hullRadiusFor,
  writeStationHold,
  STATION_HOLD_PAD,
} from '../../../src/game/traffic-feel.js';
import { PHY } from '../../../src/game/physics.js';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(resolve(here, '../../..', rel), 'utf8');
const worldSrc = src('src/game/world.js');
const saveSrc = src('src/game/save.js');
const fail = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fail.push(extra ? `${name}: ${extra}` : name);
};

const s = SYSTEMS.freehold.station.position;
const g0 = SYSTEMS.freehold.gates[0].position;
const station = { x: s[0], y: s[1], z: s[2] };
const gate = { x: g0[0], y: g0[1], z: g0[2] };
const pad = { x: station.x, y: station.y, z: station.z };
const planet = { x: gate.x + 10, y: gate.y, z: gate.z };
const holdMin = PHY.STATION_CYL_RADIUS + hullRadiusFor('heavy') + STATION_HOLD_PAD;
const freightMin = PHY.STATION_CYL_RADIUS + hullRadiusFor('freighter') + STATION_HOLD_PAD - 0.01;
const xz = (p) => Math.hypot(p.x - station.x, p.z - station.z);
const same = (a, b, e = 1e-3) =>
  Math.abs(a.x - b.x) < e && Math.abs(a.y - b.y) < e && Math.abs(a.z - b.z) < e;
const keysOf = (p) => Object.keys(p).sort().join(',');

const authorStr = 'route: [writeStationHold(new THREE.Vector3(), station, \'heavy\', gate), jitter(gate.clone(), 50), jitter(planet.clone(), 60)]';
const oldPadStr = 'route: [station.clone(), jitter(gate.clone(), 50), jitter(planet.clone(), 60)]';
ok('src.authorHold', worldSrc.includes(authorStr) && !worldSrc.includes(oldPadStr));
ok('src.threeWp', worldSrc.includes('jitter(gate.clone(), 50), jitter(planet.clone(), 60)'));
ok('src.rebuildTick', (worldSrc.match(/if \(rec\.role === 'patrol'\) healPadHome\(rec\)/g) || []).length >= 2);
ok('src.allowlist', worldSrc.includes("role !== 'trader' && role !== 'miner' && role !== 'patrol'"));
ok('src.hasOwn', worldSrc.includes('Object.hasOwn(SYSTEMS, sysId)'));
ok('src.plainAssign', worldSrc.includes('route[0] = writeStationHold({ x: 0, y: 0, z: 0 }'));
ok('src.noForInWp', !/for\s*\(\s*(?:const|let|var)\s+\w+\s+in\s+(?:wp0|saveWp|route\[0\])/.test(worldSrc));
ok('src.pirateAce', worldSrc.includes('route: [jitter(gate.clone(), 90), laneMid, jitter(gate.clone(), 120)]')
  && worldSrc.includes('route: [jitter(gate.clone(), 70), jitter(planet.clone(), 100), jitter(gate.clone(), 150)]'));

const worldFields = saveSrc.slice(
  saveSrc.indexOf('export const WORLD_FIELDS'),
  saveSrc.indexOf('const SURVIVOR'),
);
ok('persist.noPadHome', !/padHome/.test(worldFields) && !worldSrc.includes('world.padHome'));
ok('src.noInnerHtml', !/innerHTML/.test(worldSrc));
ok('src.noPlanAp', !worldSrc.includes('planApPath'));

const authored = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'heavy', gate);
ok('author.xz', xz(authored) >= holdMin, `xz=${xz(authored)} min=${holdMin}`);
ok('author.offPad', !same(authored, pad));
const rounded = { x: Math.round(authored.x), y: Math.round(authored.y), z: Math.round(authored.z) };
ok('author.roundedOffPad', xz(rounded) > 0.5);
ok('author.roundedHold', xz(rounded) >= holdMin - 1, `rounded=${xz(rounded)}`);

const old = {
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  speed: 90,
  route: [{ ...pad }, { ...gate }, { ...planet }],
};
healPadHome(old);
ok('heal.xz', xz(old.route[0]) >= holdMin, `xz=${xz(old.route[0])}`);
ok('heal.plain', keysOf(old.route[0]) === 'x,y,z' && old.route[0].isVector3 !== true);
ok('heal.legs', old.route.length === 3 && same(old.route[1], gate) && same(old.route[2], planet));
ok('heal.speed', old.speed === 90);
ok('heal.matchAuthor', same(old.route[0], authored));

const good = { x: old.route[0].x, y: old.route[0].y, z: old.route[0].z };
const again = healPadHome({
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  route: [{ ...good }, { ...gate }, { ...planet }],
});
ok('heal.idempotent', again.route[0].x === good.x && again.route[0].z === good.z);

const light = healPadHome({
  role: 'patrol',
  classKey: 'light',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }, { ...planet }],
});
const unkClass = healPadHome({
  role: 'patrol',
  classKey: 'nope',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }, { ...planet }],
});
ok('class.lightCloser', xz(light.route[0]) < xz(old.route[0]));
ok('class.unknownHeavy', same(unkClass.route[0], authored));

const trader = healPadHome({
  role: 'trader',
  classKey: 'light',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }],
});
const miner = healPadHome({
  role: 'miner',
  classKey: 'light',
  system: 'freehold',
  route: [{ ...pad }, { ...gate }],
});
ok('leave.trader', xz(trader.route[0]) >= freightMin);
ok('leave.miner', xz(miner.route[0]) > PHY.STATION_CYL_RADIUS && xz(miner.route[0]) < xz(trader.route[0]));

const pirate = { role: 'pirate', classKey: 'cutter', system: 'freehold', route: [{ ...pad }, { ...gate }] };
const ace = { role: 'ace', classKey: 'ace', system: 'freehold', route: [{ ...pad }, { ...gate }] };
healPadHome(pirate);
healPadHome(ace);
ok('leave.pirate', same(pirate.route[0], pad));
ok('leave.ace', same(ace.route[0], pad));

const unk = { role: 'patrol', classKey: 'heavy', system: 'nope', speed: 88, route: [{ ...pad }, { ...gate }] };
const nan = { role: 'patrol', classKey: 'heavy', system: 'freehold', speed: 77, route: [{ x: NaN, y: 0, z: NaN }] };
const copyUnk = JSON.stringify(unk);
let threw = false;
try {
  healPadHome(unk);
  healPadHome(nan);
  healPadHome(null);
  healPadHome({ role: 'patrol' });
} catch {
  threw = true;
}
ok('fail.noThrow', !threw);
ok('fail.unknownSystem', JSON.stringify(unk) === copyUnk && unk.speed === 88);
ok('fail.nan', Number.isNaN(nan.route[0].x) && nan.speed === 77);

const tickRec = {
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  state: 'enroute',
  speed: 90,
  dir: 1,
  leg: 0,
  legT: 0,
  dwellUntil: 1,
  route: [{ ...pad }, { ...gate }, { ...planet }],
};
tickBank([tickRec], 'freehold', { world: { time: 0, activeEvent: null } });
ok('tick.heal', xz(tickRec.route[0]) >= holdMin && tickRec.speed === 90);

const ctx = {
  world: { records: [], recordBanks: {}, currentSystem: 'freehold', time: 0 },
  systems: SYSTEMS,
  emit() {},
};
initWorld(ctx);
const live = (ctx.world.records ?? []).find((r) => r.role === 'patrol');
const liveWp0 = live && live.route && live.route[0];
ok('live.patrol', !!live && live.classKey === 'heavy' && Array.isArray(live.route) && live.route.length === 3);
ok(
  'live.offPad',
  !!liveWp0 && xz(liveWp0) > 0.5 && xz(liveWp0) >= holdMin - 1,
  liveWp0 ? `xz=${xz(liveWp0)}` : 'missing',
);
const pirateLive = (ctx.world.records ?? []).find((r) => r.role === 'pirate');
ok('live.pirateNotStation', !!pirateLive && pirateLive.route && pirateLive.route[0]
  && (pirateLive.route[0].x !== station.x || pirateLive.route[0].z !== station.z));

if (fail.length) {
  console.log('FAIL');
  for (const f of fail) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('PASS');
}
