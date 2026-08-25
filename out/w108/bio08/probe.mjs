/**
 * WAVE108 BIO-08 living-gait table + proto-safe miss → light, source contracts.
 * No Vite. No browser.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIVING_CADENCE,
  SWIM_IDLE_HZ,
  SWIM_CRUISE_HZ,
  cadenceFor,
} from '../../../src/game/living-cadence.js';
import {
  LIVING_GAIT,
  GAIT_AXES,
  LIVE_GAIT_MIX,
  gaitFor,
  axesForGait,
} from '../../../src/game/living-gait.js';

let fails = 0;
function pin(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) fails++;
  return ok;
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');
const gaitSrc = src('src/game/living-gait.js');
const cadenceSrc = src('src/game/living-cadence.js');
const shipSrc = src('src/systems/ship.js');
const assetsSrc = src('src/systems/ship-assets.js');
const saveSrc = src('src/game/save.js');
const stationSrc = src('src/systems/station.js');
const yardSrc = src('src/systems/yard-preview.js');
const worldFields = saveSrc.slice(
  saveSrc.indexOf('export const WORLD_FIELDS'),
  saveSrc.indexOf('const SURVIVOR'),
);

const expectedClass = {
  light: { gaitId: 'shark-caudal', spineX: 0.55, flapY: 1.00, kickZ: 0.70, radial: 0.00 },
  cutter: { gaitId: 'shark-caudal', spineX: 0.55, flapY: 1.00, kickZ: 0.70, radial: 0.00 },
  ace: { gaitId: 'squid-mantle', spineX: 0.15, flapY: 0.12, kickZ: 0.50, radial: 1.00 },
  heavy: { gaitId: 'whale-fluke', spineX: 0.90, flapY: 0.28, kickZ: 0.85, radial: 0.08 },
  freighter: { gaitId: 'whale-fluke', spineX: 0.90, flapY: 0.28, kickZ: 0.85, radial: 0.08 },
  frigate: { gaitId: 'octopus-trail', spineX: 0.22, flapY: 0.18, kickZ: 1.00, radial: 0.28 },
};

for (const key of Object.keys(expectedClass)) {
  const row = gaitFor(key);
  const want = expectedClass[key];
  pin(`${key} gaitId`, row.gaitId === want.gaitId);
  pin(`${key} spineX`, row.spineX === want.spineX);
  pin(`${key} flapY`, row.flapY === want.flapY);
  pin(`${key} kickZ`, row.kickZ === want.kickZ);
  pin(`${key} radial`, row.radial === want.radial);
  pin(`${key} map own`, Object.hasOwn(LIVING_GAIT, key));
}

pin('ace not manta', gaitFor('ace').flapY === 0.12 && gaitFor('ace').radial === 1);
pin(
  'frigate not sunburst',
  gaitFor('frigate').radial === 0.28
    && gaitFor('frigate').radial < gaitFor('ace').radial
    && gaitFor('frigate').kickZ === 1,
);

pin('unknown class → light', gaitFor('not-a-class') === gaitFor('light'));
pin('empty class → light', gaitFor('') === gaitFor('light'));
pin('proto → light', gaitFor('__proto__') === gaitFor('light'));
pin('constructor → light', gaitFor('constructor') === gaitFor('light'));
pin('prototype → light', gaitFor('prototype') === gaitFor('light'));
pin('toString → light', gaitFor('toString') === gaitFor('light'));
pin('number → light', gaitFor(0) === gaitFor('light'));
pin('object → light', gaitFor({ light: true }) === gaitFor('light'));
pin('null → light', gaitFor(null) === gaitFor('light'));
pin('undefined → light', gaitFor(undefined) === gaitFor('light'));

const polluted = Object.create({ light: 'squid-mantle' });
polluted.heavy = 'heavy';
pin('hasOwn not inherited class', gaitFor(polluted) === gaitFor('light'));

pin('unknown gait → live mix', axesForGait('not-a-gait') === LIVE_GAIT_MIX);
pin('proto gait → live mix', axesForGait('__proto__') === LIVE_GAIT_MIX);
pin('null gait → live mix', axesForGait(null) === LIVE_GAIT_MIX);
pin('live mix 1,1,0,0', LIVE_GAIT_MIX.spineX === 1 && LIVE_GAIT_MIX.flapY === 1
  && LIVE_GAIT_MIX.kickZ === 0 && LIVE_GAIT_MIX.radial === 0);
pin('axes own shark', Object.hasOwn(GAIT_AXES, 'shark-caudal'));
pin('axes reject proto', !Object.hasOwn(GAIT_AXES, '__proto__'));

pin('gait hasOwn classKey', gaitSrc.includes('Object.hasOwn(LIVING_GAIT, classKey)'));
pin('gait hasOwn gaitId', gaitSrc.includes('Object.hasOwn(GAIT_AXES, gaitId)'));
pin('gait THREE-free import', !/from ['"]three['"]/.test(gaitSrc));
pin('gait no SHIP_CLASSES copy', !gaitSrc.includes('cruise:'));

pin('cadence idle 0.5', SWIM_IDLE_HZ === 0.5);
pin('cadence cruise 2.3', SWIM_CRUISE_HZ === 2.3);
pin('cadence light 1/1', cadenceFor('light').hzScale === 1 && cadenceFor('light').sweepScale === 1);
pin('cadence numbers frozen', LIVING_CADENCE.freighter.hzScale === 0.30
  && LIVING_CADENCE.frigate.sweepScale === 1.68);
pin('cadence src has no gait', !cadenceSrc.includes('gait'));

pin('player light Hz branch', shipSrc.includes('cadence !== LIVING_CADENCE.light'));
pin('player light sculpt skip', shipSrc.includes("playerClass !== 'light'"));
pin('player live spine line', shipSrc.includes(
  'x += bodyAmp * zn * zn * Math.sin(6.9 * zn - swimPhase);',
));
pin('player gait multiply spine', shipSrc.includes('* gait.spineX'));
pin('player gait add kickZ', shipSrc.includes('* gait.kickZ'));
pin('player gait add radial', shipSrc.includes('gait.radial'));
pin('player mood rates', /keen:\s*\{\s*rate:\s*1\.25/.test(shipSrc)
  && /feral:\s*\{\s*rate:\s*1\.5/.test(shipSrc));
pin('player breath 0.25', shipSrc.includes('BREATH_HZ = 0.25'));
pin('player heart 1.1', shipSrc.includes('HEART_HZ = 1.1'));
pin('no makeLivingHull clone comment path', shipSrc.includes('export function makeLivingHull'));

pin('gpu four gait uniforms', assetsSrc.includes('uSwimSpineX')
  && assetsSrc.includes('uSwimFlapY')
  && assetsSrc.includes('uSwimKickZ')
  && assetsSrc.includes('uSwimRadial'));
pin('gpu sweep still flap', /flap \* uSwimSweep/.test(assetsSrc));
pin('gpu one program key', assetsSrc.includes("rimward-beautiful-swim-gait")
  && assetsSrc.includes('customProgramCacheKey = () => SWIM_PROGRAM_KEY'));
pin('gpu no classKey in GLSL prefix', (() => {
  const inject = assetsSrc.slice(
    assetsSrc.indexOf('function injectSwim('),
    assetsSrc.indexOf('function cloneSwimMaterials('),
  );
  return !inject.includes('classKey') && !inject.includes('gaitId') && !inject.includes('${');
})());
pin('gpu mixer not gait', !assetsSrc.includes('mixer.timeScale'));
pin('gpu reducedMotion amp 0', /uSwimAmp\.value\s*=\s*reducedMotion\s*\?\s*0\s*:\s*1/.test(assetsSrc));
pin('gpu classKey stash', assetsSrc.includes('root.userData.classKey = resolvedClass'));
pin('gpu beautiful only', assetsSrc.includes("resolvedFaction === 'beautiful' ? makeSwimUniforms() : null"));

pin('no gait persist', !/\bgait\b/i.test(worldFields));
pin('digit 0 shipyard', stationSrc.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0")
  && stationSrc.includes("'shipyard'"));
pin(
  'digit 8/9 stay',
  stationSrc.includes("['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']"),
);
pin('yard living update null', /update:\s*null/.test(yardSrc));
pin('no innerHTML on gait paths', !gaitSrc.includes('innerHTML')
  && !shipSrc.includes('innerHTML')
  && !assetsSrc.includes('innerHTML'));

if (fails === 0) {
  console.log('BIO08 PROBE PASS');
  process.exit(0);
}
console.log(`BIO08 PROBE FAIL — ${fails}`);
process.exit(1);
