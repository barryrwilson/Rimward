// Extra verifier pins for AI-03. Does not import three.js beyond npc helpers.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const npcPath = resolve(here, '../../src/systems/npc.js');
const combatPath = resolve(here, '../../src/systems/combat.js');
const npcSrc = readFileSync(npcPath, 'utf8');
const combatSrc = readFileSync(combatPath, 'utf8');

const {
  standingOf,
  isScratched,
  mayHuntPlayer,
  hunterHasWork,
  findHunterOf,
  findPirateWork,
  setTarget,
  playerInterestChance,
} = await import('../../src/systems/npc.js');

function vec(x, y, z) {
  return {
    x, y, z,
    distanceTo(o) {
      return Math.hypot(x - o.x, y - o.y, z - o.z);
    },
  };
}

function hull(role, faction, extra = {}) {
  return {
    role,
    record: { role, faction, ...extra.record },
    state: {
      hull: 100, hullMax: 100, screen: 50, screenMax: 50,
      destroyed: false, disabled: false, surrendered: false,
      ...extra.state,
    },
    ai: {
      role,
      mode: extra.mode ?? (role === 'pirate' ? 'hunt' : role === 'ace' ? 'duel' : role === 'trader' ? 'route' : 'loiter'),
      target: extra.target ?? null,
      intent: extra.intent ?? false,
      scratched: extra.scratched ?? false,
      fleeFrom: extra.fleeFrom ?? null,
      phase: extra.phase ?? null,
    },
    object: { position: extra.pos ?? vec(0, 0, 0) },
  };
}

// Local copy of job gates (not exported) so we can pin stay/return without src edits.
function tickTraderJob(ctx, live) {
  const ai = live.ai;
  const st = live.state;
  if (!ai || !st || st.surrendered || ai.mode === 'drift') return;
  const hunter = findHunterOf(ctx, live);
  const hurt = isScratched(live);
  if (hurt || hunter) {
    if (ai.mode !== 'flee') {
      ai.mode = 'flee';
      ai.phase = null;
      ai.intent = false;
    }
    ai.fleeFrom = hunter || 'player';
    return;
  }
  if (ai.mode === 'flee') {
    ai.mode = 'route';
    ai.fleeFrom = null;
    ai.target = null;
    ai.phase = null;
    ai.intent = false;
  }
}

function tickPatrolJob(ctx, live) {
  const ai = live.ai;
  const st = live.state;
  if (!ai || !st || st.surrendered || ai.mode === 'drift' || ai.mode === 'flee') return;
  if (mayHuntPlayer(ctx, live) || findPirateWork(ctx, live)) {
    if (ai.mode !== 'hunt') ai.mode = 'hunt';
    return;
  }
  if (ai.mode === 'hunt') {
    ai.mode = 'loiter';
    ai.target = null;
    ai.phase = null;
    ai.intent = false;
  }
}

const checks = {};
const notes = [];

// INTEREST full table still as wave-32
checks.interestBase = /base:\s*0\.25/.test(npcSrc);
checks.interestTemper = /temperSpan:\s*0\.35/.test(npcSrc);
checks.interestCargo = /cargoSpan:\s*0\.3/.test(npcSrc);
checks.interestCargoNorm = /cargoNormUU:\s*800/.test(npcSrc);
checks.interestFear = /fearRepel:\s*0\.004/.test(npcSrc);
checks.interestMin = /min:\s*0\.05/.test(npcSrc);
checks.interestMax = /max:\s*0\.9/.test(npcSrc);

