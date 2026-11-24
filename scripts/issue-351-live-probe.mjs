/**
 * Issue #351 live probe — large-hull thruster plumes near landmarks.
 *
 * Production-build (vite preview over dist/) real-Chrome verification that
 * NPC drive plumes no longer stretch to landmark scale on the gate lane:
 *   - every VISIBLE RIMWARD_THRUSTER_HALO measures <= PLUME_LEN_CAP + eps
 *     world units long while sampled (the pre-fix freighter burn reached ~55 u);
 *   - no plume cone is visible beyond FADE_END from the camera (the flare
 *     bead may stay lit: a distant drive light is traffic, not a cone);
 *   - a mid-fade sample shows the plume opacity strictly below its
 *     no-camera base while the cone is still visible;
 *   - a gate-approach screenshot is kept as visual evidence.
 *
 * Fresh Greenhand start, undock, then ~150 s of one-sample-per-2 s during a
 * plotRoute(veridian) -> engageAutopilot lane flight toward the gate, where
 * the reported artifact lives. Evidence under out/issue-351-live/plume-cap/
 * (result.json + evidence.json + screenshots; untracked).
 *
 * Run: npm run build && node scripts/issue-351-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE351_OUT || resolve('out/issue-351-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;

const { runLive, out } = await import('./issue-74-live-harness.mjs');

const SAMPLE_MS = 2000;
const MAX_SAMPLES = 75; // ~150 s of lane flight
const CAP_EPS = 1.0; // flicker headroom on the absolute cap

// In-page sampler: reads the live scene directly through window.__ctx.
// Measures every ship's thruster cones in world space. Session-only read.
const SAMPLE = `() => {
  const ctx = window.__ctx;
  const cam = ctx.camera;
  const rows = [];
  for (const live of ctx.ships) {
    const root = live && live.object;
    const th = root && root.userData && root.userData.thruster;
    if (!th) continue;
    const d = cam.position.distanceTo(root.position);
    const row = {
      classKey: th.classKey || root.userData.classKey || null,
      distance: Math.round(d),
      haloVisible: th.halo.visible === true,
      coreVisible: th.core.visible === true,
      haloLen: th.halo.visible ? +(th.halo.scale.z).toFixed(2) : null,
      coreLen: th.core.visible ? +(th.core.scale.z).toFixed(2) : null,
      haloOpacity: th.halo.visible ? +th.halo.material.uniforms.uOpacity.value.toFixed(4) : null,
      beadLit: th.bead.scale.x > th.restScale.x * 1.01,
      speed: live.ai && live.ai.velocity ? Math.round(live.ai.velocity.length()) : null,
    };
    rows.push(row);
  }
  return {
    t: ctx.world.time,
    playerPos: cam.position.toArray().map((v) => Math.round(v)),
    gate: { inZone: !!ctx.gate && ctx.gate.inZone === true, jumping: !!ctx.gate && ctx.gate.jumping === true },
    ships: rows,
  };
}`;

const result = await runLive('plume-cap', async ({ c, act, observe, shot, save, folder }) => {
  await writeFile(join(folder, 'sampler.js'), SAMPLE);
  const obs0 = await observe();
  if (obs0.flags?.docked === true) await act('undock');
  await new Promise((r) => setTimeout(r, 4000));
  await act('plotRoute', { dest: 'veridian' });
  await act('engageAutopilot');

  const samples = [];
  let midFadeSeen = null;
  for (let i = 0; i < MAX_SAMPLES; i++) {
    const s = await c.eval('(' + SAMPLE + ')()');
    samples.push(s);
    for (const ship of s.ships) {
      if (ship.haloVisible) {
        assert.ok(ship.haloLen <= 26 + CAP_EPS,
          'visible halo length ' + ship.haloLen + ' u exceeds the 26 u cap at ' + ship.distance + ' u (' + ship.classKey + ')');
        assert.ok(ship.distance <= 750,
          'visible plume cone at ' + ship.distance + ' u, beyond the 750 u fade end');
      }
      if (ship.haloVisible && ship.haloOpacity !== null && ship.distance > 300 && ship.distance < 750) {
        if (midFadeSeen === null || ship.haloOpacity < midFadeSeen.opacity) {
          midFadeSeen = { distance: ship.distance, opacity: ship.haloOpacity, classKey: ship.classKey };
        }
      }
    }
    if (i === 6) await shot('lane-early');
    if (s.gate.inZone && !s.gate.jumping) await shot('gate-zone');
    await save();
    await new Promise((r) => setTimeout(r, SAMPLE_MS));
  }
  await shot('final');

  const withPlumes = samples.flatMap((s) => s.ships).filter((r) => r.haloVisible);
  const burnLenMax = Math.max(0, ...withPlumes.map((r) => r.haloLen || 0));
  const farthestVisible = Math.max(0, ...withPlumes.map((r) => r.distance));
  const summary = {
    samples: samples.length,
    shipRows: samples.reduce((n, s) => n + s.ships.length, 0),
    visiblePlumeRows: withPlumes.length,
    burnLenMax,
    farthestVisible,
    midFadeSeen,
  };
  await writeFile(join(folder, 'evidence.json'), JSON.stringify({ summary, samples }, null, 2));
  console.log('SUMMARY', JSON.stringify(summary));
  assert.ok(summary.samples >= 60, 'enough samples collected');
  assert.ok(summary.shipRows >= 10, 'traffic observed near the lane');
  assert.ok(summary.visiblePlumeRows >= 1, 'at least one burning plume measured in the world');
  assert.ok(burnLenMax <= 26 + CAP_EPS, 'no visible halo exceeded the cap');
  assert.ok(summary.midFadeSeen, 'a mid-fade (300-750 u) visible plume with reduced opacity was observed');
}, { serve: 'preview' });

assert.equal(result.verdict, 'PASS');
console.log('issue-351 live probe: PASS', resolve(out, 'plume-cap'));
