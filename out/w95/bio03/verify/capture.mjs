/**
 * BIO-03 verify live capture. Vite 5176, Chrome CDP 9413, swiftshader.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VITE_PORT = 5176;
const CDP_PORT = 9413;
const APP = `http://127.0.0.1:${VITE_PORT}/`;
const PROFILE = join(here, 'chrome-profile');
const stills = join(here, 'stills');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    try { child.kill(); } catch {}
  }
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    this.console = [];
    this.sessionId = null;
    this.ws.addEventListener('message', (ev) => {
      let msg = JSON.parse(ev.data);
      if (msg.method === 'Target.receivedMessageFromTarget' && msg.params?.message) {
        msg = JSON.parse(msg.params.message);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const t = msg.params?.type;
        const text = (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        this.console.push({ type: t, text });
        if (t === 'error' || t === 'warning') say('CONSOLE', t, text.slice(0, 240));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params?.exceptionDetails?.text
          || msg.params?.exceptionDetails?.exception?.description
          || 'exception';
        say('EXC', String(text).slice(0, 240));
      }
      if (msg.method && this.events.has(msg.method)) {
        const waiters = this.events.get(msg.method);
        this.events.delete(msg.method);
        for (const w of waiters) w(msg.params);
      }
      if (msg.id == null) return;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    });
  }
  ready() {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 60000) {
    const id = ++this.id;
    const body = { id, method, params };
    if (this.sessionId) body.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout ' + method));
        }
      }, timeoutMs);
      this.ws.send(JSON.stringify(body));
    });
  }
  waitEvent(method, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const arr = this.events.get(method) || [];
      const timer = setTimeout(() => reject(new Error('event timeout ' + method)), timeoutMs);
      arr.push((params) => { clearTimeout(timer); resolve(params); });
      this.events.set(method, arr);
    });
  }
  async eval(expression, awaitPromise = true, timeoutMs = 60000) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise,
    }, timeoutMs);
    if (r?.exceptionDetails) {
      throw new Error(r.exceptionDetails.text || r.exceptionDetails.exception?.description || 'eval');
    }
    return r?.result?.value;
  }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    await writeFile(path, Buffer.from(r.data, 'base64'));
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitHttp(url, tries = 120) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status === 200) {
        const txt = await res.text();
        if (txt.includes('src/main.js') || txt.includes('id="app"')) return true;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error('HTTP not ready: ' + url);
}

await mkdir(stills, { recursive: true });
await mkdir(PROFILE, { recursive: true });

const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const viteLog = await open(join(here, 'vite.log'), 'w');
const vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(VITE_PORT), '--strictPort'], {
  cwd: root, shell: false, stdio: ['ignore', viteLog.fd, viteLog.fd],
  env: { ...process.env, BROWSER: 'none' },
});
say('VITE pid', vite.pid);
await waitHttp(APP);
say('VITE ready');

const chromeBuf = [];
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${CDP_PORT}`,
  '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${PROFILE}`,
  '--remote-allow-origins=*',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu-sandbox',
  '--window-size=1600,900',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-extensions',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--headless=new',
  '--hide-crash-restore-bubble',
  '--disable-session-crashed-bubble',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
chrome.stdout.on('data', (b) => chromeBuf.push(String(b)));
chrome.stderr.on('data', (b) => chromeBuf.push(String(b)));
say('CHROME pid', chrome.pid);

let browserWs = null;
for (let i = 0; i < 40; i++) {
  try {
    const ver = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (ver.ok) {
      const info = await ver.json();
      browserWs = info.webSocketDebuggerUrl;
      if (browserWs) break;
    }
  } catch {}
  await sleep(250);
}
if (!browserWs) throw new Error('no browser websocket');
say('BROWSER ws', browserWs);

const cdp = new Cdp(browserWs);
await cdp.ready();
await cdp.send('Target.setDiscoverTargets', { discover: true });
const created = await cdp.send('Target.createTarget', { url: APP });
const targetId = created.targetId;
say('TARGET', targetId);
const attached = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
cdp.sessionId = attached.sessionId;
say('SESSION', cdp.sessionId);
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { sessionStorage.setItem('rimward-title-skip','1'); localStorage.removeItem('rimward-save-v1'); } catch (e) {}`,
});
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 1600, height: 900, deviceScaleFactor: 1, mobile: false,
});
const hrefNow = await cdp.eval('location.href').catch(() => '');
say('HREF0', hrefNow);
if (!String(hrefNow).includes(String(VITE_PORT))) {
  const loaded = cdp.waitEvent('Page.loadEventFired', 20000).catch((e) => { say('LOAD', e.message); return null; });
  await cdp.send('Page.navigate', { url: APP }, 60000).catch((e) => say('NAV', e.message));
  await loaded;
}
for (let i = 0; i < 80; i++) {
  const has = await cdp.eval('typeof window.__ctx === "object" && window.__ctx != null').catch(() => false);
  if (has) break;
  await sleep(500);
}
say('HREF', await cdp.eval('location.href').catch((e) => e.message));
const boot = await cdp.eval(`({
  ctx: typeof window.__ctx === "object" && window.__ctx != null,
  title: !!document.getElementById('rw-title'),
  newLabel: document.getElementById('rw-title-new') && document.getElementById('rw-title-new').textContent,
  ready: document.readyState,
  fatal: (document.getElementById('fatal') && document.getElementById('fatal').textContent || '').slice(0, 300),
})`).catch((e) => ({ err: e.message }));
say('BOOT', JSON.stringify(boot));
for (let i = 0; i < 40 && !(boot && boot.ctx); i++) {
  await sleep(500);
  const has = await cdp.eval('typeof window.__ctx === "object" && window.__ctx != null').catch(() => false);
  if (has) { boot.ctx = true; say('CTX late', i); break; }
}
if (boot && boot.title) {
  await cdp.eval(`document.getElementById('rw-title-new')?.click()`);
  await sleep(400);
  const again = await cdp.eval(`document.getElementById('rw-title-new')?.textContent || ''`);
  if (/CONFIRM/i.test(again || '')) {
    await cdp.eval(`document.getElementById('rw-title-new')?.click()`);
    await sleep(2500);
  }
  await sleep(1500);
}
await sleep(1500);
await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true }))`).catch(() => {});
await sleep(800);
await cdp.screenshot(join(stills, '01-starter-living.png'));

const playerProbe = await cdp.eval(`(() => {
  const ctx = window.__ctx;
  if (!ctx) return { err: 'no ctx' };
  const p = ctx.player;
  const obj = (ctx.ship && ctx.ship.object) || (p && p.object);
  let verts = 0;
  let names = [];
  if (obj && obj.traverse) {
    obj.traverse((c) => {
      if (c.isMesh && c.geometry && c.geometry.attributes && c.geometry.attributes.position) {
        verts += c.geometry.attributes.position.count;
        names.push(c.name || c.type);
      }
    });
  }
  return {
    hullKind: p && p.hullKind,
    faction: p && p.faction,
    classKey: p && p.classKey,
    living: !!(ctx.ship && ctx.ship.living),
    hullPath: ctx.ship && ctx.ship.hullPath,
    verts,
    names: names.slice(0, 8),
    hasSwimUniforms: !!(obj && obj.userData && obj.userData.swimUniforms),
    sys: ctx.world && ctx.world.currentSystem,
  };
})()`);
say('PLAYER', JSON.stringify(playerProbe));

const hasModels = await cdp.eval(`!!(window.__ctx && window.__ctx.models && window.__ctx.models.open)`).catch(() => false);
say('HAS_MODELS', hasModels);
if (hasModels) {
  await cdp.eval(`window.__ctx.models.open()`);
  await sleep(800);
  const click = async (substr) => {
    const ok = await cdp.eval(`(() => {
      const btns = [...document.querySelectorAll('.rw-models-entry')];
      const btn = btns.find((b) => (b.textContent || '').includes(${JSON.stringify(substr)}));
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    for (let i = 0; i < 80; i++) {
      const t = await cdp.eval(`(document.querySelector('.rw-models') && document.querySelector('.rw-models').innerText) || ''`);
      if (t && !/Loading asset/i.test(t)) return { ok, loading: false, text: String(t).slice(0, 180) };
      await sleep(250);
    }
    const t = await cdp.eval(`(document.querySelector('.rw-models') && document.querySelector('.rw-models').innerText) || ''`);
    return { ok, loading: /Loading asset/i.test(t || ''), text: String(t).slice(0, 180) };
  };
  const playerShot = await click('Player — Living Hull');
  say('MODELS player', JSON.stringify(playerShot));
  await cdp.screenshot(join(stills, '02-models-player.png'));
  const lightShot = await click('Beautiful Ones — Light');
  say('MODELS light', JSON.stringify(lightShot));
  await cdp.screenshot(join(stills, '03-models-beautiful-light.png'));
  await cdp.eval(`window.__ctx.models.close()`);
}

let npcProbe = null;
try {
  npcProbe = await cdp.eval(`(async () => {
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    const { buildShipMesh, animateShipMesh } = await import('/src/systems/npc.js');
    await primeShipAsset('beautiful', 'light', 'trader');
    const obj = buildShipMesh('light', 'beautiful', 'trader');
    const glow = obj.userData.glow;
    let mesh = false;
    glow?.traverse?.((c) => { if (c.isMesh) mesh = true; });
    if (glow?.isMesh) mesh = true;
    const uniforms = obj.userData.swimUniforms;
    animateShipMesh(obj, 0.016, false, null, 0);
    const idleHz = uniforms?.uSwimHz?.value;
    animateShipMesh(obj, 0.016, false, null, 120);
    const cruiseHz = uniforms?.uSwimHz?.value;
    return {
      name: obj.name,
      glowType: glow?.type || null,
      glowHasMesh: mesh,
      idleHz, cruiseHz,
      hasSwim: !!uniforms,
    };
  })()`, true, 90000);
  say('NPC probe', JSON.stringify(npcProbe));
} catch (e) {
  say('NPC probe fail', e.message);
}

await cdp.eval(`window.__ctx.emit('jumpRequested', { to: 'bt_cradle' })`);
await sleep(8000);
await cdp.screenshot(join(stills, '09-cradle-traffic.png'));
const traffic = await cdp.eval(`(() => {
  const ctx = window.__ctx;
  const ships = ctx.ships || [];
  const beautiful = ships.filter((s) => s.state?.faction === 'beautiful');
  return {
    sys: ctx.world && ctx.world.currentSystem,
    nShips: ships.length,
    nBeautiful: beautiful.length,
    sample: beautiful.slice(0, 8).map((s) => {
      const u = s.object?.userData?.swimUniforms;
      const glow = s.object?.userData?.glow;
      let mesh = false;
      glow?.traverse?.((c) => { if (c.isMesh) mesh = true; });
      if (glow?.isMesh) mesh = true;
      return {
        classKey: s.state?.classKey,
        glowType: glow?.type || null,
        glowMesh: mesh,
        hasSwim: !!u,
        hz: u?.uSwimHz?.value ?? null,
      };
    }),
  };
})()`);
say('TRAFFIC', JSON.stringify(traffic));

await writeFile(join(here, 'capture-log.txt'), log.join('\n') + '\n');
await writeFile(join(here, 'probes.json'), JSON.stringify({ playerProbe, npcProbe, traffic }, null, 2));
await writeFile(join(here, 'chrome.log'), chromeBuf.join(''));
cdp.close();
killTree(chrome);
killTree(vite);
await viteLog.close();
say('DONE');
