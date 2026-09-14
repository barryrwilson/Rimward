/** Checked fresh-process regressions for Agent API playtest issues #168-171/#178.
 * Shared by the boot gate and release-focused runner. Every scenario keeps its
 * own real system initialization; all assertions and output remain visible.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checks = [
  ['cruiseApproach', 'issue-168-cruise-test.mjs'],
  ['rawSteering', 'issue-103-throttle-observability-test.mjs'],
  ['deskAndHaulQuotes', 'issue-170-desk-test.mjs'],
  ['rawBurnerDockHandoff', 'issue-171-burner-test.mjs'],
];
const results = [];
for (const [name, file] of checks) {
  console.log(`\n--- Agent API playtest regression: ${name} ---`);
  const started = Date.now();
  const run = spawnSync(process.execPath, [
    '--import', './scripts/with-css-stub.mjs', join('scripts', file),
  ], { cwd: root, env: process.env, stdio: 'inherit', windowsHide: true, timeout: 120000 });
  const row = {
    name, pass: run.status === 0 && !run.error, exitCode: run.status,
    signal: run.signal || null, error: run.error?.message || null,
    durationMs: Date.now() - started,
  };
  results.push(row);
  if (!row.pass) console.error('FAILED CHILD', JSON.stringify(row));
}
const verdict = results.every(row => row.pass) ? 'PASS' : 'FAIL';
const out = join(root, 'out', 'agent-api-playtest-fixes');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'result.json'), JSON.stringify({ verdict, checks: results }, null, 2) + '\n');
console.log(`\nAGENT API PLAYTEST FIXES ${verdict} (${results.filter(row => row.pass).length}/${checks.length})`);
process.exitCode = verdict === 'PASS' ? 0 : 1;
