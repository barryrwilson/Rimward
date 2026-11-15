/**
 * Issue #307 live browser probe — fresh-start and berth-rewind/undock headings.
 *
 * A fresh disposable Chromium profile boots the real application, starts a new
 * game, chooses the Greenhand origin and then flies with the public Agent API
 * only. The RNG seed is the only fixture: no teleport, no injected credits, no
 * clock or time acceleration, no pose writes. Read-only window.__ctx telemetry
 * supplies position/quaternion/nose/outward and solar geometry.
 *
 * Pins:
 *   1. the fresh-start nose points outward from the sun (dot > 0.99);
 *   2. a Freehold berth entered from the sunward side, released through the
 *      public undock action, then flown at throttle 0.5 for 25 s without a
 *      solar kill (the sun-clear release heading);
 *   3. a natural death, the berth rewind, and the restored ship's ordinary
 *      throttle flight without a solar kill (the respawn heading);
 *   4. an ordinary throttle origin->gate flight (public plotRoute/autopilot)
 *      survives without sunKill/playerDestroyed, and reports any sunHeat;
 *   5. browser console errors and exceptions fail the run.
 *
 * Run: node scripts/issue-307-respawn-heading-live-probe.mjs
 * Evidence: out/issue-307-live/respawn-heading (result.json + screenshots).
 */
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
process.env.ISSUE74_OUT = process.env.ISSUE307_OUT
  || resolve(here, '..', 'out', 'issue-307-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const SEED = 1;
const FLIGHT_SECONDS = 25;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function summarizeEvents(events) {
  const counts = { sunHeat: 0, sunKill: 0, playerDestroyed: 0, recovered: 0, docked: 0, undocked: 0 };
  for (const e of events) if (Object.hasOwn(counts, e.type)) counts[e.type]++;
  return counts;
}

const result = await runLive('respawn-heading', async ({ c, result, act, observe, checkpoint, save }) => {
  result.fixture = false;
  result.seed = SEED;
  result.fixtureNote = 'RNG seed only (unsigned 32-bit LCG installed before boot). No teleport, injected credits, clock/time acceleration, or pose writes; every flight uses the public Agent API in real animation time.';
  result.method = 'Fresh disposable Chromium profile, public startGame/chooseOrigin(greenhand), read-only window.__ctx telemetry, public setControl/dock/undock/plotRoute/engageAutopilot/recover actions. The Freehold berth is entered from the sunward side (the station-to-gate sweep the salvager run flew) so the release heading faces the sun; the flight is ordinary throttle 0.5 with centered steering.';
  result.assertionScope = 'Builder verification of the live headings and solar events, not independent QA.';

  const telemetry = () => c.eval('(()=>{'
    + 'const x=window.__ctx; if(!x?.ship?.object) return null;'
    + 'const p=x.ship.object.position,q=x.ship.object.quaternion;'
    + 'const nose=p.clone().set(0,0,-1).applyQuaternion(q);'
    + 'const out=p.clone().sub(x.config.world.sunPosition).normalize();'
    + 'return {t:x.world.time,pos:p.toArray(),quaternion:q.toArray(),nose:nose.toArray(),'
    + 'outward:out.toArray(),dot:nose.dot(out),'
    + 'sunDist:p.distanceTo(x.config.world.sunPosition),'
    + 'stationDist:p.distanceTo(x.station.position),'
    + 'stationInZone:x.station.inZone===true,'
    + 'speed:x.ship.speed,throttle:x.input.throttle,docked:x.flags.docked===true,'
    + 'paused:x.flags.paused===true,hull:x.player?.hull??null,screen:x.player?.screen??null,'
    + 'currentSystem:x.world.currentSystem,origin:x.world.origin??null};'
    + '})()');

  const probeState = () => c.eval('window.__probe307 || null');
  const probeMark = async () => (await probeState())?.seq ?? 0;
  const eventsSince = async (mark) => {
    const rows = await c.eval('window.__probe307 ? window.__probe307.events : []');
    return (rows || []).filter((e) => e.seq > mark);
  };

  // Read-only frame sampler: it never writes ctx, it only copies telemetry and
  // dedupes the frozen event objects by identity before the queue rotates.
  const installed = await c.eval('(()=>{'
    + 'const x=window.__ctx; if(!x?.ship?.object) return false;'
    + 'const p=window.__probe307={events:[],samples:[],seq:0,running:true,error:""};'
    + 'const seen=new WeakSet(); let lastSample=-Infinity;'
    + 'function snapshot(){'
    + 'const o=x.ship.object.position,q=x.ship.object.quaternion;'
    + 'const nose=o.clone().set(0,0,-1).applyQuaternion(q);'
    + 'const out=o.clone().sub(x.config.world.sunPosition).normalize();'
    + 'return {t:x.world.time,wallMs:performance.now(),pos:o.toArray(),'
    + 'nose:nose.toArray(),outward:out.toArray(),dot:nose.dot(out),'
    + 'sunDist:o.distanceTo(x.config.world.sunPosition),'
    + 'stationDist:o.distanceTo(x.station.position),'
    + 'speed:x.ship.speed,throttle:x.input.throttle,docked:x.flags.docked===true,'
    + 'hull:x.player?.hull??null,screen:x.player?.screen??null};'
    + '}'
    + 'function tick(){'
    + 'if(!p.running) return;'
    + 'try{'
    + 'const t=x.world.time;'
    + 'for(const e of [...(x.lastEvents||[]),...(x.events||[])]){'
    + 'if(!e||typeof e!=="object"||seen.has(e)) continue; seen.add(e);'
    + 'if(["sunHeat","sunKill","playerDestroyed","recovered","docked","undocked"].includes(e.type)){'
    + 'p.events.push({seq:++p.seq,type:e.type,t:e.t??null,at:x.world.time,reason:e.reason??null,source:e.source??null});'
    + '}}'
    + 'if(Number.isFinite(t)&&t-lastSample>=1){lastSample=t;p.samples.push(snapshot());}'
    + '}catch(err){p.error=String(err&&err.message||err);}'
    + 'requestAnimationFrame(tick);'
    + '}'
    + 'requestAnimationFrame(tick);'
    + 'return true;'
    + '})()');
  assert.equal(installed, true, 'read-only telemetry sampler installed');

  let seq = 0;
  async function setThrottle(throttle, steerX = 0, steerY = 0) {
    seq++;
    const receipt = await act('setControl', { seq, ttl: 2, throttle, steerX, steerY }, false);
    if (!receipt.ok) throw Error('setControl refused: ' + JSON.stringify(receipt));
    return receipt;
  }
  const bearingTo = (target) => c.eval('(()=>{'
    + 'const x=window.__ctx,p=x.ship.object.position;'
    + 'const dx=' + target[0] + '-p.x,dy=' + target[1] + '-p.y,dz=' + target[2] + '-p.z;'
    + 'const v=p.clone().set(dx,dy,dz).applyQuaternion(x.ship.object.quaternion.clone().invert());'
    + 'const l=Math.hypot(v.x,v.y,v.z)||1;'
    + 'return {x:v.x/l,y:v.y/l,z:v.z/l,range:l};'
    + '})()');
  async function steerBearing(b, throttle) {
    // Issue #116/#300 mapping: ship-local bearing (x right, y up, nose -z).
    // API steerX>0 yaws right; API steerY>0 pitches the nose DOWN, so up is -.
    // bearingTo returns {x,y,z}; the gate row supplies a [x,y,z] array.
    const bx = Array.isArray(b) ? b[0] : b.x;
    const by = Array.isArray(b) ? b[1] : b.y;
    const bz = Array.isArray(b) ? b[2] : b.z;
    const steerX = clamp(Math.atan2(bx, -bz) * 1.5, -1, 1);
    const steerY = clamp(-Math.atan2(by, Math.hypot(bx, bz)) * 1.5, -1, 1);
    return setThrottle(throttle, steerX, steerY);
  }
  async function steerToward(target, throttle) {
    return steerBearing(await bearingTo(target), throttle);
  }
  async function dismissHail(s) {
    if (!s.hail?.open) return s;
    const intent = Array.isArray(s.hail.intents) && s.hail.intents.includes('letGo')
      ? 'letGo' : (s.hail.intents?.[0] ?? null);
    if (!intent) return s;
    const receipt = await act('hailResolve',
      { intent, expectedConversationId: s.hail.conversationId }, false);
    return receipt.ok ? observe() : s;
  }

  /** Fly with the public helm until a predicate, the sim-time bound, or death. */
  async function fly({ throttle, target = null, bearing = null, seconds, until = null, label }) {
    const start = await observe();
    const startT = start.t;
    const wallBegan = Date.now();
    const wallCap = seconds * 5000 + 30000;
    let s = start;
    while (true) {
      s = await observe();
      if (s.session.phase === 'dead') return { s, dead: true, elapsed: s.t - startT, label };
      if (until && until(s)) return { s, reached: true, elapsed: s.t - startT, label };
      if (s.t - startT >= seconds) return { s, timedOut: true, elapsed: s.t - startT, label };
      if (Date.now() - wallBegan > wallCap) return { s, wallTimedOut: true, elapsed: s.t - startT, label };
      if (s.hail?.open) { s = await dismissHail(s); continue; }
      if (s.flags?.paused) { await sleep(150); continue; }
      if (target) await steerToward(target, throttle);
      else if (bearing) await steerBearing(bearing, throttle);
      else await setThrottle(throttle);
      await sleep(150);
    }
  }

  async function waitRecovery(label) {
    const began = Date.now();
    let s = null;
    while (Date.now() - began < 45000) {
      s = await observe();
      if (s.session.phase === 'playing' && (s.ship.hull ?? 0) > 0) {
        await sleep(400);
        return observe();
      }
      if (s.session.phase === 'dead') await act('recover', {}, false);
      await sleep(250);
    }
    throw Error('recovery timeout ' + label + ' ' + JSON.stringify({
      phase: s?.session?.phase, hull: s?.ship?.hull,
    }));
  }

  const failures = [];
  const record = (key, pass, detail) => {
    result[key] = { pass, ...detail };
    if (!pass) failures.push(key);
    console.log(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1200));
  };

  // ---- 1. fresh start: outward-facing nose --------------------------------
  const fresh = await telemetry();
  assert.ok(fresh, 'fresh-start telemetry unavailable');
  assert.equal(fresh.origin, 'greenhand', 'the live origin is Greenhand: ' + JSON.stringify(fresh.origin));
  assert.equal(fresh.currentSystem, 'freehold', 'fresh start is at Freehold');
  const freshDot = fresh.dot;
  record('freshHeading', freshDot > 0.99, {
    dot: freshDot, nose: fresh.nose, outward: fresh.outward,
    pos: fresh.pos, sunDist: fresh.sunDist, stationDist: fresh.stationDist,
    sunRadius: await c.eval('window.__ctx.config.world.sunRadius'),
    threshold: 0.99,
  });
  const gateRow = (await observe()).gate;
  result.gateRowAtStart = gateRow;
  await checkpoint('01-fresh-heading');

  // ---- 2. sunward berth: station-to-gate sweep, then dock from the sun side
  // The salvager run flew the station<->gate sweep; the return approach puts the
  // berth on the sunward side of Freehold Landing, so the release radial faces
  // the sun. This is public flight, not a teleport.
  const station = await c.eval('window.__ctx.station.position.toArray()');
  const stationLen = Math.hypot(station[0], station[1], station[2]);
  const sunwardAxis = [ -station[0] / stationLen, -station[1] / stationLen, -station[2] / stationLen ];
  const sunwardOffset = (p) => {
    const dx = p[0] - station[0], dy = p[1] - station[1], dz = p[2] - station[2];
    return dx * sunwardAxis[0] + dy * sunwardAxis[1] + dz * sunwardAxis[2];
  };
  result.sunwardBerthSetup = { station, sunwardAxis };

  const sweep = await fly({
    throttle: 0.5, bearing: gateRow.bearing, seconds: 20, label: 'sweep-toward-gate',
    until: (s) => sunwardOffset(s.ship.pos) > 40 && s.station.range > 50,
  });
  result.sweep = {
    elapsed: sweep.elapsed, reached: sweep.reached === true,
    timedOut: sweep.timedOut === true, dead: sweep.dead === true,
    end: await telemetry(),
  };

  const dockApproach = await fly({
    throttle: 0.5, target: station, seconds: 25, label: 'dock-approach-sunward',
    until: (s) => s.station.inZone === true,
  });
  let docked = false;
  let dockReceipt = null;
  if (dockApproach.reached && !dockApproach.dead) {
    dockReceipt = await act('dock', {}, false);
    if (!dockReceipt.ok) {
      const approachReceipt = await act('approachDock', {}, false);
      result.dockFallback = approachReceipt;
    }
    const began = Date.now();
    while (Date.now() - began < 20000) {
      const s = await observe();
      if (s.flags.docked) { docked = true; break; }
      await sleep(200);
    }
  }
  const berth = await telemetry();
  result.berth = {
    docked, dockReceipt, berth, sunwardOffset: berth ? sunwardOffset(berth.pos) : null,
    stationDist: berth?.stationDist ?? null, sunDist: berth?.sunDist ?? null,
  };
  assert.equal(docked, true, 'docked at Freehold Landing through the public dock path: '
    + JSON.stringify({ approach: dockApproach.reached, receipt: dockReceipt, berth: result.berth }));
  await checkpoint('02-sunward-berth');

  // ---- 3. public undock and ordinary-throttle flight ---------------------
  const markC = await probeMark();
  let undockReceipt = await act('undock', {}, false);
  for (let i = 0; i < 10 && !undockReceipt.ok; i++) {
    await sleep(1500);
    undockReceipt = await act('undock', {}, false);
  }
  assert.equal(undockReceipt.ok, true, 'public undock accepted: ' + JSON.stringify(undockReceipt));
  await sleep(250);
  const release = await telemetry();
  result.undockRelease = {
    receipt: undockReceipt, release,
    dot: release?.dot ?? null, sunDist: release?.sunDist ?? null,
    stationDist: release?.stationDist ?? null,
  };
  await checkpoint('03-undock-release');
  const cFlight = await fly({ throttle: 0.5, seconds: FLIGHT_SECONDS, label: 'undock-flight' });
  const cEvents = await eventsSince(markC);
  const cCounts = summarizeEvents(cEvents);
  const cEnd = await telemetry();
  record('undockLeg', !cFlight.dead && cCounts.sunKill === 0 && cCounts.playerDestroyed === 0, {
    elapsed: cFlight.elapsed, dead: cFlight.dead === true,
    releaseDot: release?.dot ?? null, releaseSunDist: release?.sunDist ?? null,
    endDot: cEnd?.dot ?? null, endSunDist: cEnd?.sunDist ?? null,
    events: cCounts, eventRows: cEvents,
  });
  await checkpoint('04-undock-flight-end');

  // ---- 4. natural death, berth rewind, restored-heading flight -----------
  // If the undock leg already died (baseline), that death is the rewind under
  // test. Otherwise the probe makes a natural sunward run until the sun kills
  // her — no state injection — and then recovers through the public action.
  let deathFlight = null;
  if (!cFlight.dead) {
    deathFlight = await fly({
      throttle: 0.5, target: [0, 0, 0], seconds: 70, label: 'deliberate-sun-death',
    });
    result.deliberateDeath = {
      dead: deathFlight.dead === true, elapsed: deathFlight.elapsed,
      timedOut: deathFlight.timedOut === true, end: await telemetry(),
    };
  }
  await waitRecovery('berth rewind');
  const markD = await probeMark();
  const rewindPose = await telemetry();
  result.rewind = {
    pose: rewindPose, dot: rewindPose?.dot ?? null,
    sunDist: rewindPose?.sunDist ?? null, stationDist: rewindPose?.stationDist ?? null,
    docked: rewindPose?.docked === false,
  };
  await sleep(500);
  await checkpoint('05-rewind-restored');
  const dFlight = await fly({ throttle: 0.5, seconds: FLIGHT_SECONDS, label: 'rewind-flight' });
  const dEvents = await eventsSince(markD);
  const dCounts = summarizeEvents(dEvents);
  const dEnd = await telemetry();
  record('rewindLeg', !dFlight.dead && dCounts.sunKill === 0 && dCounts.playerDestroyed === 0, {
    recoveredEvent: dEvents.some((e) => e.type === 'recovered'),
    restoredDot: rewindPose?.dot ?? null,
    restoredSunDist: rewindPose?.sunDist ?? null,
    elapsed: dFlight.elapsed, dead: dFlight.dead === true,
    endDot: dEnd?.dot ?? null, endSunDist: dEnd?.sunDist ?? null,
    events: dCounts, eventRows: dEvents,
  });
  await checkpoint('06-rewind-flight-end');

  // ---- 5. origin->gate at ordinary throttle ------------------------------
  if ((await observe()).session.phase === 'dead') {
    await waitRecovery('pre-gate recovery');
  }
  const preGate = await observe();
  const gateDest = preGate.gate?.to;
  assert.equal(typeof gateDest, 'string', 'the live gate row names a destination: ' + JSON.stringify(preGate.gate));
  const markE = await probeMark();
  const gateStartT = preGate.t;
  result.gateLeg = { gateRow: preGate.gate, startT: gateStartT, startSystem: preGate.world.currentSystem };
  const plot = await act('plotRoute', { dest: gateDest }, false);
  assert.equal(plot.ok, true, 'plotRoute to the gate destination accepted: ' + JSON.stringify(plot));
  let engage = await act('engageAutopilot', {}, false);
  for (let i = 0; i < 4 && !engage.ok; i++) {
    await sleep(2000);
    engage = await act('engageAutopilot', {}, false);
  }
  assert.equal(engage.ok, true, 'autopilot engaged for the ordinary gate flight: ' + JSON.stringify(engage));
  let arrived = false;
  let gateEnd = preGate;
  while (true) {
    const s = await observe();
    gateEnd = s;
    if (s.session.phase === 'dead') break;
    if (s.world.currentSystem !== 'freehold' && !s.gate.jumping) { arrived = true; break; }
    if (s.t - gateStartT >= 60) break;
    if (s.hail?.open) await dismissHail(s);
    else if (!s.autopilot.engaged) {
      const retry = await act('engageAutopilot', {}, false);
      if (retry.ok) result.gateLeg.engageRetries = (result.gateLeg.engageRetries ?? 0) + 1;
    }
    await sleep(250);
  }
  const eEvents = await eventsSince(markE);
  const eCounts = summarizeEvents(eEvents);
  const eEnd = await telemetry();
  record('gateLeg', gateEnd.session.phase !== 'dead' && eCounts.sunKill === 0 && eCounts.playerDestroyed === 0, {
    dest: gateDest, arrived, elapsed: gateEnd.t - gateStartT,
    endSystem: gateEnd.world.currentSystem, jumping: gateEnd.gate?.jumping === true,
    endDot: eEnd?.dot ?? null, endSunDist: eEnd?.sunDist ?? null,
    events: eCounts, eventRows: eEvents,
  });
  await checkpoint(arrived ? '07-gate-arrival' : '07-gate-flight-end');

  // ---- evidence: sampler dump, console, cleanup --------------------------
  const dump = await c.eval('(()=>{const p=window.__probe307;if(!p)return null;p.running=false;return p;})()');
  result.probe = {
    eventCount: dump?.events?.length ?? 0,
    sampleCount: dump?.samples?.length ?? 0,
    error: dump?.error ?? '',
    events: dump?.events ?? [],
    samples: dump?.samples ?? [],
  };
  result.consoleErrors = c.console.filter((e) => ['error', 'assert'].includes(e.type));
  result.exceptions = c.exceptions;
  result.verdictLocal = failures.length ? 'FAIL' : 'PASS';
  await save();
  if (failures.length) throw Error('issue-307 live pins failed: ' + failures.join(', '));
});

