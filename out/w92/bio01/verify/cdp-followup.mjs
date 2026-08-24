/**
 * Attach to CDP 9440. Re-dock and finish Digit 0 + full-hangar gift checks.
 */
import http from 'node:http';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const port = 9440;
const log = [];
const note = (s) => { log.push(s); console.log(s); };
const summary = { ok: false, checks: {}, failed: [] };

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
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const list = await jsonGet('/json/list');
const page = (list || []).find((t) => t.type === 'page' && String(t.url || '').includes('5180'))
  || (list || []).find((t) => t.webSocketDebuggerUrl);
if (!page) {
  writeFileSync(join(here, 'cdp-followup.json'), JSON.stringify({ env: 'no-page', list }, null, 2));
  process.exit(2);
}
note('page ' + page.url);

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
  return Promise.race([p, sleep(15000).then(() => { pending.delete(id); throw new Error('timeout ' + method); })]);
}
async function evalJson(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result ? r.result.value : undefined;
}
await send('Runtime.enable');
await send('Page.enable');

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
      overlayDisplay: ov && ov.style.display,
      mountedId: ctx.world.hangar && ctx.world.hangar.mountedId,
      hulls: hulls.map((h) => ({ id: h.id, hullKind: h.hullKind })),
      playerKind: ctx.player && ctx.player.hullKind,
      notice: ov && ov.querySelector('.station-notice') ? ov.querySelector('.station-notice').textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      text: ov ? (ov.textContent || '').slice(0, 280) : '',
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

await evalJson(`(() => {
  const ctx = window.__ctx;
  const p = ctx.systems.bt_cradle.station.position;
  ctx.flags.combat = false;
  ctx.input.fullStop = true;
  ctx.input.throttle = 0;
  if (ctx.ship.velocity && ctx.ship.velocity.set) ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.object.position.set(p[0], p[1], p[2]);
  ctx.world.reputation = ctx.world.reputation || {};
  ctx.world.reputation.beautiful = 50;
  ctx.input.dockPressed = true;
  return true;
})()`);
for (let i = 0; i < 20; i++) {
  const st = await evalJson(`({ docked: !!window.__ctx.flags.docked, display: document.querySelector('.station-overlay') && document.querySelector('.station-overlay').style.display })`);
  note('redock ' + JSON.stringify(st));
  if (st.docked && st.display === 'flex') break;
  await sleep(300);
}

for (let i = 0; i < 6; i++) {
  const cur = await dump('esc-loop-' + i);
  if (cur && cur.docked && cur.hasMenu0) break;
  await key('Escape');
  await sleep(350);
}
const menu = await dump('menu');
summary.checks.redocked = !!(menu && menu.docked && menu.hasMenu0);
await shot('11-redock-menu.png');

await key('Digit0');
await sleep(400);
const yard = await dump('digit0');
await shot('12-digit0-fullhangar.png');
summary.checks.digit0Shipyard = !!(yard && yard.hasShipyard && yard.docked);

await key('Escape');
await sleep(350);
const back = await dump('back-menu');
summary.checks.backMenu = !!(back && back.docked && back.hasMenu0);

await key('Digit7');
await sleep(450);
const people = await dump('people');
await shot('13-people-full.png');
summary.checks.papersWhenFull = !!(people && people.hasPapers);

await clickLabel('1 — Papers');
await sleep(350);
const armed = await dump('armed-full');
const ids = (armed.hulls || []).map((h) => h.id).join(',');
await clickLabel('Confirm papers');
await sleep(450);
const full = await dump('full-refuse');
await shot('14-full-refuse.png');
summary.checks.fullNotice = !!(full && full.hasFull);
summary.checks.noEvict = (full.hulls || []).map((h) => h.id).join(',') === ids;
summary.checks.noGiftOnFull = !full.hasGift;
summary.checks.noRemountFull = full.mountedId === armed.mountedId && full.playerKind === armed.playerKind;

await evalJson(`(() => {
  const ctx = window.__ctx;
  const hangar = ctx.world.hangar;
  hangar.hulls = hangar.hulls.filter((h) => h.id === hangar.mountedId).slice(0, 1);
  if (hangar.hulls.length === 0) hangar.hulls = [{ id: 'hull_starter', hullKind: 'living', classKey: 'light', faction: 'independent', name: 'She' }];
  hangar.mountedId = hangar.hulls[0].id;
  ctx.world.reputation.beautiful = 50;
  return hangar.hulls.map((h) => h.id);
})()`);
await key('Escape');
await sleep(300);
await key('Digit7');
await sleep(400);
await clickLabel('1 — Papers');
await sleep(300);
await clickLabel('Confirm papers');
await sleep(400);
const gift = await dump('gift-again');
summary.checks.giftAfterTrim = !!(gift && gift.hasGift);

await key('Escape');
await sleep(350);
const menu2 = await dump('menu-one-esc');
summary.checks.oneEscToMenu = !!(menu2 && menu2.docked && menu2.hasMenu0);
await key('Digit0');
await sleep(400);
const yard2 = await dump('digit0-after-gift');
await shot('15-digit0-after-gift.png');
summary.checks.digit0AfterGift = !!(yard2 && yard2.hasShipyard && yard2.docked && yard2.hasGift);

const failed = Object.entries(summary.checks).filter(([, v]) => !v).map(([k]) => k);
summary.ok = failed.length === 0;
summary.failed = failed;
writeFileSync(join(here, 'cdp-followup.json'), JSON.stringify({ summary, log }, null, 2));
writeFileSync(join(here, 'cdp-followup.log'), log.join('\n') + '\n');
console.log('SUMMARY ' + JSON.stringify(summary));
try { ws.close(); } catch { /* */ }
process.exit(summary.ok ? 0 : 1);
