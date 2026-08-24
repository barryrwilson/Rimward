import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const ctxSrc = src('src/core/ctx.js');
const gateSrc = src('src/systems/gate.js');
const chartSrc = src('src/systems/galaxychart.js');
const hudSrc = src('src/systems/hud.js');
const guideSrc = src('src/systems/nav-guidance.js');
const bootSrc = src('scripts/boot-test.mjs');

const pins = {
  persistNoCtxLiteral: !ctxSrc.includes('ctx.autopilot'),
  chartNoCtxLiteral: !ctxSrc.includes('ctx.autopilot'),
  chartNoPrevent: !chartSrc.includes('preventDefault(') && !chartSrc.includes('stopPropagation('),
  chartNoInner: !chartSrc.includes('innerHTML'),
  guideNoInner: !guideSrc.includes('innerHTML') && !hudSrc.includes('innerHTML'),
  guidePath1: guideSrc.includes('path[1]'),
  apPredicate: gateSrc.includes('world.nav.autopilot')
    && gateSrc.includes('wantJump')
    && gateSrc.includes('near.to === nextHop'),
  bootHasApBlock: bootSrc.includes('WAVE85 NAV-03 autopilot'),
  bootHasPersist: bootSrc.includes('wave85 nav persist'),
  bootHasChart: bootSrc.includes('wave85 nav chart'),
  bootHasGuide: bootSrc.includes('wave85 nav guidance'),
};

console.log('wave85 ap pin-check:', JSON.stringify(pins, null, 2));
const failed = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('FAIL', failed.join(','));
  process.exit(1);
}
console.log('PASS');
