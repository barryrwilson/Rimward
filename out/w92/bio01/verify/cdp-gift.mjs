/**
 * Chrome CDP BIO-01 gift desk. Vite 127.0.0.1:5180, CDP 9440.
 * Evidence only. Does not edit src/.
 */
import { spawn, execSync } from 'node:child_process';
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
const consoleErrs = [];
const summary = { ok: false, checks: {}, errors: [], env: null };

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

let chromeProc = null;
try {
  await jsonGet('/json/version');
  note('cdp already up');
} catch {
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
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ], { stdio: 'ignore', windowsHide: false });
  note('spawn chrome pid=' + chromeProc.pid);
}

async function waitPage(ms = 40000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const list = await jsonGet('/json/list');
      const hit = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
        || (list || []).find((t) => t.webSocketDebuggerUrl);
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
note('cdp page ' + JSON.stringify({ url: page.url, title: page.title }));

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
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params && msg.params.exceptionDetails;
    consoleErrs.push('exception ' + String(d?.text || d?.exception?.description || ''));
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const p = msg.params;
    if (p && p.type === 'error') {
      const text = (p.args || []).map((a) => a.value || a.description || '').join(' ');
      consoleErrs.push('console.error ' + text);
    }
  }
  if (msg.method === 'Network.loadingFailed') {
    const p = msg.params || {};
    consoleErrs.push('netfail ' + String(p.errorText || '') + ' ' + String(p.type || ''));
  }
});
function send(method, params) {
  const id = nextId++;
  const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return Promise.race([
    p,
    sleep(60000).then(() => {
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
await send('Network.enable').catch(() => null);
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { sessionStorage.setItem('rimward-title-skip','1'); localStorage.removeItem('rimward-save-v1'); } catch (e) {}`,
});

try {
  const nav = await send('Page.navigate', { url });
  note('navigated ' + url + ' ' + JSON.stringify(nav && { frameId: nav.frameId, loaderId: nav.loaderId }));
} catch (err) {
  note('navigate fail ' + String(err && err.message ? err.message : err));
}

const bootWait = Date.now();
let boot = null;
while (Date.now() - bootWait < 90000) {
  boot = await evalJson(`({
    href: location.href,
    ready: document.readyState,
    ctx: !!window.__ctx,
    title: !!document.getElementById('rw-title'),
    newBtn: !!document.getElementById('rw-title-new'),
    scripts: document.scripts.length,
    canvas: document.querySelectorAll('canvas').length,
    sys: window.__ctx && window.__ctx.world && window.__ctx.world.currentSystem,
    paused: window.__ctx && window.__ctx.flags && window.__ctx.flags.paused,
    fatal: document.getElementById('fatal') && document.getElementById('fatal').style.display,
    fatalText: document.getElementById('fatal') ? document.getElementById('fatal').textContent.slice(0, 400) : '',
    bodyLen: document.body ? document.body.innerHTML.length : 0,
  })`).catch((err) => ({ err: String(err) }));
  note('boot ' + JSON.stringify(boot));
  if (boot && boot.ctx) break;
  await sleep(1200);
}
if (!boot || !boot.ctx) {
  summary.env = 'no-ctx';
  try {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(here, '00-no-ctx.png'), Buffer.from(r.data, 'base64'));
    note('SHOT 00-no-ctx.png');
  } catch (err) { note('shot fail ' + String(err)); }
  writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, log, consoleErrs }, null, 2));
  process.exit(2);
}

await evalJson(`(() => {
  try { localStorage.removeItem('rimward-save-v1'); } catch (e) {}
  const neu = document.getElementById('rw-title-new');
  if (neu) {
    neu.click();
    if ((neu.textContent || '').includes('CONFIRM')) neu.click();
  }
  return { clicked: !!neu, text: neu && neu.textContent };
})()`);
await sleep(800);
const origin = await evalJson(`({
  text: (document.body && document.body.innerText || '').slice(0, 400),
  origin: !!(document.body && /who are you/i.test(document.body.innerText || '')),
  paused: window.__ctx.flags.paused,
})`);
note('origin ' + JSON.stringify(origin));
if (origin && origin.origin) {
  await evalJson(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
  await sleep(700);
}

const playWait = Date.now();
while (Date.now() - playWait < 30000) {
  const st = await evalJson(`({
    paused: !!(window.__ctx && window.__ctx.flags && window.__ctx.flags.paused),
    ship: !!(window.__ctx && window.__ctx.ship && window.__ctx.ship.object),
    player: !!(window.__ctx && window.__ctx.player),
  })`);
  note('play ' + JSON.stringify(st));
  if (st && st.ship && st.player && !st.paused) break;
  await sleep(500);
}

await evalJson(`(() => {
  const ctx = window.__ctx;
  if (ctx.world.currentSystem !== 'bt_cradle') ctx.emit('jumpRequested', { to: 'bt_cradle' });
  return { sys: ctx.world.currentSystem, jumping: !!ctx.gate?.jumping };
})()`);
const jumpWait = Date.now();
while (Date.now() - jumpWait < 20000) {
  const st = await evalJson(`({
    sys: window.__ctx.world.currentSystem,
    jumping: !!(window.__ctx.gate && window.__ctx.gate.jumping),
  })`);
  note('jump ' + JSON.stringify(st));
  if (st && st.sys === 'bt_cradle' && !st.jumping) break;
  await sleep(400);
}

await evalJson(`(() => {
  const ctx = window.__ctx;
  const def = ctx.systems.bt_cradle;
  const p = def.station.position;
  ctx.flags.combat = false;
  ctx.input.fullStop = true;
  ctx.input.throttle = 0;
  if (ctx.ship.velocity && ctx.ship.velocity.set) ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.object.position.set(p[0], p[1], p[2]);
  ctx.world.reputation = ctx.world.reputation || {};
  ctx.world.reputation.beautiful = 50;
  ctx.input.dockPressed = true;
  return { faction: def.faction, sys: ctx.world.currentSystem };
})()`);
const dockWait = Date.now();
while (Date.now() - dockWait < 15000) {
  const st = await evalJson(`(() => {
    const ov = document.querySelector('.station-overlay');
    return {
      docked: !!window.__ctx.flags.docked,
      display: ov && ov.style.display,
      text: ov ? (ov.textContent || '').slice(0, 240) : '',
    };
  })()`);
  note('dock ' + JSON.stringify(st));
  if (st && st.docked && st.display && st.display !== 'none') break;
  await sleep(400);
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
      sys: ctx.world.currentSystem,
      faction: ctx.systems[ctx.world.currentSystem] && ctx.systems[ctx.world.currentSystem].faction,
      rep: ctx.world.reputation && ctx.world.reputation.beautiful,
      credits: ctx.world.credits,
      mountedId: ctx.world.hangar && ctx.world.hangar.mountedId,
      hulls: hulls.map((h) => ({
        id: h.id, hullKind: h.hullKind, classKey: h.classKey, faction: h.faction,
        grafted: Object.prototype.hasOwnProperty.call(h, 'grafted') ? h.grafted : undefined,
      })),
      playerKind: ctx.player && ctx.player.hullKind,
      notice: ov && ov.querySelector('.station-notice') ? ov.querySelector('.station-notice').textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      overlayHas: {
        papers: !!(ov && (ov.textContent || '').includes('1 — Papers')),
        confirm: !!(ov && (ov.textContent || '').includes('Confirm papers')),
        arm: !!(ov && (ov.textContent || '').includes('The berth answers. Confirm the sworn gift.')),
        ok: !!(ov && (ov.textContent || '').includes('A living seed rests in the hangar.')),
        already: !!(ov && (ov.textContent || '').includes('You already carry that gift.')),
        full: !!(ov && (ov.textContent || '').includes('The hangar is full.')),
        noGift: !!(ov && (ov.textContent || '').includes('No gift.')),
        sworn: !!(ov && (ov.textContent || '').includes('Sworn gift')),
        shipyardMenu: !!(ov && (ov.textContent || '').includes('0 — Shipyard')),
        shipyard: !!(ov && (ov.textContent || '').includes('SHIPYARD')),
        people: !!(ov && (ov.textContent || '').includes('PEOPLE')),
      },
    };
  })()`);
  note(tag + ' ' + JSON.stringify(d));
  return d;
}

function key(code) {
  return evalJson(`window.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true }))`);
}
async function clickLabel(label) {
  return evalJson(`(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')].find((b) => b.textContent === ${JSON.stringify(label)});
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
}

const menu = await dump('menu');
await shot('01-dock-menu.png');
summary.checks.digit0Label = !!(menu && menu.overlayHas && menu.overlayHas.shipyardMenu);

await key('Digit0');
await sleep(400);
const yard = await dump('digit0');
await shot('02-digit0-shipyard.png');
summary.checks.digit0Shipyard = !!(yard && yard.overlayHas && yard.overlayHas.shipyard);

await key('Escape');
await sleep(350);
await key('Digit7');
await sleep(450);
const peopleLow = await evalJson(`(() => {
  const ctx = window.__ctx;
  ctx.world.reputation.beautiful = 10;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
  return true;
})()`);
await sleep(300);
await key('Digit7');
await sleep(450);
const rankLow = await dump('people-rank10');
await shot('03-people-rank10.png');
summary.checks.rankHide = !!(rankLow && !rankLow.overlayHas.papers && !rankLow.overlayHas.sworn && rankLow.overlayHas.people);

const lowGrant = await evalJson(`(async () => {
  const m = await import('/src/game/bio-seed.js');
  const r = m.grantSwornGift(window.__ctx);
  return { ok: r.ok, reason: r.reason, notice: m.giftNoticeFor(r), hulls: (window.__ctx.world.hangar.hulls || []).map((h) => h.id) };
})()`);
note('lowGrant ' + JSON.stringify(lowGrant));
summary.checks.rankNoGift = !!(lowGrant && lowGrant.reason === 'denied' && lowGrant.notice === 'No gift.');

await evalJson(`window.__ctx.world.reputation.beautiful = 50`);
await key('Escape');
await sleep(300);
await key('Digit7');
await sleep(450);
const people = await dump('people-sworn');
await shot('04-people-sworn.png');
summary.checks.papersVisible = !!(people && people.overlayHas.papers && people.overlayHas.arm);

await key('Digit1');
await sleep(400);
const armed = await dump('armed');
await shot('05-armed-papers.png');
summary.checks.armed = !!(armed && armed.overlayHas.confirm && armed.overlayHas.arm);
const beforeIds = (armed.hulls || []).map((h) => h.id);
const mountedBefore = armed.mountedId;
const kindBefore = armed.playerKind;

await key('Digit1');
await sleep(300);
const doubleArm = await dump('digit1-again');
summary.checks.digit1DoesNotConfirm = !!(doubleArm && doubleArm.overlayHas.confirm
  && !(doubleArm.hulls || []).some((h) => h.id === 'hull_seed_gift'));

await key('Escape');
await sleep(350);
const esc = await dump('esc-cancel');
await shot('06-esc-cancel.png');
summary.checks.escNoWrite = !!(esc && !esc.overlayHas.confirm
  && (esc.hulls || []).map((h) => h.id).join(',') === beforeIds.join(',')
  && !(esc.hulls || []).some((h) => h.id === 'hull_seed_gift'));

const papersClick = await clickLabel('1 — Papers');
note('papersClick ' + papersClick);
await sleep(350);
const confirmClick = await clickLabel('Confirm papers');
note('confirmClick ' + confirmClick);
await sleep(500);
const granted = await dump('granted');
await shot('07-gift-ok.png');
const giftRow = (granted.hulls || []).find((h) => h.id === 'hull_seed_gift');
summary.checks.giftRow = !!(giftRow && giftRow.hullKind === 'living' && giftRow.classKey === 'light' && giftRow.faction === 'beautiful');
summary.checks.noGraft = !!(giftRow && giftRow.grafted === undefined);
summary.checks.noRemount = granted.mountedId === mountedBefore && granted.playerKind === kindBefore;
summary.checks.giftNotice = !!(granted.overlayHas.ok);
summary.checks.creditsSame = granted.credits === armed.credits;

await clickLabel('1 — Papers');
await sleep(300);
await clickLabel('Confirm papers');
await sleep(400);
const already = await dump('already');
await shot('08-already.png');
summary.checks.already = !!(already.overlayHas.already
  && already.hulls.filter((h) => h.id === 'hull_seed_gift').length === 1);

await key('Escape');
await sleep(350);
const menu2 = await dump('menu-after-gift');
summary.checks.digit0StillLabel = !!(menu2.docked && menu2.overlayHas && menu2.overlayHas.shipyardMenu);
await key('Digit0');
await sleep(400);
const yard2 = await dump('digit0-after-gift');
await shot('09-digit0-after-gift.png');
summary.checks.digit0AfterGift = !!(yard2.docked && yard2.overlayHas.shipyard && yard2.hulls.some((h) => h.id === 'hull_seed_gift'));

await key('Escape');
await sleep(350);
await evalJson(`(() => {
  const ctx = window.__ctx;
  const hangar = ctx.world.hangar;
  hangar.hulls = hangar.hulls.filter((h) => h.id !== 'hull_seed_gift');
  const base = hangar.hulls[0] || { hullKind: 'living', classKey: 'light', faction: 'independent' };
  while (hangar.hulls.length < 8) {
    const i = hangar.hulls.length;
    hangar.hulls.push({
      id: 'hull_fill_' + i,
      hullKind: base.hullKind || 'living',
      classKey: base.classKey || 'light',
      faction: base.faction || 'independent',
      name: 'Fill',
    });
  }
  ctx.world.reputation.beautiful = 50;
  return hangar.hulls.map((h) => h.id);
})()`);
await key('Digit7');
await sleep(450);
await clickLabel('1 — Papers');
await sleep(350);
const fullBefore = await dump('full-armed');
const fullIds = (fullBefore.hulls || []).map((h) => h.id).join(',');
await clickLabel('Confirm papers');
await sleep(450);
const full = await dump('full-refuse');
await shot('10-full-refuse.png');
summary.checks.fullRefuse = !!(full.docked && full.overlayHas.full && full.hulls.map((h) => h.id).join(',') === fullIds
  && !full.hulls.some((h) => h.id === 'hull_seed_gift'));

const giftErrs = consoleErrs.filter((e) => /gift|seed|people|bio-seed|TypeError|ReferenceError/i.test(e));
summary.checks.noGiftConsole = giftErrs.length === 0;
summary.consoleErrs = consoleErrs.slice(0, 40);
summary.giftErrs = giftErrs;

const failed = Object.entries(summary.checks).filter(([, v]) => !v).map(([k]) => k);
summary.ok = failed.length === 0;
summary.failed = failed;
writeFileSync(join(here, 'cdp-summary.json'), JSON.stringify({ summary, log, consoleErrs }, null, 2));
writeFileSync(join(here, 'cdp.log'), log.join('\n') + '\n');
console.log('SUMMARY ' + JSON.stringify(summary));

try { ws.close(); } catch { /* */ }
process.exit(summary.ok ? 0 : 1);
