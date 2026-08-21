import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createShipState, SYSTEMS, FACTIONS } from '../../../src/game/state.js';
import { WORLD_FIELDS, restore } from '../../../src/game/save.js';

const here = process.cwd();
const src = (rel) => readFileSync(join(here, rel), 'utf8');
const saveSrc = src('src/game/save.js');
const stationSrc = src('src/systems/station.js');
const nSys = Object.keys(SYSTEMS).length;
const liveCap = 4 + 12 * nSys + 16;
const warRoom = 2 * nSys;
const cap = liveCap + warRoom;
const unique = ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment'];

const destFor = (origin) => {
  const to = SYSTEMS[origin]?.gates?.[0]?.to;
  return to && to !== origin && Object.hasOwn(SYSTEMS, to) ? to : (origin === 'veridian' ? 'freehold' : 'veridian');
};
const spyDestOk = (origin, dest) => {
  if (!origin || !dest || origin === dest) return false;
  if (!Object.hasOwn(SYSTEMS, origin) || !Object.hasOwn(SYSTEMS, dest)) return false;
  const home = SYSTEMS[origin];
  const far = SYSTEMS[dest];
  if (!home || !far || !home.station || !far.station) return false;
  const employer = home.faction;
  const targetFac = far.faction;
  if (typeof employer !== 'string' || !Object.hasOwn(FACTIONS, employer) || employer === 'unknowables') return false;
  if (typeof targetFac !== 'string' || !Object.hasOwn(FACTIONS, targetFac) || targetFac === 'unknowables') return false;
  return targetFac !== employer;
};
const rivalDest = (origin, slot) => {
  const n = slot === 1 ? 1 : 0;
  if (!Object.hasOwn(SYSTEMS, origin)) return null;
  const gates = SYSTEMS[origin].gates;
  const gateRivals = [];
  const seen = new Set();
  if (Array.isArray(gates)) {
    for (let i = 0; i < gates.length; i++) {
      const to = gates[i] && typeof gates[i].to === 'string' ? gates[i].to : null;
      if (!to || seen.has(to) || !spyDestOk(origin, to)) continue;
      seen.add(to);
      gateRivals.push(to);
    }
  }
  const list = gateRivals.length > 0 ? gateRivals : Object.keys(SYSTEMS).filter((to) => spyDestOk(origin, to));
  return list[n] ?? null;
};
const warDest = (origin) => {
  if (!Object.hasOwn(SYSTEMS, origin)) return null;
  const employer = SYSTEMS[origin].faction;
  if (typeof employer !== 'string' || !Object.hasOwn(FACTIONS, employer)) return null;
  const gates = SYSTEMS[origin].gates;
  if (!Array.isArray(gates)) return null;
  for (let i = 0; i < gates.length; i++) {
    const to = gates[i] && typeof gates[i].to === 'string' ? gates[i].to : null;
    if (!to || !Object.hasOwn(SYSTEMS, to) || to === origin) continue;
    const far = SYSTEMS[to];
    if (!far || !far.station) continue;
    const target = far.faction;
    if (typeof target !== 'string' || !Object.hasOwn(FACTIONS, target)) continue;
    if (target === employer) continue;
    return to;
  }
  return null;
};

