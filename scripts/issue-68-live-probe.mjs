/**
 * Issue #68 live verification — a fleeing NPC runs for a real gate or the
 * station holding lane, and the player can read it, chase it and lose it for
 * a reason.
 *
 * Drives the dev app in headless Chrome over CDP and checks, against the REAL
 * rendered HUD bracket, the REAL `window.rimward` observation and the REAL
 * public event ring:
 *
 *   G1  front door    - a fresh Greenhand start reaches flight with a clean
 *                       console; the escape vocabulary is published by the
 *                       capability manifest
 *   G2  gate route    - a hull that breaks off near the gate commits to a
 *                       NAMED gate, the bracket says so, and the public row
 *                       publishes the same word, kind, destination and phase
 *   G3  station route - a hull that breaks off beside the station commits to
 *                       the holding lane instead, and reaching it emits ONE
 *                       npcSheltered receipt while the ship stays locked,
 *                       present and damageable (no immunity, no bounty)
 *   G4  choice        - the same hull, moved between the two neighbourhoods,
 *                       really re-chooses; a pursuer parked on the leg forces
 *                       the other route or an explicit evade with NO transit
 *   G5  engine out    - a limping hull's sampled world speed stays inside 30%
 *                       of class cruise and it never completes a gate charge;
 *                       a disabled hull cannot depart at all
 *   G6  threshold     - a real chase across 1400 u: the lock drops, the hull
 *                       is culled, and reacquiring it inside 900 u returns the
 *                       SAME id at the same damage on the same escape route
 *   G7  departure     - an actual completed gate jump: physical arrival, a
 *                       visible charge, exactly one npcEscaped receipt with
 *                       origin/destination/eta, the lock released with a
 *                       readable reason, and the record inTransit
 *   G8  arrival       - the same id lands in the destination system's bank
 *                       with its condition intact and no duplicate
 *
 * FIXTURES: a live session cannot be made to produce a damaged runner beside
 * a chosen gate on demand, so a clearly labelled harness (`window.__i68`,
 * recorded as `privilegedFixture` in the ledger) spawns the hull, parks
 * ambient traffic, and seeds INITIAL condition only — where the ship is, how
 * hurt it is, whether its engine is out, and the ordinary `flee` mode a
 * capitulation would set. It NEVER writes an escape plan, a phase, a charge,
 * a destination, a transit, a receipt, a lock release or a restored value.
 * Every asserted OUTCOME is produced by the game's own npc.js / world.js /
 * traffic.js code and read back from the rendered DOM, `window.rimward`, or
 * the persistent record.
 *
 * Run: node scripts/issue-68-live-probe.mjs   (npm run test:gate-escape-live)
 * Output: out/issue68/live/ (ignored path).
 *
 * Isolation: an OS-assigned loopback Vite port and an OS-assigned CDP port, a
 * fresh Chrome profile outside the repository, and teardown of only the
 * processes this run spawned.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE68_OUT || join(repo, 'out', 'issue68', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE68_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.ISSUE68_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue68-escape-';
const PINS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  commit: process.env.ISSUE68_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  boot: null,
  fixtureNote: 'privilegedFixture: ship spawn, ambient parking, player hull pin, and seeded INITIAL condition (position, hull/engine damage, engineOut/disabled flags, ordinary flee mode). The harness never writes an escape plan, phase, charge, destination, transit, receipt, lock release or restored value — every asserted outcome is produced by npc.js/world.js/traffic.js and read back from the DOM, window.rimward or the persistent record.',
  origin: null,
  samples: {},
  pins: {},
  consoleErrors: [],
  exceptions: [],
};

function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1100));
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
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout ' + method));
        }
      }, timeoutMs);
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
 * One synchronous read of the rendered HUD, the public observation and the
 * world facts the issue asks to record: positions, speeds, identity/condition
 * and terminal receipts.
 */
