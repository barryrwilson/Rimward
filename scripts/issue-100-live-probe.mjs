/**
 * Issue #100 live verification — docked players cannot receive or resolve
 * surrender cards over the station desk.
 *
 * Drives the dev app in headless Chrome over CDP and checks, against the real
 * rendered station panel, the real rendered hail card and the real
 * `window.rimward` handle:
 *
 *   D1  ordinary docking     — the KeyD/approach dock press opens the REAL
 *                              station panel (no berth flag is written by hand)
 *   D2  incoming surrender    — a hull that hails while the ship is in the
 *                              berth paints no card and grants nothing
 *   D3  card closes on dock   — a surrender open in flight is gone from the DOM
 *                              after an ordinary dock, with no reward taken
 *   D4  attempts after a dock — once the berth actually holds the ship, a human
 *                              click on the retained button, a digit key,
 *                              ctx.hailApi.resolve and the public hailResolve
 *                              move nothing, and the two API paths answer
 *                              'docked'. Whether the card was still rendered at
 *                              that instant is recorded (stillUp) rather than
 *                              assumed; the synchronous still-visible race is
 *                              covered by the focused regression suite
 *   D5  stable docked token   — hailResolve answers 'docked', the same token
 *                              selectTarget gives, and discovery agrees
 *   D6  deferred hail dropped — a hail deferred behind the galaxy chart is
 *                              discarded on docking and never returns after an
 *                              ordinary launch
 *   D7  undocked unchanged    — after launch the same hull is heard again and
 *                              a bound resolve still pays the printed demand
 *
 * FIXTURES: a surrender or demand card cannot be waited for in a live session,
 * so — exactly as the issue #66 probe does — a clearly labelled controlled
 * fixture (`privilegedFixture` in the ledger) spawns the ship, parks ambient
 * traffic outside the encounter bubble, pins the player hull so the pass is
 * survivable, and emits the ordinary `hailOpened` the game itself emits.
 * DOCKING IS NOT FAKED: D1..D7 dock and launch through the real station panel
 * (the agent `dock` / `undock` verbs drive the same code the keys do), and
 * `ctx.flags.docked` is never written by the probe. Everything asserted is read
 * from the rendered DOM or the public handle. No private state is written to
 * fake an expected outcome, and no new runtime debug API is exposed.
 *
 * Run: node scripts/issue-100-live-probe.mjs
 * Output: out/issue-100/live/ (ignored path).
 *
 * Isolation: an OS-assigned loopback Vite port and an OS-assigned CDP port
 * (never the agent-bridge-smoke 5188/8877 defaults), a fresh Chrome profile
 * outside the repository, and teardown of only the processes this run spawned.
 *
 * DEV-SERVER FIXTURE: the probe starts Vite in-process through `createServer`
 * with `server: { watch: null }` and `optimizeDeps: { noDiscovery: true,
 * include: [] }` instead of running the `vite` CLI. Two distinct symptoms made
 * the page stay blank on this workspace, and both overrides are needed:
 *
 *   1. Cold dependency scan. On a cold cache the dependency-scan gate holds
 *      `/src/main.js` and `/src/core/ctx.js` (both import bare `three`) open
 *      until it times out. `noDiscovery` clears this one, and the two modules
 *      then answer HTTP 200 in well under a second.
 *   2. Watcher startup storm. An independent CPU profile (Quinn, 2026-09-10,
 *      out/issue-100/quinn-vite-profile.json) shows the Vite/chokidar watcher
 *      startup path — readdir, lstat, `_addToNodeFs`, `setFsWatchListener` —
 *      taking about 1.2 GB resident and 80 CPU seconds, which starves the
 *      server after the modules are served. `noDiscovery` alone does NOT cure
 *      this; only `watch: null` does.
 *
 * The dependency scan is therefore not the sole cause. With both overrides the
 * real browser reaches `__ctx`, `readyState: complete`, one canvas and a
 * visible title inside the first five-second sample.
 *
 * The overrides are confined to this harness: `vite.config.js`, the production
 * build and the bundle budget are untouched, and application source is served
 * exactly as written. Disabling the watcher only removes HMR, which this
 * one-shot verification never uses — the page is loaded once and never edited.
 * The only other observable difference is that `three` is delivered unbundled —
 * it is pure ESM, so the browser loads the same module graph the bundler would,
 * and every pin below is still read from the live rendered page.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE100_OUT || join(repo, 'out', 'issue-100', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE100_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.ISSUE100_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue100-docked-';
const PINS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  commit: process.env.ISSUE100_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  boot: null,
  fixtureNote: 'privilegedFixture: ship spawn, ambient parking, hull pin and hailOpened emission stage the rare card; docking and launching use the real station panel and never write ctx.flags.docked; every assertion reads the rendered DOM or window.rimward',
  devServerNote: "harness-only dev server: vite createServer with server { watch: null } and optimizeDeps { noDiscovery: true, include: [] }. Two symptoms, both overrides needed: (1) the cold-cache dependency scan holds /src/main.js and /src/core/ctx.js (both import bare three) open until it times out; (2) an independent CPU profile (out/issue-100/quinn-vite-profile.json) shows Vite/chokidar watcher startup taking ~1.2 GB and ~80 CPU seconds and starving the server afterwards. The dependency scan is not the sole cause; noDiscovery alone does not cure the watcher stall. Disabling the watcher only removes HMR, which this one-shot run never uses. App source, vite.config.js and the production bundle budget are unchanged, and three is simply served unbundled as the pure ESM it is",
  pins: {},
  consoleErrors: [],
  exceptions: [],
};

function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1200));
}

async function killTree(child) {
  if (!child?.pid) return;
  if (WIN) {
    const stopped = await new Promise((resolve) => {
      try {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
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
      // The timer is cleared as soon as the reply lands and is unref'd while it
      // waits, so a finished run never sits idle for the remaining timeout.
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

const KEY = (code, key) => `(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${key}', bubbles: true, cancelable: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${key}', bubbles: true, cancelable: true }));
  return true;
})()`;

/**
 * One synchronous read of the rendered card, the rendered station panel AND
 * the public observation, so a docking transition cannot be sampled twice at
 * two different instants.
 */
