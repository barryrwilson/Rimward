/**
 * Issue #340 live probe — system scale/population Phase 3 (x2 extent + in-system chart).
 *
 * Production-build (vite preview over dist/) real-Chrome verification of the
 * Phase 3 outcome: the playable system is physically larger with travel that
 * stays playable, the in-system chart makes it legible, and a pre-Phase-3 (v1)
 * save upgrades by transforming persisted positions x2 exactly once.
 *
 * Sequence (fresh Greenhand, ?agent=1&perf=1, production dist/):
 *   1. dock at Freehold, undock, plotRoute(veridian), engageAutopilot, queued
 *      approachDock: the autopilot lane -> gate -> jump -> dock route. One
 *      second samples of the agent observation, perf snapshot, phase and
 *      renderer counts; station->gate and gate->jump->dock travel times are
 *      measured from the real run.
 *   2. in-system chart: KeyM opens the chart, the System view is selected,
 *      station/gates/field/landmarks/orbit rings/tier markers are read from the
 *      DOM/SVG, renderer draw calls + scene geometry/texture counts are compared
 *      before/after (zero render cost), screenshots are captured, KeyM closes it.
 *   3. manual flight at the doubled speed: undock, straight run, then a
 *      closed-loop steer toward the station bearing using observe() alone; the
 *      control echo and heading convergence are recorded; approachDock docks.
 *   4. old-save restore: dock (autosave), read the v2 autosave, build a v1
 *      fixture with the SAME pure transform module the app uses (inverse x0.5),
 *      inject it, reload and assert the real app upgrades every position x2
 *      exactly once, preserves record identity/state, writes v2 again, and a
 *      second load does not double-scale.
 *
 * Evidence lands in out/issue-340-live/extent-chart/ (result.json from the
 * harness + evidence.json; untracked). Run: npm run build && node
 * scripts/issue-340-live-probe.mjs. Smoke: ISSUE340_SAMPLE_SECONDS=60.
 */
