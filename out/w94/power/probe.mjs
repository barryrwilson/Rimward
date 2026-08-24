// Wave 94 POWER ledger — standalone pins (do not edit scripts/boot-test.mjs).
// node out/w94/power/probe.mjs
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
const hudSrc = src('src/systems/hud.js');
const hudCss = src('src/ui/hud.css');
const shipSrc = src('src/systems/ship.js');
const stateSrc = src('src/game/state.js');
const saveSrc = src('src/game/save.js');

const {
  WEAPONS, HEAT, POWER, SHIP_CLASSES, createShipState, tickShipState,
} = await import('../../../src/game/state.js');
const { createCtx } = await import('../../../src/core/ctx.js');
const { initCombat } = await import('../../../src/systems/combat.js');
const { initHud } = await import('../../../src/systems/hud.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

function makeEl(tag = 'div') {
  const node = {
    tagName: String(tag).toUpperCase(),
    children: [],
    parent: null,
    style: { setProperty() {}, width: '', display: '' },
    dataset: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); node.className = [...this._s].join(' '); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); node.className = [...this._s].join(' '); },
      toggle(c, f) {
        (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c);
        node.className = [...this._s].join(' ');
      },
      contains(c) { return this._s.has(c); },
    },
    appendChild(c) {
      c.parent = node;
      this.children.push(c);
      return c;
    },
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    offsetWidth: 168,
    offsetHeight: 120,
    width: 64,
    height: 64,
    getContext() {
      const gradient = { addColorStop() {} };
      return {
        canvas: node,
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
  let className = '';
  Object.defineProperty(node, 'className', {
    get() { return className; },
    set(v) {
      className = String(v);
      node.classList._s = new Set(className.split(/\s+/).filter(Boolean));
    },
  });
  let text = '';
  Object.defineProperty(node, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); },
  });
  return node;
}

function findClass(node, cls) {
  if (node.classList && node.classList.contains(cls)) return node;
  const kids = node.children || [];
  for (let i = 0; i < kids.length; i++) {
    const hit = findClass(kids[i], cls);
    if (hit) return hit;
  }
  return null;
}

function collectText(node, into = []) {
  if (node.textContent) into.push(node.textContent);
  const kids = node.children || [];
  for (let i = 0; i < kids.length; i++) collectText(kids[i], into);
  return into;
}

if (!globalThis.window) {
  globalThis.window = {
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    addEventListener() {}, removeEventListener() {},
  };
}
const store = new Map();
if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

const hudRoot = makeEl('div');
hudRoot.id = 'hud';
const head = makeEl('head');
globalThis.document = {
  head,
  body: makeEl('body'),
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, nodeValue: t, remove() {} }),
  getElementById: (id) => (id === 'hud' ? hudRoot : null),
  addEventListener() {},
};

pin('power.nums', POWER.max === 100 && POWER.regenPerSec === 8
  && POWER.afterburnerPerSec === 16 && POWER.afterburnerMin === 15);
pin('psi.powerPerShot', WEAPONS.psionic.powerPerShot === 10 && WEAPONS.psionic.heatPerShot === 8);
pin('heat.untouched', HEAT.max === 100 && HEAT.coolPerSec === 12);
pin('cannon.noPowerField', !Object.hasOwn(WEAPONS.cannon, 'powerPerShot')
  && !Object.hasOwn(WEAPONS.disruptor, 'powerPerShot')
  && !Object.hasOwn(WEAPONS.mining, 'powerPerShot')
  && !Object.hasOwn(WEAPONS.missile, 'powerPerShot')
  && !Object.hasOwn(WEAPONS.turret, 'powerPerShot'));
pin('class.noPowerField', Object.keys(SHIP_CLASSES).every((k) => !Object.hasOwn(SHIP_CLASSES[k], 'power')));

