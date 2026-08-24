/**
 * WAVE107 BIO-06 living-cadence table + proto-safe miss → light.
 */
import {
  LIVING_CADENCE,
  SWIM_IDLE_HZ,
  SWIM_CRUISE_HZ,
  cadenceFor,
  classCruise,
} from '../../../src/game/living-cadence.js';

let fails = 0;
function pin(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) fails++;
  return ok;
}

const expected = {
  light: { hzScale: 1.00, sweepScale: 1.00 },
  ace: { hzScale: 0.96, sweepScale: 1.06 },
  cutter: { hzScale: 0.80, sweepScale: 1.22 },
  heavy: { hzScale: 0.62, sweepScale: 1.42 },
  frigate: { hzScale: 0.44, sweepScale: 1.68 },
  freighter: { hzScale: 0.30, sweepScale: 2.00 },
};

pin('SWIM_IDLE_HZ 0.5', SWIM_IDLE_HZ === 0.5);
pin('SWIM_CRUISE_HZ 2.3', SWIM_CRUISE_HZ === 2.3);

for (const key of Object.keys(expected)) {
  const row = cadenceFor(key);
  const want = expected[key];
  pin(`${key} hzScale`, row.hzScale === want.hzScale);
  pin(`${key} sweepScale`, row.sweepScale === want.sweepScale);
  pin(`${key} table own`, Object.hasOwn(LIVING_CADENCE, key));
}

pin('miss unknown → light', cadenceFor('not-a-class') === LIVING_CADENCE.light);
pin('miss empty → light', cadenceFor('') === LIVING_CADENCE.light);
pin('miss proto → light', cadenceFor('__proto__') === LIVING_CADENCE.light);
pin('miss constructor → light', cadenceFor('constructor') === LIVING_CADENCE.light);
pin('miss prototype → light', cadenceFor('prototype') === LIVING_CADENCE.light);
pin('miss number → light', cadenceFor(0) === LIVING_CADENCE.light);
pin('miss object → light', cadenceFor({ light: true }) === LIVING_CADENCE.light);
pin('miss null → light', cadenceFor(null) === LIVING_CADENCE.light);
pin('miss undefined → light', cadenceFor(undefined) === LIVING_CADENCE.light);

const polluted = Object.create({ light: { hzScale: 9, sweepScale: 9 } });
polluted.heavy = 'heavy';
pin('hasOwn not inherited', cadenceFor(polluted) === LIVING_CADENCE.light);

pin('classCruise light 120', classCruise('light') === 120);
pin('classCruise proto 120', classCruise('__proto__') === 120);
pin('classCruise miss 120', classCruise('nope') === 120);
pin('classCruise non-string 120', classCruise(120) === 120);

const hz = (k) => cadenceFor(k).hzScale;
pin(
  'monotonic hz',
  hz('light') >= hz('ace')
    && hz('ace') > hz('cutter')
    && hz('cutter') > hz('heavy')
    && hz('heavy') > hz('frigate')
    && hz('frigate') > hz('freighter'),
);

if (fails === 0) {
  console.log('BIO06 PROBE PASS');
  process.exit(0);
}
console.log(`BIO06 PROBE FAIL — ${fails}`);
process.exit(1);
