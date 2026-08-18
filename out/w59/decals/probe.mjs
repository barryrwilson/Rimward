// Wave 59 FX-DECALS source contract. Does not start Vite.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HULL_MARK_POOL,
  HULL_MARK_LIFT,
  isFiniteVec3,
  worldHitToLocal,
  liftLocalOffset,
  nextMarkSlot,
} from '../../../src/game/hull-marks.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const hullPath = join(root, 'src', 'game', 'hull-marks.js');
const combatPath = join(root, 'src', 'systems', 'combat.js');

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

ok('hull-marks.exists', existsSync(hullPath));
const hullSrc = existsSync(hullPath) ? readFileSync(hullPath, 'utf8') : '';
ok('hull-marks.noThreeImport', !/from\s+['"]three['"]/.test(hullSrc) && !/\bTHREE\b/.test(hullSrc));
ok(
  'hull-marks.poolSize',
  Number.isFinite(HULL_MARK_POOL) && HULL_MARK_POOL >= 8 && HULL_MARK_POOL <= 16,
  String(HULL_MARK_POOL),
);

const combatSrc = readFileSync(combatPath, 'utf8');
ok('combat.importsHelper', combatSrc.includes("from '../game/hull-marks.js'"));
ok(
  'combat.hullMarkPool',
  combatSrc.includes('hull-mark-pool') &&
    combatSrc.includes('HULL_MARK_POOL') &&
    combatSrc.includes('hullMarks') &&
    combatSrc.includes('stampHullMark'),
);
ok(
  'combat.sharedNonMutation',
  combatSrc.includes('hullMarkTex.userData.shared = true') &&
    combatSrc.includes('hullMarkMat.userData.shared = true') &&
    combatSrc.includes('hullMarkRoot.userData.shared = true') &&
    !/hullMarkMat\.clone\s*\(/.test(combatSrc) &&
    !/hullMarkTex\.clone\s*\(/.test(combatSrc),
);
ok(
  'combat.noHullMatClone',
  !/shared.*\.clone\s*\(|Material\.clone|material\.clone\s*\(/.test(combatSrc),
);
ok(
  'combat.recycle',
  combatSrc.includes('nextMarkSlot') && combatSrc.includes('parkHullMark'),
);
ok(
  'combat.despawnHide',
  combatSrc.includes("e.type === 'npcDestroyed'") &&
    combatSrc.includes("e.type === 'playerDestroyed'") &&
    combatSrc.includes('slot.sprite.visible = false') &&
    combatSrc.includes('hullMarkRoot.add'),
);
ok(
  'combat.stampOnHullOnly',
  combatSrc.includes('stampHullMark(pos, host)') &&
    combatSrc.includes('spawnHitFx(p.mesh.position, p.family, shielded, s.object)') &&
    combatSrc.includes('spawnHitFx(p.mesh.position, p.family, shielded, playerObj)'),
);
ok('combat.unknowableSkipIntact', combatSrc.includes('if (isUnknowable(s.state.faction)) continue;'));

const id = { px: 0, py: 0, pz: 0, qx: 0, qy: 0, qz: 0, qw: 1, sx: 1, sy: 1, sz: 1 };
const out = { x: 0, y: 0, z: 0 };
ok('math.nanSkip', worldHitToLocal(NaN, 0, 0, id, out) === false);
ok('math.finite', isFiniteVec3(1, 2, 3) === true && isFiniteVec3(1, NaN, 3) === false);
ok('math.identity', worldHitToLocal(1, 2, 3, id, out) === true && out.x === 1 && out.y === 2 && out.z === 3);
const y90 = Math.SQRT1_2;
const rot = { px: 0, py: 0, pz: 0, qx: 0, qy: y90, qz: 0, qw: y90, sx: 1, sy: 1, sz: 1 };
ok(
  'math.yaw90',
  worldHitToLocal(1, 0, 0, rot, out) === true &&
    Math.abs(out.x) < 1e-9 &&
    Math.abs(out.y) < 1e-9 &&
    Math.abs(out.z - 1) < 1e-9,
  JSON.stringify(out),
);
const lifted = { x: 0, y: 0, z: 4 };
liftLocalOffset(lifted, HULL_MARK_LIFT);
ok('math.lift', Math.abs(lifted.z - (4 + HULL_MARK_LIFT)) < 1e-9, String(lifted.z));

const slots = [
  { live: true, stampAt: 3 },
  { live: false, stampAt: 0 },
  { live: true, stampAt: 1 },
];
ok('recycle.freeFirst', nextMarkSlot(slots) === 1);
slots[1].live = true;
ok('recycle.oldest', nextMarkSlot(slots) === 1);
ok('recycle.empty', nextMarkSlot([]) === -1);

if (fails.length) {
  console.log(`FAIL ${fails.length} ${fails.join(', ')}`);
  process.exit(1);
}
console.log('CLEAN');
process.exit(0);
