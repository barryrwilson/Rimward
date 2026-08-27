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
  return (method, params = {}, ms = 30000) => new Promise((resolve, reject) => {
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

const list = await fetch(`${CDP}/json/list`).then((r) => r.json());
const page = list.find((t) => t.type === 'page' && String(t.url).includes('5186'));
if (!page) { console.log('NO_PAGE'); process.exit(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', () => reject(new Error('ws')), { once: true });
});
const send = cdp(ws);
await send('Runtime.enable');
await send('Page.enable');

async function evalExpr(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', {
    expression, awaitPromise, returnByValue: true, timeout: 15000,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval');
  return r.result?.value;
}

const picked = await evalExpr(`(() => {
  const titleBtn = document.querySelector('[data-title-action="continue"]')
    || document.querySelector('[data-title-action="new"]');
  if (titleBtn) titleBtn.click();
  const ctx = window.__ctx;
  const api = ctx && ctx.originsApi;
  if (api && api.isOpen && api.isOpen() === true && typeof api.choose === 'function') {
    return { chose: api.choose('greenhand'), title: titleBtn ? titleBtn.dataset.titleAction : '' };
  }
  return { chose: 'closed', origin: ctx && ctx.world && ctx.world.origin, title: titleBtn ? titleBtn.dataset.titleAction : '' };
})()`);

await new Promise((r) => setTimeout(r, 500));

const pre = await evalExpr(`(() => {
  const ctx = window.__ctx;
  const rw = window.rimward;
  if (ctx.agent) ctx.agent.optIn = true;
  if (ctx.player) ctx.player.power = 100;
  if (ctx.ship) { ctx.ship.burnerActive = false; ctx.ship.burnerReadyAt = 0; }
  const pos = ctx.ship?.object?.position;
  return {
    origin: ctx.world && ctx.world.origin,
    paused: !!(ctx.flags && ctx.flags.paused),
    docked: !!(ctx.flags && ctx.flags.docked),
    originOpen: !!(ctx.originsApi && ctx.originsApi.isOpen && ctx.originsApi.isOpen()),
    title: !!document.getElementById('rw-title'),
    pos: pos ? [pos.x, pos.y, pos.z] : null,
    optIn: !!(ctx.agent && ctx.agent.optIn),
    handle: !!rw,
  };
})()`);

const act = await evalExpr(`(() => {
  let threw = false; let result = null;
  try { result = window.rimward.act({ v: 1, name: 'afterburner' }); }
  catch (e) { threw = true; result = String(e && e.message); }
  return { threw, result };
})()`);

await evalExpr(`(async () => {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
})()`, true);

const post = await evalExpr(`(() => {
  const ctx = window.__ctx;
  const pos = ctx.ship?.object?.position;
  const badge = document.querySelector('.rw-agent-badge');
  const last = badge && badge.querySelector('.rw-agent-badge-last');
  const hub = document.querySelector('.rw-center, .rw-aim, .rw-reticle-hub, .rw-hub-empty');
  const centers = [...document.querySelectorAll('[class*="hub"], [class*="aim"]')].map((n) => n.className).slice(0, 20);
  return {
    burnerActive: !!(ctx.ship && ctx.ship.burnerActive),
    pressed: !!(ctx.input && ctx.input.afterburnerPressed),
    lastIntent: ctx.agent && ctx.agent.lastIntent,
    lastText: last ? last.textContent : '',
    badgeText: badge ? badge.textContent : '',
    pos: pos ? [pos.x, pos.y, pos.z] : null,
    docked: !!(ctx.flags && ctx.flags.docked),
    originOpen: !!(ctx.originsApi && ctx.originsApi.isOpen && ctx.originsApi.isOpen()),
    hubClass: hub ? hub.className : null,
    centers,
  };
})()`);

const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(join(here, 'afterburner-play.png'), Buffer.from(shot.data, 'base64'));
const out = { picked, pre, act, post };
writeFileSync(join(here, 'browser-play.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
ws.close();
