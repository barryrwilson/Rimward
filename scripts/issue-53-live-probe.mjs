/**
 * Issue #53 live verification — market spread at The Grand Auction.
 *
 * Drives the dev app in headless Chrome over CDP and checks, against the real
 * rendered market panel and the real `window.rimward` handle:
 *
 *   P1 every rendered row prints SELL <= BUY
 *   P2 keyboard Q then A (qty 1) — displayed totals equal the actual fills
 *   P3 keyboard W then S (qty 5)
 *   P4 public trade action at qty 1, 5 and 99
 *   P5 buy 99 + 61, sell 50 + 50 + 50 + 10 (160 units)
 *   P6 clean console and no uncaught exceptions
 *
 * FIXTURES (privilegedFixture, harness-only): survivability, purse, hold
 * capacity, the jump to the auction system, the docking approach position, the
 * pinned provisions quote and the parking of ambient traffic. The ACTIONS
 * under test are always a real keyboard event or a real public-handle call,
 * dispatched synchronously inside one page-side block so no frame can move the
 * price between the quote read and the fill. Nothing fakes a fill, and no
 * runtime source is edited for the probe.
 *
 * Run: node scripts/issue-53-live-probe.mjs
 * Output: out/issue-53/live/ (ignored path).
 *
 * Isolation: an OS-assigned loopback Vite port, an OS-assigned CDP port, a
 * fresh Chrome profile outside the repository, and a per-run Vite cacheDir so
 * two worktrees sharing a node_modules junction cannot share generated cache.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE53_OUT || join(repo, 'out', 'issue-53', 'live');
const WIN = process.platform === 'win32';
const PINS = ['P1', 'P2', 'P3', 'P4', 'P5'];

function findChrome() {
  const named = process.env.ISSUE53_CHROME || process.env.CHROME_PATH;
  if (named) return named;
  const candidates = WIN
    ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
    : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser', '/usr/bin/chromium', '/opt/google/chrome/chrome'];
  for (const c of candidates) if (existsSync(c)) return c;
  return WIN ? 'chrome.exe' : 'google-chrome';
}
const CHROME = findChrome();
const PROFILE_ROOT = resolvePath(process.env.ISSUE53_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue53-market-';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => { const line = a.map(String).join(' '); log.push(line); console.log(line); };

const results = {
  commit: process.env.ISSUE53_SHA || null,
  port: null, cdpPort: null, profile: null, cacheDir: null, boot: null,
  fixtureNote: 'privilegedFixture: hull/purse/hold pins, the jump to the auction system, '
    + 'the dock approach position, the pinned provisions quote and ambient parking. Every '
    + 'asserted trade is a real keyboard event or a real window.rimward call.',
  pins: {}, consoleErrors: [], exceptions: [],
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
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'],
          { stdio: 'ignore', windowsHide: true });
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
  await new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  return port;
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0; this.pending = new Map(); this.console = []; this.exceptions = [];
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.method === 'Runtime.consoleAPICalled') {
        this.console.push({
          type: msg.params?.type || 'log',
          text: (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' '),
        });
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
      clearTimeout(p.timer); // release the timeout on success AND on rejection
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
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('cdp timeout ' + method)); }
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 45000) {
    const r = await this.send('Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
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
 * privilegedFixture: harness-only staging + the synchronous trade runners.
 * Every runner dispatches a REAL keyboard event or calls the REAL public
 * handle; the reads around it happen in the same synchronous block, so the
 * quote the panel printed is provably the quote the fill used.
 */