const PROBE = `(() => {
  const card = document.querySelector('.rw-hail-card');
  const root = card ? card.parentElement : null;
  const divs = card ? [...card.querySelectorAll('div')] : [];
  const leaf = divs
    .filter((d) => d.querySelectorAll('div').length === 0)
    .map((d) => (d.textContent || '').trim());
  const buttons = card
    ? [...card.querySelectorAll('button')].map((b) => (b.textContent || '').trim())
    : [];
  const rw = window.rimward || null;
  const o = rw ? rw.observe() : null;
  const c = window.__ctx;
  // The station panel is the REAL docked surface: hail.js must never paint
  // over it, so the probe reads its rendered display, not a flag.
  const panel = [...document.querySelectorAll('div')].find((d) =>
    d.style && d.style.display === 'flex' && /DEPART|LAUNCH|MARKET|BERTH/i.test(d.textContent || ''));
  return {
    card: {
      present: !!card,
      display: root ? getComputedStyle(root).display : null,
      header: leaf.find((t) => t.indexOf('HAIL —') === 0) || null,
      leaf,
      buttons,
    },
    panelVisible: !!panel,
    station: o ? !!o.station : false,
    hail: o ? o.hail : null,
    availability: o && o.availability ? o.availability.hailResolve : null,
    v: o ? o.v : null,
    handleVersion: rw ? rw.version : null,
    docked: c ? c.flags.docked === true : null,
    chartOpen: c ? c.flags.chartOpen === true : null,
    berthOpen: c ? c.flags.berthOpen === true : null,
    credits: c ? c.world.credits : null,
    fear: c ? c.world.fear : null,
    hailOpenFlag: c ? c.flags.hailOpen === true : null,
  };
})()`;

