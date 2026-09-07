/**
 * End-to-end smoke: Vite + loopback agent-bridge CLI + ephemeral Chrome.
 * Prints JSON pins to stdout. Never prints AGENT_TOKEN.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SMOKE_DIR = path.join(ROOT, 'out', 'w136', 'smoke');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const BRIDGE_BIN = path.join(ROOT, 'scripts', 'agent-bridge.mjs');
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const HEALTH_WAIT_MS = 90000;
const JUMP_WAIT_MS = 90000;
const DOCK_WAIT_MS = 60000;
const VITE_WAIT_MS = 25000;
const TOKEN_WAIT_MS = 40000;

const PIN_KEYS = [
  'healthReady',
  'liveFwd',
  'v2Envelope',
  'httpPing',
  'wsPing',
  'forbiddenTeleport',
  'originChosen',
  'approachObserved',
  'approachBraked',
  'approachDocked',
  'dockedEvent',
  'stationViewRows',
  'stationActionBar',
  'stationBarNotice',
  'staleExpectShape',
  'approachUndocked',
  'undockedEvent',
  'leaseActive',
  'leaseExpired',
  'firePath',
  'clearControlOk',
  'combatPath',
  'consoleClean',
  'loopAlive',
  'systemTransition',
  'teardownPortsFree',
];
const LOOP_PROBE_MS = 4000;
const LOOP_T_MIN = 0.25;
// Session events are harvested on the next observe tick, so a fresh lifecycle
// row can land one poll after the flag itself flips. Bounded public polling
// only — no private-state injection.
const EVENT_POLL_TRIES = 6;
const EVENT_POLL_MS = 250;

function hasEventType(snap, type) {
  return !!(snap && Array.isArray(snap.events)
    && snap.events.some((e) => e && typeof e === 'object' && e.type === type));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function redact(text, token) {
  let s = String(text ?? '');
  if (token) s = s.split(token).join('<redacted>');
  s = s.replace(/AGENT_TOKEN=\S+/g, 'AGENT_TOKEN=<redacted>');
  return s;
}

function isFwd(fwd) {
  return Array.isArray(fwd)
    && fwd.length === 3
    && fwd.every((n) => typeof n === 'number' && Number.isFinite(n));
}

function eventTypes(events) {
  if (!Array.isArray(events)) return [];
  const out = [];
  for (let i = 0; i < events.length; i++) {
    const t = events[i] && events[i].type;
    if (typeof t === 'string') out.push(t);
  }
  return out;
}

function hasEvent(events, type) {
  return eventTypes(events).includes(type);
}

function observePin(snap) {
  if (!snap || typeof snap !== 'object') return { ok: false };
  const flags = snap.flags && typeof snap.flags === 'object' ? snap.flags : {};
  const ship = snap.ship && typeof snap.ship === 'object' ? snap.ship : {};
  return {
    ok: snap.ok === true,
    t: typeof snap.t === 'number' && Number.isFinite(snap.t) ? snap.t : null,
    phase: snap.session && snap.session.phase,
    paused: flags.paused === true,
    docked: flags.docked === true,
    berthHold: flags.berthHold === true,
    chartOpen: flags.chartOpen === true,
    fwd: ship.fwd,
    pos: ship.pos,
    speed: ship.speed,
    throttle: ship.throttle,
    currentSystem: snap.world ? snap.world.currentSystem : '',
    origin: snap.world && Object.hasOwn(snap.world, 'origin') ? snap.world.origin : undefined,
    nav: snap.nav || null,
    autopilot: snap.autopilot || null,
    station: snap.station || null,
    gate: snap.gate || null,
    events: eventTypes(snap.events),
  };
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', (err) => resolve(!(err && err.code === 'EADDRINUSE')));
    s.listen(port, '127.0.0.1', () => {
      s.close(() => resolve(true));
    });
  });
}

async function pickPort(lo, hi, prefer) {
  if (prefer != null && prefer >= lo && prefer <= hi && await portFree(prefer)) return prefer;
  for (let p = lo; p <= hi; p++) {
    if (p === prefer) continue;
    if (await portFree(p)) return p;
  }
  return 0;
}

function killTree(pid) {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 0) return;
  spawnSync('taskkill', ['/PID', String(n), '/T', '/F'], {
    stdio: 'ignore',
    windowsHide: true,
  });
}

function killBridgeChrome() {
  spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'chrome' -and $_.CommandLine -match 'rw-agent-bridge-' } | ForEach-Object { taskkill /PID $_.ProcessId /T /F | Out-Null }",
  ], { stdio: 'ignore', windowsHide: true });
}

function httpCall(method, urlStr, { headers = {}, body = null, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = http.request({
      hostname: '127.0.0.1',
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers: { Connection: 'close', ...headers },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('http timeout'));
    });
    req.on('error', reject);
    if (body != null) req.end(body);
    else req.end();
  });
}

function encodeMasked(payload, opcode) {
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
  } else {
    throw new Error('ws payload too large');
  }
  const mask = crypto.randomBytes(4);
  const body = Buffer.alloc(len);
  for (let i = 0; i < len; i++) body[i] = payload[i] ^ mask[i & 3];
  return Buffer.concat([header, mask, body]);
}

function decodeWs(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  let len = buf[1] & 0x7f;
  let off = 2;
  const masked = (buf[1] & 0x80) !== 0;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    off = 4;
  } else if (len === 127) {
    return { overflow: true, rest: Buffer.alloc(0) };
  }
  const maskLen = masked ? 4 : 0;
  if (buf.length < off + maskLen + len) return null;
  let payload = buf.subarray(off + maskLen, off + maskLen + len);
  if (masked) {
    const mask = buf.subarray(off, off + 4);
    const out = Buffer.alloc(len);
    for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
    payload = out;
  }
  return { opcode, payload, rest: buf.subarray(off + maskLen + len) };
}

function wsHandshake(port) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const expect = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
    const sock = net.connect({ host: '127.0.0.1', port }, () => {
      sock.write(
        'GET / HTTP/1.1\r\n'
        + `Host: 127.0.0.1:${port}\r\n`
        + 'Upgrade: websocket\r\n'
        + 'Connection: Upgrade\r\n'
        + `Sec-WebSocket-Key: ${key}\r\n`
        + 'Sec-WebSocket-Version: 13\r\n'
        + '\r\n',
      );
    });
    let buf = Buffer.alloc(0);
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf('\r\n\r\n');
      if (idx < 0) return;
      const head = buf.subarray(0, idx).toString('utf8');
      if (!/^HTTP\/1\.1 101 /m.test(head) || !head.includes(expect)) {
        sock.destroy();
        reject(new Error('ws handshake'));
        return;
      }
      sock.removeListener('data', onData);
      resolve({ sock, rest: buf.subarray(idx + 4) });
    };
    sock.on('data', onData);
    sock.on('error', reject);
    sock.setTimeout(10000, () => {
      sock.destroy();
      reject(new Error('ws timeout'));
    });
  });
}

async function readWsJson(sock, startBuf, timeoutMs) {
  let buf = startBuf;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    while (true) {
      const frame = decodeWs(buf);
      if (!frame) break;
      if (frame.overflow) throw new Error('ws overflow');
      buf = frame.rest;
      if (frame.opcode === 1) {
        return { json: JSON.parse(frame.payload.toString('utf8')), rest: buf };
      }
    }
    if (Date.now() >= deadline) throw new Error('ws read timeout');
    const chunk = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('ws read timeout')), Math.max(1, deadline - Date.now()));
      sock.once('data', (c) => { clearTimeout(t); resolve(c); });
      sock.once('error', (err) => { clearTimeout(t); reject(err); });
      sock.once('end', () => { clearTimeout(t); reject(new Error('ws end')); });
    });
    buf = Buffer.concat([buf, chunk]);
  }
}

async function wsActPing(port, token) {
  const { sock, rest } = await wsHandshake(port);
  try {
    sock.write(encodeMasked(Buffer.from(JSON.stringify({ token }), 'utf8'), 0x1));
    sock.write(encodeMasked(Buffer.from(JSON.stringify({
      op: 'act', v: 2, name: 'ping', args: {},
    }), 'utf8'), 0x1));
    const got = await readWsJson(sock, rest, 8000);
    const pingOk = !!(got.json && got.json.ok === true);
    let protoPing = false;
    try {
      sock.write(encodeMasked(Buffer.from('smoke', 'utf8'), 0x9));
      let buf = got.rest;
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline && !protoPing) {
        const frame = decodeWs(buf);
        if (!frame) {
          const chunk = await Promise.race([
            new Promise((resolve) => sock.once('data', resolve)),
            sleep(deadline - Date.now()).then(() => null),
          ]);
          if (!chunk) break;
          buf = Buffer.concat([buf, chunk]);
          continue;
        }
        buf = frame.rest;
        if (frame.opcode === 0xA) protoPing = true;
      }
    } catch {
      protoPing = false;
    }
    return { pingOk, protoPing };
  } finally {
    try { sock.end(); } catch { /* ignore */ }
    try { sock.destroy(); } catch { /* ignore */ }
  }
}