const job = (id, kind, extra = {}) => ({
  id, kind,
  title: extra.title ?? id,
  detail: extra.detail ?? 'Wave 80 war pin row.',
  reward: extra.reward ?? 100,
  state: extra.state ?? 'offered',
  progress: extra.progress ?? 0,
  need: extra.need ?? 1,
  ...(extra.target != null ? { target: extra.target } : {}),
  ...extra.rest,
});
const mine = (sysId, n, slot) => ({
  id: `mine-${sysId}-${n}`, kind: 'mining', slot, originSystem: sysId, commodity: 'rawOre',
  title: 'Mine raw ore', detail: 'Cut reachable rock and deliver the ore at the posting dock.',
  reward: 0, need: 4, progress: 0, state: 'offered',
});
const trade = (sysId, n, slot) => ({
  id: `trade-${sysId}-${n}`, kind: 'trade', slot, originSystem: sysId, destSystem: destFor(sysId),
  commodity: 'provisions', title: 'Haul Provisions',
  detail: 'Buy or hold 5 Provisions and deliver to the far station.',
  reward: 0, need: 5, progress: 0, state: 'offered', deadline: 600,
});
const hunt = (sysId, n, slot) => ({
  id: `hunt-${sysId}-${n}`, kind: 'hunt', slot, originSystem: sysId, recordId: `rec-${n + 1}`,
  target: 'Red Marlow', title: 'Hunt Red Marlow', detail: 'Hunt a local pirate in this system.',
  reward: 300, need: 1, progress: 0, state: 'offered', deadline: 600,
});
const pass = (sysId, n, slot) => ({
  id: `passenger-${sysId}-${n}`, kind: 'passenger', slot, originSystem: sysId, destSystem: destFor(sysId),
  title: 'Escort passengers', detail: 'Carry a booked party to the far station. Paid on docking there.',
  reward: 350, need: 1, progress: 0, state: 'offered', deadline: 600,
});
const explore = (sysId, n, slot) => ({
  id: `explore-${sysId}-${n}`, kind: 'explore', slot, originSystem: sysId,
  title: 'Survey The Shepherd', detail: 'Fly to The Shepherd in Freehold Drift. Redock here to file.',
  reward: 300, need: 1, progress: 0, state: 'offered', deadline: 600,
});
const spy = (sysId, n, slot, extra = {}) => ({
  id: `spy-${sysId}-${n}`, kind: 'espionage', slot,
  originSystem: extra.originSystem ?? sysId,
  destSystem: extra.destSystem ?? rivalDest(sysId, slot) ?? destFor(sysId),
  title: extra.title ?? 'Spy at the far dock',
  detail: extra.detail ?? 'Gather at the far dock. File at the home dock.',
  reward: extra.reward ?? 420, need: extra.need ?? 1, progress: extra.progress ?? 0,
  state: extra.state ?? 'offered', deadline: extra.deadline ?? 600,
  ...(extra.payQuoted !== undefined ? { payQuoted: extra.payQuoted } : {}),
  ...extra.rest,
});
const war = (sysId, n, slot, extra = {}) => ({
  id: `war-${sysId}-${n}`, kind: 'war', slot,
  originSystem: extra.originSystem ?? sysId,
  destSystem: extra.destSystem ?? warDest(sysId) ?? destFor(sysId),
  recordId: extra.recordId ?? `rec-${n + 40}`,
  target: extra.target ?? 'Lane Watch',
  title: extra.title ?? 'Strike Lane Watch',
  detail: extra.detail ?? 'Strike a rival patrol.',
  reward: extra.reward ?? 300, need: extra.need ?? 1, progress: extra.progress ?? 0,
  state: extra.state ?? 'offered', deadline: extra.deadline ?? 600,
  ...(extra.payQuoted !== undefined ? { payQuoted: extra.payQuoted } : {}),
  ...extra.rest,
});
const four = () => [
  job('bounty-ace', 'bounty', { title: 'Bounty: Carver Illyx', target: 'Carver Illyx', reward: 2500 }),
  job('patrol-lane', 'patrol', { title: 'Patrol the lane', reward: 300, need: 2 }),
  job('haul-provisions', 'haul', { title: 'Haul provisions', reward: 0, need: 5, rest: { originSystem: null, originPrice: 0 } }),
  job('ferry-consignment', 'ferry', { title: 'Ferry a consignment', reward: 350, need: 4 }),
];

