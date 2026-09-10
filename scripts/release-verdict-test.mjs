/** Exercise the actual release verdict CLI with isolated, synthetic evidence. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(path.join(tmpdir(), 'rimward-release-verdict-'));
const sha = 'a'.repeat(40);
const required = [
  'dockApproach', 'padGovernor', 'runtimeErrorUx', 'pauseRecovery', 'pausedInput',
  'shipMaterialRelease', 'agentBridge', 'agentSchema', 'hailIdentity',
  'combatIntent', 'reactiveDefense', 'agentApiHardening', 'wave30Hail', 'wave127And132',
];
const gateEnv = [
  'NODE_SETUP_OUTCOME', 'NPM_CI_OUTCOME', 'BUILD_OUTCOME', 'PACKAGE_OUTCOME',
  'BOOT_OUTCOME', 'FOCUSED_OUTCOME', 'BRIDGE_OUTCOME', 'RW008_OUTCOME',
  'OPT001_OUTCOME', 'AUDIT_OUTCOME',
];
const write = (relative, value) => {
  const target = path.join(fixture, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
};
let pins = 0;
try {
  mkdirSync(path.join(fixture, 'scripts'));
  cpSync(path.join(root, 'scripts/release-verdict.mjs'), path.join(fixture, 'scripts/release-verdict.mjs'));
  write('package.json', { version: '0.1.0' });
  const archiveName = 'rimward-v0.1.0-dist.zip';
  // The verdict validates byte identity; archive format is the packaging gate's job.
  const archive = 'synthetic release archive fixture\n';
  const digest = createHash('sha256').update(archive).digest('hex');
  write(`out/release-candidate/${archiveName}`, archive);
  write(`out/release-candidate/${archiveName}.sha256`, `${digest}  ${archiveName}\n`);
  write('out/release-candidate/release-manifest.json', {
    schemaVersion: 1, version: '0.1.0', tag: 'v0.1.0', commitSha: sha,
    distribution: 'static-dist', entrypoint: 'dist/index.html', basePath: '/', requiresHttp: true,
    archive: { name: archiveName, bytes: Buffer.byteLength(archive), sha256: digest, checksumFile: `${archiveName}.sha256` },
  });
  const browser = (key, names) => ({
    commit: sha, verdict: 'PASS', consoleErrors: [], exceptions: [], profileRemoved: true,
    [key]: Object.fromEntries(names.map((name) => [name, { pass: true }])),
  });
  const models = browser('flows', [
    'V1', 'V2', 'V3', 'V4', 'V6', 'V6b', 'V6c', 'V7', 'V8', 'V9', 'V10', 'V11',
  ]);
  write('out/rw008/verify/probes.json', models);
  write('out/w143/opt001/verify/probes.json', browser('surfaces', [
    'Hail01', 'HUD-06', 'Hail02', 'HUD-07', 'NAV-09', 'TGT-07', 'CTL-03',
  ]));
  const bridge = Object.fromEntries([
    'healthReady', 'liveFwd', 'httpPing', 'wsPing', 'forbiddenTeleport', 'originChosen',
    'approachObserved', 'approachBraked', 'approachDocked', 'approachUndocked',
    'consoleClean', 'loopAlive', 'systemTransition', 'teardownPortsFree',
  ].map((name) => [name, true]));
  write('out/release-candidate/agent-bridge-smoke.txt', JSON.stringify(bridge));
  for (const name of ['npm-audit.json', 'npm-audit-production.json']) {
    write(`out/release-candidate/${name}`, { metadata: { vulnerabilities: { high: 0, critical: 0 } } });
  }
  const complete = required.map((name) => ({ name, pass: true }));
  function verify(label, checks, expected, verdict = 'PASS', overrides = {}, expectedModels = true) {
    write('out/release-candidate/focused-regressions.json', { verdict, checks });
    const run = spawnSync(process.execPath, [path.join(fixture, 'scripts/release-verdict.mjs')], {
      cwd: fixture, windowsHide: true, encoding: 'utf8',
      env: { ...process.env, RELEASE_SHA: sha, CHECKED_OUT_SHA: sha,
        ...Object.fromEntries(gateEnv.map((key) => [key, 'success'])), ...overrides },
    });
    assert.equal(run.status, 0, `${label}: CLI crashed: ${run.stderr}`);
    const result = JSON.parse(readFileSync(path.join(fixture, 'out/release-candidate/release-verdict.json'), 'utf8'));
    assert.equal(result.evidenceChecks.focusedRegressions, expected, `${label}: focused evidence`);
    assert.equal(result.evidenceChecks.modelsFlows, expectedModels, `${label}: Models evidence`);
    assert.equal(result.verdict, expected && expectedModels && !Object.keys(overrides).length ? 'PASS' : 'FAIL', `${label}: final verdict`);
    pins++;
  }
  verify('complete fourteen-check release evidence', complete, true);
  verify('order does not matter', [...complete].reverse(), true);
  for (const name of required) {
    verify(`missing ${name}`, complete.filter((check) => check.name !== name), false);
  }
  verify('duplicate replacing hail identity', complete.map((check) => check.name === 'hailIdentity' ? { name: 'agentSchema', pass: true } : check), false);
  verify('extra duplicate', [...complete, complete[0]], false);
  verify('unexpected name', [...complete, { name: 'unknown', pass: true }], false);
  verify('failed required defense check', complete.map((check) => ({ ...check, pass: check.name !== 'reactiveDefense' })), false);
  verify('truthy nonboolean result', complete.map((check) => ({ ...check, pass: check.name === 'combatIntent' ? 'true' : true })), false);
  verify('failed focused summary', complete, false, 'FAIL');
  verify('missing checks', null, false);
  verify('successful evidence cannot override failed workflow', complete, true, 'PASS', { FOCUSED_OUTCOME: 'failure' });
  verify('successful evidence cannot override wrong checkout', complete, true, 'PASS', { CHECKED_OUT_SHA: 'b'.repeat(40) });
  delete models.flows.V11;
  write('out/rw008/verify/probes.json', models);
  verify('missing required Models V11', complete, true, 'PASS', {}, false);
  models.flows.V11 = { pass: false };
  write('out/rw008/verify/probes.json', models);
  verify('failed required Models V11', complete, true, 'PASS', {}, false);
  console.log(`RELEASE VERDICT CONTRACT PASS (${pins} scenarios)`);
} finally {
  // mkdtemp owns this exact directory; never touches live release evidence.
  rmSync(fixture, { recursive: true, force: true });
}
