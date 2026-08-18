// Wave 57 ship-vs-ship bolt pins. Reads combat.js + npc.js. Does not start Vite.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const combatPath = resolve(here, '../../src/systems/combat.js');
const npcPath = resolve(here, '../../src/systems/npc.js');
const combatSrc = readFileSync(combatPath, 'utf8');
const npcSrc = readFileSync(npcPath, 'utf8');

const {
  lastAttackerOf,
  isScratched,
  mayHuntPlayer,
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
      role, lastAttacker: extra.lastAttacker ?? null, scratched: false,
    },
  };
}

const checks = {};

// spawnNpcShot aims at aimObj.position, not a hard-coded playerObj.
checks.spawnNpcShotAimObj = /function spawnNpcShot\(ship, weapon, aimObj\)/.test(combatSrc);
checks.aimsAtAimObj = /_dir\.subVectors\(aimObj\.position, _nose\)/.test(combatSrc);
checks.notHardcodedPlayerAim = !/_dir\.subVectors\(playerObj\.position, _nose\)/.test(combatSrc);
checks.storesShooter = /bolt\.shooter = ship/.test(combatSrc);
checks.aimErrorKept = /AIM_ERROR/.test(combatSrc);

// npcFire handler: player vs live-ship target, ship bolts never require playerObj wrap.
checks.legacyPlayerTarget = /tgt === 'player' \|\| tgt == null/.test(combatSrc);
checks.playerBoltVsPlayer = /bolt\.vsPlayer = true/.test(combatSrc);
checks.shipTargetObject = /spawnNpcShot\(ship, e\.weapon, tgt\.object\)/.test(combatSrc);
checks.noAllFirePlayerWrap = !/if \(playerObj\) \{\s*\n\s*for \(let i = 0; i < ctx\.events\.length; i\+\+\) \{\s*\n\s*const e = ctx\.events\[i\];\s*\n\s*if \(e\.type !== 'npcFire'\) continue;/.test(combatSrc);
checks.shipFireIfNoPlayer = /if \(!playerObj\) continue;/.test(combatSrc)
  && /spawnNpcShot\(ship, e\.weapon, tgt\.object\)/.test(combatSrc);

// integrate: ship-target NPC bolts use testNpcHits; player-aimed use testPlayerHit.
checks.integrateVsPlayer = /const hit = \(p\.fromPlayer \|\| !p\.vsPlayer\)\s*\n\s*\? testNpcHits\(p, now\)\s*\n\s*: testPlayerHit\(p, now, player, playerObj\)/.test(combatSrc);
checks.oldAlwaysPlayerHit = !/const hit = p\.fromPlayer \? testNpcHits\(p, now\) : testPlayerHit/.test(combatSrc);

// testNpcHits skips the shooter; Unknowables still pass through.
checks.skipShooter = /if \(p\.shooter && s === p\.shooter\) continue/.test(combatSrc);
checks.unknowablePass = /if \(isUnknowable\(s\.state\.faction\)\) continue/.test(combatSrc);

// npc.js: emit for player AND live-ship targets; include target; not player-gated.
checks.emitHasTarget = /ctx\.emit\('npcFire', \{ ship: live, weapon: 'cannon', target: ai\.target \}\)/.test(npcSrc);
checks.emitNotPlayerGated = !/if \(ai\.target === 'player'\) ctx\.emit\('npcFire'/.test(npcSrc);
checks.intentPlayerOnly = /ai\.intent = ai\.target === 'player'/.test(npcSrc);
checks.noFireTelegraphDemand = /if \(ai\.band === 'bargaining' \|\| ai\.demanding\) return/.test(npcSrc);
checks.demandPlayerPirate = /ai\.target === 'player' &&\s*\n\s*ai\.role === 'pirate'/.test(npcSrc);
checks.aceStillPlayerAimed = /facingDot\(live\.object, playerPos\) > FIRE_FACE_DOT/.test(npcSrc)
  && /ctx\.emit\('npcFire', \{ ship: live, weapon: 'cannon' \}\)/.test(npcSrc);

// lastAttacker stamp + player-only retaliation / patrol scratch-hunt
checks.stampsPlayerBolt = /lastAttacker = p\.fromPlayer \? 'player' : \(p\.shooter \|\| 'npc'\)/.test(combatSrc);
checks.lastAttackerOnAi = /lastAttacker: null/.test(npcSrc);
checks.retaliationNeedsPlayer = /lastAttackerOf\(live\) === 'player' &&\s*\n\s*\(st\.hull < st\.hullMax \|\| st\.screen < st\.screenMax\)/.test(npcSrc);
checks.patrolScratchNeedsPlayer = /isScratched\(live\) &&\s*\n\s*lastAttackerOf\(live\) === 'player'/.test(npcSrc);
checks.mayHuntPlayerScratchGate = /isScratched\(live\) && lastAttackerOf\(live\) === 'player'/.test(npcSrc);
checks.stalePlayerOnlyDamageGone = !/pirate's only damage source IS the player/.test(npcSrc);

const ctx0 = { world: { reputation: { freehold: 0, redledger: 0 } } };
const pirate = hull('pirate', 'redledger');
const patrolNpcScratch = hull('patrol', 'freehold', { lastAttacker: pirate, state: { screen: 40 } });
checks.npcScratchIsScratch = isScratched(patrolNpcScratch) === true;
checks.npcScratchNoPlayerHunt = mayHuntPlayer(ctx0, patrolNpcScratch) === false;
checks.npcScratchAttackerIsPirate = lastAttackerOf(patrolNpcScratch) === pirate;

const patrolPlayerScratch = hull('patrol', 'freehold', { lastAttacker: 'player', state: { screen: 40 } });
checks.playerScratchHunts = mayHuntPlayer(ctx0, patrolPlayerScratch) === true;
checks.playerScratchAttacker = lastAttackerOf(patrolPlayerScratch) === 'player';

const deadPirate = hull('pirate', 'redledger', { state: { destroyed: true } });
const patrolDeadAtk = hull('patrol', 'freehold', { lastAttacker: deadPirate, state: { screen: 40 } });
checks.deadAttackerCleared = lastAttackerOf(patrolDeadAtk) === null && patrolDeadAtk.ai.lastAttacker === null;
checks.deadAttackerNoHunt = mayHuntPlayer(ctx0, patrolDeadAtk) === false;

const ctxHot = { world: { reputation: { freehold: -10 } } };
checks.hostileStandingStillHunts = mayHuntPlayer(ctxHot, patrolNpcScratch) === true;

const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
const pass = failed.length === 0;
console.log(JSON.stringify({ pass, failed, checks }, null, 2));
process.exit(pass ? 0 : 1);