function findBridgeProfiles() {
  const tmp = os.tmpdir();
  let names = [];
  try { names = fs.readdirSync(tmp); } catch { return []; }
  const out = [];
  for (const name of names) {
    if (!String(name).startsWith('rw-agent-bridge-')) continue;
    const dir = path.join(tmp, name);
    const file = path.join(dir, 'DevToolsActivePort');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const line = String(text.split(/\r?\n/)[0] || '').trim();
    const port = Number(line);
    if (Number.isInteger(port) && port > 0 && port <= 65535) out.push({ dir, port });
  }
  return out;
}

async function probeCdpPages() {
  const profiles = findBridgeProfiles();
  const pages = [];
  for (const p of profiles) {
    try {
      const res = await fetch(`http://127.0.0.1:${p.port}/json/list`);
      const list = await res.json();
      if (Array.isArray(list)) {
        for (const t of list) {
          pages.push({
            cdpPort: p.port,
            type: t && t.type,
            url: t && t.url,
            title: t && t.title,
            ws: t && t.webSocketDebuggerUrl,
          });
        }
      }
    } catch { /* ignore */ }
  }
  return pages;
}

async function cdpEvalValue(wsUrl, expression) {
  const ws = new WebSocket(wsUrl);
  try {
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true });
      ws.addEventListener('error', () => reject(new Error('cdp ws')), { once: true });
    });
    const id = 1;
    const got = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('cdp eval timeout')), 8000);
      ws.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(String(ev.data)); } catch { return; }
        if (msg.id !== id) return;
        clearTimeout(t);
        if (msg.error) reject(new Error('cdp error'));
        else resolve(msg.result);
      });
    });
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true },
    }));
    const r = await got;
    if (r && r.exceptionDetails) return null;
    return r && r.result ? r.result.value : null;
  } finally {
    try { ws.close(); } catch { /* ignore */ }
  }
}

async function probeGamePage() {
  const pages = await probeCdpPages();
  const page = pages.find((t) => t && t.type === 'page' && String(t.url || '').includes('127.0.0.1')) || pages[0] || null;
  let evals = null;
  if (page && page.ws) {
    try {
      evals = await cdpEvalValue(page.ws, `(() => ({
        href: String(location.href || ''),
        ready: String(document.readyState || ''),
        hasRimward: !!(window.rimward && typeof window.rimward.observe === 'function'),
        agent: String(new URLSearchParams(location.search).get('agent') || ''),
        fatal: String((document.getElementById('fatal') && document.getElementById('fatal').textContent) || '').slice(0, 500),
        title: String(document.title || ''),
      }))()`);
    } catch (err) {
      evals = { error: err && err.message ? err.message : 'eval failed' };
    }
  }
  return { pages: pages.map((p) => ({ cdpPort: p.cdpPort, type: p.type, url: p.url, title: p.title })), evals };
}

