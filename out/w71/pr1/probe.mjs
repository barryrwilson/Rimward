// Wave 71 PR1 — sanitizeJobs on restore.
// node --import ./scripts/with-css-stub.mjs out/w71/pr1/probe.mjs
import { createShipState, SYSTEMS } from '../../../src/game/state.js';
import { restore, WORLD_FIELDS } from '../../../src/game/save.js';

const results = {};
const sysKeys = Object.keys(SYSTEMS);
const nSys = sysKeys.length;
const cap = 4 + 2 * nSys + 16;

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
    player: createShipState('light', { name: 'Wave71Probe' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
}

function uniqueFour(extra = {}) {
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
      reward: 350, state: extra.ferryState ?? 'offered', progress: 0, need: 4,
      originSystem: extra.originSystem, destSystem: extra.destSystem,
      payQuoted: extra.payQuoted,
    },
  ];
}

function miningJob(sysId, n, slot, extra = {}) {
  return {
    id: `mine-${sysId}-${n}`,
    kind: 'mining',
    slot,
    originSystem: extra.originSystem ?? sysId,
    commodity: extra.commodity ?? 'rawOre',
    title: extra.title ?? 'Mine raw ore',
    detail: extra.detail ?? 'Cut reachable rock and deliver the ore at the posting dock.',
    reward: extra.reward ?? 0,
    need: extra.need ?? 4,
    progress: extra.progress ?? 0,
    state: extra.state ?? 'offered',
    ...extra.rest,
  };
}

function restoreJobs(jobs, worldExtra = {}) {
  const ctx = ctxBase();
  restore(ctx, {
    v: 1,
    world: { currentSystem: 'freehold', jobs, ...worldExtra },
  });
  return ctx;
}

function idsOf(jobs) {
  return jobs.map((j) => j.id);
}

function pin(name, cond) {
  results[name] = !!cond;
}

pin('world.fields.jobs', WORLD_FIELDS.includes('jobs'));
pin('world.fields.jobsOnce', WORLD_FIELDS.filter((k) => k === 'jobs').length === 1);
pin('world.fields.noMissions', !WORLD_FIELDS.includes('missions'));
pin('cap.fromSystems', cap === 4 + 2 * nSys + 16);
pin('systems.count', nSys >= 1 && Object.hasOwn(SYSTEMS, 'freehold'));

const dropIds = [
  { id: 'mine-__proto__-0', kind: 'mining', slot: 0, originSystem: '__proto__', commodity: 'rawOre', title: 'Mine', detail: 'Bad proto system token.', reward: 0, need: 4, progress: 0, state: 'offered' },
  { id: '__proto__', kind: 'bounty', target: 'x', title: 'Proto', detail: 'Reserved full id.', reward: 1, need: 1, progress: 0, state: 'offered' },
  { id: 'constructor', kind: 'bounty', target: 'x', title: 'Ctor', detail: 'Reserved constructor id.', reward: 1, need: 1, progress: 0, state: 'offered' },
  { id: 'bounty-prototype', kind: 'bounty', target: 'x', title: 'Proto token', detail: 'Reserved prototype token.', reward: 1, need: 1, progress: 0, state: 'offered' },
  { id: 'mine-notasystem-0', kind: 'mining', slot: 0, originSystem: 'notasystem', commodity: 'rawOre', title: 'Mine', detail: 'Unknown system.', reward: 0, need: 4, progress: 0, state: 'offered' },
  { id: 'mine-freehold', kind: 'mining', slot: 0, originSystem: 'freehold', commodity: 'rawOre', title: 'Mine', detail: 'Two tokens only.', reward: 0, need: 4, progress: 0, state: 'offered' },
  { id: 'bountyace', kind: 'bounty', target: 'Ace', title: 'Ace', detail: 'No hyphen unique rewrite.', reward: 2500, need: 1, progress: 0, state: 'offered' },
];

