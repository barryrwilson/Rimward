/**
 * Issue #234 — NATURAL live-browser light-hull docking probe. Diagnosis only.
 *
 * No fixtures, no teleporting, no clock change, no damage suppression, no
 * hazard removal, no timer edits. Starter light hull from the ordinary
 * Freehold Greenhand origin, real station traffic, public Agent API only:
 * undock -> plotRoute -> engageAutopilot -> approachDock (queued dock) -> dock.
 *
 * Route: Freehold -> Veridian -> Freehold (-> Hollow Reach if budget remains).
 *
 * The only in-page instrumentation is read-only: a 0.25 s sampler and a
 * pass-through wrapper on ctx.emit that records every event and forwards it
 * unchanged. Neither alters game state.
 *
 * Ports: Vite on loopback 5234 (ISSUE74_PORT). The shared issue-74 harness
 * launches Chrome with --remote-debugging-port=0, so CDP takes an ephemeral
 * loopback port; that file is outside this issue's write set, so the intended
 * 9334 is recorded as requested-but-not-applied rather than silently claimed.
 *
 * Usage: node scripts/issue-234-light-dock-live-probe.mjs
 */

import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

process.env.ISSUE74_OUT ||= resolve('out/issue-234/live');
process.env.ISSUE74_PORT ||= '5234';

const WALL_BUDGET_MS = Number(process.env.ISSUE234_BUDGET_MS || 8 * 60 * 1000);
const CDP_PORT_REQUESTED = 9334;

const { runLive } = await import('./issue-74-live-harness.mjs');

/**
 * Destination ids and ctx.world.currentSystem are compared after stripping
 * case and separators ('hollowreach' vs 'Hollow Reach'). Both raw values are
 * recorded on the leg, so a mismatch is auditable rather than assumed.
 */
const sysKey = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sameSystem = (a, b) => sysKey(a) !== '' && sysKey(a) === sysKey(b);