function gamePageMatches(pageUrl, gameUrl) {
  try {
    const page = new URL(String(pageUrl || ''));
    const game = new URL(String(gameUrl || ''));
    return page.protocol === game.protocol
      && page.hostname === game.hostname
      && page.port === game.port
      && page.pathname === game.pathname
      && page.searchParams.get('agent') === '1';
  } catch {
    return false;
  }
}

function loopbackWs(url) {
  try {
    const u = new URL(String(url || ''));
    const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return (u.protocol === 'ws:' || u.protocol === 'wss:')
      && (host === '127.0.0.1' || host === 'localhost' || host === '::1');
  } catch {
    return false;
  }
}

function consoleArgText(arg) {
  if (!arg || typeof arg !== 'object') return '';
  if (Object.hasOwn(arg, 'value')) {
    try { return String(typeof arg.value === 'string' ? arg.value : JSON.stringify(arg.value)); } catch { /* fall through */ }
  }
  return String(arg.description || arg.type || '');
}

async function startConsoleMonitor(gameUrl, waitMs = 15000) {
  const deadline = Date.now() + waitMs;
  let page = null;
  while (Date.now() < deadline) {
    const pages = await probeCdpPages();
    page = pages.find((p) => p && p.type === 'page'
      && gamePageMatches(p.url, gameUrl)
      && loopbackWs(p.ws)) || null;
    if (page) break;
    await sleep(100);
  }
  if (!page) throw new Error('game page missing for console monitor');

  const ws = new WebSocket(page.ws);
  const pending = new Map();
  const errors = [];
  let errorCount = 0;
  let nextId = 0;
  const record = (kind, text) => {
    errorCount += 1;
    if (errors.length < 20) errors.push({ kind, text: String(text || '').slice(0, 500) });
  };
  ws.addEventListener('message', (ev) => {
    let msg;
    try { msg = JSON.parse(String(ev.data)); } catch { return; }
    if (msg.id != null) {
      const waiter = pending.get(msg.id);
      if (!waiter) return;
      pending.delete(msg.id);
      clearTimeout(waiter.timer);
      if (msg.error) waiter.reject(new Error('console monitor CDP error'));
      else waiter.resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const details = msg.params && msg.params.exceptionDetails;
      const exception = details && details.exception;
      record('uncaught-exception', (exception && exception.description) || (details && details.text));
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params && msg.params.type;
      if (type === 'error' || type === 'assert') {
        const args = Array.isArray(msg.params.args) ? msg.params.args : [];
        record(`console-${type}`, args.map(consoleArgText).join(' '));
      }
    } else if (msg.method === 'Log.entryAdded') {
      const entry = msg.params && msg.params.entry;
      if (entry && entry.level === 'error') record('browser-log-error', entry.text);
    }
  });
  await new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      reject(new Error('console monitor websocket timeout'));
    }, 8000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('console monitor websocket failed'));
    }, { once: true });
  });
  const send = (method, params = {}, timeoutMs = 8000) => {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('console monitor CDP timeout'));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
  try {
    await send('Runtime.enable');
    await send('Log.enable');
  } catch (err) {
    try { ws.close(); } catch { /* ignore */ }
    throw err;
  }
  return {
    errors,
    errorCount: () => errorCount,
    async eval(expression) {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result && result.exceptionDetails) throw new Error('console monitor eval failed');
      return result && result.result ? result.result.value : undefined;
    },
    close() {
      for (const waiter of pending.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error('console monitor closed'));
      }
      pending.clear();
      try { ws.close(); } catch { /* ignore */ }
    },
  };
}

async function waitHttpOk(url, ms) {
  const t0 = Date.now();
  let last = '';
  while (Date.now() - t0 < ms) {
    try {
      const r = await httpCall('GET', url, { timeoutMs: 2000 });
      if (r.status === 200) return true;
      last = String(r.status);
    } catch (err) {
      last = err && err.message ? err.message : 'err';
    }
    await sleep(250);
  }
  throw new Error(`vite not ready (${last})`);
}

function spawnLogged(cmd, args, logPath, extraEnv) {
  const out = fs.createWriteStream(logPath, { flags: 'a' });
  const env = { ...process.env, ...extraEnv };
  delete env.AGENT_TOKEN;
  delete env.AGENT_BRIDGE_PORT;
  env.BROWSER = 'none';
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (c) => { try { out.write(c); } catch { /* ignore */ } });
  child.stderr.on('data', (c) => { try { out.write(c); } catch { /* ignore */ } });
  child.on('exit', () => { try { out.end(); } catch { /* ignore */ } });
  return { child, out };
}

function appendLog(file, line) {
  try {
    fs.appendFileSync(file, `[${nowIso()}] ${line}\n`, 'utf8');
  } catch { /* ignore */ }
}

