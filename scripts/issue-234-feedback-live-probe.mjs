/**
 * Issue #234 — live HUD/commLine feedback for the two changed approach lines.
 *
 * FIXTURE, AND DECLARED AS ONE. This probe drives disengage(ctx,'blocked') and
 * disengage(ctx,'impact') directly so both receipts can be measured on demand.
 * It is NOT natural flight evidence and makes no claim about how often either
 * cancellation occurs. The natural evidence is the separate run recorded under
 * out/issue-234/live/light-dock-natural.
 *
 * What it measures, at desktop 1440x900 and compact 800x600:
 *   - the persistent HUD chip's bounding rect and computed style;
 *   - element overflow (scrollWidth vs clientWidth) — the chip inherits
 *     `.rw-agent-helm { white-space: nowrap }` from src/ui/hud.css;
 *   - viewport overflow (document scrollWidth vs innerWidth) and whether the
 *     chip's right/bottom edge leaves the viewport;
 *   - that the whole string is actually visible, not clipped;
 *   - the commLine event text;
 *   - bounded retry semantics: the helm is NOT retaken automatically, a fresh
 *     approachDock is accepted, and the receipt clears.
 *
 * Usage: node scripts/issue-234-feedback-live-probe.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

process.env.ISSUE74_OUT ||= resolve('out/issue-234/feedback-live');
process.env.ISSUE74_PORT ||= '5234';

const { runLive } = await import('./issue-74-live-harness.mjs');

const NEXT_ACTION = 'Wait for clearance or steer clear, then retry the approach.';
const VIEWPORTS = [
  { label: 'desktop-1440x900', width: 1440, height: 900 },
  { label: 'compact-800x600', width: 800, height: 600 },
];

/** Park the hull in open space and cancel the dock helm with `reason`. */
const CANCEL = (reason) => `(async()=>{
  const ctx = window.__ctx;
  const { disengage } = await import('/src/game/autopilot.js');
  ctx.flags.docked = false;
  ctx.station.inZone = false;
  ctx.ship.object.position.set(ctx.station.position.x + 700, ctx.station.position.y, ctx.station.position.z);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
  ctx.autopilot.engaged = true;
  ctx.autopilot.mode = 'dock';
  disengage(ctx, ${JSON.stringify(reason)});
  return { reason: ctx.autopilot.reason, engaged: ctx.autopilot.engaged, mode: ctx.autopilot.mode, phase: ctx.autopilot.phase };
})()`;

/** Read the persistent receipt chip: geometry, clipping and computed style. */
const MEASURE = `(() => {
  const n = document.querySelector('[data-dock-failure]')
    || [...document.querySelectorAll('#hud .rw-agent-helm')].find(e => /Dock approach/.test(e.textContent||''));
  if (!n) return { found: false };
  const cs = getComputedStyle(n);
  const r = n.getBoundingClientRect();
  const doc = document.documentElement;
  return {
    found: true,
    text: n.textContent,
    visible: !n.classList.contains('is-hidden') && r.width > 0 && r.height > 0 && cs.display !== 'none',
    rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) },
    scrollWidth: n.scrollWidth,
    clientWidth: n.clientWidth,
    // A nowrap chip wider than its box, or wider than the viewport, is clipped.
    elementOverflowPx: n.scrollWidth - n.clientWidth,
    overflowsViewportRight: r.right > innerWidth + 0.5,
    overflowsViewportBottom: r.bottom > innerHeight + 0.5,
    offscreenLeft: r.x < -0.5,
    documentScrollWidth: doc.scrollWidth,
    innerWidth,
    innerHeight,
    documentOverflows: doc.scrollWidth > innerWidth + 0.5,
    style: {
      whiteSpace: cs.whiteSpace, maxWidth: cs.maxWidth, overflow: cs.overflow,
      textOverflow: cs.textOverflow, fontSize: cs.fontSize, textTransform: cs.textTransform,
      overflowWrap: cs.overflowWrap, wordBreak: cs.wordBreak, lineHeight: cs.lineHeight,
    },
    lines: Math.max(1, Math.round(r.height / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 || 12))),
  };
})()`;

