/**
 * Second-pass live probes: wait until HUD SPD matches ship.speed, then sample.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5176/';
const CDP_PORT = Number(process.env.CDP_PORT || 9410);
const PROFILE = join(here, 'chrome-profile-2');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => { const line = a.map(String).join(' '); log.push(line); console.log(line); };

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
    this.exceptions = [];
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params?.exceptionDetails?.exception?.description
          || msg.params?.exceptionDetails?.text || 'exception';
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
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('cdp timeout ' + method)); }
      }, timeoutMs);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 45000) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
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
  const spdNode = hud && hud.querySelector('.rw-combat-self .rw-speed .rw-value');
  const spdText = spdNode ? (spdNode.childNodes[0] && spdNode.childNodes[0].nodeValue) : null;
  const prompt = hud && hud.querySelector('.rw-prompt');
  const pKey = hud && hud.querySelector('.rw-prompt-key');
  const pVerb = hud && hud.querySelector('.rw-prompt-verb');
  const selfSlow = hud && hud.querySelector('.rw-combat-self .rw-slow-lamp');
  const tgtSlow = hud && hud.querySelectorAll('.rw-combat-target .rw-slow-lamp');
  const match = hud && hud.querySelector('.rw-combat-self .rw-match-lamp');
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
    docked: !!(ctx && ctx.flags && ctx.flags.docked),
    berthHold: !!(ctx && ctx.flags && ctx.flags.berthHold),
    jumping: !!(ctx && ctx.gate && ctx.gate.jumping),
    gateInZone: !!(ctx && ctx.gate && ctx.gate.inZone),
    stationInZone: !!(st && st.inZone),
    speed: ship ? ship.speed : null,
    spdText,
    dist,
    promptHidden: !prompt || prompt.classList.contains('is-hidden'),
    pKey: pKey ? pKey.textContent : null,
    pVerb: pVerb ? pVerb.textContent : null,
    selfSlowText: selfSlow ? selfSlow.textContent : null,
    selfSlowHidden: !selfSlow || selfSlow.classList.contains('is-hidden'),
    tgtSlowCount: tgtSlow ? tgtSlow.length : -1,
    matchText: match ? match.textContent : null,
    matchHidden: !match || match.classList.contains('is-hidden'),
    reticleW: rr ? Math.round(rr.width) : null,
    reticleH: rr ? Math.round(rr.height) : null,
  };
})()`;

function place(dist, speed) {
  return `(() => {
    const ctx = window.__ctx;
    if (!ctx || !ctx.ship || !ctx.ship.object || !ctx.station || !ctx.station.position) return 'no-pose';
    if (ctx.flags && ctx.flags.docked && ctx.stationDesk) ctx.stationDesk.undock();
    ctx.flags.docked = false;
    ctx.flags.paused = false;
    ctx.flags.berthHold = false;
    if (ctx.gate) { ctx.gate.jumping = false; }
    const s = ctx.station.position;
    ctx.ship.object.position.set(s.x + ${dist}, s.y, s.z);
    if (ctx.ship.velocity) ctx.ship.velocity.set(0, ${speed}, 0);
    ctx.ship.speed = ${speed};
    ctx.input.throttle = 0;
    return 'ok';
  })()`;
}

let chrome = null;
let cdp = null;
const results = { cases: {}, exceptions: [] };

try {
  await mkdir(PROFILE, { recursive: true });
  chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,800',
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
      if (page && page.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
    } catch {}
    await sleep(200);
  }
  if (!pageWs) throw new Error('page ws missing');
  cdp = new Cdp(pageWs);
  await cdp.ready();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.bringToFront');

  await cdp.eval(`(() => {
    try { localStorage.removeItem('rimward-save-v1'); } catch {}
    try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
    location.reload();
    return true;
  })()`);
  await sleep(1200);

  for (let i = 0; i < 4; i++) {
    await cdp.eval(`(() => {
      const originRow = [...document.querySelectorAll('div')].find((el) =>
        (el.textContent || '').startsWith('[1] Freehold Greenhand'));
      if (originRow) { originRow.click(); return 'origin'; }
      const neu = document.getElementById('rw-title-new');
      if (neu) { neu.click(); return 'new'; }
      return 'none';
    })()`);
    await sleep(500);
  }

  const tFly = Date.now();
  while (Date.now() - tFly < 15000) {
    const f = await cdp.eval(INSPECT);
    if (f && f.hasCtx) break;
    await sleep(300);
  }

  async function settle(label, pred, ms = 2500) {
    const t0 = Date.now();
    let last = null;
    while (Date.now() - t0 < ms) {
      last = await cdp.eval(INSPECT);
      if (pred(last)) return last;
      await sleep(120);
    }
    return last;
  }

  await cdp.eval(place(30, 120));
  const fast = await settle('fast', (s) => s && s.stationInZone && s.speed > 40 && s.pVerb && s.pVerb.includes('SLOW'));
  results.cases.inZoneFast = fast;
  await cdp.screenshot(join(here, '05-wait-inzone-slow.png'));
  say('fast', JSON.stringify(fast));

  await cdp.eval(place(30, 8));
  const slow = await settle('slow', (s) => s && s.stationInZone && Number(s.spdText) <= 20 && s.pVerb === 'Dock');
  results.cases.inZoneLe20 = slow;
  await cdp.screenshot(join(here, '06-wait-inzone-dock.png'));
  say('le20', JSON.stringify(slow));

  await cdp.eval(place(100, 120));
  const band = await settle('band', (s) => s && s.dist > 80 && s.dist < 130 && s.speed > 40);
  results.cases.band100 = band;
  await cdp.screenshot(join(here, '07-wait-band-100.png'));
  say('band100', JSON.stringify(band));

  await cdp.eval(place(200, 120));
  const far = await settle('far', (s) => s && s.dist > 170 && s.selfSlowHidden === true);
  results.cases.band200 = far;
  await cdp.screenshot(join(here, '08-wait-band-200.png'));
  say('band200', JSON.stringify(far));

  await cdp.eval(place(30, 120));
  await settle('pre', (s) => s && !s.selfSlowHidden);
  await cdp.eval(`(() => { window.__ctx.flags.docked = true; return true; })()`);
  results.cases.docked = await settle('docked', (s) => s && s.selfSlowHidden === true);
  await cdp.eval(`(() => { window.__ctx.flags.docked = false; if (window.__ctx.stationDesk) window.__ctx.stationDesk.undock(); return true; })()`);

  await cdp.eval(place(30, 120));
  await cdp.eval(`(() => { window.__ctx.flags.berthHold = true; return true; })()`);
  results.cases.berthHold = await settle('hold', (s) => s && s.selfSlowHidden === true);
  await cdp.eval(`(() => { window.__ctx.flags.berthHold = false; return true; })()`);

  await cdp.eval(place(100, 120));
  await cdp.eval(`(() => { const ctx = window.__ctx; if (ctx.gate) ctx.gate.inZone = true; if (ctx.station) ctx.station.inZone = false; return true; })()`);
  results.cases.jumpOwns = await settle('jump', (s) => s && s.selfSlowHidden === true && s.gateInZone);
  say('jumpOwns', JSON.stringify(results.cases.jumpOwns));

  results.exceptions = cdp.exceptions.slice();
  results.pass = {
    inZoneFastVerb: !!(fast && fast.pKey === 'J' && fast.pVerb === 'Dock · SLOW — approach under 20 u/s'),
    inZoneFastLamp: !!(fast && fast.selfSlowText === 'SLOW' && fast.selfSlowHidden === false),
    le20Verb: !!(slow && slow.pVerb === 'Dock' && slow.pKey === 'J'),
    le20Lamp: !!(slow && slow.selfSlowHidden === true),
    band100Lamp: !!(band && band.selfSlowHidden === false && band.selfSlowText === 'SLOW'),
    band100NoDock: !!(band && (band.promptHidden || band.pVerb !== 'Dock · SLOW — approach under 20 u/s' || !band.stationInZone)),
    band200Lamp: !!(far && far.selfSlowHidden === true),
    tgtNeverSlow: !!(fast && fast.tgtSlowCount === 0),
    matchStays: !!(fast && fast.matchText === 'MATCH'),
    hub80: !!(fast && fast.reticleW === 80 && fast.reticleH === 80),
    dockedHide: !!(results.cases.docked && results.cases.docked.selfSlowHidden),
    holdHide: !!(results.cases.berthHold && results.cases.berthHold.selfSlowHidden),
    jumpOwnsHide: !!(results.cases.jumpOwns && results.cases.jumpOwns.selfSlowHidden),
    noExc: cdp.exceptions.length === 0,
  };
  await writeFile(join(here, 'live-wait-results.json'), JSON.stringify(results, null, 2));
  await writeFile(join(here, 'live-wait-log.txt'), log.join('\n'));
  say('pass', JSON.stringify(results.pass));
} catch (err) {
  say('FAIL', String(err && err.stack || err));
  results.error = String(err && err.stack || err);
  await writeFile(join(here, 'live-wait-results.json'), JSON.stringify(results, null, 2));
  process.exitCode = 1;
} finally {
  if (cdp) cdp.close();
  killTree(chrome);
  await sleep(500);
}
