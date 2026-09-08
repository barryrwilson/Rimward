/**
 * Issue #67 live verification - capitulation feedback agrees with the offer.
 *
 * Drives the dev app in headless Chrome over CDP and checks, against the REAL
 * rendered HUD bracket, the REAL hail card and the REAL `window.rimward`
 * handle, that what the player is shown and what the hail key actually does
 * are the same thing:
 *
 *   L1  front door   - fresh Marked origin (fear 15), and a seeded low resolve
 *                      alone grants no surrender and no reward
 *   L2  low morale   - the existing resolve line reads WILLING TO YIELD (or
 *                      BARGAINING), the meta line stays faction/distance only,
 *                      no useless Hail prompt is offered, and the real KeyH
 *                      answers 'no-answer'
 *   L3  earned yield - a real bargaining card, resolved through the PUBLIC
 *                      demandRansom, turns that same line to YIELDED
 *   L4  no double dip- repeated public H after the yield moves no credits, no
 *                      cargo, no pods and no fear
 *   L5  open cards   - a card open on this hull or on another one never
 *                      erases the selected hull's own status word
 *   L6  empty holds  - an intact hull with empty holds reads exactly like a
 *                      laden one; the manifest is never disclosed
 *   L7  salvage      - KeyH opens the rendered salvage card on a dead hulk,
 *                      and empty holds offer no cargo verb and no reward
 *   L8  out of range - the line still reads DEAD IN SPACE at a real >600 u,
 *                      nothing passive is added, and the real KeyH answers
 *                      'range'
 *   L9  overlap      - an open chart outranks range and morale for BOTH the
 *                      shared feedback and the real key ('overlay-chart'),
 *                      while the persistent state survives untouched
 *
 * FIXTURES: rare encounter states cannot be waited for in a live session, so a
 * clearly labelled controlled fixture (`privilegedFixture` in the ledger)
 * spawns the ship, parks ambient traffic, seeds the INITIAL rare condition
 * (resolve, empty holds, disabled flag, distance) and emits the ordinary
 * `hailOpened` the game itself emits. Everything the probe ASSERTS - the
 * bracket text, the prompt, the card, the miss reason, the resolution and its
 * economic effects - is read from the rendered DOM or the public handle. No
 * tested OUTCOME is forged: the yield in L3 is produced by the game's own
 * demandRansom path through `rw.act`, and `state.surrendered` is never written
 * anywhere in this file. No new runtime debug API is exposed, and this probe
 * changes no gameplay source.
 *
 * PRESENTATION (owner call, issue #67 UI follow-up): no dedicated row and no
 * passive clause is added anywhere. The existing resolve line carries the
 * status word - DEFIANT / SHAKEN / BARGAINING / WILLING TO YIELD / YIELDED /
 * DEAD IN SPACE - the meta line keeps faction, distance and the concealed
 * mounts mark only, and a refusal is explained on a deliberate H press. Every
 * assertion below reads that line and asserts the meta line stays clean.
 *
 * Run: node scripts/issue-67-live-probe.mjs   (npm run test:capitulation-live)
 * Output: out/issue67/live/ (ignored path).
 *
 * Isolation: an OS-assigned loopback Vite port and an OS-assigned CDP port
 * (never the agent-bridge-smoke 5188/8877 defaults), a fresh Chrome profile
 * outside the repository, and teardown of only the processes this run spawned.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE67_OUT || join(repo, 'out', 'issue67', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE67_CHROME || process.env.CHROME_PATH;
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
// Absolute, so the cleanup check below compares two resolved paths and never
// a relative override against a resolved child.
const PROFILE_ROOT = resolvePath(process.env.ISSUE67_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue67-hail-';
const PINS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  commit: process.env.ISSUE67_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  boot: null,
  fixtureNote: 'privilegedFixture: ship spawn, ambient parking, player hull pin, seeded resolve / empty holds / disabled flag / distance, and hailOpened emission stage rare encounter states; every assertion reads the rendered DOM or window.rimward, and the L3 yield is produced by the public demandRansom path - state.surrendered is never written',
  origin: null,
  pins: {},
  consoleErrors: [],
  exceptions: [],
};

function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 900));
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
 * One synchronous read of the rendered card AND the public observation, so a
 * counting-down demand line can be compared without a sampling race.
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
  return {
    card: {
      present: !!card,
      display: root ? getComputedStyle(root).display : null,
      header: leaf.find((t) => t.indexOf('HAIL —') === 0) || null,
      leaf,
      buttons,
    },
    hail: o ? o.hail : null,
    v: o ? o.v : null,
    handleVersion: rw ? rw.version : null,
    optIn: o ? o.agentOptIn === true : false,
    lock: o && o.targets && o.targets.current ? o.targets.current.name : null,
    target: o && o.targets ? (o.targets.current || null) : null,
    credits: c ? c.world.credits : null,
    fear: c ? c.world.fear : null,
    pods: c && c.pods ? c.pods.length : null,
    hold: c && c.cargo ? c.cargo.length : null,
    hailOpenFlag: c ? c.flags.hailOpen === true : null,
    hud: (() => {
      const q = (sel) => document.querySelector(sel);
      const br = q('.rw-target');
      const pr = q('.rw-prompt');
      const txt = (el) => (el && (el.textContent || '').trim()) || '';
      return {
        bracketHidden: br ? br.classList.contains('is-hidden') : null,
        band: br ? br.getAttribute('data-band') : null,
        name: txt(q('.rw-target-name')),
        meta: txt(q('.rw-target-meta')),
        resolve: txt(q('.rw-target-resolve')),
        promptHidden: pr ? pr.classList.contains('is-hidden') : null,
        promptKey: txt(q('.rw-prompt-key')),
        promptVerb: txt(q('.rw-prompt-verb')),
      };
    })(),
    misses: o && Array.isArray(o.events)
      ? o.events.filter((e) => e && e.type === 'hailMiss')
        .map((e) => ({ name: e.name, verb: e.verb, reason: e.reason, dist: e.dist, t: e.t }))
      : [],
  };
})()`;

/** The quoted/demand line the player is reading: the leaf after header + sub. */
function cardLine(card) {
  if (!card || !Array.isArray(card.leaf) || !card.header) return null;
  const i = card.leaf.indexOf(card.header);
  return i >= 0 && card.leaf.length > i + 2 ? card.leaf[i + 2] : null;
}

