// Wave 76 MSN-02 — sanitizeJobs trade pins (no full boot).
// node --import ./scripts/with-css-stub.mjs out/w76/msn02/probe.mjs
import { createShipState, SYSTEMS, COMMODITIES } from '../../../src/game/state.js';
import { restore, WORLD_FIELDS } from '../../../src/game/save.js';

const results = {};
const sysKeys = Object.keys(SYSTEMS);
const nSys = sysKeys.length;
const cap = 4 + 4 * nSys + 16;

function ctxBase() {
  return {
    flags: {},
    world: {
      currentSystem: 'freehold',
      credits: 350,
      fear: 0,
      time: 0,
      jobs: [{ id: 'stale' }],
    },
    systems: SYSTEMS,
    cargo: [],
    cargoCapacity: 20,
    bio: {
      hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0,
      speedFactor: 1, turnFactor: 1,
    },
    player: createShipState('light', { name: 'Wave76Probe' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

function uniqueFour() {
  return [
    {
      id: 'bounty-ace', kind: 'bounty', target: 'Carver Illyx',
      title: 'Bounty: Carver Illyx',
      detail: 'The Compact pays on confirmation of the kill or capture.',
      reward: 2500, state: 'offered', progress: 0, need: 1,
    },
    {
      id: 'patrol-lane', kind: 'patrol',
      title: 'Patrol the lane',
      detail: 'Kill or drive off two pirates and the dockmaster posts pay.',
      reward: 300, state: 'offered', progress: 0, need: 2,
    },
    {
      id: 'haul-provisions', kind: 'haul',
      title: 'Haul provisions',
      detail: 'Accept here, buy Provisions, and dock at the other station.',
      reward: 0, state: 'offered', progress: 0, need: 5,
      originSystem: null, originPrice: 0,
    },
    {
      id: 'ferry-consignment', kind: 'ferry',
      title: 'Ferry a consignment',
      detail: 'A dockside factor fronts you Provisions and pays on delivery.',
      reward: 350, state: 'offered', progress: 0, need: 4,
    },
  ];
}

function destFor(origin) {
  const to = SYSTEMS[origin]?.gates?.[0]?.to;
  if (to && to !== origin && Object.hasOwn(SYSTEMS, to)) return to;
  return origin === 'veridian' ? 'freehold' : 'veridian';
}

function miningJob(sysId, n, slot) {
  return {
    id: `mine-${sysId}-${n}`,
    kind: 'mining',
    slot,
    originSystem: sysId,
    commodity: 'rawOre',
    title: 'Mine raw ore',
    detail: 'Cut reachable rock and deliver the ore at the posting dock.',
    reward: 0,
    need: 4,
    progress: 0,
    state: 'offered',
  };
}

function tradeJob(sysId, n, slot, extra = {}) {
  return {
    id: `trade-${sysId}-${n}`,
    kind: 'trade',
    slot,
    originSystem: extra.originSystem ?? sysId,
    destSystem: extra.destSystem ?? destFor(sysId),
    commodity: extra.commodity ?? 'provisions',
    title: extra.title ?? 'Haul Provisions',
    detail: extra.detail ?? 'Buy or hold 5 Provisions and deliver to the far station.',
    reward: extra.reward ?? 0,
    need: extra.need ?? 5,
    progress: extra.progress ?? 0,
    state: extra.state ?? 'offered',
    deadline: extra.deadline ?? 600,
    ...(extra.payQuoted !== undefined ? { payQuoted: extra.payQuoted } : {}),
    ...extra.rest,
  };
}

function restoreJobs(jobs) {
  const ctx = ctxBase();
  restore(ctx, { v: 1, world: { currentSystem: 'freehold', jobs } });
  return ctx;
}

function pin(name, cond) {
  results[name] = !!cond;
}

pin('world.fields.jobs', WORLD_FIELDS.includes('jobs'));
pin('world.fields.jobsOnce', WORLD_FIELDS.filter((k) => k === 'jobs').length === 1);
pin('world.fields.noMissions', !WORLD_FIELDS.includes('missions'));
pin('cap.420', cap === 4 + 4 * nSys + 16);
pin('systems.freehold', Object.hasOwn(SYSTEMS, 'freehold'));

const keep = restoreJobs([
  ...uniqueFour(),
  miningJob('freehold', 0, 0),
  tradeJob('freehold', 0, 0),
  tradeJob('__proto__', 0, 0, { originSystem: '__proto__', destSystem: 'veridian' }),
  { id: '__proto__', kind: 'bounty', target: 'x', title: 'Proto', detail: 'Reserved full id.', reward: 1, need: 1, progress: 0, state: 'offered' },
  tradeJob('freehold', 1, 0, { need: 1 }),
  tradeJob('freehold', 2, 0, { commodity: 'livingRock' }),
  tradeJob('freehold', 3, 0, { commodity: 'survivor' }),
  tradeJob('freehold', 4, 0, { commodity: 'dataCrystal' }),
  tradeJob('freehold', 5, 0, { commodity: 'restrictedComponents' }),
  { id: 'trade-freehold', kind: 'trade', slot: 0, originSystem: 'freehold', destSystem: 'veridian', commodity: 'provisions', title: 'Short', detail: 'Two tokens only.', reward: 0, need: 5, progress: 0, state: 'offered', deadline: 600 },
]);
const keepIds = keep.world.jobs.map((j) => j.id);
pin('keep.unique.ace', keepIds.includes('bounty-ace'));
pin('keep.unique.haul', keepIds.includes('haul-provisions'));
pin('keep.unique.ferry', keepIds.includes('ferry-consignment'));
pin('keep.mine-freehold-0', keepIds.includes('mine-freehold-0'));
pin('keep.trade-freehold-0', keepIds.includes('trade-freehold-0'));
pin('drop.trade-__proto__-0', !keepIds.includes('trade-__proto__-0'));
pin('drop.__proto__', !keepIds.includes('__proto__'));
pin('drop.need1', !keep.world.jobs.some((j) => j.kind === 'trade' && j.need === 1));
pin('drop.livingRock', !keep.world.jobs.some((j) => j.commodity === 'livingRock'));
pin('drop.survivor', !keep.world.jobs.some((j) => j.commodity === 'survivor'));
pin('drop.dataCrystal', !keep.world.jobs.some((j) => j.commodity === 'dataCrystal'));
pin('drop.restricted', !keep.world.jobs.some((j) => j.commodity === 'restrictedComponents'));
pin('drop.shortId', !keepIds.includes('trade-freehold'));

const honest = uniqueFour();
for (let i = 0; i < sysKeys.length; i++) {
  const sysId = sysKeys[i];
  honest.push(miningJob(sysId, 0, 0));
  honest.push(miningJob(sysId, 1, 1));
  honest.push(tradeJob(sysId, 0, 0));
  honest.push(tradeJob(sysId, 1, 1));
}
const honestCtx = restoreJobs(honest);
pin('honest.length', honestCtx.world.jobs.length === 4 + 4 * nSys);
pin('honest.underCap', honestCtx.world.jobs.length <= cap);

const flood = uniqueFour().concat(miningJob('freehold', 0, 0), tradeJob('freehold', 0, 0));
for (let i = 0; i < 10000; i++) flood.push({ id: `junk-${i}`, kind: 'trade' });
const floodCtx = restoreJobs(flood);
pin('flood.underCap', floodCtx.world.jobs.length <= cap);
pin('flood.keepsTrade', floodCtx.world.jobs.some((j) => j.id === 'trade-freehold-0'));
pin('flood.keepsMine', floodCtx.world.jobs.some((j) => j.id === 'mine-freehold-0'));

const stuffed = restoreJobs([
  ...uniqueFour(),
  tradeJob('freehold', 0, 0, { destSystem: 'redmarch', state: 'accepted', payQuoted: 1e12, commodity: 'refinedMetals' }),
]);
const stuffedJob = stuffed.world.jobs.find((j) => j.id === 'trade-freehold-0');
pin('stuffed.destKept', stuffedJob?.destSystem === 'redmarch');
pin('stuffed.payClamped', stuffedJob?.payQuoted === 20000);
pin('stuffed.need5', stuffedJob?.need === 5);
pin('no.faction', stuffedJob && !Object.hasOwn(stuffedJob, 'faction'));
pin('bulk.three', ['provisions', 'refinedMetals', 'rawOre'].every((k) => COMMODITIES[k]?.bulk === true));

const failed = Object.keys(results).filter((k) => !results[k]);
console.log(JSON.stringify({ cap, nSys, jobsKeep: keepIds, results }, null, 2));
if (failed.length) {
  console.log('WAVE76 PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('WAVE76 PROBE PASS');
