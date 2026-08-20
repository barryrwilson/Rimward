// Wave 68 PR3b fire — source pins + seeker step. No WebGL fire test.
// node out/w68/pr3-fire/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import * as THREE from 'three';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const combatSrc = readFileSync(join(root, 'src/systems/combat.js'), 'utf8');
const controlsSrc = readFileSync(join(root, 'src/systems/controls.js'), 'utf8');
const ctxSrc = readFileSync(join(root, 'src/core/ctx.js'), 'utf8');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

// --- controls.js: Digit4 group 4, do not steal Digit 0 ---
pin('digit4.tracked', /'Digit1',\s*'Digit2',\s*'Digit3',\s*'Digit4'/.test(controlsSrc));
pin('digit4.assign', /case 'Digit4':[\s\S]{0,180}?input\.weaponGroup = 4/.test(controlsSrc));
pin('digit4.comment', /Group 4 is missiles when a launcher is seated/.test(controlsSrc));
pin('digit0.notTracked', !/'Digit0'/.test(controlsSrc));
pin('digit0.noGroup', !/weaponGroup\s*=\s*0/.test(controlsSrc));

// --- ctx.js comments only ---
pin('ctx.group4', /1=cannon 2=disruptor 3=mining 4=missiles/.test(ctxSrc));
pin('ctx.playerFire.missile', /playerFire[\s\S]{0,80}'missile'/.test(ctxSrc));
pin('ctx.playerFire.turret', /turret wkey/.test(ctxSrc));
pin('ctx.noMissileIncoming', !/missileIncoming/.test(ctxSrc));
pin('ctx.noMissileFireType', !/'missileFire'/.test(ctxSrc) && !/'turretFire'/.test(ctxSrc));

// --- combat.js group 4 / empty rack ---
pin('groupWeapon.1to3', /const GROUP_WEAPON = \{ 1: 'cannon', 2: 'disruptor', 3: 'mining' \}/.test(combatSrc));
pin('groupWeapon.4.comment', /GROUP_WEAPON\[4\] maps to the seated launcher wkey/.test(combatSrc));
pin('emptyRack.noCannon', /Do not fall through to cannon via \?\? 'cannon'/.test(combatSrc));
pin('emptyRack.nullWkey', /Empty group 4: wkey is null/.test(combatSrc));
pin('groupWeapon.fn', /function groupWeapon\(ctx\)/.test(combatSrc)
  && /if \(g === 4\)/.test(combatSrc)
  && /return null/.test(combatSrc)
  && /LAUNCHER_IDS\[id\]\.wkey/.test(combatSrc));

// --- missile pool 8, spend-on-spawn-only ---
pin('missilePool.cap', /const MISSILE_POOL = 8/.test(combatSrc));
pin('missilePool.separate', /do not share the 64-bolt pool/.test(combatSrc));
pin('missilePool.alloc', /for \(let i = 0; i < MISSILE_POOL; i\+\+\)/.test(combatSrc));
pin('spend.import', /import \{ spendMissileAmmo \} from '\.\.\/game\/hangar\.js'/.test(combatSrc));
pin('spend.onSpawnOnly', /spend-on-spawn-only/.test(combatSrc)
  && /if \(!dart\) return; \/\/ dry pool: no ammo, no heat/.test(combatSrc)
  && /const spent = spendMissileAmmo\(ctx, 1\)/.test(combatSrc)
  && /if \(!spent\)/.test(combatSrc)
  && /deactivate\(dart\)/.test(combatSrc));
pin('heat.afterSpend', /addHeat\(w\.heatPerShot\)/.test(combatSrc));
pin('emit.playerFire.missile', /ctx\.emit\('playerFire', \{ weapon: wkey \}\)/.test(combatSrc));

// --- lock / no snap / seeker ---
pin('lock.liveShip', /if \(!t\?\.object \|\| !t\.object\.parent \|\| !t\.state \|\| t\.state\.destroyed\) return null/.test(combatSrc));
pin('noSnap.comment', /Does not snap spawn onto a lock/.test(combatSrc));
pin('seeker.export', /export function steerSeekerVel/.test(combatSrc));
pin('seeker.ballistic.comment', /lockPos null → ballistic/.test(combatSrc));
pin('seeker.despawn', /lock\?\.object\?\.parent/.test(combatSrc));
pin('seeker.turnCap.symbol', /const maxTurn = turn \* dt/.test(combatSrc));
pin('missile.turn.catalog', /WEAPONS\.missile\.turn/.test(combatSrc));

// --- turret ---
pin('turret.notGroup', /Auto turret — not a weapon group/.test(combatSrc));
pin('turret.cap2', /const TURRET_LIVE_CAP = 2/.test(combatSrc));
pin('turret.cone', /CONVERGE_DOT/.test(combatSrc) && /Does not track aft/.test(combatSrc));
pin('turret.heatOnSpawn', /if \(!bolt\) return; \/\/ dry pool: no heat/.test(combatSrc));
pin('npc.noMissile', /function spawnNpcShot/.test(combatSrc)
  && /const wkey = WEAPONS\[weapon\] \? weapon : 'cannon'/.test(combatSrc));

// --- materials / family ---
pin('family.missile', /FAMILY_COLORS = \{[^}]*missile: 0xff8a2a/.test(combatSrc));
pin('mats.missile', /missile: new THREE\.MeshBasicMaterial/.test(combatSrc));

// --- no new persist / no incoming gauge ---
pin('combat.noIncoming', !/missileIncoming/.test(combatSrc));
pin('combat.noSessionDebug', !/sessionStorage/.test(combatSrc));

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));
const { steerSeekerVel } = await import('../../../src/systems/combat.js');
const { WEAPONS } = await import('../../../src/game/state.js');

pin('catalog.missile.range', WEAPONS.missile.range === 720);
pin('catalog.missile.turn', WEAPONS.missile.turn === 0.85);
pin('catalog.turret.range', WEAPONS.turret.range === 380);

const vel = new THREE.Vector3(100, 0, 0);
const pos = new THREE.Vector3(0, 0, 0);
const lock = new THREE.Vector3(0, 100, 0);
const speed = 100;
const turn = WEAPONS.missile.turn;
const dt = 0.1;
const before = vel.clone();
steerSeekerVel(vel, pos, lock, speed, turn, dt);
const ang = before.angleTo(vel);
pin('seeker.turnCapped', ang <= turn * dt + 1e-6, `ang=${ang}`);
pin('seeker.turned', ang > 1e-4, `ang=${ang}`);
pin('seeker.speedKept', Math.abs(vel.length() - speed) < 1e-4, `spd=${vel.length()}`);

const ballistic = new THREE.Vector3(10, 2, -1);
steerSeekerVel(ballistic, pos, null, 10, turn, dt);
pin('seeker.nullBallistic', ballistic.x === 10 && ballistic.y === 2 && ballistic.z === -1);

if (fails.length) {
  console.error('FAIL', fails.join(' | '));
  process.exit(1);
}
console.log('ok pr3-fire pins', [
  'Digit4', 'empty-rack', 'MISSILE_POOL=8', 'spend-on-spawn-only',
  'seeker.turn+ballistic', 'turret.cap2', 'no missileIncoming',
].join(', '));