const protoJson = JSON.parse(JSON.stringify({
  __proto__: { polluted: true },
  id: 'bounty-ace',
  kind: 'bounty',
  target: 'Carver Illyx',
  title: 'Bounty: Carver Illyx',
  detail: 'The Compact pays on confirmation of the kill or capture.',
  reward: 2500,
  state: 'offered',
  progress: 0,
  need: 1,
  faction: 'veridian',
  asteroidId: 0,
}));

const keepMix = [
  protoJson,
  ...uniqueFour().slice(1),
  miningJob('freehold', 0, 0),
  ...dropIds,
];
delete Object.prototype.polluted;
const keepCtx = restoreJobs(keepMix);
const keepIds = idsOf(keepCtx.world.jobs);
const mine0 = keepCtx.world.jobs.find((j) => j.id === 'mine-freehold-0');
const ace = keepCtx.world.jobs.find((j) => j.id === 'bounty-ace');

pin('keep.bounty-ace', keepIds.includes('bounty-ace'));
pin('keep.patrol-lane', keepIds.includes('patrol-lane'));
pin('keep.haul-provisions', keepIds.includes('haul-provisions'));
pin('keep.ferry-consignment', keepIds.includes('ferry-consignment'));
pin('keep.mine-freehold-0', !!mine0);
pin('keep.mine.kind', mine0?.kind === 'mining');
pin('keep.mine.slot', mine0?.slot === 0);
pin('keep.mine.origin', mine0?.originSystem === 'freehold');
pin('keep.mine.commodity', mine0?.commodity === 'rawOre');
pin('drop.mine-proto', !keepIds.includes('mine-__proto__-0'));
pin('drop.proto', !keepIds.includes('__proto__'));
pin('drop.constructor', !keepIds.includes('constructor'));
pin('drop.bounty-prototype', !keepIds.includes('bounty-prototype'));
pin('drop.mine-notasystem', !keepIds.includes('mine-notasystem-0'));
pin('drop.mine-two-tokens', !keepIds.includes('mine-freehold'));
pin('drop.bountyace', !keepIds.includes('bountyace'));
pin('drop.unknownKeys', ace && ace.faction === undefined && ace.asteroidId === undefined);
pin('jobs.array', Array.isArray(keepCtx.world.jobs));
pin('jobs.plain', keepCtx.world.jobs.every((j) => Object.getPrototypeOf(j) === Object.prototype));
pin('proto.pollutedUndefined', Object.prototype.polluted === undefined);

const payFour = uniqueFour({
  ferryState: 'accepted',
  originSystem: 'freehold',
  destSystem: 'fh_hearth',
  payQuoted: 999999,
});
const payCtx = restoreJobs(payFour);
const ferry = payCtx.world.jobs.find((j) => j.id === 'ferry-consignment');
pin('payQuoted.clamp', ferry?.payQuoted === 20000);
pin('payQuoted.keepFerry', ferry?.state === 'accepted' && ferry?.originSystem === 'freehold');