/** Read-only page instrumentation. Records; never writes game state. */
const INSTALL = `(() => {
  const ctx = window.__ctx;
  if (!ctx) throw Error('no ctx');
  if (window.__i234) return window.__i234.installed;
  const ev = { trace: [], events: [], apiHold: [], shapes: {}, start: ctx.world.time };
  window.__i234 = ev;

  // Pass-through event tap. Forwards every call unchanged. Only primitive
  // payload fields are kept: event data can carry live THREE/ctx references,
  // and serialising those over CDP blows the object reference chain.
  const scalars = (data) => {
    const o = {};
    if (!data || typeof data !== 'object') return typeof data === 'undefined' ? o : { data: String(data).slice(0, 120) };
    for (const k of Object.keys(data)) {
      const v = data[k];
      const t = typeof v;
      if (v === null || t === 'number' || t === 'boolean') o[k] = v;
      else if (t === 'string') o[k] = v.slice(0, 160);
    }
    return o;
  };
  const emit = ctx.emit;
  ctx.emit = function (type, data) {
    try {
      if (ev.events.length < 20000) {
        ev.events.push({ t: ctx.world.time, type: String(type), ...scalars(data) });
      }
    } catch {}
    return emit.apply(this, arguments);
  };

  // ctx.ships shape is not assumed; probe it and record what was found.
  const fleet = () => {
    const s = ctx.ships;
    if (!s) return [];
    if (Array.isArray(s)) { ev.shapes.ships = 'array'; return s; }
    if (Array.isArray(s.list)) { ev.shapes.ships = 'list'; return s.list; }
    if (Array.isArray(s.items)) {
      ev.shapes.ships = 'items';
      return Number.isFinite(s.count) ? s.items.slice(0, s.count) : s.items;
    }
    ev.shapes.ships = 'unknown:' + Object.keys(s).slice(0, 8).join(',');
    return [];
  };
  const vec = (o) => {
    if (!o) return null;
    if (Number.isFinite(o.x)) return o;
    if (o.position && Number.isFinite(o.position.x)) return o.position;
    if (o.object && o.object.position) return o.object.position;
    return null;
  };

  const sample = () => {
    if (window.__i234 !== ev) return;
    const now = ctx.world.time;
    const last = ev.trace.length ? ev.trace[ev.trace.length - 1].t : -Infinity;
    if (now - last >= 0.25) {
      const a = ctx.autopilot || {};
      const p = vec(ctx.ship && ctx.ship.object);
      const stp = ctx.station && ctx.station.position;
      // Traffic geometry: range AND speed, so a parked blocker (which
      // dockTrafficClears() refuses to wait for) is distinguishable from a
      // moving one. Nearest six only, to bound the trace size.
      const near = [];
      for (const s of fleet()) {
        const q = vec(s);
        if (!q || !p) continue;
        const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
        const r = Math.hypot(dx, dy, dz);
        if (!Number.isFinite(r) || r > 1200) continue;
        const v = s.velocity || s.motion || null;
        const sp = v && Number.isFinite(v.x) ? Math.hypot(v.x, v.y, v.z)
          : (Number.isFinite(s.speed) ? s.speed : null);
        near.push({
          id: s.id ?? s.recId ?? null,
          name: s.name ?? null,
          r: +r.toFixed(1),
          sp: sp === null ? null : +sp.toFixed(2),
          moving: sp === null ? null : sp >= 1e-3,
          // Range to the station, so a blocker parked on the pad is visible.
          stR: stp ? +Math.hypot(q.x - stp.x, q.y - stp.y, q.z - stp.z).toFixed(1) : null,
        });
      }
      near.sort((x, y) => x.r - y.r);
      const within300 = near.filter((n) => n.r <= 300);
      const speedKnown = within300.length > 0 && within300.every((n) => n.sp !== null);
      ev.trace.push({
        t: +now.toFixed(3),
        sys: ctx.world.currentSystem,
        mode: a.mode || '', phase: a.phase || '', reason: a.reason || '',
        engaged: a.engaged === true, idle: a.idle === true,
        apR: Number.isFinite(a.range) ? +a.range.toFixed(1) : null,
        prog: Number.isFinite(a.progress) ? +a.progress.toFixed(3) : null,
        thr: Number.isFinite(a.throttle) ? +a.throttle.toFixed(2) : null,
        spd: Number.isFinite(ctx.ship?.speed) ? +ctx.ship.speed.toFixed(2) : null,
        pos: p ? [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)] : null,
        stR: stp && p ? +Math.hypot(p.x - stp.x, p.y - stp.y, p.z - stp.z).toFixed(1) : null,
        inZone: ctx.station?.inZone === true,
        docked: ctx.flags?.docked === true,
        hull: ctx.player?.hull ?? ctx.ship?.hull ?? null,
        navStatus: ctx.nav?.status ?? ctx.world?.nav?.status ?? null,
        nearN: near.length,
        // Moving/parked counts are only meaningful when every ship in range
        // reported a speed. Neither s.velocity nor s.speed was populated in
        // the sampled runs, so the split is recorded as null rather than
        // reported as zero parked blockers. LIMITATION: the parked-blocker
        // question this probe was built to answer stays unanswered until the
        // NPC speed field is identified; no schema search was in scope.
        nearWithin300: within300.length,
        nearSpeedUnknownWithin300: within300.filter((n) => n.sp === null).length,
        nearMovingWithin300: speedKnown ? within300.filter((n) => n.moving === true).length : null,
        nearParkedWithin300: speedKnown ? within300.filter((n) => n.moving === false).length : null,
        near: near.slice(0, 6),
      });
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  ev.installed = { start: ev.start, classKey: ctx.player?.classKey, system: ctx.world.currentSystem };
  return ev.installed;
})()`;

const DRAIN = `(() => {
  const ev = window.__i234;
  const out = { trace: ev.trace, events: ev.events, shapes: ev.shapes, start: ev.start };
  ev.trace = []; ev.events = [];
  return out;
})()`;