// authored paths
checks.alwaysHunts = /alwaysHuntsPlayer === true/.test(npcSrc);
checks.collectorStamp = /record\.name === ORIGIN_ARCS\.ledgerDebt\.collector\.name/.test(npcSrc);
checks.demandPirateOnly = /ai\.target === 'player' &&\s*\n\s*ai\.role === 'pirate'/.test(npcSrc);
checks.jumpGrace = /jumpGraceUntil/.test(npcSrc);
checks.lawZone = /LAW_ZONE_RADIUS\s*=\s*300/.test(npcSrc);
checks.hostileStanding = /HOSTILE_STANDING\s*=\s*-10/.test(npcSrc);
checks.avoidBias = /function applyAvoidBias/.test(npcSrc);
checks.bounceLive = /function bounceLive/.test(npcSrc);
checks.steerLiveAvoid = /_phyOn \? applyAvoidBias/.test(npcSrc);
checks.bounceInUpdate = /if \(_phyOn\) bounceLive/.test(npcSrc);
checks.npcFireHuntGuard = /if \(ai\.target === 'player'\) ctx\.emit\('npcFire'/.test(npcSrc);
checks.npcFireDuelUnguarded = /if \(now >= ai\.fireAt && dist < WEAPONS\.cannon\.range && facingDot\(live\.object, playerPos\) > FIRE_FACE_DOT\) \{\s*\n\s*ai\.fireAt = now \+ interval;\s*\n\s*ctx\.emit\('npcFire'/.test(npcSrc);
checks.combatAimsPlayer = /spawnNpcShot\(ship, e\.weapon, playerObj\)/.test(combatSrc);
checks.patrolSkipsInterest = /Patrols never roll interest/.test(npcSrc);
checks.jobNoFilterMap = !/findPirateWork[\s\S]{0,400}(\.filter\(|\.map\()/.test(npcSrc);
checks.scanUsesIndex = /for \(let i = 0; i < ships\.length; i\+\+\)/.test(npcSrc);

// standing edges
const patrol = hull('patrol', 'freehold');
checks.standingMissing = standingOf({ world: {} }, patrol) === 0;
checks.standingNaN = standingOf({ world: { reputation: { freehold: Number.NaN } } }, patrol) === 0;
checks.standingInf = standingOf({ world: { reputation: { freehold: Infinity } } }, patrol) === 0;
checks.standingNeg9 = standingOf({ world: { reputation: { freehold: -9 } } }, patrol) === -9;
checks.patrolNeg9NoHunt = mayHuntPlayer({ world: { reputation: { freehold: -9 } } }, patrol) === false;
checks.patrolNeg10Hunt = mayHuntPlayer({ world: { reputation: { freehold: -10 } } }, patrol) === true;
checks.patrolNeg11Hunt = mayHuntPlayer({ world: { reputation: { freehold: -11 } } }, patrol) === true;

// trader never hunts
const trader = hull('trader', 'freehold');
checks.traderMayHunt = mayHuntPlayer({ world: { reputation: { freehold: -99 } } }, trader) === false;
const tAi = { role: 'trader', target: null, phase: 'attack', intent: true };
setTarget(tAi, 'player');
checks.traderSetPlayerNoop = tAi.target === null && tAi.phase === 'attack' && tAi.intent === true;
setTarget(tAi, { id: 'ship' });
checks.traderSetShipOk = tAi.target && tAi.target.id === 'ship';

// collector / ace not blocked
const collectorAi = { role: 'pirate', target: null, phase: null, intent: false };
setTarget(collectorAi, 'player');
checks.collectorSetPlayer = collectorAi.target === 'player';
const aceAi = { role: 'ace', target: null, phase: null, intent: false };
setTarget(aceAi, 'player');
checks.aceSetPlayer = aceAi.target === 'player';
checks.duelWritesPlayer = /ai\.target = 'player';/.test(npcSrc);
checks.collectorChance = playerInterestChance(
  { cargo: [], world: { fear: 0, prices: {} } },
  { alwaysHuntsPlayer: true },
) === 1;

// trader flee: hunter only then return
const station = vec(0, 0, 0);
const victim = hull('trader', 'freehold', { pos: vec(500, 0, 0), mode: 'route' });
const hunter = hull('pirate', 'redledger', {
  pos: vec(520, 0, 0),
  target: null,
  mode: 'hunt',
});
hunter.ai.target = victim;
const ctxH = {
  ships: [victim, hunter],
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 } },
};
tickTraderJob(ctxH, victim);
checks.traderFleesHunter = victim.ai.mode === 'flee' && victim.ai.fleeFrom === hunter;
hunter.ai.target = null;
tickTraderJob(ctxH, victim);
checks.traderReturnsAfterHunter = victim.ai.mode === 'route' && victim.ai.fleeFrom === null;

// trader flee: scratch latches, never returns (even after screen would heal)
const victim2 = hull('trader', 'freehold', { pos: vec(400, 0, 0), mode: 'route', state: { screen: 49 } });
const ctx2 = {
  ships: [victim2],
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 } },
};
tickTraderJob(ctx2, victim2);
checks.traderFleesScratch = victim2.ai.mode === 'flee' && victim2.ai.fleeFrom === 'player' && victim2.ai.scratched === true;
victim2.state.screen = 50;
tickTraderJob(ctx2, victim2);
checks.traderStuckFleeAfterScratch = victim2.ai.mode === 'flee';
notes.push('trader scratch latches isScratched; tickTraderJob never returns to route for that instance');

// patrol: scratch keeps hunt; no work + no hunt legal → loiter
const cop = hull('patrol', 'freehold', { pos: vec(510, 0, 0), mode: 'loiter' });
const ctxP = {
  ships: [cop],
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 } },
};
tickPatrolJob(ctxP, cop);
checks.neutralPatrolStaysLoiter = cop.ai.mode === 'loiter';
cop.state.screen = 40;
tickPatrolJob(ctxP, cop);
checks.scratchedPatrolEntersHunt = cop.ai.mode === 'hunt';
tickPatrolJob(ctxP, cop);
checks.scratchedPatrolStaysHunt = cop.ai.mode === 'hunt';
notes.push('scratched patrol stays in hunt mode for the instance; updateHunt loiters when player is not a legal target');

// patrol intercepts hunter, then drops when hunter flees
const cop2 = hull('patrol', 'freehold', { pos: vec(500, 0, 0), mode: 'loiter' });
const prey = hull('trader', 'freehold', { pos: vec(505, 0, 0) });
const pir = hull('pirate', 'redledger', { pos: vec(508, 0, 0), mode: 'hunt', target: prey });
pir.ai.target = prey;
const ctxI = {
  ships: [cop2, prey, pir],
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 } },
};
tickPatrolJob(ctxI, cop2);
checks.patrolIntercepts = cop2.ai.mode === 'hunt' && findPirateWork(ctxI, cop2) === pir;
pir.ai.mode = 'flee';
tickPatrolJob(ctxI, cop2);
checks.patrolDropsWhenPirateFlees = cop2.ai.mode === 'loiter';

// pirate eligible, patrol not on interest
const pirate = hull('pirate', 'redledger');
checks.pirateEligible = mayHuntPlayer({ world: { reputation: { redledger: 0 } } }, pirate) === true;
checks.playerInterestedInNotOnPatrol = !/role === 'patrol'[\s\S]{0,200}playerInterestedIn/.test(npcSrc);

const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
const pass = failed.length === 0;
console.log(JSON.stringify({ pass, failed, checks, notes }, null, 2));
process.exit(pass ? 0 : 1);
