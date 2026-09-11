/** Issue #102 live solar observation and real-frame damage verification.
 * Isolated loopback Vite/CDP, separate temporary profile, own-process cleanup.
 * Public handle starts Greenhand, observes Freehold and engages a Veridian route.
 * Privileged setup positions the player and zeros exposed motion in the outer heat shell,
 * then outside it. Solar damage, events and timestamps come from real frames.
 * Run: npm run test:solar-hazards-live.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE102_OUT || join(repo, 'out', 'issue-102-evidence', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE102_CHROME || process.env.CHROME_PATH;
  if (named) return named;
  const candidates = WIN
    ? [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ]
    : [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
    ];
  for (const c of candidates) if (existsSync(c)) return c;
  return WIN ? 'chrome.exe' : 'google-chrome';
}

const CHROME = findChrome();
const PROFILE_ROOT = resolvePath(process.env.ISSUE102_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue102-solar-';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const PINS = ['startup-sun', 'freehold-route', 'solar-damage', 'clear-after-exit'];
const results = { pins: {}, consoleErrors: [], exceptions: [], privilegedFixture:
  'Player positioned in outer live heat shell, then outside; exposed velocity/speed/throttle zeroed, while live flight may continue to settle. No damage, events, time, sun geometry or outcome flags are fabricated.' };
function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1400));
}

async function killTree(child) {
  if (!child?.pid) return;
  if (WIN) {
    const stopped = await new Promise((resolve) => {
      try {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
        killer.once('error', () => resolve(false));
        killer.once('exit', (code) => resolve(code === 0 || child.exitCode != null));
      } catch { resolve(false); }
    });
    if (stopped) return;
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); return; } catch { /* gone */ }
  }
  try { child.kill('SIGKILL'); } catch { /* already gone */ }
}

/** Reserve an unused loopback port for this run only. */
async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  return port;
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.console = [];
    this.exceptions = [];
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params?.type || 'log';
        const text = (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        this.console.push({ type, text });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params?.exceptionDetails;
        const text = d?.exception?.description || d?.text || 'exception';
        this.exceptions.push(String(text));
        say('EXC', String(text).slice(0, 300));
      }
      if (msg.id == null) return;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    });
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 45000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout ' + method));
        }
      }, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
      const settle = (fn) => (value) => { clearTimeout(timer); fn(value); };
      this.pending.set(id, { resolve: settle(resolve), reject: settle(reject) });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 45000) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    }, timeoutMs);
    if (r?.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval');
    }
    return r?.result?.value;
  }
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    await writeFile(join(outDir, name), Buffer.from(r.data, 'base64'));
    say('SHOT', name);
  }
  close() { try { this.ws.close(); } catch { /* closed */ } }
}

const act = (name, args) => `(() => JSON.stringify(window.rimward.act({ v: 2, name: ${JSON.stringify(name)}, args: ${JSON.stringify(args || {})} })))()`;