import assert from 'node:assert/strict';
import { access, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as os from 'node:os';

process.env.ISSUE74_OUT = process.env.ISSUE340_OUT || resolve('out/issue-340-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, sleep, out, repo } = await import('./issue-74-live-harness.mjs');
const { demoteSnapshotV2ToV1 } = await import('../src/game/save-migrate.js');

const PROBE = 'scripts/issue-340-live-probe.mjs';
const NAME = 'extent-chart';
const folder = join(out, NAME);
const ROUTE_DEST = 'veridian';
const SAVE_KEY = 'rimward-save-v1';
const SAMPLE_SECONDS = Number(process.env.ISSUE340_SAMPLE_SECONDS) || 240;
const MIN_SAMPLES = Math.max(30, Math.floor(SAMPLE_SECONDS * 0.5));
const DOCK_CANCEL_REASONS = new Set(['impact', 'blocked', 'stale', 'lost-station', 'dock-refused']);

const state = {
  checks: {},
  samples: [],
  phaseTimeline: [],
  route: {},
  chart: {},
  manual: {},
  migration: {},
  aggregates: null,
  browser: null,
  gpu: null,
  chromeVersion: null,
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
const stats = (xs) => ({ median: median(xs), max: maxOf(xs), min: minOf(xs), samples: xs.length });

function aggregate() {
  const nums = (pathFn) => state.samples.map((s) => pathFn(s.snapshot)).filter((v) => finite(v));
  const frame = {};
  for (const k of ['p50', 'p95', 'p99', 'last', 'samples']) frame[k] = stats(nums((x) => x?.frame?.[k]));
  const renderer = {};
  for (const k of ['calls', 'triangles', 'points', 'geometries', 'textures']) renderer[k] = stats(nums((x) => x?.renderer?.[k]));
  const npc = {};
  for (const k of ['live', 'near', 'mid', 'far', 'recordsCurrent']) npc[k] = { max: maxOf(nums((x) => x?.npc?.[k])), median: median(nums((x) => x?.npc?.[k])) };
  const phaseCounts = {};
  for (const s of state.samples) phaseCounts[s.phase] = (phaseCounts[s.phase] ?? 0) + 1;
  return {
    sampleCount: state.samples.length,
    frame,
    renderer,
    npc,
    phaseCounts,
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
  return { exists: true, root, assetCount: assets.length, totalBytes, largest: [...assets].sort((a, b) => b.bytes - a.bytes).slice(0, 12) };
}

async function fn({ c, result: runResult, act, observe, wait, save, shot }) {
  runResult.fixture = false;
  runResult.method = 'Production preview build served by vite preview over dist/, loaded with ?agent=1&perf=1. Drives the public agent handle through a real Freehold -> Veridian dock/undock/plotRoute/engageAutopilot/approachDock route, opens/closes the in-system chart, flies manually, and restores an injected v1 autosave.';
  runResult.assertionScope = 'PASS means the live route completed at the doubled extent, the in-system chart opened/closed through the existing key with station/gates/field/landmarks/orbit rings/tier markers present and no added render cost, manual flight and the control echo worked, a v1 save upgraded x2 exactly once with identity preserved and no double scale on reload, and the console stayed clean with a stable runtime source.';

  const snap = () => c.eval('window.__ctx.perf.snapshot()');
  const rendererInfo = () => c.eval('(() => { const r = window.__ctx.renderer.info; return { calls: r.render.calls, triangles: r.render.triangles, points: r.render.points, geometries: r.memory.geometries, textures: r.memory.textures, sceneChildren: window.__ctx.scene.children.length }; })()');
  const key = async (code, keyName, vk) => {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  const chartDom = () => c.eval(`(() => {
    const root = document.querySelector('.rw-galaxy-chart');
    if (!root) return { exists: false };
    const buttons = [...root.querySelectorAll('button')].map((b) => ({ text: (b.textContent || '').trim(), cls: b.className, view: b.getAttribute('data-view') }));
    const sys = root.querySelector('.rw-system-chart');
    const svg = sys ? sys.querySelector('.rw-system-svg') : null;
    return {
      exists: true,
      hidden: root.classList.contains('is-hidden'),
      isSystemView: root.classList.contains('is-system-view'),
      ariaHidden: root.getAttribute('aria-hidden'),
      chartOpen: window.__ctx.flags.chartOpen === true,
      buttons,
      systemView: sys ? {
        systemId: sys.getAttribute('data-system-id'),
        extent: Number(sys.getAttribute('data-extent')),
        near: Number(sys.getAttribute('data-traffic-near')),
        mid: Number(sys.getAttribute('data-traffic-mid')),
        far: Number(sys.getAttribute('data-traffic-far')),
        text: (sys.textContent || '').slice(0, 1600),
        svgNodes: svg ? svg.querySelectorAll('*').length : 0,
        rings: sys.querySelectorAll('.rw-system-ring').length,
        orbits: sys.querySelectorAll('.rw-system-orbit').length,
        planets: sys.querySelectorAll('.rw-system-planet').length,
        gates: sys.querySelectorAll('.rw-system-gate').length,
        landmarks: sys.querySelectorAll('.rw-system-landmark').length,
        clues: sys.querySelectorAll('.rw-system-clue').length,
        fields: sys.querySelectorAll('.rw-system-field').length,
        tiers: sys.querySelectorAll('.rw-system-traffic[data-tier]').length,
        legendNear: sys.querySelectorAll('.rw-system-legend-near').length,
        legendMid: sys.querySelectorAll('.rw-system-legend-mid').length,
        legendFar: sys.querySelectorAll('.rw-system-legend-far').length,
        player: sys.querySelectorAll('.rw-system-player').length,
      } : null,
    };
  })()`);

  // ---- Boot sanity: perf instrumentation is live (needed for the no-render-cost check).
  let boot = null;
  for (let i = 0; i < 60; i++) {
    boot = await c.eval('(() => { const el = document.getElementById("perf-overlay"); return { exists: !!el, text: el ? el.textContent : "" }; })()');
    if (boot.exists && boot.text.includes('FRAME')) break;
    await sleep(250);
  }
  assert.equal(boot.exists, true, '#perf-overlay exists with ?perf=1');
  let s0 = null;
  for (let i = 0; i < 60; i++) {
    s0 = await snap();
    if (s0?.frame?.samples > 0 && s0?.renderer?.calls > 0) break;
    await sleep(250);
  }
  assert.equal(s0.enabled, true, 'perf snapshot enabled');
  assert.ok(s0.frame.samples > 0 && s0.renderer.calls > 0, 'perf snapshot collecting');
  state.checks.perfBoot = { enabled: s0.enabled, visible: s0.visible, frame: s0.frame, renderer: s0.renderer, npc: s0.npc };

  // ---- Route: fresh Greenhand -> dock -> undock -> plot -> autopilot -> queued dock.
  const dockAtCurrent = async (label) => {
    let s = await observe();
    if (s.flags?.docked === true) return s;
    const began = Date.now();
    for (;;) {
      const r = await act(s.station?.inZone ? 'dock' : 'approachDock', {}, false);
      if (r.ok) break;
      if (Date.now() - began > 90000) throw Error('bounded dock unavailable ' + JSON.stringify(r));
      await sleep(750);
      s = await observe();
      if (s.flags?.docked === true) return s;
    }
    runResult.actions.at(-1).label = label;
    return wait((x) => x.flags.docked === true, 240, label);
  };
  let o = await dockAtCurrent('initial Freehold dock');
  assert.equal(o.session.phase, 'playing', 'fresh Greenhand start is playing');
  assert.equal(o.flags.docked, true, 'fresh Greenhand start settles docked');
  const startSystem = o.world.currentSystem;
  const def = await c.eval(`(() => {
    const s = window.__ctx.systems[window.__ctx.world.currentSystem];
    const station = s.station.position;
    const gates = (s.gates || []).map((g) => ({ to: g.to, position: g.position, dist: Math.hypot(g.position[0] - station[0], g.position[1] - station[1], g.position[2] - station[2]) }));
    const landmarks = (s.landmarks || []).map((l) => ({ name: l.name, position: l.position, dist: Math.hypot(l.position[0] - station[0], l.position[1] - station[1], l.position[2] - station[2]) }));
    const planets = (s.planetCount || 0);
    const extent = Math.max(...gates.map((g) => Math.hypot(g.position[0], g.position[1], g.position[2])), ...landmarks.map((l) => Math.hypot(l.position[0], l.position[1], l.position[2])));
    return { system: s.id, station, gates, landmarks, planets, extent };
  })()`);
  state.route.start = { simT: o.t, system: startSystem, origin: o.world.origin ?? null, def };
  const launch = async () => {
    const began = Date.now();
    for (;;) {
      const r = await act('undock', {}, false);
      if (r.ok) return r;
      if (r.token !== 'blocked' || Date.now() - began > 60000) throw Error('Bounded launch unavailable ' + JSON.stringify(r));
      await sleep(750);
    }
  };
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

  // ---- Sampling: one sample per second until the route docks at the destination.
  const sampleWallStart = Date.now();
  let dockRetries = 0;
  let undockWall = null;
  let gateWall = null;
  let jumpWall = null;
  let arrivalWall = null;
  for (let i = 0; i < SAMPLE_SECONDS; i++) {
    const due = sampleWallStart + i * 1000;
    const waitMs = due - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    const wallMs = Date.now() - sampleWallStart;
    const snapshot = await snap();
    const obs = await observe();
    const phase = phaseOf(obs);
    if (undockWall === null && obs.flags?.docked === false) undockWall = wallMs;
    if (gateWall === null && obs.gate?.inZone === true) gateWall = wallMs;
    if (jumpWall === null && obs.gate?.jumping === true) jumpWall = wallMs;
    if (arrivalWall === null && obs.world?.currentSystem === ROUTE_DEST) arrivalWall = wallMs;
    const sample = {
      i, wallMs, simT: obs.t, phase,
      system: obs.world?.currentSystem ?? null,
      docked: obs.flags?.docked === true,
      gate: { inZone: obs.gate?.inZone === true, jumping: obs.gate?.jumping === true, to: obs.gate?.to ?? null, destination: obs.gate?.destination ?? null },
      autopilot: { engaged: obs.autopilot?.engaged === true, mode: obs.autopilot?.mode ?? '', reason: obs.autopilot?.reason ?? '', range: obs.autopilot?.range ?? null },
      snapshot,
    };
    state.samples.push(sample);
    const last = state.phaseTimeline.at(-1);
    if (!last || last.phase !== phase) state.phaseTimeline.push({ wallMs, simT: obs.t, phase, system: sample.system, docked: sample.docked, autopilot: sample.autopilot, gate: sample.gate });
    if (obs.flags?.docked === true && obs.world?.currentSystem === ROUTE_DEST && !state.route.completed) {
      state.route.completed = { wallMs, simT: obs.t, system: obs.world.currentSystem };
      // The freehold gate zone can be crossed between 1 s samples, so the
      // station->gate leg is measured to jump start (the gate arrival) and the
      // post-jump in-zone sample is not used for a negative gate->jump delta.
      state.route.times = {
        undockToGateMs: jumpWall !== null && undockWall !== null ? jumpWall - undockWall : null,
        gateToJumpMs: jumpWall !== null && gateWall !== null && jumpWall >= gateWall ? jumpWall - gateWall : null,
        undockToDockMs: undockWall !== null ? wallMs - undockWall : null,
        arrivalToDockMs: arrivalWall !== null ? wallMs - arrivalWall : null,
        undockWall, gateWall, jumpWall, arrivalWall,
        simT: obs.t,
      };
    }
    if (obs.autopilot?.mode === 'dock' && obs.autopilot.engaged === false && DOCK_CANCEL_REASONS.has(obs.autopilot.reason) && dockRetries < 3) {
      const retry = await act('approachDock', {}, false);
      dockRetries += 1;
      (state.route.dockRetries ??= []).push({ wallMs, simT: obs.t, reason: obs.autopilot.reason, retry });
    }
    if (state.route.completed && i >= MIN_SAMPLES) break;
  }
  state.aggregates = aggregate();
  runResult.aggregates = state.aggregates;
  assert.ok(state.route.completed, 'the autopilot route docked at ' + ROUTE_DEST + ' within the sampling window: ' + JSON.stringify({ phaseTimeline: state.phaseTimeline.slice(-8), route: state.route }));
  const routeTimes = state.route.times;
  assert.ok(finite(routeTimes.undockToGateMs) && routeTimes.undockToGateMs <= 60000,
    'station -> gate leg is <= 60 s of dead time: ' + JSON.stringify(routeTimes));
  // The dock approach is a real traffic-sharing corridor: a crowd hull can
  // interrupt it, and the queued approachDock retry re-runs the lane. Budget
  // each physical attempt rather than treating a traffic retry as dead time.
  // The lane is an active, traffic-shared approach (station-arc detours and
  // yield holds), not dead time: the documented <=60 s travel legs are
  // station->gate and station->outer POI. Measured lane attempts stay under
  // 90 s; the whole undock->dock route stays under 180 s even with retries.
  const DOCK_ATTEMPT_BUDGET_MS = 90000;
  const ROUTE_TOTAL_BUDGET_MS = 180000;
  const dockRetryRows = state.route.dockRetries ?? [];
  for (let i = 0; i < dockRetryRows.length; i++) {
    const prev = i === 0 ? (routeTimes.arrivalWall ?? routeTimes.jumpWall ?? routeTimes.undockWall ?? 0) : dockRetryRows[i - 1].wallMs;
    assert.ok(dockRetryRows[i].wallMs - prev <= DOCK_ATTEMPT_BUDGET_MS,
      `dock attempt ${i + 1} is <= ${DOCK_ATTEMPT_BUDGET_MS / 1000} s: ` + JSON.stringify({ prev, retry: dockRetryRows[i] }));
  }
  const finalAttemptStart = dockRetryRows.length ? dockRetryRows.at(-1).wallMs : (routeTimes.arrivalWall ?? routeTimes.jumpWall ?? routeTimes.undockWall ?? 0);
  assert.ok(finite(routeTimes.undockToDockMs) && routeTimes.undockToDockMs - finalAttemptStart <= DOCK_ATTEMPT_BUDGET_MS,
    'final dock attempt is <= ' + (DOCK_ATTEMPT_BUDGET_MS / 1000) + ' s: ' + JSON.stringify(routeTimes));
  assert.ok(finite(routeTimes.undockToDockMs) && routeTimes.undockToDockMs <= ROUTE_TOTAL_BUDGET_MS,
    'undock -> destination dock completes within ' + (ROUTE_TOTAL_BUDGET_MS / 1000) + ' s including any traffic retry: ' + JSON.stringify(routeTimes));
  console.log('ROUTE', JSON.stringify(state.route.times));
  await save();

  // ---- In-system chart: KeyM open, System view, zero render cost, KeyM close.
  // The chart is suppressed while docked (station overlay owns the screen), so
  // undock first and read the DESTINATION system's def for the assertions.
  const chartSystem = ROUTE_DEST;
  const chartDef = await c.eval(`(() => {
    const s = window.__ctx.systems[window.__ctx.world.currentSystem];
    const station = s.station.position;
    const gates = (s.gates || []).map((g) => ({ to: g.to, position: g.position }));
    const landmarks = (s.landmarks || []).map((l) => ({ name: l.name, position: l.position }));
    return { system: s.id, station, gates, landmarks, planets: (s.planetCount || 0) };
  })()`);
  await launch();
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'chart undock settles');
  const before = await rendererInfo();
  const sceneChildrenBefore = before.sceneChildren;
  await key('KeyM', 'm', 77);
  let opened = null;
  for (let i = 0; i < 40; i++) {
    opened = await chartDom();
    if (opened.exists && opened.hidden === false) break;
    await sleep(150);
  }
  assert.equal(opened.exists, true, 'galaxy chart root exists');
  assert.equal(opened.hidden, false, 'KeyM opens the chart');
  assert.equal(opened.chartOpen, true, 'ctx.flags.chartOpen true');
  await shot('chart-galaxy');
  state.chart.open = { buttons: opened.buttons, hidden: opened.hidden, chartOpen: opened.chartOpen };

  const systemButton = (opened.buttons || []).find((b) => b.view === 'system');
  assert.ok(systemButton, 'the chart exposes a System view switch: ' + JSON.stringify(opened.buttons));
  const clicked = await c.eval(`(() => {
    const root = document.querySelector('.rw-galaxy-chart');
    const btn = root.querySelector('button[data-view="system"]');
    if (!btn) return { ok: false };
    btn.click();
    return { ok: true, text: (btn.textContent || '').trim(), cls: btn.className };
  })()`);
  assert.equal(clicked.ok, true, 'System view button clicked');
  let sysView = null;
  for (let i = 0; i < 40; i++) {
    sysView = await chartDom();
    if (sysView.systemView && sysView.systemView.svgNodes > 20) break;
    await sleep(150);
  }
  assert.ok(sysView.systemView, 'System view renders: ' + JSON.stringify(sysView));
  const sv = sysView.systemView;
  assert.equal(sysView.isSystemView, true, 'chart root reports the system view');
  assert.equal(sv.systemId, chartSystem, 'System view names the current system: ' + sv.systemId);
  assert.ok(sv.svgNodes > 20, 'System view SVG has content: ' + sv.svgNodes);
  const stationName = await c.eval('window.__ctx.systems[window.__ctx.world.currentSystem].station.name');
  assert.ok(stationName && sv.text.includes(stationName), 'System view names the station ' + stationName + ': ' + sv.text.slice(0, 300));
  for (const g of chartDef.gates) {
    const destName = await c.eval(`window.__ctx.systems[${JSON.stringify(g.to)}].name`);
    assert.ok(sv.text.includes(destName), 'System view names gate destination ' + destName);
  }
  for (const lm of chartDef.landmarks) assert.ok(sv.text.includes(lm.name), 'System view names landmark ' + lm.name);
  assert.ok(sv.orbits >= chartDef.planets, 'System view shows at least ' + chartDef.planets + ' planet orbits: ' + sv.orbits);
  assert.ok(sv.planets >= 1, 'System view shows planet markers: ' + sv.planets);
  assert.ok(sv.gates >= chartDef.gates.length, 'System view shows every gate: ' + sv.gates + '/' + chartDef.gates.length);
  assert.ok(sv.fields >= 1, 'System view shows the asteroid field: ' + sv.fields);
  assert.ok(sv.landmarks >= chartDef.landmarks.length, 'System view shows the landmark: ' + sv.landmarks);
  assert.equal(sv.legendNear, 1, 'System view has a near-tier legend row');
  assert.equal(sv.legendMid, 1, 'System view has a mid-tier legend row');
  assert.equal(sv.legendFar, 1, 'System view has a far-tier legend row');
  const tierTotal = (finite(sv.near) ? sv.near : 0) + (finite(sv.mid) ? sv.mid : 0) + (finite(sv.far) ? sv.far : 0);
  assert.equal(sv.tiers, tierTotal, 'every counted tier record has a marker: ' + sv.tiers + ' vs ' + tierTotal);
  await shot('chart-system');
  state.chart.system = sv;

  // Freeze the simulation (KeyP) before comparing draw calls. The ship was
  // still coasting after the chart undock, so scene visibility — and therefore
  // the frame's draw-call count — drifts frame to frame. With the system loop
  // paused the rendered scene is static, so the only difference between the
  // two measurement windows is the chart overlay (DOM/SVG, no WebGL). Pause
  // also proves the chart's refresh timer cannot add renderer work.
  await key('KeyP', 'p', 80);
  await wait((x) => x.flags.paused === true, 10, 'simulation paused for the render-cost comparison');
  await sleep(300);
  const openSamples = [];
  for (let i = 0; i < 5; i++) { openSamples.push(await rendererInfo()); await sleep(120); }
  const openInfo = openSamples.at(-1);
  const chartCanvases = await c.eval("document.querySelectorAll('.rw-galaxy-chart canvas').length");
  assert.equal(chartCanvases, 0, 'the chart renders in DOM/SVG, not on a WebGL canvas');

  await key('KeyM', 'm', 77);
  let closed = null;
  for (let i = 0; i < 40; i++) {
    closed = await chartDom();
    if (closed.hidden === true) break;
    await sleep(150);
  }
  assert.equal(closed.hidden, true, 'KeyM closes the chart (even while paused)');
  assert.equal(closed.chartOpen, false, 'ctx.flags.chartOpen false after close');
  state.chart.close = { hidden: closed.hidden, chartOpen: closed.chartOpen };

  await sleep(300);
  const closedSamples = [];
  for (let i = 0; i < 5; i++) { closedSamples.push(await rendererInfo()); await sleep(120); }
  const closedInfo = closedSamples.at(-1);
  const callsOpen = median(openSamples.map((x) => x.calls));
  const callsClosed = median(closedSamples.map((x) => x.calls));
  state.chart.renderCost = {
    beforeChartOpen: before,
    sceneChildrenBeforeChartOpen: sceneChildrenBefore,
    openInfo,
    closedInfo,
    callsOpen,
    callsClosed,
    callsDelta: finite(callsOpen) && finite(callsClosed) ? callsOpen - callsClosed : null,
    pausedForComparison: true,
  };
  // The scene evolved while the chart was open (the sim was still running), so
  // the valid baseline is the closed window under the same frozen simulation.
  assert.equal(openInfo.sceneChildren, closedInfo.sceneChildren, 'chart adds no THREE scene objects: open ' + openInfo.sceneChildren + ' vs closed ' + closedInfo.sceneChildren);
  assert.equal(openInfo.geometries, closedInfo.geometries, 'chart adds no geometry: open ' + openInfo.geometries + ' vs closed ' + closedInfo.geometries);
  assert.equal(openInfo.textures, closedInfo.textures, 'chart adds no texture: open ' + openInfo.textures + ' vs closed ' + closedInfo.textures);
  assert.ok(finite(callsOpen) && finite(callsClosed), 'draw-call counts are finite: ' + JSON.stringify(state.chart.renderCost));
  assert.equal(callsOpen, callsClosed, 'chart adds no draw calls: open ' + callsOpen + ' vs closed ' + callsClosed);

  await key('KeyP', 'p', 80);
  await wait((x) => x.flags.paused === false, 10, 'simulation resumed after the chart render-cost comparison');
  await save();

  // ---- Manual flight at the doubled speed: straight run, closed-loop steer, dock.
  // The chart leg already undocked the ship.
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'manual-flight undock settled');
  // setControl is a bounded lease: seq must strictly increase, ttl is capped at
  // 5 s, and the pause that froze the render comparison cleared the lease.
  // Seed the sequence from the published lease status and renew every sample so
  // the straight run is one continuous manual flight.
  let controlSeq = (await observe()).control?.seq ?? 0;
  const setControl = (args) => act('setControl', { seq: ++controlSeq, ttl: 2, ...args });
  const manualStart = Date.now();
  let maxSpeed = 0;
  let posStart = null;
  let posMid = null;
  for (let i = 0; i < 8; i++) {
    await setControl({ throttle: 1, steerX: 0, steerY: 0 });
    const p = await c.eval('(() => { const s = window.__ctx.ship; return { x: s.object.position.x, y: s.object.position.y, z: s.object.position.z, speed: s.speed }; })()');
    if (!posStart) posStart = p;
    posMid = p;
    if (finite(p.speed)) maxSpeed = Math.max(maxSpeed, p.speed);
    await sleep(750);
  }
  const straightDist = Math.hypot(posMid.x - posStart.x, posMid.y - posStart.y, posMid.z - posStart.z);
  assert.ok(maxSpeed > 150, 'manual straight run reaches the doubled cruise/burn band: max speed ' + maxSpeed);
  assert.ok(straightDist > 400, 'manual straight run covers distance at the doubled scale: ' + straightDist);

  // Closed-loop steer toward the station bearing using observe() alone (#300 signs).
  const obsBeforeSteer = await observe();
  const stationBearing = obsBeforeSteer.station?.bearing;
  assert.ok(Array.isArray(stationBearing), 'observe().station.bearing is published');
  const k = 2;
  const steerX = Math.max(-1, Math.min(1, k * stationBearing[0]));
  const steerY = Math.max(-1, Math.min(1, -k * stationBearing[1]));
  const steerReceipt = await setControl({ throttle: 0.5, steerX, steerY });
  const controlEcho = (await observe()).control;
  assert.ok(controlEcho && finite(controlEcho.steerX), 'observe().control echoes the accepted steer while a manual lease is live: ' + JSON.stringify(controlEcho));
  assert.ok(Math.abs(controlEcho.steerX - steerX) < 1e-6 && Math.abs(controlEcho.steerY - steerY) < 1e-6, 'control echo matches the accepted steer');
  let bearingAfter = null;
  for (let i = 0; i < 10; i++) {
    await setControl({ throttle: 0.5, steerX, steerY });
    const o2 = await observe();
    bearingAfter = o2.station?.bearing ?? null;
    if (bearingAfter && Math.hypot(bearingAfter[0], bearingAfter[1]) < 0.25) break;
    await sleep(400);
  }
  assert.ok(bearingAfter, 'station bearing still published during the steer');
  assert.ok(Math.hypot(bearingAfter[0], bearingAfter[1]) < 0.6, 'closed-loop steer converges on the station bearing: ' + JSON.stringify({ before: stationBearing, after: bearingAfter }));
  state.manual = {
    maxSpeed, straightDist, wallMs: Date.now() - manualStart,
    steer: { k, steerX, steerY, receipt: steerReceipt, echo: controlEcho, bearingBefore: stationBearing, bearingAfter },
  };
  await act('clearControl', {}, false);
  // The manual lane shares the station approach with crowd traffic, so an
  // impact can cancel the queued dock exactly as it can on the autopilot
  // route. Retry the real approachDock verb instead of treating the cancelled
  // attempt as dead time; each attempt is the normal game flow.
  const dockAttempts = [];
  const approach = await act('approachDock', {}, false);
  dockAttempts.push({ at: Date.now(), receipt: approach });
  let manualDocked = false;
  const dockWallStart = Date.now();
  while (Date.now() - dockWallStart < 240000) {
    const o = await observe();
    if (o.flags?.docked === true) { manualDocked = true; break; }
    const ap = o.autopilot;
    if (ap && ap.mode === 'dock' && ap.engaged === false && DOCK_CANCEL_REASONS.has(ap.reason) && dockAttempts.length <= 3) {
      const retry = await act('approachDock', {}, false);
      dockAttempts.push({ at: Date.now(), simT: o.t, reason: ap.reason, receipt: retry });
    }
    await sleep(500);
  }
  state.manual.approachDock = { attempts: dockAttempts, docked: manualDocked };
  assert.ok(manualDocked, 'manual-flight dock completes (with traffic retries): ' + JSON.stringify(state.manual.approachDock));
  state.manual.docked = true;
  await shot('manual-flight');
  await save();

  // ---- Old-save restore: inject a v1 fixture built with the app's own transform.
  let autosaveRaw = null;
  for (let i = 0; i < 40; i++) {
    autosaveRaw = await c.eval('localStorage.getItem(' + JSON.stringify(SAVE_KEY) + ')');
    if (autosaveRaw) break;
    await sleep(250);
  }
  assert.ok(autosaveRaw, 'autosave exists after docking');
  const v2 = JSON.parse(autosaveRaw);
  assert.equal(v2.v, 2, 'the autosave writes the v2 envelope');
  const v1 = demoteSnapshotV2ToV1(JSON.parse(JSON.stringify(v2)));
  assert.equal(v1.v, 1, 'the fixture carries the v1 envelope');
  const sampleRec = (() => {
    const banks = v2.world?.recordBanks && typeof v2.world.recordBanks === 'object' ? v2.world.recordBanks : {};
    for (const sysId of Object.keys(banks)) {
      const bank = banks[sysId];
      if (!Array.isArray(bank)) continue;
      for (const rec of bank) {
        if (rec && Array.isArray(rec.route) && rec.route.length && rec.route[0]) {
          return { sysId, id: rec.id, state: rec.state, role: rec.role, cargo: rec.cargo ?? null, route: rec.route };
        }
      }
    }
    return null;
  })();
  assert.ok(sampleRec, 'the autosave contains a record bank with a route');
  const expected = {
    currentSystem: v2.world?.currentSystem ?? null,
    shipPosition: v2.ship?.position ?? null,
    recId: sampleRec.id,
    recState: sampleRec.state,
    recRole: sampleRec.role,
    recRoute0: sampleRec.route[0],
  };
  const v1Rec = v1.world.recordBanks[sampleRec.sysId].find((r) => r && r.id === sampleRec.id);
  const v1Route0 = v1Rec?.route?.[0] ?? null;
  const v1Ship = v1.ship?.position ?? null;
  assert.ok(v1Route0 && finite(v1Route0.x), 'the v1 fixture has the sampled record route');
  assert.ok(v1Ship && finite(v1Ship[0]), 'the v1 fixture has the ship position');
  state.migration.fixture = { envelope: 1, sampleRec: { sysId: sampleRec.sysId, id: sampleRec.id, routeLen: sampleRec.route.length }, v1Route0, v1Ship, currentSystem: expected.currentSystem };

  await c.eval('localStorage.setItem(' + JSON.stringify(SAVE_KEY) + ', ' + JSON.stringify(JSON.stringify(v1)) + ')');
  await c.send('Page.navigate', { url: 'about:blank' });
  await sleep(400);
  await c.send('Page.navigate', { url: 'http://127.0.0.1:' + runResult.port + '/?agent=1&perf=1' });
  const booted = async (timeoutMs) => {
    const began = Date.now();
    for (;;) {
      let ok = false;
      try { ok = await c.eval('window.__rimwardBooted === true && !!window.__ctx && !!window.__ctx.world'); } catch { /* navigating */ }
      if (ok) return Date.now() - began;
      if (Date.now() - began > timeoutMs) throw Error('reload boot timeout');
      await sleep(250);
    }
  };
  const bootMs = await booted(180000);
  await sleep(1500);
  // The boot restore runs before the title screen: a reload with an autosave
  // mounts the title and pauses the sim. Dismiss it through the same agent verb
  // the harness uses (CONTINUE keeps the restored world) so the dock/undock
  // autosave path can run.
  const restoredSession = await observe();
  state.migration.restore = {};
  state.migration.restore.sessionPhaseAfterBoot = restoredSession.session?.phase ?? null;
  state.migration.restore.pausedAfterBoot = restoredSession.flags?.paused ?? null;
  if (restoredSession.session?.phase === 'title') {
    state.migration.restore.startGameReceipt = await act('startGame', {}, false);
    await wait((x) => x.flags.paused === false, 10, 'restored run resumed from the title');
  }
  const restored = await c.eval(`(() => {
    const ctx = window.__ctx;
    const banks = ctx.world.recordBanks || {};
    const want = ${JSON.stringify({ sysId: sampleRec.sysId, id: sampleRec.id })};
    let found = null;
    const bank = banks[want.sysId];
    if (Array.isArray(bank)) for (const r of bank) if (r && r.id === want.id) found = r;
    return {
      currentSystem: ctx.world.currentSystem,
      shipPosition: ctx.ship && ctx.ship.object ? ctx.ship.object.position.toArray() : null,
      found: found ? { id: found.id, state: found.state, role: found.role, cargo: found.cargo ?? null, route: found.route } : null,
      envelope: JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null'),
    };
  })()`);
  assert.equal(restored.currentSystem, expected.currentSystem, 'v1 restore keeps the saved system');
  assert.ok(restored.found, 'v1 restore keeps the sampled record identity');
  assert.equal(restored.found.state, expected.recState, 'v1 restore preserves record state');
  assert.equal(restored.found.role, expected.recRole, 'v1 restore preserves record role');
  const got0 = restored.found.route?.[0];
  assert.ok(got0 && Math.abs(got0.x - v1Route0.x * 2) <= 1 && Math.abs(got0.z - v1Route0.z * 2) <= 1, 'v1 record route upgrades x2 exactly once: ' + JSON.stringify({ v1: v1Route0, got: got0 }));
  assert.ok(restored.shipPosition && Math.abs(restored.shipPosition[0] - v1Ship[0] * 2) <= 2 && Math.abs(restored.shipPosition[2] - v1Ship[2] * 2) <= 2, 'v1 ship position upgrades x2 exactly once: ' + JSON.stringify({ v1: v1Ship, got: restored.shipPosition }));
  Object.assign(state.migration.restore, { bootMs, restored: { currentSystem: restored.currentSystem, found: restored.found ? { id: restored.found.id, state: restored.found.state, role: restored.found.role, route0: restored.found.route?.[0] ?? null } : null, shipPosition: restored.shipPosition }, envelopeAfterBoot: restored.envelope ? restored.envelope.v : null });
  await shot('v1-restored');
  await save();

  // Boot restore does not rewrite the autosave by itself: the save module
  // writes on docked/undocked/systemLoaded events and on its 60 s idle timer.
  // The restored snapshot sits in space next to the station, so the natural
  // dock transaction is the fastest real trigger for the v2 re-save (the idle
  // timer is the fallback). No fixture writes: the game's own dock event runs
  // the normal autosave path.
  const restoredObs = await observe();
  state.migration.restore.dockedAfterBoot = restoredObs.flags?.docked === true;
  state.migration.restore.inZoneAfterBoot = restoredObs.station?.inZone === true;
  state.migration.restore.flagsAfterBoot = {
    docked: restoredObs.flags?.docked ?? null,
    berthHold: restoredObs.flags?.berthHold ?? null,
    paused: restoredObs.flags?.paused ?? null,
    combat: restoredObs.flags?.combat ?? null,
  };
  if (restoredObs.flags?.docked === true) {
    state.migration.restore.undockReceipt = await act('undock', {}, false);
  } else if (restoredObs.station?.inZone === true) {
    state.migration.restore.dockReceipt = await act('dock', {}, false);
  } else {
    state.migration.restore.approachReceipt = await act('approachDock', {}, false);
    await wait((x) => x.flags.docked === true, 180, 'restored ship docks for the re-save').catch((e) => {
      state.migration.restore.dockWaitError = String(e?.message ?? e);
    });
  }

  // The restored v1 timeline must re-save as v2, and a second load must not scale again.
  const resaved = await (async () => {
    for (let i = 0; i < 240; i++) {
      const raw = await c.eval('localStorage.getItem(' + JSON.stringify(SAVE_KEY) + ')');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.v === 2) return parsed;
      }
      await sleep(250);
    }
    return null;
  })();
  assert.ok(resaved, 'the restored v1 timeline re-saves as v2');
  const beforeSecond = resaved.world?.recordBanks?.[sampleRec.sysId]?.find((r) => r && r.id === sampleRec.id)?.route?.[0] ?? null;
  assert.ok(beforeSecond, 'the re-saved v2 blob still has the sampled record');
  await c.send('Page.navigate', { url: 'about:blank' });
  await sleep(400);
  await c.send('Page.navigate', { url: 'http://127.0.0.1:' + runResult.port + '/?agent=1&perf=1' });
  await booted(180000);
  await sleep(1500);
  const second = await c.eval(`(() => {
    const banks = window.__ctx.world.recordBanks || {};
    const bank = banks[${JSON.stringify(sampleRec.sysId)}];
    let found = null;
    if (Array.isArray(bank)) for (const r of bank) if (r && r.id === ${JSON.stringify(sampleRec.id)}) found = r;
    return { route0: found ? found.route?.[0] ?? null : null, currentSystem: window.__ctx.world.currentSystem };
  })()`);
  assert.ok(second.route0, 'second load still has the sampled record');
  assert.ok(Math.abs(second.route0.x - beforeSecond.x) <= 0.001 && Math.abs(second.route0.z - beforeSecond.z) <= 0.001, 'a v2 save is not scaled again on reload: ' + JSON.stringify({ beforeSecond, second }));
  state.migration.idempotent = { beforeSecond, second };
  state.migration.resavedEnvelope = resaved.v;
  await save();

  // ---- Machine/browser metadata.
  state.chromeVersion = await c.send('Browser.getVersion');
  state.browser = await c.eval('({ userAgent: navigator.userAgent, hardwareConcurrency: Number(navigator.hardwareConcurrency) || null, deviceMemory: Number(navigator.deviceMemory) || null })');
  state.gpu = await c.eval(`(() => {
    const canvas = document.querySelector('canvas');
    const g = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    if (!g) return null;
    const e = g.getExtension('WEBGL_debug_renderer_info');
    return { renderer: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER), vendor: e ? g.getParameter(e.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR) };
  })()`);
  state.checks.consoleClean = { errors: runResult.consoleErrors?.length ?? null, exceptions: runResult.exceptions?.length ?? null };
}

let result = null;
let runError = null;

try {
  result = await runLive(NAME, fn, { query: '&perf=1', serve: 'preview' });
} catch (e) {
  runError = e;
}

await mkdir(folder, { recursive: true });
const dist = await distMetadata();
const evidence = {
  issue: 340,
  title: '[Navigation] Expand playable system extent and add an in-system chart view (system scale/population Phase 3)',
  probe: PROBE,
  probeName: NAME,
  generatedAt: new Date().toISOString(),
  route: {
    description: 'Fresh Greenhand -> dock at Freehold -> undock -> plotRoute(veridian) -> engageAutopilot -> queued approachDock (lane -> gate -> jump -> dock).',
    dest: ROUTE_DEST,
    ...state.route,
  },
  chart: state.chart,
  manual: state.manual,
  migration: state.migration,
  build: {
    headCommit: result?.headCommit ?? null,
    sourceHashStart: result?.sourceHashStart ?? null,
    sourceHashEnd: result?.sourceHashEnd ?? null,
    sourceStable: result?.sourceStable ?? null,
    identityMode: result?.identityMode ?? null,
    workingTreeDirty: result?.workingTreeDirty ?? null,
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
  browser: { ...(state.browser ?? {}), chromeVersion: state.chromeVersion ?? null, gpu: state.gpu ?? null },
  run: {
    started: result?.started ?? null,
    finished: result?.finished ?? null,
    port: result?.port ?? null,
    profile: result?.profile ?? null,
    cdpPort: result?.cdpPort ?? null,
    samplingSeconds: SAMPLE_SECONDS,
    samplingStartedAt: state.route.samplingStartedAt ?? null,
  },
  samples: state.samples,
  aggregates: state.aggregates,
  phaseTimeline: state.phaseTimeline,
  checks: state.checks,
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
  console.error('ISSUE 340 LIVE PROBE FAILED', evidence.error ?? '');
  process.exitCode = 1;
}
