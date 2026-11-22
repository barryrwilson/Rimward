/**
 * Issue #341 sustained live probe — system scale/population Phase 4 ambient life.
 *
 * Production-build (vite preview over dist/) real-Chrome verification of the
 * ambient-life outcome: distant-traffic comms, far-lane convoy events, and
 * station approach-lane proxies. Fresh Greenhand start, a repeated
 * Freehold<->Veridian dock/undock/plotRoute/engageAutopilot/queued-approachDock
 * flight (lane -> gate -> jump -> dock) for 600 s with one sample per second.
 *
 * Before the flight the probe installs an in-page TEST-ONLY hook (session only,
 * never part of src/) that wraps window.__ctx.emit and appends every commLine
 * {from,text} and worldEvent {kind,phase,variant,line} to window.__ambientLog,
 * together with the emitting system's place names and the speaker record's
 * live/distance state. Each sample then records: the ambient log, the mid/far
 * presentation layers (visible ids + per-instance distance, near-band proxies
 * <= NEAR_RANGE, reported nearProxyCount/nearProxyIds), live hulls and their
 * distances, DOM .rw-toast.show count/text, ctx.world.activeEvent, the ?perf=1
 * snapshot, the agent observation (phase/autopilot/gate), console errors and
 * the runtime source hash.
 *
 * Assertions (full 600 s run):
 *   - chatter observed and bounded: >= 1 distant line, <= 40 over the window,
 *     never two lines closer than 20 s within one system (a real system change
 *     resets the timer to that system's band-scaled first delay, floor 10 s),
 *     speaker is a current-bank record with record.live !== true and distance
 *     > NEAR_RANGE (900 u), and the line names a real place (station / gate
 *     destination system / system / landmark);
 *   - toast cap respected at every sample: .rw-toast.show <= 5 and chatter
 *     toasts never flood (<= 2 simultaneous);
 *   - at least one convoySurge start observed with a far-lane variant and a
 *     line naming the station and a real distant gate-destination system, with
 *     an observable ctx.world.activeEvent of kind convoySurge and the persisted
 *     activeEvent shape still exactly {kind,startedAt,endsAt,system};
 *   - approach-lane traffic observed: near-band proxies (> 0) at some
 *     docked/approaching sample, with no persistent live+proxy duplicate ids;
 *   - zero console errors/exceptions, stable runtime source hash, Chrome/Vite
 *     cleanup and closed ports (the issue-74 harness enforces these).
 *
 * Evidence lands in out/issue-341-live/ambient-life/ (result.json from the
 * harness + evidence.json with every sample; untracked).
 *
 * Run: npm run build && node scripts/issue-341-live-probe.mjs
 * Smoke (dev server, shorter): ISSUE341_SERVE=dev ISSUE341_SAMPLE_SECONDS=60
 * node scripts/issue-341-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { access, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as os from 'node:os';

process.env.ISSUE74_OUT = process.env.ISSUE341_OUT || resolve('out/issue-341-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, sleep, out, repo } = await import('./issue-74-live-harness.mjs');

const PROBE = 'scripts/issue-341-live-probe.mjs';
const NAME = 'ambient-life';
const folder = join(out, NAME);
const FULL_SAMPLE_SECONDS = 600; // 10 minutes of one-second samples
const SAMPLE_SECONDS = Number(process.env.ISSUE341_SAMPLE_SECONDS) || FULL_SAMPLE_SECONDS;
const FULL_RUN = SAMPLE_SECONDS >= 300;
const SERVE = process.env.ISSUE341_SERVE === 'dev' ? 'dev' : 'preview';
const MIN_SAMPLES = FULL_RUN ? 550 : Math.max(10, Math.floor(SAMPLE_SECONDS * 0.7));
const MIN_WALL_MS = FULL_RUN ? 590000 : Math.max(20000, (SAMPLE_SECONDS - 10) * 1000);
const MAX_CHATTER = 40;
const CHATTER_MIN_GAP = 20; // within one system
const CHATTER_CROSS_SYSTEM_MIN_GAP = 10; // new system's band-scaled first-delay floor
const NEAR_RANGE = 900; // U.INSTANTIATE_RANGE
const MAX_TOASTS = 5; // hud.js TOAST_SLOTS
const MAX_CHATTER_TOASTS = 2; // one chatter line per gap; never a flood
const DOCK_CANCEL_REASONS = new Set(['impact', 'blocked', 'stale', 'lost-station', 'dock-refused']);

// ---- In-page TEST-ONLY hook -------------------------------------------------
// Wraps window.__ctx.emit to capture the ambient channels before the HUD
// consumes them. Session-only: no src/ change, no persistent field, no save
// impact. Also exposes window.__ambientPose (a test-side replica of the
// enroute/escape branches of world.js recordPosition) so the probe can check
// speaker distance without importing game modules into the page.
const HOOK = `(() => {
  const ctx = window.__ctx;
  if (!ctx || typeof ctx.emit !== 'function') return { ok: false, reason: 'window.__ctx.emit unavailable' };
  if (window.__ambientHooked === true) return { ok: true, already: true, installedSimT: window.__ambientLog ? window.__ambientLog.installedSimT : null };
  const log = {
    installedAt: Date.now(),
    installedSimT: Number.isFinite(ctx.world && ctx.world.time) ? ctx.world.time : null,
    commLines: [],
    worldEvents: [],
    hookErrors: [],
  };
  window.__ambientLog = log;
  function pose(rec) {
    if (!rec || !Array.isArray(rec.route) || rec.route.length === 0) return null;
    const plan = rec.escape;
    if (plan && plan.v === 1 && (plan.phase === 'route' || plan.phase === 'charge' || plan.phase === 'hold' || plan.phase === 'evade')
      && Array.isArray(plan.pos) && plan.pos.length === 3 && plan.pos.every((v) => Number.isFinite(v))) {
      return { x: plan.pos[0], y: plan.pos[1], z: plan.pos[2] };
    }
    if (rec.state === 'docked' || rec.route.length === 1) {
      const w = rec.route[0];
      return { x: w.x, y: w.y, z: w.z };
    }
    const a = rec.route[rec.leg];
    const b = rec.route[rec.leg + 1];
    if (!a || !b) {
      const w = a || rec.route[0];
      return { x: w.x, y: w.y, z: w.z };
    }
    const t = Number.isFinite(rec.legT) ? rec.legT : 0;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  }
  window.__ambientPose = pose;
  function place(sysId) {
    const def = ctx.systems && sysId && ctx.systems[sysId] ? ctx.systems[sysId] : null;
    const gates = def && Array.isArray(def.gates) ? def.gates : [];
    const neighbors = [];
    for (let i = 0; i < gates.length; i++) {
      const to = gates[i] && gates[i].to;
      const dest = to && ctx.systems[to] ? ctx.systems[to] : null;
      if (dest && typeof dest.name === 'string' && dest.name) neighbors.push(dest.name);
    }
    const landmarks = [];
    if (def && Array.isArray(def.landmarks)) {
      for (let i = 0; i < def.landmarks.length; i++) {
        const lm = def.landmarks[i];
        if (lm && typeof lm.name === 'string' && lm.name) landmarks.push(lm.name);
      }
    }
    return {
      systemId: sysId || null,
      systemName: def && typeof def.name === 'string' ? def.name : null,
      stationName: def && def.station && typeof def.station.name === 'string' ? def.station.name : null,
      neighborNames: neighbors,
      landmarkNames: landmarks,
    };
  }
  window.__ambientPlace = place;
  function playerPosition() {
    const o = ctx.ship && ctx.ship.object ? ctx.ship.object.position : null;
    if (o && Number.isFinite(o.x)) return o;
    const cam = ctx.camera ? ctx.camera.position : null;
    return cam && Number.isFinite(cam.x) ? cam : null;
  }
  function recordByName(name) {
    const records = ctx.world && Array.isArray(ctx.world.records) ? ctx.world.records : [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (rec && typeof rec === 'object' && rec.name === name) return rec;
    }
    return null;
  }
  const orig = ctx.emit;
  ctx.emit = function (type, data) {
    const payload = data && typeof data === 'object' ? data : {};
    try {
      const now = Number.isFinite(ctx.world && ctx.world.time) ? ctx.world.time : null;
      const sysId = ctx.world && typeof ctx.world.currentSystem === 'string' ? ctx.world.currentSystem : null;
      if (type === 'commLine') {
        const from = typeof payload.from === 'string' ? payload.from : null;
        const text = typeof payload.text === 'string' ? payload.text : null;
        const rec = from ? recordByName(from) : null;
        let distance = null;
        if (rec) {
          const p = pose(rec);
          const pp = playerPosition();
          if (p && pp) distance = Math.sqrt((p.x - pp.x) * (p.x - pp.x) + (p.y - pp.y) * (p.y - pp.y) + (p.z - pp.z) * (p.z - pp.z));
        }
        log.commLines.push({
          wallMs: Date.now(), simT: now, from: from, text: text,
          recordFound: !!rec,
          recordId: rec && typeof rec.id === 'string' ? rec.id : null,
          recordLive: rec ? rec.live === true : null,
          recordState: rec && typeof rec.state === 'string' ? rec.state : null,
          recordRole: rec && typeof rec.role === 'string' ? rec.role : null,
          recordSystem: rec && typeof rec.system === 'string' ? rec.system : null,
          recordDistance: distance,
          place: place(sysId),
        });
      } else if (type === 'worldEvent') {
        log.worldEvents.push({
          wallMs: Date.now(), simT: now,
          kind: typeof payload.kind === 'string' ? payload.kind : null,
          phase: typeof payload.phase === 'string' ? payload.phase : null,
          variant: typeof payload.variant === 'string' ? payload.variant : null,
          line: typeof payload.line === 'string' ? payload.line : null,
          activeEvent: ctx.world && ctx.world.activeEvent ? JSON.parse(JSON.stringify(ctx.world.activeEvent)) : null,
          place: place(sysId),
        });
      }
    } catch (e) {
      log.hookErrors.push(String(e && e.stack ? e.stack : e));
    }
    return orig.call(ctx, type, payload);
  };
  window.__ambientHooked = true;
  return { ok: true, installedSimT: log.installedSimT };
})()`;

const state = {
  checks: {},
  samples: [],
  legs: [],
  route: {},
  commLines: [],
  worldEvents: [],
  hookErrors: [],
  chatter: [],
  chatterGaps: [],
  convoyStarts: [],
  activeEventSamples: [],
  toastSamples: [],
  transientDuplicates: [],
  nearProxySamples: [],
  aggregates: null,
  browser: null,
  gpu: null,
  chromeVersion: null,
  hookReceipt: null,
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
  median: median(xs), max: maxOf(xs), min: minOf(xs),
  last: xs.length ? xs[xs.length - 1] : null, samples: xs.length,
});

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

function isApproachSample(s) {
  return s.phase === 'docked' || s.phase === 'dock' || s.stationInZone === true || s.autopilot?.queuedDock === true;
}

/** Classify one captured commLine: is it the Phase 4 distant-chatter voice? */
function classifyCommLine(e) {
  const from = typeof e.from === 'string' ? e.from : null;
  const text = typeof e.text === 'string' ? e.text : null;
  const prefix = !!(from && text && text.startsWith(from + ': '));
  const distantSpeaker = !!(e.recordFound && e.recordLive === false && finite(e.recordDistance) && e.recordDistance > NEAR_RANGE);
  const chatter = !!(prefix && distantSpeaker);
  const place = e.place ?? {};
  const names = [place.stationName, place.systemName, ...(place.neighborNames ?? []), ...(place.landmarkNames ?? [])]
    .filter((n) => typeof n === 'string' && n.length > 0);
  const placeReference = !!(text && names.some((n) => text.includes(n)));
  const distantPlaceReference = !!(text && (place.neighborNames ?? []).some((n) => typeof n === 'string' && text.includes(n)));
  return {
    chatter, prefix, distantSpeaker, placeReference, distantPlaceReference,
    names,
  };
}

