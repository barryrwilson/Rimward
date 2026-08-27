/**
 * Wave 136 NAV-10 PR1 live verify. Vite 5176, Chrome CDP 9410.
 * Kills only this Chrome tree. Caller stops Vite.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5176/';
const CDP_PORT = Number(process.env.CDP_PORT || 9410);
const PROFILE = join(here, 'chrome-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    try { child.kill(); } catch {}
  }
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.console = [];
    this.exceptions = [];
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.method === 'Runtime.consoleAPICalled') {
        const t = msg.params?.type || 'log';
        const text = (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        this.console.push({ type: t, text, ts: Date.now() });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params?.exceptionDetails?.exception?.description
          || msg.params?.exceptionDetails?.text
          || 'exception';
        this.exceptions.push(String(text));
        say('EXC', String(text).slice(0, 400));
      }
      if (msg.id == null) return;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    });
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 45000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout ' + method));
        }
      }, timeoutMs);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 45000) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, timeoutMs);
    if (r?.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval');
    }
    return r?.result?.value;
  }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    await writeFile(path, Buffer.from(r.data, 'base64'));
    say('SHOT', path);
  }
  close() { try { this.ws.close(); } catch {} }
}

const INSPECT = `(() => {
  const hud = document.getElementById('hud');
  const prompt = hud && hud.querySelector('.rw-prompt');
  const pKey = hud && hud.querySelector('.rw-prompt-key');
  const pVerb = hud && hud.querySelector('.rw-prompt-verb');
  const selfSlow = hud && hud.querySelector('.rw-combat-self .rw-slow-lamp');
  const tgtSlow = hud && hud.querySelectorAll('.rw-combat-target .rw-slow-lamp');
  const match = hud && hud.querySelector('.rw-combat-self .rw-match-lamp');
  const tgtMatch = hud && hud.querySelector('.rw-combat-target .rw-match-lamp');
  const ret = hud && hud.querySelector('.rw-reticle');
  const rr = ret && ret.getBoundingClientRect();
  const ctx = window.__ctx;
  const ship = ctx && ctx.ship;
  const st = ctx && ctx.station;
  const pos = ship && ship.object && ship.object.position;
  let dist = null;
  if (pos && st && st.position) {
    dist = Math.hypot(pos.x - st.position.x, pos.y - st.position.y, pos.z - st.position.z);
  }
  return {
    hasCtx: !!ctx,
    paused: !!(ctx && ctx.flags && ctx.flags.paused),
    docked: !!(ctx && ctx.flags && ctx.flags.docked),
    berthHold: !!(ctx && ctx.flags && ctx.flags.berthHold),
    jumping: !!(ctx && ctx.gate && ctx.gate.jumping),
    gateInZone: !!(ctx && ctx.gate && ctx.gate.inZone),
    stationInZone: !!(st && st.inZone),
    speed: ship ? ship.speed : null,
    dist,
    promptHidden: !prompt || prompt.classList.contains('is-hidden'),
    pKey: pKey ? pKey.textContent : null,
    pVerb: pVerb ? pVerb.textContent : null,
    selfSlowText: selfSlow ? selfSlow.textContent : null,
    selfSlowHidden: !selfSlow || selfSlow.classList.contains('is-hidden'),
    tgtSlowCount: tgtSlow ? tgtSlow.length : -1,
    matchText: match ? match.textContent : null,
    matchHidden: !match || match.classList.contains('is-hidden'),
    tgtMatchText: tgtMatch ? tgtMatch.textContent : null,
    reticleW: rr ? Math.round(rr.width) : null,
    reticleH: rr ? Math.round(rr.height) : null,
    title: !!document.getElementById('rw-title'),
    originOpen: !!(ctx && ctx.originsApi && ctx.originsApi.isOpen && ctx.originsApi.isOpen()),
  };
})()`;

const PLACE = (dist, speed) => `(() => {
  const ctx = window.__ctx;
  if (!ctx || !ctx.ship || !ctx.ship.object || !ctx.station || !ctx.station.position) return 'no-pose';
  if (ctx.flags && ctx.flags.docked && ctx.stationDesk && ctx.stationDesk.undock) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  ctx.flags.berthHold = false;
  if (ctx.gate) ctx.gate.jumping = false;
  const s = ctx.station.position;
  const p = ctx.ship.object.position;
  p.set(s.x + ${dist}, s.y, s.z);
  const v = ctx.ship.velocity;
  if (v) v.set(0, ${speed}, 0);
  ctx.ship.speed = ${speed};
  return 'ok';
})()`;

async function waitVite() {
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    try {
      const r = await fetch(APP, { redirect: 'manual' });
      if (r.status < 500) return true;
    } catch {}
    await sleep(250);
  }
  throw new Error('vite not up on 5176');
}

let chrome = null;
let cdp = null;
const results = { cases: {}, exceptions: [], console: [] };

try {
  await mkdir(PROFILE, { recursive: true });
  await waitVite();
  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    `--window-size=1280,800`,
    APP,
  ], { stdio: 'ignore' });
  say('chrome pid', String(chrome.pid));

  let pageWs = null;
  const tC = Date.now();
  while (Date.now() - tC < 25000) {
    try {
      const res = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && String(t.url || '').includes('5176'));
      if (page && page.webSocketDebuggerUrl) {
        pageWs = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await sleep(200);
  }
  if (!pageWs) throw new Error('page ws missing');
  cdp = new Cdp(pageWs);
  await cdp.ready();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.bringToFront');

  async function waitBoot(ms = 25000) {
    const t0 = Date.now();
    let last = null;
    while (Date.now() - t0 < ms) {
      last = await cdp.eval(`({
        href: location.href,
        ctx: !!window.__ctx,
        title: !!document.getElementById('rw-title'),
        newBtn: !!document.getElementById('rw-title-new'),
        originText: (document.body && document.body.innerText || '').includes('who are you'),
      })`);
      if (last && (last.ctx || last.title || last.originText)) return last;
      await sleep(300);
    }
    return last;
  }

  let boot = await waitBoot();
  say('boot', JSON.stringify(boot));
  await cdp.eval(`(() => {
    try { localStorage.removeItem('rimward-save-v1'); } catch {}
    try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
    location.reload();
    return true;
  })()`);
  await sleep(1000);
  boot = await waitBoot();
  say('boot2', JSON.stringify(boot));

  const clickOrigin = `(() => {
    const originRow = [...document.querySelectorAll('div')].find((el) =>
      (el.textContent || '').startsWith('[1] Freehold Greenhand'));
    if (originRow) { originRow.click(); return 'origin-click'; }
    const neu = document.getElementById('rw-title-new') || document.querySelector('[data-title-action="new"]');
    if (neu) { neu.click(); return 'new-click'; }
    if (window.__ctx && window.__ctx.originsApi && window.__ctx.originsApi.choose) {
      return 'api:' + window.__ctx.originsApi.choose('greenhand');
    }
    return 'none';
  })()`;
  say('click1', await cdp.eval(clickOrigin));
  await sleep(700);
  say('click2', await cdp.eval(clickOrigin));
  await sleep(700);
  say('click3', await cdp.eval(clickOrigin));

  let flight = null;
  const tFly = Date.now();
  while (Date.now() - tFly < 20000) {
    flight = await cdp.eval(INSPECT);
    if (flight && flight.hasCtx && !flight.title && !flight.originOpen) break;
    await sleep(300);
  }
  say('flight', JSON.stringify(flight));
  results.bootFlight = flight;

  if (flight && flight.docked) {
    say('undock', await cdp.eval(`(() => {
      if (window.__ctx && window.__ctx.stationDesk) window.__ctx.stationDesk.undock();
      return !window.__ctx.flags.docked;
    })()`));
    await sleep(400);
  }

  await cdp.eval(PLACE(20, 120));
  await sleep(600);
  const inZoneFast = await cdp.eval(INSPECT);
  results.cases.inZoneFast120 = inZoneFast;
  await cdp.screenshot(join(here, '01-inzone-slow.png'));
  say('inZoneFast', JSON.stringify(inZoneFast));

  await cdp.eval(PLACE(20, 20));
  await sleep(600);
  const inZone20 = await cdp.eval(INSPECT);
  results.cases.inZoneSpeed20 = inZone20;
  await cdp.screenshot(join(here, '02-inzone-dock.png'));
  say('inZone20', JSON.stringify(inZone20));

  await cdp.eval(PLACE(20, 19));
  await sleep(500);
  results.cases.inZoneSpeed19 = await cdp.eval(INSPECT);

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    if (!ctx || !ctx.ship) return 'no-ship';
    if (ctx.ship.velocity) ctx.ship.velocity.set(NaN, NaN, NaN);
    ctx.ship.speed = NaN;
    return 'nan';
  })()`);
  await sleep(500);
  results.cases.nanSpeed = await cdp.eval(INSPECT);
  say('nan', JSON.stringify(results.cases.nanSpeed));

  await cdp.eval(PLACE(100, 120));
  await sleep(600);
  results.cases.band100 = await cdp.eval(INSPECT);
  await cdp.screenshot(join(here, '03-band-100.png'));
  say('band100', JSON.stringify(results.cases.band100));

  await cdp.eval(PLACE(200, 120));
  await sleep(600);
  results.cases.band200 = await cdp.eval(INSPECT);
  await cdp.screenshot(join(here, '04-band-200.png'));
  say('band200', JSON.stringify(results.cases.band200));

  await cdp.eval(PLACE(20, 120));
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    if (!ctx) return 'no';
    ctx.flags.docked = true;
    return 'docked';
  })()`);
  await sleep(500);
  results.cases.dockedHide = await cdp.eval(INSPECT);
  await cdp.eval(`(() => { window.__ctx.flags.docked = false; if (window.__ctx.stationDesk) window.__ctx.stationDesk.undock(); return true; })()`);

  await cdp.eval(PLACE(20, 120));
  await cdp.eval(`(() => { window.__ctx.flags.berthHold = true; return true; })()`);
  await sleep(500);
  results.cases.berthHoldHide = await cdp.eval(INSPECT);
  await cdp.eval(`(() => { window.__ctx.flags.berthHold = false; return true; })()`);

  await cdp.eval(PLACE(20, 120));
  await cdp.eval(`(() => { if (window.__ctx.gate) window.__ctx.gate.jumping = true; return true; })()`);
  await sleep(500);
  results.cases.jumpingHide = await cdp.eval(INSPECT);
  await cdp.eval(`(() => { if (window.__ctx.gate) window.__ctx.gate.jumping = false; return true; })()`);

  await cdp.eval(PLACE(100, 120));
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    if (ctx.gate) ctx.gate.inZone = true;
    if (ctx.station) ctx.station.inZone = false;
    return true;
  })()`);
  await sleep(500);
  results.cases.jumpOwns = await cdp.eval(INSPECT);
  say('jumpOwns', JSON.stringify(results.cases.jumpOwns));

  results.exceptions = cdp.exceptions.slice();
  results.consoleTail = cdp.console.slice(-20);
  results.okHints = {
    inZoneVerb: inZoneFast && inZoneFast.pKey === 'J' && inZoneFast.pVerb === 'Dock · SLOW — approach under 20 u/s',
    inZoneLamp: inZoneFast && inZoneFast.selfSlowText === 'SLOW' && inZoneFast.selfSlowHidden === false,
    slow20Verb: inZone20 && inZone20.pVerb === 'Dock',
    slow20Lamp: inZone20 && inZone20.selfSlowHidden === true,
    tgtNoSlow: inZoneFast && inZoneFast.tgtSlowCount === 0,
    matchText: inZoneFast && inZoneFast.matchText === 'MATCH',
    hub80: inZoneFast && inZoneFast.reticleW === 80 && inZoneFast.reticleH === 80,
  };

  await writeFile(join(here, 'live-results.json'), JSON.stringify(results, null, 2));
  await writeFile(join(here, 'live-log.txt'), log.join('\n'));
  say('wrote live-results.json');
} catch (err) {
  say('FAIL', String(err && err.stack || err));
  results.error = String(err && err.stack || err);
  await writeFile(join(here, 'live-results.json'), JSON.stringify(results, null, 2));
  await writeFile(join(here, 'live-log.txt'), log.join('\n'));
  process.exitCode = 1;
} finally {
  if (cdp) cdp.close();
  killTree(chrome);
  await sleep(400);
}
