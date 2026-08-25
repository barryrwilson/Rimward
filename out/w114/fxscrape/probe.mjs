// Wave 114 FX scrape PR1 — source pins. Does not start Vite.
// node out/w114/fxscrape/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HULL_MARK_POOL } from '../../../src/game/hull-marks.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const combatSrc = src('src/systems/combat.js');
const physicsSrc = src('src/game/physics.js');
const stateSrc = src('src/game/state.js');
const hullMarksSrc = src('src/game/hull-marks.js');

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const bodyStart = combatSrc.indexOf('// 1b. Body impact');
const sunStart = combatSrc.indexOf('// 1c. Star heat');
const npcFireStart = combatSrc.indexOf('// 2. NPC fire requests');
const bodyLoop = bodyStart >= 0 && sunStart > bodyStart ? combatSrc.slice(bodyStart, sunStart) : '';
const sunPath = sunStart >= 0 && npcFireStart > sunStart ? combatSrc.slice(sunStart, npcFireStart) : '';

const spawnRippleStart = combatSrc.indexOf('function spawnRipple(pos, family, host)');
const spawnHitFxStart = combatSrc.indexOf('function spawnHitFx(pos, family, shielded, host)');
const spawnRippleSrc = spawnRippleStart >= 0 && spawnHitFxStart > spawnRippleStart
  ? combatSrc.slice(spawnRippleStart, spawnHitFxStart)
  : '';

ok('scrape.bodyLoopPresent', bodyLoop.includes("e.type !== 'bodyHit'") && bodyLoop.includes('applyHit(player'));
ok('scrape.spawnHitFxInBodyLoop', bodyLoop.includes("spawnHitFx(pos, 'impact', shielded, host)"));
ok(
  'scrape.shieldedBeforeApplyHit',
  (() => {
    const sh = bodyLoop.indexOf('const shielded = player.screen > 0 || player.shell > 0');
    const ah = bodyLoop.indexOf('applyHit(player');
    return sh >= 0 && ah > sh;
  })(),
);
ok(
  'scrape.tryCatchAroundFx',
  /try \{\s*spawnHitFx\(pos, 'impact', shielded, host\);\s*\}\s*catch \{\s*\/\* skip FX; never freeze \*\//.test(bodyLoop),
);
ok(
  'scrape.parkOnDestroy',
  bodyLoop.includes('if (player.destroyed)') &&
    bodyLoop.includes('parkMarksOnHost(host)') &&
    bodyLoop.includes('parkRipplesOnHost(host)'),
);
ok('scrape.slideNoApplyHit', bodyLoop.includes('speed < PHY.IMPACT_MIN_SPEED') && bodyLoop.includes('continue'));
ok('sun.noSpawnHitFx', sunPath.length > 0 && !sunPath.includes('spawnHitFx'));
ok('sun.stillApplyHit', sunPath.includes("family: 'impact'") && sunPath.includes('applyHit(player'));

ok('phy.impactMinSpeed8', /IMPACT_MIN_SPEED:\s*8\b/.test(physicsSrc));
ok('phy.impactScreenPerU035', /IMPACT_SCREEN_PER_U:\s*0\.35\b/.test(physicsSrc));
ok('fx.ripplePool16', /const RIPPLE_POOL = 16\b/.test(combatSrc));
ok('fx.markPool12', HULL_MARK_POOL === 12 && /export const HULL_MARK_POOL = 12\b/.test(hullMarksSrc));

const weaponsStart = stateSrc.indexOf('export const WEAPONS = {');
const weaponsEnd = stateSrc.indexOf('export function', weaponsStart + 1);
const weaponsBlock = weaponsStart >= 0 && weaponsEnd > weaponsStart
  ? stateSrc.slice(weaponsStart, weaponsEnd)
  : '';
ok('state.noWeaponsImpact', weaponsBlock.includes('cannon:') && !/\bimpact\s*:/.test(weaponsBlock));

ok('combat.noInnerHTML', !combatSrc.includes('innerHTML'));
ok('scrape.noInnerHTML', !bodyLoop.includes('innerHTML'));

ok(
  'wave111.headerPresent',
  combatSrc.includes('Wave 111: shielded ripples parent to the host') &&
    combatSrc.includes('First-person player host stays world-space'),
);
ok(
  'wave111.parentLaw',
  spawnRippleSrc.includes('fpPlayer') &&
    spawnRippleSrc.includes('host === playerObj') &&
    spawnRippleSrc.includes('ctx.flags.firstPerson === true') &&
    spawnRippleSrc.includes('worldHitToLocal') &&
    spawnRippleSrc.includes('host.add(f.sprite)') &&
    spawnRippleSrc.includes('f.sprite.position.copy(pos)'),
);
ok('wave111.xorUnchanged', combatSrc.includes('if (shielded) spawnRipple(pos, family, host)'));
ok('scrape.neverZeroSpeed', !bodyLoop.includes('speed = 0') && !bodyLoop.includes('speed=0'));
ok('scrape.stillApplyHit', bodyLoop.includes("family: 'impact'") && bodyLoop.includes("ctx.emit('playerHit'"));
ok('scrape.impactGapHonor', bodyLoop.includes('now - _lastImpactAt >= IMPACT_GAP') || combatSrc.includes('now - _lastImpactAt >= IMPACT_GAP'));

if (fails.length) {
  console.log(`FAIL ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PASS all fxscrape PR1 pins');
