/** Reproducible production bundle composition and browser-boundary report. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import {
  auditBrowserModules,
  BUNDLE_BUDGET,
  formatBytes,
  measureJavaScript,
} from './bundle-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({
  root,
  logLevel: 'silent',
  build: { write: false },
});
const output = Array.isArray(result)
  ? result.flatMap((entry) => entry.output ?? [])
  : result.output ?? [];
const chunks = output.filter((item) => item.type === 'chunk');
const bundle = Object.fromEntries(output.map((item) => [item.fileName, item]));
const measured = measureJavaScript(bundle);
const audit = auditBrowserModules(chunks);
const modules = chunks.flatMap((chunk) => Object.entries(chunk.modules).map(([id, detail]) => ({
  chunk: chunk.fileName,
  module: id.replaceAll('\\', '/').replace(root.replaceAll('\\', '/'), '.'),
  renderedBytes: detail.renderedLength,
})));
modules.sort((a, b) => b.renderedBytes - a.renderedBytes || a.module.localeCompare(b.module));
const renderedBytes = modules.reduce((total, module) => total + module.renderedBytes, 0);
const report = {
  budgets: BUNDLE_BUDGET,
  totals: {
    chunks: measured.chunks.length,
    modules: modules.length,
    minifiedBytes: measured.minifiedBytes,
    gzipBytes: measured.gzipBytes,
    minifiedPass: measured.minifiedBytes <= BUNDLE_BUDGET.minifiedBytes,
    gzipPass: measured.gzipBytes <= BUNDLE_BUDGET.gzipBytes,
  },
  browserBoundary: audit,
  chunks: measured.chunks.map((chunk) => ({
    file: chunk.fileName,
    minifiedBytes: Buffer.byteLength(chunk.code),
    modules: Object.keys(chunk.modules).length,
  })),
  topModules: modules.slice(0, 20).map((module) => ({
    ...module,
    renderedShare: renderedBytes === 0 ? 0 : module.renderedBytes / renderedBytes,
  })),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Rimward production bundle composition');
  console.log(`JavaScript: ${formatBytes(report.totals.minifiedBytes)} minified / ${formatBytes(report.totals.gzipBytes)} gzip`);
  console.log(`Budget:     ${formatBytes(BUNDLE_BUDGET.minifiedBytes)} minified / ${formatBytes(BUNDLE_BUDGET.gzipBytes)} gzip`);
  console.log(`Chunks: ${report.totals.chunks}; modules: ${report.totals.modules}`);
  console.log(`Browser packages: ${audit.packages.join(', ') || '(none)'}`);
  console.log(`Node-only boundary: ${audit.pass ? 'PASS' : 'FAIL'}`);
  console.log('\nTop modules by Rollup-rendered bytes (before minification):');
  for (const module of report.topModules) {
    console.log(
      `${String(module.renderedBytes).padStart(8)}  ${(module.renderedShare * 100).toFixed(1).padStart(5)}%  ${module.module}`,
    );
  }
}

if (!report.totals.minifiedPass || !report.totals.gzipPass || !audit.pass) process.exitCode = 1;
