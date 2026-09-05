/**
 * RW-008 live verification. Read-only against `src/`.
 *
 * Drives the dev app in headless Chrome over CDP and runs flows V1-V4 of
 * docs/Mdl01ShipReferenceDesign.md section 12 against the Models browser:
 *
 *   V1  Title -> [2] MODELS -> Escape. Opens, closes, focus returns to the
 *       MODELS entry, and the title stays paused.
 *   V2  Tab cycles inside the overlay and never reaches the title.
 *   V3  The dialog is named, and the info bar is a live region that carries
 *       the selection.
 *   V4  With Reduced motion on, the turntable and the star shell are both
 *       still, and no CSS transition runs.
 *   V6  First open is BY FACTION, Freehold expanded, Freehold Compact -
 *       Light selected, 22 rows in the DOM (G1-G3, budget P1).
 *   V6b A faction group is the size ladder: six ships in CLASS_ORDER,
 *       then the station, then the gate.
 *   V6c Change mode, select, Escape, re-open: G4 restores. Then reload
 *       and confirm G5 returns to the first-open shape.
 *   V7  BY TYPE reproduces the six categories with 172 canonical rows.
 *   V8  Filter "lamp" expands the Lamplighter match and nothing else.
 *   V9  The livery toggle re-skins without moving the camera.
 *   V10 ship:player disables the variant box and says why.
 *   V11 A station, a planet and a prop each show a card with only the lines
 *       they have; no empty labelled line ever renders (RW-010).
 *
 * WHY A PROBE: the overlay owns a WebGL context and a rAF loop, so boot-test
 * can only pin its source. Focus order, aria wiring and the rAF motion gates
 * are runtime facts. This is the OPT-001 harness shape (scripts/opt001-live-
 * probe.mjs), reduced to the title screen: RW-008 never needs flight.
 *
 * Run: node scripts/rw008-live-probe.mjs
 * Output: out/rw008/verify/ (ignored path; stills are not committed).
 *
 * Vite and CDP use isolated loopback ports. Each run gets a fresh Chrome
 * profile outside the repository and removes it during teardown.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.RW008_OUT || join(repo, 'out', 'rw008', 'verify');
const WIN = process.platform === 'win32';

/** First Chrome on this machine. RW008_CHROME / CHROME_PATH win. */
function findChrome() {
  const named = process.env.RW008_CHROME || process.env.CHROME_PATH;
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
const PROFILE_ROOT = process.env.RW008_PROFILE || tmpdir();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

/** Every flow the pass must reach. A missing one fails the run. */
const FLOWS = ['V1', 'V2', 'V3', 'V4', 'V6', 'V6b', 'V6c', 'V7', 'V8', 'V9', 'V10', 'V11'];

const results = {
  commit: process.env.RW008_SHA || null,
  port: null,
  cdpPort: null,
  profile: null,
  readiness: null,
  flows: {},
  consoleErrors: [],
  exceptions: [],
};

function record(key, pass, detail) {
  results.flows[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 700));
}

