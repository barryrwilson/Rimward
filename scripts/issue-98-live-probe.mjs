/**
 * Issue #98 live verification — a surrendering hull's holds can be demanded.
 *
 * Drives the dev app in headless Chrome over CDP and reads only the rendered
 * DOM, the public `window.rimward` handle and read-only `window.__ctx`
 * snapshots:
 *
 *   L1  a LOADED, player-broken hull really offers the cargo demand — the live
 *       NPC update samples it into the `bargaining` band, the surrender card is
 *       really rendered with a "Demand cargo" button, and the PUBLIC
 *       observe().hail block lists 'demandCargo' among its intents
 *   L2  the bound public hailResolve really takes the holds — new cargo pods
 *       carrying the fixture's exact manifest appear in the live world, the
 *       hull's manifest is cleared, fear rises by exactly the capitulation step
 *       the live ECON table names, credits do not move, the hull is yielded and
 *       running, the lane records ONE new 'surrendered' incident credited to the
 *       player, and the card leaves the screen. A second bound resolve of the
 *       same conversation is refused and moves nothing
 *   L3  an EMPTY hold omits the verb — the same fixture shape with no manifest
 *       renders a surrender card with NO cargo button, publishes no
 *       'demandCargo' intent, and a bound hailResolve naming it is refused with
 *       nothing paid, taken or feared
 *   L4  a break the player did not cause offers nothing to take — an
 *       NPC-attributed fixture with a full manifest reaches the bargaining band
 *       with no card at all, and a cargo demand is refused: another pilot's
 *       prize cannot be claimed (issue #99 attribution, preserved)
 *   L5  a staged NPC takeover at the click boundary — a rendered player card
 *       whose lastAttacker becomes 'npc' in ONE evaluation, immediately followed
 *       by a retained DOM click on the real "Demand cargo" button before a frame
 *       can close the card. No pod, no fear, no cleared manifest; the card closes
 *   L6  the RENDERED button really pays — the positive counterpart to L5: on a
 *       fresh loaded, player-broken card the real "Demand cargo" button is
 *       clicked (no API call), and the manifest becomes pods, fear rises by the
 *       capitulation step, credits do not move, the hull yields to the player
 *       and the card leaves the screen
 *
 * The berth boundary is NOT re-verified here: issue #100's own live probe and
 * the focused suite cover it.
 *
 * FIXTURE DISCLOSURE (privilegedFixture, recorded in result.json):
 * A hull broken to the bargaining band with full holds cannot be waited for in
 * a live session, so each fixture is spawned and given an INITIAL COMBAT HISTORY
 * and an INITIAL MANIFEST directly: resolve 50, an INITIAL ai.band of 'shaken',
 * personality 0, screen 0, shell 0, a FULL hull, engine full, the stated cargo
 * rows (ordinary bulk commodities), a fresh lastCombatAt, resolveAt 0,
 * calmUntil 0, hailed false, demandSent true (which suppresses the unrelated
 * wave-30 pirate demand) and lastAttacker set to 'npc' or 'player' as each pin
 * discloses. That initial band is a STARTING POINT, not an outcome: the hull is
 * then walked DOWN from full in 4% steps — defenses zeroed, lastCombatAt
 * refreshed, the resolve and calm clocks cleared each step — and the walk stops
 * the instant the LIVE npc update reports the band the pin needs (every pin
 * here stops at 'bargaining'; each run's reached band, resolve and hull
 * fraction are recorded). Cargo aboard is itself a reason to yield, so one
 * fixed hull fraction cannot serve both a loaded and an empty fixture. Ambient
 * hulls are parked outside the engagement bubble and the player's own defenses
 * are topped up so the pass is survivable.
 *
 * These are PRIVILEGED INITIAL STATES, not a claim that this combat or this
 * manifest was naturally encountered. L5 additionally stages ONE further live
 * field — `ai.lastAttacker = 'npc'`, AFTER the real card has opened. What is
 * never written: no `hailOpened`, no `npcSurrendered`, no pod, no fear, no
 * credit, no `state.surrendered`, no card kind, no intent list and no expected
 * outcome of any kind. Every verb offered, every pod, every fear step, every
 * incident and every refusal token below is produced by the live NPC update,
 * the live hail card, the live pods system and the live world ledger. No new
 * runtime debug API is added.
 *
 * Run: node scripts/issue-98-live-probe.mjs   (npm run test:surrender-cargo-live)
 * Output: out/issue-98/live/ (ignored path; nothing here is committed).
 *
 * Isolation and dev-server fixture follow scripts/issue-99-live-probe.mjs and
 * scripts/issue-100-live-probe.mjs: an OS-assigned loopback Vite port started
 * through `createServer` with `server: { watch: null }` and
 * `optimizeDeps: { noDiscovery: true, include: [] }` (the cold dependency scan
 * and the chokidar watcher startup both stall the page on this workspace), an
 * OS-assigned CDP port, a fresh Chrome profile outside the repository, and
 * teardown of only the processes and profile this run created. Application
 * source, vite.config.js and the bundle budget are untouched.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE98_OUT || join(repo, 'out', 'issue-98', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE98_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = resolvePath(process.env.ISSUE98_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue98-cargo-';
const PINS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

// The disclosed manifest every loaded fixture carries. Ordinary bulk
// commodities (state.js COMMODITIES) — never data rows, which spill separately.
const HOLD = [{ commodity: 'rawOre', units: 5 }, { commodity: 'refinedMetals', units: 3 }];
const HOLD_PODS = HOLD.map((r) => `${r.commodity}:${r.units}`).sort();
const HOLD_KEYS = HOLD.map((r) => r.commodity);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const results = {
  commit: process.env.ISSUE98_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  boot: null,
  privilegedFixture: {
    what: "each fixture hull is spawned and given an INITIAL COMBAT HISTORY and an INITIAL MANIFEST: resolve 50, an INITIAL ai.band of 'shaken' as a starting point, personality 0, screen 0, shell 0, a FULL hull, engine full, the stated ordinary cargo rows, fresh lastCombatAt, ai.resolveAt 0, ai.calmUntil 0, ai.hailed false, ai.demandSent true (suppresses the unrelated wave-30 demand hail) and ai.lastAttacker 'npc' or 'player' as each pin discloses",
    bandWalk: "the hull is then walked DOWN from full in 4% steps (defenses zeroed, lastCombatAt refreshed, resolve/calm clocks cleared each step) and STOPS the instant the live npc update reports the band the pin needs — every pin here stops at 'bargaining'. The reached band, resolve and hull fraction are recorded per pin; the band the live loop computes, the offered verbs and the card are never written",
    manifest: HOLD,
    alsoStaged: 'ambient hulls parked outside the engagement bubble, player defenses topped up to full so the pass is survivable, player placed at 6000,6000,6000 with the fixture near 6000,6000,5940, and ctx.targets.current pointed at the fixture so the PUBLIC target row can be read',
    l5Takeover: "L5 sets ONE further live field on its own fixture, ai.lastAttacker = 'npc', AFTER the real surrender card has opened, to stage the rare takeover at the click boundary; the button it then clicks is the real rendered button and the refusal is the live card's own",
    neverWritten: 'no synthetic hailOpened, no synthetic npcSurrendered, no pod, no fear, no credit, no state.surrendered, no card kind, no intent list, and no expected outcome of any kind; the offered verbs, the pods, the fear step, the incidents and every refusal token are produced only by the live NPC update, the live hail card, the live pods system and the live world ledger',
    input: "L2, L3 and L4 resolve or are refused through the PUBLIC window.rimward act('hailResolve'); L5 and L6 click the REAL rendered card button (a programmatic invocation of its own handler, not physical human input). The berth boundary is not exercised here — issue #100's live probe and the focused suite cover it",
    honesty: 'these are privileged INITIAL states, not a claim that the combat history or the manifest was naturally encountered in this session',
  },
  devServerNote: "harness-only dev server: vite createServer with server { watch: null } and optimizeDeps { noDiscovery: true, include: [] }, as scripts/issue-99-live-probe.mjs and scripts/issue-100-live-probe.mjs document. App source, vite.config.js and the production bundle budget are unchanged",
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
 * One synchronous read-only sample of the rendered card, the public observation,
 * the public target row and the live pod field, so a transition can never be
 * sampled twice at two different instants. Nothing here writes.
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
  const podRows = [];
  if (c && Array.isArray(c.pods)) {
    for (const pod of c.pods) {
      const rows = pod && pod.contents;
      if (!Array.isArray(rows)) continue;
      for (const r of rows) if (r && typeof r.commodity === 'string') podRows.push(r.commodity + ':' + (r.units | 0));
    }
  }
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
    docked: c ? c.flags.docked === true : null,
    station: c ? !!(c.station && c.station.inZone === true) : null,
    // Read-only ledger and pod-field samples: neither is public surface.
    podRows,
    pods: c && Array.isArray(c.pods) ? c.pods.length : null,
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
  // The fear step is READ from the live tuning table, never asserted as a
  // literal by this harness.
  const { ECON } = await import('/src/game/state.js');
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
    throw new Error('issue98 SETUP: no authored ship asset ready within 15000ms: ' + tries.map(label).join(', '));
  }
  const bag = { ships: {}, used: null, fearStep: ECON.fear.capitulation };
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
        id: 'i98-' + tag + '-' + Date.now(),
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
   * privilegedFixture: the disclosed INITIAL combat history and manifest.
   * hullFrac, attacker and hold are stated by the caller and echoed back into
   * the ledger. No outcome is written here — the offered verbs, the band, the
   * card, the pods and the yield are the live systems' own work.
   */
  bag.history = (tag, hullFrac, attacker, hold) => {
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
    st.cargo = (hold || []).map((r) => ({ commodity: r.commodity, units: r.units }));
    st.lastCombatAt = c.world.time;
    const ai = s.ai;
    ai.band = 'shaken';
    ai.resolveAt = 0;
    ai.calmUntil = 0;
    ai.hailed = false;
    ai.demandSent = true; // suppress the unrelated wave-30 pirate demand hail
    ai.lastAttacker = attacker;
    return {
      tag, hullFrac, lastAttacker: attacker, resolve: st.resolve,
      cargo: st.cargo.map((r) => r.commodity + ':' + r.units).join(','),
    };
  };
  /**
   * privilegedFixture: the live band walk. Cargo aboard is itself a reason to
   * yield (state.js computeResolve reads cargoAtStake), so a fixed hull
   * fraction that leaves an EMPTY hull bargaining drops a LOADED one straight
   * into automatic capitulation. This walks the hull down in small steps and
   * stops the moment the LIVE npc update reports the band it was asked for —
   * the same shape scripts/issue-99-surrender-attribution-test.mjs uses. Only
   * defenses, hull, lastCombatAt and the resolve/calm clocks are written; the
   * band, the offered verbs and the card are the live loop's own work.
   */
  bag.walkTo = async (tag, band, steps) => {
    const s = bag.ships[tag];
    if (!s) return null;
    const limit = steps || 60;
    for (let i = 0; i < limit && s.ai.band !== band; i++) {
      s.state.screen = 0;
      s.state.shell = 0;
      s.state.hull = Math.max(1, s.state.hull - s.state.hullMax * 0.04);
      s.state.lastCombatAt = c.world.time;
      s.ai.resolveAt = 0;
      s.ai.calmUntil = 0;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    return bag.band(tag);
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
  /** Everything a cargo demand would move. Read-only. */
  bag.effects = (tag) => {
    const s = bag.ships[tag];
    const podRows = [];
    if (Array.isArray(c.pods)) {
      for (const pod of c.pods) {
        const rows = pod && pod.contents;
        if (!Array.isArray(rows)) continue;
        for (const r of rows) if (r && typeof r.commodity === 'string') podRows.push(r.commodity + ':' + (r.units | 0));
      }
    }
    return {
      credits: c.world.credits,
      fear: c.world.fear,
      pods: Array.isArray(c.pods) ? c.pods.length : null,
      podRows,
      incidents: c.world.incidents.length,
      milestones: c.world.milestones.length,
      firstCapitulation: c.world.milestones.includes('firstCapitulation'),
      surrendered: !!(s && s.state && s.state.surrendered),
      cargo: s && s.state && Array.isArray(s.state.cargo)
        ? s.state.cargo.map((r) => r.commodity + ':' + r.units).join(',') : null,
      mode: s && s.ai ? (s.ai.mode || null) : null,
      escape: !!(s && s.record && s.record.escape),
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
  window.__i98 = bag;
  return true;
})()`;

const call = (js) => `(() => { const r = (window.__i98.${js}); return typeof r === 'object' ? JSON.stringify(r) : r; })()`;
const act = (name, args) => `(() => JSON.stringify(window.rimward.act({ v: 2, name: ${JSON.stringify(name)}, args: ${JSON.stringify(args || {})} })))()`;

/** New pod rows carrying one of the manifest commodities, sorted. */
function newHoldPods(before, after) {
  const seen = before.slice().sort();
  const rest = [];
  for (const row of after.slice().sort()) {
    const i = seen.indexOf(row);
    if (i >= 0) { seen.splice(i, 1); continue; }
    rest.push(row);
  }
  return rest.filter((r) => HOLD_KEYS.includes(r.split(':')[0])).sort();
}
const sameRows = (a, b) => JSON.stringify(a) === JSON.stringify(b);

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
      throw new Error('issue98 boot: window.rimward never appeared within 60000ms; last=' + JSON.stringify(handle));
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
    if (phase !== 'playing') throw new Error(`issue98 boot: session phase stuck at ${JSON.stringify(phase)}`);
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
    const fearStep = await cdp.eval('window.__i98.fearStep');
    say('live capitulation fear step', String(fearStep));
    results.fearStep = fearStep;

    const bandOf = async (tag) => JSON.parse(await cdp.eval(call(`band('${tag}')`)));
    const effectsOf = async (tag) => JSON.parse(await cdp.eval(call(`effects('${tag}')`)));
    const cardUp = (s) => !!(s && s.card && s.card.display === 'block' && s.hail && s.hail.open === true);
    const holdJson = JSON.stringify(HOLD);
    /** Walk one fixture down to a band through the live update loop. */
    const walkTo = async (tag, band) => JSON.parse(await cdp.eval(
      `(async () => JSON.stringify(await window.__i98.walkTo('${tag}', '${band}')))()`,
      60000,
    ));

    // ============ L1 / L2 a loaded hull offers, then gives up, its holds ======
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('loaded', 'Sabra Ilk')")));
      if (!spawned.ok) throw new Error('issue98 L1: fixture ship would not spawn');
      // DISCLOSED: initial combat history naming the PLAYER as the last
      // effective attacker, a full hull, and the disclosed manifest. The band
      // itself is walked down by the live loop below.
      const history = JSON.parse(await cdp.eval(
        call(`history('loaded', 1, 'player', ${holdJson})`),
      ));
      results.fixtures.L1 = { spawned, history, manifest: HOLD };
      say('L1 fixture', JSON.stringify(history));
      const before = await cdp.eval(PROBE);
      const walked = await walkTo('loaded', 'bargaining');
      say('L1 walk', JSON.stringify(walked));
      // The LIVE npc update decides the verbs; the probe only watches.
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      const sampled = await bandOf('loaded');
      await cdp.shot('01-l1-loaded-surrender-card.png');

      const cargoButton = (card.card?.buttons || []).find((b) => /Demand cargo/i.test(b)) || null;
      const intents = card.hail?.intents || [];
      const conversationId = card.hail?.conversationId ?? null;
      record('L1', !!(cardUp(card)
        && card.hail.kind === 'surrender'
        && card.card.header
        && sampled.band === 'bargaining'
        && sampled.lastAttacker === 'player'
        && sampled.surrendered === false
        && intents.includes('demandCargo')
        && (card.hail.terms?.options || []).some((o) => o.intent === 'demandCargo')
        && cargoButton
        && !/Salvage cargo/i.test(cargoButton)
        && conversationId),
      {
        history, walked, sampled, intents, cargoButton, conversationId,
        card: { display: card.card.display, header: card.card.header, buttons: card.card.buttons, hail: card.hail, target: card.target },
        before: { card: before.card.display, credits: before.credits, fear: before.fear, pods: before.pods },
      });

      // ---- L2 the bound public resolution ---------------------------------
      const pre = await effectsOf('loaded');
      const resolved = conversationId
        ? JSON.parse(await cdp.eval(act('hailResolve', {
          intent: 'demandCargo', expectedConversationId: conversationId,
        })))
        : { ok: false, token: 'no-conversation' };
      say('L2 hailResolve', JSON.stringify(resolved));
      // The pods, the yield and the ledger row land across live frames, so wait
      // for the public flag AND this fixture's own new player-attributed row.
      const paid = await waitUntil(PROBE, (v) => !!(v && v.target && v.target.surrendered === true
        && v.incidents > pre.incidents
        && (v.lastIncidents || []).some((i) => i.kind === 'surrendered' && i.name === 'loaded' && i.causer === 'player')),
      15000, 200);
      const post = await effectsOf('loaded');
      await cdp.shot('02-l2-cargo-taken.png');

      const spilled = newHoldPods(pre.podRows, post.podRows);
      const incident = (paid.lastIncidents || [])
        .find((i) => i.kind === 'surrendered' && i.name === 'loaded') || null;

      // A second bound resolve of the same conversation must do nothing.
      const again = JSON.parse(await cdp.eval(act('hailResolve', {
        intent: 'demandCargo', expectedConversationId: conversationId,
      })));
      say('L2 duplicate', JSON.stringify(again));
      await sleep(700);
      const settled = await effectsOf('loaded');

      record('L2', !!(resolved.ok === true
        && sameRows(spilled, HOLD_PODS)
        && post.cargo === ''
        && post.fear === pre.fear + fearStep
        && post.credits === pre.credits
        && post.surrendered === true
        && post.mode === 'flee'
        && post.escape === true
        && incident && incident.causer === 'player'
        && paid.hail && paid.hail.open === false
        && paid.card.display !== 'block'
        // and the duplicate moved nothing
        && again.ok === false
        && settled.credits === post.credits
        && settled.fear === post.fear
        && sameRows(newHoldPods(post.podRows, settled.podRows), [])
        && settled.cargo === ''),
      {
        resolved, duplicate: again, spilled, wanted: HOLD_PODS, incident,
        fearStep, pre, post, settled,
        after: { card: paid.card.display, hail: paid.hail, target: paid.target, incidents: paid.incidents },
      });
      await cdp.eval(call("remove('loaded')"));
    }

    // ================= L3 an empty hold omits the verb =====================
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('empty', 'Deo Mara')")));
      if (!spawned.ok) throw new Error('issue98 L3: fixture ship would not spawn');
      // DISCLOSED: the same player-attributed history, a full hull, and an
      // EMPTY manifest; the band is walked down by the live loop.
      const history = JSON.parse(await cdp.eval(call("history('empty', 1, 'player', [])")));
      results.fixtures.L3 = { spawned, history };
      say('L3 fixture', JSON.stringify(history));
      const walked = await walkTo('empty', 'bargaining');
      say('L3 walk', JSON.stringify(walked));
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      const pre = await effectsOf('empty');
      await cdp.shot('03-l3-empty-hold-card.png');

      const intents = card.hail?.intents || [];
      const conversationId = card.hail?.conversationId ?? null;
      const refused = conversationId
        ? JSON.parse(await cdp.eval(act('hailResolve', {
          intent: 'demandCargo', expectedConversationId: conversationId,
        })))
        : { ok: false, token: 'no-conversation' };
      say('L3 hailResolve', JSON.stringify(refused));
      await sleep(700);
      const post = await effectsOf('empty');
      const after = await cdp.eval(PROBE);

      record('L3', !!(cardUp(card)
        && card.hail.kind === 'surrender'
        && !intents.includes('demandCargo')
        && !(card.card.buttons || []).some((b) => /cargo/i.test(b))
        && intents.includes('demandRansom')
        && refused.ok === false
        && post.credits === pre.credits
        && post.fear === pre.fear
        && post.pods === pre.pods
        && post.surrendered === false
        && post.incidents === pre.incidents
        && after.hail && after.hail.open === true),
      {
        history, walked, intents, refused, pre, post,
        card: { display: card.card.display, buttons: card.card.buttons, hail: card.hail },
        after: { card: after.card.display, hail: after.hail, target: after.target },
      });
      await cdp.eval(call("remove('empty')"));
    }

    // ================= L4 someone else's prize stays theirs ================
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('npc-break', 'Sten Ilo')")));
      if (!spawned.ok) throw new Error('issue98 L4: fixture ship would not spawn');
      // DISCLOSED: initial combat history naming another NPC as the last
      // effective attacker, a full hull, and the disclosed manifest. The band
      // is walked down by the live loop and stops at bargaining.
      const history = JSON.parse(await cdp.eval(
        call(`history('npc-break', 1, 'npc', ${holdJson})`),
      ));
      results.fixtures.L4 = { spawned, history, manifest: HOLD };
      say('L4 fixture', JSON.stringify(history));
      const pre = await effectsOf('npc-break');
      const sampled = await walkTo('npc-break', 'bargaining');
      say('L4 walk', JSON.stringify(sampled));
      await sleep(1200); // give any card that WOULD open time to render
      const quiet = await cdp.eval(PROBE);
      const refused = JSON.parse(await cdp.eval(act('hailResolve', { intent: 'demandCargo' })));
      say('L4 hailResolve', JSON.stringify(refused));
      await sleep(700);
      const post = await effectsOf('npc-break');
      await cdp.shot('04-l4-npc-break-no-card.png');

      record('L4', !!(sampled.band === 'bargaining'
        && sampled.lastAttacker === 'npc'
        && sampled.surrendered === false
        && quiet.card.display !== 'block'
        && quiet.hail.open === false
        && quiet.hailOpenFlag === false
        && refused.ok === false
        && post.cargo === pre.cargo
        && post.pods === pre.pods
        && post.credits === pre.credits
        && post.fear === pre.fear
        && post.surrendered === false),
      {
        history, sampled, refused, pre, post,
        quiet: { card: quiet.card, hail: quiet.hail, target: quiet.target },
      });
      await cdp.eval(call("remove('npc-break')"));
    }

    // ================= L5 a staged takeover at the click boundary ==========
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('click-race', 'Cass Odo')")));
      if (!spawned.ok) throw new Error('issue98 L5: fixture ship would not spawn');
      // DISCLOSED: player-attributed history, a full hull, full manifest; the
      // band is walked down by the live loop.
      const history = JSON.parse(await cdp.eval(
        call(`history('click-race', 1, 'player', ${holdJson})`),
      ));
      results.fixtures.L5 = { spawned, history, manifest: HOLD };
      say('L5 fixture', JSON.stringify(history));
      say('L5 walk', JSON.stringify(await walkTo('click-race', 'bargaining')));
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      if (!cardUp(card)) throw new Error('issue98 L5: the player card never rendered');
      await cdp.shot('05-l5-card-before-click.png');

      // ONE evaluation: the STAGED effective-NPC takeover is written and the
      // rendered button is clicked in the same synchronous stretch, so no frame
      // can close the card in between. This is a programmatic invocation of the
      // DOM button handler (button.click()), not physical human input; the API
      // boundary is covered by L2's and L3's bound resolves.
      const race = await cdp.eval(`(() => {
        const c = window.__ctx;
        const s = window.__i98.ships['click-race'];
        const before = window.__i98.effects('click-race');
        s.ai.lastAttacker = 'npc'; // staged takeover, disclosed in result.json
        const cardEl = document.querySelector('.rw-hail-card');
        const btn = cardEl
          ? [...cardEl.querySelectorAll('button')].find((b) => /Demand cargo/i.test(b.textContent || ''))
          : null;
        const clicked = !!btn;
        if (btn) btn.click();
        const after = window.__i98.effects('click-race');
        return { before, clicked, after, hailOpenNow: c.flags.hailOpen === true };
      })()`);
      say('L5 race', JSON.stringify(race).slice(0, 600));
      const closed = await waitUntil(PROBE, (v) => !!(v && v.hail && v.hail.open === false
        && v.card && v.card.display !== 'block'), 10000, 150);
      const settled = await effectsOf('click-race');
      await cdp.shot('06-l5-card-closed.png');

      const untouched = race.clicked === true
        && race.after.cargo === race.before.cargo
        && race.after.pods === race.before.pods
        && race.after.fear === race.before.fear
        && race.after.credits === race.before.credits
        && race.after.surrendered === race.before.surrendered
        && settled.cargo === race.before.cargo
        && settled.pods === race.before.pods
        && settled.fear === race.before.fear
        && settled.credits === race.before.credits
        && settled.surrendered === race.before.surrendered
        && settled.incidents === race.before.incidents;

      record('L5', !!(untouched
        && closed.hail && closed.hail.open === false
        && closed.card.display !== 'block'
        && closed.hailOpenFlag === false),
      {
        history, clicked: race.clicked,
        before: race.before, afterClick: race.after, settled,
        closed: { display: closed.card.display, open: closed.hail && closed.hail.open, target: closed.target },
      });
      await cdp.eval(call("remove('click-race')"));
    }

    // ================= L6 the RENDERED button takes the holds ==============
    // The positive counterpart to L5: the same real "Demand cargo" button, on a
    // card whose claim still holds, really pays out. No public API call here —
    // the only input is the click on the button the player can see.
    {
      const spawned = JSON.parse(await cdp.eval(call("spawn('button', 'Iva Roon')")));
      if (!spawned.ok) throw new Error('issue98 L6: fixture ship would not spawn');
      // DISCLOSED: player-attributed history, a full hull, full manifest; the
      // band is walked down by the live loop.
      const history = JSON.parse(await cdp.eval(
        call(`history('button', 1, 'player', ${holdJson})`),
      ));
      results.fixtures.L6 = { spawned, history, manifest: HOLD };
      say('L6 fixture', JSON.stringify(history));
      say('L6 walk', JSON.stringify(await walkTo('button', 'bargaining')));
      const card = await waitUntil(PROBE, cardUp, 25000, 200);
      if (!cardUp(card)) throw new Error('issue98 L6: the loaded card never rendered');
      await cdp.shot('07-l6-card-before-click.png');
      const pre = await effectsOf('button');

      // A programmatic invocation of the rendered button's own handler
      // (button.click()), not physical human input.
      const clicked = await cdp.eval(`(() => {
        const cardEl = document.querySelector('.rw-hail-card');
        const btn = cardEl
          ? [...cardEl.querySelectorAll('button')].find((b) => /Demand cargo/i.test(b.textContent || ''))
          : null;
        if (!btn) return { clicked: false, label: null };
        const label = btn.textContent || '';
        btn.click();
        return { clicked: true, label };
      })()`);
      say('L6 click', JSON.stringify(clicked));
      const paid = await waitUntil(PROBE, (v) => !!(v && v.target && v.target.surrendered === true
        && v.incidents > pre.incidents
        && (v.lastIncidents || []).some((i) => i.kind === 'surrendered' && i.name === 'button' && i.causer === 'player')),
      15000, 200);
      const post = await effectsOf('button');
      await cdp.shot('08-l6-button-payout.png');

      const spilled = newHoldPods(pre.podRows, post.podRows);
      const incident = (paid.lastIncidents || [])
        .find((i) => i.kind === 'surrendered' && i.name === 'button') || null;

      record('L6', !!(clicked.clicked === true
        && sameRows(spilled, HOLD_PODS)
        && post.cargo === ''
        && post.fear === pre.fear + fearStep
        && post.credits === pre.credits
        && post.surrendered === true
        && post.mode === 'flee'
        && incident && incident.causer === 'player'
        && paid.hail && paid.hail.open === false
        && paid.card.display !== 'block'),
      {
        history, clicked, spilled, wanted: HOLD_PODS, incident, fearStep, pre, post,
        after: { card: paid.card.display, hail: paid.hail, target: paid.target, incidents: paid.incidents },
      });
      await cdp.eval(call("remove('button')"));
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
      console.log('\nISSUE-98 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-98 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
