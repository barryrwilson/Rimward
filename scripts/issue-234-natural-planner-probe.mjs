/**
 * Issue #234 — NATURAL live-browser light-hull docking probe, ENRICHED.
 * Diagnosis only. No product source is edited by this script.
 *
 * What is different from scripts/issue-234-light-dock-live-probe.mjs:
 *
 * 1. The NPC sampler uses the ACTUAL live-ship shape read from
 *    src/systems/npc.js:L458-L465 — `live = { id, record, object, state, role,
 *    ai }` — so `record.id`, `record.name` and `ai.velocity` are read instead
 *    of the guessed `s.name` / `s.velocity` fields that came back null in the
 *    earlier run. `ai.velocity` is the same field the dock planner itself
 *    consumes (src/game/dock-cruise.js:L26 `ship?.ai?.velocity`), so a null
 *    here is now a real null for the planner too, not a probe artifact.
 *
 * 2. Planner branch, selected waypoint, clearance guards and watchdog progress
 *    are captured with CDP logpoints — conditional breakpoints whose condition
 *    records the paused frame's own locals and then returns false, so the page
 *    never actually pauses and no product source is modified. The runtime
 *    source hash is verified unchanged by the shared harness at both ends.
 *
 * 3. The capture FAILS CLOSED. A debugger pause, a page instrumentation error,
 *    a dropped decision sample, a flown phase whose logpoint captured nothing,
 *    or traffic within 300 u whose speed could not be read all set
 *    `summary.captureVerdict = 'FAIL'` and raise after the artifacts are
 *    written. A run that cannot prove it captured cleanly is not evidence.
 *
 * Instrumentation is read-only throughout: a sampler, a pass-through ctx.emit
 * tap, and breakpoint conditions that read the paused frame and push. Two
 * conditions also CALL a product predicate — `dockCruiseShouldBrake` and
 * `dockShouldBrake` — to record the cruise hold's separate terms. Both are
 * pure: they read position, velocity and the body bag and return a boolean
 * (src/game/dock-cruise.js:L117-L146). Nothing else is invoked. No
 * teleporting, no clock change, no timer relaxation, no traffic disabling, no
 * damage suppression, no solar bypass, no automatic reacquisition. Retries are
 * explicit public `approachDock` commands.
 *
 * Known limit, stated rather than hidden: the sun pose is read best-effort and
 * recorded as `not-found` when no known field matches, so solar chord geometry
 * may be absent. No solar cause may be inferred from a run that records that.
 *
 * Ports: Vite on loopback 5236 (this issue's reserved port, kept clear of the
 * other probes). CDP takes an ephemeral loopback port from the shared issue-74
 * harness, which is outside this issue's write set.
 *
 * Usage: node scripts/issue-234-natural-planner-probe.mjs
 *
 * Optional environment:
 *   ISSUE234_ORIGIN     'greenhand' (default, Freehold Greenhand) or 'drifter'
 *                       (Rim Drifter, which boots in redmarch). The id is
 *                       handed to the shared harness, which picks it from the
 *                       live origin menu and records requested vs actual.
 *   ISSUE234_DOCK_MODE  'queued' (default) — approachDock is armed while the
 *                       route is still flying, so the dock helm takes over at
 *                       arrival; or 'direct' — approachDock is issued only
 *                       AFTER the route autopilot has finished at the
 *                       destination system. Direct mode flies the route one
 *                       hop at a time, re-engaging the helm with an explicit
 *                       public engageAutopilot at each intermediate system,
 *                       because an unqueued route releases the helm at every
 *                       jump (src/game/nav.js:L321-L364). Both use public
 *                       Agent API commands only; neither is labelled as the
 *                       other.
 */

import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

process.env.ISSUE74_OUT ||= resolve('out/issue-234/live');
process.env.ISSUE74_PORT ||= '5236';

const VITE_PORT = Number(process.env.ISSUE74_PORT);
const WALL_BUDGET_MS = Number(process.env.ISSUE234_BUDGET_MS || 11 * 60 * 1000);

// Both knobs are validated here, before the harness opens a port or a browser.
const ORIGIN_LABELS = { greenhand: 'Freehold Greenhand', drifter: 'Rim Drifter' };
const ORIGIN = process.env.ISSUE234_ORIGIN || 'greenhand';
if (!Object.hasOwn(ORIGIN_LABELS, ORIGIN)) {
  throw Error(`ISSUE234_ORIGIN must be one of ${Object.keys(ORIGIN_LABELS).join(', ')} (got ${JSON.stringify(ORIGIN)})`);
}
const DOCK_MODES = ['queued', 'direct'];
const DOCK_MODE = process.env.ISSUE234_DOCK_MODE || 'queued';
if (!DOCK_MODES.includes(DOCK_MODE)) {
  throw Error(`ISSUE234_DOCK_MODE must be one of ${DOCK_MODES.join(', ')} (got ${JSON.stringify(DOCK_MODE)})`);
}

const { runLive } = await import('./issue-74-live-harness.mjs');

const sysKey = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sameSystem = (a, b) => sysKey(a) !== '' && sysKey(a) === sysKey(b);

/**
 * Read-only page instrumentation: event tap, NPC sampler with the real live
 * shape, and the sink the breakpoint conditions push into.
 */
