/**
 * Chrome CDP live check: Auction hub vs physical Veridian + title-pause drift.
 * Vite: http://127.0.0.1:5188/  CDP: 9488
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
const summary = { ok: false, env: null, flowA: null, flowB: null, flowC: null, errors: [] };

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

let chromeProc = null;
if (!listed) {
  chromeProc = spawn(chrome, [
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
  ], { stdio: 'ignore' });
  note('spawn chrome pid=' + chromeProc.pid);
}

async function waitPage(ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const list = await jsonGet('/json/list');
      const hit = list.find((t) => t.type === 'page')
        || list.find((t) => t.webSocketDebuggerUrl);
      if (hit) return hit;
    } catch { /* boot */ }
    await sleep(300);
  }
  throw new Error('CDP page not ready');
}

let page;
try {
  page = await waitPage();
} catch (err) {
  summary.env = 'no-cdp-page';
  writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, log, err: String(err) }, null, 2));
  console.log('SUMMARY ' + JSON.stringify(summary));
  process.exit(2);
}
note('cdp page ' + JSON.stringify({ url: page.url, title: page.title, ws: !!page.webSocketDebuggerUrl }));

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
    sleep(15000).then(() => {
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
await send('Console.enable');
await send('Page.bringToFront');

const consoleErrs = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.method === 'Runtime.exceptionThrown') {
    const t = msg.params && msg.params.exceptionDetails && msg.params.exceptionDetails.text;
    consoleErrs.push('exception ' + String(t || ''));
  }
  if (msg.method === 'Console.messageAdded') {
    const m = msg.params && msg.params.message;
    if (m && (m.level === 'error' || m.level === 'warning')) {
      consoleErrs.push((m.level || 'log') + ' ' + String(m.text || ''));
    }
  }
});

