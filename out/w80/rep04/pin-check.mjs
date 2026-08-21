import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyPlayerKillStanding, KILL_STANDING_DELTA as w80KillDelta } from '../../../src/game/kill-standing.js';
import { RANK_LADDER as w80Ladder, RESCUE as w80Rescue, SYSTEMS } from '../../../src/game/state.js';
import { WORLD_FIELDS as w80Fields, sanitizeReputation as w80SanitizeRep, restore as w80Restore } from '../../../src/game/save.js';
import { TRAFFIC_LIST_UU as w80ListUu } from '../../../src/game/trafficking.js';
import { DOCK_KEY_SERVICES as w80Keys, standingMoveNotes as w80MoveNotes } from '../../../src/systems/station.js';

const here80 = process.cwd();
const src80 = (rel) => readFileSync(join(here80, rel), 'utf8');
const npc80 = src80('src/systems/npc.js');
const combat80 = src80('src/systems/combat.js');
const station80 = src80('src/systems/station.js');
const state80 = src80('src/game/state.js');
const save80 = src80('src/game/save.js');
const helper80 = src80('src/game/kill-standing.js');
const ctx80src = src80('src/core/ctx.js');

function withProto80(base) {
  const bag = { ...base };
  Object.defineProperty(bag, '__proto__', { value: 99, enumerable: true, configurable: true });
  return bag;
}
function bagSnap80(bag) {
  if (!bag || typeof bag !== 'object') return '';
  return Object.keys(bag).sort().map((k) => `${k}:${String(bag[k])}`).join('|');
}
function stub80() {
  return {
    events: [],
    world: {
      time: 0,
      credits: 10,
      fear: 0,
      reputation: { freehold: 5, redledger: 3, veridian: 1, hollow: 0 },
      currentSystem: 'freehold',
    },
    emit(type, payload) {
      this.events.push({ type, ...(payload && typeof payload === 'object' ? payload : {}) });
    },
  };
}
function hull80(extra = {}) {
  const role = extra.role ?? 'trader';
  const faction = extra.faction ?? 'freehold';
  const lastAttacker = extra.lastAttacker ?? 'player';
  const classKey = extra.classKey ?? 'freighter';
  return {
    record: { role, faction, classKey },
    state: { destroyed: extra.destroyed !== false, faction, classKey, surrendered: extra.surrendered === true },
    role,
    classKey,
    ai: { lastAttacker, role, deathHandled: true },
  };
}

const helperCtx = stub80();
const startSnap = bagSnap80(helperCtx.world.reputation);
const traderPlayer = applyPlayerKillStanding(helperCtx, hull80({
  role: 'trader', faction: 'freehold', lastAttacker: 'player',
}));
const traderBag = bagSnap80(helperCtx.world.reputation) === startSnap
  && helperCtx.world.reputation.freehold === 5;
const traderNoComm = !helperCtx.events.some((e) => e.type === 'commLine' || e.type === 'reputationChanged');
const traderNoDelta = traderPlayer && traderPlayer.ok === false && traderPlayer.reason === 'no-delta';

const npcVsNpcCtx = stub80();
const npcSnap = bagSnap80(npcVsNpcCtx.world.reputation);
applyPlayerKillStanding(npcVsNpcCtx, hull80({ role: 'trader', faction: 'veridian', lastAttacker: 'npc' }));
applyPlayerKillStanding(npcVsNpcCtx, hull80({
  role: 'trader', faction: 'veridian', lastAttacker: { state: { destroyed: false } },
}));
applyPlayerKillStanding(npcVsNpcCtx, hull80({ role: 'trader', faction: 'veridian', lastAttacker: null }));
const npcVsNpcNoWrite = bagSnap80(npcVsNpcCtx.world.reputation) === npcSnap;

const pirateCtx = stub80();
const pirateSnap = bagSnap80(pirateCtx.world.reputation);
applyPlayerKillStanding(pirateCtx, hull80({ role: 'pirate', faction: 'freehold', lastAttacker: 'player' }));
applyPlayerKillStanding(pirateCtx, hull80({
  role: 'ace', faction: 'redledger', lastAttacker: 'player', classKey: 'ace',
}));
const pirateNoWrite = bagSnap80(pirateCtx.world.reputation) === pirateSnap;

const protoCtx = stub80();
applyPlayerKillStanding(protoCtx, hull80({ role: 'trader', faction: '__proto__', lastAttacker: 'player' }));
applyPlayerKillStanding(protoCtx, hull80({ role: 'trader', faction: 'constructor', lastAttacker: 'player' }));
applyPlayerKillStanding(protoCtx, hull80({ role: 'trader', faction: 'prototype', lastAttacker: 'player' }));
applyPlayerKillStanding(protoCtx, hull80({ role: 'trader', faction: 'independent', lastAttacker: 'player' }));
const protoBag = protoCtx.world.reputation;
const protoNeverKey = !Object.hasOwn(protoBag, '__proto__')
  && !Object.hasOwn(protoBag, 'constructor')
  && !Object.hasOwn(protoBag, 'prototype')
  && !Object.hasOwn(protoBag, 'independent')
  && protoBag.freehold === 5;

