/**
 * Paused-input behavior test (issue #47).
 *
 * Verifies src/systems/controls.js ignores gameplay commands entered while
 * ctx.flags.paused: no buffered edge pulses (the live repro was P -> C -> P
 * cycling the camera after resume), no double-tap F full stop, no weapon
 * group writes (stock digits and rebound non-digit codes). Also pins the
 * preserved contracts: keyup cleanup stays unconditional (no stuck holds on
 * resume), a pending edge captured before the pause still publishes after
 * resume, pause/menu keys keep propagating to their own window listeners,
 * commands work normally after resume, and the agentPulse / agentSetWeaponGroup
 * contract is unchanged.
 *
 * Run: npm run test:paused-input
 * (node --import ./scripts/with-css-stub.mjs scripts/paused-input-test.mjs)
 */

// --- Minimal window/document harness (node has no KeyboardEvent). ----------
const winListeners = {};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener(type, fn) { (winListeners[type] ??= []).push(fn); },
  removeEventListener(type, fn) {
    const a = winListeners[type];
    if (!a) return;
    const i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  },
};
globalThis.document = {
  getElementById() { return null; },
  activeElement: null,
  body: { children: [] },
};

const { initControls, agentPulse, agentSetWeaponGroup, rebuildTrackedFromBindings } =
  await import('../src/systems/controls.js');

let fails = 0;
function pin(name, ok) {
  if (ok) {
    console.log(`ok — ${name}`);
  } else {
    fails += 1;
    console.error(`FAIL — ${name}`);
  }
}

/** Dispatch like the browser: listeners in order until stopPropagation. */
function dispatch(type, ev) {
  ev.defaultPrevented = false;
  let stopped = false;
  if (!ev.preventDefault) ev.preventDefault = function () { this.defaultPrevented = true; };
  if (!ev.stopPropagation) ev.stopPropagation = function () { stopped = true; };
  for (const fn of winListeners[type] || []) {
    if (stopped) break;
    fn(ev);
  }
  return ev;
}
const keydown = (code) => dispatch('keydown', { code, repeat: false });
const keyup = (code) => dispatch('keyup', { code });

function makeCtx() {
  return {
    input: { throttle: 0.5, fullStop: false, weaponGroup: 1 },
    config: { controls: [] },
    flags: {
      paused: false,
      camera: 'chase',
      firstPerson: false,
      docked: false,
      hailOpen: false,
      chartOpen: false,
      berthOpen: false,
    },
    settings: { bindings: {} },
    targets: { current: null, part: null, reticleScreen: { x: 0, y: 0 } },
    lastEvents: [],
    ship: null,
    emit() {},
  };
}

const ctx = makeCtx();
const controls = initControls(ctx);
const DT = 0.1; // s; throttle ramp is 0.5 setpoint/s

// Marker listener standing in for the orchestrator's pause/menu listeners
// (main.js owns KeyP directly): proves controls never stops propagation.
const seenByMarker = [];
window.addEventListener('keydown', (e) => { seenByMarker.push(e.code); });

// --- 1. Baseline: unpaused camera edge works --------------------------------
keydown('KeyC');
keyup('KeyC');
controls.update(DT);
pin('unpaused C pulses cameraPressed', ctx.input.cameraPressed === true);
pin('unpaused C cycles chase -> third', ctx.flags.camera === 'third');
controls.update(DT);
pin('cameraPressed is one frame', ctx.input.cameraPressed === false);
ctx.flags.camera = 'chase';
ctx.flags.firstPerson = false;

// --- 2. Paused: gameplay edges are not buffered (live repro P -> C -> P) ----
ctx.flags.paused = true;
const spaceEv = keydown('Space');
keyup('Space');
keydown('KeyC');
keyup('KeyC');
keydown('KeyT');
keyup('KeyT');
ctx.flags.paused = false;
controls.update(DT); // first frame after resume
pin('paused C does not pulse cameraPressed', ctx.input.cameraPressed === false);
pin('paused C does not change camera', ctx.flags.camera === 'chase');
pin('paused T does not pulse targetPressed', ctx.input.targetPressed === false);
pin('paused Space does not pulse afterburnerPressed', ctx.input.afterburnerPressed === false);
pin('paused Space still preventDefault (page-scroll swallow kept)', spaceEv.defaultPrevented === true);

// --- 3. Paused: double-tap F writes no throttle/fullStop ---------------------
ctx.input.throttle = 0.6;
ctx.input.fullStop = false;
ctx.flags.paused = true;
keydown('KeyF');
keyup('KeyF');
keydown('KeyF'); // inside the 350 ms double-tap window
keyup('KeyF');
pin('paused double-tap F keeps throttle', ctx.input.throttle === 0.6);
pin('paused double-tap F keeps fullStop false', ctx.input.fullStop === false);
ctx.flags.paused = false;
controls.update(DT);
pin('after resume F taps still leave throttle alone', ctx.input.throttle === 0.6);

// Throttle ramp and full stop still work after resume.
keydown('KeyF');
controls.update(DT);
keyup('KeyF');
pin('held F ramps throttle down after resume', Math.abs(ctx.input.throttle - 0.55) < 1e-9);
keydown('KeyF');
keyup('KeyF');
keydown('KeyF');
keyup('KeyF');
pin('double-tap F after resume commands full stop', ctx.input.throttle === 0 && ctx.input.fullStop === true);
keydown('KeyR');
controls.update(DT);
pin('held R cancels full stop and ramps up', ctx.input.fullStop === false && Math.abs(ctx.input.throttle - 0.05) < 1e-9);
keyup('KeyR');

