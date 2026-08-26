/**
 * CTL-04 PR1 skip-formula probe. Does not import controls.js (DOM/three).
 * Mirrors shouldSkipWeaponGroupDigits from out/w124/menuinput/shared-contract.md.
 */
function shouldSkipWeaponGroupDigits(ctx, helpers = {}) {
  const hailDigitsAllowed = helpers.hailDigitsAllowed;
  const playSurfaceBlocked = helpers.playSurfaceBlocked;
  const settingsOwnsScreen = helpers.settingsOwnsScreen;
  const shouldSkipDockPulse = helpers.shouldSkipDockPulse || (() => false);
  try {
    const f = ctx && ctx.flags;
    if (f && f.docked === true) return true;
    if (f && f.hailOpen === true) return true;
    try {
      if (typeof hailDigitsAllowed === 'function' && hailDigitsAllowed(ctx) === false) return true;
    } catch { /* helper miss */ }
    try {
      if (typeof playSurfaceBlocked === 'function' && playSurfaceBlocked(ctx) === true) return true;
    } catch { /* */ }
    try {
      if (typeof settingsOwnsScreen === 'function' && settingsOwnsScreen() === true) return true;
    } catch { /* */ }
    if (f && (f.paused === true || f.chartOpen === true || f.berthOpen === true)) return true;
    if (shouldSkipDockPulse(ctx)) return true;
    return false;
  } catch {
    return !!(ctx && ctx.flags && ctx.flags.docked === true);
  }
}

const none = {};
const cases = [
  ['open space no flags', { flags: {} }, none, false],
  ['missing flags', {}, none, false],
  ['null ctx', null, none, false],
  ['docked true', { flags: { docked: true } }, none, true],
  ['docked string', { flags: { docked: 'true' } }, none, false],
  ['hailOpen true', { flags: { hailOpen: true } }, none, true],
  ['paused true', { flags: { paused: true } }, none, true],
  ['chartOpen true', { flags: { chartOpen: true } }, none, true],
  ['berthOpen true', { flags: { berthOpen: true } }, none, true],
  ['hailDigitsAllowed false', { flags: {} }, { hailDigitsAllowed: () => false }, true],
  ['hailDigitsAllowed true', { flags: {} }, { hailDigitsAllowed: () => true }, false],
  ['hailDigitsAllowed throw', { flags: {} }, { hailDigitsAllowed: () => { throw new Error('x'); } }, false],
  ['playSurfaceBlocked true', { flags: {} }, { playSurfaceBlocked: () => true }, true],
  ['settingsOwnsScreen true', { flags: {} }, { settingsOwnsScreen: () => true }, true],
  ['shouldSkipDockPulse true', { flags: {} }, { shouldSkipDockPulse: () => true }, true],
  ['helper throw + docked', { flags: { docked: true } }, { hailDigitsAllowed: () => { throw new Error('x'); } }, true],
  ['outer throw via pulse', { flags: {} }, { shouldSkipDockPulse: () => { throw new Error('x'); } }, false],
  ['outer throw + docked', { flags: { docked: true } }, { shouldSkipDockPulse: () => { throw new Error('x'); } }, true],
];

let fail = 0;
for (const [name, ctx, helpers, expect] of cases) {
  const got = shouldSkipWeaponGroupDigits(ctx, helpers);
  const ok = got === expect;
  if (!ok) fail++;
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}: got=${got} expect=${expect}`);
}

if (fail) {
  console.log(`FORMULA PROBE FAIL ${fail}`);
  process.exit(1);
}
console.log('FORMULA PROBE OK');
