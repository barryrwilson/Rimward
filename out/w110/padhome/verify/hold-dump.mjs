// Evidence dump for WAVE110 hold distances. Does not edit src/.
import { SYSTEMS } from '../../../../src/game/state.js';
import { healPadHome, initWorld, tickBank } from '../../../../src/game/world.js';
import { hullRadiusFor, STATION_HOLD_PAD, writeStationHold } from '../../../../src/game/traffic-feel.js';
import { PHY } from '../../../../src/game/physics.js';

const s = SYSTEMS.freehold.station.position;
const g0 = SYSTEMS.freehold.gates[0].position;
const station = { x: s[0], y: s[1], z: s[2] };
const gate = { x: g0[0], y: g0[1], z: g0[2] };
const pad = { ...station };
const xz = (p) => Math.hypot(p.x - station.x, p.z - station.z);
const holdMin = PHY.STATION_CYL_RADIUS + hullRadiusFor('heavy') + STATION_HOLD_PAD;
const lightMin = PHY.STATION_CYL_RADIUS + hullRadiusFor('light') + STATION_HOLD_PAD;
const authored = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'heavy', gate);
const lightHold = writeStationHold({ x: 0, y: 0, z: 0 }, station, 'light', gate);
const rounded = { x: Math.round(authored.x), y: Math.round(authored.y), z: Math.round(authored.z) };

const ctx = {
  world: { records: [], recordBanks: {}, currentSystem: 'freehold', time: 0 },
  systems: SYSTEMS,
  emit() {},
};
initWorld(ctx);
const patrols = (ctx.world.records ?? []).filter((r) => r.role === 'patrol');
const traders = (ctx.world.records ?? []).filter((r) => r.role === 'trader');
const miners = (ctx.world.records ?? []).filter((r) => r.role === 'miner');
const pirates = (ctx.world.records ?? []).filter((r) => r.role === 'pirate');

const old = {
  role: 'patrol',
  classKey: 'heavy',
  system: 'freehold',
  speed: 90,
  route: [{ ...pad }, { ...gate }, { x: gate.x + 10, y: gate.y, z: gate.z }],
};
healPadHome(old);
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
  route: [{ ...pad }, { ...gate }, { x: gate.x + 10, y: gate.y, z: gate.z }],
};
tickBank([tickRec], 'freehold', { world: { time: 0, activeEvent: null } });

const dump = {
  cylR: PHY.STATION_CYL_RADIUS,
  heavyHull: hullRadiusFor('heavy'),
  lightHull: hullRadiusFor('light'),
  pad: STATION_HOLD_PAD,
  holdMin,
  lightMin,
  authoredXZ: xz(authored),
  roundedXZ: xz(rounded),
  lightHoldXZ: xz(lightHold),
  heavyVsLight: xz(authored) - xz(lightHold),
  livePatrols: patrols.map((r) => ({
    classKey: r.classKey,
    speed: r.speed,
    n: r.route.length,
    xz: xz(r.route[0]),
    keys: Object.keys(r.route[0]).sort().join(','),
  })),
  liveTrader0xz: traders[0] ? xz(traders[0].route[0]) : null,
  liveMiner0xz: miners[0] ? xz(miners[0].route[0]) : null,
  livePirate0xz: pirates[0] ? xz(pirates[0].route[0]) : null,
  healedXZ: xz(old.route[0]),
  healedSpeed: old.speed,
  tickXZ: xz(tickRec.route[0]),
  tickSpeed: tickRec.speed,
};
console.log(JSON.stringify(dump, null, 2));
