/**
 * Issue #337 — dev-only perf instrumentation (system scale/population Phase 0).
 *
 * Opt-in with `?perf=1`. When the flag is absent this module creates no DOM,
 * sets no ctx field, and main.js takes the original unwrapped update path, so
 * a normal session pays nothing. Session-only: nothing here is persisted and
 * no HUD key, aim-glass digit, tuning value or save field changes.
 *
 * Measurement surfaces (the gate for later system-scale/population phases):
 * - frame-time ring: p50/p95/p99 of the real animation-loop cadence, sampled
 *   from the same loop that renders (systems + render included);
 * - renderer.info draw calls/triangles/points/lines/geometries/textures;
 * - live NPCs by tier: near <= U.INSTANTIATE_RANGE, mid <= 2500 u, far beyond.
 *   Phase 0 has no mid/far proxies yet; the fields are forward-compatible;
 * - abstract records: the current bank plus every generated record bank;
 * - asteroid matrix writes per frame, published by asteroids.js;
 * - CPU per subsystem, collected by main.js calling runSystem() only when on;
 * - memory: renderer.info.memory plus Chrome's performance.memory heap.
 *
 * F3 is a dev-only visibility toggle (F1–F12 are reserved in bindings.js and
 * are not player-bindable), not a new player key. The machine-readable form is
 * `window.__ctx.perf.snapshot()`, consumed by scripts/issue-337-perf-live-probe.mjs.
 */
import { U } from '../game/state.js';

const OVERLAY_ID = 'perf-overlay';
const FRAME_RING = 600; // 10 s at 60 fps
const STATS_WINDOW = 300; // 5 s at 60 fps
const CPU_WINDOW = 180; // 3 s at 60 fps
const TEXT_INTERVAL_MS = 200; // 5 Hz overlay refresh
const NEAR_RANGE = U.INSTANTIATE_RANGE;
const MID_RANGE = 2500; // Phase 2 mid-tier boundary; no live mid proxies yet
const CPU_TOP = 6;
const MB = 1048576;

/** Same robust query parse as agent-api.js: no throw, no location, no opt-in. */
function perfOptIn() {
  try {
    const loc = typeof globalThis !== 'undefined' ? globalThis.location : null;
    if (!loc) return false;
    let search = '';
    if (typeof loc.search === 'string' && loc.search) search = loc.search;
    else if (typeof loc.href === 'string') {
      const href = loc.href;
      const q = href.indexOf('?');
      if (q >= 0) {
        const hash = href.indexOf('#', q);
        search = hash >= 0 ? href.slice(q, hash) : href.slice(q);
      }
    }
    if (!search) return false;
    const raw = search.charAt(0) === '?' ? search.slice(1) : search;
    return new URLSearchParams(raw).get('perf') === '1';
  } catch {
    return false;
  }
}

function percentile(sorted, pct) {
  const n = sorted.length;
  if (n === 0) return 0;
  const rank = Math.ceil((pct / 100) * n) - 1;
  return sorted[Math.min(n - 1, Math.max(0, rank))];
}

function round3(v) {
  return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0;
}

function fmt(v) {
  return Number.isFinite(v) ? v.toFixed(1) : '0.0';
}

function sum(values) {
  let total = 0;
  for (let i = 0; i < values.length; i++) total += values[i];
  return total;
}

