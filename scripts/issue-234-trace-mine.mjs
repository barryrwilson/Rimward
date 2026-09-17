// Issue #234 — diagnosis only. Mines the prior natural spy playtest evidence
// (out/spy-playtest-20260917) for the four dock-approach failures, separating
// impact cancellations from planning/stall cancellations.
//
// Read-only over the recorded run. Writes a JSON summary to out/issue-234/.
// Usage: node scripts/issue-234-trace-mine.mjs [srcDir] [outFile]

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SRC = resolve(process.argv[2]
  || 'C:/Projects/WebSim/out/spy-playtest-20260917');
const OUT = resolve(process.argv[3] || 'out/issue-234/spy-trace-mine.json');

const jsonl = (name) => readFileSync(resolve(SRC, name), 'utf8')
  .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));

const obs = jsonl('observations.jsonl');
const acts = jsonl('actions.jsonl');

const num = (n) => (Number.isFinite(n) ? Number(n.toFixed(3)) : null);

const slim = (rec) => {
  const o = rec.o || {};
  const ap = o.autopilot || {};
  const ship = o.ship || {};
  const st = o.station || {};
  const nav = o.nav || {};
  const near = (o.targets?.nearby || [])
    .filter((c) => c.kind === 'ship')
    .slice(0, 5)
    .map((c) => ({ id: c.id, name: c.name, range: num(c.range), hostile: c.hostile }));
  return {
    wall: rec.wall,
    t: num(o.t),
    system: o.world?.currentSystem ?? null,
    ap: {
      engaged: ap.engaged === true,
      mode: ap.mode || '',
      phase: ap.phase || '',
      reason: ap.reason || '',
      range: num(ap.range),
      progress: num(ap.progress),
    },
    ship: {
      speed: num(ship.speed),
      throttle: num(ship.throttle),
      hull: ship.hull,
      screen: ship.screen,
      shell: ship.shell,
      pos: Array.isArray(ship.pos) ? ship.pos.map(num) : null,
    },
    station: {
      name: st.name || '', inZone: st.inZone === true,
      range: num(st.range), closingSpeed: num(st.closingSpeed),
    },
    nav: { dest: nav.dest || '', status: nav.status || '', autopilot: nav.autopilot === true },
    shipsNear: near,
    nearestShipRange: near.length ? near[0].range : null,
    docked: o.flags?.docked === true,
  };
};

const rows = obs.map(slim);

// ---- every bodyHit ever sampled (the ring folds, so this is not exhaustive)
const hitKey = (e) => `${e.t}|${e.kind}|${e.speed}|${e.damage}`;
const hits = new Map();
for (const rec of obs) {
  for (const e of rec.o?.events || []) {
    if (e.type !== 'bodyHit') continue;
    if (!hits.has(hitKey(e))) {
      hits.set(hitKey(e), {
        t: num(e.t), kind: e.kind, speed: num(e.speed), damage: num(e.damage),
        firstSeenAtObsT: num(rec.o.t), system: rec.o.world?.currentSystem ?? null,
      });
    }
  }
}
const bodyHits = [...hits.values()].sort((a, b) => a.t - b.t);

// DOCK_TOUCH_SPEED = 1 in src/game/autopilot.js:L282. dockTouchHarmless()
// spares only damage===0 AND |speed|<1; anything else cancels the dock helm.
const DOCK_TOUCH_SPEED = 1;
const cancelsDock = (h) => !(h.damage === 0
  && Number.isFinite(h.speed) && Math.abs(h.speed) < DOCK_TOUCH_SPEED);
for (const h of bodyHits) h.wouldCancelDock = cancelsDock(h);

// ---- autopilot state transitions across sampled observations
const sig = (r) => `${r.ap.engaged}|${r.ap.mode}|${r.ap.phase}|${r.ap.reason}`;
const transitions = [];
for (let i = 1; i < rows.length; i++) {
  if (sig(rows[i]) !== sig(rows[i - 1])) {
    transitions.push({
      t: rows[i].t, system: rows[i].system,
      from: sig(rows[i - 1]), to: sig(rows[i]),
      range: rows[i].ap.range, stationRange: rows[i].station.range,
      progress: rows[i].ap.progress, speed: rows[i].ship.speed,
      nearestShipRange: rows[i].nearestShipRange,
      sampleGapS: num(rows[i].t - rows[i - 1].t),
    });
  }
}