const dummy = createShipState('light', { name: 'W94' });
pin('ship.powerMax', dummy.power === POWER.max && Object.hasOwn(dummy, 'power'));
pin('ship.noPsiCap', dummy.psiCap === undefined && dummy.psiAmmo === undefined
  && dummy.triad === undefined && dummy.capacitor === undefined);

dummy.power = 50;
tickShipState(dummy, 1, 1);
pin('regen.oneSec', dummy.power === 58, String(dummy.power));

const drain = createShipState('cutter');
drain.power = 40;
drain.powerDrainThisFrame = true;
tickShipState(drain, 1, 1);
pin('regen.skipWhenBurn', drain.power === 40 && drain.powerDrainThisFrame === false, String(drain.power));

const clamp = createShipState('ace');
clamp.power = 99;
tickShipState(clamp, 1, 2);
pin('regen.clampMax', clamp.power === 100, String(clamp.power));

const floor = createShipState('heavy');
floor.power = -4;
tickShipState(floor, 1, 0);
pin('regen.clampMin', floor.power === 0, String(floor.power));

const worldBlock = saveSrc.match(/WORLD_FIELDS[\s\S]{0,1200}/)?.[0] || '';
pin('save.noPowerKey', !/\bpower\b/.test(worldBlock));
pin('state.noWorldField', !/WORLD_FIELDS/.test(stateSrc) || !/power/.test(stateSrc.match(/WORLD_FIELDS[\s\S]{0,200}/)?.[0] || ''));

pin('hud.pwrLabel', hudSrc.includes("makeBar(powerPanel, 'PWR', 'rw-power')"));
pin('hud.sideCol', hudSrc.includes("el('div', 'rw-side-col', bottom)")
  && /rw-side-col[\s\S]{0,180}rw-power-panel/.test(hudSrc));
pin('hud.noAimPwr', !/rw-reticle[\s\S]{0,80}PWR/.test(hudSrc)
  && !/rw-lead[\s\S]{0,80}PWR/.test(hudSrc)
  && !/makeBar\([^)]*reticle/.test(hudSrc));