const PROBE = `(() => {
  const c = window.__ctx;
  const rw = window.rimward || null;
  const o = rw ? rw.observe() : null;
  const q = (sel) => document.querySelector(sel);
  const txt = (el) => (el && (el.textContent || '').trim()) || '';
  const bag = window.__i68 || null;
  const s = bag ? bag.sample() : null;
  return {
    t: c ? c.world.time : null,
    sys: c ? c.world.currentSystem : null,
    v: o ? o.v : null,
    optIn: o ? o.agentOptIn === true : false,
    events: o && Array.isArray(o.events)
      ? o.events.filter((e) => e && (e.type === 'npcEscaped' || e.type === 'npcSheltered'))
      : [],
    comms: o && Array.isArray(o.events)
      ? o.events.filter((e) => e && e.type === 'commLine').map((e) => e.text)
      : [],
    lock: o && o.targets ? (o.targets.current || null) : null,
    nearby: o && o.targets && Array.isArray(o.targets.nearby)
      ? o.targets.nearby.map((r) => ({ id: r.id, name: r.name, range: r.range })) : [],
    hud: {
      bracketHidden: q('.rw-target') ? q('.rw-target').classList.contains('is-hidden') : null,
      band: q('.rw-target') ? q('.rw-target').getAttribute('data-band') : null,
      name: txt(q('.rw-target-name')),
      meta: txt(q('.rw-target-meta')),
      resolve: txt(q('.rw-target-resolve')),
    },
    ship: s,
    capabilities: o && o.capabilities ? o.capabilities.events : null,
  };
})()`;

/**
 * privilegedFixture: harness-only staging installed once on the live page.
 * Read the header note above — this block seeds INITIAL condition and reads
 * world facts back. It contains no escape-plan write of any kind.
 */