/** Stop a child and everything it started, then wait for the tree to leave. */
async function killTree(child) {
  if (!child?.pid) return;
  if (WIN) {
    const stopped = await new Promise((resolve) => {
      try {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'],
          { stdio: 'ignore' });
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

/** Reserve an unused loopback port for this run. */
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

function failReadiness(condition, state, extra = {}) {
  results.readiness = {
    failedCondition: condition,
    state,
    consoleErrors: extra.consoleErrors || [],
    exceptions: extra.exceptions || [],
    ...extra,
  };
  const detail = JSON.stringify(results.readiness).slice(0, 2000);
  return new Error(`readiness failed: ${condition}; ${detail}`);
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

/**
 * Send a key the way the overlay listens for it. The browser's handler is on
 * window in the CAPTURE phase, so a window-dispatched event reaches it exactly
 * as a real key press does.
 */
const KEY = (code, key, extra = '') => `(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', {
    code: '${code}', key: '${key}', bubbles: true, cancelable: true${extra}
  }));
  return true;
})()`;

/** Describe whatever currently holds focus, for the V1/V2 assertions. */
const FOCUS = `(() => {
  const a = document.activeElement;
  if (!a) return { id: null, cls: null, tag: null, inOverlay: false };
  const ov = document.querySelector('.rw-models');
  return {
    id: a.id || null,
    cls: a.className || null,
    tag: a.tagName,
    text: (a.textContent || '').trim().slice(0, 40),
    inOverlay: !!(ov && ov.contains(a)),
  };
})()`;

async function main() {
  await mkdir(PROFILE_ROOT, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const requestedPort = process.env.RW008_PORT;
  const port = requestedPort == null ? await availablePort() : Number(requestedPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`RW008_PORT must be an integer from 1 through 65535; got ${requestedPort}`);
  }
  const profile = await mkdtemp(join(PROFILE_ROOT, 'rw008-chrome-'));
  const app = `http://127.0.0.1:${port}/`;
  results.port = port;
  results.profile = profile;
  let vite = null;
  let chrome = null;
  let cdp = null;
  let failure = null;
  const viteStdout = [];
  const viteStderr = [];
  const chromeStderr = [];
  let viteSpawnError = null;
  let chromeSpawnError = null;

  try {
    // ---- Vite ---------------------------------------------------------
    vite = spawn(
      process.execPath,
      [join(repo, 'node_modules', 'vite', 'bin', 'vite.js'),
        '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
      { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN },
    );
    vite.once('error', (err) => { viteSpawnError = String(err?.message || err); });
    vite.stdout.on('data', (b) => {
      const text = String(b).trim().slice(0, 500);
      if (text) viteStdout.push(text);
      say('vite', text.slice(0, 160));
    });
    vite.stderr.on('data', (b) => {
      const text = String(b).trim().slice(0, 500);
      if (text) viteStderr.push(text);
      say('vite!', text.slice(0, 160));
    });
    let up = false;
    for (let i = 0; i < 100; i++) {
      up = await fetch(app).then((r) => r.ok).catch(() => false);
      if (up) break;
      if (vite.exitCode != null || viteSpawnError) break;
      await sleep(300);
    }
    if (!up) {
      throw failReadiness('Vite server', {
        url: app,
        viteExitCode: vite.exitCode,
        viteSpawnError,
        viteStdout: viteStdout.slice(-8),
        viteStderr: viteStderr.slice(-8),
      });
    }
    say('vite up', port);

    // ---- Chrome -------------------------------------------------------
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
    chrome.once('error', (err) => { chromeSpawnError = String(err?.message || err); });
    chrome.stderr.on('data', (b) => {
      const text = String(b).trim().slice(0, 500);
      if (text) chromeStderr.push(text);
    });
    say('chrome', CHROME, 'pid', chrome.pid, 'profile', profile);

    let browserWs = null;
    let cdpPort = null;
    for (let i = 0; i < 100; i++) {
      try {
        const active = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
        const parsed = Number(active.split(/\r?\n/, 1)[0]);
        if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('invalid DevToolsActivePort');
        cdpPort = parsed;
        const ver = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        if (ver.ok) { browserWs = (await ver.json()).webSocketDebuggerUrl; if (browserWs) break; }
      } catch { /* not up yet */ }
      if (chrome.exitCode != null || chromeSpawnError) break;
      await sleep(200);
    }
    results.cdpPort = cdpPort;
    if (!browserWs) {
      throw failReadiness('Chrome/CDP', {
        chromeExitCode: chrome.exitCode,
        chromeSpawnError,
        cdpPort,
        chromeStderr: chromeStderr.slice(-8),
      });
    }

    cdp = new Cdp(browserWs);
    await cdp.ready();
    const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const targetId = created?.targetId || null;
    cdp.close();

    let pageWs = null;
    let targets = [];
    let targetListError = null;
    for (let i = 0; i < 50; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        targets = await response.json();
        const page = targets.find((t) => t.type === 'page' && t.id === targetId);
        if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
      } catch (err) {
        targetListError = String(err?.message || err);
      }
      if (chrome.exitCode != null) break;
      await sleep(200);
    }
    if (!pageWs) {
      throw failReadiness('page target', {
        targetId,
        targetListError,
        targets: targets.map((t) => ({ id: t.id, type: t.type, url: t.url })),
      });
    }
    cdp = new Cdp(pageWs);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    const navigation = await cdp.send('Page.navigate', { url: app });
    if (navigation?.errorText) {
      throw failReadiness('page navigation', { url: app, navigation });
    }

    const waitUntil = async (expr, pred, ms = 15000, step = 200) => {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        try {
          last = await cdp.eval(expr);
        } catch (err) {
          last = { evalError: String(err?.message || err) };
        }
        try { if (pred(last)) return last; } catch { /* keep polling */ }
        await sleep(step);
      }
      return last;
    };

    // ---- Title screen -------------------------------------------------
    const title = await waitUntil(
      `(() => {
        const b = document.getElementById('rw-title-models');
        const fatal = document.getElementById('fatal');
        const fatalOpen = !!(fatal && !fatal.hidden && getComputedStyle(fatal).display !== 'none');
        return {
          url: location.href,
          readyState: document.readyState,
          hasCtx: !!window.__ctx,
          hasBtn: !!b,
          label: b ? b.textContent.trim() : null,
          fatalOpen,
          fatalText: fatalOpen ? (fatal.textContent || '').trim().slice(0, 1000) : null,
        };
      })()`,
      (v) => !!(v && (v.fatalOpen || (v.hasCtx && v.hasBtn)))
        || cdp.exceptions.length > 0
        || cdp.console.some((m) => m.type === 'error' || m.type === 'assert'),
      40000,
    );
    const startupConsoleErrors = cdp.console
      .filter((m) => m.type === 'error' || m.type === 'assert')
      .map((m) => m.text.slice(0, 300));
    const startupExceptions = cdp.exceptions.map((t) => t.slice(0, 300));
    const startupState = { consoleErrors: startupConsoleErrors, exceptions: startupExceptions };
    if (title?.fatalOpen) throw failReadiness('fatal overlay', title, startupState);
    if (startupExceptions.length) throw failReadiness('console exception', title, startupState);
    if (startupConsoleErrors.length) throw failReadiness('console error', title, startupState);
    if (!title?.hasCtx) throw failReadiness('app context', title, startupState);
    if (!title?.hasBtn) throw failReadiness('title button', title, startupState);
    results.readiness = { failedCondition: null, state: title, ...startupState };
    say('title up', JSON.stringify(title));
    await cdp.shot('01-title.png');

    // =====================================================================
    // V1 — open, close, focus restore, title stays paused
    // =====================================================================
    {
      // Focus the opener the way a keyboard user would, then activate it.
      // close() must send focus back here.
      await cdp.eval(`(() => {
        const b = document.getElementById('rw-title-models');
        b.focus(); b.click(); return true;
      })()`);
      const opened = await waitUntil(
        `(() => {
          const ov = document.querySelector('.rw-models');
          return {
            open: !!(ov && ov.style.display !== 'none'),
            isOpen: !!window.__ctx?.models?.isOpen?.(),
            paused: !!window.__ctx?.flags?.paused,
            focus: (() => { const a = document.activeElement;
              return a ? (a.className || a.id || a.tagName) : null; })(),
          };
        })()`,
        (v) => v && v.open && v.isOpen,
        20000,
      );
      await cdp.shot('02-models-open.png');

      // Let a model mount so the close path runs against a real selection.
      await sleep(2500);
      await cdp.eval(KEY('Escape', 'Escape'));
      const closed = await waitUntil(
        `(() => {
          const ov = document.querySelector('.rw-models');
          const a = document.activeElement;
          return {
            hidden: !!(ov && ov.style.display === 'none'),
            isOpen: !!window.__ctx?.models?.isOpen?.(),
            focusId: a ? a.id : null,
            paused: !!window.__ctx?.flags?.paused,
          };
        })()`,
        (v) => v && v.hidden && !v.isOpen,
        20000,
      );
      await cdp.shot('03-closed-back-to-title.png');
      record('V1', !!(opened?.open && opened?.isOpen
        && closed?.hidden && !closed?.isOpen
        && closed?.focusId === 'rw-title-models'
        && closed?.paused === true), { opened, closed });
    }

    // =====================================================================
    // V2 — Tab cycles inside the overlay and never reaches the title
    // =====================================================================
    {
      await cdp.eval(`(() => { document.getElementById('rw-title-models').click(); return true; })()`);
      await waitUntil(`!!window.__ctx?.models?.isOpen?.()`, (v) => v === true, 20000);
      await sleep(1500);

      // Walk Tab well past the control count and confirm focus never leaves.
      const walk = [];
      let escaped = false;
      for (let i = 0; i < 14; i++) {
        await cdp.eval(KEY('Tab', 'Tab'));
        const f = await cdp.eval(FOCUS);
        walk.push(f?.cls || f?.id || f?.tag);
        if (!f?.inOverlay) { escaped = true; break; }
      }
      // And backwards, which is the half a naive trap usually drops.
      let escapedBack = false;
      const walkBack = [];
      for (let i = 0; i < 8; i++) {
        await cdp.eval(KEY('Tab', 'Tab', ", shiftKey: true"));
        const f = await cdp.eval(FOCUS);
        walkBack.push(f?.cls || f?.id || f?.tag);
        if (!f?.inOverlay) { escapedBack = true; break; }
      }
      const distinct = new Set(walk.filter(Boolean)).size;
      await cdp.shot('04-tab-trap.png');
      record('V2', !escaped && !escapedBack && distinct >= 2,
        { escaped, escapedBack, distinct, walk, walkBack });
    }

    // =====================================================================
    // V3 — dialog is named; the info bar is a live region carrying the model
    // =====================================================================
    {
      const aria = await waitUntil(
        `(() => {
          const ov = document.querySelector('.rw-models');
          if (!ov) return null;
          const labelId = ov.getAttribute('aria-labelledby');
          const label = labelId ? document.getElementById(labelId) : null;
          const info = ov.querySelector('.rw-models-info');
          const name = info ? info.querySelector('.rw-models-name') : null;
          const faction = info ? info.querySelector('.rw-models-faction') : null;
          return {
            role: ov.getAttribute('role'),
            modal: ov.getAttribute('aria-modal'),
            labelId,
            labelText: label ? label.textContent.trim() : null,
            infoLive: info ? info.getAttribute('aria-live') : null,
            infoRole: info ? info.getAttribute('role') : null,
            nameText: name ? name.textContent.trim() : null,
            factionText: faction ? faction.textContent.trim() : null,
            // A raw storage key would be all lower case with no space.
            factionIsDisplayName: faction
              ? /[A-Z]/.test(faction.textContent.trim()) : null,
            infoHasMarkupChildren: info ? info.querySelectorAll('*').length : null,
          };
        })()`,
        (v) => v && v.nameText,
        20000,
      );
      record('V3', !!(aria?.role === 'dialog' && aria?.modal === 'true'
        && aria?.labelText === 'MODELS'
        && aria?.infoLive === 'polite'
        && aria?.nameText
        && aria?.factionIsDisplayName !== false), { aria });
    }

    // =====================================================================
    // V4 — reduced motion freezes the turntable AND the star shell
    // =====================================================================
    {
      // Settings is the only writer of ctx.settings, but reducedMotion is read
      // live every frame by the overlay loop, so flipping it here exercises the
      // same branch the checkbox does.
      await cdp.eval(`(() => {
        window.__ctx.settings.reducedMotion = true;
        document.body.classList.add('rw-reduced-motion');
        return true;
      })()`);

      // Sample the two rotations across ~1.2 s of real frames.
      const sample = `(() => {
        const g = window.__rw008probe;
        return g ? { model: g.model(), star: g.star() } : null;
      })()`;
      // Reach into the live scene through the renderer's own object graph.
      await cdp.eval(`(() => {
        const canvases = document.querySelectorAll('.rw-models-viewport canvas');
        window.__rw008probe = null;
        if (!canvases.length) return false;
        // The overlay's scene is reachable from its Points/Group children via
        // the shared THREE objects the loop mutates. Tag them once.
        return true;
      })()`);

      // The rotation values are private to the module closure, so measure the
      // OBSERVABLE consequence instead: pixels. Two screenshots 1.2 s apart
      // must be byte-identical while reduced motion holds.
      const shotA = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
      await sleep(1400);
      const shotB = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
      const still = shotA.data === shotB.data;
      await writeFile(join(outDir, '05-reduced-motion-a.png'), Buffer.from(shotA.data, 'base64'));
      await writeFile(join(outDir, '05-reduced-motion-b.png'), Buffer.from(shotB.data, 'base64'));

      // Control: with the setting off, the same 1.2 s window must DIFFER.
      // Without this, a frozen renderer would pass the check above for the
      // wrong reason.
      await cdp.eval(`(() => {
        window.__ctx.settings.reducedMotion = false;
        document.body.classList.remove('rw-reduced-motion');
        return true;
      })()`);
      await sleep(400);
      const moveA = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
      await sleep(1400);
      const moveB = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
      const moves = moveA.data !== moveB.data;
      await writeFile(join(outDir, '06-motion-on.png'), Buffer.from(moveB.data, 'base64'));

      // And the CSS guard is present for the three transition users.
      const css = await cdp.eval(`(() => {
        document.body.classList.add('rw-reduced-motion');
        const pick = (sel) => {
          const el = document.querySelector(sel);
          return el ? getComputedStyle(el).transitionDuration : null;
        };
        const out = {
          close: pick('.rw-models-close'),
          tab: pick('.rw-models-tab'),
          entry: pick('.rw-models-entry'),
        };
        document.body.classList.remove('rw-reduced-motion');
        return out;
      })()`);
      const cssOff = ['close', 'tab', 'entry']
        .every((k) => css?.[k] === null || /^0s(,\\s*0s)*$/.test(String(css[k])));

      record('V4', still && moves && cssOff, { still, moves, css, cssOff });
    }

    // =====================================================================
    // V6 — first open state (G1-G3) and the P1 row budget
    // =====================================================================
    // V1/V2 already opened the overlay, so hasOpenedOnce is set and G4 is
    // live. Reload to get a true first open.
    await cdp.send('Page.reload');
    await waitUntil(`(() => !!document.getElementById('rw-title-models'))()`,
      (v) => v === true, 40000);
    await sleep(500);

    const openModels = async () => {
      await cdp.eval(`(() => { document.getElementById('rw-title-models').click(); return true; })()`);
      await waitUntil(`!!window.__ctx?.models?.isOpen?.()`, (v) => v === true, 20000);
      await sleep(1800);
    };

    const LIST = `(() => {
      const list = document.querySelector('.rw-models-list');
      if (!list) return null;
      const groups = [...list.querySelectorAll('.rw-models-group')];
      const rows = [...list.querySelectorAll('.rw-models-entry')];
      const sel = list.querySelector('.rw-models-entry.rw-selected');
      const mode = [...document.querySelectorAll('.rw-models-tab')]
        .find((t) => t.classList.contains('rw-selected'));
      const info = document.querySelector('.rw-models-name');
      const gname = (g) => g.querySelector('.rw-models-group-name').textContent.trim();
      return {
        groupCount: groups.length,
        groupLabels: groups.map(gname),
        expanded: groups.filter((g) => g.getAttribute('aria-expanded') === 'true').map(gname),
        rowCount: rows.length,
        domRows: groups.length + rows.length,
        selected: sel ? sel.textContent.trim() : null,
        mode: mode ? mode.textContent.trim() : null,
        shown: info ? info.textContent.trim() : null,
        swatches: list.querySelectorAll('.rw-models-swatch').length,
      };
    })()`;

    const clickGroup = (name) => cdp.eval(`(() => {
      const g = [...document.querySelectorAll('.rw-models-group')]
        .find((x) => x.querySelector('.rw-models-group-name').textContent.trim() === '${name}');
      if (g) g.click();
      return !!g;
    })()`);

    const setFilter = (text) => cdp.eval(`(() => {
      const i = document.querySelector('.rw-models-input');
      i.value = '${text}';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);

    const setMode = (mode) => cdp.eval(`(() => {
      const t = [...document.querySelectorAll('.rw-models-tab')]
        .find((x) => x.dataset.mode === '${mode}');
      if (t) t.click();
      return !!t;
    })()`);

    {
      await openModels();
      const v = await waitUntil(LIST, (x) => x && x.groupCount > 0, 20000);
      await cdp.shot('07-by-faction-first-open.png');
      record('V6', !!(v
        && v.mode === 'BY FACTION'
        && v.expanded.length === 1
        && v.expanded[0] === 'Freehold Compact'
        && v.selected === 'Freehold Compact — Light'
        && v.groupCount === 13
        && v.groupLabels[v.groupLabels.length - 1] === 'Not a faction'
        && v.domRows === 22
        && v.domRows <= 40), {
        mode: v?.mode, expanded: v?.expanded, selected: v?.selected,
        groupCount: v?.groupCount, domRows: v?.domRows, swatches: v?.swatches,
        lastGroup: v?.groupLabels?.[v.groupLabels.length - 1],
      });
    }

    // =====================================================================
    // V6b — a faction group reads as the size ladder
    // =====================================================================
    {
      await clickGroup('Veridian Combine');
      await sleep(500);
      const got = await cdp.eval(`(() => {
        const kids = [...document.querySelector('.rw-models-list').children];
        const idx = kids.findIndex((k) => k.classList.contains('rw-models-group')
          && k.querySelector('.rw-models-group-name')?.textContent.trim() === 'Veridian Combine');
        const out = [];
        for (let i = idx + 1; i < kids.length; i++) {
          if (kids[i].classList.contains('rw-models-group')) break;
          out.push(kids[i].textContent.trim());
        }
        return out;
      })()`);
      // Ships in CLASS_ORDER, then Station, then Gate, then Landmarks.
      // 'Hulk Row' is Veridian's authored landmark (authored-systems.js), and
      // it belongs here: the design orders Landmarks last inside a faction.
      const expected = [
        'Veridian Combine — Light', 'Veridian Combine — Ace', 'Veridian Combine — Cutter',
        'Veridian Combine — Heavy', 'Veridian Combine — Frigate', 'Veridian Combine — Freighter',
        'Veridian Combine Station', 'Veridian Combine Gate', 'Hulk Row',
      ];
      record('V6b', JSON.stringify(got) === JSON.stringify(expected), { got, expected });
      await clickGroup('Veridian Combine');
      await sleep(300);
    }

    // =====================================================================
    // V7 — BY TYPE keeps the six categories and the 173 canonical rows
    // =====================================================================
    {
      await setMode('type');
      await sleep(500);
      await cdp.eval(`(() => {
        for (const g of document.querySelectorAll('.rw-models-group')) {
          if (g.getAttribute('aria-expanded') === 'false') g.click();
        }
        return true;
      })()`);
      await sleep(900);
      const v = await cdp.eval(LIST);
      await cdp.shot('08-by-type-expanded.png');
      const cats = ['Ships', 'Stations', 'Gates', 'Landmarks', 'Celestial', 'Props'];
      record('V7', !!(v && v.groupCount === 6
        && JSON.stringify(v.groupLabels) === JSON.stringify(cats)
        && v.rowCount === 172),
      { groupCount: v?.groupCount, groupLabels: v?.groupLabels, rowCount: v?.rowCount });
    }

    // =====================================================================
    // V8 — the filter force-expands its matches, and a miss says so
    // =====================================================================
    {
      await setMode('faction');
      await sleep(400);
      await setFilter('lamp');
      await sleep(600);
      const hit = await cdp.eval(LIST);
      await setFilter('zzzznope');
      await sleep(500);
      const miss = await cdp.eval(`(() => {
        const e = document.querySelector('.rw-models-empty');
        return { text: e ? e.textContent.trim() : null,
                 rows: document.querySelectorAll('.rw-models-entry').length };
      })()`);
      await setFilter('');
      await sleep(400);
      record('V8', !!(hit
        && hit.groupLabels.length > 0
        && hit.groupLabels.every((l) => l === 'Lamplighter Guild')
        && hit.expanded.length === hit.groupLabels.length
        && hit.rowCount > 0
        && miss?.text && miss.rows === 0),
      { hitGroups: hit?.groupLabels, hitRows: hit?.rowCount, miss });
    }

    // =====================================================================
    // V9 — the livery toggle re-skins in place
    // =====================================================================
    {
      await clickGroup('Ferrous Hegemony');
      await sleep(500);
      await cdp.eval(`(() => {
        const r = [...document.querySelectorAll('.rw-models-entry')]
          .find((x) => x.textContent.trim() === 'Ferrous Hegemony — Frigate');
        if (r) r.click();
        return !!r;
      })()`);
      await sleep(3500);
      const before = await cdp.eval(`(() => ({
        disabled: document.querySelector('.rw-models-check').disabled,
        label: document.querySelector('.rw-models-variant-label').textContent.trim(),
        shown: document.querySelector('.rw-models-name')?.textContent.trim() || null,
      }))()`);
      const shotA = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
      await cdp.eval(`(() => { document.querySelector('.rw-models-check').click(); return true; })()`);
      await sleep(3500);
      const shotB = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
      await writeFile(join(outDir, '09-livery-on.png'), Buffer.from(shotB.data, 'base64'));
      const after = await cdp.eval(`(() => ({
        checked: document.querySelector('.rw-models-check').checked,
        row: (document.querySelector('.rw-models-entry.rw-selected') || {}).textContent,
        shown: document.querySelector('.rw-models-name')?.textContent.trim() || null,
      }))()`);
      record('V9', !!(before?.disabled === false
        && before.label === 'Pirate livery'
        && after?.checked === true
        && String(after.row).trim() === 'Ferrous Hegemony — Frigate'
        && /pirate/i.test(String(after.shown))
        && shotA.data !== shotB.data),
      { before, after, pixelsChanged: shotA.data !== shotB.data });
      await cdp.eval(`(() => { document.querySelector('.rw-models-check').click(); return true; })()`);
      await sleep(1500);
    }

    // =====================================================================
    // V10 — a row with no variant disables the box and explains itself
    // =====================================================================
    {
      await setFilter('scale anchor');
      await sleep(600);
      await cdp.eval(`(() => {
        const r = document.querySelector('.rw-models-entry');
        if (r) r.click();
        return !!r;
      })()`);
      await sleep(2200);
      const v = await cdp.eval(`(() => {
        const b = document.querySelector('.rw-models-check');
        const l = document.querySelector('.rw-models-variant-label');
        const w = document.querySelector('.rw-models-variant');
        const sel = document.querySelector('.rw-models-entry.rw-selected');
        return {
          row: sel ? sel.textContent.trim() : null,
          disabled: b.disabled,
          title: l.title,
          dimmed: w.classList.contains('rw-disabled'),
        };
      })()`);
      await cdp.shot('10-player-anchor-no-variant.png');
      await setFilter('');
      await sleep(400);
      record('V10', !!(v && v.disabled === true
        && /no variant/i.test(String(v.title)) && v.dimmed), v);
    }

    // =====================================================================
    // V11 — station, planet and prop cards show only the lines they have
    // =====================================================================
    {
      const CARD = `(() => {
        const info = document.querySelector('.rw-models-info');
        if (!info) return null;
        const lines = [...info.children].map((el) => ({
          cls: el.className,
          text: el.textContent.trim(),
        }));
        return {
          lines,
          empty: lines.some((l) => !l.text),
          name: (info.querySelector('.rw-models-name') || {}).textContent || null,
          hasRole: !!info.querySelector('.rw-models-role'),
          hasScale: !!info.querySelector('.rw-models-line'),
          hasLore: !!info.querySelector('.rw-models-lore'),
          hasStats: !!info.querySelector('.rw-models-stats'),
        };
      })()`;

      // Expand-only: never collapse a group this flow did not open.
      const expandGroup = (name) => cdp.eval(`(() => {
        const h = [...document.querySelectorAll('.rw-models-group')]
          .find((g) => g.querySelector('.rw-models-group-name')?.textContent.trim() === '${name}');
        if (h && h.getAttribute('aria-expanded') === 'false') h.click();
        return !!h;
      })()`);

      const clickRow = (label) => cdp.eval(`(() => {
        const r = [...document.querySelectorAll('.rw-models-entry')]
          .find((x) => x.textContent.trim() === '${label}');
        if (r) r.click();
        return !!r;
      })()`);

      // Station: factioned, so title + faction first read + stats, and no
      // ship-only role or scale lines.
      await expandGroup('Veridian Combine');
      await sleep(400);
      await clickRow('Veridian Combine Station');
      await sleep(1500);
      const station = await cdp.eval(CARD);
      await cdp.shot('12-station-card.png');

      // Planet: no faction, so title + stats only.
      await setMode('type');
      await sleep(400);
      await expandGroup('Celestial');
      await sleep(300);
      await cdp.eval(`(() => {
        const h = [...document.querySelectorAll('.rw-models-group')]
          .find((g) => g.querySelector('.rw-models-group-name')?.textContent.trim() === 'Celestial');
        if (!h) return false;
        let row = h.nextElementSibling;
        while (row && !row.classList.contains('rw-models-entry')) row = row.nextElementSibling;
        if (row) row.click();
        return !!row;
      })()`);
      await sleep(1500);
      const planet = await cdp.eval(CARD);
      await cdp.shot('13-planet-card.png');

      // Prop: no faction either.
      await expandGroup('Props');
      await sleep(300);
      await clickRow('Cargo Pod');
      await sleep(1500);
      const prop = await cdp.eval(CARD);
      await cdp.shot('14-prop-card.png');

      const bareOk = (v) => !!(v && v.name && v.hasStats && !v.hasRole
        && !v.hasScale && !v.hasLore && !v.empty);
      record('V11', !!(station && station.name && station.hasStats && station.hasLore
        && !station.hasRole && !station.hasScale && !station.empty
        && bareOk(planet) && bareOk(prop)), { station, planet, prop });
    }

    // =====================================================================
    // V6c — G4 restores on re-open; G5 resets on reload
    // =====================================================================
    {
      await setMode('type');
      await sleep(500);
      await clickGroup('Props');
      await sleep(400);
      await cdp.eval(`(() => {
        const r = [...document.querySelectorAll('.rw-models-entry')]
          .find((x) => x.textContent.trim() === 'Cargo Pod');
        if (r) r.click();
        return !!r;
      })()`);
      await sleep(1800);
      const before = await cdp.eval(LIST);

      await cdp.eval(KEY('Escape', 'Escape'));
      await sleep(800);
      await openModels();
      const after = await cdp.eval(LIST);

      await cdp.send('Page.reload');
      await waitUntil(`(() => !!document.getElementById('rw-title-models'))()`,
        (v) => v === true, 40000);
      await sleep(500);
      await openModels();
      const reloaded = await cdp.eval(LIST);
      await cdp.shot('11-after-reload.png');

      record('V6c', !!(after && before
        && after.mode === before.mode
        && after.selected === before.selected
        && JSON.stringify(after.expanded) === JSON.stringify(before.expanded)
        && reloaded?.mode === 'BY FACTION'
        && reloaded?.selected === 'Freehold Compact — Light'
        && reloaded?.domRows === 22), {
        beforeMode: before?.mode, afterMode: after?.mode,
        beforeSel: before?.selected, afterSel: after?.selected,
        beforeExp: before?.expanded, afterExp: after?.expanded,
        reloadedMode: reloaded?.mode, reloadedSel: reloaded?.selected,
        reloadedRows: reloaded?.domRows,
      });
    }

    // ---- console ------------------------------------------------------
  } catch (err) {
    failure = err;
    results.error = String(err?.message || err);
    say('FATAL', err?.stack || String(err));
  } finally {
    if (cdp) {
      results.consoleErrors = cdp.console
        .filter((m) => m.type === 'error' || m.type === 'assert')
        .map((m) => m.text.slice(0, 300));
      results.exceptions = cdp.exceptions.map((t) => t.slice(0, 300));
      cdp.close();
    }
    results.chromeStderr = chromeStderr.slice(-20);
    await killTree(chrome);
    await killTree(vite);
    try {
      // Windows can release Chrome's first_party_sets.db a beat after
      // taskkill reports success. Give handles time to drain, then let rm
      // retry the exact mkdtemp directory rather than leaking run profiles.
      await sleep(750);
      await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
      results.profileRemoved = true;
    } catch (err) {
      results.profileRemoved = false;
      results.profileCleanupError = String(err?.message || err);
      results.error ||= `profile cleanup failed: ${results.profileCleanupError}`;
      failure ||= err;
      say('profile cleanup failed', results.profileCleanupError);
    }
  }

  const missing = FLOWS.filter((f) => !results.flows[f]);
  const failed = FLOWS.filter((f) => results.flows[f] && !results.flows[f].pass);
  const clean = results.consoleErrors.length === 0 && results.exceptions.length === 0;

  say('');
  say('missing:', missing.join(',') || 'none');
  say('failed:', failed.join(',') || 'none');
  say('console errors:', results.consoleErrors.length, 'exceptions:', results.exceptions.length);

  const ok = !failure && results.profileRemoved === true
    && missing.length === 0 && failed.length === 0 && clean;
  results.summary = { missing, failed, clean, ok };
  say(ok ? 'RW008 LIVE PROBE PASS' : 'RW008 LIVE PROBE FAIL');

  await writeFile(join(outDir, 'probes.json'), JSON.stringify(results, null, 2));
  await writeFile(join(outDir, 'run.log'), log.join('\n'));
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  say('FATAL', err?.stack || String(err));
  process.exit(1);
});
