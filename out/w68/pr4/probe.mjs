// Wave 68 PR4 HUD read-only group 4. Source pins + label strings.
// node out/w68/pr4/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const hudSrc = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');

const {
  hudFamily,
  hudWeaponKey,
  weaponHudLabel,
} = await import('../../../src/systems/hud.js');
const { WEAPONS } = await import('../../../src/game/state.js');
const { LAUNCHER_IDS } = await import('../../../src/game/weapon-fit.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

// --- source: one helper, no cannon fallback at the three sites ---
pin('helper.hudWeaponKey', /export function hudWeaponKey/.test(hudSrc));
pin('helper.weaponHudLabel', /export function weaponHudLabel/.test(hudSrc));
pin('helper.usedLead', /const wKeyLead = hudWeaponKey\(ctx\)/.test(hudSrc));
pin('helper.usedRange', /const wKeyR = hudWeaponKey\(ctx\)/.test(hudSrc));
pin('helper.usedWpn', /const wLabel = weaponHudLabel\(ctx\)/.test(hudSrc));
pin('helper.noDriftFallback', !/WEAPON_KEYS\[\(ctx\.input\.weaponGroup \| 0\) - 1\] \?\? 'cannon'/.test(hudSrc));
pin('helper.emptyComment', /Empty group 4 must not fall through to cannon/.test(hudSrc));

// --- source: textContent only; no new HUD tree ---
pin('no.innerHTML', !/innerHTML/.test(hudSrc));
pin('wpn.textContent', /weaponName\.textContent = wLabel/.test(hudSrc));
pin('no.missileHudChild', !/el\([^)]*root[^)]*missile|el\([^)]*missile[^)]*root/.test(hudSrc));
pin('no.lockBox', !/rw-lock-box|aspect.?ring|incoming-missile|rw-turret-reticle/.test(hudSrc));
pin('no.massPowerBar', !/rw-mass|rw-power-bar|mass\/power/.test(hudSrc));
pin('aux.plant', /el\('section', 'rw-panel rw-defense rw-aux'/.test(hudSrc));
pin('aux.flight', /el\('section', 'rw-panel rw-flight rw-aux'/.test(hudSrc));
pin('aux.heat', /el\('section', 'rw-panel rw-weapon rw-aux'/.test(hudSrc));

// --- source: HUD never writes persist / group keys (not `===` compares) ---
pin('no.write.launcher', !/world\.launcher\s*=[^=]/.test(hudSrc));
pin('no.write.ammo', !/world\.missileAmmo\s*=[^=]/.test(hudSrc));
pin('no.write.turret', !/world\.turret\s*=[^=]/.test(hudSrc));
pin('no.write.hullKind', !/(?:player|p0|pFam|\bp)\.hullKind\s*=[^=]/.test(hudSrc));
pin('no.write.faction', !/(?:player|p0|pFam|\bp|ctx\.player)\.faction\s*=[^=]/.test(hudSrc));
pin('no.write.classKey', !/\.classKey\s*=[^=]/.test(hudSrc));
pin('no.write.throttle', !/input\.throttle\s*=[^=]/.test(hudSrc));

function ctxOf(g, extra = {}) {
  return {
    input: { weaponGroup: g },
    world: {
      launcher: extra.launcher ?? '',
      missileAmmo: extra.ammo ?? 0,
      miningLaser: extra.miningLaser ?? 0,
    },
    player: extra.player ?? { hullKind: 'built', faction: 'freehold' },
  };
}

pin('catalog.missile.range', WEAPONS.missile.range === 720);
pin('catalog.missile.speed', WEAPONS.missile.speed === 260);
pin('catalog.missile.name', WEAPONS.missile.name === 'Dart rack');
pin('catalog.sku.name', LAUNCHER_IDS.dart.name === 'Dart rack');

// --- keys ---
pin('key.cannon', hudWeaponKey(ctxOf(1)) === 'cannon');
pin('key.disruptor', hudWeaponKey(ctxOf(2)) === 'disruptor');
pin('key.mining', hudWeaponKey(ctxOf(3)) === 'mining');
pin('key.g4.empty', hudWeaponKey(ctxOf(4)) === null);
pin('key.g4.seated', hudWeaponKey(ctxOf(4, { launcher: 'dart' })) === 'missile');
pin('key.g4.god', hudWeaponKey(ctxOf(4, { launcher: 'god' })) === null);
pin('key.g4.proto', hudWeaponKey(ctxOf(4, { launcher: '__proto__' })) === null);

// --- labels ---
pin('label.empty', weaponHudLabel(ctxOf(4)) === '4 · —');
pin('label.empty.noCannon', !weaponHudLabel(ctxOf(4)).includes('Energy cannon'));
pin('label.seated.ammo', weaponHudLabel(ctxOf(4, { launcher: 'dart', ammo: 6 })) === '4 · Dart rack · 6');
pin('label.seated.zero', weaponHudLabel(ctxOf(4, { launcher: 'dart', ammo: 0 })) === '4 · Dart rack · 0');
pin('label.seated.strAmmo', weaponHudLabel(ctxOf(4, { launcher: 'dart', ammo: '6' })) === '4 · Dart rack · 0');
pin('label.seated.frac', weaponHudLabel(ctxOf(4, { launcher: 'dart', ammo: 2.9 })) === '4 · Dart rack · 0');
pin('label.xss.ammo', weaponHudLabel(ctxOf(4, { launcher: 'dart', ammo: '<img>' })) === '4 · Dart rack · 0');
pin('label.cannon', weaponHudLabel(ctxOf(1)) === '1 · Energy cannon');
pin('label.mining', weaponHudLabel(ctxOf(3)) === '3 · Mining laser Mk I');
pin('label.mining.mk2', weaponHudLabel(ctxOf(3, { miningLaser: 1 })) === '3 · Bore laser Mk II');

// --- RANGE / lead via the same key (no cannon 500 on empty 4) ---
function rangeOf(ctx) {
  const wKey = hudWeaponKey(ctx);
  if (wKey === 'mining') return 115; // not used here
  return WEAPONS[wKey]?.range ?? 0;
}
function speedOf(ctx) {
  const wKey = hudWeaponKey(ctx);
  if (wKey === 'mining') return 0;
  return WEAPONS[wKey]?.speed ?? 0;
}
pin('range.cannon', rangeOf(ctxOf(1)) === 500);
pin('range.g4.empty', rangeOf(ctxOf(4)) === 0);
pin('range.g4.seated', rangeOf(ctxOf(4, { launcher: 'dart' })) === 720);
pin('lead.g4.empty', speedOf(ctxOf(4)) === 0);
pin('lead.g4.seated', speedOf(ctxOf(4, { launcher: 'dart' })) === 260);
pin('lead.mining', speedOf(ctxOf(3)) === 0);

// --- living hull + dart: weapons never pick HUD ---
pin(
  'family.living.dart',
  hudFamily({ player: { hullKind: 'living', faction: 'unknowables' } }) === 'bio',
);
pin(
  'family.built.dart',
  hudFamily({ player: { hullKind: 'built', faction: 'freehold' } }) === 'mech',
);

if (fails.length) {
  console.error('FAIL', fails.join(' | '));
  process.exit(1);
}
console.log('ok pr4 hud pins', [
  'hudWeaponKey', '4 · —', '4 · Dart rack · 6',
  'RANGE 720/0', 'lead 260/0', 'bio living', 'textContent',
].join(', '));
