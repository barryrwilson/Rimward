/**
 * Issue #338 live visual verification — production build, real Chrome.
 *
 * Fixed route (fresh Greenhand -> Freehold dock -> undock -> plotRoute(veridian)
 * -> engageAutopilot -> queued approachDock) with screenshots at the station,
 * the lane and the gate/jump. Verifies live that the deep field, the
 * far-traffic impostor layer and the far asteroid belt exist with their budget
 * metadata, that no impostor duplicates a live hull, and that the console stays
 * clean. Evidence (result.json + PNGs) lands under out/issue-338-live/.
 *
 * Run: npm run build && node scripts/issue-338-live-visual-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE338_OUT || resolve('out/issue-338-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const sceneInfo = (c) => c.eval(`(() => {
  const ctx = window.__ctx;
  if (!ctx || !ctx.scene) return null;
  const df = ctx.scene.children.find((o) => o.name === 'deepfield');
  const imp = ctx.scene.children.find((o) => o.name === 'far-traffic-impostors');
  const far = ctx.scene.children.find((o) => o.name === 'asteroid-belt-far');
  const liveIds = new Set(ctx.ships.map((s) => s.record && s.record.id).filter(Boolean));
  const impIds = imp && imp.userData && Array.isArray(imp.userData.visibleRecordIds) ? imp.userData.visibleRecordIds : [];
  return {
    system: ctx.world.currentSystem,
    deepfield: df ? { ...df.userData.deepfield } : null,
    impostor: imp ? {
      capacity: imp.count,
      visibleCount: imp.userData.visibleCount,
      visibleRecordIds: impIds,
      system: imp.userData.system,
      duplicatesOfLive: impIds.filter((id) => liveIds.has(id)),
    } : null,
    farBelt: far ? { ...far.userData } : null,
    asteroidMeshes: ctx.scene.children.filter((o) => o.name && o.name.startsWith('asteroid-field-')).length,
    renderer: {
      calls: ctx.renderer.info.render.calls,
      triangles: ctx.renderer.info.render.triangles,
      points: ctx.renderer.info.render.points,
    },
    asteroidMatrixWrites: ctx.perf && ctx.perf.metrics ? ctx.perf.metrics.asteroidMatrixWrites : null,
  };
})()`);

const result = await runLive('scale-visual', async ({ c, act, observe, wait, shot, result: runResult }) => {
  runResult.method = 'Production preview build served by vite preview over dist/, loaded with ?agent=1&perf=1. Fixed Greenhand -> Freehold dock -> undock -> plotRoute(veridian) -> engageAutopilot -> queued approachDock route; screenshots and live scene checks for the deep field, far-traffic impostors and far asteroid belt.';
  runResult.assertionScope = 'PASS means the fixed route ran, the three #338 layers were present in the live scene with budget metadata, no impostor duplicated a live hull, and the console/exceptions were clean.';

  // Settle docked at Freehold, then run the same fixed route as the perf probe.
  let s = await observe();
  const dockBegan = Date.now();
  while (!s.flags.docked && Date.now() - dockBegan < 60000) {
    const r = await act(s.station?.inZone ? 'dock' : 'approachDock', {}, false);
    if (!r.ok) await sleep(750);
    s = await observe();
  }
  assert.equal(s.flags.docked, true, 'fresh start settles docked');
  await shot('01-station-outward');
  const stationInfo = await sceneInfo(c);
  assert.ok(stationInfo, 'live ctx/scene reachable');
  runResult.station = stationInfo;

  const undock = await act('undock');
  assert.equal(undock.ok, true, 'undock accepted');
  await wait((x) => x.flags.docked === false && x.flags.berthHold === false, 60, 'undock settles');
  assert.equal((await act('plotRoute', { dest: 'veridian' })).ok, true, 'plotRoute accepted');
  assert.equal((await act('engageAutopilot')).ok, true, 'engageAutopilot accepted');
  await act('approachDock', {}, false);

  const samples = [];
  for (let i = 0; i < 6; i += 1) {
    await sleep(10000);
    const info = await sceneInfo(c);
    const obs = await observe();
    samples.push({ t: obs.t, phase: obs.session.phase, flags: { docked: obs.flags.docked, system: obs.world.currentSystem, jump: obs.gate?.jumping === true }, info });
    if (i === 1) await shot('02-lane-outward');
    if (i === 4) await shot('03-gate-jump');
  }
  await shot('04-route-end');
  runResult.samples = samples;

  for (const sample of samples) {
    assert.ok(sample.info, 'scene reachable during route');
    assert.ok(sample.info.deepfield, 'deep field present in ' + sample.info.system);
    assert.ok(sample.info.deepfield.drawCalls > 0 && sample.info.deepfield.drawCalls <= 20, 'deep field draw-call budget');
    assert.ok(sample.info.deepfield.triangles > 0 && sample.info.deepfield.triangles <= 30000, 'deep field triangle budget');
    assert.ok(sample.info.impostor, 'far-traffic impostor layer present');
    assert.ok(sample.info.impostor.capacity >= 150 && sample.info.impostor.capacity <= 300, 'impostor capacity 150-300');
    assert.deepEqual(sample.info.impostor.duplicatesOfLive, [], 'no impostor duplicates a live hull');
    assert.ok(sample.info.farBelt, 'far asteroid belt present');
    assert.ok(sample.info.farBelt.count >= 440, 'far belt density present');
    assert.ok(sample.info.asteroidMeshes >= 2, 'minable instanced belt present');
    assert.ok(sample.info.renderer.calls > 0 && sample.info.renderer.triangles > 0, 'renderer stats live');
  }
  runResult.checks = {
    samples: samples.length,
    systemsSeen: [...new Set(samples.map((x) => x.info.system))],
    deepfieldDrawCallsMax: Math.max(...samples.map((x) => x.info.deepfield.drawCalls)),
    deepfieldTrianglesMax: Math.max(...samples.map((x) => x.info.deepfield.triangles)),
    impostorVisibleMax: Math.max(...samples.map((x) => x.info.impostor.visibleCount)),
    farBeltMax: Math.max(...samples.map((x) => x.info.farBelt.count)),
    duplicateImpostors: samples.reduce((n, x) => n + x.info.impostor.duplicatesOfLive.length, 0),
    consoleErrors: runResult.consoleErrors.length,
  };
});

console.log('ISSUE338 LIVE VISUAL ' + result.verdict);
if (result.verdict !== 'PASS') process.exitCode = 1;