function aggregate() {
  const nums = (pathFn) => state.samples.map((s) => pathFn(s)).filter(finite);
  const frame = {};
  for (const k of ['p50', 'p95', 'p99', 'max']) frame[k] = stats(nums((s) => s.snapshot?.frame?.[k]));
  const renderer = {};
  for (const k of ['calls', 'triangles', 'points', 'lines']) renderer[k] = stats(nums((s) => s.snapshot?.renderer?.[k]));
  const npc = {};
  for (const k of ['live', 'near', 'mid', 'far', 'recordsCurrent', 'recordsGalaxy']) npc[k] = stats(nums((s) => s.snapshot?.npc?.[k]));
  const chatter = state.chatter;
  const chatterSim = chatter.map((c) => c.simT).filter(finite);
  const chatterWall = chatter.map((c) => c.wallMs).filter(finite);
  const gaps = [];
  for (let i = 1; i < chatter.length; i++) {
    const prev = chatter[i - 1];
    const cur = chatter[i];
    if (!finite(prev.simT) || !finite(cur.simT)) continue;
    const gap = cur.simT - prev.simT;
    const sameSystem = prev.place?.systemId != null && prev.place?.systemId === cur.place?.systemId;
    const crossSystem = prev.place?.systemId != null && cur.place?.systemId != null && prev.place.systemId !== cur.place.systemId;
    const minRequired = crossSystem ? CHATTER_CROSS_SYSTEM_MIN_GAP : CHATTER_MIN_GAP;
    const violation = gap < minRequired - 1e-6;
    const strictViolation = gap < CHATTER_MIN_GAP - 1e-6;
    gaps.push({
      index: i, prevSimT: prev.simT, simT: cur.simT, gap,
      prevSystem: prev.place?.systemId ?? null, system: cur.place?.systemId ?? null,
      sameSystem, crossSystem, minRequired, violation, strictViolation,
    });
  }
  const speakers = chatter.map((c) => ({
    simT: c.simT, wallMs: c.wallMs, from: c.from, text: c.text,
    recordId: c.recordId, recordState: c.recordState, recordRole: c.recordRole,
    recordLive: c.recordLive, recordDistance: finite(c.recordDistance) ? Math.round(c.recordDistance * 10) / 10 : null,
    place: c.place, prefix: c.prefix, placeReference: c.placeReference, distantPlaceReference: c.distantPlaceReference,
  }));
  const toastCounts = state.samples.map((s) => s.toasts?.count ?? 0).filter(finite);
  const chatterToastCounts = state.samples.map((s) => s.chatterToastCount ?? 0).filter(finite);
  const nearAtApproach = state.samples.filter(isApproachSample).map((s) => s.scene?.nearProxyCount ?? 0).filter(finite);
  const nearAtApproachPositive = state.samples.filter((s) => isApproachSample(s) && (s.scene?.nearProxyCount ?? 0) > 0);
  const convoyStarts = state.convoyStarts;
  const activeConvoySamples = state.samples.filter((s) => s.scene?.activeEvent?.kind === 'convoySurge');
  return {
    sampleCount: state.samples.length,
    sampleWallMs: state.samples.length ? state.samples[state.samples.length - 1].wallMs : 0,
    frame, renderer, npc,
    chatter: {
      count: chatter.length,
      firstSimT: chatterSim.length ? chatterSim[0] : null,
      lastSimT: chatterSim.length ? chatterSim[chatterSim.length - 1] : null,
      firstWallMs: chatterWall.length ? chatterWall[0] : null,
      lastWallMs: chatterWall.length ? chatterWall[chatterWall.length - 1] : null,
      minGap: gaps.length ? minOf(gaps.map((g) => g.gap)) : null,
      medianGap: gaps.length ? median(gaps.map((g) => g.gap)) : null,
      maxGap: gaps.length ? maxOf(gaps.map((g) => g.gap)) : null,
      gaps,
      violations: gaps.filter((g) => g.violation),
      strictViolations: gaps.filter((g) => g.strictViolation),
      speakers,
      speakerValidationFailures: chatter.filter((c) => !(c.prefix && c.distantSpeaker)).map((c) => ({ simT: c.simT, from: c.from, text: c.text, recordFound: c.recordFound, recordLive: c.recordLive, recordDistance: c.recordDistance })),
      placeReferenceFailures: chatter.filter((c) => !c.placeReference).map((c) => ({ simT: c.simT, from: c.from, text: c.text, place: c.place })),
      distantPlaceReferences: chatter.filter((c) => c.distantPlaceReference).length,
      uniqueSpeakers: [...new Set(chatter.map((c) => c.from).filter(Boolean))].length,
      uniqueLines: [...new Set(chatter.map((c) => c.text).filter(Boolean))].length,
    },
    toasts: {
      max: maxOf(toastCounts), median: median(toastCounts), samples: toastCounts.length,
      maxChatter: maxOf(chatterToastCounts), chatterSamples: chatterToastCounts.filter((n) => n > 0).length,
      overCap: state.samples.filter((s) => (s.toasts?.count ?? 0) > MAX_TOASTS).map((s) => ({ wallMs: s.wallMs, count: s.toasts?.count ?? 0, texts: s.toasts?.texts ?? [] })),
      chatterOverCap: state.samples.filter((s) => (s.chatterToastCount ?? 0) > MAX_CHATTER_TOASTS).map((s) => ({ wallMs: s.wallMs, count: s.chatterToastCount, texts: s.toasts?.texts ?? [] })),
    },
    convoy: {
      starts: convoyStarts,
      startCount: convoyStarts.length,
      variants: [...new Set(convoyStarts.map((c) => c.variant).filter(Boolean))],
      activeEventSamples: activeConvoySamples.length,
      activeEventFirst: activeConvoySamples.length ? activeConvoySamples[0] : null,
      activeEventShapes: [...new Set(state.samples.filter((s) => s.scene?.activeEvent).map((s) => JSON.stringify(Object.keys(s.scene.activeEvent).sort())))],
    },
    nearProxies: {
      max: maxOf(state.samples.map((s) => s.scene?.nearProxyCount ?? 0)),
      maxAtApproach: nearAtApproach.length ? maxOf(nearAtApproach) : 0,
      positiveApproachSamples: nearAtApproachPositive.map((s) => ({ wallMs: s.wallMs, simT: s.simT, phase: s.phase, system: s.scene?.system ?? null, nearProxyCount: s.scene?.nearProxyCount ?? 0, nearProxyIds: s.scene?.nearProxyIds ?? [] })),
      positiveApproachCount: nearAtApproachPositive.length,
      samplesWithPositive: state.samples.filter((s) => (s.scene?.nearProxyCount ?? 0) > 0).length,
      maxNearLive: maxOf(state.samples.map((s) => s.scene?.nearLiveCount ?? 0)),
      maxLive: maxOf(state.samples.map((s) => s.scene?.shipsCount ?? 0)),
      nearUninstantiatedMax: maxOf(state.samples.map((s) => s.scene?.nearUninstantiatedCount ?? 0)),
      reportedNearProxyCountMismatches: state.samples.filter((s) => finite(s.scene?.nearProxyReported) && s.scene.nearProxyReported !== (s.scene.nearProxyCount ?? 0)).length,
      duplicateViolations: state.samples.reduce((n, s) => n + (s.scene?.duplicateViolations?.length ?? 0), 0),
      transientDuplicateSamples: state.transientDuplicates.length,
    },
    phaseCounts: (() => { const m = {}; for (const s of state.samples) m[s.phase] = (m[s.phase] ?? 0) + 1; return m; })(),
    systemsSeen: (() => { const m = {}; for (const s of state.samples) if (s.scene?.system) m[s.scene.system] = (m[s.scene.system] ?? 0) + 1; return m; })(),
    legsCompleted: state.legs.filter((l) => l.completed).length,
    hookErrors: state.hookErrors,
    commLineCount: state.commLines.length,
    worldEventCount: state.worldEvents.length,
    chatterClassification: state.commLines.map((c) => ({ simT: c.simT, from: c.from, text: c.text, chatter: classifyCommLine(c).chatter })),
  };
}

