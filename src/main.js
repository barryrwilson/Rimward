import * as THREE from 'three';
import { createCtx } from './core/ctx.js';

// Presentation systems
import { initTitle } from './systems/title.js';
import { initStarfield } from './systems/starfield.js';
import { initSolarSystem } from './systems/solarsystem.js';
import { initAsteroids } from './systems/asteroids.js';
import { initStation } from './systems/station.js';
import { initLandmarks } from './systems/landmarks.js';
import { initShip } from './systems/ship.js';
import { initHail } from './systems/hail.js';
import { initHud } from './systems/hud.js';
import { initSong } from './systems/song.js';
import { initModelsBrowser } from './systems/modelsbrowser.js';
import { configureShipAssets } from './systems/ship-assets.js';
import { applyShipLighting, applyShipToneMapping } from './systems/ship-lighting.js';

// Input + simulation systems
import { initControls } from './systems/controls.js';
import { decodeKeyCode } from './systems/key-code.js';
import { overlayIsOpen, settingsOwnsScreen, titleOwnsScreen } from './systems/overlay-policy.js';
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
import { initNav } from './game/nav.js';
import { initAutopilot } from './game/autopilot.js';
import { initAutomine } from './game/automine.js';
import { initAgentFlee } from './game/agent-flee.js';
import { initSave } from './game/save.js';
import { initSettings } from './systems/settings.js';
import { initOrigins } from './game/origins.js';
import { initOnboarding } from './systems/onboarding.js';
import { initGalaxyChart } from './systems/galaxychart.js';
import { initAgentApi } from './systems/agent-api.js';
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
applyShipToneMapping(renderer);
document.getElementById('app').appendChild(renderer.domElement);
configureShipAssets(renderer);

