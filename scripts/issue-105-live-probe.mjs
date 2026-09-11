/** Issue #105 departure-lane camping, in a real browser.
 * Isolated loopback Vite/CDP, separate temporary profile, own-process cleanup,
 * temp-profile deletion with containment checks.
 *
 * Every action under test goes through the PUBLIC handle: window.rimward.act
 * ({ name: 'dock' | 'undock' }) and window.rimward.observe(), against real
 * animation frames, real physics and real page timestamps.
 *
 * TWO disclosed staging fixtures get the page into the situation the issue
 * reports. Both are stated plainly because both WRITE world state:
 *   1. the player hull is POSITIONED beside Freehold Landing (a Greenhand start
 *      is in flight, and flying there under autopilot would make this probe
 *      long and non-deterministic). Only the position is staged; the dock
 *      itself is the public rimward.act({ name: 'dock' }) verb, and the docked
 *      state is then confirmed from observe() before anything else happens.
 *      ctx.flags.docked is never written.
 *   2. a real pirate cutter record is spawned with the production spawnLiveShip
 *      and pushed into ctx.ships exactly the way traffic.js does, positioned on
 *      the berth's own departure radial ahead of the docked player, with its
 *      loiter waypoint list pinned to that spawn point so it does not wander
 *      off down a patrol ring before the case runs (loiter still steers it).
 * Nothing after that is written: no throttle, no velocity, no world time, no
 * notice, no receipt, no request state. The hold, the notice, the security
 * hail, the hull's motion, the retries and the launch are the shipped game, and
 * every distance, frame count and elapsed time below is read from the page.
 *
 * Run: npm run test:lane-hold-live.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE105_OUT || join(repo, 'out', 'issue-105-evidence', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE105_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.ISSUE105_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue105-lane-';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

/** Lane offset of the camping hull ahead of the docked player, world units. */
const BLOCK_AHEAD = 55;
/** Staged stand-off from the station centre before the public dock verb. */
const DOCK_RANGE = 36;
/** Bounded observation: retry the public undock for at most this long. */
const RETRY_BUDGET_MS = 30000;
const RETRY_EVERY_MS = 1500;

