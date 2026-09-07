/**
 * Issue #54 live verification — cold mounted plated hull restores the real GLB.
 *
 * Drives the dev app in headless Chrome over CDP through the ORDINARY player
 * flow and checks, against the real rendered scene graph and the real
 * `window.__ctx` / `window.rimward` handles:
 *
 *   L1 dock        — a real J dock at a Gilded berth, yard catalog on screen
 *   L2 purchase    — the real yard UI buys a Gilded freighter (one debit)
 *   L3 mount       — the real hangar UI mounts it; the warm hull is the GLB
 *   L4 save        — the game's own autosave writes the mounted hull
 *   L5 cold gate   — after a FULL reload with the freighter GLB held at the
 *                    network layer, the rig flies the grey fallback and the
 *                    asset is provably unprimed (no yard, no NPC priming)
 *   L6 cold resolve— releasing the GLB swaps the REAL Gilded freighter mesh
 *                    into the live scene under the same flight root, with
 *                    cash, cargo, capacity and mounted id preserved
 *
 * THE GATE IS A NETWORK PAUSE, NOT A CODE HOOK. CDP Fetch holds
 * /assets/ships/gilded/freighter/lod0.glb at the Request stage, so nothing in
 * the page — player hull, yard preview, or ambient traffic — can prime that
 * template until this probe releases it. That makes L5's "still cold" reading
 * airtight rather than a race.
 *
 * FIXTURES (harness-only setup, all applied BEFORE the flow under test and all
 * listed in probes.json `fixtures`):
 *   F1 credits    — a hull costs 24000 UU; the probe does not replay a money
 *                   grind, so the purse is set once at session start
 *   F2 berth      — ctx.world.currentSystem is set to the authored Gilded
 *                   system 'gc_auction' and the ship is placed at its station,
 *                   instead of flying a multi-jump route. station.js rebuilds
 *                   the berth from that id through its ordinary update path
 *   F3 cargo      — if the public `trade` action is unavailable, a labelled
 *                   cargo row is pushed so the reload has non-empty cargo to
 *                   preserve. Recorded honestly either way in probes.json
 * Everything the probe ASSERTS — the purchase, the mount, the save, the cold
 * reload, the mesh — runs through the real UI, the real save file and the real
 * asset pipeline. No private state is written to fake an expected outcome and
 * no new runtime debug API is exposed.
 *
 * Run: node scripts/issue-54-live-cold-hull-probe.mjs
 * Output: out/issue-54/live/ (ignored path).
 *
 * Isolation: an OS-assigned loopback Vite port and an OS-assigned CDP port, a
 * per-run Vite cacheDir under out/issue-54, a fresh Chrome profile outside the
 * repository, and teardown of only the processes this run spawned.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = join(repo, 'out', 'issue-54');
const outDir = process.env.RW54_OUT || join(evidenceDir, 'live');
const WIN = process.platform === 'win32';

const GLB_PATH = '/assets/ships/gilded/freighter/lod0.glb';
const GILDED_SYSTEM = 'gc_auction';
const PINS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

function findChrome() {
  const named = process.env.RW54_CHROME || process.env.CHROME_PATH;
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

/**
 * This worktree has no node_modules of its own; Node resolves `vite` from the
 * parent checkout. Resolve through the module system rather than assuming a
 * local path, so the probe runs from a worktree or a full checkout alike.
 */
function findViteBin() {
  // vite's package "exports" hides ./bin/vite.js, so walk the node_modules
  // chain the way Node would and take the file directly.
  let dir = resolvePath(repo);
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'node_modules', 'vite', 'bin', 'vite.js');
    if (existsSync(candidate)) return candidate;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error('vite/bin/vite.js not found in any parent node_modules');
}

