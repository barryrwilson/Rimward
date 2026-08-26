// Wave 125 AI-05 PR1 starter-grace — data probe. Does not start Vite.
// node --import ./scripts/with-css-stub.mjs out/w125/startergrace/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { JUMP } from '../../../src/game/state.js';
import { WORLD_FIELDS } from '../../../src/game/save.js';
import { starterGraceBlocksAcquire, initNpc } from '../../../src/systems/npc.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const npcSrc = src('src/systems/npc.js');
const stateSrc = src('src/game/state.js');
const saveSrc = src('src/game/save.js');
const hudSrc = src('src/systems/hud.js');

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const maps = npcSrc.slice(npcSrc.indexOf('const STARTER_GRACE_SECONDS'), npcSrc.indexOf('const GRACE_CLAMP_SECONDS'));
const helper = npcSrc.slice(npcSrc.indexOf('export function starterGraceBlocksAcquire'), npcSrc.indexOf('function applyPlayerDestroyedCalm'));
const deathFn = npcSrc.slice(npcSrc.indexOf('function applyPlayerDestroyedCalm'), npcSrc.indexOf('export function playerInterestChance'));
const scratch = npcSrc.slice(npcSrc.indexOf('Retaliation (wave 32'), npcSrc.indexOf('Hostile/scratched patrols'));
const huntAcquire = npcSrc.slice(npcSrc.indexOf('} else if (!isCivilianRole(ai.role))'), npcSrc.indexOf('Demand hail (wave 30'));
const demand = npcSrc.slice(npcSrc.indexOf('Demand hail (wave 30'), npcSrc.indexOf('function updateDuel'));
const duel = npcSrc.slice(npcSrc.indexOf('function updateDuel'), npcSrc.indexOf('Wait outside the law zone'));

