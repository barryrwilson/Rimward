// Wave 59: heal pad-centered trader/miner route[0] through writeStationHold.
import { SYSTEMS } from '../../../src/game/state.js';
import {
  normalizeTraderRecord,
  normalizeMinerRecord,
  healPadHome,
} from '../../../src/game/world.js';
import {
  hullRadiusFor,
  writeStationHold,
  STATION_HOLD_PAD,
} from '../../../src/game/traffic-feel.js';
import { PHY } from '../../../src/game/physics.js';

const fails = [];
const ok = (name, cond, extra = '') => {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
};

const fh = SYSTEMS.freehold;
const s = fh.station.position;
const g = fh.gates[0].position;
const station = { x: s[0], y: s[1], z: s[2] };
const gate = { x: g[0], y: g[1], z: g[2] };
const freightR = hullRadiusFor('freighter');
const lightR = hullRadiusFor('light');
const freightMin = PHY.STATION_CYL_RADIUS + freightR + STATION_HOLD_PAD - 0.01;
const lightMin = PHY.STATION_CYL_RADIUS + lightR + STATION_HOLD_PAD - 0.01;

const trader = {
  role: 'trader',
  classKey: 'freighter',
  system: 'freehold',
  outboundTo: fh.gates[0].to,
  route: [
    { x: s[0], y: s[1], z: s[2] },
    { x: g[0], y: g[1], z: g[2] },
  ],
};
const keepTo = trader.outboundTo;
const keepGate = { ...trader.route[1] };
normalizeTraderRecord(trader);
const t0 = trader.route[0];
const tXZ = Math.hypot(t0.x - s[0], t0.z - s[2]);
ok('heal.trader.xz', tXZ >= freightMin, `xz=${tXZ} min=${freightMin}`);
ok('heal.trader.plain', Number.isFinite(t0.x) && Number.isFinite(t0.y) && Number.isFinite(t0.z) && t0.isVector3 !== true);
ok('heal.trader.outbound', trader.outboundTo === keepTo, `${trader.outboundTo}`);
ok(
  'heal.trader.gateEnd',
  trader.route[1].x === keepGate.x && trader.route[1].y === keepGate.y && trader.route[1].z === keepGate.z,
);
ok('heal.trader.legLens', Array.isArray(trader.legLens) && trader.legLens.length === 1 && Number.isFinite(trader.legLens[0]));

const goodHold = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'freighter', gate);
const good = {
  role: 'trader',
  classKey: 'freighter',
  system: 'freehold',
  outboundTo: fh.gates[0].to,
  route: [{ x: goodHold.x, y: goodHold.y, z: goodHold.z }, { ...gate }],
};
normalizeTraderRecord(good);
ok(
  'keep.hold',
  Math.abs(good.route[0].x - goodHold.x) < 1e-3
    && Math.abs(good.route[0].y - goodHold.y) < 1e-3
    && Math.abs(good.route[0].z - goodHold.z) < 1e-3,
  `${good.route[0].x},${good.route[0].y},${good.route[0].z}`,
);

let threw = false;
try {
  normalizeTraderRecord({ role: 'trader', system: 'nope', route: [{ x: s[0], y: s[1], z: s[2] }, { ...gate }] });
  normalizeTraderRecord({ role: 'trader', system: 'freehold', route: [{ x: NaN, y: NaN, z: NaN }, { ...gate }] });
  normalizeTraderRecord({ role: 'trader' });
  normalizeTraderRecord(null);
  healPadHome(null);
  normalizeMinerRecord({ role: 'miner', system: undefined, route: [{ x: s[0], y: s[1], z: s[2] }] });
  normalizeMinerRecord({ role: 'miner', system: 'freehold', route: [{ x: NaN, y: 0, z: NaN }] });
} catch {
  threw = true;
}
ok('nan.noThrow', !threw);

const miner = {
  role: 'miner',
  classKey: 'light',
  system: 'freehold',
  route: [
    { x: s[0], y: s[1], z: s[2] },
    { x: g[0], y: g[1], z: g[2] },
  ],
};
normalizeMinerRecord(miner);
const m0 = miner.route[0];
const mXZ = Math.hypot(m0.x - s[0], m0.z - s[2]);
ok('heal.miner.xz', mXZ >= lightMin, `xz=${mXZ} min=${lightMin}`);
ok('heal.miner.closerThanFreight', mXZ < tXZ, `miner=${mXZ} freight=${tXZ}`);
ok('heal.miner.plain', Number.isFinite(m0.x) && Number.isFinite(m0.z) && m0.isVector3 !== true);

if (fails.length) {
  console.log('FAIL');
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('CLEAN');
}
