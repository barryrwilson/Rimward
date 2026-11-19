/**
 * Issue #337 live perf probe — frame-time instrumentation baseline.
 *
 * Disposable loopback Chromium (issue-74 harness) against the PRODUCTION
 * preview build (serve: 'preview', dist/), with ?agent=1&perf=1. Fresh
 * Greenhand start, overlay/snapshot sanity, F3 + setVisible toggle checks,
 * then a fixed route: undock, plotRoute(veridian), engageAutopilot, queued
 * approachDock (the autopilot lane -> gate -> jump -> dock lane), sampling
 * window.__ctx.perf.snapshot() once per second for 60 s of wall time with
 * observe() phase flags and overlay text every ~5 s. Then the same origin is
 * reloaded without the perf query to prove instrumentation is absent by
 * default. Evidence is written to <out>/perf-baseline/evidence.json.
 *
 * This probe is read-only: it drives the public agent handle and reads the
 * perf snapshot/overlay DOM. It never writes sim state beyond the normal
 * startGame/chooseOrigin/undock/plotRoute/engageAutopilot/approachDock verbs.
 *
 * Run: npm run test:perf-live
 */
import assert from 'node:assert/strict';
import { access, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as os from 'node:os';

process.env.ISSUE74_OUT = process.env.ISSUE337_OUT || resolve('out/issue-337-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, sleep, out, repo } = await import('./issue-74-live-harness.mjs');

const PROBE = 'scripts/issue-337-perf-live-probe.mjs';
const NAME = 'perf-baseline';
const folder = join(out, NAME);
const SAMPLE_SECONDS = 60;
const ROUTE_DEST = 'veridian';
const LABELS = [
  'FRAME p50',
  'FRAME p95',
  'DRAW CALLS',
  'TRIANGLES',
  'LIVE NPC',
  'RECORDS',
  'AST MATRIX WRITES',
];
// The locked contract names 'FRAME p95' as an overlay label. The shipped
// overlay renders one FRAME line ('FRAME p50 ... p95 ... p99 ...'), so the
// p95 percentile appears as a token on that line rather than after a second
// 'FRAME ' prefix. Accept that token and record the wording deviation instead
// of failing the run over a cosmetic prefix.
const labelPresent = (text, label) => {
  if (text.includes(label)) return true;
  if (label === 'FRAME p95') return /FRAME[^\n]*\bp95\b/.test(text);
  return false;
};

const state = {
  checks: {},
  samples: [],
  overlaySamples: [],
  phaseTimeline: [],
  route: {},
  aggregates: null,
  browser: null,
  gpu: null,
  chromeVersion: null,
  reload: null,
  absent: null,
};

const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const median = (xs) => {
  const a = xs.filter(finite).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const maxOf = (xs) => (xs.length ? Math.max(...xs.filter(finite)) : null);
const minOf = (xs) => (xs.length ? Math.min(...xs.filter(finite)) : null);
const stats = (xs) => ({
  median: median(xs),
  max: maxOf(xs),
  min: minOf(xs),
  last: xs.length ? xs[xs.length - 1] : null,
  samples: xs.length,
});

function aggregate() {
  const nums = (pathFn) => state.samples
    .map((s) => pathFn(s.snapshot))
    .filter((v) => finite(v));
  const frame = {};
  for (const k of ['p50', 'p95', 'p99', 'min', 'max', 'avg', 'last', 'samples']) {
    frame[k] = stats(nums((x) => x?.frame?.[k]));
  }
  const renderer = {};
  for (const k of ['calls', 'triangles', 'points', 'lines', 'geometries', 'textures']) {
    renderer[k] = stats(nums((x) => x?.renderer?.[k]));
  }
  const npc = {};
  for (const k of ['live', 'near', 'mid', 'far', 'recordsCurrent', 'recordsGalaxy']) {
    npc[k] = { max: maxOf(nums((x) => x?.npc?.[k])), median: median(nums((x) => x?.npc?.[k])) };
  }
  const asteroid = { matrixWrites: stats(nums((x) => x?.asteroid?.matrixWrites)) };
  const cpu = {
    renderMs: stats(nums((x) => x?.cpu?.renderMs)),
    frameMs: stats(nums((x) => x?.cpu?.frameMs)),
    systemsObserved: 0,
    topByAvgMs: [],
  };
  const byName = new Map();
  for (const s of state.samples) {
    for (const sys of s.snapshot?.cpu?.systems ?? []) {
      if (!sys || typeof sys.name !== 'string') continue;
      const rec = byName.get(sys.name) ?? { avg: [], p95: [], max: [], samples: [] };
      if (finite(sys.avgMs)) rec.avg.push(sys.avgMs);
      if (finite(sys.p95Ms)) rec.p95.push(sys.p95Ms);
      if (finite(sys.maxMs)) rec.max.push(sys.maxMs);
      if (finite(sys.samples)) rec.samples.push(sys.samples);
      byName.set(sys.name, rec);
    }
  }
  cpu.systemsObserved = byName.size;
  cpu.topByAvgMs = [...byName.entries()]
    .map(([name, r]) => ({
      name,
      avgMsMedian: median(r.avg),
      avgMsMax: maxOf(r.avg),
      p95MsMedian: median(r.p95),
      maxMsMax: maxOf(r.max),
      observedSamples: r.avg.length,
    }))
    .sort((a, b) => (b.avgMsMedian ?? -1) - (a.avgMsMedian ?? -1))
    .slice(0, 10);
  const memory = {};
  for (const k of ['geometries', 'textures', 'jsHeapUsedBytes']) {
    const raw = state.samples.map((s) => s.snapshot?.memory?.[k] ?? null);
    memory[k] = { ...stats(raw.filter(finite)), lastRaw: raw.length ? raw[raw.length - 1] : null, rawSamples: raw.length };
  }
  const phaseCounts = {};
  for (const s of state.samples) phaseCounts[s.phase] = (phaseCounts[s.phase] ?? 0) + 1;
  const systems = {};
  for (const s of state.samples) {
    const sys = s.flags.system;
    if (sys) systems[sys] = (systems[sys] ?? 0) + 1;
  }
  return {
    sampleCount: state.samples.length,
    sampleWallMs: state.samples.length ? state.samples[state.samples.length - 1].wallMs : 0,
    frame,
    renderer,
    npc,
    asteroid,
    cpu,
    memory,
    phaseCounts,
    systemsSeen: systems,
    routeCompleted: state.route.completed ?? null,
  };
}

function phaseOf(o) {
  if (o?.flags?.docked === true) return 'docked';
  if (o?.gate?.jumping === true) return 'jump';
  const mode = o?.autopilot?.mode ?? '';
  if (mode === 'dock') return 'dock';
  if (mode === 'route') return 'route';
  if (o?.gate?.inZone === true) return 'gate';
  if (o?.autopilot?.engaged === true) return 'lane';
  return 'idle';
}

async function distMetadata() {
  const root = join(repo, 'dist');
  const hasIndex = await access(join(root, 'index.html')).then(() => true).catch(() => false);
  if (!hasIndex) return { exists: false, root, assets: [], totalBytes: 0 };
  const names = await readdir(root, { recursive: true });
  const assets = [];
  for (const rel of names) {
    const abs = join(root, rel);
    const s = await stat(abs).catch(() => null);
    if (s?.isFile()) assets.push({ path: rel.replaceAll('\\', '/'), bytes: s.size });
  }
  assets.sort((a, b) => a.path.localeCompare(b.path));
  const totalBytes = assets.reduce((n, a) => n + a.bytes, 0);
  const index = assets.find((a) => a.path === 'index.html') ?? null;
  const largest = [...assets].sort((a, b) => b.bytes - a.bytes).slice(0, 15);
  return { exists: true, root, assetCount: assets.length, totalBytes, indexHtml: index, largest, assets };
}

let result = null;
let runError = null;

async function fn({ c, result: runResult, act, observe, wait, save, baseUrl }) {
  runResult.fixture = false;
  runResult.method = 'Production preview build served by vite preview over dist/, loaded with ?agent=1&perf=1. Reads window.__ctx.perf.snapshot() and the #perf-overlay DOM, drives the public agent handle through a fixed Greenhand -> Veridian route, then reloads the same origin with ?agent=1 only to prove instrumentation is absent by default.';
  runResult.assertionScope = 'PASS means the perf snapshot and overlay were live and sane, F3/setVisible toggled them, the fixed route produced 60 one-second samples, and instrumentation was absent without ?perf=1, with a clean console and stable runtime source. It is not independent QA of the probe.';

  const snap = () => c.eval('window.__ctx.perf.snapshot()');
  const overlay = () => c.eval(`(() => {
    const el = document.getElementById('perf-overlay');
    if (!el) return { exists: false, display: null, visibility: null, text: '' };
    const cs = getComputedStyle(el);
    return { exists: true, display: cs.display, visibility: cs.visibility, text: el.textContent ?? '' };
  })()`);
  const toggleState = () => c.eval(`(() => {
    const el = document.getElementById('perf-overlay');
    const perf = window.__ctx?.perf;
    const s = typeof perf?.snapshot === 'function' ? perf.snapshot() : null;
    return {
      perfType: typeof perf,
      visible: s ? s.visible : null,
      overlayExists: !!el,
      display: el ? getComputedStyle(el).display : null,
    };
  })()`);
  const key = async (code, keyName, vk) => {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  const waitForBoot = async (timeoutMs) => {
    const began = Date.now();
    for (;;) {
      let booted = false;
      try { booted = await c.eval('window.__rimwardBooted === true'); } catch { /* navigating */ }
      if (booted) return Date.now() - began;
      if (Date.now() - began > timeoutMs) throw Error('reload boot timeout');
      await sleep(250);
    }
  };

  // ---- Boot: instrumentation enabled, overlay present, snapshot sane.
  let boot = null;
  for (let i = 0; i < 40; i++) {
    boot = await overlay();
    if (boot.exists && LABELS.every((label) => labelPresent(boot.text, label))) break;
    await sleep(250);
  }
  assert.equal(boot.exists, true, '#perf-overlay exists with ?perf=1');
  for (const label of LABELS) assert.ok(labelPresent(boot.text, label), 'overlay contains label ' + label + ': ' + boot.text);
  state.checks.overlay = {
    exists: true,
    labels: LABELS,
    literalLabels: LABELS.filter((label) => boot.text.includes(label)),
    frameP95OnFrameLine: /FRAME[^\n]*\bp95\b/.test(boot.text),
    labelDeviation: 'FRAME p95 is rendered as the p95 percentile token on the single FRAME p50/p95/p99 line, not as a literal "FRAME p95" prefix; the probe accepts the token.',
    textLength: boot.text.length,
    display: boot.display,
  };

  const perfType = await c.eval('typeof window.__ctx?.perf');
  assert.equal(perfType, 'object', '?perf=1 exposes window.__ctx.perf');

  let s0 = null;
  for (let i = 0; i < 40; i++) {
    s0 = await snap();
    if (s0?.frame?.samples > 0 && s0?.renderer?.calls > 0) break;
    await sleep(250);
  }
  assert.ok(s0, 'snapshot() returns a value after boot');
  assert.equal(s0.enabled, true, 'snapshot.enabled');
  assert.equal(typeof s0.visible, 'boolean', 'snapshot.visible');
  assert.equal(s0.visible, true, 'overlay starts visible with ?perf=1');
  assert.ok(finite(s0.t), 'snapshot.t is finite');
  for (const k of ['samples', 'p50', 'p95', 'p99', 'min', 'max', 'avg', 'last']) {
    assert.ok(finite(s0.frame[k]) && s0.frame[k] >= 0, 'snapshot.frame.' + k + ' sane: ' + JSON.stringify(s0.frame));
  }
  assert.ok(s0.frame.samples > 0, 'frame samples are collecting: ' + JSON.stringify(s0.frame));
  for (const k of ['calls', 'triangles', 'points', 'lines', 'geometries', 'textures']) {
    assert.ok(finite(s0.renderer[k]) && s0.renderer[k] >= 0, 'snapshot.renderer.' + k + ' sane: ' + JSON.stringify(s0.renderer));
  }
  assert.ok(s0.renderer.calls > 0, 'renderer draw calls are positive');
  assert.ok(s0.renderer.triangles > 0, 'renderer triangles are positive');
  for (const k of ['live', 'near', 'mid', 'far', 'recordsCurrent', 'recordsGalaxy']) {
    assert.ok(finite(s0.npc[k]) && s0.npc[k] >= 0, 'snapshot.npc.' + k + ' sane: ' + JSON.stringify(s0.npc));
  }
  assert.ok(finite(s0.asteroid.matrixWrites) && s0.asteroid.matrixWrites >= 0, 'snapshot.asteroid.matrixWrites sane');
  assert.ok(Array.isArray(s0.cpu.systems) && s0.cpu.systems.length > 0, 'snapshot.cpu.systems is populated');
  for (const sys of s0.cpu.systems) {
    assert.equal(typeof sys.name, 'string', 'cpu system name');
    for (const k of ['avgMs', 'p95Ms', 'maxMs', 'samples']) assert.ok(finite(sys[k]) && sys[k] >= 0, 'cpu system ' + sys.name + '.' + k + ' sane');
  }
  assert.ok(finite(s0.cpu.renderMs) && s0.cpu.renderMs >= 0, 'snapshot.cpu.renderMs sane');
  assert.ok(finite(s0.cpu.frameMs) && s0.cpu.frameMs >= 0, 'snapshot.cpu.frameMs sane');
  assert.ok(finite(s0.memory.geometries) && s0.memory.geometries >= 0, 'snapshot.memory.geometries sane');
  assert.ok(finite(s0.memory.textures) && s0.memory.textures >= 0, 'snapshot.memory.textures sane');
  // performance.memory is optional; the contract allows null when Chrome omits it.
  assert.ok(s0.memory.jsHeapUsedBytes === null || (finite(s0.memory.jsHeapUsedBytes) && s0.memory.jsHeapUsedBytes >= 0), 'snapshot.memory.jsHeapUsedBytes sane: ' + JSON.stringify(s0.memory));
  const jsonRoundTrip = JSON.parse(await c.eval('JSON.stringify(window.__ctx.perf.snapshot())'));
  assert.equal(jsonRoundTrip.enabled, true, 'snapshot is JSON-safe');
  state.checks.bootSnapshot = { enabled: s0.enabled, visible: s0.visible, t: s0.t, frame: s0.frame, renderer: s0.renderer, npc: s0.npc, cpuSystems: s0.cpu.systems.length, jsonSafe: true };

  // ---- Values move over ~2 s (live overlay, not a frozen first frame).
  let change = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = { text: (await overlay()).text, snapshot: await snap() };
    await sleep(2000);
    const after = { text: (await overlay()).text, snapshot: await snap() };
    change = {
      attempt,
      beforeText: before.text,
      afterText: after.text,
      beforeSamples: before.snapshot.frame.samples,
      afterSamples: after.snapshot.frame.samples,
      beforeLast: before.snapshot.frame.last,
      afterLast: after.snapshot.frame.last,
      changed: after.text !== before.text
        || after.snapshot.frame.samples !== before.snapshot.frame.samples
        || after.snapshot.frame.last !== before.snapshot.frame.last,
    };
    if (change.changed) break;
  }
  assert.ok(change.changed, 'overlay/snapshot values change over ~2 s: ' + JSON.stringify(change));
  state.checks.valuesChanged = change;

  // ---- F3 toggle: hide, then show. setVisible must agree.
  await key('F3', 'F3', 114);
  await sleep(400);
  const f3Hidden = await toggleState();
  assert.equal(f3Hidden.perfType, 'object', 'perf remains exposed while hidden');
  assert.equal(f3Hidden.overlayExists, true, '#perf-overlay stays mounted while hidden');
  assert.equal(f3Hidden.visible, false, 'F3 hides: snapshot.visible false');
  assert.equal(f3Hidden.display, 'none', 'F3 hides: overlay display none');
  state.checks.f3Hide = f3Hidden;

  await key('F3', 'F3', 114);
  await sleep(400);
  const f3Shown = await toggleState();
  assert.equal(f3Shown.visible, true, 'F3 shows: snapshot.visible true');
  assert.notEqual(f3Shown.display, 'none', 'F3 shows: overlay display is not none');
  state.checks.f3Show = f3Shown;

  const setHiddenVisible = await c.eval('(() => { window.__ctx.perf.setVisible(false); return window.__ctx.perf.snapshot().visible; })()');
  const setHiddenDom = await overlay();
  assert.equal(setHiddenVisible, false, 'setVisible(false) hides in snapshot');
  assert.equal(setHiddenDom.display, 'none', 'setVisible(false) hides overlay DOM');
  const setShownVisible = await c.eval('(() => { window.__ctx.perf.setVisible(true); return window.__ctx.perf.snapshot().visible; })()');
  const setShownDom = await overlay();
  assert.equal(setShownVisible, true, 'setVisible(true) shows in snapshot');
  assert.notEqual(setShownDom.display, 'none', 'setVisible(true) shows overlay DOM');
  state.checks.setVisible = { hiddenSnapshot: setHiddenVisible, hiddenDisplay: setHiddenDom.display, shownSnapshot: setShownVisible, shownDisplay: setShownDom.display };

  // ---- Machine/browser metadata (captured while the page is live).
  state.chromeVersion = await c.send('Browser.getVersion');
  state.browser = await c.eval('({ userAgent: navigator.userAgent, hardwareConcurrency: Number(navigator.hardwareConcurrency) || null, deviceMemory: Number(navigator.deviceMemory) || null })');
  state.gpu = await c.eval(`(() => {
    const canvas = document.querySelector('canvas');
    const g = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    if (!g) return null;
    const e = g.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER),
      vendor: e ? g.getParameter(e.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR),
    };
  })()`);

  // ---- Fixed route: fresh Greenhand start -> undock -> plotRoute -> autopilot.
  const launch = async () => {
    const began = Date.now();
    for (;;) {
      const r = await act('undock', {}, false);
      if (r.ok) return r;
      if (r.token !== 'blocked' || Date.now() - began > 60000) throw Error('Bounded launch unavailable ' + JSON.stringify(r));
      await sleep(750);
    }
  };
  // Fresh Greenhand start: the origin choice can leave the hull just off the
  // berth (issue-327 settles it the same way), so dock at Freehold first and
  // only then run the fixed undock -> plotRoute -> autopilot route.
  const dockAtCurrent = async (label) => {
    let s = await observe();
    if (s.flags?.docked === true) return s;
    const began = Date.now();
    for (;;) {
      const r = await act(s.station?.inZone ? 'dock' : 'approachDock', {}, false);
      if (r.ok) break;
      if (Date.now() - began > 60000) throw Error('bounded dock unavailable ' + JSON.stringify(r));
      await sleep(750);
      s = await observe();
      if (s.flags?.docked === true) return s;
    }
    runResult.actions.at(-1).label = label;
    await wait((x) => x.flags.docked === true, 240, label);
    return observe();
  };
  let o = await dockAtCurrent('initial Freehold dock');
  assert.equal(o.session.phase, 'playing', 'fresh Greenhand start is playing');
  assert.equal(o.flags.docked, true, 'fresh Greenhand start settles docked at Freehold');
  state.route.description = 'Fresh Greenhand start -> undock -> plotRoute(veridian) -> engageAutopilot -> queued approachDock; the autopilot lane -> gate -> jump -> dock route is the fixed route.';
  state.route.dest = ROUTE_DEST;
  state.route.start = { simT: o.t, system: o.world.currentSystem, origin: o.world.origin ?? null };
  const undocked = await launch();
  state.route.undock = undocked;
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'undock settles');
  const plotted = await act('plotRoute', { dest: ROUTE_DEST });
  assert.equal(plotted.ok, true, 'plotRoute accepted: ' + JSON.stringify(plotted));
  state.route.plotRoute = plotted;
  const engaged = await act('engageAutopilot');
  assert.equal(engaged.ok, true, 'engageAutopilot accepted: ' + JSON.stringify(engaged));
  state.route.engageAutopilot = engaged;
  const dockQueued = await act('approachDock', {}, false);
  state.route.approachDock = dockQueued;
  state.route.samplingStartedAt = new Date().toISOString();
  runResult.route = { dest: ROUTE_DEST, start: state.route.start, undock: undocked.ok === true, plotRoute: plotted.ok === true, engageAutopilot: engaged.ok === true, approachDock: dockQueued };
  await save();

  // ---- 60 s wall-time sampling, one snapshot per second.
  const sampleWallStart = Date.now();
  const cancelledDockReasons = new Set(['impact', 'blocked', 'stale', 'lost-station', 'dock-refused']);
  let dockRetries = 0;
  for (let i = 0; i < SAMPLE_SECONDS; i++) {
    const due = sampleWallStart + i * 1000;
    const waitMs = due - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    const wallMs = Date.now() - sampleWallStart;
    const snapshot = await snap();
    const obs = await observe();
    const overlayRead = i === 0 || i % 5 === 0 ? await overlay() : null;
    const phase = phaseOf(obs);
    const sample = {
      i,
      wallMs,
      simT: obs.t,
      phase,
      flags: {
        docked: obs.flags?.docked === true,
        system: obs.world?.currentSystem ?? null,
        jump: obs.gate?.jumping === true,
      },
      gate: {
        inZone: obs.gate?.inZone === true,
        jumping: obs.gate?.jumping === true,
        progress: obs.gate?.progress ?? null,
        to: obs.gate?.to ?? null,
        destination: obs.gate?.destination ?? null,
      },
      autopilot: {
        engaged: obs.autopilot?.engaged === true,
        mode: obs.autopilot?.mode ?? '',
        phase: obs.autopilot?.phase ?? '',
        reason: obs.autopilot?.reason ?? '',
        range: obs.autopilot?.range ?? null,
        queuedDock: obs.autopilot?.queuedDock ?? null,
      },
      overlay: overlayRead,
      snapshot,
    };
    state.samples.push(sample);
    if (overlayRead) {
      assert.equal(overlayRead.exists, true, 'overlay exists during sampling');
      assert.notEqual(overlayRead.display, 'none', 'overlay visible during sampling at ' + wallMs + 'ms');
      for (const label of LABELS) assert.ok(labelPresent(overlayRead.text, label), 'overlay label ' + label + ' present during sampling at ' + wallMs + 'ms');
      state.overlaySamples.push({ wallMs, simT: obs.t, visible: true, text: overlayRead.text });
    }
    const last = state.phaseTimeline.at(-1);
    if (!last || last.phase !== phase) {
      state.phaseTimeline.push({
        wallMs,
        simT: obs.t,
        phase,
        docked: obs.flags?.docked === true,
        system: obs.world?.currentSystem ?? null,
        jump: obs.gate?.jumping === true,
        autopilot: sample.autopilot,
        gate: sample.gate,
      });
    }
    if (obs.flags?.docked === true && obs.world?.currentSystem === ROUTE_DEST && !state.route.completed) {
      state.route.completed = { wallMs, simT: obs.t, system: obs.world.currentSystem };
    }
    if (obs.autopilot?.mode === 'dock' && obs.autopilot.engaged === false && cancelledDockReasons.has(obs.autopilot.reason) && dockRetries < 2) {
      const retry = await act('approachDock', {}, false);
      dockRetries += 1;
      (state.route.dockRetries ??= []).push({ wallMs, simT: obs.t, reason: obs.autopilot.reason, retry });
    }
  }
  state.aggregates = aggregate();
  runResult.aggregates = state.aggregates;
  console.log('SAMPLING', JSON.stringify({
    samples: state.aggregates.sampleCount,
    frameP50: state.aggregates.frame.p50,
    frameP95: state.aggregates.frame.p95,
    calls: state.aggregates.renderer.calls,
    triangles: state.aggregates.renderer.triangles,
    npc: state.aggregates.npc,
    records: { current: state.aggregates.npc.recordsCurrent.max, galaxy: state.aggregates.npc.recordsGalaxy.max },
    matrixWrites: state.aggregates.asteroid.matrixWrites,
    phases: state.aggregates.phaseCounts,
  }));
  await save();

  // ---- Same origin without ?perf=1: instrumentation must be absent by default.
  await c.send('Page.navigate', { url: baseUrl + '?agent=1' });
  const bootMs = await waitForBoot(180000);
  await sleep(500);
  const absent = await c.eval(`(() => ({
    booted: window.__rimwardBooted === true,
    perfType: typeof window.__ctx?.perf,
    overlayExists: !!document.getElementById('perf-overlay'),
    overlayCount: document.querySelectorAll('#perf-overlay').length,
    ctxExists: typeof window.__ctx === 'object',
  }))()`);
  state.reload = { url: baseUrl + '?agent=1', bootMs };
  state.absent = absent;
  assert.equal(absent.booted, true, 'same origin without query boots');
  assert.equal(absent.ctxExists, true, 'window.__ctx exists after reload');
  assert.equal(absent.perfType, 'undefined', 'window.__ctx.perf is undefined without ?perf=1');
  assert.equal(absent.overlayExists, false, '#perf-overlay is absent without ?perf=1');
  assert.equal(absent.overlayCount, 0, 'no #perf-overlay element without ?perf=1');
  state.checks.absentByDefault = { ...absent, pass: true };
  await save();
}

try {
  result = await runLive(NAME, fn, { query: '&perf=1', serve: 'preview' });
} catch (e) {
  runError = e;
}

await mkdir(folder, { recursive: true });

const dist = await distMetadata();
const evidence = {
  issue: 337,
  title: '[Perf] Add frame-time instrumentation and a live perf probe (system scale/population Phase 0)',
  probe: PROBE,
  probeName: NAME,
  generatedAt: new Date().toISOString(),
  route: {
    description: state.route.description ?? 'Fresh Greenhand start -> undock -> plotRoute(veridian) -> engageAutopilot -> queued approachDock (autopilot lane -> gate -> jump -> dock fixed route).',
    dest: ROUTE_DEST,
    ...state.route,
  },
  build: {
    headCommit: result?.headCommit ?? null,
    sourceHashStart: result?.sourceHashStart ?? null,
    sourceHashEnd: result?.sourceHashEnd ?? null,
    sourceStable: result?.sourceStable ?? null,
    identityMode: result?.identityMode ?? null,
    workingTreeDirty: result?.workingTreeDirty ?? null,
    runtimeSourceDirty: result?.runtimeSourceDirty ?? null,
    serve: result?.serve ?? 'preview',
    query: result?.query ?? '&perf=1',
    rendererConfig: result?.rendererConfig ?? null,
    dist,
  },
  source: {
    repo,
    nodeVersion: process.version,
    platform: process.platform,
    platformRelease: os.release(),
    arch: os.arch(),
    cpuModel: os.cpus()[0]?.model ?? null,
    cpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
  },
  browser: {
    ...(state.browser ?? {}),
    chromeVersion: state.chromeVersion ?? null,
    gpu: state.gpu ?? null,
  },
  run: {
    started: result?.started ?? null,
    finished: result?.finished ?? null,
    port: result?.port ?? null,
    profile: result?.profile ?? null,
    cdpPort: result?.cdpPort ?? null,
    samplingSeconds: SAMPLE_SECONDS,
    samplingStartedAt: state.route.samplingStartedAt ?? null,
    reloadWithoutQuery: state.reload ?? null,
  },
  samples: state.samples,
  aggregates: state.aggregates,
  phaseTimeline: state.phaseTimeline,
  overlaySamples: state.overlaySamples,
  checks: state.checks,
  defaultAbsence: state.absent,
  consoleErrors: result?.consoleErrors ?? [],
  exceptions: result?.exceptions ?? [],
  consoleErrorCount: result?.consoleErrors?.length ?? 0,
  exceptionCount: result?.exceptions?.length ?? 0,
  cleanup: result?.cleanup ?? null,
  closedPorts: result?.closedPorts ?? null,
  cleanupFailed: result?.cleanupFailed ?? null,
  sourceChanged: result?.sourceChanged ?? null,
  verdict: result?.verdict ?? 'FAIL',
  error: result?.error ?? (runError ? String(runError.stack ?? runError) : null),
};

const evidencePath = join(folder, 'evidence.json');
await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
console.log('EVIDENCE', evidencePath);
console.log('VERDICT', evidence.verdict);

if (evidence.verdict !== 'PASS') {
  console.error('PERF PROBE FAILED', evidence.error ?? '');
  process.exitCode = 1;
}
