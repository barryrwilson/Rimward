/**
 * Issue #66 live verification — public hail conversation identity.
 *
 * Drives the dev app in headless Chrome over CDP and checks, against the real
 * rendered card and the real `window.rimward` handle:
 *
 *   H1  demand card       — header speaker, family, button labels, amount
 *   H2  surrender card    — a broken hull naming terms
 *   H3  salvage card      — opened by the ordinary KeyH press on a dead hulk
 *   H4  conversation card — a vouch offer, only the cost it prints
 *   H5  two ships         — the speaker is the card's ship, not the lock
 *   H6  stale identity    — a replaced card refuses and changes nothing
 *   H7  same-speaker      — a reopened card is a new conversation
 *   H8  salvage convert   — an in-place conversion is a new conversation
 *   H9  bound resolve     — the live token pays the printed demand
 *   H10 human paths       — the button click and the digit key still resolve
 *
 * FIXTURES: rare card families cannot be waited for in a live session, so a
 * clearly labelled controlled fixture spawns the ship and emits the ordinary
 * `hailOpened` the game itself emits (`privilegedFixture` in the ledger).
 * Ambient traffic is parked outside the encounter bubble, exactly as the
 * OPT-001 probe does. Everything the probe ASSERTS — selection, observation,
 * resolution — goes through the rendered DOM and the public handle. No
 * private state is written to fake an expected outcome, and no new runtime
 * debug API is exposed.
 *
 * Run: node scripts/hail66-live-probe.mjs
 * Output: out/issue-66/live/ (ignored path).
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
const outDir = process.env.HAIL66_OUT || join(repo, 'out', 'issue-66', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.HAIL66_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.HAIL66_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue66-hail-';
const PINS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  commit: process.env.HAIL66_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  boot: null,
  fixtureNote: 'privilegedFixture: ship spawn, ambient parking, hull pin, disabled flag and hailOpened emission stage rare card families; every assertion reads the rendered DOM or window.rimward',
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
    credits: c ? c.world.credits : null,
    hailOpenFlag: c ? c.flags.hailOpen === true : null,
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
  const tries = [
    { faction: 'redledger', classKey: 'cutter', role: 'pirate' },
    { faction: 'independent', classKey: 'cutter', role: 'trader' },
    { faction: 'freehold', classKey: 'cutter', role: 'trader' },
  ];
  const bag = { ships: {} };
  bag.spawn = (tag, pilot, dx) => {
    const pos = c.ship.object.position.clone();
    pos.x += dx;
    let live = null;
    for (const t of tries) {
      live = spawnLiveShip(c, {
        id: 'h66-' + tag + '-' + Date.now(),
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
    live._h66 = true;
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
  window.__h66 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__h66.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;
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
          /Freehold Greenhand/.test(el.textContent || ''));
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
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (results.boot.docked) { await cdp.eval(KEY('Digit8', '8')); await sleep(1500); }
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
    await cdp.eval(KEY('KeyF', 'f'));
    await sleep(120);
    await cdp.eval(KEY('KeyF', 'f'));
    await sleep(800);
    const setup = await cdp.eval(SETUP);
    say('fixture setup', String(setup));
    if (setup !== true) throw new Error('fixture setup failed');

    const stage = async () => {
      await cdp.eval(call('clear()'));
      await sleep(350);
    };
    const openCardFor = async (tag, ev) => {
      await cdp.eval(`(() => window.__h66.hail('${tag}', ${JSON.stringify(ev)}))()`);
      return waitUntil(PROBE, (v) => v && v.card.display === 'block'
        && v.hail && v.hail.open === true && v.hail.conversationId, 8000);
    };

    // ================= H1 demand ==========================================
    {
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('demand', 'Vane Rook', 90)")));
      await cdp.eval(call("arm('demand', 80)"));
      const p = await openCardFor('demand', {
        intents: ['payTribute', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand: 80,
        demandHail: true,
      });
      await cdp.shot('01-h1-demand.png');
      const line = cardLine(p.card);
      record('H1', !!(spawned.ok && p.card.display === 'block'
        && p.handleVersion === 2 && p.v === 2
        && p.hail.kind === 'demand'
        && p.hail.speaker && p.hail.speaker.name === 'Vane Rook'
        && p.card.header === 'HAIL — Vane Rook'
        && labelsMatch(p.hail, p.card)
        && p.hail.terms.line === line
        && line.includes('80 UU')
        && p.hail.terms.amounts.demand === 80
        && !Object.hasOwn(p.hail.terms.amounts, 'ransom')
        && !Object.hasOwn(p.hail.terms.amounts, 'tribute')),
      { spawned, card: p.card, hail: p.hail, line });
      await cdp.eval(call("remove('demand')"));
    }

    // ================= H2 surrender =======================================
    {
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('surrender', 'Deel Sallow', 95)")));
      const p = await openCardFor('surrender', {
        intents: ['demandRansom', 'acceptTribute', 'letGo', 'keepFiring'],
        line: 'They are breaking.',
      });
      await cdp.shot('02-h2-surrender.png');
      const amounts = p.hail && p.hail.terms ? p.hail.terms.amounts : {};
      const ransomLabel = p.card.buttons.find((b) => b.includes('Demand ransom')) || '';
      record('H2', !!(spawned.ok
        && p.hail.kind === 'surrender'
        && p.hail.speaker.name === 'Deel Sallow'
        && p.card.header === 'HAIL — Deel Sallow'
        && labelsMatch(p.hail, p.card)
        && cardLine(p.card) === '“They are breaking.”'
        && p.hail.terms.line === cardLine(p.card)
        && Number.isFinite(amounts.ransom)
        && ransomLabel.includes(`${amounts.ransom} UU`)
        && !Object.hasOwn(amounts, 'demand')),
      { spawned, card: p.card, hail: p.hail });
      await cdp.eval(call("remove('surrender')"));
    }

    // ================= H3 salvage (ordinary KeyH on a dead hulk) ==========
    {
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('salvage', 'Wren Ash', 70)")));
      await cdp.eval(call("disable('salvage')"));
      await cdp.eval(call("lock('salvage')"));
      await sleep(300);
      await cdp.eval(KEY('KeyH', 'h'));
      const p = await waitUntil(PROBE, (v) => v && v.card.display === 'block'
        && v.hail && v.hail.open === true && v.hail.kind === 'salvage', 8000);
      await cdp.shot('03-h3-salvage.png');
      record('H3', !!(spawned.ok
        && p.hail.kind === 'salvage'
        && p.hail.speaker.name === 'Wren Ash'
        && p.card.header === 'HAIL — Wren Ash'
        && labelsMatch(p.hail, p.card)
        && p.card.buttons.some((b) => b.includes('Leave the hulk'))
        && p.hail.terms.line === cardLine(p.card)
        && Object.keys(p.hail.terms.amounts).length === 0),
      { spawned, card: p.card, hail: p.hail, openedBy: 'KeyH' });
      await cdp.eval(call("remove('salvage')"));
    }

    // ================= H4 conversation ====================================
    {
      await stage();
      const spawned = JSON.parse(await cdp.eval(call("spawn('talk', 'Old Callow', 85)")));
      const cost = await cdp.eval(`(async () => (await import('/src/game/state.js')).CALLOW.vouchCost)()`);
      const p = await openCardFor('talk', {
        intents: ['callowVouch', 'keepFiring'],
        line: 'Back for more quiet?',
      });
      await cdp.shot('04-h4-conversation.png');
      record('H4', !!(spawned.ok
        && p.hail.kind === 'conversation'
        && p.hail.speaker.name === 'Old Callow'
        && p.card.header === 'HAIL — Old Callow'
        && labelsMatch(p.hail, p.card)
        && p.hail.terms.amounts.vouchCost === cost
        && Object.keys(p.hail.terms.amounts).length === 1
        && p.card.buttons[0] === `[1] Buy his vouch — ${cost} UU`),
      { spawned, cost, card: p.card, hail: p.hail });
      await cdp.eval(call("remove('talk')"));
    }

    // ================= H5 two ships, non-selected speaker =================
    {
      await stage();
      const a = JSON.parse(await cdp.eval(call("spawn('speaker', 'Ilse Vane', 80)")));
      const b = JSON.parse(await cdp.eval(call("spawn('bystander', 'Nem Corr', 140)")));
      await cdp.eval(call("lock('bystander')"));
      await sleep(250);
      const p = await openCardFor('speaker', {
        intents: ['letGo', 'keepFiring'],
        line: 'Hold your fire.',
      });
      await cdp.shot('05-h5-two-ships.png');
      record('H5', !!(a.ok && b.ok
        && p.hail.speaker.name === 'Ilse Vane'
        && p.card.header === 'HAIL — Ilse Vane'
        && p.lock === 'bystander'
        && labelsMatch(p.hail, p.card)),
      { a, b, lock: p.lock, header: p.card.header, speaker: p.hail.speaker });
      await cdp.eval(call("remove('speaker')"));
      await cdp.eval(call("remove('bystander')"));
    }

    // ================= H7 same-speaker reopen =============================
    {
      await stage();
      await cdp.eval(call("spawn('reopen', 'Kesh Bry', 88)"));
      const first = await openCardFor('reopen', { intents: ['letGo', 'keepFiring'], line: 'One word.' });
      const firstId = first.hail.conversationId;
      await stage();
      const second = await openCardFor('reopen', { intents: ['letGo', 'keepFiring'], line: 'One word.' });
      record('H7', !!(firstId && second.hail.conversationId
        && firstId !== second.hail.conversationId
        && second.hail.speaker.name === 'Kesh Bry'),
      { firstId, secondId: second.hail.conversationId });
      await cdp.eval(call("remove('reopen')"));
    }

    // ================= H8 in-place salvage conversion =====================
    {
      await stage();
      await cdp.eval(call("spawn('convert', 'Bel Vask', 92)"));
      const before = await openCardFor('convert', {
        intents: ['demandRansom', 'letGo', 'keepFiring'],
        line: 'They are breaking.',
      });
      await cdp.eval(call("disable('convert')"));
      const after = await waitUntil(PROBE, (v) => v && v.hail && v.hail.kind === 'salvage', 8000);
      await cdp.shot('06-h8-salvage-conversion.png');
      record('H8', !!(before.hail.kind === 'surrender'
        && after.hail.kind === 'salvage'
        && after.hail.open === true
        && after.hail.conversationId !== before.hail.conversationId
        && after.hail.speaker.name === 'Bel Vask'
        && labelsMatch(after.hail, after.card)),
      {
        before: { kind: before.hail.kind, id: before.hail.conversationId },
        after: { kind: after.hail.kind, id: after.hail.conversationId, buttons: after.card.buttons },
      });
      await cdp.eval(call("remove('convert')"));
    }

    // ================= H6 stale identity + H9 bound resolve ===============
    {
      await stage();
      await cdp.eval(call("spawn('first', 'Ory Kel', 84)"));
      await cdp.eval(call("arm('first', 70)"));
      const firstCard = await openCardFor('first', {
        intents: ['payTribute', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand: 70,
        demandHail: true,
      });
      const staleId = firstCard.hail.conversationId;
      await stage();
      await cdp.eval(call("spawn('second', 'Pell Rane', 96)"));
      await cdp.eval(call("arm('second', 90)"));
      const liveCard = await openCardFor('second', {
        intents: ['payTribute', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand: 90,
        demandHail: true,
      });
      const liveId = liveCard.hail.conversationId;
      const beforeSecond = JSON.parse(await cdp.eval(call("effects('second')")));
      const beforeFirst = JSON.parse(await cdp.eval(call("effects('first')")));
      const staleRes = JSON.parse(await cdp.eval(act({
        intent: 'payTribute',
        expectedConversationId: staleId,
      })));
      const afterSecond = JSON.parse(await cdp.eval(call("effects('second')")));
      const afterFirst = JSON.parse(await cdp.eval(call("effects('first')")));
      const stillOpen = await cdp.eval(PROBE);
      await cdp.shot('07-h6-stale-guard.png');
      record('H6', !!(staleId && liveId && staleId !== liveId
        && staleRes.ok === false && staleRes.token === 'stale'
        && afterSecond.credits === beforeSecond.credits
        && afterSecond.fear === beforeSecond.fear
        && afterSecond.demandOutcome === beforeSecond.demandOutcome
        && afterSecond.mode === beforeSecond.mode
        && afterSecond.surrendered === beforeSecond.surrendered
        && afterFirst.demandOutcome === beforeFirst.demandOutcome
        && afterFirst.mode === beforeFirst.mode
        && afterFirst.surrendered === beforeFirst.surrendered
        && stillOpen.hail.open === true
        && stillOpen.hail.conversationId === liveId),
      { staleId, liveId, staleRes, beforeSecond, afterSecond, beforeFirst, afterFirst });

      // H9: the same call, bound to the live conversation, must resolve.
      const creditsBefore = stillOpen.credits;
      const boundRes = JSON.parse(await cdp.eval(act({
        intent: 'payTribute',
        expectedConversationId: liveId,
      })));
      const paid = await waitUntil(call("effects('second')"),
        (v) => { try { return JSON.parse(v).demandOutcome === 'paid'; } catch { return false; } }, 8000);
      const paidState = JSON.parse(paid);
      const closed = await waitUntil(PROBE, (v) => v && v.hail && v.hail.open === false, 8000);
      await cdp.shot('08-h9-bound-resolve.png');
      record('H9', !!(boundRes.ok === true && boundRes.token === ''
        && paidState.demandOutcome === 'paid'
        && paidState.credits === creditsBefore - 90
        && closed.hail.open === false
        && closed.hail.conversationId === ''
        && closed.hail.kind === ''
        && closed.hail.speaker === null
        && closed.hail.terms === null),
      { boundRes, creditsBefore, paidState, closed: closed.hail });
      await cdp.eval(call("remove('first')"));
      await cdp.eval(call("remove('second')"));
    }

    // ================= H10 ordinary human paths ===========================
    {
      await stage();
      await cdp.eval(call("spawn('click', 'Cass Odo', 86)"));
      await cdp.eval(call("arm('click', 120)"));
      const clickCard = await openCardFor('click', {
        intents: ['payTribute', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand: 120,
        demandHail: true,
      });
      const clickCredits = clickCard.credits;
      const clicked = await cdp.eval(`(() => {
        const card = document.querySelector('.rw-hail-card');
        const btn = [...(card?.querySelectorAll('button') || [])]
          .find((b) => /Pay tribute/i.test(b.textContent || ''));
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      const clickState = JSON.parse(await waitUntil(call("effects('click')"),
        (v) => { try { return JSON.parse(v).demandOutcome === 'paid'; } catch { return false; } }, 8000));

      await stage();
      await cdp.eval(call("spawn('key', 'Rea Holt', 82)"));
      await cdp.eval(call("arm('key', 110)"));
      const keyCard = await openCardFor('key', {
        intents: ['payTribute', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand: 110,
        demandHail: true,
      });
      const keyCredits = keyCard.credits;
      await cdp.eval(KEY('Digit1', '1'));
      const keyState = JSON.parse(await waitUntil(call("effects('key')"),
        (v) => { try { return JSON.parse(v).demandOutcome === 'paid'; } catch { return false; } }, 8000));
      await cdp.shot('09-h10-human-paths.png');
      record('H10', !!(clicked === true
        && clickCard.card.buttons[0] === '[1] Pay tribute — 120 UU'
        && clickState.demandOutcome === 'paid'
        && clickState.credits === clickCredits - 120
        && keyCard.card.buttons[0] === '[1] Pay tribute — 110 UU'
        && keyState.demandOutcome === 'paid'
        && keyState.credits === keyCredits - 110),
      { clicked, clickCredits, clickState, keyCredits, keyState });
      await cdp.eval(call("remove('click')"));
      await cdp.eval(call("remove('key')"));
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
      console.log('\nHAIL-66 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nHAIL-66 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