ok('maps.greenhand180', /greenhand:\s*180/.test(maps));
ok('maps.beautiful180', /beautiful:\s*180/.test(maps));
ok('maps.marked0', /marked:\s*0/.test(maps));
ok('maps.ledgerDebt0', /ledgerDebt:\s*0/.test(maps));
ok('maps.drifter0', /drifter:\s*0/.test(maps));
ok('maps.freehold', /greenhand:\s*'freehold'/.test(maps) && /beautiful:\s*'freehold'/.test(maps) && /marked:\s*'freehold'/.test(maps) && /ledgerDebt:\s*'freehold'/.test(maps));
ok('maps.drifterRedmarch', /drifter:\s*'redmarch'/.test(maps));
ok('maps.hasOwnOnly', maps.includes('STARTER_GRACE_SECONDS') && !/for\s*\(\s*const\s+\w+\s+in\s+/.test(helper));
ok('helper.hasOwn', helper.includes('Object.hasOwn(STARTER_GRACE_SECONDS') && helper.includes('Object.hasOwn(STARTER_SYSTEM'));
ok('helper.catchFalse', helper.includes('catch') && helper.includes('return false'));
ok('helper.dreskBypass', helper.includes('alwaysHuntsPlayer !== true'));
ok('call.acquire', huntAcquire.includes('starterGraceBlocksAcquire(ctx, live, now)'));
ok('call.demand', demand.includes('starterGraceBlocksAcquire(ctx, live, now)'));
ok('call.duel', duel.includes('starterGraceBlocksAcquire(ctx, live, now)'));
ok('call.hopClampAcquire', huntAcquire.includes('hopGraceUntilNow(ctx.world, now)'));
ok('call.hopClampDemand', demand.includes('hopGraceUntilNow(ctx.world, now)'));
ok('call.hopClampDuel', duel.includes('hopGraceUntilNow(ctx.world, now)'));
ok('scratch.noHelper', !scratch.includes('starterGraceBlocksAcquire'));
ok('scratch.stillInterested', scratch.includes('ai.playerInterested = true'));
ok('death.stamp90', deathFn.includes('DEATH_CALM_SECONDS') && npcSrc.includes('const DEATH_CALM_SECONDS = 90'));
ok('death.remainingVar', npcSrc.includes('let deathCalmLeft = 0') && !npcSrc.includes('let deathCalmUntil'));
ok('death.tickDt', npcSrc.includes('function tickDeathCalm(dt)') && npcSrc.includes('deathCalmLeft - dt'));
ok('death.blockRemaining', helper.includes('deathCalmBlocks()') && !helper.includes('now < graceUntilOrZero(deathCalmUntil'));
ok('death.clamp0180', npcSrc.includes('function clampDeathCalmLeft') && deathFn.includes('clampDeathCalmLeft(DEATH_CALM_SECONDS)'));
ok('death.listenEvents', deathFn.includes('ctx.events') && deathFn.includes('ctx.lastEvents') && deathFn.includes("'playerDestroyed'"));
ok('death.reroll', deathFn.includes('ai.playerRolled = false') && deathFn.includes('ai.playerInterested = false'));
ok('death.breakOff', deathFn.includes("ai.target === 'player'") && deathFn.includes('breakOff(ai)'));
ok('death.dreskKeep', deathFn.includes('alwaysHuntsPlayer !== true'));
ok('death.noAbsoluteStamp', !deathFn.includes('now + DEATH_CALM_SECONDS') && !deathFn.includes('ai.calmUntil = Math.max'));
ok('named.illyx', npcSrc.includes("'Carver Illyx'"));
ok('named.vane', npcSrc.includes("'Sister Vane'"));
ok('named.dreskHeal', npcSrc.includes('record.alwaysHuntsPlayer = true'));
ok('interest.unchanged', npcSrc.includes('base: 0.005') && npcSrc.includes('max: 0.20') && npcSrc.includes('if (record?.alwaysHuntsPlayer === true) return 1'));
ok('jump.grace60', JUMP.graceSeconds === 60 && /graceSeconds:\s*60/.test(stateSrc));
ok('persist.noNewWorldField', WORLD_FIELDS.includes('jumpGraceUntil') && !WORLD_FIELDS.includes('deathCalmUntil') && !WORLD_FIELDS.includes('deathCalmLeft') && !WORLD_FIELDS.includes('starterGrace') && !saveSrc.includes("'deathCalmUntil'") && !saveSrc.includes("'deathCalmLeft'") && !saveSrc.includes("'starterGrace'"));
ok('noInnerHTML.npc', !npcSrc.includes('innerHTML') && !npcSrc.includes('insertAdjacentHTML'));
ok('hud.untouched', hudSrc.includes("class: 'rw-reticle'") || hudSrc.includes('rw-reticle'));

const pirate = { record: {} };
const dresk = { record: { alwaysHuntsPlayer: true } };

ok(
  'helper.greenhandBlocks',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'greenhand', currentSystem: 'freehold', jumpGraceUntil: 0 } },
    pirate,
    10,
  ) === true,
);
ok(
  'helper.greenhandAfter180',
  starterGraceBlocksAcquire(
    { world: { time: 181, origin: 'greenhand', currentSystem: 'freehold', jumpGraceUntil: 0 } },
    pirate,
    181,
  ) === false,
);
ok(
  'helper.greenhandOtherSystem',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'greenhand', currentSystem: 'redmarch', jumpGraceUntil: 0 } },
    pirate,
    10,
  ) === false,
);
ok(
  'helper.markedExtraOff',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 0 } },
    pirate,
    10,
  ) === false,
);
ok(
  'helper.markedHopStill',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 70 } },
    pirate,
    10,
  ) === true,
);
ok(
  'helper.unknownOrigin0',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'not-an-origin', currentSystem: 'freehold', jumpGraceUntil: 0 } },
    pirate,
    10,
  ) === false,
);
ok(
  'helper.missingOrigin0',
  starterGraceBlocksAcquire(
    { world: { time: 10, currentSystem: 'freehold', jumpGraceUntil: 0 } },
    pirate,
    10,
  ) === false,
);
ok(
  'helper.dreskBypassesExtra',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'greenhand', currentSystem: 'freehold', jumpGraceUntil: 0 } },
    dresk,
    10,
  ) === false,
);
ok(
  'helper.dreskHonorsHop',
  starterGraceBlocksAcquire(
    { world: { time: 10, origin: 'greenhand', currentSystem: 'freehold', jumpGraceUntil: 70 } },
    dresk,
    10,
  ) === true,
);
ok(
  'helper.nanHopNoGod',
  starterGraceBlocksAcquire(
    { world: { time: 200, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: NaN } },
    pirate,
    200,
  ) === false,
);
ok(
  'helper.hugeHopFailClosed',
  starterGraceBlocksAcquire(
    { world: { time: 200, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 1e15 } },
    pirate,
    200,
  ) === false,
);
ok(
  'helper.hugeHopNow380FailClosed',
  starterGraceBlocksAcquire(
    { world: { time: 380, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 1e15 } },
    pirate,
    380,
  ) === false,
);
ok(
  'helper.hugeHop.now10000.mustNotGodMode',
  starterGraceBlocksAcquire(
    { world: { time: 10000, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 1e15 } },
    pirate,
    10000,
  ) === false,
);
ok(
  'helper.infHop.failClosed',
  starterGraceBlocksAcquire(
    { world: { time: 200, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: Infinity } },
    pirate,
    200,
  ) === false,
);
ok(
  'helper.hop60ExpiresAtStamp',
  starterGraceBlocksAcquire(
    { world: { time: 70, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 70 } },
    pirate,
    70,
  ) === false,
);
ok(
  'hop.noSlidingNowPlus180',
  !/Math\.min\(\s*hopUntil\s*,\s*now\s*\+\s*GRACE_CLAMP_SECONDS\s*\)/.test(npcSrc) &&
    !/Math\.min\(\s*deathCalmUntil\s*,\s*now\s*\+\s*GRACE_CLAMP_SECONDS\s*\)/.test(npcSrc) &&
    !/Math\.min\(\s*deathCalmLeft\s*,\s*now\s*\+\s*GRACE_CLAMP_SECONDS\s*\)/.test(npcSrc),
);
ok(
  'helper.catchNull',
  starterGraceBlocksAcquire(null, pirate, 10) === false,
);