const already = await evalJson(`({ href: location.href, ctx: !!window.__ctx })`).catch(() => null);
note('already ' + JSON.stringify(already));
if (!(already && already.ctx && String(already.href || '').includes('5188'))) {
  try {
    await send('Page.navigate', { url });
    note('navigated ' + url);
  } catch (err) {
    note('navigate fail ' + String(err && err.message ? err.message : err));
  }
  await sleep(800);
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
  })`).catch((err) => ({ err: String(err) }));
  note('boot ' + JSON.stringify(boot));
  if (boot && boot.ctx) break;
  await sleep(800);
}

if (!boot || !boot.ctx) {
  summary.env = 'no-ctx';
  writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, log }, null, 2));
  console.log('SUMMARY ' + JSON.stringify(summary));
  ws.close();
  if (chromeProc && chromeProc.pid) process.kill(chromeProc.pid);
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

const flight = await evalJson(`({
  sys: window.__ctx.world.currentSystem,
  paused: window.__ctx.flags.paused,
  ship: !!window.__ctx.ship.object,
})`);
note('flight ' + JSON.stringify(flight));

async function snapshotGates(tag) {
  return evalJson(`(async () => {
    const ctx = window.__ctx;
    const gateMod = await import('/src/systems/gate.js');
    const navMod = await import('/src/systems/nav-guidance.js');
    const hub = { found: false };
    const rings = [];
    const marker = { found: false };
    ctx.scene.traverse((o) => {
      if (!o) return;
      if (o.name === 'lamplighter-junction') {
        hub.found = true;
        hub.x = o.position.x; hub.y = o.position.y; hub.z = o.position.z;
        hub.parent = !!o.parent;
        hub.visible = o.visible;
      }
      if (o.name && String(o.name).endsWith('-gate')) {
        rings.push({ name: o.name, x: o.position.x, y: o.position.y, z: o.position.z, visible: o.visible });
      }
      if (o.name === 'nav-gate-marker') {
        marker.found = true;
        marker.visible = o.visible;
        marker.x = o.position.x; marker.y = o.position.y; marker.z = o.position.z;
      }
    });
    const p = ctx.ship.object.position;
    const liveCradle = gateMod.lookupLiveNavGate('bt_cradle', ctx.world.currentSystem);
    const liveV = gateMod.lookupLiveNavGate('veridian', ctx.world.currentSystem);
    const posCradle = navMod.resolveNavGatePos(ctx, 'bt_cradle');
    const posV = navMod.resolveNavGatePos(ctx, 'veridian');
    const guide = navMod.readNavGuidance(ctx);
    const distEl = document.querySelector('.rw-nav-readout-dist .rw-value');
    const sysEl = document.querySelector('.rw-sysname');
    function d3(a, b) {
      if (!a || !b) return null;
      return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    return {
      tag: ${JSON.stringify('x')}.replace('x', '${tag}'),
      sys: ctx.world.currentSystem,
      paused: ctx.flags.paused,
      jumping: ctx.gate && ctx.gate.jumping,
      ship: { x: p.x, y: p.y, z: p.z },
      hub,
      rings,
      marker,
      liveCradle,
      liveV,
      posCradle,
      posV,
      guide,
      distText: distEl ? distEl.textContent : null,
      sysText: sysEl ? sysEl.textContent : null,
      nav: ctx.world.nav,
      ap: {
        flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
        yaw: ctx.autopilot && ctx.autopilot.yaw,
        throttle: ctx.autopilot && ctx.autopilot.throttle,
        wantJump: ctx.autopilot && ctx.autopilot.wantJump,
        reason: ctx.autopilot && ctx.autopilot.reason,
      },
      markerToHub: d3(marker.found ? marker : null, hub.found ? hub : null),
      markerToCradle: d3(marker.found ? marker : null, liveCradle),
      markerToVeridian: d3(marker.found ? marker : null, liveV),
      shipToCradle: d3({ x: p.x, y: p.y, z: p.z }, liveCradle),
      shipToVeridian: d3({ x: p.x, y: p.y, z: p.z }, liveV),
    };
  })()`);
}

async function shot(name) {
  try {
    const shot = await Promise.race([
      send('Page.captureScreenshot', { format: 'png' }),
      sleep(6000).then(() => { throw new Error('screenshot-timeout'); }),
    ]);
    if (shot && shot.data) {
      const buf = Buffer.from(shot.data, 'base64');
      writeFileSync(join(here, name), buf);
      note('screenshot ' + name + ' bytes=' + buf.length);
      return true;
    }
  } catch (err) {
    note('screenshot fail ' + name + ' ' + String(err && err.message ? err.message : err));
  }
  return false;
}

note('jump auction');
const jumped = await evalJson(`(async () => {
  const ctx = window.__ctx;
  const dest = 'gc_auction';
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  ctx.flags.paused = false;
  ctx.flags.docked = false;
  ctx.flags.combat = false;
  if (ctx.world.currentSystem !== dest) {
    ctx.emit('jumpRequested', { to: dest });
    for (let i = 0; i < 300; i++) {
      await waitFrames(1);
      if (ctx.world.currentSystem === dest && !ctx.gate.jumping) break;
    }
  }
  return {
    sys: ctx.world.currentSystem,
    jumping: ctx.gate.jumping,
    paused: ctx.flags.paused,
  };
})()`);
note('jumped ' + JSON.stringify(jumped));
await sleep(400);

async function plotAndEngage(systemId) {
  let plotted = await evalJson(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
    return true;
  })()`);
  note('keym ' + JSON.stringify(plotted));
  await sleep(400);
  plotted = await evalJson(`(() => {
    const hit = document.querySelector('.rw-galaxy-hit[data-system-id="${systemId}"]');
    if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const nav = window.__ctx.world.nav;
    return {
      hit: !!hit,
      dest: nav && nav.dest,
      path: nav && nav.path,
      next: nav && nav.path && nav.path[1],
    };
  })()`);
  note('plot click ' + JSON.stringify(plotted));
  if (!(plotted && plotted.next === systemId)) {
    plotted = await evalJson(`(async () => {
      const m = await import('/src/game/nav.js');
      m.plotRoute(window.__ctx, '${systemId}');
      const nav = window.__ctx.world.nav;
      return { dest: nav && nav.dest, path: nav && nav.path, next: nav && nav.path && nav.path[1], via: 'import' };
    })()`);
    note('plot import ' + JSON.stringify(plotted));
  }
  let engaged = await evalJson(`(() => {
    const btn = document.querySelector('.rw-galaxy-ap');
    if (btn) btn.click();
    const ctx = window.__ctx;
    return {
      flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
      btn: btn && btn.textContent,
      tok: null,
    };
  })()`);
  if (!(engaged && engaged.flying)) {
    engaged = await evalJson(`(async () => {
      const m = await import('/src/game/autopilot.js');
      const tok = m.tryEngage(window.__ctx);
      const ctx = window.__ctx;
      return {
        tok,
        flying: !!(ctx.world.nav && ctx.world.nav.autopilot),
        via: 'import',
      };
    })()`);
  }
  note('engage ' + JSON.stringify(engaged));
  await evalJson(`(() => {
    const close = document.querySelector('.rw-galaxy-close');
    if (close) close.click();
    else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
    window.__ctx.flags.paused = false;
    return true;
  })()`);
  await sleep(200);
  return { plotted, engaged };
}

