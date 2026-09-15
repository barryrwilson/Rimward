import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = resolve('out/issue-185-live');
const { runLive } = await import('./issue-74-live-harness.mjs');
await runLive('dock-receipts', async ({ c, result, act, wait, checkpoint }) => {
  result.fixture = true;
  result.method = 'Initial 120u station pose; real approachDock flight and station docking; no further pose writes.';
  await c.eval(`(() => {
    const ctx = window.__ctx, st = ctx.station.position;
    ctx.ship.object.position.set(st.x + 120, st.y, st.z);
    ctx.ship.velocity.set(0,0,0); ctx.ship.speed = 0; ctx.input.fullStop = true;
    const rows = window.__receiptRows = [], seen = new WeakSet();
    const sample = () => {
      for (const ev of [...ctx.lastEvents, ...ctx.events]) {
        if (seen.has(ev)) continue; seen.add(ev);
        if (['docked','hailMiss','commLine'].includes(ev.type)) rows.push({type:ev.type,text:ev.text,reason:ev.reason,dist:ev.dist});
      }
      requestAnimationFrame(sample);
    }; requestAnimationFrame(sample);
  })()`);
  await act('approachDock');
  await wait(s => s.flags.docked && s.autopilot.phase === 'complete', 90, 'clean docking');
  await c.eval('new Promise(resolve => setTimeout(resolve, 500))');
  result.receipts = await c.eval('window.__receiptRows');
  assert.equal(result.receipts.filter(e => e.type === 'docked').length, 1);
  assert.equal(result.receipts.some(e => e.type === 'hailMiss' && e.reason === 'dock-range'), false);
  assert.equal(result.receipts.some(e => e.text === 'Dock approach refused — already docked.'), false);
  await checkpoint('clean-docked');
  const refused = await act('approachDock', {}, false);
  assert.equal(refused.ok, false); assert.equal(refused.token, 'docked');
  await checkpoint('explicit-refusal-control');
});
