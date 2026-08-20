// Extra restore edges for WAVE 71 PR1 verifier. Does not edit src.
import { createShipState, SYSTEMS } from '../../../src/game/state.js';
import { restore } from '../../../src/game/save.js';

const results = {};
const sysKeys = Object.keys(SYSTEMS);
const nSys = sysKeys.length;
const cap = 4 + 2 * nSys + 16;

function pin(name, cond) {
  results[name] = !!cond;
}

function ctxBase(jobs) {
  return {
    flags: {},
    world: {
      currentSystem: 'freehold',
      credits: 350,
      fear: 0,
      time: 0,
      jobs,
    },
    systems: SYSTEMS,
    cargo: [],
    cargoCapacity: 20,
    bio: {
      hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0,
      speedFactor: 1, turnFactor: 1,
    },
    player: createShipState('light', { name: 'Wave71Edge' }),
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
    },
    {
      id: 'ferry-consignment', kind: 'ferry',
      title: 'Ferry a consignment',
      detail: 'A dockside factor fronts you Provisions and pays on delivery.',
      reward: 350, state: 'offered', progress: 0, need: 4,
    },
  ];
}

function miningJob(sysId, n, slot, extra = {}) {
  return {
    id: extra.id ?? `mine-${sysId}-${n}`,
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

function restoreWorld(world, liveJobs) {
  const ctx = ctxBase(liveJobs);
  restore(ctx, { v: 1, world });
  return ctx;
}

// 1) jobs omitted from snap — live stale must not survive (contract §1.2 missing → [])
const stale = [{
  id: 'bounty-ace', kind: 'bounty', target: 'Live',
  title: 'Live stale ace', detail: 'Should not survive omitted jobs key.',
  reward: 1, state: 'offered', progress: 0, need: 1,
}];
const omitCtx = restoreWorld({ currentSystem: 'freehold' }, stale);
pin('omit.jobsIsArray', Array.isArray(omitCtx.world.jobs));
pin('omit.jobsEmpty', omitCtx.world.jobs.length === 0);
pin('omit.staleDropped', !omitCtx.world.jobs.some((j) => j.title === 'Live stale ace'));

// 2) empty array stays empty
const emptyCtx = restoreWorld({ currentSystem: 'freehold', jobs: [] }, stale);
pin('empty.array', Array.isArray(emptyCtx.world.jobs) && emptyCtx.world.jobs.length === 0);

// 3) doubled hyphen
const dbl = uniqueFour();
dbl.push(miningJob('freehold', 0, 0, { id: 'mine-freehold--0' }));
const dblCtx = restoreWorld({ currentSystem: 'freehold', jobs: dbl }, []);
pin('doubleHyphen.dropped', !dblCtx.world.jobs.some((j) => j.id === 'mine-freehold--0'));
pin('doubleHyphen.uniqueKept', dblCtx.world.jobs.some((j) => j.id === 'bounty-ace'));

// 4) constructor token
const ctor = uniqueFour();
ctor.push(miningJob('freehold', 0, 0, { id: 'mine-constructor-0', originSystem: 'constructor' }));
ctor.push({
  id: 'bounty-constructor', kind: 'bounty', target: 'x',
  title: 'Ctor token', detail: 'Reserved constructor token.',
  reward: 1, need: 1, progress: 0, state: 'offered', system: 'freehold',
});
const ctorCtx = restoreWorld({ currentSystem: 'freehold', jobs: ctor }, []);
pin('ctor.mineDropped', !ctorCtx.world.jobs.some((j) => String(j.id).includes('constructor')));
pin('ctor.bountyDropped', !ctorCtx.world.jobs.some((j) => j.id === 'bounty-constructor'));

// 5) failed mining kept under cap
const failedKeep = uniqueFour();
failedKeep.push(miningJob('freehold', 0, 0, { state: 'failed' }));
const failedKeepCtx = restoreWorld({ currentSystem: 'freehold', jobs: failedKeep }, []);
pin('failed.keptUnderCap', failedKeepCtx.world.jobs.some((j) => j.id === 'mine-freehold-0' && j.state === 'failed'));

// 6) failed mining dropped on overflow (after extras)
const overflow = uniqueFour();
for (let s = 0; s < sysKeys.length; s++) {
  overflow.push(miningJob(sysKeys[s], 0, 0));
  overflow.push(miningJob(sysKeys[s], 1, 1));
}
for (let n = 300; n < 340; n++) overflow.push(miningJob('freehold', n, 0, { state: 'failed' }));
const failedOvCtx = restoreWorld({ currentSystem: 'freehold', jobs: overflow }, []);
pin('failed.overflowLen', failedOvCtx.world.jobs.length <= cap);
pin('failed.overflowDropped', !failedOvCtx.world.jobs.some((j) => j.id === 'mine-freehold-300'));
pin('failed.overflowHonest', failedOvCtx.world.jobs.some((j) => j.id === 'mine-freehold-0' && j.state === 'offered'));

// 7) asteroidId must not survive on kept mining
const ast = uniqueFour();
ast.push(miningJob('freehold', 0, 0, { rest: { asteroidId: 7, faction: 'veridian' } }));
const astCtx = restoreWorld({ currentSystem: 'freehold', jobs: ast }, []);
const keptMine = astCtx.world.jobs.find((j) => j.id === 'mine-freehold-0');
pin('asteroidId.dropped', !!keptMine && keptMine.asteroidId === undefined && keptMine.faction === undefined);

// 8) accepted mining never dropped on overflow
const acc = uniqueFour();
for (let s = 0; s < sysKeys.length; s++) {
  acc.push(miningJob(sysKeys[s], 0, 0, { state: 'accepted' }));
  acc.push(miningJob(sysKeys[s], 1, 1));
}
for (let n = 400; n < 430; n++) acc.push(miningJob('freehold', n, 0, { state: 'done' }));
const accCtx = restoreWorld({ currentSystem: 'freehold', jobs: acc }, []);
pin('accepted.kept', accCtx.world.jobs.some((j) => j.id === 'mine-freehold-0' && j.state === 'accepted'));
pin('accepted.overflowLen', accCtx.world.jobs.length <= cap);

// 9) origin mismatch
const mismatch = uniqueFour();
mismatch.push(miningJob('freehold', 0, 0, { originSystem: 'fh_hearth' }));
const mmCtx = restoreWorld({ currentSystem: 'freehold', jobs: mismatch }, []);
pin('originMismatch.dropped', !mmCtx.world.jobs.some((j) => j.id === 'mine-freehold-0'));

// 10) slot 2 illegal
const slot2 = uniqueFour();
slot2.push(miningJob('freehold', 0, 2));
const s2Ctx = restoreWorld({ currentSystem: 'freehold', jobs: slot2 }, []);
pin('slot2.dropped', !s2Ctx.world.jobs.some((j) => j.id === 'mine-freehold-0'));

// 11) leading hyphen
const lead = uniqueFour();
lead.push(miningJob('freehold', 0, 0, { id: '-mine-freehold-0' }));
const leadCtx = restoreWorld({ currentSystem: 'freehold', jobs: lead }, []);
pin('leadHyphen.dropped', !leadCtx.world.jobs.some((j) => j.id === '-mine-freehold-0'));

console.log(JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('EDGE FAIL', failed.join(','));
  process.exit(1);
}
console.log('EDGE PASS');
