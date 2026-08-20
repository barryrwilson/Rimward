// Wave 69 PR4 — AST-02 HUD/nav find-aid (arrival belt commLine + group-3 cue).
// node --import ./scripts/with-css-stub.mjs out/w69/pr4/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { createCtx } from '../../../src/core/ctx.js';
import { JUMP, SYSTEMS } from '../../../src/game/state.js';
import { arrivalBeltLine, initJump } from '../../../src/game/jump.js';
import { initHud } from '../../../src/systems/hud.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const jumpSrc = readFileSync(join(root, 'src/game/jump.js'), 'utf8');
const hudSrc = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');

pin('src.arrivalLines.kept', /const ARRIVAL_LINES = \[/.test(jumpSrc));
pin('src.arrivalLines.used', /ARRIVAL_LINES\[band\]/.test(jumpSrc));
pin('src.two.commLine', (jumpSrc.match(/ctx\.emit\('commLine'/g) || []).length === 2);
pin('src.belt.helper', /export function arrivalBeltLine/.test(jumpSrc));
pin('src.jump.noInnerHTML', !/innerHTML/.test(jumpSrc));
pin('src.hud.noInnerHTML', !/innerHTML/.test(hudSrc));
pin('src.hud.mineCue', /Mine · belt /.test(hudSrc));
pin('src.hud.weaponGroup3', /weaponGroup \| 0\) === 3/.test(hudSrc));
pin('src.hud.rockLock', /isRockTarget\(target\)/.test(hudSrc));
pin('src.hud.textContent', /promptVerb\.textContent = pVerb/.test(hudSrc));
pin('src.no.settingsKey', !/settings\.\w+\s*=/.test(hudSrc) && !/localStorage/.test(jumpSrc));
pin('src.no.newEvent', !/ctx\.emit\('(?!commLine|systemLoaded)[^']+'/.test(jumpSrc));
pin('src.no.mysteryWrite', !/mystery\.charted/.test(jumpSrc));

const fh = arrivalBeltLine(SYSTEMS.freehold);
const vg = arrivalBeltLine(SYSTEMS.verge);
const fhN = Math.round(Math.hypot(-450, -250));
const vgN = Math.round(Math.hypot(-300, -240));
pin('belt.fh.n', fh.text === 'Belt lies ' + fhN + ' u sun-relative, off the station.' && Number.isFinite(fhN), String(fhN));
pin('belt.vg.n', vg.text === 'Belt lies ' + vgN + ' u sun-relative, off the station.' && Number.isFinite(vgN), String(vgN));
pin('belt.from.echo', fh.from === 'Echo' && vg.from === 'Echo');
pin('belt.no.html', !/[<>]/.test(fh.text) && !/[<>]/.test(vg.text));
pin('belt.bad.field', arrivalBeltLine({}).text.includes(' 0 u ') && Number.isFinite(0));

function jumpCtx(fromId, toId) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 20000);
  const renderer = { domElement: { style: {} }, setSize() {}, setPixelRatio() {} };
  const ctx = createCtx({ scene, camera, renderer });
  ctx.world.currentSystem = fromId;
  ctx.ship.object = new THREE.Object3D();
  const jump = initJump(ctx);
  ctx.events.push({ type: 'jumpRequested', to: toId });
  jump.update(JUMP.chargeTime * 0.51);
  return ctx;
}

function commsOf(ctx) {
  return ctx.events.filter((e) => e.type === 'commLine');
}

const jumpFh = jumpCtx('veridian', 'freehold');
const commFh = commsOf(jumpFh);
pin('jump.two.lines', commFh.length === 2, 'n=' + commFh.length);
pin('jump.arrival.first', commFh[0] && commFh[0].from === 'gate' && typeof commFh[0].text === 'string' && commFh[0].text.indexOf('Freehold') !== -1);
pin('jump.belt.second', commFh[1] && commFh[1].from === 'Echo' && commFh[1].text === fh.text);
pin('jump.payload.only', commFh.every((e) => e.text && e.from && !('html' in e) && !/[<>]/.test(e.text)));
pin('jump.finite.n', /\d+/.test(commFh[1] && commFh[1].text) && Number.isFinite(fhN));