const CHROME = findChrome();
const PROFILE_ROOT = resolvePath(process.env.RW54_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue54-coldhull-';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  issue: 54,
  commit: process.env.RW54_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  cacheDir: null,
  boot: null,
  fixtures: {
    F1_credits: null,
    F2_berth: null,
    F3_cargo: null,
  },
  gate: { pausedRequests: [], releasedAt: null },
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
    this.paused = new Map(); // requestId -> url, held by the Fetch gate
    this.autoContinue = false;
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
      if (msg.method === 'Fetch.requestPaused') {
        const { requestId, request } = msg.params || {};
        if (this.autoContinue) {
          this.send('Fetch.continueRequest', { requestId }).catch(() => {});
          say('GATE pass-through', request?.url || '');
        } else {
          this.paused.set(requestId, request?.url || '');
          say('GATE held', request?.url || '');
        }
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
  /** Release every request the gate is holding, then let later ones through. */
  async releaseGate() {
    this.autoContinue = true;
    const held = [...this.paused];
    this.paused.clear();
    for (const [requestId, url] of held) {
      await this.send('Fetch.continueRequest', { requestId }).catch(() => {});
      say('GATE released', url);
    }
    return held.map(([, url]) => url);
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

/** Click the first button whose visible label matches a regex. */
const CLICK = (re, scope = 'document') => `(() => {
  const root = ${scope};
  if (!root) return { ok: false, why: 'no scope' };
  const btns = [...root.querySelectorAll('button')];
  const hit = btns.find((b) => ${re}.test((b.textContent || '').trim()));
  if (!hit) return { ok: false, why: 'no button', seen: btns.map((b) => (b.textContent || '').trim()).slice(0, 24) };
  hit.click();
  return { ok: true, label: (hit.textContent || '').trim() };
})()`;

/**
 * One synchronous read of the live player hull: the rig bookkeeping AND an
 * independent walk of the real scene graph under ctx.ship.object, so a claim
 * of "asset mounted" is corroborated by the meshes actually in the scene.
 */
const HULL = `(() => {
  const c = window.__ctx;
  if (!c || !c.ship || !c.ship.object) return { ready: false };
  const rig = c.ship.hullRig || null;
  const root = c.ship.object;
  let meshes = 0;
  const matNames = new Set();
  const nodeNames = new Set();
  root.traverse((n) => {
    if (n.name) nodeNames.add(n.name);
    if (!n.isMesh && !n.isSkinnedMesh) return;
    meshes++;
    const list = Array.isArray(n.material) ? n.material : [n.material];
    for (const m of list) if (m && m.name) matNames.add(m.name);
  });
  const hangar = c.world.hangar || {};
  const rows = Array.isArray(hangar.hulls) ? hangar.hulls : [];
  const mounted = rows.find((r) => r.id === hangar.mountedId) || null;
  return {
    ready: true,
    hullPath: c.ship.hullPath || null,
    rig: rig ? {
      kind: rig.kind,
      platedIsAsset: rig.platedIsAsset === true,
      platedName: rig.plated ? rig.plated.name : null,
      isFallback: !!(rig.plated && rig.plated.userData && rig.plated.userData.platedFallback === true),
      wrapScale: rig.hull ? Number(rig.hull.scale.x.toFixed(6)) : null,
      platedFaction: rig.platedFaction || null,
      platedClassKey: rig.platedClassKey || null,
    } : null,
    scene: {
      meshes,
      materials: [...matNames].slice(0, 12),
      nodes: [...nodeNames].slice(0, 12),
      gildedTraderBake: [...matNames].some((n) => n.indexOf('RIMWARD_HULL:gilded:trader') === 0),
      rootInScene: !!root.parent,
      position: [Number(root.position.x.toFixed(3)), Number(root.position.y.toFixed(3)), Number(root.position.z.toFixed(3))],
    },
    state: {
      credits: c.world.credits,
      cargo: (c.cargo || []).map((r) => ({ commodity: r.commodity, units: r.units })),
      cargoCapacity: c.cargoCapacity,
      mountedId: hangar.mountedId || null,
      mountedFaction: mounted ? mounted.faction : null,
      mountedClassKey: mounted ? mounted.classKey : null,
      hullKind: c.player ? c.player.hullKind : null,
      faction: c.player ? c.player.faction : null,
      classKey: c.player ? c.player.classKey : null,
      hullRows: rows.length,
    },
    docked: c.flags.docked === true,
    paused: c.flags.paused === true,
    system: c.world.currentSystem || null,
  };
})()`;

/** Read-only inspection import: the app's own module instance, no mutation. */
const ASSET_STATE = `(async () => {
  const c = window.__ctx;
  const m = await import('/src/systems/ship-assets.js');
  const gildedFreighterNpc = (c.ships || []).filter((s) => s
    && s.record && s.record.faction === 'gilded' && s.record.classKey === 'freighter').length;
  return {
    gildedFreighterReady: m.isShipAssetReady('gilded', 'freighter', 'trader') === true,
    gildedFreighterNpc,
    liveShips: (c.ships || []).length,
    stationOverlayOpen: !!(c.flags && c.flags.docked),
  };
})()`;

async function main() {
  await mkdir(PROFILE_ROOT, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const cacheDir = join(evidenceDir, `vite-cache-${process.pid}`);
  const cfgPath = join(evidenceDir, `vite.issue-54.${process.pid}.config.mjs`);
  results.cacheDir = cacheDir;
  await mkdir(cacheDir, { recursive: true });
  // Per-run dev-server config: the repo config's only plugin is build-only, so
  // a dev server needs nothing from it but the root. Isolating cacheDir keeps
  // this run from sharing an optimize cache with the parent checkout.
  await writeFile(cfgPath, `import { defineConfig } from 'vite';\n`
    + `export default defineConfig({\n`
    + `  root: ${JSON.stringify(repo)},\n`
    + `  cacheDir: ${JSON.stringify(cacheDir)},\n`
    + `});\n`, 'utf8');

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
    const viteBin = findViteBin();
    say('vite bin', viteBin);
    vite = spawn(
      process.execPath,
      [viteBin,
        '--config', cfgPath,
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
    say('vite up', port, 'cacheDir', cacheDir);

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

    // ---- Boot a clean new game -------------------------------------------
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
      return { hasCtx: !!c, origin: c?.world?.origin || null, sys: c?.world?.currentSystem || null, docked: !!c?.flags?.docked };
    })()`);
    say('flight', JSON.stringify(results.boot));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (results.boot.docked) { await cdp.eval(KEY('Digit8', '8')); await sleep(1200); }

    // ================= F1 + F2 setup fixtures =============================
    // Harness-only. Applied before the flow under test, recorded in probes.json.
    const fixture = await cdp.eval(`(() => {
      const c = window.__ctx;
      c.world.credits = 60000;                    // F1: skip the money grind
      c.world.currentSystem = ${JSON.stringify(GILDED_SYSTEM)}; // F2: berth at the Gilded yard
      return { credits: c.world.credits, system: c.world.currentSystem };
    })()`);
    results.fixtures.F1_credits = { applied: true, credits: fixture.credits, why: 'a hull lists at 24000 UU; the probe does not replay a trade grind' };
    say('fixture F1/F2', JSON.stringify(fixture));
    // station.js rebuilds the berth from ctx.world.currentSystem on its own
    // update path; wait for that authored station to become live.
    const berth = await waitUntil(`(() => {
      const c = window.__ctx;
      const s = c.systems?.[c.world.currentSystem];
      return s && s.station && s.station.position ? { faction: s.faction, pos: s.station.position } : null;
    })()`, (v) => !!(v && v.pos), 20000, 300);
    if (!berth?.pos) throw new Error('gilded berth never became live');
    // F2 (cont.): stand the ship off the pad rather than fly a multi-jump route.
    await cdp.eval(`(() => {
      const c = window.__ctx;
      const p = c.systems[c.world.currentSystem].station.position;
      c.ship.object.position.set(p[0] + 30, p[1], p[2]);
      if (c.ship.velocity) c.ship.velocity.set(0, 0, 0);
      c.ship.speed = 0;
      return true;
    })()`);
    results.fixtures.F2_berth = { applied: true, system: GILDED_SYSTEM, faction: berth.faction, why: 'places the ship at the authored Gilded station instead of flying a multi-jump route; the dock itself is the real J keypress' };
    say('fixture F2 berth', JSON.stringify(berth));

    // ================= L1 real dock ========================================
    await sleep(600);
    await cdp.eval(KEY('KeyJ', 'j'));
    const docked = await waitUntil(HULL, (v) => v && v.docked === true, 15000, 250);
    await cdp.eval(KEY('KeyY', 'y')); // real shipyard service key
    await sleep(500);
    await cdp.eval(KEY('Digit2', '2')); // real YARD pane digit
    await sleep(900);
    const yardShot = await cdp.eval(`(() => {
      const rows = [...document.querySelectorAll('.shipyard-buy-row')];
      return {
        rows: rows.length,
        names: rows.map((r) => (r.querySelector('.shipyard-buy-name')?.textContent || '').trim()),
        flag: (document.querySelector('.shipyard-buy-flag')?.textContent || '').trim(),
      };
    })()`);
    await cdp.shot('01-l1-gilded-yard.png');
    record('L1', !!(docked && docked.docked === true
      && docked.system === GILDED_SYSTEM
      && berth.faction === 'gilded'
      && yardShot.rows > 0
      && yardShot.names.some((n) => /freight/i.test(n))),
    { docked: docked?.docked, system: docked?.system, berthFaction: berth.faction, yard: yardShot, dockedBy: 'KeyJ' });

    // ================= L2 real purchase ====================================
    const before = await cdp.eval(HULL);
    const papers = await cdp.eval(`(() => {
      const rows = [...document.querySelectorAll('.shipyard-buy-row')];
      const row = rows.find((r) => /freight/i.test(r.querySelector('.shipyard-buy-name')?.textContent || ''));
      if (!row) return { ok: false, why: 'no freighter row' };
      const btn = [...row.querySelectorAll('button')].find((b) => /Papers/i.test(b.textContent || ''));
      if (!btn) return { ok: false, why: 'no papers button' };
      btn.click();
      return { ok: true, label: (btn.textContent || '').trim() };
    })()`);
    await sleep(700);
    await cdp.shot('02-l2-papers.png');
    const confirmed = await cdp.eval(CLICK('/Confirm papers/i'));
    await sleep(900);
    const after = await cdp.eval(HULL);
    const bought = after.state.hullRows - before.state.hullRows;
    const spent = before.state.credits - after.state.credits;
    const newRow = await cdp.eval(`(() => {
      const c = window.__ctx;
      const rows = c.world.hangar.hulls || [];
      const row = rows[rows.length - 1];
      return row ? { id: row.id, faction: row.faction, classKey: row.classKey, hullKind: row.hullKind, cargoCapacity: row.cargoCapacity } : null;
    })()`);
    record('L2', !!(papers.ok && confirmed.ok
      && bought === 1 && spent > 0
      && newRow && newRow.faction === 'gilded'
      && newRow.classKey === 'freighter' && newRow.hullKind === 'built'
      && after.state.mountedId === before.state.mountedId),
    { papers, confirmed, bought, spent, newRow, mountedUnchanged: after.state.mountedId === before.state.mountedId });

    // ================= L3 real mount =======================================
    await cdp.eval(KEY('Digit1', '1')); // real HANGAR pane digit
    await sleep(700);
    const mountClick = await cdp.eval(`(() => {
      const c = window.__ctx;
      const rows = c.world.hangar.hulls || [];
      const want = rows.find((r) => r.faction === 'gilded' && r.classKey === 'freighter');
      if (!want) return { ok: false, why: 'no gilded freighter row' };
      const cards = [...document.querySelectorAll('.shipyard-hull')];
      const card = cards.find((el) => /freight/i.test(el.querySelector('.shipyard-hull-meta')?.textContent || ''));
      if (!card) return { ok: false, why: 'no hangar card', seen: cards.map((el) => (el.textContent || '').trim()).slice(0, 12) };
      const btn = [...card.querySelectorAll('button')].find((b) => /Mount/i.test(b.textContent || ''));
      if (!btn) return { ok: false, why: 'no mount button' };
      btn.click();
      return { ok: true, label: (btn.textContent || '').trim(), wantId: want.id };
    })()`);
    await sleep(1200);
    const mounted = await cdp.eval(HULL);
    const warmAssets = await cdp.eval(ASSET_STATE);
    await cdp.shot('03-l3-mounted-hangar.png');
    record('L3', !!(mountClick.ok
      && mounted.state.mountedId === mountClick.wantId
      && mounted.state.hullKind === 'built'
      && mounted.state.faction === 'gilded'
      && mounted.state.classKey === 'freighter'
      && mounted.hullPath === 'built'
      && mounted.rig && mounted.rig.platedIsAsset === true
      && mounted.scene.gildedTraderBake === true),
    { mountClick, state: mounted.state, rig: mounted.rig, scene: mounted.scene, warmAssets });

    // ---- F3 cargo: prefer the public trade action; fall back and say so ----
    const tradeTry = await cdp.eval(`(async () => {
      try {
        const r = window.rimward?.act?.({ v: 2, name: 'trade', args: { commodity: 'provisions', qty: 3, side: 'buy' } });
        return { attempted: true, receipt: r || null };
      } catch (err) { return { attempted: true, error: String(err && err.message || err) }; }
    })()`);
    let cargoVia = 'public trade action';
    if (!tradeTry?.receipt?.ok) {
      cargoVia = 'labelled fixture (public trade action refused)';
      // Rows use the game's own shape ({ commodity, units }); anything else is
      // dropped by save.js sanitizeCargoRow and would never reach the reload.
      await cdp.eval(`(() => {
        const c = window.__ctx;
        c.cargo.length = 0;
        c.cargo.push({ commodity: 'provisions', units: 3 });
        const h = c.world.hangar;
        const row = (h.hulls || []).find((r) => r.id === h.mountedId);
        if (row) row.cargo = [{ commodity: 'provisions', units: 3 }];
        return true;
      })()`);
    }
    results.fixtures.F3_cargo = { via: cargoVia, tradeReceipt: tradeTry?.receipt ?? null, why: 'the reload needs non-empty cargo to prove preservation; no trade leg is replayed' };
    say('fixture F3 cargo', cargoVia);

    // ================= L4 launch + real save ===============================
    // KeyB is the game's undock key and works from inside a service desk; the
    // "1 — Launch" button only exists on the dock root panel.
    await cdp.eval(KEY('KeyB', 'b'));
    await sleep(1500);
    const flying = await waitUntil(HULL, (v) => v && v.docked === false, 12000, 250);
    if (flying?.docked !== false) throw new Error('undock (KeyB) did not take');
    const saved = await cdp.eval(`(async () => {
      const m = await import('/src/game/save.js');
      const ok = m.requestAutosave(window.__ctx);
      let blob = null;
      try { blob = localStorage.getItem('rimward-save-v1'); } catch {}
      return { ok, bytes: blob ? blob.length : 0 };
    })()`);
    const expected = flying.state;
    await cdp.shot('04-l4-warm-hull-in-flight.png');
    record('L4', !!(saved.ok === true && saved.bytes > 0
      && flying.docked === false
      && flying.rig && flying.rig.platedIsAsset === true
      && flying.scene.gildedTraderBake === true),
    { saved, docked: flying.docked, expected, rig: flying.rig, scene: flying.scene, undockedBy: 'KeyB', savedBy: 'save.js requestAutosave (the game\'s own autosave)' });

    // ================= L5 cold reload behind a network gate ================
    // Hold the freighter GLB at the Request stage BEFORE navigating, so no
    // consumer in the page — player hull, yard preview or ambient traffic —
    // can prime that template until this probe releases it.
    await cdp.send('Fetch.enable', {
      patterns: [{ urlPattern: `*${GLB_PATH}*`, requestStage: 'Request' }],
    });
    await cdp.eval(`(() => {
      try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
      location.reload();
      return true;
    })()`);
    await sleep(2000);
    const cold = await waitUntil(HULL, (v) => v && v.ready === true
      && v.rig && v.rig.kind === 'built', 40000, 250);
    const coldAssets = await cdp.eval(ASSET_STATE);
    results.gate.pausedRequests = [...cdp.paused.values()];
    await cdp.shot('05-l5-cold-fallback-gated.png');
    record('L5', !!(cold && cold.ready === true
      && cold.rig.kind === 'built'
      && cold.rig.platedIsAsset === false
      && cold.rig.isFallback === true
      && cold.rig.platedName === 'player-plated-fallback'
      && cold.rig.platedFaction === 'gilded'
      && cold.rig.platedClassKey === 'freighter'
      && cold.scene.gildedTraderBake === false
      && coldAssets.gildedFreighterReady === false
      && coldAssets.gildedFreighterNpc === 0
      && cdp.paused.size >= 1),
    {
      rig: cold?.rig,
      scene: cold?.scene,
      assets: coldAssets,
      heldRequests: results.gate.pausedRequests,
      note: 'GLB held at the network layer: nothing in the page could have primed gilded/freighter',
    });

    // ================= L6 release the gate, real GLB lands =================
    results.gate.releasedAt = new Date().toISOString();
    const released = await cdp.releaseGate();
    const warm = await waitUntil(HULL, (v) => v && v.rig && v.rig.platedIsAsset === true, 30000, 200);
    const warmAssetsAfter = await cdp.eval(ASSET_STATE);
    await sleep(600);
    await cdp.shot('06-l6-cold-resolved-real-glb.png');
    await cdp.eval(KEY('KeyC', 'c'));
    await sleep(900);
    await cdp.shot('07-l6-third-person-real-glb.png');
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    record('L6', !!(warm && warm.rig.platedIsAsset === true
      && warm.rig.platedName === 'npc-ship-asset'
      && warm.rig.isFallback === false
      && warm.scene.gildedTraderBake === true
      && warm.scene.meshes > cold.scene.meshes
      && warm.scene.rootInScene === true
      && warmAssetsAfter.gildedFreighterReady === true
      // state survives the cold reload AND the in-place hull swap
      && warm.state.credits === expected.credits
      && same(warm.state.cargo, expected.cargo)
      && warm.state.cargoCapacity === expected.cargoCapacity
      && warm.state.mountedId === expected.mountedId
      && warm.state.mountedFaction === 'gilded'
      && warm.state.mountedClassKey === 'freighter'
      && warm.state.hullKind === 'built'
      && warm.state.faction === 'gilded'
      && warm.state.classKey === 'freighter'),
    {
      released,
      rigBefore: cold?.rig,
      rigAfter: warm?.rig,
      sceneBefore: cold?.scene,
      sceneAfter: warm?.scene,
      expected,
      actual: warm?.state,
      assets: warmAssetsAfter,
    });

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
    try { await rm(cfgPath, { force: true }); } catch { /* keep going */ }
    try { await rm(cacheDir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* keep going */ }
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
      console.log('\nISSUE-54 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-54 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
