/**
 * Loopback agent bridge. HTTP/WS on 127.0.0.1 (or ::1) only.
 * Node holds the game tab via CDP Runtime.evaluate of window.rimward.
 * Token stays in Node. Never bind 0.0.0.0 / ::. No page WebSocket.
 */
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const BODY_LIMIT = 65536;
const WS_MAX = 65536;
const NO_CTX_OBSERVE = Object.freeze({
  v: 1, t: 0, ok: false, error: 'no-ctx', agentOptIn: false, events: [],
});
const CHROME_WIN = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export function tokenEqual(a, b) {
  const left = Buffer.isBuffer(a) ? Buffer.from(a) : Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.isBuffer(b) ? Buffer.from(b) : Buffer.from(String(b ?? ''), 'utf8');
  if (left.length !== right.length) {
    const dummy = Buffer.alloc(32);
    crypto.timingSafeEqual(dummy, Buffer.alloc(32));
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export function assertBindHost(host) {
  const raw = String(host ?? '');
  const h = raw.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === '0.0.0.0' || h === '::' || h === '0:0:0:0:0:0:0:0') {
    const err = new Error('bind host refused');
    err.code = 'BIND_REFUSED';
    throw err;
  }
  if (h === '127.0.0.1') return '127.0.0.1';
  if (h === '::1') return '::1';
  if (h === 'localhost') return '127.0.0.1';
  const err = new Error('bind host refused');
  err.code = 'BIND_REFUSED';
  throw err;
}

function logLine(...parts) {
  process.stderr.write(parts.map(String).join(' ') + '\n');
}

function noCtxAct(name) {
  return { v: 1, ok: false, error: 'no-ctx', name: String(name || ''), token: 'no-ctx' };
}

function actCommand(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const v = Number.isFinite(Number(src.v)) ? Number(src.v) : 1;
  const name = typeof src.name === 'string' ? src.name : '';
  const args = src.args && typeof src.args === 'object' && !Array.isArray(src.args) ? src.args : {};
  return { v, name, args };
}

function bearerToken(req) {
  const h = req.headers.authorization;
  if (typeof h !== 'string') return '';
  const m = /^Bearer[ \t]+(\S+)/i.exec(h);
  return m ? m[1] : '';
}

function hostnameOf(value) {
  if (!value || value === 'null') return '';
  try {
    return new URL(value).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return '';
  }
}

function isLoopbackHost(host) {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (origin) return isLoopbackHost(hostnameOf(origin));
  const referer = req.headers.referer;
  if (referer) return isLoopbackHost(hostnameOf(referer));
  return true;
}

function sendJson(res, status, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(body.length),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readBody(req, limit = BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) {
        const err = new Error('too large');
        err.code = 'TOO_LARGE';
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function wsAccept(key) {
  return crypto.createHash('sha1').update(String(key) + WS_GUID).digest('base64');
}

function encodeWsFrame(payload, opcode) {
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeWsFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const fin = (buf[0] & 0x80) !== 0;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let off = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    off = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    const n = buf.readBigUInt64BE(2);
    if (n > BigInt(WS_MAX)) return { overflow: true, rest: Buffer.alloc(0) };
    len = Number(n);
    off = 10;
  }
  if (len > WS_MAX) return { overflow: true, rest: Buffer.alloc(0) };
  const maskLen = masked ? 4 : 0;
  if (buf.length < off + maskLen + len) return null;
  let payload = buf.subarray(off + maskLen, off + maskLen + len);
  if (masked) {
    const mask = buf.subarray(off, off + 4);
    const out = Buffer.alloc(len);
    for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
    payload = out;
  }
  return {
    opcode,
    fin,
    masked,
    payload,
    rest: buf.subarray(off + maskLen + len),
  };
}

function observeExpr() {
  return `(() => {
    try {
      const h = window.rimward;
      if (!h || typeof h.observe !== 'function') {
        return { v: 1, t: 0, ok: false, error: 'no-ctx', agentOptIn: false, events: [] };
      }
      return h.observe();
    } catch {
      return { v: 1, t: 0, ok: false, error: 'no-ctx', agentOptIn: false, events: [] };
    }
  })()`;
}

function actExpr(command) {
  const payload = JSON.stringify(command);
  return `(() => {
    try {
      const cmd = ${payload};
      const h = window.rimward;
      if (!h || typeof h.act !== 'function') {
        return { v: 1, ok: false, error: 'no-ctx', name: String(cmd && cmd.name || ''), token: 'no-ctx' };
      }
      return h.act(cmd);
    } catch {
      return { v: 1, ok: false, error: 'refuse', name: '', token: 'refuse' };
    }
  })()`;
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.id == null) return;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error('cdp error'));
      else p.resolve(msg.result);
    });
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', () => rej(new Error('cdp ws')), { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout'));
        }
      }, timeoutMs);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 30000) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, timeoutMs);
    if (r?.exceptionDetails) return null;
    return r?.result?.value;
  }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

