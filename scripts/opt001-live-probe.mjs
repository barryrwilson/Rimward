/**
 * OPT-001 live evidence refresh. Read-only against `src/`.
 *
 * Drives the dev app in headless Chrome over CDP and records one pass/fail
 * per optional surface: Hail01, HUD-06, Hail02, HUD-07, NAV-09, TGT-07,
 * CTL-03. Captures one compact still per surface plus the console log.
 *
 * Run: node scripts/opt001-live-probe.mjs
 * Output: out/w143/opt001/verify/ (ignored path; stills are not committed).
 *
 * Vite 5186 / CDP 9486. The Chrome profile lives outside the repository.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const here = process.env.OPT001_OUT || join(repo, 'out', 'w143', 'opt001', 'verify');
const WIN = process.platform === 'win32';

/** First Chrome on this machine. OPT001_CHROME / CHROME_PATH win. */
function findChrome() {
  const named = process.env.OPT001_CHROME || process.env.CHROME_PATH;
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
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Let spawn resolve it on PATH; the launch error names the miss.
  return WIN ? 'chrome.exe' : 'google-chrome';
}

const CHROME = findChrome();
const PORT = 5186;
const CDP_PORT = 9486;
const APP = `http://127.0.0.1:${PORT}/`;
const PROFILE = process.env.OPT001_PROFILE
  || join(process.env.TEMP || process.env.TMP || '.', 'opt001-chrome-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

/** Every surface the pass must reach. A missing one fails the run. */
const SURFACES = ['Hail01', 'HUD-06', 'Hail02', 'HUD-07', 'NAV-09', 'TGT-07', 'CTL-03'];

const results = {
  commit: process.env.OPT001_SHA || null,
  port: PORT,
  cdp: CDP_PORT,
  boot: null,
  surfaces: {},
  consoleErrors: [],
  exceptions: [],
};

function record(key, pass, detail) {
  results.surfaces[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 600));
}

/** Stop a child and everything it started. Vite and Chrome both fork. */
function killTree(child) {
  if (!child || child.exitCode != null) return;
  if (WIN) {
    try {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      return;
    } catch { /* fall through to the plain kill */ }
  } else {
    // POSIX children are spawned detached, so they lead a process group.
    try {
      process.kill(-child.pid, 'SIGKILL');
      return;
    } catch { /* group gone, or never became a leader */ }
  }
  try { child.kill('SIGKILL'); } catch { /* already gone */ }
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
        const text = (msg.params?.args || [])
          .map((a) => a.value ?? a.description ?? '')
          .join(' ');
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
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, timeoutMs);
    if (r?.exceptionDetails) {
      throw new Error(
        r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval',
      );
    }
    return r?.result?.value;
  }
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    const path = join(here, name);
    await writeFile(path, Buffer.from(r.data, 'base64'));
    say('SHOT', name);
  }
  close() { try { this.ws.close(); } catch { /* closed */ } }
}

/**
 * TGT-07 snapshot. Rebuilds the live KeyT candidate set from `ctx.ships` and
 * reports what the cycle law names, so ambient traffic cannot skew the check.
 * `expectedDist` is the nearest hostile when one is in the envelope, and the
 * nearest candidate otherwise.
 */
const SNAP = `(async () => {
  const c = window.__ctx;
  const { U } = await import('/src/game/state.js');
  const p = c.ship.object.position;
  const hostile = (s) => !!(s && s.ai && s.ai.intent === true);
  const cands = [];
  for (const s of c.ships) {
    if (!s || !s.object || !s.object.position) continue;
    if (s.state && s.state.destroyed) continue;
    const d = s.object.position.distanceTo(p);
    if (!Number.isFinite(d) || d > U.TARGET_RANGE) continue;
    cands.push({ s, d: Math.round(d), hostile: hostile(s) });
  }
  const hostiles = cands.filter((x) => x.hostile);
  const min = (list) => (list.length ? Math.min(...list.map((x) => x.d)) : null);
  const cur = c.targets ? c.targets.current : null;
  const lock = cands.find((x) => x.s === cur) || null;
  const o = window.__opt001 || {};
  return {
    candCount: cands.length,
    hostileCount: hostiles.length,
    nearestDist: min(cands),
    nearestHostileDist: min(hostiles),
    expectedDist: hostiles.length ? min(hostiles) : min(cands),
    lockName: (cur && cur.state && cur.state.name) || null,
    lockDist: lock ? lock.d : null,
    lockHostile: lock ? lock.hostile : null,
    lockIsFar: cur === o.far,
    lockIsNear: cur === o.near,
    closerNonHostileCount: lock
      ? cands.filter((x) => !x.hostile && x.d < lock.d).length
      : 0,
  };
})()`;

/**
 * Put the TGT-07 candidate set back to the spawned pair: park every other ship
 * outside the envelope, restore the pair's offsets, and clear the lock. Only
 * the harness ships move. Ambient traffic is parked, never destroyed.
 */