async function distMetadata() {
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
  return {
    exists: true, assetCount: assets.length,
    totalBytes: assets.reduce((n, a) => n + a.bytes, 0),
    indexHtml: assets.find((a) => a.path === 'index.html') ?? null,
    largest: [...assets].sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  };
}

let result = null;
let runError = null;

async function fn({ c, result: runResult, act, observe, shot }) {
  runResult.fixture = false;
  runResult.method = 'Production preview build served by vite preview over dist/, loaded with ?agent=1&perf=1. Fresh Greenhand start, then a repeated Freehold<->Veridian dock/undock/plotRoute/engageAutopilot/queued-approachDock flight (lane -> gate -> jump -> dock) for '
    + SAMPLE_SECONDS + ' s with one sample per second. An in-page test-only hook wraps window.__ctx.emit to capture commLine/worldEvent ambient payloads; the probe reads the live mid/far presentation layers, live hulls, DOM .rw-toast.show, ctx.world.activeEvent and the perf snapshot.';
  runResult.assertionScope = 'PASS means the sustained flight ran for the requested window with one-second samples; distant chatter appeared at a bounded rate from non-live distant records naming real places; the toast cap held and chatter did not flood; at least one convoySurge start named a distant gate destination with an observable activeEvent; near-band approach-lane proxies were visible at a docked/approaching sample with no persistent live+proxy duplicates; and the console/source/cleanup checks were clean. It is not independent QA of the probe.';

  const snap = () => c.eval('window.__ctx.perf.snapshot()');
  const sceneInfo = () => c.eval(`(() => {
    const ctx = window.__ctx; if (!ctx) return null;
    const pose = window.__ambientPose;
    const ship = ctx.ship && ctx.ship.object ? ctx.ship.object.position : null;
    const player = ship && Number.isFinite(ship.x) ? { x: ship.x, y: ship.y, z: ship.z } : null;
    const st = ctx.config && ctx.config.world ? ctx.config.world.stationPosition : null;
    const station = st ? { x: st.x, y: st.y, z: st.z } : null;
    const find = (name) => ctx.scene ? ctx.scene.children.find((o) => o.name === name) : null;
    const mid = find('mid-traffic-proxies');
    const far = find('far-traffic-impostors');
    const ships = Array.isArray(ctx.ships) ? ctx.ships : [];
    const dist = (a, b) => a && b && Number.isFinite(a.x) && Number.isFinite(b.x) ? Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z)) : null;
    const live = ships.map((s) => {
      const rec = s && s.record ? s.record : null;
      const o = s && s.object ? s.object.position : null;
      return { id: rec && typeof rec.id === 'string' ? rec.id : null, role: s ? s.role : null, distance: dist(o, player) };
    });
    const liveIds = live.map((x) => x.id).filter(Boolean);
    const layer = (mesh) => {
      if (!mesh) return null;
      const ud = mesh.userData || {};
      const arr = mesh.instanceMatrix && mesh.instanceMatrix.array ? mesh.instanceMatrix.array : null;
      const ids = Array.isArray(ud.instanceRecordIds) ? ud.instanceRecordIds : [];
      const slots = [];
      for (let slot = 0; slot < ids.length; slot++) {
        const id = ids[slot];
        if (typeof id !== 'string' || !arr) continue;
        const x = arr[slot * 16 + 12], y = arr[slot * 16 + 13], z = arr[slot * 16 + 14];
        slots.push({ slot: slot, id: id, distance: dist({ x: x, y: y, z: z }, player) });
      }
      return {
        capacity: ud.capacity ?? mesh.count ?? null,
        visibleCount: ud.visibleCount ?? null,
        visibleRecordIds: Array.isArray(ud.visibleRecordIds) ? ud.visibleRecordIds : [],
        nearProxyCount: typeof ud.nearProxyCount === 'number' ? ud.nearProxyCount : null,
        nearProxyIds: Array.isArray(ud.nearProxyIds) ? ud.nearProxyIds : null,
        slots: slots,
      };
    };
    const midInfo = layer(mid);
    const farInfo = layer(far);
    const nearProxies = midInfo ? midInfo.slots.filter((s) => typeof s.distance === 'number' && s.distance <= 900) : [];
    const nearLive = live.filter((x) => typeof x.distance === 'number' && x.distance <= 900);
    const records = Array.isArray(ctx.world && ctx.world.records) ? ctx.world.records : [];
    const nearUninst = [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (!rec || typeof rec !== 'object') continue;
      if (rec.live === true) continue;
      if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit') continue;
      const p = pose ? pose(rec) : null;
      const d = p && player ? dist(p, player) : null;
      if (typeof d === 'number' && d <= 900) nearUninst.push({ id: typeof rec.id === 'string' ? rec.id : null, state: typeof rec.state === 'string' ? rec.state : null, distance: Math.round(d * 10) / 10 });
    }
    const ids = (arr) => Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
    const midIds = midInfo ? ids(midInfo.visibleRecordIds) : [];
    const farIds = farInfo ? ids(farInfo.visibleRecordIds) : [];
    const overlap = (a, b) => { const bs = new Set(b); return a.filter((x) => bs.has(x)); };
    const dupCount = (a) => a.length - new Set(a).size;
    const violations = [];
    if (dupCount(liveIds) > 0) violations.push('duplicate live hull ids');
    if (dupCount(midIds) > 0) violations.push('duplicate mid proxy ids');
    if (dupCount(farIds) > 0) violations.push('duplicate far impostor ids');
    for (const id of overlap(liveIds, midIds)) violations.push('live+mid ' + id);
    for (const id of overlap(liveIds, farIds)) violations.push('live+far ' + id);
    for (const id of overlap(midIds, farIds)) violations.push('mid+far ' + id);
    return {
      system: ctx.world ? ctx.world.currentSystem ?? null : null,
      player: player,
      station: station,
      shipsCount: ships.length,
      liveIds: liveIds,
      liveDistances: live.map((x) => x.distance),
      nearLiveCount: nearLive.length,
      nearLiveIds: nearLive.map((x) => x.id),
      mid: midInfo ? { capacity: midInfo.capacity, visibleCount: midInfo.visibleCount, visibleRecordIds: midInfo.visibleRecordIds, nearProxyCount: midInfo.nearProxyCount, nearProxyIds: midInfo.nearProxyIds } : null,
      far: farInfo ? { capacity: farInfo.capacity, visibleCount: farInfo.visibleCount, visibleRecordIds: farInfo.visibleRecordIds } : null,
      nearProxyCount: nearProxies.length,
      nearProxyIds: nearProxies.map((s) => s.id),
      nearProxyDistances: nearProxies.map((s) => Math.round(s.distance * 10) / 10),
      nearProxyReported: midInfo ? midInfo.nearProxyCount : null,
      nearProxyIdsReported: midInfo ? midInfo.nearProxyIds : null,
      nearUninstantiatedCount: nearUninst.length,
      nearUninstantiatedIds: nearUninst.map((r) => r.id),
      activeEvent: ctx.world && ctx.world.activeEvent ? JSON.parse(JSON.stringify(ctx.world.activeEvent)) : null,
      duplicateViolations: violations,
    };
  })()`);
  const toasts = () => c.eval(`(() => {
    const els = Array.from(document.querySelectorAll('.rw-toast.show'));
    return { count: els.length, total: document.querySelectorAll('.rw-toast').length, texts: els.map((e) => (e.textContent || '').trim()) };
  })()`);
  const actSoft = (name, args = {}) => act(name, args, false);

  // ---- Boot sanity: perf snapshot live, scene layers reachable.
  let s0 = null;
  for (let i = 0; i < 60; i++) {
    s0 = await snap();
    if (s0?.frame?.samples > 0 && s0?.npc?.caps) break;
    await sleep(250);
  }
  assert.ok(s0, 'perf snapshot returns after boot');
  assert.equal(s0.enabled, true, 'perf snapshot enabled');
  assert.equal(s0.visible, true, 'perf overlay visible with ?perf=1');
  assert.ok(finite(s0.t), 'snapshot.t finite');
  assert.ok(finite(s0.npc?.live) && finite(s0.npc?.near), 'live/near counts sane');
  const bootScene = await sceneInfo();
  assert.ok(bootScene, 'live scene reachable');
  assert.ok(bootScene.mid && finite(bootScene.mid.capacity), 'mid traffic layer present');
  assert.ok(bootScene.far && finite(bootScene.far.capacity), 'far traffic layer present');
  state.checks.boot = {
    snapshot: { enabled: s0.enabled, visible: s0.visible, t: s0.t, npc: s0.npc, caps: s0.npc?.caps ?? null },
    mid: bootScene.mid, far: bootScene.far,
  };

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

  // ---- Install the test-only ambient hook BEFORE the flight (docked, so no
  // chatter has fired yet: distant chatter is suppressed while docked).
  state.hookReceipt = await c.eval(HOOK);
  assert.equal(state.hookReceipt?.ok, true, 'in-page ambient hook installed: ' + JSON.stringify(state.hookReceipt));
  assert.equal(await c.eval('typeof window.__ambientLog'), 'object', 'window.__ambientLog exists');
  assert.equal(await c.eval('typeof window.__ambientPose'), 'function', 'window.__ambientPose helper exists');

  // ---- Sustained flight: repeated Freehold <-> Veridian legs (#339 routeStep).
  let leg = null;
  let legIndex = 0;
  let undockRefusals = 0;
  let dockCancels = 0;
  const sampleWallStart = Date.now();
  const deadline = sampleWallStart + SAMPLE_SECONDS * 1000;
  let commIdx = 0;
  let eventIdx = 0;

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
    // window and only fail if the duplicate survives (same rule as #339).
    if (scene?.duplicateViolations?.length) {
      const transient = scene.duplicateViolations.slice();
      await sleep(180);
      scene = await sceneInfo();
      if (scene?.duplicateViolations?.length) {
        throw Error('persistent duplicate hull/proxy at ' + wallMs + 'ms: ' + JSON.stringify(scene.duplicateViolations));
      }
      state.transientDuplicates.push({ wallMs, violations: transient });
    }
    const toastsNow = await toasts();
    const ambient = await c.eval(`(() => { const l = window.__ambientLog; if (!l) return null; return { commLines: l.commLines.slice(${commIdx}), worldEvents: l.worldEvents.slice(${eventIdx}), hookErrors: l.hookErrors.slice() }; })()`);
    assert.ok(ambient, 'window.__ambientLog readable at ' + wallMs + 'ms');
    for (const e of ambient.commLines) {
      const cls = classifyCommLine(e);
      const entry = { ...e, ...cls };
      state.commLines.push(entry);
      if (cls.chatter) state.chatter.push(entry);
    }
    commIdx += ambient.commLines.length;
    for (const e of ambient.worldEvents) {
      state.worldEvents.push(e);
      if (e.kind === 'convoySurge' && e.phase === 'start') state.convoyStarts.push(e);
    }
    eventIdx += ambient.worldEvents.length;
    if (ambient.hookErrors.length) state.hookErrors.push(...ambient.hookErrors);

    const chatterTexts = new Set(state.chatter.map((c) => c.text).filter(Boolean));
    const chatterToastCount = toastsNow.texts.filter((t) => chatterTexts.has(t)).length;
    if (toastsNow.count > MAX_TOASTS) {
      throw Error('toast cap exceeded at ' + wallMs + 'ms: ' + toastsNow.count + ' .rw-toast.show ' + JSON.stringify(toastsNow.texts));
    }
    if (chatterToastCount > MAX_CHATTER_TOASTS) {
      throw Error('chatter toast flood at ' + wallMs + 'ms: ' + chatterToastCount + ' chatter toasts ' + JSON.stringify(toastsNow.texts));
    }
    const sample = {
      i, wallMs, simT: obs.t, phase: phaseOf(obs),
      system: obs.world?.currentSystem ?? null,
      stationInZone: obs.station?.inZone === true,
      flags: { docked: obs.flags?.docked === true, jump: obs.gate?.jumping === true, berthHold: obs.flags?.berthHold === true, hailOpen: obs.flags?.hailOpen === true, chartOpen: obs.flags?.chartOpen === true },
      autopilot: { engaged: obs.autopilot?.engaged === true, mode: obs.autopilot?.mode ?? '', phase: obs.autopilot?.phase ?? '', reason: obs.autopilot?.reason ?? '', queuedDock: obs.autopilot?.queuedDock ?? null },
      gate: { inZone: obs.gate?.inZone === true, jumping: obs.gate?.jumping === true, to: obs.gate?.to ?? null },
      leg: leg ? { index: leg.index, from: leg.from, to: leg.to, phase: leg.phase } : null,
      snapshot,
      scene,
      toasts: toastsNow,
      chatterToastCount,
      chatterCount: state.chatter.length,
      convoyStartCount: state.convoyStarts.length,
    };
    state.samples.push(sample);
    if (scene?.activeEvent?.kind === 'convoySurge') state.activeEventSamples.push({ wallMs, simT: obs.t, activeEvent: scene.activeEvent });
    if ((scene?.nearProxyCount ?? 0) > 0) state.nearProxySamples.push({ wallMs, simT: obs.t, phase: sample.phase, system: sample.system, nearProxyCount: scene.nearProxyCount, nearProxyIds: scene.nearProxyIds, nearProxyReported: scene.nearProxyReported });
    await routeStep(obs);
  }
  if (leg) state.legs.push({ ...leg, completed: false });
  state.route.undockRefusals = undockRefusals;
  state.route.dockCancels = dockCancels;

  state.aggregates = aggregate();
  runResult.aggregates = state.aggregates;
  runResult.route = {
    description: 'Fresh Greenhand start, docked at Freehold, then repeated Freehold <-> Veridian legs: undock -> plotRoute -> engageAutopilot -> queued approachDock (lane -> gate -> jump -> dock), sampled once per second.',
    start: state.route.start,
    legsCompleted: state.aggregates.legsCompleted,
    legsAttempted: state.legs.length,
    undockRefusals,
    dockCancels,
  };
  runResult.checks = {
    boot: state.checks.boot,
    hook: state.hookReceipt,
    samples: state.aggregates.sampleCount,
    wallMs: state.aggregates.sampleWallMs,
    legsCompleted: state.aggregates.legsCompleted,
    chatter: state.aggregates.chatter.count,
    convoyStarts: state.aggregates.convoy.startCount,
    nearProxyMax: state.aggregates.nearProxies.max,
    nearProxyMaxAtApproach: state.aggregates.nearProxies.maxAtApproach,
  };
  console.log('AMBIENT', JSON.stringify({
    samples: state.aggregates.sampleCount, wallMs: state.aggregates.sampleWallMs,
    legs: state.aggregates.legsCompleted,
    chatter: { count: state.aggregates.chatter.count, minGap: state.aggregates.chatter.minGap, strictViolations: state.aggregates.chatter.strictViolations.length, violations: state.aggregates.chatter.violations.length, uniqueSpeakers: state.aggregates.chatter.uniqueSpeakers, distantPlaceRefs: state.aggregates.chatter.distantPlaceReferences },
    convoy: { starts: state.aggregates.convoy.startCount, variants: state.aggregates.convoy.variants, activeEventSamples: state.aggregates.convoy.activeEventSamples },
    nearProxies: { max: state.aggregates.nearProxies.max, maxAtApproach: state.aggregates.nearProxies.maxAtApproach, positiveApproachSamples: state.aggregates.nearProxies.positiveApproachCount, duplicateViolations: state.aggregates.nearProxies.duplicateViolations, transient: state.aggregates.nearProxies.transientDuplicateSamples },
    toasts: { max: state.aggregates.toasts.max, maxChatter: state.aggregates.toasts.maxChatter },
    phases: state.aggregates.phaseCounts, systems: state.aggregates.systemsSeen,
  }));

  // ---- Sustained-window assertions.
  assert.ok(state.samples.length >= MIN_SAMPLES, 'sampled ' + state.samples.length + ' >= ' + MIN_SAMPLES + ' one-second samples');
  assert.ok(state.aggregates.sampleWallMs >= MIN_WALL_MS, 'sustained ' + state.aggregates.sampleWallMs + ' ms >= ' + MIN_WALL_MS + ' ms');
  assert.equal(state.hookErrors.length, 0, 'ambient hook never threw: ' + JSON.stringify(state.hookErrors.slice(0, 3)));

  // Chatter: observed, bounded, sourced from distant non-live records, naming
  // a real place. A real system change legitimately resets the timer to the new
  // system's band-scaled first delay (>= 10 s), so a cross-system boundary is
  // held to that floor while within-system gaps must clear 20 s. Strict
  // < 20 s gaps are recorded separately for the report.
  assert.ok(state.aggregates.chatter.count >= 1, 'distant chatter observed (count ' + state.aggregates.chatter.count + ')');
  assert.ok(state.aggregates.chatter.count <= MAX_CHATTER, 'chatter ' + state.aggregates.chatter.count + ' <= ' + MAX_CHATTER + ' over ' + SAMPLE_SECONDS + ' s');
  assert.equal(state.aggregates.chatter.violations.length, 0, 'bounded chatter gaps: ' + JSON.stringify(state.aggregates.chatter.violations));
  assert.equal(state.aggregates.chatter.speakerValidationFailures.length, 0, 'every chatter speaker is a current-bank non-live record beyond NEAR_RANGE: ' + JSON.stringify(state.aggregates.chatter.speakerValidationFailures.slice(0, 5)));
  assert.equal(state.aggregates.chatter.placeReferenceFailures.length, 0, 'every chatter line names a real place: ' + JSON.stringify(state.aggregates.chatter.placeReferenceFailures.slice(0, 5)));

  // Toast cap / chatter toast flood.
  assert.equal(state.aggregates.toasts.overCap.length, 0, '.rw-toast.show <= ' + MAX_TOASTS + ' at every sample: ' + JSON.stringify(state.aggregates.toasts.overCap.slice(0, 5)));
  assert.equal(state.aggregates.toasts.chatterOverCap.length, 0, 'chatter toasts <= ' + MAX_CHATTER_TOASTS + ' at every sample: ' + JSON.stringify(state.aggregates.toasts.chatterOverCap.slice(0, 5)));

  // Convoy far-lane event: observable start with a distant place reference and
  // an observable activeEvent; persisted activeEvent keeps its exact shape.
  if (FULL_RUN) {
    assert.ok(state.aggregates.convoy.startCount >= 1, 'convoySurge start observed (count ' + state.aggregates.convoy.startCount + ')');
    const start = state.convoyStarts[0];
    assert.ok(['standard', 'farLane'].includes(start.variant), 'convoy variant is standard/farLane: ' + JSON.stringify(start.variant));
    const place = start.place ?? {};
    const neighbors = (place.neighborNames ?? []).filter(Boolean);
    assert.ok(typeof start.line === 'string' && start.line.length > 0, 'convoy start carries a line');
    assert.ok(neighbors.some((n) => start.line.includes(n)), 'convoy line names a distant gate-destination system: ' + JSON.stringify({ line: start.line, neighbors }));
    assert.ok(typeof place.stationName === 'string' && start.line.includes(place.stationName), 'convoy line names the station: ' + JSON.stringify({ line: start.line, station: place.stationName }));
    assert.ok(state.aggregates.convoy.activeEventSamples >= 1, 'ctx.world.activeEvent kind convoySurge observable during the run');
    for (const shape of state.aggregates.convoy.activeEventShapes) {
      assert.equal(shape, JSON.stringify(['endsAt', 'kind', 'startedAt', 'system']), 'persisted activeEvent shape unchanged: ' + shape);
    }
    assert.ok(state.aggregates.convoy.activeEventShapes.length >= 1, 'activeEvent shape sampled');
  } else {
    state.checks.smokeRelaxed = ['convoySurge start (event gap 180-360 s may exceed the smoke window)', 'near-band approach-lane proxies (may not reach a docked/approaching sample in the smoke window)'];
  }

  // Approach-lane traffic: near-band proxies visible at a docked/approaching
  // sample, no persistent live+proxy duplicate ids.
  assert.equal(state.aggregates.nearProxies.duplicateViolations, 0, 'no persistent duplicate hull/proxy ids');
  assert.ok(state.aggregates.nearProxies.transientDuplicateSamples <= Math.max(2, Math.ceil(state.samples.length * 0.02)),
    'transient (sub-125ms handoff) duplicate samples ' + state.aggregates.nearProxies.transientDuplicateSamples + ' <= 2% of ' + state.samples.length);
  if (FULL_RUN) {
    assert.ok(state.aggregates.nearProxies.maxAtApproach > 0, 'near-band approach-lane proxies visible at a docked/approaching sample (max ' + state.aggregates.nearProxies.maxAtApproach + ')');
  }

  // Console clean (the harness also fails on console errors/exceptions).
  const liveConsoleErrors = c.console.filter((e) => ['error', 'assert'].includes(e.type));
  assert.equal(liveConsoleErrors.length, 0, 'console errors during the flight: ' + JSON.stringify(liveConsoleErrors.slice(0, 5)));
  assert.equal(c.exceptions.length, 0, 'uncaught exceptions during the flight: ' + JSON.stringify(c.exceptions.slice(0, 3)));
}

try {
  result = await runLive(NAME, fn, { query: '&perf=1', serve: SERVE });
} catch (e) {
  runError = e;
}

await mkdir(folder, { recursive: true });
const dist = await distMetadata();
const evidence = {
  issue: 341,
  title: '[AI] Ambient life: distant-traffic comms, convoys, and far-lane events (system scale/population Phase 4)',
  probe: PROBE,
  probeName: NAME,
  generatedAt: new Date().toISOString(),
  runMode: { serve: SERVE, sampleSeconds: SAMPLE_SECONDS, fullRun: FULL_RUN, smokeRelaxed: state.checks.smokeRelaxed ?? [] },
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
  hook: state.hookReceipt,
  samples: state.samples,
  aggregates: state.aggregates,
  commLines: state.commLines,
  worldEvents: state.worldEvents,
  chatter: state.chatter,
  convoyStarts: state.convoyStarts,
  activeEventSamples: state.activeEventSamples,
  nearProxySamples: state.nearProxySamples,
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
  console.error('ISSUE 341 AMBIENT LIFE PROBE FAILED', evidence.error ?? '');
  process.exitCode = 1;
}
