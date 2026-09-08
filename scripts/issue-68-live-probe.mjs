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
 *   G2  gate route    - the player takes a ransom through the PUBLIC hail
 *                       (hailResolve/demandRansom): that resolution alone
 *                       breaks the hull off, it commits to a NAMED gate, the
 *                       bracket says so, and the public row publishes the same
 *                       word, kind, destination and phase
 *   G3  station route - a TRADER panics through its own job tick (a dented
 *                       screen, no staged mode) beside the station, commits to
 *                       the holding lane, and reaching it emits ONE
 *                       npcSheltered receipt while the ship stays locked,
 *                       present and damageable (no immunity, no bounty)
 *   G4  choice        - a committed leg is KEPT while it is still real, so the
 *                       trigger is a real obstruction: the pursuer is parked on
 *                       the leg the hull is actually flying (segment clearance
 *                       proven), and the game's own revalidation then commits
 *                       elsewhere or declares an explicit evade with NO transit
 *   G5  engine out    - a limping hull's sampled world speed stays inside 30%
 *                       of class cruise and it never completes a gate charge;
 *                       a disabled hull cannot depart at all
 *   G6  threshold     - a real chase across 1400 u: while SELECTED the runner
 *                       is retained past the fold; the player's own target key
 *                       then drops the lock, real traffic culls it, and
 *                       reacquiring it inside 900 u returns the SAME id at the
 *                       same damage on the same escape route
 *   G7  departure     - an actual completed gate jump by a pirate the player
 *                       PAID OFF: an ordinary demand card resolved with
 *                       payTribute through the public handle, so hail.js takes
 *                       the credits and stamps demandOutcome 'paid' with NO
 *                       surrender flag — physical arrival, a
 *                       visible charge, exactly one npcEscaped receipt with
 *                       origin/destination/eta, the lock released with a
 *                       readable reason, and the record inTransit
 *   G8  arrival       - the same id lands in the destination bank, the player
 *                       crosses for real — staged inside the source gate's
 *                       physical zone, confirmed in-zone by the PUBLIC
 *                       observation, then the PUBLIC dock/jump pulse and
 *                       gate.js's own crossing — and real traffic
 *                       re-instantiates that
 *                       same hull: same id, unhealed condition, the paid peace
 *                       still held (no fresh demand, no attack), lockable
 *
 * FIXTURES: a live session cannot be made to produce a damaged runner beside
 * a chosen gate on demand, so a clearly labelled harness (`window.__i68`,
 * recorded as `privilegedFixture` in the ledger) spawns the hull, parks
 * ambient traffic COHERENTLY (the dormant record's abstract route and its
 * live hull are translated to the same far parking point, so traffic.js's own
 * spawn pass — which reads recordPosition — cannot keep re-instantiating the
 * hull the harness just moved, and an ambient pirate cannot hijack the
 * fixture's hail card; the runner is never parked, so its cull/reacquisition
 * is real traffic), stages the player (including, for G8, a spatial placement
 * inside the source gate's physical JUMP.zone bore so the crossing itself can
 * be commanded through the PUBLIC pulse/dock control), and seeds INITIAL
 * condition only — where the ship is, how
 * hurt it is, whether its screen is dented, whether its engine is out — plus
 * the bargaining/demand card's hailOpened event (with a purse that can cover
 * the price) and, for the rare-condition legs
 * (G5 engine-out, G6 chase) only, the ordinary `flee` mode. G2/G3/G7 stage no
 * mode at all: the break-off is produced by the public hail resolution or by
 * the trader's own panic. It NEVER writes an escape plan, a phase, a charge,
 * a destination, a transit, a receipt, a peace/surrender flag, a lock release
 * or a restored value.
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
  fixtureNote: 'privilegedFixture: ship spawn, COHERENT ambient parking (each background record’s abstract route AND its live hull translated together to one far parking point, runner excluded, so recordPosition/traffic.js stop re-instantiating the same background hulls beside the measurement), player hull pin, player spatial staging (including the G3 observer placed inside the public 600u target range but off the escape leg, and the G8 placement inside the source gate’s physical JUMP.zone bore before the PUBLIC dock/jump pulse), the public close of any stray ambient hail card, the bargaining/demand card hailOpened event plus a purse that can cover the demand, and seeded INITIAL condition (position, hull/screen/engine damage, engineOut/disabled flags, the lastHitAt/lastCombatAt of the exchange that caused them; the ordinary flee mode ONLY for the G5 engine-out and G6 chase legs). G2 breaks off through the public hailResolve demandRansom path, G7 through public payTribute on a real demand card (hail.js debits the credits and stamps demandOutcome), and G3 through the real trader panic. The harness never writes an escape plan, phase, charge, destination, transit, receipt, peace/surrender flag, lock release or restored value — every asserted outcome is produced by npc.js/world.js/traffic.js/hail.js and read back from the DOM, window.rimward or the persistent record.',
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
  // The bracket prints ONE resolve line: the morale/outcome band and, after
  // a separator, the issue-68 escape word. Read the whole rendered target
  // metadata block as well as that child, and keep the band apart from the
  // escape clause so each is compared against the field that owns it.
  const resolveEl = q('.rw-target-resolve');
  const resolveText = txt(resolveEl);
  const parts = resolveText.split(' · ');
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
      resolve: resolveText,
      // the resolve band alone, kept separate from the escape clause
      bandWord: parts[0] || '',
      // the escape clause as the bracket actually renders it
      escape: parts.slice(1).join(' · '),
      // everything the bracket is showing, whichever child owns the words
      info: txt(q('.rw-target-info')),
    },
    gate: o && o.gate ? o.gate : null,
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
  // The production abstract-route reader: read-only evidence, never a control.
  const { recordPosition } = await import('/src/game/world.js');
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
    rp: recordPosition,
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
    // FIXTURE: INITIAL condition only — ordinary battle damage, a dented
    // screen, an engine out. The flee MODE is no longer staged by default:
    // G2/G7 enter through the real public hail resolution and G3 through the
    // real trader panic. The flee option remains for the rare-condition legs
    // (G5 engine-out, G6 chase), and is attributed as such.
    if (Number.isFinite(o.hull)) live.state.hull = o.hull;
    if (Number.isFinite(o.screen)) live.state.screen = o.screen;
    if (o.engineOut === true) {
      live.state.engineOut = true;
      live.state.engine = live.state.engineMax * 0.1;
    }
    // The exchange that did this damage is part of the same INITIAL condition:
    // without lastCombatAt the hull reads as decades out of combat and the
    // ordinary repair rule starts healing it before the fixture is measured.
    live.state.lastHitAt = c.world.time;
    live.state.lastCombatAt = c.world.time;
    live.ai.intent = false;
    live.ai.target = null;
    if (o.flee === true) {
      live.ai.mode = 'flee';
      live.ai.fleeFrom = 'player';
    }
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
  /**
   * FIXTURE: keep ambient traffic out of the measurement — COHERENTLY.
   *
   * Moving only the live hull was incoherent: traffic.js's spawn pass reads
   * recordPosition(rec), which for a dormant background record is its abstract
   * route, so the same hull was re-instantiated beside the fixture every poll
   * and its ordinary pirate hail stole the fixture's card. So the DORMANT
   * record geometry moves with the hull: every waypoint of a background
   * record's route is TRANSLATED (shape and leg lengths intact, so the
   * abstract lane keeps ticking normally) to the far parking lane, and the
   * live hull is put at the same place. The runner is never touched — its
   * cull, its re-instantiation and its escape are real traffic.
   */
  bag.parkAt = [80000, 80000, 80000];
  bag.park = () => {
    const P = bag.parkAt;
    const lists = [];
    if (Array.isArray(c.world.records)) lists.push(c.world.records);
    const banks = c.world.recordBanks || {};
    for (const k of Object.keys(banks)) {
      if (Array.isArray(banks[k]) && !lists.includes(banks[k])) lists.push(banks[k]);
    }
    let recs = 0;
    let already = 0;
    let escaping = 0;
    for (const list of lists) {
      for (const rec of list) {
        if (!rec || rec === bag.rec) continue;
        const route = rec.route;
        if (!Array.isArray(route) || route.length === 0) continue;
        const head = route[0];
        if (!head) continue;
        if (Math.abs(head.x) > 40000 || Math.abs(head.z) > 40000) { already++; continue; }
        const dx = P[0] - head.x;
        const dy = P[1] - head.y;
        const dz = P[2] - head.z;
        for (const w of route) {
          if (!w) continue;
          w.x += dx; w.y += dy; w.z += dz;
        }
        recs++;
        // Read-only note: a background record whose own escape plan owns its
        // position is not moved by this (the plan is the game's, never the
        // harness's). Reported so the ledger can say so out loud.
        const plan = rec.escape;
        if (plan && plan.phase && plan.phase !== 'done') escaping++;
      }
    }
    let hulls = 0;
    for (const s of c.ships) {
      if (!s || !s.object) continue;
      if (bag.rec && s.record === bag.rec) continue;
      s.object.position.set(P[0], P[1], P[2]);
      hulls++;
    }
    return { recs, already, escaping, hulls };
  };
  /**
   * FIXTURE: stage the ENCOUNTER STATE only — the bargaining card is opened
   * with the game's own hailOpened event (the issue-67 probe's proven
   * pattern). The card, its terms and every consequence of resolving it —
   * the credits, the peace, the flee, the plan — are hail.js's and npc.js's.
   */
  bag.hailOpen = () => {
    const s = bag.ship;
    if (!s) return false;
    c.emit('hailOpened', {
      ship: s,
      intents: ['demandRansom', 'letGo', 'keepFiring'],
      line: 'They are breaking.',
    });
    return true;
  };
  /**
   * FIXTURE: the ordinary wave-30 DEMAND encounter state — the pirate has
   * heaved to and named a price, and the purse can cover it. hail.js builds
   * the card; every consequence of paying it (the debit, the calm window, the
   * paid outcome, the break-off and its refuge) belongs to the game.
   */
  bag.hailDemand = (n) => {
    const s = bag.ship;
    if (!s) return false;
    if (!Number.isFinite(c.world.credits) || c.world.credits < n * 3) c.world.credits = n * 3;
    s.ai.demanding = true;
    s.ai.demandSent = true;
    s.ai.demandAmount = n;
    s.ai.demandPeaceAt = c.world.time;
    s.ai.demandExpiresAt = c.world.time + 600;
    c.emit('hailOpened', {
      ship: s,
      demandHail: true,
      demand: n,
      speaker: s.state.name,
      intents: ['payTribute', 'showTeeth', 'refuseFight'],
    });
    return true;
  };
  bag.credits = () => c.world.credits;
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
      curSys: c.world.currentSystem,
      surrendered: live ? live.state.surrendered === true
        : !!(esc && esc.cond && esc.cond.flags && esc.cond.flags.surrendered),
      demandOutcome: live ? (live.ai.demandOutcome ?? null)
        : (esc && esc.peace ? (esc.peace.demandOutcome ?? null) : null),
      intent: live ? live.ai.intent === true : null,
      live: !!live,
      state: rec.state,
      system: rec.system,
      pos: p ? [Math.round(p.x), Math.round(p.y), Math.round(p.z)] : null,
      player: [Math.round(pp.x), Math.round(pp.y), Math.round(pp.z)],
      dest: esc && Array.isArray(esc.dest) ? esc.dest.map((n) => Math.round(n)) : null,
      // Where the record ACTUALLY is. An active plan owns that position, a
      // resolved one does not, and world.js's own recordPosition knows the
      // difference — so ask it rather than reading the plan unconditionally.
      recPos: (() => {
        if (bag.rp) {
          const out = new (c.ship.object.position.constructor)();
          bag.rp(rec, out);
          return [Math.round(out.x), Math.round(out.y), Math.round(out.z)];
        }
        return esc && Array.isArray(esc.pos) ? esc.pos.map((n) => Math.round(n)) : null;
      })(),
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
/** The live public hail card: open flag, conversation id, speaker and terms. */
const HAIL = `(() => {
  const h = window.rimward.observe().hail;
  return JSON.stringify(h ? {
    open: h.open === true,
    id: h.conversationId,
    intents: h.intents,
    speaker: h.speaker ? h.speaker.id : null,
    demand: h.terms && h.terms.amounts ? h.terms.amounts.demand : null,
  } : null);
})()`;
/**
 * Bounded PUBLIC parley view: how many hail/demand rows the ring is carrying
 * and the last few. PROBE.events is filtered to the escape receipts, so this
 * is the only honest way to say "no NEW demand was opened".
 */
