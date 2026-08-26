/** Follow-up: on-glass pip + dock HOME display after 2s. */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5178/';
const CDP_PORT = 9473;
const PROFILE = join(here, 'chrome-profile-2');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (...a) => console.log(a.map(String).join(' '));

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try { spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
  catch { try { child.kill(); } catch {} }
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
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
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('cdp timeout ' + method)); }
      }, timeoutMs);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval');
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
  const hidden = (el) => !el || el.classList.contains('is-hidden');
  const ctx = window.__ctx;
  const st = ctx && ctx.station;
  return {
    docked: !!(ctx && ctx.flags && ctx.flags.docked),
    cam: ctx && ctx.ship && ctx.ship.cameraMode,
    fp: !!(ctx && ctx.flags && ctx.flags.firstPerson),
    pipHidden: hidden(pip),
    chevHidden: hidden(chev),
    rowHidden: hidden(row),
    rowClass: row && row.className,
    rowDisplay: row ? getComputedStyle(row).display : null,
    homeVal: row && row.querySelector('.rw-value') && row.querySelector('.rw-value').textContent,
    pipLabel: pip && pip.querySelector('.rw-home-pip-label') && pip.querySelector('.rw-home-pip-label').textContent,
    pipParentId: pip && pip.parentElement && pip.parentElement.id,
    pipInsideReticle: !!(pip && ret && ret.contains(pip)),
    pipRect: pip && !hidden(pip) ? (() => { const r = pip.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })() : null,
    retRect: ret ? (() => { const r = ret.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })() : null,
    stationName: st && st.name,
  };
})()`;

let chrome = null;
let cdp = null;
const out = {};
try {
  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${PROFILE}`,
    '--remote-allow-origins=*',
    '--no-first-run', '--no-default-browser-check',
    '--disable-gpu-sandbox', '--window-size=1600,900',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-extensions', '--ignore-gpu-blocklist', '--enable-webgl',
    '--headless=new', 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  say('CHROME', chrome.pid);
  let browserWs = null;
  for (let i = 0; i < 50; i++) {
    try {
      const ver = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (ver.ok) { browserWs = (await ver.json()).webSocketDebuggerUrl; if (browserWs) break; }
    } catch {}
    await sleep(200);
  }
  const bootCdp = new Cdp(browserWs);
  await bootCdp.ready();
  await bootCdp.send('Target.createTarget', { url: APP });
  bootCdp.close();
  let pageWs = null;
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const page = list.find((t) => t.type === 'page' && String(t.url || '').includes('5178'));
    if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
    await sleep(200);
  }
  cdp = new Cdp(pageWs);
  await cdp.ready();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');

  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    const b = await cdp.eval(`({ ctx: !!window.__ctx, title: !!document.getElementById('rw-title') })`);
    if (b && (b.ctx || b.title)) break;
    await sleep(250);
  }
  await cdp.eval(`(() => { try { localStorage.removeItem('rimward-save-v1'); } catch {} try { sessionStorage.setItem('rimward-title-skip','1'); } catch {} location.reload(); return true; })()`);
  await sleep(1000);
  const t1 = Date.now();
  while (Date.now() - t1 < 15000) {
    const b = await cdp.eval(`({ ctx: !!window.__ctx })`);
    if (b && b.ctx) break;
    await sleep(250);
  }
  await cdp.eval(`(() => {
    const originRow = [...document.querySelectorAll('div')].find((el) => (el.textContent || '').startsWith('[1] Freehold Greenhand'));
    if (originRow) { originRow.click(); return 'origin'; }
    const neu = document.getElementById('rw-title-new') || document.querySelector('[data-title-action="new"]');
    if (neu) { neu.click(); return 'new'; }
    return 'none';
  })()`);
  await sleep(800);
  await cdp.eval(`(() => {
    const originRow = [...document.querySelectorAll('div')].find((el) => (el.textContent || '').startsWith('[1] Freehold Greenhand'));
    if (originRow) { originRow.click(); return 'origin'; }
    return 'no';
  })()`);
  const t2 = Date.now();
  while (Date.now() - t2 < 15000) {
    const s = await cdp.eval(INSPECT);
    if (s && s.stationName) { out.boot = s; break; }
    await sleep(300);
  }

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    const obj = ctx.ship.object;
    const s = ctx.station.position;
    obj.position.set(s.x + 80, s.y + 8, s.z + 120);
    obj.lookAt(s.x, s.y, s.z);
    if (ctx.ship.velocity) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    ctx.flags.firstPerson = true;
    ctx.ship.cameraMode = 'first';
    ctx.ship.camSnap = true;
    return true;
  })()`);
  await sleep(1000);
  out.onGlass = await cdp.eval(INSPECT);
  await cdp.screenshot(join(here, '04-pip-on-glass.png'));
  say('onGlass', JSON.stringify(out.onGlass));

  await cdp.eval(`(() => {
    const ctx = window.__ctx;
    const obj = ctx.ship.object;
    const s = ctx.station.position;
    obj.position.set(s.x + 20, s.y, s.z + 10);
    ctx.input.dockPressed = true;
    return true;
  })()`);
  await sleep(2000);
  out.dock = await cdp.eval(INSPECT);
  await cdp.screenshot(join(here, '03-dock-hidden.png'));
  say('dock', JSON.stringify(out.dock));

  await writeFile(join(here, 'live-results-2.json'), JSON.stringify(out, null, 2));
} catch (e) {
  say('FATAL', e && e.stack || e);
  out.fatal = String(e);
  try { await writeFile(join(here, 'live-results-2.json'), JSON.stringify(out, null, 2)); } catch {}
} finally {
  try { if (cdp) cdp.close(); } catch {}
  killTree(chrome);
  await sleep(400);
}