function stub(jobs, extraWorld = {}) {
  const c = {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0, time: 0, jobs: [{ id: 'stale' }] },
    systems: SYSTEMS,
    cargo: [],
    cargoCapacity: 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: createShipState('light', { name: 'Wave80WarPin' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
  restore(c, { v: 1, world: { currentSystem: 'freehold', jobs, ...extraWorld } });
  return c;
}

const keep = stub([
  ...four(),
  mine('freehold', 0, 0),
  trade('freehold', 0, 0),
  hunt('freehold', 0, 0),
  pass('freehold', 0, 0),
  explore('freehold', 0, 0),
  spy('freehold', 0, 0),
  war('freehold', 0, 0),
  war('__proto__', 0, 0, { originSystem: '__proto__' }),
  job('__proto__', 'bounty', { title: 'Proto', target: 'x' }),
  war('freehold', 9, 0, { need: 2 }),
  war('notasystem', 0, 0, { originSystem: 'notasystem' }),
  {
    id: 'war-freehold', kind: 'war', slot: 0, originSystem: 'freehold',
    destSystem: warDest('freehold') ?? 'veridian', recordId: 'rec-40',
    target: 'Lane Watch', title: 'Short', detail: 'Two tokens only.',
    reward: 300, need: 1, progress: 0, state: 'offered', deadline: 600,
  },
  war('freehold', 8, 1, { destSystem: 'freehold' }),
  war('freehold', 7, 1, { rest: { commodity: 'dataCrystal', faction: 'redledger', payQuoted: 999999 } }),
  war('fh_hearth', 1, 1),
]);
const keepIds = keep.world.jobs.map((j) => j.id);
const keepWar7 = keep.world.jobs.find((j) => j.id === 'war-freehold-7');

const aceCtx = stub([
  ...four(),
  war('freehold', 0, 0, { recordId: 'rec-1', destSystem: 'veridian', target: 'Lane Watch' }),
  war('freehold', 7, 1, { recordId: 'rec-7', destSystem: 'veridian', target: 'Carver Illyx' }),
], {
  recordBanks: {
    freehold: [
      { id: 'rec-1', role: 'patrol', system: 'freehold', faction: 'veridian', name: 'Lane Watch', classKey: 'heavy' },
      { id: 'rec-7', role: 'ace', system: 'freehold', faction: 'veridian', name: 'Carver Illyx', classKey: 'ace' },
    ],
  },
});

const honest = four();
let expectedSpy = 0;
let expectedWar = 0;
for (const sysId of Object.keys(SYSTEMS)) {
  honest.push(mine(sysId, 0, 0), mine(sysId, 1, 1));
  honest.push(trade(sysId, 0, 0), trade(sysId, 1, 1));
  honest.push(hunt(sysId, 0, 0), hunt(sysId, 1, 1));
  honest.push(pass(sysId, 0, 0), pass(sysId, 1, 1));
  honest.push(explore(sysId, 0, 0), explore(sysId, 1, 1));
  const d0 = rivalDest(sysId, 0);
  const d1 = rivalDest(sysId, 1);
  if (d0) { honest.push(spy(sysId, 0, 0, { destSystem: d0 })); expectedSpy += 1; }
  if (d1) { honest.push(spy(sysId, 1, 1, { destSystem: d1 })); expectedSpy += 1; }
  const wd = warDest(sysId) ?? destFor(sysId);
  if (wd && wd !== sysId) {
    honest.push(war(sysId, 0, 0, { destSystem: wd, recordId: 'rec-40' }));
    honest.push(war(sysId, 1, 1, { destSystem: wd, recordId: 'rec-41' }));
    expectedWar += 2;
  }
}
const honestCtx = stub(honest);

const flood = four().concat(
  mine('freehold', 0, 0), trade('freehold', 0, 0), hunt('freehold', 0, 0),
  pass('freehold', 0, 0), explore('freehold', 0, 0), spy('freehold', 0, 0),
  war('freehold', 0, 0),
);
for (let i = 0; i < 10000; i++) flood.push({ id: `junkw-${i}`, kind: 'war' });
const floodCtx = stub(flood);

const stuffed = stub([
  ...four(),
  war('freehold', 0, 0, {
    destSystem: 'redmarch', target: 'Stuffed Alias', state: 'accepted',
    payQuoted: 80, deadline: 1e9, recordId: 'rec-40',
    rest: { faction: 'veridian', asteroidId: 3 },
  }),
]);
const stuffedJob = stuffed.world.jobs.find((j) => j.id === 'war-freehold-0');

const warTickAt = stationSrc.indexOf("if (job.kind === 'war')");
const warTickSlice = warTickAt >= 0 ? stationSrc.slice(warTickAt, warTickAt + 6000) : '';

const pins = {
  uniqueFour: unique.every((id) => keepIds.includes(id)),
  keepMineFh: keepIds.includes('mine-freehold-0'),
  keepTradeFh: keepIds.includes('trade-freehold-0'),
  keepHuntFh: keepIds.includes('hunt-freehold-0'),
  keepPassengerFh: keepIds.includes('passenger-freehold-0'),
  keepExploreFh: keepIds.includes('explore-freehold-0'),
  keepSpyFh: keepIds.includes('spy-freehold-0'),
  keepWarFh: keepIds.includes('war-freehold-0'),
  keepWarHearth: keepIds.includes('war-fh_hearth-1'),
  dropProto: !keepIds.includes('__proto__') && !keepIds.includes('war-__proto__-0'),
  dropShortId: !keepIds.includes('war-freehold'),
  dropNeed2: !keep.world.jobs.some((j) => j.kind === 'war' && j.need === 2),
  dropBadSys: !keepIds.includes('war-notasystem-0'),
  dropSameDest: !keepIds.includes('war-freehold-8'),
  dropCommodityAndFaction: keepWar7 && !Object.hasOwn(keepWar7, 'commodity') && !Object.hasOwn(keepWar7, 'faction')
    && keepWar7.payQuoted === 20000,
  dropAceRecord: aceCtx.world.jobs.some((j) => j.id === 'war-freehold-0')
    && !aceCtx.world.jobs.some((j) => j.id === 'war-freehold-7'),
  capFormula: saveSrc.includes('WAR_SLOTS_PER_SYSTEM')
    && cap === 4 + 14 * nSys + 16
    && /WAR_SLOTS_PER_SYSTEM \* N_SYSTEMS/.test(saveSrc)
    && saveSrc.includes('plus war room only')
    && saveSrc.includes('plus espionage room only'),
  capFits: honestCtx.world.jobs.length === 4 + 10 * nSys + expectedSpy + expectedWar
    && honestCtx.world.jobs.length <= cap
    && expectedWar <= warRoom,
  floodHeal: floodCtx.world.jobs.length <= cap
    && unique.every((id) => floodCtx.world.jobs.some((j) => j.id === id))
    && floodCtx.world.jobs.some((j) => j.id === 'war-freehold-0')
    && floodCtx.world.jobs.some((j) => j.id === 'spy-freehold-0')
    && floodCtx.world.jobs.some((j) => j.id === 'mine-freehold-0'),
  fieldsJobs: WORLD_FIELDS.includes('jobs') && WORLD_FIELDS.filter((k) => k === 'jobs').length === 1
    && !WORLD_FIELDS.includes('missions') && !WORLD_FIELDS.includes('wars'),
  stuffedDestKept: stuffedJob && stuffedJob.destSystem === 'redmarch' && stuffedJob.target === 'Stuffed Alias'
    && stuffedJob.payQuoted === 80,
  stuffedFieldsDropped: stuffed.world.jobs.every((j) => !Object.hasOwn(j, 'faction')
    && !Object.hasOwn(j, 'asteroidId')),
  kindAllow: saveSrc.includes("'war'") && stationSrc.includes("kind: 'war'"),
  idPrefix: stationSrc.includes('war-${sysId}-'),
  saveIdPrefix: saveSrc.includes("tokens[0] !== 'war'"),
  helpers: stationSrc.includes('function warDestId')
    && stationSrc.includes('function pickWarQuarry')
    && stationSrc.includes('function makeWarJob')
    && stationSrc.includes('function syncWarJobs')
    && stationSrc.includes('function replaceWarJob'),
  boardHide: stationSrc.includes("j.kind === 'war' && j.state === 'offered' && j.originSystem !== sysId"),
  originAccept: /job\.kind === 'war'[\s\S]*?currentSystem !== job\.originSystem/.test(stationSrc),
  destRebind: stationSrc.includes('warDestId(job.originSystem)')
    && stationSrc.includes('job.destSystem = dest'),
  noInnerHtml: !/innerHTML/.test(stationSrc),
  noFullSafeId: !/SAFE_ID\.test\(\s*job\.id/.test(saveSrc) && !/SAFE_ID\.test\(\s*job\.id/.test(stationSrc),
  uniqueHaul: stationSrc.includes("id: 'haul-provisions'") && stationSrc.includes("id: 'ferry-consignment'"),
  haulDestBind: /job\.kind === 'haul'[\s\S]*?const dest = otherSystemId\(ctx, origin\)/.test(stationSrc),
  extraAfterSpy: saveSrc.includes('function extraOfferedEspionage')
    && saveSrc.includes('function extraOfferedWar')
    && saveSrc.indexOf('function extraOfferedWar') > saveSrc.indexOf('function extraOfferedEspionage'),
  extraDupWar: saveSrc.includes('function extraDuplicateWarRecords'),
  keepHonestSpy: saveSrc.includes("j.kind === 'espionage' && j.state === 'offered' && !extraEspionage.has(j)"),
  keepHonestWar: saveSrc.includes("j.kind === 'war' && j.state === 'offered' && !extraWar.has(j)"),
  noTargetWrite: warTickSlice.includes('replaceWarJob')
    && !/reputation\[target/.test(warTickSlice)
    && !/job\.faction/.test(warTickSlice),
  acceptedStrike: stationSrc.includes('ACCEPTED — strike ${name}'),
  digit2: stationSrc.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs'"),
  huntStaysPirate: stationSrc.includes("kind: 'hunt'") && stationSrc.includes("rec.role !== 'pirate'"),
  bountyAceStays: stationSrc.includes("id: 'bounty-ace'"),
};

const failed = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
console.log('wave80 faction-war pin-check:', JSON.stringify(pins));
if (failed.length) {
  console.log('WAVE80 WAR PIN-CHECK FAIL:', failed.join(','));
  process.exit(1);
}
console.log('WAVE80 WAR PIN-CHECK PASS');
