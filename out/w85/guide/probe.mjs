import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SYSTEMS } from '../../../src/game/state.js';
import {
  readNavGuidance, resolveAuthoredNavGate, formatNavDist, navSystemName,
  emptyNavRaycast, initNavGuidance,
} from '../../../src/systems/nav-guidance.js';
import * as THREE from 'three';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');
const hudSrc = src('src/systems/hud.js');
const cssSrc = src('src/ui/hud.css');
const guideSrc = src('src/systems/nav-guidance.js');
const bootSrc = src('scripts/boot-test.mjs');

const readoutExists = hudSrc.includes("el('section', 'rw-panel rw-nav-readout rw-aux is-hidden', sideCol)");
const abovePos = hudSrc.indexOf('rw-nav-readout') < hudSrc.indexOf("el('section', 'rw-panel rw-pos rw-fade', sideCol)");
const cap180 = cssSrc.includes('.rw-nav-readout') && cssSrc.includes('max-width: 180px') && cssSrc.includes('min-width: 0');
const hideDocked = hudSrc.includes('ctx.flags.docked') && hudSrc.includes('ctx.gate.jumping') && hudSrc.includes('navPark');
const noHopNeed = !guideSrc.includes('hopIndex') && !hudSrc.includes('hopIndex');
const nextFromPath1 = guideSrc.includes('path[1]');
const noInner = !hudSrc.includes('innerHTML') && !guideSrc.includes('innerHTML');
const noTgtWrite = !hudSrc.includes('targets.current =') && !guideSrc.includes('targets.current =');
const cueDistinct = hudSrc.includes('rw-nav-gate-cue')
  && cssSrc.includes('.rw-nav-gate-cue')
  && !cssSrc.includes('.rw-nav-gate-cue.rw-edge-arrow');
const markerRay = guideSrc.includes('function emptyNavRaycast') && guideSrc.includes('o.raycast = emptyNavRaycast');
const reducedStatic = guideSrc.includes('reducedMotion') && guideSrc.includes('mesh.rotation.z = 0')
  && !cssSrc.includes('@keyframes rw-nav');
const noRouteCopy = hudSrc.includes("'NO ROUTE'");
const noGuidanceEmit = !hudSrc.includes("emit('navGuidance") && !guideSrc.includes("emit('navGuidance");
const noBagWrite = !guideSrc.includes('world.nav =') && !hudSrc.includes('world.nav =');
const auxCombat = cssSrc.includes('#hud.in-combat .rw-aux { opacity: 0.38; }');
const liveRegion = hudSrc.includes("navLive.setAttribute('role', 'status')")
  && hudSrc.includes("navLive.setAttribute('aria-live', 'polite')")
  && hudSrc.includes("navReadout.setAttribute('aria-live', 'off')")
  && hudSrc.includes("navReadout.setAttribute('aria-atomic', 'false')")
  && !hudSrc.includes("navReadout.setAttribute('role', 'status')")
  && hudSrc.includes('rw-nav-readout-dist');
const bootPins = bootSrc.includes('WAVE85 NAV guidance') && bootSrc.includes('wave85 nav guidance:');
const noKeyframesCue = !cssSrc.includes('@keyframes') || !/rw-nav-gate-cue[\s\S]{0,400}@keyframes/.test(cssSrc);

const plotted = readNavGuidance({
  world: {
    currentSystem: 'freehold',
    nav: {
      dest: 'vd_survey',
      path: ['freehold', 'veridian', 'vd_survey'],
      remaining: 2,
      status: 'plotted',
    },
  },
});
const nextIsPath1 = plotted.kind === 'plotted'
  && plotted.nextId === 'veridian'
  && plotted.nextName === SYSTEMS.veridian.name
  && plotted.destName === SYSTEMS.vd_survey.name
  && plotted.remaining === 2;

const noHopBag = readNavGuidance({
  world: {
    currentSystem: 'freehold',
    nav: { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted' },
  },
});
const hopIndexNotRequired = noHopBag.kind === 'plotted' && noHopBag.nextId === 'veridian';

const blocked = readNavGuidance({
  world: { currentSystem: 'freehold', nav: { dest: 'veridian', path: [], remaining: 0, status: 'blocked' } },
});
const blockedOk = blocked.kind === 'blocked' && !blocked.pos && blocked.destName === SYSTEMS.veridian.name;

const stuffed = readNavGuidance({
  world: {
    currentSystem: 'freehold',
    nav: { dest: 'veridian', path: ['freehold', '__proto__'], remaining: 1, status: 'plotted' },
  },
});
const stuffedHide = stuffed.kind !== 'plotted' && !stuffed.pos;

const unknown = readNavGuidance({
  world: {
    currentSystem: 'freehold',
    nav: { dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'recalc' },
  },
});
const unknownHide = unknown.kind === 'omit';

const reservedDest = navSystemName('constructor') === '' && navSystemName('__proto__') === '';

const phys = resolveAuthoredNavGate({ world: { currentSystem: 'freehold' } }, 'veridian');
const hub = resolveAuthoredNavGate({ world: { currentSystem: 'freehold' } }, 'fh_hearth');
const physPos = !!phys && phys.x === 0 && phys.y === 60 && phys.z === -900;
const hubPos = !!hub && hub.x === 120 && hub.y === 70 && hub.z === -820;
const none = resolveAuthoredNavGate({ world: { currentSystem: 'freehold' } }, 'vd_survey');
const noMatch = none === null;

const distAbbrev = formatNavDist(1500) === '1.5k' && formatNavDist(42) === '42u';

const scene = new THREE.Scene();
const ships = [];
const api = initNavGuidance({ scene, ships, world: { currentSystem: 'freehold' }, settings: { reducedMotion: true } });
let marker = null;
scene.traverse((o) => { if (o.name === 'nav-gate-marker') marker = o; });
const markerNamed = !!marker;
const markerRayLive = !!marker && marker.raycast === emptyNavRaycast;
let ringRay = true;
if (marker) marker.traverse((o) => { if (o.raycast !== emptyNavRaycast) ringRay = false; });
const notInShips = !ships.includes(marker);
api.update(plotted, true, true, 0.16);
const staticUnderRm = marker && marker.children[0] && marker.children[0].rotation.z === 0
  && marker.children[0].scale.x === 1;
const glowCap = guideSrc.includes('RING_RADIUS + 3') && !guideSrc.includes('lockKind');

const w85g = {
  readoutExists,
  abovePos,
  cap180,
  hideDocked,
  noHopNeed,
  nextFromPath1,
  nextIsPath1,
  hopIndexNotRequired,
  noInner,
  noTgtWrite,
  cueDistinct,
  markerRay,
  markerNamed,
  markerRayLive,
  ringRay,
  notInShips,
  reducedStatic,
  staticUnderRm,
  noRouteCopy,
  blockedOk,
  stuffedHide,
  unknownHide,
  reservedDest,
  physPos,
  hubPos,
  noMatch,
  distAbbrev,
  noGuidanceEmit,
  noBagWrite,
  auxCombat,
  liveRegion,
  bootPins,
  noKeyframesCue,
  glowCap,
};
const failed = Object.keys(w85g).filter((k) => !w85g[k]);
if (failed.length) {
  console.log('WAVE85 GUIDANCE PROBE FAIL', failed.join(','));
  console.log(JSON.stringify(w85g));
  process.exit(1);
}
console.log('WAVE85 GUIDANCE PROBE PASS');
console.log(JSON.stringify(w85g));