const SETUP = `(async () => {
  const c = window.__ctx;
  const { spawnLiveShip } = await import('/src/systems/npc.js');
  const { isShipAssetReady, primeShipAsset } = await import('/src/systems/ship-assets.js');
  const { SYSTEMS } = await import('/src/game/state.js');
  const tries = [
    { faction: 'redledger', classKey: 'cutter', role: 'pirate' },
    { faction: 'independent', classKey: 'cutter', role: 'pirate' },
    { faction: 'freehold', classKey: 'cutter', role: 'trader' },
  ];
  const readyOf = (t) => {
    try { return isShipAssetReady(t.faction, t.classKey, t.role) === true; }
    catch (err) { return false; }
  };
  for (const t of tries) {
    try { await Promise.resolve(primeShipAsset(t.faction, t.classKey, t.role)); }
    catch (err) { /* one failure must not block the alternatives */ }
  }
  const deadline = Date.now() + 15000;
  while (!tries.some(readyOf) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
  if (!tries.some(readyOf)) throw new Error('issue68 SETUP: no authored ship asset ready');

  const sys = c.world.currentSystem;
  const def = SYSTEMS[sys];
  const bag = {
    sys,
    gate: def.gates[0].position.slice(),
    gateTo: def.gates[0].to,
    station: def.station.position.slice(),
    ship: null,
    rec: null,
    lastPos: null,
    lastT: null,
  };

  /** FIXTURE: spawn one controlled hull into the REAL current-system bank. */
  bag.spawn = (name, at, opts) => {
    const o = opts || {};
    const rec = {
      id: 'i68-' + Date.now(),
      name,
      classKey: 'cutter',
      faction: 'redledger',
      role: o.role || 'pirate',
      cargo: [],
      bounty: 300,
      system: sys,
      state: 'enroute',
      live: false,
      route: [{ x: bag.station[0], y: bag.station[1], z: bag.station[2] },
        { x: bag.gate[0], y: bag.gate[1], z: bag.gate[2] }],
      legLens: [1000], leg: 0, legT: 0.5, dir: 1, dwellUntil: 0,
      resolveSeed: 0.5, personality: 0,
    };
    let live = null;
    for (const t of tries) {
      if (!readyOf(t)) continue;
      rec.classKey = t.classKey;
      rec.faction = t.faction;
      rec.role = o.role || t.role;
      live = spawnLiveShip(c, rec, new (c.ship.object.position.constructor)(at[0], at[1], at[2]));
      if (live) break;
    }
    if (!live) return { ok: false };
    c.world.records.push(rec);
    c.ships.push(live);
    rec.live = true;
    // FIXTURE: initial condition only — ordinary battle damage and the flee
    // mode a capitulation or a panic would already have set.
    if (Number.isFinite(o.hull)) live.state.hull = o.hull;
    if (o.engineOut === true) {
      live.state.engineOut = true;
      live.state.engine = live.state.engineMax * 0.1;
    }
    live.state.lastHitAt = c.world.time;
    live.ai.mode = 'flee';
    live.ai.fleeFrom = 'player';
    live.ai.intent = false;
    live.ai.target = null;
    bag.ship = live;
    bag.rec = rec;
    bag.lastPos = null;
    bag.lastT = null;
    return { ok: true, id: rec.id, name, classKey: rec.classKey, role: rec.role };
  };
  /** FIXTURE: harness-only SPATIAL staging. Moves a hull, nothing else. */
  bag.place = (at) => {
    if (!bag.ship) return false;
    bag.ship.object.position.set(at[0], at[1], at[2]);
    bag.lastPos = null;
    return true;
  };
  bag.placePlayer = (at) => {
    c.ship.object.position.set(at[0], at[1], at[2]);
    c.ship.velocity.set(0, 0, 0);
    c.ship.speed = 0;
    return true;
  };
  /** FIXTURE: keep ambient traffic out of the measurement. */
  bag.park = () => {
    let n = 0;
    for (const s of c.ships) {
      if (!s || !s.object) continue;
      if (bag.rec && s.record === bag.rec) continue;
      s.object.position.set(80000, 80000, 80000);
      n++;
    }
    return n;
  };
  bag.disable = () => {
    if (!bag.ship) return false;
    bag.ship.state.disabled = true; // FIXTURE: the initial disable itself
    return true;
  };
  bag.lock = () => {
    try {
      const rows = window.rimward.observe().targets.nearby || [];
      const row = rows.find((r) => bag.rec && r.id === bag.rec.id);
      if (!row) return false;
      return window.rimward.act({ v: 2, name: 'selectTarget', args: { id: row.id } }).ok === true;
    } catch (err) { return false; }
  };
  bag.remove = () => {
    if (!bag.ship) return false;
    const i = c.ships.indexOf(bag.ship);
    if (i >= 0) c.ships.splice(i, 1);
    try { if (bag.ship.object) c.scene.remove(bag.ship.object); } catch (err) {}
    const banks = c.world.recordBanks || {};
    for (const k of Object.keys(banks)) {
      const j = banks[k].indexOf(bag.rec);
      if (j >= 0) banks[k].splice(j, 1);
    }
    bag.ship = null;
    bag.rec = null;
    return true;
  };
  /**
   * READ-ONLY world sample: position, sampled world speed, identity and the
   * persisted escape facts. This is the evidence, not a control.
   */
  bag.sample = () => {
    const rec = bag.rec;
    if (!rec) return null;
    const live = (c.ships || []).find((s) => s.record === rec) || null;
    const p = live ? live.object.position : null;
    const now = c.world.time;
    let speed = null;
    if (p && bag.lastPos && Number.isFinite(bag.lastT) && now > bag.lastT) {
      const dx = p.x - bag.lastPos[0];
      const dy = p.y - bag.lastPos[1];
      const dz = p.z - bag.lastPos[2];
      speed = Math.hypot(dx, dy, dz) / (now - bag.lastT);
    }
    if (p) { bag.lastPos = [p.x, p.y, p.z]; bag.lastT = now; }
    const esc = rec.escape || null;
    const pp = c.ship.object.position;
    return {
      id: rec.id,
      name: rec.name,
      live: !!live,
      state: rec.state,
      system: rec.system,
      pos: p ? [Math.round(p.x), Math.round(p.y), Math.round(p.z)] : null,
      recPos: esc && Array.isArray(esc.pos) ? esc.pos.map((n) => Math.round(n)) : null,
      speed: speed === null ? null : Math.round(speed * 10) / 10,
      range: p ? Math.round(Math.hypot(p.x - pp.x, p.y - pp.y, p.z - pp.z)) : null,
      hull: live ? Math.round(live.state.hull) : (esc && esc.cond ? Math.round(esc.cond.hull) : null),
      engineOut: live ? live.state.engineOut === true : !!(esc && esc.cond && esc.cond.flags && esc.cond.flags.engineOut),
      disabled: live ? live.state.disabled === true : !!(esc && esc.cond && esc.cond.flags && esc.cond.flags.disabled),
      mode: live ? live.ai.mode : null,
      escape: esc ? {
        phase: esc.phase, kind: esc.kind, to: esc.to, reason: esc.reason,
        charge: Math.round((esc.charge || 0) * 100) / 100,
        departed: esc.departed === true, sheltered: esc.sheltered === true,
        destRange: p && Array.isArray(esc.dest)
          ? Math.round(Math.hypot(esc.dest[0] - p.x, esc.dest[1] - p.y, esc.dest[2] - p.z)) : null,
      } : null,
      destBank: (() => {
        const banks = c.world.recordBanks || {};
        for (const k of Object.keys(banks)) {
          if (banks[k].some((r) => r.id === rec.id)) return k;
        }
        return null;
      })(),
    };
  };
  window.__i68 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__i68.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;

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

  try {
    vite = spawn(
      process.execPath,
      [join(repo, 'node_modules', 'vite', 'bin', 'vite.js'),
        '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
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

    chrome = spawn(CHROME, [
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist', '--enable-webgl',
      '--disable-extensions', '--window-size=1440,900',
      '--headless=new',
      '--hide-crash-restore-bubble', '--disable-session-crashed-bubble',
      ...(WIN ? [] : ['--no-sandbox', '--disable-dev-shm-usage']),
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN });
    const chromeErr = [];
    chrome.stderr.on('data', (b) => chromeErr.push(String(b).trim().slice(0, 200)));
    say('chrome', CHROME, 'pid', chrome.pid, 'profile', profile);

    let browserWs = null;
    let cdpPort = null;
    for (let i = 0; i < 120; i++) {
      try {
        const active = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
        const parsed = Number(active.split(/\r?\n/, 1)[0]);
        if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('invalid DevToolsActivePort');
        cdpPort = parsed;
        const ver = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        if (ver.ok) { browserWs = (await ver.json()).webSocketDebuggerUrl; if (browserWs) break; }
      } catch { /* not up yet */ }
      if (chrome.exitCode != null) break;
      await sleep(200);
    }
    results.cdpPort = cdpPort;
    if (!browserWs) throw new Error(`CDP not ready: ${chromeErr.slice(-3).join(' | ')}`);

    cdp = new Cdp(browserWs);
    await cdp.ready();
    const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const targetId = created?.targetId || null;
    cdp.close();

    let pageWs = null;
    for (let i = 0; i < 60; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
        const page = list.find((t) => t.type === 'page' && t.id === targetId);
        if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
      } catch { /* not up yet */ }
      if (chrome.exitCode != null) break;
      await sleep(200);
    }
    if (!pageWs) throw new Error('page ws missing');
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
    await waitUntil(`({ ctx: !!window.__ctx, title: !!document.getElementById('rw-title') })`,
      (v) => !!(v && (v.ctx || v.title)), 40000, 300);
    await cdp.eval(`(() => {
      try { localStorage.removeItem('rimward-save-v1'); } catch {}
      try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
      location.reload();
      return true;
    })()`);
    await sleep(1500);
    await waitUntil(`({ ctx: !!window.__ctx, title: !!document.getElementById('rw-title') })`,
      (v) => !!(v && (v.ctx || v.title)), 40000, 300);
    for (let i = 0; i < 12; i++) {
      if (await cdp.eval('!!window.__ctx?.world?.origin')) break;
      const click = await cdp.eval(`(() => {
        const row = [...document.querySelectorAll('.rw-origin-row')].find((el) =>
          /Greenhand/.test(el.textContent || ''));
        if (row) { row.click(); return 'origin'; }
        const neu = document.getElementById('rw-title-new')
          || document.querySelector('[data-title-action="new"]');
        if (neu) { neu.click(); return 'new'; }
        return 'none';
      })()`);
      say('click', click);
      await sleep(800);
    }
    await waitUntil(`(() => {
      const c = window.__ctx;
      return !!(c?.ship?.object && c.world.origin && c.flags.paused === false && (c.world.time || 0) > 1);
    })()`, (v) => v === true, 25000, 300);
    results.boot = await cdp.eval(`(() => {
      const c = window.__ctx;
      return { hasCtx: !!c, origin: c?.world?.origin || null, sys: c?.world?.currentSystem || null,
        docked: !!c?.flags?.docked, agentOptIn: !!c?.agent?.optIn };
    })()`);
    say('flight', JSON.stringify(results.boot));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (results.boot.docked) { await cdp.eval(KEY('Digit8', '8')); await sleep(1500); }
    // privilegedFixture: survive the pass and hold station.
    await cdp.eval(`(() => {
      const c = window.__ctx;
      if (c?.player) {
        c.player.hullMax = 1e9; c.player.hull = 1e9;
        c.player.screenMax = 1e9; c.player.screen = 1e9;
        c.player.shellMax = 1e9; c.player.shell = 1e9;
      }
      c.world.jumpGraceUntil = 0;
      c.input.throttle = 0;
      c.input.fullStop = true;
      return true;
    })()`);
    await cdp.eval(KEY('KeyF', 'f'));
    await sleep(200);
    await cdp.eval(KEY('KeyF', 'f'));
    await sleep(600);
    const setup = await cdp.eval(SETUP);
    say('fixture setup', String(setup));
    if (setup !== true) throw new Error('fixture setup failed');
    const geom = JSON.parse(await cdp.eval(`(() => JSON.stringify({
      sys: window.__i68.sys, gate: window.__i68.gate, gateTo: window.__i68.gateTo,
      station: window.__i68.station,
    }))()`));
    say('geometry', JSON.stringify(geom));

    const park = () => cdp.eval(call('park()'));
    const probe = async () => {
      await park();
      return cdp.eval(PROBE);
    };
    /** Poll the REAL world until a predicate over the real sample holds. */
    const until = async (label, pred, ms = 25000) => {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        last = await probe();
        try { if (pred(last)) return last; } catch { /* keep polling */ }
        await sleep(180);
      }
      say('timeout', label, JSON.stringify(last?.ship ?? null).slice(0, 400));
      return last;
    };
    const spawnAt = async (name, at, opts) => {
      await cdp.eval(call('remove()')).catch(() => {});
      const r = await cdp.eval(`(() => JSON.stringify(window.__i68.spawn(${JSON.stringify(name)}, ${JSON.stringify(at)}, ${JSON.stringify(opts || {})})))()`);
      return JSON.parse(r);
    };
    const V = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

    // ================= G1: front door + published vocabulary ===============
    {
      const p = await probe();
      record('G1', !!(p && p.v === 2 && p.optIn === true
        && Array.isArray(p.capabilities)
        && p.capabilities.includes('npcEscaped') && p.capabilities.includes('npcSheltered')),
      { v: p?.v, optIn: p?.optIn, sys: p?.sys, hasEscaped: p?.capabilities?.includes('npcEscaped') });
    }

    // ================= G2: a gate route, read off the bracket ==============
    {
      const spawn = await spawnAt('Claim Wren', V(geom.gate, [140, 0, 90]));
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [700, 0, 500]))})`));
      const p = await until('G2 gate route', (v) => v.ship && v.ship.escape && v.ship.escape.kind);
      await cdp.eval(call('lock()'));
      const locked = await until('G2 bracket', (v) => v.hud && v.hud.bracketHidden === false
        && /RUNNING FOR|GATE CHARGE/.test(v.hud.resolve || ''));
      results.samples.G2 = { plan: p?.ship, hud: locked?.hud, row: locked?.lock };
      await cdp.shot('g2-gate-route.png');
      record('G2', !!(spawn.ok && p.ship && p.ship.escape
        && p.ship.escape.kind === 'gate' && p.ship.escape.to === geom.gateTo
        && locked.hud && /GATE/.test(locked.hud.resolve || '')
        && locked.lock && locked.lock.escape
        && locked.lock.escape.kind === 'gate' && locked.lock.escape.to === geom.gateTo
        && locked.lock.escape.label === (locked.hud.resolve || '').split(' · ').pop()),
      { escape: p?.ship?.escape, resolve: locked?.hud?.resolve, row: locked?.lock?.escape,
        pos: p?.ship?.pos, speed: p?.ship?.speed });
    }

    // ================= G3: the station holding lane ========================
    {
      const spawn = await spawnAt('Bent Kestrel', V(geom.station, [230, 0, 230]));
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.station, [700, 0, 700]))})`));
      const chose = await until('G3 station route', (v) => v.ship && v.ship.escape && v.ship.escape.kind);
      await cdp.eval(call('lock()'));
      const held = await until('G3 shelter',
        (v) => v.events.some((e) => e.type === 'npcSheltered' && e.targetId === spawn.id), 30000);
      results.samples.G3 = { plan: chose?.ship, hold: held?.ship, hud: held?.hud };
      await cdp.shot('g3-station-hold.png');
      const receipt = (held?.events || []).find((e) => e.type === 'npcSheltered' && e.targetId === spawn.id) ?? null;
      record('G3', !!(spawn.ok && chose.ship?.escape?.kind === 'station'
        && receipt && receipt.kind === 'station' && receipt.system === geom.sys
        // still present, still locked, still damageable — not immunity
        && held.ship && held.ship.live === true && held.ship.state === 'enroute'
        && held.ship.disabled === false
        && held.lock && held.lock.id === spawn.id
        // and never a gate escape
        && !held.events.some((e) => e.type === 'npcEscaped')),
      { plan: chose?.ship?.escape, receipt, hold: held?.ship, lockId: held?.lock?.id,
        resolve: held?.hud?.resolve });
    }

    // ================= G4: the choice really re-decides =====================
    {
      // Same hull, moved next to the gate: the committed choice is revisited
      // on the game's own cadence and becomes the gate.
      await cdp.eval(call(`place(${JSON.stringify(V(geom.gate, [220, 0, 160]))})`));
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [900, 0, 700]))})`));
      const toGate = await until('G4 reroute to gate',
        (v) => v.ship && v.ship.escape && v.ship.escape.kind === 'gate', 30000);
      // Now park the pursuer squarely on the leg to the gate: with the near
      // route screened the hull must NOT press through the pursuer.
      const mid = [(geom.gate[0] + V(geom.gate, [220, 0, 160])[0]) / 2,
        (geom.gate[1] + V(geom.gate, [220, 0, 160])[1]) / 2,
        (geom.gate[2] + V(geom.gate, [220, 0, 160])[2]) / 2];
      await cdp.eval(call(`place(${JSON.stringify(V(geom.gate, [220, 0, 160]))})`));
      await cdp.eval(call(`placePlayer(${JSON.stringify(mid)})`));
      const screened = await until('G4 screened',
        (v) => v.ship && v.ship.escape
          && (v.ship.escape.kind !== 'gate' || v.ship.escape.reason === 'blocked'
            || v.ship.escape.phase === 'evade'), 30000);
      results.samples.G4 = { toGate: toGate?.ship?.escape, screened: screened?.ship?.escape };
      await cdp.shot('g4-choice.png');
      record('G4', !!(toGate.ship?.escape?.kind === 'gate'
        && screened.ship?.escape
        && (screened.ship.escape.kind === 'station' || screened.ship.escape.phase === 'evade')
        // an evade is never a transit and never a receipt
        && screened.ship.state !== 'inTransit'
        && !screened.events.some((e) => e.type === 'npcEscaped')),
      { toGate: toGate?.ship?.escape, screened: screened?.ship?.escape,
        state: screened?.ship?.state });
    }

    // ================= G5: engine out and disabled =========================
    {
      const spawn = await spawnAt('Limping Hull', V(geom.gate, [900, 0, 700]), { engineOut: true, hull: 40 });
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [1500, 0, 1200]))})`));
      // Sample the real world speed twice so the reading is a rate, not a jump.
      await probe();
      await sleep(700);
      const s1 = await probe();
      await sleep(700);
      const s2 = await probe();
      const cruise = 105; // SHIP_CLASSES.cutter.cruise
      const speeds = [s1?.ship?.speed, s2?.ship?.speed].filter((n) => Number.isFinite(n));
      // Parked at the gate bore, an engine-out hull must never finish a charge.
      await cdp.eval(call(`place(${JSON.stringify(V(geom.gate, [20, 0, 0]))})`));
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [600, 0, 0]))})`));
      const parked = await until('G5 engineOut at gate',
        (v) => v.ship && v.ship.escape && v.ship.escape.kind === 'gate', 30000);
      await sleep(6000);
      const stillHere = await probe();
      await cdp.eval(call('disable()'));
      await sleep(6000);
      const disabled = await probe();
      results.samples.G5 = { speeds, parked: parked?.ship, stillHere: stillHere?.ship, disabled: disabled?.ship };
      await cdp.shot('g5-engine-out.png');
      record('G5', !!(spawn.ok
        && speeds.length > 0 && speeds.every((s) => s <= cruise * 0.3 + 3)
        && stillHere.ship && stillHere.ship.engineOut === true
        && stillHere.ship.escape && stillHere.ship.escape.charge === 0
        && stillHere.ship.state !== 'inTransit'
        && disabled.ship && disabled.ship.state !== 'inTransit'
        && !disabled.events.some((e) => e.type === 'npcEscaped')),
      { speeds, cap: cruise * 0.3, engineOut: stillHere?.ship?.escape,
        disabled: disabled?.ship?.escape, state: disabled?.ship?.state });
    }

    // ================= G6: chase across the 1400 u threshold ===============
    {
      const spawn = await spawnAt('Chased Wren', V(geom.gate, [1600, 0, 1200]), { hull: 45 });
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [1900, 0, 1400]))})`));
      const near = await until('G6 near', (v) => v.ship && v.ship.live === true && v.ship.range < 600);
      await cdp.eval(call('lock()'));
      const locked = await probe();
      const hull0 = locked?.ship?.hull ?? null;
      // Fall behind: a real cull at the real threshold, then reacquire.
      const far = [locked.ship.pos[0] + 2600, locked.ship.pos[1], locked.ship.pos[2]];
      await cdp.eval(call(`placePlayer(${JSON.stringify(far)})`));
      const lost = await until('G6 lost', (v) => v.ship && v.ship.live === false, 20000);
      await cdp.shot('g6-target-lost.png');
      // Close back in on the record's own tracked position.
      const at = lost?.ship?.recPos;
      if (at) await cdp.eval(call(`placePlayer(${JSON.stringify([at[0] + 120, at[1], at[2]])})`));
      const backAgain = await until('G6 reacquired', (v) => v.ship && v.ship.live === true, 25000);
      await cdp.eval(call('lock()'));
      const relocked = await probe();
      results.samples.G6 = { near: near?.ship, lost: lost?.ship, back: backAgain?.ship, relock: relocked?.lock };
      await cdp.shot('g6-reacquired.png');
      record('G6', !!(spawn.ok && hull0 !== null
        && lost.ship && lost.ship.live === false && lost.ship.state === 'enroute'
        && lost.ship.escape && lost.ship.escape.kind
        && backAgain.ship && backAgain.ship.live === true
        && backAgain.ship.id === spawn.id
        && backAgain.ship.hull === hull0
        && backAgain.ship.mode === 'flee'
        && relocked.lock && relocked.lock.id === spawn.id
        && !lost.events.some((e) => e.type === 'npcEscaped')),
      { hull0, lost: lost?.ship, back: backAgain?.ship, relockId: relocked?.lock?.id });
    }

    // ================= G7: an actual completed gate jump ===================
    let departedId = null;
    {
      const spawn = await spawnAt('Wren Runner', V(geom.gate, [40, 0, 20]), { hull: 50 });
      departedId = spawn.id;
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [420, 0, 0]))})`));
      const charging = await until('G7 charging',
        (v) => v.ship && v.ship.escape && v.ship.escape.phase === 'charge' && v.ship.escape.charge > 0);
      await cdp.eval(call('lock()'));
      const chargeShot = await probe();
      await cdp.shot('g7-charging.png');
      const gone = await until('G7 departed',
        (v) => v.events.some((e) => e.type === 'npcEscaped' && e.targetId === spawn.id), 30000);
      await cdp.shot('g7-departed.png');
      const receipt = (gone?.events || []).find((e) => e.type === 'npcEscaped' && e.targetId === spawn.id) ?? null;
      results.samples.G7 = { charging: charging?.ship, receipt, after: gone?.ship,
        comms: gone?.comms?.slice(-4), hud: chargeShot?.hud };
      record('G7', !!(spawn.ok
        && charging.ship.escape.phase === 'charge'
        && chargeShot.lock && chargeShot.lock.id === spawn.id  // observable while charging
        && receipt && receipt.kind === 'gate' && receipt.reason === 'gate'
        && receipt.from === geom.sys && receipt.to === geom.gateTo
        && Number.isFinite(receipt.eta)
        && gone.ship && gone.ship.state === 'inTransit'
        && gone.ship.live === false
        && (!gone.lock || gone.lock.id !== spawn.id)   // lock released at departure
        && (gone.comms || []).some((t) => /jumped to/.test(t) && /target lost/.test(t))),
      { receipt, after: gone?.ship, lock: gone?.lock, comms: gone?.comms?.slice(-3),
        chargeHud: chargeShot?.hud?.resolve });
    }

    // ================= G8: the same ship on the other side =================
    {
      const arrived = await until('G8 arrival',
        (v) => v.ship && v.ship.state === 'enroute' && v.ship.destBank === geom.gateTo, 180000);
      results.samples.G8 = arrived?.ship ?? null;
      record('G8', !!(arrived.ship && arrived.ship.id === departedId
        && arrived.ship.destBank === geom.gateTo
        && arrived.ship.system === geom.gateTo
        && arrived.ship.state === 'enroute'
        && arrived.ship.hull !== null
        && arrived.ship.escape && arrived.ship.escape.phase === 'done'),
      arrived?.ship);
      await cdp.eval(call('remove()'));
    }

    results.consoleErrors = cdp.console.filter((c) => c.type === 'error' || c.type === 'assert');
    results.exceptions = cdp.exceptions;
    await writeFile(join(outDir, 'console.txt'),
      cdp.console.map((c) => `[${c.type}] ${c.text}`).join('\n')
      + '\n\n--- exceptions ---\n' + cdp.exceptions.join('\n') + '\n', 'utf8');
  } catch (err) {
    say('ERROR', err?.stack || String(err));
    results.error = String(err?.message || err);
  } finally {
    if (cdp) cdp.close();
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
      console.log('\nISSUE-68 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-68 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
