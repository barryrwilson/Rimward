/**
 * Wave 92 BIO-04 live verifier. Evidence only. Does not import or edit src/.
 * Vite 127.0.0.1:5182 · Chrome CDP 9442 · profile out/w92/bio04/verify/chrome-profile
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5182/';
const VITE_PORT = 5182;
const CDP_PORT = 9442;
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
  send(method, params = {}, timeoutMs = 20000) {
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
  async eval(expression, awaitPromise = false) {
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

async function waitDevtoolsUrl(logBuf, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const m = logBuf.join('').match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (m) return m[1];
    await sleep(100);
  }
  throw new Error('no DevTools URL in chrome stderr: ' + logBuf.join('').slice(0, 800));
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

const DUMP = `(() => {
  const ctx = window.__ctx;
  if (!ctx) return { ready: false };
  let psi = 0, energy = 0, disruptor = 0, mining = 0, missile = 0;
  ctx.scene.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry || o.geometry.type !== 'SphereGeometry') return;
    const hex = o.material && o.material.color && o.material.color.getHex && o.material.color.getHex();
    if (hex === 0xff6ad5) psi++;
    if (hex === 0x53f2ff) energy++;
    if (hex === 0xc86bff) disruptor++;
    if (hex === 0x51ff9e) mining++;
    if (hex === 0xff8a2a) missile++;
  });
  const wpn = document.querySelector('.rw-combat-wpn .rw-value');
  const reticle = document.querySelector('.rw-reticle');
  const extraGauge = document.querySelectorAll('.rw-incoming, .rw-aim-gauge, .rw-psi-gauge, .rw-lock-box').length;
  const overlay = document.querySelector('.station-overlay') || document.getElementById('station-overlay');
  const stationText = (overlay && overlay.style.display !== 'none' && overlay.innerText) || '';
  const p = ctx.player || {};
  return {
    ready: true,
    hullKind: p.hullKind,
    grafted: p.grafted,
    hasGraftedOwn: Object.prototype.hasOwnProperty.call(p, 'grafted'),
    heat: p.heat,
    overheated: !!p.overheated,
    hullKindRaw: p.hullKind == null ? null : p.hullKind,
    playerKeys: Object.keys(p),
    power: p.power,
    playerPsi: p.psi,
    psiCap: p.psiCap,
    group: ctx.input.weaponGroup,
    fireHeld: !!ctx.input.fireHeld,
    docked: !!ctx.flags.docked,
    paused: !!ctx.flags.paused,
    camera: ctx.flags.camera,
    firstPerson: !!ctx.flags.firstPerson,
    origin: ctx.world && ctx.world.origin,
    system: ctx.world && ctx.world.currentSystem,
    wpn: wpn ? wpn.textContent : null,
    psiBolts: psi, energy, disruptor, mining, missile,
    extraGauge,
    reticleKids: reticle ? reticle.children.length : 0,
    reticleClasses: reticle ? reticle.className : '',
    stationOpen: !!(overlay && overlay.style.display && overlay.style.display !== 'none'),
    stationHasRepair: /Repair/i.test(stationText),
    stationSnippet: stationText.slice(0, 240),
    family: document.getElementById('hud') && document.getElementById('hud').dataset.family,
  };
})()`;

let vite, chrome, cdp;
const fails = [];
function expect(cond, label, extra) {
  if (cond) say('PASS', label, extra == null ? '' : extra);
  else {
    fails.push(label + (extra == null ? '' : ' ' + extra));
    say('FAIL', label, extra == null ? '' : extra);
  }
}

async function key(code, key, vk) {
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
  });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
  });
}

async function lmb(down) {
  const type = down ? 'mousePressed' : 'mouseReleased';
  await cdp.send('Input.dispatchMouseEvent', {
    type, x: 700, y: 450, button: 'left', buttons: down ? 1 : 0, clickCount: 1,
  });
  await cdp.eval(`window.dispatchEvent(new MouseEvent('${down ? 'mousedown' : 'mouseup'}', {button:0, buttons:${down ? 1 : 0}, bubbles:true, clientX:700, clientY:450}))`);
}

try {
  await mkdir(here, { recursive: true });
  await mkdir(PROFILE, { recursive: true });

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

  const chromeBuf = [];
  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--remote-debugging-address=127.0.0.1`,
    `--user-data-dir=${PROFILE}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--window-size=1400,900',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--disable-gpu',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  chrome.stdout.on('data', (b) => chromeBuf.push(String(b)));
  chrome.stderr.on('data', (b) => chromeBuf.push(String(b)));
  chrome.on('exit', (code) => say('CHROME exit', code));
  say('CHROME spawn pid', chrome.pid);

  try {
    const wsFromErr = await waitDevtoolsUrl(chromeBuf);
    say('CDP ws from stderr', wsFromErr);
  } catch (e) {
    say('CDP stderr miss', e.message);
  }
  await writeFile(join(here, 'chrome.log'), chromeBuf.join(''));

  let pageWs = null;
  for (let i = 0; i < 40; i++) {
    try {
      const created = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent('about:blank')}`);
      if (created.ok) {
        const info = await created.json();
        pageWs = info.webSocketDebuggerUrl;
        if (pageWs) break;
      }
    } catch {}
    try {
      const list = await waitJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 4);
      const page = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) { pageWs = page.webSocketDebuggerUrl; break; }
    } catch {}
    await sleep(250);
  }
  if (!pageWs) throw new Error('no page websocket');
  say('PAGE ws', pageWs);
  cdp = new Cdp(pageWs);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { localStorage.removeItem('rimward-save-v1'); } catch (e) {}`,
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1400, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  let nav = null;
  for (let n = 0; n < 3; n++) {
    const loaded = cdp.waitEvent('Page.loadEventFired', 45000).catch((e) => { say('LOAD', e.message); return null; });
    try {
      nav = await cdp.send('Page.navigate', { url: APP }, 45000);
      say('NAV', JSON.stringify(nav));
      await loaded;
      break;
    } catch (e) {
      say('NAV try', n, e.message);
      await sleep(1000);
    }
  }
  if (!nav) throw new Error('Page.navigate failed');
  await sleep(1500);
  say('HREF', await cdp.eval('location.href + " | " + document.title + " | " + document.body.children.length'));

  for (let i = 0; i < 80; i++) {
    const has = await cdp.eval('typeof window.__ctx === "object" && window.__ctx != null');
    if (has) break;
    await sleep(500);
  }
  expect(await cdp.eval('typeof window.__ctx === "object" && window.__ctx != null'), 'ctx present');

  const titleBoot = await cdp.eval(`({
    title: !!document.getElementById('rw-title'),
    newLabel: document.getElementById('rw-title-new') && document.getElementById('rw-title-new').textContent,
    who: /who are you/i.test(document.body.innerText || ''),
    paused: !!(window.__ctx && window.__ctx.flags.paused),
  })`);
  say('BOOT', JSON.stringify(titleBoot));
  await cdp.screenshot(join(here, '01-boot.png'));

  if (titleBoot && titleBoot.title) {
    await cdp.eval(`document.getElementById('rw-title-new')?.click()`);
    await sleep(400);
    const again = await cdp.eval(`document.getElementById('rw-title-new')?.textContent || ''`);
    if (/CONFIRM/i.test(again)) {
      await cdp.eval(`document.getElementById('rw-title-new')?.click()`);
      await sleep(2500);
    }
  }

  for (let i = 0; i < 40; i++) {
    const who = await cdp.eval(`/who are you/i.test(document.body.innerText || '')`);
    const origin = await cdp.eval(`window.__ctx && window.__ctx.world && window.__ctx.world.origin`);
    if (who || origin) break;
    await sleep(200);
  }
  const who = await cdp.eval(`/who are you/i.test(document.body.innerText || '')`);
  say('ORIGIN overlay', who);
  if (who) {
    await key('Digit1', '1', 49);
    await sleep(800);
  }

  for (let i = 0; i < 40; i++) {
    const ready = await cdp.eval(`!!(window.__ctx && window.__ctx.ship && window.__ctx.ship.object && window.__ctx.player && !window.__ctx.flags.paused)`);
    if (ready) break;
    await sleep(250);
  }
  const flightReady = await cdp.eval(`!!(window.__ctx && window.__ctx.ship && window.__ctx.ship.object && window.__ctx.player && !window.__ctx.flags.paused)`);
  expect(flightReady, 'flight ready');
  for (let i = 0; i < 40; i++) {
    const kind = await cdp.eval(`window.__ctx && window.__ctx.player && window.__ctx.player.hullKind`);
    if (kind === 'living' || kind === 'built') {
      say('hullKind ready', kind);
      break;
    }
    await sleep(250);
  }

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    ctx.flags.combat = true;
    ctx.flags.docked = false;
    ctx.flags.paused = false;
    ctx.flags.chartOpen = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    ctx.input.steerX = 0;
    ctx.input.steerY = 0;
    if (ctx.ship.velocity && ctx.ship.velocity.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.flags.camera = 'first';
    ctx.flags.firstPerson = true;
    ctx.player.heat = 0;
    ctx.player.destroyed = false;
    return ctx.player.hullKind;
  })()`);

  await key('Digit5', '5', 53);
  await sleep(350);
  let d = await cdp.eval(DUMP);
  say('DIGIT5', JSON.stringify(d));
  expect(d && d.hullKind === 'living', 'living starter', d && d.hullKind);
  expect(d && d.origin === 'greenhand', 'origin greenhand', d && d.origin);
  expect(d && d.group === 5, 'weaponGroup 5', d && d.group);
  expect(d && d.wpn === '5 · Psionic bolt', 'WPN Psionic bolt', d && d.wpn);
  expect(d && d.power === undefined && d.playerPsi === undefined && d.psiCap === undefined, 'no triad fields');
  await cdp.screenshot(join(here, '02-digit5-wpn.png'));

  await lmb(true);
  await sleep(450);
  d = await cdp.eval(DUMP);
  say('FIRE5', JSON.stringify(d));
  expect(d && d.heat > 0, 'LMB heat rose', d && d.heat);
  expect(d && d.psiBolts >= 1, 'magenta 0xff6ad5 bolts', d && d.psiBolts);
  expect(d && d.energy === 0, 'no energy tint on group 5', d && d.energy);
  expect(d && d.extraGauge === 0, 'no aim-glass extra gauge');
  expect(d && d.reticleKids === 5, 'reticle children pupil+3cilia+range', d && d.reticleKids);
  await cdp.screenshot(join(here, '03-digit5-fire.png'));
  await lmb(false);
  await sleep(150);

  await cdp.eval(`window.__ctx.player.heat = 0`);
  await key('Digit1', '1', 49);
  await sleep(250);
  await lmb(true);
  await sleep(350);
  d = await cdp.eval(DUMP);
  say('DIGIT1', JSON.stringify(d));
  expect(d && d.group === 1, 'group 1');
  expect(d && /Energy cannon/i.test(d.wpn || ''), 'WPN cannon', d && d.wpn);
  expect(d && d.energy >= 1, 'digit1 energy bolts', d && d.energy);
  expect(d && d.heat > 0, 'digit1 heat', d && d.heat);
  await cdp.screenshot(join(here, '04-digit1.png'));
  await lmb(false);

  await cdp.eval(`window.__ctx.player.heat = 0`);
  await key('Digit2', '2', 50);
  await sleep(250);
  await lmb(true);
  await sleep(450);
  d = await cdp.eval(DUMP);
  say('DIGIT2', JSON.stringify(d));
  expect(d && d.group === 2, 'group 2');
  expect(d && /Disruptor/i.test(d.wpn || ''), 'WPN disruptor', d && d.wpn);
  expect(d && d.disruptor >= 1, 'digit2 disruptor bolts', d && d.disruptor);
  await cdp.screenshot(join(here, '05-digit2.png'));
  await lmb(false);

  await key('Digit3', '3', 51);
  await sleep(250);
  d = await cdp.eval(DUMP);
  say('DIGIT3', JSON.stringify(d));
  expect(d && d.group === 3, 'group 3');
  expect(d && d.wpn && d.wpn.startsWith('3 ·'), 'digit3 WPN still maps', d && d.wpn);

  await key('Digit4', '4', 52);
  await sleep(250);
  d = await cdp.eval(DUMP);
  say('DIGIT4', JSON.stringify(d));
  expect(d && d.group === 4, 'group 4');
  expect(d && /^4 ·/.test(d.wpn || ''), 'digit4 WPN still maps', d && d.wpn);

  // Dock Digit 5 = repair
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    const sys = ctx.world.currentSystem;
    const def = ctx.systems[sys];
    const p = def.station.position;
    ctx.flags.combat = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity && ctx.ship.velocity.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(p[0], p[1], p[2]);
    ctx.station.inZone = true;
    ctx.input.dockPressed = true;
    return sys;
  })()`);
  await sleep(900);
  const docked = await cdp.eval(`!!window.__ctx.flags.docked`);
  expect(docked, 'docked');
  await key('Digit5', '5', 53);
  await sleep(400);
  const dockUi = await cdp.eval(`(() => {
    const t = document.body.innerText || '';
    return {
      docked: !!window.__ctx.flags.docked,
      hasRepairHeading: /REPAIR/i.test(t),
      hasRepairAll: /Repair all/i.test(t),
      has5RepairMenu: /5 — Repair/i.test(t),
      snippet: t.replace(/\\s+/g, ' ').slice(0, 400),
    };
  })()`);
  say('DOCK5', JSON.stringify(dockUi));
  expect(dockUi && (dockUi.hasRepairAll || dockUi.hasRepairHeading), 'Digit5 still repair while docked');
  await cdp.screenshot(join(here, '06-dock-repair.png'));

  // Undock + force built hull (eval ctx, no src edit)
  await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button, .screen-btn')].find((b) => /launch/i.test(b.textContent || ''));
    if (btn) btn.click();
  })()`);
  await sleep(400);
  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    ctx.flags.docked = false;
    const ov = document.querySelector('.station-overlay') || document.getElementById('station-overlay');
    if (ov) ov.style.display = 'none';
    ctx.flags.paused = false;
    ctx.flags.combat = true;
    ctx.flags.camera = 'first';
    ctx.flags.firstPerson = true;
    ctx.player.hullKind = 'built';
    if (Object.prototype.hasOwnProperty.call(ctx.player, 'grafted')) delete ctx.player.grafted;
    ctx.player.heat = 0;
    ctx.input.weaponGroup = 5;
    ctx.input.fireHeld = false;
  })()`);
  await sleep(200);
  await key('Digit5', '5', 53);
  await sleep(250);
  await lmb(true);
  await sleep(450);
  d = await cdp.eval(DUMP);
  say('BUILT', JSON.stringify(d));
  expect(d && d.hullKind === 'built', 'forced built');
  expect(d && d.wpn === '5 · —', 'built WPN 5 · —', d && d.wpn);
  expect(d && d.heat === 0, 'built no heat', d && d.heat);
  expect(d && d.psiBolts === 0, 'built no magenta spawn', d && d.psiBolts);
  await cdp.screenshot(join(here, '07-built-dry.png'));
  await lmb(false);

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    ctx.player.grafted = true;
    ctx.player.heat = 0;
    ctx.input.weaponGroup = 5;
  })()`);
  await sleep(200);
  await lmb(true);
  await sleep(450);
  d = await cdp.eval(DUMP);
  say('GRAFT', JSON.stringify(d));
  expect(d && d.wpn === '5 · Psionic bolt', 'grafted WPN name', d && d.wpn);
  expect(d && d.family === 'mech', 'grafted HUD family stays mech', d && d.family);
  expect(d && d.heat > 0 && d.psiBolts >= 1, 'grafted fires', JSON.stringify({ heat: d && d.heat, psiBolts: d && d.psiBolts }));
  await cdp.screenshot(join(here, '08-grafted-fire.png'));
  await lmb(false);
  await cdp.screenshot(join(here, '09-aim-glass.png'));

  const pageErrors = cdp.exceptions.slice();
  const consErr = cdp.console.filter((c) => c.type === 'error');
  say('CONSOLE errors', consErr.length, JSON.stringify(consErr.slice(0, 8)));
  say('PAGE exceptions', pageErrors.length, JSON.stringify(pageErrors.slice(0, 8)));
  const noisy = consErr.filter((c) => !/WebGL|AudioContext|THREE.WebGLRenderer/i.test(c.text));
  expect(pageErrors.length === 0, 'no page exceptions', JSON.stringify(pageErrors));
  expect(noisy.length === 0, 'console clean of app errors', JSON.stringify(noisy.slice(0, 5)));

  const result = {
    status: fails.length ? 'BUGS_FOUND' : 'CLEAN',
    fails,
    console: cdp.console,
    exceptions: cdp.exceptions,
    log,
  };
  await writeFile(join(here, 'browser-log.json'), JSON.stringify(result, null, 2));
  await writeFile(join(here, 'browser-log.txt'), log.join('\n') + '\n');
  say('STATUS', result.status);
} catch (err) {
  say('ENV', err && err.stack || err);
  fails.push(String(err));
  await writeFile(join(here, 'browser-log.txt'), log.join('\n') + '\n').catch(() => {});
  process.exitCode = 2;
} finally {
  if (cdp) {
    try { await cdp.send('Browser.close', {}, 2000); } catch {}
    cdp.close();
  }
  killTree(chrome);
  killTree(vite);
  await sleep(500);
}
