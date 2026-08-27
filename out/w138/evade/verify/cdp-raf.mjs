import { writeFileSync } from 'node:fs';

const list = await fetch('http://127.0.0.1:9486/json/list').then((r) => r.json());
const page = list.find((t) => t.type === 'page' && String(t.url).includes('5186'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res) => ws.addEventListener('open', res, { once: true }));
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
const r = await send('Runtime.evaluate', {
  expression: `(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const ctx = window.__ctx;
    const last = document.querySelector('.rw-agent-badge-last');
    const pos = ctx.ship && ctx.ship.object && ctx.ship.object.position;
    return {
      burnerActive: !!(ctx.ship && ctx.ship.burnerActive),
      pressed: !!(ctx.input && ctx.input.afterburnerPressed),
      lastText: last ? last.textContent : '',
      pos: pos ? [pos.x, pos.y, pos.z] : null,
      paused: !!(ctx.flags && ctx.flags.paused),
      docked: !!(ctx.flags && ctx.flags.docked),
    };
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
const val = r.result && r.result.result && r.result.result.value;
console.log(JSON.stringify(val));
writeFileSync('C:/Projects/WebSim/out/w138/evade/verify/browser-raf.json', JSON.stringify(val, null, 2));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('C:/Projects/WebSim/out/w138/evade/verify/afterburner-last.png', Buffer.from(shot.result.data, 'base64'));
ws.close();
