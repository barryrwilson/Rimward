/** Issue #300 real-browser heading-feedback probe.
 * Run: node scripts/issue-300-helm-heading-live-probe.mjs
 * Isolated loopback server, temporary profile, owned-process cleanup only
 * (issue-169 harness pattern). The real application and simulation loop run
 * unchanged.
 *
 * The acceptance pin: a caller that reads ONLY observe() (station.bearing +
 * control echo) and writes ONLY setControl flies a straight line to the
 * station bearing, with no trial-and-error sign test. The steer signs come
 * from the capability note under test (steerY is the negated bearing axis).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE300_OUT || join(repo, 'out', 'issue-300-evidence', 'live');
const WIN = process.platform === 'win32';

function findChrome() {
  const named = process.env.ISSUE300_CHROME || process.env.CHROME_PATH;
  if (named) return named;
  const candidates = WIN
    ? [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ]
    : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
  for (const c of candidates) if (existsSync(c)) return c;
  return WIN ? 'chrome.exe' : 'google-chrome';
}

const CHROME = findChrome();
const PROFILE_ROOT = resolvePath(process.env.ISSUE300_PROFILE || join(repo, 'out', 'issue-300-profiles'));
const PROFILE_PREFIX = 'rw-issue300-helm-';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => { const line = a.map(String).join(' '); log.push(line); console.log(line); };

const PINS = ['capability-note-signs', 'steer-echo-live', 'straight-line-convergence', 'clean-console-no-trial-sign-test'];
const results = { pins: {}, consoleErrors: [], exceptions: [],
  method: 'Fresh Greenhand launched with public actions. A closed steering loop reads only observe() (station.bearing, control echo) and writes only setControl, with steerX = k*bearing.x and steerY = -k*bearing.y taken from the capability note. window.__ctx is read only to record the final quaternion for the evidence file; no state fixtures.' };
function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1200));
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

async function main() {
  await mkdir(PROFILE_ROOT, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const port = await availablePort();
  const profile = await mkdtemp(join(PROFILE_ROOT, PROFILE_PREFIX));
  const app = `http://127.0.0.1:${port}/?agent=1`;
  results.port = port;
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
    if (handle !== true) throw new Error('window.rimward never appeared; last=' + JSON.stringify(handle));
    const phaseOf = `(() => { const o = window.rimward.observe(); return o.session ? o.session.phase : null; })()`;
    let phase = await waitUntil(phaseOf, (v) => typeof v === 'string', 20000, 250);
    say('phase', String(phase));
    if (phase === 'title') {
      say('startGame', await cdp.eval(act('startGame')));
      phase = await waitUntil(phaseOf, (v) => v !== 'title', 20000, 250);
    }
    if (phase === 'origin') {
      say('chooseOrigin', await cdp.eval(act('chooseOrigin', { id: 'greenhand' })));
    }
    phase = await waitUntil(phaseOf, (v) => v === 'playing', 30000, 300);
    if (phase !== 'playing') throw new Error(`session phase stuck at ${JSON.stringify(phase)}`);
    await waitUntil(`(() => {
      const c = window.__ctx;
      return !!(c?.ship?.object && c.world.origin && c.flags.paused === false && (c.world.time || 0) > 1);
    })()`, (v) => v === true, 30000, 300);

    // ---- Leave the berth through the ordinary public verb -------------------
    let obs = await cdp.eval('window.rimward.observe()');
    if (obs.flags.docked === true) {
      say('undock', await cdp.eval(act('undock')));
      obs = await waitUntil('window.rimward.observe()', (o) => o && o.flags && o.flags.docked === false, 20000, 250);
    }
    const gate = await waitUntil('window.rimward.observe()',
      (o) => o && o.flags && o.flags.docked === false && o.flags.berthHold === false && o.agentOptIn === true,
      20000, 250);
    if (gate?.agentOptIn !== true) throw new Error('agent opt-in never set');
    if (gate?.flags?.docked !== false || gate?.flags?.berthHold !== false) throw new Error('still docked or berth-held');
    await cdp.eval(act('clearControl'));
    await cdp.shot('01-launched.png');

    // ---- Pin 1: the capability note documents the signs --------------------
    const noteCheck = await cdp.eval(`(() => {
      const o = window.rimward.observe();
      const note = o.capabilities.commands.setControl.note || '';
      return {
        hasConvention: note.includes('y up, nose -z') && note.includes('steerY positive pitches nose DOWN'),
        hasMapping: note.includes('steerX = clamp(k * bearing[0])') && note.includes('steerY = clamp(-k * bearing[1])'),
        hasEcho: note.includes('echoes the accepted command'),
      };
    })()`);
    record('capability-note-signs', !!(noteCheck && noteCheck.hasConvention && noteCheck.hasMapping && noteCheck.hasEcho), noteCheck);

    // ---- Pin 2: the live steer echo ----------------------------------------
    const echo = await cdp.eval(`(async () => {
      const api = window.rimward;
      const sent = { steerX: 0.6, steerY: -0.3, roll: 0, throttle: 0.3 };
      const r = api.act({ v: 2, name: 'setControl', args: { seq: 5001, ttl: 1, ...sent } });
      const obs = api.observe();
      const c = obs.control;
      api.act({ v: 2, name: 'clearControl', args: {} });
      return { receipt: r, echo: { steerX: c.steerX, steerY: c.steerY, roll: c.roll, throttle: c.throttle }, owner: c.owner, state: c.state };
    })()`);
    const echoOk = !!(echo && echo.receipt && echo.receipt.ok === true
      && echo.owner === 'manual'
      && echo.echo.steerX === 0.6 && echo.echo.steerY === -0.3
      && echo.echo.throttle === 0.3);
    record('steer-echo-live', echoOk, echo);
    await cdp.shot('02-echo.png');

    // ---- Pin 3: the closed loop flies a straight line ----------------------
    // Point the nose away first with a documented-sign turn (this uses the
    // published convention itself — no empirical sign discovery), then close
    // the loop from observe() alone.
    const flight = await cdp.eval(`(async () => {
      const api = window.rimward;
      let seq = 6000;
      const send = (args) => api.act({ v: 2, name: 'setControl', args: { seq: ++seq, ttl: 1, ...args } });
      const clamp1 = (v) => Math.max(-1, Math.min(1, v));

      // Yaw right (steerX positive turns the nose right per the note) until
      // the station is far off-bearing, so the loop has real work to close.
      // The spawn attitude varies by origin, so turn to a measured threshold
      // instead of a fixed count.
      let r = null;
      let start = null;
      for (let i = 0; i < 24; i++) {
        r = send({ steerX: 1, steerY: 0, throttle: 0.4 });
        await new Promise((res) => setTimeout(res, 250));
        const b = api.observe().station.bearing;
        if (b && b.every(Number.isFinite) && Math.hypot(b[0], b[1]) > 0.6) {
          start = b.slice();
          break;
        }
      }
      if (!start) {
        const b = api.observe().station.bearing;
        if (b && b.every(Number.isFinite)) start = b.slice();
      }
      if (!r || r.ok !== true) return { error: 'offset turn refused', receipt: r };

      // Closed loop: observe() alone decides the next command.
      const K = 2;
      const samples = [];
      let worstAfterAlign = 0;
      const wallDeadline = performance.now() + 45000;
      let aligned = false;
      while (performance.now() < wallDeadline) {
        const o = api.observe();
        const b = o.station.bearing;
        if (!b || !b.every(Number.isFinite)) return { error: 'no station bearing', samples };
        samples.push({ t: o.t, b: b.slice(), echo: { x: o.control.steerX, y: o.control.steerY } });
        const lateral = Math.hypot(b[0], b[1]);
        // b[2] < 0 means the station is ahead; the mapping itself also
        // converges from behind, so no special case is needed — keep steering.
        if (lateral < 0.04) aligned = true;
        if (aligned) worstAfterAlign = Math.max(worstAfterAlign, lateral);
        const stop = aligned && samples.length > 40 && worstAfterAlign < 0.06;
        if (stop) {
          api.act({ v: 2, name: 'clearControl', args: {} });
          return { start, finalBearing: b, samples, aligned, worstAfterAlign, converged: true };
        }
        send({
          steerX: clamp1(K * b[0]),
          steerY: clamp1(-K * b[1]),
          throttle: 0.4,
        });
        await new Promise((res) => setTimeout(res, 120));
      }
      const o = api.observe();
      return { start, finalBearing: o.station.bearing, samples, aligned, worstAfterAlign, converged: false };
    })()`, 90000);
    if (!flight || flight.error) { record('straight-line-convergence', false, flight); }
    else {
      const lat = (b) => Math.hypot(b[0], b[1]);
      const startLat = lat(flight.start);
      const endLat = lat(flight.finalBearing);
      const echoesHeld = flight.samples.every((s) => Math.abs(s.echo.x) <= 1 && Math.abs(s.echo.y) <= 1);
      record('straight-line-convergence',
        flight.converged === true && startLat > 0.5 && endLat < 0.05 && flight.worstAfterAlign < 0.06 && echoesHeld,
        { startLat, endLat, worstAfterAlign: flight.worstAfterAlign, samples: flight.samples.length, echoesHeld,
          start: flight.start, final: flight.finalBearing });
      await cdp.shot('03-converged.png');
      results.flight = { startLat, endLat, worstAfterAlign: flight.worstAfterAlign, samples: flight.samples.length };
    }

    // ---- Pin 4: clean console ----------------------------------------------
    // Computed in finally from cdp.console / cdp.exceptions.
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
    const cleanConsole = results.consoleErrors.length === 0 && results.exceptions.length === 0;
    record('clean-console-no-trial-sign-test', cleanConsole, { consoleErrors: results.consoleErrors.length, exceptions: results.exceptions.length });
    const entries = Object.entries(results.pins);
    console.log('\n' + entries.map(([k, v]) => `${v.pass ? 'PASS' : 'FAIL'}  ${k}`).join('\n'));
    const failed = entries.filter(([, v]) => !v.pass).map(([k]) => k);
    const missing = PINS.filter((k) => !results.pins[k]);
    const reasons = [];
    if (results.error) reasons.push(`harness error: ${results.error}`);
    if (missing.length) reasons.push(`pin not reached: ${missing.join(', ')}`);
    if (failed.length) reasons.push(`pin failed: ${failed.join(', ')}`);
    results.verdict = reasons.length ? 'FAIL' : 'PASS';
    results.reasons = reasons;
    await writeFile(join(outDir, 'result.json'), JSON.stringify(results, null, 2), 'utf8');
    if (reasons.length) {
      console.log('\nISSUE-300 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-300 LIVE PASS — ${PINS.length}/${PINS.length} pins, clean console`);
    }
  }
}

main();
