// Chrome CDP live AP-path check. No Page.captureScreenshot (wedges GPU).
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = Number(process.env.CDP_PORT || 9340);
const url = 'http://localhost:5173';
const profile = join(here, `chrome-profile-${port}`);
mkdirSync(profile, { recursive: true });

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
    '--window-size=1400,900',
    url,
  ], { stdio: 'ignore' });
}

async function waitPage(ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const list = await jsonGet('/json/list');
      const hit = list.find((t) => t.type === 'page' && String(t.url || '').includes('localhost:5173'));
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
  return p;
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

const bootWait = Date.now();
let boot = null;
while (Date.now() - bootWait < 20000) {
  boot = await evalJson(`({
    href: location.href,
    ctx: !!window.__ctx,
    title: !!document.getElementById('rw-title'),
    newBtn: !!document.getElementById('rw-title-new'),
    canvas: document.querySelectorAll('canvas').length,
    body: (document.body && document.body.innerText || '').slice(0, 160),
    sys: window.__ctx && window.__ctx.world && window.__ctx.world.currentSystem,
    paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused,
  })`);
  note('boot ' + JSON.stringify(boot));
  if (boot && boot.ctx) break;
  await sleep(400);
}

if (!boot || !boot.ctx) {
  writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({
    summary: { env: 'no-ctx' }, log,
  }, null, 2));
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
await sleep(600);
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
await sleep(800);

const flight = await evalJson(`(() => {
  const ctx = window.__ctx;
  const p = ctx.ship.object.position;
  return { sys: ctx.world.currentSystem, paused: ctx.flags.paused, pos: { x: p.x, y: p.y, z: p.z } };
})()`);
note('flight ' + JSON.stringify(flight));

const posBefore = flight.pos;

await evalJson(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }))`);
await sleep(300);
const plotted = await evalJson(`(() => {
  const hit = document.querySelector('.rw-galaxy-hit[data-system-id="veridian"]');
  if (!hit) return { ok: false };
  hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const nav = window.__ctx.world.nav;
  return { ok: true, dest: nav && nav.dest, path: nav && nav.path, next: nav && nav.path && nav.path[1] };
})()`);
note('plot ' + JSON.stringify(plotted));

const engaged = await evalJson(`(() => {
  const btn = document.querySelector('.rw-galaxy-ap');
  if (btn) btn.click();
  const ctx = window.__ctx;
  const p = ctx.ship.object.position;
  const ring = ctx.scene.getObjectByName('nav-gate-marker');
  return {
    flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
    pos: { x: p.x, y: p.y, z: p.z },
    ring: ring ? { visible: ring.visible, x: ring.position.x, y: ring.position.y, z: ring.position.z } : null,
    btn: btn && btn.textContent,
  };
})()`);
note('engage ' + JSON.stringify(engaged));
const noTeleport = !!(posBefore && engaged.pos
  && Math.abs(posBefore.x - engaged.pos.x) < 0.05
  && Math.abs(posBefore.y - engaged.pos.y) < 0.05
  && Math.abs(posBefore.z - engaged.pos.z) < 0.05);
note('noTeleport ' + noTeleport);

await evalJson(`(() => {
  const close = document.querySelector('.rw-galaxy-close');
  if (close) close.click();
  else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
  return true;
})()`);

const gate = { x: 0, y: 60, z: -900 };
const ringDist = engaged.ring
  ? Math.hypot(engaged.ring.x - gate.x, engaged.ring.y - gate.y, engaged.ring.z - gate.z)
  : null;
note('ringDist ' + ringDist);

const matchCheck = await evalJson(`(() => {
  const ctx = window.__ctx;
  if (ctx.world.nav && ctx.world.nav.autopilot) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
    const btn = document.querySelector('.rw-galaxy-ap');
    if (btn) btn.click();
    const close = document.querySelector('.rw-galaxy-close');
    if (close) close.click();
  }
  const dest = ctx.world.nav && ctx.world.nav.dest;
  const path = ctx.world.nav && ctx.world.nav.path && ctx.world.nav.path.slice();
  ctx.flags.matchSpeed = true;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
  const btn = document.querySelector('.rw-galaxy-ap');
  if (btn) btn.click();
  const live = document.getElementById('rw-galaxy-ap-live');
  const refused = ctx.world.nav && ctx.world.nav.autopilot === false;
  const kept = ctx.world.nav && ctx.world.nav.dest === dest
    && JSON.stringify(ctx.world.nav.path) === JSON.stringify(path);
  ctx.flags.matchSpeed = false;
  const close = document.querySelector('.rw-galaxy-close');
  if (close) close.click();
  return { refused, kept, live: live && live.textContent, dest };
})()`);
note('match ' + JSON.stringify(matchCheck));

const hearth = await evalJson(`(() => {
  const ctx = window.__ctx;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
  const hit = document.querySelector('.rw-galaxy-hit[data-system-id="fh_hearth"]');
  if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const close = document.querySelector('.rw-galaxy-close');
  if (close) close.click();
  const ring = ctx.scene.getObjectByName('nav-gate-marker');
  const hub = { x: 120, y: 70, z: -820 };
  const nav = ctx.world.nav;
  return {
    dest: nav && nav.dest,
    next: nav && nav.path && nav.path[1],
    ring: ring ? { visible: ring.visible, x: ring.position.x, y: ring.position.y, z: ring.position.z } : null,
    distHub: ring ? Math.hypot(ring.position.x - hub.x, ring.position.y - hub.y, ring.position.z - hub.z) : null,
  };
})()`);
note('hearth ' + JSON.stringify(hearth));

await evalJson(`(() => {
  const ctx = window.__ctx;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
  const hit = document.querySelector('.rw-galaxy-hit[data-system-id="veridian"]');
  if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const btn = document.querySelector('.rw-galaxy-ap');
  if (btn) btn.click();
  const close = document.querySelector('.rw-galaxy-close');
  if (close) close.click();
  const gate = { x: 0, y: 60, z: -900 };
  ctx.flags.combat = false;
  ctx.flags.matchSpeed = false;
  ctx.flags.paused = false;
  ctx.ship.object.position.set(gate.x, gate.y, gate.z + 80);
  ctx.ship.velocity.set(0, 0, 0);
  return { flying: ctx.world.nav && ctx.world.nav.autopilot, next: ctx.world.nav && ctx.world.nav.path && ctx.world.nav.path[1] };
})()`);

let jumped = null;
const tJump = Date.now();
while (Date.now() - tJump < 18000) {
  jumped = await evalJson(`(() => {
    const ctx = window.__ctx;
    ctx.flags.combat = false;
    return {
      sys: ctx.world.currentSystem,
      jumping: ctx.gate && ctx.gate.jumping,
      dest: ctx.gate && ctx.gate.destination,
      inZone: ctx.gate && ctx.gate.inZone,
      nearTo: ctx.gate && ctx.gate.nearTo,
      flying: ctx.world.nav && ctx.world.nav.autopilot,
      wantJump: ctx.autopilot && ctx.autopilot.wantJump,
      pos: { x: ctx.ship.object.position.x, y: ctx.ship.object.position.y, z: ctx.ship.object.position.z },
    };
  })()`);
  note('tick ' + JSON.stringify(jumped));
  if (jumped && (jumped.jumping || jumped.sys === 'veridian')) break;
  await sleep(400);
}
await sleep(2800);
const after = await evalJson(`(() => {
  const ctx = window.__ctx;
  return { sys: ctx.world.currentSystem, jumping: ctx.gate && ctx.gate.jumping, dest: ctx.gate && ctx.gate.destination };
})()`);
note('after ' + JSON.stringify(after));

const summary = {
  plotNext: plotted && plotted.next,
  flying: engaged && engaged.flying,
  noTeleport,
  ringDist,
  ringVisible: engaged && engaged.ring && engaged.ring.visible,
  matchRefused: matchCheck && matchCheck.refused,
  matchKept: matchCheck && matchCheck.kept,
  hearthNext: hearth && hearth.next,
  hearthDistHub: hearth && hearth.distHub,
  jumped: !!(jumped && (jumped.jumping || jumped.sys === 'veridian')),
  afterSys: after && after.sys,
};
writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, log }, null, 2));
note('SUMMARY ' + JSON.stringify(summary));
ws.close();
