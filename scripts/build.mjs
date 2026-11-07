/** Production build wrapper (issue #286).
 *
 * Runs the same vite build the package script always ran, but:
 *  1. prefers vite's native config loader, removing the config-bundling
 *     esbuild child process (one less spawn on every machine, identical
 *     bundle output), and
 *  2. when the platform refuses to spawn build child processes (Windows file
 *     sandbox denies piped children with spawn EPERM), replaces the raw
 *     EPERM stack with a loud, named failure that says what happened and how
 *     to proceed. No assertion or budget is weakened: the build still exits
 *     non-zero and never silently produces a partial dist/.
 *
 * Deliberately NOT done: swapping minifiers or adding dependencies to force a
 * zero-spawn build — vite's transpile/minify pipeline spawns esbuild, and a
 * byte-different unminified escape hatch would silently change release
 * evidence. A restricted sandbox gets a clear refusal, not a degraded build.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

function isSpawnRefusal(text) {
  return /spawn(Sync)?\s+(.*\s)?EPERM\b/.test(text) || /Error: spawn EPERM/.test(text);
}

function run(args) {
  const run = spawnSync(process.execPath, [vite, ...args], {
    cwd: root, encoding: 'utf8', windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  });
  return {
    code: run.status,
    out: (run.stdout || '') + (run.stderr || ''),
    refused: run.error && (run.error.code === 'EPERM' || run.error.code === 'EACCES'),
  };
}

console.log('rimward build: vite build --configLoader native');
const first = run(['build', '--configLoader', 'native']);
process.stdout.write(first.out);

if (first.code === 0) process.exit(0);

// Classify the failure for the restricted-sandbox case before re-running or exiting.
const refusalInLog = isSpawnRefusal(first.out) || first.refused;
if (!refusalInLog) process.exit(first.code ?? 1);

console.error([
  '',
  'BUILD REFUSED: the platform sandbox denied spawning build child processes.',
  'vite needs to spawn its esbuild service; the sandbox answers spawn EPERM.',
  'This is an environment restriction, not a source or dependency failure.',
  'Re-run with the sandbox lifted (danger-full-access), or outside the',
  'restricted file sandbox. The build produced no usable dist/ and exits 1.',
  '',
].join('\n'));
process.exit(1);