const INSTALL = `(() => {
  const ctx = window.__ctx;
  if (!ctx) throw Error('no ctx');
  if (window.__i234) return window.__i234.installed;
  const ev = {
    trace: [], events: [], dec: [], off: [], shapes: {}, hot: {},
    dropped: 0, errors: [], start: ctx.world.time,
  };
  window.__i234 = ev;

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
      if (ev.events.length < 20000) ev.events.push({ t: ctx.world.time, type: String(type), ...scalars(data) });
    } catch {}
    return emit.apply(this, arguments);
  };

  // ---- actual live-ship shape (src/systems/npc.js:L458-L465) ----
  const fleet = () => (Array.isArray(ctx.ships) ? ctx.ships : []);
  const r3 = (v) => (v && Number.isFinite(v.x) ? [+v.x.toFixed(1), +v.y.toFixed(1), +v.z.toFixed(1)] : null);
  const r3v = (v) => (v && Number.isFinite(v.x) ? [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)] : null);
  const stationPos = () => (ctx.station && ctx.station.position) || null;

  // Best-effort sun pose. Recorded as found so a null is auditable rather
  // than silently treated as "no solar body".
  const sunPos = () => {
    const tries = [
      ['ctx.sun.object.position', ctx.sun && ctx.sun.object && ctx.sun.object.position],
      ['ctx.sun.position', ctx.sun && ctx.sun.position],
      ['ctx.solar.sun.position', ctx.solar && ctx.solar.sun && ctx.solar.sun.position],
      ['ctx.solarSystem.sun.position', ctx.solarSystem && ctx.solarSystem.sun && ctx.solarSystem.sun.position],
    ];
    for (const [k, v] of tries) if (v && Number.isFinite(v.x)) { ev.shapes.sun = k; return v; }
    ev.shapes.sun = ev.shapes.sun || 'not-found';
    return null;
  };

  // One nearby-ship row with the fields the dock planner actually consumes.
  const shipRow = (s, p) => {
    const q = s && s.object && s.object.position;
    if (!q || !p || !Number.isFinite(q.x)) return null;
    const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
    const r = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(r)) return null;
    const v = s.ai && s.ai.velocity;
    const hasV = !!(v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z));
    const sp = hasV ? Math.hypot(v.x, v.y, v.z) : null;
    const st = stationPos();
    return {
      id: s.id ?? null,
      recId: (s.record && s.record.id) ?? null,
      name: (s.record && s.record.name) ?? null,
      cls: (s.record && s.record.classKey) ?? null,
      fac: (s.record && s.record.faction) ?? null,
      role: s.role ?? (s.record && s.record.role) ?? null,
      mode: (s.ai && s.ai.mode) ?? null,
      state: (s.record && s.record.state) ?? null,
      r: +r.toFixed(1),
      pos: r3(q),
      vel: r3v(v),
      // null means the planner also sees no velocity for this hull.
      sp: sp === null ? null : +sp.toFixed(3),
      moving: sp === null ? null : sp >= 1e-3,
      stR: st ? +Math.hypot(q.x - st.x, q.y - st.y, q.z - st.z).toFixed(1) : null,
    };
  };

  const nearby = (limit, maxRange) => {
    const p = ctx.ship && ctx.ship.object && ctx.ship.object.position;
    if (!p) return [];
    const rows = [];
    for (const s of fleet()) {
      const row = shipRow(s, p);
      if (row && row.r <= maxRange) rows.push(row);
    }
    rows.sort((a, b) => a.r - b.r);
    return rows.slice(0, limit);
  };

  // Full traffic snapshot for one instant; called from the cancellation logpoint.
  ev.snapNear = () => {
    try {
      const p = ctx.ship && ctx.ship.object && ctx.ship.object.position;
      const st = stationPos();
      const sn = sunPos();
      return {
        t: ctx.world.time,
        pos: r3(p),
        vel: r3v(ctx.ship && ctx.ship.velocity),
        speed: Number.isFinite(ctx.ship && ctx.ship.speed) ? +ctx.ship.speed.toFixed(3) : null,
        station: r3(st),
        sun: r3(sn),
        fleetCount: fleet().length,
        withVelocity: fleet().filter((s) => s.ai && s.ai.velocity && Number.isFinite(s.ai.velocity.x)).length,
        asteroids: (ctx.asteroids && ctx.asteroids.list && ctx.asteroids.list.length) || 0,
        near: nearby(10, 2000),
      };
    } catch (e) { return { error: String(e).slice(0, 200) }; }
  };

  // Sink for the CDP logpoints. \`hot\` rows are throttled to 10 Hz; edge rows
  // (cancellations) are always kept.
  ev.rec = (tag, o, hot) => {
    try {
      const now = ctx.world.time;
      if (hot) {
        const last = ev.hot[tag];
        if (last !== undefined && now - last < 0.1) return;
        ev.hot[tag] = now;
      }
      if (ev.dec.length >= 40000) { ev.dropped++; return; }
      o.tag = tag;
      o.t = +now.toFixed(3);
      if (hot) o.near = nearby(4, 400);
      ev.dec.push(o);
    } catch (e) { if (ev.errors.length < 40) ev.errors.push(String(e).slice(0, 200)); }
  };
  ev.recOff = (o) => {
    try {
      o.t = +ctx.world.time.toFixed(3);
      o.snap = ev.snapNear();
      ev.off.push(o);
      ev.dec.push({ tag: 'off', t: o.t, reason: o.reason, phase: o.phase, site: o.site });
    } catch (e) { if (ev.errors.length < 40) ev.errors.push(String(e).slice(0, 200)); }
  };

  const sample = () => {
    if (window.__i234 !== ev) return;
    const now = ctx.world.time;
    const last = ev.trace.length ? ev.trace[ev.trace.length - 1].t : -Infinity;
    if (now - last >= 0.25) {
      const a = ctx.autopilot || {};
      const p = ctx.ship && ctx.ship.object && ctx.ship.object.position;
      const st = stationPos();
      const near = nearby(6, 1200);
      const within300 = near.filter((n) => n.r <= 300);
      ev.trace.push({
        t: +now.toFixed(3),
        sys: ctx.world.currentSystem,
        mode: a.mode || '', phase: a.phase || '', reason: a.reason || '',
        engaged: a.engaged === true, idle: a.idle === true,
        apR: Number.isFinite(a.range) ? +a.range.toFixed(1) : null,
        prog: Number.isFinite(a.progress) ? +a.progress.toFixed(3) : null,
        thr: Number.isFinite(a.throttle) ? +a.throttle.toFixed(2) : null,
        spd: Number.isFinite(ctx.ship && ctx.ship.speed) ? +ctx.ship.speed.toFixed(2) : null,
        pos: r3(p),
        stR: st && p ? +Math.hypot(p.x - st.x, p.y - st.y, p.z - st.z).toFixed(1) : null,
        inZone: ctx.station && ctx.station.inZone === true,
        docked: ctx.flags && ctx.flags.docked === true,
        hull: (ctx.player && ctx.player.hull) ?? null,
        fleetN: fleet().length,
        nearN: near.length,
        nearWithin300: within300.length,
        // With the real \`ai.velocity\` field these counts are measurements,
        // not the earlier run's missing-field nulls.
        nearSpeedUnknownWithin300: within300.filter((n) => n.sp === null).length,
        nearMovingWithin300: within300.filter((n) => n.moving === true).length,
        nearParkedWithin300: within300.filter((n) => n.moving === false).length,
        near,
      });
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  const probe = ev.snapNear();
  ev.installed = {
    start: ev.start,
    classKey: ctx.player && ctx.player.classKey,
    system: ctx.world.currentSystem,
    shipsIsArray: Array.isArray(ctx.ships),
    fleetCount: probe.fleetCount,
    fleetWithVelocity: probe.withVelocity,
    sunField: ev.shapes.sun,
    sampleRow: probe.near[0] || null,
  };
  return ev.installed;
})()`;

const DRAIN = `(() => {
  const ev = window.__i234;
  const out = { trace: ev.trace, events: ev.events, dec: ev.dec, off: ev.off,
    shapes: ev.shapes, errors: ev.errors, dropped: ev.dropped, start: ev.start };
  ev.trace = []; ev.events = []; ev.dec = []; ev.off = [];
  return out;
})()`;

/** Guard every logpoint body: a throw inside a breakpoint condition would
 * really pause the page, so each condition can only read, push and return false. */
const cond = (body) => `(function(){try{${body}}catch(e){try{window.__i234.errors.push(String(e).slice(0,200))}catch(_){}}return false})()`;

const N = (n, d = 1) => `(Number.isFinite(${n})?+(${n}).toFixed(${d}):String(${n}))`;
const V = (v) => `(${v}&&Number.isFinite(${v}.x)?[+(${v}.x).toFixed(1),+(${v}.y).toFixed(1),+(${v}.z).toFixed(1)]:null)`;
// A heading is a unit vector, so the 0.1 u position precision of V() would
// quantise it to ~6 degrees and make any replay of the flown pose a guess.
// VU/Q carry enough digits that the recorded attitude is the ACTUAL flown one
// and needs no synthetic reconstruction.
const VU = (v) => `(${v}&&Number.isFinite(${v}.x)?[+(${v}.x).toFixed(6),+(${v}.y).toFixed(6),+(${v}.z).toFixed(6)]:null)`;
const Q = (q) => `(${q}&&Number.isFinite(${q}.x)&&Number.isFinite(${q}.w)`
  + `?[+(${q}.x).toFixed(6),+(${q}.y).toFixed(6),+(${q}.z).toFixed(6),+(${q}.w).toFixed(6)]:null)`;

