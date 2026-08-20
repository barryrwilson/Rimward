// Wave 68 PR5 — boot pins live in scripts/boot-test.mjs (WAVE68 + wave64 heal).
// This wrapper re-runs the unit/helper pins without the full boot graph.
// Verify: npm run test:boot  (log line: wave68 weapons)
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const { WEAPONS, MOUNT_TABLE, createShipState } = await import('../../../src/game/state.js');
const { LAUNCHER_IDS, healMissileAmmo } = await import('../../../src/game/weapon-fit.js');
const {
  writeMountedGear, switchTo, sanitizeHangar, spendMissileAmmo, sanitizeHangarRecord,
} = await import('../../../src/game/hangar.js');
const { purchaseYardHull } = await import('../../../src/game/shipyard.js');
const { restore, WORLD_FIELDS } = await import('../../../src/game/save.js');
const { armOutfitPapers, confirmOutfitPapers, DOCK_KEY_SERVICES } = await import('../../../src/systems/station.js');
const { hudWeaponKey, weaponHudLabel } = await import('../../../src/systems/hud.js');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const boot = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');
const combatSrc = readFileSync(join(root, 'src/systems/combat.js'), 'utf8');
const controlsSrc = readFileSync(join(root, 'src/systems/controls.js'), 'utf8');
const ctxSrc = readFileSync(join(root, 'src/core/ctx.js'), 'utf8');
const stationSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const events = ctxSrc.slice(ctxSrc.indexOf('// --- event queue.'), ctxSrc.indexOf('events: []'));
const level1 = stationSrc.slice(stationSrc.indexOf('if (ui.level === 1) {'), stationSrc.indexOf('// level 2'));

const fails = [];
function pin(name, cond) {
  if (!cond) fails.push(name);
}

pin('boot.hasWave68', boot.includes("console.log('wave68 weapons:'"));
pin('boot.healLauncherEmpty', boot.includes('launcherEmpty: healed.launcher === \'\''));
pin('boot.noAbsentLauncher', !boot.includes("noMissiles: !('missiles' in healed) && !('launcher' in healed)"));

function ctxOf(extra = {}) {
  const classKey = extra.classKey ?? 'light';
  const player = createShipState(classKey, { name: 'W68' });
  player.hullKind = extra.hullKind ?? 'living';
  player.classKey = classKey;
  return {
    flags: { docked: true, combat: false, paused: false },
    world: {
      currentSystem: 'freehold',
      credits: extra.credits ?? 20000,
      fear: 0,
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
      launcher: extra.launcher ?? '',
      missileAmmo: extra.missileAmmo ?? 0,
      turret: extra.turret ?? '',
      hangar: extra.hangar ?? {
        mountedId: 'hull_a',
        hulls: [
          {
            id: 'hull_a', hullKind: player.hullKind, classKey, faction: 'independent', name: 'A',
            scanner: 0, miningLaser: 0, concealedMounts: false, cargoCapacity: 20, cargo: [],
          },
          {
            id: 'hull_b', hullKind: 'built', classKey: 'heavy', faction: 'freehold', name: 'B',
            scanner: 0, miningLaser: 0, concealedMounts: false, cargoCapacity: 20, cargo: [],
          },
        ],
      },
    },
    systems: { freehold: { faction: 'freehold' } },
    cargo: [],
    cargoCapacity: 20,
    player,
    input: { weaponGroup: extra.weaponGroup ?? 1 },
    ship: { object: null },
    emit() {},
    ships: [],
    gate: { jumping: false },
  };
}

pin('cat.missileFamily', WEAPONS.missile.family === 'missile' && WEAPONS.missile.beam !== true);
pin('cat.missileStats', WEAPONS.missile.damage === 22 && WEAPONS.missile.range === 720);
pin('cat.turret', WEAPONS.turret.family === 'energy' && WEAPONS.turret.damage === 4);
pin('cat.mount', MOUNT_TABLE.light.missile === 0 && MOUNT_TABLE.heavy.missile === 2);
pin('cat.ids', Object.hasOwn(LAUNCHER_IDS, 'dart') && !Object.hasOwn(LAUNCHER_IDS, 'god'));
pin('cat.heal', healMissileAmmo('dart', 99) === 8 && healMissileAmmo('dart', '2') === 0);

const lightRec = sanitizeHangarRecord({ id: 'l1', classKey: 'light', launcher: 'dart', missileAmmo: 99 });
const heavyRec = sanitizeHangarRecord({ id: 'h1', classKey: 'heavy', launcher: 'dart', missileAmmo: 99 });
pin('heal.light', lightRec.launcher === '' && lightRec.missileAmmo === 0);
pin('heal.heavy', heavyRec.launcher === 'dart' && heavyRec.missileAmmo === 8);

