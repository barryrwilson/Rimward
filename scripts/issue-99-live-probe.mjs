/**
 * Issue #99 live verification — surrender attribution: who broke the hull
 * decides who is owed for the yield.
 *
 * Drives the dev app in headless Chrome over CDP and reads only the rendered
 * DOM, the public `window.rimward` handle and read-only `window.__ctx`
 * snapshots:
 *
 *   N1  NPC-attributed break bargains silently — the live NPC update samples the
 *       hull down into the `bargaining` band with no rendered surrender card, no
 *       public open card and no payout
 *   N2  NPC-attributed break yields anyway — the same hull at a quarter hull
 *       walks on into capitulation through the real NPC loop: the public target
 *       row reads hail.state 'yielded' and surrendered true, the lane records a
 *       new 'surrendered' incident with causer 'world', and no credits, fear or
 *       firstCapitulation milestone are granted. A REAL H press afterwards opens
 *       no card and pays nothing a second time
 *   P1  player-attributed break pays the player — a fresh fixture whose initial
 *       combat history names the player enters `bargaining` through the same
 *       live loop, the surrender card is really rendered and the public terms
 *       are readable. Resolving the printed ransom through the bound public
 *       `rimward.act` hailResolve increases credits by exactly that amount, the
 *       hull is yielded, and the new incident names the player
 *   S1  staged NPC takeover at the click boundary — a rendered player card whose
 *       lastAttacker becomes 'npc' in ONE evaluation, immediately followed by a
 *       retained DOM button click on the "Demand ransom" button before a frame
 *       can close the card. Nothing moves and the card closes. The API side of
 *       this guard is covered by P1's bound resolve and by the focused suite
 *   C1  a real surrender card really converts to salvage — the positive
 *       counterpart to S1: a legitimately player-attributed card is opened by
 *       the live resolve, then the hull is actually disabled. The live hail
 *       maintenance converts the conversation in place: a NEW conversationId,
 *       a rendered salvage card with no ransom amount, no surrender flag and
 *       unchanged credits and fear. Letting the hulk go through the bound
 *       public hailResolve succeeds and still pays nothing. Rejecting the
 *       ORIGINAL card whose attribution lapsed is therefore distinct from this
 *       legitimate later conversion
 *
 * FIXTURE DISCLOSURE (privilegedFixture, recorded in result.json):
 * A hull broken to the bargaining band cannot be waited for in a live session,
 * so each fixture is spawned and given an INITIAL COMBAT HISTORY directly:
 * resolve 50, personality 0, screen 0, shell 0, hull at a stated fraction of
 * hullMax, engine full, empty cargo, a fresh lastCombatAt, and an ai record of
 * band 'shaken', resolveAt 0, calmUntil 0, hailed false, demandSent true (which
 * suppresses the unrelated wave-30 pirate demand) and lastAttacker set to 'npc'
 * or 'player' as each pin discloses. Ambient hulls are parked outside the
 * engagement bubble and the player's own defenses are topped up so the pass is
 * survivable and the sampled numbers are the ones the pins describe.
 *
 * These are PRIVILEGED INITIAL STATES, not a claim that this combat was
 * naturally encountered. C1 additionally sets ONE further live field on its own
 * fixture — `state.disabled = true`, AFTER the real surrender card has opened —
 * to stage the rare disable transition; the conversion to a salvage card is
 * still the live hail maintenance's own work. What is never written: no
 * `hailOpened` and no
 * `npcSurrendered` is synthesised, and no expected outcome — `state.surrendered`,
 * the band, the card, credits, fear, incidents and milestones — is ever written
 * by this harness. Every outcome below is produced by the live NPC update, the
 * live hail card and the live world ledger. No new runtime debug API is added.
 *
 * Run: node scripts/issue-99-live-probe.mjs   (npm run test:surrender-attribution-live)
 * Output: out/issue-99/live/ (ignored path).
 *
 * Isolation and dev-server fixture follow scripts/issue-100-live-probe.mjs: an
 * OS-assigned loopback Vite port started through `createServer` with
 * `server: { watch: null }` and `optimizeDeps: { noDiscovery: true, include: [] }`
 * (the cold dependency scan and the chokidar watcher startup both stall the page
 * on this workspace), an OS-assigned CDP port, a fresh Chrome profile outside
 * the repository, and teardown of only the processes and profile this run
 * created. Application source, vite.config.js and the bundle budget are
 * untouched.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE99_OUT || join(repo, 'out', 'issue-99', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE99_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.ISSUE99_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue99-surrender-';
const PINS = ['N1', 'N2', 'P1', 'S1', 'C1'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  commit: process.env.ISSUE99_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  boot: null,
  privilegedFixture: {
    what: "each fixture hull is spawned and given an INITIAL COMBAT HISTORY: resolve 50, personality 0, screen 0, shell 0, hull at the stated fraction of hullMax, engine full, empty cargo, fresh lastCombatAt, ai.band 'shaken', ai.resolveAt 0, ai.calmUntil 0, ai.hailed false, ai.demandSent true (suppresses the unrelated wave-30 demand hail) and ai.lastAttacker 'npc' or 'player' as each pin discloses",
    alsoStaged: 'ambient hulls parked outside the engagement bubble, player defenses topped up to full so the pass is survivable, player placed at 6000,6000,6000 with the fixture near 6000,6000,5940, and ctx.targets.current pointed at the fixture so the PUBLIC target row can be read',
    c1Disable: "C1 sets ONE further live field on its own fixture, state.disabled = true, AFTER the real surrender card has opened, to stage the rare disable transition; no hail is emitted, no card kind is written, and the in-place conversion to a salvage card is the live hail maintenance's own work",
    neverWritten: 'no synthetic hailOpened, no synthetic npcSurrendered, and no expected outcome: state.surrendered, ai.band, the rendered card, credits, fear, incidents and milestones are produced only by the live NPC update, the live hail card and the live world ledger',
    honesty: 'these are privileged INITIAL states, not a claim that the combat history was naturally encountered in this session; the S1 lastAttacker flip to npc and the C1 disabled flag are likewise STAGED transitions',
  },
  devServerNote: "harness-only dev server: vite createServer with server { watch: null } and optimizeDeps { noDiscovery: true, include: [] }, as scripts/issue-100-live-probe.mjs documents. App source, vite.config.js and the production bundle budget are unchanged",
  fixtures: {},
  pins: {},
  consoleErrors: [],
  exceptions: [],
};

function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1400));
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
 * One synchronous read-only sample of the rendered card, the public observation
 * and the public target row, so a transition can never be sampled twice at two
 * different instants. Nothing here writes.
 */