const RESTAGE = `(() => {
  const c = window.__ctx;
  const o = window.__opt001;
  if (!c || !o) return false;
  const base = c.ship.object.position;
  for (const s of c.ships) {
    if (!s || !s.object || !s.object.position) continue;
    if (s === o.near || s === o.far) continue;
    s.object.position.set(base.x + 5000, base.y + 5000, base.z + 5000);
  }
  o.near.object.position.set(base.x + 120, base.y, base.z);
  o.far.object.position.set(base.x + 380, base.y, base.z);
  if (c.targets) c.targets.current = null;
  return true;
})()`;

const KEY = (code, key) => `(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${key}', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${key}', bubbles: true }));
  return true;
})()`;

async function main() {
  await mkdir(PROFILE, { recursive: true });
  await mkdir(here, { recursive: true });
  let vite = null;
  let chrome = null;
  let cdp = null;

  try {
    // ---- Vite -------------------------------------------------------------
    vite = spawn(
      process.execPath,
      [
        join(repo, 'node_modules', 'vite', 'bin', 'vite.js'),
        '--host', '127.0.0.1', '--port', String(PORT), '--strictPort',
      ],
      { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN },
    );
    vite.stdout.on('data', (b) => say('vite', String(b).trim().slice(0, 160)));
    vite.stderr.on('data', (b) => say('vite!', String(b).trim().slice(0, 160)));
    let up = false;
    for (let i = 0; i < 100; i++) {
      up = await fetch(APP).then((r) => r.ok).catch(() => false);
      if (up) break;
      await sleep(300);
    }
    if (!up) throw new Error(`vite ${PORT} not serving`);
    say('vite up', PORT);

    // ---- Chrome -----------------------------------------------------------
    chrome = spawn(CHROME, [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${PROFILE}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--disable-extensions',
      '--window-size=1440,900',
      '--headless=new',
      '--hide-crash-restore-bubble',
      '--disable-session-crashed-bubble',
      // A CI container has no user namespace, so the Chrome sandbox cannot
      // start there. Keep the sandbox on for a normal desktop run.
      ...(WIN ? [] : ['--no-sandbox', '--disable-dev-shm-usage']),
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN });
    say('chrome', CHROME, 'pid', chrome.pid);

    let browserWs = null;
    for (let i = 0; i < 60; i++) {
      try {
        const ver = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (ver.ok) {
          browserWs = (await ver.json()).webSocketDebuggerUrl;
          if (browserWs) break;
        }
      } catch { /* not up yet */ }
      await sleep(200);
    }
    if (!browserWs) throw new Error('CDP not ready');

    cdp = new Cdp(browserWs);
    await cdp.ready();
    await cdp.send('Target.createTarget', { url: APP });
    cdp.close();

    let pageWs = null;
    for (let i = 0; i < 50; i++) {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && String(t.url || '').includes(String(PORT)));
      if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
      await sleep(200);
    }
    if (!pageWs) throw new Error('page ws missing');
    cdp = new Cdp(pageWs);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    /**
     * Re-evaluate `expr` until `pred` holds, then return that value. A fixed
     * sleep races on a slow runner: HUD text is throttled to 0.2 s, and an
     * event can land after the read. Returns the last value on timeout, so
     * the assertion still sees real data and still fails.
     */
    const waitUntil = async (expr, pred, ms = 6000, step = 150) => {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        last = await cdp.eval(expr);
        try {
          if (pred(last)) return last;
        } catch { /* keep polling on a shape we did not expect */ }
        await sleep(step);
      }
      return last;
    };

    // ---- Boot into flight -------------------------------------------------
    const waitBoot = async (ms = 30000) => {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        last = await cdp.eval(`({
          ctx: !!window.__ctx,
          title: !!document.getElementById('rw-title'),
          originText: (document.body?.innerText || '').includes('who are you'),
        })`);
        if (last && (last.ctx || last.title || last.originText)) return last;
        await sleep(300);
      }
      return last;
    };

    await waitBoot();
    await cdp.eval(`(() => {
      try { localStorage.removeItem('rimward-save-v1'); } catch {}
      try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
      location.reload();
      return true;
    })()`);
    await sleep(1200);
    const boot = await waitBoot();
    say('boot', JSON.stringify(boot));

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

    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      const ready = await cdp.eval(`(() => {
        const c = window.__ctx;
        return !!(c?.ship?.object && c.world.origin && c.flags.paused === false
          && (c.world.time || 0) > 1);
      })()`);
      if (ready) break;
      await sleep(300);
    }
    results.boot = await cdp.eval(`(() => {
      const c = window.__ctx;
      return {
        hasCtx: !!c,
        origin: c?.world?.origin || null,
        sys: c?.world?.currentSystem || null,
        docked: !!c?.flags?.docked,
        ships: c?.ships?.length || 0,
      };
    })()`);
    say('flight', JSON.stringify(results.boot));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');

    if (results.boot.docked) {
      await cdp.eval(KEY('Digit8', '8'));
      await sleep(1500);
    }
    // Survive the pass: hull/screen are harness-only, no src edit.
    await cdp.eval(`(() => {
      const c = window.__ctx;
      if (c?.player) {
        c.player.hullMax = 1e9; c.player.hull = 1e9;
        c.player.screenMax = 1e9; c.player.screen = 1e9;
      }
      return true;
    })()`);
    // Let traffic populate.
    const tShips = Date.now();
    while (Date.now() - tShips < 12000) {
      if (await cdp.eval('(window.__ctx?.ships?.length || 0) > 0')) break;
      await sleep(300);
    }
    await sleep(2000); // HUD text is throttled to 0.2 s; let the rail settle.

    // ================= CTL-03 berth freeze =================================
    // This runs first. The ship sits about 180 u out, alive and undocked, and
    // nothing is spawned yet. Later in a pass the ship closes on the station,
    // and a collision recovery refuses the KeyL open.
    {
      // Throttle up so a frozen ship is a real observation, not a still ship.
      await cdp.eval(`(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', key: 'r', bubbles: true }));
        return true;
      })()`);
      await sleep(1200);
      await cdp.eval(`(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR', key: 'r', bubbles: true }));
        return true;
      })()`);
      await sleep(600);
      const moving = await cdp.eval(`(() => {
        const c = window.__ctx;
        const p = c.ship.object.position;
        return { x: p.x, y: p.y, z: p.z, throttle: c?.input?.throttle ?? null, t: c.world.time };
      })()`);
      await cdp.eval(KEY('KeyL', 'l'));
      const openState = await waitUntil(`(() => {
        const c = window.__ctx;
        const p = c.ship.object.position;
        return {
          berthOpen: !!c?.flags?.berthOpen,
          berthHold: !!c?.flags?.berthHold,
          paused: !!c?.flags?.paused,
          x: p.x, y: p.y, z: p.z,
          t: c.world.time,
        };
      })()`, (v) => v && v.berthOpen && v.berthHold);
      await sleep(2000);
      const heldState = await cdp.eval(`(() => {
        const c = window.__ctx;
        const p = c.ship.object.position;
        return {
          berthHold: !!c?.flags?.berthHold,
          paused: !!c?.flags?.paused,
          x: p.x, y: p.y, z: p.z,
          t: c.world.time,
        };
      })()`);
      await cdp.shot('09-ctl03-berth-hold.png');
      const drift = Math.hypot(
        heldState.x - openState.x, heldState.y - openState.y, heldState.z - openState.z,
      );
      await cdp.eval(KEY('KeyL', 'l'));
      const closed = await waitUntil(`(() => {
        const c = window.__ctx;
        return {
          berthOpen: !!c?.flags?.berthOpen,
          berthHold: !!c?.flags?.berthHold,
          paused: !!c?.flags?.paused,
        };
      })()`, (v) => v && !v.berthOpen && !v.berthHold);
      await cdp.shot('10-ctl03-resumed.png');
      record('CTL-03', !!(openState.berthOpen && openState.berthHold && !openState.paused
        && drift < 1 && !closed.berthOpen && !closed.berthHold),
      { moving, openState, heldState, driftWhileHeld: Number(drift.toFixed(3)), closed });

      // Stop the ship for the rest of the pass. A double tap on F commands the
      // full stop, so the station range stays stable for the later checks.
      await cdp.eval(KEY('KeyF', 'f'));
      await sleep(120);
      await cdp.eval(KEY('KeyF', 'f'));
      await sleep(800);
      say('full stop', JSON.stringify(await cdp.eval(`(() => {
        const c = window.__ctx;
        return {
          fullStop: c?.input?.fullStop === true,
          throttle: c?.input?.throttle ?? null,
          stationDist: Math.round(c.station.position.distanceTo(c.ship.object.position)),
        };
      })()`)));
    }


    // ================= HUD-06 home marker ==================================
    {
      const hud06 = await cdp.eval(`(() => {
        const c = window.__ctx;
        const row = document.querySelector('.rw-pos-home');
        const pip = document.querySelector('.rw-home-pip');
        const chev = document.querySelector('.rw-home-chevron');
        const shown = (el) => !!el && !el.classList.contains('is-hidden')
          && getComputedStyle(el).display !== 'none';
        const box = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
        };
        return {
          rowExists: !!row,
          rowShown: shown(row),
          rowText: (row?.textContent || '').trim(),
          pipParent: pip?.parentElement?.id || null,
          pipShown: shown(pip),
          chevShown: shown(chev),
          chevCenter: shown(chev) ? box(chev) : null,
          docked: !!c?.flags?.docked,
        };
      })()`);
      await cdp.shot('01-hud06-home-marker.png');
      const markShown = hud06.pipShown || hud06.chevShown;
      const inset = hud06.chevCenter
        ? Math.min(
          hud06.chevCenter.x, hud06.chevCenter.y,
          1440 - hud06.chevCenter.x, 900 - hud06.chevCenter.y,
        )
        : null;
      record('HUD-06', !!(hud06.rowShown && /HOME/.test(hud06.rowText) && markShown
        && hud06.pipParent === 'hud'), { ...hud06, chevInsetMin: inset });

      // Overlay hide: chart open must hide the home marker + POS HOME row.
      await cdp.eval(KEY('KeyM', 'm'));
      const hidden = await waitUntil(`(() => {
        const shown = (s) => {
          const el = document.querySelector(s);
          return !!el && !el.classList.contains('is-hidden')
            && getComputedStyle(el).display !== 'none';
        };
        return {
          chartOpen: !!window.__ctx?.flags?.chartOpen,
          row: shown('.rw-pos-home'),
          pip: shown('.rw-home-pip'),
          chev: shown('.rw-home-chevron'),
        };
      })()`, (v) => v && v.chartOpen && !v.row && !v.pip && !v.chev);
      results.surfaces['HUD-06'].overlayHide = hidden;
      if (hidden.row || hidden.pip || hidden.chev) {
        results.surfaces['HUD-06'].pass = false;
        say('FAIL HUD-06 overlay hide', JSON.stringify(hidden));
      }
    }

    // ================= NAV-09 chart readability ============================
    {
      const open = await cdp.eval('!!window.__ctx?.flags?.chartOpen');
      if (!open) { await cdp.eval(KEY('KeyM', 'm')); await sleep(700); }
      const nav09a = await cdp.eval(`(() => {
        const id = (s) => document.getElementById(s);
        const btn = (s) => {
          const el = id(s);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { text: (el.textContent || '').trim(), h: Math.round(r.height), w: Math.round(r.width) };
        };
        return {
          chartOpen: !!window.__ctx?.flags?.chartOpen,
          zoomIn: btn('rw-galaxy-zoom-in'),
          zoomOut: btn('rw-galaxy-zoom-out'),
          zoomReset: btn('rw-galaxy-zoom-reset'),
          factionFilter: !!id('rw-galaxy-filter-faction'),
          factionOptions: id('rw-galaxy-filter-faction')?.options?.length || 0,
          standingFilter: !!id('rw-galaxy-filter-standing'),
          itineraryExists: !!id('rw-galaxy-itinerary'),
          itineraryHidden: id('rw-galaxy-itinerary')?.hidden !== false,
        };
      })()`);
      // Plot a route so the itinerary paints leg rows.
      const plot = await cdp.eval(`(() => {
        const sel = document.querySelector('#rw-galaxy select:not(#rw-galaxy-filter-faction):not(#rw-galaxy-filter-standing)')
          || [...document.querySelectorAll('select')].find((s) =>
            s.id !== 'rw-galaxy-filter-faction' && s.id !== 'rw-galaxy-filter-standing');
        if (!sel) return { ok: false, reason: 'no-dest-select' };
        const opt = [...sel.options].find((o) => o.value && !o.disabled && o.value !== sel.value);
        if (!opt) return { ok: false, reason: 'no-option' };
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, dest: opt.textContent.trim().slice(0, 60) };
      })()`);
      const nav09b = await waitUntil(`(() => {
        const it = document.getElementById('rw-galaxy-itinerary');
        const rows = [...document.querySelectorAll('.rw-galaxy-itinerary-list li')];
        return {
          itineraryShown: !!it && it.hidden === false,
          legCount: rows.length,
          firstLeg: (rows[0]?.textContent || '').trim().slice(0, 120),
        };
      })()`, (v) => v && v.itineraryShown && v.legCount > 0);
      await cdp.shot('02-nav09-chart.png');
      const zoomOk = !!(nav09a.zoomIn && nav09a.zoomOut && nav09a.zoomReset
        && nav09a.zoomIn.h >= 24 && nav09a.zoomOut.h >= 24 && nav09a.zoomReset.h >= 24);
      record('NAV-09', !!(nav09a.chartOpen && zoomOk && nav09a.factionFilter
        && nav09a.standingFilter && nav09b.itineraryShown && nav09b.legCount > 0),
      { ...nav09a, plot, ...nav09b });
      await cdp.eval(KEY('KeyM', 'm'));
      await sleep(600);
    }

    // ================= HUD-07 deconfliction ================================
    {
      // Cruise (no lock, no combat) first.
      await cdp.eval(`(() => {
        const c = window.__ctx;
        if (c?.targets) c.targets.current = null;
        return true;
      })()`);
      await sleep(500);
      const cruise = await cdp.eval(`(() => {
        const op = (s) => {
          const el = document.querySelector(s);
          return el ? Number(getComputedStyle(el).opacity) : null;
        };
        const ret = document.querySelector('.rw-reticle');
        const r = ret?.getBoundingClientRect();
        return {
          inCombat: document.getElementById('hud')?.classList.contains('in-combat') || false,
          rangeOpacity: op('.rw-reticle-range'),
          leadOpacity: op('.rw-lead-label'),
          reticle: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
          hubChildren: ret ? [...ret.children].map((el) => el.className) : [],
        };
      })()`);
      // Lock a contact and check the duplicate name yields.
      await cdp.eval(KEY('KeyT', 't'));
      const locked = await waitUntil(`(() => {
        const c = window.__ctx;
        const tn = document.querySelector('.rw-target-name');
        const cn = document.querySelector('.rw-combat-name');
        const arrow = document.querySelector('.rw-edge-arrow');
        const box = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { y: Math.round(r.y + r.height / 2) };
        };
        const vis = (el) => !!el && getComputedStyle(el).display !== 'none';
        return {
          hasLock: !!c?.targets?.current,
          lockName: c?.targets?.current?.state?.name || null,
          targetNameYield: !!tn?.classList.contains('rw-yield'),
          targetNameVisible: vis(tn),
          combatNameText: (cn?.textContent || '').trim().slice(0, 60),
          edgeArrowVisible: vis(arrow),
          edgeArrowCenter: vis(arrow) ? box(arrow) : null,
        };
      })()`, (v) => v && v.hasLock);
      await cdp.shot('03-hud07-deconflict.png');
      const hubExtras = (cruise.hubChildren || []).filter((cn) => /deconflict|ppi|compass/i.test(cn));
      record('HUD-07', !!(cruise.reticle && cruise.reticle.w === 80 && cruise.reticle.h === 80
        && cruise.rangeOpacity !== null && cruise.rangeOpacity <= 0.2
        && hubExtras.length === 0
        && (!locked.hasLock || !locked.targetNameVisible || locked.targetNameYield)),
      { cruise, locked, hubExtras });
    }

    // ================= TGT-07 combat cycle =================================
    {
      const setup = await cdp.eval(`(async () => {
        const c = window.__ctx;
        const { spawnLiveShip } = await import('/src/systems/npc.js');
        const { isShipAssetReady, primeShipAsset } =
          await import('/src/systems/ship-assets.js');
        const base = c.ship.object.position;
        // A ship mesh needs its asset loaded, and on a cold CI runner none of
        // a fixed list may be ready yet. Prefer the combos already flying -
        // their assets are proven - then prime the rest and wait for one.
        const seen = new Set();
        const tries = [];
        const add = (faction, classKey, role) => {
          if (!faction || !classKey) return;
          const key = faction + '|' + classKey + '|' + (role || 'trader');
          if (seen.has(key)) return;
          seen.add(key);
          tries.push({ faction, classKey, role: role || 'trader' });
        };
        for (const sh of c.ships) {
          if (!sh || !sh.object) continue;
          add(sh.record && sh.record.faction, sh.record && sh.record.classKey,
            sh.record && sh.record.role);
        }
        add('independent', 'cutter', 'trader');
        add('freehold', 'cutter', 'trader');
        add('redledger', 'cutter', 'trader');
        add('independent', 'freighter', 'trader');
        for (const t of tries) {
          try { primeShipAsset(t.faction, t.classKey, t.role); } catch {}
        }
        const deadline = Date.now() + 15000;
        let ready = tries.filter((t) => isShipAssetReady(t.faction, t.classKey, t.role));
        while (!ready.length && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 200));
          ready = tries.filter((t) => isShipAssetReady(t.faction, t.classKey, t.role));
        }
        if (!ready.length) return { ok: false, reason: 'no-ship-asset-ready', tried: tries.length };
        const mk = (tag, dx, hostile) => {
          const pos = base.clone();
          pos.x += dx;
          let live = null;
          for (const t of ready) {
            live = spawnLiveShip(c, {
              id: 'opt001-' + tag + '-' + Date.now(),
              name: tag,
              classKey: t.classKey,
              faction: t.faction,
              role: t.role,
              resolve: 50,
              personality: 50,
              pilot: tag,
            }, pos);
            if (live) break;
          }
          if (!live) return null;
          live._opt001 = true;
          if (live.ai) { live.ai.intent = hostile === true; live.ai.mode = hostile ? 'hunt' : 'cruise'; }
          if (live.state) live.state.name = tag;
          c.ships.push(live);
          return live;
        };
        // Park every pre-existing ship well outside the 600 u cycle envelope
        // so the pair below is the only candidate set. Harness-only, restored
        // by the reload at the end of the pass.
        const parked = [];
        for (const s of c.ships) {
          if (!s?.object?.position) continue;
          parked.push(s);
          s.object.position.set(base.x + 5000, base.y + 5000, base.z + 5000);
        }
        const near = mk('OPT NEAR FRIEND', 120, false);
        const far = mk('OPT FAR HOSTILE', 380, true);
        if (!near || !far) {
          return { ok: false, reason: 'spawn-failed', ready: ready.length, tried: tries.length };
        }
        window.__opt001 = { near, far, parked };
        c.targets.current = null;
        return {
          ok: true,
          used: ready[0],
          nearD: Math.round(near.object.position.distanceTo(base)),
          farD: Math.round(far.object.position.distanceTo(base)),
        };
      })()`);
      say('tgt07 setup', JSON.stringify(setup));
      let tgt07 = { setup };
      if (setup?.ok) {
        // The station law zone (300 u) clears NPC intent every AI tick, so pin
        // the contract's hostile bit (`ai.intent === true`) across the press.
        await cdp.eval(`(() => {
          window.__opt001pin = setInterval(() => {
            try { window.__opt001.far.ai.intent = true; } catch {}
          }, 16);
          return true;
        })()`);
        // Ambient traffic drifts in and out of the 600 u envelope, so stage the
        // candidate set again until it is exactly the spawned pair, then press.
        // The retry is on the SETUP only. The assertion below never repeats.
        const stage = async (want, attempts = 4) => {
          for (let a = 1; a <= attempts; a++) {
            await cdp.eval(RESTAGE);
            await sleep(250);
            const pre = await cdp.eval(SNAP);
            const clean = pre.candCount === 2
              && pre.hostileCount === want
              && (want === 0 || pre.nearestDist < pre.nearestHostileDist);
            if (!clean) {
              say('tgt07 restage', a, JSON.stringify(pre));
              continue;
            }
            await cdp.eval(KEY('KeyT', 't'));
            const snap = await waitUntil(SNAP, (v) => v && v.lockName !== null, 4000);
            return { snap, pre, attempts: a };
          }
          return { snap: null, pre: null, attempts };
        };

        const gatedRun = await stage(1);
        const gated = gatedRun.snap;
        await cdp.eval('(() => { clearInterval(window.__opt001pin); return true; })()');
        if (gated) await cdp.shot('04-tgt07-hostile-first.png');
        // Control: with no hostile in the envelope the sort stays nearest-first.
        await cdp.eval(`(() => {
          window.__opt001.far.ai.intent = false;
          return true;
        })()`);
        const ungatedRun = await stage(0);
        const ungated = ungatedRun.snap;
        tgt07 = {
          setup,
          gated,
          ungated,
          gatedAttempts: gatedRun.attempts,
          ungatedAttempts: ungatedRun.attempts,
        };
        if (!gated || !ungated) {
          // Never silently pass a check that did not run.
          record('TGT-07', false, {
            ...tgt07,
            inconclusive: 'the candidate set never settled to the spawned pair',
          });
        } else {
          // Assert the ordering law, not the identity of one spawned ship.
          //   gated   — a hostile exists, the lock is the nearest hostile, and
          //             a non-hostile sits closer. Hostiles beat range.
          //   ungated — no hostile exists, so the lock is the nearest candidate.
          const gatedOk = gated.hostileCount > 0
            && gated.lockHostile === true
            && gated.lockDist === gated.expectedDist
            && gated.closerNonHostileCount > 0;
          const ungatedOk = ungated.hostileCount === 0
            && ungated.lockHostile === false
            && ungated.lockDist === ungated.expectedDist;
          record('TGT-07', !!(gatedOk && ungatedOk), { ...tgt07, gatedOk, ungatedOk });
        }
      } else {
        record('TGT-07', false, tgt07);
      }
      // Restore the parked traffic and drop the harness ships.
      await cdp.eval(`(() => {
        const c = window.__ctx;
        const o = window.__opt001;
        if (!c || !o) return false;
        for (const s of [o.near, o.far]) {
          const i = c.ships.indexOf(s);
          if (i >= 0) c.ships.splice(i, 1);
          try { if (s.object) c.scene.remove(s.object); } catch {}
        }
        c.targets.current = null;
        return true;
      })()`);
      await sleep(400);
    }

    // ================= Hail02 miss feedback ================================
    {
      // Ambient pirate demands open their own card; watch this press only.
      await cdp.eval(`(() => {
        const c = window.__ctx;
        if (c?.targets) c.targets.current = null;
        window.__opt001seen = { hailMiss: 0, hailOpened: 0, misses: [] };
        const raw = c.emit.bind(c);
        window.__opt001emit = raw;
        c.emit = (type, ev) => {
          if (type === 'hailMiss') {
            window.__opt001seen.hailMiss++;
            window.__opt001seen.misses.push({
              name: ev && ev.name, verb: ev && ev.verb,
              reason: ev && ev.reason, dist: ev && ev.dist,
            });
          }
          if (type === 'hailOpened') window.__opt001seen.hailOpened++;
          return raw(type, ev);
        };
        return true;
      })()`);
      await sleep(300);
      const RESET_SEEN = `(() => {
        window.__opt001seen.hailMiss = 0;
        window.__opt001seen.hailOpened = 0;
        window.__opt001seen.misses = [];
        return true;
      })()`;
      await cdp.eval(RESET_SEEN);
      await cdp.eval(KEY('KeyH', 'h'));
      const hailToast = await waitUntil(`(() => {
        const c = window.__ctx;
        const t = [...document.querySelectorAll('.rw-toast')]
          .map((el) => ({ text: (el.textContent || '').trim(), cls: el.className }))
          .filter((x) => x.text);
        const card = document.querySelector('.rw-hail-card');
        return {
          toasts: t,
          seen: window.__opt001seen,
          cardDisplay: card ? getComputedStyle(card).display : null,
          paused: !!c?.flags?.paused,
        };
      })()`, (v) => v && v.seen && v.seen.hailMiss >= 1);
      await cdp.shot('05-hail02-no-lock.png');
      // Dock miss: name + integer range. The toast rail holds five slots and
      // ambient chatter evicts a line, so the emitted event is the check and
      // the rail text is supporting evidence.
      await cdp.eval(RESET_SEEN);
      await cdp.eval(KEY('KeyJ', 'j'));
      const dockMiss = await waitUntil(`(() => {
        const c = window.__ctx;
        const t = [...document.querySelectorAll('.rw-toast')]
          .map((el) => (el.textContent || '').trim()).filter(Boolean);
        const st = c?.station?.position;
        const p = c?.ship?.object?.position;
        return {
          toasts: t,
          seen: window.__opt001seen,
          docked: !!c?.flags?.docked,
          stationDist: st && p ? Math.round(st.distanceTo(p)) : null,
        };
      })()`, (v) => v && v.seen
        && (v.seen.misses || []).some((m) => m.verb === 'dock' || m.verb === 'jump'));
      await cdp.shot('06-hail02-dock-miss.png');
      await cdp.eval(`(() => {
        const c = window.__ctx;
        if (window.__opt001emit) c.emit = window.__opt001emit;
        return true;
      })()`);
      // The no-lock press must emit one miss naming no lock, and open no card.
      const noLockMiss = (hailToast.seen?.misses || [])
        .find((m) => m.verb === 'hail' && m.reason === 'none' && m.name === 'No lock');
      const noLockToast = hailToast.toasts.some((x) => /No lock\s+—\s+hail/.test(x.text)
        && /warn/.test(x.cls));
      // The dock press must emit one dock miss carrying an integer range.
      const dockMissEv = (dockMiss.seen?.misses || [])
        .find((m) => m.verb === 'dock' && typeof m.dist === 'number'
          && Number.isInteger(m.dist));
      const dockToast = dockMiss.toasts.some((x) => /—\s+dock out of range \(\d+ u\)/.test(x));
      record('Hail02', !!(noLockMiss && noLockToast && dockMissEv
        && hailToast.seen?.hailMiss === 1 && hailToast.seen?.hailOpened === 0
        && dockMiss.seen?.hailOpened === 0
        && !hailToast.paused && !dockMiss.docked),
      { hailToast, dockMiss, noLockMiss, noLockToast, dockMissEv, dockToast });
    }

    // ================= Hail01 demand lifecycle =============================
    {
      const spawn1 = await cdp.eval(`(async () => {
        const c = window.__ctx;
        const { spawnLiveShip } = await import('/src/systems/npc.js');
        const pos = c.ship.object.position.clone();
        pos.x += 90;
        const tries = [
          { faction: 'redledger', classKey: 'cutter', role: 'pirate' },
          { faction: 'independent', classKey: 'cutter', role: 'trader' },
          { faction: 'freehold', classKey: 'cutter', role: 'trader' },
        ];
        let live = null;
        for (const t of tries) {
          live = spawnLiveShip(c, {
            id: 'opt001-demand-' + Date.now(),
            name: 'Vane Rook',
            classKey: t.classKey,
            faction: t.faction,
            role: t.role,
            resolve: 50,
            personality: 95,
            alwaysHuntsPlayer: true,
            pilot: 'Vane Rook',
          }, pos);
          if (live) break;
        }
        if (!live) return { ok: false, reason: 'spawn-failed' };
        live._opt001 = true;
        c.ships.push(live);
        const now = c.world.time;
        live.role = 'pirate';
        if (live.ai) {
          live.ai.role = 'pirate';
          live.ai.mode = 'hunt';
          live.ai.target = 'player';
          live.ai.intent = true;
          live.ai.demandSent = true;
          live.ai.demanding = true;
          live.ai.demandOutcome = null;
          live.ai.demandPeaceAt = now;
          live.ai.demandExpiresAt = now + 20;
          live.ai.demandAmount = 80;
          live.ai.calmUntil = 0;
        }
        c.world.credits = 500;
        c.emit('hailOpened', {
          ship: live,
          intents: ['payTribute', 'showTeeth', 'refuseFight'],
          line: 'Your cargo or your hull.',
          demand: 80,
          demandHail: true,
          speaker: 'Vane Rook',
          demandExpiresAt: live.ai.demandExpiresAt,
          t: 20,
        });
        window.__opt001demand = live;
        return { ok: true, credits: c.world.credits };
      })()`);
      say('hail01 spawn', JSON.stringify(spawn1));
      const cardA = await waitUntil(`(() => {
        const card = document.querySelector('.rw-hail-card');
        const text = (card?.textContent || '').trim();
        const buttons = [...(card?.querySelectorAll('button') || [])]
          .map((b) => (b.textContent || '').trim());
        return {
          display: card ? getComputedStyle(card).display : null,
          namesSpeaker: /Vane Rook/.test(text),
          showsAmount: /80/.test(text),
          timer: (text.match(/(\\d+)\\s*s\\b/) || [])[1] || null,
          buttons,
          text: text.slice(0, 300),
        };
      })()`, (v) => v && v.display === 'block' && v.namesSpeaker && v.showsAmount);
      await cdp.shot('07-hail01-demand-card.png');
      // Math.ceil keeps 20s until more than 1 s of world.time passes.
      // A fixed 2.5 s wall sleep loses when headless rAF is throttled.
      const startTimer = Number(cardA.timer);
      const cardB = await waitUntil(`(() => {
        const card = document.querySelector('.rw-hail-card');
        const text = (card?.textContent || '').trim();
        return { timer: (text.match(/(\\d+)\\s*s\\b/) || [])[1] || null };
      })()`, (v) => v && v.timer != null && Number(v.timer) < startTimer, 8000);
      // Resolve by paying: outcome must be visible and credits must move.
      const pay = await cdp.eval(`(() => {
        const c = window.__ctx;
        const before = c.world.credits;
        const card = document.querySelector('.rw-hail-card');
        const btn = [...(card?.querySelectorAll('button') || [])]
          .find((b) => /pay|tribute/i.test(b.textContent || ''));
        if (!btn) return { ok: false, before, buttons: [...(card?.querySelectorAll('button') || [])].map((b) => b.textContent.trim()) };
        btn.click();
        return { ok: true, before };
      })()`);
      const after = await waitUntil(`(() => {
        const c = window.__ctx;
        const card = document.querySelector('.rw-hail-card');
        const live = window.__opt001demand;
        return {
          credits: c?.world?.credits ?? null,
          cardDisplay: card ? getComputedStyle(card).display : null,
          demandOutcome: live?.ai?.demandOutcome ?? null,
          toasts: [...document.querySelectorAll('.rw-toast')]
            .map((el) => (el.textContent || '').trim()).filter(Boolean),
        };
      })()`, (v) => v && v.demandOutcome === 'paid');
      await cdp.shot('08-hail01-demand-outcome.png');
      const ticked = cardA.timer != null && cardB.timer != null
        && Number(cardB.timer) < Number(cardA.timer);
      // The card may already carry a fresh ambient demand by now, so the
      // outcome is read from the demand's own resolution, not from the card.
      const outcomeToast = after.toasts.some((t) => /Vane Rook/.test(t));
      // The deadline is read a beat after the card opens, so the first sample
      // is 20 s or a little under. The contract is a visible deadline that
      // counts down, not an exact first frame.
      const deadline = Number(cardA.timer);
      record('Hail01', !!(cardA.display === 'block' && cardA.namesSpeaker && cardA.showsAmount
        && deadline >= 15 && deadline <= 20 && cardA.buttons.length === 3
        && ticked && pay.ok && after.demandOutcome === 'paid'
        && after.credits === pay.before - 80 && outcomeToast),
      { cardA, cardB, ticked, deadline, pay, after, outcomeToast });
      await cdp.eval(`(() => {
        const c = window.__ctx;
        const s = window.__opt001demand;
        if (!c || !s) return false;
        const i = c.ships.indexOf(s);
        if (i >= 0) c.ships.splice(i, 1);
        try { if (s.object) c.scene.remove(s.object); } catch {}
        return true;
      })()`);
      await sleep(400);
    }

    // ---- Console ----------------------------------------------------------
    results.consoleErrors = cdp.console.filter((c) => c.type === 'error');
    results.exceptions = cdp.exceptions;
    await writeFile(join(here, 'console.txt'),
      cdp.console.map((c) => `[${c.type}] ${c.text}`).join('\n')
      + '\n\n--- exceptions ---\n' + cdp.exceptions.join('\n') + '\n', 'utf8');
  } catch (err) {
    say('ERROR', err?.stack || String(err));
    results.error = String(err?.message || err);
  } finally {
    if (cdp) cdp.close();
    killTree(chrome);
    killTree(vite);
    await writeFile(join(here, 'run.log'), log.join('\n') + '\n', 'utf8');
    const entries = Object.entries(results.surfaces);
    console.log('\n' + entries.map(([k, v]) => `${v.pass ? 'PASS' : 'FAIL'}  ${k}`).join('\n'));
    console.log('console errors:', results.consoleErrors.length,
      'exceptions:', results.exceptions.length);

    // Gate the CI job: every surface must pass, all seven must run, and the
    // browser console must stay clean.
    const failed = entries.filter(([, v]) => !v.pass).map(([k]) => k);
    const missing = SURFACES.filter((k) => !results.surfaces[k]);
    const reasons = [];
    if (results.error) reasons.push(`harness error: ${results.error}`);
    if (missing.length) reasons.push(`surface not reached: ${missing.join(', ')}`);
    if (failed.length) reasons.push(`surface failed: ${failed.join(', ')}`);
    if (results.consoleErrors.length) {
      reasons.push(`console errors: ${results.consoleErrors.length}`);
    }
    if (results.exceptions.length) {
      reasons.push(`uncaught exceptions: ${results.exceptions.length}`);
    }
    results.verdict = reasons.length ? 'FAIL' : 'PASS';
    results.reasons = reasons;
    await writeFile(join(here, 'probes.json'), JSON.stringify(results, null, 2), 'utf8');
    if (reasons.length) {
      console.log('\nOPT-001 FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log('\nOPT-001 PASS — 7/7 surfaces, clean console');
    }
  }
}

main();