async function main() {
  fs.mkdirSync(SMOKE_DIR, { recursive: true });
  const runLog = path.join(SMOKE_DIR, 'run.log');
  const viteLog = path.join(SMOKE_DIR, 'vite.log');
  const bridgeLog = path.join(SMOKE_DIR, 'bridge.log');
  try { fs.writeFileSync(runLog, '', 'utf8'); } catch { /* ignore */ }

  const pins = {};
  for (const k of PIN_KEYS) pins[k] = false;

  const vitePort = await pickPort(5180, 5199, 5188);
  const bridgePort = await pickPort(8870, 8899, 8877);
  if (!vitePort || !bridgePort) {
    pins.failNote = 'no free port in 5180-5199 / 8870-8899';
    process.stdout.write(JSON.stringify(pins, null, 2) + '\n');
    return 1;
  }
  pins.vitePort = vitePort;
  pins.bridgePort = bridgePort;

  const gameUrl = `http://127.0.0.1:${vitePort}/index.html?agent=1`;
  const healthUrl = `http://127.0.0.1:${bridgePort}/health`;
  const observeUrl = `http://127.0.0.1:${bridgePort}/observe`;
  const actUrl = `http://127.0.0.1:${bridgePort}/act`;

  let viteProc = null;
  let bridgeProc = null;
  let token = '';
  let lastSnap = null;
  let failNote = '';
  let consoleMonitor = null;

  const teardown = async () => {
    if (bridgeProc && bridgeProc.child && bridgeProc.child.pid) {
      killTree(bridgeProc.child.pid);
    }
    if (viteProc && viteProc.child && viteProc.child.pid) {
      killTree(viteProc.child.pid);
    }
    killBridgeChrome();
    const t0 = Date.now();
    while (Date.now() - t0 < 8000) {
      const vFree = await portFree(vitePort);
      const bFree = await portFree(bridgePort);
      if (vFree && bFree) {
        pins.teardownPortsFree = true;
        return;
      }
      if (bridgeProc && bridgeProc.child && bridgeProc.child.pid) killTree(bridgeProc.child.pid);
      if (viteProc && viteProc.child && viteProc.child.pid) killTree(viteProc.child.pid);
      killBridgeChrome();
      await sleep(250);
    }
    pins.teardownPortsFree = (await portFree(vitePort)) && (await portFree(bridgePort));
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  const observe = async () => {
    const r = await httpCall('GET', observeUrl, { headers: authHeaders() });
    lastSnap = r.json;
    try {
      fs.writeFileSync(
        path.join(SMOKE_DIR, 'last-observe.json'),
        redact(JSON.stringify(observePin(lastSnap), null, 2), token),
        'utf8',
      );
    } catch { /* ignore */ }
    return lastSnap;
  };

  // v2 scenario ledger: chronological act receipts + declared snapshots.
  // Sanitized machine-readable transcript (no token, no DOM, no screenshots).
  const ledger = { schema: 'agent-playtest-ledger/1', api: 2, steps: [], snapshots: {} };
  let reqSeq = 0;

  const act = async (name, args = {}) => {
    const reqId = `smoke-${++reqSeq}`;
    const r = await httpCall('POST', actUrl, {
      headers: authHeaders(),
      body: JSON.stringify({ v: 2, name, args, reqId }),
    });
    const res = r.json;
    ledger.steps.push({
      i: reqSeq,
      reqId,
      name,
      ok: !!(res && res.ok === true),
      token: res && typeof res.token === 'string' ? res.token : '',
      status: res && typeof res.status === 'string' ? res.status : '',
      t: res && Number.isFinite(res.t) ? res.t : null,
      reqIdEcho: !!(res && res.reqId === reqId),
    });
    return res;
  };

  try {
    appendLog(runLog, `vitePort=${vitePort} bridgePort=${bridgePort}`);
    viteProc = spawnLogged(process.execPath, [
      VITE_BIN, '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort',
    ], viteLog);
    if (!viteProc.child.pid) throw new Error('vite spawn failed');
    await waitHttpOk(`http://127.0.0.1:${vitePort}/index.html`, VITE_WAIT_MS);
    appendLog(runLog, 'vite ready');

    const bridgeEnv = { BROWSER: 'none' };
    const bridgeOut = fs.createWriteStream(bridgeLog, { flags: 'a' });
    const env = { ...process.env, ...bridgeEnv };
    delete env.AGENT_TOKEN;
    delete env.AGENT_BRIDGE_PORT;
    bridgeProc = { child: spawn(process.execPath, [
      BRIDGE_BIN,
      '--launch-chrome',
      '--game-url', gameUrl,
      '--port', String(bridgePort),
      '--host', '127.0.0.1',
    ], {
      cwd: ROOT,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }), out: bridgeOut };

    let stderrBuf = '';
    const takeToken = (chunk, stream) => {
      const s = chunk.toString('utf8');
      if (stream === 'stderr') stderrBuf += s;
      const m = /AGENT_TOKEN=(\S+)/.exec(stderrBuf);
      if (m && !token) token = m[1];
      try { bridgeOut.write(redact(s, token)); } catch { /* ignore */ }
    };
    bridgeProc.child.stdout.on('data', (c) => takeToken(c, 'stdout'));
    bridgeProc.child.stderr.on('data', (c) => takeToken(c, 'stderr'));
    let bridgeExit = null;
    bridgeProc.child.on('exit', (code, sig) => {
      bridgeExit = { code, sig };
      try { bridgeOut.end(); } catch { /* ignore */ }
    });

    const tokenDeadline = Date.now() + TOKEN_WAIT_MS;
    while (!token && Date.now() < tokenDeadline) {
      if (bridgeExit) throw new Error('bridge exited before token');
      await sleep(100);
    }
    if (!token) throw new Error('no AGENT_TOKEN on bridge stderr');
    appendLog(runLog, 'token captured');
    consoleMonitor = await startConsoleMonitor(gameUrl);
    appendLog(runLog, 'console monitor attached');

    const healthDeadline = Date.now() + HEALTH_WAIT_MS;
    let health = null;
    let probed = false;
    while (Date.now() < healthDeadline) {
      if (bridgeExit) throw new Error('bridge exited during health wait');
      try {
        const r = await httpCall('GET', healthUrl, { timeoutMs: 2000 });
        health = r.json;
        if (
          health
          && health.ok === true
          && health.cdpAttached === true
          && health.gameReady === true
          && health.agentOptIn === true
        ) {
          pins.healthReady = true;
          break;
        }
      } catch { /* retry */ }
      if (!probed && Date.now() + HEALTH_WAIT_MS - healthDeadline > 8000) {
        probed = true;
        try {
          const probe = await probeGamePage();
          fs.writeFileSync(path.join(SMOKE_DIR, 'cdp-probe.json'), JSON.stringify(probe, null, 2), 'utf8');
          appendLog(runLog, `cdp-probe ${JSON.stringify(probe.evals || probe.pages)}`);
        } catch (err) {
          appendLog(runLog, `cdp-probe failed ${err && err.message ? err.message : 'err'}`);
        }
      }
      await sleep(400);
    }
    if (!pins.healthReady) {
      try {
        const probe = await probeGamePage();
        fs.writeFileSync(path.join(SMOKE_DIR, 'cdp-probe.json'), JSON.stringify(probe, null, 2), 'utf8');
        failNote = `health not ready: ${JSON.stringify(health)} probe=${JSON.stringify(probe.evals)}`;
      } catch {
        failNote = `health not ready: ${JSON.stringify(health)}`;
      }
      throw new Error(failNote);
    }
    appendLog(runLog, 'health ready');

    let snap = await observe();
    let phase = snap && snap.session && snap.session.phase;
    if (phase === 'title') {
      await act('startGame', {});
      snap = await observe();
      phase = snap && snap.session && snap.session.phase;
    }
    if (phase === 'origin') {
      await act('chooseOrigin', { id: 'greenhand' });
      snap = await observe();
      phase = snap && snap.session && snap.session.phase;
    }
    snap = await observe();
    pins.liveFwd = !!(snap && snap.ok === true && snap.ship && isFwd(snap.ship.fwd));
    pins.v2Envelope = !!(
      snap
      && snap.v === 2
      && snap.capabilities
      && Array.isArray(snap.capabilities.events)
      && snap.availability
      && snap.availability.setControl
      && snap.control
      && typeof snap.control.state === 'string'
      && snap.jobs
      && Array.isArray(snap.jobs.offers)
      && Array.isArray(snap.jobs.active)
    );
    if (pins.v2Envelope) ledger.snapshots.initial = observePin(snap);
    if (!pins.liveFwd) {
      failNote = `fwd pin failed phase=${snap && snap.session && snap.session.phase} fwd=${JSON.stringify(snap && snap.ship && snap.ship.fwd)}`;
    }

    const ping = await act('ping', {});
    pins.httpPing = !!(ping && ping.ok === true);

    const ws = await wsActPing(bridgePort, token);
    pins.wsPing = ws.pingOk === true;
    pins.wsProtoPing = ws.protoPing === true;

    const forbidden = await act('teleport', {});
    pins.forbiddenTeleport = !!(
      forbidden
      && forbidden.ok === false
      && forbidden.token === 'forbidden'
    );

    snap = await observe();
    phase = snap && snap.session && snap.session.phase;
    if (phase === 'title') {
      await act('startGame', {});
      snap = await observe();
      phase = snap && snap.session && snap.session.phase;
    }
    if (phase === 'origin') {
      await act('chooseOrigin', { id: 'greenhand' });
      snap = await observe();
      phase = snap && snap.session && snap.session.phase;
    }
    snap = await observe();
    phase = snap && snap.session && snap.session.phase;
    const originOk = phase === 'playing'
      || (snap && snap.world && typeof snap.world.origin === 'string' && snap.world.origin.length > 0)
      || hasEvent(snap && snap.events, 'originChosen');
    pins.originChosen = originOk === true;
    if (!pins.originChosen) {
      failNote = failNote || `origin not chosen phase=${phase}`;
    }

    const approach = await act('approachDock', {});
    if (!approach || approach.ok !== true) {
      snap = await observe();
      failNote = failNote || `approachDock failed token=${approach && approach.token} diag=${JSON.stringify(observePin(snap))}`;
    } else {
      const dockDeadline = Date.now() + DOCK_WAIT_MS;
      let lastDockDiag = observePin(await observe());
      const dockTrace = [];
      let dockTraceAt = 0;
      while (Date.now() < dockDeadline) {
        snap = await observe();
        lastDockDiag = observePin(snap);
        if (Date.now() >= dockTraceAt) {
          dockTrace.push(lastDockDiag);
          dockTraceAt = Date.now() + 3000;
        }
        const ap = snap && snap.autopilot;
        const station = snap && snap.station;
        const ship = snap && snap.ship;
        if (ap && ap.mode === 'dock'
          && typeof ap.phase === 'string' && ap.phase.length > 0
          && typeof ap.range === 'number' && Number.isFinite(ap.range)
          && typeof ap.progress === 'number' && Number.isFinite(ap.progress)
          && station && typeof station.range === 'number' && Number.isFinite(station.range)
          && typeof station.closingSpeed === 'number' && Number.isFinite(station.closingSpeed)) {
          pins.approachObserved = true;
        }
        if (ap && (ap.phase === 'settle' || ap.phase === 'docking' || ap.phase === 'complete')
          && ship && typeof ship.speed === 'number' && ship.speed <= 5) {
          if (pins.approachBraked !== true) {
            pins.approachBrakeAt = {
              phase: ap.phase,
              range: ap.range,
              speed: ship.speed,
              stationRange: station && station.range,
            };
          }
          pins.approachBraked = true;
        }
        if (snap && snap.flags && snap.flags.docked === true) {
          pins.approachDocked = ap && ap.mode === 'dock'
            && ap.engaged === false
            && ap.phase === 'complete'
            && ap.reason === 'docked';
          // The docked lifecycle row must be observable in a fresh public
          // snapshot, not merely inferable from flags.docked.
          if (pins.dockedEvent !== true) pins.dockedEvent = hasEventType(snap, 'docked');
          for (let k = 0; k < EVENT_POLL_TRIES && pins.dockedEvent !== true; k++) {
            await sleep(EVENT_POLL_MS);
            if (hasEventType(await observe(), 'docked')) pins.dockedEvent = true;
          }
          if (pins.approachDocked) {
            pins.approachDockAt = {
              phase: ap.phase,
              range: ap.range,
              speed: ship && ship.speed,
              stationRange: station && station.range,
              reason: ap.reason,
            };
          }
          break;
        }
        if (ap && ap.mode === 'dock' && ap.engaged === false && ap.phase === 'failed') break;
        await sleep(500);
      }
      if (!pins.approachDocked) {
        pins.dockTrace = dockTrace;
        failNote = failNote || `dock approach timeout/failure diag=${JSON.stringify(lastDockDiag)}`;
      } else {
        // ---- v2 station parity scenario (docked) ----
        // Read the structured services menu, open the bar through its exact
        // player button closure, and buy a round the same way. The stale-expect
        // probe proves a re-planned index cannot click the wrong row.
        snap = await observe();
        const view0 = snap && snap.station && snap.station.view;
        const menuActions = view0 && Array.isArray(view0.actions) ? view0.actions : [];
        const barEntry = menuActions.find((a) => a && typeof a.label === 'string' && a.label.includes('Bar'));
        if (barEntry) {
          await act('stationAction', { n: barEntry.n, expect: barEntry.label });
          snap = await observe();
        }
        const barView = snap && snap.station && snap.station.view;
        const barActions = barView && Array.isArray(barView.actions) ? barView.actions : [];
        const roundEntry = barActions.find((a) => a && typeof a.label === 'string' && a.label.includes('Buy a round'));
        const creditsBefore = snap && snap.world && Number.isFinite(snap.world.credits) ? snap.world.credits : null;
        let roundRes = null;
        if (roundEntry) roundRes = await act('stationAction', { n: roundEntry.n, expect: roundEntry.label });
        snap = await observe();
        const creditsAfter = snap && snap.world && Number.isFinite(snap.world.credits) ? snap.world.credits : null;
        pins.stationViewRows = !!(
          view0 && Array.isArray(view0.rows) && view0.rows.length > 0
          && barEntry && barView && barView.service === 'bar'
          && roundEntry
        );
        pins.stationActionBar = !!(
          roundRes && roundRes.ok === true
          && creditsBefore !== null && creditsAfter !== null && creditsAfter < creditsBefore
        );
        pins.stationBarDelta = creditsBefore !== null && creditsAfter !== null ? creditsAfter - creditsBefore : null;
        // issue #64: a bought round is a success, so `error` must be empty and
        // the displayed line must arrive in `notice` — exactly the panel line.
        const barNotice = snap && snap.station && snap.station.view
          && typeof snap.station.view.notice === 'string' ? snap.station.view.notice : null;
        pins.stationBarNotice = !!(
          roundRes && roundRes.ok === true
          && roundRes.error === '' && roundRes.token === ''
          && typeof roundRes.notice === 'string' && roundRes.notice.length > 0
          && roundRes.notice === barNotice
          && roundRes.notice === 'The bar loosens up.'
        );
        pins.stationBarNoticeText = roundRes && typeof roundRes.notice === 'string' ? roundRes.notice : null;
        const staleRes = roundEntry ? await act('stationAction', { n: roundEntry.n, expect: 'not-the-label' }) : null;
        snap = await observe();
        const creditsStale = snap && snap.world && Number.isFinite(snap.world.credits) ? snap.world.credits : null;
        pins.staleExpectRefused = !!(staleRes && staleRes.ok === false && staleRes.token === 'stale');
        // The same refusal proves the failure side of the contract: token and
        // error stay, `notice` is empty, receipt metadata survives, no spend.
        pins.staleExpectShape = !!(
          staleRes && staleRes.ok === false
          && staleRes.token === 'stale' && staleRes.error === 'stale'
          && staleRes.notice === ''
          && typeof staleRes.reqId === 'string' && staleRes.reqId.length > 0
          && Number.isFinite(staleRes.t)
          && creditsStale !== null && creditsAfter !== null && creditsStale === creditsAfter
        );
        const undock = await act('undock', {});
        snap = await observe();
        pins.approachUndocked = !!(undock && undock.ok === true
          && snap && snap.flags && snap.flags.docked === false);
        // Same for the undocked lifecycle row.
        if (pins.undockedEvent !== true) pins.undockedEvent = hasEventType(snap, 'undocked');
        for (let k = 0; k < EVENT_POLL_TRIES && pins.undockedEvent !== true; k++) {
          await sleep(EVENT_POLL_MS);
          if (hasEventType(await observe(), 'undocked')) pins.undockedEvent = true;
        }
        if (pins.approachUndocked) {
          const uShip = snap.ship || {};
          const uAp = snap.autopilot || {};
          const uSt = snap.station || {};
          pins.approachUndockAt = {
            phase: uAp.phase,
            range: uAp.range,
            speed: uShip.speed,
            stationRange: uSt.range,
            docked: snap.flags.docked,
          };
        }
        if (!pins.approachUndocked) {
          failNote = failNote || `undock after approach failed token=${undock && undock.token}`;
        }
      }
    }

    // ---- v2 control lease: apply, sim-time expiry, idempotent clear ----
    const leaseSet = await act('setControl', { seq: 1, ttl: 1.5, steerX: 0.2, throttle: 0.4 });
    snap = await observe();
    pins.leaseActive = !!(leaseSet && leaseSet.ok === true && leaseSet.status === 'active'
      && snap && snap.control && snap.control.state === 'active' && snap.control.seq === 1
      && Number.isFinite(snap.control.expiresIn) && snap.control.expiresIn > 0);
    const leaseDeadline = Date.now() + 9000;
    while (Date.now() < leaseDeadline) {
      snap = await observe();
      if (snap && snap.control && snap.control.state === 'expired') break;
      await sleep(400);
    }
    pins.leaseExpired = !!(snap && snap.control && snap.control.state === 'expired'
      && snap.control.reason === 'expired');

    // ---- v2 fire path: lease fireHeld must spawn real shots (playerFire) ----
    await act('setWeaponGroup', { n: 1 });
    const fireSet = await act('setControl', { seq: 2, ttl: 3, fireHeld: true });
    let fireSeen = false;
    const fireDeadline = Date.now() + 9000;
    while (Date.now() < fireDeadline) {
      snap = await observe();
      if (hasEvent(snap && snap.events, 'playerFire')) { fireSeen = true; break; }
      await sleep(300);
    }
    pins.firePath = !!(fireSet && fireSet.ok === true && fireSeen);
    const clearRes = await act('clearControl', {});
    const clearDeadline = Date.now() + 4000;
    while (Date.now() < clearDeadline) {
      snap = await observe();
      if (snap && snap.ship && snap.ship.fireHeld === false) break;
      await sleep(250);
    }
    pins.clearControlOk = !!(clearRes && clearRes.ok === true && clearRes.status === 'cleared'
      && snap && snap.control && snap.control.state === 'cleared'
      && snap.ship && snap.ship.fireHeld === false);

    // ---- v2 combat path: target/aim/fire/outcome (gating) ----
    // No fixtures and no privileged results: the target is a real observed
    // contact from targets.nearby (station traffic lane; hostiles seek the
    // player), selected through the same cycle service a player's KeyT uses,
    // steered with the HUD-derived aim/lead bearings on the control lease,
    // and every counted outcome is a real combat-system ring event.
    const combatProbe = {
      attempted: false, targetLocked: false, aimObserved: false,
      fireEvents: 0, hits: 0, shieldDown: 0, destroyed: 0, surrendered: 0, note: '',
    };
    try {
      let seq = 10;
      // Demand cards own the input surface (the lease refuses 'overlay');
      // resolve them through the listed intents exactly as a player would.
      const clearHails = async () => {
        for (let i = 0; i < 4; i++) {
          const hs = await observe();
          if (!(hs && hs.hail && hs.hail.open === true)) return true;
          const intents = hs.hail && Array.isArray(hs.hail.intents) ? hs.hail.intents : [];
          if (intents.includes('refuseFight')) await act('hailResolve', { intent: 'refuseFight' });
          else if (intents.length) await act('hailResolve', { intent: intents[0] });
          else return false;
          await sleep(400);
        }
        const after = await observe();
        return !(after && after.hail && after.hail.open === true);
      };
      // Bounded wait for a real contact to enter observation range.
      let targetRow = null;
      const contactDeadline = Date.now() + 90000;
      while (Date.now() < contactDeadline && !targetRow) {
        const ws = await observe();
        if (ws && ws.session && ws.session.phase === 'dead') break;
        const rows = ws && ws.targets && Array.isArray(ws.targets.nearby) ? ws.targets.nearby : [];
        const contacts = rows.filter((r) => r && r.kind === 'ship');
        if (contacts.length) {
          contacts.sort((a, b) => ((b.hostile === true) - (a.hostile === true)) || (a.range - b.range));
          targetRow = contacts[0];
          break;
        }
        await sleep(1000);
      }
      if (targetRow) {
        await clearHails();
        const selRes = await act('selectTarget', { id: targetRow.id });
        if (!(selRes && selRes.ok === true)) await act('selectTarget', {}); // ordinary cycle edge
        combatProbe.attempted = true;
        await act('setWeaponGroup', { n: 1 });
        const aimDeadline = Date.now() + 60000;
        while (Date.now() < aimDeadline) {
          const ps = await observe();
          if (ps && ps.session && ps.session.phase === 'dead') {
            combatProbe.note = 'player destroyed mid-probe (real combat outcome)';
            break;
          }
          const evs = ps && ps.events;
          if (Array.isArray(evs)) {
            for (const e of evs) {
              if (!e || typeof e !== 'object') continue;
              if (e.type === 'npcHit') combatProbe.hits += Number.isFinite(e.count) ? e.count : 1;
              if (e.type === 'shieldDown') combatProbe.shieldDown += 1;
              if (e.type === 'npcDestroyed' || e.type === 'npcDisabled') combatProbe.destroyed += 1;
              if (e.type === 'npcSurrendered') combatProbe.surrendered += 1;
              if (e.type === 'playerFire') combatProbe.fireEvents += 1;
            }
          }
          const tgt = ps && ps.targets && ps.targets.current;
          if (tgt && tgt.kind === 'ship') combatProbe.targetLocked = true;
          if (!tgt || tgt.kind !== 'ship') break;
          const aim = ps.targets && ps.targets.aim;
          if (aim && Array.isArray(aim.bearing)) combatProbe.aimObserved = true;
          if (!aim || !Array.isArray(aim.bearing)) { await sleep(300); continue; } // HUD publishes the digest the frame after a new lock
          if (combatProbe.fireEvents > 0
            && (combatProbe.hits > 0 || combatProbe.destroyed > 0 || combatProbe.surrendered > 0)) break;
          const aimPt = (aim.lead && Array.isArray(aim.lead.bearing)) ? aim.lead.bearing : aim.bearing;
          const sx = Math.max(-1, Math.min(1, aimPt[0] * 2.5));
          const sy = Math.max(-1, Math.min(1, aimPt[1] * 2.5));
          const aligned = aimPt[2] < -0.85;
          const ctl = await act('setControl', { seq: ++seq, ttl: 1.2, steerX: sx, steerY: sy, fireHeld: aligned, throttle: 0.6 });
          if (ctl && ctl.ok === false && ctl.token === 'overlay') await clearHails();
          await sleep(700);
        }
        await act('clearControl', {});
        if (!combatProbe.note) {
          if (combatProbe.fireEvents === 0) combatProbe.note = 'no playerFire within probe window';
          else if (combatProbe.hits === 0 && combatProbe.destroyed === 0 && combatProbe.surrendered === 0) {
            combatProbe.note = 'fired without a combat outcome';
          }
        }
      } else {
        combatProbe.note = 'no contact entered observation range within 90s';
      }
    } catch (probeErr) {
      combatProbe.note = `probe error: ${probeErr && probeErr.message ? probeErr.message : 'err'}`;
      try { await act('clearControl', {}); } catch { /* ignore */ }
    }
    pins.combatProbe = combatProbe;
    pins.combatPath = !!(
      combatProbe.attempted
      && combatProbe.targetLocked
      && combatProbe.aimObserved
      && combatProbe.fireEvents > 0
      && (combatProbe.hits > 0 || combatProbe.destroyed > 0 || combatProbe.surrendered > 0)
    );

    // If the probe cost the ship, take the real death-overlay recovery path
    // and undock again so the navigation leg starts flying.
    {
      const ds = await observe();
      if (ds && ds.session && ds.session.phase === 'dead') {
        await act('recover', {});
      }
      const rs = await observe();
      if (rs && rs.flags && rs.flags.docked === true) {
        await act('undock', {});
      }
    }

    snap = await observe();
    const startSystem = snap && snap.world && typeof snap.world.currentSystem === 'string'
      ? snap.world.currentSystem
      : '';
    let dest = 'veridian';
    if (startSystem === 'veridian') dest = 'freehold';
    const plot = await act('plotRoute', { dest });
    snap = await observe();
    if (!plot || plot.ok !== true) {
      failNote = failNote || `plotRoute failed token=${plot && plot.token} paused=${snap && snap.flags && snap.flags.paused}`;
    } else {
      const engage = await act('engageAutopilot', {});
      snap = await observe();
      if (!engage || engage.ok !== true) {
        failNote = failNote || `engageAutopilot failed token=${engage && engage.token} paused=${snap && snap.flags && snap.flags.paused} nav=${JSON.stringify(snap && snap.nav)} ap=${JSON.stringify(snap && snap.autopilot)}`;
      } else {
        const t0 = snap && typeof snap.t === 'number' && Number.isFinite(snap.t) ? snap.t : null;
        pins.t0 = t0;
        const jumpDeadline = Date.now() + JUMP_WAIT_MS;
        const loopDeadline = Date.now() + LOOP_PROBE_MS;
        let jumped = false;
        let lastDiag = observePin(snap);
        let t1 = t0;
        while (Date.now() < jumpDeadline) {
          snap = await observe();
          lastDiag = observePin(snap);
          if (snap && typeof snap.t === 'number' && Number.isFinite(snap.t)) t1 = snap.t;
          if (t0 != null && t1 != null && t1 - t0 >= LOOP_T_MIN) pins.loopAlive = true;
          const sys = snap && snap.world && snap.world.currentSystem;
          const evs = snap && snap.events;
          const loaded = Array.isArray(evs) && evs.some((e) => (
            e && e.type === 'systemLoaded' && e.to && e.to !== startSystem
          ));
          const jumpReq = hasEvent(evs, 'jumpRequested');
          if ((typeof sys === 'string' && sys && sys !== startSystem) || loaded) {
            jumped = true;
            break;
          }
          if (!pins.loopAlive && Date.now() >= loopDeadline) {
            failNote = `loopAlive: observe().t did not advance t0=${t0} t1=${t1} diag=${JSON.stringify(lastDiag)}`;
            break;
          }
          if (jumpReq && snap.gate && snap.gate.jumping === true && snap.gate.destination && snap.gate.destination !== startSystem) {
            /* still charging; keep polling */
          }
          const apOn = snap && snap.autopilot && snap.autopilot.engaged === true;
          const navOn = snap && snap.nav && (snap.nav.status === 'plotted' || snap.nav.autopilot === true);
          if (!apOn && navOn && Date.now() > jumpDeadline - 1000) {
            failNote = `AP dropped before jump diag=${JSON.stringify(lastDiag)}`;
          }
          await sleep(1000);
        }
        pins.t1 = t1;
        if (jumped) pins.loopAlive = true;
        pins.systemTransition = jumped === true;
        if (!jumped && pins.loopAlive) {
          const apOn = lastDiag && lastDiag.autopilot && lastDiag.autopilot.engaged === true;
          const navPlotted = lastDiag && lastDiag.nav && lastDiag.nav.status === 'plotted';
          failNote = failNote || (
            apOn && navPlotted
              ? `AP engaged and nav plotted but jump never happened within ${JUMP_WAIT_MS}ms diag=${JSON.stringify(lastDiag)}`
              : `system transition timeout diag=${JSON.stringify(lastDiag)}`
          );
        }
      }
    }

    ledger.snapshots.terminal = observePin(await observe());
  } catch (err) {
    failNote = failNote || (err && err.message ? err.message : 'smoke failed');
    appendLog(runLog, redact(failNote, token));
  } finally {
    if (consoleMonitor) {
      try {
        const fatal = String(await consoleMonitor.eval(
          "(document.getElementById('fatal') && document.getElementById('fatal').textContent) || ''",
        ) || '').trim();
        pins.consoleClean = fatal.length === 0 && consoleMonitor.errorCount() === 0;
        pins.consoleEvidence = {
          fatal,
          errorCount: consoleMonitor.errorCount(),
          errors: consoleMonitor.errors.map((entry) => ({
            kind: entry.kind,
            text: redact(entry.text, token),
          })),
        };
      } catch (err) {
        pins.consoleClean = false;
        pins.consoleEvidence = {
          error: err && err.message ? err.message : 'console probe failed',
        };
      } finally {
        consoleMonitor.close();
      }
    } else {
      pins.consoleClean = false;
      pins.consoleEvidence = { error: 'console monitor not attached' };
    }
    await teardown();
    appendLog(runLog, `teardownPortsFree=${pins.teardownPortsFree}`);
    // Serialize the durable ledger LAST: consoleClean/teardownPortsFree (and
    // every other pin) must hold their final values so the committed evidence
    // file agrees with the stdout pins below on success and failure alike.
    try {
      ledger.outcome = {
        pins: Object.fromEntries(PIN_KEYS.map((k) => [k, pins[k] === true])),
        failNote: failNote ? redact(failNote, token) : '',
      };
      fs.writeFileSync(
        path.join(SMOKE_DIR, 'scenario-ledger.json'),
        redact(JSON.stringify(ledger, null, 2), token),
        'utf8',
      );
      pins.ledgerWritten = true;
    } catch { pins.ledgerWritten = false; }
  }

  if (failNote) pins.failNote = redact(failNote, token);
  if (lastSnap) pins.last = observePin(lastSnap);
  const required = PIN_KEYS.every((k) => pins[k] === true);
  process.stdout.write(JSON.stringify(pins, null, 2) + '\n');
  return required ? 0 : 1;
}

main().then((code) => process.exit(code)).catch((err) => {
  try {
    process.stderr.write('smoke failed\n');
    if (err && err.message) process.stderr.write(String(err.message) + '\n');
  } catch { /* ignore */ }
  process.exit(1);
});
