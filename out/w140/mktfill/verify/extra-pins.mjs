/**
 * Isolated WAVE140 MKTFILL observe pins. Fake ctx. Does not edit src/.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COMMODITIES } from '../../../../src/game/state.js';
import { reservedName } from '../../../../src/game/agent-schema.js';
import { buildObservation } from '../../../../src/game/agent-observe.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const obsSrc = readFileSync(join(root, 'src/game/agent-observe.js'), 'utf8');
const stSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const bootSrc = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');

let fails = 0;
function pin(name, ok) {
  if (ok) {
    console.log('ok', name);
    return;
  }
  fails++;
  console.log('FAIL', name);
}

function peekFn() {
  const start = obsSrc.indexOf('function peekFill(');
  const end = obsSrc.indexOf('function marketBlock(');
  return start >= 0 && end > start ? obsSrc.slice(start, end) : '';
}

function peekUnitFn() {
  const start = stSrc.indexOf('function peekFillUnit(key, buying)');
  const end = stSrc.indexOf('function deskResult(');
  return start >= 0 && end > start ? stSrc.slice(start, end) : '';
}

const peekBody = peekFn();
const unitBody = peekUnitFn();

pin('peekFill no desk.trade', !/\.trade\s*\(/.test(peekBody) && !peekBody.includes('tryTrade'));
pin('peekFillUnit only tradeFillUnit', !!(
  unitBody.includes('return tradeFillUnit(key, buying);')
  && unitBody.includes('catch')
  && !unitBody.includes('tryTrade')
  && !unitBody.includes('credits')
  && !unitBody.includes('addCargo')
  && !unitBody.includes('removeCargo')
));
pin('reservedName skip in marketBlock', obsSrc.includes('if (reservedName(commodity)) continue;'));
pin('Object.hasOwn COMMODITIES in marketBlock', obsSrc.includes('if (!Object.hasOwn(COMMODITIES, commodity)) continue;'));
pin('no for-in world.prices', !/for\s*\(\s*(?:const|let|var)\s+\w+\s+in\s+(?:ctx\.)?world\.prices/.test(obsSrc));
pin('TRADE offset 5', bootSrc.includes('const MARKET_CELL_TRADE = 5')
  && /TRADE buttons live at offset 5/.test(bootSrc));

function baseCtx(desk) {
  return {
    flags: { docked: true, paused: false },
    world: {
      time: 1,
      credits: 500,
      currentSystem: 'verge',
      prices: { provisions: 100 },
    },
    ship: {
      object: {
        position: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 },
      },
      speed: 0,
    },
    cargo: [{ commodity: 'provisions', units: 2 }],
    stationDesk: desk,
  };
}

function provisionsRow(obs) {
  const rows = obs && obs.market && Array.isArray(obs.market.rows) ? obs.market.rows : [];
  return rows.find((r) => r && r.commodity === 'provisions') || null;
}

let tradeCalls = 0;
const desk = {
  peekService() { return 'market'; },
  trade() { tradeCalls++; return { ok: true, notice: '' }; },
  tryTrade() { tradeCalls++; return false; },
  peekFillUnit(key, buying) {
    if (key === 'provisions') return buying ? 125 : 80;
    return 90;
  },
};
const obsFill = buildObservation(baseCtx(desk));
const rowFill = provisionsRow(obsFill);
pin('isolated posted 100 with fill', !!(rowFill && rowFill.posted === 100 && rowFill.fillBuy === 125 && rowFill.fillSell === 80));
pin('isolated peekFill never calls trade', tradeCalls === 0);

const deskHalf = {
  peekService() { return 'market'; },
  trade() { tradeCalls++; },
  peekFillUnit(key, buying) {
    if (buying) return 125;
    return Number.POSITIVE_INFINITY;
  },
};
const rowHalf = provisionsRow(buildObservation(baseCtx(deskHalf)));
pin('isolated sell Infinity omits fillSell keeps fillBuy', !!(
  rowHalf
  && rowHalf.posted === 100
  && rowHalf.fillBuy === 125
  && !Object.hasOwn(rowHalf, 'fillSell')
));

const deskInfBuy = {
  peekService() { return 'market'; },
  peekFillUnit() { return Number.POSITIVE_INFINITY; },
};
const rowInf = provisionsRow(buildObservation(baseCtx(deskInfBuy)));
pin('isolated Infinity omits both fill keys', !!(
  rowInf
  && rowInf.posted === 100
  && !Object.hasOwn(rowInf, 'fillBuy')
  && !Object.hasOwn(rowInf, 'fillSell')
));

const reservedKey = 'constructor';
pin('reservedName constructor', reservedName(reservedKey) === true);
const hadReserved = Object.hasOwn(COMMODITIES, reservedKey);
const savedReserved = hadReserved ? COMMODITIES[reservedKey] : undefined;
COMMODITIES[reservedKey] = { name: 'ReservedInject', base: 1, legal: true };
let reservedRow = null;
try {
  const obsR = buildObservation(baseCtx({
    peekService() { return 'market'; },
    peekFillUnit() { return 7; },
  }));
  const rows = obsR && obsR.market && Array.isArray(obsR.market.rows) ? obsR.market.rows : [];
  reservedRow = rows.find((r) => r && r.commodity === reservedKey) || null;
} finally {
  if (hadReserved) COMMODITIES[reservedKey] = savedReserved;
  else delete COMMODITIES[reservedKey];
}
pin('isolated reservedName skip constructor row', reservedRow == null);

if (fails) {
  console.log('EXTRA PINS FAIL', fails);
  process.exit(1);
}
console.log('EXTRA PINS PASS');
