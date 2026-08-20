// Wave 66 PR4: survivorSold HUD toast + ctx frozen event list.
// Run: node --import ./scripts/with-css-stub.mjs out/w66/pr4/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hudFamily } from '../../../src/systems/hud.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const hudSrc = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');
const ctxSrc = readFileSync(join(root, 'src/core/ctx.js'), 'utf8');

const results = {};

results.hudFamilyImport = hudFamily({ player: { hullKind: 'built' } }) === 'mech';

results.ctxComment = ctxSrc.includes(
  "// 'survivorSold' { faction, source, count, credits, repDelta }  (trafficking.js / station.js, wave 66)",
);
results.ctxNoEmitSold = !/emit\s*\(\s*['\"]survivorSold['\"]/.test(ctxSrc);

results.hudCase = hudSrc.includes("case 'survivorSold':");
results.hudOne = hudSrc.includes("'■ The Chain took one.'");
results.hudMany = hudSrc.includes('`■ The Chain took ${n}.`');
results.hudWarn = /case 'survivorSold':[\s\S]*?cls:\s*'warn'/.test(hudSrc);
results.hudNotGood = !/case 'survivorSold':[\s\S]*?cls:\s*'good'/.test(hudSrc);
results.hudNoEmitSold = !/emit\s*\(\s*['\"]survivorSold['\"]/.test(hudSrc);
results.hudNoRowName = !/case 'survivorSold':[\s\S]*?(row\.name|e\.name)/.test(hudSrc);
results.hudFiniteCount = /case 'survivorSold':[\s\S]*Number\.isFinite\s*\(\s*e\.count\s*\)/.test(hudSrc);
results.hudFrameLines = /case 'survivorSold':[\s\S]*mem\.frameLines\.push\(e\.line\)/.test(hudSrc);
results.hudToastTextContent = hudSrc.includes('slot.el.textContent = text');
results.hudNoInnerHtmlSold = !/case 'survivorSold':[\s\S]*innerHTML/.test(hudSrc);

const soldMatch = hudSrc.match(/case 'survivorSold': \{([\s\S]*?)\n    \}/);
results.soldCaseExtracted = !!soldMatch;
let toastSold = null;
if (soldMatch) {
  toastSold = new Function('e', 'ctx', 'mem', soldMatch[1]);
}

function pinToast(name, e, expectText, expectCls, extra) {
  const mem = { frameLines: [] };
  let threw = false;
  let t = null;
  try {
    t = toastSold(e, {}, mem);
  } catch {
    threw = true;
  }
  results[name] = !threw && t?.text === expectText && t?.cls === expectCls
    && (extra ? extra(mem, t) : true);
}

if (toastSold) {
  pinToast('toastN1', { type: 'survivorSold', count: 1 }, '■ The Chain took one.', 'warn');
  pinToast('toastN2', { type: 'survivorSold', count: 2 }, '■ The Chain took 2.', 'warn');
  pinToast('toastMissingCount', { type: 'survivorSold' }, '■ The Chain took 0.', 'warn');
  pinToast('toastNullCount', { type: 'survivorSold', count: null }, '■ The Chain took 0.', 'warn');
  pinToast('toastInf', { type: 'survivorSold', count: Infinity }, '■ The Chain took 0.', 'warn');
  pinToast('toastNaN', { type: 'survivorSold', count: Number.NaN }, '■ The Chain took 0.', 'warn');
  pinToast(
    'toastXssCount',
    { type: 'survivorSold', count: '<img src=x onerror=alert(1)>' },
    '■ The Chain took 0.',
    'warn',
  );
  pinToast(
    'toastLineDedupe',
    { type: 'survivorSold', count: 1, line: 'The Chain takes them. 1 transferred. 160 UU.' },
    '■ The Chain took one.',
    'warn',
    (mem) => mem.frameLines.length === 1
      && mem.frameLines[0] === 'The Chain takes them. 1 transferred. 160 UU.',
  );
  pinToast(
    'toastIgnoresName',
    { type: 'survivorSold', count: 2, name: '<b>XSS</b>', line: 'ok' },
    '■ The Chain took 2.',
    'warn',
    (mem, t) => !String(t.text).includes('XSS') && !String(t.text).includes('<b>')
      && mem.frameLines[0] === 'ok',
  );
} else {
  results.toastN1 = false;
  results.toastN2 = false;
  results.toastMissingCount = false;
  results.toastNullCount = false;
  results.toastInf = false;
  results.toastNaN = false;
  results.toastXssCount = false;
  results.toastLineDedupe = false;
  results.toastIgnoresName = false;
}

let failed = 0;
for (const [k, v] of Object.entries(results)) {
  const ok = v === true;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${k}`);
}
if (failed) {
  console.log(`PROBE FAIL — ${failed}`);
  process.exit(1);
}
console.log('PROBE PASS');
console.log(JSON.stringify(results));
