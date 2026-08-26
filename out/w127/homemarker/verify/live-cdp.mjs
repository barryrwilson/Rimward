/**
 * HUD-06 PR1 live verify via Chrome CDP. Reuses Vite 5178.
 * Does not start or stop Vite. Kills only this Chrome tree.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5178/';
const CDP_PORT = Number(process.env.CDP_PORT || 9472);
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
        say('EXC', String(text).slice(0, 300));
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
  const pip = hud && hud.querySelector('.rw-home-pip');
  const chev = hud && hud.querySelector('.rw-home-chevron');
  const ret = hud && hud.querySelector('.rw-reticle');
  const row = hud && hud.querySelector('.rw-pos-home');
  const edge = hud && hud.querySelector('.rw-edge-arrow');
  const gate = hud && hud.querySelector('.rw-nav-gate-cue');
  const hidden = (el) => !el || el.classList.contains('is-hidden');
  const rect = (el) => {
    if (!el || hidden(el)) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };
  const vw = window.innerWidth, vh = window.innerHeight;
  const cr = rect(chev);
  let chevInset = null;
  if (cr) {
    chevInset = {
      fromLeft: cr.cx,
      fromRight: vw - cr.cx,
      fromTop: cr.cy,
      fromBottom: vh - cr.cy,
      min: Math.min(cr.cx, vw - cr.cx, cr.cy, vh - cr.cy),
    };
  }
  const ctx = window.__ctx;
  const st = ctx && ctx.station;
  const tgt = ctx && ctx.targets && ctx.targets.current;
  const pipCs = pip ? getComputedStyle(pip) : null;
  const chevCs = chev ? getComputedStyle(chev) : null;
  return {
    href: location.href,
    hasCtx: !!ctx,
    origin: ctx && ctx.world && ctx.world.origin,
    sys: ctx && ctx.world && ctx.world.currentSystem,
    paused: !!(ctx && ctx.flags && ctx.flags.paused),
    docked: !!(ctx && ctx.flags && ctx.flags.docked),
    jumping: !!(ctx && ctx.gate && ctx.gate.jumping),
    hailOpen: !!(ctx && ctx.flags && ctx.flags.hailOpen),
    chartOpen: !!(ctx && ctx.flags && ctx.flags.chartOpen),
    berthOpen: !!(ctx && ctx.flags && ctx.flags.berthOpen),
    stationName: st && st.name,
    stationPos: st && st.position ? { x: st.position.x, y: st.position.y, z: st.position.z } : null,
    shipPos: ctx && ctx.ship && ctx.ship.object ? {
      x: ctx.ship.object.position.x, y: ctx.ship.object.position.y, z: ctx.ship.object.position.z,
    } : null,
    lockKind: tgt && tgt.lockKind || null,
    pipCount: hud ? hud.querySelectorAll('.rw-home-pip').length : 0,
    chevCount: hud ? hud.querySelectorAll('.rw-home-chevron').length : 0,
    pipParentId: pip && pip.parentElement && pip.parentElement.id,
    pipInsideReticle: !!(pip && ret && ret.contains(pip)),
    pipHidden: hidden(pip),
    chevHidden: hidden(chev),
    rowHidden: hidden(row),
    edgeHidden: hidden(edge),
    gateHidden: hidden(gate),
    homeLabel: row && row.querySelector('.rw-label') && row.querySelector('.rw-label').textContent,
    homeVal: row && row.querySelector('.rw-value') && row.querySelector('.rw-value').textContent,
    pipLabel: pip && pip.querySelector('.rw-home-pip-label') && pip.querySelector('.rw-home-pip-label').textContent,
    pipRect: rect(pip),
    chevRect: cr,
    chevInset,
    vw, vh,
    pipAnim: pipCs && pipCs.animationName,
    chevAnim: chevCs && chevCs.animationName,
    combat: !!(hud && hud.classList.contains('in-combat')),
    title: !!document.getElementById('rw-title'),
    newBtn: !!document.getElementById('rw-title-new'),
  };
})()`;

const results = {
  startedAt: new Date().toISOString(),
  viteReused: true,
  vitePort: 5178,
  cdpPort: CDP_PORT,
  playwrightMcp: 'locked; used Chrome CDP',
  flows: {},
  bugs: [],
};

let chrome = null;
let cdp = null;

try {
  await mkdir(PROFILE, { recursive: true });
  await mkdir(here, { recursive: true });

  const chromeErr = [];
  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${PROFILE}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu-sandbox',
    '--window-size=1600,900',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-extensions',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--headless=new',
    '--hide-crash-restore-bubble',
    '--disable-session-crashed-bubble',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  chrome.stderr.on('data', (b) => chromeErr.push(String(b)));
  say('CHROME pid', chrome.pid);

  let browserWs = null;
  for (let i = 0; i < 50; i++) {
    try {
      const ver = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (ver.ok) {
        const info = await ver.json();
        browserWs = info.webSocketDebuggerUrl;
        if (browserWs) break;
      }
    } catch {}
    await sleep(200);
  }
  if (!browserWs) throw new Error('CDP not ready: ' + chromeErr.join('').slice(0, 400));

  cdp = new Cdp(browserWs);
  await cdp.ready();
  await cdp.send('Target.setDiscoverTargets', { discover: true });
  const created = await cdp.send('Target.createTarget', { url: APP });
  const targetId = created.targetId;
  const attached = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  cdp.sessionId = attached.sessionId;
  // flatten: sessionId on messages — this simple client does not wrap sessionId.
  // Reconnect to the page websocket instead.
  cdp.close();
  let pageWs = null;
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const page = list.find((t) => t.type === 'page' && String(t.url || '').includes('5178'));
    if (page && page.webSocketDebuggerUrl) {
      pageWs = page.webSocketDebuggerUrl;
      break;
    }
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
        canvas: document.querySelectorAll('canvas').length,
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
  await sleep(800);
  boot = await waitBoot();
  say('boot2', JSON.stringify(boot));
  if (!boot || boot.href === 'chrome-error://chromewebdata/' || (!boot.ctx && !boot.title && !boot.originText)) {
    throw new Error('page did not boot: ' + JSON.stringify(boot));
  }

  await cdp.eval(`(() => {
    const originRow = [...document.querySelectorAll('div')].find((el) =>
      (el.textContent || '').startsWith('[1] Freehold Greenhand'));
    if (originRow) { originRow.click(); return 'origin-click'; }
    const neu = document.getElementById('rw-title-new') || document.querySelector('[data-title-action="new"]');
    if (neu) { neu.click(); return 'new-click'; }
    return 'none';
  })()`);
  await sleep(600);

  await cdp.eval(`(() => {
    const originRow = [...document.querySelectorAll('div')].find((el) =>
      (el.textContent || '').startsWith('[1] Freehold Greenhand'));
    if (originRow) { originRow.click(); return 'origin-click'; }
    const neu = document.getElementById('rw-title-new') || document.querySelector('[data-title-action="new"]');
    if (neu) { neu.click(); return 'new-confirm'; }
    return 'none';
  })()`);
  await sleep(1200);

  await cdp.eval(`(() => {
    const originRow = [...document.querySelectorAll('div')].find((el) =>
      (el.textContent || '').startsWith('[1] Freehold Greenhand'));
    if (originRow) { originRow.click(); return 'origin-click'; }
    return 'no-origin';
  })()`);

  const tFly = Date.now();
  let flight = null;
  while (Date.now() - tFly < 20000) {
    flight = await cdp.eval(INSPECT);
    if (flight && flight.hasCtx && !flight.paused && flight.stationPos) break;
    await sleep(300);
  }
  say('flight-raw', JSON.stringify({
    hasCtx: flight && flight.hasCtx,
    paused: flight && flight.paused,
    docked: flight && flight.docked,
    origin: flight && flight.origin,
    sys: flight && flight.sys,
    stationName: flight && flight.stationName,
  }));

  if (flight && flight.docked) {
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit8', key: '8', bubbles: true }));
      return true;
    })()`);
    await sleep(500);
    flight = await cdp.eval(INSPECT);
  }

  if (flight && flight.hasCtx && flight.paused) {
    await cdp.eval(`(() => { if (window.__ctx && window.__ctx.flags) window.__ctx.flags.paused = false; return true; })()`);
    await sleep(400);
    flight = await cdp.eval(INSPECT);
  }

  // Face pad so pip is on-glass.
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    if (!ctx || !ctx.ship || !ctx.ship.object || !ctx.station || !ctx.station.position) return false;
    const p = ctx.ship.object.position;
    const s = ctx.station.position;
    ctx.ship.object.lookAt(s.x, s.y, s.z);
    if (ctx.ship.velocity) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    return true;
  })()`);
  await sleep(700);
  const onGlass = await cdp.eval(INSPECT);
  results.flows.a_posHome = onGlass;
  await cdp.screenshot(join(here, '01-flight-home.png'));

  const pipShot = join(here, '02-pip-on-glass.png');
  if (!onGlass.pipHidden) {
    await cdp.screenshot(join(here, '04-pip-on-glass.png'));
  }

  // Look away so pad is off-glass.
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    if (!ctx || !ctx.ship || !ctx.ship.object || !ctx.station || !ctx.station.position) return false;
    const obj = ctx.ship.object;
    const p = obj.position;
    const s = ctx.station.position;
    obj.lookAt(p.x * 2 - s.x, p.y * 2 - s.y, p.z * 2 - s.z);
    if (ctx.ship.velocity) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    return true;
  })()`);
  await sleep(900);
  let offGlass = await cdp.eval(INSPECT);
  if (offGlass.chevHidden) {
    await cdp.eval(`(() => {
      const ctx = window.__ctx;
      const obj = ctx.ship.object;
      const s = ctx.station.position;
      obj.position.set(s.x + 900, s.y + 40, s.z - 900);
      obj.lookAt(s.x + 1800, s.y + 40, s.z - 1800);
      if (ctx.ship.velocity) ctx.ship.velocity.set(0, 0, 0);
      ctx.ship.speed = 0;
      return true;
    })()`);
    await sleep(900);
    offGlass = await cdp.eval(INSPECT);
  }
  results.flows.c_offGlass = offGlass;
  await cdp.screenshot(join(here, '02-offglass-chevron.png'));

  // Restore a flyable pose near pad, then dock with J.
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    const obj = ctx.ship.object;
    const s = ctx.station.position;
    obj.position.set(s.x + 20, s.y, s.z + 10);
    obj.lookAt(s.x, s.y, s.z);
    if (ctx.ship.velocity) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    ctx.input.dockPressed = true;
    return true;
  })()`);
  await sleep(800);
  let docked = await cdp.eval(INSPECT);
  if (!docked.docked) {
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', key: 'j', bubbles: true }));
      if (window.__ctx) window.__ctx.input.dockPressed = true;
      return true;
    })()`);
    await sleep(800);
    docked = await cdp.eval(INSPECT);
  }
  results.flows.d_dock = docked;
  await cdp.screenshot(join(here, '03-dock-hidden.png'));

  // Undock
  await cdp.eval(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit8', key: '8', bubbles: true }));
    return true;
  })()`);
  await sleep(600);
  let undocked = await cdp.eval(INSPECT);
  if (undocked.docked) {
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB', key: 'b', bubbles: true }));
      return true;
    })()`);
    await sleep(500);
    undocked = await cdp.eval(INSPECT);
  }
  results.flows.undock = undocked;

  // Hail flag
  const hailPrev = await cdp.eval(`(() => {
    const ctx = window.__ctx;
    const prev = !!(ctx.flags && ctx.flags.hailOpen);
    ctx.flags.hailOpen = true;
    return prev;
  })()`);
  await sleep(500);
  const hail = await cdp.eval(INSPECT);
  await cdp.eval(`(() => { window.__ctx.flags.hailOpen = ${hailPrev ? 'true' : 'false'}; return true; })()`);
  await sleep(400);
  results.flows.e_hail = hail;
  await cdp.screenshot(join(here, '05-hail-hidden.png'));

  // Chart KeyM
  await cdp.eval(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
    return true;
  })()`);
  await sleep(600);
  const chart = await cdp.eval(INSPECT);
  results.flows.e_chart = chart;
  await cdp.screenshot(join(here, '06-chart-hidden.png'));
  if (chart.chartOpen) {
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
      return true;
    })()`);
    await sleep(400);
  }

  // Berth KeyL
  await cdp.eval(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL', key: 'l', bubbles: true }));
    return true;
  })()`);
  await sleep(600);
  const berth = await cdp.eval(INSPECT);
  results.flows.e_berth = berth;
  await cdp.screenshot(join(here, '07-berth-hidden.png'));
  if (berth.berthOpen) {
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
      return true;
    })()`);
    await sleep(400);
  }

  // Station lock: hide pip+chevron, keep POS HOME
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    if (ctx.flags) {
      ctx.flags.hailOpen = false;
      ctx.flags.chartOpen = false;
      ctx.flags.berthOpen = false;
      ctx.flags.docked = false;
    }
    ctx.targets.current = { lockKind: 'station', position: ctx.station.position };
    return true;
  })()`);
  await sleep(500);
  const locked = await cdp.eval(INSPECT);
  results.flows.f_stationLock = locked;
  await cdp.screenshot(join(here, '08-station-lock.png'));

  await cdp.eval(`(() => { if (window.__ctx && window.__ctx.targets) window.__ctx.targets.current = null; return true; })()`);

  const hudErrors = cdp.console.filter((m) => m.type === 'error' || m.type === 'warning');
  const hud06 = hudErrors.filter((m) => /home|HUD-06|rw-home/i.test(m.text));
  results.consoleErrors = hudErrors;
  results.exceptions = cdp.exceptions;
  results.hud06Hits = hud06;
  results.consoleCount = cdp.console.length;

  const consoleTxt = [
    '# HUD-06 PR1 console (CDP Runtime.consoleAPICalled)',
    'started ' + results.startedAt,
    'vite http://127.0.0.1:5178/ reused',
    'cdp ' + CDP_PORT,
    '',
    '## exceptions',
    ...(cdp.exceptions.length ? cdp.exceptions : ['(none)']),
    '',
    '## error/warning',
    ...(hudErrors.length ? hudErrors.map((m) => m.type + ' ' + m.text) : ['(none)']),
    '',
    '## all (truncated)',
    ...cdp.console.slice(0, 80).map((m) => m.type + ' ' + String(m.text).slice(0, 240)),
  ].join('\n');
  await writeFile(join(here, 'console.txt'), consoleTxt);

  function expect(name, ok, detail) {
    results.flows[name + '_ok'] = !!ok;
    if (!ok) results.bugs.push({ name, detail });
  }

  expect('posHomeVisible', onGlass && !onGlass.rowHidden && onGlass.homeLabel === 'HOME' && / · /.test(onGlass.homeVal || ''), onGlass);
  expect('posHomeHasDist', onGlass && /(u|k)$/.test((onGlass.homeVal || '').trim()), onGlass && onGlass.homeVal);
  expect('pipOnHud', onGlass && onGlass.pipParentId === 'hud' && onGlass.pipInsideReticle === false, onGlass);
  expect('createOnce', onGlass && onGlass.pipCount === 1 && onGlass.chevCount === 1, onGlass);
  expect('noPulse', onGlass && (onGlass.pipAnim === 'none' || !onGlass.pipAnim) && (onGlass.chevAnim === 'none' || !onGlass.chevAnim), onGlass);
  expect('offChevron', offGlass && !offGlass.chevHidden && offGlass.pipHidden, offGlass);
  const inset = offGlass && offGlass.chevInset && offGlass.chevInset.min;
  expect('inset108', Number.isFinite(inset) && inset > 96 && inset < 120 && Math.abs(inset - 84) > 10, offGlass && offGlass.chevInset);
  expect('dockHide', docked && docked.docked && docked.rowHidden && docked.pipHidden && docked.chevHidden, docked);
  expect('hailHide', hail && hail.hailOpen && hail.rowHidden && hail.pipHidden && hail.chevHidden, hail);
  expect('chartHide', chart && chart.chartOpen && chart.rowHidden && chart.pipHidden && chart.chevHidden, chart);
  expect('berthHide', berth && berth.berthOpen && berth.rowHidden && berth.pipHidden && berth.chevHidden, berth);
  expect('lockHideGlassKeepHome', locked && locked.lockKind === 'station' && locked.pipHidden && locked.chevHidden && !locked.rowHidden, locked);
  expect('noNewHud06Console', hud06.length === 0, hud06);

  results.endedAt = new Date().toISOString();
  await writeFile(join(here, 'live-results.json'), JSON.stringify(results, null, 2));
  say('BUGS', results.bugs.length, results.bugs.map((b) => b.name).join(','));
} catch (err) {
  results.fatal = String(err && err.stack || err);
  say('FATAL', results.fatal);
  try { await writeFile(join(here, 'live-results.json'), JSON.stringify(results, null, 2)); } catch {}
} finally {
  try { if (cdp) cdp.close(); } catch {}
  killTree(chrome);
  await sleep(400);
}
