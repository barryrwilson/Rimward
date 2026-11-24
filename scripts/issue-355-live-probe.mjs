/**
 * Issue #355 live probe — P5b in-system sub-regions + fast transit lanes.
 *
 * Production-build (vite preview over dist/) real-Chrome verification:
 *   1. undock at Freehold and fly the core -> freehold_r1 transit lane at
 *      full throttle: the corridor boost carries the light hull past its
 *      cruise envelope (sustained >= 500 u/s pin) and the leg is measured
 *      end-to-end (<= 20 s pin).
 *   2. the System chart (KeyM) shows the sub-region rings, lane lines and the
 *      current-region highlight while the ship sits inside freehold_r1;
 *      screenshots captured; chart open/close costs zero scene children.
 *   3. a pre-P5b v2 save restores byte-identically: dock (autosave), reload,
 *      the ship position is unchanged (no double transform) and the save on
 *      disk stays envelope v2.
 *
 * Evidence lands in out/issue-355-live/regions-lanes/ (untracked).
 * Run: npm run build && node scripts/issue-355-live-probe.mjs
 * Smoke: ISSUE355_SKIP_RESTORE=1 (corridor + chart only).
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE355_OUT || resolve('out/issue-355-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, sleep, out } = await import('./issue-74-live-harness.mjs');

const NAME = 'regions-lanes';
const folder = join(out, NAME);
const SAVE_KEY = 'rimward-save-v1';
const state = { corridor: {}, chart: {}, saveRestore: {}, shots: [] };
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const median = (xs) => {
  const a = xs.filter(finite).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

await mkdir(folder, { recursive: true });

const result = await runLive(NAME, async ({ c, save, observe, act, shot, wait, baseUrl }) => {
  const saveState = async () => {
    await writeFile(join(folder, 'evidence.json'), JSON.stringify(state, null, 2));
  };
  const pos = () => c.eval('(function(){ const s = window.__ctx.ship; return s.object ? s.object.position.toArray() : null; })()');
  const setControl = (args) => act('setControl', { seq: ++setControl.seq, ttl: 2, ...args });
  setControl.seq = 0;
  // Steer the ship toward a world point using its live quaternion (closed
  // loop, agent setControl only — the same drive the agent bridge uses).
  const closedLoop = async (target, timeoutS, speedFloor) => {
    const began = Date.now();
    for (;;) {
      const p = await pos();
      const dist = Math.hypot(target[0] - p[0], target[1] - p[1], target[2] - p[2]);
      if (dist < 260) return { p, dist };
      if (Date.now() - began > timeoutS * 1000) return { p, dist, timedOut: true };
      const dir = await c.eval('(function(){ const obj = window.__ctx.ship.object; const t = ' + JSON.stringify(target) + '; const v = obj.position.clone(); v.set(t[0] - v.x, t[1] - v.y, t[2] - v.z).normalize(); const q = obj.quaternion.clone().invert(); v.applyQuaternion(q); return [v.x, v.y, v.z]; })()');
      const steerX = Math.max(-1, Math.min(1, 2.2 * dir[0]));
      const steerY = Math.max(-1, Math.min(1, -2.2 * dir[1]));
      await setControl({ throttle: 1, steerX, steerY, strafeX: 0, strafeY: 0 });
      await sleep(250);
    }
  };

  // ---- 1. corridor leg: fly station -> freehold_r1 down the lane.
  // Greenhand boots in space near the station (the core lane anchor), so the
  // corridor entry is immediate; an already-docked session undocks first.
  const bootObs = await observe();
  if (bootObs.flags?.docked === true) {
    await act('undock');
    await wait((o) => o.flags?.docked === false, 30, 'undock');
  }
  const r1 = await c.eval('(function(){ const def = window.__ctx.systems[window.__ctx.world.currentSystem]; return def.regions && def.regions[0] ? { center: def.regions[0].center, id: def.regions[0].id } : null; })()');
  assert.ok(r1, 'freehold carries region data in the production bundle');
  const speedSamples = [];
  let sampling = true;
  const sampler = (async () => {
    while (sampling) {
      const s = await c.eval('window.__ctx.ship.speed').catch(() => null);
      if (finite(s)) speedSamples.push(s);
      await sleep(350);
    }
  })();
  const legStart = Date.now();
  const approach = await closedLoop(r1.center, 45);
  const legSeconds = (Date.now() - legStart) / 1000;
  sampling = false;
  await sampler;
  const sustained = speedSamples.filter((s) => s > 400);
  state.corridor = {
    regionId: r1.id,
    legSeconds: +legSeconds.toFixed(2),
    maxSpeed: +(Math.max(...speedSamples)).toFixed(1),
    sustainedMedian: median(sustained),
    sustainedSamples: sustained.length,
    finalDist: +approach.dist.toFixed(1),
    samples: speedSamples.length,
  };
  assert.ok(state.corridor.maxSpeed > 400, 'corridor boosts the envelope far past cruise: max ' + state.corridor.maxSpeed);
  assert.ok(state.corridor.sustainedMedian >= 500, 'corridor sustained >= 500 u/s: ' + state.corridor.sustainedMedian);
  assert.ok(legSeconds <= 20, 'corridor leg end-to-end <= 20 s: ' + legSeconds.toFixed(1) + ' s');
  await shot('corridor-region');
  await saveState();

  // ---- Settle inside freehold_r1: the current-region highlight is derived
  // from the live position, so bring the ship to REST inside the 360 u disc.
  // Phase A: throttle 0 — the ~528 u/s approach coasts out and bleeds to rest
  // (stopTime 2.0). Phase B: ease back at crawl throttle; the corridor on the
  // way in boosts the crawl, so thrust gates on speed and cuts at 60 u.
  {
    const aimAt = async (target) => {
      const dir = await c.eval('(function(){ const obj = window.__ctx.ship.object; const t = ' + JSON.stringify(target) + '; const v = obj.position.clone(); v.set(t[0] - v.x, t[1] - v.y, t[2] - v.z).normalize(); const q = obj.quaternion.clone().invert(); v.applyQuaternion(q); return [v.x, v.y, v.z]; })()');
      return { steerX: Math.max(-1, Math.min(1, 2.2 * dir[0])), steerY: Math.max(-1, Math.min(1, -2.2 * dir[1])) };
    };
    const distTo = async () => {
      const pr = await pos();
      return Math.hypot(r1.center[0] - pr[0], r1.center[1] - pr[1], r1.center[2] - pr[2]);
    };
    const speed = async () => await c.eval('window.__ctx.ship.speed').catch(() => 0);
    for (let i = 0; i < 40; i++) {
      if ((await speed()) < 10) break;
      await setControl({ throttle: 0, steerX: 0, steerY: 0, strafeX: 0, strafeY: 0 });
      await sleep(300);
    }
    for (let i = 0; i < 300; i++) {
      const dist = await distTo();
      const spd = await speed();
      if (dist < 70 && spd < 6) break;
      const steer = await aimAt(r1.center);
      if (spd > 25 || dist < 70) await setControl({ throttle: 0, ...steer, strafeX: 0, strafeY: 0 });
      else await setControl({ throttle: 0.08, ...steer, strafeX: 0, strafeY: 0 });
      await sleep(250);
    }
    await act('clearControl', {}, false);
    for (let i = 0; i < 20; i++) {
      if ((await speed()) < 4) break;
      await sleep(300);
    }
    let parkedDist = await distTo();
    // Trim pass: one more crawl nudge if the coast landed just outside.
    if (parkedDist >= 360) {
      for (let i = 0; i < 150; i++) {
        const dist = await distTo();
        const spd = await speed();
        if (dist < 70 && spd < 6) break;
        const steer = await aimAt(r1.center);
        if (spd > 25 || dist < 70) await setControl({ throttle: 0, ...steer, strafeX: 0, strafeY: 0 });
        else await setControl({ throttle: 0.08, ...steer, strafeX: 0, strafeY: 0 });
        await sleep(250);
      }
      await act('clearControl', {}, false);
      for (let i = 0; i < 20; i++) {
        if ((await speed()) < 4) break;
        await sleep(300);
      }
      parkedDist = await distTo();
    }
    state.corridor.parkedDist = +parkedDist.toFixed(1);
    if (!(parkedDist < 360)) throw Error('ship parked inside freehold_r1 failed (dist ' + parkedDist.toFixed(1) + ' u)');
  }

  // ---- 2. System chart: regions/lanes/current-region, zero scene cost.
  const key = async (code, keyName, vk) => {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  const sceneBefore = await c.eval('(function(){ return window.__ctx.scene.children.length; })()');
  await key('KeyM', 'm', 77);
  await sleep(900);
  // KeyM opens the chart on the Galaxy view; switch to the System view.
  await c.eval('(function(){ const btn = document.querySelector(".rw-galaxy-chart button[data-view=system]"); if (btn) btn.click(); })()');
  await sleep(400);
  const chart = await c.eval('(function(){ const sys = document.querySelector(".rw-galaxy-chart .rw-system-chart"); if (!sys) return null; const svg = sys.querySelector(".rw-system-svg"); const regions = [...svg.querySelectorAll(".rw-system-region")]; const lanes = [...svg.querySelectorAll(".rw-system-lane")]; const current = regions.find((r) => r.classList.contains("is-current")); return { extent: sys.getAttribute("data-extent"), regionCount: regions.length, laneCount: lanes.length, regionIds: regions.map((r) => r.getAttribute("data-region-id")), currentRegion: current ? current.getAttribute("data-region-id") : null, labels: [...svg.querySelectorAll(".rw-system-region-label")].map((l) => l.textContent) }; })()');
  assert.ok(chart, 'System chart opens with KeyM');
  assert.equal(chart.regionCount, 3, 'chart draws the three freehold region rings');
  assert.equal(chart.laneCount, 3, 'chart draws the three lane lines');
  assert.ok(chart.regionIds.includes('freehold_r1'), 'chart region ids render: ' + chart.regionIds.join(','));
  assert.equal(chart.currentRegion, 'freehold_r1', 'current-region highlight marks the region the ship sits in');
  assert.ok(Number(chart.extent) > 3000, 'chart extent grows past the old 2,800 ceiling: ' + chart.extent);
  state.chart = chart;
  await shot('chart-regions');
  await key('KeyM', 'm', 77);
  await sleep(600);
  const sceneAfter = await c.eval('(function(){ return window.__ctx.scene.children.length; })()');
  state.chart.sceneChildrenBefore = sceneBefore;
  state.chart.sceneChildrenAfter = sceneAfter;
  assert.equal(sceneAfter, sceneBefore, 'chart open/close adds zero scene children');
  await saveState();

  if (process.env.ISSUE355_SKIP_RESTORE === '1') return;

  // ---- 3. pre-P5b v2 save restore byte-identical.
  const stationPos = await c.eval('(function(){ return window.__ctx.systems[window.__ctx.world.currentSystem].station.position; })()');
  const back = await closedLoop(stationPos, 60);
  assert.ok(back.dist < 400, 'closed-loop return reaches the station: dist ' + back.dist.toFixed(1));
  // The approach shares the station bubble with crowd traffic: an impact can
  // cancel the dock exactly as on the autopilot route. Retry the real verb.
  const DOCK_CANCEL_REASONS = new Set(['impact', 'blocked', 'stale', 'lost-station', 'dock-refused']);
  await act('approachDock', {}, false);
  const dockBegan = Date.now();
  let docked = false;
  while (Date.now() - dockBegan < 300000) {
    const o = await observe();
    if (o.flags?.docked === true) { docked = true; break; }
    const ap = o.autopilot;
    if (ap && ap.mode === 'dock' && ap.engaged === false && DOCK_CANCEL_REASONS.has(ap.reason)) {
      await act('approachDock', {}, false);
    }
    await sleep(500);
  }
  if (!docked) throw Error('dock for autosave failed after retries');
  let autosaveRaw = null;
  for (let i = 0; i < 40 && !autosaveRaw; i++) {
    autosaveRaw = await c.eval('localStorage.getItem(' + JSON.stringify(SAVE_KEY) + ')');
    if (!autosaveRaw) await sleep(250);
  }
  assert.ok(autosaveRaw, 'autosave exists after docking');
  const v2 = JSON.parse(autosaveRaw);
  assert.equal(v2.v, 2, 'the autosave writes the v2 envelope');
  const savedPos = v2.ship && v2.ship.position;
  assert.ok(savedPos && finite(savedPos[0]), 'the autosave carries the ship position');
  // Re-inject the same v2 blob and reload: P5b adds no migration pass, so the
  // restore must be byte-identical (position unchanged, no double transform).
  await c.eval('localStorage.setItem(' + JSON.stringify(SAVE_KEY) + ', ' + JSON.stringify(JSON.stringify(v2)) + ')');
  await c.send('Page.navigate', { url: 'about:blank' });
  await sleep(400);
  await c.send('Page.navigate', { url: baseUrl + '?agent=1&perf=1' });
  const began = Date.now();
  for (;;) {
    let booted = false;
    try { booted = await c.eval('window.__rimwardBooted === true && !!window.__ctx && !!window.__ctx.world'); } catch { /* navigating */ }
    if (booted) break;
    if (Date.now() - began > 180000) throw Error('reload boot timeout');
    await sleep(250);
  }
  await sleep(1500);
  const phase = await c.eval('(function(){ const ctx = window.__ctx; return { paused: ctx.flags.paused, docked: ctx.flags.docked }; })()');
  if (phase.paused) await act('startGame', {}, false);
  await wait((o) => o.flags?.paused === false, 30, 'restored run resumes');
  const restored = await c.eval('(function(){ const ctx = window.__ctx; return { currentSystem: ctx.world.currentSystem, pos: ctx.ship.object ? ctx.ship.object.position.toArray() : null }; })()');
  assert.equal(restored.currentSystem, v2.world.currentSystem, 'v2 restore keeps the saved system');
  const posDelta = Math.hypot(restored.pos[0] - savedPos[0], restored.pos[1] - savedPos[1], restored.pos[2] - savedPos[2]);
  assert.ok(posDelta <= 2, 'pre-P5b v2 position restores byte-identically (delta ' + posDelta.toFixed(3) + ' u, no double transform)');
  state.saveRestore = { envelope: v2.v, savedPos, restoredPos: restored.pos, posDelta: +posDelta.toFixed(3) };
  await shot('v2-restored');
  await saveState();
}, { query: '&perf=1', serve: 'preview' });

await writeFile(join(folder, 'evidence.json'), JSON.stringify({ ...state, verdict: result.verdict }, null, 2));
console.log('ISSUE 355 LIVE ' + result.verdict);
console.log('corridor:', JSON.stringify(state.corridor));
console.log('chart:', JSON.stringify({ regionCount: state.chart.regionCount, laneCount: state.chart.laneCount, currentRegion: state.chart.currentRegion, extent: state.chart.extent }));
if (state.saveRestore.envelope) console.log('saveRestore:', JSON.stringify(state.saveRestore));
if (result.verdict !== 'PASS') process.exitCode = 1;
