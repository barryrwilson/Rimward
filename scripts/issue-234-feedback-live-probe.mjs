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

/**
 * Layout of every visible cancellation receipt against the HUD furniture it
 * must not cover. Returns the persistent chip, every visible matching toast,
 * and the obstacles: Controls (top-left), Manifest (top-right) and the
 * onboarding hint. Intersections are computed here so the assertions below
 * read from measured rects, not from a screenshot judgement.
 */
const LAYOUT = `(() => {
  const r = (n) => { const b = n.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1) }; };
  const shown = (n) => { const cs = getComputedStyle(n); const b = n.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0.01
      && b.width > 0 && b.height > 0; };
  const hit = (a, b) => a.x < b.right - 0.5 && b.x < a.right - 0.5
    && a.y < b.bottom - 0.5 && b.y < a.bottom - 0.5;
  const describe = (n, role) => {
    const cs = getComputedStyle(n);
    const box = r(n);
    return { role, text: (n.textContent || '').trim().slice(0, 200), rect: box,
      scrollWidth: n.scrollWidth, clientWidth: n.clientWidth,
      elementOverflowPx: n.scrollWidth - n.clientWidth,
      clippedLeft: box.x < -0.5, clippedRight: box.right > innerWidth + 0.5,
      clippedTop: box.y < -0.5, clippedBottom: box.bottom > innerHeight + 0.5,
      style: { whiteSpace: cs.whiteSpace, maxWidth: cs.maxWidth, overflow: cs.overflow,
        overflowWrap: cs.overflowWrap, marginTop: cs.marginTop } };
  };

  const persistNode = document.querySelector('#hud [data-dock-failure]:not(.is-hidden)');
  const persist = persistNode && shown(persistNode) ? describe(persistNode, 'persistent') : null;
  // Matched by class AND by copy, so a future comm line cannot be counted here
  // by accident and a missing class cannot be hidden by the text match.
  const toasts = [...document.querySelectorAll('.rw-toast')]
    .filter((n) => shown(n) && /Dock approach cancelled/.test(n.textContent || ''))
    .map((n, i) => ({ ...describe(n, 'toast-' + i),
      hasDedicatedClass: n.classList.contains('rw-toast-dock-failure') }));

  const OBSTACLES = [['.rw-controls', 'Controls'], ['.rw-resources', 'Manifest'],
    ['.rw-onboard-hint', 'onboarding hint']];
  const obstacles = [];
  for (const [sel, label] of OBSTACLES) {
    for (const n of document.querySelectorAll(sel)) {
      if (shown(n)) obstacles.push({ label, selector: sel, rect: r(n) });
    }
  }

  // Every visible cancellation receipt vs every obstacle, the persistent chip,
  // and each other.
  const boxes = [...(persist ? [persist] : []), ...toasts];
  const intersections = [];
  for (const b of boxes) {
    for (const o of obstacles) {
      if (hit(b.rect, o.rect)) intersections.push({ a: b.role, b: o.label, aRect: b.rect, bRect: o.rect });
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (hit(boxes[i].rect, boxes[j].rect)) {
        intersections.push({ a: boxes[i].role, b: boxes[j].role, aRect: boxes[i].rect, bRect: boxes[j].rect });
      }
    }
  }
  const clipped = boxes.filter((b) => b.elementOverflowPx > 0 || b.clippedLeft || b.clippedRight
    || b.clippedTop || b.clippedBottom)
    .map((b) => ({ role: b.role, elementOverflowPx: b.elementOverflowPx, rect: b.rect,
      clippedLeft: b.clippedLeft, clippedRight: b.clippedRight,
      clippedTop: b.clippedTop, clippedBottom: b.clippedBottom, whiteSpace: b.style.whiteSpace }));

  return { innerWidth, innerHeight, persistent: persist, toasts, obstacles, intersections, clipped,
    documentOverflows: document.documentElement.scrollWidth > innerWidth + 0.5 };
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

      const layout = await c.eval(LAYOUT);
      const rec = { viewport: vp, reason, apAfterCancel: state, commLines: said, ...m,
        layout, screenshot: `${name}.png` };
      // A chip whose own box clips its text, or that leaves the viewport, is
      // not usable feedback however correct the copy is.
      rec.textFullyVisible = m.found && m.visible && m.elementOverflowPx <= 0
        && !m.overflowsViewportRight && !m.overflowsViewportBottom && !m.offscreenLeft;
      // The transient toast is as much of the public feedback as the chip, so
      // the run is only clean when NOTHING is clipped and NOTHING overlaps.
      rec.layoutClean = layout.clipped.length === 0 && layout.intersections.length === 0
        && !layout.documentOverflows;
      result.measurements.push(rec);
      console.log('MEASURE', name,
        'w=' + m.rect?.w, 'scrollW=' + m.scrollWidth, 'clientW=' + m.clientWidth,
        'overflowPx=' + m.elementOverflowPx, 'right=' + m.rect?.right + '/' + m.innerWidth,
        'ws=' + m.style?.whiteSpace, 'lines=' + m.lines, 'fullyVisible=' + rec.textFullyVisible);
      console.log('LAYOUT', name, 'toasts=' + layout.toasts.length,
        'clipped=' + JSON.stringify(layout.clipped),
        'intersections=' + JSON.stringify(layout.intersections.map((i) => i.a + 'x' + i.b)),
        'clean=' + rec.layoutClean);

      // ---- the toast the QA screenshot caught running off the left edge
      assert.ok(layout.toasts.length > 0, `${name}: a cancellation toast is visible to measure`);
      for (const t of layout.toasts) {
        assert.equal(t.hasDedicatedClass, true, `${name}/${t.role}: toast carries rw-toast-dock-failure`);
        assert.ok(t.text.includes(NEXT_ACTION), `${name}/${t.role}: toast shows the whole next action`);
        assert.ok(t.elementOverflowPx <= 0,
          `${name}/${t.role}: toast text is not clipped by its own box (${t.elementOverflowPx}px)`);
        assert.equal(t.clippedLeft || t.clippedRight || t.clippedTop || t.clippedBottom, false,
          `${name}/${t.role}: toast is inside the viewport ${JSON.stringify(t.rect)} vs ${layout.innerWidth}x${layout.innerHeight}`);
      }
      // No receipt may cover Controls, Manifest, the hint, the persistent chip,
      // or another cancellation receipt.
      assert.deepEqual(layout.intersections, [],
        `${name}: receipts must not overlap HUD furniture or each other`);
      assert.deepEqual(layout.clipped, [], `${name}: nothing clipped`);
      assert.equal(layout.documentOverflows, false, `${name}: no document overflow`);

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
  const dirty = result.measurements.filter((m) => !m.layoutClean);
  result.overflow = {
    anyClipped: clipped.length > 0,
    clipped: clipped.map((m) => ({
      viewport: m.viewport.label, reason: m.reason,
      elementOverflowPx: m.elementOverflowPx,
      rectRight: m.rect?.right, innerWidth: m.innerWidth,
      overflowsViewportRight: m.overflowsViewportRight,
      whiteSpace: m.style?.whiteSpace,
    })),
    // Both receipts, both viewports. A previous run reported "no CSS change is
    // warranted" while the transient toast was running off the left edge,
    // because only the persistent chip was measured and nothing was asserted.
    anyLayoutProblem: dirty.length > 0,
    layoutProblems: dirty.map((m) => ({
      viewport: m.viewport.label, reason: m.reason,
      clipped: m.layout.clipped,
      intersections: m.layout.intersections,
      documentOverflows: m.layout.documentOverflows,
    })),
    verdict: (clipped.length > 0 || dirty.length > 0)
      ? 'LAYOUT PROBLEM MEASURED — see clipped / layoutProblems; this run does NOT clear the receipts.'
      : 'CLEAN — persistent chip and cancellation toasts are whole, inside the viewport, '
        + 'and clear of Controls, Manifest, the hint and each other at both viewports.',
  };
  console.log('OVERFLOW', JSON.stringify(result.overflow, null, 2));
  // The verdict is now a gate, not a note: a layout problem fails the run.
  assert.equal(result.overflow.anyClipped, false, 'no receipt may be clipped');
  assert.equal(result.overflow.anyLayoutProblem, false, 'no receipt may overlap HUD furniture');

  await writeFile(resolve(folder, 'measurements.json'), JSON.stringify(result.measurements, null, 1));
});
