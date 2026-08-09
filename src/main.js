import * as THREE from 'three';
import { createCtx } from './core/ctx.js';

// Presentation systems
import { initStarfield } from './systems/starfield.js';
import { initSolarSystem } from './systems/solarsystem.js';
import { initAsteroids } from './systems/asteroids.js';
import { initStation } from './systems/station.js';
import { initLandmarks } from './systems/landmarks.js';
import { initShip } from './systems/ship.js';
import { initHail } from './systems/hail.js';
import { initHud } from './systems/hud.js';
import { initSong } from './systems/song.js';

// Input + simulation systems
import { initControls } from './systems/controls.js';
import { initBio } from './game/bio.js';
import { initWorld } from './game/world.js';
import { initContacts } from './game/contacts.js';
import { initMystery } from './game/mystery.js';
import { initEpics } from './game/epics.js';
import { initTraffic } from './game/traffic.js';
import { initNpc } from './systems/npc.js';
import { initCombat } from './systems/combat.js';
import { initPods } from './game/pods.js';
import { initGate } from './systems/gate.js';
import { initJump } from './game/jump.js';
import { initSave } from './game/save.js';
import { initSettings } from './systems/settings.js';
import { initOrigins } from './game/origins.js';
import { initOnboarding } from './systems/onboarding.js';
import { initGalaxyChart } from './systems/galaxychart.js';
import { initWakes } from './systems/wakes.js';
import { SYSTEMS } from './game/state.js';

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (err) {
  // MSAA context allocation can fail under GPU memory pressure (or a
  // half-crashed GPU process) even when a plain context would succeed —
  // retry once without antialiasing before declaring WebGL unavailable.
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false });
    console.warn('WebSim: antialiased WebGL context failed; running without MSAA.', err);
  } catch (err2) {
    window.__websimFatal?.(
      'WebGL is unavailable in this browser, so the sim cannot render.\n\n' +
        String(err2) +
        '\n\nCheck chrome://gpu — "WebGL" should say Hardware accelerated. If hardware acceleration is disabled (Settings → System), enable it and relaunch.',
    );
    throw err2;
  }
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  20000,
);

const ctx = createCtx({ scene, camera, renderer });
ctx.systems = SYSTEMS; // star system definitions (state.js), read-only
window.__ctx = ctx; // debug/test handle (read-only inspection + harness drives)

// Init order is load-bearing:
// backdrop → world furniture → input → bio state → player ship → persistent
// world → live traffic/AI → player weapons → pods → hail UI → audio → save
// (restores snapshots over live state) → HUD last so it sees every event.
// gate before world (zone checks read records' lane); jump after world
// (consumes jumpRequested same-frame, before traffic reacts); contacts
// right after world (roster seed before save.js restores over it); mystery
// right after contacts (lazy ctx.world.mystery default before save restore);
// epics after mystery (stage checks read mystery.found); settings right
// after controls (input registered; DOM-only, everyone reads ctx.settings
// live); origins after save (ctx.flags.saveRestored is final — a restore
// means no origin pick); onboarding after origins, before HUD; galaxy
// chart after onboarding, before HUD (DOM-only overlay, reads SYSTEMS +
// ctx.world.currentSystem live); wakes after npc + pods (reads ctx.ships
// flee modes, spawns discovery pods), before HUD (consumes its events).
const systems = [
  initStarfield,
  initSolarSystem,
  initAsteroids,
  initStation,
  initLandmarks,
  initGate,
  initControls,
  initSettings,
  initBio,
  initShip,
  initWorld,
  initContacts,
  initMystery,
  initEpics,
  initJump,
  initTraffic,
  initNpc,
  initCombat,
  initPods,
  initWakes,
  initHail,
  initSong,
  initSave,
  initOrigins,
  initOnboarding,
  initGalaxyChart,
  initHud,
].map((init) => init(ctx));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  ctx.elapsed += dt;
  if (!ctx.flags.paused) {
    ctx.world.time += dt;
    for (const system of systems) system?.update?.(dt, ctx);
  }
  ctx.lastEvents = ctx.events; // previous frame's queue, for early-system consumers
  ctx.events = [];             // fresh queue for this frame
  renderer.render(scene, camera);
});

// Pause is orchestrator-owned: a direct listener so it works while the
// system loop is frozen (controls.js doesn't run when paused).
const pauseEl = document.createElement('div');
pauseEl.style.cssText =
  'position:fixed;inset:0;display:none;align-items:center;justify-content:center;color:#6ff2e0;font:18px monospace;background:rgba(0,0,8,.45);z-index:50;letter-spacing:.3em;';
pauseEl.textContent = 'PAUSED — P to resume';
document.body.appendChild(pauseEl);
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP') {
    ctx.flags.paused = !ctx.flags.paused;
    pauseEl.style.display = ctx.flags.paused ? 'flex' : 'none';
  }
});