await runLive('dock-feedback', async ({ c, result, act, observe, wait, shot, folder }) => {
  result.fixture = true;
  result.method = 'DECLARED FIXTURE. Synthetic disengage(ctx,"blocked"|"impact") in open space, at two '
    + 'viewports, to measure the persistent HUD receipt and commLine text for the two lines changed by '
    + 'issue #234. Not natural flight evidence; no claim about cancellation frequency.';
  result.nextAction = NEXT_ACTION;
  result.measurements = [];

  const events = async () => c.eval(`(()=>{
    const ctx = window.__ctx;
    if (!window.__f234) {
      window.__f234 = [];
      const emit = ctx.emit;
      ctx.emit = function (type, data) {
        if (type === 'commLine' && data && typeof data.text === 'string') window.__f234.push({ t: ctx.world.time, text: data.text });
        return emit.apply(this, arguments);
      };
    }
    const out = window.__f234.slice();
    window.__f234.length = 0;
    return out;
  })()`);
  await events(); // install the read-only commLine tap

  for (const vp of VIEWPORTS) {
    await c.send('Emulation.setDeviceMetricsOverride',
      { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false });
    // Let the HUD relayout at the new size before measuring.
    await c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');

    for (const reason of ['blocked', 'impact']) {
      const state = await c.eval(CANCEL(reason));
      assert.equal(state.reason, reason, `${vp.label}/${reason}: reason token`);
      // disengage() must never hand the helm back to the pilot by itself.
      assert.equal(state.engaged, false, `${vp.label}/${reason}: helm released, not retaken`);

      const said = await events();
      await c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      const m = await c.eval(MEASURE);
      const name = `${vp.label}-${reason}`;
      await shot(name);

      const rec = { viewport: vp, reason, apAfterCancel: state, commLines: said, ...m, screenshot: `${name}.png` };
      // A chip whose own box clips its text, or that leaves the viewport, is
      // not usable feedback however correct the copy is.
      rec.textFullyVisible = m.found && m.visible && m.elementOverflowPx <= 0
        && !m.overflowsViewportRight && !m.overflowsViewportBottom && !m.offscreenLeft;
      result.measurements.push(rec);
      console.log('MEASURE', name,
        'w=' + m.rect?.w, 'scrollW=' + m.scrollWidth, 'clientW=' + m.clientWidth,
        'overflowPx=' + m.elementOverflowPx, 'right=' + m.rect?.right + '/' + m.innerWidth,
        'ws=' + m.style?.whiteSpace, 'lines=' + m.lines, 'fullyVisible=' + rec.textFullyVisible);

      assert.equal(m.found, true, `${name}: receipt chip present`);
      assert.equal(m.visible, true, `${name}: receipt chip visible`);
      assert.ok(m.text.includes(NEXT_ACTION), `${name}: receipt names the next action`);
      assert.ok(said.some((e) => e.text.includes(NEXT_ACTION)), `${name}: commLine names the next action`);
      const cause = reason === 'blocked' ? 'route is blocked' : 'hull contact';
      assert.ok(m.text.includes(cause), `${name}: receipt keeps the specific cause`);
      assert.ok(said.some((e) => e.text.includes(cause)), `${name}: commLine keeps the specific cause`);
    }
  }

  // ---- bounded retry semantics, measured once at the desktop size
  await c.send('Emulation.setDeviceMetricsOverride',
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await c.eval(CANCEL('blocked'));
  const beforeRetry = await observe();
  result.retry = { apBeforeRetry: beforeRetry.autopilot };
  assert.equal(beforeRetry.autopilot.engaged, false, 'helm stays released until the pilot asks');

  // The receipt must outlive a transient toast, or the next action is unreadable.
  const failedAt = await c.eval('window.__ctx.world.time');
  await wait((s) => s.t >= failedAt + 6, 12, 'receipt outlives transient toast');
  result.retry.persistedAfter6s = await c.eval(MEASURE);
  assert.equal(result.retry.persistedAfter6s.visible, true, 'receipt persists past 6 s');
  assert.ok(result.retry.persistedAfter6s.text.includes(NEXT_ACTION), 'persisted receipt keeps the next action');

  // The advertised next action must actually work through the public command.
  const retry = await act('approachDock', {}, false);
  result.retry.receipt = retry;
  assert.equal(retry.ok, true, 'the advertised retry is accepted: ' + JSON.stringify(retry));
  await wait((s) => s.autopilot.engaged === true, 4, 'fresh approach takes the helm');
  await c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  result.retry.clearedReceipt = await c.eval(MEASURE);
  assert.equal(result.retry.clearedReceipt.found && result.retry.clearedReceipt.visible, false,
    'accepting the retry clears the receipt');
  await act('cancelAutopilot');
  await shot('after-retry-cleared');

  // ---- verdict on the CSS question this probe was launched to settle
  const clipped = result.measurements.filter((m) => !m.textFullyVisible);
  result.overflow = {
    anyClipped: clipped.length > 0,
    clipped: clipped.map((m) => ({
      viewport: m.viewport.label, reason: m.reason,
      elementOverflowPx: m.elementOverflowPx,
      rectRight: m.rect?.right, innerWidth: m.innerWidth,
      overflowsViewportRight: m.overflowsViewportRight,
      whiteSpace: m.style?.whiteSpace,
    })),
    verdict: clipped.length > 0
      ? 'OVERFLOW CONFIRMED — a narrow [data-dock-failure] wrapping/max-width rule is warranted.'
      : 'NO OVERFLOW MEASURED — no CSS change is warranted on this evidence.',
  };
  console.log('OVERFLOW', JSON.stringify(result.overflow, null, 2));

  await writeFile(resolve(folder, 'measurements.json'), JSON.stringify(result.measurements, null, 1));
});
