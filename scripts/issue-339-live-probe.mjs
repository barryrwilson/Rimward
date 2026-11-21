/**
 * Issue #339 sustained live flight probe — system scale/population Phase 2.
 *
 * Production-build, real-Chrome verification of the Phase 2 population tiers:
 * a 10-minute sustained flight through lanes, station, gate and jumps on a
 * fresh Greenhand start, sampling once per second. Each sample records the
 * ?perf=1 snapshot (frame p50/p95/p99, draw calls/triangles, near/mid/far live
 * and presentation counts + caps, abstract records, CPU), the live ships, the
 * mid instanced proxy and far impostor layer state, the HUD hail card count,
 * the agent observation (phase/autopilot/gate/hail events) and the perf
 * overlay text. It asserts:
 *   - no record is drawn twice: no live hull duplicates, no live record also
 *     visible as a mid proxy or far impostor, no mid/far id overlap;
 *   - near live hulls stay <= NEAR_CAP (10-14), mid proxy capacity <= 40,
 *     far impostor capacity <= 256;
 *   - every visited system's authored cast is 25-50 records (Phase 2 cast
 *     growth) and the bank as first observed there is 25-50; the LIVE bank may
 *     drift wider because pre-existing #57 migration moves records between
 *     visited banks and #272 reaver replenishment appends replacement pirates,
 *     so drift is reported and only a wide sanity band is enforced;
 *   - dock lanes stay open under sustained flight: at least 8 completed
 *     dockings in the 10-minute window, bounded undock/dock retries;
 *   - no hail spam: at most one hail card at any sample and a bounded
 *     hailOpened count over the run;
 *   - zero console errors/exceptions and a stable runtime source hash;
 *   - the perf overlay stays attached and visible with the Phase 2 tier rows.
 *
 * Evidence lands in out/issue-339-live/sustained-flight/ (result.json from the
 * harness + evidence.json with every sample; untracked).
 *
 * Run: npm run build && node scripts/issue-339-live-probe.mjs
 * Smoke (dev server, shorter): ISSUE339_SERVE=dev ISSUE339_SAMPLE_SECONDS=45
 * node scripts/issue-339-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as os from 'node:os';

process.env.ISSUE74_OUT = process.env.ISSUE339_OUT || resolve('out/issue-339-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, sleep, out, repo } = await import('./issue-74-live-harness.mjs');

const PROBE = 'scripts/issue-339-live-probe.mjs';
const NAME = 'sustained-flight';
const folder = join(out, NAME);
const FULL_SAMPLE_SECONDS = 600; // 10 minutes of one-second samples
const SAMPLE_SECONDS = Number(process.env.ISSUE339_SAMPLE_SECONDS) || FULL_SAMPLE_SECONDS;
const FULL_RUN = SAMPLE_SECONDS >= 300;
const SERVE = process.env.ISSUE339_SERVE === 'dev' ? 'dev' : 'preview';
const MIN_SAMPLES = FULL_RUN ? 550 : Math.max(10, Math.floor(SAMPLE_SECONDS * 0.7));
const MIN_WALL_MS = FULL_RUN ? 590000 : Math.max(20000, (SAMPLE_SECONDS - 10) * 1000);
const MIN_LEGS = FULL_RUN ? 8 : (SAMPLE_SECONDS >= 100 ? 1 : 0);
const MAX_HAILS = FULL_RUN ? 60 : 20;
const DOCK_CANCEL_REASONS = new Set(['impact', 'blocked', 'stale', 'lost-station', 'dock-refused']);
const OVERLAY_LABELS = ['FRAME p50', 'LIVE NPC', 'MID PROXY', 'FAR IMPOSTOR', 'RECORDS'];

const state = {
  checks: {},
  samples: [],
  legs: [],
  route: {},
  hailOpened: [],
  transientDuplicates: [],
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
const stats = (xs) => ({
  median: median(xs), max: maxOf(xs), min: xs.length ? Math.min(...xs.filter(finite)) : null,
  last: xs.length ? xs[xs.length - 1] : null, samples: xs.length,
});

function aggregate() {
  const nums = (pathFn) => state.samples.map((s) => pathFn(s)).filter(finite);
  const frame = {};
  for (const k of ['p50', 'p95', 'p99', 'max']) frame[k] = stats(nums((s) => s.snapshot?.frame?.[k]));
  const renderer = {};
  for (const k of ['calls', 'triangles', 'points', 'lines', 'geometries', 'textures']) renderer[k] = stats(nums((s) => s.snapshot?.renderer?.[k]));
  const npc = {
    live: stats(nums((s) => s.snapshot?.npc?.live)),
    near: stats(nums((s) => s.snapshot?.npc?.near)),
    midLive: stats(nums((s) => s.snapshot?.npc?.mid)),
    farLive: stats(nums((s) => s.snapshot?.npc?.far)),
    recordsCurrent: stats(nums((s) => s.snapshot?.npc?.recordsCurrent)),
    recordsGalaxy: stats(nums((s) => s.snapshot?.npc?.recordsGalaxy)),
    midProxyVisible: stats(nums((s) => s.scene?.mid?.visibleCount)),
    midProxyCapacity: stats(nums((s) => s.scene?.mid?.capacity)),
    farImpostorVisible: stats(nums((s) => s.scene?.far?.visibleCount)),
    farImpostorCapacity: stats(nums((s) => s.scene?.far?.capacity)),
    authoredCast: stats(nums((s) => s.diag?.authoredCast)),
    bankSize: stats(nums((s) => s.diag?.bankSize)),
    bankCrowd: stats(nums((s) => s.diag?.bankCrowd)),
    bankReaver: stats(nums((s) => s.diag?.bankReaver)),
  };
  // The authored cast band (25-50) is a per-system design value. The LIVE bank
  // also drifts: pre-existing #57 migration moves records between visited banks
  // and #272 reaver replenishment appends replacement pirates. Record the
  // first observation per system (bank at load) separately from the drift so
  // the acceptance band is measured against the authored cast, not a transient
  // bank length.
  const firstBankBySystem = {};
  for (const s of state.samples) {
    const sys = s.system;
    if (!sys || firstBankBySystem[sys]) continue;
    firstBankBySystem[sys] = {
      wallMs: s.wallMs,
      authoredCast: s.diag?.authoredCast ?? null,
      bankSize: s.diag?.bankSize ?? null,
      bankCrowd: s.diag?.bankCrowd ?? null,
      bankReaver: s.diag?.bankReaver ?? null,
    };
  }
  const cpu = { renderMs: stats(nums((s) => s.snapshot?.cpu?.renderMs)), frameMs: stats(nums((s) => s.snapshot?.cpu?.frameMs)), systemsObserved: 0, topByAvgMs: [] };
  const byName = new Map();
  for (const s of state.samples) {
    for (const sys of s.snapshot?.cpu?.systems ?? []) {
      if (!sys || typeof sys.name !== 'string') continue;
      const rec = byName.get(sys.name) ?? { avg: [], p95: [], max: [] };
      if (finite(sys.avgMs)) rec.avg.push(sys.avgMs);
      if (finite(sys.p95Ms)) rec.p95.push(sys.p95Ms);
      if (finite(sys.maxMs)) rec.max.push(sys.maxMs);
      byName.set(sys.name, rec);
    }
  }
  cpu.systemsObserved = byName.size;
  cpu.topByAvgMs = [...byName.entries()].map(([name, r]) => ({
    name, avgMsMedian: median(r.avg), avgMsMax: maxOf(r.avg), p95MsMedian: median(r.p95), maxMsMax: maxOf(r.max), observedSamples: r.avg.length,
  })).sort((a, b) => (b.avgMsMedian ?? -1) - (a.avgMsMedian ?? -1)).slice(0, 10);
  const memory = { geometries: stats(nums((s) => s.snapshot?.memory?.geometries)), textures: stats(nums((s) => s.snapshot?.memory?.textures)), jsHeapUsedBytes: stats(nums((s) => s.snapshot?.memory?.jsHeapUsedBytes)) };
  const phaseCounts = {};
  for (const s of state.samples) phaseCounts[s.phase] = (phaseCounts[s.phase] ?? 0) + 1;
  const systems = {};
  for (const s of state.samples) if (s.system) systems[s.system] = (systems[s.system] ?? 0) + 1;
  const maxLiveIds = Math.max(...state.samples.map((s) => s.scene?.shipsCount ?? 0));
  return {
    sampleCount: state.samples.length,
    sampleWallMs: state.samples.length ? state.samples[state.samples.length - 1].wallMs : 0,
    frame, renderer, npc, cpu, memory, phaseCounts, systemsSeen: systems,
    legsCompleted: state.legs.filter((l) => l.completed).length,
    maxLiveIds,
    firstBankBySystem,
    hailOpenedCount: state.hailOpened.length,
    duplicateViolations: state.samples.reduce((n, s) => n + (s.scene?.duplicateViolations?.length ?? 0), 0),
    transientDuplicateSamples: state.transientDuplicates.length,
    overlayCheckedSamples: state.samples.filter((s) => s.overlay).length,
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
  const { access, readdir, stat } = await import('node:fs/promises');
  const root = join(repo, 'dist');
  const hasIndex = await access(join(root, 'index.html')).then(() => true).catch(() => false);
  if (!hasIndex) return { exists: false, root };
  const names = await readdir(root, { recursive: true });
  const assets = [];
  for (const rel of names) {
    const s = await stat(join(root, rel)).catch(() => null);
    if (s?.isFile()) assets.push({ path: rel.replaceAll('\\', '/'), bytes: s.size });
  }
  assets.sort((a, b) => a.path.localeCompare(b.path));
  return { exists: true, assetCount: assets.length, totalBytes: assets.reduce((n, a) => n + a.bytes, 0), indexHtml: assets.find((a) => a.path === 'index.html') ?? null, largest: [...assets].sort((a, b) => b.bytes - a.bytes).slice(0, 10) };
}

let result = null;
let runError = null;

async function fn({ c, result: runResult, act, observe, shot, baseUrl }) {
  runResult.fixture = false;
  runResult.method = 'Production preview build served by vite preview over dist/, loaded with ?agent=1&perf=1. Fresh Greenhand start, then a repeated Freehold<->Veridian dock/undock/plotRoute/engageAutopilot/queued-approachDock flight (lane -> gate -> jump -> dock) for '
    + SAMPLE_SECONDS + ' s with one sample per second. Reads window.__ctx.perf.snapshot(), the live scene tier layers, the HUD hail card and the agent observation.';
  runResult.assertionScope = 'PASS means the sustained flight ran for the requested window with one-second samples, the tier caps held, no record was drawn as both a hull and a proxy/impostor, the authored cast of every visited system (and its first observed bank) stayed 25-50 while the live bank stayed in a sane 20-80 band, dockings completed, hail stayed single-card, the console was clean and the runtime source hash was stable. It is not independent QA of the probe.';

  const snap = () => c.eval('window.__ctx.perf.snapshot()');
  const overlay = () => c.eval('(() => { const el = document.getElementById("perf-overlay"); if (!el) return { exists: false, display: null, visibility: null, text: "" }; const cs = getComputedStyle(el); return { exists: true, display: cs.display, visibility: cs.visibility, text: el.textContent ?? "" }; })()');
  const sceneInfo = () => c.eval('(() => { const ctx = window.__ctx; if (!ctx || !ctx.scene) return null; const find = (name) => ctx.scene.children.find((o) => o.name === name); const mid = find("mid-traffic-proxies"); const far = find("far-traffic-impostors"); const ships = Array.isArray(ctx.ships) ? ctx.ships : []; const ids = (arr) => Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []; const liveIds = ships.map((s) => s && s.record && typeof s.record.id === "string" ? s.record.id : null).filter(Boolean); const midIds = ids(mid?.userData?.visibleRecordIds); const farIds = ids(far?.userData?.visibleRecordIds); const overlap = (a, b) => { const bs = new Set(b); return a.filter((x) => bs.has(x)); }; const dupCount = (a) => a.length - new Set(a).size; const duplicateViolations = []; if (dupCount(liveIds) > 0) duplicateViolations.push("duplicate live hull ids"); if (dupCount(midIds) > 0) duplicateViolations.push("duplicate mid proxy ids"); if (dupCount(farIds) > 0) duplicateViolations.push("duplicate far impostor ids"); for (const id of overlap(liveIds, midIds)) duplicateViolations.push("live+mid " + id); for (const id of overlap(liveIds, farIds)) duplicateViolations.push("live+far " + id); for (const id of overlap(midIds, farIds)) duplicateViolations.push("mid+far " + id); return { system: ctx.world?.currentSystem ?? null, shipsCount: ships.length, liveIds, mid: mid ? { capacity: mid.userData?.capacity ?? mid.count ?? null, visibleCount: mid.userData?.visibleCount ?? null, instanceRecordIds: ids(mid.userData?.instanceRecordIds), visibleRecordIds: midIds, system: mid.userData?.system ?? null, lastRefreshAt: mid.userData?.lastRefreshAt ?? null, isInstancedMesh: mid.isInstancedMesh === true } : null, far: far ? { capacity: far.userData?.capacity ?? far.count ?? null, visibleCount: far.userData?.visibleCount ?? null, visibleRecordIds: farIds, system: far.userData?.system ?? null, isInstancedMesh: far.isInstancedMesh === true } : null, duplicateViolations }; })()');
  // Dock/blockage diagnostics: player and station pose, autopilot range, and
  // every live hull's role/record-state/distance. Written into each sample so a
  // dock-lane blockage can be attributed to a specific hull or body without
  // re-running the whole window.
  const diag = () => c.eval('(() => { const ctx = window.__ctx; if (!ctx) return null; const p = ctx.ship && ctx.ship.object ? ctx.ship.object.position : null; const ap = ctx.autopilot || {}; const st = ctx.config && ctx.config.world ? ctx.config.world.stationPosition : null; const ships = Array.isArray(ctx.ships) ? ctx.ships : []; const list = ships.map((s) => { const o = s && s.object ? s.object.position : null; const v = s && s.ai ? s.ai.velocity : null; const rec = s ? s.record : null; return { id: rec && typeof rec.id === "string" ? rec.id : null, role: s ? s.role : null, state: rec ? rec.state : null, d: o && p ? Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z) : null, x: o ? o.x : null, y: o ? o.y : null, z: o ? o.z : null, v: v ? Math.hypot(v.x, v.y, v.z) : null }; }).sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9)); const rocks = Array.isArray(ctx.asteroids && ctx.asteroids.list) ? ctx.asteroids.list : []; const rockList = rocks.map((a) => { const o = a && a.position; return { id: a && a.id, r: a && a.radius, d: o && p ? Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z) : null, x: o ? o.x : null, y: o ? o.y : null, z: o ? o.z : null }; }).sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9)).slice(0, 6); const sp = ctx.ship ? ctx.ship : null; const sv = sp && sp.velocity ? sp.velocity : null; const def = ctx.systems && ctx.world ? ctx.systems[ctx.world.currentSystem] : null; const cast = def && def.cast ? def.cast : {}; const crowd = def && def.crowd ? def.crowd : {}; const castTotal = (cast.traders | 0) + (cast.pirates | 0) + (cast.patrols | 0) + (cast.ace ? 1 : 0); const castMiners = Math.min(2, Math.max(0, ((cast.traders | 0) / 4) | 0)); const crowdTotal = (crowd.traders | 0) + (crowd.pirates | 0) + (crowd.patrols | 0) + (crowd.miners | 0); const authoredCast = castTotal + castMiners + crowdTotal; const bank = Array.isArray(ctx.world && ctx.world.records) ? ctx.world.records : []; const bankSize = bank.length; const bankCrowd = bank.filter((r) => r && typeof r.id === "string" && r.id.startsWith("crowd-")).length; const bankReaver = bank.filter((r) => r && r.reaverTier !== undefined).length; return { player: p ? { x: p.x, y: p.y, z: p.z } : null, speed: sv ? Math.hypot(sv.x, sv.y, sv.z) : null, station: st ? { x: st.x, y: st.y, z: st.z } : null, dockRange: Number.isFinite(ap.range) ? ap.range : null, dockProgress: Number.isFinite(ap.progress) ? ap.progress : null, dockStartRange: Number.isFinite(ap.startRange) ? ap.startRange : null, apPhase: ap.phase ?? null, apMode: ap.mode ?? null, apIdle: ap.idle === true, authoredCast, bankSize, bankCrowd, bankReaver, ships: list, rocks: rockList }; })()');
  const hailCardCount = () => c.eval("document.querySelectorAll('.rw-hail-card').length");
  const hailOpenFlag = () => c.eval('window.__ctx?.flags?.hailOpen === true');
  const actSoft = (name, args = {}) => act(name, args, false);

  // ---- Boot sanity: perf overlay + snapshot live, Phase 2 tier rows present.
  let overlayRead = null;
  for (let i = 0; i < 60; i++) {
    overlayRead = await overlay();
    if (overlayRead.exists && OVERLAY_LABELS.every((l) => overlayRead.text.includes(l))) break;
    await sleep(250);
  }
  assert.equal(overlayRead.exists, true, '#perf-overlay exists with ?perf=1');
  for (const label of OVERLAY_LABELS) assert.ok(overlayRead.text.includes(label), 'overlay contains ' + label + ': ' + overlayRead.text);
  let s0 = null;
  for (let i = 0; i < 60; i++) {
    s0 = await snap();
    if (s0?.frame?.samples > 0 && s0?.npc?.caps && s0?.npc?.midProxies) break;
    await sleep(250);
  }
  assert.ok(s0, 'perf snapshot returns after boot');
  assert.equal(s0.enabled, true, 'perf snapshot enabled');
  assert.equal(s0.visible, true, 'perf overlay visible');
  assert.ok(finite(s0.t), 'snapshot.t finite');
  assert.ok(finite(s0.npc?.live) && finite(s0.npc?.near), 'live/near counts sane');
  assert.ok(s0.npc?.caps && s0.npc.caps.near >= 10 && s0.npc.caps.near <= 14, 'near cap 10-14: ' + JSON.stringify(s0.npc?.caps));
  assert.ok(s0.npc.caps.mid >= 30 && s0.npc.caps.mid <= 40, 'mid cap 30-40');
  assert.ok(s0.npc.caps.far >= 150 && s0.npc.caps.far <= 300, 'far cap 150-300');
  assert.ok(s0.npc.midProxies && finite(s0.npc.midProxies.capacity) && s0.npc.midProxies.capacity <= 40, 'mid proxy capacity <= 40');
  assert.ok(s0.npc.farImpostors && finite(s0.npc.farImpostors.capacity) && s0.npc.farImpostors.capacity <= 256, 'far impostor capacity <= 256');
  const bootScene = await sceneInfo();
  assert.ok(bootScene, 'live scene reachable');
  assert.ok(bootScene.mid && bootScene.mid.isInstancedMesh === true, 'mid traffic layer is one instanced layer');
  assert.ok(bootScene.far && bootScene.far.isInstancedMesh === true, 'far traffic layer is one instanced layer');
  assert.ok(bootScene.mid.capacity <= 40, 'mid layer capacity <= 40');
  assert.ok(bootScene.far.capacity <= 256, 'far layer capacity <= 256');
  state.checks.boot = { snapshot: { enabled: s0.enabled, visible: s0.visible, npc: s0.npc }, overlayLabels: OVERLAY_LABELS, mid: bootScene.mid, far: bootScene.far };

  // ---- Settle docked at Freehold (fresh start can leave the hull just off berth).
  let o = await observe();
  const dockBegan = Date.now();
  while (!o.flags.docked && Date.now() - dockBegan < 60000) {
    const r = await actSoft(o.station?.inZone ? 'dock' : 'approachDock');
    if (!r.ok) await sleep(750);
    o = await observe();
  }
  assert.equal(o.flags.docked, true, 'fresh Greenhand start settles docked at Freehold');
  state.route.start = { simT: o.t, system: o.world.currentSystem, origin: o.world.origin ?? null };

  state.browser = await c.eval('({ userAgent: navigator.userAgent, hardwareConcurrency: Number(navigator.hardwareConcurrency) || null, deviceMemory: Number(navigator.deviceMemory) || null })');
  state.chromeVersion = await c.send('Browser.getVersion');
  state.gpu = await c.eval('(() => { const canvas = document.querySelector("canvas"); const g = canvas?.getContext("webgl2") || canvas?.getContext("webgl"); if (!g) return null; const e = g.getExtension("WEBGL_debug_renderer_info"); return { renderer: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER), vendor: e ? g.getParameter(e.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR) }; })()');

  // ---- Sustained flight: repeated Freehold <-> Veridian legs.
  let leg = null;
  let legIndex = 0;
  let undockRefusals = 0;
  let dockCancels = 0;
  const hailKeys = new Set();
  const sampleWallStart = Date.now();
  const deadline = sampleWallStart + SAMPLE_SECONDS * 1000;

  const completeLeg = (wallMs) => {
    leg.completed = true;
    leg.dockedAt = wallMs;
    leg.durationMs = Date.now() - leg.startedAt;
    state.legs.push({ ...leg });
    leg = null;
    if (state.legs.filter((l) => l.completed).length <= 3) shot('leg-' + state.legs.filter((l) => l.completed).length + '-docked').catch(() => {});
  };

  const startLeg = async (currentSystem) => {
    const to = currentSystem === 'veridian' ? 'freehold' : 'veridian';
    leg = { index: legIndex++, from: currentSystem, to, phase: 'undocking', startedAt: Date.now(), undockRefusals: 0, dockRetries: 0, idleRetries: 0 };
    const r = await actSoft('undock');
    if (!r.ok) { leg.undockRefusals++; undockRefusals++; }
  };

  const routeStep = async (obs) => {
    if (obs.flags?.docked === true) {
      if (leg && leg.phase === 'flying' && obs.world?.currentSystem === leg.to) completeLeg(Date.now() - sampleWallStart);
      else if (leg && leg.phase === 'undocking') {
        leg.undockRefusals++;
        undockRefusals++;
        const r = await actSoft('undock');
        if (r.ok) leg.undockOk = true;
      } else if (!leg) await startLeg(obs.world?.currentSystem);
      return;
    }
    if (!leg) {
      leg = { index: legIndex++, from: obs.world?.currentSystem, to: obs.world?.currentSystem === 'veridian' ? 'freehold' : 'veridian', phase: 'undocking', startedAt: Date.now(), undockRefusals: 0, dockRetries: 0, idleRetries: 0, undockOk: true };
    }
    if (leg.phase === 'undocking') {
      const plotted = await actSoft('plotRoute', { dest: leg.to });
      if (!plotted.ok) { leg.plotRefusals = (leg.plotRefusals ?? 0) + 1; return; }
      leg.plotted = true;
      const engaged = await actSoft('engageAutopilot');
      if (!engaged.ok) { leg.engageRefusals = (leg.engageRefusals ?? 0) + 1; return; }
      leg.engaged = true;
      const dock = await actSoft('approachDock');
      leg.queuedDock = dock.ok === true;
      leg.phase = 'flying';
      return;
    }
    if (leg.phase === 'flying') {
      if (obs.autopilot?.mode === 'dock' && obs.autopilot.engaged === false && DOCK_CANCEL_REASONS.has(obs.autopilot.reason)) {
        leg.dockRetries++;
        dockCancels++;
        if (leg.dockRetries <= 6) await actSoft('approachDock');
        return;
      }
      if (!obs.autopilot?.engaged && obs.gate?.jumping !== true && obs.autopilot?.mode !== 'dock' && !obs.autopilot?.queuedDock) {
        leg.idleRetries++;
        if (leg.idleRetries <= 6) await actSoft('approachDock');
      }
    }
  };

  for (let i = 0; Date.now() < deadline && i < SAMPLE_SECONDS; i++) {
    const due = sampleWallStart + i * 1000;
    const waitMs = due - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    const wallMs = Date.now() - sampleWallStart;
    const obs = await observe();
    const snapshot = await snap();
    let scene = await sceneInfo();
    // Mid proxies refresh at 8 Hz, so a record promoted to a live hull between
    // refreshes can be drawn twice for up to ~125 ms. Treat that as a transient
    // handoff frame, not a persistent duplicate: re-read after one refresh
    // window and only fail if the duplicate survives. Persistent duplicates are
    // a real layering bug; transient ones are counted and reported.
    if (scene?.duplicateViolations?.length) {
      const transient = scene.duplicateViolations.slice();
      await sleep(180);
      scene = await sceneInfo();
      if (scene?.duplicateViolations?.length) {
        throw Error('persistent duplicate hull/proxy at ' + wallMs + 'ms: ' + JSON.stringify(scene.duplicateViolations));
      }
      state.transientDuplicates.push({ wallMs, violations: transient });
    }
    const cardCount = await hailCardCount();
    const hailOpen = await hailOpenFlag();
    const overlayNow = i === 0 || i % 10 === 0 ? await overlay() : null;
    const events = Array.isArray(obs.events) ? obs.events : [];
    for (const ev of events) {
      if (ev?.type !== 'hailOpened') continue;
      const key = 'hailOpened:' + (ev.t ?? '') + ':' + (ev.targetId ?? '') + ':' + (ev.targetName ?? '');
      if (hailKeys.has(key)) continue;
      hailKeys.add(key);
      state.hailOpened.push({ wallMs, simT: obs.t, t: ev.t ?? null, targetId: ev.targetId ?? null, targetName: ev.targetName ?? null });
    }
    const sample = {
      i, wallMs, simT: obs.t, system: obs.world?.currentSystem ?? null, phase: phaseOf(obs),
      diag: await diag(),
      flags: { docked: obs.flags?.docked === true, jump: obs.gate?.jumping === true, berthHold: obs.flags?.berthHold === true },
      autopilot: { engaged: obs.autopilot?.engaged === true, mode: obs.autopilot?.mode ?? '', phase: obs.autopilot?.phase ?? '', reason: obs.autopilot?.reason ?? '', queuedDock: obs.autopilot?.queuedDock ?? null },
      gate: { inZone: obs.gate?.inZone === true, jumping: obs.gate?.jumping === true, to: obs.gate?.to ?? null },
      leg: leg ? { index: leg.index, from: leg.from, to: leg.to, phase: leg.phase } : null,
      snapshot, scene, hailCardCount: cardCount, hailOpen, overlay: overlayNow,
    };
    state.samples.push(sample);
    if (overlayNow) {
      assert.equal(overlayNow.exists, true, 'overlay exists during sampling at ' + wallMs + 'ms');
      assert.notEqual(overlayNow.display, 'none', 'overlay visible during sampling at ' + wallMs + 'ms');
      for (const label of OVERLAY_LABELS) assert.ok(overlayNow.text.includes(label), 'overlay label ' + label + ' present at ' + wallMs + 'ms');
    }
    if (cardCount > 1) throw Error('hail spam: ' + cardCount + ' hail cards at ' + wallMs + 'ms');
    await routeStep(obs);
  }
  if (leg) state.legs.push({ ...leg, completed: false });
  state.route.undockRefusals = undockRefusals;
  state.route.dockCancels = dockCancels;
  state.route.hailOpenedCount = state.hailOpened.length;

  state.aggregates = aggregate();
  runResult.aggregates = state.aggregates;
  runResult.route = {
    description: 'Fresh Greenhand start, docked at Freehold, then repeated Freehold <-> Veridian legs: undock -> plotRoute -> engageAutopilot -> queued approachDock (lane -> gate -> jump -> dock), sampled once per second.',
    start: state.route.start,
    legsCompleted: state.aggregates.legsCompleted,
    legsAttempted: state.legs.length,
    undockRefusals,
    dockCancels,
    hailOpenedCount: state.hailOpened.length,
  };
  runResult.checks = { boot: state.checks.boot, samples: state.aggregates.sampleCount, wallMs: state.aggregates.sampleWallMs, legsCompleted: state.aggregates.legsCompleted };
  console.log('SUSTAINED', JSON.stringify({
    samples: state.aggregates.sampleCount, wallMs: state.aggregates.sampleWallMs,
    frameP50: state.aggregates.frame.p50, frameP95: state.aggregates.frame.p95,
    calls: state.aggregates.renderer.calls, triangles: state.aggregates.renderer.triangles,
    npc: state.aggregates.npc, legs: state.aggregates.legsCompleted, undockRefusals, dockCancels,
    hails: state.aggregates.hailOpenedCount, phases: state.aggregates.phaseCounts, systems: state.aggregates.systemsSeen,
    duplicates: state.aggregates.duplicateViolations,
  }));

  // ---- Sustained-window assertions.
  assert.ok(state.samples.length >= MIN_SAMPLES, 'sampled ' + state.samples.length + ' >= ' + MIN_SAMPLES + ' one-second samples');
  assert.ok(state.aggregates.sampleWallMs >= MIN_WALL_MS, 'sustained ' + state.aggregates.sampleWallMs + ' ms >= ' + MIN_WALL_MS + ' ms');
  assert.ok(state.aggregates.legsCompleted >= MIN_LEGS, 'completed ' + state.aggregates.legsCompleted + ' dockings >= ' + MIN_LEGS);
  assert.equal(state.aggregates.duplicateViolations, 0, 'no persistent duplicate hulls/proxies');
  assert.ok(state.aggregates.transientDuplicateSamples <= Math.max(2, Math.ceil(state.samples.length * 0.02)),
    'transient (sub-125ms handoff) duplicate samples ' + state.aggregates.transientDuplicateSamples + ' <= 2% of ' + state.samples.length);
  assert.ok(state.aggregates.hailOpenedCount <= MAX_HAILS, 'hailOpened ' + state.aggregates.hailOpenedCount + ' <= ' + MAX_HAILS);
  for (const s of state.samples) {
    const n = s.snapshot?.npc ?? {};
    assert.ok(finite(n.live) && n.live <= n.caps?.near, 'live hulls ' + n.live + ' <= near cap ' + n.caps?.near + ' at ' + s.wallMs + 'ms');
    assert.ok(finite(n.near) && n.near <= n.caps?.near, 'near hulls <= near cap at ' + s.wallMs + 'ms');
    // Issue #339 acceptance: every system carries a 25-50 authored cast. The
    // LIVE bank also drifts beyond that band because pre-existing #57 migration
    // moves records between visited banks and #272 reaver replenishment appends
    // replacement pirates. Measure the design band on the authored cast (and on
    // each system's first observation below); keep a wide sanity bound on the
    // live bank so a collapse or runaway still fails instead of hiding.
    assert.ok(s.diag?.authoredCast >= 25 && s.diag?.authoredCast <= 50, 'authored cast ' + s.diag?.authoredCast + ' in 25-50 at ' + s.wallMs + 'ms');
    assert.ok(n.recordsCurrent >= 20 && n.recordsCurrent <= 80, 'live bank ' + n.recordsCurrent + ' in sanity 20-80 at ' + s.wallMs + 'ms');
    assert.ok(n.midProxies?.capacity <= 40 && n.farImpostors?.capacity <= 256, 'presentation caps at ' + s.wallMs + 'ms');
    assert.ok((n.midProxies?.visible ?? 0) <= (n.midProxies?.capacity ?? 0), 'mid visible <= capacity at ' + s.wallMs + 'ms');
    assert.ok((n.farImpostors?.visible ?? 0) <= (n.farImpostors?.capacity ?? 0), 'far visible <= capacity at ' + s.wallMs + 'ms');
    assert.equal(s.hailCardCount <= 1, true, 'at most one hail card at ' + s.wallMs + 'ms');
  }
  assert.ok(state.aggregates.npc.midProxyVisible.max > 0, 'mid proxies were visible at least once (max ' + state.aggregates.npc.midProxyVisible.max + ')');
  // The band is asserted where the design guarantees it: the authored cast and
  // the bank as first observed in each visited system (bank built from cast).
  for (const [sys, first] of Object.entries(state.aggregates.firstBankBySystem)) {
    assert.ok(first.authoredCast >= 25 && first.authoredCast <= 50, sys + ' authored cast ' + first.authoredCast + ' in 25-50');
    assert.ok(first.bankSize >= 25 && first.bankSize <= 50, sys + ' first observed bank ' + first.bankSize + ' in 25-50');
  }
  if (FULL_RUN) assert.ok(Object.keys(state.aggregates.firstBankBySystem).length >= 2, 'visited at least two systems (got ' + Object.keys(state.aggregates.firstBankBySystem).length + ')');
  console.log('CAST/BANK', JSON.stringify({ authoredCast: state.aggregates.npc.authoredCast, bankSize: state.aggregates.npc.bankSize, bankCrowd: state.aggregates.npc.bankCrowd, bankReaver: state.aggregates.npc.bankReaver, firstBankBySystem: state.aggregates.firstBankBySystem }));
}

try {
  result = await runLive(NAME, fn, { query: '&perf=1', serve: SERVE });
} catch (e) {
  runError = e;
}

await mkdir(folder, { recursive: true });
const dist = await distMetadata();
const evidence = {
  issue: 339,
  title: '[AI] Population tiering: abstract growth, mid-tier instanced proxies, and AI tick LOD (system scale/population Phase 2)',
  probe: PROBE,
  probeName: NAME,
  generatedAt: new Date().toISOString(),
  runMode: { serve: SERVE, sampleSeconds: SAMPLE_SECONDS, fullRun: FULL_RUN },
  route: { ...state.route, legs: state.legs },
  build: {
    headCommit: result?.headCommit ?? null,
    sourceHashStart: result?.sourceHashStart ?? null,
    sourceHashEnd: result?.sourceHashEnd ?? null,
    sourceStable: result?.sourceStable ?? null,
    identityMode: result?.identityMode ?? null,
    workingTreeDirty: result?.workingTreeDirty ?? null,
    runtimeSourceDirty: result?.runtimeSourceDirty ?? null,
    serve: result?.serve ?? SERVE,
    query: result?.query ?? '&perf=1',
    rendererConfig: result?.rendererConfig ?? null,
    dist,
  },
  source: {
    repo, nodeVersion: process.version, platform: process.platform, platformRelease: os.release(), arch: os.arch(),
    cpuModel: os.cpus()[0]?.model ?? null, cpuCount: os.cpus().length, totalMemoryBytes: os.totalmem(),
  },
  browser: { ...(state.browser ?? {}), chromeVersion: state.chromeVersion ?? null, gpu: state.gpu ?? null },
  run: { started: result?.started ?? null, finished: result?.finished ?? null, port: result?.port ?? null, profile: result?.profile ?? null, cdpPort: result?.cdpPort ?? null, samplingSeconds: SAMPLE_SECONDS },
  samples: state.samples,
  aggregates: state.aggregates,
  hailOpened: state.hailOpened,
  transientDuplicates: state.transientDuplicates,
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
  console.error('ISSUE 339 SUSTAINED PROBE FAILED', evidence.error ?? '');
  process.exitCode = 1;
}