const honest = uniqueFour();
for (let s = 0; s < sysKeys.length; s++) {
  honest.push(miningJob(sysKeys[s], 0, 0));
  honest.push(miningJob(sysKeys[s], 1, 1));
}
const honestCtx = restoreJobs(honest);
const honestIds = new Set(idsOf(honestCtx.world.jobs));
let honestMining = 0;
for (let s = 0; s < sysKeys.length; s++) {
  if (honestIds.has(`mine-${sysKeys[s]}-0`) && honestIds.has(`mine-${sysKeys[s]}-1`)) honestMining += 2;
}
pin('cap.honestFits', honestCtx.world.jobs.length === 4 + 2 * nSys && honestCtx.world.jobs.length <= cap);
pin('cap.honestUnique', ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'].every((id) => honestIds.has(id)));
pin('cap.honestMining', honestMining === 2 * nSys);

const overflow = uniqueFour();
for (let s = 0; s < sysKeys.length; s++) {
  overflow.push(miningJob(sysKeys[s], 0, 0));
  overflow.push(miningJob(sysKeys[s], 1, 1));
}
for (let n = 100; n < 130; n++) overflow.push(miningJob('freehold', n, 0));
for (let n = 200; n < 220; n++) overflow.push(miningJob('freehold', n, 0, { state: 'done' }));
for (let i = 0; i < 20; i++) {
  overflow.push({
    id: `bounty-pirate-done${i}`,
    kind: 'bounty',
    target: `Pirate${i}`,
    system: 'fh_hearth',
    title: `Bounty: Pirate${i}`,
    detail: 'Done overlay card for cap overflow.',
    reward: 400,
    state: 'done',
    progress: 1,
    need: 1,
  });
}
const overflowCtx = restoreJobs(overflow);
const overflowIds = new Set(idsOf(overflowCtx.world.jobs));
let overflowHonest = 0;
for (let s = 0; s < sysKeys.length; s++) {
  if (overflowIds.has(`mine-${sysKeys[s]}-0`) && overflowIds.has(`mine-${sysKeys[s]}-1`)) overflowHonest += 2;
}
pin('cap.overflowLen', overflowCtx.world.jobs.length <= cap);
pin('cap.overflowUnique', ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'].every((id) => overflowIds.has(id)));
pin('cap.overflowHonestMining', overflowHonest === 2 * nSys);
pin('cap.overflowExtraOfferedDropped', !overflowIds.has('mine-freehold-100'));
pin('cap.overflowDoneMiningDropped', !overflowIds.has('mine-freehold-200'));

const poisonCtx = restoreJobs({ not: 'array' });
pin('poison.nonArrayEmpty', Array.isArray(poisonCtx.world.jobs) && poisonCtx.world.jobs.length === 0);
pin('poison.notNull', poisonCtx.world.jobs !== null);

const nullCtx = restoreJobs(null);
pin('poison.nullEmpty', Array.isArray(nullCtx.world.jobs) && nullCtx.world.jobs.length === 0);

const omitLive = [{
  id: 'bounty-ace', kind: 'bounty', target: 'Live',
  title: 'Live stale ace', detail: 'Should not survive omitted jobs key.',
  reward: 1, state: 'offered', progress: 0, need: 1,
}];
const omitCtx = ctxBase();
omitCtx.world.jobs = omitLive;
restore(omitCtx, { v: 1, world: { currentSystem: 'freehold' } });
pin('omit.jobsIsArray', Array.isArray(omitCtx.world.jobs));
pin('omit.jobsEmpty', omitCtx.world.jobs.length === 0);
pin('omit.staleDropped', !omitCtx.world.jobs.some((j) => j.title === 'Live stale ace'));
pin('omit.notNull', omitCtx.world.jobs !== null);

delete Object.prototype.polluted;
const protoArr = uniqueFour();
const protoMine = miningJob('freehold', 0, 0);
Object.defineProperty(protoMine, '__proto__', { value: { polluted: true }, enumerable: true });
protoArr.push(protoMine);
const jsonProto = JSON.parse(
  '{"__proto__":{"polluted":true},"id":"__proto__","kind":"bounty","target":"x",'
  + '"title":"x","detail":"reserved id from json","reward":1,"need":1,"progress":0,"state":"offered"}',
);
protoArr.push(jsonProto);
const protoCtx = restoreJobs(protoArr);
pin('proto.afterDefine', Object.prototype.polluted === undefined);
pin('proto.jobsPlain', protoCtx.world.jobs.every((j) => Object.getPrototypeOf(j) === Object.prototype));
pin('proto.keptMine', protoCtx.world.jobs.some((j) => j.id === 'mine-freehold-0' && j.polluted !== true));
pin('proto.jsonDropped', !protoCtx.world.jobs.some((j) => j.id === '__proto__'));

console.log(JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('WAVE71 SANITIZE FAIL', failed.join(','));
  process.exit(1);
}
console.log('PASS');
console.log(JSON.stringify({ allTrue: true, cap, nSys, keepLen: keepCtx.world.jobs.length, overflowLen: overflowCtx.world.jobs.length }));