const PROBE = `(() => {
  const card = document.querySelector('.rw-hail-card');
  const root = card ? card.parentElement : null;
  const leaf = card
    ? [...card.querySelectorAll('div')]
      .filter((d) => d.querySelectorAll('div').length === 0)
      .map((d) => (d.textContent || '').trim())
    : [];
  const buttons = card
    ? [...card.querySelectorAll('button')].map((b) => (b.textContent || '').trim())
    : [];
  const rw = window.rimward || null;
  const o = rw ? rw.observe() : null;
  const c = window.__ctx;
  const target = o && o.targets ? o.targets.current : null;
  return {
    card: {
      present: !!card,
      display: root ? getComputedStyle(root).display : null,
      header: leaf.find((t) => t.indexOf('HAIL —') === 0) || null,
      leaf,
      buttons,
    },
    hail: o ? o.hail : null,
    target: target ? {
      id: target.id, name: target.name,
      surrendered: target.surrendered === true,
      hail: target.hail || null,
      resolveBand: target.resolveBand || null,
      hull: target.hull ?? null,
    } : null,
    credits: o && o.world ? o.world.credits : null,
    fear: o && o.world ? o.world.fear : null,
    hailOpenFlag: c ? c.flags.hailOpen === true : null,
    // Read-only ledger sample: milestones and incidents are not public surface.
    milestones: c ? c.world.milestones.slice() : null,
    incidents: c ? c.world.incidents.length : null,
    lastIncidents: c ? c.world.incidents.slice(-4).map((i) => ({
      kind: i.kind, name: i.name, causer: i.causer, outcome: i.outcome ?? null,
    })) : null,
  };
})()`;

