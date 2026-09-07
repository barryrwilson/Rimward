/**
 * Build the compact, machine-readable verdict for release-candidate.yml.
 * Gate commands run in separate workflow steps so one failure cannot hide the
 * results of later gates. This script only summarizes their recorded outcomes.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out', 'release-candidate');
const expectedSha = String(process.env.RELEASE_SHA || '').toLowerCase();
const checkedOutSha = String(process.env.CHECKED_OUT_SHA || '').toLowerCase();

const gateKeys = [
  ['nodeSetup', 'NODE_SETUP_OUTCOME'],
  ['npmCi', 'NPM_CI_OUTCOME'],
  ['build', 'BUILD_OUTCOME'],
  ['releasePackage', 'PACKAGE_OUTCOME'],
  ['bootHarness', 'BOOT_OUTCOME'],
  ['focusedRegressions', 'FOCUSED_OUTCOME'],
  ['agentBridgeSmoke', 'BRIDGE_OUTCOME'],
  ['modelsLive', 'RW008_OUTCOME'],
  ['optionalLive', 'OPT001_OUTCOME'],
  ['dependencyAudit', 'AUDIT_OUTCOME'],
];

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  } catch {
    return null;
  }
}

async function readText(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), 'utf8');
  } catch {
    return null;
  }
}

async function readBridgePins() {
  try {
    const text = await readFile(path.join(outDir, 'agent-bridge-smoke.txt'), 'utf8');
    const match = text.match(/\{\s*"healthReady"[\s\S]*\}\s*$/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

function browserEvidence(probe, collectionKey) {
  const collection = probe && probe[collectionKey] && typeof probe[collectionKey] === 'object'
    ? probe[collectionKey]
    : {};
  const checks = Object.values(collection);
  return {
    sourceSha: typeof probe?.commit === 'string' ? probe.commit.toLowerCase() : null,
    checkNames: Object.keys(collection),
    checks: checks.length,
    checksPassed: checks.filter((value) => value?.pass === true).length,
    consoleErrors: Array.isArray(probe?.consoleErrors) ? probe.consoleErrors.length : null,
    exceptions: Array.isArray(probe?.exceptions) ? probe.exceptions.length : null,
    reportedVerdict: probe?.verdict || (probe?.summary?.ok === true ? 'PASS' : null),
    profileRemoved: probe?.profileRemoved ?? null,
  };
}

await mkdir(outDir, { recursive: true });

const [focused, rw008, opt001, audit, productionAudit, bridgePins, packageJson, releaseManifest] = await Promise.all([
  readJson('out/release-candidate/focused-regressions.json'),
  readJson('out/rw008/verify/probes.json'),
  readJson('out/w143/opt001/verify/probes.json'),
  readJson('out/release-candidate/npm-audit.json'),
  readJson('out/release-candidate/npm-audit-production.json'),
  readBridgePins(),
  readJson('package.json'),
  readJson('out/release-candidate/release-manifest.json'),
]);

const archiveName = typeof releaseManifest?.archive?.name === 'string'
  ? releaseManifest.archive.name
  : null;
const archiveNameSafe = archiveName != null && path.basename(archiveName) === archiveName;
let archiveBytes = null;
let archiveDigest = null;
let checksumText = null;
if (archiveNameSafe) {
  try {
    const archive = await readFile(path.join(outDir, archiveName));
    archiveBytes = archive.byteLength;
    archiveDigest = createHash('sha256').update(archive).digest('hex');
  } catch {
    // Missing archive is reported by the fail-closed evidence checks below.
  }
  checksumText = await readText(`out/release-candidate/${archiveName}.sha256`);
}

const gates = Object.fromEntries(gateKeys.map(([key, env]) => [key, {
  outcome: process.env[env] || 'unknown',
  pass: process.env[env] === 'success',
}]));

const shaVerified = /^[0-9a-f]{40}$/.test(expectedSha) && checkedOutSha === expectedSha;
const rw008Evidence = browserEvidence(rw008, 'flows');
const opt001Evidence = browserEvidence(opt001, 'surfaces');
const auditCounts = audit?.metadata?.vulnerabilities || null;
const productionAuditCounts = productionAudit?.metadata?.vulnerabilities || null;
const requiredFocusedChecks = [
  'dockApproach',
  'padGovernor',
  'runtimeErrorUx',
  'pauseRecovery',
  'pausedInput',
  'shipMaterialRelease',
  'agentBridge',
  'agentSchema',
  'agentApiHardening',
  'wave30Hail',
  'wave127And132',
];
const requiredModelsFlows = [
  'V1', 'V2', 'V3', 'V4', 'V6', 'V6b', 'V6c', 'V7', 'V8', 'V9', 'V10',
];
const requiredOptionalSurfaces = [
  'Hail01', 'HUD-06', 'Hail02', 'HUD-07', 'NAV-09', 'TGT-07', 'CTL-03',
];
const requiredBridgePins = [
  'healthReady',
  'liveFwd',
  'httpPing',
  'wsPing',
  'forbiddenTeleport',
  'originChosen',
  'approachObserved',
  'approachBraked',
  'approachDocked',
  'approachUndocked',
  'consoleClean',
  'loopAlive',
  'systemTransition',
  'teardownPortsFree',
];
const bridgeEvidence = Object.fromEntries(
  requiredBridgePins.map((key) => [key, bridgePins?.[key] ?? null]),
);
const focusedChecks = Array.isArray(focused?.checks) ? focused.checks : [];

function highAndCriticalAreZero(counts) {
  return counts != null && counts.high === 0 && counts.critical === 0;
}

function exactNames(actual, required) {
  return actual.length === required.length && required.every((name) => actual.includes(name));
}

const evidenceChecks = {
  packageVersion: releaseManifest?.version === packageJson?.version
    && releaseManifest?.schemaVersion === 1
    && releaseManifest?.tag === `v${packageJson?.version}`
    && archiveName === `rimward-v${packageJson?.version}-dist.zip`,
  packageSourceSha: releaseManifest?.commitSha === expectedSha,
  packageArchive: archiveNameSafe
    && releaseManifest?.distribution === 'static-dist'
    && releaseManifest?.entrypoint === 'dist/index.html'
    && releaseManifest?.basePath === '/'
    && releaseManifest?.requiresHttp === true
    && releaseManifest?.archive?.checksumFile === `${archiveName}.sha256`
    && archiveBytes > 0
    && archiveBytes === releaseManifest?.archive?.bytes
    && archiveDigest === releaseManifest?.archive?.sha256
    && checksumText?.trim() === `${archiveDigest}  ${archiveName}`,
  focusedRegressions: focused?.verdict === 'PASS'
    && exactNames(focusedChecks.map((check) => check?.name), requiredFocusedChecks)
    && focusedChecks.every((check) => check?.pass === true),
  bridgePins: requiredBridgePins.every((key) => bridgePins?.[key] === true),
  bridgeTeardown: bridgePins?.teardownPortsFree === true,
  modelsSourceSha: rw008Evidence.sourceSha === expectedSha,
  modelsFlows: rw008Evidence.reportedVerdict === 'PASS'
    && exactNames(rw008Evidence.checkNames, requiredModelsFlows)
    && rw008Evidence.checksPassed === 11,
  modelsConsoleClean: rw008Evidence.consoleErrors === 0 && rw008Evidence.exceptions === 0,
  modelsProfileRemoved: rw008Evidence.profileRemoved === true,
  optionalSourceSha: opt001Evidence.sourceSha === expectedSha,
  optionalSurfaces: opt001Evidence.reportedVerdict === 'PASS'
    && exactNames(opt001Evidence.checkNames, requiredOptionalSurfaces)
    && opt001Evidence.checksPassed === 7,
  optionalConsoleClean: opt001Evidence.consoleErrors === 0 && opt001Evidence.exceptions === 0,
  fullAuditHighClean: highAndCriticalAreZero(auditCounts),
  productionAuditHighClean: highAndCriticalAreZero(productionAuditCounts),
};

const pass = shaVerified
  && Object.values(gates).every((gate) => gate.pass)
  && Object.values(evidenceChecks).every(Boolean);

const result = {
  schemaVersion: 2,
  verdict: pass ? 'PASS' : 'FAIL',
  requestedSha: expectedSha || null,
  checkedOutSha: checkedOutSha || null,
  shaVerified,
  generatedAt: new Date().toISOString(),
  gates,
  evidenceChecks,
  browser: {
    models: rw008Evidence,
    optionalSurfaces: opt001Evidence,
  },
  bridge: bridgeEvidence,
  releasePackage: {
    manifest: releaseManifest,
    observedArchiveBytes: archiveBytes,
    observedArchiveSha256: archiveDigest,
  },
  dependencyAudit: {
    allDependencies: auditCounts,
    productionDependencies: productionAuditCounts,
    reports: {
      allDependencies: audit ? 'npm-audit.json' : null,
      productionDependencies: productionAudit ? 'npm-audit-production.json' : null,
    },
  },
};

const rows = Object.entries(gates)
  .map(([name, gate]) => `| ${name} | ${gate.pass ? 'PASS' : 'FAIL'} | ${gate.outcome} |`);
const evidenceRows = Object.entries(evidenceChecks)
  .map(([name, ok]) => `| ${name} | ${ok ? 'PASS' : 'FAIL'} |`);
const summary = [
  '# Release candidate verdict',
  '',
  `Verdict: **${result.verdict}**`,
  '',
  `Requested SHA: \`${result.requestedSha || 'missing'}\``,
  '',
  `Checked-out SHA: \`${result.checkedOutSha || 'missing'}\``,
  '',
  '| Gate | Result | Workflow outcome |',
  '|---|---|---|',
  ...rows,
  '',
  '| Evidence assertion | Result |',
  '|---|---|',
  ...evidenceRows,
  '',
  `Models console errors/exceptions: ${rw008Evidence.consoleErrors ?? 'missing'}/${rw008Evidence.exceptions ?? 'missing'}.`,
  '',
  `OPT-001 console errors/exceptions: ${opt001Evidence.consoleErrors ?? 'missing'}/${opt001Evidence.exceptions ?? 'missing'}.`,
  '',
  `Bridge pins passed: ${requiredBridgePins.filter((key) => bridgePins?.[key] === true).length}/${requiredBridgePins.length}.`,
  '',
  `Bridge ports released: ${bridgePins?.teardownPortsFree === true ? 'yes' : 'no or missing'}.`,
  '',
  `Release package: ${archiveName || 'missing'} (${archiveDigest || 'missing checksum'}).`,
  '',
  `Full dependency audit high/critical: ${auditCounts?.high ?? 'missing'}/${auditCounts?.critical ?? 'missing'}.`,
  '',
  `Production dependency audit high/critical: ${productionAuditCounts?.high ?? 'missing'}/${productionAuditCounts?.critical ?? 'missing'}.`,
  '',
];

await Promise.all([
  writeFile(path.join(outDir, 'release-verdict.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8'),
  writeFile(path.join(outDir, 'release-verdict.md'), `${summary.join('\n')}\n`, 'utf8'),
]);

console.log(`RELEASE CANDIDATE ${result.verdict} ${result.requestedSha || 'missing-sha'}`);