await runLive('light-dock-natural', async ({ c, result, act, observe, wait, checkpoint, folder }) => {
  const wallStart = Date.now();
  const left = () => WALL_BUDGET_MS - (Date.now() - wallStart);

  result.fixture = false;
  result.natural = true;
  result.method = 'Natural starter light hull, Freehold Greenhand origin. Public Agent API only: '
    + 'undock, plotRoute, engageAutopilot, approachDock (queued dock), dock. Intact traffic. '
    + 'No teleport, no clock change, no damage suppression, no hazard removal, no timer edit, no fixture. '
    + 'In-page instrumentation is a read-only 0.25 s sampler plus a pass-through ctx.emit tap.';
  result.ports = {
    vite: Number(process.env.ISSUE74_PORT),
    cdpRequested: CDP_PORT_REQUESTED,
    cdpNote: 'The shared issue-74 harness hardcodes --remote-debugging-port=0 and is outside this '
      + "issue's write set, so CDP bound an ephemeral loopback port instead of 9334. "
      + 'Both listeners are 127.0.0.1-only.',
  };
  result.wallBudgetMs = WALL_BUDGET_MS;
  result.legs = [];
  result.trace = [];
  result.events = [];

  const drain = async () => {
    const d = await c.eval(DRAIN);
    result.trace.push(...d.trace);
    result.events.push(...d.events);
    result.shipsShape = d.shapes?.ships ?? null;
  };

  result.instrument = await c.eval(INSTALL);
  await checkpoint('boot-docked-freehold');

  // The starter hull must be the light class, or this is not the issue's case.
  const boot = await observe();
  result.startClass = result.instrument?.classKey ?? null;
  result.startSystem = boot.world.currentSystem;

  /**
   * One natural leg. Everything is a public API command; a refusal or a dock
   * cancellation is recorded as evidence, never worked around with state edits.
   */
  const leg = async (dest, label, maxRetries = 3) => {
    const legRec = {
      label, dest, retries: [], wallStartMs: Date.now() - wallStart,
      receipts: [], cancellations: [], completed: false,
    };
    result.legs.push(legRec);

    const say = async (name, args = {}) => {
      const r = await act(name, args, false);
      legRec.receipts.push({ name, args, ok: r.ok, token: r.token, notice: r.notice, t: r.t });
      return r;
    };

    /** A refused public command ends the leg as a recorded failure. */
    const refused = async (r, step) => {
      legRec.failed = { step, ok: r.ok, error: r.error ?? null, notice: r.notice ?? null };
      console.log('LEG REFUSED', label, step, JSON.stringify(legRec.failed));
      await drain();
      await checkpoint(`${label}-refused-${step}`);
      legRec.wallEndMs = Date.now() - wallStart;
      return legRec;
    };

    // The wait helper's own cap is 4x the simulation-second budget in wall
    // time, which can outlive the run's absolute budget. Its `sample` hook
    // runs each poll, so throwing from it enforces the remaining wall budget
    // without touching the shared harness.
    const budgetGuard = () => {
      if (left() <= 0) throw Error(`wall budget exhausted during ${label}`);
    };

    let s = await observe();
    if (s.flags.docked) {
      const un = await say('undock');
      if (!un.ok) return refused(un, 'undock');
      // Undock is not instantaneous; routing while still docked is what made
      // this probe report success it had not observed.
      try {
        await wait((o) => o.flags.docked === false,
          Math.min(90, Math.max(20, left() / 1000 - 30)), `${label} undock completes`, budgetGuard);
      } catch (e) {
        legRec.failed = { step: 'undock-settle', timeout: String(e).slice(0, 300) };
        await drain();
        legRec.wallEndMs = Date.now() - wallStart;
        return legRec;
      }
    }
    const plotted = await say('plotRoute', { dest });
    if (!plotted.ok) return refused(plotted, 'plotRoute');
    const engaged = await say('engageAutopilot');
    if (!engaged.ok) return refused(engaged, 'engageAutopilot');
    // Queued dock: asked for before the route arrives, exactly as a player
    // agent would. This is the #183 handoff path the spy run exercised.
    const queued = await say('approachDock');
    legRec.queuedAccepted = queued.ok === true;
    if (!queued.ok) return refused(queued, 'approachDock');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (left() < 45000) { legRec.abortedForBudget = true; break; }
      let last = null;
      try {
        last = await wait(
          (o) => o.flags.docked === true
            || (o.autopilot?.mode === 'dock' && o.autopilot.engaged === false
              && ['impact', 'blocked', 'stale', 'lost-station', 'dock-refused'].includes(o.autopilot.reason)),
          Math.min(240, Math.max(30, left() / 1000 - 30)),
          `${label} attempt ${attempt}`,
          budgetGuard,
        );
      } catch (e) {
        legRec.retries.push({ attempt, timeout: String(e).slice(0, 300) });
        break;
      }
      await drain();
      if (last.flags.docked) {
        // Docked is not arrived. The leg completes only when the hull is
        // docked AND the destination system is the one that was plotted.
        const at = last.world?.currentSystem ?? null;
        legRec.dockedAtT = last.t;
        legRec.dockedSystem = at;
        legRec.completed = sameSystem(at, dest);
        if (!legRec.completed) {
          legRec.dockedWrongSystem = { expected: dest, actual: at };
          console.log('DOCKED ELSEWHERE', label, 'expected', dest, 'actual', at);
        }
        break;
      }
      const cancel = {
        attempt,
        t: last.t,
        reason: last.autopilot.reason,
        phase: last.autopilot.phase,
        range: last.autopilot.range,
        progress: last.autopilot.progress,
        speed: last.ship.speed,
        hull: last.ship.hull,
        nearest: (last.targets?.nearby || []).filter((x) => x.kind === 'ship')
          .slice(0, 5).map((x) => ({ name: x.name, range: +x.range.toFixed(1) })),
        // The 0.25 s trace around the cancellation is the real evidence.
        traceWindow: result.trace.filter((r) => r.t >= last.t - 25 && r.t <= last.t + 1),
        eventsWindow: result.events.filter((r) => r.t >= last.t - 25 && r.t <= last.t + 1),
      };
      legRec.cancellations.push(cancel);
      console.log('CANCEL', label, cancel.reason, 'range', cancel.range, 'phase', cancel.phase);
      await checkpoint(`${label}-cancel-${attempt}-${cancel.reason}`);
      if (attempt === maxRetries) break;
      const retry = await say('approachDock');
      if (!retry.ok) { legRec.retryRefused = retry; break; }
    }
    await drain();
    await checkpoint(`${label}-end`);
    legRec.wallEndMs = Date.now() - wallStart;
    return legRec;
  };

  await leg('veridian', 'freehold-to-veridian');
  if (left() > 90000) await leg('freehold', 'veridian-to-freehold');
  else result.skipped = ['veridian-to-freehold'];
  if (left() > 120000) await leg('hollowreach', 'freehold-to-hollowreach');
  else result.skipped = [...(result.skipped || []), 'freehold-to-hollowreach'];

  await drain();

  // ---- summary, separating impact safety from planning/stall cancellations
  const cancels = result.legs.flatMap((l) => l.cancellations.map((x) => ({ leg: l.label, ...x })));
  const bodyHits = result.events.filter((e) => e.type === 'bodyHit')
    .map((e) => ({
      t: e.t, kind: e.kind, speed: e.speed, damage: e.damage,
      // src/game/autopilot.js:L282-L288 — only damage 0 AND |speed| < 1 is spared.
      wouldCancelDock: !(e.damage === 0 && Number.isFinite(e.speed) && Math.abs(e.speed) < 1),
    }));
  result.summary = {
    legsRun: result.legs.length,
    legsCompleted: result.legs.filter((l) => l.completed).length,
    cancellations: cancels.length,
    impactCancellations: cancels.filter((x) => x.reason === 'impact').length,
    blockedCancellations: cancels.filter((x) => x.reason === 'blocked').length,
    bodyHitsTotal: bodyHits.length,
    bodyHitsHarmful: bodyHits.filter((h) => h.wouldCancelDock).length,
    traceSamples: result.trace.length,
    traceCadenceS: 0.25,
    eventsCaptured: result.events.length,
    wallElapsedS: +((Date.now() - wallStart) / 1000).toFixed(1),
    // A class that did not recur here is NOT declared fixed.
    unreproducedNote: 'Classes absent from this run are unreproduced, not absent from the product.',
  };
  result.bodyHits = bodyHits;
  result.cancellationsFlat = cancels.map(({ traceWindow, eventsWindow, ...rest }) => rest);

  // Full trace is large; keep it out of result.json and beside it instead.
  await writeFile(resolve(folder, 'trace-0.25s.json'), JSON.stringify(result.trace));
  await writeFile(resolve(folder, 'events.json'), JSON.stringify(result.events, null, 1));
  await writeFile(resolve(folder, 'cancellation-windows.json'), JSON.stringify(cancels, null, 1));
  result.traceFile = 'trace-0.25s.json';
  result.trace = [];
  result.events = [];

  console.log('SUMMARY', JSON.stringify(result.summary, null, 2));
  // Diagnosis probe: a natural cancellation is the evidence being sought, so
  // it must not fail the run. Only harness/console faults fail.
});