// ---- the four failures named in issue #234
const failures = rows
  .filter((r) => r.ap.mode === 'dock' && r.ap.engaged === false
    && ['impact', 'blocked', 'stale', 'lost-station', 'dock-refused'].includes(r.ap.reason))
  .filter((r, i, a) => i === 0 || sig(a[i - 1]) !== sig(r) || a[i - 1].ap.reason !== r.ap.reason);

// Collapse consecutive duplicate observations of the same cancellation.
const seen = new Set();
const episodes = [];
for (const r of rows) {
  if (!(r.ap.mode === 'dock' && r.ap.engaged === false
    && ['impact', 'blocked', 'stale', 'lost-station', 'dock-refused'].includes(r.ap.reason))) continue;
  const key = `${r.system}|${r.ap.reason}|${Math.round((r.ap.range ?? 0) / 5)}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const before = rows.filter((x) => x.t < r.t && x.t >= r.t - 120
    && x.ap.mode === 'dock' && x.ap.engaged === true);
  const priorHits = bodyHits.filter((h) => h.t <= r.t && h.t >= r.t - 120);
  episodes.push({
    reason: r.ap.reason,
    system: r.system,
    station: r.station.name,
    firstObservedT: r.t,
    rangeAtObservation: r.ap.range,
    progressAtObservation: r.ap.progress,
    speedAtObservation: r.ship.speed,
    nearestShipRange: r.nearestShipRange,
    shipsWithin600u: r.shipsNear.filter((s) => s.range !== null && s.range <= 600).length,
    shipsNear: r.shipsNear,
    hullAtObservation: r.ship.hull,
    // Sampling is ~3 s at best; the cancelling tick itself is never captured.
    precedingEngagedSamples: before.map((x) => ({
      t: x.t, phase: x.ap.phase, range: x.ap.range, progress: x.ap.progress,
      speed: x.ship.speed, nearestShipRange: x.nearestShipRange,
    })),
    bodyHitsWithin120s: priorHits,
    causeClass: r.ap.reason === 'impact'
      ? (priorHits.some((h) => h.wouldCancelDock)
        ? 'impact-with-retained-damaging-hit'
        : 'impact-with-no-retained-hit (ring aged it out)')
      : 'planning-or-stall',
  });
}

// ---- approachDock action receipts
// Recorded shape is {wall, command:{name,args,reqId}, result:{ok,error,name,
// token,notice,t,reqId}} — the earlier a.cmd/a.res reads matched nothing, so
// this list came out empty. Older aliases are kept as fallbacks.
const dockActs = acts.filter((a) => {
  const s = JSON.stringify(a);
  return /approachDock|cancelAutopilot|"dock"/.test(s);
}).map((a) => {
  const res = a.result ?? a.res ?? {};
  return {
    wall: a.wall ?? null,
    cmd: a.command?.name ?? a.cmd ?? a.action ?? a.req?.cmd ?? null,
    args: a.command?.args ?? null,
    t: num(res.t ?? a.o?.t ?? a.t),
    ok: res.ok ?? a.ok ?? null,
    token: res.token ?? a.token ?? null,
    notice: res.notice ?? null,
    error: res.error ?? a.error ?? null,
  };
}).filter((a) => a.cmd);

const report = {
  generatedAt: new Date().toISOString(),
  source: SRC,
  base: 'a923f9df5858e4b2752bf1f668c744caede8d5b1',
  note: 'Diagnosis only. Recorded evidence replayed, no game run, no product edits.',
  counts: {
    observations: obs.length,
    actions: acts.length,
    bodyHitsRetained: bodyHits.length,
    bodyHitsThatWouldCancelDock: bodyHits.filter((h) => h.wouldCancelDock).length,
    dockCancellationEpisodes: episodes.length,
  },
  bodyHits,
  episodes,
  autopilotTransitions: transitions,
  dockActionReceipts: dockActs,
  samplingLimit: {
    medianGapS: num((() => {
      const g = rows.slice(1).map((r, i) => r.t - rows[i].t).sort((a, b) => a - b);
      return g[Math.floor(g.length / 2)] ?? 0;
    })()),
    caveat: 'The cancelling tick is never in the sample; the event ring ages rows out.',
  },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);

console.log(`wrote ${OUT}`);
console.log(JSON.stringify({
  counts: report.counts,
  bodyHits,
  episodes: episodes.map((e) => ({
    reason: e.reason, system: e.system, station: e.station, t: e.firstObservedT,
    range: e.rangeAtObservation, progress: e.progressAtObservation,
    speed: e.speedAtObservation, nearestShipRange: e.nearestShipRange,
    causeClass: e.causeClass,
  })),
}, null, 2));
