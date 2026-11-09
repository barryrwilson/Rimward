import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import {
  auditBrowserModules,
  BUNDLE_BUDGET,
  evaluateByteBudget,
  formatBytes,
  measureJavaScript,
} from './scripts/bundle-policy.mjs';

// esbuild writes large transform results to a temp file and then unlinks it.
// On a Windows file sandbox the platform temp directory can be writable but
// not deletable, which fails the build; keep the build's temp files inside the
// repo instead. The path is under the ignored out/ tree.
const buildTemp = fileURLToPath(new URL('./out/build-tmp', import.meta.url));
mkdirSync(buildTemp, { recursive: true });
process.env.TEMP = buildTemp;
process.env.TMP = buildTemp;

function productionBundlePolicy() {
  return {
    name: 'rimward-production-bundle-policy',
    apply: 'build',
    generateBundle(_options, bundle) {
      const measured = measureJavaScript(bundle);
      const audit = auditBrowserModules(measured.chunks);
      const bytePolicy = evaluateByteBudget(measured);
      const failures = [];

      if (!bytePolicy.minifiedPass && !bytePolicy.exception) {
        failures.push(
          `minified JavaScript ${measured.minifiedBytes} B exceeds ${BUNDLE_BUDGET.minifiedBytes} B`,
        );
      }
      if (!bytePolicy.gzipPass && !bytePolicy.exception) {
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

      if (bytePolicy.exception) {
        this.warn(`Exact-artifact byte exception: ${bytePolicy.exception.approvalReference}; ${bytePolicy.exception.releaseNotes}`);
      }

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
  preview: {
    // Bind the preview server to IPv4 loopback (issue #302). Vite's default
    // host is "localhost", and Node binds the first resolved address: on
    // machines whose resolver answers ::1 first, bare `npm run preview`
    // serves only IPv6 and the agent bridge's Chrome --game-url
    // http://127.0.0.1:<port>/ cannot connect, surfacing two hops away as
    // "cdp attach failed". Every in-repo harness already forces
    // --host 127.0.0.1; this gives the documented by-hand path the same
    // loopback-only reachability without a flag.
    host: '127.0.0.1',
  },
  plugins: [productionBundlePolicy()],
});