function assertGameUrl(url) {
  if (!url) return '';
  let u;
  try { u = new URL(url); } catch {
    const err = new Error('game url refused');
    err.code = 'GAME_URL_REFUSED';
    throw err;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    const err = new Error('game url refused');
    err.code = 'GAME_URL_REFUSED';
    throw err;
  }
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!isLoopbackHost(host)) {
    const err = new Error('game url refused');
    err.code = 'GAME_URL_REFUSED';
    throw err;
  }
  if (u.searchParams.get('agent') !== '1') u.searchParams.set('agent', '1');
  return u.href;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normUrlPath(p) {
  if (!p || p === '/') return '/';
  return p.replace(/\/+$/, '') || '/';
}

/** Same origin+path. Extra query (e.g. agent=1) is allowed. */
export function pageUrlMatchesGame(pageUrl, gameUrl) {
  if (!gameUrl) return true;
  let page;
  let game;
  try {
    page = new URL(String(pageUrl || ''));
    game = new URL(String(gameUrl || ''));
  } catch {
    return false;
  }
  const pageHost = page.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const gameHost = game.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return page.protocol === game.protocol
    && pageHost === gameHost
    && page.port === game.port
    && normUrlPath(page.pathname) === normUrlPath(game.pathname);
}

/** First line = TCP port. Second line = browser WS path (unused for connect). */
export function parseDevToolsActivePort(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const raw = String(lines[0] || '').trim();
  if (!/^\d+$/.test(raw)) return null;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  const browserPath = String(lines[1] || '').trim();
  return { port, browserPath };
}

export function readDevToolsActivePortFile(profileDir) {
  const root = path.resolve(String(profileDir || ''));
  const file = path.join(root, 'DevToolsActivePort');
  if (path.dirname(file) !== root) return null;
  if (!fs.existsSync(file)) return null;
  return parseDevToolsActivePort(fs.readFileSync(file, 'utf8'));
}

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    try { child.kill(); } catch { /* ignore */ }
  }
}

function assertCdpPort(cdpPort) {
  const port = Number(cdpPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const err = new Error('cdp port refused');
    err.code = 'CDP_PORT_REFUSED';
    throw err;
  }
  return port;
}

async function listCdpPages(cdpPort) {
  const port = assertCdpPort(cdpPort);
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!res.ok) throw new Error('cdp list');
  const list = await res.json();
  return Array.isArray(list) ? list : [];
}

function isLoopbackWsUrl(url) {
  try {
    const u = new URL(String(url || ''));
    if (u.protocol !== 'ws:' && u.protocol !== 'wss:') return false;
    return isLoopbackHost(u.hostname.replace(/^\[|\]$/g, '').toLowerCase());
  } catch {
    return false;
  }
}

export function pickMatchingPage(list, gameUrl) {
  const pages = (Array.isArray(list) ? list : []).filter(
    (t) => t && t.type === 'page' && isLoopbackWsUrl(t.webSocketDebuggerUrl),
  );
  if (gameUrl) {
    return pages.find((t) => pageUrlMatchesGame(t.url, gameUrl)) || null;
  }
  let hit = pages.find((t) => String(t.url || '').includes('agent=1'));
  if (!hit) {
    hit = pages.find((t) => {
      const u = String(t.url || '');
      return u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost');
    });
  }
  return hit || null;
}

