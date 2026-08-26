/**
 * Hail01 PR1 live verify via Chrome CDP 9480. Vite 5180.
 * Does not edit src. Kills only this Chrome tree.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5180/';
const CDP_PORT = 9480;
const PROFILE = join(here, 'chrome-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    try { child.kill(); } catch {}
  }
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
        const t = msg.params?.type || 'log';
        const text = (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        this.console.push({ type: t, text, ts: Date.now() });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params?.exceptionDetails?.exception?.description
          || msg.params?.exceptionDetails?.text
          || 'exception';
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
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval');
    }
    return r?.result?.value;
  }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    await writeFile(path, Buffer.from(r.data, 'base64'));
    say('SHOT', path);
  }
  close() { try { this.ws.close(); } catch {} }
}

const INSPECT = `(() => {
  const ctx = window.__ctx;
  const hailBtn = [...document.querySelectorAll('button')].find((b) =>
    /^\\[1\\]/.test((b.textContent || '').trim()));
  let hailRootDisplay = null;
  if (hailBtn) {
    let r = hailBtn.parentElement;
    while (r && r !== document.body && r.parentElement !== document.body) r = r.parentElement;
    hailRootDisplay = r ? (r.style && r.style.display) : null;
  }
  const toasts = [...document.querySelectorAll('.rw-toast')].map((el) => el.textContent || '');
  const hailText = hailBtn && hailBtn.parentElement ? (hailBtn.parentElement.textContent || '') : '';
  const homeRow = document.querySelector('.rw-pos-home');
  return {
    href: location.href,
    hasCtx: !!ctx,
    origin: ctx && ctx.world && ctx.world.origin,
    sys: ctx && ctx.world && ctx.world.currentSystem,
    paused: !!(ctx && ctx.flags && ctx.flags.paused),
    docked: !!(ctx && ctx.flags && ctx.flags.docked),
    hailOpen: !!(ctx && ctx.flags && ctx.flags.hailOpen),
    credits: ctx && ctx.world && ctx.world.credits,
    time: ctx && ctx.world && ctx.world.time,
    hailRootDisplay,
    hailText: hailText.slice(0, 400),
    toasts,
    homeExists: !!homeRow,
    homeText: homeRow ? (homeRow.textContent || '') : '',
    homeHidden: !homeRow || homeRow.classList.contains('is-hidden'),
    shipCount: ctx && ctx.ships ? ctx.ships.length : 0,
  };
})()`;

const PREP = `(() => {
  const ctx = window.__ctx;
  if (!ctx) return { ok: false, reason: 'no-ctx' };
  try { if (ctx.flags) ctx.flags.paused = false; } catch {}
  try { if (ctx.flags) ctx.flags.chartOpen = false; } catch {}
  try { if (ctx.flags) ctx.flags.berthOpen = false; } catch {}
  if (ctx.player) {
    ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
    ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
  }
  return { ok: true, docked: !!(ctx.flags && ctx.flags.docked) };
})()`;

async function main() {
  await mkdir(PROFILE, { recursive: true });
  const results = {
    port: 5180,
    cdp: CDP_PORT,
    boot: null,
    flows: {},
    npcProof: {},
    consoleErrors: [],
    hailJsErrors: [],
    exceptions: [],
  };
  let chrome = null;
  let cdp = null;
  const chromeErr = [];

  try {
    const viteOk = await fetch(APP).then((r) => r.ok).catch(() => false);
    if (!viteOk) throw new Error('vite 5180 not serving');

    chrome = spawn(CHROME, [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${PROFILE}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-popup-blocking',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-extensions',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--headless=new',
      '--hide-crash-restore-bubble',
      '--disable-session-crashed-bubble',
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    chrome.stderr.on('data', (b) => chromeErr.push(String(b)));
    say('CHROME pid', chrome.pid);

    let browserWs = null;
    for (let i = 0; i < 50; i++) {
      try {
        const ver = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (ver.ok) {
          const info = await ver.json();
          browserWs = info.webSocketDebuggerUrl;
          if (browserWs) break;
        }
      } catch {}
      await sleep(200);
    }
    if (!browserWs) throw new Error('CDP not ready: ' + chromeErr.join('').slice(0, 400));

    cdp = new Cdp(browserWs);
    await cdp.ready();
    await cdp.send('Target.setDiscoverTargets', { discover: true });
    const created = await cdp.send('Target.createTarget', { url: APP });
    const targetId = created.targetId;
    cdp.close();
    let pageWs = null;
    for (let i = 0; i < 40; i++) {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && String(t.url || '').includes('5180'));
      if (page && page.webSocketDebuggerUrl) {
        pageWs = page.webSocketDebuggerUrl;
        break;
      }
      await sleep(200);
    }
    if (!pageWs) {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) pageWs = page.webSocketDebuggerUrl;
    }
    if (!pageWs) throw new Error('page ws missing');
    cdp = new Cdp(pageWs);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.bringToFront');

    async function waitBoot(ms = 25000) {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        last = await cdp.eval(`({
          href: location.href,
          ctx: !!window.__ctx,
          title: !!document.getElementById('rw-title'),
          newBtn: !!document.getElementById('rw-title-new'),
          originText: (document.body && document.body.innerText || '').includes('who are you'),
          canvas: document.querySelectorAll('canvas').length,
        })`);
        if (last && (last.ctx || last.title || last.originText)) return last;
        await sleep(300);
      }
      return last;
    }

    let boot = await waitBoot();
    say('boot', JSON.stringify(boot));
    await cdp.eval(`(() => {
      try { localStorage.removeItem('rimward-save-v1'); } catch {}
      try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
      location.reload();
      return true;
    })()`);
    await sleep(1000);
    boot = await waitBoot();
    say('boot2', JSON.stringify(boot));
    if (!boot || boot.href === 'chrome-error://chromewebdata/' || (!boot.ctx && !boot.title && !boot.originText)) {
      throw new Error('page did not boot: ' + JSON.stringify(boot));
    }

    for (let i = 0; i < 4; i++) {
      const click = await cdp.eval(`(() => {
        const originRow = [...document.querySelectorAll('div')].find((el) =>
          (el.textContent || '').startsWith('[1] Freehold Greenhand'));
        if (originRow) { originRow.click(); return 'origin-click'; }
        const neu = document.getElementById('rw-title-new') || document.querySelector('[data-title-action="new"]');
        if (neu) { neu.click(); return 'new-click'; }
        return 'none';
      })()`);
      say('click', click);
      await sleep(700);
      const flight = await cdp.eval(INSPECT);
      if (flight && flight.hasCtx) break;
    }

    const tFly = Date.now();
    let flight = null;
    while (Date.now() - tFly < 20000) {
      flight = await cdp.eval(INSPECT);
      if (flight && flight.hasCtx) break;
      await sleep(300);
    }
    say('flight', JSON.stringify({ hasCtx: flight && flight.hasCtx, docked: flight && flight.docked, origin: flight && flight.origin }));
    results.boot = flight;

    if (flight && flight.docked) {
      await cdp.eval(`(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit8', key: '8', bubbles: true }));
        return true;
      })()`);
      await sleep(600);
    }
    await cdp.eval(PREP);
    await sleep(200);
    {
      const tShips = Date.now();
      while (Date.now() - tShips < 8000) {
        const n = await cdp.eval(`(window.__ctx && window.__ctx.ships && window.__ctx.ships.length) || 0`);
        if (n > 0) break;
        await sleep(250);
      }
    }

    async function waitInspect(pred, ms = 4000) {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        last = await cdp.eval(INSPECT);
        if (pred(last)) return last;
        await sleep(120);
      }
      return last;
    }

    const spawnDemand = `async (tag, n) => {
      const ctx = window.__ctx;
      if (!ctx) return { ok: false, reason: 'no-ctx' };
      if (ctx.flags) ctx.flags.docked = false;
      try { ctx.emit('hailClosed', { demandHail: true, demandOutcome: 'voided', speaker: 'Vane Rook', demand: 80 }); } catch {}
      const { spawnLiveShip } = await import('/src/systems/npc.js');
      const pos = ctx.ship.object.position.clone();
      pos.x += 90;
      const tries = [
        { faction: 'independent', classKey: 'cutter', role: 'trader' },
        { faction: 'redledger', classKey: 'cutter', role: 'trader' },
        { faction: 'independent', classKey: 'freighter', role: 'trader' },
        { faction: 'freehold', classKey: 'cutter', role: 'trader' },
        { faction: 'redledger', classKey: 'cutter', role: 'pirate' },
      ];
      let live = null;
      let used = null;
      for (const t of tries) {
        const rec = {
          id: 'w127-' + tag + '-' + Date.now() + '-' + t.faction,
          name: 'Vane Rook',
          classKey: t.classKey,
          faction: t.faction,
          role: t.role,
          resolve: 50,
          personality: 95,
          alwaysHuntsPlayer: true,
          pilot: 'Vane Rook',
        };
        live = spawnLiveShip(ctx, rec, pos);
        if (live) { used = t; break; }
      }
      let cloned = false;
      if (!live) {
        const src = (ctx.ships || []).find((s) => s && s.state && s.object && s.ai);
        if (!src) return { ok: false, reason: 'no-src', shipCount: (ctx.ships || []).length };
        live = src;
        cloned = true;
        used = { cloned: true, id: src.id, role: src.role };
        if (!live.record) live.record = {};
        live.record.pilot = 'Vane Rook';
        live.record.role = 'pirate';
        if (live.state) live.state.name = 'Vane Rook';
      } else {
        live._w127owned = true;
        ctx.ships.push(live);
      }
      const now = ctx.world.time;
      const demand = Number.isFinite(n) ? n : 80;
      live.role = 'pirate';
      live.ai.role = 'pirate';
      live.ai.mode = 'hunt';
      live.ai.target = 'player';
      live.ai.intent = true;
      live.ai.demandSent = true;
      live.ai.demanding = true;
      live.ai.demandOutcome = null;
      live.ai.demandPeaceAt = now;
      live.ai.demandExpiresAt = now + 20;
      live.ai.demandAmount = demand;
      live.ai.calmUntil = 0;
      if (live.state) { live.state.destroyed = false; live.state.disabled = false; }
      ctx.world.credits = 500;
      ctx.emit('hailOpened', {
        ship: live,
        intents: ['payTribute', 'showTeeth', 'refuseFight'],
        line: 'Your cargo or your hull.',
        demand,
        demandHail: true,
        speaker: 'Vane Rook',
        demandExpiresAt: live.ai.demandExpiresAt,
        t: 20,
      });
      window.__w127live = live;
      return { ok: true, id: live.id, demand, credits: ctx.world.credits, speaker: 'Vane Rook', used, cloned };
    }`;

    const dropLive = `(() => {
      const ctx = window.__ctx;
      const live = window.__w127live;
      if (ctx && live && live._w127owned && Array.isArray(ctx.ships)) {
        const i = ctx.ships.indexOf(live);
        if (i >= 0) ctx.ships.splice(i, 1);
        try {
          if (live.object && ctx.scene) ctx.scene.remove(live.object);
        } catch {}
      }
      if (live && live.ai) {
        live.ai.demanding = false;
        live.ai.demandExpiresAt = 0;
      }
      window.__w127live = null;
      return true;
    })()`;

    // 1 demand card
    let spawned = await cdp.eval(`(${spawnDemand})('card', 80)`);
    say('spawn-card', JSON.stringify(spawned));
    let snap = spawned && spawned.ok
      ? await waitInspect((s) => s && s.hailOpen && /heaves to/.test(s.hailText), 5000)
      : await cdp.eval(INSPECT);
    results.flows.demandCard = {
      spawn: spawned,
      hailOpen: snap && snap.hailOpen,
      hailText: snap && snap.hailText,
      named: !!(snap && /Vane Rook/.test(snap.hailText)),
      timer: !!(snap && /\\ds\\./.test(snap.hailText) && /heaves to/.test(snap.hailText)),
      pay: !!(snap && /Pay tribute/.test(snap.hailText)),
      teeth: !!(snap && /Show teeth/.test(snap.hailText)),
      refuse: !!(snap && /Refuse/.test(snap.hailText)),
      announce: snap && snap.toasts && snap.toasts.find((t) => t.includes('heave to')),
    };
    await cdp.screenshot(join(here, '01-demand-card.png'));

    // 2 announce toast (may already be in snap)
    results.flows.announce = {
      toasts: snap && snap.toasts,
      named: !!(snap && snap.toasts && snap.toasts.some((t) => t.includes('Vane Rook') && t.includes('heave to'))),
    };

    // 3 refuse Digit3
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', key: '3', bubbles: true }));
      return true;
    })()`);
    snap = await waitInspect((s) => s && s.toasts && s.toasts.some((t) => t.includes('demand refused')), 4000);
    const demandingAfterRefuse = await cdp.eval(`(() => {
      const live = window.__w127live;
      return live && live.ai ? { demanding: live.ai.demanding, outcome: live.ai.demandOutcome } : null;
    })()`);
    results.flows.refused = {
      hailOpen: snap && snap.hailOpen,
      toasts: snap && snap.toasts,
      toast: !!(snap && snap.toasts && snap.toasts.some((t) => t.includes('Vane Rook') && t.includes('demand refused. They fire.'))),
      demanding: demandingAfterRefuse,
    };
    await cdp.screenshot(join(here, '02-refused.png'));
    await cdp.eval(dropLive);

    // 4 pay Digit1
    spawned = await cdp.eval(`(${spawnDemand})('pay', 80)`);
    say('spawn-pay', JSON.stringify(spawned));
    snap = spawned && spawned.ok ? await waitInspect((s) => s && s.hailOpen, 4000) : await cdp.eval(INSPECT);
    const creditsBefore = snap && snap.credits;
    await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }));
      return true;
    })()`);
    snap = await waitInspect((s) => s && s.toasts && s.toasts.some((t) => t.includes('tribute taken')), 4000);
    const payAi = await cdp.eval(`(() => {
      const live = window.__w127live;
      const ctx = window.__ctx;
      return {
        demanding: live && live.ai && live.ai.demanding,
        outcome: live && live.ai && live.ai.demandOutcome,
        credits: ctx && ctx.world && ctx.world.credits,
      };
    })()`);
    results.flows.paid = {
      creditsBefore,
      after: payAi,
      delta: (creditsBefore != null && payAi && payAi.credits != null) ? creditsBefore - payAi.credits : null,
      toast: !!(snap && snap.toasts && snap.toasts.some((t) => t.includes('tribute taken. They run.'))),
      hailOpen: snap && snap.hailOpen,
    };
    await cdp.screenshot(join(here, '03-paid.png'));
    await cdp.eval(dropLive);

    // 5 dock
    spawned = await cdp.eval(`(${spawnDemand})('dock', 80)`);
    say('spawn-dock', JSON.stringify(spawned));
    snap = spawned && spawned.ok ? await waitInspect((s) => s && s.hailOpen, 4000) : await cdp.eval(INSPECT);
    await cdp.eval(`(() => { const ctx = window.__ctx; if (ctx && ctx.flags) ctx.flags.docked = true; return true; })()`);
    snap = await waitInspect((s) => s && s.toasts && s.toasts.some((t) => t.includes('demand broken')), 4000);
    const dockAi = await cdp.eval(`(() => {
      const live = window.__w127live;
      return live && live.ai ? { demanding: live.ai.demanding, outcome: live.ai.demandOutcome } : null;
    })()`);
    results.flows.docked = {
      hailOpen: snap && snap.hailOpen,
      toasts: snap && snap.toasts,
      toast: !!(snap && snap.toasts && snap.toasts.some((t) => t.includes('demand broken. You docked.'))),
      ai: dockAi,
    };
    await cdp.screenshot(join(here, '04-docked.png'));
    await cdp.eval(`(() => { const ctx = window.__ctx; if (ctx && ctx.flags) ctx.flags.docked = false; return true; })()`);
    await cdp.eval(dropLive);
    await sleep(200);

    // 6 jump via systemLoaded + empty-ships proof
    spawned = await cdp.eval(`(${spawnDemand})('jump', 80)`);
    say('spawn-jump', JSON.stringify(spawned));
    snap = spawned && spawned.ok ? await waitInspect((s) => s && s.hailOpen, 4000) : await cdp.eval(INSPECT);
    const jumpRes = await cdp.eval(`(() => {
      const ctx = window.__ctx;
      const kept = ctx.ships.slice();
      ctx.emit('systemLoaded', { to: ctx.world.currentSystem });
      return { kept: kept.length };
    })()`);
    snap = await waitInspect((s) => s && s.toasts && s.toasts.some((t) => t.includes('demand dropped')), 4000);
    const jumpAi = await cdp.eval(`(() => {
      const live = window.__w127live;
      return live && live.ai ? { demanding: live.ai.demanding, outcome: live.ai.demandOutcome } : null;
    })()`);
    results.flows.jumped = {
      emit: jumpRes,
      hailOpen: snap && snap.hailOpen,
      toasts: snap && snap.toasts,
      toast: !!(snap && snap.toasts && snap.toasts.some((t) => t.includes('demand dropped. You jumped.'))),
      ai: jumpAi,
    };
    await cdp.screenshot(join(here, '05-jumped.png'));
    await cdp.eval(dropLive);

    // 7 expire — set demandExpiresAt in the past
    spawned = await cdp.eval(`(${spawnDemand})('exp', 80)`);
    say('spawn-exp', JSON.stringify(spawned));
    snap = spawned && spawned.ok ? await waitInspect((s) => s && s.hailOpen, 4000) : await cdp.eval(INSPECT);
    await cdp.eval(`(() => {
      const live = window.__w127live;
      const ctx = window.__ctx;
      if (live && live.ai) live.ai.demandExpiresAt = ctx.world.time - 1;
      return live && live.ai && live.ai.demandExpiresAt;
    })()`);
    snap = await waitInspect((s) => s && s.toasts && s.toasts.some((t) => t.includes('demand expired')), 5000);
    const expAi = await cdp.eval(`(() => {
      const live = window.__w127live;
      return live && live.ai ? { demanding: live.ai.demanding, outcome: live.ai.demandOutcome } : null;
    })()`);
    results.flows.expired = {
      hailOpen: snap && snap.hailOpen,
      toasts: snap && snap.toasts,
      toast: !!(snap && snap.toasts && snap.toasts.some((t) => t.includes('demand expired. They fire.'))),
      ai: expAi,
    };
    await cdp.screenshot(join(here, '06-expired.png'));
    await cdp.eval(dropLive);

    // npc.js proofs without open card (expire/dock/jump/heave)
    results.npcProof = await cdp.eval(`(async () => {
      const ctx = window.__ctx;
      const { spawnLiveShip } = await import('/src/systems/npc.js');
      const out = {};
      function posOff(dx) {
        const p = ctx.ship.object.position.clone();
        p.x += dx;
        return p;
      }
      function rec(tag, role) {
        return {
          id: 'w127-npc-' + tag + '-' + Date.now(),
          name: 'Vane Rook',
          classKey: 'cutter',
          faction: 'independent',
          role: role || 'trader',
          resolve: 50,
          personality: 95,
          alwaysHuntsPlayer: true,
          pilot: 'Vane Rook',
        };
      }
      function spawnOrClone(tag, role) {
        let live = spawnLiveShip(ctx, rec(tag, role === 'ace' ? 'trader' : (role || 'trader')), posOff(110));
        if (!live) {
          live = spawnLiveShip(ctx, rec(tag + 'f', 'trader'), posOff(115));
        }
        if (!live) {
          const src = (ctx.ships || []).find((s) => s && s.state && s.object && s.ai);
          if (!src) return null;
          live = src;
          live._w127cloned = true;
        } else {
          live._w127owned = true;
          ctx.ships.push(live);
        }
        return live;
      }
      function waitFrames(n) {
        return new Promise((res) => {
          let i = 0;
          const step = () => { i++; if (i >= n) res(); else requestAnimationFrame(step); };
          requestAnimationFrame(step);
        });
      }

      const pExp = spawnOrClone('expire', 'trader');
      if (pExp) {
        pExp.ai.demanding = true;
        pExp.ai.demandAmount = 80;
        pExp.ai.demandPeaceAt = ctx.world.time;
        pExp.ai.demandExpiresAt = ctx.world.time - 1;
        pExp.ai.demandSent = true;
        pExp.ai.target = 'player';
        pExp.ai.role = 'pirate';
        await waitFrames(8);
        out.expire = {
          demanding: pExp.ai.demanding,
          outcome: pExp.ai.demandOutcome,
          last: (ctx.lastEvents || []).filter((e) => e && e.type === 'hailClosed').map((e) => e.demandOutcome),
        };
        if (pExp._w127owned) { const i = ctx.ships.indexOf(pExp); if (i >= 0) ctx.ships.splice(i, 1); }
      } else out.expire = { spawn: null };

      const pDock = spawnOrClone('dock', 'trader');
      if (pDock) {
        pDock.ai.demanding = true;
        pDock.ai.demandAmount = 80;
        pDock.ai.demandPeaceAt = ctx.world.time;
        pDock.ai.demandExpiresAt = ctx.world.time + 20;
        pDock.ai.demandSent = true;
        const savedDock = ctx.flags.docked;
        ctx.flags.docked = true;
        await waitFrames(8);
        out.dock = {
          demanding: pDock.ai.demanding,
          outcome: pDock.ai.demandOutcome,
        };
        ctx.flags.docked = savedDock;
        if (pDock._w127owned) { const i = ctx.ships.indexOf(pDock); if (i >= 0) ctx.ships.splice(i, 1); }
      } else out.dock = { spawn: null };

      const pJump = spawnOrClone('jump', 'trader');
      if (pJump) {
        pJump.ai.demanding = true;
        pJump.ai.demandAmount = 80;
        pJump.ai.demandPeaceAt = ctx.world.time;
        pJump.ai.demandExpiresAt = ctx.world.time + 20;
        ctx.emit('hailOpened', {
          ship: pJump, intents: ['payTribute', 'refuseFight'], demand: 80,
          demandHail: true, speaker: 'Vane Rook', t: 20,
        });
        await waitFrames(4);
        ctx.emit('systemLoaded', { to: ctx.world.currentSystem });
        await waitFrames(6);
        out.jump = {
          demanding: pJump.ai.demanding,
          outcome: pJump.ai.demandOutcome,
          hailOpen: !!(ctx.flags && ctx.flags.hailOpen),
        };
        if (pJump._w127owned) { const i = ctx.ships.indexOf(pJump); if (i >= 0) ctx.ships.splice(i, 1); }
      } else out.jump = { spawn: null };

      const pHeave = spawnOrClone('heave', 'trader');
      if (pHeave) {
        pHeave.ai.role = 'pirate';
        pHeave.ai.mode = 'hunt';
        pHeave.ai.target = 'player';
        pHeave.ai.intent = true;
        pHeave.ai.phase = 'telegraph';
        pHeave.ai.phaseStart = ctx.world.time;
        pHeave.ai.commSent = false;
        pHeave.ai.demanding = false;
        pHeave.ai.demandSent = false;
        const before = (ctx.lastEvents || []).slice();
        await waitFrames(12);
        const evs = (ctx.lastEvents || []).concat(ctx.events || []);
        out.heave = {
          commSent: pHeave.ai.commSent,
          heaveTo: evs.some((e) => e && e.type === 'commLine' && e.text === 'Heave to. Cargo or hull.'),
          hailOpened: evs.some((e) => e && e.type === 'hailOpened' && e.ship === pHeave),
        };
        if (pHeave._w127owned) { const i = ctx.ships.indexOf(pHeave); if (i >= 0) ctx.ships.splice(i, 1); }
        void before;
      } else out.heave = { spawn: null };

      const pAce = spawnOrClone('ace', 'ace');
      if (pAce) {
        pAce.ai.role = 'ace';
        pAce.role = 'ace';
        if (pAce.record) pAce.record.role = 'ace';
        pAce.ai.mode = 'duel';
        pAce.ai.demandSent = false;
        pAce.ai.demanding = false;
        pAce.ai.phase = 'telegraph';
        pAce.ai.phaseStart = ctx.world.time;
        pAce.ai.commSent = false;
        pAce.ai.target = 'player';
        pAce.ai.intent = true;
        await waitFrames(16);
        const evs = (ctx.lastEvents || []).concat(ctx.events || []);
        out.ace = {
          commSent: pAce.ai.commSent,
          payTribute: evs.some((e) => e && e.type === 'hailOpened' && e.intents && e.intents.includes('payTribute')),
          runLine: evs.some((e) => e && e.type === 'commLine' && typeof e.text === 'string' && e.text.includes('Run if you like')),
          hailOpened: evs.filter((e) => e && e.type === 'hailOpened').map((e) => e.intents),
        };
        if (pAce._w127owned) { const i = ctx.ships.indexOf(pAce); if (i >= 0) ctx.ships.splice(i, 1); }
        window.__w127ace = pAce;
      } else out.ace = { spawn: null };

      return out;
    })()`, 60000);
    say('npcProof', JSON.stringify(results.npcProof));
    await cdp.screenshot(join(here, '07-ace-no-tribute.png'));

    // 8 HUD-06 home chrome undocked
    await cdp.eval(`(() => {
      const ctx = window.__ctx;
      if (ctx && ctx.flags) ctx.flags.docked = false;
      if (ctx && ctx.flags) ctx.flags.hailOpen = false;
      return true;
    })()`);
    await sleep(500);
    snap = await cdp.eval(INSPECT);
    results.flows.home = {
      docked: snap && snap.docked,
      homeExists: snap && snap.homeExists,
      homeText: snap && snap.homeText,
      homeHidden: snap && snap.homeHidden,
    };
    await cdp.screenshot(join(here, '08-home-still.png'));

    results.exceptions = cdp.exceptions.slice();
    results.consoleErrors = cdp.console.filter((c) => c.type === 'error' || c.type === 'warning')
      .map((c) => ({ type: c.type, text: String(c.text).slice(0, 400) }));
    results.hailJsErrors = results.consoleErrors.filter((c) => /hail\\.js/i.test(c.text));
    results.consoleAll = cdp.console.map((c) => ({ type: c.type, text: String(c.text).slice(0, 400) }));

    await writeFile(join(here, 'live-results.json'), JSON.stringify(results, null, 2));
    const cons = [
      'exceptions:',
      ...results.exceptions,
      '',
      'console:',
      ...cdp.console.map((c) => c.type + ' ' + String(c.text).slice(0, 500)),
      '',
      'log:',
      ...log,
    ].join('\\n');
    await writeFile(join(here, 'console.txt'), cons);
    say('WROTE live-results.json');
  } catch (err) {
    say('FAIL', err && err.stack ? err.stack : String(err));
    try {
      await writeFile(join(here, 'live-results.json'), JSON.stringify({ error: String(err), log }, null, 2));
      await writeFile(join(here, 'console.txt'), log.concat([String(err)]).join('\\n'));
    } catch {}
    throw err;
  } finally {
    if (cdp) cdp.close();
    killTree(chrome);
    await sleep(400);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
