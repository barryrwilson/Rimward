/**
 * Compact CDP: Digit 0 after gift + full hangar papers. Vite 5180, CDP 9440.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9440;
const url = 'http://127.0.0.1:5180/';
const profile = join(here, 'chrome-profile');
mkdirSync(profile, { recursive: true });
const log = [];
const note = (s) => { log.push(s); console.log(s); };
const summary = { ok: false, checks: {} };

function jsonGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 2500 }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (err) { reject(err); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

let chromeProc = null;
try { await jsonGet('/json/version'); note('cdp already up'); }
catch {
  chromeProc = spawn(chrome, [
    `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--window-size=1400,900', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ], { stdio: 'ignore', windowsHide: false });
  note('spawn chrome pid=' + chromeProc.pid);
}

async function waitPage() {
  const t0 = Date.now();
  while (Date.now() - t0 < 40000) {
    try {
      const list = await jsonGet('/json/list');
      const hit = (list || []).find((t) => t.webSocketDebuggerUrl);
      if (hit) return hit;
    } catch { /* */ }
    await sleep(300);
  }
  throw new Error('no page');
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
  return Promise.race([p, sleep(30000).then(() => { pending.delete(id); throw new Error('timeout ' + method); })]);
}
async function evalJson(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result ? r.result.value : undefined;
}
await send('Runtime.enable');
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { sessionStorage.setItem('rimward-title-skip','1'); localStorage.removeItem('rimward-save-v1'); } catch (e) {}`,
});
await send('Page.navigate', { url }).catch((e) => note('nav ' + e.message));

let boot = null;
const t0 = Date.now();
while (Date.now() - t0 < 90000) {
  boot = await evalJson(`({ ctx: !!window.__ctx, ready: document.readyState, paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused })`).catch((e) => ({ err: String(e) }));
  note('boot ' + JSON.stringify(boot));
  if (boot && boot.ctx) break;
  await sleep(1000);
}
if (!boot || !boot.ctx) { summary.env = 'no-ctx'; writeFileSync(join(here, 'cdp-rest.json'), JSON.stringify({ summary, log }, null, 2)); process.exit(2); }

await evalJson(`(() => {
  try { localStorage.removeItem('rimward-save-v1'); } catch (e) {}
  const neu = document.getElementById('rw-title-new');
  if (neu) { neu.click(); if ((neu.textContent || '').includes('CONFIRM')) neu.click(); }
  return true;
})()`);
await sleep(600);
const origin = await evalJson(`!!(document.body && /who are you/i.test(document.body.innerText || ''))`);
if (origin) {
  await evalJson(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(600);
}
const t1 = Date.now();
while (Date.now() - t1 < 25000) {
  const st = await evalJson(`({ paused: !!window.__ctx.flags.paused, ship: !!window.__ctx.ship && !!window.__ctx.ship.object })`);
  if (st && st.ship && !st.paused) break;
  await sleep(400);
}
await evalJson(`(() => { const ctx = window.__ctx; if (ctx.world.currentSystem !== 'bt_cradle') ctx.emit('jumpRequested', { to: 'bt_cradle' }); return true; })()`);
const t2 = Date.now();
while (Date.now() - t2 < 20000) {
  const st = await evalJson(`({ sys: window.__ctx.world.currentSystem, jumping: !!window.__ctx.gate && window.__ctx.gate.jumping })`);
  note('jump ' + JSON.stringify(st));
  if (st && st.sys === 'bt_cradle' && !st.jumping) break;
  await sleep(400);
}
await evalJson(`(() => {
  const ctx = window.__ctx;
  const p = ctx.systems.bt_cradle.station.position;
  ctx.flags.combat = false; ctx.input.fullStop = true; ctx.input.throttle = 0;
  if (ctx.ship.velocity && ctx.ship.velocity.set) ctx.ship.velocity.set(0,0,0);
  ctx.ship.object.position.set(p[0], p[1], p[2]);
  ctx.world.reputation = ctx.world.reputation || {};
  ctx.world.reputation.beautiful = 50;
  ctx.input.dockPressed = true;
  return true;
})()`);
const t3 = Date.now();
while (Date.now() - t3 < 12000) {
  const st = await evalJson(`({ docked: !!window.__ctx.flags.docked, display: document.querySelector('.station-overlay') && document.querySelector('.station-overlay').style.display })`);
  if (st && st.docked && st.display === 'flex') break;
  await sleep(300);
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(here, name), Buffer.from(r.data, 'base64'));
  note('SHOT ' + name);
}
async function dump(tag) {
  const d = await evalJson(`(() => {
    const ov = document.querySelector('.station-overlay');
    const ctx = window.__ctx;
    const hulls = (ctx.world.hangar && ctx.world.hangar.hulls) || [];
    return {
      docked: !!ctx.flags.docked,
      mountedId: ctx.world.hangar && ctx.world.hangar.mountedId,
      playerKind: ctx.player && ctx.player.hullKind,
      hulls: hulls.map((h) => h.id),
      notice: ov && ov.querySelector('.station-notice') ? ov.querySelector('.station-notice').textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      hasShipyard: !!(ov && (ov.textContent || '').includes('SHIPYARD')),
      hasMenu0: !!(ov && (ov.textContent || '').includes('0 — Shipyard')),
      hasPapers: !!(ov && (ov.textContent || '').includes('1 — Papers')),
      hasConfirm: !!(ov && (ov.textContent || '').includes('Confirm papers')),
      hasFull: !!(ov && (ov.textContent || '').includes('The hangar is full.')),
      hasGift: hulls.some((h) => h.id === 'hull_seed_gift'),
    };
  })()`);
  note(tag + ' ' + JSON.stringify(d));
  return d;
}
const key = (code) => evalJson(`window.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true }))`);
const clickLabel = (label) => evalJson(`(() => {
  const btn = [...document.querySelectorAll('.station-overlay button')].find((b) => b.textContent === ${JSON.stringify(label)});
  if (!btn) return false; btn.click(); return true;
})()`);

const grant = await evalJson(`(async () => {
  const m = await import('/src/game/bio-seed.js');
  const r = m.grantSwornGift(window.__ctx);
  return { ok: r.ok, reason: r.reason, notice: m.giftNoticeFor(r), mounted: window.__ctx.world.hangar.mountedId, ids: window.__ctx.world.hangar.hulls.map((h) => h.id) };
})()`);
note('grant ' + JSON.stringify(grant));
summary.checks.grantOk = !!(grant && grant.ok && grant.ids.includes('hull_seed_gift'));

await key('Digit0');
await sleep(500);
const yard = await dump('digit0-after-gift');
await shot('16-digit0-after-gift.png');
summary.checks.digit0AfterGift = !!(yard.docked && yard.hasShipyard && yard.hasGift);

await key('Escape');
await sleep(400);
await evalJson(`(() => {
  const hangar = window.__ctx.world.hangar;
  hangar.hulls = hangar.hulls.filter((h) => h.id !== 'hull_seed_gift');
  const base = hangar.hulls[0] || { hullKind: 'living', classKey: 'light', faction: 'independent' };
  while (hangar.hulls.length < 8) {
    hangar.hulls.push({ id: 'hull_fill_' + hangar.hulls.length, hullKind: base.hullKind || 'living', classKey: base.classKey || 'light', faction: base.faction || 'independent', name: 'Fill' });
  }
  window.__ctx.world.reputation.beautiful = 50;
  return hangar.hulls.length;
})()`);
await key('Digit7');
await sleep(500);
const people = await dump('people-full');
summary.checks.papersWhenFull = !!people.hasPapers;
await clickLabel('1 — Papers');
await sleep(350);
const armed = await dump('armed-full');
const ids = (armed.hulls || []).join(',');
await clickLabel('Confirm papers');
await sleep(450);
const full = await dump('full-refuse');
await shot('17-full-refuse.png');
summary.checks.fullNotice = !!full.hasFull;
summary.checks.noEvict = (full.hulls || []).join(',') === ids;
summary.checks.noGiftOnFull = !full.hasGift;
summary.checks.stillDocked = !!full.docked;

const failed = Object.entries(summary.checks).filter(([, v]) => !v).map(([k]) => k);
summary.ok = failed.length === 0;
summary.failed = failed;
writeFileSync(join(here, 'cdp-rest.json'), JSON.stringify({ summary, log }, null, 2));
writeFileSync(join(here, 'cdp-rest.log'), log.join('\n') + '\n');
console.log('SUMMARY ' + JSON.stringify(summary));
try { ws.close(); } catch { /* */ }
process.exit(summary.ok ? 0 : 1);