const healCtx = stub80();
healCtx.world.reputation = withProto80({
  freehold: 4, constructor: 8, prototype: 7, veridian: Number.NaN, hollow: -40,
});
w80SanitizeRep(healCtx);
const healed = healCtx.world.reputation;
const restoreHeal = !Object.hasOwn(healed, '__proto__')
  && healed.__proto__ !== 99
  && !Object.hasOwn(healed, 'constructor')
  && !Object.hasOwn(healed, 'prototype')
  && !Object.hasOwn(healed, 'veridian')
  && healed.hollow === -40
  && healed.freehold === 4;

const dest80 = {
  flags: {},
  world: { currentSystem: 'freehold', credits: 10, fear: 0 },
  systems: SYSTEMS,
  cargo: [],
  cargoCapacity: 80,
  bio: {
    hunger: 0.15, wounds: 0, bond: 0.1, growth: 0, fedCount: 0,
    speedFactor: 1, turnFactor: 1,
  },
  player: { classKey: 'light', name: 'Wave80Pin', faction: 'independent' },
  ship: { object: null, velocity: { set() {} }, speed: 0 },
  emit() {},
  ships: [],
};
w80Restore(dest80, {
  v: 1,
  world: {
    currentSystem: 'freehold', credits: 10, fear: 0,
    reputation: withProto80({ freehold: 12, veridian: Number.NaN }),
    crimeScore: 99,
    wanted: true,
    crimes: [{ id: 1 }],
  },
  cargo: [],
});
const noCrimeFields = !w80Fields.includes('crimeScore')
  && !w80Fields.includes('wanted')
  && !w80Fields.includes('crimes')
  && !w80Fields.includes('kills')
  && w80Fields.includes('reputation');
const noCrimeRestore = !Object.hasOwn(dest80.world, 'crimeScore')
  && !Object.hasOwn(dest80.world, 'wanted')
  && !Object.hasOwn(dest80.world, 'crimes');
const rungs80 = w80Ladder.map((r) => r.name);
const ladderUnchanged = w80Ladder.length === 6
  && rungs80.join(',') === 'Sworn,Trusted,Known,Stranger,Suspect,Marked'
  && w80Ladder[0].min === 50 && w80Ladder[5].min === -1000
  && !state80.includes('KILL_STANDING_DELTA');
const digitsStay = w80Keys[8] === 'epics' && w80Keys.length === 10
  && w80Keys.at(-1) === 'shipyard'
  && w80Keys[0] !== 'shipyard';
const moveNotes = w80MoveNotes();
const digit9NoKillClaim = Array.isArray(moveNotes)
  && moveNotes.length === 5
  && !moveNotes.some((n) => /last attacker|KILL_STANDING|victim-faction piracy|kills move standing/i.test(n))
  && !/innerHTML/.test(station80);
const emitNeedle = "if (!seen) ctx.emit('npcDestroyed', { ship: live });";
const oneBind = (npc80.match(/applyPlayerKillStanding\(/g) || []).length === 1
  && npc80.includes(emitNeedle)
  && npc80.indexOf('applyPlayerKillStanding(ctx, live)') > npc80.indexOf(emitNeedle)
  && !combat80.includes('applyPlayerKillStanding')
  && !save80.includes('KILL_STANDING_DELTA')
  && !ctx80src.includes('reputationChanged')
  && helper80.includes('KILL_STANDING_DELTA = null')
  && !helper80.includes('standingOf')
  && !/reputation\[/.test(helper80)
  && !helper80.includes('innerHTML')
  && w80KillDelta === null;
const bioPodStay = w80Rescue.otherRep === 4 && w80Rescue.playerKillRep === 1
  && w80ListUu.other === 160 && w80ListUu.playerKill === 240
  && /freehold \+= PATROL_REP/.test(station80);

const w80 = {
  noCrimeScore: noCrimeFields && noCrimeRestore,
  npcVsNpcNoWrite,
  pirateNoWrite,
  traderNoWriteWhileNull: traderBag && traderNoComm && traderNoDelta,
  protoNeverBagKey: protoNeverKey,
  ladderUnchanged,
  restoreSanitize: restoreHeal,
  digitsStay,
  digit9NoKillClaim,
  oneBind,
  bioPodStay,
};
console.log(JSON.stringify(w80, null, 2));
const failed = Object.entries(w80).filter(([, v]) => !v).map(([k]) => k);
console.log('failed', failed);
console.log('detail', {
  calls: (npc80.match(/applyPlayerKillStanding\(/g) || []).length,
  emit: npc80.includes(emitNeedle),
  patrol: /freehold \+= PATROL_REP/.test(station80),
  notesLen: moveNotes.length,
});
process.exit(failed.length === 0 ? 0 : 1);
