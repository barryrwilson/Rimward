import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const ctx = src('src/core/ctx.js');
const save = src('src/game/save.js');
const nav = src('src/game/nav.js');
const ap = src('src/game/autopilot.js');
const main = src('src/main.js');
const boot = src('scripts/boot-test.mjs');

const persistPin = !ctx.includes('ctx.autopilot');
const chartPin = /\bchartOpen:\s*false\b/.test(ctx)
  && ctx.includes('galaxychart.js')
  && !ctx.includes('ctx.autopilot');

const out = {
  persistPinNoCtxAutopilot: persistPin,
  chartPinNoCtxAutopilot: chartPin,
  bootTestStillHasPersistPin: boot.includes("const noChartFlag = !ctx85src.includes('ctx.autopilot');"),
  bootTestStillHasChartPin: boot.includes("&& !ctxSrc.includes('ctx.autopilot');"),
  ctxContainsLiteral_ctx_dot_autopilot: ctx.includes('ctx.autopilot'),
  ctxContainsAutopilotProperty: /autopilot:\s*\{/.test(ctx),
  apJsWritesCtxAutopilot: ap.includes('ctx.autopilot'),
  healerWriteNavFalse: /function writeNav[\s\S]{0,200}autopilot:\s*false/.test(nav)
    && save.includes("import { sanitizeNav } from './nav.js'")
    && (save.match(/sanitizeNav\(ctx\)/g) || []).length >= 2,
  tickOrder: /initGate[\s\S]{0,40}initControls[\s\S]{0,40}initAutopilot[\s\S]{0,80}initShip/.test(main),
  worldFieldsNavOnce: (save.match(/'nav'/g) || []).length === 1
    && !/WORLD_FIELDS = \[[\s\S]*?'autopilot'[\s\S]*?\];/.test(save),
};

console.log(JSON.stringify(out, null, 2));
const fail = Object.entries(out).filter(([k, v]) => {
  if (k === 'ctxContainsLiteral_ctx_dot_autopilot') return v === true;
  if (k === 'apJsWritesCtxAutopilot') return false;
  return !v;
}).map(([k]) => k);
if (fail.length) {
  console.log('PIN CHECK FAIL', fail.join(','));
  process.exit(1);
}
console.log('PIN CHECK PASS (WAVE85 ctx.autopilot substring still absent in ctx.js)');
