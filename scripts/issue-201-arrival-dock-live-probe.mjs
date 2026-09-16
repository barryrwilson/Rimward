/** Queued route flight in a real browser, including a disclosed bore-edge fixture. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT ||= resolve('out/issue-201/live');
const { runLive } = await import('./issue-74-live-harness.mjs');
const edge = process.env.ISSUE201_EDGE !== '0';
const seed = Number(process.env.ISSUE201_SEED ?? 7);
await runLive(edge ? 'bore-edge' : 'natural', async ({ c, result, act, wait, checkpoint }) => {
  result.fixture = true;
  result.boreEdgeFixture = edge;
  result.worldFixture = 'Declared seed ' + seed + ' installed before page scripts/world boot; all physics and traffic active.';
  result.method = edge
    ? 'Real queued routes Freehold to Veridian and back; once per arrival, after jump ends and before dock takeover, put stationary hull 25.39u off-axis inside bore. No further pose writes; traffic and collisions remain active.'
    : 'Natural queued routes Freehold to Veridian and back; no pose or traffic writes.';
  for (const dest of ['veridian', 'freehold']) {
    const before = await c.eval('window.rimward.observe().flags.docked');
    if (before) {
      // Launch can legitimately wait on local traffic. Retry only that
      // refusal, under wait's 30s simulation / 120s wall-clock bounds.
      // The route and approachDock commands below are still sent once.
      await wait(s => !s.flags.docked, 30, 'departure lane clears', async s => {
        if (!s.flags.docked) return;
        const receipt = await act('undock', {}, false);
        assert.ok(receipt.ok || receipt.token === 'blocked',
          'unexpected undock refusal: ' + JSON.stringify(receipt));
      });
    }
    await c.eval(`(async () => {
      const { SYSTEMS } = await import('/src/game/state.js');
      const ctx = window.__ctx, dest = ${JSON.stringify(dest)}, edge = ${edge};
      const from = ctx.world.currentSystem, gate = SYSTEMS[dest].gates.find(g => g.to === from);
      const rows = window.__arrivalDock = { dest, hits: [], phases: [], arrivedAt: null, handoffAt: null, fixtureApplied: false };
      const seen = new WeakSet();
      const sample = () => {
        if (window.__arrivalDock !== rows) return;
        if (ctx.world.currentSystem === dest) {
          rows.arrivedAt ??= ctx.world.time;
          if (edge && !ctx.gate.jumping && !rows.fixtureApplied) {
            rows.fixtureApplied = true;
            rows.fixtureAppliedAt = ctx.world.time;
            rows.fixtureHelm = { mode: ctx.autopilot.mode, phase: ctx.autopilot.phase, engaged: ctx.autopilot.engaged };
            const p = gate.position, st = ctx.station.position, n = Math.hypot(...p);
            const ax=-p[0]/n, ay=-p[1]/n, az=-p[2]/n;
            const dx=st.x-p[0], dy=st.y-p[1], dz=st.z-p[2], dot=dx*ax+dy*ay+dz*az;
            const rx=dx-dot*ax, ry=dy-dot*ay, rz=dz-dot*az, r=Math.hypot(rx,ry,rz);
            ctx.ship.object.position.set(p[0]+rx/r*25.39,p[1]+ry/r*25.39,p[2]+rz/r*25.39);
            ctx.ship.velocity.set(0,0,0); ctx.ship.speed=0;
            rows.fixturePose=ctx.ship.object.position.toArray();
          }
          if (ctx.autopilot.mode === 'dock') {
            rows.handoffAt ??= ctx.world.time;
            if (rows.phases.at(-1)?.phase !== ctx.autopilot.phase)
              rows.phases.push({ phase:ctx.autopilot.phase,t:ctx.world.time,position:ctx.ship.object.position.toArray(),speed:ctx.ship.speed });
          }
          for (const ev of [...ctx.lastEvents,...ctx.events]) {
            if (seen.has(ev)) continue; seen.add(ev);
            if (ev.type === 'bodyHit') rows.hits.push({ ...ev });
          }
        }
        if (!ctx.flags.docked) requestAnimationFrame(sample);
      }; requestAnimationFrame(sample);
    })()`);
    await act('plotRoute', { dest });
    await act('engageAutopilot');
    assert.equal((await act('approachDock')).status, 'queued');
    await wait(s => s.flags.docked || s.autopilot.phase === 'failed', 200, `${dest} berth`);
    const observation = await checkpoint(dest + '-arrival-docked');
    const rows = await c.eval('window.__arrivalDock');
    (result.legs ||= []).push(rows);
    assert.equal(rows.hits.some(e => e.kind === 'gate'), false, dest + ' no gate contact');
    assert.equal(observation.flags.docked, true, dest + ' reaches berth');
    assert.ok(rows.handoffAt - rows.arrivedAt < 5, 'handoff deadline');
    if (edge) {
      assert.notEqual(rows.fixtureHelm.mode, 'dock', 'fixture precedes dock takeover');
      assert.equal(rows.phases[0].phase, 'stage', 'clear bore before cruise');
    }
  }
}, { seed });
