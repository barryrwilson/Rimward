/** Rendered #173 stop regression. Initial flight pose and tagged body-contact
 * event are fixtures; the weapon uses the production NPC projectile path.
 * No position/velocity resets after cancellation. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE173_OUT || resolve('out/issue-173-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive } = await import('./issue-74-live-harness.mjs');

await runLive('dock-cancel', async ({ c, result, wait, checkpoint, save }) => {
  result.fixture = true;
  result.method = 'Initial open-space pose and NPC gunner; real cannon projectile strikes shields. Then a tagged bodyHit event with chart open exercises cancellation and real rendered ship deceleration, without later velocity/position writes. Physical collision geometry remains covered by normal dock tests; this event fixture does not claim a live ram.';
  await c.eval(`(async () => {
    const ctx = window.__ctx, api = window.rimward;
    const { spawnLiveShip, removeLiveShip } = await import('/src/systems/npc.js');
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    await primeShipAsset('redledger', 'cutter', 'pirate');
    const station = ctx.station.position;
    ctx.ship.object.position.set(station.x + 700, station.y, station.z);
    ctx.ship.object.quaternion.identity();
    ctx.ship.velocity.set(0, 0, -30); ctx.ship.speed = 30;
    ctx.input.throttle = 0.8; ctx.input.fullStop = false;
    const gunner = spawnLiveShip(ctx, { id: 'i173-live-gunner', name: 'Dock test gunner', faction: 'redledger', role: 'pirate', classKey: 'cutter', resolve: 60, personality: 0 },
      ctx.ship.object.position.clone().setZ(ctx.ship.object.position.z - 40));
    if (!gunner) throw Error('primed cutter visual unavailable');
    gunner.ai.demandSent = true; gunner.ai.playerRolled = true; gunner.ai.playerInterested = false;
    ctx.ships.push(gunner);
    const e = window.__dockCancel = { started: ctx.world.time, events: [], samples: [], actions: [] };
    const r = api.act({ v: 2, name: 'approachDock', args: {} });
    e.actions.push(r); if (!r.ok) throw Error(JSON.stringify(r));
    const seen = new WeakSet(); let last = -1, shotAt = -10;
    const sample = () => ({ t: ctx.world.time, speed: ctx.ship.speed, fullStop: ctx.input.fullStop,
      throttle: ctx.input.throttle, engaged: ctx.autopilot.engaged, reason: ctx.autopilot.reason,
      chartOpen: ctx.flags.chartOpen, position: ctx.ship.object.position.toArray() });
    const frame = () => {
      if (e.finished) return;
      try {
        for (const ev of [...ctx.lastEvents, ...ctx.events]) {
          if (seen.has(ev)) continue; seen.add(ev);
          if (['playerHit', 'bodyHit', 'commLine'].includes(ev.type)) {
            const row = { type: ev.type, kind: ev.kind, shielded: ev.shielded,
              attackerId: ev.attackerId, text: ev.text, t: ctx.world.time };
            e.events.push(row);
            if (ev.type === 'playerHit' && ev.attackerId === gunner.id && !e.weapon) {
              e.weapon = { ...sample(), shielded: ev.shielded };
              ctx.ships.splice(ctx.ships.indexOf(gunner), 1); removeLiveShip(ctx, gunner);
              e.contact = sample();
              ctx.flags.chartOpen = true;
              ctx.emit('bodyHit', { kind: 'station', speed: 30, damage: 0 });
            }
          }
        }
        if (!e.weapon && ctx.world.time - shotAt > 0.3) {
          shotAt = ctx.world.time;
          ctx.emit('npcFire', { ship: gunner, weapon: 'cannon', target: 'player' });
        }
        if (ctx.world.time !== last) {
          last = ctx.world.time; const now = sample(); e.samples.push(now);
          if (e.contact && !now.engaged) {
            e.cancel ??= now;
            if (now.t - e.cancel.t > 3) { e.end = now; e.finished = true; }
          }
        }
        if (ctx.world.time - e.started > 25) throw Error('projectile/cancellation timeout');
      } catch (error) { e.error = String(error); e.finished = true; }
      if (!e.finished) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  })()`);
  try {
    await wait(s => s.autopilot.reason === 'impact' && s.flags.fullStop && s.ship.speed < 0.1,
      30, 'rendered cancellation stop');
    await c.eval('new Promise(resolve => setTimeout(resolve, 3500))');
  } finally {
    result.cancellation = await c.eval('window.__dockCancel'); await save();
  }
  const e = result.cancellation;
  assert.equal(e.error, undefined, e.error);
  assert.equal(e.weapon?.shielded, true);
  assert.equal(e.weapon.engaged, true, 'real weapon shield strike keeps approach');
  assert.ok(e.contact.speed > 1, 'contact starts from moving hull');
  assert.equal(e.cancel.reason, 'impact'); assert.equal(e.cancel.fullStop, true);
  assert.equal(e.end.fullStop, true); assert.equal(e.end.throttle, 0);
  assert.ok(e.end.speed < 0.1, 'rendered flight settles below creep');
  assert.ok(e.end.chartOpen, 'chart remains open during stop');
  // Issue #234 appended a next action; the specific cause text is unchanged.
  assert.ok(e.events.some(ev => ev.text === 'Dock approach cancelled: hull contact. Wait for clearance or steer clear, then retry the approach.'));
  await checkpoint('cancelled-full-stop');
});
