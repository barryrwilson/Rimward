const ver = await fetch('http://127.0.0.1:9441/json/version').then((r) => r.json());
const list = await fetch('http://127.0.0.1:9441/json/list').then((r) => r.json());
const page = list.find((t) => t.type === 'page' && String(t.url).includes('127.0.0.1:5181'));
if (!page) {
  console.log('CDP FAIL no vite tab');
  process.exit(1);
}
const ws = new WebSocket(ver.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
let sessionId = null;
function send(method, params = {}, useSession = true) {
  const n = ++id;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${method}`)), 40000);
    pending.set(n, (msg) => {
      clearTimeout(t);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    });
    const payload = { id: n, method, params };
    if (useSession && sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
  });
}
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.id && pending.has(msg.id)) {
    const fn = pending.get(msg.id);
    pending.delete(msg.id);
    fn(msg);
  }
});
const attached = await send('Target.attachToTarget', { targetId: page.id, flatten: true }, false);
sessionId = attached.sessionId;
await send('Page.enable', {});
await send('Runtime.enable', {});
const already = await send('Runtime.evaluate', { expression: '!!window.__ctx', returnByValue: true });
if (!already.result?.value) {
  await send('Page.reload', { ignoreCache: true });
  await new Promise((r) => setTimeout(r, 8000));
}

async function ev(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    const d = res.exceptionDetails;
    throw new Error(d.exception?.description || d.text || JSON.stringify(d));
  }
  return res.result?.value;
}

for (let i = 0; i < 80; i++) {
  const ready = await ev('!!window.__ctx');
  if (ready) break;
  await new Promise((r) => setTimeout(r, 500));
}
if (!(await ev('!!window.__ctx'))) {
  console.log('CDP FAIL no ctx');
  process.exit(1);
}

await ev(`(() => { const btn = document.querySelector('[data-title-action="new"]'); if (btn) btn.click(); return true; })()`);
await new Promise((r) => setTimeout(r, 500));
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
await new Promise((r) => setTimeout(r, 800));

const setup = await ev(`(() => {
  const ctx = window.__ctx;
  ctx.flags.paused = false;
  ctx.gate.jumping = false;
  ctx.world.currentSystem = 'bt_cradle';
  ctx.emit('systemLoaded', { to: 'bt_cradle' });
  ctx.world.credits = 50000;
  if (!ctx.world.reputation || typeof ctx.world.reputation !== 'object') ctx.world.reputation = {};
  ctx.world.reputation.beautiful = 50;
  ctx.player.hullKind = 'living';
  ctx.player.classKey = 'light';
  return { sys: ctx.world.currentSystem, classKey: ctx.player.classKey };
})()`);
for (let i = 0; i < 40; i++) {
  const stName = await ev('window.__ctx.station?.systemName || window.__ctx.station?.name || ""');
  if (String(stName).toLowerCase().includes('cradle') || stName === 'bt_cradle') break;
  await new Promise((r) => setTimeout(r, 250));
}
await ev(`(() => {
  const ctx = window.__ctx;
  const st = ctx.systems.bt_cradle.station.position;
  ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  return true;
})()`);
await new Promise((r) => setTimeout(r, 1200));
await ev('window.__ctx.input.dockPressed = false');
await new Promise((r) => setTimeout(r, 600));

const docked = await ev('window.__ctx.flags.docked === true');
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit0', key: '0', bubbles: true }))`);
await new Promise((r) => setTimeout(r, 400));
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }))`);
await new Promise((r) => setTimeout(r, 400));

const overlay = await ev(`(() => {
  const texts = [];
  const walk = (n) => { texts.push(n.textContent || ''); for (const c of n.children || []) walk(c); };
  const ov = document.querySelector('.station-overlay');
  if (ov) walk(ov);
  const joined = texts.join('\\n');
  return {
    docked: window.__ctx.flags.docked,
    shipyard: joined.includes('SHIPYARD'),
    train: joined.includes('Train hull'),
    legend: joined.includes('Train on Hangar'),
    digit0: joined.includes('0 last row') || joined.includes('0 — Shipyard'),
  };
})()`);

const clickedOffer = await ev(`(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Train hull');
  if (b) b.click();
  return !!b;
})()`);
await new Promise((r) => setTimeout(r, 300));
const papers = await ev(`(() => {
  const texts = [];
  const walk = (n) => { texts.push(n.textContent || ''); for (const c of n.children || []) walk(c); };
  const ov = document.querySelector('.station-overlay');
  if (ov) walk(ov);
  const joined = texts.join('\\n');
  return {
    hop: joined.includes('→ heavy'),
    cargo: joined.includes('Hold stays with this hull'),
    confirm: joined.includes('Confirm papers'),
  };
})()`);
const clickedConfirm = await ev(`(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Confirm papers');
  if (b) b.click();
  return !!b;
})()`);
await new Promise((r) => setTimeout(r, 700));
const after = await ev(`(() => {
  const ctx = window.__ctx;
  const hangar = ctx.world?.hangar;
  const row = hangar && Array.isArray(hangar.hulls)
    ? hangar.hulls.find((h) => h.id === hangar.mountedId) : null;
  const texts = [];
  const walk = (n) => { texts.push(n.textContent || ''); for (const c of n.children || []) walk(c); };
  const ov = document.querySelector('.station-overlay');
  if (ov) walk(ov);
  return {
    classKey: row?.classKey,
    hullKind: row?.hullKind,
    playerClass: ctx.player?.classKey,
    mountedId: hangar?.mountedId,
    hangarKeys: hangar ? Object.keys(hangar) : null,
    restScale: ctx.ship?.hullRig?.restScale,
    kind: ctx.ship?.hullRig?.kind,
    notice: texts.join(' ').includes('The hull takes the heavy form.'),
    credits: ctx.world?.credits,
    maxSpeed: ctx.config?.ship?.maxSpeed,
    overlay: texts.join(' | ').slice(0, 400),
  };
})()`);

await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }))`);
await new Promise((r) => setTimeout(r, 300));
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit7', key: '7', bubbles: true }))`);
await new Promise((r) => setTimeout(r, 400));
const people = await ev(`(() => {
  const texts = [];
  const walk = (n) => { texts.push(n.textContent || ''); for (const c of n.children || []) walk(c); };
  const ov = document.querySelector('.station-overlay');
  if (ov) walk(ov);
  const joined = texts.join('\\n');
  return joined.includes('1 — Papers') || joined.includes('Papers');
})()`);

const out = { setup, docked, overlay, clickedOffer, papers, clickedConfirm, after, people };
console.log(JSON.stringify(out, null, 2));
const ok = docked && overlay.train && papers.confirm && after.classKey === 'heavy'
  && after.hullKind === 'living' && after.kind === 'living'
  && typeof after.restScale === 'number' && after.restScale > 1
  && after.maxSpeed === 90;
if (!ok) {
  console.log('CDP HANGAR FAIL');
  process.exit(1);
}
console.log('CDP HANGAR PASS');
ws.close();
process.exit(0);
