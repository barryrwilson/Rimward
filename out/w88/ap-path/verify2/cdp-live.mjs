/**
 * Chrome CDP live AP-path check (Playwright MCP locked).
 * Vite http://127.0.0.1:5190/  Freehold → Veridian.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = Number(process.env.CDP_PORT || 9410);
const url = process.env.VITE_URL || 'http://127.0.0.1:5190/';
const profile = join(here, `chrome-profile-${port}`);
mkdirSync(profile, { recursive: true });

function jsonReq(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, timeout: 4000 }, (res) => {
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
    req.end();
  });
}
function jsonGet(path) { return jsonReq('GET', path); }

let listed = false;
try {
  await jsonGet('/json/list');
  listed = true;
} catch {
  listed = false;
}
if (!listed) {
  spawn(chrome, [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu-sandbox',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--window-size=1400,900',
    url,
  ], { stdio: 'ignore', detached: true, windowsHide: true });
}

async function waitPage(ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const list = await jsonGet('/json/list');
      const hit = list.find((t) => t.type === 'page' && String(t.url || '').includes('127.0.0.1'))
        || list.find((t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://'))
        || list.find((t) => t.type === 'page')
        || list.find((t) => t.webSocketDebuggerUrl);
      if (hit) return hit;
    } catch { /* boot */ }
    await sleep(300);
  }
  throw new Error('CDP page not ready');
}

let page = null;
if (!process.env.CDP_ATTACH) {
  try {
    page = await jsonReq('PUT', '/json/new?' + encodeURI(url));
    console.log('cdp new', JSON.stringify({ url: page.url, id: page.id, ws: !!page.webSocketDebuggerUrl }));
    await sleep(2500);
  } catch (err) {
    console.log('json/new fail', String(err && err.message ? err.message : err));
  }
}
if (!page || !page.webSocketDebuggerUrl) {
  page = await waitPage();
}
console.log('cdp page', JSON.stringify({ url: page.url, title: page.title, ws: !!page.webSocketDebuggerUrl }));
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
function send(method, params, timeoutMs = 30000) {
  const id = nextId++;
  const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return Promise.race([
    p,
    sleep(timeoutMs).then(() => {
      pending.delete(id);
      throw new Error('cdp-timeout ' + method);
    }),
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

const log = [];
const note = (s) => { log.push(s); console.log(s); };

let already = null;
try {
  already = await evalJson(`({ href: location.href, ctx: !!window.__ctx, ready: document.readyState })`);
} catch (err) {
  note('already-eval fail ' + String(err && err.message ? err.message : err));
}
note('already ' + JSON.stringify(already));
const wantHost = String(url);
const onVite = (page.url && String(page.url).includes(wantHost.replace(/\/$/, '')))
  || (already && already.href && String(already.href).includes(wantHost.replace(/\/$/, '')));
if (!onVite) {
  try {
    await send('Page.navigate', { url }, 45000);
    console.log('navigated', url);
  } catch (err) {
    console.log('navigate fail', String(err && err.message ? err.message : err));
  }
  await sleep(1500);
} else {
  note('skip navigate, target already on vite');
  if (process.env.CDP_RELOAD) {
    try {
      await send('Page.reload', { ignoreCache: true }, 45000);
      note('reloaded');
    } catch (err) {
      note('reload fail ' + String(err && err.message ? err.message : err));
    }
  }
  await sleep(1200);
}

const bootWait = Date.now();
let boot = null;
while (Date.now() - bootWait < 45000) {
  boot = await evalJson(`({
    href: location.href,
    ready: document.readyState,
    ctx: !!window.__ctx,
    title: !!document.getElementById('rw-title'),
    newBtn: !!document.getElementById('rw-title-new'),
    canvas: document.querySelectorAll('canvas').length,
    sys: window.__ctx && window.__ctx.world && window.__ctx.world.currentSystem,
    paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused,
  })`);
  note('boot ' + JSON.stringify(boot));
  if (boot && boot.ctx) break;
  await sleep(800);
}

if (!boot || !boot.ctx) {
  writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary: { env: 'no-ctx' }, log }, null, 2));
  console.log('SUMMARY {"env":"no-ctx"}');
  ws.close();
  process.exit(2);
}