async function attachCdp({ cdpPort, gameUrl, waitMs = 0 }) {
  const deadline = Date.now() + Math.max(0, Number(waitMs) || 0);
  let lastErr = new Error('cdp page missing');
  for (;;) {
    try {
      const list = await listCdpPages(cdpPort);
      const hit = pickMatchingPage(list, gameUrl);
      if (!hit) {
        lastErr = new Error(gameUrl ? 'cdp page url mismatch' : 'cdp page missing');
      } else {
        const cdp = new Cdp(hit.webSocketDebuggerUrl);
        try {
          await cdp.ready();
          await cdp.send('Runtime.enable');
          await cdp.send('Page.enable');
          let href = String(hit.url || '');
          try {
            const live = await cdp.eval('location.href', 5000);
            if (typeof live === 'string' && live) href = live;
          } catch { /* list URL is enough if eval is not ready */ }
          if (gameUrl && !pageUrlMatchesGame(href, gameUrl)) {
            cdp.close();
            throw new Error('cdp page url mismatch');
          }
          try {
            await cdp.send('Page.bringToFront', {}, 5000);
          } catch {
            logLine('cdp bringToFront failed');
            let still = href;
            try {
              const live = await cdp.eval('location.href', 5000);
              if (typeof live === 'string' && live) still = live;
            } catch { /* keep prior href */ }
            if (gameUrl && !pageUrlMatchesGame(still, gameUrl)) {
              cdp.close();
              throw new Error('cdp page url mismatch');
            }
          }
          return cdp;
        } catch (err) {
          cdp.close();
          throw err;
        }
      }
    } catch (err) {
      lastErr = err || lastErr;
    }
    if (Date.now() >= deadline) break;
    await sleep(200);
  }
  throw lastErr;
}

function chromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (fs.existsSync(CHROME_WIN)) return CHROME_WIN;
  return '';
}

export function chromeLaunchArgs({ profile, gameUrl }) {
  const target = gameUrl ? assertGameUrl(gameUrl) : 'about:blank';
  return [
    '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--window-size=1280,720',
    target,
  ];
}

function launchChrome({ gameUrl }) {
  const bin = chromePath();
  if (!bin) throw new Error('chrome missing');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-agent-bridge-'));
  const child = spawn(bin, chromeLaunchArgs({ profile, gameUrl }), {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return { child, profile };
}

async function cdpPortReachable(cdpPort) {
  try {
    const port = assertCdpPort(cdpPort);
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    return !!res.ok;
  } catch {
    return false;
  }
}

async function waitDevToolsActivePort(profileDir, ms = 15000, child = null) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (child && child.exitCode != null) return null;
    const parsed = readDevToolsActivePortFile(profileDir);
    if (parsed && await cdpPortReachable(parsed.port)) return parsed;
    await sleep(200);
  }
  return null;
}

async function waitCdp(cdpPort, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await cdpPortReachable(cdpPort)) return true;
    await sleep(200);
  }
  return false;
}

function healthProbeExpr() {
  return `(() => {
    try {
      const h = window.rimward;
      if (!h || typeof h.observe !== 'function') {
        return { gameReady: false, agentOptIn: false };
      }
      const snap = h.observe();
      return {
        gameReady: !!(snap && typeof snap === 'object' && snap.ok === true),
        agentOptIn: !!(snap && typeof snap === 'object' && snap.agentOptIn === true),
      };
    } catch {
      return { gameReady: false, agentOptIn: false };
    }
  })()`;
}

function makeHealth(getCdp) {
  const state = { gameReady: false, agentOptIn: false };
  return {
    recordObserve(snap) {
      if (!snap || typeof snap !== 'object') return;
      if (snap.ok === true) state.gameReady = true;
      if (typeof snap.agentOptIn === 'boolean') state.agentOptIn = snap.agentOptIn === true;
    },
    async getHealth() {
      const cdp = getCdp();
      const cdpAttached = !!cdp;
      if (state.gameReady) {
        return { cdpAttached, gameReady: true, agentOptIn: state.agentOptIn };
      }
      if (!cdpAttached) {
        return { cdpAttached: false, gameReady: false, agentOptIn: false };
      }
      try {
        const value = await cdp.eval(healthProbeExpr(), 2000);
        if (value && typeof value === 'object') {
          if (value.gameReady === true) state.gameReady = true;
          if (typeof value.agentOptIn === 'boolean') state.agentOptIn = value.agentOptIn === true;
          return {
            cdpAttached: true,
            gameReady: value.gameReady === true,
            agentOptIn: value.agentOptIn === true,
          };
        }
      } catch { /* health stays conservative */ }
      return { cdpAttached: true, gameReady: false, agentOptIn: state.agentOptIn };
    },
  };
}