/**
 * Logpoints. Each anchor is matched against the SERVED module text, so the
 * line numbers are derived from what the browser actually parsed rather than
 * assumed to equal the on-disk file.
 */
const LOGPOINTS = [
  {
    key: 'stage',
    anchor: 'const arcCredit = dockStationArcCredit',
    note: 'stage/corridor branch: every planner, detour, traffic and recovery decision for this tick',
    condition: cond(`window.__i234.rec('stage',{
      ph:ap.phase,idle:ap.idle===true,thr:${N('ap.throttle', 2)},
      rng:${N('range')},sd:${N('stageDistance')},spd:${N('speed', 2)},
      pok:planned.ok===true,hold:planned.hold||null,psign:planned.sign,pturnR:${N('planned.turnR')},
      pint:planned.intercept===true,
      pw:(Number.isFinite(planned.ax)?[+(planned.ax).toFixed(1),+(planned.ay).toFixed(1),+(planned.az).toFixed(1)]:null),
      pos:${V('p')},stage:${V('points.stage')},aim:${V('_aim')},
      sb:stationBlocked===true,rd:routeDetour===true,det:detouring===true,
      dv:dockDetourValid===true,dw:(dockDetourValid?[+dockDetourX.toFixed(1),+dockDetourY.toFixed(1),+dockDetourZ.toFixed(1)]:null),
      tb:trafficBlocked===true,td:trafficDetour===true,ty:trafficYield===true,ceb:cruiseExitBlocked===true,
      brk:braking===true,al:${N('steer.align', 4)},yaw:${N('steer.yawAbs', 3)},
      ali:aligned===true,nt:needTurn===true,ov:stageOvershot===true,rec:dockRecovering===true,
      best:${N('dockBestRange')},bh:${N('dockBestHeading', 3)},
      pa:${N('dockProgressAt', 2)},stall:${N('(ctx.world.time-dockProgressAt)', 2)},
      rp:dockReplans,twu:${N('dockTrafficWaitUsed', 2)},
      nb:planningBodies?planningBodies.count:null,ab:_apBodies.count
    },true)`),
  },
  {
    key: 'cruise',
    anchor: 'const cruiseRemaining = stationBlocked',
    // The pose fields below are the ACTUAL flown attitude, not a reconstruction.
    // `_fwd` at this line is the very vector aimDockShip just wrote from
    // live.obj.quaternion (src/game/autopilot.js:L1399 -> L955), and it is the
    // same object handed to dockTurnCredit as `turn.fwd` a few lines later
    // (L1432), so `fwd` here is the exact input the credit is measured from.
    // `q` is its source quaternion. The turn-budget scalars are read BEFORE
    // this tick's dockMakingProgress runs, so they are the values carried in
    // from the previous tick; the `watch` sample carries the post-credit ones.
    note: 'cruise branch: braking/escape-hold decision, the aim actually flown, '
      + 'and the real pose and turn-credit budget behind it',
    condition: cond(`window.__i234.rec('cruise',{
      ph:ap.phase,idle:ap.idle===true,thr:${N('ap.throttle', 2)},
      rng:${N('range')},sd:${N('stageDistance')},spd:${N('speed', 2)},
      pok:planned.ok===true,hold:planned.hold||null,
      pos:${V('p')},stage:${V('points.stage')},aim:${V('_aim')},
      pw:(Number.isFinite(planned.ax)?[+(planned.ax).toFixed(1),+(planned.ay).toFixed(1),+(planned.az).toFixed(1)]:null),
      sb:stationBlocked===true,ceb:cruiseExitBlocked===true,
      brk:braking===true,esc:escapeHold===true,al:${N('steer.align', 4)},yaw:${N('steer.yawAbs', 3)},
      rec:dockRecovering===true,dv:dockDetourValid===true,
      fwd:${VU('_fwd')},q:${Q('live.obj.quaternion')},
      tcuPre:${N('dockTurnCreditUsed', 3)},tbestPre:${N('dockTurnBest', 5)},
      trefSet:dockTurnRefSet===true,
      tref:(dockTurnRefSet?[+dockTurnRefX.toFixed(6),+dockTurnRefY.toFixed(6),+dockTurnRefZ.toFixed(6)]:null),
      best:${N('dockBestRange')},bh:${N('dockBestHeading', 3)},
      pa:${N('dockProgressAt', 2)},stall:${N('(ctx.world.time-dockProgressAt)', 2)},
      rp:dockReplans,twu:${N('dockTrafficWaitUsed', 2)},
      nb:planningBodies?planningBodies.count:null
    },true)`),
  },
  {
    key: 'aimpre',
    anchor: 'const exit = dockCruiseExitAim',
    note: 'cruise aim attribution: _aim after the detour/recovery choice and avoid-bias, BEFORE dockCruiseExitAim rewrites it',
    condition: cond(`window.__i234.rec('aimpre',{
      ph:ap.phase,
      pw:(Number.isFinite(planned.ax)?[+(planned.ax).toFixed(1),+(planned.ay).toFixed(1),+(planned.az).toFixed(1)]:null),
      hold:planned.hold||null,
      aimPre:${V('_aim')},pos:${V('p')},stage:${V('points.stage')},
      det:detouring===true,rd:routeDetour===true,dv:dockDetourValid===true,
      sb:stationBlocked===true,rec:dockRecovering===true,nb:planningBodies?planningBodies.count:null
    },true)`),
  },
  {
    // Root correction: run 1 recorded the cruise branch's FINAL ap.idle but not
    // its separate terms, so "the direct cruise should-brake was false" was not
    // in evidence. dockCruiseShouldBrake is a pure read-only predicate
    // (src/game/dock-cruise.js:L117-L146 — it only reads position, velocity and
    // the body bag and returns a boolean), so a logpoint may evaluate it.
    key: 'cruisebrake',
    anchor: 'const cruiseRemaining = stationBlocked',
    required: true,
    note: 'cruise hold attribution: each term of ap.idle measured on its own',
    condition: cond(`window.__i234.rec('cruisebrake',{
      ph:ap.phase,idle:ap.idle===true,thr:${N('ap.throttle', 2)},
      spd:${N('speed', 2)},sd:${N('stageDistance')},
      csb:dockCruiseShouldBrake(p,ctx.ship.velocity,acceleration,planningBodies)===true,
      dsb:dockShouldBrake(stageDistance,speed,acceleration,DOCK_STAGE_BRAKE_BUFFER)===true,
      brk:braking===true,esc:escapeHold===true,
      tb:trafficBlocked===true,ceb:cruiseExitBlocked===true,
      alignHold:steer.align<0.97,al:${N('steer.align', 4)},yaw:${N('steer.yawAbs', 3)}
    },true)`),
  },
  {
    // Root correction: this logpoint used to sit on
    // `const settleDistance = dockDistance(p, points.settle)`
    // (src/game/autopilot.js:L1504), which is BEFORE `ap.idle = braking` and
    // `ap.throttle = 0` (L1534-L1535). Its `idle`/`thr` fields were therefore
    // the PREVIOUS tick's helm state while the row claimed to describe this
    // tick's final braking decision. The anchor is now the last statement of
    // the corridor/settle tail, after both assignments and immediately before
    // the final dockMakingProgress call, so `idle`/`thr`/`brk` are this tick's
    // committed values as intended and `settleDistance` is in scope.
    //
    // That served line occurs exactly once (the other two dockMakingProgress
    // call sites pass `distance` and `stageDistance`), so no `occurrence` is
    // declared and the resolver still fails closed if it ever becomes
    // ambiguous. It is also a location no other logpoint resolves to, so it
    // adds no served-breakpoint collision; the grouping pass is unchanged.
    //
    // Cost of the move, stated rather than hidden: a corridor/settle tick that
    // early-returns before this line no longer produces a `corridor` row. Plan
    // rejection is still captured by `reject-corridor`, and the dock-request
    // handoff is still captured by the receipts and the `off` tap.
    key: 'corridor',
    anchor: 'if (!dockMakingProgress(ctx, ap, settleDistance, steer.yawAbs)) return;',
    note: 'corridor/settle tail: the local planner, the aim flown and this tick\'s committed final braking decision',
    condition: cond(`window.__i234.rec('corridor',{
      ph:ap.phase,idle:ap.idle===true,thr:${N('ap.throttle', 2)},
      brk:braking===true,sd:${N('settleDistance')},
      rng:${N('range')},spd:${N('speed', 2)},
      inZone:!!(ctx.station&&ctx.station.inZone===true),
      pok:planned.ok===true,hold:planned.hold||null,
      pw:(Number.isFinite(planned.ax)?[+(planned.ax).toFixed(1),+(planned.ay).toFixed(1),+(planned.az).toFixed(1)]:null),
      pos:${V('p')},settle:${V('points.settle')},aim:${V('_aim')},
      al:${N('steer.align', 4)},yaw:${N('steer.yawAbs', 3)},
      best:${N('dockBestRange')},bh:${N('dockBestHeading', 3)},
      pa:${N('dockProgressAt', 2)},stall:${N('(ctx.world.time-dockProgressAt)', 2)},
      rp:dockReplans,nb:bodies?bodies.count:null
    },true)`),
  },
  {
    // Early-return rejections. Each one disengages BEFORE the instrumented
    // tail, so without these a cancellation from any of them would be
    // attributed only by the disengage stack, with none of its planner inputs.
    //
    // A breakpoint on an `if` line fires on EVERY evaluation, not only when
    // the branch is taken, so each of these conditions repeats the branch's
    // own predicate and records nothing unless the rejection really happens.
    // The anchors carry their indentation because three dock branches share
    // the same `!planned.ok` wording.
    //
    // Root correction: reject-stage (served L1293) and reject-transit (L1365)
    // both sit ABOVE `const stageDistance = dockDistance(p, points.stage)`
    // (L1387). Reading `stageDistance` there is a temporal-dead-zone
    // ReferenceError, and because it is thrown while the record object literal
    // is still being built, cond()'s catch swallowed the WHOLE row: every
    // rejection capture was lost and only surfaced as a pageError. Both now
    // call the pure module-scope `dockDistance(p, points.stage)` instead
    // (src/game/dock-approach.js:L78 — it only reads and returns, and returns
    // null on a stale pose, which N() renders as "null"). No other field in
    // either body reads a local declared later than its own anchor.
    key: 'reject-stage',
    anchor: '    if (!planned.ok || !Number.isFinite(planned.ax)',
    note: 'primary stage/cruise plan rejection: disengages blocked before the instrumented tail',
    condition: cond(`if(!(planned.ok===true&&Number.isFinite(planned.ax)
      &&Number.isFinite(planned.ay)&&Number.isFinite(planned.az)))window.__i234.rec('reject-stage',{
      ph:ap.phase,pok:planned.ok===true,hold:planned.hold||null,
      ax:${N('planned.ax')},ay:${N('planned.ay')},az:${N('planned.az')},
      rng:${N('range')},sd:${N('dockDistance(p, points.stage)')},spd:${N('speed', 2)},
      pos:${V('p')},stage:${V('points.stage')},
      st:stageTransit===true,nb:planningBodies?planningBodies.count:null,ab:_apBodies.count
    })`),
  },
  {
    key: 'reject-transit',
    anchor: "if (!transit.ok) { disengage(ctx, 'blocked'); return; }",
    note: 'stage traffic transit plan rejection: disengages blocked before the instrumented tail',
    condition: cond(`if(transit.ok!==true)window.__i234.rec('reject-transit',{
      ph:ap.phase,tok:transit.ok===true,hold:transit.hold||null,
      rng:${N('range')},sd:${N('dockDistance(p, points.stage)')},spd:${N('speed', 2)},
      pos:${V('p')},aim:${V('_aim')},
      nb:planningBodies?planningBodies.count:null,tbod:_stageTrafficBodies.count
    })`),
  },
  {
    key: 'reject-corridor',
    anchor: "|| planned.hold === 'detour') {",
    note: 'corridor/settle plan rejection, including its detour-hold rejection',
    condition: cond(`if(!(planned.ok===true&&Number.isFinite(planned.ax)
      &&Number.isFinite(planned.ay)&&Number.isFinite(planned.az))
      ||planned.hold==='detour')window.__i234.rec('reject-corridor',{
      ph:ap.phase,pok:planned.ok===true,hold:planned.hold||null,
      ax:${N('planned.ax')},ay:${N('planned.ay')},az:${N('planned.az')},
      rng:${N('range')},spd:${N('speed', 2)},
      inZone:!!(ctx.station&&ctx.station.inZone===true),
      pos:${V('p')},settle:${V('points.settle')},nb:bodies?bodies.count:null
    })`),
  },
  {
    key: 'watch',
    anchor: 'if (now - dockProgressAt >= DOCK_BLOCK_SECONDS / 2',
    // `turnCredit` is a local of dockMakingProgress declared at
    // src/game/autopilot.js:L1103, above this anchor, so it is genuinely in
    // scope here and is the credit THIS frame actually granted — no TDZ, and
    // no inference from the budget delta. `tcu`/`tbest`/`tref` are read after
    // dockTurnCredit has already run for this frame, so they are the
    // POST-credit values (the cruise sample carries the pre-credit ones).
    // `turn` is null on every non-cruise call site, so its fields are read
    // defensively; `_fwd` is module scope and is the same heading the credit
    // was measured from on the cruise path.
    note: 'dockMakingProgress: the progress-watchdog state that decides blocked, '
      + 'with the turn credit this frame really granted and the pose behind it',
    condition: cond(`window.__i234.rec('watch',{
      ph:ap.phase,idle:ap.idle===true,
      rng:${N('range')},yaw:${N('yawAbs', 3)},
      ty:trafficYield===true,arc:${N('arcCredit', 3)},imp:improved===true,
      tc:${N('turnCredit', 4)},tcu:${N('dockTurnCreditUsed', 3)},tbest:${N('dockTurnBest', 5)},
      trefSet:dockTurnRefSet===true,
      tref:(dockTurnRefSet?[+dockTurnRefX.toFixed(6),+dockTurnRefY.toFixed(6),+dockTurnRefZ.toFixed(6)]:null),
      fwd:${VU('_fwd')},q:${Q('ctx.ship&&ctx.ship.object&&ctx.ship.object.quaternion')},
      turnFwd:${VU('(turn&&turn.fwd)')},turnAim:${V('(turn&&turn.aim)')},
      elapsed:${N('elapsed', 4)},
      best:${N('dockBestRange')},bh:${N('dockBestHeading', 3)},
      now:${N('now', 2)},pa:${N('dockProgressAt', 2)},stall:${N('(now-dockProgressAt)', 2)},
      twu:${N('dockTrafficWaitUsed', 2)},rp:dockReplans,dph:dockPhase
    }, (now-dockProgressAt) < 4)`),
  },
  {
    key: 'off',
    anchor: 'const routeWas = flyingFlag(ctx)',
    note: 'disengage(): cancellation reason, call site and the traffic present at that instant',
    condition: cond(`if(ap.mode==='dock'&&ap.engaged===true)window.__i234.recOff({
      reason:String(reason||''),phase:ap.phase,
      rng:${N('ap.range')},prog:${N('ap.progress', 3)},
      rec:dockRecovering===true,dv:dockDetourValid===true,
      best:${N('dockBestRange')},bh:${N('dockBestHeading', 3)},
      pa:${N('dockProgressAt', 2)},stall:${N('(ctx.world.time-dockProgressAt)', 2)},
      rp:dockReplans,twu:${N('dockTrafficWaitUsed', 2)},
      site:String((new Error()).stack||'').split('\\n').slice(1,6).join(' | ').slice(0,600)
    })`),
  },
];