const PINS = [
  'docked-at-freehold',
  'hold-names-blocker',
  'security-hail',
  'blocker-moves',
  'launch-clears',
];
const results = {
  pins: {}, consoleErrors: [], exceptions: [],
  privilegedFixture:
    'Two staged fixtures, both of which write world state. (1) The player hull POSITION is staged to '
    + DOCK_RANGE
    + ' u from the Freehold Landing station centre, because a Greenhand start is in flight and flying there would make this probe long and non-deterministic; ctx.flags.docked is never written, the dock itself is the public rimward.act({ name: "dock" }) verb, and the docked state is confirmed from observe() before the case runs. (2) A real pirate-cutter record is spawned through the production spawnLiveShip (src/systems/npc.js), pushed into ctx.ships the way traffic.js does, placed on the berth departure radial '
    + BLOCK_AHEAD
    + ' u ahead of the docked player, with its loiter waypoint list pinned to that spawn point so it does not wander off a patrol ring first (loiter still steers it). After that nothing is written: no throttle, speed, velocity, world time, notice, receipt, event or request state, and no number is fabricated — the hold, the hail, the hull motion, the retries and the launch are shipped behaviour read from the live page.',
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
 * Staging fixture 1: put the hull beside the station. POSITION ONLY — the dock
 * itself is the public verb, and ctx.flags.docked is never written here.
 */
const STAGE_DOCK = `(() => {
  const c = window.__ctx;
  const s = c.station.position;
  const p = c.ship.object.position;
  let dx = p.x - s.x, dy = p.y - s.y, dz = p.z - s.z;
  const len = Math.hypot(dx, dy, dz);
  if (!(len > 1e-3)) { dx = 1; dy = 0; dz = 0; }
  else { dx /= len; dy /= len; dz /= len; }
  p.set(s.x + dx * ${DOCK_RANGE}, s.y + dy * ${DOCK_RANGE}, s.z + dz * ${DOCK_RANGE});
  return { staged: [p.x, p.y, p.z], fromStation: Math.hypot(p.x - s.x, p.y - s.y, p.z - s.z) };
})()`;

/** Staging fixture 2: a real pirate cutter camped in the lane. */
const SETUP = `(async () => {
  const c = window.__ctx;
  const { spawnLiveShip } = await import('/src/systems/npc.js');
  const { isShipAssetReady, primeShipAsset } = await import('/src/systems/ship-assets.js');
  const tries = [
    { faction: 'redledger', classKey: 'cutter', role: 'pirate' },
    { faction: 'independent', classKey: 'cutter', role: 'pirate' },
  ];
  const readyOf = (t) => {
    try { return isShipAssetReady(t.faction, t.classKey, t.role) === true; } catch (err) { return false; }
  };
  for (const t of tries) {
    try { await Promise.resolve(primeShipAsset(t.faction, t.classKey, t.role)); } catch (err) { /* try the next */ }
  }
  const deadline = Date.now() + 15000;
  while (!tries.some(readyOf) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
  if (!tries.some(readyOf)) throw new Error('issue105 SETUP: no cutter asset ready within 15000ms');

  // The berth's own departure radial: station centre out through the docked
  // hull. This is the lane the clearance planner checks.
  const s = c.station.position;
  const p = c.ship.object.position;
  let dx = p.x - s.x, dy = p.y - s.y, dz = p.z - s.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len; dy /= len; dz /= len;
  const at = len + ${BLOCK_AHEAD};
  const pos = new (p.constructor)(s.x + dx * at, s.y + dy * at, s.z + dz * at);

  let live = null;
  for (const t of tries) {
    if (!readyOf(t)) continue;
    live = spawnLiveShip(c, {
      id: 'i105-camper-' + Date.now(),
      name: 'Bloodmoth',
      pilot: 'Bloodmoth',
      classKey: t.classKey,
      faction: t.faction,
      role: 'pirate',
      resolve: 70,
      personality: 70,
    }, pos);
    if (live) break;
  }
  if (!live) throw new Error('issue105 SETUP: spawnLiveShip refused every authored cutter');
  c.ships.push(live);
  // Camp: one waypoint, its own spawn point.
  if (live.ai) { live.ai.waypoints = [live.object.position.clone()]; live.ai.wp = 0; }
  window.__i105 = { live, lane: { dx, dy, dz }, start: { x: pos.x, y: pos.y, z: pos.z } };
  return { name: live.state && live.state.name, id: live.id, at, pos: [pos.x, pos.y, pos.z] };
})()`;

/** Read-only look at the staged hull: where it is, relative to the lane. */
const LOOK = `(() => {
  const c = window.__ctx, bag = window.__i105;
  if (!c || !bag || !bag.live) return null;
  const s = c.station.position, p = c.ship.object.position, b = bag.live.object.position;
  let dx = p.x - s.x, dy = p.y - s.y, dz = p.z - s.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len; dy /= len; dz /= len;
  const vx = b.x - s.x, vy = b.y - s.y, vz = b.z - s.z;
  const axial = vx * dx + vy * dy + vz * dz;
  return {
    lateral: Math.hypot(vx - axial * dx, vy - axial * dy, vz - axial * dz),
    axial,
    x: b.x, y: b.y, z: b.z,
    rangeToPlayer: Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z),
    destroyed: !!(bag.live.state && bag.live.state.destroyed),
    disabled: !!(bag.live.state && bag.live.state.disabled),
    worldTime: c.world.time,
  };
})()`;

/** Sample the staged hull once per REAL animation frame, read-only. */
const samplerFor = (ms) => `(() => new Promise((resolve) => {
  const rows = [];
  const stop = performance.now() + ${JSON.stringify(ms)};
  const step = () => {
    const look = (${LOOK});
    if (look) rows.push(look);
    if (performance.now() >= stop) resolve(rows);
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}))()`;

const trim = (rows) => ({
  frames: rows.length,
  first: rows[0] || null,
  last: rows[rows.length - 1] || null,
  minLateral: rows.length ? Math.min(...rows.map((r) => r.lateral)) : null,
  maxLateral: rows.length ? Math.max(...rows.map((r) => r.lateral)) : null,
  worstStep: null,
  elapsed: rows.length ? rows[rows.length - 1].worldTime - rows[0].worldTime : null,
});

const securityOf = (obs) => (Array.isArray(obs?.events) ? obs.events : [])
  .filter((e) => e && e.type === 'commLine' && typeof e.from === 'string' && /security$/i.test(e.from));

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

    chrome = spawn(CHROME, [
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check',
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

    // ---- Boot through the PUBLIC handle ------------------------------------
    const handle = await waitUntil('!!window.rimward', (v) => v === true, 60000, 300);
    if (handle !== true) throw new Error('issue105 boot: window.rimward never appeared within 60000ms');
    const phaseOf = '(() => { const o = window.rimward.observe(); return o.session ? o.session.phase : null; })()';
    let phase = await waitUntil(phaseOf, (v) => typeof v === 'string', 20000, 250);
    say('phase', String(phase));
    if (phase === 'title') {
      say('startGame', await cdp.eval(act('startGame')));
      phase = await waitUntil(phaseOf, (v) => v !== 'title', 20000, 250);
    }
    if (phase === 'origin') say('chooseOrigin', await cdp.eval(act('chooseOrigin', { id: 'greenhand' })));
    phase = await waitUntil(phaseOf, (v) => v === 'playing', 30000, 300);
    if (phase !== 'playing') throw new Error(`issue105 boot: session phase stuck at ${JSON.stringify(phase)}`);
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

    // ---- 1. Get into the berth this issue reports, through the public verb --
    // A Greenhand start is in FLIGHT, so the hull position is staged beside the
    // station (disclosed above) and then the real dock verb is pressed. The
    // docked state is read back from observe() before anything else runs.
    const boot = await cdp.eval('window.rimward.observe()');
    results.boot = {
      system: boot.world.currentSystem, docked: boot.flags.docked,
      station: boot.station ? boot.station.name : null, agentOptIn: boot.agentOptIn,
    };
    say('boot', JSON.stringify(results.boot));
    if (boot.flags.docked !== true) {
      results.staging = await cdp.eval(STAGE_DOCK);
      say('staged position', JSON.stringify(results.staging));
      const inZone = await waitUntil('window.rimward.observe()',
        (o) => o && o.station && o.station.inZone === true, 15000, 200);
      results.dockZone = { inZone: inZone?.station?.inZone, range: inZone?.station?.range };
      say('dock zone', JSON.stringify(results.dockZone));
      results.dockReceipt = JSON.parse(await cdp.eval(act('dock')));
      say('dock', JSON.stringify(results.dockReceipt));
      await waitUntil('window.rimward.observe()', (o) => o && o.flags && o.flags.docked === true, 15000, 200);
    }
    const berth = await cdp.eval('window.rimward.observe()');
    results.berth = {
      system: berth.world.currentSystem, docked: berth.flags.docked,
      station: berth.station ? berth.station.name : null, agentOptIn: berth.agentOptIn,
      noticeBefore: berth.station && berth.station.view ? berth.station.view.notice : null,
    };
    say('berth', JSON.stringify(results.berth));
    record('docked-at-freehold',
      berth.flags.docked === true && berth.world.currentSystem === 'freehold'
      && berth.agentOptIn === true,
      results.berth);
    await cdp.shot('01-docked.png');
    if (berth.flags.docked !== true) {
      throw new Error('issue105: the public dock verb never put the ship in the berth');
    }

    // ---- Disclosed fixture -------------------------------------------------
    const staged = await cdp.eval(SETUP, 40000);
    results.fixture = staged;
    say('fixture', JSON.stringify(staged));
    const before = await cdp.eval(LOOK);
    results.laneBefore = before;
    say('lane before', JSON.stringify(before));

    // ---- 2. The public undock is held, and the hold names the hull ---------
    // The true range, the receipt and the panel notice are taken in ONE page
    // evaluation: the hull is flying, so reading the range in a later round
    // trip would compare the receipt against a position it never described.
    const attempt = await cdp.eval(`(() => {
      const look = (${LOOK});
      const receipt = window.rimward.act({ v: 2, name: 'undock', args: {} });
      const obs = window.rimward.observe();
      return { look, receipt, obs };
    })()`);
    const held = attempt.receipt;
    const heldObs = attempt.obs;
    const heldNotice = heldObs.station && heldObs.station.view ? heldObs.station.view.notice : '';
    const rangeSaid = /(\d+)u/.exec(String(held.error || ''));
    const trueRange = attempt.look ? attempt.look.rangeToPlayer : null;
    results.hold = { receipt: held, notice: heldNotice, trueRange, rangeSaid: rangeSaid ? Number(rangeSaid[1]) : null };
    say('hold', JSON.stringify(results.hold));
    record('hold-names-blocker',
      held.ok === false && held.token === 'blocked'
      && /^Launch held/.test(String(held.error || ''))
      && /Bloodmoth/.test(String(held.error || ''))
      && !!rangeSaid
      && Number.isFinite(trueRange) && Math.abs(Number(rangeSaid[1]) - trueRange) <= 1
      && /Bloodmoth/.test(String(heldNotice))
      && heldObs.flags.docked === true,
      results.hold);
    await cdp.shot('02-launch-held.png');

    // ---- 3. Station security actually says something -----------------------
    // The hail is emitted inside the same call as the hold, but the agent event
    // journal publishes on the NEXT update — so the snapshot taken in the hold's
    // own evaluation tick cannot carry it yet. Wait for real frames to publish
    // it, bounded, then assert exactly one correctly named hail.
    const hailObs = await waitUntil('window.rimward.observe()',
      (o) => securityOf(o).some((h) => /Bloodmoth/.test(String(h.text))), 3000, 100);
    const hails = securityOf(hailObs);
    results.security = {
      sameTickAtHold: securityOf(heldObs).length,
      lines: hails.map((h) => ({ from: h.from, text: h.text, count: h.count ?? 1 })),
      note: 'The hold and the hail are emitted in one call; the journal publishes on the next update, so this is read across real frames.',
    };
    say('security', JSON.stringify(results.security));
    record('security-hail',
      hails.length === 1
      && /Bloodmoth/.test(String(hails[0].text))
      && /security$/i.test(String(hails[0].from))
      && (hails[0].count === undefined || hails[0].count === 1),
      { security: results.security });

    // ---- 4. The hull physically leaves the lane, on real frames ------------
    const moving = await cdp.eval(samplerFor(4000), 60000);
    const sampled = trim(moving);
    // Real 3D displacement between consecutive frames: a teleport would show up
    // here even if it left the lateral offset unchanged.
    let worstStep = 0;
    let travelled = 0;
    for (let i = 1; i < moving.length; i++) {
      const a = moving[i - 1];
      const b = moving[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      travelled += d;
      if (d > worstStep) worstStep = d;
    }
    sampled.worstStep = worstStep;
    sampled.pathLength = travelled;
    results.motion = sampled;
    say('motion', JSON.stringify(sampled));
    record('blocker-moves',
      sampled.frames > 30 && sampled.last && sampled.first
      && sampled.last.lateral > sampled.first.lateral + 1
      && sampled.elapsed > 0 && worstStep < 5 && travelled > 1
      && sampled.last.destroyed === false && sampled.last.disabled === false,
      { sampled, worstStep, pathLength: travelled });
    await cdp.shot('03-security-clearing.png');

    // ---- 5. Bounded retries through the public verb, until the lane opens --
    // The initial call above already proved the hold; a retry that succeeds on
    // the first try here is the intended outcome, not a weaker one.
    const retries = [];
    const t0 = Date.now();
    let flew = null;
    while (Date.now() - t0 < RETRY_BUDGET_MS) {
      const round = await cdp.eval(`(() => {
        const look = (${LOOK});
        const receipt = window.rimward.act({ v: 2, name: 'undock', args: {} });
        return { look, receipt };
      })()`);
      retries.push({
        atMs: Date.now() - t0, ok: round.receipt.ok, token: round.receipt.token || '',
        error: String(round.receipt.error || '').slice(0, 200),
        lateral: round.look ? round.look.lateral : null,
        worldTime: round.look ? round.look.worldTime : null,
      });
      if (round.receipt.ok === true) { flew = round.receipt; break; }
      await sleep(RETRY_EVERY_MS);
    }
    const afterObs = await cdp.eval('window.rimward.observe()');
    const afterLook = await cdp.eval(LOOK);
    results.retries = retries;
    results.after = {
      docked: afterObs.flags.docked,
      notice: afterObs.station && afterObs.station.view ? afterObs.station.view.notice : null,
      speed: afterObs.ship.speed, throttle: afterObs.ship.throttle,
      lateral: afterLook ? afterLook.lateral : null,
      securityLines: securityOf(afterObs).length,
    };
    say('after', JSON.stringify(results.after));
    record('launch-clears',
      !!flew && flew.ok === true && afterObs.flags.docked === false
      && retries.length >= 1 && results.after.securityLines <= 2,
      { attempts: retries.length, flew, retries: retries.slice(0, 8), after: results.after });
    await cdp.shot('04-launched.png');
  } catch (err) {
    say('ERROR', err?.stack || String(err));
    results.error = String(err?.message || err);
  } finally {
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
      console.log('\nISSUE-105 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-105 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