// --- 4. Paused: weapon group writes gated (digits and rebound codes) ---------
ctx.input.weaponGroup = 1;
ctx.flags.paused = true;
keydown('Digit2');
keyup('Digit2');
pin('paused Digit2 keeps weaponGroup', ctx.input.weaponGroup === 1);
ctx.flags.paused = false;
keydown('Digit2');
keyup('Digit2');
pin('unpaused Digit2 sets weaponGroup 2', ctx.input.weaponGroup === 2);

// Rebound non-digit weapon group bypassed the old digit-only guard.
ctx.settings.bindings = { wpn3: 'KeyU' };
rebuildTrackedFromBindings(ctx);
ctx.flags.paused = true;
keydown('KeyU');
keyup('KeyU');
pin('paused rebound KeyU keeps weaponGroup', ctx.input.weaponGroup === 2);
ctx.flags.paused = false;
keydown('KeyU');
keyup('KeyU');
pin('unpaused rebound KeyU sets weaponGroup 3', ctx.input.weaponGroup === 3);
ctx.settings.bindings = {};
rebuildTrackedFromBindings(ctx);

// --- 5. Key released while paused is not stuck on resume ----------------------
ctx.input.throttle = 0.5;
ctx.input.fullStop = false;
keydown('KeyR'); // held before the pause
controls.update(DT);
const beforePause = ctx.input.throttle;
pin('held R ramped before pause', Math.abs(beforePause - 0.55) < 1e-9);
ctx.flags.paused = true;
keyup('KeyR'); // released while paused — unconditional cleanup
ctx.flags.paused = false;
controls.update(DT);
pin('released-during-pause R does not keep ramping', ctx.input.throttle === beforePause);
pin('released-during-pause R clears throttleHeld', ctx.input.throttleHeld === false);

// Mirror: pressed AND held across the resume — entered while paused, ignored.
ctx.flags.paused = true;
keydown('KeyR');
ctx.flags.paused = false;
controls.update(DT); // KeyR still physically held
pin('pressed-during-pause R does not ramp on resume', ctx.input.throttle === beforePause);
pin('pressed-during-pause R leaves throttleHeld false', ctx.input.throttleHeld === false);
keyup('KeyR');
keydown('KeyR'); // fresh press after resume works
controls.update(DT);
keyup('KeyR');
pin('fresh R press after resume ramps again', Math.abs(ctx.input.throttle - (beforePause + 0.05)) < 1e-9);

// --- 6. Edge captured before the pause survives resume ------------------------
ctx.flags.camera = 'chase';
ctx.flags.firstPerson = false;
keydown('KeyC');
keyup('KeyC'); // pendingCamera set while live
ctx.flags.paused = true; // loop freezes before the next update
ctx.flags.paused = false;
controls.update(DT);
pin('pre-pause camera edge still publishes after resume', ctx.input.cameraPressed === true);
pin('pre-pause camera edge still cycles after resume', ctx.flags.camera === 'third');
ctx.flags.camera = 'chase';
ctx.flags.firstPerson = false;

// --- 7. Pause/menu keys and tracked keys keep propagating ---------------------
seenByMarker.length = 0;
ctx.flags.paused = true;
keydown('KeyP'); // orchestrator-owned pause toggle
keyup('KeyP');
keydown('KeyC');
keyup('KeyC');
ctx.flags.paused = false;
pin('KeyP reaches later listeners while paused', seenByMarker.includes('KeyP'));
pin('tracked KeyC reaches later listeners while paused', seenByMarker.includes('KeyC'));
controls.update(DT);
pin('KeyP while paused writes no gameplay input', ctx.input.cameraPressed === false && ctx.flags.camera === 'chase');

// --- 8. Agent pulse / weapon contract unchanged --------------------------------
pin('agentPulse afterburner accepted', agentPulse(ctx, 'afterburner') === '');
controls.update(DT);
pin('agentPulse publishes one frame', ctx.input.afterburnerPressed === true);
controls.update(DT);
pin('agentPulse edge clears next frame', ctx.input.afterburnerPressed === false);
pin('agentPulse unknown edge refused', agentPulse(ctx, 'warp') === 'unknown');

ctx.flags.paused = true;
ctx.input.weaponGroup = 3;
pin('agentSetWeaponGroup paused returns no-service', agentSetWeaponGroup(ctx, 4) === 'no-service');
pin('agentSetWeaponGroup paused does not write', ctx.input.weaponGroup === 3);
ctx.flags.paused = false;
pin('agentSetWeaponGroup live returns empty token', agentSetWeaponGroup(ctx, 4) === '');
pin('agentSetWeaponGroup live writes', ctx.input.weaponGroup === 4);
pin('agentSetWeaponGroup bad n refused', agentSetWeaponGroup(ctx, 9) === 'bad-qty');

if (fails === 0) {
  console.log('PAUSED INPUT OK');
  process.exit(0);
}
console.log(`PAUSED INPUT FAIL — ${fails}`);
process.exit(1);
