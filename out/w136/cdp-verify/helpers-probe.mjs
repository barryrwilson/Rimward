import {
  parseDevToolsActivePort,
  readDevToolsActivePortFile,
  pageUrlMatchesGame,
  pickMatchingPage,
  assertBindHost,
} from '../../../scripts/agent-bridge.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const checks = [];
function check(name, ok) {
  checks.push({ name, ok: !!ok });
}

check('parse-valid', (() => {
  const p = parseDevToolsActivePort('49152\n/devtools/browser/fixture-id\n');
  return p && p.port === 49152 && p.browserPath === '/devtools/browser/fixture-id';
})());
check('parse-crlf', parseDevToolsActivePort('8080\r\n/devtools/browser/x\r\n')?.port === 8080);
check('parse-reject-text', parseDevToolsActivePort('not-a-port\n/x') == null);
check('parse-reject-zero', parseDevToolsActivePort('0\n/x') == null);
check('parse-reject-65536', parseDevToolsActivePort('65536\n/x') == null);
check('parse-accept-65535', parseDevToolsActivePort('65535\n/x')?.port === 65535);
check('parse-reject-empty', parseDevToolsActivePort('') == null);
check('parse-reject-negative', parseDevToolsActivePort('-1\n/x') == null);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-dtap-verify-'));
try {
  fs.writeFileSync(path.join(tmp, 'DevToolsActivePort'), '12345\n/devtools/browser/abc\n', 'utf8');
  const got = readDevToolsActivePortFile(tmp);
  check('read-file', !!got && got.port === 12345);
  check('read-missing', readDevToolsActivePortFile(path.join(tmp, 'no-such')) == null);
} finally {
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
}

const game = 'http://127.0.0.1:5173/index.html';
check('match-extra-query', pageUrlMatchesGame('http://127.0.0.1:5173/index.html?agent=1&x=1', game) === true);
check('match-game-has-query', pageUrlMatchesGame(game, 'http://127.0.0.1:5173/index.html?agent=1') === true);
check('match-trailing-slash', pageUrlMatchesGame('http://127.0.0.1:5173/index.html/', game) === true);
check('mismatch-path', pageUrlMatchesGame('http://127.0.0.1:5173/other.html', game) === false);
check('mismatch-port', pageUrlMatchesGame('http://127.0.0.1:5174/index.html', game) === false);
check('mismatch-host', pageUrlMatchesGame('http://localhost:5173/index.html', game) === false);
check('mismatch-proto', pageUrlMatchesGame('https://127.0.0.1:5173/index.html', game) === false);

const pages = [
  { type: 'browser', url: game, webSocketDebuggerUrl: 'ws://127.0.0.1:9/browser' },
  { type: 'page', url: 'http://127.0.0.1:5173/other.html', webSocketDebuggerUrl: 'ws://127.0.0.1:9/other' },
  { type: 'page', url: game + '?agent=1', webSocketDebuggerUrl: 'ws://8.8.8.8:9/remote' },
  { type: 'page', url: game + '?agent=1', webSocketDebuggerUrl: 'ws://127.0.0.1:9/hit' },
];
check('pick-matching-among-noise', pickMatchingPage(pages, game)?.webSocketDebuggerUrl === 'ws://127.0.0.1:9/hit');
check('pick-no-unrelated-fallback', pickMatchingPage([
  { type: 'page', url: 'http://127.0.0.1:5173/other.html', webSocketDebuggerUrl: 'ws://127.0.0.1:9/x' },
], game) === null);
check('pick-no-gameurl-agent-fallback', pickMatchingPage([
  { type: 'page', url: 'http://127.0.0.1:9/x?agent=1', webSocketDebuggerUrl: 'ws://127.0.0.1:9/x' },
], '')?.url === 'http://127.0.0.1:9/x?agent=1');

try {
  assertBindHost('0.0.0.0');
  check('bind-all-v4-throws', false);
} catch (err) {
  check('bind-all-v4-throws', err && err.code === 'BIND_REFUSED');
}

const failed = checks.filter((c) => !c.ok);
process.stdout.write(JSON.stringify({ ok: failed.length === 0, checks, failed: failed.map((c) => c.name) }, null, 2) + '\n');
process.exit(failed.length === 0 ? 0 : 1);
