// Native CDP against a loopback Vite server. Uses the existing __ctx debug handle
// only to fund and position the pilot; purchase/mount use the rendered desk.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = process.env.ISSUE225_URL || 'http://127.0.0.1:5225';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const profile = await mkdtemp(join(tmpdir(), 'rimward-225-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,1000', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws;
const errors = [];
try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch { await sleep(100); }
  }
  assert(port, 'Chrome CDP started');
  const page = (await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json())).find(p => p.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  let seq = 0; const pending = new Map();
  ws.addEventListener('message', event => {
    const m = JSON.parse(String(event.data));
    if (m.id) { const p = pending.get(m.id); if (!p) return; pending.delete(m.id); clearTimeout(p.timer); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')) errors.push(m);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq, timer = setTimeout(() => { pending.delete(id); reject(Error(`Timeout ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
  const run = async expression => {
    const out = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!out.exceptionDetails, JSON.stringify(out.exceptionDetails)); return out.result.value;
  };
  const wait = async expression => { for (let i = 0; i < 150; i++) { if (await run(expression)) return; await sleep(200); } throw Error(`Wait failed: ${expression}`); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: base });
  await wait('!!window.__ctx && !!document.querySelector("[data-title-action=new]")');
  await run('document.querySelector("[data-title-action=new]").click()');
  await run('window.dispatchEvent(new KeyboardEvent("keydown", {code:"Digit1", key:"1", bubbles:true}))');
  await wait('!window.__ctx.flags.paused && !document.querySelector("[data-title-action=new]")');
  await run(`(() => {
    const c = window.__ctx, p = c.systems[c.world.currentSystem].station.position;
    c.world.credits = 100000; c.flags.combat = false;
    c.ship.object.position.set(p[0] + 36, p[1], p[2]); c.ship.velocity.set(0,0,0); c.ship.speed = 0;
    c.input.dockPressed = true;
  })()`);
  await wait('window.__ctx.flags.docked');
  await run('window.__ctx.input.dockPressed = false; window.__ctx.stationDesk.selectService("shipyard")');
  const click = async text => run(`(() => { const b = [...document.querySelectorAll('.station-overlay button')].find(b => b.textContent.includes(${JSON.stringify(text)})); if (!b) throw Error('Missing button ' + ${JSON.stringify(text)}); b.click(); })()`);
  await click('2 — Yard');
  await run(`(() => { const row = [...document.querySelectorAll('.shipyard-buy-row')].find(r => r.querySelector('.shipyard-buy-name')?.textContent.startsWith('freighter')); if (!row) throw Error('Missing freighter offer'); row.querySelector('button').click(); })()`);
  await click('Confirm papers'); await click('1 — Hangar');
  const bought = await run(`window.__ctx.world.hangar.hulls.find(r => r.classKey === 'freighter')`);
  assert(bought && bought.name !== 'freighter');
  await run(`(() => { const row = [...document.querySelectorAll('.shipyard-hull')].find(r => r.querySelector('.shipyard-hull-name')?.textContent === ${JSON.stringify(bought.name)}); if (!row) throw Error('Missing named hull'); row.querySelector('button').click(); })()`);
  await wait(`window.__ctx.world.shipName === ${JSON.stringify(bought.name)}`);
  const display = await run(`({header: document.querySelector('.station-overlay')?.textContent, names: [...document.querySelectorAll('.shipyard-hull-name')].map(e=>e.textContent), meta: [...document.querySelectorAll('.shipyard-hull-meta')].map(e=>e.textContent)})`);
  assert(display.header.includes(`“${bought.name}” made fast`));
  assert(display.names.includes(bought.name));
  assert(display.meta.some(t => t.startsWith('freighter ·') && t.endsWith(' · mounted')));
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(profile, 'mounted.png'), Buffer.from(screenshot.data, 'base64'));
  const persisted = await run(`(async () => {
    const {snapshot, restore} = await import('/src/game/save.js');
    const c = window.__ctx, snap = JSON.parse(JSON.stringify(snapshot(c)));
    restore(c, snap);
    const savedName = c.world.hangar.hulls.find(r=>r.id === ${JSON.stringify(bought.id)}).name;
    const {switchTo} = await import('/src/game/hangar.js');
    c.flags.docked = true; c.flags.combat = false; c.flags.paused = false;
    const switched = switchTo(c, 'hull_starter');
    return { savedName, switched, starterName: c.world.shipName };
  })()`);
  assert.equal(persisted.savedName, bought.name); assert.equal(persisted.switched.ok, true); assert.equal(persisted.starterName, 'she');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(JSON.stringify({ pass: true, bought, display, persisted, consoleErrors: errors, screenshot: join(profile, 'mounted.png') }, null, 2));
} finally { ws?.close(); chrome.kill(); }