const jumpVg = jumpCtx('hush', 'verge');
const commVg = commsOf(jumpVg);
pin('jump.highband.two', commVg.length === 2, 'n=' + commVg.length);
pin('jump.highband.belt', commVg[1] && commVg[1].text === vg.text);

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
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); node.className = [...this._s].join(' '); },
      contains(c) { return this._s.has(c); },
    },
    appendChild(c) { c.parent = node; this.children.push(c); return c; },
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    offsetWidth: 168,
    offsetHeight: 120,
  };
  let className = '';
  Object.defineProperty(node, 'className', {
    get() { return className; },
    set(v) { className = String(v); node.classList._s = new Set(className.split(/\s+/).filter(Boolean)); },
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

const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const hudRoot = makeEl('div');
hudRoot.id = 'hud';
const head = makeEl('head');
globalThis.document = {
  head,
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  getElementById: (id) => (id === 'hud' ? hudRoot : null),
};
globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {}, removeEventListener() {} };

function hudCtx(extra = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1280 / 720, 0.1, 20000);
  const renderer = { domElement: makeEl('canvas'), setSize() {}, setPixelRatio() {} };
  const ctx = createCtx({ scene, camera, renderer });
  ctx.player = {
    faction: 'independent',
    hullKind: 'built',
    screen: 1, screenMax: 1, shell: 1, shellMax: 1,
    hull: 1, hullMax: 1, heat: 0, engine: 1, engineMax: 1,
  };
  ctx.world.mystery = { found: [], charted: [], visited: [] };
  ctx.world.currentSystem = 'freehold';
  ctx.station = { inZone: false };
  ctx.ship.object = new THREE.Object3D();
  ctx.ship.object.position.set(0, 0, 0);
  ctx.input.weaponGroup = extra.weaponGroup ?? 3;
  if (extra.stationIn) ctx.station.inZone = true;
  if (extra.gateIn) {
    ctx.gate.inZone = true;
    ctx.gate.nearTo = extra.nearTo || 'veridian';
  }
  if (extra.target) ctx.targets.current = extra.target;
  if (extra.rocks) ctx.asteroids = { list: extra.rocks };
  if (extra.shipPos) ctx.ship.object.position.set(extra.shipPos[0], extra.shipPos[1], extra.shipPos[2]);
  return ctx;
}

function runHud(extra) {
  while (hudRoot.children.length) hudRoot.children.pop();
  const ctx = hudCtx(extra);
  const h = initHud(ctx);
  h.update(0.21);
  const p = findClass(hudRoot, 'rw-prompt');
  const k = findClass(hudRoot, 'rw-prompt-key');
  const v = findClass(hudRoot, 'rw-prompt-verb');
  return {
    hidden: p.classList.contains('is-hidden'),
    key: k ? k.textContent : '',
    verb: v ? v.textContent : '',
  };
}

const mineEmpty = runHud({ weaponGroup: 3 });
pin('hud.g3.mine', !mineEmpty.hidden && /Mine/.test(mineEmpty.verb) && /\d+u/.test(mineEmpty.verb), mineEmpty.verb);
pin('hud.g3.finite', Number.isFinite(Number((mineEmpty.verb.match(/(\d+)u/) || [])[1])));

const g1 = runHud({ weaponGroup: 1 });
pin('hud.g1.noMine', g1.hidden || !/Mine/.test(g1.verb), g1.verb);

const dock = runHud({ weaponGroup: 3, stationIn: true });
pin('hud.dock.wins', dock.verb === 'Dock' && !/Mine/.test(dock.verb), dock.verb);

const jmp = runHud({ weaponGroup: 3, gateIn: true });
pin('hud.jump.wins', /Jump/.test(jmp.verb) && !/Mine/.test(jmp.verb), jmp.verb);

const rock = {
  position: new THREE.Vector3(12, 0, 0),
  ore: 4,
  id: 0,
};
const rockLock = runHud({ weaponGroup: 3, target: rock });
pin('hud.rock.noMine', rockLock.hidden || !/Mine/.test(rockLock.verb), rockLock.verb);

const workNear = new THREE.Vector3(40, 0, 0);
const farOre = new THREE.Vector3(5, 0, 0);
const rocks = [];
for (let i = 0; i < 10; i++) {
  rocks.push({
    id: i,
    position: i === 0 ? workNear.clone() : (i === 9 ? farOre.clone() : new THREE.Vector3(80, 0, i)),
    ore: i === 9 || i === 0 ? 3 : 0,
  });
}
const workCue = runHud({ weaponGroup: 3, rocks, shipPos: [0, 0, 0] });
pin('hud.work.sector', workCue.verb === 'Mine · belt 40u', workCue.verb);

const onlyFar = rocks.map((r, i) => ({ ...r, ore: i === 9 ? 3 : 0, position: r.position.clone() }));
const fallbackOre = runHud({ weaponGroup: 3, rocks: onlyFar, shipPos: [0, 0, 0] });
pin('hud.ore.fallback', fallbackOre.verb === 'Mine · belt 5u', fallbackOre.verb);

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