await runLive('natural-planner', async ({ c, result, act, observe, wait, checkpoint, folder }) => {
  const wallStart = Date.now();
  const left = () => WALL_BUDGET_MS - (Date.now() - wallStart);

  result.fixture = false;
  result.natural = true;
  result.requestedOrigin = ORIGIN;
  result.dockMode = DOCK_MODE;
  // The method line states what this run actually did, not what the default
  // run does: a direct-mode run must never read as a queued-dock run.
  result.method = `Natural starter light hull, ${ORIGIN_LABELS[ORIGIN]} origin. Public Agent API only: `
    + (DOCK_MODE === 'direct'
      ? 'undock, plotRoute, engageAutopilot, then one further explicit engageAutopilot per intermediate '
        + 'jump (an unqueued route releases the helm at every hop), then an explicit approachDock issued '
        + 'only AFTER the route autopilot has completed at the destination system (direct dock; nothing '
        + 'is queued), dock. '
      : 'undock, plotRoute, engageAutopilot, approachDock (queued dock), dock. ')
    + 'Intact traffic, damage, '
    + 'solar clearance and clocks. No teleport, no timer change, no fixture, no auto-reacquisition. '
    + 'Instrumentation is read-only: 0.25 s sampler with the real live-ship fields, a pass-through '
    + 'ctx.emit tap, and CDP conditional-breakpoint logpoints that read the dock controller frame and '
    + 'return false. No product source is modified; the harness verifies the src hash at both ends.';
  result.ports = { vite: VITE_PORT, cdp: 'ephemeral loopback (shared issue-74 harness)' };
  result.wallBudgetMs = WALL_BUDGET_MS;
  result.legs = [];
  result.trace = [];
  result.events = [];
  result.dec = [];
  result.off = [];
  result.pageErrors = [];

  // ---- read-only page instrumentation
  result.instrument = await c.eval(INSTALL);
  console.log('INSTRUMENT', JSON.stringify(result.instrument));

  // ---- CDP logpoints on the SERVED module text
  const servedUrl = `http://127.0.0.1:${VITE_PORT}/src/game/autopilot.js`;
  const served = await fetch(servedUrl).then((r) => (r.ok ? r.text() : Promise.reject(Error('served ' + r.status))));
  const lines = served.split('\n');
  result.logpoints = { servedUrl, servedLines: lines.length, set: [] };

  // A never-pausing condition is the contract; resume immediately if the page
  // ever really pauses, so a probe fault can never freeze the run.
  let pauses = 0;
  c.ws.addEventListener('message', (e) => {
    try {
      const m = JSON.parse(String(e.data));
      if (m.method === 'Debugger.paused') { pauses++; c.send('Debugger.resume').catch(() => {}); }
    } catch {}
  });
  await c.send('Debugger.enable');

  // Resolve every anchor first. Two logical logpoints can legitimately share an
  // anchor (cruise and cruisebrake both sit on `const cruiseRemaining = ...`),
  // and CDP rejects a second breakpoint at a location that already carries one.
  // So resolution and installation are separate passes: one CDP breakpoint per
  // resolved location, carrying every logical condition that resolved there.
  const resolved = [];
  for (const lp of LOGPOINTS) {
    // A condition that fails to compile would really pause the page, so each
    // one is parsed here before it is ever installed.
    try { new Function(`return ${lp.condition};`); } catch (e) {
      throw Error(`logpoint condition does not parse: ${lp.key}: ${e.message}`);
    }
    // Fail closed on an AMBIGUOUS anchor. Several dock branches share wording
    // (three of them reject a plan with the same `!planned.ok` test), and
    // silently taking the first hit would attribute a branch to the wrong
    // line. An anchor must match exactly one served line unless the logpoint
    // names which occurrence it wants.
    const hits = [];
    lines.forEach((l, i) => { if (l.includes(lp.anchor)) hits.push(i); });
    if (hits.length === 0) {
      throw Error(`logpoint anchor not found in served source: ${lp.key} :: ${lp.anchor}`);
    }
    if (hits.length > 1 && !Number.isInteger(lp.occurrence)) {
      throw Error(`logpoint anchor is ambiguous (${hits.length} served lines: `
        + `${hits.map((i) => i + 1).join(', ')}): ${lp.key} :: ${lp.anchor}`);
    }
    const idx = Number.isInteger(lp.occurrence) ? hits[lp.occurrence] : hits[0];
    if (!Number.isInteger(idx)) {
      throw Error(`logpoint occurrence ${lp.occurrence} out of range (${hits.length}): ${lp.key}`);
    }
    const columnNumber = Math.max(0, lines[idx].length - lines[idx].trimStart().length);
    resolved.push({ lp, hits, idx, columnNumber });
  }

  // Group by resolved location, keeping the declared order of LOGPOINTS.
  const byLocation = new Map();
  for (const r of resolved) {
    const at = `${r.idx}:${r.columnNumber}`;
    if (!byLocation.has(at)) byLocation.set(at, []);
    byLocation.get(at).push(r);
  }

  for (const group of byLocation.values()) {
    const { idx, columnNumber } = group[0];
    // Every logical condition already returns false and swallows its own
    // throws, so the group condition just evaluates each in turn and returns
    // false itself. The breakpoint still never pauses the page.
    const condition = group.length === 1
      ? group[0].lp.condition
      : `(function(){${group.map((r) => `(${r.lp.condition});`).join('')}return false})()`;
    try { new Function(`return ${condition};`); } catch (e) {
      throw Error(`grouped logpoint condition does not parse at served line ${idx + 1}`
        + ` (${group.map((r) => r.lp.key).join(', ')}): ${e.message}`);
    }
    const set = await c.send('Debugger.setBreakpointByUrl', {
      urlRegex: 'src/game/autopilot\\.js',
      lineNumber: idx,
      columnNumber,
      condition,
    });
    const locations = (set.locations || []).map((l) => ({ line: l.lineNumber + 1, col: l.columnNumber }));
    // One row per LOGICAL tag, as before, so tag coverage and the report read
    // the same whether or not a tag shares its location with another.
    for (const { lp, hits } of group) {
      result.logpoints.set.push({
        key: lp.key, note: lp.note, anchor: lp.anchor,
        anchorMatches: hits.length, occurrence: lp.occurrence ?? 0,
        required: lp.required === true,
        servedLine: idx + 1, servedText: lines[idx].trim(),
        breakpointId: set.breakpointId,
        sharesLocationWith: group.filter((r) => r.lp.key !== lp.key).map((r) => r.lp.key),
        locations,
      });
    }
    console.log('LOGPOINT', group.map((r) => r.lp.key).join('+'),
      'served line', idx + 1, 'resolved', locations.length);
  }
  if (!result.logpoints.set.every((s) => s.locations.length > 0)) {
    throw Error('a logpoint did not resolve to a breakable location: ' + JSON.stringify(result.logpoints.set));
  }

  const drain = async () => {
    const d = await c.eval(DRAIN);
    result.trace.push(...d.trace);
    result.events.push(...d.events);
    result.dec.push(...d.dec);
    result.off.push(...d.off);
    result.shapes = d.shapes;
    result.decDropped = d.dropped;
    if (d.errors && d.errors.length) result.pageErrors.push(...d.errors);
  };

  const boot = await observe();
  result.startClass = result.instrument?.classKey ?? null;
  result.startSystem = boot.world.currentSystem;
  // Origin as the runtime reports it, not as it was asked for.
  result.startOrigin = result.origin?.actual ?? null;
  await checkpoint(`boot-${sysKey(result.startSystem) || 'unknown'}`);

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
    const refused = async (r, step) => {
      legRec.failed = { step, ok: r.ok, error: r.error ?? null, notice: r.notice ?? null };
      console.log('LEG REFUSED', label, step, JSON.stringify(legRec.failed));
      await drain();
      await checkpoint(`${label}-refused-${step}`);
      legRec.wallEndMs = Date.now() - wallStart;
      return legRec;
    };
    const budgetGuard = () => { if (left() <= 0) throw Error(`wall budget exhausted during ${label}`); };

    let s = await observe();
    if (s.flags.docked) {
      const un = await say('undock');
      if (!un.ok) return refused(un, 'undock');
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
    legRec.dockMode = DOCK_MODE;
    if (DOCK_MODE === 'direct') {
      // Nothing is queued, and an UNQUEUED route releases the helm at EVERY
      // jump, not only at the destination: recalcOnLoad keeps the lease across
      // a jump only while a queued dock intent is bound to this very
      // destination (src/game/nav.js:L321-L364, `keepLease`). With nothing
      // queued the flag is cleared on each arrival, flyTick then sees
      // `!flyingFlag(ctx)` and idles the channel (src/game/autopilot.js:L1539
      // -L1546). So a multi-hop direct route stops dead in the first
      // intermediate system, and a single wait on the FINAL destination hangs
      // until the wall budget dies. Each hop is therefore waited for on its
      // own and the helm is re-engaged with an explicit public
      // `engageAutopilot`, whose receipt is recorded like every other command.
      //
      // The hop plan is read from `nav.path`, NOT from `nav.remaining`: the
      // runtime `remaining` field is a jump COUNT and navSnap filters the
      // snapshot for strings, so the public `nav.remaining` is always `[]`
      // (src/game/agent-observe.js:L690-L701). `nav.path[0]` is always the
      // system the route is currently in (nav.js writes `bfsPath(here, dest)`).
      //
      // nav.status can read 'arrived' with the autopilot already disengaged
      // while the jump gate animation is still running, and approachDock
      // refuses in that window (src/game/autopilot.js:L482). The public
      // gate.jumping flag (src/game/agent-observe.js:L1135) is the gate: it
      // must be observed as an explicit false, not merely absent. The same
      // gate is applied at every hop, so a re-engage is never issued mid-jump.
      const bail = async (step, detail) => {
        legRec.failed = { step, ...detail };
        console.log('LEG DIRECT BAIL', label, step, JSON.stringify(legRec.failed).slice(0, 700));
        await drain();
        await checkpoint(`${label}-${step}`);
        legRec.wallEndMs = Date.now() - wallStart;
        return legRec;
      };

      // The public route as it stands immediately after plot + engage. This is
      // the only place the hop count comes from; nothing is assumed about the
      // map topology.
      const plan = await observe();
      const initialPath = Array.isArray(plan.nav?.path) ? plan.nav.path.slice() : [];
      legRec.routePath = initialPath;
      legRec.hops = [];
      if (initialPath.length < 2
        || !sameSystem(initialPath[0], plan.world?.currentSystem)
        || !sameSystem(initialPath[initialPath.length - 1], dest)) {
        return bail('route-path', {
          path: initialPath, here: plan.world?.currentSystem ?? null, dest,
          navStatus: plan.nav?.status ?? null,
        });
      }

      // ONE budget for the whole direct arrival, shared by every hop. A fresh
      // 240 s per hop would let a four-jump route spend four full budgets and
      // silently overrun the wall bound this probe is gated on.
      const arrivalBudgetS = Math.min(240, Math.max(30, left() / 1000 - 30));
      const arrivalDeadline = Date.now() + arrivalBudgetS * 1000;
      legRec.arrivalBudgetS = +arrivalBudgetS.toFixed(1);
      const hopSeconds = () => Math.max(5, Math.min(
        arrivalBudgetS, (arrivalDeadline - Date.now()) / 1000, left() / 1000 - 30));

      const maxJumps = initialPath.length - 1;
      let expectedPath = initialPath;
      for (let hop = 1; hop <= maxJumps; hop++) {
        const from = expectedPath[0];
        const next = expectedPath[1];
        const finalHop = hop === maxJumps;
        let landed;
        try {
          landed = await wait(
            // The system must have CHANGED to exactly the hop this route
            // planned, with the gate animation finished, the destination
            // untouched, both helm flags down, and nothing queued behind us.
            (o) => sameSystem(o.world?.currentSystem, next)
              && o.gate?.jumping === false
              && sameSystem(o.nav?.dest, dest)
              && o.nav?.autopilot === false
              && o.autopilot?.engaged === false
              && !o.autopilot?.queuedDock,
            hopSeconds(),
            `${label} hop ${hop}/${maxJumps} ${sysKey(from)}->${sysKey(next)}`,
            () => {
              budgetGuard();
              if (Date.now() >= arrivalDeadline) {
                throw Error('direct route arrival wall budget exhausted');
              }
            });
        } catch (e) {
          return bail(`route-hop-${hop}`, {
            from, to: next, finalHop, timeout: String(e).slice(0, 300),
          });
        }
        const hopRec = {
          hop, final: finalHop, t: landed.t,
          from, expected: next,
          system: landed.world?.currentSystem ?? null,
          status: landed.nav?.status ?? null,
          path: Array.isArray(landed.nav?.path) ? landed.nav.path.slice() : null,
          mode: landed.autopilot?.mode ?? null,
          reason: landed.autopilot?.reason ?? null,
          jumping: landed.gate?.jumping ?? null,
        };
        legRec.hops.push(hopRec);
        console.log('HOP', label, hop + '/' + maxJumps, JSON.stringify(hopRec));

        if (finalHop) {
          // Final arrival: the route is done, so nav.status must say so and
          // both helm flags must already be down (the wait proved that).
          if (hopRec.status !== 'arrived') {
            return bail('route-arrival-status', { hop, observed: hopRec });
          }
          legRec.routeArrivedAtT = landed.t;
          legRec.routeArrivedSystem = hopRec.system;
          legRec.routeArrivedJumping = hopRec.jumping;
          break;
        }

        // Intermediate hop. Re-engaging is only safe when the route is intact
        // and genuinely one jump shorter; anything else is a route mutation or
        // a real cancellation, and this fails closed rather than pushing the
        // helm back on over the top of it.
        const nextPath = hopRec.path;
        const bad = [];
        if (hopRec.status !== 'plotted') bad.push(`nav.status is ${JSON.stringify(hopRec.status)}, not 'plotted'`);
        if (sameSystem(hopRec.system, from)) bad.push('the ship is still in the system it started the hop in');
        if (!Array.isArray(nextPath) || nextPath.length < 2) {
          bad.push(`nav.path is ${JSON.stringify(nextPath)}`);
        } else {
          if (!sameSystem(nextPath[0], hopRec.system)) bad.push('nav.path[0] is not the current system');
          if (!sameSystem(nextPath[nextPath.length - 1], dest)) bad.push('nav.path does not end at the destination');
          if (nextPath.length >= expectedPath.length) bad.push('nav.path did not get strictly shorter');
        }
        if (hopRec.mode !== 'route') bad.push(`autopilot.mode is ${JSON.stringify(hopRec.mode)}, not 'route'`);
        if (hopRec.reason) bad.push(`autopilot carries cancellation reason ${JSON.stringify(hopRec.reason)}`);
        if (bad.length) return bail(`route-hop-${hop}-guard`, { hop, reasons: bad, observed: hopRec });

        const again = await say('engageAutopilot');
        hopRec.reengaged = again.ok === true;
        if (!again.ok) return refused(again, `engageAutopilot-hop-${hop}`);
        expectedPath = nextPath;
      }
      if (!Number.isFinite(legRec.routeArrivedAtT)) {
        return bail('route-arrival', { hops: legRec.hops.length, maxJumps, dest });
      }
      const direct = await say('approachDock');
      legRec.directAccepted = direct.ok === true;
      if (!direct.ok) return refused(direct, 'approachDock');
    } else {
      const queued = await say('approachDock');
      legRec.queuedAccepted = queued.ok === true;
      if (!queued.ok) return refused(queued, 'approachDock');
    }

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
        const at = last.world?.currentSystem ?? null;
        legRec.dockedAtT = last.t;
        legRec.dockedSystem = at;
        legRec.completed = sameSystem(at, dest);
        if (!legRec.completed) legRec.dockedWrongSystem = { expected: dest, actual: at };
        break;
      }
      const cancel = {
        attempt, t: last.t,
        reason: last.autopilot.reason, phase: last.autopilot.phase,
        range: last.autopilot.range, progress: last.autopilot.progress,
        speed: last.ship.speed, hull: last.ship.hull,
        // The controller's own cancellation record, with call site and the
        // traffic that was actually present at that instant.
        off: result.off.filter((o) => o.t >= last.t - 30 && o.t <= last.t + 1),
        decWindow: result.dec.filter((r) => r.t >= last.t - 25 && r.t <= last.t + 1),
        traceWindow: result.trace.filter((r) => r.t >= last.t - 25 && r.t <= last.t + 1),
        eventsWindow: result.events.filter((r) => r.t >= last.t - 25 && r.t <= last.t + 1),
      };
      legRec.cancellations.push(cancel);
      console.log('CANCEL', label, cancel.reason, 'phase', cancel.phase, 'range', cancel.range,
        'sites', JSON.stringify(cancel.off.map((o) => ({ r: o.reason, stall: o.stall, rec: o.rec, site: String(o.site).slice(0, 90) }))));
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

  // The itinerary is unchanged — veridian, freehold, hollowreach — and so are
  // its wall-budget gates. Only the leg LABELS follow the system the ship
  // actually booted in. A target that is already the current system is not a
  // flyable leg: nav.js writes status 'arrived' for dest === here, and
  // actPlotRoute (src/systems/agent-api.js:L263-L280) accepts only 'plotted'
  // or 'blocked', so such a leg would refuse. It is reordered out instead.
  const PLAN = ['veridian', 'freehold', 'hollowreach'];
  const BUDGET_GATE_MS = [0, 90000, 120000];
  const order = [];
  const pending = [...PLAN];
  let from = result.startSystem;
  while (pending.length) {
    const i = pending.findIndex((d) => !sameSystem(d, from));
    if (i < 0) break;
    const dest = pending.splice(i, 1)[0];
    order.push({ dest, label: `${sysKey(from) || 'start'}-to-${sysKey(dest)}` });
    from = dest;
  }
  result.itinerary = order.map((o) => o.label);
  if (pending.length) result.itineraryDropped = pending;

  for (let i = 0; i < order.length; i++) {
    if (i > 0 && left() <= BUDGET_GATE_MS[i]) {
      result.skipped = [...(result.skipped || []), ...order.slice(i).map((o) => o.label)];
      break;
    }
    await leg(order[i].dest, order[i].label);
  }

  await drain();
  result.debuggerPauses = pauses;

  const cancels = result.legs.flatMap((l) => l.cancellations.map((x) => ({ leg: l.label, ...x })));
  const bodyHits = result.events.filter((e) => e.type === 'bodyHit')
    .map((e) => ({
      t: e.t, kind: e.kind, speed: e.speed, damage: e.damage,
      // src/game/autopilot.js:L288-L292 — only damage 0 AND |speed| < 1 is spared.
      wouldCancelDock: !(e.damage === 0 && Number.isFinite(e.speed) && Math.abs(e.speed) < 1),
    }));
  const withV = result.trace.filter((r) => r.nearWithin300 > 0);
  result.summary = {
    dockMode: DOCK_MODE,
    origin: {
      requested: ORIGIN,
      actual: result.origin?.actual ?? null,
      startSystem: result.startSystem,
      startClass: result.startClass,
    },
    itinerary: result.itinerary,
    legsRun: result.legs.length,
    legsCompleted: result.legs.filter((l) => l.completed).length,
    legsQueuedAccepted: result.legs.filter((l) => l.queuedAccepted === true).length,
    legsDirectAccepted: result.legs.filter((l) => l.directAccepted === true).length,
    // Direct mode only: how many route hops were flown, and how many of them
    // needed an explicit re-engage because the unqueued helm came off at a jump.
    directHopsFlown: result.legs.reduce((n, l) => n + (l.hops?.length ?? 0), 0),
    directReengages: result.legs.reduce(
      (n, l) => n + (l.hops?.filter((h) => h.reengaged === true).length ?? 0), 0),
    cancellations: cancels.length,
    impactCancellations: cancels.filter((x) => x.reason === 'impact').length,
    blockedCancellations: cancels.filter((x) => x.reason === 'blocked').length,
    controllerCancellations: result.off.length,
    cancelReasons: result.off.reduce((m, o) => { m[o.reason] = (m[o.reason] || 0) + 1; return m; }, {}),
    bodyHitsTotal: bodyHits.length,
    bodyHitsHarmful: bodyHits.filter((h) => h.wouldCancelDock).length,
    traceSamples: result.trace.length,
    decisionSamples: result.dec.length,
    decisionsDropped: result.decDropped ?? 0,
    decisionTags: result.dec.reduce((m, d) => { m[d.tag] = (m[d.tag] || 0) + 1; return m; }, {}),
    // Proof the NPC sampler now measures instead of guessing.
    npcFieldCheck: {
      samplesWithTrafficWithin300: withV.length,
      samplesWithUnknownSpeed: withV.filter((r) => r.nearSpeedUnknownWithin300 > 0).length,
      maxMovingWithin300: withV.reduce((m, r) => Math.max(m, r.nearMovingWithin300 || 0), 0),
      maxParkedWithin300: withV.reduce((m, r) => Math.max(m, r.nearParkedWithin300 || 0), 0),
    },
    debuggerPauses: pauses,
    pageInstrumentationErrors: result.pageErrors.length,
    wallElapsedS: +((Date.now() - wallStart) / 1000).toFixed(1),
    unreproducedNote: 'Classes absent from this run are unreproduced, not absent from the product.',
  };

  // ---- FAIL CLOSED on capture quality -------------------------------------
  // A probe that cannot prove it captured cleanly must not hand back evidence
  // that reads as clean. Every gate below is a defect in the MEASUREMENT, not
  // in the product: a cancellation is a finding, a dropped sample is a fault.
  const tagCount = result.summary.decisionTags;
  const phasesSeen = new Set(result.trace.map((r) => r.phase).filter(Boolean));
  // Coverage is checked against what the run actually flew rather than against
  // an assumed itinerary: if the 0.25 s trace saw a phase, that phase's
  // decision tag must have samples, or the branch went uninstrumented.
  const COVERAGE = [
    ['cruise', ['cruise', 'cruisebrake']],
    ['stage', ['stage']],
    ['corridor', ['corridor']],
    ['settle', ['corridor']],
  ];
  const failures = [];
  if (pauses > 0) failures.push(`the page was paused ${pauses} time(s) by instrumentation`);
  // The run must be able to prove which origin and which dock method it flew.
  if (result.origin?.actual !== ORIGIN) {
    failures.push(`origin '${ORIGIN}' was requested but the runtime reported `
      + `${JSON.stringify(result.origin?.actual ?? null)}`);
  }
  if (DOCK_MODE === 'direct') {
    // A direct run that carries a queued receipt, or that never proved the
    // route had finished before the berth was asked for, is mislabelled
    // evidence; these gates only apply to direct mode, so the default queued
    // run is unchanged.
    const mislabelled = result.legs.filter((l) => Object.hasOwn(l, 'queuedAccepted'));
    if (mislabelled.length) {
      failures.push(`${mislabelled.length} leg(s) recorded a queued dock receipt in direct mode`);
    }
    for (const l of result.legs) {
      if (l.failed) failures.push(`direct leg '${l.label}' failed at ${l.failed.step}`);
      else if (l.directAccepted !== true) failures.push(`direct leg '${l.label}' never had an accepted approachDock`);
      else if (!Number.isFinite(l.routeArrivedAtT)) failures.push(`direct leg '${l.label}' has no route-arrival evidence`);
      // The berth was asked for the instant the route finished, so the run
      // must be able to prove the jump gate was idle at that instant. An
      // absent or true flag means approachDock was issued in the window where
      // it refuses, and the leg is not evidence about the dock planner.
      else if (l.routeArrivedJumping !== false) {
        failures.push(`direct leg '${l.label}' recorded gate.jumping=`
          + `${JSON.stringify(l.routeArrivedJumping ?? null)} at route arrival, not an explicit false`);
      }
    }
  }
  if (result.pageErrors.length) {
    failures.push(`page instrumentation raised ${result.pageErrors.length} error(s): `
      + result.pageErrors.slice(0, 3).join(' | '));
  }
  if ((result.decDropped ?? 0) > 0) {
    failures.push(`${result.decDropped} decision sample(s) were dropped by the sink cap`);
  }
  if (!result.dec.length) failures.push('no controller decision samples were captured at all');
  if (!result.trace.length) failures.push('no flight trace samples were captured at all');
  for (const [phase, tags] of COVERAGE) {
    if (!phasesSeen.has(phase)) continue;
    for (const tag of tags) {
      if (!tagCount[tag]) {
        failures.push(`phase '${phase}' was flown but its '${tag}' logpoint captured 0 samples`);
      }
    }
  }
  const unknownSpeed = result.summary.npcFieldCheck.samplesWithUnknownSpeed;
  if (unknownSpeed > 0) {
    failures.push(`${unknownSpeed} sample(s) recorded traffic within 300 u with an unknown speed,`
      + ' so their moving/parked split is a guess');
  }
  for (const s of result.logpoints.set) {
    if (!s.locations.length) failures.push(`logpoint '${s.key}' resolved to no breakable location`);
  }
  result.summary.captureVerdict = failures.length ? 'FAIL' : 'PASS';
  result.summary.captureFailures = failures;
  result.summary.phasesFlown = [...phasesSeen].sort();
  result.bodyHits = bodyHits;
  result.cancellationsFlat = cancels.map(({ traceWindow, eventsWindow, decWindow, ...rest }) => rest);

  await writeFile(resolve(folder, 'trace-0.25s.json'), JSON.stringify(result.trace));
  await writeFile(resolve(folder, 'events.json'), JSON.stringify(result.events, null, 1));
  await writeFile(resolve(folder, 'decisions.json'), JSON.stringify(result.dec));
  await writeFile(resolve(folder, 'cancellations.json'), JSON.stringify(cancels, null, 1));
  await writeFile(resolve(folder, 'controller-cancellations.json'), JSON.stringify(result.off, null, 1));
  result.traceFile = 'trace-0.25s.json';
  result.decisionFile = 'decisions.json';
  result.trace = [];
  result.events = [];
  result.dec = [];

  console.log('SUMMARY', JSON.stringify(result.summary, null, 2));
  // Raised AFTER every artifact is on disk, so a failed capture is still fully
  // inspectable; it just may not be reported as evidence.
  if (failures.length) {
    throw Error('CAPTURE FAILED — this run is not usable as evidence:\n  - '
      + failures.join('\n  - '));
  }
}, { origin: ORIGIN });
