// Wave 59 FX-RECOIL: source contract for ship.js playerFire kick.
// Reads ship.js only. Exits 0 when ALL CLEAN.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shipPath = resolve(here, '../../../src/systems/ship.js');
const shipSrc = readFileSync(shipPath, 'utf8');
const fails = [];

function ok(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  else console.log(`CLEAN ${name}`);
}

const shakeStart = shipSrc.indexOf('// Hit shake + fire recoil:');
const shakeEnd = shipSrc.indexOf('\n    },', shakeStart);
ok('block.found', shakeStart >= 0 && shakeEnd > shakeStart, `start=${shakeStart} end=${shakeEnd}`);
const shakeBlock = shakeStart >= 0 && shakeEnd > shakeStart
  ? shipSrc.slice(shakeStart, shakeEnd)
  : '';

ok('playerFire.handled', /ev\.type === 'playerFire'/.test(shakeBlock));
ok('playerFire.cannonOrDisruptor', /w === 'cannon' \|\| w === 'disruptor'/.test(shakeBlock));
ok('playerFire.shakeImpulse', /SHAKE_FIRE_DISRUPTOR/.test(shakeBlock) && /SHAKE_FIRE_CANNON/.test(shakeBlock));
ok('playerFire.fleshKick', /flesh\.position\.z \+= recoilZ/.test(shakeBlock)
  && /flesh\.position\.y \+= recoilY/.test(shakeBlock));

ok('zero.reducedMotion', /reducedMotion \|\| docked \|\| ctx\.gate\.jumping/.test(shakeBlock));
ok('zero.recoilZ', /recoilZ = 0/.test(shakeBlock));
ok('zero.recoilY', /recoilY = 0/.test(shakeBlock));
ok('zero.shakeAmp', /shakeAmp = 0/.test(shakeBlock));

ok('no.throttleWrite', !/input\.throttle\s*=/.test(shipSrc));
ok('no.throttleWrite.block', !/input\.throttle\s*=/.test(shakeBlock));
ok('no.velocityWrite.block', !/ship\.velocity/.test(shakeBlock));
ok('no.matchSpeedWrite.block', !/matchSpeed/.test(shakeBlock));
ok('no.rootTransform.block', !/root\.(position|rotation|quaternion)/.test(shakeBlock.replace(/root\.position/g, '')));

ok('no.newTHREE.block', !/new THREE\./.test(shakeBlock));

ok('caps.chase', /const SHAKE_CHASE_MAX = 0\.35/.test(shipSrc));
ok('caps.first', /const SHAKE_FIRST_MAX = 0\.12/.test(shipSrc));
ok('hitFormula.playerHit', /dmg \* SHAKE_HIT_PER_DMG/.test(shakeBlock));
ok('hitFormula.bodyDmg', /dmg \* SHAKE_BODY_PER_DMG/.test(shakeBlock));
ok('hitFormula.bodySpd', /spd \* SHAKE_BODY_PER_SPEED/.test(shakeBlock));
ok('hitFormula.wreck', /SHAKE_WRECK_AMP > impulse/.test(shakeBlock));

const fireCannon = Number((shipSrc.match(/const SHAKE_FIRE_CANNON = ([0-9.]+)/) || [])[1]);
const fireDisruptor = Number((shipSrc.match(/const SHAKE_FIRE_DISRUPTOR = ([0-9.]+)/) || [])[1]);
ok('fire.ampFinite', Number.isFinite(fireCannon) && Number.isFinite(fireDisruptor));
ok('fire.underFirstCap', fireCannon <= 0.12 && fireDisruptor <= 0.12, `c=${fireCannon} d=${fireDisruptor}`);
ok('fire.underChaseCap', fireCannon <= 0.35 && fireDisruptor <= 0.35);
ok('fire.readable', fireCannon > 0 && fireDisruptor > 0);
ok('fire.disruptorGteCannon', fireDisruptor >= fireCannon);

const recDecay = Number((shipSrc.match(/const RECOIL_DECAY = ([0-9.]+)/) || [])[1]);
ok('decay.recoil', Number.isFinite(recDecay) && recDecay >= 8 && recDecay <= 16, `RECOIL_DECAY=${recDecay}`);

ok('no.newFrozenEvent', !/ctx\.emit\(/.test(shakeBlock));
ok('no.emit.playerFire', !/emit\(\s*['"]playerFire['"]/.test(shipSrc));

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exit(1);
}
console.log('ALL CLEAN');
