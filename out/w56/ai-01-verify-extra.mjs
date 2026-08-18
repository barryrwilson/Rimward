// Extra verifier checks. Does not import traffic.js (THREE). Replicates skip-loop bound.
import {
  hullRadiusFor,
  separationFor,
  spawnBlocked,
  pirateLiveCap,
} from '../../src/game/traffic-feel.js';

const fails = [];
function check(name, ok, detail) {
  if (!ok) fails.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
}

// Missing / bad classKey must not throw.
let threw = false;
try {
  hullRadiusFor(undefined);
  hullRadiusFor(null);
  hullRadiusFor('');
  hullRadiusFor('nope');
  separationFor(undefined, 'freighter');
  spawnBlocked({ x: 0, y: 0, z: 0 }, undefined, [
    { object: { position: { x: 1, y: 0, z: 0 } }, state: {} },
  ]);
  spawnBlocked({ x: 0, y: 0, z: 0 }, 'light', [
    { object: { position: { x: 1, y: 0, z: 0 } } },
  ]);
} catch (e) {
  threw = true;
  fails.push({ name: 'classKey throw', detail: String(e) });
}
check('missing/bad classKey does not throw', !threw);

check('undefined classKey = light radius', hullRadiusFor(undefined) === hullRadiusFor('light'));
check('null pos not blocked (no throw)', spawnBlocked(null, 'light', []) === false);
check('undefined liveShips not blocked', spawnBlocked({ x: 0, y: 0, z: 0 }, 'light', undefined) === false);

// Q-ship: world.js odd pirates are cutter + coverClass freighter.
const sepCutter = separationFor('cutter', 'cutter');
const sepFreight = separationFor('freighter', 'freighter');
const sepMix = separationFor('cutter', 'freighter');
console.log(`NOTE qship real-class sep cutter-cutter=${sepCutter} cutter-freight=${sepMix} freight-freight=${sepFreight}`);
check('qship visual hull is much larger than real class gap', sepFreight > sepCutter * 2);

// NaN on a live ship blocks every candidate.
const nanLive = [{ object: { position: { x: NaN, y: 0, z: 0 } }, state: { classKey: 'light' } }];
check('NaN live position blocks far candidate', spawnBlocked({ x: 5000, y: 0, z: 0 }, 'light', nanLive) === true);

// Missing other position is skipped, not a global block.
const noPos = [{ object: {}, state: { classKey: 'freighter' } }];
check('missing other.position does not block', spawnBlocked({ x: 0, y: 0, z: 0 }, 'freighter', noPos) === false);

// Pirate cap vs blockade.
check('blockade ignores count', pirateLiveCap(99, true) === Number.POSITIVE_INFINITY);
check('ordinary 5 live post-spawn cap 2', pirateLiveCap(5, false) === 2);

// Retry loop replica: skip blocked, pick next, bound by recCount.
function pickBest(records, ships, { blockade = false, pirateLive = 0 } = {}) {
  const recCount = records.length;
  const skipped = [];
  const cap = pirateLiveCap(ships.length + 1, blockade);
  let best = null;
  let attempts = 0;
  for (let attempt = 0; attempt < recCount; attempt++) {
    attempts++;
    best = null;
    let bestScore = Infinity;
    for (let i = 0; i < recCount; i++) {
      const rec = records[i];
      if (skipped.includes(rec)) continue;
      const score = blockade && rec.role === 'pirate' ? rec.d * 0.5 : rec.d;
      if (score < bestScore) {
        bestScore = score;
        best = rec;
      }
    }
    if (!best) break;
    if (!blockade && best.role === 'pirate' && pirateLive + 1 > cap) {
      skipped.push(best);
      best = null;
      continue;
    }
    if (spawnBlocked(best.pos, best.classKey, ships)) {
      skipped.push(best);
      best = null;
      continue;
    }
    break;
  }
  return { best, attempts, skipped };
}

const parked = [{ object: { position: { x: 0, y: 0, z: 0 } }, state: { classKey: 'freighter' } }];
const stacked = {
  id: 'stacked',
  classKey: 'freighter',
  role: 'trader',
  d: 10,
  pos: { x: 0, y: 0, z: 0 },
};
const clear = {
  id: 'clear',
  classKey: 'light',
  role: 'trader',
  d: 80,
  pos: { x: 200, y: 0, z: 0 },
};
const r1 = pickBest([stacked, clear], parked);
check('skip stacked hull, spawn next', r1.best && r1.best.id === 'clear', r1.best && r1.best.id);
check('retry attempts bounded', r1.attempts <= 2, `${r1.attempts}`);

const pirates = [
  { id: 'p1', classKey: 'cutter', role: 'pirate', d: 20, pos: { x: 400, y: 0, z: 0 } },
  { id: 'p2', classKey: 'cutter', role: 'pirate', d: 30, pos: { x: 410, y: 0, z: 0 } },
  { id: 't1', classKey: 'light', role: 'trader', d: 40, pos: { x: 420, y: 0, z: 0 } },
];
const twoPiratesLive = [
  { role: 'pirate', object: { position: { x: -100, y: 0, z: 0 } }, state: { classKey: 'cutter' } },
  { role: 'pirate', object: { position: { x: -200, y: 0, z: 0 } }, state: { classKey: 'cutter' } },
];
// liveCount+1 = 3, cap = 1. pirateLive+1 = 3 > 1, skip pirates, take trader.
const r2 = pickBest(pirates, twoPiratesLive, { pirateLive: 2 });
check('over-cap skips pirates, takes trader', r2.best && r2.best.id === 't1', r2.best && r2.best.id);

const r3 = pickBest(pirates, twoPiratesLive, { blockade: true, pirateLive: 2 });
check('blockade still prefers nearest pirate', r3.best && r3.best.id === 'p1', r3.best && r3.best.id);

const allBlocked = [
  { id: 'a', classKey: 'freighter', role: 'trader', d: 5, pos: { x: 0, y: 0, z: 0 } },
  { id: 'b', classKey: 'freighter', role: 'trader', d: 6, pos: { x: 1, y: 0, z: 0 } },
];
const r4 = pickBest(allBlocked, parked);
check('all blocked => no spawn this frame', r4.best === null);
check('all blocked attempts <= recCount', r4.attempts <= allBlocked.length, `${r4.attempts}`);

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  process.exit(1);
}
console.log('PASS extra');
process.exit(0);