const summary = {
  verdict: result.verdict,
  evidence: result.profile ? result.profile.replace(/[\\/]profile-[^\\/]+$/, '') : null,
  sourceHash: result.sourceHashStart,
  sourceStable: result.sourceStable,
  consoleErrors: result.consoleErrors?.length ?? 0,
  exceptions: result.exceptions?.length ?? 0,
  freshHeadingDot: result.freshHeading?.dot ?? null,
  undockLeg: result.undockLeg ? {
    pass: result.undockLeg.pass,
    releaseDot: result.undockLeg.releaseDot,
    releaseSunDist: result.undockLeg.releaseSunDist,
    events: result.undockLeg.events,
  } : null,
  rewindLeg: result.rewindLeg ? {
    pass: result.rewindLeg.pass,
    restoredDot: result.rewindLeg.restoredDot,
    events: result.rewindLeg.events,
  } : null,
  gateLeg: result.gateLeg ? {
    pass: result.gateLeg.pass,
    dest: result.gateLeg.dest,
    arrived: result.gateLeg.arrived,
    elapsed: result.gateLeg.elapsed,
    events: result.gateLeg.events,
  } : null,
  error: result.error ? String(result.error).split('\n')[0] : null,
};
console.log('\nISSUE-307 LIVE ' + result.verdict + ' — ' + JSON.stringify(summary));
if (result.verdict !== 'PASS') process.exitCode = 1;
