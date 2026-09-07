/** Run every focused release regression and retain all results. */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = ['./scripts/with-css-stub.mjs'];
const checks = [
  ['dockApproach', ['--import', ...css, 'scripts/dock-approach-test.mjs']],
  ['padGovernor', ['scripts/pad-speed-governor-test.mjs']],
  ['runtimeErrorUx', ['--import', ...css, 'scripts/runtime-error-ux-test.mjs']],
  ['pauseRecovery', ['--import', ...css, 'scripts/pause-recovery-test.mjs']],
  ['pausedInput', ['--import', ...css, 'scripts/paused-input-test.mjs']],
  ['shipMaterialRelease', ['scripts/ship-material-release-test.mjs']],
  ['agentBridge', ['scripts/agent-bridge.mjs', '--self-test']],
  ['agentSchema', ['scripts/agent-schema-test.mjs']],
  ['agentApiHardening', ['scripts/agent-api-hardening-test.mjs']],
  ['wave30Hail', ['--import', ...css, 'scripts/wave30-hail-probe.mjs']],
  ['wave127And132', ['--import', ...css, 'scripts/wave127-132-probe.mjs']],
];

const results = [];
for (const [name, args] of checks) {
  const started = Date.now();
  console.log(`\n=== focused release regression: ${name} ===`);
  const run = spawnSync(process.execPath, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });
  results.push({
    name,
    pass: run.status === 0,
    exitCode: run.status,
    signal: run.signal || null,
    error: run.error?.message || null,
    durationMs: Date.now() - started,
  });
}

const pass = results.every((result) => result.pass);
const evidence = {
  schemaVersion: 1,
  verdict: pass ? 'PASS' : 'FAIL',
  checks: results,
};
const outDir = path.join(root, 'out', 'release-candidate');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  path.join(outDir, 'focused-regressions.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
  'utf8',
);

console.log(`\nFOCUSED RELEASE REGRESSIONS ${evidence.verdict} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exitCode = pass ? 0 : 1;
