// HUD-02 PR2 live browser pins. Evidence only. Writes under out/w62/mech/.
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
  '--window-size=1600,900',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  appUrl,
], { stdio: 'ignore', windowsHide: false });

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

const MEASURE = `(() => {
  const hud = document.getElementById('hud');
  if (!hud) return { missing: true };
  const cs = (el) => el ? getComputedStyle(el) : null;
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const pupil = hud.querySelector('.rw-reticle-pupil');
  const cilia = [...hud.querySelectorAll('.rw-reticle-cilia')];
  const petal = hud.querySelector('.rw-petal');
  const selfRail = hud.querySelector('.rw-combat-self');
  const tgtRail = hud.querySelector('.rw-combat-target');
  const reticle = hud.querySelector('.rw-reticle');
  const after = reticle ? getComputedStyle(reticle, '::after') : null;
  const matchBefore = hud.querySelector('.rw-match-lamp')
    ? getComputedStyle(hud.querySelector('.rw-match-lamp'), '::before') : null;
  const bodyText = (hud.innerText || '');
  const words = ['FORE', 'AFT', 'RANGE', 'MATCH', 'LEAD', 'SCREEN', 'SHELL', 'WPN'];
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const selfTopPct = selfRail ? (selfRail.getBoundingClientRect().top / vh) * 100 : null;
  const midX = vw / 2;
  const selfBox = box(selfRail);
  const tgtBox = box(tgtRail);
  const selfOffset = selfBox ? +(midX - selfBox.x - selfBox.w).toFixed(1) : null;
  const tgtOffset = tgtBox ? +(tgtBox.x - midX).toFixed(1) : null;
  return {
    family: hud.dataset.family || hud.getAttribute('data-family'),
    childCount: hud.childElementCount,
    viewport: { w: vw, h: vh },
    pupilDisplay: pupil ? cs(pupil).display : null,
    ciliaDisplay: cilia.map((c) => cs(c).display),
    irisVisible: !!(pupil && cs(pupil).display !== 'none'),
    ciliaVisible: cilia.some((c) => cs(c).display !== 'none'),
    afterContent: after?.content || null,
    afterAnim: after?.animationName || null,
    afterBg: (after?.backgroundImage || '').slice(0, 160),
    afterMask: (after?.maskImage || after?.webkitMaskImage || '').slice(0, 220),
    afterInset: after ? { t: after.top, r: after.right, b: after.bottom, l: after.left } : null,
    petal: petal ? {
      w: cs(petal).width,
      h: cs(petal).height,
      radius: cs(petal).borderRadius,
      transform: cs(petal).transform,
    } : null,
    selfRailCss: selfRail ? { top: cs(selfRail).top, left: cs(selfRail).left, transform: cs(selfRail).transform } : null,
    tgtRailCss: tgtRail ? { top: cs(tgtRail).top, left: cs(tgtRail).left, transform: cs(tgtRail).transform } : null,
    selfBox,
    tgtBox,
    selfTopPct: selfTopPct != null ? +selfTopPct.toFixed(2) : null,
    selfOffsetPx: selfOffset,
    tgtOffsetPx: tgtOffset,
    words: Object.fromEntries(words.map((w) => [w, bodyText.includes(w)])),
    matchBefore: matchBefore ? {
      content: matchBefore.content,
      display: matchBefore.display,
      w: matchBefore.width,
      h: matchBefore.height,
    } : null,
    persist: localStorage.getItem('rw-hud-family'),
    override: sessionStorage.getItem('rw-hud-family'),
  };
})()`;

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
  await flatSend('Emulation.setDeviceMetricsOverride', {
    width: 1600, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await flatSend('Page.navigate', { url: appUrl });

  for (let i = 0; i < 30; i++) {
    await delay(500);
    const probe = await flatSend('Runtime.evaluate', {
      expression: `({ href: location.href, kids: document.getElementById('hud')?.childElementCount ?? -1, btn: !!document.querySelector('[data-title-action="new"]'), fatal: document.getElementById('fatal')?.textContent || '', bodyLen: document.body ? document.body.innerHTML.length : -1 })`,
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
      expression: `({ originOpen: /who are you/i.test(document.body.innerText || '') })`,
      returnByValue: true,
    });
    log(`origin-wait ${i}: ${JSON.stringify(st.result?.value)}`);
    if (st.result?.value && !st.result.value.originOpen) break;
  }
  await delay(800);

  const before = await flatSend('Runtime.evaluate', {
    expression: MEASURE,
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
      expression: MEASURE,
      returnByValue: true,
    });
    log(`override-wait ${i}: ${JSON.stringify(after.result?.value)}`);
    if (after.result?.value?.family === 'mech') break;
  }

  const shot2 = await flatSend('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(here, 'browser-mech.png'), Buffer.from(shot2.data, 'base64'));
  log('wrote browser-mech.png');

  await flatSend('Runtime.evaluate', {
    expression: `sessionStorage.removeItem('rw-hud-family')`,
    returnByValue: true,
  });
  let cleared = { result: { value: null } };
  for (let i = 0; i < 12; i++) {
    await delay(250);
    cleared = await flatSend('Runtime.evaluate', {
      expression: MEASURE,
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