const SETUP = `(() => {
  const c = window.__ctx;
  const key = (code, k) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key: k, bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key: k, bubbles: true, cancelable: true }));
  };
  const num = (t) => { const m = /^(-?\\d+) UU$/.exec((t || '').trim()); return m ? Number(m[1]) : null; };
  const held = (k) => (c.cargo || []).reduce((n, r) => n + (r.commodity === k ? r.units : 0), 0);
  const bag = {};

  bag.market = () => {
    const table = document.querySelector('.market-table');
    if (!table) return null;
    const cells = [...table.children].filter((n) => n.classList.contains('market-cell'));
    const rows = [];
    for (let i = 0; i + 5 < cells.length; i += 6) {
      rows.push({
        name: (cells[i].textContent || '').trim(),
        status: (cells[i + 1].textContent || '').trim(),
        buy: num(cells[i + 2].textContent),
        sell: num(cells[i + 3].textContent),
        hold: (cells[i + 4].textContent || '').trim(),
        selected: cells[i].classList.contains('market-row-sel'),
      });
    }
    const note = document.querySelector('.station-notice');
    return {
      rows,
      selected: (rows.find((r) => r.selected) || {}).name || null,
      notice: note ? (note.textContent || '').trim() : null,
      credits: c.world.credits,
      system: c.world.currentSystem,
      station: c.systems[c.world.currentSystem].station.name,
      faction: c.systems[c.world.currentSystem].faction,
    };
  };
  bag.reopen = () => { key('Escape', 'Escape'); key('Digit1', '1'); return bag.market(); };
  bag.selectRow = (name) => {
    for (let i = 0; i < 40; i++) {
      const m = bag.market();
      if (!m) return false;
      if (m.selected === name) return true;
      key('ArrowDown', 'ArrowDown');
    }
    return false;
  };
  // privilegedFixture: pin the quote so the walk cannot move it mid-assertion.
  bag.pin = (commodity, price) => { c.world.prices[commodity] = price; return bag.reopen(); };

  /**
   * One synchronous round trip. \`legs\` is a list of
   * { how: 'key'|'api', side, qty, code } steps; the quote is read before the
   * first leg and re-read after each, so the ledger shows every figure the
   * player saw next to every UU that actually moved.
   */
  bag.run = (spec) => {
    const commodity = spec.commodity;
    const name = spec.name;
    if (spec.price != null) bag.pin(commodity, spec.price);
    else bag.reopen();
    if (!bag.selectRow(name)) return { ok: false, reason: 'row not selectable' };
    const quote = bag.market().rows.find((r) => r.name === name);
    const creditsStart = c.world.credits;
    const heldStart = held(commodity);
    const legs = [];
    for (const leg of spec.legs) {
      const before = c.world.credits;
      const heldBefore = held(commodity);
      let receipt = null;
      if (leg.how === 'key') {
        for (let i = 0; i < leg.presses; i++) key(leg.code, leg.k);
      } else {
        receipt = window.rimward.act({
          v: 2, name: 'trade', args: { commodity, qty: leg.qty, side: leg.side },
        });
      }
      const m = bag.market();
      legs.push({
        how: leg.how, side: leg.side, qty: leg.qty, code: leg.code || null,
        ok: receipt ? receipt.ok === true : true,
        error: receipt ? receipt.error || '' : '',
        moved: c.world.credits - before,
        cargoDelta: held(commodity) - heldBefore,
        quoteBuy: m ? (m.rows.find((r) => r.name === name) || {}).buy : null,
        quoteSell: m ? (m.rows.find((r) => r.name === name) || {}).sell : null,
        notice: m ? m.notice : null,
      });
    }
    return {
      ok: true,
      station: bag.market().station,
      quote: { buy: quote.buy, sell: quote.sell },
      creditsStart,
      creditsEnd: c.world.credits,
      net: c.world.credits - creditsStart,
      heldStart,
      heldEnd: held(commodity),
      legs,
    };
  };

  window.__i53 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__i53.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;
const runJson = async (cdp, spec) => JSON.parse(await cdp.eval(call(`run(${JSON.stringify(spec)})`)));

/** Every leg moved exactly qty x the quote the panel printed, and the cargo with it. */
function legsAgree(trip) {
  return trip.legs.every((leg) => {
    if (leg.ok !== true || !Number.isInteger(leg.qty)) return false;
    if (leg.side === 'buy') {
      return leg.moved === -(trip.quote.buy * leg.qty) && leg.cargoDelta === leg.qty;
    }
    return leg.moved === trip.quote.sell * leg.qty && leg.cargoDelta === -leg.qty;
  });
}

async function main() {
  await mkdir(PROFILE_ROOT, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const port = await availablePort();
  const profile = await mkdtemp(join(PROFILE_ROOT, PROFILE_PREFIX));
  // Per-run Vite cacheDir: this worktree's node_modules is a junction into the
  // parent checkout, so the default node_modules/.vite would be shared.
  const cacheDir = join(outDir, `.vite-cache-${process.pid}`);
  const probeConfig = join(outDir, `vite.probe.${process.pid}.mjs`);
  await writeFile(probeConfig,
    'import { defineConfig } from \'vite\';\n'
    + `export default defineConfig({ root: ${JSON.stringify(repo)}, `
    + `cacheDir: ${JSON.stringify(cacheDir)}, server: { host: '127.0.0.1' } });\n`, 'utf8');
  const app = `http://127.0.0.1:${port}/?agent=1`;
  results.port = port; results.profile = profile; results.cacheDir = cacheDir;
  let vite = null; let chrome = null; let cdp = null;

  try {
    vite = spawn(process.execPath, [
      join(repo, 'node_modules', 'vite', 'bin', 'vite.js'),
      '--config', probeConfig,
      '--host', '127.0.0.1', '--port', String(port), '--strictPort',
    ], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true });
    vite.stdout.on('data', (b) => say('vite', String(b).trim().slice(0, 160)));
    vite.stderr.on('data', (b) => say('vite!', String(b).trim().slice(0, 160)));
    let up = false;
    for (let i = 0; i < 100; i++) {
      up = await fetch(`http://127.0.0.1:${port}/`).then((r) => r.ok).catch(() => false);
      if (up || vite.exitCode != null) break;
      await sleep(300);
    }
    if (!up) throw new Error(`vite ${port} not serving`);
    say('vite up', port, 'cacheDir', cacheDir);

    chrome = spawn(CHROME, [
      '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist', '--enable-webgl',
      '--disable-extensions', '--window-size=1440,900', '--headless=new',
      '--hide-crash-restore-bubble', '--disable-session-crashed-bubble',
      ...(WIN ? [] : ['--no-sandbox', '--disable-dev-shm-usage']),
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true });
    const chromeErr = [];
    chrome.stderr.on('data', (b) => chromeErr.push(String(b).trim().slice(0, 200)));
    say('chrome', CHROME, 'pid', chrome.pid);

    let browserWs = null; let cdpPort = null;
    for (let i = 0; i < 120; i++) {
      try {
        const active = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
        const parsed = Number(active.split(/\r?\n/, 1)[0]);
        if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('bad DevToolsActivePort');
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

    // ---- Boot into flight (the hail66 front-door sequence) ----------------
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
      return { hasCtx: !!c, origin: c?.world?.origin || null, sys: c?.world?.currentSystem || null,
        docked: !!c?.flags?.docked, agentOptIn: !!c?.agent?.optIn };
    })()`);
    say('flight', JSON.stringify(results.boot));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (results.boot.docked) { await cdp.eval(KEY('Digit8', '8')); await sleep(1500); }

    // ---- privilegedFixture: survive, fund, park, and reach the auction ----
    const auction = await cdp.eval(`(() => {
      const c = window.__ctx;
      const hit = Object.keys(c.systems).find((id) =>
        c.systems[id]?.station?.name === 'The Grand Auction');
      return hit || Object.keys(c.systems).find((id) => c.systems[id]?.faction === 'gilded') || null;
    })()`);
    say('auction system', String(auction));
    if (!auction) throw new Error('no Grand Auction system in the galaxy');
    await cdp.eval(`(() => {
      const c = window.__ctx;
      if (c.player) { c.player.hullMax = 1e9; c.player.hull = 1e9; c.player.screenMax = 1e9; c.player.screen = 1e9; }
      c.world.credits = 5000000;
      c.cargoCapacity = 160; // freighter-sized: the 99 + 61 order fills it exactly
      c.world.reputation.gilded = 0;
      if (c.agent) c.agent.optIn = true;
      c.emit('jumpRequested', { to: ${JSON.stringify(auction)} });
      return true;
    })()`);
    const arrived = await waitUntil(`(() => {
      const c = window.__ctx;
      return c.world.currentSystem === ${JSON.stringify(auction)} && !c.gate.jumping;
    })()`, (v) => v === true, 40000, 250);
    if (arrived !== true) throw new Error(`never arrived at ${auction}`);
    // Approach position is staged; the DOCK itself is the ordinary J press.
    await cdp.eval(`(() => {
      const c = window.__ctx;
      const st = c.systems[c.world.currentSystem].station.position;
      c.ship.object.position.set(st[0] + 36, st[1], st[2]);
      if (c.ship.velocity) c.ship.velocity.set(0, 0, 0);
      c.ship.speed = 0;
      for (const s of c.ships) if (s && s.object) s.object.position.set(st[0] + 9000, st[1] + 9000, st[2] + 9000);
      return true;
    })()`);
    await sleep(400);
    await cdp.eval(KEY('KeyJ', 'j'));
    const docked = await waitUntil('(() => window.__ctx.flags.docked === true)()', (v) => v === true, 15000, 250);
    if (docked !== true) throw new Error('never docked at the auction');
    await cdp.eval(KEY('Digit1', '1')); // market service
    await sleep(400);
    const setup = await cdp.eval(SETUP);
    if (setup !== true) throw new Error('fixture setup failed');

    // ================= P1 every rendered row: SELL <= BUY =================
    {
      const m = JSON.parse(await cdp.eval(call('pin("provisions", 216)')));
      await cdp.shot('01-auction-market.png');
      const rows = (m?.rows || []).filter((r) => r.buy !== null && r.sell !== null);
      const offenders = rows.filter((r) => r.sell > r.buy).map((r) => `${r.name} ${r.sell}>${r.buy}`);
      const prov = rows.find((r) => r.name === 'Provisions') || null;
      record('P1', !!(m && rows.length > 0 && offenders.length === 0
        && prov && prov.buy === 216 && prov.sell === 216),
      { station: m?.station, faction: m?.faction, rowCount: rows.length, offenders, provisions: prov });
    }

    // ================= P2 keyboard Q then A, qty 1 ========================
    {
      const trip = await runJson(cdp, {
        commodity: 'provisions', name: 'Provisions', price: 216,
        legs: [
          { how: 'key', side: 'buy', qty: 1, code: 'KeyQ', k: 'q', presses: 1 },
          { how: 'key', side: 'sell', qty: 1, code: 'KeyA', k: 'a', presses: 1 },
        ],
      });
      await cdp.shot('02-keyboard-qty1.png');
      record('P2', !!(trip.ok && trip.quote.sell <= trip.quote.buy
        && legsAgree(trip) && trip.net <= 0 && trip.heldEnd === trip.heldStart
        && trip.legs[0].notice === 'Bought 1 Provisions for ' + trip.quote.buy + ' UU.'
        && trip.legs[1].notice === 'Sold 1 Provisions for ' + trip.quote.sell + ' UU.'), trip);
    }

    // ================= P3 keyboard W then S, qty 5 ========================
    {
      const trip = await runJson(cdp, {
        commodity: 'provisions', name: 'Provisions', price: 216,
        legs: [
          { how: 'key', side: 'buy', qty: 5, code: 'KeyW', k: 'w', presses: 1 },
          { how: 'key', side: 'sell', qty: 5, code: 'KeyS', k: 's', presses: 1 },
        ],
      });
      await cdp.shot('03-keyboard-qty5.png');
      record('P3', !!(trip.ok && legsAgree(trip) && trip.net <= 0
        && trip.heldEnd === trip.heldStart
        && trip.legs[0].notice === 'Bought 5 Provisions for ' + trip.quote.buy * 5 + ' UU.'
        && trip.legs[1].notice === 'Sold 5 Provisions for ' + trip.quote.sell * 5 + ' UU.'), trip);
    }

    // ================= P4 public handle, qty 1 / 5 / 99 ===================
    {
      const trips = [];
      for (const qty of [1, 5, 99]) {
        trips.push(await runJson(cdp, {
          commodity: 'provisions', name: 'Provisions', price: 216,
          legs: [
            { how: 'api', side: 'buy', qty },
            { how: 'api', side: 'sell', qty },
          ],
        }));
      }
      await cdp.shot('04-public-handle-99.png');
      record('P4', trips.every((t) => t.ok && legsAgree(t) && t.net <= 0
        && t.heldEnd === t.heldStart && t.quote.sell <= t.quote.buy),
      { trips });
    }

    // ================= P5 buy 99 + 61, sell 50/50/50/10 ===================
    {
      const trip = await runJson(cdp, {
        commodity: 'provisions', name: 'Provisions', price: 216,
        legs: [
          { how: 'api', side: 'buy', qty: 99 },
          { how: 'api', side: 'buy', qty: 61 },
          { how: 'api', side: 'sell', qty: 50 },
          { how: 'api', side: 'sell', qty: 50 },
          { how: 'api', side: 'sell', qty: 50 },
          { how: 'api', side: 'sell', qty: 10 },
        ],
      });
      await cdp.shot('05-chunked-160.png');
      const bought = trip.legs.filter((l) => l.side === 'buy');
      const sold = trip.legs.filter((l) => l.side === 'sell');
      record('P5', !!(trip.ok && legsAgree(trip) && trip.net <= 0
        && trip.heldEnd === trip.heldStart
        && bought.reduce((n, l) => n + l.cargoDelta, 0) === 160
        && sold.reduce((n, l) => n - l.cargoDelta, 0) === 160
        && bought.every((l) => l.quoteBuy === trip.quote.buy)
        && sold.every((l) => l.quoteSell === trip.quote.sell)), trip);
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
    // Remove only paths this run created, checked against their own roots.
    try {
      if (profile) {
        const target = resolvePath(profile);
        const leaf = basename(target);
        if (relative(PROFILE_ROOT, target) === leaf && leaf.startsWith(PROFILE_PREFIX)) {
          await rm(target, { recursive: true, force: true, maxRetries: 5 });
        }
      }
    } catch { /* profile may hold locks */ }
    try {
      const target = resolvePath(cacheDir);
      if (relative(outDir, target) === basename(target) && basename(target).startsWith('.vite-cache-')) {
        await rm(target, { recursive: true, force: true, maxRetries: 5 });
      }
    } catch { /* cache may hold locks */ }
    try {
      const target = resolvePath(probeConfig);
      if (relative(outDir, target) === basename(target) && basename(target).startsWith('vite.probe.')) {
        await rm(target, { force: true });
      }
    } catch { /* ignore */ }
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
      console.log('\nISSUE-53 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-53 LIVE PASS — ${PINS.length}/${PINS.length} pins (P6 clean console), no exceptions`);
    }
  }
}

main();
