import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEMS, createShipState } from '../../../src/game/state.js';
import { restore } from '../../../src/game/save.js';
import { RESTITUTION_UU, applyRestitution, offendedFaction } from '../../../src/game/restitution.js';
import {
  CHAIN_ROOM, CHAIN_IDS, parseChainId, makeChainJob, chainOriginSystem,
} from '../../../src/game/jobs-chains.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const saveSrc = readFileSync(join(root, 'src/game/save.js'), 'utf8');
const stSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const bootSrc = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');
const w80sPin = bootSrc.slice(bootSrc.indexOf('// ---- WAVE80: MSN-02 renewable espionage pins ----'), bootSrc.indexOf('// ---- WAVE80: MSN-02 renewable faction-war pins ----'));
const w80wPin = bootSrc.slice(bootSrc.indexOf('// ---- WAVE80: MSN-02 renewable faction-war pins ----'), bootSrc.indexOf('// ---- WAVE82: owner numbers + TGT lock cats ----'));

function stub(jobs, extraWorld = {}) {
  const c = {
    flags: { docked: true },
    world: { currentSystem: 'freehold', credits: 2000, fear: 0, time: 0, jobs: [], reputation: { freehold: -6, beautiful: 4 } },
    systems: SYSTEMS,
    cargo: [],
    cargoCapacity: 20,
    bio: { hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1 },
    player: createShipState('light', { name: 'W83Probe' }),
    ship: { object: null },
    emit() {},
    ships: [],
  };
  restore(c, { v: 1, world: { currentSystem: 'freehold', jobs, reputation: { freehold: -6, beautiful: 4 }, ...extraWorld } });
  c.flags.docked = true;
  return c;
}

const four = [
  { id: 'bounty-ace', kind: 'bounty', title: 'Bounty: Carver Illyx', detail: 'Ace.', reward: 2500, need: 1, progress: 0, state: 'offered', target: 'Carver Illyx' },
  { id: 'patrol-lane', kind: 'patrol', title: 'Patrol the lane', detail: 'Lane.', reward: 300, need: 2, progress: 0, state: 'offered' },
  { id: 'haul-provisions', kind: 'haul', title: 'Haul provisions', detail: 'Haul.', reward: 0, need: 5, progress: 0, state: 'offered' },
  { id: 'ferry-consignment', kind: 'ferry', title: 'Ferry a consignment', detail: 'Ferry.', reward: 350, need: 4, progress: 0, state: 'offered' },
];
const mine = {
  id: 'mine-freehold-0', kind: 'mining', slot: 0, originSystem: 'freehold', commodity: 'rawOre',
  title: 'Mine raw ore', detail: 'Cut reachable rock and deliver the ore at the posting dock.',
  reward: 0, need: 4, progress: 0, state: 'offered',
};
const spy = {
  id: 'spy-freehold-0', kind: 'espionage', slot: 0, originSystem: 'freehold', destSystem: 'veridian',
  title: 'Spy at the far dock', detail: 'Gather at the far dock. File at the home dock.',
  reward: 420, need: 1, progress: 0, state: 'offered', deadline: 600,
};
const war = {
  id: 'war-freehold-0', kind: 'war', slot: 0, originSystem: 'freehold', destSystem: 'veridian',
  recordId: 'rec-1', target: 'Wave83 Watch', title: 'Strike the marked patrol',
  detail: 'The posting dock pays on a witnessed kill.', reward: 300, need: 1, progress: 0,
  state: 'offered', deadline: 600,
};
const chain = makeChainJob('freehold', 1);
const proto = {
  id: 'chain-__proto__-1', kind: 'chain', originSystem: 'freehold',
  title: 'Proto', detail: 'Drop.', reward: 0, need: 1, progress: 0, state: 'offered',
};
const stuffed = {
  ...makeChainJob('redledger', 1),
  faction: 'veridian', launcher: 'dart', sku: 'dart', asteroidId: 3, slot: 0,
};
const keep = stub([...four, mine, spy, war, chain, proto, stuffed]);
const ids = keep.world.jobs.map((j) => j.id);
const keptRl = keep.world.jobs.find((j) => j.id === 'chain-redledger-1');

keep.flags.docked = true;
keep.world.currentSystem = 'freehold';
keep.world.credits = 2000;
keep.world.reputation = { freehold: -6, beautiful: 4 };
const paid = applyRestitution(keep, 'freehold');
const paidCredits = keep.world.credits;
const paidStanding = keep.world.reputation.freehold;
keep.world.credits = 100;
keep.world.reputation.freehold = -4;
const short = applyRestitution(keep, 'freehold');

const checks = {
  restUu: RESTITUTION_UU === 1200,
  restPaid: paid.ok === true && paidCredits === 800,
  restSetZero: paidStanding === 0,
  restShort: short.ok === false && short.reason === 'short',
  offended: offendedFaction('freehold') === 'freehold',
  spyConst: stSrc.includes('SPY_EXPOSE_DELTA = -2'),
  warConst: stSrc.includes('WAR_TARGET_DELTA = -2'),
  chainRoom: CHAIN_ROOM === 7 && saveSrc.includes('CHAIN_ROOM = 7') && saveSrc.includes('+ CHAIN_ROOM'),
  chainKind: saveSrc.includes("'chain'"),
  keepFour: ids.includes('bounty-ace') && ids.includes('patrol-lane')
    && ids.includes('haul-provisions') && ids.includes('ferry-consignment'),
  keepFamilies: ids.includes('mine-freehold-0') && ids.includes('spy-freehold-0')
    && ids.includes('war-freehold-0') && ids.includes('chain-freehold-1'),
  dropProto: !ids.includes('chain-__proto__-1') && !CHAIN_IDS.has('chain-__proto__-1'),
  stuffedDrop: !!(keptRl && !Object.hasOwn(keptRl, 'faction') && !Object.hasOwn(keptRl, 'launcher')
    && !Object.hasOwn(keptRl, 'sku') && !Object.hasOwn(keptRl, 'asteroidId') && !Object.hasOwn(keptRl, 'slot')),
  parse: parseChainId('chain-freehold-1')?.step === 1 && chainOriginSystem('redledger') === 'redmarch',
  noInnerHtml: !/innerHTML/.test(stSrc),
  noJobFaction: !/job\.faction/.test(stSrc),
  no2n: !saveSrc.includes('2*N') && !saveSrc.includes('2 * N'),
  w80sExpireSplit: w80sPin.includes('expireDestMinus2')
    && w80sPin.includes('destExp80s - 2')
    && w80sPin.includes('offeredWithdrawQuiet')
    && !w80sPin.includes('expireNoTarget80s'),
  w80sSuccessStillZero: w80sPin.includes('targetZero: targetZero80s'),
  w80wDestMinus2: w80wPin.includes('destMinus2: destMinus280w')
    && w80wPin.includes('destRepBefore80w - 2')
    && !w80wPin.includes('targetZero: targetZero80w'),
  w80wExpireQuiet: w80wPin.includes('expireNoTarget80w')
    && w80wPin.includes('expireNoPay: !!expired80w && expireNoPay80w && expireNotDone80w && expireNoTarget80w'),
};

console.log('w83 probe:', JSON.stringify(checks));
const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('W83 PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('W83 PROBE PASS');