export function initPerf(ctx) {
  if (!perfOptIn()) return {};

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText =
    'position:fixed;top:8px;left:8px;z-index:70;pointer-events:none;' +
    'padding:7px 9px;background:rgba(0,8,12,.78);border:1px solid rgba(111,242,224,.4);' +
    'color:#9ff2e6;font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre;' +
    'text-shadow:0 1px 2px rgba(0,0,0,.8);';
  overlay.textContent = 'RIMWARD PERF — warming up';
  document.body.appendChild(overlay);

  const perf = {
    enabled: true,
    visible: true,
    metrics: { asteroidMatrixWrites: 0 },
    snapshot,
    setVisible,
    runSystem,
    beginRender,
    endRender,
  };

  const frameRing = new Float32Array(FRAME_RING);
  let frameHead = 0;
  let frameCount = 0;
  let frameLast = 0;
  let firstFrame = true;
  let lastFrameAt = 0;
  let lastTextAt = 0;
  let renderStartedAt = 0;
  let renderMs = 0;
  const cpuByName = new Map();

  function pushFrame(ms) {
    frameRing[frameHead] = ms;
    frameHead = (frameHead + 1) % FRAME_RING;
    frameCount += 1;
    frameLast = ms;
  }

  function frameStats() {
    const n = Math.min(frameCount, STATS_WINDOW);
    if (n === 0) {
      return { samples: 0, window: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0, last: 0 };
    }
    const arr = new Array(n);
    const start = (frameHead - n + FRAME_RING) % FRAME_RING;
    for (let i = 0; i < n; i++) arr[i] = frameRing[(start + i) % FRAME_RING];
    arr.sort((a, b) => a - b);
    return {
      samples: frameCount,
      window: n,
      p50: round3(percentile(arr, 50)),
      p95: round3(percentile(arr, 95)),
      p99: round3(percentile(arr, 99)),
      min: round3(arr[0]),
      max: round3(arr[n - 1]),
      avg: round3(sum(arr) / n),
      last: round3(frameLast),
    };
  }

  function recordCpu(name, ms) {
    if (typeof name !== 'string' || !Number.isFinite(ms)) return;
    let rec = cpuByName.get(name);
    if (!rec) {
      rec = { ring: new Float32Array(CPU_WINDOW), head: 0, count: 0 };
      cpuByName.set(name, rec);
    }
    rec.ring[rec.head] = ms;
    rec.head = (rec.head + 1) % CPU_WINDOW;
    rec.count += 1;
  }

  function cpuStats() {
    const systems = [];
    for (const [name, rec] of cpuByName) {
      const n = Math.min(rec.count, CPU_WINDOW);
      const arr = new Array(n);
      const start = (rec.head - n + CPU_WINDOW) % CPU_WINDOW;
      for (let i = 0; i < n; i++) arr[i] = rec.ring[(start + i) % CPU_WINDOW];
      arr.sort((a, b) => a - b);
      systems.push({
        name,
        avgMs: round3(sum(arr) / n),
        p95Ms: round3(percentile(arr, 95)),
        maxMs: round3(arr[n - 1]),
        samples: rec.count,
      });
    }
    systems.sort((a, b) => b.avgMs - a.avgMs);
    return { systems, renderMs: round3(renderMs), frameMs: round3(frameLast) };
  }

  function rendererStats() {
    const info = ctx.renderer && ctx.renderer.info;
    const render = (info && info.render) || {};
    const memory = (info && info.memory) || {};
    return {
      calls: Number(render.calls) || 0,
      triangles: Number(render.triangles) || 0,
      points: Number(render.points) || 0,
      lines: Number(render.lines) || 0,
      geometries: Number(memory.geometries) || 0,
      textures: Number(memory.textures) || 0,
    };
  }

  function memoryStats() {
    const r = rendererStats();
    let jsHeapUsedBytes = null;
    try {
      const m = performance.memory;
      if (m && Number.isFinite(m.usedJSHeapSize)) jsHeapUsedBytes = m.usedJSHeapSize;
    } catch {
      jsHeapUsedBytes = null;
    }
    return { geometries: r.geometries, textures: r.textures, jsHeapUsedBytes };
  }

  function npcStats() {
    const ships = Array.isArray(ctx.ships) ? ctx.ships : [];
    const player = ctx.ship && ctx.ship.object && ctx.ship.object.position;
    let near = 0;
    let mid = 0;
    let far = 0;
    for (let i = 0; i < ships.length; i++) {
      const obj = ships[i] && ships[i].object;
      if (!obj || !obj.position) continue;
      const d = player ? obj.position.distanceTo(player) : 0;
      if (d <= NEAR_RANGE) near += 1;
      else if (d <= MID_RANGE) mid += 1;
      else far += 1;
    }
    const banks = ctx.world && ctx.world.recordBanks;
    let recordsGalaxy = 0;
    if (banks && typeof banks === 'object') {
      for (const key in banks) {
        const bank = banks[key];
        if (Array.isArray(bank)) recordsGalaxy += bank.length;
      }
    }
    const recordsCurrent = ctx.world && Array.isArray(ctx.world.records) ? ctx.world.records.length : 0;
    return { live: ships.length, near, mid, far, recordsCurrent, recordsGalaxy };
  }

  function snapshot() {
    return {
      enabled: true,
      visible: perf.visible,
      t: Number.isFinite(ctx.elapsed) ? ctx.elapsed : 0,
      frame: frameStats(),
      renderer: rendererStats(),
      npc: npcStats(),
      asteroid: { matrixWrites: perf.metrics.asteroidMatrixWrites },
      cpu: cpuStats(),
      memory: memoryStats(),
    };
  }

  function refreshText() {
    if (!perf.visible) return;
    const f = frameStats();
    const r = rendererStats();
    const n = npcStats();
    const c = cpuStats();
    const m = memoryStats();
    const top = c.systems.filter((s) => s.name !== 'perf').slice(0, CPU_TOP);
    const heap = m.jsHeapUsedBytes === null ? 'n/a' : (m.jsHeapUsedBytes / MB).toFixed(1) + ' MB';
    overlay.textContent = [
      'RIMWARD PERF — F3 hide — t ' + fmt(ctx.elapsed) + ' s',
      'FRAME p50 ' + fmt(f.p50) + ' ms  p95 ' + fmt(f.p95) + ' ms  p99 ' + fmt(f.p99) + ' ms  (n=' + f.window + ')',
      'DRAW CALLS ' + r.calls + '  TRIANGLES ' + r.triangles + '  GEO ' + r.geometries + '  TEX ' + r.textures,
      'LIVE NPC ' + n.live + '  near ' + n.near + '  mid ' + n.mid + '  far ' + n.far,
      'RECORDS current ' + n.recordsCurrent + '  galaxy ' + n.recordsGalaxy,
      'AST MATRIX WRITES ' + perf.metrics.asteroidMatrixWrites,
      'CPU ' + (top.length ? top.map((s) => s.name + ' ' + fmt(s.avgMs)).join('  ') : 'warming up'),
      'RENDER ' + fmt(c.renderMs) + ' ms  MEM js ' + heap,
    ].join('\n');
  }

  function setVisible(visible) {
    perf.visible = visible === true;
    overlay.style.display = perf.visible ? 'block' : 'none';
    if (perf.visible) lastTextAt = 0;
  }

  function runSystem(system, dt, ctxArg) {
    if (!system || typeof system.update !== 'function') return;
    const started = performance.now();
    system.update(dt, ctxArg);
    recordCpu(system.name, performance.now() - started);
  }

  function beginRender() {
    renderStartedAt = performance.now();
  }

  function endRender() {
    if (renderStartedAt > 0) renderMs = performance.now() - renderStartedAt;
  }

  function update() {
    const now = performance.now();
    if (firstFrame) {
      firstFrame = false;
      lastFrameAt = now;
      return;
    }
    const delta = now - lastFrameAt;
    lastFrameAt = now;
    if (delta > 0 && delta <= 60000) pushFrame(delta);
    if (now - lastTextAt >= TEXT_INTERVAL_MS) {
      lastTextAt = now;
      refreshText();
    }
  }

  function onKeyDown(event) {
    if (!event || event.code !== 'F3') return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    setVisible(!perf.visible);
  }

  ctx.perf = perf;
  try {
    window.addEventListener('keydown', onKeyDown, true);
  } catch {
    /* non-browser harness: no toggle key */
  }
  return { update };
}