const scene = new THREE.Scene();
applyShipLighting(renderer, scene);
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
// live); autopilot after controls and before ship (command channel, no mesh);
// automine after autopilot and before ship (command channel, no mesh);
// nav after jump (same-frame systemLoaded for route recalc) and
// before or with the galaxy chart; origins after save (ctx.flags.saveRestored
// is final — a restore means no origin pick); onboarding after origins,
// before HUD; galaxy chart after onboarding, before HUD (DOM-only overlay,
// reads SYSTEMS + ctx.world.currentSystem live); models browser after galaxy chart, before
// HUD (DOM + own-renderer overlay, owns its own render loop and pause
// save/restore, reached lazily through ctx.models at click time); agent-api
// after hail/save/chart (and models), before HUD so it harvests this-frame
// ctx.events into ctx.agent.events; HUD remains last consumer of the live
// queue. wakes after npc + pods (reads ctx.ships flee modes, spawns discovery
// pods), before HUD (consumes its events); title runs FIRST so its capture-phase
// keydown listener registers before controls.js and origins.js, and it
// pauses the sim until the player chooses Continue or New Game.
const systems = [
  initTitle,
  initStarfield,
  initSolarSystem,
  initAsteroids,
  initStation,
  initLandmarks,
  initGate,
  initControls,
  initAutopilot,
  initAutomine,
  initAgentFlee,
  initSettings,
  initBio,
  initShip,
  initWorld,
  initContacts,
  initMystery,
  initEpics,
  initJump,
  initNav,
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
  initModelsBrowser,
  initAgentApi,
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
  // KeyP pause is the only full-loop skip. Berth hold (ctx.flags.berthHold)
  // is not pause — readers freeze flight/gate/jump/AP/player DPS; this loop still runs.
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
pauseEl.setAttribute('role', 'dialog');
pauseEl.setAttribute('aria-label', 'Paused');
pauseEl.style.cssText =
  'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
  'color:#6ff2e0;font:18px monospace;background:rgba(0,0,8,.45);z-index:50;' +
  'pointer-events:none;';

const pausePanel = document.createElement('div');
pausePanel.style.cssText =
  'pointer-events:none;display:flex;flex-direction:column;align-items:stretch;' +
  'gap:10px;min-width:280px;max-width:92vw;padding:22px 24px;' +
  'background:rgba(0,0,8,.55);border:1px solid rgba(111,242,224,.35);';
pauseEl.appendChild(pausePanel);

const pauseHeading = document.createElement('div');
pauseHeading.textContent = 'PAUSED';
pauseHeading.style.cssText =
  'text-align:center;letter-spacing:.3em;font-size:18px;margin-bottom:2px;';
pausePanel.appendChild(pauseHeading);

const pauseLegend = document.createElement('div');
pauseLegend.textContent = 'P to resume';
pauseLegend.style.cssText =
  'text-align:center;letter-spacing:.12em;font-size:13px;color:#9fd9d0;margin-bottom:8px;';
pausePanel.appendChild(pauseLegend);

const PAUSE_ACTIONS = Object.freeze(['resume', 'settings', 'berth', 'title']);
function addPauseButton(id, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-pause-action', id);
  btn.textContent = label;
  btn.style.cssText =
    'min-height:44px;min-width:44px;width:100%;padding:12px 16px;cursor:pointer;' +
    'font:16px monospace;letter-spacing:.12em;color:#6ff2e0;background:#0a1418;' +
    'border:1px solid rgba(111,242,224,.55);text-transform:uppercase;';
  btn.addEventListener('focus', () => {
    btn.style.outline = '2px solid #6ff2e0';
    btn.style.outlineOffset = '2px';
  });
  btn.addEventListener('blur', () => {
    btn.style.outline = 'none';
  });
  btn.addEventListener('click', (e) => {
    try { e.stopPropagation?.(); } catch { /* ignore */ }
    runPauseAction(id);
  });
  pausePanel.appendChild(btn);
}
addPauseButton('resume', 'RESUME');
addPauseButton('settings', 'SETTINGS');
addPauseButton('berth', 'BERTH RECORDS');
addPauseButton('title', 'TITLE');
document.body.appendChild(pauseEl);

function pauseCovered() {
  try {
    if (titleOwnsScreen()) return true;
    if (overlayIsOpen(ctx, 'berth')) return true;
    if (settingsOwnsScreen()) return true;
    return false;
  } catch {
    return false;
  }
}

function syncPauseCover() {
  try {
    const showing = ctx.flags.paused === true && pauseEl.style.display !== 'none';
    const hits = showing && !pauseCovered();
    pauseEl.style.pointerEvents = hits ? 'auto' : 'none';
    pausePanel.style.pointerEvents = hits ? 'auto' : 'none';
  } catch { /* never throw from pause paint */ }
}

function setPaused(next) {
  try {
    if (!ctx.flags) return;
    ctx.flags.paused = next === true;
    let titleOn = false;
    try { titleOn = !!document.getElementById('rw-title') || titleOwnsScreen(); } catch { titleOn = false; }
    if (ctx.flags.paused && !titleOn) pauseEl.style.display = 'flex';
    else pauseEl.style.display = 'none';
    syncPauseCover();
    try { ctx.berthApi?.syncPausedLoad?.(); } catch { /* berth LOAD text is optional */ }
  } catch { /* never throw from pause paint */ }
}
ctx.setPaused = setPaused;

function runPauseAction(id) {
  try {
    if (typeof id !== 'string') return;
    if (id === '__proto__' || id === 'prototype' || id === 'constructor') return;
    let known = false;
    for (let i = 0; i < PAUSE_ACTIONS.length; i++) {
      if (PAUSE_ACTIONS[i] === id) known = true;
    }
    if (!known) return;
    if (pauseCovered()) return;
    if (id === 'resume') {
      setPaused(false);
      return;
    }
    if (id === 'settings') {
      try {
        if (!settingsOwnsScreen() && globalThis.KeyboardEvent) {
          const event = new KeyboardEvent('keydown', { code: 'KeyO' });
          globalThis.window.dispatchEvent(event);
        }
      } catch { /* skip settings open */ }
      syncPauseCover();
      return;
    }
    if (id === 'berth') {
      try { ctx.berthApi?.openFromPause?.(); } catch { /* mutex skip */ }
      syncPauseCover();
      return;
    }
    if (id === 'title') {
      try { ctx.berthApi?.closeIfOpen?.(); } catch { /* close is best-effort */ }
      try { ctx.titleApi?.openFromPause?.(); } catch { /* remount skip */ }
      try {
        if (document.getElementById('rw-title') && ctx.flags.paused) {
          pauseEl.style.display = 'none';
        }
      } catch { /* hide chrome only when title owns */ }
      syncPauseCover();
    }
  } catch { /* unknown / throw → skip; do not unpause */ }
}

window.addEventListener('keydown', (e) => {
  try {
    const code = decodeKeyCode(e);
    if (code === 'KeyP') {
      // The models filter is an INPUT. Typing "Lamp" sends KeyP, which used to
      // unpause the title sim and spawn unprimed traffic (independent:cutter:pirate).
      const focus = document.activeElement;
      const typing = !!focus && (
        focus.tagName === 'INPUT' || focus.tagName === 'TEXTAREA' ||
        focus.tagName === 'SELECT' || focus.isContentEditable
      );
      if (typing || ctx.models?.isOpen?.() || document.getElementById('rw-title')) return;
      setPaused(!ctx.flags.paused);
      return;
    }
    if (code === 'KeyO' || code === 'Escape' || code === 'KeyL') {
      syncPauseCover();
    }
  } catch { /* never throw from pause keys */ }
});

// Fatal trap (index.html): errors after this flag are mid-session, not startup.
window.__rimwardBooted = true;
