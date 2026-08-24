// Wave 92 BIO-04 — standalone pins (do not edit scripts/boot-test.mjs).
// node out/w92/bio04/boot-pins.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const combatSrc = src('src/systems/combat.js');
const controlsSrc = src('src/systems/controls.js');
const ctxSrc = src('src/core/ctx.js');
const hudSrc = src('src/systems/hud.js');
const psiSrc = src('src/game/psionic.js');
const stateSrc = src('src/game/state.js');
const stationSrc = src('src/systems/station.js');
const hangarSrc = src('src/game/hangar.js');
const saveSrc = src('src/game/save.js');

const { WEAPONS, HEAT, createShipState, applyHit } = await import('../../../src/game/state.js');
const { canFirePsionic, psionicCatalogOk } = await import('../../../src/game/psionic.js');
const { hudWeaponKey, weaponHudLabel, hudFamily } = await import('../../../src/systems/hud.js');
const { createCtx } = await import('../../../src/core/ctx.js');
const { initCombat } = await import('../../../src/systems/combat.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
}

function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: {},
    width: 64,
    height: 64,
    getContext() {
      const gradient = { addColorStop() {} };
      return {
        canvas: el,
        createRadialGradient: () => gradient,
        createLinearGradient: () => gradient,
        fillRect() {},
        fill() {},
        beginPath() {},
        arc() {},
        fillStyle: '',
      };
    },
  };
  return el;
}
if (!globalThis.window) {
  globalThis.window = {
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    addEventListener() {},
  };
}
if (!globalThis.document) {
  globalThis.document = {
    createElement: (t) => makeEl(t),
    createElementNS: (_, t) => makeEl(t),
    addEventListener() {},
  };
}
if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
}

const PSI_HEX = 0xff6ad5;
const ENERGY_HEX = 0x53f2ff;
const DISRUPTOR_HEX = 0xc86bff;
const MINING_HEX = 0x51ff9e;
const MISSILE_HEX = 0xff8a2a;

// --- catalog ---
pin('catalog.exists', Object.hasOwn(WEAPONS, 'psionic'));
pin('catalog.name', WEAPONS.psionic.name === 'Psionic bolt');
pin('catalog.nums', WEAPONS.psionic.damage === 12 && WEAPONS.psionic.rof === 3
  && WEAPONS.psionic.speed === 520 && WEAPONS.psionic.range === 420
  && WEAPONS.psionic.heatPerShot === 8 && WEAPONS.psionic.family === 'psionic');
pin('catalog.notBeam', WEAPONS.psionic.beam !== true);
pin('catalog.notSeeker', !Object.hasOwn(WEAPONS.psionic, 'turn'));
pin('catalogOk', psionicCatalogOk() === true);

const dummy = createShipState('light', { name: 'W92' });
pin('no.power', !Object.hasOwn(dummy, 'power') && dummy.power === undefined);
pin('no.psi', !Object.hasOwn(dummy, 'psi') && dummy.psi === undefined
  && dummy.psiCap === undefined && dummy.psiAmmo === undefined && dummy.canPsi === undefined);
pin('heat.pool', dummy.heat === 0 && HEAT.max === 100);

pin('family.hex.source', /FAMILY_COLORS\.psionic = 0xff6ad5/.test(combatSrc)
  || /psionic: 0xff6ad5/.test(combatSrc));
pin('family.hex.unique', PSI_HEX !== ENERGY_HEX && PSI_HEX !== DISRUPTOR_HEX
  && PSI_HEX !== MINING_HEX && PSI_HEX !== MISSILE_HEX);

pin('psi.noHangarImport', !/hangar\.js/.test(psiSrc));
pin('psi.ownKeyGrafted', psiSrc.includes("Object.prototype.hasOwnProperty.call(obj, 'grafted')")
  && psiSrc.includes('obj.grafted === true'));
pin('psi.noBeautiful', !/isBeautiful/.test(psiSrc) && !/hudFamily/.test(psiSrc));
pin('psi.noInnerHTML', !/innerHTML/.test(psiSrc));

const living = { player: { hullKind: 'living', faction: 'independent' } };
const starterNoKind = { player: { faction: 'independent', classKey: 'light', name: 'player' } };
pin('elig.starterNoKindField', !Object.prototype.hasOwnProperty.call(starterNoKind.player, 'hullKind'));
const built = { player: { hullKind: 'built', faction: 'independent' } };
const grafted = { player: { hullKind: 'built', grafted: true, faction: 'independent' } };
const protoGraft = { player: Object.assign(Object.create({ grafted: true }), { hullKind: 'built' }) };
const oneGraft = { player: { hullKind: 'built', grafted: 1 } };
const missing = { player: null };
pin('elig.living', canFirePsionic(living) === true);
pin('elig.starterUnset', canFirePsionic(starterNoKind) === true);
pin('elig.emptyKind', canFirePsionic({ player: { hullKind: '' } }) === true);
pin('elig.builtDry', canFirePsionic(built) === false);
pin('elig.grafted', canFirePsionic(grafted) === true);
pin('elig.proto', canFirePsionic(protoGraft) === false);
pin('elig.one', canFirePsionic(oneGraft) === false);
pin('elig.missing', canFirePsionic(missing) === false);
pin('elig.noPlayer', canFirePsionic({}) === false);

