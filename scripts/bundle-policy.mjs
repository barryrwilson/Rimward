import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

export const BUNDLE_BUDGET = Object.freeze({
  minifiedBytes: 1_800_000,
  gzipBytes: 525 * 1024,
});

// Owner-approved exact artifact; see the recorded approval and measurements.
// No environment bypass or allowance for future bundle growth.
const APPROVED_BYTE_EXCEPTION = {
  approved: true,
  approvalReference: 'Codex issue-100 owner approval of exact byte exception, 2026-09-10',
  releaseNotes: 'docs/releases/issue-100-measured-decision.md',
  minifiedBytes: 1_835_953,
  gzipBytes: 549_263,
  chunks: [{
    file: 'assets/index-CY-oCepC.js',
    sha256: '31e00966d7d17708ab99d0f81a31488bd3e45c4e0a998f062c09e9433ea36eb1',
    minifiedBytes: 1_835_953,
    gzipBytes: 549_263,
  }],
};

function packageName(moduleId) {
  const normalized = moduleId.replaceAll('\\', '/');
  const marker = '/node_modules/';
  const index = normalized.lastIndexOf(marker);
  if (index === -1) return null;
  const rest = normalized.slice(index + marker.length).split('/');
  return rest[0]?.startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0];
}

export function measureJavaScript(bundle) {
  const chunks = Object.values(bundle).filter((item) => item.type === 'chunk');
  const artifacts = chunks.map((chunk) => ({
    file: chunk.fileName,
    sha256: createHash('sha256').update(chunk.code).digest('hex'),
    minifiedBytes: Buffer.byteLength(chunk.code),
    gzipBytes: gzipSync(Buffer.from(chunk.code)).byteLength,
  })).sort((a, b) => a.file.localeCompare(b.file));
  return {
    chunks,
    artifacts,
    minifiedBytes: artifacts.reduce((total, chunk) => total + chunk.minifiedBytes, 0),
    gzipBytes: artifacts.reduce((total, chunk) => total + chunk.gzipBytes, 0),
  };
}

/** Byte approval never waives browser-boundary or startup requirements. */
export function evaluateByteBudget(measured) {
  const minifiedPass = measured.minifiedBytes <= BUNDLE_BUDGET.minifiedBytes;
  const gzipPass = measured.gzipBytes <= BUNDLE_BUDGET.gzipBytes;
  const approved = APPROVED_BYTE_EXCEPTION;
  let exception = null;
  if (approved?.approved === true && typeof approved.approvalReference === 'string'
      && approved.approvalReference.trim() && typeof approved.releaseNotes === 'string'
      && approved.releaseNotes.trim() && Array.isArray(approved.chunks)
      && approved.chunks.length > 0 && approved.chunks.every((chunk) =>
        chunk && typeof chunk.file === 'string' && chunk.file
        && /^[a-f0-9]{64}$/.test(chunk.sha256)
        && Number.isSafeInteger(chunk.minifiedBytes) && chunk.minifiedBytes > 0
        && Number.isSafeInteger(chunk.gzipBytes) && chunk.gzipBytes > 0)) {
    const expected = [...approved.chunks].sort((a, b) => a.file.localeCompare(b.file));
    if (new Set(expected.map((chunk) => chunk.file)).size === expected.length
        && new Set(measured.artifacts.map((chunk) => chunk.file)).size === measured.artifacts.length
        && approved.minifiedBytes === measured.minifiedBytes
        && approved.gzipBytes === measured.gzipBytes
        && expected.length === measured.artifacts.length
        && expected.every((chunk, i) => ['file', 'sha256', 'minifiedBytes', 'gzipBytes']
          .every((key) => chunk[key] === measured.artifacts[i][key]))) {
      exception = { approvalReference: approved.approvalReference, releaseNotes: approved.releaseNotes };
    }
  }
  return { minifiedPass, gzipPass, exception, pass: (minifiedPass && gzipPass) || exception !== null };
}

export function auditBrowserModules(chunks, runtimePackages = ['three']) {
  const moduleIds = chunks.flatMap((chunk) => Object.keys(chunk.modules));
  const packages = [...new Set(moduleIds.map(packageName).filter(Boolean))].sort();
  const unexpectedPackages = packages.filter((name) => !runtimePackages.includes(name));
  const forbiddenSources = moduleIds.filter((id) => {
    const normalized = id.replaceAll('\\', '/');
    return normalized.startsWith('node:')
      || normalized.includes('__vite-browser-external')
      || normalized.includes('/assets-source/')
      || normalized.includes('/scripts/');
  });
  return {
    packages,
    unexpectedPackages,
    forbiddenSources,
    pass: unexpectedPackages.length === 0 && forbiddenSources.length === 0,
  };
}

export function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}