function labelsMatch(hail, card) {
  if (!hail || !hail.terms || !card) return false;
  const observed = hail.terms.options.map((o) => o.label);
  return JSON.stringify(observed) === JSON.stringify(card.buttons) && observed.length > 0;
}

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
  // spawnLiveShip returns null until the authored asset is resident, so prime
  // every combination up front and wait (bounded) for at least one to land.
  for (const t of tries) {
    try { await Promise.resolve(primeShipAsset(t.faction, t.classKey, t.role)); }
    catch (err) { /* one failure must not block the alternatives */ }
  }
  const assetDeadline = Date.now() + 15000;
  while (!tries.some(readyOf) && Date.now() < assetDeadline) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!tries.some(readyOf)) {
    throw new Error('issue67 SETUP: no authored ship asset ready within 15000ms: ' + tries.map(label).join(', '));
  }
  const bag = { ships: {} };
  // privilegedFixture: hunting picks the fixture's LOGICAL role. The
  // inherited hail66 spawn always asked for a hunting pirate
  // (alwaysHuntsPlayer, personality 80, ai.intent + mode 'hunt'), which is why
  // attempt2's "low resolve" hulls all read DEFIANT: spawnLiveShip COMPUTES
  // live state from the record, and an engaged hunter's resolve is recomputed
  // every threat tick, so a record-level resolve never survived. A quiet
  // fixture must therefore be an UNTHREATENED civilian: role 'trader', no
  // alwaysHuntsPlayer, low personality, and no combat stamp. The authored
  // asset (redledger visual) is unchanged - only the logical record differs.
  bag.spawn = (tag, pilot, dx, resolve, hunting) => {
    const pos = c.ship.object.position.clone();
    pos.x += dx;
    const hunts = hunting === true;
    let live = null;
    for (const t of tries) {
      if (!readyOf(t)) continue;
      const rec = {
        id: 'i67-' + tag + '-' + Date.now(),
        name: tag,
        pilot,
        classKey: t.classKey,
        faction: t.faction,
        role: hunts ? t.role : 'trader',
        resolve: Number.isFinite(resolve) ? resolve : 45,
        personality: hunts ? 80 : 20,
      };
      if (hunts) rec.alwaysHuntsPlayer = true;
      live = spawnLiveShip(c, rec, pos);
      if (live) break;
    }
    if (!live) return { ok: false, tag };
    live._i67 = true;
    c.ships.push(live);
    if (live.ai) {
      live.ai.calmUntil = 0;
      live.ai.intent = hunts;
      live.ai.mode = hunts ? 'hunt' : 'route';
      if (!hunts) { live.ai.target = null; live.ai.phase = null; live.ai.demanding = false; }
    }
    bag.ships[tag] = live;
    if (!hunts && Number.isFinite(resolve)) bag.hold(tag, resolve);
    return { ok: true, tag, pilot, role: live.record ? live.record.role : null,
      resolve: live.state ? live.state.resolve : null };
  };
  /**
   * privilegedFixture: hold a quiet fixture in its seeded INITIAL condition.
   * Seeds state.resolve explicitly (allowed: it is a spawn property) and
   * keeps the hull unthreatened so npc.js's resolve tick stays in its early
   * return and cannot drift the band mid-check. It NEVER writes
   * state.surrendered, never touches cargo, credits, fear or pods, and it
   * refuses to touch a hull that has already yielded or been disabled - the
   * real outcome of the public demandRansom path is preserved exactly.
   */
  bag.hold = (tag, resolve) => {
    const s = bag.ships[tag];
    if (!s || !s.state) return false;
    if (s.state.surrendered === true || s.state.disabled === true) return 'outcome-preserved';
    if (Number.isFinite(resolve)) s.state.resolve = resolve;
    s.state.lastCombatAt = -1e6; // no recent threat → resolve tick returns early
    if (s.ai) {
      s.ai.intent = false;
      s.ai.target = null;
      s.ai.phase = null;
      s.ai.demanding = false;
      s.ai.resolveBoost = 0;
      s.ai.calmUntil = 0;
      if (s.ai.mode === 'hunt' || s.ai.mode === 'duel') s.ai.mode = 'route';
    }
    return s.state.resolve;
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
  // privilegedFixture: seed the INITIAL rare condition only. None of these
  // writes an outcome the probe then asserts - resolve is an ordinary spawn
  // property, empty holds are an ordinary stock condition, and distance is
  // just where a hull happens to be. state.surrendered is never written.
  bag.emptyHolds = (tag) => {
    const s = bag.ships[tag];
    if (!s || !s.state || !Array.isArray(s.state.cargo)) return false;
    s.state.cargo.length = 0;
    return s.state.cargo.length === 0;
  };
  bag.place = (tag, d) => {
    const s = bag.ships[tag];
    if (!s || !s.object) return false;
    const base = c.ship.object.position;
    const fwd = s.object.position.clone().set(0, 0, -1).applyQuaternion(c.ship.object.quaternion);
    s.object.position.set(base.x + fwd.x * d, base.y + fwd.y * d, base.z + fwd.z * d);
    return Math.round(s.object.position.distanceTo(base));
  };
  bag.disable = (tag) => {
    const s = bag.ships[tag];
    if (!s || !s.state) return false;
    s.state.disabled = true;
    return true;
  };
  bag.lock = (tag) => {
    try {
      const nearby = window.rimward.observe()?.targets?.nearby;
      if (!Array.isArray(nearby)) return false;
      const row = nearby.find((r) => r && r.name === tag);
      if (!row) return false;
      const receipt = window.rimward.act({ v: 2, name: 'selectTarget', args: { id: row.id } });
      return receipt?.ok === true;
    } catch {
      return false;
    }
  };
  bag.hail = (tag, ev) => {
    const s = bag.ships[tag];
    if (!s) return false;
    c.emit('hailOpened', Object.assign({}, ev, { ship: s }));
    return true;
  };
  bag.effects = (tag) => {
    const s = bag.ships[tag];
    return {
      credits: c.world.credits,
      fear: c.world.fear,
      mode: s && s.ai ? (s.ai.mode || null) : null,
      demandOutcome: s && s.ai ? (s.ai.demandOutcome ?? null) : null,
      surrendered: !!(s && s.state && s.state.surrendered),
      hailOpen: c.flags.hailOpen === true,
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
  window.__i67 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__i67.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;
const act = (args) => `(() => JSON.stringify(window.rimward.act({ v: 2, name: 'hailResolve', args: ${JSON.stringify(args)} })))()`;

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
    // ---- Vite ------------------------------------------------------------
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

    // ---- Chrome ----------------------------------------------------------
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
          /Marked/.test(el.textContent || ''));
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
      return {
        hasCtx: !!c,
        origin: c?.world?.origin || null,
        sys: c?.world?.currentSystem || null,
        docked: !!c?.flags?.docked,
        agentOptIn: !!c?.agent?.optIn,
      };
    })()`);
    say('flight', JSON.stringify(results.boot));
    // IMMUTABLE ORIGIN RECEIPT. Taken here, before the privilegedFixture block
    // below pins the player hull and sets credits to 5000 for survivability -
    // so these three numbers are the game's own front-door result for a fresh
    // Marked start and nothing else. L1 asserts this snapshot; every later
    // economic comparison uses the post-fixture 5000 baseline and says so.
    results.origin = await cdp.eval(`(() => {
      const c = window.__ctx;
      return {
        origin: c.world.origin,
        credits: c.world.credits,
        fear: c.world.fear,
        sys: c.world.currentSystem,
      };
    })()`);
    say('origin receipt (pre-fixture)', JSON.stringify(results.origin));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (results.boot.docked) { await cdp.eval(KEY('Digit8', '8')); await sleep(1500); }
    // privilegedFixture: survive the pass and hold station. Harness-only.
    await cdp.eval(`(() => {
      const c = window.__ctx;
      if (c?.player) {
        c.player.hullMax = 1e9; c.player.hull = 1e9;
        c.player.screenMax = 1e9; c.player.screen = 1e9;
      }
      c.world.credits = 5000; // fixture baseline; NOT the origin receipt above
      return true;
    })()`);
    await cdp.eval(KEY('KeyF', 'f'));
    await sleep(120);
    await cdp.eval(KEY('KeyF', 'f'));
    await sleep(800);
    const setup = await cdp.eval(SETUP);
    say('fixture setup', String(setup));
    if (setup !== true) throw new Error('fixture setup failed');

    const closedOk = (s) => !!(s && s.hail && s.hail.open === false
      && s.card && s.card.display !== 'block');
    const stage = async () => {
      await cdp.eval(call('clear()'));
      const s = await waitUntil(PROBE, closedOk, 8000);
      if (!closedOk(s)) {
        throw new Error('issue67 stage(): prior card still up after 8000ms: open='
          + JSON.stringify(s && s.hail && s.hail.open)
          + ' display=' + JSON.stringify(s && s.card && s.card.display));
      }
    };
    const openCardFor = async (tag, ev) => {
      // Resolve the fixture's public identity first, so the wait below cannot be
      // satisfied by a stale card left by ambient traffic or a prior step.
      const row = await cdp.eval(`(() => {
        const rows = window.rimward.observe().targets.nearby || [];
        const hit = rows.find((r) => r.name === ${JSON.stringify(tag)});
        return hit ? { id: hit.id } : null;
      })()`);
      if (!row || !row.id) {
        throw new Error(`issue67 openCardFor(${tag}): no nearby target named ${tag}`);
      }
      const expectedId = row.id;
      await cdp.eval(`(() => window.__i67.hail('${tag}', ${JSON.stringify(ev)}))()`);
      const wantIntents = Array.isArray(ev.intents) ? ev.intents : null;
      const intentsOk = (got) => !wantIntents || (Array.isArray(got)
        && got.length === wantIntents.length
        && wantIntents.every((k, i) => got[i] === k));
      const demandOk = (s) => ev.demand == null
        || !!(s.hail.terms && s.hail.terms.amounts && s.hail.terms.amounts.demand === ev.demand);
      const match = (s) => !!(s && s.card && s.card.display === 'block'
        && s.hail && s.hail.open === true && s.hail.conversationId
        && s.hail.speaker && s.hail.speaker.id === expectedId
        && intentsOk(s.hail.intents) && demandOk(s));
      const v = await waitUntil(PROBE, match, 8000);
      if (!match(v)) {
        throw new Error(`issue67 openCardFor(${tag}): card for ${expectedId} not rendered within 8000ms; saw `
          + JSON.stringify(v && { display: v.card && v.card.display, hail: v.hail }));
      }
      return v;
    };

    // Read the rendered HUD + public observation for one locked fixture.
    /**
     * Select a fixture through the PUBLIC handle and wait for the RENDERED
     * bracket to catch up with it.
     *
     * attempt2 failed twice here. (a) The wait only read the public snapshot,
     * so L3 recorded a stale `DEFIANT` bracket one frame after the yield had
     * already landed publicly. Every read now requires the bracket to be
     * visible AND to name this fixture, on top of the caller's predicate.
     * (b) A yielded hull legitimately drifts away and left selectTarget with
     * nothing in range. `opts.at` is explicitly labelled harness-only SPATIAL
     * staging: it re-places the hull at the caller's OWN distance on every
     * poll so a bounded UI check is not a race against the drift. It moves the
     * hull and nothing else - the surrender, credits, cargo, pods, fear and AI
     * outcome of the real public path are untouched - and the distance is
     * always the caller's, never a default, so the >600 u rows stay >600 u.
     */
    const stageAt = async (tag, at) => {
      if (!Number.isFinite(at)) return null;
      return cdp.eval(call(`place('${tag}', ${at})`));
    };
    // Public target ACQUISITION is itself range-limited: `selectTarget` only
    // offers hulls inside U.TARGET_RANGE, and attempt1 died here asking it to
    // acquire a fresh lock already staged at 900 u. That refusal is correct
    // game behaviour, not a defect. So an out-of-range row is staged in TWO
    // labelled steps: acquire the lock at a legal distance first, then move
    // the ALREADY-SELECTED hull out to the caller's real distance. npc.js only
    // drops a stale lock when the hull is destroyed or despawned, so the
    // selection survives the move and the assertions still measure a real
    // >600 u. Harness-only spatial staging: nothing else is written, and
    // `ctx.targets.current` is never touched directly.
    const SELECT_RANGE = 600;   // U.TARGET_RANGE
    const SELECT_STAGE = 350;   // a legal acquisition distance, well inside it
    const lockAndRead = async (tag, pred, opts = {}) => {
      const { at = null, ms = 8000, hold = null } = opts;
      const farRow = Number.isFinite(at) && at > SELECT_RANGE;
      // Step 1 — acquire: in range for a far row, otherwise the caller's own.
      await stageAt(tag, farRow ? SELECT_STAGE : at);
      if (Number.isFinite(hold)) await cdp.eval(call(`hold('${tag}', ${hold})`));
      const locked = await cdp.eval(call(`lock('${tag}')`));
      if (locked !== true && locked !== 'true') {
        throw new Error(`issue67 lockAndRead(${tag}): public selectTarget refused`
          + ` (acquired at ${farRow ? SELECT_STAGE : (at === null ? 'current position' : at)}u`
          + `${farRow ? `, target ${at}u` : ''})`);
      }
      // Step 2 — the poll below re-places at the caller's REAL distance, so a
      // far row is read while the retained lock sits outside hail range.
      // The rendered bracket must be up AND naming this fixture before any
      // caller predicate is even consulted.
      const rendered = (v) => !!(v && v.hud && v.hud.bracketHidden === false
        && v.hud.name === tag && v.target && v.target.name === tag);
      const match = (v) => rendered(v) && (!pred || pred(v));
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        await stageAt(tag, at);
        if (Number.isFinite(hold)) await cdp.eval(call(`hold('${tag}', ${hold})`));
        try { last = await cdp.eval(PROBE); } catch (err) { last = { evalError: String(err?.message || err) }; }
        try { if (match(last)) return last; } catch { /* keep polling */ }
        await sleep(150);
      }
      return last;
    };
    // A card is CLOSED when its root is not displayed and the public flags say
    // so. `card.present` only means the DOM node exists — hail.js builds it
    // once at init and hides it, so demanding node removal (attempt2's L4/L7)
    // can never pass and proves nothing.
    const cardClosed = (v) => !!(v && v.card && v.card.display !== 'block'
      && v.hail && v.hail.open === false && v.hailOpenFlag === false);
    // Press the ordinary hail key and return the NEW public hailMiss row.
    // `t` is the ring's own event timestamp: a fresh row must carry a strictly
    // later `t` than the newest row already present, so a stale identical
    // refusal from the previous press can never satisfy this wait.
    const newestMiss = (v) => (v && v.misses && v.misses.length ? v.misses[v.misses.length - 1] : null);
    const missMark = async () => {
      const v = await cdp.eval(PROBE);
      const m = newestMiss(v);
      return { n: v && v.misses ? v.misses.length : 0, t: m && Number.isFinite(m.t) ? m.t : -1 };
    };
    const pressHail = async (want, mark) => {
      const base = mark || await missMark();
      await cdp.eval(KEY('KeyH', 'h'));
      const fresh = (s) => {
        const m = newestMiss(s);
        if (!m) return false;
        const later = Number.isFinite(m.t) ? m.t > base.t : (s.misses.length > base.n);
        if (!later) return false;
        return !want || m.reason === want;
      };
      const v = await waitUntil(PROBE, fresh, 6000);
      return { probe: v, miss: fresh(v) ? newestMiss(v) : null, base };
    };
    // The meta line must never gain passive issue-#67 text. Checked at every
    // rendered read below, in every state and under every blocker.
    const PASSIVE = ['NO TERMS', 'NO HAIL CLAIM', 'NO FURTHER TERMS', 'CLOSE TO SALVAGE'];
    const metaClean = (v) => !!(v && v.hud && typeof v.hud.meta === 'string'
      && PASSIVE.every((w) => !v.hud.meta.includes(w)));

    // Fixture constants. LOW/BARG are the seeded INITIAL resolves that put a
    // quiet hull in the capitulate / bargaining band; NEAR is the reported
    // Claim Wren distance, comfortably inside the 600 u hail range. The
    // out-of-range rows below use their own explicit 900 u and never these.
    const LOW = 8;
    const BARG = 30;
    const NEAR = 176;

    // ================= L1 front door: fresh Marked origin =================
    {
      await stage();
      // The front-door receipt taken above, before any fixture mutation.
      const natural = results.origin;
      // Quiet, UNTHREATENED low-morale fixture: a civilian record with no
      // hunt intent, so npc.js's resolve tick stays in its early return and
      // the seeded capitulate-band resolve actually holds. attempt2 spawned a
      // hunting pirate here and read DEFIANT.
      const spawned = JSON.parse(await cdp.eval(call(`spawn('fresh', 'Marked Contact', 60, ${LOW}, false)`)));
      await cdp.eval(call("park()"));
      // Post-fixture economic baseline (5000, set by the survivability block),
      // deliberately distinct from the pre-fixture origin receipt above.
      const before = await waitUntil(PROBE, (s) => !!(s && s.target !== undefined), 4000);
      const p = await lockAndRead('fresh', (v) => v.target.hail.state === 'willing'
        && v.hud.resolve.indexOf('WILLING TO YIELD') === 0, { at: 350, hold: LOW });
      await cdp.shot('01-l1-fresh-marked-origin.png');
      const state = JSON.parse(await cdp.eval(call("effects('fresh')")));
      record('L1', !!(spawned.ok
        && metaClean(p)
        && spawned.role === 'trader'
        && spawned.resolve === LOW
        && natural.origin === 'marked'
        && natural.fear === 15
        && natural.credits === 350
        // A low seeded resolve is willingness, never a completed surrender,
        // and it pays nothing on its own.
        && p.target && p.target.hail && p.target.hail.state === 'willing'
        && p.target.surrendered === false
        && state.surrendered === false
        && state.credits === before.credits
        && state.fear === natural.fear),
      { originReceipt: natural, spawned, hail: p.target && p.target.hail, state, fixtureBaselineCredits: before.credits });
    }

    // ================= L2 low morale: bracket, prompt, real KeyH ==========
    {
      // Wait for the RENDERED status word, not just public state.
      const p = await lockAndRead('fresh', (v) => /^WILLING TO YIELD|^BARGAINING/.test(v.hud.resolve)
        && v.target.hail.state === 'willing', { at: NEAR, hold: LOW });
      await cdp.shot('02-l2-no-terms-bracket.png');
      const bandWord = p.hud.resolve;
      const before = p;
      const { probe: after, miss } = await pressHail('no-answer');
      await cdp.shot('03-l2-no-answer-toast.png');
      record('L2', !!(p.hud.bracketHidden === false
        // The one existing line names the morale honestly...
        && /^WILLING TO YIELD|^BARGAINING/.test(bandWord)
        // ...and the meta line gains NOTHING passive.
        && metaClean(p)
        && p.hud.meta.includes('u')
        // No prompt advertising a key that opens nothing.
        && (p.hud.promptHidden === true || p.hud.promptVerb !== 'Hail')
        && p.target.hail.available === false
        && p.target.hail.reason === 'no-answer'
        && /offered no terms/i.test(p.target.hail.next)
        // The real key press answers with the same word, and opens no card.
        && miss && miss.reason === 'no-answer' && miss.verb === 'hail'
        && cardClosed(after)
        && after.credits === before.credits && after.fear === before.fear),
      { hud: p.hud, hail: p.target.hail, miss, before: { credits: before.credits, fear: before.fear }, after: { credits: after.credits, fear: after.fear } });
    }

    // ================= L3 earned yield through the PUBLIC path ============
    {
      const p0 = await lockAndRead('fresh', (v) => v.target.hail.state === 'willing'
        && v.hud.resolve.indexOf('WILLING TO YIELD') === 0, { at: NEAR, hold: LOW });
      // The game's own bargaining card for this hull, with the ordinary verbs.
      const card = await openCardFor('fresh', {
        intents: ['demandRansom', 'letGo', 'keepFiring'],
        line: 'They are breaking.',
      });
      await cdp.shot('04-l3-bargaining-card.png');
      const creditsBefore = card.credits;
      // Resolved by the PUBLIC handle, bound to the live conversation.
      const receipt = JSON.parse(await cdp.eval(
        `(() => JSON.stringify(window.rimward.act({ v: 2, name: 'hailResolve', args: { intent: 'demandRansom', expectedConversationId: ${JSON.stringify(card.hail.conversationId)} } })))()`));
      // The RENDERED bracket must actually show the yield. attempt2 accepted
      // the public state alone and recorded a stale DEFIANT bracket. No `hold`
      // here: the hull has yielded and bag.hold refuses a settled outcome, so
      // only the spatial staging keeps it selectable while the UI is read.
      const p = await lockAndRead('fresh', (v) => v.target.hail.state === 'yielded'
        && v.hud.resolve.indexOf('YIELDED') === 0
        && v.hud.band === 'capitulate', { at: NEAR });
      await cdp.shot('05-l3-yielded-bracket.png');
      record('L3', !!(p0.target.hail.state === 'willing'
        && receipt.ok === true
        // The surrender is the game's, not the probe's.
        && p.target.surrendered === true
        && p.target.hail.state === 'yielded'
        && p.target.hail.available === false
        && p.target.hail.reason === 'yielded'
        && p.target.hail.next === 'They have already yielded. No further terms to negotiate.'
        // The SAME line changed word: WILLING TO YIELD before, YIELDED after.
        && p0.hud.resolve.indexOf('WILLING TO YIELD') === 0
        && p.hud.resolve.indexOf('YIELDED') === 0
        // ...and the dataset band vocabulary is unchanged.
        && p.hud.band === 'capitulate'
        && metaClean(p)
        && (p.hud.promptHidden === true || p.hud.promptVerb !== 'Hail')
        && p.credits > creditsBefore),
      { receipt, before: p0.target.hail, after: p.target.hail,
        hudBefore: p0.hud, hudAfter: p.hud, creditsBefore, creditsAfter: p.credits });
    }

    // ================= L4 repeated public H pays nothing twice ============
    {
      const before = await lockAndRead('fresh', (v) => v.target.hail.state === 'yielded',
        { at: NEAR });
      // Every press is RETAINED. Each one must produce its own fresh 'yielded'
      // refusal, open no card, and leave credits/fear/pods/hold untouched, and
      // the aggregate below requires all of them - no per-press pin is dropped.
      const presses = [];
      let mark = await missMark();
      let last = before;
      for (let i = 0; i < 3; i++) {
        await cdp.eval(call(`place('fresh', ${NEAR})`)); // harness-only staging
        const r = await pressHail('yielded', mark);
        last = r.probe;
        presses.push({
          i,
          miss: r.miss,
          freshRefusal: !!(r.miss && r.miss.reason === 'yielded' && r.miss.verb === 'hail'),
          isNewRow: !!(r.miss && (!Number.isFinite(r.miss.t) || r.miss.t > r.base.t)),
          noCard: cardClosed(last),
          noEffect: last.credits === before.credits && last.fear === before.fear
            && last.pods === before.pods && last.hold === before.hold,
        });
        mark = { n: last.misses.length, t: r.miss && Number.isFinite(r.miss.t) ? r.miss.t : mark.t };
      }
      await cdp.shot('06-l4-repeat-h.png');
      const state = JSON.parse(await cdp.eval(call("effects('fresh')")));
      const allPresses = presses.length === 3 && presses.every((r) =>
        r.freshRefusal && r.isNewRow && r.noCard && r.noEffect);
      record('L4', !!(allPresses
        && metaClean(last)
        && last.credits === before.credits
        && last.fear === before.fear
        && last.pods === before.pods
        && last.hold === before.hold
        && state.surrendered === true),
      { presses,
        before: { credits: before.credits, fear: before.fear, pods: before.pods, hold: before.hold },
        after: { credits: last.credits, fear: last.fear, pods: last.pods, hold: last.hold } });
    }

    // ================= L5 own card and unrelated card ======================
    {
      // 5a. an UNRELATED card must not erase the selected hull's YIELDED state
      const other = JSON.parse(await cdp.eval(call(`spawn('other', 'Deel Sallow', 70, ${BARG}, false)`)));
      await cdp.eval(call("park()"));
      await cdp.eval(call("place('other', 200)"));
      await openCardFor('other', {
        intents: ['demandRansom', 'letGo', 'keepFiring'],
        line: 'They are breaking.',
      });
      // The yielded hull has drifted; stage it back into range so the public
      // selection can happen at all (attempt2 died here), then require the
      // RENDERED yield to still be on the bracket beside the unrelated card.
      const withUnrelated = await lockAndRead('fresh', (v) => v.hailOpenFlag === true
        && v.target.hail.state === 'yielded'
        && v.hud.resolve.indexOf('YIELDED') === 0, { at: NEAR });
      await cdp.shot('07-l5-unrelated-card.png');

      // 5b. this hull's OWN card must not disturb its own status word
      await stage();
      const low = JSON.parse(await cdp.eval(call(`spawn('own', 'Red Marlow', 80, ${BARG}, false)`)));
      await cdp.eval(call("park()"));
      const noCard = await lockAndRead('own', (v) => v.hud.resolve.indexOf('BARGAINING') === 0
        && v.target.hail.state === 'willing', { at: 220, hold: BARG });
      await openCardFor('own', {
        intents: ['demandRansom', 'letGo', 'keepFiring'],
        line: 'They are breaking.',
      });
      const withOwn = await lockAndRead('own', (v) => v.hailOpenFlag === true
        && v.target.hail.blocked === 'busy', { at: 220 });
      await cdp.shot('08-l5-own-card.png');
      record('L5', !!(other.ok && low.ok
        // unrelated card open: the selected hull keeps its own outcome
        && withUnrelated.hailOpenFlag === true
        && withUnrelated.target.hail.state === 'yielded'
        && withUnrelated.hud.resolve.indexOf('YIELDED') === 0
        && metaClean(withUnrelated)
        // own card open: the morale word persists, the contradiction does not
        && noCard.hud.resolve.indexOf('BARGAINING') === 0
        && withOwn.target.hail.state === 'willing'
        && withOwn.hud.resolve.indexOf('BARGAINING') === 0
        && withOwn.target.hail.blocked === 'busy'
        && withOwn.target.hail.reason === ''
        && /card/i.test(withOwn.target.hail.next)
        && metaClean(noCard) && metaClean(withOwn)),
      { unrelated: { hail: withUnrelated.target.hail, hud: withUnrelated.hud },
        ownBefore: noCard.hud, ownDuring: { hail: withOwn.target.hail, hud: withOwn.hud } });
      await cdp.eval(call("remove('other')"));
      await cdp.eval(call("remove('own')"));
      await cdp.eval(call("remove('fresh')"));
    }

    // ================= L6 intact empty holds read the same =================
    {
      await stage();
      const laden = JSON.parse(await cdp.eval(call(`spawn('laden', 'Grey Tern', 60, ${LOW}, false)`)));
      const empty = JSON.parse(await cdp.eval(call(`spawn('hollow', 'Hollow Skiff', 75, ${LOW}, false)`)));
      await cdp.eval(call("park()"));
      await cdp.eval(call("emptyHolds('hollow')"));
      const a = await lockAndRead('laden', (v) => v.hud.resolve.indexOf('WILLING TO YIELD') === 0
        && v.target.hail.state === 'willing', { at: 170, hold: LOW });
      const b = await lockAndRead('hollow', (v) => v.hud.resolve.indexOf('WILLING TO YIELD') === 0
        && v.target.hail.state === 'willing', { at: 170, hold: LOW });
      await cdp.shot('09-l6-empty-holds.png');
      const strip = (row) => JSON.stringify({ ...row.target.hail });
      record('L6', !!(laden.ok && empty.ok
        && a.target.hail.state === 'willing' && b.target.hail.state === 'willing'
        && strip(a) === strip(b)
        // both read the same status word and neither leaks the manifest
        && a.hud.resolve === b.hud.resolve
        && metaClean(a) && metaClean(b)
        // the manifest is never published on either row
        && !Object.hasOwn(a.target, 'cargo') && !Object.hasOwn(b.target, 'cargo')
        && JSON.stringify(Object.keys(a.target).sort()) === JSON.stringify(Object.keys(b.target).sort())),
      { laden: a.target.hail, empty: b.target.hail, keys: Object.keys(b.target).sort() });
      await cdp.eval(call("remove('laden')"));
    }

    // ================= L7 disabled salvage, empty holds, no reward ========
    {
      await cdp.eval(call("disable('hollow')"));
      const p = await lockAndRead('hollow', (v) => v.target.hail.available === true
        && v.hud.resolve.indexOf('DEAD IN SPACE') === 0
        && v.hud.promptHidden === false, { at: 170 });
      const before = p;
      await cdp.eval(KEY('KeyH', 'h'));
      const card = await waitUntil(PROBE, (s) => !!(s && s.card && s.card.display === 'block'
        && s.hail && s.hail.open === true), 8000);
      await cdp.shot('10-l7-salvage-card.png');
      const after = await waitUntil(PROBE, (s) => !!s, 1000);
      record('L7', !!(p.hud.resolve.indexOf('DEAD IN SPACE') === 0
        && metaClean(p)
        && p.target.hail.state === 'salvage'
        && p.target.hail.available === true
        && p.hud.promptHidden === false
        && p.hud.promptVerb === 'Hail — dead in space'
        // The ordinary key really opened the rendered salvage card...
        && card.card.display === 'block'
        && card.hail.kind === 'salvage'
        && /Holds are empty/.test(String(card.card.leaf.join(' ')))
        // ...and empty holds offer no cargo verb and moved no reward.
        && card.card.buttons.every((b) => !/cargo/i.test(b))
        && card.hail.intents.indexOf('demandCargo') < 0
        && after.credits === before.credits
        && after.pods === before.pods
        && after.hold === before.hold),
      { hud: p.hud, hail: p.target.hail, buttons: card.card.buttons, intents: card.hail.intents,
        before: { credits: before.credits, pods: before.pods, hold: before.hold },
        after: { credits: after.credits, pods: after.pods, hold: after.hold } });
    }

    // ================= L8 out of range: DEAD IN SPACE + real range miss ====
    {
      await stage();
      // A REAL out-of-range distance. `at` is the caller's own 900 u, so the
      // staging that keeps the hull steady can never pull it inside 600 u.
      const far = await cdp.eval(call("place('hollow', 900)"));
      const p = await lockAndRead('hollow', (v) => v.target.hail.blocked === 'range'
        && v.target.range > 600, { at: 900 });
      await cdp.shot('11-l8-out-of-range.png');
      const { probe: after, miss } = await pressHail('range');
      record('L8', !!(Number(far) > 600
        // the persistent status word survives the transient blocker...
        && p.hud.resolve.indexOf('DEAD IN SPACE') === 0
        && p.target.hail.state === 'salvage'
        // ...the existing meta line already carries the real distance, and
        // NOTHING passive is added to it
        && metaClean(p)
        && p.hud.meta.includes('u')
        // ...but nothing is advertised or offered
        && p.target.hail.available === false
        && p.target.hail.blocked === 'range'
        && /close in/i.test(p.target.hail.next)
        && (p.hud.promptHidden === true || p.hud.promptVerb !== 'Hail — dead in space')
        // and the real key answers range, with the measured distance
        && miss && miss.reason === 'range' && miss.verb === 'salvage'
        && Number.isFinite(miss.dist) && miss.dist > 600
        && cardClosed(after)),
      { far, hud: p.hud, hail: p.target.hail, miss });
      await cdp.eval(call("remove('hollow')"));
    }

    // ================= L9 overlap: an open chart outranks everything =======
    // Quinn's QA found the shared feedback and the real key disagreeing here:
    // a far disabled hull published 'range' while KeyH emitted 'overlay-chart'.
    // Both hulls below are checked with the chart up, through the ordinary
    // chart key, and then again with the chart closed.
    {
      await stage();
      const far = JSON.parse(await cdp.eval(call(`spawn('overlap', 'Long Marlin', 60, ${LOW}, false)`)));
      const low = JSON.parse(await cdp.eval(call(`spawn('lowmoral', 'Pale Freida', 75, ${LOW}, false)`)));
      await cdp.eval(call("park()"));
      await cdp.eval(call("disable('overlap')"));

      // 900 u is real and stays real through every staged re-place.
      const farClear = await lockAndRead('overlap', (v) => v.target.hail.blocked === 'range'
        && v.target.range > 600, { at: 900 });
      // Ordinary chart key, exactly as a player opens it.
      await cdp.eval(KEY('KeyM', 'm'));
      const farChart = await lockAndRead('overlap', (v) => v.target.hail.blocked === 'overlay-chart',
        { at: 900 });
      const farMiss = await pressHail('overlay-chart');
      await cdp.shot('12-l9-chart-overlap.png');
      const lowChart = await lockAndRead('lowmoral', (v) => v.target.hail.blocked === 'overlay-chart',
        { at: 200, hold: LOW });
      const lowMiss = await pressHail('overlay-chart');
      await cdp.eval(KEY('KeyM', 'm'));
      const lowClear = await lockAndRead('lowmoral', (v) => v.target.hail.blocked === ''
        && v.hud.resolve.indexOf('WILLING TO YIELD') === 0, { at: 200, hold: LOW });

      record('L9', !!(far.ok && low.ok
        && far.role === 'trader' && low.role === 'trader'
        // with the chart closed each hull speaks for itself
        && farClear.target.hail.state === 'salvage'
        && farClear.target.hail.reason === 'range'
        && lowClear.target.hail.state === 'willing'
        && lowClear.target.hail.reason === 'no-answer'
        // with the chart open the overlay owns the refusal for BOTH...
        && farChart.target.hail.blocked === 'overlay-chart'
        && farChart.target.hail.reason === 'overlay-chart'
        && lowChart.target.hail.blocked === 'overlay-chart'
        && lowChart.target.hail.reason === 'overlay-chart'
        // ...the persistent state is untouched by the overlay...
        && farChart.target.hail.state === 'salvage'
        && lowChart.target.hail.state === 'willing'
        // ...and the real key agrees with the published reason, for both.
        && farMiss.miss && farMiss.miss.reason === 'overlay-chart'
        && lowMiss.miss && lowMiss.miss.reason === 'overlay-chart'
        // and no state, blocked or overlay ever adds passive bracket text
        && [farClear, farChart, lowChart, lowClear].every(metaClean)),
      { farClear: farClear.target.hail, farChart: farChart.target.hail, farMiss: farMiss.miss,
        lowClear: lowClear.target.hail, lowChart: lowChart.target.hail, lowMiss: lowMiss.miss });
      await cdp.eval(call("remove('overlap')"));
      await cdp.eval(call("remove('lowmoral')"));
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
    // Remove only a directory this run created: an immediate child of the
    // explicit profile root whose name carries our own prefix.
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
      console.log('\nISSUE-67 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-67 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