async function main() {
  await mkdir(PROFILE_ROOT, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const port = await availablePort();
  const profile = await mkdtemp(join(PROFILE_ROOT, PROFILE_PREFIX));
  const app = `http://127.0.0.1:${port}/?agent=1`;
  results.port = port;
  results.profile = profile;
  let vite = null;
  let chrome = null;
  let cdp = null;
  const chromeErr = [];

  try {
    // ---- Vite (harness-only overrides; see the header) ---------------------
    const VITE_BOOT = [
      "import { createServer } from 'vite';",
      'const server = await createServer({',
      '  root: process.cwd(),',
      '  optimizeDeps: { noDiscovery: true, include: [] },',
      "  server: { host: '127.0.0.1', port: Number(process.argv[1]), strictPort: true, watch: null },",
      '});',
      'await server.listen();',
      'server.printUrls();',
    ].join('\n');
    vite = spawn(
      process.execPath,
      ['--input-type=module', '-e', VITE_BOOT, String(port)],
      { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true },
    );
    vite.stdout.on('data', (b) => say('vite', String(b).trim().slice(0, 160)));
    vite.stderr.on('data', (b) => say('vite!', String(b).trim().slice(0, 160)));
    let up = false;
    for (let i = 0; i < 100; i++) {
      up = await fetch(`http://127.0.0.1:${port}/`).then((r) => r.ok).catch(() => false);
      if (up) break;
      if (vite.exitCode != null) break;
      await sleep(300);
    }
    if (!up) throw new Error(`vite ${port} not serving`);
    say('vite up', port);

    // ---- Chrome ------------------------------------------------------------
    chrome = spawn(CHROME, [
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check',
      // Platform GPU, as the issue #99 / #100 / #11 probes use.
      '--ignore-gpu-blocklist', '--enable-webgl',
      '--disable-extensions', '--disable-background-networking',
      '--disable-component-update', '--disable-sync',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--window-size=1440,900',
      '--headless=new',
      '--hide-crash-restore-bubble', '--disable-session-crashed-bubble',
      '--no-sandbox',
      ...(WIN ? [] : ['--disable-dev-shm-usage']),
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true });
    chrome.stderr.on('data', (b) => chromeErr.push(String(b).trim().slice(0, 200)));
    say('chrome', CHROME, 'pid', chrome.pid, 'profile', profile);

    let pageWs = null;
    let cdpPort = null;
    for (let i = 0; i < 160; i++) {
      try {
        const active = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
        const parsed = Number(active.split(/\r?\n/, 1)[0]);
        if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('invalid DevToolsActivePort');
        cdpPort = parsed;
        const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
        const page = list.find((t) => t.type === 'page');
        if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
      } catch { /* not up yet */ }
      if (chrome.exitCode != null) break;
      await sleep(250);
    }
    results.cdpPort = cdpPort;
    if (!pageWs) throw new Error(`CDP page not ready: ${chromeErr.slice(-3).join(' | ')}`);
    cdp = new Cdp(pageWs);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: app });

    const waitUntil = async (expr, pred, ms = 8000, step = 150) => {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        try { last = await cdp.eval(expr); } catch (err) { last = { evalError: String(err?.message || err) }; }
        try { if (pred(last)) return last; } catch { /* keep polling */ }
        await sleep(step);
      }
      return last;
    };

    // ---- Boot into flight through the PUBLIC handle ------------------------
    const handle = await waitUntil('!!window.rimward', (v) => v === true, 60000, 300);
    if (handle !== true) {
      throw new Error('issue102 boot: window.rimward never appeared within 60000ms; last=' + JSON.stringify(handle));
    }
    const phaseOf = `(() => { const o = window.rimward.observe(); return o.session ? o.session.phase : null; })()`;
    let phase = await waitUntil(phaseOf, (v) => typeof v === 'string', 20000, 250);
    say('phase', String(phase));
    if (phase === 'title') {
      say('startGame', await cdp.eval(act('startGame')));
      phase = await waitUntil(phaseOf, (v) => v !== 'title', 20000, 250);
      say('phase', String(phase));
    }
    if (phase === 'origin') {
      say('chooseOrigin', await cdp.eval(act('chooseOrigin', { id: 'greenhand' })));
    }
    phase = await waitUntil(phaseOf, (v) => v === 'playing', 30000, 300);
    if (phase !== 'playing') throw new Error(`issue102 boot: session phase stuck at ${JSON.stringify(phase)}`);
    await waitUntil(`(() => {
      const c = window.__ctx;
      return !!(c?.ship?.object && c.world.origin && c.flags.paused === false && (c.world.time || 0) > 1);
    })()`, (v) => v === true, 30000, 300);

    results.graphics = await cdp.eval(`(() => {
      const canvas = document.querySelector('canvas');
      const g = canvas && canvas.getContext('webgl2');
      if (!g) return null;
      const e = g.getExtension('WEBGL_debug_renderer_info');
      return {
        renderer: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER),
        vendor: e ? g.getParameter(e.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR),
      };
    })()`);
    results.boot = await cdp.eval(`(() => {
      const c = window.__ctx;
      return {
        hasCtx: !!c,
        origin: c?.world?.origin || null,
        sys: c?.world?.currentSystem || null,
        docked: !!c?.flags?.docked,
        agentOptIn: !!c?.agent?.optIn,
      };
    })()`);
    say('boot', JSON.stringify(results.boot), 'gpu', JSON.stringify(results.graphics));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (!results.boot?.origin) throw new Error('no origin after chooseOrigin');

    const observe = 'window.rimward.observe()';
    const initial = await cdp.eval(observe);
    const sun = initial.hazards?.sun;
    record('startup-sun', initial.world.currentSystem === 'freehold'
      && sun?.radius === 60 && sun.heatRadius === 144
      && Math.abs(sun.lethalRadius - 67.2) < 1e-9 && sun.zone === 'clear', { sun, system: initial.world.currentSystem });
    await cdp.shot('01-freehold-observation.png');
    const plot = JSON.parse(await cdp.eval(act('plotRoute', { dest: 'veridian' })));
    const engage = JSON.parse(await cdp.eval(act('engageAutopilot')));
    const route = await waitUntil(observe, o => o.autopilot?.engaged === true, 3000);
    record('freehold-route', plot.ok && engage.ok && route.autopilot?.engaged
      && route.nav?.dest === 'veridian' && route.hazards?.sun?.zone === 'clear', { plot, engage, nav: route.nav, autopilot: route.autopilot, sun: route.hazards?.sun });
    say('cancelAutopilot', await cdp.eval(act('cancelAutopilot')));
    const fixture = await cdp.eval(`(() => {
      const c = window.__ctx, sun = window.rimward.observe().hazards.sun;
      c.ship.object.position.set(sun.position[0] + sun.heatRadius - 8, sun.position[1], sun.position[2]);
      c.ship.velocity.set(0,0,0); c.ship.speed = 0; c.input.throttle = 0;
      return window.rimward.observe();
    })()`);
    const hot = await waitUntil(observe, o => o.ship.screen < fixture.ship.screen
      && o.events.some(e => e.type === 'sunHeat' && e.t > fixture.t), 8000);
    const heatEvent = hot.events.find(e => e.type === 'sunHeat');
    record('solar-damage', hot.hazards?.sun?.zone === 'heat'
      && hot.ship.screen < fixture.ship.screen && heatEvent?.reason === 'sun'
      && heatEvent.t > fixture.t && heatEvent.t <= hot.t
      && heatEvent.intensity > 0 && heatEvent.dps > 0 && hot.ship.heat === 0,
      { before: { t: fixture.t, screen: fixture.ship.screen }, after: { t: hot.t, screen: hot.ship.screen, weaponHeat: hot.ship.heat }, sun: hot.hazards?.sun, event: heatEvent });
    await cdp.shot('02-real-solar-damage.png');
    const exitBaseline = await cdp.eval(`(() => {
      const c = window.__ctx, sun = window.rimward.observe().hazards.sun;
      c.ship.object.position.set(sun.position[0] + sun.heatRadius + 100, sun.position[1], sun.position[2]);
      c.ship.velocity.set(0,0,0); c.ship.speed = 0; c.input.throttle = 0;
      return window.rimward.observe();
    })()`);
    await sleep(3100);
    const clear = await cdp.eval(observe);
    const lastHeat = clear.events.find(e => e.type === 'sunHeat');
    record('clear-after-exit', clear.hazards?.sun?.zone === 'clear'
      && clear.hazards.sun.heatDps === 0 && clear.ship.screen >= exitBaseline.ship.screen
      && lastHeat?.t === heatEvent?.t,
      { sun: clear.hazards?.sun, exitBaseline: { t: exitBaseline.t, screen: exitBaseline.ship.screen }, screen: clear.ship.screen, lastHeat });
    await cdp.shot('03-clear-after-exit.png');
  } catch (err) {
    say('ERROR', err?.stack || String(err));
    results.error = String(err?.message || err);
  } finally {
    // Diagnostics are written on EVERY exit: a failed run is exactly when the
    // console, the exceptions and Chrome's stderr have to survive.
    results.chromeStderr = chromeErr.slice(-12);
    if (cdp) {
      results.consoleErrors = cdp.console.filter((c) => c.type === 'error' || c.type === 'assert');
      results.exceptions = cdp.exceptions;
      try {
        await writeFile(join(outDir, 'console.txt'),
          cdp.console.map((c) => `[${c.type}] ${c.text}`).join('\n')
          + '\n\n--- exceptions ---\n' + cdp.exceptions.join('\n')
          + '\n\n--- chrome stderr ---\n' + chromeErr.join('\n') + '\n', 'utf8');
      } catch { /* diagnostics must not mask the real failure */ }
      if (results.error) {
        try { await cdp.shot('99-failure.png'); } catch { /* page may be gone */ }
        try {
          const dom = await cdp.eval(`(() => {
            const fatal = document.getElementById('fatal');
            return {
              url: location.href,
              readyState: document.readyState,
              phase: (() => { try { return window.rimward.observe().session.phase; } catch (e) { return 'no-handle'; } })(),
              hasCtx: !!window.__ctx,
              canvases: document.querySelectorAll('canvas').length,
              fatalText: fatal ? (fatal.textContent || '').slice(0, 1500) : null,
              bodyText: (document.body ? document.body.innerText : '').slice(0, 3000),
            };
          })()`, 15000);
          await writeFile(join(outDir, 'failure-dom.json'), JSON.stringify(dom, null, 2), 'utf8');
        } catch (dumpErr) {
          say('failure-dom unavailable', String(dumpErr?.message || dumpErr).slice(0, 400));
        }
      }
      cdp.close();
    }
    // Only this run's own processes and its own profile directory are removed.
    await killTree(chrome);
    await killTree(vite);
    try {
      if (profile) {
        const target = resolvePath(profile);
        const leaf = basename(target);
        if (relative(PROFILE_ROOT, target) === leaf && leaf.startsWith(PROFILE_PREFIX)) {
          await rm(target, { recursive: true, force: true, maxRetries: 5 });
        } else {
          say('profile left in place (outside the temp scope)', target);
        }
      }
    } catch (rmErr) {
      say('profile cleanup incomplete', String(rmErr?.message || rmErr).slice(0, 300));
    }
    await writeFile(join(outDir, 'run.log'), log.join('\n') + '\n', 'utf8');
    const entries = Object.entries(results.pins);
    console.log('\n' + entries.map(([k, v]) => `${v.pass ? 'PASS' : 'FAIL'}  ${k}`).join('\n'));
    console.log('console errors:', results.consoleErrors.length, 'exceptions:', results.exceptions.length);
    const failed = entries.filter(([, v]) => !v.pass).map(([k]) => k);
    const missing = PINS.filter((k) => !results.pins[k]);
    const reasons = [];
    if (results.error) reasons.push(`harness error: ${results.error}`);
    if (missing.length) reasons.push(`pin not reached: ${missing.join(', ')}`);
    if (failed.length) reasons.push(`pin failed: ${failed.join(', ')}`);
    if (results.consoleErrors.length) reasons.push(`console errors: ${results.consoleErrors.length}`);
    if (results.exceptions.length) reasons.push(`uncaught exceptions: ${results.exceptions.length}`);
    results.verdict = reasons.length ? 'FAIL' : 'PASS';
    results.reasons = reasons;
    await writeFile(join(outDir, 'result.json'), JSON.stringify(results, null, 2), 'utf8');
    if (reasons.length) {
      console.log('\nISSUE-102 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-102 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
