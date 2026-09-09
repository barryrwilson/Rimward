// Physical fire ownership regression. Uses the real controls listeners and update.
const listeners = {};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720,
  addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
};
globalThis.document = { body: { children: [] }, activeElement: null, getElementById() { return null; } };
const { initControls, rebuildTrackedFromBindings } = await import('../src/systems/controls.js');
const ctx = {
  input: { throttle: 0, weaponGroup: 1 }, config: { controls: [] }, flags: {},
  settings: { bindings: {} }, targets: { current: null, part: null, reticleScreen: {} },
  lastEvents: [], ship: null, emit() {}, settingsApi: { isOpen: () => settingsOpen },
  models: { isOpen: () => modelsOpen },
};
let settingsOpen = false, modelsOpen = false, fails = 0, checks = 0;
window.__ctx = ctx;
const controls = initControls(ctx);
const tick = () => controls.update(0.016);
const send = (type, ev = {}) => { for (const fn of listeners[type] ?? []) fn({ preventDefault() {}, ...ev }); };
const pin = (name, value) => { checks++; if (!value) { fails++; console.error('FAIL', name); } };
const owners = {
  docked: value => { ctx.flags.docked = value; },
  chart: value => { ctx.flags.chartOpen = value; },
  berth: value => { ctx.flags.berthOpen = value; ctx.flags.berthHold = value; },
  paused: value => { ctx.flags.paused = value; },
  settings: value => { settingsOpen = value; },
  models: value => { modelsOpen = value; },
  title: value => { document.body.children = value ? [{ id: 'rw-title' }] : []; },
  typing: value => { document.activeElement = value ? { tagName: 'INPUT' } : null; },
};
for (const binding of ['Mouse0', 'Mouse1', 'Mouse2', 'KeyZ']) {
  ctx.settings.bindings.fire = binding;
  rebuildTrackedFromBindings(ctx);
  const mouse = binding.startsWith('Mouse');
  const down = (repeat = false) => send(mouse ? 'mousedown' : 'keydown', mouse ? { button: Number(binding.at(-1)) } : { code: binding, repeat });
  const up = () => send(mouse ? 'mouseup' : 'keyup', mouse ? { button: Number(binding.at(-1)) } : { code: binding });
  for (const [owner, own] of Object.entries(owners)) {
    const name = `${binding}/${owner}`;
    down(); tick(); pin(`${name}: normal hold`, ctx.input.fireHeld === true);
    tick(); pin(`${name}: continued hold`, ctx.input.fireHeld === true);
    own(true); tick(); pin(`${name}: ownership clears fire`, ctx.input.fireHeld === false);
    own(false); tick(); pin(`${name}: close without release cannot rearm`, ctx.input.fireHeld === false);
    if (!mouse) { down(true); tick(); pin(`${name}: repeat cannot rearm`, ctx.input.fireHeld === false); }
    up(); down(); tick(); pin(`${name}: fresh press works`, ctx.input.fireHeld === true);
    own(true); up(); tick(); own(false); tick(); pin(`${name}: release under owner stays clear`, ctx.input.fireHeld === false);
    own(true); down(); own(false); tick(); pin(`${name}: press under owner cannot queue fire`, ctx.input.fireHeld === false);
    up();
  }
  down(); tick(); ctx.flags.hailOpen = true; tick();
  pin(`${binding}: incoming hail clears prior hold`, ctx.input.fireHeld === false);
  up(); down(); tick(); pin(`${binding}: fresh flight fire can break a hail demand`, ctx.input.fireHeld === true);
  up(); ctx.flags.hailOpen = false; tick(); pin(`${binding}: hail release stays clear`, ctx.input.fireHeld === false);
  down(); tick(); send('blur'); pin(`${binding}: blur clears synchronously`, ctx.input.fireHeld === false);
  tick(); pin(`${binding}: focus cannot rearm`, ctx.input.fireHeld === false);
  up(); down(); tick(); up(); tick(); pin(`${binding}: normal release`, ctx.input.fireHeld === false);
}
console.log(`FIRE HELD: ${checks - fails}/${checks} passed`);
if (fails) process.exitCode = 1;