const HAILRING = `(() => {
  const rows = (window.rimward.observe().events || []).filter((e) => e
    && (e.type === 'hailOpened' || e.type === 'hailClosed' || e.type === 'npcSurrendered'));
  return JSON.stringify({ n: rows.length, last: rows.slice(-4) });
})()`;

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

    /** Coherent ambient parking: { recs, already, escaping, hulls }. */
    const park = async () => {
      const r = await cdp.eval(call('park()'));
      try { return JSON.parse(r); } catch { return r; }
    };
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
    const resolveCard = async (card, intent) => (card && card.id
      ? JSON.parse(await cdp.eval(
        `(() => JSON.stringify(window.rimward.act({ v: 2, name: 'hailResolve', args: { intent: ${JSON.stringify(intent)}, expectedConversationId: ${JSON.stringify(card.id)} } })))()`))
      : { ok: false, error: 'no-card' });
    /**
     * A card belonging to somebody else is hung up the ordinary way — the
     * PUBLIC handle, on the least consequential verb the card itself lists.
     * It is never the card an assertion is made about.
     */
    const closeStrayCard = async (card) => {
      const listed = Array.isArray(card?.intents) ? card.intents : [];
      const verb = ['letGo', 'refuseFight', 'respect'].find((i) => listed.includes(i));
      if (!verb) return { ok: false, error: 'no-benign-intent', speaker: card?.speaker ?? null };
      const out = await resolveCard(card, verb);
      say('stray card closed', JSON.stringify({ speaker: card.speaker, verb, ok: out?.ok }));
      return { ...out, speaker: card.speaker ?? null, verb };
    };
    /**
     * hailOpen/hailDemand only EMIT: hail.js builds the card on its own tick.
     * Wait for a real, open conversation bound to THIS hull and offering the
     * verb we mean to press. A card belonging to anybody else is hung up
     * publicly (and the fixture's own emit re-sent, since hail.js will not
     * build a second card over an open one) — it is never resolved as if it
     * were the fixture's. A mismatch that never resolves returns null: the
     * probe fails the pin rather than pressing a stranger's verb.
     */
    const openCard = async (label, intent, id, reopen, ms = 20000) => {
      const end = Date.now() + ms;
      let last = null;
      const strays = [];
      while (Date.now() < end) {
        last = JSON.parse(await cdp.eval(HAIL));
        if (last && last.open === true && last.id
          && last.speaker === id
          && Array.isArray(last.intents) && last.intents.includes(intent)) return last;
        if (last && last.open === true && last.id && last.speaker !== id) {
          strays.push(await closeStrayCard(last));
          await sleep(400);
          if (typeof reopen === 'function') await reopen();
        }
        await sleep(250);
      }
      say('CARD MISS', label, JSON.stringify({ last, strays }));
      return null;
    };
    /**
     * Receipts are read from ONE persistent public ring shared by every hull
     * in the session, so every receipt assertion — positive or negative — is
     * scoped to THIS target and to the scenario's own baseline. Another ship's
     * old departure must never fail (or pass) a scenario it has nothing to do
     * with.
     */
    const receiptsFor = (p, type, id, since) => (p?.events || []).filter((e) => e
      && e.type === type && e.targetId === id
      && (!Number.isFinite(since) || !Number.isFinite(e.t) || e.t >= since));
    const worldTime = async () => (await probe()).t ?? 0;
    /** Does the rendered bracket actually carry this exact escape clause? */
    const hudSays = (hud, label) => !!(label && hud
      && (String(hud.escape || '').includes(label)
        || String(hud.resolve || '').includes(label)
        || String(hud.info || '').includes(label)));
    /** Distance from a point to a segment — the same clearance the game uses. */
    const segClear = (a, b, t) => {
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const len2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
      let s = len2 > 1e-9
        ? ((t[0] - a[0]) * ab[0] + (t[1] - a[1]) * ab[1] + (t[2] - a[2]) * ab[2]) / len2 : 0;
      if (!Number.isFinite(s)) s = 0;
      const cs = s < 0 ? 0 : s > 1 ? 1 : s;
      return {
        t: s,
        dist: Math.hypot(a[0] + ab[0] * cs - t[0], a[1] + ab[1] * cs - t[1], a[2] + ab[2] * cs - t[2]),
      };
    };

    // ================= G1: front door + published vocabulary ===============
    {
      const p = await probe();
      record('G1', !!(p && p.v === 2 && p.optIn === true
        && Array.isArray(p.capabilities)
        && p.capabilities.includes('npcEscaped') && p.capabilities.includes('npcSheltered')),
      { v: p?.v, optIn: p?.optIn, sys: p?.sys, hasEscaped: p?.capabilities?.includes('npcEscaped') });
    }

    // ================= G2: a gate route, entered through a REAL hail =======
    {
      // No staged flee mode here: the hull breaks off because the player
      // resolved its bargaining card through the PUBLIC handle and took the
      // ransom. The mode, the refuge, the copy and the peace are the game's.
      const parked2 = await park();
      const t0 = await worldTime();
      const spawn = await spawnAt('Claim Wren', V(geom.gate, [140, 0, 90]), { hull: 46 });
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [420, 0, 300]))})`));
      await cdp.eval(call('lock()'));
      const hailOpen = () => cdp.eval(call('hailOpen()'));
      await hailOpen();
      // The card must be THIS hull's, offering THIS verb. Anything else is
      // hung up publicly and waited out; nobody else's verb is ever pressed.
      const card = await openCard('G2 bargaining card', 'demandRansom', spawn.id, hailOpen);
      const resolved = card ? await resolveCard(card, 'demandRansom') : { ok: false, error: 'no-matching-card' };
      results.samples.G2hail = { parked: parked2, card, resolved };
      // The break-off is the RESOLUTION's, not a staged mode.
      const p = await until('G2 gate route',
        (v) => v.ship && v.ship.mode === 'flee' && v.ship.escape && v.ship.escape.kind);
      await cdp.eval(call('lock()'));
      // Wait for the bracket to actually render the escape clause the public
      // row publishes — one sampled frame ahead of the HUD proves nothing.
      const locked = await until('G2 bracket', (v) => v.hud && v.hud.bracketHidden === false
        && v.lock && v.lock.id === spawn.id && v.lock.escape
        && hudSays(v.hud, v.lock.escape.label), 20000);
      results.samples.G2 = { plan: p?.ship, hud: locked?.hud, row: locked?.lock };
      await cdp.shot('g2-gate-route.png');
      const row2 = locked?.lock?.escape ?? null;
      record('G2', !!(spawn.ok && card && card.open === true && card.speaker === spawn.id
        && resolved && resolved.ok === true
        && p.ship && p.ship.mode === 'flee' && p.ship.escape
        && p.ship.escape.kind === 'gate' && p.ship.escape.to === geom.gateTo
        && locked.lock && locked.lock.id === spawn.id && row2
        && row2.kind === 'gate' && row2.to === geom.gateTo
        // …the row, the record and the rendered bracket all say the same
        // thing about the same hull, in the same sample
        && locked.ship && locked.ship.escape
        && row2.kind === locked.ship.escape.kind && row2.to === locked.ship.escape.to
        && row2.phase === locked.ship.escape.phase
        && locked.hud && locked.hud.bracketHidden === false
        && !!locked.hud.bandWord
        && hudSays(locked.hud, row2.label)),
      { card, resolved, escape: p?.ship?.escape, hud: locked?.hud,
        row: row2, pos: p?.ship?.pos, speed: p?.ship?.speed,
        surrendered: p?.ship?.surrendered, parked: parked2, since: t0 });
    }

    // ================= G3: the station holding lane ========================
    // G4 re-decides the SAME hull's committed leg, so it needs this id and
    // this scenario's baseline to scope its own receipt checks.
    let g3Id = null;
    let g3Since = null;
    {
      // A TRADER with a dented screen: the panic, the flee and the refuge all
      // come from tickTraderJob, not from a staged mode.
      await park();
      const t0 = await worldTime();
      const spawn = await spawnAt('Bent Kestrel', V(geom.station, [430, 0, 430]),
        { role: 'trader', hull: 58, screen: 0 });
      // FIXTURE (spatial): the observer sits inside the 600 u public target
      // range — the previous 972 u stand-off could not lock, so there was no
      // rendered proof of the shelter — while staying OFF the leg the hull
      // will fly: it is set perpendicular to the station run and BEHIND the
      // runner (segment parameter < 0), well outside the 260 u screening tube,
      // so the station is still the refuge the game picks under real pressure.
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.station, [713, 0, 147]))})`));
      const chose = await until('G3 station route',
        (v) => v.ship && v.ship.mode === 'flee' && v.ship.escape && v.ship.escape.kind);
      const legG3 = chose?.ship?.pos && chose?.ship?.dest
        ? segClear(chose.ship.pos, chose.ship.dest, chose.ship.player) : null;
      await cdp.eval(call('lock()'));
      const held = await until('G3 shelter',
        (v) => receiptsFor(v, 'npcSheltered', spawn.id, t0).length > 0
          && v.lock && v.lock.id === spawn.id
          && v.hud && v.hud.bracketHidden === false, 40000);
      results.samples.G3 = { plan: chose?.ship, leg: legG3, hold: held?.ship, hud: held?.hud,
        lock: held?.lock };
      await cdp.shot('g3-station-hold.png');
      const sheltered = receiptsFor(held, 'npcSheltered', spawn.id, t0);
      const receipt = sheltered[0] ?? null;
      record('G3', !!(spawn.ok && chose.ship?.escape?.kind === 'station'
        && sheltered.length === 1
        && receipt && receipt.kind === 'station' && receipt.system === geom.sys
        // still present, still locked, still damageable — not immunity
        && held.ship && held.ship.live === true && held.ship.state === 'enroute'
        && held.ship.disabled === false
        && held.lock && held.lock.id === spawn.id
        // …and the lock renders the refuge the row publishes
        && held.lock.escape && held.lock.escape.kind === 'station'
        && held.hud && held.hud.bracketHidden === false
        && hudSays(held.hud, held.lock.escape.label)
        // and this hull never took a gate
        && receiptsFor(held, 'npcEscaped', spawn.id, t0).length === 0),
      { plan: chose?.ship?.escape, leg: legG3, receipt, shelterCount: sheltered.length,
        hold: held?.ship, lockId: held?.lock?.id, row: held?.lock?.escape,
        hud: held?.hud, since: t0 });
      g3Id = spawn.id;
      g3Since = t0;
    }

    // ================= G4: the choice really re-decides =====================
    {
      // A committed leg is deliberately KEPT while it is still real — moving
      // the hull is not a reason to re-decide, and the probe must not pretend
      // it is. So: stage the hull next to the gate (spatial fixture), read the
      // leg it is ACTUALLY flying, then park the pursuer squarely on that leg.
      // The game's own revalidation is what changes the choice.
      await park();
      // This scenario's own baseline: the same hull already earned a shelter
      // receipt in G3, and other hulls have their own receipts in the same
      // persistent ring. Every check below is scoped to THIS target from HERE.
      const t0 = await worldTime();
      await cdp.eval(call(`place(${JSON.stringify(V(geom.gate, [220, 0, 160]))})`));
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [1200, 0, 900]))})`));
      const held = await until('G4 committed leg',
        (v) => v.ship && v.ship.escape && v.ship.escape.kind && Array.isArray(v.ship.dest), 30000);
      const leg = { from: held?.ship?.pos ?? null, to: held?.ship?.dest ?? null,
        kind: held?.ship?.escape?.kind ?? null };
      const mid = leg.from && leg.to
        ? [(leg.from[0] + leg.to[0]) / 2, (leg.from[1] + leg.to[1]) / 2,
          (leg.from[2] + leg.to[2]) / 2]
        : null;
      if (mid) await cdp.eval(call(`placePlayer(${JSON.stringify(mid)})`));
      const onLeg = await probe();
      const clear = onLeg?.ship?.pos
        ? segClear(onLeg.ship.pos, leg.to, onLeg.ship.player)
        : { t: null, dist: null };
      const screened = await until('G4 rerouted by the obstruction',
        (v) => v.ship && v.ship.escape
          && (v.ship.escape.kind !== leg.kind || v.ship.escape.phase === 'evade'
            || v.ship.escape.reason === 'blocked'
            || !Array.isArray(v.ship.dest)
            || Math.hypot(v.ship.dest[0] - leg.to[0], v.ship.dest[1] - leg.to[1],
              v.ship.dest[2] - leg.to[2]) > 1), 40000);
      results.samples.G4 = { leg, clear, held: held?.ship?.escape, screened: screened?.ship?.escape,
        newDest: screened?.ship?.dest };
      await cdp.shot('g4-choice.png');
      record('G4', !!(held.ship?.escape?.kind
        // the pursuer really was ON the committed leg, ahead of the runner
        && clear.dist !== null && clear.dist < 260 && clear.t > 0.02 && clear.t <= 1
        && screened.ship?.escape
        // …and the hull committed somewhere else, or said it had nowhere to go
        && (screened.ship.escape.kind !== leg.kind
          || screened.ship.escape.phase === 'evade'
          || (Array.isArray(screened.ship.dest)
            && Math.hypot(screened.ship.dest[0] - leg.to[0], screened.ship.dest[1] - leg.to[1],
              screened.ship.dest[2] - leg.to[2]) > 1))
        // an evade is never a transit, and THIS hull never departed while it
        // was re-deciding (another ship's receipt in the shared ring is not
        // this scenario's business)
        && screened.ship.state !== 'inTransit'
        && screened.ship.id === g3Id
        && receiptsFor(screened, 'npcEscaped', g3Id, t0).length === 0),
      { leg, clear, held: held?.ship?.escape, screened: screened?.ship?.escape,
        newDest: screened?.ship?.dest, state: screened?.ship?.state,
        id: g3Id, since: t0, g3Since,
        otherReceipts: (screened?.events || []).filter((e) => e.targetId !== g3Id).length });
    }

    // ================= G5: engine out and disabled =========================
    {
      // The stall has to be read on a REAL gate leg, so the initial staging
      // gives the limping hull one: it starts a short run from the authored
      // gate, and the pursuer is placed far BEHIND it (segment parameter < 0,
      // far outside the 260 u screening tube) instead of between the hull and
      // the gate — the previous stand-off screened the gate, the game quite
      // correctly picked the station, and the long wait that followed ran past
      // the ordinary out-of-combat repair. Nothing here writes a plan, a
      // charge, a phase or a repair timer; the whole gate window is measured
      // inside the quiet-repair delay, and if the engine heals first the pin
      // fails honestly.
      await park();
      const t0 = await worldTime();
      const spawn = await spawnAt('Limping Hull', V(geom.gate, [180, 0, 110]),
        { engineOut: true, hull: 40, flee: true });
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [800, 0, 600]))})`));
      // Sample the real world speed twice so the reading is a rate, not a jump.
      await probe();
      await sleep(600);
      const s1 = await probe();
      await sleep(600);
      const s2 = await probe();
      const cruise = 105; // SHIP_CLASSES.cutter.cruise
      const speeds = [s1?.ship?.speed, s2?.ship?.speed].filter((n) => Number.isFinite(n));
      // It flies the leg itself: no teleport into the bore, no stamped phase.
      const parked = await until('G5 engineOut reaches the gate',
        (v) => v.ship && v.ship.engineOut === true && v.ship.escape
          && v.ship.escape.kind === 'gate' && v.ship.escape.to === geom.gateTo
          && (v.ship.escape.phase === 'charge' || (v.ship.escape.destRange ?? 1e9) < 60), 15000);
      // A charge cannot accrue while the engine is out: sample the window.
      await sleep(3000);
      const stillHere = await probe();
      // …and a hull that is disabled outright cannot depart at all.
      await cdp.eval(call('disable()'));
      await sleep(5000);
      const disabled = await probe();
      results.samples.G5 = { speeds, parked: parked?.ship, stillHere: stillHere?.ship,
        disabled: disabled?.ship, since: t0 };
      await cdp.shot('g5-engine-out.png');
      record('G5', !!(spawn.ok
        && speeds.length > 0 && speeds.every((s) => s <= cruise * 0.3 + 3)
        // a real, authored gate leg — physically reached, still engine-out
        && parked.ship && parked.ship.engineOut === true
        && parked.ship.escape && parked.ship.escape.kind === 'gate'
        && parked.ship.escape.to === geom.gateTo
        && (parked.ship.escape.phase === 'charge' || (parked.ship.escape.destRange ?? 1e9) < 60)
        && stillHere.ship && stillHere.ship.engineOut === true
        && stillHere.ship.escape && stillHere.ship.escape.charge === 0
        && stillHere.ship.escape.departed !== true
        && stillHere.ship.state !== 'inTransit'
        && receiptsFor(stillHere, 'npcEscaped', spawn.id, t0).length === 0
        && disabled.ship && disabled.ship.disabled === true
        && disabled.ship.escape && disabled.ship.escape.charge === 0
        && disabled.ship.state !== 'inTransit'
        && receiptsFor(disabled, 'npcEscaped', spawn.id, t0).length === 0),
      { speeds, cap: cruise * 0.3, reached: parked?.ship?.escape,
        reachedRange: parked?.ship?.escape?.destRange,
        engineOut: stillHere?.ship?.escape, engineOutFlag: stillHere?.ship?.engineOut,
        disabled: disabled?.ship?.escape, disabledFlag: disabled?.ship?.disabled,
        state: disabled?.ship?.state, since: t0 });
    }

    // ================= G6: chase across the 1400 u threshold ===============
    {
      await park();
      const t0 = await worldTime();
      const spawn = await spawnAt('Chased Wren', V(geom.gate, [1600, 0, 1200]), { hull: 45, flee: true });
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [1900, 0, 1400]))})`));
      // The route baseline is taken only once the hull has COMMITTED to a
      // refuge of its own: sampled before the first NPC tick, escape is still
      // null and the comparison after the reacquisition means nothing.
      const near = await until('G6 near',
        (v) => v.ship && v.ship.live === true && v.ship.range < 600
          && v.ship.escape && v.ship.escape.kind && Array.isArray(v.ship.dest), 25000);
      const route0 = near?.ship?.escape
        ? { kind: near.ship.escape.kind, to: near.ship.escape.to, dest: near.ship.dest }
        : null;
      await cdp.eval(call('lock()'));
      const locked = await probe();
      const hull0 = locked?.ship?.hull ?? null;
      // Fall behind. A SELECTED runner is deliberately retained past the fold
      // now, so first prove the retention at > 1400 u with the lock still on
      // it and its identity/condition intact…
      const base = locked?.ship?.pos ?? near?.ship?.pos ?? null;
      const far = base ? [base[0] + 2600, base[1], base[2]] : null;
      if (far) await cdp.eval(call(`placePlayer(${JSON.stringify(far)})`));
      const retained = await until('G6 retained past 1400',
        (v) => v.ship && v.ship.range > 1400 && v.ship.live === true
          && v.lock && v.lock.id === spawn.id, 20000);
      await cdp.shot('g6-retained-chase.png');
      // …then drop the lock with the ORDINARY target key, in empty space, and
      // let real traffic fold it exactly like any other distant hull.
      await cdp.eval(KEY('KeyT', 't'));
      const unlocked = await until('G6 lock dropped',
        (v) => !v.lock || v.lock.id !== spawn.id, 15000);
      const lost = await until('G6 lost', (v) => v.ship && v.ship.live === false, 20000);
      await cdp.shot('g6-target-lost.png');
      // Close back in on the record's own tracked position.
      const at = lost?.ship?.recPos;
      if (at) await cdp.eval(call(`placePlayer(${JSON.stringify([at[0] + 120, at[1], at[2]])})`));
      const backAgain = await until('G6 reacquired', (v) => v.ship && v.ship.live === true, 25000);
      await cdp.eval(call('lock()'));
      const relocked = await probe();
      results.samples.G6 = { near: near?.ship, route0, retained: retained?.ship,
        unlocked: unlocked?.lock, lost: lost?.ship, back: backAgain?.ship,
        relock: relocked?.lock, since: t0 };
      await cdp.shot('g6-reacquired.png');
      record('G6', !!(spawn.ok && hull0 !== null && route0 && route0.kind
        // the chase survives the invisible line while it is SELECTED…
        && retained.ship && retained.ship.live === true && retained.ship.range > 1400
        && retained.ship.id === spawn.id && retained.ship.hull === hull0
        // …the player's own target key released it…
        && (!unlocked.lock || unlocked.lock.id !== spawn.id)
        && lost.ship && lost.ship.live === false && lost.ship.state === 'enroute'
        && lost.ship.escape && lost.ship.escape.kind === route0.kind
        && lost.ship.escape.to === route0.to
        // …and the SAME hull came back on the SAME committed route, unhealed
        && backAgain.ship && backAgain.ship.live === true
        && backAgain.ship.id === spawn.id
        && backAgain.ship.hull === hull0
        && backAgain.ship.mode === 'flee'
        && backAgain.ship.escape && backAgain.ship.escape.kind === route0.kind
        && backAgain.ship.escape.to === route0.to
        && backAgain.ship.disabled === false
        && relocked.lock && relocked.lock.id === spawn.id
        && relocked.lock.escape && relocked.lock.escape.kind === route0.kind
        && receiptsFor(lost, 'npcEscaped', spawn.id, t0).length === 0
        && receiptsFor(relocked, 'npcEscaped', spawn.id, t0).length === 0),
      { hull0, route0, retained: retained?.ship, unlocked: unlocked?.lock, lost: lost?.ship,
        back: backAgain?.ship, relockId: relocked?.lock?.id,
        relockRow: relocked?.lock?.escape, since: t0 });
    }

    // ================= G7: an actual completed gate jump ===================
    let departedId = null;
    {
      // The hull that crosses is one the PLAYER PAID OFF: an ordinary pirate
      // demand card, resolved with payTribute through the public handle. That
      // is the peace with no surrender flag at all — the one that used to wake
      // up hunting again on the other side — so it is the one carried through
      // the crossing and checked again in G8. hail.js debits the purse and
      // stamps the outcome; the probe writes neither.
      await park();
      const t0 = await worldTime();
      const spawn = await spawnAt('Wren Runner', V(geom.gate, [40, 0, 20]), { hull: 50 });
      departedId = spawn.id;
      await cdp.eval(call(`placePlayer(${JSON.stringify(V(geom.gate, [420, 0, 0]))})`));
      await cdp.eval(call('lock()'));
      const hailDemand = () => cdp.eval(call('hailDemand(400)'));
      await hailDemand();
      const card7 = await openCard('G7 demand card', 'payTribute', spawn.id, hailDemand);
      const creditsBefore = Number(await cdp.eval(call('credits()')));
      const paid7 = card7 ? await resolveCard(card7, 'payTribute') : { ok: false, error: 'no-matching-card' };
      const creditsAfter = Number(await cdp.eval(call('credits()')));
      const bought = await until('G7 paid peace',
        (v) => v.ship && v.ship.mode === 'flee' && v.ship.demandOutcome === 'paid', 20000);
      results.samples.G7hail = { card: card7, paid: paid7, creditsBefore, creditsAfter,
        peace: bought?.ship && { outcome: bought.ship.demandOutcome, surrendered: bought.ship.surrendered } };
      const hailBase = JSON.parse(await cdp.eval(HAILRING));
      results.samples.G7hail.ringBase = hailBase;
      const charging = await until('G7 charging',
        (v) => v.ship && v.ship.escape && v.ship.escape.phase === 'charge' && v.ship.escape.charge > 0);
      await cdp.eval(call('lock()'));
      // The whole charge line — band AND gate metadata — has to be on the
      // bracket the screenshot captures, so wait for the render instead of
      // sampling one frame of it.
      const chargeShot = await until('G7 charge bracket',
        (v) => v.lock && v.lock.id === spawn.id && v.lock.escape
          && v.hud && v.hud.bracketHidden === false
          && hudSays(v.hud, v.lock.escape.label), 12000);
      await cdp.shot('g7-charging.png');
      // The receipt frame is the DEPARTURE, not the clean-up: on that frame
      // the record is already inTransit while the hull is still instantiated
      // and the comm line has not been rendered yet.
      const gone = await until('G7 departed',
        (v) => receiptsFor(v, 'npcEscaped', spawn.id, t0).length > 0, 30000);
      const receipts7 = receiptsFor(gone, 'npcEscaped', spawn.id, t0);
      const receipt = receipts7[0] ?? null;
      // …so the terminal state is waited for AFTER the receipt is captured:
      // traffic's next frame removes the hull, and the UI publishes the comm
      // line and releases the lock after that.
      const settled = await until('G7 terminal settle',
        (v) => v.ship && v.ship.live === false && v.ship.state === 'inTransit'
          && (!v.lock || v.lock.id !== spawn.id)
          && (v.comms || []).some((t) => /jumped to/.test(t) && /target lost/.test(t)), 25000);
      await cdp.shot('g7-departed.png');
      results.samples.G7 = { charging: charging?.ship, receipt, receipts: receipts7.length,
        after: gone?.ship, settled: settled?.ship, comms: settled?.comms?.slice(-4),
        hud: chargeShot?.hud, chargeRow: chargeShot?.lock?.escape, since: t0 };
      record('G7', !!(spawn.ok && card7 && card7.open === true && card7.speaker === spawn.id
        && paid7 && paid7.ok === true
        // the game took the money and stamped the peace — the probe wrote neither
        && creditsAfter < creditsBefore
        && bought.ship && bought.ship.demandOutcome === 'paid'
        && bought.ship.surrendered !== true
        && charging.ship?.escape?.phase === 'charge'
        // observable while charging, with the gate metadata actually rendered
        && chargeShot.lock && chargeShot.lock.id === spawn.id
        && chargeShot.lock.escape && chargeShot.lock.escape.kind === 'gate'
        && chargeShot.lock.escape.to === geom.gateTo
        && chargeShot.hud && chargeShot.hud.bracketHidden === false
        && !!chargeShot.hud.bandWord
        && hudSays(chargeShot.hud, chargeShot.lock.escape.label)
        // exactly one departure receipt, for THIS hull, since this scenario
        && receipts7.length === 1
        && receipt && receipt.kind === 'gate' && receipt.reason === 'gate'
        && receipt.from === geom.sys && receipt.to === geom.gateTo
        && Number.isFinite(receipt.eta)
        && gone.ship && gone.ship.state === 'inTransit'
        // …and the crossing then settles: hull gone, lock released, comm read
        && settled.ship && settled.ship.live === false
        && settled.ship.state === 'inTransit'
        && settled.ship.demandOutcome === 'paid'
        && settled.ship.surrendered !== true
        && (!settled.lock || settled.lock.id !== spawn.id)
        && (settled.comms || []).some((t) => /jumped to/.test(t) && /target lost/.test(t))),
      { receipt, receipts: receipts7.length, after: gone?.ship, settled: settled?.ship,
        lock: settled?.lock, comms: settled?.comms?.slice(-3),
        chargeHud: chargeShot?.hud, chargeRow: chargeShot?.lock?.escape,
        creditsBefore, creditsAfter, since: t0,
        peace: bought?.ship && { outcome: bought.ship.demandOutcome, surrendered: bought.ship.surrendered } });
      results.samples.G7ringBase = hailBase;
    }

    // ================= G8: the same ship on the other side =================
    {
      // The record must arrive — and then the player must actually FLY there
      // and meet it again. A bank row is not a reacquisition.
      const arrived = await until('G8 arrival',
        (v) => v.ship && v.ship.state === 'enroute' && v.ship.destBank === geom.gateTo, 180000);
      const hullAcross = arrived?.ship?.hull ?? null;
      // FIXTURE (spatial, attributed): the player is placed INSIDE the source
      // gate's physical activation zone — on the bore axis, 45 u out along the
      // line the gate faces, inside JUMP.zone = 60 u and clear of the ring
      // structure. Approaching that bore under autopilot is not what this pin
      // is about (the previous pass spent 180 s failing to thread it); the
      // crossing itself stays entirely the game's.
      const boreLen = Math.hypot(geom.gate[0], geom.gate[1], geom.gate[2]) || 1;
      const bore = [
        geom.gate[0] - (geom.gate[0] / boreLen) * 45,
        geom.gate[1] - (geom.gate[1] / boreLen) * 45,
        geom.gate[2] - (geom.gate[2] / boreLen) * 45,
      ];
      await cdp.eval(call(`placePlayer(${JSON.stringify(bore)})`));
      // gate.js decides in-zone from real geometry; the PUBLIC observation is
      // where the probe reads that, and it is a precondition of the jump.
      const inZone = await until('G8 gate zone',
        (v) => v.gate && v.gate.inZone === true && v.gate.nearTo === geom.gateTo, 20000);
      const zoneOk = !!(inZone?.gate?.inZone === true && inZone.gate.nearTo === geom.gateTo);
      // The crossing is commanded through the ordinary player control: the
      // PUBLIC dock/jump pulse, and — if the public act is refused — the very
      // same edge from the real key binding. Nothing writes currentSystem,
      // systemLoaded, transit or arrival.
      const pulsed = JSON.parse(await cdp.eval(
        `(() => JSON.stringify(window.rimward.act({ v: 2, name: 'pulse', args: { edge: 'dock' } })))()`));
      let keyJump = null;
      if (!(pulsed && pulsed.ok === true)) {
        say('G8 public pulse refused', JSON.stringify(pulsed));
        keyJump = await cdp.eval(KEY('KeyJ', 'j'));
      }
      // Production evidence that the command was accepted: gate.js's own
      // charge/jump state, before any system change is claimed.
      const spooling = await until('G8 gate spooling',
        (v) => v.gate && (v.gate.jumping === true || (v.gate.progress ?? 0) > 0
          || v.sys === geom.gateTo), 20000);
      const jumpStarted = !!(spooling?.gate?.jumping === true
        || (spooling?.gate?.progress ?? 0) > 0 || spooling?.sys === geom.gateTo);
      const loaded = await until('G8 destination loaded',
        (v) => v.sys === geom.gateTo && v.ship && v.ship.curSys === geom.gateTo, 60000);
      await cdp.shot('g8-destination-loaded.png');
      // Meet it: close on the record's own tracked position and let REAL
      // traffic instantiate the same id in the destination system.
      const at = loaded?.ship?.recPos;
      if (at) await cdp.eval(call(`placePlayer(${JSON.stringify([at[0] + 120, at[1], at[2]])})`));
      const met = await until('G8 live reacquisition',
        (v) => v.ship && v.ship.live === true && v.ship.curSys === geom.gateTo, 60000);
      await cdp.eval(call('lock()'));
      const relock = await probe();
      // …and the peace it bought is still bought. The baseline is taken HERE,
      // after the staged card and the crossing, so the original demand is
      // excluded by sequence rather than by deleting it: any NEW hail or
      // demand row appearing during the peace window is a real regression.
      const ringBefore = JSON.parse(await cdp.eval(HAILRING));
      await sleep(6000);
      const after = await probe();
      const ringAfter = JSON.parse(await cdp.eval(HAILRING));
      results.samples.G8 = {
        arrived: arrived?.ship, bore, zone: inZone?.gate ?? null, pulsed, keyJump,
        spooling: spooling?.gate ?? null, loaded: loaded?.ship, met: met?.ship,
        lock: relock?.lock, after: after?.ship, ringBefore, ringAfter,
      };
      await cdp.shot('g8-reacquired-across.png');
      record('G8', !!(arrived.ship && arrived.ship.id === departedId
        && arrived.ship.destBank === geom.gateTo
        && arrived.ship.system === geom.gateTo
        && arrived.ship.state === 'enroute'
        && arrived.ship.escape && arrived.ship.escape.phase === 'done'
        // the player really is in the destination system
        && loaded.ship && loaded.ship.curSys === geom.gateTo
        // …and the SAME hull is live there, unhealed and still at peace
        && met.ship && met.ship.id === departedId && met.ship.live === true
        && met.ship.hull === hullAcross
        && met.ship.mode !== 'hunt' && met.ship.mode !== 'duel'
        // the paid peace crossed with it, with no surrender flag anywhere
        && met.ship.demandOutcome === 'paid' && met.ship.surrendered !== true
        && after.ship && after.ship.intent !== true
        && after.ship.hull === hullAcross
        && after.ship.demandOutcome === 'paid'
        && after.ship.mode !== 'hunt' && after.ship.mode !== 'duel'
        // the crossing was a real one: in the physical zone, commanded through
        // the public control, spooled by gate.js, and the production system
        // actually changed
        && zoneOk && jumpStarted
        && (pulsed?.ok === true || keyJump === true)
        && loaded.sys === geom.gateTo
        // …and it opened no NEW parley in the window after the reacquisition
        && ringBefore && ringAfter && ringAfter.n === ringBefore.n
        && relock.lock && relock.lock.id === departedId),
      { arrived: arrived?.ship, hullAcross, bore, zone: inZone?.gate ?? null,
        pulsed, keyJump, jumpStarted, spooling: spooling?.gate ?? null,
        loadedSys: loaded?.sys, loaded: loaded?.ship,
        met: met?.ship, after: after?.ship, lockId: relock?.lock?.id,
        ring: { before: ringBefore, after: ringAfter } });
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
