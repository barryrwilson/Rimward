import { writeFileSync } from 'node:fs';

const list = await fetch('http://127.0.0.1:9486/json/list').then((r) => r.json());
const page = list.find((t) => t.type === 'page' && String(t.url).includes('5186'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', () => rej(new Error('ws')), { once: true });
});
let n = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
});
function send(method, params) {
  const id = ++n;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 15000);
    pending.set(id, (m) => { clearTimeout(t); resolve(m); });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
await send('Runtime.enable');
await send('Page.enable');
const ev = await send('Runtime.evaluate', {
  expression: `(() => {
    const ctx = window.__ctx; const rw = window.rimward;
    const t = document.querySelector('[data-title-action="continue"]');
    if (t) t.click();
    if (ctx.flags) { ctx.flags.paused = false; ctx.flags.berthHold = false; ctx.flags.docked = false; }
    if (ctx.agent) ctx.agent.optIn = true;
    if (ctx.player) ctx.player.power = 100;
    if (ctx.ship) { ctx.ship.burnerActive = false; ctx.ship.burnerReadyAt = 0; }
    const pos0 = ctx.ship && ctx.ship.object && ctx.ship.object.position
      ? [ctx.ship.object.position.x, ctx.ship.object.position.y, ctx.ship.object.position.z] : null;
    let threw = false; let result = null;
    try { result = rw.act({ v: 1, name: 'afterburner' }); }
    catch (e) { threw = true; result = String(e && e.message); }
    return { threw, result, pos0, originOpen: !!(ctx.originsApi && ctx.originsApi.isOpen && ctx.originsApi.isOpen()) };
  })()`,
  returnByValue: true,
});
const actVal = ev.result && ev.result.result && ev.result.result.value;
console.log('act', JSON.stringify(actVal));
await new Promise((r) => setTimeout(r, 250));
const after = await send('Runtime.evaluate', {
  expression: `(() => {
    const ctx = window.__ctx;
    const last = document.querySelector('.rw-agent-badge-last');
    const pos = ctx.ship && ctx.ship.object && ctx.ship.object.position;
    return {
      burnerActive: !!(ctx.ship && ctx.ship.burnerActive),
      lastText: last ? last.textContent : '',
      lastIntent: ctx.agent && ctx.agent.lastIntent,
      pos: pos ? [pos.x, pos.y, pos.z] : null,
      docked: !!(ctx.flags && ctx.flags.docked),
    };
  })()`,
  returnByValue: true,
});
const afterVal = after.result && after.result.result && after.result.result.value;
console.log('after', JSON.stringify(afterVal));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('C:/Projects/WebSim/out/w138/evade/verify/afterburner-last.png', Buffer.from(shot.result.data, 'base64'));
writeFileSync('C:/Projects/WebSim/out/w138/evade/verify/browser-shot.json', JSON.stringify({ actVal, afterVal }, null, 2));
console.log('shot ok');
ws.close();
