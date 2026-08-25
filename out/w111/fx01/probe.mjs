// Wave 111 FX-01 PR1 — hull-local shield ripple. Does not start Vite.
// node out/w111/fx01/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HULL_MARK_POOL, worldHitToLocal, liftLocalOffset, isFiniteVec3 } from '../../../src/game/hull-marks.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const combatSrc = src('src/systems/combat.js');
const shipSrc = src('src/systems/ship.js');
const songSrc = src('src/systems/song.js');
const npcSrc = src('src/systems/npc.js');
const ctxSrc = src('src/core/ctx.js');
const stateSrc = src('src/game/state.js');
const saveSrc = src('src/game/save.js');
const hudSrc = src('src/systems/hud.js');

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const spawnRippleSrc = (() => {
  const start = combatSrc.indexOf('function spawnRipple(pos, family, host)');
  const end = combatSrc.indexOf('function spawnHitFx');
  return start >= 0 && end > start ? combatSrc.slice(start, end) : '';
})();
const spawnHitFxSrc = (() => {
  const start = combatSrc.indexOf('function spawnHitFx(pos, family, shielded, host)');
  const end = combatSrc.indexOf('function parkHullMark');
  return start >= 0 && end > start ? combatSrc.slice(start, end) : '';
})();
const hdStart = npcSrc.indexOf('function handleDestroyed');
const hdEnd = npcSrc.indexOf('export function initNpc');
const hd = hdStart >= 0 && hdEnd > hdStart ? npcSrc.slice(hdStart, hdEnd) : '';
const cueKeys = ['playerFire', 'npcFire', 'npcHit', 'bodyHit', 'npcDestroyed', 'sunHeat'];