function makeCdpEvaluator(getCdp, health) {
  return {
    async observe() {
      const cdp = getCdp();
      if (!cdp) return { ...NO_CTX_OBSERVE };
      try {
        const value = await cdp.eval(observeExpr());
        if (!value || typeof value !== 'object') return { ...NO_CTX_OBSERVE };
        if (health) health.recordObserve(value);
        return value;
      } catch {
        return { ...NO_CTX_OBSERVE };
      }
    },
    async act(command) {
      const cdp = getCdp();
      const cmd = actCommand(command);
      if (!cdp) return noCtxAct(cmd.name);
      try {
        const value = await cdp.eval(actExpr(cmd));
        if (!value || typeof value !== 'object') return noCtxAct(cmd.name);
        return value;
      } catch {
        return { v: 1, ok: false, error: 'refuse', name: cmd.name, token: 'refuse' };
      }
    },
  };
}

export function startBridge(opts) {
  const host = assertBindHost(opts.host ?? '127.0.0.1');
  const token = String(opts.token ?? '');
  const evaluator = opts.evaluator;
  if (!evaluator || typeof evaluator.observe !== 'function' || typeof evaluator.act !== 'function') {
    throw new Error('evaluator required');
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = url.pathname;
      if (req.method === 'OPTIONS') {
        res.writeHead(405, { Allow: 'GET, POST' });
        res.end();
        return;
      }
      if (!originAllowed(req)) {
        sendJson(res, 403, { ok: false, error: 'forbidden' });
        return;
      }
      if (pathname === '/health' && req.method === 'GET') {
        let extra = {};
        try {
          if (typeof opts.getHealth === 'function') extra = (await opts.getHealth()) || {};
        } catch { extra = {}; }
        sendJson(res, 200, {
          ok: true,
          cdpAttached: extra.cdpAttached === true,
          gameReady: extra.gameReady === true,
          agentOptIn: extra.agentOptIn === true,
        });
        return;
      }
      if (pathname === '/observe' || pathname === '/act') {
        const given = bearerToken(req);
        if (!tokenEqual(given, token)) {
          sendJson(res, 401, { ok: false, error: 'unauthorized' });
          return;
        }
      }
      if (pathname === '/observe' && req.method === 'GET') {
        const snap = await evaluator.observe();
        sendJson(res, 200, snap && typeof snap === 'object' ? snap : { ...NO_CTX_OBSERVE });
        return;
      }
      if (pathname === '/act' && req.method === 'POST') {
        let raw;
        try {
          const buf = await readBody(req);
          raw = buf.length ? JSON.parse(buf.toString('utf8')) : {};
        } catch (err) {
          sendJson(res, err && err.code === 'TOO_LARGE' ? 413 : 400, { ok: false, error: 'bad-json' });
          return;
        }
        const cmd = actCommand(raw);
        const result = await evaluator.act(cmd);
        sendJson(res, 200, result && typeof result === 'object' ? result : noCtxAct(cmd.name));
        return;
      }
      sendJson(res, 404, { ok: false, error: 'not-found' });
    } catch {
      sendJson(res, 500, { ok: false, error: 'refuse' });
    }
  });

  server.on('upgrade', (req, socket) => {
    try {
      if (String(req.headers.upgrade || '').toLowerCase() !== 'websocket') {
        socket.destroy();
        return;
      }
      if (!originAllowed(req)) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }
      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n'
        + 'Upgrade: websocket\r\n'
        + 'Connection: Upgrade\r\n'
        + 'Sec-WebSocket-Accept: ' + wsAccept(key) + '\r\n'
        + '\r\n',
      );
      let buf = Buffer.alloc(0);
      let authed = false;
      const send = (obj) => {
        try {
          socket.write(encodeWsFrame(Buffer.from(JSON.stringify(obj), 'utf8'), 0x1));
        } catch { /* ignore */ }
      };
      const closeSock = () => {
        try { socket.write(encodeWsFrame(Buffer.alloc(0), 0x8)); } catch { /* ignore */ }
        try { socket.end(); } catch { /* ignore */ }
      };
      let chain = Promise.resolve();
      socket.on('data', (chunk) => {
        chain = chain.then(async () => {
          buf = Buffer.concat([buf, chunk]);
          while (true) {
            const frame = decodeWsFrame(buf);
            if (!frame) break;
            if (frame.overflow) { closeSock(); return; }
            buf = frame.rest;
            if (!frame.fin || !frame.masked || (frame.opcode !== 1 && frame.opcode !== 8 && frame.opcode !== 9)) {
              closeSock();
              return;
            }
            if (frame.opcode === 8) { closeSock(); return; }
            if (frame.opcode === 9) {
              socket.write(encodeWsFrame(frame.payload, 0xA));
              continue;
            }
            let msg;
            try { msg = JSON.parse(frame.payload.toString('utf8')); } catch {
              closeSock();
              return;
            }
            if (!authed) {
              const given = msg && typeof msg.token === 'string' ? msg.token : '';
              if (!tokenEqual(given, token)) {
                closeSock();
                return;
              }
              authed = true;
              continue;
            }
            const op = msg && typeof msg.op === 'string' ? msg.op : '';
            if (op === 'observe') {
              const snap = await evaluator.observe();
              send(snap && typeof snap === 'object' ? snap : { ...NO_CTX_OBSERVE });
            } else if (op === 'act') {
              const cmd = actCommand(msg);
              const result = await evaluator.act(cmd);
              send(result && typeof result === 'object' ? result : noCtxAct(cmd.name));
            } else {
              send({ v: 1, ok: false, error: 'unknown', name: '', token: 'unknown' });
            }
          }
        }).catch(() => { closeSock(); });
      });
      socket.on('error', () => { try { socket.destroy(); } catch { /* ignore */ } });
    } catch {
      try { socket.destroy(); } catch { /* ignore */ }
    }
  });

  return new Promise((resolve, reject) => {
    const onErr = (err) => reject(err);
    server.once('error', onErr);
    server.listen(opts.port ?? 0, host, () => {
      server.removeListener('error', onErr);
      const addr = server.address();
      resolve({
        server,
        host,
        port: addr && typeof addr === 'object' ? addr.port : Number(opts.port),
        close() {
          return new Promise((res) => {
            try { server.closeAllConnections(); } catch { /* ignore */ }
            server.close(() => res());
          });
        },
      });
    });
  });
}