const scene = new THREE.Scene();
const pirateLive = {
  role: 'pirate',
  record: {},
  state: { destroyed: false },
  ai: {
    role: 'pirate',
    target: 'player',
    playerRolled: true,
    playerInterested: true,
    calmUntil: 12,
    velocity: new THREE.Vector3(),
  },
};
const dreskLive = {
  role: 'pirate',
  record: { alwaysHuntsPlayer: true },
  state: { destroyed: false },
  ai: {
    role: 'pirate',
    target: 'player',
    playerRolled: true,
    playerInterested: true,
    calmUntil: 0,
    velocity: new THREE.Vector3(),
  },
};
const deathCtx = {
  scene,
  world: { time: 50, origin: 'marked', currentSystem: 'freehold', jumpGraceUntil: 0 },
  settings: { reducedMotion: true },
  ship: { object: null },
  flags: { docked: false, combat: false },
  gate: { jumping: true },
  ships: [pirateLive, dreskLive],
  events: [{ type: 'playerDestroyed' }],
  lastEvents: [],
  elapsed: 0,
  targets: { current: null },
  emit() {},
};
const npc = initNpc(deathCtx);
npc.update(0);

ok('death.rerollCold', pirateLive.ai.playerRolled === false && pirateLive.ai.playerInterested === false);
ok('death.breakPlayer', pirateLive.ai.target == null);
ok('death.dreskKeepsInterest', dreskLive.ai.playerRolled === true && dreskLive.ai.playerInterested === true);
ok('death.dreskBreaksTarget', dreskLive.ai.target == null);
ok(
  'helper.deathBlocksDresk',
  starterGraceBlocksAcquire(deathCtx, dreskLive, 50) === true,
);
ok(
  'helper.deathBlocksAtNow141',
  starterGraceBlocksAcquire(deathCtx, pirateLive, 141) === true,
);

deathCtx.world.time = 1;
ok(
  'death.rewindWorldTimeStillBlocks',
  starterGraceBlocksAcquire(deathCtx, pirateLive, 1) === true,
);
ok(
  'death.rewindStillBlocksDresk',
  starterGraceBlocksAcquire(deathCtx, dreskLive, 1) === true,
);
ok(
  'death.rewindStillBlocksAt10000',
  starterGraceBlocksAcquire(deathCtx, pirateLive, 10000) === true,
);

deathCtx.events = [];
deathCtx.lastEvents = [];
npc.update(45);
ok(
  'death.midRemainingStillBlocks',
  starterGraceBlocksAcquire(deathCtx, pirateLive, 1) === true,
);
deathCtx.world.time = 0;
npc.update(45);
ok(
  'death.remainingExpiredAfter90dt',
  starterGraceBlocksAcquire(deathCtx, pirateLive, 0) === false,
);
ok(
  'death.remainingExpiredDresk',
  starterGraceBlocksAcquire(deathCtx, dreskLive, 0) === false,
);
ok('death.rollColdAfterExpire', pirateLive.ai.playerRolled === false && pirateLive.ai.playerInterested === false);

if (fails.length) {
  console.error(`FAIL ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PASS starter-grace probe');
