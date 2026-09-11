/** Issue #103 live raw-control throttle persistence, in a real browser.
 * Isolated loopback Vite/CDP, separate temporary profile, own-process cleanup.
 * The public handle starts Greenhand, launches, and drives only through
 * window.rimward.act / observe against real animation frames.
 * One disclosed __ctx fixture re-applies the runtime's own spawn orientation
 * before any thrust — Object3D.lookAt() aims local +Z at the point and this
 * hull's nose is local -Z (src/systems/ship.js), so looking AT the sun puts the
 * nose outward — and the measured nose-dot-outward is recorded as evidence. The
 * probe never writes throttle, speed, position, time or lease state.
 * Run: npm run test:throttle-observability-live.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE103_OUT || join(repo, 'out', 'issue-103-evidence', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE103_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.ISSUE103_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue103-throttle-';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

// A deliberately modest cruise setpoint: enough thrust to prove persistence,
// far short of a full-speed runaway, and always aimed away from the star.
const CRUISE = 0.35;
const HOLD = 0.5;

const PINS = ['launched-clear', 'active-ramp', 'expiry-persists', 'clear-does-not-brake', 'commanded-zero-stops'];
const results = {
  pins: {}, consoleErrors: [], exceptions: [],
  privilegedFixture:
    'One __ctx fixture only: ctx.ship.object.lookAt(sunPosition) before the first thrust. Object3D.lookAt() points local +Z at the argument and this hull\'s nose is local -Z (src/systems/ship.js), so this is the same call the runtime makes at spawn and it leaves the nose pointing AWAY from the star; a persistent setpoint therefore cannot run toward it. The resulting nose-dot-outward is measured from the live quaternion and recorded as noseAim.dotOutward (1 = exactly outward). No throttle, speed, position, world time, lease, event or flag value is written or fabricated; every reading below comes from window.rimward.observe() across real frames.',
};
function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1600));
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

/**
 * Sample the public observation once per real animation frame. Read-only: the
 * page-side collector only calls observe() and copies primitives out.
 */
const samplerFor = (ms) => `(() => new Promise((resolve) => {
  const rows = [];
  const stop = performance.now() + ${JSON.stringify(ms)};
  const step = () => {
    const o = window.rimward.observe();
    rows.push({
      t: o.t,
      throttle: o.ship.throttle,
      speed: o.ship.speed,
      fullStop: o.flags.fullStop,
      state: o.control.state,
      owner: o.control.owner,
      reason: o.control.reason,
      sunDistance: o.hazards && o.hazards.sun ? o.hazards.sun.distance : null,
      sunZone: o.hazards && o.hazards.sun ? o.hazards.sun.zone : null,
    });
    if (performance.now() >= stop) resolve(rows);
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}))()`;

