import { gzipSync } from 'node:zlib';

export const BUNDLE_BUDGET = Object.freeze({
  minifiedBytes: 1_800_000,
  gzipBytes: 525 * 1024,
});

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
  return {
    chunks,
    minifiedBytes: chunks.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0),
    gzipBytes: chunks.reduce(
      (total, chunk) => total + gzipSync(Buffer.from(chunk.code)).byteLength,
      0,
    ),
  };
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