/** privilegedFixture: harness-only staging installed once on the live page. */
const SETUP = `(async () => {
  const c = window.__ctx;
  const { spawnLiveShip } = await import('/src/systems/npc.js');
  const { isShipAssetReady, primeShipAsset } = await import('/src/systems/ship-assets.js');
  const tries = [
    { faction: 'redledger', classKey: 'cutter', role: 'pirate' },
    { faction: 'independent', classKey: 'cutter', role: 'trader' },
    { faction: 'freehold', classKey: 'cutter', role: 'trader' },
  ];
  const label = (t) => t.faction + '/' + t.classKey + '/' + t.role;
  const readyOf = (t) => {
    try { return isShipAssetReady(t.faction, t.classKey, t.role) === true; }
    catch (err) { return false; }
  };
  for (const t of tries) {
    try { await Promise.resolve(primeShipAsset(t.faction, t.classKey, t.role)); }
    catch (err) { /* one failure must not block the alternatives */ }
  }
  const assetDeadline = Date.now() + 15000;
  while (!tries.some(readyOf) && Date.now() < assetDeadline) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!tries.some(readyOf)) {
    throw new Error('issue100 SETUP: no authored ship asset ready within 15000ms: ' + tries.map(label).join(', '));
  }
  const bag = { ships: {} };
  bag.spawn = (tag, pilot, dx) => {
    const pos = c.ship.object.position.clone();
    pos.x += dx;
    let live = null;
    for (const t of tries) {
      if (!readyOf(t)) continue;
      live = spawnLiveShip(c, {
        id: 'i100-' + tag + '-' + Date.now(),
        name: tag,
        pilot,
        classKey: t.classKey,
        faction: t.faction,
        role: t.role,
        resolve: 45,
        personality: 80,
        alwaysHuntsPlayer: true,
      }, pos);
      if (live) break;
    }
    if (!live) return { ok: false, tag };
    live._i100 = true;
    c.ships.push(live);
    if (live.ai) { live.ai.calmUntil = 0; live.ai.intent = true; live.ai.mode = 'hunt'; }
    bag.ships[tag] = live;
    return { ok: true, tag, pilot };
  };
  bag.park = () => {
    const base = c.ship.object.position;
    const mine = Object.values(bag.ships);
    let n = 0;
    for (const s of c.ships) {
      if (!s || !s.object || mine.indexOf(s) >= 0) continue;
      s.object.position.set(base.x + 9000, base.y + 9000, base.z + 9000);
      n++;
    }
    return n;
  };
  bag.clear = () => {
    bag.park();
    c.emit('hailClosed', {});
    if (c.targets) c.targets.current = null;
    return true;
  };
  bag.arm = (tag, demand) => {
    const s = bag.ships[tag];
    if (!s || !s.ai) return false;
    const now = c.world.time;
    s.ai.demanding = true;
    s.ai.demandOutcome = null;
    s.ai.demandSent = true;
    s.ai.demandPeaceAt = now;
    s.ai.demandExpiresAt = now + 20;
    s.ai.demandAmount = demand;
    s.ai.calmUntil = 0;
    return true;
  };
  bag.hail = (tag, ev) => {
    const s = bag.ships[tag];
    if (!s) return false;
    c.emit('hailOpened', Object.assign({}, ev, { ship: s }));
    return true;
  };
  // Everything a resolution would move. Read-only.
  bag.effects = (tag) => {
    const s = bag.ships[tag];
    return {
      credits: c.world.credits,
      fear: c.world.fear,
      pods: Array.isArray(c.pods) ? c.pods.length : null,
      mode: s && s.ai ? (s.ai.mode || null) : null,
      demandOutcome: s && s.ai ? (s.ai.demandOutcome ?? null) : null,
      surrendered: !!(s && s.state && s.state.surrendered),
      cargo: s && s.state && Array.isArray(s.state.cargo)
        ? s.state.cargo.map((r) => r.commodity + ':' + r.units).join(',') : null,
      calmUntil: s && s.ai ? (s.ai.calmUntil ?? null) : null,
      hailOpen: c.flags.hailOpen === true,
      docked: c.flags.docked === true,
    };
  };
  bag.remove = (tag) => {
    const s = bag.ships[tag];
    if (!s) return false;
    const i = c.ships.indexOf(s);
    if (i >= 0) c.ships.splice(i, 1);
    try { if (s.object) c.scene.remove(s.object); } catch {}
    delete bag.ships[tag];
    return true;
  };
  // Direct card-API probe. Reads only; the refusal token is the assertion.
  bag.cardResolve = (intent, expected) => {
    try {
      const api = c.hailApi;
      if (!api || typeof api.resolve !== 'function') return 'no-api';
      return expected === undefined ? api.resolve(intent) : api.resolve(intent, expected);
    } catch (err) {
      return 'threw:' + String(err && err.message);
    }
  };
  window.__i100 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__i100.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;
const act = (name, args) => `(() => JSON.stringify(window.rimward.act({ v: 2, name: ${JSON.stringify(name)}, args: ${JSON.stringify(args || {})} })))()`;

const SURRENDER = ['demandRansom', 'acceptTribute', 'letGo', 'keepFiring'];

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
  // Declared out here so the FINALLY diagnostics can read Chrome's own stderr
  // even when the run dies before the first pin.
  const chromeErr = [];

  try {
    // ---- Vite ------------------------------------------------------------
    // Started through the programmatic API, not the CLI, so the harness can pass
    // `server: { watch: null }` and `optimizeDeps: { noDiscovery: true,
    // include: [] }`. See the header note: the cold-cache dependency scan holds
    // /src/main.js open, and the chokidar watcher startup separately starves the
    // server. Both overrides are needed; HMR is not.
    // The repository config still loads (cwd is the repo root); only these
    // dev-server options are overridden.
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
      { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN },
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

    // ---- Chrome ----------------------------------------------------------
    chrome = spawn(CHROME, [
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check',
      // Platform GPU, as the modern issue #11 / #74 probes use.
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
    ], { stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN });
    chrome.stderr.on('data', (b) => chromeErr.push(String(b).trim().slice(0, 200)));
    say('chrome', CHROME, 'pid', chrome.pid, 'profile', profile);

    // Attach to the page Chrome opened from its own command line, so the tab is
    // the foreground target for the whole run.
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

    // ---- Boot into flight -------------------------------------------------
    // The public handle drives the title and the origin picker, exactly as the
    // modern issue #11 / #74 probes do: the public startGame / chooseOrigin
    // verbs, with no title-skip storage key and no DOM row selector.
    const handle = await waitUntil('!!window.rimward', (v) => v === true, 60000, 300);
    if (handle !== true) {
      throw new Error('issue100 boot: window.rimward never appeared within 60000ms; last='
        + JSON.stringify(handle));
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
    if (phase !== 'playing') {
      throw new Error(`issue100 boot: session phase stuck at ${JSON.stringify(phase)}`);
    }
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

    // privilegedFixture: survive the pass and hold station. Harness-only.
    await cdp.eval(`(() => {
      const c = window.__ctx;
      if (c?.player) {
        c.player.hullMax = 1e9; c.player.hull = 1e9;
        c.player.screenMax = 1e9; c.player.screen = 1e9;
      }
      c.world.credits = 5000;
      return true;
    })()`);

    // ---- Ordinary docking / launching -------------------------------------
    // Both go through the station panel's own dock()/undock(); the probe never
    // writes ctx.flags.docked.
    const dockNow = async () => {
      const first = await cdp.eval(PROBE);
      if (first.docked === true) return first;
      // Ordinary approach: the same autopilot the pad approach key drives.
      const approach = JSON.parse(await cdp.eval(act('approachDock')));
      say('approachDock', JSON.stringify(approach));
      const inZone = await waitUntil(
        `(() => !!(window.__ctx?.station?.inZone === true))()`, (v) => v === true, 90000, 400,
      );
      if (inZone !== true) throw new Error('issue100 dockNow(): never reached the dock zone');
      const receipt = JSON.parse(await cdp.eval(act('dock')));
      say('dock', JSON.stringify(receipt));
      const state = await waitUntil(PROBE, (v) => v && v.docked === true, 20000);
      if (!state || state.docked !== true) {
        throw new Error('issue100 dockNow(): station panel never took the ship');
      }
      return state;
    };
    const launchNow = async () => {
      const first = await cdp.eval(PROBE);
      if (first.docked === false) return first;
      const receipt = JSON.parse(await cdp.eval(act('undock')));
      say('undock', JSON.stringify(receipt));
      const state = await waitUntil(PROBE, (v) => v && v.docked === false, 20000);
      if (!state || state.docked !== false) {
        throw new Error('issue100 launchNow(): the berth never released the ship');
      }
      // Clear of the pad before the next fixture ship is placed.
      await cdp.eval(KEY('KeyF', 'f'));
      await sleep(150);
      await cdp.eval(KEY('KeyF', 'f'));
      await sleep(600);
      return state;
    };

    const setup = await cdp.eval(SETUP);
    say('fixture setup', String(setup));
    if (setup !== true) throw new Error('fixture setup failed');

    const closedOk = (s) => !!(s && s.hail && s.hail.open === false
      && s.card && s.card.display !== 'block');
    const stage = async () => {
      await cdp.eval(call('clear()'));
      const s = await waitUntil(PROBE, closedOk, 8000);
      if (!closedOk(s)) {
        throw new Error('issue100 stage(): prior card still up after 8000ms: open='
          + JSON.stringify(s && s.hail && s.hail.open)
          + ' display=' + JSON.stringify(s && s.card && s.card.display));
      }
    };
    const openCardFor = async (tag, ev) => {
      const row = await cdp.eval(`(() => {
        const rows = window.rimward.observe().targets.nearby || [];
        const hit = rows.find((r) => r.name === ${JSON.stringify(tag)});
        return hit ? { id: hit.id } : null;
      })()`);
      if (!row || !row.id) throw new Error(`issue100 openCardFor(${tag}): no nearby target named ${tag}`);
      const expectedId = row.id;
      await cdp.eval(`(() => window.__i100.hail('${tag}', ${JSON.stringify(ev)}))()`);
      const match = (s) => !!(s && s.card && s.card.display === 'block'
        && s.hail && s.hail.open === true && s.hail.conversationId
        && s.hail.speaker && s.hail.speaker.id === expectedId);
      const v = await waitUntil(PROBE, match, 8000);
      if (!match(v)) {
        throw new Error(`issue100 openCardFor(${tag}): card for ${expectedId} not rendered within 8000ms; saw `
          + JSON.stringify(v && { display: v.card && v.card.display, hail: v.hail }));
      }
      return v;
    };

    // ================= D1 ordinary docking opens the real panel ===========
    let docked = null;
    {
      await stage();
      docked = await dockNow();
      await cdp.shot('01-d1-station-panel.png');
      record('D1', !!(docked.docked === true && docked.panelVisible === true
        && docked.station === true
        // The pre-#100 overlay mutex only knew the berth-RECORDS overlay; the
        // station desk never set it, which is exactly why hails leaked through.
        && docked.berthOpen === false
        && docked.card.display !== 'block'),
      {
        docked: docked.docked,
        panelVisible: docked.panelVisible,
        berthOpenFlag: docked.berthOpen,
        cardDisplay: docked.card.display,
      });
    }

    // ================= D2 an incoming surrender is not heard at the desk ==
    {
      await launchNow();
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('desk', 'Sten Ilo', 90)")));
      await dockNow();
      const before = JSON.parse(await cdp.eval(call("effects('desk')")));
      await cdp.eval(`(() => window.__i100.hail('desk', ${JSON.stringify({ intents: SURRENDER, line: 'They are breaking.' })}))()`);
      await sleep(1500);
      const after = await cdp.eval(PROBE);
      const effects = JSON.parse(await cdp.eval(call("effects('desk')")));
      await cdp.shot('02-d2-incoming-refused.png');
      record('D2', !!(spawned.ok
        && after.docked === true
        && after.panelVisible === true
        && after.card.display !== 'block'
        && after.card.header === null
        && after.hail.open === false
        && after.hailOpenFlag === false
        && effects.credits === before.credits
        && effects.fear === before.fear
        && effects.surrendered === before.surrendered
        && effects.cargo === before.cargo
        && effects.mode === before.mode),
      { spawned, card: after.card, hail: after.hail, before, after: effects });
      await cdp.eval(call("remove('desk')"));
    }

    // ================= D3 a card open in flight closes on docking =========
    // ================= D4 attempts after a real dock move nothing =========
    // ================= D5 the token is the stable 'docked' ================
    {
      await launchNow();
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('parley', 'Vell Ord', 88)")));
      const inFlight = await openCardFor('parley', { intents: SURRENDER, line: 'They are breaking.' });
      await cdp.shot('03-d3-card-in-flight.png');
      const before = JSON.parse(await cdp.eval(call("effects('parley')")));

      // Dock while the card is up, then run the battery at the first instant the
      // berth actually holds the ship. Whether the card is still rendered at
      // that instant is recorded, not assumed; the synchronous still-visible
      // race is covered by the focused regression suite.
      const approach = JSON.parse(await cdp.eval(act('approachDock')));
      say('approachDock(parley)', JSON.stringify(approach));
      const inZone = await waitUntil(`(() => !!(window.__ctx?.station?.inZone === true))()`,
        (v) => v === true, 90000, 400);
      if (inZone !== true) throw new Error('issue100 D3: never reached the dock zone');
      // One evaluation: dock through the panel, then try every resolution path
      // once the berth holds the ship. `stillUp` records whether the card was
      // still rendered at that instant; on this workspace it is normally already
      // closed, so the click lands on a retained button.
      //
      // ORDERING: the `dock` receipt comes back `status: 'queued'`; the station
      // takes the ship a few frames later. The battery below must therefore not
      // fire until `ctx.flags.docked` is actually true. Firing on the receipt
      // exercises the ORDINARY undocked path, where the click correctly pays the
      // ransom — which is issue #100's *working* behaviour, not its bug. The
      // wait is the only thing that awaits; once the berth has the ship the
      // whole battery runs in one synchronous stretch, so the hail system
      // cannot slip a frame between the attempts.
      const windowProbe = await cdp.eval(`(async () => {
        const c = window.__ctx;
        const receipt = window.rimward.act({ v: 2, name: 'dock' });
        const deadline = Date.now() + 20000;
        while (c.flags.docked !== true && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 16));
        }
        if (c.flags.docked !== true) {
          return { dockReceipt: receipt, dockedNow: false, timedOut: true };
        }
        const beforeWindow = window.__i100.effects('parley');
        const cardAt = document.querySelector('.rw-hail-card');
        const rootAt = cardAt ? cardAt.parentElement : null;
        const stillUp = !!(rootAt && getComputedStyle(rootAt).display === 'block');
        const btn = cardAt
          ? [...cardAt.querySelectorAll('button')].find((b) => /Demand ransom/i.test(b.textContent || ''))
          : null;
        const clicked = !!btn;
        if (btn) btn.click();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true, cancelable: true }));
        const cardApi = window.__i100.cardResolve('demandRansom');
        const publicUnbound = window.rimward.act({ v: 2, name: 'hailResolve', args: { intent: 'demandRansom' } });
        const publicIndex = window.rimward.act({ v: 2, name: 'hailResolve', args: { index: 1 } });
        const selectTarget = window.rimward.act({ v: 2, name: 'selectTarget' });
        return {
          dockReceipt: receipt,
          dockedNow: c.flags.docked === true,
          timedOut: false,
          beforeWindow,
          stillUp,
          clicked,
          cardApi,
          publicUnbound,
          publicIndex,
          selectTarget,
        };
      })()`, 60000);
      say('transition window', JSON.stringify(windowProbe).slice(0, 500));
      const settled = await waitUntil(PROBE, (v) => v && v.docked === true && v.hail
        && v.hail.open === false, 20000);
      const after = JSON.parse(await cdp.eval(call("effects('parley')")));
      await cdp.shot('04-d4-transition-refused.png');

      // Two comparisons, because they answer two different questions.
      //
      // `rewardUntouched` compares against the snapshot taken while the card was
      // still up in flight. Credits, fear, pods, surrender, cargo, the demand
      // outcome and calmUntil are exactly what a resolution grants, and nothing
      // else moves them, so they must be identical across the whole dock.
      //
      // `windowUntouched` compares against the snapshot taken at the instant the
      // berth took the ship, and adds the AI mode. Mode is read only from that
      // instant onward: the hunting hull is free to change mode by itself during
      // the ~19 s approach, which is ordinary traffic behaviour and not a hail
      // resolution.
      const beforeWindow = windowProbe.beforeWindow || null;
      const rewardUntouched = after.credits === before.credits
        && after.fear === before.fear
        && after.pods === before.pods
        && after.surrendered === before.surrendered
        && after.cargo === before.cargo
        && after.demandOutcome === before.demandOutcome
        && after.calmUntil === before.calmUntil;
      const windowUntouched = !!beforeWindow
        && after.credits === beforeWindow.credits
        && after.fear === beforeWindow.fear
        && after.pods === beforeWindow.pods
        && after.surrendered === beforeWindow.surrendered
        && after.cargo === beforeWindow.cargo
        && after.demandOutcome === beforeWindow.demandOutcome
        && after.calmUntil === beforeWindow.calmUntil
        && after.mode === beforeWindow.mode;
      const untouched = rewardUntouched && windowUntouched;

      record('D3', !!(spawned.ok
        && inFlight.card.display === 'block'
        && inFlight.hail.kind === 'surrender'
        && windowProbe.dockedNow === true
        && settled.docked === true
        && settled.panelVisible === true
        && settled.card.display !== 'block'
        && settled.hail.open === false
        && settled.hailOpenFlag === false
        && untouched),
      {
        inFlight: { display: inFlight.card.display, kind: inFlight.hail.kind },
        settled: { docked: settled.docked, display: settled.card.display, hail: settled.hail.open },
        rewardUntouched, windowUntouched,
        before, beforeWindow, after,
      });

      record('D4', !!(windowProbe.dockReceipt.ok === true
        && windowProbe.dockedNow === true
        && windowProbe.cardApi === 'docked'
        && windowProbe.publicUnbound.ok === false
        && windowProbe.publicIndex.ok === false
        && untouched
        // The click and the digit key carry no token: the human handlers just
        // ignore the input, so only ctx.hailApi.resolve and the public
        // hailResolve answer 'docked'. When the frame had already closed the
        // card (the usual case here), the attempts still have to move nothing.
        && (windowProbe.stillUp === false || windowProbe.clicked === true)),
      {
        stillUp: windowProbe.stillUp,
        clicked: windowProbe.clicked,
        cardApi: windowProbe.cardApi,
        publicUnbound: windowProbe.publicUnbound,
        dockedNow: windowProbe.dockedNow,
        rewardUntouched, windowUntouched,
        before,
        beforeWindow,
        after,
      });

      const dockedResolve = JSON.parse(await cdp.eval(act('hailResolve', { intent: 'demandRansom' })));
      const dockedBound = JSON.parse(await cdp.eval(act('hailResolve', {
        intent: 'demandRansom', expectedConversationId: inFlight.hail.conversationId,
      })));
      const dockedSelect = JSON.parse(await cdp.eval(act('selectTarget')));
      const availability = settled.availability;
      record('D5', !!(dockedResolve.ok === false && dockedResolve.token === 'docked'
        && dockedBound.ok === false && dockedBound.token === 'docked'
        && windowProbe.publicUnbound.token === 'docked'
        && windowProbe.publicIndex.token === 'docked'
        && windowProbe.selectTarget.token === 'docked'
        && dockedSelect.token === 'docked'
        && availability && availability.ok === false && availability.reason === 'docked'),
      { dockedResolve, dockedBound, dockedSelect, availability, inWindow: windowProbe.publicUnbound });
      await cdp.eval(call("remove('parley')"));
    }

    // ================= D6 a deferred hail is dropped on docking ===========
    {
      await launchNow();
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('deferred', 'Kel Ban', 92)")));
      // The galaxy chart owns the screen, so an incoming hail defers.
      await cdp.eval(KEY('KeyM', 'm'));
      const charted = await waitUntil(PROBE, (v) => v && v.chartOpen === true, 8000);
      if (!charted || charted.chartOpen !== true) throw new Error('issue100 D6: chart never opened');
      await cdp.eval(`(() => window.__i100.hail('deferred', ${JSON.stringify({ intents: SURRENDER, line: 'They are breaking.' })}))()`);
      await sleep(800);
      const whileCharted = await cdp.eval(PROBE);
      await cdp.eval(KEY('KeyM', 'm')); // close the chart
      await waitUntil(PROBE, (v) => v && v.chartOpen === false, 8000);
      // The pilot docks instead of taking the call.
      await dockNow();
      await sleep(1200);
      const atDesk = await cdp.eval(PROBE);
      await cdp.shot('05-d6-deferred-dropped.png');
      await launchNow();
      await sleep(2500);
      const afterLaunch = await cdp.eval(PROBE);
      record('D6', !!(spawned.ok
        && whileCharted.hail.open === false
        && atDesk.docked === true && atDesk.card.display !== 'block'
        && atDesk.hail.open === false
        && afterLaunch.docked === false
        && afterLaunch.card.display !== 'block'
        && afterLaunch.hail.open === false
        && afterLaunch.hailOpenFlag === false),
      {
        spawned,
        whileCharted: { chartOpen: whileCharted.chartOpen, open: whileCharted.hail.open },
        atDesk: { docked: atDesk.docked, display: atDesk.card.display, open: atDesk.hail.open },
        afterLaunch: { docked: afterLaunch.docked, display: afterLaunch.card.display, open: afterLaunch.hail.open },
      });
      await cdp.eval(call("remove('deferred')"));
    }

    // ================= D7 undocked behaviour is unchanged =================
    {
      await launchNow();
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('flight', 'Cass Odo', 86)")));
      await cdp.eval(call("arm('flight', 120)"));
      const card = await openCardFor('flight', {
        intents: ['payTribute', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand: 120,
        demandHail: true,
      });
      const creditsBefore = card.credits;
      const liveId = card.hail.conversationId;
      const staleRes = JSON.parse(await cdp.eval(act('hailResolve', {
        intent: 'payTribute', expectedConversationId: `${liveId}-not-this-one`,
      })));
      const boundRes = JSON.parse(await cdp.eval(act('hailResolve', {
        intent: 'payTribute', expectedConversationId: liveId,
      })));
      const paid = JSON.parse(await waitUntil(call("effects('flight')"),
        (v) => { try { return JSON.parse(v).demandOutcome === 'paid'; } catch { return false; } }, 8000));
      const closed = await waitUntil(PROBE, (v) => v && v.hail && v.hail.open === false, 8000);
      await cdp.shot('06-d7-undocked-unchanged.png');
      record('D7', !!(spawned.ok
        && card.docked === false
        && card.availability && card.availability.ok === true
        && staleRes.ok === false && staleRes.token === 'stale'
        && boundRes.ok === true && boundRes.token === ''
        && paid.demandOutcome === 'paid'
        && paid.credits === creditsBefore - 120
        && closed.hail.open === false),
      { spawned, availability: card.availability, staleRes, boundRes, creditsBefore, paid });
      await cdp.eval(call("remove('flight')"));
    }

  } catch (err) {
    say('ERROR', err?.stack || String(err));
    results.error = String(err?.message || err);
  } finally {
    // Diagnostics are written on EVERY exit, not just the passing one: a failed
    // run is exactly when the console, the exceptions, the last screenshot and
    // Chrome's stderr have to survive.
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
        // The synchronous page state is collected and written FIRST. A hung
        // module request is the most likely thing to have killed the run, so no
        // unbounded fetch may run ahead of the snapshot that would explain it.
        let dom = null;
        try {
          dom = await cdp.eval(`(() => {
            const fatal = document.getElementById('fatal');
            return {
              url: location.href,
              readyState: document.readyState,
              booted: window.__rimwardBooted === true,
              phase: (() => { try { return window.rimward.observe().session.phase; } catch (e) { return 'no-handle'; } })(),
              hasCtx: !!window.__ctx,
              title: !!document.getElementById('rw-title'),
              canvases: document.querySelectorAll('canvas').length,
              appChildren: (document.getElementById('app') || { children: [] }).children.length,
              fatalShown: !!(fatal && !fatal.hidden),
              fatalText: fatal ? (fatal.textContent || '').slice(0, 1500) : null,
              scripts: [...document.querySelectorAll('script')].map((s) => s.src || 'inline'),
              resources: performance.getEntriesByType('resource')
                .map((e) => e.name.replace(location.origin, '') + ' ' + Math.round(e.duration) + 'ms')
                .slice(-40),
              bodyText: (document.body ? document.body.innerText : '').slice(0, 4000),
            };
          })()`, 15000);
          await writeFile(join(outDir, 'failure-dom.json'), JSON.stringify(dom, null, 2), 'utf8');
        } catch (dumpErr) {
          say('failure-dom unavailable', String(dumpErr?.message || dumpErr).slice(0, 400));
        }
        // Only now, and with its own abort budget, ask whether the entry module
        // actually answers. The snapshot above is already on disk either way.
        try {
          const mainStatus = await cdp.eval(`(async () => {
            try {
              const r = await fetch('/src/main.js', { signal: AbortSignal.timeout(3000) });
              return r.status + ' len=' + (await r.text()).length;
            } catch (e) { return 'fetch failed: ' + String(e && e.message); }
          })()`, 10000);
          say('failure main.js', String(mainStatus));
          if (dom) {
            dom.mainStatus = mainStatus;
            await writeFile(join(outDir, 'failure-dom.json'), JSON.stringify(dom, null, 2), 'utf8');
          } else {
            await writeFile(join(outDir, 'failure-main.json'),
              JSON.stringify({ mainStatus }, null, 2), 'utf8');
          }
        } catch (fetchErr) {
          say('failure main.js unavailable', String(fetchErr?.message || fetchErr).slice(0, 400));
        }
      }
      cdp.close();
    }
    await killTree(chrome);
    await killTree(vite);
    try {
      if (profile) {
        const target = resolvePath(profile);
        const leaf = basename(target);
        if (relative(PROFILE_ROOT, target) === leaf && leaf.startsWith(PROFILE_PREFIX)) {
          await rm(target, { recursive: true, force: true, maxRetries: 5 });
        }
      }
    } catch { /* profile may hold locks */ }
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
    await writeFile(join(outDir, 'probes.json'), JSON.stringify(results, null, 2), 'utf8');
    if (reasons.length) {
      console.log('\nISSUE-100 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-100 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