const a = await plotAndEngage('bt_cradle');
await sleep(600);
const snapA0 = await snapshotGates('A0');
note('snapA0 ' + JSON.stringify(snapA0));
await shot('flow-a-ring.png');
await sleep(1800);
const snapA1 = await snapshotGates('A1');
note('snapA1 ' + JSON.stringify(snapA1));
await shot('flow-a-fly.png');

const hub = { x: 368, y: 76, z: -747 };
function near(a, b, eps) {
  if (!a || !b) return false;
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= (eps || 2);
}

summary.flowA = {
  sys: snapA1 && snapA1.sys,
  liveCradleHub: near(snapA1 && snapA1.liveCradle, hub, 1),
  markerOnHub: snapA1 && snapA1.marker && snapA1.marker.visible && near(snapA1.marker, hub, 2),
  distShrunk: (snapA0 && snapA1 && Number.isFinite(snapA0.shipToCradle) && Number.isFinite(snapA1.shipToCradle))
    ? snapA1.shipToCradle < snapA0.shipToCradle - 1
    : false,
  flying: snapA1 && snapA1.ap && snapA1.ap.flying,
  distText: snapA1 && snapA1.distText,
  shipToCradle0: snapA0 && snapA0.shipToCradle,
  shipToCradle1: snapA1 && snapA1.shipToCradle,
  markerToHub: snapA1 && snapA1.markerToHub,
  engage: a.engaged,
};

note('FLOW A ' + JSON.stringify(summary.flowA));

await evalJson(`(async () => {
  const m = await import('/src/game/autopilot.js');
  m.disengage(window.__ctx, 'cancel');
  return true;
})()`);

const b = await plotAndEngage('veridian');
await sleep(700);
const snapB = await snapshotGates('B');
note('snapB ' + JSON.stringify(snapB));
await shot('flow-b-veridian.png');
const veridian = { x: 987, y: 48, z: 394 };
summary.flowB = {
  liveVPhysical: near(snapB && snapB.liveV, veridian, 1),
  liveVNotHub: snapB && snapB.liveV ? !near(snapB.liveV, hub, 5) : false,
  markerOnPhysical: snapB && snapB.marker && snapB.marker.visible && near(snapB.marker, veridian, 2),
  markerNotHub: snapB && snapB.marker ? !near(snapB.marker, hub, 5) : false,
  engage: b.engaged,
};
note('FLOW B ' + JSON.stringify(summary.flowB));

await evalJson(`(async () => {
  const m = await import('/src/game/autopilot.js');
  m.disengage(window.__ctx, 'cancel');
  return true;
})()`);

