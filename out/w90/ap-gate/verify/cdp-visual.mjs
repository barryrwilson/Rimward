/**
 * Visual recapture: dismiss origin overlay, park near Auction hub, shot ring.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = Number(process.env.CDP_PORT || 9488);
const url = 'http://127.0.0.1:5188/';
const profile = join(here, 'chrome-profile');
mkdirSync(profile, { recursive: true });

const log = [];
const note = (s) => { log.push(s); console.log(s); };

function jsonGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 2500 }, (res) => {
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

let chromeProc = null;
try {
  await jsonGet('/json/list');
} catch {
  chromeProc = spawn(chrome, [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1400,900',
    url,
  ], { stdio: 'ignore' });
  note('spawn chrome pid=' + chromeProc.pid);
}

async function waitPage(ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const list = await jsonGet('/json/list');
      const hit = list.find((t) => t.type === 'page') || list.find((t) => t.webSocketDebuggerUrl);
      if (hit) return hit;
    } catch { /* boot */ }
    await sleep(300);
  }
  throw new Error('CDP page not ready');
}

const page = await waitPage();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', () => reject(new Error('ws')));
});
let nextId = 1;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data));
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
  return Promise.race([
    p,
    sleep(15000).then(() => { pending.delete(id); throw new Error('cdp-timeout ' + method); }),
  ]);
}
async function evalJson(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result ? r.result.value : undefined;
}

await send('Runtime.enable');
await send('Page.enable');
await send('Page.bringToFront');
await send('Page.navigate', { url });
await sleep(1200);

const bootWait = Date.now();
while (Date.now() - bootWait < 45000) {
  const boot = await evalJson(`({ ctx: !!window.__ctx, title: !!document.getElementById('rw-title') })`);
  note('boot ' + JSON.stringify(boot));
  if (boot && boot.ctx) break;
  await sleep(600);
}

await evalJson(`(() => {
  const neu = document.getElementById('rw-title-new');
  const cont = document.getElementById('rw-title-continue');
  if (neu) neu.click();
  else if (cont) cont.click();
  return true;
})()`);
await sleep(500);

const picked = await evalJson(`(() => {
  const title = document.getElementById('rw-title');
  if (title && title.remove) title.remove();
  const rows = [...document.querySelectorAll('div')].filter((el) =>
    /^\\[1\\]/.test((el.textContent || '').trim()) && (el.textContent || '').length < 220);
  if (rows[0]) rows[0].click();
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }));
  return {
    origin: window.__ctx && window.__ctx.world && window.__ctx.world.origin,
    paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused,
    overlay: [...document.querySelectorAll('div')].some((el) =>
      (el.textContent || '').includes('who are you') || (el.textContent || '').includes('WHO ARE YOU')),
  };
})()`);
note('picked ' + JSON.stringify(picked));
if (picked && picked.overlay) {
  await evalJson(`(() => {
    const card = [...document.querySelectorAll('div')].find((el) =>
      (el.textContent || '').includes('who are you') || (el.textContent || '').includes('WHO ARE YOU'));
    if (card && card.parentElement) card.parentElement.remove();
    window.__ctx.world.origin = window.__ctx.world.origin || 'greenhand';
    window.__ctx.flags.paused = false;
    return true;
  })()`);
}
await sleep(400);

const parked = await evalJson(`(async () => {
  const ctx = window.__ctx;
  ctx.flags.paused = false;
  ctx.flags.docked = false;
  ctx.flags.combat = false;
  const dest = 'gc_auction';
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  if (ctx.world.currentSystem !== dest) {
    ctx.emit('jumpRequested', { to: dest });
    for (let i = 0; i < 240; i++) {
      await waitFrames(1);
      if (ctx.world.currentSystem === dest && !ctx.gate.jumping) break;
    }
  }
  const nav = await import('/src/game/nav.js');
  nav.plotRoute(ctx, 'bt_cradle');
  const ap = await import('/src/game/autopilot.js');
  ap.tryEngage(ctx);
  ctx.ship.object.position.set(430, 90, -650);
  ctx.ship.object.lookAt(368, 76, -747);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 40;
  ctx.camera.position.set(500, 140, -520);
  ctx.camera.lookAt(368, 76, -747);
  await waitFrames(10);
  const gateMod = await import('/src/systems/gate.js');
  let hub = null;
  let marker = null;
  ctx.scene.traverse((o) => {
    if (o && o.name === 'lamplighter-junction') hub = { x: o.position.x, y: o.position.y, z: o.position.z, visible: o.visible };
    if (o && o.name === 'nav-gate-marker') marker = { x: o.position.x, y: o.position.y, z: o.position.z, visible: o.visible };
  });
  return {
    sys: ctx.world.currentSystem,
    origin: ctx.world.origin,
    paused: ctx.flags.paused,
    overlay: [...document.querySelectorAll('div')].some((el) =>
      (el.textContent || '').includes('WHO ARE YOU')),
    live: gateMod.lookupLiveNavGate('bt_cradle', 'gc_auction'),
    hub,
    marker,
    flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
  };
})()`);
note('parked ' + JSON.stringify(parked));

async function shot(name) {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  writeFileSync(join(here, name), buf);
  note('screenshot ' + name + ' bytes=' + buf.length);
}
await shot('flow-a-hub-visual.png');

writeFileSync(join(here, 'cdp-visual.json'), JSON.stringify({ parked, log }, null, 2));
ws.close();
if (chromeProc && chromeProc.pid) {
  try { process.kill(chromeProc.pid); } catch { /* ignore */ }
}
process.exit(parked && parked.hub && parked.marker && parked.marker.visible ? 0 : 1);