function hudCtx(extra = {}) {
  const player = extra.player ?? {};
  if (Object.prototype.hasOwnProperty.call(extra, 'hullKind')) player.hullKind = extra.hullKind;
  else if (!extra.player) player.hullKind = 'living';
  if (extra.grafted === true) player.grafted = true;
  return {
    player,
    input: { weaponGroup: extra.weaponGroup ?? 5 },
    world: { launcher: extra.launcher ?? '', missileAmmo: 0, miningLaser: 0 },
  };
}
pin('hud.key.5', hudWeaponKey(hudCtx({ weaponGroup: 5 })) === 'psionic');
pin('hud.key.1', hudWeaponKey(hudCtx({ weaponGroup: 1 })) === 'cannon');
pin('hud.key.2', hudWeaponKey(hudCtx({ weaponGroup: 2 })) === 'disruptor');
pin('hud.key.3', hudWeaponKey(hudCtx({ weaponGroup: 3 })) === 'mining');
pin('hud.key.0', hudWeaponKey(hudCtx({ weaponGroup: 0 })) === null);
pin('hud.key.6', hudWeaponKey(hudCtx({ weaponGroup: 6 })) === null);
pin('hud.key.7', hudWeaponKey(hudCtx({ weaponGroup: 7 })) === null);
pin('hud.label.living', weaponHudLabel(hudCtx({ hullKind: 'living', weaponGroup: 5 })) === '5 · Psionic bolt');
pin('hud.label.starterUnset', weaponHudLabel({
  player: { faction: 'independent', classKey: 'light', name: 'player' },
  input: { weaponGroup: 5 },
  world: { launcher: '', missileAmmo: 0, miningLaser: 0 },
}) === '5 · Psionic bolt');
pin('hud.label.built', weaponHudLabel(hudCtx({ hullKind: 'built', weaponGroup: 5 })) === '5 · —');
pin('hud.label.grafted', weaponHudLabel(hudCtx({ hullKind: 'built', grafted: true, weaponGroup: 5 })) === '5 · Psionic bolt');
pin('hud.label.noNotAvailable', !weaponHudLabel(hudCtx({ hullKind: 'built', weaponGroup: 5 })).includes('not available'));
pin('hud.family.graftedMech', hudFamily(hudCtx({ hullKind: 'built', grafted: true })) === 'mech');
pin('hud.neverWritesHullKind', !/player\.hullKind\s*=/.test(hudSrc) && !/ctx\.player\.hullKind\s*=/.test(hudSrc));
pin('hud.noInnerHTML', !/innerHTML/.test(hudSrc));
pin('hud.closeCannon', /WEAPON_KEYS\[g - 1\] \?\? null/.test(hudSrc));
pin('hud.noCannonFallback', !/WEAPON_KEYS\[g - 1\] \?\? 'cannon'/.test(hudSrc));

pin('ctrl.digit5', /case 'Digit5':[\s\S]{0,120}?input\.weaponGroup = 5/.test(controlsSrc));
pin('ctrl.tracked5', /'Digit5'/.test(controlsSrc));
pin('ctrl.noPrevent5', /const PREVENT_DEFAULT = new Set\(\['Space'\]\)/.test(controlsSrc));
pin('ctrl.keep1234', /case 'Digit1':[\s\S]*?weaponGroup = 1[\s\S]*?case 'Digit4':[\s\S]*?weaponGroup = 4/.test(controlsSrc));
pin('ctrl.untracked089', !/'Digit0'/.test(controlsSrc) && !/'Digit8'/.test(controlsSrc) && !/'Digit9'/.test(controlsSrc));
pin('ctrl.help15', controlsSrc.includes('1/2/3/4/5 — weapon group'));

