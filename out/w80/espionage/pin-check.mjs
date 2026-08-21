import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createShipState, SYSTEMS, FACTIONS } from '../../../src/game/state.js';
import { WORLD_FIELDS, restore } from '../../../src/game/save.js';

const here = process.cwd();
const src = (rel) => readFileSync(join(here, rel), 'utf8');
const saveSrc = src('src/game/save.js');
const stationSrc = src('src/systems/station.js');
const nSys = Object.keys(SYSTEMS).length;
const liveCap = 4 + 10 * nSys + 16;
const spyRoom = 2 * nSys;
const cap = liveCap + spyRoom;
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

const job = (id, kind, extra = {}) => ({
  id, kind,
  title: extra.title ?? id,
  detail: extra.detail ?? 'Wave 80 spy pin row.',
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
const four = () => [
  job('bounty-ace', 'bounty', { title: 'Bounty: Carver Illyx', target: 'Carver Illyx', reward: 2500 }),
  job('patrol-lane', 'patrol', { title: 'Patrol the lane', reward: 300, need: 2 }),
  job('haul-provisions', 'haul', { title: 'Haul provisions', reward: 0, need: 5, rest: { originSystem: null, originPrice: 0 } }),
  job('ferry-consignment', 'ferry', { title: 'Ferry a consignment', reward: 350, need: 4 }),
];

function stub(jobs) {
  const c = {
    flags: {},
    world: { currentSystem: 'freehold', credits: 350, fear: 0, time: 0, jobs: [{ id: 'stale' }] },
    systems: SYSTEMS,
    cargo: [],
    cargoCapacity: 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: createShipState('light', { name: 'Wave80SpyPin' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
  restore(c, { v: 1, world: { currentSystem: 'freehold', jobs } });
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
  spy('__proto__', 0, 0, { originSystem: '__proto__' }),
  job('__proto__', 'bounty', { title: 'Proto', target: 'x' }),
  spy('freehold', 9, 0, { need: 2 }),
  spy('notasystem', 0, 0, { originSystem: 'notasystem' }),
  {
    id: 'espionage-freehold-0', kind: 'espionage', slot: 0, originSystem: 'freehold',
    destSystem: rivalDest('freehold', 0) ?? 'veridian', title: 'Wrong prefix', detail: 'Kind prefix mismatch.',
    reward: 420, need: 1, progress: 0, state: 'offered', deadline: 600,
  },
  {
    id: 'spy-freehold', kind: 'espionage', slot: 0, originSystem: 'freehold',
    destSystem: rivalDest('freehold', 0) ?? 'veridian', title: 'Short', detail: 'Two tokens only.',
    reward: 420, need: 1, progress: 0, state: 'offered', deadline: 600,
  },
  spy('freehold', 8, 1, { destSystem: 'freehold' }),
  spy('freehold', 7, 1, { rest: { commodity: 'dataCrystal', faction: 'redledger', payQuoted: 999999 } }),
  spy('fh_hearth', 1, 1),
]);
const keepIds = keep.world.jobs.map((j) => j.id);
const keepSpy7 = keep.world.jobs.find((j) => j.id === 'spy-freehold-7');

const honest = four();
let expectedSpy = 0;
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
}
const honestCtx = stub(honest);

const flood = four().concat(
  mine('freehold', 0, 0), trade('freehold', 0, 0), hunt('freehold', 0, 0),
  pass('freehold', 0, 0), explore('freehold', 0, 0), spy('freehold', 0, 0),
);
for (let i = 0; i < 10000; i++) flood.push({ id: `junks-${i}`, kind: 'espionage' });
const floodCtx = stub(flood);

const stuffed = stub([
  ...four(),
  spy('freehold', 0, 0, {
    destSystem: 'redmarch', state: 'accepted', payQuoted: 80, deadline: 1e9, progress: 1,
    rest: { faction: 'veridian', asteroidId: 3, recordId: 'rec-9' },
  }),
]);
const stuffedJob = stuffed.world.jobs.find((j) => j.id === 'spy-freehold-0');

const pins = {
  uniqueFour: unique.every((id) => keepIds.includes(id)),
  keepMineFh: keepIds.includes('mine-freehold-0'),
  keepTradeFh: keepIds.includes('trade-freehold-0'),
  keepHuntFh: keepIds.includes('hunt-freehold-0'),
  keepPassengerFh: keepIds.includes('passenger-freehold-0'),
  keepExploreFh: keepIds.includes('explore-freehold-0'),
  keepSpyFh: keepIds.includes('spy-freehold-0'),
  keepSpyHearth: keepIds.includes('spy-fh_hearth-1'),
  dropProto: !keepIds.includes('__proto__') && !keepIds.includes('spy-__proto__-0'),
  dropShortId: !keepIds.includes('spy-freehold'),
  dropWrongPrefix: !keepIds.includes('espionage-freehold-0'),
  dropNeed2: !keep.world.jobs.some((j) => j.kind === 'espionage' && j.need === 2),
  dropBadSys: !keepIds.includes('spy-notasystem-0'),
  dropSameDest: !keepIds.includes('spy-freehold-8'),
  dropCommodityAndFaction: keepSpy7 && !Object.hasOwn(keepSpy7, 'commodity') && !Object.hasOwn(keepSpy7, 'faction')
    && keepSpy7.payQuoted === 20000,
  capFormula: saveSrc.includes('ESPIONAGE_SLOTS_PER_SYSTEM')
    && cap === 4 + 12 * nSys + 16
    && /ESPIONAGE_SLOTS_PER_SYSTEM \* N_SYSTEMS/.test(saveSrc)
    && saveSrc.includes('plus espionage room only')
    && !/WAR_ROOM/.test(saveSrc),
  capFits: honestCtx.world.jobs.length === 4 + 10 * nSys + expectedSpy
    && honestCtx.world.jobs.length <= cap
    && expectedSpy <= spyRoom,
  floodHeal: floodCtx.world.jobs.length <= cap
    && unique.every((id) => floodCtx.world.jobs.some((j) => j.id === id))
    && floodCtx.world.jobs.some((j) => j.id === 'spy-freehold-0')
    && floodCtx.world.jobs.some((j) => j.id === 'explore-freehold-0')
    && floodCtx.world.jobs.some((j) => j.id === 'mine-freehold-0'),
  fieldsJobs: WORLD_FIELDS.includes('jobs') && WORLD_FIELDS.filter((k) => k === 'jobs').length === 1
    && !WORLD_FIELDS.includes('missions') && !WORLD_FIELDS.includes('spies'),
  stuffedDestKept: stuffedJob && stuffedJob.destSystem === 'redmarch' && stuffedJob.payQuoted === 80,
  stuffedFieldsDropped: stuffed.world.jobs.every((j) => !Object.hasOwn(j, 'faction')
    && !Object.hasOwn(j, 'asteroidId') && !Object.hasOwn(j, 'recordId')),
  kindAllow: saveSrc.includes("'espionage'") && stationSrc.includes("kind: 'espionage'"),
  idPrefix: stationSrc.includes('spy-${sysId}-'),
  saveIdPrefix: saveSrc.includes("tokens[0] !== 'spy'"),
  helpers: stationSrc.includes('function resolveEspionageDest')
    && stationSrc.includes('function makeEspionageJob')
    && stationSrc.includes('function syncEspionageJobs')
    && stationSrc.includes('function replaceEspionageJob'),
  boardHide: stationSrc.includes("j.kind === 'espionage' && j.state === 'offered' && j.originSystem !== sysId"),
  originAccept: /job\.kind === 'espionage'[\s\S]*?currentSystem !== job\.originSystem/.test(stationSrc),
  destRebind: stationSrc.includes('resolveEspionageDest(ctx, origin, slot)')
    && stationSrc.includes('job.destSystem = dest'),
  noInnerHtml: !/innerHTML/.test(stationSrc),
  noFullSafeId: !/SAFE_ID\.test\(\s*job\.id/.test(saveSrc) && !/SAFE_ID\.test\(\s*job\.id/.test(stationSrc),
  uniqueHaul: stationSrc.includes("id: 'haul-provisions'") && stationSrc.includes("id: 'ferry-consignment'"),
  haulDestBind: /job\.kind === 'haul'[\s\S]*?const dest = otherSystemId\(ctx, origin\)/.test(stationSrc),
  noDataGrant: /if \(job\.kind === 'espionage'\)[\s\S]{0,6000}replaceEspionageJob/.test(stationSrc)
    && !/if \(job\.kind === 'espionage'\)[\s\S]{0,6000}dataCrystal/.test(stationSrc),
  targetSkip: /if \(job\.kind === 'espionage'\)[\s\S]{0,6000}Object\.hasOwn\(FACTIONS, employer\)/.test(stationSrc)
    && !/if \(job\.kind === 'espionage'\)[\s\S]{0,6000}reputation\[targetFac\]/.test(stationSrc),
  digit2: stationSrc.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs'"),
  acceptedNamesHome: stationSrc.includes('then file at ${homeName}')
    && stationSrc.includes('intel aboard — file at ${homeName}')
    && stationSrc.includes('File intel from ${destName} at ${homeName}'),
  acceptedNoFileHere: !/then file here/.test(stationSrc) && !/intel aboard — file here/.test(stationSrc),
  acceptedPayFallback: /Number\.isFinite\(job\.payQuoted\) \? clampJobPay\(job\.payQuoted\) : jobPayFor\(ctx, originId, explorePayBase\(\)\)/.test(stationSrc),
};

const failed = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
console.log('wave80 espionage pin-check:', JSON.stringify(pins));
if (failed.length) {
  console.log('WAVE80 ESPIONAGE PIN-CHECK FAIL:', failed.join(','));
  process.exit(1);
}
console.log('WAVE80 ESPIONAGE PIN-CHECK PASS');
