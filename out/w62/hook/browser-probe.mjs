// HUD-02 PR1 live browser pins. Evidence only.
import { spawn, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const profile = join(here, 'chrome-profile');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9334 + Math.floor(Math.random() * 200);
const appUrl = 'http://localhost:5173/';

mkdirSync(profile, { recursive: true });

const chromeProc = spawn(chrome, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--window-size=1280,720',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  appUrl,
], { stdio: 'ignore', windowsHide: true });

function withTimeout(p, ms, label) {
  return Promise.race([
    p,
    delay(ms).then(() => { throw new Error(`timeout ${label} ${ms}ms`); }),
  ]);
}

async function waitPort() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return res.json();
    } catch { /* retry */ }
    await delay(250);
  }
  throw new Error('chrome debug port did not open');
}

const notes = [];
function log(line) {
  notes.push(line);
  console.log(line);
}

function killChromeTree() {
  try {
    if (chromeProc.pid) execSync(`taskkill /PID ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch { /* already gone */ }
}

try {
  const ver = await waitPort();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await withTimeout(new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('cdp websocket failed')), { once: true });
  }), 8000, 'ws-open');

  let nextId = 1;
  const send = (method, params = {}) => withTimeout(new Promise((resolve, reject) => {
    const id = nextId++;
    const onMsg = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id !== id) return;
      ws.removeEventListener('message', onMsg);
      if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
      else resolve(msg.result || {});
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  }), 15000, method);

  let page = null;
  for (let i = 0; i < 20 && !page; i++) {
    const { targetInfos } = await send('Target.getTargets');
    log(`targets: ${JSON.stringify(targetInfos.map((t) => ({ type: t.type, url: t.url })))}`);
    page = targetInfos.find((t) => t.type === 'page' && /localhost:5173/.test(t.url));
    if (!page) await delay(250);
  }
  if (!page) {
    const created = await send('Target.createTarget', { url: appUrl });
    page = { targetId: created.targetId };
  }
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  await send('Target.activateTarget', { targetId: page.targetId });

  function flatSend(method, params = {}) {
    return withTimeout(new Promise((resolve, reject) => {
      const id = nextId++;
      const onMsg = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.sessionId !== sessionId) return;
        if (msg.id !== id) return;
        ws.removeEventListener('message', onMsg);
        if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
        else resolve(msg.result || {});
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    }), 20000, method);
  }

  await flatSend('Page.enable');
  await flatSend('Runtime.enable');
  await flatSend('Page.navigate', { url: appUrl });

  for (let i = 0; i < 30; i++) {
    await delay(500);
    const probe = await flatSend('Runtime.evaluate', {
      expression: `({ href: location.href, kids: document.getElementById('hud')?.childElementCount ?? -1, btn: !!document.querySelector('[data-title-action="new"]'), fatal: document.getElementById('fatal')?.textContent || '', scripts: [...document.scripts].map((s) => s.src || s.type).slice(0, 6), bodyLen: document.body ? document.body.innerHTML.length : -1 })`,
      returnByValue: true,
    });
    const v = probe.result?.value;
    log(`boot-wait ${i}: ${JSON.stringify(v)}`);
    if (v && v.href.includes('localhost:5173') && v.kids > 0) break;
  }

  const dismiss = await flatSend('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-title-action="new"]');
      if (btn) { btn.click(); return 'clicked-new'; }
      return 'no-title';
    })()`,
    returnByValue: true,
  });
  log(`title: ${dismiss.result?.value}`);
  await delay(800);

  const originPick = await flatSend('Runtime.evaluate', {
    expression: `(() => {
      const hit = [...document.querySelectorAll('div')].find((el) => {
        const t = (el.textContent || '').replace(/\\s+/g, ' ').trim();
        return /^\\[1\\].*Greenhand/i.test(t) && el.childElementCount === 0;
      });
      if (hit) { hit.click(); return 'clicked-origin-1-leaf'; }
      return 'no-origin';
    })()`,
    returnByValue: true,
  });
  log(`origin: ${originPick.result?.value}`);
  if (originPick.result?.value === 'no-origin') {
    await flatSend('Input.dispatchKeyEvent', {
      type: 'keyDown', key: '1', code: 'Digit1', text: '1',
      windowsVirtualKeyCode: 49, nativeVirtualKeyCode: 49,
    });
    await flatSend('Input.dispatchKeyEvent', {
      type: 'keyUp', key: '1', code: 'Digit1',
      windowsVirtualKeyCode: 49, nativeVirtualKeyCode: 49,
    });
    log('origin: sent Digit1');
  }

  for (let i = 0; i < 10; i++) {
    await delay(300);
    const st = await flatSend('Runtime.evaluate', {
      expression: `({ originOpen: /who are you/i.test(document.body.innerText || ''), spd: document.querySelector('.rw-combat-self .rw-speed .rw-value, .rw-combat-self')?.innerText?.slice(0,80) })`,
      returnByValue: true,
    });
    log(`origin-wait ${i}: ${JSON.stringify(st.result?.value)}`);
    if (st.result?.value && !st.result.value.originOpen) break;
  }
  await delay(800);

  const before = await flatSend('Runtime.evaluate', {
    expression: `(() => {
      const hud = document.getElementById('hud');
      if (!hud) return { missing: true };
      return {
        family: hud.dataset.family || hud.getAttribute('data-family'),
        childCount: hud.childElementCount,
        childNames: [...hud.children].map((n) => n.className),
        selfRail: !!hud.querySelector('.rw-combat-self'),
        tgtRail: !!hud.querySelector('.rw-combat-target'),
        hairSelf: !!hud.querySelector('.rw-combat-self.rw-hair-off'),
        hairTgt: !!hud.querySelector('.rw-combat-target.rw-hair-off'),
        contacts: !!hud.querySelector('.rw-contacts'),
        reticle: !!hud.querySelector('.rw-reticle'),
        originOpen: /who are you/i.test(document.body.innerText || ''),
      };
    })()`,
    returnByValue: true,
  });
  log(`default: ${JSON.stringify(before.result?.value)}`);

  const shot1 = await flatSend('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(here, 'browser-default-bio.png'), Buffer.from(shot1.data, 'base64'));
  log('wrote browser-default-bio.png');

  const setOver = await flatSend('Runtime.evaluate', {
    expression: `(() => { sessionStorage.setItem('rw-hud-family','mech'); return sessionStorage.getItem('rw-hud-family'); })()`,
    returnByValue: true,
  });
  log(`override set: ${setOver.result?.value}`);
  let after = { result: { value: null } };
  for (let i = 0; i < 12; i++) {
    await delay(250);
    after = await flatSend('Runtime.evaluate', {
      expression: `(() => {
        const hud = document.getElementById('hud');
        if (!hud) return { missing: true };
        return {
          family: hud.dataset.family || hud.getAttribute('data-family'),
          childCount: hud.childElementCount,
          childNames: [...hud.children].map((n) => n.className),
          selfRail: !!hud.querySelector('.rw-combat-self'),
          tgtRail: !!hud.querySelector('.rw-combat-target'),
          persist: localStorage.getItem('rw-hud-family'),
        };
      })()`,
      returnByValue: true,
    });
    log(`override-wait ${i}: ${JSON.stringify(after.result?.value)}`);
    if (after.result?.value?.family === 'mech') break;
  }

  const shot2 = await flatSend('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(here, 'browser-override-mech.png'), Buffer.from(shot2.data, 'base64'));
  log('wrote browser-override-mech.png');

  await flatSend('Runtime.evaluate', {
    expression: `sessionStorage.removeItem('rw-hud-family')`,
    returnByValue: true,
  });
  let cleared = { result: { value: null } };
  for (let i = 0; i < 12; i++) {
    await delay(250);
    cleared = await flatSend('Runtime.evaluate', {
      expression: `(() => {
        const hud = document.getElementById('hud');
        return {
          family: hud ? (hud.dataset.family || hud.getAttribute('data-family')) : null,
          override: sessionStorage.getItem('rw-hud-family'),
          persist: localStorage.getItem('rw-hud-family'),
        };
      })()`,
      returnByValue: true,
    });
    log(`cleared-wait ${i}: ${JSON.stringify(cleared.result?.value)}`);
    if (cleared.result?.value?.family === 'bio') break;
  }

  writeFileSync(join(here, 'browser-probe.log'), notes.join('\n') + '\n');
  ws.close();
} catch (err) {
  log(`BROWSER PROBE FAIL: ${err && err.stack ? err.stack : err}`);
  writeFileSync(join(here, 'browser-probe.log'), notes.join('\n') + '\n');
  process.exitCode = 1;
} finally {
  killChromeTree();
}
