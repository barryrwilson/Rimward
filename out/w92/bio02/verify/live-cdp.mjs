/**
 * BIO-02 live verifier. Evidence only. Does not edit src/.
 * Vite 127.0.0.1:5183 · Chrome CDP 9443 · profile out/w92/bio02/verify/chrome-profile
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, open, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5183/';
const VITE_PORT = 5183;
const CDP_PORT = 9443;
const PROFILE = join(here, 'chrome-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.sessionId = null;
    this.console = [];
    this.exceptions = [];
    this.events = new Map();
    this.ws.addEventListener('message', (ev) => {
      let msg = JSON.parse(ev.data);
      if (msg.method === 'Target.receivedMessageFromTarget' && msg.params?.message) {
        msg = JSON.parse(msg.params.message);
      }
      if (msg.method && this.events.has(msg.method)) {
        const waiters = this.events.get(msg.method);
        this.events.delete(msg.method);
        for (const w of waiters) w(msg.params);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const t = msg.params?.type;
        const text = (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        this.console.push({ type: t, text });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params?.exceptionDetails?.text
          || msg.params?.exceptionDetails?.exception?.description
          || 'exception';
        this.exceptions.push(text);
      }
      const id = msg.id;
      if (id == null) return;
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    });
  }
  ready() {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 25000) {
    const id = ++this.id;
    const body = { id, method, params };
    if (this.sessionId) body.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout ' + method));
        }
      }, timeoutMs);
      this.ws.send(JSON.stringify(body));
    });
  }
  waitEvent(method, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const arr = this.events.get(method) || [];
      const timer = setTimeout(() => reject(new Error('event timeout ' + method)), timeoutMs);
      arr.push((params) => { clearTimeout(timer); resolve(params); });
      this.events.set(method, arr);
    });
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (r?.exceptionDetails) {
      throw new Error(r.exceptionDetails.text || r.exceptionDetails.exception?.description || 'eval');
    }
    return r?.result?.value;
  }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    await writeFile(path, Buffer.from(r.data, 'base64'));
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitHttp(url, tries = 120) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status === 200) {
        const txt = await res.text();
        if (txt.includes('src/main.js') || txt.includes('id="app"')) return true;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error('HTTP not ready: ' + url);
}

async function waitJson(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('CDP JSON not ready: ' + url);
}

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    try { child.kill(); } catch {}
  }
}

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const fails = [];
function expect(cond, label, extra) {
  if (cond) say('PASS', label, extra == null ? '' : extra);
  else {
    fails.push(label + (extra == null ? '' : ' ' + extra));
    say('FAIL', label, extra == null ? '' : extra);
  }
}

const OVERLAY = `(() => {
  const ov = document.querySelector('.station-overlay');
  const text = ov ? (ov.innerText || ov.textContent || '') : '';
  const buttons = [...document.querySelectorAll('button')].map((b) => b.textContent);
  const ctx = window.__ctx;
  const hangar = ctx && ctx.world && ctx.world.hangar;
  const row = hangar && Array.isArray(hangar.hulls)
    ? hangar.hulls.find((h) => h.id === hangar.mountedId) : null;
  return {
    docked: !!(ctx && ctx.flags && ctx.flags.docked),
    sys: ctx && ctx.world && ctx.world.currentSystem,
    faction: ctx && ctx.systems && ctx.world && ctx.systems[ctx.world.currentSystem]
      && ctx.systems[ctx.world.currentSystem].faction,
    credits: ctx && ctx.world && ctx.world.credits,
    rep: ctx && ctx.world && ctx.world.reputation && ctx.world.reputation.beautiful,
    classKey: row && row.classKey,
    hullKind: row && row.hullKind,
    playerClass: ctx && ctx.player && ctx.player.classKey,
    playerKind: ctx && ctx.player && ctx.player.hullKind,
    mountedId: hangar && hangar.mountedId,
    cargo: ctx && ctx.cargo,
    maxSpeed: ctx && ctx.config && ctx.config.ship && ctx.config.ship.maxSpeed,
    multiplier: ctx && ctx.config && ctx.config.ship && ctx.config.ship.afterburner
      && ctx.config.ship.afterburner.multiplier,
    restScale: ctx && ctx.ship && ctx.ship.hullRig && ctx.ship.hullRig.restScale,
    kind: ctx && ctx.ship && ctx.ship.hullRig && ctx.ship.hullRig.kind,
    swim: ctx && ctx.ship && ctx.ship.living && ctx.ship.living.swim,
    growth: ctx && ctx.bio && ctx.bio.growth,
    overlay: text.slice(0, 900),
    buttons,
    hasShipyardDigit: /0\\s*[\\u2014\\u2013-]\\s*Shipyard/.test(text),
    hasShipyard: text.includes('SHIPYARD'),
    hasTrain: text.includes('Train hull'),
    hasTrainLegend: text.includes('Train on Hangar'),
    hasNoSale: text.includes('No sale.'),
    hasPapers: text.includes('Confirm papers'),
    hasHop: text.includes('→ heavy'),
    hasCargo: text.includes('Hold stays with this hull'),
    hasOk: text.includes('The hull takes the heavy form.'),
    hasShort: text.includes('Not enough credits.'),
    hasPeoplePapers: text.includes('1 — Papers') || text.includes('The berth answers'),
    display: ov && ov.style.display,
  };
})()`;

let vite, chrome, cdp;
const chromeBuf = [];
const summary = { ok: false, checks: {}, env: null, fails: [] };

try {
  await mkdir(here, { recursive: true });
  await mkdir(PROFILE, { recursive: true });

  const probeSrc = join(here, '..', 'probe.log');
  if (existsSync(join(root, 'out', 'w92', 'bio02', 'probe.mjs'))) {
    /* probe log copied by parent shell if present */
  }
  if (existsSync(probeSrc)) {
    await copyFile(probeSrc, join(here, 'probe.log')).catch(() => {});
  }

  const viteLog = await open(join(here, 'vite.log'), 'w');
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(VITE_PORT), '--strictPort'], {
    cwd: root,
    shell: false,
    stdio: ['ignore', viteLog.fd, viteLog.fd],
    env: { ...process.env, BROWSER: 'none' },
  });
  say('VITE spawn pid', vite.pid);
  await waitHttp(APP);
  say('VITE ready', APP);

  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--remote-debugging-address=127.0.0.1`,
    `--user-data-dir=${PROFILE}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu-sandbox',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--window-size=1400,900',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    APP,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  chrome.stdout.on('data', (b) => chromeBuf.push(String(b)));
  chrome.stderr.on('data', (b) => chromeBuf.push(String(b)));
  chrome.on('exit', (code) => say('CHROME exit', code));
  say('CHROME spawn pid', chrome.pid);

  let pageWs = null;
  for (let i = 0; i < 50; i++) {
    try {
      const list = await waitJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 4);
      const page = (list || []).find((t) => t.type === 'page' && String(t.url).includes('127.0.0.1:5183') && t.webSocketDebuggerUrl)
        || (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) { pageWs = page.webSocketDebuggerUrl; say('PAGE url', page.url); break; }
    } catch {}
    await sleep(250);
  }
  if (!pageWs) throw new Error('no page websocket');
  say('PAGE ws', pageWs);
  cdp = new Cdp(pageWs);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable').catch(() => {});
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { sessionStorage.setItem('rimward-title-skip','1'); localStorage.removeItem('rimward-save-v1'); } catch (e) {}`,
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1400, height: 900, deviceScaleFactor: 1, mobile: false,
  }).catch(() => {});
  const href0 = await cdp.eval('location.href').catch(() => '');
  say('HREF0', href0);
  if (!String(href0).includes('127.0.0.1:5183') || String(href0).includes('chrome-error')) {
    const loaded = cdp.waitEvent('Page.loadEventFired', 45000).catch((e) => { say('LOAD', e.message); return null; });
    const nav = await cdp.send('Page.navigate', { url: APP }, 45000);
    say('NAV', JSON.stringify(nav));
    if (nav && nav.errorText) {
      await sleep(1500);
      const nav2 = await cdp.send('Page.navigate', { url: APP }, 45000);
      say('NAV2', JSON.stringify(nav2));
    }
    await loaded;
  }

  let boot = null;
  for (let i = 0; i < 180; i++) {
    boot = await cdp.eval(`({
      href: location.href,
      ctx: !!window.__ctx,
      ready: document.readyState,
      scripts: document.scripts.length,
      canvas: document.querySelectorAll('canvas').length,
      title: !!document.getElementById('rw-title'),
      fatal: document.getElementById('fatal') && document.getElementById('fatal').style.display,
      fatalText: document.getElementById('fatal') ? document.getElementById('fatal').textContent.slice(0, 400) : '',
      bodyLen: document.body ? document.body.innerHTML.length : 0,
    })`).catch((e) => ({ err: String(e) }));
    say('boot', JSON.stringify(boot));
    if (boot && boot.ctx) break;
    await sleep(500);
  }
  if (!boot || !boot.ctx) {
    summary.env = 'no-ctx';
    summary.checks.boot = boot;
    summary.checks.console = cdp.console.slice(0, 20);
    summary.checks.exceptions = cdp.exceptions.slice(0, 20);
    await cdp.screenshot(join(here, '00-no-ctx.png')).catch(() => {});
    throw new Error('no ctx');
  }

  await cdp.eval(`(() => {
    try { localStorage.removeItem('rimward-save-v1'); } catch (e) {}
    const neu = document.getElementById('rw-title-new')
      || document.querySelector('[data-title-action="new"]');
    if (neu) {
      neu.click();
      if ((neu.textContent || '').includes('CONFIRM')) neu.click();
    }
    return { clicked: !!neu, text: neu && neu.textContent };
  })()`);
  await sleep(800);
  const origin = await cdp.eval(`({
    origin: !!(document.body && /who are you/i.test(document.body.innerText || '')),
    paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused,
  })`);
  say('origin', JSON.stringify(origin));
  if (origin && origin.origin) {
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
    await sleep(700);
  }

  for (let i = 0; i < 40; i++) {
    const st = await cdp.eval(`({
      paused: !!(window.__ctx && window.__ctx.flags && window.__ctx.flags.paused),
      ship: !!(window.__ctx && window.__ctx.ship && window.__ctx.ship.object),
      player: !!(window.__ctx && window.__ctx.player),
    })`);
    say('play', JSON.stringify(st));
    if (st && st.ship && st.player && !st.paused) break;
    await sleep(400);
  }

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    ctx.flags.paused = false;
    ctx.gate.jumping = false;
    ctx.world.currentSystem = 'bt_cradle';
    ctx.emit('systemLoaded', { to: 'bt_cradle' });
    ctx.world.credits = 50000;
    if (!ctx.world.reputation || typeof ctx.world.reputation !== 'object') ctx.world.reputation = {};
    ctx.world.reputation.beautiful = 50;
    ctx.player.hullKind = 'living';
    ctx.player.classKey = 'light';
    ctx.player.faction = 'independent';
    if (ctx.bio) ctx.bio.growth = 1;
    return { sys: ctx.world.currentSystem, classKey: ctx.player.classKey };
  })()`);
  await sleep(1500);

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    const st = ctx.systems.bt_cradle.station.position;
    ctx.flags.combat = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity && ctx.ship.velocity.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(st[0] + 8, st[1], st[2]);
    ctx.ship.speed = 0;
    ctx.input.dockPressed = true;
    return true;
  })()`);
  let docked = false;
  for (let i = 0; i < 40; i++) {
    const st = await cdp.eval(OVERLAY);
    say('dock', JSON.stringify({ docked: st.docked, display: st.display, fac: st.faction }));
    if (st.docked && st.display && st.display !== 'none') { docked = true; break; }
    await sleep(400);
  }
  await cdp.eval('window.__ctx.input.dockPressed = false');
  expect(docked, 'docked');
  await cdp.screenshot(join(here, '01-dock-menu.png'));
  const menu = await cdp.eval(OVERLAY);
  expect(menu.hasShipyardDigit || /0 — Shipyard/.test(menu.overlay), 'digit0.menu', menu.overlay.slice(0, 200));

  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit0', key: '0', bubbles: true }))`);
  await sleep(500);
  const yard = await cdp.eval(OVERLAY);
  expect(yard.hasShipyard, 'digit0.shipyard');
  await cdp.screenshot(join(here, '02-digit0-shipyard.png'));

  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(400);
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    ctx.world.credits = 50000;
    ctx.world.reputation.beautiful = 50;
    ctx.player.hullKind = 'living';
    ctx.player.classKey = 'light';
    const hangar = ctx.world.hangar;
    const row = hangar && hangar.hulls && hangar.hulls.find((h) => h.id === hangar.mountedId);
    if (row) {
      row.classKey = 'light';
      row.hullKind = 'living';
      delete row.grafted;
      row.cargo = [{ commodity: 'rawOre', units: 4 }];
    }
    ctx.cargo = [{ commodity: 'rawOre', units: 4 }];
    ctx.cargoCapacity = 30;
    return { mountedId: hangar && hangar.mountedId, classKey: row && row.classKey };
  })()`);
  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(400);
  const hangar = await cdp.eval(OVERLAY);
  expect(hangar.hasTrain, 'train.offer');
  expect(hangar.hasTrainLegend, 'train.legend');
  await cdp.screenshot(join(here, '03-hangar-train.png'));
  const mountedKeep = hangar.mountedId;
  summary.checks.mountedKeep = mountedKeep;

  await cdp.eval(`(() => { window.__ctx.world.reputation.beautiful = -5; return true; })()`);
  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(400);
  const hostile = await cdp.eval(OVERLAY);
  expect(hostile.hasNoSale, 'hostile.nosale');
  expect(!hostile.buttons.includes('Train hull'), 'hostile.noButton');
  await cdp.screenshot(join(here, '04-hostile-nosale.png'));

  await cdp.eval(`(() => {
    window.__ctx.world.reputation.beautiful = 50;
    window.__ctx.world.credits = 4;
    return true;
  })()`);
  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(400);
  const shortOffer = await cdp.eval(OVERLAY);
  expect(shortOffer.hasTrain || shortOffer.buttons.includes('Train hull'), 'short.offer');
  await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Train hull');
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(400);
  const shortPapers = await cdp.eval(OVERLAY);
  expect(shortPapers.hasPapers, 'short.papers');
  expect(shortPapers.hasCargo, 'short.cargoNote');
  await cdp.screenshot(join(here, '05-short-offer.png'));
  await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Confirm papers');
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(500);
  const shortAfter = await cdp.eval(OVERLAY);
  expect(shortAfter.hasShort, 'short.refuse');
  expect(shortAfter.classKey === 'light', 'short.stillLight');
  expect(shortAfter.credits === 4, 'short.creditsKeep');

  await cdp.eval(`(() => { window.__ctx.world.credits = 50000; return true; })()`);
  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(400);
  await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Train hull');
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(400);
  const papers = await cdp.eval(OVERLAY);
  expect(papers.hasPapers, 'papers.confirm');
  expect(papers.hasHop, 'papers.hop');
  expect(papers.hasCargo, 'papers.cargo');
  await cdp.screenshot(join(here, '06-papers.png'));
  await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Confirm papers');
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(800);
  const after = await cdp.eval(OVERLAY);
  expect(after.classKey === 'heavy', 'after.classKey', after.classKey);
  expect(after.playerClass === 'heavy', 'after.playerClass', after.playerClass);
  expect(after.hullKind === 'living', 'after.hullKind', after.hullKind);
  expect(after.mountedId === mountedKeep, 'after.mountedId', String(after.mountedId));
  expect(after.kind === 'living', 'after.mesh', after.kind);
  expect(typeof after.restScale === 'number' && after.restScale > 1, 'after.restScale', after.restScale);
  expect(after.maxSpeed === 90, 'after.cruise', after.maxSpeed);
  expect(after.multiplier === 2, 'after.burnCruise', after.multiplier);
  expect(Array.isArray(after.cargo) && after.cargo.some((c) => c.commodity === 'rawOre' && c.units === 4), 'after.cargo');
  expect(after.hasOk, 'after.notice');
  await cdp.screenshot(join(here, '07-after-train.png'));

  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }))`);
  await sleep(400);
  const back = await cdp.eval(OVERLAY);
  expect(back.hasShipyardDigit || /0 — Shipyard/.test(back.overlay), 'digit0.still');
  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit7', key: '7', bubbles: true }))`);
  await sleep(500);
  const people = await cdp.eval(OVERLAY);
  expect(people.hasPeoplePapers, 'gift.people', people.overlay.slice(0, 240));
  await cdp.screenshot(join(here, '08-people-gift.png'));

  summary.checks = {
    ...summary.checks,
    docked,
    menuDigit0: menu.hasShipyardDigit || /0 — Shipyard/.test(menu.overlay),
    shipyard: yard.hasShipyard,
    trainOffer: hangar.hasTrain,
    hostileNoSale: hostile.hasNoSale,
    hostileNoBtn: !hostile.buttons.includes('Train hull'),
    shortOffer: shortOffer.hasTrain || shortOffer.buttons.includes('Train hull'),
    shortPapers: shortPapers.hasPapers,
    shortRefuse: shortAfter.hasShort && shortAfter.classKey === 'light',
    afterClass: after.classKey,
    afterKind: after.hullKind,
    afterMounted: after.mountedId,
    afterMesh: after.kind,
    afterSpeed: after.maxSpeed,
    afterMult: after.multiplier,
    people: people.hasPeoplePapers,
    consoleErrs: cdp.console.filter((c) => c.type === 'error').slice(0, 8),
    exceptions: cdp.exceptions.slice(0, 8),
  };
  summary.fails = fails.slice();
  summary.ok = fails.length === 0;
  say(summary.ok ? 'CDP HANGAR PASS' : 'CDP HANGAR FAIL');
} catch (err) {
  summary.env = String(err && err.message ? err.message : err);
  summary.ok = false;
  say('CDP ENV', summary.env);
} finally {
  try { await writeFile(join(here, 'cdp.log'), log.join('\n')); } catch {}
  try { await writeFile(join(here, 'chrome.log'), chromeBuf.join('')); } catch {}
  try { await writeFile(join(here, 'cdp-summary.json'), JSON.stringify(summary, null, 2)); } catch {}
  if (cdp) cdp.close();
  killTree(chrome);
  killTree(vite);
  await sleep(800);
  process.exit(summary.ok ? 0 : 1);
}