pin('dock.repairDigit5', stationSrc.includes("'repair'")
  && /DOCK_KEY_SERVICES = Object\.freeze\(\['market', 'jobs', 'bar', 'feed', 'repair'/.test(stationSrc));
pin('dock.launch8', stationSrc.includes("'launch'"));
pin('dock.epics9', stationSrc.includes("'epics'"));
pin('dock.shipyard0', stationSrc.includes("'shipyard'"));

pin('combat.closeCannon', /Object\.hasOwn\(GROUP_WEAPON, g\) \? GROUP_WEAPON\[g\] : null/.test(combatSrc));
pin('combat.noCannonFallback', !/GROUP_WEAPON\[g\] \?\? 'cannon'/.test(combatSrc));
pin('combat.group5', /if \(g === 5\) return psionicCatalogOk\(\) \? 'psionic' : null/.test(combatSrc));
pin('combat.npcRefuse', /wkey === 'psionic' \|\| WEAPONS\[wkey\]\?\.family === 'psionic'/.test(combatSrc));
pin('combat.noSecondBeam', (combatSrc.match(/beam === true/g) || []).length <= 2);
pin('combat.unkSkip', combatSrc.includes('if (isUnknowable(s.state.faction)) continue;'));
pin('combat.emitLiteral', combatSrc.includes("ctx.emit('playerFire', { weapon: 'psionic' })"));
pin('combat.noSpreadPlayer', !/emit\('playerFire',\s*\{\s*\.\.\./.test(combatSrc));
pin('hangar.untouchedGraft', hangarSrc.includes("obj.grafted === true"));
pin('save.noPsiKey', !/psionic|psiCap|psiAmmo|canPsi/.test(saveSrc.match(/WORLD_FIELDS[\s\S]{0,800}/)?.[0] || ''));

const unk = createShipState('light', { name: 'U', faction: 'unknowables' });
const missed = applyHit(unk, { damage: 12, family: 'psionic', facet: 'fore', now: 1 });
pin('unk.applyHit', Array.isArray(missed) && missed.length === 0 && unk.hull === unk.hullMax
  && unk.screen === unk.screenMax);

function countBolts(scene, hex) {
  let n = 0;
  scene.traverse((o) => {
    if (o.isMesh && o.visible && o.geometry && o.geometry.type === 'SphereGeometry'
      && o.material && o.material.color && o.material.color.getHex() === hex) n++;
  });
  return n;
}

function harness(extra = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 5000);
  const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {}, setAnimationLoop() {}, render() {} };
  const ctx = createCtx({ scene, camera, renderer });
  ctx.player = createShipState('light', { name: extra.name ?? 'W92fire' });
  if (extra.omitHullKind === true) delete ctx.player.hullKind;
  else ctx.player.hullKind = extra.hullKind ?? 'living';
  if (extra.grafted === true) ctx.player.grafted = true;
  ctx.ship.object = new THREE.Object3D();
  ctx.ship.object.position.set(0, 0, 0);
  ctx.ship.object.quaternion.identity();
  scene.add(ctx.ship.object);
  ctx.ship.velocity.set(0, 0, 0);
  camera.position.set(0, 0, 0);
  camera.quaternion.identity();
  camera.updateMatrixWorld();
  ctx.flags.firstPerson = true;
  ctx.flags.docked = extra.docked === true;
  ctx.targets.reticleScreen = { x: 0, y: 0 };
  ctx.input.weaponGroup = extra.weaponGroup ?? 5;
  ctx.input.fireHeld = extra.fireHeld !== false;
  ctx.settings.reducedMotion = extra.reducedMotion === true;
  const combat = initCombat(ctx);
  return { ctx, combat, scene };
}

function step(h, n = 1) {
  const dt = 1 / 60;
  const out = [];
  for (let i = 0; i < n; i++) {
    h.ctx.elapsed += dt;
    h.ctx.world.time += dt;
    h.combat.update(dt);
    out.push(...h.ctx.events);
    h.ctx.lastEvents = h.ctx.events;
    h.ctx.events = [];
  }
  return out;
}

const liveH = harness({ hullKind: 'living', weaponGroup: 5 });
const liveEv = step(liveH, 1);
pin('live.fires', countBolts(liveH.scene, PSI_HEX) === 1);
pin('live.heat', liveH.ctx.player.heat === 8);
pin('live.emit', liveEv.some((e) => e.type === 'playerFire' && e.weapon === 'psionic'
  && !Object.hasOwn(e, 'player') && !Object.hasOwn(e, 'world')));
pin('live.notEnergyTint', countBolts(liveH.scene, ENERGY_HEX) === 0);

const starterH = harness({ omitHullKind: true, weaponGroup: 5 });
pin('starter.noHullKindField', !Object.prototype.hasOwnProperty.call(starterH.ctx.player, 'hullKind'));
const starterEv = step(starterH, 1);
pin('starter.fires', countBolts(starterH.scene, PSI_HEX) === 1);
pin('starter.heat', starterH.ctx.player.heat === 8);
pin('starter.emit', starterEv.some((e) => e.type === 'playerFire' && e.weapon === 'psionic'));

const builtH = harness({ hullKind: 'built', weaponGroup: 5 });
const builtEv = step(builtH, 3);
pin('built.dryBolts', countBolts(builtH.scene, PSI_HEX) === 0 && countBolts(builtH.scene, ENERGY_HEX) === 0);
pin('built.dryHeat', builtH.ctx.player.heat === 0);
pin('built.dryEmit', !builtEv.some((e) => e.type === 'playerFire'));

const graftH = harness({ hullKind: 'built', grafted: true, weaponGroup: 5 });
const graftEv = step(graftH, 1);
pin('graft.fires', countBolts(graftH.scene, PSI_HEX) === 1);
pin('graft.heat', graftH.ctx.player.heat === 8);
pin('graft.emit', graftEv.some((e) => e.type === 'playerFire' && e.weapon === 'psionic'));

const protoH = harness({ hullKind: 'built', weaponGroup: 5 });
Object.setPrototypeOf(protoH.ctx.player, { grafted: true });
const protoEv = step(protoH, 2);
pin('proto.dry', countBolts(protoH.scene, PSI_HEX) === 0 && protoH.ctx.player.heat === 0
  && !protoEv.some((e) => e.type === 'playerFire'));

const unkGrp = harness({ hullKind: 'living', weaponGroup: 6 });
const unkEv = step(unkGrp, 1);
pin('unkGroup.notCannon', countBolts(unkGrp.scene, ENERGY_HEX) === 0 && unkGrp.ctx.player.heat === 0
  && !unkEv.some((e) => e.type === 'playerFire'));
const zeroGrp = harness({ hullKind: 'living', weaponGroup: 0 });
step(zeroGrp, 1);
pin('group0.notCannon', countBolts(zeroGrp.scene, ENERGY_HEX) === 0 && zeroGrp.ctx.player.heat === 0);

const g1 = harness({ hullKind: 'living', weaponGroup: 1 });
const g1ev = step(g1, 1);
pin('digit1.cannon', countBolts(g1.scene, ENERGY_HEX) === 1 && g1.ctx.player.heat === 4
  && g1ev.some((e) => e.type === 'playerFire' && e.weapon === 'cannon'));
const g2 = harness({ hullKind: 'living', weaponGroup: 2 });
step(g2, 1);
pin('digit2.disruptor', countBolts(g2.scene, DISRUPTOR_HEX) === 1 && g2.ctx.player.heat === 6);

const dockH = harness({ hullKind: 'living', weaponGroup: 5, docked: true });
step(dockH, 2);
pin('dock.cold', countBolts(dockH.scene, PSI_HEX) === 0 && dockH.ctx.player.heat === 0);

const rmH = harness({ hullKind: 'living', weaponGroup: 5, reducedMotion: true });
step(rmH, 1);
pin('reduced.simulates', countBolts(rmH.scene, PSI_HEX) === 1 && rmH.ctx.player.heat === 8);

const npcH = harness({ hullKind: 'living', weaponGroup: 1, fireHeld: false });
const npcObj = new THREE.Object3D();
npcObj.position.set(0, 0, 40);
npcH.scene.add(npcObj);
const npcShip = { object: npcObj, state: createShipState('cutter', { faction: 'redledger', name: 'NpcPsi' }) };
npcH.ctx.emit('npcFire', { ship: npcShip, weapon: 'psionic', target: 'player' });
step(npcH, 1);
pin('npc.refusePsi', countBolts(npcH.scene, PSI_HEX) === 0);

const hitH = harness({ hullKind: 'living', weaponGroup: 5 });
const field = new THREE.Object3D();
field.position.set(0, 0, -20);
hitH.scene.add(field);
const fieldShip = {
  object: field,
  state: createShipState('light', { faction: 'unknowables', name: 'Field' }),
};
hitH.ctx.ships.push(fieldShip);
const hull0 = fieldShip.state.hull;
const screen0 = fieldShip.state.screen;
step(hitH, 8);
pin('unk.liveMiss', fieldShip.state.hull === hull0 && fieldShip.state.screen === screen0);
pin('unk.boltStillLive', countBolts(hitH.scene, PSI_HEX) === 1);

if (fails.length) {
  console.log('WAVE92 BIO04 FAIL');
  for (const f of fails) console.log('  FAIL', f);
  process.exitCode = 1;
} else {
  console.log('WAVE92 BIO04 PASS', {
    catalog: WEAPONS.psionic.name,
    hex: '0x' + PSI_HEX.toString(16),
    livingHeat: liveH.ctx.player.heat,
    starterHeat: starterH.ctx.player.heat,
    builtDry: builtH.ctx.player.heat,
    graftedHeat: graftH.ctx.player.heat,
  });
}
