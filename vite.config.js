import { defineConfig } from 'vite';
import {
  auditBrowserModules,
  BUNDLE_BUDGET,
  formatBytes,
  measureJavaScript,
} from './scripts/bundle-policy.mjs';

function productionBundlePolicy() {
  return {
    name: 'rimward-production-bundle-policy',
    apply: 'build',
    generateBundle(_options, bundle) {
      const measured = measureJavaScript(bundle);
      const audit = auditBrowserModules(measured.chunks);
      const failures = [];

      if (measured.minifiedBytes > BUNDLE_BUDGET.minifiedBytes) {
        failures.push(
          `minified JavaScript ${measured.minifiedBytes} B exceeds ${BUNDLE_BUDGET.minifiedBytes} B`,
        );
      }
      if (measured.gzipBytes > BUNDLE_BUDGET.gzipBytes) {
        failures.push(
          `gzip JavaScript ${measured.gzipBytes} B exceeds ${BUNDLE_BUDGET.gzipBytes} B`,
        );
      }
      if (!audit.pass) {
        failures.push(
          `browser bundle contains non-runtime modules: ${[
            ...audit.unexpectedPackages,
            ...audit.forbiddenSources,
          ].join(', ')}`,
        );
      }
      if (failures.length) this.error(`Rimward production bundle policy failed:\n- ${failures.join('\n- ')}`);

      this.info(
        `Rimward bundle policy: ${formatBytes(measured.minifiedBytes)} minified, `
          + `${formatBytes(measured.gzipBytes)} gzip; browser packages: ${audit.packages.join(', ')}`,
      );
    },
  };
}

export default defineConfig({
  build: {
    // Vite's generic 500 kB chunk warning is not the release policy for this
    // Three.js game. The plugin above enforces both total minified and gzip
    // budgets, including builds that later split into multiple chunks.
    chunkSizeWarningLimit: BUNDLE_BUDGET.minifiedBytes / 1000,
  },
  plugins: [productionBundlePolicy()],
});
