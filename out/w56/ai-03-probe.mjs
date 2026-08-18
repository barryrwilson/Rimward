// Wave 56 AI-03/AI-04 pins. Reads npc.js helpers + source. Does not start Vite.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const npcPath = resolve(here, '../../src/systems/npc.js');
const src = readFileSync(npcPath, 'utf8');

function vec(x, y, z) {
  return {
    x, y, z,
    distanceTo(o) {
      return Math.hypot(x - o.x, y - o.y, z - o.z);
    },
  };
}

const {
  standingOf,
  isScratched,
  mayHuntPlayer,
  hunterHasWork,
  findHunterOf,
  findPirateWork,
  setTarget,
  playerInterestChance,
  traderHitPanic,
  tickTraderJob,
} = await import('../../src/systems/npc.js');

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
      role, mode: role === 'pirate' ? 'hunt' : role === 'ace' ? 'duel' : role === 'trader' ? 'route' : 'loiter',
      target: extra.target ?? null,
      intent: extra.intent ?? false,
      scratched: false,
      fleeFrom: null,
      phase: null,
    },
    object: { position: extra.pos ?? vec(0, 0, 0) },
  };
}

const checks = {};

// standingOf: missing / NaN / finite
const liveFree = hull('patrol', 'freehold');
checks.standingMissingTable = standingOf({ world: {} }, liveFree) === 0;
checks.standingMissingFaction = standingOf({ world: { reputation: { freehold: 12 } } }, hull('patrol', undefined)) === 0;
checks.standingNaN = standingOf({ world: { reputation: { freehold: Number.NaN } } }, liveFree) === 0;
checks.standingFinite = standingOf({ world: { reputation: { freehold: -12 } } }, liveFree) === -12;

// mayHuntPlayer
const trader = hull('trader', 'freehold');
const patrol = hull('patrol', 'freehold');
const pirate = hull('pirate', 'redledger');
const ctx0 = { world: { reputation: { freehold: 0, redledger: 0 } } };
checks.traderNever = mayHuntPlayer(ctx0, trader) === false;
checks.patrolNeutral = mayHuntPlayer(ctx0, patrol) === false;
const ctxHot = { world: { reputation: { freehold: -10 } } };
checks.patrolHostileStanding = mayHuntPlayer(ctxHot, patrol) === true;
patrol.state.screen = 49;
checks.patrolScratch = mayHuntPlayer(ctx0, patrol) === true && isScratched(patrol) === true;
checks.pirateEligible = mayHuntPlayer(ctx0, pirate) === true;

// setTarget trader hard stop
const tAi = { role: 'trader', target: null, phase: null, intent: false };
setTarget(tAi, 'player');
checks.traderSetTargetBlocked = tAi.target === null;
setTarget(tAi, pirate);
checks.traderSetTargetShipOk = tAi.target === pirate;
const pAi = { role: 'pirate', target: null, phase: null, intent: false };
setTarget(pAi, 'player');
checks.pirateSetTargetPlayer = pAi.target === 'player';

// flee-when-hunted / patrol work
const station = vec(0, 0, 0);
const victim = hull('trader', 'freehold', { pos: vec(500, 0, 0) });
const hunter = hull('pirate', 'redledger', {
  pos: vec(520, 0, 0),
  target: victim,
  intent: false,
});
hunter.ai.mode = 'hunt';
const idlePirate = hull('pirate', 'redledger', { pos: vec(530, 0, 0) });
idlePirate.ai.mode = 'hunt';
const ace = hull('ace', 'redledger', { pos: vec(540, 0, 0), target: 'player', intent: true });
ace.ai.mode = 'duel';
const cop = hull('patrol', 'freehold', { pos: vec(510, 0, 0) });
const ships = [victim, hunter, idlePirate, ace, cop];
const ctxShips = {
  ships,
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 } },
};
checks.hunterOfTrader = findHunterOf(ctxShips, victim) === hunter;
checks.idlePirateNoWork = hunterHasWork(idlePirate, station) === false;
checks.hunterTraderWork = hunterHasWork(hunter, station) === true;
checks.acePlayerWork = hunterHasWork(ace, station) === true;
const work = findPirateWork(ctxShips, cop);
checks.patrolPicksNearestWork = work === hunter;

// Scratch flee is short: hull stay-low after recharge + old lastHitAt → route
const grazed = hull('trader', 'freehold', {
  pos: vec(500, 0, 0),
  state: { hull: 70, hullMax: 100, screen: 50, screenMax: 50, lastHitAt: 1 },
});
grazed.ai.mode = 'flee';
grazed.ai.fleeFrom = 'player';
grazed.ai.scratched = true;
const ctxGraze = {
  ships: [grazed],
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 }, time: 20 },
};
checks.hullScratchNoPanic = traderHitPanic(grazed.state, 20) === false;
tickTraderJob(ctxGraze, grazed);
checks.scratchThenRoute = grazed.ai.mode === 'route' && grazed.ai.fleeFrom === null;

grazed.state.screen = 40;
checks.screenDownPanic = traderHitPanic(grazed.state, 20) === true;
tickTraderJob(ctxGraze, grazed);
checks.screenDownFlee = grazed.ai.mode === 'flee';

grazed.state.screen = 50;
grazed.state.lastHitAt = 18;
grazed.ai.mode = 'route';
checks.recentHitPanic = traderHitPanic(grazed.state, 20) === true;
tickTraderJob(ctxGraze, grazed);
checks.recentHitFlee = grazed.ai.mode === 'flee';

const stillHunted = hull('trader', 'freehold', {
  pos: vec(500, 0, 0),
  state: { hull: 70, hullMax: 100, screen: 50, screenMax: 50, lastHitAt: 0 },
});
stillHunted.ai.mode = 'route';
const stillHunter = hull('pirate', 'redledger', {
  pos: vec(520, 0, 0),
  target: stillHunted,
});
stillHunter.ai.mode = 'hunt';
const ctxHunt = {
  ships: [stillHunted, stillHunter],
  config: { world: { stationPosition: station } },
  world: { reputation: { freehold: 0 }, time: 40 },
};
checks.huntedNoPanicAlone = traderHitPanic(stillHunted.state, 40) === false;
tickTraderJob(ctxHunt, stillHunted);
checks.huntedStaysFlee = stillHunted.ai.mode === 'flee' && stillHunted.ai.fleeFrom === stillHunter;

// INTEREST / authored paths still in source
checks.interestBase = /base:\s*0\.25/.test(src);
checks.interestMin = /min:\s*0\.05/.test(src);
checks.interestMax = /max:\s*0\.9/.test(src);
checks.lawZone = /LAW_ZONE_RADIUS\s*=\s*300/.test(src);
checks.demandPirateOnly = /ai\.target === 'player' &&\s*\n\s*ai\.role === 'pirate'/.test(src);
checks.collectorBypass = /alwaysHuntsPlayer === true/.test(src);
checks.avoidBias = /function applyAvoidBias/.test(src);
checks.bounceLive = /function bounceLive/.test(src);
checks.qshipRevealHunt = /revealQship\(ctx, live\)/.test(src);
checks.npcFirePlayerOnly = /if \(ai\.target === 'player'\) ctx\.emit\('npcFire'/.test(src);
checks.playerInterestChanceExport = typeof playerInterestChance === 'function';

const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
const pass = failed.length === 0;
console.log(JSON.stringify({ pass, failed, checks }, null, 2));
process.exit(pass ? 0 : 1);
