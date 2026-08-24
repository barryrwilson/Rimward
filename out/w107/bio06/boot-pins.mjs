import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIVING_CADENCE as w107Cadence,
  SWIM_IDLE_HZ as w107IdleHz,
  SWIM_CRUISE_HZ as w107CruiseHz,
  cadenceFor as w107CadenceFor,
  classCruise as w107ClassCruise,
} from '../../../src/game/living-cadence.js';

const here107 = dirname(fileURLToPath(import.meta.url));
const src107 = (rel) => readFileSync(join(here107, '..', '..', '..', rel), 'utf8');
const ship107 = src107('src/systems/ship.js');
const assets107 = src107('src/systems/ship-assets.js');
const station107 = src107('src/systems/station.js');
const save107 = src107('src/game/save.js');
const worldFields107 = save107.slice(
  save107.indexOf('export const WORLD_FIELDS'),
  save107.indexOf('const SURVIVOR'),
);
const makeSwim107 = assets107.slice(
  assets107.indexOf('function makeSwimUniforms()'),
  assets107.indexOf('function injectSwim('),
);
const injectSwim107 = assets107.slice(
  assets107.indexOf('function injectSwim('),
  assets107.indexOf('function cloneSwimMaterials('),
);
const updateAsset107 = assets107.slice(
  assets107.indexOf('export function updateShipAsset'),
);

const hzLight = w107CadenceFor('light').hzScale;
const hzAce = w107CadenceFor('ace').hzScale;
const hzCutter = w107CadenceFor('cutter').hzScale;
const hzHeavy = w107CadenceFor('heavy').hzScale;
const hzFrigate = w107CadenceFor('frigate').hzScale;
const hzFreighter = w107CadenceFor('freighter').hzScale;

const w107 = {
  lightEnvelope: w107IdleHz === 0.5 && w107CruiseHz === 2.3
    && /serene:\s*\{\s*rate:\s*1(?:\.0)?/.test(ship107)
    && /keen:\s*\{\s*rate:\s*1\.25/.test(ship107)
    && /feral:\s*\{\s*rate:\s*1\.5/.test(ship107)
    && /pained:\s*\{\s*rate:\s*0\.6/.test(ship107)
    && ship107.includes('cadence !== LIVING_CADENCE.light'),
  lightCadence: w107CadenceFor('light').hzScale === 1
    && w107CadenceFor('light').sweepScale === 1
    && w107Cadence.light.hzScale === 1
    && w107Cadence.light.sweepScale === 1,
  monotonicHz: hzLight >= hzAce && hzAce > hzCutter && hzCutter > hzHeavy
    && hzHeavy > hzFrigate && hzFrigate > hzFreighter,
  protoSafe: w107CadenceFor('__proto__') === w107Cadence.light
    && w107CadenceFor('constructor') === w107Cadence.light
    && w107CadenceFor('toString') === w107Cadence.light
    && w107CadenceFor(null) === w107Cadence.light
    && w107CadenceFor(undefined) === w107Cadence.light
    && w107CadenceFor(12) === w107Cadence.light
    && w107CadenceFor({}) === w107Cadence.light
    && w107CadenceFor('not-a-class') === w107Cadence.light
    && w107ClassCruise('__proto__') === 120
    && w107ClassCruise('nope') === 120,
  noCadenceWorldField: !/\bcadence\b/.test(worldFields107),
  digit0Shipyard: station107.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0")
    && station107.includes("'shipyard'"),
  npcReducedAmp0: /uSwimAmp\.value\s*=\s*reducedMotion\s*\?\s*0\s*:\s*1/.test(updateAsset107),
  swimHzMatch: assets107.includes('SWIM_IDLE_HZ')
    && assets107.includes('SWIM_CRUISE_HZ')
    && assets107.includes("from '../game/living-cadence.js'")
    && w107IdleHz === 0.5 && w107CruiseHz === 2.3,
  uSwimSweep: makeSwim107.includes('uSwimSweep')
    && injectSwim107.includes('uSwimSweep')
    && injectSwim107.includes('uniform float uSwimSweep')
    && /flap \* uSwimSweep/.test(injectSwim107)
    && !/uSwimAmp.*sweepScale/.test(updateAsset107),
};

console.log(JSON.stringify(w107, null, 2));
if (!Object.values(w107).every(Boolean)) {
  console.log('WAVE107 BIO-06 FAIL');
  process.exit(1);
}
console.log('WAVE107 BIO-06 pins all true');
