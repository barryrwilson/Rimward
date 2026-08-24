import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9403;
const url = process.env.APP_URL || 'http://localhost:5188/';
const profile = join(here, `chrome-profile-${port}`);
mkdirSync(profile, { recursive: true });

function jsonGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 4000 }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('CDP HTTP timeout')); });
  });
}

try { await jsonGet('/json/version'); }
catch {
  spawn(chrome, [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--window-size=1200,800',
    'about:blank',
  ], { stdio: 'ignore', detached: true });
}

async function waitPage() {
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    try {
      const list = await jsonGet('/json/list');
      const hit = list.find((t) => t.type === 'page');
      if (hit) return hit;
    } catch { /* */ }
    await sleep(250);
  }
  throw new Error('no page');
}

const page = await waitPage();
console.log('page', page.url, page.title);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', () => reject(new Error('ws')));
});
let nextId = 1;
const pending = new Map();
const cons = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.method === 'Runtime.consoleAPICalled') {
    const t = (msg.params.args || []).map((a) => a.value ?? a.description).join(' ');
    cons.push(`${msg.params.type}: ${t}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    cons.push('exc: ' + JSON.stringify(msg.params.exceptionDetails && msg.params.exceptionDetails.exception));
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
function send(method, params) {
  const id = nextId++;
  const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return p;
}
await send('Runtime.enable');
await send('Page.enable');
await send('Log.enable');
const nav = await send('Page.navigate', { url });
console.log('nav', JSON.stringify(nav));
for (let i = 0; i < 20; i++) {
  await sleep(1500);
  const snap = await send('Runtime.evaluate', {
    expression: `({
      ready: document.readyState,
      ctx: typeof window.__ctx,
      canvas: document.querySelectorAll('canvas').length,
      titleEl: !!document.getElementById('rw-title'),
      paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused,
    })`,
    returnByValue: true,
  });
  console.log('t' + i, JSON.stringify(snap.result && snap.result.value));
  const v = snap.result && snap.result.value;
  if (v && (v.ctx === 'object' || v.canvas > 0 || v.titleEl)) break;
}
const info = await send('Runtime.evaluate', {
  expression: `({
    href: location.href,
    ready: document.readyState,
    title: document.title,
    scripts: [...document.scripts].map(s => s.src).slice(0,8),
    text: (document.body && document.body.innerText || '').slice(0,400),
    html: (document.documentElement && document.documentElement.outerHTML || '').slice(0,600),
    canvas: document.querySelectorAll('canvas').length,
    ctx: typeof window.__ctx,
  })`,
  returnByValue: true,
});
console.log('info', JSON.stringify(info.result && info.result.value, null, 2));
console.log('console', cons.slice(0, 30).join('\n'));
writeFileSync(join(here, 'cdp-diag.json'), JSON.stringify({
  info: info.result && info.result.value,
  cons,
}, null, 2));
ws.close();
process.exit(0);