const trim = (rows) => ({
  frames: rows.length,
  first: rows[0] || null,
  last: rows[rows.length - 1] || null,
  minThrottle: rows.length ? Math.min(...rows.map((r) => r.throttle)) : null,
  maxThrottle: rows.length ? Math.max(...rows.map((r) => r.throttle)) : null,
  minSunDistance: rows.length ? Math.min(...rows.map((r) => (r.sunDistance == null ? Infinity : r.sunDistance))) : null,
  zones: [...new Set(rows.map((r) => r.sunZone))],
  states: [...new Set(rows.map((r) => r.state))],
});

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
      // Platform GPU, as the issue #99 / #100 / #102 / #11 probes use.
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
      throw new Error('issue103 boot: window.rimward never appeared within 60000ms; last=' + JSON.stringify(handle));
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
    if (phase !== 'playing') throw new Error(`issue103 boot: session phase stuck at ${JSON.stringify(phase)}`);
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
    say('gpu', JSON.stringify(results.graphics));

    // ---- Leave the berth through the ordinary public verb -------------------
    let obs = await cdp.eval('window.rimward.observe()');
    results.boot = { system: obs.world.currentSystem, docked: obs.flags.docked, throttle: obs.ship.throttle, agentOptIn: obs.agentOptIn };
    say('boot', JSON.stringify(results.boot));
    if (obs.flags.docked === true) {
      say('undock', await cdp.eval(act('undock')));
      obs = await waitUntil('window.rimward.observe()', (o) => o && o.flags && o.flags.docked === false, 20000, 250);
    }
    // Every lease is refused while docked or berth-held, and act() refuses
    // everything without the agent opt-in. Clear both gates before any command.
    const gate = await waitUntil('window.rimward.observe()',
      (o) => o && o.flags && o.flags.docked === false && o.flags.berthHold === false && o.agentOptIn === true,
      20000, 250);
    results.gate = { docked: gate?.flags?.docked, berthHold: gate?.flags?.berthHold, agentOptIn: gate?.agentOptIn };
    say('gate', JSON.stringify(results.gate));
    if (gate?.agentOptIn !== true) throw new Error('issue103: agent opt-in never set; act() would refuse with opt-in');
    if (gate?.flags?.docked !== false || gate?.flags?.berthHold !== false) {
      throw new Error('issue103: still docked or berth-held; setControl would refuse with docked/held');
    }
    // Disclosed fixture: re-apply the runtime's own spawn orientation. lookAt()
    // aims local +Z at the sun, and the nose is local -Z, so the nose ends up
    // pointing away from the star. The dot product is measured, not assumed.
    const aimed = await cdp.eval(`(() => {
      const c = window.__ctx, before = window.rimward.observe();
      const s = before.hazards && before.hazards.sun ? before.hazards.sun.position : null;
      const p = c.ship.object.position;
      if (s) c.ship.object.lookAt(s[0], s[1], s[2]);
      // Nose = local -Z rotated by the live quaternion; the hull root is a
      // direct scene child, so this is already the world direction.
      const q = c.ship.object.quaternion;
      const vx = 0, vy = 0, vz = -1;
      const tx = 2 * (q.y * vz - q.z * vy);
      const ty = 2 * (q.z * vx - q.x * vz);
      const tz = 2 * (q.x * vy - q.y * vx);
      const fx = vx + q.w * tx + (q.y * tz - q.z * ty);
      const fy = vy + q.w * ty + (q.z * tx - q.x * tz);
      const fz = vz + q.w * tz + (q.x * ty - q.y * tx);
      let dot = null;
      if (s) {
        const dx = p.x - s[0], dy = p.y - s[1], dz = p.z - s[2];
        const len = Math.hypot(dx, dy, dz);
        if (len > 0) dot = (fx * dx + fy * dy + fz * dz) / len;
      }
      return { hasSun: !!s, noseDotOutward: dot, nose: [fx, fy, fz], obs: window.rimward.observe() };
    })()`);
    const launched = aimed.obs;
    results.noseAim = { hasSun: aimed.hasSun, dotOutward: aimed.noseDotOutward, nose: aimed.nose,
      note: 'dot of the local -Z nose with the outward radial from the live sun; 1 = exactly away from the star.' };
    say('nose aim', JSON.stringify(results.noseAim));
    record('launched-clear', launched.flags.docked === false
      && launched.ship.throttle === 0 && launched.control.owner === 'none'
      && (!launched.hazards?.sun || launched.hazards.sun.zone === 'clear')
      && (!aimed.hasSun || aimed.noseDotOutward > 0.999),
      { system: launched.world.currentSystem, docked: launched.flags.docked, berthHold: launched.flags.berthHold,
        agentOptIn: launched.agentOptIn, throttle: launched.ship.throttle,
        speed: launched.ship.speed, fullStop: launched.flags.fullStop, control: launched.control,
        noseDotOutward: aimed.noseDotOutward, sun: launched.hazards?.sun });
    await cdp.shot('01-launched-clear.png');

    // ---- 1. Active lease: the published setpoint ramps toward the target ----
    const setCruise = JSON.parse(await cdp.eval(act('setControl', { seq: 1, ttl: 5, throttle: CRUISE })));
    const ramp = trim(await cdp.eval(samplerFor(1600), 60000));
    const rampRows = ramp;
    record('active-ramp', setCruise.ok === true && setCruise.status === 'active'
      && rampRows.first && rampRows.first.throttle < CRUISE && rampRows.first.throttle >= 0
      && rampRows.last.throttle === CRUISE && rampRows.maxThrottle === CRUISE
      && rampRows.last.state === 'active' && rampRows.last.fullStop === false
      && rampRows.last.speed > 0,
      { receipt: setCruise, requested: CRUISE, sampled: rampRows });
    await cdp.shot('02-active-ramp.png');

    // ---- 2. Expiry: steering ends, the setpoint does not -------------------
    // No renewal. TTL is 5 simulation seconds from acceptance.
    const expiry = trim(await cdp.eval(samplerFor(7000), 60000));
    record('expiry-persists', expiry.last && expiry.last.state === 'expired'
      && expiry.last.reason === 'expired' && expiry.last.owner === 'none'
      && expiry.last.throttle === CRUISE && expiry.minThrottle === CRUISE
      && expiry.maxThrottle === CRUISE && expiry.last.fullStop === false
      && expiry.last.speed > 0,
      { sampled: expiry });
    await cdp.shot('03-expiry-persists.png');

    // ---- 3. clearControl: an explicit release does not brake ---------------
    const setHold = JSON.parse(await cdp.eval(act('setControl', { seq: 2, ttl: 5, throttle: HOLD })));
    const reached = await waitUntil('window.rimward.observe()', (o) => o && o.ship && o.ship.throttle === HOLD, 8000, 100);
    const cleared = JSON.parse(await cdp.eval(act('clearControl')));
    const afterClear = trim(await cdp.eval(samplerFor(3000), 60000));
    record('clear-does-not-brake', setHold.ok === true && cleared.ok === true
      && cleared.status === 'cleared' && reached?.ship?.throttle === HOLD
      && afterClear.minThrottle === HOLD && afterClear.maxThrottle === HOLD
      && afterClear.last.state === 'cleared' && afterClear.last.owner === 'none'
      && afterClear.last.fullStop === false && afterClear.last.speed > 0,
      { setHold, cleared, requested: HOLD, sampled: afterClear });
    await cdp.shot('04-clear-does-not-brake.png');

    // ---- 4. The supported stop: command zero, let frames apply it ----------
    const setZero = JSON.parse(await cdp.eval(act('setControl', { seq: 3, ttl: 5, throttle: 0 })));
    const zeroing = trim(await cdp.eval(samplerFor(1500), 60000));
    const confirm = await cdp.eval('window.rimward.observe()');
    const releasedAfterStop = JSON.parse(await cdp.eval(act('clearControl')));
    const held = trim(await cdp.eval(samplerFor(4000), 60000));
    record('commanded-zero-stops', setZero.ok === true && releasedAfterStop.ok === true
      && zeroing.last.throttle === 0 && zeroing.last.fullStop === true
      && confirm.ship.throttle === 0 && confirm.flags.fullStop === true
      && held.minThrottle === 0 && held.maxThrottle === 0
      && held.last.fullStop === true && held.last.state === 'cleared'
      && held.last.speed < afterClear.last.speed,
      { setZero, confirm: { throttle: confirm.ship.throttle, speed: confirm.ship.speed, fullStop: confirm.flags.fullStop },
        releasedAfterStop, zeroing, held });
    await cdp.shot('05-commanded-zero-stops.png');

    results.sunSafety = {
      note: 'Minimum observed sun distance across every sampled window; the nose was aimed away before thrust (see noseAim.dotOutward).',
      ramp: rampRows.minSunDistance, expiry: expiry.minSunDistance,
      clear: afterClear.minSunDistance, stop: held.minSunDistance,
      zones: [...new Set([...rampRows.zones, ...expiry.zones, ...afterClear.zones, ...held.zones])],
    };
    say('sun safety', JSON.stringify(results.sunSafety));
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
      console.log('\nISSUE-103 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-103 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