function parseArgs(argv) {
  const out = {
    host: '127.0.0.1',
    port: Number(process.env.AGENT_BRIDGE_PORT || 8765),
    cdpPort: 9222,
    gameUrl: '',
    launchChrome: false,
    selfTest: false,
    help: false,
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--self-test') out.selfTest = true;
    else if (a === '--launch-chrome') out.launchChrome = true;
    else if (a === '--host') out.host = String(args[++i] ?? '');
    else if (a === '--port') out.port = Number(args[++i]);
    else if (a === '--cdp-port') out.cdpPort = Number(args[++i]);
    else if (a === '--game-url') out.gameUrl = String(args[++i] ?? '');
  }
  if (!Number.isFinite(out.port) || out.port <= 0) out.port = 8765;
  if (!Number.isFinite(out.cdpPort) || out.cdpPort <= 0) out.cdpPort = 9222;
  return out;
}

function printHelp() {
  process.stdout.write(
    'Usage: node scripts/agent-bridge.mjs [options]\n'
    + '  --host <addr>     127.0.0.1 (default) or ::1. Refuses 0.0.0.0 and ::.\n'
    + '  --port <n>        default 8765 or AGENT_BRIDGE_PORT\n'
    + '  --cdp-port <n>    attach to existing Chrome (default 9222); ignored with --launch-chrome\n'
    + '  --game-url <url>  loopback game page; extra query agent=1 is allowed\n'
    + '  --launch-chrome   spawn Chrome with ephemeral CDP port; fail closed if attach fails\n'
    + '  --self-test       mock evaluator; no Chrome\n'
    + '  --help\n'
    + 'Env: AGENT_TOKEN (serve). Token is never in a URL query.\n'
    + 'HTTP: Authorization: Bearer. GET /health GET /observe POST /act\n'
    + 'WS: first {"token"} then {"op":"observe"} or {"op":"act","v":1,"name":"...","args":{}}\n',
  );
}

