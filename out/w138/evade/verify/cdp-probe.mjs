import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDP = 'http://127.0.0.1:9486';
const here = dirname(fileURLToPath(import.meta.url));

function cdp(ws) {
  let n = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params = {}, ms = 20000) => new Promise((resolve, reject) => {
    const id = ++n;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout ${method}`));
    }, ms);
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function waitOpen(ws) {
  if (ws.readyState === 1) return;
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('ws error')), { once: true });
  });
}

console.log('fetch list');
const list = await fetch(`${CDP}/json/list`).then((r) => r.json());
console.log('targets', list.map((t) => t.type + ' ' + t.url));
const page = list.find((t) => t.type === 'page' && String(t.url).includes('5186'))
  || list.find((t) => t.type === 'page');
if (!page) {
  console.log('NO_PAGE', JSON.stringify(list));
  process.exit(2);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await Promise.race([
  waitOpen(ws),
  new Promise((_, reject) => setTimeout(() => reject(new Error('ws timeout')), 8000)),
]);
const send = cdp(ws);

async function evalExpr(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    timeout: 15000,
  });
  if (r.exceptionDetails) {
    const t = r.exceptionDetails.exception?.description || r.exceptionDetails.text;
    throw new Error(t || 'eval exception');
  }
  return r.result?.value;
}

await send('Page.enable');
await send('Runtime.enable');
/* page already at ?agent=1; do not reload (navigate can stall CDP evaluate) */

let ready = false;
for (let i = 0; i < 20; i++) {
  ready = await evalExpr(`!!(window.__ctx && window.rimward)`);
  if (ready) break;
  await new Promise((r) => setTimeout(r, 250));
}

async function clickAction(action) {
  return evalExpr(`(() => {
    const el = document.querySelector('[data-title-action="${action}"]');
    if (!el) return false;
    el.click();
    return true;
  })()`);
}

async function clickOrigin() {
  return evalExpr(`(() => {
    const nodes = [...document.querySelectorAll('div')];
    for (const n of nodes) {
      const t = (n.textContent || '').trim();
      if (t.startsWith('[1]') && t.length < 160) { n.click(); return t; }
    }
    return '';
  })()`);
}

const titleOpen = await evalExpr(`!!document.getElementById('rw-title')`);
let started = false;
if (titleOpen) {
  const cont = await clickAction('continue');
  if (!cont) {
    await clickAction('new');
    await new Promise((r) => setTimeout(r, 200));
    const still = await evalExpr(`!!document.querySelector('[data-title-action="new"]')`);
    if (still) await clickAction('new');
  }
  started = true;
  await new Promise((r) => setTimeout(r, 400));
  const originOpen = await evalExpr(`!!(window.__ctx && window.__ctx.originsApi && window.__ctx.originsApi.isOpen && window.__ctx.originsApi.isOpen())`);
  if (originOpen) {
    await clickOrigin();
    await new Promise((r) => setTimeout(r, 400));
  }
}

const before = await evalExpr(`(() => {
  const ctx = window.__ctx;
  const rw = window.rimward;
  if (!ctx || !rw) return { ready: false };
  if (ctx.flags) {
    ctx.flags.paused = false;
    ctx.flags.berthHold = false;
  }
  if (ctx.agent) ctx.agent.optIn = true;
  if (ctx.flags && ctx.flags.docked === true && ctx.stationDesk && typeof ctx.stationDesk.undock === 'function') {
    try { ctx.stationDesk.undock(); } catch (e) { /* ignore */ }
  }
  if (ctx.flags) ctx.flags.docked = false;
  if (ctx.player) ctx.player.power = 100;
  if (ctx.ship) {
    ctx.ship.burnerActive = false;
    ctx.ship.burnerReadyAt = 0;
  }
  const pos = ctx.ship && ctx.ship.object && ctx.ship.object.position
    ? [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z]
    : null;
  return {
    ready: true,
    optIn: ctx.agent && ctx.agent.optIn === true,
    paused: !!(ctx.flags && ctx.flags.paused),
    docked: !!(ctx.flags && ctx.flags.docked),
    held: !!(ctx.flags && ctx.flags.berthHold),
    pos,
    title: !!document.getElementById('rw-title'),
  };
})()`);

const act = await evalExpr(`(() => {
  const rw = window.rimward;
  let threw = false;
  let result = null;
  try { result = rw.act({ v: 1, name: 'afterburner' }); }
  catch (e) { threw = true; result = String(e && e.message); }
  return { threw, result };
})()`);

await evalExpr(`(async () => {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
})()`, true);

const after = await evalExpr(`(() => {
  const ctx = window.__ctx;
  const rw = window.rimward;
  const pos = ctx.ship && ctx.ship.object && ctx.ship.object.position
    ? [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z]
    : null;
  let obs = null;
  try { obs = rw.observe(); } catch (e) { obs = { error: String(e && e.message) }; }
  const badge = document.querySelector('.rw-agent-badge');
  const last = badge ? [...badge.querySelectorAll('*')].map((n) => n.textContent).filter(Boolean) : [];
  const hub = document.querySelector('.rw-hub, #rw-hub, .rw-aim-hub');
  const hubKids = hub ? hub.childElementCount : null;
  return {
    burnerActive: !!(ctx.ship && ctx.ship.burnerActive),
    afterburnerPressed: !!(ctx.input && ctx.input.afterburnerPressed),
    pos,
    lastIntent: ctx.agent && ctx.agent.lastIntent,
    badgeTexts: last,
    badgeText: badge ? badge.textContent : '',
    hubKids,
    observeBurnerReadyAt: obs && obs.ship ? obs.ship.burnerReadyAt : undefined,
    originOpen: !!(ctx.originsApi && ctx.originsApi.isOpen && ctx.originsApi.isOpen()),
    docked: !!(ctx.flags && ctx.flags.docked),
  };
})()`);

const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(join(here, 'afterburner.png'), Buffer.from(shot.data, 'base64'));

const out = { ready, titleOpen, started, before, act, after, pageUrl: page.url };
writeFileSync(join(here, 'browser.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
ws.close();