const lightWrite = ctxOf({ classKey: 'light' });
sanitizeHangar(lightWrite);
const lightRow = writeMountedGear(lightWrite, { launcher: 'dart', missileAmmo: 99, missiles: 9, loadout: { x: 1 } });
pin('write.lightEmpty', lightRow.launcher === '' && lightWrite.world.launcher === '');
pin('write.noJunk', !('missiles' in lightRow) && !('loadout' in lightRow));

const dest = ctxOf({ classKey: 'light', launcher: 'keep', missileAmmo: 7, turret: 'keep' });
restore(dest, {
  v: 1,
  world: {
    currentSystem: 'freehold',
    launcher: 'dart',
    missileAmmo: 99,
    turret: 'auto',
    hangar: { mountedId: 'l1', hulls: [{ id: 'l1', classKey: 'light', faction: 'independent' }] },
  },
});
pin('restore.empty', dest.world.launcher === '' && dest.world.missileAmmo === 0 && dest.world.turret === '');

const heavyWrite = ctxOf({ classKey: 'light' });
sanitizeHangar(heavyWrite);
pin('switch.heavy', switchTo(heavyWrite, 'hull_b').ok === true);
const wrote = writeMountedGear(heavyWrite, { launcher: 'dart', missileAmmo: 99 });
pin('write.heavy', wrote.launcher === 'dart' && wrote.missileAmmo === 8);
pin('spend.lockstep', spendMissileAmmo(heavyWrite, 1) === 1
  && wrote.missileAmmo === 7 && heavyWrite.world.missileAmmo === 7);

const buyIso = ctxOf({ classKey: 'light', credits: 20000 });
buyIso.world.reputation = { freehold: 0 };
sanitizeHangar(buyIso);
switchTo(buyIso, 'hull_b');
writeMountedGear(buyIso, { launcher: 'dart', missileAmmo: 8 });
const bought = purchaseYardHull(buyIso, 'heavy');
const stock = buyIso.world.hangar.hulls.find((h) => h.id !== 'hull_a' && h.id !== 'hull_b');
pin('stock.ok', bought.ok === true);
pin('stock.empty', stock?.launcher === '' && stock?.missileAmmo === 0 && stock?.turret === '');
pin('fields', WORLD_FIELDS.includes('launcher') && WORLD_FIELDS.includes('missileAmmo') && WORLD_FIELDS.includes('turret'));

const papers = ctxOf({
  classKey: 'heavy',
  hangar: {
    mountedId: 'h1',
    hulls: [{
      id: 'h1', classKey: 'heavy', hullKind: 'built', faction: 'independent', name: 'H',
      scanner: 0, miningLaser: 0, concealedMounts: false, cargoCapacity: 20, cargo: [],
    }],
  },
});
papers.player.classKey = 'heavy';
sanitizeHangar(papers);
const ui = { level: 2, service: 'outfitting', outfitPending: null, notice: '' };
pin('arm.ok', armOutfitPapers(papers, ui, 8) === true && ui.outfitPending?.id === 'dart');
pin('arm.noDebit', papers.world.credits === 20000 && papers.world.launcher === '');
const confirmed = confirmOutfitPapers(papers, ui);
pin('confirm.debit', confirmed.ok === true && confirmed.price === 6500 && papers.world.credits === 13500);
pin('confirm.seat', papers.world.launcher === 'dart' && papers.world.hangar.hulls[0].launcher === 'dart'
  && papers.world.missileAmmo === 8);

pin('d8.launch', DOCK_KEY_SERVICES[7] === 'launch');
pin('d8.level1', !/n === 8/.test(level1) && !/armOutfitPapers/.test(level1));

const hudEmpty = ctxOf({ weaponGroup: 4 });
pin('hud.digit4', /case 'Digit4':[\s\S]{0,180}?input\.weaponGroup = 4/.test(controlsSrc));
pin('hud.empty', hudWeaponKey(hudEmpty) === null && weaponHudLabel(hudEmpty) === '4 · —');
pin('fire.pool', /const MISSILE_POOL = 8/.test(combatSrc));
pin('fire.emptyNoCannon', /function groupWeapon\(ctx\)/.test(combatSrc)
  && /if \(g === 4\)/.test(combatSrc)
  && /Do not fall through to cannon/.test(combatSrc));
pin('fire.noIncoming', !events.includes('missileIncoming') && !/missileIncoming/.test(ctxSrc));

if (fails.length) {
  console.log('W68 PR5 PROBE FAIL');
  for (const f of fails) console.log('  ', f);
  process.exit(1);
}
console.log('W68 PR5 PROBE PASS', fails.length);
process.exit(0);