/** privilegedFixture staging, installed once on the live page. */
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
  const deadline = Date.now() + 15000;
  while (!tries.some(readyOf) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!tries.some(readyOf)) {
    throw new Error('issue99 SETUP: no authored ship asset ready within 15000ms: ' + tries.map(label).join(', '));
  }
  const bag = { ships: {}, used: null };
  // The player sits at a fixed clear point; every fixture is placed 60 units
  // down the -Z line, well inside target range.
  bag.place = () => {
    c.ship.object.position.set(6000, 6000, 6000);
    const p = c.player;
    if (p) { p.hull = p.hullMax; p.screen = p.screenMax; p.shell = p.shellMax; }
    return true;
  };
  bag.park = () => {
    const mine = Object.values(bag.ships);
    let n = 0;
    for (const s of c.ships) {
      if (!s || !s.object || mine.indexOf(s) >= 0) continue;
      s.object.position.set(15000, 15000, 15000);
      if (s.ai) { s.ai.mode = 'loiter'; s.ai.intent = false; s.ai.target = null; }
      n++;
    }
    return n;
  };
  bag.spawn = (tag, pilot) => {
    bag.place();
    const pos = c.ship.object.position.clone();
    pos.z -= 60; // ~6000,6000,5940
    let live = null;
    let used = null;
    for (const t of tries) {
      if (!readyOf(t)) continue;
      live = spawnLiveShip(c, {
        id: 'i99-' + tag + '-' + Date.now(),
        name: tag,
        pilot,
        classKey: t.classKey,
        faction: t.faction,
        role: t.role,
        resolve: 50,
        personality: 0,
      }, pos);
      if (live) { used = label(t); break; }
    }
    if (!live) return { ok: false, tag };
    c.ships.push(live);
    bag.ships[tag] = live;
    bag.used = used;
    bag.park();
    // Read the fixture through the PUBLIC target row for the rest of the run.
    if (c.targets) c.targets.current = live;
    return { ok: true, tag, pilot, asset: used, id: live.id };
  };
  /**
   * privilegedFixture: the disclosed INITIAL combat history. hullFrac and
   * attacker are stated by the caller and echoed back into the ledger. No
   * outcome is written here — the band, the card and the yield are the live
   * NPC update's own work.
   */
  bag.history = (tag, hullFrac, attacker) => {
    const s = bag.ships[tag];
    if (!s) return null;
    bag.place();
    const st = s.state;
    st.resolve = 50;
    st.personality = 0;
    st.screen = 0;
    st.shell = 0;
    st.hull = st.hullMax * hullFrac;
    st.engine = st.engineMax;
    st.cargo = [];
    st.lastCombatAt = c.world.time;
    const ai = s.ai;
    ai.band = 'shaken';
    ai.resolveAt = 0;
    ai.calmUntil = 0;
    ai.hailed = false;
    ai.demandSent = true; // suppress the unrelated wave-30 pirate demand hail
    ai.lastAttacker = attacker;
    return { tag, hullFrac, lastAttacker: attacker, resolve: st.resolve };
  };
  /** Ask for the next resolve sample without touching the outcome. */
  bag.resample = (tag) => {
    const s = bag.ships[tag];
    if (!s) return false;
    s.state.lastCombatAt = c.world.time;
    s.ai.resolveAt = 0;
    s.ai.calmUntil = 0;
    return true;
  };
  /** Read-only: the band and resolve the live loop has computed so far. */
  bag.band = (tag) => {
    const s = bag.ships[tag];
    if (!s) return null;
    return {
      band: s.ai.band || null,
      resolve: Math.round(s.state.resolve * 100) / 100,
      surrendered: s.state.surrendered === true,
      hullFrac: s.state.hull / s.state.hullMax,
      lastAttacker: typeof s.ai.lastAttacker === 'string' ? s.ai.lastAttacker : (s.ai.lastAttacker ? 'ship' : null),
    };
  };
  /** Everything a resolution would move. Read-only. */
  bag.effects = (tag) => {
    const s = bag.ships[tag];
    return {
      credits: c.world.credits,
      fear: c.world.fear,
      incidents: c.world.incidents.length,
      milestones: c.world.milestones.length,
      firstCapitulation: c.world.milestones.includes('firstCapitulation'),
      surrendered: !!(s && s.state && s.state.surrendered),
      cargo: s && s.state && Array.isArray(s.state.cargo)
        ? s.state.cargo.map((r) => r.commodity + ':' + r.units).join(',') : null,
      mode: s && s.ai ? (s.ai.mode || null) : null,
      calmUntil: s && s.ai ? (s.ai.calmUntil ?? null) : null,
      hailOpen: c.flags.hailOpen === true,
    };
  };
  bag.remove = (tag) => {
    const s = bag.ships[tag];
    if (!s) return false;
    const i = c.ships.indexOf(s);
    if (i >= 0) c.ships.splice(i, 1);
    try { if (s.object) c.scene.remove(s.object); } catch {}
    if (c.targets && c.targets.current === s) c.targets.current = null;
    delete bag.ships[tag];
    return true;
  };
  window.__i99 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__i99.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;
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

    // ---- Chrome ------------------------------------------------------------
    chrome = spawn(CHROME, [
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check',
      // Platform GPU, as the issue #100 / #11 / #74 probes use.
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
      throw new Error('issue99 boot: window.rimward never appeared within 60000ms; last=' + JSON.stringify(handle));
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
    if (phase !== 'playing') throw new Error(`issue99 boot: session phase stuck at ${JSON.stringify(phase)}`);
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

    const setup = await cdp.eval(SETUP);
    say('fixture setup', String(setup));
    if (setup !== true) throw new Error('fixture setup failed');

    const bandOf = async (tag) => JSON.parse(await cdp.eval(call(`band('${tag}')`)));
    const effectsOf = async (tag) => JSON.parse(await cdp.eval(call(`effects('${tag}')`)));
    const cardUp = (s) => !!(s && s.card && s.card.display === 'block' && s.hail && s.hail.open === true);

    // ================= N1 an NPC-caused break bargains silently ============
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('npc-break', 'Sten Ilo')")));
      if (!spawned.ok) throw new Error('issue99 N1: fixture ship would not spawn');
      // DISCLOSED: initial combat history naming another NPC as the last
      // effective attacker, hull at 0.8 of max.
      const history = JSON.parse(await cdp.eval(call("history('npc-break', 0.8, 'npc')")));
      results.fixtures.N1 = { spawned, history };
      say('N1 fixture', JSON.stringify(history));
      const before = await cdp.eval(PROBE);
      await cdp.eval(call("resample('npc-break')"));
      // The LIVE npc update does the sampling; the probe only watches.
      const band = await waitUntil(call("band('npc-break')"), (v) => {
        try { return JSON.parse(v).band === 'bargaining'; } catch { return false; }
      }, 20000, 200);
      const sampled = JSON.parse(band);
      await sleep(1200); // give any card that WOULD open time to render
      const after = await cdp.eval(PROBE);
      const effects = await effectsOf('npc-break');
      await cdp.shot('01-n1-npc-break-no-card.png');
      record('N1', !!(sampled.band === 'bargaining'
        && sampled.surrendered === false
        && sampled.lastAttacker === 'npc'
        && after.card.display !== 'block'
        && after.card.header === null
        && after.hail.open === false
        && after.hailOpenFlag === false
        && effects.credits === before.credits
        && effects.fear === before.fear
        && effects.surrendered === false
        && effects.firstCapitulation === before.milestones.includes('firstCapitulation')),
      { history, sampled, before: { card: before.card.display, credits: before.credits, fear: before.fear }, after: { card: after.card, hail: after.hail, target: after.target }, effects });
    }

    // ================= N2 the same hull yields anyway, credited to the world =
    {
      const before = await cdp.eval(PROBE);
      // DISCLOSED: the SAME fixture's initial hull is lowered to 0.25 of max,
      // still attributed to the NPC attacker, and the next resolve sample is
      // requested. Capitulation itself is the live loop's work.
      const history = JSON.parse(await cdp.eval(call("history('npc-break', 0.25, 'npc')")));
      results.fixtures.N2 = { history };
      say('N2 fixture', JSON.stringify(history));
      await cdp.eval(call("resample('npc-break')"));
      // The yield and its ledger row land in the same world update, but the
      // observation is a separate frame: wait for BOTH the public surrendered
      // flag and this fixture's own new 'surrendered' incident, so the sample
      // can never precede the world event it is about to assert on.
      const yielded = await waitUntil(PROBE, (v) => !!(v && v.target && v.target.surrendered === true
        && v.incidents > before.incidents
        && (v.lastIncidents || []).some((i) => i.kind === 'surrendered' && i.name === 'npc-break' && i.causer === 'world')),
      25000, 200);
      const sampled = await bandOf('npc-break');
      const effects = await effectsOf('npc-break');
      await cdp.shot('02-n2-npc-yield-world.png');

      // Read the fixture's OWN surrender row, not whatever surrender happened last.
      const incident = (yielded.lastIncidents || [])
        .find((i) => i.kind === 'surrendered' && i.name === 'npc-break') || null;

      // A REAL H press on the yielded hull: no card, no second payout.
      await cdp.eval(KEY('KeyH', 'h'));
      await sleep(900);
      const afterH = await cdp.eval(PROBE);
      const afterHEffects = await effectsOf('npc-break');
      await cdp.shot('03-n2-after-h-press.png');

      record('N2', !!(sampled.surrendered === true
        && yielded.target && yielded.target.surrendered === true
        && yielded.target.hail && yielded.target.hail.state === 'yielded'
        && yielded.incidents > before.incidents
        && incident && incident.causer === 'world'
        && yielded.credits === before.credits
        && yielded.fear === before.fear
        && !effects.firstCapitulation
        && effects.milestones === before.milestones.length
        // and the H press changed nothing at all
        && afterH.card.display !== 'block'
        && afterH.hail.open === false
        && afterH.hailOpenFlag === false
        && afterHEffects.credits === before.credits
        && afterHEffects.fear === before.fear
        && afterHEffects.firstCapitulation === false),
      {
        history, sampled, incident,
        before: {
          card: before.card.display, credits: before.credits, fear: before.fear,
          incidents: before.incidents, milestones: before.milestones.length,
          target: before.target,
        },
        after: {
          card: yielded.card, hail: yielded.hail, target: yielded.target,
          credits: yielded.credits, fear: yielded.fear, incidents: yielded.incidents,
          lastIncidents: yielded.lastIncidents,
        },
        afterH: { card: afterH.card, hail: afterH.hail, target: afterH.target },
        afterHEffects,
      });
      await cdp.eval(call("remove('npc-break')"));
    }

    // ================= P1 a player-caused break pays the player ============
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('player-break', 'Vell Ord')")));
      if (!spawned.ok) throw new Error('issue99 P1: fixture ship would not spawn');
      // DISCLOSED: initial combat history naming the PLAYER as the last
      // effective attacker, hull at 0.8 of max.
      const history = JSON.parse(await cdp.eval(call("history('player-break', 0.8, 'player')")));
      results.fixtures.P1 = { spawned, history };
      say('P1 fixture', JSON.stringify(history));
      const before = await cdp.eval(PROBE);
      await cdp.eval(call("resample('player-break')"));
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      const sampled = await bandOf('player-break');
      await cdp.shot('04-p1-player-card.png');

      const ransom = card.hail?.terms?.amounts?.ransom ?? null;
      const conversationId = card.hail?.conversationId ?? null;
      const resolved = conversationId
        ? JSON.parse(await cdp.eval(act('hailResolve', {
          intent: 'demandRansom', expectedConversationId: conversationId,
        })))
        : { ok: false, token: 'no-conversation' };
      say('P1 hailResolve', JSON.stringify(resolved));
      // hailResolve returns before the world update that records the yield, so
      // waiting on `surrendered` alone can sample a frame ahead of the ledger.
      // Wait for the flag AND this fixture's own new player-attributed row.
      const paid = await waitUntil(PROBE, (v) => !!(v && v.target && v.target.surrendered === true
        && v.incidents > before.incidents
        && (v.lastIncidents || []).some((i) => i.kind === 'surrendered' && i.name === 'player-break' && i.causer === 'player')),
      15000, 200);
      const effects = await effectsOf('player-break');
      await cdp.shot('05-p1-player-paid.png');

      // Read the matching player-break row, not an arbitrary last surrender.
      const incident = (paid.lastIncidents || [])
        .find((i) => i.kind === 'surrendered' && i.name === 'player-break') || null;

      record('P1', !!(sampled.lastAttacker === 'player'
        && cardUp(card)
        && card.hail.kind === 'surrender'
        && card.card.header
        && Number.isFinite(ransom)
        && card.card.buttons.some((b) => /Demand ransom/i.test(b))
        && resolved.ok === true
        && paid.credits === before.credits + ransom
        && paid.target && paid.target.surrendered === true
        && paid.incidents > before.incidents
        && incident && incident.causer === 'player'),
      {
        history, sampled, ransom, conversationId, resolved,
        before: { credits: before.credits, fear: before.fear, incidents: before.incidents, card: before.card.display },
        card: { display: card.card.display, header: card.card.header, buttons: card.card.buttons, hail: card.hail, target: card.target },
        after: { credits: paid.credits, fear: paid.fear, incidents: paid.incidents, target: paid.target, lastIncidents: paid.lastIncidents },
        effects,
      });
      await cdp.eval(call("remove('player-break')"));
    }

    // ================= S1 a staged NPC takeover at the click boundary ======
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('click-race', 'Cass Odo')")));
      if (!spawned.ok) throw new Error('issue99 S1: fixture ship would not spawn');
      // DISCLOSED: initial combat history naming the PLAYER, hull 0.8 of max.
      const history = JSON.parse(await cdp.eval(call("history('click-race', 0.8, 'player')")));
      results.fixtures.S1 = { spawned, history };
      say('S1 fixture', JSON.stringify(history));
      await cdp.eval(call("resample('click-race')"));
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      if (!cardUp(card)) throw new Error('issue99 S1: the player card never rendered');
      await cdp.shot('06-s1-card-before-click.png');

      // ONE evaluation: the STAGED effective-NPC takeover is written and the
      // rendered button is clicked in the same synchronous stretch, so no
      // frame can close the card in between. This is a programmatic invocation
      // of the DOM button handler (button.click()), not physical human input;
      // the API boundary is covered by P1's bound resolve.
      const race = await cdp.eval(`(() => {
        const c = window.__ctx;
        const s = window.__i99.ships['click-race'];
        const before = window.__i99.effects('click-race');
        s.ai.lastAttacker = 'npc'; // staged takeover, disclosed in result.json
        const cardEl = document.querySelector('.rw-hail-card');
        const btn = cardEl
          ? [...cardEl.querySelectorAll('button')].find((b) => /Demand ransom/i.test(b.textContent || ''))
          : null;
        const clicked = !!btn;
        if (btn) btn.click();
        const after = window.__i99.effects('click-race');
        return { before, clicked, after, hailOpenNow: c.flags.hailOpen === true };
      })()`);
      say('S1 race', JSON.stringify(race).slice(0, 600));
      const closed = await waitUntil(PROBE, (v) => !!(v && v.hail && v.hail.open === false
        && v.card && v.card.display !== 'block'), 10000, 150);
      const effects = await effectsOf('click-race');
      await cdp.shot('07-s1-card-closed.png');

      const untouched = race.clicked === true
        && race.after.credits === race.before.credits
        && race.after.fear === race.before.fear
        && race.after.cargo === race.before.cargo
        && race.after.surrendered === race.before.surrendered
        && race.after.mode === race.before.mode
        && race.after.calmUntil === race.before.calmUntil
        && effects.credits === race.before.credits
        && effects.fear === race.before.fear
        && effects.cargo === race.before.cargo
        && effects.surrendered === race.before.surrendered
        && effects.incidents === race.before.incidents
        && effects.milestones === race.before.milestones;

      record('S1', !!(untouched
        && closed.hail && closed.hail.open === false
        && closed.card.display !== 'block'
        && closed.hailOpenFlag === false),
      {
        history, clicked: race.clicked,
        before: race.before, afterClick: race.after, settled: effects,
        closed: { display: closed.card.display, open: closed.hail && closed.hail.open, target: closed.target },
      });
      await cdp.eval(call("remove('click-race')"));
    }

    // ================= C1 a real surrender card converts to real salvage =====
    // The positive counterpart to S1/P1's refusals: rejecting the ORIGINAL card
    // whose attribution no longer holds must not also break the legitimate,
    // rare conversion of that same conversation into a salvage offer once the
    // hull is actually disabled. No source change is involved.
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('conversion', 'Ryn Halle')")));
      if (!spawned.ok) throw new Error('issue99 C1: fixture ship would not spawn');
      // DISCLOSED: the same legitimate initial history as P1 — the PLAYER as
      // last effective attacker, hull 0.8 of max. The surrender card below is
      // opened by the live NPC resolve, not by this harness.
      const history = JSON.parse(await cdp.eval(call("history('conversion', 0.8, 'player')")));
      results.fixtures.C1 = { spawned, history };
      say('C1 fixture', JSON.stringify(history));
      await cdp.eval(call("resample('conversion')"));
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      if (!cardUp(card)) throw new Error('issue99 C1: the surrender card never rendered');
      const before = await effectsOf('conversion');
      const firstId = card.hail?.conversationId ?? null;
      if (card.hail?.kind !== 'surrender' || !firstId) {
        throw new Error('issue99 C1: expected a live surrender conversation, got ' + JSON.stringify(card.hail));
      }

      // DISCLOSED FIXTURE: only this live fixture's `state.disabled` is set,
      // AFTER the real card opened, to stage the rare disable transition. No
      // hail is emitted, no card kind and no expected outcome is written — the
      // conversion itself is the live hail maintenance's own next-frame work.
      const staged = await cdp.eval(`(() => {
        const s = window.__i99.ships['conversion'];
        s.state.disabled = true;
        return { disabled: s.state.disabled === true };
      })()`);
      say('C1 staged disable', JSON.stringify(staged));

      const salv = await waitUntil(PROBE, (v) => !!(cardUp(v) && v.hail
        && v.hail.kind === 'salvage' && v.hail.conversationId
        && v.hail.conversationId !== firstId), 15000, 150);
      const afterConvert = await effectsOf('conversion');
      await cdp.shot('08-c1-salvage-conversion.png');

      const salvRansom = salv.hail?.terms?.amounts?.ransom ?? null;
      const salvId = salv.hail?.conversationId ?? null;
      const converted = cardUp(salv)
        && salv.hail.kind === 'salvage'
        && typeof salvId === 'string' && salvId.length > 0 && salvId !== firstId
        && salvRansom === null
        && !!salv.card.header
        && salv.card.buttons.length > 0
        && (salv.hail.intents || []).indexOf('letGo') >= 0
        && afterConvert.credits === before.credits
        && afterConvert.fear === before.fear
        && afterConvert.surrendered === false
        && salv.target && salv.target.surrendered === false;

      // Resolve the DISPLAYED salvage card through the bound public handle.
      const resolved = salvId
        ? JSON.parse(await cdp.eval(act('hailResolve', {
          intent: 'letGo', expectedConversationId: salvId,
        })))
        : { ok: false, token: 'no-conversation' };
      say('C1 hailResolve', JSON.stringify(resolved));
      await sleep(900);
      const settled = await effectsOf('conversion');
      const after = await cdp.eval(PROBE);

      record('C1', !!(converted
        && resolved.ok === true
        && settled.credits === before.credits
        && settled.fear === before.fear
        && after.credits === before.credits
        && after.fear === before.fear),
      {
        history, firstId, salvId, salvRansom, staged, resolved,
        before,
        salvage: {
          display: salv.card && salv.card.display, header: salv.card && salv.card.header,
          buttons: salv.card && salv.card.buttons, hail: salv.hail, target: salv.target,
        },
        afterConvert, settled,
        after: { credits: after.credits, fear: after.fear, card: after.card.display, hail: after.hail },
      });
      await cdp.eval(call("remove('conversion')"));
    }

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
      console.log('\nISSUE-99 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-99 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
