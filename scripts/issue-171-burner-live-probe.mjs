/** Real rendered #171 near-pad handoff, with an explicit initial flight fixture.
 * ISSUE171_OUT=... node scripts/issue-171-burner-live-probe.mjs
 * Owns disposable loopback Chrome/Vite through the existing live harness.
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE171_OUT || resolve('out/issue-171-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive } = await import('./issue-74-live-harness.mjs');

// A 48u threshold leaves room for the browser's variable frame size while
// exercising the lower part of the reported 44–56u band.
for (const threshold of [56, 48]) {
  await runLive(`near-pad-${threshold}`, async ({ c, result, wait, checkpoint, save }) => {
    result.fixture = true;
    result.method = 'Initial +X pad-lane pose at 30u/s only; then public control/burner/dock actions and real rendered frames. Traffic, damage and collision remain enabled; no later position, velocity or invulnerability mutation.';
    await c.eval(`(() => {
      const ctx = window.__ctx, api = window.rimward, station = ctx.station.position;
      const target = ${threshold};
      ctx.ship.object.position.set(station.x + target + 18, station.y, station.z);
      ctx.ship.object.quaternion.set(0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4));
      ctx.ship.velocity.set(-30, 0, 0); ctx.ship.speed = 30;
      const evidence = window.__nearPad = { threshold: target, started: ctx.world.time,
        frames: 0, events: [], actions: [], phases: [] };
      const seen = new WeakSet();
      const act = (name, args = {}) => {
        const receipt = api.act({ v: 2, name, args });
        evidence.actions.push({ name, args, receipt });
        if (!receipt.ok) throw Error(name + ': ' + JSON.stringify(receipt));
      };
      const sample = () => ({ t: ctx.world.time,
        range: ctx.ship.object.position.distanceTo(station), speed: ctx.ship.speed,
        burnerActive: ctx.ship.burnerActive, flee: ctx.flee?.engaged === true });
      act('setControl', { seq: 1, ttl: 2, throttle: 1 });
      act('afterburner');
      let lastT = ctx.world.time;
      const frame = () => {
        if (evidence.finished) return;
        try {
          for (const event of [...ctx.events, ...ctx.lastEvents]) {
            if (seen.has(event)) continue;
            seen.add(event);
            if (['bodyHit', 'sunHeat', 'docked', 'playerDestroyed'].includes(event.type))
              evidence.events.push({ ...event });
          }
          if (ctx.world.time > lastT) {
            lastT = ctx.world.time;
            const now = sample();
            if (!evidence.handoff) {
              evidence.frames++;
              if (now.range <= target) {
                evidence.handoff = now;
                act('clearControl'); act('approachDock');
              }
            } else {
              evidence.takeover ??= now;
              const phase = api.observe().autopilot.phase;
              if (evidence.phases.at(-1) !== phase) evidence.phases.push(phase);
              if (ctx.flags.docked || !ctx.autopilot.engaged) {
                evidence.finished = true; evidence.end = now;
                evidence.docked = ctx.flags.docked;
                evidence.elapsed = now.t - evidence.handoff.t;
              }
            }
          }
          if (ctx.world.time - evidence.started > 65) throw Error('near-pad simulation timeout');
        } catch (error) { evidence.error = String(error); evidence.finished = true; }
        if (!evidence.finished) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      return evidence;
    })()`);
    try {
      await wait(s => s.flags.docked || (s.autopilot.mode === 'dock' && !s.autopilot.engaged),
        70, 'near-pad burner handoff');
    } finally {
      result.nearPad = await c.eval('new Promise(resolve => requestAnimationFrame(() => resolve(window.__nearPad)))');
      await save();
    }
    const evidence = result.nearPad;
    assert.equal(evidence.error, undefined, evidence.error);
    assert.ok(evidence.frames >= 3, 'real burner frames precede dock handoff');
    assert.ok(evidence.handoff.range >= 44 && evidence.handoff.range <= 56,
      `handoff must exercise reported band: ${JSON.stringify(evidence.handoff)}`);
    assert.ok(evidence.handoff.speed > 30, 'raw burner accelerates actual hull');
    assert.equal(evidence.handoff.burnerActive, true);
    assert.equal(evidence.handoff.flee, false);
    assert.equal(evidence.takeover.burnerActive, false, 'dock helm retires burner');
    assert.ok(evidence.takeover.speed < evidence.handoff.speed, 'dock takeover brakes');
    assert.equal(evidence.docked, true);
    assert.equal(evidence.events.some(e => ['bodyHit', 'sunHeat', 'playerDestroyed'].includes(e.type)), false);
    await checkpoint('safe-berth');
    console.log('NEAR_PAD_LIVE', JSON.stringify(evidence));
  });
}