note('flow C title-pause drift');
const snapC = await evalJson(`(async () => {
  const ctx = window.__ctx;
  const gateMod = await import('/src/systems/gate.js');
  const navMod = await import('/src/systems/nav-guidance.js');
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  ctx.flags.paused = false;
  ctx.world.currentSystem = 'freehold';
  ctx.lastEvents = [];
  await waitFrames(20);
  const afterFreeholdRebuild = {
    sys: ctx.world.currentSystem,
    liveCradleAuction: gateMod.lookupLiveNavGate('bt_cradle', 'gc_auction'),
    liveCradle: gateMod.lookupLiveNavGate('bt_cradle'),
    pos: navMod.resolveNavGatePos(ctx, 'bt_cradle'),
  };
  ctx.flags.paused = true;
  ctx.world.currentSystem = 'gc_auction';
  ctx.lastEvents = [{ type: 'titleNoise' }];
  await waitFrames(12);
  const whilePausedAuctionNoUpdate = {
    sys: ctx.world.currentSystem,
    paused: ctx.flags.paused,
    liveCradle: gateMod.lookupLiveNavGate('bt_cradle', 'gc_auction'),
    pos: navMod.resolveNavGatePos(ctx, 'bt_cradle'),
    events: (ctx.lastEvents || []).map((e) => e && e.type),
  };
  ctx.flags.paused = false;
  ctx.lastEvents = [];
  await waitFrames(12);
  let hub = null;
  let marker = null;
  ctx.scene.traverse((o) => {
    if (o && o.name === 'lamplighter-junction') hub = { x: o.position.x, y: o.position.y, z: o.position.z, visible: o.visible };
    if (o && o.name === 'nav-gate-marker') marker = { x: o.position.x, y: o.position.y, z: o.position.z, visible: o.visible };
  });
  const navM = await import('/src/game/nav.js');
  navM.plotRoute(ctx, 'bt_cradle');
  await waitFrames(6);
  ctx.scene.traverse((o) => {
    if (o && o.name === 'nav-gate-marker') marker = { x: o.position.x, y: o.position.y, z: o.position.z, visible: o.visible };
  });
  return {
    afterFreeholdRebuild,
    whilePausedAuctionNoUpdate,
    afterUnpause: {
      sys: ctx.world.currentSystem,
      paused: ctx.flags.paused,
      liveCradle: gateMod.lookupLiveNavGate('bt_cradle', 'gc_auction'),
      pos: navMod.resolveNavGatePos(ctx, 'bt_cradle'),
      hub,
      marker,
    },
  };
})()`);
note('snapC ' + JSON.stringify(snapC));
await shot('flow-c-unpause.png');

const after = snapC && snapC.afterUnpause;
summary.flowC = {
  pausedLookupNull: snapC && snapC.whilePausedAuctionNoUpdate && snapC.whilePausedAuctionNoUpdate.liveCradle == null,
  afterLiveHub: near(after && after.liveCradle, hub, 1),
  afterNotNull: !!(after && after.liveCradle),
  afterHubMesh: near(after && after.hub, hub, 1),
  markerOnHub: after && after.marker && after.marker.visible && near(after.marker, hub, 2),
};

const missing = await evalJson(`(async () => {
  const ctx = window.__ctx;
  ctx.world.currentSystem = 'gc_auction';
  ctx.flags.paused = false;
  const ap = await import('/src/game/autopilot.js');
  ctx.world.nav = {
    dest: 'freehold',
    path: ['gc_auction', 'freehold'],
    remaining: 1,
    status: 'plotted',
    autopilot: false,
  };
  const tok = ap.apRefuseToken(ctx);
  const engage = ap.tryEngage(ctx);
  return { tok, engage, flying: !!(ctx.world.nav && ctx.world.nav.autopilot) };
})()`);
note('missingHop ' + JSON.stringify(missing));
summary.missingHop = missing && missing.tok === 'missingHop' && missing.engage === 'missingHop';

summary.errors = consoleErrs.slice(0, 40);
summary.ok = !!(
  summary.flowA && summary.flowA.liveCradleHub && summary.flowA.markerOnHub
  && summary.flowB && summary.flowB.liveVPhysical && summary.flowB.markerOnPhysical && summary.flowB.liveVNotHub
  && summary.flowC && summary.flowC.afterLiveHub && summary.flowC.afterNotNull && summary.flowC.afterHubMesh
  && summary.missingHop
);

writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, snapA0, snapA1, snapB, snapC, missing, log, consoleErrs }, null, 2));
writeFileSync(join(here, 'cdp-live.log'), log.join('\n') + '\n');
console.log('SUMMARY ' + JSON.stringify(summary));

ws.close();
if (chromeProc && chromeProc.pid) {
  try { process.kill(chromeProc.pid); } catch { /* already gone */ }
}
process.exit(summary.ok ? 0 : 1);