await evalJson(`(() => {
  const neu = document.getElementById('rw-title-new');
  const cont = document.getElementById('rw-title-continue');
  if (neu) neu.click();
  else if (cont) cont.click();
  return true;
})()`);
await sleep(700);
await evalJson(`(() => {
  const rows = [...document.querySelectorAll('div')].filter((el) =>
    (el.textContent || '').includes('Freehold Greenhand'));
  if (rows[0]) rows[0].click();
  else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }));
  const t = document.getElementById('rw-title');
  if (t && t.remove) t.remove();
  const ctx = window.__ctx;
  if (ctx) {
    ctx.flags.paused = false;
    ctx.flags.docked = false;
    ctx.flags.combat = false;
    ctx.flags.matchSpeed = false;
  }
  return true;
})()`);
await sleep(900);

const flight = await evalJson(`(() => {
  const ctx = window.__ctx;
  const p = ctx.ship.object.position;
  return {
    sys: ctx.world.currentSystem,
    paused: ctx.flags.paused,
    pos: { x: p.x, y: p.y, z: p.z },
  };
})()`);
note('flight ' + JSON.stringify(flight));

try {
  await evalJson(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }))`);
} catch (err) {
  note('keym fail ' + String(err));
}
await sleep(500);
let plotted = null;
try {
  plotted = await evalJson(`(() => {
    const hit = document.querySelector('.rw-galaxy-hit[data-system-id="veridian"]');
    if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const nav = window.__ctx.world.nav;
    return {
      hit: !!hit,
      dest: nav && nav.dest,
      path: nav && nav.path,
      next: nav && nav.path && nav.path[1],
      open: !!(window.__ctx.flags && window.__ctx.flags.chartOpen),
    };
  })()`);
} catch (err) {
  note('plot eval fail ' + String(err));
}
note('plot ' + JSON.stringify(plotted));
if (!(plotted && plotted.next === 'veridian')) {
  const forced = await evalJson(`(async () => {
    const m = await import('/src/game/nav.js');
    m.plotRoute(window.__ctx, 'veridian');
    const nav = window.__ctx.world.nav;
    return { dest: nav && nav.dest, path: nav && nav.path, next: nav && nav.path && nav.path[1], via: 'import' };
  })()`);
  note('plot import ' + JSON.stringify(forced));
  plotted = forced;
}

let engaged;
try {
  engaged = await evalJson(`(() => {
    const btn = document.querySelector('.rw-galaxy-ap');
    if (btn) btn.click();
    const ctx = window.__ctx;
    const p = ctx.ship.object.position;
    return {
      flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
      btn: btn && btn.textContent,
      yaw: ctx.autopilot && ctx.autopilot.yaw,
      throttle: ctx.autopilot && ctx.autopilot.throttle,
      wantJump: ctx.autopilot && ctx.autopilot.wantJump,
      pos: { x: p.x, y: p.y, z: p.z },
    };
  })()`);
} catch (err) {
  note('engage eval fail ' + String(err));
  engaged = {};
}
if (!(engaged && engaged.flying)) {
  engaged = await evalJson(`(async () => {
    const m = await import('/src/game/autopilot.js');
    const tok = m.tryEngage(window.__ctx);
    const ctx = window.__ctx;
    const p = ctx.ship.object.position;
    return {
      tok,
      flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
      yaw: ctx.autopilot && ctx.autopilot.yaw,
      throttle: ctx.autopilot && ctx.autopilot.throttle,
      wantJump: ctx.autopilot && ctx.autopilot.wantJump,
      pos: { x: p.x, y: p.y, z: p.z },
      via: 'import',
    };
  })()`);
}
note('engage ' + JSON.stringify(engaged));

await evalJson(`(() => {
  const close = document.querySelector('.rw-galaxy-close');
  if (close) close.click();
  else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
  return true;
})()`);
await sleep(200);

const samples = [];
let minSun = Infinity;
const heatR = 60 * 2.4;
const keepSun = heatR + 2.4 + 12;
for (let i = 0; i < 12; i++) {
  const s = await evalJson(`(() => {
    const ctx = window.__ctx;
    ctx.flags.combat = false;
    ctx.flags.paused = false;
    const p = ctx.ship.object.position;
    const q = ctx.ship.object.quaternion;
    const fx = 2 * (q.x * q.z + q.w * q.y);
    const fy = 2 * (q.y * q.z - q.w * q.x);
    const fz = 1 - 2 * (q.x * q.x + q.y * q.y);
    const hx = -fx, hy = -fy, hz = -fz;
    const sun = ctx.config.world.sunPosition;
    const dx = p.x - sun.x, dy = p.y - sun.y, dz = p.z - sun.z;
    const sunDist = Math.hypot(dx, dy, dz);
    const gate = { x: 0, y: 60, z: -900 };
    const gx = gate.x - p.x, gy = gate.y - p.y, gz = gate.z - p.z;
    const glen = Math.hypot(gx, gy, gz) || 1;
    const headingDotGate = (hx * gx + hy * gy + hz * gz) / glen;
    const aim = ctx.autopilot;
    return {
      flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
      sys: ctx.world.currentSystem,
      yaw: aim && aim.yaw,
      pitch: aim && aim.pitch,
      throttle: aim && aim.throttle,
      wantJump: aim && aim.wantJump,
      inZone: ctx.gate && ctx.gate.inZone,
      nearTo: ctx.gate && ctx.gate.nearTo,
      pos: { x: p.x, y: p.y, z: p.z },
      heading: { x: hx, y: hy, z: hz },
      sunDist,
      headingDotGate,
      speed: ctx.ship.speed,
    };
  })()`);
  s.i = i;
  samples.push(s);
  if (s.sunDist < minSun) minSun = s.sunDist;
  note('sample ' + JSON.stringify(s));
  await sleep(400);
}

let shotErr = null;
try {
  const shot = await Promise.race([
    send('Page.captureScreenshot', { format: 'jpeg', quality: 40 }),
    sleep(4000).then(() => { throw new Error('screenshot-timeout'); }),
  ]);
  if (shot && shot.data) {
    writeFileSync(join(here, 'browser-ap.jpg'), Buffer.from(shot.data, 'base64'));
    note('screenshot saved browser-ap.jpg bytes=' + Buffer.from(shot.data, 'base64').length);
  }
} catch (err) {
  shotErr = String(err && err.message ? err.message : err);
  note('screenshot fail ' + shotErr);
}

const maxAbsYaw = Math.max(0, ...samples.map((s) => Math.abs(s.yaw || 0)));
const yawedOff = samples.some((s) => Math.abs(s.yaw || 0) > 0.15);
const throughKeep = minSun < keepSun;
const throughHeat = minSun < heatR;
const wantJumpEarly = samples.some((s) => s.wantJump && !s.inZone);
const stayedOnDirect = samples.length > 4 && samples.slice(0, 8).every((s) => (s.headingDotGate || 0) > 0.995);
const summary = {
  flying: samples.some((s) => s.flying),
  yawedOff,
  maxAbsYaw,
  minSun,
  throughKeep,
  throughHeat,
  wantJumpEarly,
  stayedOnDirect,
  dest: plotted && plotted.dest,
  next: plotted && plotted.next,
  shotErr,
};
writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, samples, log }, null, 2));
console.log('SUMMARY ' + JSON.stringify(summary));
ws.close();
process.exit(summary.flying && yawedOff && !stayedOnDirect ? 0 : 3);