ok('ripple.pool16', /const RIPPLE_POOL = 16\b/.test(combatSrc));
ok('ripple.ttl02', /const RIPPLE_TTL = 0\.2\b/.test(combatSrc));
ok('ripple.slotHost', combatSrc.includes('host: null') && combatSrc.includes('ripples.push'));
ok('ripple.liftOwn', /const RIPPLE_LIFT = /.test(combatSrc) && spawnRippleSrc.includes('RIPPLE_LIFT') && !spawnRippleSrc.includes('HULL_MARK_LIFT'));
ok('hit.xorShielded', spawnHitFxSrc.includes('if (shielded) spawnRipple(pos, family, host)'));
ok('hit.xorUnshielded', spawnHitFxSrc.includes('spawnSparks(pos, family)') && spawnHitFxSrc.includes('stampHullMark(pos, host)'));
ok('hit.unshieldedNoRipple', /if \(shielded\) spawnRipple[\s\S]+else \{\s*spawnSparks\(pos, family\);\s*stampHullMark\(pos, host\);/.test(spawnHitFxSrc));
ok('ripple.parentWhenFinite', spawnRippleSrc.includes('host.add(f.sprite)') && spawnRippleSrc.includes('worldHitToLocal'));
ok('ripple.fpNoFullParent', spawnRippleSrc.includes('host === playerObj') && spawnRippleSrc.includes('ctx.flags.firstPerson === true') && spawnRippleSrc.includes('fpPlayer'));
ok('ripple.fpUsesWorldCopy', spawnRippleSrc.includes('f.sprite.position.copy(pos)'));
ok('ripple.missingHelperFallback', spawnRippleSrc.includes("typeof worldHitToLocal === 'function'") && spawnRippleSrc.includes('position.copy(pos)'));
ok('ripple.tryCatch', spawnRippleSrc.includes('try {') && spawnRippleSrc.includes('catch'));
ok('ripple.parkScene', combatSrc.includes('function parkRipple') && combatSrc.includes('function parkRipplesOnHost') && combatSrc.includes('function parkAllRipples') && combatSrc.includes('if (slot.sprite.parent !== scene) scene.add(slot.sprite)'));
ok('ripple.parkEvents', combatSrc.includes("e.type === 'npcDestroyed'") && combatSrc.includes("e.type === 'playerDestroyed'") && combatSrc.includes("e.type === 'systemLoaded'") && combatSrc.includes('parkRipplesOnHost') && combatSrc.includes('parkAllRipples'));
ok('ripple.orphan', combatSrc.includes('if (f.host.parent == null) parkRipple(f)'));
ok('ripple.reducedSnap', spawnRippleSrc.includes('const reduced = ctx.settings?.reducedMotion === true') && spawnRippleSrc.includes('f.snap = reduced') && spawnRippleSrc.includes('reduced ? 5.5 : 2.2'));
ok('ripple.reducedNoExtraPulse', !/reducedMotion[\s\S]{0,200}keyframes/i.test(spawnRippleSrc) && spawnRippleSrc.includes('f.snap = reduced'));
ok('ripple.scaleLocal', combatSrc.includes('const s = 2.2 + 7.2 * k') && combatSrc.includes('f.sprite.scale.set(s, s, 1)') && combatSrc.includes('f.sprite.material.opacity = 1 - k * k'));
ok('ripple.noThirdPool', !/THIRD_.*POOL|HITFX_POOL|RIPPLE_POOL_2/.test(combatSrc));
ok('ripple.noUserShader', !/ShaderMaterial|GLSL|onBeforeCompile/.test(combatSrc));
ok('ripple.noInnerHTML', !combatSrc.includes('innerHTML'));
ok('marks.pool12', HULL_MARK_POOL === 12 && combatSrc.includes('HULL_MARK_POOL'));
const worldFieldsBlock = saveSrc.slice(saveSrc.indexOf('export const WORLD_FIELDS'), saveSrc.indexOf('const SURVIVOR'));
ok(
  'persist.noNewWorldField',
  worldFieldsBlock.includes("'time'") &&
    !worldFieldsBlock.includes('hullMark') &&
    !worldFieldsBlock.includes('ripple') &&
    !saveSrc.includes("'ripple'") &&
    !/world\.hullMarks/.test(combatSrc),
);
ok('state.readOnlyHonor', !/export const WEAPONS/.test(combatSrc) && stateSrc.includes('export const WEAPONS'));
ok('hud.noHubChild', !combatSrc.includes('rw-reticle') && !combatSrc.includes('innerHTML'));
ok('hub.reticleUntouched', hudSrc.includes("class: 'rw-reticle'") || hudSrc.includes('rw-reticle'));

const w54 = {
  playerFireEmit: combatSrc.includes("ctx.emit('playerFire'"),
  playerFireDoc: ctxSrc.includes("'playerFire' { weapon }"),
  muzzlePool: combatSrc.includes('MUZZLE_POOL') && combatSrc.includes('spawnMuzzle'),
  ripple: combatSrc.includes('spawnRipple') && combatSrc.includes('spawnHitFx'),
  sparksUp: combatSrc.includes('SPARKS_PER_BURST = 11'),
  projRadius: combatSrc.includes('const PROJ_RADIUS = 0.4'),
  cues: cueKeys.every((k) => songSrc.includes(`${k}:`)),
  shakeLastEvents: shipSrc.includes('SHAKE_FIRST_MAX = 0.12') && shipSrc.includes('SHAKE_CHASE_MAX = 0.35'),
  shakeZeros: shipSrc.includes('reducedMotion') && shipSrc.includes('SHAKE_DECAY'),
  deathPool: npcSrc.includes('DEATH_BURST_SLOTS = 3') && npcSrc.includes('makeDeathBurstPool'),
  noPerKillMat: hd.includes('emitDeathBurst') && !hd.includes('new THREE.MeshBasicMaterial'),
};
ok('wave54.hold', Object.values(w54).every(Boolean), JSON.stringify(w54));

const w59 = {
  recoilEvent: shipSrc.includes("ev.type === 'playerFire'") && shipSrc.includes("w === 'cannon' || w === 'disruptor'"),
  recoilFlesh: shipSrc.includes('flesh.position.z += recoilZ') && shipSrc.includes('flesh.position.y += recoilY'),
  recoilZero: shipSrc.includes('recoilZ = 0') && shipSrc.includes('recoilY = 0'),
  noThrottle: !/ctx\.input\.throttle\s*=/.test(shipSrc),
  hullPool: HULL_MARK_POOL === 12,
  stampUnshielded: combatSrc.includes('stampHullMark(pos, host)') && combatSrc.includes('spawnSparks(pos, family)'),
  parkDestroy: combatSrc.includes('parkMarksOnHost') && combatSrc.includes("e.type === 'npcDestroyed'"),
};
ok('wave59.hold', Object.values(w59).every(Boolean), JSON.stringify(w59));

function parentChoice({ host, playerObj, firstPerson, pos, pose, helper }) {
  const fpPlayer = !!(host && playerObj && host === playerObj && firstPerson === true);
  if (fpPlayer || !host || !pos) return { parent: 'scene', copy: true };
  if (typeof helper !== 'function') return { parent: 'scene', copy: true };
  const local = { x: 0, y: 0, z: 0 };
  if (!helper(pos.x, pos.y, pos.z, pose, local)) return { parent: 'scene', copy: true };
  liftLocalOffset(local, 0.16);
  if (!isFiniteVec3(local.x, local.y, local.z)) return { parent: 'scene', copy: true };
  return { parent: 'host', local };
}

const npcHost = { id: 'npc' };
const playerHost = { id: 'player' };
const poseOk = { px: 0, py: 0, pz: 0, qx: 0, qy: 0, qz: 0, qw: 1, sx: 1, sy: 1, sz: 1 };
const poseNaN = { px: NaN, py: 0, pz: 0, qx: 0, qy: 0, qz: 0, qw: 1, sx: 1, sy: 1, sz: 1 };
const hit = { x: 2, y: 0, z: 1 };

const npc = parentChoice({
  host: npcHost, playerObj: playerHost, firstPerson: false, pos: hit, pose: poseOk, helper: worldHitToLocal,
});
ok('sim.npcParents', npc.parent === 'host' && Number.isFinite(npc.local.x));

const chasePlayer = parentChoice({
  host: playerHost, playerObj: playerHost, firstPerson: false, pos: hit, pose: poseOk, helper: worldHitToLocal,
});
ok('sim.chasePlayerMayParent', chasePlayer.parent === 'host');

const fpPlayer = parentChoice({
  host: playerHost, playerObj: playerHost, firstPerson: true, pos: hit, pose: poseOk, helper: worldHitToLocal,
});
ok('sim.fpPlayerWorld', fpPlayer.parent === 'scene' && fpPlayer.copy === true);

const missing = parentChoice({
  host: npcHost, playerObj: playerHost, firstPerson: false, pos: hit, pose: poseOk, helper: null,
});
ok('sim.missingHelperWorld', missing.parent === 'scene');

const nanPose = parentChoice({
  host: npcHost, playerObj: playerHost, firstPerson: false, pos: hit, pose: poseNaN, helper: worldHitToLocal,
});
ok('sim.nanPoseWorld', nanPose.parent === 'scene');

const noHost = parentChoice({
  host: null, playerObj: playerHost, firstPerson: false, pos: hit, pose: poseOk, helper: worldHitToLocal,
});
ok('sim.noHostWorld', noHost.parent === 'scene');

ok('sim.helperFalse', worldHitToLocal(NaN, 0, 0, poseOk, { x: 0, y: 0, z: 0 }) === false);

let threw = false;
try {
  parentChoice({
    host: { add() { throw new Error('bad host'); } },
    playerObj: playerHost,
    firstPerson: false,
    pos: hit,
    pose: poseOk,
    helper: () => { throw new Error('nan host'); },
  });
} catch {
  threw = true;
}
ok('sim.helperThrowCaughtByCombatTry', spawnRippleSrc.includes('catch') && threw === true);

ok('combat.noSpeedZero', !/speed\s*=\s*0/.test(spawnRippleSrc) && !/applyHit/.test(spawnRippleSrc));
ok('combat.keepApplyHit', combatSrc.includes('applyHit('));

if (fails.length) {
  console.log(`FAIL ${fails.length} ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PASS');
process.exit(0);