pin('css.pwrFill', /\.rw-power \.rw-bar-fill/.test(hudCss));
pin('css.noAimGauge', !/\.rw-reticle[^{]*power/.test(hudCss)
  && !/\.rw-lead[^{]*power/.test(hudCss));
pin('css.noPwrPulse', !/\.rw-power[^{]*\{[^}]*animation/.test(hudCss));
pin('css.reducedKeepsBar', /body\.rw-reduced-motion #hud \*/.test(hudCss)
  && /animation: none !important/.test(hudCss));

pin('ship.gateMin', shipSrc.includes('(ctx.player?.power ?? 0) >= POWER.afterburnerMin'));
pin('ship.drain', shipSrc.includes('POWER.afterburnerPerSec * dt')
  && shipSrc.includes('p.powerDrainThisFrame = true'));
pin('ship.cutCooldown', /p\.power <= 0[\s\S]{0,220}burnerReadyAt/.test(shipSrc));
pin('combat.psiDry', combatSrc.includes('psiDry') && combatSrc.includes('w.powerPerShot'));
pin('combat.spendOnSpawn', /if \(bolt\) \{[\s\S]{0,420}wkey === 'psionic'[\s\S]{0,180}powerPerShot/.test(combatSrc));
pin('combat.noInnerHTML', !/innerHTML/.test(combatSrc));
pin('hud.noInnerHTML', !/innerHTML/.test(hudSrc));

const PSI_HEX = 0xff6ad5;
const ENERGY_HEX = 0x53f2ff;

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
  ctx.player = createShipState('light', { name: extra.name ?? 'W94fire' });
  ctx.player.hullKind = extra.hullKind ?? 'living';
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
  if (Number.isFinite(extra.power)) ctx.player.power = extra.power;
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

const liveH = harness({ hullKind: 'living', weaponGroup: 5, power: 100 });
const liveEv = step(liveH, 1);
pin('live.psiBolt', countBolts(liveH.scene, PSI_HEX) === 1);
pin('live.psiHeat', liveH.ctx.player.heat === 8, String(liveH.ctx.player.heat));
pin('live.psiPower', Math.abs(liveH.ctx.player.power - 90) < 1e-9, String(liveH.ctx.player.power));
pin('live.emit', liveEv.some((e) => e.type === 'playerFire' && e.weapon === 'psionic'));

const dryH = harness({ hullKind: 'living', weaponGroup: 5, power: 9 });
const dryEv = step(dryH, 1);
const dryExpect = Math.min(POWER.max, 9 + POWER.regenPerSec / 60);
pin('dry.noBolt', countBolts(dryH.scene, PSI_HEX) === 0 && countBolts(dryH.scene, ENERGY_HEX) === 0);
pin('dry.noHeat', dryH.ctx.player.heat === 0, String(dryH.ctx.player.heat));
pin('dry.regenOnly', Math.abs(dryH.ctx.player.power - dryExpect) < 1e-9, String(dryH.ctx.player.power));
pin('dry.noEmit', !dryEv.some((e) => e.type === 'playerFire'));

const canH = harness({ hullKind: 'living', weaponGroup: 1, power: 80 });
step(canH, 1);
const canExpect = Math.min(POWER.max, 80 + POWER.regenPerSec / 60);
pin('cannon.heatOnly', canH.ctx.player.heat === 4 && countBolts(canH.scene, ENERGY_HEX) === 1);
pin('cannon.noPowerSpend', Math.abs(canH.ctx.player.power - canExpect) < 1e-9, String(canH.ctx.player.power));

const rmH = harness({ hullKind: 'living', weaponGroup: 5, reducedMotion: true, power: 100 });
step(rmH, 1);
pin('reduced.psiSpends', countBolts(rmH.scene, PSI_HEX) === 1 && Math.abs(rmH.ctx.player.power - 90) < 1e-9);

while (hudRoot.children.length) hudRoot.children.pop();
{
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 5000);
  const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {} };
  const ctx = createCtx({ scene, camera, renderer });
  ctx.player = createShipState('light', { name: 'hud' });
  ctx.player.hullKind = 'living';
  ctx.ship.object = new THREE.Object3D();
  ctx.world.mystery = { found: [], charted: [], visited: [] };
  ctx.world.currentSystem = 'freehold';
  ctx.station = { inZone: false };
  const hud = initHud(ctx);
  hud.update(0.21);
  const side = findClass(hudRoot, 'rw-side-col');
  const pwrPanel = findClass(hudRoot, 'rw-power-panel');
  const pwrRow = findClass(hudRoot, 'rw-power');
  const reticle = findClass(hudRoot, 'rw-reticle');
  const lead = findClass(hudRoot, 'rw-lead');
  pin('hud.live.sideCol', !!side);
  pin('hud.live.pwrInSide', !!(pwrPanel && side && pwrPanel.parent === side));
  pin('hud.live.pwrLabel', !!(pwrRow && collectText(pwrRow).some((t) => t === 'PWR')));
  pin('hud.live.barReads', !!(pwrRow && findClass(pwrRow, 'rw-bar-fill')
    && findClass(pwrRow, 'rw-bar-fill').style.width === '100%'));
  pin('hud.live.aimNoPwr', !collectText(reticle || makeEl()).includes('PWR')
    && !collectText(lead || makeEl()).includes('PWR'));
  ctx.player.power = 25;
  hud.update(0.21);
  pin('hud.live.barUpdates', findClass(pwrRow, 'rw-bar-fill').style.width === '25%');
}

if (fails.length) {
  console.log('WAVE94 POWER FAIL');
  for (const f of fails) console.log('  FAIL', f);
  process.exitCode = 1;
} else {
  console.log('WAVE94 POWER PASS', {
    max: POWER.max,
    regen: POWER.regenPerSec,
    psi: WEAPONS.psionic.powerPerShot,
  });
}