function captureLogs() {
  const lines = [];
  const orig = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };
  const push = (...a) => { lines.push(a.map(String).join(' ')); };
  console.log = push;
  console.warn = push;
  console.error = push;
  console.info = push;
  console.debug = push;
  return {
    lines,
    restore() {
      Object.assign(console, orig);
    },
  };
}

function hasCorsStar(headers) {
  if (!headers) return false;
  const raw = typeof headers.get === 'function'
    ? headers.get('access-control-allow-origin')
    : headers['access-control-allow-origin'];
  return raw === '*';
}

function httpCall(method, urlStr, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = http.request({
      hostname: u.hostname,
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
    req.on('error', reject);
    if (body != null) req.end(body);
    else req.end();
  });
}

export async function runSelfTest() {
  const pins = {
    bindLoopbackOk: false,
    bindV6LoopbackOk: false,
    bindAllV4Refused: false,
    bindAllV6Refused: false,
    tokenLenMismatchFalse: false,
    tokenMatchTrue: false,
    tokenWrongSameLenFalse: false,
    httpMissingAuth401: false,
    httpWrongToken401: false,
    httpObserveForwards: false,
    httpActForwards: false,
    noCorsStar: false,
    noTokenOrSnapshotLogs: false,
    devToolsActivePortParse: false,
    pageUrlMatch: false,
    pageUrlMismatch: false,
    healthShape: false,
    healthForeignOrigin403: false,
    chromeKeepAliveFlags: false,
  };

  pins.bindLoopbackOk = assertBindHost('127.0.0.1') === '127.0.0.1';
  pins.bindV6LoopbackOk = assertBindHost('::1') === '::1';
  try {
    assertBindHost('0.0.0.0');
  } catch (err) {
    pins.bindAllV4Refused = err && err.code === 'BIND_REFUSED';
  }
  try {
    assertBindHost('::');
  } catch (err) {
    pins.bindAllV6Refused = err && err.code === 'BIND_REFUSED';
  }

  const a = 'abcdefghijklmnopqrstuvwxyz012345';
  const b = 'abcdefghijklmnopqrstuvwxyz012346';
  const shortTok = 'short';
  try {
    pins.tokenLenMismatchFalse = tokenEqual(a, shortTok) === false;
  } catch {
    pins.tokenLenMismatchFalse = false;
  }
  pins.tokenMatchTrue = tokenEqual(a, a) === true;
  pins.tokenWrongSameLenFalse = tokenEqual(a, b) === false;

  const dtapDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-dtap-'));
  try {
    fs.writeFileSync(
      path.join(dtapDir, 'DevToolsActivePort'),
      '49152\n/devtools/browser/fixture-id\n',
      'utf8',
    );
    const parsed = readDevToolsActivePortFile(dtapDir);
    pins.devToolsActivePortParse = !!parsed
      && parsed.port === 49152
      && parsed.browserPath === '/devtools/browser/fixture-id'
      && parseDevToolsActivePort('not-a-port\n/x') == null
      && parseDevToolsActivePort('0\n/x') == null;
  } finally {
    try { fs.rmSync(dtapDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  pins.pageUrlMatch = pageUrlMatchesGame(
    'http://127.0.0.1:5173/index.html?agent=1&x=1',
    'http://127.0.0.1:5173/index.html',
  ) === true
    && pageUrlMatchesGame(
      'http://127.0.0.1:5173/index.html',
      'http://127.0.0.1:5173/index.html?agent=1',
    ) === true;
  pins.pageUrlMismatch = pageUrlMatchesGame(
    'http://127.0.0.1:5173/other.html',
    'http://127.0.0.1:5173/index.html',
  ) === false
    && pageUrlMatchesGame(
      'http://127.0.0.1:5174/index.html',
      'http://127.0.0.1:5173/index.html',
    ) === false
    && pickMatchingPage([
      { type: 'page', url: 'http://127.0.0.1:5173/other.html', webSocketDebuggerUrl: 'ws://127.0.0.1/x' },
    ], 'http://127.0.0.1:5173/index.html') === null;

  const launchArgs = chromeLaunchArgs({
    profile: path.join(os.tmpdir(), 'rw-dtap-pin'),
    gameUrl: '',
  });
  pins.chromeKeepAliveFlags = launchArgs.includes('--remote-debugging-port=0')
    && launchArgs.includes('--remote-debugging-address=127.0.0.1')
    && launchArgs.includes('--disable-background-timer-throttling')
    && launchArgs.includes('--disable-renderer-backgrounding')
    && launchArgs.includes('--disable-backgrounding-occluded-windows')
    && launchArgs.includes('--window-size=1280,720')
    && launchArgs.includes('about:blank');

  const fixture = crypto.randomBytes(32).toString('hex');
  const mockObserve = {
    v: 1, t: 9, ok: true, error: '', agentOptIn: true, events: [],
    world: { credits: 424242, currentSystem: 'fixture-sys' },
  };
  let lastAct = null;
  const cap = captureLogs();
  let bridge;
  try {
    bridge = await startBridge({
      host: '127.0.0.1',
      port: 0,
      token: fixture,
      evaluator: {
        async observe() { return mockObserve; },
        async act(cmd) {
          lastAct = cmd;
          return { v: 1, ok: true, error: '', name: cmd.name, token: '' };
        },
      },
      getHealth: async () => ({ cdpAttached: true, gameReady: false, agentOptIn: true }),
    });
    const base = `http://127.0.0.1:${bridge.port}`;
    const health = await httpCall('GET', `${base}/health`);
    const healthJson = health.json;
    pins.healthShape = health.status === 200
      && healthJson
      && healthJson.ok === true
      && healthJson.cdpAttached === true
      && healthJson.gameReady === false
      && healthJson.agentOptIn === true
      && !Object.prototype.hasOwnProperty.call(healthJson, 'token')
      && !String(health.text).includes(fixture)
      && !hasCorsStar(health.headers);

    const healthX = await httpCall('GET', `${base}/health`, {
      headers: { Origin: 'https://example.com' },
    });
    pins.healthForeignOrigin403 = healthX.status === 403 && !hasCorsStar(healthX.headers);

    const miss = await httpCall('GET', `${base}/observe`);
    pins.httpMissingAuth401 = miss.status === 401 && !hasCorsStar(miss.headers);

    const wrong = await httpCall('GET', `${base}/observe`, {
      headers: { Authorization: 'Bearer ' + '0'.repeat(fixture.length) },
    });
    pins.httpWrongToken401 = wrong.status === 401 && !hasCorsStar(wrong.headers);

    const obs = await httpCall('GET', `${base}/observe`, {
      headers: { Authorization: `Bearer ${fixture}` },
    });
    const obsJson = obs.json;
    pins.httpObserveForwards = obs.status === 200
      && obsJson && obsJson.ok === true
      && obsJson.t === 9
      && !hasCorsStar(obs.headers);

    const actRes = await httpCall('POST', `${base}/act`, {
      headers: {
        Authorization: `Bearer ${fixture}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ v: 1, name: 'ping', args: { n: 1 } }),
    });
    const actJson = actRes.json;
    pins.httpActForwards = actRes.status === 200
      && actJson && actJson.ok === true
      && actJson.name === 'ping'
      && lastAct
      && lastAct.v === 1
      && lastAct.name === 'ping'
      && lastAct.args && lastAct.args.n === 1
      && !hasCorsStar(actRes.headers);

    const opt = await httpCall('OPTIONS', `${base}/observe`);
    pins.noCorsStar = !hasCorsStar(miss.headers)
      && !hasCorsStar(wrong.headers)
      && !hasCorsStar(obs.headers)
      && !hasCorsStar(actRes.headers)
      && !hasCorsStar(opt.headers)
      && !hasCorsStar(health.headers);

    const joined = cap.lines.join('\n');
    pins.noTokenOrSnapshotLogs = !joined.includes(fixture)
      && !joined.includes('424242')
      && !joined.includes('fixture-sys')
      && !/credits/i.test(joined);
  } finally {
    cap.restore();
    if (bridge) await bridge.close();
  }

  process.stdout.write(JSON.stringify(pins, null, 2) + '\n');
  const all = Object.values(pins).every((v) => v === true);
  return all ? 0 : 1;
}

function resolveToken() {
  const env = process.env.AGENT_TOKEN;
  if (typeof env === 'string' && env.length > 0) return env;
  const generated = crypto.randomBytes(32).toString('hex');
  process.stderr.write(`AGENT_TOKEN=${generated}\n`);
  return generated;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  const here = fileURLToPath(import.meta.url);
  return path.resolve(entry).toLowerCase() === path.resolve(here).toLowerCase();
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.selfTest) return runSelfTest();

  let host;
  try {
    host = assertBindHost(args.host);
  } catch (err) {
    if (err && err.code === 'BIND_REFUSED') {
      process.stderr.write('bind host refused\n');
      return 1;
    }
    throw err;
  }

  let gameUrl = '';
  try {
    gameUrl = assertGameUrl(args.gameUrl);
  } catch (err) {
    if (err && err.code === 'GAME_URL_REFUSED') {
      process.stderr.write('game url refused\n');
      return 1;
    }
    throw err;
  }
  args.gameUrl = gameUrl;
  let chrome = null;
  let cdp = null;
  const cdpBox = { current: null };
  let cdpPort = args.cdpPort;

  if (args.launchChrome) {
    try {
      chrome = launchChrome({ gameUrl: args.gameUrl });
    } catch {
      process.stderr.write('chrome launch failed\n');
      return 1;
    }
    const discovered = await waitDevToolsActivePort(chrome.profile, 15000, chrome.child);
    if (!discovered) {
      killTree(chrome.child);
      process.stderr.write('cdp not ready\n');
      return 1;
    }
    cdpPort = discovered.port;
    try {
      cdp = await attachCdp({
        cdpPort,
        gameUrl: args.gameUrl,
        waitMs: 15000,
      });
      cdpBox.current = cdp;
      logLine('cdp attached');
    } catch {
      killTree(chrome.child);
      process.stderr.write('cdp attach failed\n');
      return 1;
    }
  } else {
    const ready = await waitCdp(cdpPort, 3000);
    if (!ready) {
      logLine('cdp attach failed; observe/act return no-ctx');
    } else {
      try {
        cdp = await attachCdp({
          cdpPort,
          gameUrl: args.gameUrl,
          waitMs: 5000,
        });
        cdpBox.current = cdp;
        logLine('cdp attached');
      } catch {
        logLine('cdp attach failed; observe/act return no-ctx');
      }
    }
  }

  const token = resolveToken();
  const health = makeHealth(() => cdpBox.current);
  let bridge;
  try {
    bridge = await startBridge({
      host,
      port: args.port,
      token,
      evaluator: makeCdpEvaluator(() => cdpBox.current, health),
      getHealth: () => health.getHealth(),
    });
  } catch (err) {
    try { if (cdp) cdp.close(); } catch { /* ignore */ }
    if (chrome) killTree(chrome.child);
    throw err;
  }
  logLine(`listen ${host}:${bridge.port}`);

  const shutdown = async () => {
    try { await bridge.close(); } catch { /* ignore */ }
    try { if (cdp) cdp.close(); } catch { /* ignore */ }
    if (chrome) killTree(chrome.child);
  };
  process.on('SIGINT', () => { shutdown().then(() => process.exit(0)); });
  process.on('SIGTERM', () => { shutdown().then(() => process.exit(0)); });
  return new Promise(() => {});
}

if (isDirectRun()) {
  main().then((code) => {
    if (typeof code === 'number') process.exit(code);
  }).catch((err) => {
    process.stderr.write('bridge failed\n');
    if (err && err.code !== 'BIND_REFUSED') {
      /* keep message short; do not dump secrets */
    }
    process.exit(1);
  });
}
